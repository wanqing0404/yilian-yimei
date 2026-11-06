# 安装审查

- 三个仓库均为公开非 fork 原始来源；Skill 文件固定至 SOURCES.json 中的 commit。
- 不执行 npx、npm、curl 管道安装或仓库 CLI；仅下载技能所需文件。UI UX Pro Max 上游测试夹具未打包，运行时数据、参考文档及五个 Python 脚本均已包含。
- 安装前检查了三个 SKILL.md、Python 导入、函数与文件写入路径。搜索脚本使用 Python 标准库读取本地 CSV；未发现命令执行或网络请求代码。设计系统保存功能可创建 design-system 目录，并在显式 force 时覆盖文件；项目规则已约束该行为。
- Frontend Design 与 Web Design Guidelines 本身无可执行安装脚本。Web Design Guidelines 每次审查需读取远程规则；本包包含已阅读的离线快照。
- 保留 UI UX Pro Max 的 MIT LICENSE 与 Frontend Design 的上游 LICENSE.txt。
- 这属于静态来源和代码审查，不等同完整安全审计。未修改业务逻辑、数据库、接口或应用依赖。

## 验证结果

- 50 个上游文件的 Git blob SHA 全部一致；修正了文件写入工具增加的末尾换行。
- 上游数据校验通过：12 个领域文件、22 个技术栈文件及推理数据。
- 本地 UX 搜索与不落盘的设计系统生成均通过。
- 已通过 GitHub 读取项目 README、小程序全局样式、首页与品牌组件及后台样式；适配结论见同目录 README.md。未修改或审查实际界面；宿主自动发现需重载验证。
