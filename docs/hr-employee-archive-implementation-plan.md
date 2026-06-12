# 5.0 人力中心员工档案功能设计与实施计划

更新时间：2026-06-12

## 一、背景与目标

根据旧系统“人力管理 - 员工管理 - 员工档案”功能，5.0 项目需要在人力中心的“档案管理”中新增“员工档案”功能。

本次不是重做旧页面，也不是只把旧系统列表搬过来，而是在 5.0 已有 Vue3 工程、公共母版和人力中心导航体系下，补齐员工档案的完整业务闭环：

- 员工档案列表
- 员工档案详情
- 员工档案编辑
- 员工个人资料、就职信息、经历信息、附件资料、劳动合同、领用资产的聚合展示
- 字段权限、操作权限、敏感字段展示控制的预留

## 二、旧系统员工档案功能盘点

旧系统实际运行入口：

```text
http://localhost:8095/User/Employee/Profile.html
```

用户指定源码路径：

```text
D:\work\cc\caikuangzi.fenluwebproject\trunk\Web\Web\v2\views\manpowerManage\staffManagement\staffRecord\index.html
D:\work\cc\caikuangzi.fenluwebproject\trunk\Web\Web\v2\views\manpowerManage\staffManagement\staffRecord\ProfileEdit.html
D:\work\cc\caikuangzi.fenluwebproject\trunk\Web\Web\v2\views\manpowerManage\staffManagement\staffRecord\Details.html
```

旧系统由三类页面组成：

| 页面 | 作用 | 旧系统入口 |
| --- | --- | --- |
| 员工档案列表 | 查询员工档案、进入详情/修改 | `Profile.html` / v2 `index.html` |
| 员工档案详情 | 只读展示完整员工档案和关联信息 | `Details.html?id=xxx` |
| 员工档案修改 | 编辑员工档案主体信息 | `ProfileEdit.html?id=xxx` |

### 2.1 列表页

查询条件：

- 员工姓名
- 手机号码
- 部门
- 工作状态
- 入职日期

列表字段：

- 姓名
- 性别
- 手机号
- 生日
- 最高学历
- 现住地址
- 身份证
- 工资卡号
- 操作

列表操作：

- 详情
- 修改
- 导出

旧接口：

```text
POST /api/HRM/Employee/GetPageList
POST /api/ResellerApp/CompanyDepartment/GetDeptTreeList
```

### 2.2 编辑页

编辑页是完整员工档案维护页，有右侧锚点导航。

编辑分区：

- 就职信息
- 个人信息
- 紧急联系人
- 教育经历
- 工作经历
- 项目经历
- 专业技能
- 其他荣誉

主要字段：

| 分区 | 字段 |
| --- | --- |
| 就职信息 | 工号、部门、岗位、直属上级、入职日期、试用期、转正日期、离职日期、在职状态、试用期薪资、转正薪资 |
| 个人信息 | 姓名、性别、出生日期、手机号、照片、证件类型、证件号码、现住地址、工资卡号、开户银行、民族、籍贯、从业时间、最高学历、微信号、邮箱、QQ号、婚姻状况、个人简介、证件照片 |
| 紧急联系人 | 姓名、手机号、亲友关系 |
| 教育经历 | 起止时间、教育等级、学校名称、专业名称、学校类型、招生类型、学历证书、学位证书 |
| 工作经历 | 起止时间、单位名称、职务描述、工作描述 |
| 项目经历 | 起止时间、项目名称、项目描述 |
| 专业技能 | 技能名称、技能等级 |
| 其他荣誉 | 荣誉名称、获得时间、荣誉描述、证书照片 |

旧接口：

```text
GET  /api/HRM/Employee/GetDetails/{id}
POST /api/HRM/Employee/Save
POST /api/HRM/Employee/GetNoResignedSimpleList
```

同时依赖部门树、岗位列表、上传接口。

### 2.3 详情页

详情页不是编辑页的简单只读版，它还额外聚合展示关联数据。

详情分区：

- 个人信息
- 就职信息
- 紧急联系人
- 教育经历
- 工作经历
- 项目经历
- 专业技能
- 其他荣誉
- 劳动合同
- 员工资料
- 领用资产

详情页额外数据：

