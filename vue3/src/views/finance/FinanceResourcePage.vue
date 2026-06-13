<template>
  <finance-setting-view v-if="moduleKey === 'settings'" />
  <finance-form-view v-else-if="isCreate" :module="module" :action-key="actionKey" @back="goFormBack" />
  <finance-action-view v-else-if="actionKey" :module="module" :action-key="actionKey" :rows="module.rows" @back="goList" @create="openActionCreate" />
  <finance-detail-view v-else-if="detailRow" :module="module" :row="detailRow" @back="goList" @action="openAction" />
  <aw-list-page v-else>
    <section class="finance-date-filter" :aria-label="dateFilterLabel">
      <div class="finance-date-filter__custom">
        <span>{{ dateFilterLabel }}</span>
        <input v-model="customDateStart" class="aw-input" type="date" @change="setDateRangePreset('custom')" />
        <span>至</span>
        <input v-model="customDateEnd" class="aw-input" type="date" @change="setDateRangePreset('custom')" />
      </div>
      <div class="finance-date-filter__presets">
        <button
          v-for="option in dateRangeOptions"
          :key="option.key"
          :class="['aw-tool-btn', { active: dateRangePreset === option.key }]"
          type="button"
          @click="setDateRangePreset(option.key)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>
    <section class="finance-summary-grid" :aria-label="`${currentPageTitle}概览`">
      <article v-for="card in summaryCards" :key="card.key" class="finance-summary-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <em>{{ card.hint }}</em>
      </article>
    </section>
    <aw-list-toolbar
      :search-placeholder="module.searchPlaceholder"
      :create-label="actionKey ? `新增${currentPageTitle}` : module.createLabel"
      @search="keyword = $event"
      @create="goCreate"
    />
    <aw-data-table
      :columns="module.columns"
      :rows="filteredRows"
      :row-key="'id'"
      :total="filteredRows.length"
      :bulk-actions="[{ key: 'batch', label: '批量核对' }]"
      :filter-values="columnFilters"
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === module.linkKey" class="aw-link" @click="openDetail(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'sourceCode'" class="aw-link" @click="openSource(record as FinanceRow)">{{ value }}</span>
        <span v-else-if="column.key === 'status' || column.key.endsWith('Status') || column.key === 'matchStatus'" :class="['aw-status', statusTone(String(value))]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(record.id as string)">查看</span>
        <span v-else>{{ financeCellValue(value, column) }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatMoney as formatCurrency, isMoneyField, parseMoneyValue } from '@/app/utils/money';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import AwSourcePickerModal from '@/components/form-page/AwSourcePickerModal.vue';
import AwStrategySettingPage from '@/components/setting-page/AwStrategySettingPage.vue';
import type { AwTableColumn } from '@/components/list-page/types';
import type { AttachmentRow, EditableColumn, SourcePickerBatch, SourcePickerBatchText, SourcePickerCategory, SourcePickerConfirmPayload, SourcePickerMetricField, SourcePickerRow, SourcePickerTableText } from '@/components/form-page/types';
import type { DetailAction, DetailTabItem } from '@/components/detail-page/types';
import type { StrategyTab } from '@/components/setting-page/types';

type FinanceModuleKey = 'receivables' | 'payables' | 'invoices' | 'settlements' | 'settings';
type FinanceRow = Record<string, string>;

interface FinanceSummaryCard {
  key: string;
  label: string;
  value: string;
  hint: string;
}

interface FinancePageAction {
  key: string;
  label: string;
}

interface FinanceActionField {
  label: string;
  value: string;
  readonly?: boolean;
}

interface FinanceFormExtraField {
  label: string;
  value?: string;
  placeholder?: string;
  readonly?: boolean;
  options?: string[];
}

interface FinanceFormConfig {
  id: string;
  title: string;
  counterpartyLabel: string;
  sourceCategories: SourcePickerCategory[];
  lineColumns: EditableColumn[];
  formLines: FinanceRow[];
  pickerTitle: string;
  sourceButtonLabel: string;
  writeBackText: string;
  statusOptions: string[];
  extraFields: FinanceFormExtraField[];
  attachmentOptions: string[];
  lineAddText: string;
  remarkPlaceholder: string;
  showBatches?: boolean;
  showBatchAmount?: boolean;
  sourceMetricField?: SourcePickerMetricField;
  sourceTableText?: Partial<SourcePickerTableText>;
  batchTextMap?: Record<string, Partial<SourcePickerBatchText>>;
}

interface FinanceModule {
  key: Exclude<FinanceModuleKey, 'settings'>;
  title: string;
  searchPlaceholder: string;
  createLabel: string;
  linkKey: string;
  counterpartyLabel: string;
  sourceCategories: SourcePickerCategory[];
  columns: AwTableColumn[];
  tabs: DetailTabItem[];
  rows: FinanceRow[];
  formLines: FinanceRow[];
  lineColumns: EditableColumn[];
}

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const dateRangePreset = ref('all');
const customDateStart = ref('2026-05-01');
const customDateEnd = ref('2026-05-31');
const columnFilters = reactive<Record<string, string>>({});
const dateRangeOptions = [
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
  { key: 'last30', label: '近30天' },
  { key: 'all', label: '全部' },
];
const moduleKey = computed<FinanceModuleKey>(() => {
  if (route.path.endsWith('/payables')) return 'payables';
  if (route.path.endsWith('/invoices')) return 'invoices';
  if (route.path.endsWith('/settlements')) return 'settlements';
  if (route.path.endsWith('/settings')) return 'settings';
  return 'receivables';
});
const module = computed(() => modules[moduleKey.value as Exclude<FinanceModuleKey, 'settings'>] || modules.receivables);
const rawActionKey = computed(() => typeof route.query.action === 'string' ? route.query.action : '');
const isCreate = computed(() => rawActionKey.value === 'new' || route.query.mode === 'new');
const actionKey = computed(() => normalizeFinanceAction(module.value.key, rawActionKey.value));
const currentPageTitle = computed(() => actionKey.value ? actionLabel(module.value.key, actionKey.value) : module.value.title);
const dateFilterLabel = computed(() => moduleDateLabel(module.value.key));
const detailRow = computed(() => {
  const id = typeof route.query.id === 'string' ? route.query.id : '';
  return id ? module.value.rows.find((row) => row.id === id) || null : null;
});
const filteredRows = computed(() => {
  const term = keyword.value.trim();
  const range = activeDateRange.value;
  return module.value.rows.filter((row) => {
    const keywordMatched = !term || JSON.stringify(row).includes(term);
    const filterMatched = Object.entries(columnFilters).every(([key, value]) => !value || row[key] === value);
    const dateMatched = isRowInDateRange(module.value.key, row, range.start, range.end);
    return keywordMatched && filterMatched && dateMatched;
  });
});
const summaryCards = computed(() => buildSummaryCards(module.value.key, filteredRows.value));
const activeDateRange = computed(() => buildDateRange(dateRangePreset.value, customDateStart.value, customDateEnd.value));

const commonActionColumn: AwTableColumn = { key: 'action', title: '操作', width: 80, fixed: 'right' };

const financePageActions: Record<FinanceModule['key'], FinancePageAction[]> = {
  receivables: [
    { key: 'receive', label: '收款登记' },
    { key: 'settle', label: '核销收款' },
    { key: 'adjust', label: '应收调整' },
    { key: 'reconcile', label: '客户对账' },
  ],
  payables: [
    { key: 'apply', label: '付款申请' },
    { key: 'pay', label: '付款登记' },
    { key: 'settle', label: '付款核销' },
    { key: 'invoice', label: '收票认证' },
    { key: 'match', label: '三单匹配' },
    { key: 'reconcile', label: '供应商对账' },
  ],
  invoices: [
    { key: 'output', label: '销项开票' },
    { key: 'input', label: '进项收票认证' },
    { key: 'match', label: '发票勾稽' },
    { key: 'red', label: '红冲处理' },
  ],
  settlements: [
    { key: 'receive', label: '收款登记' },
    { key: 'pay', label: '付款登记' },
    { key: 'refund', label: '退款付款' },
    { key: 'settle', label: '核销处理' },
    { key: 'bank', label: '银行对账' },
  ],
};

watch(
  [rawActionKey, moduleKey],
  ([action, key]) => {
    if (!action || action === 'new') return;
    const normalized = normalizeFinanceAction(key === 'settings' ? 'receivables' : key, action);
    if (normalized && normalized !== action) {
      router.replace({ path: route.path, query: { ...route.query, action: normalized } });
      return;
    }
    if (!normalized && isFinanceListAlias(key === 'settings' ? 'receivables' : key, action)) {
      const nextQuery = { ...route.query };
      delete nextQuery.action;
      router.replace({ path: route.path, query: nextQuery });
    }
  },
  { immediate: true },
);

const modules: Record<Exclude<FinanceModuleKey, 'settings'>, FinanceModule> = {
  receivables: {
    key: 'receivables',
    title: '应收管理',
    searchPlaceholder: '全局搜索（如应收单号、来源单据、客户）',
    createLabel: '新增应收',
    linkKey: 'code',
    counterpartyLabel: '客户',
    sourceCategories: [
      { key: '销售订单', label: '销售订单', icon: 'line-doc' },
      { key: '销售合同', label: '销售合同', icon: 'line-folder' },
      { key: '售后单', label: '售后单', icon: 'line-refresh' },
    ],
    columns: [
      { key: 'code', title: '应收单号', width: 150, link: true },
      { key: 'sourceType', title: '来源类型', width: 120, filterOptions: ['销售订单', '销售合同', '售后单'] },
      { key: 'sourceCode', title: '来源单据', width: 150, link: true },
      { key: 'counterpartyName', title: '客户', width: 180 },
      { key: 'amount', title: '应收金额', width: 120 },
      { key: 'settledAmount', title: '已收金额', width: 120 },
      { key: 'unsettledAmount', title: '未收金额', width: 120 },
      { key: 'dueDate', title: '到期日', width: 120 },
      { key: 'agingDays', title: '账龄', width: 90 },
      { key: 'invoiceStatus', title: '开票状态', width: 110, filterOptions: ['待开票', '已开票', '待红冲'] },
      { key: 'settlementStatus', title: '核销状态', width: 110, filterOptions: ['待核销', '部分核销', '已核销'] },
      { key: 'status', title: '状态', width: 110, filterOptions: ['待收款', '部分收款', '已收款', '已核销', '已调整', '已关闭'] },
      commonActionColumn,
    ],
    tabs: [
      { key: 'base', label: '基础信息' },
      { key: 'source', label: '来源明细' },
      { key: 'settlement', label: '收款核销' },
      { key: 'invoice', label: '开票记录' },
      { key: 'adjust', label: '调整记录' },
      { key: 'voucher', label: '凭证记录' },
      { key: 'log', label: '操作记录' },
    ],
    rows: [
      { id: 'ar1', code: 'AR-202605-001', sourceRefType: 'sales_order', sourceId: 'so1', sourceType: '销售订单', sourceCode: 'SO-202605-001', sourceLineId: 'SO-202605-001-L1', sourceTitle: '智能温控终端发货应收', sourceRoute: '/sales/sales-orders?id=so1', businessCenter: '销售', customerId: 'CUS-202605-001', counterpartyName: '海南微为科技', amount: '59,590.00', settledAmount: '20,000.00', unsettledAmount: '39,590.00', dueDate: '2026-05-31', agingDays: '9天', invoiceStatus: '已开票', settlementStatus: '部分核销', status: '部分收款', confirmationPoint: '出库/OQC/签收完成', creditOccupied: '39,590.00', creditReleaseStatus: '部分释放', writeBackTarget: '销售订单已回款、客户信用占用释放' },
      { id: 'ar2', code: 'AR-202605-002', sourceRefType: 'sales_contract', sourceId: 'sc14', sourceType: '销售合同', sourceCode: 'SC-202605-014', sourceLineId: 'SC-202605-014-P1', sourceTitle: '年度维保服务合同', sourceRoute: '/sales/sales-contracts?id=sc14', businessCenter: '销售', customerId: 'CUS-202605-002', counterpartyName: '广州新城智能', amount: '42,800.00', settledAmount: '0.00', unsettledAmount: '42,800.00', dueDate: '2026-06-10', agingDays: '未到期', invoiceStatus: '待开票', settlementStatus: '待核销', status: '待收款', confirmationPoint: '合同收款计划到期', creditOccupied: '42,800.00', creditReleaseStatus: '未释放', writeBackTarget: '销售合同回款状态、开票状态' },
      { id: 'ar3', code: 'AR-ADJ-202605-003', sourceRefType: 'after_sales', sourceId: 'as6', sourceType: '售后单', sourceCode: 'AS-202605-006', sourceLineId: 'AS-202605-006-R1', sourceTitle: '退货应收调整', sourceRoute: '/after-sales/services?id=as6', businessCenter: '售后', customerId: 'CUS-202605-003', counterpartyName: '深圳云启制造', amount: '-8,600.00', settledAmount: '0.00', unsettledAmount: '-8,600.00', dueDate: '2026-05-30', agingDays: '调整', invoiceStatus: '待红冲', settlementStatus: '已核销', status: '已调整', confirmationPoint: '退货入库完成', creditOccupied: '-8,600.00', creditReleaseStatus: '调整释放', afterSalesReturnStatus: '退货入库已完成', refundPaymentStatus: '退款待付款', receivableAdjustStatus: '应收已调整', redInvoiceStatus: '发票待红冲', afterSalesCloseStatus: '未满足关闭', writeBackTarget: '售后单应收已调整，等待退款付款和发票红冲后再校验关闭' },
      { id: 'ar4', code: 'AR-202605-004', sourceRefType: 'sales_order', sourceId: 'so9', sourceType: '销售订单', sourceCode: 'SO-202605-009', sourceLineId: 'SO-202605-009-L1', sourceTitle: '销售出库确认应收', sourceRoute: '/sales/sales-orders?id=so9', businessCenter: '销售', customerId: 'CUS-202605-004', counterpartyName: '东莞蓝海装备', amount: '76,300.00', settledAmount: '0.00', unsettledAmount: '76,300.00', dueDate: '2026-06-20', agingDays: '未到期', invoiceStatus: '待开票', settlementStatus: '待核销', status: '待收款', confirmationPoint: '仓储出库 OUT-202605-009 完成', confirmSourceType: '仓储出库', confirmSourceCode: 'OUT-202605-009', confirmSourceRoute: '/warehouse/warehouse-outbounds?id=out9', creditOccupied: '76,300.00', creditReleaseStatus: '未释放', writeBackTarget: '销售订单应收确认、客户信用占用' },
      { id: 'ar5', code: 'AR-202605-005', sourceRefType: 'sales_order', sourceId: 'so12', sourceType: '销售订单', sourceCode: 'SO-202605-012', sourceLineId: 'SO-202605-012-L1', sourceTitle: '整机项目尾款应收', sourceRoute: '/sales/sales-orders?id=so12', businessCenter: '销售', customerId: 'CUS-202605-005', counterpartyName: '佛山智造电子', amount: '18,000.00', settledAmount: '18,000.00', unsettledAmount: '0.00', dueDate: '2026-05-26', agingDays: '已收清', invoiceStatus: '已开票', settlementStatus: '待核销', status: '已收款', confirmationPoint: '客户回款到账', creditOccupied: '0.00', creditReleaseStatus: '待核销释放', writeBackTarget: '销售订单回款状态，等待财务核销后释放信用占用' },
      { id: 'ar6', code: 'AR-202605-006', sourceRefType: 'sales_contract', sourceId: 'sc20', sourceType: '销售合同', sourceCode: 'SC-202605-020', sourceLineId: 'SC-202605-020-P2', sourceTitle: '软件服务续费应收', sourceRoute: '/sales/sales-contracts?id=sc20', businessCenter: '销售', customerId: 'CUS-202605-006', counterpartyName: '成都智科软件', amount: '32,600.00', settledAmount: '32,600.00', unsettledAmount: '0.00', dueDate: '2026-05-22', agingDays: '已核销', invoiceStatus: '已开票', settlementStatus: '已核销', status: '已核销', confirmationPoint: '核销完成', creditOccupied: '0.00', creditReleaseStatus: '已释放', writeBackTarget: '合同回款状态、应收核销状态已完成' },
      { id: 'ar7', code: 'AR-202605-007', sourceRefType: 'sales_order', sourceId: 'so18', sourceType: '销售订单', sourceCode: 'SO-202605-018', sourceLineId: 'SO-202605-018-L1', sourceTitle: '历史应收关闭样例', sourceRoute: '/sales/sales-orders?id=so18', businessCenter: '销售', customerId: 'CUS-202605-007', counterpartyName: '厦门海峡仪器', amount: '12,400.00', settledAmount: '0.00', unsettledAmount: '12,400.00', dueDate: '2026-05-18', agingDays: '关闭', invoiceStatus: '待开票', settlementStatus: '待核销', status: '已关闭', confirmationPoint: '业务关闭', creditOccupied: '0.00', creditReleaseStatus: '已关闭', writeBackTarget: '历史应收已关闭，保留只读演示' },
    ],
    formLines: [
      { id: '1', sourceCode: 'SO-202605-001', sourceTitle: '智能温控终端', businessType: '销售发货', amount: '59,590.00', handledAmount: '20,000.00', pendingAmount: '39,590.00' },
    ],
    lineColumns: sourceLineColumns('应收金额', '已收金额', '未收金额'),
  },
  payables: {
    key: 'payables',
    title: '应付管理',
    searchPlaceholder: '全局搜索（如应付单号、来源单据、供应商）',
    createLabel: '新增应付',
    linkKey: 'code',
    counterpartyLabel: '供应商',
    sourceCategories: [
      { key: '采购订单', label: '采购订单', icon: 'line-doc' },
      { key: '采购入库', label: '采购入库', icon: 'line-folder' },
      { key: '采购退货', label: '采购退货', icon: 'line-refresh' },
    ],
    columns: [
      { key: 'code', title: '应付单号', width: 150, link: true },
      { key: 'sourceType', title: '来源类型', width: 120, filterOptions: ['采购订单', '采购入库', '采购退货'] },
      { key: 'sourceCode', title: '来源单据', width: 150, link: true },
      { key: 'counterpartyName', title: '供应商', width: 180 },
      { key: 'amount', title: '应付金额', width: 120 },
      { key: 'settledAmount', title: '已付金额', width: 120 },
      { key: 'unsettledAmount', title: '未付金额', width: 120 },
      { key: 'dueDate', title: '到期日', width: 120 },
      { key: 'invoiceStatus', title: '到票状态', width: 110, filterOptions: ['待到票', '已到票', '已认证'] },
      { key: 'matchStatus', title: '三单匹配状态', width: 130, filterOptions: ['待匹配', '部分匹配', '已匹配'] },
      { key: 'settlementStatus', title: '核销状态', width: 110, filterOptions: ['待核销', '部分核销', '已核销'] },
      { key: 'status', title: '状态', width: 110, filterOptions: ['暂估', '待付款', '部分付款', '已付款', '已核销', '已冲减', '已关闭'] },
      commonActionColumn,
    ],
    tabs: [
      { key: 'base', label: '基础信息' },
      { key: 'source', label: '来源明细' },
      { key: 'inbound', label: '入库记录' },
      { key: 'invoice', label: '发票/到票' },
      { key: 'settlement', label: '付款核销' },
      { key: 'match', label: '三单匹配' },
      { key: 'voucher', label: '凭证记录' },
      { key: 'log', label: '操作记录' },
    ],
    rows: [
      { id: 'ap1', code: 'AP-202605-001', sourceRefType: 'warehouse_inbound', sourceId: 'in18', sourceType: '采购入库', sourceCode: 'IN-202605-018', sourceLineId: 'IN-202605-018-L1', sourceTitle: '采购入库暂估', sourceRoute: '/warehouse/warehouse-inbounds?id=in18', businessCenter: '采购/仓储', supplierId: 'SUP-202605-001', counterpartyName: '深圳华芯电子', amount: '86,200.00', settledAmount: '30,000.00', unsettledAmount: '56,200.00', dueDate: '2026-06-15', invoiceStatus: '已到票', matchStatus: '部分匹配', settlementStatus: '部分核销', status: '部分付款', provisionalStatus: '暂估有效', payableAmount: '56,200.00', qualityDeduction: '0.00', inboundStatus: '入库完成', paymentCondition: '到票后月结30天', purchaseOrderCode: 'PO-202605-018', purchaseOrderRoute: '/purchase/purchase-orders?id=po18', inboundCode: 'IN-202605-018', inboundRoute: '/warehouse/warehouse-inbounds?id=in18', invoiceCode: 'PINV-202605-004', invoiceRoute: '/finance/invoices?id=inv2', orderAmount: '86,200.00', inboundAmount: '86,200.00', invoiceAmount: '86,200.00', writeBackTarget: '采购订单付款状态、到票状态、可付款金额' },
      { id: 'ap2', code: 'AP-EST-202605-002', sourceRefType: 'purchase_order', sourceId: 'po21', sourceType: '采购订单', sourceCode: 'PO-202605-021', sourceLineId: 'PO-202605-021-L1', sourceTitle: '包装耗材暂估应付', sourceRoute: '/purchase/purchase-orders?id=po21', businessCenter: '采购', supplierId: 'SUP-202605-002', counterpartyName: '东莞科创包装', amount: '9,600.00', settledAmount: '0.00', unsettledAmount: '9,600.00', dueDate: '2026-06-20', invoiceStatus: '待到票', matchStatus: '待匹配', settlementStatus: '待核销', status: '暂估', provisionalStatus: '待到票冲回', payableAmount: '9,600.00', qualityDeduction: '0.00', inboundStatus: '部分入库', paymentCondition: '入库暂估，到票后付款', purchaseOrderCode: 'PO-202605-021', purchaseOrderRoute: '/purchase/purchase-orders?id=po21', inboundCode: 'IN-202605-021', inboundRoute: '/warehouse/warehouse-inbounds?id=in21', invoiceCode: '待到票', invoiceRoute: '', orderAmount: '9,600.00', inboundAmount: '9,600.00', invoiceAmount: '0.00', writeBackTarget: '采购订单到票状态、暂估应付' },
      { id: 'ap3', code: 'AP-RED-202605-003', sourceRefType: 'purchase_return', sourceId: 'pret2', sourceType: '采购退货', sourceCode: 'PRT-202605-002', sourceLineId: 'PRT-202605-002-L1', sourceTitle: '采购退货应付冲减', sourceRoute: '/purchase/purchase-returns?id=pret2', businessCenter: '采购/仓储', supplierId: 'SUP-202605-003', counterpartyName: '广州物流服务', amount: '-18,600.00', settledAmount: '0.00', unsettledAmount: '-18,600.00', dueDate: '2026-05-31', invoiceStatus: '待红冲', matchStatus: '已匹配', settlementStatus: '已核销', status: '已冲减', provisionalStatus: '冲减完成', payableAmount: '-18,600.00', qualityDeduction: '18,600.00', inboundStatus: '退货出库完成', paymentCondition: '采购退货冲减', purchaseOrderCode: 'PO-202605-017', purchaseOrderRoute: '/purchase/purchase-orders?id=po17', inboundCode: 'PRT-202605-002', inboundRoute: '/purchase/purchase-returns?id=pret2', invoiceCode: '待红冲', invoiceRoute: '', orderAmount: '-18,600.00', inboundAmount: '-18,600.00', invoiceAmount: '0.00', writeBackTarget: '采购订单可付款金额冲减、供应商对账更新' },
      { id: 'ap4', code: 'AP-202605-004', sourceRefType: 'purchase_order', sourceId: 'po24', sourceType: '采购订单', sourceCode: 'PO-202605-024', sourceLineId: 'PO-202605-024-L1', sourceTitle: '结构件到票待付款', sourceRoute: '/purchase/purchase-orders?id=po24', businessCenter: '采购', supplierId: 'SUP-202605-004', counterpartyName: '苏州精密结构', amount: '48,900.00', settledAmount: '0.00', unsettledAmount: '48,900.00', dueDate: '2026-06-18', invoiceStatus: '已到票', matchStatus: '已匹配', settlementStatus: '待核销', status: '待付款', provisionalStatus: '暂估已冲回', payableAmount: '48,900.00', qualityDeduction: '0.00', inboundStatus: '入库完成', paymentCondition: '到票后15天', purchaseOrderCode: 'PO-202605-024', purchaseOrderRoute: '/purchase/purchase-orders?id=po24', inboundCode: 'IN-202605-024', inboundRoute: '/warehouse/warehouse-inbounds?id=in24', invoiceCode: 'PINV-202605-024', invoiceRoute: '/finance/invoices?id=inv8', orderAmount: '48,900.00', inboundAmount: '48,900.00', invoiceAmount: '48,900.00', writeBackTarget: '采购订单可付款金额、付款申请状态' },
      { id: 'ap5', code: 'AP-202605-005', sourceRefType: 'purchase_order', sourceId: 'po25', sourceType: '采购订单', sourceCode: 'PO-202605-025', sourceLineId: 'PO-202605-025-L1', sourceTitle: '传感器批量采购已付款', sourceRoute: '/purchase/purchase-orders?id=po25', businessCenter: '采购/财务', supplierId: 'SUP-202605-005', counterpartyName: '上海敏芯传感', amount: '28,500.00', settledAmount: '28,500.00', unsettledAmount: '0.00', dueDate: '2026-05-28', invoiceStatus: '已认证', matchStatus: '已匹配', settlementStatus: '待核销', status: '已付款', provisionalStatus: '暂估已冲回', payableAmount: '0.00', qualityDeduction: '0.00', inboundStatus: '入库完成', paymentCondition: '预付完成', purchaseOrderCode: 'PO-202605-025', purchaseOrderRoute: '/purchase/purchase-orders?id=po25', inboundCode: 'IN-202605-025', inboundRoute: '/warehouse/warehouse-inbounds?id=in25', invoiceCode: 'PINV-202605-025', invoiceRoute: '/finance/invoices?id=inv9', orderAmount: '28,500.00', inboundAmount: '28,500.00', invoiceAmount: '28,500.00', writeBackTarget: '采购订单付款状态，待核销后关闭应付' },
      { id: 'ap6', code: 'AP-202605-006', sourceRefType: 'purchase_order', sourceId: 'po26', sourceType: '采购订单', sourceCode: 'PO-202605-026', sourceLineId: 'PO-202605-026-L1', sourceTitle: '钣金加工费已核销', sourceRoute: '/purchase/purchase-orders?id=po26', businessCenter: '采购/财务', supplierId: 'SUP-202605-006', counterpartyName: '宁波钣金制造', amount: '16,800.00', settledAmount: '16,800.00', unsettledAmount: '0.00', dueDate: '2026-05-25', invoiceStatus: '已认证', matchStatus: '已匹配', settlementStatus: '已核销', status: '已核销', provisionalStatus: '核销完成', payableAmount: '0.00', qualityDeduction: '0.00', inboundStatus: '入库完成', paymentCondition: '月结', purchaseOrderCode: 'PO-202605-026', purchaseOrderRoute: '/purchase/purchase-orders?id=po26', inboundCode: 'IN-202605-026', inboundRoute: '/warehouse/warehouse-inbounds?id=in26', invoiceCode: 'PINV-202605-026', invoiceRoute: '/finance/invoices?id=inv10', orderAmount: '16,800.00', inboundAmount: '16,800.00', invoiceAmount: '16,800.00', writeBackTarget: '应付单核销状态、采购订单已付款已关闭' },
      { id: 'ap7', code: 'AP-202605-007', sourceRefType: 'purchase_order', sourceId: 'po27', sourceType: '采购订单', sourceCode: 'PO-202605-027', sourceLineId: 'PO-202605-027-L1', sourceTitle: '历史应付关闭样例', sourceRoute: '/purchase/purchase-orders?id=po27', businessCenter: '采购', supplierId: 'SUP-202605-007', counterpartyName: '杭州辅料供应', amount: '6,200.00', settledAmount: '0.00', unsettledAmount: '6,200.00', dueDate: '2026-05-20', invoiceStatus: '待到票', matchStatus: '待匹配', settlementStatus: '待核销', status: '已关闭', provisionalStatus: '业务关闭', payableAmount: '0.00', qualityDeduction: '0.00', inboundStatus: '取消入库', paymentCondition: '无需付款', purchaseOrderCode: 'PO-202605-027', purchaseOrderRoute: '/purchase/purchase-orders?id=po27', inboundCode: '-', inboundRoute: '', invoiceCode: '-', invoiceRoute: '', orderAmount: '6,200.00', inboundAmount: '0.00', invoiceAmount: '0.00', writeBackTarget: '历史应付已关闭，保留只读演示' },
    ],
    formLines: [
      { id: '1', sourceCode: 'IN-202605-018', sourceTitle: '工业级LCD显示屏', businessType: '采购入库', amount: '86,200.00', handledAmount: '30,000.00', pendingAmount: '56,200.00' },
    ],
    lineColumns: sourceLineColumns('应付金额', '已付金额', '未付金额'),
  },
  invoices: {
    key: 'invoices',
    title: '发票管理',
    searchPlaceholder: '全局搜索（如发票单号、来源单据、往来单位）',
    createLabel: '新增发票',
    linkKey: 'code',
    counterpartyLabel: '往来单位',
    sourceCategories: [
      { key: '销售订单', label: '销售订单', icon: 'line-doc' },
      { key: '采购订单', label: '采购订单', icon: 'line-folder' },
      { key: '售后单', label: '售后单', icon: 'line-refresh' },
    ],
    columns: [
      { key: 'code', title: '发票单号/申请号', width: 160, link: true },
      { key: 'direction', title: '发票方向', width: 110, filterOptions: ['销项', '进项', '红冲'] },
      { key: 'sourceCode', title: '来源单据', width: 150, link: true },
      { key: 'counterpartyName', title: '往来单位', width: 180 },
      { key: 'invoiceType', title: '发票类型', width: 130 },
      { key: 'taxExclusiveAmount', title: '未税金额', width: 120 },
      { key: 'taxAmount', title: '税额', width: 110 },
      { key: 'amount', title: '价税合计', width: 120 },
      { key: 'issueDate', title: '开票/收票日期', width: 130 },
      { key: 'matchStatus', title: '勾稽/认证状态', width: 130, filterOptions: ['待勾稽', '待认证', '已认证', '已红冲'] },
      { key: 'status', title: '状态', width: 110, filterOptions: ['待开票', '已开票', '待收票', '待认证', '已认证', '待红冲', '已红冲', '异常'] },
      commonActionColumn,
    ],
    tabs: [
      { key: 'base', label: '基础信息' },
      { key: 'source', label: '来源明细' },
      { key: 'match', label: '勾稽记录' },
      { key: 'tax', label: '税务认证' },
      { key: 'red', label: '红冲记录' },
      { key: 'voucher', label: '凭证记录' },
      { key: 'log', label: '操作记录' },
    ],
    rows: [
      { id: 'inv1', code: 'INV-202605-001', sourceRefType: 'sales_order', sourceId: 'so1', direction: '销项', sourceType: '销售订单', sourceCode: 'SO-202605-001', sourceLineId: 'SO-202605-001-L1', sourceTitle: '销售订单开票申请', sourceRoute: '/sales/sales-orders?id=so1', businessCenter: '销售', counterpartyName: '海南微为科技', invoiceType: '增值税专票', taxExclusiveAmount: '52,734.51', taxAmount: '6,855.49', amount: '59,590.00', issueDate: '2026-05-21', matchStatus: '待勾稽', certificationStatus: '无需认证', redStatus: '未红冲', status: '已开票', writeBackTarget: '销售订单开票状态、合同开票记录' },
      { id: 'inv2', code: 'PINV-202605-004', sourceRefType: 'purchase_order', sourceId: 'po18', direction: '进项', sourceType: '采购订单', sourceCode: 'PO-202605-018', sourceLineId: 'PO-202605-018-L1', sourceTitle: '采购到票认证', sourceRoute: '/purchase/purchase-orders?id=po18', businessCenter: '采购', counterpartyName: '深圳华芯电子', invoiceType: '增值税专票', taxExclusiveAmount: '76,283.19', taxAmount: '9,916.81', amount: '86,200.00', issueDate: '2026-05-24', matchStatus: '待认证', certificationStatus: '待认证', redStatus: '未红冲', status: '待认证', purchaseOrderCode: 'PO-202605-018', purchaseOrderRoute: '/purchase/purchase-orders?id=po18', inboundCode: 'IN-202605-018', inboundRoute: '/warehouse/warehouse-inbounds?id=in18', invoiceCode: 'PINV-202605-004', invoiceRoute: '/finance/invoices?id=inv2', orderAmount: '86,200.00', inboundAmount: '86,200.00', invoiceAmount: '86,200.00', writeBackTarget: '采购订单到票状态、三单匹配记录' },
      { id: 'inv3', code: 'RED-202605-002', sourceRefType: 'after_sales', sourceId: 'as6', direction: '红冲', sourceType: '售后单', sourceCode: 'AS-202605-006', sourceLineId: 'AS-202605-006-R1', sourceTitle: '售后退款红冲', sourceRoute: '/after-sales/services?id=as6', businessCenter: '售后', counterpartyName: '深圳云启制造', invoiceType: '红字发票', taxExclusiveAmount: '-7,610.62', taxAmount: '-989.38', amount: '-8,600.00', issueDate: '2026-05-30', matchStatus: '已红冲', certificationStatus: '无需认证', redStatus: '已红冲', status: '已红冲', afterSalesReturnStatus: '退货入库已完成', refundPaymentStatus: '退款待付款', receivableAdjustStatus: '应收已调整', redInvoiceStatus: '发票已红冲', afterSalesCloseStatus: '未满足关闭', writeBackTarget: '售后单发票已红冲，等待退款付款后再校验关闭' },
      { id: 'inv4', code: 'INV-REQ-202605-004', sourceRefType: 'sales_order', sourceId: 'so22', direction: '销项', sourceType: '销售订单', sourceCode: 'SO-202605-022', sourceLineId: 'SO-202605-022-L1', sourceTitle: '销售开票申请待处理', sourceRoute: '/sales/sales-orders?id=so22', businessCenter: '销售', counterpartyName: '无锡智联装备', invoiceType: '增值税专票', taxExclusiveAmount: '34,336.28', taxAmount: '4,463.72', amount: '38,800.00', issueDate: '', matchStatus: '待勾稽', certificationStatus: '无需认证', redStatus: '未红冲', status: '待开票', writeBackTarget: '账款开票后回写销售订单开票状态' },
      { id: 'inv5', code: 'PINV-REQ-202605-005', sourceRefType: 'purchase_order', sourceId: 'po28', direction: '进项', sourceType: '采购订单', sourceCode: 'PO-202605-028', sourceLineId: 'PO-202605-028-L1', sourceTitle: '供应商发票待收票', sourceRoute: '/purchase/purchase-orders?id=po28', businessCenter: '采购', counterpartyName: '昆山电子材料', invoiceType: '增值税专票', taxExclusiveAmount: '21,858.41', taxAmount: '2,841.59', amount: '24,700.00', issueDate: '', matchStatus: '待收票', certificationStatus: '待收票', redStatus: '未红冲', status: '待收票', purchaseOrderCode: 'PO-202605-028', purchaseOrderRoute: '/purchase/purchase-orders?id=po28', inboundCode: 'IN-202605-028', inboundRoute: '/warehouse/warehouse-inbounds?id=in28', invoiceCode: '待收票', invoiceRoute: '', orderAmount: '24,700.00', inboundAmount: '24,700.00', invoiceAmount: '0.00', writeBackTarget: '收票后回写采购订单到票状态' },
      { id: 'inv6', code: 'PINV-202605-006', sourceRefType: 'purchase_order', sourceId: 'po29', direction: '进项', sourceType: '采购订单', sourceCode: 'PO-202605-029', sourceLineId: 'PO-202605-029-L1', sourceTitle: '进项发票已认证', sourceRoute: '/purchase/purchase-orders?id=po29', businessCenter: '采购', counterpartyName: '常州精工零件', invoiceType: '增值税专票', taxExclusiveAmount: '15,752.21', taxAmount: '2,047.79', amount: '17,800.00', issueDate: '2026-05-25', matchStatus: '已认证', certificationStatus: '已认证', redStatus: '未红冲', status: '已认证', purchaseOrderCode: 'PO-202605-029', purchaseOrderRoute: '/purchase/purchase-orders?id=po29', inboundCode: 'IN-202605-029', inboundRoute: '/warehouse/warehouse-inbounds?id=in29', invoiceCode: 'PINV-202605-006', invoiceRoute: '/finance/invoices?id=inv6', orderAmount: '17,800.00', inboundAmount: '17,800.00', invoiceAmount: '17,800.00', writeBackTarget: '认证完成后参与三单匹配和应付核销' },
      { id: 'inv7', code: 'RED-REQ-202605-007', sourceRefType: 'after_sales', sourceId: 'as9', direction: '红冲', sourceType: '售后单', sourceCode: 'AS-202605-009', sourceLineId: 'AS-202605-009-R1', sourceTitle: '售后退货待红冲', sourceRoute: '/after-sales/services?id=as9', businessCenter: '售后', counterpartyName: '南京北辰科技', invoiceType: '红字发票', taxExclusiveAmount: '-4,955.75', taxAmount: '-644.25', amount: '-5,600.00', issueDate: '', matchStatus: '待红冲', certificationStatus: '无需认证', redStatus: '待红冲', status: '待红冲', afterSalesReturnStatus: '退货入库已完成', refundPaymentStatus: '退款待付款', receivableAdjustStatus: '应收已调整', redInvoiceStatus: '发票待红冲', afterSalesCloseStatus: '未满足关闭', writeBackTarget: '红冲后回写售后单发票状态' },
      { id: 'inv8', code: 'INV-ERR-202605-008', sourceRefType: 'sales_order', sourceId: 'so23', direction: '销项', sourceType: '销售订单', sourceCode: 'SO-202605-023', sourceLineId: 'SO-202605-023-L1', sourceTitle: '开票异常待处理', sourceRoute: '/sales/sales-orders?id=so23', businessCenter: '销售/财务', counterpartyName: '青岛海纳电子', invoiceType: '增值税专票', taxExclusiveAmount: '9,292.04', taxAmount: '1,207.96', amount: '10,500.00', issueDate: '2026-05-29', matchStatus: '异常', certificationStatus: '无需认证', redStatus: '未红冲', status: '异常', writeBackTarget: '异常处理后再回写销售开票状态' },
    ],
    formLines: [
      { id: '1', sourceCode: 'SO-202605-001', sourceTitle: '智能温控终端', businessType: '销项开票', amount: '59,590.00', handledAmount: '6,855.49', pendingAmount: '52,734.51' },
    ],
    lineColumns: sourceLineColumns('价税合计', '税额', '未税金额'),
  },
  settlements: {
    key: 'settlements',
    title: '收付核销',
    searchPlaceholder: '全局搜索（如流水单号、来源单据、往来单位）',
    createLabel: '新增流水',
    linkKey: 'code',
    counterpartyLabel: '往来单位',
    sourceCategories: [
      { key: '应收单', label: '应收单', icon: 'line-doc' },
      { key: '应付单', label: '应付单', icon: 'line-folder' },
      { key: '售后退款单', label: '售后退款单', icon: 'line-refresh' },
    ],
    columns: [
      { key: 'code', title: '流水单号', width: 150, link: true },
      { key: 'direction', title: '流水方向', width: 110, filterOptions: ['收款', '付款', '退款'] },
      { key: 'sourceCode', title: '来源单据', width: 150, link: true },
      { key: 'counterpartyName', title: '往来单位', width: 180 },
      { key: 'amount', title: '金额', width: 120 },
      { key: 'accountName', title: '账户', width: 160 },
      { key: 'transactionDate', title: '到账/付款日期', width: 130 },
      { key: 'unsettledAmount', title: '可核销金额', width: 120 },
      { key: 'settledAmount', title: '已核销金额', width: 120 },
      { key: 'reconcileStatus', title: '对账状态', width: 110, filterOptions: ['待对账', '已对账', '差异待处理'] },
      { key: 'settlementStatus', title: '核销状态', width: 110, filterOptions: ['待核销', '部分核销', '已核销'] },
      commonActionColumn,
    ],
    tabs: [
      { key: 'base', label: '基础信息' },
      { key: 'source', label: '核销对象' },
      { key: 'bank', label: '银行对账' },
      { key: 'attach', label: '附件回单' },
      { key: 'voucher', label: '凭证记录' },
      { key: 'log', label: '操作记录' },
    ],
    rows: [
      { id: 'set1', code: 'BNK-202605-001', sourceRefType: 'receivable', sourceId: 'ar1', direction: '收款', sourceType: '应收单', sourceCode: 'AR-202605-001', sourceLineId: 'AR-202605-001-L1', sourceTitle: '客户回款核销', sourceRoute: '/finance/receivables?id=ar1', businessCenter: '销售/财务', counterpartyName: '海南微为科技', amount: '20,000.00', accountName: '招商银行基本户', transactionDate: '2026-05-17', unreconciledAmount: '0.00', unsettledAmount: '0.00', settledAmount: '20,000.00', reconcileStatus: '已对账', settlementStatus: '已核销', status: '已核销', bankFlowCode: 'BANK-20260517-001', receiptStatus: '回单已上传', writeBackTarget: '应收单核销状态、销售订单已回款、信用占用释放' },
      { id: 'set2', code: 'PAY-202605-001', sourceRefType: 'payable', sourceId: 'ap1', direction: '付款', sourceType: '应付单', sourceCode: 'AP-202605-001', sourceLineId: 'AP-202605-001-L1', sourceTitle: '供应商付款核销', sourceRoute: '/finance/payables?id=ap1', businessCenter: '采购/财务', counterpartyName: '深圳华芯电子', amount: '30,000.00', accountName: '建设银行一般户', transactionDate: '2026-05-18', unreconciledAmount: '0.00', unsettledAmount: '0.00', settledAmount: '30,000.00', reconcileStatus: '已对账', settlementStatus: '已核销', status: '已核销', bankFlowCode: 'BANK-20260518-004', receiptStatus: '回单已上传', writeBackTarget: '应付单核销状态、采购订单已付款、可付款金额更新' },
      { id: 'set3', code: 'REF-202605-006', sourceRefType: 'after_sales_refund', sourceId: 'as6', direction: '退款', sourceType: '售后退款单', sourceCode: 'AS-202605-006', sourceLineId: 'AS-202605-006-R1', sourceTitle: '售后退款待付款', sourceRoute: '/after-sales/services?id=as6', businessCenter: '售后/财务', counterpartyName: '深圳云启制造', amount: '8,600.00', accountName: '招商银行基本户', transactionDate: '2026-05-31', unreconciledAmount: '8,600.00', unsettledAmount: '8,600.00', settledAmount: '0.00', reconcileStatus: '待对账', settlementStatus: '待核销', status: '待确认', bankFlowCode: '待导入', receiptStatus: '待上传', afterSalesReturnStatus: '退货入库已完成', refundPaymentStatus: '退款待付款', receivableAdjustStatus: '应收已调整', redInvoiceStatus: '发票已红冲', afterSalesCloseStatus: '未满足关闭', writeBackTarget: '退款付款完成后回写售后单，未付款前不触发关闭通过' },
      { id: 'set4', code: 'BNK-202605-004', sourceRefType: 'receivable', sourceId: 'ar5', direction: '收款', sourceType: '应收单', sourceCode: 'AR-202605-005', sourceLineId: 'AR-202605-005-L1', sourceTitle: '客户尾款部分核销', sourceRoute: '/finance/receivables?id=ar5', businessCenter: '销售/财务', counterpartyName: '佛山智造电子', amount: '18,000.00', accountName: '招商银行基本户', transactionDate: '2026-05-26', unreconciledAmount: '0.00', unsettledAmount: '8,000.00', settledAmount: '10,000.00', reconcileStatus: '已对账', settlementStatus: '部分核销', status: '部分核销', bankFlowCode: 'BANK-20260526-004', receiptStatus: '回单已上传', writeBackTarget: '应收单部分核销，销售订单回款进度更新' },
      { id: 'set5', code: 'BNK-DIFF-202605-005', sourceRefType: 'bank_flow', sourceId: 'bank5', direction: '收款', sourceType: '银行流水', sourceCode: 'BANK-20260528-005', sourceLineId: 'BANK-20260528-005-L1', sourceTitle: '银行流水差异待处理', sourceRoute: '/finance/settlements?id=set5', businessCenter: '财务', counterpartyName: '未知往来单位', amount: '3,200.00', accountName: '招商银行基本户', transactionDate: '2026-05-28', unreconciledAmount: '3,200.00', unsettledAmount: '3,200.00', settledAmount: '0.00', reconcileStatus: '差异待处理', settlementStatus: '待核销', status: '差异待处理', bankFlowCode: 'BANK-20260528-005', receiptStatus: '待确认', writeBackTarget: '差异确认后再进入核销流程' },
    ],
    formLines: [
      { id: '1', sourceCode: 'AR-202605-001', sourceTitle: '客户回款', businessType: '收款核销', amount: '20,000.00', handledAmount: '20,000.00', pendingAmount: '0.00' },
    ],
    lineColumns: sourceLineColumns('流水金额', '已核销', '可核销'),
  },
};

function sourceLineColumns(amountTitle: string, handledTitle: string, pendingTitle: string): EditableColumn[] {
  return [
    { key: 'sourceCode', title: '来源单据', width: 150 },
    { key: 'sourceTitle', title: '来源主题', width: 180 },
    { key: 'businessType', title: '业务类型', width: 130 },
    { key: 'amount', title: amountTitle, width: 120 },
    { key: 'handledAmount', title: handledTitle, width: 120 },
    { key: 'pendingAmount', title: pendingTitle, width: 120 },
  ];
}

function setColumnFilter(key: string, value: string) {
  columnFilters[key] = value;
}

function setDateRangePreset(key: string) {
  dateRangePreset.value = key;
}

function goCreate() {
  router.push({ path: route.path, query: { action: 'new' } });
}

function openAction(action: string) {
  router.push({ path: route.path, query: { action } });
}

function openActionCreate(action: string) {
  router.push({ path: route.path, query: { action, mode: 'new' } });
}

function goFormBack() {
  if (actionKey.value) {
    openAction(actionKey.value);
    return;
  }
  goList();
}

function goList() {
  router.push({ path: route.path });
}

function openDetail(id: string) {
  router.push({ path: route.path, query: { id } });
}

function openSource(row: FinanceRow) {
  if (!row.sourceRoute) return;
  router.push(row.sourceRoute);
}

function isKnownAction(moduleKey: FinanceModule['key'], action: string) {
  return Boolean(action && financePageActions[moduleKey]?.some((item) => item.key === action));
}

function normalizeFinanceAction(moduleKey: FinanceModule['key'], action: string) {
  if (!action || action === 'new') return '';
  const configuredAction = financePageActions[moduleKey]?.find((item) => item.key === action || item.label === action);
  if (configuredAction) return configuredAction.key;
  const aliases: Record<FinanceModule['key'], Record<string, string>> = {
    receivables: {
      应收列表: '',
      收款登记: 'receive',
      核销收款: 'settle',
      应收调整: 'adjust',
      客户对账: 'reconcile',
    },
    payables: {
      应付列表: '',
      付款申请: 'apply',
      付款登记: 'pay',
      付款核销: 'settle',
      收票认证: 'invoice',
      三单匹配: 'match',
      供应商对账: 'reconcile',
    },
    invoices: {
      发票列表: '',
      销项开票: 'output',
      进项认证: 'input',
      进项收票认证: 'input',
      发票勾稽: 'match',
      红冲处理: 'red',
    },
    settlements: {
      收付列表: '',
      资金列表: '',
      收款登记: 'receive',
      付款登记: 'pay',
      退款付款: 'refund',
      核销: 'settle',
      核销处理: 'settle',
      银行对账: 'bank',
    },
  };
  return aliases[moduleKey]?.[action] || '';
}

function isFinanceListAlias(moduleKey: FinanceModule['key'], action: string) {
  const aliases: Record<FinanceModule['key'], string[]> = {
    receivables: ['应收列表'],
    payables: ['应付列表'],
    invoices: ['发票列表'],
    settlements: ['收付列表', '资金列表'],
  };
  return aliases[moduleKey]?.includes(action) || false;
}

function statusTone(status: string) {
  if (/已|完成/.test(status)) return 'green';
  if (/异常|差异|逾期|红冲/.test(status)) return 'red';
  if (/部分|待/.test(status)) return 'yellow';
  return 'gray';
}

function valueOf(row: FinanceRow, key: string) {
  if (isMoneyField(key, '')) return formatMoney(row[key]);
  return row[key] || '-';
}

function financeCellValue(value: unknown, column: Pick<AwTableColumn, 'key' | 'title'>) {
  if (isMoneyField(column.key, column.title)) return formatMoney(value);
  return value ?? '-';
}

function moduleDateLabel(key: FinanceModule['key']) {
  const labels: Record<FinanceModule['key'], string> = {
    receivables: '到期日',
    payables: '到期日',
    invoices: '开票/收票日期',
    settlements: '到账/付款日期',
  };
  return labels[key];
}

function sourceRefDisplay(row: FinanceRow) {
  const type = row.sourceType || row.sourceRefType || 'manual';
  const code = row.sourceCode || 'manual';
  return `${type} / ${code}`;
}

function matchRefDisplay(row: FinanceRow) {
  const order = row.purchaseOrderCode || '-';
  const inbound = row.inboundCode || '-';
  const invoice = row.invoiceCode || '-';
  return `订单 ${order} / 入库 ${inbound} / 发票 ${invoice}`;
}

function buildSummaryCards(key: FinanceModule['key'], rows: FinanceRow[]): FinanceSummaryCard[] {
  const totalAmount = sumRows(rows, 'amount');
  const unsettledAmount = sumRows(rows, 'unsettledAmount');
  const pendingSettlementCount = rows.filter((row) => !includesText(row.settlementStatus, '已核销')).length;

  if (key === 'receivables') {
    const overdueAmount = sumRows(rows.filter((row) => isOverdue(row.dueDate) && parseMoney(row.unsettledAmount) > 0), 'unsettledAmount');
    return [
      { key: 'amount', label: '应收总额', value: formatMoney(totalAmount), hint: `${rows.length} 条应收单` },
      { key: 'unsettled', label: '未收金额', value: formatMoney(unsettledAmount), hint: '来自当前列表未收金额' },
      { key: 'overdue', label: '逾期金额', value: formatMoney(overdueAmount), hint: '到期日早于今天且未收' },
      { key: 'pending', label: '待核销', value: `${pendingSettlementCount} 条`, hint: '核销状态未完成' },
    ];
  }

  if (key === 'payables') {
    const pendingMatchCount = rows.filter((row) => !includesText(row.matchStatus, '已匹配')).length;
    const payableCount = rows.filter((row) => parseMoney(row.unsettledAmount) > 0 && !includesText(row.status, '已核销')).length;
    return [
      { key: 'amount', label: '应付总额', value: formatMoney(totalAmount), hint: `${rows.length} 条应付单` },
      { key: 'unsettled', label: '未付金额', value: formatMoney(unsettledAmount), hint: '来自当前列表未付金额' },
      { key: 'match', label: '待三单匹配', value: `${pendingMatchCount} 条`, hint: '三单匹配未完成' },
      { key: 'pay', label: '待付款', value: `${payableCount} 条`, hint: '未付金额大于 0' },
    ];
  }

  if (key === 'invoices') {
    const pendingOutputCount = rows.filter((row) => includesText(row.status, '待开票')).length;
    const pendingCertCount = rows.filter((row) => includesText(`${row.status}${row.matchStatus}${row.certificationStatus}`, '待认证')).length;
    const exceptionCount = rows.filter((row) => includesText(`${row.status}${row.matchStatus}`, '异常')).length;
    const redAmount = sumRows(rows.filter((row) => includesText(row.direction, '红冲') || String(row.code || '').startsWith('RED')), 'amount');
    return [
      { key: 'amount', label: '价税合计', value: formatMoney(totalAmount), hint: `${rows.length} 条发票记录` },
      { key: 'output', label: '待开票', value: `${pendingOutputCount} 条`, hint: '销项开票待处理' },
      { key: 'cert', label: '待认证', value: `${pendingCertCount} 条`, hint: '进项收票认证待处理' },
      { key: 'red', label: '红冲金额', value: formatMoney(redAmount), hint: exceptionCount ? `${exceptionCount} 条异常` : '红冲记录汇总' },
    ];
  }

  const pendingConfirmCount = rows.filter((row) => includesText(row.status, '待确认')).length;
  const pendingReconcileCount = rows.filter((row) => !includesText(row.reconcileStatus, '已对账')).length;
  const diffCount = rows.filter((row) => includesText(row.reconcileStatus, '差异')).length;
  return [
    { key: 'amount', label: '流水金额', value: formatMoney(totalAmount), hint: `${rows.length} 条收付流水` },
    { key: 'unsettled', label: '可核销金额', value: formatMoney(unsettledAmount), hint: '来自当前列表可核销金额' },
    { key: 'confirm', label: '待确认流水', value: `${pendingConfirmCount} 条`, hint: '流水状态待确认' },
    { key: 'reconcile', label: '待银行对账', value: `${pendingReconcileCount} 条`, hint: diffCount ? `${diffCount} 条差异待处理` : '对账状态未完成' },
  ];
}

function actionLabel(moduleKey: FinanceModule['key'], actionKey: string) {
  return financePageActions[moduleKey]?.find((action) => action.key === actionKey)?.label || '账款处理';
}

function actionCreateLabel(moduleKey: FinanceModule['key'], actionKey: string) {
  const map: Record<string, string> = {
    'receivables.receive': '登记收款',
    'receivables.settle': '开始核销',
    'receivables.adjust': '发起应收调整',
    'receivables.reconcile': '生成客户对账单',
    'payables.apply': '发起付款申请',
    'payables.pay': '登记付款',
    'payables.settle': '开始付款核销',
    'payables.invoice': '登记收票认证',
    'payables.match': '开始三单匹配',
    'payables.reconcile': '生成供应商对账单',
    'invoices.output': '开具销项发票',
    'invoices.input': '登记进项收票',
    'invoices.match': '建立发票勾稽',
    'invoices.red': '发起红冲',
    'settlements.receive': '登记收款流水',
    'settlements.pay': '登记付款流水',
    'settlements.refund': '登记退款付款',
    'settlements.settle': '开始核销',
    'settlements.bank': '导入/匹配银行流水',
  };
  return map[`${moduleKey}.${actionKey}`] || `处理${actionLabel(moduleKey, actionKey)}`;
}

function buildActionSummaryCards(moduleKey: FinanceModule['key'], actionKey: string, rows: FinanceRow[]): FinanceSummaryCard[] {
  if (moduleKey === 'receivables') {
    if (actionKey === 'receive') {
      const pendingRows = rows.filter((row) => parseMoney(row.unsettledAmount) > 0);
      return [
        { key: 'pendingAmount', label: '待登记收款', value: formatMoney(sumRows(pendingRows, 'unsettledAmount')), hint: `${pendingRows.length} 条未收应收` },
        { key: 'received', label: '已收金额', value: formatMoney(sumRows(rows, 'settledAmount')), hint: '来自应收列表已收金额' },
        { key: 'source', label: '销售来源', value: `${countRowsByCenter(rows, '销售')} 条`, hint: '销售订单/合同回款' },
        { key: 'credit', label: '待释放信用', value: formatMoney(sumRows(pendingRows, 'creditOccupied')), hint: '登记后进入核销释放' },
      ];
    }
    if (actionKey === 'settle') {
      const pendingRows = rows.filter((row) => !includesText(row.settlementStatus, '已核销'));
      return [
        { key: 'pending', label: '待核销收款', value: `${pendingRows.length} 条`, hint: '核销状态未完成' },
        { key: 'amount', label: '可核销金额', value: formatMoney(sumRows(pendingRows, 'unsettledAmount')), hint: '按未收金额汇总' },
        { key: 'invoice', label: '已开票待核销', value: `${pendingRows.filter((row) => includesText(row.invoiceStatus, '已开票')).length} 条`, hint: '核销后回写开票/回款状态' },
        { key: 'writeBack', label: '回写目标', value: `${pendingRows.length} 个`, hint: '销售订单、合同、客户信用' },
      ];
    }
    if (actionKey === 'adjust') {
      const adjustRows = rows.filter((row) => parseMoney(row.amount) < 0 || includesText(row.sourceType, '售后'));
      return [
        { key: 'adjustAmount', label: '待调整金额', value: formatMoney(sumRows(adjustRows, 'amount')), hint: '售后退货/退款影响应收' },
        { key: 'adjustRows', label: '调整单据', value: `${adjustRows.length} 条`, hint: '来自当前应收列表' },
        { key: 'red', label: '待红冲', value: `${adjustRows.filter((row) => includesText(row.invoiceStatus, '红冲')).length} 条`, hint: '需要联动发票红冲' },
        { key: 'afterSales', label: '售后来源', value: `${countRowsByCenter(adjustRows, '售后')} 条`, hint: '回写售后账款处理状态' },
      ];
    }
    if (actionKey === 'reconcile') {
      const customerCount = new Set(rows.map((row) => row.counterpartyName).filter(Boolean)).size;
      return [
        { key: 'customer', label: '对账客户', value: `${customerCount} 家`, hint: '按当前应收列表客户汇总' },
        { key: 'amount', label: '对账金额', value: formatMoney(sumRows(rows, 'amount')), hint: '应收总额' },
        { key: 'unsettled', label: '未收差额', value: formatMoney(sumRows(rows, 'unsettledAmount')), hint: '用于客户确认' },
        { key: 'overdue', label: '逾期客户', value: `${rows.filter((row) => isOverdue(row.dueDate) && parseMoney(row.unsettledAmount) > 0).length} 条`, hint: '到期日早于今天' },
      ];
    }
  }

  if (moduleKey === 'payables') {
    if (actionKey === 'match') {
      const pendingRows = rows.filter((row) => !includesText(row.matchStatus, '已匹配'));
      return [
        { key: 'pending', label: '待三单匹配', value: `${pendingRows.length} 条`, hint: '订单/入库/发票未完全匹配' },
        { key: 'amount', label: '待匹配金额', value: formatMoney(sumRows(pendingRows, 'amount')), hint: '应付金额汇总' },
        { key: 'deduct', label: '质检扣款', value: formatMoney(sumRows(rows, 'qualityDeduction')), hint: '影响可付款金额' },
        { key: 'invoice', label: '待到票', value: `${rows.filter((row) => includesText(row.invoiceStatus, '待到票')).length} 条`, hint: '到票后再匹配' },
      ];
    }
    if (actionKey === 'reconcile') {
      const supplierCount = new Set(rows.map((row) => row.counterpartyName).filter(Boolean)).size;
      return [
        { key: 'supplier', label: '对账供应商', value: `${supplierCount} 家`, hint: '按当前应付列表供应商汇总' },
        { key: 'amount', label: '对账金额', value: formatMoney(sumRows(rows, 'amount')), hint: '应付总额' },
        { key: 'unsettled', label: '未付差额', value: formatMoney(sumRows(rows, 'unsettledAmount')), hint: '用于供应商确认' },
        { key: 'invoice', label: '待到票', value: `${rows.filter((row) => includesText(row.invoiceStatus, '待到票')).length} 条`, hint: '对账时校验到票状态' },
      ];
    }
    const pendingRows = rows.filter((row) => parseMoney(row.unsettledAmount) > 0);
    return [
      { key: 'pending', label: actionKey === 'invoice' ? '待收票认证' : '待付款应付', value: `${pendingRows.length} 条`, hint: '来自当前应付列表' },
      { key: 'amount', label: actionKey === 'invoice' ? '待认证金额' : '可付款金额', value: formatMoney(sumRows(pendingRows, 'unsettledAmount')), hint: '按未付金额汇总' },
      { key: 'supplier', label: '供应商', value: `${new Set(pendingRows.map((row) => row.counterpartyName).filter(Boolean)).size} 家`, hint: '按往来单位去重' },
      { key: 'writeBack', label: '回写采购', value: `${pendingRows.length} 条`, hint: '采购订单付款/到票状态' },
    ];
  }

  if (moduleKey === 'invoices') {
    const redRows = rows.filter((row) => includesText(row.direction, '红冲') || String(row.code || '').startsWith('RED'));
    const inputRows = rows.filter((row) => includesText(row.direction, '进项'));
    const outputRows = rows.filter((row) => includesText(row.direction, '销项'));
    return [
      { key: 'amount', label: actionKey === 'red' ? '红冲金额' : '处理金额', value: formatMoney(sumRows(actionKey === 'red' ? redRows : rows, 'amount')), hint: '来自当前发票列表' },
      { key: 'output', label: '销项记录', value: `${outputRows.length} 条`, hint: '销售开票回写' },
      { key: 'input', label: '进项记录', value: `${inputRows.length} 条`, hint: '采购收票认证' },
      { key: 'red', label: '红冲记录', value: `${redRows.length} 条`, hint: '售后红冲校验' },
    ];
  }

  const targetRows = actionKey === 'refund' ? rows.filter((row) => includesText(row.direction, '退款')) : rows;
  return [
    { key: 'amount', label: '流水金额', value: formatMoney(sumRows(targetRows, 'amount')), hint: `${targetRows.length} 条收付流水` },
    { key: 'unsettled', label: '可核销金额', value: formatMoney(sumRows(targetRows, 'unsettledAmount')), hint: '按可核销金额汇总' },
    { key: 'confirm', label: '待确认', value: `${targetRows.filter((row) => includesText(row.status, '待确认')).length} 条`, hint: '付款/到账待确认' },
    { key: 'bank', label: '待对账', value: `${targetRows.filter((row) => !includesText(row.reconcileStatus, '已对账')).length} 条`, hint: '银行流水匹配' },
  ];
}

function actionFields(moduleKey: FinanceModule['key'], actionKey: string, rows: FinanceRow[]): FinanceActionField[] {
  const first = rows[0] || {};
  const label = actionLabel(moduleKey, actionKey);
  return [
    { label: '处理页面', value: label },
    { label: '默认来源', value: first.sourceCode || '请选择来源单据' },
    { label: '往来单位', value: first.counterpartyName || '-' },
    { label: '业务中心', value: first.businessCenter || '-' },
    { label: '处理金额', value: formatMoney(sumRows(rows, actionKey === 'settle' || actionKey === 'receive' ? 'unsettledAmount' : 'amount')) },
    { label: '回写规则', value: actionWriteBackText(moduleKey, actionKey) },
  ];
}

function actionDetailTitle(moduleKey: FinanceModule['key'], actionKey: string) {
  if (moduleKey === 'receivables' && actionKey === 'reconcile') return '客户对账明细';
  if (moduleKey === 'receivables' && actionKey === 'adjust') return '应收调整明细';
  if (moduleKey === 'payables' && actionKey === 'match') return '三单匹配明细';
  if (moduleKey === 'payables' && actionKey === 'reconcile') return '供应商对账明细';
  if (moduleKey === 'settlements' && actionKey === 'bank') return '银行对账明细';
  return '待处理来源明细';
}

function actionRecordColumns(moduleKey: FinanceModule['key'], actionKey: string) {
  if (moduleKey === 'receivables' && actionKey === 'receive') return ['序号', '来源应收单', '客户', '来源单据', '待收金额', '建议账户', '收款状态', '处理说明'];
  if (moduleKey === 'receivables' && actionKey === 'settle') return ['序号', '来源应收单', '客户', '来源单据', '可核销金额', '本次建议核销', '回写目标', '核销状态'];
  if (moduleKey === 'receivables' && actionKey === 'reconcile') return ['序号', '客户', '应收金额', '已收金额', '未收金额', '到期日', '对账状态'];
  if (moduleKey === 'receivables' && actionKey === 'adjust') return ['序号', '来源单据', '客户', '调整金额', '调整原因', '回写目标'];
  if (moduleKey === 'payables' && actionKey === 'apply') return ['序号', '来源应付单', '供应商', '来源单据', '申请金额', '付款条件', '审批状态'];
  if (moduleKey === 'payables' && actionKey === 'pay') return ['序号', '来源应付单', '供应商', '来源单据', '付款金额', '建议账户', '付款状态'];
  if (moduleKey === 'payables' && actionKey === 'settle') return ['序号', '来源应付单', '供应商', '来源单据', '可核销金额', '本次建议核销', '核销状态'];
  if (moduleKey === 'payables' && actionKey === 'invoice') return ['序号', '来源应付单', '供应商', '进项发票', '到票金额', '认证状态', '回写目标'];
  if (moduleKey === 'payables' && actionKey === 'match') return ['序号', '采购订单', '入库记录', '进项发票', '供应商', '应付金额', '三单匹配', '可付款金额'];
  if (moduleKey === 'payables' && actionKey === 'reconcile') return ['序号', '供应商', '应付金额', '已付金额', '未付金额', '到期日', '对账状态'];
  if (moduleKey === 'invoices' && actionKey === 'output') return ['序号', '销项开票单号', '客户', '来源单据', '开票金额', '税额', '开票状态'];
  if (moduleKey === 'invoices' && actionKey === 'input') return ['序号', '进项发票', '供应商', '来源单据', '认证金额', '税额', '认证状态'];
  if (moduleKey === 'invoices' && actionKey === 'match') return ['序号', '发票记录', '往来单位', '来源单据', '勾稽金额', '勾稽状态', '回写目标'];
  if (moduleKey === 'invoices' && actionKey === 'red') return ['序号', '红冲单号', '往来单位', '来源单据', '红冲金额', '红冲状态', '售后校验'];
  if (moduleKey === 'settlements' && actionKey === 'receive') return ['序号', '收款流水号', '客户', '来源单据', '收款金额', '账户', '核销状态'];
  if (moduleKey === 'settlements' && actionKey === 'pay') return ['序号', '付款流水号', '供应商', '来源单据', '付款金额', '账户', '核销状态'];
  if (moduleKey === 'settlements' && actionKey === 'refund') return ['序号', '退款付款单号', '售后客户', '售后单据', '退款金额', '账户', '付款状态'];
  if (moduleKey === 'settlements' && actionKey === 'settle') return ['序号', '核销流水号', '往来单位', '来源单据', '可核销金额', '已核销金额', '核销状态'];
  if (moduleKey === 'settlements' && actionKey === 'bank') return ['序号', '流水单号', '往来单位', '金额', '账户', '对账状态', '差异金额'];
  return ['序号', '来源单据', '往来单位', '金额', '已处理', '待处理', '状态'];
}

function actionRecordRows(moduleKey: FinanceModule['key'], actionKey: string, rows: FinanceRow[]) {
  if (moduleKey === 'receivables' && actionKey === 'receive') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.sourceCode || '-', row.unsettledAmount || '0.00', '招商银行基本户', row.status || '-', '登记收款后进入核销']);
  }
  if (moduleKey === 'receivables' && actionKey === 'settle') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.sourceCode || '-', row.unsettledAmount || '0.00', row.unsettledAmount || '0.00', row.writeBackTarget || '-', row.settlementStatus || '-']);
  }
  if (moduleKey === 'receivables' && actionKey === 'reconcile') {
    return rows.map((row, index) => [String(index + 1), row.counterpartyName || '-', row.amount || '0.00', row.settledAmount || '0.00', row.unsettledAmount || '0.00', row.dueDate || '-', row.settlementStatus || row.status || '-']);
  }
  if (moduleKey === 'receivables' && actionKey === 'adjust') {
    return rows.filter((row) => parseMoney(row.amount) < 0 || includesText(row.sourceType, '售后')).map((row, index) => [String(index + 1), row.sourceCode || '-', row.counterpartyName || '-', row.amount || '0.00', row.sourceType || '-', row.writeBackTarget || '-']);
  }
  if (moduleKey === 'payables' && actionKey === 'apply') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.sourceCode || '-', row.unsettledAmount || '0.00', row.paymentCondition || '-', '待审批']);
  }
  if (moduleKey === 'payables' && actionKey === 'pay') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.sourceCode || '-', row.unsettledAmount || '0.00', '建设银行一般户', row.status || '-']);
  }
  if (moduleKey === 'payables' && actionKey === 'settle') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.sourceCode || '-', row.unsettledAmount || '0.00', row.unsettledAmount || '0.00', row.settlementStatus || '-']);
  }
  if (moduleKey === 'payables' && actionKey === 'invoice') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.invoiceCode || '待到票', row.amount || '0.00', row.invoiceStatus || '-', row.writeBackTarget || '-']);
  }
  if (moduleKey === 'payables' && actionKey === 'match') {
    return rows.map((row, index) => [String(index + 1), row.purchaseOrderCode || '-', row.inboundCode || '-', row.invoiceCode || '待到票', row.counterpartyName || '-', row.amount || '0.00', row.matchStatus || '-', row.payableAmount || row.unsettledAmount || '0.00']);
  }
  if (moduleKey === 'payables' && actionKey === 'reconcile') {
    return rows.map((row, index) => [String(index + 1), row.counterpartyName || '-', row.amount || '0.00', row.settledAmount || '0.00', row.unsettledAmount || '0.00', row.dueDate || '-', row.settlementStatus || row.status || '-']);
  }
  if (moduleKey === 'invoices' && actionKey === 'output') {
    return rows.map((row, index) => [String(index + 1), row.code || `OUT-INV-${index + 1}`, row.counterpartyName || '-', row.sourceCode || '-', row.amount || '0.00', row.taxAmount || '0.00', row.status || '-']);
  }
  if (moduleKey === 'invoices' && actionKey === 'input') {
    return rows.map((row, index) => [String(index + 1), row.code || `IN-INV-${index + 1}`, row.counterpartyName || '-', row.sourceCode || '-', row.amount || '0.00', row.taxAmount || '0.00', row.certificationStatus || row.status || '-']);
  }
  if (moduleKey === 'invoices' && actionKey === 'match') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.sourceCode || '-', row.amount || '0.00', row.matchStatus || '-', row.writeBackTarget || '-']);
  }
  if (moduleKey === 'invoices' && actionKey === 'red') {
    return rows.map((row, index) => [String(index + 1), row.code || `RED-${index + 1}`, row.counterpartyName || '-', row.sourceCode || '-', row.amount || '0.00', row.redStatus || row.status || '-', '售后红冲校验']);
  }
  if (moduleKey === 'settlements' && ['receive', 'pay', 'refund', 'settle'].includes(actionKey)) {
    return rows.map((row, index) => [String(index + 1), row.code || `SET-${index + 1}`, row.counterpartyName || '-', row.sourceCode || '-', row.amount || row.unsettledAmount || '0.00', row.accountName || '-', row.settlementStatus || row.status || '-']);
  }
  if (moduleKey === 'settlements' && actionKey === 'bank') {
    return rows.map((row, index) => [String(index + 1), row.code || '-', row.counterpartyName || '-', row.amount || '0.00', row.accountName || '-', row.reconcileStatus || '-', row.unreconciledAmount || '0.00']);
  }
  return rows.map((row, index) => [String(index + 1), row.sourceCode || row.code || '-', row.counterpartyName || '-', row.amount || '0.00', row.settledAmount || '0.00', row.unsettledAmount || '0.00', row.status || row.settlementStatus || '-']);
}

