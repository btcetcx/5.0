<template>
  <section class="aw-page rd-detail-page">
    <div class="detail-toolbar aw-card">
      <el-button @click="router.push(`/rd/${resource}`)">返回列表</el-button>
      <div class="detail-toolbar-actions">
        <el-button type="primary" @click="runAction(primaryAction)">{{ primaryAction }}</el-button>
        <el-button @click="runAction('修改')">修改</el-button>
        <el-button @click="runAction('提交审批')">提交审批</el-button>
        <el-button @click="runAction('导出')">导出</el-button>
      </div>
    </div>

    <section class="detail-header aw-card">
      <div class="detail-title-line">
        <h1>{{ title }}</h1>
        <span :class="['aw-status', statusTone(statusText)]">{{ statusText }}</span>
      </div>
      <div class="detail-code">单据编号：{{ record?.code || '-' }}</div>
      <div class="detail-metas">
        <span v-for="meta in headerMetas" :key="meta.label">{{ meta.label }}：{{ meta.value }}</span>
      </div>
    </section>

    <div class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="aw-card detail-metric">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <em>{{ metric.hint }}</em>
      </article>
    </div>

    <el-alert v-if="actionMessage" :title="actionMessage" show-icon type="info" @close="actionMessage = ''" />

    <section class="aw-card detail-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础信息" name="info">
          <div class="section-title">基础信息</div>
          <div class="info-grid">
            <div v-for="item in infoItems" :key="item.label" class="info-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <div class="section-title">说明</div>
          <div class="rich-text">{{ record?.description || descriptionText }}</div>
        </el-tab-pane>

        <template v-if="resource === 'projects'">
          <el-tab-pane label="项目成员" name="members">
            <detail-table :columns="['姓名', '角色', '加入时间']" :rows="rdDetailTables.projectMembers" />
          </el-tab-pane>
          <el-tab-pane label="BOM清单" name="bom">
            <detail-table :columns="['序号', '物料编码', '物料名称', '规格型号', '单位', '项目用量', '来源', '状态']" :rows="rdDetailTables.projectBom" />
          </el-tab-pane>
          <el-tab-pane label="工艺路线" name="process">
            <detail-table :columns="['序号', '工序编号', '工序名称', '工作中心', '类型', '工时', '状态']" :rows="rdDetailTables.projectProcess" />
          </el-tab-pane>
          <el-tab-pane label="报价测算" name="quote">
            <detail-table :columns="['序号', '成本项', '来源说明', '金额', '状态']" :rows="rdDetailTables.projectQuote" />
          </el-tab-pane>
          <el-tab-pane label="操作记录" name="logs">
            <detail-table :columns="['操作类型', '操作人', '操作时间', '操作内容']" :rows="rdDetailTables.projectLogs" />
          </el-tab-pane>
        </template>

        <template v-else-if="resource === 'boms'">
          <el-tab-pane label="物料明细" name="materials">
            <detail-table :columns="['序号', '物料编码', '物料名称', '规格型号', '单位', '用量', '单价', '小计', '关联工序']" :rows="rdDetailTables.bomMaterials" />
          </el-tab-pane>
          <el-tab-pane label="变更记录" name="changes">
            <detail-table :columns="['操作类型', '操作人', '操作时间', '操作内容']" :rows="rdDetailTables.projectLogs" />
          </el-tab-pane>
        </template>

        <template v-else>
          <el-tab-pane label="工序明细" name="operations">
            <detail-table :columns="['序号', '工序编号', '工序名称', '工作中心', '类型', '标准工时', '要求']" :rows="rdDetailTables.processOperations" />
          </el-tab-pane>
          <el-tab-pane label="工艺参数" name="params">
            <detail-table :columns="['参数项', '参数值', '影响范围']" :rows="processParamRows" />
          </el-tab-pane>
        </template>
      </el-tabs>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch, type PropType } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getRdResource } from './rd.api';
