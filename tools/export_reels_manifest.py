"""Verify reel files in S3 against reelsManifest.json."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from decouple import config

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "frontend" / "src" / "config" / "reelsManifest.json"


def _s3_key(file_path: str, folder: dict) -> str:
    prefix = folder.get("s3Prefix", "").strip("/")
    if prefix:
        return f"{prefix}/{file_path.lstrip('/')}"
    return file_path


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

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    missing: list[str] = []
    found = 0

    for folder in manifest:
        for file_path in folder.get("files", []):
            key = _s3_key(file_path, folder)
            try:
                s3.head_object(Bucket=bucket, Key=key)
                found += 1
                print("ok", key)
            except ClientError:
                missing.append(key)
                print("MISSING", key, file=sys.stderr)

    print(f"\n{found} found, {len(missing)} missing in s3://{bucket}/")
    if missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
