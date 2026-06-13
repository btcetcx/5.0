<template>
  <div class="aw-console-root" data-screen-label="ERP Console">
    <erp-topbar :items="topNavItems" :active-key="center.key" />
    <div class="aw-shell">
      <erp-sidebar :title="center.title" :items="center.sideItems" :active-key="side.key" />
      <main class="aw-main">
        <erp-page-head :title="pageTitle">
          <div v-if="openPageTags.length" class="aw-page-tags">
            <div
              v-for="tag in openPageTags"
              :key="tag.key"
              class="aw-page-tag"
              :class="{ on: tag.key === currentOpenPageTagKey }"
              role="button"
              tabindex="0"
            >
              <span class="aw-page-tag-label" @click="goOpenPageTag(tag)">{{ tag.label }}</span>
              <button
                class="aw-page-tag-close"
                type="button"
                @click.stop="closeOpenPageTag(tag.key)"
              >
                ×
              </button>
            </div>
          </div>
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
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ErpPageHead from './ErpPageHead.vue';
import ErpSidebar from './ErpSidebar.vue';
import ErpTopbar from './ErpTopbar.vue';
import { getCenterByPath, getSideByPath, topNavItems } from './navigation';

interface OpenPageTag {
  key: string;
  fullPath: string;
  path: string;
  label: string;
}

const route = useRoute();
const router = useRouter();
const center = computed(() => getCenterByPath(route.path));
const side = computed(() => getSideByPath(route.path, center.value));
const openPageTags = ref<OpenPageTag[]>([]);
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
const financeCreateTitles: Record<string, string> = {
  '/finance/receivables': '新增应收',
  '/finance/payables': '新增应付',
  '/finance/invoices': '新增发票',
  '/finance/settlements': '新增流水',
};
const financeActionCreateTitles: Record<string, Record<string, string>> = {
  '/finance/receivables': {
    receive: '登记收款',
    settle: '开始核销',
    adjust: '发起应收调整',
    reconcile: '生成客户对账单',
  },
  '/finance/payables': {
    apply: '发起付款申请',
    pay: '登记付款',
    settle: '开始付款核销',
    invoice: '登记收票认证',
    match: '开始三单匹配',
    reconcile: '生成供应商对账单',
  },
  '/finance/invoices': {
    output: '开具销项发票',
    input: '登记进项收票',
    match: '建立发票勾稽',
    red: '发起红冲',
  },
  '/finance/settlements': {
    receive: '登记收款流水',
    pay: '登记付款流水',
    refund: '登记退款付款',
    settle: '开始核销',
    bank: '导入/匹配银行流水',
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
const equipmentViewTitles: Record<string, Record<string, string>> = {
  '/equipment/maintenance': {
    execution: '保养执行',
  },
  '/equipment/repairs': {
    dispatch: '维修派工',
    acceptance: '维修任务',
  },
  '/equipment/inspections': {
    exceptions: '点检异常',
  },
  '/equipment/spares': {
    purchase: '备件采购',
  },
};
const pageTitle = computed(() => {
  if (route.path === '/rd/crafts' && route.query.action === 'new') return '新增工艺';
  const afterSalesAction = String(route.query.action || route.query.setting || '');
  if (route.path === '/after-sales/services' && afterSalesSettingTitles.includes(afterSalesAction)) return afterSalesAction;
  const equipmentTitle = equipmentViewTitles[route.path]?.[String(route.query.view || '')];
  if (equipmentTitle) return equipmentTitle;
  const financeAction = String(route.query.action || '');
  if (financeAction === 'new' && financeCreateTitles[route.path]) return financeCreateTitles[route.path];
  const financeActionKey = normalizeFinanceAction(route.path, financeAction);
  const financeTitle = financeActionTitles[route.path]?.[financeActionKey];
  if (financeTitle) return route.query.mode === 'new' ? financeActionCreateTitles[route.path]?.[financeActionKey] || financeTitle : financeTitle;
  return defaultPageTitle.value;
});
const defaultPageTitle = computed(() => {
  if (side.value.key === 'workbench' && route.path === center.value.route) return center.value.title;
  return side.value.label;
});
const isRdSubstituteList = computed(() => route.path === '/rd/bom' && route.query.tab === 'substitute');
const currentOpenPageTagKey = computed(() => getOpenPageTagKey());

watch(
  () => [route.fullPath, pageTitle.value],
  () => recordOpenPageTag(),
  { immediate: true },
);

function normalizeFinanceAction(path: string, action: string) {
  const actions = financeActionTitles[path];
  if (!actions || !action || action === 'new') return '';
  if (actions[action]) return action;
  return financeActionAliases[path]?.[action] || '';
}

function recordOpenPageTag() {
  if (!route.fullPath || route.fullPath === '/') return;

  const tagKey = currentOpenPageTagKey.value;
  const label = getOpenPageTagLabel();
  const nextTag: OpenPageTag = {
    key: tagKey,
    fullPath: route.fullPath,
    path: route.path,
    label,
  };
  const existedIndex = openPageTags.value.findIndex((tag) => tag.key === tagKey);

  if (existedIndex >= 0) {
    openPageTags.value.splice(existedIndex, 1, nextTag);
    return;
  }

  openPageTags.value.push(nextTag);
  if (openPageTags.value.length > 16) {
    openPageTags.value = openPageTags.value.slice(-16);
  }
}

function goOpenPageTag(tag: OpenPageTag) {
  if (tag.fullPath !== route.fullPath) {
    router.push(tag.fullPath);
  }
}

function closeOpenPageTag(key: string) {
  const closingIndex = openPageTags.value.findIndex((tag) => tag.key === key);
  if (closingIndex < 0) return;

  const isActive = key === currentOpenPageTagKey.value;
  const nextTags = openPageTags.value.filter((tag) => tag.key !== key);
  openPageTags.value = nextTags;

  if (!isActive) return;
  const nextTag = nextTags[closingIndex] || nextTags[closingIndex - 1];
  if (nextTag) {
    router.push(nextTag.fullPath);
    return;
  }

  const fallback = center.value.route || '/';
  if (fallback !== route.fullPath) {
    router.push(fallback);
    return;
  }

  recordOpenPageTag();
}

function getOpenPageTagKey() {
  if (route.query.action === 'new') return route.path;
  if (route.path.endsWith('/new')) return route.path.replace(/\/new$/, '');
  return route.fullPath;
}

function getOpenPageTagLabel() {
  if (route.query.action === 'new' || route.path.endsWith('/new')) {
    return defaultPageTitle.value || String(route.meta.title || route.name || route.path);
  }
  return pageTitle.value || String(route.meta.title || route.name || route.path);
}
</script>

<style scoped>
.rd-unfinished-badge {
  color: var(--aw-danger);
  font-size: 13px;
  font-weight: 700;
}
</style>
