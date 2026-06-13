# 人力中心协同记录

更新时间：2026-05-30

## 本轮范围

- 仅处理人力中心，不修改其它中心业务逻辑。
- Vue 工程新增人力中心可运行页面，静态预览不作为实现来源。
- 人力中心入口以 `vue3/src/layouts/erp-shell/navigation.ts` 当前矩阵为准：
  - `/hr`
  - `/hr/employees`
  - `/hr/orgs`
  - `/hr/positions`
  - `/hr/attendance`
  - `/hr/schedules`
  - `/hr/payroll`
  - `/hr/archives`
  - `/hr/office`

## 实现记录

- 新增 HR mock/API adapter：
  - `vue3/src/app/api/hr/types.ts`
  - `vue3/src/app/api/hr/resources.ts`
  - `vue3/src/mock/hr/*.json`
- 新增 HR Vue 页面：
  - 工作台：`vue3/src/views/hr/HrWorkbench.vue`
  - 通用资源页：`vue3/src/views/hr/HrResourcePage.vue`
  - 列表、动作、新增、详情、设置子页面：`vue3/src/views/hr/components/`
  - 模块配置：`vue3/src/views/hr/hrResource.config.ts`
- 路由接管：
  - `/hr` 使用人力工作台。
  - 8 个二级模块使用人力资源页。
  - 已从 pending 兜底路由中移除 `HrCenter`，避免命中 `ContractWorkbenchPage`。

## 字段与交互来源

- 字段、状态、示例数据、详情 Tab、动作集合来自 `hr-list.jsx`。
- 一级、二级、三级/四级入口来自当前 `navigation.ts`，不使用 `hr-list.jsx` 旧分类导航覆盖。
- `hr-list.jsx` 未覆盖或当前导航新增的入口，按人力业务流程补齐展示骨架：
  - 人事办公公告、会议、日程、会议室、工作日历入口。
  - 设置页打印模板、策略、审批流程的通用配置数据。
- 待后端补充人力中心独立契约后，将当前 mock adapter 切换到真实接口。

## 母版复用

- 列表页复用：
  - `AwListPage`
  - `AwResourceTree`
  - `AwListToolbar`
  - `AwDataTable`
- 新增页复用：
  - `AwFormPage`
  - `AwEditableSubTable`
  - `AwAttachmentTable`
  - `AwRichTextEditor`
  - `AwPersonPickerModal`
- 详情页复用：
  - `AwDetailPage`
  - `AwDetailToolbar`
  - `AwDetailHeader`
  - `AwDetailInfoGrid`
  - `AwDetailTabs`
- 设置页复用：
  - `AwSettingPage`
  - `AwSettingToolbar`
  - `AwFieldSettingPage`
  - `AwCodeRuleBuilder`
  - `AwApprovalRuleEditor`
  - `AwStrategySettingPage`
  - `AwSettingTable`
  - `AwSettingModal`
  - `AwPersonPickerModal`

## 待后端补充

- 待后端补充人力中心独立接口契约。
- 当前前端预留接口：
  - `GET /api/v1/{resource}`
  - `POST /api/v1/{resource}`
  - `GET /api/v1/{resource}/{id}`
  - `PATCH /api/v1/{resource}/{id}`
  - `POST /api/v1/{resource}/{id}/submit`
  - `POST /api/v1/{resource}/{id}/approve`
  - `POST /api/v1/{resource}/{id}/disable`
  - `POST /api/v1/{resource}/{id}/print`
  - `POST /api/v1/{resource}/{id}/export`
  - `GET /api/v1/{resource}/settings`
  - `PATCH /api/v1/{resource}/settings`

## 验证记录

- `vue-tsc --noEmit` 通过。
- `vite build` 通过。
- `pnpm run build` 在当前 PowerShell 环境直接执行时出现 `Access is denied.`，已改用显式 Node 执行 `vue-tsc` 与 `vite` 完成等价验证。
- `vite build` 仅保留既有 chunk 体积警告，不阻塞本轮人力中心交付。

## 第二阶段补充记录

- 工作台从通用展示升级为人力专用可点击入口：
  - 待办 KPI 可跳转入职、审批、考勤、薪酬、档案和编制入口。
  - 业务导航卡片可跳转 8 个二级模块。
  - 快捷入口覆盖新增员工、入职管理、考勤处理、薪酬核算、档案到期。
- 列表工具栏补齐可交互抽屉镜像：
  - 筛选
  - 字段配置
  - 导入
  - 导出
  - 抽屉结构参考公共原型，入口仍从 `AwListToolbar` 触发。
- 新增页选择器加强：
  - 人员、申请人、负责人、审批人、直属上级、经办人继续使用 `AwPersonPickerModal`。
  - 组织、部门、岗位、职级、考勤组、班次、薪资方案、薪酬类型、发放账户等使用 `AwOptionPickerModal`。
  - 选择后回填表单字段，不再用普通输入框假装选择。
- 第二阶段验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 第三阶段补充记录

- mock/API adapter 补齐前端状态回写：
  - 新增记录会写入当前 resource 的内存 mock 列表。
  - 提交、审批、禁用会更新当前记录状态。
  - 打印、导出、批量提交、批量审批、批量禁用、批量导出会生成操作记录。
- 列表页批量动作已接入 `batchHrAction`，执行后重新加载列表，确保状态、数据和操作入口同源。
- 详情页动作已接入 `submitHrRecord`、`approveHrRecord`、`disableHrRecord`、`printHrRecord`、`exportHrRecord`，动作完成后刷新详情状态和操作日志。
- 详情 Tab 深化为各模块独立内容：员工生命周期/任职/合同，组织部门编制，岗位任职资格/编制，考勤明细/处理记录，排班班次日历/人员覆盖，薪酬薪资项目/核算记录，档案材料/到期提醒，人事办公协同记录/公告会议日程。
- 第三阶段验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 第四阶段补充记录

