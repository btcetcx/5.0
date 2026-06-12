# 系统设置权限模块信息架构优化计划

## 1. 优化背景

当前 `/settings/permissions` 已补齐旧系统账号授权能力，但页面职责过重。现有页面同时承载了角色维护、角色授权、账号授权、批量授权、按功能授权、超级管理员等能力，所有功能堆在一个页面中，不利于后续维护和用户验收。

本轮优化目标不是继续往当前页面堆功能，而是重新梳理系统设置下的权限相关菜单、路由和页面职责，让账号、角色、权限资源、权限设置、超级管理员分别有清晰入口。

## 2. 目标信息架构

系统设置菜单调整为：

```text
系统设置
├─ 系统设置
├─ 用户账号
├─ 角色管理
├─ 权限资源
│  ├─ 菜单管理
│  ├─ 按钮操作
│  ├─ 字段权限项
│  └─ 数据权限规则
├─ 权限设置
│  ├─ 按账号设置权限
│  ├─ 批量授权
│  ├─ 按功能授权账号
│  └─ 角色授权
├─ 超级管理员
├─ 安全中心
├─ 日志与数据
└─ 集成与接口
```

确认规则：

- 权限和账号仍然都放在系统设置中。
- 不增加人力模块权限入口。
- `/settings/permissions` 只保留授权配置职责。
- 角色维护、用户账号维护、权限资源维护、超级管理员维护拆成独立页面。
- 权限设置中的默认页签为“按账号设置权限”。
- 权限设置页签顺序固定为：
  1. 按账号设置权限
  2. 批量授权
  3. 按功能授权账号
  4. 角色授权

## 3. 页面职责划分

### 3.1 系统设置

建议路由：

- `/settings/system`

职责：

- 企业信息
- 企业 Logo
- 基础系统资料
- 通知规则等现有系统设置能力

本轮原则：

- 保持现有功能，不做大调整。

### 3.2 用户账号

建议路由：

- `/settings/accounts`

职责：

- 账号列表
- 新增账号
- 编辑账号
- 删除账号
- 启用/停用账号
- 重置密码
- 绑定员工
- 分配角色
- 查看账号授权状态

建议字段：

- 账号
- 姓名
- 性别
- 手机号
- 身份证号
- 所属部门
- 关联员工
- 绑定角色
- 状态
- 已关联企业
- 创建时间
- 操作

建议操作：

- 新增
- 编辑
- 删除
- 启用/停用
- 重置密码
- 分配角色
- 查看权限

说明：

- 用户账号是账号基础资料维护，不等同于账号授权。
- 账号授权仍在“权限设置”中处理。

### 3.3 角色管理

建议路由：

- `/settings/roles`

职责：

- 角色列表
- 新增角色
- 编辑角色
- 删除角色
- 启用/停用角色
- 查看角色关联账号数
- 查看角色授权状态

建议字段：

- 角色名称
- 适用中心
- 角色说明
- 关联账号数
- 权限模板摘要
- 数据范围摘要
- 状态
- 更新时间
- 操作

建议操作：

- 新增
- 编辑
- 删除
- 启用/停用
- 复制角色
- 去授权

说明：

- 角色管理只维护角色基础信息。
- 角色具体授权放在“权限设置 / 角色授权”中。

### 3.4 权限资源

建议路由：

- `/settings/permission-resources`

建议内部页签：

- 菜单管理
- 按钮操作
- 字段权限项
- 数据权限规则

职责：

- 维护可被授权的资源本身。
- 为权限设置页面提供菜单、按钮、字段、数据规则来源。

#### 菜单管理

建议字段：

- 所属系统
- 上级菜单
- 菜单名称
- 路由地址
- 菜单编码
- 排序
- 是否启用
- 是否参与授权

建议操作：

- 新增菜单
- 编辑菜单
- 删除菜单
- 启用/停用
- 调整排序

#### 按钮操作

建议字段：

- 所属系统
- 所属菜单
- 按钮名称
- 按钮编码
- 操作标识
- 是否启用
- 是否参与授权

建议操作：

- 新增按钮
- 编辑按钮
- 删除按钮
- 启用/停用

#### 字段权限项

建议字段：

- 所属系统
- 所属页面/菜单
- 字段名称
- 字段编码
- 默认权限
- 是否敏感字段
- 是否启用

