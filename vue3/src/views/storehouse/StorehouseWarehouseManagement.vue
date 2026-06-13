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
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import type { DetailFieldItem, DetailTabItem } from '@/components/detail-page/types';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';

type StorehouseProductRow = Record<string, unknown> & {
  id: string;
  warehouseKey: string;
  warningGroup: string;
  productName: string;
  productCode: string;
  category: string;
  model: string;
  unit: string;
  stockQty: number;
  warningValue: number;
  availableQty: number;
  location: string;
  status: string;
};

type StorehouseDetailTableRow = Record<string, string | number>;

type StorehouseWarehouseRow = Record<string, unknown> & {
  id: string;
  code: string;
  name: string;
  type: string;
  manager: string;
  phone: string;
  address: string;
  capacity: string;
  temperature: string;
  state: string;
};

const route = useRoute();
const router = useRouter();
const isMultiWarehouse = computed(() => route.query.setting === 'multi-warehouse');
const isWarehouseRules = computed(() => route.query.setting === 'warehouse-rules');
const isInventoryWarning = computed(() => route.path === '/storehouse/inventory-warning');
const isWarehouseListMode = computed(() => isMultiWarehouse.value || isWarehouseRules.value);
const detailId = computed(() => typeof route.query.id === 'string' ? route.query.id : '');

const activeWarehouse = ref('all');
const activeWarningCategory = ref('self-product');
const activeDetailTab = ref('产品信息');
const productKeyword = ref('');
const warehouseKeyword = ref('');
const showRuleModal = ref(false);
const activeRuleWarehouse = ref<StorehouseWarehouseRow | null>(null);
const finishedGoodsRules = reactive({
  storageManagement: 'enabled',
  productionDateManagement: 'enabled',
  allowOverStockOrder: 'disabled',
});
const productColumnFilters = reactive<Record<string, string>>({});
const warehouseColumnFilters = reactive<Record<string, string>>({});

