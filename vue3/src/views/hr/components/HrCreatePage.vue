<template>
  <aw-form-page :actions="formActions" :back-text="`返回${config.title}`" @action="handleAction" @back="router.push(config.route)">
    <section class="aw-form-card">
      <div class="aw-detail-section-title">{{ title }}</div>
      <div v-if="isOfficeApplicationForm" class="hr-office-type-block">
        <div class="hr-office-type-title">事项类型</div>
        <div class="hr-office-type-grid">
          <button
            v-for="item in officeTypeCards"
            :key="item.title"
            type="button"
            :class="['hr-office-type-card', { on: form.amount === item.title }]"
            @click="pickOfficeType(item.title)"
          >
            <strong>{{ item.title }}</strong>
            <span>{{ item.desc }}</span>
            <em>{{ item.owner }}</em>
          </button>
        </div>
      </div>
      <div class="aw-form-grid">
        <div class="aw-field">
          <label class="req">{{ config.subjectLabel }}</label>
          <input v-model="form.subject" class="aw-input" :placeholder="`请输入${config.subjectLabel}`" />
        </div>
        <div class="aw-field">
          <label>{{ config.codeLabel }}</label>
          <input class="aw-input" value="系统自动生成" disabled />
        </div>
        <div class="aw-field">
          <label class="req">{{ config.partyLabel }}</label>
          <div class="aw-field-row">
            <input class="aw-input" :value="partyDisplayValue" readonly :placeholder="`请选择${config.partyLabel}`" @click="openPicker(config.partyLabel)" />
            <button class="aw-tool-btn" type="button" @click="openPicker(config.partyLabel)">选择</button>
          </div>
        </div>
        <div v-if="showAmountField" class="aw-field">
          <label class="req">{{ config.amountLabel }}</label>
          <div v-if="isPickerField(config.amountLabel)" class="aw-field-row">
            <input class="aw-input" :value="form.amount" readonly :placeholder="`请选择${config.amountLabel}`" @click="openPicker(config.amountLabel)" />
            <button class="aw-tool-btn" type="button" @click="openPicker(config.amountLabel)">选择</button>
          </div>
          <input v-else v-model="form.amount" class="aw-input" :placeholder="`请输入${config.amountLabel}`" />
        </div>
        <div class="aw-field">
          <label>{{ config.dateLabel }}</label>
          <input v-model="form.date" class="aw-input" type="date" />
        </div>
        <div class="aw-field">
          <label>{{ config.statusLabel }}</label>
          <select v-model="form.status" class="aw-select">
            <option v-for="status in config.statuses" :key="status">{{ status }}</option>
          </select>
        </div>
        <div v-for="field in extraFields" :key="field" class="aw-field">
          <label>{{ field }}</label>
          <div v-if="isPickerField(field)" class="aw-field-row">
            <input class="aw-input" :value="extraValues[field] || ''" readonly :placeholder="`请选择${field}`" @click="openPicker(field)" />
            <button class="aw-tool-btn" type="button" @click="openPicker(field)">选择</button>
          </div>
          <input v-else-if="/日期|时间|月份/.test(field)" v-model="extraValues[field]" class="aw-input" type="date" />
          <select v-else-if="/类型|状态|流程|规则|方案/.test(field)" v-model="extraValues[field]" class="aw-select">
            <option>默认{{ field }}</option>
            <option>待审批</option>
            <option>已启用</option>
          </select>
          <input v-else v-model="extraValues[field]" class="aw-input" :placeholder="`请输入${field}`" />
        </div>
      </div>
      <div v-if="message" class="aw-form-note">{{ message }}</div>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">{{ config.title }}明细</div>
      <aw-detail-tabs v-model="activeInfoTab" :tabs="infoTabs" />
      <aw-editable-sub-table v-if="activeInfoTab === 'contact'" :columns="contactColumns" :rows="contactRows" add-text="新增联系人" @add="addContactRow">
        <template #cell="{ column, row }">
          <input v-model="row[column.key]" class="aw-input" :placeholder="`请输入${column.title}`" />
        </template>
        <template #actions="{ row }">
          <span class="aw-link" style="color:var(--aw-danger)" @click="removeContactRow(row.id)">删除</span>
        </template>
      </aw-editable-sub-table>
      <aw-editable-sub-table v-else-if="activeInfoTab === 'finance'" :columns="financeColumns" :rows="financeRows" add-text="新增银行卡号" @add="addFinanceRow">
        <template #cell="{ column, row }">
          <input v-model="row[column.key]" class="aw-input" :placeholder="`请输入${column.title}`" />
        </template>
        <template #actions="{ row }">
          <span class="aw-link" style="color:var(--aw-danger)" @click="removeFinanceRow(row.id)">删除</span>
        </template>
      </aw-editable-sub-table>
      <aw-editable-sub-table v-else-if="activeInfoTab === 'address'" :columns="addressColumns" :rows="addressRows" add-text="新增地址" @add="addAddressRow">
        <template #cell="{ column, row }">
          <input v-model="row[column.key]" class="aw-input" :placeholder="`请输入${column.title}`" />
        </template>
        <template #actions="{ row }">
          <span class="aw-link" style="color:var(--aw-danger)" @click="removeAddressRow(row.id)">删除</span>
        </template>
      </aw-editable-sub-table>
      <aw-attachment-table
        v-else
        :rows="attachments"
        :type-options="employeeAttachmentTypes"
        add-text="新增附件信息"
        allow-remove-last
        @add="addAttachment"
        @remove="removeAttachment"
        @upload="uploadAttachment"
      />
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">人事说明</div>
      <aw-rich-text-editor v-model="remark" />
    </section>

    <aw-person-picker-modal
      :depts="pickerData.people"
      :open="showPicker"
      :title="`选择${pickerTitle}`"
      @cancel="showPicker = false"
      @confirm="confirmPicker"
    />

    <aw-option-picker-modal
      :columns="optionColumns"
      :categories="optionCategories"
      :category-key="optionCategoryKey"
      :category-title="optionCategoryTitle"
      :open="showOptionPicker"
      :rows="optionRows"
      :search-placeholder="optionSearchPlaceholder"
      :title="`选择${pickerTitle}`"
      @cancel="showOptionPicker = false"
      @confirm="confirmOption"
    />
  </aw-form-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createHrRecord, getHrPickerData } from '@/app/api/hr/resources';
