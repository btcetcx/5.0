<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import type { DetailFieldItem, DetailTabItem } from '@/components/detail-page/types';
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

type PickRecord = {
  id: string;
  orderId: string;
  pickNo: string;
  pickTime: string;
  picker: string;
  warehouse: string;
  skuCount: number;
  pickQty: number;
  state: string;
};

type ShippingRecord = {
  id: string;
  orderId: string;
  shippingNo: string;
  shippingTime: string;
  carrier: string;
  trackingNo: string;
  receiver: string;
  shippingQty: number;
  state: string;
};

const router = useRouter();
const route = useRoute();
const keyword = ref('');
const activeTab = ref('basic');
const columnFilters = reactive<Record<string, string>>({});

const columns: AwTableColumn[] = [
  { key: 'orderNo', title: '订单编号', width: 160, link: true },
  { key: 'customerName', title: '客户名称', width: 180 },
  { key: 'warehouse', title: '仓库', width: 120 },
  { key: 'skuCount', title: '商品数', width: 90 },
  { key: 'orderQty', title: '订单数量', width: 110 },
  { key: 'pickedQty', title: '已分拣数', width: 110 },
  { key: 'deliveryState', title: '发货状态', width: 120 },
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

const pickRecords: PickRecord[] = [
  { id: 'pick-001', orderId: 'so-001', pickNo: 'FJ-202606-008', pickTime: '2026-06-08 10:00', picker: '王仓', warehouse: '产成品库', skuCount: 4, pickQty: 36, state: '已分拣' },
  { id: 'pick-002', orderId: 'so-002', pickNo: 'FJ-202606-005', pickTime: '2026-06-11 09:30', picker: '王仓', warehouse: '产成品库', skuCount: 5, pickQty: 22, state: '已分拣' },
  { id: 'pick-003', orderId: 'so-005', pickNo: 'FJ-202606-001', pickTime: '2026-06-11 10:00', picker: '赵强', warehouse: '产成品库', skuCount: 6, pickQty: 42, state: '已分拣' },
  { id: 'pick-004', orderId: 'so-006', pickNo: 'FJ-202606-010', pickTime: '2026-06-10 16:20', picker: '李库', warehouse: '产成品库', skuCount: 3, pickQty: 27, state: '已分拣' },
  { id: 'pick-005', orderId: 'so-008', pickNo: 'FJ-202606-002', pickTime: '2026-06-11 10:30', picker: '陈仓', warehouse: '产成品库', skuCount: 4, pickQty: 31, state: '已分拣' },
  { id: 'pick-006', orderId: 'so-010', pickNo: 'FJ-202606-014', pickTime: '2026-06-14 09:20', picker: '王仓', warehouse: '产成品库', skuCount: 3, pickQty: 12, state: '分拣中' },
];

const shippingRecords: ShippingRecord[] = [
  { id: 'ship-001', orderId: 'so-001', shippingNo: 'FH-202606-009', shippingTime: '2026-06-08 15:00', carrier: '顺丰速运', trackingNo: 'SF60608001', receiver: '华南渠道客户', shippingQty: 36, state: '配送完成' },
  { id: 'ship-002', orderId: 'so-002', shippingNo: 'FH-202606-004', shippingTime: '2026-06-11 09:30', carrier: '德邦快运', trackingNo: 'DB60611004', receiver: '深圳直营客户', shippingQty: 22, state: '待收货' },
  { id: 'ship-003', orderId: 'so-005', shippingNo: 'FH-202606-001', shippingTime: '2026-06-11 14:00', carrier: '顺丰速运', trackingNo: 'SF60611001', receiver: '华东渠道客户', shippingQty: 42, state: '待发货' },
  { id: 'ship-004', orderId: 'so-006', shippingNo: 'FH-202606-011', shippingTime: '2026-06-10 10:30', carrier: '京东物流', trackingNo: 'JD60610011', receiver: '成都项目客户', shippingQty: 27, state: '配送完成' },
  { id: 'ship-005', orderId: 'so-008', shippingNo: 'FH-202606-002', shippingTime: '2026-06-11 15:00', carrier: '京东物流', trackingNo: 'JD60611002', receiver: '华北直营客户', shippingQty: 31, state: '待发货' },
];

const tabs: DetailTabItem[] = [
  { key: 'basic', label: '基础情况' },
  { key: 'pick', label: '分拣记录' },
  { key: 'shipping', label: '发货记录' },
];

const bulkActions: AwBulkAction[] = [
  { key: 'pick', label: '批量分拣' },
  { key: 'ship', label: '批量发货' },
];

const detailId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''));
const currentDetail = computed(() => rows.find((row) => row.id === detailId.value) || null);
const currentPickRecords = computed(() => pickRecords.filter((row) => row.orderId === currentDetail.value?.id));
const currentShippingRecords = computed(() => shippingRecords.filter((row) => row.orderId === currentDetail.value?.id));

