<template>
  <aw-detail-page v-if="service">
    <template #toolbar>
      <aw-detail-toolbar
        :back-text="backText"
        :actions="detailActions"
        @back="emit('back')"
        @action="handleAction"
      />
    </template>

    <template #header>
      <aw-detail-header
        :title="service.topic"
        :code="service.code"
        :status-text="service.statusName"
        :status-tone="statusTone(service.status)"
        :metas="headerMetas"
      >
        <div class="as-summary-line">
          <span>处理方式：{{ service.handlingMethod }}</span>
          <span>仓储：{{ service.warehouseStatus }}</span>
          <span>财务：{{ service.financeStatus }}</span>
          <span>发票：{{ service.invoiceStatus }}</span>
          <span>质量：{{ service.qualityStatus }}</span>
        </div>
      </aw-detail-header>
    </template>

    <aw-detail-metric-grid :items="summaryMetrics" />
    <div v-if="actionMessage" class="aw-form-note as-detail-message">{{ actionMessage }}</div>
    <aw-detail-tabs v-model="activeTab" :tabs="tabs" />

    <section v-if="activeTab === 'basic'" class="aw-form-card">
      <div class="aw-detail-section-title">基本信息</div>
      <aw-detail-info-grid :items="basicItems" />
    </section>

    <section v-else-if="activeTab === 'lines'" class="aw-form-card">
      <div class="aw-detail-section-title">售后产品明细</div>
      <aw-editable-sub-table :columns="lineColumns" :rows="service.lines" add-text="添加明细" :show-add="false">
        <template #cell="{ column, row }">
          <span>{{ formatLineCell(row[column.key], column.key) }}</span>
        </template>
      </aw-editable-sub-table>
    </section>

    <section v-else-if="activeTab === 'docs'" class="aw-form-card">
      <div class="aw-detail-section-title">关联单据与状态回填</div>
      <div class="as-writeback-summary">
        <span :class="['aw-status', statusTone(service.status)]">{{ service.statusName }}</span>
        <strong>{{ writebackSummary }}</strong>
      </div>
      <aw-editable-sub-table :columns="docColumns" :rows="documentRows" add-text="添加单据" :show-add="false" :action-width="120">
        <template #cell="{ column, row }">
          <span v-if="column.key === 'status'" :class="['aw-status', docTone(String(row.status))]">{{ row.status }}</span>
          <span v-else>{{ row[column.key] || '-' }}</span>
        </template>
        <template #actions="{ row }">
          <span v-if="row.generated && !isTerminalDoc(row.status)" class="aw-link" @click="advanceDoc(String(row.id))">推进状态</span>
          <span v-else class="aw-muted">{{ row.generated ? '已完成' : '未生成' }}</span>
        </template>
      </aw-editable-sub-table>
    </section>

    <section v-else-if="activeTab === 'sla'" class="aw-form-card">
      <div class="aw-detail-section-title">SLA / 流程进度</div>
      <div class="as-flow">
        <div v-for="step in flowSteps" :key="step.label" :class="['as-flow-step', step.done ? 'done' : '']">
          <i>{{ step.index }}</i>
          <strong>{{ step.label }}</strong>
          <span>{{ step.desc }}</span>
        </div>
      </div>
    </section>

    <section v-else class="aw-form-card">
      <div class="aw-detail-section-title">{{ activeTabLabel }}</div>
      <div v-if="activeTab === 'communication' && entryFromMineTask" class="as-communication-editor">
        <textarea
          v-model="communicationDraft"
          class="aw-input"
          placeholder="请输入本次与客户、仓储、财务或内部处理人的沟通内容"
        />
        <div class="as-communication-actions">
          <span>保存后会回填到沟通记录，售后列表和任务池查看时只读展示。</span>
          <button class="aw-btn primary" type="button" :disabled="!communicationDraft.trim()" @click="submitCommunicationLog">保存沟通记录</button>
        </div>
      </div>
      <div class="as-log-list">
        <div v-for="item in activeTextRows" :key="item" class="as-log-row">{{ item }}</div>
        <div v-if="!activeTextRows.length" class="as-log-row muted">暂无记录</div>
      </div>
    </section>

    <aw-audit-action-modal
      :open="auditModalOpen"
      title="售后单审核"
      :document="auditDocument"
      :actions="auditActions"
      :default-action="pendingAuditAction"
      @cancel="auditModalOpen = false"
      @confirm="confirmAuditAction"
    />
    <aw-after-sales-opinion-modal
      :open="opinionModalOpen"
      title="处理意见"
      :document="auditDocument"
      :methods="afterSalesHandlingSettings"
      :document-map="afterSalesMethodDocumentMap"
      :existing-documents="documents"
      :default-method="service.handlingMethod"
      @cancel="opinionModalOpen = false"
      @confirm="confirmOpinionAction"
    />
  </aw-detail-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { AfterSalesLinkedDocument, AfterSalesService, HandlingMethod } from '@/app/api/after-sales/types';
