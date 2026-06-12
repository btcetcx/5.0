# 系统设置权限与账号授权优化实施计划

## 1. 背景与目标

本次优化范围限定在 5.0 的系统设置模块内，权限设置和用户账号相关能力都继续放在系统设置中，不迁移到人力模块。

当前 5.0 已具备一套角色权限设计，包括菜单权限、操作权限、字段权限、数据权限。该设计方向保留，不推翻重做。本次重点是把旧系统“账号权限”模块中的账号授权能力补入 5.0，并保持 Vue3 工程的技术栈、页面风格、公共母版和现有设置页体验一致。

目标：

- 保留 5.0 现有角色及权限设置能力。
- 在系统设置中新增账号授权能力。
- 对齐旧系统账号权限的 4 个页签能力。
- 不新增人力模块权限入口。
- 不引入旧系统 iframe、Layui 页面结构或旧样式。
- 使用 5.0 已有 Vue3 组件、mock、types、resources 组织数据。

## 2. 旧系统功能确认

旧系统真实入口：

- `D:\work\cc\caikuangzi.fenluwebproject\trunk\Web\Web\User\Role\Index.html`

旧系统页面包含 4 个页签：

| 页签 | 源码 | 主要功能 |
| --- | --- | --- |
| 系统权限 | `User\Role\OpenSystemPermission.html` | 根据系统菜单/按钮查询已授权账号，并给选中菜单按钮新增授权账号、删除单个授权、删除所有授权 |
| 账号权限 | `User\Role\SetAccountPermission.html` | 根据账号查询和设置该账号拥有的菜单/按钮权限，支持复制他人权限、保存 |
| 批量设置 | `User\Role\BatchSetPermission.html` | 批量选择账号、批量选择菜单/按钮权限后保存授权，支持复制他人权限 |
| 设置超级管理员 | `User\Role\SetSuperAdministrator.html` | 查询超级管理员、新增超级管理员、删除超级管理员权限 |

旧系统关键接口：

| 能力 | 旧接口或方法 |
| --- | --- |
| 获取组织账号树 | `getOrgTreeListContainAccount` |
| 获取在职账号列表 | `getNoResignedAccountList` |
| 获取菜单按钮树 | `getMenuTreeList` |
| 获取不含按钮的菜单树 | `getMenuTreeListNoButton` |
| 按功能查授权账号 | `getAuthorizedAccounts` |
| 按账号查按钮权限 | `getAccountButtonPermissions` |
| 获取菜单按钮 | `getButtonList` |
| 保存按功能授权账号 | `/api/HRM/Role/SaveAuthorized` |
| 删除单个功能授权 | `/api/HRM/Role/DeleteAuthorized/{id}` |
| 删除功能全部授权 | `/api/HRM/Role/DeleteAllAuthorized` |
| 保存账号权限 | `/api/HRM/Role/SaveAccountPermissions` |
| 保存批量权限 | `/api/HRM/Role/SaveBatchPermissions` |
| 查询超级管理员 | `/api/HRM/Role/GetAdminAccount` |
| 设置超级管理员 | `/api/HRM/Role/SetAdminAccount` |

## 3. 5.0 功能定位

系统设置入口保持不变：

- `/settings/permissions`

建议在现有“权限管理”页面内增加一级切换：

- 角色权限
- 账号授权

角色权限继续保留当前 5.0 的 4 类权限：

- 菜单权限
- 操作权限
- 字段权限
- 数据权限

账号授权新增旧系统 4 类能力：

- 按功能授权账号
- 按账号设置权限
- 批量授权
- 超级管理员

说明：

- 旧系统“系统权限”建议在 5.0 中命名为“按功能授权账号”，含义更直观。
- 如果领导要求完全沿用旧系统叫法，可改回“系统权限”。
- 旧系统是菜单按钮授权模型，5.0 中应归入“账号授权”域，不替代角色权限模型。

## 4. 页面结构设计

### 4.1 权限管理总结构

页面：`vue3/src/views/settings/SettingsCenterPage.vue`

建议结构：

```text
系统设置 / 权限管理

一级页签：
1. 角色权限
   - 左侧：角色/岗位列表
   - 右侧：角色概览
   - 内部页签：菜单权限 / 操作权限 / 字段权限 / 数据权限

2. 账号授权
   - 内部页签：按功能授权账号 / 按账号设置权限 / 批量授权 / 超级管理员
```

### 4.2 角色权限

保留现有功能，后续只做必要文案和数据优化：

