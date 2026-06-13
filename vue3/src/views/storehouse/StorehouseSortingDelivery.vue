<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';

type SortingDeliveryRow = Record<string, unknown> & {
  id: string;
  categoryKey: string;
  pickNo: string;
  sourceNo: string;
  businessType: string;
  customer: string;
  warehouse: string;
  skuCount: number;
  quantity: number;
  picker: string;
  planTime: string;
  state: string;
};

type PickProductRow = Record<string, unknown> & {
  id: string;
  productCode: string;
  productName: string;
  spec: string;
  unit: string;
  orderQty: number;
  pickedQty: number;
  simplePickQty?: number;
  expanded: boolean;
  batches: PickBatchRow[];
};

type PickBatchRow = Record<string, unknown> & {
  id: string;
  warehouse: string;
  location: string;
  batchNo: string;
  availableQty: number;
  pickQty: number;
};

type PickReviewRow = Record<string, unknown> & {
  id: string;
  productCode: string;
  productName: string;
  spec: string;
  unit: string;
  orderQty: number;
  pickedQty: number;
  warehouse: string;
  location: string;
  batchNo: string;
  pickQty: number;
};

type PickQcRow = PickProductRow & {
  actualQty: number;
  sampleQty: number;
  result: '待判定' | '合格' | '不合格';
  disposal: string;
  qualifiedQty: number;
  defectiveQty: number;
  appearanceValue: string;
  packageValue: string;
};

const activeCategory = ref('pending');
const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});
const selectedSortingRow = ref<SortingDeliveryRow | null>(null);
const pickProductRows = ref<PickProductRow[]>([]);
const pickMode = ref<'simple' | 'detail'>('simple');
const pickStep = ref<'edit' | 'review'>('edit');
const pickQcModalOpen = ref(false);
const pickQcRows = ref<PickQcRow[]>([]);
const activePickQcProductId = ref('');
const activePickQcGroupKey = ref('oqc');
const route = useRoute();
const router = useRouter();

const pickQcGroups = [
  { key: 'oqc', name: '出库质检组', desc: '外观、包装、标识复核' },
  { key: 'shipment', name: '发货复核组', desc: '数量、批次、装箱一致性' },
];
const pickQcDisposalOptions = ['放行出库', '让步放行', '隔离待定', '返工复检', '拦截出库'];

const rows: SortingDeliveryRow[] = [
  { id: 'sd-001', categoryKey: 'pending', pickNo: 'FJ-202606-001', sourceNo: 'CK-XS-202606-005', businessType: '销售出库', customer: '华东渠道客户', warehouse: '产成品库', skuCount: 6, quantity: 42, picker: '未分配', planTime: '2026-06-11 10:00', state: '待分拣' },
  { id: 'sd-002', categoryKey: 'pending', pickNo: 'FJ-202606-002', sourceNo: 'CK-XS-202606-008', businessType: '销售出库', customer: '华北直营客户', warehouse: '产成品库', skuCount: 4, quantity: 31, picker: '未分配', planTime: '2026-06-11 10:30', state: '待分拣' },
  { id: 'sd-003', categoryKey: 'pending', pickNo: 'FJ-202606-003', sourceNo: 'CK-LL-202606-007', businessType: '生产领料', customer: '试制车间', warehouse: '原辅料库', skuCount: 8, quantity: 74, picker: '未分配', planTime: '2026-06-11 11:00', state: '待分拣' },
  { id: 'sd-004', categoryKey: 'pending', pickNo: 'FJ-202606-004', sourceNo: 'CK-LL-202606-006', businessType: '生产领料', customer: '返修工段', warehouse: '残次品库', skuCount: 3, quantity: 16, picker: '未分配', planTime: '2026-06-11 11:30', state: '待分拣' },
  { id: 'sd-005', categoryKey: 'sorting', pickNo: 'FJ-202606-005', sourceNo: 'CK-XS-202606-002', businessType: '销售出库', customer: '深圳直营客户', warehouse: '产成品库', skuCount: 5, quantity: 22, picker: '王仓', planTime: '2026-06-11 09:20', state: '分拣中' },
  { id: 'sd-006', categoryKey: 'sorting', pickNo: 'FJ-202606-006', sourceNo: 'CK-LL-202606-001', businessType: '生产领料', customer: '装配一线', warehouse: '原辅料库', skuCount: 9, quantity: 140, picker: '李库', planTime: '2026-06-11 09:40', state: '分拣中' },
  { id: 'sd-007', categoryKey: 'sorting', pickNo: 'FJ-202606-007', sourceNo: 'CK-LL-202606-003', businessType: '生产领料', customer: '维修工段', warehouse: '内耗品库', skuCount: 2, quantity: 35, picker: '陈仓', planTime: '2026-06-11 10:10', state: '分拣中' },
  { id: 'sd-008', categoryKey: 'sorted', pickNo: 'FJ-202606-008', sourceNo: 'CK-XS-202606-001', businessType: '销售出库', customer: '华南渠道客户', warehouse: '产成品库', skuCount: 4, quantity: 36, picker: '王仓', planTime: '2026-06-10 15:00', state: '已分拣' },
  { id: 'sd-009', categoryKey: 'sorted', pickNo: 'FJ-202606-009', sourceNo: 'CK-XS-202606-006', businessType: '销售出库', customer: '成都项目客户', warehouse: '产成品库', skuCount: 3, quantity: 27, picker: '李库', planTime: '2026-06-10 16:00', state: '已分拣' },
  { id: 'sd-010', categoryKey: 'sorted', pickNo: 'FJ-202606-010', sourceNo: 'CK-LL-202606-002', businessType: '生产领料', customer: '测试车间', warehouse: '原辅料库', skuCount: 5, quantity: 86, picker: '陈仓', planTime: '2026-06-10 16:30', state: '已分拣' },
  { id: 'sd-011', categoryKey: 'history', pickNo: 'FJ-202606-011', sourceNo: 'CK-XS-202606-041', businessType: '销售出库', customer: '华南渠道客户', warehouse: '产成品库', skuCount: 4, quantity: 36, picker: '王仓', planTime: '2026-06-08 14:00', state: '已出库' },
  { id: 'sd-012', categoryKey: 'history', pickNo: 'FJ-202606-012', sourceNo: 'CK-LL-202606-032', businessType: '生产领料', customer: '测试车间', warehouse: '原辅料库', skuCount: 5, quantity: 86, picker: '李库', planTime: '2026-06-09 10:00', state: '已出库' },
  { id: 'sd-013', categoryKey: 'history', pickNo: 'FJ-202606-013', sourceNo: 'CK-XS-202606-046', businessType: '销售出库', customer: '成都项目客户', warehouse: '产成品库', skuCount: 3, quantity: 27, picker: '陈仓', planTime: '2026-06-10 09:30', state: '已出库' },
];

