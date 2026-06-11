# 人力与权限功能整理

整理日期：2026-06-12  
工程目录：`D:\work\cc\5.0\vue3`  
涉及范围：人力中心 `/hr/**`、设置中心权限管理 `/settings/permissions`

## 1. 总览

当前工程中，“人力”和“权限”是两条相对独立但存在业务关联的功能线：

- 人力中心负责员工、组织、岗位、考勤、排班、薪酬、档案、人事办公等人资业务。
- 权限管理位于设置中心，当前以“研发中心权限”为样例，支持岗位/角色、菜单、操作、字段、数据范围配置。
- 人力中心中也有若干权限相关展示，例如组织详情的“权限范围”、档案详情的“权限记录”、员工详情的“资产账号/ERP 账号随组织岗位同步权限”。

从工程实现看，人力中心已经形成“配置驱动 + 公共母版复用”的结构；权限管理则是设置中心内的一个专门页面分支，功能较集中但当前业务域偏研发，尚未和人力组织/岗位数据深度联动。

## 2. 入口与路由

### 2.1 人力中心导航

导航定义：`src/layouts/erp-shell/navigation.ts`

顶层中心：

```text
key: hr
label: 人力
route: /hr
status: pending
```

侧边栏入口：

| 菜单 | 路由 | 主要功能 |
| --- | --- | --- |
| 工作台 | `/hr` | 人力待办、业务导航、快捷入口、公告消息、最近访问 |
| 员工管理 | `/hr/employees` | 员工档案、入转调离、劳动合同 |
| 组织机构 | `/hr/orgs` | 组织列表、岗位列表、岗位说明书 |
| 岗位管理 | `/hr/positions` | 岗位、岗位说明书、岗位职责、编制 |
| 考勤管理 | `/hr/attendance` | 考勤记录、异常、补卡、请假、加班、月度锁定 |
| 排班管理 | `/hr/schedules` | 排班、班次、考勤组、考勤日历、冲突检测 |
| 薪酬管理 | `/hr/payroll` | 工资核算、发放、薪资方案、薪酬类型、薪酬项目 |
| 档案管理 | `/hr/archives` | 合同档案、证件档案、借阅、续签、到期提醒 |
| 人事办公 | `/hr/office` | 办公申请、公告、会议、证明、用印、物品领用 |

### 2.2 人力中心路由

路由定义：`src/app/router/index.ts`

| 路由 | 组件 | meta.title |
| --- | --- | --- |
| `/hr` | `views/hr/HrWorkbench.vue` | 人力中心 |
| `/hr/employees` | `views/hr/HrResourcePage.vue` | 员工管理 |
| `/hr/orgs` | `views/hr/HrResourcePage.vue` | 组织机构 |
| `/hr/positions` | `views/hr/HrResourcePage.vue` | 岗位管理 |
| `/hr/attendance` | `views/hr/HrResourcePage.vue` | 考勤管理 |
| `/hr/schedules` | `views/hr/HrResourcePage.vue` | 排班管理 |
| `/hr/payroll` | `views/hr/HrResourcePage.vue` | 薪酬管理 |
| `/hr/archives` | `views/hr/HrResourcePage.vue` | 档案管理 |
| `/hr/office` | `views/hr/HrResourcePage.vue` | 人事办公 |

`/hr/positions` 在侧边栏匹配上做了特殊处理：`getSideByPath()` 会把 `/hr/positions` 归到组织机构菜单下。

### 2.3 权限管理入口

导航定义：`src/layouts/erp-shell/navigation.ts`

```text
设置中心 -> 权限管理 -> /settings/permissions
```

路由定义：`src/app/router/index.ts`

```text
/settings/:section(system|permissions|security|data|integrations)
```

权限管理实际由 `src/views/settings/SettingsCenterPage.vue` 内部根据 `section = permissions` 渲染。

## 3. 人力中心工程结构

### 3.1 主入口

文件：`src/views/hr/HrResourcePage.vue`

该文件是人力中心业务页的总分发器，根据当前路由和 query 参数切换不同子页面：

