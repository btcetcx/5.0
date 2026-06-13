<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import type { DetailAction, DetailFieldItem, DetailMetaItem, DetailTabItem } from '@/components/detail-page/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';

type StorehouseInoutDocRow = Record<string, unknown> & {
  id: string;
  categoryKey: string;
  documentNo: string;
  businessType: string;
  sourceNo: string;
  partner: string;
  warehouse: string;
  qualityRequired: string;
  quantity: number;
  operator: string;
  documentDate: string;
  state: string;
};

const route = useRoute();
const router = useRouter();
const isOutboundMode = computed(() => route.path.includes('/outbound-management'));
const detailId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''));
const activeWarehouse = ref('');
const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});
const activeDetailTab = ref('');
const inboundModalOpen = ref(false);
const inboundDraftRows = ref<Array<ReturnType<typeof detailLineRows>[number] & {
  actualQty: number;
  actualWarehouse: string;
  qualifiedQty: number;
  defectiveQty: number;
  defectiveHandle: string;
}>>([]);
const qcExecutionModalOpen = ref(false);
const activeQcLineKey = ref('');
const activeQcGroupKey = ref('appearance');
const qcExecutionRows = ref<Array<ReturnType<typeof detailLineRows>[number] & {
  actualQty: number;
  actualWarehouse: string;
  sampleQty: number;
  result: '待判定' | '合格' | '不合格';
  disposal: string;
  qualifiedQty: number;
  defectiveQty: number;
  appearanceValue: string;
  sizeValue: string;
  packageValue: string;
}>>([]);
const inboundBusinessTypes = ['生产入库', '退货入库', '来料入库', '采购入库'];
const outboundBusinessTypes = ['销售出库', '领料出库', '换货出库'];
const warehouseNames = ['产成品库', '原辅料库', '内耗品库', '残次品库'];
const qcGroupOptions = [
  { key: 'appearance', name: '成品入库检验组', desc: '外观、尺寸、包装项目' },
  { key: 'function', name: '功能复核组', desc: '关键功能与标识复核' },
];
const qcDisposalOptions = ['入库放行', '让步放行', '隔离待定', '返工复检', '拒收退回'];

const warehouseNodes = computed<AwTreeNode[]>(() => [
  { key: '产成品库', label: '产成品库', count: countRowsByWarehouse('产成品库'), level: 2, icon: 'line-folder', open: true },
  { key: '原辅料库', label: '原辅料库', count: countRowsByWarehouse('原辅料库'), level: 2, icon: 'line-folder', open: true },
  { key: '内耗品库', label: '内耗品库', count: countRowsByWarehouse('内耗品库'), level: 2, icon: 'line-folder', open: true },
  { key: '残次品库', label: '残次品库', count: countRowsByWarehouse('残次品库'), level: 2, icon: 'line-folder', open: true },
]);

const businessTypes = computed(() => (isOutboundMode.value ? outboundBusinessTypes : inboundBusinessTypes));
const pageTitle = '仓库分类';
const createLabel = computed(() => (isOutboundMode.value ? '新增出库单' : '新增入库单'));
const searchPlaceholder = computed(() => (
  isOutboundMode.value
    ? '全局搜索（如来源单号、客户名称、出库部门）'
    : '全局搜索（如单据编号、来源单号、往来单位）'
));
const outboundStateSamples = [
  { id: 'pp-008', state: '待处理' },
  { id: 'pp-009', state: '待处理' },
  { id: 'pp-010', state: '待处理' },
  { id: 'so-001', state: '待处理' },
  { id: 'so-002', state: '待处理' },
  { id: 'ex-001', state: '待处理' },
];
const pageRows = computed(() => {
  if (!isOutboundMode.value) return rows.filter((row) => businessTypes.value.includes(row.businessType));
  return outboundStateSamples
    .map((sample) => {
      const row = rows.find((item) => item.id === sample.id);
      return row ? { ...row, state: sample.state, warehouse: '产成品库' } : null;
    })
    .filter((row): row is StorehouseInoutDocRow => Boolean(row));
});
const pageTotal = computed(() => pageRows.value.length);
const stateFilterOptions = computed(() => Array.from(new Set(pageRows.value.map((row) => row.state))));

function countRowsByWarehouse(warehouse: string) {
  return pageRows.value.filter((row) => row.warehouse === warehouse).length;
}

function firstWarehouseWithRows() {
  return warehouseNodes.value.find((node) => Number(node.count) > 0)?.key || warehouseNodes.value[0]?.key || '';
}

const columns = computed<AwTableColumn[]>(() => {
  const commonColumns: AwTableColumn[] = [
    { key: 'sourceNo', title: '来源单号', width: 150 },
    { key: 'businessType', title: '业务类型', width: 120 },
    { key: 'partner', title: isOutboundMode.value ? '客户名称/出库部门' : '往来单位/领料部门', width: 180 },
    { key: 'warehouse', title: '仓库', width: 120 },
    { key: 'qualityRequired', title: '是否质检', width: 220 },
    { key: 'quantity', title: '单据数量', width: 110 },
    { key: 'operator', title: '经办人', width: 100 },
    { key: 'documentDate', title: '单据日期', width: 130 },
    { key: 'state', title: '状态', width: 100, filterOptions: stateFilterOptions.value },
    { key: 'action', title: '操作', width: 90, fixed: 'right' },
  ];

  if (isOutboundMode.value) return commonColumns;
  return [
    { key: 'documentNo', title: '单据编号', width: 150, link: true },
    { key: 'businessType', title: '业务类型', width: 120 },
    { key: 'sourceNo', title: '来源单号', width: 150 },
    ...commonColumns.slice(2),
  ];
});

function noQuality() {
  return { qualityRequired: '否' };
}

