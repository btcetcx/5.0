<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getHrEmployeeArchive, getHrPickerData, listHrRecords, updateHrEmployeeArchive } from '@/app/api/hr/resources';
import type { HrEmployeeArchive, HrRecord } from '@/app/api/hr/types';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwOptionPickerModal from '@/components/form-page/AwOptionPickerModal.vue';
import AwSearchTriggerInput from '@/components/form-page/AwSearchTriggerInput.vue';
import type { AttachmentRow, EditableColumn } from '@/components/form-page/types';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import type { PersonPickerDept, PersonPickerPerson } from '@/components/setting-page/types';

type PickerType = '' | 'dept' | 'post';
type EditableRow = Record<string, string>;
type ExperienceListKey = 'emergencyContacts' | 'educationalBackgrounds' | 'workExperiences' | 'projectExperiences' | 'personalSkills' | 'personalHonors';

const props = defineProps<{ recordId: string }>();
const router = useRouter();
const form = ref<HrEmployeeArchive | null>(null);
const orgRows = ref<HrRecord[]>([]);
const positionRows = ref<HrRecord[]>([]);
const pickerDepts = ref<PersonPickerDept[]>([]);
const activePicker = ref<PickerType>('');
const showLeaderPicker = ref(false);
const note = ref('');
const attachmentRows = ref<AttachmentRow[]>([]);
const certificateAttachmentRows = ref<AttachmentRow[]>([]);

const optionColumns = computed(() => activePicker.value === 'dept'
  ? [
      { key: 'name', title: '部门名称', width: 180 },
      { key: 'code', title: '部门编码', width: 160 },
      { key: 'owner', title: '负责人', width: 120 },
    ]
  : [
      { key: 'name', title: '岗位名称', width: 180 },
      { key: 'code', title: '岗位编码', width: 160 },
      { key: 'level', title: '职级', width: 100 },
    ]);

const optionRows = computed(() => {
  if (activePicker.value === 'dept') {
    return orgRows.value.map((row) => ({
      id: row.id,
      name: String(row.subject || row.party || row.id),
      code: row.code,
      owner: row.owner || row.amount,
      category: String(row.party || row.group || '组织机构'),
    }));
  }
  return positionRows.value.map((row) => ({
    id: row.id,
    name: String(row.subject || row.id),
    code: row.code,
    level: row.amount,
    category: String(row.group || row.party || '岗位'),
  }));
});

const optionCategories = computed(() => {
  const rows = activePicker.value === 'dept' ? orgRows.value : positionRows.value;
  const groups = Array.from(new Set(rows.map((row) => String(row.group || row.party || (activePicker.value === 'dept' ? '组织机构' : '岗位')))));
  return [
    { key: 'all', label: activePicker.value === 'dept' ? '全部部门' : '全部岗位' },
    ...groups.map((group) => ({ key: group, label: group })),
  ];
});

const emergencyColumns: EditableColumn[] = [
  { key: 'name', title: '姓名', width: 160 },
  { key: 'mobile', title: '手机号', width: 160 },
  { key: 'relation', title: '亲友关系', width: 140 },
];
const educationColumns: EditableColumn[] = [
  { key: 'period', title: '起止时间', width: 170 },
  { key: 'educationLevel', title: '教育等级', width: 120 },
  { key: 'schoolName', title: '学校名称', width: 170 },
  { key: 'majorName', title: '专业名称', width: 150 },
  { key: 'schoolType', title: '学校类型', width: 130 },
  { key: 'enrollmentType', title: '招生类型', width: 130 },
  { key: 'diploma', title: '学历证书', width: 170 },
  { key: 'degreeCert', title: '学位证书', width: 170 },
];
const workColumns: EditableColumn[] = [
  { key: 'period', title: '起止时间', width: 170 },
  { key: 'companyName', title: '单位名称', width: 180 },
  { key: 'jobDescription', title: '职务描述', width: 180 },
  { key: 'workDescription', title: '工作描述', width: 240 },
];
const projectColumns: EditableColumn[] = [
  { key: 'period', title: '起止时间', width: 170 },
  { key: 'projectName', title: '项目名称', width: 180 },
  { key: 'projectDescription', title: '项目描述', width: 260 },
];
const skillColumns: EditableColumn[] = [
  { key: 'skillName', title: '技能名称', width: 180 },
  { key: 'skillLevel', title: '技能等级', width: 140 },
];
const honorColumns: EditableColumn[] = [
  { key: 'honorName', title: '荣誉名称', width: 180 },
  { key: 'obtainTime', title: '获得时间', width: 140 },
  { key: 'honorDescription', title: '荣誉描述', width: 240 },
  { key: 'certificatePhoto', title: '证书附件', width: 180 },
];

