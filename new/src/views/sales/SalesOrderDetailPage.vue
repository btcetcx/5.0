<template>
  <section class="aw-page sales-detail-page">
    <div class="detail-toolbar aw-card">
      <el-button @click="router.push('/sales/sales-orders')">返回</el-button>
      <div class="detail-toolbar-actions">
        <el-button type="primary" @click="runAction('发货')">发货</el-button>
        <el-button @click="runAction('修改')">修改</el-button>
        <el-button @click="runAction('打印')">打印</el-button>
        <el-button @click="runAction('导出')">导出</el-button>
      </div>
    </div>

    <section class="detail-header aw-card">
      <div>
        <div class="detail-title-line">
          <h1>{{ order.topic }} {{ order.code }}</h1>
          <span :class="['aw-status', statusTone(order.statusName)]">{{ order.statusName }}</span>
        </div>
        <div class="detail-code">单据编号：{{ order.code }}</div>
        <div class="detail-metas">
          <span>客户：{{ order.customerName }}</span>
          <span>来源：{{ order.sourceCode }}</span>
          <span>下单日期：{{ order.orderDate }}</span>
          <span>销售人员：{{ order.ownerName }}</span>
        </div>
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
        <el-tab-pane label="订单信息" name="info">
          <div class="section-title">基础信息</div>
          <div class="info-grid">
            <div v-for="item in infoItems" :key="item.label" class="info-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <div class="section-title">附件</div>
          <div class="attachment-grid">
            <article v-for="file in attachments" :key="file.name" class="attachment-card">
              <strong>{{ file.name }}</strong>
              <span>文件大小：{{ file.size }}</span>
              <span>上传日期：{{ file.uploadedAt }}</span>
              <div><span class="aw-link">查看</span><span class="aw-link">下载</span></div>
            </article>
          </div>
        </el-tab-pane>

        <el-tab-pane label="订单明细" name="lines">
          <detail-table :columns="lineColumns" :rows="lineRows" />
        </el-tab-pane>
        <el-tab-pane label="发货应收" name="delivery">
          <detail-table :columns="deliveryColumns" :rows="deliveryRows" />
        </el-tab-pane>
        <el-tab-pane label="开票申请" name="invoice">
          <detail-table :columns="invoiceColumns" :rows="invoiceRows" />
        </el-tab-pane>
        <el-tab-pane label="回款核销" name="payment">
          <detail-table :columns="paymentColumns" :rows="paymentRows" />
        </el-tab-pane>
        <el-tab-pane label="生产记录" name="production">
          <detail-table :columns="productionColumns" :rows="productionRows" />
        </el-tab-pane>
        <el-tab-pane label="退换货记录" name="return">
          <div class="empty-box">
            暂无退换货记录。可从本订单发起退货或换货，后续记录会按售后单据回填。
            <div>
              <el-button type="primary" @click="runAction('退货')">退货</el-button>
              <el-button @click="runAction('换货')">换货</el-button>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="操作记录" name="logs">
          <detail-table :columns="logColumns" :rows="logRows" />
        </el-tab-pane>
      </el-tabs>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, type PropType } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { salesMockData } from './sales.mock';
import type { SalesRecord } from './types';

const route = useRoute();
const router = useRouter();
const activeTab = ref('info');
const actionMessage = ref('');
const emptyOrder: SalesRecord = {
  id: '',
  code: '',
  topic: '销售订单详情',
  sourceType: '-',
  sourceCode: '-',
  customerName: '-',
  amount: 0,
  creditCheckName: '-',
  receivableAmount: 0,
  deliveryDate: '-',
  progressName: '-',
  statusName: '-',
};
const order = computed(() => {
  const rows = salesMockData['sales-orders'];
  return rows.find((row) => row.id === route.params.id) || rows[0] || emptyOrder;
});