- 修正 `vue3/src/views/hr/hrResource.config.ts` 的人力配置中文源，避免 HR 页面字段、动作、工作台卡片、状态和 Tab 文案继续出现历史编码错显。
- 保持人力入口矩阵仍以 `vue3/src/layouts/erp-shell/navigation.ts` 为准；本轮没有改写导航矩阵。
- `HrResourcePage.vue` 补强 query 分流：
  - `?action=新增/添加/新建/发布公告` 进入新增/编辑母版页。
  - `?action=...列表` 回到当前资源列表页。
  - `?action=...详情/明细` 或 `?id=...` 进入详情母版页。
  - `?setting=fields|numbers|approvals|strategies|print` 进入对应设置母版页。
  - 导航浮窗传入的 `员工自定义字段`、`员工自定义编号`、`员工审批设置`、`员工策略设置`、`设置员工打印模板` 等中文 action 也会映射到统一设置页。
- `HrActionList.vue` 清理为正常中文验收文案，动作列表页会保留 action 上下文跳转到详情。
- 第四阶段验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
  - 本地预览抽查 `/hr/employees?action=入职管理`、`/hr/office?action=发布公告`、`/hr/payroll?setting=approvals` 均返回可挂载 Vue app。

## 第五阶段补充记录

- 完成浏览器级可视化抽查：
  - `/hr`
  - `/hr/employees`
  - `/hr/orgs`
  - `/hr/positions`
  - `/hr/attendance`
  - `/hr/schedules`
  - `/hr/payroll`
  - `/hr/archives`
  - `/hr/office`
  - `/hr/employees?action=入职管理`
  - `/hr/employees?action=new`
  - `/hr/employees?id=emp_001`
  - `/hr/employees?setting=fields|numbers|approvals|strategies|print`
- 修正 HR 新增页旧编码文案和字段识别正则，新增页现在使用正常中文字段、按钮、提示和保存反馈。
- 修正 `AwOptionPickerModal` 旧编码文案，组织/岗位/班次/薪资等选项选择器现在显示正常中文，支持点选后“确定”回填，也支持双击行直接确认。
- 新增页交互抽查通过：
  - 所属部门选择弹窗可打开，选择“销售部”后可回填。
  - 岗位选择弹窗可打开，选择“销售经理”后可回填。
  - 直属上级等人员字段仍使用 `AwPersonPickerModal`。
  - 保存草稿会调用 HR mock API 并显示保存反馈。
- 详情页交互抽查通过：
  - 详情 Tab 可切换到“员工生命周期”和“操作记录”。
  - 提交动作可回写状态并生成操作记录。
- 设置页交互抽查通过：
  - 字段、编号、审批、策略、打印模板入口均可渲染。
  - 自定义字段页可打开“新增字段”弹窗。
- 第五阶段验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 浏览器批注修复记录

- 针对 `/hr/employees?action=离职管理` 批注，移除 `HrActionList.vue` 中额外添加的 `section.aw-card.hr-action-head` 说明/新增容器。
- 动作页现在严格回归列表母版结构：`AwListPage` + `AwResourceTree` + `AwListToolbar` + `AwDataTable`，新增入口由 `AwListToolbar` 统一承载。
- 全局检索确认 `hr-action-head`、`动作入口来自当前人力导航`、`字段与示例数据来自 hr-list.jsx` 在 HR Vue 页面中无残留。
- 浏览器复验 HR 91 个入口，包括工作台、8 个二级模块、动作入口、新增入口、详情入口、5 类设置入口：
  - 自造头部容器残留：0
  - 空白页：0
  - 运行时错误：0
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 薪酬管理新增与详情入口删除记录

- 按用户指令“薪酬管理删除新增薪酬和薪酬详情的入口”，调整薪酬入口。
- `navigation.ts` 中人力中心「薪酬管理」浮窗删除：
  - 新增薪酬
  - 工资详情
- 当前「薪酬管理」浮窗仅保留：
  - 工资列表
  - 薪资方案
  - 薪酬类型
  - 薪酬项目
- `hrResource.config.ts` 同步删除薪酬分组与动作集合中的“工资详情”，避免导航与动作页配置不同步。
- `HrListView.vue` 针对 `hr-payroll` 普通列表隐藏 create 动作，薪酬列表工具栏不再显示“新增薪酬 / 新增工资单”入口。
- `HrWorkbench.vue` 中“薪酬核算”快捷入口从旧 `/hr/payroll?action=工资详情` 改为 `/hr/payroll`。
- `HrResourcePage.vue` 中薪酬模块不再根据无 id 的 `action=工资详情/薪酬详情` 进入详情页；旧地址回落普通薪酬列表。
- 浏览器复查：
  - `/hr/payroll` 工具栏为“刷新数据、筛选、字段配置、导入、导出”，无新增入口。
  - `/hr/payroll?action=工资详情` 不再进入详情页，也不再进入“生成发薪付款单”动作页，回落普通薪酬列表。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 薪酬结构操作列收敛记录

- 按用户指令“薪资方案、薪酬类型、薪酬项目操作字段里只能是查看详情”，调整 `HrPayrollStructurePage.vue`。
- 三个页面的 `AwSettingTable` 操作列均覆盖公共默认操作，只保留“查看详情”：
  - `/hr/payroll?action=薪资方案`
  - `/hr/payroll?action=薪酬类型`
  - `/hr/payroll?action=薪酬项目`
- 删除表格操作列中的“编辑”“删除”入口，名称列也不再作为编辑入口。
- “查看详情”打开详情态弹窗，弹窗 footer 仅保留“关闭”，不再出现“取消 / 确定”保存动作。
- 为薪酬结构宽表增加右侧 sticky 操作列，保证“查看详情”不随横向滚动消失。
- 浏览器复查：
  - 三个入口操作列文本均为“查看详情”。
  - 三个入口表格文本中均不再出现“编辑”“删除”。
  - 三个入口操作列计算样式为 `position: sticky`。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 薪酬结构页取消左侧分类记录

- 按浏览器批注“不要左侧的分类，薪酬类型和薪酬方案全部不要左侧的分类”，调整 `HrPayrollStructurePage.vue`。
- `/hr/payroll?action=薪资方案`、`/hr/payroll?action=薪酬类型`、`/hr/payroll?action=薪酬项目` 均取消 `AwSettingSplitPage` 和 `AwSettingTree` 左侧分类树，改为全宽 `AwSettingListCard + AwSettingTable`。
- 层级关系不再通过左侧树筛选承载，改为表格字段直接展示：
  - 薪酬类型页新增“所属方案”列。
  - 薪酬项目页新增“所属方案”“所属类型”列。