import { addAfterSalesCommunicationLog, afterSalesMethodDocumentMap, advanceAfterSalesLinkedDocument, closeAfterSalesService, escalateAfterSalesQualityAction, getAfterSalesRequiredDocumentTypes, getAfterSalesService, listAfterSalesLinkedDocuments, reviewAfterSalesService } from '@/app/api/after-sales/resources';
import { afterSalesHandlingSettings } from '@/app/api/after-sales/dictionaries';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailMetricGrid from '@/components/detail-page/AwDetailMetricGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import AwAfterSalesOpinionModal from '@/components/detail-page/AwAfterSalesOpinionModal.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import type { AfterSalesOpinionPayload, AuditActionPayload, DetailAction } from '@/components/detail-page/types';

interface DetailDocRow {
  id: string;
  serviceId: string;
  type: string;
  code: string;
  status: string;
  ownerName: string;
  updatedAt: string;
  writebackLogs: string[];
  generated: boolean;
  writebackText: string;
}

const props = defineProps<{ serviceId: string; entrySource?: string }>();
const emit = defineEmits<{ back: []; changed: [] }>();
const router = useRouter();
const service = ref<AfterSalesService>();
const documents = ref<AfterSalesLinkedDocument[]>([]);
const activeTab = ref('basic');
const auditModalOpen = ref(false);
const opinionModalOpen = ref(false);
const pendingAuditAction = ref('approve');
const communicationDraft = ref('');
const actionMessage = ref('');
const requiredDocumentTypes = ['退货入库单', '换货出库单', '配件出库单', '付款单/退款单', '应收调整', '发票红冲', '服务派工单', '质量闭环单'];
const auditActions = [
  { key: 'approve', label: '审核通过', tone: 'primary' as const, placeholder: '填写审核通过意见，说明后续派生单据和任务池处理要求。' },
  { key: 'reject', label: '审核驳回', tone: 'danger' as const, requireOpinion: true, placeholder: '请填写驳回原因，说明需要补充或修正的内容。' },
  { key: 'return', label: '退回修改', tone: 'warning' as const, requireOpinion: true, placeholder: '请填写退回节点和修改要求。' },
  { key: 'transfer', label: '转交处理', requireOpinion: true, placeholder: '请填写转交原因和交接说明。' },
];
const entryFromMineTask = computed(() => props.entrySource === 'mineTask');
const backText = computed(() => entryFromMineTask.value ? '返回我的任务' : '返回售后列表');
const tabs = [
  { key: 'basic', label: '基本信息' },
  { key: 'lines', label: '售后产品明细' },
  { key: 'docs', label: '关联单据' },
  { key: 'sla', label: 'SLA/流程进度' },
  { key: 'communication', label: '沟通记录' },
  { key: 'attachments', label: '附件' },
  { key: 'logs', label: '操作记录' },
];
const detailActions = computed<DetailAction[]>(() => {
  if (entryFromMineTask.value) {
    return [{ key: 'opinion', label: '处理意见', primary: true }];
  }
  if (service.value?.status === 'pendingReview') {
    return [{ key: 'audit', label: '单据审核', primary: true }];
  }
  return afterSalesDetailActions(service.value?.status || '', service.value?.qualityStatus || '');
});
const headerMetas = computed(() => service.value ? [
  { label: '客户', value: service.value.customerName },
  { label: 'SLA', value: service.value.sla },
  { label: '负责人', value: service.value.ownerName },
  { label: '创建时间', value: service.value.submittedAt },
] : []);
const auditDocument = computed(() => ({
  title: service.value?.topic || '售后单',
  code: service.value?.code || '-',
  status: service.value?.statusName || '-',
  applicant: service.value?.ownerName || '-',
  flowName: '售后单审核流程',
  currentNode: '售后主管审核',
}));
const summaryMetrics = computed(() => service.value ? [
  { label: '可售后数量', value: service.value.availableQuantity },
  { label: '可退金额', value: money(service.value.refundableAmount) },
  { label: '结单确认', value: service.value.closeConfirmStatus },
  { label: '关联单据', value: `${documents.value.length} 张` },
] : []);

