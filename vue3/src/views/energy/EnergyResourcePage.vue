<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  listMonitorPoints, getMonitorPoint, confirmAlarm, listAlarms,
  getAnalysisData,
  listReports, getReport,
  listSavingPlans, getSavingPlan, createSavingPlan,
  listCarbonRecords, getCarbonRecord,
  listProducts, listDepartments, listEnergyData, listEnergyEquipment,
  getEnergySettings,
  toneByStatus, monitorStatusOptions, alarmLevelOptions, savingStatusOptions, savingCategoryOptions, carbonStatusOptions,
} from '@/app/api/energy/resources';
import type { EnergyModule, EnergyMonitorPoint, EnergyAlarm, EnergyAnalysis, EnergyReport, EnergySavingPlan, EnergyCarbon, EnergySettings } from '@/app/api/energy/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import type { AwTableColumn, AwTreeNode, ToolbarActionKey } from '@/components/list-page/types';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const rows = ref<any[]>([]);
const detailRow = ref<any>(null);
const showDetail = ref(false);
const showCreate = ref(false);
const showAlarmModal = ref(false);
const selectedAlarm = ref<EnergyAlarm | null>(null);
const toastText = ref('');

const viewAction = computed(() => {
  const a = route.query.action as string;
  if (a) return decodeURIComponent(a);
  const s = route.query.setting as string;
  if (s) return 'setting-' + s;
  return '';
});

const showSettingPage = computed(() => viewAction.value.startsWith('setting-'));
const settingKey = computed(() => viewAction.value.replace('setting-', ''));

const moduleKey = computed<EnergyModule>(() => {
  const path = route.path;
  if (path.includes('/energy/monitor')) return 'monitor';
  if (path.includes('/energy/analysis')) return 'analysis';
  if (path.includes('/energy/reports')) return 'reports';
  if (path.includes('/energy/saving')) return 'saving';
  if (path.includes('/energy/carbon')) return 'carbon';
  if (path.includes('/energy/product')) return 'product';
  if (path.includes('/energy/department')) return 'department';
  if (path.includes('/energy/data')) return 'energyData';
  if (path.includes('/energy/equipment')) return 'equipment';
  return 'monitor';
});

