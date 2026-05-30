"""Read mp4 filenames from Dropbox folder zip central directory only."""
from __future__ import annotations

import io
import struct
import urllib.request

FOLDERS = [
    (
        "folder1",
        "https://www.dropbox.com/scl/fo/50xk70rr2v8dpeav5gzak/ABtwRaiBOsocTTMrRqg1pFU?rlkey=rcqeijw349r0bqg33adbgjlfz&dl=1",
    ),
    (
        "folder2",
        "https://www.dropbox.com/scl/fo/5domt1c0e8sbs403rdjaq/ALEjITEOVgVGFzFWA9QHq5k?rlkey=5ctzp0syjmabpyoaeljnzymw5&dl=1",
    ),
    (
        "folder3",
        "https://www.dropbox.com/scl/fo/rf3go310juahgrklnjf4o/ACd4i9W2OsjMHkIOYS_IBXk?rlkey=mrdbr8ze3im8qsyywdgj2vr66&dl=1",
    ),
    (
        "folder4",
        "https://www.dropbox.com/scl/fo/3g3i8u23ml1szcvtspt5f/AAQz5FwNMUFkS-U8xT0bV0o?rlkey=h2iz6esvtn6f15li8g7yfr5df&dl=1",
    ),
]


def read_tail(url: str, size: int = 65536) -> tuple[bytes, int]:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        total = int(resp.headers.get("Content-Length", "0"))
    if total <= 0:
        raise RuntimeError("missing content-length")
    start = max(0, total - size)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0", "Range": f"bytes={start}-{total - 1}"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read(), start


def parse_zip_names(tail: bytes, offset: int) -> list[str]:
    names: list[str] = []
    pos = len(tail) - 22
    while pos >= 0:
        if tail[pos : pos + 4] == b"PK\x05\x06":
            break
        pos -= 1
    else:
        return names

    _disk, _cdisk, entries, _size, cd_offset, _comment = struct.unpack("<HHHHLLH", tail[pos : pos + 22])
    cd_pos = cd_offset - offset
    for _ in range(entries):
        if tail[cd_pos : cd_pos + 4] != b"PK\x01\x02":
            break
        (
            _ver,
            _flag,
            _method,
            _time,
            _date,
            _crc,
            comp_size,
            _uncomp,
            name_len,
            extra_len,
            comment_len,
            _disk_start,
            _int_attr,
            _ext_attr,
            local_offset,
        ) = struct.unpack("<HHHHLLLHHHHHLL", tail[cd_pos + 8 : cd_pos + 46])
        name_start = cd_pos + 46
        name = tail[name_start : name_start + name_len].decode("utf-8", "ignore")
        if name.lower().endswith(".mp4"):
            names.append(name)
        cd_pos = name_start + name_len + extra_len + comment_len
    return sorted(names)


def main() -> None:
    for label, url in FOLDERS:
        try:
            tail, offset = read_tail(url)
            names = parse_zip_names(tail, offset)
            print(label, len(names))
            for name in names:
                print(" ", name)
        except Exception as exc:
            print(label, "ERR", exc)


if __name__ == "__main__":
    main()
