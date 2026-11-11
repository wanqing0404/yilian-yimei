"""Verify upstream Git blob hashes; normalize only a patch-added final LF."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
manifest = json.loads((Path(__file__).resolve().parent / 'SOURCES.json').read_text())
for entry in manifest['files']:
    path = root / entry['path']
    data = path.read_bytes()
    def blob_sha(value):
        return hashlib.sha1(b'blob ' + str(len(value)).encode() + b'\0' + value).hexdigest()
    expected = entry['upstream_git_blob_sha']
    if blob_sha(data) != expected:
        if data.endswith(b'\n') and blob_sha(data[:-1]) == expected:
            path.write_bytes(data[:-1])
        else:
            raise SystemExit(f'Upstream hash mismatch: {path}')
print(f"Verified {len(manifest['files'])} upstream files")
