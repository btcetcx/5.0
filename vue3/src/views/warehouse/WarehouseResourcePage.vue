<template>
  <operation-setting-page v-if="settingModule" :module="settingModule" />
  <warehouse-create-view v-else-if="isCreate" :module-key="moduleKey" :action-mode="actionMode" @back="goList" />
  <warehouse-detail-view v-else-if="detailId" :module-key="moduleKey" :id="detailId" @back="goList" />
  <aw-list-page v-else>
    <template v-if="activeListConfig.tree" #tree>
      <aw-resource-tree v-model="pickedTree" :title="activeListConfig.tree.title" :total="activeListRows.length" :nodes="activeListConfig.tree.nodes" />
    </template>

    <aw-list-toolbar
      :search-placeholder="activeListConfig.searchPlaceholder"
      :create-label="activeListConfig.createLabel"
      :actions="activeListConfig.toolbarActions"
      @search="keyword = $event"
      @refresh="refreshList"
      @filter="openFilterModal"
      @columns="openColumnsModal"
      @import="handleImport"
      @export="handleExport"
      @create="goCreate"
    />

    <aw-data-table
      :columns="visibleColumns"
      :rows="tableRows"
      row-key="id"
      :total="activeFilteredItems.length"
      :bulk-actions="activeListConfig.bulkActions"
      :filter-values="columnFilters"
      :fit-width="Boolean(activeListConfig.fitWidth)"
      @selection-change="handleSelectionChange"
      @batch-action="handleBatchAction"
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === activeListConfig.linkKey" class="aw-link" @click="openDetail(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'sourceNo'" class="aw-link" @click="openSourceDoc(record)">{{ value ?? '-' }}</span>
        <span v-else-if="column.key === 'image'" class="warehouse-thumb" />
        <span v-else-if="column.key === 'state' || column.key === 'qualityState'" :class="['aw-status', String(record.tone || statusTone(value))]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(record.id as string)">查看</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>

  <aw-setting-modal :open="showFilterModal" title="筛选" width="680px" @cancel="closeFilterModal" @confirm="applyFilterModal">
    <div v-if="filterModalHasItems" class="warehouse-filter-grid">
      <label v-if="activeListConfig.tree" class="aw-field">
        <span>分类</span>
        <select v-model="draftTree" class="aw-select">
          <option value="all">全部</option>
          <option v-for="node in activeListConfig.tree.nodes" :key="node.key" :value="node.key">{{ node.label }}</option>
        </select>
      </label>
      <label v-for="column in filterableColumns" :key="column.key" class="aw-field">
        <span>{{ column.title }}</span>
        <select v-model="draftFilters[column.key]" class="aw-select">
          <option value="">全部</option>
          <option v-for="option in column.filterOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>
    <div v-else class="warehouse-filter-empty">当前列表暂无可配置筛选项，可使用全局搜索。</div>
    <template #footer>
      <button class="aw-tool-btn" type="button" @click="resetFilterModal">重置</button>
      <button class="aw-tool-btn" type="button" @click="closeFilterModal">取消</button>
      <button class="aw-btn primary" type="button" @click="applyFilterModal">确定</button>
    </template>
  </aw-setting-modal>

  <aw-setting-modal :open="showColumnsModal" title="字段配置" width="720px" @cancel="closeColumnsModal" @confirm="applyColumnsModal">
    <div class="warehouse-column-grid">
      <label v-for="column in activeListConfig.columns" :key="column.key" class="warehouse-column-item">
        <input
          type="checkbox"
          :checked="draftColumnKeys.includes(column.key) || column.fixed === 'right'"
          :disabled="column.fixed === 'right'"
          @change="toggleDraftColumn(column.key, $event)"
        />
        <span>{{ column.title }}</span>
        <em v-if="column.fixed === 'right'">固定列</em>
      </label>
    </div>
    <template #footer>
      <button class="aw-tool-btn" type="button" @click="resetColumnsModal">恢复默认</button>
      <button class="aw-tool-btn" type="button" @click="closeColumnsModal">取消</button>
      <button class="aw-btn primary" type="button" @click="applyColumnsModal">确定</button>
    </template>
  </aw-setting-modal>

  <div v-if="toastText" class="warehouse-toast">{{ toastText }}</div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  approveWarehouse,
  createWarehouse,
  exportWarehouse,
  getWarehouseDetail,
  listWarehouse,
  printWarehouse,
  updateWarehouse,
  warehouseLocationAreas,
  warehouseLocationWarehouses,
  warehouseProducts,
  warehouseSources,
  type WarehouseDetail,
  type WarehouseLine,
  type WarehouseModule,
  type WarehouseProduct,
  type WarehouseRow,
  type WarehouseSource,
} from '@/app/api/warehouse/resources';
import type { OperationSettingModule } from '@/app/templates/operation-settings-template';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode, ToolbarActionKey } from '@/components/list-page/types';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwCategoryPickerModal from '@/components/form-page/AwCategoryPickerModal.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwLineDetailSection from '@/components/form-page/AwLineDetailSection.vue';
import AwOptionPickerModal, { type OptionPickerCategory } from '@/components/form-page/AwOptionPickerModal.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import AwSourcePickerModal from '@/components/form-page/AwSourcePickerModal.vue';
import type { AttachmentRow, CategoryPickerConfirmPayload, CategoryPickerGroup, EditableColumn, FormAction, SourcePickerBatch, SourcePickerCategory, SourcePickerConfirmPayload, SourcePickerRow } from '@/components/form-page/types';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import type { DetailAction, DetailFieldItem, DetailTabItem } from '@/components/detail-page/types';
import OperationSettingPage from '@/views/operation/shared/OperationSettingPage.vue';
import type { PersonPickerDept, PersonPickerPerson } from '@/components/setting-page/types';

type AnyRow = Record<string, any>;
type PickerRow = { id: string | number; [key: string]: unknown };
type CountScopeLevel = '仓库' | '区域' | '库位' | '库位物品' | '商品';
type InventoryCountMode = 'whole' | 'area' | 'location' | 'sku';

interface CountScopePayload {
  level: CountScopeLevel;
  warehouse: string;
  area?: string;
  location?: string;
  productName?: string;
  productCode?: string;
  itemCount?: number;
}

interface InventoryCountModeCard {
  key: InventoryCountMode;
  title: string;
  desc: string;
  icon: string;
}

interface WarehouseModuleConfig {
  title: string;
  searchPlaceholder: string;
  createLabel: string;
  columns: AwTableColumn[];
  linkKey: string;
  bulkActions: AwBulkAction[];
  toolbarActions?: ToolbarActionKey[];
  tree?: { title: string; nodes: AwTreeNode[] };
  fitWidth?: boolean;
}

const route = useRoute();
const router = useRouter();
const items = ref<WarehouseRow[]>([]);
const keyword = ref('');
const pickedTree = ref('all');
const toastText = ref('');
const columnFilters = reactive<Record<string, string>>({});
const draftFilters = reactive<Record<string, string>>({});
const draftTree = ref('all');
const showFilterModal = ref(false);
const showColumnsModal = ref(false);
const draftColumnKeys = ref<string[]>([]);
const visibleColumnState = reactive<Record<string, string[]>>({});
const selectedKeys = ref<string[]>([]);

const moduleKey = computed<WarehouseModule>(() => {
  if (route.path.endsWith('/inventory-stocks')) return 'stocks';
  if (route.path.endsWith('/warehouse-inbounds')) return 'inbounds';
  if (route.path.endsWith('/warehouse-outbounds')) return 'outbounds';
  if (route.path.endsWith('/warehouse-transfers')) return 'transfers';
  if (route.path.endsWith('/inventory-counts')) return 'counts';
  if (route.path.endsWith('/outbound-quality-inspections')) return 'outboundQuality';
  if (route.path.endsWith('/inbound-quality-inspections')) return 'inboundQuality';
  return 'locations';
});

const settingModule = computed<OperationSettingModule | null>(() => {
  if (!route.query.setting) return null;
  const map: Record<WarehouseModule, OperationSettingModule> = {
    stocks: 'warehouseStocks',
    inbounds: 'warehouseInbounds',
    outbounds: 'warehouseOutbounds',
    transfers: 'warehouseTransfers',
    counts: 'inventoryCounts',
    outboundQuality: 'warehouseOutbounds',
    inboundQuality: 'warehouseInbounds',
    locations: 'warehouseLocations',
  };
  return map[moduleKey.value];
});
const routeAction = computed(() => typeof route.query.action === 'string' ? route.query.action : '');
const createActions = ['new', '直接入库', '直接出库', '新增调拨', '直接盘点', '新增出货质检', '新增出库质检', '新增来料质检', '新增仓库', '新增区域', '新增库位'];
const isCreate = computed(() => createActions.includes(routeAction.value));
const actionMode = computed(() => String(route.query.action || 'new'));
const detailId = computed(() => typeof route.query.id === 'string' ? route.query.id : '');

const commonActions: ToolbarActionKey[] = ['refresh', 'filter', 'columns', 'export', 'import', 'create'];
const noCreateActions: ToolbarActionKey[] = ['refresh', 'filter', 'columns', 'export', 'import'];

const configs: Record<WarehouseModule, WarehouseModuleConfig> = {
  stocks: {
    title: '库存管理',
    searchPlaceholder: '全局搜索（如产品名称、产品编号、批次、仓库…）',
    createLabel: '',
    linkKey: 'name',
    toolbarActions: noCreateActions,
    bulkActions: [{ key: 'freeze', label: '批量冻结' }, { key: 'export', label: '批量导出' }],
    tree: {
      title: '库存列表',
      nodes: [
        { key: 'all', label: '全部库存', count: 3, icon: 'line-folder', level: 2, open: true },
        { key: '成品', label: '成品', count: 1, icon: 'line-node', level: 3 },
        { key: '半成品', label: '半成品', count: 1, icon: 'line-node', level: 3 },
        { key: '原材料', label: '原材料', count: 1, icon: 'line-node', level: 3 },
        { key: '包装耗材', label: '包装耗材', count: 0, icon: 'line-node', level: 3 },
      ],
    },
    columns: [
      { key: 'image', title: '图片', width: 80 },
      { key: 'ledgerNo', title: '台账编号', width: 140 },
      { key: 'name', title: '产品名称', width: 150, link: true },
      { key: 'code', title: '产品编号', width: 150 },
      { key: 'model', title: '产品型号', width: 110 },
      { key: 'cat', title: '产品分类', width: 110, filterOptions: ['成品', '半成品', '原材料', '包装耗材'] },
      { key: 'unit', title: '产品单位', width: 90 },
      { key: 'stock', title: '库存数量', width: 90 },
      { key: 'workshop', title: '车间数量', width: 90 },
      { key: 'inTransit', title: '在途数量', width: 90 },
      { key: 'frozen', title: '冻结数量', width: 90 },
      { key: 'occupied', title: '占用数量', width: 90 },
      { key: 'available', title: '可用数量', width: 90 },
      { key: 'wh', title: '仓库', width: 120 },
      { key: 'qualityState', title: '质量状态', width: 110 },
      { key: 'costLayer', title: '成本层', width: 150 },
      { key: 'sourceLine', title: '来源明细', width: 150 },
      { key: 'action', title: '操作', width: 90, fixed: 'right' },
    ],
  },
  inbounds: {
    title: '入库管理',
    searchPlaceholder: '全局搜索（如供应商、产品名称、入库单号、来源单据号…）',
    createLabel: '新增入库',
    toolbarActions: commonActions,
    linkKey: 'subject',
    bulkActions: [{ key: 'putaway', label: '批量上架' }],
    columns: inboundOutboundColumns('入库'),
  },
  outbounds: {
    title: '出库管理',
    searchPlaceholder: '全局搜索（如客户、产品名称、出库单号、来源单据号…）',
    createLabel: '新增出库',
    toolbarActions: commonActions,
    linkKey: 'subject',
    bulkActions: [{ key: 'pick', label: '批量拣货' }],
    columns: inboundOutboundColumns('出库'),
  },
  transfers: {
    title: '调拨管理',
    searchPlaceholder: '全局搜索（如物料、调拨单号、仓库）',
    createLabel: '新增调拨',
    toolbarActions: commonActions,
    linkKey: 'subject',
    bulkActions: [{ key: 'confirm', label: '批量确认' }],
    columns: [
      { key: 'subject', title: '调拨主题', width: 190, link: true },
      { key: 'code', title: '调拨单号', width: 150 },
      { key: 'qty', title: '调拨数量', width: 100 },
      { key: 'fromWh', title: '原仓库', width: 130 },
      { key: 'toWh', title: '目标仓库', width: 130 },
      { key: 'date', title: '调拨日期', width: 120 },
      { key: 'user', title: '经办人', width: 100 },
      { key: 'state', title: '调拨状态', width: 150, filterOptions: ['调拨出库待确认', '调入确认中', '已完成'] },
      { key: 'action', title: '操作', width: 90, fixed: 'right' },
    ],
  },
  counts: {
    title: '盘点管理',
    searchPlaceholder: '全局搜索（如盘点主题、产品名称、工单编号…）',
    createLabel: '直接盘点',
    toolbarActions: commonActions,
    linkKey: 'subject',
    bulkActions: [{ key: 'count', label: '批量盘点' }],
    columns: [
      { key: 'subject', title: '盘点主题', width: 180, link: true },
      { key: 'code', title: '盘点编号', width: 150 },
      { key: 'wh', title: '盘点仓库', width: 120 },
      { key: 'scope', title: '盘点范围', width: 140 },
      { key: 'lockScope', title: '锁库范围', width: 180 },
      { key: 'locked', title: '是否锁库', width: 90, filterOptions: ['是', '否'] },
      { key: 'lockQty', title: '锁库数量', width: 90 },
      { key: 'date', title: '盘点日期', width: 120 },
      { key: 'user', title: '盘点人', width: 100 },
      { key: 'state', title: '盘点状态', width: 120, filterOptions: ['未开始', '盘点中', '复盘中', '差异待调整'] },
      { key: 'action', title: '操作', width: 90, fixed: 'right' },
    ],
  },
  outboundQuality: {
    title: '出库质检',
    searchPlaceholder: '全局搜索（如出货检验主题、OQC单号、产品/批次）',
    createLabel: '新增出库质检',
    toolbarActions: commonActions,
    linkKey: 'subject',
    bulkActions: [{ key: 'process', label: '批量处理' }],
    tree: {
      title: 'OQC分类',
      nodes: ['全部OQC', '待出货检验', '客户验货', '让步放行', '拒收重检'].map((label, index) => ({
        key: index === 0 ? 'all' : label,
        label,
        count: index === 0 ? 4 : 1,
        icon: index === 0 ? 'line-folder' : 'line-node',
        level: index === 0 ? 2 : 3,
        open: index === 0,
      })),
    },
    columns: [
      { key: 'subject', title: '出货检验主题', width: 180, link: true },
      { key: 'code', title: 'OQC单号', width: 150 },
      { key: 'source', title: '销售/出库单', width: 200 },
      { key: 'object', title: '客户/产品', width: 200 },
      { key: 'qty', title: '数量/抽样', width: 140 },
      { key: 'inspector', title: '检验员', width: 100 },
      { key: 'date', title: '质检日期', width: 120 },
      { key: 'state', title: 'OQC状态', width: 130, filterOptions: ['待出货检验', '客户验货中', '待放行审批', '已放行', '客户拒收', '已拦截'] },
      { key: 'action', title: '操作', width: 90, fixed: 'right' },
    ],
  },
  inboundQuality: {
    title: '来料质检',
    searchPlaceholder: '全局搜索（如来料检验主题、IQC单号、供应商/产品/批次）',
    createLabel: '新增来料质检',
    toolbarActions: commonActions,
    linkKey: 'subject',
    bulkActions: [{ key: 'process', label: '批量处理' }],
    tree: {
      title: 'IQC分类',
      nodes: ['全部IQC', '待来料检验', '让步接收', '拒收退回', '已放行'].map((label, index) => ({
        key: index === 0 ? 'all' : label,
        label,
        count: index === 0 ? 4 : 1,
        icon: index === 0 ? 'line-folder' : 'line-node',
        level: index === 0 ? 2 : 3,
        open: index === 0,
      })),
    },
    columns: [
      { key: 'subject', title: '来料检验主题', width: 180, link: true },
      { key: 'code', title: 'IQC单号', width: 150 },
      { key: 'source', title: '采购/入库单', width: 200 },
      { key: 'object', title: '供应商/产品', width: 200 },
      { key: 'qty', title: '数量/抽样', width: 140 },
      { key: 'inspector', title: '检验员', width: 100 },
      { key: 'date', title: '质检日期', width: 120 },
      { key: 'state', title: 'IQC状态', width: 130, filterOptions: ['待来料检验', '质检中', '让步接收', '拒收退回', '已放行'] },
      { key: 'action', title: '操作', width: 90, fixed: 'right' },
    ],
  },
  locations: {
    title: '仓库库位',
    searchPlaceholder: '全局搜索（如仓库、区域、库位）',
    createLabel: '新增',
    toolbarActions: commonActions,
    linkKey: 'name',
    bulkActions: [{ key: 'enable', label: '批量启用' }],
    tree: {
      title: '库位管理',
      nodes: [
        { key: 'all', label: '全部仓库', count: 10, icon: 'line-folder', level: 2, open: true },
        { key: '仓库A', label: '仓库A', count: 4, icon: 'line-folder', level: 2, open: true },
        { key: 'A区', label: 'A区', count: 2, icon: 'line-node', level: 3 },
        { key: 'B区', label: 'B区', count: 1, icon: 'line-node', level: 3 },
        { key: '质检区', label: '质检区', count: 1, icon: 'line-node', level: 3 },
        { key: '仓库B', label: '仓库B', count: 3, icon: 'line-folder', level: 2, open: true },
        { key: '原料A区', label: '原料A区', count: 1, icon: 'line-node', level: 3 },
        { key: '冷藏区', label: '冷藏区', count: 1, icon: 'line-node', level: 3 },
        { key: '退料区', label: '退料区', count: 1, icon: 'line-node', level: 3 },
        { key: '仓库0545', label: '仓库0545', count: 3, icon: 'line-folder', level: 2, open: true },
        { key: '成品区', label: '成品区', count: 2, icon: 'line-node', level: 3 },
        { key: '暂存区', label: '暂存区', count: 1, icon: 'line-node', level: 3 },
      ],
    },
    columns: [
      { key: 'code', title: '库位编号', width: 130 },
      { key: 'name', title: '库位名称', width: 140, link: true },
      { key: 'area', title: '所属区域', width: 110 },
      { key: 'desc', title: '库位描述', width: 160 },
      { key: 'capacity', title: '容量', width: 100 },
      { key: 'warehouse', title: '所属仓库', width: 130 },
      { key: 'manager', title: '仓库负责人', width: 110 },
      { key: 'address', title: '仓库地址', width: 240 },
      { key: 'state', title: '库位状态', width: 100, filterOptions: ['可用', '禁用', '维护'] },
      { key: 'action', title: '操作', width: 90, fixed: 'right' },
    ],
  },
};

