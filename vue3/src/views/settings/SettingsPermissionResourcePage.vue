<template>
  <aw-setting-page>
    <aw-list-page>
      <aw-list-toolbar
        :create-label="addText"
        search-placeholder="搜索菜单、按钮、字段、数据规则"
        @create="handleAdd"
        @refresh="toast('权限资源已刷新')"
        @search="keyword = $event"
      />

      <div class="aw-tabs settings-resource-tabs">
        <button v-for="tab in tabs" :key="tab.key" :class="['t', { on: activeTab === tab.key }]" type="button" @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </div>

      <aw-data-table
        :columns="activeColumns"
        :rows="activeRows"
        :total="activeRows.length"
        row-key="id"
        :bulk-actions="[{ key: 'export', label: '批量导出' }]"
      >
        <template #cell="{ column, record }">
          <template v-if="column.key === 'enabled'">{{ record.enabled ? '生效' : '停用' }}</template>
          <template v-else-if="column.key === 'fieldsView'">{{ Array.isArray(record.fieldsView) ? record.fieldsView.length : 0 }} 项可见</template>
          <template v-else-if="column.key === 'fieldsEdit'">{{ Array.isArray(record.fieldsEdit) ? record.fieldsEdit.length : 0 }} 项可编辑</template>
          <template v-else-if="column.key === 'action'">
            <span class="aw-link" @click="openEditor(record)">编辑</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" style="color:var(--aw-danger)" @click="removeResource(record)">删除</span>
          </template>
          <template v-else>{{ record[column.key] }}</template>
        </template>
      </aw-data-table>
    </aw-list-page>

    <aw-setting-modal :open="modal.open" :title="modal.title" width="680px" @cancel="modal.open = false" @confirm="confirmModal">
      <div class="settings-form-grid">
        <label v-for="field in modalFields" :key="field.key" class="aw-field">
          <span>{{ field.label }}</span>
          <select v-if="field.options" v-model="modal.form[field.key]">
            <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <textarea v-else-if="field.type === 'textarea'" v-model="modal.form[field.key]" />
          <input v-else v-model="modal.form[field.key]" />
        </label>
      </div>
    </aw-setting-modal>

    <div v-if="toastText" class="aw-toast">{{ toastText }}</div>
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import { getSettingsCenterData, saveSettingsCenterData } from '@/app/api/settings/resources';
import type { DataPermissionRow, PermissionScopeRow, PermissionTreeNode, SettingsCenterData } from '@/app/api/settings/types';
import type { AwTableColumn } from '@/components/list-page/types';

type TabKey = 'menus' | 'buttons' | 'fields' | 'data';
type ModalTarget = 'menu' | 'button' | 'field' | 'data';
type ModalOption = { label: string; value: string };
type ModalField = { key: string; label: string; type?: 'textarea'; options?: ModalOption[] };
type FlatPermission = {
  id: string;
  node: PermissionTreeNode;
  parent?: PermissionTreeNode;
  platform?: PermissionTreeNode;
  level: number;
  menuPath: string[];
};
type ResourceRow = Record<string, unknown> & {
  id: string;
  resourceType: ModalTarget;
  nodeKey?: string;
  parentKey?: string;
};