- 保留新增/编辑弹窗中的所属方案、所属类型选择能力，数据仍写入统一薪酬结构 mock/API adapter。
- 浏览器复查：
  - `/hr/payroll?action=薪资方案`：无 `.aw-setting-tree`、无 `.aw-setting-split`。
  - `/hr/payroll?action=薪酬类型`：无 `.aw-setting-tree`、无 `.aw-setting-split`，表格显示“所属方案”。
  - `/hr/payroll?action=薪酬项目`：无 `.aw-setting-tree`、无 `.aw-setting-split`，表格显示“所属方案”“所属类型”。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 组织列表、岗位列表、岗位说明书详情拟真数据补齐记录

- 按用户要求完成三个详情方向：
  - `/hr/orgs?id=org_sales_01` 等组织列表详情。
  - `/hr/positions?id=pos_001` 等岗位列表详情。
  - `/hr/positions?id=hr-positions_action_0&action=岗位说明书` 等岗位说明书详情。
- `orgs.json` 补充组织详情拟真字段：组织类型、成本中心、办公地点、联系电话、业务范围、预算负责人，并补齐编制与在岗、在岗人员、组织变更、审批记录、操作记录明细。
- `positions.json` 补充岗位详情拟真字段：岗位类型、直接上级、薪级范围、任职资格、职责摘要、复审周期、办公地点，并补齐编制占用、任职人员、审批记录、操作记录明细。
- `HrDetailPage.vue` 增加组织详情、岗位详情、岗位说明书详情的差异化信息网格、头部摘要和明细表列：
  - 组织详情显示组织名称、组织编号、上级部门、负责人、成本中心、业务范围、编制/在岗等。
  - 岗位详情显示岗位名称、岗位编号、所属组织、岗位序列、岗位类型、直接上级、薪级范围、职责摘要等。
  - 岗位说明书详情不再回落到普通岗位首条记录，而是按动作行 id 生成对应说明书记录；Tab 改为岗位说明、岗位职责、任职资格、薪级编制、操作记录。
- 浏览器复查：
  - 组织详情头部显示“销售一部 / 上级部门：销售部 / 负责人：王人事 / 编制人数：32 / 在岗人数：29”，信息区显示业务范围、成本中心等字段。
  - 岗位详情头部显示“销售经理 / 所属组织：销售中心 / 岗位等级：P6 / 岗位序列：销售序列 / 在岗/编制：9 / 12”，信息区显示岗位类型、直接上级、薪级范围、职责摘要等字段。
  - 岗位说明书详情可打开第二行动作记录，显示“高级前端工程师 / 版本号：V2.1 / 生效日期：2026-05-01”，Tab 为岗位说明、岗位职责、任职资格、薪级编制、操作记录。

## 岗位说明书详情 Tab 精简记录

- 按浏览器批注“说明书详情不需要审批记录这个 tab”，删除岗位说明书详情专用 Tab 配置中的“审批记录”。
- 当前岗位说明书详情 Tab 为：岗位说明、岗位职责、任职资格、薪级编制、操作记录。
- 本次仅影响岗位说明书详情页；普通岗位详情仍保留审批记录 Tab。
- 浏览器复查 `/hr/positions?id=hr-positions_action_1&action=岗位说明书`：Tab 为岗位说明、岗位职责、任职资格、薪级编制、操作记录，已无审批记录。
- 验证：
  - `vite build` 通过，仅保留既有 chunk 体积警告。
  - `vue-tsc --noEmit` 被未触碰的质检中心 `src/views/qc/QcResourcePage.vue` 阻塞：`isQcGroupDetailRow` 未定义。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 岗位说明书无分类列表页调整记录

- 按浏览器批注“岗位说明书页面采用不带分类的列表页，根据岗位说明书的内容完成字段填充”，调整岗位动作列表页分流。
- `HrActionList.vue` 针对 `hr-positions` 动作页不再渲染 `AwResourceTree`，岗位说明书页面生成 `aw-list-layout-no-tree`，移除左侧“岗位状态”分类树。
- `hrResource.config.ts` 中岗位说明书 profile 字段改为岗位说明书内容字段：
  - 岗位名称、岗位编号、所属组织、岗位等级、直接上级、职责摘要、任职资格、薪级范围、版本号、生效日期、说明书状态。
- 岗位说明书 mock 行补充销售经理、高级前端工程师、财务共享专员的职责摘要、任职资格、薪级范围、版本号和生效日期，后续可对接人力中心岗位说明书独立接口。
- 浏览器复查：
  - `/hr/positions?action=岗位说明书` 已无 `.aw-doc-tree`，页面为 `.aw-list-layout.aw-list-layout-no-tree`。
  - 表头显示“岗位名称、岗位编号、所属组织、岗位等级、直接上级、职责摘要、任职资格、薪级范围、版本号、生效日期、说明书状态、操作”。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 岗位列表无分类列表页调整记录

- 按浏览器批注“这个页面不要左侧的分类了，采用无分类的列表页，仅显示岗位信息即可”，撤回 `/hr/positions` 与 `/hr/positions?action=岗位列表` 的分级设置页分流。
- `HrResourcePage.vue` 当前仅让组织机构列表进入 `HrHierarchyListPage`；岗位列表回到公共列表母版 `HrListView`。
- `HrListView.vue` 针对 `hr-positions` 不再渲染 `AwResourceTree` 的 `tree` 插槽，页面生成 `aw-list-layout-no-tree`，避免出现“一级岗位序列/管理序列/销售序列”等左侧分类。
- 岗位数据仍来自 `hr-positions` mock/API adapter，列表直接展示岗位名称、岗位编号、所属组织、岗位等级、岗位编制、在岗人数、生效日期、岗位状态与操作列。
- 浏览器复查：
  - `/hr/positions` 已无 `.aw-doc-tree`，无 `.aw-setting-page`。
  - `/hr/positions` 为 `.aw-list-layout.aw-list-layout-no-tree`，表格显示“销售经理”“高级前端工程师”等岗位数据。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
