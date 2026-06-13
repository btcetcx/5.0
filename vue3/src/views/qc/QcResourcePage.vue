<template>
  <component :is="currentComponent" />

  <aw-source-picker-modal
    :open="showSourcePicker"
    title="选择质检来源"
    :categories="qcSourceCategories"
    :rows="qcSourceRows"
    :batches="qcSourceBatches"
    @cancel="showSourcePicker = false"
    @confirm="confirmSource"
  />
  <aw-option-picker-modal
    :open="showInspectionPicker"
    title="选择质检主题"
    category-title="质检类型"
    category-key="stage"
    search-placeholder="搜索质检主题、质检单号、来源单据或检验对象"
    :categories="inspectionPickerCategories"
    :columns="inspectionPickerColumns"
    :rows="inspectionPickerRows"
    @cancel="showInspectionPicker = false"
    @confirm="confirmInspectionSubject"
  />
  <aw-person-picker-modal
    :open="showPersonPicker"
    :title="personPickerTitle"
    :depts="qcPersonDepts"
    :picked="pickedPersons"
    @cancel="showPersonPicker = false"
    @confirm="confirmPersons"
  />
  <aw-option-picker-modal
    :open="showPlanPicker"
    title="选择质检方案"
    :columns="planColumns"
    :rows="planRows"
    @cancel="showPlanPicker = false"
    @confirm="confirmPlan"
  />
  <aw-option-picker-modal
    :open="showProductPicker"
    title="选择产品/物料"
    category-title="产品分类"
    category-key="category"
    search-placeholder="搜索产品编码、产品名称、分类或默认方案"
    :categories="productPickerCategories"
    :columns="productColumns"
    :rows="productRows"
    @cancel="showProductPicker = false"
    @confirm="confirmProduct"
  />
  <aw-option-picker-modal
    :open="showStandardPicker"
    title="选择质检标准"
    :columns="standardPickerColumns"
    :rows="standardPickerRows"
    @cancel="showStandardPicker = false"
    @confirm="confirmStandardDetail"
  />
  <aw-option-picker-modal
    :open="showGroupPicker"
    title="选择质检组"
    :columns="groupPickerColumns"
    :rows="groupPickerRows"
    @cancel="showGroupPicker = false"
    @confirm="confirmPlanGroup"
  />
  <aw-audit-action-modal
    :open="showExceptionActionModal"
    :title="exceptionActionModalTitle"
    :document="exceptionActionDocument"
    :actions="exceptionActionOptions"
    :approval-nodes="exceptionApprovalNodes"
    :person-depts="qcPersonDepts"
    :default-action="exceptionActionDefault"
    :opinion-label="exceptionActionOpinionLabel"
    cc-placeholder="选择需要同步的采购、生产、仓储、销售负责人"
    @cancel="showExceptionActionModal = false"
    @confirm="confirmExceptionAction"
  />
  <aw-audit-action-modal
    :open="showApprovalModal"
    :title="approvalModalTitle"
    :document="approvalDocument"
    :actions="approvalActions"
    :approval-nodes="approvalNodes"
    :person-depts="qcPersonDepts"
    default-action="approve"
    opinion-label="审核意见"
    @cancel="showApprovalModal = false"
    @confirm="confirmApprovalAction"
  />
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  createQcException,
  createQcInspection,
  createQcStandard,
  getQcException,
  getQcInspection,
  getQcReport,
  getQcStandard,
  listQcExceptions,
  listQcInspections,
  listQcReports,
  listQcStandards,
  qcDetailTabs,
  qcDisposalActions,
  qcExceptionStatuses,
  qcExceptionTabs,
  qcInspectionLines,
  qcInspectionStatuses,
  qcPersonDepts,
  qcPlanOptions,
  qcReportStatuses,
  qcReportTabs,
  qcResultActions,
  qcRowsForResource,
  qcSourceBatches,
  qcSourceCategories,
  qcSourceRows,
  qcStageLabels,
  qcStandardStatuses,
  qcStandardTabs,
  submitQcExceptionAction,
  submitQcResult,
  toneByStatus,
  updateQcInspection,
  updateQcStandard,
} from '@/app/api/qc/resources';
import type { QcException, QcInspection, QcReport, QcStandard } from '@/app/api/qc/types';
import type { SourcePickerConfirmPayload } from '@/components/form-page/types';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwLineDetailSection from '@/components/form-page/AwLineDetailSection.vue';
import AwOptionPickerModal from '@/components/form-page/AwOptionPickerModal.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import AwSourcePickerModal from '@/components/form-page/AwSourcePickerModal.vue';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode } from '@/components/list-page/types';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailMetricGrid from '@/components/detail-page/AwDetailMetricGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import type { AuditActionOption, AuditActionPayload, AuditApprovalNode, AuditDocumentSummary, DetailAction, DetailFieldItem, DetailTabItem } from '@/components/detail-page/types';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import type { PersonPickerPerson } from '@/components/setting-page/types';
import type { AttachmentRow, EditableColumn } from '@/components/form-page/types';
import QcSettingPage from './QcSettingPage.vue';

type ResourceMode = 'execution' | 'exceptions' | 'standards' | 'reports';
type QcRow = QcInspection | QcException | QcStandard | QcReport;
type FormLine = Record<string, unknown>;
type StandardCriteriaRow = {
  id: string | number;
  name: string;
  standardType: string;
  baseUnit: string;
  baseline: string;
  standardValue: string;
  upperDeviation: string;
  lowerDeviation: string;
  standardDescription: string;
};
type ExecuteJudgeResult = '待判定' | '合格' | '不合格';
type ExecuteProductStatus = '待检' | '进行中' | '已完成';
type ExecuteItem = {
  id: string;
  name: string;
  standardName: string;
  judgementType: '数值' | '文本';
  standardText: string;
  baseUnit?: string;
  baseline?: string;
  standardValue?: string;
  upperDeviation?: string;
  lowerDeviation?: string;
  measured: string;
  result: ExecuteJudgeResult;
};
type ExecuteGroup = {
  id: string;
  name: string;
  submitted: boolean;
  items: ExecuteItem[];
};
type ExecuteProduct = {
  id: string;
  name: string;
  planName: string;
  planCode: string;
  status: ExecuteProductStatus;
  sendQty: number;
  sampleQty: number;
  qualifiedQty: number;
  defectiveQty: number;
  productResult: ExecuteJudgeResult;
  disposal: string;
  exceptionCreated?: boolean;
  groups: ExecuteGroup[];
};
type DetailCell = string | number;
type DetailTable = {
  columns: string[];
  rows: DetailCell[][];
};
type OptionPickerColumn = {
  key: string;
  title: string;
  width?: number;
};
type OptionPickerRow = {
  id: string | number;
  [key: string]: unknown;
};
type OptionPickerCategory = {
  key: string;
  label: string;
  icon?: string;
  count?: number;
};
type ExceptionActionKey = 'isolate' | 'mrb' | 'recheck' | 'release' | 'close';
type QcApprovalContext = 'standard' | 'special';
type QcCreateTypeCard = {
  stage: Extract<QcInspection['stage'], 'IQC' | 'IPQC' | 'FQC' | 'OQC'>;
  title: string;
  code: string;
  desc: string;
};
type QcProductDetailLine = {
  id: string | number;
  productCode: string;
  productName: string;
  spec: string;
  unit: string;
  quantity: string;
  plan: string;
  remark: string;
};

const route = useRoute();
const router = useRouter();
const mode = computed<ResourceMode>(() => {
  if (route.path.includes('/exceptions')) return 'exceptions';
  if (route.path.includes('/standards')) return 'standards';
  if (route.path.includes('/reports')) return 'reports';
  return 'execution';
});
const action = computed(() => String(route.query.action || ''));
const actionSettingMap: Record<string, string> = {
  质检方案分组: 'groups',
  方案分组: 'groups',
  质检自定义字段: 'fields',
  质检自定义编号: 'numbers',
  质检审批设置: 'approvals',
  质检策略设置: 'strategies',
  设置质检打印模板: 'print',
};
const settingKey = computed(() => String(route.query.setting || actionSettingMap[String(route.query.action || '')] || ''));
const isCreateAction = computed(() => action.value === 'new' || action.value === '新增检验任务');
const isExecuteAction = computed(() => mode.value === 'execution' && action.value === 'execute');
const showListTree = computed(() => mode.value === 'exceptions' || mode.value === 'reports' || mode.value === 'execution');
const queryId = computed(() => String(route.query.id || ''));
const pickedGroup = ref('all');
const keyword = ref('');
const statusFilters = ref<Record<string, string>>({});
const listRows = ref<QcRow[]>([]);
const detailRow = ref<QcRow | null>(null);
const activeTab = ref('');
const submitMessage = ref('');
const showSourcePicker = ref(false);
const showInspectionPicker = ref(false);
const showPersonPicker = ref(false);
const showPlanPicker = ref(false);
const showProductPicker = ref(false);
const showStandardPicker = ref(false);
const showGroupPicker = ref(false);
const showExceptionActionModal = ref(false);
const exceptionActionKey = ref<ExceptionActionKey>('isolate');
const showApprovalModal = ref(false);
const approvalContext = ref<QcApprovalContext>('standard');
const pickedPersons = ref<PersonPickerPerson[]>([]);
const personPickerTitle = computed(() => (mode.value === 'execution' && isCreateAction.value ? '选择送检人' : '选择质检人员'));
const detailText = ref('');
const standardTypeOptions = ['来料检验 IQC', '过程检验 IPQC', '成品检验 FQC', '出货检验 OQC'];
const qcExecutionStageGroups = ['来料检验 IQC', '过程检验 IPQC', '成品检验 FQC', '出货检验 OQC'];
const standardJudgementTypeOptions = ['分数值', '文本'];
const standardCriteriaTypeOptions = ['国家标准', '企业标准', '行业标准', '客户标准'];
const standardBaseUnitOptions = ['克(g)', '毫克(mg)', '毫米(mm)', '伏(V)'];
const qcStandardDetailTabsForStandard = ['标准基础', '附件', '标准详情', '审批记录', '操作记录'];
const qcStandardDetailTabsForGroup = ['配置信息', '质检标准', '附件', '审批记录', '操作记录'];
const qcStandardDetailTabsForPlan = ['方案基础', '质检组', '质检标准', '附件', '审批记录', '操作记录'];
const standardNumericCriteriaColumns: EditableColumn[] = [
  { key: 'name', title: '名称', width: 152 },
  { key: 'standardType', title: '标准类型', width: 122 },
  { key: 'baseUnit', title: '基准单位', width: 130 },
  { key: 'baseline', title: '基准', width: 110 },
  { key: 'standardValue', title: '标准值', width: 120 },
  { key: 'upperDeviation', title: '上差值', width: 110 },
  { key: 'lowerDeviation', title: '下差值', width: 110 },
];
const standardTextCriteriaColumns: EditableColumn[] = [
  { key: 'name', title: '名称', width: 152 },
  { key: 'standardType', title: '标准类型', width: 122 },
  { key: 'standardDescription', title: '标准描述', width: 560 },
];
const standardAttachmentTypes = ['标准文件', '检验规范', '图纸附件', '审批材料'];
const currentOperatorName = '老夏';
function currentBusinessDate() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}
const standardCreateForm = ref({
  subject: '',
  code: '系统自动生成',
  source: '来料检验 IQC',
  judgementType: '分数值',
});
const standardCriteriaColumns = computed<EditableColumn[]>(() =>
  standardCreateForm.value.judgementType === '文本' ? standardTextCriteriaColumns : standardNumericCriteriaColumns,
);
const standardCriteriaRows = ref<StandardCriteriaRow[]>([
  {
    id: 1,
    name: '',
    standardType: '企业标准',
    baseUnit: '毫米(mm)',
    baseline: '',
    standardValue: '',
    upperDeviation: '',
    lowerDeviation: '',
    standardDescription: '',
  },
]);
const standardDetailText = ref('');
const standardAttachmentRows = ref<AttachmentRow[]>([
  { id: 1, name: '', type: '标准文件', date: currentBusinessDate(), remark: '' },
]);
const form = ref({
  subject: '',
  code: '系统自动生成',
  source: '',
  object: '',
  qty: '',
  inspector: '',
  date: '2026-05-30',
  status: '待报检',
  stage: 'IQC',
  lot: '',
  plan: '',
  sampling: '',
  critical: '',
  severity: 'MAJOR',
  actionType: '不合格记录',
});
const sampleRows = ref<FormLine[]>([
  { id: 1, sampleNo: 'S01-S32', qty: '32', rule: 'GB/T 2828.1 一般II AQL 1.0', owner: '老夏', result: '待判定' },
]);
const inspectRows = ref<FormLine[]>(qcInspectionLines.map((line) => ({ ...line })));
const planStandardRows = ref<FormLine[]>([]);
const attachRows = ref([{ id: 1, name: '', type: '质检报告', date: '2026-05-30', remark: '' }]);
const executionResultRows = ref<FormLine[]>([]);
const executionForm = ref({
  sampleQty: '32',
  qualifiedQty: '30',
  unqualifiedQty: '2',
  finalResult: '待判定',
  exceptionAction: '发起复检',
  exceptionReason: '',
  writeback: '',
});
const executionProducts = ref<ExecuteProduct[]>([]);
const activeExecutionProductId = ref('');
const activeExecutionGroupId = ref('');
const qcCreateStep = ref(0);
const pickedQcCreateStage = ref<QcCreateTypeCard['stage'] | ''>('');
const qcCreateTypeCards: QcCreateTypeCard[] = [
  { stage: 'IQC', title: '来料检验', code: 'IQC', desc: '采购到货、委外收货、供应商来料等入厂前检验' },
  { stage: 'IPQC', title: '过程检验', code: 'IPQC', desc: '生产工序、报工批次、巡检首检等制程检验' },
  { stage: 'FQC', title: '成品检验', code: 'FQC', desc: '完工入库、成品批次、包装前确认等最终检验' },
  { stage: 'OQC', title: '出货检验', code: 'OQ', desc: '销售出库、客户验货、装箱放行等出货前检验' },
];

const currentComponent = computed(() => {
  if (settingKey.value) return QcSettingPage;
  if (isExecuteAction.value) return renderInspectionExecuteView;
  if (isCreateAction.value) return renderFormView;
  if (queryId.value) return renderDetailView;
  return renderListView;
});

const title = computed(() => ({
  execution: '质检管理',
  exceptions: '异常处理',
  standards: '质检设置',
  reports: '质检分析',
}[mode.value]));
const standardLabelMap: Record<string, string> = {
  质检方案: '质检方案',
  质检组: '质检组',
  质检标准: '质检标准',
  检验方案: '质检方案',
  检验组: '质检组',
};
const currentStandardLabel = computed(() => {
  const key = String(route.query.type || action.value || pickedGroup.value || '');
  return standardLabelMap[key] || '质检方案';
});
const createLabel = computed(() => mode.value === 'exceptions' ? '新增异常处置' : mode.value === 'standards' ? `新增${currentStandardLabel.value}` : mode.value === 'reports' ? '生成分析报表' : '新增检验任务');
const listColumns = computed<AwTableColumn[]>(() => {
  if (mode.value === 'reports') {
    return [
      { key: 'subject', title: '分析主题', width: 180, link: true },
      { key: 'code', title: '报表编号', width: 150 },
      { key: 'source', title: '分析类型', width: 130, filterOptions: ['质量趋势', '不良分析', '供应商质量', '工序质量'] },
      { key: 'object', title: '统计范围', width: 180 },
      { key: 'passRate', title: '合格率', width: 100 },
      { key: 'defectRate', title: '不良率', width: 100 },
      { key: 'status', title: '报表状态', width: 120, filterOptions: qcReportStatuses },
      { key: 'action', title: '操作', width: 110, fixed: 'right' },
    ];
  }
  if (isQcPlanList()) {
    return [
      { key: 'subject', title: '方案名称', width: 220, link: true },
      { key: 'code', title: '方案编号', width: 150 },
      { key: 'planStage', title: '适用阶段', width: 150 },
      { key: 'object', title: '适用对象', width: 180 },
      { key: 'groupNames', title: '质检组', width: 220 },
      { key: 'standardCount', title: '质检标准', width: 110 },
      { key: 'sampling', title: '抽样规则', width: 220 },
      { key: 'version', title: '版本', width: 100 },
      { key: 'inspector', title: '维护人', width: 110 },
      { key: 'date', title: '更新时间', width: 130 },
      { key: 'status', title: '方案状态', width: 130, filterOptions: qcStandardStatuses },
      { key: 'action', title: '操作', width: 130, fixed: 'right' },
    ];
  }
  if (mode.value === 'standards' && currentStandardLabel.value === '质检标准') {
    return [
      { key: 'subject', title: '标准名称', width: 210, link: true },
      { key: 'code', title: '标准编号', width: 150 },
      { key: 'source', title: '适用类型', width: 180 },
      { key: 'judgementType', title: '判定类型', width: 120 },
      { key: 'standardType', title: '标准类型', width: 120 },
      { key: 'baseUnit', title: '基准单位', width: 120 },
      { key: 'baseline', title: '基准', width: 110 },
      { key: 'standardValue', title: '标准值', width: 120 },
      { key: 'upperDeviation', title: '上差值', width: 110 },
      { key: 'lowerDeviation', title: '下差值', width: 110 },
      { key: 'inspector', title: '维护人', width: 120 },
      { key: 'date', title: '更新时间', width: 130 },
      { key: 'status', title: '标准状态', width: 140, filterOptions: ['启用', '停用', '待审批'] },
      { key: 'action', title: '操作', width: 130, fixed: 'right' },
    ];
  }
  if (mode.value === 'exceptions') {
    return [
      { key: 'subject', title: '异常主题', width: 210, link: true },
      { key: 'code', title: '异常单号', width: 150 },
      { key: 'actionType', title: '异常类型', width: 130, filterOptions: ['不合格记录', '隔离/拒收', '返工复检', '让步放行', '整改跟踪'] },
      { key: 'source', title: '来源质检单', width: 150 },
      { key: 'object', title: '责任对象', width: 220 },
      { key: 'severity', title: '严重等级', width: 110, filterOptions: ['CRITICAL', 'MAJOR', 'MINOR'] },
      { key: 'status', title: '处置状态', width: 130, filterOptions: qcExceptionStatuses },
      { key: 'inspector', title: '处理人', width: 110 },
      { key: 'date', title: '登记日期', width: 120 },
      { key: 'action', title: '操作', width: 110, fixed: 'right' },
    ];
  }
  const subject = mode.value === 'standards' ? '配置名称' : '检验任务';
  const code = mode.value === 'standards' ? '配置编号' : '质检单号';
  const source = mode.value === 'standards' ? '配置类型' : '来源单据';
  const object = mode.value === 'standards' ? '适用范围' : '检验对象';
  const statusOptions = mode.value === 'standards' ? qcStandardStatuses : qcInspectionStatuses;
  return [
    { key: 'subject', title: subject, width: 190, link: true },
    { key: 'code', title: code, width: 150 },
    { key: 'source', title: source, width: 210 },
    { key: 'object', title: object, width: 220 },
    { key: 'qty', title: mode.value === 'standards' ? '版本/规则' : '批次/样本', width: 160 },
    { key: 'inspector', title: mode.value === 'standards' ? '维护人' : '检验员', width: 110 },
    { key: 'status', title: mode.value === 'standards' ? '配置状态' : '执行状态', width: 130, filterOptions: statusOptions },
    { key: 'action', title: '操作', width: 130, fixed: 'right' },
  ];
});
const bulkActions: AwBulkAction[] = [
  { key: 'assign', label: '批量派工' },
  { key: 'recheck', label: '批量复检' },
  { key: 'release', label: '让步放行' },
  { key: 'report', label: '生成报告' },
];
const tableRows = computed<Record<string, unknown>[]>(() => listRows.value.map((row) => {
  const criterion = standardListCriterion(row);
  const planGroups = isQcPlanRow(row) ? qcPlanGroups(row) : [];
  const planStandards = isQcPlanRow(row) ? qcPlanStandards(row) : [];
  return {
    ...row,
    planStage: isQcPlanRow(row) ? standardStageLabel(row) : undefined,
    groupNames: planGroups.length ? planGroups.map((group) => group.subject).join('、') : undefined,
    standardCount: planStandards.length ? `${planStandards.length} 条` : undefined,
    judgementType: 'judgementType' in row ? row.judgementType || '分数值' : undefined,
    standardType: criterion?.standardType || undefined,
    baseUnit: criterion?.baseUnit || undefined,
    baseline: criterion?.baseline || undefined,
    standardValue: criterion?.standardValue || undefined,
    upperDeviation: criterion?.upperDeviation || undefined,
    lowerDeviation: criterion?.lowerDeviation || undefined,
    action: '查看',
  };
}));
const treeNodes = computed<AwTreeNode[]>(() => {
  const groups = navigationGroups.value;
  if (mode.value === 'execution') {
    return groups.map((group) => ({ key: group, label: group, count: countByGroup(group), icon: 'line-doc', level: 2 as const }));
  }
  return [
    { key: 'all', label: `全部${title.value}`, count: listRows.value.length, icon: 'line-folder', level: 2, open: true },
    ...groups.map((group) => ({ key: group, label: group, count: countByGroup(group), icon: 'line-doc', level: 3 as const })),
  ];
});
const navigationGroups = computed(() => {
  if (mode.value === 'exceptions') return ['不合格记录', '隔离/拒收', '返工复检', '让步放行'];
  if (mode.value === 'reports') return ['质量趋势', '不良分析', '供应商质量', '工序质量'];
  if (mode.value === 'standards') return ['质检方案', '质检组', '质检标准', '质检自定义字段', '质检自定义编号', '质检审批设置', '质检策略设置', '设置质检打印模板'];
  return qcExecutionStageGroups;
});
const detailActions = computed<DetailAction[]>(() => {
  return qcDetailActions(mode.value, String(detailRow.value?.status || ''));
});