const keyword = ref('');
const toastText = ref('');
const activeTab = ref<TabKey>('menus');
const data = reactive<SettingsCenterData>({
  system: { company: { company: '', shortName: '', unifiedCode: '', industry: '', contact: '', phone: '', email: '', address: '', logoText: '' }, notifications: [] },
  permissions: { roles: [], functionPermissions: [], dataPermissions: [], accountTree: [], permissionTree: [], accountPermissions: [], superAdmins: [] },
  security: { rules: [] },
  data: { auditLogs: [], tasks: [] },
  integrations: { partners: [], apiKeys: [], syncTasks: [] },
  guide: { modules: [] },
});
const modal = reactive({ open: false, title: '', target: '' as ModalTarget | '', id: '', nodeKey: '', form: {} as Record<string, string> });
const modalFields = ref<ModalField[]>([]);

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'menus', label: '菜单管理' },
  { key: 'buttons', label: '按钮操作' },
  { key: 'fields', label: '字段权限项' },
  { key: 'data', label: '数据权限规则' },
];
const menuColumns: AwTableColumn[] = [
  { key: 'parentMenu', title: '上级菜单', width: 220 },
  { key: 'menuName', title: '菜单名称', link: true, width: 180 },
  { key: 'menuId', title: '菜单标识', width: 180 },
  { key: 'menuType', title: '类型', width: 120 },
  { key: 'action', title: '操作', fixed: 'right', width: 130 },
];
const buttonColumns: AwTableColumn[] = [
  { key: 'menuPathText', title: '功能菜单', width: 300 },
  { key: 'buttonName', title: '操作按钮', link: true, width: 150 },
  { key: 'buttonSign', title: '按钮标识', width: 180 },
  { key: 'action', title: '操作', fixed: 'right', width: 130 },
];
const fieldColumns: AwTableColumn[] = [
  { key: 'role', title: '适用角色', width: 150 },
  { key: 'module', title: '模块', width: 130 },
  { key: 'menu', title: '菜单', width: 150 },
  { key: 'page', title: '页面', width: 150 },
  { key: 'fieldsView', title: '字段可见', width: 120 },
  { key: 'fieldsEdit', title: '字段可编辑', width: 120 },
  { key: 'action', title: '操作', fixed: 'right', width: 130 },
];
const dataColumns: AwTableColumn[] = [
  { key: 'name', title: '规则名称', link: true, width: 170 },
  { key: 'role', title: '适用角色', width: 140 },
  { key: 'center', title: '适用中心', width: 130 },
  { key: 'department', title: '部门范围', width: 150 },
  { key: 'projectScope', title: '项目范围', width: 170 },
  { key: 'bomScope', title: 'BOM 范围', width: 170 },
  { key: 'enabled', title: '状态', width: 90 },
  { key: 'action', title: '操作', fixed: 'right', width: 130 },
];

const addText = computed(() => {
  if (activeTab.value === 'menus') return '新增菜单';
  if (activeTab.value === 'buttons') return '新增按钮';
  if (activeTab.value === 'fields') return '新增字段权限项';
  return '新增数据规则';
});
const flatPermissions = computed(() => flattenPermissions(data.permissions.permissionTree));
const menuRows = computed(() => flatPermissions.value.filter((item) => item.node.type === 'menu').map(toMenuRow).filter(matchRow));
const buttonRows = computed(() => flatPermissions.value.filter((item) => item.node.type === 'button').map(toButtonRow).filter(matchRow));
const fieldRows = computed(() => filterRows(data.permissions.functionPermissions).map((row) => ({ ...row, id: row.id, resourceType: 'field' as const })));
const dataRows = computed(() => filterRows(data.permissions.dataPermissions).map((row) => ({ ...row, id: row.id, resourceType: 'data' as const })));
const activeColumns = computed(() => {
  if (activeTab.value === 'menus') return menuColumns;
  if (activeTab.value === 'buttons') return buttonColumns;
  if (activeTab.value === 'fields') return fieldColumns;
  return dataColumns;
});
const activeRows = computed<ResourceRow[]>(() => {
  if (activeTab.value === 'menus') return menuRows.value;
  if (activeTab.value === 'buttons') return buttonRows.value;
  if (activeTab.value === 'fields') return fieldRows.value as ResourceRow[];
  return dataRows.value as ResourceRow[];
});
const roleOptions = computed(() => data.permissions.roles.map((item) => ({ label: item.name, value: item.name })));
const menuParentOptions = computed<ModalOption[]>(() => [
  ...data.permissions.permissionTree.map((node) => ({ label: node.label, value: node.key })),
  ...flatPermissions.value
    .filter((item) => item.node.type === 'menu')
    .map((item) => ({
      label: fullMenuPath(item),
      value: item.node.key,
    })),
]);
const buttonParentOptions = computed<ModalOption[]>(() =>
  flatPermissions.value
    .filter((item) => item.node.type === 'menu')
    .map((item) => ({
      label: fullMenuPath(item),
      value: item.node.key,
    })),
);

