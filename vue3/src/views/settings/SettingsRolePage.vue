<template>
  <aw-setting-page>
    <aw-list-page>
      <aw-list-toolbar
        create-label="新增角色"
        search-placeholder="搜索角色、适用中心、权限模板"
        @create="openRole()"
        @refresh="toast('角色管理已刷新')"
        @search="keyword = $event"
      />

      <aw-data-table
        :columns="roleColumns"
        :rows="roleRows"
        :total="roleRows.length"
        row-key="id"
        :bulk-actions="[{ key: 'export', label: '批量导出' }]"
      >
        <template #cell="{ column, record }">
          <template v-if="column.key === 'enabled'">{{ record.enabled ? '启用' : '停用' }}</template>
          <template v-else-if="column.key === 'action'">
            <span class="aw-link" @click="openRole(record as unknown as RoleRow)">编辑</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" @click="copyRole(record as unknown as RoleRow)">复制</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" @click="toggleRole(record as unknown as RoleRow)">{{ record.enabled ? '停用' : '启用' }}</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" @click="router.push('/settings/permissions')">去授权</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" style="color:var(--aw-danger)" @click="removeRole(record)">删除</span>
          </template>
          <template v-else>{{ record[column.key] }}</template>
        </template>
      </aw-data-table>
    </aw-list-page>

    <aw-setting-modal :open="roleModal.open" title="角色资料" width="640px" @cancel="roleModal.open = false" @confirm="confirmRole">
      <div class="settings-form-grid">
        <label class="aw-field">
          <span>角色名称</span>
          <input v-model="roleModal.form.name" />
        </label>
        <label class="aw-field">
          <span>适用中心</span>
          <input v-model="roleModal.form.center" />
        </label>
        <label class="aw-field">
          <span>成员数</span>
          <input v-model.number="roleModal.form.users" type="number" />
        </label>
        <label class="aw-field">
          <span>菜单范围</span>
          <input v-model="roleModal.form.menu" />
        </label>
        <label class="aw-field">
          <span>功能权限模板</span>
          <input v-model="roleModal.form.functionPolicy" />
        </label>
        <label class="aw-field">
          <span>数据权限模板</span>
          <input v-model="roleModal.form.dataPolicy" />
        </label>
      </div>
    </aw-setting-modal>

    <div v-if="toastText" class="aw-toast">{{ toastText }}</div>
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import { getSettingsCenterData, saveSettingsCenterData } from '@/app/api/settings/resources';
import type { RoleRow, SettingsCenterData } from '@/app/api/settings/types';
import type { AwTableColumn } from '@/components/list-page/types';

const router = useRouter();
const keyword = ref('');
const toastText = ref('');
const data = reactive<SettingsCenterData>({
  system: { company: { company: '', shortName: '', unifiedCode: '', industry: '', contact: '', phone: '', email: '', address: '', logoText: '' }, notifications: [], units: [], currencies: [] },
  permissions: { resources: [], roles: [], functionPermissions: [], rolePermissions: [], dataPermissions: [], accountTree: [], permissionTree: [], accountPermissions: [], superAdmins: [], positions: [], members: [] },
  security: { rules: [] },
  data: { auditLogs: [], tasks: [] },
  integrations: { partners: [], apiKeys: [], syncTasks: [] },
  guide: { modules: [] },
});
const roleModal = reactive({
  open: false,
  id: '',
  form: { name: '', center: '', users: 0, menu: '', functionPolicy: '', dataPolicy: '' },
});

const roleColumns: AwTableColumn[] = [
  { key: 'name', title: '角色名称', link: true, width: 150 },
  { key: 'center', title: '适用中心', width: 120 },
  { key: 'users', title: '成员数', width: 100 },
  { key: 'menu', title: '菜单范围', width: 180 },
  { key: 'functionPolicy', title: '功能权限模板', width: 180 },
  { key: 'dataPolicy', title: '数据权限模板', width: 180 },
  { key: 'updated', title: '更新日期', width: 130 },
  { key: 'enabled', title: '状态', width: 100 },
  { key: 'action', title: '操作', fixed: 'right', width: 280 },
];

const filteredRoles = computed(() => {
  const kw = keyword.value.trim();
  if (!kw) return data.permissions.roles;
  return data.permissions.roles.filter((row) => Object.values(row).join(' ').includes(kw));
});
const roleRows = computed(() => filteredRoles.value as unknown as Record<string, unknown>[]);

onMounted(async () => {
  Object.assign(data, await getSettingsCenterData());
});

function openRole(row?: RoleRow) {
  roleModal.open = true;
  roleModal.id = row?.id || '';
  roleModal.form = {
    name: row?.name || '',
    center: row?.center || '研发中心',
    users: Number(row?.users || 0),
    menu: row?.menu || '',
    functionPolicy: row?.functionPolicy || '',
    dataPolicy: row?.dataPolicy || '',
  };
}

function confirmRole() {
  const id = roleModal.id || `role-${Date.now()}`;
  const row: RoleRow = {
    id,
    data: roleModal.form.dataPolicy,
    updated: new Date().toISOString().slice(0, 10),
    enabled: true,
    ...roleModal.form,
  };
  const index = data.permissions.roles.findIndex((item) => item.id === id);
  if (index >= 0) data.permissions.roles.splice(index, 1, { ...data.permissions.roles[index], ...row });
  else data.permissions.roles.push(row);
  roleModal.open = false;
  saveAll('角色资料已保存');
}

function copyRole(row: RoleRow) {
  data.permissions.roles.push({
    ...row,
    id: `role-${Date.now()}`,
    name: `${row.name} 副本`,
    users: 0,
    updated: new Date().toISOString().slice(0, 10),
    enabled: false,
  });
  saveAll('角色已复制');
}

function toggleRole(row: RoleRow) {
  row.enabled = !row.enabled;
  row.updated = new Date().toISOString().slice(0, 10);
  saveAll(row.enabled ? '角色已启用' : '角色已停用');
}

function removeRole(row: Record<string, unknown>) {
  if (!window.confirm('确认删除该角色吗？')) return;
  data.permissions.roles = data.permissions.roles.filter((item) => item.id !== row.id);
  saveAll('角色已删除');
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
.settings-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 860px) {
  .settings-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