import { rdDetailTables } from './rd.mock';
import type { RdRecord, RdResourceKey } from './types';

const route = useRoute();
const router = useRouter();
const resource = computed(() => String(route.params.resource || 'projects') as RdResourceKey);
const record = ref<RdRecord | undefined>();
const activeTab = ref('info');
const actionMessage = ref('');

const title = computed(() => String(record.value?.name || record.value?.code || '研发详情'));
const statusText = computed(() => String(record.value?.statusName || record.value?.bomStatusName || '-'));
const primaryAction = computed(() => {
  if (resource.value === 'projects') return '锁定报价';
  if (resource.value === 'boms') return '锁定BOM';
  return '锁定工艺';
});
const descriptionText = computed(() => {
  if (resource.value === 'boms') return 'BOM详情用于维护产品结构、物料用量、替代料和关联工序，审批后作为采购、报价和生产基准。';
  if (resource.value === 'processes') return '工艺详情用于维护串序、并序、自制和委外工序，以及工时、设备、质量参数和成本测算。';
  return '研发项目详情用于串联项目成员、BOM、工艺、报价、采购和生产，形成跨模块研发闭环。';
});
const headerMetas = computed(() => {
  if (!record.value) return [];
  if (resource.value === 'projects') {
    return [
      { label: '客户', value: record.value.customerName },
      { label: '目标产品', value: record.value.productName },
      { label: '负责人', value: record.value.ownerName },
      { label: '计划完成', value: record.value.expectedDate },
    ];
  }
  return [
    { label: '适用产品', value: record.value.productName },
    { label: '版本', value: record.value.version },
    { label: '编制人', value: record.value.authorName },
    { label: '生效日期', value: record.value.effectiveDate },
  ];
});
const metrics = computed(() => {
  if (!record.value) return [];
  if (resource.value === 'projects') {
    return [
      { label: 'BOM状态', value: String(record.value.bomStatusName || '-'), hint: '影响报价和采购基准' },
      { label: '工艺状态', value: String(record.value.processStatusName || '-'), hint: '影响生产和成本测算' },
      { label: '报价状态', value: String(record.value.quoteStatusName || '-'), hint: '确认后可同步销售' },
      { label: '优先级', value: String(record.value.priorityName || '-'), hint: '用于研发排期' },
    ];
  }
  if (resource.value === 'boms') {
    return [
      { label: '物料数', value: String(record.value.materialCount || 0), hint: '包含多层结构物料' },
      { label: '成本估算', value: money(record.value.totalCost), hint: '用于项目报价测算' },
      { label: '版本', value: String(record.value.version || '-'), hint: '审批后锁定生效' },
      { label: '类型', value: String(record.value.typeName || '-'), hint: '区分设计/制造/项目BOM' },
    ];
  }
  return [
    { label: '工序数', value: String(record.value.operationCount || 0), hint: '包含串序和并序' },
    { label: '委外工序', value: String(record.value.outsourcingCount || 0), hint: '影响采购协同' },
    { label: '标准工时', value: `${record.value.standardHours || 0}h`, hint: '用于产能和成本测算' },
    { label: '版本', value: String(record.value.version || '-'), hint: '审批后作为生产基准' },
  ];
});
const infoItems = computed(() => {
  if (!record.value) return [];
  return Object.entries(record.value)
    .filter(([key]) => !['id', 'description'].includes(key))
    .map(([key, value]) => ({ label: fieldLabels[key] || key, value: value ?? '-' }));
});
const processParamRows = [
  ['首件检验', '必须', 'OP-010 / OP-030'],
  ['老化时长', '4小时', 'OP-040'],
  ['委外验收', '按色卡和外观标准', 'OP-020'],
];

