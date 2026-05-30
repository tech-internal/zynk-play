"""Export Dropbox folder mp4 filenames to JSON manifest."""
from __future__ import annotations

import io
import json
import zipfile

import requests

FOLDERS = [
    {
        "id": "folder1",
        "folderId": "50xk70rr2v8dpeav5gzak",
        "folderKey": "ABtwRaiBOsocTTMrRqg1pFU",
        "rlkey": "rcqeijw349r0bqg33adbgjlfz",
    },
    {
        "id": "folder2",
        "folderId": "5domt1c0e8sbs403rdjaq",
        "folderKey": "ALEjITEOVgVGFzFWA9QHq5k",
        "rlkey": "5ctzp0syjmabpyoaeljnzymw5",
    },
    {
        "id": "folder3",
        "folderId": "rf3go310juahgrklnjf4o",
        "folderKey": "ACd4i9W2OsjMHkIOYS_IBXk",
        "rlkey": "mrdbr8ze3im8qsyywdgj2vr66",
    },
    {
        "id": "folder4",
        "folderId": "3g3i8u23ml1szcvtspt5f",
        "folderKey": "AAQz5FwNMUFkS-U8xT0bV0o",
        "rlkey": "h2iz6esvtn6f15li8g7yfr5df",
    },
]


def folder_zip_url(folder: dict) -> str:
    return (
        f"https://www.dropbox.com/scl/fo/{folder['folderId']}/{folder['folderKey']}"
        f"?rlkey={folder['rlkey']}&dl=1"
    )


def list_mp4(folder: dict) -> list[str]:
    resp = requests.get(folder_zip_url(folder), headers={"User-Agent": "Mozilla/5.0"}, timeout=600)
    resp.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        return sorted(name for name in zf.namelist() if name.lower().endswith(".mp4"))


def main() -> None:
    manifest = []
    for folder in FOLDERS:
        files = list_mp4(folder)
        manifest.append({**folder, "files": files})
        print(folder["id"], len(files))
    out = "frontend/src/config/reelsManifest.json"
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
    print("wrote", out)


if __name__ == "__main__":
    main()