const categoryNodes = computed<AwTreeNode[]>(() => [
  { key: 'history', label: '分拣出库历史', count: countRows('history'), level: 2, icon: 'line-folder', open: true },
  { key: 'pending', label: '待分拣', count: countRows('pending'), level: 2, icon: 'line-folder', open: true },
  { key: 'sorting', label: '分拣中', count: countRows('sorting'), level: 2, icon: 'line-folder', open: true },
  { key: 'sorted', label: '已分拣', count: countRows('sorted'), level: 2, icon: 'line-folder', open: true },
]);

const baseColumns: AwTableColumn[] = [
  { key: 'sourceNo', title: '来源单号', width: 150 },
  { key: 'businessType', title: '业务类型', width: 120 },
  { key: 'warehouse', title: '仓库', width: 120 },
  { key: 'skuCount', title: 'SKU数', width: 90 },
  { key: 'quantity', title: '分拣数量', width: 110 },
  { key: 'picker', title: '分拣人', width: 100 },
  { key: 'planTime', title: '计划时间', width: 150 },
  { key: 'state', title: '状态', width: 100 },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const columns = computed<AwTableColumn[]>(() => (
  activeCategory.value === 'sorted'
    ? [{ key: 'pickNo', title: '出库单号', width: 150, link: true }, ...baseColumns]
    : baseColumns
));

const bulkActions: AwBulkAction[] = [
  { key: 'assign', label: '批量分配' },
  { key: 'print', label: '批量打印' },
];

const pickProductMap: Record<string, PickProductRow[]> = {
  'sd-001': [
    {
      id: 'sd-001-1',
      productCode: 'SP-CP-001',
      productName: '智能温控终端',
      spec: 'AW-T100',
      unit: '台',
      orderQty: 12,
      pickedQty: 4,
      expanded: true,
      batches: [
        { id: 'sd-001-1-a', warehouse: '产成品库', location: 'A-01-03', batchNo: 'PC-202606-01', availableQty: 16, pickQty: 5 },
        { id: 'sd-001-1-b', warehouse: '产成品库', location: 'A-02-01', batchNo: 'PC-202606-02', availableQty: 9, pickQty: 3 },
      ],
    },
    {
      id: 'sd-001-2',
      productCode: 'SP-CP-001',
      productName: '智能温控终端',
      spec: 'AW-T200',
      unit: '台',
      orderQty: 10,
      pickedQty: 0,
      expanded: false,
      batches: [
        { id: 'sd-001-2-a', warehouse: '产成品库', location: 'A-02-01', batchNo: 'PC-202606-02', availableQty: 18, pickQty: 10 },
      ],
    },
    {
      id: 'sd-001-3',
      productCode: 'SP-CP-002',
      productName: '工业采集网关',
      spec: 'AW-G210',
      unit: '台',
      orderQty: 8,
      pickedQty: 0,
      expanded: false,
      batches: [
        { id: 'sd-001-3-a', warehouse: '产成品库', location: 'B-01-06', batchNo: 'PC-202606-02', availableQty: 12, pickQty: 8 },
      ],
    },
    {
      id: 'sd-001-4',
      productCode: 'SP-BC-001',
      productName: '传感器半成品',
      spec: 'SEN-HM',
      unit: '个',
      orderQty: 12,
      pickedQty: 10,
      expanded: false,
      batches: [
        { id: 'sd-001-4-a', warehouse: '产成品库', location: 'A-01-03', batchNo: 'PC-202606-01', availableQty: 30, pickQty: 2 },
      ],
    },
  ],
  'sd-002': [
    { id: 'sd-002-1', productCode: 'SP-CP-003', productName: '边缘控制器', spec: 'AW-E500', unit: '台', orderQty: 10, pickedQty: 2, expanded: true, batches: [{ id: 'sd-002-1-a', warehouse: '产成品库', location: 'A-01-03', batchNo: 'PC-202606-01', availableQty: 14, pickQty: 8 }] },
    { id: 'sd-002-2', productCode: 'SP-CP-004', productName: '数据看板终端', spec: 'AW-D310', unit: '台', orderQty: 6, pickedQty: 0, expanded: false, batches: [{ id: 'sd-002-2-a', warehouse: '产成品库', location: 'A-02-01', batchNo: 'PC-202606-02', availableQty: 8, pickQty: 6 }] },
    { id: 'sd-002-3', productCode: 'SP-DJ-002', productName: '待检通讯模组', spec: 'COM-4G', unit: '个', orderQty: 15, pickedQty: 5, expanded: false, batches: [{ id: 'sd-002-3-a', warehouse: '产成品库', location: 'B-01-06', batchNo: 'PC-202606-01', availableQty: 20, pickQty: 10 }] },
  ],
  'sd-003': [
    { id: 'sd-003-1', productCode: 'SP-YL-001', productName: '铝合金型材', spec: 'AL-6061', unit: 'kg', orderQty: 40, pickedQty: 12, expanded: true, batches: [{ id: 'sd-003-1-a', warehouse: '原辅料库', location: 'C-03-02', batchNo: 'YL-202606-01', availableQty: 96, pickQty: 28 }] },
    { id: 'sd-003-2', productCode: 'SP-YL-002', productName: '主控 PCB 板', spec: 'PCB-V2.1', unit: '片', orderQty: 24, pickedQty: 4, expanded: false, batches: [{ id: 'sd-003-2-a', warehouse: '原辅料库', location: 'C-03-02', batchNo: 'YL-202606-01', availableQty: 60, pickQty: 20 }] },
    { id: 'sd-003-3', productCode: 'SP-YL-003', productName: '包装纸箱', spec: 'PK-01', unit: '个', orderQty: 10, pickedQty: 0, expanded: false, batches: [{ id: 'sd-003-3-a', warehouse: '原辅料库', location: 'C-03-02', batchNo: 'YL-202606-01', availableQty: 45, pickQty: 10 }] },
  ],
  'sd-004': [
    { id: 'sd-004-1', productCode: 'SP-CC-001', productName: '返修控制板', spec: 'CTRL-R', unit: '片', orderQty: 8, pickedQty: 3, expanded: true, batches: [{ id: 'sd-004-1-a', warehouse: '残次品库', location: 'D-01-01', batchNo: 'CC-202606-01', availableQty: 6, pickQty: 5 }] },
    { id: 'sd-004-2', productCode: 'SP-NH-001', productName: '维修耗材包', spec: 'KIT-01', unit: '套', orderQty: 8, pickedQty: 0, expanded: false, batches: [{ id: 'sd-004-2-a', warehouse: '内耗品库', location: 'D-01-01', batchNo: 'NH-202606-01', availableQty: 12, pickQty: 8 }] },
  ],
  'sd-005': [
    { id: 'sd-005-1', productCode: 'SP-CP-001', productName: '智能温控终端', spec: 'AW-T100', unit: '台', orderQty: 8, pickedQty: 3, expanded: true, batches: [{ id: 'sd-005-1-a', warehouse: '产成品库', location: 'A-01-03', batchNo: 'PC-202606-01', availableQty: 13, pickQty: 3 }, { id: 'sd-005-1-b', warehouse: '产成品库', location: 'A-02-01', batchNo: 'PC-202606-02', availableQty: 6, pickQty: 2 }] },
    { id: 'sd-005-2', productCode: 'SP-CP-004', productName: '数据看板终端', spec: 'AW-D310', unit: '台', orderQty: 6, pickedQty: 2, expanded: false, batches: [{ id: 'sd-005-2-a', warehouse: '产成品库', location: 'A-02-01', batchNo: 'PC-202606-02', availableQty: 8, pickQty: 4 }] },
    { id: 'sd-005-3', productCode: 'SP-BC-001', productName: '传感器半成品', spec: 'SEN-HM', unit: '个', orderQty: 8, pickedQty: 5, expanded: false, batches: [{ id: 'sd-005-3-a', warehouse: '产成品库', location: 'B-01-06', batchNo: 'PC-202606-01', availableQty: 18, pickQty: 3 }] },
  ],
  'sd-006': [
    { id: 'sd-006-1', productCode: 'SP-YL-001', productName: '铝合金型材', spec: 'AL-6061', unit: 'kg', orderQty: 60, pickedQty: 20, expanded: true, batches: [{ id: 'sd-006-1-a', warehouse: '原辅料库', location: 'C-03-02', batchNo: 'YL-202606-01', availableQty: 86, pickQty: 25 }, { id: 'sd-006-1-b', warehouse: '原辅料库', location: 'C-04-01', batchNo: 'YL-202606-02', availableQty: 42, pickQty: 15 }] },
    { id: 'sd-006-2', productCode: 'SP-YL-002', productName: '主控 PCB 板', spec: 'PCB-V2.1', unit: '片', orderQty: 36, pickedQty: 8, expanded: false, batches: [{ id: 'sd-006-2-a', warehouse: '原辅料库', location: 'C-03-02', batchNo: 'YL-202606-01', availableQty: 52, pickQty: 28 }] },
    { id: 'sd-006-3', productCode: 'SP-YL-004', productName: '屏蔽线束', spec: 'WIRE-4P', unit: '根', orderQty: 44, pickedQty: 12, expanded: false, batches: [{ id: 'sd-006-3-a', warehouse: '原辅料库', location: 'C-05-08', batchNo: 'YL-202606-03', availableQty: 70, pickQty: 32 }] },
  ],
  'sd-007': [
    { id: 'sd-007-1', productCode: 'SP-NH-001', productName: '维修耗材包', spec: 'KIT-01', unit: '套', orderQty: 18, pickedQty: 6, expanded: true, batches: [{ id: 'sd-007-1-a', warehouse: '内耗品库', location: 'D-01-01', batchNo: 'NH-202606-01', availableQty: 18, pickQty: 8 }, { id: 'sd-007-1-b', warehouse: '内耗品库', location: 'D-01-02', batchNo: 'NH-202606-02', availableQty: 10, pickQty: 4 }] },
    { id: 'sd-007-2', productCode: 'SP-NH-002', productName: '工装垫片', spec: 'PAD-02', unit: '包', orderQty: 17, pickedQty: 5, expanded: false, batches: [{ id: 'sd-007-2-a', warehouse: '内耗品库', location: 'D-02-04', batchNo: 'NH-202606-01', availableQty: 24, pickQty: 12 }] },
  ],
};

const filteredRows = computed(() => rows.filter((row) => {
  const categoryMatched = row.categoryKey === activeCategory.value;
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return categoryMatched && keywordMatched && filterMatched;
}).map((row) => ({
  ...row,
  action: ['pending', 'sorting'].includes(row.categoryKey) ? '分拣' : ['sorted', 'history'].includes(row.categoryKey) ? '查看' : '处理',
})));

const pickReviewRows = computed<PickReviewRow[]>(() => {
  if (!selectedSortingRow.value) return [];
  return pickProductRows.value.flatMap((product) => {
    if (pickMode.value === 'simple') {
      return [{
        id: `${product.id}-simple`,
        productCode: product.productCode,
        productName: product.productName,
        spec: product.spec,
        unit: product.unit,
        orderQty: product.orderQty,
        pickedQty: product.pickedQty,
        warehouse: selectedSortingRow.value?.warehouse || '-',
        location: '-',
        batchNo: '默认批次',
        pickQty: Number(product.simplePickQty || 0),
      }];
    }

    return product.batches
      .filter((batch) => Number(batch.pickQty || 0) > 0)
      .map((batch) => ({
        id: batch.id,
        productCode: product.productCode,
        productName: product.productName,
        spec: product.spec,
        unit: product.unit,
        orderQty: product.orderQty,
        pickedQty: product.pickedQty,
        warehouse: batch.warehouse,
        location: batch.location,
        batchNo: batch.batchNo,
        pickQty: Number(batch.pickQty || 0),
      }));
  });
});

const pickReviewTotal = computed(() => pickReviewRows.value.reduce((sum, row) => sum + Number(row.pickQty || 0), 0));
const activePickQcRow = computed(() => (
  pickQcRows.value.find((row) => row.id === activePickQcProductId.value) || pickQcRows.value[0] || null
));
const activePickQcGroup = computed(() => (
  pickQcGroups.find((group) => group.key === activePickQcGroupKey.value) || pickQcGroups[0]
));

watch(
  () => route.query.pick,
  (pickId) => {
    if (typeof pickId === 'string') openPickModalById(pickId);
  },
  { immediate: true },
);

function countRows(categoryKey: string) {
  return rows.filter((row) => row.categoryKey === categoryKey).length;
}

function setColumnFilter(columnKey: string, value: string) {
  if (value) columnFilters[columnKey] = value;
  else delete columnFilters[columnKey];
}

function selectCategory(key: string) {
  activeCategory.value = key;
}

function openPickModalById(id: string) {
  const row = rows.find((item) => item.id === id);
  if (!row) return;
  selectedSortingRow.value = row;
  pickMode.value = route.query.mode === 'detail' ? 'detail' : 'simple';
  pickStep.value = 'edit';
  pickProductRows.value = (pickProductMap[row.id] || []).map((item) => ({
    ...item,
    simplePickQty: productPickTotal(item),
    batches: item.batches.map((batch) => ({ ...batch })),
  }));
}

function closePickModal() {
  closePickQcModal();
  selectedSortingRow.value = null;
  pickProductRows.value = [];
  pickStep.value = 'edit';
  if (route.query.pick) {
    const nextQuery = { ...route.query };
    delete nextQuery.pick;
    delete nextQuery.mode;
    router.replace({ query: nextQuery });
  }
}

function productPickTotal(row: PickProductRow) {
  return row.batches.reduce((sum, batch) => sum + Number(batch.pickQty || 0), 0);
}

function toggleProductExpanded(row: PickProductRow) {
  if (row.batches.length <= 1) return;
  row.expanded = !row.expanded;
}

function setPickMode(mode: 'simple' | 'detail') {
  pickMode.value = mode;
}

function confirmPick() {
  pickStep.value = 'review';
}

function backToPickEdit() {
  pickStep.value = 'edit';
}

function finishPick() {
  closePickModal();
}

function printOutboundOrder() {
  window.print();
}

function openPickQcModal() {
  if (!selectedSortingRow.value) return;
  pickQcRows.value = pickProductRows.value.map((product) => {
    const actualQty = pickMode.value === 'simple'
      ? Number(product.simplePickQty || 0)
      : productPickTotal(product);
    const sendQty = actualQty || Math.max(product.orderQty - product.pickedQty, 0);
    return {
      ...product,
      actualQty: sendQty,
      sampleQty: Math.max(1, Math.ceil(sendQty * 0.1)),
      result: '待判定',
      disposal: '放行出库',
      qualifiedQty: sendQty,
      defectiveQty: 0,
      appearanceValue: '',
      packageValue: '',
    };
  });
  activePickQcProductId.value = pickQcRows.value[0]?.id || '';
  activePickQcGroupKey.value = pickQcGroups[0]?.key || '';
  pickQcModalOpen.value = true;
}

function closePickQcModal() {
  pickQcModalOpen.value = false;
}

function pickQcCompletedCount() {
  return pickQcRows.value.filter((row) => row.result !== '待判定').length;
}

function setPickQcResult(row: PickQcRow, result: '合格' | '不合格') {
  row.result = result;
  if (result === '合格') {
    row.disposal = '放行出库';
    row.qualifiedQty = Number(row.actualQty);
    row.defectiveQty = 0;
  }
  else {
    row.disposal = row.disposal === '放行出库' ? '隔离待定' : row.disposal;
    row.defectiveQty = Math.max(1, Number(row.defectiveQty) || 1);
    row.qualifiedQty = Math.max(Number(row.actualQty) - row.defectiveQty, 0);
  }
}

function submitPickQcGroup() {
  if (!activePickQcRow.value || activePickQcRow.value.result !== '待判定') return;
  setPickQcResult(activePickQcRow.value, '合格');
}

function finishPickQcProduct() {
  if (!activePickQcRow.value) return;
  if (activePickQcRow.value.result === '待判定') setPickQcResult(activePickQcRow.value, '合格');
  const currentIndex = pickQcRows.value.findIndex((row) => row.id === activePickQcRow.value?.id);
  const nextRow = pickQcRows.value.slice(currentIndex + 1).find((row) => row.result === '待判定');
  if (nextRow) {
    activePickQcProductId.value = nextRow.id;
    return;
  }
  pickQcModalOpen.value = false;
}
</script>

<template>
  <AwListPage>
    <template #tree>
      <AwResourceTree
        v-model="activeCategory"
        title="分拣分类"
        :total="rows.length"
        :nodes="categoryNodes"
        @select="selectCategory"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如出库单号、来源单号）"
      create-label="新增分拣单"
      @search="keyword = $event"
    />

    <AwDataTable
      :columns="columns"
      :rows="filteredRows"
      row-key="id"
      :total="filteredRows.length"
      :bulk-actions="bulkActions"
      :filter-values="columnFilters"
      fit-width
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'state'" class="aw-status" :class="{ 'storehouse-status-success': value === '已分拣' }">{{ value }}</span>
        <a
          v-else-if="column.key === 'action' && value === '分拣'"
          class="storehouse-pick-action"
          :href="`/storehouse/sorting-delivery?pick=${record.id}`"
          role="button"
          tabindex="0"
          :data-row-id="record.id"
          @click.prevent.stop="openPickModalById(String(record.id))"
          @keyup.enter.stop="openPickModalById(String(record.id))"
        >
          {{ value }}
        </a>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>

    <div v-if="selectedSortingRow" class="aw-mask" @click="closePickModal">
      <div class="aw-modal lg storehouse-pick-modal" @click.stop>
        <div class="head">
          <div>
            <span class="aw-modal-title">订单产品分拣</span>
            <span class="aw-modal-sub">{{ selectedSortingRow.pickNo }} / {{ selectedSortingRow.sourceNo }}</span>
          </div>
          <button class="aw-modal-close" type="button" @click="closePickModal">×</button>
        </div>
        <div class="storehouse-pick-summary">
          <span>业务类型：{{ selectedSortingRow.businessType }}</span>
          <span>默认仓库：{{ selectedSortingRow.warehouse }}</span>
          <span>SKU 数：{{ selectedSortingRow.skuCount }}</span>
          <span>分拣数量：{{ selectedSortingRow.quantity }}</span>
          <button class="aw-btn primary storehouse-pick-qc-action" type="button" @click="openPickQcModal">执行质检</button>
        </div>
        <div v-if="pickStep === 'edit'" class="storehouse-pick-modebar">
          <a
            :class="{ on: pickMode === 'simple' }"
            :href="`/storehouse/sorting-delivery?pick=${selectedSortingRow.id}&mode=simple`"
            @click.prevent="setPickMode('simple')"
          >
            简洁模式
          </a>
          <a
            :class="{ on: pickMode === 'detail' }"
            :href="`/storehouse/sorting-delivery?pick=${selectedSortingRow.id}&mode=detail`"
            @click.prevent="setPickMode('detail')"
          >
            详情模式
          </a>
        </div>
        <div class="storehouse-pick-body">
          <div v-if="pickStep === 'review'" class="storehouse-pick-review">
            <div class="storehouse-review-head">
              <div>
                <strong>核对信息</strong>
                <span>请核对本次分拣商品、仓库、库位、批次和数量</span>
              </div>
              <div class="storehouse-review-total">本次分拣合计：{{ pickReviewTotal }}</div>
            </div>
            <div class="aw-doc-tbl-wrap">
              <div class="aw-doc-tbl-inner">
                <table class="aw-doc-tbl storehouse-review-table">
                  <thead>
                    <tr>
                      <th style="width:48px">序号</th>
                      <th style="width:112px">商品编号</th>
                      <th style="width:150px">商品名称</th>
                      <th style="width:96px">规格型号</th>
                      <th style="width:54px">单位</th>
                      <th style="width:82px">订单数量</th>
                      <th style="width:92px">已分拣数量</th>
                      <th style="width:110px">出库仓库</th>
                      <th style="width:90px">库位</th>
                      <th style="width:130px">批次</th>
                      <th style="width:92px">本次分拣</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in pickReviewRows" :key="row.id">
                      <td>{{ index + 1 }}</td>
                      <td>{{ row.productCode }}</td>
                      <td class="aw-link">{{ row.productName }}</td>
                      <td>{{ row.spec }}</td>
                      <td>{{ row.unit }}</td>
                      <td>{{ row.orderQty }}</td>
                      <td>{{ row.pickedQty }}</td>
                      <td>{{ row.warehouse }}</td>
                      <td>{{ row.location }}</td>
                      <td>{{ row.batchNo }}</td>
                      <td>{{ row.pickQty }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else-if="pickMode === 'simple'" class="aw-doc-tbl-wrap">
            <div class="aw-doc-tbl-inner">
              <table class="aw-doc-tbl storehouse-simple-pick-table">
                <thead>
                  <tr>
                    <th style="width:48px">序号</th>
                    <th style="width:118px">商品编号</th>
                    <th style="width:170px">商品名称</th>
                    <th style="width:110px">规格型号</th>
                    <th style="width:56px">单位</th>
                    <th style="width:90px">订单数量</th>
                    <th style="width:100px">已分拣数量</th>
                    <th style="width:110px">本次分拣</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(product, index) in pickProductRows" :key="product.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ product.productCode }}</td>
                    <td class="aw-link">{{ product.productName }}</td>
                    <td>{{ product.spec }}</td>
                    <td>{{ product.unit }}</td>
                    <td>{{ product.orderQty }}</td>
                    <td>{{ product.pickedQty }}</td>
                    <td>
                      <input
                        v-model.number="product.simplePickQty"
                        class="aw-input storehouse-pick-number"
                        type="number"
                        min="0"
                        :max="product.orderQty - product.pickedQty"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="aw-doc-tbl-wrap">
            <div class="aw-doc-tbl-inner">
              <table class="aw-doc-tbl storehouse-pick-table">
                <thead>
                  <tr>
                    <th style="width:48px">序号</th>
                    <th style="width:112px">商品编号</th>
                    <th style="width:150px">商品名称</th>
                    <th style="width:100px">规格型号</th>
                    <th style="width:56px">单位</th>
                    <th style="width:84px">订单数量</th>
                    <th style="width:92px">已分拣数量</th>
                    <th style="width:92px">本次分拣</th>
                    <th style="width:136px">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(product, index) in pickProductRows" :key="product.id">
                    <tr
                      :class="{ 'storehouse-product-row-clickable': product.batches.length > 1 }"
                      @click="toggleProductExpanded(product)"
                    >
                      <td>{{ index + 1 }}</td>
                      <td>{{ product.productCode }}</td>
                      <td class="aw-link">{{ product.productName }}</td>
                      <td>{{ product.spec }}</td>
                      <td>{{ product.unit }}</td>
                      <td>{{ product.orderQty }}</td>
                      <td>{{ product.pickedQty }}</td>
                      <td>{{ productPickTotal(product) }}</td>
                      <td>
                        <button
                          v-if="product.batches.length > 1"
                          class="storehouse-link-action"
                          type="button"
                          @click.stop="toggleProductExpanded(product)"
                        >
                          {{ product.expanded ? '收起批次' : '展开批次' }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="product.expanded" class="storehouse-batch-row">
                      <td colspan="9">
                        <div class="storehouse-batch-panel">
                          <div class="storehouse-batch-title">
                            <span>批次分拣明细</span>
                            <span>在库批次列表，填写本次分拣数量</span>
                          </div>
                          <table class="aw-doc-tbl storehouse-batch-table">
                            <thead>
                              <tr>
                                <th style="width:180px">出库仓库</th>
                                <th style="width:150px">库位</th>
                                <th style="width:190px">批次</th>
                                <th style="width:120px">可用库存</th>
                                <th style="width:130px">本次分拣</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="batch in product.batches" :key="batch.id">
                                <td>{{ batch.warehouse }}</td>
                                <td>{{ batch.location }}</td>
                                <td>{{ batch.batchNo }}</td>
                                <td>{{ batch.availableQty }}</td>
                                <td>
                                  <input
                                    v-model.number="batch.pickQty"
                                    class="aw-input storehouse-pick-number"
                                    type="number"
                                    min="0"
                                    :max="batch.availableQty"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="aw-modal-foot">
          <template v-if="pickStep === 'review'">
            <button class="aw-tool-btn" type="button" @click="backToPickEdit">返回修改</button>
            <button class="aw-tool-btn" type="button" @click="printOutboundOrder">打印出库单</button>
            <button class="aw-btn primary" type="button" @click="finishPick">完成分拣</button>
          </template>
          <template v-else>
            <button class="aw-tool-btn" type="button" @click="closePickModal">取消</button>
            <button class="aw-btn primary" type="button" @click="confirmPick">确认分拣</button>
          </template>
        </div>
      </div>

      <div v-if="pickQcModalOpen && activePickQcRow" class="aw-mask storehouse-pick-qc-mask" @click.stop="closePickQcModal">
        <div class="aw-modal lg storehouse-pick-qc-modal" @click.stop>
          <div class="head">
            <div>
              <span class="aw-modal-title">执行质检</span>
              <span class="aw-modal-sub">质检管理 / 出库质检 / {{ selectedSortingRow.sourceNo }} / {{ activePickQcRow.productCode }}</span>
            </div>
            <button class="aw-modal-close" type="button" @click="closePickQcModal">×</button>
          </div>

          <div class="storehouse-pick-qc-body">
            <AwDetailHeader
              title="出库质检"
              :code="selectedSortingRow.pickNo"
              :status-text="`检验中 ${pickQcCompletedCount()}/${pickQcRows.length || 1}`"
              status-tone="yellow"
              :metas="[
                { label: '来源单号', value: selectedSortingRow.sourceNo },
                { label: '客户/部门', value: selectedSortingRow.customer },
                { label: '质检方案', value: '出货包装与外观检验 V2.0' },
                { label: '回写动作', value: '质检完成后回写分拣出库放行状态' },
              ]"
            />

            <section class="qc-product-strip">
              <div class="qc-product-current">
                <span class="qc-product-box-icon">◈</span>
                <strong>{{ activePickQcRow.productName }}</strong>
                <span>出货包装与外观检验 V2.0</span>
              </div>
              <div class="qc-product-stats">
                <span class="qc-qty-stat"><span>送检</span><strong>{{ activePickQcRow.actualQty }}</strong></span>
                <span class="qc-qty-stat"><span>抽检</span><strong>{{ activePickQcRow.sampleQty }}</strong></span>
                <span class="qc-qty-stat ok"><span>合格</span><strong>{{ activePickQcRow.qualifiedQty }}</strong></span>
                <span class="qc-qty-stat bad"><span>不良</span><strong>{{ activePickQcRow.defectiveQty }}</strong></span>
              </div>
            </section>

            <section class="qc-inspection-grid">
              <aside class="qc-execute-panel">
                <div class="qc-panel-title">① 产品</div>
                <div class="qc-product-list">
                  <button
                    v-for="row in pickQcRows"
                    :key="row.id"
                    class="qc-product-card"
                    :class="{ on: row.id === activePickQcRow.id, done: row.result !== '待判定' }"
                    type="button"
                    @click="activePickQcProductId = row.id"
                  >
                    <strong>{{ row.productCode }} / {{ row.productName }}</strong>
                    <span>{{ row.spec }}，送检 {{ row.actualQty }} {{ row.unit }}</span>
                    <span>{{ row.result }}</span>
                  </button>
                </div>
              </aside>

              <aside class="qc-execute-panel">
                <div class="qc-panel-title">② 质检组</div>
                <div class="qc-group-list">
                  <button
                    v-for="group in pickQcGroups"
                    :key="group.key"
                    class="qc-group-card"
                    :class="{ on: group.key === activePickQcGroup?.key }"
                    type="button"
                    @click="activePickQcGroupKey = group.key"
                  >
                    <div>
                      <strong>{{ group.name }}</strong>
                      <span v-if="activePickQcRow.result !== '待判定'" class="qc-group-check">✓</span>
                    </div>
                    <span>{{ group.desc }}</span>
                  </button>
                </div>
              </aside>

              <main class="qc-execute-panel qc-item-panel">
                <div class="qc-panel-title">③ 检验项 — {{ activePickQcGroup?.name }}</div>
                <div class="qc-item-list">
                  <article class="qc-item-card">
                    <div class="qc-item-info">
                      <strong>外观</strong>
                      <span>目视检查｜标准：无划伤、无变形</span>
                    </div>
                    <div class="qc-item-input-row">
                      <input v-model="activePickQcRow.appearanceValue" class="aw-input qc-item-input" placeholder="请输入" />
                      <button class="qc-text-judge ok" type="button" @click="setPickQcResult(activePickQcRow, '合格')">合格</button>
                      <button class="qc-text-judge bad" type="button" @click="setPickQcResult(activePickQcRow, '不合格')">不合格</button>
                    </div>
                  </article>
                  <article class="qc-item-card">
                    <div class="qc-item-info">
                      <strong>包装</strong>
                      <span>抽样检查｜标准：包装完整、标识清晰、装箱一致</span>
                    </div>
                    <div class="qc-item-input-row">
                      <input v-model="activePickQcRow.packageValue" class="aw-input qc-item-input" placeholder="请输入" />
                      <button class="qc-text-judge ok" type="button" @click="setPickQcResult(activePickQcRow, '合格')">合格</button>
                      <button class="qc-text-judge bad" type="button" @click="setPickQcResult(activePickQcRow, '不合格')">不合格</button>
                    </div>
                  </article>
                </div>
                <div class="qc-group-submit-row">
                  <button class="qc-btn primary" type="button" @click="submitPickQcGroup">提交本组</button>
                </div>
              </main>
            </section>

            <section class="qc-conclusion-panel">
              <div class="qc-conclusion-left">
                <span class="qc-conclusion-label">产品判定</span>
                <button class="qc-judge-btn ok" :class="{ on: activePickQcRow.result === '合格' }" type="button" @click="setPickQcResult(activePickQcRow, '合格')">合格</button>
                <button class="qc-judge-btn bad" :class="{ on: activePickQcRow.result === '不合格' }" type="button" @click="setPickQcResult(activePickQcRow, '不合格')">不合格</button>
                <span class="qc-conclusion-label">处理方式</span>
                <select v-model="activePickQcRow.disposal" class="aw-select qc-disposal-select" :disabled="activePickQcRow.result === '合格'">
                  <option v-for="option in pickQcDisposalOptions" :key="option" :value="option">{{ option }}</option>
                </select>
                <label class="qc-result-qty-field">
                  <span>数量</span>
                  <input
                    v-model.number="activePickQcRow.defectiveQty"
                    class="aw-input qc-result-qty-input"
                    type="number"
                    min="0"
                    :max="activePickQcRow.actualQty"
                    placeholder="不合格品数量"
                  />
                </label>
              </div>
              <div class="qc-conclusion-actions">
                <button class="qc-btn" type="button">暂存</button>
                <button class="qc-btn primary" type="button" @click="finishPickQcProduct">完成该产品</button>
              </div>
              <p class="qc-flow-note">提示：判合格时默认放行出库；判不合格时选择处理方式，并回写分拣出库放行状态。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  </AwListPage>
