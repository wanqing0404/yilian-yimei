"""Isolated online operations portal with role checks and a read-only demo feed."""
import hashlib
import json
import os
from pathlib import Path
import secrets
from urllib.parse import urlsplit

import domain as d
import server as local

ROOT=Path(__file__).resolve().parent
BASE=os.environ.get('BASE_PATH','/ops/haomei').rstrip('/')
ORIGIN=os.environ.get('PUBLIC_ORIGIN','https://live.ununion.cn').rstrip('/')
DATA=Path(os.environ.get('DATA_DIR',str(ROOT/'runtime-data')))
ACCOUNTS=json.loads(Path(os.environ.get('ACCOUNTS_FILE',str(ROOT/'config/accounts.json'))).read_text())
COOKIE='haomei_ops_session'
local.UPLOADS=DATA/'uploads'
local.PRODUCT_IMAGES=DATA/'product-images'
local.MINI=ROOT/'miniapp'
local.ADMIN_ORIGINS={ORIGIN}
local.ALLOWED_ORIGINS={ORIGIN}
d.DB_PATH=DATA/'operations.sqlite3'

def initialize():
    DATA.mkdir(parents=True,exist_ok=True)
    local.UPLOADS.mkdir(exist_ok=True);local.PRODUCT_IMAGES.mkdir(exist_ok=True)
    d.initialize()
    with d.transaction() as db:
        if not d.get(db,'meta','online_configuration_initialized'):
            config=json.loads((ROOT/'config/configuration.json').read_text())
            for p in config['products']:d.put(db,'products',p['id'],p)
            for g in config['groups']:d.put(db,'groups',g['id'],g)
            for key in ['categories','doctors','clinics']:d.put(db,'catalog',key,config[key])
            d.put(db,'catalog','campaigns',config['campaigns']);d.put(db,'rules','main',config['rules'])
            d.put(db,'meta','online_configuration_initialized',True);d.bump(db)

def public_image(path):
    if path.startswith('/media/products/'):return ORIGIN+BASE+path
    return path

def catalogue(db):
    rules=d.get(db,'rules','main')
    products=[]
    fields={'id','name','category','tags','desc','image','hot','price','pointsPrice','listPrice','memberPrice','limit','priceType','stock','paid','detailTitle','rules'}
    for p in sorted(d.rows(db,'products'),key=lambda x:x.get('sortOrder',999)):
        if p.get('status')!='published':continue
        item={k:v for k,v in p.items() if k in fields}
        item['image']=public_image(item.get('image',''))
        item.update(hidden=False,pricePending=bool(rules['pricing']['approvalRequired'] and not p.get('priceApproved') and not rules['pricing']['showDemoPrices']))
        products.append(item)
    ids={p['id'] for p in products}
    campaigns=d.get(db,'catalog','campaigns',{})
    campaigns['groupOffers']=[g for g in d.rows(db,'groups') if g.get('enabled') and g.get('productId') in ids]
    campaigns['flashOffers']=[g for g in campaigns.get('flashOffers',[]) if g.get('productId') in ids]
    for gift in campaigns.get('pointsOffers',[]):gift['image']=public_image(gift.get('image',''))
    flash=d.point_flash_state(db)
    flash={k:v for k,v in flash.items() if k not in ['offers','claimedCount']}
    doctors=d.get(db,'catalog','doctors',[]);clinics=d.get(db,'catalog','clinics',[])
    for item in doctors+clinics:item['image']=public_image(item.get('image',''))
    return {'revision':d.get(db,'meta','revision',1),'products':products,'categories':d.get(db,'catalog','categories',[]),
        'doctors':doctors,'clinics':clinics,'campaigns':campaigns,'rules':rules,'pointFlash':flash}

