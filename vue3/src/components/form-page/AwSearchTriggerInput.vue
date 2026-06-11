<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
  }>(),
  {
    modelValue: '',
    placeholder: '请选择',
    disabled: false,
    readonly: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  open: [];
}>();

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}

function openPicker() {
  emit('open');
}
</script>

<template>
  <div :class="['aw-search-trigger-input', { disabled }]">
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @input="handleInput"
    />
    <button type="button" :disabled="disabled" aria-label="打开选择弹窗" @click="openPicker">
      <span class="aw-line-icon line-search"></span>
    </button>
  </div>
</template>

<style scoped>
.aw-search-trigger-input {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  display: flex;
  height: 34px;
  min-width: 0;
  overflow: hidden;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.aw-search-trigger-input:focus-within {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px rgba(79, 109, 245, 0.12);
}

.aw-search-trigger-input input {
  background: transparent;
  border: 0;
  color: var(--aw-fg);
  flex: 1;
  font-size: 13px;
  height: 100%;
  min-width: 0;
  outline: 0;
  padding: 0 8px 0 12px;
}

.aw-search-trigger-input button {
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

.aw-search-trigger-input button:hover {
  background: var(--aw-primary-light);
}

.aw-search-trigger-input.disabled {
  background: var(--aw-surface-2);
  color: var(--aw-fg-3);
}

.aw-search-trigger-input.disabled button {
  cursor: not-allowed;
}
</style>
