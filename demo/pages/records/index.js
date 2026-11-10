const remote=require('../../utils/remote');
const data=require('../../utils/data');const store=require('../../utils/store');
const titles={giftbalance:'赠送余额',orders:'我的订单',points:'我的BP积分',coupons:'我的优惠券',clinics:'直营机构',doctors:'全部医生',environment:'医院介绍',settings:'设置'};
Page(remote.page({data:{type:'orders',title:'我的订单',status:'全部',statuses:['全部','待付款','待使用','售后/退款'],orders:[],points:0,giftBalance:'0.00',clinicId:'',clinics:[],clinic:null,directoryDoctors:[],environmentPhotos:data.environmentPhotos,coupons:[],pointTransactions:[]},onLoad(q){const type=titles[q.type]?q.type:'orders';this.setData({type,title:type==='clinics'&&q.id?'院区详情':titles[type],clinicId:q.id||'',status:q.status||'全部'});},onShow(){this.refresh();},refresh(){
const {type,clinicId}=this.data;
if(type==='environment')return;
if(type==='doctors'||type==='clinics'){
  const clinics=data.clinics.map(item=>({...item,logo:data.clinicLogos[item.id]}));
  const selectedClinic=clinics.find(item=>item.id===clinicId);
  const clinicPhotos={c1:'/assets/images/clinics/zhenmei-interior.jpg',c3:'/assets/images/clinics/zhimei-interior.jpg'};
  const clinic=selectedClinic?{...selectedClinic,cover:selectedClinic.image||clinicPhotos[clinicId]}:null;
  const doctors=type==='doctors'?data.doctors:clinic?data.doctors.filter(doctor=>doctor.clinicId===clinic.id):[];
  const directoryDoctors=doctors.map(doctor=>({
    ...doctor,
    clinicName:clinics.find(item=>item.id===doctor.clinicId)?.name||'',
    focusSummary:doctor.focus?.filter(Boolean).slice(0,3).join('、')||doctor.specialty||''
  }));
  this.setData({clinics,clinic,directoryDoctors});
  return;
}
const s=store.read();this.setData({orders:s.orders.filter(o=>this.data.status==='全部'||o.status===this.data.status).map(o=>Object.assign({},o,{displayTotal:store.money(o.total),date:new Date(o.createdAt).toLocaleDateString()})),points:s.points,giftBalance:((s.giftBalance||0)/100).toFixed(2),coupons:store.availableCoupons(),pointTransactions:s.pointTransactions.map(x=>Object.assign({},x,{amountLabel:(x.amount>=0?'+':'')+x.amount}))});},changeStatus(e){this.setData({status:e.currentTarget.dataset.status});this.refresh();},orderInfo(){wx.showModal({title:'演示订单',content:'演示订单已连接本机运营后台，可在后台模拟付款、到院核销与退款。真实支付尚未接入。',showCancel:false});},
openClinic(e){wx.navigateTo({url:'/pages/records/index?type=clinics&id='+encodeURIComponent(e.currentTarget.dataset.id)});},
openDoctor(e){wx.navigateTo({url:'/pages/doctor-detail/index?id='+encodeURIComponent(e.currentTarget.dataset.id)});},goCouponCenter(){wx.navigateTo({url:'/pages/coupon-center/index'});},goCategory(){wx.switchTab({url:'/pages/category/index'});},reset(){wx.showModal({title:'清除本地演示数据',content:'仅清除此框架的购物车、订单、积分商城、拼团、优惠券及护理记录，其他小程序数据不受影响。',success:r=>{if(r.confirm){wx.removeStorageSync('haomei_framework_v1');store.refreshBadge();this.refresh();wx.showToast({title:'已清除',icon:'success'});}}});},about(){wx.showModal({title:'关于医联·好美',content:'原生微信小程序页面框架 v1.0.0，使用本地示例数据，无真实交易。',showCancel:false});}}));
