# 人力管理模块功能分析

整理日期：2026-06-12  
本地访问地址：`http://localhost:8095/`  
源码目录：`D:\work\cc\caikuangzi.fenluwebproject\trunk\Web\Web\v2\views\manpowerManage`  
目标工程目录：`D:\work\cc\5.0\vue3`

## 1. 访问结论

本地站点首页会跳转到登录页：

```text
http://localhost:8095/login.html#no-back
```

登录页可见内容包括：

- 系统标题：分路链式工业互联网平台
- 输入框：用户名、密码
- 按钮：登录

直接访问人力模块子页面：

```text
http://localhost:8095/v2/views/manpowerManage/staffManagement/tab_index.html
```

页面没有跳回登录页，但未能独立完整渲染。控制台报错显示旧页面依赖顶层框架上下文：

```text
TypeError: appContext.menu.tabItems is not a function
ReferenceError: getRootWindow is not defined
```

因此，本次分析以源码为主要依据，实际访问结果用于确认：该模块必须在旧系统主框架、登录态、`appContext`、菜单权限上下文齐全时运行，不能像普通静态页面一样单独打开。

## 2. 模块总览

旧系统 `manpowerManage` 不是单一“人力资源”页面，而是一个完整的人力行政管理中心，包含以下功能域：

| 功能域 | 目录 | 主要能力 |
| --- | --- | --- |
| 员工管理 | `staffManagement` | 员工信息、员工档案、离职员工、入职登记、离职登记、导入员工、同步考勤机 |
| 组织管理 | `organization` | 组织管理、组织类型、岗位管理、部门岗位关联 |
| 账号与权限 | `accountPermissions` | 登录账号、扫码注册、系统权限、账号权限、批量授权、超级管理员 |
| 考勤管理 | `attendanceManagement` | 考勤记录、考勤设置、考勤统计、班次管理、考勤机设置、地图打卡范围 |
| 薪资管理 | `salaryManagement` | 薪资规则、规则审批、计算公式、员工薪资、结算申请、结算复核、待支付、已支付 |
| 合同管理 | `contracManagement` | 员工合同、合同模板、历史合同、合同附件 |
| 资产管理 | `assetsManagement` | 固定资产、资产交接、资产类型、资产导入、报废/交接记录 |
| 办公用品 | `officeSupplies` | 用品列表、库位、采购、入库、领用、库存流水、审批 |
| 人事审批 | `personnelApproval` | 审批规则、审批人、审批方式、适用表单 |

从功能边界看，旧模块覆盖了“人、组织、岗位、账号、权限、考勤、薪资、合同、资产、办公用品、审批”的全链路。其中账号权限不是独立设置中心，而是直接包含在人力管理模块内。

## 3. 页面结构

旧模块大量使用 `tab_index.html` 作为一级容器，通过 `iframe-tab` 加载子页面。一级 Tab 与源码对应如下：

| 一级模块 | 容器页面 | Tab |
| --- | --- | --- |
| 员工管理 | `staffManagement/tab_index.html` | 员工信息、员工档案、离职员工 |
| 组织管理 | `organization/tab_index.html` | 组织管理、组织类型、岗位管理 |
| 账号权限 | `accountPermissions/permissionSetting/tab_index.html` | 系统权限、账号权限、批量设置、设置超级管理员 |
| 资产管理 | `assetsManagement/tab_index.html` | 固定资产、资产交接、资产类型 |
| 合同管理 | `contracManagement/tab_index.html` | 员工合同、合同模板、历史合同 |
| 薪资支付 | `salaryManagement/salaryPay.html` | 待支付薪资、已支付薪资、薪资结算复核、薪资结算申请 |
| 薪资设置 | `salaryManagement/salarySettings.html` | 薪资规则设置、薪资规则审批、薪资计算公式、员工薪资 |
| 办公用品 | `officeSupplies/index.html` | 办公用品、用品库位、用品采购、用品入库、用品领用、库存流水 |

这些 Tab 不是在页面里固定写死为最终可见菜单，而是通过：

```js
appContext.menu.tabItems(...)
```

根据当前系统菜单和权限动态返回。因此 Vue3 迁移时要特别注意：Tab 展示受菜单权限影响，不能只按静态注释里的 Tab 名称判断最终可见范围。

## 4. 员工管理

### 4.1 员工信息

源码入口：