function actionTableColumns(moduleKey: FinanceModule['key'], actionKey: string): AwTableColumn[] {
  return [
    ...actionRecordColumns(moduleKey, actionKey).slice(1).map((title, index) => ({
      key: `col${index}`,
      title,
      width: index === 0 ? 160 : 130,
    })),
    { key: 'action', title: '操作', width: 80, fixed: 'right' as const },
  ];
}

function actionTableRows(moduleKey: FinanceModule['key'], actionKey: string, rows: FinanceRow[]): FinanceRow[] {
  const baseRows = actionBaseRows(moduleKey, actionKey, rows);
  const recordRows = actionRecordRows(moduleKey, actionKey, baseRows);
  return recordRows.map((cells, index) => {
    const sourceRow = baseRows[index] || {};
    const row: FinanceRow = {
      ...sourceRow,
      id: `${moduleKey}-${actionKey}-${sourceRow.id || index}`,
      status: sourceRow.status || sourceRow.settlementStatus || cells[cells.length - 1] || '-',
      sourceId: sourceRow.id || '',
    };
    cells.slice(1).forEach((cell, cellIndex) => {
      row[`col${cellIndex}`] = cell;
    });
    return row;
  });
}

function actionBaseRows(moduleKey: FinanceModule['key'], actionKey: string, rows: FinanceRow[]) {
  if (moduleKey === 'receivables') {
    if (actionKey === 'receive' || actionKey === 'settle') return rows.filter((row) => parseMoney(row.unsettledAmount) > 0 || !includesText(row.settlementStatus, '已核销'));
    if (actionKey === 'adjust') return rows.filter((row) => parseMoney(row.amount) < 0 || includesText(row.sourceType, '售后'));
    return rows;
  }
  if (moduleKey === 'payables') {
    if (actionKey === 'match') return rows.filter((row) => !includesText(row.matchStatus, '已匹配'));
    if (actionKey === 'invoice') return rows.filter((row) => !includesText(row.invoiceStatus, '已认证'));
    return rows.filter((row) => parseMoney(row.unsettledAmount) > 0 || !includesText(row.settlementStatus, '已核销'));
  }
  if (moduleKey === 'invoices') {
    if (actionKey === 'output') return rows.filter((row) => includesText(row.direction, '销项'));
    if (actionKey === 'input') return rows.filter((row) => includesText(row.direction, '进项'));
    if (actionKey === 'red') return rows.filter((row) => includesText(row.direction, '红冲') || String(row.code || '').startsWith('RED'));
    return rows;
  }
  if (actionKey === 'receive') return rows.filter((row) => includesText(row.direction, '收款'));
  if (actionKey === 'pay') return rows.filter((row) => includesText(row.direction, '付款'));
  if (actionKey === 'refund') return rows.filter((row) => includesText(row.direction, '退款'));
  if (actionKey === 'bank') return rows.filter((row) => !includesText(row.reconcileStatus, '已对账'));
  return rows;
}

