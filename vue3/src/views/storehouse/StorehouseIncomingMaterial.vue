<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwOptionPickerModal from '@/components/form-page/AwOptionPickerModal.vue';
import type { AttachmentRow, EditableColumn, FormAction } from '@/components/form-page/types';
import type { OptionPickerCategory, OptionPickerColumn, OptionPickerRow } from '@/components/form-page/AwOptionPickerModal.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { DetailAction, DetailFieldItem, DetailTabItem } from '@/components/detail-page/types';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';

type IncomingMaterialLedger = Record<string, unknown> & {
  id: string;
  ledgerNo: string;
  materialCode: string;
  materialName: string;
  materialModel: string;
  materialCategory: string;
  ownerCustomer: string;
  ownership: string;
  unit: string;
  stockQty: number;
  frozenQty: number;
  occupiedQty: number;
  availableQty: number;
  warehouse: string;
  location: string;
  batchNo: string;
  qualityState: string;
  lastBusiness: string;
  lastDate: string;
  state: string;
};

type FlowRecord = {
  id: string;
  ledgerId: string;
  sourceNo: string;
  businessType: string;
  direction: string;
  qty: number;
  beforeQty: number;
  afterQty: number;
  warehouse: string;
  location: string;
  batchNo: string;
  handler: string;
  date: string;
  state: string;
};

const router = useRouter();
const route = useRoute();
const activeCategory = ref('');
const expandedCustomer = ref('');
const activeTab = ref('basic');
const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});
const showCustomerPicker = ref(false);

const incomingForm = reactive({
  subject: '',
  code: '自动生成',
  type: '来料入库',
  ownerCustomer: '海南智造科技',
  department: '仓储部',
  person: '当前用户',
  sourceNo: '',
  remark: '',
});

const incomingLines = ref<Array<Record<string, unknown>>>([
  {
    id: 'line-1',
    sourceDoc: '手工来料',
    sourceLine: '手工明细',
    materialCode: 'KG-PCB-001',
    materialName: '客户主控 PCB',
    spec: 'PCB-V2.1',
    unit: '片',
    qty: 120,
    location: 'YL-KG-A01',
    postStatus: '待过账',
  },
]);

const incomingAttachments = ref<AttachmentRow[]>([
  { id: 1, name: '', type: '来料单据', date: '2026-06-12', remark: '' },
]);

const createActions: FormAction[] = [
  { key: 'cancel', label: '取消' },
  { key: 'reset', label: '重置' },
  { key: 'draft', label: '暂存' },
  { key: 'submit', label: '确认入库', primary: true },
];

const incomingLineColumns: EditableColumn[] = [
  { key: 'sourceDoc', title: '来源单据', width: 150 },
  { key: 'sourceLine', title: '来源明细', width: 150 },
  { key: 'materialCode', title: '物品编码', width: 130 },
  { key: 'materialName', title: '物品名称', width: 160 },
  { key: 'spec', title: '规格型号', width: 120 },
  { key: 'unit', title: '单位', width: 80 },
  { key: 'qty', title: '入库数量', width: 110 },
  { key: 'location', title: '入库库位', width: 130 },
  { key: 'postStatus', title: '过账状态', width: 110 },
];

