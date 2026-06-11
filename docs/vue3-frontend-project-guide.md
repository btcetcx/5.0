# Vue3 前端项目技术栈与框架说明

## 1. 文档目的

本文用于说明当前 `vue3` 前端工程的技术栈、框架结构、页面组织方式、公共母版体系、数据与接口契约关系，以及后续验收调整时的开发规范。

当前项目已经进入 Vue3 工程验收调整阶段。后续工作应基于已经完成的 Vue3 工程、公共母版组件和用户验收意见进行调整，不再按根目录旧 JSX 原型重新生成页面，除非用户在某个具体问题中明确要求查看旧 JSX。

## 2. 项目定位

当前有效前端工程位于：

```text
vue3/
```

项目本质上是一个面向 ERP 业务系统的 Vue3 单页应用，覆盖销售、采购、仓储、生产、研发、售后、财务、人力、质检、设备、设置等中心模块。

它不是简单的静态页面集合，而是采用以下方式组织：

- 以 `Vue 3 + Vite + TypeScript` 作为基础工程能力。
- 以 `ErpShell` 作为统一 ERP 应用壳层。
- 以 `vue-router` 管理中心、模块、资源页、详情页、新增页、设置页入口。
- 以 `Aw*` 公共母版组件承载列表页、详情页、表单页、设置页、弹窗和字段选择器。
- 以 `src/app/api/**`、`src/mock/**` 和根目录 `接口契约-中心模块/` 对齐页面字段、mock 数据和接口契约。
- 以 `Pinia` 保存少量全局应用状态，例如侧边栏折叠和 API 模式。

根目录下大量 `.jsx`、`.css`、`.html` 文件属于旧原型或历史迁移资料。当前阶段不应把它们作为默认开发依据。

## 3. 技术栈清单

| 层级 | 技术 | 当前版本范围 | 作用 |
| --- | --- | --- | --- |
| 前端框架 | Vue | `^3.5.13` | 组件化开发、响应式状态、SFC 页面 |
| 构建工具 | Vite | `^6.0.5` | 本地开发服务、生产构建、模块热更新 |
| Vue 编译插件 | `@vitejs/plugin-vue` | `^5.2.1` | 编译 `.vue` 单文件组件 |
| 类型系统 | TypeScript | `^5.7.2` | 类型约束、接口契约、组件 props 和业务数据建模 |
| 类型检查 | vue-tsc | `^2.1.10` | Vue SFC 类型检查 |
| 路由 | vue-router | `^4.5.0` | 单页应用路由、懒加载业务页面 |
| 状态管理 | Pinia | `^2.3.0` | 全局应用状态 |
| HTTP 客户端 | Axios | `^1.7.9` | 统一请求封装和远程接口调用 |
| UI 组件库 | ant-design-vue | `^4.2.6` | Ant Design Vue 基础组件和主题配置 |
| 图标库 | `@ant-design/icons-vue` | `^7.0.1` | Ant Design Vue 图标资源 |

当前工程中 `ant-design-vue` 已全局安装，但验收阶段的核心 UI 规范主要来自 `Aw*` 自研公共母版组件。Ant Design Vue 更多用于全局主题、旧契约页、少量壳层和辅助组件。

## 4. 工程目录结构

核心目录如下：

```text
vue3/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  src/
    main.ts
    App.vue
    app/
      api/
      contracts/
      request/
      router/
      store/
      templates/
    components/
      list-page/
      detail-page/
      form-page/
      setting-page/
      workbench/
      page-shell/
      data-table/
      filter-bar/
    layouts/
      erp-shell/
    mock/
    styles/
    views/
```

重要目录说明：

