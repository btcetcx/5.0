<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getEnergySettings, updateEnergySettings } from '@/app/api/energy/resources';
import type { EnergySettings } from '@/app/api/energy/types';

const settings = ref<EnergySettings>({ collectionPoints: [], alarmThresholds: [], analysisDimensions: [], carbonFactors: [], areas: [] });
const activeTab = ref('points');
const toastText = ref('');

const props = withDefaults(defineProps<{ defaultTab?: string }>(), { defaultTab: '' });

const settingTabMap: Record<string, string> = { 采集点管理: 'points', 告警阈值: 'thresholds', 分析维度: 'dimensions', 排放因子: 'factors', 区域设置: 'areas' };

onMounted(() => {
  if (props.defaultTab && settingTabMap[props.defaultTab]) {
    activeTab.value = settingTabMap[props.defaultTab];
  }
  getEnergySettings().then((data) => { settings.value = data; });
});

function save() {
  updateEnergySettings(settings.value).then(() => {
    toastText.value = '设置已保存';
    setTimeout(() => { toastText.value = ''; }, 2000);
  });
}

function addPoint() {
  settings.value.collectionPoints.push({ id: `cp_${Date.now()}`, name: '', code: '', meterType: '智能电表', location: '', unit: 'kWh', status: '在线' });
}

function removePoint(idx: number) {
  settings.value.collectionPoints.splice(idx, 1);
}

function addThreshold() {
  settings.value.alarmThresholds.push({ id: `at_${Date.now()}`, pointId: '', pointName: '', maxValue: 0, minValue: 0, unit: 'kWh', enabled: true });
}

function addArea() {
  settings.value.areas.push({ id: `area_${Date.now()}`, name: "", code: "", location: "", manager: "", description: "", status: "启用" });
}

function addFactor() {
  settings.value.carbonFactors.push({ id: `cf_${Date.now()}`, energyType: '', factor: 0, unit: 'tCO₂/MWh', effectiveDate: '' });
}

const tabs = [
  { key: 'points', label: '采集点管理' },
  { key: 'thresholds', label: '告警阈值' },
  { key: 'dimensions', label: '分析维度' },
  { key: 'factors', label: '排放因子' },
  { key: 'areas', label: '区域设置' },
];

</script>