</template>

<style scoped>
.storehouse-pick-action {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--aw-primary);
  cursor: pointer;
  font: inherit;
  text-decoration: none;
}

.storehouse-pick-action:hover,
.storehouse-pick-action:focus {
  text-decoration: none;
}

.storehouse-status-success {
  background: #e8f8ef;
  color: #16a34a;
}

.storehouse-pick-modal {
  width: min(1240px, calc(100vw - 48px));
}

.storehouse-pick-summary {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  padding: 0 18px 14px;
  color: #4b5563;
  border-bottom: 1px solid #eef1f7;
}

.storehouse-pick-qc-action {
  margin-left: auto;
}

.storehouse-pick-qc-mask {
  z-index: 1200;
}

.storehouse-pick-qc-modal {
  width: min(1180px, calc(100vw - 48px));
}

.storehouse-pick-qc-body {
  background: #f4f6fa;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(72vh, 680px);
  overflow: auto;
  padding: 14px 18px 18px;
}

.storehouse-pick-modebar {
  display: flex;
  gap: 0;
  padding: 12px 18px 0;
}

.storehouse-pick-modebar a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 18px;
  border: 1px solid #d8dfef;
  background: #fff;
  color: #4b5563;
  cursor: pointer;
  text-decoration: none;
}

.storehouse-pick-modebar a:first-child {
  border-radius: 6px 0 0 6px;
}