| 条件 | 渲染组件 | 说明 |
| --- | --- | --- |
| `settingKey` 存在 | `HrSettingPage` | 自定义字段、编号、审批、策略、打印、分类 |
| 岗位说明书新增 | `HrJobDescriptionCreatePage` | 岗位说明书新增 |
| 发布公告 | `HrAnnouncementCreatePage` | 人事办公发布公告 |
| 办公申请新增 | `HrOfficeApplicationCreatePage` | 分步骤办公申请 |
| 普通新增 | `HrCreatePage` | 通用新增页 |
| 详情 | `HrDetailPage` | 通用详情页 |
| 薪资结构 | `HrPayrollStructurePage` | 薪资方案、薪酬类型、薪酬项目 |
| 动作清单 | `HrActionList` | 入职办理、转正管理、异常处理等动作列表 |
| 默认 | `HrListView` | 通用列表页 |

### 3.2 配置与资源

核心配置：`src/views/hr/hrResource.config.ts`

配置包含：

- `hrModuleConfigs`：八个人力模块的页面配置。
- `hrActionProfiles`：业务动作页的列表配置和 mock 行数据。
- `hrCodeCandidates`：人力编号规则候选项。
- `hrWorkbenchData`：人力工作台 KPI、业务导航、快捷入口、消息、最近访问。

核心 API adapter：`src/app/api/hr/resources.ts`

提供：

- `listHrRecords`
- `getHrRecord`
- `createHrRecord`
- `updateHrRecord`
- `submitHrRecord`
- `approveHrRecord`
- `disableHrRecord`
- `printHrRecord`
- `exportHrRecord`
- `batchHrAction`
- `listHrActionLogs`
- `getHrSettings`
- `saveHrSettings`
- `getHrPickerData`
- `getHrPayrollStructure`
- `saveHrPayrollStructure`

类型定义：`src/app/api/hr/types.ts`

核心类型：

- `HrResource`
- `HrModuleKey`
- `HrSettingKey`
- `HrRecord`
- `HrModuleConfig`
- `HrSettings`
- `HrActionProfile`
- `HrPayrollScheme`
- `HrPayrollType`
- `HrPayrollItem`

### 3.3 mock 数据

目录：`src/mock/hr`

| 文件 | 数量 | 样例 |
| --- | ---: | --- |
| `employees.json` | 3 | 张园 / 在职 |
| `orgs.json` | 5 | 销售一部 / 启用 |
| `positions.json` | 3 | 销售经理 / 启用 |
| `attendance.json` | 2 | 5月17日考勤异常 / 待审批 |
| `schedules.json` | 2 | 销售中心六月排班 / 已发布 |
| `payroll.json` | 3 | 张园 / 核算中 |
| `payroll-structure.json` | 3 | 薪资方案结构 |
| `archives.json` | 11 | 年度劳动合同模板归档 / 有效 |
| `office.json` | 2 | 在职证明开具 / 审批中 |
| `settings.json` | object | 人员选择器数据 |

## 4. 人力功能清单

### 4.1 人力工作台

文件：`src/views/hr/HrWorkbench.vue`

功能：

- 待办 KPI：
  - 待入职办理
  - 待审批人事单
  - 考勤异常
  - 薪酬待核算
  - 档案到期提醒
  - 组织编制缺口
- 业务导航：
  - 员工管理
  - 组织机构
  - 岗位说明书
  - 考勤管理
  - 薪酬管理
  - 人事办公
- 快捷入口：
  - 新增员工
  - 考勤处理
  - 薪酬核算
  - 档案到期
- 公告 / 消息中心。
- 最近访问。

现状：

- 使用 `WorkbenchKpi` 和 `WorkbenchTile`。
- 点击 KPI 和卡片会跳转到对应人力入口。
- 数据来自 `hrWorkbenchData`，目前是静态配置。

### 4.2 员工管理

入口：`/hr/employees`

配置位置：`hrModuleConfigs.employees`

列表字段：

- 员工姓名
- 员工编号
- 性别
- 手机号码
- 所属部门
- 岗位/职级
- 员工类型
- 直属上级
- 入职日期
- 计划转正日
- 合同类型
- 办公地点
- 员工状态

表单字段：

- 员工姓名
- 手机号码
- 所属部门
- 入职日期
- 转正日期
- 合同类型
- 办公地点

详情 Tab：