const ledgers: IncomingMaterialLedger[] = [
  { id: 'im-001', ledgerNo: 'KG-TZ-202606-001', materialCode: 'KG-PCB-001', materialName: '客户主控 PCB', materialModel: 'PCB-V2.1', materialCategory: '电子料', ownerCustomer: '海南智造科技', ownership: '客户产权', unit: '片', stockQty: 380, frozenQty: 20, occupiedQty: 120, availableQty: 240, warehouse: '原辅料库', location: 'YL-KG-A01', batchNo: 'LOT-HN-0608-01', qualityState: '合格', lastBusiness: '生产领用', lastDate: '2026-06-09', state: '可用' },
  { id: 'im-002', ledgerNo: 'KG-TZ-202606-002', materialCode: 'KG-SHELL-002', materialName: '客户定制外壳', materialModel: 'SHELL-C01', materialCategory: '结构件', ownerCustomer: '海南智造科技', ownership: '客户产权', unit: '套', stockQty: 160, frozenQty: 0, occupiedQty: 80, availableQty: 80, warehouse: '原辅料库', location: 'YL-KG-B02', batchNo: 'LOT-HN-0610-01', qualityState: '待检', lastBusiness: '生产领用', lastDate: '2026-06-11', state: '待确认' },
  { id: 'im-003', ledgerNo: 'KG-TZ-202606-003', materialCode: 'KG-PKG-001', materialName: '客户包装彩盒', materialModel: 'PKG-01', materialCategory: '包装料', ownerCustomer: '深圳渠道客户', ownership: '客户寄售', unit: '个', stockQty: 740, frozenQty: 0, occupiedQty: 260, availableQty: 480, warehouse: '内耗品库', location: 'NH-KG-C01', batchNo: 'LOT-SZ-0608-01', qualityState: '免检', lastBusiness: '生产领用', lastDate: '2026-06-10', state: '可用' },
  { id: 'im-004', ledgerNo: 'KG-TZ-202606-004', materialCode: 'KG-WIRE-004', materialName: '客户指定线束', materialModel: 'WIRE-4P', materialCategory: '线缆', ownerCustomer: '广州项目客户', ownership: '客户产权', unit: '根', stockQty: 282, frozenQty: 12, occupiedQty: 90, availableQty: 180, warehouse: '原辅料库', location: 'YL-KG-D01', batchNo: 'LOT-GZ-0609-01', qualityState: '合格', lastBusiness: '盘点调整', lastDate: '2026-06-11', state: '可用' },
  { id: 'im-005', ledgerNo: 'KG-TZ-202606-005', materialCode: 'KG-IC-008', materialName: '客户专用芯片', materialModel: 'IC-A8', materialCategory: '电子料', ownerCustomer: '东莞电子制造', ownership: '客户产权', unit: '颗', stockQty: 1380, frozenQty: 180, occupiedQty: 420, availableQty: 780, warehouse: '原辅料库', location: 'YL-KG-A03', batchNo: 'LOT-DG-0610-01', qualityState: '合格', lastBusiness: '生产领用', lastDate: '2026-06-11', state: '冻结' },
  { id: 'im-006', ledgerNo: 'KG-TZ-202606-006', materialCode: 'KG-LABEL-003', materialName: '客户铭牌标签', materialModel: 'LBL-03', materialCategory: '包装料', ownerCustomer: '佛山代工厂', ownership: '客户借料', unit: '张', stockQty: 540, frozenQty: 0, occupiedQty: 0, availableQty: 540, warehouse: '内耗品库', location: 'NH-KG-C03', batchNo: 'LOT-FS-0610-01', qualityState: '免检', lastBusiness: '退客户出库', lastDate: '2026-06-11', state: '可用' },
  { id: 'im-007', ledgerNo: 'KG-TZ-202606-007', materialCode: 'KG-SCREW-006', materialName: '客户指定螺丝包', materialModel: 'M2.5', materialCategory: '五金件', ownerCustomer: '惠州装配厂', ownership: '客户寄售', unit: '包', stockQty: 3120, frozenQty: 0, occupiedQty: 0, availableQty: 3120, warehouse: '原辅料库', location: 'YL-KG-E02', batchNo: 'LOT-HZ-0611-01', qualityState: '待检', lastBusiness: '退料入库', lastDate: '2026-06-11', state: '待确认' },
];

