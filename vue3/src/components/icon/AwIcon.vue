<script setup lang="ts">
import { computed } from 'vue';
import { icons, resolveIconName } from './icons';

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    size?: number | string;
    strokeWidth?: number | string;
  }>(),
  {
    name: '',
    label: '',
    size: 16,
    strokeWidth: 1.8,
  },
);

const iconName = computed(() => resolveIconName(props.name, props.label));
const iconComponent = computed(() => icons[iconName.value]);
const iconSize = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size));
</script>

<template>
  <component
    :is="iconComponent"
    class="aw-icon"
    :width="iconSize"
    :height="iconSize"
    :stroke-width="strokeWidth"
  />
</template>
