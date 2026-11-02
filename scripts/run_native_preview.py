import socket
import subprocess
import sys
import time
from pathlib import Path

root=Path(__file__).resolve().parents[1]
children=[]
try:
    for port,command in [(8765,[sys.executable,'-m','http.server','8765','--bind','127.0.0.1','--directory',str(root/'miniapp')]),
        (8766,[sys.executable,str(root/'backend-local/server.py')])]:
        with socket.socket() as sock:
            sock.settimeout(.3);occupied=sock.connect_ex(('127.0.0.1',port))==0
        if occupied:print('端口已占用，保留已有服务：',port,flush=True)
        else:children.append(subprocess.Popen(command))
    print('本机小程序：http://127.0.0.1:8765/preview/?page=home\n本机后台：http://127.0.0.1:8766/admin/',flush=True)
    while children:
        if any(p.poll() is not None for p in children):raise SystemExit('服务退出，请检查日志。')
        time.sleep(1)
except KeyboardInterrupt:pass
finally:
    for process in children:process.terminate()
    for process in children:process.wait()
