"""Resolve Dropbox preview page to a direct stream URL."""
from __future__ import annotations

import base64
import json
import re
import sys

import requests

FOLDER = {
    "folderId": "50xk70rr2v8dpeav5gzak",
    "folderKey": "ABtwRaiBOsocTTMrRqg1pFU",
    "rlkey": "rcqeijw349r0bqg33adbgjlfz",
}
FILE = "Reel_01_Traffic_Warden.mp4"


def preview_url(folder: dict, file_path: str) -> str:
    encoded = "/".join(requests.utils.requote_uri(part) for part in file_path.split("/"))
    return (
        f"https://www.dropbox.com/scl/fo/{folder['folderId']}/{folder['folderKey']}"
        f"/{encoded}?rlkey={folder['rlkey']}&dl=0"
    )


def main() -> None:
    url = preview_url(FOLDER, FILE)
    html = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30).text
    init_match = re.search(r"initDataBase64:\s*\"([^\"]+)\"", html)
    if init_match:
        raw = base64.b64decode(init_match.group(1))
        text = raw.decode("utf-8", "ignore")
        urls = re.findall(r"https://[^\s\"']+", text)
        print("urls in init", [u for u in urls if "dropbox" in u][:10])
    for pat in [
        r"https://[^\"'\\s]+dropboxusercontent[^\"'\\s]+",
        r"\"preview_url\"\\s*:\\s*\"([^\"]+)\"",
        r"\"download_url\"\\s*:\\s*\"([^\"]+)\"",
    ]:
        hits = re.findall(pat, html)
        if hits:
            print(pat, hits[:3])


if __name__ == "__main__":
    main()
