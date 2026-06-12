import monitorSeed from '@/mock/energy/monitor.json';
import analysisSeed from '@/mock/energy/analysis.json';
import reportsSeed from '@/mock/energy/reports.json';
import savingSeed from '@/mock/energy/saving.json';
import carbonSeed from '@/mock/energy/carbon.json';
import settingsSeed from '@/mock/energy/settings.json';
import productSeed from '@/mock/energy/product.json';
import departmentSeed from '@/mock/energy/department.json';
import dataSeed from '@/mock/energy/data.json';
import equipmentSeed from '@/mock/energy/equipment.json';
import type {
  EnergyModule,
  EnergyTone,
  EnergyMonitorPoint,
  EnergyAlarm,
  EnergyAnalysis,
  EnergyReport,
  EnergySavingPlan,
  EnergyCarbon,
  EnergySettings,
  EnergyWorkbenchSummary,
  EnergyProduct,
  EnergyDepartment,
  EnergyDataRecord,
  EnergyEquipment,
  EnergyPageResult,
} from './types';

const monitorPoints = cloneSeed<EnergyMonitorPoint[]>(monitorSeed);
const analysisData: any = cloneSeed(analysisSeed);
const reports = cloneSeed<EnergyReport[]>(reportsSeed);
const savingPlans = cloneSeed<EnergySavingPlan[]>(savingSeed);
const carbonRecords = cloneSeed<EnergyCarbon[]>(carbonSeed);
const settings = cloneSeed<EnergySettings>(settingsSeed);
const products = cloneSeed<EnergyProduct[]>(productSeed);
const departments = cloneSeed<EnergyDepartment[]>(departmentSeed);
const dataRecords = cloneSeed<EnergyDataRecord[]>(dataSeed);
const equipmentItems = cloneSeed<EnergyEquipment[]>(equipmentSeed);

export const monitorStatusOptions = ['正常', '告警', '离线'];
export const alarmLevelOptions = ['紧急', '重要', '一般'];
export const savingStatusOptions = ['规划中', '执行中', '已完成', '已延期'];
export const savingCategoryOptions = ['设备改造', '照明节能', '新能源', '管理优化', '工艺改进'];
export const carbonStatusOptions = ['达标', '未达标', '待核算'];
export const reportStatusOptions = ['已生成', '生成中', '待生成'];

function cloneSeed<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function today() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function nowText() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }).replace('T', ' ');
}

function toPage<T extends object>(rows: T[]): EnergyPageResult<T> {
  return { rows: rows.map((item) => ({ ...(item as Record<string, unknown>) })) as T[], total: rows.length, page: 1, pageSize: rows.length };
}

function filterByKeyword<T extends Record<string, unknown>>(rows: T[], keyword = '') {
  const key = keyword.trim().toLowerCase();
  if (!key) return rows;
  return rows.filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(key)));
}

export function toneByStatus(status = ''): EnergyTone {
  if (['正常', '在线', '运行中', '已完成', '达标'].includes(status)) return 'green';
  if (['告警', '待处理', '执行中', '生成中', '待生成'].includes(status)) return 'yellow';
  if (['未达标', '离线', '紧急', '已延期'].includes(status)) return 'red';
  if (['已关闭', '已取消'].includes(status)) return 'gray';
  return 'blue';
}

/* ========== 监测 ========== */
export function listMonitorPoints(query: { keyword?: string } = {}) {
  // Simulate real-time updates
  monitorPoints.forEach((p) => {
    const delta = (Math.random() - 0.5) * 10;
    p.currentValue = Math.max(0, Math.round((p.currentValue + delta) * 10) / 10);
    p.todayTotal = Math.round((p.todayTotal + Math.abs(delta)) * 10) / 10;
  });
  return Promise.resolve(toPage(filterByKeyword(monitorPoints as any, query.keyword)));
}

export function getMonitorPoint(id: string) {
  return Promise.resolve(monitorPoints.find((p) => p.id === id) || monitorPoints[0]);
}

export function confirmAlarm(id: string, confirmedBy: string) {
  const alarm = alarms.find((a) => a.id === id);
  if (alarm) {
    alarm.status = '已确认';
    alarm.confirmedBy = confirmedBy;
    alarm.confirmedAt = nowText();
  }
  return Promise.resolve(alarm);
}

/* Fake alarms */
const alarms: EnergyAlarm[] = [
  { id: 'alm001', pointId: 'mp007', pointName: '中央空调总机', alarmType: '超限告警', alarmLevel: '重要', message: '中央空调总机当前功率 1520kW，超阈值 1500kW', currentValue: 1520, threshold: 1500, occuredAt: '2026-06-11 10:15:00', status: '待确认' },
  { id: 'alm002', pointId: 'mp001', pointName: '总配电柜-进线', alarmType: '波动告警', alarmLevel: '一般', message: '总配电柜电流波动超过 10%', currentValue: 2850, threshold: 3000, occuredAt: '2026-06-11 09:45:00', status: '已确认', confirmedBy: '陈工', confirmedAt: '2026-06-11 10:00:00' },
  { id: 'alm003', pointId: 'mp005', pointName: '焊接生产线', alarmType: '峰值告警', alarmLevel: '紧急', message: '焊接生产线瞬时功率达 420kW，接近峰值 450kW', currentValue: 420, threshold: 450, occuredAt: '2026-06-11 08:30:00', status: '已确认', confirmedBy: '陈工', confirmedAt: '2026-06-11 08:40:00' },
];

export function listAlarms() {
  return Promise.resolve([...alarms]);
}

