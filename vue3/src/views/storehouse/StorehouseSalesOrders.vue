<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import type { AwBulkAction, AwTableColumn } from '@/components/list-page/types';

type StorehouseSalesOrderRow = Record<string, unknown> & {
  id: string;
  orderNo: string;
  customerName: string;
  warehouse: string;
  skuCount: number;
  orderQty: number;
  pickedQty: number;
  deliveryState: string;
  deliveryDate: string;
  owner: string;
};

const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});

const columns: AwTableColumn[] = [
  { key: 'orderNo', title: '订单编号', width: 160, link: true },
  { key: 'customerName', title: '客户名称', width: 180 },
  { key: 'warehouse', title: '仓库', width: 120, filterOptions: ['产成品库', '原辅料库', '内耗品库', '残次品库'] },
  { key: 'skuCount', title: '商品数', width: 90 },
  { key: 'orderQty', title: '订单数量', width: 110 },
  { key: 'pickedQty', title: '已分拣数', width: 110 },
  { key: 'deliveryState', title: '发货状态', width: 120, filterOptions: ['待分拣', '待发货', '待收货', '配送完成'] },
  { key: 'deliveryDate', title: '交付日期', width: 130 },
  { key: 'owner', title: '负责人', width: 100 },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const rows: StorehouseSalesOrderRow[] = [
  { id: 'so-001', orderNo: 'XSDD-202606-041', customerName: '华南渠道客户', warehouse: '产成品库', skuCount: 4, orderQty: 36, pickedQty: 36, deliveryState: '配送完成', deliveryDate: '2026-06-08', owner: '王仓' },
  { id: 'so-002', orderNo: 'XSDD-202606-042', customerName: '深圳直营客户', warehouse: '产成品库', skuCount: 5, orderQty: 22, pickedQty: 22, deliveryState: '待收货', deliveryDate: '2026-06-11', owner: '李库' },
  { id: 'so-003', orderNo: 'XSDD-202606-043', customerName: '广州项目客户', warehouse: '产成品库', skuCount: 3, orderQty: 18, pickedQty: 0, deliveryState: '待分拣', deliveryDate: '2026-06-12', owner: '陈仓' },
  { id: 'so-004', orderNo: 'XSDD-202606-044', customerName: '东莞售后备件', warehouse: '残次品库', skuCount: 2, orderQty: 8, pickedQty: 0, deliveryState: '待分拣', deliveryDate: '2026-06-12', owner: '赵强' },
  { id: 'so-005', orderNo: 'XSDD-202606-045', customerName: '华东渠道客户', warehouse: '产成品库', skuCount: 6, orderQty: 42, pickedQty: 42, deliveryState: '待发货', deliveryDate: '2026-06-11', owner: '王仓' },
  { id: 'so-006', orderNo: 'XSDD-202606-046', customerName: '成都项目客户', warehouse: '产成品库', skuCount: 3, orderQty: 27, pickedQty: 27, deliveryState: '配送完成', deliveryDate: '2026-06-10', owner: '李库' },
  { id: 'so-007', orderNo: 'XSDD-202606-047', customerName: '售后换货客户', warehouse: '残次品库', skuCount: 2, orderQty: 6, pickedQty: 0, deliveryState: '待分拣', deliveryDate: '2026-06-13', owner: '陈仓' },
  { id: 'so-008', orderNo: 'XSDD-202606-048', customerName: '华北直营客户', warehouse: '产成品库', skuCount: 4, orderQty: 31, pickedQty: 31, deliveryState: '待发货', deliveryDate: '2026-06-11', owner: '赵强' },
  { id: 'so-009', orderNo: 'XSDD-202606-049', customerName: '苏州集成项目', warehouse: '产成品库', skuCount: 5, orderQty: 25, pickedQty: 0, deliveryState: '待分拣', deliveryDate: '2026-06-14', owner: '王仓' },
  { id: 'so-010', orderNo: 'XSDD-202606-050', customerName: '杭州直营客户', warehouse: '产成品库', skuCount: 4, orderQty: 19, pickedQty: 12, deliveryState: '待分拣', deliveryDate: '2026-06-14', owner: '李库' },
];

const bulkActions: AwBulkAction[] = [
  { key: 'pick', label: '批量分拣' },
  { key: 'ship', label: '批量发货' },
];

const filteredRows = computed(() => rows.filter((row) => {
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: '查看' })));

function setColumnFilter(columnKey: string, value: string) {
  if (value) columnFilters[columnKey] = value;
  else delete columnFilters[columnKey];
}
</script>

<template>
  <AwListPage>
    <AwListToolbar
      search-placeholder="全局搜索（如订单编号、客户名称）"
      create-label="新增销售订单"
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
        <span v-if="column.key === 'deliveryState'" class="aw-status">{{ value }}</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>