onMounted(async () => {
  Object.assign(data, await getSettingsCenterData());
});

function flattenPermissions(nodes: PermissionTreeNode[], level = 0, parent?: PermissionTreeNode, platform?: PermissionTreeNode, menuPath: string[] = []): FlatPermission[] {
  return nodes.flatMap((node) => {
    const nextPlatform = node.type === 'platform' ? node : platform;
    const nextMenuPath = node.type === 'menu' ? [...menuPath, node.label] : menuPath;
    return [
      { id: node.id, node, parent, platform: nextPlatform, level, menuPath: nextMenuPath },
      ...flattenPermissions(node.children || [], level + 1, node, nextPlatform, nextMenuPath),
    ];
  });
}

function toMenuRow(item: FlatPermission): ResourceRow {
  const hasButtons = Boolean(item.node.children?.some((child) => child.type === 'button'));
  const parentPath = item.menuPath.slice(0, -1);
  return {
    id: item.node.id,
    nodeKey: item.node.key,
    parentKey: item.parent?.key,
    resourceType: 'menu',
    parentMenu: parentPath.length ? parentPath.join(' / ') : item.platform?.label || '根菜单',
    menuName: item.node.label,
    menuId: item.node.menuId || item.node.key,
    menuType: hasButtons ? '功能页面' : '菜单目录',
  };
}

function toButtonRow(item: FlatPermission): ResourceRow {
  return {
    id: item.node.id,
    nodeKey: item.node.key,
    parentKey: item.parent?.key,
    resourceType: 'button',
    menuPathText: fullMenuPath(item),
    buttonName: item.node.label,
    buttonSign: item.node.buttonSign || item.node.key,
  };
}

function fullMenuPath(item: FlatPermission) {
  return [item.platform?.label, ...item.menuPath].filter(Boolean).join(' / ');
}

function matchRow(row: ResourceRow) {
  const kw = keyword.value.trim();
  if (!kw) return true;
  return Object.values(row).join(' ').includes(kw);
}

function filterRows<T extends Record<string, unknown>>(rows: T[]) {
  const kw = keyword.value.trim();
  if (!kw) return rows;
  return rows.filter((row) => Object.values(row).join(' ').includes(kw));
}

function handleAdd() {
  if (activeTab.value === 'menus') openMenu();
  else if (activeTab.value === 'buttons') openButton();
  else if (activeTab.value === 'fields') openFunctionPermission();
  else openDataPermission();
}

function openEditor(record: Record<string, unknown>) {
  const row = record as ResourceRow;
  if (row.resourceType === 'menu') openMenu(row);
  if (row.resourceType === 'button') openButton(row);
  if (row.resourceType === 'field') openFunctionPermission(row);
  if (row.resourceType === 'data') openDataPermission(row);
}

function openMenu(row?: ResourceRow) {
  modal.open = true;
  modal.title = row ? '编辑菜单' : '新增菜单';
  modal.target = 'menu';
  modal.id = String(row?.id || '');
  modal.nodeKey = String(row?.nodeKey || '');
  modalFields.value = [
    { key: 'parentKey', label: '上级菜单', options: menuParentOptions.value },
    { key: 'label', label: '菜单名称' },
    { key: 'menuId', label: '菜单标识' },
  ];
  modal.form = {
    parentKey: String(row?.parentKey || data.permissions.permissionTree[0]?.key || ''),
    label: String(row?.menuName || ''),
    menuId: String(row?.menuId || ''),
  };
}

function openButton(row?: ResourceRow) {
  modal.open = true;
  modal.title = row ? '编辑按钮操作' : '新增按钮操作';
  modal.target = 'button';
  modal.id = String(row?.id || '');
  modal.nodeKey = String(row?.nodeKey || '');
  modalFields.value = [
    { key: 'parentKey', label: '所属功能菜单', options: buttonParentOptions.value },
    { key: 'label', label: '操作按钮' },
    { key: 'buttonSign', label: '按钮标识' },
  ];
  modal.form = {
    parentKey: String(row?.parentKey || buttonParentOptions.value[0]?.value || ''),
    label: String(row?.buttonName || ''),
    buttonSign: String(row?.buttonSign || ''),
  };
}

