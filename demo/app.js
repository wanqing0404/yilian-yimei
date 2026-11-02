const remote=require('./utils/remote');
const store = require('./utils/store');
App({
  globalData: { statusBarHeight: 20, navHeight: 44, navRight: 106 },
  onLaunch() {
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const capsule = wx.getMenuButtonBoundingClientRect();
      const status = info.statusBarHeight || 20;
      this.globalData = { statusBarHeight: status, navHeight: capsule.height ? (capsule.top - status) * 2 + capsule.height : 44, navRight: info.windowWidth - capsule.left + 12 };
    } catch (e) { console.warn('使用默认导航尺寸', e); }
    store.refreshBadge();
    return remote.refresh().catch(()=>{});
  }
});
