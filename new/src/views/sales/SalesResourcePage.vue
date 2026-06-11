<template>
  <section class="aw-page">
    <div class="resource-head aw-card">
      <div>
        <strong>{{ config.title }}</strong>
        <span>{{ config.searchPlaceholder }}</span>
      </div>
      <el-button type="primary" @click="openCreate">{{ config.createLabel }}</el-button>
    </div>

    <div v-if="route.query.setting" class="aw-card setting-panel">
      <header>
        <strong>{{ config.title }}设置</strong>
        <el-button @click="router.push(route.path)">返回列表</el-button>
      </header>
      <el-tabs :model-value="String(route.query.setting || 'fields')">
        <el-tab-pane label="自定义字段" name="fields">
          <el-table :data="config.formFields" border>
            <el-table-column prop="label" label="字段名称" />
            <el-table-column prop="key" label="字段编码" />
            <el-table-column prop="type" label="字段类型" />
            <el-table-column prop="required" label="必填" width="90">
              <template #default="{ row }">{{ row.required ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="自定义编号" name="numbers">编号前缀沿用模块编码，后续接入编号规则构建器。</el-tab-pane>
        <el-tab-pane label="审批设置" name="approvals">审批节点后续接入统一审批设置。</el-tab-pane>
        <el-tab-pane label="策略设置" name="strategies">策略项后续接入统一策略设置。</el-tab-pane>
      </el-tabs>
    </div>

    <template v-else>
      <div class="resource-toolbar aw-card">
        <el-input v-model="keyword" clearable :placeholder="config.searchPlaceholder" @keyup.enter="loadData" />
        <el-button @click="loadData">刷新</el-button>
        <el-button @click="toolbarMessage = '筛选面板已预留，可继续接入高级筛选。'">筛选</el-button>
        <el-button @click="columnsDialogOpen = true">字段配置</el-button>
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
            v-for="column in visibleColumns"
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
    </template>

    <el-drawer v-model="detailOpen" :title="detailTitle" size="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item v-for="column in config.columns" :key="column.key" :label="column.title">
          {{ currentRecord?.[column.key] ?? '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <el-dialog v-model="createOpen" :title="config.createLabel" width="720px">
      <el-form :model="form" label-width="110px">
        <el-row :gutter="16">
          <el-col v-for="field in config.formFields" :key="field.key" :span="12">
            <el-form-item :label="field.label" :required="field.required">
              <el-select v-if="field.type === 'select'" v-model="form[field.key]" clearable placeholder="请选择">
                <el-option v-for="option in field.options || []" :key="option" :label="option" :value="option" />
              </el-select>
              <el-date-picker v-else-if="field.type === 'date'" v-model="form[field.key]" type="date" value-format="YYYY-MM-DD" />
              <el-input-number v-else-if="field.type === 'number'" v-model="form[field.key]" :min="0" style="width: 100%" />
              <el-input v-else v-model="form[field.key]" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="columnsDialogOpen" title="字段配置" width="560px">
      <el-checkbox-group v-model="visibleColumnKeys">
        <div class="columns-checks">
          <el-checkbox v-for="column in config.columns" :key="column.key" :label="column.key">
            {{ column.title }}
          </el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button type="primary" @click="columnsDialogOpen = false">应用</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createSalesResource, listSalesResource } from './sales.api';
import { salesResourceConfigs } from './sales.config';
import type { SalesRecord, SalesResourceKey } from './types';

const route = useRoute();
const router = useRouter();
const resource = computed(() => String(route.params.resource || 'customers') as SalesResourceKey);
const config = computed(() => salesResourceConfigs[resource.value] || salesResourceConfigs.customers);
const rows = ref<SalesRecord[]>([]);
const total = ref(0);
const keyword = ref('');
const loading = ref(false);
const toolbarMessage = ref('');
const selectedRows = ref<SalesRecord[]>([]);
const currentRecord = ref<SalesRecord | null>(null);
const detailOpen = ref(false);
const createOpen = ref(false);
const columnsDialogOpen = ref(false);
const visibleColumnKeys = ref<string[]>([]);
const form = reactive<Record<string, string | number | undefined>>({});

const visibleColumns = computed(() => config.value.columns.filter((column) => visibleColumnKeys.value.includes(column.key)));
const detailTitle = computed(() => currentRecord.value?.[config.value.primaryKey] ? String(currentRecord.value[config.value.primaryKey]) : '详情');

async function loadData() {
  loading.value = true;
  try {
    const result = await listSalesResource(resource.value, { keyword: keyword.value, page: 1, pageSize: 50 });
    rows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function openDetail(row: SalesRecord) {
  if (resource.value === 'sales-orders') {
    router.push(`/sales/sales-orders/${row.id}`);
    return;
  }
  currentRecord.value = row;
  detailOpen.value = true;
}

function openCreate() {
  Object.keys(form).forEach((key) => delete form[key]);
  createOpen.value = true;
}

async function submitCreate() {
  await createSalesResource(resource.value, { ...form });
  createOpen.value = false;
  toolbarMessage.value = `${config.value.createLabel}已保存。`;
  await loadData();
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
  if (['启用', '正常', '已审批', '已完成', '履约完成', '通过'].includes(text)) return 'green';
  if (['执行中', '履约中', '待发货'].includes(text)) return 'blue';
  if (['待审批', '临近额度', '草稿'].includes(text)) return 'yellow';
  return 'gray';
}

watch(
  () => route.fullPath,
  () => {
    visibleColumnKeys.value = config.value.columns.map((column) => column.key);
    toolbarMessage.value = '';
    detailOpen.value = false;
    createOpen.value = route.query.action === 'new';
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

.setting-panel {
  padding: 16px;
}

.setting-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.columns-checks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}
</style>