const flowRecords: FlowRecord[] = [
  { id: 'fl-001', ledgerId: 'im-001', sourceNo: 'KGRK-202606-001', businessType: '客供料入库', direction: '入库', qty: 500, beforeQty: 0, afterQty: 500, warehouse: '原辅料库', location: 'YL-KG-A01', batchNo: 'LOT-HN-0608-01', handler: '李库', date: '2026-06-08', state: '已入库' },
  { id: 'fl-002', ledgerId: 'im-001', sourceNo: 'LLSQ-202606-061', businessType: '生产领用', direction: '出库', qty: 120, beforeQty: 500, afterQty: 380, warehouse: '原辅料库', location: 'YL-KG-A01', batchNo: 'LOT-HN-0608-01', handler: '赵强', date: '2026-06-09', state: '已出库' },
  { id: 'fl-003', ledgerId: 'im-002', sourceNo: 'KGRK-202606-002', businessType: '客供料入库', direction: '入库', qty: 240, beforeQty: 0, afterQty: 240, warehouse: '原辅料库', location: 'YL-KG-B02', batchNo: 'LOT-HN-0610-01', handler: '王仓', date: '2026-06-10', state: '待确认' },
  { id: 'fl-004', ledgerId: 'im-002', sourceNo: 'LLSQ-202606-066', businessType: '生产领用', direction: '出库', qty: 80, beforeQty: 240, afterQty: 160, warehouse: '原辅料库', location: 'YL-KG-B02', batchNo: 'LOT-HN-0610-01', handler: '陈仓', date: '2026-06-11', state: '已出库' },
  { id: 'fl-005', ledgerId: 'im-003', sourceNo: 'KGRK-202606-003', businessType: '客供料入库', direction: '入库', qty: 1000, beforeQty: 0, afterQty: 1000, warehouse: '内耗品库', location: 'NH-KG-C01', batchNo: 'LOT-SZ-0608-01', handler: '李库', date: '2026-06-08', state: '已入库' },
  { id: 'fl-006', ledgerId: 'im-003', sourceNo: 'LLSQ-202606-062', businessType: '生产领用', direction: '出库', qty: 260, beforeQty: 1000, afterQty: 740, warehouse: '内耗品库', location: 'NH-KG-C01', batchNo: 'LOT-SZ-0608-01', handler: '王仓', date: '2026-06-10', state: '已出库' },
  { id: 'fl-007', ledgerId: 'im-004', sourceNo: 'KGRK-202606-004', businessType: '客供料入库', direction: '入库', qty: 360, beforeQty: 0, afterQty: 360, warehouse: '原辅料库', location: 'YL-KG-D01', batchNo: 'LOT-GZ-0609-01', handler: '陈仓', date: '2026-06-09', state: '已入库' },
  { id: 'fl-008', ledgerId: 'im-004', sourceNo: 'LLSQ-202606-063', businessType: '生产领用', direction: '出库', qty: 90, beforeQty: 360, afterQty: 270, warehouse: '原辅料库', location: 'YL-KG-D01', batchNo: 'LOT-GZ-0609-01', handler: '赵强', date: '2026-06-10', state: '已出库' },
  { id: 'fl-009', ledgerId: 'im-004', sourceNo: 'PD-202606-009', businessType: '盘点调整', direction: '入库', qty: 12, beforeQty: 270, afterQty: 282, warehouse: '原辅料库', location: 'YL-KG-D01', batchNo: 'LOT-GZ-0609-01', handler: '陈仓', date: '2026-06-11', state: '已完成' },
  { id: 'fl-010', ledgerId: 'im-005', sourceNo: 'KGRK-202606-005', businessType: '客供料入库', direction: '入库', qty: 1800, beforeQty: 0, afterQty: 1800, warehouse: '原辅料库', location: 'YL-KG-A03', batchNo: 'LOT-DG-0610-01', handler: '李库', date: '2026-06-10', state: '已入库' },
  { id: 'fl-011', ledgerId: 'im-005', sourceNo: 'LLSQ-202606-064', businessType: '生产领用', direction: '出库', qty: 420, beforeQty: 1800, afterQty: 1380, warehouse: '原辅料库', location: 'YL-KG-A03', batchNo: 'LOT-DG-0610-01', handler: '王仓', date: '2026-06-11', state: '已出库' },
  { id: 'fl-012', ledgerId: 'im-006', sourceNo: 'KGRK-202606-006', businessType: '客供料入库', direction: '入库', qty: 600, beforeQty: 0, afterQty: 600, warehouse: '内耗品库', location: 'NH-KG-C03', batchNo: 'LOT-FS-0610-01', handler: '陈仓', date: '2026-06-10', state: '已入库' },
  { id: 'fl-013', ledgerId: 'im-006', sourceNo: 'TCK-202606-004', businessType: '退客户出库', direction: '出库', qty: 60, beforeQty: 600, afterQty: 540, warehouse: '内耗品库', location: 'NH-KG-C03', batchNo: 'LOT-FS-0610-01', handler: '赵强', date: '2026-06-11', state: '已完成' },
  { id: 'fl-014', ledgerId: 'im-007', sourceNo: 'KGRK-202606-007', businessType: '客供料入库', direction: '入库', qty: 3000, beforeQty: 0, afterQty: 3000, warehouse: '原辅料库', location: 'YL-KG-E02', batchNo: 'LOT-HZ-0611-01', handler: '李库', date: '2026-06-11', state: '待确认' },
  { id: 'fl-015', ledgerId: 'im-007', sourceNo: 'TLRK-202606-002', businessType: '退料入库', direction: '入库', qty: 120, beforeQty: 3000, afterQty: 3120, warehouse: '原辅料库', location: 'YL-KG-E02', batchNo: 'LOT-HZ-0611-01', handler: '王仓', date: '2026-06-11', state: '已入库' },
];

