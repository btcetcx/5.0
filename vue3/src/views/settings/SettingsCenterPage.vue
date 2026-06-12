<template>
  <aw-setting-page>
    <template #toolbar>
      <aw-setting-toolbar
        :add-text="currentAddText"
        back-text="返回设置首页"
        :show-add="currentSection !== 'system'"
        @add="handleAdd"
        @back="router.push('/settings')"
        @refresh="toast('设置中心已刷新')"
      />
    </template>

    <section class="settings-content">
      <aw-setting-list-card
        v-model:keyword="keyword"
        :description="currentDescription"
        :search-placeholder="currentSearchPlaceholder"
        :title="currentTitle"
      >
        <template v-if="currentSection === 'system'">
          <div class="settings-system-full">
            <section class="settings-panel settings-company-panel">
              <div class="aw-detail-section-title">企业信息 / Logo</div>
              <div class="settings-logo-row">
                <div class="settings-logo">{{ data.system.company.logoText }}</div>
                <div>
                  <strong>{{ data.system.company.shortName }}</strong>
                  <p>{{ data.system.company.company }}</p>
                </div>
                <button class="aw-tool-btn" type="button" @click="toast('Logo 上传入口已打开')">上传 Logo</button>
              </div>
              <div class="settings-form-grid">
                <label v-for="field in companyFields" :key="field.key" class="aw-field">
                  <span>{{ field.label }}</span>
                  <input v-model="data.system.company[field.key]" />
                </label>
              </div>
              <div class="settings-actions">
                <button class="aw-tool-btn" type="button" @click="toast('企业信息已恢复默认')">恢复默认</button>
                <button class="aw-btn primary" type="button" @click="saveAll('企业信息已保存')">保存企业信息</button>
              </div>
            </section>
          </div>
        </template>

        <template v-else-if="currentSection === 'permissions'">
          <div class="settings-permission-mode-tabs">
            <button
              :class="{ on: activePermissionMode === 'role' }"
              type="button"
              @click="activePermissionMode = 'role'"
            >
              角色权限
            </button>
            <button
              :class="{ on: activePermissionMode === 'account' }"
              type="button"
              @click="activePermissionMode = 'account'"
            >
              账号授权
            </button>
          </div>

          <div v-if="activePermissionMode === 'role'" class="settings-permission-workbench">
            <aside class="settings-role-panel">
              <div class="settings-role-head">
                <div>
                  <strong>岗位列表</strong>
                  <span>{{ filteredRoles.length }} 个岗位</span>
                </div>
                <button class="aw-tool-btn" type="button" @click="openRole()">新增岗位</button>
              </div>
              <button
                v-for="role in filteredRoles"
                :key="role.id"
                :class="['settings-role-item', { on: selectedRoleId === role.id }]"
                type="button"
                @click="selectRole(role.id)"
              >
                <span>
                  <strong>{{ role.name }}</strong>
                  <em>{{ role.menu }}</em>
                </span>
                <i :class="{ off: !role.enabled }">{{ role.enabled ? '启用' : '停用' }}</i>
              </button>
            </aside>

            <section class="settings-role-main">
              <div class="settings-role-overview">
                <div>
                  <span class="settings-role-kicker">当前岗位</span>
                  <h3>{{ selectedRole?.name || '未选择岗位' }}</h3>
                  <p>{{ selectedRole?.center }} · {{ selectedRole?.users || 0 }} 人 · {{ selectedRole?.dataPolicy }}</p>
                </div>
                <div class="settings-role-actions">
                  <button class="aw-tool-btn" type="button" @click="selectedRole && openRole(selectedRole)">编辑岗位</button>
                  <button class="aw-tool-btn" type="button" @click="copySelectedRole">复制岗位</button>
                  <button class="aw-tool-btn" type="button" @click="toggleSelectedRole">{{ selectedRole?.enabled ? '停用' : '启用' }}</button>
                  <button class="aw-btn primary" type="button" @click="saveAll('权限配置已保存')">保存配置</button>
                </div>
              </div>

              <div class="settings-permission-summary compact">
                <section v-for="item in selectedRoleSummary" :key="item.label" class="settings-summary-card">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.desc }}</em>
                </section>
              </div>

              <div class="aw-tabs">
                <button
                  v-for="tab in permissionTabs"
                  :key="tab.key"
                  :class="['t', { on: activePermissionTab === tab.key }]"
                  type="button"
                  @click="setPermissionTab(tab.key)"
                >
                  {{ tab.label }}
                </button>
              </div>

              <section v-if="activePermissionTab === 'menus'" class="settings-permission-block">
                <div class="settings-block-head">
                  <div>
                    <strong>菜单权限</strong>
                    <p>按研发中心菜单和页面 Tab 控制当前岗位可访问范围。</p>
                  </div>
                </div>
                <div class="settings-menu-list">
                  <article v-for="menu in rdMenuOptions" :key="menu" :class="['settings-menu-row', { on: activePermissionMenu === menu }]">
                    <button type="button" @click="activePermissionMenu = menu">
                      <strong>{{ menu }}</strong>
                      <span>{{ (rdTabOptions[menu] || []).join(' / ') }}</span>
                    </button>
                    <label class="aw-switch-line mini">
                      <input :checked="hasMenuAccess(menu)" type="checkbox" @change="toggleMenuAccess(menu)" />
                      <i></i>
                    </label>
                  </article>
                </div>
              </section>

              <section v-else-if="activePermissionTab === 'actions'" class="settings-permission-block">
                <div class="settings-block-head">
                  <div>
                    <strong>操作权限</strong>
                    <p>{{ activePermissionMenu }} 的按钮级操作权限，直接影响新增、删除、导出、审批等动作。</p>
                  </div>
                  <select v-model="activePermissionMenu" class="settings-inline-select">
                    <option v-for="menu in rdMenuOptions" :key="menu">{{ menu }}</option>
                  </select>
                </div>
                <div class="settings-action-grid">
                  <label v-for="action in permissionActionOptions" :key="action.key" class="settings-action-card">
                    <span>
                      <strong>{{ action.label }}</strong>
                      <em>{{ action.desc }}</em>
                    </span>
                    <label class="aw-switch-line mini">
                      <input
                        :checked="Boolean(activeMenuPermission?.[action.key])"
                        type="checkbox"
                        @change="togglePermissionAction(action.key)"
                      />
                      <i></i>
                    </label>
                  </label>
                </div>
              </section>

              <section v-else-if="activePermissionTab === 'fields'" class="settings-permission-block">
                <div class="settings-block-head">
                  <div>
                    <strong>字段权限</strong>
                    <p>{{ activePermissionMenu }} 的字段级控制，支持隐藏、只读、可编辑三种状态。</p>
                  </div>
                  <select v-model="activePermissionMenu" class="settings-inline-select">
                    <option v-for="menu in rdMenuOptions" :key="menu">{{ menu }}</option>
                  </select>
                </div>
                <div class="settings-field-list">
                  <article v-for="field in activeRdFieldOptions" :key="field" class="settings-field-row">
                    <strong>{{ field }}</strong>
                    <div class="settings-segmented">
                      <button
                        v-for="state in fieldPermissionStates"
                        :key="state.key"
                        :class="{ on: fieldPermissionState(field) === state.key }"
                        type="button"
                        @click="setFieldPermissionState(field, state.key)"
                      >
                        {{ state.label }}
                      </button>
                    </div>
                  </article>
                </div>
              </section>

              <section v-else class="settings-permission-block">
                <div class="settings-block-head">
                  <div>
                    <strong>数据权限</strong>
                    <p>控制当前岗位在部门、区域、客户、项目、文档、物料、BOM 维度的数据可见范围。</p>
                  </div>
                  <button class="aw-tool-btn" type="button" @click="openDataPermission(selectedDataPermission)">编辑规则</button>
                </div>
                <div class="settings-data-rules">
                  <label v-for="field in dataScopeFields" :key="field.key" class="aw-field">
                    <span>{{ field.label }}</span>
                    <select
                      :value="String(selectedDataPermission?.[field.key] || field.options[0])"
                      @change="setDataScopeValue(field.key, ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="option in field.options" :key="option">{{ option }}</option>
                    </select>
                  </label>
                </div>
              </section>
            </section>
          </div>

          <div v-else class="settings-account-auth">
            <div class="aw-tabs">
              <button
                v-for="tab in accountPermissionTabs"
                :key="tab.key"
                :class="['t', { on: activeAccountPermissionTab === tab.key }]"
                type="button"
                @click="activeAccountPermissionTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <section v-if="activeAccountPermissionTab === 'byFunction'" class="settings-account-layout">
              <aside class="settings-tree-panel">
                <div class="settings-tree-head">
                  <strong>系统功能</strong>
                  <input v-model="functionAuthKeyword" placeholder="搜索功能" />
                </div>
                <button
                  v-for="node in functionMenuNodes"
                  :key="node.node.key"
                  :class="['settings-tree-row', `level-${node.level}`, { on: selectedFunctionMenuId === node.node.menuId }]"
                  type="button"
                  @click="selectFunctionMenu(node.node.menuId || '')"
                >
                  <span>{{ node.node.label }}</span>
                </button>
              </aside>

              <section class="settings-auth-main">
                <div class="settings-block-head">
                  <div>
                    <strong>{{ selectedFunctionMenu?.label || '请选择功能菜单' }}</strong>
                    <p>查看当前功能已授权账号，可新增授权、删除单个授权或删除所有授权。</p>
                  </div>
                  <div class="settings-role-actions">
                    <button class="aw-tool-btn" type="button" @click="openFunctionAuthorization">新增授权</button>
                    <button class="aw-tool-btn danger" type="button" @click="deleteAllFunctionAuthorization">删除所有授权</button>
                  </div>
                </div>
                <table class="aw-table">
                  <thead>
                    <tr><th>账号</th><th>姓名</th><th>部门</th><th>手机号</th><th>操作权限</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in authorizedAccountsByFunction" :key="row.id">
                      <td>{{ row.userName }}</td>
                      <td>{{ row.fullName }}</td>
                      <td>{{ row.departmentName }}</td>
                      <td>{{ row.mobile }}</td>
                      <td>{{ row.buttonNames.join('、') }}</td>
                      <td><span class="aw-link" style="color:var(--aw-danger)" @click="deleteFunctionAuthorization(row.id)">删除</span></td>
                    </tr>
                    <tr v-if="authorizedAccountsByFunction.length === 0">
                      <td colspan="6" class="settings-empty">暂无授权账号</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </section>

            <section v-else-if="activeAccountPermissionTab === 'byAccount'" class="settings-account-layout">
              <aside class="settings-tree-panel">
                <div class="settings-tree-head">
                  <strong>组织账号</strong>
                  <input v-model="accountAuthKeyword" placeholder="搜索账号" />
                </div>
                <button
                  v-for="node in accountTreeRows"
                  :key="node.node.key"
                  :class="['settings-tree-row', `level-${node.level}`, { on: selectedAccountId === node.node.accountId, muted: node.node.type === 'department' }]"
                  type="button"
                  @click="node.node.type === 'account' && selectAccount(node.node.accountId || '')"
                >
                  <span>{{ node.node.label }}</span>
                </button>
              </aside>

              <section class="settings-auth-main">
                <div class="settings-block-head">
                  <div>
                    <strong>{{ selectedAccount?.fullName || '请选择账号' }}</strong>
                    <p>勾选菜单按钮权限后保存，复制他人权限会合并到当前账号待保存权限中。</p>
                  </div>
                  <div class="settings-role-actions">
                    <input v-model="permissionTreeKeyword" class="settings-inline-input" placeholder="搜索功能菜单" />
                    <button class="aw-tool-btn" type="button" @click="openCopyPermission('account')">复制他人权限</button>
                    <button class="aw-btn primary" type="button" @click="saveAccountPermissions">保存</button>
                  </div>
                </div>
                <div class="settings-permission-picker">
                  <div class="settings-check-tree">
                    <div
                      v-for="node in permissionTreeRows"
                      :key="node.node.key"
                      :class="['settings-check-row', `level-${node.level}`, `type-${node.node.type}`]"
                    >
                      <input
                        v-if="node.node.type === 'button'"
                        :checked="selectedAccountPermissionKeys.includes(node.node.key)"
                        type="checkbox"
                        @change="toggleAccountPermissionKey(node.node.key)"
                      />
                      <input
                        v-else-if="node.node.type === 'menu'"
                        :checked="isPermissionMenuChecked(node.node, selectedAccountPermissionKeys)"
                        type="checkbox"
                        @change="togglePermissionMenu(node.node, selectedAccountPermissionKeys)"
                      />
                      <span>{{ node.node.label }}</span>
                    </div>
                  </div>
                  <table class="aw-table">
                    <thead><tr><th>功能菜单</th><th>操作按钮</th></tr></thead>
                    <tbody>
                      <tr v-for="row in selectedAccountPermissionDetails" :key="row.key">
                        <td>{{ row.menuName }}</td>
                        <td>{{ row.buttonName }}</td>
                      </tr>
                      <tr v-if="selectedAccountPermissionDetails.length === 0">
                        <td colspan="2" class="settings-empty">暂无已选权限</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </section>

            <section v-else-if="activeAccountPermissionTab === 'batch'" class="settings-account-layout">
              <aside class="settings-tree-panel">
                <div class="settings-tree-head">
                  <strong>批量账号</strong>
                  <input v-model="batchAccountKeyword" placeholder="搜索账号" />
                </div>
                <label v-for="node in batchAccountTreeRows" :key="node.node.key" :class="['settings-check-row', `level-${node.level}`, { muted: node.node.type === 'department' }]">
                  <input
                    v-if="node.node.type === 'account'"
                    :checked="batchSelectedAccountIds.includes(node.node.accountId || '')"
                    type="checkbox"
                    @change="toggleBatchAccount(node.node.accountId || '')"
                  />
                  <span>{{ node.node.label }}</span>
                </label>
              </aside>

              <section class="settings-auth-main">
                <div class="settings-block-head">
                  <div>
                    <strong>批量授权</strong>
                    <p>已选 {{ batchSelectedAccountIds.length }} 个账号、{{ batchSelectedPermissionKeys.length }} 个权限，保存后按合并授权写入账号权限。</p>
                  </div>
                  <div class="settings-role-actions">
                    <input v-model="batchPermissionKeyword" class="settings-inline-input" placeholder="搜索功能菜单" />
                    <button class="aw-tool-btn" type="button" @click="openCopyPermission('batch')">复制他人权限</button>
                    <button class="aw-btn primary" type="button" @click="saveBatchPermissions">保存</button>
                  </div>
                </div>
                <div class="settings-permission-picker">
                  <div class="settings-check-tree">
                    <div
                      v-for="node in batchPermissionTreeRows"
                      :key="node.node.key"
                      :class="['settings-check-row', `level-${node.level}`, `type-${node.node.type}`]"
                    >
                      <input
                        v-if="node.node.type === 'button'"
                        :checked="batchSelectedPermissionKeys.includes(node.node.key)"
                        type="checkbox"
                        @change="toggleBatchPermission(node.node.key)"
                      />
                      <input
                        v-else-if="node.node.type === 'menu'"
                        :checked="isPermissionMenuChecked(node.node, batchSelectedPermissionKeys)"
                        type="checkbox"
                        @change="togglePermissionMenu(node.node, batchSelectedPermissionKeys)"
                      />
                      <span>{{ node.node.label }}</span>
                    </div>
                  </div>
                  <table class="aw-table">
                    <thead><tr><th>功能菜单</th><th>操作按钮</th></tr></thead>
                    <tbody>
                      <tr v-for="row in batchPermissionDetails" :key="row.key">
                        <td>{{ row.menuName }}</td>
                        <td>{{ row.buttonName }}</td>
                      </tr>
                      <tr v-if="batchPermissionDetails.length === 0">
                        <td colspan="2" class="settings-empty">暂无已选权限</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </section>

            <section v-else class="settings-auth-main">
              <div class="settings-block-head">
                <div>
                  <strong>超级管理员</strong>
                  <p>只维护超级管理员权限身份，不承担普通账号新增、编辑、停用等账号 CRUD。</p>
                </div>
                <div class="settings-role-actions">
                  <input v-model="superAdminKeyword" class="settings-inline-input" placeholder="账号、姓名、部门" />
                  <button class="aw-tool-btn" type="button" @click="querySuperAdmins">查询</button>
                  <button class="aw-btn primary" type="button" @click="openSuperAdminModal">新增超级管理员</button>
                </div>
              </div>
              <table class="aw-table">
                <thead><tr><th>用户账号</th><th>用户姓名</th><th>部门岗位</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="row in filteredSuperAdmins" :key="row.id">
                    <td>{{ row.userName }}</td>
                    <td>{{ row.name }}</td>
                    <td>{{ row.deptAndPost }}</td>
                    <td><span class="aw-link" style="color:var(--aw-danger)" @click="deleteSuperAdmin(row.id)">删除</span></td>
                  </tr>
                  <tr v-if="filteredSuperAdmins.length === 0">
                    <td colspan="4" class="settings-empty">暂无超级管理员</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </template>

        <template v-else-if="currentSection === 'security'">
          <div class="settings-card-grid">
            <section v-for="rule in filteredSecurityRules" :key="rule.id" class="settings-panel">
              <div class="settings-panel-head">
                <strong>{{ rule.type }}</strong>
                <label class="aw-switch-line mini">
                  <input v-model="rule.enabled" type="checkbox" />
                  <i></i>
                </label>
              </div>
              <p>{{ rule.detail }}</p>
              <em>{{ rule.scope }} · {{ rule.owner }}</em>
              <div class="settings-actions">
                <button class="aw-tool-btn" type="button" @click="openSecurityRule(rule)">配置</button>
                <button class="aw-tool-btn" type="button" @click="toast(`${rule.type}规则已测试`)">测试规则</button>
              </div>
            </section>
          </div>
        </template>

        <template v-else-if="currentSection === 'data'">
          <div class="aw-tabs">
            <button :class="['t', { on: activeDataTab === 'logs' }]" type="button" @click="activeDataTab = 'logs'">操作日志 / 审计</button>
          </div>
          <aw-setting-table
            v-if="activeDataTab === 'logs'"
            :columns="auditColumns"
            :rows="auditLogTableRows"
            @delete="noopDelete"
            @edit="openAuditLog"
          >
            <template #actions="{ row }">
              <span class="aw-link" @click="openAuditLog(row)">查看详情</span>
              <span class="aw-action-split">|</span>
              <span class="aw-link" @click="toast('审计日志已导出')">导出</span>
            </template>
          </aw-setting-table>
          <aw-setting-table
            v-else
            :columns="dataTaskColumns"
            :rows="dataTaskTableRows"
            @delete="removeDataTask"
            @edit="openDataTask"
          >
            <template #actions="{ row }">
              <span class="aw-link" @click="runDataTask(row)">立即执行</span>
              <span class="aw-action-split">|</span>
              <span class="aw-link" @click="openDataTask(row)">查看详情</span>
            </template>
          </aw-setting-table>
        </template>

        <template v-else-if="currentSection === 'integrations'">
          <div class="aw-tabs">
            <button :class="['t', { on: activeIntegrationTab === 'partners' }]" type="button" @click="activeIntegrationTab = 'partners'">第三方对接</button>
          </div>
          <aw-setting-table
            v-if="activeIntegrationTab === 'partners'"
            :columns="partnerColumns"
            :rows="partnerTableRows"
            @delete="removePartner"
            @edit="openPartner"
          >
            <template #actions="{ row }">
              <span class="aw-link" @click="openPartner(row)">查看</span>
            </template>
          </aw-setting-table>
          <aw-setting-table
            v-else-if="activeIntegrationTab === 'apis'"
            :columns="apiColumns"
            :rows="apiKeyTableRows"
            @delete="removeApiKey"
            @edit="openApiKey"
          >
            <template #cell="{ column, row }">
              <label v-if="column.key === 'enabled'" class="aw-switch-line mini">
                <input v-model="row.enabled" type="checkbox" />
                <i></i>
              </label>
              <span v-else>{{ row[column.key] }}</span>
            </template>
            <template #actions="{ row }">
              <span class="aw-link" @click="resetApiKey(row)">重置密钥</span>
              <span class="aw-action-split">|</span>
              <span class="aw-link" @click="openApiKey(row)">授权范围</span>
            </template>
          </aw-setting-table>
          <aw-setting-table
            v-else
            :columns="syncColumns"
            :rows="syncTaskTableRows"
            @delete="removeSyncTask"
            @edit="openSyncTask"
          >
            <template #actions="{ row }">
              <span class="aw-link" @click="runSyncTask(row)">立即执行</span>
              <span class="aw-action-split">|</span>
              <span class="aw-link" @click="openSyncTask(row)">查看明细</span>
            </template>
          </aw-setting-table>
        </template>

        <template v-else-if="currentSection === 'guide'">
          <div class="settings-guide">
            <aside>
              <button
                v-for="module in data.guide.modules"
                :key="module.key"
                :class="{ on: activeGuideKey === module.key }"
                type="button"
                @click="activeGuideKey = module.key"
              >
                <span>{{ module.name }}</span>
                <em>{{ guideProgress(module) }}%</em>
              </button>
            </aside>
            <section>
              <div class="settings-guide-head">
                <div>
                  <strong>{{ activeGuide.name }}</strong>
                  <p>{{ activeGuide.focus }}</p>
                </div>
                <button class="aw-tool-btn" type="button" @click="openGuideModal('新增引导')">新增引导</button>
                <button class="aw-btn primary" type="button" @click="publishGuide">发布校验</button>
              </div>
              <div class="aw-tabs">
                <button
                  v-for="tab in guideTabs"
                  :key="tab.key"
                  :class="['t', { on: activeGuideTab === tab.key }]"
                  type="button"
                  @click="activeGuideTab = tab.key"
                >
                  {{ tab.label }}
                </button>
              </div>
              <div v-if="activeGuideTab === 'overview'" class="settings-step-grid">
                <div v-for="(step, index) in activeGuide.steps" :key="step" class="settings-step-card">
                  <strong>{{ index + 1 }}</strong>
                  <span>{{ step }}</span>
                  <em>{{ index < activeGuide.doneCount ? '已完成基础配置' : '待按模板继续完善' }}</em>
                </div>
              </div>
              <table v-else-if="activeGuideTab === 'tasks'" class="aw-table">
                <thead><tr><th>任务名称</th><th>负责人</th><th>依赖项</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="(step, index) in activeGuide.steps" :key="step">
                    <td>{{ activeGuide.name }} · {{ step }}</td>
                    <td>{{ activeGuide.owner }}</td>
                    <td>{{ index === 0 ? '无' : activeGuide.steps[index - 1] }}</td>
                    <td>{{ index < activeGuide.doneCount ? '已完成' : '待处理' }}</td>
                    <td><span class="aw-link" @click="finishGuideStep(index)">完成</span></td>
                  </tr>
                </tbody>
              </table>
              <div v-else-if="activeGuideTab === 'templates'" class="settings-card-grid">
                <section v-for="name in ['标准初始化模板', '轻量审批模板', '精细化管控模板']" :key="name" class="settings-panel">
                  <strong>{{ name }}</strong>
                  <p>适用于{{ activeGuide.name }}的上线初始化场景</p>
                  <button class="aw-btn primary" type="button" @click="applyGuideTemplate(name)">套用模板</button>
                </section>
              </div>
              <table v-else class="aw-table">
                <thead><tr><th>校验项</th><th>结果</th><th>说明</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-for="(name, index) in ['编码规则', '分类字段', '审批流程', '打印策略']" :key="name">
                    <td>{{ activeGuide.name }} · {{ name }}</td>
                    <td>{{ index < activeGuide.doneCount - 1 ? '已配置' : '待完善' }}</td>
                    <td>{{ index < activeGuide.doneCount - 1 ? '满足发布要求' : '发布前建议补齐' }}</td>
                    <td><span class="aw-link" @click="openGuideModal(name)">查看</span></td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </template>
      </aw-setting-list-card>
    </section>

    <aw-setting-modal
      :open="functionAuthorizationModal.open"
      title="新增授权"
      width="760px"
      @cancel="closeFunctionAuthorization"
      @confirm="confirmFunctionAuthorization"
    >
      <div class="settings-modal-stack">
        <div class="settings-modal-tip">当前授权功能：{{ selectedFunctionMenu?.label || '未选择功能' }}</div>
        <section>
          <strong>操作按钮</strong>
          <div class="settings-modal-check-grid">
            <label v-for="button in selectedFunctionButtons" :key="button.key" class="settings-check-row">
              <input
                :checked="functionAuthorizationModal.buttonKeys.includes(button.key)"
                type="checkbox"
                @change="toggleFunctionAuthorizationButton(button.key)"
              />
              <span>{{ button.label }}</span>
            </label>
          </div>
        </section>
        <section>
          <strong>授权账号</strong>
          <div class="settings-modal-check-grid">
            <label v-for="account in accountOptions" :key="account.accountId" class="settings-check-row">
              <input
                :checked="functionAuthorizationModal.accountIds.includes(account.accountId || '')"
                type="checkbox"
                @change="toggleFunctionAuthorizationAccount(account.accountId || '')"
              />
              <span>{{ account.userName }} / {{ account.fullName }} / {{ account.departmentName }}</span>
            </label>
          </div>
        </section>
        <div class="settings-modal-tip">已选 {{ functionAuthorizationModal.accountIds.length }} 个账号</div>
      </div>
    </aw-setting-modal>

    <aw-setting-modal
      :open="copyPermissionModal.open"
      title="复制他人权限"
      width="720px"
      @cancel="closeCopyPermission"
      @confirm="confirmCopyPermission"
    >
      <div class="settings-modal-stack">
        <div class="settings-modal-tip">选择要复制权限的账号，确认后会合并到当前待保存权限中。</div>
        <div class="settings-modal-check-grid">
          <label v-for="account in accountOptions" :key="account.accountId" class="settings-check-row">
            <input
              :checked="copyPermissionModal.accountIds.includes(account.accountId || '')"
              type="checkbox"
              @change="toggleCopyAccount(account.accountId || '')"
            />
            <span>{{ account.userName }} / {{ account.fullName }} / {{ account.departmentName }}</span>
          </label>
        </div>
      </div>
    </aw-setting-modal>

    <aw-setting-modal
      :open="superAdminModal.open"
      title="新增超级管理员"
      width="640px"
      @cancel="closeSuperAdminModal"
      @confirm="confirmSuperAdmin"
    >
      <div class="settings-modal-stack">
        <div class="settings-modal-tip">请选择一个账号设置为超级管理员。</div>
        <label class="aw-field">
          <span>账号</span>
          <select v-model="superAdminModal.accountId">
            <option value="">请选择账号</option>
            <option v-for="account in accountOptions" :key="account.accountId" :value="account.accountId">
              {{ account.userName }} / {{ account.fullName }} / {{ account.departmentName }}
            </option>
          </select>
        </label>
      </div>
    </aw-setting-modal>

    <aw-setting-modal
      :open="modal.open"
      :title="modal.title"
      width="720px"
      @cancel="closeModal"
      @confirm="confirmModal"
    >
      <div v-if="modal.kind === 'message'" class="settings-modal-message">{{ modal.message }}</div>
      <div v-else class="settings-form-grid">
        <label
          v-for="field in modalFields"
          :key="field.key"
          :class="['aw-field', { 'settings-field-full': field.span === 'full' }]"
        >
          <span>{{ field.label }}</span>
          <select
            v-if="field.options"
            :value="String(modal.form[field.key] ?? '')"
            @change="setModalValue(field.key, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="option in field.options" :key="option">{{ option }}</option>
          </select>
          <textarea
            v-else-if="field.type === 'textarea'"
            :value="String(modal.form[field.key] ?? '')"
            rows="3"
            @input="setModalValue(field.key, ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
          <input
            v-else
            :value="String(modal.form[field.key] ?? '')"
            @input="setModalValue(field.key, ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>
    </aw-setting-modal>

    <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwSettingListCard from '@/components/setting-page/AwSettingListCard.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingTable from '@/components/setting-page/AwSettingTable.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import { getSettingsCenterData, saveSettingsCenterData } from '@/app/api/settings/resources';