const baseProductColumns: AwTableColumn[] = [
  { key: 'productCode', title: '商品编号', width: 150 },
  { key: 'productName', title: '商品名称', width: 180, link: true },
  { key: 'category', title: '商品分类', width: 120 },
  { key: 'model', title: '规格型号', width: 140 },
  { key: 'unit', title: '单位', width: 80 },
  { key: 'stockQty', title: '库存数量', width: 110 },
  { key: 'availableQty', title: '可用数量', width: 110 },
  { key: 'location', title: '库位', width: 130 },
  { key: 'status', title: '库存状态', width: 110 },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const productColumns = computed<AwTableColumn[]>(() => {
  if (!isInventoryWarning.value) return baseProductColumns;
  return [
    ...baseProductColumns.slice(0, 6),
    { key: 'warningValue', title: '库存预警值', width: 120 },
    ...baseProductColumns.slice(6),
  ];
});

const warehouseColumns: AwTableColumn[] = [
  { key: 'code', title: '仓库编码', width: 130 },
  { key: 'name', title: '仓库名称', width: 150, link: true },
  { key: 'type', title: '仓库类型', width: 120 },
  { key: 'manager', title: '仓库负责人', width: 120 },
  { key: 'phone', title: '联系方式', width: 140 },
  { key: 'address', title: '仓库地址', width: 260 },
  { key: 'capacity', title: '容量', width: 100 },
  { key: 'temperature', title: '温区', width: 100 },
  { key: 'state', title: '仓库状态', width: 100 },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const productRows: StorehouseProductRow[] = [
  { id: 'p001', warehouseKey: 'wh-fg', warningGroup: 'self-product', productCode: 'SP-CP-001', productName: '智能温控终端', category: '成品', model: 'AW-T100', unit: '台', stockQty: 120, warningValue: 50, availableQty: 96, location: 'CP-A01', status: '正常' },
  { id: 'p002', warehouseKey: 'wh-fg', warningGroup: 'self-product', productCode: 'SP-CP-002', productName: '工业采集网关', category: '成品', model: 'AW-G210', unit: '台', stockQty: 48, warningValue: 40, availableQty: 40, location: 'CP-A02', status: '正常' },
  { id: 'p003', warehouseKey: 'wh-fg', warningGroup: 'self-product', productCode: 'SP-CP-003', productName: '边缘控制器', category: '成品', model: 'AW-E500', unit: '台', stockQty: 18, warningValue: 30, availableQty: 12, location: 'CP-B01', status: '低库存' },
  { id: 'p004', warehouseKey: 'wh-fg', warningGroup: 'self-product', productCode: 'SP-CP-004', productName: '数据看板终端', category: '成品', model: 'AW-D310', unit: '台', stockQty: 32, warningValue: 25, availableQty: 28, location: 'CP-B02', status: '正常' },
  { id: 'p005', warehouseKey: 'wh-rm', warningGroup: 'raw-material', productCode: 'SP-YL-001', productName: '铝合金型材', category: '原材料', model: 'AL-6061', unit: 'kg', stockQty: 860, warningValue: 300, availableQty: 720, location: 'YL-A01', status: '正常' },
  { id: 'p006', warehouseKey: 'wh-rm', warningGroup: 'raw-material', productCode: 'SP-YL-002', productName: '主控 PCB 板', category: '原材料', model: 'PCB-V2.1', unit: '片', stockQty: 300, warningValue: 120, availableQty: 260, location: 'YL-A02', status: '正常' },
  { id: 'p007', warehouseKey: 'wh-consume', warningGroup: 'raw-material', productCode: 'SP-YL-003', productName: '包装纸箱', category: '原材料', model: 'PK-01', unit: '个', stockQty: 90, warningValue: 100, availableQty: 80, location: 'NH-A01', status: '低库存' },
  { id: 'p008', warehouseKey: 'wh-rm', warningGroup: 'agent-product', productCode: 'SP-BC-001', productName: '传感器半成品', category: '半成品', model: 'SEN-HM', unit: '个', stockQty: 210, warningValue: 80, availableQty: 180, location: 'YL-B01', status: '正常' },
  { id: 'p009', warehouseKey: 'wh-defect', warningGroup: 'agent-product', productCode: 'SP-BC-002', productName: '控制板组件', category: '半成品', model: 'CTRL-A', unit: '套', stockQty: 76, warningValue: 30, availableQty: 52, location: 'DF-A01', status: '冻结' },
  { id: 'p010', warehouseKey: 'wh-consume', warningGroup: 'agent-product', productCode: 'SP-BC-003', productName: '外壳组件', category: '半成品', model: 'CASE-01', unit: '套', stockQty: 160, warningValue: 90, availableQty: 140, location: 'NH-A02', status: '正常' },
  { id: 'p011', warehouseKey: 'wh-rm', warningGroup: 'expiring', productCode: 'SP-DJ-001', productName: '来料电源模块', category: '待检品', model: 'PWR-24V', unit: '个', stockQty: 64, warningValue: 60, availableQty: 0, location: 'YL-QC01', status: '待检' },
  { id: 'p012', warehouseKey: 'wh-rm', warningGroup: 'expiring', productCode: 'SP-DJ-002', productName: '待检通讯模组', category: '待检品', model: 'COM-4G', unit: '个', stockQty: 36, warningValue: 50, availableQty: 0, location: 'YL-QC02', status: '待检' },
];

const warehouseRows: StorehouseWarehouseRow[] = [
  { id: 'wh-fg', code: 'WH-FG', name: '产成品库', type: '产成品库', manager: '王仓', phone: '13800000001', address: '广东省深圳市宝安区一号园区', capacity: '1200m³', temperature: '常温', state: '启用' },
  { id: 'wh-rm', code: 'WH-RM', name: '原辅料库', type: '原辅料库', manager: '李库', phone: '13800000002', address: '广东省东莞市松山湖二号园区', capacity: '980m³', temperature: '常温 / 冷藏', state: '启用' },
  { id: 'wh-consume', code: 'WH-CM', name: '内耗品库', type: '内耗品库', manager: '陈仓', phone: '13800000003', address: '广东省广州市黄埔区仓储园', capacity: '360m³', temperature: '常温', state: '启用' },
  { id: 'wh-defect', code: 'WH-DF', name: '残次品库', type: '残次品库', manager: '赵强', phone: '13800000004', address: '广东省深圳市宝安区质检暂存区', capacity: '220m³', temperature: '常温', state: '维护' },
];

const warehouseTreeNodes = computed<AwTreeNode[]>(() => [
  { key: 'all', label: '全部仓库商品', count: productRows.length, level: 2, icon: 'line-folder', open: true },
  ...warehouseRows.map((warehouse) => ({
    key: warehouse.id,
    label: warehouse.name,
    count: productRows.filter((row) => row.warehouseKey === warehouse.id).length,
    level: 2 as const,
    icon: 'line-folder',
  })),
]);

const warningTreeNodes = computed<AwTreeNode[]>(() => [
  { key: 'self-product', label: '自产产品库存', count: productRows.filter((row) => row.warningGroup === 'self-product').length, level: 2, icon: 'line-folder', open: true },
  { key: 'agent-product', label: '代理产品库存', count: productRows.filter((row) => row.warningGroup === 'agent-product').length, level: 2, icon: 'line-folder' },
  { key: 'raw-material', label: '原辅料库存', count: productRows.filter((row) => row.warningGroup === 'raw-material').length, level: 2, icon: 'line-folder' },
  { key: 'expiring', label: '临期列表', count: productRows.filter((row) => row.warningGroup === 'expiring').length, level: 2, icon: 'line-folder' },
]);

const productTreeTitle = computed(() => (isInventoryWarning.value ? '预警分类' : '仓库列表'));
const productTreeModel = computed(() => (isInventoryWarning.value ? activeWarningCategory.value : activeWarehouse.value));
const productTreeNodes = computed(() => (isInventoryWarning.value ? warningTreeNodes.value : warehouseTreeNodes.value));
const warningBulkActionMap: Record<string, AwBulkAction[]> = {
  'agent-product': [
    { key: 'batch-warning', label: '批量预警' },
    { key: 'batch-purchase', label: '批量采购' },
  ],
  'self-product': [
    { key: 'batch-warning', label: '批量预警' },
    { key: 'batch-production', label: '批量生产' },
  ],
  'raw-material': [
    { key: 'batch-purchase', label: '批量采购' },
    { key: 'batch-warning', label: '批量预警' },
  ],
  expiring: [
    { key: 'batch-transfer', label: '批量转库' },
    { key: 'batch-handle', label: '批量处理' },
  ],
};
const productBulkActions = computed<AwBulkAction[]>(() => {
  if (!isInventoryWarning.value) {
    return [
      { key: 'transfer', label: '批量转移' },
      { key: 'assign', label: '批量指定' },
    ];
  }
  return warningBulkActionMap[activeWarningCategory.value] || warningBulkActionMap['self-product'];
});

function getWarningActions(group: string) {
  return (warningBulkActionMap[group] || warningBulkActionMap['self-product'])
    .map((action) => action.label.replace(/^批量/, ''));
}

const filteredProductRows = computed(() => productRows.filter((row) => {
  const treeMatched = isInventoryWarning.value
    ? row.warningGroup === activeWarningCategory.value
    : activeWarehouse.value === 'all' || row.warehouseKey === activeWarehouse.value;
  const keywordMatched = !productKeyword.value.trim() || JSON.stringify(row).includes(productKeyword.value.trim());
  const filterMatched = Object.entries(productColumnFilters).every(([key, value]) => !value || row[key] === value);
  return treeMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: isInventoryWarning.value ? getWarningActions(row.warningGroup) : '查看' })));

const filteredWarehouseRows = computed(() => warehouseRows.filter((row) => {
  const keywordMatched = !warehouseKeyword.value.trim() || JSON.stringify(row).includes(warehouseKeyword.value.trim());
  const filterMatched = Object.entries(warehouseColumnFilters).every(([key, value]) => !value || row[key] === value);
  return keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: isWarehouseRules.value ? '规则设置' : '查看' })));

