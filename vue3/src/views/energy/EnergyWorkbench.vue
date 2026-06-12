<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getWorkbenchSummary, toneByStatus } from '@/app/api/energy/resources';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import type { AwTableColumn } from '@/components/list-page/types';

const router = useRouter();
const cards = ref<Array<{ key: string; label: string; value: number; unit?: string; tone?: string }>>([]);
const realtimeAlerts = ref<Array<{ id: string; pointName: string; message: string; alarmLevel: string; status: string; occuredAt: string }>>([]);
const todayEnergy = ref<Array<{ hour: string; value: number }>>([]);
const todos = ref<Record<string, unknown>[]>([]);
const chartMax = ref(1000);

const todoColumns: AwTableColumn[] = [
  { key: 'type', title: '待办类型', width: 100 },
  { key: 'sourceCode', title: '内容', width: 250, link: true },
  { key: 'priority', title: '级别', width: 80 },
  { key: 'status', title: '状态', width: 100 },
  { key: 'action', title: '操作', width: 80, fixed: 'right' },
];

const alertColumns: AwTableColumn[] = [
  { key: 'pointName', title: '采集点', width: 120 },
  { key: 'message', title: '告警内容', width: 300 },
  { key: 'alarmLevel', title: '级别', width: 80 },
  { key: 'occuredAt', title: '发生时间', width: 150 },
  { key: 'status', title: '状态', width: 100 },
];

function loadData() {
  getWorkbenchSummary().then((data) => {
    cards.value = data.cards;
    realtimeAlerts.value = data.realtimeAlerts;
    todayEnergy.value = data.todayEnergy;
    chartMax.value = Math.max(...data.todayEnergy.map((h) => h.value)) * 1.2;
    todos.value = data.todos.map((item) => ({ ...item, action: '处理' }));
  });
}

function openRoute(route: unknown) {
  if (typeof route === 'string') router.push(route);
}

loadData();
</script>

<template>
  <div class="energy-workbench">
    <section class="energy-workbench-head">
      <div>
        <h1>能耗中心工作台</h1>
        <p>总览企业能耗、实时监测、待处理告警和碳排放概览。</p>
      </div>
      <div class="energy-workbench-actions">
        <button class="aw-tool-btn" type="button" @click="router.push('/energy/monitor')">能耗监测</button>
        <button class="aw-btn primary" type="button" @click="router.push('/energy/reports')">查看报表</button>
      </div>
    </section>

    <section class="energy-metric-grid">
      <button v-for="card in cards" :key="card.key" class="energy-metric" type="button">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <small v-if="card.unit">{{ card.unit }}</small>
      </button>
    </section>

    <section class="energy-dashboard-grid">
      <section class="aw-form-card energy-panel">
        <div class="energy-panel-head">
          <h2>今日能耗曲线（kWh）</h2>
          <button class="aw-tool-btn" type="button" @click="loadData">刷新</button>
        </div>
        <div class="energy-chart">
          <div class="energy-bar-chart">
            <div v-for="h in todayEnergy" :key="h.hour" class="energy-bar-col">
              <div class="energy-bar" :style="{ height: (h.value / chartMax * 180) + 'px' }" :title="h.hour + ' ' + h.value + 'kWh'"></div>
              <span class="energy-bar-label">{{ h.hour.replace(':00', '') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="aw-form-card energy-panel">
        <div class="energy-panel-head">
          <h2>实时告警</h2>
        </div>
        <div v-if="realtimeAlerts.length === 0" class="energy-empty-hint">暂无待处理告警</div>
        <div v-for="alert in realtimeAlerts" :key="alert.id" class="energy-alert-item" @click="router.push('/energy/monitor')">
          <span :class="['aw-status', alert.alarmLevel === '紧急' ? 'red' : 'yellow']">{{ alert.alarmLevel }}</span>
          <div class="energy-alert-body">
            <strong>{{ alert.pointName }}</strong>
            <p>{{ alert.message }}</p>
          </div>
        </div>
      </section>
    </section>

    <section class="aw-form-card" v-if="todos.length > 0">
      <div class="energy-panel-head">
        <h2>待处理事项</h2>
      </div>
      <aw-data-table :columns="todoColumns" :rows="todos" :total="todos.length">
        <template #cell="{ column, record, value }">
          <span v-if="column.key === 'sourceCode'" class="aw-link" @click="openRoute(record.route)">{{ value }}</span>
          <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
          <span v-else-if="column.key === 'action'" class="aw-link" @click="openRoute(record.route)">处理</span>
          <span v-else>{{ value || '-' }}</span>
        </template>
      </aw-data-table>
    </section>
  </div>
</template>

<style scoped>
.energy-workbench {
  box-sizing: border-box;
  display: grid;
  gap: 16px;
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.energy-workbench-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.energy-workbench-head h1,
.energy-panel-head h2 {
  margin: 0;
}

.energy-workbench-head p {
  color: var(--aw-fg-3);
  margin: 6px 0 0;
}

.energy-workbench-actions,
.energy-panel-head {
  align-items: center;
  display: flex;
  gap: 10px;
}

.energy-panel-head {
  justify-content: space-between;
  margin-bottom: 12px;
}

.energy-metric-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.energy-metric {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 4px;
  padding: 16px;
  text-align: left;
}

.energy-metric span {
  color: var(--aw-fg-3);
  font-size: 13px;
}

.energy-metric strong {
  font-size: 24px;
}

.energy-metric small {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.energy-dashboard-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 340px;
  min-width: 0;
}

.energy-panel {
  min-width: 0;
}

.energy-chart {
  min-height: 220px;
}

.energy-bar-chart {
  align-items: flex-end;
  display: flex;
  gap: 4px;
  height: 200px;
  justify-content: space-between;
  padding-top: 16px;
}

.energy-bar-col {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.energy-bar {
  background: var(--aw-primary, #1677ff);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
  width: 100%;
}

.energy-bar-label {
  color: var(--aw-fg-3);
  font-size: 11px;
  white-space: nowrap;
}

.energy-empty-hint {
  color: var(--aw-fg-3);
  padding: 40px 0;
  text-align: center;
}

.energy-alert-item {
  align-items: flex-start;
  border-bottom: 1px solid var(--aw-border);
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 10px 0;
}

.energy-alert-item:last-child {
  border-bottom: none;
}

.energy-alert-body {
  flex: 1;
  min-width: 0;
}

.energy-alert-body strong {
  display: block;
  margin-bottom: 2px;
}

.energy-alert-body p {
  color: var(--aw-fg-3);
  font-size: 13px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .energy-metric-grid,
  .energy-dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
