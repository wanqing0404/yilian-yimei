const PORTAL_BASE=new URL('../',import.meta.url).pathname.replace(/\/$/,'');
let currentUser=null;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>'¥'+(Number(x||0)/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=x=>x?new Date(x).toLocaleString('zh-CN',{hour12:false}):'—';
const paths={grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',box:'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M7 5l10 4',order:'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',users:'M15 21v-3a5 5 0 00-10 0v3M10 11a4 4 0 110-8 4 4 0 010 8M18 4a4 4 0 010 7M18 15a5 5 0 013 6',flag:'M4 21V3M4 4c6-4 10 4 16 0v10c-6 4-10-4-16 0',gift:'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 113-3l1 3M12 8h4a3 3 0 10-3-3z',chat:'M21 11a9 8 0 01-9 8H5l-3 3V11a9 8 0 0118 0zM7 11h.01M12 11h.01M17 11h.01',calendar:'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16M8 15l3 3 5-5',file:'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6',settings:'M12 8a4 4 0 110 8 4 4 0 010-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',arrow:'M4 12h16M14 6l6 6-6 6',search:'M10 3a7 7 0 110 14 7 7 0 010-14M15 15l6 6',check:'M5 12l4 4L19 6',clock:'M12 3a9 9 0 110 18 9 9 0 010-18M12 7v5l3 2',download:'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5',refresh:'M20 8a8 8 0 10.5 7M20 3v5h-5',logout:'M10 3H4v18h6M10 12h11M17 8l4 4-4 4',coins:'M4 7c0-5 16-5 16 0s-16 5-16 0M4 7v10c0 5 16 5 16 0V7M4 12c0 5 16 5 16 0'};
paths.eye='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0';
paths['eye-off']=paths.eye+'M3 3l18 18';
const icon=n=>`<span class="ico"><svg viewBox="0 0 24 24"><path d="${paths[n]||paths.grid}"/></svg></span>`;
const nav=[['dashboard','运营概览','grid','OVERVIEW'],['products','商品与价格','box'],['orders','订单与核销','order'],['groups','社群拼团','users','OPERATIONS'],['marketing','秒杀 / 礼券 / 换购','coins'],['point-flash','积分秒杀日','clock'],['activity','活动进度与奖励','flag'],['lottery','抽奖与凭证审核','gift'],['membership','会员体系','users','MEMBERSHIP'],['users','顾客管理','users','MANAGEMENT'],['home-shortcuts','首页快捷入口','grid'],['aftercare','术后护理','file'],['content','页面资料','file'],['logs','操作记录','clock']];
const labels={pending:'待审核',approved:'已通过',hidden:'已隐藏',deleted:'已删除',rejected:'未通过',published:'已上架',draft:'已下架',paid:'待使用',verified:'已核销',refunded:'已退款',cancelled:'已取消',valid:'有效',invalid:'已失效'};
const tag=(v,label)=>`<span class="tag dot-tag ${['approved','published','verified','valid'].includes(v)?'green':['pending'].includes(v)?'orange':['rejected','invalid','deleted'].includes(v)?'red':'purple'}">${esc(label||labels[v]||v)}</span>`;
const assetUrl=p=>p.startsWith('http')?p:p.startsWith('/media/products/')?PORTAL_BASE+p:PORTAL_BASE+'/miniapp'+p;
const thumb=p=>`<div class="product-thumb">${p?.image?`<img src="${esc(assetUrl(p.image))}" alt="${esc(p.name)}">`:''}</div>`;
const productCell=p=>`<div class="product-cell">${thumb(p)}<div><div class="product-name">${esc(p?.name||'未关联商品')}</div><div class="sub">${esc(p?.id||'')} · ${esc(p?.category||'')}</div></div></div>`;
let page=location.hash.slice(1)||'dashboard',cache={},rules=null,products=[],loadToken=0;
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
async function api(path,method='GET',body){if(currentUser?.role==='viewer'&&method!=='GET'&&!['login','logout'].includes(path))throw Error('当前账号为只读权限，不能修改或删除');const r=await fetch(PORTAL_BASE+'/api/admin/'+path,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const j=await r.json();if(!r.ok||!j.ok){if(r.status===401&&path!=='login')login();throw Error(j.error||'操作失败');}return j.data;}
function busy(fn){return async e=>{e?.preventDefault();const b=e?.submitter||e?.currentTarget;if(b?.tagName==='BUTTON')b.disabled=true;try{await fn(e);}catch(err){toast(err.message);}finally{if(b?.tagName==='BUTTON')b.disabled=false;}};}
function head(title,sub,action=''){return `<div class="page-head"><div><div class="eyebrow">HAOMEI / OPERATIONS</div><h1>${title}</h1><p class="subtitle">${sub}</p></div><div class="head-actions">${action}</div></div>`;}
const panel=(title,body,sub='',extra='')=>`<section class="panel"><div class="panel-title"><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${extra}</div><div class="panel-body">${body}</div></section>`;
const table=(headers,rows,empty='暂无记录')=>`<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}"><div class="empty">${empty}</div></td></tr>`}</tbody></table></div>`;
const field=(name,label,value,type='text',hint='')=>`<label class="form-field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${type==='number'?'min="0" step="1"':''}>${hint?`<span class="hint">${hint}</span>`:''}</label>`;
const select=(name,label,value,opts)=>`<label class="form-field">${label}<select name="${name}">${opts.map(([v,t])=>`<option value="${v}" ${v===value?'selected':''}>${t}</option>`).join('')}</select></label>`;
const toggle=(name,title,value,sub='')=>`<div class="switch-row"><div><b>${title}</b>${sub?`<p>${sub}</p>`:''}</div><label class="switch"><input aria-label="${title}" type="checkbox" name="${name}" ${value?'checked':''}><i></i></label></div>`;
const footer=(label='保存配置')=>`<div class="form-footer"><span class="hint">保存后小程序预览刷新即可生效</span><button type="submit" class="primary">${icon('check')}${label}</button></div>`;
function draw(content){$('#main').innerHTML=(currentUser?.role==='viewer'?'<div class="readonly-banner">只读访问：可以查看配置和导出，不能新增、修改、删除或核销。</div>':'')+content;}
function shell(){const active=nav.find(n=>n[0]===page)||nav[0];$('#app').innerHTML=`<aside class="sidebar"><a class="brand" href="#dashboard"><span class="brand-mark">M</span><strong>医联 · 好美</strong></a><div class="brand-sub">运营管理工作台</div><nav>${nav.map(n=>`${n[3]?`<div class="nav-label">${n[3]}</div>`:''}<a class="nav-item ${page===n[0]?'active':''}" href="#${n[0]}">${icon(n[2])}${n[1]}</a>`).join('')}</nav><div class="side-bottom"><div class="connection"><i class="dot"></i>配置数据库已连接</div><div>运营配置 · 持久保存</div></div></aside><div class="layout"><header class="topbar"><div class="breadcrumb"><span>工作台</span><span>/</span><b>${active[1]}</b></div><select class="mobile-nav" aria-label="后台导航">${nav.map(n=>`<option value="${n[0]}" ${page===n[0]?'selected':''}>${n[1]}</option>`).join('')}</select><div class="top-actions"><span class="demo-label">在线演示环境</span><a href="/demo/haomei/preview/?page=home" target="_blank">小程序预览 ↗</a><span class="admin-avatar">管</span><span class="admin-name">${esc(currentUser?.name||'运营管理员')}</span><button class="ghost small" id="logout" aria-label="退出登录">${icon('logout')}</button></div></header><main class="main" id="main"><div class="empty">正在读取数据…</div></main></div>`;$('.mobile-nav').onchange=e=>location.hash=e.target.value;$('#logout').onclick=busy(async()=>{await api('logout','POST',{});login();});}
function drawer(title,body,onSave,wide=false,saveLabel='保存修改'){$('#drawer-root').innerHTML=`<div class="drawer-backdrop"><form class="${wide?'modal':'drawer'}"><div class="drawer-head"><h2>${title}</h2><button class="drawer-close" type="button" aria-label="关闭">×</button></div><div class="drawer-content">${body}</div>${onSave?`<div class="form-footer"><button class="cancel" type="button">取消</button><button class="primary" type="submit">${icon('check')}${esc(saveLabel)}</button></div>`:''}</form></div>`;const form=$('form',$('#drawer-root'));$('.drawer-close',form).onclick=closeDrawer;$('.cancel',form)?.addEventListener('click',closeDrawer);$('.drawer-backdrop').onclick=e=>{if(e.target.className==='drawer-backdrop')closeDrawer();};const imageField=$('[name=image]',form);if(imageField){if(title.includes('医生'))imageField.setAttribute('aria-label','医生头像');const upload=document.createElement('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.setAttribute('aria-label',title.includes('医生')?'上传医生头像':'上传图片');imageField.after(upload);if(title.includes('医生')){const label=document.createElement('label');label.className='avatar-upload-label';label.textContent='上传医生头像（PNG / JPG / WebP，3 MB 以内）';
const hint=document.createElement('div');
hint.className='avatar-upload-label';
hint.textContent='推荐使用透明背景 PNG，尺寸 1200 × 1600 像素（竖版 3:4）。人物正面居中，保留完整发顶、双肩和胸部以下一点，顶部和两侧各留约 10% 的透明空间，方便适配不同页面。';
upload.before(label,hint);}upload.onchange=busy(async()=>{const file=upload.files[0];if(!file)return;if(file.size>3000000)throw Error('请选择3MB以内的图片');const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const result=await api('product-image','POST',{base64});imageField.value=result.url;toast('图片已上传，请保存修改');});}if(onSave)form.onsubmit=busy(async()=>{const message=await onSave(form);closeDrawer();toast(typeof message==='string'?message:'修改已保存');await render();});return form;}
function closeDrawer(){$('#drawer-root').innerHTML='';}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
function passwordField(value=''){return `<div class="form-field"><label for="login-password">登录密码</label><div class="password-input-wrapper"><input id="login-password" name="password" type="password" value="${esc(value)}" autocomplete="current-password"><button id="password-visibility" class="password-visibility" type="button" aria-label="显示密码" aria-controls="login-password" aria-pressed="false">${icon('eye')}<span>显示</span></button></div></div>`;}
function setupPasswordVisibility(){const input=$('#login-password'),toggle=$('#password-visibility');toggle.onclick=()=>{const visible=input.type==='password';input.type=visible?'text':'password';toggle.setAttribute('aria-label',visible?'隐藏密码':'显示密码');toggle.setAttribute('aria-pressed',String(visible));toggle.innerHTML=icon(visible?'eye-off':'eye')+'<span>'+(visible?'隐藏':'显示')+'</span>';};}
function login(){currentUser=null;$('#app').innerHTML=`<div class="login-screen"><div class="login-visual"><div class="brand"><span class="brand-mark">M</span><strong>医联 · 好美</strong></div><div><div class="eyebrow">EVERY DETAIL, WELL MANAGED</div><h1>让每一份美丽<br>都有序发生。</h1><p>商品、顾客与活动，尽在一处。<br>与医联好美小程序协同使用的运营工作台。</p></div><p>HAOMEI · OPERATIONS CONSOLE</p></div><form class="login-box"><div class="eyebrow">WELCOME BACK</div><h1>登录运营工作台</h1><p class="subtitle">管理日常业务，从这里开始</p>${field('username','登录账号','')}${passwordField()}<div class="error-message"></div><button class="primary" type="submit">登录工作台 ${icon('arrow')}</button><div class="login-tip">管理员可维护配置；只读账号仅供查看。<br>请向管理者获取账号和密码。</div></form></div>`;setupPasswordVisibility();$('.login-box').onsubmit=busy(async e=>{try{currentUser=await api('login','POST',Object.fromEntries(new FormData(e.currentTarget)));cache.categories=await api('catalog/categories');await render();}catch(err){$('.error-message').textContent=err.message;}});}
function exportCsv(name,headers,rows){const csv='\uFEFF'+[headers,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
async function render(){const token=++loadToken;page=location.hash.slice(1)||'dashboard';if(!nav.some(n=>n[0]===page)){page='dashboard';history.replaceState(null,'','#dashboard');}shell();try{const result=await Promise.all([api('rules'),api('products')]);if(token!==loadToken)return;[rules,products]=result;await views[page]();}catch(e){if($('#main'))draw(`<div class="empty">${esc(e.message)}<br><button id="retry">重新加载</button></div>`);$('#retry')?.addEventListener('click',render);}}
const views={};
views.dashboard=async()=>{const d=await api('dashboard');const metrics=[['商城商品',d.published,'在架项目 / 共 '+d.products+' 个','box'],['演示实收金额',money(d.paidTotal),'已付款与已核销订单合计','coins'],['订单核销',d.verified,'累计已核销 / 共 '+d.orders+' 笔订单','order']];draw(head('运营概览','欢迎回来，查看商城与活动的最新动态',`<button id="refresh">${icon('refresh')}刷新数据</button>`)+`<div class="stat-grid">${metrics.map(m=>`<div class="stat"><div class="metric-icon">${icon(m[3])}</div><div class="stat-label">${m[0]}</div><div class="stat-value">${m[1]}</div><div class="stat-foot">${m[2]}</div></div>`).join('')}</div><div class="dashboard-grid"><section class="panel"><div class="panel-title"><div><h2>最近订单</h2><p>仅展示演示订单</p></div><a class="link" href="#orders">查看全部 →</a></div>${orderTable(d.recentOrders,false)}</section>${panel('待办事项',[[d.pendingPrices,'商品价格待确认','核对价格后再用于正式商城','products','box'],[d.pendingProofs,'抽奖凭证待审核','审核通过后顾客方可抽奖','lottery','gift']].map(t=>`<div class="todo"><div class="todo-icon">${icon(t[4])}</div><div><b>${t[0]} 项 · ${t[1]}</b><span>${t[2]}</span></div><button class="link" data-goto="${t[3]}">处理 →</button></div>`).join(''))}</div>`+panel('最近操作',d.logs.length?d.logs.map(l=>`<div class="log-item">${esc(l.action)} · ${esc(l.target)}<span>${date(l.createdAt)}</span></div>`).join(''):'<div class="hint">暂无操作记录，保存配置后将在这里留痕。</div>'));$('#refresh').onclick=busy(render);$$('[data-goto]').forEach(b=>b.onclick=()=>location.hash=b.dataset.goto);};
views.products=async()=>{draw(head('商品与价格','规范展示价格，统一管理商品的上架状态与价格边界',`<button class="primary" id="new-product">＋ 新增商品</button><button id="export-products">${icon('download')}导出商品</button>`)+`<section class="panel"><div class="toolbar"><div class="search">${icon('search')}<input id="product-search" placeholder="搜索商品名称、编号"></div><select id="product-status" aria-label="商品状态"><option value="">全部状态</option><option value="published">已上架</option><option value="draft">已下架</option><option value="unapproved">价格待确认</option><option value="deleted">回收站</option></select><span class="count">共 ${products.length} 个商品</span></div><div id="product-table"></div><div class="table-foot"><span>金额以人民币展示，数据库按分存储 · 缺少素材的图片保留空白</span><span>全部商品</span></div></section>`+panel('价格展示规则',`<form id="pricing-form">${toggle('approvalRequired','正式价格需运营确认',rules.pricing.approvalRequired,'开启后，仅确认过的价格用于正式模式；演示模式仍保留当前示例价格。')}${toggle('showDemoPrices','预览中展示示例价格',rules.pricing.showDemoPrices,'关闭后，未确认商品显示“价格待确认”，并暂停下单。')}${footer()}</form>`));$('#new-product').onclick=()=>editProduct({isNew:true,name:'',category:'皮肤管理',desc:'',price:0,listPrice:0,memberPrice:null,floorPrice:0,ceilingPrice:0,status:'draft',priceApproved:false});const paint=()=>{const q=$('#product-search').value.toLowerCase(),status=$('#product-status').value;const list=products.filter(p=>(p.name+p.id).toLowerCase().includes(q)&&(status==='deleted'?p.status==='deleted':p.status!=='deleted'&&(!status||(status==='unapproved'?!p.priceApproved:p.status===status))));$('.count').textContent=(status==='deleted'?'回收站 ':'共 ')+list.length+' 个商品';$('#product-table').innerHTML=table(['商品信息','销售价','所需积分','划线价','价格审核','上架状态','操作'],list.map(p=>`<tr><td>${productCell(p)}</td><td class="price">${money(p.price)}</td><td>${p.pointsPrice>0?esc(p.pointsPrice):'—'}</td><td>${money(p.listPrice)}</td><td>${tag(p.priceApproved?'approved':'pending',p.priceApproved?'已确认':'待确认')}</td><td>${tag(p.status)}</td><td>${p.status==='deleted'?`<button class="link" data-restore-product="${p.id}">恢复商品</button>`:`<button class="link" data-edit="${p.id}">编辑商品</button><button class="link danger-link" data-delete-product="${p.id}">删除商品</button>`}</td></tr>`).join(''));$$('[data-edit]').forEach(b=>b.onclick=()=>editProduct(products.find(p=>p.id===b.dataset.edit)));$$('[data-delete-product]').forEach(b=>b.onclick=()=>deleteProduct(products.find(p=>p.id===b.dataset.deleteProduct)));$$('[data-restore-product]').forEach(b=>b.onclick=()=>restoreProduct(products.find(p=>p.id===b.dataset.restoreProduct)));};paint();$('#product-search').oninput=paint;$('#product-status').onchange=paint;$('#export-products').onclick=()=>exportCsv('商品价格表',['编号','名称','分类','销售价','划线价','审核','状态'],products.filter(p=>p.status!=='deleted').map(p=>[p.id,p.name,p.category,p.price/100,p.listPrice/100,p.priceApproved?'已确认':'待确认',labels[p.status]]));$('#pricing-form').onsubmit=busy(async e=>{const f=e.currentTarget;rules.pricing.approvalRequired=f.approvalRequired.checked;rules.pricing.showDemoPrices=f.showDemoPrices.checked;await saveRules('pricing');toast('价格展示规则已保存');});};
function deleteProduct(p){drawer('删除商品',`<div class="delete-product-summary">${productCell(p)}</div><div class="rule-note">确认删除“${esc(p.name)}”？删除后会移至回收站，小程序Demo同步后不再展示。历史订单与成交金额保留，可以在回收站恢复。</div>`,async()=>{await api('products/'+p.id,'DELETE',{});return '商品已移至回收站';},true,'确认删除');}
function restoreProduct(p){drawer('恢复商品',`<div class="delete-product-summary">${productCell(p)}</div><div class="rule-note">将“${esc(p.name)}”恢复到商品列表，状态为已下架；核对后可在编辑商品中重新上架。</div>`,async()=>{await api('products/'+p.id+'/restore','PUT',{});return '商品已恢复，当前为下架状态';},true,'确认恢复');}
function editProduct(p){const cents=['price','listPrice','memberPrice','floorPrice','ceilingPrice'];const fields=[['price','销售价（元）'],['listPrice','划线价（元）'],['memberPrice','会员价（元，可留空）'],['floorPrice','价格下限（元，0不限制）'],['ceilingPrice','价格上限（元，0不限制）']];const f=drawer('编辑商品',`<div class="drawer-product">${thumb(p)}<div><h3>${esc(p.name)}</h3><div class="sub">${p.isNew?'新商品 · 保存后生成编号':'商品编号 '+p.id}</div></div></div>${p.importBatch?`<div class="rule-note">来自用户价格表 · 源序号 ${esc(p.sourceSequence)} · ${esc(p.priceType||'页面标价')}${p.sourceNote?'<br>'+esc(p.sourceNote):''}${!p.image?'<br>未匹配到同名称、同规格图片，暂时留空。':''}</div>`:''}${field('name','商品名称',p.name)}<label class="form-field">商品封面图<input type="hidden" name="image" value="${esc(p.image||'')}"></label><label class="form-field">商品详情海报
  <input name="detailPosterFile" type="file" accept="image/png,image/jpeg,image/webp">
  <span class="hint">${p.detailImage?'已上传海报。选择新图片并保存即可替换。':'支持 PNG、JPG、WebP，单张 3 MB 以内。保存后在商品详情页展示。'}</span>
</label>${select('category','商品分类',p.category,cache.categories.map(x=>[x,x]))}<label class="form-field">商品简介<textarea name="desc">${esc(p.desc)}</textarea></label><label class="form-field">商品说明<textarea name="detailDescription" rows="8">${esc(p.detailDescription||'')}</textarea><span class="hint">在小程序商品详情展示，支持换行。</span></label><div class="form-grid">${fields.map(([n,l])=>field(n,l,p[n]==null?'':(p[n]/100).toFixed(2),'number')).join('')}</div>${field('pointsPrice','所需积分',p.pointsPrice||0,'number','积分为 0 时显示现金价。销售价为 0 时显示纯积分价。两项均大于 0 时显示积分加现金。')}${select('status','上架状态',p.status,[['published','上架展示'],['draft','下架隐藏']])}${toggle('priceApproved','价格已经运营确认',p.priceApproved,'确认前请核对实际服务内容及销售价格。')}`,async form=>{const v=Object.fromEntries(new FormData(form));for(const n of cents)v[n]=n==='memberPrice'&&v[n]===''?null:Math.round(Number(v[n])*100);v.pointsPrice=Number(v.pointsPrice);v.priceApproved=form.priceApproved.checked;delete v.detailPosterFile;
const poster=form.elements.detailPosterFile.files[0];
if(poster){
  if(poster.size>3000000)throw Error('商品海报须在 3 MB 以内');
  const base64=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result.split(',')[1]);
    reader.onerror=()=>reject(new Error('读取商品海报失败'));
    reader.readAsDataURL(poster);
  });
  const upload=await api('product-image','POST',{base64});
  v.detailImage=upload.url;
}
await api(p.isNew?'products':'products/'+p.id,p.isNew?'POST':'PUT',v);});$$('input[type=number]',f).forEach(x=>x.step=x.name==='pointsPrice'?'1':'.01');}
function orderTable(list,actions=true){return table(['订单 / 顾客','商品信息','订单金额','当前状态',...(actions?['操作']:[])],list.map(o=>`<tr><td><strong>${esc(o.id)}</strong><div class="sub">${esc(o.userId)} · ${date(o.createdAt)}</div></td><td><div class="product-name" style="max-width:230px;white-space:normal">${esc(o.productName)}</div>${o.demo?'<div class="sub">演示订单</div>':''}</td><td class="price">${money(o.total)}</td><td>${tag(o.status,o.status==='pending'?'待付款':null)}</td>${actions?`<td>${o.status==='pending'?`<button class="link" data-order="${o.id}" data-status="paid">模拟付款</button><button class="link danger" data-order="${o.id}" data-status="cancelled">取消</button>`:o.status==='paid'?`<button class="link" data-order="${o.id}" data-status="verified">到院核销</button><button class="link danger" data-order="${o.id}" data-status="refunded">模拟退款</button>`:o.status==='verified'?`<button class="link danger" data-order="${o.id}" data-status="refunded">模拟退款</button>`:'—'}</td>`:''}</tr>`).join(''));}
views.orders=async()=>{const list=await api('orders');draw(head('订单与核销','管理演示订单；核销记录同时用于新客判断与邀请活动进度',`<button id="export-orders">${icon('download')}导出订单</button>`)+`<section class="panel"><div class="toolbar"><div class="search">${icon('search')}<input id="order-search" placeholder="搜索订单号或项目名称"></div><select id="order-status" aria-label="订单状态"><option value="">全部状态</option>${['pending','paid','verified','refunded','cancelled'].map(s=>`<option value="${s}">${s==='pending'?'待付款':labels[s]}</option>`).join('')}</select><span class="count">共 ${list.length} 笔订单</span></div><div id="orders-table"></div><div class="table-foot"><span>模拟付款和退款只变更本地状态，不产生资金交易。</span></div></section>`);const paint=()=>{const q=$('#order-search').value,s=$('#order-status').value;$('#orders-table').innerHTML=orderTable(list.filter(o=>(o.id+o.productName).includes(q)&&(!s||o.status===s)));$$('[data-order]').forEach(b=>b.onclick=()=>drawer('确认订单操作',`<div class="rule-note">订单 ${esc(b.dataset.order)}<br>将变更为：${b.dataset.status==='paid'?'模拟已付款':labels[b.dataset.status]}。核销后会更新顾客新客身份与邀请进度。</div>`,async()=>api('orders/'+b.dataset.order+'/'+b.dataset.status,'POST',{}),true));};paint();$('#order-search').oninput=paint;$('#order-status').onchange=paint;$('#export-orders').onclick=()=>exportCsv('订单记录',['订单号','顾客','项目','金额','状态','时间'],list.map(o=>[o.id,o.userId,o.productName,o.total/100,o.status==='pending'?'待付款':labels[o.status],date(o.createdAt)]));};
views.groups=async()=>{
  const list=await api('groups');
  const readOnly=typeof currentUser!=='undefined'&&currentUser?.role==='viewer';
  const dateValue=ms=>ms?new Date(ms+8*3600000).toISOString().slice(0,16):'';
  const dateMillis=value=>value?Date.parse(value+':00+08:00'):0;
  const row=(title,control,required=false)=>`<div class="group-form-row"><div class="group-form-label">${required?'<span aria-hidden="true">*</span> ':''}${title}</div><div class="group-form-control">${control}</div></div>`;
  const radio=(name,limited)=>`<div class="group-form-options"><label><input type="radio" name="${name}" value="unlimited" ${limited?'':'checked'}> 不限</label><label><input type="radio" name="${name}" value="limited" ${limited?'checked':''}> ${name==='stockMode'?'限库存':'限购'}</label></div>`;
  const number=(name,value,min,max,step=1)=>`<input aria-label="${{price:'拼团价',singlePrice:'单购价',stock:'活动库存',members:'拼团人数',limit:'每人限购',validHours:'团有效期',leaderPrice:'团长价',virtualJoined:'虚拟抢购人数'}[name]}" name="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${esc(value)}" required>`;
  const price=value=>value==null?'':(value/100).toFixed(2);
  const asset=path=>typeof assetUrl==='function'?assetUrl(path):path.startsWith('/media/')?path:'/miniapp'+path;
  const edit=g=>{
    const product=products.find(p=>p.id===g.productId);
    const options=products.filter(p=>p.status==='published'||p.id===g.productId).map(p=>[p.id,p.name]);
    const dateInput=(name,value,label)=>`<input type="datetime-local" name="${name}" value="${dateValue(value)}" aria-label="${label}" ${g.id?'':'required'}>`;
    const body=`
      ${row('活动名称',`<input name="activityName" aria-label="活动名称" value="${esc(g.name||product?.name||'')}" placeholder="填写 2–120 字的活动名称" minlength="2" maxlength="120" required>`,true)}
      ${row('活动时间',`<div class="group-form-options">${dateInput('startsAt',g.startsAt,'活动开始时间')}<span>至</span>${dateInput('endsAt',g.endsAt,'活动结束时间')}</div><p class="hint">北京时间${g.id?'。未设置时间的旧活动沿用原规则。':''}</p>`,true)}
      ${row('预热时间',toggle('preheat','开启预热',!!g.preheatAt)+`<div data-group-condition="preheat">${dateInput('preheatAt',g.preheatAt,'预热开始时间')}</div>`)}
      ${row('活动商品',select('productId','选择商品',g.productId||'',[['','请选择商品'],...options]),true)}
      ${row('拼团价',number('price',price(g.price),.01,1000000,.01)+' 元',true)}
      ${row('活动库存',radio('stockMode',g.stock!=null)+`<div data-group-condition="stockMode">${number('stock',g.stock??1,1,1000000)} 件</div>`,true)}
      ${row('拼团人数',number('members',g.members??2,2,20)+' 人',true)}
      ${row('限购',radio('limitMode',g.limit>0)+`<div data-group-condition="limitMode">${number('limit',g.limit||1,1,99)} 单 / 人</div>`)}
      ${row('团有效期',number('validHours',g.validHours??24,1,168)+' 小时',true)}
      ${row('团长价',toggle('leader','启用团长价',g.leaderPrice!=null)+`<div data-group-condition="leader">${number('leaderPrice',price(g.leaderPrice)||'0.01',.01,1000000,.01)} 元</div>`)}
      ${row('自动成团',toggle('autoGroup','开启自动成团',!!g.autoGroup))}
      ${row('虚拟抢购人数',number('virtualJoined',g.virtualJoined??0,0,1000000)+' 人')}
      <h3 class="group-form-extra">其他设置</h3>
      ${row('单购价',number('singlePrice',price(g.singlePrice),.01,1000000,.01)+' 元',true)}
      ${row('活动图片',`<label class="form-field">上传图片<input name="activityImage" type="file" accept="image/png,image/jpeg,image/webp"></label>${g.image?`<a href="${esc(asset(g.image))}" target="_blank" rel="noopener">查看已上传图片</a>`:''}<p class="hint">单张 3 MB 以内。未上传时使用商品头图。</p>`)}
      ${row('成员资格',select('audience','成员资格',g.audience||'all',[['new-only','仅新客'],['all','不限']]))}
      ${row('活动状态',toggle('enabled','活动已开放',!!g.enabled))}
    `;
    const form=drawer(readOnly?'查看拼团活动':g.id?'编辑拼团活动':'新建拼团活动',body,readOnly?null:async f=>{
      const fields=f.elements;
      const value=name=>fields.namedItem(name).value;
      const checked=name=>fields.namedItem(name).checked;
      const payload={
        name:value('activityName').trim(),productId:value('productId'),
        startsAt:dateMillis(value('startsAt')),endsAt:dateMillis(value('endsAt')),
        preheatAt:checked('preheat')?dateMillis(value('preheatAt')):0,
        price:Math.round(Number(value('price'))*100),singlePrice:Math.round(Number(value('singlePrice'))*100),
        stock:value('stockMode')==='limited'?Number(value('stock')):null,
        members:Number(value('members')),limit:value('limitMode')==='limited'?Number(value('limit')):0,
        validHours:Number(value('validHours')),leaderPrice:checked('leader')?Math.round(Number(value('leaderPrice'))*100):null,
        autoGroup:checked('autoGroup'),virtualJoined:Number(value('virtualJoined')),
        audience:value('audience'),enabled:checked('enabled')
      };
      if(checked('preheat')&&!payload.preheatAt)throw Error('请选择预热开始时间');
      const file=fields.activityImage.files[0];
      if(file){
        if(file.size>3000000)throw Error('请选择 3 MB 以内的图片');
        const base64=await new Promise((resolve,reject)=>{
          const reader=new FileReader();
          reader.onload=()=>resolve(reader.result.split(',')[1]);
          reader.onerror=()=>reject(new Error('读取活动图片失败'));
          reader.readAsDataURL(file);
        });
        payload.image=(await api('product-image','POST',{base64})).url;
      }
      await api(g.id?'groups/'+encodeURIComponent(g.id):'groups',g.id?'PUT':'POST',payload);
      return '拼团活动已保存';
    },true,'保存活动');
    form.classList.add('group-config-form');
    const updateConditions=()=>{
      for(const block of $$('[data-group-condition]',form)){
        const key=block.dataset.groupCondition;
        const field=form.elements.namedItem(key);
        const enabled=key==='stockMode'||key==='limitMode'?field.value==='limited':field.checked;
        block.hidden=!enabled;
        for(const input of $$('input',block)){
          input.disabled=readOnly||!enabled;
          if(key==='preheat')input.required=enabled;
        }
      }
    };
    form.addEventListener('change',updateConditions);
    updateConditions();
    if(readOnly)for(const input of $$('input,select',form))input.disabled=true;
  };
  draw(head('社群拼团','配置活动商品、时间、价格与成团规则',readOnly?'':'<button id="add-group" class="primary">新建拼团活动</button>')+
    panel('拼团活动',table(['活动名称','活动商品','拼团价','成团人数','状态','操作'],list.map(g=>{
      const product=products.find(p=>p.id===g.productId);
      return `<tr><td><strong>${esc(g.name||product?.name||g.id)}</strong></td><td>${esc(product?.name||g.productId)}</td><td>${money(g.price)}</td><td>${g.members} 人</td><td>${tag(g.enabled?'published':'draft',g.enabled?'已开放':'已关闭')}</td><td><button class="link" data-edit-group="${esc(g.id)}">${readOnly?'查看':'编辑'}</button></td></tr>`;
    }).join(''),'暂无拼团活动')));
  $('#add-group')?.addEventListener('click',()=>edit({}));
  $$('[data-edit-group]').forEach(button=>button.onclick=()=>edit(list.find(g=>g.id===button.dataset.editGroup)));
};
views.activity=async()=>{const a=rules.activity;const products=(await api('products')).filter(p=>p.status==='published');draw(head('活动进度与奖励','受邀新朋友授权并完成首单后点亮进度，达到阶段可领取礼品')+`<div class="split-grid">${panel('活动配置',`<form id="activity-form">${field('title','活动名称',a.title)}<div class="form-grid">${field('friendsLabel','好友列表标题',a.friendsLabel||'好友列表')}${field('giftsLabel','礼品区标题',a.giftsLabel||'邀友礼品')}${field('inviteLabel','邀请按钮文案',a.inviteLabel||'邀请新朋友 +')}${field('claimLabel','领取按钮文案',a.claimLabel||'立即领取')}${select('visual','展示形式',a.visual,[['steps','阶段进度条'],['regions','区域逐步点亮']])}${field('id','活动编号',a.id,'text','更换编号将创建独立领取周期')}</div>${toggle('enabled','开放活动',a.enabled)}<h3 style="margin-top:26px">阶段目标与奖励</h3><div class="stage-row row-labels"><span>阶段名称</span><span>邀请人数</span><span>奖励积分</span><span>礼品名称</span><span></span></div><div id="stage-rows"></div><button type="button" id="add-stage" class="small">＋ 添加阶段</button>${footer()}</form>`)}<div>${panel('顾客端预览',`<div class="sub">${esc(a.title)}</div><div class="stage-preview">${a.stages.map((s,i)=>`<div class="stage-point"><div class="circle">${i+1}</div><span>${s.threshold} 人 / ${s.points} BP</span></div>`).join('')}</div><p class="hint">每个阶段礼品仅能领取一次，同一好友只计一次。</p>`)}${panel('模拟好友授权并购买',`<form id="referral-form">${field('phone','演示受邀顾客手机号','','tel','仅创建本地演示订单，邀请人固定为当前演示顾客。')}${select('productId','购买商品',products[0]?.id||'',products.map(p=>[p.id,p.name]))}<label class="form-field"><input name="authorized" type="checkbox" required> 模拟好友已授权</label><button class="primary" type="submit">${icon('check')}完成演示购买</button></form>`)}</div></div>`);let stages=structuredClone(a.stages);const paint=()=>{$('#stage-rows').innerHTML=stages.map((s,i)=>`<div class="stage-row" data-id="${s.id}"><input aria-label="阶段名称" name="name" value="${esc(s.name)}"><input aria-label="目标人数" name="threshold" type="number" min="1" value="${s.threshold}"><input aria-label="奖励积分" name="points" type="number" min="0" value="${s.points}"><input aria-label="礼品名称" name="rewardName" value="${esc(s.rewardName||'')}"><button class="ghost small" type="button" data-remove="${i}">×</button></div>`).join('');$$('[data-remove]').forEach(b=>b.onclick=()=>{collect();stages.splice(Number(b.dataset.remove),1);paint();});};const collect=()=>{stages=$$('.stage-row[data-id]').map(r=>({id:r.dataset.id,name:$('[name=name]',r).value,threshold:Number($('[name=threshold]',r).value),points:Number($('[name=points]',r).value),rewardName:$('[name=rewardName]',r).value.trim()}));};paint();$('#add-stage').onclick=()=>{collect();stages.push({id:'s'+Date.now(),name:'新阶段',threshold:stages.length+1,points:100});paint();};$('#activity-form').onsubmit=busy(async e=>{collect();const f=e.currentTarget;Object.assign(a,{title:f.elements.namedItem('title').value,id:f.elements.namedItem('id').value,visual:f.visual.value,enabled:f.enabled.checked,stages,...Object.fromEntries(['friendsLabel','giftsLabel','inviteLabel','claimLabel'].map(k=>[k,f.elements[k].value.trim()]))});await saveRules('activity');toast('活动规则已保存');await render();});$('#referral-form').onsubmit=busy(async e=>{const form=e.currentTarget;await api('demo/referral','POST',{phone:form.phone.value,productId:form.productId.value,authorized:form.authorized.checked});toast('演示好友已计入活动进度');form.reset();});};
views.lottery=async()=>{const [proofs,draws]=await Promise.all([api('proofs'),api('draws')]),r=rules.lottery;draw(head('抽奖与凭证审核','先提交社群订单截图，审核通过后参与；支持按手机号限制次数')+panel('抽奖规则',`<form id="lottery-form"><div class="form-grid">${field('title','活动名称',r.title)}${field('startDate','活动开始日期',r.startDate||'','date')}${field('endDate','活动结束日期',r.endDate||'','date','北京时间，含结束当天。两项留空沿用手机号规则。')}${field('drawsPerOrder','每单抽奖次数',r.drawsPerOrder||1,'number','仅统计活动日期内未取消、未退款的订单')}${field('maxPerPhone','每手机号抽奖次数',r.maxPerPhone,'number','0 表示不限次数；按手机号累计统计')}</div>${toggle('enabled','开放抽奖',r.enabled)}${toggle('requireProof','必须上传订单截图并通过审核',r.requireProof,'审核不通过的凭证无法抽奖；已使用凭证被撤销时，相应抽奖失效并记录。')}<h3 style="margin-top:24px">奖品配置</h3><div class="prize-row row-labels"><span>奖品名称</span><span>奖品类型</span><span>积分值</span><span>相对权重</span><span>剩余库存</span><span></span></div><div id="prize-rows"></div><button id="add-prize" class="small" type="button">＋ 添加奖品</button><p class="hint">权重为相对概率；库存为0的奖品不再参与抽取。实物礼品只登记中奖，后续由运营发放。</p>${footer()}</form>`)+`<section class="panel"><div class="panel-title"><div><h2>待审核凭证</h2><p>查看原图、核对说明后审核，操作会保留记录</p></div><span class="tag orange">${proofs.filter(p=>p.status==='pending').length} 条待审核</span></div>${table(['顾客 / 手机号','订单截图','凭证说明','提交时间','审核状态','操作'],proofs.map(p=>`<tr><td><strong>${esc(p.userId)}</strong><div class="sub">${esc(p.phone)}</div></td><td><img class="proof-img" data-image="${esc(p.imageId)}" src="${PORTAL_BASE}/api/admin/media/${esc(p.imageId)}" alt="订单截图"></td><td><div class="comment-text">${esc(p.description)}</div><div class="sub">${esc(p.reviewNote)}</div></td><td>${date(p.createdAt)}</td><td>${tag(p.status)}</td><td><button class="link" data-proof="${p.id}" data-status="approved">通过</button><button class="link danger" data-proof="${p.id}" data-status="rejected">不通过</button></td></tr>`).join(''),'暂无顾客提交截图')}</section><section class="panel"><div class="panel-title"><h2>抽奖记录</h2></div>${table(['中奖时间','顾客手机号','奖品','结果状态'],draws.map(d=>`<tr><td>${date(d.createdAt)}</td><td>${esc(d.phone)}</td><td><strong>${esc(d.prizeName)}</strong></td><td>${tag(d.status)}</td></tr>`).join(''),'暂无抽奖记录')}</section>`);let prizes=structuredClone(r.prizes);const collect=()=>{prizes=$$('.prize-row[data-id]').map(el=>({id:el.dataset.id,name:$('[name=name]',el).value,type:$('[name=type]',el).value,...Object.fromEntries(['value','weight','stock'].map(k=>[k,Number($('[name='+k+']',el).value)]))}));};const paint=()=>{$('#prize-rows').innerHTML=prizes.map((p,i)=>`<div class="prize-row" data-id="${p.id}"><input name="name" aria-label="奖品名称" value="${esc(p.name)}"><select name="type" aria-label="奖品类型">${[['points','积分'],['gift','实物礼品'],['none','谢谢参与']].map(([v,t])=>`<option value="${v}" ${p.type===v?'selected':''}>${t}</option>`).join('')}</select>${['value','weight','stock'].map(k=>`<input type="number" name="${k}" aria-label="${k}" min="0" value="${p[k]}">`).join('')}<button class="ghost small" type="button" data-remove="${i}">×</button></div>`).join('');$$('[data-remove]').forEach(b=>b.onclick=()=>{collect();prizes.splice(Number(b.dataset.remove),1);paint();});};paint();$('#add-prize').onclick=()=>{collect();prizes.push({id:'lp'+Date.now(),name:'新奖品',type:'points',value:10,weight:1,stock:10});paint();};$('#lottery-form').onsubmit=busy(async e=>{collect();const f=e.currentTarget;Object.assign(r,{title:f.elements.namedItem('title').value,maxPerPhone:Number(f.maxPerPhone.value),startDate:f.startDate.value,endDate:f.endDate.value,drawsPerOrder:Number(f.drawsPerOrder.value),enabled:f.enabled.checked,requireProof:f.requireProof.checked,prizes});await saveRules('lottery');toast('抽奖规则已保存');});$$('[data-image]').forEach(i=>i.onclick=()=>drawer('订单截图',`<img src="${PORTAL_BASE}/api/admin/media/${esc(i.dataset.image)}" alt="订单凭证原图">`,null,true));$$('[data-proof]').forEach(b=>b.onclick=()=>drawer(b.dataset.status==='approved'?'通过凭证审核':'凭证不符合要求',`<label class="form-field">审核说明<textarea name="reviewNote" placeholder="填写审核依据，顾客可查看"></textarea></label>`,async f=>api('proofs/'+b.dataset.proof,'PUT',{status:b.dataset.status,reviewNote:f.reviewNote.value}),true));};
views.users=async()=>{const users=await api('users');draw(head('顾客管理','基于真实演示核销记录判断新客，积分由签到、活动和抽奖发放')+`<section class="panel"><div class="panel-title"><h2>顾客列表</h2><span class="count">${users.length} 位顾客</span></div>${table(['顾客信息','手机号','核销次数','顾客身份','积分余额','注册时间'],users.map(u=>`<tr><td><strong>${esc(u.name)}</strong><div class="sub">${esc(u.id)}</div></td><td>${esc(u.phone)}</td><td>${u.verifiedOrders}</td><td>${tag(u.verifiedOrders?'approved':'hidden',u.verifiedOrders?'老客':'新客')}</td><td class="price">${u.points.toLocaleString()} BP</td><td>${date(u.createdAt)}</td></tr>`).join(''))}</section>`);};
views.logs=async()=>{const list=await api('logs');draw(head('操作记录','商品价格、规则修改、凭证审核与评论处理均保留操作留痕')+`<section class="panel"><div class="panel-title"><h2>运营操作日志</h2><span class="count">${list.length} 条记录</span></div>${table(['操作时间','管理员','操作内容','目标编号','变更字段'],list.map(l=>`<tr><td>${date(l.createdAt)}</td><td>${esc(l.actor)}</td><td><strong>${esc(l.action)}</strong></td><td>${esc(l.target)}</td><td><div class="comment-text">${esc(JSON.stringify(l.details))}</div></td></tr>`).join(''))}</section>`);};
window.addEventListener('hashchange',()=>{closeDrawer();render();});

// Login also needs category options before the first edit.
const originalRender=render;render=async function(){if(!cache.categories){try{cache.categories=await api('catalog/categories');}catch{return login();}}return originalRender();};
views.marketing=async()=>{const [data,redemptions]=await Promise.all([api('campaigns'),api('redemptions')]);let tab='flashOffers';const names={flashOffers:'社群秒杀',coupons:'优惠券',pointsOffers:'积分商城'};draw(head('营销配置','统一维护秒杀价格、礼券门槛与积分商城商品')+`<section class="panel"><div class="tabs">${Object.entries(names).map(([k,n])=>`<button data-marketing="${k}" class="${k===tab?'active':''}">${n}</button>`).join('')}</div><div class="toolbar"><p class="subtitle">沿用现有活动内容，修改后同步顾客端。</p><button id="new-offer" class="small" style="margin-left:auto">＋ 新增项目</button></div><div id="marketing-table"></div><div class="table-foot">活动订单仍为演示订单，不执行真实付款。</div></section>`);const paint=()=>{const headers=tab==='flashOffers'?['关联商品','秒杀价','库存','操作']:tab==='coupons'?['礼券名称','面值','使用门槛','有效天数','操作']:['礼品名称','换购积分 / 现金','礼品说明','操作'];$('#marketing-table').innerHTML=table(headers,data[tab].map((o,i)=>`<tr>${tab==='flashOffers'?`<td>${productCell(products.find(p=>p.id===o.productId))}</td><td class="price">${money(o.price)}</td><td>${o.stock}</td>`:tab==='coupons'?`<td><strong>${esc(o.name)}</strong></td><td>${money(o.amount*100)}</td><td>${money(o.minSpend)}</td><td>${o.days}天</td>`:`<td><strong>${esc(o.name)}</strong></td><td>${o.cost} BP${o.cashPrice?' + '+money(o.cashPrice):''}</td><td>${esc(o.description)}</td>`}<td><button class="link" data-offer="${i}">编辑配置</button></td></tr>`).join(''));if(tab==='pointsOffers')$('#marketing-table').insertAdjacentHTML('beforeend','<div class="panel-title"><h2>积分商城记录</h2></div>'+table(['顾客','礼品名称','扣减积分','领取状态','时间'],redemptions.map(r=>`<tr><td>${esc(r.userId)}</td><td>${esc(r.name)}</td><td>${r.cost} BP</td><td>${esc(r.status)}</td><td>${date(r.createdAt)}</td></tr>`).join('')));$$('[data-offer]').forEach(b=>b.onclick=()=>edit(data[tab][Number(b.dataset.offer)]));$$('[data-marketing]').forEach(b=>b.classList.toggle('active',b.dataset.marketing===tab));};const edit=(o,isNew=false)=>{const fields=tab==='flashOffers'?select('productId','关联商品',o.productId,products.map(p=>[p.id,p.name]))+field('price','秒杀价（元）',o.price/100,'number')+field('stock','活动库存',o.stock,'number'):tab==='coupons'?field('name','礼券名称',o.name)+field('amount','优惠面值（元，整数）',o.amount,'number')+field('minSpend','最低消费（元）',o.minSpend/100,'number')+field('days','领取后有效天数',o.days,'number'):field('name','礼品名称',o.name)+field('cost','换购积分',o.cost,'number')+field('cashPrice','搭配现金（元，0为纯积分）',(o.cashPrice||0)/100,'number')+field('description','礼品说明',o.description)+field('image','图片路径',o.image||'');const form=drawer((isNew?'新增':'编辑')+names[tab],fields,async f=>{const v=Object.fromEntries(new FormData(f));for(const k of ['price','minSpend','cashPrice'])if(k in v)v[k]=Math.round(Number(v[k])*100);for(const k of ['amount','days','stock','cost'])if(k in v)v[k]=Number(v[k]);if(tab==='coupons')v.rule='满'+v.minSpend/100+'元可用';if(isNew)data[tab].push({...o,...v});else Object.assign(o,v);await api('campaigns','PUT',data);});$$('[name=price],[name=minSpend],[name=cashPrice]',form).forEach(x=>x.step='.01');};paint();$$('[data-marketing]').forEach(b=>b.onclick=()=>{tab=b.dataset.marketing;paint();});$('#new-offer').onclick=()=>edit(tab==='flashOffers'?{id:'f'+Date.now(),productId:products[0].id,price:products[0].price,stock:10}:tab==='coupons'?{id:'cp'+Date.now(),name:'新礼券',amount:50,minSpend:50000,days:30}: {id:'r'+Date.now(),name:'新礼品',cost:100,description:'',image:''},true);};
// Forms for daily operators; preserve fields that are not being edited.

function attachDoctorPosterImport(form){
  const input=$('[name=doctorPoster]',form);
  const status=$('[data-poster-status]',form);
  const save=$('button[type=submit]',form);
  input.onchange=async()=>{
    const file=input.files[0];
    if(!file)return;
    if(file.size>3000000){status.textContent='请选择 3MB 以内的海报';input.value='';return;}
    input.disabled=true;
    save.disabled=true;
    status.textContent='正在识别海报…';
    try{
      const base64=await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result.split(',')[1]);
        reader.onerror=()=>reject(Error('无法读取海报'));
        reader.readAsDataURL(file);
      });
      const result=await api('doctor-posters','POST',{filename:file.name,base64});
      if(!form.isConnected)return;
      const fields=result.fields||{};
      const mismatch=fields.name&&form.elements.name.value.trim()&&fields.name!==form.elements.name.value.trim();
      const original=$('[data-poster-text]',form);
      original.textContent=result.text||'';
      original.parentElement.hidden=!result.text;
      if(result.warning||mismatch){
        status.textContent=result.warning||('海报姓名识别为「'+fields.name+'」，请核对医生姓名后手动填写。');
        return;
      }
      let filled=0;
      for(const key of ['name','title','experience','introduction','specialty','approach','focus']){
        const value=Array.isArray(fields[key])?fields[key].join('\n'):fields[key];
        if(value&&form.elements[key]){form.elements[key].value=value;filled++;}
      }
      status.textContent=filled?'已填入 '+filled+' 项，请核对后保存。':'未找到可填入的字段，可查看识别原文。';
    }catch(error){status.textContent=error.message||'海报识别失败';}
    finally{input.disabled=false;save.disabled=false;input.value='';}
  };
}