- 基础信息
- 员工生命周期
- 任职历史
- 合同证照
- 薪酬社保
- 培训绩效
- 资产账号
- 审批记录
- 操作记录

业务动作：

- 入职办理
- 转正管理
- 调岗管理
- 离职管理
- 生成劳动合同

已实现交互：

- 员工列表支持组织架构树筛选。
- 列表工具栏支持搜索、刷新、筛选、字段配置、导入、导出、新增。
- 批量提交、批量审批、批量停用会调用 `batchHrAction` 回写 mock 状态。
- 新增员工使用 `HrCreatePage`，支持部门/岗位联合选择、人员选择器、合同类型选择、联系人、银行卡、通信地址、附件、人事说明。
- 详情支持修改、提交、审批、打印、导出、停用。
- 转正管理和离职管理详情使用 `AwAuditActionModal` 做审核/确认动作。

### 4.3 组织机构

入口：`/hr/orgs`

配置位置：`hrModuleConfigs.orgs`

列表字段：

- 组织名称
- 组织编号
- 上级组织
- 组织类型
- 负责人
- 编制人数
- 在岗人数
- 空缺人数
- 成本中心
- 办公地点
- 创建日期
- 组织状态

表单字段：

- 组织名称
- 组织类型
- 上级组织
- 负责人
- 联系电话
- 办公地址
- 编制人数
- 成本中心
- 排序号

详情 Tab：

- 组织信息
- 组织图
- 编制与在岗
- 在岗人员
- 关联岗位
- 权限范围
- 组织变更
- 审批记录
- 操作记录

已实现交互：

- 组织列表使用资源树。
- 组织详情支持组织编制、岗位、人员、权限范围等 Tab 展示。
- 设置页的分类配置对组织机构有特殊数据：经营组织、职能组织、项目组织、销售中心、供应链中心、财务中心、人力行政、研发项目组等。

注意点：

- `HrHierarchyListPage.vue` 是一个组织/层级式列表组件，但当前 `HrResourcePage.vue` 没有直接分发到它。是否保留、接入或删除，需要后续确认。

### 4.4 岗位管理与岗位说明书

入口：`/hr/positions`

配置位置：`hrModuleConfigs.positions`

列表字段：

- 岗位名称
- 岗位编号
- 所属组织
- 岗位序列
- 岗位类型
- 岗位等级
- 直接上级
- 岗位编制
- 在岗人数
- 空缺人数
- 薪级范围
- 生效日期
- 岗位状态

表单字段：

- 岗位名称
- 岗位序列
- 所属组织
- 岗位等级
- 岗位编制
- 直接上级
- 任职资格
- 薪级范围
- 生效日期

详情 Tab：

- 岗位信息
- 岗位职责
- 任职资格
- 编制占用
- 任职人员
- 薪级范围
- 历史版本
- 审批记录
- 操作记录

岗位说明书详情特殊 Tab：

- 岗位说明
- 岗位职责
- 任职资格
- 薪级编制
- 操作记录

已实现动作：

- 岗位说明书
- 新增岗位说明书
- 岗位编制调整
- 岗位发布
- 复制岗位

已实现交互：

- `/hr/positions?action=岗位说明书` 会进入动作清单。
- `/hr/positions?action=新增岗位说明书` 会进入岗位说明书新增页。
- 岗位说明书详情会由 `HrDetailPage` 构造不同岗位场景，如销售经理、高级前端工程师、财务共享专员。

### 4.5 考勤管理

入口：`/hr/attendance`

配置位置：`hrModuleConfigs.attendance`

列表字段：

- 考勤人员
- 所属部门
- 班次
- 应出勤
- 实际出勤
- 异常类型
- 上班打卡
- 下班打卡
- 考勤日期
- 锁定状态
- 薪酬同步
- 处理状态

表单字段：

- 考勤人员
- 所属部门
- 考勤日期
- 班次
- 上班打卡
- 下班打卡
- 异常类型
- 处理方式
- 审批流程

详情 Tab：

- 考勤信息
- 假勤汇总
- 原始打卡
- 规则判定
- 打卡记录
- 假勤加班单
- 薪酬影响
- 审批记录
- 附件记录
- 操作记录

