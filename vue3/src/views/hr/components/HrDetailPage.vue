<template>
  <aw-detail-page>
    <template #toolbar>
      <aw-detail-toolbar v-if="isEmployeeActionDetail" :back-text="backText" @back="goBack">
        <template #actions>
          <div class="aw-detail-actions">
            <button class="aw-btn primary" type="button" @click="openEmployeeActionAudit">{{ employeeActionButtonLabel }}</button>
          </div>
        </template>
      </aw-detail-toolbar>
      <aw-detail-toolbar v-else :actions="defaultDetailActions" :back-text="backText" @action="handleAction" @back="goBack" />
    </template>
    <template #header>
      <aw-detail-header
        :code="record.code"
        :metas="headerMetas"
        :status-text="record.status"
        :status-tone="statusTone(record.status)"
        :title="record.subject"
      />
    </template>

    <section class="aw-card">
      <aw-detail-tabs v-model="activeTab" :tabs="detailTabs" />
      <template v-if="activeTab === 'info'">
        <div class="aw-detail-section-title">{{ detailInfoTitle }}</div>
        <aw-detail-info-grid :items="detailFields" />
      </template>
      <template v-else-if="activeTab === 'attach'">
        <div class="aw-detail-section-title">附件记录</div>
        <aw-attachment-table :rows="attachments" add-text="新增附件" @add="addAttachment" @remove="removeAttachment" />
      </template>
      <template v-else>
        <div class="aw-detail-section-title">{{ activeTabLabel }}</div>
        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl">
              <thead>
                <tr>
                  <th class="aw-index-col"><div class="aw-th-inner">序号</div></th>
                  <th v-for="column in tableColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!tableRows.length">
                  <td :colspan="tableColumns.length + 1" class="hr-empty-cell">暂无记录</td>
                </tr>
                <tr v-for="(row, rowIndex) in tableRows" :key="rowIndex">
                  <td>{{ rowIndex + 1 }}</td>
                  <td v-for="(cell, cellIndex) in row" :key="`${rowIndex}-${cellIndex}`">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
      <div v-if="message" class="aw-form-note hr-note">{{ message }}</div>
    </section>

    <aw-setting-modal :open="editModalOpen" :title="`修改${config.title}`" width="820px" @cancel="editModalOpen = false" @confirm="saveEditForm">
      <div class="aw-form-grid">
        <label v-for="field in editFields" :key="field.key" class="aw-field">
          <span>{{ field.label }}</span>
          <select v-if="field.key === 'status'" v-model="editForm[field.key]" class="aw-select">
            <option v-for="status in config.statuses" :key="status">{{ status }}</option>
          </select>
          <input v-else-if="field.type === 'date'" v-model="editForm[field.key]" class="aw-input" type="date" />
          <input v-else v-model="editForm[field.key]" class="aw-input" :placeholder="`请输入${field.label}`" />
        </label>
      </div>
    </aw-setting-modal>

    <aw-audit-action-modal
      :open="auditModalOpen"
      :title="employeeActionButtonLabel"
      :document="auditDocument"
      :actions="employeeActionAuditActions"
      :approval-nodes="employeeActionApprovalNodes"
      :person-depts="personDepts"
      :default-action="employeeActionDefaultAudit"
      :opinion-label="`${employeeActionButtonLabel}意见`"
      @cancel="auditModalOpen = false"
      @confirm="confirmEmployeeActionAudit"
    />
  </aw-detail-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { approveHrRecord, disableHrRecord, exportHrRecord, getHrPickerData, getHrRecord, listHrActionLogs, printHrRecord, submitHrRecord, updateHrRecord } from '@/app/api/hr/resources';
import type { HrActionResult, HrDetailTab, HrModuleConfig, HrRecord } from '@/app/api/hr/types';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import type { AuditActionOption, AuditActionPayload, AuditApprovalNode, AuditDocumentSummary, DetailAction } from '@/components/detail-page/types';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import type { AttachmentRow } from '@/components/form-page/types';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import { getHrActionProfile } from '../hrResource.config';

interface HrDetailRecord extends HrRecord {
  attachments?: AttachmentRow[];
  detailRows?: Record<string, string[][]>;
}

interface EditField {
  key: string;
  label: string;
  type?: 'date' | 'text';
}

const props = defineProps<{ config: HrModuleConfig; recordId?: string; actionLabel?: string }>();
const router = useRouter();
const activeTab = ref('info');
const message = ref('');
const actionLogs = ref<HrActionResult[]>([]);
const attachments = ref<AttachmentRow[]>([]);
const auditModalOpen = ref(false);
const editModalOpen = ref(false);
const editForm = reactive<Record<string, string>>({});
const record = ref<HrRecord>({
  id: '',
  code: '',
  subject: '',
  party: '',
  amount: '',
  done: '',
  left: '',
  date: '',
  status: '',
  group: '',
  owner: '',
});

const defaultDetailActions: DetailAction[] = [
  { key: 'edit', label: '修改' },
  { key: 'submit', label: '提交' },
  { key: 'approve', label: '审批' },
  { key: 'print', label: '打印' },
  { key: 'export', label: '导出' },
  { key: 'disable', label: '停用', danger: true },
];

const promotionAuditActions: AuditActionOption[] = [
  { key: 'approve', label: '审核通过', tone: 'primary', placeholder: '填写审核通过意见，说明确认依据或后续要求。' },
  { key: 'reject', label: '审核驳回', tone: 'danger', requireOpinion: true, placeholder: '请填写驳回原因和需要补充的内容。' },
  { key: 'return', label: '退回修改', tone: 'warning', requireOpinion: true, placeholder: '请填写需要补充的评估材料或修改要求。' },
  { key: 'transfer', label: '转交处理', requireOpinion: true, placeholder: '请填写转交原因和交接说明。' },
];
const departureAuditActions: AuditActionOption[] = [
  { key: 'approve', label: '审核通过', tone: 'primary', placeholder: '填写审核通过意见，说明确认依据或后续要求。' },
  { key: 'reject', label: '审核驳回', tone: 'danger', requireOpinion: true, placeholder: '请填写驳回原因和需要补充的内容。' },
  { key: 'return', label: '退回修改', tone: 'warning', requireOpinion: true, placeholder: '请填写需要补充的交接材料或修改要求。' },
  { key: 'transfer', label: '转交处理', requireOpinion: true, placeholder: '请填写转交原因和交接说明。' },
];

const employeeDetailColumns: Record<string, string[]> = {
  life: ['生命周期阶段', '计划日期', '完成日期', '负责人', '关键事项', '状态'],
  job: ['任职组织', '岗位/角色', '职级', '开始日期', '结束日期', '任职状态'],
  contract: ['合同/证照类型', '编号', '签署/签发日期', '到期日期', '保管位置', '提醒状态'],
  approve: ['审批节点', '审批人', '审批结果', '审批时间', '意见'],
  op: ['操作类型', '操作人', '操作时间', '操作内容', '结果'],
};

