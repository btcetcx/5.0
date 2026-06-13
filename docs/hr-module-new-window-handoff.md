# 人力模块新窗口交接说明

更新时间：2026-05-30

## 本轮目标

新会话窗口只负责人力中心，最终交付物是可运行、可继续对接后端的 `vue3` 工程页面。静态预览只能作为验收镜子，不能只改静态 HTML。

重要规则：人力中心的分类导航已经在当前 Vue 工程中确定，不能直接使用 `hr-list.jsx` 的旧分类导航覆盖。`hr-list.jsx` 只作为字段、示例数据、页面动作和业务交互参考；一级/二级/三级导航入口以 `vue3/src/layouts/erp-shell/navigation.ts` 当前配置为准。

## 必读资料

1. 全局新窗口规则：`docs/new-window-handoff.md`
2. 售后返工教训：`docs/after-sales-coordination.md`
3. 母版库页面：
   - `vue3/src/views/template-gallery/TemplateGallery.vue`
   - 路由：`/templates`
   - 分类：`/templates/list`、`/templates/form`、`/templates/detail`、`/templates/setting`、`/templates/modal`、`/templates/base`
4. 客户管理已验收母版：
   - `vue3/src/views/sales/customers/CustomerList.vue`
   - `vue3/src/views/sales/customers/CustomerCreate.vue`
   - `vue3/src/views/sales/customers/CustomerDetail.vue`
   - `vue3/src/views/sales/customers/CustomerSettingPage.vue`
5. 公共母版组件：
   - `vue3/src/components/list-page/`
   - `vue3/src/components/form-page/`
   - `vue3/src/components/detail-page/`
   - `vue3/src/components/setting-page/`
   - `vue3/src/components/workbench/`
6. 当前人力导航源：
   - `vue3/src/layouts/erp-shell/navigation.ts`
7. 人力原型源：
   - `hr-list.jsx`
8. 关联公共原型源：
   - `person-picker.jsx`
   - `approval-flow.jsx`
   - `custom-field.jsx`
   - `print-template.jsx`
   - `filter-drawer.jsx`
   - `field-drawer.jsx`
   - `import-drawer.jsx`
   - `export-drawer.jsx`

说明：当前没有独立的人力中心接口契约文件。新窗口需要按 `hr-list.jsx` + 当前导航 + 公共母版建立前端 mock/API adapter，并在交付记录中标出“待后端补充人力中心独立契约”。不要因为契约缺失就写死页面。

## 母版库硬规则

新窗口开工前必须打开或阅读母版库实现，确认已有组件边界：

1. 列表页母版
   - `AwListPage`
   - `AwResourceTree`
   - `AwListToolbar`
   - `AwDataTable`
   - 人力列表如果需要左侧分类树，分类树节点来自本业务配置；不需要分类时用无树列表，不私造布局。

2. 新增/编辑页母版
   - `AwFormPage`
   - `AwEditableSubTable`
   - `AwAttachmentTable`
   - `AwRichTextEditor`
   - 人员、组织、岗位等选择必须走公共弹窗或抽公共选择器，不允许点击按钮后直接塞 mock 行。

3. 详情页母版
   - `AwDetailPage`
   - `AwDetailToolbar`
   - `AwDetailHeader`
   - `AwDetailInfoGrid`
   - `AwDetailTabs`
   - 详情 Tab 必须能切换并显示独立内容。

4. 设置页母版
   - `AwSettingPage`
   - `AwSettingToolbar`
   - `AwSettingSplitPage`
   - `AwSettingTree`
   - `AwSettingListCard`
   - `AwSettingTable`
   - `AwFieldSettingPage`
   - `AwCodeRuleBuilder`
   - `AwApprovalRuleEditor`
   - `AwPersonPickerModal`
   - `AwSettingModal`
   - 自定义字段、自定义编号、审批设置、策略设置、打印模板必须复用设置母版，不允许另写一套设置页。

## 售后模块教训，人力必须避免

1. 不能跳过当前 Vue 导航和 JSX 分流规则。
   - 人力入口以 `navigation.ts` 当前配置为准。
   - 遇到 `action`、`setting`、`tab`、`category` 等参数，先从当前导航确认入口，再从 `hr-list.jsx` 提取字段/动作。