function openFunctionPermission(row?: ResourceRow | PermissionScopeRow) {
  modal.open = true;
  modal.title = row ? '编辑字段权限项' : '新增字段权限项';
  modal.target = 'field';
  modal.id = String(row?.id || '');
  modal.nodeKey = '';
  modalFields.value = [
    { key: 'role', label: '适用角色', options: roleOptions.value },
    { key: 'module', label: '模块' },
    { key: 'menu', label: '菜单' },
    { key: 'page', label: '页面' },
    { key: 'fieldsView', label: '可见字段', type: 'textarea' },
    { key: 'fieldsEdit', label: '可编辑字段', type: 'textarea' },
  ];
  modal.form = {
    role: String(row?.role || data.permissions.roles[0]?.name || ''),
    module: String(row?.module || '研发中心'),
    menu: String(row?.menu || ''),
    page: String(row?.page || ''),
    fieldsView: Array.isArray(row?.fieldsView) ? row.fieldsView.join('、') : '',
    fieldsEdit: Array.isArray(row?.fieldsEdit) ? row.fieldsEdit.join('、') : '',
  };
}

function openDataPermission(row?: ResourceRow | DataPermissionRow) {
  modal.open = true;
  modal.title = row ? '编辑数据权限规则' : '新增数据权限规则';
  modal.target = 'data';
  modal.id = String(row?.id || '');
  modal.nodeKey = '';
  modalFields.value = [
    { key: 'name', label: '规则名称' },
    { key: 'role', label: '适用角色', options: roleOptions.value },
    { key: 'center', label: '适用中心' },
    { key: 'department', label: '部门范围' },
    { key: 'projectScope', label: '项目范围' },
    { key: 'documentScope', label: '文档范围' },
    { key: 'materialScope', label: '产品 / 物料范围' },
    { key: 'bomScope', label: 'BOM 范围' },
    { key: 'enabled', label: '状态', options: [{ label: '生效', value: 'true' }, { label: '停用', value: 'false' }] },
  ];
  modal.form = {
    name: String(row?.name || ''),
    role: String(row?.role || data.permissions.roles[0]?.name || ''),
    center: String(row?.center || '研发中心'),
    department: String(row?.department || ''),
    projectScope: String(row?.projectScope || ''),
    documentScope: String(row?.documentScope || ''),
    materialScope: String(row?.materialScope || ''),
    bomScope: String(row?.bomScope || ''),
    enabled: String(row?.enabled ?? true),
  };
}

function confirmModal() {
  if (modal.target === 'menu') confirmMenu();
  if (modal.target === 'button') confirmButton();
  if (modal.target === 'field') confirmField();
  if (modal.target === 'data') confirmData();
  modal.open = false;
  saveAll('权限资源已保存');
}

function confirmMenu() {
  const node = modal.nodeKey ? findPermissionNode(data.permissions.permissionTree, modal.nodeKey) : undefined;
  const nextNode: PermissionTreeNode = node || {
    id: `menu-${Date.now()}`,
    key: `menu-${Date.now()}`,
    label: '',
    type: 'menu',
    children: [],
  };
  nextNode.label = String(modal.form.label || '未命名菜单');
  nextNode.menuId = String(modal.form.menuId || nextNode.key);
  movePermissionNode(nextNode, String(modal.form.parentKey || data.permissions.permissionTree[0]?.key || ''));
}

function confirmButton() {
  const node = modal.nodeKey ? findPermissionNode(data.permissions.permissionTree, modal.nodeKey) : undefined;
  const nextNode: PermissionTreeNode = node || {
    id: `button-${Date.now()}`,
    key: `button-${Date.now()}`,
    label: '',
    type: 'button',
  };
  nextNode.label = String(modal.form.label || '未命名按钮');
  nextNode.buttonSign = String(modal.form.buttonSign || nextNode.key);
  movePermissionNode(nextNode, String(modal.form.parentKey || buttonParentOptions.value[0]?.value || ''));
}

