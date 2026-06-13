<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { ApprovalMethod, ApprovalNode, PersonPickerDept } from './types';

const props = defineProps<{
  name: string;
  nodes: ApprovalNode[];
  methods: ApprovalMethod[];
  activeIndex?: number;
  personDepts?: PersonPickerDept[];
}>();

const emit = defineEmits<{
  (event: 'add-node'): void;
  (event: 'pick-person', index: number): void;
  (event: 'remove-node', index: number): void;
  (event: 'remove-person', index: number, name: string): void;
  (event: 'select-node', index: number): void;
  (event: 'update:name', value: string): void;
  (event: 'update-node', index: number, node: ApprovalNode): void;
}>();

const drawerOpen = ref(false);
const activeDrawerTab = ref<'approvers' | 'method' | 'reverse'>('approvers');
const pendingOpenNewNode = ref(false);
const reverseReturnOptions: NonNullable<ApprovalNode['reverseReturnNode']>[] = ['上一步', '发起人', '自由选择'];
const drawerTabs = [
  { key: 'approvers', label: '审批人' },
  { key: 'method', label: '审批方式' },
  { key: 'reverse', label: '反审核设置' },
] as const;

const activeNodeIndex = computed(() => {
  const index = props.activeIndex ?? -1;
  return index >= 0 && index < props.nodes.length ? index : -1;
});

const activeNode = computed(() => (activeNodeIndex.value >= 0 ? props.nodes[activeNodeIndex.value] : null));
const activeNodeTitle = computed(() => activeNode.value?.name || `节点 ${activeNodeIndex.value + 1}`);
const personLookup = computed(() => {
  const entries = (props.personDepts || []).flatMap((dept) => dept.persons.map((person) => [person.name, person] as const));
  return new Map(entries);
});
const activeApproverRows = computed(() => (activeNode.value?.approvers || []).map((name) => {
  const person = personLookup.value.get(name);
  return {
    name,
    role: person?.role || person?.dept || '-',
    phone: person?.phone || '-',
  };
}));

function openNode(index: number) {
  emit('select-node', index);
  drawerOpen.value = true;
  activeDrawerTab.value = 'approvers';
}

function addNode() {
  pendingOpenNewNode.value = true;
  activeDrawerTab.value = 'approvers';
  emit('add-node');
}

function closeDrawer() {
  drawerOpen.value = false;
}

function updateNode(index: number, patch: Partial<ApprovalNode>) {
  emit('update-node', index, { ...props.nodes[index], ...patch });
}

function updateActiveNode(patch: Partial<ApprovalNode>) {
  if (activeNodeIndex.value < 0) return;
  updateNode(activeNodeIndex.value, patch);
}

watch(
  () => props.nodes.length,
  async (length, oldLength) => {
    if (!pendingOpenNewNode.value || length <= oldLength) return;
    const newIndex = length - 1;
    await nextTick();
    emit('select-node', newIndex);
    drawerOpen.value = true;
    pendingOpenNewNode.value = false;
  },
);
</script>