2. 不能擅自删减动作集合。
   - 入职、离职、异动、审批、考勤处理、薪酬核算、档案到期等动作集合必须按原型保留。
   - 不确定时只读梳理并提问，不允许用“简化版”替代。

3. 不能私造弹窗和私造设置页。
   - 人员选择、负责人选择、组织选择、岗位选择、审批人员选择必须优先复用母版库/公共弹窗。
   - 设置页必须和客户/销售设置页一致。

4. 不能只做表面可见。
   - 页面字段、mock 数据、API adapter、导航、路由、静态验收入口要同源。
   - 字段来自 `hr-list.jsx`；如果乱码，结合当前导航中文和上下文语义还原，但不能凭空新增字段。

## 当前人力导航矩阵

以下矩阵来自当前 `vue3/src/layouts/erp-shell/navigation.ts`，不能用旧 JSX 覆盖：

| 二级导航 | 路由 | 三级/四级浮窗 |
| --- | --- | --- |
| 工作台 | `/hr` | 无 |
| 员工管理 | `/hr/employees` | 员工管理：新增员工、员工列表、入职管理、离职管理、异动管理；员工设置：员工自定义字段、员工自定义编号、员工审批设置、员工策略设置、设置员工打印模板 |
| 组织机构 | `/hr/orgs` | 组织机构：新增组织、组织列表、组织架构、部门编制；组织设置：组织自定义字段、组织自定义编号、组织审批设置、组织策略设置、设置组织打印模板 |
| 岗位管理 | `/hr/positions` | 岗位管理：新增岗位、岗位列表、岗位说明书、岗位编制；岗位设置：岗位自定义字段、岗位自定义编号、岗位审批设置、岗位策略设置、设置岗位打印模板 |
| 考勤管理 | `/hr/attendance` | 考勤管理：新增考勤、考勤列表、考勤记录、考勤统计；考勤设置：考勤自定义字段、考勤自定义编号、考勤审批设置、考勤策略设置、设置考勤打印模板 |
| 排班管理 | `/hr/schedules` | 排班管理：新增排班、排班列表、班次管理、考勤组管理、考勤日历；排班设置：排班自定义字段、排班自定义编号、排班审批设置、排班策略设置、设置排班打印模板 |
| 薪酬管理 | `/hr/payroll` | 薪酬管理：新增薪酬、工资列表、工资详情、薪资方案、薪酬类型、薪酬项目；薪酬设置：薪酬自定义字段、薪酬自定义编号、薪酬审批设置、薪酬策略设置、设置薪酬打印模板 |
| 档案管理 | `/hr/archives` | 档案管理：新增档案、档案列表、合同档案、证件档案；档案设置：档案自定义字段、档案自定义编号、档案审批设置、档案策略设置、设置档案打印模板 |
| 人事办公 | `/hr/office` | 办公申请：新增办公申请、申请列表；通知协同：发布公告、公告列表、预约会议、会议列表、个人日程、团队日程；办公设置：人事办公自定义字段、人事办公自定义编号、人事办公审批设置、人事办公策略设置、会议室管理、工作日历 |

## 建议实施范围

第一阶段先完成“可见入口 + 母版一致 + 字段同源”的骨架：

1. 工作台 `/hr`
2. 员工管理 `/hr/employees`
3. 组织机构 `/hr/orgs`
4. 岗位管理 `/hr/positions`
5. 考勤管理 `/hr/attendance`
6. 排班管理 `/hr/schedules`
7. 薪酬管理 `/hr/payroll`
8. 档案管理 `/hr/archives`
9. 人事办公 `/hr/office`

每个二级模块至少需要：

- 列表页
- 新增/编辑页
- 详情页
- `fields|numbers|approvals|strategies|print` 设置页入口和可交互母版
- 导航/浮窗入口可打开
- mock/API adapter 有统一来源

## API/mock 建议

建议新增集中 adapter：

