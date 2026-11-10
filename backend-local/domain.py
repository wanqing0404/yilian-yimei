"""Persistent local demo domain. Money is stored as integer cents."""
import datetime as dt
import hashlib
import json
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'data' / 'operations.sqlite3'
TZ = dt.timezone(dt.timedelta(hours=8))
DEMO_USER = 'demo-user'

class ApiError(Exception):
    def __init__(self, message, status=400):
        self.message, self.status = message, status
        super().__init__(message)

def now(): return int(time.time() * 1000)
def uid(prefix): return prefix + str(now()) + secrets.token_hex(3)
def today(): return dt.datetime.now(TZ).date().isoformat()
def dumps(value): return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

def connect():
    db = sqlite3.connect(str(DB_PATH), timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    return db

@contextmanager
def transaction():
    db = connect()
    try:
        db.execute('BEGIN IMMEDIATE')
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally: db.close()

def get(db, kind, key, default=None):
    row = db.execute('SELECT payload FROM records WHERE kind=? AND id=?', (kind, key)).fetchone()
    return json.loads(row['payload']) if row else default

def rows(db, kind):
    return [json.loads(r['payload']) for r in db.execute('SELECT payload FROM records WHERE kind=? ORDER BY updated_at DESC,id', (kind,))]

def put(db, kind, key, value):
    db.execute('INSERT INTO records(kind,id,payload,updated_at) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at', (kind, key, dumps(value), now()))

def bump(db):
    value = get(db, 'meta', 'revision', 1) + 1
    put(db, 'meta', 'revision', value)
    return value

def audit(db, action, target, details=None):
    put(db, 'logs', uid('LOG'), {'id': uid('L'), 'action': action, 'target': target, 'actor': 'admin', 'details': details or {}, 'createdAt': now()})

def default_rules():
    return {
        'newCustomerDefinition': 'no_verified_orders',
        'membership':default_membership(),
        'pointsEarning':{'enabled':False,'trigger':'verified','pointsPerYuan':1},
        'pointFlash': {'enabled':False,'title':'积分秒杀日','scheduleMode':'weekly','weekDay':5,'monthDay':20,'startTime':'20:00','durationMinutes':60,'maxPerPhone':1,'minCheckins':0,'offers':[{'id':'pf1','giftId':'r1','points':500,'stock':10,'limit':1}]},
        'lottery': {'enabled': True, 'title': '社群订单抽奖', 'requireProof': True, 'maxPerPhone': 1,
            'prizes': [{'id':'lp1','name':'10积分','type':'points','value':10,'weight':15,'stock':100}, {'id':'lp2','name':'50积分','type':'points','value':50,'weight':5,'stock':30}, {'id':'lp3','name':'谢谢参与','type':'none','value':0,'weight':80,'stock':99999}]},
        'checkin': {'enabled': True, 'theme': 'flower', 'mode': 'consecutive', 'schedule': [10,15,20,25,30,35,50]},
        'activity': {'enabled': True, 'id':'invite-new', 'title':'邀请新客礼遇', 'visual':'steps', 'stages': [
            {'id':'s1','name':'第1站','threshold':1,'points':100}, {'id':'s2','name':'第2站','threshold':2,'points':150}, {'id':'s3','name':'第3站','threshold':3,'points':200}, {'id':'s4','name':'第4站','threshold':5,'points':300}]},
        'pricing': {'approvalRequired': True, 'showDemoPrices': True},
        'brand': {'name':'医联·好美','serviceHours':'09:00 - 20:00'}
    }

def initialize():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = connect()
    db.executescript('''CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(kind,id));
CREATE INDEX IF NOT EXISTS records_kind ON records(kind,updated_at);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);''')
    db.commit(); db.close()
    with transaction() as db:
        if get(db, 'meta', 'initialized'):
            rules=get(db,'rules','main')
            changed=False
            if 'comments' in rules:rules.pop('comments');changed=True
            for section in ['pointFlash','membership','pointsEarning']:
                if section not in rules:rules[section]=default_rules()[section];changed=True
            if changed:put(db,'rules','main',rules);bump(db)
            return
        seed = json.loads((ROOT / 'data' / 'seed.json').read_text())
        for sort_order,p in enumerate(seed['data']['products']):
            if p.get('hidden'): continue
            p = dict(p, sortOrder=sort_order, listPrice=p.get('listPrice',p['price']), memberPrice=p.get('memberPrice'), floorPrice=p.get('floorPrice',0), ceilingPrice=p.get('ceilingPrice',0), priceApproved=p.get('priceApproved',False), status=p.get('status','published'), version=p.get('version',1))
            put(db, 'products', p['id'], p)
        for i,g in enumerate(seed['campaigns']['groupOffers']):
            g = dict(g, audience='all' if i==1 else 'new-only', initiator='any' if i<2 else 'new-only', enabled=True)
            put(db, 'groups', g['id'], g)
        for kind in ['categories','doctors','clinics']:
            put(db, 'catalog', kind, seed['data'][kind])
        put(db, 'catalog', 'campaigns', seed['campaigns'])
        put(db, 'rules', 'main', default_rules())
        for user_id,name,phone in [(DEMO_USER,'演示顾客','19900000000'),('demo-new','演示新客','19900000001'),('demo-old','演示老客','19900000002')]:
            put(db, 'users', user_id, {'id':user_id,'name':name,'phone':phone,'points':2860 if user_id==DEMO_USER else 0,'giftBalance':0,'createdAt':now()})
        orders = [
            {'id':'SEED-PENDING','userId':DEMO_USER,'productId':'p1','productName':'热玛吉FLX','total':299900,'status':'pending','createdAt':now(),'demo':True},
            {'id':'SEED-PAID','userId':'demo-new','productId':'p2','productName':'超光子M22','total':128000,'status':'paid','createdAt':now(),'demo':True,'inviterId':DEMO_USER,'newAtOrder':True},
            {'id':'SEED-VERIFIED','userId':'demo-old','productId':'p4','productName':'嗨体熊猫针','total':69900,'status':'verified','createdAt':now()-86400000,'verifiedAt':now()-86400000,'demo':True,'newAtOrder':False}]
        for o in orders: put(db,'orders',o['id'],o)
        put(db,'meta','revision',1); put(db,'meta','initialized',True)

def verified_count(db, user_id): return sum(1 for o in rows(db,'orders') if o.get('userId')==user_id and (o.get('verifiedAt') or o.get('status')=='verified'))

def customer_state(db, user_id=DEMO_USER):
    user = get(db,'users',user_id)
    if not user: raise ApiError('演示顾客不存在',404)
    checkins = [c for c in rows(db,'checkins') if c['userId']==user_id]
    progress = len({o.get('userId') for o in rows(db,'orders') if o.get('inviterId')==user_id and o.get('newAtOrder') and o.get('status')=='verified'})
    return dict(user, isNewCustomer=verified_count(db,user_id)==0, verifiedOrders=verified_count(db,user_id),
        checkedInToday=any(c['day']==today() for c in checkins), checkins=checkins,
        activityProgress=progress, claims=[c for c in rows(db,'claims') if c['userId']==user_id],
        proofs=[{k:v for k,v in x.items() if k!='privatePath'} for x in rows(db,'proofs') if x['userId']==user_id],
        draws=[x for x in rows(db,'draws') if x['userId']==user_id],
        orders=[x for x in rows(db,'orders') if x['userId']==user_id],
        redemptions=[x for x in rows(db,'redemptions') if x['userId']==user_id],
        coupons=[x for x in rows(db,'couponClaims') if x['userId']==user_id],
        pointTransactions=[x for x in rows(db,'points') if x['userId']==user_id])

def bootstrap(db):
    products=sorted(rows(db,'products'),key=lambda p:p.get('sortOrder',999))
    for p in products:
        p['hidden']=p.get('status')!='published'
        p['pricePending']=bool(get(db,'rules','main')['pricing']['approvalRequired'] and not p.get('priceApproved') and not get(db,'rules','main')['pricing']['showDemoPrices'])
    groups=sorted(rows(db,'groups'),key=lambda g:g['id'])
    campaigns=get(db,'catalog','campaigns',{})
    campaigns['groupOffers']=groups
    return {'revision':get(db,'meta','revision',1),'demoMode':True,'products':products,
        'categories':get(db,'catalog','categories',[]),'doctors':get(db,'catalog','doctors',[]),'clinics':get(db,'catalog','clinics',[]),
        'campaigns':campaigns,'rules':get(db,'rules','main'),'customer':customer_state(db),'pointFlash':point_flash_state(db),'membership':membership_state(db)}

def add_points(db,user_id,amount,reason,key=None):
    user=get(db,'users',user_id)
    user['points']+=amount; put(db,'users',user_id,user)
    put(db,'points',key or uid('PT'),{'id':key or uid('PT'),'userId':user_id,'amount':amount,'title':reason,'createdAt':now()})
    return user['points']

def integer(value,label,minimum=0,maximum=100000000):
    if isinstance(value,bool) or not isinstance(value,int) or value<minimum or value>maximum: raise ApiError(label+'必须为有效整数')
    return value

def validate_rules(r):
    r.pop('comments',None)
    r['newCustomerDefinition']='no_verified_orders'
    earning=r.setdefault('pointsEarning',{'enabled':False,'trigger':'verified','pointsPerYuan':1})
    if not isinstance(earning['enabled'],bool) or earning['trigger'] not in ['paid','verified']:raise ApiError('消费积分规则无效')
    integer(earning['pointsPerYuan'],'每元消费积分',0,100)
    member=r.setdefault('membership',default_membership())
    if member['basis'] not in ['verified_spend','paid_spend','growth']:raise ApiError('会员升级口径无效')
    levels=member['levels']
    if not levels or levels[0]['threshold']!=0:raise ApiError('基础会员门槛必须为0')
    if len({x['id'] for x in levels})!=len(levels):raise ApiError('会员等级编号重复')
    previous=-1
    for level in levels:
        integer(level['threshold'],'等级门槛',0,100000000)
        if level['threshold']<=previous:raise ApiError('等级门槛s must increase')
        previous=level['threshold']
        if not str(level['name']).strip():raise ApiError('请输入会员名称')
    for benefit in member['benefits']:
        integer(benefit['quota'],'福利次数',1,100)
        if benefit['type'] not in ['coupon','perk']:raise ApiError('福利类型无效')
        if any(x not in [l['id'] for l in levels] for x in benefit['levelIds']):raise ApiError('关联会员等级无效')
    for k in ['perYuan','perCheckin','perInvite']:integer(member['growth'][k],'成长系数',0,1000)

    pf=r.get('pointFlash',default_rules()['pointFlash'])
    r['pointFlash']=pf
    if not isinstance(pf.get('enabled'),bool):raise ApiError('积分秒杀开关无效')
    if pf.get('scheduleMode') not in ['weekly','monthly']:raise ApiError('积分秒杀排期无效')
    integer(pf['weekDay'],'周几',1,7);integer(pf['monthDay'],'每月日期',1,28)
    integer(pf['durationMinutes'],'秒杀时长',5,1440);integer(pf['maxPerPhone'],'每手机号限次',1,99);integer(pf['minCheckins'],'累计签到门槛',0,365)
    try:dt.datetime.strptime(pf['startTime'],'%H:%M')
    except (ValueError,TypeError):raise ApiError('开始时间应为HH:MM')
    if not isinstance(pf['offers'],list) or not pf['offers']:raise ApiError('请配置至少一个积分秒杀礼品')
    if len({x['id'] for x in pf['offers']})!=len(pf['offers']):raise ApiError('积分秒杀礼品编号不能重复')
    for item in pf['offers']:
        integer(item['points'],'秒杀积分',1,10000000);integer(item['stock'],'本场库存',0,100000);integer(item['limit'],'每人限购',1,99)
    schedule=r['checkin']['schedule']
    if not isinstance(schedule,list) or not 1<=len(schedule)<=31: raise ApiError('签到周期应为1至31天')
    for x in schedule: integer(x,'签到积分',0,100000)
    if r['checkin'].get('theme') not in ['flower','vegetable']: raise ApiError('签到主题无效')
    if r['activity'].get('visual') not in ['steps','regions']: raise ApiError('活动展示形式无效')
    for section,keys in [('checkin',['enabled']),('lottery',['enabled','requireProof']),('activity',['enabled']),('pricing',['approvalRequired','showDemoPrices'])]:
        for key in keys:
            if not isinstance(r[section].get(key),bool): raise ApiError('开关字段必须为布尔值')
    if r['checkin'].get('mode') not in ['consecutive','cumulative']: raise ApiError('签到累计规则无效')
    integer(r['lottery']['maxPerPhone'],'每手机号抽奖次数',0,1000)
    prizes=r['lottery']['prizes']
    if not prizes or len({p['id'] for p in prizes})!=len(prizes): raise ApiError('奖品配置无效')
    for p in prizes:
        if p['type'] not in ['points','gift','none']: raise ApiError('奖品类型无效')
        for key in ['value','weight','stock']: integer(p[key],'奖品'+key,0,1000000)
    if sum(p['weight'] for p in prizes)<=0: raise ApiError('奖品权重合计必须大于0')
    stages=r['activity']['stages']
    if not stages or len({s['id'] for s in stages})!=len(stages): raise ApiError('阶段编号不能重复')
    for s in stages:
        integer(s['threshold'],'阶段目标',1,10000);integer(s['points'],'阶段奖励',0,1000000)
    if len({s['threshold'] for s in stages})!=len(stages): raise ApiError('阶段目标不能重复')
    return r

def update_product(db,pid,patch):
    old=get(db,'products',pid)
    if not old: raise ApiError('商品不存在',404)
    if old.get('status')=='deleted': raise ApiError('商品已删除，请先从回收站恢复',409)
    p=dict(old,**{k:v for k,v in patch.items() if k in ['name','category','desc','image','price','pointsPrice','listPrice','memberPrice','floorPrice','ceilingPrice','status','priceApproved']})
    for key in ['price','listPrice','floorPrice','ceilingPrice']: integer(p.get(key,0),key)
    if p.get('pointsPrice') is not None: integer(p['pointsPrice'],'所需积分')
    if p.get('memberPrice') is not None: integer(p['memberPrice'],'会员价')
    if p['price']>p['listPrice']: raise ApiError('销售价不能高于划线价，请先核对价格')
    if p.get('memberPrice') is not None and p['memberPrice']>p['price']: raise ApiError('会员价不能高于销售价')
    if p.get('floorPrice') and p['price']<p['floorPrice']: raise ApiError('销售价低于设置的价格下限')
    if p.get('ceilingPrice') and p['price']>p['ceilingPrice']: raise ApiError('销售价高于设置的价格上限')
    if p.get('status') not in ['draft','published']: raise ApiError('上架状态无效')
    if not str(p.get('name','')).strip(): raise ApiError('请填写商品名称')
    p['version']=old.get('version',1)+1; p['updatedAt']=now();put(db,'products',pid,p);audit(db,'修改商品与价格',pid,patch);bump(db)
    return p

def delete_product(db,pid):
    p=get(db,'products',pid)
    if not p: raise ApiError('商品不存在',404)
    if p.get('status')=='deleted': return p
    linked_groups=any(g.get('productId')==pid for g in rows(db,'groups'))
    linked_flash=any(o.get('productId')==pid for o in get(db,'catalog','campaigns',{}).get('flashOffers',[]))
    if linked_groups or linked_flash:
        raise ApiError('该商品关联拼团或秒杀活动，请先取消活动关联后再删除',409)
    p=dict(p,status='deleted',deletedAt=now(),version=p.get('version',1)+1)
    put(db,'products',pid,p);audit(db,'删除商品（移至回收站）',pid,{'name':p['name']});bump(db)
    return p

def restore_product(db,pid):
    p=get(db,'products',pid)
    if not p: raise ApiError('商品不存在',404)
    if p.get('status')!='deleted': raise ApiError('该商品不在回收站中',409)
    p=dict(p,status='draft',restoredAt=now(),version=p.get('version',1)+1)
    p.pop('deletedAt',None)
    put(db,'products',pid,p);audit(db,'恢复商品（保持下架）',pid,{'name':p['name']});bump(db)
    return p


def set_order_status(db,oid,status):
    o=get(db,'orders',oid)
    if not o: raise ApiError('订单不存在',404)
    allowed={'pending':['paid','cancelled'],'paid':['verified','refunded'],'verified':['refunded']}
    if status not in allowed.get(o['status'],[]): raise ApiError('当前订单状态不允许此操作')
    if status=='verified':
        o.setdefault('newAtOrder',verified_count(db,o['userId'])==0);o['verifiedAt']=now()
    if o.get('kind')=='points-cash':
        redemption=get(db,'redemptions',o.get('redemptionId'))
        if redemption:
            redemption['status']={'paid':'待领取','verified':'已领取','refunded':'已退款','cancelled':'已取消'}[status]
            if status in ['refunded','cancelled'] and not redemption.get('pointsRefunded'):
                add_points(db,o['userId'],redemption['cost'],'积分换购取消 · 积分退回',redemption['id']+'-refund');redemption['pointsRefunded']=True
            put(db,'redemptions',redemption['id'],redemption)
    earning=get(db,'rules','main').get('pointsEarning',{})
    if o.get('kind')!='points-cash' and earning.get('enabled') and status==earning.get('trigger') and not o.get('pointsAwarded'):
        amount=(o['total']//100)*earning.get('pointsPerYuan',0)
        if amount:add_points(db,o['userId'],amount,'消费奖励积分',o['id']+'-earn');o['pointsAwarded']=amount
    if status in ['refunded','cancelled'] and o.get('pointsAwarded') and not o.get('pointsAwardReversed'):
        add_points(db,o['userId'],-o['pointsAwarded'],'消费退款积分冲回',o['id']+'-earn-reversal');o['pointsAwardReversed']=True
    o['status']=status;put(db,'orders',oid,o);audit(db,'订单状态变更',oid,{'status':status});bump(db)
    return o


def check_in(db,user_id):
    rules=get(db,'rules','main')['checkin']
    if not rules['enabled']: raise ApiError('签到尚未开放')
    key=user_id+':'+today()
    if get(db,'checkins',key): raise ApiError('今天已经签到')
    entries=sorted([x for x in rows(db,'checkins') if x['userId']==user_id],key=lambda x:x['day'])
    if rules['mode']=='cumulative': day=len(entries)+1
    else:
        yesterday=(dt.datetime.now(TZ).date()-dt.timedelta(days=1)).isoformat()
        day=entries[-1]['streak']+1 if entries and entries[-1]['day']==yesterday else 1
    amount=rules['schedule'][(day-1)%len(rules['schedule'])]
    record={'id':key,'userId':user_id,'day':today(),'streak':day,'points':amount,'createdAt':now()}
    put(db,'checkins',key,record);balance=add_points(db,user_id,amount,'每日签到',key);bump(db)
    return {'record':record,'points':balance}


def claim_stage(db,user_id,stage_id):
    rules=get(db,'rules','main')['activity']
    if not rules['enabled']: raise ApiError('活动未开放')
    stage=next((s for s in rules['stages'] if s['id']==stage_id),None)
    if not stage: raise ApiError('阶段不存在')
    key=rules['id']+':'+user_id+':'+stage_id
    if get(db,'claims',key): raise ApiError('此阶段奖励已领取')
    if customer_state(db,user_id)['activityProgress']<stage['threshold']: raise ApiError('尚未达到阶段目标')
    record={'id':key,'activityId':rules['id'],'userId':user_id,'stageId':stage_id,'points':stage['points'],'createdAt':now()}
    put(db,'claims',key,record);balance=add_points(db,user_id,stage['points'],'活动奖励 · '+stage['name'],key);bump(db)
    return {'record':record,'points':balance}


def draw(db,user_id,proof_id=None):
    all_rules=get(db,'rules','main');r=all_rules['lottery']
    if not r['enabled']: raise ApiError('抽奖未开放')
    user=get(db,'users',user_id)
    if r['requireProof']:
        proof=get(db,'proofs',proof_id)
        if not proof or proof['userId']!=user_id or proof['status']!='approved': raise ApiError('请先提交截图并等待审核通过')
    previous=[d for d in rows(db,'draws') if d['phone']==user['phone']]
    if r['maxPerPhone'] and len(previous)>=r['maxPerPhone']: raise ApiError('该手机号已达到抽奖次数上限')
    pool=[p for p in r['prizes'] if p['weight']>0 and (p['type']=='none' or p['stock']>0)]
    if not pool: raise ApiError('奖品已抽完')
    pick=secrets.randbelow(sum(p['weight'] for p in pool));prize=pool[-1]
    for p in pool:
        if pick<p['weight']:prize=p;break
        pick-=p['weight']
    record={'id':uid('DRAW'),'userId':user_id,'phone':user['phone'],'proofId':proof_id,'prizeId':prize['id'],'prizeName':prize['name'],'type':prize['type'],'value':prize['value'],'status':'valid','createdAt':now()}
    if prize['type']!='none':
        prize['stock']-=1;put(db,'rules','main',all_rules)
    if prize['type']=='points':add_points(db,user_id,prize['value'],'抽奖奖励',record['id'])
    put(db,'draws',record['id'],record);bump(db)
    return record


def point_flash_window(rule, at=None):
    current=dt.datetime.fromtimestamp((now() if at is None else at)/1000,TZ)
    hour,minute=map(int,rule['startTime'].split(':'))
    if rule['scheduleMode']=='weekly':
        begin=(current-dt.timedelta(days=current.isoweekday()-rule['weekDay'])).replace(hour=hour,minute=minute,second=0,microsecond=0)
        previous=begin-dt.timedelta(days=7)
        if previous<=current<previous+dt.timedelta(minutes=rule['durationMinutes']):begin=previous
        end=begin+dt.timedelta(minutes=rule['durationMinutes'])
        if current>=end:begin+=dt.timedelta(days=7)
    else:
        begin=current.replace(day=rule['monthDay'],hour=hour,minute=minute,second=0,microsecond=0)
        previous=begin.replace(year=begin.year-1,month=12) if begin.month==1 else begin.replace(month=begin.month-1)
        if previous<=current<previous+dt.timedelta(minutes=rule['durationMinutes']):begin=previous
        end=begin+dt.timedelta(minutes=rule['durationMinutes'])
        if current>=end:
            begin=begin.replace(year=begin.year+1,month=1) if begin.month==12 else begin.replace(month=begin.month+1)
    end=begin+dt.timedelta(minutes=rule['durationMinutes'])
    return {'active':bool(rule['enabled'] and begin<=current<end),'enabled':rule['enabled'],'startAt':int(begin.timestamp()*1000),'endAt':int(end.timestamp()*1000),'periodKey':begin.strftime('%Y%m%d%H%M')}


def point_flash_state(db,user_id=DEMO_USER):
    rule=get(db,'rules','main').get('pointFlash',default_rules()['pointFlash']);window=point_flash_window(rule)
    gifts=get(db,'catalog','campaigns')['pointsOffers'];claims=[x for x in rows(db,'redemptions') if x.get('kind')=='point-flash' and x.get('periodKey')==window['periodKey']]
    user=get(db,'users',user_id);own=[x for x in claims if x.get('phone')==user['phone']]
    offers=[]
    for item in rule['offers']:
        gift=next((g for g in gifts if g['id']==item['giftId']),None)
        if gift:offers.append(dict(item,name=gift['name'],image=gift.get('image',''),remaining=max(0,item['stock']-sum(x.get('flashOfferId')==item['id'] for x in claims)),claimed=sum(x.get('flashOfferId')==item['id'] for x in own)))
    return dict(window,title=rule['title'],scheduleMode=rule['scheduleMode'],weekDay=rule['weekDay'],monthDay=rule['monthDay'],startTime=rule['startTime'],maxPerPhone=rule['maxPerPhone'],minCheckins=rule['minCheckins'],claimedCount=len(own),offers=offers)


def point_flash_redeem(db,user_id,offer_id):
    state=point_flash_state(db,user_id)
    if not state['active']:raise ApiError('积分秒杀尚未开放，请在活动时间参与')
    if state['claimedCount']>=state['maxPerPhone']:raise ApiError('本场该手机号已达到兑换上限')
    offer=next((x for x in state['offers'] if x['id']==offer_id),None)
    if not offer:raise ApiError('秒杀礼品不存在')
    if offer['remaining']<=0:raise ApiError('本场礼品已兑完')
    if offer['claimed']>=offer['limit']:raise ApiError('此礼品本场已达到限购数量')
    if len([x for x in rows(db,'checkins') if x['userId']==user_id])<state['minCheckins']:raise ApiError('累计签到天数尚未达到参与门槛')
    user=get(db,'users',user_id)
    if user['points']<offer['points']:raise ApiError('积分不足，可通过签到与活动继续积累')
    record={'id':uid('PF'),'kind':'point-flash','userId':user_id,'phone':user['phone'],'offerId':offer['giftId'],'flashOfferId':offer['id'],'periodKey':state['periodKey'],'name':offer['name'],'cost':offer['points'],'cashPrice':0,'status':'待领取','createdAt':now()}
    put(db,'redemptions',record['id'],record);add_points(db,user_id,-record['cost'],'积分秒杀 · '+record['name'],record['id']);bump(db)
    return record


def default_membership():
    return {'basis':'verified_spend','growth':{'perYuan':1,'perCheckin':5,'perInvite':20},
        'levels':[{'id':'silver','name':'银雾会员','tag':'SVIP','threshold':0},{'id':'star','name':'星曜会员','tag':'STAR','threshold':300000},{'id':'premium','name':'臻享会员','tag':'PREMIUM','threshold':1000000},{'id':'black','name':'黑金会员','tag':'BLACK','threshold':3000000}],
        'benefits':[{'id':'mb1','name':'季度会员礼券','description':'领取本季会员礼券，按礼券门槛使用','type':'coupon','couponId':'cp1','quota':1,'levelIds':['silver','star','premium','black']},{'id':'mb2','name':'专属会员礼遇','description':'进阶会员专属，领取后由门店安排','type':'perk','couponId':'','quota':1,'levelIds':['star','premium','black']},{'id':'mb3','name':'臻享心意礼','description':'本季专属心意，具体内容以机构公示为准','type':'perk','couponId':'','quota':1,'levelIds':['premium','black']}],
        'seasonTitle':'本季积分好物','featuredOfferIds':['r1','r2','r3']}


def membership_state(db,user_id=DEMO_USER):
    rule=get(db,'rules','main').get('membership',default_membership());customer=customer_state(db,user_id);orders=[o for o in rows(db,'orders') if o['userId']==user_id]
    paid=sum(o['total'] for o in orders if o['status'] in ['paid','verified']);verified=sum(o['total'] for o in orders if o['status']=='verified')
    growth=(paid//100)*rule['growth']['perYuan']+len(customer['checkins'])*rule['growth']['perCheckin']+customer['activityProgress']*rule['growth']['perInvite']
    metric={'verified_spend':verified,'paid_spend':paid,'growth':growth}[rule['basis']]
    levels=rule['levels'];index=max(i for i,x in enumerate(levels) if metric>=x['threshold']);level=levels[index];next_level=levels[index+1] if index+1<len(levels) else None
    current=dt.datetime.now(TZ);quarter=(current.month-1)//3+1;season=str(current.year)+'Q'+str(quarter)
    end=dt.datetime(current.year+1,1,1,tzinfo=TZ) if quarter==4 else dt.datetime(current.year,quarter*3+1,1,tzinfo=TZ)
    records=[x for x in rows(db,'benefitClaims') if x['userId']==user_id];season_records=[x for x in records if x['season']==season]
    benefits=[]
    for b in rule['benefits']:
        claims=[x for x in season_records if x['benefitId']==b['id']]
        benefits.append(dict(b,eligible=level['id'] in b['levelIds'],claimed=len(claims),used=sum(x['status']=='used' for x in claims),remaining=max(0,b['quota']-len(claims)),unlockLevel=next((l['name'] for l in levels if l['id'] in b['levelIds']),'待配置')))
    offers=get(db,'catalog','campaigns')['pointsOffers'];featured=[x for oid in rule['featuredOfferIds'] for x in offers if x['id']==oid]
    earned=sum(x['amount'] for x in customer['pointTransactions'] if x['amount']>0)
    return {'points':customer['points'],'basis':rule['basis'],'metric':metric,'growth':growth,'level':level,'levels':levels,'levelIndex':index,'nextLevel':next_level,'gap':max(0,next_level['threshold']-metric) if next_level else 0,'progress':min(100,round(100*(metric-level['threshold'])/(next_level['threshold']-level['threshold']))) if next_level else 100,'benefits':benefits,'benefitRecords':records,'season':season,'seasonEnd':int(end.timestamp()*1000),'seasonTitle':rule['seasonTitle'],'featured':featured,'journey':[{'id':'join','title':'开启会员旅程','description':'查看等级与专属礼遇','done':True},{'id':'checkin','title':'养成每日签到','description':'已签到'+str(len(customer['checkins']))+'天','done':bool(customer['checkins'])},{'id':'redeem','title':'让积分变成好物','description':'已兑换'+str(len(customer['redemptions']))+'份礼遇','done':bool(customer['redemptions'])},{'id':'upgrade','title':'解锁下一重礼遇','description':next_level['name'] if next_level else '已达最高等级','done':next_level is None}],'earnedPoints':earned,'usedBenefits':sum(x['status']=='used' for x in records),'redeemedCount':len(customer['redemptions'])}


def claim_member_benefit(db,user_id,benefit_id):
    state=membership_state(db,user_id);benefit=next((b for b in state['benefits'] if b['id']==benefit_id),None)
    if not benefit or not benefit['eligible']:raise ApiError('当前等级尚未解锁此福利')
    if not benefit['remaining']:raise ApiError('本季此福利已全部领取')
    rid=uid('MB');record={'id':rid,'userId':user_id,'benefitId':benefit_id,'benefitName':benefit['name'],'season':state['season'],'levelName':state['level']['name'],'status':'claimed','createdAt':now(),'expiresAt':state['seasonEnd']}
    if benefit['type']=='coupon':
        offer=next((x for x in get(db,'catalog','campaigns')['coupons'] if x['id']==benefit.get('couponId')),None)
        if not offer:raise ApiError('会员礼券尚未配置，请联系机构')
        key='MEMBER-'+rid;coupon=dict(offer,id=key,originalOfferId=offer['id'],userId=user_id,claimedAt=now(),expiresAt=min(state['seasonEnd'],now()+offer['days']*86400000),status='未使用');put(db,'couponClaims',key,coupon);record['couponKey']=key
    put(db,'benefitClaims',rid,record);bump(db);return record
