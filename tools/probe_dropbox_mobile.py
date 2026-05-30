"""Check whether Dropbox redirects to video bytes."""
from __future__ import annotations

import requests

URL = (
    "https://www.dropbox.com/scl/fo/50xk70rr2v8dpeav5gzak/ABtwRaiBOsocTTMrRqg1pFU/"
    "Reel_01_Traffic_Warden.mp4?rlkey=rcqeijw349r0bqg33adbgjlfz&dl=1"
)


def main() -> None:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            )
        }
    )
    resp = session.get(URL, allow_redirects=True, stream=True, timeout=30)
    chunk = next(resp.iter_content(64))
    print("status", resp.status_code)
    print("final", resp.url[:120])
    print("type", resp.headers.get("Content-Type"))
    print("bytes", chunk[:16])


if __name__ == "__main__":
    main()
