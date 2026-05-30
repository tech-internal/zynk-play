"""Probe Dropbox shared folders for reel file URLs."""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request


FOLDERS = [
    {
        "id": "folder1",
        "folder_id": "50xk70rr2v8dpeav5gzak",
        "folder_key": "ABtwRaiBOsocTTMrRqg1pFU",
        "rlkey": "rcqeijw349r0bqg33adbgjlfz",
    },
    {
        "id": "folder2",
        "folder_id": "5domt1c0e8sbs403rdjaq",
        "folder_key": "ALEjITEOVgVGFzFWA9QHq5k",
        "rlkey": "5ctzp0syjmabpyoaeljnzymw5",
    },
    {
        "id": "folder3",
        "folder_id": "rf3go310juahgrklnjf4o",
        "folder_key": "ACd4i9W2OsjMHkIOYS_IBXk",
        "rlkey": "mrdbr8ze3im8qsyywdgj2vr66",
    },
    {
        "id": "folder4",
        "folder_id": "3g3i8u23ml1szcvtspt5f",
        "folder_key": "AAQz5FwNMUFkS-U8xT0bV0o",
        "rlkey": "h2iz6esvtn6f15li8g7yfr5df",
    },
]


def folder_url(folder: dict) -> str:
    return (
        f"https://www.dropbox.com/scl/fo/{folder['folder_id']}/{folder['folder_key']}"
        f"?rlkey={folder['rlkey']}&dl=0"
    )


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "ignore")


def extract_mp4_names(html: str) -> list[str]:
    names = set(re.findall(r"Reel_\d{2}_[A-Za-z0-9_]+\.mp4", html))
    return sorted(names)


def is_video_url(url: str) -> bool:
    req = urllib.request.Request(
        url,
        headers={"Range": "bytes=0-15", "User-Agent": "Mozilla/5.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            ctype = (resp.headers.get("Content-Type") or "").lower()
            body = resp.read(16)
            return "video" in ctype or body[:4] == b"\x00\x00\x00" or body[4:8] == b"ftyp"
    except Exception:
        return False


def list_zip_mp4(folder: dict) -> list[str]:
    url = folder_url(folder).replace("&dl=0", "&dl=1")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    import io
    import zipfile

    with urllib.request.urlopen(req, timeout=300) as resp:
        data = resp.read()
    if not data.startswith(b"PK"):
        return []
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        return sorted(n for n in zf.namelist() if n.lower().endswith(".mp4"))


def main() -> None:
    for folder in FOLDERS:
        url = folder_url(folder)
        print(f"\n=== {folder['id']} ===")
        try:
            mp4 = list_zip_mp4(folder)
            print("zip mp4:", len(mp4), mp4)
        except Exception as exc:
            print("zip error:", exc)


if __name__ == "__main__":
    main()
