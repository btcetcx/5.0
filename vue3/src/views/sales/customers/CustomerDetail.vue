<template>
  <aw-detail-page>
    <template #toolbar>
      <aw-detail-toolbar :actions="detailActions" @back="router.push('/sales/customers')" @action="handleAction" />
    </template>
    <template #header>
      <aw-detail-header
        :title="customer.name"
        :status-text="customer.statusName"
        :status-tone="statusTone(customer.status)"
        :code="customer.code"
        :metas="headerMetas"
      />
    </template>

    <section class="aw-card">
      <aw-detail-tabs v-model="activeTab" :tabs="tabs" />
      <div v-if="actionMessage" class="aw-form-note detail-action-message">{{ actionMessage }}</div>

      <template v-if="activeTab === 'info'">
        <div class="aw-detail-section-title">基础信息</div>
        <aw-detail-info-grid :items="detailFields" />
        <aw-detail-metric-grid :items="metricFields" :formatter="formatMoney" />
      </template>

      <template v-else>
        <div class="aw-detail-section-title">{{ activeTabLabel }}</div>
        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl">
              <thead>
                <tr>
                  <th v-for="column in activeTable.columns" :key="column.key" :class="column.className">
                    <div class="aw-th-inner">{{ column.title }}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in activeTable.rows" :key="row.id">
                  <td v-for="column in activeTable.columns" :key="column.key" :class="column.cellClassName">
                    <span v-if="column.status" :class="['aw-status', row.statusTone || 'green']">{{ row[column.key] }}</span>
                    <span v-else :class="{ 'aw-link': column.link }">{{ tableCellValue(row[column.key], column) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </section>
  </aw-detail-page>
  <aw-audit-action-modal
    :open="auditModalOpen"
    title="客户审核"
    :document="auditDocument"
    :approval-nodes="auditApprovalNodes"
    default-action="approve"
    opinion-label="审核意见"
    @cancel="auditModalOpen = false"
    @confirm="confirmAudit"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listCustomers } from '@/app/api/sales/resources';
import { formatMoney as formatCurrency, isMoneyField } from '@/app/utils/money';
import type { Customer } from '@/app/api/sales/types';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailMetricGrid from '@/components/detail-page/AwDetailMetricGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import type { AuditActionPayload, AuditApprovalNode, AuditDocumentSummary, DetailAction, DetailTabItem } from '@/components/detail-page/types';

type CustomerDetailColumn = {
  key: string;
  title: string;
  className?: string;
  cellClassName?: string;
  link?: boolean;
  status?: boolean;
};
type CustomerDetailRow = Record<string, string> & {
  id: string;
  statusTone?: string;
};
type CustomerDetailTable = {
  columns: CustomerDetailColumn[];
  rows: CustomerDetailRow[];
};

const router = useRouter();
const route = useRoute();
const customer = ref<Customer>({
  id: '',
  code: '',
  name: '',
  groupName: '',
  contactName: '',
  contactPosition: '',
  contactPhone: '',
  managerName: '',
  creditLimit: 0,
  creditUsed: 0,
  creditHold: 0,
  receivableAmount: 0,
  creditAvailable: 0,
  paymentTerm: '',
  creditStatus: '',
  creditStatusName: '',
  status: '',
  statusName: '',
});
const activeTab = ref('info');
const actionMessage = ref('');
const auditModalOpen = ref(false);
const readActions: DetailAction[] = [
  { key: 'print', label: '打印' },
  { key: 'export', label: '导出' },
];
const detailActions = computed<DetailAction[]>(() => customerDetailActions(customer.value.status));
const tabs: DetailTabItem[] = [
  { key: 'info', label: '客户信息' },
  { key: 'product', label: '产品记录' },
  { key: 'buy', label: '购买记录' },
  { key: 'outbound', label: '发货记录' },
  { key: 'invoice', label: '开票记录' },
  { key: 'pay', label: '回款核销' },
  { key: 'after', label: '售后记录' },
  { key: 'log', label: '操作记录' },
];

const activeTabLabel = computed(() => tabs.find((tab) => tab.key === activeTab.value)?.label || '');
const auditDocument = computed<AuditDocumentSummary>(() => ({
  title: customer.value.name || '客户详情',
  code: customer.value.code || '-',
  status: customer.value.statusName || '-',
  applicant: customer.value.managerName || '销售负责人',
  flowName: '客户准入审核流程',
  currentNode: '销售主管审核',
}));
const auditApprovalNodes = computed<AuditApprovalNode[]>(() => [
  { name: '提交审批', approver: customer.value.managerName || '销售负责人', method: '提交', state: 'done', result: '已提交' },
  { name: '销售主管审核', approver: '销售主管', method: '审批', state: 'current', result: '待审核' },
  { name: '客户状态回写', approver: '系统', method: '自动', state: 'pending', result: '待回写' },
]);
const commonRecordTable: CustomerDetailTable = {
  columns: [
    { key: 'index', title: '序号', className: 'aw-index-col' },
    { key: 'code', title: '单据编号', link: true },
    { key: 'type', title: '业务类型' },
    { key: 'amount', title: '金额', cellClassName: 'aw-num' },
    { key: 'status', title: '状态', status: true },
    { key: 'date', title: '业务日期' },
  ],
  rows: [
    { id: 'record-1', index: '1', code: 'SO-202605-031', type: '销售订单', amount: '288,000.00', status: '已确认', statusTone: 'green', date: '2026-05-31' },
  ],
};
const customerProductTable: CustomerDetailTable = {
  columns: [
    { key: 'index', title: '序号', className: 'aw-index-col' },
    { key: 'productCode', title: '产品编码', link: true },
    { key: 'productName', title: '产品名称' },
    { key: 'model', title: '规格型号' },
    { key: 'category', title: '产品分类' },
    { key: 'unit', title: '单位' },
    { key: 'qty', title: '购买数量', cellClassName: 'aw-num' },
    { key: 'amount', title: '购买金额', cellClassName: 'aw-num' },
    { key: 'lastDate', title: '最近购买日期' },
  ],
  rows: [
    { id: 'product-1', index: '1', productCode: 'CP-20260521001', productName: '智能温控锅 AW-H8', model: 'AW-H8', category: '成品', unit: '台', qty: '48', amount: '288,000.00', lastDate: '2026-05-31' },
    { id: 'product-2', index: '2', productCode: 'CP-20260519002', productName: '控制板组件', model: 'PCB-A2', category: '半成品', unit: '块', qty: '120', amount: '86,400.00', lastDate: '2026-05-18' },
  ],
};
const outboundTable: CustomerDetailTable = {
  columns: [
    { key: 'index', title: '序号', className: 'aw-index-col' },
    { key: 'code', title: '出库单号', link: true },
    { key: 'sourceCode', title: '来源单据' },
    { key: 'warehouse', title: '出库仓库' },
    { key: 'qty', title: '出库数量', cellClassName: 'aw-num' },
    { key: 'status', title: '出库状态', status: true },
    { key: 'date', title: '出库日期' },
  ],
  rows: [
    { id: 'outbound-1', index: '1', code: 'OUT-202605-031', sourceCode: 'SO-202605-031', warehouse: '成品仓', qty: '48', status: '已出库', statusTone: 'green', date: '2026-05-31' },
    { id: 'outbound-2', index: '2', code: 'OUT-202605-018', sourceCode: 'SO-202605-018', warehouse: '成品仓', qty: '120', status: '已出库', statusTone: 'green', date: '2026-05-18' },
  ],
};
const invoiceTable: CustomerDetailTable = {
  columns: [
    { key: 'index', title: '序号', className: 'aw-index-col' },
    { key: 'invoiceNo', title: '发票号码', link: true },
    { key: 'sourceCode', title: '来源单据' },
    { key: 'type', title: '发票类型' },
    { key: 'amount', title: '开票金额', cellClassName: 'aw-num' },
    { key: 'tax', title: '税额', cellClassName: 'aw-num' },
    { key: 'status', title: '开票状态', status: true },
    { key: 'date', title: '开票日期' },
  ],
  rows: [
    { id: 'invoice-1', index: '1', invoiceNo: 'INV-202605-031', sourceCode: 'SO-202605-031', type: '增值税专票', amount: '288,000.00', tax: '33,132.74', status: '已开票', statusTone: 'green', date: '2026-06-01' },
    { id: 'invoice-2', index: '2', invoiceNo: 'INV-202605-018', sourceCode: 'SO-202605-018', type: '增值税专票', amount: '86,400.00', tax: '9,939.82', status: '已开票', statusTone: 'green', date: '2026-05-19' },
  ],
};
const paymentTable: CustomerDetailTable = {
  columns: [
    { key: 'index', title: '序号', className: 'aw-index-col' },
    { key: 'receiptNo', title: '回款单号', link: true },
    { key: 'sourceCode', title: '来源单据' },
    { key: 'receivableAmount', title: '应收金额', cellClassName: 'aw-num' },
    { key: 'receivedAmount', title: '回款金额', cellClassName: 'aw-num' },
    { key: 'settledAmount', title: '核销金额', cellClassName: 'aw-num' },
    { key: 'status', title: '核销状态', status: true },
    { key: 'date', title: '回款日期' },
  ],
  rows: [
    { id: 'payment-1', index: '1', receiptNo: 'RCV-202606-001', sourceCode: 'SO-202605-031', receivableAmount: '288,000.00', receivedAmount: '200,000.00', settledAmount: '200,000.00', status: '部分核销', statusTone: 'yellow', date: '2026-06-02' },
    { id: 'payment-2', index: '2', receiptNo: 'RCV-202605-018', sourceCode: 'SO-202605-018', receivableAmount: '86,400.00', receivedAmount: '86,400.00', settledAmount: '86,400.00', status: '已核销', statusTone: 'green', date: '2026-05-22' },
  ],
};
const afterSalesTable: CustomerDetailTable = {
  columns: [
    { key: 'index', title: '序号', className: 'aw-index-col' },
    { key: 'serviceNo', title: '售后单号', link: true },
    { key: 'sourceCode', title: '来源单据' },
    { key: 'type', title: '售后类型' },
    { key: 'productName', title: '产品名称' },
    { key: 'qty', title: '售后数量', cellClassName: 'aw-num' },
    { key: 'status', title: '处理状态', status: true },
    { key: 'date', title: '受理日期' },
  ],
  rows: [
    { id: 'after-1', index: '1', serviceNo: 'AS-202606-006', sourceCode: 'SO-202605-031', type: '现场服务', productName: '智能温控锅 AW-H8', qty: '3', status: '处理中', statusTone: 'yellow', date: '2026-06-03' },
    { id: 'after-2', index: '2', serviceNo: 'AS-202605-018', sourceCode: 'SO-202605-018', type: '质检异常', productName: '控制板组件', qty: '6', status: '已关闭', statusTone: 'green', date: '2026-05-24' },
  ],
};
const activeTable = computed<CustomerDetailTable>(() => {
  if (activeTab.value === 'product') return customerProductTable;
  if (activeTab.value === 'outbound') return outboundTable;
  if (activeTab.value === 'invoice') return invoiceTable;
  if (activeTab.value === 'pay') return paymentTable;
  if (activeTab.value === 'after') return afterSalesTable;
  return commonRecordTable;
});
const headerMetas = computed(() => [
  { label: '客户分组', value: customer.value.groupName },
  { label: '主联系人', value: `${customer.value.contactName} / ${customer.value.contactPosition || '-'}` },
  { label: '联系方式', value: customer.value.contactPhone },
  { label: '客户经理', value: customer.value.managerName },
]);
const detailFields = computed(() => [
  { label: '客户名称', value: customer.value.name },
  { label: '客户分组', value: customer.value.groupName },
  { label: '主联系人', value: customer.value.contactName },
  { label: '职位', value: customer.value.contactPosition || '-' },
  { label: '联系方式', value: customer.value.contactPhone },
  { label: '客户经理', value: customer.value.managerName },
  { label: '地址', value: customer.value.address || '-' },
  { label: '客户状态', value: customer.value.statusName },
]);
const metricFields = computed(() => [
  { label: '信用额度', value: customer.value.creditLimit },
  { label: '已用额度', value: customer.value.creditUsed },
  { label: '占用额度', value: customer.value.creditHold },
  { label: '应收未收', value: customer.value.receivableAmount },
  { label: '可用额度', value: customer.value.creditAvailable },
]);

function formatMoney(value: string | number) {
  return formatCurrency(value);
}

function tableCellValue(value: string, column: CustomerDetailColumn) {
  if (isMoneyField(column.key, column.title)) return formatCurrency(value);
  return value;
}

function handleAction(key: string) {
  if (key === 'approve') {
    auditModalOpen.value = true;
    return;
  }
  if ((key === 'delete' || key === 'disable') && !window.confirm(`确认${key === 'delete' ? '删除' : '停用'}客户 ${customer.value.name || ''} 吗？`)) return;
  const label = detailActions.value.find((action) => action.key === key)?.label || key;
  actionMessage.value = `${label}动作已记录，客户数据保持在前端状态。`;
}

function confirmAudit(payload: AuditActionPayload) {
  auditModalOpen.value = false;
  if (payload.action === 'approve') {
    customer.value = { ...customer.value, status: 'approved', statusName: '已审核' };
  } else if (payload.action === 'reject') {
    customer.value = { ...customer.value, status: 'rejected', statusName: '已驳回' };
  } else if (payload.action === 'return') {
    customer.value = { ...customer.value, status: 'draft', statusName: '草稿' };
  }
  actionMessage.value = `客户审核弹窗已提交：${auditActionLabel(payload.action)}。`;
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = { approve: '审核通过', reject: '审核驳回', return: '退回修改', transfer: '转交处理' };
  return labels[action] || action;
}

function statusTone(status: string) {
  if (status === 'approved') return 'green';
  if (status === 'pending' || status === 'draft' || status === 'following') return 'yellow';
  if (status === 'disabled' || status === 'rejected') return 'gray';
  return '';
}

function customerDetailActions(status: string): DetailAction[] {
  if (status === 'pending') return [{ key: 'approve', label: '审核', primary: true }];
  if (status === 'draft') {
    return [
      { key: 'submit', label: '提交审核', primary: true },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除', danger: true },
    ];
  }
  if (status === 'rejected') {
    return [
      { key: 'edit', label: '编辑' },
      { key: 'submit', label: '重新提交', primary: true },
      { key: 'delete', label: '删除', danger: true },
    ];
  }
  if (status === 'disabled') return [{ key: 'enable', label: '启用', primary: true }, ...readActions];
  if (status === 'approved') {
    return [
      { key: 'edit', label: '编辑' },
      { key: 'disable', label: '停用', danger: true },
      ...readActions,
    ];
  }
  if (status === 'following') {
    return [
      { key: 'edit', label: '编辑' },
      { key: 'submit', label: '提交审核' },
      { key: 'disable', label: '停用', danger: true },
      ...readActions,
    ];
  }
  return readActions;
}

onMounted(async () => {
  const result = await listCustomers({ pageNo: 1, pageSize: 20 });
  customer.value = result.items.find((item) => item.id === route.params.id) || result.items[0] || customer.value;
});
</script>

<style scoped>
.detail-action-message {
  margin: 12px 0;
}
</style>