import type { HrModuleConfig } from '@/app/api/hr/types';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import type { DetailTabItem } from '@/components/detail-page/types';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwOptionPickerModal from '@/components/form-page/AwOptionPickerModal.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import type { AttachmentRow, EditableColumn, FormAction } from '@/components/form-page/types';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import type { PersonPickerPerson } from '@/components/setting-page/types';
import { getHrActionProfile } from '../hrResource.config';

type OptionPickerRow = {
  id: string | number;
  [key: string]: unknown;
};
type EditableInfoRow = Record<string, string | number | boolean>;

const props = defineProps<{ config: HrModuleConfig; actionLabel?: string }>();
const router = useRouter();
const pickerData = getHrPickerData();
const officeTypeCards = [
  { title: '证明开具', desc: '在职、收入、任职等证明材料开具申请。', owner: '人事受理' },
  { title: '物品领用', desc: '办公用品、工牌、设备配件等领用登记。', owner: '行政办理' },
  { title: '用印申请', desc: '公章、合同章、部门章等用印审批。', owner: '行政审核' },
  { title: '用车申请', desc: '公务用车、外出接送、临时车辆协调。', owner: '后勤调度' },
];
const pickerTitle = ref('');
const showPicker = ref(false);
const showOptionPicker = ref(false);
const activeInfoTab = ref('contact');
const message = ref('');
const remark = ref('');
const form = reactive({
  subject: '',
  party: '',
  amount: props.config.key === 'office' ? officeTypeCards[0].title : '',
  date: '2026-05-30',
  status: props.config.statuses[0],
});
const extraValues = reactive<Record<string, string>>({});
const contactRows = ref<EditableInfoRow[]>([{ id: 1, name: '', phone: '', position: '', email: '', remark: '' }]);
const financeRows = ref<EditableInfoRow[]>([{ id: 1, bankAccount: '', accountName: '', bankName: '', remark: '' }]);
const addressRows = ref<EditableInfoRow[]>([{ id: 1, address: '' }]);
const employeeAttachmentTypes = ['荣誉证书', '学历证书', '学位证书', '资格证书', '培训证书', '身份证件', '体检报告', '入职材料'];
const attachments = ref<AttachmentRow[]>([{ id: 1, name: '', type: employeeAttachmentTypes[0], date: '2026-05-30', remark: '' }]);
const formActions: FormAction[] = [
  { key: 'draft', label: '保存草稿' },
  { key: 'submit', label: '提交审批', primary: true },
];
const infoTabs: DetailTabItem[] = [
  { key: 'contact', label: '联系人信息' },
  { key: 'finance', label: '银行卡' },
  { key: 'address', label: '通信地址' },
  { key: 'attach', label: '附件信息' },
];
const title = computed(() => props.actionLabel && props.actionLabel !== 'new' ? props.actionLabel : props.config.newLabel);
const isEmployeeDepartmentPositionForm = computed(() => props.config.key === 'employees');
const isOfficeApplicationForm = computed(() => props.config.key === 'office' && (props.actionLabel === 'new' || props.actionLabel === '新增办公申请'));
const showAmountField = computed(() => !isEmployeeDepartmentPositionForm.value && !isOfficeApplicationForm.value);
const partyDisplayValue = computed(() => (
  isEmployeeDepartmentPositionForm.value && form.party && form.amount
    ? `${form.party} / ${form.amount}`
    : form.party
));
const fixedFields = computed(() => [props.config.subjectLabel, props.config.codeLabel, props.config.partyLabel, props.config.amountLabel, props.config.dateLabel, props.config.statusLabel]);
const extraFields = computed(() => props.config.formFields.filter((field) => !fixedFields.value.includes(field)));
const contactColumns: EditableColumn[] = [
  { key: 'name', title: '联系人' },
  { key: 'phone', title: '联系方式' },
  { key: 'position', title: '关系' },
  { key: 'email', title: '邮箱' },
  { key: 'remark', title: '备注' },
];
const financeColumns: EditableColumn[] = [
  { key: 'bankAccount', title: '银行卡号' },
  { key: 'accountName', title: '账户名称' },
  { key: 'bankName', title: '开户行' },
  { key: 'remark', title: '备注' },
];
const addressColumns: EditableColumn[] = [
  { key: 'address', title: '详细地址' },
];
const isContractTypePicker = computed(() => pickerTitle.value === '合同类型');
const isDepartmentPositionPicker = computed(() => isEmployeeDepartmentPositionForm.value && pickerTitle.value === props.config.partyLabel);
const contractArchiveRows = computed<OptionPickerRow[]>(() => {
  const profile = getHrActionProfile('archives', '合同档案');
  return (profile?.rows || []).map((row, index) => ({
    id: `contract_${index + 1}`,
    name: row[0],
    code: row[1],
    contractType: row[2],
    signer: row[3],
    counterparty: row[4],
    signDate: row[5],
    effectiveDate: row[6],
    expireDate: row[7],
    storage: row[8],
    owner: row[9],
    status: row[10],
    category: row[2],
  }));
});
const contractCategories = computed(() => {
  const types = Array.from(new Set(contractArchiveRows.value.map((row) => String(row.contractType || '')).filter(Boolean)));
  return [
    { key: 'all', label: '全部合同', icon: 'line-folder' },
    ...types.map((type) => ({ key: type, label: type, icon: 'line-node' })),
  ];
});
const defaultOptionColumns = [
  { key: 'name', title: '名称', width: 160 },
  { key: 'code', title: '编号', width: 140 },
  { key: 'scope', title: '归属/范围', width: 150 },
  { key: 'owner', title: '负责人' },
];
const contractOptionColumns = [
  { key: 'name', title: '合同名称', width: 220 },
  { key: 'code', title: '合同编号', width: 160 },
  { key: 'contractType', title: '合同类型', width: 140 },
];
const departmentPositionColumns = [
  { key: 'name', title: '岗位名称', width: 170 },
  { key: 'code', title: '岗位编号', width: 150 },
  { key: 'sequence', title: '岗位序列', width: 120 },
  { key: 'level', title: '岗位等级', width: 100 },
  { key: 'headcount', title: '编制/在岗', width: 120 },
];
const departmentPositionRows = computed<OptionPickerRow[]>(() => [
  { id: 'dept_hq_assistant', category: '集团总部', department: '集团总部', name: '总经理助理', code: 'POS-HQ-001', sequence: '职能序列', level: 'P5', headcount: '2 / 1' },
  { id: 'dept_hq_admin', category: '集团总部', department: '集团总部', name: '行政专员', code: 'POS-HQ-002', sequence: '职能序列', level: 'P4', headcount: '3 / 2' },
  { id: 'dept_sales_manager', category: '销售部', department: '销售部', name: '销售经理', code: 'POS-202605-001', sequence: '销售序列', level: 'P6', headcount: '12 / 9' },
  { id: 'dept_sales_specialist', category: '销售部', department: '销售部', name: '销售专员', code: 'POS-SALE-004', sequence: '销售序列', level: 'P4', headcount: '20 / 18' },
  { id: 'dept_rd_frontend', category: '研发部', department: '研发部', name: '高级前端工程师', code: 'POS-202605-018', sequence: '技术序列', level: 'P7', headcount: '6 / 5' },
  { id: 'dept_rd_backend', category: '研发部', department: '研发部', name: '后端工程师', code: 'POS-RD-012', sequence: '技术序列', level: 'P6', headcount: '8 / 6' },
  { id: 'dept_rd_qa', category: '研发部', department: '研发部', name: '测试工程师', code: 'POS-RD-021', sequence: '技术序列', level: 'P5', headcount: '6 / 5' },
  { id: 'dept_fin_shared', category: '财务部', department: '财务部', name: '财务共享专员', code: 'POS-202605-028', sequence: '职能序列', level: 'P4', headcount: '3 / 0' },
  { id: 'dept_fin_accountant', category: '财务部', department: '财务部', name: '费用会计', code: 'POS-FIN-006', sequence: '职能序列', level: 'P4', headcount: '4 / 3' },
  { id: 'dept_wh_manager', category: '仓储部', department: '仓储部', name: '仓库主管', code: 'POS-WH-001', sequence: '供应链序列', level: 'P5', headcount: '2 / 1' },
  { id: 'dept_wh_keeper', category: '仓储部', department: '仓储部', name: '库存管理员', code: 'POS-WH-006', sequence: '供应链序列', level: 'P4', headcount: '8 / 7' },
  { id: 'dept_hr_manager', category: '人事部', department: '人事部', name: '人事主管', code: 'POS-HR-001', sequence: '职能序列', level: 'P5', headcount: '2 / 1' },
  { id: 'dept_hr_recruiter', category: '人事部', department: '人事部', name: '招聘专员', code: 'POS-HR-004', sequence: '职能序列', level: 'P4', headcount: '3 / 2' },
]);
const departmentPositionCategories = computed(() => props.config.groups.map((department) => ({
  key: department,
  label: department,
  icon: 'line-users',
  count: departmentPositionRows.value.filter((row) => row.category === department).length,
})));
const optionColumns = computed(() => {
  if (isDepartmentPositionPicker.value) return departmentPositionColumns;
  if (isContractTypePicker.value) return contractOptionColumns;
  return defaultOptionColumns;
});
const optionCategories = computed(() => {
  if (isDepartmentPositionPicker.value) return departmentPositionCategories.value;
  if (isContractTypePicker.value) return contractCategories.value;
  return [];
});
const optionCategoryKey = computed(() => 'category');
const optionCategoryTitle = computed(() => {
  if (isDepartmentPositionPicker.value) return '部门列表';
  if (isContractTypePicker.value) return '合同分类';
  return '分类';
});
const optionSearchPlaceholder = computed(() => (
  isDepartmentPositionPicker.value
    ? '搜索岗位名称、编号、序列或等级'
    : isContractTypePicker.value
      ? '搜索合同名称、编号或合同类型'
      : '搜索名称、编号、范围或负责人'
));
const optionRows = computed<OptionPickerRow[]>(() => {
  if (isDepartmentPositionPicker.value) return departmentPositionRows.value;
  if (isContractTypePicker.value) return contractArchiveRows.value;
  if (/组织|部门/.test(pickerTitle.value)) {
    return [
      { id: 'org_sales', name: '销售部', code: 'ORG-SALE', scope: '销售中心', owner: '张园' },
      { id: 'org_rd', name: '研发部', code: 'ORG-RD', scope: '研发中心', owner: '李文涛' },
      { id: 'org_fin', name: '财务部', code: 'ORG-FIN', scope: '财务中心', owner: '财务复核' },
    ];
  }
  if (/岗位|职级/.test(pickerTitle.value)) {
    return [
      { id: 'pos_sales_mgr', name: '销售经理', code: 'POS-202605-001', scope: '销售序列 / P6', owner: '张园' },
      { id: 'pos_frontend', name: '高级前端工程师', code: 'POS-202605-018', scope: '技术序列 / P7', owner: '李文涛' },
      { id: 'pos_hr', name: '人事主管', code: 'POS-HR-001', scope: '职能序列 / P5', owner: '王人事' },
    ];
  }
  if (/考勤组|班次/.test(pickerTitle.value)) {
    return [
      { id: 'att_sales', name: '销售考勤组', code: 'ATT-GRP-SALE', scope: '销售中心', owner: '王人事' },
      { id: 'shift_std', name: '标准班', code: 'SHIFT-STD', scope: '09:00-18:00', owner: '王人事' },
      { id: 'shift_duty', name: '值班班', code: 'SHIFT-DUTY', scope: '10:00-19:00', owner: '王人事' },
    ];
  }
  if (/薪资方案|薪酬类型|发放账户|社保方案|个税规则/.test(pickerTitle.value)) {
    return [
      { id: 'pay_sales', name: '销售薪资方案', code: 'PAY-SALE', scope: '销售中心', owner: '财务复核' },
      { id: 'pay_rd', name: '研发薪资方案', code: 'PAY-RD', scope: '研发中心', owner: '财务复核' },
      { id: 'bank_main', name: '招商银行发薪账户', code: 'BANK-CMB', scope: '工资发放', owner: '财务复核' },
    ];
  }
  return [
    { id: 'default_1', name: `默认${pickerTitle.value}`, code: 'OPT-001', scope: props.config.title, owner: '王人事' },
    { id: 'default_2', name: `${pickerTitle.value}备选项`, code: 'OPT-002', scope: props.config.title, owner: '王人事' },
  ];
});