- 角色列表
- 新增角色
- 编辑角色
- 复制角色
- 启用/停用角色
- 保存配置
- 菜单权限设置
- 操作权限设置
- 字段权限三态设置
- 数据权限设置

第一阶段不改变角色权限的主体交互，避免扩大风险。

### 4.3 账号授权：按功能授权账号

对齐旧系统“系统权限”。

页面布局建议：

- 左侧：系统/模块/菜单树
- 右侧：选中功能的已授权账号列表
- 顶部操作：
  - 搜索系统功能
  - 新增授权
  - 删除所有授权

列表字段：

- 账号
- 姓名
- 部门
- 手机号
- 操作权限
- 操作

新增授权弹窗：

- 当前授权功能标题
- 操作按钮多选
- 账号树多选
- 已选账号列表
- 保存/取消

交互规则：

- 必须先选择功能菜单，才允许新增授权。
- 如果该菜单存在按钮，则必须选择至少一个操作按钮。
- 必须选择至少一个账号。
- 删除单个授权需要确认。
- 删除所有授权需要确认。

### 4.4 账号授权：按账号设置权限

对齐旧系统“账号权限”。

页面布局建议：

- 左侧：组织账号树
- 右侧：该账号已开通权限
- 右侧上方：
  - 搜索系统功能
  - 复制他人权限
  - 保存

右侧内容：

- 菜单/按钮权限树，支持勾选。
- 权限明细表，展示已选权限。

明细表字段：

- 应用系统
- 功能菜单
- 操作按钮

复制他人权限弹窗：

- 选择要复制的账号，支持多选。
- 确认后将所选账号权限合并到当前账号待保存权限中。

交互规则：

- 必须先选择一个账号，才允许保存或复制权限。
- 保存时只提交按钮级权限。
- 菜单父级勾选状态根据按钮级权限自动回显。

### 4.5 账号授权：批量授权

对齐旧系统“批量设置”。

页面布局建议：

- 左侧：组织账号树，支持多选账号。
- 右侧：菜单/按钮权限树，支持多选权限。
- 右侧明细表：展示选中的权限明细。
- 顶部操作：
  - 搜索账号
  - 搜索系统功能
  - 复制他人权限
  - 保存

明细表字段：

- 应用系统
- 功能菜单
- 操作按钮

交互规则：

- 必须选择至少一个账号。
- 必须选择至少一个权限。
- 保存后批量给所选账号授权。
- 保存成功后清空已选账号和权限。

### 4.6 账号授权：超级管理员

对齐旧系统“设置超级管理员”。

页面布局建议：

- 顶部查询区：
  - 账号信息关键词
  - 查询按钮
- 表格：
  - 用户账号
  - 用户姓名
  - 部门岗位
  - 操作
- 工具栏：
  - 新增超级管理员

新增弹窗：

- 选择账号
- 保存/取消

交互规则：

- 新增时只能选择一个账号。
- 删除超级管理员权限需要确认。
- 超级管理员只管理权限身份，不承担普通账号 CRUD。

## 5. 数据模型设计

当前 `SettingsCenterData.permissions` 只有：

- `roles`
- `functionPermissions`
- `dataPermissions`

建议扩展为：

```ts
permissions: {
  roles: RoleRow[];
  functionPermissions: PermissionScopeRow[];
  dataPermissions: DataPermissionRow[];
  accountTree: AccountTreeNode[];
  permissionTree: PermissionTreeNode[];
  accountPermissions: AccountPermissionRow[];
  superAdmins: SuperAdminRow[];
}
```

### 5.1 AccountTreeNode

用于组织账号树。

```ts
export interface AccountTreeNode {
  id: string;
  key: string;
  label: string;
  type: 'department' | 'account';
  accountId?: string;
  userName?: string;
  fullName?: string;
  departmentName?: string;
  postName?: string;
  mobile?: string;
  children?: AccountTreeNode[];
}
```

### 5.2 PermissionTreeNode

用于系统/菜单/按钮树。

```ts
export interface PermissionTreeNode {
  id: string;
  key: string;
  label: string;
  type: 'platform' | 'menu' | 'button';
  platformId?: string;
  menuId?: string;
  buttonSign?: string;
  children?: PermissionTreeNode[];
}
```

### 5.3 AccountPermissionRow

用于账号授权明细。

```ts
export interface AccountPermissionRow {
  id: string;
  accountId: string;
  userName: string;
  fullName: string;
  departmentName: string;
  mobile: string;
  platformId: string;
  platformName: string;
  menuId: string;
  menuName: string;
  buttonKeys: string[];
  buttonNames: string[];
}
```

### 5.4 SuperAdminRow

用于超级管理员列表。

