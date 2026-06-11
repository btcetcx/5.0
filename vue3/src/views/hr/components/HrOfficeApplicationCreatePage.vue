<template>
  <aw-form-page
    back-text="返回人事办公"
    :actions="step === 2 ? formActions : []"
    @back="goBack"
    @action="handleAction"
  >
    <div class="qc-create-flow-form">
      <section class="aw-form-card">
        <div class="aw-detail-section-title">新增办公申请</div>
        <div class="qc-create-stepper">
          <button
            v-for="(label, index) in flowSteps"
            :key="label"
            type="button"
            :class="['qc-create-step', { on: step === index, done: index < step }]"
            @click="goStep(index)"
          >
            <span>{{ index + 1 }}</span>{{ label }}
          </button>
        </div>
      </section>

      <section v-if="step === 0" class="aw-form-card">
        <div class="aw-detail-section-title">选择事项类型</div>
        <div class="qc-create-type-grid">
          <button
            v-for="item in officeTypeCards"
            :key="item.key"
            type="button"
            :class="['qc-create-type-card', { on: selectedType === item.key }]"
            @click="selectType(item.key)"
          >
            <strong>{{ item.title }}<span>{{ item.code }}</span></strong>
            <em>{{ item.owner }}</em>
            <p>{{ item.desc }}</p>
          </button>
        </div>
        <div class="qc-create-step-actions right">
          <button class="aw-btn primary" type="button" @click="confirmType">确认类型</button>
        </div>
      </section>

      <section v-else-if="step === 1" class="aw-form-card">
        <div class="aw-detail-section-title">{{ selectedTypeCard.title }}申请信息</div>
        <div class="aw-form-grid">
          <div class="aw-field">
            <label class="req">申请主题</label>
            <input v-model="form.subject" class="aw-input" placeholder="请输入申请主题" />
          </div>
          <div class="aw-field">
            <label>申请单号</label>
            <input class="aw-input" value="系统自动生成" disabled />
          </div>
          <div class="aw-field">
            <label class="req">申请人</label>
            <input v-model="form.applicant" class="aw-input" placeholder="请输入申请人" />
          </div>
          <div class="aw-field">
            <label>所属部门</label>
            <select v-model="form.department" class="aw-select">
              <option v-for="item in departmentOptions" :key="item">{{ item }}</option>
            </select>
          </div>
          <div class="aw-field">
            <label>申请日期</label>
            <input v-model="form.date" class="aw-input" type="date" />
          </div>
        </div>
        <div class="qc-create-step-actions">
          <button class="aw-btn" type="button" @click="step = 0">上一步</button>
          <button class="aw-btn primary" type="button" @click="step = 2">下一步</button>
        </div>
      </section>

      <template v-else>
      <section class="aw-form-card">
        <div class="aw-detail-section-title">{{ selectedTypeCard.title }}信息</div>
        <div class="aw-form-grid">
          <div v-for="field in activeFields" :key="field.key" class="aw-field">
            <label :class="{ req: field.required }">{{ field.label }}</label>
            <select v-if="field.type === 'select'" v-model="typeValues[field.key]" class="aw-select">
              <option value="">请选择</option>
              <option v-for="option in field.options || []" :key="option">{{ option }}</option>
            </select>
            <textarea v-else-if="field.type === 'textarea'" v-model="typeValues[field.key]" class="aw-input hr-office-textarea" :placeholder="field.placeholder || `请输入${field.label}`" />
            <input v-else v-model="typeValues[field.key]" class="aw-input" :type="field.type" :placeholder="field.placeholder || `请输入${field.label}`" />
          </div>
        </div>
      </section>

      <section class="aw-form-card">
        <div class="aw-detail-section-title">附件</div>
        <aw-attachment-table
          :rows="attachments"
          :type-options="attachmentTypes"
          add-text="新增附件"
          allow-remove-last
          @add="addAttachment"
          @remove="removeAttachment"
          @upload="uploadAttachment"
        />
      </section>

      <section class="aw-form-card">
        <div class="aw-detail-section-title">申请说明</div>
        <aw-rich-text-editor v-model="remark" />
      </section>
      <div class="qc-create-step-actions">
        <button class="aw-btn" type="button" @click="step = 1">上一步</button>
      </div>
      </template>
    </div>

    <div v-if="message" class="aw-form-note">{{ message }}</div>
  </aw-form-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createHrRecord } from '@/app/api/hr/resources';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import type { AttachmentRow, FormAction } from '@/components/form-page/types';