- `vue3/src/app/api/hr/types.ts`
- `vue3/src/app/api/hr/resources.ts`
- `vue3/src/mock/hr/employees.json`
- `vue3/src/mock/hr/orgs.json`
- `vue3/src/mock/hr/positions.json`
- `vue3/src/mock/hr/attendance.json`
- `vue3/src/mock/hr/schedules.json`
- `vue3/src/mock/hr/payroll.json`
- `vue3/src/mock/hr/archives.json`
- `vue3/src/mock/hr/office.json`
- `vue3/src/mock/hr/settings.json`

建议资源：

| 页面 | resource |
| --- | --- |
| 员工管理 | `hr-employees` |
| 组织机构 | `hr-orgs` |
| 岗位管理 | `hr-positions` |
| 考勤管理 | `hr-attendance` |
| 排班管理 | `hr-schedules` |
| 薪酬管理 | `hr-payroll` |
| 档案管理 | `hr-archives` |
| 人事办公 | `hr-office` |

设置统一接口建议：

```text
GET   /api/v1/{resource}/settings
PATCH /api/v1/{resource}/settings
```

基础资源接口建议：

```text
GET    /api/v1/{resource}
POST   /api/v1/{resource}
GET    /api/v1/{resource}/{id}
PATCH  /api/v1/{resource}/{id}
POST   /api/v1/{resource}/{id}/submit
POST   /api/v1/{resource}/{id}/approve
POST   /api/v1/{resource}/{id}/disable
POST   /api/v1/{resource}/{id}/print
POST   /api/v1/{resource}/{id}/export
```

## 页面验收底线

1. 顶部人力一级导航进入 `/hr` 工作台。
2. 左侧二级导航和三级/四级浮窗必须与当前 `navigation.ts` 的人力导航矩阵一致。
3. 每个列表页字段、数据、状态、操作来自 `hr-list.jsx`，并使用公共列表母版。
4. 列表选择框、序号、操作列固定；工具栏顺序和客户管理一致。
5. 新增页使用公共表单母版，字段按 `hr-list.jsx`，附件/富文本/明细表使用公共组件。
6. 详情页使用公共详情母版，Tab 能切换并显示独立内容。
7. 设置页必须复用客户管理/销售设置母版；字段弹窗、编号构建器、审批编辑器、人员选择、IOS 开关一致。
8. 人员、组织、岗位、审批人选择不能用普通输入框假装，要使用选择弹窗或公共 picker。
9. 构建通过；若被其它模块既有错误阻塞，必须写明错误来源和本轮未触碰范围。
10. 处理记录写入 `docs/sales-parallel-coordination.md` 或新建 `docs/hr-module-coordination.md`，并在交付里说明。

## 给新会话窗口的启动提示词

```text
请先读取 docs/hr-module-new-window-handoff.md、docs/new-window-handoff.md、docs/after-sales-coordination.md，并查看母版库 vue3/src/views/template-gallery/TemplateGallery.vue。

你只负责人力中心，不处理其它中心。最终交付是可运行的 vue3 工程，不是只改静态 HTML。

人力中心分类导航已经在当前 Vue 工程中确定，必须以 vue3/src/layouts/erp-shell/navigation.ts 当前人力导航为准，不能用 hr-list.jsx 的旧分类导航覆盖。

hr-list.jsx 只作为原始页面字段、示例数据、页面动作和业务交互逻辑来源；如果 hr-list.jsx 存在乱码，要结合当前导航中文和上下文语义还原，不能凭空创造字段。

母版库和客户管理已验收页面是样式与交互标准：列表页、详情页、新增页、设置页、弹窗选择器都必须复用母版，不允许私造不同风格。

开工顺序：
1. 只读盘点当前 /hr 导航、hr-list.jsx、母版库、公共组件。
2. 输出人力入口矩阵：工作台、员工管理、组织机构、岗位管理、考勤管理、排班管理、薪酬管理、档案管理、人事办公，并说明矩阵来自当前 navigation.ts。
3. 再实施 Vue 页面、mock/API adapter、导航和必要静态验收入口。
4. 交付前检查列表固定列、详情 Tab 切换、新增页弹窗回填、设置页母版一致、构建结果。

如遇到字段集合、状态集合、按钮集合、审批/人事动作集合不确定，先停下来只读梳理并写问题，不要自行删减或简化。
```
