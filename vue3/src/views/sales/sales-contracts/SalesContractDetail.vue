<template>
  <aw-detail-page>
    <template #toolbar>
      <aw-detail-toolbar :actions="detailActions" @back="router.push('/sales/sales-contracts')" @action="handleDetailAction" />
    </template>
    <template #header>
      <aw-detail-header
        :title="contract.topic"
        :code="contract.code"
        :status-text="contract.executionStatusName"
        :status-tone="statusTone(contract.executionStatus)"
        :metas="headerMetas"
      />
    </template>

    <section class="aw-form-card">
      <aw-detail-tabs v-model="activeTab" :tabs="tabs" />
      <div v-if="actionMessage" class="aw-form-note detail-action-message">{{ actionMessage }}</div>
      <template v-if="activeTab === 'info'">
        <div class="aw-detail-section-title">基础信息</div>
        <aw-detail-info-grid :items="infoItems" />
      </template>
      <template v-else-if="activeTab === 'products'">
        <div class="aw-detail-section-title">合同产品</div>
        <record-table :columns="productColumns" :rows="productRows" />
      </template>
      <template v-else-if="activeTab === 'orders'">
        <div class="aw-detail-section-title">订单核销</div>
        <record-table :columns="orderColumns" :rows="orderRows" />
      </template>
      <template v-else-if="activeTab === 'deliveries'">
        <div class="aw-detail-section-title">发货记录</div>
        <record-table :columns="deliveryColumns" :rows="deliveryRows" />
      </template>
      <template v-else-if="activeTab === 'invoices'">
        <div class="aw-detail-section-title">开票记录</div>
        <record-table :columns="invoiceColumns" :rows="invoiceRows" />
      </template>
      <template v-else-if="activeTab === 'payments'">
        <div class="aw-detail-section-title">回款记录</div>
        <record-table :columns="paymentColumns" :rows="paymentRows" />
      </template>
      <template v-else>
        <div class="aw-detail-section-title">操作记录</div>
        <record-table :columns="operationColumns" :rows="operationRows" />
      </template>
    </section>
  </aw-detail-page>
  <aw-audit-action-modal
    :open="auditModalOpen"
    title="销售合同审核"
    :document="auditDocument"
    :approval-nodes="auditApprovalNodes"
    default-action="approve"
    opinion-label="审核意见"
    @cancel="auditModalOpen = false"
    @confirm="confirmAudit"
  />
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, type PropType } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSalesContract } from '@/app/api/sales/resources';
import type { SalesContract } from '@/app/api/sales/types';
import { formatMoney } from '@/app/utils/money';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import type { AuditActionPayload, AuditApprovalNode, AuditDocumentSummary, DetailAction, DetailFieldItem, DetailMetaItem, DetailTabItem } from '@/components/detail-page/types';

const route = useRoute();
const router = useRouter();
const activeTab = ref('info');
const actionMessage = ref('');
const auditModalOpen = ref(false);
const contract = ref<SalesContract>({
  id: '',
  code: '',
  topic: '',
  customerName: '',
  amount: 0,
  currency: 'CNY',
  signedDate: '',
  effectiveDate: '',
  expireDate: '',
  receivedAmount: 0,
  invoiceAmount: 0,
  executionStatusName: '',
  status: '',
  statusName: '',
  ownerName: '',
});

const contractReadActions: DetailAction[] = [
  { key: 'print', label: '打印' },
  { key: 'export', label: '导出' },
];
const detailActions = computed<DetailAction[]>(() => contractDetailActions(contract.value.executionStatus || contract.value.status));
const tabs: DetailTabItem[] = [
  { key: 'info', label: '合同信息' },
  { key: 'products', label: '合同产品' },
  { key: 'orders', label: '订单核销' },
  { key: 'deliveries', label: '发货记录' },
  { key: 'invoices', label: '开票记录' },
  { key: 'payments', label: '回款记录' },
  { key: 'operations', label: '操作记录' },
];

const headerMetas = computed<DetailMetaItem[]>(() => [
  { label: '客户', value: contract.value.customerName },
  { label: '来源', value: contract.value.sourceCode || '-' },
  { label: '签订日期', value: contract.value.signedDate },
  { label: '销售人员', value: contract.value.ownerName },
]);
const auditDocument = computed<AuditDocumentSummary>(() => ({
  title: contract.value.topic || '销售合同',
  code: contract.value.code || '-',
  status: contract.value.executionStatusName || contract.value.statusName || '-',
  applicant: contract.value.ownerName || '销售人员',
  flowName: '销售合同审批流',
  currentNode: '销售主管审核',
}));
const auditApprovalNodes = computed<AuditApprovalNode[]>(() => [
  { name: '提交审批', approver: contract.value.ownerName || '销售人员', method: '提交', state: 'done', result: '已提交' },
  { name: '销售主管审核', approver: '销售主管', method: '审批', state: 'current', result: '待审核' },
  { name: '合同状态回写', approver: '系统', method: '自动', state: 'pending', result: '待回写' },
]);
const infoItems = computed<DetailFieldItem[]>(() => [
  { label: '合同主题', value: contract.value.topic },
  { label: '合同编号', value: contract.value.code },
  { label: '客户', value: contract.value.customerName },
  { label: '来源单据', value: contract.value.sourceCode || '-' },
  { label: '合同金额', value: money(contract.value.amount) },
  { label: '已下单金额', value: money(contract.value.orderedAmount) },
  { label: '已发货金额', value: money(contract.value.shippedAmount) },
  { label: '应收金额', value: money(contract.value.receivableAmount) },
  { label: '已开票金额', value: money(contract.value.invoiceAmount) },
  { label: '已回款金额', value: money(contract.value.receivedAmount) },
  { label: '剩余金额', value: money(contract.value.balanceAmount) },
  { label: '签订日期', value: contract.value.signedDate },
  { label: '失效日期', value: contract.value.expireDate },
  { label: '销售人员', value: contract.value.ownerName },
  { label: '履约状态', value: contract.value.executionStatusName },
]);