const detailRecord = computed(() => record.value as HrDetailRecord);
const isEmployeeDetail = computed(() => props.config.resource === 'hr-employees');
const sourceActionLabel = computed(() => props.actionLabel || '');
const isOrgDetail = computed(() => props.config.resource === 'hr-orgs');
const isPositionDetail = computed(() => props.config.resource === 'hr-positions');
const isAttendanceDetail = computed(() => props.config.resource === 'hr-attendance');
const isScheduleDetail = computed(() => props.config.resource === 'hr-schedules');
const isPayrollDetail = computed(() => props.config.resource === 'hr-payroll');
const isArchiveDetail = computed(() => props.config.resource === 'hr-archives');
const isOfficeDetail = computed(() => props.config.resource === 'hr-office');
const isPositionDescriptionDetail = computed(() => isPositionDetail.value && /岗位说明书|说明书/.test(sourceActionLabel.value));
const isPromotionDetail = computed(() => isEmployeeDetail.value && sourceActionLabel.value === '转正管理');
const isDepartureDetail = computed(() => isEmployeeDetail.value && sourceActionLabel.value === '离职管理');
const isEmployeeActionDetail = computed(() => isPromotionDetail.value || isDepartureDetail.value);
const backText = computed(() => (sourceActionLabel.value ? `返回${sourceActionLabel.value}` : `返回${props.config.title}`));
const positionDescriptionTabs: HrDetailTab[] = [
  { key: 'info', label: '岗位说明' },
  { key: 'responsibility', label: '岗位职责' },
  { key: 'qualification', label: '任职资格' },
  { key: 'headcount', label: '薪级编制' },
  { key: 'op', label: '操作记录' },
];
const detailTabs = computed(() => (isPositionDescriptionDetail.value ? positionDescriptionTabs : props.config.detailTabs));
const detailInfoTitle = computed(() => (isPositionDescriptionDetail.value ? '岗位说明书信息' : `${props.config.title}信息`));
const editFields = computed<EditField[]>(() => {
  if (isEmployeeDetail.value) {
    return [
      { key: 'subject', label: '员工姓名' },
      { key: 'party', label: '所属部门' },
      { key: 'amount', label: '岗位/职级' },
      { key: 'done', label: '手机号码' },
      { key: 'left', label: '直属上级' },
      { key: 'date', label: '入职日期', type: 'date' },
      { key: 'probationEndDate', label: '计划转正日', type: 'date' },
      { key: 'employeeType', label: '员工类型' },
      { key: 'contractType', label: '合同类型' },
      { key: 'officeLocation', label: '办公地点' },
      { key: 'email', label: '邮箱' },
      { key: 'status', label: '员工状态' },
    ];
  }
  if (isOrgDetail.value) {
    return [
      { key: 'subject', label: '组织名称' },
      { key: 'party', label: '上级组织' },
      { key: 'orgType', label: '组织类型' },
      { key: 'owner', label: '负责人' },
      { key: 'done', label: '编制人数' },
      { key: 'left', label: '在岗人数' },
      { key: 'costCenter', label: '成本中心' },
      { key: 'officeLocation', label: '办公地点' },
      { key: 'date', label: '创建日期', type: 'date' },
      { key: 'status', label: '组织状态' },
    ];
  }
  if (isPositionDetail.value) {
    return [
      { key: 'subject', label: '岗位名称' },
      { key: 'party', label: '所属组织' },
      { key: 'group', label: '岗位序列' },
      { key: 'positionType', label: '岗位类型' },
      { key: 'amount', label: '岗位等级' },
      { key: 'directSupervisor', label: '直接上级' },
      { key: 'done', label: '岗位编制' },
      { key: 'left', label: '在岗人数' },
      { key: 'salaryRange', label: '薪级范围' },
      { key: 'date', label: '生效日期', type: 'date' },
      { key: 'status', label: '岗位状态' },
    ];
  }
  if (isAttendanceDetail.value) {
    return [
      { key: 'subject', label: '考勤主题' },
      { key: 'party', label: '考勤人员' },
      { key: 'amount', label: '考勤结果' },
      { key: 'done', label: '上班打卡' },
      { key: 'left', label: '下班打卡' },
      { key: 'date', label: '考勤日期', type: 'date' },
      { key: 'owner', label: '处理人' },
      { key: 'status', label: '处理状态' },
    ];
  }
  if (isScheduleDetail.value) {
    return [
      { key: 'subject', label: '排班主题' },
      { key: 'party', label: '考勤组' },
      { key: 'amount', label: '班次' },
      { key: 'done', label: '适用人数' },
      { key: 'left', label: '休息规则' },
      { key: 'date', label: '排班日期', type: 'date' },
      { key: 'owner', label: '负责人' },
      { key: 'status', label: '排班状态' },
    ];
  }
  if (isPayrollDetail.value) {
    return [
      { key: 'subject', label: '员工姓名' },
      { key: 'party', label: '所属部门' },
      { key: 'position', label: '岗位/职级' },
      { key: 'scheme', label: '薪资方案' },
      { key: 'amount', label: '应发工资' },
      { key: 'done', label: '扣款合计' },
      { key: 'left', label: '实发工资' },
      { key: 'bankAccount', label: '发薪账户' },
      { key: 'date', label: '薪资月份' },
      { key: 'status', label: '核算状态' },
    ];
  }
  if (isArchiveDetail.value) {
    return [
      { key: 'subject', label: '档案名称' },
      { key: 'party', label: '归属主体' },
      { key: 'amount', label: '档案类型' },
      { key: 'archiveNo', label: '证件/合同编号' },
      { key: 'done', label: '形成日期', type: 'date' },
      { key: 'left', label: '到期/复核日期' },
      { key: 'storage', label: '保管位置' },
      { key: 'confidentiality', label: '密级' },
      { key: 'borrowState', label: '借阅状态' },
      { key: 'reminderRule', label: '提醒规则' },
      { key: 'date', label: '归档日期', type: 'date' },
      { key: 'owner', label: '经办人' },
      { key: 'status', label: '档案状态' },
    ];
  }
  if (isOfficeDetail.value) {
    return [
      { key: 'subject', label: '申请主题' },
      { key: 'party', label: '申请人' },
      { key: 'amount', label: '事项类型' },
      { key: 'done', label: '所属部门' },
      { key: 'left', label: '经办人' },
      { key: 'purpose', label: '用途说明' },
      { key: 'priority', label: '优先级' },
      { key: 'currentNode', label: '当前节点' },
      { key: 'timeLimit', label: '办理时限' },
      { key: 'expectedFinishDate', label: '期望完成日期', type: 'date' },
      { key: 'date', label: '申请日期', type: 'date' },
      { key: 'status', label: '审批状态' },
    ];
  }
  return [
    { key: 'subject', label: props.config.subjectLabel },
    { key: 'party', label: props.config.partyLabel },
    { key: 'amount', label: props.config.amountLabel },
    { key: 'date', label: props.config.dateLabel, type: 'date' },
    { key: 'status', label: props.config.statusLabel },
  ];
});
const personDepts = computed(() => getHrPickerData().people);
const employeeActionButtonLabel = computed(() => (isDepartureDetail.value ? '离职确认' : '转正审核'));
const employeeActionDefaultAudit = computed(() => 'approve');
const employeeActionAuditActions = computed(() => (isDepartureDetail.value ? departureAuditActions : promotionAuditActions));
const employeeActionApprovalNodes = computed<AuditApprovalNode[]>(() => (
  isDepartureDetail.value ? departureApprovalNodes.value : promotionApprovalNodes.value
));
const payrollFinanceState = computed(() => {
  const finance = detailRecord.value.detailRows?.finance?.[0];
  return finance?.[5] || (record.value.status === '已发放' ? '已付款' : record.value.status === '待发放' ? '待生成付款单' : '核算校验中');
});
const attendanceDepartment = computed(() => {
  const person = textValue(record.value.party, '');
  if (person.includes('张园') || person.includes('陈佳')) return '销售部';
  if (person.includes('李文涛')) return '研发部';
  return extraText('department', '-');
});
const attendanceShift = computed(() => textValue(detailRecord.value.shiftName, textValue(record.value.amount) === '正常' ? '标准班' : '标准班'));
const attendanceLockState = computed(() => ['已处理', '已归档'].includes(textValue(record.value.status, '')) ? '已锁定' : '未锁定');
const attendancePayrollSync = computed(() => attendanceLockState.value === '已锁定' ? '可同步薪酬' : '待处理后同步');
const scheduleDepartment = computed(() => {
  const group = textValue(record.value.party, '');
  if (group.includes('销售')) return '销售部';
  if (group.includes('客服')) return '客服部';
  if (group.includes('仓储')) return '仓储部';
  return '全部组织';
});
const scheduleWorkTime = computed(() => {
  const shift = textValue(record.value.amount, '');
  if (shift.includes('值班')) return '10:00-19:00';
  if (shift.includes('早晚')) return '08:00-16:00 / 16:00-24:00';
  return '09:00-18:00';
});
const schedulePeriod = computed(() => textValue(record.value.subject, '').includes('六月') ? '2026-06' : '按月');
const scheduleConflictCount = computed(() => textValue(record.value.status, '') === '草稿' ? '1' : '0');
const archiveConfidentiality = computed(() => extraText('confidentiality', textValue(record.value.amount).includes('公司合同') ? '受限' : '普通'));
const archiveBorrowState = computed(() => {
  const stored = extraText('borrowState', '');
  if (stored) return stored;
  const status = textValue(record.value.status, '');
  if (status.includes('过期')) return '冻结借阅';
  if (status.includes('到期')) return '复核中';
  return '可借阅';
});
const officePriority = computed(() => extraText('priority', textValue(record.value.status) === '审批中' ? '高' : '普通'));
const officeCurrentNode = computed(() => {
  const stored = extraText('currentNode', '');
  if (stored) return stored;
  const status = textValue(record.value.status, '');
  if (status === '草稿') return '申请人草稿';
  if (status === '审批中') return '部门负责人审批';
  if (status === '已通过') return '行政办理';
  if (status === '驳回') return '退回补充';
  return '人力行政受理';
});
const officeTimeLimit = computed(() => extraText('timeLimit', textValue(record.value.amount).includes('证明') ? '2个工作日' : '3个工作日'));
const officeExpectedFinishDate = computed(() => extraText('expectedFinishDate', deriveDateOffset(textValue(record.value.date), 3)));
const auditDocument = computed<AuditDocumentSummary>(() => ({
  title: `${textValue(record.value.subject, '员工')}${employeeActionButtonLabel.value}`,
  code: textValue(record.value.code),
  status: textValue(record.value.status),
  applicant: textValue(record.value.subject),
  flowName: isDepartureDetail.value ? '员工离职确认流程' : '员工转正审批流程',
  currentNode: employeeActionCurrentNode.value,
}));
const employeeActionCurrentNode = computed(() => {
  const status = textValue(record.value.status, '');
  if (isDepartureDetail.value) {
    if (status === '离职' || status === '已离职') return '离职已完成';
    if (status === '待交接' || status === '交接中') return '离职交接确认';
    if (status === '驳回') return '退回补充交接材料';
    return '人力离职确认';
  }
  if (status === '已转正') return '转正已完成';
  if (status === '延期转正') return '转正延期确认';
  if (status === '驳回') return '退回补充资料';
  return '部门负责人评估';
});
const promotionApprovalNodes = computed<AuditApprovalNode[]>(() => {
  const status = textValue(record.value.status, '');
  const completed = status === '已转正';
  const delayed = status === '延期转正';
  const returned = status === '待评估' || status === '驳回';
  return [
    {
      name: '资料提交',
      approver: textValue(record.value.owner, '王人事'),
      method: '顺签',
      state: 'done',
      result: '已提交',
      time: textValue(record.value.date),
      opinion: '员工档案、试用期目标和岗位信息已提交。',
    },
    {
      name: '直属上级评估',
      approver: textValue(record.value.left, '直属上级'),
      method: '顺签',
      state: completed || delayed ? 'done' : returned ? 'rejected' : 'current',
      result: completed ? '评估通过' : delayed ? '建议延期' : returned ? '退回补充' : '待处理',
    },
    {
      name: '人力中心复核',
      approver: textValue(record.value.owner, '王人事'),
      method: '或签',
      state: completed ? 'done' : delayed ? 'current' : 'pending',
      result: completed ? '已复核' : delayed ? '延期确认中' : '待审核',
    },
    {
      name: '状态归档',
      approver: '系统',
      method: '自动',
      state: completed ? 'done' : 'pending',
      result: completed ? '已转正' : '待归档',
    },
  ];
});
const departureApprovalNodes = computed<AuditApprovalNode[]>(() => {
  const status = textValue(record.value.status, '');
  const completed = status === '离职' || status === '已离职';
  const returned = status === '待交接' || status === '驳回';
  return [
    {
      name: '离职申请',
      approver: textValue(record.value.subject, '员工'),
      method: '提交',
      state: 'done',
      result: '已提交',
      time: textValue(record.value.date),
      opinion: '离职事项已进入确认流程。',
    },
    {
      name: '工作交接',
      approver: textValue(record.value.left, '直属上级'),
      method: '顺签',
      state: returned ? 'current' : 'done',
      result: returned ? '待补充' : '交接完成',
    },
    {
      name: '人力离职确认',
      approver: textValue(record.value.owner, '王人事'),
      method: '或签',
      state: completed ? 'done' : returned ? 'pending' : 'current',
      result: completed ? '已确认' : returned ? '待交接完成' : '待处理',
    },
    {
      name: '账号权限关闭',
      approver: '系统',
      method: '自动',
      state: completed ? 'done' : 'pending',
      result: completed ? '已关闭' : '待执行',
    },
  ];
});