function actionWriteBackText(moduleKey: FinanceModule['key'], actionKey: string) {
  const map: Record<string, string> = {
    'receivables.receive': '登记收款后进入核销，准备释放客户信用',
    'receivables.settle': '回写销售订单已回款、合同回款和客户信用占用',
    'receivables.adjust': '回写售后应收调整、发票红冲校验',
    'receivables.reconcile': '只生成客户对账结果，不修改业务源明细',
    'payables.apply': '生成付款申请并校验可付款金额',
    'payables.pay': '回写采购订单付款状态',
    'payables.settle': '回写应付核销状态和可付款余额',
    'payables.invoice': '回写采购到票/认证状态',
    'payables.match': '记录订单、入库、发票三单匹配结果',
    'payables.reconcile': '只生成供应商对账结果，不修改采购源明细',
    'invoices.output': '回写销售开票状态',
    'invoices.input': '回写采购收票认证状态',
    'invoices.match': '记录发票勾稽关系',
    'invoices.red': '回写售后红冲状态',
    'settlements.receive': '核销到应收并回写已回款',
    'settlements.pay': '核销到应付并回写已付款',
    'settlements.refund': '付款确认后回写售后退款状态',
    'settlements.settle': '回写应收/应付/退款核销状态',
    'settlements.bank': '仅回写对账状态和差异结果',
  };
  return map[`${moduleKey}.${actionKey}`] || '只回写状态和汇总，不篡改业务源明细';
}