function qcDetailActions(currentMode: ResourceMode, status: string): DetailAction[] {
  const readActions: DetailAction[] = [{ key: 'print', label: '打印' }, { key: 'export', label: '导出' }];
  if (currentMode === 'reports') {
    if (status === '未生成') return [{ key: 'generate', label: '生成报表', primary: true }];
    if (status === '已生成') return [{ key: 'confirm', label: '确认报表', primary: true }, ...readActions];
    return readActions;
  }
  if (currentMode === 'standards') {
    if (status === '待审批') return [{ key: 'approve', label: '审核', primary: true }];
    if (status === '草稿' || status === '修订中') return [{ key: 'edit', label: '修改' }, { key: 'approve', label: '提交审批', primary: true }, { key: 'print', label: '打印' }];
    if (status === '停用') return [{ key: 'enable', label: '启用', primary: true }, { key: 'print', label: '打印' }];
    return [{ key: 'edit', label: '修改' }, { key: 'disable', label: '停用', danger: true }, { key: 'print', label: '打印' }];
  }
  if (currentMode === 'exceptions') {
    if (status === '让步审批') return [{ key: 'release', label: '审核', primary: true }];
    if (status === '待处置') return [{ key: 'isolate', label: '隔离/拒收', danger: true }, { key: 'mrb', label: 'MRB评审' }, { key: 'recheck', label: '发起复检' }, { key: 'release', label: '让步放行' }];
    if (status === '隔离中') return [{ key: 'mrb', label: 'MRB评审', primary: true }, { key: 'recheck', label: '发起复检' }, { key: 'close', label: '验证关闭' }];
    if (status === '复检中') return [{ key: 'recheck', label: '提交复检', primary: true }, { key: 'close', label: '验证关闭' }];
    if (status === '整改中' || status === '整改退回') return [{ key: 'close', label: '验证关闭', primary: true }];
    return readActions;
  }
  if (status === '特采评审') return [{ key: 'release', label: '审核', primary: true }];
  if (['待报检', '抽样中', '巡检中', '待判定', '待出货检验', '返工待复检'].includes(status)) return [{ key: 'execute', label: '执行质检', primary: true }];
  return readActions;
}
const exceptionActionModalTitle = computed(() => {
  const map: Record<ExceptionActionKey, string> = {
    isolate: '隔离/拒收处理',
    mrb: 'MRB异常评审',
    recheck: '发起返工复检',
    release: '让步放行评审',
    close: '验证关闭异常',
  };
  return map[exceptionActionKey.value];
});
const exceptionActionDefault = computed(() => {
  const map: Record<ExceptionActionKey, string> = {
    isolate: 'hold-stock',
    mrb: 'mrb-recheck',
    recheck: 'create-recheck',
    release: 'submit-release',
    close: 'verify-close',
  };
  return map[exceptionActionKey.value];
});
const exceptionActionOpinionLabel = computed(() => {
  const map: Record<ExceptionActionKey, string> = {
    isolate: '隔离/拒收意见',
    mrb: 'MRB评审意见',
    recheck: '复检要求',
    release: '让步评审意见',
    close: '验证关闭意见',
  };
  return map[exceptionActionKey.value];
});
const exceptionActionDocument = computed<AuditDocumentSummary>(() => {
  const row = isQcExceptionRow(detailRow.value) ? detailRow.value : null;
  return {
    title: row?.subject || '异常处理单',
    code: row?.code || '-',
    status: row?.status || '-',
    applicant: row?.inspector || currentOperatorName,
    flowName: exceptionActionModalTitle.value,
    currentNode: exceptionCurrentNode(exceptionActionKey.value, row),
  };
});
const exceptionActionOptions = computed<AuditActionOption[]>(() => {
  if (exceptionActionKey.value === 'isolate') {
    return [
      { key: 'hold-stock', label: '隔离冻结', tone: 'primary', requireOpinion: true, placeholder: '填写隔离库区、冻结数量、拦截范围和仓储执行要求。' },
      { key: 'reject-material', label: '拒收/退供', tone: 'danger', requireOpinion: true, placeholder: '填写拒收原因、退供数量、供应商通知和来源回写要求。' },
      { key: 'transfer', label: '转交仓储', tone: 'warning', requireOpinion: true, placeholder: '填写转交仓储执行的隔离或拒收要求。' },
    ];
  }
  if (exceptionActionKey.value === 'mrb') {
    return [
      { key: 'mrb-recheck', label: '返工复检', tone: 'primary', requireOpinion: true, placeholder: '填写MRB结论、返工复检范围、抽样规则和责任部门。' },
      { key: 'mrb-release', label: '让步放行', tone: 'normal', requireOpinion: true, placeholder: '填写让步理由、使用限制、风险追溯和审批要求。' },
      { key: 'mrb-reject', label: '拒收/隔离', tone: 'danger', requireOpinion: true, placeholder: '填写拒收/隔离结论、数量和回写单据。' },
    ];
  }
  if (exceptionActionKey.value === 'recheck') {
    return [
      { key: 'create-recheck', label: '生成复检任务', tone: 'primary', requireOpinion: true, placeholder: '填写复检项目、复检数量、抽样规则和回写要求。' },
      { key: 'countersign', label: '加签确认', tone: 'normal', requireOpinion: true, placeholder: '填写复检前需要确认的工序、仓储或供应商信息。' },
    ];
  }
  if (exceptionActionKey.value === 'release') {
    return [
      { key: 'submit-release', label: '提交让步审批', tone: 'primary', requireOpinion: true, placeholder: '填写让步原因、放行条件、追溯要求和风险说明。' },
      { key: 'reject-release', label: '不允许放行', tone: 'danger', requireOpinion: true, placeholder: '填写不允许让步放行的质量风险和后续处置。' },
      { key: 'countersign', label: '加签会审', tone: 'normal', requireOpinion: true, placeholder: '填写需要客户、销售或生产会签的事项。' },
    ];
  }
  return [
    { key: 'verify-close', label: '验证通过并关闭', tone: 'primary', requireOpinion: true, placeholder: '填写验证批次、验证方法、闭环依据和来源回写结果。' },
    { key: 'return', label: '退回整改', tone: 'warning', requireOpinion: true, placeholder: '填写验证未通过原因、需要补充的整改项和再次验证要求。' },
  ];
});
const exceptionApprovalNodes = computed<AuditApprovalNode[]>(() => buildExceptionApprovalNodes(exceptionActionKey.value, isQcExceptionRow(detailRow.value) ? detailRow.value : null));
const approvalModalTitle = computed(() => (approvalContext.value === 'special' ? '特采评审审核' : '质检配置审核'));
const approvalActions: AuditActionOption[] = [
  { key: 'approve', label: '审核通过', tone: 'primary', placeholder: '填写审核通过意见，说明确认依据、放行条件或后续要求。' },
  { key: 'reject', label: '审核驳回', tone: 'danger', requireOpinion: true, placeholder: '请填写驳回原因和后续处置要求。' },
  { key: 'return', label: '退回修改', tone: 'warning', requireOpinion: true, placeholder: '请填写需要补充或修正的内容。' },
  { key: 'transfer', label: '转交处理', requireOpinion: true, placeholder: '请填写转交原因和交接说明。' },
];
const approvalDocument = computed<AuditDocumentSummary>(() => {
  const row = detailRow.value;
  return {
    title: row?.subject || (approvalContext.value === 'special' ? '特采评审任务' : '质检配置'),
    code: row?.code || '-',
    status: row?.status || '-',
    applicant: isQcInspectionRow(row) || isQcStandardDetailLike(row) ? row.inspector || currentOperatorName : currentOperatorName,
    flowName: approvalModalTitle.value,
    currentNode: approvalContext.value === 'special' ? '质量经理特采评审' : '质检主管审批',
  };
});
const approvalNodes = computed<AuditApprovalNode[]>(() => [
  { name: '提交审批', approver: approvalDocument.value.applicant || currentOperatorName, method: '提交', state: 'done', result: '已提交', time: detailRow.value?.date || currentBusinessDate() },
  { name: approvalDocument.value.currentNode || '当前审核', approver: approvalContext.value === 'special' ? '质量经理' : '质检主管', method: approvalContext.value === 'special' ? '会签' : '审批', state: 'current', result: '待审核' },
  { name: approvalContext.value === 'special' ? '放行/处置回写' : '配置状态回写', approver: '系统', method: '自动', state: 'pending', result: '待回写' },
]);
const detailTabs = computed<DetailTabItem[]>(() => {
  const source = mode.value === 'exceptions'
    ? qcExceptionTabs
    : isQcPlanDetailRow(detailRow.value)
      ? qcStandardDetailTabsForPlan
      : isQcGroupDetailRow(detailRow.value)
      ? qcStandardDetailTabsForGroup
      : isQcStandardDetailRow(detailRow.value)
      ? qcStandardDetailTabsForStandard
      : mode.value === 'standards'
        ? qcStandardTabs
        : mode.value === 'reports'
          ? qcReportTabs
          : qcDetailTabs;
  return source.map((label) => ({ key: label, label }));
});
const detailFields = computed<DetailFieldItem[]>(() => {
  const row = detailRow.value;
  if (!row) return [];
  return [
    { label: listColumns.value[0]?.title || '主题', value: row.subject },
    { label: listColumns.value[1]?.title || '编号', value: row.code },
    { label: listColumns.value[2]?.title || '来源', value: row.source },
    { label: listColumns.value[3]?.title || '对象', value: row.object },
    { label: '批次/样本', value: row.qty },
    { label: '状态', value: row.status },
    { label: '方案/规则', value: 'plan' in row ? String(row.plan || row.source) : row.source },
    { label: '关键控制点', value: 'critical' in row ? String(row.critical || '-') : ('trend' in row ? row.trend : '-') },
  ];
});
const metricFields = computed(() => {
  const row = detailRow.value;
  if (!row) return [];
  if ('passRate' in row) return [{ label: '合格率', value: row.passRate }, { label: '不良率', value: row.defectRate }, { label: '趋势', value: row.trend }];
  return [{ label: '抽样数量', value: 32 }, { label: '合格数量', value: 30 }, { label: '不合格数量', value: 2 }, { label: '让步数量', value: 0 }];
});
const formActions = computed(() => [
  { key: 'draft', label: '保存草稿' },
  { key: 'reset', label: '重置' },
  { key: 'save', label: mode.value === 'exceptions' ? '提交异常' : mode.value === 'standards' ? '保存配置' : '提交检验任务', primary: true },
]);
const sampleColumns = [
  { key: 'sampleNo', title: '样本范围' },
  { key: 'qty', title: '样本量', width: 100 },
  { key: 'rule', title: '抽样规则' },
  { key: 'owner', title: '抽样人', width: 120 },
  { key: 'result', title: '状态', width: 120 },
];
const groupStandardColumns: EditableColumn[] = [
  { key: 'standardName', title: '标准名称', width: 220 },
  { key: 'standardCode', title: '标准编号', width: 150 },
  { key: 'stage', title: '适用类型', width: 150 },
  { key: 'judgementType', title: '判定类型', width: 110 },
  { key: 'standardType', title: '标准类型', width: 120 },
  { key: 'baseUnit', title: '基准单位', width: 120 },
  { key: 'baseline', title: '基准', width: 110 },
  { key: 'standardValue', title: '标准值', width: 120 },
  { key: 'upperDeviation', title: '上差值', width: 110 },
  { key: 'lowerDeviation', title: '下差值', width: 110 },
  { key: 'standardStatus', title: '标准状态', width: 110 },
];
const planGroupColumns: EditableColumn[] = [
  { key: 'groupName', title: '质检组名称', width: 220 },
  { key: 'groupCode', title: '质检组编号', width: 150 },
  { key: 'stage', title: '检验阶段', width: 150 },
  { key: 'leader', title: '组长', width: 110 },
  { key: 'auth', title: '授权范围', width: 220 },
  { key: 'shift', title: '班次', width: 130 },
  { key: 'status', title: '状态', width: 110 },
];
const inspectColumns = [
  { key: 'item', title: '检验项目' },
  { key: 'method', title: '方法', width: 120 },
  { key: 'valueType', title: '值类型', width: 100 },
  { key: 'standard', title: '标准值', width: 120 },
  { key: 'upper', title: '上限', width: 90 },
  { key: 'lower', title: '下限', width: 90 },
  { key: 'measured', title: '实测值', width: 120 },
  { key: 'defect', title: '缺陷等级', width: 110 },
  { key: 'result', title: '结论', width: 100 },
];
const qcProductDetailColumns: EditableColumn[] = [
  { key: 'productCode', title: '产品编码', width: 140 },
  { key: 'productName', title: '产品名称', width: 180 },
  { key: 'spec', title: '规格型号', width: 140 },
  { key: 'unit', title: '单位', width: 90 },
  { key: 'quantity', title: '数量', width: 100 },
  { key: 'plan', title: '质检方案', width: 220 },
  { key: 'remark', title: '备注', width: 180 },
];
const executionProjectColumns: EditableColumn[] = [
  { key: 'standardName', title: '质检标准', width: 220 },
  { key: 'item', title: '检测项', width: 160 },
  { key: 'baseline', title: '基准', width: 100 },
  { key: 'standardValue', title: '标准值', width: 100 },
  { key: 'upperDeviation', title: '上差值', width: 90 },
  { key: 'lowerDeviation', title: '下差值', width: 90 },
  { key: 'measured', title: '检验结果/实测值', width: 170 },
  { key: 'result', title: '判定结果', width: 110 },
];
const planColumns: OptionPickerColumn[] = [
  { key: 'code', title: '方案编号', width: 150 },
  { key: 'name', title: '方案名称' },
  { key: 'stage', title: '适用阶段', width: 150 },
  { key: 'sampling', title: '抽样规则', width: 220 },
  { key: 'status', title: '状态', width: 90 },
];
const planRows = computed<OptionPickerRow[]>(() => qcPlanOptions.map((item) => ({ ...item, id: item.id })));
const inspectionPickerCategories = qcCreateTypeCards.map((item) => ({
  key: item.stage,
  label: `${item.title} ${item.code}`,
  icon: 'line-doc',
}));
const inspectionPickerColumns: OptionPickerColumn[] = [
  { key: 'subject', title: '质检主题', width: 180 },
  { key: 'code', title: '质检单号', width: 140 },
  { key: 'source', title: '来源单据', width: 190 },
  { key: 'object', title: '检验对象', width: 180 },
  { key: 'status', title: '执行状态', width: 110 },
];
const inspectionPickerRows = computed<OptionPickerRow[]>(() =>
  (qcRowsForResource('qc-inspections') as QcInspection[]).map((row) => ({
    id: row.id,
    subject: row.subject,
    code: row.code,
    source: row.source,
    object: row.object,
    qty: row.qty,
    inspector: row.inspector,
    date: row.date,
    status: row.status,
    stage: row.stage,
    lot: row.lot,
    plan: row.plan,
    sampling: row.sampling,
    critical: row.critical,
  })),
);
const standardPickerColumns: OptionPickerColumn[] = [
  { key: 'name', title: '标准名称', width: 220 },
  { key: 'code', title: '标准编号', width: 150 },
  { key: 'stage', title: '适用类型', width: 150 },
  { key: 'judgementType', title: '判定类型', width: 110 },
  { key: 'standardType', title: '标准类型', width: 120 },
  { key: 'baseUnit', title: '基准单位', width: 120 },
  { key: 'baseline', title: '基准', width: 110 },
  { key: 'standardValue', title: '标准值', width: 120 },
  { key: 'upperDeviation', title: '上差值', width: 110 },
  { key: 'lowerDeviation', title: '下差值', width: 110 },
  { key: 'status', title: '标准状态', width: 110 },
];
const standardPickerRows = ref<OptionPickerRow[]>([]);
const groupPickerColumns: OptionPickerColumn[] = [
  { key: 'name', title: '质检组名称', width: 220 },
  { key: 'code', title: '质检组编号', width: 150 },
  { key: 'stage', title: '检验阶段', width: 150 },
  { key: 'leader', title: '组长', width: 110 },
  { key: 'auth', title: '授权范围', width: 220 },
  { key: 'shift', title: '班次', width: 130 },
  { key: 'status', title: '状态', width: 100 },
];
const groupPickerRows = ref<OptionPickerRow[]>([]);
const productColumns: OptionPickerColumn[] = [
  { key: 'code', title: '产品/物料编码', width: 150 },
  { key: 'name', title: '产品/物料名称' },
  { key: 'category', title: '分类', width: 120 },
  { key: 'spec', title: '规格型号', width: 130 },
  { key: 'unit', title: '单位', width: 90 },
  { key: 'plan', title: '默认方案', width: 190 },
];
const productRows: OptionPickerRow[] = [
  { id: 'prod_001', code: 'BPS2024', name: '轴承BPS2024', category: '原材料', spec: 'BPS-2024', unit: '箱', quantity: '10', plan: '轴承来料检验方案 V3.2' },
  { id: 'prod_002', code: 'IPHONE18', name: 'IPHONE18', category: '成品', spec: '18 Pro', unit: '台', quantity: '50', plan: '出货包装与外观检验 V2.0' },
  { id: 'prod_003', code: 'WT-2026', name: '智能温控终端', category: '成品', spec: 'WT-2026', unit: '台', quantity: '120', plan: '温控终端成品检验规范 V4.1' },
  { id: 'prod_004', code: 'AL-6061', name: '铝合金型材', category: '原材料', spec: 'AL-6061', unit: '件', quantity: '80', plan: '型材来料检验方案 V1.8' },
  { id: 'prod_005', code: 'HM-450', name: '高精度伺服电机', category: '半成品', spec: 'HM-450', unit: '件', quantity: '80', plan: '过程巡检方案 V2.4' },
];
const productPickerCategories: OptionPickerCategory[] = [
  { key: 'all', label: '全部产品', icon: 'line-folder' },
  ...Array.from(new Set(productRows.map((row) => String(row.category || '未分类')))).map((category) => ({
    key: category,
    label: category,
    icon: 'line-doc',
  })),
];
const qcSourceProductMap: Record<string, QcProductDetailLine[]> = {
  'GRN-202605-018': [
    { id: 'GRN-202605-018-01', productCode: 'BPS2024', productName: '轴承BPS2024', spec: 'BPS-2024', unit: '箱', quantity: '10', plan: '轴承来料检验方案 V3.2', remark: '采购收货待检' },
  ],
  'OUT-202605-009': [
    { id: 'OUT-202605-009-01', productCode: 'IPHONE18', productName: 'IPHONE18', spec: '18 Pro', unit: '台', quantity: '50', plan: '出货包装与外观检验 V2.0', remark: '销售出库待OQC' },
  ],
  'WO-202605-003': [
    { id: 'WO-202605-003-01', productCode: 'HM-450', productName: '高精度伺服电机', spec: 'HM-450', unit: '件', quantity: '80', plan: '过程巡检方案 V2.4', remark: '压装工序报工待检' },
  ],
  'FG-202605-006': [
    { id: 'FG-202605-006-01', productCode: 'WT-2026', productName: '智能温控终端', spec: 'WT-2026', unit: '台', quantity: '120', plan: '温控终端成品检验规范 V4.1', remark: '完工入库申请' },
  ],
  'SO-202605-001': [
    { id: 'SO-202605-001-01', productCode: 'IPHONE18', productName: 'IPHONE18', spec: '18 Pro', unit: '台', quantity: '50', plan: '出货包装与外观检验 V2.0', remark: '客户出货验货' },
  ],
};
const qcProductDetailRows = ref<FormLine[]>([
  { id: 1, productCode: '', productName: '', spec: '', unit: '', quantity: '', plan: '', remark: '' },
]);
watch([mode, action, settingKey, queryId], () => {
  loadPage();
}, { immediate: true });

async function loadPage() {
  keyword.value = '';
  statusFilters.value = {};
  pickedGroup.value = routeGroupFromAction();
  if (settingKey.value) {
    return;
  }
  if (isExecuteAction.value) {
    detailRow.value = queryId.value ? await loadDetail(queryId.value) : null;
    if (isQcInspectionRow(detailRow.value)) resetExecutionForm(detailRow.value);
    return;
  }
  if (isCreateAction.value) {
    if (mode.value === 'standards' && currentStandardLabel.value === '质检标准') {
      resetStandardCreateForm();
      return;
    }
    resetForm();
    if (mode.value === 'execution') {
      qcCreateStep.value = 0;
      pickedQcCreateStage.value = '';
    }
    return;
  }
  if (queryId.value) {
    detailRow.value = await loadDetail(queryId.value);
    activeTab.value = detailTabs.value[0]?.key || '';
    return;
  }
  await loadList();
}

async function loadList() {
  const query = baseListQuery();
  if (mode.value === 'exceptions') {
    const items = (await listQcExceptions(query)).items;
    listRows.value = items.filter((row) =>
      (!statusFilters.value.actionType || row.actionType === statusFilters.value.actionType)
      && (!statusFilters.value.severity || row.severity === statusFilters.value.severity),
    );
  }
  else if (mode.value === 'standards') listRows.value = (await listQcStandards(query)).items;
  else if (mode.value === 'reports') listRows.value = (await listQcReports(query)).items;
  else {
    const items = (await listQcInspections(executionListQuery())).items;
    listRows.value = isPendingExecutionScope() ? items.filter(isPendingInspectionRow) : items;
  }
}

async function loadDetail(id: string) {
  if (mode.value === 'exceptions') return await getQcException(id) || null;
  if (mode.value === 'standards') return await getQcStandard(id) || null;
  if (mode.value === 'reports') return await getQcReport(id) || null;
  return await getQcInspection(id) || null;
}

function baseListQuery() {
  return {
    keyword: keyword.value,
    category: pickedGroup.value === 'all' ? undefined : mappedCategory(pickedGroup.value),
    status: statusFilters.value.status || undefined,
  };
}

function executionListQuery() {
  const group = pickedGroup.value;
  return {
    keyword: keyword.value,
    status: statusFilters.value.status || undefined,
    stage: stageFromGroup(group),
  };
}

function isPendingExecutionScope() {
  return action.value === '待检任务';
}

function isPendingInspectionRow(row: QcInspection) {
  return /待|中/.test(row.status);
}

function renderListView() {
  const slots: Record<string, () => unknown> = {
    default: () => [
      h(AwListToolbar, {
        searchPlaceholder: `全局搜索：${listColumns.value[0]?.title || '主题'}、编号、来源、对象`,
        createLabel: createLabel.value,
        actions: ['refresh', 'filter', 'columns', 'import', 'export', 'create'],
        createHandler: openCreate,
        onCreate: openCreate,
        onSearch: (value: string) => {
          keyword.value = value;
          loadList();
        },
        onRefresh: loadList,
        onFilter: () => { submitMessage.value = '高级筛选已按阶段、状态、缺陷等级保留入口。'; },
        onColumns: () => { submitMessage.value = '字段配置入口保留，后续与公共字段抽屉对接。'; },
        onImport: () => { submitMessage.value = '导入模板将校验方案、项目和样本号。'; },
        onExport: () => { submitMessage.value = '已创建当前筛选条件下的导出任务。'; },
      }),
      submitMessage.value ? h('div', { class: 'aw-form-note', style: 'margin-bottom:12px' }, submitMessage.value) : null,
      h(AwDataTable, {
        columns: listColumns.value,
        rows: tableRows.value,
        rowKey: 'id',
        total: tableRows.value.length,
        bulkActions,
        filterValues: statusFilters.value,
        fitWidth: true,
        onColumnFilter: (key: string, value: string) => {
          statusFilters.value = { ...statusFilters.value, [key]: value };
          loadList();
        },
        onBatchAction: handleBatchAction,
      }, {
        cell: ({ column, record, value }: { column: AwTableColumn; record: Record<string, unknown>; value: unknown }) => {
          if (column.key === 'subject') return h('span', { class: 'aw-link', onClick: () => openDetail(String(record.id)) }, String(value));
          if (column.key === 'status') return h('span', { class: ['aw-status', record.tone || toneByStatus(String(value))] }, String(value));
          if (column.key === 'action') return h('span', { class: 'aw-link', onClick: () => openDetail(String(record.id)) }, '查看');
          return h('span', String(value ?? '-'));
        },
      }),
    ],
  };
  if (showListTree.value) {
    const handleTreeSelect = (value: string) => {
      if (!value || pickedGroup.value === value) return;
      pickedGroup.value = value;
      loadList();
    };
    const handleTreeClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLElement>('[data-key]');
      handleTreeSelect(button?.dataset.key || '');
    };
    slots.tree = () => h(AwResourceTree, {
      modelValue: pickedGroup.value,
      'onUpdate:modelValue': handleTreeSelect,
      onSelect: handleTreeSelect,
      onClick: handleTreeClick,
      onPointerup: handleTreeClick,
      title: mode.value === 'execution' ? '检验阶段' : title.value,
      total: listRows.value.length,
      nodes: treeNodes.value,
    });
  }
  return h(AwListPage, null, slots);
}