| 分区 | 字段 |
| --- | --- |
| 劳动合同 | 合同版本、合同类型、开始时间、到期时间、合同附件 |
| 员工资料 | 附件列表 |
| 领用资产 | 资产编号、资产名称、规格型号、资产类型、资产状态、备注 |

旧接口：

```text
GET  /api/HRM/Employee/GetDetails/{id}
POST /api/HRM/Contract/GetEmployeeContractByUser
GET/POST getAssetList
```

## 三、5.0 功能定位

5.0 当前已有：

```text
/hr/archives
```

当前“档案管理”更偏公司级档案：

- 档案列表
- 合同档案
- 证件档案

员工档案与现有公司档案不是同一种业务对象。员工档案是“员工个人档案聚合”，应作为档案管理下的独立功能入口加入，而不是混入现有公司合同/证照档案列表。

建议导航结构：

```text
人力中心
└─ 档案管理
   ├─ 员工档案
   ├─ 档案列表
   ├─ 合同档案
   └─ 证件档案
```

推荐入口：

```text
/hr/archives?action=员工档案
```

详情入口：

```text
/hr/archives?action=员工档案&id={employeeArchiveId}
```

编辑入口：

```text
/hr/archives?action=员工档案编辑&id={employeeArchiveId}
```

说明：

- 不新增“人力中心”二级菜单。
- 不把员工档案放回“员工管理”下。
- 不影响现有“档案列表、合同档案、证件档案”的逻辑。
- “员工档案”作为档案管理下的独立 action 视图，由 `HrResourcePage.vue` 分流到专用页面。

## 四、页面设计

### 4.1 员工档案列表页

建议新建专用列表页：

```text
vue3/src/views/hr/components/HrEmployeeArchiveListPage.vue
```

母版：

- `AwListPage`
- `AwResourceTree`
- `AwListToolbar`
- `AwDataTable`
- `HrListDrawer`

左侧树：

- 标题：组织架构
- 数据来源：`hr-orgs` mock/API adapter
- 节点：部门列表
- 用于按部门筛选员工档案

工具栏：

- 刷新数据
- 筛选
- 字段配置
- 导入
- 导出

是否显示新增：

- 旧系统员工档案没有“新增员工档案”独立入口，员工档案来源于员工资料。
- 建议列表页不显示“新增员工档案”按钮。
- 如后续领导要求可以新增，则应跳转员工管理的“新增员工”或入职办理，而不是在档案模块孤立新增。

查询条件：

- 员工姓名
- 手机号码
- 部门
- 工作状态
- 入职日期开始
- 入职日期结束

列表字段：

| 字段 | 说明 |
| --- | --- |
| 姓名 | 可点击进入详情 |
| 性别 | 文本 |
| 手机号 | 敏感字段，受字段权限控制 |
| 生日 | 日期 |
| 最高学历 | 文本/字典 |
| 现住地址 | 敏感字段，受字段权限控制 |
| 身份证 | 敏感字段，受字段权限控制 |
| 工资卡号 | 敏感字段，受字段权限控制 |
| 在职状态 | 试用期、转正、离职 |
| 所属部门 | 5.0 建议补充，便于和左侧组织树对应 |
| 岗位 | 5.0 建议补充，便于人力业务识别 |
| 入职日期 | 5.0 建议补充 |
| 操作 | 查看、修改 |

批量动作：

- 导出
- 批量下载资料，预留

不建议保留：

- 批量审批
- 批量停用

原因：员工档案不是审批单据或启停对象，批量停用容易误导。

### 4.2 员工档案详情页

建议新建专用详情页：

```text
vue3/src/views/hr/components/HrEmployeeArchiveDetailPage.vue
```

母版：

- `AwDetailPage`
- `AwDetailToolbar`
- `AwDetailHeader`
- `AwDetailTabs`
- `AwDetailInfoGrid`
- `AwAttachmentTable`

顶部工具栏：

- 返回
- 修改
- 打印
- 导出

详情头部摘要：

- 员工姓名
- 员工工号
- 所属部门
- 岗位
- 在职状态
- 入职日期
- 手机号，按字段权限展示

详情 Tab 建议：

