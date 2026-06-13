# 设置中心新窗口交接说明

日期：2026-05-31

## 任务目标

本窗口只负责「设置中心」迁移。最终交付必须进入 `vue3` 标准工程，可运行、可预览、可继续和后端接口契约对接。静态预览只作为验收镜像，不作为最终实现来源。

原始 JSX 已完成，必须优先参考根目录的 `settings-center.jsx` 提取字段、数据结构、交互逻辑和页面语义。当前用户已经重新确认设置中心导航规划，因此迁移时以本文导航为准，不要沿用旧 Vue 侧边栏里的设置分类。

## 权威导航

设置中心一级入口保留在顶部导航「设置」。点击后进入设置中心默认页 `/settings`。

设置中心内部导航按以下结构实现：

1. 系统设置
   - 企业信息 / Logo
   - 消息通知（站内 / 短信 / 邮件开关与规则）

2. 权限管理
   - 角色管理
   - 功能权限（菜单 / 操作权限）
   - 数据权限（部门 / 区域 / 客户可见范围）

3. 安全中心
   - 密码策略
   - 登录限制（IP / 时段 / 失败锁定）
   - 双因子认证

4. 日志与数据
   - 操作日志 / 审计
   - 数据备份
   - 导入 / 导出

5. 集成与接口
   - 第三方对接（物流、电商、支付等）
   - 开放 API / 密钥管理
   - 数据同步配置

6. 初始化引导
   - 保留原 `settings-center.jsx` 中已有的初始化引导逻辑。
   - 如果 JSX 中已有引导总览、配置任务、引导模板、进度校验、新增引导、发布校验、操作记录等内容，先按原逻辑迁移，不要删。

## 旧导航处理

当前 Vue 工程里设置中心仍是旧结构，例如：

- 系统基础
- 业务参数
- 用户管理
- 角色权限
- 基础数据
- 编码规则
- 审批流程
- 初始化引导

这些不能原样保留为设置中心二级导航。需要合并到新结构中：

- 用户、角色、功能权限、数据权限归入「权限管理」。
- 密码策略、登录限制、双因子认证归入「安全中心」。
- 操作日志、数据备份、导入导出归入「日志与数据」。
- 第三方对接、开放 API、数据同步归入「集成与接口」。
- 企业信息、Logo、消息通知归入「系统设置」。
- 字典、编码规则、审批流程如确实需要保留，只能作为对应分类内部的卡片、Tab 或设置项，不要重新变成设置中心二级导航，除非用户后续明确要求。

## 母版库标准

开始前必须先查看母版库：

- `vue3/src/views/template-gallery/TemplateGallery.vue`

设置中心页面优先使用已有公共组件，不要写一套私有 UI：

- 设置页：`AwSettingPage`
- 设置顶部操作：`AwSettingToolbar`
- 左右设置结构：`AwSettingSplitPage`
- 左侧分类树：`AwSettingTree`
- 右侧列表卡片：`AwSettingListCard`
- 设置表格：`AwSettingTable`
- 字段设置：`AwFieldSettingPage`
- 编号规则：`AwCodeRuleBuilder`
- 审批规则：`AwApprovalRuleEditor`
- 人员选择：`AwPersonPickerModal`
- 通用弹窗：`AwSettingModal`
- 列表/表格场景复用：`AwListPage`、`AwListToolbar`、`AwDataTable`
- 表单场景复用：`AwFormPage`、`AwEditableSubTable`

弹窗、按钮、开关、表格固定列、Tab 切换等行为必须和客户管理已验收母版保持一致。

## 建议实现文件

可按以下结构组织，具体可结合现有工程调整：

- `vue3/src/views/settings/SettingsCenterPage.vue`
- `vue3/src/app/api/settings/types.ts`
- `vue3/src/app/api/settings/resources.ts`
- `vue3/src/mock/settings/system.json`
- `vue3/src/mock/settings/permissions.json`
- `vue3/src/mock/settings/security.json`
- `vue3/src/mock/settings/data.json`
- `vue3/src/mock/settings/integrations.json`
- `vue3/src/mock/settings/guide.json`

