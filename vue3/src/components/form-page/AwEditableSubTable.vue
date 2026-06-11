<template>
  <div class="aw-editable-sub-table">
    <div class="aw-doc-tbl-wrap">
      <div class="aw-doc-tbl-inner">
        <table class="aw-doc-tbl">
          <thead>
            <tr>
              <th style="width:60px">序号</th>
              <th v-for="column in columns" :key="column.key" :style="{ width: column.width ? `${column.width}px` : undefined }">
                <slot name="header" :column="column">
                  {{ column.title }}
                </slot>
              </th>
              <th v-if="$slots.actions" :style="{ width: actionWidth ? `${actionWidth}px` : undefined }">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="String(row[rowKey])">
              <td v-if="!mergeIndex || isFirstMergeRow(index)" :rowspan="mergeIndex ? mergeRowspan(index) : undefined">{{ displayIndex(index) }}</td>
              <template v-for="column in columns" :key="column.key">
                <td v-if="shouldRenderCell(column.key, index)" :rowspan="cellRowspan(column.key, index)">
                  <slot name="cell" :column="column" :row="row" :index="index" />
                </td>
              </template>
              <td v-if="$slots.actions">
                <slot name="actions" :row="row" :index="index" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <button v-if="showAdd" class="aw-tool-btn aw-editable-sub-table-add" type="button" @click="emit('add')">{{ addText }}</button>
  </div>
</template>

<script setup lang="ts">
import type { EditableColumn } from './types';

const props = withDefaults(
  defineProps<{
    columns: EditableColumn[];
    rows: Record<string, any>[];
    rowKey?: string;
    addText: string;
    actionWidth?: number;
    showAdd?: boolean;
    mergeBy?: string;
    mergeColumns?: string[];
    mergeIndex?: boolean;
  }>(),
  {
    rowKey: 'id',
    actionWidth: 90,
    showAdd: true,
    mergeBy: '',
    mergeColumns: () => [],
    mergeIndex: false,
  },
);

const emit = defineEmits<{
  add: [];
}>();

function mergeValue(index: number) {
  if (!props.mergeBy) return undefined;
  return props.rows[index]?.[props.mergeBy];
}

function isFirstMergeRow(index: number) {
  if (!props.mergeBy) return true;
  const value = mergeValue(index);
  if (value === undefined || value === null || value === '') return true;
  return index === 0 || value !== mergeValue(index - 1);
}

function mergeRowspan(index: number) {
  if (!props.mergeBy || !isFirstMergeRow(index)) return 1;
  const value = mergeValue(index);
  if (value === undefined || value === null || value === '') return 1;
  let span = 1;
  for (let i = index + 1; i < props.rows.length; i += 1) {
    if (mergeValue(i) !== value) break;
    span += 1;
  }
  return span;
}

function shouldRenderCell(key: string, index: number) {
  return !props.mergeColumns.includes(key) || isFirstMergeRow(index);
}

function cellRowspan(key: string, index: number) {
  return props.mergeColumns.includes(key) ? mergeRowspan(index) : undefined;
}

function displayIndex(index: number) {
  if (!props.mergeIndex || !props.mergeBy) return index + 1;
  let count = 0;
  for (let i = 0; i <= index; i += 1) {
    if (isFirstMergeRow(i)) count += 1;
  }
  return count;
}
</script>

<style scoped>
.aw-editable-sub-table {
  display: grid;
  gap: 10px;
  justify-items: start;
}

.aw-editable-sub-table .aw-doc-tbl-wrap {
  justify-self: stretch;
  width: 100%;
}

.aw-editable-sub-table-add {
  justify-self: start;
}
</style>
