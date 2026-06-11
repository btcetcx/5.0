<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getWorkbenchSummary, toneByStatus } from '@/app/api/equipment/resources';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import type { AwTableColumn } from '@/components/list-page/types';

const router = useRouter();
const cards = ref<Array<{ key: string; label: string; value: number }>>([]);
const todos = ref<Record<string, unknown>[]>([]);
const risks = ref<Array<{ id: string; title: string; desc: string; tone: string; route: string }>>([]);

const todoColumns: AwTableColumn[] = [
  { key: 'type', title: '待办类型', width: 120 },
  { key: 'sourceCode', title: '来源单据', width: 150, link: true },
  { key: 'equipmentName', title: '设备名称', width: 160 },
  { key: 'equipmentCode', title: '设备编号', width: 150 },
  { key: 'location', title: '位置/车间', width: 160 },
  { key: 'ownerName', title: '责任人', width: 110 },
  { key: 'planTime', title: '计划时间', width: 150 },
  { key: 'priority', title: '优先级', width: 90 },
  { key: 'status', title: '状态', width: 100 },
  { key: 'action', title: '操作', width: 90, fixed: 'right' },
];

function loadData() {
  getWorkbenchSummary().then((data) => {
    cards.value = data.cards;
    todos.value = data.todos.map((item) => ({ ...item, action: '查看' }));
    risks.value = data.risks;
  });
}

function openRoute(route: unknown) {
  if (typeof route === 'string') router.push(route);
}

loadData();
</script>

<template>
  <div class="equipment-workbench">
    <section class="equipment-workbench-head">
      <div>
        <h1>设备中心工作台</h1>
        <p>总览设备状态、待办任务和风险提醒，复杂编辑在各二级模块内完成。</p>
      </div>
      <div class="equipment-workbench-actions">
        <button class="aw-tool-btn" type="button" @click="router.push('/equipment/assets')">设备台账</button>
        <button class="aw-btn primary" type="button" @click="router.push('/equipment/repairs?action=new')">新建报修</button>
      </div>
    </section>

    <section class="equipment-metric-grid">
      <button v-for="card in cards" :key="card.key" class="equipment-metric" type="button">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </button>
    </section>

    <section class="equipment-dashboard-grid">
      <section class="aw-form-card equipment-panel">
        <div class="equipment-panel-head">
          <h2>待办列表</h2>
          <button class="aw-tool-btn" type="button" @click="loadData">刷新</button>
        </div>
        <aw-data-table :columns="todoColumns" :rows="todos" :total="todos.length">
          <template #cell="{ column, record, value }">
            <span v-if="column.key === 'sourceCode'" class="aw-link" @click="openRoute(record.route)">{{ value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else-if="column.key === 'action'" class="aw-link" @click="openRoute(record.route)">查看</span>
            <span v-else>{{ value || '-' }}</span>
          </template>
        </aw-data-table>
      </section>

      <section class="aw-form-card equipment-risk-panel">
        <div class="equipment-panel-head">
          <h2>风险提醒</h2>
        </div>
        <button v-for="risk in risks" :key="risk.id" class="equipment-risk" type="button" @click="router.push(risk.route)">
          <span :class="['aw-status', risk.tone]">{{ risk.title }}</span>
          <strong>{{ risk.desc }}</strong>
        </button>
      </section>
    </section>
  </div>
</template>

<style scoped>
.equipment-workbench {
  box-sizing: border-box;
  display: grid;
  gap: 16px;
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.equipment-workbench-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.equipment-workbench-head h1,
.equipment-panel-head h2 {
  margin: 0;
}

.equipment-workbench-head p {
  color: var(--aw-fg-3);
  margin: 6px 0 0;
}

.equipment-workbench-actions,
.equipment-panel-head {
  align-items: center;
  display: flex;
  gap: 10px;
}

.equipment-panel-head {
  justify-content: space-between;
  margin-bottom: 12px;
}

.equipment-metric-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.equipment-metric {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 8px;
  padding: 16px;
  text-align: left;
}

.equipment-metric span {
  color: var(--aw-fg-3);
}

.equipment-metric strong {
  font-size: 26px;
}

.equipment-dashboard-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 320px;
  min-width: 0;
}

.equipment-panel,
.equipment-risk-panel {
  min-width: 0;
}

.equipment-risk-panel {
  align-self: start;
  display: grid;
  gap: 10px;
}

.equipment-risk {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 8px;
  padding: 12px;
  text-align: left;
}

@media (max-width: 1100px) {
  .equipment-metric-grid,
  .equipment-dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
