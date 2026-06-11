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
        <span v-else>{{ value }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
import type { AttachmentRow, EditableColumn, SourcePickerBatch, SourcePickerCategory, SourcePickerConfirmPayload, SourcePickerRow } from '@/components/form-page/types';
import type { DetailTabItem } from '@/components/detail-page/types';
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
    ],
    formLines: [
      { id: '1', sourceCode: 'SO-202605-001', sourceTitle: '智能温控终端', businessType: '销项开票', amount: '59,590.00', handledAmount: '6,855.49', pendingAmount: '52,734.51' },
    ],
    lineColumns: sourceLineColumns('价税合计', '税额', '未税金额'),
  },
  settlements: {
    key: 'settlements',
    title: '资金核销',
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
    settlements: ['资金列表'],
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
  return row[key] || '-';
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
    { key: 'amount', label: '流水金额', value: formatMoney(totalAmount), hint: `${rows.length} 条资金流水` },
    { key: 'unsettled', label: '可核销金额', value: formatMoney(unsettledAmount), hint: '来自当前列表可核销金额' },
    { key: 'confirm', label: '待确认流水', value: `${pendingConfirmCount} 条`, hint: '资金状态待确认' },
    { key: 'reconcile', label: '待银行对账', value: `${pendingReconcileCount} 条`, hint: diffCount ? `${diffCount} 条差异待处理` : '对账状态未完成' },
  ];
}

function actionLabel(moduleKey: FinanceModule['key'], actionKey: string) {
  return financePageActions[moduleKey]?.find((action) => action.key === actionKey)?.label || '财务处理';
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
        { key: 'afterSales', label: '售后来源', value: `${countRowsByCenter(adjustRows, '售后')} 条`, hint: '回写售后财务处理状态' },
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
    { key: 'amount', label: '流水金额', value: formatMoney(sumRows(targetRows, 'amount')), hint: `${targetRows.length} 条资金流水` },
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
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    ['1', row.code?.startsWith('AP') ? 'PINV-202605-004' : 'INV-202605-001', row.sourceCode, row.invoiceStatus || row.status, row.amount, row.code?.startsWith('AP') ? '收票/认证' : '销项开票/红冲', row.code?.startsWith('AP') ? '认证后回写采购到票状态' : '财务处理后回写销售或售后来源单据'],
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
  { cat: '销售订单', code: 'SO-202605-001', subject: '智能温控终端发货应收', date: '2026-05-31', customer: '海南微为科技', maxQty: 20, maxRefund: '59,590.00' },
  { cat: '销售合同', code: 'SC-202605-014', subject: '年度维保服务合同', date: '2026-05-26', customer: '广州新城智能', maxQty: 1, maxRefund: '42,800.00' },
  { cat: '售后单', code: 'AS-202605-006', subject: '售后退款退货处理', date: '2026-05-30', customer: '深圳云启制造', maxQty: 1, maxRefund: '8,600.00' },
  { cat: '采购订单', code: 'PO-202605-018', subject: '工业级LCD显示屏采购', date: '2026-05-24', customer: '深圳华芯电子', maxQty: 200, maxRefund: '86,200.00' },
  { cat: '采购入库', code: 'IN-202605-018', subject: '采购入库暂估', date: '2026-05-25', customer: '深圳华芯电子', maxQty: 200, maxRefund: '86,200.00' },
  { cat: '采购退货', code: 'PRT-202605-002', subject: '采购退货冲减', date: '2026-05-28', customer: '东莞科创包装', maxQty: 20, maxRefund: '9,600.00' },
  { cat: '应收单', code: 'AR-202605-001', subject: '客户回款核销', date: '2026-05-17', customer: '海南微为科技', maxQty: 1, maxRefund: '20,000.00' },
  { cat: '应付单', code: 'AP-202605-001', subject: '供应商付款核销', date: '2026-05-18', customer: '深圳华芯电子', maxQty: 1, maxRefund: '30,000.00' },
  { cat: '售后退款单', code: 'AS-202605-006', subject: '售后退款付款', date: '2026-05-31', customer: '深圳云启制造', maxQty: 1, maxRefund: '8,600.00' },
];

