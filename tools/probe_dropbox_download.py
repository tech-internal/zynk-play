"""Try Dropbox shared-link file download RPC."""
from __future__ import annotations

import json
import re

import requests

FOLDER_URL = (
    "https://www.dropbox.com/scl/fo/50xk70rr2v8dpeav5gzak/ABtwRaiBOsocTTMrRqg1pFU"
    "?rlkey=rcqeijw349r0bqg33adbgjlfz&dl=0"
)
FILE = "Reel_01_Traffic_Warden.mp4"


def main() -> None:
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0"
    page = session.get(FOLDER_URL, timeout=30)
    csrf = session.cookies.get("t")
    uid_match = re.search(r'"uid"\s*:\s*(\d+)', page.text)
    uid = uid_match.group(1) if uid_match else "0"
    print("csrf", csrf, "uid", uid)

    payloads = [
        {
            "url": FOLDER_URL,
            "path": f"/{FILE}",
        },
        {
            "shared_link": {"url": FOLDER_URL},
            "path": f"/{FILE}",
        },
    ]
    endpoints = [
        "https://www.dropbox.com/2/sharing/get_shared_link_file",
        "https://content.dropboxapi.com/2/sharing/get_shared_link_file",
    ]
    for endpoint in endpoints:
        for payload in payloads:
            resp = session.post(
                endpoint,
                headers={
                    "Dropbox-API-Arg": json.dumps(payload),
                    "X-CSRF-Token": csrf or "",
                    "X-Dropbox-Uid": uid,
                },
                timeout=30,
            )
            print(endpoint.split("/")[-1], list(payload.keys()), resp.status_code, resp.text[:200])


if __name__ == "__main__":
    main()
