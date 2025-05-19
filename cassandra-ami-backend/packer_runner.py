import subprocess
import os

def build_ami_with_profile(pkr_file, aws_profile="learning"):
    env = os.environ.copy()
    env["AWS_PROFILE"] = aws_profile

    result = subprocess.run(
        ["packer", "build", pkr_file],
        env=env,
        capture_output=True,
        text=True
    )

    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    print("Return code:", result.returncode)
    return result

# Optional: allow running from command line
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python packer_runner.py <template.pkr.hcl> [aws_profile]")
        exit(1)
    pkr_file = sys.argv[1]
    aws_profile = sys.argv[2] if len(sys.argv) > 2 else "learning"
    build_ami_with_profile(pkr_file, aws_profile)