function qualityByBusiness(row: Pick<StorehouseInoutDocRow, 'businessType' | 'warehouse' | 'partner'>) {
  if (row.businessType === '采购入库' || row.businessType === '来料入库') {
    if (row.warehouse === '内耗品库') {
      return row.partner.includes('包装') || row.partner.includes('辅料')
        ? { qualityRequired: '包装辅料来料检验方案 V1.1' }
        : noQuality();
    }
    const plan = row.partner.includes('材料') || row.partner.includes('五金') || row.partner.includes('线缆') ? '型材来料检验方案 V1.8' : '轴承来料检验方案 V3.2';
    return { qualityRequired: plan };
  }

  if (row.businessType === '生产入库') {
    const isRepairOrDefect = row.warehouse === '残次品库' || row.partner.includes('返修') || row.partner.includes('隔离');
    return { qualityRequired: isRepairOrDefect ? '返修复检方案 V1.6' : '成品入库检验规范 V4.1' };
  }

  if (row.businessType === '退货入库') {
    return { qualityRequired: row.warehouse === '残次品库' || row.partner.includes('售后') ? '返修复检方案 V1.6' : '成品入库检验规范 V4.1' };
  }

  if (row.businessType === '领料出库') {
    if (row.warehouse === '内耗品库') return noQuality();
    return { qualityRequired: '过程巡检方案 V2.4' };
  }

  if (row.businessType === '销售出库' || row.businessType === '换货出库') {
    return { qualityRequired: row.warehouse === '残次品库' || row.partner.includes('售后') ? '售后备件出货检验方案 V1.3' : '出货包装与外观检验 V2.0' };
  }

  return noQuality();
}

