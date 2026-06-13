<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { DetailAction, DetailFieldItem } from '@/components/detail-page/types';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';

type ShippingDeliveryRow = Record<string, unknown> & {
  id: string;
  categoryKey: string;
  orderNo: string;
  shippingNo: string;
  customerName: string;
  shippingAddress: string;
  customerType: string;
  orderDate: string;
  pickTime: string;
  orderOwner: string;
  picker: string;
  dispatcher: string;
  deliveryDate: string;
};

const router = useRouter();
const route = useRoute();
const activeCategory = ref('pending-shipment');
const keyword = ref('');
const columnFilters = reactive<Record<string, string>>({});

const rows: ShippingDeliveryRow[] = [
  { id: 'fh-001', categoryKey: 'pending-shipment', orderNo: 'XS-202606-001', shippingNo: 'FH-202606-001', customerName: '华东渠道客户', shippingAddress: '上海市浦东新区金桥路88号', customerType: '渠道客户', orderDate: '2026-06-08', pickTime: '2026-06-11 10:00', orderOwner: '王仓', picker: '赵强', dispatcher: '张师傅 13800001101 沪A·D3101', deliveryDate: '2026-06-11' },
  { id: 'fh-002', categoryKey: 'pending-shipment', orderNo: 'XS-202606-006', shippingNo: 'FH-202606-002', customerName: '华北直营客户', shippingAddress: '北京市朝阳区望京东路18号', customerType: '直营客户', orderDate: '2026-06-09', pickTime: '2026-06-11 10:30', orderOwner: '李库', picker: '陈仓', dispatcher: '京东物流 JD60611002', deliveryDate: '2026-06-11' },
  { id: 'fh-003', categoryKey: 'pending-shipment', orderNo: 'XS-202606-007', shippingNo: 'FH-202606-003', customerName: '试制车间', shippingAddress: '深圳市宝安区一号园区试制线', customerType: '内部领用', orderDate: '2026-06-09', pickTime: '2026-06-11 11:00', orderOwner: '陈仓', picker: '李库', dispatcher: '自提', deliveryDate: '2026-06-11' },
  { id: 'fh-004', categoryKey: 'pending-receipt', orderNo: 'XS-202606-008', shippingNo: 'FH-202606-004', customerName: '深圳直营客户', shippingAddress: '深圳市南山区科技园科苑路66号', customerType: '直营客户', orderDate: '2026-06-07', pickTime: '2026-06-11 09:30', orderOwner: '赵强', picker: '王仓', dispatcher: '德邦快运 DB60611004', deliveryDate: '2026-06-11' },
  { id: 'fh-005', categoryKey: 'pending-receipt', orderNo: 'LL-202606-003', shippingNo: 'FH-202606-005', customerName: '装配一线', shippingAddress: '厂区A栋装配一线收料点', customerType: '内部领用', orderDate: '2026-06-08', pickTime: '2026-06-11 10:00', orderOwner: '李库', picker: '陈仓', dispatcher: '刘司机 13800001105 粤B·A3205', deliveryDate: '2026-06-11' },
  { id: 'fh-006', categoryKey: 'pending-receipt', orderNo: 'LL-202606-004', shippingNo: 'FH-202606-006', customerName: '维修工段', shippingAddress: '厂区C栋维修工段备件柜', customerType: '内部领用', orderDate: '2026-06-08', pickTime: '2026-06-11 10:20', orderOwner: '陈仓', picker: '赵强', dispatcher: '自提', deliveryDate: '2026-06-11' },
  { id: 'fh-007', categoryKey: 'change-confirm', orderNo: 'XS-202606-009', shippingNo: 'FH-202606-007', customerName: '成都项目客户', shippingAddress: '成都市高新区天府三街199号', customerType: '项目客户', orderDate: '2026-06-06', pickTime: '2026-06-10 16:20', orderOwner: '王仓', picker: '李库', dispatcher: '顺丰速运 SF60610007', deliveryDate: '2026-06-10' },
  { id: 'fh-008', categoryKey: 'change-confirm', orderNo: 'LL-202606-005', shippingNo: 'FH-202606-008', customerName: '测试车间', shippingAddress: '厂区B栋测试车间收料台', customerType: '内部领用', orderDate: '2026-06-06', pickTime: '2026-06-10 16:50', orderOwner: '李库', picker: '陈仓', dispatcher: '自提', deliveryDate: '2026-06-10' },
  { id: 'fh-009', categoryKey: 'completed', orderNo: 'XS-202606-011', shippingNo: 'FH-202606-009', customerName: '华南渠道客户', shippingAddress: '广州市黄埔区科学大道168号', customerType: '渠道客户', orderDate: '2026-06-04', pickTime: '2026-06-08 15:00', orderOwner: '陈仓', picker: '赵强', dispatcher: '顺丰速运 SF60608009', deliveryDate: '2026-06-08' },
  { id: 'fh-010', categoryKey: 'completed', orderNo: 'LL-202606-006', shippingNo: 'FH-202606-010', customerName: '测试车间', shippingAddress: '厂区B栋测试车间收料台', customerType: '内部领用', orderDate: '2026-06-05', pickTime: '2026-06-09 11:00', orderOwner: '王仓', picker: '李库', dispatcher: '自提', deliveryDate: '2026-06-09' },
  { id: 'fh-011', categoryKey: 'completed', orderNo: 'XS-202606-013', shippingNo: 'FH-202606-011', customerName: '成都项目客户', shippingAddress: '成都市高新区天府三街199号', customerType: '项目客户', orderDate: '2026-06-06', pickTime: '2026-06-10 10:30', orderOwner: '赵强', picker: '王仓', dispatcher: '京东物流 JD60610011', deliveryDate: '2026-06-10' },
];