function openPicker(field: string) {
  pickerTitle.value = field;
  if (isPersonField(field)) {
    showPicker.value = true;
    return;
  }
  showOptionPicker.value = true;
}

function pickOfficeType(type: string) {
  form.amount = type;
}

function confirmPicker(persons: PersonPickerPerson[]) {
  const value = persons.map((person) => person.name).join('、');
  if (pickerTitle.value === props.config.partyLabel) form.party = value;
  else if (pickerTitle.value === props.config.amountLabel) form.amount = value || props.config.amountLabel;
  else extraValues[pickerTitle.value] = value;
  showPicker.value = false;
}

function confirmOption(row: OptionPickerRow) {
  if (isDepartmentPositionPicker.value) {
    form.party = String(row.department || row.category || '');
    form.amount = String(row.name || '');
    showOptionPicker.value = false;
    return;
  }
  const value = isContractTypePicker.value ? String(row.contractType || row.name || '') : String(row.name || '');
  if (pickerTitle.value === props.config.partyLabel) form.party = value;
  else if (pickerTitle.value === props.config.amountLabel) form.amount = value;
  else extraValues[pickerTitle.value] = value;
  showOptionPicker.value = false;
}

function isPersonField(field: string) {
  return /人员|员工|负责人|上级|复核人|经办人|审批|申请人|考勤人员|适用人员|直属/.test(field);
}

