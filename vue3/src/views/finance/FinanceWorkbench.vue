<template>
  <workbench-board center-title="财务中心" :data="financeWorkbenchData" />
</template>

<script setup lang="ts">
import WorkbenchBoard from '@/components/workbench/WorkbenchBoard.vue';

const financeWorkbenchData = {
  kpis: [
    { tone: 'mint', label: '待收款应收', value: 12, icon: '¥' },
    { tone: 'rose', label: '逾期应收', value: 4, icon: '!' },
    { tone: 'peach', label: '待付款应付', value: 9, icon: '✓' },
    { tone: 'sky', label: '待开票', value: 7, icon: '□' },
    { tone: 'lilac', label: '待收票认证', value: 5, icon: '▣' },
    { tone: 'sand', label: '待退款付款', value: 3, icon: '↩' },
    { tone: 'mint', label: '待应收调整', value: 2, icon: '✎' },
    { tone: 'peach', label: '待三单匹配', value: 6, icon: '▦' },
    { tone: 'sky', label: '待银行对账', value: 8, icon: '⌕' },
  ],
  tiles: [
    { label: '应收', sub: '应收管理', count: 36, tint: '#DCE7FB', color: '#5677FC', icon: '¥' },
    { label: '应付', sub: '应付管理', count: 28, tint: '#DBF3E6', color: '#10B981', icon: '✓' },
    { label: '发票', sub: '发票管理', count: 24, tint: '#FEF3CD', color: '#B26A24', icon: '□' },
    { label: '资金', sub: '资金核销', count: 31, tint: '#E8DEFB', color: '#8957D8', icon: '▦' },
    { label: '设置', sub: '财务设置', count: 4, tint: '#DCE7FB', color: '#5677FC', icon: '▣' },
  ],
  entries: [
    { label: '新增应收', tint: '#DCE7FB', color: '#5677FC', icon: '¥' },
    { label: '付款申请', tint: '#DBF3E6', color: '#10B981', icon: '✓' },
    { label: '销项开票', tint: '#FEF3CD', color: '#B26A24', icon: '□' },
    { label: '收款登记', tint: '#E8DEFB', color: '#8957D8', icon: '▦' },
    { label: '银行对账', tint: '#DCE7FB', color: '#5677FC', icon: '⌕' },
  ],
  notices: [
    { type: '重要', text: '逾期应收和超信用客户已进入今日风险提醒，请优先复核回款计划', time: '30分钟前', tone: 'aw-feed-tag-rose' },
    { type: '系统', text: '采购入库暂估、到票认证、三单匹配状态已同步到财务中心', time: '2小时前', tone: 'aw-feed-tag-mint' },
    { type: '公告', text: '售后退款、应收调整、发票红冲将作为售后关闭前置校验', time: '今天 09:20', tone: 'aw-feed-tag-peach' },
    { type: '制度', text: '财务中心第一阶段仅保留应收、应付、发票、资金核销和设置入口', time: '昨天 17:30', tone: 'aw-feed-tag-sky' },
  ],
  recent: [
    { title: 'AR-202605-001 销售订单应收核销', meta: '财务 · 应收管理 · 12分钟前' },
    { title: 'AP-202605-001 采购入库暂估应付', meta: '财务 · 应付管理 · 35分钟前' },
    { title: 'INV-202605-001 销项发票开票回写', meta: '财务 · 发票管理 · 1小时前' },
    { title: 'BNK-202605-001 客户回款银行对账', meta: '财务 · 资金核销 · 今天 10:18' },
    { title: 'AS-202605-006 售后退款付款待处理', meta: '售后 · 财务联动 · 昨天 16:40' },
  ],
};
</script>