const sourcePickerBatches: Record<string, SourcePickerBatch[]> = {
  'SO-202605-001': [{ deliveryNo: 'OUT-202605-009', detailNo: 'OUT-D-001', deliveryDate: '2026-05-31', warehouse: '成品仓', logistics: '顺丰', qty: 20, amount: '59,590.00', status: '签收完成' }],
  'PO-202605-018': [{ deliveryNo: 'IN-202605-018', detailNo: 'IN-D-001', deliveryDate: '2026-05-25', warehouse: '原料仓', logistics: '采购入库', qty: 200, amount: '86,200.00', status: '入库完成' }],
  'IN-202605-018': [{ deliveryNo: 'IN-202605-018', detailNo: 'IN-D-001', deliveryDate: '2026-05-25', warehouse: '原料仓', logistics: '采购入库', qty: 200, amount: '86,200.00', status: '入库完成' }],
  'AS-202605-006': [{ deliveryNo: 'RTN-202605-006', detailNo: 'RTN-D-001', deliveryDate: '2026-05-30', warehouse: '售后仓', logistics: '退货入库', qty: 1, amount: '8,600.00', status: '待退款' }],
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
          createLabel: `新增${actionTitle.value}`,
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
            return h('span', value);
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
    const lines = ref<FinanceRow[]>(props.module.formLines.map((line) => ({ ...line })));
    const attachments = ref<AttachmentRow[]>([{ id: '1', name: '', type: '财务附件', date: '2026-05-31', remark: '' }]);
    const availableSourceRows = computed(() => {
      const allowedCategories = new Set(props.module.sourceCategories.map((category) => category.key));
      return sourcePickerRows.filter((row) => allowedCategories.has(row.cat));
    });
    const addLine = () => lines.value.push({ id: String(Date.now()), sourceCode: selectedSource.value?.code || 'manual', sourceTitle: selectedSource.value?.subject || '手工录入', businessType: 'manual', amount: '0.00', handledAmount: '0.00', pendingAmount: '0.00' });
    const addAttachment = () => attachments.value.push({ id: Date.now(), name: '', type: '财务附件', date: '2026-05-31', remark: '' });
    const removeAttachment = (row: AttachmentRow) => {
      if (attachments.value.length > 1) attachments.value = attachments.value.filter((item) => item.id !== row.id);
    };
    const pickSource = (source: SourcePickerConfirmPayload) => {
      selectedSource.value = source;
      lines.value = [{ id: '1', sourceCode: source.code, sourceTitle: source.subject, businessType: source.cat, amount: String(source.maxRefund || '0.00'), handledAmount: '0.00', pendingAmount: String(source.maxRefund || '0.00') }];
      showPicker.value = false;
    };
    const formTitle = computed(() => props.actionKey ? actionLabel(props.module.key, props.actionKey) : props.module.title);
    return () => h(AwFormPage, {
      backText: `返回${formTitle.value}`,
      actions: [{ key: 'draft', label: '暂存' }, { key: 'save', label: '保存', primary: true }],
      onBack: () => emit('back'),
      onAction: () => emit('back'),
    }, () => [
      h('section', { class: 'aw-form-card' }, [
        h('h4', '基础信息'),
        h('div', { class: 'finance-form-grid' }, [
          formField('来源单据', h('button', { class: 'aw-tool-btn', type: 'button', onClick: () => showPicker.value = true }, selectedSource.value?.code || '选择来源单据')),
          formField(props.module.counterpartyLabel, h('input', { class: 'aw-input', value: selectedSource.value?.customer || '', placeholder: `选择来源后带入${props.module.counterpartyLabel}` })),
          formField('来源类型', h('input', { class: 'aw-input', value: selectedSource.value?.cat || 'manual', readonly: true })),
          formField('来源引用', h('input', { class: 'aw-input', value: selectedSource.value ? `${selectedSource.value.cat} / ${selectedSource.value.code}` : 'manual / 手工录入需填写原因', readonly: true })),
          formField('手工原因', h('input', { class: 'aw-input', placeholder: '仅手工录入时必填，正常业务必须选择来源单据' })),
          formField('回写目标', h('input', { class: 'aw-input', value: '只回写状态和汇总，不修改业务源明细' })),
          formField('状态', h('select', { class: 'aw-select' }, [h('option', '待确认'), h('option', '待核销'), h('option', '已核销')])),
        ]),
      ]),
      h('section', { class: 'aw-form-card' }, [
        h('h4', '明细子表'),
        h(AwEditableSubTable, { columns: props.module.lineColumns, rows: lines.value, addText: '新增明细', onAdd: addLine }, {
          cell: ({ column, row }: { column: EditableColumn; row: FinanceRow }) => h('input', { class: 'aw-input', value: row[column.key] || '', onInput: (event: Event) => row[column.key] = (event.target as HTMLInputElement).value }),
          actions: ({ index }: { index: number }) => h('button', { class: 'aw-link-btn', type: 'button', onClick: () => lines.value.splice(index, 1) }, '删除'),
        }),
      ]),
      h('section', { class: 'aw-form-card' }, [h('h4', '附件'), h(AwAttachmentTable, { rows: attachments.value, typeOptions: ['财务附件', '银行回单', '发票附件', '审批材料'], onAdd: addAttachment, onRemove: removeAttachment })]),
      h('section', { class: 'aw-form-card' }, [h('h4', '备注/说明'), h(AwRichTextEditor, { modelValue: remark.value, placeholder: '请输入财务处理说明、差异原因、核销备注等', 'onUpdate:modelValue': (value: string) => remark.value = value })]),
      h(AwSourcePickerModal, { open: showPicker.value, title: '选择来源单据', currentCustomer: '', categories: props.module.sourceCategories, rows: availableSourceRows.value, batches: sourcePickerBatches, onCancel: () => showPicker.value = false, onConfirm: pickSource }),
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
        actions: detailActions(props.module.key),
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
        { key: 'inv-node', title: '开票节点', sub: '销售发起开票申请，财务开票后回写', type: 'select', value: '销售申请后开票', options: ['销售申请后开票', '应收确认后自动申请'] },
        { key: 'inv-red', title: '红冲规则', sub: '售后退款/退货触发红冲校验', type: 'switch', enabled: true },
        { key: 'inv-cert', title: '认证规则', sub: '进项发票收票认证后回写采购到票状态', type: 'switch', enabled: true },
      ] },
      { key: 'fund', label: '资金策略', rows: [
        { key: 'fund-account', title: '账户规则', sub: '维护收付款账户和默认账户', type: 'select', value: '按业务中心默认账户', options: ['按业务中心默认账户', '手工选择账户'] },
        { key: 'fund-settle', title: '核销规则', sub: '流水必须核销到应收、应付或退款单', type: 'switch', enabled: true },
        { key: 'fund-bank', title: '对账规则', sub: '银行流水导入后进行对账匹配', type: 'switch', enabled: true },
      ] },
    ];
    return () => h(AwSettingPage, null, {
      toolbar: () => h(AwSettingToolbar, { backText: '返回财务工作台', addText: '新增策略', showAdd: true }),
      default: () => h(AwStrategySettingPage, { title: '财务设置', description: '仅保留应收、应付、发票、资金四类必要策略，公共字段、编号、审批、打印模板沿用设置母版。', tabs }),
    });
  },
});