路由建议：

- `/settings`
- `/settings/system`
- `/settings/permissions`
- `/settings/security`
- `/settings/data`
- `/settings/integrations`
- `/settings/guide`

不要继续让 `settings` 指向合同、销售或其他模块的临时代替页面。

## 迁移要求

1. 先读 `settings-center.jsx`，记录每个设置项的字段、按钮、表格、弹窗和交互。
2. 再读客户管理已验收页面和母版库，确认样式与交互基准。
3. 按本文导航重组设置中心，不要照搬旧 Vue 导航。
4. 每个设置页面都必须可编辑，不允许只做静态展示卡片。
5. 所有开关使用统一 iOS 风格开关。
6. 表格、弹窗、搜索、筛选、新增、编辑、删除、保存、取消等操作必须真实响应前端状态。
7. 字段名称、数据结构和交互逻辑优先来自原 JSX；如原 JSX 终端显示乱码，以用户确认的中文导航和页面语义修正。
8. 需要和后端契约同步的字段，必须进入 `types.ts` 和 mock 数据，不要只写在模板里。
9. 静态预览如需要扩展，必须与 Vue 页面同字段、同数据、同交互，不要出现两套逻辑。

## 验收清单

完成后自检以下项目：

1. 顶部「设置」能进入 `/settings`。
2. 设置中心内部导航完全符合本文五大类加「初始化引导」。
3. 旧的二级导航名没有原样残留。
4. 系统设置里的企业信息、Logo、消息通知可编辑。
5. 权限管理里的角色、功能权限、数据权限可新增、编辑、开关、保存。
6. 安全中心里的密码策略、登录限制、双因子认证可配置。
7. 日志与数据里的操作日志可筛选查看，数据备份和导入导出有真实前端状态反馈。
8. 集成与接口里的第三方对接、API 密钥、数据同步可配置。
9. 初始化引导仍可打开，并保留原 JSX 的核心流程。
10. 所有弹窗、表格、Tab、开关样式与客户管理母版一致。
11. `npm run build` 能通过；若环境缺依赖，需记录明确阻塞原因。

## 给新窗口的复制指令

你负责迁移「设置中心」。请先阅读：

- `docs/settings-center-new-window-handoff.md`
- `settings-center.jsx`
- `vue3/src/views/template-gallery/TemplateGallery.vue`
- 客户管理已验收页面与公共母版组件

注意：

- 设置中心导航以交接文档里的五大类为准，并保留初始化引导。
- 原 JSX 是字段、数据、交互来源。
- Vue 最终交付必须可用，不能只做静态卡片。
- 必须复用母版库组件，弹窗、表格、Tab、开关行为要和客户管理保持一致。
- 完成后把修改文件、可访问路由、自检结果和遗留风险写回协同公告板。

## 2026-05-31 迁移完成记录

- 已将设置中心最终实现迁移到 `vue3` 标准工程，不再让 `/settings` 指向合同或其他临时代替页面。
- 修改文件：
  - `vue3/src/views/settings/SettingsCenterPage.vue`
  - `vue3/src/app/api/settings/types.ts`
  - `vue3/src/app/api/settings/resources.ts`
  - `vue3/src/mock/settings/system.json`
  - `vue3/src/mock/settings/permissions.json`
  - `vue3/src/mock/settings/security.json`
  - `vue3/src/mock/settings/data.json`
  - `vue3/src/mock/settings/integrations.json`
  - `vue3/src/mock/settings/guide.json`
  - `vue3/src/layouts/erp-shell/navigation.ts`
  - `vue3/src/app/router/index.ts`
- 可访问路由：
  - `/settings`
  - `/settings/system`
  - `/settings/permissions`
  - `/settings/security`
  - `/settings/data`
  - `/settings/integrations`
  - `/settings/guide`
