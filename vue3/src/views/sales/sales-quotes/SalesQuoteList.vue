<template>
  <sales-quote-create v-if="route.query.action === 'new'" @back="goList" />
  <sales-quote-setting-page v-else-if="route.query.setting" @back="goList" />
  <sales-quote-detail v-else-if="route.query.quoteId || route.query.id" :id="String(route.query.quoteId || route.query.id)" @back="goList" />
  <aw-list-page v-else>
    <template #tree>
      <aw-resource-tree v-model="pickedCategory" :title="salesQuoteListConfig.tree.title" :total="items.length" :nodes="treeNodes" />
    </template>

    <aw-list-toolbar
      :search-placeholder="salesQuoteListConfig.toolbar.searchPlaceholder"
      :create-label="salesQuoteListConfig.toolbar.createLabel"
      :actions="salesQuoteListConfig.toolbar.actions"
      @search="handleSearch"
      @refresh="handleRefresh"
      @filter="openFilterModal"
      @columns="openColumnsModal"
      @import="handleImport"
      @export="handleExport"
      @create="createQuote"
    />

    <div v-if="toolbarMessage" class="aw-form-note sales-list-feedback">{{ toolbarMessage }}</div>

    <aw-data-table
      :columns="visibleColumns"
      :rows="tableRows"
      :row-key="salesQuoteListConfig.table.rowKey"
      :total="filteredItems.length"
      :bulk-actions="salesQuoteListConfig.table.bulkActions"
      :filter-values="columnFilters"
      @selection-change="handleSelectionChange"
      @batch-action="handleBatchAction"
      @column-filter="handleColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'topic'" class="aw-link" @click="openQuote(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'conversionStatusName'" :class="['aw-status', conversionTone(record.conversionStatus)]">{{ value }}</span>
        <span v-else-if="column.key === 'statusName'" :class="['aw-status', statusTone(record.status)]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openQuote(record.id as string)">查看</span>
        <span v-else>{{ formatCellValue(value, column.numeric) }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>

  <aw-setting-modal :open="filterModalOpen" title="报价管理筛选" width="560px" @cancel="filterModalOpen = false" @confirm="applyFilterModal">
    <div class="aw-form-grid">
      <div class="aw-field">
        <label>报价分类</label>
        <select v-model="draftCategory" class="aw-select">
          <option value="all">全部</option>
          <option v-for="category in salesQuoteListConfig.tree.categories" :key="category.key" :value="category.key">{{ category.label }}</option>
        </select>
      </div>
      <div class="aw-field">
        <label>报价状态</label>
        <select v-model="draftStatus" class="aw-select">
          <option value="">全部</option>
          <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="columnsModalOpen" title="报价字段配置" width="560px" @cancel="columnsModalOpen = false" @confirm="applyColumnsModal">
    <div class="aw-column-checks">
      <label v-for="column in salesQuoteListConfig.table.columns" :key="column.key" class="aw-check-row">
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
import { listSalesQuotes } from '@/app/api/sales/resources';
import type { SalesQuote } from '@/app/api/sales/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import type { AwTreeNode } from '@/components/list-page/types';
import SalesQuoteCreate from './SalesQuoteCreate.vue';
import SalesQuoteDetail from './SalesQuoteDetail.vue';
import SalesQuoteSettingPage from './SalesQuoteSettingPage.vue';
import { salesQuoteListConfig } from './salesQuoteList.config';

const router = useRouter();
const route = useRoute();
const items = ref<SalesQuote[]>([]);
const pickedCategory = ref('all');
const keyword = ref('');
const selectedKeys = ref<string[]>([]);
const columnFilters = ref<Record<string, string>>({});
const toolbarMessage = ref('');
const filterModalOpen = ref(false);
const columnsModalOpen = ref(false);
const draftCategory = ref('all');
const draftStatus = ref('');
const visibleColumnKeys = ref(salesQuoteListConfig.table.columns.map((column) => column.key));
const query: ListQuery = { pageNo: 1, pageSize: 20 };
const statusOptions = computed(() => salesQuoteListConfig.table.columns.find((column) => column.key === 'statusName')?.filterOptions || []);
const visibleColumns = computed(() => salesQuoteListConfig.table.columns.filter((column) => visibleColumnKeys.value.includes(column.key)));

const filteredItems = computed(() => {
  const term = keyword.value.trim();
  return items.value.filter((item) => {
    const categoryMatched = pickedCategory.value === 'all' || item.category === pickedCategory.value;
    const statusMatched = !columnFilters.value.statusName || item.statusName === columnFilters.value.statusName;
    const keywordMatched =
      !term ||
      [
        item.topic,
        item.code,
        item.quoteTypeName,
        item.customerName,
        item.priceVersion,
        item.conversionStatusName,
        item.quoteDate,
        item.expireDate,
        item.ownerName,
        item.statusName,
      ].some((value) => value?.includes(term));
    return categoryMatched && statusMatched && keywordMatched;
  });
});

const tableRows = computed<Record<string, unknown>[]>(() => filteredItems.value.map((item) => ({ ...item, action: '查看' })));

const treeNodes = computed<AwTreeNode[]>(() => {
  const categoryCounts = items.value.reduce<Record<string, number>>((result, item) => {
    if (item.category) result[item.category] = (result[item.category] || 0) + 1;
    return result;
  }, {});
  return [
    { key: 'all', label: salesQuoteListConfig.tree.rootLabel, count: items.value.length, icon: 'line-folder', level: 2, open: true },
    ...salesQuoteListConfig.tree.categories.map((category) => ({
      key: category.key,
      label: category.label,
      count: categoryCounts[category.key] || 0,
      icon: 'line-node',
      level: 3 as const,
    })),
  ];
});

async function loadData() {
  const result = await listSalesQuotes(query);
  items.value = result.items;
}

async function handleRefresh() {
  await loadData();
  toolbarMessage.value = `报价管理已刷新，共 ${filteredItems.value.length} 条。`;
}

function handleSearch(value: string) {
  keyword.value = value;
}

function openQuote(id: string) {
  router.push({ path: '/sales/sales-quotes', query: { quoteId: id } });
}

function createQuote() {
  router.push({ path: '/sales/sales-quotes', query: { action: 'new' } });
}

function goList() {
  router.push('/sales/sales-quotes');
}

function handleSelectionChange(keys: string[]) {
  selectedKeys.value = keys;
}

function handleBatchAction(_actionKey: string, keys: string[]) {
  selectedKeys.value = keys;
  toolbarMessage.value = keys.length ? `已处理 ${keys.length} 条报价。` : '请先选择需要批量处理的报价。';
}

function handleColumnFilter(columnKey: string, value: string) {
  columnFilters.value = { ...columnFilters.value, [columnKey]: value };
}

function openFilterModal() {
  draftCategory.value = pickedCategory.value;
  draftStatus.value = columnFilters.value.statusName || '';
  filterModalOpen.value = true;
}

function applyFilterModal() {
  pickedCategory.value = draftCategory.value;
  columnFilters.value = { ...columnFilters.value, statusName: draftStatus.value };
  filterModalOpen.value = false;
  toolbarMessage.value = `筛选已应用，当前 ${filteredItems.value.length} 条报价。`;
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
  toolbarMessage.value = '报价导入模板已准备，可按当前字段回填数据。';
}

function handleExport() {
  toolbarMessage.value = `报价导出任务已创建，共 ${filteredItems.value.length} 条。`;
}

function conversionTone(status: unknown) {
  if (status === 'convertedOrder' || status === 'convertedContract') return 'green';
  if (status === 'pendingExecution') return 'yellow';
  if (status === 'notConverted') return 'gray';
  return '';
}

function statusTone(status: unknown) {
  if (status === 'approved') return 'green';
  if (status === 'pendingApproval') return 'blue';
  if (status === 'draft') return 'yellow';
  if (status === 'expired') return 'gray';
  return '';
}

function formatCellValue(value: unknown, numeric?: boolean) {
  if (typeof value === 'number' && numeric) return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
