# 医联医美 UI 设计工作流

## 项目与边界
- `miniapp/` 是原生微信小程序：WXML、WXSS、JavaScript，无 npm 依赖；`demo/` 为网页 Demo 及预览适配层。`backend/web/` 和 `backend-local/web/` 是 HTML/CSS/JavaScript 管理界面，服务端使用 Python、SQLite。
- UI 设计任务不得顺带修改数据库、接口契约、支付、账户、价格计算、订单和其他业务逻辑；本次 Skill 安装仅新增工具与文档。
- 实现前阅读根 README、相关目录文档、页面、组件和全局样式。文档与当前代码冲突时核对实际入口；不要直接执行旧文档中不存在的命令。

## 设计优先级
1. 用户当次要求与已确认品牌 VI 优先，其次项目已确认的设计规范和 tokens，最后才是 Skill 推荐。现有源码颜色是实现现状，不自动等同品牌定稿；没有找到独立 VI 文件时必须明确说明。
2. 已给定的医联方向：冷白、浅银灰为主，蓝紫灰少量点缀，真实自然、克制高级、避免灰雾感。不得让 Skill 生成的通用医美配色覆盖这些要求；本次不改现有样式值。
3. 复用现有 `brand-header`、`ui-icon`、`media-placeholder` 和其他组件。商品卡、价格、按钮、字体、圆角、留白需统一；复用系统中文字体，不引入外部字体依赖。
4. 产品图只使用已有产品资料库或后台已配置的原图，按原始比例完整显示。小程序使用 `aspectFit`，Web 使用 `object-fit: contain`；缺图保持既有空白规则，不伪造包装、不拉伸、不裁切主体。不要改动素材和商品数据来配合设计。

## 三个已安装 Skills
每次应用前读取相应文件；安装技能不代表需要运行其中所有步骤。
- UI UX Pro Max：`.agents/skills/ui-ux-pro-max/SKILL.md`
- Frontend Design：`.agents/skills/frontend-design/SKILL.md`
- Web Design Guidelines：`.agents/skills/web-design-guidelines/SKILL.md`

### 新增页面或整体重设计
1. 先核对品牌、页面信息架构与现有行为。用 UI UX Pro Max 的 `--design-system` 辅助拟定布局和视觉规范，再筛除与品牌及平台不符的建议。向用户展示设计方案及预计修改的页面/文件；用户明确要求确认时，等待确认后修改。
2. 用 Frontend Design 优化层级、排版、留白、材质与交互反馈。其审美探索服从项目 VI，不能另起品牌。
3. 只实施已授权的 UI 修改。保留绑定事件、页面路径、数据字段、价格、业务语义和接口。
4. 完成后执行下面的 UI 检查并报告问题、修复、未验证项目及预览方式。

### UI UX Pro Max 的路径与框架适配
在实际项目根目录运行（从其他位置调用时使用绝对路径）：

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "medical beauty storefront" --design-system
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "keyboard focus modal" --domain ux
```

不使用上游 Claude 专用的 `CLAUDE_PLUGIN_ROOT` 示例路径。微信小程序不在本版本的 22 个 `--stack` 中：使用通用领域和布局建议，按 WXML/WXSS、rpx、微信组件与事件系统落地；不得冒用 React、Vue、React Native 或 html-tailwind 技术栈。普通网页也不能因为有 HTML 就假设安装了 Tailwind。

已有设计系统先读后补；默认只查看输出。需要保存已核实的补充规范时，显式传入 `--persist --output-dir <实际项目根目录>`。禁止未经授权 `--force` 覆盖既有设计文档。查询不含私密项目数据。

### 完成后的 UI 检查
- Web 页面：应用 Web Design Guidelines，通过可用 HTTPS/GitHub 读取工具获取 `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`，记录来源/版本；无法联网时明确采用 `.agents/skills/web-design-guidelines/references/command.md` 离线快照，不声称已验证最新规则。没有 WebFetch 工具时可用 GitHub 读取工具代替。
- 检查改动文件的语义、键盘/焦点、可访问名称、文字对比度、触控目标、长文本、图片比例、响应式、加载/空/错误状态及减少动画。按 `文件:行号` 报告问题；适用时修复后复查。
- 小程序：仅采用适用的通用 UX/视觉规则，补充微信组件的无障碍能力、rpx、自定义导航胶囊避让、安全区、滚动、真机点击与图片比例检查。不要直接把 HTML 标签、DOM 键盘事件、CSS 媒体查询或 ARIA 写法机械移植到 WXML/WXSS；按目标基础库核实支持情况。不适用规则明确标注原因。
- 浏览器预览适配层不能代替微信开发者工具或真机。未实际运行的检查必须标为未验证；无 UI 改动的安装任务不宣称界面检查已通过。

## 调用与验证
可明确请求 `$ui-ux-pro-max`、`$frontend-design`、`$web-design-guidelines`，也可直接用中文名称说明任务。支持项目 `.agents/skills` 的宿主重载后应发现它们；当前会话菜单是否动态刷新无法由文件安装保证，未发现时按上面路径直接读取。

安装来源、版本、验证结果及调用示例见 `docs/ui-design-skills/README.md`。