## 组织列表部门分支调整记录

- 针对浏览器批注“这里修改为部门的列表，右侧是部门的分支，比如销售部，右侧是销售一部、销售二部”，调整 `vue3/src/mock/hr/orgs.json` 组织 mock/API adapter 数据源。
- 组织列表左侧一级从“集团总部”改为部门列表：
  - 销售部
  - 研发部
  - 财务部
- 组织列表右侧改为当前部门下的分支部门，例如销售部下显示“销售一部、销售二部”。
- `HrHierarchyListPage.vue` 组织列表文案同步调整：
  - 左侧标题：部门列表
  - 新增一级弹窗：新增部门
  - 右侧说明：左侧为部门列表，右侧维护当前部门下的分支部门
  - 表格列：分支部门、所属部门、部门编号、负责人、编制人数、在编人数、状态
- 浏览器复查：
  - `/hr/orgs` 左侧显示“部门列表 +”。
  - `/hr/orgs` 左侧包含销售部、研发部、财务部。
  - `/hr/orgs` 右侧销售部下显示销售一部、销售二部。
  - `/hr/orgs` 页面不再出现集团总部。
- 验证：
  - `vue-tsc --noEmit` 未通过，阻塞来自本轮未触碰的质检中心 `src/views/qc/QcResourcePage.vue`：`confirmStandardDetail`、`createSampleColumns`、`handleSampleAdd`、`groupStandardTableSlots` 缺失。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
## 组织机构浮窗入口精简记录

- 按用户指令调整人力中心「组织机构」浮窗：
  - 删除「新增组织」入口。
  - 删除「新增岗位」入口。
  - 删除单独「岗位管理」分组。
  - 将「岗位列表」和「岗位说明书」并入「组织机构」分组。
- 当前 `hrOrg.flyout` 仅保留一个分组「组织机构」，入口顺序为：
  - 组织列表：`/hr/orgs`
  - 岗位列表：`/hr/positions`
  - 岗位说明书：`/hr/positions?action=岗位说明书`
- 本轮只调整浮窗导航入口；组织列表/岗位列表页面中的新增按钮和已有新增页面能力不删除。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
## 组织岗位分级列表新增一级补齐记录

- 针对浏览器批注“全部采用客户分组设置，这里不是有个 + 号新增一级么”，补齐 `HrHierarchyListPage.vue` 左侧一级树标题的新增入口。
- 组织列表和岗位列表保持同一交互：
  - `/hr/orgs` 左侧标题为“一级组织 +”，点击打开“新增一级组织”弹窗。
  - `/hr/positions?action=岗位列表` 左侧标题为“一级岗位序列 +”，点击打开“新增一级岗位序列”弹窗。
- 新增一级弹窗复用设置母版 `AwSettingModal`，字段为名称、编号、备注；确认后暂写入前端本地一级树并提示后续对接 `hr-orgs` / `hr-positions` 正式新增接口。
- 浏览器复查：
  - `/hr/orgs` `.aw-setting-tree-title-row` 存在，`+` 按钮数量为 1，弹窗标题为“新增一级组织”。
  - `/hr/positions?action=岗位列表` `.aw-setting-tree-title-row` 存在，`+` 按钮数量为 1，弹窗标题为“新增一级岗位序列”。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
## 员工列表详情真实数据替换记录

- 按用户指令复查 `/hr/employees?id=emp_001` 员工列表详情页，确认原详情 Tab 中仍存在固定演示行和“示例”占位生成逻辑。
- `vue3/src/mock/hr/employees.json` 从简单列表行扩展为员工详情 mock 数据源，补充员工基础信息、附件、生命周期、任职历史、合同证照、审批记录和操作记录。
- `vue3/src/views/hr/components/HrDetailPage.vue` 调整为记录级渲染：
  - 员工详情头部、信息网格使用当前员工记录字段。
  - 员工生命周期、任职历史、合同证照、审批记录、操作记录从 `record.detailRows` 读取。
  - 操作记录会合并 HR mock adapter 运行时动作日志，不再回退到固定演示数据。
  - 员工详情 Tab 找不到记录级数据时显示“暂无记录”，不再生成“示例”占位行。
- `vue3/src/app/api/hr/types.ts` 将 `HrRecord` 扩展字段类型放宽为 `unknown`，为后续后端返回附件和详情数组预留结构。
- 浏览器复查：
  - `/hr/employees?id=emp_001` 基础信息显示张园、销售部、销售经理 / P6、13800000001、2026-08-10、海口总部 5F。
  - 员工生命周期、任职历史、合同证照、审批记录、操作记录五个 Tab 均能切换并显示当前员工记录级数据。
  - `/hr/employees?id=emp_018` 显示李文涛、研发部、13800000018，未串用张园详情数据。
  - 页面正文未再出现“示例”占位文案。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 转正管理详情审核动作批注修复记录

- 针对 `/hr/employees?id=hr-employees_action_0&action=转正管理` 工具栏批注，详情页接收来源 `actionLabel`，识别来源为“转正管理”时不再显示通用“修改、提交、审批、打印、导出、停用”动作集合。
- 转正管理来源详情页继续复用 `AwDetailToolbar`，但右侧动作区仅保留一个主按钮“转正审核”，返回按钮显示“返回转正管理”并回到转正管理动作列表。
- 点击“转正审核”接入母版库 `AwAuditActionModal`，弹窗标题为“转正审核”，摘要显示当前员工、员工编号、当前状态和“员工转正审批流程”节点。
- 转正审核弹窗动作包括“转正通过、延期转正、退回修改、转交处理”，人员选择沿用 HR 公共 `AwPersonPickerModal` 数据源。
- 弹窗确认后会更新当前详情页状态与操作记录，后续待后端补充人力中心独立契约后对接正式转正审核接口。
- 浏览器 DOM 复查：
  - 转正管理来源详情页工具栏文本为“返回转正管理 / 转正审核”。
  - 工具栏不再出现“修改、提交、审批、打印、导出、停用”通用动作集合。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 离职管理详情确认动作批注修复记录