const categoryNodes = computed<AwTreeNode[]>(() => [
  { key: 'pending-shipment', label: '待发货', count: countRows('pending-shipment'), level: 2, icon: 'line-folder', open: true },
  { key: 'pending-receipt', label: '待收货', count: countRows('pending-receipt'), level: 2, icon: 'line-folder', open: true },
  { key: 'change-confirm', label: '分拣修改确认', count: countRows('change-confirm'), level: 2, icon: 'line-folder', open: true },
  { key: 'completed', label: '配送完成', count: countRows('completed'), level: 2, icon: 'line-folder', open: true },
]);

const columns: AwTableColumn[] = [
  { key: 'orderNo', title: '订单编号', width: 150, link: true },
  { key: 'shippingNo', title: '发货单号', width: 150 },
  { key: 'customerName', title: '客户名称', width: 150 },
  { key: 'shippingAddress', title: '收货地址', width: 230 },
  { key: 'customerType', title: '客户类型', width: 120 },
  { key: 'orderDate', title: '下单日期', width: 120 },
  { key: 'pickTime', title: '分拣时间', width: 150 },
  { key: 'orderOwner', title: '业务员/下单员', width: 140 },
  { key: 'picker', title: '分拣员', width: 110 },
  { key: 'dispatcher', title: '配送员', width: 220 },
  { key: 'deliveryDate', title: '配送日期', width: 120 },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const bulkActions: AwBulkAction[] = [
  { key: 'dispatch', label: '批量发货' },
  { key: 'confirm', label: '批量确认' },
];

const detailId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''));
const currentDetail = computed(() => rows.find((row) => row.id === detailId.value) || null);

const detailActions = computed<DetailAction[]>(() => {
  if (currentDetail.value?.categoryKey === 'pending-receipt') {
    return [
      { key: 'logistics-change', label: '物流变更' },
      { key: 'upload-receipt', label: '上传收货凭据', primary: true },
    ];
  }
  return [
    { key: 'logistics-change', label: '物流变更' },
    { key: 'load-truck', label: '装车' },
    { key: 'order-detail', label: '订单详情' },
    { key: 'print-order', label: '打印订单' },
    { key: 'invoice-company', label: '设置开票企业', primary: true },
  ];
});

const filteredRows = computed(() => rows.filter((row) => {
  const categoryMatched = row.categoryKey === activeCategory.value;
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return categoryMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: '查看' })));

const detailFields = computed<DetailFieldItem[]>(() => {
  const row = currentDetail.value;
  if (!row) return [];
  return [
    { label: '订单编号', value: row.orderNo },
    { label: '发货单号', value: row.shippingNo },
    { label: '客户名称', value: row.customerName },
    { label: '收货地址', value: row.shippingAddress },
    { label: '客户类型', value: row.customerType },
    { label: '下单日期', value: row.orderDate },
    { label: '分拣时间', value: row.pickTime },
    { label: '业务员/下单员', value: row.orderOwner },
    { label: '分拣员', value: row.picker },
    { label: '配送员', value: row.dispatcher },
    { label: '配送日期', value: row.deliveryDate },
    { label: '配送状态', value: categoryLabel(row.categoryKey) },
  ];
});

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

function openDetail(id: string) {
  router.push({ path: route.path, query: { ...route.query, id } });
}

function goList() {
  const nextQuery = { ...route.query };
  delete nextQuery.id;
  router.push({ path: route.path, query: nextQuery });
}

function categoryLabel(categoryKey: string) {
  return categoryNodes.value.find((node) => node.key === categoryKey)?.label || '-';
}
</script>

<template>
  <AwDetailPage v-if="currentDetail">
    <template #toolbar>
      <AwDetailToolbar back-text="返回发货配送" :actions="detailActions" @back="goList" />
    </template>
    <template #header>
      <AwDetailHeader
        title="发货配送详情"
        :code="currentDetail.shippingNo"
        :status-text="categoryLabel(currentDetail.categoryKey)"
        status-tone="blue"
        :metas="[
          { label: '订单编号', value: currentDetail.orderNo },
          { label: '客户名称', value: currentDetail.customerName },
          { label: '分拣员', value: currentDetail.picker },
        ]"
      />
    </template>

    <section class="aw-form-card">
      <AwDetailInfoGrid :items="detailFields" />
    </section>
  </AwDetailPage>

  <AwListPage v-else>
    <template #tree>
      <AwResourceTree
        v-model="activeCategory"
        title="配送分类"
        :total="rows.length"
        :nodes="categoryNodes"
        @select="selectCategory"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如订单编号、发货单号、客户名称）"
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
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'orderNo'" class="aw-link" @click="openDetail(String(record.id))">
          {{ value ?? '-' }}
        </span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(String(record.id))">
          查看
        </span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>
