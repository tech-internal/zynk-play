"""List and stream reels from AWS S3."""
from __future__ import annotations

import re

import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from django.core.cache import cache
from django.http import Http404, HttpResponseBadRequest, StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

CACHE_TTL = 300


def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def _list_s3_mp4_keys() -> list[str]:
    cache_key = "reels:s3:keys"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    bucket = settings.AWS_STORAGE_BUCKET_NAME
    if not bucket:
        return []

    keys: list[str] = []
    paginator = _s3_client().get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if key.lower().endswith(".mp4"):
                keys.append(key)

    keys.sort()
    cache.set(cache_key, keys, CACHE_TTL)
    return keys


def _reel_title_from_key(key: str) -> str:
    base = key.split("/")[-1]
    without_ext = re.sub(r"\.mp4$", "", base, flags=re.IGNORECASE)
    reel_match = re.match(r"^Reel_\d+_(.+)$", without_ext)
    if reel_match:
        return reel_match.group(1).replace("_", " ")
    return without_ext.replace("_", " ")


def _reel_id_from_key(key: str) -> str:
    slug = re.sub(r"[^\w]+", "-", key).strip("-").lower()
    return slug or "reel"


def _s3_public_url(key: str) -> str:
    from urllib.parse import quote

    bucket = settings.AWS_STORAGE_BUCKET_NAME
    region = settings.AWS_S3_REGION_NAME
    encoded_key = "/".join(quote(segment, safe="") for segment in key.split("/"))
    return f"https://{bucket}.s3.{region}.amazonaws.com/{encoded_key}"


def _reel_item(key: str) -> dict:
    return {
        "id": _reel_id_from_key(key),
        "key": key,
        "title": _reel_title_from_key(key),
        "proxySrc": f"/api/v1/reels/stream?key={quote_key(key)}",
        "fallbackSrc": _s3_public_url(key),
    }


def quote_key(key: str) -> str:
    from urllib.parse import quote

    return quote(key, safe="")


@api_view(["GET"])
@permission_classes([AllowAny])
def list_reels(_request):
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    if not bucket:
        return Response([])

    keys = _list_s3_mp4_keys()
    return Response([_reel_item(key) for key in keys])


@api_view(["GET"])
@permission_classes([AllowAny])
def stream_reel(request):
    key = request.GET.get("key", "").strip()
    if not key:
        return HttpResponseBadRequest("key is required")
    if not key.lower().endswith(".mp4"):
        return HttpResponseBadRequest("invalid reel key")

    bucket = settings.AWS_STORAGE_BUCKET_NAME
    if not bucket:
        raise Http404("S3 bucket not configured")

    available = _list_s3_mp4_keys()
    if key not in available:
        raise Http404("Reel file missing in S3")

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