业务动作：

- 同步打卡
- 异常处理
- 补卡申请
- 请假管理
- 加班管理
- 月度锁定
- 同步薪酬

已实现交互：

- 考勤列表可按组织架构树筛选。
- 考勤异常、补卡、请假、加班、锁定、同步薪酬等通过 `HrActionList` 展示动作清单。
- 考勤详情中派生锁定状态、薪酬同步状态、所属部门等展示字段。

### 4.6 排班管理

入口：`/hr/schedules`

配置位置：`hrModuleConfigs.schedules`

列表字段：

- 排班主题
- 排班编号
- 考勤组
- 适用组织
- 适用人数
- 班次
- 工作时段
- 休息规则
- 排班周期
- 冲突数
- 排班日期
- 排班状态

表单字段：

- 排班主题
- 考勤组
- 适用人员
- 班次
- 排班周期
- 生效日期
- 失效日期
- 休息规则
- 审批流程

详情 Tab：

- 排班信息
- 班次日历
- 排班明细
- 适用人员
- 班次规则
- 换班调班
- 冲突校验
- 发布记录
- 审批记录
- 操作记录

业务动作：

- 生成排班
- 发布排班
- 撤回排班
- 复制上周排班
- 冲突检测
- 换班调班
- 班次管理
- 考勤组管理
- 考勤日历

已实现交互：

- 动作清单支持排班相关操作。
- 排班详情中派生适用组织、工作时间、周期、冲突数等字段。

### 4.7 薪酬管理

入口：`/hr/payroll`

配置位置：`hrModuleConfigs.payroll`

列表字段：

- 员工姓名
- 员工编号
- 工资单号
- 所属部门
- 岗位/职级
- 手机号码
- 直属上级
- 薪资方案
- 应发工资
- 扣款合计
- 实发工资
- 社保
- 公积金
- 个税
- 发薪账户
- 财务状态
- 薪资月份
- 核算状态

表单字段：

- 薪资月份
- 薪资方案
- 薪酬类型
- 适用人员
- 计薪周期
- 社保方案
- 个税规则
- 发放账户
- 复核人

详情 Tab：

- 薪酬信息
- 薪资核算明细
- 考勤扣款来源
- 社保个税
- 调整记录
- 工资条
- 发薪对接财务
- 审批记录
- 附件记录
- 操作记录

业务动作：

- 生成工资
- 重算工资
- 锁定工资
- 解锁工资
- 确认发放
- 生成付款单
- 同步财务
- 工资条发送
- 薪资方案
- 薪酬类型
- 薪酬项目

薪酬结构页：

文件：`src/views/hr/components/HrPayrollStructurePage.vue`

支持维护：

- 薪资方案
- 薪酬类型
- 薪酬项目

薪酬结构字段：

- 方案：方案名称、方案编码、适用范围、员工范围、计薪周期、币种、生效日期、负责人、状态。
- 类型：所属方案、收发方向、发放时点、负责人、计算口径、状态。
- 项目：所属类型、收发方向、计税口径、社保基数、会计科目、计算方式、公式说明、状态。

已实现交互：

- `/hr/payroll?action=薪资方案`
- `/hr/payroll?action=薪酬类型`
- `/hr/payroll?action=薪酬项目`
- 新增/编辑/查看弹窗。
- 保存到 `payrollStructureState` mock 状态。

### 4.8 档案管理

入口：`/hr/archives`

配置位置：`hrModuleConfigs.archives`

列表字段：

- 档案名称
- 档案编号
- 归属主体
- 档案类型
- 证件/合同编号
- 形成日期
- 到期/复核日期
- 保管位置
- 密级
- 借阅状态
- 提醒规则
- 归档日期
- 档案状态

表单字段：

- 档案名称
- 归属主体
- 档案类型
- 证件/合同编号
- 形成日期
- 到期/复核日期
- 保管位置
- 提醒规则
- 经办人

详情 Tab：

- 档案信息
- 合同证照
- 续签/到期
- 借阅记录
- 版本记录
- 权限记录
- 附件记录
- 操作记录

业务动作：

- 上传归档
- 借阅申请
- 归还登记
- 续签复核
- 到期提醒
- 批量下载
- 合同档案
- 证件档案

