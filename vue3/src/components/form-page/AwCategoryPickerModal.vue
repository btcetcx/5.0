<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CategoryPickerChild, CategoryPickerConfirmPayload, CategoryPickerGroup } from './types';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    groups: CategoryPickerGroup[];
    defaultParentKey?: string;
    defaultChildKey?: string;
    defaultLeafKey?: string;
    emptyText?: string;
    currentParentLabel?: string;
    childColumnTitle?: string;
    codeColumnTitle?: string;
    descColumnTitle?: string;
    countColumnTitle?: string;
    leafMode?: boolean;
    leafCurrentLabel?: string;
    leafColumnTitle?: string;
    leafCodeColumnTitle?: string;
    leafDescColumnTitle?: string;
    leafStockColumnTitle?: string;
    leafAvailableColumnTitle?: string;
    leafStatusColumnTitle?: string;
  }>(),
  {
    title: '选择分类',
    defaultParentKey: '',
    defaultChildKey: '',
    defaultLeafKey: '',
    emptyText: '当前一级分类暂无二级分类',
    currentParentLabel: '当前一级分类：',
    childColumnTitle: '二级分类',
    codeColumnTitle: '分类编码',
    descColumnTitle: '说明',
    countColumnTitle: '数量',
    leafMode: false,
    leafCurrentLabel: '当前仓库/区域：',
    leafColumnTitle: '库位',
    leafCodeColumnTitle: '库位编码',
    leafDescColumnTitle: '说明',
    leafStockColumnTitle: '库存',
    leafAvailableColumnTitle: '可用量',
    leafStatusColumnTitle: '状态',
  },
);

const emit = defineEmits<{
  cancel: [];
  confirm: [payload: CategoryPickerConfirmPayload];
}>();

const activeParentKey = ref('');
const selectedChildKey = ref('');
const selectedLeafKey = ref('');

const activeParent = computed(() => props.groups.find((item) => item.key === activeParentKey.value) || props.groups[0]);
const childRows = computed(() => activeParent.value?.children || []);
const selectedChild = computed(() => childRows.value.find((item) => item.key === selectedChildKey.value));
const leafRows = computed(() => props.leafMode ? selectedChild.value?.children || [] : []);
const selectedLeaf = computed(() => leafRows.value.find((item) => item.key === selectedLeafKey.value));
const confirmDisabled = computed(() => props.leafMode ? !activeParent.value || !selectedChild.value || !selectedLeaf.value : !activeParent.value || !selectedChild.value);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    activeParentKey.value = props.defaultParentKey || props.groups[0]?.key || '';
    selectedChildKey.value = props.defaultChildKey || activeParent.value?.children[0]?.key || '';
    selectedLeafKey.value = props.defaultLeafKey || selectedChild.value?.children?.[0]?.key || '';
  },
  { immediate: true },
);

function switchParent(group: CategoryPickerGroup) {
  activeParentKey.value = group.key;
  selectedChildKey.value = group.children[0]?.key || '';
  selectedLeafKey.value = group.children[0]?.children?.[0]?.key || '';
}

function pickChild(child: CategoryPickerChild) {
  selectedChildKey.value = child.key;
  selectedLeafKey.value = child.children?.[0]?.key || '';
}

function pickLeaf(child: CategoryPickerChild) {
  selectedLeafKey.value = child.key;
}

function confirm() {
  if (!activeParent.value || !selectedChild.value) return;
  emit('confirm', {
    parent: activeParent.value,
    area: props.leafMode ? selectedChild.value : undefined,
    child: props.leafMode ? selectedLeaf.value as CategoryPickerChild : selectedChild.value,
  });
}
</script>

