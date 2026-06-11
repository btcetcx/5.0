<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface UnitOption {
  group: string;
  code: string;
  name: string;
  alias: string;
  tag?: string;
  recent?: boolean;
  custom?: boolean;
}

interface UnitGroup {
  key: string;
  label: string;
  icon: string;
}

const unitGroups: UnitGroup[] = [
  { key: 'recent', label: '最近使用', icon: 'line-refresh' },
  { key: 'all', label: '全部', icon: 'line-table' },
  { key: 'count', label: '计数', icon: 'line-plus' },
  { key: 'weight', label: '重量', icon: 'line-box' },
  { key: 'length', label: '长度', icon: 'line-columns' },
  { key: 'area', label: '面积', icon: 'line-folder' },
  { key: 'volume', label: '体积/容量', icon: 'line-folder' },
  { key: 'pack', label: '包装', icon: 'line-box' },
  { key: 'time', label: '时间', icon: 'line-refresh' },
  { key: 'energy', label: '能耗', icon: 'line-settings' },
  { key: 'custom', label: '自定义', icon: 'line-plus' },
];

const defaultUnits: UnitOption[] = [
  { group: 'count', code: 'tai', name: '台', alias: '台', recent: true },
  { group: 'weight', code: 'kg', name: 'kg', alias: '千克', tag: '公斤', recent: true },
  { group: 'count', code: 'ge', name: '个', alias: '个', recent: true },
  { group: 'pack', code: 'xiang', name: '箱', alias: '箱', recent: true },
  { group: 'length', code: 'm', name: 'm', alias: '米', recent: true },
  { group: 'weight', code: 'g', name: 'g', alias: '克' },
  { group: 'weight', code: 't', name: 't', alias: '吨' },
  { group: 'length', code: 'cm', name: 'cm', alias: '厘米' },
  { group: 'length', code: 'mm', name: 'mm', alias: '毫米' },
  { group: 'area', code: 'm2', name: 'm²', alias: '平方米' },
  { group: 'volume', code: 'm3', name: 'm³', alias: '立方米' },
  { group: 'volume', code: 'l', name: 'L', alias: '升' },
  { group: 'pack', code: 'bao', name: '包', alias: '包' },
  { group: 'pack', code: 'jian', name: '件', alias: '件' },
  { group: 'time', code: 'h', name: 'h', alias: '小时' },
  { group: 'time', code: 'day', name: '天', alias: '天' },
  { group: 'energy', code: 'kwh', name: 'kWh', alias: '千瓦时' },
  { group: 'custom', code: 'box24', name: '箱 × 24', alias: '24 罐装箱', custom: true },
  { group: 'custom', code: 'roll100', name: '卷 × 100m', alias: '100 米/卷', custom: true },
];

const props = withDefaults(
  defineProps<{
    open: boolean;
    value?: string;
    units?: UnitOption[];
  }>(),
  {
    value: '',
  },
);

const emit = defineEmits<{
  cancel: [];
  confirm: [unit: UnitOption];
}>();

const activeGroup = ref('recent');
const keyword = ref('');
const selectedCode = ref('');
const customName = ref('');
const customAlias = ref('');
const managerOpen = ref(false);
const managerTab = ref<'list' | 'custom' | 'rule'>('list');
const allUnits = computed(() => (props.units?.length ? props.units : defaultUnits));

const groupCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {
    recent: allUnits.value.filter((unit) => unit.recent).length,
    all: allUnits.value.length,
  };
  unitGroups.forEach((group) => {
    if (counts[group.key] == null) counts[group.key] = allUnits.value.filter((unit) => unit.group === group.key).length;
  });
  return counts;
});

const filteredUnits = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  return allUnits.value.filter((unit) => {
    const inGroup =
      activeGroup.value === 'all' ||
      (activeGroup.value === 'recent' ? unit.recent : unit.group === activeGroup.value);
    const inSearch =
      !text ||
      [unit.name, unit.alias, unit.code, unit.tag].filter(Boolean).some((value) => String(value).toLowerCase().includes(text));
    return inGroup && inSearch;
  });
});

const activeGroupLabel = computed(() => unitGroups.find((group) => group.key === activeGroup.value)?.label || '单位');
const selectedUnit = computed(() => allUnits.value.find((unit) => unit.code === selectedCode.value) || filteredUnits.value[0] || allUnits.value[0]);
const pickedName = computed(() => (activeGroup.value === 'custom' && customName.value.trim() ? customName.value.trim() : selectedUnit.value?.name || '-'));
const pickedAlias = computed(() => (activeGroup.value === 'custom' && customAlias.value.trim() ? customAlias.value.trim() : selectedUnit.value?.alias || ''));

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const matched = allUnits.value.find((unit) => unit.code === props.value || unit.name === props.value);
    activeGroup.value = matched?.group || 'recent';
    selectedCode.value = matched?.code || allUnits.value.find((unit) => unit.recent)?.code || allUnits.value[0]?.code || '';
    keyword.value = '';
    customName.value = '';
    customAlias.value = '';
    managerOpen.value = false;
  },
  { immediate: true },
);

