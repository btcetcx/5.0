<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import type { AwTableColumn, AwTreeNode } from '@/components/list-page/types';

type StorehouseProductRow = Record<string, unknown> & {
  id: string;
  warehouseKey: string;
  productName: string;
  productCode: string;
  category: string;
  model: string;
  unit: string;
  stockQty: number;
  availableQty: number;
  location: string;
  status: string;
};

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
const isMultiWarehouse = computed(() => route.query.setting === 'multi-warehouse');
const isWarehouseRules = computed(() => route.query.setting === 'warehouse-rules');
const isWarehouseListMode = computed(() => isMultiWarehouse.value || isWarehouseRules.value);

const activeWarehouse = ref('all');
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

const treeNodes: AwTreeNode[] = [
  { key: 'all', label: '全部商品', count: 12, level: 2, icon: 'line-folder', open: true },
  { key: 'test-root', label: '测试仓库', count: 12, level: 2, icon: 'line-folder', disabled: true, open: true },
  { key: 'test-finished', label: '成品区', count: 4, level: 3, icon: 'line-node' },
  { key: 'test-material', label: '原料区', count: 3, level: 3, icon: 'line-node' },
  { key: 'test-semi', label: '半成品区', count: 3, level: 3, icon: 'line-node' },
  { key: 'test-qc', label: '待检区', count: 2, level: 3, icon: 'line-node' },
];