views.content=async()=>{let type=cache.contentTab||'doctors',items=[];const doctorClinics=await api('catalog/clinics');draw(head('页面资料','维护医生介绍、门店与商品分类，保存后同步小程序')+`<section class="panel"><div class="tabs">${[['doctors','医生资料'],['clinics','门店信息'],['categories','商品分类']].map(([k,t])=>`<button data-content="${k}" class="${k===type?'active':''}">${t}</button>`).join('')}</div><div id="content-table"></div></section>`);const load=async()=>{items=await api('catalog/'+type);$('#add-doctor')?.remove();$$('[data-content]').forEach(b=>b.classList.toggle('active',b.dataset.content===type));if(type==='categories'){$('#content-table').innerHTML=`<div class="panel-body"><form id="category-form"><label class="form-field">分类名称（每行一个）<textarea name="categories" style="min-height:280px">${esc(items.join('\n'))}</textarea><span class="hint">第一项保留“全部”；分类修改后，商品归属需同步调整。</span></label>${footer()}</form></div>`;$('#category-form').onsubmit=busy(async e=>{const a=e.currentTarget.categories.value.split('\n').map(x=>x.trim()).filter(Boolean);if(a[0]!=='全部'||new Set(a).size!==a.length)throw Error('首项应为全部，分类不能重复');await api('catalog/categories','PUT',{items:a});cache.categories=a;toast('分类已保存');});return;}const canDeleteClinic=type==='clinics'&&(typeof currentUser==='undefined'||currentUser?.role!=='viewer');const canManageDoctors=type==='doctors'&&currentUser?.role!=='viewer';$('#content-table').innerHTML=table(type==='doctors'?['医生姓名','职称','经验 / 方向','操作']:['门店名称','城市','地址 / 营业时间','操作'],items.map((x,i)=>`<tr><td><strong>${esc(x.name)}</strong><div class="sub">${esc(x.id)}</div></td><td>${esc(type==='doctors'?x.title:x.city)}</td><td><div class="comment-text">${esc(type==='doctors'?x.experience+' · '+x.specialty:x.address+' · '+x.hours)}</div></td><td><button class="link" data-content-edit="${i}">编辑资料</button>${canManageDoctors?'<button class="link danger" data-doctor-delete="'+i+'">删除医生</button>':''}${canDeleteClinic?'<button class="link danger" data-clinic-delete="'+i+'">删除门店</button>':''}</td></tr>`).join(''));const edit=index=>{const isNew=index<0,x=isNew?{}:items[index];let body=field('name',type==='doctors'?'医生姓名':'门店名称',x.name)+field('image',type==='doctors'?'医生头像':'图片路径',x.image||'');if(type==='doctors')body+=`<label class="form-field">上传医生海报<input name="doctorPoster" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="hint" data-poster-status role="status">识别后自动填充资料，核对后保存。</p><details hidden><summary>识别原文</summary><pre data-poster-text style="white-space:pre-wrap"></pre></details><label class="form-field">擅长项目<textarea name="focus">${esc((x.focus||[]).join('\n'))}</textarea></label>`+select('clinicId','所在院区',x.clinicId||'',[['','请选择院区'],...doctorClinics.map(c=>[c.id,c.name])])+field('scheduleMonth','坐诊月份',x.scheduleMonth||new Date(Date.now()+8*3600000).toISOString().slice(0,7),'month')+`<label class="form-field">本月坐诊时间<textarea name="scheduleText" rows="4" placeholder="每行一项，例如 3日 坐诊 10:00-18:00，或 4日 公休，或 5日 休息">${esc(x.scheduleText||'')}</textarea></label>`+field('title','医生职称',x.title)+field('experience','临床经验',x.experience)+field('specialty','擅长方向',x.specialty)+`<label class="form-field">医生简介<textarea name="introduction">${esc(x.introduction)}</textarea></label>`+field('posterQuote','海报头像旁的一句话',x.posterQuote)+field('approach','诊疗理念',x.approach)+`<div class="rule-note">认证资料请使用实际执业证明；没有资料时保持留空。</div>`+field('qualification','资格证书信息',x.qualification||'')+field('license','执业证书信息',x.license||'')+field('certInstitution','认证机构',x.certInstitution||'');else body+=field('city','所在城市',x.city)+field('address','门店地址',x.address)+field('hours','营业时间',x.hours)+field('videoUrl','门店视频地址',x.videoUrl||'','url','填写 HTTPS 视频直链')+field('mapImage','院区地图图片',x.mapImage||'','url','填写 HTTPS 地图图片直链');const form=drawer((isNew?'新建':'编辑')+(type==='doctors'?'医生资料':'门店信息'),body,async f=>{const values=Object.fromEntries(new FormData(f));if(type==='doctors'){delete values.doctorPoster;values.focus=values.focus.split('\n').map(line=>line.trim()).filter(Boolean);}if(isNew){await api('doctors/batch','POST',{items:[values]});return '医生已创建';}if(type==='doctors'){await api('doctors/'+encodeURIComponent(x.id),'PUT',values);return '医生资料已保存';}const next=items.map((item,i)=>i===index?{...x,...values}:item);await api('catalog/'+type,'PUT',{items:next});});if(type==='doctors')attachDoctorPosterImport(form);};
$$('[data-content-edit]').forEach(b=>b.onclick=()=>edit(Number(b.dataset.contentEdit)));
if(canDeleteClinic)$$('[data-clinic-delete]').forEach(button=>button.onclick=()=>{
  const clinic=items[Number(button.dataset.clinicDelete)];
  drawer('删除门店','<p>确认删除「'+esc(clinic.name)+'」？小程序将移除该门店，关联医生资料会保留并解除院区关联。</p>',async()=>{
    await api('clinics/'+encodeURIComponent(clinic.id),'DELETE');
    return '门店已删除';
  },false,'确认删除');
});
if(canManageDoctors){
  $('.page-head .head-actions').insertAdjacentHTML('afterbegin','<button id="add-doctor" class="primary">新建医生</button>');
  $('#add-doctor').onclick=()=>edit(-1);
  $$('[data-doctor-delete]').forEach(b=>b.onclick=busy(async()=>{
    const doctor=items[Number(b.dataset.doctorDelete)];
    if(!confirm('删除“'+doctor.name+'”的医生资料？删除后将从小程序演示中移除。'))return;
    await api('doctors/'+encodeURIComponent(doctor.id),'DELETE');
    toast('医生已删除');await load();
  }));
}};await load();$$('[data-content]').forEach(b=>b.onclick=busy(async()=>{type=b.dataset.content;cache.contentTab=type;await load();}));};