class Handler(local.Handler):
    server_version='HaomeiOps/1.0'
    def cookie_token(self):
        for item in self.headers.get('Cookie','').split(';'):
            key,sep,value=item.strip().partition('=')
            if sep and key==COOKIE:return value
        return ''
    def current_admin(self):
        token=self.cookie_token()
        if not token:return None
        with d.connect() as db:session=d.get(db,'adminSessions',hashlib.sha256(token.encode()).hexdigest())
        if not session or session['expiresAt']<=d.now():return None
        account=ACCOUNTS.get(session['username'])
        return dict(account,username=session['username']) if account else None
    def require_admin(self):
        account=self.current_admin()
        if not account:raise d.ApiError('请先登录运营后台',401)
        if self.command!='GET':
            origin=self.headers.get('Origin')
            if origin and origin!=ORIGIN:raise d.ApiError('请求来源无效',403)
            if account['role']=='viewer' and urlsplit(self.path).path!='/api/admin/logout':raise d.ApiError('当前账号为只读权限，不能修改或删除',403)
        return account
    def route(self):
        original=self.path
        parsed=urlsplit(original);path=parsed.path
        demo=os.environ.get('QA_DEMO_DIR')
        if demo and self.command=='GET' and path.startswith('/demo/haomei/'):
            suffix=path[len('/demo/haomei/'):]
            self.serve(Path(demo),suffix+'index.html' if not suffix or suffix.endswith('/') else suffix);return
        if path in [BASE,BASE+'/',BASE+'/admin']:
            self.send_response(302);self.send_header('Location',BASE+'/admin/');self.end_headers();return
        if not path.startswith(BASE+'/'):raise d.ApiError('页面不存在',404)
        path=path[len(BASE):];self.path=path+('?' + parsed.query if parsed.query else '')
        try:
            if path=='/api/admin/login' and self.command=='POST':
                if self.headers.get('Origin') not in [None,ORIGIN]:raise d.ApiError('请求来源无效',403)
                body=self.body();username=str(body.get('username',''));account=ACCOUNTS.get(username)
                # Perform a hash even for unknown accounts, without retaining credentials.
                chosen=account or next(iter(ACCOUNTS.values()))
                digest=hashlib.pbkdf2_hmac('sha256',str(body.get('password','')).encode(),bytes.fromhex(chosen['salt']),chosen['iterations']).hex()
                if not account or not secrets.compare_digest(digest,account['passwordHash']):raise d.ApiError('账号或密码不正确',401)
                token=secrets.token_urlsafe(32)
                with d.transaction() as db:d.put(db,'adminSessions',hashlib.sha256(token.encode()).hexdigest(),{'username':username,'expiresAt':d.now()+8*3600000})
                cookie=COOKIE+'='+token+'; Path='+BASE+'/; HttpOnly; SameSite=Strict; Max-Age=28800'+('; Secure' if ORIGIN.startswith('https:') else '')
                self.reply({'ok':True,'data':{'name':account['displayName'],'role':account['role'],'username':username}},extra={'Set-Cookie':cookie});return
            if path=='/api/public/catalogue':
                if self.command!='GET':raise d.ApiError('仅允许读取公开配置',405)
                with d.connect() as db:value=catalogue(db)
                self.reply({'ok':True,'data':value});return
            if path=='/health':
                if self.command!='GET':raise d.ApiError('请求方法无效',405)
                self.reply({'ok':True,'mode':'online-demo'});return
            if path.startswith('/admin/') and self.command=='GET':
                if path not in ['/admin/','/admin/index.html','/admin/app.js','/admin/style.css']:raise d.ApiError('页面不存在',404)
                self.serve(local.WEB,path[len('/admin/'):] or 'index.html');return
            if path.startswith('/miniapp/assets/') and self.command=='GET':
                self.require_admin();self.serve(local.MINI/'assets',path[len('/miniapp/assets/'):]);return
            if path.startswith('/media/products/') and self.command=='GET':
                self.serve(local.PRODUCT_IMAGES,path[len('/media/products/'):]);return
            if path.startswith('/api/admin/'):
                account=self.require_admin()
                if path=='/api/admin/session' and self.command=='GET':
                    self.reply({'ok':True,'data':{'name':account['displayName'],'role':account['role'],'username':account['username'],'demoMode':True}});return
                if path=='/api/admin/logout' and self.command=='POST':
                    token=hashlib.sha256(self.cookie_token().encode()).hexdigest()
                    with d.transaction() as db:db.execute("DELETE FROM records WHERE kind='adminSessions' AND id=?",(token,))
                    self.reply({'ok':True,'data':{}},extra={'Set-Cookie':COOKIE+'=; Path='+BASE+'/; HttpOnly; SameSite=Strict; Max-Age=0'+('; Secure' if ORIGIN.startswith('https:') else '')});return
                if path=='/api/admin/product-image' and self.command=='POST':
                    # Keep the common validation, but publish the returned path under this portal.
                    self.admin(path,self.command,{});return
                self.admin(path,self.command,{});return
            if path=='/api/customer/point-flash' and self.command=='GET':
                self.require_admin();self.customer(path,self.command,{});return
            raise d.ApiError('接口不存在',404)
        finally:self.path=original

def main():
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=18966);args=parser.parse_args()
    os.umask(0o077)
    initialize()
    http=local.ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    print('Haomei online operations listening on localhost:'+str(args.port),flush=True)
    try:http.serve_forever()
    except KeyboardInterrupt:pass
    finally:http.server_close()

if __name__=='__main__':main()