import type {
  AccountPermissionRow,
  AccountTreeNode,
  ApiKeyRow,
  AuditLogRow,
  DataPermissionRow,
  DataTaskRow,
  GuideModule,
  IntegrationRow,
  NotificationRule,
  PermissionTreeNode,
  PermissionScopeRow,
  RoleRow,
  SecurityRule,
  SettingsCenterData,
  SettingsSectionKey,
  SuperAdminRow,
  SyncTaskRow,
} from '@/app/api/settings/types';
import type { SettingTableColumn, SettingTableRow } from '@/components/setting-page/types';

type ModalField = { key: string; label: string; type?: 'textarea'; options?: string[]; span?: 'full' };
type PermissionMode = 'role' | 'account';
type AccountPermissionTabKey = 'byFunction' | 'byAccount' | 'batch' | 'superAdmin';
type FlatNode<T> = { node: T; level: number; platformName?: string; menuName?: string };
type PermissionDetail = { key: string; platformId: string; platformName: string; menuId: string; menuName: string; buttonName: string };

const router = useRouter();
const route = useRoute();
const keyword = ref('');
const toastText = ref('');
const activePermissionMode = ref<PermissionMode>('role');
const activePermissionTab = ref<'menus' | 'actions' | 'fields' | 'data'>('menus');
const activeAccountPermissionTab = ref<AccountPermissionTabKey>('byFunction');
const selectedRoleId = ref('');
const selectedFunctionPermissionId = ref('');
const activePermissionMenu = ref('项目管理');
const selectedFunctionMenuId = ref('');
const selectedAccountId = ref('');
const selectedAccountPermissionKeys = ref<string[]>([]);
const batchSelectedAccountIds = ref<string[]>([]);
const batchSelectedPermissionKeys = ref<string[]>([]);
const functionAuthKeyword = ref('');
const accountAuthKeyword = ref('');
const permissionTreeKeyword = ref('');
const batchAccountKeyword = ref('');
const batchPermissionKeyword = ref('');
const superAdminKeyword = ref('');
const activeDataTab = ref<'logs' | 'tasks'>('logs');
const activeIntegrationTab = ref<'partners' | 'apis' | 'syncs'>('partners');
const activeGuideTab = ref<'overview' | 'tasks' | 'templates' | 'progress'>('overview');
const activeGuideKey = ref('rd');

