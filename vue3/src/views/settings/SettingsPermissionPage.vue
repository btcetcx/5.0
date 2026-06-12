<template>
  <aw-setting-page>
    <template #toolbar>
      <aw-setting-toolbar
        back-text="返回设置首页"
        @back="router.push('/settings')"
        @refresh="toast('权限设置已刷新')"
      />
    </template>

    <section class="aw-form-card settings-permission-card">
      <div class="settings-permission-head">
        <div class="aw-tabs">
        <button v-for="tab in tabs" :key="tab.key" :class="['t', { on: activeTab === tab.key }]" type="button" @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
        </div>
        <div class="aw-search settings-permission-search">
          <span class="aw-line-icon line-search"></span>
          <input :value="keyword" placeholder="搜索账号、功能、角色、权限" @input="keyword = ($event.target as HTMLInputElement).value" />
        </div>
      </div>

      <section v-if="activeTab === 'byAccount'" class="settings-split-layout">
        <aside class="settings-tree-panel">
          <div class="settings-tree-head">
            <strong>选择账号</strong>
            <input v-model="accountKeyword" placeholder="搜索账号" />
          </div>
          <button
            v-for="node in accountTreeRows"
            :key="node.node.key"
            :class="['settings-tree-row', `level-${node.level}`, { on: selectedAccountId === node.node.accountId, muted: node.node.type === 'department' }]"
            type="button"
            @click="node.node.accountId && selectAccount(node.node.accountId)"
          >
            <span>{{ node.node.label }}</span>
          </button>
        </aside>

        <section class="settings-main-panel">
          <div class="settings-block-head">
            <div>
              <strong>{{ selectedAccount?.fullName || '请选择账号' }}</strong>
              <p>{{ selectedAccount ? `${selectedAccount.userName} / ${selectedAccount.departmentName || '-'}` : '选择账号后可查看和勾选菜单、按钮权限。' }}</p>
            </div>
            <div class="settings-actions">
              <input v-model="accountPermissionKeyword" class="settings-inline-search" placeholder="搜索要选择的功能菜单" />
              <button class="aw-tool-btn" type="button" @click="openCopy('account')">复制他人权限</button>
              <button class="aw-btn primary" type="button" @click="saveAccountPermissions">保存</button>
            </div>
          </div>
          <div class="settings-authorize-board">
            <section class="settings-authorize-tree">
              <div class="settings-sub-head">
                <strong>功能菜单</strong>
              </div>
              <permission-check-tree
                :rows="permissionTreeRows"
                :target="selectedPermissionKeys"
                @toggle-key="toggleSelectedPermission"
                @toggle-menu="togglePermissionMenu"
              />
            </section>
            <section class="settings-permission-detail">
              <div class="settings-sub-head">
                <strong>已选权限明细</strong>
                <span>{{ selectedPermissionDetailRows.length }} 个功能菜单</span>
              </div>
              <table v-if="selectedPermissionDetailRows.length" class="settings-detail-table">
                <thead>
                  <tr>
                    <th>功能菜单</th>
                    <th>操作按钮</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in selectedPermissionDetailRows" :key="row.id">
                    <td>{{ row.menuName }}</td>
                    <td>{{ row.buttonNames }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="settings-empty">请选择左侧按钮权限，已选明细会实时显示在这里。</div>
            </section>
          </div>
        </section>
      </section>

      <section v-else-if="activeTab === 'batch'" class="settings-split-layout wide">
        <aside class="settings-tree-panel">
          <div class="settings-tree-head">
            <strong>批量账号</strong>
            <input v-model="batchAccountKeyword" placeholder="搜索账号" />
          </div>
          <label
            v-for="node in batchAccountRows"
            :key="node.node.key"
            :class="['settings-check-row', `level-${node.level}`, { muted: node.node.type === 'department' }]"
          >
            <input
              :checked="isBatchAccountNodeChecked(node.node)"
              :indeterminate.prop="isBatchAccountNodePartial(node.node)"
              type="checkbox"
              @change="toggleBatchAccountNode(node.node)"
            />
            <span>{{ node.node.label }}</span>
          </label>
        </aside>

        <section class="settings-main-panel">
          <div class="settings-block-head">
            <div>
              <strong>批量授权</strong>
              <p>已选择 {{ batchAccountIds.length }} 个账号、{{ batchPermissionKeys.length }} 个权限项。</p>
            </div>
            <div class="settings-actions">
              <input v-model="batchPermissionKeyword" class="settings-inline-search" placeholder="搜索要选择的功能菜单" />
              <button class="aw-tool-btn" type="button" @click="openCopy('batch')">复制他人权限</button>
              <button class="aw-btn primary" type="button" @click="saveBatchPermissions">保存批量授权</button>
            </div>
          </div>
          <div class="settings-authorize-board">
            <section class="settings-authorize-tree">
              <div class="settings-sub-head">
                <strong>选择权限</strong>
              </div>
              <permission-check-tree
                :rows="batchPermissionRows"
                :target="batchPermissionKeys"
                @toggle-key="(key) => toggleArray(batchPermissionKeys, key)"
                @toggle-menu="(menu) => togglePermissionMenu(menu, batchPermissionKeys)"
              />
            </section>
            <section class="settings-permission-detail">
              <div class="settings-sub-head">
                <strong>待授权权限明细</strong>
                <span>{{ batchPermissionDetailRows.length }} 个功能菜单</span>
              </div>
              <table v-if="batchPermissionDetailRows.length" class="settings-detail-table">
                <thead>
                  <tr>
                    <th>功能菜单</th>
                    <th>操作按钮</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in batchPermissionDetailRows" :key="row.id">
                    <td>{{ row.menuName }}</td>
                    <td>{{ row.buttonNames }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="settings-empty">请选择左侧按钮权限，批量授权明细会实时显示在这里。</div>
            </section>
          </div>
        </section>
      </section>

      <section v-else-if="activeTab === 'byFunction'" class="settings-split-layout">
        <aside class="settings-tree-panel">
          <div class="settings-tree-head">
            <strong>功能菜单</strong>
            <input v-model="functionKeyword" placeholder="搜索功能" />
          </div>
          <div class="settings-function-tree">
            <div
              v-for="node in visibleFunctionRows"
              :key="node.node.key"
              :class="['settings-function-tree-row', `level-${node.level}`, `type-${node.node.type}`, { on: selectedMenuId === node.node.menuId }]"
            >
              <button
                v-if="hasFunctionChildren(node.node)"
                class="settings-tree-expander"
                type="button"
                @click="toggleFunctionCollapse(node.node)"
              >
                {{ isFunctionCollapsed(node.node) ? '+' : '-' }}
              </button>
              <span v-else class="settings-tree-expander placeholder"></span>
              <button class="settings-function-node" type="button" @click="selectFunctionNode(node.node)">
                <span>{{ node.node.label }}</span>
              </button>
            </div>
            <div v-if="visibleFunctionRows.length === 0" class="settings-empty">暂无匹配功能菜单。</div>
          </div>
        </aside>

        <section class="settings-main-panel">
          <div class="settings-block-head">
            <div>
              <strong>{{ selectedMenu?.label || '请选择功能菜单' }}</strong>
              <p>查看已授权账号，可新增授权、删除单个授权或删除所有授权。</p>
            </div>
            <div class="settings-actions">
              <button class="aw-tool-btn danger" type="button" @click="deleteAllFunctionAuthorization">删除所有授权</button>
              <button class="aw-btn primary" type="button" @click="openFunctionAuthorization">新增授权</button>
            </div>
          </div>

          <aw-setting-table :columns="authColumns" :rows="authorizedRows" @delete="deleteFunctionAuthorization" @edit="() => openFunctionAuthorization()">
            <template #cell="{ column, row }">
              <span v-if="column.key === 'buttonNames'">{{ Array.isArray(row.buttonNames) ? row.buttonNames.join('、') : row.buttonNames }}</span>
              <span v-else>{{ row[column.key] }}</span>
            </template>
            <template #actions="{ row }">
              <span class="aw-link" @click="openFunctionAuthorization">新增</span>
              <span class="aw-action-split">|</span>
              <span class="aw-link" style="color:var(--aw-danger)" @click="deleteFunctionAuthorization(row)">删除</span>
            </template>
          </aw-setting-table>
        </section>
      </section>

      <section v-else class="settings-role-layout">
        <aside class="settings-tree-panel">
          <div class="settings-tree-head">
            <strong>角色列表</strong>
            <span>{{ roleRows.length }} 个角色</span>
          </div>
          <button
            v-for="role in roleRows"
            :key="role.id"
            :class="['settings-role-row', { on: selectedRoleId === role.id }]"
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

        <section class="settings-main-panel">
          <div class="settings-block-head">
            <div>
              <strong>{{ selectedRole?.name || '请选择角色' }}</strong>
              <p>{{ selectedRole ? `${selectedRole.center} / ${selectedRole.users} 个成员` : '选择角色后配置菜单、操作、字段和数据权限。' }}</p>
            </div>
            <button class="aw-btn primary" type="button" @click="saveAll('角色授权已保存')">保存角色授权</button>
          </div>

          <div class="aw-tabs compact">
            <button v-for="tab in roleTabs" :key="tab.key" :class="['t', { on: activeRoleTab === tab.key }]" type="button" @click="activeRoleTab = tab.key">
              {{ tab.label }}
            </button>
          </div>

          <div v-if="activeRoleTab === 'menus'" class="settings-list-stack">
            <article v-for="menu in roleMenuOptions" :key="menu" :class="['settings-menu-row', { on: activeRoleMenu === menu }]">
              <button type="button" @click="activeRoleMenu = menu">
                <strong>{{ menu }}</strong>
                <span>控制角色是否可访问该菜单。</span>
              </button>
              <label class="aw-switch-line mini">
                <input :checked="hasMenuAccess(menu)" type="checkbox" @change="toggleMenuAccess(menu)" />
                <i></i>
              </label>
            </article>
          </div>

          <div v-else-if="activeRoleTab === 'actions'" class="settings-action-grid">
            <label v-for="action in actionOptions" :key="action.key" class="settings-action-card">
              <span>
                <strong>{{ action.label }}</strong>
                <em>{{ action.desc }}</em>
              </span>
              <label class="aw-switch-line mini">
                <input :checked="Boolean(activeRolePermission?.[action.key])" type="checkbox" @change="toggleRoleAction(action.key)" />
                <i></i>
              </label>
            </label>
          </div>

          <div v-else-if="activeRoleTab === 'fields'" class="settings-list-stack">
            <article v-for="field in activeFieldOptions" :key="field" class="settings-field-row">
              <strong>{{ field }}</strong>
              <div class="settings-segmented">
                <button v-for="state in fieldStates" :key="state.key" :class="{ on: fieldState(field) === state.key }" type="button" @click="setFieldState(field, state.key)">
                  {{ state.label }}
                </button>
              </div>
            </article>
          </div>

          <div v-else class="settings-data-grid">
            <label v-for="field in dataScopeFields" :key="field.key" class="aw-field">
              <span>{{ field.label }}</span>
              <input :value="String(selectedDataPermission?.[field.key] || '')" @input="setDataScopeValue(field.key, ($event.target as HTMLInputElement).value)" />
            </label>
          </div>
        </section>
      </section>
    </section>

    <aw-setting-modal :open="functionModal.open" title="新增功能授权" width="720px" @cancel="functionModal.open = false" @confirm="confirmFunctionAuthorization">
      <div class="settings-modal-grid">
        <section>
          <strong>选择账号</strong>
          <label v-for="account in accountOptions" :key="account.accountId" class="settings-check-row">
            <input :checked="functionModal.accountIds.includes(account.accountId || '')" type="checkbox" @change="toggleArray(functionModal.accountIds, account.accountId || '')" />
            <span>{{ account.fullName }} / {{ account.userName }}</span>
          </label>
        </section>
        <section>
          <strong>选择操作权限</strong>
          <label v-for="button in selectedMenuButtons" :key="button.key" class="settings-check-row">
            <input :checked="functionModal.buttonKeys.includes(button.key)" type="checkbox" @change="toggleArray(functionModal.buttonKeys, button.key)" />
            <span>{{ button.label }}</span>
          </label>
          <div v-if="selectedMenuButtons.length === 0" class="settings-empty">该菜单暂无按钮权限项。</div>
        </section>
      </div>
    </aw-setting-modal>

    <aw-setting-modal :open="copyModal.open" title="复制他人权限" width="560px" @cancel="copyModal.open = false" @confirm="confirmCopy">
      <div class="settings-modal-stack">
        <p class="settings-modal-tip">从一个或多个账号复制权限到当前待保存列表。</p>
        <label v-for="account in accountOptions" :key="account.accountId" class="settings-check-row">
          <input :checked="copyModal.accountIds.includes(account.accountId || '')" type="checkbox" @change="toggleArray(copyModal.accountIds, account.accountId || '')" />
          <span>{{ account.fullName }} / {{ account.userName }}</span>
        </label>
      </div>
    </aw-setting-modal>

    <div v-if="toastText" class="aw-toast">{{ toastText }}</div>
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingTable from '@/components/setting-page/AwSettingTable.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import { getSettingsCenterData, saveSettingsCenterData } from '@/app/api/settings/resources';
import type { AccountPermissionRow, AccountTreeNode, DataPermissionRow, PermissionScopeRow, PermissionTreeNode, RoleRow, SettingsCenterData } from '@/app/api/settings/types';
import type { SettingTableColumn, SettingTableRow } from '@/components/setting-page/types';

type TabKey = 'byAccount' | 'batch' | 'byFunction' | 'role';
type RoleTabKey = 'menus' | 'actions' | 'fields' | 'data';
type ActionKey = 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export' | 'approve';
type FieldState = 'hidden' | 'readonly' | 'edit';
type DataScopeKey = 'department' | 'region' | 'customerScope' | 'projectScope' | 'documentScope' | 'materialScope' | 'bomScope';
type FlatAccount = { node: AccountTreeNode; level: number };
type FlatPermission = { node: PermissionTreeNode; level: number; platformName?: string; menuName?: string; menuPath: string[]; parentKeys: string[] };
type PermissionDetail = { key: string; platformId: string; platformName: string; menuId: string; menuName: string; buttonName: string };
type PermissionDetailRow = { id: string; menuName: string; buttonNames: string };

const PermissionCheckTree = defineComponent({
  name: 'PermissionCheckTree',
  props: {
    rows: { type: Array as () => FlatPermission[], required: true },
    target: { type: Array as () => string[], required: true },
  },
  emits: ['toggle-key', 'toggle-menu'],
  setup(props, { emit }) {
    const collapsedKeys = ref<string[]>([]);
    const nodeKey = (node: PermissionTreeNode) => node.key || node.id;
    const isCollapsed = (key: string) => collapsedKeys.value.includes(key);
    const toggleCollapsed = (key: string) => {
      if (isCollapsed(key)) collapsedKeys.value = collapsedKeys.value.filter((item) => item !== key);
      else collapsedKeys.value = [...collapsedKeys.value, key];
    };

    return () => {
      const visibleRows = props.rows.filter((row) => row.parentKeys.every((key) => !isCollapsed(key)));
      return h('div', { class: 'settings-check-tree' }, visibleRows.length
        ? visibleRows.map((row) => {
          const key = nodeKey(row.node);
          const hasChildren = Boolean(row.node.children?.length);
          const collapsed = isCollapsed(key);
          const keys = row.node.type === 'button' ? [row.node.key] : descendantButtonKeys(row.node);
          const checkedCount = keys.filter((key) => props.target.includes(key)).length;
          const checked = keys.length > 0 && checkedCount === keys.length;
          const partial = checkedCount > 0 && checkedCount < keys.length;
          const expander = hasChildren
            ? h('button', {
                class: ['settings-tree-expander', { collapsed }],
                type: 'button',
                onClick: (event: Event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleCollapsed(key);
                },
              }, collapsed ? '+' : '-')
            : h('span', { class: 'settings-tree-expander placeholder' }, '');
          const input = h('input', {
            checked,
            disabled: keys.length === 0,
            type: 'checkbox',
            onChange: () => row.node.type === 'button' ? emit('toggle-key', row.node.key) : emit('toggle-menu', row.node),
            onVnodeMounted: (vnode) => {
              (vnode.el as HTMLInputElement).indeterminate = partial;
            },
            onVnodeUpdated: (vnode) => {
              (vnode.el as HTMLInputElement).indeterminate = partial;
            },
          });
          return h('label', { class: ['settings-check-row', `level-${row.level}`, `type-${row.node.type}`, { partial, 'has-children': hasChildren }] }, [expander, input, h('span', row.node.label)]);
        })
        : h('div', { class: 'settings-empty' }, '暂无匹配权限项。'));
    };
  },
});

const router = useRouter();
const keyword = ref('');
const toastText = ref('');
const activeTab = ref<TabKey>('byAccount');
const activeRoleTab = ref<RoleTabKey>('menus');
const selectedAccountId = ref('');
const selectedPermissionKeys = ref<string[]>([]);
const selectedMenuId = ref('');
const selectedRoleId = ref('');
const activeRoleMenu = ref('');
const accountKeyword = ref('');
const batchAccountKeyword = ref('');
const accountPermissionKeyword = ref('');
const batchPermissionKeyword = ref('');
const functionKeyword = ref('');
const functionCollapsedKeys = ref<string[]>([]);
const batchAccountIds = ref<string[]>([]);
const batchPermissionKeys = ref<string[]>([]);
const data = reactive<SettingsCenterData>({
  system: { company: { company: '', shortName: '', unifiedCode: '', industry: '', contact: '', phone: '', email: '', address: '', logoText: '' }, notifications: [] },
  permissions: { roles: [], functionPermissions: [], dataPermissions: [], accountTree: [], permissionTree: [], accountPermissions: [], superAdmins: [] },
  security: { rules: [] },
  data: { auditLogs: [], tasks: [] },
  integrations: { partners: [], apiKeys: [], syncTasks: [] },
  guide: { modules: [] },
});
const functionModal = reactive({ open: false, accountIds: [] as string[], buttonKeys: [] as string[] });
const copyModal = reactive({ open: false, target: 'account' as 'account' | 'batch', accountIds: [] as string[] });

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'byAccount', label: '按账号设置权限' },
  { key: 'batch', label: '批量授权' },
  { key: 'byFunction', label: '按功能授权账号' },
  { key: 'role', label: '角色授权' },
];
const roleTabs: Array<{ key: RoleTabKey; label: string }> = [
  { key: 'menus', label: '菜单权限' },
  { key: 'actions', label: '操作权限' },
  { key: 'fields', label: '字段权限' },
  { key: 'data', label: '数据权限' },
];
const actionOptions: Array<{ key: ActionKey; label: string; desc: string }> = [
  { key: 'view', label: '查看', desc: '打开页面、查看列表与详情' },
  { key: 'create', label: '新增', desc: '新建业务记录' },
  { key: 'edit', label: '编辑', desc: '修改基础信息和业务明细' },
  { key: 'delete', label: '删除', desc: '删除草稿或未发布记录' },
  { key: 'import', label: '导入', desc: 'Excel 导入和批量导入' },
  { key: 'export', label: '导出', desc: '导出列表与明细' },
  { key: 'approve', label: '审批', desc: '提交、审核、发布和冻结' },
];
const fieldStates: Array<{ key: FieldState; label: string }> = [
  { key: 'hidden', label: '隐藏' },
  { key: 'readonly', label: '只读' },
  { key: 'edit', label: '可编辑' },
];
const dataScopeFields: Array<{ key: DataScopeKey; label: string }> = [
  { key: 'department', label: '部门范围' },
  { key: 'region', label: '区域范围' },
  { key: 'customerScope', label: '客户范围' },
  { key: 'projectScope', label: '项目范围' },
  { key: 'documentScope', label: '文档范围' },
  { key: 'materialScope', label: '产品 / 物料范围' },
  { key: 'bomScope', label: 'BOM 范围' },
];
const authColumns: SettingTableColumn[] = [
  { key: 'userName', label: '账号' },
  { key: 'fullName', label: '姓名' },
  { key: 'departmentName', label: '部门' },
  { key: 'buttonNames', label: '授权操作' },
];

