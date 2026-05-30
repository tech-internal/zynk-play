"""Test Dropbox URL patterns for folder file streaming."""
from __future__ import annotations

import urllib.parse
import urllib.request

FOLDER = {
    "folder_id": "50xk70rr2v8dpeav5gzak",
    "folder_key": "ABtwRaiBOsocTTMrRqg1pFU",
    "rlkey": "rcqeijw349r0bqg33adbgjlfz",
    "file": "Reel_01_Traffic_Warden.mp4",
}


def probe(label: str, url: str) -> None:
    req = urllib.request.Request(
        url,
        headers={"Range": "bytes=0-31", "User-Agent": "Mozilla/5.0"},
    )
    opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler())
    try:
        with opener.open(req, timeout=30) as resp:
            body = resp.read(32)
            print(
                label,
                resp.status,
                resp.headers.get("Content-Type"),
                resp.geturl()[:120],
                body[:8],
            )
    except Exception as exc:
        print(label, "ERR", exc)


def main() -> None:
    enc = urllib.parse.quote(FOLDER["file"])
    base = (
        f"https://www.dropbox.com/scl/fo/{FOLDER['folder_id']}/{FOLDER['folder_key']}"
        f"/{enc}?rlkey={FOLDER['rlkey']}"
    )
    probe("fo_path_raw", f"{base}&raw=1")
    probe("fo_path_dl1", f"{base}&dl=1")
    probe(
        "fi_folderid_raw",
        f"https://www.dropbox.com/scl/fi/{FOLDER['folder_id']}/{enc}?rlkey={FOLDER['rlkey']}&raw=1",
    )
    probe(
        "preview",
        f"https://www.dropbox.com/scl/fi/{FOLDER['folder_id']}/{enc}?rlkey={FOLDER['rlkey']}&dl=0",
    )


if __name__ == "__main__":
    main()