const defaultData: SettingsCenterData = {
  system: {
    company: {
      company: '',
      shortName: '',
      unifiedCode: '',
      industry: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      logoText: '',
    },
    notifications: [],
  },
  permissions: { roles: [], functionPermissions: [], dataPermissions: [], accountTree: [], permissionTree: [], accountPermissions: [], superAdmins: [] },
  security: { rules: [] },
  data: { auditLogs: [], tasks: [] },
  integrations: { partners: [], apiKeys: [], syncTasks: [] },
  guide: { modules: [] },
};

const data = reactive<SettingsCenterData>(defaultData);
const modal = reactive({
  open: false,
  kind: 'form' as 'form' | 'message',
  title: '',
  message: '',
  target: '' as string,
  id: '',
  form: {} as Record<string, string | number | boolean>,
});
const modalFields = ref<ModalField[]>([]);
const functionAuthorizationModal = reactive({
  open: false,
  accountIds: [] as string[],
  buttonKeys: [] as string[],
});
const copyPermissionModal = reactive({
  open: false,
  target: 'account' as 'account' | 'batch',
  accountIds: [] as string[],
});
const superAdminModal = reactive({
  open: false,
  accountId: '',
});

const sectionMeta: Record<SettingsSectionKey, { label: string; route: string; desc: string; addText: string; search: string }> = {
  system: { label: '系统设置', route: '/settings/system', desc: '企业信息 / Logo', addText: '保存企业信息', search: '搜索企业信息、Logo、企业资料' },
  permissions: { label: '权限管理', route: '/settings/permissions', desc: '以研发中心为例，按岗位配置菜单 / Tab / 操作 / 字段权限和数据范围', addText: '新增岗位', search: '搜索岗位、菜单、字段、数据范围' },
  security: { label: '安全中心', route: '/settings/security', desc: '密码策略、登录限制、双因子认证', addText: '新增安全规则', search: '搜索安全项、适用范围、负责人' },
  data: { label: '日志与数据', route: '/settings/data', desc: '操作日志 / 审计、数据备份、导入 / 导出', addText: '新增数据任务', search: '搜索日志、任务、操作人' },
  integrations: { label: '集成与接口', route: '/settings/integrations', desc: '第三方对接、开放 API / 密钥管理、数据同步配置', addText: '新增集成配置', search: '搜索系统、应用、同步任务' },
  guide: { label: '初始化引导', route: '/settings/guide', desc: '引导总览、配置任务、引导模板、进度校验', addText: '新增引导', search: '搜索模块、任务、模板' },
};

const sectionCards = [
  sectionMeta.system,
  { label: '用户账号', route: '/settings/accounts', desc: '维护登录账号、组织归属、岗位与账号状态', addText: '新增账号', search: '' },
  { label: '角色管理', route: '/settings/roles', desc: '维护角色基础资料、成员数量和启停状态', addText: '新增角色', search: '' },
  { label: '权限资源', route: '/settings/permission-resources', desc: '维护菜单、按钮、字段权限项和数据权限规则', addText: '新增资源', search: '' },
  { label: '权限设置', route: '/settings/permissions', desc: '按账号、批量、按功能和角色配置授权关系', addText: '保存授权', search: '' },
  { label: '超级管理员', route: '/settings/super-admins', desc: '独立维护系统超级管理员身份', addText: '新增超级管理员', search: '' },
  sectionMeta.security,
  sectionMeta.data,
  sectionMeta.integrations,
].map((item, index) => ({ key: `${item.route}-${index}`, ...item }));
const currentSection = computed<SettingsSectionKey>(() => {
  const section = String(route.path.split('/')[2] || '');
  if (['system', 'security', 'data', 'integrations'].includes(section)) return section as SettingsSectionKey;
  return 'system';
});
const currentTitle = computed(() => sectionMeta[currentSection.value].label);
const currentDescription = computed(() => sectionMeta[currentSection.value].desc);
const currentSearchPlaceholder = computed(() => sectionMeta[currentSection.value].search);
const currentAddText = computed(() => {
  if (currentSection.value === 'permissions' && activePermissionMode.value === 'account') {
    if (activeAccountPermissionTab.value === 'byFunction') return '新增授权';
    if (activeAccountPermissionTab.value === 'superAdmin') return '新增超级管理员';
    return '账号授权';
  }
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'menus') return '新增岗位';
  if (currentSection.value === 'permissions' && ['actions', 'fields'].includes(activePermissionTab.value)) return '新增权限项';
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'data') return '新增数据权限';
  if (currentSection.value === 'integrations' && activeIntegrationTab.value === 'apis') return '新增 API 应用';
  return sectionMeta[currentSection.value].addText;
});

