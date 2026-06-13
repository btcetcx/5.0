<template>
  <div v-if="open" class="aw-modal-mask" @click="$emit('close')">
    <aside class="hr-drawer" @click.stop>
      <header class="hr-drawer-head">
        <div>
          <strong>{{ title }}</strong>
          <span>{{ subtitle }}</span>
        </div>
        <button class="aw-modal-close" type="button" @click="$emit('close')">×</button>
      </header>

      <main class="hr-drawer-body">
        <template v-if="type === 'filter'">
          <section class="hr-drawer-block">
            <div class="hr-drawer-title">常用筛选预设</div>
            <div class="hr-chip-row">
              <button
                v-for="preset in presets"
                :key="preset"
                :class="['hr-chip', { on: selectedPreset === preset }]"
                type="button"
                @click="selectPreset(preset)"
              >
                {{ preset }}
              </button>
            </div>
          </section>
          <section class="hr-drawer-block">
            <label class="aw-field">
              <span>状态</span>
              <select v-model="selectedStatus" class="aw-select">
                <option value="">全部</option>
                <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
              </select>
            </label>
            <label class="aw-field">
              <span>负责人</span>
              <select v-model="selectedOwner" class="aw-select">
                <option value="">全部</option>
                <option value="王人事">王人事</option>
                <option value="张园">张园</option>
                <option value="李文涛">李文涛</option>
                <option value="老庞">老庞</option>
              </select>
            </label>
            <label class="aw-field">
              <span>起止日期</span>
              <div class="hr-date-row">
                <input v-model="dateStart" class="aw-input" type="date" />
                <span>至</span>
                <input v-model="dateEnd" class="aw-input" type="date" />
              </div>
            </label>
          </section>
        </template>

        <template v-else-if="type === 'columns'">
          <section class="hr-drawer-block">
            <div class="hr-drawer-title">字段显示与固定列</div>
            <div class="hr-column-list">
              <label v-for="(column, index) in columns" :key="column" class="hr-column-row">
                <span class="hr-drag">⋮⋮</span>
                <input type="checkbox" checked :disabled="index === 0 || /操作/.test(column)" />
                <span>{{ column }}</span>
                <em v-if="index === 0 || /操作/.test(column)">固定</em>
              </label>
            </div>
          </section>
        </template>

        <template v-else-if="type === 'import'">
          <section class="hr-drawer-block">
            <div class="hr-drawer-title">下载导入模板</div>
            <button class="hr-file-card" type="button"><b>xls</b><span>{{ moduleTitle }}标准导入模板</span></button>
          </section>
          <section class="hr-drawer-block">
            <div class="hr-drawer-title">上传数据文件</div>
            <label class="hr-upload-row">
              <button class="aw-btn primary" type="button">选择文件</button>
              <span>{{ fileName || '未选择任何文件' }}</span>
              <input accept=".xls,.xlsx" type="file" @change="handleFileChange" />
            </label>
            <label class="aw-field">
              <span>重复数据处理</span>
              <select class="aw-select"><option>跳过</option><option>覆盖</option><option>报错</option></select>
            </label>
          </section>
          <section class="hr-drawer-block hr-import-result">
            <span>正常数量条数：100条</span>
            <span>异常数量条数：0条</span>
          </section>
        </template>

        <template v-else>
          <section class="hr-drawer-block">
            <div class="hr-drawer-title">导出格式</div>
            <div class="hr-export-grid">
              <button v-for="format in exportFormats" :key="format.name" :class="{ on: selectedExportFormat === format.name }" type="button" @click="selectedExportFormat = format.name">
                <b :style="{ background: format.color }">{{ format.abbr }}</b>
                <span>{{ format.name }}</span>
                <em>{{ format.ext }}</em>
              </button>
            </div>
          </section>
          <section class="hr-drawer-block">
            <div class="hr-drawer-title">导出字段</div>
            <div class="hr-field-grid">
              <label v-for="(column, index) in columns" :key="column">
                <input type="checkbox" checked :disabled="index < 2" />
                <span>{{ column }}</span>
              </label>
            </div>
          </section>
        </template>
      </main>

      <footer class="hr-drawer-foot">
        <button class="aw-tool-btn" type="button" @click="resetDrawer">重置</button>
        <button class="aw-btn primary" type="button" @click="applyDrawer">{{ applyText }}</button>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  type: 'filter' | 'columns' | 'import' | 'export';
  moduleTitle: string;
  statuses: string[];
  columns: string[];
}>();

const presets = ['本月待处理', '待审批', '异常记录', '我负责的'];
const exportFormats = [
  { name: 'Excel', ext: '.xlsx', abbr: 'xls', color: '#1D6F42' },
  { name: 'CSV', ext: '.csv', abbr: 'csv', color: '#2563EB' },
  { name: 'PDF', ext: '.pdf', abbr: 'pdf', color: '#DC2626' },
];
const selectedPreset = ref('');
const selectedStatus = ref('');
const selectedOwner = ref('');
const dateStart = ref('');
const dateEnd = ref('');
const fileName = ref('');
const selectedExportFormat = ref('Excel');

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    resetDrawer();
  },
);