const accountOptions = computed(() => flattenAccounts(data.permissions.accountTree));
const permissionTreeRows = computed(() => filterPermissionRows(data.permissions.permissionTree, accountPermissionKeyword.value));
const batchPermissionRows = computed(() => filterPermissionRows(data.permissions.permissionTree, batchPermissionKeyword.value));
const accountTreeRows = computed(() => flattenAccountTree(data.permissions.accountTree, accountKeyword.value));
const batchAccountRows = computed(() => flattenAccountTree(data.permissions.accountTree, batchAccountKeyword.value));
const functionRows = computed(() => filterFunctionMenuRows(data.permissions.permissionTree, functionKeyword.value || keyword.value));
const visibleFunctionRows = computed(() => functionRows.value.filter((row) => row.parentKeys.every((key) => !functionCollapsedKeys.value.includes(key))));
const selectableFunctionRows = computed(() => functionRows.value.filter((row) => row.node.type === 'menu' && row.node.menuId));
const selectedAccount = computed(() => accountOptions.value.find((item) => item.accountId === selectedAccountId.value));
const selectedMenu = computed(() => flattenPermissions(data.permissions.permissionTree).find((item) => item.node.menuId === selectedMenuId.value)?.node);
const selectedMenuButtons = computed(() => selectedMenu.value ? flattenPermissionButtons(selectedMenu.value.children || []).map((item) => item.node) : []);
const authorizedRows = computed(() => data.permissions.accountPermissions.filter((item) => item.menuId === selectedMenuId.value) as unknown as SettingTableRow[]);
const selectedPermissionDetailRows = computed(() => permissionDetailRowsFromKeys(selectedPermissionKeys.value));
const batchPermissionDetailRows = computed(() => permissionDetailRowsFromKeys(batchPermissionKeys.value));
const roleRows = computed(() => {
  const kw = keyword.value.trim();
  return kw ? data.permissions.roles.filter((row) => Object.values(row).join(' ').includes(kw)) : data.permissions.roles;
});
const selectedRole = computed(() => data.permissions.roles.find((item) => item.id === selectedRoleId.value));
const roleMenuOptions = computed(() => unique(data.permissions.functionPermissions.map((item) => item.menu)).filter(Boolean));
const rolePermissions = computed(() => data.permissions.functionPermissions.filter((item) => item.role === selectedRole.value?.name));
const activeRolePermission = computed(() => rolePermissions.value.find((item) => item.menu === activeRoleMenu.value));
const activeFieldOptions = computed(() => unique([...(activeRolePermission.value?.fieldsView || []), ...(activeRolePermission.value?.fieldsEdit || [])]));
const selectedDataPermission = computed(() => data.permissions.dataPermissions.find((item) => item.role === selectedRole.value?.name));

