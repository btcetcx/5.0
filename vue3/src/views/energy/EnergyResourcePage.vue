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
        { key: 'name', title: '采集点', width: 140, link: true },
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
        { key: 'title', title: '报表名称', width: 200, link: true },
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
        { key: 'title', title: '措施名称', width: 180, link: true },
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
        { key: 'month', title: '月份', width: 80, link: true },
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
        { key: 'productName', title: '产品名称', width: 160, link: true },
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
        { key: 'deptName', title: '部门名称', width: 120, link: true },
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
        { key: 'pointName', title: '采集点', width: 130 },
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
        { key: 'name', title: '设备名称', width: 160, link: true },
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
const activeTreeNodes = computed<AwTreeNode[]>(() => {
  return (moduleConfig.value.treeNodes || []).map((node: AwTreeNode, index: number) => ({
    ...node,
    level: node.level || (index === 0 ? 2 : 3),
    open: node.open ?? index === 0,
    icon: node.icon || (index === 0 ? 'line-folder' : 'line-node'),
  }));
});
const hasActiveTree = computed(() => activeTreeNodes.value.length > 0);
const activeTreeTitle = computed(() => {
  const titleMap: Record<string, string> = {
    monitor: '采集点分类',
    reports: '报表类型',
    saving: '措施分类',
    product: '产品分类',
    energyData: '数据分类',
    equipment: '设备分类',
  };
  return titleMap[moduleKey.value] || '分类';
});
const activeSearchPlaceholder = computed(() => {
  const placeholderMap: Record<string, string> = {
    monitor: '搜索采集点...',
    reports: '搜索报表...',
    saving: '搜索节能措施...',
    carbon: '搜索碳排放记录...',
    product: '搜索产品能耗...',
    department: '搜索部门能耗...',
    energyData: '搜索能耗数据...',
    equipment: '搜索用能设备...',
  };
  return placeholderMap[moduleKey.value] || '全局搜索';
});
const alarmRows: any = ref<any[]>([]);
const analysisData: any = ref<any>(null);
const energySettings = ref<EnergySettings | null>(null);
const form = reactive<Record<string, any>>({});

import EnergySettingPage from './shared/EnergySettingPage.vue';

const analysisDailyMax = computed(() => {
  const records = analysisData.value?.dailyRecords || [];
  return Math.max(...records.map((item: any) => Number(item.total) || 0), 1);
});

const analysisHourlyMax = computed(() => {
  const records = analysisData.value?.todayEnergy || [];
  return Math.max(...records.map((item: any) => Number(item.value) || 0), 1);
});

