const remote=require('../../utils/remote');
const store=require('../../utils/store');
Page(remote.page({data:{tab:'进行中',plans:[],visible:[],expanded:'',tabs:['进行中','已完成']},onShow(){this.setData({plans:store.read().treatmentPlans});this.filter();},changeTab(e){this.setData({tab:e.currentTarget.dataset.tab});this.filter();},filter(){this.setData({visible:this.data.plans.filter(x=>x.status===this.data.tab)});},expand(e){this.setData({expanded:this.data.expanded===e.currentTarget.dataset.id?'':e.currentTarget.dataset.id});}}));