function selectGroup(group: UnitGroup) {
  activeGroup.value = group.key;
  const first = filteredUnits.value[0];
  if (first) selectedCode.value = first.code;
}

function confirm() {
  if (activeGroup.value === 'custom' && customName.value.trim()) {
    emit('confirm', {
      group: 'custom',
      code: `custom-${Date.now()}`,
      name: customName.value.trim(),
      alias: customAlias.value.trim() || customName.value.trim(),
      custom: true,
    });
    return;
  }
  if (selectedUnit.value) emit('confirm', selectedUnit.value);
}
</script>

<template>
  <div v-if="open" class="aw-mask" @click="emit('cancel')">
    <div class="aw-unit-modal" @click.stop>
      <div class="aw-unit-head">
        <div class="aw-unit-search">
          <span class="aw-line-icon line-search"></span>
          <input v-model="keyword" placeholder="搜索单位名称 / 代码 / 别名..." />
          <span class="aw-unit-kbd">⌘K</span>
        </div>
        <button class="aw-unit-icon-btn" type="button" title="单位设置" @click="managerOpen = true">
          <span class="aw-line-icon line-settings"></span>
        </button>
        <button class="aw-modal-close" type="button" title="关闭" @click="emit('cancel')">×</button>
      </div>

      <div class="aw-unit-body">
        <aside class="aw-unit-side">
          <button
            v-for="group in unitGroups"
            :key="group.key"
            :class="['aw-unit-nav', { on: activeGroup === group.key }]"
            type="button"
            @click="selectGroup(group)"
          >
            <span :class="['aw-line-icon', group.icon]"></span>
            <span class="aw-unit-nav-text">{{ group.label }}</span>
            <em>{{ groupCounts[group.key] || 0 }}</em>
          </button>
        </aside>

        <main class="aw-unit-main">
          <div class="aw-unit-section-title">
            <b>{{ activeGroupLabel }}</b>
            <em>· {{ filteredUnits.length }}</em>
          </div>

          <div class="aw-unit-grid">
            <button
              v-for="unit in filteredUnits"
              :key="unit.code"
              :class="['aw-unit-card', { on: selectedCode === unit.code }]"
              type="button"
              @click="selectedCode = unit.code"
              @dblclick="selectedCode = unit.code; confirm()"
            >
              <span class="aw-unit-name">{{ unit.name }}</span>
              <span v-if="unit.tag" class="aw-unit-tag">{{ unit.tag }}</span>
              <span class="aw-unit-alias">{{ unit.alias }}</span>
              <span v-if="selectedCode === unit.code" class="aw-unit-check">✓</span>
            </button>
          </div>

          <div v-if="activeGroup === 'custom'" class="aw-unit-custom">
            <div class="aw-unit-custom-add">+ 新建自定义单位（如“箱 × 24”“100 m/卷”）</div>
            <div class="aw-unit-custom-form">
              <input v-model="customName" class="aw-input" placeholder="单位名称，如：箱 × 24" />
              <input v-model="customAlias" class="aw-input" placeholder="单位说明，如：24 罐装箱" />
            </div>
          </div>

          <div v-if="!filteredUnits.length" class="aw-unit-empty">暂无匹配单位，可切换分类或新建自定义单位</div>
        </main>
      </div>

      <div class="aw-unit-foot">
        <div class="aw-unit-picked">
          已选 <span>{{ pickedName }}</span> <b>{{ pickedAlias }}</b>
        </div>
        <div class="aw-unit-actions">
          <button class="aw-btn" type="button" @click="emit('cancel')">取消</button>
          <button class="aw-btn primary" type="button" @click="confirm">确认</button>
        </div>
      </div>

      <div v-if="managerOpen" class="aw-mask aw-unit-manager-mask" @click="managerOpen = false">
        <div class="aw-unit-manager" @click.stop>
          <div class="aw-unit-manager-head">
            <strong>单位管理</strong>
            <button class="aw-modal-close" type="button" @click="managerOpen = false">×</button>
          </div>
          <div class="aw-unit-manager-tabs">
            <button :class="{ on: managerTab === 'list' }" type="button" @click="managerTab = 'list'">单位列表</button>
            <button :class="{ on: managerTab === 'custom' }" type="button" @click="managerTab = 'custom'">新建自定义</button>
            <button :class="{ on: managerTab === 'rule' }" type="button" @click="managerTab = 'rule'">换算规则</button>
          </div>
          <div class="aw-unit-manager-body">
            <table v-if="managerTab === 'list'" class="aw-doc-tbl aw-unit-manager-table">
              <thead>
                <tr><th>代码</th><th>符号</th><th>名称 / 别名</th><th>类目</th><th>换算说明</th><th>启用</th><th>操作</th></tr>
              </thead>
              <tbody>
                <tr v-for="unit in allUnits.slice(0, 10)" :key="unit.code">
                  <td class="aw-num">{{ unit.code }}</td>
                  <td><b>{{ unit.name }}</b></td>
                  <td>{{ unit.alias }}</td>
                  <td>{{ unitGroups.find((group) => group.key === unit.group)?.label || unit.group }}</td>
                  <td>--</td>
                  <td><label class="aw-switch-line mini"><input checked type="checkbox" /><i></i></label></td>
                  <td><span class="aw-link">编辑</span><span class="aw-link danger">删除</span></td>
                </tr>
              </tbody>
            </table>

            <div v-else-if="managerTab === 'custom'" class="aw-unit-manager-form">
              <label><span>单位代码</span><input class="aw-input" placeholder="例如：CTN24" /></label>
              <label><span>显示符号</span><input class="aw-input" placeholder="例如：箱 × 24" /></label>
              <label><span>单位名称</span><input class="aw-input" placeholder="例如：24 罐装箱" /></label>
              <label><span>别名</span><input class="aw-input" placeholder="例如：24-pack" /></label>
              <label><span>所属类目</span><select class="aw-select"><option>计数</option><option>重量</option><option>长度</option><option>包装</option><option>自定义</option></select></label>
              <label><span>换算系数</span><input class="aw-input" placeholder="例如：1 箱 = 24 个，填 24" /></label>
            </div>

            <div v-else class="aw-unit-rule-page">
              <p>不同类目内的单位可定义换算系数，便于跨单位计算。</p>
              <table class="aw-doc-tbl aw-unit-manager-table">
                <thead><tr><th>源单位</th><th>目标单位</th><th>换算系数</th><th>关联产品</th><th>操作</th></tr></thead>
                <tbody>
                  <tr><td>箱</td><td>个</td><td>× 24</td><td>食品/罐装类</td><td><span class="aw-link">编辑</span></td></tr>
                  <tr><td>卷</td><td>m</td><td>× 100</td><td>线材/电缆</td><td><span class="aw-link">编辑</span></td></tr>
                  <tr><td>托盘</td><td>箱</td><td>× 48</td><td>整托发运</td><td><span class="aw-link">编辑</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="aw-modal-foot">
            <button class="aw-btn" type="button" @click="managerOpen = false">取消</button>
            <button class="aw-btn primary" type="button" @click="managerOpen = false">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aw-unit-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 18px 48px rgba(16, 24, 40, 0.22);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 56px);
  overflow: hidden;
  width: min(620px, calc(100vw - 56px));
}