const analysisHourlyLinePoints = computed(() => {
  const records = analysisData.value?.todayEnergy || [];
  if (!records.length) return '';
  const width = 640;
  const bottom = 168;
  const chartHeight = 138;
  return records.map((item: any, index: number) => {
    const x = records.length === 1 ? width / 2 : (index / (records.length - 1)) * width;
    const y = bottom - ((Number(item.value) || 0) / analysisHourlyMax.value) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
});

const analysisHourlyAreaPoints = computed(() => {
  const points = analysisHourlyLinePoints.value;
  return points ? `0,168 ${points} 640,168` : '';
});

const analysisBreakdown = computed(() => {
  const records = analysisData.value?.dailyRecords || [];
  const total = records.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0) || 1;
  const items = [
    { key: 'electric', label: '电力', value: records.reduce((sum: number, item: any) => sum + (Number(item.electric) || 0), 0), color: '#4cc9f0' },
    { key: 'gas', label: '燃气', value: records.reduce((sum: number, item: any) => sum + (Number(item.gas) || 0), 0), color: '#72e6ac' },
    { key: 'water', label: '水', value: records.reduce((sum: number, item: any) => sum + (Number(item.water) || 0), 0), color: '#ffd166' },
  ];
  return items.map((item) => ({ ...item, ratio: Math.round((item.value / total) * 1000) / 10 }));
});

const analysisPeakHour = computed(() => {
  const records = analysisData.value?.todayEnergy || [];
  return records.reduce((peak: any, item: any) => ((Number(item.value) || 0) > (Number(peak?.value) || 0) ? item : peak), records[0] || null);
});

const analysisLatestDaily = computed(() => {
  const records = analysisData.value?.dailyRecords || [];
  return records[records.length - 1] || null;
});

const analysisRingStyle = computed(() => {
  const [electric, gas, water] = analysisBreakdown.value;
  const electricEnd = electric?.ratio || 0;
  const gasEnd = electricEnd + (gas?.ratio || 0);
  return {
    background: `conic-gradient(${electric?.color || '#4cc9f0'} 0 ${electricEnd}%, ${gas?.color || '#72e6ac'} ${electricEnd}% ${gasEnd}%, ${water?.color || '#ffd166'} ${gasEnd}% 100%)`,
  };
});

function formatAnalysisValue(value: unknown): string | number {
  if (typeof value !== 'number') return typeof value === 'string' ? value : '-';
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatMetricValue(value: unknown): string | number {
  if (typeof value === 'number') return formatAnalysisValue(value);
  if (typeof value === 'string') return value;
  return '-';
}

function metricToneClass(tone?: string) {
  return tone ? `tone-${tone}` : 'tone-blue';
}

function analysisPercent(value: unknown, total: unknown) {
  const safeTotal = Number(total) || 1;
  return `${Math.max((Number(value) || 0) / safeTotal * 100, 2)}%`;
}

type EnergyActionMetric = { label: string; value: string | number; unit?: string; tone?: string };
type EnergyActionField = { label: string; value: string; type?: 'text' | 'number' | 'date' | 'select'; options?: string[] };
type EnergyActionPage = {
  title: string;
  desc: string;
  mode: 'overview' | 'table' | 'form' | 'setting';
  metrics: EnergyActionMetric[];
  columns?: AwTableColumn[];
  rows?: any[];
  fields?: EnergyActionField[];
  sections?: Array<{ title: string; items: string[] }>;
};

const currentAction = computed(() => (showSettingPage.value ? '' : viewAction.value));
const showActionPage = computed(() => Boolean(currentAction.value && energyActionPage.value));

const equipmentActionColumns: AwTableColumn[] = [
  { key: 'code', title: '设备编号', width: 110 },
  { key: 'name', title: '设备名称', width: 160, link: true },
  { key: 'category', title: '设备分类', width: 110 },
  { key: 'power', title: '功率(kW)', width: 90 },
  { key: 'location', title: '位置', width: 110 },
  { key: 'dept', title: '所属部门', width: 110 },
  { key: 'status', title: '状态', width: 90 },
  { key: 'todayConsumption', title: '今日能耗', width: 100 },
  { key: 'monthConsumption', title: '本月能耗', width: 110 },
];

const energyBatchColumns: AwTableColumn[] = [
  { key: 'batchNo', title: '批次号', width: 150, link: true },
  { key: 'source', title: '来源', width: 100 },
  { key: 'recordCount', title: '记录数', width: 90 },
  { key: 'confirmedCount', title: '已确认', width: 90 },
  { key: 'warningCount', title: '异常数', width: 90 },
  { key: 'importedBy', title: '导入人', width: 100 },
  { key: 'importedAt', title: '导入时间', width: 150 },
  { key: 'status', title: '入库状态', width: 100 },
];

const energyValidationColumns: AwTableColumn[] = [
  { key: 'issueType', title: '问题类型', width: 120 },
  { key: 'pointName', title: '采集点', width: 140 },
  { key: 'recordedAt', title: '记录时间', width: 150 },
  { key: 'value', title: '读数', width: 90 },
  { key: 'unit', title: '单位', width: 70 },
  { key: 'suggestion', title: '处理建议', width: 240 },
  { key: 'status', title: '处理状态', width: 100 },
];

const settingActionNames = [
  '采集点管理',
  '告警阈值',
  '监测频率',
  '分析维度',
  '基准设置',
  '分析周期',
  '报表模板',
  '报送设置',
  '措施分类',
  '目标设定',
  '核算标准',
  '排放因子',
  '能耗自定义字段',
  '能耗自定义编号',
  '能耗策略设置',
];

const settingColumns: Record<string, AwTableColumn[]> = {
  采集点管理: [
    { key: 'code', title: '采集点编码', width: 130, link: true },
    { key: 'name', title: '采集点名称', width: 150 },
    { key: 'meterType', title: '表计类型', width: 110 },
    { key: 'location', title: '安装位置', width: 120 },
    { key: 'unit', title: '单位', width: 70 },
    { key: 'status', title: '状态', width: 90 },
  ],
  告警阈值: [
    { key: 'pointName', title: '采集点', width: 160, link: true },
    { key: 'maxValue', title: '上限', width: 100 },
    { key: 'minValue', title: '下限', width: 100 },
    { key: 'unit', title: '单位', width: 70 },
    { key: 'enabledText', title: '启用', width: 80 },
    { key: 'rule', title: '触发规则', width: 180 },
  ],
  监测频率: [
    { key: 'target', title: '监测对象', width: 150, link: true },
    { key: 'category', title: '能源类型', width: 100 },
    { key: 'collectInterval', title: '采集间隔', width: 100 },
    { key: 'uploadInterval', title: '上报频率', width: 100 },
    { key: 'offlineAfter', title: '离线判定', width: 110 },
    { key: 'status', title: '状态', width: 90 },
  ],
  分析维度: [
    { key: 'name', title: '维度名称', width: 130, link: true },
    { key: 'key', title: '维度标识', width: 120 },
    { key: 'source', title: '数据来源', width: 130 },
    { key: 'scope', title: '统计范围', width: 160 },
    { key: 'enabledText', title: '启用', width: 80 },
  ],
  基准设置: [
    { key: 'objectName', title: '基准对象', width: 150, link: true },
    { key: 'period', title: '基准周期', width: 130 },
    { key: 'baseline', title: '基准能耗(kWh)', width: 130 },
    { key: 'current', title: '当前能耗(kWh)', width: 130 },
    { key: 'deviation', title: '偏差', width: 90 },
    { key: 'status', title: '状态', width: 90 },
  ],
  分析周期: [
    { key: 'name', title: '周期名称', width: 130, link: true },
    { key: 'granularity', title: '统计粒度', width: 110 },
    { key: 'range', title: '默认范围', width: 150 },
    { key: 'refreshAt', title: '刷新时间', width: 110 },
    { key: 'enabledText', title: '启用', width: 80 },
  ],
  报表模板: [
    { key: 'templateName', title: '模板名称', width: 170, link: true },
    { key: 'reportType', title: '报表类型', width: 100 },
    { key: 'sections', title: '包含章节', width: 220 },
    { key: 'owner', title: '维护人', width: 100 },
    { key: 'status', title: '状态', width: 90 },
  ],
  报送设置: [
    { key: 'reportType', title: '报表类型', width: 100, link: true },
    { key: 'frequency', title: '报送频率', width: 120 },
    { key: 'receiver', title: '接收对象', width: 160 },
    { key: 'channel', title: '渠道', width: 100 },
    { key: 'nextAt', title: '下次报送', width: 130 },
    { key: 'status', title: '状态', width: 90 },
  ],
  措施分类: [
    { key: 'category', title: '分类名称', width: 130, link: true },
    { key: 'code', title: '分类编码', width: 120 },
    { key: 'planCount', title: '措施数', width: 90 },
    { key: 'targetValue', title: '目标节能(kWh)', width: 140 },
    { key: 'investment', title: '计划投入(元)', width: 130 },
    { key: 'responsibleDept', title: '主责部门', width: 120 },
    { key: 'status', title: '状态', width: 90 },
  ],
  目标设定: [
    { key: 'targetName', title: '目标名称', width: 170, link: true },
    { key: 'targetObject', title: '目标对象', width: 130 },
    { key: 'period', title: '周期', width: 110 },
    { key: 'targetValue', title: '目标值', width: 110 },
    { key: 'currentValue', title: '当前值', width: 110 },
    { key: 'progress', title: '进度', width: 90 },
    { key: 'status', title: '状态', width: 90 },
  ],
  核算标准: [
    { key: 'standardName', title: '标准名称', width: 180, link: true },
    { key: 'scope', title: '核算范围', width: 130 },
    { key: 'boundary', title: '边界说明', width: 220 },
    { key: 'effectiveDate', title: '生效日期', width: 120 },
    { key: 'status', title: '状态', width: 90 },
  ],
  排放因子: [
    { key: 'energyType', title: '能源类型', width: 120, link: true },
    { key: 'factor', title: '排放因子', width: 120 },
    { key: 'unit', title: '单位', width: 120 },
    { key: 'effectiveDate', title: '生效日期', width: 120 },
    { key: 'source', title: '来源', width: 160 },
    { key: 'status', title: '状态', width: 90 },
  ],
  能耗自定义字段: [
    { key: 'fieldName', title: '字段名称', width: 150, link: true },
    { key: 'fieldKey', title: '字段标识', width: 140 },
    { key: 'fieldType', title: '字段类型', width: 100 },
    { key: 'module', title: '所属模块', width: 120 },
    { key: 'requiredText', title: '必填', width: 80 },
    { key: 'status', title: '状态', width: 90 },
  ],
  能耗自定义编号: [
    { key: 'ruleName', title: '规则名称', width: 160, link: true },
    { key: 'module', title: '所属模块', width: 120 },
    { key: 'prefix', title: '前缀', width: 90 },
    { key: 'dateRule', title: '日期规则', width: 110 },
    { key: 'serialLength', title: '流水位数', width: 100 },
    { key: 'preview', title: '预览', width: 170 },
    { key: 'status', title: '状态', width: 90 },
  ],
  能耗策略设置: [
    { key: 'strategyName', title: '策略名称', width: 170, link: true },
    { key: 'module', title: '所属模块', width: 120 },
    { key: 'trigger', title: '触发条件', width: 190 },
    { key: 'action', title: '执行动作', width: 190 },
    { key: 'owner', title: '负责人', width: 100 },
    { key: 'status', title: '状态', width: 90 },
  ],
};

const annualReportRows = computed(() => {
  const reportRows = rows.value.filter((row) => row.type === '年报');
  if (reportRows.length) return reportRows;
  return [
    {
      id: 'rpt-year-2026',
      title: '2026年度能耗年报',
      type: '年报',
      period: '2026年',
      totalConsumption: 89200 * 12,
      totalCost: 71360 * 12,
      carbonEmission: 48.5 * 12,
      status: '待生成',
      createdAt: '2026-12-31',
    },
  ];
});

const customReportRows = computed(() => rows.value.map((row) => ({
  ...row,
  type: row.type === '日报' ? '自定义' : row.type,
  title: row.type === '日报' ? '设备与部门能耗自定义报表' : row.title,
})));

const energyBatchRows = computed(() => {
  const groups = rows.value.reduce((acc: Record<string, any[]>, row) => {
    const key = row.source || '未分类';
    acc[key] = acc[key] || [];
    acc[key].push(row);
    return acc;
  }, {});
  return Object.entries(groups).map(([source, items], index) => ({
    id: `batch-${index + 1}`,
    batchNo: `EN-BATCH-202606-${String(index + 1).padStart(3, '0')}`,
    source,
    recordCount: items.length,
    confirmedCount: items.filter((item) => item.status === '已确认').length,
    warningCount: items.filter((item) => item.status !== '已确认').length,
    importedBy: source === '手动录入' ? '能源管理员' : '采集系统',
    importedAt: '2026-06-11 08:10',
    status: items.some((item) => item.status === '告警') ? '待复核' : '已入库',
  }));
});

const energyValidationRows = computed(() => rows.value
  .filter((row) => row.status !== '已确认' || Number(row.value) < 0)
  .map((row) => ({
    id: `check-${row.id}`,
    issueType: row.status === '告警' ? '读数异常' : row.status === '待确认' ? '待人工确认' : '负值校验',
    pointName: row.pointName,
    recordedAt: row.recordedAt,
    value: row.value,
    unit: row.unit,
    suggestion: row.status === '告警' ? '核对阈值并关联告警处理' : '确认采集点、单位和读数后入库',
    status: row.status === '告警' ? '待复核' : '待确认',
  })));

const settingRows = computed<Record<string, any[]>>(() => {
  const settings = energySettings.value;
  const plans = rows.value;
  const categoryRows = savingCategoryOptions.map((category, index) => {
    const related = plans.filter((plan) => plan.category === category);
    return {
      id: `saving-category-${index}`,
      category,
      code: `SV-CAT-${String(index + 1).padStart(2, '0')}`,
      planCount: related.length,
      targetValue: sumRows(related, ['targetValue']),
      investment: sumRows(related, ['investment']),
      responsibleDept: related[0]?.responsibleDept || '能源管理部',
      status: related.length ? '启用' : '待启用',
    };
  });
  const targetRows = plans.map((plan) => ({
    id: `target-${plan.id}`,
    targetName: `${plan.title}节能目标`,
    targetObject: plan.category,
    period: `${plan.startDate || '-'} 至 ${plan.endDate || '-'}`,
    targetValue: `${formatMetricValue(plan.targetValue)} ${plan.unit || 'kWh'}`,
    currentValue: `${formatMetricValue(plan.currentValue)} ${plan.unit || 'kWh'}`,
    progress: `${Math.min(Math.round((Number(plan.currentValue) || 0) / (Number(plan.targetValue) || 1) * 100), 100)}%`,
    status: plan.status,
  }));
  const points = settings?.collectionPoints || [];
  const thresholds = settings?.alarmThresholds || [];
  const dimensions = settings?.analysisDimensions || [];
  const factors = settings?.carbonFactors || [];
  const areas = settings?.areas || [];
  const baselineRows = areas.slice(0, 5).map((area, index) => {
    const baseline = 42000 + index * 7600;
    const current = Math.round(baseline * (0.88 + index * 0.04));
    return {
      id: `baseline-${area.id}`,
      objectName: area.name,
      period: '2026年1-5月均值',
      baseline,
      current,
      deviation: `${Math.round((current - baseline) / baseline * 100)}%`,
      status: current > baseline ? '超基准' : '正常',
    };
  });
  return {
    采集点管理: points,
    告警阈值: thresholds.map((item) => ({
      ...item,
      enabledText: item.enabled ? '启用' : '停用',
      rule: `读数 > ${item.maxValue}${item.unit} 或 < ${item.minValue}${item.unit}`,
    })),
    监测频率: points.map((item, index) => ({
      id: `freq-${item.id}`,
      target: item.name,
      category: item.unit === 'kWh' ? '电力' : item.unit === 'm³' ? '燃气' : '水',
      collectInterval: index < 2 ? '5分钟' : '15分钟',
      uploadInterval: index < 2 ? '实时' : '30分钟',
      offlineAfter: '30分钟无数据',
      status: item.status,
    })),
    分析维度: dimensions.map((item) => ({
      ...item,
      source: item.key === 'device' ? '设备台账' : item.key === 'energyType' ? '采集数据' : item.key === 'workshop' ? '区域档案' : '统计周期',
      scope: item.key === 'timePeriod' ? '日/周/月/自定义' : '能耗、成本、碳排放',
      enabledText: item.enabled ? '启用' : '停用',
    })),
    基准设置: baselineRows,
    分析周期: [
      { id: 'period-day', name: '日分析', granularity: '小时', range: '当天 00:00-24:00', refreshAt: '每小时', enabledText: '启用' },
      { id: 'period-week', name: '周分析', granularity: '日', range: '自然周', refreshAt: '每日 08:00', enabledText: '启用' },
      { id: 'period-month', name: '月分析', granularity: '日', range: '自然月', refreshAt: '每日 08:00', enabledText: '启用' },
      { id: 'period-custom', name: '自定义周期', granularity: '自选', range: '按筛选条件', refreshAt: '手动刷新', enabledText: '启用' },
    ],
    报表模板: [
      { id: 'tpl-day', templateName: '能耗日报模板', reportType: '日报', sections: '能耗概览、分项能耗、异常告警', owner: '能源管理部', status: '启用' },
      { id: 'tpl-month', templateName: '能耗月报模板', reportType: '月报', sections: '趋势、部门排名、成本分摊、节能措施', owner: '能源管理部', status: '启用' },
      { id: 'tpl-carbon', templateName: '碳排放报告模板', reportType: '碳报表', sections: '范围一、范围二、排放因子、减排目标', owner: '安全环保部', status: '启用' },
      { id: 'tpl-custom', templateName: '专题分析模板', reportType: '自定义', sections: '设备、产品、部门可选指标', owner: '能源管理部', status: '启用' },
    ],
    报送设置: [
      { id: 'send-day', reportType: '日报', frequency: '每日 08:30', receiver: '能源管理部、生产部', channel: '系统消息', nextAt: '2026-06-14 08:30', status: '启用' },
      { id: 'send-week', reportType: '周报', frequency: '每周一 09:00', receiver: '生产副总、设备动力部', channel: '邮件', nextAt: '2026-06-15 09:00', status: '启用' },
      { id: 'send-month', reportType: '月报', frequency: '每月1日 09:00', receiver: '经营管理层', channel: '邮件', nextAt: '2026-07-01 09:00', status: '启用' },
    ],
    措施分类: categoryRows,
    目标设定: targetRows,
    核算标准: [
      { id: 'std-1', standardName: '企业能源消费统计核算', scope: '能耗核算', boundary: '厂区生产、动力、办公用能统一折算为标煤/kWh口径', effectiveDate: '2026-01-01', status: '启用' },
      { id: 'std-2', standardName: '温室气体排放核算边界', scope: '碳排放', boundary: '范围一燃料燃烧、范围二购入电力分别核算', effectiveDate: '2026-01-01', status: '启用' },
      { id: 'std-3', standardName: '产品单耗核算口径', scope: '产品能耗', boundary: '按产品批次分摊电、气、水及辅助动力能耗', effectiveDate: '2026-01-01', status: '启用' },
    ],
    排放因子: factors.map((item) => ({ ...item, source: '企业年度核算口径', status: '启用' })),
    能耗自定义字段: [
      { id: 'field-1', fieldName: '尖峰平谷', fieldKey: 'timePriceType', fieldType: '下拉', module: moduleTitle.value, requiredText: '否', status: '启用' },
      { id: 'field-2', fieldName: '核算批次', fieldKey: 'accountingBatch', fieldType: '文本', module: moduleTitle.value, requiredText: '是', status: '启用' },
      { id: 'field-3', fieldName: '分摊对象', fieldKey: 'allocationObject', fieldType: '选择器', module: moduleTitle.value, requiredText: '否', status: '启用' },
    ],
    能耗自定义编号: [
      { id: 'code-1', ruleName: '能耗数据编号', module: '数据管理', prefix: 'ED', dateRule: 'yyyyMM', serialLength: 4, preview: 'ED-202606-0001', status: '启用' },
      { id: 'code-2', ruleName: '节能措施编号', module: '节能措施', prefix: 'SV', dateRule: 'yyyy', serialLength: 3, preview: 'SV-2026-001', status: '启用' },
      { id: 'code-3', ruleName: '设备能耗编号', module: '设备能耗', prefix: 'EQE', dateRule: 'yyyyMM', serialLength: 4, preview: 'EQE-202606-0001', status: '启用' },
    ],
    能耗策略设置: [
      { id: 'strategy-1', strategyName: '超基准预警', module: moduleTitle.value, trigger: '当前能耗高于基准10%', action: '生成异常提醒并推送责任部门', owner: '能源管理员', status: '启用' },
      { id: 'strategy-2', strategyName: '异常读数复核', module: '数据管理', trigger: '读数为负或超过阈值', action: '进入数据校验清单', owner: '数据专员', status: '启用' },
      { id: 'strategy-3', strategyName: '节能目标跟踪', module: '节能措施', trigger: '目标进度低于计划进度', action: '标记风险并提醒责任人', owner: '设备动力部', status: '启用' },
    ],
  };
});

const energyActionPage = computed<EnergyActionPage | null>(() => {
  const action = currentAction.value;
  if (!action) return null;

  const module = moduleKey.value;
  const total = sumRows(rows.value, ['totalConsumption', 'monthConsumption', 'value', 'totalEmission', 'targetValue']);
  const cost = sumRows(rows.value, ['cost', 'totalCost', 'investment']);
  const carbon = sumRows(rows.value, ['carbonEmission', 'totalEmission']);
  const commonMetrics: EnergyActionMetric[] = [
    { label: '记录数', value: rows.value.length, unit: '条', tone: 'blue' },
    { label: module === 'carbon' ? '碳排放' : '能耗合计', value: formatMetricValue(total), unit: module === 'carbon' ? 'tCO₂' : 'kWh', tone: 'green' },
    { label: '成本/投入', value: formatMetricValue(cost), unit: '元', tone: 'yellow' },
    { label: '碳排放', value: formatMetricValue(carbon), unit: 'tCO₂', tone: 'red' },
  ];

  if (module === 'analysis') {
    if (action === '趋势分析') {
      return {
        title: action,
        desc: '按日、按小时观察能耗变化，识别高峰时段、低谷时段和波动异常。',
        mode: 'overview',
        metrics: analysisData.value?.cards || [],
        sections: [
          { title: '趋势口径', items: ['每日总能耗趋势', '今日小时负荷曲线', '电力/燃气/水分项趋势'] },
          { title: '异常关注', items: ['高于近 7 日均值的时段', '峰谷差过大的采集点', '连续上升的用能单元'] },
        ],
      };
    }
    if (action === '对比分析') {
      return {
        title: action,
        desc: '从产品、部门、设备和能源类型维度横向比较能耗强度。',
        mode: 'overview',
        metrics: [
          { label: '产品维度', value: '7', unit: '项', tone: 'blue' },
          { label: '部门维度', value: '6', unit: '个', tone: 'green' },
          { label: '设备维度', value: '8', unit: '台', tone: 'yellow' },
          { label: '能源类型', value: analysisBreakdown.value.length, unit: '类', tone: 'blue' },
        ],
        sections: [
          { title: '对比内容', items: ['产品单耗排名', '部门环比变化', '设备用能占比', '能源结构占比'] },
          { title: '输出结果', items: ['高耗能对象清单', '降耗优先级建议', '成本影响评估'] },
        ],
      };
    }
    if (action === '成本分析') {
      return {
        title: action,
        desc: '将能耗读数折算到成本口径，支持成本分摊和经营核算。',
        mode: 'overview',
        metrics: [
          { label: '今日成本', value: formatMetricValue(analysisData.value?.cards?.find((item: any) => item.key === 'todayCost')?.value || 0), unit: '元', tone: 'yellow' },
          { label: '本月累计成本', value: formatMetricValue(analysisData.value?.cards?.find((item: any) => item.key === 'monthCost')?.value || 0), unit: '元', tone: 'green' },
          { label: '成本分摊维度', value: 4, unit: '类', tone: 'blue' },
          { label: '节能率', value: formatMetricValue(analysisData.value?.cards?.find((item: any) => item.key === 'savingRate')?.value || 0), unit: '%', tone: 'green' },
        ],
        sections: [
          { title: '成本口径', items: ['峰平谷电价折算', '燃气单价折算', '水耗单价折算', '碳排放成本预估'] },
          { title: '分摊对象', items: ['产品批次', '生产部门', '用能设备', '成本中心'] },
        ],
      };
    }
  }

  if (settingActionNames.includes(action)) {
    return settingActionPage(action, module);
  }

  if (action.startsWith('新增')) {
    return formActionPage(action, module);
  }

  if (module === 'monitor') {
    if (action === '设备能耗') {
      return {
        title: action,
        desc: '按设备维度汇总功率、运行时长、今日能耗、本月能耗和告警状态。',
        mode: 'table',
        metrics: commonMetrics,
        columns: equipmentActionColumns,
        rows: rows.value,
      };
    }
    if (action === '异常告警') {
      return {
        title: action,
        desc: '集中处理越限、波动、峰值等能耗异常，支持确认和后续跟踪。',
        mode: 'table',
        metrics: [
          { label: '告警总数', value: alarmRows.value.length, unit: '条', tone: 'blue' },
          { label: '待确认', value: alarmRows.value.filter((item: any) => item.status === '待确认').length, unit: '条', tone: 'red' },
          { label: '紧急/重要', value: alarmRows.value.filter((item: any) => ['紧急', '重要'].includes(item.alarmLevel)).length, unit: '条', tone: 'yellow' },
          { label: '已确认', value: alarmRows.value.filter((item: any) => item.status !== '待确认').length, unit: '条', tone: 'green' },
        ],
        columns: [
          { key: 'pointName', title: '采集点', width: 130 },
          { key: 'alarmType', title: '告警类型', width: 110 },
          { key: 'alarmLevel', title: '级别', width: 90 },
          { key: 'message', title: '告警内容', width: 280 },
          { key: 'occuredAt', title: '发生时间', width: 150 },
          { key: 'status', title: '状态', width: 90 },
        ],
        rows: alarmRows.value,
      };
    }
    return {
      title: action,
      desc: action === '实时监测' ? '查看采集点实时读数、在线状态和今日累计值。' : '按设备维度汇总能耗读数和运行状态。',
      mode: 'table',
      metrics: commonMetrics,
      columns: moduleConfig.value.columns,
      rows: rows.value,
    };
  }

  if (module === 'reports') {
    if (action === '年报') {
      return {
        title: action,
        desc: '按年度汇总能耗、成本、碳排放和报送状态，支持年终归档。',
        mode: 'table',
        metrics: [
          { label: '年报数量', value: annualReportRows.value.length, unit: '份', tone: 'blue' },
          { label: '年度能耗', value: formatMetricValue(sumRows(annualReportRows.value, ['totalConsumption'])), unit: 'kWh', tone: 'green' },
          { label: '年度成本', value: formatMetricValue(sumRows(annualReportRows.value, ['totalCost'])), unit: '元', tone: 'yellow' },
          { label: '碳排放', value: formatMetricValue(sumRows(annualReportRows.value, ['carbonEmission'])), unit: 'tCO₂', tone: 'red' },
        ],
        columns: moduleConfig.value.columns,
        rows: annualReportRows.value,
      };
    }
    if (action === '自定义报表') {
      return {
        title: action,
        desc: '面向临时分析和专题报送，按对象、周期和指标自由组合报表内容。',
        mode: 'table',
        metrics: commonMetrics,
        columns: moduleConfig.value.columns,
        rows: customReportRows.value,
      };
    }
    return {
      title: action,
      desc: `${action}用于沉淀能耗周期数据、成本、碳排放和报送状态。`,
      mode: 'table',
      metrics: commonMetrics,
      columns: moduleConfig.value.columns,
      rows: rows.value,
    };
  }

  if (module === 'saving') {
    return {
      title: action,
      desc: action === '措施执行' ? '跟踪节能措施执行进度、投入、已节能量和责任部门。' : action === '效果评估' ? '复盘节能目标达成率、投资回收和节省金额。' : '维护节能方案、目标、投入预算和执行计划。',
      mode: 'table',
      metrics: commonMetrics,
      columns: moduleConfig.value.columns,
      rows: rows.value,
    };
  }

  if (module === 'carbon') {
    return {
      title: action,
      desc: action === '减排目标' ? '维护年度减排目标、实际减排和达标状态。' : '核算范围一、范围二排放并形成排放报告。',
      mode: 'table',
      metrics: commonMetrics,
      columns: moduleConfig.value.columns,
      rows: rows.value,
    };
  }

  if (action === '数据批次列表') {
    return {
      title: action,
      desc: actionDesc(action, module),
      mode: 'table',
      metrics: [
        { label: '批次数', value: energyBatchRows.value.length, unit: '批', tone: 'blue' },
        { label: '记录数', value: sumRows(energyBatchRows.value, ['recordCount']), unit: '条', tone: 'green' },
        { label: '异常数', value: sumRows(energyBatchRows.value, ['warningCount']), unit: '条', tone: 'red' },
        { label: '已确认', value: sumRows(energyBatchRows.value, ['confirmedCount']), unit: '条', tone: 'green' },
      ],
      columns: energyBatchColumns,
      rows: energyBatchRows.value,
    };
  }

  if (action === '数据校验') {
    return {
      title: action,
      desc: actionDesc(action, module),
      mode: 'table',
      metrics: [
        { label: '问题数', value: energyValidationRows.value.length, unit: '条', tone: energyValidationRows.value.length ? 'red' : 'green' },
        { label: '待确认', value: energyValidationRows.value.filter((row) => row.status === '待确认').length, unit: '条', tone: 'yellow' },
        { label: '待复核', value: energyValidationRows.value.filter((row) => row.status === '待复核').length, unit: '条', tone: 'red' },
        { label: '校验范围', value: rows.value.length, unit: '条', tone: 'blue' },
      ],
      columns: energyValidationColumns,
      rows: energyValidationRows.value,
    };
  }

  if (['产品能耗列表', '部门能耗列表', '设备能耗列表', '导入数据'].includes(action)) {
    return {
      title: action,
      desc: actionDesc(action, module),
      mode: action === '导入数据' ? 'form' : 'table',
      metrics: commonMetrics,
      columns: moduleConfig.value.columns,
      rows: rows.value,
      fields: action === '导入数据' ? [
        { label: '导入模板', value: '采集点、记录时间、读数、单位、成本、碳排放' },
        { label: '数据来源', value: '采集系统 / 手动台账 / Excel 导入' },
        { label: '校验规则', value: '采集点存在、时间不重复、读数非负、单位匹配' },
        { label: '入库方式', value: '先进入待确认批次，校验通过后写入能耗数据' },
      ] : undefined,
    };
  }

  return {
    title: action,
    desc: actionDesc(action, module),
    mode: 'table',
    metrics: commonMetrics,
    columns: moduleConfig.value.columns,
    rows: rows.value,
  };
});

function sumRows(items: any[], keys: string[]) {
  return items.reduce((sum, row) => {
    const key = keys.find((item) => typeof row?.[item] === 'number');
    return sum + (key ? Number(row[key]) : 0);
  }, 0);
}

function settingActionPage(action: string, module: EnergyModule): EnergyActionPage {
  const tableRows = settingRows.value[action] || [];
  const numericTotal = sumRows(tableRows, ['targetValue', 'baseline', 'current', 'factor', 'maxValue', 'planCount']);
  return {
    title: action,
    desc: actionDesc(action, module),
    mode: 'table',
    metrics: [
      { label: '记录数', value: tableRows.length, unit: '条', tone: 'blue' },
      { label: '启用数', value: tableRows.filter((item) => !['停用', '待启用'].includes(String(item.status || item.enabledText))).length, unit: '条', tone: 'green' },
      { label: '适用模块', value: moduleTitle.value, tone: 'blue' },
      { label: action.includes('因子') ? '因子合计' : '业务量', value: formatMetricValue(numericTotal), tone: 'yellow' },
    ],
    columns: settingColumns[action] || moduleConfig.value.columns,
    rows: tableRows,
  };
}

function formActionPage(action: string, module: EnergyModule): EnergyActionPage {
  const fieldsMap: Record<string, EnergyActionField[]> = {
    新增产品单耗: [
      { label: '产品名称', value: '请选择产品档案' },
      { label: '统计周期', value: '2026-06', type: 'text' },
      { label: '产量', value: '请输入产量', type: 'number' },
      { label: '电力(kWh)', value: '请输入电力能耗', type: 'number' },
      { label: '燃气(kWh)', value: '请输入燃气折算能耗', type: 'number' },
      { label: '能耗成本(元)', value: '请输入成本', type: 'number' },
      { label: '碳排放(tCO₂)', value: '自动折算或手工录入', type: 'number' },
      { label: '核算说明', value: '请输入核算口径说明' },
    ],
    新增部门指标: [
      { label: '部门名称', value: '请选择部门' },
      { label: '指标周期', value: '2026-06' },
      { label: '目标能耗(kWh)', value: '请输入目标能耗', type: 'number' },
      { label: '预警阈值(%)', value: '请输入超标预警阈值', type: 'number' },
      { label: '责任人', value: '请输入责任人' },
      { label: '考核口径', value: '请选择考核口径', type: 'select', options: ['按月环比', '按目标达成率', '按单位产值能耗'] },
    ],
    新增设备能耗: [
      { label: '设备名称', value: '请选择设备台账' },
      { label: '采集点', value: '请选择采集点' },
      { label: '运行时长(h)', value: '请输入运行时长', type: 'number' },
      { label: '今日能耗(kWh)', value: '请输入今日能耗', type: 'number' },
      { label: '本月能耗(kWh)', value: '请输入本月累计', type: 'number' },
      { label: '告警阈值', value: '请输入告警阈值', type: 'number' },
      { label: '联动策略', value: '请选择联动策略', type: 'select', options: ['仅告警', '联动设备保养', '联动停机检查'] },
      { label: '备注', value: '请输入备注' },
    ],
  };
  return {
    title: action,
    desc: actionDesc(action, module),
    mode: 'form',
    metrics: [],
    fields: fieldsMap[action] || [
      { label: '业务对象', value: '请选择能耗对象' },
      { label: '统计周期', value: '请选择开始日期、结束日期和核算口径' },
      { label: '能耗数据', value: '请输入电力、燃气、水耗、成本和碳排放' },
      { label: '责任信息', value: '请选择部门、责任人并填写备注' },
    ],
  };
}

function actionDesc(action: string, module: EnergyModule) {
  const map: Record<string, string> = {
    采集点管理: '维护电表、燃气表、水表等采集点的编码、表计类型、安装位置和在线状态。',
    告警阈值: '按采集点维护读数上限、下限和启用状态，用于异常告警触发。',
    监测频率: '按采集对象配置采集间隔、上报频率和离线判定规则。',
    分析维度: '维护能耗分析可用维度，控制按车间、能源类型、设备、周期等口径统计。',
    基准设置: '按区域或对象维护基准周期、基准能耗和偏差状态，用于超基准分析。',
    分析周期: '维护日、周、月和自定义周期的统计粒度、默认范围和刷新节奏。',
    报表模板: '维护日报、月报、碳排报告和专题报表的章节结构与模板状态。',
    报送设置: '维护各类能耗报表的报送频率、接收对象、渠道和下次报送时间。',
    措施分类: '按设备改造、照明节能、新能源等分类归口节能措施，并汇总目标节能和计划投入。',
    目标设定: '维护节能措施目标值、当前完成值、周期进度和执行状态。',
    核算标准: '维护能耗、碳排放和产品单耗的核算范围、边界和生效日期。',
    排放因子: '维护电力、天然气、柴油、水耗等能源类型的排放因子和适用日期。',
    能耗自定义字段: '维护当前能耗模块需要扩展的字段名称、类型、所属模块和启用状态。',
    能耗自定义编号: '维护能耗数据、节能措施、设备能耗等单据的编号前缀、日期规则和流水位数。',
    能耗策略设置: '维护超基准预警、异常读数复核、目标跟踪等自动策略。',
    导入数据: '导入采集系统或台账数据，先校验再入库，避免异常读数污染统计口径。',
    数据校验: '校验采集点、时间、单位、读数范围和重复记录，输出待处理问题清单。',
    数据批次列表: '按导入批次追踪数据来源、校验状态、入库数量和处理人。',
    产品能耗列表: '按产品归集能耗、成本、碳排放和占比，支持单耗分析。',
    部门能耗列表: '按部门归集能耗、成本、环比变化和碳排放，支撑责任考核。',
    设备能耗列表: '按设备归集功率、运行时长、本月能耗和告警状态。',
  };
  return map[action] || `${action}用于完善${moduleTitle.value}的业务数据、统计口径和执行过程。`;
}

function loadList() {
  const action = viewAction.value;
  getEnergySettings().then((res) => { energySettings.value = res; });
  if (moduleKey.value === 'monitor' && action === '设备能耗') {
    listEnergyEquipment({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
    return;
  }
  if (moduleKey.value === 'monitor') {
    listAlarms().then((res) => { alarmRows.value = res; });
  }
  if (moduleKey.value === 'energyData' && ['导入数据', '数据批次列表', '数据校验'].includes(action)) {
    listEnergyData({ keyword: keyword.value }).then((res) => { rows.value = res.rows; });
    return;
  }
  // Handle action-based filtering for reports
  if (moduleKey.value === 'reports' && action && !action.startsWith('setting-')) {
    listReports({ keyword: keyword.value }).then((res) => {
      if (['日报','月报','年报','自定义报表'].includes(action)) {
        rows.value = action === '自定义报表' || action === '年报' ? res.rows : res.rows.filter((r: any) => r.type === action);
      } else { rows.value = res.rows; }
    });
    return;
  }
  // Handle action-based filtering for saving
  if (moduleKey.value === 'saving' && action && !action.startsWith('setting-')) {
    listSavingPlans({ keyword: keyword.value }).then((res) => {
      if (['措施方案','措施执行','效果评估','措施分类','目标设定'].includes(action)) {
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
  if (showActionPage.value) {
    detailRow.value = row;
    showDetail.value = true;
    return;
  }
  if (moduleKey.value === 'monitor') {
    detailRow.value = row;
    showDetail.value = true;
  } else if (moduleKey.value === 'reports') {
    getReport(row.id).then((r) => { detailRow.value = r; showDetail.value = true; });
  } else if (moduleKey.value === 'saving') {
    getSavingPlan(row.id).then((r) => { detailRow.value = r; showDetail.value = true; });
  } else if (moduleKey.value === 'carbon') {
    getCarbonRecord(row.id).then((r) => { detailRow.value = r; showDetail.value = true; });
  } else if (['product', 'department', 'energyData', 'equipment'].includes(moduleKey.value)) {
    detailRow.value = row;
    showDetail.value = true;
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

function handleSearch(value: string) {
  keyword.value = value;
  loadList();
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

watch(() => route.fullPath, () => {
  showDetail.value = false;
  showCreate.value = false;
  pickedTree.value = 'all';
  keyword.value = '';
  loadList();
}, { immediate: true });
</script>

<template>
  <!-- 设置页（通过 ?setting= 参数触发） -->
  <template v-if="showSettingPage">
    <energy-setting-page :default-tab="settingKey" />
  </template>

  <!-- 能耗中心浮层动作页 -->
  <template v-if="!showSettingPage && showActionPage && energyActionPage">
    <div class="energy-action-page">
      <section class="aw-form-card energy-action-head">
        <div>
          <h2>{{ energyActionPage.title }}</h2>
          <p>{{ energyActionPage.desc }}</p>
        </div>
        <button class="aw-tool-btn" type="button" @click="loadList">刷新</button>
      </section>

      <section v-if="energyActionPage.metrics.length" class="energy-action-metrics">
        <article
          v-for="metric in energyActionPage.metrics"
          :key="metric.label"
          :class="['energy-action-metric', metricToneClass(metric.tone)]"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small v-if="metric.unit">{{ metric.unit }}</small>
        </article>
      </section>

      <section v-if="energyActionPage.mode === 'form'" class="aw-form-card">
        <div class="energy-panel-head">
          <div>
            <h2>基础信息</h2>
            <p>按当前业务单据维护对象、周期、能耗读数和责任信息。</p>
          </div>
        </div>
        <div class="energy-action-form-grid">
          <label v-for="field in energyActionPage.fields" :key="field.label">
            <span>{{ field.label }}</span>
            <select v-if="field.type === 'select'">
              <option value="">{{ field.value }}</option>
              <option v-for="option in field.options || []" :key="option" :value="option">{{ option }}</option>
            </select>
            <input v-else :placeholder="field.value" :type="field.type || 'text'" />
          </label>
        </div>
        <div class="energy-action-foot">
          <button class="aw-tool-btn" type="button" @click="router.push(route.path)">返回列表</button>
          <button class="aw-btn primary" type="button">保存草稿</button>
        </div>
      </section>

      <section v-else-if="energyActionPage.mode === 'setting'" class="aw-form-card">
        <div class="energy-panel-head">
          <div>
            <h2>配置项</h2>
            <p>维护当前模块会实际使用的字段、编号、策略和业务规则。</p>
          </div>
        </div>
        <div class="energy-action-section-grid">
          <article v-for="section in energyActionPage.sections" :key="section.title" class="energy-action-section">
            <h3>{{ section.title }}</h3>
            <ul>
              <li v-for="item in section.items" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section v-else-if="energyActionPage.mode === 'overview'" class="aw-form-card">
        <div class="energy-panel-head">
          <div>
            <h2>分析内容</h2>
            <p>围绕当前分析主题组织关键口径和输出结果。</p>
          </div>
        </div>
        <div class="energy-action-section-grid">
          <article v-for="section in energyActionPage.sections" :key="section.title" class="energy-action-section">
            <h3>{{ section.title }}</h3>
            <ul>
              <li v-for="item in section.items" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
      </section>

      <aw-list-page v-else>
        <template #default>
          <aw-list-toolbar
            :search-placeholder="`搜索${energyActionPage.title}...`"
            :actions="['refresh']"
            @search="handleSearch"
            @refresh="loadList"
          />
          <aw-data-table
            :columns="energyActionPage.columns || []"
            :rows="energyActionPage.rows || []"
            :total="energyActionPage.rows?.length || 0"
          >
            <template #cell="{ column, record, value }">
              <span v-if="column.link" class="aw-link" @click="showRow(record)">{{ value }}</span>
              <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
              <span v-else-if="column.key === 'trend'" :class="['aw-status', value === 'up' ? 'red' : value === 'down' ? 'green' : 'blue']">{{ value === 'up' ? '↗' : value === 'down' ? '↘' : '→' }}</span>
              <span v-else-if="column.key === 'changeRate'">{{ Number(value) >= 0 ? '+' + value : value }}%</span>
              <span v-else-if="['carbonEmission', 'cost', 'totalConsumption', 'monthConsumption', 'value'].includes(column.key)">{{ typeof value === 'number' ? value.toLocaleString() : value }}</span>
              <span v-else>{{ value ?? '-' }}</span>
            </template>
          </aw-data-table>
        </template>
      </aw-list-page>
    </div>
  </template>

  <!-- 能耗监测 -->
  <template v-if="!showSettingPage && !showActionPage && moduleKey === 'monitor'">
    <aw-list-page>
      <template #tree>
        <aw-resource-tree
          v-model="pickedTree"
          :title="activeTreeTitle"
          :total="rows.length"
          :nodes="activeTreeNodes"
          @select="treeFilter"
        />
      </template>
      <template #default>
        <aw-list-toolbar :search-placeholder="activeSearchPlaceholder" :actions="['refresh']" @search="handleSearch" @refresh="loadList"></aw-list-toolbar>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length">
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
      <aw-data-table :columns="[
        { key: 'pointName', title: '采集点', width: 130 },
        { key: 'alarmType', title: '告警类型', width: 100 },
        { key: 'alarmLevel', title: '级别', width: 80 },
        { key: 'message', title: '告警内容', width: 300 },
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
  <template v-if="!showSettingPage && !showActionPage && moduleKey === 'analysis' && analysisData">
    <div class="energy-analysis-page">
      <section class="energy-metric-grid">
        <article
          v-for="card in analysisData.cards"
          :key="card.key"
          :class="['energy-metric', metricToneClass(card.tone)]"
        >
          <span>{{ card.label }}</span>
          <strong>{{ formatAnalysisValue(card.value) }}</strong>
          <small v-if="card.unit">{{ card.unit }}</small>
        </article>
      </section>

      <section class="energy-analysis-layout">
        <article class="energy-visual-card energy-trend-card">
          <div class="energy-panel-head">
            <div>
              <h2>每日能耗趋势</h2>
              <p>电力、燃气、水分项堆叠，按总能耗高度归一展示。</p>
            </div>
            <span>kWh</span>
          </div>
          <div class="energy-chart">
            <div class="energy-bar-chart">
              <div v-for="d in analysisData.dailyRecords" :key="d.date" class="energy-bar-col">
                <span class="energy-bar-total">{{ formatAnalysisValue(d.total) }}</span>
                <div
                  class="energy-bar energy-bar-stacked"
                  :style="{ height: Math.max((Number(d.total) || 0) / analysisDailyMax * 220, 12) + 'px' }"
                >
                  <div
                    class="energy-bar-seg electric"
                    :style="{ flexBasis: analysisPercent(d.electric, d.total) }"
                    :title="'电力 ' + d.electric + ' kWh'"
                  ></div>
                  <div
                    class="energy-bar-seg gas"
                    :style="{ flexBasis: analysisPercent(d.gas, d.total) }"
                    :title="'燃气 ' + d.gas + ' kWh'"
                  ></div>
                  <div
                    class="energy-bar-seg water"
                    :style="{ flexBasis: analysisPercent(d.water, d.total) }"
                    :title="'水 ' + d.water + ' t'"
                  ></div>
                </div>
                <span class="energy-bar-label">{{ d.date.slice(5) }}</span>
              </div>
            </div>
          </div>
          <div class="energy-legend">
            <span v-for="item in analysisBreakdown" :key="item.key"><i :style="{ background: item.color }"></i>{{ item.label }}</span>
          </div>
        </article>

        <div class="energy-side-stack">
          <article class="energy-visual-card energy-line-card">
            <div class="energy-panel-head compact">
              <div>
                <h2>今日负荷曲线</h2>
                <p>2 小时间隔读数</p>
              </div>
              <strong>{{ formatAnalysisValue(analysisPeakHour?.value) }} kWh</strong>
            </div>
            <svg class="energy-line-chart" viewBox="0 0 640 180" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="energyLineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polygon :points="analysisHourlyAreaPoints" fill="url(#energyLineFill)" />
              <polyline :points="analysisHourlyLinePoints" fill="none" stroke="#2563eb" stroke-linecap="round" stroke-linejoin="round" stroke-width="5" />
            </svg>
            <div class="energy-line-axis">
              <span v-for="item in analysisData.todayEnergy" :key="item.hour">{{ item.hour.slice(0, 2) }}</span>
            </div>
          </article>

          <article class="energy-visual-card energy-structure-card">
            <div class="energy-panel-head compact">
              <div>
                <h2>能源结构</h2>
                <p>近 7 日累计占比</p>
              </div>
            </div>
            <div class="energy-structure-body">
              <div class="energy-donut" :style="analysisRingStyle">
                <div>
                  <strong>{{ analysisLatestDaily?.total ? formatAnalysisValue(analysisLatestDaily.total) : '-' }}</strong>
                  <span>最新日总量</span>
                </div>
              </div>
              <div class="energy-breakdown-list">
                <div v-for="item in analysisBreakdown" :key="item.key">
                  <span><i :style="{ background: item.color }"></i>{{ item.label }}</span>
                  <strong>{{ item.ratio }}%</strong>
                  <small>{{ formatAnalysisValue(item.value) }} kWh</small>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </template>

  <!-- 能耗报表 -->
  <template v-if="!showSettingPage && !showActionPage && moduleKey === 'reports'">
    <aw-list-page>
      <template #tree>
        <aw-resource-tree
          v-if="activeTreeNodes.length > 0"
          v-model="pickedTree"
          :title="activeTreeTitle"
          :total="rows.length"
          :nodes="activeTreeNodes"
          @select="treeFilter"
        />
      </template>
      <template #default>
        <aw-list-toolbar :search-placeholder="activeSearchPlaceholder" :actions="['refresh']" @search="handleSearch" @refresh="loadList"></aw-list-toolbar>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length">
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
  <template v-if="!showSettingPage && !showActionPage && moduleKey === 'saving'">
    <aw-list-page>
      <template #tree>
        <aw-resource-tree
          v-if="activeTreeNodes.length > 0"
          v-model="pickedTree"
          :title="activeTreeTitle"
          :total="rows.length"
          :nodes="activeTreeNodes"
          @select="treeFilter"
        />
      </template>
      <template #default>
        <aw-list-toolbar :search-placeholder="activeSearchPlaceholder" create-label="新增措施" :actions="['refresh', 'create']" @search="handleSearch" @refresh="loadList" @create="handleToolbar('create')"></aw-list-toolbar>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length">
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
  <template v-if="!showSettingPage && !showActionPage && moduleKey === 'carbon'">
    <aw-list-page>
      <template #default>
        <aw-list-toolbar :search-placeholder="activeSearchPlaceholder" :actions="['refresh']" @search="handleSearch" @refresh="loadList"></aw-list-toolbar>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length">
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
  <template v-if="!showSettingPage && !showActionPage && (moduleKey === 'product' || moduleKey === 'department' || moduleKey === 'energyData' || moduleKey === 'equipment')">
    <aw-list-page>
      <template v-if="hasActiveTree" #tree>
        <aw-resource-tree
          v-model="pickedTree"
          :title="activeTreeTitle"
          :total="rows.length"
          :nodes="activeTreeNodes"
          @select="treeFilter"
        />
      </template>
      <template #default>
        <aw-list-toolbar :search-placeholder="activeSearchPlaceholder" :actions="moduleConfig.actions || ['refresh']" @search="handleSearch" @refresh="loadList"></aw-list-toolbar>
        <aw-data-table :columns="moduleConfig.columns" :rows="rows" :total="rows.length">
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
        <div v-if="!showSettingPage && showActionPage && energyActionPage && detailRow" class="energy-detail-grid">
          <div
            v-for="column in energyActionPage.columns || []"
            :key="column.key"
            class="energy-detail-field"
          >
            <span>{{ column.title }}</span>
            <strong>{{ detailRow[column.key] ?? '-' }}</strong>
          </div>
        </div>
        <div v-if="!showSettingPage && !showActionPage && moduleKey === 'monitor' && detailRow" class="energy-detail-grid">
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
        <div v-if="!showSettingPage && !showActionPage && moduleKey === 'reports' && detailRow" class="energy-detail-grid">
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
        <div v-if="!showSettingPage && !showActionPage && moduleKey === 'saving' && detailRow" class="energy-detail-grid">
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
        <div v-if="!showSettingPage && !showActionPage && moduleKey === 'carbon' && detailRow" class="energy-detail-grid">
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
        <!-- 通用能耗资源详情 -->
        <div v-if="!showSettingPage && !showActionPage && ['product', 'department', 'energyData', 'equipment'].includes(moduleKey) && detailRow" class="energy-detail-grid">
          <div
            v-for="column in moduleConfig.columns"
            :key="column.key"
            class="energy-detail-field"
          >
            <span>{{ column.title }}</span>
            <strong>{{ detailRow[column.key] ?? '-' }}</strong>
          </div>
          <div v-if="detailRow.remark" class="energy-detail-field wide">
            <span>备注</span>
            <strong>{{ detailRow.remark }}</strong>
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
.energy-analysis-page {
  align-content: start;
  box-sizing: border-box;
  display: grid;
  gap: 16px;
  height: 100%;
  min-width: 0;
  overflow: auto;
  padding: 16px;
}

.energy-action-page {
  align-content: start;
  box-sizing: border-box;
  display: grid;
  gap: 16px;
  height: 100%;
  min-width: 0;
  overflow: auto;
  padding: 16px;
}

.energy-action-head {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.energy-action-head h2 {
  color: var(--aw-fg-1);
  font-size: 17px;
  margin: 0;
}

.energy-action-head p {
  color: var(--aw-fg-3);
  font-size: 13px;
  line-height: 1.6;
  margin: 6px 0 0;
}

.energy-action-metrics {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.energy-action-metric {
  background: #fff;
  border: 1px solid rgba(220, 228, 238, 0.92);
  border-radius: 8px;
  display: grid;
  gap: 6px;
  min-height: 88px;
  overflow: hidden;
  padding: 14px 16px;
  position: relative;
}

.energy-action-metric::before {
  background: #4cc9f0;
  content: '';
  height: 3px;
  inset: 0 0 auto;
  position: absolute;
}

.energy-action-metric.tone-green::before { background: #30c48d; }
.energy-action-metric.tone-yellow::before { background: #f3b541; }
.energy-action-metric.tone-red::before { background: #ef6673; }
.energy-action-metric.tone-blue::before { background: #4cc9f0; }
.energy-action-metric.tone-gray::before { background: #94a3b8; }

.energy-action-metric span,
.energy-action-metric small {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.energy-action-metric strong {
  color: #172033;
  font-size: 22px;
  line-height: 1.1;
}

.energy-action-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.energy-action-form-grid label {
  display: grid;
  gap: 6px;
}

.energy-action-form-grid span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.energy-action-form-grid input,
.energy-action-form-grid select {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--aw-fg-1);
  min-height: 34px;
  padding: 0 10px;
  width: 100%;
}

.energy-action-foot {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
}

.energy-action-section-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.energy-action-section {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 14px 16px;
}

.energy-action-section h3 {
  font-size: 15px;
  margin: 0 0 10px;
}

.energy-action-section ul {
  color: var(--aw-fg-2);
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
}

.energy-metric-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.energy-metric {
  background: #fff;
  border: 1px solid rgba(220, 228, 238, 0.92);
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  display: grid;
  gap: 6px;
  min-height: 106px;
  overflow: hidden;
  padding: 16px;
  position: relative;
}

.energy-metric::before {
  background: #4cc9f0;
  content: '';
  height: 3px;
  inset: 0 0 auto;
  position: absolute;
}

.energy-metric.tone-green::before { background: #30c48d; }
.energy-metric.tone-yellow::before { background: #f3b541; }
.energy-metric.tone-red::before { background: #ef6673; }
.energy-metric.tone-blue::before { background: #4cc9f0; }

.energy-metric span {
  color: var(--aw-fg-3);
  font-size: 13px;
}

.energy-metric strong {
  color: #172033;
  font-size: 25px;
  line-height: 1.1;
}

.energy-metric small {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.energy-analysis-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.9fr);
}

.energy-side-stack {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.energy-visual-card {
  background: #fff;
  border: 1px solid rgba(213, 224, 238, 0.92);
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
  min-width: 0;
  overflow: hidden;
  padding: 18px;
}

.energy-panel-head {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.energy-panel-head h2 {
  color: #172033;
  font-size: 17px;
  margin: 0;
}

.energy-panel-head p {
  color: var(--aw-fg-3);
  font-size: 12px;
  margin: 5px 0 0;
}

.energy-panel-head > span,
.energy-panel-head > strong {
  color: #177ddc;
  font-size: 13px;
  white-space: nowrap;
}

.energy-panel-head.compact {
  margin-bottom: 8px;
}

.energy-alarm-list {
  margin: 16px;
}

.energy-sub-head {
  padding: 12px 16px 0;
}
.energy-sub-head h3 { margin: 0; }

.energy-chart {
  background:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    #fbfdff;
  background-size: 100% 55px, 72px 100%, 100% 100%;
  border-radius: 8px;
  padding: 20px 16px 12px;
}

.energy-bar-chart {
  align-items: flex-end;
  display: flex;
  gap: 12px;
  height: 272px;
  justify-content: space-between;
}

.energy-bar-col {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  justify-content: flex-end;
  min-width: 42px;
}

.energy-bar-total {
  color: #64748b;
  font-size: 11px;
  line-height: 1;
}

.energy-bar {
  border-radius: 8px 8px 3px 3px;
  box-shadow: 0 12px 24px rgba(76, 201, 240, 0.16);
  min-height: 12px;
  width: 100%;
}

.energy-bar-stacked {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  max-width: 72px;
  overflow: hidden;
}

.energy-bar-seg {
  min-height: 4px;
  width: 100%;
}

.energy-bar-seg.electric { background: linear-gradient(180deg, #7df9ff, #3288ff); }
.energy-bar-seg.gas { background: linear-gradient(180deg, #9fffc6, #25b976); }
.energy-bar-seg.water { background: linear-gradient(180deg, #ffe599, #f3b541); }

.energy-bar-label {
  color: #64748b;
  font-size: 11px;
  white-space: nowrap;
}

.energy-legend {
  display: flex;
  gap: 18px;
  justify-content: center;
  padding: 14px 0 0;
}

.energy-legend span {
  align-items: center;
  color: #475569;
  display: flex;
  font-size: 13px;
  gap: 6px;
}

.energy-legend i,
.energy-breakdown-list i {
  border-radius: 3px;
  display: inline-block;
  height: 10px;
  width: 10px;
}

.energy-line-card {
  background: #fff;
  color: var(--aw-fg-1);
}

.energy-line-chart {
  background:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    #fbfdff;
  background-size: 100% 45px, 100% 100%;
  border-radius: 8px;
  display: block;
  height: 180px;
  width: 100%;
}

.energy-line-axis {
  color: #64748b;
  display: flex;
  font-size: 11px;
  justify-content: space-between;
  padding-top: 4px;
}

.energy-structure-body {
  align-items: center;
  display: grid;
  gap: 18px;
  grid-template-columns: 160px minmax(0, 1fr);
}

.energy-donut {
  align-items: center;
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  position: relative;
}

.energy-donut::after {
  background: #fff;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(220, 228, 238, 0.9);
  content: '';
  inset: 22px;
  position: absolute;
}

.energy-donut > div {
  display: grid;
  gap: 4px;
  position: relative;
  text-align: center;
  z-index: 1;
}

.energy-donut strong {
  color: #172033;
  font-size: 22px;
  line-height: 1;
}

.energy-donut span {
  color: #64748b;
  font-size: 12px;
}

.energy-breakdown-list {
  display: grid;
  gap: 10px;
}

.energy-breakdown-list > div {
  align-items: center;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 8px;
  display: grid;
  gap: 4px 10px;
  grid-template-columns: 1fr auto;
  padding: 10px 12px;
}

.energy-breakdown-list span {
  align-items: center;
  color: #334155;
  display: flex;
  font-size: 13px;
  gap: 7px;
}

.energy-breakdown-list strong {
  color: #172033;
  font-size: 16px;
}

.energy-breakdown-list small {
  color: #64748b;
  font-size: 12px;
  grid-column: 1 / -1;
}

@media (max-width: 1280px) {
  .energy-metric-grid,
  .energy-action-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .energy-analysis-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .energy-analysis-page,
  .energy-action-page {
    padding: 10px;
  }

  .energy-metric-grid,
  .energy-action-metrics,
  .energy-action-form-grid,
  .energy-action-section-grid,
  .energy-structure-body {
    grid-template-columns: 1fr;
  }

  .energy-action-head {
    align-items: flex-start;
    display: grid;
  }

  .energy-bar-chart {
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .energy-bar-col {
    flex: 0 0 48px;
  }

  .energy-donut {
    justify-self: center;
    width: 168px;
  }
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