function renderFormView() {
  if (mode.value === 'standards' && currentStandardLabel.value === '质检标准') {
    return renderStandardCreateView();
  }
  if (mode.value === 'execution') {
    return renderQcInspectionCreateView();
  }
  return h(AwFormPage, {
    backText: createBackText(),
    actions: formActions.value,
    onBack: handleCreateBack,
    onAction: handleFormAction,
  }, {
    default: () => [
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, mode.value === 'exceptions' ? '异常基础' : mode.value === 'standards' ? '配置基础' : '来源信息'),
        h('div', { class: 'aw-form-grid' }, createBaseFormFields()),
        submitMessage.value ? h('div', { class: 'aw-form-note' }, submitMessage.value) : null,
      ]),
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, createSampleSectionTitle()),
        h(AwEditableSubTable, {
          columns: createSampleColumns(),
          rows: sampleRows.value,
          addText: createSampleAddText(),
          onAdd: handleSampleAdd,
        }, createSampleTableSlots()),
      ]),
      !isQcGroupCreate() && !isQcPlanCreate() ? h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, mode.value === 'standards' ? '检验项目/判定规则' : '检验明细'),
        h(AwEditableSubTable, {
          columns: inspectColumns,
          rows: inspectRows.value,
          addText: '新增检验项目',
          onAdd: () => inspectRows.value.push({ id: Date.now(), item: '新增检验项目', method: '手动录入', valueType: '判定', standard: '按方案定义', upper: '-', lower: '-', measured: '', defect: 'MINOR', result: '待判定' }),
        }, editableTableSlots(inspectRows)),
      ]) : null,
      !isQcGroupCreate() && !isQcPlanCreate() ? h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, '质检结果'),
        h('div', { class: 'aw-form-grid' }, [
          fieldInput('抽样数量', '32'),
          fieldInput('合格数量', ''),
          fieldInput('不合格数量', ''),
          fieldSelect('处置建议', qcResultActions, qcResultActions[0]),
        ]),
      ]) : null,
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, '附件'),
        h(AwAttachmentTable, {
          rows: attachRows.value,
          typeOptions: ['质检报告', '不良图片', '复检记录', '供应商整改'],
          addText: '新增附件',
          onAdd: () => attachRows.value.push({ id: Date.now(), name: '', type: '质检报告', date: '2026-05-30', remark: '' }),
          onRemove: (row: { id: number | string; name?: string }) => {
            if (!confirmRemove(row.name || '当前质检附件')) return;
            attachRows.value = attachRows.value.filter((item) => item.id !== row.id);
          },
          onUpload: () => { submitMessage.value = '附件上传入口已触发。'; },
        }),
      ]),
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, '详情'),
        h(AwRichTextEditor, {
          modelValue: detailText.value,
          'onUpdate:modelValue': (value: string) => { detailText.value = value; },
        }),
      ]),
    ],
  });
}

function renderQcInspectionCreateView() {
  return h(AwFormPage, {
    backText: '返回质检任务列表',
    actions: qcCreateStep.value === 2 ? formActions.value : [],
    onBack: handleCreateBack,
    onAction: handleFormAction,
  }, {
    default: () => h('div', { class: 'qc-create-flow-form' }, [
      renderQcCreateStepper(),
      qcCreateStep.value === 0
        ? renderQcTypePicker()
        : qcCreateStep.value === 1
          ? renderQcSourceInfoStep()
          : renderQcDetailStep(),
    ]),
  });
}

function renderQcCreateStepper() {
  const steps = ['选择质检类型', '填写来源信息', '质检明细'];
  return h('section', { class: 'aw-form-card' }, [
    h('div', { class: 'aw-detail-section-title' }, '新增质检任务'),
    h('div', { class: 'qc-create-stepper' }, steps.map((label, index) => h('button', {
      key: label,
      type: 'button',
      class: ['qc-create-step', { on: qcCreateStep.value === index, done: index < qcCreateStep.value }],
      onClick: () => {
        if (index === 0 || pickedQcCreateStage.value) qcCreateStep.value = index;
      },
    }, [
      h('span', String(index + 1)),
      label,
    ]))),
  ]);
}

function renderQcTypePicker() {
  return h('section', { class: 'aw-form-card' }, [
    h('div', { class: 'aw-detail-section-title' }, '选择质检类型'),
    h('div', { class: 'qc-create-type-grid' }, qcCreateTypeCards.map((item) => h('button', {
      key: item.stage,
      type: 'button',
      class: ['qc-create-type-card', { on: pickedQcCreateStage.value === item.stage }],
      onClick: () => pickQcCreateType(item),
    }, [
      h('strong', [
        item.title,
        h('span', item.code),
      ]),
      h('em', item.stage === 'OQC' ? '系统保存阶段：OQC' : `系统保存阶段：${item.stage}`),
      h('p', item.desc),
    ]))),
    submitMessage.value ? h('div', { class: 'aw-form-note' }, submitMessage.value) : null,
    h('div', { class: 'qc-create-step-actions right' }, [
      h('button', { class: 'aw-btn primary', type: 'button', onClick: confirmQcCreateType }, '确认类型'),
    ]),
  ]);
}

function renderQcSourceInfoStep() {
  return h('section', { class: 'aw-form-card' }, [
    h('div', { class: 'aw-detail-section-title' }, '质检来源信息'),
    h('div', { class: 'aw-form-grid' }, createBaseFormFields()),
    submitMessage.value ? h('div', { class: 'aw-form-note' }, submitMessage.value) : null,
    h('div', { class: 'qc-create-step-actions' }, [
      h('button', { class: 'aw-btn', type: 'button', onClick: () => { qcCreateStep.value = 0; } }, '上一步'),
      h('button', { class: 'aw-btn primary', type: 'button', onClick: () => { qcCreateStep.value = 2; } }, '下一步'),
    ]),
  ]);
}

function renderQcDetailStep() {
  return h('div', { class: 'qc-create-detail-step' }, [
    h(AwLineDetailSection, {
      title: '产品明细',
      addText: '+ 新增产品',
      onAdd: openQcProductPicker,
    }, {
      default: () => h(AwEditableSubTable, {
        columns: qcProductDetailColumns,
        rows: qcProductDetailRows.value,
        addText: '+ 新增产品',
        showAdd: false,
      }, editableTableSlots(qcProductDetailRows)),
    }),
    h('section', { class: 'aw-form-card' }, [
      h('div', { class: 'aw-detail-section-title' }, '质检详情'),
      h(AwRichTextEditor, {
        modelValue: detailText.value,
        placeholder: '请输入质检要求、检验说明、注意事项或补充描述...',
        'onUpdate:modelValue': (value: string) => { detailText.value = value; },
      }),
    ]),
    h('div', { class: 'qc-create-step-actions' }, [
      h('button', { class: 'aw-btn', type: 'button', onClick: () => { qcCreateStep.value = 1; } }, '上一步'),
    ]),
  ]);
}

function renderInspectionExecuteView() {
  const row = isQcInspectionRow(detailRow.value) ? detailRow.value : null;
  if (!row) return h('div', { class: 'aw-card' }, '正在加载质检任务...');
  const products = executionProducts.value;
  const activeProduct = activeExecutionProduct();
  const activeGroup = activeExecutionGroup(activeProduct);
  const completedCount = products.filter((product) => product.status === '已完成').length;
  const currentIndex = Math.max(products.findIndex((product) => product.id === activeProduct?.id), 0) + 1;
  const sourceContext = executionSourceContext(row);
  return h(AwFormPage, {
    backText: '返回质检任务',
    actions: [],
    onBack: () => router.push({ path: route.path, query: { id: row.id } }),
    onAction: handleExecuteAction,
  }, {
    default: () => h('div', { class: 'qc-execute-board' }, [
      h(AwDetailHeader, {
        title: `${row.subject} ${sourceContext.primarySourceNo}`,
        statusText: `检验中 ${Math.min(currentIndex, products.length)}/${products.length || 1}`,
        statusTone: 'yellow',
        code: row.code,
        metas: [
          { label: sourceContext.objectLabel, value: sourceContext.objectValue },
          { label: '待检产品', value: `${products.filter((product) => product.status !== '已完成').length} 个` },
          { label: '已完成', value: `${completedCount} 个` },
          { label: '检验员', value: row.inspector },
        ],
      }),
      activeProduct ? h('section', { class: 'qc-product-strip' }, [
        h('div', { class: 'qc-product-current' }, [
          h('span', { class: 'qc-product-box-icon' }, '◈'),
          h('strong', activeProduct.name),
          h('span', `${activeProduct.planName}`),
        ]),
        h('div', { class: 'qc-product-stats' }, [
          qtyStat('送检', activeProduct.sendQty),
          qtyStat('抽检', activeProduct.sampleQty),
          qtyStat('合格', activeProduct.qualifiedQty, 'ok'),
          qtyStat('不良', activeProduct.defectiveQty, activeProduct.defectiveQty > 0 ? 'bad' : ''),
        ]),
      ]) : null,
      activeProduct ? h('section', { class: 'qc-inspection-grid' }, [
        h('aside', { class: 'qc-execute-panel' }, [
          h('div', { class: 'qc-panel-title' }, '① 产品'),
          h('div', { class: 'qc-product-list' }, products.map((product) => renderExecuteProductCard(product))),
        ]),
        h('aside', { class: 'qc-execute-panel' }, [
          h('div', { class: 'qc-panel-title' }, '② 质检组'),
          h('div', { class: 'qc-group-list' }, activeProduct.groups.map((group) => renderExecuteGroupCard(group))),
        ]),
        h('main', { class: 'qc-execute-panel qc-item-panel' }, [
          h('div', { class: 'qc-panel-title' }, `③ 检验项 — ${activeGroup?.name || '请选择质检组'}`),
          activeGroup ? h('div', { class: 'qc-item-list' }, activeGroup.items.map((item) => renderExecuteItemCard(activeGroup, item))) : null,
          activeGroup ? h('div', { class: 'qc-group-submit-row' }, [
            h('button', {
              class: ['qc-btn', 'primary'],
              disabled: activeGroup.submitted,
              type: 'button',
              onClick: () => submitExecutionGroup(activeProduct, activeGroup),
            }, activeGroup.submitted ? '本组已提交' : '提交本组'),
          ]) : null,
        ]),
      ]) : null,
      activeProduct ? h('section', { class: 'qc-conclusion-panel' }, [
        h('div', { class: 'qc-conclusion-left' }, [
          h('span', { class: 'qc-conclusion-label' }, '产品判定'),
          h('button', {
            class: ['qc-judge-btn', 'ok', activeProduct.productResult === '合格' ? 'on' : ''],
            type: 'button',
            onClick: () => setExecutionProductResult(activeProduct, '合格'),
          }, '合格'),
          h('button', {
            class: ['qc-judge-btn', 'bad', activeProduct.productResult === '不合格' ? 'on' : ''],
            type: 'button',
            onClick: () => setExecutionProductResult(activeProduct, '不合格'),
          }, '不合格'),
          h('span', { class: 'qc-conclusion-label' }, '处理方式'),
          h('select', {
            class: 'aw-select qc-disposal-select',
            value: activeProduct.productResult === '合格' ? '入库放行' : activeProduct.disposal,
            disabled: activeProduct.productResult === '合格',
            onChange: (event: Event) => { activeProduct.disposal = (event.target as HTMLSelectElement).value; },
          }, productDisposalOptions(activeProduct).map((option) => h('option', { value: option }, option))),
          h('label', { class: 'qc-result-qty-field' }, [
            h('span', '数量'),
            h('input', {
              class: 'aw-input qc-result-qty-input',
              type: 'number',
              min: 0,
              max: activeProduct.sampleQty,
              value: executionProductQtyValue(activeProduct),
              placeholder: activeProduct.productResult === '不合格' ? '不合格品数量' : '合格品数量',
              onInput: (event: Event) => updateExecutionProductQty(activeProduct, (event.target as HTMLInputElement).value),
            }),
          ]),
        ]),
        h('div', { class: 'qc-conclusion-actions' }, [
          h('button', { class: 'qc-btn', type: 'button', onClick: saveExecutionDraft }, '暂存'),
          h('button', { class: ['qc-btn', 'primary'], type: 'button', onClick: () => finishExecutionProduct(activeProduct, row) }, '完成该产品'),
        ]),
        h('p', { class: 'qc-flow-note' }, '提示：判合格时默认入库放行；判不合格必须选择退货、让步放行、挑选返工、报废或隔离待定，并自动生成异常处理（不合格记录）流转。产品按组提交锁定，可逐个完成，合格产品无需等待整单完成即可放行。'),
        submitMessage.value ? h('div', { class: 'aw-form-note qc-execute-message' }, submitMessage.value) : null,
      ]) : null,
    ]),
  });
}

function activeExecutionProduct() {
  return executionProducts.value.find((product) => product.id === activeExecutionProductId.value) || executionProducts.value[0];
}

function executionSourceContext(row: QcInspection) {
  const primarySourceNo = row.source.split('/')[0]?.trim() || row.source || '-';
  const primaryObject = row.object.split('/')[0]?.trim() || row.object || '-';
  const secondaryObject = row.object.split('/')[1]?.trim() || '';
  if (row.stage === 'IPQC' || row.sourceType?.includes('生产工序')) {
    return { primarySourceNo, objectLabel: '工序', objectValue: primaryObject };
  }
  if (row.stage === 'FQC' || row.sourceType?.includes('生产报工')) {
    return { primarySourceNo, objectLabel: '产品', objectValue: primaryObject };
  }
  if (row.stage === 'OQC' || row.sourceType?.includes('销售')) {
    return { primarySourceNo, objectLabel: '客户', objectValue: primaryObject };
  }
  if (row.stage === 'IQC' || row.sourceType?.includes('采购') || row.sourceType?.includes('收货')) {
    return { primarySourceNo, objectLabel: '供应商', objectValue: primaryObject };
  }
  return { primarySourceNo, objectLabel: secondaryObject ? '对象' : '来源对象', objectValue: primaryObject };
}

function activeExecutionGroup(product?: ExecuteProduct) {
  if (!product) return undefined;
  return product.groups.find((group) => group.id === activeExecutionGroupId.value) || product.groups[0];
}

function qtyStat(label: string, value: number | string, tone = '') {
  return h('span', { class: ['qc-qty-stat', tone] }, [
    h('span', label),
    h('strong', String(value)),
  ]);
}

function executeProductStatus(product: ExecuteProduct): ExecuteProductStatus {
  if (product.status === '已完成') return '已完成';
  if (product.groups.some((group) => group.submitted || group.items.some((item) => item.result !== '待判定' || item.measured))) return '进行中';
  return '待检';
}

function renderExecuteProductCard(product: ExecuteProduct) {
  const active = activeExecutionProduct()?.id === product.id;
  const status = executeProductStatus(product);
  return h('button', {
    class: ['qc-product-card', active ? 'on' : '', status === '已完成' ? 'done' : ''],
    type: 'button',
    onClick: () => selectExecutionProduct(product),
  }, [
    h('strong', product.name),
    h('span', `${product.planName} · ${status}`),
  ]);
}

function executionGroupProgress(group: ExecuteGroup) {
  const total = group.items.length || 1;
  const done = group.items.filter((item) => item.result !== '待判定').length;
  if (group.submitted) return { label: `${total}/${total}`, tone: 'done' };
  if (done > 0) return { label: `录入中 ${done}/${total}`, tone: 'active' };
  return { label: `0/${total}`, tone: 'idle' };
}

function renderExecuteGroupCard(group: ExecuteGroup) {
  const active = activeExecutionGroup(activeExecutionProduct())?.id === group.id;
  const progress = executionGroupProgress(group);
  return h('button', {
    class: ['qc-group-card', active ? 'on' : '', progress.tone],
    type: 'button',
    onClick: () => { activeExecutionGroupId.value = group.id; },
  }, [
    h('div', [h('strong', group.name), progress.tone === 'done' ? h('span', { class: 'qc-group-check' }, '✓') : null]),
    h('span', progress.label),
  ]);
}

function renderExecuteItemCard(group: ExecuteGroup, item: ExecuteItem) {
  const locked = group.submitted;
  return h('div', { class: ['qc-item-card', locked ? 'locked' : ''] }, [
    h('div', { class: 'qc-item-info' }, [
      h('strong', item.name),
      h('span', item.standardText),
    ]),
    item.judgementType === '数值'
      ? h('div', { class: 'qc-item-input-row' }, [
        h('input', {
          class: 'aw-input qc-item-input',
          disabled: locked,
          value: item.measured,
          placeholder: '输入实测值',
          onInput: (event: Event) => updateExecutionNumericItem(item, (event.target as HTMLInputElement).value),
        }),
        renderExecuteResultBadge(item.result),
      ])
      : h('div', { class: 'qc-item-text-actions' }, [
        h('button', {
          class: ['qc-text-judge', 'ok', item.result === '合格' ? 'on' : ''],
          disabled: locked,
          type: 'button',
          onClick: () => updateExecutionTextItem(item, '合格'),
        }, '合格'),
        h('button', {
          class: ['qc-text-judge', 'bad', item.result === '不合格' ? 'on' : ''],
          disabled: locked,
          type: 'button',
          onClick: () => updateExecutionTextItem(item, '不合格'),
        }, '不合格'),
      ]),
  ]);
}

function renderExecuteResultBadge(result: ExecuteJudgeResult) {
  return h('span', {
    class: ['qc-auto-result', result === '合格' ? 'ok' : result === '不合格' ? 'bad' : 'pending'],
  }, result);
}

function renderStandardCreateView() {
  return h(AwFormPage, {
    backText: '返回质检标准',
    actions: [
      { key: 'draft', label: '保存草稿' },
      { key: 'reset', label: '重置' },
      { key: 'save', label: '保存质检标准', primary: true },
    ],
    onBack: () => router.push({ path: route.path, query: { action: '质检标准' } }),
    onAction: handleFormAction,
  }, {
    default: () => [
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, '标准基础'),
        h('div', { class: 'aw-form-grid' }, [
          fieldInput('标准名称', standardCreateForm.value.subject, (value) => { standardCreateForm.value.subject = value; }, true),
          fieldInput('标准编号', standardCreateForm.value.code, (value) => { standardCreateForm.value.code = value; }, false),
          fieldSelect('适用类型', standardTypeOptions, standardCreateForm.value.source, (value) => { standardCreateForm.value.source = value; }),
          fieldSelect('判定类型', standardJudgementTypeOptions, standardCreateForm.value.judgementType, (value) => { standardCreateForm.value.judgementType = value; }),
        ]),
        submitMessage.value ? h('div', { class: 'aw-form-note' }, submitMessage.value) : null,
      ]),
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, '检测标准'),
        h('div', { class: 'qc-standard-criteria-table' }, [
          h(AwEditableSubTable, {
            columns: standardCriteriaColumns.value,
            rows: standardCriteriaRows.value,
            addText: '新增检测标准',
            showAdd: false,
          }, standardCriteriaTableSlots()),
        ]),
      ]),
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, '附件'),
        h(AwAttachmentTable, {
          rows: standardAttachmentRows.value,
          typeOptions: standardAttachmentTypes,
          addText: '新增附件',
          namePlaceholder: '请输入附件名称',
          remarkPlaceholder: '请输入附件说明',
          onAdd: addStandardAttachment,
          onUpload: uploadStandardAttachment,
          onRemove: removeStandardAttachment,
        }),
      ]),
      h('section', { class: 'aw-form-card' }, [
        h('div', { class: 'aw-detail-section-title' }, '标准详情'),
        h(AwRichTextEditor, {
          modelValue: standardDetailText.value,
          placeholder: '请输入标准适用范围、检验依据、判定要求、版本说明等内容',
          'onUpdate:modelValue': (value: string) => { standardDetailText.value = value; },
        }),
      ]),
    ],
  });
}

function renderDetailView() {
  const row = detailRow.value;
  if (!row) return h('div', { class: 'aw-card' }, '正在加载详情...');
  return h(AwDetailPage, null, {
    toolbar: () => h(AwDetailToolbar, {
      backText: isQcPlanDetailRow(row) ? '返回质检方案列表' : isQcGroupDetailRow(row) ? '返回质检组列表' : isQcStandardDetailRow(row) ? '返回标准列表' : mode.value === 'exceptions' ? '返回异常列表' : '返回列表',
      actions: detailActions.value,
      onBack: () => handleDetailBack(row),
      onAction: handleDetailAction,
    }),
    header: () => h(AwDetailHeader, {
      title: row.subject,
      statusText: row.status,
      statusTone: row.tone || toneByStatus(row.status),
      code: row.code,
      metas: [
        { label: '来源', value: row.source },
        { label: '对象', value: row.object },
        { label: '负责人', value: 'inspector' in row ? row.inspector : '系统' },
        { label: '日期', value: row.date },
      ],
    }),
    default: () => h('section', { class: 'aw-card' }, [
      h(AwDetailTabs, {
        modelValue: activeTab.value,
        'onUpdate:modelValue': (value: string) => { activeTab.value = value; },
        tabs: detailTabs.value,
      }),
      submitMessage.value ? h('div', { class: 'aw-form-note', style: 'margin: 10px 0 12px' }, submitMessage.value) : null,
      renderActiveTab(row),
    ]),
  });
}

function handleDetailBack(row: QcRow) {
  if (isQcPlanDetailRow(row)) {
    router.push({ path: route.path, query: { action: '质检方案' } });
    return;
  }
  if (isQcGroupDetailRow(row)) {
    router.push({ path: route.path, query: { action: '质检组' } });
    return;
  }
  if (isQcStandardDetailRow(row)) {
    router.push({ path: route.path, query: { action: '质检标准' } });
    return;
  }
  router.push(route.path);
}

