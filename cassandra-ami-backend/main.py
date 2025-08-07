# 1. Imports
from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from packer_runner import build_ami_with_profile
from packer_template import generate_packer_template
from fetch_python import fetch_ubuntu_python_versions, fetch_non_eol_python_versions
import subprocess
import uuid
import os
import json
import re

# 2. Load static config
with open("os_user_meta.json") as f:
    OS_USER_META = json.load(f)

# 3. FastAPI app and middleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/supported-python-versions")
def get_supported_python_versions(os_name: str):
    if os_name == "Ubuntu LTS 22.04":
        return fetch_ubuntu_python_versions("jammy")
    elif os_name == "Ubuntu LTS 20.04":
        return fetch_ubuntu_python_versions("focal")
    elif os_name == "Ubuntu LTS 24.04":
        return fetch_ubuntu_python_versions("noble")
    elif os_name == "Debian 12":
        return fetch_ubuntu_python_versions("bookworm")
    elif os_name == "Debian 11":
        return fetch_ubuntu_python_versions("bullseye")
    elif os_name == "Fedora 39":
        return fetch_non_eol_python_versions()
    else:
        return fetch_non_eol_python_versions()

# 4. Pydantic models
class AMIConfig(BaseModel):
    os: str
    cassandra_version: str
    java_distribution: str
    java_version: str
    python_version: str
    tools: list
    aws_profile: str = "default"  # Optional: allow frontend to specify profile

# 5. Helper functions
def parse_ami_id(output):
    match = re.search(r'ami-[0-9a-fA-F]{8,17}', output)
    if match:
        return match.group(0)
    return None

# 6. Endpoints
@app.post("/generate-ami")
async def generate_ami(config: AMIConfig):
    template_filename = f"packer_{uuid.uuid4().hex}.pkr.hcl"
    packer_hcl = generate_packer_template(config.dict())
    print("Generated Packer HCL:", packer_hcl)
    with open(template_filename, "w") as f:
        f.write(packer_hcl)
        print(f"Template written to: {template_filename}")
    try:
        # Use dynamic AWS profile if provided
        aws_profile = config.aws_profile if hasattr(config, "aws_profile") else "default"
        result = build_ami_with_profile(template_filename, aws_profile=aws_profile)
        ami_id = parse_ami_id(result.stdout)
        return {"status": "success", "ami_id": ami_id}
    except Exception as e:
        error_output = getattr(e, 'stderr', '') if hasattr(e, 'stderr') else str(e)
        return {"status": "error", "output": error_output}
    finally:
        os.remove(template_filename)