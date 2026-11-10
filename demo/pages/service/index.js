const remote=require('../../utils/remote');
const data=require('../../utils/data');const store=require('../../utils/store');const shared=require('../../utils/page');
function doctorWindow(doctors,index){if(doctors.length<=3)return doctors;return [doctors[(index+doctors.length-1)%doctors.length],doctors[index],doctors[(index+1)%doctors.length]];}
Page(remote.page({data:{city:'北京',doctors:data.doctors,visibleDoctors:data.doctors,doctorIndex:1,clinic:null,clinicMaps:[]},onShow(){shared.sync.call(this);const index=Math.min(this.data.doctorIndex,Math.max(0,data.doctors.length-1));const doctors=data.doctors.map(doctor=>({...doctor,clinicTag:data.clinics.find(clinic=>clinic.id===doctor.clinicId)?.name.replace(/^医联|医疗美容$/g,'')||''}));this.setData({doctors,doctorIndex:index,visibleDoctors:doctorWindow(doctors,index)});this.loadClinic();},loadClinic(){
  const clinicMaps=data.clinics.map(clinic=>({
    ...clinic,
    logo:data.clinicLogos[clinic.id]
  }));
  this.setData({clinicMaps,clinic:clinicMaps.find(clinic=>clinic.city===this.data.city)||clinicMaps[0]||null});
},
selectDoctor(e){
  this.showDoctor(Number(e.currentTarget.dataset.index));
},
showDoctor(index){
  this.setData({doctorIndex:index,visibleDoctors:doctorWindow(this.data.doctors,index)});
},
startDoctorSwipe(e){
  this.doctorSwipeStart=e.touches.length===1?e.touches[0]:null;
},
cancelDoctorSwipe(){
  this.doctorSwipeStart=null;
},
endDoctorSwipe(e){
  const start=this.doctorSwipeStart;
  this.cancelDoctorSwipe();
  const end=e.changedTouches[0];
  const count=this.data.doctors.length;
  if(!start||!end||count<2)return;
  const dx=end.clientX-start.clientX;
  const dy=end.clientY-start.clientY;
  if(Math.abs(dx)<=55||Math.abs(dx)<=Math.abs(dy)*1.6)return;
  const step=dx<0?1:-1;
  this.showDoctor((this.data.doctorIndex+step+count)%count);
},
openDoctor(e){const id=e.currentTarget.dataset.id;const index=data.doctors.findIndex(d=>d.id===id);if(index<0)return;this.setData({doctorIndex:index});wx.navigateTo({url:'/pages/doctor-detail/index?id='+encodeURIComponent(id)});},allClinics(){wx.navigateTo({url:'/pages/records/index?type=clinics'});},allDoctors(){wx.navigateTo({url:'/pages/records/index?type=doctors'});},clinicInfo(e){wx.navigateTo({url:'/pages/records/index?type=clinics&id='+encodeURIComponent(e.currentTarget.dataset.id)});},clinicContact(e){const clinic=this.data.clinicMaps.find(item=>item.id===e.currentTarget.dataset.id);if(!clinic)return;wx.showModal({title:clinic.name,content:clinic.address+'\n营业时间 '+clinic.hours+'\n当前为门店信息框架，地址和电话待接入。',showCancel:false});}}));