onMounted(async () => {
  Object.assign(data, await getSettingsCenterData());
  selectedAccountId.value = accountOptions.value[0]?.accountId || '';
  selectedMenuId.value = selectableFunctionRows.value[0]?.node.menuId || '';
  selectedRoleId.value = data.permissions.roles[0]?.id || '';
  activeRoleMenu.value = data.permissions.functionPermissions[0]?.menu || '';
  loadSelectedAccountPermissions();
});

function flattenAccounts(nodes: AccountTreeNode[]): AccountTreeNode[] {
  return nodes.flatMap((node) => (node.type === 'account' ? [node] : flattenAccounts(node.children || [])));
}

function flattenAccountTree(nodes: AccountTreeNode[], filter = '', level = 0): FlatAccount[] {
  const kw = filter.trim();
  return nodes.flatMap((node) => {
    const children = flattenAccountTree(node.children || [], filter, level + 1);
    const matched = !kw || [node.label, node.userName, node.fullName, node.departmentName, node.postName].join(' ').includes(kw);
    if (!matched && children.length === 0) return [];
    return [{ node, level }, ...children];
  });
}

function flattenPermissions(nodes: PermissionTreeNode[], level = 0, platformName = '', menuPath: string[] = [], parentKeys: string[] = []): FlatPermission[] {
  return nodes.flatMap((node) => {
    const nextPlatform = node.type === 'platform' ? node.label : platformName;
    const nextMenuPath = node.type === 'menu' ? [...menuPath, node.label] : menuPath;
    const key = node.key || node.id;
    return [
      { node, level, platformName: nextPlatform, menuName: nextMenuPath[nextMenuPath.length - 1] || '', menuPath: nextMenuPath, parentKeys },
      ...flattenPermissions(node.children || [], level + 1, nextPlatform, nextMenuPath, [...parentKeys, key]),
    ];
  });
}

