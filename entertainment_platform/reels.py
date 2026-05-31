"""Stream reels from AWS S3."""
from __future__ import annotations

import json
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from django.http import Http404, HttpResponseBadRequest, StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

MANIFEST_PATH = settings.BASE_DIR / "frontend" / "src" / "config" / "reelsManifest.json"


def _load_manifest() -> list[dict]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def _folder_by_id(folder_id: str) -> dict:
    for folder in _load_manifest():
        if folder["id"] == folder_id:
            return folder
    raise Http404("Unknown reel folder")


def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def _s3_key(file_path: str, folder: dict | None = None) -> str:
    prefix = (folder or {}).get("s3Prefix", "").strip("/")
    if prefix:
        return f"{prefix}/{file_path.lstrip('/')}"
    return file_path


@api_view(["GET"])
@permission_classes([AllowAny])
def stream_reel(request):
    folder_id = request.GET.get("folder", "").strip()
    file_path = request.GET.get("file", "").strip()
    if not folder_id or not file_path:
        return HttpResponseBadRequest("folder and file are required")

    bucket = settings.AWS_STORAGE_BUCKET_NAME
    if not bucket:
        raise Http404("S3 bucket not configured")

    folder = _folder_by_id(folder_id)
    if file_path not in folder.get("files", []):
        raise Http404("Unknown reel file")

    key = _s3_key(file_path, folder)
    range_header = request.META.get("HTTP_RANGE")

    params: dict = {"Bucket": bucket, "Key": key}
    if range_header:
        params["Range"] = range_header

    try:
        obj = _s3_client().get_object(**params)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("NoSuchKey", "404"):
            raise Http404("Reel file missing in S3") from exc
        raise

    status = 206 if range_header and obj.get("ContentRange") else 200
    response = StreamingHttpResponse(
        obj["Body"].iter_chunks(chunk_size=8192),
        content_type=obj.get("ContentType") or "video/mp4",
        status=status,
    )
    if obj.get("ContentLength") is not None:
        response["Content-Length"] = obj["ContentLength"]
    if obj.get("ContentRange"):
        response["Content-Range"] = obj["ContentRange"]
    response["Accept-Ranges"] = "bytes"
    response["Cache-Control"] = "public, max-age=3600"
    return response
