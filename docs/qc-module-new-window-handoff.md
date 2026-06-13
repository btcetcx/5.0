# 质检模块新窗口交接说明

更新时间：2026-05-30

## 本轮目标

新会话窗口只负责完成 `质检中心`，最终交付物是可运行、可对接后端的 `vue3` 工程页面。静态预览只作为验收镜子，不能只改静态 HTML。

质检模块必须吸收售后模块返工教训：先读当前 Vue 导航、再读原 JSX、先确认入口分流、先复用已验收母版，再做 Vue 实现。不要凭感觉写通用列表、通用详情或通用设置页。

重要修正：质检中心的分类导航已经在当前 Vue 工程中调整过，不能再用 `qc-list.jsx` 的旧分类导航覆盖。`qc-list.jsx` 只作为字段、示例数据、页面动作和业务交互参考；一级/二级/三级导航入口以 `vue3/src/layouts/erp-shell/navigation.ts` 当前配置为准。

## 必读资料

1. 售后错误记录和避免规则：`docs/after-sales-coordination.md`
2. 全局新窗口规则：`docs/new-window-handoff.md`
3. 客户管理已验收母版：
   - `vue3/src/views/sales/customers/CustomerList.vue`
   - `vue3/src/views/sales/customers/CustomerCreate.vue`
   - `vue3/src/views/sales/customers/CustomerDetail.vue`
   - `vue3/src/views/sales/customers/CustomerSettingPage.vue`
4. 公共母版组件：
   - `vue3/src/components/list-page/`
   - `vue3/src/components/form-page/`
   - `vue3/src/components/detail-page/`
   - `vue3/src/components/setting-page/`
5. 当前质检导航源：
   - `vue3/src/layouts/erp-shell/navigation.ts`
6. 质检原型源：
   - `qc-list.jsx`
7. 关联原型源：
   - `process-list.jsx`
   - `manufacturing-list.jsx`
   - `warehouse-inbound-list.jsx`
   - `warehouse-outbound-list.jsx`
   - `person-picker.jsx`
   - `product-picker.jsx`
   - `approval-flow.jsx`
   - `custom-field.jsx`
   - `print-template.jsx`
8. 相关接口契约：
   - `接口契约-中心模块/仓储中心-页面接口契约.md`
   - `接口契约-中心模块/仓储中心-前后端接口协作规范.md`
   - `接口契约-中心模块/生产中心-页面接口契约.md`
   - `接口契约-中心模块/生产中心-前后端接口协作规范.md`

说明：当前仓储/生产契约里已有质检预留和质检联动说明；如果独立 `质检中心` 契约缺失，先按 `qc-list.jsx` + 现有跨模块契约建立前端 mock/API adapter，并在交付记录中标出“待后端补充质检中心独立契约”。

## 售后模块犯过的错，质检必须避免

1. 不能跳过当前 Vue 导航和 JSX 分流规则。
   - 售后曾把字典/设置入口误落到主单列表，导致字段完全错位。
   - 质检导航入口以 `vue3/src/layouts/erp-shell/navigation.ts` 当前配置为准。
   - 质检遇到 `action`、`setting`、`stage`、`category`、`tab` 时，必须先从当前导航确认入口，再从 `qc-list.jsx` 提取该入口对应的字段/页面动作，最后映射 Vue 路由。

2. 不能擅自删减用户确认过的动作集合。
   - 售后审核动作曾被简化，属于越界。
   - 质检的状态集合、按钮集合、处理动作、判定动作、复检动作、放行动作、异常动作，必须原样保留；不确定就只读梳理后提问。

3. 不能为单页私造组件。
   - 售后后续把处理意见弹窗、来源选择弹窗公共化。
   - 质检列表、详情、表单、设置、人员/产品/方案选择弹窗必须优先复用公共母版。确实缺公共能力时先抽公共组件，不做页面私有散装弹窗。