- 自检结果：
  - `http://127.0.0.1:5173/settings` 可进入设置中心，内部导航为系统设置、权限管理、安全中心、日志与数据、集成与接口、初始化引导。
  - 旧二级导航名“系统基础 / 业务参数 / 用户管理 / 角色权限 / 基础数据 / 编码规则 / 审批流程”未作为设置中心二级导航残留。
  - 系统设置支持企业信息 / Logo 编辑、消息通知开关和规则编辑。
  - 权限管理支持角色、功能权限、数据权限新增、编辑、删除、开关和保存。
  - 安全中心支持密码策略、登录限制、双因子认证配置和开关。
  - 日志与数据支持操作日志查看 / 导出反馈，数据备份、导入、导出任务执行和编辑。
  - 集成与接口支持第三方对接、API 密钥、数据同步配置维护。
  - 初始化引导保留引导总览、配置任务、引导模板、进度校验、新增引导、发布校验等核心流程。
  - `pnpm run build` 已通过；本机 `pnpm` 未在 PATH 中，使用 bundled Node 的 Corepack 执行通过，仅有 Vite chunk 体积警告。
- 遗留风险：
  - 当前后端适配仍为 mock 模式，远端接口路径需要后端契约确认后替换。
  - 根目录静态 JSX 仍可作为预览镜像，但最终实现来源已切到 Vue3。

## 2026-05-31 返修记录：移除设置中心工作台

- 用户确认设置中心不需要内部“工作台”入口。
- 已从 `vue3/src/layouts/erp-shell/navigation.ts` 移除设置中心侧栏 `工作台`。
- 已调整 `vue3/src/views/settings/SettingsCenterPage.vue`：访问 `/settings` 时默认展示「系统设置」，不再展示设置中心工作台页。
- 自检结果：
  - `http://127.0.0.1:5173/settings` 页面中不再出现设置中心侧栏“工作台”。
  - `/settings` 仍可进入设置中心，并显示「系统设置 / 企业信息 / Logo / 消息通知」内容。
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留 Vite chunk 体积警告。

## 2026-05-31 返修记录：移除页面内部分类树

- 用户确认设置中心页面内容区不要左侧“设置分类”树。
- 已调整 `vue3/src/views/settings/SettingsCenterPage.vue`，移除内部 `AwSettingSplitPage / AwSettingTree`，保留外层 ERP 侧边导航，当前分类内容全宽展示。
- 自检结果：
  - `http://127.0.0.1:5173/settings` 中不再出现“设置分类”。
  - DOM 中 `aside.aw-setting-tree` 数量为 0。
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留 Vite chunk 体积警告。

## 2026-05-31 返修记录：系统设置移除消息通知

- 用户确认系统设置页删除“消息通知”，企业信息区域铺开。
- 已调整 `vue3/src/views/settings/SettingsCenterPage.vue`：删除系统设置页右侧消息通知面板，隐藏系统设置页新增通知规则入口，企业信息 / Logo 改为全宽四列表单。
- 已调整 `vue3/src/layouts/erp-shell/navigation.ts`：系统设置浮窗只保留“企业信息 / Logo”。
- 自检结果：
  - `http://127.0.0.1:5173/settings` 页面中不再出现“消息通知”和“新增通知规则”。
  - 企业信息 / Logo、统一社会信用代码、企业地址等字段仍可编辑。
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留 Vite chunk 体积警告。
## 2026-05-31 返修记录：设置中心二级导航移除浮窗

- 用户确认设置中心二级导航不再有浮窗，浮窗内的设置项统一合并到对应分类页面内部。
- 已调整 `vue3/src/layouts/erp-shell/navigation.ts`：设置中心 `sideItems` 只保留六个二级入口，不再传入 `flyout` 配置。
- 各分类内容继续由 `vue3/src/views/settings/SettingsCenterPage.vue` 承接：
  - 权限管理：角色管理、功能权限、数据权限在页面内 Tab / 表格中维护。
  - 安全中心：密码策略、登录限制、双因子认证在页面内卡片中维护。
  - 日志与数据：操作日志 / 审计、数据备份、导入 / 导出在页面内 Tab / 表格中维护。
  - 集成与接口：第三方对接、开放 API / 密钥管理、数据同步配置在页面内 Tab / 表格中维护。
  - 初始化引导：保留引导总览、配置任务、引导模板、进度校验等核心流程。
