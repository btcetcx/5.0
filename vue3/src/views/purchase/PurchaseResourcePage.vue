<template>
  <purchase-setting-page v-if="settingModule" :module="settingModule" />
  <component :is="createComponent" v-else-if="isCreate" @back="goList" />
  <purchase-module-detail-entry v-else-if="isModuleDetailEntry" :module-key="moduleKey" @back="goList" />
  <purchase-detail-view v-else-if="detailId" :module-key="moduleKey" :id="detailId" @back="goList" />
  <aw-list-page v-else>
    <template v-if="moduleKey === 'suppliers'" #tree>
      <aw-resource-tree v-model="pickedTree" title="供应商库" :total="items.length" :nodes="supplierTreeNodes" />
    </template>

    <aw-list-toolbar
      :search-placeholder="moduleConfig.searchPlaceholder"
      :create-label="moduleConfig.createLabel"
      @search="keyword = $event"
      @refresh="handleRefresh"
      @filter="openFilterModal"
      @columns="openColumnsModal"
      @import="handleImport"
      @export="handleExport"
      @create="goCreate"
    />

    <div v-if="listMessage" class="aw-form-note purchase-list-feedback">{{ listMessage }}</div>

    <aw-data-table
      :columns="activeColumns"
      :rows="tableRows"
      :row-key="'id'"
      :total="filteredItems.length"
      :bulk-actions="moduleConfig.bulkActions"
      :filter-values="columnFilters"
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === moduleConfig.linkKey" class="aw-link" @click="openDetail(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'state'" :class="['aw-status', String(record.tone || '')]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(record.id as string)">查看</span>
        <span v-else>{{ tableCellValue(value, column) }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>

  <aw-setting-modal :open="filterModalOpen" :title="`${moduleConfig.title}筛选`" width="560px" @cancel="filterModalOpen = false" @confirm="applyFilterModal">
    <div class="aw-form-grid">
      <div v-for="column in filterableColumns" :key="column.key" class="aw-field">
        <label>{{ column.title }}</label>
        <select v-model="draftFilters[column.key]" class="aw-select">
          <option value="">全部</option>
          <option v-for="option in column.filterOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="columnsModalOpen" :title="`${moduleConfig.title}字段配置`" width="620px" @cancel="columnsModalOpen = false" @confirm="applyColumnsModal">
    <div class="aw-column-checks">
      <label v-for="column in moduleConfig.columns" :key="column.key" class="aw-check-row">
        <input type="checkbox" :checked="visibleColumnKeys.includes(column.key)" :disabled="column.key === 'action'" @change="toggleColumn(column.key)" />
        <span>{{ column.title }}</span>
      </label>
    </div>
  </aw-setting-modal>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { approvePurchase, createPurchase, exportPurchase, getPurchaseDetail, inquirySources, listPurchase, orderSources, printPurchase, purchaseProducts, purchaseSuppliers, updatePurchase, type PurchaseModule, type PurchaseProduct, type PurchaseRow, type PurchaseSource } from '@/app/api/purchase/resources';
import { formatMoney as formatCurrency, isMoneyField, parseMoneyValue } from '@/app/utils/money';
import type { PurchaseSettingModule } from '@/app/templates/purchase-settings-template';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwCategoryPickerModal from '@/components/form-page/AwCategoryPickerModal.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import AwSourcePickerModal from '@/components/form-page/AwSourcePickerModal.vue';
import type { AttachmentRow, CategoryPickerConfirmPayload, CategoryPickerGroup, EditableColumn, FormAction, SourcePickerCategory, SourcePickerConfirmPayload, SourcePickerRow } from '@/components/form-page/types';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import PurchaseSettingPage from '@/views/purchase/shared/PurchaseSettingPage.vue';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import type { AuditActionPayload, AuditApprovalNode, AuditDocumentSummary, DetailAction, DetailTabItem } from '@/components/detail-page/types';

type AnyRow = Record<string, any>;

interface ModuleConfig {
  title: string;
  searchPlaceholder: string;
  createLabel: string;
  columns: AwTableColumn[];
  linkKey: string;
  bulkActions: AwBulkAction[];
}

const route = useRoute();
const router = useRouter();
const items = ref<PurchaseRow[]>([]);
const keyword = ref('');
const pickedTree = ref('all');
const columnFilters = reactive<Record<string, string>>({});
const draftFilters = reactive<Record<string, string>>({});
const filterModalOpen = ref(false);
const columnsModalOpen = ref(false);
const listMessage = ref('');
const visibleColumnKeys = ref<string[]>([]);
const moduleKey = computed<PurchaseModule>(() => {
  if (route.path.endsWith('/purchase-requests')) return 'requests';
  if (route.path.endsWith('/purchase-inquiries')) return 'inquiries';
  if (route.path.endsWith('/purchase-orders')) return 'orders';
  return 'suppliers';
});
const settingModule = computed<PurchaseSettingModule | null>(() => route.query.setting ? moduleKey.value : null);
const isCreate = computed(() => route.query.action === 'new');
const moduleDetailActions = ['请购明细'];
const isModuleDetailEntry = computed(() => typeof route.query.action === 'string' && moduleDetailActions.includes(route.query.action));
const detailId = computed(() => typeof route.query.id === 'string' ? route.query.id : '');

const configs: Record<PurchaseModule, ModuleConfig> = {
  suppliers: {
    title: '供应商管理',
    searchPlaceholder: '全局搜索（如供应商、编号、联系人）',
    createLabel: '新增供应商',
    linkKey: 'name',
    bulkActions: [{ key: 'transfer', label: '批量转移' }, { key: 'assign', label: '批量指定' }],
    columns: [
      { key: 'code', title: '供应商编号', width: 140, link: true },
      { key: 'name', title: '供应商名称', width: 220, link: true },
      { key: 'type', title: '分类', width: 130, filterOptions: ['原材料供应商', '零部件供应商', '包装供应商', '服务供应商', '临时供应商'] },
      { key: 'category', title: '细分类', width: 120 },
      { key: 'contact', title: '联系人', width: 90 },
      { key: 'phone', title: '联系方式', width: 130 },
      { key: 'state', title: '状态', width: 100, filterOptions: ['临时', '已审核', '待审核', '已停用'] },
      { key: 'source', title: '来源', width: 160 },
      { key: 'date', title: '创建日期', width: 120 },
      { key: 'action', title: '操作', width: 80, fixed: 'right' },
    ],
  },
  requests: {
    title: '请购管理',
    searchPlaceholder: '全局搜索（如请购主题、编号、关联单据）',
    createLabel: '新增请购',
    linkKey: 'topic',
    bulkActions: [{ key: 'batch', label: '批量操作' }],
    columns: [
      { key: 'topic', title: '请购主题', width: 190, link: true },
      { key: 'code', title: '请购编号', width: 150 },
      { key: 'ref', title: '关联单据', width: 150 },
      { key: 'source', title: '请购来源', width: 130 },
      { key: 'starter', title: '发起人', width: 110 },
      { key: 'phone', title: '联系方式', width: 140 },
      { key: 'date', title: '申请日期', width: 120 },
      { key: 'printState', title: '打印状态', width: 100 },
      { key: 'state', title: '流程状态', width: 140, filterOptions: ['待提交', '审批中', '已批准', '待询价', '已转询价', '待采购', '已转采购', '部分采购', '已完成', '已关闭', '已驳回'] },
      { key: 'action', title: '操作', width: 80, fixed: 'right' },
    ],
  },
  inquiries: {
    title: '询价管理',
    searchPlaceholder: '全局搜索（如询价主题、编号、产品）',
    createLabel: '新增询价',
    linkKey: 'topic',
    bulkActions: [{ key: 'batch', label: '批量操作' }],
    columns: [
      { key: 'topic', title: '询价主题', width: 210, link: true },
      { key: 'code', title: '询价编号', width: 150 },
      { key: 'product', title: '询价产品', width: 160 },
      { key: 'qty', title: '询价数量', width: 100, numeric: true },
      { key: 'date', title: '询价日期', width: 120 },
      { key: 'deadline', title: '截止日期', width: 120 },
      { key: 'state', title: '询价状态', width: 130, filterOptions: ['询价中', '询价完毕', '待定价', '已定价', '作废'] },
      { key: 'action', title: '操作', width: 80, fixed: 'right' },
    ],
  },
  orders: {
    title: '采购订单',
    searchPlaceholder: '全局搜索（如采购编号、供应商、产品）',
    createLabel: '新增采购',
    linkKey: 'code',
    bulkActions: [{ key: 'batch', label: '批量操作' }],
    columns: [
      { key: 'code', title: '采购编号', width: 150, link: true },
      { key: 'supplier', title: '供应商', width: 170 },
      { key: 'summary', title: '产品概要', width: 130 },
      { key: 'date', title: '采购日期', width: 120 },
      { key: 'amount', title: '采购金额', width: 120 },
      { key: 'paid', title: '已付金额', width: 110 },
      { key: 'invoice', title: '到票金额', width: 110 },
      { key: 'match', title: '三单匹配', width: 110 },
      { key: 'provisional', title: '暂估应付', width: 110 },
      { key: 'certified', title: '发票认证', width: 100 },
      { key: 'deduction', title: '质检扣款', width: 110 },
      { key: 'payable', title: '可付款', width: 110 },
      { key: 'arrival', title: '预计到货', width: 120 },
      { key: 'state', title: '采购状态', width: 130, filterOptions: ['审核中', '采购中', '运输中', '待入库', '异常取消', '部分入库', '已完成'] },
      { key: 'action', title: '操作', width: 80, fixed: 'right' },
    ],
  },
};

const moduleConfig = computed(() => configs[moduleKey.value]);
const filterableColumns = computed(() => moduleConfig.value.columns.filter((column) => column.filterOptions?.length));
const activeColumns = computed(() => moduleConfig.value.columns.filter((column) => visibleColumnKeys.value.includes(column.key)));
const tableRows = computed(() => filteredItems.value.map((row) => ({ ...row, action: '查看' })));
const filteredItems = computed(() => {
  const term = keyword.value.trim();
  return items.value.filter((item) => {
    const keywordMatched = !term || JSON.stringify(item).includes(term);
    const treeMatched = moduleKey.value !== 'suppliers' || pickedTree.value === 'all' || item.type === pickedTree.value || item.category === pickedTree.value;
    const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || item[key] === value);
    return keywordMatched && treeMatched && filterMatched;
  });
});
const supplierTreeNodes = computed<AwTreeNode[]>(() => {
  const counts = items.value.reduce<Record<string, number>>((acc, item) => {
    for (const key of [String(item.type || ''), String(item.category || '')]) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const groups = [
    ['原材料供应商', ['金属材料', '电子元器件', '化工材料']],
    ['零部件供应商', ['机械零件', '电气零件']],
    ['包装供应商', ['纸箱类', '塑料类']],
    ['服务供应商', ['物流服务', '检测服务']],
    ['临时供应商', ['询价新增', '待转正']],
  ];
  return [
    { key: 'all', label: '全部供应商', count: items.value.length, icon: 'line-users', level: 2, open: true },
    ...groups.flatMap(([group, kids]) => [
      { key: group as string, label: group as string, count: counts[group as string] || 0, icon: 'line-folder', level: 2 as const, open: true },
      ...(kids as string[]).map((kid) => ({ key: kid, label: kid, count: counts[kid] || 0, icon: 'line-node', level: 3 as const })),
    ]),
  ];
});

function tableCellValue(value: unknown, column: AwTableColumn) {
  if (isMoneyField(column.key, column.title)) return formatMoney(value);
  return value ?? '-';
}
const createComponent = computed(() => ({
  suppliers: SupplierCreate,
  requests: RequestCreate,
  inquiries: InquiryCreate,
  orders: OrderCreate,
})[moduleKey.value]);

watch(() => route.fullPath, () => {
  if (settingModule.value || isCreate.value || isModuleDetailEntry.value) return;
  keyword.value = '';
  pickedTree.value = 'all';
  Object.keys(columnFilters).forEach((key) => delete columnFilters[key]);
  visibleColumnKeys.value = moduleConfig.value.columns.map((column) => column.key);
  loadData();
}, { immediate: true });

async function loadData() {
  const result = await listPurchase(moduleKey.value, { pageNo: 1, pageSize: 50 });
  items.value = result.items;
}

async function handleRefresh() {
  await loadData();
  listMessage.value = `${moduleConfig.value.title}已刷新，共 ${filteredItems.value.length} 条。`;
}

function setColumnFilter(key: string, value: string) {
  columnFilters[key] = value;
}

function openFilterModal() {
  Object.keys(draftFilters).forEach((key) => delete draftFilters[key]);
  filterableColumns.value.forEach((column) => draftFilters[column.key] = columnFilters[column.key] || '');
  filterModalOpen.value = true;
}

function applyFilterModal() {
  Object.keys(columnFilters).forEach((key) => delete columnFilters[key]);
  Object.entries(draftFilters).forEach(([key, value]) => {
    if (value) columnFilters[key] = value;
  });
  filterModalOpen.value = false;
  listMessage.value = `筛选已应用，当前 ${filteredItems.value.length} 条。`;
}

function openColumnsModal() {
  columnsModalOpen.value = true;
}

function applyColumnsModal() {
  columnsModalOpen.value = false;
  listMessage.value = '字段配置已应用。';
}

function toggleColumn(key: string) {
  if (key === 'action') return;
  visibleColumnKeys.value = visibleColumnKeys.value.includes(key)
    ? visibleColumnKeys.value.filter((item) => item !== key)
    : [...visibleColumnKeys.value, key];
}

function handleImport() {
  listMessage.value = `${moduleConfig.value.title}导入模板已准备，可按当前字段回填数据。`;
}

function handleExport() {
  listMessage.value = `${moduleConfig.value.title}导出任务已创建，共 ${filteredItems.value.length} 条。`;
}

function goCreate() {
  router.push({ path: route.path, query: { action: 'new' } });
}

function goList() {
  router.push({ path: route.path });
}

function openDetail(id: string) {
  router.push({ path: route.path, query: { id } });
}

function formatMoney(value: unknown) {
  return formatCurrency(value);
}

const baseActions: FormAction[] = [
  { key: 'draft', label: '暂存' },
  { key: 'reset', label: '重置' },
  { key: 'submit', label: '提交审批', primary: true },
];

const personDepts = [
  { key: 'purchase', label: '采购中心', persons: [
    { id: 'CG001', name: '老夏', role: '采购主管', phone: '13800000001', dept: '采购中心' },
    { id: 'CG002', name: '李文涛', role: '采购员', phone: '13800000002', dept: '采购中心' },
    { id: 'CG003', name: '陈思源', role: '采购员', phone: '13800000003', dept: '采购中心' },
  ] },
  { key: 'finance', label: '财务中心', persons: [{ id: 'CW001', name: '顾伦', role: '应付会计', phone: '13900000001', dept: '财务中心' }] },
];

const ProductPickerModal = defineComponent({
  props: { open: Boolean, supplierName: String },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const picked = ref<string[]>([]);
    const activeCategory = ref('全部物料');
    const rows = computed(() => props.supplierName ? purchaseProducts.filter((row) => row.supplier === props.supplierName) : purchaseProducts);
    const categories = computed(() => ['全部物料', ...Array.from(new Set(rows.value.map((row) => row.categoryName || '未分类')))]);
    const visibleRows = computed(() => activeCategory.value === '全部物料' ? rows.value : rows.value.filter((row) => (row.categoryName || '未分类') === activeCategory.value));
    const toggle = (id: string) => picked.value = picked.value.includes(id) ? picked.value.filter((item) => item !== id) : [...picked.value, id];
    watch(() => props.open, (open) => { if (open) activeCategory.value = '全部物料'; });
    return () => props.open ? h('div', { class: 'aw-mask', onClick: () => emit('cancel') }, [
      h('div', { class: 'aw-modal aw-purchase-modal', onClick: (event: Event) => event.stopPropagation() }, [
        h('div', { class: 'head' }, [h('span', '选择物料'), h('button', { class: 'aw-modal-close', onClick: () => emit('cancel') }, '×')]),
        h('div', { class: 'body', style: { display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', gap: '12px', padding: '12px 16px' } }, [
          h('aside', { style: { display: 'grid', alignContent: 'start', gap: '4px', padding: '8px', borderRight: '1px solid var(--aw-border)', background: 'var(--aw-surface-2)', minHeight: '280px' } }, categories.value.map((category) => h('button', {
            class: activeCategory.value === category ? 'on' : '',
            type: 'button',
            style: {
              border: '0',
              borderRadius: '6px',
              background: activeCategory.value === category ? 'var(--aw-primary-soft)' : 'transparent',
              color: activeCategory.value === category ? 'var(--aw-primary)' : 'var(--aw-fg-2)',
              cursor: 'pointer',
              padding: '9px 10px',
              textAlign: 'left',
            },
            onClick: () => activeCategory.value = category,
          }, category))),
          h('section', { style: { minWidth: '0' } }, [
            h('div', { class: 'aw-picker-count' }, `已勾选 ${picked.value.length} 项`),
            h('div', { class: 'aw-doc-tbl-inner' }, [h('table', { class: 'aw-doc-tbl' }, [
              h('thead', [h('tr', ['','物料编号','物料名称','规格型号','物料分类','品牌','单位'].map((title) => h('th', title)))]),
              h('tbody', visibleRows.value.map((row) => h('tr', { class: picked.value.includes(row.id) ? 'picked' : '', onClick: () => toggle(row.id) }, [
                h('td', [h('input', { type: 'checkbox', checked: picked.value.includes(row.id) })]),
                h('td', { class: 'aw-num' }, row.productNo),
                h('td', { class: 'aw-link' }, row.productName),
                h('td', row.model),
                h('td', row.categoryName),
                h('td', row.brand || '通用'),
                h('td', row.unit),
              ]))),
            ])]),
          ]),
        ]),
        h('div', { class: 'foot' }, [h('button', { class: 'aw-btn', onClick: () => emit('cancel') }, '取消'), h('button', { class: 'aw-btn primary', onClick: () => emit('confirm', rows.value.filter((row) => picked.value.includes(row.id))) }, '确定')]),
      ]),
    ]) : null;
  },
});

const SupplierPickerModal = defineComponent({
  props: { open: Boolean },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const selected = ref(purchaseSuppliers[0].id);
    return () => props.open ? h('div', { class: 'aw-mask', onClick: () => emit('cancel') }, [
      h('div', { class: 'aw-modal aw-purchase-modal small', onClick: (event: Event) => event.stopPropagation() }, [
        h('div', { class: 'head' }, [h('span', '选择供应商'), h('button', { class: 'aw-modal-close', onClick: () => emit('cancel') }, '×')]),
        h('div', { class: 'body' }, [h('table', { class: 'aw-doc-tbl' }, [
          h('thead', [h('tr', ['','供应商名称','等级','联系人','联系电话'].map((title) => h('th', title)))]),
          h('tbody', purchaseSuppliers.map((row) => h('tr', { class: selected.value === row.id ? 'picked' : '', onClick: () => selected.value = row.id }, [
            h('td', [h('input', { type: 'radio', checked: selected.value === row.id })]),
            h('td', { class: 'aw-link' }, row.name),
            h('td', row.level),
            h('td', row.contact),
            h('td', row.phone),
          ]))),
        ])]),
        h('div', { class: 'foot' }, [h('button', { class: 'aw-btn', onClick: () => emit('cancel') }, '取消'), h('button', { class: 'aw-btn primary', onClick: () => emit('confirm', purchaseSuppliers.find((row) => row.id === selected.value)) }, '确定')]),
      ]),
    ]) : null;
  },
});

const SourcePickerModal = defineComponent({
  props: { open: Boolean, kind: { type: String, default: 'inquiry' } },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const selectedId = ref('');
    const sourceRows = computed(() => props.kind === 'order' ? orderSources : inquirySources);
    const sourceCategories = computed<SourcePickerCategory[]>(() =>
      (props.kind === 'order' ? ['请购', '询价', 'MRP采购建议'] : ['请购明细', '采购计划', '库存补货']).map((item) => ({ key: item, label: props.kind === 'order' ? `${item}列表` : item, icon: 'line-doc' })),
    );
    const pickerRows = computed<SourcePickerRow[]>(() => sourceRows.value.map((row) => ({
      cat: row.type,
      code: row.code,
      subject: row.title,
      date: row.date,
      customer: row.supplier || '-',
      maxQty: row.products.length,
    })));
    const confirmSource = (source: SourcePickerConfirmPayload) => {
      const picked = sourceRows.value.find((row) => row.code === source.code);
      if (picked) emit('confirm', picked);
    };
    watch(() => props.open, () => { selectedId.value = ''; });
    return () => h(AwSourcePickerModal, {
      open: props.open,
      title: props.kind === 'order' ? '选择订单来源' : '选择询价来源',
      currentCustomer: '',
      categories: sourceCategories.value,
      rows: pickerRows.value,
      onCancel: () => emit('cancel'),
      onConfirm: confirmSource,
    });
  },
});

const SupplierReasonModal = defineComponent({
  props: { open: Boolean, supplierName: String },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const reason = ref('');
    return () => props.open ? h('div', { class: 'aw-mask', onClick: () => emit('cancel') }, [
      h('div', { class: 'aw-modal aw-purchase-modal small', onClick: (event: Event) => event.stopPropagation() }, [
        h('div', { class: 'head' }, [h('span', '更换供应商提醒'), h('button', { class: 'aw-modal-close', onClick: () => emit('cancel') }, '×')]),
        h('div', { class: 'body' }, [
          h('div', { class: 'aw-form-note' }, `当前供应商：${props.supplierName || '未选择'}。更换供应商会触发审核流程，请填写更换理由后继续选择新的供应商。`),
          h('div', { class: 'aw-field' }, [h('label', { class: 'req' }, '更换理由'), h('textarea', { class: 'aw-input reason-area', value: reason.value, placeholder: '请输入更换供应商的原因', onInput: (event: Event) => reason.value = (event.target as HTMLTextAreaElement).value })]),
        ]),
        h('div', { class: 'foot' }, [h('button', { class: 'aw-btn', onClick: () => emit('cancel') }, '取消'), h('button', { class: 'aw-btn primary', onClick: () => reason.value.trim() && emit('confirm', reason.value.trim()) }, '确定')]),
      ]),
    ]) : null;
  },
});

