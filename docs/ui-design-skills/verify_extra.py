"""Read-only validation of the three additional pinned skill repositories."""
import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[2]
manifest = json.loads(Path(__file__).with_name('EXTRA-SOURCES.json').read_text())

def blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

for entry in manifest['files']:
    data = (root / entry['path']).read_bytes()
    if entry['adapted']:
        data = re.sub(rb'(?m)^name: rampstack-(creative-direction|logo-design)$', rb'name: \1', data)
    if blob_sha(data) != entry['upstream_git_blob_sha']:
        raise SystemExit('Hash mismatch: ' + entry['path'])

names = {}
for skill in sorted((root / '.agents/skills').glob('*/SKILL.md')):
    match = re.search(r'^name:\s*(.+)$', skill.read_text(), re.M)
    if not match:
        raise SystemExit('Missing name: ' + str(skill))
    name = match.group(1).strip().strip('\"\'')
    if name != skill.parent.name or name in names:
        raise SystemExit('Invalid or duplicate name: ' + name)
    names[name] = str(skill)

print(f"Verified {len(manifest['files'])} files; {sum(e['adapted'] for e in manifest['files'])} name-only adaptations")
print(f'Unique installed skills: {len(names)}')