const customerNames = computed(() => Array.from(new Set(ledgers.map((row) => row.ownerCustomer))));

const customerCategoryLabels: Record<string, string> = {
  manufacturing: '制造客户',
  channel: '渠道客户',
  project: '项目客户',
  factory: '代工装配',
};

const customerPickerCategories = computed<OptionPickerCategory[]>(() => [
  { key: 'all', label: '全部客户', icon: 'line-folder', count: customerPickerRows.value.length },
  { key: 'manufacturing', label: customerCategoryLabels.manufacturing, icon: 'line-folder' },
  { key: 'channel', label: customerCategoryLabels.channel, icon: 'line-folder' },
  { key: 'project', label: customerCategoryLabels.project, icon: 'line-folder' },
  { key: 'factory', label: customerCategoryLabels.factory, icon: 'line-folder' },
]);

const customerPickerColumns: OptionPickerColumn[] = [
  { key: 'customerName', title: '客户名称', width: 180 },
  { key: 'categoryName', title: '客户分类', width: 120 },
  { key: 'materialKinds', title: '来料分类', width: 160 },
  { key: 'ledgerCount', title: '来料记录', width: 100 },
  { key: 'stockQty', title: '库存数量', width: 110 },
];

const customerPickerRows = computed<OptionPickerRow[]>(() => customerNames.value.map((customer) => {
  const rows = ledgers.filter((row) => row.ownerCustomer === customer);
  const category = getCustomerCategory(customer);
  return {
    id: customer,
    customerName: customer,
    category,
    categoryName: customerCategoryLabels[category],
    materialKinds: Array.from(new Set(rows.map((row) => row.materialCategory))).join('、'),
    ledgerCount: rows.length,
    stockQty: rows.reduce((total, row) => total + row.stockQty, 0),
  };
}));

const treeNodes = computed<AwTreeNode[]>(() => customerNames.value.flatMap((customer) => {
  const customerKey = customerNodeKey(customer);
  const customerRows = ledgers.filter((row) => row.ownerCustomer === customer);
  const childCategories = Array.from(new Set(customerRows.map((row) => row.materialCategory)));
  const customerNode: AwTreeNode = {
    key: customerKey,
    label: customer,
    count: customerRows.length,
    level: 2,
    icon: 'line-folder',
    open: expandedCustomer.value === customer,
  };
  if (expandedCustomer.value !== customer) return [customerNode];
  return [
    customerNode,
    ...childCategories.map((category) => ({
      key: customerCategoryNodeKey(customer, category),
      label: category,
      count: customerRows.filter((row) => row.materialCategory === category).length,
      level: 3 as const,
      icon: 'line-node',
    })),
  ];
}));

