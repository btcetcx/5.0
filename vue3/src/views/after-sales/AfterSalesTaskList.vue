<template>
  <aw-detail-page v-if="currentView === 'detail' && activeTask">
    <template #toolbar>
      <aw-detail-toolbar
        back-text="返回任务列表"
        :actions="taskActions"
        @back="goList"
        @action="handleTaskAction"
      />
    </template>
    <template #header>
      <aw-detail-header
        :title="activeTask.topic"
        :code="activeTask.code"
        :status-text="activeTask.status"
        :status-tone="statusTone(activeTask.status)"
        :metas="taskHeaderMetas"
      />
    </template>

    <aw-detail-tabs v-model="activeDetailTab" :tabs="detailTabs" />

    <section v-if="activeDetailTab === 'current'" class="aw-form-card">
      <div class="aw-detail-section-title">当前处理动作</div>
      <aw-detail-info-grid :items="currentActionItems" />
      <div class="as-task-action">
        <button v-if="activeTask.status !== '已完成'" class="aw-btn primary" type="button" @click="advanceTask">推进派生单据状态</button>
        <span v-else class="aw-status green">任务已完成</span>
      </div>
    </section>

    <section v-else-if="activeDetailTab === 'service'" class="aw-form-card">
      <div class="aw-detail-section-title">关联售后单</div>
      <aw-detail-info-grid :items="serviceItems" />
      <button class="aw-tool-btn" type="button" @click="openService(activeTask.serviceId)">查看售后详情</button>
    </section>

    <section v-else-if="activeDetailTab === 'document'" class="aw-form-card">
      <div class="aw-detail-section-title">关联单据</div>
      <aw-editable-sub-table :columns="documentColumns" :rows="documentRows" add-text="添加单据" :show-add="false">
        <template #cell="{ column, row }">
          <span v-if="column.key === 'status'" :class="['aw-status', docTone(String(row.status))]">{{ row.status }}</span>
          <span v-else>{{ row[column.key] }}</span>
        </template>
      </aw-editable-sub-table>
    </section>

    <section v-else class="aw-form-card">
      <div class="aw-detail-section-title">{{ activeDetailTab === 'writeback' ? '回写记录' : '结单确认' }}</div>
      <div class="as-task-logs">
        <div v-for="item in activeLogRows" :key="item" class="as-task-log">{{ item }}</div>
      </div>
    </section>
  </aw-detail-page>

  <section v-else-if="currentView === 'detail'" class="aw-form-card as-task-missing">
    <div class="aw-detail-section-title">任务不存在</div>
    <p>未找到当前售后任务，可能已完成或不在当前数据范围内。</p>
    <button class="aw-btn primary" type="button" @click="goList">返回任务列表</button>
  </section>

  <after-sales-rule-setting-page v-else-if="currentView === 'setting'" scope-title="任务" back-path="/after-sales/tasks" />

  <aw-list-page v-else>
    <template #tree>
      <aw-resource-tree v-model="activeCategory" title="售后类型" :total="scopedItems.length" :nodes="treeNodes" />
    </template>
    <aw-list-toolbar
      search-placeholder="搜索售后主题/售后单/客户"
      create-label="刷新任务"
      @search="keyword = $event"
      @refresh="loadData"
      @filter="noop"
      @columns="noop"
      @import="noop"
      @export="noop"
      @create="loadData"
    />
    <aw-data-table :columns="taskPoolColumns" :rows="tableRows" row-key="id" :total="filteredItems.length" :filter-values="columnFilters" @column-filter="handleColumnFilter">
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'topic'" class="aw-link" @click="openService(String(record.id))">{{ value }}</span>
        <span v-else-if="column.key === 'statusName'" :class="['aw-status', serviceStatusTone(String(record.status))]">{{ value }}</span>
        <span v-else-if="column.key === 'priority'" :class="['aw-status', priorityTone(String(value))]">{{ value }}</span>
        <span v-else-if="column.key === 'assigneeName'" :class="String(value) === '待派工' ? 'aw-status red' : ''">{{ value }}</span>
        <span v-else-if="column.key === 'action'">
          <span class="aw-link" @click="openService(String(record.id))">{{ value }}</span>
          <template v-if="!isMineScope && String(record.assigneeName) === '待派工'">
            <span class="aw-action-split">|</span>
            <span class="aw-link" @click="openService(String(record.id))">派工</span>
          </template>
        </span>
        <span v-else>{{ formatCellValue(value, column.numeric) }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { advanceAfterSalesTask, getAfterSalesService, getAfterSalesTask, listAfterSalesLinkedDocuments, listAfterSalesServices } from '@/app/api/after-sales/resources';
import type { AfterSalesLinkedDocument, AfterSalesService, AfterSalesTask } from '@/app/api/after-sales/types';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import AfterSalesRuleSettingPage from './AfterSalesRuleSettingPage.vue';
import { serviceColumns } from './afterSalesList.config';

const MINE_OWNER_NAME = '老夏';
const mineStatusScope = ['untreated', 'processing', 'pendingCloseConfirm', 'closedConfirmed'];
const mineStatusFilterOptions = ['未处理', '处理中', '待结单', '已结单'];
const router = useRouter();
const route = useRoute();
const items = ref<AfterSalesService[]>([]);
const activeTask = ref<AfterSalesTask>();
const activeService = ref<AfterSalesService>();
const activeDocument = ref<AfterSalesLinkedDocument>();
const keyword = ref('');
const activeCategory = ref('all');
const activeDetailTab = ref('current');
const columnFilters = ref<Record<string, string>>({});
const categories = ['全部任务', '退款退货', '仅退款', '换货', '仅退货', '维修处理', '现场服务'];
const actionCategoryMap: Record<string, string> = {
  任务列表: 'all',
  全部任务: 'all',
  退款退货: '退款退货',
  仅退款: '仅退款',
  换货: '换货',
  仅退货: '仅退货',
  维修处理: '维修处理',
  现场服务: '现场服务',
};
const detailTabs = [
  { key: 'current', label: '当前处理动作' },
  { key: 'service', label: '关联售后单' },
  { key: 'document', label: '关联单据' },
  { key: 'writeback', label: '回写记录' },
  { key: 'confirm', label: '结单确认' },
];
const categoryTypeMap: Record<string, string[]> = {
  all: [],
  退款退货: ['退款退货'],
  仅退款: ['仅退款'],
  换货: ['换货'],
  仅退货: ['仅退货'],
  维修处理: ['维修处理'],
  现场服务: ['现场服务'],
};
const currentView = computed(() => route.query.setting ? 'setting' : route.query.id ? 'detail' : 'list');
const isMineScope = computed(() => route.query.scope === 'mine');
const scopedItems = computed(() => (
  isMineScope.value ? items.value.filter((item) => mineStatusScope.includes(item.status)) : items.value
));
const taskPoolColumns = computed(() => {
  const columns = serviceColumns
    .filter((column) => column.key !== 'ownerName')
    .map((column) => {
      if (column.key === 'action') return { ...column, width: 82 };
      if (isMineScope.value && column.key === 'statusName') return { ...column, filterOptions: mineStatusFilterOptions };
      return column;
    });
  columns.splice(
    Math.max(0, columns.findIndex((column) => column.key === 'submittedAt')),
    0,
    { key: 'assigneeName', title: '责任人', width: 100 },
  );
  if (isMineScope.value) {
    columns.splice(
      Math.max(0, columns.findIndex((column) => column.key === 'action')),
      0,
      { key: 'processingResult', title: '处理结果', width: 110 },
    );
  }
  return columns;
});
const treeNodes = computed(() => categories.map((label) => ({
  key: label === '全部任务' ? 'all' : label,
  label,
  icon: 'line-doc',
  level: 2 as const,
  count: label === '全部任务' ? scopedItems.value.length : scopedItems.value.filter((item) => categoryMatchedService(item, label)).length,
})));
const filteredItems = computed(() => {
  const term = keyword.value.trim();
  const rawStatusFilter = String(route.query.status || '');
  return scopedItems.value.filter((item) => {
    const categoryOk = activeCategory.value === 'all' || categoryMatchedService(item, activeCategory.value);
    const statusMatched = !rawStatusFilter || rawStatusFilter === 'pending' || rawStatusFilter === '待处理' || item.statusName === rawStatusFilter;
    const typeMatched = !columnFilters.value.afterSalesType || item.afterSalesType === columnFilters.value.afterSalesType;
    const keywordMatched = !term || [item.topic, item.code, item.customerName, item.sourceOrder, item.sourceDelivery, item.ownerName].some((value) => safeText(value).includes(term));
    return categoryOk && statusMatched && typeMatched && keywordMatched;
  });
});
const tableRows = computed<Record<string, unknown>[]>(() => filteredItems.value.map((item) => ({
  ...item,
  handlingMethod: handlingMethodWriteback(item),
  assigneeName: isMineScope.value ? MINE_OWNER_NAME : assigneeName(item),
  processingResult: mineProcessingResult(item),
  action: isMineScope.value ? mineActionName(item) : '查看',
})));
const taskActions = computed(() => activeTask.value?.status === '已完成' ? [] : [{ key: 'advance', label: '推进处理' }]);
const taskHeaderMetas = computed(() => activeTask.value ? [
  { label: '关联售后单', value: activeTask.value.serviceCode },
  { label: '客户', value: activeTask.value.customerName },
  { label: '责任部门', value: activeTask.value.department },
  { label: '责任人', value: activeTask.value.ownerName },
] : []);
const currentActionItems = computed(() => activeTask.value ? [
  { label: '任务类型', value: activeTask.value.taskType },
  { label: '派生单据', value: activeTask.value.linkedDocumentCode },
  { label: '派生单据状态', value: activeTask.value.linkedDocumentStatus },
  { label: '任务状态', value: activeTask.value.status },
  { label: '截止时间', value: activeTask.value.dueAt },
] : []);
const serviceItems = computed(() => activeService.value ? [
  { label: '售后主题', value: activeService.value.topic },
  { label: '售后状态', value: activeService.value.statusName },
  { label: '处理方式', value: activeService.value.handlingMethod },
  { label: '仓储处理', value: activeService.value.warehouseStatus },
  { label: '财务处理', value: activeService.value.financeStatus },
  { label: '结单确认', value: activeService.value.closeConfirmStatus },
] : []);
const documentColumns = [
  { key: 'type', title: '单据类型', width: 130 },
  { key: 'code', title: '单据编号', width: 170 },
  { key: 'status', title: '单据状态', width: 130 },
  { key: 'ownerName', title: '负责人', width: 120 },
  { key: 'updatedAt', title: '更新时间', width: 160 },
];
const documentRows = computed<Record<string, unknown>[]>(() => activeDocument.value ? [activeDocument.value as unknown as Record<string, unknown>] : []);
const activeLogRows = computed(() => {
  if (!activeTask.value) return [];
  if (activeDetailTab.value === 'confirm') {
    return [
      `售后单当前结单状态：${activeService.value?.closeConfirmStatus || '-'}`,
      activeService.value?.status === 'pendingCloseConfirm' ? '派生单据已满足回填规则，可由内部人员在售后详情执行结单确认。' : '派生单据尚未全部完成，暂不可结单。',
    ];
  }
  return activeDocument.value?.writebackLogs || [];
});

async function loadData() {
  const result = await listAfterSalesServices({ pageNo: 1, pageSize: 100 });
  items.value = result.items;
}

async function loadDetail(id: string) {
  activeTask.value = await getAfterSalesTask(id);
  if (!activeTask.value) {
    activeService.value = undefined;
    activeDocument.value = undefined;
    return;
  }
  activeService.value = await getAfterSalesService(activeTask.value.serviceId);
  const docs = await listAfterSalesLinkedDocuments(activeTask.value.serviceId);
  activeDocument.value = docs.find((doc) => doc.id === activeTask.value?.linkedDocumentId);
}

function openTask(id: string) {
  router.push({ path: '/after-sales/tasks', query: { id } });
}

function openService(id: string) {
  router.push({ path: '/after-sales/services', query: isMineScope.value ? { id, from: 'mineTask' } : { id } });
}

function goList() {
  router.push('/after-sales/tasks');
  activeDetailTab.value = 'current';
  loadData();
}

async function advanceTask() {
  if (!activeTask.value) return;
  await advanceAfterSalesTask(activeTask.value.id);
  await loadData();
  await loadDetail(activeTask.value.id);
}

async function handleTaskAction(key: string) {
  if (key === 'advance') await advanceTask();
}

function handleColumnFilter(columnKey: string, value: string) {
  columnFilters.value = { ...columnFilters.value, [columnKey]: value };
}

function statusTone(status: string) {
  if (status === '已完成') return 'green';
  if (status === '处理中') return 'blue';
  return 'yellow';
}

function docTone(status: string) {
  if (['已质检', '已签收', '已付款', '已完成', '已关闭', '已调整', '已红冲'].includes(status)) return 'green';
  if (status.startsWith('待')) return 'yellow';
  return 'blue';
}

function categoryMatched(item: AfterSalesTask, category: string) {
  const expected = categoryTypeMap[category] || [category];
  if (!expected.length) return true;
  return expected.some((type) => item.taskType.includes(type));
}

function categoryMatchedService(item: AfterSalesService, category: string) {
  const expected = categoryTypeMap[category] || [category];
  if (!expected.length) return true;
  return expected.some((type) => item.afterSalesType === type);
}

function assigneeName(item: AfterSalesService) {
  return item.status === 'unassigned' || item.ownerName === '待分配' ? '待派工' : item.ownerName;
}

function handlingMethodWriteback(item: AfterSalesService) {
  return ['processing', 'pendingCloseConfirm', 'closedConfirmed', 'closed'].includes(item.status) ? item.handlingMethod : '未回填';
}

function mineActionName(item: AfterSalesService) {
  if (item.status === 'untreated') return '去处理';
  if (['processing', 'pendingCloseConfirm'].includes(item.status)) return '查看';
  return '完结';
}

function mineProcessingResult(item: AfterSalesService) {
  return item.status === 'closedConfirmed' ? item.afterSalesType : '';
}

function priorityTone(priority: string) {
  if (priority === '高') return 'red';
  if (priority === '中') return 'yellow';
  return 'gray';
}

function serviceStatusTone(status: string) {
  if (['closedConfirmed', 'closed'].includes(status)) return 'green';
  if (['assigned', 'unassigned', 'processing'].includes(status)) return 'blue';
  if (['pendingReview', 'pendingCloseConfirm'].includes(status)) return 'yellow';
  if (status === 'untreated') return 'red';
  return 'gray';
}

function formatCellValue(value: unknown, numeric?: boolean) {
  if (typeof value === 'number' && numeric) return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  return value ?? '-';
}

function safeText(value: unknown) {
  return value == null ? '' : String(value);
}

function noop() {}

onMounted(loadData);

watch(
  () => [route.query.category, route.query.action],
  ([category, action]) => {
    activeCategory.value = String(category || actionCategoryMap[String(action || '')] || 'all');
  },
  { immediate: true },
);

watch(
  () => route.query.id,
  (id) => {
    if (id) loadDetail(String(id));
  },
  { immediate: true },
);
</script>

<style scoped>
.as-task-action {
  margin-top: 14px;
}

.as-task-logs {
  display: grid;
  gap: 8px;
}

.as-task-log {
  padding: 10px 12px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
}

.as-task-missing {
  margin: 12px;
}

</style>