.storehouse-pick-modebar a:last-child {
  border-left: 0;
  border-radius: 0 6px 6px 0;
}

.storehouse-pick-modebar a.on {
  border-color: var(--aw-primary);
  background: rgba(86, 119, 252, .1);
  color: var(--aw-primary);
}

.storehouse-pick-body {
  padding: 16px 18px 6px;
}

.storehouse-simple-pick-table,
.storehouse-pick-table,
.storehouse-review-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

.storehouse-simple-pick-table th,
.storehouse-simple-pick-table td,
.storehouse-pick-table th,
.storehouse-pick-table td,
.storehouse-review-table th,
.storehouse-review-table td,
.storehouse-batch-table th,
.storehouse-batch-table td {
  padding: 0 8px;
  max-width: none;
}

.storehouse-batch-row > td {
  background: #f8fbff;
  padding: 12px 14px;
}

.storehouse-product-row-clickable {
  cursor: pointer;
}

.storehouse-batch-panel {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #dfe7ff;
  border-radius: 6px;
  background: #fff;
}

.storehouse-batch-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #6b7280;
}

.storehouse-batch-title span:first-child {
  color: #1f2937;
  font-weight: 600;
}

.storehouse-batch-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

.storehouse-pick-select,
.storehouse-pick-number {
  width: 100%;
  min-width: 0;
}