<template>
  <section class="aw-form-card aw-approval-editor">
    <div class="aw-detail-section-title">审批规则设置</div>
    <div class="aw-approval-basic-grid">
      <label class="aw-field">
        <span><b>*</b>流程名称</span>
        <input :value="name" placeholder="请输入流程名称" @input="emit('update:name', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>
    <div class="aw-detail-section-title">审批节点</div>
    <div class="aw-approval-flow-strip">
      <template v-for="(node, index) in nodes" :key="index">
        <div v-if="index > 0" class="aw-approval-arrow">→</div>
        <div :class="['aw-approval-card', { on: activeIndex === index }]" @click="openNode(index)">
          <button class="aw-approval-remove" type="button" @click.stop="emit('remove-node', index)">×</button>
          <div class="aw-approval-card-title">节点 {{ index + 1 }}</div>
          <div class="aw-approval-summary-name">{{ node.name || `节点 ${index + 1}` }}</div>
          <div class="aw-approval-summary-list">
            <div>
              <span>审批人</span>
              <strong>{{ node.approvers.length ? `${node.approvers.length} 人` : '未设置' }}</strong>
            </div>
            <div>
              <span>审批方式</span>
              <strong>{{ node.method || '未设置' }}</strong>
            </div>
            <div>
              <span>反审核</span>
              <strong :class="node.allowReverseAudit ? 'ok' : ''">{{ node.allowReverseAudit ? '允许' : '不允许' }}</strong>
            </div>
          </div>
        </div>
      </template>
      <button class="aw-approval-add-card" type="button" @click="addNode">+ 添加节点</button>
    </div>
  </section>

  <template v-if="drawerOpen && activeNode">
    <div class="aw-approval-drawer-mask" @click="closeDrawer" />
    <aside class="aw-approval-drawer">
      <div class="aw-approval-drawer-head">
        <span class="aw-approval-drawer-mark" />
        <div>
          <div class="aw-approval-drawer-title">节点属性配置</div>
          <div class="aw-approval-drawer-sub">节点 {{ activeNodeIndex + 1 }} · {{ activeNodeTitle }}</div>
        </div>
        <button class="aw-approval-drawer-close" type="button" @click="closeDrawer">×</button>
      </div>

      <div class="aw-approval-drawer-body">
        <section class="aw-approval-prop-section">
          <div class="aw-approval-prop-title">基础属性</div>
          <label class="aw-approval-prop-row">
            <span>节点名称</span>
            <input
              :value="activeNode.name"
              class="aw-approval-drawer-input"
              placeholder="填写审批节点名称"
              @input="updateActiveNode({ name: ($event.target as HTMLInputElement).value })"
            />
          </label>
        </section>

        <div class="aw-tabs aw-approval-drawer-tabs">
          <button
            v-for="tab in drawerTabs"
            :key="tab.key"
            :class="['t', { on: activeDrawerTab === tab.key }]"
            type="button"
            @click="activeDrawerTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <section v-if="activeDrawerTab === 'approvers'" class="aw-approval-prop-section">
          <div class="aw-approval-prop-title">审批人</div>
          <div class="aw-approval-people-head">
            <span>已选择 {{ activeNode.approvers.length }} 人</span>
            <button class="aw-tool-btn" type="button" @click="emit('pick-person', activeNodeIndex)">选择审批人</button>
          </div>
          <div v-if="activeApproverRows.length" class="aw-approval-people-table-wrap">
            <table class="aw-approval-people-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>职位</th>
                  <th>联系方式</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="person in activeApproverRows" :key="person.name">
                  <td>{{ person.name }}</td>
                  <td>{{ person.role }}</td>
                  <td>{{ person.phone }}</td>
                  <td><span class="aw-link" style="color:var(--aw-danger)" @click="emit('remove-person', activeNodeIndex, person.name)">移除</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="aw-approval-drawer-empty">暂未选择审批人</div>
        </section>

        <section v-else-if="activeDrawerTab === 'method'" class="aw-approval-prop-section">
          <div class="aw-approval-prop-title">审批方式</div>
          <div class="aw-approval-method-list">
            <label
              v-for="method in methods"
              :key="method.value"
              :class="['aw-approval-method-option', { on: activeNode.method === method.value }]"
              @click="updateActiveNode({ method: method.value })"
            >
              <input :checked="activeNode.method === method.value" type="radio" :name="`approvalDrawerMethod${activeNodeIndex}`" />
              <span>{{ method.value }}</span>
              <em>{{ method.desc }}</em>
            </label>
          </div>
        </section>

        <section v-else class="aw-approval-prop-section">
          <div class="aw-approval-prop-title">异常处理 / 反审核设置</div>
          <label class="aw-approval-switch-row">
            <span>是否允许反审核</span>
            <span class="aw-switch-line mini">
              <input
                :checked="activeNode.allowReverseAudit === true"
                type="checkbox"
                @change="updateActiveNode({ allowReverseAudit: ($event.target as HTMLInputElement).checked })"
              />
              <i></i>
            </span>
          </label>
          <label class="aw-approval-prop-row">
            <span>反审核退回节点</span>
            <select
              :value="activeNode.reverseReturnNode || '上一步'"
              class="aw-approval-drawer-select"
              @change="updateActiveNode({ reverseReturnNode: ($event.target as HTMLSelectElement).value as ApprovalNode['reverseReturnNode'] })"
            >
              <option v-for="option in reverseReturnOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
        </section>
      </div>

      <div class="aw-approval-drawer-foot">
        <button class="aw-tool-btn" type="button" @click="closeDrawer">取消</button>
        <button class="aw-btn primary" type="button" @click="closeDrawer">应用配置</button>
      </div>
    </aside>
  </template>