const emit = defineEmits<{
  close: [];
  apply: [payload: { status?: string; owner?: string; dateStart?: string; dateEnd?: string; preset?: string; exportFormat?: string; fileName?: string }];
}>();

function selectPreset(preset: string) {
  selectedPreset.value = preset;
  if (preset.includes('待审批')) selectedStatus.value = props.statuses.find((status) => status.includes('审批')) || '';
  if (preset.includes('异常')) selectedStatus.value = props.statuses.find((status) => status.includes('异常')) || '';
  if (preset.includes('我负责')) selectedOwner.value = '王人事';
}

function handleFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  fileName.value = files?.[0]?.name || '';
}

function resetDrawer() {
  selectedPreset.value = '';
  selectedStatus.value = '';
  selectedOwner.value = '';
  dateStart.value = '';
  dateEnd.value = '';
  fileName.value = '';
  selectedExportFormat.value = 'Excel';
}

function applyDrawer() {
  emit('apply', {
    status: selectedStatus.value,
    owner: selectedOwner.value,
    dateStart: dateStart.value,
    dateEnd: dateEnd.value,
    preset: selectedPreset.value,
    exportFormat: selectedExportFormat.value,
    fileName: fileName.value,
  });
}
const titleMap = {
  filter: '筛选',
  columns: '字段',
  import: '导入',
  export: '导出',
};
const subtitleMap = {
  filter: '配置筛选条件或使用预设快速筛选',
  columns: '自定义列表显示字段和固定列',
  import: '下载模板并上传数据文件',
  export: '选择导出格式和字段',
};
const applyMap = {
  filter: '筛选',
  columns: '应用',
  import: '导入',
  export: '导出',
};
const title = titleMap[props.type];
const subtitle = subtitleMap[props.type];
const applyText = applyMap[props.type];
</script>

<style scoped>
.hr-drawer {
  animation: hrDrawerSlideIn .22s ease-out;
  background: #fff;
  box-shadow: -4px 0 24px rgba(16, 24, 40, .1);
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin-left: auto;
  width: 380px;
}

.hr-drawer-head,
.hr-drawer-foot {
  align-items: center;
  border-bottom: 1px solid var(--aw-border);
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding: 16px 20px;
}

.hr-drawer-head strong,
.hr-drawer-head span {
  display: block;
}

.hr-drawer-head span {
  color: var(--aw-fg-3);
  font-size: 12px;
  margin-top: 4px;
}

.hr-drawer-body {
  display: grid;
  gap: 16px;
  overflow: auto;
  padding: 16px 20px;
}

.hr-drawer-foot {
  border-bottom: 0;
  border-top: 1px solid var(--aw-border);
}

.hr-drawer-block {
  display: grid;
  gap: 12px;
}

.hr-drawer-title {
  font-size: 13px;
  font-weight: 700;
}

.hr-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hr-chip {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 16px;
  cursor: pointer;
  padding: 5px 12px;
}

.hr-chip.on {
  background: var(--aw-primary-light);
  border-color: var(--aw-primary);
  color: var(--aw-primary);
}

.hr-date-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr auto 1fr;
}

.hr-column-list {
  display: grid;
  gap: 4px;
}

.hr-column-row {
  align-items: center;
  border-radius: 6px;
  display: grid;
  gap: 10px;
  grid-template-columns: auto auto 1fr auto;
  padding: 9px 10px;
}

.hr-column-row:hover {
  background: var(--aw-bg);
}

.hr-column-row em {
  color: var(--aw-primary);
  font-size: 12px;
  font-style: normal;
}

.hr-drag {
  color: var(--aw-fg-3);
}

.hr-file-card {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  width: fit-content;
}

.hr-file-card b,
.hr-export-grid b {
  align-items: center;
  border-radius: 4px;
  color: #fff;
  display: inline-flex;
  font-size: 10px;
  height: 22px;
  justify-content: center;
  width: 22px;
}

.hr-file-card b {
  background: #1D6F42;
}

.hr-upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.hr-upload-row input {
  display: none;
}

.hr-upload-row span,
.hr-import-result span {
  color: var(--aw-fg-3);
  font-size: 13px;
}

.hr-import-result span:first-child {
  color: var(--aw-primary);
}

.hr-export-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, 1fr);
}

.hr-export-grid button {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 14px 0;
}

.hr-export-grid button.on {
  background: var(--aw-primary-light);
  border-color: var(--aw-primary);
}

.hr-export-grid em {
  color: var(--aw-fg-3);
  font-size: 11px;
  font-style: normal;
}

.hr-field-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
}

.hr-field-grid label {
  align-items: center;
  display: flex;
  gap: 6px;
  font-size: 13px;
}

@keyframes hrDrawerSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