async function saveRules(section){return api('rules','PUT',{section,value:rules[section]});}
views['point-flash']=async()=>{const [campaigns,state]=await Promise.all([api('campaigns'),fetch(PORTAL_BASE+'/api/customer/point-flash').then(r=>r.json()).then(r=>r.data)]);const r=rules.pointFlash;draw(head('积分秒杀日','每周或每月开放纯积分专场，让签到与活动奖励有明确的使用时机')+`<div class="rule-note">积分秒杀仅扣BP积分，不需要现金。库存按每一场独立计算；未开启时为草稿。普通积分商城的“积分＋现金”在「秒杀 / 礼券 / 换购」中设置。</div><div class="split-grid">${panel('排期与参与规则',`<form id="point-flash-form">${field('title','活动名称',r.title)}${toggle('enabled','启用积分秒杀',r.enabled,'启用后按北京时间自动开放，无需每次手动开关。')}<div class="form-grid" style="margin-top:20px">${select('scheduleMode','开放频率',r.scheduleMode,[['weekly','每周一天'],['monthly','每月一天']])}${field('startTime','开始时间',r.startTime,'time')}${select('weekDay','每周开放日',String(r.weekDay),['一','二','三','四','五','六','日'].map((n,i)=>[String(i+1),'星期'+n]))}${field('monthDay','每月开放日（1—28）',r.monthDay,'number','仅在每月模式生效，避免短月日期缺失')}${field('durationMinutes','每场时长（分钟）',r.durationMinutes,'number')}${field('maxPerPhone','本场每手机号总限兑次数',r.maxPerPhone,'number')}${field('minCheckins','参与门槛：累计签到天数',r.minCheckins,'number','0表示不限，达到积分要求即可参与')}</div><h3 style="margin-top:26px">本场秒杀礼品</h3><div class="flash-offer-labels"><span>关联礼品</span><span>秒杀积分</span><span>本场库存</span><span>单品限兑</span><span></span></div><div id="flash-offer-rows"></div><button type="button" class="small" id="add-flash-gift">＋ 添加礼品</button>${footer('保存积分秒杀')}</form>`)}<div>${panel('当前排期',`<span class="tag ${state?.active?'green':'purple'}">${state?.active?'正在进行':r.enabled?'等待开放':'未启用草稿'}</span><div class="info-list" style="margin-top:18px"><div><strong>下一场：</strong>${state?date(state.startAt):'保存后生成'}</div><div><strong>结束时间：</strong>${state?date(state.endAt):'—'}</div><div><strong>费用：</strong>仅BP积分，现金为0</div><div><strong>每人限兑：</strong>${r.maxPerPhone}次 / 场</div></div>`)}${panel('联动建议',`<div class="info-list">签到得积分 → 积分秒杀日使用<br>邀请新客核销 → 阶段奖励积分<br>消费积分发放 → 后续按订单规则接入<br>积分秒杀 → 留存兑换与积分扣减记录</div><p class="hint" style="margin-top:18px">先小库存试运行，观察参与人数、积分消耗、复访和新增签到，再调整频率与奖品。</p>`)}</div></div>`);let offers=structuredClone(r.offers);const collect=()=>{offers=$$('[data-flash-offer]').map(el=>({id:el.dataset.flashOffer,giftId:$('[name=giftId]',el).value,...Object.fromEntries(['points','stock','limit'].map(k=>[k,Number($('[name='+k+']',el).value)]))}));};const paint=()=>{$('#flash-offer-rows').innerHTML=offers.map((o,i)=>`<div class="flash-offer-row" data-flash-offer="${o.id}"><select name="giftId" aria-label="秒杀礼品">${campaigns.pointsOffers.map(g=>`<option value="${g.id}" ${g.id===o.giftId?'selected':''}>${esc(g.name)}</option>`).join('')}</select>${['points','stock','limit'].map(k=>`<input name="${k}" aria-label="${{points:'秒杀积分',stock:'本场库存',limit:'单品限兑'}[k]}" type="number" min="${k==='stock'?0:1}" value="${o[k]}">`).join('')}<button type="button" class="ghost small" data-flash-remove="${i}">×</button></div>`).join('');$$('[data-flash-remove]').forEach(b=>b.onclick=()=>{collect();offers.splice(Number(b.dataset.flashRemove),1);paint();});};paint();$('#add-flash-gift').onclick=()=>{collect();offers.push({id:'pf'+Date.now(),giftId:campaigns.pointsOffers[0]?.id||'',points:500,stock:10,limit:1});paint();};$('#point-flash-form').onsubmit=busy(async e=>{collect();const f=e.currentTarget,v=Object.fromEntries(new FormData(f));Object.assign(r,{title:v.title,scheduleMode:v.scheduleMode,startTime:v.startTime,...Object.fromEntries(['weekDay','monthDay','durationMinutes','maxPerPhone','minCheckins'].map(k=>[k,Number(v[k])])),enabled:f.enabled.checked,offers});await saveRules('pointFlash');toast('积分秒杀配置已保存');await render();});};