const headerMetas = computed(() => {
  if (isEmployeeDetail.value) {
    return [
      { label: '所属部门', value: textValue(record.value.party) },
      { label: '岗位/职级', value: textValue(record.value.amount) },
      { label: '入职日期', value: textValue(record.value.date) },
      { label: '负责人', value: textValue(record.value.owner) },
    ];
  }
  if (isPositionDescriptionDetail.value) {
    return [
      { label: '所属组织', value: textValue(record.value.party) },
      { label: '岗位等级', value: textValue(record.value.amount) },
      { label: '版本号', value: extraText('version') },
      { label: '生效日期', value: textValue(record.value.date) },
    ];
  }
  if (isOrgDetail.value) {
    return [
      { label: '上级部门', value: textValue(record.value.party) },
      { label: '负责人', value: textValue(record.value.owner) },
      { label: '编制人数', value: textValue(record.value.done) },
      { label: '在岗人数', value: textValue(record.value.left) },
    ];
  }
  if (isPositionDetail.value) {
    return [
      { label: '所属组织', value: textValue(record.value.party) },
      { label: '岗位等级', value: textValue(record.value.amount) },
      { label: '岗位序列', value: textValue(record.value.group) },
      { label: '在岗/编制', value: `${textValue(record.value.left)} / ${textValue(record.value.done)}` },
    ];
  }
  if (isAttendanceDetail.value) {
    return [
      { label: '考勤人员', value: textValue(record.value.party) },
      { label: '考勤结果', value: textValue(record.value.amount) },
      { label: '打卡时间', value: `${textValue(record.value.done)} / ${textValue(record.value.left)}` },
      { label: '处理人', value: textValue(record.value.owner) },
    ];
  }
  if (isScheduleDetail.value) {
    return [
      { label: '考勤组', value: textValue(record.value.party) },
      { label: '班次', value: textValue(record.value.amount) },
      { label: '适用人数', value: textValue(record.value.done) },
      { label: '休息规则', value: textValue(record.value.left) },
    ];
  }
  if (isPayrollDetail.value) {
    return [
      { label: '所属部门', value: textValue(record.value.party) },
      { label: '薪资方案', value: extraText('scheme') },
      { label: '实发工资', value: textValue(record.value.left) },
      { label: '财务状态', value: payrollFinanceState.value },
    ];
  }
  if (isArchiveDetail.value) {
    return [
      { label: '归属主体', value: textValue(record.value.party) },
      { label: '档案类型', value: textValue(record.value.amount) },
      { label: '到期/复核日期', value: textValue(record.value.left) },
      { label: '保管位置', value: extraText('storage') },
    ];
  }
  if (isOfficeDetail.value) {
    return [
      { label: '申请人', value: textValue(record.value.party) },
      { label: '事项类型', value: textValue(record.value.amount) },
      { label: '当前节点', value: officeCurrentNode.value },
      { label: '经办人', value: textValue(record.value.left, textValue(record.value.owner)) },
    ];
  }
  return [
    { label: props.config.partyLabel, value: textValue(record.value.party) },
    { label: props.config.amountLabel, value: textValue(record.value.amount) },
    { label: props.config.dateLabel, value: textValue(record.value.date) },
    { label: '负责人', value: textValue(record.value.owner) },
  ];
});