| Tab | 内容 |
| --- | --- |
| 个人信息 | 姓名、性别、出生日期、手机号、证件、地址、银行卡、民族、籍贯、学历、联系方式、个人简介、照片 |
| 就职信息 | 工号、部门、岗位、直属上级、入职日期、试用期、转正日期、离职日期、在职状态、薪资信息 |
| 紧急联系人 | 多行表格 |
| 教育经历 | 多行表格，含证书附件 |
| 工作经历 | 多行表格 |
| 项目经历 | 多行表格 |
| 专业技能 | 多行表格 |
| 其他荣誉 | 多行表格，含荣誉证书 |
| 劳动合同 | 合同版本、合同类型、开始时间、到期时间、合同附件 |
| 员工资料 | 员工附件资料 |
| 领用资产 | 资产编号、资产名称、规格型号、资产类型、资产状态、备注 |
| 操作记录 | 查看、修改、导出、打印等记录 |

注意：

- 详情页要展示劳动合同、员工资料、领用资产。
- 这些内容不是编辑页主体字段，不要误放进编辑表单。
- 薪资、身份证、工资卡号、证件照片等字段必须预留字段权限控制。

### 4.3 员工档案编辑页

建议新建专用编辑页：

```text
vue3/src/views/hr/components/HrEmployeeArchiveEditPage.vue
```

母版：

- `AwFormPage`
- `AwEditableSubTable`
- `AwAttachmentTable`
- `AwSearchTriggerInput`
- `AwPersonPickerModal`
- `AwOptionPickerModal`

编辑页分区：

- 就职信息
- 个人信息
- 紧急联系人
- 教育经历
- 工作经历
- 项目经历
- 专业技能
- 其他荣誉

建议交互：

- 顶部按钮：返回、保存
- 部门字段：使用组织/部门选择器
- 岗位字段：使用岗位选择器，选择部门后可过滤岗位
- 直属上级：使用人员选择器
- 照片、证件照片、学历证书、学位证书、荣誉证书：使用附件/上传组件
- 紧急联系人、教育经历、工作经历、项目经历、专业技能、其他荣誉：使用 `AwEditableSubTable`

必填校验：

| 字段 | 规则 |
| --- | --- |
| 部门 | 必填 |
| 入职日期 | 必填 |
| 姓名 | 必填 |
| 性别 | 必填 |
| 手机号 | 必填，校验手机号格式 |
| 证件号码 | 必填 |

保存逻辑：

- 保存员工档案主体信息。
- 保存后回到员工档案详情或列表，建议回详情页。
- 不在员工档案编辑页直接维护劳动合同和领用资产。

## 五、数据模型设计

建议新增专用类型，不继续用扁平的 `HrRecord` 硬塞。

文件：

```text
vue3/src/app/api/hr/types.ts
```

新增类型建议：

```ts
export interface HrEmployeeArchive {
  id: string;
  employeeId: string;
  workNo: string;
  name: string;
  sex: string;
  mobile: string;
  birthday: string;
  birthdayText?: string;
  departmentId: string;
  departmentName: string;
  departmentIds: string[];
  postId: string;
  postName: string;
  leader: string;
  leaderName: string;
  entryTime: string;
  entryTimeText?: string;
  dayOfTrial: number;
  regularTime: string;
  regularTimeText?: string;
  leaveTime: string;
  leaveTimeText?: string;
  workStatus: 0 | 1 | 2;
  workStatusText: string;
  trialSalary: number;
  salary: number;
  photo: string;
  cardType: string;
  idCard: string;
  nowAddress: string;
  bankAccountNo: string;
  bankBranch: string;
  nation: string;
  native: string;
  yearsOfWorkExperience: string;
  qualification: string;
  weichatCode: string;
  email: string;
  qqNumber: string;
  maritalStatus: string;
  personalProfile: string;
  idCardFrontImgPath: string;
  idCardReverseImgPath: string;
  emergencyContacts: HrEmergencyContact[];
  educationalBackgrounds: HrEducationExperience[];
  workExperiences: HrWorkExperience[];
  projectExperiences: HrProjectExperience[];
  personalSkills: HrPersonalSkill[];
  personalHonors: HrPersonalHonor[];
  contracts: HrEmployeeContract[];
  materials: HrEmployeeMaterial[];
  assets: HrEmployeeAsset[];
}
```

子类型：