.storehouse-link-action {
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--aw-primary);
  cursor: pointer;
  font: inherit;
}

.storehouse-link-action + .storehouse-link-action {
  margin-left: 10px;
}

.storehouse-pick-review {
  display: grid;
  gap: 12px;
}

.storehouse-review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid #e4e9f5;
  border-radius: 6px;
  background: #f8fbff;
}

.storehouse-review-head > div:first-child {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.storehouse-review-head strong {
  color: #1f2937;
}

.storehouse-review-head span,
.storehouse-review-total {
  color: #6b7280;
}

.storehouse-review-total {
  white-space: nowrap;
}

.qc-product-strip,
.qc-execute-panel,
.qc-conclusion-panel {
  background: #fff;
  border: 0.5px solid #d9dee8;
  border-radius: 8px;
  box-shadow: none;
}

.qc-product-strip {
  align-items: center;
  background: #eaf2ff;
  border-color: #4b77ff;
  color: #1857d5;
  display: flex;
  gap: 18px;
  min-height: 40px;
  padding: 9px 14px;
}

.qc-product-current {
  align-items: center;
  display: flex;
  flex: 1;
  gap: 10px;
  min-width: 0;
}

.qc-product-current strong,
.qc-qty-stat strong {
  font-weight: 500;
}

.qc-product-current span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qc-product-box-icon {
  align-items: center;
  background: #f2f4f8;
  border-radius: 7px;
  color: #4b6fff;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.qc-product-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: flex-end;
}

.qc-qty-stat {
  align-items: center;
  display: inline-flex;
  gap: 4px;
  font-size: 13px;
}

.qc-qty-stat span {
  color: #345fba;
}

.qc-qty-stat.ok strong {
  color: #14804a;
}

.qc-qty-stat.bad strong {
  color: #d92d20;
}

.qc-inspection-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 255px 224px minmax(0, 1fr);
}