const inboundDetailRows: WarehouseRow[] = [
  { id: 'inbound_detail_001', name: '半成品物料', code: '7820864', model: '规格一', unit: '公斤', waiting: 500, people: '李文涛、陈思源', note: '可点击对应入库单填写入库数量和库位' },
  { id: 'inbound_detail_002', name: '铝合金型材', code: '8518691', model: 'AL-6061', unit: 'KG', waiting: 300, people: '赵强', note: '可点击对应入库单填写入库数量和库位' },
  { id: 'inbound_detail_003', name: '包装纸箱', code: '6081578', model: 'PK-01', unit: '个', waiting: 120, people: '老夏', note: '可点击对应入库单填写入库数量和库位' },
];

const outboundDetailRows: WarehouseRow[] = [
  { id: 'outbound_detail_001', name: '产品一', code: '123456', model: '规格一', unit: '个', qty: 100, people: '李文涛、陈思源', note: '可出库未出库' },
  { id: 'outbound_detail_002', name: '半成品物料', code: '7820864', model: 'HM-450', unit: 'KG', qty: 300, people: '赵强', note: '库存已锁定，暂存状态' },
  { id: 'outbound_detail_003', name: '铝合金型材', code: '8518691', model: 'AL-6061', unit: 'KG', qty: 80, people: '李文涛', note: '可出库未出库' },
];

const transferDetailRows: WarehouseRow[] = [
  { id: 'transfer_detail_001', sourceLine: 'DB-20251221001-01', name: '半成品物料', code: '7820864', batch: 'B20250601', qualityState: '合格', tone: 'green', unit: '公斤', qty: 500, transferFrozenQty: 500, inTransitQty: 8, inQty: 492, fromWh: '二号仓库', toWh: '仓库0545', date: '2025-12-21' },
  { id: 'transfer_detail_002', sourceLine: 'DB-20251221001-02', name: '半成品物料', code: '5786931', batch: 'B20250602', qualityState: '合格', tone: 'green', unit: '公斤', qty: 300, transferFrozenQty: 300, inTransitQty: 0, inQty: 300, fromWh: '二号仓库', toWh: '仓库0545', date: '2025-12-21' },
  { id: 'transfer_detail_003', sourceLine: 'DB-20251221003-01', name: '铝合金型材', code: '8518691', batch: 'AL20250602', qualityState: '待检', tone: 'yellow', unit: 'KG', qty: 120, transferFrozenQty: 120, inTransitQty: 120, inQty: 0, fromWh: '原料仓', toWh: '生产线边仓', date: '2025-12-19' },
];

const warehouseRows: WarehouseRow[] = warehouseLocationWarehouses;
const areaRows: WarehouseRow[] = warehouseLocationAreas;

function detailStatsColumns(waitingTitle: string): AwTableColumn[] {
  return [
    { key: 'name', title: '物料名称' },
    { key: 'code', title: '物料编码' },
    { key: 'model', title: '规格型号' },
    { key: 'unit', title: '单位', width: 72 },
    { key: waitingTitle === '待入库数量' ? 'waiting' : 'qty', title: waitingTitle, width: 104 },
    { key: 'people', title: '相关人员' },
    { key: 'note', title: '说明' },
  ];
}

function getActionListConfig(module: WarehouseModule, action: string, tab: unknown): WarehouseModuleConfig | null {
  if (module === 'inbounds' && action === '待入库明细') {
    return {
      title: '待入库明细',
      searchPlaceholder: '全局搜索（如物料名称、物料编码）',
      createLabel: '',
      toolbarActions: noCreateActions,
      linkKey: '',
      bulkActions: [{ key: 'batchInbound', label: '批量入库' }],
      fitWidth: true,
      columns: detailStatsColumns('待入库数量'),
    };
  }
  if (module === 'outbounds' && (action === '待出库明细' || action === '待申请发货')) {
    return {
      title: action,
      searchPlaceholder: '全局搜索（如物料名称、物料编码）',
      createLabel: '',
      toolbarActions: noCreateActions,
      linkKey: '',
      bulkActions: [{ key: action === '待申请发货' ? 'batchApplyShip' : 'batchOutbound', label: action === '待申请发货' ? '批量申请发货' : '批量出库' }],
      fitWidth: true,
      columns: detailStatsColumns('待出库数量'),
    };
  }
  if (module === 'transfers' && action === '调拨明细表') {
    return {
      title: '调拨明细表',
      searchPlaceholder: '全局搜索（如物料名称、物料编码、仓库）',
      createLabel: '',
      toolbarActions: noCreateActions,
      linkKey: '',
      bulkActions: [{ key: 'batchTransfer', label: '批量处理' }],
      columns: [
        { key: 'sourceLine', title: '来源明细', width: 170 },
        { key: 'name', title: '物料名称', width: 140 },
        { key: 'code', title: '物料编码', width: 140 },
        { key: 'batch', title: '批次', width: 120 },
        { key: 'qualityState', title: '质量状态', width: 110 },
        { key: 'unit', title: '单位', width: 90 },
        { key: 'qty', title: '调拨数量', width: 110 },
        { key: 'transferFrozenQty', title: '调拨冻结', width: 110 },
        { key: 'inTransitQty', title: '在途数量', width: 110 },
        { key: 'inQty', title: '调入数量', width: 110 },
        { key: 'fromWh', title: '原仓库', width: 130 },
        { key: 'toWh', title: '目标仓库', width: 130 },
        { key: 'date', title: '调拨日期', width: 120 },
      ],
    };
  }
  if (module === 'locations' && tab === 'warehouses') {
    return {
      ...configs.locations,
      title: '仓库列表',
      searchPlaceholder: '全局搜索（如仓库名称、仓库编码、负责人）',
      createLabel: '新增仓库',
      linkKey: 'name',
      tree: undefined,
      columns: [
        { key: 'code', title: '仓库编码', width: 130 },
        { key: 'name', title: '仓库名称', width: 150, link: true },
        { key: 'type', title: '仓库类型', width: 120 },
        { key: 'manager', title: '仓库负责人', width: 120 },
        { key: 'phone', title: '联系方式', width: 140 },
        { key: 'address', title: '仓库地址', width: 260 },
        { key: 'state', title: '仓库状态', width: 100 },
        { key: 'action', title: '操作', width: 90, fixed: 'right' },
      ],
    };
  }
  if (module === 'locations' && tab === 'areas') {
    return {
      ...configs.locations,
      title: '区域列表',
      searchPlaceholder: '全局搜索（如区域名称、区域编码、所属仓库）',
      createLabel: '新增区域',
      linkKey: 'name',
      tree: {
        title: '仓库列表',
        nodes: [
          { key: 'all', label: '全部仓库', count: areaRows.length, icon: 'line-folder', level: 2, open: true },
          ...warehouseRows.map((row) => ({
            key: String(row.name),
            label: String(row.name),
            count: areaRows.filter((area) => area.warehouse === row.name).length,
            icon: 'line-folder',
            level: 2 as const,
          })),
        ],
      },
      columns: [
        { key: 'code', title: '区域编号', width: 130 },
        { key: 'name', title: '区域名称', width: 140, link: true },
        { key: 'warehouse', title: '所属仓库', width: 130 },
        { key: 'temperature', title: '温区', width: 100 },
        { key: 'capacity', title: '容量', width: 100 },
        { key: 'locationCount', title: '库位数', width: 90 },
        { key: 'desc', title: '区域描述', width: 180 },
        { key: 'manager', title: '负责人', width: 110 },
        { key: 'state', title: '区域状态', width: 100, filterOptions: ['启用', '禁用', '维护'] },
        { key: 'action', title: '操作', width: 90, fixed: 'right' },
      ],
    };
  }
  return null;
}

function getActionListRows(module: WarehouseModule, action: string, tab: unknown): WarehouseRow[] {
  if (module === 'inbounds' && action === '待入库明细') return inboundDetailRows;
  if (module === 'outbounds' && action === '待出库明细') return outboundDetailRows;
  if (module === 'outbounds' && action === '待申请发货') return outboundDetailRows.map((row) => ({ ...row, note: '订单流转策略为否，需要手动申请发货' }));
  if (module === 'transfers' && action === '调拨明细表') return transferDetailRows;
  if (module === 'locations' && tab === 'warehouses') return warehouseRows;
  if (module === 'locations' && tab === 'areas') return areaRows;
  return [];
}

const moduleConfig = computed(() => configs[moduleKey.value]);
const actionListConfig = computed<WarehouseModuleConfig | null>(() => getActionListConfig(moduleKey.value, routeAction.value, route.query.tab));
const activeListConfig = computed(() => actionListConfig.value || moduleConfig.value);
const actionListRows = computed<WarehouseRow[]>(() => getActionListRows(moduleKey.value, routeAction.value, route.query.tab));
const activeListRows = computed(() => actionListConfig.value ? actionListRows.value : items.value);
const listStateKey = computed(() => `${moduleKey.value}:${routeAction.value || 'list'}:${String(route.query.tab || '')}`);
const allColumnKeys = computed(() => activeListConfig.value.columns.map((column) => column.key));
const fixedColumnKeys = computed(() => activeListConfig.value.columns.filter((column) => column.fixed === 'right').map((column) => column.key));
const activeVisibleKeys = computed(() => {
  const savedKeys = visibleColumnState[listStateKey.value];
  const keys = savedKeys?.length ? savedKeys : allColumnKeys.value;
  return Array.from(new Set([...keys, ...fixedColumnKeys.value]));
});
const visibleColumns = computed(() => {
  const visibleKeys = new Set(activeVisibleKeys.value);
  return activeListConfig.value.columns.filter((column) => visibleKeys.has(column.key) || column.fixed === 'right');
});
const filterableColumns = computed(() => activeListConfig.value.columns.filter((column) => column.filterOptions?.length));
const filterModalHasItems = computed(() => Boolean(activeListConfig.value.tree || filterableColumns.value.length));
const filteredItems = computed(() => {
  const term = keyword.value.trim();
  return activeListRows.value.filter((item) => {
    const keywordMatched = !term || JSON.stringify(item).includes(term);
    const actionMatched = actionListConfig.value ? true : actionFilterMatched(moduleKey.value, routeAction.value, item);
    const treeMatched = pickedTree.value === 'all'
      || item.cat === pickedTree.value
      || item.warehouse === pickedTree.value
      || item.area === pickedTree.value
      || item.state === pickedTree.value;
    const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || item[key] === value);
    return keywordMatched && actionMatched && treeMatched && filterMatched;
  });
});
const activeFilteredItems = filteredItems;
const tableRows = computed(() => filteredItems.value.map((row) => ({ ...row, action: actionListConfig.value ? '' : '查看' })));

watch(() => route.fullPath, () => {
  if (settingModule.value || isCreate.value) return;
  keyword.value = '';
  pickedTree.value = 'all';
  Object.keys(columnFilters).forEach((key) => delete columnFilters[key]);
  selectedKeys.value = [];
  showFilterModal.value = false;
  showColumnsModal.value = false;
  loadData();
}, { immediate: true });

watch(listStateKey, () => {
  selectedKeys.value = [];
  showFilterModal.value = false;
  showColumnsModal.value = false;
  draftColumnKeys.value = [];
});

watch(toastText, (value) => {
  if (!value) return;
  window.setTimeout(() => {
    toastText.value = '';
  }, 1800);
});

function inboundOutboundColumns(label: '入库' | '出库'): AwTableColumn[] {
  const columns: AwTableColumn[] = [
    { key: 'subject', title: `${label}主题`, width: 180, link: true },
    { key: 'code', title: `${label}单号`, width: 150 },
    { key: 'type', title: `${label}类别`, width: 120, filterOptions: label === '入库' ? ['采购入库', '生产入库', '退货入库', '委外入库', '直接入库'] : ['内部领用', '委外领料', '销售出库', '采购退货', '直接出库'] },
    { key: 'qty', title: `${label}数量`, width: 100 },
    { key: 'applyDate', title: '申请日期', width: 120 },
    { key: 'user', title: `${label}人员`, width: 110 },
    { key: 'date', title: `${label}日期`, width: 120 },
    { key: 'state', title: `${label}状态`, width: 130, filterOptions: label === '入库' ? ['已收货待检', '已上架过账', '待上架', '质检中', '已入库'] : ['已审核待占用', '拣货中', 'OQC待放行', '待复核', '已过账'] },
    { key: 'action', title: '操作', width: 90, fixed: 'right' },
  ];
  columns.splice(2, 0, { key: 'sourceNo', title: '来源单据号', width: 150 });
  return columns;
}

function actionFilterMatched(module: WarehouseModule, action: string, item: WarehouseRow) {
  if (module === 'inbounds' && action === '待入库单') return !['已上架过账', '已入库', '关闭'].includes(String(item.state || ''));
  if (module === 'outbounds' && action === '待出库单') return !['已出库过账', '已过账', '异常关闭'].includes(String(item.state || ''));
  if (module === 'outbounds' && action === '待申请发货') return ['OQC待放行', '待复核', '已审核待占用'].includes(String(item.state || ''));
  return true;
}

function statusTone(value: unknown) {
  if (['合格', '启用', '已过账', '已完成', '可用', '已放行'].includes(String(value))) return 'green';
  if (['待检', '待审批', '已锁定', '待复核', '禁用', '待来料检验', '质检中'].includes(String(value))) return 'yellow';
  if (['拒收退回', '客户拒收', '已拦截'].includes(String(value))) return 'red';
  return '';
}