function flattenPermissionButtons(nodes: PermissionTreeNode[]): FlatPermission[] {
  return flattenPermissions(nodes).filter((item) => item.node.type === 'button');
}

function filterPermissionRows(nodes: PermissionTreeNode[], filter = '', level = 0, platformName = '', menuPath: string[] = [], parentKeys: string[] = []): FlatPermission[] {
  const kw = filter.trim();
  return nodes.flatMap((node) => {
    const nextPlatform = node.type === 'platform' ? node.label : platformName;
    const nextMenuPath = node.type === 'menu' ? [...menuPath, node.label] : menuPath;
    const key = node.key || node.id;
    const row: FlatPermission = { node, level, platformName: nextPlatform, menuName: nextMenuPath[nextMenuPath.length - 1] || '', menuPath: nextMenuPath, parentKeys };
    const selfMatched = matchPermission(row, kw);
    const children = filterPermissionRows(node.children || [], selfMatched ? '' : kw, level + 1, nextPlatform, nextMenuPath, [...parentKeys, key]);
    if (!kw || selfMatched || children.length > 0) return [row, ...children];
    return [];
  });
}

function filterFunctionMenuRows(nodes: PermissionTreeNode[], filter = '', level = 0, platformName = '', menuPath: string[] = [], parentKeys: string[] = []): FlatPermission[] {
  const kw = filter.trim();
  return nodes.flatMap((node) => {
    const nextPlatform = node.type === 'platform' ? node.label : platformName;
    const nextMenuPath = node.type === 'menu' ? [...menuPath, node.label] : menuPath;
    const key = node.key || node.id;
    const row: FlatPermission = { node, level, platformName: nextPlatform, menuName: nextMenuPath[nextMenuPath.length - 1] || '', menuPath: nextMenuPath, parentKeys };
    const selfMatched = matchPermission(row, kw);
    const childRows = filterFunctionMenuRows(node.children || [], selfMatched ? '' : kw, level + 1, nextPlatform, nextMenuPath, [...parentKeys, key]);
    const buttonMatched = Boolean(kw) && flattenPermissionButtons(node.children || []).some((item) => matchPermission(item, kw));

    if (node.type === 'button') return [];
    if (!kw || selfMatched || childRows.length > 0 || buttonMatched) return [row, ...childRows];
    return [];
  });
}