- 针对 `/hr/employees?id=hr-employees_action_0&action=离职管理` 工具栏批注，详情页将“离职管理”来源纳入员工动作来源详情分支。
- 离职管理来源详情页继续复用 `AwDetailToolbar`，但右侧动作区仅保留一个主按钮“离职确认”，不再显示“修改、提交、审批、打印、导出、停用”通用动作集合。
- “离职确认”点击后与转正管理一致，复用母版库 `AwAuditActionModal`，弹窗标题为“离职确认”，摘要显示当前员工、员工编号、当前状态和“员工离职确认流程”节点。
- 离职确认弹窗动作包括“离职确认、退回修改、转交处理”，人员选择沿用 HR 公共 `AwPersonPickerModal` 数据源。
- 弹窗确认后会更新当前详情页状态与操作记录，后续待后端补充人力中心独立契约后对接正式离职确认接口。
- 浏览器 DOM 复查：
  - 离职管理来源详情页工具栏文本为“返回离职管理 / 离职确认”。
  - 转正管理来源详情页仍为“返回转正管理 / 转正审核”。
  - 两个动作来源详情页均不再出现通用动作集合。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 审核动作弹窗母版更新同步记录

- 按用户指令重新读取母版库审核动作弹窗：`vue3/src/components/detail-page/AwAuditActionModal.vue` 和 `vue3/src/views/template-gallery/TemplateGallery.vue`。
- 新版 `AwAuditActionModal` 增加 `approvalNodes` 入参，弹窗会显示“审批节点”stepper，节点支持 `done/current/pending/rejected` 状态。
- `HrDetailPage.vue` 已同步新版母版接口：
  - 转正管理详情传入转正审批节点：资料提交、直属上级评估、人力中心复核、状态归档。
  - 离职管理详情传入离职确认节点：离职申请、工作交接、人力离职确认、账号权限关闭。
  - 转正审核、离职确认仍共用 `AwAuditActionModal`，人员选择继续沿用 `AwPersonPickerModal`。
- 浏览器复查：
  - `/templates/modal` 打开“审核动作弹窗”后，确认显示“审批节点”、销售主管审批、财务审批等新版母版节点。
  - `/hr/employees?id=hr-employees_action_0&action=离职管理` 打开“离职确认”后，确认弹窗显示“审批节点”、工作交接、人力离职确认、账号权限关闭。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 审核弹窗动作文案回归母版记录

- 针对浏览器批注“审核通过、审核驳回、退回修改、转交处理；不要自己发挥”，转正审核和离职确认弹窗的处理动作已回归母版固定文案。
- `HrDetailPage.vue` 不再在审核弹窗动作区使用“转正通过、延期转正、离职确认”等自定义动作文案。
- 转正审核和离职确认仍保留各自工具栏主按钮与弹窗标题，但弹窗内部处理动作统一为：
  - 审核通过
  - 审核驳回
  - 退回修改
  - 转交处理
- 状态回写逻辑仍按业务来源处理：转正审核的“审核通过”回写为已转正；离职确认的“审核通过”回写为离职；审核驳回和退回修改分别回写到对应状态。
- 浏览器复查：
  - `/hr/employees?id=hr-employees_action_0&action=离职管理` 打开“离职确认”后，动作区严格显示“审核通过 审核驳回 退回修改 转交处理”。
  - `/hr/employees?id=hr-employees_action_0&action=转正管理` 打开“转正审核”后，动作区严格显示“审核通过 审核驳回 退回修改 转交处理”。
  - 未再出现“离职确认、转正通过、延期转正”等自定义动作按钮。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 员工动作页组织架构批注修复记录

- 针对 `/hr/employees?action=离职管理` 左侧树批注，员工管理下动作页不再使用动作 profile 的“流程状态”作为左侧分类树。
- `HrActionList.vue` 保持列表母版结构不变，仍复用 `AwListPage`、`AwResourceTree`、`AwListToolbar`、`AwDataTable`。
- 员工动作页左侧树统一改为员工模块配置中的“组织架构”，节点沿用员工模块组织节点：集团总部、销售部、研发部、财务部、仓储部、人事部。
- 离职管理按“所属部门”统计和筛选组织节点，避免组织节点计数失真。
- 浏览器复查：
  - `/hr/employees?action=离职管理` 左侧树为“组织架构”，不再是“流程状态”。
  - 离职管理仍保留“新增离职事项”和表格中的流程状态字段。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 员工管理异动管理入口删除记录

- 按用户指令“员工管理 删除 异动管理”，删除 `vue3/src/layouts/erp-shell/navigation.ts` 中人力中心「员工管理 > 员工管理」浮窗的“异动管理”入口。
- 同步删除 HR 员工资源配置中的“异动管理”动作入口和动作 profile，避免导航之外仍能进入旧动作页。
- 删除后员工管理动作入口仅保留“离职管理”；新增员工、员工列表和员工设置入口不变。
- 全局复查 `vue3/src`，确认不再残留“异动管理”入口文案；工作台“员工异动单”和字段“异动类型/岗位异动”等业务文案不是本次入口删除范围，继续保留。
- 浏览器复查：
  - `/hr/employees?action=离职管理` 仍显示“新增离职事项”，左侧树为“组织架构”。
  - `/hr/employees?action=异动管理` 不再显示“异动管理”或“新增异动事项”，回落到员工列表组织架构。
- 验证：
  - `vue-tsc --noEmit` 未通过，阻塞来自未触碰的研发中心 `src/views/rd/RdResourcePage.vue`：`openProjectMemberPicker`、`personPickerTitle`、`closePersonPicker` 缺失。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 员工管理转正管理入口新增记录