async function loadData() {
  const result = await listWarehouse(moduleKey.value);
  items.value = result.items;
}

async function refreshList() {
  await loadData();
  selectedKeys.value = [];
  toastText.value = '刷新完成';
}

function setColumnFilter(columnKey: string, value: string) {
  if (value) columnFilters[columnKey] = value;
  else delete columnFilters[columnKey];
}

function openFilterModal() {
  clearStringRecord(draftFilters);
  filterableColumns.value.forEach((column) => {
    draftFilters[column.key] = columnFilters[column.key] || '';
  });
  draftTree.value = pickedTree.value;
  showFilterModal.value = true;
}

function closeFilterModal() {
  showFilterModal.value = false;
}

function applyFilterModal() {
  clearStringRecord(columnFilters);
  filterableColumns.value.forEach((column) => {
    const value = draftFilters[column.key];
    if (value) columnFilters[column.key] = value;
  });
  if (activeListConfig.value.tree) pickedTree.value = draftTree.value;
  selectedKeys.value = [];
  showFilterModal.value = false;
  toastText.value = `筛选已应用，共 ${activeFilteredItems.value.length} 条`;
}

function resetFilterModal() {
  clearStringRecord(draftFilters);
  clearStringRecord(columnFilters);
  draftTree.value = 'all';
  pickedTree.value = 'all';
  selectedKeys.value = [];
  toastText.value = '筛选条件已重置';
}

function openColumnsModal() {
  draftColumnKeys.value = [...activeVisibleKeys.value];
  showColumnsModal.value = true;
}

function closeColumnsModal() {
  showColumnsModal.value = false;
}

function toggleDraftColumn(columnKey: string, event: Event) {
  if (fixedColumnKeys.value.includes(columnKey)) return;
  const checked = (event.target as HTMLInputElement).checked;
  const next = new Set(draftColumnKeys.value);
  if (checked) next.add(columnKey);
  else next.delete(columnKey);
  draftColumnKeys.value = Array.from(next);
}

function applyColumnsModal() {
  const validKeys = new Set(allColumnKeys.value);
  const fixedKeys = fixedColumnKeys.value;
  let nextKeys = draftColumnKeys.value.filter((key) => validKeys.has(key) && !fixedKeys.includes(key));
  if (!nextKeys.length) {
    const fallbackKey = activeListConfig.value.linkKey || activeListConfig.value.columns.find((column) => column.fixed !== 'right')?.key;
    if (fallbackKey) nextKeys = [fallbackKey];
  }
  visibleColumnState[listStateKey.value] = Array.from(new Set([...nextKeys, ...fixedKeys]));
  selectedKeys.value = [];
  showColumnsModal.value = false;
  toastText.value = '字段配置已应用';
}

function resetColumnsModal() {
  delete visibleColumnState[listStateKey.value];
  draftColumnKeys.value = [...allColumnKeys.value];
  toastText.value = '字段配置已恢复默认';
}

function handleSelectionChange(keys: string[]) {
  selectedKeys.value = keys;
}

function handleBatchAction(actionKey: string, keys: string[]) {
  if (!keys.length) {
    toastText.value = '请先选择数据';
    return;
  }
  const actionLabel = activeListConfig.value.bulkActions.find((action) => action.key === actionKey)?.label || actionKey;
  selectedKeys.value = keys;
  toastText.value = `${actionLabel}已处理 ${keys.length} 条`;
}

function handleImport() {
  toastText.value = `${activeListConfig.value.title}导入入口已打开，可选择模板回填数据`;
}

function handleExport() {
  toastText.value = `${activeListConfig.value.title}导出任务已创建，共 ${activeFilteredItems.value.length} 条`;
}

function clearStringRecord(record: Record<string, string>) {
  Object.keys(record).forEach((key) => delete record[key]);
}

function goCreate() {
  if (moduleKey.value === 'stocks') return;
  if (moduleKey.value === 'locations') {
    const tab = String(route.query.tab || '');
    const action = tab === 'warehouses' ? '新增仓库' : tab === 'areas' ? '新增区域' : '新增库位';
    router.push({ path: route.path, query: { action } });
    return;
  }
  router.push({ path: route.path, query: { action: 'new' } });
}

function openDetail(id: string) {
  router.push({ path: route.path, query: { id } });
}

function openSourceDoc(record: Record<string, unknown>) {
  const sourceNo = String(record.sourceNo || '');
  const type = String(record.type || '');
  if (!sourceNo || sourceNo === '无来源') {
    toastText.value = `${type || '当前单据'}无来源单据`;
    return;
  }
  toastText.value = `${type}已关联来源单据 ${sourceNo}`;
}

function goList() {
  router.push({ path: route.path });
}

const field = (label: string, value: unknown): DetailFieldItem => ({ label, value: String(value ?? '-') });

const personPickerDepts: PersonPickerDept[] = [
  {
    key: 'warehouse',
    label: '仓储部',
    persons: [
      { id: 'p_wh_001', name: '王仓', role: '仓库主管', dept: '仓储部' },
      { id: 'p_wh_002', name: '李库', role: '库管员', dept: '仓储部' },
      { id: 'p_wh_003', name: '陈仓', role: '调拨员', dept: '仓储部' },
    ],
  },
  {
    key: 'quality',
    label: '质检部',
    persons: [
      { id: 'p_qc_001', name: '陈质检', role: 'OQC检验员', dept: '质检部' },
      { id: 'p_qc_002', name: '王质检', role: '质量主管', dept: '质检部' },
    ],
  },
];

const warehouseProductPickerColumns = [
  { key: 'code', title: '物品编码', width: 140 },
  { key: 'name', title: '物品名称', width: 140 },
  { key: 'model', title: '规格型号', width: 110 },
  { key: 'type', title: '类型', width: 90 },
  { key: 'unit', title: '单位', width: 80 },
  { key: 'batch', title: '批次', width: 120 },
  { key: 'location', title: '库位', width: 130 },
  { key: 'available', title: '可用量', width: 90 },
];
const warehouseProductPickerRows: PickerRow[] = warehouseProducts.map((item) => ({ ...item }));
const warehouseProductPickerCategories: OptionPickerCategory[] = [
  { key: 'all', label: '全部物品', icon: 'line-folder', count: warehouseProductPickerRows.length },
  ...Array.from(new Set(warehouseProducts.map((item) => item.type))).map((type) => ({
    key: type,
    label: type,
    icon: 'line-doc',
  })),
];

const inventoryCountModeCards: InventoryCountModeCard[] = [
  { key: 'whole', title: '整仓盘点', desc: '盘点所有库区、库位的全部库存', icon: 'line-warehouse' },
  { key: 'area', title: '库区盘点', desc: '选定一个或多个库区进行盘点', icon: 'line-folder' },
  { key: 'location', title: '库位盘点', desc: '精确到指定库位进行盘点', icon: 'line-location' },
  { key: 'sku', title: '商品盘点', desc: '按商品SKU跨库位追踪盘点', icon: 'line-box' },
];

const sourcePickerCategories: SourcePickerCategory[] = Array.from(
  new Map(warehouseSources.map((item) => [item.type, { key: item.type, label: item.type, icon: 'line-doc' }])).values(),
);

const sourcePickerRows: SourcePickerRow[] = warehouseSources.map((item) => ({
  cat: item.type,
  code: item.code,
  subject: item.title,
  date: item.date,
  customer: item.object,
  maxQty: item.lines.length,
}));

const sourcePickerBatches: Record<string, SourcePickerBatch[]> = Object.fromEntries(
  warehouseSources.map((item) => [
    item.code,
    item.lines.map((line, index) => ({
      deliveryNo: String(line.sourceDoc || item.code),
      detailNo: String(line.sourceLine || line.id || `${item.code}-${index + 1}`),
      deliveryDate: item.date,
      warehouse: String(line.location || item.object),
      logistics: item.type,
      qty: Number(line.actualQty || line.qty || line.shouldQty || 0),
      amount: String(line.amount || ''),
      status: String(line.status || line.qualityState || '待处理'),
    })),
  ]),
);

const warehouseAreaGroups: CategoryPickerGroup[] = [
  {
    key: 'warehouse-0545',
    label: '仓库0545',
    icon: 'line-folder',
    count: 3,
    children: [
      { key: 'warehouse-0545-a', label: 'A区', code: 'KW0000001', desc: '成品与半成品入库暂存区', count: 18 },
      { key: 'warehouse-0545-a01', label: 'A-01-01', code: 'KW0000002', desc: '手机成品上架库位', count: 7 },
      { key: 'warehouse-0545-b', label: 'B区', code: 'KW0000003', desc: '半成品周转区域', count: 12 },
    ],
  },
  {
    key: 'raw-material',
    label: '原料仓',
    icon: 'line-folder',
    count: 3,
    children: [
      { key: 'raw-material-a', label: '原料A区', code: 'KW0000011', desc: '常规原材料入库区', count: 26 },
      { key: 'raw-material-cold', label: '冷藏区', code: 'KW0000012', desc: '温控原材料存放区', count: 8 },
      { key: 'raw-material-waiting', label: '待上架区', code: 'KW0000013', desc: '来料暂存与待上架区域', count: 14 },
    ],
  },
  {
    key: 'quality-hold',
    label: '质检暂存仓',
    icon: 'line-folder',
    count: 3,
    children: [
      { key: 'quality-hold-iqc', label: 'IQC待检区', code: 'KW0000021', desc: '来料质检待检暂存', count: 9 },
      { key: 'quality-hold-concession', label: '让步接收区', code: 'KW0000022', desc: '让步接收入库暂存', count: 5 },
      { key: 'quality-hold-reject', label: '拒收隔离区', code: 'KW0000023', desc: '不合格物料隔离', count: 3 },
    ],
  },
];

const productLocationRows: Record<string, Array<Record<string, string | number>>> = {
  'CP-20250101001': [
    { warehouse: '仓库0545', area: 'A区', location: 'A-01-01', code: 'KW0000002', desc: '手机成品库位', stock: 6, available: 3, status: '可用' },
    { warehouse: '仓库0545', area: 'A区', location: 'A-01-02', code: 'KW0000004', desc: '手机成品库位', stock: 4, available: 2, status: '可用' },
    { warehouse: '二号仓库', area: 'B区', location: 'B-02-01', code: 'KW0000006', desc: '调拨暂存库位', stock: 5, available: 2, status: '待复核' },
  ],
  'CP-20250101002': [
    { warehouse: '二号仓库', area: 'B区', location: 'B-01-01', code: 'KW0000011', desc: '半成品周转库位', stock: 260, available: 230, status: '可用' },
    { warehouse: '仓库0545', area: 'B区', location: 'B-01-02', code: 'KW0000012', desc: '半成品备货库位', stock: 80, available: 60, status: '可用' },
  ],
  'YL-20250101003': [
    { warehouse: '原料仓', area: '冷藏区', location: 'L01-01', code: 'KW0000012', desc: '温控原材料库位', stock: 120, available: 90, status: '可用' },
    { warehouse: '原料仓', area: '原料A区', location: 'A-03-02', code: 'KW0000014', desc: '铝合金型材库位', stock: 140, available: 120, status: '可用' },
  ],
  '7820864': [
    { warehouse: '仓库0545', area: 'A区', location: 'A-01-01', code: 'KW0000002', desc: '物料库位', stock: 60, available: 60, status: '可用' },
    { warehouse: '二号仓库', area: 'B区', location: 'B-01-03', code: 'KW0000015', desc: '物料备货库位', stock: 30, available: 24, status: '可用' },
  ],
};

interface CountScopeStockRow {
  id: string;
  warehouse: string;
  area: string;
  location: string;
  locationCode: string;
  productCode: string;
  productName: string;
  model: string;
  type: string;
  unit: string;
  stock: string | number;
  available: string | number;
  qualityState: string;
}

const countScopeStockRows: CountScopeStockRow[] = warehouseProducts.flatMap((product) => {
  const rows = productLocationRows[product.code] || [
    {
      warehouse: '仓库0545',
      area: String(product.location).split('-')[0] || '默认区域',
      location: product.location,
      code: '',
      stock: product.available,
      available: product.available,
      status: product.qualityState,
    },
  ];
  return rows.map((row, index) => ({
    id: `${product.code}-${row.warehouse}-${row.area}-${row.location}-${index}`,
    warehouse: String(row.warehouse),
    area: String(row.area),
    location: String(row.location),
    locationCode: String(row.code || ''),
    productCode: product.code,
    productName: product.name,
    model: product.model,
    type: product.type,
    unit: product.unit,
    stock: row.stock ?? product.available,
    available: row.available ?? product.available,
    qualityState: product.qualityState,
  }));
});

function countScopeRows(warehouse: string, area = '') {
  return countScopeStockRows.filter((row) => row.warehouse === warehouse && (!area || row.area === area));
}

function countScopeAreaNames(warehouse: string) {
  return Array.from(new Set(countScopeStockRows.filter((row) => row.warehouse === warehouse).map((row) => row.area)));
}

function countScopeWarehouseNames() {
  return Array.from(new Set(countScopeStockRows.map((row) => row.warehouse)));
}

function createCountAreaGroups(): CategoryPickerGroup[] {
  return countScopeWarehouseNames().map((warehouse) => {
    const areas = countScopeAreaNames(warehouse);
    return {
      key: `count-area-${warehouse}`,
      label: warehouse,
      icon: 'line-folder',
      count: areas.length,
      children: areas.map((area) => ({
        key: `count-area-${warehouse}-${area}`,
        label: area,
        code: `AREA-${area}`,
        desc: `${warehouse} / ${area}`,
        count: countScopeRows(warehouse, area).length,
      })),
    };
  });
}

function createCountLocationGroups(): CategoryPickerGroup[] {
  return countScopeWarehouseNames().map((warehouse) => {
    const areas = countScopeAreaNames(warehouse);
    const children = areas.map((area) => {
      const locations = Array.from(new Map(countScopeRows(warehouse, area).map((row) => [row.location, row])).values());
      return {
        key: `count-location-${warehouse}-${area}`,
        label: area,
        code: `AREA-${area}`,
        desc: `${warehouse} / ${area}`,
        count: locations.length,
        children: locations.map((row) => ({
          key: `count-location-${warehouse}-${area}-${row.location}`,
          label: row.location,
          code: row.locationCode || row.location,
          desc: `${row.productName} 等库存物品`,
          stock: countScopeRows(warehouse, area).filter((item) => item.location === row.location).reduce((sum, item) => sum + Number(item.stock || 0), 0),
          available: countScopeRows(warehouse, area).filter((item) => item.location === row.location).reduce((sum, item) => sum + Number(item.available || 0), 0),
          status: '可盘点',
        })),
      };
    });
    return {
      key: `count-location-${warehouse}`,
      label: warehouse,
      icon: 'line-folder',
      count: children.reduce((sum, area) => sum + Number(area.count || 0), 0),
      children,
    };
  });
}

function formatCountScope(payload: CountScopePayload) {
  if (payload.level === '商品') return `商品盘点 / ${payload.productName || payload.productCode || '-'}`;
  if (payload.level === '库位') return `${payload.warehouse} / ${payload.area || '-'} / ${payload.location || '-'} / 库位锁定`;
  if (payload.level === '库位物品') {
    return `${payload.warehouse} / ${payload.area || '-'} / ${payload.location || '-'} / ${payload.productName || payload.productCode || '-'}`;
  }
  if (payload.level === '区域') return `${payload.warehouse} / ${payload.area || '-'} / 区域锁定`;
  return `${payload.warehouse} / 整仓锁定`;
}

