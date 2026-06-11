<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';

type ShippingDeliveryRow = Record<string, unknown> & {
  id: string;
  categoryKey: string;
  deliveryNo: string;
  sourceNo: string;
  warehouse: string;
  carrier: string;
  receiver: string;
  quantity: number;
  shipTime: string;
  state: string;
};

const activeCategory = ref('pending-shipment');
const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});

const rows: ShippingDeliveryRow[] = [
  { id: 'fh-001', categoryKey: 'pending-shipment', deliveryNo: 'FH-202606-001', sourceNo: 'FJ-202606-001', warehouse: '产成品库', carrier: '顺丰速运', receiver: '华东渠道客户', quantity: 42, shipTime: '2026-06-11 14:00', state: '待发货' },
  { id: 'fh-002', categoryKey: 'pending-shipment', deliveryNo: 'FH-202606-002', sourceNo: 'FJ-202606-002', warehouse: '产成品库', carrier: '京东物流', receiver: '华北直营客户', quantity: 31, shipTime: '2026-06-11 15:00', state: '待发货' },
  { id: 'fh-003', categoryKey: 'pending-shipment', deliveryNo: 'FH-202606-003', sourceNo: 'FJ-202606-003', warehouse: '原辅料库', carrier: '厂内配送', receiver: '试制车间', quantity: 74, shipTime: '2026-06-11 15:30', state: '待发货' },
  { id: 'fh-004', categoryKey: 'pending-receipt', deliveryNo: 'FH-202606-004', sourceNo: 'FJ-202606-005', warehouse: '产成品库', carrier: '德邦快运', receiver: '深圳直营客户', quantity: 22, shipTime: '2026-06-11 09:30', state: '待收货' },
  { id: 'fh-005', categoryKey: 'pending-receipt', deliveryNo: 'FH-202606-005', sourceNo: 'FJ-202606-006', warehouse: '原辅料库', carrier: '厂内配送', receiver: '装配一线', quantity: 140, shipTime: '2026-06-11 10:00', state: '待收货' },
  { id: 'fh-006', categoryKey: 'pending-receipt', deliveryNo: 'FH-202606-006', sourceNo: 'FJ-202606-007', warehouse: '内耗品库', carrier: '厂内配送', receiver: '维修工段', quantity: 35, shipTime: '2026-06-11 10:20', state: '待收货' },
  { id: 'fh-007', categoryKey: 'change-confirm', deliveryNo: 'FH-202606-007', sourceNo: 'FJ-202606-009', warehouse: '产成品库', carrier: '顺丰速运', receiver: '成都项目客户', quantity: 27, shipTime: '2026-06-10 16:20', state: '分拣修改确认' },
  { id: 'fh-008', categoryKey: 'change-confirm', deliveryNo: 'FH-202606-008', sourceNo: 'FJ-202606-010', warehouse: '原辅料库', carrier: '厂内配送', receiver: '测试车间', quantity: 86, shipTime: '2026-06-10 16:50', state: '分拣修改确认' },
  { id: 'fh-009', categoryKey: 'completed', deliveryNo: 'FH-202606-009', sourceNo: 'FJ-202606-011', warehouse: '产成品库', carrier: '顺丰速运', receiver: '华南渠道客户', quantity: 36, shipTime: '2026-06-08 15:00', state: '配送完成' },
  { id: 'fh-010', categoryKey: 'completed', deliveryNo: 'FH-202606-010', sourceNo: 'FJ-202606-012', warehouse: '原辅料库', carrier: '厂内配送', receiver: '测试车间', quantity: 86, shipTime: '2026-06-09 11:00', state: '配送完成' },
  { id: 'fh-011', categoryKey: 'completed', deliveryNo: 'FH-202606-011', sourceNo: 'FJ-202606-013', warehouse: '产成品库', carrier: '京东物流', receiver: '成都项目客户', quantity: 27, shipTime: '2026-06-10 10:30', state: '配送完成' },
];

const categoryNodes = computed<AwTreeNode[]>(() => [
  { key: 'pending-shipment', label: '待发货', count: countRows('pending-shipment'), level: 2, icon: 'line-folder', open: true },
  { key: 'pending-receipt', label: '待收货', count: countRows('pending-receipt'), level: 2, icon: 'line-folder', open: true },
  { key: 'change-confirm', label: '分拣修改确认', count: countRows('change-confirm'), level: 2, icon: 'line-folder', open: true },
  { key: 'completed', label: '配送完成', count: countRows('completed'), level: 2, icon: 'line-folder', open: true },
]);

const columns: AwTableColumn[] = [
  { key: 'deliveryNo', title: '配送单号', width: 150, link: true },
  { key: 'sourceNo', title: '来源分拣单', width: 150 },
  { key: 'warehouse', title: '仓库', width: 120, filterOptions: ['产成品库', '原辅料库', '内耗品库', '残次品库'] },
  { key: 'carrier', title: '配送方式', width: 120, filterOptions: ['顺丰速运', '京东物流', '德邦快运', '厂内配送'] },
  { key: 'receiver', title: '收货对象', width: 160 },
  { key: 'quantity', title: '配送数量', width: 110 },
  { key: 'shipTime', title: '发货时间', width: 150 },
  { key: 'state', title: '状态', width: 130, filterOptions: ['待发货', '待收货', '分拣修改确认', '配送完成'] },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const bulkActions: AwBulkAction[] = [
  { key: 'dispatch', label: '批量发货' },
  { key: 'confirm', label: '批量确认' },
];

const filteredRows = computed(() => rows.filter((row) => {
  const categoryMatched = row.categoryKey === activeCategory.value;
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return categoryMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: row.categoryKey === 'completed' ? '查看' : '处理' })));

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
</script>

<template>
  <AwListPage>
    <template #tree>
      <AwResourceTree
        v-model="activeCategory"
        title="配送分类"
        source-text="来源：仓库 - 发货配送"
        :total="rows.length"
        :nodes="categoryNodes"
        @select="selectCategory"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如配送单号、来源分拣单、收货对象）"
      create-label="新增配送单"
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