- 按用户指令“员工管理 增加一个 转正管理”，在 `vue3/src/layouts/erp-shell/navigation.ts` 中人力中心「员工管理 > 员工管理」浮窗新增“转正管理”入口。
- 同步补充 HR 员工资源 `actions` 和 `hrActionProfiles.employees.转正管理`，避免只加导航但没有动作页数据。
- 转正管理字段基于 `hr-list.jsx` 中“试用转正/待转正”生命周期线索和员工档案字段补齐，字段包括员工姓名、员工编号、所属部门、岗位、入职日期、计划转正日、责任人、评估事项。
- 转正管理继续复用动作列表母版；左侧树沿用员工管理“组织架构”，不新增私有容器或流程状态树。
- 浏览器复查：
  - `/hr/employees?action=转正管理` 可打开，并显示“新增转正事项”。
  - 转正管理左侧树为“组织架构”，不显示“流程状态”树。
  - `/hr/employees?action=离职管理` 仍显示“新增离职事项”。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 组织机构浮窗与组织分类设置批注修复记录

- 按浏览器批注调整人力中心「组织机构」浮窗：
  - 「组织机构」分组仅保留“新增组织”“组织列表”。
  - 「组织设置」新增“组织分类”，并使用显式路由 `/hr/orgs?setting=categories`。
- `HrResourcePage.vue` 新增 `categories` 设置分流；兼容旧 `?action=组织分类`，会进入同一组织分类设置页。
- `HrSettingPage.vue` 新增组织分类设置页，复用设置母版：
  - `AwSettingPage`
  - `AwSettingToolbar`
  - `AwSettingSplitPage`
  - `AwSettingTree`
  - `AwSettingListCard`
  - `AwSettingTable`
  - `AwSettingModal`
- 页面结构对齐客户分组设置：左侧为一级组织分类，右侧为当前一级下的二级分类列表；表格列为序号、分类名称、上级分类、分类编号、组织数量、状态、操作。
- HR settings mock/API adapter 增加 `categories` 数据，组织分类数据作为 `GET /api/v1/hr-orgs/settings` 的前端 mock 字段预留，待后端补充人力中心独立契约后固化。
- 浏览器复查：
  - `/hr/orgs?setting=categories` 显示 split 布局，左侧一级为经营组织、职能组织、项目组织，右侧显示销售中心、供应链中心等二级分类。
  - `/hr/orgs?action=组织分类` 兼容进入同一组织分类设置页。
  - `/hr/orgs` 仍为组织列表页。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 员工管理入职管理入口删除记录

- 按浏览器批注“员工管理-员工管理 删除入职管理”，删除 `vue3/src/layouts/erp-shell/navigation.ts` 中人力中心「员工管理 > 员工管理」浮窗的“入职管理”入口。
- 同步删除 HR 员工资源配置中的“入职管理”动作入口、动作 profile 和工作台快捷入口，避免导航之外仍能进入旧动作页。
- 工作台“待入职办理”KPI 保留为员工业务待办，但点击后回到 `/hr/employees?action=员工列表`，不再跳转旧的“入职管理”动作页。
- 全局复查 `vue3/src`，确认不再残留“入职管理”入口文案；员工档案中的“待入职”“入职日期”等业务字段不属于本次入口删除范围，继续保留。
- 浏览器复查：
  - `/hr/employees?action=离职管理` 仍显示“新增离职事项”。
  - `/hr/employees?action=员工列表` 仍显示员工列表组织架构。
  - `/hr/employees?action=入职管理` 不再显示“入职管理”或“新增生命周期事项”，回落到员工列表组织架构。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 员工列表组织架构批注修复记录

- 针对 `/hr/employees?action=员工列表` 左侧树批注，员工列表左侧资源树已从“员工分组”调整为“组织架构”。
- 员工列表组织架构节点调整为：
  - 集团总部
  - 销售部
  - 研发部
  - 财务部
  - 仓储部
  - 人事部
- 员工列表筛选逻辑已从 `group/status` 口径调整为按员工 `party`（所属部门）匹配组织节点。
- `AwResourceTree` 保留原 `update:modelValue`，补充显式 `select` 事件，HR 列表页直接监听树节点选择，避免公共树选择回写不稳定。
- 浏览器快照复查：
  - `/hr/employees?action=员工列表` 不再出现“员工分组”。
  - `/hr/employees?action=员工列表` 出现“组织架构”“集团总部”“销售部”“研发部”。
  - 8 个 HR 二级列表入口未出现误用“员工分组”。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 岗位管理岗位编制入口删除记录

- 按用户指令“岗位管理-岗位编制 把岗位编制删除”，删除 `vue3/src/layouts/erp-shell/navigation.ts` 中人力中心「岗位管理 > 岗位管理」浮窗的“岗位编制”入口。
- 同步删除 `vue3/src/views/hr/hrResource.config.ts` 中岗位资源 `actions` 的“岗位编制”，并将岗位动作 profile 匹配收敛为仅匹配“岗位说明书”，避免导航之外仍可进入旧“新增岗位编制”动作页。
- “岗位编制”作为岗位业务数据字段和列表列仍保留，不属于本次动作入口删除范围。
- 浏览器复查：
  - `/hr/positions?action=岗位编制` 不再显示“岗位管理 / 岗位编制”或“新增岗位编制”。
  - 旧地址回落到岗位列表母版，左侧仍为“岗位序列”，工具栏显示“新增岗位”。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 岗位管理并入组织机构导航记录

- 按用户指令“把岗位管理变成组织机构的三级目录”，删除人力中心左侧二级导航中的独立 `hrPosition / 岗位管理` 入口。
- `vue3/src/layouts/erp-shell/navigation.ts` 中「组织机构」浮窗新增三级分组「岗位管理」，入口包括：
  - 新增岗位：`/hr/positions?action=new`
  - 岗位列表：`/hr/positions`
  - 岗位说明书：`/hr/positions?action=岗位说明书`
- 按用户指令合并“岗位设置”和“组织设置”两个三级设置分组：当前仅保留「组织设置」一个分组，并在其中合并组织设置与岗位设置入口；不再保留单独「岗位设置」分组标题。
- `getSideByPath` 增加 HR 岗位路径归属规则：访问 `/hr/positions`、岗位新增、岗位详情、岗位设置时，左侧二级高亮归属「组织机构」，避免岗位页面因二级入口删除而回落到工作台。
- 浏览器复查：
  - `/hr/positions?action=岗位列表` 页面仍可运行，显示岗位列表、岗位序列和新增岗位入口。
  - 左侧二级导航不再出现独立「岗位管理」。
  - `/hr/positions?action=岗位列表` 当前左侧高亮为「组织机构」。
