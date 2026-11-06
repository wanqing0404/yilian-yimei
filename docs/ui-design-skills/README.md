# UI 设计 Skills 安装说明

安装位置：项目 `.agents/skills/`；项目根 `AGENTS.md` 配置了品牌优先和三阶段工作流。安装仅新增技能和文档，不改现有应用文件、运行依赖或构建配置。

## 来源与安装审查

| Skill | 原始来源 | 固定版本 |
| --- | --- | --- |
| UI UX Pro Max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | b7d5353e0130feb8c5574ef1251f8a1db1873ccb |
| Frontend Design | https://github.com/anthropics/skills/tree/main/skills/frontend-design | ca45fc496a3436251f191354091d557da31c15b5 |
| Web Design Guidelines | https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines | 1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62 |

安装前核对原始仓库与 Skill 内容，检查 Pro Max 五个 Python 脚本的导入、命令/网络调用及文件写入行为；未使用远程安装器、npm/npx 或仓库 CLI。脚本使用标准库，本地搜索不联网；显式保存设计系统可能创建文档，force 可覆盖，因此项目规则限制该操作。保留上游许可证。50 个上游文件已核对 Git blob SHA；详见 SOURCES.json、AUDIT.md。本次没有更新上游版本。

## 项目检查与适配

检查基线：wanqing0404/yilian-yimei，提交 fe7f99ed2221f69761aace4b03f0ba17ceccfc0c。

- 根 README 与 miniapp/README.md 确认原生微信小程序、网页 Demo、Python 后台；没有 npm 前端框架。
- 已阅读 miniapp/app.wxss、首页 WXML/WXSS、brand-header 的 WXML/WXSS 与后台 Web 样式。全局实现示例为 `--primary: #5355ff`、`--surface: #f6f8fc`、`--ink: #20232b`，系统中文字体、panel 24rpx 圆角和 pill 按钮；这些仅记录现状，不认定为已确认 VI。
- 该提交没有独立 VI/设计规范文件及既有 AGENTS.md 或 SKILL.md。用户已说明冷白、浅银灰、蓝紫灰少量点缀的方向；后续以用户已确认 VI 为准，不擅自补造定稿参数。
- miniapp/README.md 明确产品原图 aspectFit、缺图留空、会员银灰渐变和浅星星暗纹，应优先保持。
- Pro Max 无微信小程序 stack，仅通用 UX 与布局建议适用。Frontend Design 可辅助视觉设计，代码必须按原生平台实现。Web Design Guidelines 完整用于 HTML 网页，小程序只采用适用项并补充微信检查。纯后端任务无需使用这三个技能。

## 如何调用

- `$ui-ux-pro-max 为商城新增页面拟定布局和视觉规范，遵循医联现有 VI，不覆盖品牌色。`
- `$frontend-design 优化已批准方案的排版、商品卡片与留白，保留现有事件和数据。`
- `$web-design-guidelines 检查 demo/preview/ 本次改动，输出文件和行号。`
- 小程序可请求：`用三个 UI 技能检查 miniapp/pages/home；说明 Web 规则不适用项，并给出微信开发者工具检查清单。`

宿主重载项目后确认技能目录已发现。菜单未更新时可以直接让助手读取 `.agents/skills/<技能名>/SKILL.md`，无需假装工具已经注册。未创建也未安装 `yilian-ui-design`；它是另一个技能名称。

## 验证

在实际项目根目录运行：

```bash
python3 docs/ui-design-skills/verify_install.py
python3 .agents/skills/ui-ux-pro-max/scripts/validate_data.py
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "keyboard focus modal" --domain ux
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "medical beauty storefront" --design-system
```

安装时通过了上游文件哈希校验、12 个领域文件与 22 个技术栈数据校验、本地搜索和不落盘设计系统生成。本次未改界面，所以未执行界面合规审查或启动数据库服务。

后续 UI 预览：微信开发者工具导入 miniapp/，按现有项目配置设置 AppID；本机联调按根 README 使用 scripts/run_native_preview.py。网页 Demo/后台预览按根 README 的 scripts/run_online_preview.py。启动这些服务会涉及运行数据，安装验证不需要启动。