4. 不能只做可见页面，不做真实数据和契约映射。
   - 页面字段必须来自 `qc-list.jsx` 或接口契约。
   - mock/API adapter、路由、导航、页面、静态验收入口要同源。

5. 不能把跨模块状态写死。
   - 来料检验、出货检验、生产报工待质检、IPQC 方案选择等会与仓储/生产联动。
   - 需要在 API adapter 里集中维护映射，页面只读取同一来源。

## 质检中心建议范围

第一阶段先做完整可验收骨架，不扩展到财务、人力、设备。分类导航必须按当前 Vue 工程，不按旧 JSX 分类：

1. 工作台：`/qc`
2. 质检管理：`/qc/execution`
   - 新增检验任务
   - 检验任务列表
   - 待检任务
   - 来料检验 IQC
   - 过程检验 IPQC
   - 成品检验 FQC
   - 出货检验 OQC
3. 异常处理：`/qc/exceptions`
   - 不合格记录
   - 隔离/拒收
   - 返工复检
   - 让步放行
   - CAPA/8D 如 `qc-list.jsx` 有入口则保留
4. 质检分析：`/qc/reports`
   - 质量趋势
   - 不良分析
   - 供应商质量
   - 工序质量
5. 质检设置：`/qc/standards`
   - 检验方案
   - 检验项目
   - 抽样规则
   - 质检自定义字段
   - 质检自定义编号
   - 质检审批设置
   - 质检策略设置
   - 设置质检打印模板

当前导航矩阵：

| 二级导航 | 路由 | 三级/四级浮窗 |
| --- | --- | --- |
| 工作台 | `/qc` | 无 |
| 质检管理 | `/qc/execution` | 检验执行：新增检验任务、检验任务列表、待检任务；检验阶段：来料检验 IQC、过程检验 IPQC、成品检验 FQC、出货检验 OQC |
| 异常处理 | `/qc/exceptions` | 异常处理：不合格记录、隔离/拒收、返工复检、让步放行 |
| 质检分析 | `/qc/reports` | 质检分析：质量趋势、不良分析、供应商质量、工序质量 |
| 质检设置 | `/qc/standards` | 方案配置：新增检验标准、检验方案、检验项目、抽样规则；质检设置：质检自定义字段、质检自定义编号、质检审批设置、质检策略设置、设置质检打印模板 |

## 页面母版标准

1. 列表页
   - 使用 `AwListPage` / `AwDataTable` / `AwListToolbar`。
   - 选择框、序号、操作列固定。
   - 工具栏顺序、搜索、刷新、筛选、字段配置、导入、导出、新增按钮，按客户管理母版。
   - 字段顺序和示例数据来自 `qc-list.jsx`，不能凭空改。

2. 新增/编辑页
   - 使用 `AwFormPage`、`AwEditableSubTable`、`AwAttachmentTable`、`AwRichTextEditor`、必要的公共选择弹窗。
   - 质检方案、质检项目、抽样记录、检验明细、附件、详情等按 `qc-list.jsx` 回填。
   - 选择人员、选择产品、选择来源单据、选择质检方案必须是弹窗选择并确认回填，不允许按钮点击后直接塞 mock 行。

3. 详情页
   - 使用 `AwDetailPage`、`AwDetailToolbar`、`AwDetailHeader`、`AwDetailTabs`。
   - Tab 必须能切换并显示独立内容，不能所有 Tab 空白或共用同一块。
   - 检验信息、来源记录、抽样记录、检验明细、不良处置、复检记录、放行/拒收记录、质检报告、操作记录等按 `qc-list.jsx`。

4. 设置页
   - 自定义字段、自定义编号、审批设置、策略设置、打印模板必须复用客户管理/销售设置母版。
   - 只替换“质检”的字段、文案和默认数据，不允许重写一套不同样式。
   - 编号构建器、审批节点、人员选择、字段权限、IOS 开关必须和客户设置一致。

## API/mock 建议

建议新增集中 adapter：