```text
staffManagement/staffInfo/index.html
staffManagement/staffInfo/create_edit.html
staffManagement/staffInfo/dimission_register.html
staffManagement/staffInfo/staff_info_edit_log.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Employee/GetNoResignedPageList` | 在职员工分页列表 |
| `/api/HRM/Employee/SaveNewEmployee` | 单个员工入职保存 |
| `/api/HRM/Employee/SaveNewEmployees` | 批量导入员工 |
| `/api/HRM/Employee/GetImportTemplate` | 下载导入模板 |
| `/api/HRM/Employee/Resign` | 员工离职登记 |
| `/api/HRM/Employee/GetLogList` | 员工信息修改记录 |
| `/api/DeLi/DeLi/DeliUserUpdate` | 同步员工到考勤机 |
| `/api/DeLi/DeLi/UpdateDeliUserExtId` | 同步考勤机扩展账号 |

列表能力：

- 按员工姓名、部门筛选。
- 显示部门岗位、员工编号、姓名、性别、手机号、在职状态等信息。
- 支持员工入职登记。
- 支持导入员工信息。
- 支持同步员工到考勤机。
- 支持查看或打开员工信息修改记录。
- 支持离职登记。

入职登记字段：

- 部门，级联选择。
- 岗位，依赖部门选择后加载。
- 员工资料上传。
- 员工姓名、性别、手机号、身份证等基础信息。
- 入职状态、转正日期等人事字段。

导入逻辑重点：

- Excel 导入会校验姓名、部门、性别、手机号、在职状态、转正日期。
- 部门必须匹配系统已有部门路径。
- 导入时会组装部门、岗位、账号状态等字段。

### 4.2 员工档案

源码入口：

```text
staffManagement/staffRecord/index.html
staffManagement/staffRecord/ProfileEdit.html
staffManagement/staffRecord/Details.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Employee/GetPageList` | 员工档案分页 |
| `/api/HRM/Employee/Save` | 保存完整员工档案 |

功能判断：

- 员工档案比员工信息更偏完整人事资料。
- `ProfileEdit.html` 文件较大，承担完整档案编辑。
- 档案字段包含员工工号、部门、岗位、姓名等，并扩展更多个人资料、工作资料、合同/附件类信息。

### 4.3 离职员工

源码入口：

```text
staffManagement/staffDimission/index.html
staffManagement/staffDimission/dimission_register.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Employee/GetResignedPageList` | 离职员工列表 |
| `/api/HRM/Employee/CancelResign/{id}` | 取消离职 |
| `/api/HRM/Employee/Delete/{id}` | 删除员工信息 |
| `/api/HRM/Employee/BatchDelete` | 批量删除 |
| `/api/HRM/Employee/GetEnableResignProof` | 获取是否启用离职证明 |
| `/api/HRM/Asset/GetList` | 离职时查询员工资产 |

功能判断：

- 离职不是简单改状态，会关联员工资产。
- 支持取消离职、删除离职员工、批量删除。
- 离职登记弹窗会选择离职员工，并保存离职信息。

## 5. 组织与岗位

### 5.1 组织管理

源码入口：

```text
organization/organizationManage/index.html
organization/organizationManage/create_edit.html
organization/organizationManage/post_setting.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/ResellerApp/CompanyDepartment/GetDeptTreeList` | 组织树 |
| `/api/ResellerApp/CompanyDepartment/CompanyDepartmentInsert` | 新增/编辑组织 |
| `/api/ResellerApp/CompanyDepartment/CompanyDepartmentDelete/{id}` | 删除组织 |
| `/api/HRM/Organize/GetDeptPostList?deptId=` | 获取部门岗位 |
| `/api/HRM/Organize/SaveDeptPost` | 保存部门岗位 |
| `/api/HRM/Employee/GetNoResignedSimpleList` | 获取在职员工 |
| `/api/HRM/Dic/GetKeyValues?fieldname=DeptType` | 组织类型字典 |

功能能力：

- 组织以树形结构管理。
- 支持新增、编辑、删除组织。
- 支持父级部门、部门负责人、组织类型等字段。
- 支持部门关联岗位。
- 支持同步钉钉/得力部门类外部组织数据。

### 5.2 组织类型

源码入口：

```text
organization/organizationType/index.html
organization/organizationType/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Dic/GetKeyValues?fieldname=DeptType` | 组织类型列表 |
| `/api/HRM/Dic/SaveDeptTypeKeyValue` | 保存组织类型 |
| `/api/HRM/Dic/DeleteDeptTypeKeyValue/{id}` | 删除组织类型 |

功能能力：

- 维护组织分类字典。
- 供组织新增/编辑页面选择组织类型。

### 5.3 岗位管理

源码入口：