const SupplierCreate = defineComponent({
  emits: ['back'],
  setup(_, { emit }) {
    const form = reactive<AnyRow>({ name: '', pinyin: '', type: '', category: '', categoryPath: '', categoryParentKey: '', categoryCode: '', supplierType: '正式供应商', source: '', creditCode: '', buyer: '' });
    const tab = ref('product');
    const productRows = ref<AnyRow[]>([]);
    const contactRows = ref<AnyRow[]>([{ id: 1, isDefault: true }]);
    const financeRows = ref<AnyRow[]>([{ id: 1, isDefault: true }]);
    const addressRows = ref<AnyRow[]>([{ id: 1, isDefault: true, addressType: '收货地址' }]);
    const attachRows = ref<AttachmentRow[]>([{ id: 'supplier-attach-1', name: '供应商资质.PDF', type: '资质文件', date: '2026-05-30', remark: '首版资质附件' }]);
    const message = ref('');
    const showProduct = ref(false);
    const showPerson = ref(false);
    const showSupplierCategory = ref(false);
    const pickedPeople = ref<any[]>([]);
    const detail = ref('');
    const confirmSupplierCategory = (payload: CategoryPickerConfirmPayload) => {
      form.type = payload.parent.label;
      form.category = payload.child.label;
      form.categoryPath = `${payload.parent.label} / ${payload.child.label}`;
      form.categoryParentKey = payload.parent.key;
      form.categoryCode = payload.child.key;
      showSupplierCategory.value = false;
    };
    const addProducts = (rows: PurchaseProduct[]) => { productRows.value.push(...rows.map((row, index) => ({ ...row, id: `${row.id}-${Date.now()}-${index}`, supplyUnit: row.unit, ratio: 1, brand: row.brand || '通用' }))); showProduct.value = false; };
    const submit = async (key: string) => {
      if (key === 'reset') {
        if (!confirmClear('当前供应商草稿')) return;
        productRows.value = [];
        contactRows.value = [{ id: 1, isDefault: true }];
        attachRows.value = [{ id: 'supplier-attach-1', name: '供应商资质.PDF', type: '资质文件', date: '2026-05-30', remark: '首版资质附件' }];
        message.value = '已重置。';
        return;
      }
      await createPurchase('suppliers', { ...form, buyer: form.buyer, products: productRows.value, contacts: contactRows.value, finances: financeRows.value, addresses: addressRows.value, attachments: attachRows.value, detail: detail.value });
      message.value = key === 'draft' ? '供应商草稿已通过新增接口保存。' : '供应商已通过新增接口提交审批。';
    };
    return () => h(AwFormPage, { actions: baseActions, onBack: () => emit('back'), onAction: submit }, () => [
      section('基础信息', h('div', { class: 'aw-form-grid' }, [
        field('供应商名称', h('input', { class: 'aw-input', value: form.name, placeholder: '请输入供应商全称', onInput: (e: Event) => form.name = val(e) }), true),
        field('拼音号', h('input', { class: 'aw-input', value: form.pinyin, placeholder: '根据名称自动生成，可手动修改', onInput: (e: Event) => form.pinyin = val(e) })),
        field('供应商编号', h('input', { class: 'aw-input', value: '系统自动生成', disabled: true })),
        field('供应商分类', h('div', { class: 'aw-field-row' }, [
          h('input', { class: 'aw-input', value: form.categoryPath || form.type, readonly: true, placeholder: '请选择供应商分类', onClick: () => showSupplierCategory.value = true }),
          h('button', { class: 'aw-tool-btn', type: 'button', onClick: () => showSupplierCategory.value = true }, '选择'),
        ]), true),
        field('供应商类型', select(['正式供应商', '临时供应商'], form.supplierType, (v) => form.supplierType = v), true),
        field('信用代码', h('input', { class: 'aw-input', value: form.creditCode, placeholder: '请输入18位统一社会信用代码', onInput: (e: Event) => form.creditCode = val(e) }), true),
        field('采购人员', h('div', { class: 'aw-field-row' }, [h('input', { class: 'aw-input', value: form.buyer, readonly: true, placeholder: '点击右侧按钮选择采购人员' }), h('button', { class: 'aw-tool-btn', onClick: () => showPerson.value = true }, '选择')]), false),
      ])),
      section('供应商详情', [
        tabs(tab, [['product', '供应产品'], ['contact', '联系人信息'], ['finance', '财务信息'], ['address', '地址信息'], ['attach', '附件信息']]),
        tab.value === 'product' ? h(AwEditableSubTable, { columns: productColumns, rows: productRows.value, addText: '新增供应产品', onAdd: () => showProduct.value = true }, tableSlots({ delete: (row: AnyRow) => productRows.value = productRows.value.filter((item) => item.id !== row.id) })) : null,
        tab.value === 'contact' ? editableRows(contactRows, contactColumns, '新增联系人') : null,
        tab.value === 'finance' ? editableRows(financeRows, financeColumns, '新增银行卡号') : null,
        tab.value === 'address' ? editableRows(addressRows, addressColumns, '新增地址') : null,
        tab.value === 'attach' ? h(AwAttachmentTable, {
          rows: attachRows.value,
          typeOptions: ['资质文件', '营业执照', '报价附件', '审批材料'],
          addText: '新增附件信息',
          allowRemoveLast: true,
          onAdd: () => attachRows.value.push({ id: `supplier-attach-${Date.now()}`, name: '', type: '资质文件', date: '2026-05-30', remark: '' }),
          onUpload: (row: AttachmentRow) => message.value = `${row.name || '附件'} 已触发上传。`,
          onRemove: (row: AttachmentRow) => {
            if (confirmRemove(`附件 ${row.name || ''}`)) attachRows.value = attachRows.value.filter((item) => item.id !== row.id);
          },
        }) : null,
      ]),
      section('供应商详情说明', h(AwRichTextEditor, { modelValue: detail.value, 'onUpdate:modelValue': (v: string) => detail.value = v, placeholder: '请输入供应商介绍、资质能力、合作说明、风险备注等详情内容' })),
      message.value ? h('div', { class: 'aw-form-note' }, message.value) : null,
      h(ProductPickerModal, { open: showProduct.value, onCancel: () => showProduct.value = false, onConfirm: addProducts }),
      h(AwPersonPickerModal, { open: showPerson.value, title: '选择采购人员', depts: personDepts, picked: pickedPeople.value, onCancel: () => showPerson.value = false, onConfirm: (people: any[]) => { pickedPeople.value = people.slice(0, 1); form.buyer = pickedPeople.value.map((p) => p.name).join('、'); showPerson.value = false; } }),
      h(AwCategoryPickerModal, { open: showSupplierCategory.value, title: '选择供应商分类', groups: supplierCategoryGroups, defaultParentKey: form.categoryParentKey, defaultChildKey: form.categoryCode, onCancel: () => showSupplierCategory.value = false, onConfirm: confirmSupplierCategory }),
    ]);
  },
});