function matchPermission(row: FlatPermission, filter: string) {
  const kw = filter.trim();
  if (!kw) return true;
  return [row.node.label, row.node.menuId, row.node.buttonSign, row.platformName, row.menuName, row.menuPath.join(' / ')].join(' ').includes(kw);
}

function selectAccount(accountId: string) {
  selectedAccountId.value = accountId;
  loadSelectedAccountPermissions();
}

function selectMenu(menuId: string) {
  if (!menuId) return;
  selectedMenuId.value = menuId;
}

function permissionNodeKey(node: PermissionTreeNode) {
  return node.key || node.id;
}

function hasFunctionChildren(node: PermissionTreeNode) {
  return Boolean(node.children?.some((child) => child.type !== 'button'));
}

function isFunctionCollapsed(node: PermissionTreeNode) {
  return functionCollapsedKeys.value.includes(permissionNodeKey(node));
}

function toggleFunctionCollapse(node: PermissionTreeNode) {
  const key = permissionNodeKey(node);
  if (functionCollapsedKeys.value.includes(key)) functionCollapsedKeys.value = functionCollapsedKeys.value.filter((item) => item !== key);
  else functionCollapsedKeys.value = [...functionCollapsedKeys.value, key];
}

function selectFunctionNode(node: PermissionTreeNode) {
  if (node.menuId) {
    selectMenu(node.menuId);
    return;
  }
  if (hasFunctionChildren(node)) toggleFunctionCollapse(node);
}

function selectRole(roleId: string) {
  selectedRoleId.value = roleId;
  activeRoleMenu.value = rolePermissions.value[0]?.menu || roleMenuOptions.value[0] || '';
}

function loadSelectedAccountPermissions() {
  selectedPermissionKeys.value = unique(data.permissions.accountPermissions.filter((item) => item.accountId === selectedAccountId.value).flatMap((item) => item.buttonKeys));
}

function toggleArray(list: string[], value: string) {
  if (!value) return;
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
  else list.push(value);
}

function accountIdsInNode(node: AccountTreeNode): string[] {
  if (node.accountId) return [node.accountId];
  return flattenAccounts(node.children || []).map((item) => item.accountId || '').filter(Boolean);
}

function isBatchAccountNodeChecked(node: AccountTreeNode) {
  const ids = accountIdsInNode(node);
  return ids.length > 0 && ids.every((id) => batchAccountIds.value.includes(id));
}

function isBatchAccountNodePartial(node: AccountTreeNode) {
  const ids = accountIdsInNode(node);
  const checkedCount = ids.filter((id) => batchAccountIds.value.includes(id)).length;
  return checkedCount > 0 && checkedCount < ids.length;
}