function afterSalesDetailActions(status: string, qualityStatus: string): DetailAction[] {
  const readActions: DetailAction[] = [{ key: 'print', label: '打印' }, { key: 'export', label: '导出' }];
  const qualityAction: DetailAction = { key: 'quality', label: qualityStatus === '无需闭环' ? '升级质量' : '查看质量' };
  const hasQuality = qualityStatus && qualityStatus !== '无需闭环';
  if (status === 'pendingCloseConfirm') return [{ key: 'close', label: '结单确认', primary: true }, qualityAction, ...readActions];
  if (status === 'closedConfirmed' || status === 'closed') return [...(hasQuality ? [qualityAction] : []), ...readActions];
  if (status === 'unassigned' || status === 'untreated') {
    return [
      { key: 'opinion', label: '处理意见', primary: true },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除', danger: true },
      qualityAction,
      ...readActions,
    ];
  }
  if (status === 'assigned' || status === 'processing') {
    return [
      { key: 'opinion', label: '处理意见', primary: true },
      { key: 'edit', label: '编辑' },
      qualityAction,
      ...readActions,
    ];
  }
  return readActions;
}
const basicItems = computed(() => service.value ? [
  { label: '售后类型', value: service.value.afterSalesType },
  { label: '处理方式', value: service.value.handlingMethod },
  { label: '客户联系人', value: service.value.contactName },
  { label: '收货地址', value: service.value.address },
  { label: '来源订单', value: service.value.sourceOrder },
  { label: '来源发货单', value: service.value.sourceDelivery },
  { label: '来源明细', value: service.value.sourceLine },
  { label: '问题原因', value: service.value.reason },
  { label: '投诉问题', value: service.value.complaint },
  { label: '优先级', value: service.value.priority },
  { label: '质量联动', value: service.value.qualityStatus },
  { label: '问题说明', value: service.value.description },
] : []);
const lineColumns = [
  { key: 'productCode', title: '产品编码', width: 130 },
  { key: 'productName', title: '产品名称', width: 180 },
  { key: 'spec', title: '规格', width: 120 },
  { key: 'sourceLine', title: '来源明细', width: 170 },
  { key: 'quantity', title: '本次售后数量', width: 130 },
  { key: 'availableQuantity', title: '可售后数量', width: 110 },
  { key: 'refundableAmount', title: '可退金额', width: 120 },
  { key: 'reason', title: '问题原因', width: 120 },
  { key: 'complaint', title: '投诉问题', width: 120 },
];
const docColumns = [
  { key: 'type', title: '单据类型', width: 130 },
  { key: 'code', title: '单据编号', width: 170 },
  { key: 'status', title: '状态', width: 120 },
  { key: 'ownerName', title: '负责人', width: 120 },
  { key: 'updatedAt', title: '更新时间', width: 160 },
  { key: 'writebackText', title: '回写记录', width: 280 },
];
const documentRows = computed<DetailDocRow[]>(() => requiredDocumentTypes.map((type) => {
  const matched = documents.value.find((item) => item.type === type || (type === '付款单/退款单' && item.type === '退款付款单'));
  if (matched) return { ...matched, generated: true, writebackText: matched.writebackLogs[0] || '等待回写' };
  return {
    id: `placeholder_${type}`,
    serviceId: service.value?.id || '',
    type,
    code: '未生成',
    status: '无需处理',
    ownerName: '-',
    updatedAt: '-',
    writebackLogs: [],
    generated: false,
    writebackText: '当前处理方式未生成该单据',
  };
}));
const activeTabLabel = computed(() => tabs.find((tab) => tab.key === activeTab.value)?.label || '');
const writebackSummary = computed(() => {
  if (!service.value) return '';
  if (service.value.status === 'pendingReview') return '售后单已提交，等待审核；审核通过后才会生成任务池单据。';
  if (service.value.status === 'unassigned') return '派生单据已生成，等待任务池指派。';
  if (service.value.status === 'assigned') return '任务池已指派，等待处理人开始执行。';
  if (service.value.status === 'untreated') return '任务已生成但尚未开始处理。';
  if (service.value.status === 'pendingCloseConfirm') return '派生单据已满足当前处理方式的回填规则，可进行内部结单确认。';
  if (service.value.status === 'closedConfirmed') return '售后已结单，等待最终关闭或归档。';
  if (service.value.status === 'closed') return '售后已关闭，所有业务处理完成。';
  return '派生单据仍在处理中，完成后将自动回填售后单状态。';
});
const flowSteps = computed(() => {
  const status = service.value?.status;
  const requiredDone = requiredDocsDone();
  return [
    { index: 1, label: '售后提交', desc: service.value?.submittedAt || '-', done: true },
    { index: 2, label: '售后审核', desc: service.value?.statusName || '-', done: !['pendingReview'].includes(String(status)) },
    { index: 3, label: '任务池指派', desc: `${documents.value.length} 张关联单据`, done: ['assigned', 'untreated', 'processing', 'pendingCloseConfirm', 'closedConfirmed', 'closed'].includes(String(status)) },
    { index: 4, label: '执行处理', desc: writebackSummary.value, done: requiredDone || ['pendingCloseConfirm', 'closedConfirmed', 'closed'].includes(String(status)) },
    { index: 5, label: '结单确认', desc: service.value?.closeConfirmStatus || '-', done: ['closedConfirmed', 'closed'].includes(String(status)) },
    { index: 6, label: '质量追踪', desc: service.value?.qualityStatus || '-', done: service.value?.qualityStatus === '无需闭环' || service.value?.qualityStatus === '已关闭' },
  ];
});
const activeTextRows = computed(() => {
  if (!service.value) return [];
  if (activeTab.value === 'communication') return service.value.communicationLogs;
  if (activeTab.value === 'attachments') return service.value.attachments;
  if (activeTab.value === 'logs') return service.value.operationLogs;
  return [];
});