const attachments = [
  { name: '销售订单确认单.pdf', size: '248 KB', uploadedAt: '2026-06-03 10:18:26' },
  { name: '客户采购需求.xlsx', size: '96 KB', uploadedAt: '2026-06-03 10:22:41' },
  { name: '交付地址确认.png', size: '512 KB', uploadedAt: '2026-06-03 10:28:05' },
];
const lineColumns = ['来源明细', '产品编号', '产品名称', '规格型号', '单位', '单价', '销售数量', '合计金额', '已出库数量', '未出库数量', '退货数量', '计划生产数量', '交付日期', '备注'];
const lineRows = [
  ['HT-20260603001-01', 'PRD-CTRL-001', '智能控制器', 'AW-C200 / 工业级', '台', money(1280), '20', money(25600), '8', '12', '0', '20', '2026-06-18', '首批交付'],
  ['HT-20260603001-02', 'PRD-SEN-011', '温湿度传感器', 'AW-S18', '只', money(168), '100', money(16800), '50', '50', '0', '100', '2026-06-18', '随控制器配套'],
];
const deliveryColumns = ['来源明细', '发货单号', '发货仓库/库位', '发货数量', 'OQC状态', '发货金额', '应收确认点', '应收单号', '应收金额', '物流状态', '发货时间'];
const deliveryRows = [
  ['HT-20260603001-01', 'OUT-20260603001', '成品仓 / A-01', '8', '通过', money(10240), '出库/OQC/签收完成后确认', 'AR-20260603001', money(10240), '运输中', '2026-06-08 14:30'],
  ['HT-20260603001-02', 'OUT-20260603002', '成品仓 / B-02', '50', '通过', money(8400), '出库/OQC/签收完成后确认', 'AR-20260603002', money(8400), '待揽收', '2026-06-09 09:15'],
];
const invoiceColumns = ['开票申请', '来源应收', '申请金额', '税率', '税额', '发票状态', '申请时间'];
const invoiceRows = [['INV-REQ-20260603001', 'AR-20260603001', money(10240), '13%', money(1331.2), '待开票', '2026-06-09 11:00']];
const paymentColumns = ['回款单号', '收款金额', '收款账户', '核销订单', '核销明细', '核销金额', '未核销金额', '信用释放', '核销状态', '收款日期'];
const paymentRows = [['PAY-20260603001', money(3000), '建设银行一般户', 'SO-20260603001', '首批订单预付款', money(3000), money(15600), '已释放 3,000.00', '部分核销', '2026-06-10']];
const productionColumns = ['来源明细', '生产需求号', '生产订单号', '产品名称', '计划生产', '已生产', '待生产', '生产状态'];
const productionRows = [
  ['HT-20260603001-01', 'MRP-20260603001', 'MO-20260603001', '智能控制器', '20', '8', '12', '生产中'],
  ['HT-20260603001-02', 'MRP-20260603002', 'MO-20260603002', '温湿度传感器', '100', '50', '50', '待排产'],
];
const logColumns = ['操作类型', '操作人', '操作时间', '操作内容'];
const logRows = [
  ['创建订单', '张国', '2026-06-03 10:12', '由合同 HT-20260603001 转订单'],
  ['信用校验', '系统', '2026-06-03 10:13', '客户信用额度充足，校验通过'],
  ['提交审批', '张国', '2026-06-03 10:16', '提交销售主管审批'],
  ['发货登记', '仓储', '2026-06-08 14:30', '生成首批发货单 OUT-20260603001'],
];

const metrics = computed(() => [
  { label: '订单金额', value: money(order.value.amount), hint: '来源合同首批下单金额' },
  { label: '应收金额', value: money(order.value.receivableAmount), hint: '已按发货节点确认' },
  { label: '已回款', value: money(3000), hint: '部分核销，释放信用' },
  { label: '生产进度', value: '58%', hint: order.value.progressName },
]);
const infoItems = computed(() => [
  { label: '订单主题', value: order.value.topic },
  { label: '订单编号', value: order.value.code },
  { label: '订单来源', value: order.value.sourceType },
  { label: '来源单据', value: order.value.sourceCode },
  { label: '下单日期', value: order.value.orderDate || '2026-06-03' },
  { label: '客户', value: order.value.customerName },
  { label: '订单金额', value: money(order.value.amount) },
  { label: '销售人员', value: order.value.ownerName || '张国' },
  { label: '订单状态', value: order.value.statusName },
  { label: '订单进展', value: order.value.progressName },
  { label: '异常标签', value: '-' },
  { label: '信用校验', value: order.value.creditCheckName },
  { label: '信用占用', value: '已占用 18,600.00' },
  { label: '应收金额', value: money(order.value.receivableAmount) },
  { label: '开票申请', value: '待开票' },
  { label: '已回款', value: money(3000) },
  { label: '交付日期', value: order.value.deliveryDate },
  { label: '交货地址', value: '深圳市南山区科技园启明科技收货仓' },
]);

function money(value: unknown) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusTone(value: unknown) {
  const text = String(value || '');
  if (['启用', '正常', '已审批', '已完成', '履约完成', '通过'].includes(text)) return 'green';
  if (['执行中', '履约中', '待发货', '生产中'].includes(text)) return 'blue';
  if (['待审批', '临近额度', '草稿', '部分核销'].includes(text)) return 'yellow';
  return 'gray';
}

function runAction(label: string) {
  actionMessage.value = `${label}动作已记录，当前详情页保持前端预览状态。`;
}

const DetailTable = defineComponent({
  props: {
    columns: { type: Array as PropType<string[]>, required: true },
    rows: { type: Array as PropType<Array<Array<string | number>>>, required: true },
  },
  setup(props) {
    return () =>
      h('div', { class: 'detail-table-wrap' }, [
        h('table', { class: 'detail-table' }, [
          h('thead', [h('tr', [h('th', { style: 'width:64px' }, '序号'), ...props.columns.map((column) => h('th', column))])]),
          h('tbody', props.rows.map((row, index) => h('tr', [h('td', index + 1), ...row.map((cell) => h('td', String(cell ?? '-')))]))),
        ]),
      ]);
  },
});
</script>

<style scoped>
.sales-detail-page {
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
  font-weight: 700;
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
  font-weight: 500;
}

.attachment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
}

.attachment-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px dashed var(--aw-border);
  border-radius: 6px;
  color: var(--aw-muted);
  font-size: 12px;
}

.attachment-card strong {
  color: var(--aw-text);
  font-size: 13px;
}

.attachment-card div {
  display: flex;
  gap: 12px;
}

.detail-table-wrap {
  overflow: auto;
}

.detail-table {
  min-width: 1180px;
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

.empty-box {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 34px 12px;
  border: 1px dashed var(--aw-border);
  border-radius: 6px;
  color: var(--aw-muted);
  text-align: center;
}
</style>