```text
organization/postManage/index.html
organization/postManage/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Organize/GetPostPageList` | 岗位分页列表 |
| `/api/HRM/Organize/SavePost` | 保存岗位 |
| `/api/HRM/Organize/DeletePost/{id}` | 删除岗位 |
| `/api/HRM/Organize/GetRequirements?postId=` | 获取岗位任职要求 |

功能能力：

- 岗位列表、岗位新增/编辑、删除。
- 岗位详情里包含岗位职责或任职要求类信息。
- 岗位与组织存在关联配置，用于员工入职、权限、审批、薪资规则等下游功能。

## 6. 账号与权限

账号与权限位于：

```text
accountPermissions
```

该功能域是本模块中与权限直接相关的核心部分，包含登录账号管理、扫码注册、系统权限、账号权限、批量授权、超级管理员。

### 6.1 登录账号

源码入口：

```text
accountPermissions/loginAccount/index.html
accountPermissions/loginAccount/create_edit.html
accountPermissions/loginAccount/relevancy_company.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/ResellerApp/SuperManagement/GetCompanyAccountPageList` | 员工账号分页 |
| `/api/ResellerApp/SuperManagement/AddcompanyAccount` | 新增账号 |
| `/api/ResellerApp/SuperManagement/UpdateCompanyAccountPWD` | 重置密码 |
| `/api/ResellerApp/SuperManagement/FrozenCompanyAccount` | 冻结/启用账号 |
| `/api/Common/Account/AddCompanyAccountRelation` | 关联企业 |
| `/api/Common/Account/DeleteCompanyAccountRelation` | 删除企业关联 |
| `/api/ResellerApp/SuperManagement/GetCompanyByAccountId/{id}` | 获取账号关联企业 |
| `/api/HRM/Company/GetList` | 企业列表 |

列表字段：

- 账号
- 姓名
- 性别
- 手机号
- 身份证
- 状态
- 已关联的企业
- 创建时间
- 操作

账号新增字段：

- 登录账号
- 登录密码
- 姓名
- 英文名
- 性别
- 联系电话
- 类型：新增/原有

操作能力：

- 新增账号。
- 冻结账号。
- 启用账号。
- 重置密码，默认提示重置为 `123456`。
- 关联企业。
- 取消关联企业。

### 6.2 扫码注册

源码入口：

```text
accountPermissions/scanRegister/index.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Company/GetWxQrCodeForRegister` | 获取微信扫码注册地址 |
| `/api/HRM/Company/GetWxQrCodeForRegister?hours=` | 按有效时长生成二维码 |

功能能力：

- 通过二维码进行账号注册。
- 支持设置二维码有效小时数。
- 页面结构复用了员工账号列表的一部分账号操作能力。

### 6.3 系统权限

源码入口：

```text
accountPermissions/permissionSetting/OpenSystemPermission.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Role/SaveAuthorized` | 保存系统授权 |
| `/api/HRM/Role/DeleteAuthorized/{id}` | 删除单个授权 |
| `/api/HRM/Role/DeleteAllAuthorized` | 批量删除授权 |

页面结构：

- 左侧是系统/功能树。
- 右侧是已授权账号表格。
- 表格字段包括账号、姓名、部门、手机号、操作权限、删除。
- 支持选择账号加入授权。
- 支持删除已授权账号。
- 支持批量取消授权。

功能判断：

- 这是按“系统功能菜单”开通账号访问资格的入口。
- 它更接近“菜单级授权”或“功能开通”，不是字段权限或数据权限。

### 6.4 账号权限

源码入口：

```text
accountPermissions/permissionSetting/SetAccountPermission.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Role/SaveAccountPermissions` | 保存账号权限 |

页面结构：

- 左侧为部门账号树。
- 右侧为菜单权限树。
- 右侧表格显示已开通权限明细。
- 表格字段：应用系统、功能菜单、操作按钮。
- 支持搜索账号。
- 支持搜索系统功能。
- 支持勾选菜单权限。
- 支持保存账号权限。
- 支持“复制他人权限”。

功能判断：

- 这是按账号维度维护菜单与按钮权限。
- 权限粒度至少包含“应用系统、功能菜单、操作按钮”。
- 权限来源与组织员工强关联：左侧账号树来自部门/员工账号结构。

### 6.5 批量设置

源码入口：

```text
accountPermissions/permissionSetting/BatchSetPermission.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Role/SaveBatchPermissions` | 批量保存权限 |

功能判断：

- 用于对多个账号批量分配或覆盖权限。
- 页面结构与账号权限类似，同样围绕账号树、菜单树、按钮权限明细。
- 适合新部门、新岗位、新员工批量开通系统菜单。

