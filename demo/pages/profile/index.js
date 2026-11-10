const remote=require('../../utils/remote');
const data=require('../../utils/data');const store=require('../../utils/store');
Page(remote.page({
 data:{profile:{},giftBalance:'0.00',points:0,couponCount:0,avatarImage:data.avatarImage,
 orderTypes:[{label:'待支付',status:'待付款',icon:'wallet'},{label:'购物车',status:'cart',icon:'cart'},{label:'待使用',status:'待使用',icon:'redeem'},{label:'售后/退款',status:'售后/退款',icon:'shield'}],
 links:[{label:'到院指引',icon:'pin',type:'arrival',value:''},{label:'在线客服',icon:'headset',type:'consult',value:''},{label:'我的项目',icon:'grid',type:'my-projects',value:''}]},
 onShow(){const s=store.read();this.setData({profile:s.profile,memberLevel:s.membership?s.membership.level.name:'银雾会员',memberTag:s.membership?s.membership.level.tag:'SVIP',giftBalance:((s.giftBalance||0)/100).toFixed(2),points:s.points,couponCount:store.availableCoupons().length});store.refreshBadge();},
 openOrders(e){if(e.currentTarget.dataset.status==='cart'){wx.navigateTo({url:'/pages/cart/index'});return;}wx.navigateTo({url:'/pages/records/index?type=orders&status='+encodeURIComponent(e.currentTarget.dataset.status||'全部')});},
 openRecord(e){const type=e.currentTarget.dataset.type;if(['arrival','consult','my-projects'].indexOf(type)>-1)wx.navigateTo({url:'/pages/'+type+'/index'});else wx.navigateTo({url:'/pages/records/index?type='+type});},
 avatarError(){this.setData({avatarImage:''});},
 settings(){wx.navigateTo({url:'/pages/records/index?type=settings'});},
 membership(){wx.switchTab({url:'/pages/member-center/index'});}
}));