function createCountDetailRows(payload: CountScopePayload): AnyRow[] {
  const matchedRows = countScopeStockRows.filter((row) => {
    if (payload.level === '商品') return row.productCode === payload.productCode;
    if (payload.level === '库位') return row.warehouse === payload.warehouse && row.area === payload.area && row.location === payload.location;
    if (payload.level === '区域') return row.warehouse === payload.warehouse && row.area === payload.area;
    return row.warehouse === payload.warehouse;
  });

  return matchedRows.map((row, index) => {
    const product = warehouseProducts.find((item) => item.code === row.productCode);
    const bookQty = Number(row.stock || row.available || 0);
    return {
      id: `count_scope_${row.id}_${index}`,
      sourceLine: formatCountScope(payload),
      warehouse: row.warehouse,
      area: row.area,
      itemCode: row.productCode,
      code: row.productCode,
      itemName: row.productName,
      name: row.productName,
      model: row.model,
      type: row.type,
      unit: row.unit,
      batch: product?.batch || '',
      location: row.location,
      locationCode: row.locationCode,
      qualityState: row.qualityState,
      costLayer: product?.costLayer || '',
      bookQty,
      realQty: '',
      diffQty: '',
      countResult: '',
      reason: '',
      dispose: '',
      qty: bookQty,
      unitCost: product?.unitCost || '',
      amount: 0,
      remark: '',
    };
  });
}

const CountWarehousePickerModal = defineComponent({
  name: 'CountWarehousePickerModal',
  props: {
    open: { type: Boolean, required: true },
  },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const picked = ref('');
    const rows = computed(() => countScopeWarehouseNames().map((warehouse) => ({
      warehouse,
      areaCount: countScopeAreaNames(warehouse).length,
      locationCount: new Set(countScopeRows(warehouse).map((row) => `${row.area}-${row.location}`)).size,
      itemCount: countScopeRows(warehouse).length,
      stock: countScopeRows(warehouse).reduce((sum, row) => sum + Number(row.stock || 0), 0),
      available: countScopeRows(warehouse).reduce((sum, row) => sum + Number(row.available || 0), 0),
    })));

    watch(
      () => props.open,
      (open) => {
        if (!open) return;
        picked.value = rows.value[0]?.warehouse || '';
      },
      { immediate: true },
    );

    function confirm() {
      if (!picked.value) return;
      const row = rows.value.find((item) => item.warehouse === picked.value);
      emit('confirm', {
        level: '仓库',
        warehouse: picked.value,
        itemCount: row?.itemCount || 0,
      } as CountScopePayload);
    }

    return () => props.open ? h('div', { class: 'aw-mask', onClick: () => emit('cancel') }, [
      h('div', { class: 'aw-modal lg warehouse-count-warehouse-modal', onClick: (event: Event) => event.stopPropagation() }, [
        h('div', { class: 'head' }, [
          h('span', '选择盘点仓库'),
          h('button', { class: 'aw-modal-close', type: 'button', onClick: () => emit('cancel') }, '×'),
        ]),
        h('div', { class: 'body warehouse-count-warehouse-body' }, [
          h('table', { class: 'aw-table' }, [
            h('thead', null, h('tr', null, [
              h('th', { style: 'width:56px' }, '选择'),
              h('th', '仓库'),
              h('th', '库区数'),
              h('th', '库位数'),
              h('th', '库存明细'),
              h('th', '库存'),
              h('th', '可用量'),
            ])),
            h('tbody', null, rows.value.map((row) => h('tr', {
              key: row.warehouse,
              class: 'warehouse-count-scope-click-row',
              onClick: () => { picked.value = row.warehouse; },
            }, [
              h('td', null, h('span', { class: ['aw-radio', { on: picked.value === row.warehouse }] }, h('span', { class: 'aw-dot' }))),
              h('td', { class: 'aw-link' }, row.warehouse),
              h('td', row.areaCount),
              h('td', row.locationCount),
              h('td', row.itemCount),
              h('td', row.stock),
              h('td', row.available),
            ]))),
          ]),
        ]),
        h('div', { class: 'aw-modal-foot warehouse-count-scope-foot' }, [
          h('button', { class: 'aw-btn', type: 'button', onClick: () => emit('cancel') }, '取消'),
          h('button', { class: 'aw-btn primary', type: 'button', disabled: !picked.value, onClick: confirm }, '确认'),
        ]),
      ]),
    ]) : null;
  },
});

function createProductLocationGroups(row: AnyRow | null): CategoryPickerGroup[] {
  const productCode = String(row?.itemCode || row?.code || '');
  const fallbackProduct = warehouseProducts.find((item) => item.code === productCode);
  const fallbackLocation = String(row?.location || fallbackProduct?.location || 'A-01-01');
  const records = productLocationRows[productCode] || [
    { warehouse: '仓库0545', area: 'A区', location: fallbackLocation, code: 'KW0000002', desc: '当前物品默认库位', stock: row?.available || fallbackProduct?.available || 0, available: row?.available || fallbackProduct?.available || 0, status: '可用' },
  ];
  const warehouseMap = new Map<string, CategoryPickerGroup>();
  records.forEach((record, index) => {
    const warehouse = String(record.warehouse);
    const area = String(record.area);
    const warehouseKey = `product-${productCode || 'row'}-${warehouse}`;
    const areaKey = `${warehouseKey}-${area}`;
    if (!warehouseMap.has(warehouse)) {
      warehouseMap.set(warehouse, { key: warehouseKey, label: warehouse, icon: 'line-folder', count: 0, children: [] });
    }
    const group = warehouseMap.get(warehouse) as CategoryPickerGroup;
    let areaNode = group.children.find((child) => child.key === areaKey);
    if (!areaNode) {
      areaNode = { key: areaKey, label: area, code: areaKey, desc: '仓库区域', count: 0, children: [] };
      group.children.push(areaNode);
    }
    areaNode.children = [
      ...(areaNode.children || []),
      {
        key: `${areaKey}-${record.location}-${index}`,
        label: String(record.location),
        code: String(record.code || ''),
        desc: String(record.desc || ''),
        stock: record.stock,
        available: record.available,
        status: String(record.status || ''),
      },
    ];
    areaNode.count = (areaNode.children || []).length;
    group.count = (group.children || []).reduce((total, child) => total + Number(child.count || 0), 0);
  });
  return Array.from(warehouseMap.values());
}

const CountScopePickerModal = defineComponent({
  name: 'CountScopePickerModal',
  props: {
    open: { type: Boolean, required: true },
    value: { type: String, default: '' },
  },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const warehouseNames = countScopeWarehouseNames();
    const activeWarehouse = ref(warehouseNames[0] || '');
    const activeArea = ref('');
    const selectedLevel = ref<CountScopeLevel>('仓库');
    const selectedLineId = ref('');
    const visibleRows = computed(() => countScopeRows(activeWarehouse.value, activeArea.value));
    const selectedLine = computed(() => countScopeStockRows.find((row) => row.id === selectedLineId.value));

    function resetSelection() {
      activeWarehouse.value = warehouseNames[0] || '';
      activeArea.value = '';
      selectedLevel.value = '仓库';
      selectedLineId.value = '';
    }

    watch(
      () => props.open,
      (open) => {
        if (open) resetSelection();
      },
      { immediate: true },
    );

    function pickWarehouse(name: string) {
      activeWarehouse.value = name;
      activeArea.value = '';
      selectedLevel.value = '仓库';
      selectedLineId.value = '';
    }

    function pickArea(name: string) {
      activeArea.value = name;
      selectedLevel.value = '区域';
      selectedLineId.value = '';
    }

    function pickLine(row: CountScopeStockRow) {
      selectedLevel.value = '库位物品';
      activeWarehouse.value = row.warehouse;
      activeArea.value = row.area;
      selectedLineId.value = row.id;
    }

    function confirm() {
      if (selectedLevel.value === '库位物品' && selectedLine.value) {
        emit('confirm', {
          level: selectedLevel.value,
          warehouse: selectedLine.value.warehouse,
          area: selectedLine.value.area,
          location: selectedLine.value.location,
          productName: selectedLine.value.productName,
          productCode: selectedLine.value.productCode,
        } as CountScopePayload);
        return;
      }
      emit('confirm', {
        level: selectedLevel.value,
        warehouse: activeWarehouse.value,
        area: selectedLevel.value === '区域' ? activeArea.value : '',
      } as CountScopePayload);
    }

    function previewPayload(): CountScopePayload {
      if (selectedLevel.value === '库位物品' && selectedLine.value) {
        return {
          level: '库位物品',
          warehouse: selectedLine.value.warehouse,
          area: selectedLine.value.area,
          location: selectedLine.value.location,
          productName: selectedLine.value.productName,
          productCode: selectedLine.value.productCode,
        };
      }
      return {
        level: selectedLevel.value,
        warehouse: activeWarehouse.value,
        area: selectedLevel.value === '区域' ? activeArea.value : '',
      };
    }

    return () => props.open ? h('div', { class: 'aw-mask', onClick: () => emit('cancel') }, [
      h('div', { class: 'aw-modal lg warehouse-count-scope-modal', onClick: (event: Event) => event.stopPropagation() }, [
        h('div', { class: 'head' }, [
          h('span', '选择盘点范围'),
          h('button', { class: 'aw-modal-close', type: 'button', onClick: () => emit('cancel') }, '×'),
        ]),
        h('div', { class: 'warehouse-count-scope-body' }, [
          h('aside', { class: 'aw-doc-tree warehouse-count-scope-side' }, warehouseNames.map((item) => [
            h('button', {
              key: `${item}-warehouse`,
              class: ['aw-tree-row', 'aw-tree-l2', { on: activeWarehouse.value === item && selectedLevel.value === '仓库' }],
              type: 'button',
              onClick: () => pickWarehouse(item),
            }, [
              h('span', { class: 'aw-line-icon line-folder' }),
              h('span', item),
              h('em', countScopeRows(item).length),
            ]),
            ...(activeWarehouse.value === item ? countScopeAreaNames(item).map((area) => h('button', {
              key: `${item}-${area}`,
              class: ['aw-tree-row', 'aw-tree-l3', { on: activeWarehouse.value === item && activeArea.value === area && selectedLevel.value !== '仓库' }],
              type: 'button',
              onClick: () => pickArea(area),
            }, [
              h('span', { class: 'aw-tree-branch' }),
              h('span', area),
              h('em', countScopeRows(item, area).length),
            ])) : []),
          ]).flat()),
          h('section', { class: 'warehouse-count-scope-main' }, [
            h('div', { class: 'warehouse-count-scope-current' }, [
              '当前范围：',
              h('span', { class: 'aw-link' }, selectedLevel.value),
              h('span', ' / '),
              h('span', { class: 'aw-link' }, activeWarehouse.value || '-'),
              activeArea.value ? h('span', ` / ${activeArea.value}`) : null,
            ]),
            h('table', { class: 'aw-table' }, [
              h('thead', null, h('tr', null, [
                h('th', { style: 'width:56px' }, '选择'),
                h('th', '物品编码'),
                h('th', '物品名称'),
                h('th', '规格型号'),
                h('th', '类型'),
                h('th', '单位'),
                h('th', '库位'),
                h('th', { style: 'width:78px' }, '库存'),
                h('th', { style: 'width:78px' }, '可用量'),
              ])),
              h('tbody', null, visibleRows.value.map((row) => h('tr', {
                key: row.id,
                class: 'warehouse-count-scope-click-row',
                onClick: () => pickLine(row),
              }, [
                h('td', null, h('span', { class: ['aw-radio', { on: selectedLevel.value === '库位物品' && selectedLineId.value === row.id }] }, h('span', { class: 'aw-dot' }))),
                h('td', { class: 'aw-num' }, row.productCode),
                h('td', { class: 'aw-link' }, row.productName),
                h('td', row.model),
                h('td', row.type),
                h('td', row.unit),
                h('td', row.location),
                h('td', row.stock),
                h('td', row.available),
              ]))),
            ]),
            h('div', { class: 'warehouse-count-scope-preview' }, [
              h('span', '已选范围'),
              h('strong', formatCountScope(previewPayload())),
            ]),
          ]),
        ]),
        h('div', { class: 'aw-modal-foot warehouse-count-scope-foot' }, [
          h('button', { class: 'aw-btn', type: 'button', onClick: () => emit('cancel') }, '取消'),
          h('button', { class: 'aw-btn primary', type: 'button', onClick: confirm }, '确认'),
        ]),
      ]),
    ]) : null;
  },
});

