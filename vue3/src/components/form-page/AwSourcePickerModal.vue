<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { SourcePickerBatch, SourcePickerBatchText, SourcePickerCategory, SourcePickerConfirmPayload, SourcePickerMetricField, SourcePickerRow, SourcePickerTableText } from './types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    currentCustomer?: string;
    categories?: SourcePickerCategory[];
    rows: SourcePickerRow[];
    batches?: Record<string, SourcePickerBatch[]>;
    showBatches?: boolean;
    batchMode?: 'delivery' | 'workOrder';
    sourceSelectMode?: 'single' | 'multiple';
    batchSelectMode?: 'single' | 'multiple';
    batchVisibleCategories?: string[];
    sourceTableText?: Partial<SourcePickerTableText>;
    sourceMetricField?: SourcePickerMetricField;
    batchTextMap?: Record<string, Partial<SourcePickerBatchText>>;
    childBatchText?: Partial<SourcePickerBatchText>;
    showBatchAmount?: boolean;
    showCustomerContext?: boolean;
    showCustomerColumn?: boolean;
  }>(),
  {
    title: '选择来源',
    currentCustomer: '',
    batches: () => ({}),
    showBatches: true,
    batchMode: 'delivery',
    sourceSelectMode: 'single',
    batchSelectMode: 'multiple',
    batchVisibleCategories: () => [],
    sourceTableText: () => ({}),
    sourceMetricField: 'maxQty',
    batchTextMap: () => ({}),
    childBatchText: () => ({}),
    showBatchAmount: false,
    showCustomerContext: true,
    showCustomerColumn: true,
    categories: () => [
      { key: '订单', label: '订单', icon: 'line-doc' },
      { key: '项目', label: '项目', icon: 'line-folder' },
    ],
  },
);

const emit = defineEmits<{
  cancel: [];
  confirm: [source: SourcePickerConfirmPayload];
}>();

const activeCategory = ref('');
const pickedSource = ref<SourcePickerRow | null>(null);
const pickedSources = reactive<Record<string, boolean>>({});
const pickedBatches = reactive<Record<string, boolean>>({});
const pickedChildBatches = reactive<Record<string, boolean>>({});

const filteredRows = computed(() =>
  props.rows.filter((row) => {
    const categoryMatched = row.cat === activeCategory.value;
    const customerMatched = props.showCustomerContext && props.currentCustomer ? row.customer === props.currentCustomer : true;
    return categoryMatched && customerMatched;
  }),
);

const selectedSourceRows = computed(() => {
  if (props.sourceSelectMode === 'multiple') return props.rows.filter((row) => pickedSources[row.code]);
  return pickedSource.value ? [pickedSource.value] : [];
});
const visibleBatches = computed(() => selectedSourceRows.value.flatMap((row) =>
  sourceBatches(row).map((batch) => ({ ...batch, sourceCode: batch.sourceCode || row.code, sourceType: batch.sourceType || row.cat })),
));
const selectedBatchRows = computed(() => visibleBatches.value.filter((item) => pickedBatches[item.detailNo]));
const visibleChildBatches = computed(() => selectedBatchRows.value.flatMap((batch) =>
  (batch.children || []).map((child) => ({ ...child, sourceCode: child.sourceCode || batch.sourceCode, sourceType: child.sourceType || batch.sourceType })),
));
const sourceTableColspan = computed(() => (props.showCustomerColumn ? 6 : 5));
const showBatchPanel = computed(() => {
  if (!selectedSourceRows.value.length || !props.showBatches) return false;
  if (!props.batchVisibleCategories.length) return true;
  return selectedSourceRows.value.some((row) => props.batchVisibleCategories.includes(row.cat));
});
const defaultSourceTableText = computed<SourcePickerTableText>(() => ({
  code: '来源编号',
  subject: '来源主题',
  customer: '客户',
  date: '来源日期',
  metric: '产品数',
  emptyNoRows: '当前暂无该类型来源',
  emptyWithoutCustomer: '请先选择客户后再选择来源',
}));
const sourceTableText = computed<SourcePickerTableText>(() => ({
  ...defaultSourceTableText.value,
  ...props.sourceTableText,
}));
const defaultBatchPanelText = computed<SourcePickerBatchText>(() => props.batchMode === 'workOrder'
  ? {
      title: '工单列表',
      no: '工单编号',
      date: '工单类型',
      warehouse: '工位/产线',
      logistics: '工序',
      qty: '工单数量',
      amount: '金额',
      empty: '当前来源暂无工单',
      note: '请选择一个工单；未选择时默认带入第一条工单。',
    }
  : {
      title: '发货 / 交付批次',
      no: '发货单号',
      date: '发货日期',
      warehouse: '发货仓库',
      logistics: '物流',
      qty: '发货数量',
      amount: '金额',
      empty: '当前来源暂无发货/交付批次',
      note: '可多选发货单批次；未勾选时默认带入第一条批次。',
    });
