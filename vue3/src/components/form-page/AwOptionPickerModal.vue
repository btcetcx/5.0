<script setup lang="ts">
import { computed, ref, watch } from 'vue';

export interface OptionPickerColumn {
  key: string;
  title: string;
  width?: number;
}

export interface OptionPickerRow {
  id: string | number;
  [key: string]: unknown;
}

export interface OptionPickerCategory {
  key: string;
  label: string;
  icon?: string;
  count?: number;
}

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    columns: OptionPickerColumn[];
    rows: OptionPickerRow[];
    rowKey?: string;
    categories?: OptionPickerCategory[];
    categoryKey?: string;
    categoryTitle?: string;
    searchPlaceholder?: string;
  }>(),
  {
    title: '选择数据',
    rowKey: 'id',
    categories: () => [],
    categoryKey: 'category',
    categoryTitle: '分类',
    searchPlaceholder: '搜索名称、编号、范围或负责人',
  },
);

const emit = defineEmits<{
  cancel: [];
  confirm: [row: OptionPickerRow];
}>();

const keyword = ref('');
const picked = ref<OptionPickerRow | null>(null);
const activeCategory = ref('');

const hasCategories = computed(() => props.categories.length > 0);
const categoryCounts = computed(() => props.rows.reduce<Record<string, number>>((result, row) => {
  const key = String(row[props.categoryKey] || '');
  if (!key) return result;
  result[key] = (result[key] || 0) + 1;
  return result;
}, {}));
const categoryRows = computed(() => props.categories.map((category) => ({
  ...category,
  count: category.count ?? (category.key === 'all' ? props.rows.length : categoryCounts.value[category.key] || 0),
})));
const filteredRows = computed(() => {
  const text = keyword.value.trim();
  return props.rows.filter((row) => {
    const categoryMatched = !hasCategories.value || activeCategory.value === 'all' || String(row[props.categoryKey] || '') === activeCategory.value;
    const keywordMatched = !text || Object.values(row).some((value) => String(value || '').includes(text));
    return categoryMatched && keywordMatched;
  });
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    keyword.value = '';
    picked.value = null;
    activeCategory.value = props.categories[0]?.key || '';
  },
);

watch(
  () => props.categories,
  (categories) => {
    if (!props.open) return;
    if (!categories.some((category) => category.key === activeCategory.value)) {
      activeCategory.value = categories[0]?.key || '';
    }
  },
);

function rowKey(row: OptionPickerRow) {
  return String(row[props.rowKey]);
}

function confirm() {
  if (!picked.value) return;
  emit('confirm', picked.value);
}
</script>

<template>
  <div v-if="open" class="aw-mask" @click="emit('cancel')">
    <div class="aw-modal lg" @click.stop>
      <div class="head">
        <span>{{ title }}</span>
        <button class="aw-modal-close" type="button" @click="emit('cancel')">×</button>
      </div>
      <div class="body aw-option-picker-body">
        <div :class="['aw-option-picker-layout', { 'has-side': hasCategories }]">
          <aside v-if="hasCategories" class="aw-doc-tree aw-option-picker-side">
            <strong>{{ categoryTitle }}</strong>
            <button
              v-for="category in categoryRows"
              :key="category.key"
              :class="['aw-tree-row', 'aw-tree-l2', { on: activeCategory === category.key }]"
              type="button"
              @click="activeCategory = category.key; picked = null"
            >
              <span :class="['aw-line-icon', category.icon || 'line-folder']"></span>
              <span>{{ category.label }}</span>
              <em>{{ category.count }}</em>
            </button>
          </aside>
          <div class="aw-option-picker-main">
            <div class="aw-search aw-option-picker-search">
              <span class="aw-line-icon line-search"></span>
              <input v-model="keyword" :placeholder="searchPlaceholder" />
            </div>
            <table class="aw-table">
              <thead>
                <tr>
                  <th style="width:56px">选择</th>
                  <th v-for="column in columns" :key="column.key" :style="{ width: column.width ? `${column.width}px` : undefined }">
                    {{ column.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredRows" :key="rowKey(row)" class="aw-option-click-row" @click="picked = row" @dblclick="picked = row; confirm()">
                  <td><span :class="['aw-radio', { on: picked && rowKey(picked) === rowKey(row) }]"><span class="aw-dot"></span></span></td>
                  <td v-for="column in columns" :key="column.key">{{ row[column.key] || '-' }}</td>
                </tr>
                <tr v-if="!filteredRows.length">
                  <td :colspan="columns.length + 1" class="aw-option-picker-empty">暂无可选数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="aw-modal-foot aw-option-picker-foot">
        <button class="aw-btn" type="button" @click="emit('cancel')">取消</button>
        <button class="aw-btn primary" type="button" :disabled="!picked" @click="confirm">确认</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aw-option-picker-body {
  min-height: 330px;
}

.aw-option-picker-layout {
  min-height: 330px;
}

.aw-option-picker-layout.has-side {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  gap: 14px;
}

.aw-option-picker-side {
  min-height: 330px;
  overflow: auto;
}

.aw-option-picker-side strong {
  display: block;
  padding: 0 8px 8px;
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-option-picker-side .aw-tree-row {
  width: 100%;
  border: 0;
  background: transparent;
}

.aw-option-picker-side em {
  margin-left: auto;
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

.aw-option-picker-main {
  min-width: 0;
}

.aw-option-picker-search {
  margin-bottom: 12px;
}

.aw-option-picker-empty {
  height: 96px;
  text-align: center;
  color: var(--aw-fg-3);
}

.aw-option-click-row {
  cursor: pointer;
}

.aw-option-click-row:hover {
  background: var(--aw-surface-2);
}
</style>