const WarehouseCreateView = defineComponent({
  name: 'WarehouseCreateView',
  props: {
    moduleKey: { type: String, required: true },
    actionMode: { type: String, default: 'new' },
  },
  emits: ['back'],
  setup(props, { emit }) {
    const rows = ref<AnyRow[]>(createInitialCreateRows(props.moduleKey as WarehouseModule));
    const showProductPicker = ref(false);
    const showSourcePicker = ref(false);
    const showPersonPicker = ref(false);
    const showWarehousePicker = ref(false);
    const countScopePickerMode = ref<InventoryCountMode | ''>('');
    const person = ref('');
    const warehouseLocation = ref('');
    const countScopeValue = ref('');
    const countMode = ref<InventoryCountMode>('whole');
    const transferDate = ref(currentDate());
    const countStartDate = ref(currentDate());
    const countEndDate = ref(currentDate());
    const transferFromWarehouse = ref('');
    const transferToWarehouse = ref('');
    const transferWarehouseTarget = ref<'from' | 'to' | ''>('');
    const warehousePickerLine = ref<AnyRow | null>(null);
    const warehousePickerLineField = ref<'location' | 'fromWh' | 'toWh'>('location');
    const source = ref<WarehouseSource | null>(null);
    const attachments = ref<AttachmentRow[]>([
      { id: 'warehouse-attach-1', name: '', type: '\u5165\u5e93\u9644\u4ef6', date: '', remark: '' },
    ]);
    const feedback = ref('');
    const module = computed(() => props.moduleKey as WarehouseModule);
    const title = computed(() => createTitle(module.value, props.actionMode));
    const actions = computed<FormAction[]>(() => [
      { key: 'cancel', label: '取消' },
      { key: 'save', label: '暂存' },
      { key: 'submit', label: createSubmitText(module.value), primary: true },
    ]);

    function addProducts(products: WarehouseProduct[]) {
      if (module.value === 'counts') {
        const countLines = products.flatMap((item) => createCountDetailRows({
          level: '商品',
          warehouse: '',
          productCode: item.code,
          productName: item.name,
        }));
        rows.value = [...rows.value, ...countLines];
        showProductPicker.value = false;
        return;
      }
      const next = products.map((item, index) => {
        if (['inbounds', 'outbounds', 'transfers'].includes(module.value)) {
          return createLineFromProduct(item, Date.now() + index, module.value);
        }
        if (isQualityModule(module.value)) {
          return createQualityLineFromProduct(item, Date.now() + index);
        }
        return {
          id: `${item.id}_${Date.now()}_${index}`,
          itemCode: item.code,
          itemName: item.name,
          model: item.model,
          type: item.type,
          unit: item.unit,
          batch: item.batch,
          location: item.location,
          qualityState: item.qualityState,
          costLayer: item.costLayer,
          available: item.available,
          qty: module.value === 'counts' ? item.available : 1,
          realQty: module.value === 'counts' ? item.available : undefined,
          unitCost: item.unitCost,
          amount: Number(item.unitCost),
          remark: '',
        };
      });
      rows.value = [...rows.value, ...next];
      showProductPicker.value = false;
    }

    function pickSource(payload: SourcePickerConfirmPayload) {
      const item = warehouseSources.find((sourceItem) => sourceItem.code === payload.code) || warehouseSources[0];
      const pickedDetailNos = new Set((payload.selectedBatches || []).map((batch) => batch.detailNo));
      const pickedLines = pickedDetailNos.size
        ? item.lines.filter((line) => pickedDetailNos.has(String(line.sourceLine || line.id)))
        : item.lines;
      source.value = { ...item, lines: pickedLines };
      rows.value = pickedLines.map((line) => ({ ...line, id: `${line.id}_${Date.now()}` }));
      showSourcePicker.value = false;
    }

    function currentDate() {
      return new Date().toISOString().slice(0, 10);
    }

    function addAttachment() {
      attachments.value = [
        ...attachments.value,
        { id: `warehouse-attach-${Date.now()}`, name: '', type: '\u5165\u5e93\u9644\u4ef6', date: currentDate(), remark: '' },
      ];
    }

    function uploadAttachment(row: AttachmentRow) {
      row.date = row.date || currentDate();
      feedback.value = `\u9644\u4ef6 ${row.name || 'attachment'} \u5df2\u6807\u8bb0\u4e0a\u4f20`;
    }

    function removeAttachment(row: AttachmentRow) {
      if (attachments.value.length > 1) {
        attachments.value = attachments.value.filter((item) => item.id !== row.id);
      }
    }

    async function handleAction(key: string) {
      if (key === 'cancel') {
        emit('back');
        return;
      }
      if (key === 'reset') {
        rows.value = [];
        source.value = null;
        person.value = '';
        warehouseLocation.value = '';
        countScopeValue.value = '';
        transferDate.value = currentDate();
        countStartDate.value = currentDate();
        countEndDate.value = currentDate();
        transferFromWarehouse.value = '';
        transferToWarehouse.value = '';
        transferWarehouseTarget.value = '';
        warehousePickerLine.value = null;
        warehousePickerLineField.value = 'location';
        countScopePickerMode.value = '';
        countMode.value = 'whole';
        attachments.value = [{ id: 'warehouse-attach-1', name: '', type: '\u5165\u5e93\u9644\u4ef6', date: '', remark: '' }];
        feedback.value = '表单已重置';
        return;
      }
      const countDates = module.value === 'counts' ? { startDate: countStartDate.value, expectedEndDate: countEndDate.value } : {};
      const res = key === 'submit'
        ? await createWarehouse(module.value, { title: title.value, source: source.value, person: person.value, warehouseLocation: warehouseLocation.value, countMode: countMode.value, countScope: countScopeValue.value, ...countDates, lines: rows.value, attachments: attachments.value })
        : await updateWarehouse(module.value, 'draft', { source: source.value, person: person.value, warehouseLocation: warehouseLocation.value, countMode: countMode.value, countScope: countScopeValue.value, ...countDates, lines: rows.value, attachments: attachments.value });
      feedback.value = key === 'submit' ? `提交成功：${String(res.id)}` : '暂存成功';
    }

    function pickWarehouse(payload: CategoryPickerConfirmPayload) {
      if (warehousePickerLine.value) {
        const pickedLocation = payload.area
          ? `${payload.parent.label} / ${payload.area.label} / ${payload.child.label}`
          : `${payload.parent.label} / ${payload.child.label}`;
        if (warehousePickerLineField.value === 'fromWh') {
          warehousePickerLine.value.fromWh = pickedLocation;
          warehousePickerLine.value.fromLocation = '';
        } else if (warehousePickerLineField.value === 'toWh') {
          warehousePickerLine.value.toWh = pickedLocation;
          warehousePickerLine.value.toLocation = '';
        } else {
          warehousePickerLine.value.location = pickedLocation;
        }
        rows.value = [...rows.value];
        warehousePickerLine.value = null;
        warehousePickerLineField.value = 'location';
      } else if (transferWarehouseTarget.value) {
        const pickedWarehouse = `${payload.parent.label} / ${payload.child.label}`;
        if (transferWarehouseTarget.value === 'from') transferFromWarehouse.value = pickedWarehouse;
        if (transferWarehouseTarget.value === 'to') transferToWarehouse.value = pickedWarehouse;
        transferWarehouseTarget.value = '';
      } else {
        const pickedLocation = `${payload.parent.label} / ${payload.child.label}`;
        warehouseLocation.value = pickedLocation;
      }
      showWarehousePicker.value = false;
    }

    function openCountScopeByMode(mode: InventoryCountMode) {
      countMode.value = mode;
      countScopePickerMode.value = mode;
    }

    function closeCountScopePicker() {
      countScopePickerMode.value = '';
    }

    function pickCountScope(payload: CountScopePayload) {
      countScopeValue.value = formatCountScope(payload);
      rows.value = createCountDetailRows(payload);
      closeCountScopePicker();
    }

    function pickCountArea(payload: CategoryPickerConfirmPayload) {
      pickCountScope({
        level: '区域',
        warehouse: payload.parent.label,
        area: payload.child.label,
        itemCount: payload.child.count || 0,
      });
    }

    function pickCountLocation(payload: CategoryPickerConfirmPayload) {
      pickCountScope({
        level: '库位',
        warehouse: payload.parent.label,
        area: payload.area?.label || '',
        location: payload.child.label,
        itemCount: Number(payload.child.stock || 0),
      });
    }

    function pickCountProduct(row: AnyRow) {
      pickCountScope({
        level: '商品',
        warehouse: '',
        productCode: String(row.code || ''),
        productName: String(row.name || ''),
      });
    }

    return () => h(AwFormPage, { backText: '返回列表', actions: actions.value, onBack: () => emit('back'), onAction: handleAction }, () => [
      whSection('基础信息', [
        h('div', { class: 'aw-form-grid' }, createBaseFields(module.value, props.actionMode, person.value, source.value, warehouseLocation.value, () => { showPersonPicker.value = true; }, () => { showSourcePicker.value = true; }, () => { warehousePickerLine.value = null; warehousePickerLineField.value = 'location'; transferWarehouseTarget.value = ''; showWarehousePicker.value = true; }, transferDate.value, (value) => { transferDate.value = value; }, transferFromWarehouse.value, transferToWarehouse.value, (target) => { warehousePickerLine.value = null; warehousePickerLineField.value = 'location'; transferWarehouseTarget.value = target; showWarehousePicker.value = true; }, countScopeValue.value, () => { countScopePickerMode.value = countMode.value; }, countStartDate.value, (value) => { countStartDate.value = value; }, countEndDate.value, (value) => { countEndDate.value = value; })),
        feedback.value ? h('div', { class: 'aw-form-note warehouse-note' }, feedback.value) : null,
        createStrategyNote(module.value, props.actionMode),
      ]),
      module.value === 'counts' ? whSection('盘点范围', renderInventoryCountModeCards(countMode.value, openCountScopeByMode)) : null,
      module.value !== 'locations' ? renderCreateLineSection(module.value, rows, () => { showProductPicker.value = true; }, (row, field = 'location') => { warehousePickerLine.value = row; warehousePickerLineField.value = field; transferWarehouseTarget.value = ''; showWarehousePicker.value = true; }) : null,
      module.value !== 'locations' ? whSection('\u9644\u4ef6', h(AwAttachmentTable, {
        rows: attachments.value,
        typeOptions: ['\u5165\u5e93\u9644\u4ef6', '\u8d28\u68c0\u9644\u4ef6', '\u4e0a\u67b6\u9644\u4ef6', '\u5ba1\u6279\u6750\u6599'],
        onAdd: addAttachment,
        onUpload: uploadAttachment,
        onRemove: removeAttachment,
      })) : null,
      whSection(createRemarkTitle(module.value), h(AwRichTextEditor, { placeholder: createRemarkPlaceholder(module.value) })),
      showSourcePicker.value ? h(AwSourcePickerModal, {
        open: true,
        title: sourceTitle(module.value),
        categories: sourcePickerCategories,
        rows: sourcePickerRows,
        batches: sourcePickerBatches,
        onCancel: () => { showSourcePicker.value = false; },
        onConfirm: pickSource,
      }) : null,
      showProductPicker.value ? h(AwOptionPickerModal, {
        open: true,
        title: '选择物品',
        columns: warehouseProductPickerColumns,
        rows: warehouseProductPickerRows,
        categories: warehouseProductPickerCategories,
        categoryKey: 'type',
        categoryTitle: '物品分类',
        searchPlaceholder: '搜索物品编码、名称、规格型号',
        onCancel: () => { showProductPicker.value = false; },
        onConfirm: (row: AnyRow) => addProducts([row as WarehouseProduct]),
      }) : null,
      showWarehousePicker.value ? h(AwCategoryPickerModal, {
        open: true,
        title: warehousePickerLine.value ? warehousePickerLineField.value === 'fromWh' ? '选择原仓库' : warehousePickerLineField.value === 'toWh' ? '选择目标仓库' : '选择库存库位' : transferWarehouseTarget.value === 'from' ? '选择原仓库' : transferWarehouseTarget.value === 'to' ? '选择目标仓库' : module.value === 'outbounds' ? '选择出库仓库' : '选择入库仓库',
        groups: warehousePickerLine.value ? createProductLocationGroups(warehousePickerLine.value) : warehouseAreaGroups,
        leafMode: Boolean(warehousePickerLine.value),
        currentParentLabel: '当前仓库：',
        childColumnTitle: '仓库区域',
        codeColumnTitle: '区域编码',
        descColumnTitle: '区域说明',
        countColumnTitle: '库位数',
        leafCurrentLabel: '当前仓库/区域：',
        leafColumnTitle: '库位',
        leafCodeColumnTitle: '库位编码',
        leafDescColumnTitle: '库位说明',
        leafStockColumnTitle: '库存',
        leafAvailableColumnTitle: '可用量',
        leafStatusColumnTitle: '状态',
        emptyText: warehousePickerLine.value ? '当前物品暂无可选库位' : '当前仓库暂无可选区域',
        onCancel: () => { warehousePickerLine.value = null; warehousePickerLineField.value = 'location'; transferWarehouseTarget.value = ''; showWarehousePicker.value = false; },
        onConfirm: pickWarehouse,
      }) : null,
      countScopePickerMode.value === 'whole' ? h(CountWarehousePickerModal, {
        open: true,
        onCancel: closeCountScopePicker,
        onConfirm: pickCountScope,
      }) : null,
      countScopePickerMode.value === 'area' ? h(AwCategoryPickerModal, {
        open: true,
        title: '选择盘点库区',
        groups: createCountAreaGroups(),
        currentParentLabel: '当前仓库：',
        childColumnTitle: '库区',
        codeColumnTitle: '库区编码',
        descColumnTitle: '库区说明',
        countColumnTitle: '库存明细',
        emptyText: '当前仓库暂无可盘点库区',
        onCancel: closeCountScopePicker,
        onConfirm: pickCountArea,
      }) : null,
      countScopePickerMode.value === 'location' ? h(AwCategoryPickerModal, {
        open: true,
        title: '选择盘点库位',
        groups: createCountLocationGroups(),
        leafMode: true,
        leafCurrentLabel: '当前仓库/库区：',
        leafColumnTitle: '库位',
        leafCodeColumnTitle: '库位编码',
        leafDescColumnTitle: '库位说明',
        leafStockColumnTitle: '库存',
        leafAvailableColumnTitle: '可用量',
        leafStatusColumnTitle: '状态',
        emptyText: '当前库区暂无可盘点库位',
        onCancel: closeCountScopePicker,
        onConfirm: pickCountLocation,
      }) : null,
      countScopePickerMode.value === 'sku' ? h(AwOptionPickerModal, {
        open: true,
        title: '选择盘点商品',
        columns: warehouseProductPickerColumns,
        rows: warehouseProductPickerRows,
        categories: warehouseProductPickerCategories,
        categoryKey: 'type',
        categoryTitle: '产品分类',
        searchPlaceholder: '搜索商品SKU、名称、规格型号',
        onCancel: closeCountScopePicker,
        onConfirm: pickCountProduct,
      }) : null,
      showPersonPicker.value ? h(AwPersonPickerModal as any, {
        open: true,
        title: personPickerTitle(module.value),
        depts: personPickerDepts,
        picked: [],
        onCancel: () => { showPersonPicker.value = false; },
        onConfirm: (people: PersonPickerPerson[]) => {
          person.value = people.map((item) => item.name).join('、') || '王仓';
          showPersonPicker.value = false;
        },
      }) : null,
    ]);
  },
});

const WarehouseDetailView = defineComponent({
  name: 'WarehouseDetailView',
  props: {
    moduleKey: { type: String, required: true },
    id: { type: String, required: true },
  },
  emits: ['back'],
  setup(props, { emit }) {
    const detail = ref<WarehouseDetail | null>(null);
    const editing = ref(false);
    const activeTab = ref('');
    const feedback = ref('');
    const module = computed(() => props.moduleKey as WarehouseModule);
    const tabs = computed(() => detailTabs(module.value, detail.value));
    watch(() => [props.moduleKey, props.id], async () => {
      detail.value = await getWarehouseDetail(module.value, props.id);
      activeTab.value = detailTabs(module.value, detail.value)[0]?.key || '';
      editing.value = false;
    }, { immediate: true });
    const actions = computed<DetailAction[]>(() => detailActions(module.value, editing.value));

    async function doAction(key: string) {
      if (!detail.value) return;
      if (key === 'edit') {
        editing.value = true;
        feedback.value = '已进入编辑态';
      } else if (key === 'save') {
        await updateWarehouse(module.value, detail.value.id, detail.value);
        editing.value = false;
        feedback.value = '保存成功';
      } else if (key === 'approve') {
        await approveWarehouse(module.value, detail.value.id);
        feedback.value = '审批动作已提交';
      } else if (key === 'print') {
        await printWarehouse(module.value, detail.value.id);
        feedback.value = '打印任务已创建';
      } else if (key === 'export') {
        await exportWarehouse(module.value, detail.value.id);
        feedback.value = '导出任务已创建';
      }
    }

    return () => detail.value ? h(AwDetailPage, null, {
      toolbar: () => h(AwDetailToolbar, { backText: '返回列表', actions: actions.value, onBack: () => emit('back'), onAction: doAction }),
      header: () => h(AwDetailHeader, {
        title: detailTitle(module.value, detail.value!),
        code: String(detail.value!.code || detail.value!.ledgerNo || detail.value!.id),
        statusText: String(detail.value!.state || '进行中'),
        statusTone: String(detail.value!.tone || 'blue'),
        metas: detailMetas(module.value, detail.value!),
      }),
      default: () => [
        feedback.value ? h('div', { class: 'warehouse-feedback' }, feedback.value) : null,
        h('section', { class: 'aw-card' }, [
          h(AwDetailTabs, { modelValue: activeTab.value, tabs: tabs.value, 'onUpdate:modelValue': (key: string) => { activeTab.value = key; } }),
          renderDetailTab(module.value, detail.value!, activeTab.value, editing.value),
        ]),
      ],
    }) : h('div', { class: 'aw-card' }, '加载中...');
  },
});

function createTitle(module: WarehouseModule, action: string) {
  if (['直接入库', '直接出库', '新增调拨', '直接盘点', '新增仓库', '新增区域', '新增库位'].includes(action)) return action;
  return ({
    inbounds: '新增入库',
    outbounds: '新增出库',
    transfers: '新增调拨',
    counts: '直接盘点',
    outboundQuality: '新增出库质检',
    inboundQuality: '新增来料质检',
    locations: '新增仓库/区域/库位',
  } as Partial<Record<WarehouseModule, string>>)[module] || '新增';
}

function createSubmitText(module: WarehouseModule) {
  if (module === 'inbounds') return '确认入库';
  if (module === 'outbounds') return '确认出库';
  if (module === 'transfers') return '提交调拨';
  return module === 'counts' ? '确认盘点' : ['outboundQuality', 'inboundQuality'].includes(module) ? '提交质检' : '提交';
}

function createLineTitle(module: WarehouseModule) {
  if (['inbounds', 'outbounds', 'transfers'].includes(module)) return '物品明细';
  if (module === 'counts') return '盘点明细';
  if (module === 'outboundQuality' || module === 'inboundQuality') return '抽样与检验明细';
  if (module === 'locations') return '存放产品';
  return '来源与物品明细';
}

function createRemarkTitle(module: WarehouseModule) {
  if (module === 'inbounds') return '\u5165\u5e93\u8be6\u60c5';
  if (module === 'outbounds') return '\u51fa\u5e93\u8be6\u60c5';
  if (module === 'transfers') return '\u8c03\u62e8\u8be6\u60c5';
  if (module === 'counts') return '\u76d8\u70b9\u8be6\u60c5';
  return '\u8be6\u60c5';
}

function createRemarkPlaceholder(module: WarehouseModule) {
  if (module === 'locations') return '填写仓库、区域或库位详情';
  if (module === 'counts') return '填写盘点说明、范围依据、锁库策略、差异处理要求等信息';
  if (module === 'outboundQuality' || module === 'inboundQuality') return '请输入来源说明、抽样偏差、不良原因、处置建议、复检要求等';
  return '填写仓储业务备注、来源说明、库位策略和处理要求';
}