- `HrEmergencyContact`
- `HrEducationExperience`
- `HrWorkExperience`
- `HrProjectExperience`
- `HrPersonalSkill`
- `HrPersonalHonor`
- `HrEmployeeContract`
- `HrEmployeeMaterial`
- `HrEmployeeAsset`

## 六、mock/API 设计

建议新增 mock：

```text
vue3/src/mock/hr/employee-archives.json
```

建议新增 API adapter：

```text
vue3/src/app/api/hr/resources.ts
```

新增方法：

```ts
listHrEmployeeArchives(query)
getHrEmployeeArchive(id)
updateHrEmployeeArchive(id, data)
exportHrEmployeeArchive(id)
printHrEmployeeArchive(id)
```

5.0 预留接口：

```text
GET   /api/v1/hr/employee-archives
GET   /api/v1/hr/employee-archives/{id}
PATCH /api/v1/hr/employee-archives/{id}
POST  /api/v1/hr/employee-archives/{id}/export
POST  /api/v1/hr/employee-archives/{id}/print
```

与旧系统接口映射：

| 旧系统接口 | 5.0 建议接口 | 说明 |
| --- | --- | --- |
| `POST /api/HRM/Employee/GetPageList` | `GET /api/v1/hr/employee-archives` | 列表分页 |
| `GET /api/HRM/Employee/GetDetails/{id}` | `GET /api/v1/hr/employee-archives/{id}` | 详情/编辑数据 |
| `POST /api/HRM/Employee/Save` | `PATCH /api/v1/hr/employee-archives/{id}` | 保存档案主体 |
| `POST /api/HRM/Contract/GetEmployeeContractByUser` | 可合并到详情或单独 `GET /contracts` | 劳动合同 |
| `getAssetList` | 可合并到详情或单独 `GET /assets` | 领用资产 |

## 七、路由与导航分流

### 7.1 导航

文件：

```text
vue3/src/layouts/erp-shell/navigation.ts
```

在“档案管理”浮窗中增加：

```text
员工档案 -> /hr/archives?action=员工档案
```

建议顺序：

```text
档案管理
├─ 员工档案
├─ 档案列表
├─ 合同档案
└─ 证件档案
```

### 7.2 页面分流

文件：

```text
vue3/src/views/hr/HrResourcePage.vue
```

新增判断：

- `moduleKey === 'archives' && actionLabel === '员工档案'`：进入员工档案列表页。
- `moduleKey === 'archives' && actionLabel === '员工档案' && recordId`：进入员工档案详情页。
- `moduleKey === 'archives' && actionLabel === '员工档案编辑' && recordId`：进入员工档案编辑页。

建议不要把员工档案放进 `getHrActionProfile('archives', action)`，因为员工档案不是简单 action profile 表格，而是独立的复杂档案业务。

## 八、权限设计

菜单权限：

- 人力中心 / 档案管理 / 员工档案

操作权限：

- 查看员工档案
- 修改员工档案
- 导出员工档案
- 打印员工档案
- 下载附件资料

字段权限：

敏感字段建议纳入字段权限：

- 手机号
- 证件号码
- 现住地址
- 工资卡号
- 开户银行
- 试用期薪资
- 转正薪资
- 证件照片
- 学历/学位证书
- 荣誉证书
- 合同附件

数据权限：

- 按部门范围控制可见员工档案。
- 普通主管只能查看本部门及下级部门员工档案。
- 人力管理员可查看全公司员工档案。
- 超级管理员不受限制。

## 九、实施步骤

### 第一步：补导航入口

修改：

```text
vue3/src/layouts/erp-shell/navigation.ts
```

目标：

- 档案管理浮窗增加“员工档案”。
- 不删除现有“档案列表、合同档案、证件档案”。
- 不新增人力二级菜单。

验收：

- 进入人力中心。
- 悬浮“档案管理”。
- 能看到“员工档案”入口。
- 点击进入 `/hr/archives?action=员工档案`。

### 第二步：补类型和 mock

修改：

```text
vue3/src/app/api/hr/types.ts
vue3/src/mock/hr/employee-archives.json
vue3/src/app/api/hr/resources.ts
```

目标：