const columns: AwTableColumn[] = [
  { key: 'ledgerNo', title: '台账编号', width: 150 },
  { key: 'materialName', title: '物料名称', width: 170, link: true },
  { key: 'materialCode', title: '物料编码', width: 130 },
  { key: 'materialModel', title: '规格型号', width: 110 },
  { key: 'materialCategory', title: '物料分类', width: 110 },
  { key: 'ownerCustomer', title: '归属客户', width: 150 },
  { key: 'unit', title: '单位', width: 80 },
  { key: 'stockQty', title: '库存数量', width: 100 },
  { key: 'frozenQty', title: '冻结数量', width: 100 },
  { key: 'occupiedQty', title: '占用数量', width: 100 },
  { key: 'availableQty', title: '可用数量', width: 100 },
  { key: 'state', title: '状态', width: 100 },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const tabs: DetailTabItem[] = [
  { key: 'basic', label: '基本信息' },
  { key: 'flows', label: '出入库明细' },
  { key: 'stock', label: '库存分布' },
  { key: 'records', label: '操作记录' },
];

const detailActions: DetailAction[] = [
  { key: 'export', label: '导出明细' },
  { key: 'adjust', label: '归属调整', primary: true },
];

const bulkActions: AwBulkAction[] = [
  { key: 'freeze', label: '批量冻结' },
  { key: 'export', label: '批量导出' },
];

const detailId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''));
const isCreateMode = computed(() => route.query.action === 'new');
const currentDetail = computed(() => ledgers.find((row) => row.id === detailId.value) || null);
const currentFlows = computed(() => flowRecords.filter((row) => row.ledgerId === currentDetail.value?.id));

const filteredRows = computed(() => ledgers.filter((row) => {
  const scope = parseTreeKey(activeCategory.value);
  const categoryMatched = scope.category
    ? row.ownerCustomer === scope.customer && row.materialCategory === scope.category
    : row.ownerCustomer === scope.customer;
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return categoryMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: '查看' })));

const detailFields = computed<DetailFieldItem[]>(() => {
  const row = currentDetail.value;
  if (!row) return [];
  return [
    { label: '归属客户', value: row.ownerCustomer },
    { label: '归属方式', value: row.ownership },
    { label: '物料编码', value: row.materialCode },
    { label: '规格型号', value: row.materialModel },
    { label: '物料分类', value: row.materialCategory },
    { label: '库存单位', value: row.unit },
    { label: '库存数量', value: String(row.stockQty) },
    { label: '冻结数量', value: String(row.frozenQty) },
    { label: '占用数量', value: String(row.occupiedQty) },
    { label: '可用数量', value: String(row.availableQty) },
    { label: '默认仓库', value: row.warehouse },
    { label: '默认库位', value: row.location },
    { label: '批次号', value: row.batchNo },
    { label: '质量状态', value: row.qualityState },
  ];
});

function setColumnFilter(columnKey: string, value: string) {
  if (value) columnFilters[columnKey] = value;
  else delete columnFilters[columnKey];
}

function openDetail(id: string) {
  router.push({ path: route.path, query: { ...route.query, id } });
}

function goCreate() {
  router.push({ path: route.path, query: { action: 'new' } });
}

function goList() {
  const nextQuery = { ...route.query };
  delete nextQuery.id;
  delete nextQuery.action;
  router.push({ path: route.path, query: nextQuery });
}

