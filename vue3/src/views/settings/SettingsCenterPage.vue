<template>
  <aw-setting-page>
    <template v-if="!isListMasterSection" #toolbar>
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
      <aw-list-page v-if="currentSection === 'units'">
        <template #tree>
          <aw-resource-tree
            v-model="activeUnitGroupKey"
            title="单位分类"
            source-text="来源：单位管理 - 分类设置"
            :total="data.system.units.length"
            :nodes="unitTreeNodes"
            @select="handleUnitTreeSelect"
          />
        </template>

        <aw-list-toolbar
          :search-placeholder="currentSearchPlaceholder"
          :create-label="currentAddText"
          :create-handler="() => openUnitSetting()"
          @search="handleListSearch"
          @refresh="handleListToolbarAction('refresh')"
          @filter="handleListToolbarAction('filter')"
          @columns="handleListToolbarAction('columns')"
          @import="handleListToolbarAction('import')"
          @export="handleListToolbarAction('export')"
          @create="openUnitSetting"
        />

        <div v-if="listToolbarMessage" class="aw-form-note settings-list-feedback">{{ listToolbarMessage }}</div>

        <aw-data-table
          :bulk-actions="basicBulkActions"
          :columns="unitListColumns"
          :filter-values="unitColumnFilters"
          :rows="unitTableRows"
          :total="unitTableRows.length"
          fit-width
          @batch-action="handleUnitBatchAction"
          @column-filter="handleUnitColumnFilter"
          @selection-change="selectedUnitIds = $event"
        >
          <template #cell="{ column, record, value }">
            <span v-if="column.key === 'group'" class="settings-tag-line">{{ value }}</span>
            <span v-else-if="column.key === 'isBase'" :class="['aw-status', record.isBase ? 'blue' : 'gray']">{{ record.isBase ? '基础单位' : '换算单位' }}</span>
            <label v-else-if="column.key === 'enabled'" :class="['aw-switch-line mini', { disabled: record.isBase }]">
              <input
                :checked="Boolean(record.enabled)"
                :disabled="Boolean(record.isBase)"
                type="checkbox"
                @change="toggleUnitEnabled(record, ($event.target as HTMLInputElement).checked)"
              />
              <i></i>
            </label>
            <span v-else-if="column.key === 'action'">
              <span class="aw-link" @click="openUnitSetting(record)">编辑</span>
              <span class="aw-action-split">|</span>
              <span v-if="!record.isBase" class="aw-link" @click="handleSetUnitAsBase(record)">设为基础</span>
              <span v-if="!record.isBase" class="aw-action-split">|</span>
              <span class="aw-link danger" @click="removeUnitSetting(record)">删除</span>
            </span>
            <span v-else>{{ value }}</span>
          </template>
        </aw-data-table>
      </aw-list-page>

      <aw-list-page v-else-if="currentSection === 'currencies'">
        <aw-list-toolbar
          :search-placeholder="currentSearchPlaceholder"
          :create-label="currentAddText"
          :create-handler="() => openCurrencySetting()"
          @search="handleListSearch"
          @refresh="handleListToolbarAction('refresh')"
          @filter="handleListToolbarAction('filter')"
          @columns="handleListToolbarAction('columns')"
          @import="handleListToolbarAction('import')"
          @export="handleListToolbarAction('export')"
          @create="openCurrencySetting"
        />

        <div v-if="listToolbarMessage" class="aw-form-note settings-list-feedback">{{ listToolbarMessage }}</div>

        <aw-data-table
          :bulk-actions="basicBulkActions"
          :columns="currencyListColumns"
          :filter-values="currencyColumnFilters"
          :rows="currencyTableRows"
          :total="currencyTableRows.length"
          fit-width
          @batch-action="handleCurrencyBatchAction"
          @column-filter="handleCurrencyColumnFilter"
          @selection-change="selectedCurrencyIds = $event"
        >
          <template #cell="{ column, record, value }">
            <span v-if="column.key === 'isBase'" :class="['aw-status', record.isBase ? 'blue' : 'gray']">{{ record.isBase ? '基础币' : '-' }}</span>
            <label v-else-if="column.key === 'enabled'" :class="['aw-switch-line mini', { disabled: record.isBase }]">
              <input
                :checked="Boolean(record.enabled)"
                :disabled="Boolean(record.isBase)"
                type="checkbox"
                @change="toggleCurrencyEnabled(record, ($event.target as HTMLInputElement).checked)"
              />
              <i></i>
            </label>
            <span v-else-if="column.key === 'action'">
              <span class="aw-link" @click="openCurrencySetting(record)">编辑</span>
              <span class="aw-action-split">|</span>
              <span class="aw-link danger" @click="removeCurrencySetting(record)">删除</span>
            </span>
            <span v-else>{{ value }}</span>
          </template>
        </aw-data-table>
      </aw-list-page>

      <aw-setting-list-card
        v-else
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
          <section v-if="activePermissionTab === 'resources'" class="settings-permission-block">
            <div class="settings-block-head">
              <div>
                <strong>{{ permissionResourcePageMode === 'form' ? permissionResourceFormTitle : '权限资源管理' }}</strong>
                <p>{{ permissionResourcePageMode === 'form' ? permissionResourceFormSubtitle : '页面、按钮、字段、接口和数据范围都先定义成资源；角色只负责拿这些资源做授权。' }}</p>
              </div>
              <button v-if="permissionResourcePageMode === 'list'" class="aw-tool-btn" type="button" @click="openPermissionResource()">新增资源</button>
              <div v-else class="settings-role-actions">
                <button class="aw-tool-btn" type="button" @click="backToPermissionResourceList">返回列表</button>
                <button v-if="editingPermissionResourceId" class="aw-tool-btn" type="button" @click="openRoleGrantModal(permissionResourceForm)">配置角色</button>
                <button class="aw-btn primary" type="button" @click="saveResourceConfig(permissionResourceForm)">保存资源</button>
              </div>
            </div>
            <template v-if="permissionResourcePageMode === 'list'">
              <div class="settings-resource-layout">
                <aw-resource-tree
                  v-model="activePermissionModuleKey"
                  title="模块中心"
                  source-text="顶部模块列表"
                  :total="data.permissions.resources.length"
                  :nodes="permissionModuleTreeNodes"
                  @select="handlePermissionModuleSelect"
                />

                <section class="settings-resource-main">
                  <div class="settings-resource-current">
                    <div>
                      <strong>{{ activePermissionModuleLabel }}</strong>
                      <span>{{ permissionResourceTableRows.length }} 条资源</span>
                    </div>
                    <em>启用 {{ activePermissionModuleEnabledCount }} 条</em>
                  </div>

                  <aw-data-table
                    :columns="permissionResourceColumns"
                    :rows="permissionResourceTableRows"
                    :total="permissionResourceTableRows.length"
                    :bulk-actions="permissionResourceBulkActions"
                    fit-width
                    @batch-action="handlePermissionResourceBatch"
                    @selection-change="selectedPermissionResourceIds = $event"
                  >
                    <template #cell="{ column, record, value }">
                      <span v-if="column.key === 'status'" :class="['aw-status', record.status === '启用' ? 'green' : 'gray']">{{ record.status }}</span>
                      <span v-else-if="['tabCount', 'actionCount', 'fieldCount'].includes(column.key)" class="settings-tag-line">{{ value }}</span>
                      <span v-else-if="column.key === 'page'" class="aw-link" @click="openPermissionResource(record)">{{ value }}</span>
                      <span v-else-if="column.key === 'action'">
                        <span class="aw-link" @click="openPermissionResource(record)">编辑</span>
                        <span class="aw-action-split">|</span>
                        <span class="aw-link" @click="openRoleGrantModal(record)">配置角色</span>
                      </span>
                      <span v-else>{{ value }}</span>
                    </template>
                  </aw-data-table>
                </section>
              </div>
            </template>

            <section v-else class="settings-resource-form-page">
              <div class="settings-resource-config-panel">
                <div class="settings-resource-config-head">
                  <div>
                    <strong>{{ permissionResourceForm.menu || '未命名资源' }}</strong>
                    <p>{{ permissionResourceForm.page || '页面 / 资源名称' }} · {{ permissionResourceForm.code || '权限编码待生成' }}</p>
                  </div>
                  <span :class="['aw-status', permissionResourceForm.status === '启用' ? 'green' : 'gray']">{{ permissionResourceForm.status }}</span>
                </div>

                <div class="settings-resource-editor">
                  <section class="settings-resource-basic">
                    <label class="aw-field">
                      <span>所属中心</span>
                      <select v-model="permissionResourceForm.module">
                        <option v-for="option in permissionModuleOptions" :key="option">{{ option }}</option>
                      </select>
                    </label>
                    <label class="aw-field">
                      <span>菜单 / 模块</span>
                      <input v-model="permissionResourceForm.menu" />
                    </label>
                    <label class="aw-field">
                      <span>页面名称</span>
                      <input v-model="permissionResourceForm.page" />
                    </label>
                    <label class="aw-field">
                      <span>资源类型</span>
                      <select v-model="permissionResourceForm.type">
                        <option>页面</option>
                        <option>按钮</option>
                        <option>字段</option>
                        <option>接口</option>
                        <option>数据</option>
                      </select>
                    </label>
                    <label class="aw-field">
                      <span>权限编码</span>
                      <input v-model="permissionResourceForm.code" />
                    </label>
                    <label class="aw-field">
                      <span>状态</span>
                      <select v-model="permissionResourceForm.status">
                        <option>启用</option>
                        <option>停用</option>
                      </select>
                    </label>
                    <label class="aw-field settings-resource-api-field">
                      <span>后端接口</span>
                      <textarea v-model="permissionResourceForm.api" rows="3"></textarea>
                    </label>
                  </section>

                  <section class="settings-resource-config-section">
                    <div class="settings-resource-section-head">
                      <div>
                        <span>页面结构</span>
                        <strong>{{ permissionResourceForm.tabs.length }} 个 Tab</strong>
                      </div>
                      <button class="aw-tool-btn" type="button" @click="addResourceConfigItem('tabs')">添加 Tab</button>
                    </div>
                    <div class="settings-token-list editable">
                      <i v-for="tabName in permissionResourceForm.tabs" :key="tabName">
                        {{ tabName }}
                        <button type="button" @click="removeResourceConfigItem('tabs', tabName)">×</button>
                      </i>
                    </div>
                    <div class="settings-inline-add">
                      <input v-model="resourceConfigDraft.tab" placeholder="输入 Tab 名称，例如：审批记录" @keyup.enter="addResourceConfigItem('tabs')" />
                      <button class="aw-tool-btn" type="button" @click="addResourceConfigItem('tabs')">添加</button>
                    </div>
                  </section>

                  <section class="settings-resource-config-section">
                    <div class="settings-resource-section-head">
                      <div>
                        <span>按钮动作</span>
                        <strong>{{ permissionResourceForm.actions.length }} 个操作</strong>
                      </div>
                    </div>
                    <div class="settings-action-checks">
                      <label v-for="action in defaultResourceActions" :key="action">
                        <input
                          :checked="hasResourceConfigItem('actions', action)"
                          type="checkbox"
                          @change="toggleResourceConfigItem('actions', action, ($event.target as HTMLInputElement).checked)"
                        />
                        <span>{{ action }}</span>
                      </label>
                    </div>
                    <div v-if="customResourceActions(permissionResourceForm).length" class="settings-token-list editable">
                      <i v-for="action in customResourceActions(permissionResourceForm)" :key="action">
                        {{ action }}
                        <button type="button" @click="removeResourceConfigItem('actions', action)">×</button>
                      </i>
                    </div>
                    <div class="settings-inline-add">
                      <input v-model="resourceConfigDraft.action" placeholder="输入自定义按钮，例如：反审核" @keyup.enter="addResourceConfigItem('actions')" />
                      <button class="aw-tool-btn" type="button" @click="addResourceConfigItem('actions')">添加</button>
                    </div>
                  </section>

                  <section class="settings-resource-config-section">
                    <div class="settings-resource-section-head">
                      <div>
                        <span>字段权限</span>
                        <strong>{{ permissionResourceForm.fields.length }} 个字段</strong>
                      </div>
                      <button class="aw-tool-btn" type="button" @click="addResourceConfigItem('fields')">添加字段</button>
                    </div>
                    <div class="settings-token-list editable tall">
                      <i v-for="field in permissionResourceForm.fields" :key="field">
                        {{ field }}
                        <button type="button" @click="removeResourceConfigItem('fields', field)">×</button>
                      </i>
                    </div>
                    <div class="settings-inline-add">
                      <input v-model="resourceConfigDraft.field" placeholder="输入字段名称，例如：客户名称" @keyup.enter="addResourceConfigItem('fields')" />
                      <button class="aw-tool-btn" type="button" @click="addResourceConfigItem('fields')">添加</button>
                    </div>
                  </section>

                  <section class="settings-resource-config-section">
                    <div class="settings-resource-section-head">
                      <div>
                        <span>数据范围维度</span>
                        <strong>{{ resourceConfigItems('dataScopes').length }} 个维度</strong>
                      </div>
                      <button class="aw-tool-btn" type="button" @click="addResourceConfigItem('dataScopes')">添加维度</button>
                    </div>
                    <div class="settings-token-list editable">
                      <i v-for="scope in resourceConfigItems('dataScopes')" :key="scope">
                        {{ scope }}
                        <button type="button" @click="removeResourceConfigItem('dataScopes', scope)">×</button>
                      </i>
                    </div>
                    <div class="settings-inline-add">
                      <input v-model="resourceConfigDraft.dataScope" placeholder="输入数据维度，例如：供应商" @keyup.enter="addResourceConfigItem('dataScopes')" />
                      <button class="aw-tool-btn" type="button" @click="addResourceConfigItem('dataScopes')">添加</button>
                    </div>
                  </section>
                </div>

                <div class="settings-resource-savebar">
                  <span>{{ editingPermissionResourceId ? '编辑资源配置' : '新增资源配置' }}</span>
                  <div class="settings-role-actions">
                    <button class="aw-tool-btn" type="button" @click="backToPermissionResourceList">取消</button>
                    <button class="aw-btn primary" type="button" @click="saveResourceConfig(permissionResourceForm)">保存资源</button>
                  </div>
                </div>
              </div>
            </section>
          </section>

          <div v-else-if="activePermissionTab === 'roles'" class="settings-permission-workbench settings-role-workbench">
            <aside class="settings-role-panel">
              <div class="settings-role-head">
                <div>
                  <strong>角色列表</strong>
                  <span>{{ filteredRoles.length }} 个角色</span>
                </div>
                <button class="aw-tool-btn" type="button" @click="openRole()">新增角色</button>
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
                  <em>{{ role.permissionSummary }}</em>
                </span>
                <i :class="{ off: !role.enabled }">{{ role.enabled ? '启用' : '停用' }}</i>
              </button>
            </aside>

            <section class="settings-role-main">
              <div class="settings-role-overview">
                <div>
                  <span class="settings-role-kicker">当前角色</span>
                  <h3>{{ selectedRole?.name || '未选择角色' }}</h3>
                  <p>{{ selectedRole?.description || '角色是权限包，页面资源、按钮、字段、数据范围都在这里授权。' }}</p>
                </div>
                <div class="settings-role-actions">
                  <button class="aw-tool-btn" type="button" @click="selectedRole && openRole(selectedRole)">编辑角色</button>
                  <button class="aw-tool-btn" type="button" @click="copySelectedRole">复制角色</button>
                  <button class="aw-tool-btn" type="button" @click="toggleSelectedRole">{{ selectedRole?.enabled ? '停用' : '启用' }}</button>
                  <button class="aw-btn primary" type="button" @click="saveAll('角色授权已保存')">保存配置</button>
                </div>
              </div>

              <div class="settings-auth-canvas">
                <section class="settings-auth-resource-panel">
                  <div class="settings-block-head">
                    <div>
                      <strong>授权资源</strong>
                      <p>从资源库选择页面，当前角色只拿被打开的资源做授权。</p>
                    </div>
                    <button class="aw-tool-btn" type="button" @click="grantCurrentRoleAllResources">授权本中心</button>
                  </div>
                  <div class="settings-auth-resource-list">
                    <article
                      v-for="resource in selectedRolePermissionResources"
                      :key="resource.id"
                      :class="['settings-menu-row', { on: activePermissionMenu === resource.menu }]"
                    >
                      <button type="button" @click="selectRoleResource(resource.menu)">
                        <strong>{{ resource.menu }}</strong>
                        <span>{{ resource.page }}</span>
                        <em>{{ resource.tabs.length }} Tab · {{ resource.actions.length }} 操作 · {{ resource.fields.length }} 字段</em>
                      </button>
                      <label class="aw-switch-line mini">
                        <input :checked="hasMenuAccess(resource.menu)" type="checkbox" @change="toggleMenuAccess(resource.menu)" />
                        <i></i>
                      </label>
                    </article>
                  </div>
                </section>

                <section class="settings-auth-detail-panel">
                  <div class="settings-auth-detail-head">
                    <div>
                      <span class="settings-role-kicker">当前资源</span>
                      <strong>{{ activePermissionMenu }}</strong>
                      <p>{{ activePermissionResource?.page || '请选择左侧资源' }}</p>
                    </div>
                    <span :class="['aw-status', activeMenuPermission?.view ? 'green' : 'gray']">{{ activeMenuPermission?.view ? '已授权' : '未授权' }}</span>
                  </div>

                  <div class="settings-auth-detail-grid">
                    <section class="settings-auth-section">
                      <div class="settings-block-head">
                        <div>
                          <strong>按钮动作</strong>
                          <p>配置当前角色在这个页面上的可用操作。</p>
                        </div>
                      </div>
                      <div class="settings-action-grid compact">
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

                    <section class="settings-auth-section">
                      <div class="settings-block-head">
                        <div>
                          <strong>字段控制</strong>
                          <p>字段级权限来自资源定义，角色这里只选择可见、只读或可编辑。</p>
                        </div>
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

                    <section class="settings-auth-section wide">
                      <div class="settings-block-head">
                        <div>
                          <strong>数据范围</strong>
                          <p>数据规则跟随角色，成员和岗位只继承结果。</p>
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
                  </div>
                </section>
              </div>
            </section>
          </div>

          <section v-else-if="activePermissionTab === 'positions'" class="settings-permission-block">
            <div class="settings-block-head">
              <div>
                <strong>岗位默认角色</strong>
                <p>岗位是组织属性，只绑定默认角色；人员换岗后自动继承对应角色权限。</p>
              </div>
              <button class="aw-tool-btn" type="button" @click="openPosition()">新增岗位</button>
            </div>
            <aw-setting-table
              :columns="positionColumns"
              :rows="positionTableRows"
              @delete="removePosition"
              @edit="openPosition"
            >
              <template #cell="{ column, row }">
                <span v-if="column.key === 'defaultRoles'" class="settings-tag-line">{{ row.defaultRoles }}</span>
                <span v-else-if="column.key === 'status'" :class="['aw-status', row.status === '启用' ? 'green' : 'gray']">{{ row.status }}</span>
                <span v-else>{{ row[column.key] }}</span>
              </template>
            </aw-setting-table>
          </section>

          <section v-else class="settings-permission-block">
            <div class="settings-block-head">
              <div>
                <strong>成员权限修正</strong>
                <p>查看某个人从岗位继承、额外角色和临时角色合并后的最终权限来源。</p>
              </div>
              <button class="aw-tool-btn" type="button" @click="openMemberPermission()">新增成员授权</button>
            </div>
            <aw-setting-table
              :columns="memberColumns"
              :rows="memberTableRows"
              @delete="removeMemberPermission"
              @edit="openMemberPermission"
            >
              <template #cell="{ column, row }">
                <span v-if="['inheritedRoles', 'extraRoles', 'finalRoles'].includes(column.key)" class="settings-tag-line">{{ row[column.key] }}</span>
                <span v-else-if="column.key === 'status'" :class="['aw-status', row.status === '在职' ? 'green' : 'gray']">{{ row.status }}</span>
                <span v-else>{{ row[column.key] }}</span>
              </template>
              <template #actions="{ row }">
                <span class="aw-link" @click="openMemberEffectivePermission(row)">最终权限</span>
                <span class="aw-action-split">|</span>
                <span class="aw-link" @click="openMemberPermission(row)">额外授权</span>
              </template>
            </aw-setting-table>
          </section>
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
            <template #cell="{ column, row }">
              <span v-if="column.key === 'status'" :class="['aw-status', integrationStatusTone(row.status)]">{{ row.status }}</span>
              <span v-else>{{ row[column.key] }}</span>
            </template>
            <template #actions="{ row }">
              <button class="aw-link settings-action-link" type="button" @click="openPartner(row)">查看</button>
              <span class="aw-action-split">|</span>
              <button class="aw-link settings-action-link" type="button" @click="openPurchaseModal(row)">购买</button>
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
      :open="modal.open"
      :title="modal.title"
      width="720px"
      @cancel="closeModal"
      @confirm="confirmModal"
    >
      <div v-if="modal.kind === 'message'" class="settings-modal-message">{{ modal.message }}</div>
      <template v-else>
        <label
          v-for="field in modalFields"
          :key="field.key"
          :class="['aw-field', { 'aw-field-full': field.span === 'full' }]"
        >
          <span>{{ field.label }}</span>
          <select
            v-if="modalFieldOptions(field).length"
            :value="String(modal.form[field.key] ?? '')"
            @change="setModalValue(field.key, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="option in modalFieldOptions(field)" :key="option">{{ option }}</option>
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
      </template>
    </aw-setting-modal>

    <aw-setting-modal
      :open="roleGrantModal.open"
      title="配置角色授权"
      width="min(1180px, calc(100vw - 96px))"
      @cancel="closeRoleGrantModal"
      @confirm="confirmRoleGrantModal"
    >
      <section v-if="activeGrantResource" class="settings-grant-dialog">
        <div class="settings-grant-resource">
          <div class="settings-grant-title">
            <div>
              <strong>{{ activeGrantResource.menu }}</strong>
              <p>{{ activeGrantResource.page }}</p>
            </div>
            <span :class="['aw-status', activeGrantResource.status === '启用' ? 'green' : 'gray']">{{ activeGrantResource.status }}</span>
          </div>
          <div class="settings-grant-meta">
            <span><b>所属模块</b>{{ activeGrantResource.module }}</span>
            <span><b>资源类型</b>{{ activeGrantResource.type }}</span>
            <span><b>权限编码</b>{{ activeGrantResource.code }}</span>
            <span><b>Tab</b>{{ activeGrantResource.tabs.length }} 个</span>
            <span><b>操作</b>{{ activeGrantResource.actions.length }} 个</span>
            <span><b>字段</b>{{ activeGrantResource.fields.length }} 个</span>
            <span class="wide"><b>后端接口</b>{{ activeGrantResource.api }}</span>
          </div>
        </div>

        <div class="settings-block-head">
          <div>
            <strong>角色授权</strong>
            <p>按角色配置当前资源的页面访问和按钮级操作权限；Tab 和字段默认继承资源定义。</p>
          </div>
          <div class="settings-role-actions">
            <button class="aw-tool-btn" type="button" @click="toggleAllRolesForGrant(true)">全部授权</button>
            <button class="aw-tool-btn" type="button" @click="toggleAllRolesForGrant(false)">取消授权</button>
          </div>
        </div>

        <div class="settings-grant-table-wrap">
          <table class="aw-table settings-grant-table">
            <thead>
              <tr>
                <th>角色</th>
                <th>成员数</th>
                <th>数据范围</th>
                <th>页面访问</th>
                <th>操作权限</th>
                <th>Tab / 字段</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in grantRoleOptions" :key="role.id">
                <td>
                  <strong>{{ role.name }}</strong>
                  <em>{{ role.permissionSummary }}</em>
                </td>
                <td>{{ role.users }}</td>
                <td>{{ dataPermissionNameForRole(role.id) }}</td>
                <td>
                  <label class="aw-switch-line mini">
                    <input :checked="roleHasGrant(role.id)" type="checkbox" @change="toggleRoleGrant(role.id, ($event.target as HTMLInputElement).checked)" />
                    <i></i>
                  </label>
                </td>
                <td>
                  <div class="settings-grant-actions">
                    <label
                      v-for="action in grantActionOptions"
                      :key="action.key"
                      :class="{ disabled: !roleHasGrant(role.id) }"
                    >
                      <input
                        :checked="roleActionChecked(role.id, action.key)"
                        :disabled="!roleHasGrant(role.id)"
                        type="checkbox"
                        @change="toggleRoleAction(role.id, action.key, ($event.target as HTMLInputElement).checked)"
                      />
                      <span>{{ action.label }}</span>
                    </label>
                  </div>
                </td>
                <td>
                  <span class="settings-tag-line">Tab {{ roleGrantTabCount(role.id) }}</span>
                  <span class="settings-tag-line">字段 {{ roleGrantFieldCount(role.id) }}</span>
                </td>
                <td><span :class="['aw-status', role.enabled ? 'green' : 'gray']">{{ role.enabled ? '启用' : '停用' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <template #footer>
        <button class="aw-tool-btn" type="button" @click="closeRoleGrantModal">取消</button>
        <button class="aw-btn primary" type="button" @click="confirmRoleGrantModal">保存授权</button>
      </template>
    </aw-setting-modal>

    <aw-setting-modal
      :open="purchaseModal.open"
      title="购买集成设备"
      width="620px"
      @cancel="closePurchaseModal"
      @confirm="closePurchaseModal"
    >
      <section class="settings-purchase-modal">
        <div class="settings-qr-card">
          <div class="settings-qr-code" aria-label="购买联系二维码">
            <i v-for="(cell, index) in purchaseQrCells" :key="index" :class="{ on: cell }"></i>
          </div>
          <span>二维码</span>
        </div>
        <div class="settings-purchase-info">
          <strong>{{ purchaseModal.deviceName || '集成设备' }}</strong>
          <p>扫码联系购买对接设备或服务</p>
          <dl>
            <div>
              <dt>联系人名称</dt>
              <dd>{{ purchaseContact.name }}</dd>
            </div>
            <div>
              <dt>联系电话</dt>
              <dd>{{ purchaseContact.phone }}</dd>
            </div>
          </dl>
        </div>
      </section>
      <template #footer>
        <button class="aw-btn primary" type="button" @click="closePurchaseModal">知道了</button>
      </template>
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
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import { getSettingsCenterData, saveSettingsCenterData } from '@/app/api/settings/resources';
import { topNavItems } from '@/layouts/erp-shell/navigation';
import type {
  ApiKeyRow,
  AuditLogRow,
  CurrencySettingRow,
  DataPermissionRow,
  DataTaskRow,
  GuideModule,
  IntegrationRow,
  MemberPermissionRow,
  NotificationRule,
  PermissionResourceRow,
  PositionRow,
  RolePermissionRow,
  RoleRow,
  SecurityRule,
  SettingsCenterData,
  SettingsSectionKey,
  SyncTaskRow,
  UnitSettingRow,
} from '@/app/api/settings/types';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';
import type { SettingTableColumn, SettingTableRow } from '@/components/setting-page/types';

type ModalField = { key: string; label: string; type?: 'textarea'; options?: string[]; span?: 'full' };
type PartnerVendorPreset = {
  name: string;
  product: string;
  driver: string;
  endpoint: string;
};
type PartnerDevicePreset = {
  name: string;
  type: string;
  method: string;
  purpose: string;
  vendors: PartnerVendorPreset[];
};

const router = useRouter();
const route = useRoute();
const keyword = ref('');
const listToolbarMessage = ref('');
const toastText = ref('');
type PermissionTabKey = 'resources' | 'roles' | 'positions' | 'members';
type PermissionResourcePageMode = 'list' | 'form';
const activePermissionTab = ref<PermissionTabKey>('resources');
const permissionResourcePageMode = ref<PermissionResourcePageMode>('list');
const selectedRoleId = ref('');
const selectedFunctionPermissionId = ref('');
const selectedPermissionResourceIds = ref<string[]>([]);
const selectedUnitIds = ref<string[]>([]);
const selectedCurrencyIds = ref<string[]>([]);
const activeUnitGroupKey = ref('all');
const unitColumnFilters = ref<Record<string, string>>({});
const currencyColumnFilters = ref<Record<string, string>>({});
const selectedMemberPermissionId = ref('');
const activePermissionModuleKey = ref('all');
const activePermissionResourceId = ref('');
const editingPermissionResourceId = ref('');
const activePermissionMenu = ref('项目管理');
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
    units: [],
    currencies: [],
  },
  permissions: { resources: [], roles: [], functionPermissions: [], rolePermissions: [], dataPermissions: [], accountTree: [], permissionTree: [], accountPermissions: [], superAdmins: [], positions: [], members: [] },
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
const roleGrantModal = reactive({
  open: false,
  resourceId: '',
});
const purchaseModal = reactive({
  open: false,
  deviceName: '',
});
const purchaseContact = {
  name: '王经理',
  phone: '138-0000-6008',
};
const purchaseQrCells = Array.from({ length: 121 }, (_, index) => {
  const row = Math.floor(index / 11);
  const col = index % 11;
  const inFinder = (row < 4 && col < 4) || (row < 4 && col > 6) || (row > 6 && col < 4);
  const finderRing = inFinder && (row % 3 === 0 || col % 3 === 0 || row === 1 || col === 1);
  return finderRing || ((row * 5 + col * 7 + row * col) % 4 === 0) || (row + col) % 7 === 0;
});
const resourceConfigDraft = reactive({
  tab: '',
  action: '',
  field: '',
  dataScope: '',
});

const sectionMeta: Record<SettingsSectionKey, { label: string; route: string; desc: string; addText: string; search: string }> = {
  system: { label: '系统设置', route: '/settings/system', desc: '企业信息 / Logo', addText: '保存企业信息', search: '搜索企业信息、Logo、企业资料' },
  units: { label: '单位管理', route: '/settings/units', desc: '维护全局单位、分类和换算规则', addText: '新增单位', search: '搜索单位名称、代码、分类、别名' },
  currencies: { label: '币种管理', route: '/settings/currencies', desc: '维护全局币种、基础币和汇率精度', addText: '新增币种', search: '搜索币种名称、代码、符号、来源' },
  permissions: { label: '权限管理', route: '/settings/permissions', desc: '资源先定义，角色做授权，岗位绑定默认角色，成员查看最终权限', addText: '新增角色', search: '搜索资源、角色、岗位、成员、数据范围' },
  security: { label: '安全中心', route: '/settings/security', desc: '密码策略、登录限制、双因子认证', addText: '新增安全规则', search: '搜索安全项、适用范围、负责人' },
  data: { label: '日志与数据', route: '/settings/data', desc: '操作日志 / 审计、数据备份、导入 / 导出', addText: '新增数据任务', search: '搜索日志、任务、操作人' },
  integrations: { label: '集成与接口', route: '/settings/integrations', desc: '第三方对接、开放 API / 密钥管理、数据同步配置', addText: '新增集成配置', search: '搜索系统、应用、同步任务' },
  guide: { label: '初始化引导', route: '/settings/guide', desc: '引导总览、配置任务、引导模板、进度校验', addText: '新增引导', search: '搜索模块、任务、模板' },
};

const sectionCards = Object.entries(sectionMeta)
  .filter(([key]) => key !== 'guide')
  .map(([key, item]) => ({ key, ...item }));
const currentSection = computed<SettingsSectionKey>(() => {
  const section = String(route.path.split('/')[2] || '');
  if (['system', 'units', 'currencies', 'permissions', 'security', 'data', 'integrations'].includes(section)) return section as SettingsSectionKey;
  return 'system';
});
const isListMasterSection = computed(() => currentSection.value === 'units' || currentSection.value === 'currencies');
const currentTitle = computed(() => sectionMeta[currentSection.value].label);
const currentDescription = computed(() => sectionMeta[currentSection.value].desc);
const currentSearchPlaceholder = computed(() => sectionMeta[currentSection.value].search);
const currentAddText = computed(() => {
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'resources') return '新增资源';
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'roles') return '新增角色';
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'positions') return '新增岗位';
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'members') return '新增成员授权';
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