views.membership=async()=>{const [campaigns,claims]=await Promise.all([api('campaigns'),api('member-benefits')]),m=rules.membership;draw(head('会员体系','配置等级、升级条件、季度福利与本季积分好物，让会员旅程清晰可见')+`<div class="rule-note">当前门槛与福利为可修改的演示配置。等级依据实际演示订单或成长值计算；福利按自然季度统计领取与使用情况。</div><div class="split-grid">${panel('等级与升级规则',`<form id="member-level-form">${select('basis','升级依据',m.basis,[['verified_spend','累计已核销消费金额'],['paid_spend','累计实付消费金额'],['growth','独立成长值']])}<div class="hint" style="margin:12px 0">金额口径填写人民币元，成长值口径填写整数；切换口径后请核对每一级门槛。</div><div class="member-level-labels"><span>等级名称</span><span>标识</span><span>升级门槛</span><span></span></div><div id="member-level-rows"></div><button type="button" id="add-member-level" class="small">＋ 新增等级</button><h3 style="margin-top:28px">成长值计算系数</h3><div class="form-grid">${field('perYuan','每消费1元成长值',m.growth.perYuan,'number')}${field('perCheckin','每签到1天成长值',m.growth.perCheckin,'number')}${field('perInvite','每邀请核销1位新客成长值',m.growth.perInvite,'number')}</div><div class="hint">仅独立成长值模式使用上述系数；退款消费不计入成长。</div>${footer('保存会员等级')}</form>`)}${panel('会员中心展示内容',`<div class="info-list">可用BP积分与当前等级<br>等级对应的福利及领取状态<br>福利使用次数与历史记录<br>距离下一级还差的条件<br>签到、兑换与升级的会员旅程<br>积分商城与纯积分秒杀入口<br>本季积分商城内容热推</div><p class="hint" style="margin-top:22px">当前演示顾客的等级会根据所选规则自动计算，无需手动修改。</p>`)}</div><section class="panel"><div class="panel-title"><div><h2>季度会员福利</h2><p>每项福利可关联多个等级，按季度独立计算次数</p></div><button id="add-benefit" class="small">＋ 添加福利</button></div><div id="member-benefit-table"></div></section>${panel('本季积分商城热推',`<form id="member-season-form">${field('seasonTitle','板块名称',m.seasonTitle)}<div class="tier-checks">${campaigns.pointsOffers.map(g=>`<label><input type="checkbox" name="featured" value="${g.id}" ${m.featuredOfferIds.includes(g.id)?'checked':''}><span>${esc(g.name)}<small>${g.cost} BP${g.cashPrice?' + '+money(g.cashPrice):''}</small></span></label>`).join('')}</div>${footer('保存本季推荐')}</form>`)}<section class="panel"><div class="panel-title"><div><h2>福利领取与使用记录</h2><p>顾客领取后，实际使用由运营核验，顾客端同步显示</p></div></div>${table(['顾客','福利 / 季度','领取等级','状态','领取时间','操作'],claims.map(c=>`<tr><td>${esc(c.userId)}</td><td><strong>${esc(c.benefitName)}</strong><div class="sub">${c.season}</div></td><td>${esc(c.levelName)}</td><td>${tag(c.status==='used'?'approved':c.expiresAt<Date.now()?'hidden':'pending',c.status==='used'?'已使用':c.expiresAt<Date.now()?'已过期':'待使用')}</td><td>${date(c.createdAt)}</td><td>${c.status!=='used'&&c.expiresAt>Date.now()?`<button class="link" data-use-benefit="${c.id}">登记已使用</button>`:'—'}</td></tr>`).join(''),'暂无福利领取记录')}</section>`);let levels=structuredClone(m.levels);const collect=()=>{const basis=$('[name=basis]').value;levels=$$('[data-level-id]').map(el=>({id:el.dataset.levelId,name:$('[name=name]',el).value,tag:$('[name=tag]',el).value,threshold:Math.round(Number($('[name=threshold]',el).value)*(basis==='growth'?1:100))}));};const paintLevels=()=>{const basis=$('[name=basis]').value;$('#member-level-rows').innerHTML=levels.map((l,i)=>`<div class="member-level-row" data-level-id="${l.id}"><input name="name" aria-label="等级名称" value="${esc(l.name)}"><input name="tag" aria-label="等级标识" value="${esc(l.tag)}"><input name="threshold" aria-label="升级门槛" type="number" min="0" step="${basis==='growth'?1:.01}" value="${l.threshold/(basis==='growth'?1:100)}" ${i===0?'readonly':''}><button class="ghost small" type="button" data-remove-level="${i}" ${i===0?'disabled':''}>×</button></div>`).join('');$$('[data-remove-level]').forEach(b=>b.onclick=()=>{collect();levels.splice(Number(b.dataset.removeLevel),1);paintLevels();});};paintLevels();$('[name=basis]').onchange=()=>{paintLevels();toast('口径已切换，请核对升级门槛后保存');};$('#add-member-level').onclick=()=>{collect();levels.push({id:'tier'+Date.now(),name:'新等级',tag:'VIP',threshold:(levels[levels.length-1]?.threshold||0)+100000});paintLevels();};$('#member-level-form').onsubmit=busy(async e=>{collect();const f=e.currentTarget;m.basis=f.basis.value;m.levels=levels;m.growth=Object.fromEntries(['perYuan','perCheckin','perInvite'].map(k=>[k,Number(f[k].value)]));await saveRules('membership');toast('会员等级已保存');await render();});const paintBenefits=()=>{$('#member-benefit-table').innerHTML=table(['福利名称','适用等级','类型','季度次数','操作'],m.benefits.map((b,i)=>`<tr><td><strong>${esc(b.name)}</strong><div class="sub">${esc(b.description)}</div></td><td><div class="comment-text">${esc(m.levels.filter(l=>b.levelIds.includes(l.id)).map(l=>l.name).join('、'))}</div></td><td>${b.type==='coupon'?'会员礼券':'专属礼遇'}</td><td>${b.quota}次</td><td><button class="link" data-edit-benefit="${i}">编辑福利</button></td></tr>`).join(''));$$('[data-edit-benefit]').forEach(b=>b.onclick=()=>editBenefit(Number(b.dataset.editBenefit)));};const editBenefit=index=>{const b=index==null?{id:'mb'+Date.now(),name:'新福利',description:'',type:'perk',couponId:'',quota:1,levelIds:[m.levels[0].id]}:m.benefits[index];drawer('会员福利配置',field('name','福利名称',b.name)+field('description','福利说明',b.description)+select('type','福利类型',b.type,[['coupon','礼券（领取后进入我的礼券）'],['perk','专属礼遇（由门店安排）']])+select('couponId','关联礼券',b.couponId,[['','专属礼遇可不选'],...campaigns.coupons.map(c=>[c.id,c.name])])+field('quota','每季度可领取次数',b.quota,'number')+`<div class="form-field">适用会员等级<div class="tier-checks">${m.levels.map(l=>`<label><input type="checkbox" name="levelIds" value="${l.id}" ${b.levelIds.includes(l.id)?'checked':''}><span>${esc(l.name)}</span></label>`).join('')}</div></div>`,async f=>{const v=Object.fromEntries(new FormData(f));v.levelIds=new FormData(f).getAll('levelIds');v.quota=Number(v.quota);if(v.type==='coupon'&&!v.couponId)throw Error('请选择关联的会员礼券');const value={...b,...v};if(index==null)m.benefits.push(value);else m.benefits[index]=value;await saveRules('membership');});};paintBenefits();$('#add-benefit').onclick=()=>editBenefit(null);$('#member-season-form').onsubmit=busy(async e=>{m.seasonTitle=e.currentTarget.seasonTitle.value;m.featuredOfferIds=new FormData(e.currentTarget).getAll('featured');await saveRules('membership');toast('本季热推已保存');});$$('[data-use-benefit]').forEach(b=>b.onclick=()=>drawer('登记福利已使用','<div class="rule-note">确认本次会员福利已经实际使用？登记后顾客端将同步显示已用次数。</div>',async()=>api('member-benefits/'+b.dataset.useBenefit,'PUT',{}),true));};