const detailFields = computed(() => {
  if (isEmployeeDetail.value) {
    return [
      { label: '员工姓名', value: textValue(record.value.subject) },
      { label: '员工编号', value: textValue(record.value.code) },
      { label: '所属部门', value: textValue(record.value.party) },
      { label: '岗位/职级', value: textValue(record.value.amount) },
      { label: '手机号码', value: textValue(record.value.done) },
      { label: '直属上级', value: textValue(record.value.left) },
      { label: '入职日期', value: textValue(record.value.date) },
      { label: '计划转正日期', value: extraText('probationEndDate') },
      { label: '员工类型', value: extraText('employeeType') },
      { label: '合同类型', value: extraText('contractType') },
      { label: '办公地点', value: extraText('officeLocation') },
      { label: '证件类型', value: extraText('idType') },
      { label: '证件号码', value: extraText('idNo') },
      { label: '紧急联系人', value: extraText('emergencyContact') },
      { label: '邮箱', value: extraText('email') },
      { label: '员工状态', value: textValue(record.value.status) },
    ];
  }
  if (isPositionDescriptionDetail.value) {
    return [
      { label: '岗位名称', value: textValue(record.value.subject) },
      { label: '岗位编号', value: textValue(record.value.code) },
      { label: '所属组织', value: textValue(record.value.party) },
      { label: '岗位等级', value: textValue(record.value.amount) },
      { label: '直接上级', value: extraText('directSupervisor') },
      { label: '职责摘要', value: extraText('responsibilitySummary') },
      { label: '任职资格', value: extraText('qualification') },
      { label: '薪级范围', value: extraText('salaryRange') },
      { label: '版本号', value: extraText('version') },
      { label: '生效日期', value: textValue(record.value.date) },
      { label: '复审周期', value: extraText('reviewCycle') },
      { label: '说明书状态', value: textValue(record.value.status) },
    ];
  }
  if (isOrgDetail.value) {
    return [
      { label: '组织名称', value: textValue(record.value.subject) },
      { label: '组织编号', value: textValue(record.value.code) },
      { label: '上级部门', value: textValue(record.value.party) },
      { label: '组织类型', value: extraText('orgType') },
      { label: '负责人', value: textValue(record.value.owner) },
      { label: '联系电话', value: extraText('contactPhone') },
      { label: '办公地点', value: extraText('officeLocation') },
      { label: '成本中心', value: extraText('costCenter') },
      { label: '业务范围', value: extraText('businessScope') },
      { label: '预算负责人', value: extraText('budgetOwner') },
      { label: '编制人数', value: textValue(record.value.done) },
      { label: '在岗人数', value: textValue(record.value.left) },
      { label: '创建日期', value: textValue(record.value.date) },
      { label: '组织状态', value: textValue(record.value.status) },
    ];
  }
  if (isPositionDetail.value) {
    return [
      { label: '岗位名称', value: textValue(record.value.subject) },
      { label: '岗位编号', value: textValue(record.value.code) },
      { label: '所属组织', value: textValue(record.value.party) },
      { label: '岗位序列', value: textValue(record.value.group) },
      { label: '岗位类型', value: extraText('positionType') },
      { label: '岗位等级', value: textValue(record.value.amount) },
      { label: '直接上级', value: extraText('directSupervisor') },
      { label: '岗位编制', value: textValue(record.value.done) },
      { label: '在岗人数', value: textValue(record.value.left) },
      { label: '薪级范围', value: extraText('salaryRange') },
      { label: '任职资格', value: extraText('qualification') },
      { label: '职责摘要', value: extraText('responsibilitySummary') },
      { label: '复审周期', value: extraText('reviewCycle') },
      { label: '生效日期', value: textValue(record.value.date) },
      { label: '岗位状态', value: textValue(record.value.status) },
    ];
  }
  if (isAttendanceDetail.value) {
    return [
      { label: '考勤主题', value: textValue(record.value.subject) },
      { label: '考勤单号', value: textValue(record.value.code) },
      { label: '考勤人员', value: textValue(record.value.party) },
      { label: '所属部门', value: attendanceDepartment.value },
      { label: '班次', value: attendanceShift.value },
      { label: '考勤结果', value: textValue(record.value.amount) },
      { label: '上班打卡', value: textValue(record.value.done) },
      { label: '下班打卡', value: textValue(record.value.left) },
      { label: '考勤日期', value: textValue(record.value.date) },
      { label: '锁定状态', value: attendanceLockState.value },
      { label: '薪酬同步', value: attendancePayrollSync.value },
      { label: '处理状态', value: textValue(record.value.status) },
    ];
  }
  if (isScheduleDetail.value) {
    return [
      { label: '排班主题', value: textValue(record.value.subject) },
      { label: '排班编号', value: textValue(record.value.code) },
      { label: '考勤组', value: textValue(record.value.party) },
      { label: '适用组织', value: scheduleDepartment.value },
      { label: '适用人数', value: textValue(record.value.done) },
      { label: '班次', value: textValue(record.value.amount) },
      { label: '工作时段', value: scheduleWorkTime.value },
      { label: '休息规则', value: textValue(record.value.left) },
      { label: '排班周期', value: schedulePeriod.value },
      { label: '冲突数', value: scheduleConflictCount.value },
      { label: '排班日期', value: textValue(record.value.date) },
      { label: '排班状态', value: textValue(record.value.status) },
    ];
  }
  if (isPayrollDetail.value) {
    return [
      { label: '员工姓名', value: textValue(record.value.subject) },
      { label: '员工编号', value: textValue(record.value.code) },
      { label: '工资单号', value: extraText('payrollNo') },
      { label: '所属部门', value: textValue(record.value.party) },
      { label: '岗位/职级', value: extraText('position') },
      { label: '薪资方案', value: extraText('scheme') },
      { label: '应发工资', value: textValue(record.value.amount) },
      { label: '扣款合计', value: textValue(record.value.done) },
      { label: '实发工资', value: textValue(record.value.left) },
      { label: '社保', value: extraText('socialSecurity') },
      { label: '公积金', value: extraText('housingFund') },
      { label: '个税', value: extraText('incomeTax') },
      { label: '发薪账户', value: extraText('bankAccount') },
      { label: '薪资月份', value: textValue(record.value.date) },
      { label: '核算状态', value: textValue(record.value.status) },
    ];
  }
  if (isArchiveDetail.value) {
    return [
      { label: '档案名称', value: textValue(record.value.subject) },
      { label: '档案编号', value: textValue(record.value.code) },
      { label: '归属主体', value: textValue(record.value.party) },
      { label: '档案类型', value: textValue(record.value.amount) },
      { label: '证件/合同编号', value: extraText('archiveNo') },
      { label: '形成日期', value: textValue(record.value.done) },
      { label: '到期/复核日期', value: textValue(record.value.left) },
      { label: '保管位置', value: extraText('storage') },
      { label: '密级', value: archiveConfidentiality.value },
      { label: '借阅状态', value: archiveBorrowState.value },
      { label: '提醒规则', value: extraText('reminderRule') },
      { label: '归档日期', value: textValue(record.value.date) },
      { label: '经办人', value: textValue(record.value.owner) },
      { label: '档案状态', value: textValue(record.value.status) },
    ];
  }
  if (isOfficeDetail.value) {
    return [
      { label: '申请主题', value: textValue(record.value.subject) },
      { label: '申请单号', value: textValue(record.value.code) },
      { label: '申请人', value: textValue(record.value.party) },
      { label: '事项类型', value: textValue(record.value.amount) },
      { label: '所属部门', value: textValue(record.value.done) },
      { label: '经办人', value: textValue(record.value.left, textValue(record.value.owner)) },
      { label: '用途说明', value: extraText('purpose', `${textValue(record.value.amount)}办理`) },
      { label: '优先级', value: officePriority.value },
      { label: '当前节点', value: officeCurrentNode.value },
      { label: '办理时限', value: officeTimeLimit.value },
      { label: '期望完成日期', value: officeExpectedFinishDate.value },
      { label: '申请日期', value: textValue(record.value.date) },
      { label: '审批状态', value: textValue(record.value.status) },
    ];
  }
  return [
    { label: props.config.subjectLabel, value: textValue(record.value.subject) },
    { label: props.config.codeLabel, value: textValue(record.value.code) },
    { label: props.config.partyLabel, value: textValue(record.value.party) },
    { label: props.config.amountLabel, value: textValue(record.value.amount) },
    { label: props.config.dateLabel, value: textValue(record.value.date) },
    { label: props.config.statusLabel, value: textValue(record.value.status) },
    { label: '完成值', value: textValue(record.value.done) },
    { label: '剩余值', value: textValue(record.value.left) },
  ];
});

const activeTabLabel = computed(() => detailTabs.value.find((tab) => tab.key === activeTab.value)?.label || '');