async function loadData() {
  service.value = await getAfterSalesService(props.serviceId);
  documents.value = await listAfterSalesLinkedDocuments(props.serviceId);
}

async function advanceDoc(id: string) {
  if (id.startsWith('placeholder_')) return;
  const doc = documents.value.find((item) => item.id === id);
  if (!window.confirm(`确认推进${doc?.type || '关联单据'} ${doc?.code || ''} 的状态吗？该操作会回写售后单。`)) return;
  try {
    const updated = await advanceAfterSalesLinkedDocument(id);
    await loadData();
    actionMessage.value = `${updated.type}已推进到「${updated.status}」，售后状态已同步回写。`;
    emit('changed');
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '派生单据推进失败，请稍后重试。';
  }
}

async function handleAction(key: string) {
  if (!service.value) return;
  actionMessage.value = '';
  if (key === 'audit') {
    pendingAuditAction.value = 'approve';
    auditModalOpen.value = true;
    return;
  }
  if (key === 'opinion') {
    opinionModalOpen.value = true;
    return;
  }
  if (key === 'edit') {
    actionMessage.value = '修改入口已保留；当前售后单可通过处理意见、沟通记录和派生单据继续补充执行信息。';
    return;
  }
  if (key === 'delete') {
    if (!window.confirm(`确认删除售后单 ${service.value.code} 吗？删除前请确认没有未完成的仓储、财务或质量单据。`)) return;
    actionMessage.value = '已收到删除确认，但当前售后中心未接入删除接口，页面不会移除任何售后数据。';
    return;
  }
  if (key === 'print') {
    actionMessage.value = '打印入口已保留，后续接入统一打印模板后可输出售后单、附件和回写记录。';
    return;
  }
  if (key === 'export') {
    actionMessage.value = '导出入口已保留，后续接入公共导出任务后会包含基本信息、产品明细、关联单据和沟通记录。';
    return;
  }
  if (key === 'quality') {
    if (service.value.qualityStatus === '无需闭环' && !window.confirm(`确认将售后单 ${service.value.code} 升级为质量闭环吗？`)) return;
    try {
      const qualityAction = await escalateAfterSalesQualityAction(service.value.id);
      await loadData();
      emit('changed');
      router.push({ path: '/after-sales/quality', query: { id: qualityAction.id } });
    } catch (error) {
      actionMessage.value = error instanceof Error ? error.message : '质量闭环生成失败，请稍后重试。';
    }
    return;
  }
  if (key === 'close') {
    if (service.value.status !== 'pendingCloseConfirm') {
      actionMessage.value = '派生单据尚未全部完成或当前状态不允许结单，请先在关联单据中完成回写。';
      return;
    }
    if (!window.confirm(`确认对售后单 ${service.value.code} 执行结单确认吗？`)) return;
    try {
      await closeAfterSalesService(service.value.id);
      await loadData();
      actionMessage.value = '售后单已完成结单确认。';
      emit('changed');
    } catch (error) {
      actionMessage.value = error instanceof Error ? error.message : '售后结单失败，请检查关联单据状态。';
    }
  }
}