function resetIncomingForm() {
  incomingForm.subject = '';
  incomingForm.code = '自动生成';
  incomingForm.type = '来料入库';
  incomingForm.ownerCustomer = customerNames.value[0] || '海南智造科技';
  incomingForm.department = '仓储部';
  incomingForm.person = '当前用户';
  incomingForm.sourceNo = '';
  incomingForm.remark = '';
  incomingLines.value = [
    {
      id: `line-${Date.now()}`,
      sourceDoc: '手工来料',
      sourceLine: '手工明细',
      materialCode: '',
      materialName: '',
      spec: '',
      unit: '片',
      qty: 0,
      location: '',
      postStatus: '待过账',
    },
  ];
  incomingAttachments.value = [{ id: Date.now(), name: '', type: '来料单据', date: '2026-06-12', remark: '' }];
}

function getCustomerCategory(customer: string) {
  if (customer.includes('渠道')) return 'channel';
  if (customer.includes('项目')) return 'project';
  if (customer.includes('代工') || customer.includes('装配')) return 'factory';
  return 'manufacturing';
}

function confirmCustomerPicker(row: OptionPickerRow) {
  incomingForm.ownerCustomer = String(row.customerName || '');
  showCustomerPicker.value = false;
}

function handleCreateAction(key: string) {
  if (key === 'cancel') goList();
  else if (key === 'reset') resetIncomingForm();
  else goList();
}

function addIncomingLine() {
  incomingLines.value.push({
    id: `line-${Date.now()}`,
    sourceDoc: incomingForm.sourceNo || '手工来料',
    sourceLine: '手工明细',
    materialCode: '',
    materialName: '',
    spec: '',
    unit: '片',
    qty: 0,
    location: '',
    postStatus: '待过账',
  });
}

function removeIncomingLine(row: Record<string, unknown>) {
  if (incomingLines.value.length <= 1) return;
  incomingLines.value = incomingLines.value.filter((item) => item.id !== row.id);
}

function addIncomingAttachment() {
  incomingAttachments.value.push({ id: Date.now(), name: '', type: '来料单据', date: '2026-06-12', remark: '' });
}

function removeIncomingAttachment(row: AttachmentRow) {
  if (incomingAttachments.value.length <= 1) return;
  incomingAttachments.value = incomingAttachments.value.filter((item) => item.id !== row.id);
}

function selectCategory(key: string) {
  activeCategory.value = key;
  const scope = parseTreeKey(key);
  if (scope.customer) expandedCustomer.value = scope.customer;
}

function handleTreeClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const node = target?.closest<HTMLButtonElement>('[data-key]');
  if (node?.dataset.key) selectCategory(node.dataset.key);
}

function renderQty(value: unknown) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : value;
}

function customerNodeKey(customer: string) {
  return `customer:${customer}`;
}

function customerCategoryNodeKey(customer: string, category: string) {
  return `customer:${customer}:category:${category}`;
}

function parseTreeKey(key: string) {
  const match = key.match(/^customer:(.+?)(?::category:(.+))?$/);
  return {
    customer: match?.[1] || customerNames.value[0] || '',
    category: match?.[2] || '',
  };
}

watch(
  treeNodes,
  (nodes) => {
    if (!expandedCustomer.value) expandedCustomer.value = customerNames.value[0] || '';
    if (!nodes.some((node) => node.key === activeCategory.value)) {
      activeCategory.value = customerNodeKey(expandedCustomer.value);
    }
    Object.keys(columnFilters).forEach((key) => delete columnFilters[key]);
    keyword.value = '';
  },
  { immediate: true },
);

watch(currentDetail, (row) => {
  if (detailId.value && !row) goList();
  activeTab.value = 'basic';
});
</script>