建议操作：

- 新增字段项
- 编辑字段项
- 删除字段项
- 启用/停用

#### 数据权限规则

建议字段：

- 规则名称
- 适用系统
- 规则类型
- 规则说明
- 默认范围
- 是否启用

建议操作：

- 新增规则
- 编辑规则
- 删除规则
- 启用/停用

### 3.5 权限设置

建议路由：

- `/settings/permissions`

职责：

- 只做授权关系配置。
- 不再承担账号、角色、权限资源基础维护职责。

内部页签顺序：

```text
权限设置
├─ 按账号设置权限
├─ 批量授权
├─ 按功能授权账号
└─ 角色授权
```

#### 按账号设置权限

默认进入该页签。

职责：

- 从账号出发查看和设置权限。
- 适合单个员工入职、转岗、临时加权限等高频场景。

功能：

- 左侧组织账号树
- 右侧权限树
- 权限明细表
- 复制他人权限
- 保存权限

#### 批量授权

职责：

- 多账号、多权限批量授权。
- 适合同岗位、同部门、批量入职场景。

功能：

- 批量选择账号
- 批量选择权限
- 复制他人权限
- 保存批量授权

#### 按功能授权账号

职责：

- 从菜单/按钮出发查看和维护已授权账号。
- 适合反查某功能有哪些账号能操作。

功能：

- 左侧菜单/按钮树
- 右侧授权账号列表
- 新增授权
- 删除单个授权
- 删除所有授权

#### 角色授权

职责：

- 从角色出发配置角色模板权限。
- 角色授权作为模板维护，放在权限设置最后。

功能：

- 选择角色
- 菜单权限
- 操作权限
- 字段权限
- 数据权限
- 保存角色授权

说明：

- 当前已有角色权限中的菜单、操作、字段、数据权限能力，可迁移到此页签。
- 左侧角色列表不再承担角色基础维护，只作为授权对象选择。

### 3.6 超级管理员

建议路由：

- `/settings/super-admins`

职责：

- 独立维护超级管理员身份。

功能：

- 查询超级管理员
- 新增超级管理员
- 删除超级管理员权限

建议字段：

- 用户账号
- 用户姓名
- 部门岗位
- 操作

说明：

- 超级管理员是权限身份，不是账号 CRUD。
- 普通账号维护在“用户账号”中处理。

### 3.7 安全中心、日志与数据、集成与接口

建议路由保持：

- `/settings/security`
- `/settings/data`
- `/settings/integrations`

本轮原则：

- 保持现有入口。
- 不与权限授权页面混放。

## 4. 路由与导航调整

### 4.1 导航建议

修改文件：

- `vue3/src/layouts/erp-shell/navigation.ts`

设置中心侧边菜单建议调整为：

```ts
sideItems: [
  jsxSideItem('system', '系统设置', '/settings/system'),
  jsxSideItem('accounts', '用户账号', '/settings/accounts'),
  jsxSideItem('roles', '角色管理', '/settings/roles'),
  {
    key: 'permissionResources',
    label: '权限资源',
    route: '/settings/permission-resources',
    flyout: [
      {
        title: '权限资源',
        items: [
          { label: '菜单管理', route: '/settings/permission-resources?tab=menus' },
          { label: '按钮操作', route: '/settings/permission-resources?tab=buttons' },
          { label: '字段权限项', route: '/settings/permission-resources?tab=fields' },
          { label: '数据权限规则', route: '/settings/permission-resources?tab=data-rules' },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '权限设置',
    route: '/settings/permissions',
    flyout: [
      {
        title: '权限设置',
        items: [
          { label: '按账号设置权限', route: '/settings/permissions?tab=byAccount' },
          { label: '批量授权', route: '/settings/permissions?tab=batch' },
          { label: '按功能授权账号', route: '/settings/permissions?tab=byFunction' },
          { label: '角色授权', route: '/settings/permissions?tab=role' },
        ],
      },
    ],
  },
  jsxSideItem('superAdmins', '超级管理员', '/settings/super-admins'),
  jsxSideItem('security', '安全中心', '/settings/security'),
  jsxSideItem('data', '日志与数据', '/settings/data'),
  jsxSideItem('integrations', '集成与接口', '/settings/integrations'),
]
```

