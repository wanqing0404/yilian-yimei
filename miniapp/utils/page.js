const store=require('./store');
function addToCart(e){if(store.addCart(e.currentTarget.dataset.id)===false)return;wx.showToast({title:'已加入购物车',icon:'success'});}
function openProduct(e){wx.navigateTo({url:'/pages/detail/index?id='+e.currentTarget.dataset.id});}
function openBooking(e){wx.navigateTo({url:'/pages/booking/index'+(e&&e.currentTarget.dataset.id?'?doctor='+e.currentTarget.dataset.id:'' )});}
function cityChanged(e){this.setData({city:e.detail.city});if(this.loadClinic)this.loadClinic();}
function sync(){this.setData({city:store.read().city});store.refreshBadge();}
module.exports={addToCart,openProduct,openBooking,cityChanged,sync};
