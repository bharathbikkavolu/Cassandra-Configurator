# packer_template.py
import json
import os

with open(os.path.join(os.path.dirname(__file__), "os_user_meta.json")) as f:
    OS_USER_META = json.load(f)

def get_ami_filter_and_ssh(os_name):
    # Try to match the OS family (e.g., "Ubuntu" in "Ubuntu LTS 22.04")
    for family, meta in OS_USER_META.items():
        if os_name.startswith(family):
            return meta
    raise ValueError(f"Unsupported OS: {os_name}")

def get_java_package(java_distribution, java_version):
    # Expand for more distributions if needed
    if java_distribution in ["temurin", "openjdk"]:
        return f"openjdk-{java_version}-jdk"
    elif java_distribution == "corretto":
        return f"java-{java_version}-amazon-corretto"
    elif java_distribution == "zulu":
        return f"zulu{java_version}-jdk"
    else:
        return f"openjdk-{java_version}-jdk"

def get_python_package(python_version):
    return f"python{python_version}"

def get_cassandra_install_commands(cassandra_version):
    url = f"https://downloads.apache.org/cassandra/{cassandra_version}/apache-cassandra-{cassandra_version}-bin.tar.gz"
    return [
        f"wget {url}",
        f"tar -xzf apache-cassandra-{cassandra_version}-bin.tar.gz"
    ]

def get_tools_install_commands(tools):
    cmds = []
    if "backup" in tools:
        cmds.append("pip3 install medusa[ssh]")
    if "repairs" in tools:
        cmds.append("# TODO: Add Reaper installation commands here")
    return cmds

def generate_packer_template(config):
    os_info = get_ami_filter_and_ssh(config["os"])
    java_pkg = get_java_package(config["java_distribution"], config["java_version"])
    python_pkg = get_python_package(config["python_version"])
    cassandra_cmds = get_cassandra_install_commands(config["cassandra_version"])
    tools_cmds = get_tools_install_commands(config["tools"])
    
    package_manager = os_info.get("package_manager", "apt-get")
    # Build the inline shell commands list
    inline_cmds = [
        f"sudo {package_manager} update",
        f"sudo {package_manager} install -y {java_pkg} {python_pkg} python3-pip curl wget tar unzip systemd openssl"
    ] + cassandra_cmds + tools_cmds + [
    "# ... more install/configure commands based on config ..."
    ]

    # Format the inline commands for HCL
    inline_hcl = "\n      ".join([f'"{cmd}",' for cmd in inline_cmds])

    return f"""
source "amazon-ebs" "cassandra" {{
  region                  = "us-east-1"
  instance_type           = "t3.medium"
  source_ami_filter {{
    filters = {{
      name = "{os_info['ami_filter']}"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }}
    owners      = ["{os_info['owner']}"]
    most_recent = true
  }}
  ssh_username = "{os_info['ssh_username']}"
  ami_name                = "cassandra-prebaked-{{{{timestamp}}}}"
}}

build {{
  sources = ["source.amazon-ebs.cassandra"]

  provisioner "shell" {{
    inline = [
      {inline_hcl}
    ]
  }}
}}
"""

# Example usage for testing:
# config = {
#   "os": "Ubuntu LTS 22.04",
#   "cassandra_version": "4.1.3",
#   "java_distribution": "temurin",
#   "java_version": "11",
#   "python_version": "3.10",
#   "tools": ["backup", "repairs"]
# }
# print(generate_packer_template(config))