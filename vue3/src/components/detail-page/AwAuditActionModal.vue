<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import type { AuditActionOption, AuditActionPayload, AuditApprovalNode, AuditApprovalNodeState, AuditDocumentSummary } from './types';
import type { PersonPickerDept, PersonPickerPerson } from '@/components/setting-page/types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    document: AuditDocumentSummary;
    actions?: AuditActionOption[];
    approvalNodes?: AuditApprovalNode[];
    personDepts?: PersonPickerDept[];
    defaultAction?: string;
    opinionLabel?: string;
    ccPlaceholder?: string;
  }>(),
  {
    title: '审核处理',
    actions: () => [
      { key: 'approve', label: '审核通过', tone: 'primary', placeholder: '填写通过意见，说明确认依据或后续要求。' },
      { key: 'reject', label: '审核驳回', tone: 'danger', requireOpinion: true, placeholder: '请填写驳回原因和需要补充的内容。' },
      { key: 'return', label: '退回修改', tone: 'warning', requireOpinion: true, placeholder: '请填写退回节点和修改要求。' },
      { key: 'transfer', label: '转交处理', requireOpinion: true, placeholder: '请填写转交原因和交接说明。' },
    ],
    approvalNodes: () => [],
    personDepts: () => [
      {
        key: 'sales',
        label: '业务中心',
        persons: [
          { id: 'YW001', name: '老夏', role: '售后主管', phone: '13888888888' },
          { id: 'YW002', name: '李文涛', role: '业务经理', phone: '13700137003' },
        ],
      },
      {
        key: 'finance',
        label: '财务中心',
        persons: [
          { id: 'CW001', name: '王会计', role: '财务审核', phone: '13666666666' },
        ],
      },
    ],
    defaultAction: '',
    opinionLabel: '处理意见',
    ccPlaceholder: '填写抄送人，多个用逗号分隔',
  },
);

const emit = defineEmits<{
  cancel: [];
  confirm: [payload: AuditActionPayload];
}>();

const action = ref('');
const opinion = ref('');
const transferTo = ref('');
const ccTo = ref('');
const personPickerOpen = ref(false);
const personPickerTarget = ref<'transfer' | 'cc'>('transfer');
const pickedTransferPeople = ref<PersonPickerPerson[]>([]);
const pickedCcPeople = ref<PersonPickerPerson[]>([]);

const selectedAction = computed(() => props.actions.find((item) => item.key === action.value) || props.actions[0]);
const requiresOpinion = computed(() => Boolean(selectedAction.value?.requireOpinion));
const showTransferFields = computed(() => action.value === 'transfer' || action.value === 'countersign');
const confirmDisabled = computed(() => requiresOpinion.value && !opinion.value.trim());
const approvalNodes = computed(() => props.approvalNodes);
const hasApprovalNodes = computed(() => approvalNodes.value.length > 0);
const visibleApprovalNodes = computed(() => {
  const nodes = approvalNodes.value;
  if (nodes.length <= 3) return nodes.map((node, index) => ({ node, index }));
  const currentIndex = Math.max(0, nodes.findIndex((node) => node.state === 'current'));
  let start = currentIndex - 1;
  if (start < 0) start = 0;
  if (start + 3 > nodes.length) start = nodes.length - 3;
  return nodes.slice(start, start + 3).map((node, offset) => ({ node, index: start + offset }));
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    action.value = props.defaultAction || props.actions[0]?.key || 'approve';
    opinion.value = '';
    transferTo.value = '';
    ccTo.value = '';
    personPickerOpen.value = false;
    pickedTransferPeople.value = [];
    pickedCcPeople.value = [];
  },
  { immediate: true },
);

const personPickerTitle = computed(() => (personPickerTarget.value === 'transfer' ? '选择转交/加签人' : '选择抄送人'));
const personPickerPicked = computed(() => (personPickerTarget.value === 'transfer' ? pickedTransferPeople.value : pickedCcPeople.value));

function openPersonPicker(target: 'transfer' | 'cc') {
  personPickerTarget.value = target;
  personPickerOpen.value = true;
}

function confirmPeople(persons: PersonPickerPerson[]) {
  if (personPickerTarget.value === 'transfer') {
    pickedTransferPeople.value = persons;
    transferTo.value = persons.map((person) => person.name).join('、');
  } else {
    pickedCcPeople.value = persons;
    ccTo.value = persons.map((person) => person.name).join('、');
  }
  personPickerOpen.value = false;
}