const RequestCreate = defineComponent({
  emits: ['back'],
  setup(_, { emit }) {
    const form = reactive({ topic: '', source: '', ref: '', requestDate: '自动', needDate: '' });
    const rows = ref<AnyRow[]>([]);
    const showProduct = ref(false);
    const supplierTarget = ref('');
    const message = ref('');
    const detail = ref('');
    const addProducts = (products: PurchaseProduct[]) => { rows.value.push(...products.map((p, i) => ({ ...p, id: `${p.id}-${Date.now()}-${i}`, qty: '', date: '', usage: '', supplier: p.supplier }))); showProduct.value = false; };
    const submit = async (key: string) => {
      if (key === 'reset') {
        if (!confirmClear('当前请购草稿')) return;
        rows.value = [];
        message.value = '已重置。';
        return;
      }
      await createPurchase('requests', { ...form, rows: rows.value, detail: detail.value });
      message.value = key === 'draft' ? '请购草稿已通过新增接口保存。' : '请购已通过新增接口提交审批。';
    };
    return () => h(AwFormPage, { actions: baseActions, onBack: () => emit('back'), onAction: submit }, () => [
      section('基础信息', h('div', { class: 'aw-form-grid' }, [
        field('请购主题', h('input', { class: 'aw-input', value: form.topic, placeholder: '填写请购主题', onInput: (e: Event) => form.topic = val(e) }), true),
        field('请购编号', h('input', { class: 'aw-input', value: '自动生成', disabled: true })),
        field('请购来源', select(['请选择', '项目请购', '生产缺料', '库存补货', '研发试制'], form.source, (v) => form.source = v), true),
        field('关联单据', h('input', { class: 'aw-input', value: form.ref, placeholder: '填写或选择关联单据', onInput: (e: Event) => form.ref = val(e) })),
        field('请购日期', h('input', { class: 'aw-input', value: form.requestDate, onInput: (e: Event) => form.requestDate = val(e) }), true),
        field('需求日期', h('input', { class: 'aw-input', value: form.needDate, placeholder: '请选择', onInput: (e: Event) => form.needDate = val(e) })),
      ])),
      section('请购明细', [h(AwEditableSubTable, { columns: requestLineColumns, rows: rows.value, addText: '新增明细', onAdd: () => showProduct.value = true }, tableSlots({ supplier: (row: AnyRow) => supplierTarget.value = row.id, delete: (row: AnyRow) => rows.value = rows.value.filter((item) => item.id !== row.id) })), totalBar([['请购总数量', rows.value.reduce((sum, row) => sum + Number(row.qty || 0), 0)]])]),
      section('请购详情', h(AwRichTextEditor, { modelValue: detail.value, 'onUpdate:modelValue': (v: string) => detail.value = v })),
      message.value ? h('div', { class: 'aw-form-note' }, message.value) : null,
      h(ProductPickerModal, { open: showProduct.value, onCancel: () => showProduct.value = false, onConfirm: addProducts }),
      h(SupplierPickerModal, { open: Boolean(supplierTarget.value), onCancel: () => supplierTarget.value = '', onConfirm: (supplier: any) => { rows.value = rows.value.map((row) => row.id === supplierTarget.value ? { ...row, supplier: supplier.name } : row); supplierTarget.value = ''; } }),
    ]);
  },
});

const InquiryCreate = defineComponent({
  emits: ['back'],
  setup(_, { emit }) {
    const form = reactive({ topic: '', deadline: '' });
    const rows = ref<AnyRow[]>([]);
    const showProduct = ref(false);
    const showSource = ref(false);
    const message = ref('');
    const detail = ref('');
    const addInquiryRows = (products: PurchaseProduct[]) => {
      rows.value.push(...products.map((p, i) => ({ ...p, id: `${p.id}-${Date.now()}-${i}`, qty: '', suppliers: formalSuppliers(p) })));
      showProduct.value = false;
    };
    const applySource = (source: PurchaseSource) => {
      form.topic = source.title;
      rows.value = source.products.map((p, i) => ({ ...p, id: `${source.id}-${i}`, sourceDoc: source.code, qty: p.qty || '', suppliers: formalSuppliers(p) }));
      showSource.value = false;
    };
    const submit = async (key: string) => {
      if (key === 'reset') {
        if (!confirmClear('当前询价草稿')) return;
        rows.value = [];
        message.value = '已重置。';
        return;
      }
      await createPurchase('inquiries', { ...form, rows: rows.value, detail: detail.value });
      message.value = key === 'draft' ? '询价草稿已通过新增接口保存。' : '询价已通过新增接口提交审批。';
    };
    return () => h(AwFormPage, { actions: baseActions, onBack: () => emit('back'), onAction: submit }, () => [
      section('基础信息', h('div', { class: 'aw-form-grid' }, [
        field('询价主题', h('div', { class: 'aw-field-row' }, [h('input', { class: 'aw-input', value: form.topic, placeholder: '手动输入询价主题', onInput: (e: Event) => form.topic = val(e) }), h('button', { class: 'aw-tool-btn', onClick: () => showSource.value = true }, '选择询价来源')]), true),
        field('询价编号', h('input', { class: 'aw-input', value: '自动生成', disabled: true })),
        field('截止日期', h('input', { class: 'aw-input', value: form.deadline, placeholder: '请选择', onInput: (e: Event) => form.deadline = val(e) })),
      ])),
      section('询价明细', [
        h('div', { class: 'aw-doc-tbl-wrap' }, [h('div', { class: 'aw-doc-tbl-inner' }, [h('table', { class: 'aw-doc-tbl inquiry-table' }, [
          h('thead', [h('tr', ['序号','产品名称','产品编号','产品型号','产品分类','标准单位','数量','来源明细','供应商','供应商类型','单价','是否含税','折扣','金额','税额','交货期','最小采购量','采购生成','操作'].map((t) => h('th', t)))]),
          h('tbody', rows.value.length ? rows.value.flatMap((row, index) => [
            ...renderInquiryProductRows(row, index, rows),
          ]) : [h('tr', [h('td', { colspan: 19, class: 'aw-empty' }, '暂无询价明细，点击“新增明细”选择产品')])]),
        ])])]),
        h('button', { class: 'aw-tool-btn', onClick: () => showProduct.value = true }, '新增明细'),
      ]),
      section('询价详情', h(AwRichTextEditor, { modelValue: detail.value, 'onUpdate:modelValue': (v: string) => detail.value = v })),
      message.value ? h('div', { class: 'aw-form-note' }, message.value) : null,
      h(ProductPickerModal, { open: showProduct.value, onCancel: () => showProduct.value = false, onConfirm: addInquiryRows }),
      h(SourcePickerModal, { open: showSource.value, kind: 'inquiry', onCancel: () => showSource.value = false, onConfirm: applySource }),
    ]);
  },
});

