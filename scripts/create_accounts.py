"""Create a private account file; never write plaintext passwords."""
import getpass
import hashlib
import json
from pathlib import Path
import secrets

target=Path(__file__).resolve().parents[1]/'backend/config/accounts.json'
if target.exists():raise SystemExit('账户文件已存在，不自动覆盖。')
accounts={}
for username,role,label in [('admin','admin','管理员'),('viewer','viewer','只读访客')]:
    password=getpass.getpass('设置'+label+'密码：')
    if not password:raise SystemExit('密码不能为空。')
    if password!=getpass.getpass('再次输入'+label+'密码：'):raise SystemExit('两次密码不一致。')
    salt=secrets.token_hex(16);iterations=310000
    digest=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),iterations).hex()
    accounts[username]={'role':role,'displayName':label,'salt':salt,'iterations':iterations,'passwordHash':digest}
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(accounts,ensure_ascii=False,indent=2));target.chmod(0o600)
print('已生成被Git忽略的账号文件。')