views['home-shortcuts']=async()=>{
  let items=structuredClone(rules.homeShortcuts.items);
  const bannerImage=rules.homeBanner?.image;
  const bannerPanel=panel('首页 Banner',`<form id="home-banner-form">
    <label class="form-field">替换首页顶部图片
      <input name="bannerFile" type="file" accept="image/jpeg,image/png,image/webp" required>
      <span class="hint">建议 1500 × 1760 像素（约 5:6 竖图）。支持 JPG、PNG、WebP，单张不超过 3 MB。</span>
      <span class="hint">主体靠右，左侧约 40% 留给首页标题和积分卡，顶部留给导航。请上传无文字底图，部分屏幕可能裁切边缘。</span>
    </label>
    ${bannerImage?'<p class="hint">已设置自定义 Banner，保存新图片即可替换。</p>':''}
    ${footer('保存首页 Banner')}
  </form>`);
  const previewBase=PORTAL_BASE;
  const previewTabs=[['home-active','首页'],['grid','分类'],['heart','服务'],['member','会员'],['user','我的']];
  const previewPanel=panel('手机预览',`<div class="shortcut-phone">
    <div class="shortcut-phone-screen" aria-label="手机首页预览，390 × 844">
      <div class="shortcut-phone-content">
      <div class="shortcut-phone-hero">
        <img id="shortcut-preview-banner" class="${bannerImage?'':'default-banner'}" alt="">
        <div class="shortcut-phone-status">9:41</div>
        <div class="shortcut-phone-brand">医联·好美</div>
        <div class="shortcut-phone-copy">让专业<br>定义自然美</div>
        <div class="shortcut-phone-points">BP　美丽积分　2860</div>
      </div>
      <div id="shortcut-preview-grid" class="shortcut-phone-grid"></div>
      </div>
      <div class="shortcut-phone-tabs" aria-hidden="true">
        ${previewTabs.map(([name,label])=>`<div><img src="${previewBase}/miniapp/assets/icons/${name}.png" alt=""><span>${label}</span></div>`).join('')}
      </div>
    </div>
  </div><p class="hint shortcut-phone-note">390 × 844 · 首页局部预览，修改即时显示。</p>`);
  draw(head('首页快捷入口','配置首页图标区的名称、图标、跳转、顺序和启用状态')+'<div class="home-shortcuts-layout"><div>'+(currentUser?.role==='viewer'?'':bannerPanel)+panel('快捷入口配置','<div class="rule-note"><strong>展示规则</strong><br>至少启用3个。3—5个全部展示；超过5个，首页显示前4个与“更多”，“更多”展示全部已启用入口。</div><form id="shortcuts-form"><div id="shortcut-rows"></div><button type="button" class="small" id="add-shortcut">＋ 新增入口</button>'+footer('保存首页入口')+'</form>')+'</div><aside class="home-shortcuts-preview">'+previewPanel+'</aside></div>');
  const bannerForm=$('#home-banner-form');
  const bannerPreview=$('#shortcut-preview-banner');
  const bannerSource=bannerImage
    ? PORTAL_BASE+bannerImage
    : PORTAL_BASE+'/miniapp/assets/images/home-portrait-v2.jpg';
  bannerPreview.src=bannerSource;
  const bannerInput=bannerForm?.elements.bannerFile;
  if(bannerInput)bannerInput.onchange=()=>{
    const file=bannerInput.files[0];
    if(!file||file.size>3000000||!['image/jpeg','image/png','image/webp'].includes(file.type)){
      bannerPreview.src=bannerSource;
      bannerPreview.classList.toggle('default-banner',!bannerImage);
      return;
    }
    const reader=new FileReader();
    reader.onload=()=>{
      if(bannerInput.files[0]!==file)return;
      bannerPreview.src=reader.result;
      bannerPreview.classList.remove('default-banner');
    };
    reader.readAsDataURL(file);
  };
  if(bannerForm)bannerForm.onsubmit=busy(async event=>{
    const file=event.currentTarget.elements.bannerFile.files[0];
    if(!file||file.size>3000000)throw Error('请选择 3 MB 以内的 Banner 图片');
    const base64=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result.split(',')[1]);
      reader.onerror=()=>reject(new Error('读取 Banner 图片失败'));
      reader.readAsDataURL(file);
    });
    const upload=await api('product-image','POST',{base64});
    await api('rules','PUT',{section:'homeBanner',value:{image:upload.url}});
    toast('首页 Banner 已保存');
    await render();
  });
  const pageOptions=[["invite-rewards","邀请礼遇"],["order-lottery","订单抽奖"],["group-buy", "社群拼团"], ["flash-sale", "社群秒杀"], ["points-mall", "积分商城"], ["aftercare", "术后护理"], ["coupon-center", "领券中心"], ["point-flash", "积分秒杀"], ["member-center", "会员中心"], ["my-projects", "我的项目"], ["arrival", "到院指引"], ["treatment", "诊疗计划"], ["service", "服务"], ["category", "商品分类"], ["cart", "购物车"]],iconOptions=[["group", "双人"], ["flash", "秒杀时钟"], ["gift", "礼物"], ["care", "护理箱"], ["ticket", "优惠券"], ["grid", "四宫格"], ["heart", "爱心"], ["member", "会员"], ["calendar", "日历"], ["pin", "定位"], ["cart", "购物车"]];
  const collect=()=>{items=$$('[data-shortcut-id]').map(row=>({id:row.dataset.shortcutId,label:$('[name=label]',row).value,icon:$('[name=icon]',row).value,page:$('[name=page]',row).value,enabled:$('[name=enabled]',row).checked}));};
  const paintPreview=()=>{
    const enabled=items.filter(item=>item.enabled);
    const visible=enabled.length>5?enabled.slice(0,4).concat({label:'更多',icon:'grid'}):enabled;
    const grid=$('#shortcut-preview-grid');
    grid.style.setProperty('--entry-columns',Math.max(1,visible.length));
    grid.innerHTML=visible.length?visible.map(item=>`<div class="shortcut-phone-entry"><span class="shortcut-phone-icon"><img src="${previewBase}/miniapp/assets/icons/${esc(item.icon)}.png" alt=""></span><span>${esc(item.label)}</span></div>`).join('')
      :'<div class="shortcut-phone-empty">暂无已启用入口</div>';
  };
  const shortcutsForm=$('#shortcuts-form');
  shortcutsForm.oninput=()=>{collect();paintPreview();};
  shortcutsForm.onchange=()=>{collect();paintPreview();};
  const paint=()=>{
    paintPreview();
    $('#shortcut-rows').innerHTML=items.map((item,i)=>'<div class="shortcut-config-row" data-shortcut-id="'+esc(item.id)+'"><div class="form-grid">'+field('label','入口名称',item.label)+select('icon','线性图标',item.icon,iconOptions)+select('page','跳转页面',item.page,pageOptions)+'</div><div class="shortcut-row-actions"><label><input name="enabled" type="checkbox" '+(item.enabled?'checked':'')+'> 启用展示</label><button type="button" class="small ghost" data-move="'+i+'" data-step="-1" '+(i===0?'disabled':'')+'>上移</button><button type="button" class="small ghost" data-move="'+i+'" data-step="1" '+(i===items.length-1?'disabled':'')+'>下移</button><button type="button" class="link danger" data-remove-shortcut="'+i+'">删除</button></div></div>').join('');
    $$('[data-move]').forEach(button=>button.onclick=()=>{collect();const a=Number(button.dataset.move),b=a+Number(button.dataset.step);if(b<0||b>=items.length)return;[items[a],items[b]]=[items[b],items[a]];paint();});
    $$('[data-remove-shortcut]').forEach(button=>button.onclick=()=>{collect();items.splice(Number(button.dataset.removeShortcut),1);paint();});
  };
  paint();$('#add-shortcut').onclick=()=>{collect();if(items.length>=30)return toast('最多配置30个入口');items.push({id:'hs'+Date.now(),label:'新入口',icon:'grid',page:'points-mall',enabled:false});paint();};
  $('#shortcuts-form').onsubmit=busy(async()=>{collect();if(items.filter(x=>x.enabled).length<3)throw Error('首页至少启用3个快捷入口');await api('rules','PUT',{section:'homeShortcuts',value:{items}});toast('首页入口已保存');await render();});
};