| 目录 | 说明 |
| --- | --- |
| `src/main.ts` | 应用入口，注册 Pinia、Router、Ant Design Vue 和全局样式 |
| `src/App.vue` | 全局 Ant Design Vue `ConfigProvider` 主题包装和路由出口 |
| `src/app/router/index.ts` | 路由总表，所有 ERP 页面挂在 `ErpShell` 子路由下 |
| `src/layouts/erp-shell/` | ERP 应用壳层，包括顶部中心导航、侧边栏、浮层导航 |
| `src/layouts/erp-shell/navigation.ts` | 顶部中心、左侧模块、浮层入口的导航数据源 |
| `src/components/list-page/` | 列表页公共母版和表格、工具栏、资源树 |
| `src/components/detail-page/` | 详情页公共母版、详情头、工具栏、Tab、审核弹窗 |
| `src/components/form-page/` | 新增/编辑页母版、明细表、附件表、选择器、字段输入组件 |
| `src/components/setting-page/` | 设置页母版、字段设置、编号规则、审批规则、策略设置、人员选择器 |
| `src/views/` | 各业务中心页面 |
| `src/app/api/` | 模块 API adapter、资源配置和类型定义 |
| `src/mock/` | 模块 mock 数据 |
| `src/styles/` | 全局样式、设计 token、Ant Design 覆盖样式、AW 控制台样式 |
| `接口契约-中心模块/` | 各中心页面接口契约和前后端协作规范 |

## 5. 启动、构建和验证

`package.json` 中定义了三个主要脚本：

```bash
npm run dev
npm run build
npm run preview
```

对应能力：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务，host 为 `127.0.0.1` |
| `npm run build` | 先执行 `vue-tsc --noEmit`，再执行 `vite build` |
| `npm run preview` | 启动 Vite preview 服务 |

Vite 配置：

```ts
server: {
  port: 5173,
  strictPort: false,
}
```

如果 5173 被占用，Vite 会自动尝试其他端口。

当前项目指定的本地 Node 运行方式：

```powershell
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vue-tsc\bin\vue-tsc.js --noEmit
& "C:\Users\btcet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vite\bin\vite.js build
```

验收交付前至少应完成：

- 检查相关页面是否能通过路由访问。
- 检查导航入口和路由是否一致。
- 检查字段、mock、types、resources、接口契约是否一致。
- 能运行时执行类型检查或构建。
- 如果不能运行，需要在交付中说明原因。

## 6. 应用入口与全局装配

应用入口在 `src/main.ts`：

```ts
createApp(App)
  .use(createPinia())
  .use(router)
  .use(Antd)
  .mount('#app');
```

入口完成了四件事：

- 创建 Vue 应用。
- 注册 Pinia。
- 注册 Vue Router。
- 全局注册 Ant Design Vue。
- 引入全局样式文件。

全局样式加载顺序：

```ts
import 'ant-design-vue/dist/reset.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/ant-override.css';
import './styles/aw-console.css';
```

`src/App.vue` 使用 `a-config-provider` 设置 Ant Design Vue 主题 token：

- 主色：`#1677ff`
- 圆角：`6`
- 字体：系统字体和 `Microsoft YaHei`
- Layout、Menu、Table 等组件主题配置

虽然项目注册了 Ant Design Vue，但当前验收阶段不应优先新增 Ant Design Vue 私有页面结构，而应优先复用 AW 母版。

## 7. 路由与 ERP 壳层

路由入口：

```text
vue3/src/app/router/index.ts
```

路由采用：

```ts
createRouter({
  history: createWebHistory(),
  routes,
});
```

整体结构为：

```text
/
  ErpShell
    prd
    templates
    settings
    sales/*
    purchase/*
    rd/*
    warehouse/*
    production/*
    after-sales/*
    equipment/*
    qc/*
    hr/*
    finance/*
```

`ErpShell` 是统一应用壳层，承载：

- 顶部一级中心导航。
- 左侧二级模块导航。
- 浮层入口。
- 当前页面路由出口。

导航配置入口：

```text
vue3/src/layouts/erp-shell/navigation.ts
```

该文件定义了：

- `TopNavItem`
- `SideNavItem`
- `FlyoutSection`
- `FlyoutEntry`
- `topNavItems`
- `getCenterByPath`
- `getSideByPath`

后续如果出现“导航入口不对”“中心高亮不对”“浮层链接不对”等问题，优先检查 `navigation.ts` 和 `router/index.ts`，不要通过页面内部特殊逻辑绕过导航配置。

## 8. 公共母版组件体系

当前 Vue3 工程的核心不是单个页面，而是一套公共母版组件。验收调整应优先通过母版 props、slot、配置数据和 mock 数据完成。

### 8.1 列表页母版

目录：

```text
vue3/src/components/list-page/
```

主要组件：

