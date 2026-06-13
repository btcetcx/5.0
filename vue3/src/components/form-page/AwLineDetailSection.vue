<template>
  <section class="aw-form-card aw-line-detail-section">
    <div class="aw-detail-section-title">{{ title }}</div>
    <div v-if="$slots.toolbar" class="aw-line-detail-toolbar">
      <slot name="toolbar" />
    </div>
    <div v-if="tableWrap" :class="['aw-doc-tbl-wrap', wrapClass]">
      <div class="aw-doc-tbl-inner">
        <slot />
      </div>
    </div>
    <div v-else :class="contentClass">
      <slot />
    </div>
    <div v-if="showAdd || $slots.footer" :class="['aw-line-detail-footer', footerClass]">
      <button
        v-if="showAdd"
        class="aw-tool-btn aw-line-detail-add"
        type="button"
        @pointerdown.stop
        @click.stop="emit('add')"
      >
        {{ addText }}
      </button>
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    addText?: string;
    showAdd?: boolean;
    tableWrap?: boolean;
    wrapClass?: string;
    contentClass?: string;
    footerClass?: string;
  }>(),
  {
    addText: '+ 新增明细',
    showAdd: true,
    tableWrap: true,
    wrapClass: '',
    contentClass: '',
    footerClass: '',
  },
);

const emit = defineEmits<{
  add: [];
}>();
</script>

<style scoped>
.aw-line-detail-section {
  min-width: 0;
}

.aw-line-detail-toolbar {
  margin-bottom: 10px;
}

.aw-line-detail-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.aw-line-detail-add {
  flex: none;
}
</style>