const unitGroupOptions = ['计数', '重量', '长度', '面积', '体积/容量', '包装', '时间', '能耗', '自定义'];
const currencyRateModeOptions = ['自动同步', '手动维护', '固定'];
const currencyRateSourceOptions = ['中国外汇交易中心', '中国银行牌价', '欧洲央行 ECB', '自定义', '基础币'];
const currencyUpdateCycleOptions = ['实时', '每小时', '每日', '手动', '固定'];
const defaultUnitSettings: UnitSettingRow[] = [
  { id: 'unit-pcs', group: '计数', code: 'PCS', name: '个', symbol: '个', baseUnit: '个', factor: '1', aliases: '件 / 只', isBase: true, enabled: true },
  { id: 'unit-set', group: '计数', code: 'SET', name: '套', symbol: '套', baseUnit: '个', factor: '1', aliases: '成套 / 组件', isBase: false, enabled: true },
  { id: 'unit-kg', group: '重量', code: 'KG', name: 'kg', symbol: 'kg', baseUnit: 'kg', factor: '1', aliases: '千克 / 公斤', isBase: true, enabled: true },
  { id: 'unit-g', group: '重量', code: 'G', name: 'g', symbol: 'g', baseUnit: 'kg', factor: '0.001', aliases: '克', isBase: false, enabled: true },
  { id: 'unit-m', group: '长度', code: 'M', name: 'm', symbol: 'm', baseUnit: 'm', factor: '1', aliases: '米', isBase: true, enabled: true },
  { id: 'unit-roll', group: '长度', code: 'ROLL', name: '卷', symbol: '卷', baseUnit: 'm', factor: '100', aliases: '卷料 / 100m', isBase: false, enabled: true },
  { id: 'unit-box', group: '包装', code: 'CTN', name: '箱', symbol: '箱', baseUnit: '箱', factor: '1', aliases: '箱装', isBase: true, enabled: true },
];
const defaultCurrencySettings: CurrencySettingRow[] = [
  { id: 'currency-cny', code: 'CNY', name: '人民币', symbol: '¥', precision: 2, exchangeRate: '1', rateMode: '固定', rateSource: '基础币', updateCycle: '固定', rateUpdatedAt: '2026-06-06 09:00', isBase: true, enabled: true },
  { id: 'currency-usd', code: 'USD', name: '美元', symbol: '$', precision: 2, exchangeRate: '7.2000', rateMode: '自动同步', rateSource: '中国外汇交易中心', updateCycle: '每日', rateUpdatedAt: '2026-06-06 09:00', isBase: false, enabled: true },
  { id: 'currency-eur', code: 'EUR', name: '欧元', symbol: 'EUR', precision: 2, exchangeRate: '7.8500', rateMode: '自动同步', rateSource: '中国外汇交易中心', updateCycle: '每日', rateUpdatedAt: '2026-06-06 09:00', isBase: false, enabled: true },
  { id: 'currency-hkd', code: 'HKD', name: '港币', symbol: 'HK$', precision: 2, exchangeRate: '0.9200', rateMode: '自动同步', rateSource: '中国外汇交易中心', updateCycle: '每日', rateUpdatedAt: '2026-06-06 09:00', isBase: false, enabled: true },
];
const permissionTabs = [
  { key: 'resources', label: '资源配置' },
  { key: 'roles', label: '角色授权' },
  { key: 'positions', label: '岗位继承' },
  { key: 'members', label: '成员修正' },
] as const;
const guideTabs = [
  { key: 'overview', label: '引导总览' },
  { key: 'tasks', label: '配置任务' },
  { key: 'templates', label: '引导模板' },
  { key: 'progress', label: '进度校验' },
] as const;
const permissionTopModules = topNavItems.map((item) => ({
  key: item.key,
  label: item.title.includes('中心') ? item.title : item.label,
  icon: item.icon,
  route: item.route,
  sideItems: item.sideItems,
  aliases: Array.from(new Set([item.title, item.label])),
}));
const permissionModuleOptions = permissionTopModules.map((item) => item.label);
const defaultResourceActions = ['查看', '新增', '编辑', '删除', '导入', '导出', '审批'];
const defaultResourceDataScopes = ['部门', '区域', '客户', '项目', '文档', '产品 / 物料', 'BOM'];
const permissionResourceForm = reactive<PermissionResourceRow>({
  id: '',
  module: '研发中心',
  menu: '',
  page: '',
  type: '页面',
  code: '',
  tabs: [],
  actions: [...defaultResourceActions],
  fields: [],
  dataScopes: [...defaultResourceDataScopes],
  api: '',
  status: '启用',
});
const permissionActionKeys = ['view', 'create', 'edit', 'delete', 'import', 'export', 'approve'] as const;
type PermissionActionKey = typeof permissionActionKeys[number];
type FieldPermissionState = 'hidden' | 'readonly' | 'edit';
type DataScopeKey = 'department' | 'region' | 'customerScope' | 'projectScope' | 'documentScope' | 'materialScope' | 'bomScope';
type ResourceConfigListKey = 'tabs' | 'actions' | 'fields' | 'dataScopes';
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
const partnerDevicePresets: PartnerDevicePreset[] = [
  {
    name: '标签打印机',
    type: '打印设备',
    method: '局域网 IP',
    purpose: '入库标签、库位标签、产品条码打印',
    vendors: [
      { name: '斑马 Zebra', product: 'ZT411 工业标签打印机', driver: 'ZPL 打印协议', endpoint: '192.168.10.42:9100' },
      { name: '得力 Deli', product: 'DL-888D 标签打印机', driver: 'DPL 打印协议', endpoint: '192.168.10.43:9100' },
    ],
  },
  {
    name: '考勤机',
    type: '考勤设备',
    method: 'TCP / SDK',
    purpose: '员工考勤记录采集、班次打卡同步',
    vendors: [
      { name: '中控智慧 ZKTeco', product: 'iFace702 人脸考勤机', driver: 'ZKAccess SDK', endpoint: '192.168.20.18:4370' },
      { name: '海康威视 Hikvision', product: 'DS-K1T 系列考勤终端', driver: 'ISAPI 考勤接口', endpoint: '192.168.20.19:80' },
    ],
  },
  {
    name: '电子地磅',
    type: '称重设备',
    method: '串口 / 网关',
    purpose: '收发货称重、过磅数据采集',
    vendors: [
      { name: '梅特勒-托利多', product: 'IND570 称重仪表', driver: 'Modbus RTU / TCP 网关', endpoint: 'COM3 / 192.168.30.21:502' },
      { name: '耀华称重', product: 'XK3190 称重仪表', driver: '串口称重接口', endpoint: 'COM4 / 9600' },
    ],
  },
  {
    name: 'apd',
    type: '扫码设备',
    method: 'TCP / SDK',
    purpose: '移动扫码、库存盘点、收发货校验',
    vendors: [
      { name: '新大陆 Newland', product: 'MT90 数据采集终端', driver: 'Newland Mobile SDK', endpoint: '192.168.20.31:8080' },
      { name: '霍尼韦尔 Honeywell', product: 'EDA52 数据采集终端', driver: 'Honeywell Mobility SDK', endpoint: '192.168.20.32:8080' },
    ],
  },
  {
    name: '电子秤',
    type: '称重设备',
    method: '串口 / 网关',
    purpose: '抽检称重、包装称重、重量数据采集',
    vendors: [
      { name: '香山 Senssun', product: 'ACS-30 电子计价秤', driver: '串口称重接口', endpoint: 'COM5 / 9600' },
      { name: '耀华称重', product: 'TCS-150 电子台秤', driver: 'RS232 称重接口', endpoint: 'COM6 / 9600' },
    ],
  },
  {
    name: '扫码枪',
    type: '扫码设备',
    method: 'USB 驱动',
    purpose: '条码扫描、入出库扫码校验',
    vendors: [
      { name: '霍尼韦尔 Honeywell', product: 'Voyager 1450g 扫码枪', driver: 'HID 键盘口接口', endpoint: 'USB-HID' },
      { name: '新大陆 Newland', product: 'NVH220 扫码枪', driver: 'USB CDC 扫码接口', endpoint: 'USB-CDC' },
    ],
  },
  {
    name: '工控网关',
    type: '工控设备',
    method: 'OPC UA',
    purpose: '工控设备数据采集、设备状态同步',
    vendors: [
      { name: '西门子 Siemens', product: 'SIMATIC IOT2050', driver: 'OPC UA 接口', endpoint: 'opc.tcp://192.168.40.10:4840' },
      { name: '研华 Advantech', product: 'UNO-2271G 工控网关', driver: 'MQTT / OPC UA 接口', endpoint: 'opc.tcp://192.168.40.11:4840' },
    ],
  },
];
const partnerDeviceNames = partnerDevicePresets.map((item) => item.name);
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

