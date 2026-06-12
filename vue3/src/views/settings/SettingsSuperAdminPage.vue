<template>
  <aw-setting-page>
    <aw-list-page>
      <aw-list-toolbar
        create-label="新增超级管理员"
        search-placeholder="搜索账号、姓名"
        @create="openModal"
        @refresh="query"
        @search="keyword = $event"
      />

      <aw-data-table
        :columns="columns"
        :rows="rows"
        :total="rows.length"
        fit-width
        row-key="id"
        :bulk-actions="[{ key: 'export', label: '批量导出' }]"
      >
        <template #cell="{ column, record }">
          <template v-if="column.key === 'action'">
            <span class="aw-link" @click="openModal(record)">更换账号</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" style="color:var(--aw-danger)" @click="removeSuperAdmin(record)">删除</span>
          </template>
          <template v-else>{{ record[column.key] }}</template>
        </template>
      </aw-data-table>
    </aw-list-page>

    <aw-setting-modal :open="modal.open" title="新增超级管理员" width="520px" @cancel="modal.open = false" @confirm="confirm">
      <div class="settings-modal-stack">
        <p class="settings-modal-tip">请选择一个账号加入超级管理员名单。已有超级管理员不会重复添加。</p>
        <label class="aw-field">
          <span>账号</span>
          <select v-model="modal.accountId">
            <option value="">请选择账号</option>
            <option v-for="account in accountOptions" :key="account.accountId" :value="account.accountId">
              {{ account.fullName }} / {{ account.userName }} / {{ account.departmentName }}
            </option>
          </select>
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
import type { AccountTreeNode, SettingsCenterData, SuperAdminRow } from '@/app/api/settings/types';
import type { AwTableColumn } from '@/components/list-page/types';

const keyword = ref('');
const toastText = ref('');
const data = reactive<SettingsCenterData>({
  system: { company: { company: '', shortName: '', unifiedCode: '', industry: '', contact: '', phone: '', email: '', address: '', logoText: '' }, notifications: [] },
  permissions: { roles: [], functionPermissions: [], dataPermissions: [], accountTree: [], permissionTree: [], accountPermissions: [], superAdmins: [] },
  security: { rules: [] },
  data: { auditLogs: [], tasks: [] },
  integrations: { partners: [], apiKeys: [], syncTasks: [] },
  guide: { modules: [] },
});
const modal = reactive({ open: false, replaceId: '', accountId: '' });

const columns: AwTableColumn[] = [
  { key: 'userName', title: '账号', link: true, width: 180 },
  { key: 'name', title: '姓名', width: 140 },
  { key: 'deptAndPost', title: '来源信息', width: 220 },
  { key: 'action', title: '操作', fixed: 'right', width: 150 },
];
const accountOptions = computed(() => flattenAccounts(data.permissions.accountTree).filter((item) => item.accountId));
const rows = computed(() => {
  const kw = keyword.value.trim();
  const list = kw
    ? data.permissions.superAdmins.filter((row) => [row.userName, row.name, row.deptAndPost].join(' ').includes(kw))
    : data.permissions.superAdmins;
  return list as unknown as Record<string, unknown>[];
});

onMounted(async () => {
  Object.assign(data, await getSettingsCenterData());
});

function flattenAccounts(nodes: AccountTreeNode[]): AccountTreeNode[] {
  return nodes.flatMap((node) => (node.type === 'account' ? [node] : flattenAccounts(node.children || [])));
}

function openModal(row?: Record<string, unknown>) {
  modal.open = true;
  modal.replaceId = String(row?.id || '');
  modal.accountId = String(row?.accountId || '');
}

function confirm() {
  const account = accountOptions.value.find((item) => item.accountId === modal.accountId);
  if (!account?.accountId) {
    toast('请选择账号');
    return;
  }
  const row: SuperAdminRow = {
    id: modal.replaceId || `sa-${account.accountId}`,
    accountId: account.accountId,
    userName: account.userName || '',
    name: account.fullName || account.label,
    deptAndPost: `${account.departmentName || '-'} / ${account.postName || '-'}`,
  };
  data.permissions.superAdmins = data.permissions.superAdmins.filter((item) => item.id !== modal.replaceId && item.accountId !== account.accountId);
  data.permissions.superAdmins.push(row);
  modal.open = false;
  saveAll('超级管理员已保存');
}

function removeSuperAdmin(row: Record<string, unknown>) {
  if (!window.confirm('确认删除该超级管理员吗？')) return;
  data.permissions.superAdmins = data.permissions.superAdmins.filter((item) => item.id !== row.id);
  saveAll('超级管理员已删除');
}

function query() {
  toast(`查询完成，共 ${rows.value.length} 条超级管理员`);
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
.settings-modal-tip {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.7;
  margin: 0;
}

.settings-modal-stack {
  display: grid;
  gap: 14px;
}

.settings-modal-tip {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: var(--aw-bg);
  padding: 10px 12px;
}
</style>