- 验证：
  - `vue-tsc --noEmit` 未通过，阻塞来自本轮未触碰的设置中心 `src/app/api/settings/resources.ts` 字面量联合类型收窄问题：`NotificationRule.channel`、`SecurityRule.type`、`DataTaskRow.type`。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
## 组织机构浮窗删除组织设置记录

- 按用户指令“把组织机构的组织设置全部删掉，只保留组织机构和岗位管理”，删除 `vue3/src/layouts/erp-shell/navigation.ts` 中 `hrOrg.flyout` 的「组织设置」分组。
- 当前「组织机构」浮窗只保留两个三级分组：
  - 组织机构：新增组织、组织列表
  - 岗位管理：新增岗位、岗位列表、岗位说明书
- 本轮只删除导航浮窗入口，不删除已实现的设置页路由、mock/API adapter 或母版设置页面，避免影响后续如需恢复设置入口时的后端对接基础。
- 复查：
  - `navigation.ts` 中 `hrOrg.flyout` 不再包含 `title: '组织设置'`。
  - `navigation.ts` 中 `hrOrg.flyout` 不再包含组织/岗位自定义字段、编号、审批、策略、打印模板入口。
  - `/hr/positions?action=岗位列表` 仍可运行，左侧二级仍归属「组织机构」。
- 验证：
  - `vue-tsc --noEmit` 未通过，阻塞来自本轮未触碰的设置中心 `src/app/api/settings/resources.ts` 与 `src/views/settings/SettingsCenterPage.vue` 类型问题。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
## 组织列表与岗位列表分级母版调整记录

- 按用户指令“组织机构-组织列表和岗位列表的页面，样式采用客户管理-客户分组设置的页面，左侧是一级、右侧是二级”，新增 `vue3/src/views/hr/components/HrHierarchyListPage.vue`。
- 新页面复用客户分组设置同一套设置母版结构：
  - `AwSettingPage`
  - `AwSettingToolbar`
  - `AwSettingSplitPage`
  - `AwSettingTree`
  - `AwSettingListCard`
  - `AwSettingTable`
- `vue3/src/views/hr/HrResourcePage.vue` 增加组织/岗位列表分流：`/hr/orgs`、`/hr/orgs?action=组织列表`、`/hr/positions`、`/hr/positions?action=岗位列表` 使用分级母版；新增、详情、岗位说明书动作和其它 HR 模块仍走原分流。
- 组织列表分级规则：左侧为一级组织，右侧为该一级组织下的二级组织；字段来自 HR mock/API adapter 的组织记录。
- 岗位列表分级规则：左侧为一级岗位序列，右侧为该序列下的二级岗位；默认优先选中有数据的序列，避免右侧首屏空白。
- 浏览器复查：
  - `/hr/orgs` 已渲染为设置分栏母版，左侧“一级组织”，右侧显示“销售中心、研发中心”等二级组织，未出现旧 `AwListToolbar`。
  - `/hr/positions?action=岗位列表` 已渲染为设置分栏母版，左侧“一级岗位序列”，右侧显示“销售经理”等二级岗位，未出现旧 `AwListToolbar`。
  - 两个页面左侧二级导航均归属「组织机构」。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 薪酬方案类型项目层级页面记录

- 按用户指令完成薪酬管理中的“薪资方案、薪酬类型、薪酬项目”三类页面，业务层级调整为：薪资方案为顶层，薪酬类型归属方案，薪酬项目归属类型。
- 新增 `HrPayrollStructurePage.vue`，复用设置母版：
  - `AwSettingPage`
  - `AwSettingToolbar`
  - `AwSettingListCard`
  - `AwSettingTable`
  - `AwSettingModal`
- 页面分流：
  - `/hr/payroll?action=薪资方案`：无左侧分类，维护方案基础规则、适用组织、人群、计薪周期、状态等方案基础信息。
  - `/hr/payroll?action=薪酬类型`：无左侧分类，以表格“所属方案”字段维护固定薪酬、绩效提成、扣款项目等类型。
  - `/hr/payroll?action=薪酬项目`：无左侧分类，以表格“所属方案 / 所属类型”字段维护基本工资、岗位津贴、绩效工资、提成、考勤扣款、个税等项目。
- 新增 `vue3/src/mock/hr/payroll-structure.json`，提供销售、研发、职能三套拟真薪资方案，以及类型、项目、公式、计税、社保基数、会计科目等字段。
- `vue3/src/app/api/hr/resources.ts` 增加薪酬结构 mock/API adapter：
  - `GET /api/v1/hr-payroll/structure`
  - `PATCH /api/v1/hr-payroll/structure`
- 新增 `HrPayrollScheme`、`HrPayrollType`、`HrPayrollItem` 类型，后续待后端补充人力中心独立契约后可直接对接正式薪酬结构接口。
- 浏览器复查：
  - `/hr/payroll?action=薪资方案` 渲染为无分类设置表格，显示销售薪资方案、研发薪资方案、职能薪资方案。
  - `/hr/payroll?action=薪酬类型` 渲染为无分类设置表格，显示固定薪酬、绩效提成、扣款项目等方案内类型。
  - `/hr/payroll?action=薪酬项目` 渲染为无分类设置表格，显示基本工资、岗位津贴等类型内项目。
  - “新增薪酬项目”弹窗可打开，字段包含所属类型、收发方向、计税口径、社保基数、会计科目、计算方式、公式说明和状态。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## HR 横向回归修复记录

- 按用户批注“严格按照母版无分类的列表页实现，不要自己加戏”，二次收敛薪资方案、薪酬类型、薪酬项目三页：
  - `HrPayrollStructurePage.vue` 改为 `AwListPage + AwListToolbar + AwDataTable`。
  - 移除可见的 `AwSettingPage / AwSettingListCard / AwSettingTable` 结构、标题说明块和左侧分类树。
  - 操作列只保留“查看详情”。
  - 工具栏筛选、字段配置、导入、导出改为显式打开公共 `HrListDrawer`，避免可见按钮无交互。