const batchPanelText = computed<SourcePickerBatchText>(() => ({
  ...defaultBatchPanelText.value,
  ...(pickedSource.value ? props.batchTextMap[pickedSource.value.cat] : {}),
}));
const childBatchPanelText = computed<SourcePickerBatchText>(() => ({
  ...defaultBatchPanelText.value,
  title: '工序列表',
  no: '工序号',
  date: '工序类型',
  warehouse: '工位/产线',
  logistics: '工序',
  qty: '工序数量',
  amount: '金额',
  empty: '当前工单暂无工序',
  note: '可选择一个或多个工序；未选择时默认带入第一条工序。',
  ...props.childBatchText,
}));

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    activeCategory.value = props.categories[0]?.key || '';
    pickedSource.value = null;
    clearPickedSources();
    clearPickedBatches();
  },
  { immediate: true },
);

function switchCategory(key: string) {
  activeCategory.value = key;
  pickedSource.value = null;
  clearPickedSources();
  clearPickedBatches();
}

function pickSource(row: SourcePickerRow) {
  if (props.sourceSelectMode === 'multiple') {
    pickedSources[row.code] = !pickedSources[row.code];
    pickedSource.value = row;
    clearPickedBatches();
    return;
  }
  pickedSource.value = row;
  clearPickedBatches();
}

function toggleBatch(detailNo: string) {
  if (props.batchSelectMode === 'single') {
    clearPickedBatches();
    pickedBatches[detailNo] = true;
    return;
  }
  pickedBatches[detailNo] = !pickedBatches[detailNo];
  clearPickedChildBatches();
}

function toggleChildBatch(detailNo: string) {
  pickedChildBatches[detailNo] = !pickedChildBatches[detailNo];
}

function clearPickedSources() {
  Object.keys(pickedSources).forEach((key) => delete pickedSources[key]);
}

function clearPickedBatches() {
  Object.keys(pickedBatches).forEach((key) => delete pickedBatches[key]);
  clearPickedChildBatches();
}

function clearPickedChildBatches() {
  Object.keys(pickedChildBatches).forEach((key) => delete pickedChildBatches[key]);
}

function sourceMetricValue(row: SourcePickerRow) {
  return props.sourceMetricField === 'maxRefund' ? row.maxRefund || '-' : row.maxQty || '-';
}

function sourceBatches(row: SourcePickerRow) {
  return props.batches[`${row.cat}:${row.code}`] || props.batches[row.code] || [];
}

function sourceEmptyText() {
  if (!props.showCustomerContext) return sourceTableText.value.emptyNoRows;
  return props.currentCustomer ? sourceTableText.value.emptyNoRows : sourceTableText.value.emptyWithoutCustomer;
}

