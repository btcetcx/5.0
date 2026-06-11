<template>
  <div class="aw-console-root" data-screen-label="ERP Console">
    <erp-topbar :items="topNavItems" :active-key="center.key" />
    <div class="aw-shell">
      <erp-sidebar :title="center.title" :items="center.sideItems" :active-key="side.key" />
      <main class="aw-main">
        <erp-page-head :title="pageTitle">
          <span v-if="isRdSubstituteList" class="rd-unfinished-badge">未完成</span>
          <button v-if="side.key === 'workbench'" class="aw-workbench-board-btn" type="button">
            <span>▧</span>
            <span>大屏看板</span>
          </button>
        </erp-page-head>
        <div class="aw-page-body">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ErpPageHead from './ErpPageHead.vue';
import ErpSidebar from './ErpSidebar.vue';
import ErpTopbar from './ErpTopbar.vue';
import { getCenterByPath, getSideByPath, topNavItems } from './navigation';

const route = useRoute();
const center = computed(() => getCenterByPath(route.path));
const side = computed(() => getSideByPath(route.path, center.value));
const afterSalesSettingTitles = ['售后原因', '投诉问题', '售后类型', '处理方式', '保修政策', 'SLA 规则'];
const financeActionTitles: Record<string, Record<string, string>> = {
  '/finance/receivables': {
    receive: '收款登记',
    settle: '核销收款',
    adjust: '应收调整',
    reconcile: '客户对账',
  },
  '/finance/payables': {
    apply: '付款申请',
    pay: '付款登记',
    settle: '付款核销',
    invoice: '收票认证',
    match: '三单匹配',
    reconcile: '供应商对账',
  },
  '/finance/invoices': {
    output: '销项开票',
    input: '进项收票认证',
    match: '发票勾稽',
    red: '红冲处理',
  },
  '/finance/settlements': {
    receive: '收款登记',
    pay: '付款登记',
    refund: '退款付款',
    settle: '核销处理',
    bank: '银行对账',
  },
};
const financeActionAliases: Record<string, Record<string, string>> = {
  '/finance/receivables': {
    应收列表: '',
    收款登记: 'receive',
    核销收款: 'settle',
    应收调整: 'adjust',
    客户对账: 'reconcile',
  },
  '/finance/payables': {
    应付列表: '',
    付款申请: 'apply',
    付款登记: 'pay',
    付款核销: 'settle',
    收票认证: 'invoice',
    三单匹配: 'match',
    供应商对账: 'reconcile',
  },
  '/finance/invoices': {
    发票列表: '',
    销项开票: 'output',
    进项认证: 'input',
    进项收票认证: 'input',
    发票勾稽: 'match',
    红冲处理: 'red',
  },
  '/finance/settlements': {
    资金列表: '',
    收款登记: 'receive',
    付款登记: 'pay',
    退款付款: 'refund',
    核销: 'settle',
    核销处理: 'settle',
    银行对账: 'bank',
  },
};
const pageTitle = computed(() => {
  if (route.path === '/rd/crafts' && route.query.action === 'new') return '新增工艺';
  const afterSalesAction = String(route.query.action || route.query.setting || '');
  if (route.path === '/after-sales/services' && afterSalesSettingTitles.includes(afterSalesAction)) return afterSalesAction;
  const financeAction = String(route.query.action || '');
  const financeActionKey = normalizeFinanceAction(route.path, financeAction);
  const financeTitle = financeActionTitles[route.path]?.[financeActionKey];
  if (financeTitle) return route.query.mode === 'new' ? `新增${financeTitle}` : financeTitle;
  return side.value.label;
});
const isRdSubstituteList = computed(() => route.path === '/rd/bom' && route.query.tab === 'substitute');

function normalizeFinanceAction(path: string, action: string) {
  const actions = financeActionTitles[path];
  if (!actions || !action || action === 'new') return '';
  if (actions[action]) return action;
  return financeActionAliases[path]?.[action] || '';
}
</script>

<style scoped>
.rd-unfinished-badge {
  color: var(--aw-danger);
  font-size: 13px;
  font-weight: 700;
}
</style>