已实现交互：

- 合同档案和证件档案动作清单带分类树。
- 详情中支持权限记录展示。
- 详情中派生密级、借阅状态、到期提醒等字段。

### 4.9 人事办公

入口：`/hr/office`

配置位置：`hrModuleConfigs.office`

列表字段：

- 申请主题
- 申请单号
- 申请人
- 事项类型
- 所属部门
- 经办人
- 优先级
- 当前节点
- 办理时限
- 期望完成日期
- 申请日期
- 审批状态

表单字段：

- 申请主题
- 申请人
- 所属部门
- 事项类型
- 用途说明
- 期望完成日期
- 附件要求
- 审批流程
- 经办人

详情 Tab：

- 申请信息
- 审批记录
- 办理记录
- 办理流程
- 关联事项
- 附件记录
- 操作记录

办公事项类型：

- 证明开具
- 物品领用
- 用印申请
- 用车申请

已实现交互：

- `HrOfficeApplicationCreatePage.vue` 提供三步式办公申请：
  - 选择事项类型
  - 填写申请信息
  - 填写申请明细
- 支持事项类型差异字段。
- 支持附件和富文本说明。
- 保存草稿或提交审批后写入 `hr-office` mock。

## 5. 人力设置功能

入口形式：

```text
/hr/{module}?setting=categories
/hr/{module}?setting=fields
/hr/{module}?setting=numbers
/hr/{module}?setting=approvals
/hr/{module}?setting=strategies
/hr/{module}?setting=print
```

也支持从导航动作文案映射：

- 自定义字段 -> `fields`
- 自定义编号 -> `numbers`
- 审批设置 -> `approvals`
- 策略设置 -> `strategies`
- 打印模板 -> `print`
- 分类 -> `categories`

设置页组件：`src/views/hr/components/HrSettingPage.vue`

### 5.1 分类设置

公共组件：

- `AwSettingPage`
- `AwSettingToolbar`
- `AwSettingSplitPage`
- `AwSettingTree`
- `AwSettingListCard`
- `AwSettingTable`
- `AwSettingModal`

功能：

- 左侧一级分类树。
- 右侧下级分类列表。
- 新增组织分类。
- 新增/编辑/删除下级分类。
- 启用/停用开关。

### 5.2 自定义字段

公共组件：

- `AwFieldSettingPage`
- `AwSettingModal`

功能：

- 按 scope 展示字段。
- 新增/编辑字段。
- 删除字段。
- 切换启用。
- 切换必填。

字段数据由 `getHrSettings(config)` 根据当前模块 `formFields` 生成。

### 5.3 自定义编号

公共组件：

- `AwCodeRuleBuilder`

候选项：

- 前缀
- 年月日
- 年月
- 部门代码
- 4位流水
- 5位流水
- 自定义代码

默认规则：

- prefix 来自 `hr-xxx` resource。
- separator 为 `-`。
- selected 为 `date + serial4`。

### 5.4 审批设置

公共组件：

- `AwApprovalRuleEditor`
- `AwPersonPickerModal`

默认审批流程：

- 部门负责人审批
- 人力中心复核

审批方式：

- 依次审批
- 会签
- 或签

功能：

- 新增审批规则。
- 编辑审批规则。
- 删除审批规则。
- 新增/删除审批节点。
- 选择审批人员。
- 移除审批人员。
- 保存审批规则。

### 5.5 策略设置

公共组件：

- `AwStrategySettingPage`

默认策略分组：

- 基础策略
- 协同策略

策略项：

- 提交后触发审批。
- 保留操作记录。
- 组织/岗位一致性校验。
- 考勤薪酬联动。

### 5.6 打印模板

公共组件：

- `AwSettingListCard`
- `AwSettingTable`
- `AwSettingModal`

功能：

- 新增打印模板。
- 编辑打印模板。
- 删除打印模板。
- 启用/停用模板。

默认模板：

- 标准打印模板。
- 审批打印模板。

## 6. 权限管理功能

入口：`/settings/permissions`

主文件：`src/views/settings/SettingsCenterPage.vue`

数据文件：

- `src/mock/settings/permissions.json`
- `src/app/api/settings/types.ts`
- `src/app/api/settings/resources.ts`