- `vue3/src/app/api/qc/types.ts`
- `vue3/src/app/api/qc/resources.ts`
- `vue3/src/mock/qc/inspections.json`
- `vue3/src/mock/qc/exceptions.json`
- `vue3/src/mock/qc/standards.json`
- `vue3/src/mock/qc/settings.json`

建议资源：

| 页面 | resource |
| --- | --- |
| 检验执行 | `qc-inspections` |
| 异常处理 | `qc-exceptions` |
| 标准与配置 | `qc-standards` |
| 质量分析 | `qc-reports` |

设置统一接口建议：

```text
GET   /api/v1/{resource}/settings
PATCH /api/v1/{resource}/settings
```

动作接口建议：

```text
POST /api/v1/qc-inspections
GET  /api/v1/qc-inspections
GET  /api/v1/qc-inspections/{id}
PATCH /api/v1/qc-inspections/{id}
POST /api/v1/qc-inspections/{id}/submit-result
POST /api/v1/qc-inspections/{id}/recheck
POST /api/v1/qc-inspections/{id}/release
POST /api/v1/qc-inspections/{id}/reject
POST /api/v1/qc-exceptions
POST /api/v1/qc-exceptions/{id}/capa
POST /api/v1/qc-exceptions/{id}/close
```

## 验收清单

1. 顶部质检一级导航进入 `/qc` 工作台。
2. 左侧二级导航和三级/四级浮窗必须与当前 `navigation.ts` 的质检导航矩阵一致，不能被旧 JSX 分类覆盖，不误落到占位页。
3. `/qc/execution` 列表字段、数据、固定列、批量操作正常。
4. `/qc/execution?action=new` 新增页字段、子表、弹窗选择、提交反馈正常。
5. `/qc/execution?id=qc_001` 详情页 Tab 可切换并显示对应内容。
6. `/qc/exceptions`、`/qc/standards`、`/qc/reports` 至少完成列表/详情/新增/设置入口的同源验收。
7. 质检设置页：`fields|numbers|approvals|strategies|print` 交互和客户管理设置母版一致。
8. `vue3` 构建通过；如果构建被其它模块既有错误阻塞，必须写清楚错误来源和本轮未触碰范围。
9. 处理记录写入 `docs/sales-parallel-coordination.md` 或新建 `docs/qc-module-coordination.md`，但必须在本文中记录链接。

## 给新会话窗口的启动提示词

```text
请先读取 docs/qc-module-new-window-handoff.md、docs/new-window-handoff.md、docs/after-sales-coordination.md。

你只负责质检中心，不处理其它中心。最终交付是可运行的 vue3 工程，不是只改静态 HTML。

质检模块的分类导航已经在当前 Vue 工程中调整过，必须以 vue3/src/layouts/erp-shell/navigation.ts 当前质检导航为准，不能再用 qc-list.jsx 的旧分类导航覆盖。

qc-list.jsx 只作为原始页面字段、示例数据、页面动作和业务交互逻辑来源；如果 qc-list.jsx 存在乱码，要结合当前导航中文、仓储/生产接口契约、上下文语义还原，不能凭空创造字段。

客户管理已验收页面和公共母版组件是样式与交互标准：列表页、详情页、新增页、设置页都必须复用母版，不允许私造不同风格。售后模块曾经因为跳过 JSX 分流、擅自删减动作集合、写死设置页导致返工；质检必须避免。

开工顺序：
1. 只读盘点 qc-list.jsx、现有 /qc 路由、导航、公共母版、仓储/生产质检契约。
2. 输出质检入口矩阵：工作台、质检管理、异常处理、质检分析、质检设置，并说明矩阵来自当前 navigation.ts。
3. 再实施 Vue 页面、mock/API adapter、导航和必要静态验收入口。
4. 交付前检查列表固定列、详情 Tab 切换、新增页弹窗回填、设置页母版一致、构建结果。

如遇到字段集合、状态集合、按钮集合、审核/处置动作集合不确定，先停下来只读梳理并写问题，询问之后等待指令，不要自行删减或简化。
```