type OfficeType = 'certificate' | 'goods' | 'seal' | 'car';
type OfficeField = {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'time' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

const router = useRouter();
const step = ref(0);
const selectedType = ref<OfficeType>('certificate');
const message = ref('');
const remark = ref('');
const typeValues = reactive<Record<string, string>>({});
const form = reactive({
  subject: '',
  applicant: '老人事',
  department: '人事部',
  date: '2026-05-30',
});

const flowSteps = ['选择事项类型', '填写申请信息', '申请明细'];
const officeTypeCards: Array<{ key: OfficeType; title: string; code: string; desc: string; owner: string }> = [
  { key: 'certificate', title: '证明开具', code: 'HR-CERT', desc: '在职、收入、任职等证明材料开具申请。', owner: '人事受理' },
  { key: 'goods', title: '物品领用', code: 'HR-GOODS', desc: '办公用品、工牌、设备配件等领用登记。', owner: '行政办理' },
  { key: 'seal', title: '用印申请', code: 'HR-SEAL', desc: '公章、合同章、部门章等用印审批。', owner: '行政审核' },
  { key: 'car', title: '用车申请', code: 'HR-CAR', desc: '公务用车、外出接送、临时车辆协调。', owner: '后勤调度' },
];
const departmentOptions = ['人事部', '销售部', '研发部', '财务部', '仓储部'];
const attachmentTypes = ['申请材料', '审批附件', '证明材料', '其他'];
const fieldMap: Record<OfficeType, OfficeField[]> = {
  certificate: [
    { key: 'certificateType', label: '证明类型', type: 'select', required: true, options: ['在职证明', '收入证明', '任职证明', '离职证明'] },
    { key: 'receiver', label: '接收单位', type: 'text', placeholder: '请输入接收单位或用途对象' },
    { key: 'copies', label: '开具份数', type: 'number', required: true, placeholder: '请输入份数' },
    { key: 'expectedDate', label: '期望完成日期', type: 'date', required: true },
    { key: 'purpose', label: '用途说明', type: 'textarea', required: true, placeholder: '请输入证明用途' },
  ],
  goods: [
    { key: 'goodsName', label: '领用物品', type: 'text', required: true, placeholder: '如电脑配件、工牌、办公用品' },
    { key: 'spec', label: '规格型号', type: 'text' },
    { key: 'quantity', label: '领用数量', type: 'number', required: true },
    { key: 'useDate', label: '期望领用日期', type: 'date', required: true },
    { key: 'purpose', label: '领用原因', type: 'textarea', required: true },
  ],
  seal: [
    { key: 'sealType', label: '印章类型', type: 'select', required: true, options: ['公章', '合同章', '财务章', '部门章'] },
    { key: 'documentName', label: '用印文件', type: 'text', required: true, placeholder: '请输入文件名称' },
    { key: 'counterparty', label: '对方单位', type: 'text' },
    { key: 'copies', label: '文件份数', type: 'number', required: true },
    { key: 'sealDate', label: '用印日期', type: 'date', required: true },
    { key: 'carryOut', label: '是否外带', type: 'select', options: ['否', '是'] },
    { key: 'purpose', label: '用印用途', type: 'textarea', required: true },
  ],
  car: [
    { key: 'useDate', label: '用车日期', type: 'date', required: true },
    { key: 'startTime', label: '出发时间', type: 'time', required: true },
    { key: 'returnTime', label: '预计返回', type: 'time' },
    { key: 'departure', label: '出发地', type: 'text', required: true },
    { key: 'destination', label: '目的地', type: 'text', required: true },
    { key: 'passengers', label: '随行人数', type: 'number' },
    { key: 'carRequirement', label: '车辆需求', type: 'select', options: ['普通公务车', '商务车', '司机随行', '临时协调'] },
    { key: 'purpose', label: '用车事由', type: 'textarea', required: true },
  ],
};
const attachments = ref<AttachmentRow[]>([{ id: 1, name: '', type: attachmentTypes[0], date: '2026-05-30', remark: '' }]);

const selectedTypeCard = computed(() => officeTypeCards.find((item) => item.key === selectedType.value) || officeTypeCards[0]);
const activeFields = computed(() => fieldMap[selectedType.value]);
const formActions = computed<FormAction[]>(() => (
  [
    { key: 'draft', label: '保存草稿' },
    { key: 'submit', label: '提交审批', primary: true },
  ]
));

watch(selectedType, resetTypeValues, { immediate: true });

function selectType(type: OfficeType) {
  selectedType.value = type;
  message.value = '';
}

function confirmType() {
  step.value = 1;
  form.subject = form.subject || `${selectedTypeCard.value.title}申请`;
}

function goStep(index: number) {
  if (index === 0 || selectedType.value) step.value = index;
}

function resetTypeValues() {
  Object.keys(typeValues).forEach((key) => delete typeValues[key]);
  activeFields.value.forEach((field) => {
    typeValues[field.key] = field.options?.[0] || '';
  });
}

function handleAction(key: string) {
  void saveApplication(key);
}

function goBack() {
  if (step.value > 0) {
    step.value -= 1;
    return;
  }
  router.push('/hr/office');
}

function addAttachment() {
  attachments.value.push({ id: Date.now(), name: '', type: attachmentTypes[0], date: '2026-05-30', remark: '' });
}

function removeAttachment(row: AttachmentRow) {
  attachments.value = attachments.value.filter((item) => item.id !== row.id);
}

function uploadAttachment(row: AttachmentRow) {
  message.value = `${row.name || '附件'} 已触发上传。`;
}

async function saveApplication(key: string) {
  const status = key === 'draft' ? '草稿' : '审批中';
  const saved = await createHrRecord('hr-office', {
    subject: form.subject || `${selectedTypeCard.value.title}申请`,
    party: form.applicant,
    amount: selectedTypeCard.value.title,
    done: form.department,
    left: typeValues.purpose || selectedTypeCard.value.desc,
    date: form.date,
    status,
    group: selectedTypeCard.value.title,
    owner: form.applicant,
    typeValues: { ...typeValues },
    attachments: attachments.value,
    remark: remark.value,
  });
  message.value = key === 'draft' ? '草稿已保存。' : '已提交审批。';
  router.push(`/hr/office?id=${encodeURIComponent(saved.id)}`);
}
</script>

<style scoped>
.qc-create-flow-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qc-create-stepper {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.qc-create-step {
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

.qc-create-step span {
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

.qc-create-step.on {
  background: var(--aw-primary-soft);
  border-color: var(--aw-primary);
  color: var(--aw-primary);
  font-weight: 600;
}

.qc-create-step.on span,
.qc-create-step.done span {
  background: var(--aw-primary);
  color: #fff;
}

.qc-create-type-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.qc-create-type-card {
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

.qc-create-type-card strong {
  align-items: center;
  color: var(--aw-fg-1);
  display: flex;
  font-size: 15px;
  gap: 8px;
  justify-content: space-between;
}

.qc-create-type-card strong span {
  background: var(--aw-primary-soft);
  border-radius: 999px;
  color: var(--aw-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
}

.qc-create-type-card em {
  font-style: normal;
  font-size: 12px;
  color: var(--aw-primary);
}

.qc-create-type-card p {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
}

.qc-create-type-card.on,
.qc-create-type-card:hover {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px var(--aw-primary-soft);
}

.qc-create-step-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  margin-top: 14px;
}

.qc-create-step-actions.right {
  justify-content: flex-end;
}

.hr-office-textarea {
  min-height: 72px;
  resize: vertical;
}

@media (max-width: 1024px) {
  .qc-create-stepper,
  .qc-create-type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