function createInitialCreateRows(module: WarehouseModule): AnyRow[] {
  if (module === 'locations') return [];
  if (module === 'transfers') return createTransferInitialRows();
  if (module === 'counts') return [];
  if (isQualityModule(module)) return warehouseProducts.slice(0, 1).map((item, index) => createQualityLineFromProduct(item, index));
  const baseProducts = warehouseProducts.slice(0, 1);
  return baseProducts.map((item, index) => createLineFromProduct(item, index, module));
}

function isQualityModule(module: WarehouseModule) {
  return module === 'outboundQuality' || module === 'inboundQuality';
}

function createQualityLineFromProduct(item: WarehouseProduct, index: number): AnyRow {
  return {
    id: `quality_${item.id}_${index}`,
    item: `${item.name}外观检验`,
    method: '目视检查',
    valueType: '判定',
    standard: '无明显缺陷',
    upper: '-',
    lower: '-',
    measured: '合格',
    defect: item.qualityState === '待检' ? 'MAJOR' : 'MINOR',
    result: item.qualityState === '待检' ? '待判定' : '合格',
    productCode: item.code,
    batch: item.batch,
    location: item.location,
  };
}

function createTransferInitialRows(): AnyRow[] {
  return [
    {
      id: 'transfer_form_001',
      sourceLine: 'DB-20251221001-01',
      code: '7820864',
      itemCode: '7820864',
      name: '半成品物料',
      itemName: '半成品物料',
      model: '规格一',
      type: '物料',
      unit: '公斤',
      batch: 'B20250601',
      qualityState: '合格',
      costLayer: 'LAYER-TR-01',
      currentQty: 620,
      availableQty: 560,
      frozenQty: 60,
      transferFrozenQty: 500,
      inTransitQty: 8,
      qty: 500,
      outQty: 500,
      inQty: 492,
      diffQty: 8,
      fromWh: '二号仓库',
      fromLocation: 'B区-B01-01',
      toWh: '仓库0545',
      toLocation: 'A区-A01-01',
      remark: '',
    },
    {
      id: 'transfer_form_002',
      sourceLine: 'DB-20251221001-02',
      code: '5786931',
      itemCode: '5786931',
      name: '半成品物料',
      itemName: '半成品物料',
      model: '规格一',
      type: '物料',
      unit: '公斤',
      batch: 'B20250602',
      qualityState: '合格',
      costLayer: 'LAYER-TR-02',
      currentQty: 360,
      availableQty: 320,
      frozenQty: 40,
      transferFrozenQty: 300,
      inTransitQty: 0,
      qty: 300,
      outQty: 300,
      inQty: 300,
      diffQty: 0,
      fromWh: '二号仓库',
      fromLocation: 'B区-B01-02',
      toWh: '仓库0545',
      toLocation: 'A区-A01-02',
      remark: '',
    },
  ];
}

function createLineFromProduct(item: WarehouseProduct, index: number, module: WarehouseModule): AnyRow {
  const qty = module === 'transfers' ? 20 : module === 'outbounds' ? 2 : 1;
  return {
    id: `${module}_${item.id}_${index}`,
    sourceDoc: module === 'inbounds' ? '手动入库' : module === 'outbounds' ? '手动出库' : '',
    sourceLine: '手动明细',
    itemCode: item.code,
    code: item.code,
    itemName: item.name,
    name: item.name,
    model: item.model,
    type: item.type,
    unit: item.unit,
    batch: item.batch,
    location: module === 'inbounds' || module === 'outbounds' ? '' : item.location,
    qualityState: item.qualityState,
    costLayer: item.costLayer,
    shouldQty: module === 'inbounds' ? qty : undefined,
    inspectionQty: module === 'inbounds' ? qty : undefined,
    qualifiedQty: module === 'inbounds' ? qty : undefined,
    concessionQty: 0,
    rejectedQty: 0,
    actualQty: qty,
    shelfQty: module === 'inbounds' ? 0 : undefined,
    qualityNo: module === 'inbounds' ? '待生成' : '',
    status: module === 'inbounds' ? '待送检' : module === 'outbounds' ? '无需OQC' : '',
    postStatus: '待过账',
    available: item.available,
    availableQty: Math.max(item.available - 60, 0),
    locked: 0,
    frozenQty: module === 'transfers' ? 60 : 0,
    qty,
    outQty: 0,
    inQty: 0,
    diffQty: 0,
    transferFrozenQty: 0,
    inTransitQty: 0,
    currentQty: item.available,
    fromWh: '二号仓库',
    fromLocation: item.location,
    toWh: '仓库0545',
    toLocation: 'A区-A01-01',
    unitCost: item.unitCost,
    amount: Number(item.unitCost) * qty,
    prodDate: '',
    expireDate: '',
    remark: '',
  };
}

function needsSource(module: WarehouseModule) {
  return ['inbounds', 'outbounds', 'transfers', 'outboundQuality', 'inboundQuality'].includes(module);
}

function createBaseFields(module: WarehouseModule, action: string, person: string, source: WarehouseSource | null, warehouseLocation: string, openPerson: () => void, openSource: () => void, openWarehouse: () => void, transferDate = '', updateTransferDate: (value: string) => void = () => undefined, transferFromWarehouse = '', transferToWarehouse = '', openTransferWarehouse: (target: 'from' | 'to') => void = () => undefined, countScopeValue = '', openCountScope: () => void = () => undefined, countStartDate = '', updateCountStartDate: (value: string) => void = () => undefined, countEndDate = '', updateCountEndDate: (value: string) => void = () => undefined) {
  if (module === 'inbounds') {
    const fields = [
      whField('入库主题', textInput('请输入入库主题'), true),
      whField('入库单号', textInput('自动生成', { disabled: true })),
      whField('入库类型', select(['直接入库', '采购入库', '生产入库', '销售退货入库', '委外入库'], '直接入库'), true),
      whField('入库部门', textInput('请选择入库部门')),
      whField('入库人员', pickerControl(person, '请选择入库人员', openPerson), true),
    ];
    if (action !== '直接入库') {
      fields.splice(3, 0, whField('关联单据', textInput('可手动填写关联单据')));
      fields.push(whField('经办人', textInput('自动带入当前用户', { disabled: true })));
    }
    return fields;
  }
  if (module === 'outbounds') {
    const fields = [
      whField('出库主题', textInput('请输入出库主题'), true),
      whField('出库单号', textInput('自动生成', { disabled: true })),
      whField('出库类型', select(['直接出库', '内部领用', '委外领料', '销售出库', '采购退货'], '直接出库'), true),
      whField('出库部门', textInput('请选择出库部门')),
      whField('出库人员', pickerControl(person, '请选择出库人员', openPerson), true),
    ];
    if (action !== '直接出库') {
      fields.splice(3, 0, whField('关联单据', textInput('可手动填写关联单据')));
      fields.push(whField('经办人', textInput('自动带入当前用户', { disabled: true })));
    }
    return fields;
  }
  if (module === 'transfers') {
    return [
      whField('调拨主题', textInput('填写调拨主题'), true),
      whField('调拨单号', textInput('自动生成', { disabled: true })),
      whField('调拨日期', textInput('', { type: 'date', value: transferDate, onInput: (event: Event) => updateTransferDate((event.target as HTMLInputElement).value) }), true),
      whField('调拨原因', select(['请选择调拨原因', '库存平衡', '生产补料', '订单调配', '库位优化'])),
    ];
  }
  if (module === 'locations') return createLocationBaseFields(action, person, openPerson);

  const base = [
    whField(module === 'stocks' ? '调整主题' : module === 'counts' ? '盘点主题' : module === 'outboundQuality' ? '出货检验主题' : module === 'inboundQuality' ? '来料检验主题' : module === 'locations' ? '名称' : '单据主题', textInput('填写主题')),
    whField('单据编号', textInput('自动生成', { disabled: true })),
    whField('经办人', pickerControl(person, '请选择人员', openPerson)),
  ];
  if (needsSource(module)) {
    base.push(whField('来源单据', pickerControl(source ? `${source.type} / ${source.code}` : '', '选择来源单据', openSource)));
  }
  if (module === 'stocks') base.push(whField('调整类型', select(['盘盈入库', '盘亏出库', '库存冻结', '库存释放'])));
  if (module === 'counts') {
    base.push(
      whField('开始日期', textInput('', { type: 'date', value: countStartDate, onInput: (event: Event) => updateCountStartDate((event.target as HTMLInputElement).value) }), true),
      whField('预计结束日期', textInput('', { type: 'date', value: countEndDate, onInput: (event: Event) => updateCountEndDate((event.target as HTMLInputElement).value) }), true),
      whField('是否锁库', select(['否', '是'])),
    );
  }
  if (module === 'outboundQuality') base.push(whField('OQC状态', select(['待出货检验', '客户验货中', '待放行审批', '已放行'])), whField('抽样规则', textInput('AQL 0.65 外观/包装抽样13台')));
  if (module === 'inboundQuality') base.push(whField('IQC状态', select(['待来料检验', '质检中', '让步接收', '拒收退回', '已放行'])), whField('抽样规则', textInput('AQL 1.0 来料抽样')));
  return base;
}

function locationCreateType(action: string) {
  if (action === '新增仓库') return '仓库';
  if (action === '新增区域') return '区域';
  return '库位';
}

function createLocationBaseFields(action: string, person: string, openPerson: () => void) {
  const type = locationCreateType(action);
  if (type === '仓库') {
    return [
      whField('仓库名称', textInput('请输入仓库名称'), true),
      whField('仓库编码', textInput('', { value: 'WH2024030001', disabled: true })),
      whField('仓库类型', select(['成品仓', '原料仓', '半成品仓', '质检暂存仓', '销售暂存仓'], '成品仓'), true),
      whField('仓库负责人', pickerControl(person, '请选择负责人', openPerson), true),
      whField('联系方式', textInput('请输入联系方式')),
      whField('仓库地址', textInput('请输入仓库地址'), true),
      whField('仓库容量(m³)', textInput('', { value: '1200' })),
      whField('温区', checkboxGroup(['常温', '冷藏', '冻品', '恒温'], ['常温']), true),
    ];
  }
  if (type === '区域') {
    return [
      whField('区域名称', textInput('填写区域名称'), true),
      whField('区域编码', textInput('', { value: 'LS2024030001', disabled: true })),
      whField('所属仓库', select(['仓库A', '仓库B', '仓库0545'], '仓库A'), true),
      whField('温区', select(['常温', '冷藏', '冻品', '恒温'], '常温')),
      whField('区域容量(m³)', textInput('', { value: '120' })),
      whField('计算存放体积', select(['开启', '关闭'], '开启')),
    ];
  }
  return [
    whField('库位名称', textInput('填写库位名称'), true),
    whField('库位编码', textInput('', { value: 'LS2024030001', disabled: true })),
    whField('所属仓库', select(['仓库A', '仓库B', '仓库0545'], '仓库A'), true),
    whField('所属区域', select(['A区（常温）', 'B区（常温）', '冷藏区（冷藏）', '成品区（常温）'], 'A区（常温）'), true),
    whField('库位容量(m³)', textInput('', { value: '120' })),
  ];
}

function whSection(title: string, children: any) {
  return h('section', { class: 'aw-form-card' }, [h('div', { class: 'aw-detail-section-title' }, title), ...(Array.isArray(children) ? children : [children])]);
}

function whField(label: string, control: any, required = false) {
  return h('div', { class: 'aw-field' }, [h('label', { class: required ? 'req' : '' }, label), control]);
}

function renderInventoryCountModeCards(selected: InventoryCountMode, onPick: (mode: InventoryCountMode) => void) {
  return h('div', { class: 'warehouse-count-mode-panel' }, [
    h('div', { class: 'warehouse-count-mode-grid' }, inventoryCountModeCards.map((item) => h('button', {
      key: item.key,
      type: 'button',
      class: ['warehouse-count-mode-card', { on: selected === item.key }],
      onClick: () => onPick(item.key),
    }, [
      h('span', { class: ['aw-line-icon', item.icon, 'warehouse-count-mode-icon'] }),
      h('span', { class: ['warehouse-count-mode-radio', { on: selected === item.key }] }),
      h('strong', item.title),
      h('span', { class: 'warehouse-count-mode-desc' }, item.desc),
    ]))),
  ]);
}

function textInput(placeholder: string, attrs: Record<string, unknown> = {}) {
  return h('input', { class: 'aw-input', placeholder, ...attrs });
}

function pickerControl(value: string, placeholder: string, onPick: () => void) {
  const triggerPick = (event: Event) => {
    event.stopPropagation();
    onPick();
  };
  return h('div', { class: 'aw-field-row' }, [
    h('input', { class: 'aw-input', value, readonly: true, placeholder, onPointerdown: triggerPick, onClick: triggerPick }),
    h('button', { class: 'aw-tool-btn', type: 'button', onPointerdown: triggerPick, onClick: triggerPick }, '选择'),
  ]);
}

function pickerControlClickOnly(value: string, placeholder: string, onPick: () => void) {
  const triggerPick = (event: Event) => {
    event.stopPropagation();
    onPick();
  };
  return h('div', { class: 'aw-field-row' }, [
    h('input', { class: 'aw-input', value, readonly: true, placeholder, onClick: triggerPick }),
    h('button', { class: 'aw-tool-btn', type: 'button', onClick: triggerPick }, '选择'),
  ]);
}

function select(options: string[], selected = '') {
  return h('select', { class: 'aw-select' }, options.map((item) => h('option', { key: item, value: item.startsWith('请选择') ? '' : item, selected: selected === item }, item)));
}

function checkboxGroup(options: string[], checked: string[] = []) {
  return h('div', { class: 'warehouse-check-options' }, options.map((item) => h('span', { key: item, class: 'warehouse-check-option' }, [
    h('input', { type: 'checkbox', checked: checked.includes(item) }),
    h('em', item),
  ])));
}

function radioGroup(options: string[], selected: string) {
  return h('div', { class: 'warehouse-check-options' }, options.map((item) => h('span', { key: item, class: 'warehouse-check-option' }, [
    h('input', { type: 'radio', name: `warehouse-radio-${selected}`, checked: selected === item }),
    h('em', item),
  ])));
}

function renderCreateLineSection(module: WarehouseModule, rows: { value: AnyRow[] }, openProductPicker: () => void, openWarehouseLocation: (row: AnyRow, field?: 'location' | 'fromWh' | 'toWh') => void = () => undefined) {
  if (['inbounds', 'outbounds', 'transfers'].includes(module)) {
    return h(AwLineDetailSection, {
      title: createLineTitle(module),
      addText: '+ 新增明细',
      wrapClass: 'warehouse-create-line-wrap',
      onAdd: openProductPicker,
    }, () => renderCreateLineTable(module, rows, openWarehouseLocation));
  }
  return whSection(createLineTitle(module), [
    h(AwEditableSubTable, { columns: editableColumns(module), rows: rows.value, addText: '添加明细', onAdd: openProductPicker }, {
      cell: ({ column, row }: { column: EditableColumn; row: AnyRow }) => renderEditableCell(module, column, row, rows),
      actions: ({ index }: { index: number }) => h('button', { class: 'aw-link-button danger', type: 'button', onClick: () => removeCreateRow(rows, index) }, '删除'),
    }),
    h('div', { class: 'aw-line-total' }, [h('span', '合计'), h('span', `共 ${rows.value.length} 行`), h('span', ['数量合计：', h('strong', String(sumQty(rows.value)))]), h('span', ['金额合计：', h('strong', sumAmount(rows.value))])]),
  ]);
}

function renderCreateLineTable(module: WarehouseModule, rows: { value: AnyRow[] }, openWarehouseLocation: (row: AnyRow, field?: 'location' | 'fromWh' | 'toWh') => void) {
  const columns = createLineColumns(module);
  const compact = module === 'inbounds' || module === 'outbounds';
  const columnStyle = (column: { width?: number } & Record<string, unknown>) => (column.width ? { width: String(column.width) + 'px' } : undefined);
  return h('table', { class: ['aw-doc-tbl warehouse-create-line-table', compact ? 'warehouse-create-line-table-compact' : ''] }, [
    h('thead', null, h('tr', null, [
      h('th', { style: compact ? 'width:38px' : undefined }, '\u5e8f\u53f7'),
      ...columns.map((column) => h('th', { key: column.key, style: columnStyle(column) }, column.title)),
      h('th', { style: compact ? 'width:44px' : 'width:70px' }, '\u64cd\u4f5c'),
    ])),
    h('tbody', null, rows.value.map((row, index) => h('tr', { key: row.id || index }, [
      h('td', null, index + 1),
      ...columns.map((column) => h('td', { key: column.key, style: columnStyle(column) }, renderCreateLineCell(module, row, column.key, rows, openWarehouseLocation))),
      h('td', null, h('button', { class: 'aw-link-button danger', type: 'button', onClick: () => removeCreateRow(rows, index) }, '\u5220\u9664')),
    ]))),
  ]);
}