function isOptionField(field: string) {
  return /组织|部门|岗位|职级|考勤组|班次|薪资方案|薪酬类型|发放账户|社保方案|个税规则|成本中心|办公地点|档案类型|事项类型|合同类型|证件类型|规则|流程/.test(field);
}

function isPickerField(field: string) {
  return isPersonField(field) || isOptionField(field);
}

function addContactRow() {
  contactRows.value.push({ id: Date.now(), name: '', phone: '', position: '', email: '', remark: '' });
}

function removeContactRow(id: string | number) {
  contactRows.value = contactRows.value.filter((row) => row.id !== id);
}

function addFinanceRow() {
  financeRows.value.push({ id: Date.now(), bankAccount: '', accountName: '', bankName: '', remark: '' });
}

function removeFinanceRow(id: string | number) {
  financeRows.value = financeRows.value.filter((row) => row.id !== id);
}

function addAddressRow() {
  addressRows.value.push({ id: Date.now(), address: '' });
}

function removeAddressRow(id: string | number) {
  addressRows.value = addressRows.value.filter((row) => row.id !== id);
}

function addAttachment() {
  attachments.value.push({ id: Date.now(), name: '', type: employeeAttachmentTypes[0], date: '2026-05-30', remark: '' });
}

function removeAttachment(row: AttachmentRow) {
  attachments.value = attachments.value.filter((item) => item.id !== row.id);
}