| 组件 | 作用 |
| --- | --- |
| `AwListPage` | 列表页外层布局，支持左侧资源树 slot |
| `AwListToolbar` | 搜索、刷新、筛选、字段配置、导入、导出、新增按钮 |
| `AwDataTable` | 数据表格、选择框、序号、操作列、批量操作、分页 |
| `AwResourceTree` | 左侧分类树、分组树、资源树 |

列表页调整重点：

- 字段是否完整。
- 字段顺序是否符合契约和验收意见。
- 选择框、序号、操作列是否按母版固定。
- 搜索、刷新、筛选、字段配置、导入、导出、新增按钮顺序是否一致。
- 字段配置弹窗是否能控制显示列。
- mock/types/resources 是否和页面字段一致。

### 8.2 详情页母版

目录：

```text
vue3/src/components/detail-page/
```

主要组件：

| 组件 | 作用 |
| --- | --- |
| `AwDetailPage` | 详情页外层结构 |
| `AwDetailToolbar` | 返回、编辑、删除、提交、关闭等操作 |
| `AwDetailHeader` | 标题、编号、状态、概要信息 |
| `AwDetailTabs` | 详情 Tab 容器 |
| `AwDetailInfoGrid` | 基础信息网格 |
| `AwDetailMetricGrid` | 指标信息网格 |
| `AwAuditActionModal` | 审核动作弹窗 |
| `AwAfterSalesOpinionModal` | 售后处理意见弹窗 |

详情页调整重点：

- Tab 是否可切换。
- 每个 Tab 是否显示对应内容。
- 详情头字段是否和列表、mock、接口契约一致。
- 审核、关闭、编辑等动作是否走公共弹窗或公共按钮样式。
- 不应把字段写死到不可编辑且不可配置的私有卡片中。

### 8.3 新增/编辑页母版

目录：

```text
vue3/src/components/form-page/
```

主要组件：

| 组件 | 作用 |
| --- | --- |
| `AwFormPage` | 新增/编辑页外层结构和顶部按钮区 |
| `AwEditableSubTable` | 可编辑明细表 |
| `AwAttachmentTable` | 附件表 |
| `AwRichTextEditor` | 富文本或备注编辑 |
| `AwSearchTriggerInput` | 带搜索触发图标的输入框 |
| `AwSourcePickerModal` | 来源单据选择器 |
| `AwCategoryPickerModal` | 分类选择器 |
| `AwOptionPickerModal` | 通用选项选择器 |
| `AwUnitPickerInput` | 单位选择输入框 |
| `AwUnitPickerModal` | 单位选择弹窗 |
| `AwPaymentTermCards` | 付款条件卡片 |

新增/编辑页调整重点：

- 顶部返回、暂存、提交等操作是否按母版。
- 基础字段是否和接口契约、mock、types 一致。
- 明细表是否走 `AwEditableSubTable`。
- 附件是否走 `AwAttachmentTable`。
- 分类、来源、单位、人员等选择是否走公共选择器。
- 富文本只承载内容编辑，不应替代结构布局。

### 8.4 设置页母版

目录：

```text
vue3/src/components/setting-page/
```

主要组件：

| 组件 | 作用 |
| --- | --- |
| `AwSettingPage` | 设置页统一容器 |
| `AwSettingToolbar` | 设置页工具栏 |
| `AwSettingModal` | 通用设置弹窗 |
| `AwFieldSettingPage` | 自定义字段设置 |
| `AwCodeRuleBuilder` | 自定义编号规则 |
| `AwApprovalRuleEditor` | 审批规则编辑 |
| `AwStrategySettingPage` | 策略设置 |
| `AwPersonPickerModal` | 人员选择器 |
| `AwSettingTable` | 设置表格 |
| `AwSettingTree` | 设置树 |

设置页调整重点：

- 自定义字段、自定义编号、审批设置、策略设置是否复用母版。
- 弹窗结构、遮罩、头部、底部按钮是否统一。
- 不应为单个模块新建私有设置页结构。
- 不应为单个模块修改公共组件，除非确认是通用问题。

## 9. 页面组织方式

业务页面大致分为三类。

### 9.1 完整业务页面

例如销售客户、销售计划、报价、合同、订单等页面，通常有独立目录：

```text
src/views/sales/customers/
src/views/sales/sales-plans/
src/views/sales/sales-quotes/
src/views/sales/sales-contracts/
src/views/sales/sales-orders/
```