async function loadData() {
  const [archive, orgResult, positionResult] = await Promise.all([
    getHrEmployeeArchive(props.recordId),
    listHrRecords('hr-orgs', { pageNo: 1, pageSize: 200 }),
    listHrRecords('hr-positions', { pageNo: 1, pageSize: 200 }),
  ]);
  form.value = archive;
  orgRows.value = orgResult.items;
  positionRows.value = positionResult.items;
  pickerDepts.value = getHrPickerData().people;
  attachmentRows.value = buildIdentityAttachmentRows(archive);
  certificateAttachmentRows.value = buildCertificateAttachmentRows(archive);
}

function buildIdentityAttachmentRows(archive: HrEmployeeArchive): AttachmentRow[] {
  return [
    { id: 'photo', name: archive.photo, type: '个人照片', date: archive.entryTime, remark: '敏感字段，已预留字段权限展示控制' },
    { id: 'id-front', name: archive.idCardFrontImgPath, type: '身份证件', date: archive.entryTime, remark: '身份证正面' },
    { id: 'id-back', name: archive.idCardReverseImgPath, type: '身份证件', date: archive.entryTime, remark: '身份证反面' },
  ];
}

function buildCertificateAttachmentRows(archive: HrEmployeeArchive): AttachmentRow[] {
  return [
    ...archive.educationalBackgrounds.flatMap((row) => [
      { id: certificateRowId('education', row.id, 'diploma'), name: row.diploma, type: '学历证书', date: archive.entryTime, remark: `${row.schoolName} / ${row.educationLevel}` },
      { id: certificateRowId('education', row.id, 'degreeCert'), name: row.degreeCert, type: '学位证书', date: archive.entryTime, remark: `${row.schoolName} / ${row.majorName}` },
    ]),
    ...archive.personalHonors.map((row) => ({
      id: certificateRowId('honor', row.id, 'certificatePhoto'),
      name: row.certificatePhoto,
      type: '荣誉证书',
      date: row.obtainTime || archive.entryTime,
      remark: row.honorName,
    })),
  ];
}

function certificateRowId(type: 'education' | 'honor', id: string, field: string) {
  return `${type}:${id}:${field}`;
}

function backToDetail() {
  router.push(`/hr/archives?action=${encodeURIComponent('员工档案')}&id=${encodeURIComponent(props.recordId)}`);
}

async function handleAction(key: string) {
  if (key !== 'save' || !form.value) return;
  const missing = validateRequired();
  if (missing) {
    note.value = missing;
    return;
  }
  syncAttachmentsToForm();
  const saved = await updateHrEmployeeArchive(props.recordId, form.value);
  router.push(`/hr/archives?action=${encodeURIComponent('员工档案')}&id=${encodeURIComponent(saved.id)}`);
}

function syncAttachmentsToForm() {
  if (!form.value) return;
  form.value.photo = String(attachmentRows.value.find((row) => row.id === 'photo')?.name || '');
  form.value.idCardFrontImgPath = String(attachmentRows.value.find((row) => row.id === 'id-front')?.name || '');
  form.value.idCardReverseImgPath = String(attachmentRows.value.find((row) => row.id === 'id-back')?.name || '');
  form.value.educationalBackgrounds.forEach((row) => {
    row.diploma = String(certificateAttachmentRows.value.find((item) => item.id === certificateRowId('education', row.id, 'diploma'))?.name || '');
    row.degreeCert = String(certificateAttachmentRows.value.find((item) => item.id === certificateRowId('education', row.id, 'degreeCert'))?.name || '');
  });
  form.value.personalHonors.forEach((row) => {
    row.certificatePhoto = String(certificateAttachmentRows.value.find((item) => item.id === certificateRowId('honor', row.id, 'certificatePhoto'))?.name || '');
  });
}

function validateRequired() {
  if (!form.value) return '档案数据未加载。';
  if (!form.value.departmentName) return '部门为必填项。';
  if (!form.value.entryTime) return '入职日期为必填项。';
  if (!form.value.name) return '姓名为必填项。';
  if (!form.value.sex) return '性别为必填项。';
  if (!/^1\d{10}$/.test(form.value.mobile)) return '手机号为必填项，且需要符合 11 位手机号格式。';
  if (!form.value.idCard) return '证件号码为必填项。';
  return '';
}