const moduleTitle = computed(() => {
  const map = {
    monitor: '能耗监测',
    analysis: '能耗分析',
    reports: '能耗报表',
    saving: '节能措施',
    carbon: '碳排放',
    product: '产品能耗',
    department: '部门能耗',
    energyData: '能耗数据',
    equipment: '用能设备',
  };
  return map[moduleKey.value];
});
const moduleConfigs: Record<string, any> = {
  monitor: {
      columns: [
        { key: 'code', title: '编号', width: 110 },
        { key: 'name', title: '采集点', link: true },
        { key: 'category', title: '类别', width: 90 },
        { key: 'deviceName', title: '关联设备', width: 130 },
        { key: 'location', title: '位置', width: 110 },
        { key: 'currentValue', title: '当前读数', width: 100 },
        { key: 'unit', title: '单位', width: 60 },
        { key: 'todayTotal', title: '今日累计', width: 100 },
        { key: 'status', title: '状态', width: 80 },
        { key: 'lastReadingAt', title: '最后读数', width: 150 },
      ],
      treeNodes: [
        { key: 'all', label: '全部采集点', count: 10 },
        { key: '电力', label: '电力', count: 6 },
        { key: '燃气', label: '燃气', count: 2 },
        { key: '水', label: '水', count: 1 },
        { key: '压缩空气', label: '压缩空气', count: 1 },
      ],
      actions: undefined,
    },
    analysis: {
      columns: [],
      treeNodes: [],
      actions: ['refresh'],
    },
    reports: {
      columns: [
        { key: 'title', title: '报表名称', link: true },
        { key: 'type', title: '类型', width: 80 },
        { key: 'period', title: '周期', width: 150 },
        { key: 'totalConsumption', title: '总能耗', width: 100 },
        { key: 'totalCost', title: '总成本', width: 100 },
        { key: 'carbonEmission', title: '碳排放(tCO₂)', width: 120 },
        { key: 'status', title: '状态', width: 90 },
        { key: 'createdAt', title: '生成时间', width: 150 },
      ],
      treeNodes: [
        { key: 'all', label: '全部报表', count: 3 },
        { key: '日报', label: '日报', count: 1 },
        { key: '周报', label: '周报', count: 1 },
        { key: '月报', label: '月报', count: 1 },
      ],
      actions: ['refresh'],
    },
    saving: {
      columns: [
        { key: 'code', title: '编号', width: 100 },
        { key: 'title', title: '措施名称', link: true },
        { key: 'category', title: '分类', width: 100 },
        { key: 'targetValue', title: '目标节能量', width: 110 },
        { key: 'currentValue', title: '已节能量', width: 110 },
        { key: 'unit', title: '单位', width: 60 },
        { key: 'investment', title: '投资(元)', width: 110 },
        { key: 'responsibleDept', title: '负责部门', width: 110 },
        { key: 'status', title: '状态', width: 90 },
        { key: 'effect', title: '效果', width: 80 },
      ],
      treeNodes: [
        { key: 'all', label: '全部措施', count: 3 },
        { key: '设备改造', label: '设备改造', count: 1 },
        { key: '照明节能', label: '照明节能', count: 1 },
        { key: '新能源', label: '新能源', count: 1 },
      ],
      actions: ['refresh', 'create'],
    },
    carbon: {
      columns: [
        { key: 'year', title: '年份', width: 80 },
        { key: 'month', title: '月份', link: true },
        { key: 'totalEmission', title: '总排放(tCO₂)', width: 130 },
        { key: 'scope1', title: '范围一', width: 100 },
        { key: 'scope2', title: '范围二', width: 100 },
        { key: 'reductionTarget', title: '减排目标', width: 100 },
        { key: 'actualReduction', title: '实际减排', width: 100 },
        { key: 'status', title: '达标状态', width: 100 },
      ],
      treeNodes: [],
      actions: ['refresh'],
    },
    product: {
      columns: [
        { key: 'productCode', title: '产品编号', width: 100 },
        { key: 'productName', title: '产品名称', link: true },
        { key: 'category', title: '分类', width: 90 },
        { key: 'totalConsumption', title: '总能耗(kWh)', width: 120 },
        { key: 'electricConsumption', title: '电力(kWh)', width: 110 },
        { key: 'gasConsumption', title: '燃气(kWh)', width: 110 },
        { key: 'cost', title: '成本(元)', width: 100 },
        { key: 'carbonEmission', title: '碳排放(tCO₂)', width: 120 },
        { key: 'ratio', title: '占比(%)', width: 80 },
        { key: 'trend', title: '趋势', width: 70 },
      ],
      treeNodes: [
        { key: 'all', label: '全部产品', count: 7 },
        { key: '压铸件', label: '压铸件', count: 2 },
        { key: '焊接件', label: '焊接件', count: 2 },
        { key: '涂装件', label: '涂装件', count: 1 },
        { key: '组装件', label: '组装件', count: 2 },
      ],
      actions: ['refresh'],
    },
    department: {
      columns: [
        { key: 'deptName', title: '部门名称', link: true },
        { key: 'totalConsumption', title: '总能耗(kWh)', width: 120 },
        { key: 'electric', title: '电力(kWh)', width: 100 },
        { key: 'gas', title: '燃气(kWh)', width: 100 },
        { key: 'water', title: '用水(t)', width: 90 },
        { key: 'cost', title: '成本(元)', width: 100 },
        { key: 'lastMonthConsumption', title: '上月能耗', width: 100 },
        { key: 'changeRate', title: '环比(%)', width: 80 },
        { key: 'carbonEmission', title: '碳排放', width: 100 },
      ],
      treeNodes: [],
      actions: ['refresh'],
    },
    energyData: {
      columns: [
        { key: 'pointName', title: '采集点' },
        { key: 'category', title: '类别', width: 70 },
        { key: 'recordedAt', title: '记录时间', width: 150 },
        { key: 'value', title: '读数', width: 90 },
        { key: 'unit', title: '单位', width: 60 },
        { key: 'cost', title: '成本(元)', width: 90 },
        { key: 'carbonEmission', title: '碳排放', width: 90 },
        { key: 'meterReading', title: '表底数', width: 100 },
        { key: 'source', title: '来源', width: 90 },
        { key: 'status', title: '状态', width: 80 },
      ],
      treeNodes: [
        { key: 'all', label: '全部数据', count: 8 },
        { key: '电力', label: '电力', count: 4 },
        { key: '燃气', label: '燃气', count: 1 },
        { key: '水', label: '水', count: 1 },
        { key: '发电', label: '发电', count: 1 },
      ],
      actions: ['refresh'],
    },
    equipment: {
      columns: [
        { key: 'code', title: '设备编号', width: 110 },
        { key: 'name', title: '设备名称', link: true },
        { key: 'category', title: '分类', width: 100 },
        { key: 'power', title: '功率(kW)', width: 90 },
        { key: 'location', title: '位置', width: 110 },
        { key: 'dept', title: '所属部门', width: 100 },
        { key: 'status', title: '状态', width: 80 },
        { key: 'runHours', title: '运行时长(h)', width: 110 },
        { key: 'monthConsumption', title: '本月能耗', width: 100 },
      ],
      treeNodes: [
        { key: 'all', label: '全部设备', count: 8 },
        { key: '机加工设备', label: '机加工设备', count: 2 },
        { key: '空压系统', label: '空压系统', count: 1 },
        { key: '锅炉设备', label: '锅炉设备', count: 1 },
        { key: '焊接设备', label: '焊接设备', count: 1 },
        { key: '涂装设备', label: '涂装设备', count: 1 },
        { key: '空调系统', label: '空调系统', count: 1 },
        { key: '发电设备', label: '发电设备', count: 1 },
      ],
      actions: ['refresh'],
    }
};

