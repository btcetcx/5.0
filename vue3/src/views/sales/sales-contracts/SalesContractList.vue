<template>
  <sales-contract-create v-if="route.query.action === 'new'" />
  <sales-contract-setting-page v-else-if="route.query.setting" />
  <sales-contract-detail v-else-if="route.query.contractId || route.query.id" />
  <aw-list-page v-else>
    <aw-list-toolbar
      :search-placeholder="salesContractListConfig.toolbar.searchPlaceholder"
      :create-label="salesContractListConfig.toolbar.createLabel"
      :actions="salesContractListConfig.toolbar.actions"
      @search="handleSearch"
      @refresh="handleRefresh"
      @filter="openFilterModal"
      @columns="openColumnsModal"
      @import="handleImport"
      @export="handleExport"
      @create="openCreate"
    />

    <div v-if="toolbarMessage" class="aw-form-note sales-list-feedback">{{ toolbarMessage }}</div>

    <aw-data-table
      :columns="visibleColumns"
      :rows="tableRows"
      :row-key="salesContractListConfig.table.rowKey"
      :total="filteredItems.length"
      :bulk-actions="salesContractListConfig.table.bulkActions"
      :filter-values="columnFilters"
      @selection-change="handleSelectionChange"
      @batch-action="handleBatchAction"
      @column-filter="handleColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'topic'" class="aw-link" @click="openContract(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'executionStatusName'" :class="['aw-status', statusTone(record.executionStatus)]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openContract(record.id as string)">查看</span>
        <span v-else>{{ formatCellValue(value, column.numeric) }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>

  <aw-setting-modal :open="filterModalOpen" title="合同管理筛选" width="520px" @cancel="filterModalOpen = false" @confirm="applyFilterModal">
    <div class="aw-form-grid">
      <div class="aw-field">
        <label>履约状态</label>
        <select v-model="draftExecutionStatus" class="aw-select">
          <option value="">全部</option>
          <option v-for="option in executionStatusOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="columnsModalOpen" title="合同字段配置" width="560px" @cancel="columnsModalOpen = false" @confirm="applyColumnsModal">
    <div class="aw-column-checks">
      <label v-for="column in salesContractListConfig.table.columns" :key="column.key" class="aw-check-row">
        <input type="checkbox" :checked="visibleColumnKeys.includes(column.key)" :disabled="column.key === 'action'" @change="toggleColumn(column.key)" />
        <span>{{ column.title }}</span>
      </label>
    </div>
  </aw-setting-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ListQuery } from '@/app/api/shared/types';
import { listSalesContracts } from '@/app/api/sales/resources';
import type { SalesContract } from '@/app/api/sales/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import SalesContractCreate from './SalesContractCreate.vue';
import SalesContractDetail from './SalesContractDetail.vue';
import SalesContractSettingPage from './SalesContractSettingPage.vue';
import { salesContractListConfig } from './salesContractList.config';

const router = useRouter();
const route = useRoute();
const items = ref<SalesContract[]>([]);
const keyword = ref('');
const selectedKeys = ref<string[]>([]);
const columnFilters = ref<Record<string, string>>({});
const toolbarMessage = ref('');
const filterModalOpen = ref(false);
const columnsModalOpen = ref(false);
const draftExecutionStatus = ref('');
const visibleColumnKeys = ref(salesContractListConfig.table.columns.map((column) => column.key));
const query: ListQuery = { pageNo: 1, pageSize: 20 };
const executionStatusOptions = computed(() => salesContractListConfig.table.columns.find((column) => column.key === 'executionStatusName')?.filterOptions || []);
const visibleColumns = computed(() => salesContractListConfig.table.columns.filter((column) => visibleColumnKeys.value.includes(column.key)));

const filteredItems = computed(() => {
  const term = keyword.value.trim();
  return items.value.filter((item) => {
    const executionMatched = !columnFilters.value.executionStatusName || item.executionStatusName === columnFilters.value.executionStatusName;
    const keywordMatched =
      !term ||
      [item.topic, item.code, item.customerName, item.sourceCode, item.signedDate, item.expireDate, item.executionStatusName, item.statusName, item.ownerName].some((value) => value?.includes(term));
    return executionMatched && keywordMatched;
  });
});

const tableRows = computed<Record<string, unknown>[]>(() => filteredItems.value.map((item) => ({ ...item, action: '查看' })));

async function loadData() {
  const result = await listSalesContracts(query);
  items.value = result.items;
}

async function handleRefresh() {
  await loadData();
  toolbarMessage.value = `合同管理已刷新，共 ${filteredItems.value.length} 条。`;
}

function handleSearch(value: string) {
  keyword.value = value;
}

function openContract(id: string) {
  router.push({ path: '/sales/sales-contracts', query: { contractId: id } });
}

function openCreate() {
  router.push({ path: '/sales/sales-contracts', query: { action: 'new' } });
}

function handleSelectionChange(keys: string[]) {
  selectedKeys.value = keys;
}

function handleBatchAction(_actionKey: string, keys: string[]) {
  selectedKeys.value = keys;
  toolbarMessage.value = keys.length ? `已处理 ${keys.length} 条合同。` : '请先选择需要批量处理的合同。';
}

function handleColumnFilter(columnKey: string, value: string) {
  columnFilters.value = { ...columnFilters.value, [columnKey]: value };
}

function openFilterModal() {
  draftExecutionStatus.value = columnFilters.value.executionStatusName || '';
  filterModalOpen.value = true;
}

function applyFilterModal() {
  columnFilters.value = { ...columnFilters.value, executionStatusName: draftExecutionStatus.value };
  filterModalOpen.value = false;
  toolbarMessage.value = `筛选已应用，当前 ${filteredItems.value.length} 条合同。`;
}

function openColumnsModal() {
  columnsModalOpen.value = true;
}

function applyColumnsModal() {
  columnsModalOpen.value = false;
  toolbarMessage.value = '字段配置已应用。';
}

function toggleColumn(key: string) {
  if (key === 'action') return;
  visibleColumnKeys.value = visibleColumnKeys.value.includes(key)
    ? visibleColumnKeys.value.filter((item) => item !== key)
    : [...visibleColumnKeys.value, key];
}

function handleImport() {
  toolbarMessage.value = '合同导入模板已准备，可按当前字段回填数据。';
}

function handleExport() {
  toolbarMessage.value = `合同导出任务已创建，共 ${filteredItems.value.length} 条。`;
}

function statusTone(status: unknown) {
  if (status === 'completed') return 'green';
  if (status === 'performing') return '';
  if (status === 'pendingExecution' || status === 'pendingApproval') return 'yellow';
  if (status === 'disabled' || status === 'terminated') return 'gray';
  return '';
}

function formatCellValue(value: unknown, numeric?: boolean) {
  if (typeof value === 'number' && numeric) return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  return value ?? '-';
}

onMounted(loadData);
watch(() => route.query, loadData);
</script>

<style scoped>
.sales-list-feedback {
  margin-bottom: 12px;
}

.aw-column-checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}

.aw-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--aw-fg-2);
  font-size: 13px;
}
</style>