.qc-execute-panel {
  min-height: 270px;
  padding: 12px;
}

.qc-panel-title {
  border-bottom: 0.5px solid #e5e8ef;
  color: #344054;
  font-size: 13px;
  font-weight: 500;
  margin: -2px -12px 8px;
  padding: 0 12px 10px;
}

.qc-product-list,
.qc-group-list,
.qc-item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qc-product-card,
.qc-group-card {
  background: #fff;
  border: 0.5px solid transparent;
  border-radius: 7px;
  color: #1d2939;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 54px;
  padding: 10px 12px;
  position: relative;
  text-align: left;
  width: 100%;
}

.qc-product-card strong,
.qc-group-card strong,
.qc-item-card strong {
  font-size: 14px;
  font-weight: 500;
}

.qc-product-card span,
.qc-group-card span,
.qc-item-info span {
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
}

.qc-product-card.on {
  background: #eaf2ff;
  color: #1857d5;
}

.qc-product-card.on::before {
  background: #2f6bff;
  border-radius: 6px;
  bottom: 7px;
  content: "";
  left: 0;
  position: absolute;
  top: 7px;
  width: 3px;
}

.qc-product-card.done span,
.qc-group-card.done span {
  color: #14804a;
}

.qc-group-card {
  background: #f9fafb;
  border-color: #edf0f5;
}