### 6.1 权限数据模型

权限数据分为三类：

```ts
permissions: {
  roles: RoleRow[];
  functionPermissions: PermissionScopeRow[];
  dataPermissions: DataPermissionRow[];
}
```

#### 角色/岗位 RoleRow

字段：

- `id`
- `name`
- `center`
- `users`
- `menu`
- `data`
- `functionPolicy`
- `dataPolicy`
- `updated`
- `enabled`

当前 mock 角色：

- 研发管理员
- 研发主管
- 研发工程师
- 研发只读

#### 功能权限 PermissionScopeRow

字段：

- `role`
- `module`
- `menu`
- `page`
- `tabs`
- `fieldsView`
- `fieldsEdit`
- `view`
- `create`
- `edit`
- `delete`
- `import`
- `export`
- `approve`

当前 mock 示例：

- 研发主管 - 项目管理。
- 研发工程师 - BOM管理。
- 研发只读 - 文档库。

#### 数据权限 DataPermissionRow

字段：

- `name`
- `role`
- `center`
- `department`
- `region`
- `customerScope`
- `projectScope`
- `documentScope`
- `materialScope`
- `bomScope`
- `enabled`

当前 mock 示例：

- 研发全量数据。
- 本部门及下级研发数据。
- 本人参与项目数据。

### 6.2 权限管理页面结构

页面结构：

- 左侧岗位列表。
- 右侧当前岗位概览。
- 汇总卡片。
- 权限配置 Tab：
  - 菜单权限
  - 操作权限
  - 字段权限
  - 数据权限

左侧岗位列表功能：

- 搜索岗位。
- 新增岗位。
- 选择岗位。
- 展示启用/停用状态。

当前岗位操作：

- 编辑岗位。
- 复制岗位。
- 停用/启用岗位。
- 保存配置。

### 6.3 菜单权限

当前菜单范围写死为研发中心菜单：

- 文档库
- 项目管理
- 产品管理
- 物料管理
- 工序管理
- 工艺管理
- BOM管理

每个菜单有对应 Tab 选项，如：

- 文档库：文档列表、文档详情、分类设置、审批记录。
- 项目管理：项目列表、项目详情、项目成员、项目BOM、费用记录。
- BOM管理：BOM列表、BOM详情、替代料、版本记录。

功能：

- 为当前岗位打开/关闭某个菜单访问权限。
- 勾选菜单时，如果不存在功能权限记录，会自动创建一条默认 `PermissionScopeRow`。
- 关闭菜单时，会把该菜单对应功能权限的 `view` 设为 `false`，并清空 tabs。

### 6.4 操作权限

操作项：

- 查看
- 新增
- 编辑
- 删除
- 导入
- 导出
- 审批

每个操作项包含说明，例如：

- 查看：允许进入列表、详情和 Tab。
- 新增：允许新增业务记录。
- 审批：允许处理提交、审核、驳回。

功能：

- 基于当前岗位 + 当前菜单查找 `activeMenuPermission`。
- 切换操作权限会更新对应布尔字段。

### 6.5 字段权限

字段权限状态：

- 隐藏
- 只读
- 可编辑

字段来源：

- 当前菜单对应 `fieldsView` 与 `fieldsEdit`。
- 如果当前权限记录没有字段，会按默认研发字段补齐。

功能：

- `隐藏`：从 `fieldsView` 和 `fieldsEdit` 移除字段。
- `只读`：加入 `fieldsView`，从 `fieldsEdit` 移除。
- `可编辑`：同时加入 `fieldsView` 和 `fieldsEdit`。

### 6.6 数据权限

维度：

- 部门范围
- 区域范围
- 客户可见范围
- 项目范围
- 文档范围
- 产品 / 物料范围
- BOM 范围

可选范围示例：

- 部门范围：全部研发部门、本部门及下级、本人所在部门。
- 区域范围：全部区域、负责区域、本人负责区域。
- 客户范围：全部客户、负责客户及协作客户、项目关联客户。
- 项目范围：全部项目、本部门项目及下级项目、本人负责或参与项目。
- 文档范围：全部文档分类、本部门文档分类、本人创建 / 协作文档。
- 产品 / 物料范围：全部产品 / 物料、本部门维护产品 / 物料、本人维护产品 / 物料。
- BOM 范围：全部 BOM 与替代料、本部门项目 BOM、本人维护 BOM 与替代料。