/* ========== 分析 ========== */
export function getAnalysisData() {
  const ad: any = cloneSeed(analysisSeed);
  return Promise.resolve(ad);
}
/* ========== 报表 ========== */
export function listReports(query: { keyword?: string } = {}) {
  return Promise.resolve(toPage(filterByKeyword(reports as any, query.keyword)));
}

export function getReport(id: string) {
  return Promise.resolve(reports.find((r) => r.id === id) || reports[0]);
}

/* ========== 节能措施 ========== */
export function listSavingPlans(query: { keyword?: string } = {}) {
  return Promise.resolve(toPage(filterByKeyword(savingPlans as any, query.keyword)));
}

export function getSavingPlan(id: string) {
  return Promise.resolve(savingPlans.find((p) => p.id === id) || savingPlans[0]);
}

export function createSavingPlan(payload: Partial<EnergySavingPlan>) {
  const plan: EnergySavingPlan = {
    id: `sv_${Date.now()}`,
    code: `SV-${String(savingPlans.length + 1).padStart(3, '0')}`,
    title: payload.title || '新节能措施',
    category: payload.category || '设备改造',
    targetValue: payload.targetValue || 0,
    currentValue: 0,
    unit: payload.unit || 'kWh',
    investment: payload.investment || 0,
    savingAmount: 0,
    paybackPeriod: 0,
    startDate: payload.startDate || today(),
    endDate: payload.endDate || '',
    responsibleDept: payload.responsibleDept || '',
    responsiblePerson: payload.responsiblePerson || '',
    status: '规划中',
    effect: '待评估',
    executionSteps: payload.executionSteps || [],
    remark: payload.remark || '',
  };
  savingPlans.push(plan);
  return Promise.resolve(plan);
}

/* ========== 碳排放 ========== */
export function listCarbonRecords() {
  return Promise.resolve(carbonRecords.map((r) => ({ ...r })));
}

export function getCarbonRecord(id: string) {
  return Promise.resolve(carbonRecords.find((r) => r.id === id) || carbonRecords[0]);
}

/* ========== 设置 ========== */
export function getEnergySettings() {
  return Promise.resolve({ ...settings });
}

export function updateEnergySettings(patch: Partial<EnergySettings>) {
  Object.assign(settings, patch);
  return Promise.resolve({ ...settings });
}


/* ========== 产品能耗 ========== */
export function listProducts(query: { keyword?: string } = {}) {
  var items = query.keyword ? filterByKeyword(products as any, query.keyword) : [...products];
  return Promise.resolve(toPage(items as any));
}

/* ========== 部门能耗 ========== */
export function listDepartments() {
  return Promise.resolve(departments.map(function(d) { return ({ ...d }); }));
}

/* ========== 能耗数据 ========== */
export function listEnergyData(query: { keyword?: string; category?: string } = {}) {
  var items = query.keyword ? filterByKeyword(dataRecords as any, query.keyword) : [...dataRecords];
  return Promise.resolve(toPage(items as any));
}

/* ========== 用能设备 ========== */
export function listEnergyEquipment(query: { keyword?: string } = {}) {
  return Promise.resolve(toPage(filterByKeyword(equipmentItems as any, query.keyword)));
}
/* ========== 工作台 ========== */
export function getWorkbenchSummary(): Promise<EnergyWorkbenchSummary> {
  const todayTotal = monitorPoints.reduce((sum, p) => sum + p.todayTotal, 0);
  const monthTotal = monitorPoints.reduce((sum, p) => sum + p.monthTotal, 0);
  return Promise.resolve({
    cards: [
      { key: 'todayTotal', label: '今日能耗', value: Math.round(todayTotal * 10) / 10, unit: 'kWh', tone: 'green' },
      { key: 'todayCost', label: '今日电费', value: Math.round(todayTotal * 0.8), unit: '元', tone: 'yellow' },
      { key: 'monthTotal', label: '本月总能耗', value: Math.round(monthTotal), unit: 'kWh', tone: 'blue' },
      { key: 'carbonToday', label: '碳排放', value: Math.round(todayTotal * 0.536 / 1000 * 100) / 100, unit: 'tCO₂', tone: 'red' },
      { key: 'alarmCount', label: '待处理告警', value: alarms.filter((a) => a.status === '待确认').length, unit: '条', tone: alarms.some((a) => a.status === '待确认') ? 'red' : 'green' },
      { key: 'runningCount', label: '监测点数', value: monitorPoints.filter((p) => p.status === '正常').length, unit: '在线', tone: 'green' },
    ],
    realtimeAlerts: alarms.filter((a) => a.status === '待确认').slice(0, 5),
    todayEnergy: analysisData.todayEnergy,
    todos: [
      ...alarms.filter((a) => a.status === '待确认').map((a) => ({ id: a.id, type: '告警确认', title: a.pointName, sourceCode: a.message, priority: a.alarmLevel, status: '待确认', route: '/energy/monitor' })),
    ],
  });
}

/* ========== 通用 CRUD ========== */
export function listRowsForModule(module: EnergyModule, keyword = '') {
  if (module === 'monitor') return listMonitorPoints({ keyword });
  if (module === 'reports') return listReports({ keyword });
  if (module === 'saving') return listSavingPlans({ keyword });
  return Promise.resolve(toPage([]));
}

export function getRowForModule(module: EnergyModule, id: string) {
  if (module === 'monitor') return getMonitorPoint(id);
  if (module === 'reports') return getReport(id);
  if (module === 'saving') return getSavingPlan(id);
  return Promise.resolve(null);
}