const originalContentView=views.content;
views.content=async()=>{
  await originalContentView();
  if(currentUser?.role==='viewer')return;
  $('.page-head .head-actions').insertAdjacentHTML('beforeend','<button id="batch-doctors" class="primary">'+icon('file')+'批量新建医生</button>');
  $('#batch-doctors').onclick=()=>{
    let drafts=[];
    drawer('批量上传医生介绍海报','<div class="rule-note">每批最多20张，单张3MB以内。图片在服务器本地识别，不发送到第三方AI。请逐项核对姓名、简介与擅长方向，确认后才会创建医生；已有同名医生不会被覆盖。头像可在创建后通过“编辑资料”上传。</div><label class="form-field">上传医生海报<input id="doctor-posters" type="file" multiple accept="image/png,image/jpeg,image/webp" aria-label="批量上传医生海报"></label><div id="poster-progress" role="status"></div><div id="doctor-drafts"></div>',async()=>{
      if(!drafts.length)throw Error('请先上传医生海报');
      const items=$$('[data-doctor-draft]').map(row=>{
        const draft=drafts[Number(row.dataset.doctorDraft)];
        const value={...draft.fields};
        for(const name of ['name','title','introduction','specialty','focus','clinicId'])value[name]=$('[name='+name+']',row).value;
        return value;
      });
      const result=await api('doctors/batch','POST',{items});return '已创建'+result.created+'名医生，资料已同步小程序';
    },true,'确认并批量创建');
    const paint=()=>{
      $('#doctor-drafts').innerHTML=drafts.map((draft,i)=>'<section class="doctor-import-card" data-doctor-draft="'+i+'"><div class="between"><h3>第'+(i+1)+'位 · '+esc(draft.filename)+'</h3><button type="button" class="link danger" data-drop-doctor="'+i+'">移除此项</button></div><a class="poster-preview-link" href="'+esc(assetUrl(draft.fields.posterImage))+'" target="_blank" rel="noopener"><img class="doctor-poster-preview" src="'+esc(assetUrl(draft.fields.posterImage))+'" alt="医生原始介绍海报"></a>'+(draft.warning?'<div class="rule-note">'+esc(draft.warning)+'</div>':'')+'<div class="form-grid">'+field('name','医生姓名',draft.fields.name)+field('title','职称（以资料为准）',draft.fields.title)+select('clinicId','咨询院区',draft.fields.clinicId||'',[['','请选择院区'],...cache.doctorImportClinics.map(c=>[c.id,c.name])])+'</div><label class="form-field">医生简介<textarea name="introduction" rows="7">'+esc(draft.fields.introduction)+'</textarea></label>'+field('specialty','擅长方向概述',draft.fields.specialty)+'<label class="form-field">擅长项目（每行一个）<textarea name="focus" rows="4">'+esc(draft.fields.focus.join('\n'))+'</textarea></label><details><summary>查看识别原文</summary><pre class="poster-ocr-text">'+esc(draft.text||'未识别到文字，可对照原图填写')+'</pre></details></section>').join('');
      $$('[data-drop-doctor]').forEach(button=>button.onclick=()=>{const rows=$$('[data-doctor-draft]');rows.forEach(row=>{const draft=drafts[Number(row.dataset.doctorDraft)];for(const name of ['name','title','introduction','specialty','clinicId'])draft.fields[name]=$('[name='+name+']',row).value;draft.fields.focus=$('[name=focus]',row).value.split('\n');});drafts.splice(Number(button.dataset.dropDoctor),1);paint();});
    };
    const input=$('#doctor-posters');
    input.onchange=busy(async()=>{
      $$('[data-doctor-draft]').forEach(row=>{const draft=drafts[Number(row.dataset.doctorDraft)];for(const name of ['name','title','introduction','specialty','clinicId'])draft.fields[name]=$('[name='+name+']',row).value;draft.fields.focus=$('[name=focus]',row).value.split('\n');});
      const files=[...input.files];
      if(files.length+drafts.length>20)throw Error('每批最多20张海报');
      if(files.some(f=>f.size>3000000))throw Error('请选择每张3MB以内的海报');
      input.disabled=true;const submit=$('#drawer-root button[type=submit]');submit.disabled=true;
      try{
        cache.doctorImportClinics=await api('catalog/clinics');
        for(let i=0;i<files.length;i++){
          $('#poster-progress').textContent='正在识别 '+(i+1)+' / '+files.length+'：'+files[i].name;
          const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(files[i]);});
          drafts.push(await api('doctor-posters','POST',{filename:files[i].name,base64}));
        }
        $('#poster-progress').textContent='已识别'+drafts.length+'张，请核对后点击“确认并批量创建”。';paint();
      }finally{input.disabled=false;input.value='';submit.disabled=false;paint();}
    });
  };
};

