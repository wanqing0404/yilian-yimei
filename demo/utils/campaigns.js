// 本地演示活动，正式上线时应由后端返回规则、价格、库存及有效期。
const flashOffers = [
  {
    "id": "flash-016",
    "productId": "imp20261102-016",
    "price": 158000,
    "stock": 20
  },
  {
    "id": "flash-017",
    "productId": "imp20261102-017",
    "price": 328000,
    "stock": 20
  },
  {
    "id": "flash-019",
    "productId": "imp20261102-019",
    "price": 49900,
    "stock": 20
  },
  {
    "id": "flash-031",
    "productId": "imp20261102-031",
    "price": 59900,
    "stock": 20
  }
];
const groupOffers=[{"id": "g3", "productId": "p9", "price": 99900, "singlePrice": 109900, "originalPrice": 399900, "members": 2, "joined": 321, "limit": 1}, {"id": "g4", "productId": "p10", "price": 88800, "singlePrice": 99900, "originalPrice": 129900, "members": 2, "joined": 414, "limit": 1}, {"id": "g5", "productId": "p11", "price": 69900, "singlePrice": 79900, "originalPrice": 184900, "members": 2, "joined": 388, "limit": 1}];
const coupons=[{id:'cp1',amount:50,minSpend:50000,rule:'满500元可用',name:'新人专享礼券',days:30},{id:'cp2',amount:100,minSpend:150000,rule:'满1500元可用',name:'美丽焕新礼券',days:30},{id:'cp3',amount:200,minSpend:300000,rule:'满3000元可用',name:'会员专属礼券',days:30}];
const pointsOffers=[{id:'r1',name:'护理收纳袋',description:'日常收纳 · 轻巧随行',cost:500,image:''},{id:'r2',name:'便携化妆镜',description:'随身好物 · 精致陪伴',cost:1200,image:''},{id:'r3',name:'美丽护理礼盒',description:'会员礼遇 · 美丽心意',cost:3000,image:''}];
module.exports={flashOffers,groupOffers,coupons,pointsOffers};