function toggleBatchAccountNode(node: AccountTreeNode) {
  const ids = accountIdsInNode(node);
  if (ids.length === 0) return;
  if (ids.every((id) => batchAccountIds.value.includes(id))) {
    batchAccountIds.value = batchAccountIds.value.filter((id) => !ids.includes(id));
    return;
  }
  batchAccountIds.value = unique([...batchAccountIds.value, ...ids]);
}

function toggleSelectedPermission(key: string) {
  toggleArray(selectedPermissionKeys.value, key);
}

function descendantButtonKeys(node: PermissionTreeNode) {
  if (node.type === 'button') return [node.key];
  return flattenPermissionButtons(node.children || []).map((item) => item.node.key);
}

function togglePermissionMenu(node: PermissionTreeNode, target = selectedPermissionKeys.value) {
  const keys = descendantButtonKeys(node);
  if (keys.length === 0) return;
  if (keys.every((key) => target.includes(key))) {
    keys.forEach((key) => {
      const index = target.indexOf(key);
      if (index >= 0) target.splice(index, 1);
    });
  } else {
    keys.forEach((key) => {
      if (!target.includes(key)) target.push(key);
    });
  }
}

function openCopy(target: 'account' | 'batch') {
  if (target === 'account' && !selectedAccountId.value) {
    toast('请先选择账号');
    return;
  }
  copyModal.open = true;
  copyModal.target = target;
  copyModal.accountIds = [];
}

function confirmCopy() {
  const copiedKeys = unique(data.permissions.accountPermissions.filter((item) => copyModal.accountIds.includes(item.accountId)).flatMap((item) => item.buttonKeys));
  if (copyModal.target === 'account') selectedPermissionKeys.value = unique([...selectedPermissionKeys.value, ...copiedKeys]);
  else batchPermissionKeys.value = unique([...batchPermissionKeys.value, ...copiedKeys]);
  copyModal.open = false;
  toast('权限已复制到待保存列表');
}

function saveAccountPermissions() {
  if (!selectedAccountId.value) {
    toast('请先选择账号');
    return;
  }
  replaceAccountPermissions(selectedAccountId.value, selectedPermissionKeys.value);
  saveAll('账号权限已保存');
}

function saveBatchPermissions() {
  if (batchAccountIds.value.length === 0) {
    toast('请选择至少一个账号');
    return;
  }
  if (batchPermissionKeys.value.length === 0) {
    toast('请选择至少一个权限');
    return;
  }
  batchAccountIds.value.forEach((accountId) => mergeAccountPermission(accountId, batchPermissionKeys.value));
  batchAccountIds.value = [];
  batchPermissionKeys.value = [];
  saveAll('批量授权已保存');
}

function openFunctionAuthorization() {
  if (!selectedMenuId.value) {
    toast('请先选择功能菜单');
    return;
  }
  functionModal.open = true;
  functionModal.accountIds = [];
  functionModal.buttonKeys = selectedMenuButtons.value.map((item) => item.key);
}

function confirmFunctionAuthorization() {
  if (functionModal.accountIds.length === 0) {
    toast('请选择至少一个账号');
    return;
  }
  const keys = functionModal.buttonKeys.length ? functionModal.buttonKeys : selectedMenuButtons.value.map((item) => item.key);
  functionModal.accountIds.forEach((accountId) => mergeAccountPermission(accountId, keys));
  functionModal.open = false;
  saveAll('功能授权已保存');
}

function deleteFunctionAuthorization(row: SettingTableRow) {
  if (!window.confirm('确认删除该账号的功能授权吗？')) return;
  data.permissions.accountPermissions = data.permissions.accountPermissions.filter((item) => item.id !== row.id);
  saveAll('功能授权已删除');
}

function deleteAllFunctionAuthorization() {
  if (!selectedMenuId.value) {
    toast('请先选择功能菜单');
    return;
  }
  if (!window.confirm('确认删除当前功能的所有账号授权吗？')) return;
  data.permissions.accountPermissions = data.permissions.accountPermissions.filter((item) => item.menuId !== selectedMenuId.value);
  saveAll('当前功能授权已全部删除');
}

function mergeAccountPermission(accountId: string, keys: string[]) {
  const oldKeys = data.permissions.accountPermissions.filter((item) => item.accountId === accountId).flatMap((item) => item.buttonKeys);
  replaceAccountPermissions(accountId, unique([...oldKeys, ...keys]));
}