const productColumns: AwTableColumn[] = [
  { key: 'productCode', title: '商品编号', width: 150 },
  { key: 'productName', title: '商品名称', width: 180, link: true },
  { key: 'category', title: '商品分类', width: 120, filterOptions: ['成品', '原材料', '半成品', '待检品'] },
  { key: 'model', title: '规格型号', width: 140 },
  { key: 'unit', title: '单位', width: 80 },
  { key: 'stockQty', title: '库存数量', width: 110 },
  { key: 'availableQty', title: '可用数量', width: 110 },
  { key: 'location', title: '库位', width: 130 },
  { key: 'status', title: '库存状态', width: 110, filterOptions: ['正常', '低库存', '待检', '冻结'] },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const warehouseColumns: AwTableColumn[] = [
  { key: 'code', title: '仓库编码', width: 130 },
  { key: 'name', title: '仓库名称', width: 150, link: true },
  { key: 'type', title: '仓库类型', width: 120, filterOptions: ['产成品库', '原辅料库', '内耗品库', '残次品库'] },
  { key: 'manager', title: '仓库负责人', width: 120 },
  { key: 'phone', title: '联系方式', width: 140 },
  { key: 'address', title: '仓库地址', width: 260 },
  { key: 'capacity', title: '容量', width: 100 },
  { key: 'temperature', title: '温区', width: 100 },
  { key: 'state', title: '仓库状态', width: 100, filterOptions: ['启用', '维护', '停用'] },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

const productRows: StorehouseProductRow[] = [
  { id: 'p001', warehouseKey: 'test-finished', productCode: 'SP-CP-001', productName: '智能温控终端', category: '成品', model: 'AW-T100', unit: '台', stockQty: 120, availableQty: 96, location: 'CP-A01', status: '正常' },
  { id: 'p002', warehouseKey: 'test-finished', productCode: 'SP-CP-002', productName: '工业采集网关', category: '成品', model: 'AW-G210', unit: '台', stockQty: 48, availableQty: 40, location: 'CP-A02', status: '正常' },
  { id: 'p003', warehouseKey: 'test-finished', productCode: 'SP-CP-003', productName: '边缘控制器', category: '成品', model: 'AW-E500', unit: '台', stockQty: 18, availableQty: 12, location: 'CP-B01', status: '低库存' },
  { id: 'p004', warehouseKey: 'test-finished', productCode: 'SP-CP-004', productName: '数据看板终端', category: '成品', model: 'AW-D310', unit: '台', stockQty: 32, availableQty: 28, location: 'CP-B02', status: '正常' },
  { id: 'p005', warehouseKey: 'test-material', productCode: 'SP-YL-001', productName: '铝合金型材', category: '原材料', model: 'AL-6061', unit: 'kg', stockQty: 860, availableQty: 720, location: 'YL-A01', status: '正常' },
  { id: 'p006', warehouseKey: 'test-material', productCode: 'SP-YL-002', productName: '主控 PCB 板', category: '原材料', model: 'PCB-V2.1', unit: '片', stockQty: 300, availableQty: 260, location: 'YL-A02', status: '正常' },
  { id: 'p007', warehouseKey: 'test-material', productCode: 'SP-YL-003', productName: '包装纸箱', category: '原材料', model: 'PK-01', unit: '个', stockQty: 90, availableQty: 80, location: 'YL-B01', status: '低库存' },
  { id: 'p008', warehouseKey: 'test-semi', productCode: 'SP-BC-001', productName: '传感器半成品', category: '半成品', model: 'SEN-HM', unit: '个', stockQty: 210, availableQty: 180, location: 'BC-A01', status: '正常' },
  { id: 'p009', warehouseKey: 'test-semi', productCode: 'SP-BC-002', productName: '控制板组件', category: '半成品', model: 'CTRL-A', unit: '套', stockQty: 76, availableQty: 52, location: 'BC-A02', status: '冻结' },
  { id: 'p010', warehouseKey: 'test-semi', productCode: 'SP-BC-003', productName: '外壳组件', category: '半成品', model: 'CASE-01', unit: '套', stockQty: 160, availableQty: 140, location: 'BC-B01', status: '正常' },
  { id: 'p011', warehouseKey: 'test-qc', productCode: 'SP-DJ-001', productName: '来料电源模块', category: '待检品', model: 'PWR-24V', unit: '个', stockQty: 64, availableQty: 0, location: 'QC-A01', status: '待检' },
  { id: 'p012', warehouseKey: 'test-qc', productCode: 'SP-DJ-002', productName: '待检通讯模组', category: '待检品', model: 'COM-4G', unit: '个', stockQty: 36, availableQty: 0, location: 'QC-A02', status: '待检' },
];

const warehouseRows: StorehouseWarehouseRow[] = [
  { id: 'wh-fg', code: 'WH-FG', name: '产成品库', type: '产成品库', manager: '王仓', phone: '13800000001', address: '广东省深圳市宝安区一号园区', capacity: '1200m³', temperature: '常温', state: '启用' },
  { id: 'wh-rm', code: 'WH-RM', name: '原辅料库', type: '原辅料库', manager: '李库', phone: '13800000002', address: '广东省东莞市松山湖二号园区', capacity: '980m³', temperature: '常温 / 冷藏', state: '启用' },
  { id: 'wh-consume', code: 'WH-CM', name: '内耗品库', type: '内耗品库', manager: '陈仓', phone: '13800000003', address: '广东省广州市黄埔区仓储园', capacity: '360m³', temperature: '常温', state: '启用' },
  { id: 'wh-defect', code: 'WH-DF', name: '残次品库', type: '残次品库', manager: '赵强', phone: '13800000004', address: '广东省深圳市宝安区质检暂存区', capacity: '220m³', temperature: '常温', state: '维护' },
];

const filteredProductRows = computed(() => productRows.filter((row) => {
  const treeMatched = activeWarehouse.value === 'all' || row.warehouseKey === activeWarehouse.value;
  const keywordMatched = !productKeyword.value.trim() || JSON.stringify(row).includes(productKeyword.value.trim());
  const filterMatched = Object.entries(productColumnFilters).every(([key, value]) => !value || row[key] === value);
  return treeMatched && keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: '查看' })));

const filteredWarehouseRows = computed(() => warehouseRows.filter((row) => {
  const keywordMatched = !warehouseKeyword.value.trim() || JSON.stringify(row).includes(warehouseKeyword.value.trim());
  const filterMatched = Object.entries(warehouseColumnFilters).every(([key, value]) => !value || row[key] === value);
  return keywordMatched && filterMatched;
}).map((row) => ({ ...row, action: isWarehouseRules.value ? '规则设置' : '查看' })));

function setProductColumnFilter(columnKey: string, value: string) {
  if (value) productColumnFilters[columnKey] = value;
  else delete productColumnFilters[columnKey];
}

function setWarehouseColumnFilter(columnKey: string, value: string) {
  if (value) warehouseColumnFilters[columnKey] = value;
  else delete warehouseColumnFilters[columnKey];
}

function openRuleModal(record: Record<string, unknown>) {
  activeRuleWarehouse.value = warehouseRows.find((row) => row.id === record.id) || null;
  showRuleModal.value = true;
}
</script>

<template>
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

  <AwListPage v-else>
    <template #tree>
      <AwResourceTree
        v-model="activeWarehouse"
        title="仓库分类"
        source-text="来源：仓库 - 仓库管理"
        :total="productRows.length"
        :nodes="treeNodes"
      />
    </template>

    <AwListToolbar
      search-placeholder="全局搜索（如商品名称、商品编号、库位）"
      create-label="新增商品"
      @search="productKeyword = $event"
    />
    <AwDataTable
      :columns="productColumns"
      :rows="filteredProductRows"
      :total="filteredProductRows.length"
      :filter-values="productColumnFilters"
      fit-width
      @column-filter="setProductColumnFilter"
    />
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