const OrderCreate = defineComponent({
  emits: ['back'],
  setup(_, { emit }) {
    const form = reactive({ topic: '', supplier: '', sourceText: '手动输入', date: '自动', arrival: '' });
    const source = ref<PurchaseSource | null>(null);
    const rows = ref<AnyRow[]>([]);
    const showSource = ref(false);
    const showSupplier = ref(false);
    const showProduct = ref(false);
    const reasonTarget = ref('');
    const pickerTarget = ref('');
    const message = ref('');
    const detail = ref('');
    const applySource = (picked: PurchaseSource) => {
      source.value = picked;
      form.topic = picked.title;
      form.supplier = picked.supplier || '';
      form.sourceText = `${picked.type} / ${picked.code}`;
      rows.value = picked.products.map((p, i) => ({ ...p, id: `${picked.id}-${i}`, qty: p.qty || '', waitPurchaseQty: p.waitPurchaseQty || p.qty || '', amount: p.amount || Number(p.qty || 0) * Number(p.price || 0) }));
      showSource.value = false;
    };
    const addProducts = (products: PurchaseProduct[]) => {
      rows.value.push(...products.map((p, i) => ({ ...p, id: `manual-${Date.now()}-${i}`, sourceLine: '手动', priceSource: '手动定价', qty: '', waitPurchaseQty: '', amount: 0, supplier: form.supplier || p.supplier })));
      showProduct.value = false;
    };
    const submit = async (key: string) => {
      if (key === 'reset') {
        if (!confirmClear('当前采购订单草稿')) return;
        rows.value = [];
        source.value = null;
        message.value = '已重置。';
        return;
      }
      await createPurchase('orders', { ...form, rows: rows.value, detail: detail.value, amount: totalAmount(rows.value) });
      message.value = key === 'draft' ? '采购订单草稿已通过新增接口保存。' : '采购订单已通过新增接口提交审批。';
    };
    const confirmSupplier = (supplier: any) => {
      if (pickerTarget.value) {
        rows.value = rows.value.map((row) => row.id === pickerTarget.value ? { ...row, supplier: supplier.name, supplierChanged: true } : row);
        pickerTarget.value = '';
      } else {
        if (rows.value.length && !confirmClear('当前采购明细')) return;
        form.supplier = supplier.name;
        rows.value = [];
        showSupplier.value = false;
      }
    };
    return () => h(AwFormPage, { actions: baseActions, onBack: () => emit('back'), onAction: submit }, () => [
      section('基础信息', [
        h('div', { class: 'aw-form-grid' }, [
          field('订单主题', h('div', { class: 'aw-field-row' }, [h('input', { class: 'aw-input', value: form.topic, placeholder: '手动输入订单主题', onInput: (e: Event) => form.topic = val(e) }), h('button', { class: 'aw-tool-btn', onClick: () => showSource.value = true }, '选择订单来源')]), true),
          field('采购编号', h('input', { class: 'aw-input', value: '自动生成', disabled: true })),
          field('订单来源', h('input', { class: 'aw-input', value: form.sourceText, readonly: true })),
          field('供应商', h('div', { class: 'aw-field-row' }, [h('input', { class: 'aw-input', value: form.supplier, readonly: true, placeholder: '请选择供应商' }), h('button', { class: 'aw-tool-btn', onClick: () => showSupplier.value = true }, '选择供应商')]), true),
          field('采购日期', h('input', { class: 'aw-input', value: form.date, onInput: (e: Event) => form.date = val(e) }), true),
          field('预计到货', h('input', { class: 'aw-input', type: 'date', value: form.arrival, onInput: (e: Event) => form.arrival = val(e) })),
        ]),
        h('div', { class: 'aw-form-note' }, '采购来源受采购策略控制：可从请购、询价定价、MRP采购建议带入明细；手动采购会记录为手动来源。'),
      ]),
      section('采购明细', [
        h(AwEditableSubTable, { columns: orderLineColumns, rows: rows.value, addText: '新增明细', onAdd: () => showProduct.value = true }, {
          cell: ({ column, row }: any) => orderCell(column.key, row, (id: string) => reasonTarget.value = id),
          actions: ({ row }: any) => h('span', { class: 'aw-link danger', onClick: () => {
            if (confirmRemove(`采购明细 ${row.productName || row.productNo || ''}`)) rows.value = rows.value.filter((item) => item.id !== row.id);
          } }, '删除'),
        }),
        rows.value.length ? totalBar([['本次采购数量', rows.value.reduce((sum, row) => sum + Number(row.qty || 0), 0)], ['本次采购金额', formatMoney(totalAmount(rows.value))]]) : h('div', { class: 'aw-empty' }, '暂无采购明细，可选择订单来源自动带入，或新增明细'),
      ]),
      section('采购备注', h(AwRichTextEditor, { modelValue: detail.value, 'onUpdate:modelValue': (v: string) => detail.value = v })),
      message.value ? h('div', { class: 'aw-form-note' }, message.value) : null,
      h(SourcePickerModal, { open: showSource.value, kind: 'order', onCancel: () => showSource.value = false, onConfirm: applySource }),
      h(SupplierPickerModal, { open: showSupplier.value || Boolean(pickerTarget.value), onCancel: () => { showSupplier.value = false; pickerTarget.value = ''; }, onConfirm: confirmSupplier }),
      h(ProductPickerModal, { open: showProduct.value, supplierName: form.supplier, onCancel: () => showProduct.value = false, onConfirm: addProducts }),
      h(SupplierReasonModal, { open: Boolean(reasonTarget.value), supplierName: rows.value.find((row) => row.id === reasonTarget.value)?.supplier, onCancel: () => reasonTarget.value = '', onConfirm: (reason: string) => { rows.value = rows.value.map((row) => row.id === reasonTarget.value ? { ...row, supplierChangeReason: reason } : row); pickerTarget.value = reasonTarget.value; reasonTarget.value = ''; } }),
    ]);
  },
});

const productColumns: EditableColumn[] = [
  { key: 'productNo', title: '物料编码', width: 130 }, { key: 'productName', title: '物料名称', width: 160 }, { key: 'model', title: '规格型号', width: 130 }, { key: 'categoryName', title: '物料类别', width: 130 }, { key: 'brand', title: '品牌', width: 100 }, { key: 'unit', title: '标准单位', width: 90 }, { key: 'supplyUnit', title: '供货单位', width: 100 },
];
const contactColumns: EditableColumn[] = [{ key: 'name', title: '联系人' }, { key: 'phone', title: '联系方式' }, { key: 'position', title: '职位' }, { key: 'email', title: '邮箱' }, { key: 'remark', title: '备注' }];
const financeColumns: EditableColumn[] = [{ key: 'bankAccount', title: '银行卡号' }, { key: 'accountName', title: '账户名称' }, { key: 'bankName', title: '开户行' }, { key: 'accountType', title: '账户类型' }, { key: 'remark', title: '备注' }];
const addressColumns: EditableColumn[] = [{ key: 'addressType', title: '地址类型' }, { key: 'contact', title: '收件人' }, { key: 'phone', title: '联系电话' }, { key: 'address', title: '详细地址' }];
const requestLineColumns: EditableColumn[] = [{ key: 'productName', title: '产品名称', width: 150 }, { key: 'productNo', title: '产品编号', width: 130 }, { key: 'model', title: '产品型号', width: 130 }, { key: 'categoryName', title: '产品分类', width: 130 }, { key: 'brand', title: '品牌', width: 100 }, { key: 'unit', title: '产品单位', width: 90 }, { key: 'qty', title: '请购数量', width: 110 }, { key: 'date', title: '交货日期', width: 120 }, { key: 'supplier', title: '建议供应商', width: 150 }, { key: 'usage', title: '用途说明', width: 150 }];
const orderLineColumns: EditableColumn[] = [{ key: 'productName', title: '产品名称', width: 150 }, { key: 'productNo', title: '产品编号', width: 130 }, { key: 'model', title: '产品型号', width: 130 }, { key: 'categoryName', title: '产品分类', width: 130 }, { key: 'brand', title: '品牌', width: 100 }, { key: 'unit', title: '产品单位', width: 90 }, { key: 'qty', title: '采购数量', width: 110 }, { key: 'price', title: '采购单价', width: 100 }, { key: 'amount', title: '采购金额', width: 110 }, { key: 'arrival', title: '预计到货', width: 120 }, { key: 'supplier', title: '供应商', width: 170 }];
const supplierCategoryGroups: CategoryPickerGroup[] = [
  { key: 'raw', label: '原材料供应商', children: [{ key: 'raw-metal', label: '金属材料' }, { key: 'raw-electronic', label: '电子元器件' }, { key: 'raw-chemical', label: '化工材料' }] },
  { key: 'part', label: '零部件供应商', children: [{ key: 'part-mechanical', label: '机械零件' }, { key: 'part-electric', label: '电气零件' }, { key: 'part-standard', label: '标准件' }] },
  { key: 'package', label: '包装供应商', children: [{ key: 'package-carton', label: '纸箱类' }, { key: 'package-plastic', label: '塑料类' }, { key: 'package-label', label: '标签耗材' }] },
  { key: 'service', label: '服务供应商', children: [{ key: 'service-test', label: '检测服务' }, { key: 'service-logistics', label: '物流服务' }, { key: 'service-outsourcing', label: '委外加工' }] },
  { key: 'temp', label: '临时供应商', children: [{ key: 'temp-inquiry', label: '询价新增' }, { key: 'temp-trial', label: '试供供应商' }, { key: 'temp-pending', label: '待转正' }] },
];

function section(title: string, children: any) {
  return h('section', { class: 'aw-form-card' }, [h('div', { class: 'aw-detail-section-title' }, title), children]);
}
function field(label: string, child: any, required = false) {
  return h('div', { class: 'aw-field' }, [h('label', { class: required ? 'req' : '' }, label), child]);
}
function select(options: string[], value: string, onChange: (value: string) => void) {
  return h('select', { class: 'aw-select', value, onChange: (event: Event) => onChange(val(event)) }, options.map((option) => h('option', { value: option === '请选择' ? '' : option }, option)));
}
function val(event: Event) {
  return (event.target as HTMLInputElement).value;
}
function supplierCells(row: AnyRow, supplier: AnyRow, index: number) {
  return [
    h('td', `${index + 1} / ${supplier.sourceLine}`),
    h('td', [h('input', { class: 'aw-input', value: supplier.supplier, placeholder: '选择供应商', onInput: (e: Event) => supplier.supplier = val(e) })]),
    h('td', supplier.temp ? '临时供应商' : '正式供应商'),
    h('td', [h('input', { class: 'aw-input', value: supplier.price, placeholder: '¥ 0:00', onInput: (e: Event) => { supplier.price = val(e); calcQuote(row, supplier); } })]),
    h('td', select(['是', '否'], supplier.taxed, (v) => supplier.taxed = v)),
    h('td', [h('input', { class: 'aw-input', value: supplier.discount, onInput: (e: Event) => supplier.discount = val(e) })]),
    h('td', supplier.amount ? formatMoney(supplier.amount) : ''),
    h('td', supplier.tax ? formatMoney(supplier.tax) : ''),
    h('td', [h('input', { class: 'aw-input', value: supplier.delivery, onInput: (e: Event) => supplier.delivery = val(e) })]),
    h('td', [h('input', { class: 'aw-input', value: supplier.minQty, onInput: (e: Event) => supplier.minQty = val(e) })]),
    h('td', '待定价'),
    h('td', [h('span', { class: 'aw-link danger', onClick: () => {
      if (confirmRemove(`供应商报价 ${supplier.supplier || supplier.sourceLine || ''}`)) row.suppliers = row.suppliers.filter((item: AnyRow) => item.id !== supplier.id);
    } }, '删除')]),
  ];
}
function renderInquiryProductRows(row: AnyRow, index: number, rows: { value: AnyRow[] }) {
  const suppliers = row.suppliers || [];
  const first = suppliers[0];
  return [
    h('tr', { class: 'summary' }, [
      h('td', index + 1),
      h('td', row.productName),
      h('td', row.productNo),
      h('td', row.model),
      h('td', row.categoryName),
      h('td', row.unit),
      h('td', [h('input', { class: 'aw-input', value: row.qty, onInput: (e: Event) => row.qty = val(e) })]),
      ...(first ? supplierCells(row, first, 0) : [h('td', [h('span', { class: 'aw-link', onClick: () => row.suppliers.push(tempSupplier(row)) }, '+ 新增供应商')]), h('td', { colspan: 11 })]),
    ]),
    ...suppliers.slice(1).map((supplier: AnyRow, supplierIndex: number) => h('tr', [h('td'), h('td'), h('td'), h('td'), h('td'), h('td'), h('td'), ...supplierCells(row, supplier, supplierIndex + 1)])),
    h('tr', [h('td'), h('td'), h('td'), h('td'), h('td'), h('td'), h('td'), h('td', [h('span', { class: 'aw-link', onClick: () => row.suppliers.push(tempSupplier(row)) }, '+ 新增供应商')]), h('td', { colspan: 11 })]),
  ];
}
function tabs(active: any, items: string[][]) {
  return h('div', { class: 'aw-detail-tabs' }, items.map(([key, label]) => h('button', { class: ['aw-detail-tab', { on: active.value === key }], type: 'button', onClick: () => active.value = key }, label)));
}
function tableSlots(options: { supplier?: (row: AnyRow) => void; delete: (row: AnyRow) => void }) {
  return {
    cell: ({ column, row }: any) => {
      if (column.key === 'supplier') return h('div', { class: 'aw-field-row' }, [h('input', { class: 'aw-input', value: row.supplier || '', readonly: true, placeholder: '请选择供应商' }), h('button', { class: 'aw-tool-btn mini', onClick: () => options.supplier?.(row) }, '选')]);
      if (column.key === 'unit' || column.key === 'productNo' || column.key === 'categoryName' || column.key === 'brand') return h('input', { class: 'aw-input readonly', value: row[column.key] || '', readonly: true });
      return h('input', { class: 'aw-input', value: row[column.key] || '', onInput: (e: Event) => row[column.key] = val(e) });
    },
    actions: ({ row }: any) => h('span', { class: 'aw-link danger', onClick: () => {
      const label = row.productName || row.name || row.bankAccount || row.address || '该明细';
      if (confirmRemove(String(label))) options.delete(row);
    } }, '删除'),
  };
}
function editableRows(rows: any, columns: EditableColumn[], addText: string) {
  return h(AwEditableSubTable, { columns, rows: rows.value, addText, onAdd: () => rows.value.push({ id: Date.now() }) }, tableSlots({ delete: (row) => rows.value = rows.value.filter((item: AnyRow) => item.id !== row.id) }));
}
function formalSuppliers(product: PurchaseProduct) {
  const names = [product.supplier || '深圳鑫达电子科技有限公司', '广州宏业机械配件有限公司'];
  return names.map((supplier, index) => ({ id: `${product.productNo}-${index}`, sourceLine: '供应商档案', quoteVersion: `V${index + 1}`, supplier, temp: false, price: '', taxed: '是', discount: '', amount: '', tax: '', delivery: '', minQty: '' }));
}
function tempSupplier(row: AnyRow) {
  return { id: `${row.id}-temp-${Date.now()}`, sourceLine: '临时供应商', quoteVersion: `V${row.suppliers.length + 1}`, supplier: '', temp: true, price: '', taxed: '是', discount: '', amount: '', tax: '', delivery: '', minQty: '' };
}
function calcQuote(row: AnyRow, supplier: AnyRow) {
  const amount = Number(row.qty || 0) * parseMoneyValue(supplier.price);
  supplier.amount = amount ? amount.toFixed(2) : '';
  supplier.tax = supplier.taxed === '是' && amount ? (amount * 0.13).toFixed(2) : '0.00';
}
function orderCell(key: string, row: AnyRow, onSupplierChange: (id: string) => void) {
  if (key === 'supplier') return h('div', [h('div', { class: 'aw-field-row' }, [h('input', { class: 'aw-input', value: row.supplier || '', readonly: true }), h('button', { class: 'aw-tool-btn mini', onClick: () => onSupplierChange(row.id) }, '更换')]), row.supplierChanged ? h('div', { class: 'aw-warning-line' }, '已触发审核') : null]);
  if (key === 'qty') return h('input', { class: 'aw-input', value: row.qty || '', onInput: (e: Event) => { row.qty = val(e); row.amount = Number(row.qty || 0) * parseMoneyValue(row.price); } });
  if (key === 'price') return h('span', formatMoney(row.price));
  if (key === 'amount') return h('span', formatMoney(row.amount));
  return h('span', row[key] || '-');
}
function totalAmount(rows: AnyRow[]) {
  return rows.reduce((sum, row) => sum + parseMoneyValue(row.amount), 0);
}
function totalBar(items: [string, unknown][]) {
  return h('div', { class: 'aw-line-total' }, [h('span', '合计'), ...items.map(([label, value]) => h('span', [label, '：', h('strong', isMoneyField('', label) ? formatMoney(value) : String(value))]))]);
}
function confirmRemove(label = '该记录') {
  return window.confirm(`确认删除${label}吗？删除后当前表格会立即移除。`);
}
function confirmClear(label = '当前内容') {
  return window.confirm(`确认清空${label}吗？清空后当前未提交内容会被移除。`);
}