.aw-unit-head {
  align-items: center;
  border-bottom: 1px solid var(--aw-divider);
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) 32px 32px;
  height: 58px;
  padding: 0 12px;
}

.aw-unit-search {
  align-items: center;
  background: var(--aw-surface-2);
  border-radius: 6px;
  display: flex;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
}

.aw-unit-search input {
  background: transparent;
  border: 0;
  flex: 1;
  font: inherit;
  min-width: 0;
  outline: 0;
}

.aw-unit-kbd {
  background: #fff;
  border-radius: 5px;
  color: var(--aw-fg-3);
  font-size: 12px;
  padding: 2px 6px;
}

.aw-unit-icon-btn {
  align-items: center;
  background: #fff;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  height: 30px;
  justify-content: center;
  width: 30px;
}

.aw-unit-icon-btn:hover {
  background: var(--aw-primary-light);
}

.aw-unit-body {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  min-height: 420px;
}

.aw-unit-side {
  background: var(--aw-surface-2);
  border-right: 1px solid var(--aw-divider);
  padding: 8px;
}

.aw-unit-nav {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--aw-fg-2);
  cursor: pointer;
  display: flex;
  gap: 8px;
  height: 34px;
  padding: 0 8px;
  width: 100%;
}

.aw-unit-nav.on {
  background: var(--aw-primary-light);
  color: var(--aw-primary);
  font-weight: 700;
}