function confirmSource() {
  const selectedSources = selectedSourceRows.value;
  if (!selectedSources.length) return;
  const primarySource = selectedSources[0];
  if (!showBatchPanel.value) {
    emit('confirm', { ...primarySource, selectedSources });
    return;
  }
  const chosen = visibleChildBatches.value.length
    ? visibleChildBatches.value.filter((item) => pickedChildBatches[item.detailNo])
    : selectedBatchRows.value;
  const fallbackRows = visibleChildBatches.value.length ? visibleChildBatches.value.slice(0, 1) : visibleBatches.value.slice(0, 1);
  const selected = chosen.length ? chosen : fallbackRows;
  const qty = selected.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const first = selected[0];
  emit('confirm', {
    ...primarySource,
    sourceDelivery: selected.map((item) => item.deliveryNo).join('、') || String(primarySource.sourceDelivery || ''),
    sourceDetail: selected.map((item) => item.detailNo).join('、') || String(primarySource.sourceDetail || ''),
    deliveryDate: selected.map((item) => item.deliveryDate).join('、') || primarySource.date,
    deliveryStatus: selected.map((item) => `${item.deliveryNo} ${item.status}`).join('；'),
    deliveryWarehouse: selected.map((item) => item.warehouse).join('、'),
    deliveryLogistics: selected.map((item) => item.logistics).join('、'),
    maxQty: qty || primarySource.maxQty,
    maxRefund: first?.amount || primarySource.maxRefund,
    selectedBatches: selected,
    selectedSources,
  });
}
</script>