function purchaseReadActions(): DetailAction[] {
  return [
    { key: 'print', label: '打印' },
    { key: 'export', label: '导出' },
  ];
}

function purchaseDetailActions(module: PurchaseModule, state: string): DetailAction[] {
  if (['待审核', '待审批', '审批中', '审核中'].includes(state)) {
    return [{ key: 'approve', label: '审核', primary: true }];
  }
  const actions: Record<PurchaseModule, Record<string, DetailAction[]>> = {
    suppliers: {
      临时: [
        { key: 'regularize', label: '提交转正', primary: true },
        { key: 'edit', label: '编辑' },
        { key: 'delete', label: '删除', danger: true },
      ],
      已审核: [
        { key: 'edit', label: '编辑', primary: true },
        { key: 'disable', label: '停用', danger: true },
      ],
      已停用: [
        { key: 'enable', label: '启用', primary: true },
      ],
    },
    requests: {
      待提交: [
        { key: 'submit', label: '提交审批', primary: true },
        { key: 'edit', label: '编辑' },
        { key: 'delete', label: '删除', danger: true },
      ],
      已驳回: [
        { key: 'edit', label: '编辑', primary: true },
        { key: 'submit', label: '重新提交' },
        { key: 'delete', label: '删除', danger: true },
      ],
      已批准: [
        { key: 'inquire', label: '转询价', primary: true },
        { key: 'purchase', label: '转采购' },
        { key: 'close', label: '关闭' },
      ],
      待询价: [
        { key: 'inquire', label: '转询价', primary: true },
        { key: 'close', label: '关闭' },
      ],
      已转询价: [
        { key: 'purchase', label: '转采购', primary: true },
        { key: 'close', label: '关闭' },
      ],
      待采购: [
        { key: 'purchase', label: '转采购', primary: true },
        { key: 'close', label: '关闭' },
      ],
      已转采购: [
        { key: 'close', label: '关闭' },
      ],
      部分采购: [
        { key: 'purchase', label: '继续采购', primary: true },
        { key: 'close', label: '关闭' },
      ],
      已完成: [],
      已关闭: [],
    },
    inquiries: {
      询价中: [
        { key: 'complete', label: '询价完毕', primary: true },
        { key: 'cancel', label: '作废', danger: true },
      ],
      待定价: [
        { key: 'price', label: '定价', primary: true },
        { key: 'cancel', label: '作废', danger: true },
      ],
      已定价: [
        { key: 'complete', label: '询价完毕', primary: true },
        { key: 'cancel', label: '作废', danger: true },
      ],
      询价完毕: [],
      作废: [],
    },
    orders: {
      采购中: [
        { key: 'ship', label: '发货运输', primary: true },
        { key: 'cancel', label: '异常取消', danger: true },
      ],
      运输中: [
        { key: 'inbound', label: '到货入库', primary: true },
      ],
      待入库: [
        { key: 'partialInbound', label: '部分入库', primary: true },
        { key: 'complete', label: '完成' },
      ],
      部分入库: [
        { key: 'complete', label: '完成', primary: true },
      ],
      已完成: [],
      异常取消: [],
    },
  };
  return [...(actions[module][state] || [{ key: 'edit', label: '编辑' }]), ...purchaseReadActions()];
}

const requestSummaryRows = [
  { id: 'prd-7820864', productNo: '7820864', productName: '半成品物料', model: '规格一', unit: 'KG', sourceCount: 2, totalQty: 1000, purchasedQty: 500, waitQty: 500, forceQuote: '部分', delivery: '2024-12-23', state: '部分采购', tone: 'warn' },
  { id: 'prd-8518691', productNo: '8518691', productName: '铝合金型材', model: 'AL-6061', unit: 'KG', sourceCount: 1, totalQty: 500, purchasedQty: 0, waitQty: 500, forceQuote: '是', delivery: '2024-12-23', state: '待询价', tone: 'info' },
  { id: 'prd-6576642', productNo: '6576642', productName: '精密轴承', model: 'BR-6205', unit: '个', sourceCount: 1, totalQty: 500, purchasedQty: 0, waitQty: 500, forceQuote: '否', delivery: '2024-12-23', state: '待采购', tone: 'info' },
  { id: 'prd-6081578', productNo: '6081578', productName: '外箱包装', model: 'PK-500', unit: '个', sourceCount: 1, totalQty: 500, purchasedQty: 250, waitQty: 250, forceQuote: '否', delivery: '2024-12-23', state: '部分采购', tone: 'warn' },
];

const requestSourceRows: Record<string, AnyRow[]> = {
  'prd-7820864': [
    { id: 'src-7820864-1', code: 'PR-2026-00232', source: '项目请购', object: '项目一', line: 'PR-2026-00232-01', qty: 500, purchasedQty: 250, waitQty: 250, forceQuote: '否', skipReason: '已有有效报价', delivery: '2024-12-23', state: '已转采购' },
    { id: 'src-7820864-2', code: 'PR-2026-00231', source: '生产缺料', object: 'WO-260607-015', line: 'PR-2026-00231-02', qty: 500, purchasedQty: 250, waitQty: 250, forceQuote: '是', skipReason: '-', delivery: '2024-12-23', state: '审批中' },
  ],
  'prd-8518691': [
    { id: 'src-8518691-1', code: 'PR-2026-00232', source: '项目请购', object: '项目一', line: 'PR-2026-00232-03', qty: 500, purchasedQty: 0, waitQty: 500, forceQuote: '是', skipReason: '-', delivery: '2024-12-23', state: '待询价' },
  ],
  'prd-6576642': [
    { id: 'src-6576642-1', code: 'PR-2026-00232', source: '项目请购', object: '项目一', line: 'PR-2026-00232-04', qty: 500, purchasedQty: 0, waitQty: 500, forceQuote: '否', skipReason: '低金额快速采购', delivery: '2024-12-23', state: '已批准' },
  ],
  'prd-6081578': [
    { id: 'src-6081578-1', code: 'PR-2026-00232', source: '库存补货', object: '包装材料月度请购', line: 'PR-2026-00232-05', qty: 500, purchasedQty: 250, waitQty: 250, forceQuote: '否', skipReason: '长期协议价', delivery: '2024-12-23', state: '已转采购' },
  ],
};
const requestIdByCode: Record<string, string> = {
  'PR-2026-00232': 'pr_001',
  'PR-2026-00231': 'pr_002',
  'PR-2026-00230': 'pr_003',
  'PR-2026-00229': 'pr_004',
  'PR-2026-00228': 'pr_005',
  'PR-2026-00227': 'pr_006',
  'PR-2026-00226': 'pr_007',
  'PR-2026-00225': 'pr_008',
};

