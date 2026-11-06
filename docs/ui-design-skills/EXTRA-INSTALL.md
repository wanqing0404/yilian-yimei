# 追加安装的三个技能仓库

按用户指定的三个仓库完成项目级文件安装，未执行技能工作流。`npx --yes skills --version` 在 20 秒限制内无响应并超时，因此没有声称成功执行用户给出的 npx 安装命令；改用 GitHub 连接器读取固定提交并安装文件，没有生成或冒充 skills CLI 的锁文件。

| 原始仓库 | 固定提交 | 技能数量 | 使用版本 |
| --- | --- | --- | --- |
| zstvns/design-skills | 8dab61b527bf5fb5dd8a0050a2111020e08df8ea | 8 | skills/ 原始文件 |
| rampstackco/claude-skills | 9b90db257f7395fab76ff9bfcb808456709f6af3 | 107 | 上游 dist/codex/.agents/skills/ |
| moesuito/claude-skill-design-md | aeddb0d588f8ded1cc4d431c3532dbb76cb12678 | 1 | 根目录 design-md 及完整参考/模板 |

共新增 116 个技能，连同之前 3 个共有 119 个。所有仓库均为用户指定的原始非 fork 来源；前两者 MIT，第三者 Apache-2.0，许可证随包保留。EXTRA-SOURCES.json 记录每个文件的上游 Git blob SHA 和实际安装路径。

## 来源与内容检查

安装前检查仓库文件清单、安装说明和 116 个技能入口，检索安装、外部调用、写入、发布与部署相关指令。所安装目录没有独立可执行脚本；包含的 HTML 模板/示例可能有浏览器脚本，本次没有执行。RampStack 仓库中的构建、lint、CI 和运维脚本未安装也未运行；使用其已生成的 Codex 文件。未执行任何 skill 引述的 shell 命令、模板脚本、发布/运维流程，也没有配置 API key 或付费服务。

这是静态来源/内容检查与文件完整性验证，不是对所有 Markdown 工作流及 HTML 脚本的完整安全审计。技能中的命令只在后续任务确实需要且符合用户授权时使用。

## 重名处理

- `$creative-direction`、`$logo-design` 保留 zstvns 版本。
- RampStack 对应技能分别为 `$rampstack-creative-direction`、`$rampstack-logo-design`。
- 只修改这两份 RampStack SKILL.md 的 frontmatter name，使目录与名称一致；正文和参考文件保留原文。它们及 RampStack 其他技能对原名称的交叉引用应按来源解析为对应 rampstack- 名称，不误跳到 zstvns 版本。
- verify_extra.py 会将这两处 name 还原后比对上游 SHA，其他文件直接比对。全部 119 个目录名与 name 必须一致且唯一。

## 调用示例与边界

- `$brand 梳理已有医联 VI，记录证据和待确认项，保留已确认方向。`
- `$design-principles 检查页面层级、字体和留白。`
- `$rampstack-creative-direction 整理已有视觉方向，不重新定位品牌。`
- `$accessibility-audit 检查网页 Demo；小程序说明不适用的 DOM 规则。`
- `$design-md 根据已确认 VI 整理 DESIGN.md，并标明待确认参数。`

`design-md` 生成文档及配套 showcase 属于另一个任务，本次未创建或覆盖 DESIGN.md。其上游示例默认营销页面、px 和 Web 字体；用于医联时必须明确小程序范围、rpx 与系统中文字体，不能擅自套用默认值。既有 VI、原图规则和 AGENTS.md 始终优先；不为设计需要修改业务、数据库、支付或接口。

新增技能按任务选择，不批量激活工作流。Logo/品牌发现技能不能自动替换已有品牌；动效需克制并核实微信能力；SEO、网站、广告、发布和运维技能不因已安装而成为小程序 UI 的默认步骤，依赖 Ahrefs 等外部能力时不得伪造数据或自动开通。

宿主重载后确认 `.agents/skills` 自动发现；若当前会话菜单未刷新，可以直接读取对应 SKILL.md。不会另行安装用户未指定的工具插件。

验证命令：在项目根目录运行 `python3 docs/ui-design-skills/verify_extra.py`，原有三技能仍用 `python3 docs/ui-design-skills/verify_install.py` 验证。