function replaceAccountPermissions(accountId: string, keys: string[]) {
  const account = accountOptions.value.find((item) => item.accountId === accountId);
  if (!account?.accountId) return;
  const rows = Object.values(permissionDetailsFromKeys(keys).reduce<Record<string, AccountPermissionRow>>((map, detail) => {
    if (!map[detail.menuId]) {
      map[detail.menuId] = {
        id: `ap-${account.accountId}-${detail.menuId}`,
        accountId: account.accountId || '',
        userName: account.userName || '',
        fullName: account.fullName || account.label,
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
  }, {}));
  data.permissions.accountPermissions = [...data.permissions.accountPermissions.filter((item) => item.accountId !== account.accountId), ...rows];
  if (selectedAccountId.value === account.accountId) loadSelectedAccountPermissions();
}

function permissionDetailsFromKeys(keys: string[]): PermissionDetail[] {
  const rows = flattenPermissions(data.permissions.permissionTree);
  return keys.map((key) => {
    const button = rows.find((item) => item.node.key === key && item.node.type === 'button');
    if (!button?.node) return undefined;
    const platform = rows.find((item) => item.node.platformId === button.node.platformId && item.node.type === 'platform');
    const menuPath = [button.platformName, ...button.menuPath].filter(Boolean).join(' / ') || button.menuName || '';
    const menuId = button.node.menuId || button.menuPath.join('/');
    return {
      key,
      platformId: button.node.platformId || '',
      platformName: platform?.node.label || button.platformName || '',
      menuId,
      menuName: menuPath,
      buttonName: button.node.label,
    };
  }).filter(Boolean) as PermissionDetail[];
}

function permissionDetailRowsFromKeys(keys: string[]): PermissionDetailRow[] {
  const grouped = permissionDetailsFromKeys(keys).reduce<Record<string, PermissionDetailRow & { buttonList: string[] }>>((map, detail) => {
    const groupKey = detail.menuId;
    if (!map[groupKey]) {
      map[groupKey] = {
        id: groupKey,
        menuName: detail.menuName,
        buttonNames: '',
        buttonList: [],
      };
    }
    if (!map[groupKey].buttonList.includes(detail.buttonName)) map[groupKey].buttonList.push(detail.buttonName);
    map[groupKey].buttonNames = map[groupKey].buttonList.join('、');
    return map;
  }, {});
  return Object.values(grouped).map(({ buttonList: _buttonList, ...row }) => row);
}

function hasMenuAccess(menu: string) {
  return rolePermissions.value.some((item) => item.menu === menu && item.view);
}

function ensureRolePermission(menu: string) {
  if (!selectedRole.value) return undefined;
  let permission = data.permissions.functionPermissions.find((item) => item.role === selectedRole.value?.name && item.menu === menu);
  if (!permission) {
    permission = {
      id: `perm-${Date.now()}-${menu}`,
      role: selectedRole.value.name,
      module: selectedRole.value.center,
      menu,
      page: `${menu}列表 / ${menu}详情`,
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

function toggleMenuAccess(menu: string) {
  const permission = ensureRolePermission(menu);
  if (!permission) return;
  permission.view = !permission.view;
  activeRoleMenu.value = menu;
}

function toggleRoleAction(key: ActionKey) {
  const permission = ensureRolePermission(activeRoleMenu.value);
  if (!permission) return;
  permission[key] = !permission[key];
}

function fieldState(field: string): FieldState {
  if (!activeRolePermission.value || !activeRolePermission.value.fieldsView.includes(field)) return 'hidden';
  return activeRolePermission.value.fieldsEdit.includes(field) ? 'edit' : 'readonly';
}

function setFieldState(field: string, state: FieldState) {
  const permission = ensureRolePermission(activeRoleMenu.value);
  if (!permission) return;
  permission.fieldsView = permission.fieldsView.filter((item) => item !== field);
  permission.fieldsEdit = permission.fieldsEdit.filter((item) => item !== field);
  if (state === 'readonly') permission.fieldsView.push(field);
  if (state === 'edit') {
    permission.fieldsView.push(field);
    permission.fieldsEdit.push(field);
  }
}

function ensureDataPermission() {
  if (!selectedRole.value) return undefined;
  let permission = data.permissions.dataPermissions.find((item) => item.role === selectedRole.value?.name);
  if (!permission) {
    permission = {
      id: `data-${Date.now()}`,
      name: `${selectedRole.value.name}数据范围`,
      role: selectedRole.value.name,
      center: selectedRole.value.center,
      department: '',
      region: '',
      customerScope: '',
      projectScope: '',
      documentScope: '',
      materialScope: '',
      bomScope: '',
      enabled: true,
    };
    data.permissions.dataPermissions.push(permission);
  }
  return permission;
}

function setDataScopeValue(key: DataScopeKey, value: string) {
  const permission = ensureDataPermission();
  if (permission) permission[key] = value;
}

async function saveAll(message: string) {
  await saveSettingsCenterData(data);
  toast(message);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function toast(message: string) {
  toastText.value = message;
  window.setTimeout(() => {
    toastText.value = '';
  }, 1800);
}
</script>

<style scoped>
.settings-permission-card {
  padding: 22px 24px 24px;
}

.settings-permission-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid var(--aw-border);
  margin-bottom: 14px;
}

.settings-permission-head .aw-tabs {
  border-bottom: 0;
  margin: 0;
}

.settings-permission-search {
  flex: 0 1 380px;
  margin-bottom: 10px;
}

.settings-split-layout,
.settings-role-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  margin-top: 14px;
}

.settings-split-layout.wide {
  grid-template-columns: 300px minmax(0, 1fr);
}

.settings-tree-panel,
.settings-main-panel {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  min-width: 0;
  padding: 12px;
}

.settings-tree-panel {
  background: var(--aw-bg);
}

.settings-tree-head,
.settings-block-head,
.settings-actions,
.settings-role-row,
.settings-menu-row,
.settings-field-row,
.settings-action-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-tree-head,
.settings-block-head {
  justify-content: space-between;
  margin-bottom: 10px;
}

.settings-tree-head {
  align-items: stretch;
  flex-direction: column;
}

.settings-tree-head input {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  height: 32px;
  min-width: 0;
  padding: 0 10px;
}

.settings-inline-search {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  height: 32px;
  min-width: 220px;
  padding: 0 10px;
}

.settings-block-head p,
.settings-role-row em,
.settings-action-card em,
.settings-menu-row span,
.settings-modal-tip,
.settings-sub-head span {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
}

.settings-tree-row,
.settings-role-row {
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

.settings-tree-row.on,
.settings-role-row.on {
  border-color: rgba(37, 99, 235, .24);
  background: #fff;
  color: var(--aw-primary);
  font-weight: 700;
}

.settings-tree-row.muted,
.settings-check-row.type-platform {
  color: var(--aw-fg-3);
  font-weight: 700;
}

.settings-tree-row.level-1,
.settings-check-row.level-1 { padding-left: 22px; }
.settings-tree-row.level-2,
.settings-check-row.level-2 { padding-left: 36px; }
.settings-check-row.level-3 { padding-left: 50px; }

.settings-function-tree {
  max-height: 460px;
  overflow: auto;
}

.settings-function-tree-row {
  border: 1px solid transparent;
  border-radius: 7px;
  color: var(--aw-fg-2);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 34px;
  padding: 6px 8px;
}

.settings-function-tree-row.on {
  border-color: rgba(37, 99, 235, .24);
  background: #fff;
  color: var(--aw-primary);
  font-weight: 700;
}

.settings-function-tree-row.type-platform {
  color: var(--aw-fg-1);
  font-weight: 700;
}

.settings-function-node {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  line-height: 1.55;
  padding: 0;
  text-align: left;
}

.settings-function-node span {
  display: block;
  min-width: 0;
  word-break: break-word;
}

.settings-function-tree .settings-tree-expander {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  border: 1px solid var(--aw-border);
  border-radius: 4px;
  background: #fff;
  color: var(--aw-fg-2);
  cursor: pointer;
  font-size: 12px;
  line-height: 16px;
  margin-top: 2px;
  padding: 0;
  text-align: center;
}

.settings-function-tree .settings-tree-expander.placeholder {
  border-color: transparent;
  background: transparent;
  cursor: default;
}

.settings-function-tree-row.level-1 { padding-left: 22px; }
.settings-function-tree-row.level-2 { padding-left: 38px; }
.settings-function-tree-row.level-3 { padding-left: 54px; }
.settings-function-tree-row.level-4 { padding-left: 70px; }
.settings-function-tree-row.level-5 { padding-left: 86px; }

.settings-check-tree {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  max-height: 460px;
  overflow: auto;
  padding: 8px;
}

.settings-check-row {
  border-radius: 6px;
  color: var(--aw-fg-2);
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 5px 8px;
}

.settings-check-row span {
  min-width: 0;
}

.settings-check-row em {
  display: block;
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
  word-break: break-word;
}

.settings-check-row.partial {
  background: rgba(37, 99, 235, .06);
}

.settings-check-row.type-button {
  background: #fff;
}

.settings-check-tree :deep(.settings-check-row) {
  width: 100%;
  box-sizing: border-box;
  border-radius: 6px;
  color: var(--aw-fg-2);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 30px;
  padding: 6px 8px;
  white-space: normal;
}

.settings-check-tree :deep(.settings-check-row input) {
  flex: 0 0 auto;
  margin-top: 3px;
}

.settings-check-tree :deep(.settings-tree-expander) {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  border: 1px solid var(--aw-border);
  border-radius: 4px;
  background: #fff;
  color: var(--aw-fg-2);
  cursor: pointer;
  font-size: 12px;
  line-height: 16px;
  padding: 0;
  text-align: center;
}

.settings-check-tree :deep(.settings-tree-expander.placeholder) {
  border-color: transparent;
  background: transparent;
  cursor: default;
}

.settings-check-tree :deep(.settings-check-row span) {
  display: block;
  min-width: 0;
  word-break: break-word;
}

.settings-check-tree :deep(.settings-check-row em) {
  display: block;
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
  line-height: 1.5;
  margin-top: 2px;
  word-break: break-word;
}

.settings-check-tree :deep(.settings-check-row.type-platform) {
  color: var(--aw-fg-1);
  font-weight: 700;
}

.settings-check-tree :deep(.settings-check-row.type-menu) {
  color: var(--aw-fg-2);
  font-weight: 600;
}

.settings-check-tree :deep(.settings-check-row.type-button) {
  background: #fff;
  border: 1px solid transparent;
}

.settings-check-tree :deep(.settings-check-row.partial) {
  background: rgba(37, 99, 235, .06);
}

.settings-check-tree :deep(.settings-check-row.level-1) { padding-left: 22px; }
.settings-check-tree :deep(.settings-check-row.level-2) { padding-left: 38px; }
.settings-check-tree :deep(.settings-check-row.level-3) { padding-left: 54px; }
.settings-check-tree :deep(.settings-check-row.level-4) { padding-left: 70px; }
.settings-check-tree :deep(.settings-check-row.level-5) { padding-left: 86px; }

.settings-authorize-board {
  display: grid;
  grid-template-columns: minmax(240px, 38%) minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.settings-authorize-tree,
.settings-permission-detail {
  min-width: 0;
}

.settings-sub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.settings-sub-head span {
  text-align: right;
}

.settings-detail-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.settings-detail-table th,
.settings-detail-table td {
  border-bottom: 1px solid var(--aw-border);
  color: var(--aw-fg-2);
  font-size: 13px;
  line-height: 1.55;
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}

.settings-detail-table th {
  background: var(--aw-bg);
  color: var(--aw-fg-1);
  font-weight: 700;
}

.settings-detail-table tr:last-child td {
  border-bottom: 0;
}

.settings-role-row {
  justify-content: space-between;
}

.settings-role-row strong,
.settings-role-row em {
  display: block;
}

.settings-role-row i {
  border-radius: 999px;
  background: rgba(22, 163, 74, .1);
  color: #15803d;
  font-size: 12px;
  font-style: normal;
  padding: 2px 7px;
  white-space: nowrap;
}

.settings-role-row i.off {
  background: #eef1f6;
  color: var(--aw-fg-3);
}

.settings-list-stack,
.settings-data-grid {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.settings-menu-row,
.settings-field-row,
.settings-action-card {
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
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.settings-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.settings-segmented {
  display: inline-flex;
  gap: 4px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 3px;
}

.settings-segmented button {
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  padding: 6px 10px;
}

.settings-segmented button.on {
  background: #fff;
  color: var(--aw-primary);
  font-weight: 700;
}

.settings-data-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.settings-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.settings-modal-grid section,
.settings-modal-stack {
  display: grid;
  gap: 8px;
}

.settings-modal-tip {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 10px 12px;
}

.settings-empty {
  border: 1px dashed var(--aw-border);
  border-radius: 8px;
  color: var(--aw-fg-3);
  padding: 18px;
  text-align: center;
}

.aw-tool-btn.danger {
  color: var(--aw-danger);
}

@media (max-width: 980px) {
  .settings-split-layout,
  .settings-split-layout.wide,
  .settings-role-layout,
  .settings-authorize-board,
  .settings-action-grid,
  .settings-data-grid,
  .settings-modal-grid {
    grid-template-columns: 1fr;
  }

  .settings-inline-search {
    min-width: 0;
    width: 100%;
  }
}
</style>
