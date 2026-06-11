<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
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
const isOutboundMode = computed(() => route.path.includes('/outbound-management'));
const activeWarehouse = ref('');
const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});

const inboundBusinessTypes = ['采购入库', '生产入库'];
const outboundBusinessTypes = ['生产领料', '销售出库'];
const warehouseNames = ['产成品库', '原辅料库', '内耗品库', '残次品库'];
const qualityRequiredOptions = ['否', '轴承来料检验方案 V3.2', '型材来料检验方案 V1.8', '包装辅料来料检验方案 V1.1', '过程巡检方案 V2.4', '成品入库检验规范 V4.1', '返修复检方案 V1.6', '出货包装与外观检验 V2.0', '售后备件出货检验方案 V1.3'];

const warehouseNodes = computed<AwTreeNode[]>(() => [
  { key: '产成品库', label: '产成品库', count: countRowsByWarehouse('产成品库'), level: 2, icon: 'line-folder', open: true },
  { key: '原辅料库', label: '原辅料库', count: countRowsByWarehouse('原辅料库'), level: 2, icon: 'line-folder', open: true },
  { key: '内耗品库', label: '内耗品库', count: countRowsByWarehouse('内耗品库'), level: 2, icon: 'line-folder', open: true },
  { key: '残次品库', label: '残次品库', count: countRowsByWarehouse('残次品库'), level: 2, icon: 'line-folder', open: true },
]);

const businessTypes = computed(() => (isOutboundMode.value ? outboundBusinessTypes : inboundBusinessTypes));
const pageTitle = '仓库分类';
const sourceText = '来源：仓库管理 - 多仓管理';
const createLabel = computed(() => (isOutboundMode.value ? '新增出库单' : '新增入库单'));
const businessTypeOptions = computed(() => businessTypes.value);
const stateOptions = computed(() => (isOutboundMode.value ? ['待审核', '待出库', '已完成'] : ['待审核', '待入库', '已完成']));
const pageRows = computed(() => rows.filter((row) => businessTypes.value.includes(row.businessType)));
const pageTotal = computed(() => pageRows.value.length);

function countRowsByWarehouse(warehouse: string) {
  return rows.filter((row) => businessTypes.value.includes(row.businessType) && row.warehouse === warehouse).length;
}

function firstWarehouseWithRows() {
  return warehouseNodes.value.find((node) => Number(node.count) > 0)?.key || warehouseNodes.value[0]?.key || '';
}

const columns = computed<AwTableColumn[]>(() => [
  { key: 'documentNo', title: '单据编号', width: 150, link: true },
  { key: 'businessType', title: '业务类型', width: 120, filterOptions: businessTypeOptions.value },
  { key: 'sourceNo', title: '来源单号', width: 150 },
  { key: 'partner', title: '往来单位/领料部门', width: 180 },
  { key: 'warehouse', title: '仓库', width: 120, filterOptions: warehouseNames },
  { key: 'qualityRequired', title: '是否质检', width: 220, filterOptions: qualityRequiredOptions },
  { key: 'quantity', title: '单据数量', width: 110 },
  { key: 'operator', title: '经办人', width: 100 },
  { key: 'documentDate', title: '单据日期', width: 130 },
  { key: 'state', title: '状态', width: 100, filterOptions: stateOptions.value },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
]);

function noQuality() {
  return { qualityRequired: '否' };
}

