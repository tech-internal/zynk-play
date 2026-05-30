"""Export folder2 and folder3 reel filenames."""
from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import requests

FOLDERS = [
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
]


def main() -> None:
    out: dict[str, list[str]] = {}
    for folder in FOLDERS:
        url = (
            f"https://www.dropbox.com/scl/fo/{folder['folderId']}/{folder['folderKey']}"
            f"?rlkey={folder['rlkey']}&dl=1"
        )
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=600)
        resp.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
            files = sorted(n for n in zf.namelist() if n.lower().endswith(".mp4"))
        out[folder["id"]] = files

    manifest_path = Path(__file__).resolve().parents[1] / "frontend" / "src" / "config" / "reelsManifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for entry in manifest:
        if entry["id"] in out:
            entry["files"] = out[entry["id"]]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("updated", manifest_path)


if __name__ == "__main__":
    main()