const companyFields: Array<{ key: keyof SettingsCenterData['system']['company']; label: string }> = [
  { key: 'company', label: '企业名称' },
  { key: 'shortName', label: '系统简称' },
  { key: 'unifiedCode', label: '统一社会信用代码' },
  { key: 'industry', label: '所属行业' },
  { key: 'contact', label: '联系人' },
  { key: 'phone', label: '联系电话' },
  { key: 'email', label: '系统邮箱' },
  { key: 'address', label: '企业地址' },
];

const permissionTabs = [
  { key: 'menus', label: '菜单权限' },
  { key: 'actions', label: '操作权限' },
  { key: 'fields', label: '字段权限' },
  { key: 'data', label: '数据权限' },
] as const;
const accountPermissionTabs: Array<{ key: AccountPermissionTabKey; label: string }> = [
  { key: 'byFunction', label: '按功能授权账号' },
  { key: 'byAccount', label: '按账号设置权限' },
  { key: 'batch', label: '批量授权' },
  { key: 'superAdmin', label: '超级管理员' },
];
const guideTabs = [
  { key: 'overview', label: '引导总览' },
  { key: 'tasks', label: '配置任务' },
  { key: 'templates', label: '引导模板' },
  { key: 'progress', label: '进度校验' },
] as const;
const permissionActionKeys = ['view', 'create', 'edit', 'delete', 'import', 'export', 'approve'] as const;
type PermissionActionKey = typeof permissionActionKeys[number];
type FieldPermissionState = 'hidden' | 'readonly' | 'edit';
type DataScopeKey = 'department' | 'region' | 'customerScope' | 'projectScope' | 'documentScope' | 'materialScope' | 'bomScope';
const permissionActionOptions: Array<{ key: PermissionActionKey; label: string; desc: string }> = [
  { key: 'view', label: '查看', desc: '打开页面、查看列表与详情' },
  { key: 'create', label: '新增', desc: '新建单据、BOM、文档或项目' },
  { key: 'edit', label: '编辑', desc: '修改基础信息和业务明细' },
  { key: 'delete', label: '删除', desc: '删除草稿或未发布记录' },
  { key: 'import', label: '导入', desc: 'Excel 导入和批量导入' },
  { key: 'export', label: '导出', desc: '导出列表、明细和附件' },
  { key: 'approve', label: '审批', desc: '提交、审核、发布和冻结' },
];
const fieldPermissionStates: Array<{ key: FieldPermissionState; label: string }> = [
  { key: 'hidden', label: '隐藏' },
  { key: 'readonly', label: '只读' },
  { key: 'edit', label: '可编辑' },
];
const dataScopeFields: Array<{ key: DataScopeKey; label: string; options: string[] }> = [
  { key: 'department', label: '部门范围', options: ['全部研发部门', '本部门及下级', '本人所在部门'] },
  { key: 'region', label: '区域范围', options: ['全部区域', '负责区域', '本人负责区域'] },
  { key: 'customerScope', label: '客户范围', options: ['全部客户', '负责客户及协作客户', '项目关联客户'] },
  { key: 'projectScope', label: '项目范围', options: ['全部项目', '本部门项目及下级项目', '本人负责或参与项目'] },
  { key: 'documentScope', label: '文档范围', options: ['全部文档分类', '本部门文档分类', '本人创建 / 协作文档'] },
  { key: 'materialScope', label: '产品 / 物料范围', options: ['全部产品 / 物料', '本部门维护产品 / 物料', '本人维护产品 / 物料'] },
  { key: 'bomScope', label: 'BOM 范围', options: ['全部 BOM 与替代料', '本部门项目 BOM', '本人维护 BOM 与替代料'] },
];
const departmentOptions = ['仓储部', '生产一部', '装配车间', '质检部', '人力资源部', '设备部'];
const rdMenuOptions = ['文档库', '项目管理', '产品管理', '物料管理', '工序管理', '工艺管理', 'BOM管理'];
const rdTabOptions: Record<string, string[]> = {
  文档库: ['基本信息', '附件', '版本记录', '操作记录'],
  项目管理: ['基本信息', '项目成员', '项目BOM', '工艺流程', '报价', '采购', '生产', '费用', '操作记录'],
  产品管理: ['基本信息', '规格型号', 'BOM引用', '版本记录', '操作记录'],
  物料管理: ['基本信息', '库存引用', '替代料', '供应商', '操作记录'],
  工序管理: ['基本信息', '质检要求', '工时标准', '操作记录'],
  工艺管理: ['基本信息', '工艺路线', '工序明细', '物料消耗', '操作记录'],
  BOM管理: ['BOM列表', '替代料'],
};
const rdFieldOptions: Record<string, string[]> = {
  文档库: ['文档编号', '文档名称', '分类', '版本', '状态', '附件', '审批记录'],
  项目管理: ['项目编号', '项目名称', '客户', '负责人', '报价金额', '采购金额', '生产状态', '成本明细'],
  产品管理: ['产品编号', '产品名称', '规格型号', '产品分类', '版本', '状态'],
  物料管理: ['物料编码', '物料名称', '规格型号', '单位', '物料分类', '安全库存'],
  工序管理: ['工序编号', '工序名称', '工作中心', '标准工时', '质检要求'],
  工艺管理: ['工艺编号', '工艺名称', '版本', '工序路线', '委外标识', '状态'],
  BOM管理: ['BOM编号', 'BOM名称', '适用产品', '物料编码', '用量', '损耗率', '关联工序', '版本', '替代料'],
};

const roleColumns: SettingTableColumn[] = [
  { key: 'name', label: '岗位' },
  { key: 'center', label: '适用中心' },
  { key: 'users', label: '成员数', width: '90px' },
  { key: 'menu', label: '菜单权限' },
  { key: 'functionPolicy', label: '功能权限模板' },
  { key: 'dataPolicy', label: '数据权限模板' },
  { key: 'updated', label: '更新日期' },
  { key: 'enabled', label: '启用', width: '90px' },
];
const functionColumns: SettingTableColumn[] = [
  { key: 'role', label: '适用岗位' },
  { key: 'module', label: '模块' },
  { key: 'menu', label: '菜单' },
  { key: 'page', label: '页面' },
  { key: 'tabs', label: 'Tab 权限' },
  { key: 'fieldsView', label: '字段可见' },
  { key: 'fieldsEdit', label: '字段可编辑' },
  { key: 'view', label: '查看', width: '76px' },
  { key: 'create', label: '新增', width: '76px' },
  { key: 'edit', label: '编辑', width: '76px' },
  { key: 'delete', label: '删除', width: '76px' },
  { key: 'import', label: '导入', width: '76px' },
  { key: 'export', label: '导出', width: '76px' },
  { key: 'approve', label: '审批', width: '76px' },
];
const dataPermissionColumns: SettingTableColumn[] = [
  { key: 'name', label: '权限名称' },
  { key: 'role', label: '适用岗位' },
  { key: 'center', label: '适用中心' },
  { key: 'department', label: '部门范围' },
  { key: 'projectScope', label: '项目范围' },
  { key: 'documentScope', label: '文档范围' },
  { key: 'bomScope', label: 'BOM 范围' },
  { key: 'enabled', label: '生效', width: '90px' },
];
const auditColumns: SettingTableColumn[] = [
  { key: 'time', label: '操作时间' },
  { key: 'operator', label: '操作人' },
  { key: 'module', label: '所属模块' },
  { key: 'object', label: '操作对象' },
  { key: 'action', label: '动作' },
  { key: 'result', label: '结果' },
  { key: 'ip', label: '来源 IP' },
];
const dataTaskColumns: SettingTableColumn[] = [
  { key: 'id', label: '任务编号' },
  { key: 'type', label: '任务类型' },
  { key: 'scope', label: '数据范围' },
  { key: 'time', label: '执行时间' },
  { key: 'amount', label: '数据量' },
  { key: 'status', label: '状态' },
];
const partnerColumns: SettingTableColumn[] = [
  { key: 'name', label: '设备名称' },
  { key: 'type', label: '设备类型' },
  { key: 'method', label: '连接方式' },
  { key: 'status', label: '连接状态' },
  { key: 'lastSync', label: '最近同步' },
];
const apiColumns: SettingTableColumn[] = [
  { key: 'appName', label: '应用名称' },
  { key: 'appKey', label: 'AppKey' },
  { key: 'modules', label: '授权模块' },
  { key: 'expireAt', label: '到期时间' },
  { key: 'enabled', label: '启用', width: '90px' },
];
const syncColumns: SettingTableColumn[] = [
  { key: 'name', label: '任务名称' },
  { key: 'direction', label: '同步方向' },
  { key: 'object', label: '数据对象' },
  { key: 'cycle', label: '执行周期' },
  { key: 'result', label: '执行结果' },
  { key: 'status', label: '状态' },
];

const kw = computed(() => keyword.value.trim());
const filterByKeyword = <T extends Record<string, unknown>>(rows: T[]) => {
  if (!kw.value) return rows;
  return rows.filter((row) => Object.values(row).join(' ').includes(kw.value));
};

