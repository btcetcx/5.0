# AGENTS.md

## 当前阶段

本项目已经进入 **Vue3 工程验收调整阶段**。

从现在开始，所有新会话、子任务、返修任务都 **不再参考原 JSX 页面**，除非用户在某个具体问题里明确要求查看。

当前工作目标不是重新生成页面，而是基于已经完成的 Vue3 工程、公共母版和用户验收意见，进行字段、交互、样式、弹窗、路由、接口契约对齐。

## 沟通语言

- 全程使用中文沟通。
- 计划、问题清单、验收结论、交付总结全部使用中文。
- 代码标识符保持英文。
- UI 文案按项目现有中文文案和用户最新要求执行。

## 必读顺序

开始任何任务前，按顺序读取：

1. `vue3/src/views/template-gallery/TemplateGallery.vue`
2. `vue3/src/components/list-page`
3. `vue3/src/components/detail-page`
4. `vue3/src/components/form-page`
5. `vue3/src/components/setting-page`
6. `vue3/src/layouts/erp-shell/navigation.ts`
7. `vue3/src/app/router/index.ts`
8. 当前模块已有 Vue 页面、mock、types、resources
9. 接口契约文件
10. 用户最新验收意见或当前交接文档

## 优先级规则

遇到冲突时，按以下优先级判断：

1. 用户最新明确指令
2. 已验收通过的 Vue 页面表现
3. 母版库与公共组件
4. 当前模块已有 Vue 数据、mock、types、resources
5. 接口契约
6. 交接文档和协同公告板
7. 常见业务系统经验

禁止因为旧实现、个人习惯或临时猜测覆盖用户已经验收过的规则。

## 母版优先

所有页面必须优先复用公共母版：

- 列表页：`AwListPage`、`AwListToolbar`、`AwDataTable`、`AwResourceTree`
- 详情页：`AwDetailPage`、`AwDetailToolbar`、`AwDetailHeader`、`AwDetailTabs`
- 新增/编辑页：`AwFormPage`、`AwEditableSubTable`、`AwAttachmentTable`、`AwRichTextEditor`
- 设置页：`AwSettingPage`、`AwSettingToolbar`、`AwFieldSettingPage`、`AwCodeRuleBuilder`、`AwApprovalRuleEditor`、`AwStrategySettingPage`
- 弹窗/选择器：`AwPersonPickerModal`、`AwCategoryPickerModal`、`AwSourcePickerModal`、`AwOptionPickerModal`
- 字段组件：`AwSearchTriggerInput`、`AwUnitPickerInput`、`AwUnitPickerModal`

如果一个需求可以通过配置、props、slot、mock 数据完成，不要新写私有结构。

## 修改边界

执行前必须先判断问题属于哪一类：

- **页面差异**：只改当前页面配置、字段、mock 或资源数据。
- **通用问题**：才允许改公共组件。
- **导航问题**：只改 `navigation.ts` 和必要路由。
- **契约问题**：同步检查接口契约和页面字段是否一致。

改公共组件前必须确认影响范围，避免为单个页面特例破坏其他页面。

## 验收调整规则

当前阶段重点检查：

- 列表字段是否完整、顺序是否正确。
- 列表选择框、序号、操作列是否按母版固定。
- 搜索、刷新、筛选、字段配置、导入、导出、新增按钮顺序是否一致。
- 详情页 Tab 是否可切换，并显示对应内容。
- 新增/编辑页字段、子表、附件、富文本是否按母版。
- 设置页的自定义字段、自定义编号、审批设置、策略设置是否复用母版逻辑。
- 弹窗按钮位置、遮罩、头部、底部、确认/取消逻辑是否一致。
- 字段选择器、人员选择器、分类选择器、单位选择器是否为公共组件。
- 页面数据是否和 mock/types/resources/接口契约一致。

## 禁止事项

- 禁止继续按原 JSX 页面重做。
- 禁止新建一套和母版不一致的私有弹窗。
- 禁止把字段写死到不可编辑卡片里。
- 禁止跳过母版直接写页面结构。
- 禁止多个窗口同时修改同一个公共组件。
- 禁止覆盖用户或其他窗口已经完成的无关改动。
- 禁止为了快速显示效果牺牲字段逻辑、交互逻辑和接口契约。

## 多窗口协作

当前阶段建议：

- 一个主修改窗口负责实际改代码。
- 一个只读复查窗口负责列问题。
- 不建议多个窗口同时改公共组件。

如果必须多窗口并行：

- 每个窗口只负责一个模块中心或一个问题域。
- 修改前在交接文档里写清楚影响文件。
- 公共组件只允许一个窗口修改。
- 其他窗口发现公共问题，写入问题清单，不直接改。
- 完成后必须说明入口、改动文件、验证结果、剩余风险。

## 验证要求

每次交付前至少完成：

1. 检查相关页面是否能访问。
2. 检查母版组件是否没有被破坏。
3. 检查路由和导航入口。
4. 检查字段和 mock/types/resources 是否一致。
5. 能运行时执行类型检查或构建。

当前项目可使用本地 Node 路径运行：

```powershell
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vue-tsc\bin\vue-tsc.js --noEmit
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vite\bin\vite.js build
```

如果不能运行测试或构建，必须在交付里说明原因。

## 交付格式

交付时简洁说明：

- 完成了什么。
- 改了哪些文件。
- 入口在哪里。
- 验证了什么。
- 还有什么风险或下一步建议。

不要输出大段无关解释。

