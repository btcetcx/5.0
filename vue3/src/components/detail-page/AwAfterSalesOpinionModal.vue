<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  AfterSalesOpinionDocument,
  AfterSalesOpinionMethod,
  AfterSalesOpinionPayload,
  AuditDocumentSummary,
} from './types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    document: AuditDocumentSummary;
    methods: AfterSalesOpinionMethod[];
    documentMap: Record<string, string[]>;
    existingDocuments?: AfterSalesOpinionDocument[];
    defaultMethod?: string;
  }>(),
  {
    title: '处理意见',
    existingDocuments: () => [],
    defaultMethod: '',
  },
);

const emit = defineEmits<{
  cancel: [];
  confirm: [payload: AfterSalesOpinionPayload];
}>();

const selectedMethod = ref('');
const opinion = ref('');

const currentMethod = computed(() => props.methods.find((item) => item.method === selectedMethod.value) || props.methods[0]);
const requiredTypes = computed(() => props.documentMap[selectedMethod.value] || []);
const documentRows = computed<AfterSalesOpinionDocument[]>(() => requiredTypes.value.map((type) => {
  const existing = props.existingDocuments.find((item) => item.type === type);
  if (existing) return existing;
  return {
    type,
    code: '确认后生成',
    ownerName: ownerForType(type),
    status: initialStatusForType(type),
  };
}));
const confirmDisabled = computed(() => !selectedMethod.value || !opinion.value.trim());

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    selectedMethod.value = props.defaultMethod || props.methods[0]?.method || '';
    opinion.value = '';
  },
  { immediate: true },
);

function ownerForType(type: string) {
  if (type.includes('付款') || type.includes('应收') || type.includes('发票')) return '财务部';
  if (type.includes('服务')) return '服务部';
  if (type.includes('质量')) return '质量部';
  return '仓储部';
}

function initialStatusForType(type: string) {
  if (type.includes('入库')) return '待入库';
  if (type.includes('出库')) return '待出库';
  if (type.includes('付款')) return '待审核';
  if (type.includes('应收')) return '待调整';
  if (type.includes('发票')) return '待红冲';
  if (type.includes('服务')) return '待派工';
  return '待处理';
}

function confirm() {
  if (confirmDisabled.value) return;
  emit('confirm', {
    method: selectedMethod.value,
    opinion: opinion.value.trim(),
    documents: documentRows.value.map((item) => ({ ...item })),
  });
}
</script>

<template>
  <div v-if="open" class="aw-modal-mask">
    <div class="aw-modal aw-after-sales-opinion-modal">
      <div class="aw-modal-head">
        <strong>{{ title }}</strong>
        <button class="aw-modal-close" type="button" @click="emit('cancel')">×</button>
      </div>

      <div class="aw-after-sales-opinion-body">
        <section class="aw-after-sales-opinion-summary">
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

        <section class="aw-after-sales-opinion-section">
          <div class="aw-after-sales-opinion-label">处理方式</div>
          <div class="aw-after-sales-method-list">
            <button
              v-for="item in methods"
              :key="item.method"
              :class="['aw-after-sales-method', { on: selectedMethod === item.method }]"
              type="button"
              @click="selectedMethod = item.method"
            >
              <strong>{{ item.name }}</strong>
              <span>{{ item.scene }} · {{ item.linkage }}</span>
            </button>
          </div>
        </section>

        <section class="aw-after-sales-opinion-section">
          <div class="aw-after-sales-opinion-label">后续单据</div>
          <div class="aw-after-sales-doc-table">
            <div class="head">
              <span>序号</span>
              <span>单据类型</span>
              <span>单据编号</span>
              <span>负责部门</span>
              <span>初始状态</span>
            </div>
            <div v-for="(row, index) in documentRows" :key="`${row.type}-${index}`" class="row">
              <span>{{ index + 1 }}</span>
              <strong>{{ row.type }}</strong>
              <span>{{ row.code || '确认后生成' }}</span>
              <span>{{ row.ownerName || ownerForType(row.type) }}</span>
              <span class="aw-status yellow">{{ row.status || initialStatusForType(row.type) }}</span>
            </div>
            <div v-if="!documentRows.length" class="empty">当前处理方式无需生成后续单据</div>
          </div>
          <p v-if="currentMethod" class="aw-after-sales-opinion-hint">
            来源：售后设置 - 处理方式 - {{ currentMethod.name }}
          </p>
        </section>

        <section class="aw-after-sales-opinion-section">
          <label class="aw-field">
            <span class="req">处理意见</span>
            <textarea
              v-model="opinion"
              class="aw-input aw-after-sales-opinion-textarea"
              placeholder="填写本次处理意见、执行要求或生成后续单据的说明。"
            />
          </label>
        </section>
      </div>

      <div class="aw-modal-foot">
        <button class="aw-tool-btn" type="button" @click="emit('cancel')">取消</button>
        <button class="aw-btn primary" type="button" :disabled="confirmDisabled" @click="confirm">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aw-after-sales-opinion-modal {
  width: min(860px, calc(100vw - 56px));
}

.aw-after-sales-opinion-body {
  display: grid;
  gap: 16px;
  max-height: min(640px, calc(100vh - 180px));
  overflow: auto;
  padding: 18px;
}

.aw-after-sales-opinion-summary {
  background: var(--aw-surface-2);
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 12px 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 14px;
}

.aw-after-sales-opinion-summary div,
.aw-after-sales-opinion-section {
  display: grid;
  gap: 8px;
}

.aw-after-sales-opinion-summary span,
.aw-after-sales-opinion-label,
.aw-after-sales-opinion-hint {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.aw-after-sales-opinion-summary strong {
  color: var(--aw-fg-1);
  font-size: 13px;
  font-weight: 600;
}

.aw-after-sales-method-list {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.aw-after-sales-method {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 6px;
  min-height: 70px;
  padding: 12px;
  text-align: left;
}

.aw-after-sales-method.on {
  background: #eef4ff;
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 1px rgba(70, 104, 255, 0.18);
}

.aw-after-sales-method strong {
  color: var(--aw-fg-1);
  font-size: 14px;
}

.aw-after-sales-method span {
  color: var(--aw-fg-3);
  font-size: 12px;
  line-height: 1.5;
}

.aw-after-sales-doc-table {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  overflow: hidden;
}

.aw-after-sales-doc-table .head,
.aw-after-sales-doc-table .row {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: 64px minmax(130px, 1fr) minmax(140px, 1fr) 110px 110px;
  min-height: 42px;
  padding: 0 12px;
}

.aw-after-sales-doc-table .head {
  background: var(--aw-surface-2);
  color: var(--aw-fg-3);
  font-size: 12px;
}

.aw-after-sales-doc-table .row {
  border-top: 1px solid var(--aw-border);
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-after-sales-doc-table .empty {
  color: var(--aw-fg-3);
  font-size: 13px;
  padding: 18px;
  text-align: center;
}

.aw-after-sales-opinion-hint {
  margin: 0;
}

.aw-after-sales-opinion-textarea {
  min-height: 104px;
  resize: vertical;
}

@media (max-width: 760px) {
  .aw-after-sales-opinion-summary,
  .aw-after-sales-method-list {
    grid-template-columns: 1fr;
  }

  .aw-after-sales-doc-table {
    overflow-x: auto;
  }

  .aw-after-sales-doc-table .head,
  .aw-after-sales-doc-table .row {
    min-width: 680px;
  }
}
</style>
