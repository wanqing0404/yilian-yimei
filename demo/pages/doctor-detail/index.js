const remote=require('../../utils/remote');
const data=require('../../utils/data');
const store=require('../../utils/store');
function buildCalendar(year,month,schedule){
  const offset=new Date(Date.UTC(year,month-1,1)).getUTCDay();
  const count=new Date(Date.UTC(year,month,0)).getUTCDate();
  const entries=new Map(),notes=[];
  for(const line of (schedule||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean)){
    const match=line.match(/^(?:(\d{4})[-/])?(?:(\d{1,2})[-/月])?(\d{1,2})(?:日|号)?(?:\s*[:：]\s*|\s+|(?=坐诊|公休|休息|停诊)|$)(.*)$/);
    if(!match||+match[3]<1||+match[3]>count||(match[1]&&+match[1]!==year)||(match[2]&&+match[2]!==month)){
      notes.push(line);
      continue;
    }
    const detail=match[4].trim();
    const label=detail.startsWith('公休')?'公休':/^(休息|停诊)/.test(detail)?'休息':'坐诊';
    entries.set(+match[3],{label,detail:detail===label?'':detail});
  }
  const days=Array.from({length:Math.ceil((offset+count)/7)*7},(_,key)=>{
    const day=key-offset+1;
    return day<1||day>count?{key,day:''}:{key,day,...entries.get(day)};
  });
  return {days,notes:notes.join('\n'),hasSchedule:entries.size>0||notes.length>0};
}
Page(remote.page({
  data:{
    doctor:null,
    weekdays:['日','一','二','三','四','五','六'],
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
    const now=new Date(Date.now()+8*3600000);
    const month=now.toISOString().slice(0,7);
    const clinicTag=data.clinics.find(clinic=>clinic.id===doctor.clinicId)?.name.replace(/^医联|医疗美容$/g,'')||'';
    const monthNumber=now.getUTCMonth()+1;
    const calendar=buildCalendar(now.getUTCFullYear(),monthNumber,doctor.scheduleMonth===month?doctor.scheduleText:'');
    this.setData({doctor,clinicTag,monthNumber,calendar});
  },
  onShow(){
    if(!this.data.doctor)return;
    this.setData({clinic:data.clinics.find(item=>item.id===this.data.doctor.clinicId)||null});
  },
  viewClinics(){wx.navigateTo({url:'/pages/records/index?type=clinics'});},
  goService(){wx.switchTab({url:'/pages/service/index'});}
}));