function financeFormConfig(module: FinanceModule, actionKey: string): FinanceFormConfig {
  if (!actionKey) return moduleFormConfig(module);
  return actionFormConfig(module, actionKey);
}

function moduleSourceCategories(module: FinanceModule): SourcePickerCategory[] {
  const map: Record<FinanceModule['key'], SourcePickerCategory[]> = {
    receivables: module.sourceCategories,
    payables: categories(['采购入库', '采购订单', '采购退货']),
    invoices: categories(['开票申请', '进项发票', '原发票', '售后单', '采购退货']),
    settlements: categories(['银行收款流水', '银行付款流水', '银行流水', '应收单', '应付单', '售后退款单']),
  };
  return map[module.key];
}

function moduleSourceTableText(module: FinanceModule): Partial<SourcePickerTableText> {
  const common = {
    customer: module.counterpartyLabel,
    metric: '可处理金额',
    emptyNoRows: '当前暂无可处理来源',
  };
  const map: Record<FinanceModule['key'], Partial<SourcePickerTableText>> = {
    receivables: {
      ...common,
      code: '业务单据',
      subject: '立账来源',
      date: '确认日期',
      metric: '可立账金额',
      emptyNoRows: '当前暂无已确认且未立账的应收来源',
    },
    payables: {
      ...common,
      code: '业务单据',
      subject: '立账来源',
      date: '确认日期',
      metric: '可立账金额',
      emptyNoRows: '当前暂无已入库/验收且未立账的应付来源',
    },
    invoices: {
      ...common,
      code: '发票业务',
      subject: '开票/收票来源',
      date: '业务日期',
      metric: '可开票/认证金额',
      emptyNoRows: '当前暂无可开票或可登记收票的来源',
    },
    settlements: {
      ...common,
      code: '收付/业务对象',
      subject: '收付或核销来源',
      date: '发生日期',
      metric: '流水/可核销金额',
      emptyNoRows: '当前暂无可登记或可核销来源',
    },
  };
  return map[module.key];
}

