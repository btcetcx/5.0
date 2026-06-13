<template>
  <section class="aw-page">
    <div class="resource-head aw-card">
      <div>
        <strong>{{ config.title }}</strong>
        <span>{{ config.searchPlaceholder }}</span>
      </div>
      <el-button type="primary" @click="router.push(`/rd/${resource}/new`)">{{ config.createLabel }}</el-button>
    </div>

    <div class="resource-toolbar aw-card">
      <el-input v-model="keyword" clearable :placeholder="config.searchPlaceholder" @keyup.enter="loadData" />
      <el-button @click="loadData">刷新</el-button>
      <el-button @click="toolbarMessage = '高级筛选面板已预留，可继续接入研发资源筛选条件。'">筛选</el-button>
      <el-button @click="toolbarMessage = '字段配置已预留，可按列显示控制。'">字段配置</el-button>
      <el-button @click="toolbarMessage = `${config.title}导入入口已预留。`">导入</el-button>
      <el-button @click="toolbarMessage = `${config.title}导出任务已创建，共 ${total} 条。`">导出</el-button>
    </div>

    <el-alert v-if="toolbarMessage" :title="toolbarMessage" show-icon type="info" @close="toolbarMessage = ''" />

    <section class="aw-card table-card">
      <el-table
        v-loading="loading"
        :data="rows"
        border
        height="calc(100vh - 260px)"
        row-key="id"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="48" fixed />
        <el-table-column type="index" label="序号" width="64" fixed />
        <el-table-column
          v-for="column in config.columns"
          :key="column.key"
          :fixed="column.key === config.primaryKey ? 'left' : undefined"
          :label="column.title"
          :min-width="column.width || 120"
        >
          <template #default="{ row }">
            <span v-if="column.link" class="aw-link" @click="openDetail(row)">{{ row[column.key] }}</span>
            <span v-else-if="column.status" :class="['aw-status', statusTone(row[column.key])]">{{ row[column.key] || '-' }}</span>
            <span v-else-if="column.numeric" class="aw-num">{{ money(row[column.key]) }}</span>
            <span v-else>{{ row[column.key] ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <footer class="table-footer">
        <span>共 {{ total }} 条，已选 {{ selectedRows.length }} 条</span>
        <div>
          <el-button size="small" @click="handleBatch('submit')">批量提交</el-button>
          <el-button size="small" @click="handleBatch('assign')">批量指定</el-button>
        </div>
      </footer>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listRdResource } from './rd.api';
import { rdResourceConfigs } from './rd.config';
import type { RdRecord, RdResourceKey } from './types';

const route = useRoute();
const router = useRouter();
const resource = computed(() => String(route.params.resource || 'projects') as RdResourceKey);
const config = computed(() => rdResourceConfigs[resource.value] || rdResourceConfigs.projects);
const rows = ref<RdRecord[]>([]);
const total = ref(0);
const keyword = ref('');
const loading = ref(false);
const toolbarMessage = ref('');
const selectedRows = ref<RdRecord[]>([]);

async function loadData() {
  loading.value = true;
  try {
    const result = await listRdResource(resource.value, { keyword: keyword.value, page: 1, pageSize: 50 });
    rows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function openDetail(row: RdRecord) {
  router.push(`/rd/${resource.value}/${row.id}`);
}

function handleBatch(action: string) {
  toolbarMessage.value = selectedRows.value.length
    ? `${config.value.title}已执行 ${action}，共 ${selectedRows.value.length} 条。`
    : '请先选择需要处理的记录。';
}

function money(value: unknown) {
  if (typeof value !== 'number') return value ?? '-';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusTone(value: unknown) {
  const text = String(value || '');
  if (['已锁定', '已确认', '已审批', '已启用', '完成'].includes(text)) return 'green';
  if (['研发中', '编制中', '立项'].includes(text)) return 'blue';
  if (['待配置', '待测算', '草稿'].includes(text)) return 'yellow';
  return 'gray';
}

watch(
  () => route.fullPath,
  () => {
    toolbarMessage.value = '';
    loadData();
  },
  { immediate: true },
);
</script>

<style scoped>
.resource-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
}

.resource-head strong {
  display: block;
  margin-bottom: 4px;
  font-size: 18px;
}

.resource-head span {
  color: var(--aw-muted);
  font-size: 13px;
}

.resource-toolbar {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) repeat(5, auto);
  gap: 10px;
  padding: 12px;
}

.table-card {
  overflow: hidden;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-top: 1px solid var(--aw-border);
  color: var(--aw-muted);
  font-size: 13px;
}
</style>