const rows: StorehouseInoutDocRow[] = [
  { id: 'pi-001', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-001', businessType: '采购入库', sourceNo: 'CGDD-202606-011', partner: '深圳安达电子', warehouse: '原辅料库', quantity: 320, operator: '李库', documentDate: '2026-06-08', state: '待入库' },
  { id: 'pi-002', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-002', businessType: '采购入库', sourceNo: 'CGDD-202606-012', partner: '东莞松湖材料', warehouse: '原辅料库', quantity: 180, operator: '王仓', documentDate: '2026-06-08', state: '已完成' },
  { id: 'pi-003', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-003', businessType: '采购入库', sourceNo: 'CGDD-202606-013', partner: '广州宏芯科技', warehouse: '原辅料库', quantity: 96, operator: '陈仓', documentDate: '2026-06-09', state: '待质检' },
  { id: 'pi-004', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-004', businessType: '采购入库', sourceNo: 'CGDD-202606-014', partner: '佛山包装制品', warehouse: '内耗品库', quantity: 240, operator: '赵强', documentDate: '2026-06-10', state: '待入库' },
  { id: 'pi-005', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-005', businessType: '采购入库', sourceNo: 'CGDD-202606-015', partner: '惠州联创线缆', warehouse: '原辅料库', quantity: 420, operator: '李库', documentDate: '2026-06-10', state: '待入库' },
  { id: 'pi-006', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-006', businessType: '采购入库', sourceNo: 'CGDD-202606-016', partner: '中山精密五金', warehouse: '原辅料库', quantity: 150, operator: '王仓', documentDate: '2026-06-11', state: '已完成' },
  { id: 'pi-007', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-007', businessType: '采购入库', sourceNo: 'CGDD-202606-017', partner: '广州办公耗材', warehouse: '内耗品库', quantity: 88, operator: '陈仓', documentDate: '2026-06-11', state: '待质检' },
  { id: 'pi-008', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-008', businessType: '采购入库', sourceNo: 'CGDD-202606-018', partner: '深圳辅料贸易', warehouse: '内耗品库', quantity: 126, operator: '赵强', documentDate: '2026-06-11', state: '待入库' },
  { id: 'li-001', categoryKey: 'material-inbound', documentNo: 'RK-LL-202606-001', businessType: '来料入库', sourceNo: 'LLTZ-202606-011', partner: '海南智造科技', warehouse: '原辅料库', quantity: 380, operator: '李库', documentDate: '2026-06-08', state: '待入库' },
  { id: 'li-002', categoryKey: 'material-inbound', documentNo: 'RK-LL-202606-002', businessType: '来料入库', sourceNo: 'LLTZ-202606-012', partner: '深圳渠道客户', warehouse: '内耗品库', quantity: 260, operator: '王仓', documentDate: '2026-06-09', state: '已完成' },
  { id: 'li-003', categoryKey: 'material-inbound', documentNo: 'RK-LL-202606-003', businessType: '来料入库', sourceNo: 'LLTZ-202606-013', partner: '东莞电子制造', warehouse: '原辅料库', quantity: 420, operator: '陈仓', documentDate: '2026-06-10', state: '待质检' },
  { id: 'li-004', categoryKey: 'material-inbound', documentNo: 'RK-LL-202606-004', businessType: '来料入库', sourceNo: 'LLTZ-202606-014', partner: '佛山包装制品', warehouse: '内耗品库', quantity: 180, operator: '赵强', documentDate: '2026-06-11', state: '待入库' },
  { id: 'mi-001', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-001', businessType: '生产入库', sourceNo: 'SCDD-202606-021', partner: '总装一线', warehouse: '产成品库', quantity: 68, operator: '王仓', documentDate: '2026-06-08', state: '已完成' },
  { id: 'mi-002', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-002', businessType: '生产入库', sourceNo: 'SCDD-202606-022', partner: '测试车间', warehouse: '产成品库', quantity: 45, operator: '李库', documentDate: '2026-06-09', state: '待入库' },
  { id: 'mi-003', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-003', businessType: '生产入库', sourceNo: 'SCDD-202606-023', partner: '装配二线', warehouse: '产成品库', quantity: 72, operator: '陈仓', documentDate: '2026-06-10', state: '待质检' },
  { id: 'mi-004', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-004', businessType: '生产入库', sourceNo: 'SCDD-202606-024', partner: '总装二线', warehouse: '产成品库', quantity: 54, operator: '赵强', documentDate: '2026-06-10', state: '已完成' },
  { id: 'mi-005', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-005', businessType: '生产入库', sourceNo: 'SCDD-202606-025', partner: '返修工段', warehouse: '残次品库', quantity: 12, operator: '王仓', documentDate: '2026-06-10', state: '待入库' },
  { id: 'mi-006', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-006', businessType: '生产入库', sourceNo: 'SCDD-202606-026', partner: '质检隔离区', warehouse: '残次品库', quantity: 9, operator: '李库', documentDate: '2026-06-11', state: '待质检' },
  { id: 'mi-007', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-007', businessType: '生产入库', sourceNo: 'SCDD-202606-027', partner: '包装车间', warehouse: '产成品库', quantity: 63, operator: '陈仓', documentDate: '2026-06-11', state: '待入库' },
  { id: 'ri-001', categoryKey: 'return-inbound', documentNo: 'RK-TH-202606-001', businessType: '退货入库', sourceNo: 'THSQ-202606-011', partner: '华南渠道客户', warehouse: '残次品库', quantity: 6, operator: '赵强', documentDate: '2026-06-11', state: '待入库' },
  { id: 'ri-002', categoryKey: 'return-inbound', documentNo: 'RK-TH-202606-002', businessType: '退货入库', sourceNo: 'THSQ-202606-012', partner: '深圳直营客户', warehouse: '产成品库', quantity: 8, operator: '王仓', documentDate: '2026-06-11', state: '待质检' },
  { id: 'ri-003', categoryKey: 'return-inbound', documentNo: 'RK-TH-202606-003', businessType: '退货入库', sourceNo: 'THSQ-202606-013', partner: '售后换货客户', warehouse: '残次品库', quantity: 4, operator: '李库', documentDate: '2026-06-12', state: '已完成' },
  { id: 'pp-001', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-001', businessType: '领料出库', sourceNo: 'LLSQ-202606-031', partner: '装配一线', warehouse: '原辅料库', quantity: 140, operator: '赵强', documentDate: '2026-06-08', state: '待出库' },
  { id: 'pp-002', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-002', businessType: '领料出库', sourceNo: 'LLSQ-202606-032', partner: '测试车间', warehouse: '原辅料库', quantity: 86, operator: '李库', documentDate: '2026-06-09', state: '已完成' },
  { id: 'pp-003', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-003', businessType: '领料出库', sourceNo: 'LLSQ-202606-033', partner: '维修工段', warehouse: '内耗品库', quantity: 35, operator: '陈仓', documentDate: '2026-06-10', state: '待出库' },
  { id: 'pp-004', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-004', businessType: '领料出库', sourceNo: 'LLSQ-202606-034', partner: '总装二线', warehouse: '原辅料库', quantity: 112, operator: '王仓', documentDate: '2026-06-10', state: '待审核' },
  { id: 'pp-005', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-005', businessType: '领料出库', sourceNo: 'LLSQ-202606-035', partner: '包装车间', warehouse: '内耗品库', quantity: 58, operator: '赵强', documentDate: '2026-06-10', state: '已完成' },
  { id: 'pp-006', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-006', businessType: '领料出库', sourceNo: 'LLSQ-202606-036', partner: '返修工段', warehouse: '残次品库', quantity: 16, operator: '李库', documentDate: '2026-06-11', state: '待出库' },
  { id: 'pp-007', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-007', businessType: '领料出库', sourceNo: 'LLSQ-202606-037', partner: '试制车间', warehouse: '原辅料库', quantity: 74, operator: '陈仓', documentDate: '2026-06-11', state: '待出库' },
  { id: 'pp-008', categoryKey: 'department-picking', documentNo: 'CK-BM-202606-001', businessType: '领料出库', sourceNo: 'LLSQ-202606-041', partner: '研发试制部', warehouse: '产成品库', quantity: 12, operator: '王仓', documentDate: '2026-06-11', state: '待出库' },
  { id: 'pp-009', categoryKey: 'department-picking', documentNo: 'CK-BM-202606-002', businessType: '领料出库', sourceNo: 'LLSQ-202606-042', partner: '市场样机部', warehouse: '产成品库', quantity: 9, operator: '李库', documentDate: '2026-06-11', state: '待审核' },
  { id: 'pp-010', categoryKey: 'department-picking', documentNo: 'CK-BM-202606-003', businessType: '领料出库', sourceNo: 'LLSQ-202606-043', partner: '售后备件部', warehouse: '产成品库', quantity: 15, operator: '陈仓', documentDate: '2026-06-12', state: '待出库' },
  { id: 'pp-011', categoryKey: 'department-picking', documentNo: 'CK-BM-202606-004', businessType: '领料出库', sourceNo: 'LLSQ-202606-044', partner: '生产计划部', warehouse: '产成品库', quantity: 18, operator: '赵强', documentDate: '2026-06-12', state: '已完成' },
  { id: 'so-001', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-001', businessType: '销售出库', sourceNo: 'XSDD-202606-041', partner: '华南渠道客户', warehouse: '产成品库', quantity: 36, operator: '王仓', documentDate: '2026-06-08', state: '已完成' },
  { id: 'so-002', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-002', businessType: '销售出库', sourceNo: 'XSDD-202606-042', partner: '深圳直营客户', warehouse: '产成品库', quantity: 22, operator: '李库', documentDate: '2026-06-09', state: '待出库' },
  { id: 'so-003', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-003', businessType: '销售出库', sourceNo: 'XSDD-202606-043', partner: '广州项目客户', warehouse: '产成品库', quantity: 18, operator: '陈仓', documentDate: '2026-06-10', state: '待审核' },
  { id: 'so-004', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-004', businessType: '销售出库', sourceNo: 'XSDD-202606-044', partner: '东莞售后备件', warehouse: '残次品库', quantity: 8, operator: '赵强', documentDate: '2026-06-10', state: '待出库' },
  { id: 'so-005', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-005', businessType: '销售出库', sourceNo: 'XSDD-202606-045', partner: '华东渠道客户', warehouse: '产成品库', quantity: 42, operator: '王仓', documentDate: '2026-06-10', state: '待出库' },
  { id: 'so-006', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-006', businessType: '销售出库', sourceNo: 'XSDD-202606-046', partner: '成都项目客户', warehouse: '产成品库', quantity: 27, operator: '李库', documentDate: '2026-06-11', state: '已完成' },
  { id: 'so-007', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-007', businessType: '销售出库', sourceNo: 'XSDD-202606-047', partner: '售后换货客户', warehouse: '残次品库', quantity: 6, operator: '陈仓', documentDate: '2026-06-11', state: '待审核' },
  { id: 'so-008', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-008', businessType: '销售出库', sourceNo: 'XSDD-202606-048', partner: '华北直营客户', warehouse: '产成品库', quantity: 31, operator: '赵强', documentDate: '2026-06-11', state: '待出库' },
  { id: 'ex-001', categoryKey: 'exchange-outbound', documentNo: 'CK-HH-202606-001', businessType: '换货出库', sourceNo: 'HH-202606-011', partner: '售后换货客户', warehouse: '残次品库', quantity: 6, operator: '陈仓', documentDate: '2026-06-12', state: '待出库' },
  { id: 'ex-002', categoryKey: 'exchange-outbound', documentNo: 'CK-HH-202606-002', businessType: '换货出库', sourceNo: 'HH-202606-012', partner: '华东渠道客户', warehouse: '产成品库', quantity: 12, operator: '王仓', documentDate: '2026-06-12', state: '待审核' },
  { id: 'ex-003', categoryKey: 'exchange-outbound', documentNo: 'CK-HH-202606-003', businessType: '换货出库', sourceNo: 'HH-202606-013', partner: '深圳直营客户', warehouse: '产成品库', quantity: 8, operator: '李库', documentDate: '2026-06-12', state: '已完成' },
].map((row) => ({ ...row, ...qualityByBusiness(row) }));

const bulkActions: AwBulkAction[] = [
  { key: 'submit', label: '批量提交' },
  { key: 'audit', label: '批量审核' },
];

const detailRow = computed(() => (
  detailId.value
    ? pageRows.value.find((row) => row.id === detailId.value) || null
    : null
));
const detailTabs = computed<DetailTabItem[]>(() => {
  const labels = isOutboundMode.value
    ? ['出库信息', '物品明细', '分拣记录', '质检记录', '操作记录']
    : ['入库信息', '物品明细', '质检记录', '上架记录', '操作记录'];
  return labels.map((label) => ({ key: label, label }));
});
const detailActions = computed<DetailAction[]>(() => {
  if (!isOutboundMode.value) return [{ key: 'inbound', label: '入库', primary: true }];
  const actions: DetailAction[] = [
    { key: 'print', label: '打印' },
    { key: 'export', label: '导出' },
  ];
  return [{ key: 'issueSorting', label: '下发分拣', primary: true }, ...actions];
});

const filteredRows = computed(() => pageRows.value.filter((row) => {
  const warehouseMatched = row.warehouse === activeWarehouse.value;
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return warehouseMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: '查看' })));

function textOf(value: unknown) {
  return value === undefined || value === null || value === '' ? '-' : String(value);
}

function detailTitle(row: StorehouseInoutDocRow) {
  return `${row.businessType}详情`;
}

function detailStatusTone(row: StorehouseInoutDocRow) {
  const state = String(row.state);
  if (state.includes('完成') || state.includes('已处理') || state.includes('已分拣') || state.includes('已出库') || state.includes('已入库') || state.includes('过账')) return 'green';
  if (state.includes('部分')) return 'blue';
  if (state.includes('审') || state.includes('检') || state.includes('待')) return 'yellow';
  return 'blue';
}

function postStatusByState(state: string) {
  if (state === '部分出库') return '部分过账';
  if (['已出库', '已完成'].includes(state)) return '已过账';
  return '待过账';
}

function detailMetas(row: StorehouseInoutDocRow): DetailMetaItem[] {
  return [
    { label: '来源单号', value: textOf(row.sourceNo) },
    { label: '仓库', value: textOf(row.warehouse) },
    { label: '经办人', value: textOf(row.operator) },
  ];
}

function detailFields(row: StorehouseInoutDocRow): DetailFieldItem[] {
  const partnerLabel = isOutboundMode.value ? '客户名称/出库部门' : '往来单位/领料部门';
  return [
    { label: '单据编号', value: textOf(row.documentNo) },
    { label: '来源单号', value: textOf(row.sourceNo) },
    { label: '业务类型', value: textOf(row.businessType) },
    { label: partnerLabel, value: textOf(row.partner) },
    { label: '仓库', value: textOf(row.warehouse) },
    { label: '是否质检', value: textOf(row.qualityRequired) },
    { label: '单据数量', value: textOf(row.quantity) },
    { label: '经办人', value: textOf(row.operator) },
    { label: '单据日期', value: textOf(row.documentDate) },
    { label: '状态', value: textOf(row.state) },
  ];
}

function detailLineRows(row: StorehouseInoutDocRow) {
  const firstQty = Math.max(1, Math.ceil(row.quantity * 0.6));
  const secondQty = Math.max(1, row.quantity - firstQty);
  const shippedRate = row.state === '部分出库' ? 0.5 : ['已出库', '已完成'].includes(row.state) ? 1 : 0;
  const shippedQty = (qty: number) => Math.floor(qty * shippedRate);
  return [
    {
      sourceDoc: row.sourceNo,
      sourceLine: `${row.sourceNo}-01`,
      itemCode: isOutboundMode.value ? 'SP-CP-001' : 'SP-YL-001',
      itemName: isOutboundMode.value ? '智能温控终端' : '铝合金型材',
      model: isOutboundMode.value ? 'AW-T100' : 'AL-6061',
      unit: isOutboundMode.value ? '台' : 'kg',
      orderQty: firstQty,
      qty: shippedQty(firstQty),
      remainQty: firstQty - shippedQty(firstQty),
      location: isOutboundMode.value ? 'CP-A01' : 'YL-A03',
      postStatus: postStatusByState(row.state),
    },
    {
      sourceDoc: row.sourceNo,
      sourceLine: `${row.sourceNo}-02`,
      itemCode: isOutboundMode.value ? 'SP-CP-002' : 'SP-YL-002',
      itemName: isOutboundMode.value ? '工业采集网关' : '主控 PCB 板',
      model: isOutboundMode.value ? 'AW-G210' : 'PCB-V2.1',
      unit: isOutboundMode.value ? '台' : '片',
      orderQty: secondQty,
      qty: shippedQty(secondQty),
      remainQty: secondQty - shippedQty(secondQty),
      location: isOutboundMode.value ? 'CP-A02' : 'YL-B01',
      postStatus: postStatusByState(row.state),
    },
  ];
}

function qualityRows(row: StorehouseInoutDocRow) {
  if (String(row.qualityRequired).includes('否')) return [];
  return [
    {
      plan: row.qualityRequired,
      object: `${row.partner} / ${row.sourceNo}`,
      inspector: '陈质检',
      sampleQty: Math.max(1, Math.ceil(row.quantity * 0.1)),
      result: String(row.state).includes('完成') ? '已放行' : '待检验',
    },
  ];
}

function requiresQuality(row: StorehouseInoutDocRow) {
  return !String(row.qualityRequired).includes('否');
}

function sortingRows(row: StorehouseInoutDocRow) {
  if (row.state === '待处理') return [];
  const splitCount = row.quantity > 30 || row.state === '部分出库' ? 2 : 1;
  const firstQty = splitCount > 1 ? Math.ceil(row.quantity * 0.55) : row.quantity;
  const quantities = splitCount > 1 ? [firstQty, row.quantity - firstQty] : [row.quantity];
  return quantities.map((qty, index) => ({
    sortingNo: `${row.documentNo}-FJ-${String(index + 1).padStart(2, '0')}`,
    sorter: index % 2 === 0 ? '王仓' : '李库',
    location: index % 2 === 0 ? 'CP-A01' : 'CP-A02',
    qty,
    result: row.state === '部分出库' && index === quantities.length - 1 ? '待分拣' : '已分拣',
  }));
}

function shelfRows(row: StorehouseInoutDocRow) {
  return detailLineRows(row).map((line, index) => ({
    taskNo: `${row.documentNo}-SJ-0${index + 1}`,
    itemCode: line.itemCode,
    itemName: line.itemName,
    location: line.location,
    qty: line.qty,
    result: String(row.state).includes('完成') ? '已上架' : '待上架',
  }));
}

function recordRows(row: StorehouseInoutDocRow) {
  return [
    { time: `${row.documentDate} 09:12`, user: row.operator, action: '创建单据', desc: `由${row.businessType}生成仓库中心单据` },
    { time: `${row.documentDate} 10:25`, user: '仓库主管', action: '状态流转', desc: `当前状态：${row.state}` },
  ];
}

function openDetail(id: string) {
  router.push({ path: route.path, query: { ...route.query, id } });
}

function goList() {
  const query = { ...route.query };
  delete query.id;
  router.push({ path: route.path, query });
}

function handleDetailAction(key: string) {
  const currentDetail = detailRow.value;
  if (key === 'inbound' && currentDetail) {
    inboundDraftRows.value = detailLineRows(currentDetail).map((line) => ({
      ...line,
      actualQty: line.orderQty,
      actualWarehouse: currentDetail.warehouse,
      qualifiedQty: requiresQuality(currentDetail) ? line.orderQty : 0,
      defectiveQty: 0,
      defectiveHandle: '入残次品库',
    }));
    inboundModalOpen.value = true;
  }
}

function closeInboundModal() {
  inboundModalOpen.value = false;
}

function goQcExecution() {
  const currentDetail = detailRow.value;
  if (!currentDetail) return;
  const sourceRows = inboundDraftRows.value.length
    ? inboundDraftRows.value
    : detailLineRows(currentDetail).map((line) => ({
        ...line,
        actualQty: line.orderQty,
        actualWarehouse: currentDetail.warehouse,
        qualifiedQty: line.orderQty,
        defectiveQty: 0,
        defectiveHandle: '入残次品库',
      }));
  qcExecutionRows.value = sourceRows.map((line) => {
    const actualQty = Number(line.actualQty || line.orderQty);
    return {
      ...line,
      actualQty,
      actualWarehouse: line.actualWarehouse || currentDetail.warehouse,
      sampleQty: Math.max(1, Math.ceil(actualQty * 0.1)),
      result: '待判定',
      disposal: '入库放行',
      qualifiedQty: actualQty,
      defectiveQty: 0,
      appearanceValue: '',
      sizeValue: '',
      packageValue: '',
    };
  });
  activeQcLineKey.value = qcExecutionRows.value[0]?.sourceLine || '';
  activeQcGroupKey.value = qcGroupOptions[0]?.key || '';
  qcExecutionModalOpen.value = true;
}

function closeQcExecutionModal() {
  qcExecutionModalOpen.value = false;
}

const activeQcLine = computed(() => (
  qcExecutionRows.value.find((line) => line.sourceLine === activeQcLineKey.value) || qcExecutionRows.value[0] || null
));

const activeQcGroup = computed(() => (
  qcGroupOptions.find((group) => group.key === activeQcGroupKey.value) || qcGroupOptions[0]
));

function qcCompletedCount() {
  return qcExecutionRows.value.filter((line) => line.result !== '待判定').length;
}

function setQcResult(line: (typeof qcExecutionRows.value)[number], result: '合格' | '不合格') {
  line.result = result;
  if (result === '合格') {
    line.disposal = '入库放行';
    line.qualifiedQty = Number(line.actualQty);
    line.defectiveQty = 0;
  }
  else {
    line.disposal = line.disposal === '入库放行' ? '隔离待定' : line.disposal;
    line.defectiveQty = Math.max(1, Number(line.defectiveQty) || 1);
    line.qualifiedQty = Math.max(Number(line.actualQty) - line.defectiveQty, 0);
  }
}

function submitQcGroup() {
  if (!activeQcLine.value || activeQcLine.value.result !== '待判定') return;
  setQcResult(activeQcLine.value, '合格');
}

function finishQcProduct() {
  if (!activeQcLine.value) return;
  if (activeQcLine.value.result === '待判定') setQcResult(activeQcLine.value, '合格');
  const currentIndex = qcExecutionRows.value.findIndex((line) => line.sourceLine === activeQcLine.value?.sourceLine);
  const nextLine = qcExecutionRows.value.slice(currentIndex + 1).find((line) => line.result === '待判定');
  if (nextLine) activeQcLineKey.value = nextLine.sourceLine;
  else {
    inboundDraftRows.value = inboundDraftRows.value.map((line) => {
      const qcLine = qcExecutionRows.value.find((item) => item.sourceLine === line.sourceLine);
      return qcLine ? { ...line, actualQty: qcLine.qualifiedQty, qualifiedQty: qcLine.qualifiedQty, defectiveQty: qcLine.defectiveQty } : line;
    });
    qcExecutionModalOpen.value = false;
  }
}

function setColumnFilter(columnKey: string, value: string) {
  if (value) columnFilters[columnKey] = value;
  else delete columnFilters[columnKey];
}

function selectWarehouse(key: string) {
  activeWarehouse.value = key;
}

function handleTreeClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const node = target?.closest<HTMLButtonElement>('[data-key]');
  if (node?.dataset.key) selectWarehouse(node.dataset.key);
}

function goCreate() {
  router.push({
    path: isOutboundMode.value ? '/warehouse/warehouse-outbounds' : '/warehouse/warehouse-inbounds',
    query: {
      action: isOutboundMode.value ? '直接出库' : '直接入库',
      returnTo: route.path,
    },
  });
}

watch(
  warehouseNodes,
  (nodes) => {
    if (!nodes.some((node) => node.key === activeWarehouse.value && Number(node.count) > 0)) {
      activeWarehouse.value = firstWarehouseWithRows();
    }
    Object.keys(columnFilters).forEach((key) => delete columnFilters[key]);
    keyword.value = '';
  },
  { immediate: true },
);

watch(
  [detailId, detailTabs],
  () => {
    if (!detailId.value) return;
    if (!detailTabs.value.some((tab) => tab.key === activeDetailTab.value)) {
      activeDetailTab.value = detailTabs.value[0]?.key || '';
    }
  },
  { immediate: true },
);
</script>

<template>
  <AwDetailPage v-if="detailRow">
    <template #toolbar>
      <AwDetailToolbar
        back-text="返回列表"
        :actions="detailActions"
        @back="goList"
        @action="handleDetailAction"
      />
    </template>

    <template #header>
      <AwDetailHeader
        :title="detailTitle(detailRow)"
        :code="detailRow.documentNo"
        :status-text="detailRow.state"
        :status-tone="detailStatusTone(detailRow)"
        :metas="detailMetas(detailRow)"
      />
    </template>

    <section class="aw-card storehouse-detail-card">
      <AwDetailTabs v-model="activeDetailTab" :tabs="detailTabs" />

      <AwDetailInfoGrid
        v-if="activeDetailTab.includes('信息')"
        :items="detailFields(detailRow)"
      />

      <table v-else-if="activeDetailTab === '物品明细'" class="aw-doc-tbl aw-doc-tbl-fit storehouse-detail-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>来源单据</th>
            <th>物品编码</th>
            <th>物品名称</th>
            <th>规格型号</th>
            <th>单位</th>
            <th>订单数量</th>
            <th>{{ isOutboundMode ? '出库数量' : '入库数量' }}</th>
            <th>剩余数量</th>
            <th>{{ isOutboundMode ? '出库库位' : '入库库位' }}</th>
            <th>过账状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, index) in detailLineRows(detailRow)" :key="line.sourceLine">
            <td>{{ index + 1 }}</td>
            <td>{{ line.sourceDoc }}</td>
            <td>{{ line.itemCode }}</td>
            <td>{{ line.itemName }}</td>
            <td>{{ line.model }}</td>
            <td>{{ line.unit }}</td>
            <td>{{ line.orderQty }}</td>
            <td>{{ line.qty }}</td>
            <td>{{ line.remainQty }}</td>
            <td>{{ line.location }}</td>
            <td>{{ line.postStatus }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else-if="activeDetailTab === '分拣记录'" class="aw-doc-tbl aw-doc-tbl-fit storehouse-detail-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>分拣单号</th>
            <th>分拣人</th>
            <th>分拣库位</th>
            <th>分拣数量</th>
            <th>分拣结果</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortingRows(detailRow).length === 0">
            <td colspan="6">当前状态暂无分拣记录</td>
          </tr>
          <tr v-for="(row, index) in sortingRows(detailRow)" :key="row.sortingNo">
            <td>{{ index + 1 }}</td>
            <td>{{ row.sortingNo }}</td>
            <td>{{ row.sorter }}</td>
            <td>{{ row.location }}</td>
            <td>{{ row.qty }}</td>
            <td>{{ row.result }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else-if="activeDetailTab === '上架记录'" class="aw-doc-tbl aw-doc-tbl-fit storehouse-detail-table">
        <thead>
          <tr>
            <th>上架任务号</th>
            <th>物品编码</th>
            <th>物品名称</th>
            <th>上架库位</th>
            <th>上架数量</th>
            <th>上架结果</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in shelfRows(detailRow)" :key="row.taskNo">
            <td>{{ row.taskNo }}</td>
            <td>{{ row.itemCode }}</td>
            <td>{{ row.itemName }}</td>
            <td>{{ row.location }}</td>
            <td>{{ row.qty }}</td>
            <td>{{ row.result }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else-if="activeDetailTab === '质检记录'" class="aw-doc-tbl aw-doc-tbl-fit storehouse-detail-table">
        <thead>
          <tr>
            <th>质检方案</th>
            <th>质检对象</th>
            <th>检验员</th>
            <th>抽样数量</th>
            <th>检验结果</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="qualityRows(detailRow).length === 0">
            <td colspan="5">当前单据无需质检</td>
          </tr>
          <tr v-for="row in qualityRows(detailRow)" :key="String(row.plan)">
            <td>{{ row.plan }}</td>
            <td>{{ row.object }}</td>
            <td>{{ row.inspector }}</td>
            <td>{{ row.sampleQty }}</td>
            <td>{{ row.result }}</td>
          </tr>
        </tbody>
      </table>

      <table v-else class="aw-doc-tbl aw-doc-tbl-fit storehouse-detail-table">
        <thead>
          <tr>
            <th>操作时间</th>
            <th>操作人</th>
            <th>操作类型</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in recordRows(detailRow)" :key="`${row.time}-${row.action}`">
            <td>{{ row.time }}</td>
            <td>{{ row.user }}</td>
            <td>{{ row.action }}</td>
            <td>{{ row.desc }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="inboundModalOpen && detailRow && !isOutboundMode" class="aw-mask" @click="closeInboundModal">
      <div class="aw-modal lg storehouse-inbound-modal" @click.stop>
        <div class="head">
          <div>
            <span class="aw-modal-title">入库确认</span>
            <span class="aw-modal-sub">{{ detailRow.documentNo }} / {{ detailRow.sourceNo }}</span>
          </div>
          <button class="aw-modal-close" type="button" @click="closeInboundModal">×</button>
        </div>
        <div class="storehouse-inbound-summary">
          <span>入库仓库：{{ detailRow.warehouse }}</span>
          <span>业务类型：{{ detailRow.businessType }}</span>
          <span>入库数量：{{ detailRow.quantity }}</span>
          <span>经办人：{{ detailRow.operator }}</span>
          <span v-if="requiresQuality(detailRow)">质检方案：{{ detailRow.qualityRequired }}</span>
          <button
            v-if="requiresQuality(detailRow)"
            class="aw-btn primary storehouse-summary-action"
            type="button"
            @click="goQcExecution"
          >
            质检
          </button>
        </div>
        <div class="aw-doc-tbl-wrap">
          <table class="aw-doc-tbl aw-doc-tbl-fit storehouse-detail-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>产品编号</th>
                <th>产品名称</th>
                <th>规格型号</th>
                <th>单位</th>
                <th>应入库数量</th>
                <th>实际入库数量</th>
                <th>实际入库仓库</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(line, index) in inboundDraftRows" :key="line.sourceLine">
                <td>{{ index + 1 }}</td>
                <td>{{ line.itemCode }}</td>
                <td>{{ line.itemName }}</td>
                <td>{{ line.model }}</td>
                <td>{{ line.unit }}</td>
                <td>{{ line.orderQty }}</td>
                <td>
                  <input v-model.number="line.actualQty" class="aw-input storehouse-small-input" type="number" min="0" :max="line.orderQty" />
                </td>
                <td>
                  <select v-model="line.actualWarehouse" class="aw-select storehouse-warehouse-select">
                    <option v-for="warehouse in warehouseNames" :key="warehouse" :value="warehouse">{{ warehouse }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-tool-btn" type="button" @click="closeInboundModal">取消</button>
          <button class="aw-btn primary" type="button" @click="closeInboundModal">确认入库</button>
        </div>
      </div>
    </div>

    <div v-if="qcExecutionModalOpen && detailRow && activeQcLine" class="aw-mask storehouse-qc-mask" @click="closeQcExecutionModal">
      <div class="aw-modal lg storehouse-qc-modal" @click.stop>
        <div class="head">
          <div>
            <span class="aw-modal-title">执行质检</span>
            <span class="aw-modal-sub">质检管理 / 入库质检 / {{ detailRow.sourceNo }} / {{ activeQcLine.itemCode }}</span>
          </div>
          <button class="aw-modal-close" type="button" @click="closeQcExecutionModal">×</button>
        </div>

        <div class="storehouse-qc-body">
          <AwDetailHeader
            title="入库质检"
            :code="detailRow.documentNo"
            :status-text="`检验中 ${qcCompletedCount()}/${qcExecutionRows.length || 1}`"
            status-tone="yellow"
            :metas="[
              { label: '来源单号', value: detailRow.sourceNo },
              { label: '质检方案', value: String(detailRow.qualityRequired) },
              { label: '检验员', value: '老夏' },
              { label: '回写动作', value: '质检完成后回写入库可入库数量' },
            ]"
          />

          <section class="qc-product-strip">
            <div class="qc-product-current">
              <span class="qc-product-box-icon">◈</span>
              <strong>{{ activeQcLine.itemName }}</strong>
              <span>{{ detailRow.qualityRequired }}</span>
            </div>
            <div class="qc-product-stats">
              <span class="qc-qty-stat"><span>送检</span><strong>{{ activeQcLine.actualQty }}</strong></span>
              <span class="qc-qty-stat"><span>抽检</span><strong>{{ activeQcLine.sampleQty }}</strong></span>
              <span class="qc-qty-stat ok"><span>合格</span><strong>{{ activeQcLine.qualifiedQty }}</strong></span>
              <span class="qc-qty-stat bad"><span>不良</span><strong>{{ activeQcLine.defectiveQty }}</strong></span>
            </div>
          </section>

          <section class="qc-inspection-grid">
            <aside class="qc-execute-panel">
              <div class="qc-panel-title">① 产品</div>
              <div class="qc-product-list">
                <button
                  v-for="line in qcExecutionRows"
                  :key="line.sourceLine"
                  class="qc-product-card"
                  :class="{ on: line.sourceLine === activeQcLine.sourceLine, done: line.result !== '待判定' }"
                  type="button"
                  @click="activeQcLineKey = line.sourceLine"
                >
                  <strong>{{ line.itemCode }} / {{ line.itemName }}</strong>
                  <span>{{ line.model }}，送检 {{ line.actualQty }} {{ line.unit }}</span>
                  <span>{{ line.result }}</span>
                </button>
              </div>
            </aside>

            <aside class="qc-execute-panel">
              <div class="qc-panel-title">② 质检组</div>
              <div class="qc-group-list">
                <button
                  v-for="group in qcGroupOptions"
                  :key="group.key"
                  class="qc-group-card"
                  :class="{ on: group.key === activeQcGroup?.key }"
                  type="button"
                  @click="activeQcGroupKey = group.key"
                >
                  <div>
                    <strong>{{ group.name }}</strong>
                    <span v-if="activeQcLine.result !== '待判定'" class="qc-group-check">✓</span>
                  </div>
                  <span>{{ group.desc }}</span>
                </button>
              </div>
            </aside>

            <main class="qc-execute-panel qc-item-panel">
              <div class="qc-panel-title">③ 检验项 — {{ activeQcGroup?.name }}</div>
              <div class="qc-item-list">
                <article class="qc-item-card">
                  <div class="qc-item-info">
                    <strong>外观</strong>
                    <span>目视检查｜标准：无划伤、无变形</span>
                  </div>
                  <div class="qc-item-input-row">
                    <input v-model="activeQcLine.appearanceValue" class="aw-input qc-item-input" placeholder="请输入" />
                    <button class="qc-text-judge ok" type="button" @click="setQcResult(activeQcLine, '合格')">合格</button>
                    <button class="qc-text-judge bad" type="button" @click="setQcResult(activeQcLine, '不合格')">不合格</button>
                  </div>
                </article>
                <article class="qc-item-card">
                  <div class="qc-item-info">
                    <strong>尺寸</strong>
                    <span>卡尺测量｜标准：按图纸公差，上限 +0.10，下限 -0.10</span>
                  </div>
                  <div class="qc-item-input-row">
                    <input v-model="activeQcLine.sizeValue" class="aw-input qc-item-input" placeholder="实测值" />
                    <button class="qc-text-judge ok" type="button" @click="setQcResult(activeQcLine, '合格')">合格</button>
                    <button class="qc-text-judge bad" type="button" @click="setQcResult(activeQcLine, '不合格')">不合格</button>
                  </div>
                </article>
                <article class="qc-item-card">
                  <div class="qc-item-info">
                    <strong>包装</strong>
                    <span>抽样检查｜标准：包装完整、标识清晰</span>
                  </div>
                  <div class="qc-item-input-row">
                    <input v-model="activeQcLine.packageValue" class="aw-input qc-item-input" placeholder="请输入" />
                    <button class="qc-text-judge ok" type="button" @click="setQcResult(activeQcLine, '合格')">合格</button>
                    <button class="qc-text-judge bad" type="button" @click="setQcResult(activeQcLine, '不合格')">不合格</button>
                  </div>
                </article>
              </div>
              <div class="qc-group-submit-row">
                <button class="qc-btn primary" type="button" @click="submitQcGroup">提交本组</button>
              </div>
            </main>
          </section>

          <section class="qc-conclusion-panel">
            <div class="qc-conclusion-left">
              <span class="qc-conclusion-label">产品判定</span>
              <button class="qc-judge-btn ok" :class="{ on: activeQcLine.result === '合格' }" type="button" @click="setQcResult(activeQcLine, '合格')">合格</button>
              <button class="qc-judge-btn bad" :class="{ on: activeQcLine.result === '不合格' }" type="button" @click="setQcResult(activeQcLine, '不合格')">不合格</button>
              <span class="qc-conclusion-label">处理方式</span>
              <select v-model="activeQcLine.disposal" class="aw-select qc-disposal-select" :disabled="activeQcLine.result === '合格'">
                <option v-for="option in qcDisposalOptions" :key="option" :value="option">{{ option }}</option>
              </select>
              <label class="qc-result-qty-field">
                <span>数量</span>
                <input
                  v-model.number="activeQcLine.defectiveQty"
                  class="aw-input qc-result-qty-input"
                  type="number"
                  min="0"
                  :max="activeQcLine.actualQty"
                  placeholder="不合格品数量"
                />
              </label>
            </div>
            <div class="qc-conclusion-actions">
              <button class="qc-btn" type="button">暂存</button>
              <button class="qc-btn primary" type="button" @click="finishQcProduct">完成该产品</button>
            </div>
            <p class="qc-flow-note">
              提示：判合格时默认入库放行；判不合格时选择处理方式，并回写本次可入库数量。
            </p>
          </section>
        </div>
      </div>
    </div>
  </AwDetailPage>

  <AwListPage v-else>
    <template #tree>
      <AwResourceTree
        v-model="activeWarehouse"
        :title="pageTitle"
        :total="pageTotal"
        :nodes="warehouseNodes"
        @click="handleTreeClick"
        @select="selectWarehouse"
      />
    </template>

    <AwListToolbar
      :search-placeholder="searchPlaceholder"
      :create-label="createLabel"
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
      fit-width
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'state'" class="aw-status">{{ value }}</span>
        <button
          v-else-if="column.key === 'action'"
          class="aw-link-button"
          type="button"
          @click="openDetail(String(record.id))"
        >
          查看
        </button>
        <span v-else-if="isOutboundMode && column.key === 'sourceNo'" class="storehouse-primary-text">{{ value ?? '-' }}</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>

<style scoped>
.storehouse-primary-text {
  color: var(--aw-primary);
}

.storehouse-detail-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.storehouse-detail-table {
  margin-top: 0;
}

.storehouse-inbound-modal {
  width: min(1040px, calc(100vw - 48px));
}

.storehouse-qc-mask {
  z-index: 1200;
}

.storehouse-qc-modal {
  width: min(1180px, calc(100vw - 48px));
}

.storehouse-qc-body {
  background: #f4f6fa;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(72vh, 680px);
  overflow: auto;
  padding: 14px 18px 18px;
}

.storehouse-inbound-summary {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  padding: 0 18px 14px;
  color: #475569;
}

.storehouse-summary-action {
  margin-left: auto;
}

.storehouse-small-input {
  width: 86px;
}

.storehouse-warehouse-select {
  min-width: 116px;
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

.aw-link-button {
  border: 0;
  background: transparent;
  color: var(--aw-primary);
  cursor: pointer;
  padding: 0;
}
</style>