- 按横向检查结果修复员工组织树同源性：
  - `HrListView.vue` 中员工列表左侧“组织架构”节点改为来自 `hr-orgs` mock/API adapter。
  - `HrActionList.vue` 中转正管理、离职管理左侧“组织架构”同样改为来自 `hr-orgs`，不再显示“流程状态”树。
- 按当前组织/岗位口径继续收敛导航和页面：
  - `HrHierarchyListPage.vue` 仅负责组织/部门二级维护，去掉岗位序列死分支和说明文案。
  - `/hr/positions?action=岗位列表` 与 `/hr/positions?action=岗位说明书` 继续走无分类列表母版。
  - 工作台不再显示独立“岗位管理”入口，岗位说明书入口归属组织机构。
  - `payroll.json` 中历史 `工资详情` 分组改回 `工资列表`，避免已删除入口残留。
- 浏览器横向断言已覆盖：
  - `/hr/employees?action=员工列表`：左树为“组织架构”，未出现“员工分组”。
  - `/hr/employees?action=转正管理`、`/hr/employees?action=离职管理`：左树为“组织架构”，未出现“流程状态”树。
  - `/hr/orgs`：左侧为“部门列表”，右侧显示销售一部、销售二部等分支部门。
  - `/hr/positions?action=岗位列表`、`/hr/positions?action=岗位说明书`：均为 `aw-list-layout-no-tree`，无 `aw-doc-tree` 和 `aw-setting-tree`。
  - `/hr/payroll?action=薪资方案`、`/hr/payroll?action=薪酬类型`、`/hr/payroll?action=薪酬项目`：均为无分类列表母版，无 `aw-setting-page / aw-setting-head / aw-setting-list-card`，操作列只显示“查看详情”。
  - HR 左侧导航不再出现独立“岗位管理”，页面正文不再出现“入职管理、异动管理、新增薪酬、薪酬详情、工资详情”旧入口文字。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 薪资方案字段删减记录

- 按浏览器批注“类型数、项目数字段删除”，调整 `HrPayrollStructurePage.vue`。
- `/hr/payroll?action=薪资方案` 列表页删除“类型数”“项目数”两列；`/hr/payroll?action=薪酬类型` 同步删除“项目数”计数字段。
- 薪酬结构 mock/API adapter 中方案、类型、项目的层级关系仍保留，后续可继续支撑详情和后端对接。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 工资列表组织架构与员工明细修复记录

- 按浏览器批注“工资列表左侧应为组织架构部门列表，右侧是员工列表，员工基本信息字段加上现有工资字段”，调整薪酬管理工资列表。
- `HrListView.vue` 中 `hr-payroll` 复用组织部门数据，左侧标题为“部门列表”，节点来自 `hr-orgs` mock/API adapter；已删除“全部部门”聚合节点，不再显示“薪酬分类”。
- `/hr/payroll?action=工资列表` 表格改为员工工资明细列：员工姓名、员工编号、所属部门、岗位/职级、手机号码、直属上级、薪资方案、应发工资、扣款合计、实发工资、薪资月份、核算状态、操作。
- 工资列表中的“薪资方案”单元格改为蓝色链接，点击进入 `/hr/payroll?action=薪资方案`，并带上当前方案名称 query，后续可继续接入方案自动定位或详情打开。
- `payroll.json` 从工资批次汇总 mock 改为员工维度工资明细 mock，补齐张园、李文涛、陈佳的部门、岗位、手机、直属上级、薪资方案、应发/扣款/实发和详情行数据。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。

## 档案列表口径校准记录

- 按用户要求检查档案管理“档案列表、合同档案、证件档案”三类列表内容是否对应，并修复混用数据。
- `/hr/archives?action=档案列表` 继续作为总表列表页，`archives.json` 扩展为公司合同、公司证照、培训档案、奖惩记录的混合档案数据；总表列名调整为“形成日期”“到期/复核日期”，避免只适用于合同的“签署日期”误导全部档案。
- `/hr/archives?action=合同档案` 拆为独立 action profile，并按用户纠偏改为公司常用合同档案，不再展示员工劳动合同子类；列为合同名称、合同编号、合同类型、签约主体、对方单位、签署日期、生效日期、到期日期、保管位置、负责人、合同状态。
- `/hr/archives?action=证件档案` 拆为独立 action profile，并按用户纠偏改为公司证照/资质档案，不再展示员工身份证、健康证、职业资格证等个人材料；列为证件名称、证件编号、证件类型、持有主体、发证机关、签发日期、到期日期、保管位置、负责人、证照状态。
- 按浏览器批注修复合同档案左侧树：从“合同状态”改为“合同分类”，分类虚拟为劳动合同、租赁合同、采购合同、销售合同、服务合同、外包合同、保密协议、框架合作协议；筛选依据改为“合同类型”列，合同状态只保留在表格状态列。
- `archives.json` 总档案 mock 同步调整为公司合同记录，示例包含年度劳动合同模板归档、办公场地租赁合同、办公设备采购合同、软件服务销售合同、物业服务合同等。
- 按用户要求调整档案管理浮窗导航，删除“新增档案”入口，仅保留“档案列表、合同档案、证件档案”。
- 按用户要求调整人事办公浮窗导航，删除“预约会议、会议列表、个人日程、团队日程”入口，通知协同仅保留“发布公告、公告列表”。
- 同步将证件档案左侧树抽象为“证件分类”，按“证件类型”列筛选，虚拟分类为营业执照、资质证书、行政许可证、安全环保许可、知识产权证书、税务银行资料；证照状态只保留在表格状态列。
- `archives.json` 总档案 mock 同步将“证件资料”调整为“公司证照”，示例改为营业执照、高新技术企业证书、安全生产标准化证书、软件著作权登记证书等公司档案资料。
- 为避免动作标题未刷新时回落到状态树，`HrActionList.vue` 的档案分类树判断从依赖 `profile.title` 改为识别列名 `合同类型 / 证件类型`，只要存在对应列就强制显示“合同分类 / 证件分类”。
- 验证：
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留既有 chunk 体积警告。
