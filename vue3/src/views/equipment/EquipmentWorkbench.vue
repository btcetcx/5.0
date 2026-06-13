<template>
  <workbench-board center-title="设备中心" :data="workbenchData" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getWorkbenchSummary } from '@/app/api/equipment/resources';
import WorkbenchBoard from '@/components/workbench/WorkbenchBoard.vue';

type WorkbenchData = {
  kpis: Array<{ tone: string; label: string; value: number; icon: string }>;
  tiles: Array<{ label: string; sub: string; count: number; tint: string; color: string; icon: string }>;
  entries: Array<{ label: string; tint: string; color: string; icon: string }>;
  notices: Array<{ type: string; text: string; time: string; tone: string }>;
  recent: Array<{ title: string; meta: string }>;
};

type SummaryCard = { key: string; label: string; value: number };
type SummaryTodo = {
  sourceCode?: string;
  equipmentName?: string;
  type?: string;
  status?: string;
  planTime?: string;
};
type SummaryRisk = { title: string; desc: string; tone: string };

const workbenchData = ref<WorkbenchData>({
  kpis: [],
  tiles: [],
  entries: [],
  notices: [],
  recent: [],
});

const kpiMeta: Record<string, { tone: string; icon: string }> = {
  total: { tone: 'sky', icon: '设' },
  running: { tone: 'mint', icon: '✓' },
  fault: { tone: 'rose', icon: '!' },
  inspection: { tone: 'peach', icon: '点' },
  maintenance: { tone: 'sand', icon: '保' },
  dispatch: { tone: 'rose', icon: '派' },
  accept: { tone: 'lilac', icon: '验' },
  spares: { tone: 'peach', icon: '备' },
};

const entryStyles = [
  { tint: '#DCE7FB', color: '#5677FC', icon: '设' },
  { tint: '#DBF3E6', color: '#10B981', icon: '修' },
  { tint: '#FEF3CD', color: '#B26A24', icon: '保' },
  { tint: '#E8DEFB', color: '#8957D8', icon: '点' },
  { tint: '#DCE7FB', color: '#5677FC', icon: '检' },
  { tint: '#DBF3E6', color: '#10B981', icon: '备' },
];

async function loadData() {
  const summary = await getWorkbenchSummary();
  const cards = summary.cards as SummaryCard[];
  const todos = summary.todos as SummaryTodo[];
  const risks = summary.risks as SummaryRisk[];

  const cardValue = (key: string) => cards.find((item) => item.key === key)?.value || 0;

  workbenchData.value = {
    kpis: cards.map((card) => ({
      tone: kpiMeta[card.key]?.tone || 'sky',
      label: card.label,
      value: card.value,
      icon: kpiMeta[card.key]?.icon || '▣',
    })),
    tiles: [
      { label: '设备台账', sub: '分类、状态、责任人与附件', count: cardValue('total'), tint: '#DCE7FB', color: '#5677FC', icon: '设' },
      { label: '保养执行', sub: '计划、执行、项目标准、预警', count: cardValue('maintenance'), tint: '#FEF3CD', color: '#B26A24', icon: '保' },
      { label: '维修闭环', sub: '报修、派工、处理、验收', count: cardValue('dispatch') + cardValue('accept'), tint: '#FBDFDF', color: '#D14D4D', icon: '修' },
      { label: '点检异常', sub: '计划、执行、异常转维修', count: cardValue('inspection'), tint: '#DBF3E6', color: '#10B981', icon: '点' },
      { label: '备件库存', sub: '库存、安全线、领用记录', count: cardValue('spares'), tint: '#E8DEFB', color: '#8957D8', icon: '备' },
      { label: '设备设置', sub: '分类、状态、项目、策略', count: 6, tint: '#DCE7FB', color: '#5677FC', icon: '▣' },
    ],
    entries: ['新增设备', '新建报修', '新增保养计划', '点检计划', '点检执行', '新增备件'].map((label, index) => ({
      label,
      ...entryStyles[index],
    })),
    notices: buildNotices(risks),
    recent: buildRecent(todos, risks),
  };
}

function buildNotices(risks: SummaryRisk[]) {
  const mapped = risks.slice(0, 5).map((risk) => ({
    type: risk.title,
    text: risk.desc,
    time: '今日',
    tone: feedTone(risk.tone),
  }));
  if (mapped.length) return mapped;
  return [
    { type: '系统', text: '设备中心暂无高风险提醒，可继续处理台账、保养、维修、点检和备件业务', time: '今日', tone: 'aw-feed-tag-mint' },
  ];
}

function buildRecent(todos: SummaryTodo[], risks: SummaryRisk[]) {
  const todoRecent = todos.slice(0, 5).map((item) => ({
    title: `${item.sourceCode || '-'} ${item.equipmentName || ''}`.trim(),
    meta: `设备 · ${item.type || '待办'} · ${item.status || '-'} · ${item.planTime || '-'}`,
  }));
  if (todoRecent.length >= 5) return todoRecent;
  return [
    ...todoRecent,
    ...risks.slice(0, 5 - todoRecent.length).map((risk) => ({
      title: risk.title,
      meta: `设备 · 风险提醒 · ${risk.desc}`,
    })),
  ];
}

function feedTone(tone: string) {
  if (tone === 'red') return 'aw-feed-tag-rose';
  if (tone === 'yellow') return 'aw-feed-tag-peach';
  if (tone === 'green') return 'aw-feed-tag-mint';
  return 'aw-feed-tag-sky';
}

onMounted(loadData);
</script>
