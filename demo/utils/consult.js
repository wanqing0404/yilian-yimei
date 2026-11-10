const data=require('./data');
function response(text,city){
 if(/优惠|券|福利/.test(text))return {content:'可前往领券中心领取示例优惠券，领取后可在“我的优惠券”查看。',action:'coupon-center',actionLabel:'前往领券中心'};
 if(/院区|地址|时间|营业/.test(text)){const c=data.clinics.find(x=>x.city===city)||data.clinics[0];if(!c)return {content:'暂无院区资料',action:'service',actionLabel:'查看服务'};return {content:c.name+'，营业时间 '+c.hours+'。当前地址为示例资料，可在院区列表查看信息。',action:'clinics',actionLabel:'查看院区信息'};}
 if(/价格|费用|项目|秒杀|拼团/.test(text))return {content:'项目示例价格可在分类页查看，活动价格以对应活动页展示为准。具体服务内容与适用性需由医生面诊确认。',action:'category',actionLabel:'查看全部项目'};
 if(/预约|医生|咨询流程/.test(text))return {content:'在服务页可查看医生介绍、坐诊日期和院区信息。',action:'service',actionLabel:'查看医生与服务'};
 return {content:'已收到您的留言。当前是本地咨询演示，未连接真实客服；您可以查看项目、了解院区，或查看医生的坐诊安排。',action:'service',actionLabel:'查看医生与服务'};
}
module.exports={response};