function confirmField() {
  const row: PermissionScopeRow = {
    id: modal.id || `field-${Date.now()}`,
    role: String(modal.form.role || ''),
    module: String(modal.form.module || ''),
    menu: String(modal.form.menu || ''),
    page: String(modal.form.page || ''),
    tabs: [],
    fieldsView: splitText(String(modal.form.fieldsView || '')),
    fieldsEdit: splitText(String(modal.form.fieldsEdit || '')),
    view: true,
    create: false,
    edit: false,
    delete: false,
    import: false,
    export: false,
    approve: false,
  };
  upsert(data.permissions.functionPermissions, row);
}

function confirmData() {
  const row: DataPermissionRow = {
    id: modal.id || `data-${Date.now()}`,
    name: String(modal.form.name || ''),
    role: String(modal.form.role || ''),
    center: String(modal.form.center || ''),
    department: String(modal.form.department || ''),
    projectScope: String(modal.form.projectScope || ''),
    documentScope: String(modal.form.documentScope || ''),
    materialScope: String(modal.form.materialScope || ''),
    bomScope: String(modal.form.bomScope || ''),
    enabled: modal.form.enabled !== 'false',
    region: '全部区域',
    customerScope: '全部客户',
  };
  upsert(data.permissions.dataPermissions, row);
}

function movePermissionNode(node: PermissionTreeNode, parentKey: string) {
  if (modal.nodeKey) removePermissionNode(data.permissions.permissionTree, modal.nodeKey);
  const parent = findPermissionNode(data.permissions.permissionTree, parentKey);
  if (!parent) {
    data.permissions.permissionTree.push(node);
    return;
  }
  parent.children ||= [];
  parent.children.push(node);
}

function findPermissionNode(nodes: PermissionTreeNode[], key: string): PermissionTreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    const child = findPermissionNode(node.children || [], key);
    if (child) return child;
  }
  return undefined;
}

function removePermissionNode(nodes: PermissionTreeNode[], key: string): PermissionTreeNode | undefined {
  const index = nodes.findIndex((node) => node.key === key);
  if (index >= 0) return nodes.splice(index, 1)[0];
  for (const node of nodes) {
    const removed = removePermissionNode(node.children || [], key);
    if (removed) return removed;
  }
  return undefined;
}

function removeResource(record: Record<string, unknown>) {
  const row = record as ResourceRow;
  if (row.resourceType === 'menu') {
    if (!window.confirm('确认删除该菜单及其下级资源吗？')) return;
    removePermissionNode(data.permissions.permissionTree, String(row.nodeKey));
    saveAll('菜单已删除');
  }
  if (row.resourceType === 'button') {
    if (!window.confirm('确认删除该按钮操作吗？')) return;
    removePermissionNode(data.permissions.permissionTree, String(row.nodeKey));
    saveAll('按钮操作已删除');
  }
  if (row.resourceType === 'field') {
    if (!window.confirm('确认删除该字段权限项吗？')) return;
    data.permissions.functionPermissions = data.permissions.functionPermissions.filter((item) => item.id !== row.id);
    saveAll('字段权限项已删除');
  }
  if (row.resourceType === 'data') {
    if (!window.confirm('确认删除该数据权限规则吗？')) return;
    data.permissions.dataPermissions = data.permissions.dataPermissions.filter((item) => item.id !== row.id);
    saveAll('数据权限规则已删除');
  }
}

function splitText(value: string) {
  return value.split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
}

function upsert<T extends { id: string }>(rows: T[], row: T) {
  const index = rows.findIndex((item) => item.id === row.id);
  if (index >= 0) rows.splice(index, 1, row);
  else rows.push(row);
}

async function saveAll(message: string) {
  await saveSettingsCenterData(data);
  toast(message);
}

function toast(message: string) {
  toastText.value = message;
  window.setTimeout(() => {
    toastText.value = '';
  }, 1800);
}
</script>

<style scoped>
.settings-resource-tabs {
  margin: 0 0 12px;
}

.settings-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 960px) {
  .settings-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