const PurchaseModuleDetailEntry = defineComponent({
  props: {
    moduleKey: { type: String as () => PurchaseModule, required: true },
  },
  emits: ['back'],
  setup(props, { emit }) {
    const search = ref('');
    const state = ref('全部');
    const selectedProductId = ref('');
    const message = ref('');
    const statusOptions = ['全部', '部分采购', '待询价', '待采购'];
    const visibleRows = computed(() => {
      const term = search.value.trim();
      return requestSummaryRows.filter((row) => {
        const matchKeyword = !term || [row.productNo, row.productName, row.model, row.state].some((text) => String(text).includes(term));
        const matchState = state.value === '全部' || row.state === state.value;
        return matchKeyword && matchState;
      });
    });
    const selectedProduct = computed(() => {
      const productId = selectedProductId.value || (typeof route.query.product === 'string' ? route.query.product : '');
      return requestSummaryRows.find((row) => row.id === productId) || null;
    });
    const selectedSources = computed(() => selectedProduct.value ? requestSourceRows[selectedProduct.value.id] || [] : []);
    const summaryColumns: AwTableColumn[] = [
      { key: 'productNo', title: '产品编号', width: 130, numeric: true },
      { key: 'productName', title: '产品名称', width: 150 },
      { key: 'model', title: '规格型号', width: 130 },
      { key: 'unit', title: '标准单位', width: 90 },
      { key: 'sourceCount', title: '来源数量', width: 110, numeric: true },
      { key: 'totalQty', title: '请购总量', width: 110, numeric: true },
      { key: 'delivery', title: '交货日期', width: 120 },
      { key: 'state', title: '状态', width: 120, filterOptions: ['待询价', '待采购', '部分采购', '已完成'] },
      { key: 'action', title: '操作', width: 90 },
    ];
    const sourceColumns: AwTableColumn[] = [
      { key: 'code', title: '请购单号', width: 150, link: true },
      { key: 'source', title: '请购来源', width: 120 },
      { key: 'object', title: '来源对象', width: 160 },
      { key: 'line', title: '来源明细', width: 150 },
      { key: 'qty', title: '请购数量', width: 100, numeric: true },
      { key: 'purchasedQty', title: '已采购数量', width: 110, numeric: true },
      { key: 'waitQty', title: '待采购数量', width: 110, numeric: true },
      { key: 'forceQuote', title: '必须询价', width: 90 },
      { key: 'skipReason', title: '免询价/价格依据', width: 150 },
      { key: 'delivery', title: '交货日期', width: 120 },
      { key: 'state', title: '流程状态', width: 110 },
      { key: 'action', title: '操作', width: 90, fixed: 'right' },
    ];

    function resetSummary() {
      search.value = '';
      state.value = '全部';
      message.value = '';
    }

    function openSummaryDetail(record: AnyRow, event?: Event) {
      event?.preventDefault();
      event?.stopPropagation();
      selectedProductId.value = String(record.id);
      message.value = '';
      router.push({ path: route.path, query: { action: '请购明细', product: String(record.id) } });
    }

    function closeSummaryDetail() {
      selectedProductId.value = '';
      message.value = '';
      router.push({ path: route.path, query: { action: '请购明细' } });
    }

    function openSourceDetail(record: AnyRow) {
      const id = requestIdByCode[String(record.code || '')] || 'pr_001';
      router.push({ path: '/purchase/purchase-requests', query: { id } });
    }

    function summaryListPage() {
      return h('div', { class: 'pr-summary-page' }, [
        h('section', { class: 'aw-detail-toolbar pr-summary-toolbar' }, [
          h('div', { class: 'pr-list-title' }, [
            h('span', { class: 'pr-title-mark' }),
            h('strong', '请购管理'),
          ]),
          h('button', { class: 'aw-back-btn', onClick: () => emit('back') }, '返回列表'),
        ]),
        h(AwListPage, null, {
          default: () => [
            h(AwListToolbar, {
              searchPlaceholder: '全局搜索（如产品名称、产品编号、请购来源）',
              actions: ['refresh', 'filter', 'columns', 'export', 'import'],
              onSearch: (value: string) => search.value = value,
              onRefresh: resetSummary,
              onFilter: () => message.value = '请购明细筛选入口已打开，可使用表头状态筛选。',
              onColumns: () => message.value = '请购明细字段配置入口已打开。',
              onExport: () => message.value = '请购明细导出已通过 mock 接口提交。',
              onImport: () => message.value = '请购明细导入已通过 mock 接口提交。',
            }),
            h(AwDataTable, {
              columns: summaryColumns,
              rows: visibleRows.value.map((row) => ({ ...row, action: '查看' })),
              rowKey: 'id',
              total: visibleRows.value.length,
              bulkActions: [{ key: 'batch', label: '批量操作' }],
              filterValues: state.value === '全部' ? {} : { state: state.value },
              onColumnFilter: (key: string, value: string) => {
                if (key === 'state') state.value = value || '全部';
              },
            }, {
              cell: ({ column, record, value }: { column: AwTableColumn; record: AnyRow; value: unknown }) => {
                if (column.key === 'state') return h('span', { class: ['aw-status', String(record.tone || '')] }, String(value || '-'));
                if (column.key === 'action') return h('a', { href: `${route.path}?action=${encodeURIComponent('请购明细')}&product=${encodeURIComponent(String(record.id))}`, class: 'aw-text-action' }, '查看');
                return String(value ?? '-');
              },
            }),
            message.value ? h('div', { class: 'aw-form-note' }, message.value) : null,
          ],
        }),
      ]);
    }

    function requestSourceTable() {
      if (!selectedProduct.value) return null;
      const product = selectedProduct.value;
      return h(AwFormPage, {
        backText: '返回列表',
        actions: [
          { key: 'cancel', label: '取消' },
          { key: 'draft', label: '暂存' },
          { key: 'export', label: '导出来源', primary: true },
        ],
        onBack: closeSummaryDetail,
        onAction: (key: string) => {
          if (key === 'cancel') {
            closeSummaryDetail();
            return;
          }
          if (key === 'draft') {
            message.value = '请购来源明细已通过 mock 接口暂存。';
            return;
          }
          message.value = '请购来源导出已通过 mock 接口提交。';
        },
      }, {
        default: () => [
          h('section', { class: 'aw-card pr-source-card' }, [
            h('div', { class: 'section-title' }, `${product.productName} 请购数量与来源列表`),
            h(AwDetailInfoGrid, { items: [
              { label: '产品编号', value: product.productNo },
              { label: '产品名称', value: product.productName },
              { label: '规格型号', value: product.model },
              { label: '标准单位', value: product.unit },
              { label: '来源数量', value: String(product.sourceCount) },
              { label: '请购总量', value: String(product.totalQty) },
              { label: '已采购数量', value: String(product.purchasedQty) },
              { label: '待采购数量', value: String(product.waitQty) },
              { label: '必须询价', value: product.forceQuote },
              { label: '交货日期', value: product.delivery },
              { label: '请购状态', value: product.state },
            ] }),
            h(AwDataTable, {
              columns: sourceColumns,
              rows: selectedSources.value.map((row) => ({ ...row, action: '查看' })),
              rowKey: 'id',
              total: selectedSources.value.length,
            }, {
              cell: ({ column, record, value }: { column: AwTableColumn; record: AnyRow; value: unknown }) => {
                if (column.key === 'code') return h('span', { class: 'aw-link' }, String(value || '-'));
                if (column.key === 'state') return h('span', { class: ['aw-status', String(record.state).includes('审批') ? 'info' : String(record.state).includes('转') || String(record.state).includes('批准') ? 'success' : 'warn'] }, String(value || '-'));
                if (column.key === 'action') return h('span', { class: 'aw-link', onClick: () => openSourceDetail(record) }, '查看');
                return String(value ?? '-');
              },
            }),
            message.value ? h('div', { class: 'aw-form-note' }, message.value) : null,
          ]),
        ],
      });
    }

    return () => props.moduleKey === 'requests'
      ? (selectedProduct.value ? requestSourceTable() : summaryListPage())
      : h('div');
  },
});

const PurchaseDetailView = defineComponent({
  props: {
    moduleKey: { type: String as () => PurchaseModule, required: true },
    id: { type: String, required: true },
  },
  emits: ['back'],
  setup(props, { emit }) {
    const row = ref<PurchaseRow>({ id: '' });
    const activeTab = ref('info');
    const actionMessage = ref('');
    const editMode = ref(false);
    const editRemark = ref('');
    const auditModalOpen = ref(false);
    const detailActions = computed<DetailAction[]>(() => purchaseDetailActions(props.moduleKey, String(row.value.state || '')));
    const tabs = computed<DetailTabItem[]>(() => detailSchema(props.moduleKey).tabs);
    const schema = computed(() => detailSchema(props.moduleKey));
    const headerMetas = computed(() => schema.value.header(row.value));
    const detailFields = computed(() => schema.value.fields(row.value));
    const auditTitle = computed(() => `${purchaseModuleLabel(props.moduleKey)}审核`);
    const auditDocument = computed<AuditDocumentSummary>(() => ({
      title: schema.value.title(row.value),
      code: schema.value.code(row.value),
      status: String(row.value.state || '-'),
      applicant: String(row.value.starter || row.value.contact || row.value.supplier || '老夏'),
      flowName: `${purchaseModuleLabel(props.moduleKey)}默认审批流`,
      currentNode: purchaseAuditNode(props.moduleKey),
    }));
    const auditApprovalNodes = computed<AuditApprovalNode[]>(() => [
      { name: '提交审批', approver: auditDocument.value.applicant || '老夏', method: '提交', state: 'done', result: '已提交', time: String(row.value.date || '2026-06-06 09:00') },
      { name: purchaseAuditNode(props.moduleKey), approver: '采购主管', method: '审批', state: 'current', result: '待审核' },
      { name: '业务状态回写', approver: '系统', method: '自动', state: 'pending', result: '待回写' },
    ]);

    watch(() => [props.moduleKey, props.id], load, { immediate: true });

    async function load() {
      row.value = await getPurchaseDetail(props.moduleKey, props.id);
      editRemark.value = String(row.value.remark || row.value.detail || '');
      activeTab.value = 'info';
      editMode.value = false;
      actionMessage.value = '';
    }

    async function handleAction(key: string) {
      if (key === 'edit') {
        editMode.value = !editMode.value;
        activeTab.value = 'info';
        actionMessage.value = editMode.value ? '已进入编辑态，可修改备注后保存。' : '已退出编辑态。';
        return;
      }
      if (key === 'approve') {
        auditModalOpen.value = true;
        return;
      }
      if (key === 'delete' && !window.confirm(`确认删除「${schema.value.title(row.value)}」吗？确认后才会进入删除处理。`)) return;
      if (key === 'print') {
        await printPurchase(props.moduleKey, props.id);
        actionMessage.value = '打印动作已通过 mock 接口提交。';
        return;
      }
      if (key === 'export') {
        await exportPurchase(props.moduleKey, props.id);
        actionMessage.value = '导出动作已通过 mock 接口提交。';
        return;
      }
      const response = await updatePurchase(props.moduleKey, props.id, { action: key });
      row.value = await getPurchaseDetail(props.moduleKey, props.id);
      actionMessage.value = String((response as { message?: unknown }).message || '操作已通过 mock 接口提交。');
    }

    async function saveEdit() {
      row.value = { ...row.value, remark: editRemark.value };
      await updatePurchase(props.moduleKey, props.id, row.value);
      editMode.value = false;
      actionMessage.value = '详情修改已通过 mock 接口保存。';
    }

    async function confirmAudit(payload: AuditActionPayload) {
      if (payload.action === 'transfer') {
        auditModalOpen.value = false;
        actionMessage.value = `审核已转交给${payload.transferTo || '指定处理人'}，当前采购状态保持为${row.value.state || '-'}。`;
        return;
      }
      const response = await approvePurchase(props.moduleKey, props.id, { ...payload });
      auditModalOpen.value = false;
      row.value = await getPurchaseDetail(props.moduleKey, props.id);
      actionMessage.value = String((response as { message?: unknown }).message || '审核动作已通过母版弹窗提交。');
    }

    return () => h(AwDetailPage, null, {
      toolbar: () => h(AwDetailToolbar, { actions: detailActions.value, onBack: () => emit('back'), onAction: handleAction }),
      header: () => h(AwDetailHeader, {
        title: schema.value.title(row.value),
        statusText: String(row.value.state || '-'),
        statusTone: String(row.value.tone || ''),
        code: schema.value.code(row.value),
        metas: headerMetas.value,
      }),
      default: () => [
        h('section', { class: 'aw-card' }, [
          h(AwDetailTabs, { modelValue: activeTab.value, 'onUpdate:modelValue': (value: string) => activeTab.value = value, tabs: tabs.value }),
          activeTab.value === 'info' ? detailInfoBlock(detailFields.value, editMode.value, editRemark.value, (value) => editRemark.value = value, saveEdit, props.moduleKey === 'suppliers' ? '供应商详情说明' : props.moduleKey === 'requests' ? '请购详情' : props.moduleKey === 'inquiries' ? '询价详情' : '采购备注') : detailTabBlock(props.moduleKey, activeTab.value, row.value),
          actionMessage.value ? h('div', { class: 'aw-form-note' }, actionMessage.value) : null,
        ]),
        h(AwAuditActionModal, {
          open: auditModalOpen.value,
          title: auditTitle.value,
          document: auditDocument.value,
          approvalNodes: auditApprovalNodes.value,
          defaultAction: 'approve',
          onCancel: () => { auditModalOpen.value = false; },
          onConfirm: confirmAudit,
        }),
      ],
    });
  },
});

function purchaseModuleLabel(module: PurchaseModule) {
  const labels: Record<PurchaseModule, string> = {
    suppliers: '供应商',
    requests: '请购',
    inquiries: '询价',
    orders: '采购订单',
  };
  return labels[module];
}

function purchaseAuditNode(module: PurchaseModule) {
  const nodes: Record<PurchaseModule, string> = {
    suppliers: '供应商准入审核',
    requests: '请购审批',
    inquiries: '询价审批',
    orders: '采购订单审核',
  };
  return nodes[module];
}

