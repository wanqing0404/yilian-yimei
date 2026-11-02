#!/usr/bin/env python3
"""Local operations demo: SQLite + authenticated admin + mini-program API."""
import argparse
import base64
import hashlib
import json
import mimetypes
import os
import secrets
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

import domain as d

ROOT = Path(__file__).resolve().parent
WEB = ROOT / 'web'
MINI = Path(os.environ.get('MINIAPP_DIR', str(ROOT.parent / 'yilian-haomei-miniapp')))
UPLOADS = ROOT / 'data' / 'uploads'
PRODUCT_IMAGES = ROOT / 'data' / 'product-images'
ADMIN_NAME = os.environ.get('ADMIN_USER', 'admin')
ADMIN_PASS = os.environ.get('ADMIN_PASSWORD', 'demo2026')
ALLOWED_ORIGINS = {'http://127.0.0.1:8765','http://localhost:8765','http://127.0.0.1:8766','http://localhost:8766'}
ADMIN_ORIGINS = {'http://127.0.0.1:8766','http://localhost:8766'}

class Handler(BaseHTTPRequestHandler):
    server_version = 'HaomeiLocal/1.0'
    def log_message(self, fmt, *args):
        if '/health' not in self.path: super().log_message(fmt, *args)
    def cors(self):
        origin = self.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Credentials', 'true')
    def reply(self, obj, status=200, extra=None):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status); self.cors()
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        for key,value in (extra or {}).items(): self.send_header(key,value)
        self.end_headers(); self.wfile.write(body)
    def body(self):
        length = int(self.headers.get('Content-Length','0'))
        if length > 4500000: raise d.ApiError('请求内容过大',413)
        if length == 0: return {}
        if 'application/json' not in self.headers.get('Content-Type',''): raise d.ApiError('请使用JSON请求',415)
        try: return json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError): raise d.ApiError('JSON格式无效')
    def cookie_token(self):
        for item in self.headers.get('Cookie','').split(';'):
            key,sep,value=item.strip().partition('=')
            if sep and key=='haomei_admin': return value
        return ''
    def is_admin(self):
        token=self.cookie_token()
        if not token:return False
        with d.connect() as db:
            row=db.execute('SELECT expires_at FROM sessions WHERE token_hash=?',(hashlib.sha256(token.encode()).hexdigest(),)).fetchone()
            return bool(row and row['expires_at']>d.now())
    def require_admin(self):
        if not self.is_admin(): raise d.ApiError('请先登录运营后台',401)
        origin=self.headers.get('Origin')
        if self.command!='GET' and origin and origin not in ADMIN_ORIGINS: raise d.ApiError('请求来源无效',403)
    def user_id(self):
        value=self.headers.get('X-Demo-User',d.DEMO_USER)
        if value not in [d.DEMO_USER,'demo-new','demo-old']: raise d.ApiError('演示身份无效',401)
        return value
    def serve(self, root, name):
        root=root.resolve(); p=(root/unquote(name)).resolve()
        try:p.relative_to(root)
        except ValueError:raise d.ApiError('路径无效',403)
        if not p.is_file():raise d.ApiError('文件不存在',404)
        body=p.read_bytes();self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(str(p))[0] or 'application/octet-stream')
        self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff')
        self.end_headers();self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204);self.cors()
        self.send_header('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type,X-Demo-User')
        self.end_headers()
    def do_GET(self):self.handle_request()
    def do_POST(self):self.handle_request()
    def do_PUT(self):self.handle_request()
    def do_DELETE(self):self.handle_request()
    def handle_request(self):
        try:self.route()
        except d.ApiError as e:self.reply({'ok':False,'error':e.message},e.status)
        except (KeyError,ValueError,TypeError) as e:self.reply({'ok':False,'error':'字段格式无效：'+str(e)},400)
        except (BrokenPipeError,ConnectionResetError):pass
        except Exception as e:
            import traceback;traceback.print_exc();self.reply({'ok':False,'error':'服务暂时不可用，请查看后台日志'},500)
    def route(self):
        url=urlsplit(self.path);path=url.path;q=parse_qs(url.query);method=self.command
        if method=='GET' and path in ['/','/admin']:
            self.send_response(302);self.send_header('Location','/admin/');self.end_headers();return
        if method=='GET' and path.startswith('/admin/'):
            self.serve(WEB,path[len('/admin/'):] or 'index.html');return
        if method=='GET' and path.startswith('/miniapp/'):
            self.serve(MINI,path[len('/miniapp/'):]);return
        if method=='GET' and path.startswith('/media/products/'):
            self.serve(PRODUCT_IMAGES,path[len('/media/products/'):]);return
        if path=='/health':self.reply({'ok':True,'mode':'local-demo'});return
        if path=='/api/admin/login' and method=='POST':
            body=self.body()
            if not secrets.compare_digest(str(body.get('username','')),ADMIN_NAME) or not secrets.compare_digest(str(body.get('password','')),ADMIN_PASS):raise d.ApiError('账号或密码不正确',401)
            token=secrets.token_urlsafe(32)
            with d.transaction() as db:db.execute('INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)',(hashlib.sha256(token.encode()).hexdigest(),d.now()+8*3600000))
            self.reply({'ok':True,'data':{'name':'运营管理员'}},extra={'Set-Cookie':'haomei_admin='+token+'; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=28800'});return
        if path.startswith('/api/admin/'):
            self.require_admin();self.admin(path,method,q);return
        if path.startswith('/api/'):
            origin=self.headers.get('Origin')
            if method!='GET' and origin and origin not in ALLOWED_ORIGINS:raise d.ApiError('请求来源无效',403)
            self.customer(path,method,q);return
        raise d.ApiError('接口不存在',404)
    def admin(self,path,method,q):
        body=self.body() if method in ['POST','PUT','DELETE'] else {}
        parts=path.strip('/').split('/')
        with d.transaction() as db:
            if path=='/api/admin/session':data={'name':'运营管理员','demoMode':True}
            elif path=='/api/admin/logout':
                db.execute('DELETE FROM sessions WHERE token_hash=?',(hashlib.sha256(self.cookie_token().encode()).hexdigest(),));data={}
            elif path=='/api/admin/dashboard':
                orders=d.rows(db,'orders');products=[p for p in d.rows(db,'products') if p.get('status')!='deleted'];proofs=d.rows(db,'proofs')
                data={'products':len(products),'published':sum(p['status']=='published' for p in products),'pendingPrices':sum(not p.get('priceApproved') for p in products),'orders':len(orders),'paidTotal':sum(o['total'] for o in orders if o['status'] in ['paid','verified']),'pendingOrders':sum(o['status']=='pending' for o in orders),'verified':sum(o['status']=='verified' for o in orders),'pendingProofs':sum(p['status']=='pending' for p in proofs),'checkinsToday':sum(c['day']==d.today() for c in d.rows(db,'checkins')),'recentOrders':orders[:6],'logs':d.rows(db,'logs')[:6],'rules':d.get(db,'rules','main')}
            elif path=='/api/admin/rules':
                if method=='PUT':
                    submitted=body
                    if 'section' in body:
                        if body['section'] not in ['pricing','activity','checkin','lottery','pointFlash','membership','pointsEarning']:raise d.ApiError('配置类型无效')
                        submitted=d.get(db,'rules','main');submitted[body['section']]=body['value']
                    value=d.validate_rules(submitted)
                    gifts=d.get(db,'catalog','campaigns')['pointsOffers']
                    if any(not any(g['id']==x['giftId'] for g in gifts) for x in value['pointFlash']['offers']):raise d.ApiError('积分秒杀关联礼品不存在')
                    d.put(db,'rules','main',value);d.audit(db,'修改运营规则','main');d.bump(db)
                data=d.get(db,'rules','main')
            elif path=='/api/admin/product-image' and method=='POST':
                try:raw=base64.b64decode(body.get('base64',''),validate=True)
                except Exception:raise d.ApiError('图片内容无效')
                if not raw or len(raw)>3000000:raise d.ApiError('图片大小应小于3MB')
                ext='png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else 'jpg' if raw.startswith(b'\xff\xd8\xff') else 'webp' if raw[:4]==b'RIFF' and raw[8:12]==b'WEBP' else None
                if not ext:raise d.ApiError('请上传PNG、JPG或WebP图片')
                PRODUCT_IMAGES.mkdir(parents=True,exist_ok=True);name=secrets.token_hex(16)+'.'+ext;(PRODUCT_IMAGES/name).write_bytes(raw)
                data={'url':'/media/products/'+name}
            elif path=='/api/admin/products':
                if method=='POST':
                    pid=d.uid('p');base={'id':pid,'name':'新商品','category':'皮肤管理','tags':[],'desc':'','image':'','hot':False,'price':0,'listPrice':0,'memberPrice':None,'floorPrice':0,'ceilingPrice':0,'priceApproved':False,'status':'draft','sortOrder':len(d.rows(db,'products')),'version':0}
                    d.put(db,'products',pid,base);data=d.update_product(db,pid,body)
                else:data=sorted(d.rows(db,'products'),key=lambda p:p.get('sortOrder',999))
            elif len(parts)==4 and parts[2]=='products' and method=='PUT':data=d.update_product(db,parts[3],body)
            elif len(parts)==4 and parts[2]=='products' and method=='DELETE':data=d.delete_product(db,parts[3])
            elif len(parts)==5 and parts[2]=='products' and parts[4]=='restore' and method=='PUT':data=d.restore_product(db,parts[3])
            elif path=='/api/admin/campaigns':
                if method=='PUT':
                    for key in ['flashOffers','coupons','pointsOffers']:
                        if not isinstance(body.get(key),list):raise d.ApiError('营销配置必须为数组')
                        ids=[x['id'] for x in body[key]]
                        if len(ids)!=len(set(ids)):raise d.ApiError('活动编号不能重复')
                    for item in body['flashOffers']:
                        product=d.get(db,'products',item.get('productId'))
                        if not product:raise d.ApiError('秒杀关联商品不存在')
                        d.integer(item['price'],'秒杀价格',1);d.integer(item['stock'],'秒杀库存',0)
                        if item['price']>product['price']:raise d.ApiError('秒杀价不能高于商品销售价')
                    for item in body['coupons']:
                        for k in ['amount','minSpend','days']:d.integer(item[k],'优惠券'+k,0)
                    for item in body['pointsOffers']:
                        d.integer(item['cost'],'换购积分',1);d.integer(item.get('cashPrice',0),'换购现金价',0)
                    original=d.get(db,'catalog','campaigns',{});original.update({k:body[k] for k in ['flashOffers','coupons','pointsOffers']});d.put(db,'catalog','campaigns',original);d.audit(db,'修改营销配置','campaigns');d.bump(db)
                data=d.get(db,'catalog','campaigns',{})
            elif path=='/api/admin/groups':data=sorted(d.rows(db,'groups'),key=lambda g:g['id'])
            elif len(parts)==4 and parts[2]=='groups' and method=='PUT':
                old=d.get(db,'groups',parts[3]);
                if not old:raise d.ApiError('拼团活动不存在',404)
                value=dict(old,**{k:v for k,v in body.items() if k in ['price','singlePrice','audience','initiator','enabled','limit','members']})
                d.integer(value['price'],'拼团价',1);d.integer(value['singlePrice'],'单购价',1)
                d.integer(value['members'],'成团人数',2,20);d.integer(value['limit'],'限购数量',1,99)
                if value['price']>value['singlePrice']:raise d.ApiError('拼团价不能高于单购价')
                if value['audience'] not in ['new-only','all'] or value['initiator'] not in ['new-only','any']:raise d.ApiError('新老客规则无效')
                d.put(db,'groups',parts[3],value);d.audit(db,'修改拼团规则',parts[3],body);d.bump(db);data=value
            elif path=='/api/admin/orders':data=d.rows(db,'orders')
            elif len(parts)==5 and parts[2]=='orders' and method=='POST':data=d.set_order_status(db,parts[3],parts[4])
            elif path=='/api/admin/users':data=[dict(u,verifiedOrders=d.verified_count(db,u['id'])) for u in d.rows(db,'users')]
            elif path=='/api/admin/proofs':data=d.rows(db,'proofs')
            elif len(parts)==4 and parts[2]=='proofs' and method=='PUT':
                value=d.get(db,'proofs',parts[3]);
                if not value:raise d.ApiError('凭证不存在',404)
                if body.get('status') not in ['approved','rejected']:raise d.ApiError('审核状态无效')
                value.update(status=body['status'],reviewNote=str(body.get('reviewNote',''))[:500],reviewedAt=d.now());d.put(db,'proofs',value['id'],value)
                if value['status']=='rejected':
                    for record in d.rows(db,'draws'):
                        if record.get('proofId')==value['id'] and record['status']=='valid':
                            record.update(status='invalid',reason='凭证审核不符合要求',invalidatedAt=d.now())
                            if record['type']=='points':d.add_points(db,record['userId'],-record['value'],'抽奖凭证撤销 · 积分冲回',record['id']+'-reversal')
                            current_rules=d.get(db,'rules','main')
                            for prize in current_rules['lottery']['prizes']:
                                if prize['id']==record['prizeId'] and prize['type']!='none':prize['stock']+=1
                            d.put(db,'rules','main',current_rules);d.put(db,'draws',record['id'],record)
                d.audit(db,'审核抽奖凭证',value['id'],body);d.bump(db);data=value
            elif path=='/api/admin/draws':data=d.rows(db,'draws')
            elif path=='/api/admin/member-benefits':data=d.rows(db,'benefitClaims')
            elif len(parts)==4 and parts[2]=='member-benefits' and method=='PUT':
                value=d.get(db,'benefitClaims',parts[3])
                if not value:raise d.ApiError('福利领取记录不存在',404)
                if value['status']=='used':raise d.ApiError('该福利已经使用')
                if value['expiresAt']<=d.now():raise d.ApiError('福利已经过期')
                value.update(status='used',usedAt=d.now());d.put(db,'benefitClaims',value['id'],value)
                if value.get('couponKey'):
                    coupon=d.get(db,'couponClaims',value['couponKey']);coupon['status']='\u5df2\u4f7f\u7528';d.put(db,'couponClaims',value['couponKey'],coupon)
                d.audit(db,'会员福利使用',value['id']);d.bump(db);data=value
            elif path=='/api/admin/redemptions':data=d.rows(db,'redemptions')
            elif path=='/api/admin/checkins':data=d.rows(db,'checkins')
            elif path=='/api/admin/logs':data=d.rows(db,'logs')
            elif path=='/api/admin/demo/referral' and method=='POST':
                phone=str(body.get('phone','')).strip()
                if len(phone)!=11 or not phone.isdigit():raise d.ApiError('请填写11位演示手机号')
                user_id='ref-'+hashlib.sha256(phone.encode()).hexdigest()[:12]
                if any(o.get('userId')==user_id and o.get('status')=='verified' for o in d.rows(db,'orders')):raise d.ApiError('该手机号已有核销记录，不重复计入新客')
                d.put(db,'users',user_id,{'id':user_id,'name':'演示受邀顾客','phone':phone,'points':0,'giftBalance':0,'createdAt':d.now()})
                oid=d.uid('REF');value={'id':oid,'userId':user_id,'productId':'p2','productName':'超光子M22','total':128000,'status':'verified','createdAt':d.now(),'verifiedAt':d.now(),'inviterId':d.DEMO_USER,'newAtOrder':True,'demo':True}
                d.put(db,'orders',oid,value);d.audit(db,'模拟新客核销',oid);d.bump(db);data=value
            elif path.startswith('/api/admin/media/'):
                self.serve(UPLOADS,path.split('/')[-1]);return
            elif path.startswith('/api/admin/catalog/'):
                key=parts[-1]
                if key not in ['doctors','clinics','categories']:raise d.ApiError('资料类型无效')
                if method=='PUT':
                    if not isinstance(body.get('items'),list):raise d.ApiError('资料必须是数组')
                    d.put(db,'catalog',key,body['items']);d.audit(db,'修改资料',key);d.bump(db)
                data=d.get(db,'catalog',key,[])
            else:raise d.ApiError('后台接口不存在',404)
        self.reply({'ok':True,'data':data})
    def customer(self,path,method,q):
        body=self.body() if method in ['POST','PUT'] else {};user_id=self.user_id()
        with d.transaction() as db:
            if path=='/api/bootstrap':data=d.bootstrap(db)
            elif path=='/api/customer/membership':data=d.membership_state(db,user_id)
            elif path=='/api/customer/membership/claim' and method=='POST':data=d.claim_member_benefit(db,user_id,body.get('benefitId'))
            elif path=='/api/customer/state':data=d.customer_state(db,user_id)
            elif path=='/api/customer/point-flash':data=d.point_flash_state(db,user_id)
            elif path=='/api/customer/point-flash/redeem' and method=='POST':data=d.point_flash_redeem(db,user_id,body.get('offerId'))
            elif path=='/api/customer/redeem' and method=='POST':
                offers=d.get(db,'catalog','campaigns')['pointsOffers'];offer=next((x for x in offers if x['id']==body.get('offerId')),None)
                if not offer:raise d.ApiError('换购礼品不存在')
                key=user_id+':'+offer['id']
                if d.get(db,'redemptions',key):raise d.ApiError('此礼品已兑换')
                if d.get(db,'users',user_id)['points']<offer['cost']:raise d.ApiError('积分不足')
                cash=offer.get('cashPrice',0);oid=d.uid('DEMO-PC') if cash else ''
                data={'id':key,'userId':user_id,'offerId':offer['id'],'name':offer['name'],'cost':offer['cost'],'cashPrice':cash,'orderId':oid,'status':'待付款' if cash else '待领取','createdAt':d.now()}
                if cash:d.put(db,'orders',oid,{'id':oid,'kind':'points-cash','redemptionId':key,'userId':user_id,'productId':offer['id'],'productName':offer['name'],'total':cash,'status':'pending','createdAt':d.now(),'demo':True})
                d.put(db,'redemptions',key,data);d.add_points(db,user_id,-offer['cost'],'换购 · '+offer['name'],key);d.bump(db)
            elif path=='/api/customer/coupon/claim' and method=='POST':
                offer=next((x for x in d.get(db,'catalog','campaigns')['coupons'] if x['id']==body.get('offerId')),None)
                if not offer:raise d.ApiError('礼券不存在')
                key=user_id+':'+offer['id']
                if d.get(db,'couponClaims',key):raise d.ApiError('您已领取过此券')
                data=dict(offer,userId=user_id,claimedAt=d.now(),expiresAt=d.now()+offer['days']*86400000,status='未使用');d.put(db,'couponClaims',key,data);d.bump(db)
            elif path=='/api/customer/checkin' and method=='POST':data=d.check_in(db,user_id)
            elif path=='/api/customer/activity/claim' and method=='POST':data=d.claim_stage(db,user_id,body.get('stageId'))
            elif path=='/api/customer/uploads' and method=='POST':
                try:raw=base64.b64decode(body.get('base64',''),validate=True)
                except Exception:raise d.ApiError('图片内容无效')
                if not raw or len(raw)>3000000:raise d.ApiError('图片大小应小于3MB')
                ext='png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else 'jpg' if raw.startswith(b'\xff\xd8\xff') else 'webp' if raw[:4]==b'RIFF' and raw[8:12]==b'WEBP' else None
                if not ext:raise d.ApiError('请上传PNG、JPG或WebP图片')
                UPLOADS.mkdir(exist_ok=True);name=secrets.token_hex(16)+'.'+ext;(UPLOADS/name).write_bytes(raw);data={'imageId':name}
            elif path=='/api/customer/proofs' and method=='POST':
                name=str(body.get('imageId',''))
                if '/' in name or '\\' in name or not (UPLOADS/name).is_file():raise d.ApiError('请先上传订单截图')
                text=str(body.get('description','')).strip()
                if not text:raise d.ApiError('请填写订单说明')
                pid=d.uid('PROOF');data={'id':pid,'userId':user_id,'phone':d.get(db,'users',user_id)['phone'],'description':text[:500],'imageId':name,'status':'pending','reviewNote':'','createdAt':d.now()};d.put(db,'proofs',pid,data);d.bump(db)
            elif path=='/api/customer/lottery/draw' and method=='POST':data=d.draw(db,user_id,body.get('proofId'))
            elif path=='/api/customer/group-eligibility':
                gid=q.get('offerId',[''])[0];role=q.get('role',['participant'])[0];group=d.get(db,'groups',gid)
                if not group:raise d.ApiError('活动不存在',404)
                if not group.get('enabled'):raise d.ApiError('拼团活动已关闭')
                new=d.verified_count(db,user_id)==0;requires=group.get('audience')=='new-only' if role=='participant' else group.get('initiator')=='new-only';data={'eligible':not requires or new,'isNewCustomer':new,'reason':'' if not requires or new else '本活动仅限无历史核销记录的新客参与'}
            elif path=='/api/customer/sync-demo' and method=='POST':
                # This bridge only mirrors demonstration orders; it is not a payment endpoint.
                status_map={'待付款':'pending','待使用':'paid','已完成':'verified'}
                for source in body.get('orders',[])[:100]:
                    oid=str(source.get('id',''))
                    if not oid.startswith('DEMO') or d.get(db,'orders',oid):continue
                    items=source.get('items',[]);first=items[0] if items else {};pid=first.get('id');product=d.get(db,'products',pid)
                    if not product or product.get('status')!='published':continue
                    if any(not d.get(db,'products',item.get('id')) or d.get(db,'products',item.get('id')).get('status')!='published' for item in items):continue
                    group=d.get(db,'groups',source.get('activityId',''));total=0
                    if group:total=group['singlePrice'] if source.get('kind')=='group-single' else group['price']
                    else:
                        for item in items:
                            p=d.get(db,'products',item.get('id'))
                            if p:total+=p['price']*max(1,min(99,int(item.get('quantity',1))))
                    value={'id':oid,'userId':user_id,'productId':pid,'productName':product['name'],'total':total,'status':'pending','createdAt':source.get('createdAt',d.now()),'demo':True,'newAtOrder':d.verified_count(db,user_id)==0,'activityId':source.get('activityId')};d.put(db,'orders',oid,value)
                data={'synced':True};d.bump(db)
            else:raise d.ApiError('小程序接口不存在',404)
        self.reply({'ok':True,'data':data})

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,default=8766);args=parser.parse_args()
    if args.host not in ['127.0.0.1','localhost'] and ADMIN_PASS=='demo2026':raise SystemExit('非本机访问请先设置 ADMIN_PASSWORD，并配置正式身份认证。')
    d.initialize();server=ThreadingHTTPServer((args.host,args.port),Handler)
    print('Admin: http://%s:%s/admin/ (local demo)'%(args.host,args.port),flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