### 6.6 超级管理员

源码入口：

```text
accountPermissions/permissionSetting/SetSuperAdministrator.html
accountPermissions/permissionSetting/SetSuperAdministrator copy.html
accountPermissions/permissionSetting/set_super_popup.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Role/GetAdminAccount` | 超级管理员列表 |
| `/api/HRM/Role/SetAdminAccount` | 设置/取消超级管理员 |
| `/api/HRM/Employee/GetNoResignedAccountList` | 可选账号 |

列表字段：

- 用户账号
- 用户姓名
- 部门岗位
- 操作

功能能力：

- 查询当前管理员账号。
- 选择在职账号设置为管理员。
- 取消管理员权限。

### 6.7 权限模型判断

旧人力管理模块的权限模型可以概括为：

| 权限层级 | 旧页面体现 |
| --- | --- |
| 登录账号 | 员工账号、扫码注册 |
| 企业关系 | 账号关联企业、取消关联企业 |
| 系统开通 | 系统权限 |
| 菜单权限 | 账号权限、批量设置 |
| 按钮权限 | 权限明细表中的操作按钮 |
| 超级管理员 | 设置超级管理员 |

未在旧源码中看到独立的字段权限、数据范围权限页面。若 Vue3 当前权限页包含字段权限、数据权限，需要视为新版增强能力，而不是旧人力管理模块已有完整能力。

## 7. 考勤管理

考勤管理源码位于：

```text
attendanceManagement
```

### 7.1 考勤记录

源码入口：

```text
attendanceManagement/attendanceInfo/index.html
attendanceManagement/attendanceInfo/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Attendance/GetEmployeePunchSummary` | 员工打卡汇总 |
| `/api/HRM/Attendance/ImportPunchRecord` | 导入打卡记录 |
| `/api/HRM/Attendance/GetCheckInSettingList` | 获取考勤设置 |
| `/api/DeLi/DeLi/QueryDeliAttendance` | 查询得力考勤 |

功能能力：

- 员工考勤列表。
- 导入考勤。
- 拉取得力考勤数据。
- 根据考勤设置展示或计算员工打卡汇总。
- 支持发起薪资分配相关动作。

### 7.2 考勤设置

源码入口：

```text
attendanceManagement/attendanceSet/index.html
attendanceManagement/attendanceSet/create_edit.html
attendanceManagement/attendanceSet/create_edit_popup.html
attendanceManagement/attendanceSet/attendanceSettings.html
attendanceManagement/attendanceSet/Map.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Attendance/GetCheckInSettingList` | 考勤设置列表 |
| `/api/HRM/Attendance/AddCheckInSetting` | 新增考勤设置 |
| `/api/HRM/Attendance/DeleteCheckInSetting?id=` | 删除考勤设置 |
| `/api/HRM/Attendance/SetCheckInSettingInfo` | 给员工设置考勤 |
| `/api/HRM/Attendance/GetDepartmentUesr` | 获取部门员工 |
| `/api/DeLi/DeLi/GetCompanyKey` | 获取考勤机企业 Key |
| `/api/DeLi/DeLi/DeliAttendanceInit` | 初始化得力考勤 |

功能能力：

- 考勤名称、工作日、打卡地址、班次配置。
- 地图选点，使用腾讯地图脚本。
- 支持给部门/员工分配考勤设置。
- 支持考勤机初始化配置。

### 7.3 班次管理

源码入口：

```text
attendanceManagement/shiftManagement/index.html
attendanceManagement/shiftManagement/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Attendance/GetCompanyShift` | 班次列表 |
| `/api/HRM/Attendance/AddCompanyShift` | 保存班次 |
| `/api/HRM/Attendance/DeleteCompanyShift/{id}` | 删除班次 |

班次字段：

- 班次名称
- 上班时间
- 下班时间
- 是否跨天
- 开始休息时间
- 结束休息时间
- 打卡要求：不要求打卡、要求打上班卡、要求打下班卡、上下班都打卡、上班或下班打一次即可

### 7.4 考勤统计

源码入口：

```text
attendanceManagement/attendanceStatistics/index.html
attendanceManagement/attendanceStatistics/detail.html
attendanceManagement/attendanceStatistics/details.html
```

统计字段：

- 用户姓名
- 考勤天数
- 正常考勤
- 迟到考勤
- 早退考勤
- 旷工考勤
- 补卡考勤
- 加班考勤
- 请假考勤
- 出差考勤

详情字段：

- 打卡时间
- 打卡类型
- 打卡状态
- 打卡地址
- 打卡距离
- 请假类型
- 开始时间
- 结束时间
- 请假时长
- 审核状态
- 备注

