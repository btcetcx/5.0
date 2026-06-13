<script setup lang="ts">
import { ref, watch } from 'vue';
import AwUnitPickerModal from './AwUnitPickerModal.vue';

interface UnitOption {
  group: string;
  code: string;
  name: string;
  alias: string;
  tag?: string;
  recent?: boolean;
  custom?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    placeholder: '请选择单位',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [unit: UnitOption];
}>();

const open = ref(false);
const displayValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    displayValue.value = value || '';
  },
);

function confirm(unit: UnitOption) {
  displayValue.value = unit.name;
  emit('update:modelValue', unit.name);
  emit('change', unit);
  open.value = false;
}
</script>

<template>
  <div class="aw-unit-picker-field">
    <div :class="['aw-unit-picker-input', { disabled }]" @click="!disabled && (open = true)">
      <input :value="displayValue" :placeholder="placeholder" :disabled="disabled" readonly />
      <button type="button" :disabled="disabled" aria-label="打开单位选择" @click.stop="open = true">
        <span class="aw-line-icon line-search"></span>
      </button>
    </div>
    <AwUnitPickerModal
      :open="open"
      :value="displayValue"
      @cancel="open = false"
      @confirm="confirm"
    />
  </div>
</template>

<style scoped>
.aw-unit-picker-field {
  min-width: 0;
}

.aw-unit-picker-input {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  height: 34px;
  min-width: 0;
  overflow: hidden;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.aw-unit-picker-input:focus-within,
.aw-unit-picker-input:hover {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px rgba(79, 109, 245, 0.1);
}

.aw-unit-picker-input input {
  background: transparent;
  border: 0;
  color: var(--aw-fg);
  cursor: pointer;
  flex: 1;
  font-size: 13px;
  height: 100%;
  min-width: 0;
  outline: 0;
  padding: 0 8px 0 12px;
}

.aw-unit-picker-input button {
  align-items: center;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--aw-border);
  cursor: pointer;
  display: inline-flex;
  height: 100%;
  justify-content: center;
  padding: 0;
  width: 36px;
}

.aw-unit-picker-input button:hover {
  background: var(--aw-primary-light);
}

.aw-unit-picker-input.disabled {
  background: var(--aw-surface-2);
  cursor: not-allowed;
}

.aw-unit-picker-input.disabled input,
.aw-unit-picker-input.disabled button {
  cursor: not-allowed;
}
</style>