const tableColumns = computed(() => {
  if (isEmployeeDetail.value && employeeDetailColumns[activeTab.value]) return employeeDetailColumns[activeTab.value];
  if (isEmployeeDetail.value && activeTab.value === 'payrollSocial') return ['薪资方案', '薪级范围', '社保方案', '公积金方案', '银行卡状态', '最近同步'];
  if (isEmployeeDetail.value && activeTab.value === 'trainingPerformance') return ['项目名称', '项目类型', '负责人', '周期', '结果', '备注'];
  if (isEmployeeDetail.value && activeTab.value === 'assetAccount') return ['资产/账号', '编号', '发放日期', '责任人', '状态', '备注'];
  if (isPositionDescriptionDetail.value) {
    if (activeTab.value === 'responsibility') return ['职责项', '职责说明', '关键指标', '权重', '考核周期', '状态'];
    if (activeTab.value === 'qualification') return ['资格项', '要求说明', '必填', '评估方式', '备注'];
    if (activeTab.value === 'headcount') return ['岗位等级', '核定编制', '在岗人数', '薪级范围', '汇报对象', '生效日期'];
  }
  if (isOrgDetail.value) {
    if (activeTab.value === 'chart') return ['层级', '组织节点', '负责人', '编制人数', '在岗人数', '状态'];
    if (activeTab.value === 'headcount') return ['组织/岗位', '核定编制', '在岗人数', '空缺人数', '超编人数', '生效日期'];
    if (activeTab.value === 'job') return ['员工姓名', '员工编号', '岗位/角色', '职级', '入职日期', '任职状态'];
    if (activeTab.value === 'position') return ['岗位名称', '岗位编号', '岗位等级', '核定编制', '在岗人数', '空缺人数'];
    if (activeTab.value === 'permission') return ['权限范围', '继承来源', '负责人', '适用人数', '生效日期', '状态'];
    if (activeTab.value === 'record') return ['变更事项', '变更前', '变更后', '处理人', '生效日期', '备注'];
  }
  if (isPositionDetail.value) {
    if (activeTab.value === 'responsibility') return ['职责项', '职责说明', '关键指标', '权重', '考核周期', '状态'];
    if (activeTab.value === 'qualification') return ['资格项', '要求说明', '必填', '评估方式', '备注'];
    if (activeTab.value === 'headcount') return ['岗位名称', '核定编制', '在岗人数', '空缺人数', '占用率', '生效日期'];
    if (activeTab.value === 'job') return ['员工姓名', '员工编号', '所属组织', '职级', '入岗日期', '任职状态'];
    if (activeTab.value === 'salary') return ['岗位等级', '薪级范围', '社保基数口径', '绩效适用', '生效日期', '状态'];
    if (activeTab.value === 'version') return ['版本号', '变更事项', '处理人', '发布时间', '生效日期', '状态'];
  }
  if (isArchiveDetail.value) {
    if (activeTab.value === 'contract') return ['档案类型', '证件/合同编号', '归属主体', '形成日期', '到期/复核日期', '保管位置'];
    if (activeTab.value === 'life') return ['节点', '计划日期', '完成日期', '负责人', '提醒规则', '状态'];
    if (activeTab.value === 'borrow') return ['借阅单号', '借阅人', '借阅用途', '借出日期', '归还日期', '状态'];
    if (activeTab.value === 'version') return ['版本号', '变更事项', '上传人', '上传时间', '文件状态', '备注'];
    if (activeTab.value === 'permission') return ['权限对象', '权限类型', '授权人', '授权时间', '有效期', '状态'];
  }
  if (isOfficeDetail.value) {
    if (activeTab.value === 'approve') return ['审批节点', '审批人', '审批结果', '审批时间', '意见'];
    if (activeTab.value === 'record') return ['办理动作', '处理人', '处理结果', '处理时间', '备注'];
    if (activeTab.value === 'process') return ['流程节点', '处理人', '处理方式', '到达时间', '完成时间', '状态'];
    if (activeTab.value === 'related') return ['事项类型', '单据编号', '事项名称', '关联对象', '发生日期', '状态'];
  }
  if (activeTab.value === 'approve') return ['审批节点', '审批人', '审批结果', '审批时间', '意见'];
  if (activeTab.value === 'op') return ['操作类型', '操作人', '操作时间', '操作内容', '结果'];
  if (activeTab.value === 'life') return ['生命周期阶段', '计划日期', '完成日期', '负责人', '关键事项', '状态'];
  if (activeTab.value === 'job') return ['任职组织', '岗位/角色', '职级', '开始日期', '结束日期', '任职状态'];
  if (activeTab.value === 'contract') return ['合同/证照类型', '编号', '签署/签发日期', '到期日期', '保管位置', '提醒状态'];
  if (activeTab.value === 'headcount') return ['组织/岗位', '核定编制', '在岗人数', '空缺人数', '超编人数', '生效日期'];
  if (activeTab.value === 'attendance') return ['统计周期', '出勤天数', '迟到早退', '请假小时', '加班小时', '异常次数'];
  if (activeTab.value === 'rawPunch') return ['打卡来源', '打卡时间', '打卡地点', '设备/方式', '原始状态', '备注'];
  if (activeTab.value === 'rule') return ['规则项', '规则说明', '判定结果', '影响时长', '处理方式', '状态'];
  if (activeTab.value === 'leaveOvertime') return ['单据类型', '单据编号', '开始时间', '结束时间', '时长', '审批状态'];
  if (activeTab.value === 'payrollImpact') return ['影响项目', '影响口径', '金额/时长', '薪资月份', '同步批次', '状态'];
  if (activeTab.value === 'people') return ['员工姓名', '员工编号', '所属部门', '岗位', '班次', '排班状态'];
  if (activeTab.value === 'shiftRule') return ['班次名称', '工作时间', '允许迟到', '休息规则', '打卡方式', '状态'];
  if (activeTab.value === 'change') return ['申请类型', '员工姓名', '原班次', '目标班次', '生效日期', '审批状态'];
  if (activeTab.value === 'conflict') return ['冲突类型', '员工/班次', '冲突说明', '影响日期', '处理建议', '状态'];
  if (activeTab.value === 'publish') return ['发布批次', '发布范围', '发布人', '发布时间', '确认人数', '发布状态'];
  if (activeTab.value === 'payroll') return ['员工姓名', '基本工资', '绩效补贴', '社保公积金', '个税', '实发工资'];
  if (activeTab.value === 'attendanceSource') return ['来源类型', '来源单号', '项目', '影响值', '薪资月份', '状态'];
  if (activeTab.value === 'socialTax') return ['项目', '缴费/计税基数', '个人部分', '公司部分', '规则来源', '状态'];
  if (activeTab.value === 'adjustment') return ['调整类型', '调整金额', '原因', '处理人', '处理时间', '状态'];
  if (activeTab.value === 'payslip') return ['工资条编号', '接收人', '发送方式', '发送时间', '确认时间', '状态'];
  if (activeTab.value === 'finance') return ['付款单号', '收款员工数', '应付工资', '付款账户', '同步财务时间', '财务状态'];
  if (activeTab.value === 'record') return ['记录类型', '处理人', '处理结果', '处理时间', '备注'];
  return props.config.detailColumns;
});

const operationRows = computed(() => {
  const apiRows = actionLogs.value.map((log) => [
    actionLabel(log.action),
    textValue(record.value.owner, '系统'),
    log.operatedAt,
    log.message,
    log.status || '已生成',
  ]);
  return [...apiRows, ...getRecordTableRows('op')];
});

const tableRows = computed(() => {
  if (activeTab.value === 'op') return operationRows.value;
  const specialRows = specialRowsForTab(activeTab.value);
  if (specialRows.length) return specialRows;
  const rows = getRecordTableRows(activeTab.value);
  if (rows.length) return rows;
  if (isEmployeeDetail.value) return [];
  return [
    tableColumns.value.map((column, index) => fallbackCell(column, index)),
    tableColumns.value.map((column, index) => fallbackCell(column, index + 1)),
  ];
});