### 4.2 路由建议

修改文件：

- `vue3/src/app/router/index.ts`

建议新增：

```ts
{
  path: 'settings/accounts',
  name: 'SettingsAccounts',
  component: () => import('@/views/settings/SettingsAccountPage.vue'),
  meta: { title: '用户账号' },
},
{
  path: 'settings/roles',
  name: 'SettingsRoles',
  component: () => import('@/views/settings/SettingsRolePage.vue'),
  meta: { title: '角色管理' },
},
{
  path: 'settings/permission-resources',
  name: 'SettingsPermissionResources',
  component: () => import('@/views/settings/SettingsPermissionResourcePage.vue'),
  meta: { title: '权限资源' },
},
{
  path: 'settings/super-admins',
  name: 'SettingsSuperAdmins',
  component: () => import('@/views/settings/SettingsSuperAdminPage.vue'),
  meta: { title: '超级管理员' },
}
```

保留：

```ts
{
  path: 'settings/:section(system|permissions|security|data|integrations)',
  name: 'SettingsCenterSection',
  component: () => import('@/views/settings/SettingsCenterPage.vue'),
  meta: { title: '设置中心' },
}
```

也可以在第二阶段把系统设置、安全中心、日志与数据、集成与接口继续从 `SettingsCenterPage.vue` 拆出，但本轮先聚焦权限相关功能。

## 5. 文件拆分建议

当前主要逻辑集中在：

- `vue3/src/views/settings/SettingsCenterPage.vue`

建议拆分为：

```text
vue3/src/views/settings/
├─ SettingsCenterPage.vue
├─ SettingsAccountPage.vue
├─ SettingsRolePage.vue
├─ SettingsPermissionResourcePage.vue
├─ SettingsPermissionPage.vue
└─ SettingsSuperAdminPage.vue
```

说明：

- `SettingsCenterPage.vue` 可继续承载系统设置、安全中心、日志与数据、集成与接口，也可以后续再拆。
- `SettingsPermissionPage.vue` 专门承载权限设置四个页签。
- 当前 `/settings/permissions` 可从 `SettingsCenterPage.vue` 迁出到 `SettingsPermissionPage.vue`。

如果考虑复用局部代码，可进一步增加：

```text
vue3/src/views/settings/permission/
├─ PermissionTreePanel.vue
├─ AccountTreePanel.vue
├─ PermissionDetailTable.vue
└─ permission-utils.ts
```

第一阶段不强制抽公共组件，只有当拆页后重复明显时再抽。

## 6. 数据模型调整建议

当前 `permissions.json` 已包含：

- `roles`
- `functionPermissions`
- `dataPermissions`
- `accountTree`
- `permissionTree`
- `accountPermissions`
- `superAdmins`

建议后续按页面职责拆分理解：

| 数据 | 归属页面 |
| --- | --- |
| `accountTree` | 用户账号、权限设置 |
| `roles` | 角色管理、角色授权 |
| `permissionTree` | 权限资源、权限设置 |
| `functionPermissions` | 角色授权 |
| `dataPermissions` | 角色授权、数据权限规则 |
| `accountPermissions` | 权限设置 |
| `superAdmins` | 超级管理员 |

第一阶段仍可继续使用同一个 `permissions.json`，避免资源加载改动过大。

第二阶段可考虑拆分：

```text
vue3/src/mock/settings/accounts.json
vue3/src/mock/settings/roles.json
vue3/src/mock/settings/permission-resources.json
vue3/src/mock/settings/permissions.json
vue3/src/mock/settings/super-admins.json
```

## 7. 分阶段实施计划

### 阶段一：导航与路由骨架

目标：

- 先把系统设置菜单和路由结构搭起来。

任务：

- 修改 `navigation.ts`。
- 新增设置中心下级路由。
- 新建页面骨架：
  - 用户账号
  - 角色管理
  - 权限资源
  - 权限设置
  - 超级管理员
- `/settings/permissions` 默认展示“按账号设置权限”。

验收：

- 左侧菜单显示目标结构。
- 所有新增路由可访问。
- 权限设置下级 flyout 顺序正确。
- 不影响系统设置、安全中心、日志与数据、集成与接口。

