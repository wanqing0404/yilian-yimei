import os
from pathlib import Path
import subprocess
import sys

root=Path(__file__).resolve().parents[1]
accounts=root/'backend/config/accounts.json'
if not accounts.exists():raise SystemExit('请先运行 python3 scripts/create_accounts.py')
port=int(os.environ.get('PORT','18966'))
env=dict(os.environ,DATA_DIR=str(root/'.runtime/online'),ACCOUNTS_FILE=str(accounts),
    QA_DEMO_DIR=str(root/'demo'),BASE_PATH='/ops/haomei',
    PUBLIC_ORIGIN=os.environ.get('PUBLIC_ORIGIN','http://127.0.0.1:'+str(port)))
raise SystemExit(subprocess.call([sys.executable,str(root/'backend/online_server.py'),'--port',str(port)],env=env))
