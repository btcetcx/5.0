<template>
  <div class="hr-workbench">
    <section class="aw-card">
      <div class="section-title">
        <span>待办事项</span>
        <button class="aw-card-meta aw-card-meta-btn" type="button" @click="refreshing = !refreshing">刷新</button>
      </div>
      <div class="aw-kpi-grid">
        <workbench-kpi
          v-for="item in hrWorkbenchData.kpis"
          :key="item.label"
          :action="refreshing ? '已刷新' : '查看'"
          :icon="item.icon"
          :label="item.label"
          :tone="kpiTone(item.tone)"
          :value="item.value"
          @click="openTodo(item.label)"
        />
      </div>
    </section>

    <section class="aw-card">
      <div class="section-title">
        <span>业务导航</span>
        <span class="aw-card-meta">来自当前人力导航矩阵</span>
      </div>
      <div class="aw-tile-grid">
        <workbench-tile
          v-for="item in tiles"
          :key="item.label"
          :color="item.color"
          :count="item.count"
          :icon="item.icon"
          :label="item.label"
          :sub="item.sub"
          :tint="item.tint"
          class="hr-clickable"
          @click="router.push(item.route)"
        />
      </div>
    </section>

    <section class="aw-card">
      <div class="section-title">
        <span>快捷入口</span>
        <span class="aw-card-meta">员工、考勤、薪酬、档案高频动作</span>
      </div>
      <div class="hr-entry-grid">
        <button v-for="entry in entries" :key="entry.label" class="hr-entry" type="button" @click="router.push(entry.route)">
          <span :style="{ background: entry.tint, color: entry.color }">{{ entry.icon }}</span>
          <strong>{{ entry.label }}</strong>
        </button>
      </div>
    </section>

    <section class="hr-feed-grid">
      <div class="aw-card">
        <div class="section-title">
          <span>公告 / 消息中心</span>
          <span class="aw-card-meta">全部</span>
        </div>
        <div class="hr-feed">
          <div v-for="item in hrWorkbenchData.notices" :key="item.text" class="hr-feed-row">
            <span>{{ item.type }}</span>
            <b>{{ item.text }}</b>
            <em>{{ item.time }}</em>
          </div>
        </div>
      </div>
      <div class="aw-card">
        <div class="section-title">
          <span>最近访问</span>
          <span class="aw-card-meta">查看全部</span>
        </div>
        <div v-for="item in hrWorkbenchData.recent" :key="item.title" class="hr-recent-row">
          <span>•</span>
          <b>{{ item.title }}</b>
          <em>{{ item.meta }}</em>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import WorkbenchKpi from '@/components/workbench/WorkbenchKpi.vue';
import WorkbenchTile from '@/components/workbench/WorkbenchTile.vue';
import { hrModuleConfigs, hrWorkbenchData } from './hrResource.config';

const router = useRouter();
const refreshing = ref(false);
const tiles = computed(() => hrWorkbenchData.tiles.map((tile) => {
  if (tile.label === '岗位说明书') return { ...tile, route: '/hr/positions?action=岗位说明书' };
  const matched = Object.values(hrModuleConfigs).find((config) => config.title === tile.label);
  return { ...tile, route: matched?.route || '/hr/employees' };
}));
const entries = [
  { label: '新增员工', route: '/hr/employees?action=new', tint: '#E8F0FF', color: '#315EFB', icon: '+' },
  { label: '考勤处理', route: '/hr/attendance?action=考勤记录', tint: '#FFF2D7', color: '#A26500', icon: '勤' },
  { label: '薪酬核算', route: '/hr/payroll', tint: '#F1EAFE', color: '#7253C7', icon: '薪' },
  { label: '档案到期', route: '/hr/archives?action=合同档案', tint: '#FFE9EA', color: '#BA2D3E', icon: '档' },
];

function kpiTone(tone: string) {
  return ['mint', 'peach', 'sky', 'rose', 'lilac', 'sand'].includes(tone) ? tone as 'mint' | 'peach' | 'sky' | 'rose' | 'lilac' | 'sand' : 'sky';
}

function openTodo(label: string) {
  if (/入职/.test(label)) router.push('/hr/employees?action=员工列表');
  else if (/审批/.test(label)) router.push('/hr/employees?setting=approvals');
  else if (/考勤/.test(label)) router.push('/hr/attendance?action=考勤记录');
  else if (/薪酬/.test(label)) router.push('/hr/payroll');
  else if (/档案/.test(label)) router.push('/hr/archives?action=合同档案');
  else router.push('/hr/orgs');
}
</script>

<style scoped>
.hr-workbench {
  display: grid;
  gap: 16px;
  overflow: auto;
  padding: 18px;
}

.hr-clickable {
  cursor: pointer;
}

.hr-entry-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.hr-entry {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  min-height: 58px;
  padding: 10px 12px;
}

.hr-entry span {
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  flex: 0 0 34px;
  height: 34px;
  justify-content: center;
}

.hr-entry strong {
  font-size: 13px;
}

.hr-feed-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr);
}

.hr-feed,
.hr-recent-row {
  display: grid;
  gap: 10px;
}

.hr-feed-row,
.hr-recent-row {
  align-items: center;
  border-bottom: 1px solid var(--aw-border);
  display: grid;
  gap: 10px;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  min-height: 38px;
}

.hr-feed-row span {
  color: var(--aw-primary);
}

.hr-feed-row b,
.hr-recent-row b {
  font-weight: 500;
}

.hr-feed-row em,
.hr-recent-row em {
  color: var(--aw-fg-3);
  font-style: normal;
}

@media (max-width: 1100px) {
  .hr-entry-grid,
  .hr-feed-grid {
    grid-template-columns: 1fr;
  }
}
</style>