function baseFormFields() {
  const subjectField = mode.value === 'execution' && isCreateAction.value
    ? fieldInputPicker('质检主题', form.value.subject, (value) => { form.value.subject = value; }, () => { showInspectionPicker.value = true; }, true)
    : fieldInput(mode.value === 'exceptions' ? '异常主题' : mode.value === 'standards' ? '配置名称' : '检验任务', form.value.subject, (value) => { form.value.subject = value; }, true);
  if (mode.value === 'execution' && isCreateAction.value) {
    return [
      subjectField,
      fieldInput('质检单号', form.value.code, undefined, false, true),
      fieldInput('检验阶段', pickedQcCreateTypeLabel(), undefined, false, true),
      fieldPicker('送检人', form.value.inspector || currentOperatorName, openSenderPicker, true),
    ];
  }
  return [
    subjectField,
    fieldInput(mode.value === 'exceptions' ? '异常单号' : mode.value === 'standards' ? '配置编号' : '质检单号', form.value.code, undefined, false, true),
    mode.value === 'execution' && isCreateAction.value
      ? fieldInput('检验阶段', pickedQcCreateTypeLabel(), undefined, false, true)
      : fieldSelect(mode.value === 'exceptions' ? '关联检验阶段' : '检验阶段', ['IQC', 'IPQC', 'FQC', 'OQC'], form.value.stage, (value) => { form.value.stage = value; }),
    fieldSelect(mode.value === 'exceptions' ? '处置状态' : mode.value === 'standards' ? '配置状态' : '执行状态', statusOptions.value, form.value.status, (value) => { form.value.status = value; }),
    ...(mode.value === 'exceptions'
      ? [
        fieldSelect('异常类型', ['不合格记录', '隔离/拒收', '返工复检', '让步放行', '整改跟踪'], form.value.actionType, (value) => { form.value.actionType = value; }),
        fieldSelect('严重等级', ['CRITICAL', 'MAJOR', 'MINOR'], form.value.severity, (value) => { form.value.severity = value; }),
      ]
      : []),
    fieldPicker('来源单据', form.value.source || '请选择来源单据', () => { showSourcePicker.value = true; }, true),
    fieldPicker(mode.value === 'standards' ? '适用产品/物料' : '检验对象', form.value.object || '请选择产品/物料', () => { showProductPicker.value = true; }, true),
    fieldInput('批次/样本', form.value.qty, (value) => { form.value.qty = value; }),
    fieldPicker('检验员', form.value.inspector || '请选择质检人员', () => {
      pickedPersons.value = [];
      showPersonPicker.value = true;
    }),
    fieldInput('批次号', form.value.lot, (value) => { form.value.lot = value; }),
    fieldPicker('质检方案', form.value.plan || '请选择质检方案', () => { showPlanPicker.value = true; }, true),
    fieldInput('抽样规则', form.value.sampling, (value) => { form.value.sampling = value; }),
    fieldInput('关键控制点', form.value.critical, (value) => { form.value.critical = value; }),
  ];
}

function createBaseFormFields() {
  if (isQcPlanCreate()) {
    return [
      fieldInput('质检方案名称', form.value.subject, (value) => { form.value.subject = value; }, true),
      fieldInput('质检方案编号', form.value.code, undefined, false, true),
      fieldSelect('适用阶段', standardTypeOptions, qcGroupStageValue(), (value) => { form.value.stage = value; }),
      fieldPicker('适用对象', form.value.object || '请选择产品/物料', () => { showProductPicker.value = true; }, true),
      fieldInput('版本号', form.value.qty, (value) => { form.value.qty = value; }),
      fieldInput('抽样规则', form.value.sampling, (value) => { form.value.sampling = value; }),
    ];
  }
  if (isQcGroupCreate()) {
    return [
      fieldInput('质检组名称', form.value.subject, (value) => { form.value.subject = value; }, true),
      fieldInput('质检组编号', form.value.code, undefined, false, true),
      fieldSelect('检验阶段', standardTypeOptions, qcGroupStageValue(), (value) => { form.value.stage = value; }),
    ];
  }
  return baseFormFields();
}

function createSampleSectionTitle() {
  if (isQcPlanCreate()) return '质检组';
  if (isQcGroupCreate()) return '标准明细';
  return mode.value === 'standards' ? '配置明细' : '抽样记录';
}

function createSampleColumns() {
  if (isQcPlanCreate()) return planGroupColumns;
  return isQcGroupCreate() ? groupStandardColumns : sampleColumns;
}

function createSampleAddText() {
  if (isQcPlanCreate()) return '新增质检组';
  return isQcGroupCreate() ? '新增标准明细' : '新增抽样记录';
}

function createBackText() {
  if (isQcPlanCreate()) return '返回质检方案列表';
  return isQcGroupCreate() ? '返回质检组列表' : '返回列表';
}

function handleCreateBack() {
  if (hasQcDraftContent() && !confirmClear('当前质检草稿')) return;
  if (isQcPlanCreate()) {
    router.push({ path: route.path, query: { action: '质检方案' } });
    return;
  }
  if (isQcGroupCreate()) {
    router.push({ path: route.path, query: { action: '质检组' } });
    return;
  }
  router.push(route.path);
}

function pickQcCreateType(item: QcCreateTypeCard) {
  pickedQcCreateStage.value = item.stage;
  form.value.stage = item.stage;
  submitMessage.value = '';
}

function confirmQcCreateType() {
  if (!pickedQcCreateStage.value) {
    submitMessage.value = '请先选择质检类型。';
    return;
  }
  qcCreateStep.value = 1;
  submitMessage.value = '';
}

function pickedQcCreateTypeLabel() {
  const item = qcCreateTypeCards.find((card) => card.stage === pickedQcCreateStage.value || card.stage === form.value.stage);
  return item ? `${item.title} ${item.code}` : '请选择质检类型';
}

function handleSampleAdd() {
  if (isQcPlanCreate()) {
    void openGroupPicker();
    return;
  }
  if (isQcGroupCreate()) {
    void openStandardPicker();
    return;
  }
  sampleRows.value.push({ id: Date.now(), sampleNo: '', qty: '', rule: form.value.sampling, owner: form.value.inspector, result: '待判定' });
}

function currentOperatorPerson(): PersonPickerPerson | undefined {
  return qcPersonDepts.flatMap((dept) => dept.persons).find((person) => person.name === (form.value.inspector || currentOperatorName));
}

function openSenderPicker() {
  const currentPerson = currentOperatorPerson();
  pickedPersons.value = currentPerson ? [currentPerson] : [];
  showPersonPicker.value = true;
}

function openQcProductPicker() {
  showProductPicker.value = true;
}

function addQcProductDetailRow() {
  qcProductDetailRows.value.push(createEmptyQcProductDetailRow());
}

function createEmptyQcProductDetailRow(): QcProductDetailLine {
  return {
    id: Date.now(),
    productCode: '',
    productName: '',
    spec: '',
    unit: '',
    quantity: '',
    plan: '',
    remark: '',
  };
}

function qcProductDetailFromProduct(row: OptionPickerRow): QcProductDetailLine {
  return {
    id: row.id || Date.now(),
    productCode: String(row.code || ''),
    productName: String(row.name || ''),
    spec: String(row.spec || ''),
    unit: String(row.unit || ''),
    quantity: String(row.quantity || ''),
    plan: String(row.plan || ''),
    remark: String(row.category || ''),
  };
}

function qcSourceProductDetails(source: SourcePickerConfirmPayload): QcProductDetailLine[] {
  const sourceLines = qcSourceProductMap[source.code] || [];
  const selectedBatches = source.selectedBatches || [];
  const batches = selectedBatches.length ? selectedBatches : qcSourceBatches[source.code] || [];
  if (!sourceLines.length && !batches.length) return [];
  if (!batches.length) return sourceLines.map((line) => ({ ...line }));
  return batches.map((batch, index) => {
    const sourceLine = sourceLines[index] || sourceLines[0] || createEmptyQcProductDetailRow();
    return {
      ...sourceLine,
      id: `${source.code}-${batch.detailNo || index}`,
      quantity: String(batch.qty || sourceLine.quantity || ''),
      remark: source.subject || sourceLine.remark,
    };
  });
}

function isQcGroupCreate() {
  return mode.value === 'standards' && currentStandardLabel.value === '质检组';
}

function isQcPlanCreate() {
  return mode.value === 'standards' && currentStandardLabel.value === '质检方案';
}

function isQcPlanList() {
  return mode.value === 'standards' && currentStandardLabel.value === '质检方案';
}

function qcGroupStageValue() {
  return standardTypeOptions.find((option) => option === form.value.stage || option.endsWith(` ${form.value.stage}`)) || standardTypeOptions[0];
}

function stageCodeFromLabel(value: string) {
  if (value.includes('IPQC')) return 'IPQC';
  if (value.includes('FQC')) return 'FQC';
  if (value.includes('OQC')) return 'OQC';
  return 'IQC';
}

const statusOptions = computed(() => mode.value === 'exceptions' ? qcExceptionStatuses : mode.value === 'standards' ? qcStandardStatuses : qcInspectionStatuses);

function fieldInput(label: string, value: string, onInput?: (value: string) => void, required = false, disabled = false) {
  return h('div', { class: 'aw-field' }, [
    h('label', { class: required ? 'req' : '' }, label),
    h('input', { class: 'aw-input', value, disabled, placeholder: `请输入${label}`, onInput: (event: Event) => onInput?.((event.target as HTMLInputElement).value) }),
  ]);
}

function fieldSelect(label: string, options: string[], value: string, onChange?: (value: string) => void) {
  return h('div', { class: 'aw-field' }, [
    h('label', label),
    h('select', { class: 'aw-select', value, onChange: (event: Event) => onChange?.((event.target as HTMLSelectElement).value) }, options.map((option) => h('option', { value: option }, option))),
  ]);
}

function fieldPicker(label: string, value: string, onClick: () => void, required = false) {
  return h('div', { class: 'aw-field' }, [
    h('label', { class: required ? 'req' : '' }, label),
    h('div', { class: 'aw-field-row' }, [
      h('input', { class: 'aw-input', value, readonly: true, placeholder: `请选择${label}`, onClick }),
      h('button', { class: 'aw-tool-btn', type: 'button', onClick }, '选择'),
    ]),
  ]);
}

function fieldInputPicker(label: string, value: string, onInput: (value: string) => void, onClick: () => void, required = false) {
  return h('div', { class: 'aw-field' }, [
    h('label', { class: required ? 'req' : '' }, label),
    h('div', { class: 'aw-field-row' }, [
      h('input', { class: 'aw-input', value, placeholder: `请输入${label}`, onInput: (event: Event) => onInput((event.target as HTMLInputElement).value) }),
      h('button', { class: 'aw-tool-btn', type: 'button', onClick }, '选择'),
    ]),
  ]);
}

function editableTableSlots(rowsRef: typeof sampleRows) {
  return {
    cell: ({ column, row }: { column: { key: string }; row: FormLine }) => h('input', {
      class: 'aw-input',
      value: String(row[column.key] ?? ''),
      onInput: (event: Event) => { row[column.key] = (event.target as HTMLInputElement).value; },
    }),
    actions: ({ row }: { row: FormLine }) => h('span', {
      class: 'aw-link',
      style: 'color:var(--aw-danger)',
      onClick: () => {
        if (rowsRef.value.length > 1 && confirmRemove('当前明细行')) rowsRef.value = rowsRef.value.filter((item) => item.id !== row.id);
      },
    }, '删除'),
  };
}

function createSampleTableSlots() {
  if (isQcPlanCreate()) return planGroupTableSlots();
  if (isQcGroupCreate()) return groupStandardTableSlots(sampleRows);
  return editableTableSlots(sampleRows);
}

function groupStandardTableSlots(rowsRef: typeof sampleRows | typeof planStandardRows = sampleRows) {
  return {
    cell: ({ column, row }: { column: { key: string }; row: FormLine }) => {
      const value = String(row[column.key] ?? '-');
      if (column.key === 'standardName') return h('span', { class: 'aw-link' }, value);
      return h('span', value);
    },
    actions: ({ row }: { row: FormLine }) => h('span', {
      class: 'aw-link',
      style: 'color:var(--aw-danger)',
      onClick: () => {
        if (!confirmRemove('当前质检标准明细')) return;
        rowsRef.value = rowsRef.value.filter((item) => item.id !== row.id);
      },
    }, '删除'),
  };
}

function readonlyStandardTableSlots(rowsRef: typeof planStandardRows) {
  return {
    cell: groupStandardTableSlots(rowsRef).cell,
  };
}

function planGroupTableSlots() {
  return {
    cell: ({ column, row }: { column: { key: string }; row: FormLine }) => {
      const value = String(row[column.key] ?? '-');
      if (column.key === 'groupName') return h('span', { class: 'aw-link' }, value);
      return h('span', value);
    },
    actions: ({ row }: { row: FormLine }) => h('span', {
      class: 'aw-link',
      style: 'color:var(--aw-danger)',
      onClick: () => {
        if (!confirmRemove('当前质检组')) return;
        sampleRows.value = sampleRows.value.filter((item) => item.id !== row.id);
        refreshPlanStandardsFromGroups();
      },
    }, '删除'),
  };
}

function standardCriteriaTableSlots() {
  return {
    cell: ({ column, row }: { column: EditableColumn; row: StandardCriteriaRow }) => {
      if (column.key === 'standardType') {
        return h('select', {
          class: 'aw-select',
          value: row.standardType,
          onChange: (event: Event) => { row.standardType = (event.target as HTMLSelectElement).value; },
        }, standardCriteriaTypeOptions.map((option) => h('option', { value: option }, option)));
      }
      if (column.key === 'baseUnit') {
        return h('select', {
          class: 'aw-select',
          value: row.baseUnit,
          onChange: (event: Event) => { row.baseUnit = (event.target as HTMLSelectElement).value; },
        }, standardBaseUnitOptions.map((option) => h('option', { value: option }, option)));
      }
      return h('input', {
        class: 'aw-input',
        value: String(row[column.key as keyof StandardCriteriaRow] ?? ''),
        placeholder: `请输入${column.title}`,
        onInput: (event: Event) => { row[column.key as keyof StandardCriteriaRow] = (event.target as HTMLInputElement).value; },
      });
    },
  };
}

function renderActiveTab(row: QcRow) {
  const tab = activeTab.value || detailTabs.value[0]?.key;
  if (mode.value === 'exceptions' && 'severity' in row) return renderExceptionActiveTab(row, tab);
  if (isQcPlanDetailRow(row)) return renderQcPlanActiveTab(row, tab);
  if (isQcGroupDetailRow(row)) return renderQcGroupActiveTab(row, tab);
  if (isQcStandardDetailRow(row)) return renderStandardActiveTab(row, tab);
  if (tab?.includes('信息') || tab === '分析概览') {
    return renderInfoTab(tab);
  }
  const genericRow = row as { sampling?: string; source: string; qty: string; inspector?: string };
  if (tab?.includes('抽样')) return tableNode(['抽样规则', '批量', '样本量', '样本范围', 'AQL/频次', '抽样人', '时间'], [[String(genericRow.sampling || genericRow.source), genericRow.qty, '32', 'S01-S32', 'AQL 1.0', genericRow.inspector || '系统', '2026-05-17 11:10']]);
  if (tab?.includes('检验') || tab?.includes('不良') || tab?.includes('项目')) return tableNode(['检验项目', '方法', '标准值', '上限', '下限', '实测值', '缺陷等级', '结论', '图片'], qcInspectionLines.map((line) => [line.item, line.method, line.standard, line.upper, line.lower, line.measured, line.defect, line.result, line.image]));
  if (tab?.includes('报告')) return h('div', { class: 'qc-file-grid' }, ['质检报告.pdf', '不良图片.zip', '复检记录.xlsx'].map((name) => h('div', { class: 'qc-file' }, [h('strong', name), h('span', '上传日期：2026-05-17 14:52'), h('div', [h('span', { class: 'aw-link' }, '查看'), h('span', { class: 'aw-link', style: 'margin-left:14px' }, '下载')])])));
  const table = genericDetailTable(row, tab);
  return tableNode(table.columns, table.rows);
}

function isQcStandardDetailRow(row: QcRow | null): row is QcStandard {
  return mode.value === 'standards' && !!row && 'source' in row && String(row.source).includes('质检标准');
}

function isQcPlanRow(row: QcRow | null): row is QcStandard {
  return mode.value === 'standards' && !!row && 'source' in row && (String(row.source).includes('检验方案') || String(row.code).startsWith('PLAN-'));
}

function isQcPlanDetailRow(row: QcRow | null): row is QcStandard {
  return isQcPlanRow(row);
}

function isQcGroupDetailRow(row: QcRow | null): row is QcStandard {
  return mode.value === 'standards' && !!row && 'source' in row && (String(row.source).includes('检验组') || String(row.code).startsWith('GROUP-'));
}

function isQcInspectionRow(row: QcRow | null): row is QcInspection {
  return mode.value === 'execution' && !!row && 'sourceModule' in row;
}

function isQcStandardDetailLike(row: QcRow | null): row is QcStandard {
  return mode.value === 'standards' && !!row && row.stage === 'STANDARD';
}

function hasQcDraftContent() {
  return Boolean(
    form.value.subject
    || form.value.source
    || form.value.object
    || form.value.plan
    || detailText.value
    || sampleRows.value.length > 1
    || inspectRows.value.some((row) => String(row.measured || '').trim())
    || attachRows.value.some((row) => String(row.name || '').trim()),
  );
}

function confirmAction(label: string, suffix = '') {
  return window.confirm(`确认执行「${label}」吗？${suffix}`);
}

function confirmClear(label: string) {
  return window.confirm(`确认清空${label}吗？清空后当前未提交内容会被移除。`);
}

function confirmRemove(label: string) {
  return window.confirm(`确认删除${label}吗？删除后当前页面会立即移除。`);
}

function executionStageLabel(stage: string) {
  return qcStageLabels[stage as keyof typeof qcStageLabels] || stage;
}

function executionPlanFor(row: QcInspection) {
  const standards = qcRowsForResource('qc-standards') as QcStandard[];
  const planName = row.plan.replace(/\s+V[\d.]+.*$/, '');
  return standards.find((item) =>
    (String(item.source).includes('检验方案') || String(item.code).startsWith('PLAN-'))
    && (row.plan.includes(item.subject) || item.subject.includes(planName) || item.object.includes(row.object.split('/').pop()?.trim() || row.object)),
  ) || standards.find((item) => String(item.source).includes('检验方案') || String(item.code).startsWith('PLAN-'));
}

function executionStandardsByStage(row: QcInspection) {
  const stageLabel = executionStageLabel(row.stage);
  const standards = qcRowsForResource('qc-standards') as QcStandard[];
  const matched = standards.filter((item) => String(item.source).includes('质检标准') && (item.source.includes(row.stage) || stageLabel.includes(item.source.split('/').pop()?.trim() || '')));
  return matched.length ? matched : standards.filter((item) => String(item.source).includes('质检标准'));
}

function executionGroupsFor(row: QcInspection, groups: QcStandard[]) {
  if (groups.length) return groups;
  return [{
    id: `${row.id}-group`,
    subject: `${executionStageLabel(row.stage)}质检组`,
    code: '-',
    source: '检验组/执行',
    object: executionStageLabel(row.stage),
    qty: '-',
    inspector: row.inspector,
    date: row.date,
    status: '启用',
    stage: 'STANDARD',
    leader: row.inspector,
  } as QcStandard];
}

function buildExecutionProducts(row: QcInspection, plan: QcStandard | undefined, groups: QcStandard[], standards: QcStandard[]): ExecuteProduct[] {
  const firstGroups = buildExecutionGroupsFromStandards('prod_001', executionGroupsFor(row, groups), standards);
  return [
    createExecutionProduct({
      id: 'prod_001',
      name: row.object.split('/').pop()?.trim() || '轴承BPS2024',
      planName: plan?.subject || row.plan.replace(/\s*V[\d.]+$/, ''),
      planCode: plan?.code || row.code,
      sendQty: 1000,
      sampleQty: Number(row.qty.match(/抽样\s*(\d+)/)?.[1] || 32),
      status: '进行中',
      groups: firstGroups,
    }),
    createExecutionProduct({
      id: 'prod_002',
      name: '铝合金型材6061',
      planName: '型材来料检验方案',
      planCode: 'PLAN-202605-006',
      sendQty: 240,
      sampleQty: 20,
      status: '待检',
      groups: [
        createExecutionGroup('prod_002-g1', '外观尺寸组', [
          numericExecuteItem('prod_002-g1-i1', '长度尺寸', '型材尺寸质检标准', '毫米(mm)', '1200.00', '1200.00', '1.00', '1.00'),
          numericExecuteItem('prod_002-g1-i2', '壁厚尺寸', '型材尺寸质检标准', '毫米(mm)', '2.00', '2.00', '0.10', '0.10'),
        ]),
        createExecutionGroup('prod_002-g2', '材质证明组', [
          textExecuteItem('prod_002-g2-i1', '材质报告一致性', '型材材质证明质检标准', '材质报告、炉批号、供应商批次必须一致'),
          textExecuteItem('prod_002-g2-i2', '表面氧化层', '型材外观质检标准', '表面无露底、色差和明显划伤'),
        ]),
      ],
    }),
    createExecutionProduct({
      id: 'prod_003',
      name: '密封圈SR-220',
      planName: '橡胶件来料检验方案',
      planCode: 'PLAN-202605-009',
      sendQty: 500,
      sampleQty: 32,
      status: '待检',
      groups: [
        createExecutionGroup('prod_003-g1', '尺寸组', [
          numericExecuteItem('prod_003-g1-i1', '内径', '橡胶件尺寸质检标准', '毫米(mm)', '22.00', '22.00', '0.20', '0.20'),
          numericExecuteItem('prod_003-g1-i2', '截面直径', '橡胶件尺寸质检标准', '毫米(mm)', '3.50', '3.50', '0.10', '0.10'),
        ]),
        createExecutionGroup('prod_003-g2', '外观组', [
          textExecuteItem('prod_003-g2-i1', '飞边毛刺', '橡胶件外观质检标准', '无明显飞边、裂口、气泡和缺料'),
          textExecuteItem('prod_003-g2-i2', '批次标识', '包装标识质检标准', '内外包装标签、批次、数量必须一致'),
        ]),
      ],
    }),
  ];
}

function createExecutionProduct(payload: Omit<ExecuteProduct, 'qualifiedQty' | 'defectiveQty' | 'productResult' | 'disposal'>): ExecuteProduct {
  const product: ExecuteProduct = {
    ...payload,
    qualifiedQty: payload.sampleQty,
    defectiveQty: 0,
    productResult: '待判定',
    disposal: '入库放行',
  };
  syncExecutionProductStats(product);
  return product;
}

function buildExecutionGroupsFromStandards(productId: string, groups: QcStandard[], standards: QcStandard[]) {
  const targetGroups = groups.length ? groups : [];
  if (!targetGroups.length) {
    return [
      createExecutionGroup(`${productId}-g1`, '来料检验组', standards.flatMap((standard) => standardToExecuteItems(productId, `${productId}-g1`, standard))),
    ];
  }
  return targetGroups.map((group, index) => {
    const groupStandards = standards.filter((standard) => (group.standardIds || []).includes(standard.id));
    const scopedStandards = groupStandards.length ? groupStandards : standards.slice(index, index + 1);
    const items = ensureExecutionGroupItems(productId, String(group.id), group.subject, scopedStandards.flatMap((standard) => standardToExecuteItems(productId, String(group.id), standard)));
    return createExecutionGroup(String(group.id), group.subject, items);
  });
}

