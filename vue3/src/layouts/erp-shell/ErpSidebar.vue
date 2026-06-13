<template>
  <aside class="aw-side">
    <h4>{{ title }}</h4>
    <div
      v-for="item in items"
      :key="item.key"
      class="item"
      :class="{ on: item.key === activeKey }"
      @click="openSideItem(item, $event)"
      @mouseleave="scheduleClose"
    >
      <span class="dot side-icon">
        <AwIcon :name="sideIcon(item)" :label="item.label" size="15" />
      </span>
      <span>{{ item.label }}</span>
    </div>

    <div
      v-if="hoverItem?.flyout"
      ref="flyoutRef"
      class="aw-flyout"
      :style="{ top: `${flyoutTop}px` }"
      @mouseenter="cancelClose"
      @mouseleave="scheduleClose"
    >
      <div v-for="section in hoverItem.flyout" :key="section.title" class="aw-flyout-sec">
        <div class="aw-flyout-h">{{ section.title }}</div>
        <div class="aw-flyout-items">
          <a v-for="entry in section.items" :key="entry.label" :class="{ disabled: !entry.route }" @click="openFlyoutEntry(entry)">{{ entry.label }}</a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { FlyoutEntry, SideNavItem } from './navigation';

defineProps<{
  title: string;
  items: SideNavItem[];
  activeKey: string;
}>();

const router = useRouter();
const sideIconMap: Record<string, string> = {
  overview: 'center-template',
  list: 'line-table',
  form: 'line-doc',
  detail: 'workbench-order',
  setting: 'center-settings',
  modal: 'line-box',
  field: 'line-columns',
  base: 'center-template',
  globalFlowPrd: 'side-process',
  rdPrd: 'center-rd',
  salesPrd: 'center-sales',
  purchasePrd: 'center-purchase',
  warehousePrd: 'center-warehouse',
  productionPrd: 'center-production',
  afterSalesPrd: 'center-after-sales',
  qcPrd: 'center-qc',
  hrPrd: 'center-hr',
  equipmentPrd: 'center-equipment',
  energyPrd: 'center-energy',
  settingsPrd: 'center-settings',
  financePrd: 'center-finance',
  workbench: 'side-workbench',
  doc: 'line-doc',
  project: 'side-project',
  product: 'side-product',
  material: 'side-material',
  process: 'side-process',
  craft: 'side-craft',
  bom: 'side-bom',
  supplier: 'workbench-customer',
  pr: 'workbench-order',
  inquiry: 'workbench-quote',
  order: 'workbench-order',
  pret: 'workbench-return',
  exchange: 'center-after-sales',
  report: 'workbench-report',
  customer: 'workbench-customer',
  salesPlan: 'workbench-plan',
  quote: 'workbench-quote',
  contract: 'workbench-contract',
  saleOrder: 'workbench-order',
  sret: 'workbench-return',
  sexchange: 'center-after-sales',
  sreport: 'workbench-report',
  stockManage: 'center-warehouse',
  inbound: 'workbench-delivery',
  outbound: 'workbench-delivery',
  transfer: 'center-after-sales',
  inventoryCheck: 'workbench-approve',
  warehouseLocation: 'line-location',
  outboundQuality: 'center-qc',
  inboundQuality: 'center-qc',
  mfgDemand: 'workbench-order',
  mfgPlan: 'workbench-plan',
  mfgOrder: 'workbench-order',
  mfgWorkOrder: 'workbench-approve',
  mfgSchedule: 'workbench-plan',
  mfgOutsource: 'center-purchase',
  asService: 'center-after-sales',
  asReports: 'workbench-report',
  qcInspection: 'center-qc',
  qcQuality: 'workbench-alert',
  qcAnalysis: 'workbench-report',
  qcSettings: 'center-settings',
  hrEmployee: 'workbench-employee',
  hrOrg: 'workbench-org',
  hrAttendance: 'workbench-plan',
  hrSchedule: 'workbench-plan',
  hrPayroll: 'workbench-payment',
  hrArchive: 'line-doc',
  hrOffice: 'workbench-order',
  financeReceivables: 'workbench-payment',
  financePayables: 'workbench-payment',
  financeInvoice: 'workbench-invoice',
  financeSettlements: 'center-finance',
  financeSettings: 'center-settings',
  asset: 'center-equipment',
  maintain: 'workbench-plan',
  repair: 'workbench-equipment',
  inspect: 'workbench-approve',
  spare: 'line-box',
  monitor: 'workbench-report',
  analysis: 'workbench-report',
  save: 'center-energy',
  carbon: 'center-energy',
  system: 'center-settings',
  units: 'line-box',
  currencies: 'workbench-payment',
  accounts: 'line-lock',
  permissions: 'line-lock',
  security: 'workbench-approve',
  data: 'line-table',
  integrations: 'side-process',
};
const hoverItem = ref<SideNavItem>();
const flyoutRef = ref<HTMLElement>();
const flyoutTop = ref(80);
const activeItemCenter = ref(80);
const flyoutMinTop = 112;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function sideIcon(item: SideNavItem) {
  return sideIconMap[item.key] || '';
}

function openSideItem(item: SideNavItem, event: MouseEvent) {
  router.push(item.route);
  openFlyout(item, event);
}

function openFlyout(item: SideNavItem, event: MouseEvent) {
  clearTimeout(closeTimer);
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  activeItemCenter.value = rect.top + rect.height / 2;
  hoverItem.value = item.flyout ? item : undefined;
  if (item.key === 'asService') {
    flyoutTop.value = clampFlyoutTop(activeItemCenter.value - 110);
    return;
  }
  flyoutTop.value = clampFlyoutTop(activeItemCenter.value - 80);
  void nextTick(() => {
    if (!flyoutRef.value) return;
    flyoutTop.value = clampFlyoutTop(activeItemCenter.value - flyoutRef.value.offsetHeight / 2);
  });
}

function clampFlyoutTop(top: number) {
  const margin = 12;
  const height = flyoutRef.value?.offsetHeight || 160;
  const maxTop = Math.max(flyoutMinTop, window.innerHeight - height - margin);
  return Math.min(Math.max(flyoutMinTop, top), maxTop);
}

function scheduleClose() {
  closeTimer = setTimeout(() => {
    hoverItem.value = undefined;
  }, 150);
}

function cancelClose() {
  clearTimeout(closeTimer);
}

function openFlyoutEntry(entry: FlyoutEntry) {
  if (!entry.route) return;
  router.push(entry.route);
  hoverItem.value = undefined;
}
</script>