views.aftercare=async()=>{
  const items=rules.aftercare||[];
  const save=async next=>{await api('rules','PUT',{section:'aftercare',value:next});await render();};
  const edit=index=>{const p=index<0?{id:'care-'+Date.now(),title:'',category:'',image:''}:items[index];
    drawer(index<0?'上传术后护理图片':'编辑术后护理图片',field('title','图片标题',p.title)+field('category','护理分类',p.category,'text','同名分类会合并到同一个侧边栏入口')+field('image','图片路径',p.image,'text','请选择下方的图片文件上传，支持 PNG、JPG、WebP，单张 3MB 以内'),async f=>{
      const next=[...items],item={...p,...Object.fromEntries(new FormData(f))};
      for(const k of ['title','category','image'])item[k]=item[k].trim();
      if(!item.title||!item.category||!item.image)throw Error('请填写标题、分类并上传图片');
      if(index<0)next.push(item);else next[index]=item;
      await save(next);return '护理图片已保存';
    });
  };
  draw(head('术后护理','上传图片并设置分类，保存后同步小程序','<button class="primary" id="new-care">上传护理图片</button><button class="primary" id="batch-care">批量上传</button>')+panel('护理图片资料',table(['图片标题','分类','操作'],items.map((p,i)=>'<tr><td>'+thumb({name:p.title,image:p.image})+esc(p.title)+'</td><td>'+esc(p.category)+'</td><td><button class="link" data-care-edit="'+i+'">编辑图片</button> <button class="link danger" data-care-remove="'+i+'">删除</button></td></tr>').join(''),'暂无护理图片')));
  $('#new-care').onclick=()=>edit(-1);
  $('#batch-care').onclick=()=>{
    const uploaded=new Map();
    const form=drawer('批量上传护理图片',
      field('category','护理分类','','text','本批图片使用同一分类，上传后可单独编辑')+
      '<label class="form-field">选择护理图片<input name="posters" type="file" multiple accept="image/png,image/jpeg,image/webp"><span class="hint">可多选，单张 3 MB 以内。文件名自动作为图片标题。</span></label><p class="hint" data-care-progress role="status"></p>',
      async f=>{
        const category=f.elements.category.value.trim();
        const files=[...f.elements.posters.files];
        if(!category||!files.length)throw Error('请填写护理分类并选择图片');
        if(files.length>150-items.length)throw Error('护理图片最多150张');
        if(files.some(file=>!file.size||file.size>3000000))throw Error('每张图片须在 3 MB 以内');
        const progress=$('[data-care-progress]',f);
        const batch=[];
        for(const [index,file] of files.entries()){
          progress.textContent='正在上传 '+(index+1)+' / '+files.length;
          if(!uploaded.has(file)){
            const base64=await new Promise((resolve,reject)=>{
              const reader=new FileReader();
              reader.onload=()=>resolve(reader.result.split(',')[1]);
              reader.onerror=()=>reject(new Error('读取图片失败：'+file.name));
              reader.readAsDataURL(file);
            });
            uploaded.set(file,{id:'care-'+crypto.randomUUID(),image:(await api('product-image','POST',{base64})).url});
          }
          batch.push({...uploaded.get(file),title:file.name.replace(/\.[^.]+$/,'').trim()||file.name,category});
        }
        await api('aftercare/batch','POST',{items:batch});
        return '已批量上传 '+batch.length+' 张护理图片';
      },false,'上传并保存');
    form.elements.posters.onchange=()=>{uploaded.clear();};
  };
  $$('[data-care-edit]').forEach(b=>b.onclick=()=>edit(Number(b.dataset.careEdit)));
  $$('[data-care-remove]').forEach(b=>b.onclick=()=>drawer('移除护理图片','<p>移除后，这张图片不会在小程序中显示。</p>',async()=>{await save(items.filter((_,i)=>i!==Number(b.dataset.careRemove)));return '护理图片已移除';}));
};
const requireFreshLogin=new URL(location.href).searchParams.get('login')==='1';
if(requireFreshLogin){
  try{await api('logout','POST',{});}catch{}
  const cleanUrl=new URL(location.href);cleanUrl.searchParams.delete('login');cleanUrl.hash='';
  history.replaceState(null,'',cleanUrl.pathname+cleanUrl.search);login();
}else{
  try{currentUser=await api('session');cache.categories=await api('catalog/categories');await render();}catch{login();}
}

function applyReadonly(){if(currentUser?.role!=='viewer')return;for(const form of document.querySelectorAll('#main form,#drawer-root form')){for(const e of form.querySelectorAll('input,select,textarea,button[type=submit]')){e.disabled=true;e.title='当前账号为只读权限';}}for(const e of document.querySelectorAll('#main button')){if(/批量|上传|上移|下移|保存|删除|恢复|新增|添加|核销|模拟|审核|通过|拒绝|登记|奖励|取消订单|确认付款|退款/.test(e.textContent)){e.disabled=true;e.title='当前账号为只读权限';}}}
new MutationObserver(applyReadonly).observe(document.body,{childList:true,subtree:true});