</template>

<style scoped>
.aw-approval-editor .aw-approval-card {
  width: 244px;
  min-height: 156px;
  padding: 16px;
}

.aw-approval-editor .aw-approval-arrow {
  min-height: 156px;
}

.aw-approval-editor .aw-approval-add-card {
  min-height: 156px;
}

.aw-approval-summary-name {
  min-height: 38px;
  padding-right: 12px;
  color: var(--aw-fg-1);
  font-size: 15px;
  font-weight: 600;
  line-height: 19px;
  word-break: break-word;
}

.aw-approval-summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.aw-approval-summary-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 26px;
  color: var(--aw-fg-3);
  font-size: 12px;
}

.aw-approval-summary-list strong {
  max-width: 120px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--aw-bg);
  color: var(--aw-fg-2);
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-approval-summary-list strong.ok {
  background: var(--aw-primary-soft);
  color: var(--aw-primary);
}

.aw-approval-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: rgba(16, 24, 40, .32);
}

.aw-approval-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 50;
  width: min(420px, calc(100vw - 44px));
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: -18px 0 46px rgba(16, 24, 40, .22);
}

.aw-approval-drawer-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--aw-divider);
  flex: none;
}

.aw-approval-drawer-mark {
  width: 4px;
  height: 14px;
  margin-top: 3px;
  border-radius: 2px;
  background: var(--aw-primary);
}

.aw-approval-drawer-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--aw-fg-1);
  line-height: 1.3;
}

.aw-approval-drawer-sub {
  margin-top: 3px;
  font-size: 12px;
  color: var(--aw-fg-3);
}

.aw-approval-drawer-close {
  margin-left: auto;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--aw-fg-4);
  font-size: 18px;
  line-height: 1;
}

.aw-approval-drawer-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.aw-approval-prop-section {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.aw-approval-prop-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--aw-fg-1);
}

.aw-approval-drawer-tabs {
  margin: 0 0 2px;
}

.aw-approval-prop-row,
.aw-approval-switch-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-approval-prop-row:last-child,
.aw-approval-switch-row:last-child {
  margin-bottom: 0;
}

.aw-approval-drawer-input,
.aw-approval-drawer-select {
  width: 100%;
  height: 34px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  padding: 0 10px;
  background: #fff;
  color: var(--aw-fg-1);
  outline: none;
}

.aw-approval-drawer-input:focus,
.aw-approval-drawer-select:focus {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 3px var(--aw-primary-soft);
}

.aw-approval-drawer-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--aw-divider);
  background: var(--aw-surface-2);
}

.aw-approval-people-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--aw-fg-3);
  font-size: 13px;
}

.aw-approval-drawer-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  border: 1px dashed var(--aw-border);
  border-radius: 8px;
  color: var(--aw-fg-3);
  background: var(--aw-bg);
  font-size: 13px;
}

.aw-approval-people-table-wrap {
  overflow: auto;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
}

.aw-approval-people-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #fff;
}

.aw-approval-people-table th,
.aw-approval-people-table td {
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--aw-divider);
  color: var(--aw-fg-1);
  text-align: left;
  white-space: nowrap;
}

.aw-approval-people-table th {
  height: 38px;
  background: var(--aw-surface-2);
  color: var(--aw-fg-2);
  font-size: 12px;
  font-weight: 500;
}

.aw-approval-people-table tr:last-child td {
  border-bottom: 0;
}

.aw-approval-people-table th:last-child,
.aw-approval-people-table td:last-child {
  width: 70px;
  text-align: center;
}

.aw-approval-method-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.aw-approval-method-option {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 3px 8px;
  padding: 12px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  background: #fff;
}

.aw-approval-method-option.on {
  border-color: var(--aw-primary);
  background: var(--aw-primary-soft);
}

.aw-approval-method-option input {
  grid-row: 1 / span 2;
  margin-top: 2px;
}

.aw-approval-method-option span {
  color: var(--aw-fg-1);
  font-size: 13px;
  font-weight: 600;
}

.aw-approval-method-option em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
  line-height: 18px;
}
</style>
