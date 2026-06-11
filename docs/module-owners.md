# 模块负责人

本项目当前处于 Vue3 工程验收调整阶段。多人协作时，以模块边界和公共母版规则为准。

## 当前分工

- 主控：项目整体验收、PR 合并、公共组件边界确认。
- A：设置中心、人力中心。
- B：能耗中心。

## 分支建议

- 主控：`feature/main-acceptance`
- A：`feature/settings-hr`
- B：`feature/energy-center`

所有人从 `main` 拉取自己的功能分支，不直接向 `main` 提交代码。

## 修改边界

- 设置中心、人力中心相关页面、mock、types、resources 由 A 负责。
- 能耗中心相关页面、mock、types、resources 由 B 负责。
- 路由和导航只在必要时修改 `vue3/src/app/router/index.ts` 与 `vue3/src/layouts/erp-shell/navigation.ts`。
- 公共组件目录由主控确认后再改，避免单模块特例影响其他页面。

## 公共组件目录

- `vue3/src/components/list-page`
- `vue3/src/components/detail-page`
- `vue3/src/components/form-page`
- `vue3/src/components/setting-page`

公共组件问题优先记录到协作看板或 PR 说明，不要多人同时修改同一个公共组件。