function moduleStatusOptions(module: FinanceModule): string[] {
  const map: Record<FinanceModule['key'], string[]> = {
    receivables: ['待立账', '待收款', '部分收款', '已核销'],
    payables: ['待暂估', '待付款', '部分付款', '已核销'],
    invoices: ['待开票', '待收票', '待认证', '待红冲'],
    settlements: ['待确认', '待对账', '待核销', '已核销'],
  };
  return map[module.key];
}

function moduleBatchTextMap(module: FinanceModule): Record<string, Partial<SourcePickerBatchText>> {
  if (module.key === 'receivables') {
    return {
      销售订单: {
        title: '出库/签收确认记录',
        no: '确认单号',
        date: '确认日期',
        warehouse: '确认仓库',
        logistics: '履约节点',
        qty: '可立账数量',
        amount: '可立账金额',
        empty: '当前销售订单暂无已签收且未立账记录',
        note: '只选择已出库、OQC/签收完成且未生成应收的确认记录。',
      },
      销售合同: {
        title: '合同收款计划/服务确认',
        no: '计划编号',
        date: '计划日期',
        warehouse: '确认节点',
        logistics: '结算方式',
        qty: '期数',
        amount: '可立账金额',
        empty: '当前销售合同暂无到期且未立账的收款计划',
        note: '合同类应收按收款计划或服务确认节点立账。',
      },
      售后单: {
        title: '售后应收调整节点',
        no: '调整节点',
        date: '确认日期',
        warehouse: '处理仓/节点',
        logistics: '调整类型',
        qty: '数量',
        amount: '调整金额',
        empty: '当前售后单暂无可立账调整节点',
        note: '售后来源只带入已完成退货/赔付确认且需要应收调整的节点。',
      },
    };
  }
  if (module.key === 'payables') {
    return {
      采购订单: {
        title: '入库/验收确认记录',
        no: '入库单号',
        date: '入库日期',
        warehouse: '入库仓库',
        logistics: '验收节点',
        qty: '可立账数量',
        amount: '可立账金额',
        empty: '当前采购订单暂无已入库且未立账记录',
        note: '只选择已入库、IQC/验收完成且未生成应付的确认记录。',
      },
      采购入库: {
        title: '入库暂估明细',
        no: '入库单号',
        date: '入库日期',
        warehouse: '入库仓库',
        logistics: '质检/验收',
        qty: '入库数量',
        amount: '暂估金额',
        empty: '当前采购入库暂无可暂估明细',
        note: '采购入库类应付按验收完成的入库明细立账。',
      },
      采购退货: {
        title: '退货冲减确认记录',
        no: '退货单号',
        date: '退货日期',
        warehouse: '退货仓库',
        logistics: '冲减节点',
        qty: '退货数量',
        amount: '冲减金额',
        empty: '当前采购退货暂无可冲减应付记录',
        note: '采购退货只带入已出库/已确认且需要冲减应付的节点。',
      },
    };
  }
  if (module.key === 'invoices') {
    return {
      开票申请: {
        title: '销项开票明细',
        no: '开票申请号',
        date: '申请日期',
        warehouse: '销售来源',
        logistics: '开票节点',
        qty: '开票项数',
        amount: '价税合计',
        empty: '当前暂无已审批且未开票的销项申请',
        note: '销项发票只选择已审批、未开票、金额未超来源的开票申请。',
      },
      进项发票: {
        title: '进项收票/认证明细',
        no: '进项发票号',
        date: '收票日期',
        warehouse: '采购来源',
        logistics: '认证节点',
        qty: '票数',
        amount: '价税合计',
        empty: '当前暂无待认证的进项发票',
        note: '进项发票按采购来源、到票金额和认证状态登记。',
      },
      原发票: {
        title: '红冲原发票信息',
        no: '原发票号',
        date: '原开票日期',
        warehouse: '红冲关联',
        logistics: '红冲类型',
        qty: '份数',
        amount: '可红冲金额',
        empty: '当前暂无可红冲原发票',
        note: '红冲必须选择原发票，并关联售后或采购退货等业务原因。',
      },
      售后单: {
        title: '售后红冲确认节点',
        no: '售后单号',
        date: '确认日期',
        warehouse: '售后节点',
        logistics: '红冲原因',
        qty: '数量',
        amount: '红冲金额',
        empty: '当前售后单暂无待红冲节点',
        note: '售后红冲只带入退货/折让已确认且原发票未红冲的节点。',
      },
      采购退货: {
        title: '采购退货红冲节点',
        no: '退货单号',
        date: '退货日期',
        warehouse: '采购来源',
        logistics: '进项红冲',
        qty: '退货数量',
        amount: '红冲金额',
        empty: '当前采购退货暂无待红冲节点',
        note: '采购退货红冲用于冲减已到票或已认证的进项发票。',
      },
    };
  }
  if (module.key === 'settlements') {
    return {
      银行收款流水: {
        title: '收款银行流水明细',
        no: '银行流水号',
        date: '到账日期',
        warehouse: '收款账户',
        logistics: '匹配对象',
        qty: '笔数',
        amount: '到账金额',
        empty: '当前暂无可登记收款银行流水',
        note: '收款流水需要匹配客户应收后再核销释放信用占用。',
      },
      银行付款流水: {
        title: '付款银行流水明细',
        no: '银行流水号',
        date: '付款日期',
        warehouse: '付款账户',
        logistics: '匹配对象',
        qty: '笔数',
        amount: '付款金额',
        empty: '当前暂无可登记付款银行流水',
        note: '付款流水需要匹配付款申请或应付单后回写付款/核销状态。',
      },
      银行流水: {
        title: '待对账银行流水',
        no: '银行流水号',
        date: '交易日期',
        warehouse: '银行账户',
        logistics: '对账状态',
        qty: '笔数',
        amount: '流水金额',
        empty: '当前暂无待对账银行流水',
        note: '银行流水用于与系统收付流水对账，差异需单独处理。',
      },
      应收单: {
        title: '待核销应收明细',
        no: '应收单号',
        date: '到期/确认日',
        warehouse: '建议收款账户',
        logistics: '销售来源',
        qty: '笔数',
        amount: '未收金额',
        empty: '当前暂无待核销应收',
        note: '应收单作为核销对象，不等同于银行到账流水。',
      },
      应付单: {
        title: '待核销应付明细',
        no: '应付单号',
        date: '到期/确认日',
        warehouse: '建议付款账户',
        logistics: '采购来源',
        qty: '笔数',
        amount: '未付金额',
        empty: '当前暂无待核销应付',
        note: '应付单需与付款申请或银行付款流水匹配后核销。',
      },
      售后退款单: {
        title: '售后退款付款节点',
        no: '售后单号',
        date: '退款日期',
        warehouse: '退款账户',
        logistics: '关闭校验',
        qty: '笔数',
        amount: '待退款金额',
        empty: '当前暂无待退款付款来源',
        note: '售后退款完成后才允许售后关闭校验通过。',
      },
    };
  }
  return {};
}

function moduleFormConfig(module: FinanceModule): FinanceFormConfig {
  return {
    id: `${module.key}.new`,
    title: module.createLabel,
    counterpartyLabel: module.counterpartyLabel,
    sourceCategories: moduleSourceCategories(module),
    lineColumns: module.lineColumns,
    formLines: module.formLines,
    pickerTitle: `选择${module.title}来源单据`,
    sourceButtonLabel: '选择来源单据',
    sourceMetricField: 'maxRefund',
    sourceTableText: moduleSourceTableText(module),
    batchTextMap: moduleBatchTextMap(module),
    showBatchAmount: true,
    writeBackText: '只回写状态和汇总，不修改业务源明细',
    statusOptions: moduleStatusOptions(module),
    extraFields: [
      { label: '业务类型', value: module.title, readonly: true },
      { label: '处理日期', value: '2026-05-31' },
    ],
    attachmentOptions: ['账款附件', '银行回单', '发票附件', '审批材料'],
    lineAddText: '新增明细',
    remarkPlaceholder: '请输入账款处理说明、差异原因、核销备注等',
  };
}