- 新增员工档案专用类型。
- 新增 3-5 条完整 mock。
- mock 至少覆盖：
  - 一名试用期员工
  - 一名已转正员工
  - 一名离职员工
  - 一名有劳动合同和领用资产的员工
  - 一名缺少部分附件资料的员工

验收：

- JSON 解析通过。
- API adapter 可获取列表、详情、保存。

### 第三步：实现员工档案列表页

新增：

```text
vue3/src/views/hr/components/HrEmployeeArchiveListPage.vue
```

目标：

- 使用列表母版。
- 左侧组织架构树。
- 查询条件和列表字段对齐旧系统。
- 操作列包含“查看、修改”。
- 姓名点击进入详情。

验收：

- `/hr/archives?action=员工档案` 可访问。
- 左侧部门筛选有效。
- 搜索员工姓名、手机号有效。
- 查看、修改入口可点击。

### 第四步：实现员工档案详情页

新增：

```text
vue3/src/views/hr/components/HrEmployeeArchiveDetailPage.vue
```

目标：

- 使用详情母版。
- 顶部展示员工摘要。
- Tab 展示完整详情。
- 劳动合同、员工资料、领用资产只在详情展示。

验收：

- 详情页可从列表进入。
- Tab 可切换。
- 每个 Tab 有独立内容。
- 敏感字段有权限控制预留。

### 第五步：实现员工档案编辑页

新增：

```text
vue3/src/views/hr/components/HrEmployeeArchiveEditPage.vue
```

目标：

- 使用表单母版。
- 分区维护就职信息、个人信息和经历子表。
- 人员、部门、岗位选择使用公共选择器。
- 子表使用公共可编辑明细表。
- 保存回写 mock/API adapter。

验收：

- 从详情或列表修改进入编辑页。
- 必填校验有效。
- 添加/删除经历子表行有效。
- 保存后回到详情页并显示更新数据。

### 第六步：接入页面分流

修改：

```text
vue3/src/views/hr/HrResourcePage.vue
```

目标：

- 档案管理下 action 为“员工档案”时走专用页面。
- 不影响现有档案列表、合同档案、证件档案。

验收：

- `/hr/archives?action=员工档案` 显示员工档案列表。
- `/hr/archives?action=合同档案` 仍显示合同档案。
- `/hr/archives?action=证件档案` 仍显示证件档案。
- `/hr/archives` 原默认档案列表不变。

### 第七步：权限和字段显示预留

修改范围视现有权限能力而定：

```text
vue3/src/views/hr/components/HrEmployeeArchiveListPage.vue
vue3/src/views/hr/components/HrEmployeeArchiveDetailPage.vue
vue3/src/views/hr/components/HrEmployeeArchiveEditPage.vue
```

目标：

- 操作按钮按权限控制显示。
- 敏感字段统一走字段权限/脱敏方法。
- 后续可接入系统设置中的菜单权限、操作权限、字段权限、数据权限。

建议封装：

```ts
canViewEmployeeArchive
canEditEmployeeArchive
canExportEmployeeArchive
maskSensitiveField(fieldKey, value)
```

验收：

- 无权限时不显示修改/导出。
- 敏感字段可脱敏展示。
- 不把权限逻辑写散到模板里。

### 第八步：验证

至少执行：

```powershell
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vue-tsc\bin\vue-tsc.js --noEmit
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vite\bin\vite.js build
```

浏览器验收入口：

```text
http://127.0.0.1:5173/hr/archives?action=员工档案
http://127.0.0.1:5173/hr/archives?action=员工档案&id={mockId}
http://127.0.0.1:5173/hr/archives?action=员工档案编辑&id={mockId}
```

## 十、文件改动清单

建议改动：

```text
vue3/src/layouts/erp-shell/navigation.ts
vue3/src/views/hr/HrResourcePage.vue
vue3/src/views/hr/components/HrEmployeeArchiveListPage.vue
vue3/src/views/hr/components/HrEmployeeArchiveDetailPage.vue
vue3/src/views/hr/components/HrEmployeeArchiveEditPage.vue
vue3/src/app/api/hr/types.ts
vue3/src/app/api/hr/resources.ts
vue3/src/mock/hr/employee-archives.json
```

不建议改动：

```text
vue3/src/components/list-page/*
vue3/src/components/detail-page/*
vue3/src/components/form-page/*
```

