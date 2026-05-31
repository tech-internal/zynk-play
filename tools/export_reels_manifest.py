"""Sync reelsManifest.json from objects present in S3."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import boto3
from decouple import config

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "frontend" / "src" / "config" / "reelsManifest.json"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    bucket = config("AWS_STORAGE_BUCKET_NAME")
    region = config("AWS_S3_REGION_NAME", default="us-east-1")
    s3 = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=config("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=config("AWS_SECRET_ACCESS_KEY"),
    )

    keys: list[str] = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if key.lower().endswith(".mp4"):
                keys.append(key)

    keys.sort()
    manifest = [{"id": "s3", "files": keys}]
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"wrote {len(keys)} reel(s) to {MANIFEST_PATH}")
    for key in keys:
        print(" ", key)


if __name__ == "__main__":
    main()