const filteredNotifications = computed(() => filterByKeyword(data.system.notifications as unknown as Record<string, unknown>[]) as unknown as NotificationRule[]);
const filteredRoles = computed(() => filterByKeyword(data.permissions.roles as unknown as Record<string, unknown>[]) as unknown as RoleRow[]);
const filteredFunctionPermissions = computed(() => filterByKeyword(data.permissions.functionPermissions as unknown as Record<string, unknown>[]) as unknown as PermissionScopeRow[]);
const filteredDataPermissions = computed(() => filterByKeyword(data.permissions.dataPermissions as unknown as Record<string, unknown>[]) as unknown as DataPermissionRow[]);
const filteredSecurityRules = computed(() => filterByKeyword(data.security.rules as unknown as Record<string, unknown>[]) as unknown as SecurityRule[]);
const filteredAuditLogs = computed(() => filterByKeyword(data.data.auditLogs as unknown as Record<string, unknown>[]) as unknown as AuditLogRow[]);
const filteredDataTasks = computed(() => filterByKeyword(data.data.tasks as unknown as Record<string, unknown>[]) as unknown as DataTaskRow[]);
const filteredPartners = computed(() => filterByKeyword(data.integrations.partners as unknown as Record<string, unknown>[]) as unknown as IntegrationRow[]);
const filteredApiKeys = computed(() => filterByKeyword(data.integrations.apiKeys as unknown as Record<string, unknown>[]) as unknown as ApiKeyRow[]);
const filteredSyncTasks = computed(() => filterByKeyword(data.integrations.syncTasks as unknown as Record<string, unknown>[]) as unknown as SyncTaskRow[]);
const roleTableRows = computed(() => filteredRoles.value as unknown as SettingTableRow[]);
const functionPermissionTableRows = computed(() => filteredFunctionPermissions.value as unknown as SettingTableRow[]);
const dataPermissionTableRows = computed(() => filteredDataPermissions.value as unknown as SettingTableRow[]);
const auditLogTableRows = computed(() => filteredAuditLogs.value as unknown as SettingTableRow[]);
const dataTaskTableRows = computed(() => filteredDataTasks.value as unknown as SettingTableRow[]);
const partnerTableRows = computed(() => filteredPartners.value as unknown as SettingTableRow[]);
const apiKeyTableRows = computed(() => filteredApiKeys.value as unknown as SettingTableRow[]);
const syncTaskTableRows = computed(() => filteredSyncTasks.value as unknown as SettingTableRow[]);
const accountOptions = computed(() => flattenAccounts(data.permissions.accountTree).filter((item) => item.accountId));
const permissionButtons = computed(() => flattenPermissionButtons(data.permissions.permissionTree));
const permissionMenus = computed(() => flattenPermissionMenus(data.permissions.permissionTree));
const accountTreeRows = computed(() => flattenAccountTree(data.permissions.accountTree, accountAuthKeyword.value));
const batchAccountTreeRows = computed(() => flattenAccountTree(data.permissions.accountTree, batchAccountKeyword.value));
const functionMenuNodes = computed(() => flattenPermissionMenus(data.permissions.permissionTree, functionAuthKeyword.value));
const permissionButtonRows = computed(() => flattenPermissionButtons(data.permissions.permissionTree, permissionTreeKeyword.value));
const batchPermissionButtonRows = computed(() => flattenPermissionButtons(data.permissions.permissionTree, batchPermissionKeyword.value));
const permissionTreeRows = computed(() => flattenPermissionTree(data.permissions.permissionTree, permissionTreeKeyword.value));
const batchPermissionTreeRows = computed(() => flattenPermissionTree(data.permissions.permissionTree, batchPermissionKeyword.value));
const selectedFunctionMenu = computed(() => permissionMenus.value.find((item) => item.node.menuId === selectedFunctionMenuId.value)?.node);
const selectedFunctionButtons = computed(() => permissionButtons.value.filter((item) => item.node.menuId === selectedFunctionMenuId.value).map((item) => item.node));
const authorizedAccountsByFunction = computed(() => data.permissions.accountPermissions.filter((item) => item.menuId === selectedFunctionMenuId.value));
const selectedAccount = computed(() => accountOptions.value.find((item) => item.accountId === selectedAccountId.value));
const selectedAccountPermissionDetails = computed(() => permissionDetailsFromKeys(selectedAccountPermissionKeys.value));
const batchPermissionDetails = computed(() => permissionDetailsFromKeys(batchSelectedPermissionKeys.value));
const filteredSuperAdmins = computed(() => {
  const keywordValue = superAdminKeyword.value.trim();
  if (!keywordValue) return data.permissions.superAdmins;
  return data.permissions.superAdmins.filter((item) => [item.userName, item.name, item.deptAndPost].join(' ').includes(keywordValue));
});
const selectedRole = computed(() => data.permissions.roles.find((item) => item.id === selectedRoleId.value) || filteredRoles.value[0] || data.permissions.roles[0]);
const selectedRoleFunctions = computed(() => {
  if (!selectedRole.value) return [];
  return filteredFunctionPermissions.value.filter((item) => item.role === selectedRole.value.name);
});
const selectedDataPermission = computed(() => {
  if (!selectedRole.value) return undefined;
  return data.permissions.dataPermissions.find((item) => item.role === selectedRole.value?.name);
});
const activeMenuPermission = computed(() => {
  if (!selectedRole.value) return undefined;
  return data.permissions.functionPermissions.find((item) => item.role === selectedRole.value?.name && item.menu === activePermissionMenu.value);
});
const selectedFunctionPermission = computed(() => {
  const fallback = selectedRoleFunctions.value[0] || filteredFunctionPermissions.value[0];
  const selected = data.permissions.functionPermissions.find((item) => item.id === selectedFunctionPermissionId.value);
  return selected || fallback;
});
const activeRdTabOptions = computed(() => {
  const menu = selectedFunctionPermission.value?.menu || '项目管理';
  return rdTabOptions[menu] || [];
});
const activeRdFieldOptions = computed(() => {
  const menu = activePermissionMenu.value || selectedFunctionPermission.value?.menu || '项目管理';
  return rdFieldOptions[menu] || [];
});
const permissionSummary = computed(() => {
  const functionCount = data.permissions.functionPermissions.length;
  const fieldViewCount = data.permissions.functionPermissions.reduce((sum, item) => sum + item.fieldsView.length, 0);
  const fieldEditCount = data.permissions.functionPermissions.reduce((sum, item) => sum + item.fieldsEdit.length, 0);
  return [
    { label: '研发岗位', value: data.permissions.roles.length, desc: '管理员 / 主管 / 工程师 / 只读' },
    { label: '菜单与页面', value: functionCount, desc: '覆盖研发中心核心菜单和页面 Tab' },
    { label: '字段级控制', value: `${fieldViewCount}/${fieldEditCount}`, desc: '可见字段 / 可编辑字段' },
    { label: '数据范围', value: data.permissions.dataPermissions.length, desc: '部门、项目、文档、BOM 范围' },
  ];
});
const selectedRoleSummary = computed(() => {
  const role = selectedRole.value;
  const menus = selectedRoleFunctions.value.length;
  const fieldViewCount = selectedRoleFunctions.value.reduce((sum, item) => sum + item.fieldsView.length, 0);
  const fieldEditCount = selectedRoleFunctions.value.reduce((sum, item) => sum + item.fieldsEdit.length, 0);
  return [
    { label: '菜单权限', value: menus, desc: role?.menu || '未配置菜单' },
    { label: '操作策略', value: role?.functionPolicy || '未配置', desc: '按菜单维护按钮级权限' },
    { label: '字段控制', value: `${fieldViewCount}/${fieldEditCount}`, desc: '可见字段 / 可编辑字段' },
    { label: '数据规则', value: selectedDataPermission.value ? '已配置' : '待配置', desc: role?.dataPolicy || '未配置数据范围' },
  ];
});
const activeGuide = computed(() => data.guide.modules.find((item) => item.key === activeGuideKey.value) || data.guide.modules[0] || {
  key: '',
  name: '',
  owner: '',
  focus: '',
  steps: [],
  doneCount: 0,
});

onMounted(async () => {
  const result = await getSettingsCenterData();
  Object.assign(data.system, result.system);
  Object.assign(data.permissions, result.permissions);
  Object.assign(data.security, result.security);
  Object.assign(data.data, result.data);
  Object.assign(data.integrations, result.integrations);
  Object.assign(data.guide, result.guide);
  selectedRoleId.value = result.permissions.roles[0]?.id || '';
  selectedFunctionPermissionId.value = result.permissions.functionPermissions[0]?.id || '';
  selectedFunctionMenuId.value = flattenPermissionMenus(result.permissions.permissionTree)[0]?.node.menuId || '';
  selectedAccountId.value = flattenAccounts(result.permissions.accountTree)[0]?.accountId || '';
  loadSelectedAccountPermissions();
});

watch(currentSection, () => {
  keyword.value = '';
});

function toast(text: string) {
  toastText.value = text;
  window.setTimeout(() => {
    if (toastText.value === text) toastText.value = '';
  }, 1800);
}

async function saveAll(message: string) {
  await saveSettingsCenterData(data);
  toast(message);
}

function flattenAccounts(nodes: AccountTreeNode[]): AccountTreeNode[] {
  return nodes.flatMap((node) => [
    node,
    ...(node.children ? flattenAccounts(node.children) : []),
  ]).filter((node) => node.type === 'account');
}

function flattenAccountTree(nodes: AccountTreeNode[], keywordValue = '', level = 0): Array<FlatNode<AccountTreeNode>> {
  const keywordText = keywordValue.trim();
  return nodes.flatMap((node) => {
    const children = flattenAccountTree(node.children || [], keywordText, level + 1);
    const matched = !keywordText || [node.label, node.userName, node.fullName, node.departmentName, node.postName].filter(Boolean).join(' ').includes(keywordText);
    if (!matched && children.length === 0) return [];
    return [{ node, level }, ...children];
  });
}

function flattenPermissionMenus(nodes: PermissionTreeNode[], keywordValue = '', level = 0, platformName = ''): Array<FlatNode<PermissionTreeNode>> {
  const keywordText = keywordValue.trim();
  return nodes.flatMap((node) => {
    const nextPlatformName = node.type === 'platform' ? node.label : platformName;
    const children = flattenPermissionMenus(node.children || [], keywordText, level + 1, nextPlatformName);
    const matched = node.type === 'menu' && (!keywordText || [node.label, nextPlatformName].join(' ').includes(keywordText));
    return matched ? [{ node, level, platformName: nextPlatformName }, ...children] : children;
  });
}

function flattenPermissionButtons(nodes: PermissionTreeNode[], keywordValue = '', level = 0, platformName = '', menuName = ''): Array<FlatNode<PermissionTreeNode>> {
  const keywordText = keywordValue.trim();
  return nodes.flatMap((node) => {
    const nextPlatformName = node.type === 'platform' ? node.label : platformName;
    const nextMenuName = node.type === 'menu' ? node.label : menuName;
    const children = flattenPermissionButtons(node.children || [], keywordText, level + 1, nextPlatformName, nextMenuName);
    const matched = node.type === 'button' && (!keywordText || [node.label, nextPlatformName, nextMenuName].join(' ').includes(keywordText));
    return matched ? [{ node, level, platformName: nextPlatformName, menuName: nextMenuName }, ...children] : children;
  });
}

function flattenPermissionTree(nodes: PermissionTreeNode[], keywordValue = '', level = 0): Array<FlatNode<PermissionTreeNode>> {
  const keywordText = keywordValue.trim();
  return nodes.flatMap((node) => {
    const children = flattenPermissionTree(node.children || [], keywordText, level + 1);
    const matched = !keywordText || node.label.includes(keywordText) || children.length > 0;
    if (!matched) return [];
    return [{ node, level }, ...children];
  });
}

function permissionDetailsFromKeys(keys: string[]): PermissionDetail[] {
  return keys
    .map((key) => {
      const item = permissionButtons.value.find((node) => node.node.key === key);
      if (!item) return undefined;
      return {
        key,
        platformId: item.node.platformId || '',
        platformName: item.platformName || '',
        menuId: item.node.menuId || '',
        menuName: [item.platformName, item.menuName].filter(Boolean).join(' / '),
        buttonName: item.node.label,
      };
    })
    .filter((item): item is PermissionDetail => Boolean(item));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function handleAdd() {
  if (currentSection.value === 'permissions' && activePermissionMode.value === 'account') {
    if (activeAccountPermissionTab.value === 'byFunction') openFunctionAuthorization();
    if (activeAccountPermissionTab.value === 'superAdmin') openSuperAdminModal();
    return;
  }
  if (currentSection.value === 'system') openNotification();
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'menus') openRole();
  if (currentSection.value === 'permissions' && ['actions', 'fields'].includes(activePermissionTab.value)) openFunctionPermission(activeMenuPermission.value);
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'data') openDataPermission();
  if (currentSection.value === 'security') openSecurityRule();
  if (currentSection.value === 'data') openDataTask();
  if (currentSection.value === 'integrations' && activeIntegrationTab.value === 'partners') openPartner();
  if (currentSection.value === 'integrations' && activeIntegrationTab.value === 'apis') openApiKey();
  if (currentSection.value === 'integrations' && activeIntegrationTab.value === 'syncs') openSyncTask();
  if (currentSection.value === 'guide') openGuideModal('新增引导');
}

function openModal(title: string, target: string, fields: ModalField[], form: object, id = '') {
  modal.open = true;
  modal.kind = 'form';
  modal.title = title;
  modal.target = target;
  modal.id = id;
  modal.form = Object.fromEntries(
    Object.entries(form).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)),
  ) as Record<string, string | number | boolean>;
  modalFields.value = fields;
}

function setModalValue(key: string, value: string) {
  modal.form[key] = value;
}

function openMessage(title: string, message: string) {
  modal.open = true;
  modal.kind = 'message';
  modal.title = title;
  modal.message = message;
  modal.target = '';
  modal.id = '';
  modal.form = {};
  modalFields.value = [];
}

function closeModal() {
  modal.open = false;
}

function setPermissionTab(tab: 'menus' | 'actions' | 'fields' | 'data') {
  activePermissionTab.value = tab;
}