const selectedProductDetail = computed(() => {
  if (!detailId.value || isWarehouseListMode.value || isInventoryWarning.value) return null;
  return productRows.find((row) => row.id === detailId.value) || null;
});

const selectedProductWarehouse = computed(() => {
  const detail = selectedProductDetail.value;
  if (!detail) return null;
  return warehouseRows.find((row) => row.id === detail.warehouseKey) || null;
});

const productDetailTabs: DetailTabItem[] = ['产品信息', '库存明细', '库存流水', '占用冻结', '出库记录', '入库记录']
  .map((label) => ({ key: label, label }));

const productDetailFields = computed<DetailFieldItem[]>(() => {
  const detail = selectedProductDetail.value;
  if (!detail) return [];
  const warehouse = selectedProductWarehouse.value;
  const stock = buildStockNumbers(detail);
  return [
    field('产品名称', detail.productName),
    field('产品编号', detail.productCode),
    field('产品型号', detail.model),
    field('产品分类', detail.category),
    field('产品单位', detail.unit),
    field('默认仓库', warehouse?.name),
    field('库位', detail.location),
    field('库存数量', detail.stockQty),
    field('冻结数量', stock.frozen),
    field('占用数量', stock.occupied),
    field('可用数量', detail.availableQty),
    field('在途数量', stock.inTransit),
  ];
});