const unitListColumns: AwTableColumn[] = [
  { key: 'group', title: '分类', width: 96, filterOptions: unitGroupOptions },
  { key: 'code', title: '单位代码', width: 110 },
  { key: 'name', title: '单位名称', width: 110 },
  { key: 'symbol', title: '显示符号', width: 96 },
  { key: 'isBase', title: '基础单位', width: 110, filterOptions: ['基础单位', '换算单位'] },
  { key: 'conversionText', title: '换算关系', width: 180 },
  { key: 'aliases', title: '别名 / 说明', width: 180 },
  { key: 'enabled', title: '状态', width: 90 },
  { key: 'action', title: '操作', fixed: 'right', width: 170 },
];
const currencyListColumns: AwTableColumn[] = [
  { key: 'code', title: '币种代码', width: 110 },
  { key: 'name', title: '币种名称', width: 130 },
  { key: 'symbol', title: '符号', width: 90 },
  { key: 'precision', title: '金额精度', width: 90 },
  { key: 'exchangeRate', title: '当前汇率', width: 110 },
  { key: 'rateMode', title: '维护方式', width: 110, filterOptions: currencyRateModeOptions },
  { key: 'rateSource', title: '汇率来源', width: 150 },
  { key: 'rateUpdatedAt', title: '更新时间', width: 140 },
  { key: 'isBase', title: '基础币', width: 100, filterOptions: ['基础币', '非基础币'] },
  { key: 'enabled', title: '状态', width: 90 },
  { key: 'action', title: '操作', fixed: 'right', width: 120 },
];
const roleColumns: SettingTableColumn[] = [
  { key: 'name', label: '角色' },
  { key: 'center', label: '适用中心' },
  { key: 'users', label: '成员数', width: '90px' },
  { key: 'permissionSummary', label: '授权范围' },
  { key: 'dataPolicy', label: '数据权限模板' },
  { key: 'updated', label: '更新日期' },
  { key: 'enabled', label: '启用', width: '90px' },
];
const permissionResourceColumns: AwTableColumn[] = [
  { key: 'module', title: '所属模块', width: 100 },
  { key: 'menu', title: '菜单 / 资源组', width: 130 },
  { key: 'page', title: '页面 / 资源名称', width: 180 },
  { key: 'type', title: '资源类型', width: 90 },
  { key: 'code', title: '权限编码', width: 120 },
  { key: 'tabCount', title: 'Tab', width: 80 },
  { key: 'actionCount', title: '操作', width: 90 },
  { key: 'fieldCount', title: '字段', width: 90 },
  { key: 'api', title: '后端接口', width: 210 },
  { key: 'status', title: '状态', width: 86 },
  { key: 'action', title: '操作', fixed: 'right', width: 132 },
];
const permissionResourceBulkActions: AwBulkAction[] = [
  { key: 'enable', label: '批量启用' },
  { key: 'disable', label: '批量停用' },
];
const basicBulkActions: AwBulkAction[] = [
  { key: 'enable', label: '批量启用' },
  { key: 'disable', label: '批量停用' },
];
const functionColumns: SettingTableColumn[] = [
  { key: 'roleId', label: '适用角色' },
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
  { key: 'roleId', label: '适用角色' },
  { key: 'center', label: '适用中心' },
  { key: 'department', label: '部门范围' },
  { key: 'projectScope', label: '项目范围' },
  { key: 'documentScope', label: '文档范围' },
  { key: 'bomScope', label: 'BOM 范围' },
  { key: 'enabled', label: '生效', width: '90px' },
];
const positionColumns: SettingTableColumn[] = [
  { key: 'name', label: '岗位' },
  { key: 'department', label: '所属组织' },
  { key: 'level', label: '职级' },
  { key: 'defaultRoles', label: '默认角色' },
  { key: 'members', label: '成员数', width: '90px' },
  { key: 'owner', label: '负责人' },
  { key: 'status', label: '状态', width: '90px' },
  { key: 'updated', label: '更新日期' },
];
const memberColumns: SettingTableColumn[] = [
  { key: 'name', label: '成员' },
  { key: 'employeeNo', label: '工号' },
  { key: 'department', label: '部门' },
  { key: 'position', label: '岗位' },
  { key: 'inheritedRoles', label: '岗位继承角色' },
  { key: 'extraRoles', label: '额外 / 临时角色' },
  { key: 'finalRoles', label: '最终角色' },
  { key: 'dataScopeOverride', label: '数据范围特例' },
  { key: 'status', label: '状态', width: '90px' },
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
  { key: 'serialNo', label: '序号', width: '70px' },
  { key: 'name', label: '设备名称' },
  { key: 'type', label: '设备类型' },
  { key: 'method', label: '连接方式' },
  { key: 'location', label: '使用位置' },
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

function normalizeModuleText(value: string) {
  return value.trim().replace(/\s+/g, '');
}

function normalizeCodeText(value: string) {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function matchesPermissionModule(moduleName: string, moduleKey: string) {
  if (moduleKey === 'all') return true;
  const module = permissionTopModules.find((item) => item.key === moduleKey);
  if (!module) return false;
  const normalized = normalizeModuleText(moduleName);
  return module.aliases.some((alias) => normalizeModuleText(alias) === normalized);
}

function moduleKeyByName(moduleName: string) {
  return permissionTopModules.find((module) => matchesPermissionModule(moduleName, module.key))?.key || '';
}

function scopeCenterKey(scopeKey: string) {
  if (scopeKey.startsWith('module:')) return scopeKey.split(':')[1] || '';
  if (scopeKey.startsWith('center:')) return scopeKey.split(':')[1] || '';
  return '';
}

function scopeModuleKey(scopeKey: string) {
  if (!scopeKey.startsWith('module:')) return '';
  return scopeKey.split(':')[2] || '';
}

function sideItemByScope(scopeKey: string) {
  const centerKey = scopeCenterKey(scopeKey);
  const moduleKey = scopeModuleKey(scopeKey);
  return permissionTopModules.find((center) => center.key === centerKey)?.sideItems.find((item) => item.key === moduleKey);
}

function sideItemByMenu(moduleName: string, menu: string) {
  const centerKey = moduleKeyByName(moduleName);
  return permissionTopModules.find((center) => center.key === centerKey)?.sideItems.find((item) => item.label === menu);
}

function matchesPermissionScope(resource: PermissionResourceRow, scopeKey: string) {
  if (scopeKey === 'all') return true;
  const centerKey = scopeCenterKey(scopeKey);
  if (!centerKey || !matchesPermissionModule(resource.module, centerKey)) return false;
  const moduleKey = scopeModuleKey(scopeKey);
  if (!moduleKey) return true;
  const sideItem = permissionTopModules.find((center) => center.key === centerKey)?.sideItems.find((item) => item.key === moduleKey);
  return sideItem ? resource.menu === sideItem.label : false;
}

function buildResourceTabs(menu: string, flyout?: Array<{ title: string; items: Array<{ label: string }> }>) {
  const flyoutLabels = flyout
    ?.flatMap((section) => section.items.map((item) => item.label))
    .filter((label) => !label.includes('新增') && !label.includes('设置') && !label.includes('详情')) || [];
  const baseTabs = menu.includes('工作台')
    ? ['总览', '待办', '指标', '消息', '操作记录']
    : ['列表', '详情', '审批记录', '附件', '操作记录'];
  return Array.from(new Set([...baseTabs, ...flyoutLabels])).slice(0, 8);
}

function buildResourceFields(menu: string) {
  const baseName = menu.replace(/管理$/, '').replace(/中心$/, '');
  return [
    `${baseName}编号`,
    `${baseName}名称`,
    '所属组织',
    '负责人',
    '业务状态',
    '创建时间',
    '更新时间',
    '备注',
  ];
}

function buildResourceApi(route: string) {
  const normalizedRoute = route.replace(/\/$/, '') || '/';
  return `GET /api/v1${normalizedRoute}`;
}

function generatedResourceForSideItem(center: typeof permissionTopModules[number], sideItem: typeof permissionTopModules[number]['sideItems'][number]): PermissionResourceRow {
  const centerCode = normalizeCodeText(center.key);
  const menuCode = normalizeCodeText(sideItem.key);
  const menu = sideItem.label;
  return {
    id: `res-${centerCode}-${menuCode}`,
    module: center.label,
    menu,
    page: menu.includes('工作台') ? `${menu} / 待办看板` : `${menu}列表 / ${menu}详情`,
    type: '页面',
    code: `${centerCode}.${menuCode}`,
    tabs: buildResourceTabs(menu, sideItem.flyout),
    actions: [...defaultResourceActions],
    fields: buildResourceFields(menu),
    dataScopes: [...defaultResourceDataScopes],
    api: buildResourceApi(sideItem.route),
    status: '启用',
  };
}

function ensureResourceConfigDefaults(resource: PermissionResourceRow) {
  if (!resource.tabs?.length) resource.tabs = buildResourceTabs(resource.menu);
  if (!resource.actions?.length) resource.actions = [...defaultResourceActions];
  if (!resource.fields?.length) resource.fields = buildResourceFields(resource.menu);
  if (!resource.dataScopes?.length) resource.dataScopes = [...defaultResourceDataScopes];
  if (!resource.api) resource.api = buildResourceApi(sideItemByMenu(resource.module, resource.menu)?.route || '');
}

function defaultResourcePageName(menu: string) {
  if (!menu) return '';
  return menu.includes('工作台') ? `${menu} / 待办看板` : `${menu}列表 / ${menu}详情`;
}

function defaultResourceCode(moduleName: string, menu: string) {
  const sideItem = sideItemByMenu(moduleName, menu);
  const centerCode = normalizeCodeText(moduleKeyByName(moduleName) || moduleName);
  const menuCode = normalizeCodeText(sideItem?.key || menu);
  return menuCode ? `${centerCode}.${menuCode}` : '';
}

function createPermissionResourceDraft(resource?: Partial<PermissionResourceRow>): PermissionResourceRow {
  const center = activePermissionCenter.value;
  const selectedSideItem = activePermissionSideItem.value;
  const module = String(resource?.module || center?.label || defaultPermissionResourceModule.value || '研发中心');
  const menu = String(resource?.menu || selectedSideItem?.label || '');
  const sideItem = resource?.menu ? sideItemByMenu(module, menu) : selectedSideItem || sideItemByMenu(module, menu);
  return {
    id: String(resource?.id || ''),
    module,
    menu,
    page: String(resource?.page || defaultResourcePageName(menu)),
    type: (resource?.type || '页面') as PermissionResourceRow['type'],
    code: String(resource?.code || defaultResourceCode(module, menu)),
    tabs: resource?.tabs?.length ? [...resource.tabs] : (menu ? buildResourceTabs(menu, sideItem?.flyout) : []),
    actions: resource?.actions?.length ? [...resource.actions] : [...defaultResourceActions],
    fields: resource?.fields?.length ? [...resource.fields] : (menu ? buildResourceFields(menu) : []),
    dataScopes: resource?.dataScopes?.length ? [...resource.dataScopes] : [...defaultResourceDataScopes],
    api: String(resource?.api || (menu ? buildResourceApi(sideItem?.route || '') : '')),
    status: (resource?.status || '启用') as PermissionResourceRow['status'],
  };
}

function resetResourceConfigDraft() {
  resourceConfigDraft.tab = '';
  resourceConfigDraft.action = '';
  resourceConfigDraft.field = '';
  resourceConfigDraft.dataScope = '';
}

function assignPermissionResourceForm(resource?: Partial<PermissionResourceRow>) {
  Object.assign(permissionResourceForm, createPermissionResourceDraft(resource));
  resetResourceConfigDraft();
}

function ensurePermissionCatalog() {
  data.permissions.resources.forEach((resource) => ensureResourceConfigDefaults(resource));
  const existingKeys = new Set(data.permissions.resources.map((resource) => `${normalizeModuleText(resource.module)}::${normalizeModuleText(resource.menu)}`));
  permissionTopModules.forEach((center) => {
    center.sideItems.forEach((sideItem) => {
      const key = `${normalizeModuleText(center.label)}::${normalizeModuleText(sideItem.label)}`;
      if (!existingKeys.has(key)) {
        data.permissions.resources.push(generatedResourceForSideItem(center, sideItem));
        existingKeys.add(key);
      }
    });
  });
}

function ensurePermissionRoles() {
  permissionTopModules.forEach((center) => {
    const hasCenterRole = data.permissions.roles.some((role) => normalizeModuleText(role.center) === normalizeModuleText(center.label));
    if (hasCenterRole) return;
    const code = normalizeCodeText(center.key);
    const roles: RoleRow[] = [
      {
        id: `role-${code}-admin`,
        name: `${center.label}管理员`,
        center: center.label,
        users: 0,
        description: `维护${center.label}的资源、角色和授权策略。`,
        permissionSummary: `${center.label}全部资源`,
        dataPolicy: `${center.label}全量数据`,
        updated: new Date().toISOString().slice(0, 10),
        enabled: true,
      },
      {
        id: `role-${code}-manager`,
        name: `${center.label}主管`,
        center: center.label,
        users: 0,
        description: `负责${center.label}核心业务页面的维护和审批。`,
        permissionSummary: `${center.label}核心模块`,
        dataPolicy: '本部门及下级数据',
        updated: new Date().toISOString().slice(0, 10),
        enabled: true,
      },
      {
        id: `role-${code}-viewer`,
        name: `${center.label}只读`,
        center: center.label,
        users: 0,
        description: `适用于跨部门协作查看${center.label}资料。`,
        permissionSummary: `${center.label}只读`,
        dataPolicy: '授权范围只读数据',
        updated: new Date().toISOString().slice(0, 10),
        enabled: true,
      },
    ];
    data.permissions.roles.push(...roles);
    roles.forEach((role) => {
      data.permissions.dataPermissions.push({
        id: `data-${role.id}`,
        name: role.dataPolicy,
        roleId: role.id,
        center: center.label,
        department: role.id.endsWith('admin') ? '全部部门' : '本部门及下级',
        region: '全部区域',
        customerScope: '授权客户',
        projectScope: '授权项目',
        documentScope: '授权文档',
        materialScope: '授权产品 / 物料',
        bomScope: '授权 BOM',
        enabled: true,
      });
    });
  });
}

function cloneSettingRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

function unitDisplayName(unit: Pick<UnitSettingRow, 'name' | 'symbol'>) {
  return unit.symbol || unit.name;
}

function formatUnitFactor(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '1';
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return String(rounded).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function getUnitBaseByGroup(group: string) {
  return data.system.units.find((unit) => unit.group === group && unit.isBase);
}

function setUnitBaseInGroup(baseUnit: UnitSettingRow) {
  const groupUnits = data.system.units.filter((unit) => unit.group === baseUnit.group);
  if (!groupUnits.length) return;
  const baseLabel = unitDisplayName(baseUnit);
  const baseFactor = Number(baseUnit.factor || 1) || 1;
  groupUnits.forEach((unit) => {
    const previousFactor = Number(unit.factor || 1) || 1;
    unit.isBase = unit.id === baseUnit.id;
    unit.baseUnit = baseLabel;
    unit.factor = unit.isBase ? '1' : formatUnitFactor(previousFactor / baseFactor);
  });
  baseUnit.enabled = true;
}

function ensureUnitBaseRules() {
  const groups = Array.from(new Set(data.system.units.map((unit) => unit.group).filter(Boolean)));
  groups.forEach((group) => {
    const groupUnits = data.system.units.filter((unit) => unit.group === group);
    if (!groupUnits.length) return;
    let baseUnit = groupUnits.find((unit) => unit.isBase);
    if (!baseUnit) {
      baseUnit = groupUnits.find((unit) => unit.factor === '1' && [unit.name, unit.symbol].includes(unit.baseUnit)) || groupUnits[0];
    }
    setUnitBaseInGroup(baseUnit);
  });
}

function unitConversionText(unit: UnitSettingRow) {
  return `1 ${unitDisplayName(unit)} = ${unit.factor || '1'} ${unit.baseUnit || unitDisplayName(unit)}`;
}

function unitBaseOptions(group: string) {
  const baseUnit = getUnitBaseByGroup(group);
  const options = [baseUnit ? unitDisplayName(baseUnit) : ''].filter(Boolean);
  return Array.from(new Set(options));
}

function ensureSystemBasics() {
  if (!Array.isArray(data.system.units)) data.system.units = [];
  if (!Array.isArray(data.system.currencies)) data.system.currencies = [];
  if (!data.system.units.length) data.system.units.push(...cloneSettingRows(defaultUnitSettings));
  if (!data.system.currencies.length) data.system.currencies.push(...cloneSettingRows(defaultCurrencySettings));
  ensureUnitBaseRules();
  data.system.currencies.forEach((currency) => {
    if (!currency.rateMode) currency.rateMode = currency.isBase ? '固定' : '自动同步';
    if (!currency.rateSource) currency.rateSource = currency.isBase ? '基础币' : '中国外汇交易中心';
    if (!currency.updateCycle) currency.updateCycle = currency.isBase ? '固定' : '每日';
    if (!currency.rateUpdatedAt) currency.rateUpdatedAt = '2026-06-06 09:00';
    if (currency.isBase) {
      currency.exchangeRate = '1';
      currency.rateMode = '固定';
      currency.rateSource = '基础币';
      currency.updateCycle = '固定';
      currency.enabled = true;
    }
  });
  if (!data.system.currencies.some((currency) => currency.isBase)) {
    const firstEnabled = data.system.currencies.find((currency) => currency.enabled) || data.system.currencies[0];
    if (firstEnabled) firstEnabled.isBase = true;
  }
}

const filteredNotifications = computed(() => filterByKeyword(data.system.notifications as unknown as Record<string, unknown>[]) as unknown as NotificationRule[]);
const filteredUnits = computed(() => filterByKeyword(data.system.units as unknown as Record<string, unknown>[]) as unknown as UnitSettingRow[]);
const filteredCurrencies = computed(() => filterByKeyword(data.system.currencies as unknown as Record<string, unknown>[]) as unknown as CurrencySettingRow[]);
const filteredPermissionResources = computed(() => filterByKeyword(data.permissions.resources as unknown as Record<string, unknown>[]) as unknown as PermissionResourceRow[]);
const filteredRoles = computed(() => filterByKeyword(data.permissions.roles as unknown as Record<string, unknown>[]) as unknown as RoleRow[]);
const filteredRolePermissions = computed(() => filterByKeyword(data.permissions.rolePermissions as unknown as Record<string, unknown>[]) as unknown as RolePermissionRow[]);
const filteredDataPermissions = computed(() => filterByKeyword(data.permissions.dataPermissions as unknown as Record<string, unknown>[]) as unknown as DataPermissionRow[]);
const filteredPositions = computed(() => filterByKeyword(data.permissions.positions as unknown as Record<string, unknown>[]) as unknown as PositionRow[]);
const filteredMembers = computed(() => filterByKeyword(data.permissions.members as unknown as Record<string, unknown>[]) as unknown as MemberPermissionRow[]);
const filteredSecurityRules = computed(() => filterByKeyword(data.security.rules as unknown as Record<string, unknown>[]) as unknown as SecurityRule[]);
const filteredAuditLogs = computed(() => filterByKeyword(data.data.auditLogs as unknown as Record<string, unknown>[]) as unknown as AuditLogRow[]);
const filteredDataTasks = computed(() => filterByKeyword(data.data.tasks as unknown as Record<string, unknown>[]) as unknown as DataTaskRow[]);
const filteredPartners = computed(() => filterByKeyword(data.integrations.partners as unknown as Record<string, unknown>[]) as unknown as IntegrationRow[]);
const filteredApiKeys = computed(() => filterByKeyword(data.integrations.apiKeys as unknown as Record<string, unknown>[]) as unknown as ApiKeyRow[]);
const filteredSyncTasks = computed(() => filterByKeyword(data.integrations.syncTasks as unknown as Record<string, unknown>[]) as unknown as SyncTaskRow[]);
const selectedUnitGroup = computed(() => activeUnitGroupKey.value.startsWith('group:') ? activeUnitGroupKey.value.slice(6) : '');
const unitTreeNodes = computed<AwTreeNode[]>(() => [
  {
    key: 'all',
    label: '全部单位',
    count: data.system.units.length,
    icon: 'line-table',
    level: 2,
    open: true,
  },
  {
    key: 'unit-group-root',
    label: '单位分类',
    count: data.system.units.length,
    icon: 'line-folder',
    level: 2,
    open: true,
    disabled: true,
  },
  ...unitGroupOptions.map((group) => ({
    key: `group:${group}`,
    label: group,
    count: data.system.units.filter((unit) => unit.group === group).length,
    icon: 'line-node',
    level: 3 as const,
  })),
]);
const unitTableRows = computed<Record<string, unknown>[]>(() => filteredUnits.value.filter((unit) => {
  const treeMatched = !selectedUnitGroup.value || unit.group === selectedUnitGroup.value;
  const columnGroup = unitColumnFilters.value.group || '';
  const baseFilter = unitColumnFilters.value.isBase || '';
  const columnMatched = !columnGroup || unit.group === columnGroup;
  const baseMatched = baseFilter === '基础单位' ? unit.isBase : baseFilter === '换算单位' ? !unit.isBase : true;
  return treeMatched && columnMatched && baseMatched;
}).map((unit) => ({
  ...unit,
  conversionText: unitConversionText(unit),
})) as unknown as Record<string, unknown>[]);
const currencyTableRows = computed<Record<string, unknown>[]>(() => filteredCurrencies.value.filter((currency) => {
  const baseFilter = currencyColumnFilters.value.isBase || '';
  const rateModeFilter = currencyColumnFilters.value.rateMode || '';
  const baseMatched = baseFilter === '基础币' ? currency.isBase : baseFilter === '非基础币' ? !currency.isBase : true;
  const rateModeMatched = !rateModeFilter || currency.rateMode === rateModeFilter;
  return baseMatched && rateModeMatched;
}) as unknown as Record<string, unknown>[]);
const roleTableRows = computed(() => filteredRoles.value as unknown as SettingTableRow[]);
const moduleFilteredPermissionResources = computed(() => (
  filteredPermissionResources.value.filter((resource) => matchesPermissionScope(resource, activePermissionModuleKey.value))
));
const permissionModuleTreeNodes = computed<AwTreeNode[]>(() => [
  {
    key: 'all',
    label: '全部权限资源',
    count: data.permissions.resources.length,
    icon: '▦',
    level: 2,
    open: true,
  },
  ...permissionTopModules.flatMap((center) => [
    {
      key: `center:${center.key}`,
      label: center.label,
      count: data.permissions.resources.filter((resource) => matchesPermissionModule(resource.module, center.key)).length,
      icon: center.icon,
      level: 2 as const,
      open: true,
    },
    ...center.sideItems.map((sideItem) => ({
      key: `module:${center.key}:${sideItem.key}`,
      label: sideItem.label,
      count: data.permissions.resources.filter((resource) => matchesPermissionModule(resource.module, center.key) && resource.menu === sideItem.label).length,
      icon: 'line-table',
      level: 3 as const,
    })),
  ]),
]);
const activePermissionCenter = computed(() => permissionTopModules.find((module) => module.key === scopeCenterKey(activePermissionModuleKey.value)));
const activePermissionSideItem = computed(() => sideItemByScope(activePermissionModuleKey.value));
const activePermissionModuleLabel = computed(() => {
  if (activePermissionModuleKey.value === 'all') return '全部权限资源';
  if (activePermissionSideItem.value && activePermissionCenter.value) return `${activePermissionCenter.value.label} / ${activePermissionSideItem.value.label}`;
  return activePermissionCenter.value?.label || '全部权限资源';
});
const defaultPermissionResourceModule = computed(() => activePermissionCenter.value?.label || '研发中心');
const activePermissionModuleEnabledCount = computed(() => moduleFilteredPermissionResources.value.filter((resource) => resource.status === '启用').length);
const permissionResourceTableRows = computed(() => moduleFilteredPermissionResources.value.map((resource) => ({
  ...resource,
  tabCount: `${resource.tabs.length} 个`,
  actionCount: `${resource.actions.length} 个`,
  fieldCount: `${resource.fields.length} 个`,
})) as unknown as SettingTableRow[]);
const activeConfigPermissionResource = computed(() => {
  if (permissionResourcePageMode.value === 'form') return permissionResourceForm;
  const selected = moduleFilteredPermissionResources.value.find((resource) => resource.id === activePermissionResourceId.value);
  return selected || moduleFilteredPermissionResources.value[0];
});
const permissionResourceFormTitle = computed(() => (editingPermissionResourceId.value ? '编辑资源配置' : '新增资源配置'));
const permissionResourceFormSubtitle = computed(() => {
  const center = permissionResourceForm.module || defaultPermissionResourceModule.value;
  const menu = permissionResourceForm.menu || activePermissionSideItem.value?.label || '资源模块';
  return `${center} / ${menu}`;
});
const functionPermissionTableRows = computed(() => filteredRolePermissions.value as unknown as SettingTableRow[]);
const dataPermissionTableRows = computed(() => filteredDataPermissions.value as unknown as SettingTableRow[]);
const positionTableRows = computed(() => filteredPositions.value.map((position) => ({
  ...position,
  defaultRoles: roleNames(position.defaultRoleIds),
})) as unknown as SettingTableRow[]);
const memberTableRows = computed(() => filteredMembers.value.map((member) => {
  const inheritedRoleIds = memberInheritedRoleIds(member);
  const extraRoleIds = [...member.extraRoleIds, ...member.temporaryRoleIds];
  return {
    ...member,
    position: positionName(member.positionId),
    inheritedRoles: roleNames(inheritedRoleIds),
    extraRoles: roleNames(extraRoleIds) || '无',
    finalRoles: roleNames(memberFinalRoleIds(member)),
  };
}) as unknown as SettingTableRow[]);
const selectedMemberPermission = computed(() => (
  data.permissions.members.find((item) => item.id === selectedMemberPermissionId.value)
  || filteredMembers.value[0]
  || data.permissions.members[0]
));
const selectedMemberInheritedRoleIds = computed(() => (selectedMemberPermission.value ? memberInheritedRoleIds(selectedMemberPermission.value) : []));
const selectedMemberExtraRoleNames = computed(() => (selectedMemberPermission.value ? roleNames(selectedMemberPermission.value.extraRoleIds) : ''));
const selectedMemberTemporaryRoleNames = computed(() => (selectedMemberPermission.value ? roleNames(selectedMemberPermission.value.temporaryRoleIds) : ''));
const selectedMemberInheritedRoleNames = computed(() => roleNames(selectedMemberInheritedRoleIds.value));
const selectedMemberFinalRoleIds = computed(() => (selectedMemberPermission.value ? memberFinalRoleIds(selectedMemberPermission.value) : []));
const selectedMemberEffectivePermissionRows = computed(() => {
  const roleIds = new Set(selectedMemberFinalRoleIds.value);
  const grouped = new Map<string, {
    module: string;
    menu: string;
    roleNames: Set<string>;
    actions: Set<string>;
    fields: Set<string>;
  }>();
  data.permissions.rolePermissions
    .filter((permission) => roleIds.has(permission.roleId) && permission.view)
    .forEach((permission) => {
      const row = grouped.get(permission.menu) || {
        module: permission.module,
        menu: permission.menu,
        roleNames: new Set<string>(),
        actions: new Set<string>(),
        fields: new Set<string>(),
      };
      row.roleNames.add(roleName(permission.roleId));
      permissionActionOptions.forEach((action) => {
        if (permission[action.key]) row.actions.add(action.label);
      });
      permission.fieldsView.forEach((field) => row.fields.add(field));
      grouped.set(permission.menu, row);
    });
  return Array.from(grouped.values()).map((row) => ({
    module: row.module,
    menu: row.menu,
    roleNames: Array.from(row.roleNames).join('、'),
    actionCount: row.actions.size,
    fieldCount: row.fields.size,
  }));
});
const auditLogTableRows = computed(() => filteredAuditLogs.value as unknown as SettingTableRow[]);
const dataTaskTableRows = computed(() => filteredDataTasks.value as unknown as SettingTableRow[]);
const partnerTableRows = computed(() => filteredPartners.value.map((row, index) => ({ serialNo: index + 1, ...row })) as unknown as SettingTableRow[]);
const apiKeyTableRows = computed(() => filteredApiKeys.value as unknown as SettingTableRow[]);
const syncTaskTableRows = computed(() => filteredSyncTasks.value as unknown as SettingTableRow[]);
const selectedRole = computed(() => data.permissions.roles.find((item) => item.id === selectedRoleId.value) || filteredRoles.value[0] || data.permissions.roles[0]);
const selectedRoleFunctions = computed(() => {
  if (!selectedRole.value) return [];
  return filteredRolePermissions.value.filter((item) => item.roleId === selectedRole.value.id);
});
const selectedDataPermission = computed(() => {
  if (!selectedRole.value) return undefined;
  return data.permissions.dataPermissions.find((item) => item.roleId === selectedRole.value?.id);
});
const selectedRolePermissionResources = computed(() => {
  const center = selectedRole.value?.center || '';
  if (!center) return filteredPermissionResources.value;
  const centerKey = moduleKeyByName(center);
  return filteredPermissionResources.value.filter((resource) => matchesPermissionModule(resource.module, centerKey));
});
const activeMenuPermission = computed(() => {
  if (!selectedRole.value) return undefined;
  return data.permissions.rolePermissions.find((item) => item.roleId === selectedRole.value?.id && item.menu === activePermissionMenu.value);
});
const selectedFunctionPermission = computed(() => {
  const fallback = selectedRoleFunctions.value[0] || filteredRolePermissions.value[0];
  const selected = data.permissions.rolePermissions.find((item) => item.id === selectedFunctionPermissionId.value);
  return selected || fallback;
});
const permissionMenuOptions = computed(() => {
  const rows = selectedRolePermissionResources.value.length ? selectedRolePermissionResources.value : data.permissions.resources;
  const menus = rows.map((item) => item.menu);
  return Array.from(new Set(menus.length ? menus : rdMenuOptions));
});
const activePermissionResource = computed(() => {
  const centerKey = selectedRole.value?.center ? moduleKeyByName(selectedRole.value.center) : '';
  return data.permissions.resources.find((item) => item.menu === activePermissionMenu.value && (!centerKey || matchesPermissionModule(item.module, centerKey)))
    || data.permissions.resources.find((item) => item.menu === activePermissionMenu.value);
});
const activeGrantResource = computed(() => data.permissions.resources.find((item) => item.id === roleGrantModal.resourceId));
const grantRoleOptions = computed(() => {
  const resource = activeGrantResource.value;
  if (!resource) return data.permissions.roles;
  const centerKey = moduleKeyByName(resource.module);
  return data.permissions.roles.filter((role) => matchesPermissionModule(role.center, centerKey));
});
const grantActionOptions = computed(() => {
  const resourceActions = activeGrantResource.value?.actions || [];
  if (resourceActions.length === 0) return permissionActionOptions;
  return permissionActionOptions.filter((action) => resourceActions.includes(action.label));
});
const activeRdTabOptions = computed(() => {
  const menu = selectedFunctionPermission.value?.menu || '项目管理';
  return activePermissionResource.value?.tabs || rdTabOptions[menu] || [];
});
const activeRdFieldOptions = computed(() => {
  const menu = activePermissionMenu.value || selectedFunctionPermission.value?.menu || '项目管理';
  return activePermissionResource.value?.fields || rdFieldOptions[menu] || [];
});
const permissionSummary = computed(() => {
  const enabledResources = data.permissions.resources.filter((item) => item.status === '启用').length;
  return [
    { label: '资源配置', value: `${enabledResources}/${data.permissions.resources.length}`, desc: '启用资源 / 全部资源' },
    { label: '中心模块', value: permissionTopModules.length, desc: '按顶部中心和模块组织' },
    { label: '角色授权', value: data.permissions.roles.length, desc: '角色拿资源做授权包' },
    { label: '岗位 / 成员', value: `${data.permissions.positions.length}/${data.permissions.members.length}`, desc: '岗位继承 / 成员修正' },
  ];
});
const selectedRoleSummary = computed(() => {
  const role = selectedRole.value;
  const menus = selectedRoleFunctions.value.length;
  const fieldViewCount = selectedRoleFunctions.value.reduce((sum, item) => sum + item.fieldsView.length, 0);
  const fieldEditCount = selectedRoleFunctions.value.reduce((sum, item) => sum + item.fieldsEdit.length, 0);
  const actionCount = selectedRoleFunctions.value.reduce((sum, item) => sum + permissionActionKeys.filter((key) => item[key]).length, 0);
  return [
    { label: '页面资源', value: menus, desc: role?.permissionSummary || '未配置资源' },
    { label: '操作权限', value: actionCount, desc: '按资源维护按钮级权限' },
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
  ensureSystemBasics();
  ensurePermissionCatalog();
  ensurePermissionRoles();
  selectedRoleId.value = result.permissions.roles[0]?.id || '';
  selectedFunctionPermissionId.value = result.permissions.rolePermissions[0]?.id || '';
  activePermissionMenu.value = data.permissions.resources[0]?.menu || '项目管理';
  activePermissionResourceId.value = data.permissions.resources[0]?.id || '';
  activePermissionModuleKey.value = `center:${moduleKeyByName(data.permissions.resources[0]?.module || '') || 'rd'}`;
  selectedMemberPermissionId.value = data.permissions.members[0]?.id || '';
});

watch(currentSection, () => {
  keyword.value = '';
  listToolbarMessage.value = '';
  selectedUnitIds.value = [];
  selectedCurrencyIds.value = [];
  unitColumnFilters.value = {};
  currencyColumnFilters.value = {};
});

watch(moduleFilteredPermissionResources, (resources) => {
  if (!resources.some((resource) => resource.id === activePermissionResourceId.value)) {
    activePermissionResourceId.value = resources[0]?.id || '';
  }
});

watch(filteredMembers, (members) => {
  if (!members.some((member) => member.id === selectedMemberPermissionId.value)) {
    selectedMemberPermissionId.value = members[0]?.id || '';
  }
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

function handleAdd() {
  if (currentSection.value === 'units') openUnitSetting();
  if (currentSection.value === 'currencies') openCurrencySetting();
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'resources') openPermissionResource();
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'roles') openRole();
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'positions') openPosition();
  if (currentSection.value === 'permissions' && activePermissionTab.value === 'members') openMemberPermission();
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

function partnerDevicePreset(name: string) {
  return partnerDevicePresets.find((item) => item.name === name);
}

function partnerVendorOptions() {
  const deviceName = String(modal.form.name || '');
  return partnerDevicePreset(deviceName)?.vendors.map((item) => item.name) || Array.from(new Set(partnerDevicePresets.flatMap((item) => item.vendors.map((vendor) => vendor.name))));
}

function partnerVendorPreset(deviceName: string, vendorName: string) {
  return partnerDevicePreset(deviceName)?.vendors.find((item) => item.name === vendorName);
}

function modalFieldOptions(field: ModalField) {
  if (modal.target === 'partner' && field.key === 'name') return partnerDeviceNames;
  if (modal.target === 'partner' && field.key === 'vendor') return partnerVendorOptions();
  return field.options || [];
}

function applyPartnerDevicePreset(deviceName: string) {
  const preset = partnerDevicePreset(deviceName);
  if (!preset) return;
  modal.form.type = preset.type;
  modal.form.method = preset.method;
  modal.form.purpose = preset.purpose;
  const currentVendor = String(modal.form.vendor || '');
  const nextVendor = preset.vendors.some((item) => item.name === currentVendor) ? currentVendor : preset.vendors[0]?.name || '';
  modal.form.vendor = nextVendor;
  applyPartnerVendorPreset(nextVendor);
}

function applyPartnerVendorPreset(vendorName: string) {
  const deviceName = String(modal.form.name || '');
  const vendor = partnerVendorPreset(deviceName, vendorName);
  if (!vendor) return;
  modal.form.product = vendor.product;
  modal.form.driver = vendor.driver;
  modal.form.endpoint = vendor.endpoint;
}

function setModalValue(key: string, value: string) {
  modal.form[key] = value;
  if (modal.target === 'partner' && key === 'name') applyPartnerDevicePreset(value);
  if (modal.target === 'partner' && key === 'vendor') applyPartnerVendorPreset(value);
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

function openPurchaseModal(row: IntegrationRow | SettingTableRow) {
  purchaseModal.deviceName = String(row.name || '');
  purchaseModal.open = true;
}

function closePurchaseModal() {
  purchaseModal.open = false;
}

function integrationStatusTone(status: unknown) {
  const text = String(status || '');
  if (text === '已连接') return 'green';
  if (text.includes('异常')) return 'red';
  if (text === '未连接') return 'gray';
  return 'gray';
}

function setPermissionTab(tab: PermissionTabKey) {
  activePermissionTab.value = tab;
  if (tab !== 'resources') {
    permissionResourcePageMode.value = 'list';
    editingPermissionResourceId.value = '';
  }
}

function permissionTabDesc(tab: PermissionTabKey) {
  if (tab === 'resources') return `${data.permissions.resources.length} 个资源`;
  if (tab === 'roles') return `${data.permissions.roles.length} 个角色`;
  if (tab === 'positions') return `${data.permissions.positions.length} 个岗位`;
  return `${data.permissions.members.length} 个成员`;
}

function handlePermissionModuleSelect() {
  selectedPermissionResourceIds.value = [];
}

function selectPermissionResource(row: PermissionResourceRow | SettingTableRow | Record<string, unknown>) {
  const resource = resourceFromRow(row);
  if (!resource) return;
  activePermissionResourceId.value = resource.id;
  activePermissionMenu.value = resource.menu;
  ensureResourceConfigDefaults(resource);
}

function selectRoleResource(menu: string) {
  activePermissionMenu.value = menu;
  const permission = data.permissions.rolePermissions.find((item) => item.roleId === selectedRole.value?.id && item.menu === menu);
  selectedFunctionPermissionId.value = permission?.id || '';
}

function backToPermissionResourceList() {
  permissionResourcePageMode.value = 'list';
  editingPermissionResourceId.value = '';
  resetResourceConfigDraft();
}

function resourceDraftKey(key: ResourceConfigListKey): keyof typeof resourceConfigDraft {
  if (key === 'tabs') return 'tab';
  if (key === 'actions') return 'action';
  if (key === 'fields') return 'field';
  return 'dataScope';
}

function resourceConfigItems(key: ResourceConfigListKey) {
  const resource = activeConfigPermissionResource.value;
  if (!resource) return [];
  ensureResourceConfigDefaults(resource);
  if (key === 'dataScopes') return resource.dataScopes || [];
  return resource[key];
}

function nextResourceConfigLabel(key: ResourceConfigListKey) {
  const count = resourceConfigItems(key).length + 1;
  if (key === 'tabs') return `新建Tab${count}`;
  if (key === 'actions') return `自定义操作${count}`;
  if (key === 'fields') return `新建字段${count}`;
  return `自定义维度${count}`;
}

function addResourceConfigItem(key: ResourceConfigListKey) {
  const resource = activeConfigPermissionResource.value;
  if (!resource) return;
  const draftKey = resourceDraftKey(key);
  const value = String(resourceConfigDraft[draftKey] || '').trim() || nextResourceConfigLabel(key);
  const items = resourceConfigItems(key);
  if (!items.includes(value)) items.push(value);
  resourceConfigDraft[draftKey] = '';
}

function removeResourceConfigItem(key: ResourceConfigListKey, value: string) {
  const items = resourceConfigItems(key);
  const index = items.indexOf(value);
  if (index >= 0) items.splice(index, 1);
}

function hasResourceConfigItem(key: ResourceConfigListKey, value: string) {
  return resourceConfigItems(key).includes(value);
}

function toggleResourceConfigItem(key: ResourceConfigListKey, value: string, checked: boolean) {
  const items = resourceConfigItems(key);
  const index = items.indexOf(value);
  if (checked && index < 0) items.push(value);
  if (!checked && index >= 0) items.splice(index, 1);
}

function customResourceActions(resource: PermissionResourceRow) {
  ensureResourceConfigDefaults(resource);
  return resource.actions.filter((action) => !defaultResourceActions.includes(action));
}

function syncRolePermissionsForResource(resource: PermissionResourceRow, previous?: PermissionResourceRow) {
  const previousModule = previous?.module || resource.module;
  const previousMenu = previous?.menu || resource.menu;
  data.permissions.rolePermissions
    .filter((permission) => (
      (permission.module === previousModule && permission.menu === previousMenu)
      || (permission.module === resource.module && permission.menu === resource.menu)
    ))
    .forEach((permission) => {
      permission.module = resource.module;
      permission.menu = resource.menu;
      permission.page = resource.page;
      permission.tabs = permission.tabs.filter((tab) => resource.tabs.includes(tab));
      permission.fieldsView = permission.fieldsView.filter((field) => resource.fields.includes(field));
      permission.fieldsEdit = permission.fieldsEdit.filter((field) => resource.fields.includes(field));
      permissionActionOptions.forEach((action) => {
        if (action.key !== 'view' && !resource.actions.includes(action.label)) permission[action.key] = false;
      });
    });
}

function applyResourceTemplate(resource: PermissionResourceRow) {
  const sideItem = sideItemByMenu(resource.module, resource.menu);
  resource.tabs = buildResourceTabs(resource.menu, sideItem?.flyout);
  resource.actions = [...defaultResourceActions];
  resource.fields = buildResourceFields(resource.menu);
  resource.dataScopes = [...defaultResourceDataScopes];
  resource.api = buildResourceApi(sideItem?.route || '');
  toast('资源模板已套用');
}

function saveResourceConfig(resource: PermissionResourceRow) {
  const menu = resource.menu.trim();
  if (!menu) {
    toast('请填写菜单 / 模块');
    return;
  }
  const previous = editingPermissionResourceId.value
    ? data.permissions.resources.find((item) => item.id === editingPermissionResourceId.value)
    : undefined;
  const row = createPermissionResourceDraft({
    ...resource,
    id: resource.id || editingPermissionResourceId.value || `res-custom-${Date.now()}`,
    menu,
    page: resource.page.trim() || defaultResourcePageName(menu),
    code: resource.code.trim() || defaultResourceCode(resource.module, menu),
  });
  ensureResourceConfigDefaults(row);
  syncRolePermissionsForResource(row, previous);
  upsert(data.permissions.resources, row);
  assignPermissionResourceForm(row);
  editingPermissionResourceId.value = row.id;
  activePermissionMenu.value = row.menu;
  activePermissionResourceId.value = row.id;
  activePermissionModuleKey.value = `center:${moduleKeyByName(row.module) || 'rd'}`;
  permissionResourcePageMode.value = 'list';
  saveAll('资源配置已保存');
}

function confirmModal() {
  const id = modal.id || `${modal.target}-${Date.now()}`;
  if (modal.target === 'notification') upsert(data.system.notifications, { id, ...modal.form } as NotificationRule);
  if (modal.target === 'unit') {
    const code = String(modal.form.code || '').trim().toUpperCase();
    const name = String(modal.form.name || '').trim();
    if (!code || !name) {
      toast('请填写单位代码和单位名称');
      return;
    }
    const duplicated = data.system.units.some((unit) => unit.id !== id && unit.code.toUpperCase() === code);
    if (duplicated) {
      toast('单位代码已存在');
      return;
    }
    const group = String(modal.form.group || '计数');
    const previous = data.system.units.find((unit) => unit.id === id);
    const isBase = String(modal.form.isBaseText || '否') === '是';
    if (previous?.isBase && !isBase) {
      toast('基础单位不能直接取消，请先将同分类其它单位设为基础单位');
      return;
    }
    const groupBase = getUnitBaseByGroup(group);
    const row: UnitSettingRow = {
      id,
      group,
      code,
      name,
      symbol: String(modal.form.symbol || name),
      baseUnit: String(modal.form.baseUnit || groupBase?.symbol || groupBase?.name || name),
      factor: String(modal.form.factor || '1'),
      aliases: String(modal.form.aliases || ''),
      isBase,
      enabled: isBase || String(modal.form.enabledText || '启用') === '启用',
    };
    if (row.isBase || !groupBase) {
      row.isBase = true;
      row.baseUnit = unitDisplayName(row);
      row.factor = '1';
      row.enabled = true;
    }
    upsert(data.system.units, row);
    const saved = data.system.units.find((unit) => unit.id === row.id);
    if (saved?.isBase) setUnitBaseInGroup(saved);
    ensureUnitBaseRules();
  }
  if (modal.target === 'currency') {
    const code = String(modal.form.code || '').trim().toUpperCase();
    const name = String(modal.form.name || '').trim();
    if (!code || !name) {
      toast('请填写币种代码和币种名称');
      return;
    }
    const duplicated = data.system.currencies.some((currency) => currency.id !== id && currency.code.toUpperCase() === code);
    if (duplicated) {
      toast('币种代码已存在');
      return;
    }
    const isBase = String(modal.form.isBaseText || '否') === '是';
    const rateMode = isBase ? '固定' : String(modal.form.rateMode || '自动同步');
    const row: CurrencySettingRow = {
      id,
      code,
      name,
      symbol: String(modal.form.symbol || code),
      precision: Number(modal.form.precision || 2),
      exchangeRate: isBase ? '1' : String(modal.form.exchangeRate || '1'),
      rateMode,
      rateSource: isBase ? '基础币' : String(modal.form.rateSource || '中国外汇交易中心'),
      updateCycle: isBase ? '固定' : String(modal.form.updateCycle || (rateMode === '自动同步' ? '每日' : '手动')),
      rateUpdatedAt: String(modal.form.rateUpdatedAt || currentRateTimestamp()),
      isBase,
      enabled: isBase || String(modal.form.enabledText || '启用') === '启用',
    };
    if (row.isBase) data.system.currencies.forEach((currency) => { currency.isBase = false; });
    upsert(data.system.currencies, row);
    if (!data.system.currencies.some((currency) => currency.isBase)) {
      row.isBase = true;
      row.exchangeRate = '1';
      row.rateMode = '固定';
      row.rateSource = '基础币';
      row.updateCycle = '固定';
      row.enabled = true;
    }
  }
  if (modal.target === 'resource') {
    const previous = data.permissions.resources.find((item) => item.id === id);
    const menu = String(modal.form.menu || previous?.menu || '项目管理');
    const row = {
      id,
      module: previous?.module || defaultPermissionResourceModule.value,
      type: '页面',
      code: `rd.${menu}`,
      api: '',
      status: '启用',
      ...modal.form,
      menu,
      tabs: previous?.tabs?.length ? previous.tabs : [...(rdTabOptions[menu] || [])],
      actions: previous?.actions?.length ? previous.actions : permissionActionOptions.map((item) => item.label),
      fields: previous?.fields?.length ? previous.fields : [...(rdFieldOptions[menu] || [])],
      dataScopes: previous?.dataScopes?.length ? previous.dataScopes : [...defaultResourceDataScopes],
    } as PermissionResourceRow;
    ensureResourceConfigDefaults(row);
    upsert(data.permissions.resources, row);
    activePermissionMenu.value = row.menu;
    activePermissionResourceId.value = row.id;
    activePermissionModuleKey.value = `center:${moduleKeyByName(row.module) || 'rd'}`;
  }
  if (modal.target === 'role') {
    const role = {
      id,
      center: defaultPermissionResourceModule.value,
      description: '',
      permissionSummary: '待配置资源',
      dataPolicy: '本部门及下级数据',
      updated: new Date().toISOString().slice(0, 10),
      enabled: true,
      ...modal.form,
      users: Number(modal.form.users || 0),
    } as RoleRow;
    upsert(data.permissions.roles, role);
    selectedRoleId.value = role.id;
  }
  if (modal.target === 'function') {
    const previous = data.permissions.rolePermissions.find((item) => item.id === id);
    const menu = String(modal.form.menu || previous?.menu || '项目管理');
    const resource = data.permissions.resources.find((item) => item.menu === menu);
    const tabs = previous?.tabs?.length ? previous.tabs : [...(resource?.tabs || rdTabOptions[menu] || [])];
    const fieldsView = previous?.fieldsView?.length ? previous.fieldsView : [...(resource?.fields || rdFieldOptions[menu] || [])];
    const fieldsEdit = previous?.fieldsEdit || [];
    const row = {
      id,
      roleId: selectedRole.value?.id || data.permissions.roles[0]?.id || '',
      module: resource?.module || selectedRole.value?.center || defaultPermissionResourceModule.value,
      menu,
      page: resource?.page || (menu === 'BOM管理' ? 'BOM列表 / 替代料' : `${menu}列表 / ${menu}详情`),
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
    } as RolePermissionRow;
    upsert(data.permissions.rolePermissions, row);
    selectedFunctionPermissionId.value = row.id;
  }
  if (modal.target === 'dataPermission') {
    const roleId = roleIdByName(String(modal.form.roleName || '')) || selectedRole.value?.id || data.permissions.roles[0]?.id || '';
    const { roleName: _roleName, roleId: _roleId, ...form } = modal.form;
    upsert(data.permissions.dataPermissions, { id, roleId, center: selectedRole.value?.center || defaultPermissionResourceModule.value, enabled: true, ...form } as DataPermissionRow);
  }
  if (modal.target === 'position') {
    const defaultRoleIds = roleIdsByNames(String(modal.form.defaultRoles || ''));
    const { defaultRoles: _defaultRoles, ...form } = modal.form;
    upsert(data.permissions.positions, {
      id,
      department: '研发中心',
      level: 'P4-P5',
      owner: '研发负责人',
      status: '启用',
      updated: new Date().toISOString().slice(0, 10),
      note: '',
      ...form,
      members: Number(form.members || 0),
      defaultRoleIds,
    } as PositionRow);
  }
  if (modal.target === 'member') {
    const positionId = positionIdByName(String(modal.form.position || '')) || data.permissions.positions[0]?.id || '';
    const extraRoleIds = roleIdsByNames(String(modal.form.extraRoles || ''));
    const temporaryRoleIds = roleIdsByNames(String(modal.form.temporaryRoles || ''));
    const {
      position: _position,
      extraRoles: _extraRoles,
      temporaryRoles: _temporaryRoles,
      inheritedRoles: _inheritedRoles,
      finalRoles: _finalRoles,
      ...form
    } = modal.form;
    upsert(data.permissions.members, {
      id,
      employeeNo: '',
      department: '',
      dataScopeOverride: '无',
      status: '在职',
      updated: new Date().toISOString().slice(0, 10),
      ...form,
      positionId,
      extraRoleIds,
      temporaryRoleIds,
    } as MemberPermissionRow);
  }
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

function roleName(id: string) {
  return data.permissions.roles.find((item) => item.id === id)?.name || id;
}

function roleNames(ids: string[]) {
  return ids.map((id) => roleName(id)).filter(Boolean).join('、');
}

function roleIdByName(name: string) {
  const normalized = name.trim();
  return data.permissions.roles.find((item) => item.name === normalized || item.id === normalized)?.id || '';
}

function roleIdsByNames(value: string) {
  return Array.from(new Set(value.split(/[、,，/]+/).map((item) => roleIdByName(item)).filter(Boolean)));
}

function positionName(id: string) {
  return data.permissions.positions.find((item) => item.id === id)?.name || id;
}

function positionIdByName(name: string) {
  const normalized = name.trim();
  return data.permissions.positions.find((item) => item.name === normalized || item.id === normalized)?.id || '';
}

function memberInheritedRoleIds(member: MemberPermissionRow) {
  return data.permissions.positions.find((item) => item.id === member.positionId)?.defaultRoleIds || [];
}

function memberFinalRoleIds(member: MemberPermissionRow) {
  return Array.from(new Set([...memberInheritedRoleIds(member), ...member.extraRoleIds, ...member.temporaryRoleIds]));
}

function resourceFromRow(row: PermissionResourceRow | SettingTableRow | Record<string, unknown>) {
  const id = String(row.id || '');
  const menu = String(row.menu || '');
  return data.permissions.resources.find((item) => item.id === id || item.menu === menu);
}

function openRoleGrantModal(row: PermissionResourceRow | SettingTableRow | Record<string, unknown>) {
  const resource = resourceFromRow(row);
  if (!resource) return;
  roleGrantModal.resourceId = resource.id;
  activePermissionMenu.value = resource.menu;
  roleGrantModal.open = true;
}

function closeRoleGrantModal() {
  roleGrantModal.open = false;
}

function confirmRoleGrantModal() {
  closeRoleGrantModal();
  saveAll('角色授权已保存');
}

function rolePermissionForGrant(roleId: string) {
  const resource = activeGrantResource.value;
  if (!resource) return undefined;
  return data.permissions.rolePermissions.find((item) => item.roleId === roleId && item.menu === resource.menu);
}

function ensureGrantPermission(roleId: string) {
  const resource = activeGrantResource.value;
  if (!resource) return undefined;
  let permission = rolePermissionForGrant(roleId);
  if (!permission) {
    permission = {
      id: `perm-${Date.now()}-${roleId}-${resource.menu}`,
      roleId,
      module: resource.module,
      menu: resource.menu,
      page: resource.page,
      tabs: [...resource.tabs],
      fieldsView: [...resource.fields],
      fieldsEdit: [],
      view: true,
      create: false,
      edit: false,
      delete: false,
      import: false,
      export: false,
      approve: false,
    };
    data.permissions.rolePermissions.push(permission);
  }
  return permission;
}

function roleHasGrant(roleId: string) {
  return Boolean(rolePermissionForGrant(roleId)?.view);
}

function toggleRoleGrant(roleId: string, checked: boolean) {
  const resource = activeGrantResource.value;
  if (!resource) return;
  if (!checked) {
    data.permissions.rolePermissions = data.permissions.rolePermissions.filter((item) => !(item.roleId === roleId && item.menu === resource.menu));
    return;
  }
  const permission = ensureGrantPermission(roleId);
  if (permission) permission.view = true;
}

function roleActionChecked(roleId: string, action: PermissionActionKey) {
  return Boolean(rolePermissionForGrant(roleId)?.[action]);
}

function toggleRoleAction(roleId: string, action: PermissionActionKey, checked: boolean) {
  const permission = ensureGrantPermission(roleId);
  if (!permission) return;
  permission[action] = checked;
  if (action !== 'view' && checked) permission.view = true;
  if (action === 'view' && !checked) {
    permissionActionKeys.forEach((key) => {
      permission[key] = false;
    });
  }
}

function toggleAllRolesForGrant(checked: boolean) {
  grantRoleOptions.value.forEach((role) => toggleRoleGrant(role.id, checked));
}

function roleGrantTabCount(roleId: string) {
  return rolePermissionForGrant(roleId)?.tabs.length || 0;
}

function roleGrantFieldCount(roleId: string) {
  return rolePermissionForGrant(roleId)?.fieldsView.length || 0;
}

function dataPermissionNameForRole(roleId: string) {
  return data.permissions.dataPermissions.find((item) => item.roleId === roleId)?.name || roleName(roleId);
}

function handlePermissionResourceBatch(actionKey: string, keys: string[]) {
  if (keys.length === 0) {
    toast('请先选择权限资源');
    return;
  }
  const nextStatus = actionKey === 'disable' ? '停用' : '启用';
  data.permissions.resources.forEach((resource) => {
    if (keys.includes(resource.id)) resource.status = nextStatus;
  });
  toast(`${keys.length} 个权限资源已${nextStatus}`);
}

function handleListSearch(value: string) {
  keyword.value = value;
}

function handleListToolbarAction(actionKey: 'refresh' | 'filter' | 'columns' | 'import' | 'export') {
  if (currentSection.value === 'currencies' && actionKey === 'refresh') {
    syncCurrencyRates();
    return;
  }
  const labelMap: Record<typeof actionKey, string> = {
    refresh: '列表数据已刷新',
    filter: '高级筛选入口已保留',
    columns: '字段配置入口已保留',
    import: '导入入口已保留',
    export: '导出入口已保留',
  };
  listToolbarMessage.value = labelMap[actionKey];
  toast(labelMap[actionKey]);
}

function currentRateTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function syncCurrencyRates() {
  const time = currentRateTimestamp();
  let count = 0;
  data.system.currencies.forEach((currency) => {
    if (currency.rateMode === '自动同步') {
      currency.rateUpdatedAt = time;
      count += 1;
    }
  });
  const message = count ? `已刷新 ${count} 个自动同步汇率时间` : '当前没有自动同步币种';
  listToolbarMessage.value = message;
  toast(message);
}

function handleUnitTreeSelect() {
  selectedUnitIds.value = [];
}

function handleUnitColumnFilter(columnKey: string, value: string) {
  unitColumnFilters.value = { ...unitColumnFilters.value, [columnKey]: value };
}

function handleCurrencyColumnFilter(columnKey: string, value: string) {
  currencyColumnFilters.value = { ...currencyColumnFilters.value, [columnKey]: value };
}

function toggleUnitEnabled(row: Record<string, unknown>, enabled: boolean) {
  const unit = data.system.units.find((item) => item.id === row.id);
  if (!unit) return;
  if (unit.isBase && !enabled) {
    unit.enabled = true;
    toast('基础单位必须保持启用');
    return;
  }
  unit.enabled = enabled;
  toast(`${unit.name}已${enabled ? '启用' : '停用'}`);
}

const handleSetUnitAsBase = (row: Record<string, unknown>) => {
  const unit = data.system.units.find((item) => item.id === row.id);
  if (!unit) return;
  setUnitBaseInGroup(unit);
  toast(`${unit.group}已将 ${unit.name} 设为基础单位，请确认同分类换算系数`);
};

function toggleCurrencyEnabled(row: Record<string, unknown>, enabled: boolean) {
  const currency = data.system.currencies.find((item) => item.id === row.id);
  if (!currency) return;
  if (currency.isBase && !enabled) {
    currency.enabled = true;
    toast('基础币必须保持启用');
    return;
  }
  currency.enabled = enabled;
  toast(`${currency.name}已${enabled ? '启用' : '停用'}`);
}

function handleUnitBatchAction(actionKey: string, keys: string[]) {
  if (keys.length === 0) {
    toast('请先选择单位');
    return;
  }
  const enabled = actionKey !== 'disable';
  data.system.units.forEach((unit) => {
    if (keys.includes(unit.id) && (!unit.isBase || enabled)) unit.enabled = enabled;
  });
  selectedUnitIds.value = keys;
  toast(`${keys.length} 个单位已${enabled ? '启用' : '停用'}，基础单位保持启用`);
}

function handleCurrencyBatchAction(actionKey: string, keys: string[]) {
  if (keys.length === 0) {
    toast('请先选择币种');
    return;
  }
  const enabled = actionKey !== 'disable';
  data.system.currencies.forEach((currency) => {
    if (keys.includes(currency.id) && !currency.isBase) currency.enabled = enabled;
  });
  selectedCurrencyIds.value = keys;
  toast(`${keys.length} 个币种已${enabled ? '启用' : '停用'}，基础币保持启用`);
}

function selectRole(id: string) {
  selectedRoleId.value = id;
  const firstPermission = data.permissions.rolePermissions.find((item) => item.roleId === id);
  selectedFunctionPermissionId.value = firstPermission?.id || '';
  if (firstPermission) activePermissionMenu.value = firstPermission.menu;
}

function grantCurrentRoleAllResources() {
  if (!selectedRole.value) return;
  selectedRolePermissionResources.value.forEach((resource) => {
    const permission = ensureMenuPermission(resource.menu);
    if (!permission) return;
    permission.view = true;
    if (permission.tabs.length === 0) permission.tabs = [...resource.tabs];
    if (permission.fieldsView.length === 0) permission.fieldsView = [...resource.fields];
  });
  toast(`${selectedRole.value.name} 已授权本中心资源`);
}

function selectMemberPermission(id: string) {
  selectedMemberPermissionId.value = id;
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
  const clonedPermissions = data.permissions.rolePermissions
    .filter((item) => item.roleId === selectedRole.value?.id)
    .map((item) => ({ ...item, id: `perm-${Date.now()}-${item.menu}-${Math.random().toString(16).slice(2, 6)}`, roleId: id }));
  data.permissions.rolePermissions.push(...clonedPermissions);
  const dataRule = data.permissions.dataPermissions.find((item) => item.roleId === selectedRole.value?.id);
  if (dataRule) data.permissions.dataPermissions.push({ ...dataRule, id: `data-${Date.now()}`, roleId: id, name: `${newRole.name}数据范围` });
  selectedRoleId.value = id;
  toast('角色已复制，可继续调整授权');
}

function toggleSelectedRole() {
  if (!selectedRole.value) return;
  selectedRole.value.enabled = !selectedRole.value.enabled;
  toast(selectedRole.value.enabled ? '角色已启用' : '角色已停用');
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
  let permission = data.permissions.rolePermissions.find((item) => item.roleId === selectedRole.value?.id && item.menu === menu);
  if (!permission) {
    const centerKey = selectedRole.value?.center ? moduleKeyByName(selectedRole.value.center) : '';
    const resource = data.permissions.resources.find((item) => item.menu === menu && (!centerKey || matchesPermissionModule(item.module, centerKey)));
    permission = {
      id: `perm-${Date.now()}-${menu}`,
      roleId: selectedRole.value.id,
      module: resource?.module || selectedRole.value.center || defaultPermissionResourceModule.value,
      menu,
      page: resource?.page || (menu === 'BOM管理' ? 'BOM列表 / 替代料' : `${menu}列表 / ${menu}详情`),
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
    data.permissions.rolePermissions.push(permission);
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
  if (!permission.view) {
    permissionActionKeys.forEach((key) => {
      permission[key] = false;
    });
  }
  const centerKey = selectedRole.value?.center ? moduleKeyByName(selectedRole.value.center) : '';
  const resource = data.permissions.resources.find((item) => item.menu === menu && (!centerKey || matchesPermissionModule(item.module, centerKey)));
  if (permission.view && permission.tabs.length === 0) permission.tabs = [...(resource?.tabs || rdTabOptions[menu] || [])];
  if (permission.view && permission.fieldsView.length === 0) permission.fieldsView = [...(resource?.fields || rdFieldOptions[menu] || [])];
  selectedFunctionPermissionId.value = permission.id;
}

function togglePermissionAction(action: PermissionActionKey) {
  const permission = ensureMenuPermission(activePermissionMenu.value);
  if (!permission) return;
  permission[action] = !permission[action];
  if (action !== 'view' && permission[action]) permission.view = true;
  if (action === 'view' && !permission.view) {
    permissionActionKeys.forEach((key) => {
      permission[key] = false;
    });
  }
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
  let permission = data.permissions.dataPermissions.find((item) => item.roleId === selectedRole.value?.id);
  if (!permission) {
    permission = {
      id: `data-${Date.now()}`,
      name: `${selectedRole.value.name}数据范围`,
      roleId: selectedRole.value.id,
      center: selectedRole.value.center || defaultPermissionResourceModule.value,
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

function openUnitSetting(row?: UnitSettingRow | SettingTableRow | Record<string, unknown>) {
  const unit = row as UnitSettingRow | undefined;
  const initialGroup = unit?.group || selectedUnitGroup.value || '计数';
  const baseOptions = unitBaseOptions(initialGroup);
  const defaultBaseUnit = baseOptions[0] || '';
  openModal(unit?.id ? '编辑单位' : '新增单位', 'unit', [
    { key: 'group', label: '单位分类', options: unitGroupOptions },
    { key: 'code', label: '单位代码' },
    { key: 'name', label: '单位名称' },
    { key: 'symbol', label: '显示符号' },
    { key: 'isBaseText', label: '设为分类基础单位', options: ['否', '是'] },
    { key: 'baseUnit', label: '换算到基础单位', options: baseOptions.length ? baseOptions : undefined },
    { key: 'factor', label: '换算系数' },
    { key: 'aliases', label: '别名 / 说明' },
    { key: 'enabledText', label: '状态', options: ['启用', '停用'] },
  ], unit ? {
    ...unit,
    isBaseText: unit.isBase ? '是' : '否',
    enabledText: unit.enabled ? '启用' : '停用',
  } : {
    group: initialGroup,
    code: '',
    name: '',
    symbol: '',
    isBaseText: defaultBaseUnit ? '否' : '是',
    baseUnit: defaultBaseUnit,
    factor: '1',
    aliases: '',
    enabledText: '启用',
  }, unit?.id);
}

function openCurrencySetting(row?: CurrencySettingRow | SettingTableRow | Record<string, unknown>) {
  const currency = row as CurrencySettingRow | undefined;
  openModal(currency?.id ? '编辑币种' : '新增币种', 'currency', [
    { key: 'code', label: '币种代码' },
    { key: 'name', label: '币种名称' },
    { key: 'symbol', label: '符号' },
    { key: 'precision', label: '金额精度' },
    { key: 'isBaseText', label: '是否基础币', options: ['否', '是'] },
    { key: 'enabledText', label: '状态', options: ['启用', '停用'] },
    { key: 'rateMode', label: '汇率维护方式', options: currencyRateModeOptions },
    { key: 'rateSource', label: '汇率来源', options: currencyRateSourceOptions },
    { key: 'updateCycle', label: '更新频率', options: currencyUpdateCycleOptions },
    { key: 'exchangeRate', label: '当前汇率' },
    { key: 'rateUpdatedAt', label: '最后更新时间' },
  ], currency ? {
    ...currency,
    rateMode: currency.rateMode || (currency.isBase ? '固定' : '自动同步'),
    rateSource: currency.rateSource || (currency.isBase ? '基础币' : '中国外汇交易中心'),
    updateCycle: currency.updateCycle || (currency.isBase ? '固定' : '每日'),
    rateUpdatedAt: currency.rateUpdatedAt || currentRateTimestamp(),
    isBaseText: currency.isBase ? '是' : '否',
    enabledText: currency.enabled ? '启用' : '停用',
  } : {
    code: '',
    name: '',
    symbol: '',
    precision: 2,
    isBaseText: '否',
    enabledText: '启用',
    rateMode: '自动同步',
    rateSource: '中国外汇交易中心',
    updateCycle: '每日',
    exchangeRate: '1',
    rateUpdatedAt: currentRateTimestamp(),
  }, currency?.id);
}

function openNotification(row?: NotificationRule) {
  openModal('消息通知规则', 'notification', [
    { key: 'channel', label: '通知渠道', options: ['站内通知', '短信通知', '邮件通知'] },
    { key: 'scene', label: '业务场景', type: 'textarea' },
    { key: 'rule', label: '发送规则', type: 'textarea' },
    { key: 'receiver', label: '接收对象' },
  ], row || { channel: '站内通知', scene: '', rule: '', receiver: '', enabled: true }, row?.id);
}

function openPermissionResource(row?: PermissionResourceRow | SettingTableRow | Record<string, unknown>) {
  const resource = row ? resourceFromRow(row) : undefined;
  assignPermissionResourceForm(resource);
  editingPermissionResourceId.value = resource?.id || '';
  if (resource) {
    activePermissionResourceId.value = resource.id;
    activePermissionMenu.value = resource.menu;
  }
  permissionResourcePageMode.value = 'form';
}

function openRole(row?: RoleRow | SettingTableRow) {
  openModal('角色管理', 'role', [
    { key: 'name', label: '角色名称' },
    { key: 'center', label: '适用中心', options: permissionModuleOptions },
    { key: 'users', label: '成员数' },
    { key: 'permissionSummary', label: '授权范围' },
    { key: 'dataPolicy', label: '数据权限模板', options: ['中心全量数据', '本部门及下级数据', '本人负责 / 参与数据', '授权范围只读数据'] },
    { key: 'description', label: '角色说明', type: 'textarea', span: 'full' },
  ], (row as RoleRow) || { name: '', center: defaultPermissionResourceModule.value, users: 0, permissionSummary: '按资源授权', dataPolicy: '本部门及下级数据', description: '' }, row?.id as string);
}

function openFunctionPermission(row?: RolePermissionRow | SettingTableRow) {
  openModal('角色资源授权', 'function', [
    { key: 'module', label: '所属中心', options: permissionModuleOptions },
    { key: 'menu', label: '菜单', options: permissionMenuOptions.value },
    { key: 'page', label: '页面' },
  ], (row as RolePermissionRow) || { module: selectedRole.value?.center || defaultPermissionResourceModule.value, menu: activePermissionMenu.value, page: activePermissionResource.value?.page || '' }, row?.id as string);
}

function openDataPermission(row?: DataPermissionRow | SettingTableRow) {
  const roleId = String((row as DataPermissionRow | undefined)?.roleId || selectedRole.value?.id || data.permissions.roles[0]?.id || '');
  openModal('数据权限', 'dataPermission', [
    { key: 'name', label: '权限名称' },
    { key: 'roleName', label: '适用角色', options: data.permissions.roles.map((item) => item.name) },
    { key: 'center', label: '适用中心', options: permissionModuleOptions },
    { key: 'department', label: '部门范围', options: ['全部部门', '本部门及下级', '本人所在部门'] },
    { key: 'region', label: '区域范围', options: ['全部区域', '负责区域', '本人负责区域'] },
    { key: 'customerScope', label: '客户可见范围', options: ['全部客户', '负责客户及协作客户', '项目关联客户'] },
    { key: 'projectScope', label: '项目范围', options: ['全部项目', '本部门项目及下级项目', '本人负责或参与项目'] },
    { key: 'documentScope', label: '文档范围', options: ['全部文档分类', '本部门文档分类', '本人创建 / 协作文档'] },
    { key: 'materialScope', label: '产品 / 物料范围', options: ['全部产品 / 物料', '本部门维护产品 / 物料', '本人维护产品 / 物料'] },
    { key: 'bomScope', label: 'BOM 范围', options: ['全部 BOM 与替代料', '本部门项目 BOM', '本人维护 BOM 与替代料'] },
  ], row ? { ...(row as DataPermissionRow), roleName: roleName(roleId) } : { name: '', roleName: selectedRole.value?.name || data.permissions.roles[0]?.name || '', center: selectedRole.value?.center || defaultPermissionResourceModule.value, department: '本部门及下级', region: '负责区域', customerScope: '负责客户及协作客户', projectScope: '本部门项目及下级项目', documentScope: '本部门文档分类', materialScope: '本部门维护产品 / 物料', bomScope: '本部门项目 BOM' }, row?.id as string);
}

function openPosition(row?: PositionRow | SettingTableRow) {
  const position = row as PositionRow | undefined;
  openModal('岗位默认角色', 'position', [
    { key: 'name', label: '岗位名称' },
    { key: 'department', label: '所属组织' },
    { key: 'level', label: '岗位职级' },
    { key: 'defaultRoles', label: '默认角色' },
    { key: 'members', label: '成员数' },
    { key: 'owner', label: '负责人' },
    { key: 'status', label: '状态', options: ['启用', '停用'] },
    { key: 'note', label: '继承说明', type: 'textarea', span: 'full' },
  ], position ? { ...position, defaultRoles: roleNames(position.defaultRoleIds) } : { name: '', department: '研发中心', level: 'P4-P5', defaultRoles: '研发工程师', members: 0, owner: '研发负责人', status: '启用', note: '' }, position?.id);
}

function openMemberPermission(row?: MemberPermissionRow | SettingTableRow) {
  const member = row as MemberPermissionRow | undefined;
  openModal('成员权限', 'member', [
    { key: 'name', label: '成员姓名' },
    { key: 'employeeNo', label: '工号' },
    { key: 'department', label: '部门' },
    { key: 'position', label: '岗位', options: data.permissions.positions.map((item) => item.name) },
    { key: 'extraRoles', label: '额外角色' },
    { key: 'temporaryRoles', label: '临时角色' },
    { key: 'dataScopeOverride', label: '数据范围特例', type: 'textarea', span: 'full' },
    { key: 'status', label: '状态', options: ['在职', '停用'] },
  ], member ? {
    ...member,
    position: positionName(member.positionId),
    extraRoles: roleNames(member.extraRoleIds),
    temporaryRoles: roleNames(member.temporaryRoleIds),
  } : { name: '', employeeNo: '', department: '研发中心', position: data.permissions.positions[0]?.name || '', extraRoles: '', temporaryRoles: '', dataScopeOverride: '无', status: '在职' }, member?.id);
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
  const defaultPreset = partnerDevicePresets[0];
  const defaultVendor = defaultPreset.vendors[0];
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
  ], (row as IntegrationRow) || {
    name: defaultPreset.name,
    type: defaultPreset.type,
    vendor: defaultVendor.name,
    product: defaultVendor.product,
    location: departmentOptions[0],
    method: defaultPreset.method,
    driver: defaultVendor.driver,
    endpoint: defaultVendor.endpoint,
    purpose: defaultPreset.purpose,
  }, row?.id as string);
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

function removeUnitSetting(row: SettingTableRow | Record<string, unknown>) {
  const unit = data.system.units.find((item) => item.id === row.id);
  if (unit?.isBase) {
    toast('基础单位不允许删除，请先设置同分类其它单位为基础单位');
    return;
  }
  data.system.units = data.system.units.filter((item) => item.id !== row.id);
  toast('单位已删除');
}

function removeCurrencySetting(row: SettingTableRow | Record<string, unknown>) {
  const currency = data.system.currencies.find((item) => item.id === row.id);
  if (currency?.isBase) {
    toast('基础币不允许删除，请先设置其它币种为基础币');
    return;
  }
  data.system.currencies = data.system.currencies.filter((item) => item.id !== row.id);
  toast('币种已删除');
}

function removeRole(row: SettingTableRow) {
  data.permissions.roles = data.permissions.roles.filter((item) => item.id !== row.id);
  data.permissions.rolePermissions = data.permissions.rolePermissions.filter((item) => item.roleId !== row.id);
  data.permissions.dataPermissions = data.permissions.dataPermissions.filter((item) => item.roleId !== row.id);
  data.permissions.positions.forEach((position) => {
    position.defaultRoleIds = position.defaultRoleIds.filter((id) => id !== row.id);
  });
  data.permissions.members.forEach((member) => {
    member.extraRoleIds = member.extraRoleIds.filter((id) => id !== row.id);
    member.temporaryRoleIds = member.temporaryRoleIds.filter((id) => id !== row.id);
  });
  toast('角色已删除');
}
function removePermissionResource(row: SettingTableRow) {
  const menu = String(row.menu || '');
  data.permissions.resources = data.permissions.resources.filter((item) => item.id !== row.id);
  data.permissions.rolePermissions = data.permissions.rolePermissions.filter((item) => item.menu !== menu);
  toast('权限资源已删除，相关角色授权已同步移除');
}
function removeFunctionPermission(row: SettingTableRow) {
  data.permissions.rolePermissions = data.permissions.rolePermissions.filter((item) => item.id !== row.id);
  toast('角色授权已删除');
}
function removeDataPermission(row: SettingTableRow) {
  data.permissions.dataPermissions = data.permissions.dataPermissions.filter((item) => item.id !== row.id);
  toast('数据权限已删除');
}
function removePosition(row: SettingTableRow) {
  data.permissions.positions = data.permissions.positions.filter((item) => item.id !== row.id);
  data.permissions.members = data.permissions.members.filter((item) => item.positionId !== row.id);
  toast('岗位已删除，相关成员授权已同步移除');
}
function removeMemberPermission(row: SettingTableRow) {
  data.permissions.members = data.permissions.members.filter((item) => item.id !== row.id);
  toast('成员授权已删除');
}
function openMemberEffectivePermission(row: MemberPermissionRow | SettingTableRow) {
  const member = data.permissions.members.find((item) => item.id === row.id);
  if (!member) return;
  const finalRoles = roleNames(memberFinalRoleIds(member)) || '无';
  const inherited = roleNames(memberInheritedRoleIds(member)) || '无';
  const extra = roleNames([...member.extraRoleIds, ...member.temporaryRoleIds]) || '无';
  openMessage('成员最终权限', `${member.name}：岗位继承 ${inherited}；额外 / 临时 ${extra}；最终角色 ${finalRoles}；数据范围特例：${member.dataScopeOverride || '无'}。`);
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

.settings-permission-flow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: -2px 0 12px;
}

.settings-permission-flow span {
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: var(--aw-bg);
  color: var(--aw-fg-2);
  font-size: 12px;
  font-weight: 500;
}

.settings-permission-workbench {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.settings-resource-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
  min-height: 438px;
}

.settings-resource-layout :deep(.aw-doc-tree) {
  max-height: min(560px, calc(100vh - 334px));
}

.settings-resource-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.settings-resource-current {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  border: 1px solid var(--aw-border);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #fff;
}

.settings-resource-current div {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-resource-current strong {
  color: var(--aw-fg-1);
  font-size: 13px;
  white-space: nowrap;
}

.settings-resource-current span,
.settings-resource-current em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
  white-space: nowrap;
}

.settings-resource-main :deep(.aw-doc-tbl-wrap) {
  border-radius: 0;
  max-height: min(480px, calc(100vh - 376px));
}

.settings-resource-main :deep(.aw-list-footer) {
  border-top: 0;
}

.settings-resource-form-page {
  min-height: min(620px, calc(100vh - 246px));
}

.settings-resource-config-panel {
  margin-top: 0;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.settings-resource-config-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--aw-divider);
}

.settings-resource-config-head strong,
.settings-resource-config-head p {
  display: block;
}

.settings-resource-config-head p {
  margin: 4px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-resource-editor {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.settings-resource-basic,
.settings-resource-config-section {
  min-width: 0;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: var(--aw-bg);
  padding: 12px;
}

.settings-resource-basic {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
}

.settings-resource-basic .aw-field span,
.settings-resource-config-section span {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-resource-basic input,
.settings-resource-basic select,
.settings-resource-basic textarea,
.settings-inline-add input {
  width: 100%;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  color: var(--aw-fg-1);
  font: inherit;
  outline: 0;
}

.settings-resource-basic input,
.settings-resource-basic select,
.settings-inline-add input {
  height: 32px;
  padding: 0 9px;
}

.settings-resource-basic textarea {
  min-height: 64px;
  resize: vertical;
  padding: 8px 9px;
}

.settings-resource-api-field {
  grid-column: 1 / -1;
}

.settings-resource-config-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings-resource-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.settings-resource-section-head strong {
  display: block;
  margin-top: 5px;
  color: var(--aw-fg-1);
  font-size: 14px;
}

.settings-token-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 96px;
  overflow: auto;
}

.settings-token-list.tall {
  max-height: 140px;
}

.settings-token-list i {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 22px;
  border-radius: 999px;
  background: #fff;
  color: var(--aw-fg-2);
  font-size: 12px;
  font-style: normal;
  padding: 0 8px;
}

.settings-token-list.editable i {
  border: 1px solid var(--aw-border);
}

.settings-token-list button {
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--aw-fg-3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.settings-token-list button:hover {
  background: #fff1f0;
  color: var(--aw-danger);
}

.settings-inline-add {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-action-checks {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.settings-action-checks label {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  color: var(--aw-fg-2);
  font-size: 12px;
  padding: 0 8px;
}

.settings-action-checks input {
  width: 14px;
  height: 14px;
  accent-color: var(--aw-primary);
}

.settings-resource-savebar {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--aw-divider);
}

.settings-resource-savebar span {
  color: var(--aw-fg-3);
  font-size: 12px;
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

.settings-resource-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.settings-resource-card {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 14px;
  min-width: 0;
}

.settings-resource-title,
.settings-resource-meta,
.settings-resource-counts {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-resource-title {
  justify-content: space-between;
}

.settings-resource-title strong,
.settings-resource-title span {
  display: block;
}

.settings-resource-title span {
  color: var(--aw-fg-3);
  font-size: 12px;
  margin-top: 3px;
}

.settings-resource-title i {
  border-radius: 999px;
  background: rgba(22, 163, 74, .1);
  color: #15803d;
  font-size: 12px;
  font-style: normal;
  padding: 2px 7px;
  white-space: nowrap;
}

.settings-resource-title i.off {
  background: #eef1f6;
  color: var(--aw-fg-3);
}

.settings-resource-meta {
  flex-wrap: wrap;
  margin-top: 10px;
}

.settings-resource-meta span,
.settings-resource-counts em,
.settings-tag-line {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border-radius: 999px;
  background: var(--aw-bg);
  color: var(--aw-fg-2);
  font-size: 12px;
  font-style: normal;
  padding: 0 8px;
}

.settings-resource-counts {
  flex-wrap: wrap;
  margin-top: 10px;
}

.settings-resource-card p {
  margin: 10px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-grant-dialog {
  grid-column: 1 / -1;
  width: 100%;
  min-width: 0;
  display: grid;
  gap: 14px;
}

.settings-grant-resource {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 14px;
}

.settings-grant-title,
.settings-grant-meta,
.settings-grant-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-grant-title {
  justify-content: space-between;
  align-items: flex-start;
}

.settings-grant-title strong,
.settings-grant-title p {
  display: block;
}

.settings-grant-title p {
  margin: 4px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-grant-meta {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: stretch;
  gap: 8px;
  margin-top: 12px;
}

.settings-grant-meta span {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  min-height: 54px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  color: var(--aw-fg-1);
  font-size: 13px;
  padding: 8px 10px;
  min-width: 0;
}

.settings-grant-meta span.wide {
  grid-column: span 3;
}

.settings-grant-meta b {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-weight: 500;
}

.settings-grant-table-wrap {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  overflow: auto;
  background: #fff;
  max-height: 360px;
}

.settings-grant-table {
  width: 100%;
  min-width: 1060px;
}

.settings-grant-table td strong,
.settings-grant-table td em {
  display: block;
}

.settings-grant-table td em {
  margin-top: 2px;
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

.settings-grant-actions {
  flex-wrap: wrap;
  gap: 6px;
}

.settings-grant-actions label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  border-radius: 999px;
  background: var(--aw-bg);
  color: var(--aw-fg-2);
  font-size: 12px;
  padding: 0 8px;
}

.settings-grant-actions label.disabled {
  opacity: .48;
}

.settings-grant-actions input {
  width: 13px;
  height: 13px;
  accent-color: var(--aw-primary);
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

.settings-auth-canvas,
.settings-inheritance-board,
.settings-member-audit {
  display: grid;
  gap: 14px;
  align-items: start;
}

.settings-auth-canvas {
  grid-template-columns: 360px minmax(0, 1fr);
}

.settings-auth-resource-panel,
.settings-auth-detail-panel,
.settings-inheritance-rail,
.settings-inheritance-table,
.settings-member-list-panel,
.settings-member-detail {
  min-width: 0;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.settings-auth-resource-list {
  display: grid;
  gap: 8px;
  max-height: min(560px, calc(100vh - 420px));
  overflow: auto;
}

.settings-menu-row em {
  display: block;
  margin-top: 5px;
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

.settings-auth-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--aw-divider);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.settings-auth-detail-head strong,
.settings-auth-detail-head p {
  display: block;
}

.settings-auth-detail-head strong {
  margin-top: 4px;
  color: var(--aw-fg-1);
  font-size: 18px;
}

.settings-auth-detail-head p {
  margin: 4px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-auth-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.settings-auth-section {
  min-width: 0;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 12px;
}

.settings-auth-section.wide {
  grid-column: 1 / -1;
}

.settings-action-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.settings-inheritance-board {
  grid-template-columns: 260px minmax(0, 1fr);
}

.settings-inheritance-rail strong,
.settings-inheritance-rail p {
  display: block;
}

.settings-inheritance-rail p {
  margin: 6px 0 12px;
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.7;
}

.settings-inheritance-steps {
  display: grid;
  gap: 8px;
}

.settings-inheritance-steps span {
  min-height: 34px;
  display: flex;
  align-items: center;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: var(--aw-bg);
  color: var(--aw-fg-2);
  font-size: 12px;
  padding: 0 10px;
}

.settings-member-audit {
  grid-template-columns: 270px minmax(0, 1fr);
}

.settings-member-list-panel {
  max-height: min(640px, calc(100vh - 330px));
  overflow: auto;
}

.settings-member-item {
  width: 100%;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--aw-fg-2);
  text-align: left;
  padding: 10px;
}

.settings-member-item.on {
  border-color: rgba(37, 99, 235, .24);
  background: var(--aw-bg);
  color: var(--aw-primary);
}

.settings-member-item strong,
.settings-member-item em {
  display: block;
}

.settings-member-item em {
  margin-top: 3px;
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

.settings-member-item i {
  border-radius: 999px;
  background: rgba(22, 163, 74, .1);
  color: #15803d;
  font-size: 12px;
  font-style: normal;
  padding: 2px 7px;
  white-space: nowrap;
}

.settings-member-source-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.settings-member-source-grid section {
  min-width: 0;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 12px;
}

.settings-member-source-grid span,
.settings-member-source-grid strong {
  display: block;
}

.settings-member-source-grid span {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-member-source-grid strong {
  margin-top: 6px;
  color: var(--aw-fg-1);
  font-size: 13px;
  line-height: 1.5;
}

.settings-member-resource-table {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  overflow: auto;
}

.settings-member-resource-table .aw-table {
  min-width: 760px;
}

.settings-empty-state {
  min-height: 280px;
  display: grid;
  place-items: center;
  color: var(--aw-fg-3);
  font-size: 13px;
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

.settings-panel-head div {
  min-width: 0;
}

.settings-panel-head p {
  margin: 2px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.6;
}

.aw-status.blue {
  background: #eaf0ff;
  color: #315cf6;
}

.aw-status.red {
  background: #fee2e2;
  color: #dc2626;
}

.settings-list-feedback {
  margin: 10px 0;
}

.aw-switch-line.disabled {
  cursor: not-allowed;
  opacity: .58;
}

.aw-switch-line.disabled i {
  cursor: not-allowed;
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

.settings-action-link {
  border: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.settings-purchase-modal {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  gap: 24px;
  align-items: center;
  width: 100%;
}

.settings-qr-card {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
}

.settings-qr-card span {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.settings-qr-code {
  display: grid;
  grid-template-columns: repeat(11, 9px);
  grid-auto-rows: 9px;
  gap: 2px;
  padding: 10px;
  border: 1px solid var(--aw-divider);
  border-radius: 6px;
  background: #fff;
}

.settings-qr-code i {
  display: block;
  border-radius: 1px;
  background: transparent;
}

.settings-qr-code i.on {
  background: #111827;
}

.settings-purchase-info {
  min-width: 0;
}

.settings-purchase-info strong {
  display: block;
  color: var(--aw-fg-1);
  font-size: 16px;
  line-height: 1.45;
  white-space: nowrap;
}

.settings-purchase-info p {
  margin: 6px 0 16px;
  color: var(--aw-fg-3);
  font-size: 13px;
}

.settings-purchase-info dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.settings-purchase-info dl div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  min-height: 34px;
  padding: 8px 10px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
}

.settings-purchase-info dt,
.settings-purchase-info dd {
  margin: 0;
  font-size: 13px;
}

.settings-purchase-info dt {
  color: var(--aw-fg-3);
}

.settings-purchase-info dd {
  color: var(--aw-fg-1);
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 1080px) {
  .settings-resource-layout,
  .settings-permission-workbench,
  .settings-auth-canvas,
  .settings-auth-detail-grid,
  .settings-inheritance-board,
  .settings-member-audit,
  .settings-guide {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-resource-layout :deep(.aw-doc-tree) {
    max-height: 220px;
  }

  .settings-permission-flow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .settings-resource-editor {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-company-panel .settings-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-action-checks {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .settings-member-source-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .settings-purchase-modal {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-qr-card {
    justify-self: center;
    width: 170px;
  }
}
</style>
