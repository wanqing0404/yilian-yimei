const remote=require('../../utils/remote');
const data=require('../../utils/data');
const store=require('../../utils/store');
Page(remote.page({
  data:{
    doctor:null,
    clinic:null,
    consultationSteps:[
      {number:'01',title:'沟通诉求',description:'了解个人需求与希望咨询的方向'},
      {number:'02',title:'面诊评估',description:'由专业医生进行面对面沟通与评估'},
      {number:'03',title:'方案沟通',description:'了解服务安排、注意事项与后续计划'}
    ]
  },
  onLoad(query){
    const doctor=data.doctors.find(item=>item.id===query.id);
    if(!doctor){this.setData({doctor:null});return;}
    this.setData({doctor});
  },
  onShow(){
    if(!this.data.doctor)return;
    const city=store.read().city;
    this.setData({clinic:data.clinics.find(item=>item.city===city)||data.clinics[0]});
  },
  viewClinics(){wx.navigateTo({url:'/pages/records/index?type=clinics'});},
  goService(){wx.switchTab({url:'/pages/service/index'});}
}));