功能：

- 如果当前岗位没有数据权限，页面会创建默认数据权限。
- 可直接在表单中修改各数据范围。
- 可打开“编辑规则”弹窗维护数据权限。

### 6.7 权限新增/保存逻辑

新增按钮根据当前 Tab 变化：

- 菜单权限 Tab：新增岗位。
- 操作/字段 Tab：新增权限项。
- 数据权限 Tab：新增数据权限。

保存方式：

- 页面调用 `saveSettingsCenterData(data)`。
- 当前 `resources.ts` 对 mock 和 remote 都是内存 clone 保存，还没有真实远程接口。

## 7. 人力与权限的关联点

当前已出现的关联：

- 人力员工详情中有“资产账号”Tab，展示 ERP 账号随组织岗位同步权限。
- 人力组织详情中有“权限范围”Tab，展示组织下级数据等权限概念。
- 人力档案详情中有“权限记录”Tab，展示档案查看/下载、借阅审批等权限记录。
- 人力设置自定义字段中有 `permissions` 字段结构，沿用公共字段权限人员配置能力。
- 权限管理角色当前叫“岗位列表”，但数据实际是研发角色，不直接来自 `/hr/positions`。

尚未真正打通的地方：

- 权限管理的岗位/角色没有读取人力岗位数据。
- 权限管理的数据范围没有读取人力组织树。
- 人力员工账号、组织岗位、权限角色之间没有正式接口契约。
- 权限中心目前只覆盖研发中心菜单，不覆盖人力中心菜单。

## 8. 已实现程度判断

### 8.1 人力中心

已实现程度较高：

- 入口完整。
- 八大模块配置完整。
- 列表、详情、新增、设置、动作清单均有母版支撑。
- mock API 支持增、改、提交、审批、停用、打印、导出、批量动作。
- 薪酬结构有独立维护页。
- 人事办公有独立三步新增流程。

主要不足：

- 数据仍为 mock，真实接口契约未固化。
- 部分组件存在“后续对接接口”提示。
- `HrHierarchyListPage.vue` 等组件未确认实际入口。
- 列表字段配置抽屉目前更多是展示型，字段显示变更未真正影响列表列。
- 导入/导出目前是提示和队列模拟。

### 8.2 权限管理

已实现程度中等：

- 角色、菜单、操作、字段、数据权限交互已具备。
- 权限配置会回写本地状态。
- 弹窗新增/编辑逻辑完整。

主要不足：

- 当前权限范围是研发中心样例，未覆盖人力中心。
- 角色命名为“岗位”，容易和人力“岗位管理”混淆。
- 菜单选项、Tab、字段选项在页面内硬编码。
- 数据权限维度偏研发项目/BOM，不适合直接复用到人力场景。
- 没有和人力组织、岗位、员工、账号生命周期联动。

## 9. 优化建议

### 9.1 人力中心优先优化项

1. 梳理并确认八大模块验收优先级：员工、组织、岗位、考勤、排班、薪酬、档案、办公。
2. 优先把员工、组织、岗位三类基础数据字段对齐，因为它们会影响考勤、薪酬、权限。
3. 确认 `/hr/positions` 在导航上归属“组织机构”是否符合用户验收预期。
4. 检查 `HrHierarchyListPage.vue` 是否需要接入组织机构视图，避免保留不可达实现。
5. 将导入、导出、字段配置抽屉的实际效果补齐，至少字段配置应能影响当前列表列显示。
6. 将人事办公新增页中的 `qc-create-*` class 命名改成人力语义，避免后续维护误判。
7. 为 `HrRecord` 的通用字段增加模块级 DTO 或 mapper，减少 `done/left/amount` 多义字段造成的理解成本。

### 9.2 权限管理优先优化项

1. 明确“岗位”是权限角色还是人力岗位；建议 UI 文案区分为“权限角色”或“授权岗位”。
2. 把研发中心硬编码菜单抽成配置，便于扩展到人力中心。
3. 新增人力中心权限配置范围：
   - 员工管理
   - 组织机构
   - 岗位管理
   - 考勤管理
   - 排班管理
   - 薪酬管理
   - 档案管理
   - 人事办公