## 8. 薪资管理

薪资管理源码位于：

```text
salaryManagement
```

### 8.1 薪资设置

源码入口：

```text
salaryManagement/salarySettings.html
salaryManagement/salaryRulesSet/index.html
salaryManagement/salaryRulesSet/create_edit.html
salaryManagement/salaryRulesApprove/index.html
salaryManagement/salaryFormula/index.html
salaryManagement/employeeSalary/index.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Salary/GetRulePageList` | 薪资规则列表 |
| `/api/HRM/Salary/SaveRule` | 保存薪资规则 |
| `/api/HRM/Salary/SubmitRule/{id}` | 提交薪资规则 |
| `/api/HRM/Salary/DeleteRule/{id}` | 删除薪资规则 |
| `/api/HRM/Salary/StopRule` | 停用薪资规则 |
| `/api/HRM/Salary/GetApproveRulePageList` | 薪资规则审批列表 |
| `/api/HRM/Salary/ApprovedRule` | 审批通过薪资规则 |
| `/api/HRM/Salary/RefuseRule` | 驳回薪资规则 |
| `/api/HRM/Salary/GetFormulaPageList` | 公式列表 |
| `/api/HRM/Salary/SaveFormula` | 保存公式 |
| `/api/HRM/Salary/DeleteFormula/{id}` | 删除公式 |
| `/api/HRM/Salary/GetEmployeeWithSalaryRules` | 员工薪资规则 |

功能能力：

- 薪资规则设置。
- 薪资规则提交审批。
- 薪资规则审批通过/驳回。
- 薪资计算公式维护。
- 设置预置公式。
- 员工薪资规则维护。
- 停用员工薪资规则。

薪资规则依赖：

- 员工/部门组织树。
- 薪资公式。
- 生产阶段数据。
- 审批规则。

### 8.2 薪资支付

源码入口：

```text
salaryManagement/salaryPay.html
salaryManagement/salarySettlementApply/index.html
salaryManagement/salarySettlementReview/index.html
salaryManagement/salaryUnpay/index.html
salaryManagement/salaryPaid/index.html
salaryManagement/salaryPaid/detail.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Salary/GetCompanyDepartmentNoSalary` | 未生成薪资的部门 |
| `/api/HRM/Salary/CalcEmployeeSalary` | 计算员工薪资 |
| `/api/ResellerApp/CompanySalary/CompanySalaryAdd` | 新增薪资结算 |
| `/api/ResellerApp/CompanySalary/CompanySalaryAddApply` | 发起薪资结算申请 |
| `/api/ResellerApp/CompanySalary/CompanySalaryAwaitApprovalList` | 待审批薪资 |
| `/api/ResellerApp/CompanySalary/CompanySalaryApproval` | 薪资审批通过 |
| `/api/ResellerApp/CompanySalary/CompanySalaryReject` | 薪资驳回 |
| `/api/ResellerApp/CompanySalary/GetCompanySalaryApprovedList` | 待支付薪资 |
| `/api/ResellerApp/CompanySalary/CompanySalaryAlreadyPaid` | 已支付薪资 |
| `/api/ResellerApp/CompanySalary/CompanySalaryDistribute` | 发放/分配薪资 |
| `/api/ResellerApp/CompanySalary/CompanySalaryDetail/{id}` | 薪资详情 |

功能流程：

1. 按部门筛选未结算薪资。
2. 计算员工薪资。
3. 生成薪资结算单。
4. 提交结算申请。
5. 审批或驳回。
6. 进入待支付。
7. 支付后进入已支付。
8. 可查看薪资详情。

## 9. 合同管理

合同管理源码位于：

```text
contracManagement
```

### 9.1 员工合同

源码入口：

```text
contracManagement/employeeContrac/index.html
contracManagement/employeeContrac/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Contract/GetEmployeeContractPageList` | 员工合同列表 |
| `/api/HRM/Contract/Save` | 保存员工合同 |
| `/api/HRM/Employee/GetNoResignedSimpleList` | 选择签订员工 |
| `/api/HRM/Contract/GetTemplateList` | 合同模板 |

字段：

- 签订员工
- 合同模板
- 开始时间
- 到期时间
- 合同附件

### 9.2 合同模板

源码入口：

```text
contracManagement/contractTemplate/index.html
contracManagement/contractTemplate/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Contract/GetTemplatePageList` | 模板列表 |
| `/api/HRM/Contract/SaveTemplate` | 保存模板 |
| `/api/HRM/Contract/DeleteTemplate/{id}` | 删除模板 |

