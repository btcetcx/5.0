<template>
  <sales-plan-create v-if="route.query.action === 'new'" @back="goList" />
  <sales-plan-setting-page v-else-if="route.query.setting" @back="goList" />
  <sales-plan-detail v-else-if="route.query.planId || route.query.id" :id="String(route.query.planId || route.query.id)" @back="goList" />
  <aw-list-page v-else>
    <aw-list-toolbar
      :search-placeholder="salesPlanListConfig.toolbar.searchPlaceholder"
      :create-label="salesPlanListConfig.toolbar.createLabel"
      :actions="salesPlanListConfig.toolbar.actions"
      @search="handleSearch"
      @refresh="handleRefresh"
      @filter="openFilterModal"
      @columns="openColumnsModal"
      @import="handleImport"
      @export="handleExport"
      @create="createPlan"
    />

    <div v-if="toolbarMessage" class="aw-form-note sales-list-feedback">{{ toolbarMessage }}</div>

    <aw-data-table
      :columns="visibleColumns"
      :rows="tableRows"
      :row-key="salesPlanListConfig.table.rowKey"
      :total="filteredItems.length"
      :bulk-actions="salesPlanListConfig.table.bulkActions"
      :filter-values="columnFilters"
      @selection-change="handleSelectionChange"
      @batch-action="handleBatchAction"
      @column-filter="handleColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'name'" class="aw-link" @click="openPlan(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'achievementText'" :class="['aw-status', achievementTone(record.achievementRate)]">{{ value }}</span>
        <span v-else-if="column.key === 'statusName'" :class="['aw-status', statusTone(record.status)]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openPlan(record.id as string)">查看</span>
        <span v-else>{{ formatCellValue(value, column.key, column.title, column.numeric) }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>

  <aw-setting-modal :open="filterModalOpen" title="销售计划筛选" width="520px" @cancel="filterModalOpen = false" @confirm="applyFilterModal">
    <div class="aw-form-grid">
      <div class="aw-field">
        <label>计划状态</label>
        <select v-model="draftStatus" class="aw-select">
          <option value="">全部</option>
          <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="columnsModalOpen" title="销售计划字段配置" width="560px" @cancel="columnsModalOpen = false" @confirm="applyColumnsModal">
    <div class="aw-column-checks">
      <label v-for="column in salesPlanListConfig.table.columns" :key="column.key" class="aw-check-row">
        <input
          type="checkbox"
          :checked="visibleColumnKeys.includes(column.key)"
          :disabled="column.key === 'action'"
          @change="toggleColumn(column.key)"
        />
        <span>{{ column.title }}</span>
      </label>
    </div>
  </aw-setting-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ListQuery } from '@/app/api/shared/types';
import { listSalesPlans } from '@/app/api/sales/resources';
import type { SalesPlan } from '@/app/api/sales/types';
import { formatMoney, formatNumber, isMoneyField } from '@/app/utils/money';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import SalesPlanCreate from './SalesPlanCreate.vue';
import SalesPlanDetail from './SalesPlanDetail.vue';
import SalesPlanSettingPage from './SalesPlanSettingPage.vue';
import { salesPlanListConfig } from './salesPlanList.config';

const router = useRouter();
const route = useRoute();
const items = ref<SalesPlan[]>([]);
const keyword = ref('');
const selectedKeys = ref<string[]>([]);
const columnFilters = ref<Record<string, string>>({});
const toolbarMessage = ref('');
const filterModalOpen = ref(false);
const columnsModalOpen = ref(false);
const draftStatus = ref('');
const visibleColumnKeys = ref(salesPlanListConfig.table.columns.map((column) => column.key));
const query: ListQuery = { pageNo: 1, pageSize: 20 };
const statusOptions = computed(() => salesPlanListConfig.table.columns.find((column) => column.key === 'statusName')?.filterOptions || []);
const visibleColumns = computed(() => salesPlanListConfig.table.columns.filter((column) => visibleColumnKeys.value.includes(column.key)));

const filteredItems = computed(() => {
  const term = keyword.value.trim();
  return items.value.filter((item) => {
    const statusMatched = !columnFilters.value.statusName || item.statusName === columnFilters.value.statusName;
    const keywordMatched =
      !term ||
      [
        item.name,
        item.code,
        item.productSummary,
        `${item.cycleStart} ${item.cycleEnd}`,
        item.ownerName,
        item.statusName,
      ].some((value) => value?.includes(term));
    return statusMatched && keywordMatched;
  });
});

const tableRows = computed<Record<string, unknown>[]>(() =>
  filteredItems.value.map((item) => ({
    ...item,
    cycle: `${item.cycleStart} ~ ${item.cycleEnd}`,
    achievementText: `${item.achievementRate}%`,
    action: '查看',
  })),
);

async function loadData() {
  const result = await listSalesPlans(query);
  items.value = result.items;
}

async function handleRefresh() {
  await loadData();
  toolbarMessage.value = `销售计划已刷新，共 ${filteredItems.value.length} 条。`;
}

function handleSearch(value: string) {
  keyword.value = value;
}

function openPlan(id: string) {
  router.push({ path: '/sales/sales-plans', query: { planId: id } });
}

function createPlan() {
  router.push({ path: '/sales/sales-plans', query: { action: 'new' } });
}

function goList() {
  router.push('/sales/sales-plans');
}

function handleSelectionChange(keys: string[]) {
  selectedKeys.value = keys;
}

function handleBatchAction(_actionKey: string, keys: string[]) {
  selectedKeys.value = keys;
  toolbarMessage.value = keys.length ? `已处理 ${keys.length} 条销售计划。` : '请先选择需要批量处理的销售计划。';
}

function handleColumnFilter(columnKey: string, value: string) {
  columnFilters.value = { ...columnFilters.value, [columnKey]: value };
}

function openFilterModal() {
  draftStatus.value = columnFilters.value.statusName || '';
  filterModalOpen.value = true;
}

function applyFilterModal() {
  columnFilters.value = { ...columnFilters.value, statusName: draftStatus.value };
  filterModalOpen.value = false;
  toolbarMessage.value = `筛选已应用，当前 ${filteredItems.value.length} 条销售计划。`;
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
  toolbarMessage.value = '销售计划导入模板已准备，可按当前字段回填数据。';
}

function handleExport() {
  toolbarMessage.value = `销售计划导出任务已创建，共 ${filteredItems.value.length} 条。`;
}

function statusTone(status: unknown) {
  if (status === 'completed') return 'green';
  if (status === 'executing') return 'blue';
  if (status === 'pendingApproval') return 'yellow';
  if (status === 'paused' || status === 'closed') return 'gray';
  if (status === 'notStarted') return 'gray';
  return '';
}

function achievementTone(rate: unknown) {
  const value = Number(rate || 0);
  if (value >= 100) return 'green';
  if (value > 0) return 'blue';
  return 'gray';
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
