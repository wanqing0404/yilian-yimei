"""Private consistent SQLite backup, retaining this application's last 14 copies."""
from pathlib import Path
import datetime
import os
import sqlite3

os.umask(0o077)
source=Path('/var/lib/haomei-admin/operations.sqlite3')
directory=Path('/var/backups/haomei-admin');directory.mkdir(parents=True,exist_ok=True)
target=directory/('operations-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.sqlite3')
with sqlite3.connect(str(source)) as src,sqlite3.connect(str(target)) as dst:src.backup(dst)
target.chmod(0o600)
for old in sorted(directory.glob('operations-*.sqlite3'),reverse=True)[14:]:old.unlink()
print('Private backup completed:',target.name)