字段：

- 模板版本
- 合同类型：劳动合同、劳务合同、无固定期限合同
- 模板描述
- 合同模板附件

### 9.3 历史合同

源码入口：

```text
contracManagement/historyContrac/index.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Contract/GetPageList` | 历史合同列表 |

字段：

- 员工 Id
- 员工姓名
- 合同名称
- 合同编号
- 合同类型
- 开始时间
- 到期时间

## 10. 资产管理

资产管理源码位于：

```text
assetsManagement
```

### 10.1 固定资产

源码入口：

```text
assetsManagement/fixedAssets/index.html
assetsManagement/fixedAssets/create_edit.html
assetsManagement/fixedAssets/import.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Asset/GetPageList` | 固定资产列表 |
| `/api/HRM/Asset/Save` | 保存资产 |
| `/api/HRM/Asset/Delete/{id}` | 删除资产 |
| `/api/HRM/Asset/Import` | 导入资产 |
| `/api/HRM/Employee/GetNoResignedSimpleList` | 选择使用人 |
| `/api/HRM/Asset/GetTypeList` | 资产类型 |

功能能力：

- 固定资产新增、编辑、删除。
- 固定资产导入。
- 资产归属员工。
- 资产状态管理。

### 10.2 资产交接

源码入口：

```text
assetsManagement/assetHandover/index.html
assetsManagement/assetHandover/create_edit.html
assetsManagement/assetHandover/handover_log.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Asset/GetHandoverPageList` | 资产交接列表 |
| `/api/HRM/Asset/SaveHandover` | 保存资产交接 |
| `/api/HRM/Asset/DeleteHandover/{id}` | 删除交接记录 |
| `/api/HRM/Asset/GetHandoverListByAssetId` | 资产交接日志 |

字段：

- 交接资产/报废资产
- 交接时间/报废时间
- 交出人
- 接收人
- 资产状态
- 交接描述/报废描述

功能判断：

- 离职流程会查询员工资产，因此资产交接与员工离职有关联。
- 资产状态包括使用中、闲置、待报废、已报废。

### 10.3 资产类型

源码入口：

```text
assetsManagement/assetType/index.html
assetsManagement/assetType/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Asset/GetTypePageList` | 资产类型列表 |
| `/api/HRM/Asset/SaveType` | 保存资产类型 |
| `/api/HRM/Asset/deleteType/{id}` | 删除资产类型 |

## 11. 办公用品

源码入口：

```text
officeSupplies
```

页面包括：