.aw-unit-nav-text {
  flex: 1;
  text-align: left;
}

.aw-unit-nav em {
  background: #fff;
  border-radius: 999px;
  color: var(--aw-fg-3);
  font-style: normal;
  min-width: 22px;
  padding: 1px 6px;
  text-align: center;
}

.aw-unit-main {
  min-width: 0;
  padding: 12px;
}

.aw-unit-section-title {
  align-items: center;
  display: flex;
  gap: 6px;
  height: 28px;
  margin-bottom: 8px;
}

.aw-unit-section-title::before {
  background: var(--aw-primary);
  content: "";
  height: 16px;
  width: 3px;
}

.aw-unit-section-title em {
  color: var(--aw-fg-3);
  font-style: normal;
}

.aw-unit-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.aw-unit-card {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  cursor: pointer;
  display: grid;
  gap: 6px;
  min-height: 68px;
  padding: 10px;
  position: relative;
  text-align: left;
}

.aw-unit-card.on {
  border-color: var(--aw-primary);
  box-shadow: 0 0 0 2px rgba(86, 119, 252, 0.1);
}

.aw-unit-name {
  color: var(--aw-fg-1);
  font-size: 16px;
  font-weight: 700;
}

.aw-unit-alias {
  color: var(--aw-fg-3);
  font-size: 13px;
}

.aw-unit-tag {
  background: var(--aw-primary-light);
  border-radius: 5px;
  color: var(--aw-fg-3);
  font-size: 12px;
  padding: 2px 6px;
  position: absolute;
  right: 8px;
  top: 10px;
}

.aw-unit-check {
  color: var(--aw-primary);
  font-weight: 700;
  position: absolute;
  right: 8px;
  bottom: 8px;
}

.aw-unit-custom {
  border-top: 1px solid var(--aw-divider);
  margin-top: 12px;
  padding-top: 12px;
}

.aw-unit-custom-add {
  color: var(--aw-primary);
  margin-bottom: 10px;
}

.aw-unit-custom-form {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.aw-unit-empty {
  color: var(--aw-fg-3);
  margin-top: 22px;
  text-align: center;
}

.aw-unit-foot {
  align-items: center;
  background: var(--aw-surface-2);
  border-top: 1px solid var(--aw-divider);
  display: flex;
  gap: 16px;
  height: 58px;
  justify-content: space-between;
  padding: 0 12px;
}

.aw-unit-picked {
  color: var(--aw-fg-3);
  display: flex;
  gap: 8px;
  min-width: 0;
}

.aw-unit-picked span {
  background: var(--aw-primary-light);
  border-radius: 5px;
  color: var(--aw-primary);
  font-weight: 700;
  padding: 2px 8px;
}

.aw-unit-picked b {
  color: var(--aw-fg-1);
}

.aw-unit-actions {
  display: flex;
  gap: 10px;
}

.aw-unit-manager-mask {
  z-index: 130;
}

.aw-unit-manager {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 18px 48px rgba(16, 24, 40, 0.22);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 80px);
  overflow: hidden;
  width: min(760px, calc(100vw - 80px));
}

.aw-unit-manager-head {
  align-items: center;
  border-bottom: 1px solid var(--aw-divider);
  display: flex;
  height: 54px;
  justify-content: space-between;
  padding: 0 18px;
}

.aw-unit-manager-tabs {
  align-items: center;
  border-bottom: 1px solid var(--aw-divider);
  display: flex;
  gap: 8px;
  height: 46px;
  padding: 0 18px;
}

.aw-unit-manager-tabs button {
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--aw-fg-2);
  cursor: pointer;
  height: 46px;
}

.aw-unit-manager-tabs button.on {
  border-bottom-color: var(--aw-primary);
  color: var(--aw-primary);
  font-weight: 700;
}

.aw-unit-manager-body {
  min-height: 320px;
  overflow: auto;
  padding: 16px 18px;
}

.aw-unit-manager-table .aw-link + .aw-link {
  margin-left: 14px;
}

.aw-unit-manager-form {
  display: grid;
  gap: 14px 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.aw-unit-manager-form label {
  display: grid;
  gap: 6px;
}

.aw-unit-manager-form span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-unit-rule-page p {
  color: var(--aw-fg-3);
  margin: 0 0 12px;
}

@media (max-width: 760px) {
  .aw-unit-body {
    grid-template-columns: 1fr;
  }

  .aw-unit-side {
    border-right: 0;
    border-bottom: 1px solid var(--aw-divider);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .aw-unit-grid,
  .aw-unit-custom-form,
  .aw-unit-manager-form {
    grid-template-columns: 1fr;
  }
}
</style>