function removePickedPerson(target: 'transfer' | 'cc', id: string) {
  if (target === 'transfer') {
    pickedTransferPeople.value = pickedTransferPeople.value.filter((person) => person.id !== id);
    transferTo.value = pickedTransferPeople.value.map((person) => person.name).join('、');
    return;
  }
  pickedCcPeople.value = pickedCcPeople.value.filter((person) => person.id !== id);
  ccTo.value = pickedCcPeople.value.map((person) => person.name).join('、');
}

function confirm() {
  if (confirmDisabled.value) return;
  emit('confirm', {
    action: action.value,
    opinion: opinion.value.trim(),
    transferTo: transferTo.value.trim(),
    ccTo: ccTo.value.trim(),
  });
}

function nodeStateText(state: AuditApprovalNodeState) {
  const map: Record<AuditApprovalNodeState, string> = {
    done: '已审核',
    current: '当前审核',
    pending: '待审核',
    rejected: '已驳回',
  };
  return map[state];
}
</script>

<template>
  <div v-if="open" class="aw-modal-mask">
    <div class="aw-modal aw-audit-modal">
      <div class="aw-modal-head">
        <strong>{{ title }}</strong>
        <button class="aw-modal-close" type="button" @click="emit('cancel')">×</button>
      </div>

      <div class="aw-audit-body">
        <section class="aw-audit-summary">
          <div>
            <span>单据名称</span>
            <strong>{{ document.title }}</strong>
          </div>
          <div>
            <span>单据编号</span>
            <strong>{{ document.code }}</strong>
          </div>
          <div>
            <span>当前状态</span>
            <strong>{{ document.status || '-' }}</strong>
          </div>
          <div>
            <span>当前节点</span>
            <strong>{{ document.currentNode || document.flowName || '-' }}</strong>
          </div>
        </section>

        <section v-if="hasApprovalNodes" class="aw-audit-section">
          <div class="aw-audit-label">审批节点</div>
          <div class="aw-audit-stepper">
            <div
              v-for="{ node, index } in visibleApprovalNodes"
              :key="`${node.name}-${index}`"
              :class="['aw-audit-step', node.state, { done: node.state === 'done' }]"
              :title="`${node.name}：${node.result || nodeStateText(node.state)}`"
            >
              <span>{{ index + 1 }}</span>
              <strong>{{ node.name }}</strong>
              <em>{{ node.result || nodeStateText(node.state) }}</em>
            </div>
          </div>
        </section>

        <section class="aw-audit-section">
          <div class="aw-audit-label">处理动作</div>
          <div class="aw-audit-actions">
            <button
              v-for="item in actions"
              :key="item.key"
              :class="['aw-audit-action', item.tone || 'normal', { on: action === item.key }]"
              type="button"
              @click="action = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </section>

        <section class="aw-audit-grid">
          <label v-if="showTransferFields" class="aw-field">
            <span>转交/加签人</span>
            <div class="aw-audit-picker-input" @click="openPersonPicker('transfer')">
              <div class="aw-input aw-audit-people-input">
                <template v-if="pickedTransferPeople.length">
                  <span v-for="person in pickedTransferPeople" :key="person.id" class="aw-audit-person-chip">
                    {{ person.name }}
                    <button type="button" @click.stop="removePickedPerson('transfer', person.id)">×</button>
                  </span>
                </template>
                <span v-else class="aw-audit-placeholder">点击选择转交或加签人</span>
              </div>
              <button class="aw-audit-picker-icon" type="button" @click.stop="openPersonPicker('transfer')">
                <span class="aw-line-icon line-search"></span>
              </button>
            </div>
          </label>
          <label v-if="showTransferFields" class="aw-field">
            <span>抄送人</span>
            <div class="aw-audit-picker-input" @click="openPersonPicker('cc')">
              <div class="aw-input aw-audit-people-input">
                <template v-if="pickedCcPeople.length">
                  <span v-for="person in pickedCcPeople" :key="person.id" class="aw-audit-person-chip">
                    {{ person.name }}
                    <button type="button" @click.stop="removePickedPerson('cc', person.id)">×</button>
                  </span>
                </template>
                <span v-else class="aw-audit-placeholder">{{ ccPlaceholder }}</span>
              </div>
              <button class="aw-audit-picker-icon" type="button" @click.stop="openPersonPicker('cc')">
                <span class="aw-line-icon line-search"></span>
              </button>
            </div>
          </label>
        </section>

        <section class="aw-audit-section">
          <label class="aw-field">
            <span :class="{ req: requiresOpinion }">{{ opinionLabel }}</span>
            <textarea v-model="opinion" class="aw-input aw-audit-textarea" :placeholder="selectedAction?.placeholder || '填写处理意见'" />
          </label>
        </section>
      </div>

      <div class="aw-modal-foot">
        <button class="aw-tool-btn" type="button" @click="emit('cancel')">取消</button>
        <button class="aw-btn primary" type="button" :disabled="confirmDisabled" @click="confirm">确定</button>
      </div>
    </div>

    <AwPersonPickerModal
      :open="personPickerOpen"
      :title="personPickerTitle"
      :depts="personDepts"
      :picked="personPickerPicked"
      @cancel="personPickerOpen = false"
      @confirm="confirmPeople"
    />
  </div>
