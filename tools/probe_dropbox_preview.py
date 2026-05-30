"""Extract direct media URL from Dropbox file preview page."""
from __future__ import annotations

import re

import requests

URL = (
    "https://www.dropbox.com/scl/fo/50xk70rr2v8dpeav5gzak/ABtwRaiBOsocTTMrRqg1pFU/"
    "Reel_01_Traffic_Warden.mp4?rlkey=rcqeijw349r0bqg33adbgjlfz&dl=0"
)


def main() -> None:
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0"
    html = session.get(URL, timeout=30).text
    patterns = [
        r"https://[^\"'\s]+dropboxusercontent[^\"'\s]+\.mp4[^\"'\s]*",
        r"https://[^\"'\s]+/scl/fi/[^\"'\s]+\.mp4[^\"'\s]*",
        r"\"url\"\s*:\s*\"(https://[^\"]+\.mp4[^\"]*)\"",
    ]
    for pat in patterns:
        hits = re.findall(pat, html)
        if hits:
            print("pattern", pat[:40], hits[:3])
    fi = re.findall(r"scl/fi/[A-Za-z0-9_-]+/[^\"'\s>]+", html)
    print("scl/fi hits", fi[:5])
    print("html len", len(html))


if __name__ == "__main__":
    main()