function formField(label: string, control: ReturnType<typeof h>) {
  return h('label', { class: 'finance-form-field' }, [h('span', label), control]);
}

function detailActions(key: FinanceModule['key']) {
  const map: Record<FinanceModule['key'], Array<{ key: string; label: string; primary?: boolean }>> = {
    receivables: [{ key: 'receive', label: '收款登记' }, { key: 'settle', label: '核销收款', primary: true }, { key: 'invoice', label: '开票申请' }, { key: 'adjust', label: '应收调整' }],
    payables: [{ key: 'apply', label: '付款申请' }, { key: 'pay', label: '付款登记', primary: true }, { key: 'invoice', label: '收票认证' }, { key: 'match', label: '三单匹配' }],
    invoices: [{ key: 'output', label: '销项开票' }, { key: 'input', label: '进项收票认证', primary: true }, { key: 'match', label: '发票勾稽' }, { key: 'red', label: '红冲处理' }],
    settlements: [{ key: 'receive', label: '收款登记' }, { key: 'pay', label: '付款登记' }, { key: 'refund', label: '退款付款' }, { key: 'settle', label: '核销处理', primary: true }],
  };
  return map[key];
}

function detailFields(row: FinanceRow, counterpartyLabel: string) {
  const fields = [
    { label: '财务单号', value: valueOf(row, 'code') },
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
        h('tbody', rows.map((cells) => h('tr', cells.map((cell) => h('td', cell))))),
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