</template>

<style scoped>
.aw-audit-modal {
  width: min(760px, calc(100vw - 56px));
}

.aw-audit-body {
  display: grid;
  gap: 16px;
  overflow: auto;
  padding: 18px;
}

.aw-audit-summary {
  background: var(--aw-surface-2);
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 12px 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 14px;
}

.aw-audit-summary div,
.aw-audit-section {
  display: grid;
  gap: 8px;
}

.aw-audit-summary span,
.aw-audit-label {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.aw-audit-summary strong {
  color: var(--aw-fg-1);
  font-size: 13px;
  font-weight: 600;
}

.aw-audit-stepper {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.aw-audit-step {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-fg-2);
  display: grid;
  gap: 2px 8px;
  grid-template-columns: 20px minmax(0, 1fr);
  min-height: 42px;
  padding: 5px 10px;
}

.aw-audit-step span {
  align-items: center;
  align-self: center;
  background: var(--aw-surface-2);
  border-radius: 50%;
  color: var(--aw-fg-3);
  display: inline-flex;
  font-size: 12px;
  height: 20px;
  justify-content: center;
  width: 20px;
}

.aw-audit-step strong,
.aw-audit-step em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-audit-step strong {
  color: var(--aw-fg-1);
  font-size: 12px;
  font-weight: 600;
}

.aw-audit-step em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
  grid-column: 2;
}

.aw-audit-step.current {
  background: var(--aw-primary-soft);
  border-color: var(--aw-primary);
  color: var(--aw-primary);
}

.aw-audit-step.current span,
.aw-audit-step.done span {
  background: var(--aw-primary);
  color: #fff;
}

.aw-audit-step.done {
  border-color: #16a34a;
}

.aw-audit-step.done em {
  color: #16a34a;
}

.aw-audit-step.rejected {
  background: #fff1f0;
  border-color: var(--aw-danger);
}

.aw-audit-step.rejected span {
  background: var(--aw-danger);
  color: #fff;
}

.aw-audit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.aw-audit-action {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-fg-2);
  cursor: pointer;
  height: 34px;
  padding: 0 14px;
}

.aw-audit-action.on {
  border-color: var(--aw-primary);
  color: var(--aw-primary);
  font-weight: 600;
}

.aw-audit-action.danger.on {
  border-color: var(--aw-danger);
  color: var(--aw-danger);
}

.aw-audit-action.warning.on {
  border-color: #f59e0b;
  color: #b45309;
}

.aw-audit-grid {
  display: grid;
  gap: 14px 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.aw-audit-picker-input {
  cursor: pointer;
  position: relative;
}

.aw-audit-picker-input .aw-input {
  cursor: pointer;
  padding-right: 38px;
}

.aw-audit-people-input {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 36px;
  padding-bottom: 4px;
  padding-top: 4px;
}

.aw-audit-placeholder {
  color: var(--aw-fg-3);
}

.aw-audit-person-chip {
  align-items: center;
  background: var(--aw-primary-soft);
  border-radius: 999px;
  color: var(--aw-primary);
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  gap: 4px;
  height: 24px;
  padding: 0 7px 0 9px;
}

.aw-audit-person-chip button {
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  height: 16px;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 16px;
}

.aw-audit-person-chip button:hover {
  color: var(--aw-danger);
}

.aw-audit-picker-icon {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--aw-fg-3);
  cursor: pointer;
  display: inline-flex;
  height: 30px;
  justify-content: center;
  position: absolute;
  right: 4px;
  top: 4px;
  width: 30px;
}

.aw-audit-picker-icon:hover {
  color: var(--aw-primary);
}

.aw-audit-full {
  grid-column: 1 / -1;
}

.aw-audit-textarea {
  min-height: 108px;
  resize: vertical;
}

@media (max-width: 760px) {
  .aw-audit-summary,
  .aw-audit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