function ensureExecutionGroupItems(productId: string, groupId: string, groupName: string, items: ExecuteItem[]) {
  if (items.length >= 2) return items;
  if (groupName.includes('材质')) {
    return [
      ...items,
      textExecuteItem(`${productId}-${groupId}-trace`, '炉批号追溯', '材质证明一致性', '质保书、炉批号、供应商批次与采购到货批次一致'),
    ];
  }
  if (groupName.includes('包装')) {
    return [
      ...items,
      textExecuteItem(`${productId}-${groupId}-package`, '包装完整性', '包装标识质检标准', '外包装无破损受潮，标签和批次标识清晰完整'),
    ];
  }
  return [
    ...items,
    textExecuteItem(`${productId}-${groupId}-appearance`, '外观缺陷', '来料外观质检标准', '无明显划伤、锈蚀、磕碰、毛刺和混料'),
  ];
}

function standardToExecuteItems(productId: string, groupId: string, standard: QcStandard): ExecuteItem[] {
  return standardCriteriaForDetail(standard).map((criterion, index) => {
    if ((standard.judgementType || '分数值') === '文本') {
      return textExecuteItem(
        `${productId}-${groupId}-${standard.id}-${criterion.id || index}`,
        criterion.name || standard.subject,
        standard.subject,
        criterion.standardDescription || standard.defect || standard.sampling || '按文本标准判定',
      );
    }
    return numericExecuteItem(
      `${productId}-${groupId}-${standard.id}-${criterion.id || index}`,
      criterion.name || standard.subject,
      standard.subject,
      criterion.baseUnit || '毫米(mm)',
      criterion.baseline || criterion.standardValue || '0',
      criterion.standardValue || criterion.baseline || '0',
      criterion.upperDeviation || '0',
      criterion.lowerDeviation || '0',
    );
  });
}

function createExecutionGroup(id: string, name: string, items: ExecuteItem[]): ExecuteGroup {
  return { id, name, submitted: false, items };
}

function numericExecuteItem(id: string, name: string, standardName: string, baseUnit: string, baseline: string, standardValue: string, upperDeviation: string, lowerDeviation: string): ExecuteItem {
  const unit = baseUnit.match(/\(([^)]+)\)/)?.[1] || baseUnit;
  return {
    id,
    name,
    standardName,
    judgementType: '数值',
    standardText: `${standardValue || baseline}±${upperDeviation || lowerDeviation || '0'}${unit}`,
    baseUnit,
    baseline,
    standardValue,
    upperDeviation,
    lowerDeviation,
    measured: '',
    result: '待判定',
  };
}

function textExecuteItem(id: string, name: string, standardName: string, standardText: string): ExecuteItem {
  return {
    id,
    name,
    standardName,
    judgementType: '文本',
    standardText,
    measured: '',
    result: '待判定',
  };
}

function resetExecutionForm(row: QcInspection) {
  const sampleQty = row.qty.match(/抽样\s*(\d+)/)?.[1] || row.qty.match(/(\d+)\s*(件|台|箱)/)?.[1] || '32';
  const unqualified = row.status.includes('拒收') || row.status.includes('复检') ? '2' : '';
  const plan = executionPlanFor(row);
  const groups = plan ? qcPlanGroups(plan) : [];
  const standards = plan ? qcPlanStandards(plan) : executionStandardsByStage(row);
  executionProducts.value = buildExecutionProducts(row, plan, groups, standards);
  if (executionProducts.value[0]) executionProducts.value[0].status = '进行中';
  activeExecutionProductId.value = executionProducts.value[0]?.id || '';
  activeExecutionGroupId.value = executionProducts.value[0]?.groups[0]?.id || '';
  executionForm.value = {
    sampleQty,
    qualifiedQty: unqualified ? String(Math.max(Number(sampleQty) - Number(unqualified), 0)) : '',
    unqualifiedQty: unqualified,
    finalResult: row.status.includes('放行') || row.status.includes('合格') ? '合格' : row.status.includes('拒收') ? '不合格' : '待判定',
    exceptionAction: row.status.includes('让步') ? '让步放行' : row.status.includes('拒收') ? '拒收/隔离' : '发起复检',
    exceptionReason: row.status.includes('待') ? '' : `${row.subject}按${row.plan}执行，异常需按来源单据回写。`,
    writeback: row.writebackAction || '按质检结论回写来源模块',
  };
  syncExecutionRowsFromProducts();
  attachRows.value = [{ id: 1, name: '', type: '质检报告', date: currentBusinessDate(), remark: '' }];
  detailText.value = `执行任务：${row.subject}\n质检方案：${row.plan}\n来源回写：${row.writebackAction || '按质检结论回写来源模块'}`;
}

function buildExecutionResultRows(row: QcInspection, groups: QcStandard[], standards: QcStandard[]) {
  const fallbackGroup = groups[0] || {
    id: `${row.id}-group`,
    subject: `${executionStageLabel(row.stage)}质检组`,
    inspector: row.inspector,
  } as QcStandard;
  const targetStandards = standards.length ? standards : executionStandardsByStage(row);
  const rows = targetStandards.flatMap((standard, standardIndex) => {
    const group = groups.find((item) => (item.standardIds || []).includes(standard.id)) || fallbackGroup;
    const criteria = standardCriteriaForDetail(standard);
    return criteria.map((criterion, criterionIndex) => ({
      id: `${row.id}-${standard.id}-${criterion.id || criterionIndex}`,
      groupName: group.subject,
      standardName: standard.subject,
      item: criterion.name || standard.subject,
      requirement: standardRequirementText(standard, criterion),
      judgementType: standard.judgementType || '分数值',
      baseline: criterion.baseline || '-',
      standardValue: criterion.standardValue || '-',
      upperDeviation: criterion.upperDeviation || '-',
      lowerDeviation: criterion.lowerDeviation || '-',
      standardDescription: criterion.standardDescription || '',
      measured: '',
      result: '待判定',
      standardId: standard.id,
      groupId: group.id || standardIndex,
    }));
  });
  return rows.length ? rows : qcInspectionLines.map((line) => ({
    id: `${row.id}-${line.id}`,
    groupName: fallbackGroup.subject,
    standardName: row.plan,
    item: line.item,
    requirement: line.standard,
    judgementType: '文本',
    baseline: '-',
    standardValue: line.standard,
    upperDeviation: '-',
    lowerDeviation: '-',
    standardDescription: line.standard,
    measured: line.measured,
    result: line.result,
  }));
}

function standardRequirementText(standard: QcStandard, criterion: StandardCriteriaRow) {
  if ((standard.judgementType || '分数值') === '文本') return criterion.standardDescription || standard.defect || standard.sampling || '按文本标准判定';
  return `${criterion.baseUnit || '-'} / 基准 ${criterion.baseline || '-'} / 标准值 ${criterion.standardValue || '-'} / 上差 ${criterion.upperDeviation || '-'} / 下差 ${criterion.lowerDeviation || '-'}`;
}

function executionMethodDescription(method: string) {
  if (method === '让步放行') return '生成让步审批，限制条件放行并回写来源单据';
  if (method === '拒收/隔离') return '冻结或拒收影响批次，联动仓储/生产拦截';
  return '生成复检任务，按加严抽样或返工后复判';
}

function executionKv(label: string, value: unknown) {
  return h('div', { class: 'qc-execute-kv' }, [
    h('span', label),
    h('strong', String(value || '-')),
  ]);
}