function qualityByBusiness(row: Omit<StorehouseInoutDocRow, 'qualityRequired'>) {
  if (row.businessType === '采购入库') {
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

  if (row.businessType === '生产领料') {
    if (row.warehouse === '内耗品库') return noQuality();
    return { qualityRequired: '过程巡检方案 V2.4' };
  }

  if (row.businessType === '销售出库') {
    return { qualityRequired: row.warehouse === '残次品库' || row.partner.includes('售后') ? '售后备件出货检验方案 V1.3' : '出货包装与外观检验 V2.0' };
  }

  return noQuality();
}

const rows: StorehouseInoutDocRow[] = [
  { id: 'pi-001', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-001', businessType: '采购入库', sourceNo: 'CGDD-202606-011', partner: '深圳安达电子', warehouse: '原辅料库', quantity: 320, operator: '李库', documentDate: '2026-06-08', state: '待入库' },
  { id: 'pi-002', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-002', businessType: '采购入库', sourceNo: 'CGDD-202606-012', partner: '东莞松湖材料', warehouse: '原辅料库', quantity: 180, operator: '王仓', documentDate: '2026-06-08', state: '已完成' },
  { id: 'pi-003', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-003', businessType: '采购入库', sourceNo: 'CGDD-202606-013', partner: '广州宏芯科技', warehouse: '原辅料库', quantity: 96, operator: '陈仓', documentDate: '2026-06-09', state: '待审核' },
  { id: 'pi-004', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-004', businessType: '采购入库', sourceNo: 'CGDD-202606-014', partner: '佛山包装制品', warehouse: '内耗品库', quantity: 240, operator: '赵强', documentDate: '2026-06-10', state: '待入库' },
  { id: 'pi-005', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-005', businessType: '采购入库', sourceNo: 'CGDD-202606-015', partner: '惠州联创线缆', warehouse: '原辅料库', quantity: 420, operator: '李库', documentDate: '2026-06-10', state: '待入库' },
  { id: 'pi-006', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-006', businessType: '采购入库', sourceNo: 'CGDD-202606-016', partner: '中山精密五金', warehouse: '原辅料库', quantity: 150, operator: '王仓', documentDate: '2026-06-11', state: '已完成' },
  { id: 'pi-007', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-007', businessType: '采购入库', sourceNo: 'CGDD-202606-017', partner: '广州办公耗材', warehouse: '内耗品库', quantity: 88, operator: '陈仓', documentDate: '2026-06-11', state: '待审核' },
  { id: 'pi-008', categoryKey: 'purchase-inbound', documentNo: 'RK-CG-202606-008', businessType: '采购入库', sourceNo: 'CGDD-202606-018', partner: '深圳辅料贸易', warehouse: '内耗品库', quantity: 126, operator: '赵强', documentDate: '2026-06-11', state: '待入库' },
  { id: 'mi-001', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-001', businessType: '生产入库', sourceNo: 'SCDD-202606-021', partner: '总装一线', warehouse: '产成品库', quantity: 68, operator: '王仓', documentDate: '2026-06-08', state: '已完成' },
  { id: 'mi-002', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-002', businessType: '生产入库', sourceNo: 'SCDD-202606-022', partner: '测试车间', warehouse: '产成品库', quantity: 45, operator: '李库', documentDate: '2026-06-09', state: '待入库' },
  { id: 'mi-003', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-003', businessType: '生产入库', sourceNo: 'SCDD-202606-023', partner: '装配二线', warehouse: '产成品库', quantity: 72, operator: '陈仓', documentDate: '2026-06-10', state: '待审核' },
  { id: 'mi-004', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-004', businessType: '生产入库', sourceNo: 'SCDD-202606-024', partner: '总装二线', warehouse: '产成品库', quantity: 54, operator: '赵强', documentDate: '2026-06-10', state: '已完成' },
  { id: 'mi-005', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-005', businessType: '生产入库', sourceNo: 'SCDD-202606-025', partner: '返修工段', warehouse: '残次品库', quantity: 12, operator: '王仓', documentDate: '2026-06-10', state: '待入库' },
  { id: 'mi-006', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-006', businessType: '生产入库', sourceNo: 'SCDD-202606-026', partner: '质检隔离区', warehouse: '残次品库', quantity: 9, operator: '李库', documentDate: '2026-06-11', state: '待审核' },
  { id: 'mi-007', categoryKey: 'production-inbound', documentNo: 'RK-SC-202606-007', businessType: '生产入库', sourceNo: 'SCDD-202606-027', partner: '包装车间', warehouse: '产成品库', quantity: 63, operator: '陈仓', documentDate: '2026-06-11', state: '待入库' },
  { id: 'pp-001', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-001', businessType: '生产领料', sourceNo: 'LLSQ-202606-031', partner: '装配一线', warehouse: '原辅料库', quantity: 140, operator: '赵强', documentDate: '2026-06-08', state: '待出库' },
  { id: 'pp-002', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-002', businessType: '生产领料', sourceNo: 'LLSQ-202606-032', partner: '测试车间', warehouse: '原辅料库', quantity: 86, operator: '李库', documentDate: '2026-06-09', state: '已完成' },
  { id: 'pp-003', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-003', businessType: '生产领料', sourceNo: 'LLSQ-202606-033', partner: '维修工段', warehouse: '内耗品库', quantity: 35, operator: '陈仓', documentDate: '2026-06-10', state: '待出库' },
  { id: 'pp-004', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-004', businessType: '生产领料', sourceNo: 'LLSQ-202606-034', partner: '总装二线', warehouse: '原辅料库', quantity: 112, operator: '王仓', documentDate: '2026-06-10', state: '待审核' },
  { id: 'pp-005', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-005', businessType: '生产领料', sourceNo: 'LLSQ-202606-035', partner: '包装车间', warehouse: '内耗品库', quantity: 58, operator: '赵强', documentDate: '2026-06-10', state: '已完成' },
  { id: 'pp-006', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-006', businessType: '生产领料', sourceNo: 'LLSQ-202606-036', partner: '返修工段', warehouse: '残次品库', quantity: 16, operator: '李库', documentDate: '2026-06-11', state: '待出库' },
  { id: 'pp-007', categoryKey: 'production-picking', documentNo: 'CK-LL-202606-007', businessType: '生产领料', sourceNo: 'LLSQ-202606-037', partner: '试制车间', warehouse: '原辅料库', quantity: 74, operator: '陈仓', documentDate: '2026-06-11', state: '待出库' },
  { id: 'so-001', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-001', businessType: '销售出库', sourceNo: 'XSDD-202606-041', partner: '华南渠道客户', warehouse: '产成品库', quantity: 36, operator: '王仓', documentDate: '2026-06-08', state: '已完成' },
  { id: 'so-002', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-002', businessType: '销售出库', sourceNo: 'XSDD-202606-042', partner: '深圳直营客户', warehouse: '产成品库', quantity: 22, operator: '李库', documentDate: '2026-06-09', state: '待出库' },
  { id: 'so-003', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-003', businessType: '销售出库', sourceNo: 'XSDD-202606-043', partner: '广州项目客户', warehouse: '产成品库', quantity: 18, operator: '陈仓', documentDate: '2026-06-10', state: '待审核' },
  { id: 'so-004', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-004', businessType: '销售出库', sourceNo: 'XSDD-202606-044', partner: '东莞售后备件', warehouse: '残次品库', quantity: 8, operator: '赵强', documentDate: '2026-06-10', state: '待出库' },
  { id: 'so-005', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-005', businessType: '销售出库', sourceNo: 'XSDD-202606-045', partner: '华东渠道客户', warehouse: '产成品库', quantity: 42, operator: '王仓', documentDate: '2026-06-10', state: '待出库' },
  { id: 'so-006', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-006', businessType: '销售出库', sourceNo: 'XSDD-202606-046', partner: '成都项目客户', warehouse: '产成品库', quantity: 27, operator: '李库', documentDate: '2026-06-11', state: '已完成' },
  { id: 'so-007', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-007', businessType: '销售出库', sourceNo: 'XSDD-202606-047', partner: '售后换货客户', warehouse: '残次品库', quantity: 6, operator: '陈仓', documentDate: '2026-06-11', state: '待审核' },
  { id: 'so-008', categoryKey: 'sales-outbound', documentNo: 'CK-XS-202606-008', businessType: '销售出库', sourceNo: 'XSDD-202606-048', partner: '华北直营客户', warehouse: '产成品库', quantity: 31, operator: '赵强', documentDate: '2026-06-11', state: '待出库' },
].map((row) => ({ ...row, ...qualityByBusiness(row) }));

const bulkActions: AwBulkAction[] = [
  { key: 'submit', label: '批量提交' },
  { key: 'audit', label: '批量审核' },
];

const filteredRows = computed(() => rows.filter((row) => {
  const modeMatched = businessTypes.value.includes(row.businessType);
  const warehouseMatched = row.warehouse === activeWarehouse.value;
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return modeMatched && warehouseMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: '查看' })));

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
</script>

<template>
  <AwListPage>
    <template #tree>
      <AwResourceTree
        v-model="activeWarehouse"
        :title="pageTitle"
        :source-text="sourceText"
        :total="pageTotal"
        :nodes="warehouseNodes"
        @click="handleTreeClick"
        @select="selectWarehouse"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如单据编号、来源单号、往来单位）"
      :create-label="createLabel"
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
      <template #cell="{ column, value }">
        <span v-if="column.key === 'state'" class="aw-status">{{ value }}</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>
