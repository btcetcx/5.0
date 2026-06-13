<template>
  <sales-order-create v-if="currentView === 'new'" @back="goList" />
  <sales-order-detail v-else-if="currentView === 'detail' && activeOrder" :order="activeOrder" @back="goList" />
  <sales-order-setting-page v-else-if="currentView === 'setting'" />
  <aw-list-page v-else>
    <aw-list-toolbar
      :search-placeholder="salesOrderListConfig.toolbar.searchPlaceholder"
      :create-label="salesOrderListConfig.toolbar.createLabel"
      :actions="salesOrderListConfig.toolbar.actions"
      @search="handleSearch"
      @refresh="handleRefresh"
      @filter="openFilterModal"
      @columns="openColumnsModal"
      @import="handleImport"
      @export="handleExport"
      @create="handleCreate"
    />

    <div v-if="toolbarMessage" class="aw-form-note sales-list-feedback">{{ toolbarMessage }}</div>

    <aw-data-table
      :columns="visibleColumns"
      :rows="tableRows"
      :row-key="salesOrderListConfig.table.rowKey"
      :total="filteredItems.length"
      :bulk-actions="salesOrderListConfig.table.bulkActions"
      :filter-values="columnFilters"
      @selection-change="handleSelectionChange"
      @batch-action="handleBatchAction"
      @column-filter="handleColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'topic'" class="aw-link" @click="openOrder(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'creditCheckName'" :class="['aw-status', statusTone(record.creditCheckStatus)]">{{ value }}</span>
        <span v-else-if="column.key === 'creditHoldName'" :class="['aw-status', statusTone(record.creditHoldStatus)]">{{ value }}</span>
        <span v-else-if="column.key === 'invoiceRequestName'" :class="['aw-status', statusTone(record.invoiceRequestStatus)]">{{ value }}</span>
        <span v-else-if="column.key === 'progressName'" :class="['aw-status', statusTone(record.progressStatus)]">{{ value }}</span>
        <span v-else-if="column.key === 'statusName'" :class="['aw-status', statusTone(record.status)]">{{ value }}</span>
        <span v-else-if="column.key === 'exceptionTag' && value" class="aw-status yellow">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openOrder(record.id as string)">查看</span>
        <span v-else>{{ formatCellValue(value, column.key, column.title, column.numeric) }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>

  <aw-setting-modal :open="filterModalOpen" title="订单管理筛选" width="560px" @cancel="filterModalOpen = false" @confirm="applyFilterModal">
    <div class="aw-form-grid">
      <div class="aw-field">
        <label>订单状态</label>
        <select v-model="draftStatus" class="aw-select">
          <option value="">全部</option>
          <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
      <div class="aw-field">
        <label>订单进展</label>
        <select v-model="draftProgress" class="aw-select">
          <option value="">全部</option>
          <option v-for="option in progressOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="columnsModalOpen" title="订单字段配置" width="560px" @cancel="columnsModalOpen = false" @confirm="applyColumnsModal">
    <div class="aw-column-checks">
      <label v-for="column in salesOrderListConfig.table.columns" :key="column.key" class="aw-check-row">
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
import { listSalesOrders } from '@/app/api/sales/resources';
import type { SalesOrder } from '@/app/api/sales/types';
import { formatMoney, formatNumber, isMoneyField } from '@/app/utils/money';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import SalesOrderCreate from './SalesOrderCreate.vue';
import SalesOrderDetail from './SalesOrderDetail.vue';
import SalesOrderSettingPage from './SalesOrderSettingPage.vue';
import { salesOrderListConfig } from './salesOrderList.config';

const router = useRouter();
const route = useRoute();
const items = ref<SalesOrder[]>([]);
const keyword = ref('');
const selectedKeys = ref<string[]>([]);
const columnFilters = ref<Record<string, string>>({});
const toolbarMessage = ref('');
const filterModalOpen = ref(false);
const columnsModalOpen = ref(false);
const draftStatus = ref('');
const draftProgress = ref('');
const visibleColumnKeys = ref(salesOrderListConfig.table.columns.map((column) => column.key));
const query: ListQuery = { pageNo: 1, pageSize: 20 };
const statusOptions = computed(() => salesOrderListConfig.table.columns.find((column) => column.key === 'statusName')?.filterOptions || []);
const progressOptions = computed(() => salesOrderListConfig.table.columns.find((column) => column.key === 'progressName')?.filterOptions || []);
const visibleColumns = computed(() => salesOrderListConfig.table.columns.filter((column) => visibleColumnKeys.value.includes(column.key)));

const filteredItems = computed(() => {
  const term = keyword.value.trim();
  return items.value.filter((item) => {
    const statusMatched = !columnFilters.value.statusName || item.statusName === columnFilters.value.statusName;
    const progressMatched = !columnFilters.value.progressName || item.progressName === columnFilters.value.progressName;
    const keywordMatched =
      !term ||
      [item.topic, item.code, item.sourceType, item.sourceCode, item.contractSource, item.customerName, item.creditCheckName, item.creditHoldName, item.invoiceRequestName, item.progressName, item.statusName, item.ownerName, item.exceptionTag].some((value) => value?.includes(term));
    return statusMatched && progressMatched && keywordMatched;
  });
});

const tableRows = computed<Record<string, unknown>[]>(() => filteredItems.value.map((item) => ({ ...item, action: '查看' })));
const activeAction = computed(() => String(route.query.action || ''));
const activeOrderId = computed(() => String(route.query.id || route.query.orderId || ''));
const activeSetting = computed(() => String(route.query.setting || ''));
const activeOrder = computed(() => items.value.find((item) => item.id === activeOrderId.value) || items.value[0]);
const currentView = computed(() => {
  if (activeSetting.value) return 'setting';
  if (activeAction.value === 'new') return 'new';
  if (activeOrderId.value) return 'detail';
  return 'list';
});
async function loadData() {
  const result = await listSalesOrders(query);
  items.value = result.items;
}

async function handleRefresh() {
  await loadData();
  toolbarMessage.value = `订单管理已刷新，共 ${filteredItems.value.length} 条。`;
}

function handleSearch(value: string) {
  keyword.value = value;
}

function openOrder(id: string) {
  router.push({ path: '/sales/sales-orders', query: { id } });
}

function goList() {
  router.push('/sales/sales-orders');
}

function handleSelectionChange(keys: string[]) {
  selectedKeys.value = keys;
}

function handleBatchAction(_actionKey: string, keys: string[]) {
  selectedKeys.value = keys;
  toolbarMessage.value = keys.length ? `已处理 ${keys.length} 条订单。` : '请先选择需要批量处理的订单。';
}

function handleColumnFilter(columnKey: string, value: string) {
  columnFilters.value = { ...columnFilters.value, [columnKey]: value };
}

function openFilterModal() {
  draftStatus.value = columnFilters.value.statusName || '';
  draftProgress.value = columnFilters.value.progressName || '';
  filterModalOpen.value = true;
}

function applyFilterModal() {
  columnFilters.value = { ...columnFilters.value, statusName: draftStatus.value, progressName: draftProgress.value };
  filterModalOpen.value = false;
  toolbarMessage.value = `筛选已应用，当前 ${filteredItems.value.length} 条订单。`;
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
  toolbarMessage.value = '订单导入模板已准备，可按当前字段回填数据。';
}

function handleExport() {
  toolbarMessage.value = `订单导出任务已创建，共 ${filteredItems.value.length} 条。`;
}

function handleCreate() {
  router.push({ path: '/sales/sales-orders', query: { action: 'new' } });
}

function statusTone(status: unknown) {
  if (['passed', 'held', 'requested', 'shipped', 'approved', 'confirmed', 'completed'].includes(String(status))) return 'green';
  if (['pendingApproval', 'shipping'].includes(String(status))) return 'blue';
  if (['pending', 'waiting', 'nearLimit', 'cashPending', 'production'].includes(String(status))) return 'yellow';
  if (['failed', 'rejected', 'disabled', 'cancelled', 'blocked', 'notHeld', 'notRequested', 'draft', 'notShipped'].includes(String(status))) return 'gray';
  return '';
}

function formatCellValue(value: unknown, key: string, title: string, numeric?: boolean) {
  if (isMoneyField(key, title)) return formatMoney(value);
  if (typeof value === 'number' && numeric) return formatNumber(value);
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
