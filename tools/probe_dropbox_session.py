"""List Dropbox shared folder with CSRF from session."""
from __future__ import annotations

import json

import requests

FOLDERS = [
    (
        "folder1",
        "https://www.dropbox.com/scl/fo/50xk70rr2v8dpeav5gzak/ABtwRaiBOsocTTMrRqg1pFU?rlkey=rcqeijw349r0bqg33adbgjlfz&dl=0",
    ),
    (
        "folder2",
        "https://www.dropbox.com/scl/fo/5domt1c0e8sbs403rdjaq/ALEjITEOVgVGFzFWA9QHq5k?rlkey=5ctzp0syjmabpyoaeljnzymw5&dl=0",
    ),
]


def list_folder(session: requests.Session, csrf: str, folder_url: str) -> dict:
    payload = {
        "path": "",
        "shared_link": {"url": folder_url},
        "include_media_info": False,
    }
    resp = session.post(
        "https://www.dropbox.com/2/files/list_folder",
        headers={
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf,
        },
        data=json.dumps(payload),
        timeout=30,
    )
    if not resp.ok:
        print("error", resp.status_code, resp.text[:500])
        resp.raise_for_status()
    return resp.json()


def main() -> None:
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0"})
    first = FOLDERS[0][1]
    session.get(first, timeout=30)
    csrf = session.cookies.get("t") or session.cookies.get("__Host-js_csrf")
    print("csrf", csrf)

    for name, url in FOLDERS:
        data = list_folder(session, csrf, url)
        files = [e["name"] for e in data.get("entries", []) if e.get(".tag") == "file"]
        print(name, len(files), files)


if __name__ == "__main__":
    main()
