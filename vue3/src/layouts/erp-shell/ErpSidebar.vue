<template>
  <aside class="aw-side">
    <h4>{{ title }}</h4>
    <div
      v-for="item in items"
      :key="item.key"
      class="item"
      :class="{ on: item.key === activeKey }"
      @click="router.push(item.route)"
      @mouseenter="openFlyout(item, $event)"
      @mouseleave="scheduleClose"
    >
      <span class="dot">○</span>
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
          <a v-for="entry in section.items" :key="getEntryLabel(entry)" @click="openFlyoutEntry(entry)">{{ getEntryLabel(entry) }}</a>
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
const hoverItem = ref<SideNavItem>();
const flyoutRef = ref<HTMLElement>();
const flyoutTop = ref(80);
const activeItemCenter = ref(80);
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function openFlyout(item: SideNavItem, event: MouseEvent) {
  clearTimeout(closeTimer);
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  activeItemCenter.value = rect.top + rect.height / 2;
  hoverItem.value = item.flyout ? item : undefined;
  if (item.key === 'asService') {
    flyoutTop.value = Math.max(52, activeItemCenter.value - 110);
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
  const maxTop = Math.max(margin, window.innerHeight - height - margin);
  return Math.min(Math.max(margin, top), maxTop);
}

function scheduleClose() {
  closeTimer = setTimeout(() => {
    hoverItem.value = undefined;
  }, 300);
}

function cancelClose() {
  clearTimeout(closeTimer);
}

function getEntryLabel(entry: string | FlyoutEntry): string {
  return typeof entry === 'string' ? entry : entry.label;
}

function openFlyoutEntry(entry: string | FlyoutEntry) {
  const label = typeof entry === 'string' ? entry : entry.label;
  const route = typeof entry === 'string' ? undefined : entry.route;
  const target = route || (hoverItem.value?.route && (hoverItem.value.route + '?action=' + encodeURIComponent(label)));
  if (target) router.push(target);
  hoverItem.value = undefined;
}
</script>