<template>
  <div v-if="open" class="aw-mask" @click="emit('cancel')">
    <div :class="['aw-modal', 'lg', { 'is-source-list-only': !showCustomerColumn }]" @click.stop>
      <div class="head">
        <span>{{ title }}</span>
        <button class="aw-modal-close" type="button" @click="emit('cancel')">×</button>
      </div>
      <div class="body aw-source-picker-body">
        <div class="aw-source-picker-side">
          <button
            v-for="category in categories"
            :key="category.key"
            :class="['aw-tree-row', 'aw-tree-l2', { on: activeCategory === category.key }]"
            type="button"
            @click="switchCategory(category.key)"
          >
            <span :class="['aw-line-icon', category.icon || 'line-doc']"></span>
            <span>{{ category.label }}</span>
          </button>
        </div>
        <div class="aw-source-picker-main">
          <div v-if="showCustomerContext" class="aw-source-picker-current">
            当前客户：<span class="aw-link">{{ currentCustomer || '请先选择客户' }}</span>
            <span>　当前来源：</span><span class="aw-link">{{ categories.find((item) => item.key === activeCategory)?.label || activeCategory }}</span>
          </div>
          <table class="aw-table">
            <thead>
              <tr>
                <th style="width:56px">选择</th>
                <th>{{ sourceTableText.code }}</th>
                <th>{{ sourceTableText.subject }}</th>
                <th>{{ sourceTableText.customer }}</th>
                <th>{{ sourceTableText.date }}</th>
                <th>{{ sourceTableText.metric }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.code" class="aw-source-click-row" @click="pickSource(row)">
                <td>
                  <input v-if="sourceSelectMode === 'multiple'" type="checkbox" :checked="!!pickedSources[row.code]" readonly />
                  <span v-else :class="['aw-radio', { on: pickedSource?.code === row.code }]"><span class="aw-dot"></span></span>
                </td>
                <td class="aw-num">{{ row.code }}</td>
                <td class="aw-link">{{ row.subject }}</td>
                <td>{{ row.customer }}</td>
                <td>{{ row.date }}</td>
                <td>{{ sourceMetricValue(row) }}</td>
              </tr>
              <tr v-if="!filteredRows.length">
                <td colspan="6" class="aw-source-empty-cell">{{ sourceEmptyText() }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="showBatchPanel" class="aw-source-batch-panel">
            <div class="section-title">{{ batchPanelText.title }}</div>
            <table class="aw-table">
              <thead>
                <tr>
                  <th style="width:56px">选择</th>
                  <th>{{ batchPanelText.no }}</th>
                  <th>{{ batchPanelText.date }}</th>
                  <th>{{ batchPanelText.warehouse }}</th>
                  <th>{{ batchPanelText.logistics }}</th>
                  <th>{{ batchPanelText.qty }}</th>
                  <th v-if="showBatchAmount">{{ batchPanelText.amount }}</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="batch in visibleBatches" :key="batch.detailNo" class="aw-source-click-row" @click="toggleBatch(batch.detailNo)">
                  <td>
                    <span
                      v-if="batchSelectMode === 'single'"
                      :class="['aw-radio', { on: !!pickedBatches[batch.detailNo] }]"
                    >
                      <span class="aw-dot"></span>
                    </span>
                    <input v-else type="checkbox" :checked="!!pickedBatches[batch.detailNo]" readonly />
                  </td>
                  <td class="aw-num">{{ batch.deliveryNo }}</td>
                  <td>{{ batch.deliveryDate }}</td>
                  <td>{{ batch.warehouse }}</td>
                  <td>{{ batch.logistics }}</td>
                  <td>{{ batch.qty }}</td>
                  <td v-if="showBatchAmount">{{ batch.amount || '-' }}</td>
                  <td><span :class="['aw-status', batch.status.includes('待') ? 'yellow' : 'green']">{{ batch.status }}</span></td>
                </tr>
                <tr v-if="!visibleBatches.length">
                  <td :colspan="showBatchAmount ? 8 : 7" class="aw-source-empty-cell">{{ batchPanelText.empty }}</td>
                </tr>
              </tbody>
            </table>
            <div class="aw-source-note">{{ batchPanelText.note }}</div>
            <div v-if="visibleChildBatches.length" class="aw-source-batch-panel">
              <div class="section-title">{{ childBatchPanelText.title }}</div>
              <table class="aw-table">
                <thead>
                  <tr>
                    <th style="width:56px">选择</th>
                    <th>{{ childBatchPanelText.no }}</th>
                    <th>{{ childBatchPanelText.date }}</th>
                    <th>{{ childBatchPanelText.warehouse }}</th>
                    <th>{{ childBatchPanelText.logistics }}</th>
                    <th>{{ childBatchPanelText.qty }}</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="child in visibleChildBatches" :key="child.detailNo" class="aw-source-click-row" @click="toggleChildBatch(child.detailNo)">
                    <td><input type="checkbox" :checked="!!pickedChildBatches[child.detailNo]" readonly /></td>
                    <td class="aw-num">{{ child.deliveryNo }}</td>
                    <td>{{ child.deliveryDate }}</td>
                    <td>{{ child.warehouse }}</td>
                    <td>{{ child.logistics }}</td>
                    <td>{{ child.qty }}</td>
                    <td><span :class="['aw-status', child.status.includes('待') ? 'yellow' : 'green']">{{ child.status }}</span></td>
                  </tr>
                </tbody>
              </table>
              <div class="aw-source-note">{{ childBatchPanelText.note }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="aw-modal-foot aw-source-picker-foot">
        <button class="aw-btn" type="button" @click="emit('cancel')">取消</button>
        <button class="aw-btn primary" type="button" @click="confirmSource">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aw-source-picker-body {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  min-height: 430px;
  max-height: min(560px, calc(100vh - 170px));
  padding: 0;
}

.aw-source-picker-foot {
  flex: none;
}

.aw-source-picker-side {
  background: var(--aw-surface-2);
  border-right: 1px solid var(--aw-divider);
  padding: 12px;
}

.aw-source-picker-main {
  overflow: auto;
  padding: 16px;
}

.aw-source-picker-current {
  margin-bottom: 12px;
}

.is-source-list-only .aw-source-picker-main > .aw-table th:nth-child(4),
.is-source-list-only .aw-source-picker-main > .aw-table td:nth-child(4) {
  display: none;
}

.aw-source-batch-panel {
  margin-top: 16px;
}

.aw-source-batch-panel .section-title {
  margin-bottom: 10px;
}

.aw-source-note {
  color: var(--aw-fg-3);
  font-size: 12px;
  margin-top: 8px;
}

.aw-source-click-row {
  cursor: pointer;
}

.aw-source-empty-cell {
  color: var(--aw-fg-3);
  height: 88px;
  text-align: center;
}

@media (max-width: 980px) {
  .aw-source-picker-body {
    grid-template-columns: 1fr;
  }
}
</style>