```ts
export interface SuperAdminRow {
  id: string;
  accountId: string;
  userName: string;
  name: string;
  deptAndPost: string;
}
```

## 6. Mock 数据设计

第一阶段建议继续放在：

- `vue3/src/mock/settings/permissions.json`

新增 mock 数据：

- `accountTree`
- `permissionTree`
- `accountPermissions`
- `superAdmins`

示例数据应覆盖：

- 多部门账号树。
- 多系统菜单树，包括系统设置、人力中心、薪资管理、考勤管理等。
- 菜单下存在按钮节点，例如查看、新增、编辑、删除、导入、导出、审批。
- 不同账号拥有不同菜单按钮权限。
- 至少 2 到 3 个超级管理员。

后续如果数据体量变大，可拆分为：

- `vue3/src/mock/settings/permission-accounts.json`
- `vue3/src/mock/settings/permission-tree.json`

但第一阶段建议集中在 `permissions.json`，减少资源加载改动。

## 7. 文件修改范围

第一阶段建议修改：

| 文件 | 修改内容 |
| --- | --- |
| `vue3/src/views/settings/SettingsCenterPage.vue` | 增加权限管理一级切换、账号授权 4 个子页签、交互方法、局部样式 |
| `vue3/src/app/api/settings/types.ts` | 增加账号树、权限树、账号授权、超级管理员类型 |
| `vue3/src/mock/settings/permissions.json` | 增加账号授权 mock 数据，并可顺手修正当前研发样例权限数据 |

原则：

- 不改 `navigation.ts`。
- 不改 `router/index.ts`。
- 不改人力模块页面。
- 不改公共母版组件。
- 不引入旧系统 iframe 或旧样式。

## 8. 实施阶段拆分

### 阶段一：文档与数据模型

目标：

- 明确旧系统能力和 5.0 承接方式。
- 补充 TypeScript 类型。
- 补充 mock 数据。

任务：

- 新增账号授权相关类型。
- 扩展 `SettingsCenterData.permissions`。
- 补充账号树、权限树、授权关系、超级管理员 mock。
- 确认现有资源加载不受影响。

验收：

- 项目类型能识别新增数据结构。
- `getSettingsCenterData()` 能返回新增字段。
- 现有权限角色页面不报错。

### 阶段二：权限管理一级切换

目标：

- 在 `/settings/permissions` 内增加“角色权限 / 账号授权”切换。
- 保留当前角色权限页面。

任务：

- 增加 `activePermissionMode`。
- 将现有角色权限块包进“角色权限”模式。
- 新增“账号授权”模式容器。
- 调整顶部新增按钮文案和行为。

验收：

- 进入 `/settings/permissions` 默认仍显示角色权限。
- 切换到账号授权后页面结构正常。
- 切回角色权限后现有菜单/操作/字段/数据权限可用。

### 阶段三：按功能授权账号

目标：

- 实现旧系统“系统权限”能力。

任务：

- 渲染权限菜单树。
- 点击菜单后显示已授权账号。
- 新增授权弹窗。
- 操作按钮多选。
- 账号树多选。
- 已选账号列表。
- 删除单个授权。
- 删除所有授权。

验收：

- 选择功能后能看到授权账号。
- 新增授权后列表更新。
- 删除单条授权生效。
- 删除所有授权生效。
- 未选功能时新增有提示。

### 阶段四：按账号设置权限

目标：

- 实现旧系统“账号权限”能力。

任务：

- 渲染组织账号树。
- 点击账号后回显该账号权限树。
- 权限树勾选联动明细表。
- 支持复制他人权限。
- 支持保存账号权限。

验收：

- 点击账号可显示当前权限。
- 勾选按钮权限后明细表同步变化。
- 复制他人权限可合并到当前账号。
- 保存后再次选择该账号仍能回显。

### 阶段五：批量授权

目标：

- 实现旧系统“批量设置”能力。

任务：

- 左侧账号树支持多选。
- 右侧权限树支持多选。
- 明细表展示已选权限。
- 支持复制他人权限。
- 支持保存批量授权。

验收：

- 可同时选择多个账号。
- 可同时选择多个菜单按钮权限。
- 保存后批量授权关系写入 mock 数据。
- 保存成功后清空选择。

### 阶段六：超级管理员

目标：

- 实现旧系统“设置超级管理员”能力。

任务：

- 超级管理员列表。
- 账号信息搜索。
- 新增超级管理员弹窗。
- 删除超级管理员确认。

验收：

- 可按关键词过滤超级管理员。
- 可新增超级管理员。
- 可删除超级管理员权限。
- 删除需要确认。