<template>
  <div class="energy-settings">
    <div class="energy-workbench-head" style="padding: 20px 20px 0">
      <div><h1>能耗中心设置</h1><p>配置采集点、告警阈值、分析维度和碳排放因子。</p></div>
      <button class="aw-btn primary" type="button" @click="save">保存设置</button>
    </div>

    <div class="energy-settings-tabs">
      <button v-for="t in tabs" :key="t.key" :class="['energy-settings-tab', activeTab === t.key ? 'active' : '']" type="button" @click="activeTab = t.key">{{ t.label }}</button>
    </div>

    <!-- 采集点管理 -->
    <section v-if="activeTab === 'points'" class="aw-form-card">
      <div class="energy-panel-head"><h2>采集点列表</h2><button class="aw-tool-btn" type="button" @click="addPoint">添加采集点</button></div>
      <div class="aw-doc-tbl-wrap">
        <table class="aw-doc-tbl">
          <thead><tr><th>名称</th><th>编码</th><th>仪表类型</th><th>位置</th><th>单位</th><th>状态</th><th style="width:60px">操作</th></tr></thead>
          <tbody>
            <tr v-for="(p, idx) in settings.collectionPoints" :key="p.id">
              <td><input v-model="p.name" class="energy-settings-input" type="text" /></td>
              <td><input v-model="p.code" class="energy-settings-input" type="text" /></td>
              <td><select v-model="p.meterType" class="energy-settings-input"><option>智能电表</option><option>燃气表</option><option>智能水表</option><option>流量计</option><option>逆变器</option></select></td>
              <td><input v-model="p.location" class="energy-settings-input" type="text" /></td>
              <td><select v-model="p.unit" class="energy-settings-input"><option>kWh</option><option>m³</option><option>t</option><option>Nm³</option></select></td>
              <td><select v-model="p.status" class="energy-settings-input"><option>在线</option><option>离线</option></select></td>
              <td><span class="aw-link" @click="removePoint(idx)">删除</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 告警阈值 -->
    <section v-if="activeTab === 'thresholds'" class="aw-form-card">
      <div class="energy-panel-head"><h2>告警阈值设置</h2><button class="aw-tool-btn" type="button" @click="addThreshold">添加阈值</button></div>
      <div class="aw-doc-tbl-wrap">
        <table class="aw-doc-tbl">
          <thead><tr><th>采集点</th><th>最大值</th><th>最小值</th><th>单位</th><th>启用</th></tr></thead>
          <tbody>
            <tr v-for="t in settings.alarmThresholds" :key="t.id">
              <td><input v-model="t.pointName" class="energy-settings-input" type="text" /></td>
              <td><input v-model.number="t.maxValue" class="energy-settings-input" type="number" /></td>
              <td><input v-model.number="t.minValue" class="energy-settings-input" type="number" /></td>
              <td>{{ t.unit }}</td>
              <td><input v-model="t.enabled" type="checkbox" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 分析维度 -->
    <section v-if="activeTab === 'dimensions'" class="aw-form-card">
      <div class="energy-panel-head"><h2>分析维度配置</h2></div>
      <div class="energy-dimension-grid">
        <div v-for="d in settings.analysisDimensions" :key="d.id" class="energy-dimension-item">
          <label>
            <input v-model="d.enabled" type="checkbox" />
            <span>{{ d.name }}</span>
            <small>{{ d.key }}</small>
          </label>
        </div>
      </div>
    </section>

    <!-- 排放因子 -->
    <section v-if="activeTab === 'factors'" class="aw-form-card">
      <div class="energy-panel-head"><h2>碳排放因子</h2><button class="aw-tool-btn" type="button" @click="addFactor">添加因子</button></div>
      <div class="aw-doc-tbl-wrap">
        <table class="aw-doc-tbl">
          <thead><tr><th>能源类型</th><th>因子值</th><th>单位</th><th>生效日期</th></tr></thead>
          <tbody>
            <tr v-for="f in settings.carbonFactors" :key="f.id">
              <td><input v-model="f.energyType" class="energy-settings-input" type="text" /></td>
              <td><input v-model.number="f.factor" class="energy-settings-input" type="number" step="0.001" /></td>
              <td>{{ f.unit }}</td>
              <td><input v-model="f.effectiveDate" class="energy-settings-input" type="date" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 区域设置 -->
    <section v-if="activeTab === 'areas'" class="aw-form-card">
      <div class="energy-panel-head"><h2>区域管理</h2><button class="aw-tool-btn" type="button" @click="addArea">添加区域</button></div>
      <div class="aw-doc-tbl-wrap">
        <table class="aw-doc-tbl">
          <thead><tr><th>区域名称</th><th>编码</th><th>位置</th><th>负责人</th><th>说明</th><th>状态</th><th style="width:60px">操作</th></tr></thead>
          <tbody>
            <tr v-for="(a, idx) in settings.areas" :key="a.id">
              <td><input v-model="a.name" class="energy-settings-input" type="text" /></td>
              <td><input v-model="a.code" class="energy-settings-input" type="text" /></td>
              <td><input v-model="a.location" class="energy-settings-input" type="text" /></td>
              <td><input v-model="a.manager" class="energy-settings-input" type="text" /></td>
              <td><input v-model="a.description" class="energy-settings-input" type="text" /></td>
              <td><select v-model="a.status" class="energy-settings-input"><option>启用</option><option>停用</option></select></td>
              <td><span class="aw-link" @click="settings.areas.splice(idx, 1)">删除</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="toastText" class="aw-toast">{{ toastText }}</div>
  </div>
</template>

<style scoped>
.energy-settings {
  display: grid;
  gap: 16px;
  padding: 0 0 20px;
}

.energy-settings-tabs {
  display: flex;
  gap: 0;
  padding: 0 20px;
}

.energy-settings-tab {
  background: transparent;
  border: 1px solid var(--aw-border);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  padding: 8px 20px;
}

.energy-settings-tab.active {
  background: #fff;
  font-weight: 600;
}

.energy-settings-input {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 4px;
  box-sizing: border-box;
  min-height: 30px;
  padding: 0 8px;
  width: 100%;
}

.energy-dimension-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.energy-dimension-item label {
  align-items: center;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 12px;
}

.energy-dimension-item label small {
  color: var(--aw-fg-3);
  margin-left: auto;
}
</style>