const fieldLabels: Record<string, string> = {
  code: '编号',
  name: '名称',
  customerName: '客户',
  productName: '适用产品',
  ownerName: '负责人',
  startDate: '立项日期',
  expectedDate: '计划完成',
  priorityName: '优先级',
  bomStatusName: 'BOM状态',
  processStatusName: '工艺状态',
  quoteStatusName: '报价状态',
  statusName: '状态',
  version: '版本',
  typeName: 'BOM类型',
  materialCount: '物料数',
  totalCost: '成本估算',
  authorName: '编制人',
  effectiveDate: '生效日期',
  categoryName: '工艺分类',
  operationCount: '工序数',
  outsourcingCount: '委外工序',
  standardHours: '标准工时',
  projectCode: '项目编号',
};

function money(value: unknown) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusTone(value: unknown) {
  const text = String(value || '');
  if (['已锁定', '已确认', '已审批', '已启用', '完成'].includes(text)) return 'green';
  if (['研发中', '编制中', '立项'].includes(text)) return 'blue';
  if (['待配置', '待测算', '草稿'].includes(text)) return 'yellow';
  return 'gray';
}

function runAction(label: string) {
  actionMessage.value = `${label}动作已记录，当前详情页保持前端预览状态。`;
}

async function loadDetail() {
  record.value = await getRdResource(resource.value, String(route.params.id || ''));
  activeTab.value = 'info';
  actionMessage.value = '';
}

watch(() => route.fullPath, loadDetail, { immediate: true });

const DetailTable = defineComponent({
  props: {
    columns: { type: Array as PropType<string[]>, required: true },
    rows: { type: Array as PropType<Array<Array<string | number>>>, required: true },
  },
  setup(props) {
    return () =>
      h('div', { class: 'detail-table-wrap' }, [
        h('table', { class: 'detail-table' }, [
          h('thead', [h('tr', props.columns.map((column) => h('th', column)))]),
          h('tbody', props.rows.map((row) => h('tr', row.map((cell) => h('td', String(cell ?? '-')))))),
        ]),
      ]);
  },
});
</script>

<style scoped>
.rd-detail-page {
  gap: 14px;
}

.detail-toolbar,
.detail-toolbar-actions,
.detail-title-line,
.detail-metas {
  display: flex;
  align-items: center;
}

.detail-toolbar {
  justify-content: space-between;
  padding: 12px;
}

.detail-toolbar-actions {
  gap: 8px;
}

.detail-header {
  padding: 18px 20px;
}

.detail-title-line {
  gap: 12px;
}

.detail-title-line h1 {
  margin: 0;
  font-size: 22px;
}

.detail-code {
  margin-top: 8px;
  color: var(--aw-muted);
  font-size: 13px;
}

.detail-metas {
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 12px;
  color: var(--aw-muted);
  font-size: 13px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.detail-metric {
  padding: 16px;
}

.detail-metric span,
.detail-metric em {
  display: block;
  color: var(--aw-muted);
  font-size: 13px;
  font-style: normal;
}

.detail-metric strong {
  display: block;
  margin: 10px 0 6px;
  font-size: 24px;
}

.detail-card {
  padding: 0 16px 16px;
}

.section-title {
  margin: 14px 0 10px;
  font-weight: 700;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--aw-border);
  border-right: 0;
  border-bottom: 0;
}

.info-item {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  min-height: 42px;
  border-right: 1px solid var(--aw-border);
  border-bottom: 1px solid var(--aw-border);
}

.info-item span,
.info-item strong {
  padding: 10px 12px;
}

.info-item span {
  background: #f8fafc;
  color: var(--aw-muted);
  font-weight: 500;
}

.info-item strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.rich-text {
  padding: 14px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #f8fafc;
  color: var(--aw-muted);
  line-height: 1.8;
}

.detail-table-wrap {
  overflow: auto;
}

.detail-table {
  min-width: 960px;
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.detail-table th,
.detail-table td {
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--aw-border);
  white-space: nowrap;
  text-align: left;
}

.detail-table th {
  background: #f8fafc;
  color: var(--aw-muted);
  font-weight: 600;
}
</style>