function confirmModal() {
  const id = modal.id || `${modal.target}-${Date.now()}`;
  if (modal.target === 'notification') upsert(data.system.notifications, { id, ...modal.form } as NotificationRule);
  if (modal.target === 'role') {
    const role = {
      id,
      center: '研发中心',
      updated: new Date().toISOString().slice(0, 10),
      enabled: true,
      ...modal.form,
      users: Number(modal.form.users || 0),
    } as RoleRow;
    upsert(data.permissions.roles, role);
    selectedRoleId.value = role.id;
  }
  if (modal.target === 'function') {
    const previous = data.permissions.functionPermissions.find((item) => item.id === id);
    const menu = String(modal.form.menu || previous?.menu || '项目管理');
    const tabs = previous?.tabs?.length ? previous.tabs : [...(rdTabOptions[menu] || [])];
    const fieldsView = previous?.fieldsView?.length ? previous.fieldsView : [...(rdFieldOptions[menu] || [])];
    const fieldsEdit = previous?.fieldsEdit || [];
    const row = {
      id,
      role: selectedRole.value?.name || '研发工程师',
      module: '研发中心',
      menu,
      page: menu === 'BOM管理' ? 'BOM列表 / 替代料' : `${menu}列表 / ${menu}详情`,
      tabs,
      fieldsView,
      fieldsEdit,
      view: true,
      create: false,
      edit: true,
      delete: false,
      import: false,
      export: true,
      approve: false,
      ...modal.form,
    } as PermissionScopeRow;
    upsert(data.permissions.functionPermissions, row);
    selectedFunctionPermissionId.value = row.id;
  }
  if (modal.target === 'dataPermission') upsert(data.permissions.dataPermissions, { id, center: '研发中心', enabled: true, ...modal.form } as DataPermissionRow);
  if (modal.target === 'security') upsert(data.security.rules, { id, enabled: true, ...modal.form } as SecurityRule);
  if (modal.target === 'dataTask') upsert(data.data.tasks, { id, time: new Date().toISOString().slice(0, 16).replace('T', ' '), status: '待处理', ...modal.form } as DataTaskRow);
  if (modal.target === 'partner') upsert(data.integrations.partners, { id, status: '未连接', lastSync: '-', ...modal.form } as IntegrationRow);
  if (modal.target === 'api') upsert(data.integrations.apiKeys, { id, enabled: true, appKey: `AK-${Date.now().toString().slice(-6)}`, ...modal.form } as ApiKeyRow);
  if (modal.target === 'sync') upsert(data.integrations.syncTasks, { id, status: '运行中', result: '尚未执行', ...modal.form } as SyncTaskRow);
  closeModal();
  saveAll('设置已保存');
}

function upsert<T extends { id: string }>(rows: T[], row: T) {
  const index = rows.findIndex((item) => item.id === row.id);
  if (index >= 0) rows.splice(index, 1, row);
  else rows.push(row);
}

function selectRole(id: string) {
  selectedRoleId.value = id;
  const firstPermission = data.permissions.functionPermissions.find((item) => item.role === selectedRole.value?.name);
  selectedFunctionPermissionId.value = firstPermission?.id || '';
}

function copySelectedRole() {
  if (!selectedRole.value) return;
  const id = `role-${Date.now()}`;
  const newRole = {
    ...selectedRole.value,
    id,
    name: `${selectedRole.value.name} 副本`,
    users: 0,
    updated: new Date().toISOString().slice(0, 10),
    enabled: false,
  };
  data.permissions.roles.push(newRole);
  selectedRoleId.value = id;
  toast('岗位已复制，可继续配置权限');
}

function toggleSelectedRole() {
  if (!selectedRole.value) return;
  selectedRole.value.enabled = !selectedRole.value.enabled;
  toast(selectedRole.value.enabled ? '岗位已启用' : '岗位已停用');
}

function countText(value: unknown, unit: string) {
  return Array.isArray(value) ? `${value.length}${unit}` : `0${unit}`;
}

function selectFunctionPermission(row: SettingTableRow) {
  selectedFunctionPermissionId.value = String(row.id || '');
}

function toggleArrayValue(list: string[], value: string) {
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
  else list.push(value);
}

function ensureMenuPermission(menu: string) {
  if (!selectedRole.value) return undefined;
  let permission = data.permissions.functionPermissions.find((item) => item.role === selectedRole.value?.name && item.menu === menu);
  if (!permission) {
    permission = {
      id: `perm-${Date.now()}-${menu}`,
      role: selectedRole.value.name,
      module: '研发中心',
      menu,
      page: menu === 'BOM管理' ? 'BOM列表 / 替代料' : `${menu}列表 / ${menu}详情`,
      tabs: [],
      fieldsView: [],
      fieldsEdit: [],
      view: false,
      create: false,
      edit: false,
      delete: false,
      import: false,
      export: false,
      approve: false,
    };
    data.permissions.functionPermissions.push(permission);
  }
  return permission;
}

function hasMenuAccess(menu: string) {
  return selectedRoleFunctions.value.some((item) => item.menu === menu && item.view);
}

function toggleMenuAccess(menu: string) {
  const permission = ensureMenuPermission(menu);
  if (!permission) return;
  permission.view = !permission.view;
  if (permission.view && permission.tabs.length === 0) permission.tabs = [...(rdTabOptions[menu] || [])];
  if (permission.view && permission.fieldsView.length === 0) permission.fieldsView = [...(rdFieldOptions[menu] || [])];
  selectedFunctionPermissionId.value = permission.id;
}

function togglePermissionAction(action: PermissionActionKey) {
  const permission = ensureMenuPermission(activePermissionMenu.value);
  if (!permission) return;
  permission[action] = !permission[action];
  selectedFunctionPermissionId.value = permission.id;
}

function fieldPermissionState(field: string): FieldPermissionState {
  const permission = activeMenuPermission.value;
  if (!permission || !permission.fieldsView.includes(field)) return 'hidden';
  if (permission.fieldsEdit.includes(field)) return 'edit';
  return 'readonly';
}

function setFieldPermissionState(field: string, state: FieldPermissionState) {
  const permission = ensureMenuPermission(activePermissionMenu.value);
  if (!permission) return;
  permission.fieldsView = permission.fieldsView.filter((item) => item !== field);
  permission.fieldsEdit = permission.fieldsEdit.filter((item) => item !== field);
  if (state === 'readonly') permission.fieldsView.push(field);
  if (state === 'edit') {
    permission.fieldsView.push(field);
    permission.fieldsEdit.push(field);
  }
  selectedFunctionPermissionId.value = permission.id;
}

function ensureDataPermission() {
  if (!selectedRole.value) return undefined;
  let permission = data.permissions.dataPermissions.find((item) => item.role === selectedRole.value?.name);
  if (!permission) {
    permission = {
      id: `data-${Date.now()}`,
      name: `${selectedRole.value.name}数据范围`,
      role: selectedRole.value.name,
      center: '研发中心',
      department: '本部门及下级',
      region: '负责区域',
      customerScope: '项目关联客户',
      projectScope: '本人负责或参与项目',
      documentScope: '本人创建 / 协作文档',
      materialScope: '本人维护产品 / 物料',
      bomScope: '本人维护 BOM 与替代料',
      enabled: true,
    };
    data.permissions.dataPermissions.push(permission);
  }
  return permission;
}

function setDataScopeValue(key: DataScopeKey, value: string) {
  const permission = ensureDataPermission();
  if (!permission) return;
  permission[key] = value;
}

function selectFunctionMenu(menuId: string) {
  selectedFunctionMenuId.value = menuId;
}

function selectAccount(accountId: string) {
  selectedAccountId.value = accountId;
  loadSelectedAccountPermissions();
}

function loadSelectedAccountPermissions() {
  selectedAccountPermissionKeys.value = unique(
    data.permissions.accountPermissions
      .filter((item) => item.accountId === selectedAccountId.value)
      .flatMap((item) => item.buttonKeys),
  );
}

function toggleFunctionAuthorizationButton(key: string) {
  toggleArrayValue(functionAuthorizationModal.buttonKeys, key);
}

function toggleFunctionAuthorizationAccount(accountId: string) {
  toggleArrayValue(functionAuthorizationModal.accountIds, accountId);
}

function openFunctionAuthorization() {
  if (!selectedFunctionMenuId.value) {
    toast('请先选择功能菜单');
    return;
  }
  functionAuthorizationModal.open = true;
  functionAuthorizationModal.accountIds = [];
  functionAuthorizationModal.buttonKeys = selectedFunctionButtons.value.length === 1 ? [selectedFunctionButtons.value[0].key] : [];
}

function closeFunctionAuthorization() {
  functionAuthorizationModal.open = false;
}

function confirmFunctionAuthorization() {
  if (!selectedFunctionMenu.value) {
    toast('请先选择功能菜单');
    return;
  }
  if (selectedFunctionButtons.value.length > 0 && functionAuthorizationModal.buttonKeys.length === 0) {
    toast('请选择至少一个操作按钮');
    return;
  }
  if (functionAuthorizationModal.accountIds.length === 0) {
    toast('请选择至少一个账号');
    return;
  }
  functionAuthorizationModal.accountIds.forEach((accountId) => {
    mergeAccountPermission(accountId, functionAuthorizationModal.buttonKeys);
  });
  closeFunctionAuthorization();
  saveAll('功能授权已保存');
}

function deleteFunctionAuthorization(id: string) {
  if (!window.confirm('确认删除该账号的功能授权吗？')) return;
  data.permissions.accountPermissions = data.permissions.accountPermissions.filter((item) => item.id !== id);
  saveAll('功能授权已删除');
}

function deleteAllFunctionAuthorization() {
  if (!selectedFunctionMenuId.value) {
    toast('请先选择功能菜单');
    return;
  }
  if (!window.confirm('确认删除当前功能的所有账号授权吗？')) return;
  data.permissions.accountPermissions = data.permissions.accountPermissions.filter((item) => item.menuId !== selectedFunctionMenuId.value);
  saveAll('当前功能授权已全部删除');
}

function toggleAccountPermissionKey(key: string) {
  toggleArrayValue(selectedAccountPermissionKeys.value, key);
}

function toggleBatchAccount(accountId: string) {
  toggleArrayValue(batchSelectedAccountIds.value, accountId);
}

function toggleBatchPermission(key: string) {
  toggleArrayValue(batchSelectedPermissionKeys.value, key);
}

function permissionMenuButtonKeys(menu: PermissionTreeNode) {
  return flattenPermissionButtons(menu.children || []).map((item) => item.node.key);
}

function isPermissionMenuChecked(menu: PermissionTreeNode, target: string[]) {
  const keys = permissionMenuButtonKeys(menu);
  return keys.length > 0 && keys.every((key) => target.includes(key));
}

function togglePermissionMenu(menu: PermissionTreeNode, target: string[]) {
  const keys = permissionMenuButtonKeys(menu);
  if (keys.length === 0) return;
  if (keys.every((key) => target.includes(key))) {
    keys.forEach((key) => {
      const index = target.indexOf(key);
      if (index >= 0) target.splice(index, 1);
    });
    return;
  }
  keys.forEach((key) => {
    if (!target.includes(key)) target.push(key);
  });
}

function openCopyPermission(target: 'account' | 'batch') {
  if (target === 'account' && !selectedAccountId.value) {
    toast('请先选择一个账号');
    return;
  }
  copyPermissionModal.open = true;
  copyPermissionModal.target = target;
  copyPermissionModal.accountIds = [];
}

function closeCopyPermission() {
  copyPermissionModal.open = false;
}

function toggleCopyAccount(accountId: string) {
  toggleArrayValue(copyPermissionModal.accountIds, accountId);
}

