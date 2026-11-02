"""Read-only checks for the clean, uploadable source tree."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
for folder in ['backend','backend-local','scripts']:
    for path in (root/folder).rglob('*.py'):compile(path.read_text(),str(path),'exec')
snapshot=json.loads((root/'backend/config/configuration.json').read_text())
assert len(snapshot['products'])==62
assert sum(p.get('importBatch')=='20261102-catalogue' for p in snapshot['products'])==55
assert not {'p3','p5','p6','p7'} & {p['id'] for p in snapshot['products']}
assert len(snapshot['doctors'])==3 and len(snapshot['clinics'])==3
for product in snapshot['products']:
    if product.get('image','').startswith('/assets/'):
        for folder in ['miniapp','demo']:
            assert (root/folder/product['image'].lstrip('/')).is_file(),(folder,product['image'])
print('源码检查通过：Python语法、62个商品、55条导入记录、医生门店和图片路径。')