function parseQcNumber(value: unknown) {
  const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function judgeExecutionResult(row: FormLine, measuredValue: string) {
  const value = measuredValue.trim();
  if (!value) return '待判定';
  if (String(row.judgementType || '') === '文本') {
    if (/不|无|缺|错|漏|破损|异常|过期|不一致/.test(value)) return '不合格';
    return '合格';
  }
  const measured = parseQcNumber(value);
  const standard = parseQcNumber(row.standardValue);
  const baseline = parseQcNumber(row.baseline);
  const center = Number.isFinite(standard) ? standard : baseline;
  if (!Number.isFinite(measured) || !Number.isFinite(center)) return '待判定';
  const upper = parseQcNumber(row.upperDeviation);
  const lower = parseQcNumber(row.lowerDeviation);
  const max = center + (Number.isFinite(upper) ? upper : 0);
  const min = center - (Number.isFinite(lower) ? lower : 0);
  return measured >= min && measured <= max ? '合格' : '不合格';
}

function syncExecutionFinalResult() {
  const results = executionResultRows.value.map((item) => String(item.result || '待判定'));
  if (results.some((item) => item === '不合格')) executionForm.value.finalResult = '不合格';
  else if (results.length && results.every((item) => item === '合格')) executionForm.value.finalResult = '合格';
  else executionForm.value.finalResult = '待判定';
}

function syncExecutionRowsFromProducts() {
  executionResultRows.value = executionProducts.value.flatMap((product) =>
    product.groups.flatMap((group) =>
      group.items.map((item) => ({
        id: item.id,
        productId: product.id,
        productName: product.name,
        groupId: group.id,
        groupName: group.name,
        standardName: item.standardName,
        item: item.name,
        requirement: item.standardText,
        judgementType: item.judgementType,
        baseline: item.baseline || '-',
        standardValue: item.standardValue || item.standardText,
        upperDeviation: item.upperDeviation || '-',
        lowerDeviation: item.lowerDeviation || '-',
        measured: item.measured,
        result: item.result,
      })),
    ),
  );
  syncExecutionFinalResult();
}

function syncExecutionProductStats(product: ExecuteProduct) {
  const items = product.groups.flatMap((group) => group.items);
  const bad = items.filter((item) => item.result === '不合格').length;
  product.defectiveQty = bad;
  product.qualifiedQty = Math.max(product.sampleQty - bad, 0);
  if (bad > 0) {
    product.productResult = '不合格';
    if (!product.disposal || product.disposal === '入库放行') product.disposal = '隔离待定';
  }
  else if (product.groups.length && product.groups.every((group) => group.submitted)) {
    product.productResult = '合格';
    product.disposal = '入库放行';
  }
  product.status = executeProductStatus(product);
}

function selectExecutionProduct(product: ExecuteProduct) {
  if (product.status === '待检') product.status = '进行中';
  activeExecutionProductId.value = product.id;
  activeExecutionGroupId.value = product.groups[0]?.id || '';
}

function updateExecutionNumericItem(item: ExecuteItem, value: string) {
  item.measured = value;
  item.result = judgeExecutionResult(item as unknown as FormLine, value) as ExecuteJudgeResult;
  const product = activeExecutionProduct();
  if (product) syncExecutionProductStats(product);
  syncExecutionRowsFromProducts();
}

function updateExecutionTextItem(item: ExecuteItem, result: ExecuteJudgeResult) {
  item.result = result;
  item.measured = result;
  const product = activeExecutionProduct();
  if (product) syncExecutionProductStats(product);
  syncExecutionRowsFromProducts();
}

function submitExecutionGroup(product: ExecuteProduct, group: ExecuteGroup) {
  const pending = group.items.filter((item) => item.result === '待判定').length;
  if (pending) {
    submitMessage.value = `${group.name} 还有 ${pending} 个检验项未判定，不能提交本组。`;
    return;
  }
  if (!window.confirm(`确认提交 ${product.name} - ${group.name} 吗？提交后本组检验项会锁定。`)) return;
  group.submitted = true;
  syncExecutionProductStats(product);
  syncExecutionRowsFromProducts();
  submitMessage.value = `${product.name} - ${group.name} 已提交并锁定。`;
}

function setExecutionProductResult(product: ExecuteProduct, result: ExecuteJudgeResult) {
  product.productResult = result;
  product.disposal = result === '合格' ? '入库放行' : product.disposal === '入库放行' ? '隔离待定' : product.disposal;
  syncExecutionProductStats(product);
  syncExecutionRowsFromProducts();
}

function productDisposalOptions(product: ExecuteProduct) {
  return product.productResult === '合格'
    ? ['入库放行']
    : ['退货', '让步放行', '挑选返工', '报废', '隔离待定'];
}

function executionProductQtyValue(product: ExecuteProduct) {
  return product.productResult === '不合格' ? product.defectiveQty : product.qualifiedQty;
}

function updateExecutionProductQty(product: ExecuteProduct, value: string) {
  const qty = Math.max(0, Number(value || 0));
  if (product.productResult === '不合格') product.defectiveQty = qty;
  else product.qualifiedQty = qty;
  syncExecutionRowsFromProducts();
}

function saveExecutionDraft() {
  syncExecutionRowsFromProducts();
  submitMessage.value = '质检草稿已暂存，当前产品、质检组进度和录入结果已保留在执行上下文。';
}

async function finishExecutionProduct(product: ExecuteProduct, row: QcInspection) {
  const pendingGroups = product.groups.filter((group) => !group.submitted).length;
  if (pendingGroups) {
    submitMessage.value = `${product.name} 还有 ${pendingGroups} 个质检组未提交，先按组提交后再完成该产品。`;
    return;
  }
  if (product.productResult === '不合格' && (!product.disposal || product.disposal === '入库放行')) {
    submitMessage.value = `${product.name} 判定不合格，必须选择处理方式。`;
    return;
  }
  if (!window.confirm(`确认完成 ${product.name} 的质检吗？${product.productResult === '不合格' ? `将按「${product.disposal}」生成异常处理并回写任务状态。` : '将按合格放行回写任务状态。'}`)) return;
  product.status = '已完成';
  syncExecutionRowsFromProducts();
  if (product.productResult === '不合格' && !product.exceptionCreated) {
    await createQcException({
      subject: `${product.name}不合格记录`,
      source: row.source,
      object: `${row.object.split('/')[0]?.trim() || row.object} / ${product.name}`,
      qty: `送检${product.sendQty} / 抽检${product.sampleQty} / 不良${product.defectiveQty}`,
      inspector: row.inspector,
      date: currentBusinessDate(),
      status: executeProductDisposalToExceptionStatus(product.disposal),
      lot: row.lot,
      plan: product.planName,
      sampling: row.sampling,
      critical: `${product.disposal}：${product.groups.flatMap((group) => group.items).filter((item) => item.result === '不合格').map((item) => item.name).join('、') || '不合格项'}`,
      severity: 'MAJOR',
      actionType: '不合格记录',
    });
    product.exceptionCreated = true;
  }
  const next = executionProducts.value.find((item) => item.status !== '已完成');
  if (next) selectExecutionProduct(next);
  submitMessage.value = product.productResult === '不合格'
    ? `${product.name} 已完成，已按「${product.disposal}」生成异常处理（不合格记录）。`
    : `${product.name} 已完成，已按入库放行回写。`;
}

function executeProductDisposalToExceptionStatus(disposal: string) {
  if (disposal === '让步放行') return '让步审批';
  if (disposal === '挑选返工') return '复检中';
  if (disposal === '退货') return '拒收退回';
  if (disposal === '报废') return '待处置';
  return '隔离中';
}

function executionResultTableSlots() {
  return {
    cell: ({ column, row }: { column: EditableColumn; row: FormLine }) => {
      if (column.key === 'measured') {
        return h('input', {
          class: 'aw-input',
          value: String(row[column.key] ?? ''),
          placeholder: '录入结果/实测值',
          onInput: (event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            row.measured = value;
            row.result = judgeExecutionResult(row, value);
            syncExecutionFinalResult();
          },
        });
      }
      if (column.key === 'result') {
        const result = String(row.result || '待判定');
        return h('span', {
          class: ['qc-auto-result', result === '合格' ? 'ok' : result === '不合格' ? 'bad' : 'pending'],
        }, result);
      }
      return h('span', String(row[column.key] ?? '-'));
    },
  };
}

function standardListCriterion(row: QcRow): StandardCriteriaRow | null {
  if (!('source' in row) || !String(row.source).includes('质检标准')) return null;
  const [criterion] = standardCriteriaForDetail(row as QcStandard);
  if (!criterion) return null;
  return {
    ...criterion,
    standardType: criterion.standardType || '-',
    baseUnit: criterion.baseUnit || '-',
    baseline: criterion.baseline || '-',
    standardValue: criterion.standardValue || '-',
    upperDeviation: criterion.upperDeviation || '-',
    lowerDeviation: criterion.lowerDeviation || '-',
  };
}

function renderQcPlanActiveTab(row: QcStandard, tab: string) {
  if (tab.includes('基础')) {
    return h('div', [
      h('div', { class: 'aw-detail-section-title' }, '方案基础'),
      h(AwDetailInfoGrid, {
        items: [
          { label: '质检方案名称', value: row.subject },
          { label: '质检方案编号', value: row.code },
          { label: '适用阶段', value: standardStageLabel(row) },
          { label: '适用对象', value: row.object },
          { label: '版本号', value: row.version || row.qty },
          { label: '抽样规则', value: row.sampling || row.qty },
          { label: '缺陷等级', value: row.defect || '-' },
          { label: '维护人', value: row.inspector },
          { label: '方案状态', value: row.status },
        ],
      }),
      h('div', { class: 'aw-detail-metrics qc-standard-criteria-cards' }, [
        h('div', { class: 'aw-detail-metric' }, [h('span', '质检组'), h('strong', `${qcPlanGroups(row).length} 个`)]),
        h('div', { class: 'aw-detail-metric' }, [h('span', '质检标准'), h('strong', `${qcPlanStandards(row).length} 条`)]),
        h('div', { class: 'aw-detail-metric' }, [h('span', '审批状态'), h('strong', row.approval || row.status)]),
      ]),
    ]);
  }
  if (tab.includes('质检组')) {
    return tableNode(
      ['质检组名称', '质检组编号', '检验阶段', '组长', '授权范围', '班次', '状态'],
      qcPlanGroups(row).map((group) => [
        group.subject,
        group.code,
        group.object,
        group.leader || group.inspector,
        group.auth || '-',
        group.shift || '-',
        group.status,
      ]),
    );
  }
  if (tab.includes('质检标准')) {
    return tableNode(
      ['标准名称', '标准编号', '适用类型', '判定类型', '标准类型', '基准单位', '基准', '标准值', '上差值', '下差值', '标准状态'],
      qcPlanStandards(row).map((standard) => {
        const criterion = standardListCriterion(standard);
        return [
          standard.subject,
          standard.code,
          standardStageLabel(standard),
          standard.judgementType || '分数值',
          criterion?.standardType || '-',
          criterion?.baseUnit || '-',
          criterion?.baseline || '-',
          criterion?.standardValue || '-',
          criterion?.upperDeviation || '-',
          criterion?.lowerDeviation || '-',
          standard.status,
        ];
      }),
    );
  }
  if (tab.includes('附件')) {
    return tableNode(['附件名称', '附件类型', '上传日期', '备注'], [
      [`${row.subject}方案说明.pdf`, '方案文件', row.date, row.sampling || '抽样规则与检验流程'],
      [`${row.code}-质检组与标准清单.xlsx`, '标准清单', row.date, `包含 ${qcPlanGroups(row).length} 个质检组、${qcPlanStandards(row).length} 条质检标准`],
    ]);
  }
  if (tab.includes('审批')) {
    return tableNode(['审批节点', '审批人', '审批方式', '审批时间', '状态'], [
      ['质检主管复核', row.inspector, '会签', `${row.date} 10:20`, '已完成'],
      ['质量经理批准', '质量经理', '或签', `${row.date} 15:40`, row.approval || row.status],
    ]);
  }
  return tableNode(['操作类型', '操作人', '操作时间', '操作内容', '结果'], [
    ['维护质检方案', row.inspector, `${row.date} 09:30`, `维护${row.subject}基础信息、质检组和质检标准`, row.status],
    ['同步标准明细', row.inspector, `${row.date} 09:45`, `关联 ${qcPlanGroups(row).length} 个质检组、${qcPlanStandards(row).length} 条质检标准`, '已同步'],
  ]);
}

function qcPlanGroups(row: QcStandard) {
  const standards = qcRowsForResource('qc-standards') as QcStandard[];
  const ids = row.groupIds || [];
  const linked = ids.length
    ? standards.filter((item) => ids.includes(item.id))
    : standards.filter((item) => String(item.source).includes('检验组') || String(item.code).startsWith('GROUP-'));
  return linked.length ? linked : standards.filter((item) => String(item.source).includes('检验组') || String(item.code).startsWith('GROUP-'));
}

function qcPlanStandards(row: QcStandard) {
  const standards = qcRowsForResource('qc-standards') as QcStandard[];
  const directIds = row.standardIds || [];
  const groupIds = qcPlanGroups(row).flatMap((group) => group.standardIds || []);
  const ids = Array.from(new Set([...directIds, ...groupIds]));
  const linked = ids.length
    ? standards.filter((item) => ids.includes(item.id))
    : standards.filter((item) => String(item.source).includes('质检标准'));
  return linked.length ? linked : standards.filter((item) => String(item.source).includes('质检标准'));
}

function renderQcGroupActiveTab(row: QcStandard, tab: string) {
  if (tab.includes('信息')) {
    return h('div', [
      h('div', { class: 'aw-detail-section-title' }, '质检组信息'),
      h(AwDetailInfoGrid, {
        items: [
          { label: '质检组名称', value: row.subject },
          { label: '质检组编号', value: row.code },
          { label: '检验阶段', value: row.object },
          { label: '组长', value: row.leader || row.inspector },
          { label: '授权范围', value: row.auth || '-' },
          { label: '班次', value: row.shift || '-' },
          { label: '标准数量', value: `${qcGroupStandards(row).length} 条` },
          { label: '状态', value: row.status },
        ],
      }),
    ]);
  }
  if (tab.includes('质检标准')) {
    return tableNode(
      ['标准名称', '标准编号', '适用类型', '判定类型', '标准类型', '基准单位', '基准', '标准值', '上差值', '下差值', '标准状态'],
      qcGroupStandards(row).map((standard) => {
        const criterion = standardListCriterion(standard);
        return [
          standard.subject,
          standard.code,
          standardStageLabel(standard),
          standard.judgementType || '分数值',
          criterion?.standardType || '-',
          criterion?.baseUnit || '-',
          criterion?.baseline || '-',
          criterion?.standardValue || '-',
          criterion?.upperDeviation || '-',
          criterion?.lowerDeviation || '-',
          standard.status,
        ];
      }),
    );
  }
  if (tab.includes('附件')) {
    return tableNode(['附件名称', '附件类型', '上传日期', '备注'], [
      [`${row.subject}授权清单.pdf`, '授权文件', row.date, row.auth || '质检组授权范围'],
      [`${row.code}-标准明细.xlsx`, '标准明细', row.date, `包含 ${qcGroupStandards(row).length} 条质检标准`],
    ]);
  }
  if (tab.includes('审批')) {
    return tableNode(['审批节点', '审批人', '审批方式', '审批时间', '状态'], [
      ['质检主管复核', row.leader || row.inspector, '会签', `${row.date} 10:20`, '已完成'],
      ['质量经理批准', '质量经理', '或签', `${row.date} 15:40`, row.status],
    ]);
  }
  return tableNode(['操作类型', '操作人', '操作时间', '操作内容', '结果'], [
    ['维护质检组', row.inspector, `${row.date} 09:30`, `维护${row.subject}基础信息和质检标准明细`, row.status],
    ['更新标准明细', row.inspector, `${row.date} 09:45`, `关联 ${qcGroupStandards(row).length} 条质检标准`, '已同步'],
  ]);
}

function qcGroupStandards(row: QcStandard) {
  const standards = qcRowsForResource('qc-standards') as QcStandard[];
  const ids = row.standardIds || [];
  const linked = ids.length
    ? standards.filter((item) => ids.includes(item.id))
    : standards.filter((item) => String(item.source).includes('质检标准'));
  return linked.length ? linked : standards.filter((item) => String(item.source).includes('质检标准'));
}

function renderStandardActiveTab(row: QcStandard, tab: string) {
  if (tab.includes('基础')) {
    return h('div', [
      h('div', { class: 'aw-detail-section-title' }, '标准基础'),
      h(AwDetailInfoGrid, {
        items: [
          { label: '标准名称', value: row.subject },
          { label: '标准编号', value: row.code },
          { label: '适用类型', value: standardStageLabel(row) },
          { label: '判定类型', value: row.judgementType || '分数值' },
          { label: '适用范围', value: row.object },
          { label: '维护人', value: row.inspector },
          { label: '更新时间', value: row.date },
          { label: '标准状态', value: row.status },
        ],
      }),
      renderStandardCriteriaCardGrid(row),
    ]);
  }
  if (tab.includes('附件')) {
    return tableNode(['附件名称', '附件类型', '上传日期', '备注'], standardAttachmentsForDetail(row).map((item) => [
      item.name || '-',
      item.type || '-',
      item.date || '-',
      item.remark || '-',
    ]));
  }
  if (tab.includes('详情')) {
    const detail = row.standardDetail || `${row.subject} 适用于${standardStageLabel(row)}，判定依据为${row.defect || row.sampling || '质检标准要求'}。`;
    return h('div', [
      h('div', { class: 'aw-detail-section-title' }, '标准详情'),
      h('div', { class: 'qc-standard-detail-preview' }, detail.split('\n').filter(Boolean).map((line) => h('p', line))),
    ]);
  }
  if (tab.includes('审批')) {
    return tableNode(['审批节点', '审批人', '审批方式', '审批时间', '状态'], [
      ['质检主管复核', row.inspector, '会签', `${row.date} 10:20`, row.status === '待审批' ? '待处理' : '已完成'],
      ['质量经理批准', '质量经理', '或签', `${row.date} 15:40`, row.approval || row.status],
    ]);
  }
  return tableNode(['操作类型', '操作人', '操作时间', '操作内容', '结果'], [
    ['维护标准', row.inspector, `${row.date} 09:30`, `维护${row.subject}基础信息、检测标准、附件和标准详情`, row.status],
    ['版本留痕', row.inspector, `${row.date} 09:45`, row.standardDetail ? '保存标准详情文本' : '同步标准配置', row.version || 'V1.0'],
  ]);
}

function renderStandardCriteriaCardGrid(row: QcStandard) {
  const [criterion] = standardCriteriaForDetail(row);
  const cards = (row.judgementType || '分数值') === '文本'
    ? [
        { label: '名称', value: criterion.name || '-', className: '' },
        { label: '标准类型', value: criterion.standardType || '-', className: '' },
        { label: '标准描述', value: criterion.standardDescription || '-', className: 'qc-standard-criteria-card-long' },
      ]
    : [
        { label: '名称', value: criterion.name || '-', className: '' },
        { label: '标准类型', value: criterion.standardType || '-', className: '' },
        { label: '基准单位', value: criterion.baseUnit || '-', className: '' },
        { label: '基准', value: criterion.baseline || '-', className: '' },
        { label: '标准值', value: criterion.standardValue || '-', className: '' },
        { label: '上差值', value: criterion.upperDeviation || '-', className: '' },
        { label: '下差值', value: criterion.lowerDeviation || '-', className: '' },
      ];

  return h('div', { class: 'aw-detail-metrics qc-standard-criteria-cards' }, cards.map((card) => h('div', {
    class: ['aw-detail-metric', card.className],
  }, [
    h('span', card.label),
    h('strong', card.value),
  ])));
}

function standardStageLabel(row: QcStandard) {
  const source = row.source || row.object || '';
  if (source.includes('IQC')) return '来料检验 IQC';
  if (source.includes('IPQC')) return '过程检验 IPQC';
  if (source.includes('FQC')) return '成品检验 FQC';
  if (source.includes('OQC')) return '出货检验 OQC';
  return row.source.replace('质检标准 / ', '') || '-';
}

function standardCriteriaForDetail(row: QcStandard): StandardCriteriaRow[] {
  if (row.criteria?.length) return row.criteria as StandardCriteriaRow[];
  const numeric = (row.judgementType || '分数值') !== '文本';
  return [{
    id: 1,
    name: row.subject,
    standardType: row.source.includes('客户') ? '客户标准' : '企业标准',
    baseUnit: numeric ? '毫米(mm)' : '',
    baseline: numeric ? row.lower || '按标准基准' : '',
    standardValue: numeric ? row.upper || row.version || '按标准值' : '',
    upperDeviation: numeric ? row.upper || '-' : '',
    lowerDeviation: numeric ? row.lower || '-' : '',
    standardDescription: numeric ? '' : row.defect || row.sampling || row.object,
  }];
}

function standardAttachmentsForDetail(row: QcStandard): NonNullable<QcStandard['standardAttachments']> {
  if (row.standardAttachments?.length) return row.standardAttachments;
  return [
    { id: 1, name: `${row.subject}.pdf`, type: '标准文件', date: row.date, remark: '标准主文件' },
    { id: 2, name: `${row.code}-审批记录.pdf`, type: '审批材料', date: row.date, remark: row.approval || '审批记录' },
  ];
}

function renderInfoTab(tab: string) {
  return h('div', [
    h('div', { class: 'aw-detail-section-title' }, tab),
    h(AwDetailInfoGrid, { items: detailFields.value }),
    h(AwDetailMetricGrid, { items: metricFields.value }),
  ]);
}

function isQcExceptionRow(row: QcRow | null): row is QcException {
  return Boolean(row && 'severity' in row);
}

function exceptionCurrentNode(key: ExceptionActionKey, row: QcException | null) {
  if (!row) return '待确认';
  if (key === 'isolate') return row.holdCode ? '隔离执行' : '围堵确认';
  if (key === 'mrb') return row.mrbCode ? 'MRB结论执行' : 'MRB会审';
  if (key === 'recheck') return row.recheckTaskCode ? '复检执行' : '复检申请';
  if (key === 'release') return row.releaseCode ? '让步审批' : '质量评审';
  if (row.status === '已关闭') return '已闭环';
  return row.closeCode ? '关闭归档' : '效果验证';
}

function buildExceptionApprovalNodes(key: ExceptionActionKey, row: QcException | null): AuditApprovalNode[] {
  const lastLog = row?.actionLogs?.length ? row.actionLogs[row.actionLogs.length - 1] : undefined;
  const doneTime = lastLog?.time || `${row?.date || currentBusinessDate()} 09:30`;
  if (key === 'isolate') {
    return [
      { name: '异常确认', approver: row?.inspector || '质检主管', method: '单人确认', state: 'done', result: '已确认', time: doneTime },
      { name: '围堵隔离', approver: '仓储主管', method: '执行反馈', state: row?.holdCode ? 'done' : 'current', result: row?.holdCode ? '已生成' : '待生成' },
      { name: '来源回写', approver: '系统', method: '自动回写', state: row?.holdCode ? 'current' : 'pending' },
      { name: 'MRB评审', approver: '质量经理', method: '会签评审', state: 'pending' },
    ];
  }
  if (key === 'mrb') {
    return [
      { name: '围堵确认', approver: '质检主管', method: '前置确认', state: row?.holdCode ? 'done' : 'current', result: row?.holdCode ? '已隔离' : '待确认' },
      { name: 'MRB会审', approver: '质量/生产/采购/仓储', method: '会签', state: row?.mrbCode ? 'done' : 'current', result: row?.mrbDecision || '待结论' },
      { name: '结论执行', approver: '责任部门', method: '任务执行', state: row?.mrbCode ? 'current' : 'pending' },
      { name: '结果验证', approver: '质量经理', method: '验证关闭', state: 'pending' },
    ];
  }
  if (key === 'recheck') {
    return [
      { name: '复检申请', approver: row?.inspector || '质检主管', method: '单人审批', state: row?.recheckTaskCode ? 'done' : 'current', result: row?.recheckTaskCode ? '已生成' : '待生成' },
      { name: '复检执行', approver: '复检员', method: '任务执行', state: row?.recheckTaskCode ? 'current' : 'pending' },
      { name: '结果判定', approver: '质量经理', method: '结果确认', state: 'pending' },
      { name: '来源回写', approver: '系统', method: '自动回写', state: 'pending' },
    ];
  }
  if (key === 'release') {
    return [
      { name: '质量评审', approver: '质量经理', method: '单人审批', state: row?.releaseCode ? 'done' : 'current', result: row?.releaseCode ? '已提交' : '待评审' },
      { name: '业务会签', approver: '生产/销售/采购', method: '会签', state: row?.releaseCode ? 'current' : 'pending' },
      { name: '客户确认', approver: '客户/业务', method: '条件确认', state: 'pending' },
      { name: '放行回写', approver: '系统', method: '自动回写', state: 'pending' },
    ];
  }
  return [
    { name: '整改完成', approver: '责任部门', method: '结果提交', state: 'done', result: row?.status === '已关闭' ? '已完成' : '待验证' },
    { name: '效果验证', approver: '质量经理', method: '验证关闭', state: row?.status === '已关闭' ? 'done' : 'current', result: row?.status === '已关闭' ? '验证通过' : '待验证' },
    { name: '来源回写', approver: '系统', method: '自动回写', state: row?.status === '已关闭' ? 'done' : 'pending' },
    { name: '关闭归档', approver: '质检中心', method: '归档', state: row?.status === '已关闭' ? 'done' : 'pending' },
  ];
}

function renderExceptionActiveTab(row: QcException, tab: string) {
  if (tab?.includes('信息')) return renderInfoTab(tab);
  const table = exceptionDetailTable(row, tab);
  return tableNode(table.columns, table.rows);
}

function tableNode(columns: string[], rows: DetailCell[][]) {
  return h('div', { class: 'aw-doc-tbl-wrap' }, h('div', { class: 'aw-doc-tbl-inner' }, h('table', { class: 'aw-doc-tbl' }, [
    h('thead', h('tr', [h('th', '序号'), ...columns.map((column) => h('th', column))])),
    h('tbody', rows.map((row, index) => h('tr', [h('td', index + 1), ...row.map((cell) => h('td', String(cell)))]))),
  ])));
}

function exceptionDetailTable(row: QcException, tab: string): DetailTable {
  const profile = exceptionProfile(row);
  if (tab.includes('操作')) {
    const logs = row.actionLogs?.length
      ? row.actionLogs
      : [
        {
          action: '异常登记',
          operator: row.inspector,
          time: `${row.date} 09:30`,
          opinion: `${row.subject} 已登记，等待处置流程推进。`,
          result: row.status,
          relatedDoc: row.code,
          transferTo: '',
          ccTo: '',
        },
      ];
    return {
      columns: ['动作', '操作人', '操作时间', '处理意见', '结果', '关联单据', '转交/抄送'],
      rows: logs.map((item) => [
        item.action,
        item.operator,
        item.time,
        item.opinion,
        item.result,
        item.relatedDoc || row.code,
        [item.transferTo, item.ccTo].filter(Boolean).join(' / ') || '-',
      ]),
    };
  }
  if (tab.includes('来源')) {
    return {
      columns: ['来源类型', '来源单号', '来源批次', '供应商/产线/客户', '带入数量', '同步状态'],
      rows: [
        [profile.sourceType, row.source, row.lot, row.object, row.qty, profile.syncStatus],
        [profile.linkType, profile.linkCode, profile.linkLot, profile.linkObject, profile.linkQty, profile.writeback],
      ],
    };
  }
  if (tab.includes('不良')) {
    return {
      columns: ['缺陷编号', '检验项目', '标准要求', '实测/现象', '缺陷等级', '影响数量', '判定结果', '附件'],
      rows: profile.defects.map((item, index) => [
        `${row.code}-D${String(index + 1).padStart(2, '0')}`,
        item.item,
        item.standard,
        item.measured,
        item.level,
        item.qty,
        item.result,
        item.attachment,
      ]),
    };
  }
  if (tab.includes('隔离')) {
    return {
      columns: ['处置单号', '库区/位置', '隔离/拒收数量', '处置动作', '责任人', '当前状态', '回写单据'],
      rows: [
        [row.holdCode || `HOLD-${row.code}`, profile.area, profile.blockQty, profile.blockAction, row.inspector, profile.blockStatus, row.writebackStatus || profile.writebackCode],
        [row.mrbCode || `MRB-${row.code}`, 'MRB评审区', profile.reviewQty, profile.reviewAction, '质量经理', profile.reviewStatus, row.source],
      ],
    };
  }
  if (tab.includes('MRB')) {
    return {
      columns: ['评审单号', '评审结论', '责任部门', '执行单据', '会签人', '来源回写', '当前状态'],
      rows: [
        [
          row.mrbCode || `MRB-${row.code}`,
          row.mrbDecision || profile.reviewAction,
          profile.businessOwner,
          row.recheckTaskCode || row.releaseCode || row.capaCode || row.holdCode || profile.writebackCode,
          '质量经理、生产主管、仓储主管、采购/销售负责人',
          row.writebackStatus || profile.writeback,
          row.status,
        ],
      ],
    };
  }
  if (tab.includes('复检')) {
    return {
      columns: ['复检单号', '复检来源', '复检项目', '复检数量', '复检人', '复检时间', '结论'],
      rows: [
        [row.recheckTaskCode || `RCK-${row.code}`, row.code, profile.recheckItem, profile.recheckQty, profile.recheckOwner, profile.recheckTime, row.status === '复检中' ? '复检执行中' : profile.recheckResult],
        [`${row.recheckTaskCode || `RCK-${row.code}`}-02`, profile.linkCode, profile.secondCheckItem, profile.secondCheckQty, '质量经理', profile.secondCheckTime, profile.secondCheckResult],
      ],
    };
  }
  if (tab.includes('放行')) {
    return {
      columns: ['评审单号', '让步原因', '审批节点', '审批人', '客户/内部确认', '放行条件', '结果'],
      rows: [
        [row.releaseCode || `DEV-${row.code}`, profile.releaseReason, '质量评审', '质量经理', profile.confirmation, profile.releaseCondition, row.status === '让步驳回' ? '已驳回' : profile.releaseResult],
        [`${row.releaseCode || `DEV-${row.code}`}-RISK`, '风险与追溯确认', '业务确认', profile.businessOwner, profile.businessConfirm, profile.traceCondition, profile.traceResult],
      ],
    };
  }
  if (tab.includes('整改')) {
    return {
      columns: ['整改单号', '节点', '问题描述', '责任人', '截止日期', '证据/输出', '状态'],
      rows: [
        [row.capaCode || `IMP-${row.code}`, '问题确认', `${row.object} ${profile.mainProblem}`, '质量经理', '2026-05-20', '团队名单', row.capaCode ? '已完成' : '待生成'],
        [row.capaCode || `IMP-${row.code}`, '临时围堵', profile.blockAction, row.inspector, '2026-05-21', profile.writebackCode, profile.blockStatus],
        [row.capaCode || `IMP-${row.code}`, '根因分析', `${profile.mainProblem}，需5Why/鱼骨图确认`, '供应商质量工程师', '2026-05-23', '根因分析报告', row.status === '整改中' ? '分析中' : '待分析'],
        [row.capaCode || `IMP-${row.code}`, '永久措施', profile.capaAction, profile.capaOwner, '2026-05-27', '纠正措施单', row.status === '整改中' ? '执行中' : profile.capaStatus],
        [row.capaCode || `IMP-${row.code}`, '措施验证', profile.verifyMethod, '质量经理', '2026-05-30', profile.verifyLot, row.status === '已关闭' ? '验证通过' : '待验证'],
      ],
    };
  }
  if (tab.includes('关闭')) {
    return {
      columns: ['关闭单号', '验证批次', '验证方法', '验证结果', '验证人', '关闭时间', '结论'],
      rows: [
        [row.closeCode || `CLS-${row.code}`, profile.verifyLot, profile.verifyMethod, row.status === '已关闭' ? '验证通过' : profile.verifyResult, '质量经理', row.status === '已关闭' ? currentBusinessDate() : profile.verifyTime, row.status === '已关闭' ? '已关闭' : profile.closeConclusion],
        [row.closeCode || `CLS-${row.code}`, profile.followLot, '连续批次跟踪', profile.followResult, row.inspector, profile.followTime, profile.followConclusion],
      ],
    };
  }
  return genericDetailTable(row, tab);
}

function exceptionProfile(row: QcException) {
  const codeTail = row.code.replace(/^[A-Z]+-/, '');
  if (row.actionType === '隔离/拒收') {
    return {
      sourceType: 'IQC来料检验',
      linkType: '采购收货单',
      linkCode: 'GRN-202605-026',
      linkLot: row.lot,
      linkObject: '供应商A / 铝合金型材',
      linkQty: '到货10箱',
      syncStatus: '已冻结质检暂存仓库存',
      writeback: '补证后允许复核，拒收后回写采购退货',
      defects: [
        { item: '材质证明', standard: '随货提供有效材质证明', measured: '未随货提供', level: 'CRITICAL', qty: '10箱', result: '不合格', attachment: '到货照片3张' },
        { item: '供应商批次追溯', standard: '批号与质保书一致', measured: '批号待核验', level: 'MAJOR', qty: '10箱', result: '待复核', attachment: '收货记录.pdf' },
      ],
      area: 'IQC隔离区-A03',
      blockQty: '10箱',
      blockAction: '隔离并暂停上架',
      blockStatus: row.status,
      reviewQty: '10箱',
      reviewAction: '供应商补证，超期拒收',
      reviewStatus: '等待供应商资料',
      writebackCode: 'WH-HOLD-202605-006',
      recheckItem: '材质证明复核',
      recheckQty: '10箱',
      recheckOwner: '王质检',
      recheckTime: '2026-05-18 10:00',
      recheckResult: '资料未到，保持隔离',
      secondCheckItem: '批号一致性',
      secondCheckQty: '10箱',
      secondCheckTime: '2026-05-18 16:30',
      secondCheckResult: '待供应商补充',
      releaseReason: '生产急需但资料未齐',
      confirmation: '采购负责人未确认',
      releaseCondition: '仅允许质量经理审批后特采',
      releaseResult: '未放行',
      businessOwner: '采购主管',
      businessConfirm: '待确认',
      traceCondition: '补证前不得投入生产',
      traceResult: '风险未关闭',
      mainProblem: '材质证明缺失',
      capaAction: '供应商发货前资料清单校验',
      capaOwner: '供应商质量工程师',
      capaStatus: '执行中',
      verifyLot: 'LOT-IQC-20260520-02',
      verifyMethod: '补证资料+批号一致性复核',
      verifyResult: '待验证',
      verifyTime: '2026-05-20 17:00',
      closeConclusion: '资料齐套后关闭',
      followLot: 'LOT-IQC-20260524-01',
      followResult: '未开始',
      followTime: '2026-05-24 18:00',
      followConclusion: '待跟踪',
    };
  }
  if (row.actionType === '返工复检') {
    return {
      sourceType: 'IPQC过程检验',
      linkType: '生产工单',
      linkCode: 'WO-202605-003',
      linkLot: row.lot,
      linkObject: '压装工序 / 产线A',
      linkQty: '返工20件',
      syncStatus: '已生成返工复检任务',
      writeback: '复检合格后回写工序放行',
      defects: [
        { item: '压装深度', standard: '12.00±0.20mm', measured: '12.35mm', level: 'MAJOR', qty: '6件', result: '不合格', attachment: '测量记录.xlsx' },
        { item: '扭矩复核', standard: '8.5±0.5N.m', measured: '8.1N.m', level: 'MINOR', qty: '3件', result: '返工后复检', attachment: '工序照片.zip' },
      ],
      area: '产线A返工暂存区',
      blockQty: '20件',
      blockAction: '工序隔离并返工',
      blockStatus: '返工处理中',
      reviewQty: '20件',
      reviewAction: '返工后加严抽样',
      reviewStatus: row.status,
      writebackCode: 'WIP-HOLD-202605-008',
      recheckItem: '压装深度/扭矩',
      recheckQty: '20件',
      recheckOwner: '陈复检',
      recheckTime: '2026-05-18 14:00',
      recheckResult: '复检中',
      secondCheckItem: '首件确认',
      secondCheckQty: '5件',
      secondCheckTime: '2026-05-18 15:30',
      secondCheckResult: '首件合格',
      releaseReason: '返工后符合放行条件',
      confirmation: '生产主管确认',
      releaseCondition: '连续20件复检合格',
      releaseResult: '待复检结论',
      businessOwner: '生产主管',
      businessConfirm: '已确认返工完成',
      traceCondition: '保留返工批次追溯',
      traceResult: '追溯已绑定',
      mainProblem: '压装参数漂移',
      capaAction: '压装设备点检频次调整为每班两次',
      capaOwner: '设备工程师',
      capaStatus: '待验证',
      verifyLot: 'RW-A-0318',
      verifyMethod: '加严抽样20件',
      verifyResult: '复检中',
      verifyTime: '2026-05-18 17:30',
      closeConclusion: '全部合格后关闭',
      followLot: 'WIP-A-0319',
      followResult: '待跟踪',
      followTime: '2026-05-19 16:00',
      followConclusion: '待连续批次验证',
    };
  }
  if (row.actionType === '让步放行') {
    return {
      sourceType: 'OQC出货检验',
      linkType: '销售出库单',
      linkCode: 'OUT-202605-009',
      linkLot: row.lot,
      linkObject: row.object,
      linkQty: '出货50台',
      syncStatus: '已拦截出库过账',
      writeback: '审批通过后回写允许出库',
      defects: [
        { item: '外箱轻微压痕', standard: '外箱无明显变形', measured: '3箱轻微压痕', level: 'MINOR', qty: '3箱', result: '可让步评审', attachment: '外箱照片.zip' },
        { item: '唛头位置', standard: '唛头居中偏差≤5mm', measured: '偏差6mm', level: 'MINOR', qty: '8箱', result: '客户确认中', attachment: '装箱清单.pdf' },
      ],
      area: '成品仓待放行区',
      blockQty: '50台',
      blockAction: '出库拦截',
      blockStatus: '待放行审批',
      reviewQty: '50台',
      reviewAction: '客户确认后让步放行',
      reviewStatus: row.status,
      writebackCode: 'OUT-HOLD-202605-009',
      recheckItem: '包装外观复核',
      recheckQty: '13台',
      recheckOwner: '陈质检',
      recheckTime: '2026-05-18 11:20',
      recheckResult: '不影响功能',
      secondCheckItem: '装箱清单核对',
      secondCheckQty: '50台',
      secondCheckTime: '2026-05-18 13:40',
      secondCheckResult: '清单一致',
      releaseReason: '包装轻微异常，不影响产品功能和客户使用',
      confirmation: '客户邮件确认',
      releaseCondition: '随货附异常说明并保留照片',
      releaseResult: row.status,
      businessOwner: '销售经理',
      businessConfirm: '客户已确认可收货',
      traceCondition: '发货批次绑定异常单',
      traceResult: '待质量经理终审',
      mainProblem: '出货包装轻微异常',
      capaAction: '包装工位增加唛头位置复核',
      capaOwner: '包装班长',
      capaStatus: '已下发',
      verifyLot: 'SHIP-20260518-04',
      verifyMethod: '客户确认+出货抽检',
      verifyResult: '不影响出货',
      verifyTime: '2026-05-18 16:00',
      closeConclusion: '放行审批后关闭',
      followLot: 'SHIP-20260522-02',
      followResult: '待客户签收反馈',
      followTime: '2026-05-22 18:00',
      followConclusion: '待跟踪',
    };
  }
  return {
    sourceType: 'IQC来料检验',
    linkType: '采购订单',
    linkCode: 'PO-202605-001',
    linkLot: row.lot,
    linkObject: row.object,
    linkQty: '到货10箱 / 抽样32件',
    syncStatus: '已同步异常记录',
    writeback: '处置结论待回写入库与供应商质量',
    defects: [
      { item: '轴承内径', standard: '50.00±0.10mm', measured: '50.25mm', level: row.severity, qty: '2件', result: '不合格', attachment: '尺寸测量记录.xlsx' },
      { item: '外观划痕', standard: '无明显划痕', measured: '样本S08轻微划痕', level: 'MINOR', qty: '1件', result: '记录观察', attachment: '不良图片.zip' },
    ],
    area: '质检暂存仓-IQC-A01',
    blockQty: '影响32件样本',
    blockAction: '隔离待MRB评审',
    blockStatus: row.status,
    reviewQty: '2件不合格 / 32件样本',
    reviewAction: '供应商整改 + 加严复检',
    reviewStatus: 'MRB待评审',
    writebackCode: `WH-HOLD-${codeTail}`,
    recheckItem: '轴承内径',
    recheckQty: '32件',
    recheckOwner: '老夏',
    recheckTime: '2026-05-17 16:00',
    recheckResult: '待复检',
    secondCheckItem: '材质证明复核',
    secondCheckQty: '10箱',
    secondCheckTime: '2026-05-18 10:30',
    secondCheckResult: '供应商补充中',
    releaseReason: '尺寸偏差轻微且不影响装配',
    confirmation: '生产/研发待确认',
    releaseCondition: '限定工单使用并全程追溯',
    releaseResult: '待评审',
    businessOwner: '生产计划员',
    businessConfirm: '待确认使用需求',
    traceCondition: '绑定采购批次和成品序列号',
    traceResult: '待绑定',
    mainProblem: '尺寸偏差超出上限',
    capaAction: '供应商量具校准和首件复核',
    capaOwner: '供应商质量工程师',
    capaStatus: '执行中',
    verifyLot: 'LOT-IQC-20260520-01',
    verifyMethod: '连续三批加严抽样',
    verifyResult: '第一批待检',
    verifyTime: '2026-05-20 15:00',
    closeConclusion: '待连续批次验证',
    followLot: 'LOT-IQC-20260524-01',
    followResult: '未开始',
    followTime: '2026-05-24 18:00',
    followConclusion: '待跟踪',
  };
}

function genericDetailTable(row: QcRow, tab: string): DetailTable {
  const owner = 'inspector' in row ? row.inspector : '系统';
  if (tab.includes('来源')) {
    return {
      columns: ['来源类型', '来源单号', '来源批次', '对象', '带入数量', '同步状态'],
      rows: [[row.source, row.code, 'lot' in row ? row.lot : row.date, row.object, row.qty, '已同步']],
    };
  }
  if (tab.includes('复检')) {
    return {
      columns: ['复检批次', '复检项目', '复检数量', '复检人', '复检时间', '结论'],
      rows: [[`RCK-${row.code}`, row.subject, row.qty, owner, `${row.date} 15:30`, row.status]],
    };
  }
  if (tab.includes('放行')) {
    return {
      columns: ['判定动作', '审批人', '审批时间', '判定依据', '影响单据', '结果'],
      rows: [['放行评审', owner, `${row.date} 16:00`, '按质检方案和处置结论判定', row.source, row.status]],
    };
  }
  return {
    columns: recordColumns(tab),
    rows: [[row.status, owner, `${row.date} 15:30`, `${row.subject} ${tab}记录`, row.code]],
  };
}

function recordColumns(tab: string) {
  if (tab.includes('来源')) return ['来源类型', '来源单号', '来源批次', '供应商/产线/客户', '带入数量', '同步状态'];
  if (tab.includes('复检')) return ['复检批次', '复检项目', '复检数量', '复检人', '复检时间', '结论'];
  if (tab.includes('放行')) return ['判定动作', '审批人', '审批时间', '判定依据', '影响单据', '结果'];
  if (tab.includes('整改') || tab.includes('关闭') || tab.includes('处置') || tab.includes('隔离')) return ['不良现象', '缺陷等级', '责任环节', '处置方式', '负责人', '状态'];
  if (tab.includes('趋势')) return ['日期', '检验数', '合格数', '不良数', '合格率', '趋势'];
  if (tab.includes('分布') || tab.includes('维度')) return ['维度', '检验数', '不良数', '不良率', '主要问题', '责任人'];
  return ['操作类型', '操作人', '操作时间', '操作内容', '结果'];
}

function openDetail(id: string) {
  router.push(`${route.path}?id=${id}`);
}

function openCreate() {
  if (mode.value === 'standards') {
    router.push({ path: route.path, query: { action: 'new', type: currentStandardLabel.value } });
    return;
  }
  router.push({ path: route.path, query: { action: 'new' } });
}

function resetStandardCreateForm() {
  standardCreateForm.value = {
    subject: '',
    code: '系统自动生成',
    source: '来料检验 IQC',
    judgementType: '分数值',
  };
  standardCriteriaRows.value = [createStandardCriteriaRow(1)];
  standardDetailText.value = '';
  standardAttachmentRows.value = [{ id: 1, name: '', type: '标准文件', date: currentBusinessDate(), remark: '' }];
}

async function saveStandardCreateForm(status = '启用') {
  const payload = standardCreateForm.value;
  const businessDate = currentBusinessDate();
  await createQcStandard({
    subject: payload.subject || '新增质检标准',
    code: payload.code && payload.code !== '系统自动生成' ? payload.code : undefined,
    source: `质检标准 / ${payload.source}`,
    object: payload.source,
    qty: 'V1.0 / 待维护',
    inspector: currentOperatorName,
    date: businessDate,
    status,
    stage: 'STANDARD',
    version: 'V1.0',
    sampling: '按质检方案带出抽样规则',
    defect: '按 CR/MA/MI 分级判定',
    approval: `${currentOperatorName} 于 ${businessDate} 维护`,
    judgementType: payload.judgementType,
    criteria: standardCriteriaRows.value.map((row) => ({ ...row })),
    standardAttachments: standardAttachmentRows.value.map((row) => ({ ...row, remark: row.remark || '' })),
    standardDetail: standardDetailText.value,
  });
  submitMessage.value = status === '草稿'
    ? `质检标准草稿已保存，检测标准 ${standardCriteriaRows.value.length} 条、附件 ${standardAttachmentRows.value.length} 条已暂存。`
    : `新增质检标准已保存，检测标准 ${standardCriteriaRows.value.length} 条、附件 ${standardAttachmentRows.value.length} 条已随单据暂存。`;
  await loadList();
}

async function savePlanCreateForm(status = '启用') {
  const businessDate = currentBusinessDate();
  const stageCode = stageCodeFromLabel(form.value.stage);
  await createQcStandard({
    subject: form.value.subject || '新增质检方案',
    code: form.value.code && form.value.code !== '系统自动生成' ? form.value.code : undefined,
    source: `检验方案 / ${stageCode}`,
    object: form.value.object || '通用',
    qty: `${form.value.qty || 'V1.0'} / ${form.value.sampling || 'AQL 1.0'}`,
    inspector: form.value.inspector || currentOperatorName,
    date: businessDate,
    status,
    stage: 'STANDARD',
    version: form.value.qty || 'V1.0',
    sampling: form.value.sampling || 'GB/T 2828.1 一般II AQL 1.0',
    defect: form.value.critical || 'CR=0 / MA=1 / MI=3',
    approval: status === '草稿' ? '待提交审批' : `${currentOperatorName} 已维护`,
    groupIds: sampleRows.value.map((row) => String(row.groupId || row.id)).filter(Boolean),
    standardIds: planStandardRows.value.map((row) => String(row.standardId || row.id)).filter(Boolean),
    standardAttachments: attachRows.value.map((row) => ({ ...row, remark: row.remark || '' })),
    standardDetail: detailText.value,
  });
  submitMessage.value = status === '草稿'
    ? `质检方案草稿已保存，已关联 ${sampleRows.value.length} 个质检组、${planStandardRows.value.length} 条质检标准。`
    : `新增质检方案已保存，已关联 ${sampleRows.value.length} 个质检组、${planStandardRows.value.length} 条质检标准。`;
  await loadList();
}

function addStandardAttachment() {
  standardAttachmentRows.value = [
    ...standardAttachmentRows.value,
    { id: Date.now(), name: '', type: '标准文件', date: currentBusinessDate(), remark: '' },
  ];
}

function createStandardCriteriaRow(id: string | number = Date.now()): StandardCriteriaRow {
  return {
    id,
    name: '',
    standardType: '企业标准',
    baseUnit: '毫米(mm)',
    baseline: '',
    standardValue: '',
    upperDeviation: '',
    lowerDeviation: '',
    standardDescription: '',
  };
}

function uploadStandardAttachment(row: AttachmentRow) {
  submitMessage.value = `${row.name || '附件'} 已触发上传。`;
}

function removeStandardAttachment(row: AttachmentRow) {
  if (standardAttachmentRows.value.length > 1) {
    if (!confirmRemove(row.name || '当前标准附件')) return;
    standardAttachmentRows.value = standardAttachmentRows.value.filter((item) => item.id !== row.id);
  }
}

function routeGroupFromAction() {
  if (mode.value === 'execution') {
    if (qcExecutionStageGroups.includes(action.value)) return action.value;
    return 'all';
  }
  if (mode.value === 'standards') {
    if (isCreateAction.value) return currentStandardLabel.value;
    if (action.value && action.value !== 'new') return standardLabelMap[action.value] || action.value;
    return '质检方案';
  }
  if (isCreateAction.value) return 'all';
  if (action.value && action.value !== 'new') return action.value;
  return 'all';
}

function mappedCategory(group: string) {
  if (group.includes('IQC') || group.includes('来料')) return 'IQC';
  if (group.includes('IPQC') || group.includes('过程')) return 'IPQC';
  if (group.includes('FQC') || group.includes('成品')) return 'FQC';
  if (group.includes('OQC') || group.includes('出货')) return 'OQC';
  if (group === '质检方案') return '检验方案';
  if (group === '质检组') return '检验组';
  if (group === '待检任务') return '待报检';
  return group;
}

function stageFromGroup(group: string) {
  const mapped = mappedCategory(group);
  return ['IQC', 'IPQC', 'FQC', 'OQC'].includes(mapped) ? mapped : undefined;
}

function countByGroup(group: string) {
  const mapped = mappedCategory(group);
  if (mode.value === 'execution' && ['IQC', 'IPQC', 'FQC', 'OQC'].includes(mapped)) {
    const rows = qcRowsForResource('qc-inspections') as QcInspection[];
    return rows.filter((row) => row.stage === mapped && (!isPendingExecutionScope() || isPendingInspectionRow(row))).length;
  }
  if (['IQC', 'IPQC', 'FQC', 'OQC'].includes(mapped)) return listRows.value.filter((row) => 'stage' in row && row.stage === mapped).length;
  if (group === '待检任务') return listRows.value.filter((row) => /待|中/.test(row.status)).length;
  return listRows.value.filter((row) => row.source === group || row.status === group || ('actionType' in row && row.actionType === group)).length;
}

function handleBatchAction(actionKey: string, keys: string[]) {
  const label = qcDisposalActions.find((item) => item.includes(actionKey)) || actionKey;
  const count = keys.length || tableRows.value.length;
  if (!count) {
    submitMessage.value = '当前没有可处理的质检记录。';
    return;
  }
  if (!confirmAction(label, `将处理 ${count} 条质检记录。`)) return;
  submitMessage.value = `已提交 ${count} 条记录的${label}处理。`;
}

function handleQuickAction(id: string, key: string) {
  if (key === 'recheck' && mode.value === 'exceptions') {
    if (!confirmAction('发起复检', '将从当前异常单生成复检任务。')) return;
    submitQcExceptionAction(id, 'recheck', { action: 'create-recheck', opinion: '从异常列表快捷发起复检，按当前异常单生成复检任务。' }).then(loadList);
    submitMessage.value = '已从异常列表发起复检流程。';
    return;
  }
  if (key === 'recheck' && confirmAction('返工复检', '将更新当前质检任务状态。')) submitQcResult(id, '返工复检').then(loadList);
}

async function handleFormAction(key: string) {
  if (key === 'reset') {
    if (!confirmClear('当前质检草稿')) return;
    if (mode.value === 'standards' && currentStandardLabel.value === '质检标准') resetStandardCreateForm();
    else resetForm();
    if (mode.value === 'execution') {
      qcCreateStep.value = 0;
      pickedQcCreateStage.value = '';
    }
    submitMessage.value = '已重置。';
    return;
  }
  if (key === 'save' && !confirmAction(mode.value === 'exceptions' ? '提交异常' : mode.value === 'standards' ? '保存质检配置' : '提交检验任务', '将写入当前质检 mock/API adapter。')) return;
  if (mode.value === 'execution' && isCreateAction.value && !pickedQcCreateStage.value) {
    qcCreateStep.value = 0;
    submitMessage.value = '请先选择质检类型，再填写来源信息。';
    return;
  }
  if (mode.value === 'execution' && isCreateAction.value && qcCreateStep.value === 0) {
    qcCreateStep.value = 1;
    return;
  }
  if (mode.value === 'standards' && currentStandardLabel.value === '质检标准') {
    await saveStandardCreateForm(key === 'draft' ? '草稿' : '启用');
    return;
  }
  if (isQcPlanCreate()) {
    await savePlanCreateForm(key === 'draft' ? '草稿' : '启用');
    return;
  }
  if (mode.value === 'exceptions') await createQcException({ ...form.value, stage: 'NCR', status: key === 'draft' ? '待处置' : form.value.status, severity: form.value.severity as QcException['severity'] });
  else if (mode.value === 'standards') await createQcStandard({ ...form.value, stage: 'STANDARD', status: key === 'draft' ? '草稿' : form.value.status });
  else await createQcInspection({ ...form.value, status: key === 'draft' ? '待报检' : form.value.status, stage: form.value.stage as QcInspection['stage'] });
  submitMessage.value = key === 'draft' ? '草稿已保存到 mock/API adapter。' : '提交成功，已写入质检 mock/API adapter。';
}

async function handleExecuteAction(key: string) {
  if (!isQcInspectionRow(detailRow.value)) return;
  const row = detailRow.value;
  if (key === 'reset') {
    if (!confirmClear('当前执行质检录入结果')) return;
    resetExecutionForm(row);
    submitMessage.value = '执行质检页面已按当前任务重新带出方案和标准。';
    return;
  }
  if (key === 'draft') {
    submitMessage.value = '执行质检草稿已保存，检验结果、附件和异常处置方式保留在当前任务上下文。';
    return;
  }
  const hasException = Number(executionForm.value.unqualifiedQty || 0) > 0
    || executionForm.value.finalResult === '不合格'
    || executionResultRows.value.some((item) => ['不合格', '让步接收'].includes(String(item.result || '')));
  if (!confirmAction('提交质检结果', hasException ? `将按「${executionForm.value.exceptionAction}」生成异常处置并回写任务状态。` : '将按合格放行回写任务状态。')) return;
  const action = hasException ? executeActionToInspectionAction(executionForm.value.exceptionAction) : '放行';
  const updated = await submitQcResult(row.id, action);
  if (hasException) {
    await createQcException({
      subject: `${row.subject}异常处置`,
      source: row.code,
      object: row.object,
      qty: `抽样${executionForm.value.sampleQty || '-'} / 不合格${executionForm.value.unqualifiedQty || '待确认'}`,
      inspector: row.inspector,
      date: currentBusinessDate(),
      status: executeActionToExceptionStatus(executionForm.value.exceptionAction),
      lot: row.lot,
      plan: '异常处置流程 V2.1',
      sampling: row.sampling,
      critical: executionForm.value.exceptionReason || executionForm.value.exceptionAction,
      severity: executionRowsSeverity(),
      actionType: executeActionToExceptionType(executionForm.value.exceptionAction),
    });
  }
  if (updated) detailRow.value = updated;
  submitMessage.value = hasException
    ? `质检结果已提交，已按「${executionForm.value.exceptionAction}」生成异常处置并回写任务状态：${updated?.status || row.status}。`
    : `质检结果已提交，任务已按合格放行回写：${updated?.status || row.status}。`;
  router.push({ path: route.path, query: { id: row.id } });
}

function executeActionToInspectionAction(actionName: string) {
  if (actionName === '让步放行') return '让步接收';
  if (actionName === '拒收/隔离') return '拒收';
  return '返工复检';
}

function executeActionToExceptionStatus(actionName: string) {
  if (actionName === '让步放行') return '让步审批';
  if (actionName === '拒收/隔离') return '隔离中';
  return '复检中';
}

function executeActionToExceptionType(actionName: string) {
  if (actionName === '让步放行') return '让步放行';
  if (actionName === '拒收/隔离') return '隔离/拒收';
  return '返工复检';
}

function executionRowsSeverity(): QcException['severity'] {
  return executionResultRows.value.some((item) => item.result === '不合格') ? 'MAJOR' : 'MINOR';
}

async function handleDetailAction(key: string) {
  if (!detailRow.value) return;
  if (mode.value === 'exceptions' && isQcExceptionRow(detailRow.value)) {
    openExceptionAction(key);
    return;
  }
  if (mode.value === 'execution' && isQcInspectionRow(detailRow.value) && key === 'execute') {
    router.push({ path: route.path, query: { action: 'execute', id: detailRow.value.id } });
    return;
  }
  if (mode.value === 'standards' && isQcStandardDetailLike(detailRow.value)) {
    if (key === 'edit') {
      submitMessage.value = '修改入口已保留，当前可通过新增/修订流程维护质检方案、质检组和质检标准。';
      return;
    }
	    if (key === 'approve') {
	      const isPendingApproval = detailRow.value.status === '待审批';
	      if (isPendingApproval) {
	        openApprovalAction('standard');
	        return;
	      }
	      const label = isPendingApproval ? '审核通过' : '提交审批';
	      if (!confirmAction(label, isPendingApproval ? `将把 ${detailRow.value.code} 审核为启用。` : `将把 ${detailRow.value.code} 更新为待审批。`)) return;
      const updated = await updateQcStandard(detailRow.value.id, {
        status: isPendingApproval ? '启用' : '待审批',
        approval: isPendingApproval ? `${currentOperatorName} 已审核通过` : `${currentOperatorName} 已提交审批`,
      });
      if (updated) detailRow.value = updated;
      submitMessage.value = isPendingApproval ? '质检配置已审核启用。' : '质检配置已提交审批。';
      return;
    }
    if (key === 'enable') {
      if (!confirmAction('启用', `将重新启用 ${detailRow.value.code}。`)) return;
      const updated = await updateQcStandard(detailRow.value.id, { status: '启用', approval: `${currentOperatorName} 已重新启用` });
      if (updated) detailRow.value = updated;
      submitMessage.value = '质检配置已启用。';
      return;
    }
    if (key === 'disable') {
      if (!window.confirm(`确认停用 ${detailRow.value.subject} ${detailRow.value.code} 吗？停用后新增质检任务不能再选择该配置。`)) return;
      const updated = await updateQcStandard(detailRow.value.id, { status: '停用' });
      if (updated) detailRow.value = updated;
      submitMessage.value = '质检配置已停用，历史质检单仍可查看和追溯。';
      return;
    }
    if (key === 'print') {
      submitMessage.value = '打印入口已保留，后续接入统一质检打印模板。';
      return;
    }
  }
  if (mode.value === 'reports') {
    if (key === 'generate') {
      if (!confirmAction('生成报表', `将生成报表 ${detailRow.value.code} 的当前统计结果。`)) return;
      detailRow.value = { ...detailRow.value, status: '已生成', tone: 'green' } as QcRow;
      submitMessage.value = '质检分析报表已生成。';
      return;
    }
    if (key === 'confirm') {
      if (!confirmAction('确认报表', `将确认报表 ${detailRow.value.code} 的当前统计口径。`)) return;
      detailRow.value = { ...detailRow.value, status: '已确认', tone: 'green' } as QcRow;
      submitMessage.value = '质检分析报表已确认。';
      return;
    }
    if (key === 'export' || key === 'print') {
      submitMessage.value = key === 'export' ? '报表导出任务已创建。' : '报表打印入口已保留。';
      return;
    }
  }
	  if (mode.value === 'execution' && isQcInspectionRow(detailRow.value) && key === 'release' && detailRow.value.status === '特采评审') {
	    openApprovalAction('special');
	    return;
	  }
  if (['submit', 'recheck', 'release', 'reject'].includes(key)) {
    const actionMap: Record<string, string> = { submit: '放行', recheck: '返工复检', release: '让步接收', reject: '拒收' };
    if (!confirmAction(actionMap[key], `将更新质检任务 ${detailRow.value.code} 的执行状态。`)) return;
    const updated = await submitQcResult(detailRow.value.id, actionMap[key]);
    if (updated) detailRow.value = updated;
  }
  submitMessage.value = `已触发${key}动作。`;
}

function openExceptionAction(key: string) {
  if (!['isolate', 'mrb', 'recheck', 'release', 'close'].includes(key)) {
    submitMessage.value = `异常处理暂不支持${key}动作。`;
    return;
  }
  exceptionActionKey.value = key as ExceptionActionKey;
  showExceptionActionModal.value = true;
  submitMessage.value = `${exceptionActionModalTitle.value}待确认，请在弹窗中选择动作并填写意见。`;
}

function openApprovalAction(context: QcApprovalContext) {
  approvalContext.value = context;
  showApprovalModal.value = true;
  submitMessage.value = `${context === 'special' ? '特采评审' : '质检配置'}待审核，请在弹窗中选择处理动作并填写意见。`;
}

async function confirmApprovalAction(payload: AuditActionPayload) {
  if (!detailRow.value) return;
  showApprovalModal.value = false;
  if (approvalContext.value === 'standard' && isQcStandardDetailLike(detailRow.value)) {
    const nextStatus = payload.action === 'approve' ? '启用' : payload.action === 'reject' ? '草稿' : payload.action === 'return' ? '修订中' : detailRow.value.status;
    const updated = await updateQcStandard(detailRow.value.id, {
      status: nextStatus,
      approval: `${currentOperatorName} ${approvalActionLabel(payload.action)}：${payload.opinion || '通过审核弹窗处理'}`,
    });
    if (updated) detailRow.value = updated;
    submitMessage.value = `质检配置${approvalActionLabel(payload.action)}完成，当前状态：${nextStatus}。`;
    await loadList();
    return;
  }
  if (approvalContext.value === 'special' && isQcInspectionRow(detailRow.value)) {
    const nextStatus = payload.action === 'approve' ? '已放行' : payload.action === 'reject' ? '拒收退回' : payload.action === 'return' ? '待判定' : detailRow.value.status;
    const updated = await updateQcInspection(detailRow.value.id, { status: nextStatus });
    if (updated) detailRow.value = updated;
    submitMessage.value = `特采评审${approvalActionLabel(payload.action)}完成，当前状态：${nextStatus}。`;
    await loadList();
  }
}

function approvalActionLabel(action: string) {
  return approvalActions.find((item) => item.key === action)?.label || action;
}

async function confirmExceptionAction(payload: AuditActionPayload) {
  if (!isQcExceptionRow(detailRow.value)) return;
  const updated = await submitQcExceptionAction(detailRow.value.id, exceptionActionKey.value, { ...payload });
  showExceptionActionModal.value = false;
  if (!updated) {
    submitMessage.value = '未找到异常单，动作未提交。';
    return;
  }
  detailRow.value = updated;
  listRows.value = listRows.value.map((row) => row.id === updated.id ? updated : row);
  submitMessage.value = `${exceptionActionModalTitle.value}已提交，当前状态：${updated.status}。`;
  await loadList();
}

function resetForm() {
  form.value = {
    subject: mode.value === 'exceptions' ? '新增异常处置' : mode.value === 'standards' ? `新增${currentStandardLabel.value}` : '',
    code: '系统自动生成',
    source: mode.value === 'standards' ? mappedCategory(currentStandardLabel.value) : '',
    object: '',
    qty: '',
    inspector: mode.value === 'execution' ? currentOperatorName : '',
    date: '2026-05-30',
    status: mode.value === 'standards' ? '草稿' : mode.value === 'exceptions' ? '待处置' : '待报检',
    stage: 'IQC',
    lot: '',
    plan: '',
    sampling: '',
    critical: '',
    severity: 'MAJOR',
    actionType: '不合格记录',
  };
  sampleRows.value = isQcGroupCreate() || isQcPlanCreate() ? [] : [{ id: 1, sampleNo: 'S01-S32', qty: '32', rule: 'GB/T 2828.1 一般II AQL 1.0', owner: '老夏', result: '待判定' }];
  planStandardRows.value = [];
  inspectRows.value = qcInspectionLines.map((line) => ({ ...line }));
  attachRows.value = [{ id: 1, name: '', type: '质检报告', date: '2026-05-30', remark: '' }];
  qcProductDetailRows.value = [createEmptyQcProductDetailRow()];
  detailText.value = '';
}

function confirmSource(source: SourcePickerConfirmPayload) {
  if (form.value.source && form.value.source !== source.code && hasQcDraftContent() && !confirmClear('当前来源、产品明细和质检要求')) return;
  form.value.source = source.code;
  form.value.object = source.customer;
  form.value.qty = String(source.maxQty || '');
  form.value.lot = source.sourceDetail || source.code;
  const sourceProducts = qcSourceProductDetails(source);
  qcProductDetailRows.value = sourceProducts.length ? sourceProducts : [createEmptyQcProductDetailRow()];
  if (sourceProducts.length) {
    form.value.object = sourceProducts.map((row) => row.productName).join('、');
    const matchedProduct = productRows.find((product) => product.code === sourceProducts[0]?.productCode);
    if (matchedProduct?.plan && !form.value.plan) form.value.plan = String(matchedProduct.plan);
  }
  if (!pickedQcCreateStage.value) {
    if (source.cat === 'production') form.value.stage = source.subject.includes('完工') ? 'FQC' : 'IPQC';
    if (source.cat === 'warehouse') form.value.stage = source.subject.includes('出库') ? 'OQC' : 'IQC';
  } else {
    form.value.stage = pickedQcCreateStage.value;
  }
  showSourcePicker.value = false;
}

function confirmInspectionSubject(row: OptionPickerRow) {
  if (form.value.subject && form.value.subject !== String(row.subject || '') && hasQcDraftContent() && !confirmClear('当前质检主题带出的来源、方案和明细')) return;
  const stage = String(row.stage || form.value.stage) as QcCreateTypeCard['stage'];
  if (['IQC', 'IPQC', 'FQC', 'OQC'].includes(stage)) {
    pickedQcCreateStage.value = stage;
    form.value.stage = stage;
  }
  form.value.subject = String(row.subject || '');
  form.value.source = String(row.source || '');
  form.value.object = String(row.object || '');
  form.value.qty = String(row.qty || '');
  form.value.inspector = String(row.inspector || '');
  form.value.lot = String(row.lot || '');
  form.value.plan = String(row.plan || '');
  form.value.sampling = String(row.sampling || '');
  form.value.critical = String(row.critical || '');
  showInspectionPicker.value = false;
}

function confirmPersons(persons: PersonPickerPerson[]) {
  pickedPersons.value = persons.slice(0, 1);
  form.value.inspector = pickedPersons.value.map((person) => person.name).join('、');
  showPersonPicker.value = false;
}

function confirmPlan(row: OptionPickerRow) {
  form.value.plan = String(row.name || '');
  form.value.sampling = String(row.sampling || '');
  showPlanPicker.value = false;
}

function confirmProduct(row: OptionPickerRow) {
  form.value.object = `${row.name || ''}`;
  if (!form.value.plan) form.value.plan = String(row.plan || '');
  const detailRow = qcProductDetailFromProduct(row);
  const emptyRow = qcProductDetailRows.value.find((item) => !item.productCode && !item.productName);
  if (emptyRow) Object.assign(emptyRow, detailRow);
  else qcProductDetailRows.value.push(detailRow);
  showProductPicker.value = false;
}

async function openGroupPicker() {
  const rows = (await listQcStandards({ category: '检验组', pageSize: 100 })).items;
  groupPickerRows.value = rows.map((row) => ({
    id: row.id,
    name: row.subject,
    code: row.code,
    stage: row.object || standardStageLabel(row),
    leader: row.leader || row.inspector,
    auth: row.auth || '-',
    shift: row.shift || '-',
    status: row.status,
  }));
  showGroupPicker.value = true;
}

function confirmPlanGroup(row: OptionPickerRow) {
  const groupId = String(row.id || row.code || Date.now());
  const detailRow = {
    id: groupId,
    groupId,
    groupName: String(row.name || ''),
    groupCode: String(row.code || ''),
    stage: String(row.stage || ''),
    leader: String(row.leader || ''),
    auth: String(row.auth || '-'),
    shift: String(row.shift || '-'),
    status: String(row.status || ''),
  };
  const existed = sampleRows.value.find((item) => String(item.groupId || item.id) === groupId);
  if (existed) Object.assign(existed, detailRow);
  else sampleRows.value = [...sampleRows.value, detailRow];
  refreshPlanStandardsFromGroups();
  showGroupPicker.value = false;
  submitMessage.value = `已添加质检组：${detailRow.groupName}`;
}

function refreshPlanStandardsFromGroups() {
  const standards = qcRowsForResource('qc-standards') as QcStandard[];
  const groupIds = sampleRows.value.map((row) => String(row.groupId || row.id)).filter(Boolean);
  const linked = groupIds.flatMap((id) => {
    const group = standards.find((item) => item.id === id || item.code === id);
    return group ? qcGroupStandards(group) : [];
  });
  const unique = linked.filter((standard, index, rows) => rows.findIndex((item) => item.id === standard.id) === index);
  planStandardRows.value = unique.map(standardToFormLine);
}

function standardToFormLine(row: QcStandard): FormLine {
  const criterion = standardListCriterion(row);
  return {
    id: row.id,
    standardId: row.id,
    standardName: row.subject,
    standardCode: row.code,
    stage: standardStageLabel(row),
    judgementType: row.judgementType || '分数值',
    standardType: criterion?.standardType || '-',
    baseUnit: criterion?.baseUnit || '-',
    baseline: criterion?.baseline || '-',
    standardValue: criterion?.standardValue || '-',
    upperDeviation: criterion?.upperDeviation || '-',
    lowerDeviation: criterion?.lowerDeviation || '-',
    standardStatus: row.status,
  };
}

async function openStandardPicker() {
  const rows = (await listQcStandards({ category: '质检标准', pageSize: 100 })).items;
  standardPickerRows.value = rows.map((row) => {
    const criterion = standardListCriterion(row);
    return {
      id: row.id,
      name: row.subject,
      code: row.code,
      stage: standardStageLabel(row),
      judgementType: row.judgementType || '分数值',
      standardType: criterion?.standardType || '-',
      baseUnit: criterion?.baseUnit || '-',
      baseline: criterion?.baseline || '-',
      standardValue: criterion?.standardValue || '-',
      upperDeviation: criterion?.upperDeviation || '-',
      lowerDeviation: criterion?.lowerDeviation || '-',
      status: row.status,
    };
  });
  showStandardPicker.value = true;
}

function confirmStandardDetail(row: OptionPickerRow) {
  const standardId = String(row.id || row.code || Date.now());
  const detailRow = {
    id: standardId,
    standardId,
    standardName: String(row.name || ''),
    standardCode: String(row.code || ''),
    stage: String(row.stage || ''),
    judgementType: String(row.judgementType || '分数值'),
    standardType: String(row.standardType || '-'),
    baseUnit: String(row.baseUnit || '-'),
    baseline: String(row.baseline || '-'),
    standardValue: String(row.standardValue || '-'),
    upperDeviation: String(row.upperDeviation || '-'),
    lowerDeviation: String(row.lowerDeviation || '-'),
    standardStatus: String(row.status || ''),
  };
  const existed = sampleRows.value.find((item) => String(item.standardId || item.id) === standardId);
  if (existed) Object.assign(existed, detailRow);
  else sampleRows.value = [...sampleRows.value, detailRow];
  showStandardPicker.value = false;
  submitMessage.value = `已添加质检标准：${detailRow.standardName}`;
}

</script>

<style scoped>
:global(.qc-create-flow-form) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

:global(.qc-create-stepper) {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

:global(.qc-create-step) {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-fg-2);
  display: flex;
  font: inherit;
  font-size: 13px;
  gap: 8px;
  height: 42px;
  justify-content: center;
}

:global(.qc-create-step span) {
  align-items: center;
  background: var(--aw-surface-2);
  border-radius: 50%;
  color: var(--aw-fg-3);
  display: inline-flex;
  font-size: 12px;
  height: 20px;
  justify-content: center;
  width: 20px;
}

:global(.qc-create-step.on) {
  background: var(--aw-primary-soft);
  border-color: var(--aw-primary);
  color: var(--aw-primary);
  font-weight: 600;
}

:global(.qc-create-step.on span),
:global(.qc-create-step.done span) {
  background: var(--aw-primary);
  color: #fff;
}

:global(.qc-create-type-grid) {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

:global(.qc-create-type-card) {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 7px;
  color: var(--aw-fg-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font: inherit;
  gap: 8px;
  min-height: 132px;
  padding: 14px;
  text-align: left;
}

:global(.qc-create-type-card strong) {
  align-items: center;
  color: var(--aw-fg-1);
  display: flex;
  font-size: 15px;
  gap: 8px;
  justify-content: space-between;
}

:global(.qc-create-type-card strong span) {
  background: var(--aw-primary-soft);
  border-radius: 999px;
  color: var(--aw-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
}

:global(.qc-create-type-card em) {
  color: var(--aw-primary);
  font-size: 12px;
  font-style: normal;
}

:global(.qc-create-type-card p) {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
}

:global(.qc-create-type-card.on),
:global(.qc-create-type-card:hover) {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px var(--aw-primary-soft);
}

:global(.qc-create-step-actions) {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  margin-top: 14px;
}

:global(.qc-create-step-actions.right) {
  justify-content: flex-end;
}

:global(.qc-create-detail-step) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qc-file-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 14px;
}

.qc-file {
  border: 1px dashed var(--aw-border-strong);
  border-radius: 6px;
  min-height: 92px;
  padding: 14px;
}

.qc-file strong,
.qc-file span {
  display: block;
}

.qc-file span {
  color: var(--aw-fg-3);
  font-size: 12px;
  margin-top: 8px;
}

:global(.qc-standard-criteria-table .aw-doc-tbl) {
  min-width: max-content !important;
  table-layout: fixed !important;
  width: max-content !important;
}

:global(.qc-standard-criteria-table .aw-doc-tbl th),
:global(.qc-standard-criteria-table .aw-doc-tbl td) {
  max-width: none !important;
}

:global(.qc-standard-criteria-table .aw-doc-tbl th:nth-child(2)),
:global(.qc-standard-criteria-table .aw-doc-tbl td:nth-child(2)) {
  max-width: 152px !important;
  min-width: 152px !important;
  width: 152px !important;
}

:global(.qc-standard-criteria-table .aw-doc-tbl th:nth-child(3)),
:global(.qc-standard-criteria-table .aw-doc-tbl td:nth-child(3)) {
  max-width: 122px !important;
  min-width: 122px !important;
  width: 122px !important;
}

:global(.qc-standard-criteria-table .aw-doc-tbl td:nth-child(2) .aw-input),
:global(.qc-standard-criteria-table .aw-doc-tbl td:nth-child(3) .aw-select) {
  min-width: 0 !important;
}

.qc-standard-detail-preview {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  color: var(--aw-fg-2);
  font-size: 13px;
  line-height: 1.9;
  padding: 14px 16px;
}

.qc-standard-detail-preview p {
  margin: 0 0 8px;
}

.qc-standard-detail-preview p:last-child {
  margin-bottom: 0;
}

:global(.qc-standard-criteria-cards) {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

:global(.qc-standard-criteria-card-long) {
  grid-column: span 2;
}

:global(.qc-standard-criteria-card-long strong) {
  display: block;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.55;
  white-space: normal;
}

:global(.qc-execute-form) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

:global(.qc-execute-stepper) {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

:global(.qc-execute-form .aw-as-step) {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-fg-2);
  display: flex;
  font-size: 13px;
  gap: 8px;
  height: 42px;
  justify-content: center;
}

:global(.qc-execute-form .aw-as-step span) {
  align-items: center;
  background: var(--aw-surface-2);
  border-radius: 50%;
  color: var(--aw-fg-3);
  display: inline-flex;
  font-size: 12px;
  height: 20px;
  justify-content: center;
  width: 20px;
}

:global(.qc-execute-form .aw-as-step.on) {
  background: var(--aw-primary-soft);
  border-color: var(--aw-primary);
  color: var(--aw-primary);
  font-weight: 600;
}

:global(.qc-execute-form .aw-as-step.on span),
:global(.qc-execute-form .aw-as-step.done span) {
  background: var(--aw-primary);
  color: #fff;
}

:global(.qc-execute-form .aw-doc-grid) {
  display: grid;
  gap: 16px 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

:global(.qc-execute-kv) {
  display: flex;
  gap: 14px;
  min-width: 0;
}

:global(.qc-execute-kv span) {
  color: var(--aw-fg-3);
  flex: none;
  width: 82px;
}

:global(.qc-execute-kv strong) {
  color: var(--aw-fg-1);
  font-weight: 500;
  min-width: 0;
  overflow-wrap: anywhere;
}

:global(.qc-execute-chip-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

:global(.qc-execute-chip) {
  background: #f6f8ff;
  border: 1px solid var(--aw-border);
  border-radius: 999px;
  color: var(--aw-primary);
  padding: 5px 10px;
}

:global(.qc-execute-plan-tabs) {
  margin-top: 14px;
}

:global(.qc-execute-plan-tabs .aw-detail-tabs) {
  margin-top: 2px;
}

:global(.qc-execute-group-standard-table) {
  margin-top: 12px;
}

:global(.qc-execute-group-standard-table .aw-doc-tbl) {
  min-width: 1130px;
}

:global(.qc-auto-result) {
  border-radius: 999px;
  display: inline-flex;
  font-weight: 600;
  justify-content: center;
  min-width: 64px;
  padding: 3px 10px;
}

:global(.qc-auto-result.ok) {
  background: #e8f8ef;
  color: #14804a;
}

:global(.qc-auto-result.bad) {
  background: #fff1f1;
  color: #d92d20;
}

:global(.qc-auto-result.pending) {
  background: #fff7e6;
  color: #b76e00;
}

:global(.qc-execute-method-grid) {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 14px;
}

:global(.qc-execute-method) {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 7px;
  color: var(--aw-fg-2);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font: inherit;
  gap: 6px;
  min-height: 86px;
  padding: 12px;
  text-align: left;
}

:global(.qc-execute-method strong) {
  color: var(--aw-fg-1);
}

:global(.qc-execute-method span) {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.5;
}

:global(.qc-execute-method.on) {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px var(--aw-primary-soft);
}

:global(.qc-execute-textarea) {
  min-height: 96px;
  resize: vertical;
}

:global(.qc-execute-board) {
  background: #f4f6fa;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
}

:global(.qc-product-strip),
:global(.qc-execute-panel),
:global(.qc-conclusion-panel) {
  background: #fff;
  border: 0.5px solid #d9dee8;
  border-radius: 8px;
  box-shadow: none;
}

:global(.qc-product-box-icon) {
  align-items: center;
  background: #f2f4f8;
  border-radius: 7px;
  color: #4b6fff;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}

:global(.qc-product-strip) {
  align-items: center;
  background: #eaf2ff;
  border-color: #4b77ff;
  color: #1857d5;
  display: flex;
  gap: 18px;
  min-height: 40px;
  padding: 9px 14px;
}

:global(.qc-product-current) {
  align-items: center;
  display: flex;
  flex: 1;
  gap: 10px;
  min-width: 0;
}

:global(.qc-product-current strong),
:global(.qc-qty-stat strong) {
  font-weight: 500;
}

:global(.qc-product-current span:last-child) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.qc-product-stats) {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: flex-end;
}

:global(.qc-qty-stat) {
  align-items: center;
  display: inline-flex;
  gap: 4px;
  font-size: 13px;
}

:global(.qc-qty-stat span) {
  color: #345fba;
}

:global(.qc-qty-stat.ok strong) {
  color: #14804a;
}

:global(.qc-qty-stat.bad strong) {
  color: #d92d20;
}

:global(.qc-inspection-grid) {
  display: grid;
  gap: 10px;
  grid-template-columns: 255px 224px minmax(0, 1fr);
}

:global(.qc-execute-panel) {
  min-height: 270px;
  padding: 12px;
}

:global(.qc-panel-title) {
  border-bottom: 0.5px solid #e5e8ef;
  color: #344054;
  font-size: 13px;
  font-weight: 500;
  margin: -2px -12px 8px;
  padding: 0 12px 10px;
}

:global(.qc-product-list),
:global(.qc-group-list),
:global(.qc-item-list) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:global(.qc-product-card),
:global(.qc-group-card) {
  background: #fff;
  border: 0.5px solid transparent;
  border-radius: 7px;
  color: #1d2939;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 54px;
  padding: 10px 12px;
  position: relative;
  text-align: left;
  width: 100%;
}

:global(.qc-product-card strong),
:global(.qc-group-card strong),
:global(.qc-item-card strong) {
  font-size: 14px;
  font-weight: 500;
}

:global(.qc-product-card span),
:global(.qc-group-card span),
:global(.qc-item-info span) {
  color: #667085;
  font-size: 12px;
  line-height: 1.4;
}

:global(.qc-product-card.on) {
  background: #eaf2ff;
  color: #1857d5;
}

:global(.qc-product-card.on::before) {
  background: #2f6bff;
  border-radius: 6px;
  bottom: 7px;
  content: "";
  left: 0;
  position: absolute;
  top: 7px;
  width: 3px;
}

:global(.qc-product-card.done span),
:global(.qc-group-card.done span) {
  color: #14804a;
}

:global(.qc-group-card) {
  background: #f9fafb;
  border-color: #edf0f5;
}

:global(.qc-group-card.on) {
  background: #fff;
  border-color: #2f6bff;
  box-shadow: none;
}

:global(.qc-group-card > div) {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

:global(.qc-group-check) {
  color: #14804a;
  font-size: 14px;
}

:global(.qc-item-panel) {
  min-width: 0;
}

:global(.qc-item-card) {
  align-items: center;
  border-bottom: 0.5px solid #edf0f5;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(210px, 1fr) auto;
  min-height: 76px;
  padding: 8px 0;
}

:global(.qc-item-card:last-child) {
  border-bottom: 0;
}

:global(.qc-item-card.locked) {
  opacity: 0.72;
}

:global(.qc-item-info) {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

:global(.qc-item-input-row),
:global(.qc-item-text-actions) {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:global(.qc-item-input) {
  width: 112px;
}

:global(.qc-text-judge),
:global(.qc-judge-btn),
:global(.qc-btn) {
  background: #fff;
  border: 0.5px solid #d9dee8;
  border-radius: 7px;
  color: #344054;
  cursor: pointer;
  font: inherit;
  min-height: 32px;
  padding: 6px 14px;
}

:global(.qc-text-judge.ok.on),
:global(.qc-judge-btn.ok.on) {
  background: #ecfdf3;
  border-color: #16a34a;
  color: #14804a;
}

:global(.qc-text-judge.bad) {
  border-color: #f04438;
  color: #d92d20;
}

:global(.qc-text-judge.bad.on),
:global(.qc-judge-btn.bad.on) {
  background: #f04438;
  border-color: #f04438;
  color: #fff;
}

:global(.qc-btn.primary) {
  border-color: #2f6bff;
  color: #2f6bff;
}

:global(.qc-group-submit-row) {
  border-top: 0.5px solid #e5e8ef;
  display: flex;
  justify-content: flex-end;
  margin: 10px -12px -2px;
  padding: 10px 12px 0;
}

:global(.qc-conclusion-panel) {
  align-items: center;
  display: grid;
  gap: 10px 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 12px 14px;
}

:global(.qc-conclusion-left),
:global(.qc-conclusion-actions) {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:global(.qc-conclusion-label) {
  color: #344054;
  font-size: 13px;
}

:global(.qc-disposal-select) {
  min-width: 130px;
}

:global(.qc-result-qty-field) {
  align-items: center;
  color: #344054;
  display: flex;
  font-size: 13px;
  gap: 6px;
}

:global(.qc-result-qty-input) {
  width: 112px;
}

:global(.qc-flow-note),
:global(.qc-execute-message) {
  color: #667085;
  font-size: 12px;
  grid-column: 1 / -1;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 900px) {
  :global(.qc-create-stepper),
  :global(.qc-create-type-grid),
  :global(.qc-execute-stepper),
  :global(.qc-execute-form .aw-doc-grid),
  :global(.qc-execute-method-grid),
  :global(.qc-inspection-grid),
  :global(.qc-conclusion-panel) {
    grid-template-columns: 1fr;
  }

  :global(.qc-product-strip) {
    align-items: flex-start;
    flex-direction: column;
  }
}

</style>
