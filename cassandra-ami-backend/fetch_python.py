import requests
import re

def fetch_ubuntu_python_versions(codename):
    url = f"https://api.launchpad.net/1.0/ubuntu/{codename}/archive?ws.op=getPublishedSources&source_name=python3"
    response = requests.get(url)
    if response.status_code != 200:
        return []
    data = response.json()
    versions = set()
    for entry in data.get('entries', []):
        version = entry.get('source_package_version', '')
        match = re.match(r'3\.(\d+)', version)
        if match:
            versions.add(f"3.{match.group(1)}")
    return sorted(list(versions))

def fetch_non_eol_python_versions():
    url = "https://endoflife.date/api/python.json"
    response = requests.get(url)
    if response.status_code != 200:
        return []
    data = response.json()
    return [v["cycle"] for v in data if not v["eol"] and not v.get("prerelease") and float(v["cycle"]) >= 3.0]