function specialRowsForTab(tabKey: string) {
  if (isEmployeeDetail.value && tabKey === 'payrollSocial') {
    return [
      ['标准薪资方案', extraText('salaryRange', '按岗位薪级'), '海口社保方案', '海口公积金方案', '已核验', '2026-05-30'],
      ['工资条权限', '仅本人/人力可见', '参保状态已同步', '缴存基数待月结', '正常', '2026-05-30'],
    ];
  }
  if (isEmployeeDetail.value && tabKey === 'trainingPerformance') {
    return [
      ['新员工训练营', '培训', textValue(record.value.owner, '王人事'), '2026-05', '已完成', '入职必修课程'],
      ['试用期目标评估', '绩效', textValue(record.value.left, '直属上级'), extraText('probationEndDate', textValue(record.value.date)), textValue(record.value.status), '转正前复核'],
    ];
  }
  if (isEmployeeDetail.value && tabKey === 'assetAccount') {
    return [
      ['ERP账号', textValue(record.value.code), textValue(record.value.date), '系统', textValue(record.value.status), '随组织岗位同步权限'],
      ['办公设备', `ASSET-${textValue(record.value.code).replace(/\D/g, '').slice(-4) || '0001'}`, textValue(record.value.date), textValue(record.value.owner), '已发放', '离职时进入交接清单'],
    ];
  }
  if (isOrgDetail.value && tabKey === 'chart') {
    return [
      ['上级', textValue(record.value.party), textValue(record.value.owner), textValue(record.value.done), textValue(record.value.left), '启用'],
      ['当前', textValue(record.value.subject), textValue(record.value.owner), textValue(record.value.done), textValue(record.value.left), textValue(record.value.status)],
    ];
  }
  if (isOrgDetail.value && tabKey === 'position') {
    return [
      ['销售经理', 'POS-202605-001', 'P6', '12', '9', '3'],
      ['高级前端工程师', 'POS-202605-018', 'P7', '6', '5', '1'],
    ].filter((row) => textValue(record.value.subject).includes('销售') ? row[0].includes('销售') : true);
  }
  if (isOrgDetail.value && tabKey === 'permission') {
    return [
      ['本部门员工档案', textValue(record.value.party), textValue(record.value.owner), textValue(record.value.left), textValue(record.value.date), textValue(record.value.status)],
      ['组织下级数据', textValue(record.value.subject), '人力中心', textValue(record.value.done), textValue(record.value.date), '已继承'],
    ];
  }
  if (isPositionDetail.value && tabKey === 'responsibility') {
    return [
      ['核心职责', extraText('responsibilitySummary'), '目标达成率', '40%', '月度', textValue(record.value.status)],
      ['协同职责', `对接${textValue(record.value.party)}内组织、人员和流程`, '协同满意度', '25%', '季度', textValue(record.value.status)],
      ['规范沉淀', '维护岗位说明书、任职资格和交接清单', '资料完整率', '20%', '季度', textValue(record.value.status)],
    ];
  }
  if (isPositionDetail.value && tabKey === 'qualification') {
    return [
      ['经验要求', extraText('qualification'), '是', '面试 + 试用期评估', '与岗位等级匹配'],
      ['协同能力', `能在${textValue(record.value.party)}内完成跨角色协作`, '是', '主管评价', '关注流程执行'],
      ['复审要求', extraText('reviewCycle'), '否', '定期复审', '岗位发布后自动提醒'],
    ];
  }
  if (isPositionDetail.value && tabKey === 'salary') {
    return [
      [textValue(record.value.amount), extraText('salaryRange'), '按城市社保方案', '适用', textValue(record.value.date), textValue(record.value.status)],
    ];
  }
  if (isPositionDetail.value && tabKey === 'version') {
    return [
      ['V1.0', '岗位创建', textValue(record.value.owner), textValue(record.value.date), textValue(record.value.date), '已发布'],
      ['V1.1', '补充职责与任职资格', textValue(record.value.owner), '2026-05-30', '2026-06-01', textValue(record.value.status)],
    ];
  }
  if (isAttendanceDetail.value && tabKey === 'attendance') {
    return [
      ['2026-05', '16天', textValue(record.value.amount) === '迟到' ? '1次' : '0次', '0小时', '6小时', textValue(record.value.amount) === '正常' ? '0次' : '1次'],
      ['本周', '5天', textValue(record.value.amount) === '迟到' ? '1次' : '0次', '0小时', '2小时', '0次'],
    ];
  }
  if (isAttendanceDetail.value && tabKey === 'rawPunch') {
    return [
      ['考勤机', `${textValue(record.value.date)} ${textValue(record.value.done)}`, '海口总部闸机A', '指纹', textValue(record.value.amount), '上班打卡'],
      ['考勤机', `${textValue(record.value.date)} ${textValue(record.value.left)}`, '海口总部闸机A', '指纹', '正常', '下班打卡'],
    ];
  }
  if (isAttendanceDetail.value && tabKey === 'rule') {
    return [
      ['标准班规则', '09:00 后打卡计迟到', textValue(record.value.amount), textValue(record.value.amount) === '迟到' ? '35分钟' : '0分钟', textValue(record.value.amount) === '正常' ? '无需处理' : '异常处理/补卡', textValue(record.value.status)],
      ['月度锁定规则', '异常处理完成后才允许同步薪酬', attendancePayrollSync.value, '-', '月结前复核', attendanceLockState.value],
    ];
  }
  if (isAttendanceDetail.value && tabKey === 'leaveOvertime') {
    return [
      ['加班单', 'OT-202605-001', `${textValue(record.value.date)} 19:00`, `${textValue(record.value.date)} 21:00`, '2小时', '审批中'],
      ['请假单', 'LV-202605-018', `${textValue(record.value.date)} 09:00`, `${textValue(record.value.date)} 18:00`, '8小时', textValue(record.value.party).includes('李文涛') ? '已通过' : '无'],
    ];
  }
  if (isAttendanceDetail.value && tabKey === 'payrollImpact') {
    return [
      ['考勤扣款', '迟到/缺卡按规则扣减', textValue(record.value.amount) === '正常' ? '0.00' : '120.00', '2026-05', 'PAY-202605-001', attendancePayrollSync.value],
      ['加班调休', '审批通过后进入调休余额', '2小时', '2026-05', '待同步', '待确认'],
    ];
  }
  if (isScheduleDetail.value && tabKey === 'attendance') {
    return [
      ['2026-06-03', textValue(record.value.amount), scheduleWorkTime.value, textValue(record.value.done), textValue(record.value.left), textValue(record.value.status)],
      ['2026-06-04', textValue(record.value.amount), scheduleWorkTime.value, textValue(record.value.done), textValue(record.value.left), textValue(record.value.status)],
    ];
  }
  if (isScheduleDetail.value && tabKey === 'record') {
    return [
      ['张园', 'EMP-202605-001', scheduleDepartment.value, '销售经理 / P6', textValue(record.value.amount), textValue(record.value.status)],
      ['陈佳', 'EMP-202605-021', scheduleDepartment.value, '销售专员 / P4', textValue(record.value.amount), textValue(record.value.status)],
    ];
  }
  if (isScheduleDetail.value && tabKey === 'people') {
    return [
      ['张园', 'EMP-202605-001', scheduleDepartment.value, '销售经理 / P6', textValue(record.value.amount), '已确认'],
      ['陈佳', 'EMP-202605-021', scheduleDepartment.value, '销售专员 / P4', textValue(record.value.amount), textValue(record.value.status) === '草稿' ? '待确认' : '已确认'],
    ];
  }
  if (isScheduleDetail.value && tabKey === 'shiftRule') {
    return [
      [textValue(record.value.amount), scheduleWorkTime.value, '10分钟', textValue(record.value.left), '考勤机 + 移动打卡', textValue(record.value.status)],
      ['休息规则', '按排班日历生成', '不适用', textValue(record.value.left), '系统判定', textValue(record.value.status)],
    ];
  }
  if (isScheduleDetail.value && tabKey === 'change') {
    return [
      ['换班申请', '陈佳', textValue(record.value.amount), '值班班', '2026-06-08', '待审批'],
      ['临时调班', '张园', textValue(record.value.amount), textValue(record.value.amount), '2026-06-10', '已通过'],
    ];
  }
  if (isScheduleDetail.value && tabKey === 'conflict') {
    return [
      ['重复排班', '陈佳 / 值班班', scheduleConflictCount.value === '0' ? '无冲突' : '同日存在重复班次', '2026-06-08', scheduleConflictCount.value === '0' ? '无需处理' : '调整目标班次', scheduleConflictCount.value === '0' ? '通过' : '待处理'],
    ];
  }
  if (isScheduleDetail.value && tabKey === 'publish') {
    return [
      ['PUB-202606-001', textValue(record.value.party), textValue(record.value.owner), '2026-05-31 18:00', textValue(record.value.done), textValue(record.value.status)],
    ];
  }
  if (isPayrollDetail.value && tabKey === 'attendanceSource') {
    return [
      ['考勤汇总', 'ATT-SUM-202605', '出勤系数', '1.00', textValue(record.value.date), textValue(record.value.status)],
      ['考勤异常', 'ATT-202605-001', '迟到扣款', textValue(record.value.subject).includes('张园') ? '120.00' : '0.00', textValue(record.value.date), '已引用'],
    ];
  }
  if (isPayrollDetail.value && tabKey === 'socialTax') {
    return [
      ['社保个人部分', '18,000.00', extraText('socialSecurity', '0.00'), '公司部分待财务核算', '海口社保方案', textValue(record.value.status)],
      ['公积金个人部分', '18,000.00', extraText('housingFund', '0.00'), '公司部分待财务核算', '海口公积金方案', textValue(record.value.status)],
      ['个人所得税', textValue(record.value.amount), extraText('incomeTax', '0.00'), '-', '累计预扣预缴', textValue(record.value.status)],
    ];
  }
  if (isPayrollDetail.value && tabKey === 'adjustment') {
    return [
      ['考勤扣款', textValue(record.value.subject).includes('张园') ? '-120.00' : '0.00', '考勤异常引用', '王人事', '2026-05-31 09:30', '已计入'],
      ['补贴调整', '0.00', '本月无人工调整', '财务复核', '2026-05-31 09:35', '已确认'],
    ];
  }
  if (isPayrollDetail.value && tabKey === 'payslip') {
    return [
      [extraText('payrollNo', textValue(record.value.code)), textValue(record.value.subject), '站内消息 + 邮件', textValue(record.value.status) === '待发放' ? '-' : '2026-05-31 18:00', '-', textValue(record.value.status) === '已发放' ? '已发送' : '待发送'],
    ];
  }
  if (isArchiveDetail.value && tabKey === 'contract') {
    return [
      [textValue(record.value.amount), extraText('archiveNo', textValue(record.value.code)), textValue(record.value.party), textValue(record.value.done), textValue(record.value.left), extraText('storage')],
      ['归档附件', `${extraText('archiveNo', textValue(record.value.code))}.pdf`, textValue(record.value.owner), textValue(record.value.date), textValue(record.value.status), archiveConfidentiality.value],
    ];
  }
  if (isArchiveDetail.value && tabKey === 'life') {
    return [
      ['形成', textValue(record.value.done), textValue(record.value.done), textValue(record.value.owner), '原件/扫描件收集', '已完成'],
      ['归档', textValue(record.value.date), textValue(record.value.date), textValue(record.value.owner), extraText('storage'), textValue(record.value.status)],
      ['到期复核', textValue(record.value.left), '-', textValue(record.value.owner), extraText('reminderRule'), textValue(record.value.status).includes('到期') ? '待复核' : '待提醒'],
    ];
  }
  if (isArchiveDetail.value && tabKey === 'borrow') {
    return [
      ['BRW-202605-001', '王人事', '人事复核查阅', '2026-05-20', '2026-05-20', '已归还'],
      ['BRW-202606-001', textValue(record.value.owner), '到期复核准备', '-', '-', archiveBorrowState.value],
    ];
  }
  if (isArchiveDetail.value && tabKey === 'version') {
    return [
      ['V1.0', '初始归档', textValue(record.value.owner), `${textValue(record.value.date)} 09:30`, '已归档', extraText('storage')],
      ['V1.1', '补充复核提醒', textValue(record.value.owner), '2026-05-31 14:10', textValue(record.value.status), extraText('reminderRule')],
    ];
  }
  if (isArchiveDetail.value && tabKey === 'permission') {
    return [
      ['人力中心', '查看/下载', textValue(record.value.owner), textValue(record.value.date), '长期', '启用'],
      [textValue(record.value.owner), '借阅审批', '系统', textValue(record.value.date), textValue(record.value.left), archiveBorrowState.value],
    ];
  }
  if (isOfficeDetail.value && tabKey === 'approve') {
    return [
      ['申请提交', textValue(record.value.party), '已提交', `${textValue(record.value.date)} 09:00`, extraText('purpose', `${textValue(record.value.amount)}办理`)],
      ['部门审批', textValue(record.value.left, textValue(record.value.owner)), textValue(record.value.status) === '审批中' ? '待审批' : '通过', `${textValue(record.value.date)} 10:30`, officeCurrentNode.value],
    ];
  }
  if (isOfficeDetail.value && tabKey === 'record') {
    return [
      ['受理登记', textValue(record.value.left, textValue(record.value.owner)), textValue(record.value.status), `${textValue(record.value.date)} 11:00`, officeTimeLimit.value],
      ['结果反馈', textValue(record.value.left, textValue(record.value.owner)), textValue(record.value.status) === '已通过' ? '已办结' : '待办理', officeExpectedFinishDate.value, extraText('attachmentRequirement', '按事项补充附件')],
    ];
  }
  if (isOfficeDetail.value && tabKey === 'process') {
    return [
      ['申请人提交', textValue(record.value.party), '提交', `${textValue(record.value.date)} 09:00`, `${textValue(record.value.date)} 09:05`, '已完成'],
      ['部门负责人审批', textValue(record.value.left, textValue(record.value.owner)), '审批', `${textValue(record.value.date)} 10:00`, textValue(record.value.status) === '审批中' ? '-' : `${textValue(record.value.date)} 12:00`, officeCurrentNode.value],
      ['行政办理', textValue(record.value.left, textValue(record.value.owner)), '办理/反馈', officeExpectedFinishDate.value, '-', textValue(record.value.status) === '已通过' ? '办理中' : '待进入'],
    ];
  }
  if (isOfficeDetail.value && tabKey === 'related') {
    return [
      [textValue(record.value.amount), textValue(record.value.code), textValue(record.value.subject), textValue(record.value.party), textValue(record.value.date), textValue(record.value.status)],
      ['通知消息', `MSG-${textValue(record.value.code).replace(/\D/g, '').slice(-6) || '000001'}`, '站内消息提醒', textValue(record.value.left, textValue(record.value.owner)), officeExpectedFinishDate.value, '待发送'],
    ];
  }
  return [];
}