function detailSchema(module: PurchaseModule) {
  const commonActions = [{ key: 'info', label: '基础信息' }];
  if (module === 'suppliers') {
    return {
      tabs: [
        { key: 'info', label: '供应商信息' },
        { key: 'products', label: '供应产品' },
        { key: 'contacts', label: '联系人信息' },
        { key: 'finance', label: '财务信息' },
        { key: 'address', label: '地址信息' },
        { key: 'attachments', label: '附件信息' },
        { key: 'quotes', label: '报价记录' },
        { key: 'purchase', label: '采购记录' },
        { key: 'log', label: '操作记录' },
      ],
      title: (r: PurchaseRow) => String(r.name || '供应商详情'),
      code: (r: PurchaseRow) => String(r.code || ''),
      header: (r: PurchaseRow) => [
        { label: '供应商分类', value: String(r.categoryPath || r.type || '-') },
        { label: '主联系人', value: String(r.contact || '-') },
        { label: '联系方式', value: String(r.phone || '-') },
        { label: '采购人员', value: String(r.buyer || '老夏') },
      ],
      fields: (r: PurchaseRow) => [
        { label: '供应商编号', value: String(r.code || '-') },
        { label: '供应商名称', value: String(r.name || '-') },
        { label: '拼音号', value: String(r.pinyin || '-') },
        { label: '供应商分类', value: String(r.categoryPath || r.type || '-') },
        { label: '细分类', value: String(r.category || '-') },
        { label: '供应商类型', value: String(r.supplierType || (String(r.type) === '临时供应商' ? '临时供应商' : '正式供应商')) },
        { label: '来源单据', value: String(r.source || '-') },
        { label: '信用代码', value: String(r.creditCode || '91440300MA5DXXXXX') },
        { label: '采购人员', value: String(r.buyer || '老夏') },
        { label: '付款账期', value: String(r.paymentTerm || '月结30天') },
        { label: '创建日期', value: String(r.date || '-') },
        { label: '供应商状态', value: String(r.state || '-') },
      ],
    };
  }
  if (module === 'requests') {
    return {
      tabs: [{ key: 'info', label: '请购信息' }, { key: 'lines', label: '请购明细' }, { key: 'attachments', label: '附件' }, { key: 'log', label: '操作记录' }],
      title: (r: PurchaseRow) => String(r.topic || '请购详情'),
      code: (r: PurchaseRow) => String(r.code || ''),
      header: (r: PurchaseRow) => [
        { label: '申请日期', value: String(r.date || '-') },
        { label: '请购人', value: String(r.starter || '-') },
        { label: '请购来源', value: String(r.source || '-') },
        { label: '关联单据', value: String(r.ref || '-') },
      ],
      fields: (r: PurchaseRow) => [
        { label: '请购编号', value: String(r.code || '-') },
        { label: '请购主题', value: String(r.topic || '-') },
        { label: '请购日期', value: String(r.date || '-') },
        { label: '请购人', value: String(r.starter || '-') },
        { label: '联系方式', value: String(r.phone || '-') },
        { label: '请购来源', value: String(r.source || '-') },
        { label: '关联单据', value: String(r.ref || '-') },
        { label: '需求日期', value: String(r.needDate || '-') },
        { label: '请购总量', value: String(r.totalQty || '-') },
        { label: '打印状态', value: String(r.printState || '-') },
        { label: '流程状态', value: String(r.state || '-') },
      ],
    };
  }
  if (module === 'inquiries') {
    return {
      tabs: [{ key: 'info', label: '询价信息' }, { key: 'lines', label: '询价明细' }, { key: 'attachments', label: '附件' }, { key: 'log', label: '操作记录' }],
      title: (r: PurchaseRow) => String(r.topic || '询价详情'),
      code: (r: PurchaseRow) => String(r.code || ''),
      header: (r: PurchaseRow) => [
        { label: '询价日期', value: String(r.date || '-') },
        { label: '截止日期', value: String(r.deadline || '-') },
        { label: '询价产品', value: String(r.product || '-') },
        { label: '询价数量', value: String(r.qty || '-') },
      ],
      fields: (r: PurchaseRow) => [
        { label: '询价主题', value: String(r.topic || '-') },
        { label: '询价编号', value: String(r.code || '-') },
        { label: '询价日期', value: String(r.date || '-') },
        { label: '截止日期', value: String(r.deadline || '-') },
        { label: '询价产品', value: String(r.product || '-') },
        { label: '询价数量', value: String(r.qty || '-') },
        { label: '来源明细', value: String(r.sourceText || '-') },
        { label: '供应商报价', value: `${inquirySupplierCount(r)} 家` },
        { label: '询价状态', value: String(r.state || '-') },
      ],
    };
  }
  return {
    tabs: [{ key: 'info', label: '采购信息' }, { key: 'lines', label: '采购明细' }, { key: 'inbound', label: '入库记录' }, { key: 'match', label: '三单匹配' }, { key: 'payable', label: '应付暂估' }, { key: 'quality', label: '质检扣款' }, { key: 'payment', label: '付款记录' }, { key: 'invoice', label: '到票记录' }, { key: 'source', label: '来源记录' }, { key: 'log', label: '操作记录' }],
    title: (r: PurchaseRow) => String(r.topic || r.code || '采购订单详情'),
    code: (r: PurchaseRow) => String(r.code || ''),
    header: (r: PurchaseRow) => [
      { label: '供应商', value: String(r.supplier || '-') },
      { label: '采购日期', value: String(r.date || '-') },
      { label: '预计到货', value: String(r.arrival || '-') },
      { label: '采购金额', value: formatMoney(r.amount) },
    ],
    fields: (r: PurchaseRow) => [
      { label: '采购编号', value: String(r.code || '-') },
      { label: '订单主题', value: String(r.topic || '-') },
      { label: '订单来源', value: String(r.sourceText || '-') },
      { label: '供应商', value: String(r.supplier || '-') },
      { label: '采购日期', value: String(r.date || '-') },
      { label: '预计到货', value: String(r.arrival || '-') },
      { label: '采购金额', value: formatMoney(r.amount) },
      { label: '采购状态', value: String(r.state || '-') },
      { label: '来源单据', value: String(r.sourceText || '询价定价单 IQ-20251219001') },
      { label: '产品概要', value: String(r.summary || `${childRows(r, 'rows').length || 0}(预览浮层)`) },
      { label: '付款条件', value: '月结30天 / 到票后付款' },
      { label: '三单匹配', value: String(r.match || '-') },
      { label: '可付款金额', value: formatMoney(r.payable) },
      { label: '暂估应付', value: formatMoney(r.provisional) },
      { label: '发票认证', value: String(r.certified || '-') },
    ],
  };
}

function detailInfoBlock(fields: { label: string; value: string }[], editMode: boolean, remark: string, updateRemark: (value: string) => void, saveEdit: () => void, remarkTitle = '备注') {
  return [
    h('div', { class: 'aw-detail-section-title' }, '基础信息'),
    h(AwDetailInfoGrid, { items: fields }),
    h('div', { class: 'aw-detail-section-title' }, remarkTitle),
    editMode
      ? h('div', { class: 'aw-detail-edit' }, [
          h('textarea', { class: 'aw-input reason-area', value: remark, placeholder: '请输入详情备注', onInput: (event: Event) => updateRemark(val(event)) }),
          h('button', { class: 'aw-btn primary', onClick: saveEdit }, '保存修改'),
        ])
      : h('div', { class: 'aw-remark-box' }, remark || '请供应商/采购相关人员按单据要求推进后续业务。'),
  ];
}

function detailTabBlock(module: PurchaseModule, tab: string, row: PurchaseRow) {
  if (tab === 'attachments') return attachmentsBlock(module, row);
  if (tab === 'log') return recordBlock('操作记录', ['序号', '操作类型', '操作人', '操作时间', '操作内容'], operationRows(module, row));
  if (module === 'suppliers') return supplierDetailTab(tab, row);
  if (module === 'requests') return requestDetailTab(tab, row);
  if (module === 'inquiries') return inquiryDetailTab(tab, row);
  return orderDetailTab(tab, row);
}

function childRows(row: PurchaseRow, key: string) {
  return Array.isArray(row[key]) ? row[key] as AnyRow[] : [];
}

function cellText(value: unknown, fallback = '-') {
  return value == null || value === '' ? fallback : String(value);
}

function formatRecordCell(value: string, column: string) {
  if (value === '-' || !isMoneyField('', column)) return value;
  return formatMoney(value);
}

function inquirySupplierCount(row: PurchaseRow) {
  return childRows(row, 'rows').reduce((sum, item) => sum + (Array.isArray(item.suppliers) ? item.suppliers.length : 0), 0);
}

function supplierDetailTab(tab: string, row: PurchaseRow) {
  const products = childRows(row, 'products');
  const contacts = childRows(row, 'contacts');
  const finances = childRows(row, 'finances');
  const addresses = childRows(row, 'addresses');
  const tables: Record<string, [string, string[], string[][]]> = {
    products: ['供应产品', ['序号', '物料编码', '物料名称', '规格型号', '物料类别', '品牌', '标准单位', '供货单位', '换算系数', '参考采购价', '交期'], products.length ? products.map((item, index) => [
      String(index + 1),
      cellText(item.productNo),
      cellText(item.productName),
      cellText(item.model),
      cellText(item.categoryName),
      cellText(item.brand, '通用'),
      cellText(item.unit),
      cellText(item.supplyUnit || item.unit),
      cellText(item.ratio || item.rate, '1'),
      cellText(item.price),
      cellText(item.arrival || item.delivery, '7天'),
    ]) : [
      ['1', '7820864', '半成品物料', '规格一', '半成品', '通用', 'KG', 'KG', '1', '50.00', '7天'],
      ['2', '8518691', '铝合金型材', '6061-T6', '原材料', '华南铝材', 'KG', 'KG', '1', '32.00', '5天'],
    ]],
    contacts: ['联系人信息', ['序号', '联系人', '职位', '联系方式', '邮箱', '默认', '备注'], contacts.length ? contacts.map((item, index) => [
      String(index + 1),
      cellText(item.name),
      cellText(item.position),
      cellText(item.phone),
      cellText(item.email),
      item.isDefault || index === 0 ? '是' : '否',
      cellText(item.remark),
    ]) : [['1', String(row.contact || '张伟'), '销售经理', String(row.phone || '13800138001'), 'zhangwei@example.com', '是', '主要采购对接人']]],
    finance: ['财务信息', ['序号', '银行卡号', '账户名称', '开户行', '账户类型', '备注'], finances.length ? finances.map((item, index) => [
      String(index + 1),
      cellText(item.bankAccount),
      cellText(item.accountName || row.name),
      cellText(item.bankName),
      cellText(item.accountType),
      cellText(item.remark),
    ]) : [['1', '6217000000123456789', String(row.name || '供应商'), '中国工商银行深圳福田支行', '对公账户', '默认账户']]],
    address: ['地址信息', ['序号', '地址类型', '收件人', '联系电话', '详细地址', '默认'], addresses.length ? addresses.map((item, index) => [
      String(index + 1),
      cellText(item.addressType),
      cellText(item.contact),
      cellText(item.phone),
      cellText(item.address),
      item.isDefault || index === 0 ? '是' : '否',
    ]) : [['1', '办公地址', String(row.contact || '张伟'), String(row.phone || '13800138001'), '广东省深圳市福田区华强北路1002号赛格广场32楼', '是']]],
    quotes: ['报价记录', ['序号', '询价单号', '物料名称', '报价单价', '是否含税', '交货期', '报价状态'], [['1', 'XJ-202512-003', '半成品物料', '50.00', '是', '7天', '已定价']]],
    purchase: ['采购记录', ['序号', '采购单号', '采购金额', '已付金额', '到票金额', '采购状态'], [['1', 'CG-20251221001', '5959.00', '5959.00', '5959.00', '审核中']]],
  };
  const config = tables[tab] || tables.products;
  return recordBlock(config[0], config[1], config[2]);
}

function requestDetailTab(tab: string, row: PurchaseRow) {
  if (tab === 'lines') {
    const rows = childRows(row, 'rows');
    const lineRows = rows.length ? rows.map((item, index) => [
      String(index + 1),
      cellText(item.productName),
      cellText(item.productNo),
      cellText(item.model),
      cellText(item.categoryName),
      cellText(item.brand, '通用'),
      cellText(item.unit),
      cellText(item.qty),
      cellText(item.date),
      cellText(item.supplier),
      cellText(item.usage),
    ]) : [
      ['1', '半成品物料', '7820864', '规格一', '半成品', '傲为', 'KG', '500', '2024-12-23', '-', '用于生产'],
      ['2', '半成品物料', '5786931', '规格一', '半成品', '傲为', 'KG', '500', '2024-12-23', '-', '用于生产'],
      ['3', '铝合金型材', '8518691', 'AL-6061', '原材料', '华南铝材', 'KG', '500', '2024-12-23', '-', '用于生产'],
    ];
    const totalQty = rows.length ? rows.reduce((sum, item) => sum + Number(item.qty || 0), 0) : 1500;
    return recordBlock('请购明细', ['序号', '产品名称', '产品编号', '产品型号', '产品分类', '品牌', '产品单位', '请购数量', '交货日期', '建议供应商', '用途说明'], lineRows, [['请购总数量', String(totalQty)]]);
  }
  return attachmentsBlock('requests', row);
}

function inquiryDetailTab(tab: string, row: PurchaseRow) {
  if (tab === 'lines') {
    const rows = childRows(row, 'rows');
    const lineRows = rows.length ? rows.flatMap((item, index) => {
      const suppliers = Array.isArray(item.suppliers) ? item.suppliers as AnyRow[] : [{}];
      return suppliers.map((supplier, supplierIndex) => [
        supplierIndex === 0 ? String(index + 1) : '',
        supplierIndex === 0 ? cellText(item.productName) : '',
        supplierIndex === 0 ? cellText(item.productNo) : '',
        supplierIndex === 0 ? cellText(item.model) : '',
        supplierIndex === 0 ? cellText(item.categoryName) : '',
        supplierIndex === 0 ? cellText(item.brand, '通用') : '',
        supplierIndex === 0 ? cellText(item.unit) : '',
        supplierIndex === 0 ? cellText(item.qty) : '',
        cellText(item.sourceDoc || supplier.sourceLine),
        cellText(supplier.supplier),
        supplier.temp ? '临时' : '正式',
        cellText(supplier.price),
        cellText(supplier.taxed),
        cellText(supplier.discount),
        cellText(supplier.amount),
        cellText(supplier.tax),
        cellText(supplier.delivery),
        cellText(supplier.minQty),
        '待生成采购',
      ]);
    }) : [
      ['1', '半成品物料', '7820864', 'HM-450', '半成品', '傲为', 'KG', '8', 'PR-2026-00232', '深圳鑫达电子科技有限公司', '正式', '50.00', '是', '98%', '392.00', '50.96', '2025-12-20', '20', '待生成采购'],
      ['2', '铝合金型材', '5786931', 'AL-20', '型材', '华南铝材', '米', '12', 'IQ-20251219001-01', '佛山启明金属材料有限公司', '临时', '86.00', '否', '95%', '980.40', '0.00', '2025-12-18', '10', '待转正供应商'],
    ];
    return recordBlock('询价明细', ['序号', '产品名称', '产品编号', '产品型号', '产品分类', '品牌', '标准单位', '数量', '来源明细', '供应商', '供应商类型', '单价', '是否含税', '折扣', '金额', '税额', '交货期', '最小采购量', '采购生成'], lineRows);
  }
  return attachmentsBlock('inquiries', row);
}

