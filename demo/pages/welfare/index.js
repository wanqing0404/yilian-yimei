const remote = require('../../utils/remote');
const catalogue = require('../../utils/data');

Page(remote.page({
  data: { connected: false, loading: true, busy: false, rules: null, customer: null,
    stages: [], inviteGuest: false, demoAuthorized: false },
  onLoad(query) {
    if (query?.tab === 'lottery') {
      wx.redirectTo({ url: '/pages/order-lottery/index' });
      return;
    }
    this.setData({ inviteGuest: query?.invited === '1' });
  },
  onShow() {
    this.loadRemote();
  },
  async loadRemote() {
    try {
      await remote.refresh();
      const { rules, customer } = remote.get();
      const stages = rules.activity.stages.map(stage => ({
        ...stage, lit: customer.activityProgress >= stage.threshold,
        claimed: customer.claims.some(claim => claim.stageId === stage.id && claim.activityId === rules.activity.id)
      }));
      this.setData({ connected: true, loading: false, rules, customer, stages });
    } catch (error) {
      this.setData({ connected: false, loading: false, error: error.message });
    }
  },
  claim(event) {
    this.run('customer/activity/claim', { stageId: event.currentTarget.dataset.id }, '奖励已领取');
  },
  run(path,body,message){if(this.data.busy)return;this.setData({busy:true});remote.request(path,'POST',body||{}).then(r=>{wx.showToast({title:typeof message==='function'?message(r):message,icon:'none'});this.loadRemote();}).catch(e=>wx.showToast({title:e.message,icon:'none'})).finally(()=>this.setData({busy:false}));},
  onShareAppMessage(){return {title:this.data.rules?.activity?.title||'邀请有礼',path:'/pages/welfare/index?invited=1',imageUrl:'/assets/images/invite-friends-10bp.jpg'};},
authorizeDemo(){this.setData({demoAuthorized:true});},
purchaseDemo(){
  const products=catalogue.products.filter(product=>!product.hidden&&product.price>0).slice(0,6);
  if(!products.length){wx.showToast({title:'暂无演示商品',icon:'none'});return;}
  wx.showActionSheet({itemList:products.map(p=>p.name),success:choice=>{
    const product=products[choice.tapIndex];
    this.run('customer/invite/demo-purchase',{productId:product.id,authorized:this.data.demoAuthorized},()=>{this.setData({inviteGuest:false,demoAuthorized:false});return '演示好友已加入列表';});
  }});
},retry(){this.loadRemote();}}));