const productDetailMetas = computed(() => {
  const detail = selectedProductDetail.value;
  const warehouse = selectedProductWarehouse.value;
  return [
    { label: '仓库', value: warehouse?.name || '-' },
    { label: '库位', value: detail?.location || '-' },
    { label: '负责人', value: warehouse?.manager || '-' },
  ];
});

const activeDetailHeaders = computed(() => detailHeaders(activeDetailTab.value));
const activeDetailRows = computed(() => {
  const detail = selectedProductDetail.value;
  if (!detail) return [];
  if (activeDetailTab.value === '库存明细') return inventoryDetailRows(detail);
  if (activeDetailTab.value === '库存流水') return stockFlowRows(detail);
  if (activeDetailTab.value === '占用冻结') return freezeRows(detail);
  if (activeDetailTab.value === '出库记录') return stockFlowRows(detail).filter((row) => row['方向'] === '出库');
  if (activeDetailTab.value === '入库记录') return stockFlowRows(detail).filter((row) => row['方向'] === '入库');
  return [];
});

function setProductColumnFilter(columnKey: string, value: string) {
  if (value) productColumnFilters[columnKey] = value;
  else delete productColumnFilters[columnKey];
}

function setWarehouseColumnFilter(columnKey: string, value: string) {
  if (value) warehouseColumnFilters[columnKey] = value;
  else delete warehouseColumnFilters[columnKey];
}

function selectProductTree(key: string) {
  if (isInventoryWarning.value) activeWarningCategory.value = key;
  else activeWarehouse.value = key;
}

function handleProductTreeEvent(event: Event) {
  const target = event.target as HTMLElement | null;
  const key = target?.closest('[data-key]')?.getAttribute('data-key');
  if (key) selectProductTree(key);
}

function openRuleModal(record: Record<string, unknown>) {
  activeRuleWarehouse.value = warehouseRows.find((row) => row.id === record.id) || null;
  showRuleModal.value = true;
}

function openProductDetail(record: Record<string, unknown>) {
  router.push({ path: route.path, query: { ...route.query, id: String(record.id) } });
  activeDetailTab.value = '产品信息';
}

function backToList() {
  const nextQuery = { ...route.query };
  delete nextQuery.id;
  router.push({ path: route.path, query: nextQuery });
}

function field(label: string, value: unknown): DetailFieldItem {
  return { label, value: String(value ?? '-') };
}

function statusTone(status = '') {
  if (['正常', '启用'].includes(status)) return 'green';
  if (['低库存', '待检'].includes(status)) return 'yellow';
  if (['冻结', '维护'].includes(status)) return 'red';
  return 'blue';
}

function buildStockNumbers(row: StorehouseProductRow) {
  const frozen = row.status === '冻结' ? Math.max(1, Math.round(row.stockQty * 0.16)) : Math.max(0, Math.round((row.stockQty - row.availableQty) * 0.35));
  const occupied = Math.max(0, row.stockQty - row.availableQty - frozen);
  const inTransit = row.status === '待检' ? row.stockQty : Math.max(0, Math.round(row.stockQty * 0.08));
  const batchPrefix = row.category === '成品' ? 'CP' : row.category === '半成品' ? 'BC' : 'YL';
  return {
    frozen,
    occupied,
    inTransit,
    batch: `${batchPrefix}20260601`,
    costLayer: `LAYER-${row.productCode.slice(-3)}-01`,
    sourceDoc: row.category === '成品' ? 'IN-20260601001' : 'PO-20260601001',
    sourceLine: row.category === '成品' ? 'IN-20260601001-01' : 'PO-20260601001-01',
    unitCost: row.category === '成品' ? '3280.00' : row.category === '半成品' ? '268.00' : '18.50',
  };
}