function orderDetailTab(tab: string, row: PurchaseRow) {
  const orderRows = childRows(row, 'rows');
  const map: Record<string, [string, string[], string[][]]> = {
    lines: ['采购明细', ['序号', '产品名称', '产品编号', '产品型号', '产品分类', '品牌', '产品单位', '来源明细', '价格来源', '采购数量', '待采购数量', '采购单价', '采购金额', '预计到货', '供应商', '供应商变更', '状态'], orderRows.length ? orderRows.map((item, index) => [
      String(index + 1),
      cellText(item.productName),
      cellText(item.productNo),
      cellText(item.model),
      cellText(item.categoryName),
      cellText(item.brand, '通用'),
      cellText(item.unit),
      cellText(item.sourceLine),
      cellText(item.priceSource),
      cellText(item.qty),
      cellText(item.waitPurchaseQty || item.qty),
      cellText(item.price),
      cellText(item.amount),
      cellText(item.arrival || row.arrival),
      cellText(item.supplier || row.supplier),
      cellText(item.supplierChangeReason, item.supplierChanged ? '已触发审核' : '未变更'),
      String(row.state || '审核中'),
    ]) : [['1', '半成品物料', '7820864', 'HM-450', '半成品', '傲为', 'KG', 'IQ-20251219001-01', '询价定价/深圳鑫达/V1', '50', '25', '59.60', String(row.payable || '2980.00'), String(row.arrival || '2025-12-31'), String(row.supplier || '海南傲为'), '未变更', '部分入库']]],
    inbound: ['入库记录', ['序号', '来源明细', '入库单号', '入库类型', '入库仓库/库位', '入库数量', 'IQC状态', '合格/让步/拒收', '入库人', '入库时间'], [['1', 'IQ-20251219001-01', 'RK-20251221001', '采购入库', '原料仓/A-01-01', '250', '已放行', '240 / 10 / 0', '陈仓', '2025-12-22 10:30']]],
    match: ['三单匹配', ['序号', '来源明细', '采购单', '入库单', '发票号', '订单金额', '入库金额', '到票金额', '差异类型', '差异金额', '匹配状态'], [['1', 'IQ-20251219001-01', String(row.code || ''), 'RK-20251221001', 'INV-20251224088', '5960.00', '5960.00', '5960.00', '无', '0.00', String(row.match || '已匹配')]]],
    payable: ['暂估应付', ['序号', '来源明细', '暂估单号', '来源入库', '暂估金额', '质检扣款', '已冲回', '可付款金额', '账期到期日', '状态'], [['1', 'PR-2026-00232-02', 'AP-EST-20251223001', 'RK-20251223003', String(row.provisional || '3800.00'), '200.00', '0.00', String(row.payable || '3600.00'), '2026-01-23', '有效']]],
    quality: ['质检扣款', ['序号', '来源明细', '质检单号', '问题类型', '不合格数量', '让步数量', '拒收数量', '扣款金额', '关联入库', '处理状态'], [['1', 'PR-2026-00232-02', 'QC-20251223009', '外观划伤', '20', '0', '20', String(row.deduction || '200.00'), 'RK-20251223003', '供应商确认中']]],
    payment: ['付款记录', ['序号', '来源明细', '付款申请号', '申请金额', '可付款金额', '本次付款', '付款账户', '付款条件', '付款状态', '经办人', '付款日期'], [['1', 'PR-2026-00232-02', 'PAY-20251224001', String(row.amount || '5960.00'), String(row.payable || '3600.00'), String(row.paid || '3000.00'), '招商银行基本户', '到票后付款', '待财务审核', '王会计', '2025-12-24']]],
    invoice: ['到票记录', ['序号', '来源明细', '发票号码', '发票类型', '含税金额', '税额', '认证状态', '认证日期', '收票人', '收票日期'], [['1', 'IQ-20251219001-01', 'INV-20251224088', '增值税专票', String(row.invoice || '5960.00'), '684.96', String(row.certified || '待认证'), '-', '王会计', '2025-12-24']]],
    source: ['来源记录', ['序号', '来源类型', '来源单号', '来源明细', '来源主题', '转单数量', '已采购回写', '转单人', '转单时间'], [['1', '询价定价', 'IQ-20251219001', 'IQ-20251219001-01', '12月物料询价定价', '3项', '已回写已采购数量', '采购员李文涛', '2025-12-21 09:10']]],
  };
  const config = map[tab] || map.lines;
  return recordBlock(config[0], config[1], config[2]);
}

function attachmentsBlock(module: PurchaseModule | string, row?: PurchaseRow) {
  const remark = module === 'suppliers'
    ? '供应商资质、合同、税务资料和授权文件统一归档在附件信息中。'
    : module === 'requests'
      ? '用于生产线急需物料补充，请优先安排采购询价。'
      : '请供应商在截止日期前反馈含税价、交期和最小采购量。';
  const attachments = row ? childRows(row, 'attachments') : [];
  const files = attachments.length ? attachments.map((item, index) => [
    String(index + 1),
    cellText(item.name),
    cellText(item.type, '资质文件'),
    cellText(item.date),
    cellText(item.remark),
  ]) : [
    ['1', '供应商资质.PDF', '资质文件', '2026-05-30', '首版资质附件'],
    ['2', '营业执照.PDF', '营业执照', '2026-05-30', '供应商准入材料'],
    ['3', '报价附件.PDF', '报价附件', '2026-05-31', '询价报价留档'],
  ];
  return [
    ...(module === 'requests' || module === 'inquiries' ? [] : [h('div', { class: 'aw-detail-section-title' }, '备注')]),
    ...(module === 'requests' || module === 'inquiries' ? [] : [h('div', { class: 'aw-remark-box' }, remark)]),
    h('div', { class: 'aw-detail-section-title' }, '附件'),
    h('table', { class: 'aw-doc-tbl' }, [
      h('thead', [h('tr', ['序号', '附件名称', '附件类型', '上传日期', '备注', '操作'].map((title) => h('th', title)))]),
      h('tbody', files.map((file) => h('tr', [
        h('td', file[0]),
        h('td', { class: 'aw-link' }, file[1]),
        h('td', file[2]),
        h('td', file[3]),
        h('td', file[4]),
        h('td', [h('span', { class: 'aw-link' }, '查看'), h('span', { class: 'aw-link attach-gap' }, '下载')]),
      ]))),
    ]),
  ];
}

function operationRows(module: PurchaseModule, row: PurchaseRow) {
  const owner = module === 'suppliers' ? '老夏' : module === 'orders' ? '采购员李文涛' : String(row.starter || '李文涛');
  return [
    ['1', '创建', owner, `${String(row.date || '2025-12-21')} 09:12`, `创建${detailSchema(module).title(row)}`],
    ['2', '审核', '采购主管', `${String(row.date || '2025-12-21')} 11:05`, '审核通过，等待后续业务推进'],
  ];
}

function recordBlock(title: string, columns: string[], rows: string[][], totals: [string, string][] = []) {
  return [
    h('div', { class: 'aw-detail-section-title' }, title),
    h('div', { class: 'aw-doc-tbl-wrap' }, [
      h('div', { class: 'aw-doc-tbl-inner' }, [
        h('table', { class: 'aw-doc-tbl' }, [
          h('thead', [h('tr', columns.map((column) => h('th', [h('div', { class: 'aw-th-inner' }, column)])))]),
          h('tbody', rows.length ? rows.map((cells) => h('tr', cells.map((cell, index) => h('td', formatRecordCell(cell, columns[index] || ''))))) : [h('tr', [h('td', { colspan: columns.length, class: 'aw-empty-cell' }, '暂无记录')])]),
        ]),
      ]),
    ]),
    totals.length ? totalBar(totals) : null,
  ];
}
</script>

<style scoped>
.aw-purchase-modal {
  width: min(980px, 94vw);
  max-height: 86vh;
}
.aw-purchase-modal.small {
  width: min(720px, 92vw);
}
.aw-modal-close {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--aw-fg-4);
  font-size: 18px;
}
.aw-source-picker {
  display: grid;
  grid-template-columns: 180px 1fr;
  padding: 0;
}
.aw-product-picker {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
}
.aw-product-picker aside {
  display: grid;
  align-content: start;
  gap: 4px;
  padding: 8px;
  border-right: 1px solid var(--aw-border);
  background: var(--aw-surface-2);
}
.aw-product-picker aside button {
  border: 0;
  background: transparent;
  padding: 9px 10px;
  text-align: left;
  cursor: pointer;
}
.aw-product-picker aside button.on {
  background: var(--aw-primary-soft);
  color: var(--aw-primary);
}
.aw-source-picker aside {
  display: grid;
  align-content: start;
  gap: 4px;
  padding: 8px;
  border-right: 1px solid var(--aw-border);
  background: var(--aw-surface-2);
}
.aw-source-picker aside button {
  border: 0;
  background: transparent;
  padding: 9px 10px;
  text-align: left;
  cursor: pointer;
}
.aw-source-picker aside button.on,
tr.picked {
  background: var(--aw-primary-soft);
  color: var(--aw-primary);
}
.aw-picker-count {
  padding: 0 0 10px;
  color: var(--aw-primary);
  font-size: 13px;
  font-weight: 500;
}
.aw-line-total {
  display: flex;
  gap: 28px;
  padding: 12px;
  white-space: nowrap;
}
.aw-line-total strong {
  color: var(--aw-danger);
}
.aw-empty {
  padding: 24px 12px;
  border: 1px dashed var(--aw-border-strong);
  border-radius: 6px;
  color: var(--aw-fg-3);
  text-align: center;
}
.aw-upload-card {
  min-height: 118px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--aw-border-strong);
  border-radius: 6px;
  color: var(--aw-fg-3);
}
.readonly {
  background: #f5f6fa;
}
.danger {
  color: var(--aw-danger);
}
.mini {
  padding-inline: 8px;
}
.reason-area {
  height: 86px;
  resize: vertical;
  padding: 8px 10px;
}
.aw-warning-line {
  margin-top: 4px;
  color: var(--aw-warning);
  font-size: 11px;
}
.inquiry-table th,
.inquiry-table td {
  min-width: 90px;
}
.inquiry-table tr.summary {
  background: var(--aw-surface-2);
}
.pr-detail-page {
  padding: 20px;
  background: var(--aw-bg);
  min-height: 100%;
}
.pr-summary-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}
.pr-summary-toolbar .aw-back-btn {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  padding: 0 12px;
  background: #fff;
}
.aw-text-action {
  border: 0;
  background: transparent;
  color: var(--aw-primary);
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  padding: 0;
}
.pr-detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  color: var(--aw-fg);
}
.pr-detail-title .aw-btn {
  margin-left: auto;
}
.pr-title-mark {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--aw-primary);
}
.pr-detail-toolbar {
  display: grid;
  grid-template-columns: minmax(280px, 520px) 1fr;
  gap: 16px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: var(--aw-surface);
}
.pr-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}
.pr-detail-table {
  margin-top: 12px;
}
.pr-detail-table select,
.pr-detail-footer select {
  height: 28px;
  border: 1px solid var(--aw-border);
  border-radius: 4px;
  background: #fff;
}
.pr-detail-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  background: var(--aw-surface);
}
.pr-detail-footer .grow {
  flex: 1;
}
.aw-page.current {
  min-width: 28px;
  height: 28px;
  border: 0;
  border-radius: 4px;
  background: var(--aw-primary);
  color: #fff;
}
.pr-source-card {
  margin-top: 16px;
}
.pr-source-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.pr-source-head p {
  margin: 4px 0 0;
  color: var(--aw-fg-3);
  font-size: 12px;
}
.pr-source-table-actions {
  display: flex;
  justify-content: flex-end;
  margin: 14px 0 8px;
  padding-right: 22px;
}
.purchase-list-feedback {
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
@media (max-width: 760px) {
  .pr-detail-toolbar {
    grid-template-columns: 1fr;
  }
  .pr-detail-actions {
    justify-content: flex-start;
  }
}
</style>
