---
{
  "version": "alpha",
  "name": "医联医美",
  "status": "evidence-record-not-final-vi",
  "scope": "原生微信小程序商城；网页预览仅用于核对记录",
  "description": "冷白、浅银灰为主，蓝紫灰仅少量点缀；已确认定性规则与源码参数分别记录。没有已确认的数值颜色、字体字号或圆角体系，不得将 observed 提升为品牌定稿。",
  "sourceCommit": "fe7f99ed2221f69761aace4b03f0ba17ceccfc0c",
  "colors": {},
  "typography": {},
  "rounded": {},
  "spacing": {},
  "components": {},
  "observed": {
    "status": "source-only-not-approved",
    "colors": {
      "canvas": "#f6f8fc",
      "surface-card": "#ffffff",
      "ink": "#20232b",
      "muted": "#929aaa",
      "primary": "#5355ff",
      "on-primary": "#ffffff",
      "price": "#242631",
      "hairline": "#f1f3f8",
      "error": "#d45c67",
      "product-card": "#f7f9fc"
    },
    "typography": {
      "body": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        "fontSize": "26rpx",
        "fontWeight": null,
        "lineHeight": 1.5,
        "letterSpacing": null,
        "selector": "page"
      },
      "headline": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        "fontSize": "32rpx",
        "fontWeight": 600,
        "lineHeight": 1.5,
        "letterSpacing": "1rpx",
        "selector": ".section-title"
      },
      "hero": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        "fontSize": "43rpx",
        "fontWeight": 600,
        "lineHeight": 1.4,
        "letterSpacing": "2rpx",
        "selector": ".hero-title"
      },
      "product-name": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        "fontSize": "28rpx",
        "fontWeight": 500,
        "lineHeight": 1.5,
        "letterSpacing": null,
        "selector": ".recommend-name"
      },
      "price": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, sans-serif",
        "fontSize": "34rpx",
        "fontWeight": 650,
        "lineHeight": 1.5,
        "letterSpacing": null,
        "selector": ".price"
      },
      "caption": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        "fontSize": "22rpx",
        "fontWeight": null,
        "lineHeight": 1.5,
        "letterSpacing": null,
        "selector": ".small"
      },
      "button": {
        "fontFamily": "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        "fontSize": "28rpx",
        "fontWeight": 500,
        "lineHeight": 1.5,
        "letterSpacing": null,
        "selector": ".primary-button"
      }
    },
    "rounded": {
      "panel": "24rpx",
      "product-card": "18rpx",
      "product-image": "12rpx",
      "button-primary": "50rpx",
      "button-secondary": "48rpx"
    },
    "spacing": {
      "page-horizontal": "32rpx",
      "product-grid-gap": "22rpx",
      "product-card-padding": "12rpx"
    },
    "components": {
      "product-card": {
        "backgroundColor": "{observed.colors.product-card}",
        "rounded": "{observed.rounded.product-card}"
      },
      "button-primary": {
        "backgroundColor": "{observed.colors.primary}",
        "textColor": "{observed.colors.on-primary}",
        "rounded": "{observed.rounded.button-primary}",
        "padding": "24rpx 32rpx"
      },
      "button-primary-disabled": {
        "opacity": 0.45
      }
    }
  }
}
---

# 医联医美设计依据记录

## 概览

医联商城以冷白与浅银灰为主画布，蓝紫灰只作少量点缀；这些是用户已确认的定性方向，精确色号和强调色落点尚未确认。页面应真实自然、克制高级，避免大面积灰色罩层造成灰雾感。本文整理现有依据，不重新定义品牌。

本文件的 YAML frontmatter 使用 YAML 兼容的 JSON 对象表示。顶层 `colors`、`typography`、`rounded`、`spacing`、`components` 刻意留空：目前没有依据将任何数值确认为品牌定稿。所有具体参数仅放在 `observed` 命名空间；它们是某一提交的实现记录，不是可直接套用的已确认 tokens。null 表示源码未在该规则中明确声明，不得猜测。

适用范围为 WXML/WXSS/JavaScript 原生微信小程序，优先商城与相关组件；不使用模板默认的营销网站、Web px 字号、外部字体或桌面断点。后台仅为独立界面，不借其配色补足小程序 VI。

## 证据与状态

| 状态 | 含义 | 使用方式 |
| --- | --- | --- |
| 已确认规则 | 用户在当前对话中直接提出的要求 | 作为设计约束执行；没有数值时保持定性 |
| 源码现状 | 固定提交里的样式、组件或 README 描述 | 用于理解与复用，不等于品牌已确认 |
| 待确认参数 | 当前依据无法确定的规范 | 不补造、不写入正式 tokens |

用户依据：此前“重新设计医联医美微信小程序商城首页”消息中的要求 1—7，以及本次“区分已确认规则、源码现状和待确认参数”。这些对话没有公开链接，不虚构为仓库中的品牌手册。