async function confirmAuditAction(payload: AuditActionPayload) {
  if (!service.value) return;
  try {
    await reviewAfterSalesService(service.value.id, payload.action);
    auditModalOpen.value = false;
    await loadData();
    const label = auditActions.find((item) => item.key === payload.action)?.label || '审核动作';
    actionMessage.value = `${label}已提交，售后单状态和派生单据已同步更新。`;
    emit('changed');
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '审核提交失败，请检查售后单状态后重试。';
  }
}

async function submitCommunicationLog() {
  if (!service.value || !communicationDraft.value.trim()) return;
  try {
    service.value = await addAfterSalesCommunicationLog(service.value.id, communicationDraft.value);
    communicationDraft.value = '';
    actionMessage.value = '沟通记录已保存并回填到售后详情。';
    emit('changed');
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : '沟通记录保存失败，请稍后重试。';
  }
}

function confirmOpinionAction(payload: AfterSalesOpinionPayload) {
  opinionModalOpen.value = false;
  actionMessage.value = `处理意见已记录为「${payload.method}」，后续单据预览共 ${payload.documents.length} 项。`;
  emit('changed');
}

function statusTone(status: string) {
  if (['closedConfirmed', 'closed'].includes(status)) return 'green';
  if (['pendingReview', 'pendingCloseConfirm'].includes(status)) return 'yellow';
  if (status === 'untreated') return 'red';
  return 'blue';
}

function docTone(status: string) {
  if (isTerminalDoc(status)) return 'green';
  if (status === '无需处理') return 'gray';
  if (status.startsWith('待')) return 'yellow';
  return 'blue';
}

function isTerminalDoc(status: unknown) {
  return ['已质检', '已签收', '已付款', '已完成', '已关闭', '已调整', '已红冲'].includes(String(status));
}

function requiredDocsDone() {
  if (!service.value) return false;
  const required = getAfterSalesRequiredDocumentTypes(service.value.handlingMethod as HandlingMethod);
  return required.length > 0 && required.every((type) => {
    const doc = documents.value.find((item) => item.type === type);
    return doc && isTerminalDoc(doc.status);
  });
}

function formatLineCell(value: unknown, key: string) {
  if (key === 'refundableAmount' && typeof value === 'number') return money(value);
  return value ?? '-';
}

function money(value: number) {
  return value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 });
}

watch(() => props.serviceId, loadData);
onMounted(loadData);
</script>

<style scoped>
.as-summary-line {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  color: var(--aw-muted);
}

.as-detail-message {
  margin: 0 12px 12px;
}

.as-writeback-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.as-flow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.as-flow-step {
  min-height: 116px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.as-flow-step i {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f2f4f7;
  color: var(--aw-muted);
  font-style: normal;
}

.as-flow-step.done i {
  background: #eaf8f1;
  color: #0f9f6e;
}

.as-flow-step strong,
.as-flow-step span {
  display: block;
  margin-top: 8px;
}

.as-flow-step span {
  color: var(--aw-muted);
  font-size: 12px;
}

.as-log-list {
  display: grid;
  gap: 8px;
}

.as-communication-editor {
  background: var(--aw-surface-2);
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
  padding: 12px;
}

.as-communication-editor textarea {
  min-height: 96px;
  resize: vertical;
}

.as-communication-actions {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.as-communication-actions span {
  color: var(--aw-muted);
  font-size: 12px;
}

.as-log-row {
  padding: 10px 12px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
}

.as-log-row.muted {
  color: var(--aw-muted);
}
</style>