function actionFormConfig(module: FinanceModule, actionKey: string): FinanceFormConfig {
  const title = actionCreateLabel(module.key, actionKey);
  const base: FinanceFormConfig = {
    id: `${module.key}.${actionKey}`,
    title,
    counterpartyLabel: module.counterpartyLabel,
    sourceCategories: module.sourceCategories,
    lineColumns: module.lineColumns,
    formLines: module.formLines,
    pickerTitle: `选择${actionLabel(module.key, actionKey)}来源`,
    sourceButtonLabel: '选择处理对象',
    sourceMetricField: 'maxRefund',
    sourceTableText: {
      code: '处理对象编号',
      subject: '处理对象',
      customer: module.counterpartyLabel,
      date: '业务日期',
      metric: '可处理金额',
      emptyNoRows: '当前暂无可处理对象',
    },
    writeBackText: actionWriteBackText(module.key, actionKey),
    statusOptions: ['待确认', '处理中', '已完成'],
    extraFields: [{ label: '处理动作', value: actionLabel(module.key, actionKey), readonly: true }],
    attachmentOptions: ['账款附件', '银行回单', '发票附件', '审批材料'],
    lineAddText: '新增处理明细',
    remarkPlaceholder: `请输入${actionLabel(module.key, actionKey)}说明、差异原因或处理备注`,
    showBatches: false,
  };

  const configs: Record<string, Partial<FinanceFormConfig>> = {
    'receivables.receive': {
      counterpartyLabel: '客户',
      sourceCategories: categories(['应收单', '银行收款流水']),
      lineColumns: columns([
        ['sourceCode', '应收单号'],
        ['counterpartyName', '客户'],
        ['sourceTitle', '来源单据'],
        ['pendingAmount', '未收金额'],
        ['amount', '本次收款'],
        ['status', '收款状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AR-202605-001', counterpartyName: '海南微为科技', sourceTitle: 'SO-202605-001 发货应收', pendingAmount: '39,590.00', amount: '39,590.00', status: '待登记' }],
      pickerTitle: '选择待收款应收单',
      sourceButtonLabel: '选择应收单',
      statusOptions: ['待登记', '已登记', '待核销'],
      extraFields: [
        { label: '收款账户', value: '招商银行基本户' },
        { label: '收款方式', options: ['银行转账', '承兑汇票', '现金', '其他'] },
        { label: '到账日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('receivables', 'receive'), readonly: true },
      ],
      attachmentOptions: ['银行回单', '收款凭证', '客户付款截图', '审批材料'],
    },
    'receivables.settle': {
      counterpartyLabel: '客户',
      sourceCategories: categories(['应收单', '银行收款流水']),
      lineColumns: columns([
        ['sourceCode', '应收单号'],
        ['flowCode', '收款流水'],
        ['counterpartyName', '客户'],
        ['pendingAmount', '可核销金额'],
        ['amount', '本次核销'],
        ['status', '核销状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AR-202605-001', flowCode: 'BANK-20260517-001', counterpartyName: '海南微为科技', pendingAmount: '39,590.00', amount: '20,000.00', status: '部分核销' }],
      pickerTitle: '选择应收单或收款流水',
      sourceButtonLabel: '选择核销对象',
      statusOptions: ['待核销', '部分核销', '已核销', '差异待处理'],
      extraFields: [
        { label: '核销方式', options: ['自动匹配', '手工指定', '差异核销'] },
        { label: '差异金额', value: '0.00' },
        { label: '回写规则', value: actionWriteBackText('receivables', 'settle'), readonly: true },
      ],
    },
    'receivables.adjust': {
      counterpartyLabel: '客户',
      sourceCategories: categories(['售后单', '应收单', '原发票']),
      lineColumns: columns([
        ['sourceCode', '售后/应收来源'],
        ['counterpartyName', '客户'],
        ['sourceTitle', '调整原因'],
        ['amount', '调整金额'],
        ['invoiceStatus', '红冲状态'],
        ['status', '关闭校验'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AS-202605-006', counterpartyName: '深圳云启制造', sourceTitle: '退货应收调整', amount: '-8,600.00', invoiceStatus: '待红冲', status: '未满足关闭' }],
      pickerTitle: '选择售后或原应收',
      sourceButtonLabel: '选择调整来源',
      statusOptions: ['待调整', '已调整', '待红冲', '已关闭'],
      extraFields: [
        { label: '调整类型', options: ['售后退货', '折让', '差价补偿', '手工调整'] },
        { label: '是否影响开票', options: ['需要红冲', '无需红冲'] },
        { label: '回写规则', value: actionWriteBackText('receivables', 'adjust'), readonly: true },
      ],
    },
    'receivables.reconcile': {
      counterpartyLabel: '客户',
      sourceCategories: categories(['应收单', '客户对账单']),
      lineColumns: columns([
        ['counterpartyName', '客户'],
        ['sourceCode', '应收单'],
        ['amount', '应收金额'],
        ['handledAmount', '已收金额'],
        ['pendingAmount', '未收差额'],
        ['status', '对账状态'],
      ]),
      formLines: [{ id: '1', counterpartyName: '广州新城智能', sourceCode: 'AR-202605-002', amount: '42,800.00', handledAmount: '0.00', pendingAmount: '42,800.00', status: '待确认' }],
      pickerTitle: '选择客户应收范围',
      sourceButtonLabel: '选择对账范围',
      statusOptions: ['待生成', '待客户确认', '已确认', '争议中'],
      extraFields: [
        { label: '对账期间', value: '2026-05-01 至 2026-05-31' },
        { label: '对账口径', options: ['按客户汇总', '按订单明细', '按合同明细'] },
        { label: '回写规则', value: actionWriteBackText('receivables', 'reconcile'), readonly: true },
      ],
    },
    'payables.apply': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['应付单']),
      lineColumns: columns([
        ['sourceCode', '应付单号'],
        ['counterpartyName', '供应商'],
        ['sourceTitle', '来源单据'],
        ['pendingAmount', '可申请金额'],
        ['amount', '申请金额'],
        ['status', '审批状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AP-202605-001', counterpartyName: '深圳华芯电子', sourceTitle: 'IN-202605-018 采购入库', pendingAmount: '56,200.00', amount: '56,200.00', status: '待审批' }],
      pickerTitle: '选择可付款应付单',
      sourceButtonLabel: '选择应付单',
      statusOptions: ['待审批', '已通过', '已驳回', '已付款'],
      extraFields: [
        { label: '付款账户', value: '建设银行一般户' },
        { label: '付款条件', value: '到票后月结30天' },
        { label: '回写规则', value: actionWriteBackText('payables', 'apply'), readonly: true },
      ],
    },
    'payables.pay': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['付款申请', '应付单']),
      lineColumns: columns([
        ['sourceCode', '付款申请/应付单'],
        ['counterpartyName', '供应商'],
        ['accountName', '付款账户'],
        ['pendingAmount', '待付金额'],
        ['amount', '本次付款'],
        ['status', '付款状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'PAY-APP-202605-001', counterpartyName: '深圳华芯电子', accountName: '建设银行一般户', pendingAmount: '56,200.00', amount: '30,000.00', status: '待付款' }],
      pickerTitle: '选择付款申请',
      sourceButtonLabel: '选择付款申请',
      statusOptions: ['待付款', '已付款', '付款失败', '待核销'],
      extraFields: [
        { label: '付款方式', options: ['银行转账', '承兑汇票', '现金', '其他'] },
        { label: '付款日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('payables', 'pay'), readonly: true },
      ],
      attachmentOptions: ['银行回单', '付款审批单', '供应商收款确认', '审批材料'],
    },
    'payables.settle': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['应付单', '银行付款流水']),
      lineColumns: columns([
        ['sourceCode', '应付单号'],
        ['flowCode', '付款流水'],
        ['counterpartyName', '供应商'],
        ['pendingAmount', '可核销金额'],
        ['amount', '本次核销'],
        ['status', '核销状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AP-202605-001', flowCode: 'BANK-20260518-004', counterpartyName: '深圳华芯电子', pendingAmount: '56,200.00', amount: '30,000.00', status: '部分核销' }],
      pickerTitle: '选择应付单或付款流水',
      sourceButtonLabel: '选择核销对象',
      statusOptions: ['待核销', '部分核销', '已核销', '差异待处理'],
      extraFields: [
        { label: '核销方式', options: ['自动匹配', '手工指定', '差异核销'] },
        { label: '回写规则', value: actionWriteBackText('payables', 'settle'), readonly: true },
      ],
    },
    'payables.invoice': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['采购订单', '采购入库', '进项发票']),
      lineColumns: columns([
        ['sourceCode', '采购来源'],
        ['invoiceCode', '进项发票'],
        ['counterpartyName', '供应商'],
        ['amount', '到票金额'],
        ['taxAmount', '税额'],
        ['status', '认证状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'PO-202605-018', invoiceCode: 'PINV-202605-004', counterpartyName: '深圳华芯电子', amount: '86,200.00', taxAmount: '9,916.81', status: '待认证' }],
      pickerTitle: '选择采购来源或进项发票',
      sourceButtonLabel: '选择收票来源',
      statusOptions: ['待收票', '待认证', '已认证', '异常'],
      extraFields: [
        { label: '发票类型', options: ['增值税专票', '增值税普票', '电子发票'] },
        { label: '认证日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('payables', 'invoice'), readonly: true },
      ],
      attachmentOptions: ['发票附件', '认证结果', '采购合同', '审批材料'],
    },
    'payables.match': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['采购订单', '采购入库', '进项发票']),
      lineColumns: columns([
        ['purchaseOrderCode', '采购订单'],
        ['inboundCode', '入库记录'],
        ['invoiceCode', '进项发票'],
        ['amount', '订单金额'],
        ['invoiceAmount', '到票金额'],
        ['status', '匹配状态'],
      ]),
      formLines: [{ id: '1', purchaseOrderCode: 'PO-202605-018', inboundCode: 'IN-202605-018', invoiceCode: 'PINV-202605-004', amount: '86,200.00', invoiceAmount: '86,200.00', status: '部分匹配' }],
      pickerTitle: '选择三单匹配来源',
      sourceButtonLabel: '选择 PO / IN / PINV',
      statusOptions: ['待匹配', '部分匹配', '已匹配', '差异待处理'],
      extraFields: [
        { label: '匹配策略', options: ['按来源行匹配', '按订单汇总匹配', '差异审批匹配'] },
        { label: '允许差异', value: '0.00' },
        { label: '回写规则', value: actionWriteBackText('payables', 'match'), readonly: true },
      ],
    },
    'payables.reconcile': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['应付单', '供应商对账单']),
      lineColumns: columns([
        ['counterpartyName', '供应商'],
        ['sourceCode', '应付单'],
        ['amount', '应付金额'],
        ['handledAmount', '已付金额'],
        ['pendingAmount', '未付差额'],
        ['status', '对账状态'],
      ]),
      formLines: [{ id: '1', counterpartyName: '东莞科创包装', sourceCode: 'AP-EST-202605-002', amount: '9,600.00', handledAmount: '0.00', pendingAmount: '9,600.00', status: '待确认' }],
      pickerTitle: '选择供应商应付范围',
      sourceButtonLabel: '选择对账范围',
      statusOptions: ['待生成', '待供应商确认', '已确认', '争议中'],
      extraFields: [
        { label: '对账期间', value: '2026-05-01 至 2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('payables', 'reconcile'), readonly: true },
      ],
    },
    'invoices.output': {
      counterpartyLabel: '客户',
      sourceCategories: categories(['销售订单', '销售合同', '开票申请']),
      lineColumns: columns([
        ['sourceCode', '销售来源'],
        ['counterpartyName', '客户'],
        ['amount', '价税合计'],
        ['taxAmount', '税额'],
        ['invoiceType', '发票类型'],
        ['status', '开票状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'SO-202605-001', counterpartyName: '海南微为科技', amount: '59,590.00', taxAmount: '6,855.49', invoiceType: '增值税专票', status: '待开票' }],
      pickerTitle: '选择销售开票来源',
      sourceButtonLabel: '选择开票申请',
      statusOptions: ['待开票', '已开票', '异常'],
      extraFields: [
        { label: '发票方向', value: '销项', readonly: true },
        { label: '开票日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('invoices', 'output'), readonly: true },
      ],
    },
    'invoices.input': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['采购订单', '进项发票']),
      lineColumns: columns([
        ['sourceCode', '采购来源'],
        ['invoiceCode', '进项发票'],
        ['counterpartyName', '供应商'],
        ['amount', '认证金额'],
        ['taxAmount', '税额'],
        ['status', '认证状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'PO-202605-018', invoiceCode: 'PINV-202605-004', counterpartyName: '深圳华芯电子', amount: '86,200.00', taxAmount: '9,916.81', status: '待认证' }],
      pickerTitle: '选择进项发票',
      sourceButtonLabel: '选择进项来源',
      statusOptions: ['待收票', '待认证', '已认证', '异常'],
      extraFields: [
        { label: '发票方向', value: '进项', readonly: true },
        { label: '认证日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('invoices', 'input'), readonly: true },
      ],
    },
    'invoices.match': {
      counterpartyLabel: '往来单位',
      sourceCategories: categories(['发票记录', '应收单', '应付单']),
      lineColumns: columns([
        ['invoiceCode', '发票记录'],
        ['sourceCode', '账款对象'],
        ['counterpartyName', '往来单位'],
        ['amount', '勾稽金额'],
        ['handledAmount', '已勾稽'],
        ['status', '勾稽状态'],
      ]),
      formLines: [{ id: '1', invoiceCode: 'INV-202605-001', sourceCode: 'AR-202605-001', counterpartyName: '海南微为科技', amount: '59,590.00', handledAmount: '0.00', status: '待勾稽' }],
      pickerTitle: '选择发票与账款对象',
      sourceButtonLabel: '选择勾稽对象',
      statusOptions: ['待勾稽', '部分勾稽', '已勾稽', '异常'],
      extraFields: [
        { label: '勾稽方式', options: ['按来源自动勾稽', '手工勾稽', '红冲勾稽'] },
        { label: '回写规则', value: actionWriteBackText('invoices', 'match'), readonly: true },
      ],
    },
    'invoices.red': {
      counterpartyLabel: '往来单位',
      sourceCategories: categories(['售后单', '原发票', '采购退货']),
      lineColumns: columns([
        ['sourceCode', '红冲来源'],
        ['invoiceCode', '原发票'],
        ['counterpartyName', '往来单位'],
        ['amount', '红冲金额'],
        ['sourceTitle', '红冲原因'],
        ['status', '红冲状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AS-202605-006', invoiceCode: 'INV-202605-001', counterpartyName: '深圳云启制造', amount: '-8,600.00', sourceTitle: '售后退款退货', status: '待红冲' }],
      pickerTitle: '选择售后/退货与原发票',
      sourceButtonLabel: '选择红冲来源',
      statusOptions: ['待红冲', '已红冲', '异常'],
      extraFields: [
        { label: '红冲类型', options: ['销项红冲', '进项红冲'] },
        { label: '是否影响售后关闭', value: '是，需等待退款付款和应收调整', readonly: true },
        { label: '回写规则', value: actionWriteBackText('invoices', 'red'), readonly: true },
      ],
      attachmentOptions: ['原发票', '红字信息表', '售后处理单', '审批材料'],
    },
    'settlements.receive': {
      counterpartyLabel: '客户',
      sourceCategories: categories(['应收单', '银行收款流水']),
      lineColumns: columns([
        ['sourceCode', '应收单'],
        ['flowCode', '银行流水'],
        ['counterpartyName', '客户'],
        ['amount', '收款金额'],
        ['accountName', '收款账户'],
        ['status', '核销状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AR-202605-001', flowCode: 'BANK-20260517-001', counterpartyName: '海南微为科技', amount: '20,000.00', accountName: '招商银行基本户', status: '待核销' }],
      pickerTitle: '选择应收单或银行收款流水',
      sourceButtonLabel: '选择收款来源',
      statusOptions: ['待确认', '待核销', '部分核销', '已核销'],
      extraFields: [
        { label: '流水方向', value: '收款', readonly: true },
        { label: '到账日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('settlements', 'receive'), readonly: true },
      ],
    },
    'settlements.pay': {
      counterpartyLabel: '供应商',
      sourceCategories: categories(['应付单', '付款申请', '银行付款流水']),
      lineColumns: columns([
        ['sourceCode', '应付/申请来源'],
        ['flowCode', '银行流水'],
        ['counterpartyName', '供应商'],
        ['amount', '付款金额'],
        ['accountName', '付款账户'],
        ['status', '核销状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AP-202605-001', flowCode: 'BANK-20260518-004', counterpartyName: '深圳华芯电子', amount: '30,000.00', accountName: '建设银行一般户', status: '待核销' }],
      pickerTitle: '选择应付单或付款流水',
      sourceButtonLabel: '选择付款来源',
      statusOptions: ['待确认', '待核销', '部分核销', '已核销'],
      extraFields: [
        { label: '流水方向', value: '付款', readonly: true },
        { label: '付款日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('settlements', 'pay'), readonly: true },
      ],
    },
    'settlements.refund': {
      counterpartyLabel: '售后客户',
      sourceCategories: categories(['售后退款单', '银行付款流水']),
      lineColumns: columns([
        ['sourceCode', '售后退款单'],
        ['flowCode', '付款流水'],
        ['counterpartyName', '售后客户'],
        ['amount', '退款金额'],
        ['accountName', '退款账户'],
        ['status', '付款状态'],
      ]),
      formLines: [{ id: '1', sourceCode: 'AS-202605-006', flowCode: '待导入', counterpartyName: '深圳云启制造', amount: '8,600.00', accountName: '招商银行基本户', status: '待付款' }],
      pickerTitle: '选择售后退款单',
      sourceButtonLabel: '选择退款来源',
      statusOptions: ['待付款', '已付款', '待核销', '异常'],
      extraFields: [
        { label: '流水方向', value: '退款', readonly: true },
        { label: '售后关闭校验', value: '付款完成后才允许售后关闭校验通过', readonly: true },
        { label: '回写规则', value: actionWriteBackText('settlements', 'refund'), readonly: true },
      ],
    },
    'settlements.settle': {
      counterpartyLabel: '往来单位',
      sourceCategories: categories(['收付流水', '应收单', '应付单', '售后退款单']),
      lineColumns: columns([
        ['flowCode', '收付流水'],
        ['sourceCode', '核销对象'],
        ['counterpartyName', '往来单位'],
        ['pendingAmount', '可核销金额'],
        ['amount', '本次核销'],
        ['status', '核销状态'],
      ]),
      formLines: [{ id: '1', flowCode: 'BNK-202605-001', sourceCode: 'AR-202605-001', counterpartyName: '海南微为科技', pendingAmount: '20,000.00', amount: '20,000.00', status: '已核销' }],
      pickerTitle: '选择收付流水与核销对象',
      sourceButtonLabel: '选择核销对象',
      statusOptions: ['待核销', '部分核销', '已核销', '差异待处理'],
      extraFields: [
        { label: '核销方向', options: ['收款核销', '付款核销', '退款核销'] },
        { label: '回写规则', value: actionWriteBackText('settlements', 'settle'), readonly: true },
      ],
    },
    'settlements.bank': {
      counterpartyLabel: '往来单位',
      sourceCategories: categories(['银行流水', '收付流水']),
      lineColumns: columns([
        ['flowCode', '银行流水'],
        ['sourceCode', '系统流水'],
        ['accountName', '账户'],
        ['amount', '金额'],
        ['pendingAmount', '差异金额'],
        ['status', '对账状态'],
      ]),
      formLines: [{ id: '1', flowCode: 'BANK-20260531-006', sourceCode: 'REF-202605-006', accountName: '招商银行基本户', amount: '8,600.00', pendingAmount: '8,600.00', status: '待对账' }],
      pickerTitle: '选择银行流水或系统流水',
      sourceButtonLabel: '选择对账流水',
      statusOptions: ['待对账', '已对账', '差异待处理'],
      extraFields: [
        { label: '对账方式', options: ['自动匹配', '手工匹配', '差异处理'] },
        { label: '对账日期', value: '2026-05-31' },
        { label: '回写规则', value: actionWriteBackText('settlements', 'bank'), readonly: true },
      ],
      attachmentOptions: ['银行流水文件', '回单附件', '差异说明', '审批材料'],
    },
  };

  return { ...base, ...configs[`${module.key}.${actionKey}`] };
}

function categories(keys: string[]): SourcePickerCategory[] {
  const iconMap: Record<string, string> = {
    开票申请: 'line-doc',
    银行收款流水: 'line-download',
    银行付款流水: 'line-upload',
    银行流水: 'line-download',
    收付流水: 'line-doc',
    原发票: 'line-folder',
    进项发票: 'line-folder',
    发票记录: 'line-folder',
    付款申请: 'line-doc',
    客户对账单: 'line-doc',
    供应商对账单: 'line-doc',
    采购退货: 'line-refresh',
    售后退款单: 'line-refresh',
  };
  return keys.map((key) => ({ key, label: key, icon: iconMap[key] || 'line-doc' }));
}

function columns(items: Array<[string, string, number?]>): EditableColumn[] {
  return items.map(([key, title, width]) => ({ key, title, width: width || 140 }));
}

function buildPickedLine(source: SourcePickerConfirmPayload, config: FinanceFormConfig): FinanceRow {
  const row: FinanceRow = { id: '1' };
  config.lineColumns.forEach((column) => {
    row[column.key] = pickedLineValue(column.key, source, config);
  });
  return row;
}

function pickedLineValue(key: string, source: SourcePickerConfirmPayload, config: FinanceFormConfig) {
  const amount = String(source.maxRefund || '0.00');
  const values: Record<string, string> = {
    sourceCode: source.code,
    sourceTitle: source.subject,
    businessType: pickedBusinessType(source, config),
    counterpartyName: source.customer,
    customer: source.customer,
    supplier: source.customer,
    flowCode: source.cat.includes('流水') ? source.code : '',
    invoiceCode: source.cat.includes('发票') ? source.code : '',
    purchaseOrderCode: source.cat === '采购订单' ? source.code : '',
    inboundCode: source.cat === '采购入库' ? source.code : '',
    amount,
    handledAmount: pickedHandledAmount(amount, config),
    pendingAmount: pickedPendingAmount(amount, config),
    taxAmount: pickedTaxAmount(amount, config),
    invoiceAmount: amount,
    accountName: config.extraFields.find((field) => field.label.includes('账户'))?.value || '',
    invoiceType: '增值税专票',
    status: config.statusOptions[0] || '待确认',
    invoiceStatus: config.statusOptions[0] || '待确认',
  };
  return values[key] || '';
}

function pickedBusinessType(source: SourcePickerConfirmPayload, config: FinanceFormConfig) {
  if (config.id === 'payables.new') {
    if (source.cat === '采购退货') return '应付冲减';
    return '采购入库暂估';
  }
  if (config.id === 'invoices.new') {
    if (source.cat === '开票申请') return '销项开票';
    if (source.cat === '进项发票') return '进项收票认证';
    if (['原发票', '售后单', '采购退货'].includes(source.cat)) return '红冲处理';
  }
  if (config.id === 'settlements.new') {
    if (source.cat === '银行收款流水') return '收款登记';
    if (source.cat === '银行付款流水') return '付款登记';
    if (source.cat === '银行流水') return '银行对账';
    if (source.cat === '售后退款单') return '退款付款';
    return '收付核销';
  }
  return source.cat;
}

function pickedTaxAmount(amount: string, config: FinanceFormConfig) {
  if (config.id !== 'invoices.new') return amount === '0.00' ? '0.00' : '';
  return formatMoney(parseMoney(amount) * 13 / 113);
}

function pickedHandledAmount(amount: string, config: FinanceFormConfig) {
  if (config.id === 'invoices.new') return pickedTaxAmount(amount, config);
  return '0.00';
}

function pickedPendingAmount(amount: string, config: FinanceFormConfig) {
  if (config.id === 'invoices.new') return formatMoney(parseMoney(amount) - parseMoney(pickedTaxAmount(amount, config)));
  return amount;
}

function buildDateRange(preset: string, customStart: string, customEnd: string) {
  if (preset === 'all') return { start: '', end: '' };
  if (preset === 'custom') return normalizeDateRange(customStart, customEnd);
  const ranges: Record<string, { start: string; end: string }> = {
    today: { start: '2026-05-31', end: '2026-05-31' },
    week: { start: '2026-05-25', end: '2026-05-31' },
    month: { start: '2026-05-01', end: '2026-05-31' },
    quarter: { start: '2026-04-01', end: '2026-06-30' },
    year: { start: '2026-01-01', end: '2026-12-31' },
    last30: { start: '2026-05-02', end: '2026-05-31' },
  };
  return ranges[preset] || ranges.month;
}

function normalizeDateRange(start: string, end: string) {
  if (start && end && start > end) return { start: end, end: start };
  return { start, end };
}

function isRowInDateRange(moduleKey: FinanceModule['key'], row: FinanceRow, start: string, end: string) {
  if (!start && !end) return true;
  const dateKeyMap: Record<FinanceModule['key'], string> = {
    receivables: 'dueDate',
    payables: 'dueDate',
    invoices: 'issueDate',
    settlements: 'transactionDate',
  };
  const rowDate = row[dateKeyMap[moduleKey]];
  if (!rowDate) return false;
  if (start && rowDate < start) return false;
  if (end && rowDate > end) return false;
  return true;
}

function sumRows(rows: FinanceRow[], key: string) {
  return rows.reduce((total, row) => total + parseMoney(row[key]), 0);
}

function countRowsByCenter(rows: FinanceRow[], center: string) {
  return rows.filter((row) => includesText(row.businessCenter, center)).length;
}

function parseMoney(value?: string) {
  return parseMoneyValue(value);
}

function formatMoney(value: unknown) {
  return formatCurrency(value);
}

function includesText(value: unknown, keyword: string) {
  return String(value || '').includes(keyword);
}

function isOverdue(date?: string) {
  if (!date) return false;
  const due = new Date(`${date}T00:00:00+08:00`).getTime();
  const today = new Date('2026-05-31T00:00:00+08:00').getTime();
  return Number.isFinite(due) && due < today;
}

function recordRows(row: FinanceRow, activeTab: string) {
  if (activeTab === 'source') {
    const rows = [
      ['1', row.businessCenter, row.sourceType, row.sourceCode, row.sourceLineId || '-', sourceRefDisplay(row), row.sourceTitle, row.confirmationPoint || '-', row.amount, row.writeBackTarget],
    ];
    if (row.confirmSourceCode) rows.push(['2', '仓储', row.confirmSourceType || '确认来源', row.confirmSourceCode, '-', `${row.confirmSourceType || '仓储节点'}只读引用`, row.confirmSourceCode, '只读确认点', row.amount, '只读引用，不修改库存数量、成本层、批次']);
    if (!row.confirmSourceCode) rows.push(['2', '仓储', '只读成本引用', 'COST-READ-001', '-', 'inventory_cost / COST-READ-001', '库存成本层只读记录', '只读', '只读', '不修改库存数量、成本层、批次']);
    return rows;
  }
  if (activeTab === 'inbound') return [
    ['1', row.sourceCode, row.sourceLineId || '-', row.inboundStatus || '-', row.amount, row.provisionalStatus || '-', '仓储入库只读引用'],
  ];
  if (activeTab === 'settlement') return [
    [
      '1',
      parseMoney(row.settledAmount) > 0 ? (row.code?.startsWith('AP') ? 'PAY-202605-001' : 'BNK-202605-001') : '待生成',
      row.counterpartyName || '-',
      row.settledAmount || '0.00',
      row.unsettledAmount || '0.00',
      row.code?.startsWith('AP') ? '建设银行一般户' : '招商银行基本户',
      row.code?.startsWith('AP') ? '2026-05-18' : '2026-05-17',
      row.settlementStatus || row.status,
      row.writeBackTarget,
    ],
  ];
  if (activeTab === 'invoice') return [
    ['1', row.code?.startsWith('AP') ? 'PINV-202605-004' : 'INV-202605-001', row.sourceCode, row.invoiceStatus || row.status, row.amount, row.code?.startsWith('AP') ? '收票/认证' : '销项开票/红冲', row.code?.startsWith('AP') ? '认证后回写采购到票状态' : '账款处理后回写销售或售后来源单据'],
  ];
  if (activeTab === 'adjust') {
    const rows = [
      ['1', row.code, row.sourceCode, row.amount?.startsWith('-') ? row.amount : '0.00', row.sourceType === '售后单' ? '售后退货应收调整' : '暂无调整', row.writeBackTarget],
    ];
    if (row.afterSalesCloseStatus) rows.push(['2', '售后关闭校验', row.sourceCode, row.refundPaymentStatus || '-', `${row.receivableAdjustStatus || '-'} / ${row.redInvoiceStatus || '-'}`, row.afterSalesCloseStatus]);
    return rows;
  }
  if (activeTab === 'match') return [
    ['1', row.purchaseOrderCode || row.sourceCode, row.inboundCode || row.sourceCode, row.invoiceCode || '待到票', row.orderAmount || row.amount, row.inboundAmount || row.amount, row.invoiceAmount || (row.invoiceStatus === '待到票' ? '0.00' : row.amount), row.qualityDeduction || '0.00', row.matchStatus || '待匹配', '差异需审批后影响可付款金额'],
  ];
  if (activeTab === 'bank') return [[
    '1',
    row.bankFlowCode || row.code,
    row.code,
    row.accountName || '-',
    row.amount,
    row.unreconciledAmount || '0.00',
    row.reconcileStatus || '待对账',
    row.direction === '退款' ? '退款付款银行流水待导入' : '银行流水已匹配系统流水',
  ]];
  if (activeTab === 'tax') return [[
    '1',
    row.code,
    row.direction || '-',
    row.taxAmount || '-',
    row.certificationStatus || row.matchStatus || '待认证',
    row.issueDate || '-',
    row.direction === '进项' ? '认证后回写采购到票状态' : '销项/红冲不做进项认证',
  ]];
  if (activeTab === 'red') return [[
    '1',
    row.code,
    row.sourceCode,
    row.direction === '红冲' ? row.amount : '0.00',
    row.redStatus || '未红冲',
    row.writeBackTarget,
    row.direction === '红冲' ? row.afterSalesCloseStatus || '等待售后关闭校验' : '无红冲记录',
  ]];
  if (activeTab === 'attach') return [[
    '1',
    row.code?.startsWith('BNK') || row.code?.startsWith('PAY') || row.code?.startsWith('REF') ? `${row.code}-回单.pdf` : '银行回单.pdf',
    row.receiptStatus || '已上传',
    row.transactionDate || '2026-05-31',
    row.accountName || '-',
    '可查看下载',
  ]];
  if (activeTab === 'voucher') return [['1', `V-${row.code}`, '只读凭证记录', row.amount, row.status, '后续独立凭证模块拆出']];
  return [['1', '创建', '系统联动', '2026-05-31 10:00', `由${row.sourceCode}生成`, row.writeBackTarget]];
}

function recordColumns(activeTab: string) {
  const map: Record<string, string[]> = {
    source: ['序号', '业务中心', '来源类型', '来源单据', '来源明细', '来源引用', '来源主题', '确认节点', '关联金额', '回写目标'],
    inbound: ['序号', '来源单据', '来源明细', '入库状态', '暂估金额', '暂估状态', '说明'],
    settlement: ['序号', '收/付款单号', '往来单位', '已处理金额', '未处理金额', '账户', '日期', '核销状态', '回写目标'],
    invoice: ['序号', '发票单号', '来源单据', '发票状态', '金额', '发票动作', '回写说明'],
    adjust: ['序号', '调整单号', '来源单据', '调整金额', '调整原因', '回写目标'],
    match: ['序号', '采购订单', '入库记录', '进项发票', '订单金额', '入库金额', '到票金额', '质检扣款', '匹配状态', '差异处理'],
    bank: ['序号', '银行流水号', '系统流水号', '账户', '金额', '差异金额', '对账状态', '匹配说明'],
    tax: ['序号', '发票单号', '发票方向', '税额', '认证状态', '日期', '回写说明'],
    red: ['序号', '红冲单号', '来源单据', '红冲金额', '红冲状态', '回写目标', '关闭校验'],
    attach: ['序号', '附件名称', '附件状态', '上传日期', '账户', '操作'],
    voucher: ['序号', '凭证号', '摘要', '金额', '状态', '说明'],
    log: ['序号', '操作类型', '操作人', '操作时间', '操作内容', '结果'],
  };
  return map[activeTab] || map.log;
}

const sourcePickerRows: SourcePickerRow[] = [
  { cat: '销售订单', code: 'SO-202605-001', subject: '智能温控终端签收未立账', date: '2026-05-31', customer: '海南微为科技', maxQty: 20, maxRefund: '59,590.00' },
  { cat: '销售合同', code: 'SC-202605-014', subject: '年度维保服务收款计划到期', date: '2026-06-10', customer: '广州新城智能', maxQty: 1, maxRefund: '42,800.00' },
  { cat: '售后单', code: 'AS-202605-006', subject: '退货入库完成应收调整', date: '2026-05-30', customer: '深圳云启制造', maxQty: 1, maxRefund: '8,600.00' },
  { cat: '采购订单', code: 'PO-202605-018', subject: '采购订单入库验收待立账', date: '2026-05-25', customer: '深圳华芯电子', maxQty: 200, maxRefund: '86,200.00' },
  { cat: '采购入库', code: 'IN-202605-018', subject: '采购入库验收未立账', date: '2026-05-25', customer: '深圳华芯电子', maxQty: 200, maxRefund: '86,200.00' },
  { cat: '采购退货', code: 'PRT-202605-002', subject: '退货出库完成待冲减应付', date: '2026-05-28', customer: '东莞科创包装', maxQty: 20, maxRefund: '9,600.00' },
  { cat: '应收单', code: 'AR-202605-001', subject: '应收未收余额待匹配收款', date: '2026-05-31', customer: '海南微为科技', maxQty: 1, maxRefund: '39,590.00' },
  { cat: '应付单', code: 'AP-202605-001', subject: '应付未付余额待匹配付款', date: '2026-06-15', customer: '深圳华芯电子', maxQty: 1, maxRefund: '56,200.00' },
  { cat: '售后退款单', code: 'AS-202605-006', subject: '售后退款付款', date: '2026-05-31', customer: '深圳云启制造', maxQty: 1, maxRefund: '8,600.00' },
  { cat: '银行收款流水', code: 'BANK-20260517-001', subject: '客户到账流水待登记收款', date: '2026-05-17', customer: '海南微为科技', maxQty: 1, maxRefund: '20,000.00' },
  { cat: '银行付款流水', code: 'BANK-20260518-004', subject: '供应商付款流水待核销', date: '2026-05-18', customer: '深圳华芯电子', maxQty: 1, maxRefund: '30,000.00' },
  { cat: '银行流水', code: 'BANK-20260531-006', subject: '售后退款银行流水待对账', date: '2026-05-31', customer: '深圳云启制造', maxQty: 1, maxRefund: '8,600.00' },
  { cat: '收付流水', code: 'REF-202605-006', subject: '售后退款系统流水', date: '2026-05-31', customer: '深圳云启制造', maxQty: 1, maxRefund: '8,600.00' },
  { cat: '付款申请', code: 'PAY-APP-202605-001', subject: '深圳华芯电子付款申请', date: '2026-05-31', customer: '深圳华芯电子', maxQty: 1, maxRefund: '56,200.00' },
  { cat: '进项发票', code: 'PINV-202605-004', subject: '供应商进项发票待认证', date: '2026-05-24', customer: '深圳华芯电子', maxQty: 1, maxRefund: '86,200.00' },
  { cat: '发票记录', code: 'INV-202605-001', subject: '销项发票待勾稽应收', date: '2026-05-21', customer: '海南微为科技', maxQty: 1, maxRefund: '59,590.00' },
  { cat: '原发票', code: 'INV-202605-001', subject: '原销项发票待红冲', date: '2026-05-21', customer: '深圳云启制造', maxQty: 1, maxRefund: '8,600.00' },
  { cat: '开票申请', code: 'INV-REQ-202605-001', subject: '销项开票申请已审批', date: '2026-05-21', customer: '海南微为科技', maxQty: 1, maxRefund: '59,590.00' },
  { cat: '客户对账单', code: 'REC-CUS-202605-001', subject: '海南微为科技五月对账', date: '2026-05-31', customer: '海南微为科技', maxQty: 1, maxRefund: '39,590.00' },
  { cat: '供应商对账单', code: 'REC-SUP-202605-001', subject: '深圳华芯电子五月对账', date: '2026-05-31', customer: '深圳华芯电子', maxQty: 1, maxRefund: '56,200.00' },
];

const sourcePickerBatches: Record<string, SourcePickerBatch[]> = {
  'SO-202605-001': [{ deliveryNo: 'OUT-202605-009', detailNo: 'OUT-D-001', deliveryDate: '2026-05-31', warehouse: '成品仓', logistics: '出库/OQC/签收', qty: 20, amount: '59,590.00', status: '签收完成，未立账' }],
  'SC-202605-014': [{ deliveryNo: 'PLAN-SC-202605-014-01', detailNo: 'SC-PLAN-001', deliveryDate: '2026-06-10', warehouse: '维保服务确认', logistics: '合同收款计划', qty: '第1期', amount: '42,800.00', status: '待立账' }],
  'PO-202605-018': [{ deliveryNo: 'IN-202605-018', detailNo: 'IN-D-001', deliveryDate: '2026-05-25', warehouse: '原料仓', logistics: 'IQC合格/待暂估', qty: 200, amount: '86,200.00', status: '入库验收完成，未立账' }],
  'IN-202605-018': [{ deliveryNo: 'IN-202605-018', detailNo: 'IN-D-001', deliveryDate: '2026-05-25', warehouse: '原料仓', logistics: '采购入库验收', qty: 200, amount: '86,200.00', status: '验收完成，待暂估' }],
  'PRT-202605-002': [{ deliveryNo: 'PRT-202605-002', detailNo: 'PRT-D-001', deliveryDate: '2026-05-28', warehouse: '原料仓', logistics: '采购退货冲减', qty: 20, amount: '9,600.00', status: '退货出库完成，待冲减' }],
  'AS-202605-006': [{ deliveryNo: 'ADJ-AS-202605-006', detailNo: 'AS-ADJ-001', deliveryDate: '2026-05-30', warehouse: '售后仓', logistics: '退货入库应收调整', qty: 1, amount: '8,600.00', status: '退货完成，待调整' }],
  '售后单:AS-202605-006': [{ deliveryNo: 'ADJ-AS-202605-006', detailNo: 'AS-ADJ-001', deliveryDate: '2026-05-30', warehouse: '售后仓', logistics: '退货/折让红冲', qty: 1, amount: '8,600.00', status: '售后确认，待红冲/调整' }],
  '售后退款单:AS-202605-006': [{ deliveryNo: 'REF-AS-202605-006', detailNo: 'AS-REF-001', deliveryDate: '2026-05-31', warehouse: '招商银行基本户', logistics: '退款付款关闭校验', qty: 1, amount: '8,600.00', status: '待付款，未关闭' }],
  'INV-REQ-202605-001': [{ deliveryNo: 'INV-REQ-202605-001', detailNo: 'INV-REQ-L1', deliveryDate: '2026-05-21', warehouse: '销售订单 SO-202605-001', logistics: '销项开票申请', qty: 1, amount: '59,590.00', status: '审批通过，待开票' }],
  'PINV-202605-004': [{ deliveryNo: 'PINV-202605-004', detailNo: 'PINV-L1', deliveryDate: '2026-05-24', warehouse: '采购订单 PO-202605-018', logistics: '进项认证', qty: 1, amount: '86,200.00', status: '已收票，待认证' }],
  'INV-202605-001': [{ deliveryNo: 'INV-202605-001', detailNo: 'INV-RED-L1', deliveryDate: '2026-05-21', warehouse: '售后单 AS-202605-006', logistics: '销项红冲', qty: 1, amount: '8,600.00', status: '原发票有效，待红冲' }],
  '发票记录:INV-202605-001': [{ deliveryNo: 'INV-202605-001', detailNo: 'INV-MATCH-L1', deliveryDate: '2026-05-21', warehouse: '应收单 AR-202605-001', logistics: '发票勾稽', qty: 1, amount: '59,590.00', status: '已开票，待勾稽' }],
  '原发票:INV-202605-001': [{ deliveryNo: 'INV-202605-001', detailNo: 'INV-RED-L1', deliveryDate: '2026-05-21', warehouse: '售后单 AS-202605-006', logistics: '销项红冲', qty: 1, amount: '8,600.00', status: '原发票有效，待红冲' }],
  'AR-202605-001': [{ deliveryNo: 'AR-202605-001', detailNo: 'AR-SET-L1', deliveryDate: '2026-05-31', warehouse: '招商银行基本户', logistics: '销售订单 SO-202605-001', qty: 1, amount: '39,590.00', status: '部分收款，待核销' }],
  'AP-202605-001': [{ deliveryNo: 'AP-202605-001', detailNo: 'AP-SET-L1', deliveryDate: '2026-06-15', warehouse: '建设银行一般户', logistics: '采购入库 IN-202605-018', qty: 1, amount: '56,200.00', status: '部分付款，待核销' }],
  'BANK-20260517-001': [{ deliveryNo: 'BANK-20260517-001', detailNo: 'BANK-IN-L1', deliveryDate: '2026-05-17', warehouse: '招商银行基本户', logistics: '匹配 AR-202605-001', qty: 1, amount: '20,000.00', status: '已到账，待核销' }],
  'BANK-20260518-004': [{ deliveryNo: 'BANK-20260518-004', detailNo: 'BANK-OUT-L1', deliveryDate: '2026-05-18', warehouse: '建设银行一般户', logistics: '匹配 AP-202605-001', qty: 1, amount: '30,000.00', status: '已付款，待核销' }],
  'BANK-20260531-006': [{ deliveryNo: 'BANK-20260531-006', detailNo: 'BANK-REF-L1', deliveryDate: '2026-05-31', warehouse: '招商银行基本户', logistics: '匹配 REF-202605-006', qty: 1, amount: '8,600.00', status: '待对账' }],
  'REF-202605-006': [{ deliveryNo: 'REF-202605-006', detailNo: 'REF-L1', deliveryDate: '2026-05-31', warehouse: '招商银行基本户', logistics: '售后退款付款', qty: 1, amount: '8,600.00', status: '系统流水待银行对账' }],
};

const FinanceActionView = defineComponent({
  name: 'FinanceActionView',
  props: {
    module: { type: Object as () => FinanceModule, required: true },
    actionKey: { type: String, required: true },
    rows: { type: Array as () => FinanceRow[], required: true },
  },
  emits: ['back', 'create'],
  setup(props, { emit }) {
    const actionRouter = useRouter();
    const actionKeyword = ref('');
    const actionTitle = computed(() => actionLabel(props.module.key, props.actionKey));
    const tableRows = computed(() => actionTableRows(props.module.key, props.actionKey, props.rows));
    const visibleRows = computed(() => {
      const term = actionKeyword.value.trim();
      return tableRows.value.filter((row) => !term || JSON.stringify(row).includes(term));
    });
    const tableColumns = computed(() => actionTableColumns(props.module.key, props.actionKey));
    return () => h(AwListPage, null, {
      default: () => [
        h('section', { class: 'finance-summary-grid', 'aria-label': `${actionTitle.value}概览` },
          buildActionSummaryCards(props.module.key, props.actionKey, visibleRows.value).map((card) => h('article', { key: card.key, class: 'finance-summary-card' }, [
            h('span', card.label),
            h('strong', card.value),
            h('em', card.hint),
          ])),
        ),
        h(AwListToolbar, {
          searchPlaceholder: `搜索${actionTitle.value}单号、来源单据、往来单位`,
          createLabel: actionCreateLabel(props.module.key, props.actionKey),
          createHandler: () => emit('create', props.actionKey),
          onSearch: (value: string) => actionKeyword.value = value,
        }),
        h(AwDataTable, {
          columns: tableColumns.value,
          rows: visibleRows.value,
          rowKey: 'id',
          total: visibleRows.value.length,
          bulkActions: [{ key: 'batch', label: '批量处理' }],
        }, {
          cell: ({ column, record, value }: { column: AwTableColumn; record: FinanceRow; value: string }) => {
            if (column.key === 'action') return h('a', {
              href: `/finance/${props.module.key}?id=${encodeURIComponent(record.sourceId || record.id || '')}`,
              class: 'aw-link',
              onClick: (event: Event) => {
                event.preventDefault();
                actionRouter.push({ path: `/finance/${props.module.key}`, query: { id: record.sourceId || record.id } });
              },
            }, '查看');
            if (column.key === 'status') return h('span', { class: ['aw-status', statusTone(String(value))] }, value);
            return h('span', financeCellValue(value, column));
          },
        }),
      ],
    });
  },
});

const FinanceFormView = defineComponent({
  name: 'FinanceFormView',
  props: {
    module: { type: Object as () => FinanceModule, required: true },
    actionKey: { type: String, default: '' },
  },
  emits: ['back'],
  setup(props, { emit }) {
    const showPicker = ref(false);
    const remark = ref('');
    const selectedSource = ref<SourcePickerConfirmPayload | null>(null);
    const formConfig = computed(() => financeFormConfig(props.module, props.actionKey));
    const lines = ref<FinanceRow[]>([]);
    const attachments = ref<AttachmentRow[]>([]);
    const availableSourceRows = computed(() => {
      const allowedCategories = new Set(formConfig.value.sourceCategories.map((category) => category.key));
      return sourcePickerRows.filter((row) => allowedCategories.has(row.cat));
    });
    const resetForm = () => {
      selectedSource.value = null;
      lines.value = formConfig.value.formLines.map((line) => ({ ...line }));
      attachments.value = [{ id: '1', name: '', type: formConfig.value.attachmentOptions[0] || '账款附件', date: '2026-05-31', remark: '' }];
    };
    const addLine = () => lines.value.push(buildPickedLine(selectedSource.value || manualSource(), formConfig.value));
    const addAttachment = () => attachments.value.push({ id: Date.now(), name: '', type: formConfig.value.attachmentOptions[0] || '账款附件', date: '2026-05-31', remark: '' });
    const removeAttachment = (row: AttachmentRow) => {
      if (attachments.value.length <= 1) return;
      if (!window.confirm(`确认删除附件“${row.name || row.type || row.id}”吗？`)) return;
      attachments.value = attachments.value.filter((item) => item.id !== row.id);
    };
    const pickSource = (source: SourcePickerConfirmPayload) => {
      selectedSource.value = source;
      lines.value = [buildPickedLine(source, formConfig.value)];
      showPicker.value = false;
    };
    const formTitle = computed(() => formConfig.value.title);
    watch(() => formConfig.value.id, resetForm, { immediate: true });
    return () => h(AwFormPage, {
      backText: `返回${formTitle.value}`,
      actions: [{ key: 'draft', label: '暂存' }, { key: 'save', label: '保存', primary: true }],
      onBack: () => emit('back'),
      onAction: () => emit('back'),
    }, () => [
      h('section', { class: 'aw-form-card' }, [
        h('h4', '基础信息'),
        h('div', { class: 'finance-form-grid' }, [
          formField('来源单据', h('button', { class: 'aw-tool-btn', type: 'button', onClick: () => showPicker.value = true }, selectedSource.value?.code || formConfig.value.sourceButtonLabel)),
          formField(formConfig.value.counterpartyLabel, h('input', { class: 'aw-input', value: selectedSource.value?.customer || '', placeholder: `选择来源后带入${formConfig.value.counterpartyLabel}` })),
          formField('来源类型', h('input', { class: 'aw-input', value: selectedSource.value?.cat || 'manual', readonly: true })),
          formField('来源引用', h('input', { class: 'aw-input', value: selectedSource.value ? `${selectedSource.value.cat} / ${selectedSource.value.code}` : 'manual / 手工录入需填写原因', readonly: true })),
          formField('手工原因', h('input', { class: 'aw-input', placeholder: '仅手工录入时必填，正常业务必须选择来源单据' })),
          formField('回写目标', h('input', { class: 'aw-input', value: formConfig.value.writeBackText, readonly: true })),
          ...formConfig.value.extraFields.map((field) => formField(field.label, formExtraControl(field))),
          formField('状态', h('select', { class: 'aw-select' }, formConfig.value.statusOptions.map((option) => h('option', option)))),
        ]),
      ]),
      h('section', { class: 'aw-form-card' }, [
        h('h4', '明细子表'),
        h(AwEditableSubTable, { columns: formConfig.value.lineColumns, rows: lines.value, addText: formConfig.value.lineAddText, onAdd: addLine }, {
          cell: ({ column, row }: { column: EditableColumn; row: FinanceRow }) => h('input', { class: 'aw-input', value: isMoneyField(column.key, column.title) ? formatMoney(row[column.key]) : row[column.key] || '', placeholder: isMoneyField(column.key, column.title) ? '¥ 0:00' : '', onInput: (event: Event) => row[column.key] = (event.target as HTMLInputElement).value }),
          actions: ({ index }: { index: number }) => h('button', {
            class: 'aw-link-btn',
            type: 'button',
            onClick: () => {
              const row = lines.value[index];
              if (!window.confirm(`确认删除明细“${row?.sourceCode || row?.sourceTitle || index + 1}”吗？`)) return;
              lines.value.splice(index, 1);
            },
          }, '删除'),
        }),
      ]),
      h('section', { class: 'aw-form-card' }, [h('h4', '附件'), h(AwAttachmentTable, { rows: attachments.value, typeOptions: formConfig.value.attachmentOptions, onAdd: addAttachment, onRemove: removeAttachment })]),
      h('section', { class: 'aw-form-card' }, [h('h4', '备注/说明'), h(AwRichTextEditor, { modelValue: remark.value, placeholder: formConfig.value.remarkPlaceholder, 'onUpdate:modelValue': (value: string) => remark.value = value })]),
      h(AwSourcePickerModal, { open: showPicker.value, title: formConfig.value.pickerTitle, currentCustomer: '', categories: formConfig.value.sourceCategories, rows: availableSourceRows.value, batches: sourcePickerBatches, showBatches: formConfig.value.showBatches !== false, showBatchAmount: formConfig.value.showBatchAmount, sourceMetricField: formConfig.value.sourceMetricField, sourceTableText: formConfig.value.sourceTableText, batchTextMap: formConfig.value.batchTextMap, showCustomerContext: false, onCancel: () => showPicker.value = false, onConfirm: pickSource }),
    ]);
  },
});

const FinanceDetailView = defineComponent({
  name: 'FinanceDetailView',
  props: {
    module: { type: Object as () => FinanceModule, required: true },
    row: { type: Object as () => FinanceRow, required: true },
  },
  emits: ['back', 'action'],
  setup(props, { emit }) {
    const activeTab = ref(props.module.tabs[0]?.key || 'base');
    return () => h(AwDetailPage, null, {
      toolbar: () => h(AwDetailToolbar, {
        backText: `返回${props.module.title}`,
        actions: detailActions(props.module.key, props.row),
        onBack: () => emit('back'),
        onAction: (key: string) => emit('action', key),
      }),
      header: () => h(AwDetailHeader, {
        title: props.row.sourceTitle || props.row.code,
        code: props.row.code,
        statusText: props.row.status || props.row.settlementStatus || '-',
        statusTone: statusTone(props.row.status || ''),
        metas: [
          { label: props.module.counterpartyLabel, value: props.row.counterpartyName || '-' },
          { label: '来源单据', value: props.row.sourceCode || '-' },
          { label: '业务中心', value: props.row.businessCenter || '-' },
        ],
      }),
      default: () => [
        h('section', { class: 'aw-form-card' }, [
          h(AwDetailTabs, { modelValue: activeTab.value, tabs: props.module.tabs, 'onUpdate:modelValue': (key: string) => activeTab.value = key }, {
            default: () => activeTab.value === 'base'
              ? h(AwDetailInfoGrid, { items: detailFields(props.row, props.module.counterpartyLabel) })
              : recordTable(recordColumns(activeTab.value), recordRows(props.row, activeTab.value)),
          }),
        ]),
      ],
    });
  },
});

const FinanceSettingView = defineComponent({
  name: 'FinanceSettingView',
  setup() {
    const tabs: StrategyTab[] = [
      { key: 'receivable', label: '应收策略', rows: [
        { key: 'ar-node', title: '应收生成节点', sub: '销售订单审核、发货、OQC、签收后的确认规则', type: 'select', value: '出库/OQC/签收完成后确认', options: ['订单审核后生成待确认', '出库/OQC/签收完成后确认'] },
        { key: 'ar-aging', title: '账龄规则', sub: '逾期应收和风险提醒的账龄区间', type: 'select', value: '0-30 / 31-60 / 61-90 / 90+', options: ['0-30 / 31-60 / 61-90 / 90+', '0-15 / 16-30 / 31-60 / 60+'] },
        { key: 'ar-credit', title: '信用释放规则', sub: '收款核销后释放客户信用占用', type: 'switch', enabled: true },
      ] },
      { key: 'payable', label: '应付策略', rows: [
        { key: 'ap-node', title: '暂估生成节点', sub: '采购入库完成后生成暂估应付', type: 'select', value: '采购入库完成', options: ['采购入库完成', '到票后生成'] },
        { key: 'ap-match', title: '三单匹配规则', sub: '订单、入库、发票金额差异控制', type: 'select', value: '金额差异需审批', options: ['金额差异需审批', '允许小额差异自动通过'] },
        { key: 'ap-approval', title: '付款审批规则', sub: '付款申请和付款登记必须关联应付来源', type: 'switch', enabled: true },
      ] },
      { key: 'invoice', label: '发票策略', rows: [
        { key: 'inv-node', title: '开票节点', sub: '销售发起开票申请，账款开票后回写', type: 'select', value: '销售申请后开票', options: ['销售申请后开票', '应收确认后自动申请'] },
        { key: 'inv-red', title: '红冲规则', sub: '售后退款/退货触发红冲校验', type: 'switch', enabled: true },
        { key: 'inv-cert', title: '认证规则', sub: '进项发票收票认证后回写采购到票状态', type: 'switch', enabled: true },
      ] },
      { key: 'fund', label: '收付策略', rows: [
        { key: 'fund-account', title: '账户规则', sub: '维护收付款账户和默认账户', type: 'select', value: '按业务中心默认账户', options: ['按业务中心默认账户', '手工选择账户'] },
        { key: 'fund-settle', title: '核销规则', sub: '流水必须核销到应收、应付或退款单', type: 'switch', enabled: true },
        { key: 'fund-bank', title: '对账规则', sub: '银行流水导入后进行对账匹配', type: 'switch', enabled: true },
      ] },
    ];
    return () => h(AwSettingPage, null, {
      toolbar: () => h(AwSettingToolbar, { backText: '返回业务账款中心', addText: '新增策略', showAdd: true }),
      default: () => h(AwStrategySettingPage, { title: '账款设置', description: '仅保留应收、应付、发票、收付核销四类必要策略，公共字段、编号、审批、打印模板沿用设置母版。', tabs }),
    });
  },
});

function formField(label: string, control: ReturnType<typeof h>) {
  return h('label', { class: 'finance-form-field' }, [h('span', label), control]);
}

function formExtraControl(field: FinanceFormExtraField) {
  if (field.options?.length) {
    return h('select', { class: 'aw-select' }, field.options.map((option) => h('option', option)));
  }
  return h('input', { class: 'aw-input', value: field.value || '', placeholder: field.placeholder || '', readonly: field.readonly });
}

function manualSource(): SourcePickerConfirmPayload {
  return { cat: 'manual', code: 'manual', subject: '手工录入', date: '2026-05-31', customer: '', maxQty: 1, maxRefund: '0.00' };
}

function detailActions(key: FinanceModule['key'], row: FinanceRow): DetailAction[] {
  const status = String(row.status || row.settlementStatus || '');
  const settlementStatus = String(row.settlementStatus || status);
  const direction = String(row.direction || '');
  if (key === 'receivables') {
    if (status === '待收款') return [{ key: 'receive', label: '收款登记', primary: true }, { key: 'adjust', label: '应收调整' }, { key: 'reconcile', label: '客户对账' }];
    if (status === '部分收款') return [{ key: 'settle', label: '核销收款', primary: true }, { key: 'receive', label: '继续收款' }, { key: 'adjust', label: '应收调整' }, { key: 'reconcile', label: '客户对账' }];
    if (status === '已收款') return [{ key: 'settle', label: '核销收款', primary: true }, { key: 'reconcile', label: '客户对账' }];
    if (status === '已调整') return [{ key: 'reconcile', label: '客户对账' }];
    return [];
  }
  if (key === 'payables') {
    if (status === '暂估') return [{ key: 'invoice', label: '收票认证', primary: true }, { key: 'match', label: '三单匹配' }];
    if (status === '待付款') return [{ key: 'apply', label: '付款申请' }, { key: 'pay', label: '付款登记', primary: true }, { key: 'invoice', label: '收票认证' }, { key: 'match', label: '三单匹配' }];
    if (status === '部分付款') return [{ key: 'pay', label: '继续付款' }, { key: 'settle', label: '付款核销', primary: true }, { key: 'invoice', label: '收票认证' }, { key: 'match', label: '三单匹配' }];
    if (status === '已付款') return [{ key: 'settle', label: '付款核销', primary: true }, { key: 'reconcile', label: '供应商对账' }];
    return [];
  }
  if (key === 'invoices') {
    if (status === '待开票') return [{ key: 'output', label: '销项开票', primary: true }];
    if (status === '已开票') return [{ key: 'match', label: '发票勾稽', primary: true }, { key: 'red', label: '红冲处理' }];
    if (status === '待收票' || status === '待认证') return [{ key: 'input', label: '进项收票认证', primary: true }];
    if (status === '已认证') return [{ key: 'match', label: '发票勾稽', primary: true }];
    if (status === '待红冲') return [{ key: 'red', label: '红冲处理', primary: true }];
    return [];
  }
  if (key === 'settlements') {
    if (settlementStatus === '已核销') return [];
    const actions: DetailAction[] = [];
    if (direction === '收款') actions.push({ key: 'receive', label: '收款登记' });
    if (direction === '付款') actions.push({ key: 'pay', label: '付款登记' });
    if (direction === '退款') actions.push({ key: 'refund', label: '退款付款' });
    actions.push({ key: 'settle', label: '核销处理', primary: true });
    if (String(row.reconcileStatus || '').includes('差异') || String(row.reconcileStatus || '').includes('待对账')) actions.push({ key: 'bank', label: '银行对账' });
    return actions;
  }
  return [];
}

function detailFields(row: FinanceRow, counterpartyLabel: string) {
  const fields = [
    { label: '账款单号', value: valueOf(row, 'code') },
    { label: '来源类型', value: valueOf(row, 'sourceType') || valueOf(row, 'direction') },
    { label: '来源单据', value: valueOf(row, 'sourceCode') },
    { label: '来源明细', value: valueOf(row, 'sourceLineId') },
    { label: counterpartyLabel, value: valueOf(row, 'counterpartyName') },
    { label: '金额', value: valueOf(row, 'amount') },
    { label: '业务中心', value: valueOf(row, 'businessCenter') },
    { label: '来源引用', value: sourceRefDisplay(row) },
    { label: '回写目标', value: valueOf(row, 'writeBackTarget') },
  ];
  if (row.code?.startsWith('AR-')) {
    fields.splice(6, 0,
      { label: '应收确认点', value: valueOf(row, 'confirmationPoint') },
      { label: '已收金额', value: valueOf(row, 'settledAmount') },
      { label: '未收金额', value: valueOf(row, 'unsettledAmount') },
      { label: '到期日', value: valueOf(row, 'dueDate') },
      { label: '账龄', value: valueOf(row, 'agingDays') },
      { label: '开票状态', value: valueOf(row, 'invoiceStatus') },
      { label: '核销状态', value: valueOf(row, 'settlementStatus') },
      { label: '信用占用', value: valueOf(row, 'creditOccupied') },
      { label: '信用释放', value: valueOf(row, 'creditReleaseStatus') },
    );
  }
  if (row.code?.startsWith('AP') || row.code?.startsWith('AP-EST')) {
    fields.splice(6, 0,
      { label: '入库状态', value: valueOf(row, 'inboundStatus') },
      { label: '暂估状态', value: valueOf(row, 'provisionalStatus') },
      { label: '到票状态', value: valueOf(row, 'invoiceStatus') },
      { label: '三单匹配', value: valueOf(row, 'matchStatus') },
      { label: '三单来源', value: matchRefDisplay(row) },
      { label: '已付金额', value: valueOf(row, 'settledAmount') },
      { label: '未付金额', value: valueOf(row, 'unsettledAmount') },
      { label: '可付款金额', value: valueOf(row, 'payableAmount') },
      { label: '质检扣款', value: valueOf(row, 'qualityDeduction') },
      { label: '付款条件', value: valueOf(row, 'paymentCondition') },
    );
  }
  if (row.code?.startsWith('INV') || row.code?.startsWith('PINV') || row.code?.startsWith('RED')) {
    fields.splice(6, 0,
      { label: '发票方向', value: valueOf(row, 'direction') },
      { label: '发票类型', value: valueOf(row, 'invoiceType') },
      { label: '未税金额', value: valueOf(row, 'taxExclusiveAmount') },
      { label: '税额', value: valueOf(row, 'taxAmount') },
      { label: '开票/收票日期', value: valueOf(row, 'issueDate') },
      { label: '勾稽/认证', value: valueOf(row, 'matchStatus') },
      { label: '认证状态', value: valueOf(row, 'certificationStatus') },
      { label: '红冲状态', value: valueOf(row, 'redStatus') },
    );
  }
  if (row.code?.startsWith('BNK') || row.code?.startsWith('PAY') || row.code?.startsWith('REF')) {
    fields.splice(6, 0,
      { label: '流水方向', value: valueOf(row, 'direction') },
      { label: '账户', value: valueOf(row, 'accountName') },
      { label: '到账/付款日期', value: valueOf(row, 'transactionDate') },
      { label: '可核销金额', value: valueOf(row, 'unsettledAmount') },
      { label: '已核销金额', value: valueOf(row, 'settledAmount') },
      { label: '银行流水号', value: valueOf(row, 'bankFlowCode') },
      { label: '对账状态', value: valueOf(row, 'reconcileStatus') },
      { label: '回单状态', value: valueOf(row, 'receiptStatus') },
    );
  }
  if (row.afterSalesCloseStatus) {
    fields.push(
      { label: '退货入库', value: valueOf(row, 'afterSalesReturnStatus') },
      { label: '退款付款', value: valueOf(row, 'refundPaymentStatus') },
      { label: '应收调整', value: valueOf(row, 'receivableAdjustStatus') },
      { label: '发票红冲', value: valueOf(row, 'redInvoiceStatus') },
      { label: '售后关闭校验', value: valueOf(row, 'afterSalesCloseStatus') },
    );
  }
  return fields;
}

function recordTable(columns: string[], rows: string[][]) {
  return h('div', { class: 'aw-doc-tbl-wrap' }, [
    h('div', { class: 'aw-doc-tbl-inner' }, [
      h('table', { class: 'aw-doc-tbl' }, [
        h('thead', [h('tr', columns.map((column) => h('th', [h('div', { class: 'aw-th-inner' }, column)])))]),
        h('tbody', rows.map((cells) => h('tr', cells.map((cell, index) => h('td', isMoneyField('', columns[index] || '') ? formatMoney(cell) : cell))))),
      ]),
    ]),
  ]);
}
</script>

<style>
.finance-date-filter {
  align-items: center;
  background: transparent;
  border: 0;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  margin: 0 0 10px;
  min-height: 32px;
  overflow-x: auto;
  padding: 0;
  white-space: nowrap;
}

.finance-date-filter__presets,
.finance-date-filter__custom {
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
}

.finance-date-filter__custom {
  color: var(--aw-fg-2);
  font-size: 13px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.finance-date-filter .aw-tool-btn {
  height: 30px;
  padding: 0 12px;
}

.finance-date-filter .aw-tool-btn.active {
  background: rgba(86, 119, 252, 0.12);
  border-color: var(--aw-primary);
  color: var(--aw-primary);
}

.finance-date-filter .aw-input {
  height: 30px;
  min-width: 132px;
  padding: 0 10px;
}

.finance-summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 12px 0;
}

.finance-summary-card {
  background: var(--aw-bg);
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 7px;
  min-height: 96px;
  padding: 14px 16px;
}

.finance-summary-card span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.finance-summary-card strong {
  color: var(--aw-fg);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.finance-summary-card em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
}

.finance-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.finance-form-field {
  display: grid;
  gap: 6px;
}

.finance-form-field span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-link-btn {
  background: transparent;
  border: 0;
  color: var(--aw-danger);
  cursor: pointer;
}

@media (max-width: 980px) {
  .finance-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .finance-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .finance-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