watch(() => props.recordId, loadRecord);
watch(() => props.config.resource, loadRecord);
watch(() => props.actionLabel, loadRecord);

async function loadRecord() {
  record.value = isPositionDescriptionDetail.value
    ? buildPositionDescriptionRecord(props.recordId)
    : await getHrRecord(props.config.resource, props.recordId || 'demo_001');
  actionLogs.value = await listHrActionLogs(props.config.resource, record.value.id);
  attachments.value = normalizeAttachments(detailRecord.value.attachments, detailRecord.value.detailRows?.attach);
  activeTab.value = 'info';
  message.value = '';
}

function buildPositionDescriptionRecord(recordId?: string): HrDetailRecord {
  const profile = getHrActionProfile('positions', sourceActionLabel.value || '岗位说明书');
  const matched = String(recordId || '').match(/action_(\d+)$/);
  const rowIndex = matched ? Number(matched[1]) : 0;
  const row = profile?.rows[rowIndex] || profile?.rows[0] || [
    '销售经理',
    'POS-202605-001',
    '销售中心',
    'P6',
    '销售总监',
    '大客户拓展 / 团队目标达成 / 回款协同',
    '3年以上大客户销售与团队管理经验',
    '12K-22K',
    'V1.3',
    '2026-05-01',
    '启用',
  ];
  const [subject, code, party, level, supervisor, summary, qualification, salaryRange, version, effectiveDate, status] = row;
  const scenario = positionDescriptionScenario(subject, {
    subject,
    level,
    supervisor,
    summary,
    qualification,
    salaryRange,
    effectiveDate,
  });
  return {
    id: recordId || `${props.config.resource}_action_${rowIndex}`,
    code,
    subject,
    party,
    amount: level,
    done: scenario.headcount,
    left: scenario.onDuty,
    date: effectiveDate,
    status,
    group: scenario.sequence,
    owner: '王人事',
    directSupervisor: supervisor,
    responsibilitySummary: summary,
    qualification,
    salaryRange,
    version,
    reviewCycle: scenario.reviewCycle,
    officeLocation: scenario.officeLocation,
    detailRows: scenario.detailRows,
  };
}

function positionDescriptionScenario(subject: string, base: Record<string, string>) {
  if (subject.includes('前端')) {
    return {
      sequence: '技术序列',
      headcount: '6',
      onDuty: '5',
      reviewCycle: '季度复审',
      officeLocation: '海口总部 6F',
      detailRows: {
        responsibility: [
          ['前端架构', '负责 Vue3 工程架构、公共组件和页面性能治理', '关键页面首屏与交互稳定性', '35%', '季度', '启用'],
          ['工程化治理', '维护构建、Lint、类型检查和代码分层规范', '构建通过率 / 缺陷回归率', '30%', '季度', '启用'],
          ['技术辅导', '沉淀组件使用规范并支持业务研发交付', '规范覆盖率 / 评审完成率', '20%', '月度', '启用'],
          ['跨端协同', '配合后端、设计与测试完成复杂页面交付', '需求准时交付率', '15%', '月度', '启用']
        ],
        qualification: [
          ['工作经验', base.qualification, '是', '面试 + 项目复盘', '要求有大型业务系统经验'],
          ['技术能力', '熟悉 Vue3、TypeScript、状态管理、工程化和性能优化', '是', '技术面试', '能独立拆解复杂页面'],
          ['协同能力', '具备跨团队沟通、组件规范沉淀和代码评审能力', '是', '试用期评估', '关注交付质量'],
          ['学历要求', '本科及以上，计算机相关专业优先', '否', '资料核验', '经验优秀可放宽']
        ],
        headcount: [[base.level, '6', '5', base.salaryRange, base.supervisor, base.effectiveDate]],
        approve: [
          ['研发中心审批', '研发总监', '通过', '2026-04-28 16:00', '岗位职责覆盖平台化建设要求'],
          ['人力中心复核', '王人事', '通过', '2026-04-29 10:10', '薪级范围与职级匹配']
        ],
        op: [
          ['说明书创建', '王人事', '2026-05-01 09:25', '创建高级前端工程师岗位说明书', '成功'],
          ['任职资格更新', '王人事', '2026-05-01 10:00', '补充工程化治理要求', '成功']
        ],
      },
    };
  }
  if (subject.includes('财务')) {
    return {
      sequence: '职能序列',
      headcount: '3',
      onDuty: '0',
      reviewCycle: '年度复审',
      officeLocation: '海口总部 5F',
      detailRows: {
        responsibility: [
          ['应收应付核算', '负责供应商与客户往来账核对、付款申请复核', '对账准确率', '35%', '月度', '待审批'],
          ['凭证归档', '整理费用、薪酬和付款相关凭证材料', '归档完整率', '25%', '月度', '待审批'],
          ['月度对账', '配合财务主管完成月结、差异追踪和报表输出', '月结准时率', '25%', '月度', '待审批'],
          ['薪酬复核', '协同人力完成薪酬发放数据复核', '复核差错率', '15%', '月度', '待审批']
        ],
        qualification: [
          ['工作经验', base.qualification, '是', '面试 + 背调', '需熟悉费用与往来核算'],
          ['专业能力', '熟悉财务共享流程、Excel 与常用财务系统', '是', '实操测试', '关注数据准确性'],
          ['证书要求', '初级会计职称优先', '否', '证书核验', '可入职后补充'],
          ['风险意识', '了解费用合规、付款审批和凭证留档要求', '是', '面试评估', '需具备细致性']
        ],
        headcount: [[base.level, '3', '0', base.salaryRange, base.supervisor, base.effectiveDate]],
        approve: [
          ['财务中心审批', '财务经理', '通过', '2026-05-08 14:30', '同意新增共享核算岗位'],
          ['人力中心复核', '王人事', '待审批', '2026-05-10 10:00', '待确认薪级范围']
        ],
        op: [
          ['说明书草稿', '王人事', '2026-05-08 09:30', '创建财务共享专员说明书草稿', '成功'],
          ['提交审批', '王人事', '2026-05-10 10:00', '提交岗位说明书审批', '待审批']
        ],
      },
    };
  }
  return {
    sequence: '销售序列',
    headcount: '12',
    onDuty: '9',
    reviewCycle: '半年复审',
    officeLocation: '海口总部 8F',
    detailRows: {
      responsibility: [
        ['客户拓展', '负责重点客户开发、商机推进和合同签约', '新增商机 / 签约额', '35%', '月度', '启用'],
        ['团队管理', '拆解销售目标，跟进销售专员过程动作与培训辅导', '团队达成率', '25%', '月度', '启用'],
        ['回款协同', '协同财务、售后跟进回款节点和风险客户', '回款达成率', '25%', '月度', '启用'],
        ['市场反馈', '收集客户需求、竞品动态并推动产品反馈闭环', '有效反馈数', '15%', '季度', '启用']
      ],
      qualification: [
        ['工作经验', base.qualification, '是', '面试 + 业绩材料', '要求有大客户销售案例'],
        ['管理能力', '能带领 5 人以上销售小组并完成目标拆解', '是', '主管面试', '关注过程管理'],
        ['业务能力', '熟悉合同、报价、回款和客户分级管理流程', '是', '场景问答', '需能跨部门协同'],
        ['学历要求', '大专及以上，市场营销或管理类专业优先', '否', '资料核验', '经验优秀可放宽']
      ],
      headcount: [[base.level, '12', '9', base.salaryRange, base.supervisor, base.effectiveDate]],
      approve: [
        ['销售中心审批', '销售总监', '通过', '2026-04-29 11:20', '职责与销售目标匹配'],
        ['人力中心复核', '王人事', '通过', '2026-04-29 15:30', '说明书字段完整']
      ],
      op: [
        ['说明书创建', '王人事', '2026-05-01 09:20', '创建销售经理岗位说明书', '成功'],
        ['版本发布', '王人事', '2026-05-01 09:45', '发布 V1.3 版本', '成功']
      ],
    },
  };
}

