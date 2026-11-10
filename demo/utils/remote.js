// 本机联调地址；正式发布时替换为已配置的 HTTPS 服务域名。
const BASE='';
const KEY='haomei_share_client_v1';
let snapshot=null,pending=null;
function request(path,method,body){return new Promise((resolve,reject)=>{wx.request({url:BASE+'/api/'+path,method:method||'GET',data:body,timeout:5000,header:{'Content-Type':'application/json','X-Demo-User':'demo-user'},success:r=>{if(r.statusCode>=200&&r.statusCode<300&&r.data.ok)resolve(r.data.data);else reject(new Error(r.data.error||'操作失败'));},fail:()=>reject(new Error('后台未连接，请先启动本地运营服务'))});});}
function replace(target,list){target.splice(0,target.length,...list);}
function apply(b){const data=require('./data'),campaigns=require('./campaigns');for(const p of b.products||[]){
  if(p.image?.startsWith('/media/'))p.image=BASE+p.image;
  if(p.detailImage?.startsWith('/media/'))p.detailImage=BASE+p.detailImage;
}for(const g of b.campaigns?.groupOffers||[])if(g.image?.startsWith('/media/'))g.image=BASE+g.image;replace(data.products,b.products);replace(data.categories,b.categories);replace(data.doctors,b.doctors);replace(data.clinics,b.clinics);Object.keys(b.campaigns).forEach(k=>{if(Array.isArray(campaigns[k]))replace(campaigns[k],b.campaigns[k]);});const s=wx.getStorageSync(KEY)||{};s.membership=b.membership;s.points=b.customer.points;s.serverPointBalance=b.customer.points;if(!s.legacyLocalRedemptions)s.legacyLocalRedemptions=s.redemptions||[];s.redemptions=b.customer.redemptions;s.coupons=b.customer.coupons;s.pointTransactions=b.customer.pointTransactions.concat([{id:'initial',title:'初始演示积分',amount:2860}]);s.orders=s.orders||[];b.customer.orders.filter(o=>o.kind==='points-cash'&&!s.orders.some(x=>x.id===o.id)).forEach(o=>s.orders.unshift(Object.assign({},o,{items:[{id:o.productId,name:o.productName,price:o.total,quantity:1,image:''}]})));if(s.orders)b.customer.orders.forEach(o=>{const local=s.orders.find(x=>x.id===o.id);if(local)local.status=({pending:'待付款',paid:'待使用',verified:'已完成',refunded:'已退款',cancelled:'已取消'})[o.status]||local.status;});wx.setStorageSync(KEY,s);snapshot=b;}
function refresh(){if(pending)return pending;pending=request('bootstrap').then(b=>{const changed=!snapshot||snapshot.revision!==b.revision;apply(b);return changed;}).finally(()=>pending=null);return pending;}
function page(config){const load=config.onLoad,show=config.onShow;config.onLoad=function(q){this.remoteQuery=q||{};if(load)load.call(this,q);};config.onShow=function(){if(show)show.call(this);refresh().then(changed=>{if(!changed)return;if(load&&(this.data.product||this.data.doctor))load.call(this,this.remoteQuery);if(show)show.call(this);if(this.loadRemote)this.loadRemote();}).catch(()=>{});};return config;}
function syncOrders(orders){if(!orders||!orders.length)return;clearTimeout(syncOrders.timer);syncOrders.timer=setTimeout(()=>request('customer/sync-demo','POST',{orders}).catch(()=>{}),250);}
function get(){return snapshot;}
module.exports={BASE,request,refresh,get,page,syncOrders};