function uploadAttachment(row: AttachmentRow) {
  message.value = `${row.name || '附件'} 已触发上传。`;
}

async function handleAction(key: string) {
  const normalizedValues = normalizeExtraValues();
  const saved = await createHrRecord(props.config.resource, {
    ...form,
    ...extraValues,
    ...normalizedValues,
    group: props.config.groups[0],
    owner: normalizedValues.owner || '王人事',
    contactRows: contactRows.value,
    financeRows: financeRows.value,
    addressRows: addressRows.value,
    detailRows: {
      contacts: contactRows.value,
      finances: financeRows.value,
      addresses: addressRows.value,
    },
    attachments: attachments.value,
    remark: remark.value,
    status: key === 'draft' ? '草稿' : form.status,
  });
  message.value = key === 'draft' ? '草稿已通过人力 mock API 保存。' : '已提交审批，等待后端补充人力中心独立契约后对接真实流程。';
  router.push(`${props.config.route}?id=${encodeURIComponent(saved.id)}`);
}

function normalizeExtraValues() {
  const map: Record<string, string> = {
    手机号码: 'done',
    直属上级: 'left',
    计划转正日: 'probationEndDate',
    员工类型: 'employeeType',
    合同类型: 'contractType',
    办公地点: 'officeLocation',
    组织类型: 'orgType',
    负责人: 'owner',
    编制人数: 'done',
    在岗人数: 'left',
    成本中心: 'costCenter',
    岗位序列: 'group',
    岗位类型: 'positionType',
    岗位等级: 'amount',
    直接上级: 'directSupervisor',
    岗位编制: 'done',
    薪级范围: 'salaryRange',
    考勤人员: 'party',
    适用人员: 'done',
    班次: 'amount',
    休息规则: 'left',
    薪资方案: 'scheme',
    发放账户: 'bankAccount',
    社保方案: 'socialSecurity',
    个税规则: 'incomeTax',
    '证件/合同编号': 'archiveNo',
    形成日期: 'done',
    '到期/复核日期': 'left',
    保管位置: 'storage',
    提醒规则: 'reminderRule',
    经办人: 'left',
    所属部门: 'done',
    用途说明: 'purpose',
    期望完成日期: 'expectedFinishDate',
    附件要求: 'attachmentRequirement',
    审批流程: 'approvalFlow',
  };
  return Object.entries(extraValues).reduce<Record<string, string>>((result, [label, value]) => {
    const key = label === '经办人' && props.config.resource === 'hr-archives' ? 'owner' : map[label];
    if (key && value) result[key] = value;
    return result;
  }, {});
}
</script>

<style scoped>
.hr-office-type-block {
  margin-bottom: 18px;
}

.hr-office-type-title {
  margin: 4px 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--aw-fg-1);
}

.hr-office-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.hr-office-type-card {
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
}

.hr-office-type-card strong {
  font-size: 15px;
  color: var(--aw-fg-1);
}

.hr-office-type-card span {
  font-size: 12px;
  line-height: 1.6;
  color: var(--aw-fg-3);
}

.hr-office-type-card em {
  margin-top: auto;
  font-style: normal;
  font-size: 12px;
  color: var(--aw-primary);
}

.hr-office-type-card.on {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px var(--aw-primary-soft);
}

@media (max-width: 1024px) {
  .hr-office-type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