function confirmCopyPermission() {
  if (copyPermissionModal.accountIds.length === 0) {
    toast('请选择要复制的账号');
    return;
  }
  const copiedKeys = unique(
    data.permissions.accountPermissions
      .filter((item) => copyPermissionModal.accountIds.includes(item.accountId))
      .flatMap((item) => item.buttonKeys),
  );
  if (copyPermissionModal.target === 'account') {
    selectedAccountPermissionKeys.value = unique([...selectedAccountPermissionKeys.value, ...copiedKeys]);
  } else {
    batchSelectedPermissionKeys.value = unique([...batchSelectedPermissionKeys.value, ...copiedKeys]);
  }
  closeCopyPermission();
  toast('权限已复制到待保存列表');
}

function saveAccountPermissions() {
  if (!selectedAccount.value?.accountId) {
    toast('请先选择一个账号');
    return;
  }
  replaceAccountPermissions(selectedAccount.value.accountId, selectedAccountPermissionKeys.value);
  saveAll('账号权限已保存');
}

function saveBatchPermissions() {
  if (batchSelectedAccountIds.value.length === 0) {
    toast('请选择至少一个账号');
    return;
  }
  if (batchSelectedPermissionKeys.value.length === 0) {
    toast('请选择至少一个权限');
    return;
  }
  batchSelectedAccountIds.value.forEach((accountId) => {
    mergeAccountPermission(accountId, batchSelectedPermissionKeys.value);
  });
  batchSelectedAccountIds.value = [];
  batchSelectedPermissionKeys.value = [];
  saveAll('批量授权已保存');
}

function mergeAccountPermission(accountId: string, keys: string[]) {
  const oldKeys = data.permissions.accountPermissions
    .filter((item) => item.accountId === accountId)
    .flatMap((item) => item.buttonKeys);
  replaceAccountPermissions(accountId, unique([...oldKeys, ...keys]));
}

function replaceAccountPermissions(accountId: string, keys: string[]) {
  const account = accountOptions.value.find((item) => item.accountId === accountId);
  if (!account?.accountId) return;
  const safeAccountId = account.accountId;
  const details = permissionDetailsFromKeys(keys);
  const rows = Object.values(
    details.reduce<Record<string, AccountPermissionRow>>((map, detail) => {
      if (!map[detail.menuId]) {
        map[detail.menuId] = {
          id: `ap-${safeAccountId}-${detail.menuId}`,
          accountId: safeAccountId,
          userName: account.userName || '',
          fullName: account.fullName || '',
          departmentName: account.departmentName || '',
          mobile: account.mobile || '',
          platformId: detail.platformId,
          platformName: detail.platformName,
          menuId: detail.menuId,
          menuName: detail.menuName,
          buttonKeys: [],
          buttonNames: [],
        };
      }
      map[detail.menuId].buttonKeys.push(detail.key);
      map[detail.menuId].buttonNames.push(detail.buttonName);
      return map;
    }, {}),
  );
  data.permissions.accountPermissions = [
    ...data.permissions.accountPermissions.filter((item) => item.accountId !== safeAccountId),
    ...rows,
  ];
  if (selectedAccountId.value === safeAccountId) loadSelectedAccountPermissions();
}

function openSuperAdminModal() {
  superAdminModal.open = true;
  superAdminModal.accountId = '';
}

function closeSuperAdminModal() {
  superAdminModal.open = false;
}

function confirmSuperAdmin() {
  const account = accountOptions.value.find((item) => item.accountId === superAdminModal.accountId);
  if (!account?.accountId) {
    toast('请选择账号');
    return;
  }
  if (!data.permissions.superAdmins.some((item) => item.accountId === account.accountId)) {
    data.permissions.superAdmins.push({
      id: `sa-${account.accountId}`,
      accountId: account.accountId,
      userName: account.userName || '',
      name: account.fullName || '',
      deptAndPost: `${account.departmentName || '-'} / ${account.postName || '-'}`,
    });
  }
  closeSuperAdminModal();
  saveAll('超级管理员已保存');
}

function deleteSuperAdmin(id: string) {
  if (!window.confirm('确认删除该超级管理员权限吗？')) return;
  data.permissions.superAdmins = data.permissions.superAdmins.filter((item) => item.id !== id);
  saveAll('超级管理员已删除');
}

function querySuperAdmins() {
  toast(`查询完成，共 ${filteredSuperAdmins.value.length} 条超级管理员`);
}

function openNotification(row?: NotificationRule) {
  openModal('消息通知规则', 'notification', [
    { key: 'channel', label: '通知渠道', options: ['站内通知', '短信通知', '邮件通知'] },
    { key: 'scene', label: '业务场景', type: 'textarea' },
    { key: 'rule', label: '发送规则', type: 'textarea' },
    { key: 'receiver', label: '接收对象' },
  ], row || { channel: '站内通知', scene: '', rule: '', receiver: '', enabled: true }, row?.id);
}

function openRole(row?: RoleRow | SettingTableRow) {
  openModal('岗位管理', 'role', [
    { key: 'name', label: '岗位名称' },
    { key: 'center', label: '适用中心', options: ['研发中心'] },
    { key: 'users', label: '成员数' },
    { key: 'menu', label: '菜单权限', options: ['研发中心全部菜单', '项目 / 产品 / BOM / 工艺', '文档 / 物料 / BOM', '研发中心只读菜单'] },
    { key: 'functionPolicy', label: '功能权限模板', options: ['研发全功能控制', '研发主管审批与维护', '研发工程师维护', '研发只读浏览'] },
    { key: 'dataPolicy', label: '数据权限模板', options: ['研发全量数据', '本部门及下级研发数据', '本人参与项目数据', '授权项目只读数据'] },
  ], (row as RoleRow) || { name: '', center: '研发中心', users: 0, menu: '项目 / 产品 / BOM / 工艺', data: '本部门及下级项目', functionPolicy: '研发主管审批与维护', dataPolicy: '本部门及下级研发数据' }, row?.id as string);
}

function openFunctionPermission(row?: PermissionScopeRow | SettingTableRow) {
  openModal('功能权限', 'function', [
    { key: 'role', label: '适用岗位', options: data.permissions.roles.map((item) => item.name) },
    { key: 'module', label: '模块', options: ['研发中心'] },
    { key: 'menu', label: '菜单', options: rdMenuOptions },
    { key: 'page', label: '页面' },
  ], (row as PermissionScopeRow) || { role: '研发工程师', module: '研发中心', menu: 'BOM管理', page: 'BOM列表 / 替代料' }, row?.id as string);
}

function openDataPermission(row?: DataPermissionRow | SettingTableRow) {
  openModal('数据权限', 'dataPermission', [
    { key: 'name', label: '权限名称' },
    { key: 'role', label: '适用岗位', options: data.permissions.roles.map((item) => item.name) },
    { key: 'center', label: '适用中心', options: ['研发中心'] },
    { key: 'department', label: '部门范围', options: ['全部研发部门', '本部门及下级', '本人所在部门'] },
    { key: 'region', label: '区域范围', options: ['全部区域', '负责区域', '本人负责区域'] },
    { key: 'customerScope', label: '客户可见范围', options: ['全部客户', '负责客户及协作客户', '项目关联客户'] },
    { key: 'projectScope', label: '项目范围', options: ['全部项目', '本部门项目及下级项目', '本人负责或参与项目'] },
    { key: 'documentScope', label: '文档范围', options: ['全部文档分类', '本部门文档分类', '本人创建 / 协作文档'] },
    { key: 'materialScope', label: '产品 / 物料范围', options: ['全部产品 / 物料', '本部门维护产品 / 物料', '本人维护产品 / 物料'] },
    { key: 'bomScope', label: 'BOM 范围', options: ['全部 BOM 与替代料', '本部门项目 BOM', '本人维护 BOM 与替代料'] },
  ], (row as DataPermissionRow) || { name: '', role: '研发主管', center: '研发中心', department: '本部门及下级', region: '负责区域', customerScope: '负责客户及协作客户', projectScope: '本部门项目及下级项目', documentScope: '本部门文档分类', materialScope: '本部门维护产品 / 物料', bomScope: '本部门项目 BOM' }, row?.id as string);
}

function openSecurityRule(row?: SecurityRule) {
  openModal('安全中心配置', 'security', [
    { key: 'type', label: '安全项', options: ['密码策略', '登录限制'] },
    { key: 'scope', label: '适用范围' },
    { key: 'detail', label: '规则说明', type: 'textarea' },
    { key: 'owner', label: '负责人' },
  ], row || { type: '密码策略', scope: '', detail: '', owner: '安全管理员' }, row?.id);
}

function openAuditLog(row: AuditLogRow | SettingTableRow) {
  openMessage('操作日志 / 审计', `${row.time}，${row.operator} 在 ${row.module} 对 ${row.object} 执行「${row.action}」，结果：${row.result}，来源 IP：${row.ip}`);
}

function openDataTask(row?: DataTaskRow | SettingTableRow) {
  openModal('数据备份 / 导入 / 导出', 'dataTask', [
    { key: 'type', label: '任务类型', options: ['数据备份', '导入任务', '导出记录'] },
    { key: 'scope', label: '数据范围' },
    { key: 'amount', label: '数据量' },
  ], (row as DataTaskRow) || { type: '数据备份', scope: '业务数据 / 附件 / 系统参数', amount: '-' }, row?.id as string);
}

function openPartner(row?: IntegrationRow | SettingTableRow) {
  openModal('设备对接配置', 'partner', [
    { key: 'name', label: '设备名称' },
    { key: 'type', label: '设备类型', options: ['打印设备', '考勤设备', '称重设备', '扫码设备', '工控设备'] },
    { key: 'vendor', label: '厂商' },
    { key: 'product', label: '产品 / 型号' },
    { key: 'location', label: '使用位置', options: departmentOptions },
    { key: 'method', label: '连接方式', options: ['局域网 IP', 'TCP / SDK', '串口 / 网关', 'USB 驱动', 'OPC UA'] },
    { key: 'driver', label: '驱动 / 协议' },
    { key: 'endpoint', label: '连接参数' },
    { key: 'purpose', label: '业务用途', type: 'textarea', span: 'full' },
  ], (row as IntegrationRow) || { name: '', type: '打印设备', vendor: '', product: '', location: departmentOptions[0], method: '局域网 IP', driver: '', endpoint: '', purpose: '' }, row?.id as string);
}

function openApiKey(row?: ApiKeyRow | SettingTableRow) {
  openModal('开放 API / 密钥管理', 'api', [
    { key: 'appName', label: '应用名称' },
    { key: 'modules', label: '授权模块' },
    { key: 'expireAt', label: '到期时间' },
  ], (row as ApiKeyRow) || { appName: '', modules: '采购 / 销售', expireAt: '2026-12-31' }, row?.id as string);
}

function openSyncTask(row?: SyncTaskRow | SettingTableRow) {
  openModal('数据同步配置', 'sync', [
    { key: 'name', label: '任务名称' },
    { key: 'direction', label: '同步方向' },
    { key: 'object', label: '数据对象' },
    { key: 'cycle', label: '执行周期' },
  ], (row as SyncTaskRow) || { name: '', direction: '双向同步', object: '', cycle: '每 30 分钟' }, row?.id as string);
}

function openGuideModal(title: string) {
  openMessage(title, `${activeGuide.value.name} · ${title}，保留原 JSX 初始化引导核心流程。`);
}

