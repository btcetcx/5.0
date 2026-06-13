<script setup lang="ts">
import { computed, ref } from 'vue';
import type { StrategyRule, StrategyTab } from './types';

const props = defineProps<{
  title: string;
  description?: string;
  tabs: StrategyTab[];
}>();

const emit = defineEmits<{
  (event: 'update-rule', tabKey: string, rule: StrategyRule): void;
  (event: 'reset'): void;
  (event: 'save'): void;
}>();

const activeTab = ref(props.tabs[0]?.key || '');
const current = computed(() => props.tabs.find((tab) => tab.key === activeTab.value) || props.tabs[0]);
</script>

<template>
  <section class="aw-form-card aw-policy-card">
    <div class="aw-policy-head">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
    </div>
    <div class="aw-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['t', { on: activeTab === tab.key }]"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="aw-policy-list">
      <div v-for="row in current?.rows || []" :key="row.key" class="aw-policy-group">
        <div :class="['aw-policy-row', { 'aw-policy-row-parent': row.children?.length }]">
          <div>
            <div class="aw-policy-row-title">{{ row.title }}</div>
            <div class="aw-policy-row-sub">{{ row.sub }}</div>
          </div>
          <div class="aw-policy-row-control">
            <select
              v-if="row.type === 'select'"
              :value="row.value"
              class="aw-select"
              @change="emit('update-rule', current?.key || '', { ...row, value: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="option in row.options || []" :key="option">{{ option }}</option>
            </select>
            <div v-else class="aw-policy-radio">
              <button
                :class="['aw-radio', { on: row.enabled !== false }]"
                type="button"
                @click="emit('update-rule', current?.key || '', { ...row, enabled: true })"
              >
                <span class="aw-dot"></span>启用
              </button>
              <button
                :class="['aw-radio', { on: row.enabled === false }]"
                type="button"
                @click="emit('update-rule', current?.key || '', { ...row, enabled: false })"
              >
                <span class="aw-dot"></span>关闭
              </button>
            </div>
          </div>
        </div>
        <div v-if="row.children?.length && row.enabled !== false" class="aw-policy-children">
          <div v-for="child in row.children" :key="child.key" class="aw-policy-row aw-policy-child-row">
            <div>
              <div class="aw-policy-row-title">{{ child.title }}</div>
              <div class="aw-policy-row-sub">{{ child.sub }}</div>
            </div>
            <div class="aw-policy-row-control">
              <select
                v-if="child.type === 'select'"
                :value="child.value"
                class="aw-select"
                @change="emit('update-rule', current?.key || '', { ...child, value: ($event.target as HTMLSelectElement).value })"
              >
                <option v-for="option in child.options || []" :key="option">{{ option }}</option>
              </select>
              <div v-else class="aw-policy-radio">
                <button
                  :class="['aw-radio', { on: child.enabled !== false }]"
                  type="button"
                  @click="emit('update-rule', current?.key || '', { ...child, enabled: true })"
                >
                  <span class="aw-dot"></span>启用
                </button>
                <button
                  :class="['aw-radio', { on: child.enabled === false }]"
                  type="button"
                  @click="emit('update-rule', current?.key || '', { ...child, enabled: false })"
                >
                  <span class="aw-dot"></span>关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="aw-policy-foot">
      <button class="aw-tool-btn" type="button" @click="emit('reset')">重置默认</button>
      <button class="aw-btn primary" type="button" @click="emit('save')">保存</button>
    </div>
  </section>
</template>

<style scoped>
.aw-policy-group {
  margin-bottom: 10px;
}

.aw-policy-group > .aw-policy-row {
  margin-bottom: 0;
}

.aw-policy-row-parent {
  background: #fff;
}

.aw-policy-radio .aw-radio {
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
}

.aw-policy-children {
  margin: 8px 0 0 18px;
  padding-left: 14px;
  border-left: 2px solid #dbe7ff;
}

.aw-policy-child-row {
  background: #f8fbff;
}
</style>
