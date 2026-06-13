<script setup lang="ts">
import AwEditableSubTable from './AwEditableSubTable.vue';
import type { AttachmentRow, EditableColumn } from './types';

withDefaults(
  defineProps<{
    rows: AttachmentRow[];
    typeOptions?: string[];
    addText?: string;
    uploadText?: string;
    removeText?: string;
    allowRemoveLast?: boolean;
    namePlaceholder?: string;
    remarkPlaceholder?: string;
  }>(),
  {
    typeOptions: () => ['设计图纸', '技术文档', '图片附件', '审批材料'],
    addText: '新增附件',
    uploadText: '上传',
    removeText: '删除',
    allowRemoveLast: false,
    namePlaceholder: '请输入附件名称',
    remarkPlaceholder: '请输入备注',
  },
);

const emit = defineEmits<{
  add: [];
  upload: [row: AttachmentRow];
  remove: [row: AttachmentRow];
}>();

const attachmentColumns: EditableColumn[] = [
  { key: 'name', title: '附件名称', width: 220 },
  { key: 'type', title: '附件类型', width: 160 },
  { key: 'date', title: '上传日期', width: 180 },
  { key: 'remark', title: '备注', width: 220 },
];

function uploadRow(row: Record<string, any>) {
  emit('upload', row as AttachmentRow);
}

function removeRow(row: Record<string, any>) {
  emit('remove', row as AttachmentRow);
}
</script>

<template>
  <aw-editable-sub-table :columns="attachmentColumns" :rows="rows" :add-text="addText" :action-width="120" @add="emit('add')">
    <template #cell="{ column, row }">
      <input v-if="column.key === 'name'" v-model="row.name" class="aw-input" :placeholder="namePlaceholder" />
      <select v-else-if="column.key === 'type'" v-model="row.type" class="aw-select">
        <option v-for="type in typeOptions" :key="type">{{ type }}</option>
      </select>
      <input v-else-if="column.key === 'date'" v-model="row.date" class="aw-input" disabled />
      <input v-else v-model="row.remark" class="aw-input" :placeholder="remarkPlaceholder" />
    </template>
    <template #actions="{ row }">
      <span class="aw-link" @click="uploadRow(row)">{{ uploadText }}</span>
      <span
        v-if="allowRemoveLast || rows.length > 1"
        class="aw-link"
        style="color: var(--aw-danger); margin-left: 10px"
        @click="removeRow(row)"
      >
        {{ removeText }}
      </span>
    </template>
  </aw-editable-sub-table>
</template>