除非发现公共母版本身存在通用缺陷，否则不要为了员工档案单独修改公共组件。

## 十一、验收清单

- [ ] 人力中心“档案管理”浮窗中出现“员工档案”入口。
- [ ] `/hr/archives?action=员工档案` 可访问。
- [ ] 员工档案列表字段包含旧系统字段，并补充部门、岗位、入职日期、在职状态。
- [ ] 列表支持按部门、姓名、手机号、工作状态、入职日期筛选。
- [ ] 列表操作列包含查看、修改。
- [ ] 详情页包含个人信息、就职信息、紧急联系人、教育经历、工作经历、项目经历、专业技能、其他荣誉、劳动合同、员工资料、领用资产、操作记录。
- [ ] 编辑页包含就职信息、个人信息、紧急联系人、教育经历、工作经历、项目经历、专业技能、其他荣誉。
- [ ] 编辑页不维护劳动合同和领用资产。
- [ ] 部门、岗位、直属上级使用公共选择器，不用普通输入框假装选择。
- [ ] 子表使用公共可编辑明细表。
- [ ] 附件资料使用公共附件/上传组件。
- [ ] 手机号、身份证、工资卡号、住址、薪资、证件照片等敏感字段有字段权限或脱敏预留。
- [ ] 不影响现有档案列表、合同档案、证件档案。
- [ ] `vue-tsc --noEmit` 能通过，或说明剩余阻塞不是本次新增功能造成。
- [ ] `vite build` 能通过。

## 十二、风险与注意事项

1. 旧系统 v2 源码和实际菜单页面存在差异。
   - 实际菜单运行的是 `User/Employee/Profile.html`。
   - 用户指定分析源码在 v2 `staffRecord` 目录。
   - 5.0 设计应以用户指定 v2 源码为主，同时参考实际运行页面校正表现。

2. 工作状态选项存在差异。
   - v2 列表中包含：全部、试用期、转正。
   - 实际运行页面包含：全部、试用期、转正、离职。
   - 5.0 建议保留离职，因为编辑页和详情页都有离职日期、离职状态。

3. 员工档案和公司档案不能混用。
   - 现有 `/hr/archives` 是公司合同/证照/培训/奖惩等档案。
   - 员工档案是员工个人资料聚合，应使用专用页面。

4. 详情页比编辑页内容多。
   - 劳动合同、员工资料、领用资产只在详情聚合展示。
   - 不要把这些关联信息塞进员工档案编辑页。

5. 字段权限必须提前设计。
   - 员工档案包含大量敏感字段。
   - 如果先不做权限控制，也要在代码结构上预留统一脱敏/权限判断入口。

## 十三、给主控的启动话术

```text
请按 docs/hr-employee-archive-implementation-plan.md 实施 5.0 人力中心“档案管理 - 员工档案”功能。

要求：
1. 不要只做列表页，必须完整实现员工档案列表、详情、编辑三类页面。
2. 功能入口放在人力中心 / 档案管理下，新增“员工档案”，不要新增人力二级菜单，也不要放回员工管理。
3. 现有 /hr/archives 的档案列表、合同档案、证件档案不能被破坏。
4. 员工档案是复杂业务页面，不要用 getHrActionProfile 的简单 action 表格硬凑，新增专用 HrEmployeeArchiveListPage、HrEmployeeArchiveDetailPage、HrEmployeeArchiveEditPage。
5. 列表页复用 AwListPage、AwResourceTree、AwListToolbar、AwDataTable；详情页复用 AwDetailPage、AwDetailToolbar、AwDetailHeader、AwDetailTabs、AwDetailInfoGrid；编辑页复用 AwFormPage、AwEditableSubTable、AwAttachmentTable、公共人员/部门/岗位选择器。
6. 详情页必须包含劳动合同、员工资料、领用资产；编辑页只维护员工档案主体和经历类子表，不维护劳动合同和领用资产。
7. 手机号、身份证、工资卡号、住址、薪资、证件照片等敏感字段要预留字段权限/脱敏处理。
8. 完成后检查 /hr/archives?action=员工档案、详情、编辑三个入口，并运行 vue-tsc 和 vite build；如类型检查被既有问题阻塞，说明阻塞文件和本次改动是否相关。
```
