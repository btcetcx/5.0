<template>
  <div class="aw-topbar">
    <div class="brand">海南傲为智造</div>
    <div class="tabs">
      <button
        v-for="item in visibleItems"
        :key="item.key"
        type="button"
        class="tab"
        :class="{ on: item.key === activeKey, pending: item.status === 'pending' }"
        @click="router.push(item.route)"
      >
        <span class="tab-ic"><AwIcon :name="centerIcon(item.key)" :label="item.label" size="16" /></span>
        <span>{{ item.label }}</span>
      </button>
    </div>
    <div class="right">
      <button class="ic aw-top-help" type="button" title="帮助中心">
        <AwIcon name="line-doc" size="14" />
      </button>
      <button class="aw-top-notice" type="button" title="我的待办事项">
        <AwIcon name="workbench-alert" size="17" />
        <span class="aw-top-notice-badge">4</span>
      </button>
      <div class="av">大</div>
      <span>老大</span>
    </div>
  </div>
  <button class="aw-float-help" type="button" title="帮助中心">
    <AwIcon name="line-doc" size="20" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { TopNavItem } from './navigation';

const props = defineProps<{
  items: TopNavItem[];
  activeKey: string;
}>();

const router = useRouter();
const visibleItems = computed(() => props.items.filter((item) => !item.hidden));

const centerIconMap: Record<string, string> = {
  templates: 'center-template',
  prd: 'center-prd',
  rd: 'center-rd',
  pur: 'center-purchase',
  sale: 'center-sales',
  wh: 'center-warehouse',
  warehouse: 'center-warehouse',
  production: 'center-production',
  afterSales: 'center-after-sales',
  qc: 'center-qc',
  hr: 'center-hr',
  finance: 'center-finance',
  equipment: 'center-equipment',
  energy: 'center-energy',
  set: 'center-settings',
};

function centerIcon(key: string) {
  return centerIconMap[key] || 'line-doc';
}
</script>