const productColumns = ['来源明细', '产品编号', '产品名称', '单位', '合同数量', '已下单', '剩余可下单', '单价', '金额', '支付约定'];
const productRows = computed(() =>
  (contract.value.products || []).map((item) => [
    item.sourceLine,
    item.productCode,
    item.productName,
    item.unit,
    item.quantity,
    item.orderedQuantity ?? 0,
    item.balanceQuantity ?? 0,
    money(item.unitPrice),
    money(item.amount),
    item.paymentTerm || '-',
  ]),
);
const orderColumns = ['销售订单', '订单明细', '核销数量', '核销金额', '核销时间', '状态'];
const orderRows = computed(() => (contract.value.orderWriteOffs || []).map((item) => [item.orderCode, item.orderLine, item.quantity, money(Number(item.amount)), item.time, item.status]));
const deliveryColumns = ['发货单', '销售订单', '发货数量', '出库金额', '物流状态', '时间'];
const deliveryRows = computed(() => (contract.value.deliveryRecords || []).map((item) => [item.deliveryCode, item.orderCode, item.quantity, money(Number(item.amount)), item.logisticsStatus, item.time]));
const invoiceColumns = ['发票申请', '发票号', '开票金额', '税额', '状态'];
const invoiceRows = computed(() => (contract.value.invoiceRecords || []).map((item) => [item.requestCode, item.invoiceCode, money(Number(item.amount)), money(Number(item.taxAmount)), item.status]));
const paymentColumns = ['收款单', '回款金额', '核销订单', '核销状态', '时间'];
const paymentRows = computed(() => (contract.value.paymentRecords || []).map((item) => [item.receiptCode, money(Number(item.amount)), item.orderCode, item.writeOffStatus, item.time]));
const operationColumns = ['时间', '操作人', '操作', '说明'];
const operationRows = computed(() => (contract.value.operationRecords || []).map((item) => [item.time, item.operator, item.action, item.remark]));

const RecordTable = defineComponent({
  props: {
    columns: { type: Array as PropType<string[]>, required: true },
    rows: { type: Array as PropType<Array<Array<string | number>>>, required: true },
  },
  setup(props) {
    return () =>
      h('div', { class: 'aw-doc-tbl-wrap' }, [
        h('div', { class: 'aw-doc-tbl-inner' }, [
          h('table', { class: 'aw-doc-tbl' }, [
            h('thead', [h('tr', [h('th', { style: 'width:60px' }, '序号'), ...props.columns.map((column) => h('th', column))])]),
            h(
              'tbody',
              props.rows.length
                ? props.rows.map((row, index) => h('tr', [h('td', index + 1), ...row.map((cell) => h('td', String(cell ?? '-')))]))
                : [h('tr', [h('td', { colspan: props.columns.length + 1, style: 'text-align:center;color:var(--aw-fg-3);padding:24px' }, '暂无记录')])],
            ),
          ]),
        ]),
      ]);
  },
});

function statusTone(status: unknown) {
  if (status === 'performing' || status === 'completed') return 'green';
  if (status === 'pendingExecution' || status === 'pendingApproval') return 'yellow';
  if (status === 'disabled' || status === 'terminated') return 'gray';
  return '';
}

function money(value?: number) {
  return formatMoney(value);
}

function handleDetailAction(key: string) {
  if (key === 'approve') {
    auditModalOpen.value = true;
    return;
  }
  if (key === 'terminate' && !window.confirm(`确认终止合同 ${contract.value.topic || contract.value.code || ''} 吗？`)) return;
  const label = detailActions.value.find((action) => action.key === key)?.label || key;
  actionMessage.value = `${label}动作已记录，合同当前状态保留在前端。`;
}

function confirmAudit(payload: AuditActionPayload) {
  auditModalOpen.value = false;
  if (payload.action === 'approve') {
    contract.value = { ...contract.value, executionStatus: 'pendingExecution', executionStatusName: '待履约', status: 'approved', statusName: '已审核' };
  } else if (payload.action === 'reject') {
    contract.value = { ...contract.value, executionStatus: 'rejected', executionStatusName: '已驳回', status: 'rejected', statusName: '已驳回' };
  } else if (payload.action === 'return') {
    contract.value = { ...contract.value, executionStatus: 'draft', executionStatusName: '草稿', status: 'draft', statusName: '草稿' };
  }
  actionMessage.value = `销售合同审核弹窗已提交：${auditActionLabel(payload.action)}。`;
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = { approve: '审核通过', reject: '审核驳回', return: '退回修改', transfer: '转交处理' };
  return labels[action] || action;
}

function contractDetailActions(status?: string): DetailAction[] {
  if (status === 'pendingApproval') return [{ key: 'approve', label: '审核', primary: true }];
  if (status === 'pendingExecution') {
    return [
      { key: 'start', label: '开始履约', primary: true },
      { key: 'edit', label: '编辑' },
      { key: 'terminate', label: '终止', danger: true },
      ...contractReadActions,
    ];
  }
  if (status === 'performing') {
    return [
      { key: 'edit', label: '编辑' },
      { key: 'terminate', label: '终止', danger: true },
      ...contractReadActions,
    ];
  }
  return contractReadActions;
}

onMounted(async () => {
  const id = String(route.query.contractId || route.query.id || 'contract_001');
  contract.value = await getSalesContract(id);
});
</script>

<style scoped>
.detail-action-message {
  margin: 12px 0;
}
</style>