<template>
  <AwFormPage v-if="isCreateMode" back-text="返回来料管理" :actions="createActions" @back="goList" @action="handleCreateAction">
    <section class="aw-form-card">
      <div class="aw-detail-section-title">基础信息</div>
      <div class="aw-form-grid">
        <div class="aw-field">
          <label class="req">入库主题</label>
          <input v-model="incomingForm.subject" class="aw-input" placeholder="请输入入库主题" />
        </div>
        <div class="aw-field">
          <label>入库单号</label>
          <input v-model="incomingForm.code" class="aw-input" disabled />
        </div>
        <div class="aw-field">
          <label class="req">入库类型</label>
          <select v-model="incomingForm.type" class="aw-select">
            <option>来料入库</option>
            <option>客供料入库</option>
            <option>退料入库</option>
            <option>直接入库</option>
          </select>
        </div>
        <div class="aw-field">
          <label class="req">归属客户</label>
          <div class="aw-search-trigger-input">
            <input
              :value="incomingForm.ownerCustomer"
              placeholder="请选择归属客户"
              readonly
              @click="showCustomerPicker = true"
            />
            <button type="button" aria-label="打开选择弹窗" @click="showCustomerPicker = true">
              <span class="aw-line-icon line-search"></span>
            </button>
          </div>
        </div>
        <div class="aw-field">
          <label>关联单据</label>
          <input v-model="incomingForm.sourceNo" class="aw-input" placeholder="可手动填写关联单据" />
        </div>
        <div class="aw-field">
          <label>入库部门</label>
          <input v-model="incomingForm.department" class="aw-input" placeholder="请选择入库部门" />
        </div>
        <div class="aw-field">
          <label class="req">入库人员</label>
          <input v-model="incomingForm.person" class="aw-input" placeholder="请选择入库人员" />
        </div>
      </div>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">物品明细</div>
      <AwEditableSubTable
        :columns="incomingLineColumns"
        :rows="incomingLines"
        add-text="新增明细"
        :action-width="80"
        @add="addIncomingLine"
      >
        <template #cell="{ column, row }">
          <input
            v-if="['sourceDoc', 'sourceLine', 'materialCode', 'materialName', 'spec', 'unit', 'location'].includes(column.key)"
            v-model="row[column.key]"
            class="aw-input"
            :placeholder="`请输入${column.title}`"
          />
          <input v-else-if="column.key === 'qty'" v-model.number="row.qty" class="aw-input" type="number" min="0" />
          <select v-else-if="column.key === 'postStatus'" v-model="row.postStatus" class="aw-select">
            <option>待过账</option>
            <option>已过账</option>
          </select>
        </template>
        <template #actions="{ row }">
          <span class="aw-link" style="color: var(--aw-danger)" @click="removeIncomingLine(row)">删除</span>
        </template>
      </AwEditableSubTable>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">附件</div>
      <AwAttachmentTable
        :rows="incomingAttachments"
        :type-options="['来料单据', '客户资料', '质检附件', '其他附件']"
        add-text="新增附件"
        allow-remove-last
        @add="addIncomingAttachment"
        @remove="removeIncomingAttachment"
      />
    </section>

    <AwOptionPickerModal
      :open="showCustomerPicker"
      title="选择归属客户"
      category-title="客户分类"
      search-placeholder="搜索客户名称、客户分类或来料分类"
      :categories="customerPickerCategories"
      :columns="customerPickerColumns"
      :rows="customerPickerRows"
      category-key="category"
      @cancel="showCustomerPicker = false"
      @confirm="confirmCustomerPicker"
    />
  </AwFormPage>

  <AwDetailPage v-else-if="currentDetail">
    <template #toolbar>
      <AwDetailToolbar back-text="返回来料管理" :actions="detailActions" @back="goList" />
    </template>
    <template #header>
      <AwDetailHeader
        :title="`${currentDetail.materialName} 归属详情`"
        :code="currentDetail.ledgerNo"
        :status-text="currentDetail.state"
        status-tone="blue"
        :metas="[
          { label: '归属客户', value: currentDetail.ownerCustomer },
          { label: '库存数量', value: `${currentDetail.stockQty}${currentDetail.unit}` },
          { label: '可用数量', value: `${currentDetail.availableQty}${currentDetail.unit}` },
        ]"
      />
    </template>

    <AwDetailTabs v-model="activeTab" :tabs="tabs" />
    <section class="aw-form-card">
      <AwDetailInfoGrid v-if="activeTab === 'basic'" :items="detailFields" />
      <div v-else-if="activeTab === 'flows'" class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl">
            <thead>
              <tr>
                <th>来源单号</th>
                <th>业务类型</th>
                <th>方向</th>
                <th>变动数量</th>
                <th>变动前</th>
                <th>变动后</th>
                <th>仓库</th>
                <th>库位</th>
                <th>批次号</th>
                <th>经办人</th>
                <th>日期</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in currentFlows" :key="item.id">
                <td>{{ item.sourceNo }}</td>
                <td>{{ item.businessType }}</td>
                <td>{{ item.direction }}</td>
                <td>{{ item.qty }}</td>
                <td>{{ item.beforeQty }}</td>
                <td>{{ item.afterQty }}</td>
                <td>{{ item.warehouse }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.batchNo }}</td>
                <td>{{ item.handler }}</td>
                <td>{{ item.date }}</td>
                <td><span class="aw-status">{{ item.state }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="activeTab === 'stock'" class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl aw-doc-tbl-fit">
            <thead>
              <tr>
                <th>仓库</th>
                <th>库位</th>
                <th>批次号</th>
                <th>质量状态</th>
                <th>库存数量</th>
                <th>冻结数量</th>
                <th>占用数量</th>
                <th>可用数量</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ currentDetail.warehouse }}</td>
                <td>{{ currentDetail.location }}</td>
                <td>{{ currentDetail.batchNo }}</td>
                <td>{{ currentDetail.qualityState }}</td>
                <td>{{ currentDetail.stockQty }}</td>
                <td>{{ currentDetail.frozenQty }}</td>
                <td>{{ currentDetail.occupiedQty }}</td>
                <td>{{ currentDetail.availableQty }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl aw-doc-tbl-fit">
            <thead>
              <tr>
                <th>操作时间</th>
                <th>操作人</th>
                <th>操作类型</th>
                <th>说明</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ currentDetail.lastDate }} 09:30</td>
                <td>系统</td>
                <td>更新库存归属</td>
                <td>根据{{ currentDetail.lastBusiness }}回写客供料库存台账</td>
                <td><span class="aw-status">已完成</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </AwDetailPage>

  <AwListPage v-else>
    <template #tree>
      <AwResourceTree
        v-model="activeCategory"
        title="客户列表"
        :total="ledgers.length"
        :nodes="treeNodes"
        @mousedown="handleTreeClick"
        @click="handleTreeClick"
        @pointerup="handleTreeClick"
        @select="selectCategory"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如物料名称、编码、归属客户、批次）"
      create-label="新增来料"
      :create-handler="goCreate"
      @search="keyword = $event"
    />

    <AwDataTable
      :columns="columns"
      :rows="filteredRows"
      row-key="id"
      :total="filteredRows.length"
      :bulk-actions="bulkActions"
      :filter-values="columnFilters"
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'materialName'" class="aw-link" @click="openDetail(String(record.id))">
          {{ value }}
        </span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(String(record.id))">
          查看
        </span>
        <span v-else-if="column.key === 'state' || column.key === 'qualityState'" class="aw-status">{{ value }}</span>
        <span v-else>{{ renderQty(value) ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>

<style scoped>
.aw-search-trigger-input {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  display: flex;
  height: 34px;
  min-width: 0;
  overflow: hidden;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.aw-search-trigger-input:focus-within {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px rgba(79, 109, 245, 0.12);
}

.aw-search-trigger-input input {
  background: transparent;
  border: 0;
  color: var(--aw-fg);
  cursor: pointer;
  flex: 1;
  font-size: 13px;
  height: 100%;
  min-width: 0;
  outline: 0;
  padding: 0 8px 0 12px;
}

.aw-search-trigger-input button {
  align-items: center;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--aw-border);
  cursor: pointer;
  display: inline-flex;
  height: 100%;
  justify-content: center;
  padding: 0;
  width: 36px;
}

.aw-search-trigger-input button:hover {
  background: var(--aw-primary-light);
}
</style>
