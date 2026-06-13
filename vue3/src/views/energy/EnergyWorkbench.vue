<template>
  <workbench-board center-title="能耗中心" :data="workbenchData" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getWorkbenchSummary } from '@/app/api/energy/resources';
import WorkbenchBoard from '@/components/workbench/WorkbenchBoard.vue';

type WorkbenchData = {
  kpis: Array<{ tone: string; label: string; value: number; icon: string }>;
  tiles: Array<{ label: string; sub: string; count: number; tint: string; color: string; icon: string }>;
  entries: Array<{ label: string; tint: string; color: string; icon: string }>;
  notices: Array<{ type: string; text: string; time: string; tone: string }>;
  recent: Array<{ title: string; meta: string }>;
};

type SummaryCard = { key: string; label: string; value: number; unit?: string; tone?: string };
type SummaryTodo = { sourceCode?: string; title?: string; type?: string; priority?: string; status?: string };
type SummaryAlert = { pointName: string; message: string; alarmLevel: string; status: string; occuredAt: string };

const workbenchData = ref<WorkbenchData>({
  kpis: [],
  tiles: [],
  entries: [],
  notices: [],
  recent: [],
});

const kpiMeta: Record<string, { tone: string; icon: string }> = {
  todayTotal: { tone: 'mint', icon: 'line-doc' },
  todayCost: { tone: 'sand', icon: 'line-money' },
  monthTotal: { tone: 'sky', icon: 'line-chart' },
  carbonToday: { tone: 'peach', icon: 'line-leaf' },
  alarmCount: { tone: 'rose', icon: 'line-alert' },
  runningCount: { tone: 'mint', icon: 'line-check' },
};

async function loadData() {
  const summary = await getWorkbenchSummary();
  const cards = summary.cards as SummaryCard[];
  const todos = summary.todos as SummaryTodo[];
  const alerts = summary.realtimeAlerts as SummaryAlert[];
  const cardValue = (key: string) => cards.find((item) => item.key === key)?.value || 0;

  workbenchData.value = {
    kpis: cards.map((card) => ({
      tone: kpiMeta[card.key]?.tone || card.tone || 'sky',
      label: `${card.label}${card.unit ? `(${card.unit})` : ''}`,
      value: card.value,
      icon: kpiMeta[card.key]?.icon || 'line-doc',
    })),
    tiles: [
      { label: '能耗监测', sub: '采集点、实时读数、告警阈值', count: cardValue('runningCount'), tint: '#DCE7FB', color: '#5677FC', icon: 'line-doc' },
      { label: '能耗分析', sub: '趋势、分类、成本和能耗结构', count: summary.todayEnergy.length, tint: '#E8DEFB', color: '#8957D8', icon: 'line-chart' },
      { label: '能耗报表', sub: '日报、周报、月报和碳排放报表', count: 3, tint: '#DCE7FB', color: '#5677FC', icon: 'line-doc' },
      { label: '节能措施', sub: '方案、执行、效果和回收期', count: 3, tint: '#DBF3E6', color: '#10B981', icon: 'line-check' },
      { label: '碳排核算', sub: '范围一、范围二、目标和抵消措施', count: Math.round(cardValue('carbonToday')), tint: '#FEF3CD', color: '#B26A24', icon: 'line-leaf' },
      { label: '实时告警', sub: '超限、峰值和波动告警', count: cardValue('alarmCount'), tint: '#FBDFDF', color: '#D14D4D', icon: 'line-alert' },
    ],
    entries: ['新增采集点', '生成报表', '新增节能措施', '确认告警', '查看碳排'].map((label, index) => ({
      label,
      tint: ['#DCE7FB', '#E8DEFB', '#DBF3E6', '#FBDFDF', '#FEF3CD'][index],
      color: ['#5677FC', '#8957D8', '#10B981', '#D14D4D', '#B26A24'][index],
      icon: ['line-plus', 'line-doc', 'line-check', 'line-alert', 'line-leaf'][index],
    })),
    notices: alerts.length
      ? alerts.map((alert) => ({
        type: alert.alarmLevel,
        text: `${alert.pointName}：${alert.message}`,
        time: alert.occuredAt,
        tone: alert.alarmLevel === '紧急' ? 'aw-feed-tag-rose' : 'aw-feed-tag-peach',
      }))
      : [{ type: '系统', text: '能耗中心暂无待确认告警，可继续跟踪采集、分析、节能和碳排业务。', time: '今日', tone: 'aw-feed-tag-mint' }],
    recent: todos.length
      ? todos.map((item) => ({
        title: item.sourceCode || item.title || '-',
        meta: `能耗 / ${item.type || '待处理'} / ${item.priority || item.status || '-'}`,
      }))
      : cards.slice(0, 5).map((card) => ({ title: card.label, meta: `能耗中心 / 当前 ${card.value}${card.unit || ''}` })),
  };
}

onMounted(loadData);
</script>