function confirmOption(row: Record<string, unknown>) {
  if (!form.value) return;
  if (activePicker.value === 'dept') {
    form.value.departmentId = String(row.id);
    form.value.departmentName = String(row.name);
    form.value.departmentIds = [String(row.category || '组织机构'), String(row.id)];
    form.value.postId = '';
    form.value.postName = '';
  }
  if (activePicker.value === 'post') {
    form.value.postId = String(row.id);
    form.value.postName = String(row.name);
  }
  activePicker.value = '';
}

function confirmLeader(persons: PersonPickerPerson[]) {
  if (!form.value) return;
  const person = persons[0];
  if (person) {
    form.value.leader = person.id;
    form.value.leaderName = person.name;
  }
  showLeaderPicker.value = false;
}

function addRow(listKey: ExperienceListKey) {
  if (!form.value) return;
  const id = `${listKey}_${Date.now()}`;
  const templates = {
    emergencyContacts: { id, name: '', mobile: '', relation: '' },
    educationalBackgrounds: { id, period: '', educationLevel: '', schoolName: '', majorName: '', schoolType: '', enrollmentType: '', diploma: '', degreeCert: '' },
    workExperiences: { id, period: '', companyName: '', jobDescription: '', workDescription: '' },
    projectExperiences: { id, period: '', projectName: '', projectDescription: '' },
    personalSkills: { id, skillName: '', skillLevel: '' },
    personalHonors: { id, honorName: '', obtainTime: '', honorDescription: '', certificatePhoto: '' },
  };
  (form.value[listKey] as unknown[]).push(templates[listKey]);
  if (listKey === 'educationalBackgrounds') {
    certificateAttachmentRows.value.push(
      { id: certificateRowId('education', id, 'diploma'), name: '', type: '学历证书', date: form.value.entryTime, remark: '新增教育经历' },
      { id: certificateRowId('education', id, 'degreeCert'), name: '', type: '学位证书', date: form.value.entryTime, remark: '新增教育经历' },
    );
  }
  if (listKey === 'personalHonors') {
    certificateAttachmentRows.value.push({ id: certificateRowId('honor', id, 'certificatePhoto'), name: '', type: '荣誉证书', date: form.value.entryTime, remark: '新增荣誉' });
  }
}

function removeRow(listKey: ExperienceListKey, id: string) {
  if (!form.value) return;
  (form.value as unknown as Record<string, unknown>)[listKey] = (form.value[listKey] as Array<{ id: string }>).filter((row) => row.id !== id);
  if (listKey === 'educationalBackgrounds') {
    certificateAttachmentRows.value = certificateAttachmentRows.value.filter((row) => !String(row.id).startsWith(`education:${id}:`));
  }
  if (listKey === 'personalHonors') {
    certificateAttachmentRows.value = certificateAttachmentRows.value.filter((row) => !String(row.id).startsWith(`honor:${id}:`));
  }
}

function addAttachment() {
  attachmentRows.value.push({ id: `att_${Date.now()}`, name: '', type: '其他附件', date: '2026-06-12', remark: '' });
}

function addCertificateAttachment() {
  certificateAttachmentRows.value.push({ id: `cert:${Date.now()}:custom`, name: '', type: '其他证书', date: '2026-06-12', remark: '' });
}

function removeAttachment(row: AttachmentRow) {
  attachmentRows.value = attachmentRows.value.filter((item) => item.id !== row.id);
}

function removeCertificateAttachment(row: AttachmentRow) {
  certificateAttachmentRows.value = certificateAttachmentRows.value.filter((item) => item.id !== row.id);
}

function isCertificateColumn(key: string) {
  return ['diploma', 'degreeCert', 'certificatePhoto'].includes(key);
}

function certificatePrompt() {
  note.value = '证书照片和证书附件请在“经历证书附件”表中维护，保存时会回写到对应经历字段。';
}

onMounted(loadData);
</script>