function getRecordTableRows(tabKey: string) {
  const rows = detailRecord.value.detailRows?.[tabKey];
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => row.map((cell) => textValue(cell)));
}

function normalizeAttachments(rows: AttachmentRow[] | undefined, tableRows?: string[][]) {
  if (!Array.isArray(rows) && Array.isArray(tableRows)) {
    return tableRows.map((row, index) => ({
      id: `${record.value.id}_att_${index + 1}`,
      name: textValue(row[1] || row[0]),
      type: textValue(row[0], '人事附件'),
      date: textValue(row[2], textValue(record.value.date)),
      remark: textValue(row[4] || row[3], ''),
    }));
  }
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    id: row.id ?? `${record.value.id}_att_${index + 1}`,
    name: textValue(row.name),
    type: textValue(row.type, '人事附件'),
    date: textValue(row.date),
    remark: row.remark ? textValue(row.remark) : '',
  }));
}

function textValue(value: unknown, fallback = '-') {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function extraText(key: string, fallback = '-') {
  return textValue(detailRecord.value[key], fallback);
}

function fallbackCell(column: string, index: number) {
  if (/姓名|员工|人员|审批人|操作人|负责人|处理人/.test(column)) return index % 2 ? textValue(record.value.subject) : textValue(record.value.owner, '系统');
  if (/日期|时间|生效|计划|完成|签署|到期/.test(column)) return textValue(record.value.date);
  if (/状态|结果/.test(column)) return textValue(record.value.status);
  if (/金额|工资|应付|实发/.test(column)) return textValue(record.value.amount);
  if (/人数|次数|天数|小时|编制/.test(column)) return textValue(record.value.done);
  return `${column}${index + 1}`;
}

function deriveDateOffset(source: string, days: number) {
  const matched = source.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return source || '-';
  const date = new Date(`${source}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function addAttachment() {
  attachments.value.push({ id: Date.now(), name: '', type: '人事附件', date: todayText(), remark: '' });
}

function removeAttachment(row: AttachmentRow) {
  if (attachments.value.length <= 1) return;
  attachments.value = attachments.value.filter((item) => item.id !== row.id);
}

async function handleAction(key: string) {
  let result: HrActionResult | undefined;
  if (key === 'edit') {
    openEditModal();
    return;
  }
  if (key === 'disable' && !window.confirm(`确认停用 ${textValue(record.value.subject)} 吗？`)) return;
  if (key === 'submit') result = await submitHrRecord(props.config.resource, record.value.id);
  if (key === 'approve') result = await approveHrRecord(props.config.resource, record.value.id);
  if (key === 'disable') result = await disableHrRecord(props.config.resource, record.value.id);
  if (key === 'print') result = await printHrRecord(props.config.resource, record.value.id);
  if (key === 'export') result = await exportHrRecord(props.config.resource, record.value.id);
  if (result?.status) record.value.status = result.status;
  actionLogs.value = await listHrActionLogs(props.config.resource, record.value.id);
  message.value = result?.message || `${key} action handled by HR mock adapter.`;
}

function openEditModal() {
  editFields.value.forEach((field) => {
    editForm[field.key] = editFieldValue(field.key);
  });
  editModalOpen.value = true;
}

function editFieldValue(key: string) {
  if (key === 'confidentiality') return archiveConfidentiality.value;
  if (key === 'borrowState') return archiveBorrowState.value;
  if (key === 'priority') return officePriority.value;
  if (key === 'currentNode') return officeCurrentNode.value;
  if (key === 'timeLimit') return officeTimeLimit.value;
  if (key === 'expectedFinishDate') return officeExpectedFinishDate.value;
  return textValue(record.value[key], '');
}

async function saveEditForm() {
  const payload = Object.fromEntries(editFields.value.map((field) => [field.key, editForm[field.key] || '']));
  const updated = await updateHrRecord(props.config.resource, record.value.id, payload);
  record.value = updated;
  actionLogs.value = await listHrActionLogs(props.config.resource, record.value.id);
  editModalOpen.value = false;
  activeTab.value = 'op';
  message.value = `${props.config.title}已保存修改并回写当前详情。`;
}

function openEmployeeActionAudit() {
  auditModalOpen.value = true;
}

async function confirmEmployeeActionAudit(payload: AuditActionPayload) {
  auditModalOpen.value = false;
  if (isDepartureDetail.value) {
    await confirmDepartureAudit(payload);
    return;
  }
  await confirmPromotionAudit(payload);
}

async function confirmPromotionAudit(payload: AuditActionPayload) {
  let nextStatus = record.value.status;
  if (payload.action === 'approve') {
    await approveHrRecord(props.config.resource, record.value.id);
    nextStatus = '已转正';
  } else if (payload.action === 'reject') {
    nextStatus = '驳回';
  } else if (payload.action === 'return') {
    nextStatus = '待评估';
  }
  record.value.status = nextStatus;
  const log: HrActionResult = {
    id: record.value.id,
    resource: props.config.resource,
    action: `promotion-${payload.action}`,
    status: nextStatus,
    operatedAt: `${todayText()} 10:00`,
    message: `${auditActionLabel(payload.action)}：${payload.opinion || '已通过转正审核弹窗处理'}`,
  };
  actionLogs.value = [log, ...actionLogs.value];
  activeTab.value = 'op';
  message.value = `转正审核已处理，当前状态：${nextStatus}。`;
}

async function confirmDepartureAudit(payload: AuditActionPayload) {
  let nextStatus = record.value.status;
  if (payload.action === 'approve') {
    await disableHrRecord(props.config.resource, record.value.id);
    nextStatus = '离职';
  } else if (payload.action === 'reject') {
    nextStatus = '驳回';
  } else if (payload.action === 'return') {
    nextStatus = '待交接';
  }
  record.value.status = nextStatus;
  const log: HrActionResult = {
    id: record.value.id,
    resource: props.config.resource,
    action: `departure-${payload.action}`,
    status: nextStatus,
    operatedAt: `${todayText()} 10:00`,
    message: `${auditActionLabel(payload.action)}：${payload.opinion || '已通过离职确认弹窗处理'}`,
  };
  actionLogs.value = [log, ...actionLogs.value];
  activeTab.value = 'op';
  message.value = `离职确认已处理，当前状态：${nextStatus}。`;
}

function goBack() {
  router.push(sourceActionLabel.value ? `${props.config.route}?action=${encodeURIComponent(sourceActionLabel.value)}` : props.config.route);
}

function actionLabel(action: string) {
  if (action.includes('promotion-approve')) return '转正通过';
  if (action.includes('promotion-reject')) return '审核驳回';
  if (action.includes('promotion-return')) return '退回修改';
  if (action.includes('promotion-transfer')) return '转交处理';
  if (action.includes('departure-approve')) return '离职确认';
  if (action.includes('departure-reject')) return '审核驳回';
  if (action.includes('departure-return')) return '退回修改';
  if (action.includes('departure-transfer')) return '转交处理';
  if (action.includes('submit')) return '提交审批';
  if (action.includes('approve')) return '审批通过';
  if (action.includes('disable')) return '停用';
  if (action.includes('print')) return '打印';
  if (action.includes('export')) return '导出';
  if (action.includes('create')) return '新增';
  return action;
}

function auditActionLabel(action: string) {
  return employeeActionAuditActions.value.find((item) => item.key === action)?.label || action;
}

function statusTone(status: string) {
  if (['在职', '启用', '正常', '已处理', '已发布', '已发放', '已入职', '已转正', '已归档', '有效', '已通过', '已同步'].includes(status)) return 'green';
  if (['离职', '停用', '异常', '驳回', '已过期', '冻结'].includes(status)) return 'red';
  if (['待入职', '试用期', '待审批', '审批中', '待处理', '待办理', '进行中', '待评估'].includes(status)) return 'yellow';
  return 'yellow';
}

onMounted(loadRecord);
</script>

<style scoped>
.hr-empty-cell {
  color: var(--aw-text-muted);
  padding: 18px 12px;
  text-align: center;
}
</style>