const moduleConfig = computed(() => moduleConfigs[moduleKey.value]);
const pickedTree = ref('all');
const alarmRows: any = ref<any[]>([]);
const analysisData: any = ref<any>(null);
const form = reactive<Record<string, any>>({});

import EnergySettingPage from './shared/EnergySettingPage.vue';

function loadList() {
  const action = viewAction.value;
  // Handle action-based filtering for reports
  if (moduleKey.value === 'reports' && action && !action.startsWith('setting-')) {
    listReports({ keyword: keyword.value }).then((res) => {
      if (['日报','月报','年报','自定义报表'].includes(action)) {
        rows.value = action === '自定义报表' ? res.rows : res.rows.filter((r: any) => r.type === action);
      } else { rows.value = res.rows; }
    });
    return;
  }
  // Handle action-based filtering for saving
  if (moduleKey.value === 'saving' && action && !action.startsWith('setting-')) {
    listSavingPlans({ keyword: keyword.value }).then((res) => {
      if (['措施方案','措施执行','效果评估'].includes(action)) {
        rows.value = action === '措施方案' ? res.rows.filter((r: any) => r.status === '规划中' || r.status === '执行中') :
                    action === '措施执行' ? res.rows.filter((r: any) => r.status === '执行中') : res.rows;
      } else { rows.value = res.rows; }
    });
    return;
  }
  // Handle action-based filtering for carbon
  if (moduleKey.value === 'carbon' && action && !action.startsWith('setting-')) {
    listCarbonRecords().then((res) => {
      rows.value = res;
    });
    return;
  }
  if (moduleKey.value === 'monitor') {
    listMonitorPoints({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
    listAlarms().then((res) => { alarmRows.value = res; });
  } else if (moduleKey.value === 'analysis') {
    getAnalysisData().then(setAnalysisData);
  } else if (moduleKey.value === 'reports') {
    listReports({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
  } else if (moduleKey.value === 'saving') {
    listSavingPlans({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
  } else if (moduleKey.value === 'carbon') {
    listCarbonRecords().then((res) => { rows.value = res; });
  } else if (moduleKey.value === 'product') {
    listProducts({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
  } else if (moduleKey.value === 'department') {
    listDepartments().then((res) => { rows.value = res; });
  } else if (moduleKey.value === 'energyData') {
    listEnergyData({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
  } else if (moduleKey.value === 'equipment') {
    listEnergyEquipment({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
  }
}

function setAnalysisData(data: Record<string, any>) {
  analysisData.value = data;
}

function showRow(row: any) {
  if (moduleKey.value === 'monitor') {
    detailRow.value = row;
    showDetail.value = true;
  } else if (moduleKey.value === 'reports') {
    getReport(row.id).then((r) => { detailRow.value = r; showDetail.value = true; });
  } else if (moduleKey.value === 'saving') {
    getSavingPlan(row.id).then((r) => { detailRow.value = r; showDetail.value = true; });
  } else if (moduleKey.value === 'carbon') {
    getCarbonRecord(row.id).then((r) => { detailRow.value = r; showDetail.value = true; });
  }
}

function handleToolbar(action: string) {
  if (action === 'refresh') loadList();
  else if (action === 'create') {
    if (moduleKey.value === 'saving') {
      Object.assign(form, { title: '', category: '', targetValue: 0, unit: 'kWh', investment: 0, startDate: '', endDate: '', responsibleDept: '', responsiblePerson: '', remark: '' });
      showCreate.value = true;
    } else if (moduleKey.value === 'monitor') {
      router.push('/energy/monitor');
    }
  }
}

function confirmSavingAlarm(alert: EnergyAlarm) {
  selectedAlarm.value = alert;
  showAlarmModal.value = true;
}

function doConfirmAlarm() {
  if (selectedAlarm.value) {
    confirmAlarm(selectedAlarm.value.id, '当前用户').then(() => {
      showAlarmModal.value = false;
      selectedAlarm.value = null;
      loadList();
      toastText.value = '告警已确认';
      setTimeout(() => { toastText.value = ''; }, 2000);
    });
  }
}

function doCreateSaving() {
  createSavingPlan({ ...form }).then(() => {
    showCreate.value = false;
    loadList();
    toastText.value = '节能措施已创建';
    setTimeout(() => { toastText.value = ''; }, 2000);
  });
}

function treeFilter(key: string) {
  pickedTree.value = key;
  if (moduleKey.value === 'monitor') {
    listMonitorPoints({ keyword: keyword.value }).then((res) => {
      rows.value = key === 'all' ? res.rows : res.rows.filter((r: any) => r.category === key);
    });
  } else if (moduleKey.value === 'reports') {
    listReports({ keyword: keyword.value }).then((res) => {
      rows.value = key === 'all' ? res.rows : res.rows.filter((r: any) => r.type === key);
    });
  } else if (moduleKey.value === 'saving') {
    listSavingPlans({ keyword: keyword.value }).then((res) => {
      rows.value = key === 'all' ? res.rows : res.rows.filter((r: any) => r.category === key);
    });
  } else if (moduleKey.value === 'product') {
    listProducts({ keyword: keyword.value }).then((res) => {
      rows.value = key === 'all' ? res.rows : res.rows.filter((r: any) => r.category === key);
    });
  } else if (moduleKey.value === 'energyData') {
    listEnergyData({ keyword: keyword.value }).then((res) => {
      rows.value = key === 'all' ? res.rows : res.rows.filter((r: any) => r.category === key);
    });
  } else if (moduleKey.value === 'equipment') {
    listEnergyEquipment({ keyword: keyword.value }).then((res) => {
      rows.value = key === 'all' ? res.rows : res.rows.filter((r: any) => r.category === key);
    });
  }
}

watch(() => route.path, () => { showDetail.value = false; showCreate.value = false; loadList(); }, { immediate: true });
</script>

<template>
  <!-- 设置页（通过 ?setting= 参数触发） -->
  <template v-if="showSettingPage">
    <energy-setting-page :default-tab="settingKey" />
  </template>

  <!-- 能耗监测 -->
  <template v-if="!showSettingPage && moduleKey === 'monitor'">
    <aw-list-page>
      <template #tree>

        <aw-resource-tree title="采集点分类" :total="rows.length" :nodes="moduleConfig.treeNodes" v-model="pickedTree" @select="treeFilter" />
      </template>
      <template #toolbar>
        <aw-list-toolbar :title="moduleTitle" search-placeholder="搜索采集点..." :actions="['refresh']" @action="handleToolbar" v-model:keyword="keyword"></aw-list-toolbar>
      </template>
      <template #default>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length" :fit-width="true">
          <template #cell="{ column, record, value }">
            <span v-if="column.key === 'name'" class="aw-link" @click="showRow(record)">{{ value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else-if="column.key === 'currentValue' || column.key === 'todayTotal'">{{ typeof value === 'number' ? value.toFixed(1) : value }}</span>
            <span v-else>{{ value ?? '-' }}</span>
          </template>
        </aw-data-table>
      </template>
    </aw-list-page>

    <!-- 告警列表 -->
    <section class="aw-form-card energy-alarm-list" v-if="alarmRows.length > 0">
      <div class="energy-sub-head"><h3>异常告警</h3></div>
      <aw-data-table :fit-width="true" :columns="[
        { key: 'pointName', title: '采集点' },
        { key: 'alarmType', title: '告警类型', width: 100 },
        { key: 'alarmLevel', title: '级别', width: 80 },
        { key: 'message', title: '告警内容' },
        { key: 'currentValue', title: '当前值', width: 90 },
        { key: 'threshold', title: '阈值', width: 90 },
        { key: 'occuredAt', title: '发生时间', width: 150 },
        { key: 'status', title: '状态', width: 90 },
        { key: 'action', title: '操作', width: 80, fixed: 'right' },
      ]" :rows="alarmRows" :total="alarmRows.length">
        <template #cell="{ column, record, value }">
          <span v-if="column.key === 'alarmLevel'" :class="['aw-status', value === '紧急' ? 'red' : value === '重要' ? 'yellow' : 'blue']">{{ value }}</span>
          <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
          <span v-else-if="column.key === 'action'">
            <span v-if="record.status === '待确认'" class="aw-link" @click="confirmSavingAlarm(record as any)">确认</span>
            <span v-else class="aw-fg-3">已确认</span>
          </span>
          <span v-else>{{ value ?? '-' }}</span>
        </template>
      </aw-data-table>
    </section>
  </template>

  <!-- 能耗分析 -->
  <template v-if="!showSettingPage && moduleKey === 'analysis' && analysisData">
    <div style="display:grid;gap:16px;padding:0">
      <div class="energy-workbench-head">
        <div><h1>能耗分析</h1><p>本月能耗分析与趋势对比，数据和设置可在能耗设置中调整。</p></div>
        <button class="aw-tool-btn" type="button" @click="loadList">刷新数据</button>
      </div>
      <section class="energy-metric-grid">
        <button v-for="card in analysisData.cards" :key="card.key" class="energy-metric" type="button">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small v-if="card.unit">{{ card.unit }}</small>
        </button>
      </section>
      <section class="aw-form-card">
        <div class="energy-panel-head"><h2>每日能耗趋势（kWh）</h2></div>
        <div class="energy-chart">
          <div class="energy-bar-chart">
            <div v-for="d in analysisData.dailyRecords" :key="d.date" class="energy-bar-col">
              <div class="energy-bar energy-bar-stacked">
                <div class="energy-bar-seg" :style="{ height: (d.electric / 8500 * 180) + 'px', background: '#1677ff' }" :title="'电力 ' + d.electric + 'kWh'"></div>
                <div class="energy-bar-seg" :style="{ height: (d.gas / 8500 * 180) + 'px', background: '#52c41a' }" :title="'燃气 ' + d.gas + 'kWh'"></div>
                <div class="energy-bar-seg" :style="{ height: (d.water / 8500 * 180) + 'px', background: '#13c2c2' }" :title="'水 ' + d.water + 't'"></div>
              </div>
              <span class="energy-bar-label">{{ d.date.slice(5) }}</span>
            </div>
          </div>
          <div class="energy-legend">
            <span><i style="background:#1677ff"></i>电力</span>
            <span><i style="background:#52c41a"></i>燃气</span>
            <span><i style="background:#13c2c2"></i>水</span>
          </div>
        </div>
      </section>
      <section class="aw-form-card" v-if="analysisData.todayEnergy && analysisData.todayEnergy.length">
        <div class="energy-panel-head"><h2>今日实时能耗（kWh）</h2></div>
        <div class="energy-chart">
          <div class="energy-line-chart">
            <div v-for="(pt, idx) in analysisData.todayEnergy" :key="pt.hour" class="energy-line-col" :style="{ height: (pt.value / 900 * 160) + 'px' }">
              <span class="energy-line-dot"></span>
              <span class="energy-line-label" v-if="idx % 2 === 0">{{ pt.hour }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </template>

  <!-- 能耗报表 -->
  <template v-if="!showSettingPage && moduleKey === 'reports'">
    <aw-list-page>
      <template v-if="moduleConfig.treeNodes.length > 0" #tree>
        <aw-resource-tree title="报表类型" :total="rows.length" :nodes="moduleConfig.treeNodes" v-model="pickedTree" @select="treeFilter" />
      </template>
      <template #toolbar>
        <aw-list-toolbar :title="moduleTitle" search-placeholder="搜索报表..." :actions="['refresh']" @action="handleToolbar" v-model:keyword="keyword"></aw-list-toolbar>
      </template>
      <template #default>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length" :fit-width="true">
          <template #cell="{ column, record, value }">
            <span v-if="column.key === 'title'" class="aw-link" @click="showRow(record)">{{ value }}</span>
            <span v-else-if="column.key === 'totalConsumption' || column.key === 'totalCost' || column.key === 'carbonEmission'">{{ typeof value === 'number' ? value.toLocaleString() : value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else>{{ value ?? '-' }}</span>
          </template>
        </aw-data-table>
      </template>
    </aw-list-page>
  </template>

  <!-- 节能措施 -->
  <template v-if="!showSettingPage && moduleKey === 'saving'">
    <aw-list-page>
      <template v-if="moduleConfig.treeNodes.length > 0" #tree>
        <aw-resource-tree title="措施分类" :total="rows.length" :nodes="moduleConfig.treeNodes" v-model="pickedTree" @select="treeFilter" />
      </template>
      <template #toolbar>
        <aw-list-toolbar :title="moduleTitle" search-placeholder="搜索节能措施..." :actions="['refresh', 'create']" @action="handleToolbar" v-model:keyword="keyword"></aw-list-toolbar>
      </template>
      <template #default>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length" :fit-width="true">
          <template #cell="{ column, record, value }">
            <span v-if="column.key === 'title'" class="aw-link" @click="showRow(record)">{{ value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else-if="column.key === 'effect'" :class="['aw-status', value === '良好' ? 'green' : value === '待评估' ? 'gray' : 'yellow']">{{ value }}</span>
            <span v-else-if="column.key === 'currentValue'">{{ typeof value === 'number' ? value.toLocaleString() : value }}</span>
            <span v-else>{{ value ?? '-' }}</span>
          </template>
        </aw-data-table>
      </template>
    </aw-list-page>
  </template>

  <!-- 碳排放 -->
  <template v-if="!showSettingPage && moduleKey === 'carbon'">
    <aw-list-page>
      <template #toolbar>
        <aw-list-toolbar :title="moduleTitle" search-placeholder="" :actions="['refresh']" @action="handleToolbar"></aw-list-toolbar>
      </template>
      <template #default>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length" :fit-width="true">
          <template #cell="{ column, record, value }">
            <span v-if="column.key === 'month' || column.key === 'year'" class="aw-link" @click="showRow(record)">{{ value ? record.year + '年' + record.month + '月' : value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else>{{ value ?? '-' }}</span>
          </template>
        </aw-data-table>
      </template>
    </aw-list-page>
  </template>
  <!-- 产品能耗 / 部门能耗 / 能耗数据 / 用能设备 -->
  <template v-if="!showSettingPage && (moduleKey === 'product' || moduleKey === 'department' || moduleKey === 'energyData' || moduleKey === 'equipment')">
    <aw-list-page>
      <template v-if="moduleConfig.treeNodes.length > 0" #tree>
        <aw-resource-tree title="分类" :total="rows.length" :nodes="moduleConfig.treeNodes" v-model="pickedTree" @select="treeFilter" />
      </template>
      <template #toolbar>
        <aw-list-toolbar :title="moduleTitle" search-placeholder="搜索..." :actions="moduleConfig.actions" @action="handleToolbar" v-model:keyword="keyword"></aw-list-toolbar>
      </template>
      <template #default>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length" :fit-width="true">
          <template #cell="{ column, record, value }">
            <span v-if="column.link" class="aw-link" @click="showRow(record)">{{ value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else-if="column.key === 'trend'" :class="['aw-status', value === 'up' ? 'red' : value === 'down' ? 'green' : 'blue']">{{ value === 'up' ? '↑' : value === 'down' ? '↓' : '→' }}</span>
            <span v-else-if="column.key === 'changeRate'">{{ Number(value) >= 0 ? '+' + value : value }}%</span>
            <span v-else-if="['carbonEmission', 'cost', 'totalConsumption'].includes(column.key)">{{ typeof value === 'number' ? value.toLocaleString() : value }}</span>
            <span v-else>{{ value ?? '-' }}</span>
          </template>
        </aw-data-table>
      </template>
    </aw-list-page>
  </template>

  <!-- 详情弹窗 -->
  <div v-if="showDetail" class="aw-modal-mask" @click.self="showDetail = false">
    <section class="aw-modal aw-modal-md aw-detail-modal">
      <div class="aw-modal-head"><h2>{{ detailRow?.code || detailRow?.title || moduleTitle }} 详情</h2><button class="aw-modal-close" type="button" @click="showDetail = false">✕</button></div>
      <div class="aw-modal-body">
        <!-- 采集点详情 -->
        <div v-if="!showSettingPage && moduleKey === 'monitor' && detailRow" class="energy-detail-grid">
          <div class="energy-detail-field"><span>编号</span><strong>{{ detailRow.code }}</strong></div>
          <div class="energy-detail-field"><span>采集点名称</span><strong>{{ detailRow.name }}</strong></div>
          <div class="energy-detail-field"><span>类别</span><strong>{{ detailRow.category }}</strong></div>
          <div class="energy-detail-field"><span>关联设备</span><strong>{{ detailRow.deviceName }}</strong></div>
          <div class="energy-detail-field"><span>位置</span><strong>{{ detailRow.location }}</strong></div>
          <div class="energy-detail-field"><span>仪表类型</span><strong>{{ detailRow.meterType }}</strong></div>
          <div class="energy-detail-field"><span>单位</span><strong>{{ detailRow.unit }}</strong></div>
          <div class="energy-detail-field"><span>当前读数</span><strong :class="detailRow.currentValue >= detailRow.alarmThreshold ? 'aw-status red' : ''">{{ detailRow.currentValue }}</strong></div>
          <div class="energy-detail-field"><span>今日累计</span><strong>{{ detailRow.todayTotal }}</strong></div>
          <div class="energy-detail-field"><span>本月累计</span><strong>{{ detailRow.monthTotal }}</strong></div>
          <div class="energy-detail-field"><span>告警阈值</span><strong>{{ detailRow.alarmThreshold }}</strong></div>
          <div class="energy-detail-field"><span>状态</span><strong :class="['aw-status', toneByStatus(detailRow.status)]">{{ detailRow.status }}</strong></div>
          <div class="energy-detail-field"><span>最后读数</span><strong>{{ detailRow.lastReadingAt }}</strong></div>
          <div class="energy-detail-field wide"><span>备注</span><strong>{{ detailRow.remark || '-' }}</strong></div>
        </div>
        <!-- 报表详情 -->
        <div v-if="!showSettingPage && moduleKey === 'reports' && detailRow" class="energy-detail-grid">
          <div class="energy-detail-field"><span>报表名称</span><strong>{{ detailRow.title }}</strong></div>
          <div class="energy-detail-field"><span>类型</span><strong>{{ detailRow.type }}</strong></div>
          <div class="energy-detail-field"><span>周期</span><strong>{{ detailRow.period }}</strong></div>
          <div class="energy-detail-field"><span>总能耗</span><strong>{{ detailRow.totalConsumption?.toLocaleString() }} kWh</strong></div>
          <div class="energy-detail-field"><span>总成本</span><strong>{{ detailRow.totalCost?.toLocaleString() }} 元</strong></div>
          <div class="energy-detail-field"><span>碳排放</span><strong>{{ detailRow.carbonEmission }} tCO₂</strong></div>
          <div class="energy-detail-field"><span>状态</span><strong :class="['aw-status', toneByStatus(detailRow.status)]">{{ detailRow.status }}</strong></div>
          <div class="energy-detail-field"><span>生成人</span><strong>{{ detailRow.createdBy }}</strong></div>
          <div class="energy-detail-field"><span>生成时间</span><strong>{{ detailRow.createdAt }}</strong></div>
          <div v-if="detailRow.sections" class="wide">
            <div v-for="sec in detailRow.sections" :key="sec.title" class="energy-section">
              <h4>{{ sec.title }}</h4>
              <div class="energy-section-grid">
                <div v-for="item in sec.items" :key="item.label" class="energy-detail-field">
                  <span>{{ item.label }}</span><strong>{{ item.value }} {{ item.unit }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 节能措施详情 -->
        <div v-if="!showSettingPage && moduleKey === 'saving' && detailRow" class="energy-detail-grid">
          <div class="energy-detail-field"><span>编号</span><strong>{{ detailRow.code }}</strong></div>
          <div class="energy-detail-field"><span>措施名称</span><strong>{{ detailRow.title }}</strong></div>
          <div class="energy-detail-field"><span>分类</span><strong>{{ detailRow.category }}</strong></div>
          <div class="energy-detail-field"><span>目标节能量</span><strong>{{ detailRow.targetValue?.toLocaleString() }} {{ detailRow.unit }}</strong></div>
          <div class="energy-detail-field"><span>已节能量</span><strong>{{ detailRow.currentValue?.toLocaleString() }} {{ detailRow.unit }}</strong></div>
          <div class="energy-detail-field"><span>投资金额</span><strong>{{ detailRow.investment?.toLocaleString() }} 元</strong></div>
          <div class="energy-detail-field"><span>节省金额</span><strong>{{ detailRow.savingAmount?.toLocaleString() }} 元</strong></div>
          <div class="energy-detail-field"><span>回收期</span><strong>{{ detailRow.paybackPeriod }} 年</strong></div>
          <div class="energy-detail-field"><span>日期</span><strong>{{ detailRow.startDate }} ~ {{ detailRow.endDate }}</strong></div>
          <div class="energy-detail-field"><span>负责部门</span><strong>{{ detailRow.responsibleDept }}</strong></div>
          <div class="energy-detail-field"><span>状态</span><strong :class="['aw-status', toneByStatus(detailRow.status)]">{{ detailRow.status }}</strong></div>
          <div class="energy-detail-field"><span>效果</span><strong :class="['aw-status', detailRow.effect === '良好' ? 'green' : 'gray']">{{ detailRow.effect }}</strong></div>
          <div class="energy-detail-field wide"><span>备注</span><strong>{{ detailRow.remark || '-' }}</strong></div>
          <div v-if="detailRow.executionSteps" class="wide">
            <h4>执行步骤</h4>
            <div v-for="(step, idx) in detailRow.executionSteps" :key="idx" class="energy-step">
              <span :class="step.done ? 'aw-status green' : 'aw-status gray'">{{ step.done ? '✓' : '○' }}</span>
              <span>{{ step.step }}</span>
              <span v-if="step.date" class="aw-fg-3">{{ step.date }}</span>
            </div>
          </div>
        </div>
        <!-- 碳排放详情 -->
        <div v-if="!showSettingPage && moduleKey === 'carbon' && detailRow" class="energy-detail-grid">
          <div class="energy-detail-field"><span>年月</span><strong>{{ detailRow.year }}年{{ detailRow.month }}月</strong></div>
          <div class="energy-detail-field"><span>总排放</span><strong>{{ detailRow.totalEmission }} tCO₂</strong></div>
          <div class="energy-detail-field"><span>范围一</span><strong>{{ detailRow.scope1 }} tCO₂</strong></div>
          <div class="energy-detail-field"><span>范围二</span><strong>{{ detailRow.scope2 }} tCO₂</strong></div>
          <div class="energy-detail-field"><span>减排目标</span><strong>{{ detailRow.reductionTarget }} tCO₂</strong></div>
          <div class="energy-detail-field"><span>实际减排</span><strong>{{ detailRow.actualReduction }} tCO₂</strong></div>
          <div class="energy-detail-field"><span>达标状态</span><strong :class="['aw-status', toneByStatus(detailRow.status)]">{{ detailRow.status }}</strong></div>
          <div v-if="detailRow.details" class="wide">
            <h4>排放来源</h4>
            <div v-for="d in detailRow.details" :key="d.source" class="energy-step">
              <span>{{ d.source }}</span>
              <span><strong>{{ d.emission }} tCO₂</strong></span>
              <span class="aw-fg-3">{{ d.ratio }}%</span>
            </div>
          </div>
          <div v-if="detailRow.offsetMeasures && detailRow.offsetMeasures.length > 0" class="wide">
            <h4>抵消措施</h4>
            <div v-for="m in detailRow.offsetMeasures" :key="m.measure" class="energy-step">
              <span>{{ m.measure }}</span>
              <span>抵消 {{ m.amount }} tCO₂</span>
              <span class="aw-fg-3">{{ m.date }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="aw-modal-foot">
        <button class="aw-btn" type="button" @click="showDetail = false">关闭</button>
      </div>
    </section>
  </div>

  <!-- 告警确认弹窗 -->
  <div v-if="showAlarmModal" class="aw-modal-mask" @click.self="showAlarmModal = false">
    <section class="aw-modal aw-modal-sm">
      <div class="aw-modal-head"><h2>确认告警</h2><button class="aw-modal-close" type="button" @click="showAlarmModal = false">✕</button></div>
      <div class="aw-modal-body">
        <p>确认处理告警：</p>
        <p><strong>{{ selectedAlarm?.pointName }}</strong> - {{ selectedAlarm?.message }}</p>
      </div>
      <div class="aw-modal-foot">
        <button class="aw-btn" type="button" @click="showAlarmModal = false">取消</button>
        <button class="aw-btn primary" type="button" @click="doConfirmAlarm">确认</button>
      </div>
    </section>
  </div>

  <!-- 新增节能措施 -->
  <div v-if="showCreate" class="aw-modal-mask" @click.self="showCreate = false">
    <section class="aw-modal aw-modal-md">
      <div class="aw-modal-head"><h2>新增节能措施</h2><button class="aw-modal-close" type="button" @click="showCreate = false">✕</button></div>
      <div class="aw-modal-body">
        <div class="energy-form-grid">
          <label><span>措施名称</span><input v-model="form.title" type="text" /></label>
          <label><span>分类</span><select v-model="form.category"><option v-for="o in savingCategoryOptions" :key="o" :value="o">{{ o }}</option></select></label>
          <label><span>目标节能量</span><input v-model.number="form.targetValue" type="number" /></label>
          <label><span>单位</span><select v-model="form.unit"><option value="kWh">kWh</option><option value="tce">tce</option></select></label>
          <label><span>投资金额（元）</span><input v-model.number="form.investment" type="number" /></label>
          <label><span>开始日期</span><input v-model="form.startDate" type="date" /></label>
          <label><span>结束日期</span><input v-model="form.endDate" type="date" /></label>
          <label><span>负责部门</span><input v-model="form.responsibleDept" type="text" /></label>
          <label><span>负责人</span><input v-model="form.responsiblePerson" type="text" /></label>
          <label class="wide"><span>备注</span><textarea v-model="form.remark"></textarea></label>
        </div>
      </div>
      <div class="aw-modal-foot">
        <button class="aw-btn" type="button" @click="showCreate = false">取消</button>
        <button class="aw-btn primary" type="button" @click="doCreateSaving">保存</button>
      </div>
    </section>
  </div>

  <!-- Toast -->
  <div v-if="toastText" class="aw-toast">{{ toastText }}</div>
</template>

<style scoped>
.energy-workbench-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 20px 20px 0;
}
.energy-workbench-head h1 { margin: 0; }
.energy-workbench-head p { color: var(--aw-fg-3); margin: 6px 0 0; }
.energy-workbench-actions {
  align-items: center;
  display: flex;
  gap: 10px;
}
.energy-metric-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}
.energy-metric {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 4px;
  padding: 16px;
  text-align: left;
}
.energy-metric span { color: var(--aw-fg-3); font-size: 13px; }
.energy-metric strong { font-size: 24px; }
.energy-metric small { color: var(--aw-fg-3); font-size: 12px; }
.energy-panel-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.energy-panel-head h2 { margin: 0; }
.energy-scope {


  gap: 16px;
  padding: 20px;
}

.energy-alarm-list {
  margin: 16px;
}

.energy-sub-head {
  padding: 12px 16px 0;
}
.energy-sub-head h3 { margin: 0; }

.energy-chart {
  padding: 8px 0;
}

.energy-bar-chart {
  align-items: flex-end;
  display: flex;
  gap: 4px;
  height: 200px;
  justify-content: space-between;
  padding-top: 16px;
}

.energy-bar-col {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.energy-bar {
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  width: 100%;
}

.energy-bar-stacked {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.energy-bar-seg {
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  width: 100%;
}

.energy-bar-label {
  color: var(--aw-fg-3);
  font-size: 11px;
  white-space: nowrap;
}

.energy-bar-chart + .energy-legend {
  display: none;
}

.energy-line-chart {
  align-items: flex-end;
  display: flex;
  gap: 2px;
  height: 180px;
  justify-content: space-between;
  padding: 20px 0 14px;
}
.energy-line-col {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;
  justify-content: flex-end;
  position: relative;
}
.energy-line-col .energy-line-dot {
  background: var(--aw-primary, #1677ff);
  border-radius: 50%;
  height: 6px;
  width: 6px;
}
.energy-line-col .energy-line-label {
  color: var(--aw-fg-3);
  font-size: 11px;
  margin-top: 6px;
  position: absolute;
  bottom: -14px;
}

.energy-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 8px 0 0;
}

.energy-legend span {
  align-items: center;
  display: flex;
  font-size: 13px;
  gap: 6px;
}

.energy-legend i {
  border-radius: 3px;
  display: inline-block;
  height: 12px;
  width: 12px;
}

.energy-detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
}

.energy-detail-field {
  display: grid;
  gap: 4px;
}
.energy-detail-field.wide { grid-column: 1 / -1; }
.energy-detail-field span { color: var(--aw-fg-3); font-size: 13px; }
.energy-detail-field strong { font-size: 14px; }

.energy-section {
  border-top: 1px solid var(--aw-border);
  margin-top: 12px;
  padding-top: 12px;
}
.energy-section h4 { margin: 0 0 8px; }
.energy-section-grid { display: grid; gap: 8px; grid-template-columns: 1fr 1fr 1fr; }

.energy-step {
  align-items: center;
  display: flex;
  gap: 10px;
  padding: 6px 0;
}

.energy-form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
}

.energy-form-grid > label {
  display: grid;
  gap: 6px;
}

.energy-form-grid > label > span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.energy-form-grid input,
.energy-form-grid select,
.energy-form-grid textarea {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--aw-fg-1);
  min-height: 34px;
  padding: 0 10px;
  width: 100%;
}

.energy-form-grid textarea {
  min-height: 72px;
  padding-top: 8px;
}

.energy-form-grid .wide { grid-column: 1 / -1; }
</style>