<template>
  <AwFormPage
    v-if="form"
    back-text="返回员工档案详情"
    :actions="[{ key: 'save', label: '保存', primary: true }]"
    @action="handleAction"
    @back="backToDetail"
  >
    <div v-if="note" class="aw-form-note hr-employee-archive-note">{{ note }}</div>

    <section class="aw-form-card">
      <h4>就职信息</h4>
      <div class="hr-employee-form-grid">
        <label><span>工号</span><input v-model="form.workNo" class="aw-input" /></label>
        <label><span>部门 *</span><AwSearchTriggerInput v-model="form.departmentName" readonly placeholder="请选择部门" @open="activePicker = 'dept'" /></label>
        <label><span>岗位</span><AwSearchTriggerInput v-model="form.postName" readonly placeholder="请选择岗位" @open="activePicker = 'post'" /></label>
        <label><span>直属上级</span><AwSearchTriggerInput v-model="form.leaderName" readonly placeholder="请选择直属上级" @open="showLeaderPicker = true" /></label>
        <label><span>入职日期 *</span><input v-model="form.entryTime" class="aw-input" type="date" /></label>
        <label><span>试用期(天)</span><input v-model.number="form.dayOfTrial" class="aw-input" type="number" /></label>
        <label><span>转正日期</span><input v-model="form.regularTime" class="aw-input" type="date" /></label>
        <label><span>离职日期</span><input v-model="form.leaveTime" class="aw-input" type="date" /></label>
        <label><span>在职状态</span><select v-model="form.workStatusText" class="aw-select"><option>试用期</option><option>已转正</option><option>离职</option></select></label>
        <label><span>试用期薪资</span><input v-model.number="form.trialSalary" class="aw-input" type="number" data-sensitive-field="trialSalary" /></label>
        <label><span>转正薪资</span><input v-model.number="form.salary" class="aw-input" type="number" data-sensitive-field="salary" /></label>
      </div>
    </section>

    <section class="aw-form-card">
      <h4>个人信息</h4>
      <div class="hr-employee-form-grid">
        <label><span>姓名 *</span><input v-model="form.name" class="aw-input" /></label>
        <label><span>性别 *</span><select v-model="form.sex" class="aw-select"><option>男</option><option>女</option></select></label>
        <label><span>出生日期</span><input v-model="form.birthday" class="aw-input" type="date" /></label>
        <label><span>手机号 *</span><input v-model="form.mobile" class="aw-input" data-sensitive-field="mobile" /></label>
        <label><span>证件类型</span><select v-model="form.cardType" class="aw-select"><option>身份证</option><option>护照</option><option>港澳通行证</option></select></label>
        <label><span>证件号码 *</span><input v-model="form.idCard" class="aw-input" data-sensitive-field="idCard" /></label>
        <label><span>现住地址</span><input v-model="form.nowAddress" class="aw-input" data-sensitive-field="nowAddress" /></label>
        <label><span>工资卡号</span><input v-model="form.bankAccountNo" class="aw-input" data-sensitive-field="bankAccountNo" /></label>
        <label><span>开户银行</span><input v-model="form.bankBranch" class="aw-input" /></label>
        <label><span>民族</span><input v-model="form.nation" class="aw-input" /></label>
        <label><span>籍贯</span><input v-model="form.native" class="aw-input" /></label>
        <label><span>从业时间</span><input v-model="form.yearsOfWorkExperience" class="aw-input" /></label>
        <label><span>最高学历</span><input v-model="form.qualification" class="aw-input" /></label>
        <label><span>微信号</span><input v-model="form.weichatCode" class="aw-input" /></label>
        <label><span>邮箱</span><input v-model="form.email" class="aw-input" /></label>
        <label><span>QQ号</span><input v-model="form.qqNumber" class="aw-input" /></label>
        <label><span>婚姻状况</span><select v-model="form.maritalStatus" class="aw-select"><option>未婚</option><option>已婚</option><option>其他</option></select></label>
      </div>
      <label class="hr-employee-textarea"><span>个人简介</span><textarea v-model="form.personalProfile" class="aw-textarea" /></label>
    </section>

    <section class="aw-form-card">
      <h4>照片与证件附件</h4>
      <AwAttachmentTable
        :rows="attachmentRows"
        :type-options="['个人照片', '身份证件', '其他附件']"
        add-text="新增附件"
        @add="addAttachment"
        @remove="removeAttachment"
      />
    </section>

    <section class="aw-form-card">
      <h4>紧急联系人</h4>
      <AwEditableSubTable :columns="emergencyColumns" :rows="form.emergencyContacts as EditableRow[]" add-text="新增联系人" @add="addRow('emergencyContacts')">
        <template #cell="{ column, row }"><input v-model="row[column.key]" class="aw-input" /></template>
        <template #actions="{ row }"><span class="aw-link danger" @click="removeRow('emergencyContacts', row.id)">删除</span></template>
      </AwEditableSubTable>
    </section>

    <section class="aw-form-card">
      <h4>教育经历</h4>
      <AwEditableSubTable :columns="educationColumns" :rows="form.educationalBackgrounds as EditableRow[]" add-text="新增教育经历" @add="addRow('educationalBackgrounds')">
        <template #cell="{ column, row }">
          <AwSearchTriggerInput v-if="isCertificateColumn(column.key)" v-model="row[column.key]" readonly placeholder="在证书附件表维护" @open="certificatePrompt" />
          <input v-else v-model="row[column.key]" class="aw-input" />
        </template>
        <template #actions="{ row }"><span class="aw-link danger" @click="removeRow('educationalBackgrounds', row.id)">删除</span></template>
      </AwEditableSubTable>
    </section>

    <section class="aw-form-card">
      <h4>工作经历</h4>
      <AwEditableSubTable :columns="workColumns" :rows="form.workExperiences as EditableRow[]" add-text="新增工作经历" @add="addRow('workExperiences')">
        <template #cell="{ column, row }"><input v-model="row[column.key]" class="aw-input" /></template>
        <template #actions="{ row }"><span class="aw-link danger" @click="removeRow('workExperiences', row.id)">删除</span></template>
      </AwEditableSubTable>
    </section>

    <section class="aw-form-card">
      <h4>项目经历</h4>
      <AwEditableSubTable :columns="projectColumns" :rows="form.projectExperiences as EditableRow[]" add-text="新增项目经历" @add="addRow('projectExperiences')">
        <template #cell="{ column, row }"><input v-model="row[column.key]" class="aw-input" /></template>
        <template #actions="{ row }"><span class="aw-link danger" @click="removeRow('projectExperiences', row.id)">删除</span></template>
      </AwEditableSubTable>
    </section>

    <section class="aw-form-card">
      <h4>专业技能</h4>
      <AwEditableSubTable :columns="skillColumns" :rows="form.personalSkills as EditableRow[]" add-text="新增技能" @add="addRow('personalSkills')">
        <template #cell="{ column, row }"><input v-model="row[column.key]" class="aw-input" /></template>
        <template #actions="{ row }"><span class="aw-link danger" @click="removeRow('personalSkills', row.id)">删除</span></template>
      </AwEditableSubTable>
    </section>

    <section class="aw-form-card">
      <h4>其他荣誉</h4>
      <AwEditableSubTable :columns="honorColumns" :rows="form.personalHonors as EditableRow[]" add-text="新增荣誉" @add="addRow('personalHonors')">
        <template #cell="{ column, row }">
          <AwSearchTriggerInput v-if="isCertificateColumn(column.key)" v-model="row[column.key]" readonly placeholder="在证书附件表维护" @open="certificatePrompt" />
          <input v-else v-model="row[column.key]" class="aw-input" />
        </template>
        <template #actions="{ row }"><span class="aw-link danger" @click="removeRow('personalHonors', row.id)">删除</span></template>
      </AwEditableSubTable>
    </section>

    <section class="aw-form-card">
      <h4>经历证书附件</h4>
      <AwAttachmentTable
        :rows="certificateAttachmentRows"
        :type-options="['学历证书', '学位证书', '荣誉证书', '其他证书']"
        add-text="新增证书附件"
        @add="addCertificateAttachment"
        @remove="removeCertificateAttachment"
      />
    </section>

    <AwOptionPickerModal
      :open="Boolean(activePicker)"
      :title="activePicker === 'dept' ? '选择部门' : '选择岗位'"
      :columns="optionColumns"
      :rows="optionRows"
      :categories="optionCategories"
      category-title="组织分类"
      @cancel="activePicker = ''"
      @confirm="confirmOption"
    />

    <AwPersonPickerModal
      :open="showLeaderPicker"
      title="选择直属上级"
      :depts="pickerDepts"
      @cancel="showLeaderPicker = false"
      @confirm="confirmLeader"
    />
  </AwFormPage>
</template>

<style scoped>
.hr-employee-archive-note {
  margin-bottom: 12px;
}

.hr-employee-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hr-employee-form-grid label,
.hr-employee-textarea {
  display: grid;
  gap: 6px;
}

.hr-employee-form-grid span,
.hr-employee-textarea span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.hr-employee-textarea {
  margin-top: 12px;
}

.hr-employee-textarea textarea {
  min-height: 86px;
  resize: vertical;
}

.danger {
  color: var(--aw-danger);
}

@media (max-width: 1100px) {
  .hr-employee-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