<template>
  <div v-if="open" class="aw-mask" @click="emit('cancel')">
    <div class="aw-modal lg" @click.stop>
      <div class="head">
        <span>{{ title }}</span>
        <button class="aw-modal-close" type="button" @click="emit('cancel')">×</button>
      </div>
      <div :class="['body', 'aw-category-picker-body', { 'leaf-mode': leafMode }]">
        <aside class="aw-doc-tree aw-category-picker-side">
          <template v-for="group in groups" :key="group.key">
            <button
              :class="['aw-tree-row', 'aw-tree-l2', { on: !leafMode && activeParentKey === group.key }]"
              type="button"
              @click="switchParent(group)"
            >
              <span :class="['aw-line-icon', group.icon || 'line-folder']"></span>
              <span>{{ group.label }}</span>
              <em v-if="group.count != null">{{ group.count }}</em>
            </button>
            <button
              v-for="child in group.children"
              v-if="leafMode"
              :key="child.key"
              :class="['aw-tree-row', 'aw-tree-l3', { on: activeParentKey === group.key && selectedChildKey === child.key }]"
              type="button"
              @click="activeParentKey = group.key; pickChild(child)"
            >
              <span class="aw-tree-branch"></span>
              <span>{{ child.label }}</span>
              <em v-if="child.count != null">{{ child.count }}</em>
            </button>
          </template>
        </aside>
        <section class="aw-category-picker-main">
          <div class="aw-category-picker-current">
            {{ leafMode ? leafCurrentLabel : currentParentLabel }}
            <span class="aw-link">{{ leafMode ? `${activeParent?.label || '-'} / ${selectedChild?.label || '-'}` : activeParent?.label || '-' }}</span>
          </div>

          <table v-if="!leafMode" class="aw-table">
            <thead>
              <tr>
                <th style="width:56px">选择</th>
                <th>{{ childColumnTitle }}</th>
                <th>{{ codeColumnTitle }}</th>
                <th>{{ descColumnTitle }}</th>
                <th style="width:90px">{{ countColumnTitle }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="child in childRows" :key="child.key" class="aw-category-click-row" @click="pickChild(child)">
                <td><span :class="['aw-radio', { on: selectedChildKey === child.key }]"><span class="aw-dot"></span></span></td>
                <td>{{ child.label }}</td>
                <td class="aw-num">{{ child.code || child.key }}</td>
                <td>{{ child.desc || '-' }}</td>
                <td>{{ child.count ?? '-' }}</td>
              </tr>
              <tr v-if="!childRows.length">
                <td colspan="5" class="aw-category-empty-cell">{{ emptyText }}</td>
              </tr>
            </tbody>
          </table>

          <table v-else class="aw-table">
            <thead>
              <tr>
                <th style="width:56px">选择</th>
                <th>{{ leafColumnTitle }}</th>
                <th>{{ leafCodeColumnTitle }}</th>
                <th>{{ leafDescColumnTitle }}</th>
                <th style="width:78px">{{ leafStockColumnTitle }}</th>
                <th style="width:78px">{{ leafAvailableColumnTitle }}</th>
                <th style="width:86px">{{ leafStatusColumnTitle }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="leaf in leafRows" :key="leaf.key" class="aw-category-click-row" @click="pickLeaf(leaf)">
                <td><span :class="['aw-radio', { on: selectedLeafKey === leaf.key }]"><span class="aw-dot"></span></span></td>
                <td>{{ leaf.label }}</td>
                <td class="aw-num">{{ leaf.code || leaf.key }}</td>
                <td>{{ leaf.desc || '-' }}</td>
                <td>{{ leaf.stock ?? '-' }}</td>
                <td>{{ leaf.available ?? '-' }}</td>
                <td>{{ leaf.status || '-' }}</td>
              </tr>
              <tr v-if="!leafRows.length">
                <td colspan="7" class="aw-category-empty-cell">{{ emptyText }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
      <div class="aw-modal-foot aw-category-picker-foot">
        <button class="aw-btn" type="button" @click="emit('cancel')">取消</button>
        <button class="aw-btn primary" type="button" :disabled="confirmDisabled" @click="confirm">确认</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aw-category-picker-body {
  display: grid;
  gap: 14px;
  grid-template-columns: 170px minmax(0, 1fr);
  min-height: 330px;
}

.aw-category-picker-body.leaf-mode {
  grid-template-columns: 220px minmax(0, 1fr);
}

.aw-category-picker-side {
  min-height: 330px;
  overflow: auto;
}

.aw-category-picker-side .aw-tree-row {
  width: 100%;
}

.aw-category-picker-side .aw-tree-l3 {
  padding-left: 28px;
}

.aw-tree-branch {
  width: 10px;
  height: 1px;
  background: var(--aw-border);
}

.aw-category-picker-side em {
  color: var(--aw-fg-3);
  font-style: normal;
  margin-left: auto;
}

.aw-category-picker-main {
  min-width: 0;
}

.aw-category-picker-current {
  margin-bottom: 12px;
}

.aw-category-click-row {
  cursor: pointer;
}

.aw-category-empty-cell {
  color: var(--aw-fg-3);
  height: 88px;
  text-align: center;
}

.aw-category-picker-foot {
  justify-content: flex-end;
}

@media (max-width: 980px) {
  .aw-category-picker-body,
  .aw-category-picker-body.leaf-mode {
    grid-template-columns: 1fr;
  }
}
</style>
