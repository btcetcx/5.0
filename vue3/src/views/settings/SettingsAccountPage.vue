<template>
  <aw-setting-page>
    <aw-list-page>
      <aw-list-toolbar
        create-label="新增账号"
        search-placeholder="搜索账号、姓名、手机号"
        @create="openAccount()"
        @refresh="toast('用户账号已刷新')"
        @search="keyword = $event"
      />

      <aw-data-table
        :columns="accountColumns"
        :rows="accountTableRows"
        :total="accountTableRows.length"
        fit-width
        row-key="id"
        :bulk-actions="[{ key: 'export', label: '批量导出' }]"
      >
        <template #cell="{ column, record }">
          <template v-if="column.key === 'enabled'">{{ record.enabled === false ? '停用' : '启用' }}</template>
          <template v-else-if="column.key === 'action'">
            <span class="aw-link" @click="openAccount(record as unknown as AccountRow)">编辑</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" @click="toggleAccountStatus(record as unknown as AccountRow)">
              {{ record.enabled === false ? '启用' : '停用' }}
            </span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" @click="resetPassword(record)">重置密码</span>
            <span class="aw-action-split">|</span>
            <span class="aw-link" style="color:var(--aw-danger)" @click="removeAccount(record)">删除</span>
          </template>
          <template v-else>{{ record[column.key] }}</template>
        </template>
      </aw-data-table>
    </aw-list-page>

    <aw-setting-modal :open="accountModal.open" title="账号资料" width="520px" @cancel="accountModal.open = false" @confirm="confirmAccount">
      <div class="settings-form-grid">
        <label class="aw-field">
          <span>账号</span>
          <input v-model="accountModal.form.userName" />
        </label>
        <label class="aw-field">
          <span>姓名</span>
          <input v-model="accountModal.form.fullName" />
        </label>
        <label class="aw-field">
          <span>手机号</span>
          <input v-model="accountModal.form.mobile" />
        </label>
        <label class="aw-field">
          <span>状态</span>
          <select v-model="accountModal.form.enabled">
            <option :value="true">启用</option>
            <option :value="false">停用</option>
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
import type { AccountTreeNode, SettingsCenterData } from '@/app/api/settings/types';
import type { AwTableColumn } from '@/components/list-page/types';

type AccountRow = AccountTreeNode & { enabled?: boolean };

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
const accountModal = reactive({
  open: false,
  id: '',
  form: { userName: '', fullName: '', mobile: '', enabled: true },
});

const accountColumns: AwTableColumn[] = [
  { key: 'userName', title: '账号', link: true, width: 180 },
  { key: 'fullName', title: '姓名', width: 140 },
  { key: 'mobile', title: '手机号', width: 160 },
  { key: 'enabled', title: '状态', width: 100 },
  { key: 'action', title: '操作', fixed: 'right', width: 240 },
];

const accountRows = computed(() => flattenAccounts(data.permissions.accountTree));
const filteredAccounts = computed(() => {
  const kw = keyword.value.trim();
  if (!kw) return accountRows.value;
  return accountRows.value.filter((row) => [row.userName, row.fullName, row.mobile].join(' ').includes(kw));
});
const accountTableRows = computed(() => filteredAccounts.value as unknown as Record<string, unknown>[]);

onMounted(async () => {
  Object.assign(data, await getSettingsCenterData());
});

function flattenAccounts(nodes: AccountTreeNode[]): AccountRow[] {
  return nodes.flatMap((node) => (node.type === 'account' ? [node as AccountRow] : flattenAccounts(node.children || [])));
}

function openAccount(row?: AccountRow) {
  accountModal.open = true;
  accountModal.id = row?.id || '';
  accountModal.form = {
    userName: row?.userName || '',
    fullName: row?.fullName || '',
    mobile: row?.mobile || '',
    enabled: row?.enabled !== false,
  };
}

function confirmAccount() {
  const row = accountModal.id ? accountRows.value.find((item) => item.id === accountModal.id) : undefined;
  if (row) {
    Object.assign(row, {
      ...accountModal.form,
      label: accountModal.form.fullName || accountModal.form.userName,
    });
  } else {
    const accountId = `account-${Date.now()}`;
    data.permissions.accountTree.push({
      id: accountId,
      key: accountId,
      accountId,
      label: accountModal.form.fullName || accountModal.form.userName,
      type: 'account',
      ...accountModal.form,
    } as AccountRow);
  }
  accountModal.open = false;
  saveAll('账号资料已保存');
}

function toggleAccountStatus(row: AccountRow) {
  row.enabled = row.enabled === false;
  saveAll(row.enabled ? '账号已启用' : '账号已停用');
}

function resetPassword(row: Record<string, unknown>) {
  toast(`${row.userName || '账号'} 的密码已重置`);
}

function removeAccount(row: Record<string, unknown>) {
  if (!window.confirm('确认删除该账号吗？')) return;
  removeNode(data.permissions.accountTree, String(row.id));
  data.permissions.accountPermissions = data.permissions.accountPermissions.filter((item) => item.accountId !== row.accountId);
  saveAll('账号已删除');
}

function removeNode(nodes: AccountTreeNode[], id: string): boolean {
  const index = nodes.findIndex((item) => item.id === id);
  if (index >= 0) {
    nodes.splice(index, 1);
    return true;
  }
  return nodes.some((node) => removeNode(node.children || [], id));
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