常见文件：

- `*List.vue`
- `*Create.vue`
- `*Detail.vue`
- `*SettingPage.vue`
- `*.config.ts`

这类页面通常已经较完整，验收返修时应只针对当前页面字段、交互、mock、types、resources 或设置页配置做调整。

### 9.2 资源型聚合页面

部分中心使用一个资源页根据路由或模块 key 渲染不同业务模块，例如：

```text
src/views/purchase/PurchaseResourcePage.vue
src/views/warehouse/WarehouseResourcePage.vue
src/views/production/ProductionResourcePage.vue
src/views/rd/RdResourcePage.vue
src/views/qc/QcResourcePage.vue
src/views/hr/HrResourcePage.vue
src/views/finance/FinanceResourcePage.vue
src/views/equipment/EquipmentResourcePage.vue
```

这类页面通常包含：

- 根据当前路由识别模块。
- 根据模块配置生成列表字段。
- 根据 `query.action`、`query.id`、`query.setting` 切换新增、详情、设置等状态。
- 调用对应 `app/api/**/resources.ts` 获取 mock 或远程数据。

验收调整时需要特别注意不要把一个模块的特例改成影响所有模块的全局逻辑。

### 9.3 契约占位页面

`src/views/contracts/ContractResourcePage.vue` 等页面用于展示契约资源、预留模块和未完成迁移入口。

这类页面常用于：

- 已有接口契约但页面尚未细化的模块。
- 预留导航入口。
- 说明资源路径、契约状态、原型参考。

验收阶段如果某模块已经有完整 Vue 页面，应优先调整完整 Vue 页面，不要退回契约占位页。

## 10. 数据、mock 与接口契约

### 10.1 请求层

统一请求封装：

```text
vue3/src/app/request/http.ts
```

默认配置：

```ts
baseURL: '/api/v1'
timeout: 15000
Content-Type: application/json
```

响应结构遵循：