源码基线：`wanqing0404/yilian-yimei`，提交 `fe7f99ed2221f69761aace4b03f0ba17ceccfc0c`。已检查仓库文件树，未发现独立 VI 定稿、既有 DESIGN.md 或 design-showcase.html；技能模板与示例不是医联品牌来源。源码 CSS 多为压缩单行，下列来源采用文件加选择器定位。

- [全局样式](https://github.com/wanqing0404/yilian-yimei/blob/fe7f99ed2221f69761aace4b03f0ba17ceccfc0c/miniapp/app.wxss)：page、.panel、.price、.primary-button 等。
- [首页样式](https://github.com/wanqing0404/yilian-yimei/blob/fe7f99ed2221f69761aace4b03f0ba17ceccfc0c/miniapp/pages/home/index.wxss)：.hero-title、.recommend-grid、.recommend-card 等。
- [小程序说明](https://github.com/wanqing0404/yilian-yimei/blob/fe7f99ed2221f69761aace4b03f0ba17ceccfc0c/miniapp/README.md)：素材与缺图处理。
- [品牌头部组件](https://github.com/wanqing0404/yilian-yimei/blob/fe7f99ed2221f69761aace4b03f0ba17ceccfc0c/miniapp/components/brand-header/index.wxml)：当前文字为“医联·好美”。

## 已确认规则

| 规则 | 已确认内容 | 尚不能据此确定 |
| --- | --- | --- |
| 主色与画布 | 冷白、浅银灰为主 | 精确色号、各层表面差异 |
| 点缀色 | 蓝紫灰少量使用 | 色号、比例、是否用于主按钮/价格/焦点 |
| 气质 | 真实自然、克制高级、避免灰雾感 | 最终遮罩、阴影、渐变参数 |
| 一致性 | 统一商品卡片、价格、按钮、字体、圆角和留白 | 具体尺度、字号和组件状态 |
| 产品图 | 现有产品资料库原图，保持原始比例 | 不允许凭空替代或生成包装 |
| 平台 | 适配现有微信小程序框架 | 不代表 HTML/ARIA/CSS 特性均可移植 |
| 业务边界 | 不修改数据库、接口、支付及其他业务逻辑 | 无新增业务授权 |

## 颜色：源码现状

以下全部来自源码，未获品牌数值确认。每个值只属于 `{observed.colors.*}`。尤其现有 primary 饱和度较高，不能直接认定为已确认的“蓝紫灰”。白色值只说明现有组件的填色，不表示已确认冷白标准。

| 记录 token | 源码值 | 来源选择器/属性 |
| --- | --- | --- |
| `{observed.colors.canvas}` | `#f6f8fc` | page --surface |
| `{observed.colors.surface-card}` | `#ffffff` | .panel background |
| `{observed.colors.ink}` | `#20232b` | page --ink |
| `{observed.colors.muted}` | `#929aaa` | page --muted |
| `{observed.colors.primary}` | `#5355ff` | page --primary |
| `{observed.colors.on-primary}` | `#ffffff` | .primary-button color |
| `{observed.colors.price}` | `#242631` | .price color |
| `{observed.colors.hairline}` | `#f1f3f8` | .hairline background |
| `{observed.colors.error}` | `#d45c67` | .error-text color |
| `{observed.colors.product-card}` | `#f7f9fc` | 首页 .recommend-card background |

## 字体：源码现状

中文正文使用系统字体栈，价格使用系统数字字体栈，均未观察到需要下载的品牌字体。不新增 Web 字体。此为实现依据，不宣称已收到品牌字体授权或定稿。

下表对应全部 `observed.typography`；1.5 行高在部分组件中来自全局继承，不代表已做真机 computed-style 测量。未声明字距/字重不改写成 0/400。这里没有虚构不存在的 display-xl 或等宽字体角色。

| 角色 | 字号 | 字重 | 行高 | 字距 | 来源 |
| --- | --- | --- | --- | --- | --- |
| `body` | 26rpx | 未显式声明 | 1.5 | 未显式声明 | `page` |
| `headline` | 32rpx | 600 | 1.5 | 1rpx | `.section-title` |
| `hero` | 43rpx | 600 | 1.4 | 2rpx | `.hero-title` |
| `product-name` | 28rpx | 500 | 1.5 | 未显式声明 | `.recommend-name` |
| `price` | 34rpx | 650 | 1.5 | 未显式声明 | `.price` |
| `caption` | 22rpx | 未显式声明 | 1.5 | 未显式声明 | `.small` |
| `button` | 28rpx | 500 | 1.5 | 未显式声明 | `.primary-button` |

## 布局、形状与层次：源码现状

| 对象 | 观察值 | 来源 |
| --- | --- | --- |
| 通用面板圆角 | 24rpx | 全局 .panel |
| 商品卡圆角/内边距 | 18rpx / 12rpx | 首页 .recommend-card |
| 商品图容器圆角 | 12rpx | 首页 .recommend-image |
| 主/次按钮圆角 | 50rpx / 48rpx | 全局 .primary-button / .secondary-button |
| 通用水平留白 | 32rpx | 全局 .pad |
| 推荐商品网格 | 2 列，22rpx 间距 | 首页 .recommend-grid |

这些值尚未形成已确认的一致性尺度；不得把不同页面的数字简单拼为正式 spacing scale。当前商品图片容器高 240rpx，是容器尺寸，不是原图比例。

已有层次包括页面背景、白色面板、浅色商品卡，暂不规定其亮度排序或强行扩为四层表面。首页已有大面积渐变遮罩和半透明积分卡；用户要求避免灰雾感，因此它们是需在未来重设计中审视的现状，不是受保护的 VI 效果。本次不修改这些效果。没有确认全局阴影、模糊或动效标准。

## 组件与图片

- `brand-header`：复用现有组件；源码显示名称“医联·好美”，用户称“医联医美”。正式对外文字、间隔符和 Logo 需确认，本文标题采用用户称呼，不更改代码文字或生成 Logo。
- `product-card`：当前两列卡片，图片、名称、价格及购物车动作分层。未来按统一规范改善，保留商品字段、格式化价格与事件绑定。
- `button-primary`：当前引用 observed 主色、白字和 50rpx 圆角；禁用 opacity 0.45 来自 button[disabled]。hover、pressed、focused 的小程序专用标准未确认，不沿用营销模板状态。
- `media-placeholder` 与产品原图：按现有素材映射使用；小程序 aspectFit，网页 object-fit: contain。缺图保持既有空白规则，不拿其他商品或生成图补齐。
- README 描述默认头像黑底银灰球体、会员卡银灰渐变与浅星星暗纹，首页人物/大厅沿用既有素材。这些归为项目既有文档记录，不自动升级为本次用户确认的完整 VI。
- 规范展示页不展示未经核对的商品图片、价格、医生背书或虚构评价。

## 应当与禁止

应当：先读取已确认规则；每个数值标明来源和状态；优先复用组件；保留原图与业务；有冲突时记录并按用户已确认方向拟方案。

禁止：把 observed 当定稿；自行指定冷白或蓝紫灰色号；为了克制而删除必要反馈；引入大面积灰雾罩层；为“统一”而改价格、商品数据或接口；把 Web 展示页当作微信真机效果；套用模板默认暗色、外部字体、虚构评价或渐变光晕。

## 平台与适配

原生布局以 rpx 和微信设备能力为准，导航避让胶囊、安全区和滚动行为需按现有实现核对。没有已确认的手机宽度断点、网格降列规则、最小触控尺寸或无障碍字号策略，本文不发明数值。

后续至少在窄屏、常规手机、大屏手机及系统放大字体下验证长商品名、价格、按钮与安全区；采用实际设备尺寸记录结果，不将建议测试分组当成已确认 breakpoints。浏览器 showcase 的响应式只是文档排版，不能导入为 WXSS 规范。对比度及平台无障碍能力需在实际页面上复核，本次不声明现有页面已通过。

## 迭代与调用

1. 用户提供正式 VI 文件或明确确认参数后，在“已确认规则”中补证据；只将明确确认的数值提升到顶层 tokens。
2. 保留 observed 的基线提交，代码变更后新增或更新观察记录，不篡改历史来源。
3. 新页面用 UI UX Pro Max 辅助结构、Frontend Design 优化表现；品牌规则优先，不默认安装新框架。
4. 完成 Web UI 后用 Web Design Guidelines；小程序补充微信平台验证，并说明不适用规则。
5. 文档改动不触发业务、数据库、支付、接口或全局样式重写。

可复制调用：`读取 DESIGN.md，只按已确认规则拟定商城首页方案；observed 仅用于理解现有实现，缺少精确参数时列出待确认项，先展示方案与计划改动文件。`

配套 `design-showcase.html` 可离线双击打开：展示已确认文字规则、源码色板/字号/圆角/间距记录与待确认清单；它是证据查看器，不是首页设计稿。示例字体按 375px 参考视口将 rpx 以 0.5px 展示，仅用于查看，不代表真机固定换算或品牌字号定稿。

## 待确认参数 / Known Gaps

- 正式品牌名、Logo 文件、标准字、组合比例及最小保护区。
- 冷白、浅银灰、蓝紫灰的色号，强调色落点/比例与语义色系统。
- 正文/标题/价格/按钮的字体、字号、字重、行高、字距与放大策略。
- 卡片、图片、按钮圆角，页面边距、卡片间距、分组节奏与尺寸规范。
- 按钮各状态、禁用表达、错误/空/加载状态，以及验证后的对比度。
- 会员材质/暗纹、首页遮罩、阴影、渐变和动效的最终参数。
- 暗色模式、平板、横屏和具体断点。当前只记录浅色小程序方向，不由模板补足。
- 未收到独立品牌手册、签字确认图或正式 tokens；本文不声称这些材料已经存在或确认。
