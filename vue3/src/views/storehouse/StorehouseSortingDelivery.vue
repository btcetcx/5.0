<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
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

const activeCategory = ref('pending');
const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});

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

const columns: AwTableColumn[] = [
  { key: 'pickNo', title: '分拣单号', width: 150, link: true },
  { key: 'sourceNo', title: '来源单号', width: 150 },
  { key: 'businessType', title: '业务类型', width: 120, filterOptions: ['销售出库', '生产领料'] },
  { key: 'warehouse', title: '仓库', width: 120, filterOptions: ['产成品库', '原辅料库', '内耗品库', '残次品库'] },
  { key: 'skuCount', title: 'SKU数', width: 90 },
  { key: 'quantity', title: '分拣数量', width: 110 },
  { key: 'picker', title: '分拣人', width: 100 },
  { key: 'planTime', title: '计划时间', width: 150 },
  { key: 'state', title: '状态', width: 100, filterOptions: ['待分拣', '分拣中', '已分拣', '已出库'] },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const bulkActions: AwBulkAction[] = [
  { key: 'assign', label: '批量分配' },
  { key: 'print', label: '批量打印' },
];

const filteredRows = computed(() => rows.filter((row) => {
  const categoryMatched = row.categoryKey === activeCategory.value;
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return categoryMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: row.categoryKey === 'history' ? '查看' : '处理' })));

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
        title="分拣分类"
        source-text="来源：仓库 - 分拣配送"
        :total="rows.length"
        :nodes="categoryNodes"
        @select="selectCategory"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如分拣单号、来源单号）"
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
      <template #cell="{ column, value }">
        <span v-if="column.key === 'state'" class="aw-status">{{ value }}</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>