### 阶段七：验收与收尾

目标：

- 确保功能稳定、样式统一、没有破坏原角色权限。

任务：

- 页面走查。
- 类型检查。
- 构建检查。
- 浏览器验证。
- 补充交付说明。

验收：

- `/settings/permissions` 可访问。
- 角色权限 4 类权限仍可操作。
- 账号授权 4 个页签可切换。
- 各弹窗打开、保存、取消、删除确认可用。
- 无明显布局错位和文字溢出。

## 9. 交互与样式规范

整体沿用 5.0 设置页风格：

- 使用现有 `settings-*` 类名体系。
- 使用现有按钮风格：`aw-btn`、`aw-tool-btn`。
- 表格、树、弹窗保持 5.0 的轻量管理后台样式。
- 不使用旧系统 Layui 视觉元素。
- 不使用 iframe。
- 不新建复杂公共组件。

树形区域建议：

- 采用设置页内部样式实现，不改公共组件。
- 如果后续多个模块都需要组织树/权限树，再评估抽成公共组件。

弹窗建议：

- 复用当前 `openModal` / `AwSettingModal` 方式。
- 对账号树多选这类复杂弹窗，如果当前通用 modal 不够用，可在 `SettingsCenterPage.vue` 内局部实现，不上升公共组件。

## 10. 接口契约建议

当前阶段先用 mock 数据落地。未来接后端时，可按旧系统接口能力拆成以下契约：

| 5.0 能力 | 建议接口 |
| --- | --- |
| 获取账号树 | `GET /api/settings/permissions/account-tree` |
| 获取权限树 | `GET /api/settings/permissions/tree` |
| 按功能查授权账号 | `GET /api/settings/permissions/authorized-accounts` |
| 保存功能授权账号 | `POST /api/settings/permissions/authorized-accounts` |
| 删除功能授权账号 | `DELETE /api/settings/permissions/authorized-accounts/{id}` |
| 删除功能全部授权 | `DELETE /api/settings/permissions/authorized-accounts` |
| 按账号查权限 | `GET /api/settings/permissions/accounts/{accountId}` |
| 保存账号权限 | `POST /api/settings/permissions/accounts/{accountId}` |
| 批量授权 | `POST /api/settings/permissions/batch` |
| 查询超级管理员 | `GET /api/settings/permissions/super-admins` |
| 设置超级管理员 | `POST /api/settings/permissions/super-admins` |
| 删除超级管理员 | `DELETE /api/settings/permissions/super-admins/{id}` |

## 11. 验证计划

每次交付前至少验证：

1. 页面访问
   - 打开 `/settings/permissions`
   - 确认角色权限和账号授权切换正常

2. 角色权限回归
   - 切换菜单权限
   - 切换操作权限
   - 设置字段权限
   - 修改数据权限

3. 账号授权验证
   - 按功能授权账号
   - 按账号设置权限
   - 批量授权
   - 超级管理员新增/删除

4. 数据一致性
   - mock 字段与 types 一致
   - 保存后页面状态能回显

5. 工程验证
   - 能运行时执行：

```powershell
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vue-tsc\bin\vue-tsc.js --noEmit
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vite\bin\vite.js build
```

如果项目存在既有类型或构建报错，需要在交付中说明。

## 12. 风险与注意事项

- 当前 `permissions.json` 存在乱码内容，实施时建议同步修正，避免页面文案异常。
- 旧系统账号权限是账号级菜单按钮授权，5.0 当前角色权限是角色级菜单/操作/字段/数据授权，两者不要混为一套数据。
- 不建议第一阶段做真实账号 CRUD，因为用户最新说明重点是旧系统账号权限 4 个页签能力。
- 不建议修改导航和路由，避免影响系统设置验收路径。
- 不建议修改公共组件，除非发现确实是多页面通用问题。
- 批量授权保存时要明确是追加、覆盖还是合并。第一阶段建议按“合并授权”实现，避免误删已有权限。
- 超级管理员是权限身份，不等同于账号启用/停用。

## 13. 推荐第一版交付范围

第一版建议完成：

- 权限管理一级切换：角色权限 / 账号授权。
- 账号授权 4 个页签静态结构和 mock 交互。
- 按功能授权账号完整闭环。
- 按账号设置权限完整闭环。
- 批量授权完整闭环。
- 超级管理员新增/删除完整闭环。

第一版暂不做：

- 后端接口联调。
- 真实账号新增、编辑、删除。
- 独立公共组件抽象。
- 人力模块入口调整。
- 导航结构调整。