.qc-group-card.on {
  background: #fff;
  border-color: #2f6bff;
}

.qc-group-card > div {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.qc-group-check {
  color: #14804a;
  font-size: 14px;
}

.qc-item-panel {
  min-width: 0;
}

.qc-item-card {
  align-items: center;
  border-bottom: 0.5px solid #edf0f5;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(210px, 1fr) auto;
  min-height: 76px;
  padding: 8px 0;
}

.qc-item-card:last-child {
  border-bottom: 0;
}

.qc-item-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.qc-item-input-row,
.qc-conclusion-left,
.qc-conclusion-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.qc-item-input {
  width: 112px;
}

.qc-text-judge,
.qc-judge-btn,
.qc-btn {
  background: #fff;
  border: 0.5px solid #d9dee8;
  border-radius: 7px;
  color: #344054;
  cursor: pointer;
  font: inherit;
  min-height: 32px;
  padding: 6px 14px;
}

.qc-text-judge.ok,
.qc-judge-btn.ok.on {
  background: #ecfdf3;
  border-color: #16a34a;
  color: #14804a;
}

.qc-text-judge.bad {
  border-color: #f04438;
  color: #d92d20;
}

.qc-judge-btn.bad.on {
  background: #f04438;
  border-color: #f04438;
  color: #fff;
}

.qc-btn.primary {
  border-color: #2f6bff;
  color: #2f6bff;
}

.qc-group-submit-row {
  border-top: 0.5px solid #e5e8ef;
  display: flex;
  justify-content: flex-end;
  margin: 10px -12px -2px;
  padding: 10px 12px 0;
}

.qc-conclusion-panel {
  align-items: center;
  display: grid;
  gap: 10px 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 12px 14px;
}

.qc-conclusion-left {
  justify-content: flex-start;
}

.qc-conclusion-label {
  color: #344054;
  font-size: 13px;
}

.qc-disposal-select {
  min-width: 130px;
}

.qc-result-qty-field {
  align-items: center;
  color: #344054;
  display: flex;
  font-size: 13px;
  gap: 6px;
}

.qc-result-qty-input {
  width: 112px;
}

.qc-flow-note {
  color: #667085;
  font-size: 12px;
  grid-column: 1 / -1;
  line-height: 1.5;
  margin: 0;
}
</style>
