"""Follow Dropbox redirects to find direct media URLs."""
from __future__ import annotations

import requests

TESTS = [
    (
        "folder file path dl=1",
        "https://www.dropbox.com/scl/fo/50xk70rr2v8dpeav5gzak/ABtwRaiBOsocTTMrRqg1pFU/Reel_01_Traffic_Warden.mp4?rlkey=rcqeijw349r0bqg33adbgjlfz&dl=1",
    ),
    (
        "folder file path raw=1",
        "https://www.dropbox.com/scl/fo/50xk70rr2v8dpeav5gzak/ABtwRaiBOsocTTMrRqg1pFU/Reel_01_Traffic_Warden.mp4?rlkey=rcqeijw349r0bqg33adbgjlfz&raw=1",
    ),
]


def main() -> None:
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0"
    for label, url in TESTS:
        resp = session.get(url, allow_redirects=True, stream=True, timeout=30)
        chunk = next(resp.iter_content(32))
        print(label)
        print("  final", resp.url[:120])
        print("  status", resp.status_code, resp.headers.get("Content-Type"))
        print("  bytes", chunk[:12])


if __name__ == "__main__":
    main()