function detailHeaders(tab: string) {
  if (tab === '库存明细') return ['仓库编码', '仓库名称', '仓库类型', '库位', '批次', '库存数量', '冻结数量', '占用数量', '可用数量', '在途数量', '质量状态', '负责人'];
  if (tab === '库存流水') return ['来源单据', '来源明细', '业务类型', '方向', '批次', '库位', '质量状态', '成本层', '单位成本', '变动前', '变动数', '变动后', '状态'];
  if (tab === '占用冻结') return ['仓库', '区域', '库位', '库位编号', '批次', '库存数量', '冻结数量', '占用数量', '可用数量', '在途数量', '状态'];
  if (tab === '出库记录' || tab === '入库记录') return ['来源单据', '来源明细', '业务类型', '批次', '库位', '变动数', '变动后', '状态'];
  return [];
}

function inventoryDetailRows(row: StorehouseProductRow): StorehouseDetailTableRow[] {
  const currentWarehouse = warehouseRows.find((item) => item.id === row.warehouseKey) || warehouseRows[0];
  const stock = buildStockNumbers(row);
  const extraWarehouses = warehouseRows
    .filter((warehouse) => warehouse.id !== currentWarehouse.id)
    .slice(0, row.category === '成品' ? 2 : 1);
  const warehouseStockRows = [
    { warehouse: currentWarehouse, ratio: 0.7, location: row.location, status: row.status },
    ...extraWarehouses.map((warehouse, index) => ({
      warehouse,
      ratio: index === 0 ? 0.2 : 0.1,
      location: `${warehouse.code.replace('WH-', '')}-${index + 1}01`,
      status: row.status === '冻结' ? '冻结' : index === 0 ? '正常' : '待检',
    })),
  ];

  return warehouseStockRows.map((item, index) => {
    const stockQty = index === 0
      ? row.stockQty
      : Math.max(1, Math.round(row.stockQty * item.ratio));
    const frozen = item.status === '冻结'
      ? Math.max(1, Math.round(stockQty * 0.18))
      : Math.max(0, Math.round(stockQty * 0.06));
    const occupied = Math.max(0, Math.round(stockQty * (index === 0 ? 0.12 : 0.08)));
    const inTransit = item.status === '待检' ? Math.max(1, Math.round(stockQty * 0.2)) : Math.max(0, Math.round(stockQty * 0.04));
    const available = Math.max(0, stockQty - frozen - occupied);
    return {
      id: `inventory-${item.warehouse.id}`,
      仓库编码: item.warehouse.code,
      仓库名称: item.warehouse.name,
      仓库类型: item.warehouse.type,
      库位: item.location,
      批次: `${stock.batch}-${index + 1}`,
      库存数量: stockQty,
      冻结数量: frozen,
      占用数量: occupied,
      可用数量: available,
      在途数量: inTransit,
      质量状态: item.status,
      负责人: item.warehouse.manager,
    };
  });
}

function stockFlowRows(row: StorehouseProductRow): StorehouseDetailTableRow[] {
  const stock = buildStockNumbers(row);
  const outboundQty = Math.max(1, Math.min(row.availableQty, Math.round(row.stockQty * 0.12)));
  return [
    { id: 'flow-1', 来源单据: stock.sourceDoc, 来源明细: stock.sourceLine, 业务类型: row.category === '成品' ? '生产入库' : '采购入库', 方向: '入库', 批次: stock.batch, 库位: row.location, 质量状态: row.status, 成本层: stock.costLayer, 单位成本: stock.unitCost, 变动前: 0, 变动数: row.stockQty, 变动后: row.stockQty, 状态: '已过账' },
    { id: 'flow-2', 来源单据: `SO-20260603-${row.id.slice(-3)}`, 来源明细: `SO-LINE-${row.id.slice(-3)}`, 业务类型: '销售出库', 方向: '出库', 批次: stock.batch, 库位: row.location, 质量状态: row.status, 成本层: stock.costLayer, 单位成本: stock.unitCost, 变动前: row.stockQty, 变动数: -outboundQty, 变动后: row.stockQty - outboundQty, 状态: row.status === '待检' ? '待放行' : '已过账' },
  ];
}