function removeRole(row: SettingTableRow) {
  data.permissions.roles = data.permissions.roles.filter((item) => item.id !== row.id);
  toast('岗位已删除');
}
function removeFunctionPermission(row: SettingTableRow) {
  data.permissions.functionPermissions = data.permissions.functionPermissions.filter((item) => item.id !== row.id);
  toast('功能权限已删除');
}
function removeDataPermission(row: SettingTableRow) {
  data.permissions.dataPermissions = data.permissions.dataPermissions.filter((item) => item.id !== row.id);
  toast('数据权限已删除');
}
function removeDataTask(row: SettingTableRow) {
  data.data.tasks = data.data.tasks.filter((item) => item.id !== row.id);
  toast('数据任务已删除');
}
function removePartner(row: SettingTableRow) {
  data.integrations.partners = data.integrations.partners.filter((item) => item.id !== row.id);
  toast('第三方对接已删除');
}
function removeApiKey(row: SettingTableRow) {
  data.integrations.apiKeys = data.integrations.apiKeys.filter((item) => item.id !== row.id);
  toast('API 应用已删除');
}
function removeSyncTask(row: SettingTableRow) {
  data.integrations.syncTasks = data.integrations.syncTasks.filter((item) => item.id !== row.id);
  toast('同步任务已删除');
}
function noopDelete() {
  toast('审计日志不允许删除');
}

function runDataTask(row: SettingTableRow) {
  const task = data.data.tasks.find((item) => item.id === row.id);
  if (task) task.status = '处理中';
  toast('数据任务已开始执行');
}

function resetApiKey(row: SettingTableRow) {
  const api = data.integrations.apiKeys.find((item) => item.id === row.id);
  if (api) api.appKey = `AK-${Date.now().toString().slice(-6)}`;
  toast('API 密钥已重置');
}

function runSyncTask(row: SettingTableRow) {
  const task = data.integrations.syncTasks.find((item) => item.id === row.id);
  if (task) task.result = '刚刚执行 / 等待回执';
  toast('同步任务已立即执行');
}

function guideProgress(module: GuideModule) {
  return Math.min(100, Math.round((module.doneCount / module.steps.length) * 100));
}

function finishGuideStep(index: number) {
  activeGuide.value.doneCount = Math.max(activeGuide.value.doneCount, index + 1);
  toast('配置任务已标记完成');
}

function applyGuideTemplate(name: string) {
  activeGuide.value.doneCount = Math.max(activeGuide.value.doneCount, name === '精细化管控模板' ? 5 : 4);
  toast(`${name}已套用到${activeGuide.value.name}`);
}

function publishGuide() {
  activeGuide.value.doneCount = activeGuide.value.steps.length;
  toast('发布校验通过，初始化进度已更新');
}
</script>

<style scoped>
.settings-card-grid,
.settings-two-col,
.settings-system-full {
  display: grid;
  gap: 14px;
}

.settings-content {
  min-width: 0;
}

.settings-panel {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
}

.settings-panel p,
.settings-note,
.settings-rule-row span,
.settings-rule-row em,
.settings-panel em {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.7;
}

.settings-card-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.settings-permission-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.settings-permission-summary.compact {
  margin-bottom: 12px;
}

.settings-permission-workbench {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.settings-permission-mode-tabs {
  display: inline-flex;
  gap: 4px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 4px;
  margin-bottom: 14px;
}

.settings-permission-mode-tabs button {
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--aw-fg-2);
  cursor: pointer;
  padding: 7px 16px;
}

.settings-permission-mode-tabs button.on {
  background: #fff;
  color: var(--aw-primary);
  font-weight: 700;
  box-shadow: 0 3px 10px rgba(16, 24, 40, .06);
}

.settings-account-auth {
  display: grid;
  gap: 14px;
}

.settings-account-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.settings-tree-panel,
.settings-auth-main {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  min-width: 0;
  padding: 12px;
}

.settings-tree-panel {
  background: var(--aw-bg);
}

.settings-tree-head {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.settings-tree-head input,
.settings-inline-input {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  height: 32px;
  min-width: 160px;
  padding: 0 10px;
}

.settings-tree-row {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--aw-fg-2);
  cursor: pointer;
  display: block;
  min-height: 34px;
  padding: 7px 10px;
  text-align: left;
}

.settings-tree-row.on {
  border-color: rgba(37, 99, 235, .24);
  background: #fff;
  color: var(--aw-primary);
  font-weight: 700;
}

.settings-tree-row.muted,
.settings-check-row.muted {
  color: var(--aw-fg-3);
  font-weight: 700;
}

.settings-tree-row.level-1,
.settings-check-row.level-1 {
  padding-left: 18px;
}

.settings-tree-row.level-2,
.settings-check-row.level-2 {
  padding-left: 30px;
}

.settings-tree-row.level-3,
.settings-check-row.level-3 {
  padding-left: 42px;
}

.settings-permission-picker {
  display: grid;
  grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.settings-check-tree {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  max-height: 420px;
  overflow: auto;
  padding: 8px;
}

.settings-check-tree .settings-check-row {
  border-radius: 6px;
  min-height: 30px;
  padding-right: 8px;
}

.settings-check-tree .settings-check-row.type-platform {
  color: var(--aw-fg-1);
  font-weight: 700;
  margin-top: 4px;
}

.settings-check-tree .settings-check-row.type-menu {
  color: var(--aw-fg-2);
  font-weight: 600;
}

.settings-check-tree .settings-check-row.type-button {
  background: #fff;
  border: 1px solid transparent;
}

.settings-empty {
  color: var(--aw-fg-3);
  padding: 18px;
  text-align: center;
}

.settings-modal-stack {
  display: grid;
  gap: 14px;
}

.settings-modal-stack section {
  display: grid;
  gap: 10px;
}

.settings-modal-tip {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  color: var(--aw-fg-2);
  font-size: 13px;
  padding: 10px 12px;
}

.settings-modal-check-grid {
  display: grid;
  gap: 6px 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.aw-tool-btn.danger {
  color: var(--aw-danger);
}

.settings-role-panel,
.settings-role-main {
  min-width: 0;
}

.settings-role-panel {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 10px;
}

.settings-role-head,
.settings-role-overview,
.settings-role-actions,
.settings-menu-row,
.settings-action-card,
.settings-field-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-role-head {
  justify-content: space-between;
  margin-bottom: 8px;
}

.settings-role-head strong,
.settings-role-head span,
.settings-role-item strong,
.settings-role-item em {
  display: block;
}

.settings-role-head span,
.settings-role-item em {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-role-item {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  color: var(--aw-fg-2);
}

.settings-role-item.on {
  border-color: rgba(37, 99, 235, .24);
  background: #fff;
  color: var(--aw-primary);
  box-shadow: 0 4px 14px rgba(16, 24, 40, .06);
}

.settings-role-item i {
  border-radius: 999px;
  background: rgba(22, 163, 74, .1);
  color: #15803d;
  font-size: 12px;
  font-style: normal;
  padding: 2px 7px;
  white-space: nowrap;
}

.settings-role-item i.off {
  background: #eef1f6;
  color: var(--aw-fg-3);
}

.settings-role-overview {
  justify-content: space-between;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 14px;
  margin-bottom: 12px;
}

.settings-role-kicker {
  color: var(--aw-primary);
  font-size: 12px;
  font-weight: 600;
}

.settings-role-overview h3 {
  margin: 4px 0;
  color: var(--aw-fg-1);
  font-size: 20px;
}

.settings-role-overview p {
  margin: 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-role-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.settings-summary-card {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 12px 14px;
}

.settings-summary-card span,
.settings-summary-card em {
  display: block;
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.6;
}

.settings-summary-card strong {
  display: block;
  margin: 4px 0;
  color: var(--aw-fg-1);
  font-size: 22px;
}

.settings-permission-matrix {
  margin-top: 14px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.settings-permission-block {
  margin-top: 14px;
}

.settings-menu-list,
.settings-field-list,
.settings-data-rules {
  display: grid;
  gap: 10px;
}

.settings-menu-row,
.settings-field-row {
  justify-content: space-between;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 10px 12px;
}

.settings-menu-row.on {
  border-color: rgba(37, 99, 235, .32);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .08);
}

.settings-menu-row > button {
  flex: 1;
  border: 0;
  background: transparent;
  text-align: left;
  color: inherit;
}

.settings-menu-row strong,
.settings-menu-row span {
  display: block;
}

.settings-menu-row span {
  color: var(--aw-fg-3);
  font-size: 12px;
  margin-top: 3px;
}

.settings-inline-select {
  min-width: 160px;
}

.settings-action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.settings-action-card {
  justify-content: space-between;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.settings-action-card span,
.settings-action-card strong,
.settings-action-card em {
  display: block;
}

.settings-action-card em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
  margin-top: 4px;
}

.settings-field-row strong {
  min-width: 130px;
  margin: 0;
}

.settings-segmented {
  display: inline-flex;
  border: 1px solid var(--aw-border);
  border-radius: 7px;
  overflow: hidden;
  background: var(--aw-bg);
}

.settings-segmented button {
  min-width: 64px;
  border: 0;
  border-left: 1px solid var(--aw-border);
  background: transparent;
  color: var(--aw-fg-2);
  padding: 6px 10px;
}

.settings-segmented button:first-child {
  border-left: 0;
}

.settings-segmented button.on {
  background: var(--aw-primary);
  color: #fff;
}

.settings-data-rules {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.settings-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.settings-block-head strong {
  color: var(--aw-fg-1);
  font-size: 14px;
}

.settings-block-head p {
  margin: 3px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-matrix-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--aw-divider);
}

.settings-matrix-head p {
  margin: 4px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-matrix-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.settings-check-row {
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.settings-check-row input {
  width: 14px;
  height: 14px;
  accent-color: var(--aw-primary);
}

.settings-panel strong,
.settings-rule-row strong {
  display: block;
  margin-bottom: 6px;
}

.settings-two-col {
  grid-template-columns: minmax(0, 1fr) minmax(320px, .9fr);
}

.settings-system-full {
  grid-template-columns: minmax(0, 1fr);
}

.settings-company-panel .settings-form-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.settings-panel {
  padding: 16px;
}

.settings-logo-row,
.settings-panel-head,
.settings-rule-row,
.settings-actions,
.settings-guide-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-logo-row {
  padding: 12px;
  margin: 12px 0;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
}

.settings-logo {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  background: var(--aw-primary);
}

.settings-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.settings-form-grid textarea,
.settings-form-grid select,
.settings-form-grid input {
  width: 100%;
}

.settings-form-grid .settings-field-full {
  grid-column: 1 / -1;
}

.settings-form-grid .settings-field-full textarea {
  min-height: 72px;
}

.settings-rule-row {
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--aw-divider);
}

.settings-rule-row div {
  min-width: 0;
  flex: 1;
}

.settings-rule-row span,
.settings-rule-row em {
  display: block;
}

.settings-actions {
  justify-content: flex-end;
  margin-top: 14px;
}

.settings-panel-head {
  justify-content: space-between;
}

.settings-guide {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
}

.settings-guide aside {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 8px;
  background: var(--aw-bg);
}

.settings-guide aside button {
  width: 100%;
  border: 0;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  background: transparent;
  cursor: pointer;
}

.settings-guide aside button.on {
  background: #fff;
  color: var(--aw-primary);
  font-weight: 600;
}

.settings-guide section {
  min-width: 0;
}

.settings-guide-head {
  justify-content: flex-end;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--aw-divider);
  margin-bottom: 14px;
}

.settings-guide-head div {
  flex: 1;
}

.settings-step-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.settings-step-card {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.settings-step-card strong {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--aw-primary);
}

.settings-step-card span,
.settings-step-card em {
  display: block;
  margin-top: 8px;
}

.settings-step-card em {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 80;
  padding: 10px 14px;
  border-radius: 6px;
  color: #fff;
  background: #1f2937;
  box-shadow: 0 8px 24px rgba(16, 24, 40, .18);
}

.settings-modal-message {
  line-height: 1.8;
  color: var(--aw-fg-2);
}
</style>