const filteredRows = computed(() => rows.filter((row) => {
  const keywordMatched = !keyword.value.trim() || JSON.stringify(row).includes(keyword.value.trim());
  const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
  return keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: '查看' })));

const detailFields = computed<DetailFieldItem[]>(() => {
  const row = currentDetail.value;
  if (!row) return [];
  return [
    { label: '订单编号', value: row.orderNo },
    { label: '客户名称', value: row.customerName },
    { label: '默认仓库', value: row.warehouse },
    { label: '商品数', value: String(row.skuCount) },
    { label: '订单数量', value: String(row.orderQty) },
    { label: '已分拣数', value: String(row.pickedQty) },
    { label: '待分拣数', value: String(Math.max(row.orderQty - row.pickedQty, 0)) },
    { label: '发货状态', value: row.deliveryState },
    { label: '交付日期', value: row.deliveryDate },
    { label: '负责人', value: row.owner },
  ];
});

function setColumnFilter(columnKey: string, value: string) {
  if (value) columnFilters[columnKey] = value;
  else delete columnFilters[columnKey];
}

function openDetail(id: string) {
  activeTab.value = 'basic';
  router.push({ path: route.path, query: { ...route.query, id } });
}

function goList() {
  const nextQuery = { ...route.query };
  delete nextQuery.id;
  router.push({ path: route.path, query: nextQuery });
}
</script>

<template>
  <AwDetailPage v-if="currentDetail">
    <template #toolbar>
      <AwDetailToolbar back-text="返回销售订单" @back="goList" />
    </template>
    <template #header>
      <AwDetailHeader
        title="销售订单详情"
        :code="currentDetail.orderNo"
        :status-text="currentDetail.deliveryState"
        status-tone="blue"
        :metas="[
          { label: '客户名称', value: currentDetail.customerName },
          { label: '订单数量', value: String(currentDetail.orderQty) },
          { label: '负责人', value: currentDetail.owner },
        ]"
      />
    </template>

    <AwDetailTabs v-model="activeTab" :tabs="tabs" />
    <section class="aw-form-card">
      <AwDetailInfoGrid v-if="activeTab === 'basic'" :items="detailFields" />
      <div v-else-if="activeTab === 'pick'" class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl aw-doc-tbl-fit">
            <thead>
              <tr>
                <th>分拣单号</th>
                <th>分拣时间</th>
                <th>分拣员</th>
                <th>仓库</th>
                <th>SKU数</th>
                <th>分拣数量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in currentPickRecords" :key="item.id">
                <td class="aw-link">{{ item.pickNo }}</td>
                <td>{{ item.pickTime }}</td>
                <td>{{ item.picker }}</td>
                <td>{{ item.warehouse }}</td>
                <td>{{ item.skuCount }}</td>
                <td>{{ item.pickQty }}</td>
                <td><span class="aw-status">{{ item.state }}</span></td>
              </tr>
              <tr v-if="!currentPickRecords.length">
                <td colspan="7">暂无分拣记录</td>
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
                <th>发货单号</th>
                <th>发货时间</th>
                <th>配送方式</th>
                <th>物流单号</th>
                <th>收货对象</th>
                <th>发货数量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in currentShippingRecords" :key="item.id">
                <td class="aw-link">{{ item.shippingNo }}</td>
                <td>{{ item.shippingTime }}</td>
                <td>{{ item.carrier }}</td>
                <td>{{ item.trackingNo }}</td>
                <td>{{ item.receiver }}</td>
                <td>{{ item.shippingQty }}</td>
                <td><span class="aw-status">{{ item.state }}</span></td>
              </tr>
              <tr v-if="!currentShippingRecords.length">
                <td colspan="7">暂无发货记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </AwDetailPage>

  <AwListPage v-else>
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
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'orderNo'" class="aw-link" @click="openDetail(String(record.id))">
          {{ value ?? '-' }}
        </span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(String(record.id))">
          查看
        </span>
        <span v-else-if="column.key === 'deliveryState'" class="aw-status">{{ value }}</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>