function removeCreateRow(rows: { value: AnyRow[] }, index: number) {
  if (window.confirm('确认删除该明细？')) rows.value.splice(index, 1);
}

function createLineColumns(module: WarehouseModule) {
  if (module === 'inbounds') {
    return [
      { key: 'sourceDoc', title: '\u6765\u6e90\u5355\u636e', width: 58 },
      { key: 'sourceLine', title: '\u6765\u6e90\u660e\u7ec6', width: 58 },
      { key: 'itemCode', title: '\u7269\u54c1\u7f16\u7801', width: 92 },
      { key: 'itemName', title: '\u7269\u54c1\u540d\u79f0', width: 86 },
      { key: 'model', title: '\u89c4\u683c\u578b\u53f7', width: 62 },
      { key: 'unit', title: '\u5355\u4f4d', width: 36 },
      { key: 'actualQty', title: '\u5165\u5e93\u6570\u91cf', width: 58 },
      { key: 'location', title: '\u5165\u5e93\u5e93\u4f4d', width: 66 },
      { key: 'postStatus', title: '\u8fc7\u8d26\u72b6\u6001', width: 62 },
    ];
  }
  if (module === 'outbounds') {
    return [
      { key: 'sourceDoc', title: '来源单据', width: 58 },
      { key: 'sourceLine', title: '来源明细', width: 58 },
      { key: 'itemCode', title: '物品编码', width: 92 },
      { key: 'itemName', title: '物品名称', width: 86 },
      { key: 'model', title: '规格型号', width: 62 },
      { key: 'unit', title: '单位', width: 36 },
      { key: 'qty', title: '出库数量', width: 58 },
      { key: 'location', title: '出库库位', width: 66 },
      { key: 'postStatus', title: '过账状态', width: 62 },
    ];
  }
  return [
    { key: 'sourceLine', title: '来源明细' }, { key: 'code', title: '物品编码' }, { key: 'name', title: '物品名称' },
    { key: 'model', title: '规格型号' }, { key: 'type', title: '类型' }, { key: 'unit', title: '单位' },
    { key: 'batch', title: '批次' }, { key: 'qualityState', title: '质量状态' }, { key: 'costLayer', title: '成本层' },
    { key: 'currentQty', title: '当前库存' }, { key: 'availableQty', title: '可调拨量' }, { key: 'frozenQty', title: '原冻结量' },
    { key: 'transferFrozenQty', title: '调拨冻结' }, { key: 'inTransitQty', title: '在途数量' }, { key: 'qty', title: '申请调拨' },
    { key: 'outQty', title: '调出确认' }, { key: 'inQty', title: '调入确认' },
    { key: 'diffQty', title: '差异数量' }, { key: 'fromWh', title: '原仓库' },
    { key: 'toWh', title: '目标仓库' }, { key: 'remark', title: '备注' },
  ];
}

function renderCreateLineCell(module: WarehouseModule, row: AnyRow, key: string, rows: { value: AnyRow[] }, openWarehouseLocation?: (row: AnyRow, field?: 'location' | 'fromWh' | 'toWh') => void) {
  if (key === 'qualityState' && row[key]) {
    return h('span', { class: row[key] === '合格' ? 'aw-state aw-state-g' : 'aw-state aw-state-y' }, row[key]);
  }
  if ((module === 'inbounds' || module === 'outbounds') && key === 'location') {
    const openPicker = (event: Event) => {
      event.stopPropagation();
      openWarehouseLocation?.(row);
    };
    return h('input', {
      class: 'aw-input compact',
      value: row[key] ?? '',
      readonly: true,
      placeholder: '\u9009\u62e9\u4ed3\u5e93\u5e93\u4f4d',
      onPointerdown: openPicker,
      onMousedown: openPicker,
      onFocus: openPicker,
      onClick: openPicker,
    });
  }
  if (module === 'transfers' && (key === 'fromWh' || key === 'toWh')) {
    const openPicker = (event: Event) => {
      event.stopPropagation();
      openWarehouseLocation?.(row, key);
    };
    return h('input', {
      class: 'aw-input compact',
      value: row[key] ?? '',
      readonly: true,
      placeholder: '选择仓库库位',
      onPointerdown: openPicker,
      onMousedown: openPicker,
      onFocus: openPicker,
      onClick: openPicker,
    });
  }
  const editableKeys = module === 'transfers'
    ? new Set(['qty', 'remark'])
    : new Set(['batch', 'inspectionQty', 'qualifiedQty', 'concessionQty', 'rejectedQty', 'actualQty', 'shelfQty', 'location', 'status', 'qualityState', 'prodDate', 'qty', 'outQty', 'inQty', 'diffQty', 'fromWh', 'fromLocation', 'toWh', 'toLocation', 'remark', 'expireDate']);
  if (!editableKeys.has(key)) return row[key] ?? '-';
  return h('input', {
    class: 'aw-input compact',
    value: row[key] ?? '',
    onInput: (event: Event) => {
      row[key] = (event.target as HTMLInputElement).value;
      if (key === 'qty' || key === 'actualQty') {
        row.amount = Number(row.unitCost || 0) * Number(row[key] || 0);
      }
      rows.value = [...rows.value];
    },
  });
}

function createStrategyNote(module: WarehouseModule, action: string) {
  if (module === 'inbounds' && action === '直接入库') {
    return null;
  }
  if (module === 'transfers') {
    return h('div', { class: 'aw-form-note' }, '调拨提交后冻结可调拨量；调出确认转在途，调入确认后进入目标库位，差异进入调整审批。');
  }
  return null;
}

function editableColumns(module: WarehouseModule): EditableColumn[] {
  if (module === 'outboundQuality' || module === 'inboundQuality') {
    return [
      { key: 'item', title: '检验项目名称', width: 140 },
      { key: 'method', title: '检验方法', width: 120 },
      { key: 'valueType', title: '检验值类型', width: 100 },
      { key: 'standard', title: '标准值', width: 110 },
      { key: 'upper', title: '上限', width: 90 },
      { key: 'lower', title: '下限', width: 90 },
      { key: 'measured', title: '样本号/实测值', width: 130 },
      { key: 'defect', title: '缺陷等级', width: 100 },
      { key: 'result', title: '检验结论', width: 100 },
    ];
  }
  if (module === 'counts') {
    return [
      { key: 'warehouse', title: '仓库', width: 120 },
      { key: 'area', title: '库区', width: 100 },
      { key: 'location', title: '库位', width: 120 },
      { key: 'itemCode', title: '物品编码', width: 130 },
      { key: 'itemName', title: '物品名称', width: 140 },
      { key: 'model', title: '规格型号', width: 110 },
      { key: 'batch', title: '批次', width: 120 },
      { key: 'bookQty', title: '账面数量', width: 100 },
      { key: 'realQty', title: '实盘数量', width: 110 },
      { key: 'diffQty', title: '盈亏数量', width: 100 },
      { key: 'countResult', title: '盘点结果', width: 100 },
      { key: 'reason', title: '差异原因', width: 130 },
      { key: 'dispose', title: '处理方式', width: 130 },
    ];
  }
  return [
    { key: 'sourceLine', title: '来源明细', width: 150 },
    { key: 'itemCode', title: '物品编码', width: 130 },
    { key: 'itemName', title: '物品名称', width: 140 },
    { key: 'model', title: '规格型号', width: 110 },
    { key: 'unit', title: '单位', width: 80 },
    { key: 'batch', title: '批次', width: 120 },
    { key: 'location', title: '库位', width: 130 },
    { key: 'qualityState', title: '质量状态', width: 100 },
    { key: 'costLayer', title: '成本层', width: 150 },
    { key: 'qty', title: module === 'outbounds' ? '应出数量' : '入库数量', width: 100 },
    { key: 'unitCost', title: '单价', width: 100 },
    { key: 'amount', title: '合计', width: 110 },
  ];
}

function renderEditableCell(module: WarehouseModule, column: EditableColumn, row: AnyRow, rows: { value: AnyRow[] }) {
  if (module === 'counts' && column.key === 'countResult') {
    const result = countResultText(row);
    if (!result) return '-';
    return h('span', { class: ['aw-status', result === '盘盈' ? 'green' : result === '盘亏' ? 'red' : 'gray'] }, result);
  }
  if (['qty', 'realQty', 'measured', 'result', 'reason', 'dispose'].includes(column.key)) {
    return h('input', {
      class: 'aw-input compact',
      value: row[column.key] ?? '',
      onInput: (event: Event) => {
        row[column.key] = (event.target as HTMLInputElement).value;
        if (module === 'counts' && column.key === 'realQty') {
          const value = String(row.realQty ?? '').trim();
          if (value === '') {
            row.diffQty = '';
            row.countResult = '';
          } else {
            row.diffQty = Number(row.realQty || 0) - Number(row.bookQty || row.qty || 0);
            row.countResult = countResultText(row);
          }
        }
        if (column.key === 'qty') row.amount = Number(row.qty || 0) * Number(row.unitCost || 0);
        rows.value = [...rows.value];
      },
    });
  }
  return row[column.key] ?? '-';
}

function countResultText(row: AnyRow) {
  const value = String(row.realQty ?? '').trim();
  if (value === '') return '';
  const diff = Number(row.diffQty ?? Number(row.realQty || 0) - Number(row.bookQty || row.qty || 0));
  if (diff > 0) return '盘盈';
  if (diff < 0) return '盘亏';
  return '正常';
}

function sumQty(rows: AnyRow[]) {
  return rows.reduce((sum, row) => sum + Number(row.qty || row.actualQty || row.realQty || 0), 0);
}

function sumAmount(rows: AnyRow[]) {
  return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0).toFixed(2);
}

function sourceTitle(module: WarehouseModule) {
  if (module === 'inbounds') return '选择入库来源';
  if (module === 'outbounds') return '选择出库来源';
  if (module === 'transfers') return '选择调拨来源';
  if (module === 'inboundQuality') return '选择来料质检来源';
  return '选择质检来源';
}

function personPickerTitle(module: WarehouseModule) {
  if (module === 'inbounds') return '\u9009\u62e9\u5165\u5e93\u4eba';
  if (module === 'outbounds') return '\u9009\u62e9\u51fa\u5e93\u4eba';
  return '\u9009\u62e9\u7ecf\u529e\u4eba';
}

function locationDetailKind(row: WarehouseDetail) {
  const id = String(row.id || '');
  if (id.startsWith('warehouse_')) return 'warehouse';
  if (id.startsWith('area_')) return 'area';
  return 'location';
}

function detailTitle(module: WarehouseModule, row: WarehouseDetail) {
  if (module === 'stocks') return `${row.name} 库存详情`;
  if (module === 'locations') {
    const kind = locationDetailKind(row);
    const suffix = kind === 'warehouse' ? '仓库详情' : kind === 'area' ? '区域详情' : '库位详情';
    return `${row.name} ${suffix}`;
  }
  return String(row.subject || row.name || row.code);
}

function detailMetas(module: WarehouseModule, row: WarehouseDetail) {
  if (module === 'stocks') return [field('产品编号', row.code), field('默认仓库', row.wh), field('可用数量', row.available)];
  if (module === 'locations') {
    const kind = locationDetailKind(row);
    if (kind === 'warehouse') return [field('仓库编码', row.code), field('仓库负责人', row.manager), field('容量', row.capacity)];
    if (kind === 'area') return [field('所属仓库', row.warehouse), field('温区', row.temperature), field('库位数', row.locationCount)];
    return [field('所属仓库', row.warehouse), field('所属区域', row.area), field('容量', row.capacity)];
  }
  if (module === 'outboundQuality') return [field('来源单据', row.source), field('客户/产品', row.object), field('检验员', row.inspector)];
  if (module === 'inboundQuality') return [field('来源单据', row.source), field('供应商/产品', row.object), field('检验员', row.inspector)];
  return [field('类别', row.type || row.scope), field('数量', row.qty || row.lockQty), field('经办人', row.user || row.inspector)];
}

function detailActions(module: WarehouseModule, editing: boolean): DetailAction[] {
  if (editing) return [{ key: 'save', label: '保存' }, { key: 'export', label: '导出' }];
  const actions: DetailAction[] = [{ key: 'edit', label: '编辑' }];
  if (['inbounds', 'outbounds', 'transfers', 'counts', 'outboundQuality', 'inboundQuality'].includes(module)) actions.push({ key: 'approve', label: '审批/确认' });
  actions.push({ key: 'print', label: '打印' }, { key: 'export', label: '导出' });
  return actions;
}

function detailTabs(module: WarehouseModule, detail?: WarehouseDetail | null): DetailTabItem[] {
  const map: Record<WarehouseModule, string[]> = {
    stocks: ['产品信息', '物码明细', '追溯链路', '库存流水', '占用冻结', '出库记录', '入库记录'],
    inbounds: ['入库信息', '物品明细', '物码绑定明细', '附件', '操作记录'],
    outbounds: ['出库信息', '物品明细', '拣货复核', 'OQC记录', '附件', '操作记录'],
    transfers: ['调拨信息', '物品明细', '调出确认', '调入确认', '操作记录'],
    counts: ['盘点信息', '物品明细', '差异调整', '附件', '操作记录'],
    outboundQuality: ['质检信息', '来源记录', '抽样记录', '检验明细', '不良处置', '复检记录', '放行/拒收记录', '质检报告'],
    inboundQuality: ['质检信息', '来源记录', '抽样记录', '检验明细', '不良处置', '复检记录', '放行/拒收记录', '质检报告'],
    locations: ['库位信息', '存放产品', '操作记录'],
  };
  const labels = module === 'locations' && detail
    ? locationDetailTabs(detail)
    : map[module];
  return labels.map((label) => ({ key: label, label }));
}

function locationDetailTabs(detail: WarehouseDetail) {
  const kind = locationDetailKind(detail);
  if (kind === 'warehouse') return ['仓库信息', '关联区域', '操作记录'];
  if (kind === 'area') return ['区域信息', '包含库位', '操作记录'];
  return ['库位信息', '存放产品', '操作记录'];
}

function renderDetailTab(module: WarehouseModule, detail: WarehouseDetail, tab: string, editing: boolean) {
  if (tab.includes('信息') || tab === '产品信息' || tab === '库位信息') return h('div', null, [
    h(AwDetailInfoGrid, { items: detailFields(module, detail) }),
    editing ? h('div', { class: 'warehouse-edit-note' }, '编辑态：当前页面允许保存基础信息和明细 mock 更新。') : null,
  ]);
  if (tab === '附件' || tab === '质检报告') return renderAttachments(detail);
  if (tab === '操作记录') return renderSimpleTable(['操作时间', '操作人', '操作类型', '说明'], detail.records || []);
  if (tab === '库存流水') return renderSimpleTable(['来源单据', '来源明细', '业务类型', '方向', '批次', '库位', '质量状态', '成本层', '单位成本', '变动前', '变动数', '变动后', '状态'], detail.records || detail.lines || []);
  if (tab === '物码明细') return renderSimpleTable(['物品码', '父级/包装码', '码类型', '批次', '库位', '质量状态', '库存状态', '来源入库单', '最近业务', '绑定时间'], detail.lines || []);
  if (tab === '检验明细' || tab === '抽样记录') return renderSimpleTable(['检验项目名称', '检验方法', '检验值类型', '标准值', '上限', '下限', '样本号/实测值', '缺陷等级', '检验结论'], detail.lines || []);
  if (tab === '差异调整') return renderSimpleTable(['来源明细', '调整单号', '差异类型', '差异数量', '成本层', '处理方式', '审批状态', '过账结果', '库存释放'], detail.lines || []);
  if (tab === '追溯链路') return renderTraceTable();
  if (module === 'locations' && tab === '关联区域') return renderSimpleTable(['区域编号', '区域名称', '所属仓库', '温区', '容量', '库位数', '区域描述', '状态'], detail.lines || []);
  if (module === 'locations' && tab === '包含库位') return renderSimpleTable(['库位编号', '库位名称', '所属仓库', '所属区域', '库位描述', '容量', '负责人', '状态'], detail.lines || []);
  if (module === 'locations' && tab === '存放产品') return renderSimpleTable(['物品编码', '物品名称', '规格型号', '类型', '单位', '批次', '所属仓库', '所属区域', '库位', '质量状态', '成本层', '可用量'], detail.lines || []);
  if (module === 'inbounds' && tab === '物品明细') return renderSimpleTable(inboundItemHeaders(), inboundItemRows(detail.lines || []));
  if (module === 'outbounds' && tab === '物品明细') return renderSimpleTable(outboundItemHeaders(), outboundItemRows(detail.lines || []));
  return renderSimpleTable(lineHeaders(module, tab), detail.lines || []);
}