- 办公用品列表：`supplies_tab.html`
- 用品库位：`location_tab.html`
- 用品采购：`purchase_tab.html`
- 用品入库：`rk_purchase.html`
- 用品领用：`use_tab.html`
- 库存流水：`log_tab.html`
- 新增/编辑用品：`addEdit_supplies.html`
- 新增/编辑库位：`addEdit_location.html`
- 新增采购：`add_purchase.html`
- 新增领用：`add_use.html`

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/OfficeSupplies/GetPageList` | 办公用品列表 |
| `/api/HRM/OfficeSupplies/Save` | 保存办公用品 |
| `/api/HRM/OfficeSupplies/Delete/{id}` | 删除用品 |
| `/api/HRM/OfficeSupplies/GetWarehousePageList` | 库位列表 |
| `/api/HRM/OfficeSupplies/SaveWarehouse` | 保存库位 |
| `/api/HRM/OfficeSupplies/DeleteWarehouse/{id}` | 删除库位 |
| `/api/HRM/OfficeSupplies/GetPurchasePageList` | 采购列表 |
| `/api/HRM/OfficeSupplies/SavePurchase` | 保存采购 |
| `/api/HRM/OfficeSupplies/StorePurchase` | 采购入库 |
| `/api/HRM/Officesupplies/ApprovePurchase` | 审批采购 |
| `/api/HRM/OfficeSupplies/GetUsePageList` | 领用列表 |
| `/api/HRM/OfficeSupplies/SaveUse` | 保存领用 |
| `/api/HRM/OfficeSupplies/ApproveUse` | 审批领用 |
| `/api/HRM/OfficeSupplies/CancelUse/{id}` | 取消领用 |
| `/api/HRM/OfficeSupplies/GetInventoryPageList` | 库存流水 |
| `/api/HRM/OfficeSupplies/GetWarningList` | 库存预警 |

用品字段：

- 用品名称
- 规格型号
- 品牌
- 最小单位
- 库存数量
- 预警数量

库位字段：

- 库位名称
- 负责人
- 库位描述

流程判断：

- 用品基础资料维护。
- 采购申请与审批。
- 采购入库。
- 员工领用申请与审批。
- 库存流水与库存预警。

## 12. 人事审批

源码入口：

```text
personnelApproval/approverSetting/index.html
personnelApproval/approverSetting/create_edit.html
```

主要接口：

| 接口 | 用途 |
| --- | --- |
| `/api/HRM/Approval/GetRulesPageList` | 审批规则列表 |
| `/api/HRM/Approval/SaveRule` | 保存审批规则 |
| `/api/HRM/Approval/DeleteRule/{id}` | 删除审批规则 |
| `/api/HRM/Approval/GetApplyFormList` | 申请表单列表 |
| `/api/HRM/Employee/GetNoResignedSimpleList` | 员工列表 |
| `/api/ResellerApp/CompanyDepartment/GetDeptTreeList` | 部门树 |

审批方式：

- 指定人员审批。
- 部门负责人逐级审批。
- 指定部门审批，该部门任一人审批即可。

功能能力：

- 设置审批规则名称、适用表单、审批节点。
- 选择审批员工或部门。
- 依据员工所属部门查找上级部门负责人。
- 删除审批规则。

该功能与薪资规则、用品采购/领用、离职等流程存在潜在关联，属于人力模块内部的通用审批能力。

## 13. 与 Vue3 当前人力中心的差异

当前 Vue3 工程的人力中心入口位于：

```text
/hr
/hr/employees
/hr/orgs
/hr/positions
/hr/attendance
/hr/schedules
/hr/payroll
/hr/archives
/hr/office
```

Vue3 当前实现更偏“公共母版 + 配置驱动”：

- `HrWorkbench.vue`
- `HrResourcePage.vue`
- `HrListView.vue`
- `HrCreatePage.vue`
- `HrDetailPage.vue`
- `HrSettingPage.vue`
- `hrResource.config.ts`
- `src/app/api/hr/resources.ts`
- `src/app/api/hr/types.ts`
- `src/mock/hr/*.json`

与旧 `manpowerManage` 对比：

| 旧模块能力 | Vue3 当前对应 | 差异判断 |
| --- | --- | --- |
| 员工信息、员工档案、离职员工 | `/hr/employees`、`/hr/archives` | Vue3 已有骨架，但旧模块有更细的入职、导入、离职、同步考勤机逻辑 |
| 组织管理、组织类型、岗位管理 | `/hr/orgs`、`/hr/positions` | Vue3 已有组织/岗位，但旧模块包含部门岗位关联、组织类型字典 |
| 账号权限 | 当前主要在 `/settings/permissions` | 旧模块权限在人力内，Vue3 当前权限在设置中心，需决定是否迁回人力或保留设置中心入口 |
| 考勤记录、考勤设置、班次、统计 | `/hr/attendance`、`/hr/schedules` | Vue3 有考勤/排班骨架，旧模块有考勤机、地图、打卡范围、统计明细 |
| 薪资规则、公式、结算、支付 | `/hr/payroll` | Vue3 有薪酬骨架，旧模块流程更完整 |
| 员工合同、合同模板、历史合同 | `/hr/archives` 或待扩展合同页 | Vue3 当前档案可承接，但合同模板和历史合同需补足 |
| 资产管理 | Vue3 当前员工详情/档案中有资产展示倾向 | 旧模块有独立固定资产、交接、类型、导入，Vue3 需要确认是否纳入人力 |
| 办公用品 | `/hr/office` | Vue3 有人事办公，旧模块办公用品流程更完整 |
| 人事审批 | `/hr/**?setting=approvals` 或设置母版 | Vue3 有审批设置母版，旧模块有人力专属审批规则 |

## 14. 优化建议

### 14.1 菜单与入口

建议 Vue3 人力中心按旧模块补齐二级功能：

| 建议入口 | 承接旧功能 |
| --- | --- |
| `/hr/employees` | 员工信息、入职登记、员工导入、离职登记、离职员工 |
| `/hr/archives` | 员工档案、档案编辑、员工合同、历史合同 |
| `/hr/orgs` | 组织管理、组织类型、部门岗位关联 |
| `/hr/positions` | 岗位管理、岗位职责、任职要求 |
| `/hr/permissions` 或 `/settings/permissions?scope=hr` | 登录账号、系统权限、账号权限、批量授权、超级管理员 |
| `/hr/attendance` | 考勤记录、导入考勤、考勤机同步 |
| `/hr/schedules` | 考勤设置、班次、地图打卡范围、员工分配考勤 |
| `/hr/payroll` | 薪资规则、公式、员工薪资、结算、审核、支付 |
| `/hr/assets` | 固定资产、资产交接、资产类型 |
| `/hr/office` | 办公用品、库位、采购、入库、领用、库存流水 |
| `/hr/approvals` 或设置页 | 人事审批规则 |

如果不新增路由，也应在现有 `/hr/office`、`/hr/archives`、`/hr/payroll` 内通过 action 或 tab 承接这些子功能。

### 14.2 权限设置

旧模块权限能力应拆成以下 Vue3 配置项：

- 账号管理：账号创建、冻结、启用、重置密码、关联企业。
- 系统权限：账号是否开通某个应用系统或功能模块。
- 菜单权限：菜单树勾选。
- 按钮权限：新增、修改、删除、导入、导出、审批等按钮级权限。
- 批量授权：按部门、岗位、多个账号批量授权。
- 复制权限：从已有账号复制权限到目标账号。
- 超级管理员：管理员账号列表、添加、移除。

当前 Vue3 `/settings/permissions` 已有菜单权限、操作权限、字段权限、数据权限等新版能力，但旧人力模块的核心是“账号 + 菜单 + 按钮 + 管理员”。建议不要直接用研发中心样例权限覆盖人力权限，应补充人力中心专属菜单树和账号/组织数据来源。

### 14.3 与组织岗位联动

旧模块的人力权限以组织和账号为基础，Vue3 优化时应优先打通：

- 员工入职后生成或关联登录账号。
- 员工选择部门岗位后，可继承岗位默认权限。
- 调岗后提示是否同步权限。
- 离职后冻结账号、回收权限、检查资产。
- 批量授权支持按部门/岗位选人。
- 超级管理员只能从在职且有账号的员工中选择。

### 14.4 与审批联动

旧模块人事审批规则可服务多个功能：

- 员工离职审批。
- 薪资规则审批。
- 薪资结算审批。
- 办公用品采购审批。
- 办公用品领用审批。

Vue3 中如果统一使用 `AwApprovalRuleEditor`，应确保规则支持：

- 指定人员审批。
- 部门负责人逐级审批。
- 指定部门任一人审批。
- 适用表单或业务单据选择。

### 14.5 与外部系统联动

旧源码中存在外部系统集成：

- 得力考勤：员工同步、考勤同步、企业 Key、考勤初始化。
- 腾讯地图：考勤地点选择。
- 微信扫码注册：生成注册二维码。

Vue3 当前若只做静态 mock，需要在文档或接口契约中标记这些能力为“待接入外部服务”。

## 15. 验收检查清单

后续做人力和权限优化时，建议按以下清单验收：

- 人力模块是否包含员工、组织、岗位、账号权限、考勤、薪资、合同、资产、办公用品、审批。
- 员工管理是否支持入职、导入、离职、离职员工、修改记录。
- 员工入职时部门与岗位是否联动。
- 组织是否支持树形结构、组织类型、部门岗位关联。
- 权限是否支持账号、菜单、按钮、批量授权、复制权限、超级管理员。
- 权限数据是否接入人力组织树和员工账号，而不是研发中心静态菜单。
- 考勤是否区分考勤记录、考勤设置、班次、统计。
- 考勤设置是否支持地图地点和员工分配。
- 薪资是否包含规则、审批、公式、员工薪资、结算申请、复核、待支付、已支付。
- 合同是否包含员工合同、合同模板、历史合同、附件。
- 资产是否包含固定资产、资产交接、资产类型、导入。
- 离职流程是否检查资产、账号冻结和权限回收。
- 办公用品是否包含基础资料、库位、采购、入库、领用、库存流水和审批。
- 所有列表页是否复用 Vue3 公共列表母版。
- 所有新增/编辑页是否复用 Vue3 表单母版。
- 所有设置页是否优先复用 Vue3 设置母版。

## 16. 总体判断

旧 `manpowerManage` 模块是一个“人力行政 + 账号权限”的完整业务中心，其中权限设置是人力模块内部的重要组成部分。它不只是当前 Vue3 `/hr` 下员工、组织、考勤、薪资的简化集合，还包含账号生命周期、菜单/按钮授权、超级管理员、合同、资产、办公用品和人事审批。

如果你的任务是“优化人力和权限”，建议优先处理两条主线：

1. 人力主数据链路：组织、岗位、员工、账号、离职、资产。
2. 权限授权链路：账号、组织树、菜单权限、按钮权限、批量授权、超级管理员。

这两条链路打通后，考勤、薪资、合同、办公用品和审批才能比较自然地落到 Vue3 当前母版体系里。