```ts
{
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

请求失败或 `success === false` 时会抛出 `ApiError`。

### 10.2 API adapter

模块接口适配通常位于：

```text
src/app/api/<module>/resources.ts
src/app/api/<module>/types.ts
src/app/api/<module>/settings.ts
```

常见职责：

- 定义页面数据类型。
- 定义模块资源映射。
- 按 `apiMode` 返回 mock 或远程接口。
- 暴露列表、详情、新增、编辑、审核、导出、打印等方法。

### 10.3 mock 数据

mock 数据通常位于：

```text
src/mock/<module>/*.json
```

mock 数据不是随意演示数据，它应和：

- 页面列表字段
- 详情字段
- 新增/编辑字段
- types 类型
- resources adapter
- 接口契约

保持一致。

### 10.4 接口契约

契约文件位于：

```text
接口契约-中心模块/
```

当前可见契约包括：

```text
销售中心-页面接口契约.md
销售中心-前后端接口协作规范.md
采购中心-页面接口契约.md
采购中心-前后端接口协作规范.md
仓储中心-页面接口契约.md
仓储中心-前后端接口协作规范.md
生产中心-页面接口契约.md
生产中心-前后端接口协作规范.md
```

当用户提出字段、接口、数据含义、状态流转等问题时，应同步检查契约文件，不能只看页面当前显示。

## 11. 状态管理

当前 Pinia store 位于：

```text
vue3/src/app/store/app.ts
```

当前状态较少：

```ts
collapsed: boolean;
apiMode: 'mock' | 'remote';
```

当前 store 主要用于：

- 控制应用壳层侧边栏折叠。
- 控制 API 数据模式。

目前没有复杂的跨模块业务状态集中管理。多数业务状态保留在页面组件、资源页配置、mock 数据或 API adapter 中。

## 12. 样式体系

样式目录：

```text
vue3/src/styles/
```

主要文件：

| 文件 | 作用 |
| --- | --- |
| `tokens.css` | AW 与 ERP 全局 CSS 变量 |
| `global.css` | 全局基础样式和旧页面基础结构 |
| `ant-override.css` | Ant Design Vue 覆盖样式 |
| `aw-console.css` | AW 控制台、母版、表格、弹窗等主样式 |

常用 CSS 变量：

```css
--aw-primary
--aw-primary-soft
--aw-bg
--aw-surface
--aw-border
--aw-fg-1
--aw-fg-2
--aw-fg-3
--aw-success
--aw-warning
--aw-danger
--erp-bg
--erp-surface
--erp-border
--erp-text
--erp-primary
```

样式开发原则：

- 优先使用已有 `aw-*` 样式和 CSS 变量。
- 页面局部样式使用 scoped。
- 不为单个页面重新定义一套和母版冲突的布局体系。
- 弹窗、表格、按钮、工具栏优先复用公共组件和公共 class。

## 13. 当前主要业务中心

当前路由和页面中已经出现的中心包括：

| 中心 | 典型路由 | 页面形态 |
| --- | --- | --- |
| 母版库 | `/templates` | 公共组件展示和验证 |
| PRD | `/prd` | PRD 信息页 |
| 销售 | `/sales/*` | 多个完整业务模块 |
| 采购 | `/purchase/*` | 资源型聚合页面 |
| 仓储 | `/warehouse/*` | 资源型聚合页面 |
| 生产 | `/production/*` | 资源型聚合页面和排班页面 |
| 研发 | `/rd/*` | 资源型聚合页面 |
| 售后 | `/after-sales/*` | 售后工作台、列表、任务、设置 |
| 设备 | `/equipment/*` | 资源型聚合页面 |
| 质检 | `/qc/*` | 资源型聚合页面 |
| 人力 | `/hr/*` | 人力工作台和资源型页面 |
| 财务 | `/finance/*` | 财务工作台和资源型页面 |
| 设置 | `/settings/*` | 设置中心 |

不同中心完成度不完全一致。后续处理具体问题时，应先判断当前模块是完整页面、资源型页面、设置页还是契约占位页。

## 14. 开发与验收调整流程

后续处理任务时建议遵循以下流程。

### 14.1 先判断问题类型

| 问题类型 | 修改范围 |
| --- | --- |
| 页面字段差异 | 当前页面配置、字段、mock、types、resources |
| 交互差异 | 当前页面事件、状态、公共组件 props 或 slot |
| 通用母版问题 | 公共组件，但需要先确认影响范围 |
| 导航问题 | `navigation.ts` 和必要路由 |
| 路由问题 | `router/index.ts` 和页面入口 |
| 接口契约问题 | 契约文件、types、resources、mock、页面字段同步检查 |
| 设置页问题 | 设置模板、设置资源、`AwSetting*` 母版 |
| 弹窗问题 | 优先检查公共选择器或公共设置弹窗 |

### 14.2 必读顺序

开始具体模块任务前，应按当前项目规则读取：

```text
1. vue3/src/views/template-gallery/TemplateGallery.vue
2. vue3/src/components/list-page
3. vue3/src/components/detail-page
4. vue3/src/components/form-page
5. vue3/src/components/setting-page
6. vue3/src/layouts/erp-shell/navigation.ts
7. vue3/src/app/router/index.ts
8. 当前模块已有 Vue 页面、mock、types、resources
9. 接口契约文件
10. 用户最新验收意见或当前交接文档
```

### 14.3 修改原则

- 能通过配置解决时，不新建私有结构。
- 能通过 props 或 slot 解决时，不改公共组件。
- 改公共组件前必须确认它是通用问题。
- 不覆盖用户或其他窗口已经完成的无关改动。
- 不使用旧 JSX 覆盖已验收通过的 Vue 页面规则。
- 页面字段应同时对齐 mock、types、resources 和接口契约。

## 15. 常见入口与文件关系

### 15.1 新增一个导航入口

通常需要检查：

```text
src/layouts/erp-shell/navigation.ts
src/app/router/index.ts
src/views/<module>/*
```

确保：

- 顶部中心存在。
- 左侧模块存在。
- 浮层入口链接正确。
- 路由能命中页面。
- 页面标题和导航文案一致。

### 15.2 调整列表字段

通常需要检查：

```text
src/views/<module>/*
src/app/api/<module>/types.ts
src/app/api/<module>/resources.ts
src/mock/<module>/*.json
接口契约-中心模块/*.md
```

确保：

- 字段 key 一致。
- 表头中文一致。
- 字段顺序一致。
- mock 数据存在。
- 筛选选项和状态值一致。
- 详情页、新增页需要联动时同步调整。

### 15.3 调整设置页

通常需要检查：

```text
src/components/setting-page/
src/app/templates/*settings*
src/app/api/*/settings.ts
src/views/**/**SettingPage.vue
```

确保：

- 字段设置、编号设置、审批设置、策略设置复用母版。
- 设置弹窗结构统一。
- 当前模块设置数据和模板一致。

### 15.4 调整选择器或弹窗

优先检查：

```text
src/components/form-page/AwSourcePickerModal.vue
src/components/form-page/AwCategoryPickerModal.vue
src/components/form-page/AwOptionPickerModal.vue
src/components/form-page/AwUnitPickerModal.vue
src/components/setting-page/AwPersonPickerModal.vue
src/components/setting-page/AwSettingModal.vue
```

如果需求是人员、分类、来源、选项、单位选择，应优先复用以上公共组件。

## 16. 已观察到的技术风险

### 16.1 旧 JSX 文件仍大量存在

根目录仍有大量 `.jsx` 和旧 CSS 文件。它们可能对理解历史原型有帮助，但当前验收阶段不应默认引用。

风险：

- 容易用旧实现覆盖已验收的 Vue 母版。
- 容易重新引入私有结构。
- 容易造成字段和当前契约不一致。

处理建议：

- 只有用户明确要求时才查看旧 JSX。
- 默认以 Vue3 页面、公共母版、mock/types/resources、接口契约为准。

### 16.2 AW 母版和 Ant Design Vue 并存

工程中既有 Ant Design Vue，也有 AW 母版组件。

风险：

- 同一类页面可能出现两种表格、两种工具栏、两种弹窗。
- 后续验收容易产生视觉和交互不一致。

处理建议：

- 新验收调整优先使用 AW 母版。
- Ant Design Vue 只在已有壳层、旧契约页或明确需要时使用。

### 16.3 部分资源页体量较大

例如采购、生产、研发、质检、财务等资源页文件较大，内部可能包含较多模块配置、局部 render 函数和页面私有结构。

风险：

- 单点修改可能影响多个模块。
- 页面私有弹窗可能和公共弹窗规则不一致。
- 类型和字段维护成本较高。

处理建议：

- 修改前先确认当前路由对应的模块 key。
- 尽量只改当前模块配置。
- 可复用公共组件时逐步替换私有结构。

### 16.4 API 模式和 URL 拼接需要复查

请求层已经配置 `baseURL: /api/v1`。部分 adapter 中可能直接写入完整 `/api/v1/...` 路径。

风险：

- 远程模式接入时可能出现路径重复或路径不一致。

处理建议：

- 接口联调前统一检查 adapter URL。
- 契约路径、request baseURL、mock 资源名三者要一致。

### 16.5 中文文案编码显示需谨慎

在部分命令行输出中，中文文案可能出现编码显示异常。修改文案时应以源码编辑器和实际页面显示为准。

风险：

- 直接复制命令行乱码可能污染源码。
- 验收文案可能被误改。

处理建议：

- 修改中文文案前确认文件编码和页面实际显示。
- 不在无关任务中批量改中文文案。

## 17. 后续维护建议

- 为每个中心维护一份“路由、页面、mock、types、契约”映射表。
- 对 `Aw*` 公共组件建立组件使用清单，记录哪些模块依赖它。
- 对大型资源页逐步拆分模块配置，降低单文件维护成本。
- 对 API adapter 做一次路径统一检查，避免远程接入时出现重复 `/api/v1`。
- 对列表字段、详情字段、新增字段建立契约对照，减少验收返修时漏改。
- 对设置页模板建立统一资源映射，避免各模块自行维护重复结构。

## 18. 总结

当前前端工程是一个以 Vue3、Vite、TypeScript 为基础，以 ERP 壳层和 AW 公共母版为核心，以 mock、types、resources 和接口契约驱动页面验收的工程化前端项目。

后续工作的关键不是重新生成页面，而是稳定地完成以下事情：

- 字段对齐。
- 路由对齐。
- 导航对齐。
- mock/types/resources 对齐。
- 接口契约对齐。
- 公共母版复用。
- 已验收规则保持稳定。

只要保持这个方向，项目可以在不破坏公共体验的前提下继续完成各业务中心的验收调整。