4. 数据权限增加人力适用维度：
   - 组织范围
   - 岗位范围
   - 员工范围
   - 薪酬可见范围
   - 档案密级范围
   - 考勤组范围
   - 人事办公事项范围
5. 接入人力组织树和岗位数据，避免权限页面维护一套孤立的“岗位列表”。
6. 为员工入职/调岗/离职补充账号与权限联动流程：
   - 入职：开通账号、分配默认角色。
   - 调岗：调整组织、岗位、权限角色、数据范围。
   - 离职：禁用账号、回收权限、保留审计记录。

### 9.3 建议的人力权限联动模型

建议后续形成以下链路：

```text
员工 -> 任职组织 -> 岗位 -> 权限角色 -> 菜单/操作/字段权限 -> 数据范围
```

建议核心对象：

- 员工账号：绑定员工档案、登录账号、账号状态。
- 组织：提供部门/下级部门数据边界。
- 岗位：提供默认权限角色建议。
- 权限角色：提供菜单、操作、字段权限。
- 数据规则：提供组织、员工、薪酬、档案、考勤等数据可见范围。
- 审计日志：记录授权、变更、禁用、导出等动作。

## 10. 后续验收检查清单

### 10.1 人力中心

- 检查 `/hr` 工作台入口是否正常。
- 检查八大模块路由是否可访问。
- 检查列表字段是否完整、顺序是否符合验收要求。
- 检查组织树/分类树是否符合当前模块业务。
- 检查新增页字段、选择器、附件、富文本是否按母版。
- 检查详情页 Tab 是否可切换且内容对应。
- 检查设置页是否复用公共设置母版。
- 检查审批、提交、停用、批量动作是否有明确状态回写。
- 检查考勤到薪酬、员工到岗位、组织到编制的字段是否一致。

### 10.2 权限管理

- 检查 `/settings/permissions` 是否可访问。
- 检查角色列表新增、编辑、复制、启停。
- 检查菜单权限开关是否创建/关闭功能权限记录。
- 检查操作权限切换是否回写到 `PermissionScopeRow`。
- 检查字段权限隐藏/只读/可编辑三态是否正确维护 `fieldsView` 和 `fieldsEdit`。
- 检查数据权限各维度是否可编辑和保存。
- 检查权限保存后切换页面再返回是否仍保留。
- 检查是否需要扩展到人力中心菜单和组织岗位数据。

## 11. 涉及文件清单

### 人力中心

```text
src/views/hr/HrWorkbench.vue
src/views/hr/HrResourcePage.vue
src/views/hr/hrResource.config.ts
src/views/hr/components/HrListView.vue
src/views/hr/components/HrActionList.vue
src/views/hr/components/HrListDrawer.vue
src/views/hr/components/HrCreatePage.vue
src/views/hr/components/HrDetailPage.vue
src/views/hr/components/HrSettingPage.vue
src/views/hr/components/HrPayrollStructurePage.vue
src/views/hr/components/HrOfficeApplicationCreatePage.vue
src/views/hr/components/HrJobDescriptionCreatePage.vue
src/views/hr/components/HrAnnouncementCreatePage.vue
src/views/hr/components/HrHierarchyListPage.vue
src/app/api/hr/resources.ts
src/app/api/hr/types.ts
src/mock/hr/*.json
```

### 权限管理

```text
src/views/settings/SettingsCenterPage.vue
src/app/api/settings/resources.ts
src/app/api/settings/types.ts
src/mock/settings/permissions.json
src/mock/settings/data.json
src/layouts/erp-shell/navigation.ts
src/app/router/index.ts
```

## 12. 总体判断

人力中心已经具备较完整的页面骨架和业务覆盖，适合进入字段、交互、mock、接口契约的验收对齐阶段。权限管理目前交互框架可用，但业务范围偏研发示例；如果你的任务是“人力和权限优化”，建议优先做“人力组织/岗位/员工”和“权限角色/数据范围”的联动梳理，再扩展权限页面对人力中心菜单、字段和数据范围的支持。