function detailFields(module: WarehouseModule, row: WarehouseDetail): DetailFieldItem[] {
  if (module === 'stocks') {
    return [
      field('产品名称', row.name), field('产品编号', row.code), field('产品型号', row.model),
      field('产品分类', row.cat), field('产品单位', row.unit), field('默认仓库', row.wh),
      field('台账编号', row.ledgerNo), field('来源单据', row.sourceDoc), field('来源明细', row.sourceLine),
      field('质量状态', row.qualityState), field('成本层编号', row.costLayer), field('成本状态', row.costStatus),
      field('账面库存', row.stock), field('冻结数量', row.frozen), field('占用数量', row.occupied), field('可用数量', row.available),
    ];
  }
  if (module === 'counts') {
    return [field('盘点主题', row.subject), field('盘点编号', row.code), field('盘点仓库', row.wh), field('盘点范围', row.scope), field('锁库范围', row.lockScope), field('锁库数量', row.lockQty), field('是否锁库', row.locked), field('盘点日期', row.date), field('盘点人', row.user), field('盘点状态', row.state)];
  }
  if (module === 'outboundQuality') {
    return [field('出货检验主题', row.subject), field('OQC单号', row.code), field('销售/出库单', row.source), field('客户/产品', row.object), field('批次/样本', row.qty), field('OQC状态', row.state), field('质检方案', row.plan), field('关键控制点', row.critical)];
  }
  if (module === 'inboundQuality') {
    return [field('来料检验主题', row.subject), field('IQC单号', row.code), field('采购/入库单', row.source), field('供应商/产品', row.object), field('批次/样本', row.qty), field('IQC状态', row.state), field('质检方案', row.plan), field('关键控制点', row.critical)];
  }
  if (module === 'locations') {
    const kind = locationDetailKind(row);
    if (kind === 'warehouse') {
      return [
        field('仓库名称', row.name), field('仓库编码', row.code), field('仓库类型', row.type),
        field('仓库负责人', row.manager), field('联系方式', row.phone), field('仓库地址', row.address),
        field('仓库容量(m³)', row.capacity), field('温区', row.temperature),
      ];
    }
    if (kind === 'area') {
      return [
        field('区域名称', row.name), field('区域编码', row.code), field('所属仓库', row.warehouse),
        field('温区', row.temperature), field('区域容量(m³)', row.capacity), field('计算存放体积', row.volumeMode),
        field('区域描述', row.desc),
      ];
    }
    return [
      field('库位名称', row.name), field('库位编码', row.code), field('所属仓库', row.warehouse),
      field('所属区域', row.area), field('库位容量(m³)', row.capacity), field('库位描述', row.desc),
    ];
  }
  const label = module === 'inbounds' ? '入库' : module === 'outbounds' ? '出库' : '调拨';
  return [
    field(`${label}主题`, row.subject), field(`${label}单号`, row.code), field(`${label}类别`, row.type),
    field(`${label}数量`, row.qty), field('申请日期', row.applyDate || row.date), field(`${label}人员`, row.user),
    field(`${label}日期`, row.date), field(`${label}状态`, row.state), field('来源对象', row.target || row.destination || `${row.fromWh} -> ${row.toWh}`),
  ];
}

function lineHeaders(module: WarehouseModule, tab: string) {
  if (module === 'transfers') return ['来源明细', '物品编码', '物品名称', '规格型号', '类型', '单位', '批次', '质量状态', '成本层', '当前库存', '可调拨量', '调拨冻结', '申请调拨', '调出确认', '调入确认', '差异数量', '原仓库', '目标仓库', '备注'];
  if (module === 'outbounds') return ['来源单据', '来源明细', '物品编码', '物品名称', '规格型号', '单位', '批次号', '质量状态', '成本层', '推荐库位', '可用量', '应出数量', '拣货数量', '复核数量', '发货数量', 'OQC单号', '放行状态', '过账状态', '单价', '合计', '备注'];
  if (module === 'inbounds') return ['来源单据', '来源明细', '物品编码', '物品名称', '规格型号', '单位', '批次号', '应入库数量', '送检数量', '合格数量', '让步数量', '不合格数量', '入库数量', '上架数量', '入库库位', '质检单号', '状态', '库存质量', '成本层', '过账状态', '单价', '合计', '备注'];
  if (module === 'locations') return ['库位编号', '库位名称', '仓库', '负责人', '状态'];
  return tab.includes('出库') ? ['出库单号', '出库订单主题', '出库日期', '出库类型', '出库总量', '经办人', '仓库'] : ['入库单号', '入库订单主题', '入库日期', '入库类型', '入库总量', '经办人', '仓库'];
}

function inboundItemHeaders() {
  return ['物品编码', '物品名称', '规格型号', '单位', '批次号', '应入库数量', '送检数量', '合格数量', '让步数量', '不合格数量', '入库数量', '上架数量', '入库库位', '质检单号', '状态', '库存质量', '成本层', '过账状态', '单价', '合计', '备注'];
}

function inboundItemRows(rows: WarehouseLine[]) {
  return rows.map((row) => ({
    id: row.id,
    物品编码: row.itemCode,
    物品名称: row.itemName,
    规格型号: row.model,
    单位: row.unit,
    批次号: row.batch,
    应入库数量: row.shouldQty,
    送检数量: row.inspectionQty,
    合格数量: row.qualifiedQty,
    让步数量: row.concessionQty,
    不合格数量: row.rejectedQty,
    入库数量: row.actualQty,
    上架数量: row.shelfQty,
    入库库位: row.location,
    质检单号: row.qualityNo,
    状态: row.status,
    库存质量: row.qualityState,
    成本层: row.costLayer,
    过账状态: row.postStatus,
    单价: row.unitCost,
    合计: row.amount,
    备注: row.remark,
  }));
}

function outboundItemHeaders() {
  return ['物品编码', '物品名称', '规格型号', '单位', '批次号', '质量状态', '成本层', '推荐库位', '可用量', '应出数量', '拣货数量', '复核数量', '发货数量', 'OQC单号', '放行状态', '过账状态', '单价', '合计', '备注'];
}

function outboundItemRows(rows: WarehouseLine[]) {
  return rows.map((row) => ({
    id: row.id,
    物品编码: row.itemCode,
    物品名称: row.itemName,
    规格型号: row.model,
    单位: row.unit,
    批次号: row.batch,
    质量状态: row.qualityState,
    成本层: row.costLayer,
    推荐库位: row.location,
    可用量: row.available ?? row.actualQty ?? row.shouldQty,
    应出数量: row.shouldQty,
    拣货数量: row.pickedQty ?? row.actualQty,
    复核数量: row.reviewQty ?? row.qualifiedQty,
    发货数量: row.shippedQty ?? row.actualQty,
    OQC单号: row.qualityNo,
    放行状态: row.releaseState ?? row.status,
    过账状态: row.postStatus ?? row.status,
    单价: row.unitCost,
    合计: row.amount,
    备注: row.remark,
  }));
}

function renderSimpleTable(headers: string[], rows: AnyRow[]) {
  return h('table', { class: 'aw-table warehouse-detail-table' }, [
    h('thead', null, h('tr', null, [h('th', null, '序号'), ...headers.map((label) => h('th', { key: label }, label))])),
    h('tbody', null, normalizedRows(headers, rows).map((row, index) => h('tr', { key: row.id || index }, [
      h('td', null, index + 1),
      ...headers.map((label) => h('td', { key: label }, row[label] ?? '-')),
    ]))),
  ]);
}

function normalizedRows(headers: string[], rows: AnyRow[]) {
  if (!rows.length) return [{ id: 'empty' }];
  const keys = Object.keys(rows[0]).filter((key) => key !== 'id');
  return rows.map((row) => Object.fromEntries(headers.map((label, index) => [label, row[keys[index]] ?? row[label] ?? '-'])));
}

function renderTraceTable() {
  return renderSimpleTable(['时间', '环节', '单据', '码动作', '库位/对象', '结果'], [
    { id: 'trace_001', time: '2026-05-21 09:30', step: '入库', doc: 'RK-20251221001', action: '生成 15 个主码，绑定 2 个箱码', location: 'A区-A01-01', result: '完成' },
    { id: 'trace_002', time: '2026-05-21 10:10', step: '质检', doc: 'IQC-20251221008', action: '抽样码冻结', location: '质检暂存仓', result: '待复检' },
  ]);
}

function renderAttachments(detail: WarehouseDetail) {
  return h('div', { class: 'warehouse-attachments' }, (detail.attachments || []).map((item) => h('div', { class: 'warehouse-attachment', key: item.name }, [
    h('strong', null, item.name),
    h('span', null, `文件大小：${item.size}`),
    h('div', null, [h('span', { class: 'aw-link' }, '查看'), h('span', { class: 'aw-link' }, '下载')]),
  ])));
}
</script>

<style scoped>
.warehouse-thumb {
  display: inline-block;
  width: 44px;
  height: 30px;
  border-radius: 6px;
  background: #1f2937;
  box-shadow: inset 0 0 0 1px #4b5563;
}

.warehouse-toast,
.warehouse-feedback {
  margin-bottom: 10px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 9px 12px;
  font-size: 13px;
}

.warehouse-toast {
  position: fixed;
  right: 28px;
  top: 76px;
  z-index: 80;
  box-shadow: 0 8px 24px rgb(16 24 40 / 12%);
}

.warehouse-filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.warehouse-filter-empty {
  border: 1px dashed var(--aw-border-strong);
  border-radius: 6px;
  padding: 16px;
  color: var(--aw-fg-3);
  font-size: 13px;
}

.warehouse-column-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.warehouse-column-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  padding: 7px 10px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.warehouse-column-item input {
  width: 14px;
  height: 14px;
}

.warehouse-column-item span {
  min-width: 0;
  flex: 1;
}

.warehouse-column-item em {
  font-style: normal;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.warehouse-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px 22px;
}

:global(.aw-form-page),
:global(.aw-form-card) {
  min-width: 0;
}

:global(.aw-form-card) {
  overflow: visible;
}

:global(.warehouse-create-line-table) {
  width: max-content;
  min-width: 2100px;
}

:global(.warehouse-create-line-table-compact) {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

:global(.warehouse-create-line-table-compact th),
:global(.warehouse-create-line-table-compact td) {
  padding: 0 4px;
  font-size: 12px;
  max-width: none;
}

:global(.warehouse-create-line-table-compact .aw-input.compact) {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 0 6px;
}

:global(.warehouse-create-line-wrap) {
  min-height: auto;
}

:global(.warehouse-create-line-wrap .aw-doc-tbl-inner) {
  max-height: none;
  overflow: auto;
}

.warehouse-total {
  margin-top: 10px;
  color: var(--aw-fg-3);
  font-size: 13px;
}

:global(.warehouse-count-mode-panel) {
  width: 100%;
}

:global(.warehouse-count-mode-grid) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

:global(.warehouse-count-mode-card) {
  position: relative;
  min-height: 118px;
  border: 1px solid var(--aw-border);
  border-radius: 7px;
  background: #fff;
  padding: 14px;
  text-align: left;
  color: var(--aw-fg-2);
  display: flex;
  flex-direction: column;
  gap: 8px;
  appearance: none;
  cursor: pointer;
}

:global(.warehouse-count-mode-card.on) {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px var(--aw-primary-soft);
}

:global(.warehouse-count-mode-icon) {
  width: 22px;
  height: 22px;
  color: var(--aw-fg-2);
  font-size: 20px;
}

:global(.warehouse-count-mode-radio) {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 14px;
  height: 14px;
  border: 1px solid var(--aw-border-strong);
  border-radius: 999px;
  background: #fff;
}

:global(.warehouse-count-mode-radio.on) {
  border-color: var(--aw-primary);
  box-shadow: inset 0 0 0 3px #fff;
  background: var(--aw-primary);
}

:global(.warehouse-count-mode-card strong) {
  color: var(--aw-fg-1);
  font-size: 15px;
}

:global(.warehouse-count-mode-desc) {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.6;
}

:global(.warehouse-count-scope-modal) {
  width: min(980px, calc(100vw - 48px));
}

.warehouse-count-scope-body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 390px;
  max-height: min(560px, calc(100vh - 170px));
  padding: 0;
}

.warehouse-count-scope-side {
  border-right: 1px solid var(--aw-divider);
  background: var(--aw-surface-2);
  padding: 12px;
  overflow: auto;
}

.warehouse-count-scope-side .aw-tree-row {
  width: 100%;
}

.warehouse-count-scope-side .aw-tree-l3 {
  padding-left: 28px;
}

.warehouse-count-scope-side em {
  color: var(--aw-fg-3);
  font-style: normal;
  margin-left: auto;
}

.warehouse-count-scope-main {
  min-width: 0;
  overflow: auto;
  padding: 16px;
}

.warehouse-count-scope-current {
  margin-bottom: 12px;
}

.warehouse-count-scope-click-row {
  cursor: pointer;
}

.warehouse-count-scope-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  padding: 9px 12px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.warehouse-count-scope-preview span {
  color: var(--aw-fg-3);
}

.warehouse-count-scope-foot {
  justify-content: flex-end;
}

@media (max-width: 980px) {
  :global(.warehouse-count-mode-grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .warehouse-count-scope-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  :global(.warehouse-count-mode-grid) {
    grid-template-columns: 1fr;
  }
}

.aw-picker-input {
  width: 100%;
  height: 32px;
  border: 1px solid var(--aw-border);
  border-radius: 4px;
  background: #fff;
  text-align: left;
  padding: 0 10px;
  color: var(--aw-fg-2);
}

.aw-input.compact {
  min-width: 90px;
}

:global(.warehouse-check-options) {
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

:global(.warehouse-check-option) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--aw-fg-2);
  font-size: 14px;
  line-height: 20px;
}

:global(.warehouse-check-option input) {
  width: 14px;
  height: 14px;
  min-width: 14px;
  accent-color: var(--aw-primary);
}

:global(.warehouse-check-option em) {
  color: var(--aw-fg-2);
  font-style: normal;
  white-space: nowrap;
}

.aw-link-button {
  border: 0;
  background: transparent;
  color: var(--aw-primary);
  cursor: pointer;
}

.aw-link-button.danger {
  color: var(--aw-danger);
}

:global(.aw-status.red) {
  background: #fff1f0;
  color: var(--aw-danger);
}

.warehouse-attachments {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
}

.warehouse-attachment {
  border: 1px dashed var(--aw-border-strong);
  border-radius: 6px;
  padding: 14px;
  min-height: 92px;
}

.warehouse-attachment span {
  display: block;
  margin-top: 8px;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.warehouse-attachment div {
  display: flex;
  gap: 14px;
  margin-top: 12px;
}

.warehouse-edit-note {
  margin-top: 12px;
  color: var(--aw-fg-3);
  font-size: 13px;
}

.warehouse-detail-table {
  margin-top: 12px;
}

@media (max-width: 760px) {
  .warehouse-filter-grid,
  .warehouse-column-grid {
    grid-template-columns: 1fr;
  }
}

</style>
