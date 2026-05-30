"""Stream reels from Dropbox shared folders (cached zip fallback)."""
from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import requests
from django.conf import settings
from django.core.cache import cache
from django.http import FileResponse, Http404, HttpResponseBadRequest
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

MANIFEST_PATH = settings.BASE_DIR / "frontend" / "src" / "config" / "reelsManifest.json"
CACHE_TTL = 60 * 60


def _load_manifest() -> list[dict]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def _folder_by_id(folder_id: str) -> dict:
    for folder in _load_manifest():
        if folder["id"] == folder_id:
            return folder
    raise Http404("Unknown reel folder")


def _folder_zip_url(folder: dict) -> str:
    return (
        f"https://www.dropbox.com/scl/fo/{folder['folderId']}/{folder['folderKey']}"
        f"?rlkey={folder['rlkey']}&dl=1"
    )


def _cache_dir() -> Path:
    path = Path(getattr(settings, "REELS_CACHE_DIR", settings.BASE_DIR / "tmp" / "reels_cache"))
    path.mkdir(parents=True, exist_ok=True)
    return path


def _ensure_folder_zip(folder: dict) -> Path:
    folder_id = folder["id"]
    target = _cache_dir() / f"{folder_id}.zip"
    cache_key = f"reels:zip:{folder_id}"
    if target.exists() and cache.get(cache_key):
        return target

    resp = requests.get(
        _folder_zip_url(folder),
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=600,
    )
    resp.raise_for_status()
    target.write_bytes(resp.content)
    cache.set(cache_key, True, CACHE_TTL)
    return target


@api_view(["GET"])
@permission_classes([AllowAny])
def stream_reel(request):
    folder_id = request.GET.get("folder", "").strip()
    file_path = request.GET.get("file", "").strip()
    if not folder_id or not file_path:
        return HttpResponseBadRequest("folder and file are required")

    folder = _folder_by_id(folder_id)
    if file_path not in folder.get("files", []):
        raise Http404("Unknown reel file")

    zip_path = _ensure_folder_zip(folder)
    with zipfile.ZipFile(zip_path) as zf:
        try:
            info = zf.getinfo(file_path)
            payload = zf.read(file_path)
        except KeyError as exc:
            raise Http404("Reel file missing in Dropbox folder") from exc

    response = FileResponse(io.BytesIO(payload), content_type="video/mp4")
    response["Content-Length"] = info.file_size
    response["Accept-Ranges"] = "bytes"
    response["Cache-Control"] = "public, max-age=3600"
    return response