function freezeRows(row: StorehouseProductRow): StorehouseDetailTableRow[] {
  const warehouse = warehouseRows.find((item) => item.id === row.warehouseKey);
  const stock = buildStockNumbers(row);
  return [
    {
      id: 'freeze-1',
      仓库: warehouse?.name || '-',
      区域: `${row.location.slice(0, 2)}区`,
      库位: row.location,
      库位编号: `KW-${row.location.replace(/[^A-Z0-9]/g, '')}`,
      批次: stock.batch,
      库存数量: row.stockQty,
      冻结数量: stock.frozen,
      占用数量: stock.occupied,
      可用数量: row.availableQty,
      在途数量: stock.inTransit,
      状态: row.status,
    },
  ];
}
</script>

<template>
  <AwDetailPage v-if="selectedProductDetail">
    <template #toolbar>
      <AwDetailToolbar
        :actions="[
          { key: 'inbound', label: '入库' },
          { key: 'outbound', label: '出库' },
          { key: 'transfer', label: '转库' },
          { key: 'inventory-count', label: '盘库' },
          { key: 'freeze', label: '冻结' },
        ]"
        back-text="返回列表"
        @back="backToList"
      />
    </template>
    <template #header>
      <AwDetailHeader
        :title="selectedProductDetail.productName"
        :code="selectedProductDetail.productCode"
        :status-text="selectedProductDetail.status"
        :status-tone="statusTone(selectedProductDetail.status)"
        :metas="productDetailMetas"
      />
    </template>

    <section class="aw-form-card">
      <AwDetailTabs v-model="activeDetailTab" :tabs="productDetailTabs">
        <div v-if="activeDetailTab === '产品信息'" class="storehouse-detail-panel">
          <AwDetailInfoGrid :items="productDetailFields" />
        </div>
        <div v-else class="storehouse-detail-table-wrap">
          <table class="aw-table storehouse-detail-table">
            <thead>
              <tr>
                <th>序号</th>
                <th v-for="header in activeDetailHeaders" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in activeDetailRows" :key="String(row.id || index)">
                <td>{{ index + 1 }}</td>
                <td v-for="header in activeDetailHeaders" :key="header">{{ row[header] ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AwDetailTabs>
    </section>
  </AwDetailPage>

  <AwListPage v-if="isWarehouseListMode">
    <AwListToolbar
      search-placeholder="全局搜索（如仓库名称、仓库编码、负责人）"
      :create-label="isWarehouseRules ? '新增规则' : '新增仓库'"
      @search="warehouseKeyword = $event"
    />
    <AwDataTable
      :columns="warehouseColumns"
      :rows="filteredWarehouseRows"
      :total="filteredWarehouseRows.length"
      :filter-values="warehouseColumnFilters"
      fit-width
      @column-filter="setWarehouseColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <button
          v-if="column.key === 'action' && isWarehouseRules"
          class="aw-link-btn"
          type="button"
          @click="openRuleModal(record)"
        >
          规则设置
        </button>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>

    <AwSettingModal
      :open="showRuleModal"
      :title="`${activeRuleWarehouse?.name || '仓库'}规则设置`"
      width="760px"
      @cancel="showRuleModal = false"
      @confirm="showRuleModal = false"
    >
      <div class="storehouse-rule-modal">
        <div class="storehouse-rule-summary">
          <span>适用仓库</span>
          <strong>{{ activeRuleWarehouse?.name || '-' }}</strong>
          <span>仓库类型</span>
          <strong>{{ activeRuleWarehouse?.type || '-' }}</strong>
        </div>
        <div class="storehouse-rule-section">
          <h4>产成规则</h4>
          <div class="storehouse-rule-grid">
            <div class="storehouse-rule-item">
              <span>是否启用仓储管理</span>
              <div class="storehouse-radio-group">
                <label>
                  <input v-model="finishedGoodsRules.storageManagement" type="radio" value="enabled" />
                  <span>启用</span>
                </label>
                <label>
                  <input v-model="finishedGoodsRules.storageManagement" type="radio" value="disabled" />
                  <span>不启用</span>
                </label>
              </div>
            </div>
            <div class="storehouse-rule-item">
              <span>是否管理产品生成日期</span>
              <div class="storehouse-radio-group">
                <label>
                  <input v-model="finishedGoodsRules.productionDateManagement" type="radio" value="enabled" />
                  <span>启用</span>
                </label>
                <label>
                  <input v-model="finishedGoodsRules.productionDateManagement" type="radio" value="disabled" />
                  <span>不启用</span>
                </label>
              </div>
            </div>
            <div class="storehouse-rule-item">
              <span>是否允许客户下单数量比库存显示数量多</span>
              <div class="storehouse-radio-group">
                <label>
                  <input v-model="finishedGoodsRules.allowOverStockOrder" type="radio" value="enabled" />
                  <span>启用</span>
                </label>
                <label>
                  <input v-model="finishedGoodsRules.allowOverStockOrder" type="radio" value="disabled" />
                  <span>不启用</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AwSettingModal>
  </AwListPage>

  <AwListPage v-else-if="!selectedProductDetail">
    <template #tree>
      <AwResourceTree
        :model-value="productTreeModel"
        :title="productTreeTitle"
        :total="productRows.length"
        :nodes="productTreeNodes"
        @mousedown="handleProductTreeEvent"
        @pointerup="handleProductTreeEvent"
        @click="handleProductTreeEvent"
        @update:model-value="selectProductTree"
        @select="selectProductTree"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如商品名称、商品编号、库位）"
      :create-label="isInventoryWarning ? '新增预警' : '新增商品'"
      @search="productKeyword = $event"
    />
    <AwDataTable
      :columns="productColumns"
      :rows="filteredProductRows"
      :total="filteredProductRows.length"
      :filter-values="productColumnFilters"
      :bulk-actions="productBulkActions"
      fit-width
      @column-filter="setProductColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'action' && isInventoryWarning" class="storehouse-action-links">
          <button
            v-for="action in value"
            :key="String(action)"
            class="aw-link-btn"
            type="button"
          >
            {{ action }}
          </button>
        </span>
        <button
          v-else-if="column.key === 'action'"
          class="aw-link-btn"
          type="button"
          @click="openProductDetail(record)"
        >
          查看
        </button>
        <button
          v-else-if="column.key === 'productName'"
          class="aw-link-btn"
          type="button"
          @click="openProductDetail(record)"
        >
          {{ value ?? '-' }}
        </button>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>

<style scoped>
.aw-link-btn {
  background: transparent;
  border: 0;
  color: var(--aw-primary);
  cursor: pointer;
  padding: 0;
}

.storehouse-action-links {
  align-items: center;
  display: inline-flex;
  gap: 12px;
}

.storehouse-detail-panel {
  padding-top: 12px;
}

.storehouse-detail-table-wrap {
  margin-top: 12px;
  overflow: auto;
}

.storehouse-detail-table {
  min-width: 980px;
}

.storehouse-detail-table th,
.storehouse-detail-table td {
  white-space: nowrap;
}

.storehouse-rule-modal {
  display: grid;
  gap: 14px;
}

.storehouse-rule-summary {
  background: var(--aw-fill-light);
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 8px 14px;
  grid-template-columns: 80px 1fr 80px 1fr;
  padding: 12px;
}

.storehouse-rule-summary span,
.storehouse-rule-grid > span,
.storehouse-rule-item > span {
  color: var(--aw-fg-3);
  font-size: 13px;
}

.storehouse-rule-section {
  display: grid;
  gap: 12px;
}

.storehouse-rule-section h4 {
  font-size: 15px;
  margin: 0;
}

.storehouse-rule-grid {
  display: grid;
  gap: 12px;
}

.storehouse-rule-item {
  align-items: center;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(260px, 1fr) 180px;
  min-height: 42px;
  padding: 10px 12px;
}

.storehouse-radio-group {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.storehouse-radio-group label {
  align-items: center;
  color: var(--aw-fg-2);
  cursor: pointer;
  display: inline-flex;
  gap: 6px;
  white-space: nowrap;
}

.storehouse-radio-group input {
  accent-color: var(--aw-primary);
}
</style>
