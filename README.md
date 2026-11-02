# 医联医美 · 小程序与运营后台

项目包含原生微信小程序、手机网页Demo和Python运营后台。建议仓库名为`yilian-yimei`，设为私有仓库，代码审核后再发布。

## 目录

| 目录 | 内容 |
| --- | --- |
| `miniapp/` | 原生微信小程序，WXML、WXSS、JavaScript和素材 |
| `demo/` | 已发布的手机网页Demo，保留页面跳转与交互 |
| `backend/` | 线上后台：Python、SQLite、管理员/只读权限和公开配置接口 |
| `backend-local/` | 微信开发者工具使用的本机联调后台 |
| `scripts/` | 本机运行、账号生成与源码检查工具 |

线上后台：<https://live.ununion.cn/ops/haomei/admin/>

手机Demo：<https://live.ununion.cn/demo/haomei/>

## 当前功能

商品价格、图片、上下架、删除与回收站，社群拼团与秒杀，优惠券、积分商城、积分秒杀、签到、阶段活动、抽奖凭证、会员体系，以及医生和门店资料管理。

目录保留62个商品，其中55条按用户价格表导入，49条配有同规格图片；缺图或规格不符的6条保留空白。4个用户指定的初始化示例商品已移除。医生为韩宛喜、李秋月、李旭莹，门店为医联珍美、医联吉美、医联致美。

网页Demo从后台只读接口获取商品、活动和会员配置，正在浏览的页面约10秒检查一次更新。访客订单、积分和凭证体验仍在各自浏览器，不执行真实支付，也不连接真实客户数据库。

## 本机运行线上版本

需要Python 3.8及以上；服务器部署使用Python 3.11，无第三方Python依赖。

```bash
python3 scripts/create_accounts.py
python3 scripts/run_online_preview.py
```

账号生成工具会分别询问管理员和只读密码，以加盐哈希生成`backend/config/accounts.json`。该文件已忽略，不会进入Git历史。

- 后台：<http://127.0.0.1:18966/ops/haomei/admin/>
- 同步Demo：<http://127.0.0.1:18966/demo/haomei/preview/>

运行数据写入已忽略的`.runtime/`目录。自定义域名或云端开发环境可设置`PUBLIC_ORIGIN`。

## 原生小程序联调

用微信开发者工具导入`miniapp/`，按实际情况配置自己的AppID。当前未接入真实微信登录和支付。

```bash
python3 scripts/run_native_preview.py
```

本机后台为`http://127.0.0.1:8766/admin/`，默认演示账号见`backend-local/README.md`，仅限本机。`miniapp/utils/remote.js`保留本机API地址；真机和正式发布前需另行接入微信身份及合法HTTPS客户接口。线上管理接口不接受匿名客户下单。

## 发布与回滚

`backend/haomei-admin.service`和Nginx入口配置描述当前独立服务。部署时应单独配置账户文件、运行数据库和上传目录；不要把代码目录当成数据库目录，也不要用示例初始化数据覆盖现有数据库。

现有服务器的数据库位于`/var/lib/haomei-admin/operations.sqlite3`，备份位于`/var/backups/haomei-admin`，代码位于`/opt/haomei-admin/current`。源码更新应保留上一版本，验证接口后再切换；回滚代码不覆盖业务数据。

后续可由GitHub触发自动部署。SSH部署密钥或其他授权信息应通过仓库Secrets提供，不写入源码。

## 代码检查

```bash
python3 scripts/check_project.py
```

服务器密码、线上账户文件、运行数据库、登录会话、顾客上传文件及数据库备份均不在本仓库中。