### 阶段二：迁移账号授权和超级管理员

目标：

- 将当前账号授权能力拆到合适页面。

任务：

- 将按账号设置权限、批量授权、按功能授权账号迁入 `SettingsPermissionPage.vue`。
- 将超级管理员迁入 `SettingsSuperAdminPage.vue`。
- 删除当前权限页中过度堆叠的超级管理员区块。

验收：

- `/settings/permissions` 只显示权限设置四个页签。
- `/settings/super-admins` 只显示超级管理员维护。
- 复制权限、保存权限、新增授权、删除授权仍可用。

### 阶段三：拆出用户账号和角色管理

目标：

- 补齐基础维护页面。

任务：

- 新增用户账号列表、查询、CRUD 操作。
- 新增角色管理列表、查询、CRUD 操作。
- 从权限设置中移除角色基础维护动作，保留“选择角色授权”。

验收：

- `/settings/accounts` 可维护账号基础资料。
- `/settings/roles` 可维护角色基础资料。
- `/settings/permissions?tab=role` 只做角色授权。

### 阶段四：拆出权限资源维护

目标：

- 让菜单、按钮、字段、数据规则有独立维护入口。

任务：

- 新增权限资源页内部页签：
  - 菜单管理
  - 按钮操作
  - 字段权限项
  - 数据权限规则
- 使用现有 `permissionTree` 和 `dataPermissions` mock 支撑基础维护。

验收：

- `/settings/permission-resources?tab=menus` 可维护菜单。
- `/settings/permission-resources?tab=buttons` 可维护按钮操作。
- `/settings/permission-resources?tab=fields` 可维护字段权限项。
- `/settings/permission-resources?tab=data-rules` 可维护数据权限规则。
- 权限设置页使用权限资源数据展示授权项。

### 阶段五：统一样式与验证

目标：

- 保持 5.0 系统设置体验一致。

任务：

- 检查页面标题、按钮顺序、空状态、弹窗、删除确认。
- 检查各页面数据回显。
- 检查路由和导航高亮。
- 执行构建和类型检查。

验收：

- 新增页面均可访问。
- 页面无 iframe、无 Layui 类名。
- 账号、角色、资源、授权、超管职责清晰。
- `vite build` 通过。
- `vue-tsc --noEmit` 如仍有既有错误，需要说明非本次设置页问题。

## 8. 实施边界

本轮允许修改：

- `vue3/src/layouts/erp-shell/navigation.ts`
- `vue3/src/app/router/index.ts`
- `vue3/src/views/settings/**`
- `vue3/src/app/api/settings/types.ts`
- `vue3/src/mock/settings/permissions.json`

本轮不建议修改：

- 人力模块页面
- 公共母版组件
- 其他业务中心页面
- 旧系统源码

除非验证发现确实是公共组件问题，否则不要改公共组件。

## 9. 验收重点

### 导航验收

- 系统设置下出现：
  - 系统设置
  - 用户账号
  - 角色管理
  - 权限资源
  - 权限设置
  - 超级管理员
  - 安全中心
  - 日志与数据
  - 集成与接口

### 权限设置验收

- 默认进入“按账号设置权限”。
- 页签顺序为：
  1. 按账号设置权限
  2. 批量授权
  3. 按功能授权账号
  4. 角色授权

### 页面职责验收

- 用户账号页不做授权配置。
- 角色管理页不做具体权限授权。
- 权限资源页只维护资源。
- 权限设置页只做授权关系。
- 超级管理员页独立维护超级管理员。

### 交互验收

- 新增、编辑、删除、启用/停用、保存、取消逻辑清楚。
- 删除有确认。
- 空状态有提示。
- 搜索不误清空关键词。
- 保存后可回显。

## 10. 风险与注意事项

- 当前权限逻辑都在一个页面中，拆页时要避免复制过多重复逻辑。
- 如果第一阶段时间有限，优先完成导航、路由和页面骨架，再逐步迁移交互。
- 当前 mock 数据可先集中使用，避免过早拆数据文件导致联动成本升高。
- 角色授权迁移后，要确保角色基础维护和角色授权职责不混淆。
- 权限资源维护页和权限设置页要共用同一份资源数据，避免出现两个不同菜单树。
- 不能把权限入口放到人力模块。