- 自检结果：
  - `http://127.0.0.1:5173/settings` 页面 DOM 中 `flyout` 数量为 0。
  - DOM 中 `aside.aw-setting-tree` 数量为 0。
  - 浏览器控制台错误数为 0。
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留 Vite chunk 体积警告。

## 2026-05-31 返修记录：权限管理按研发中心示例完善

- 用户要求先以研发中心为例完成权限管理效果，角色管理、功能权限、数据权限必须能跑起来，不做样子货。
- 已调整 `vue3/src/app/api/settings/types.ts`：
  - `RoleRow` 增加适用中心、功能权限模板、数据权限模板。
  - `PermissionScopeRow` 增加适用角色、菜单、页面 Tab、字段可见、字段可编辑。
  - `DataPermissionRow` 增加适用中心、项目范围、文档范围、产品 / 物料范围、BOM 范围。
- 已重写 `vue3/src/mock/settings/permissions.json` 为研发中心示例数据：
  - 角色：研发管理员、研发主管、研发工程师、研发只读。
  - 功能权限：项目管理、BOM管理、文档库，覆盖菜单、页面 Tab、操作按钮、字段级权限。
  - 数据权限：研发全量数据、本部门及下级研发数据、本人参与项目数据。
- 已调整 `vue3/src/views/settings/SettingsCenterPage.vue`：
  - 权限管理页顶部显示研发权限覆盖概览。
  - 角色管理、功能权限、数据权限三块统一铺在同一页，便于直接验收。
  - 功能权限支持“配置矩阵”，可维护页面 Tab 权限、字段可见、字段可编辑。
  - 数据权限覆盖部门、区域、客户、项目、文档、产品 / 物料、BOM 维度。
- 自检结果：
  - `http://127.0.0.1:5173/settings/permissions` 可见角色管理、功能权限、数据权限三块。
  - 页面可见“BOM列表 / 替代料”、页面 Tab 权限、字段可见、字段可编辑。
  - 浏览器控制台错误数为 0。
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留 Vite chunk 体积警告。
 
## 2026-06-01 返修记录：权限管理页结构重构

- 本轮只处理 `vue3/src/views/settings/SettingsCenterPage.vue` 的权限管理页结构，不改其他设置中心分类。
- 根据主流 ERP 权限设计，权限管理改为“角色为主线”的工作台：
  - 左侧是研发中心角色列表，支持选择角色、新增角色。
  - 右侧是当前角色概览、角色操作和权限配置区。
  - 权限配置区拆为四个页签：菜单权限、操作权限、字段权限、数据权限。
- 交互调整：
  - 菜单权限按研发中心菜单维护可访问范围，并显示页面 Tab 范围。
  - 操作权限按当前菜单维护查看、新增、编辑、删除、导入、导出、审批等动作开关。
  - 字段权限按当前菜单维护隐藏、只读、可编辑三态控制。
  - 数据权限按部门、区域、客户、项目、文档、产品/物料、BOM 维度配置可见范围。
  - 角色复制、启停、保存配置、新增角色仍然走前端状态反馈。
- 多智能体交叉验证结论：
  - 子智能体建议采用“左角色列表 + 右角色详情 + 权限页签”的结构，避免原来三块内容全部堆在一个页面。
  - 子智能体建议字段权限使用三态控制，数据权限按维度集中配置，本轮已吸收。
- 自检结果：
  - `http://127.0.0.1:5173/settings/permissions` 服务可访问。
  - `vue-tsc --noEmit` 通过。
  - `vite build` 通过，仅保留 Vite chunk 体积警告。
