import type { AttachmentRow } from '@/components/form-page/types';
import type { CodeRuleCandidate, FieldSettingRow, StrategyTab } from '@/components/setting-page/types';

export type EnergyModule = 'monitor' | 'analysis' | 'reports' | 'saving' | 'carbon' | 'product' | 'department' | 'energyData' | 'equipment';
export type EnergyTone = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

/** 能耗监测 - 采集点 */
export interface EnergyMonitorPoint {
  id: string;
  code: string;
  name: string;
  category: string;
  deviceId: string;
  deviceName: string;
  location: string;
  meterType: string;
  unit: string;
  currentValue: number;
  todayTotal: number;
  monthTotal: number;
  status: string;
  lastReadingAt: string;
  alarmThreshold: number;
  remark?: string;
}

/** 能耗监测 - 异常告警 */
export interface EnergyAlarm {
  id: string;
  pointId: string;
  pointName: string;
  alarmType: string;
  alarmLevel: string;
  message: string;
  currentValue: number;
  threshold: number;
  occuredAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  status: string;
}

/** 能耗记录 */
export interface EnergyRecord {
  id: string;
  pointId: string;
  pointName: string;
  category: string;
  value: number;
  unit: string;
  recordedAt: string;
  cost?: number;
  carbonEmission?: number;
}

/** 能耗分析 - 分析维度 */
export interface EnergyAnalysis {
  id: string;
  dimension: string;
  period: string;
  startDate: string;
  endDate: string;
  total: number;
  unit: string;
  cost: number;
  trend: Array<{ date: string; value: number; cost: number }>;
  comparison?: Array<{ name: string; value: number; ratio: number }>;
  breakdown?: Array<{ category: string; value: number; ratio: number }>;
}

/** 能耗报表 */
export interface EnergyReport {
  id: string;
  title: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  totalConsumption: number;
  totalCost: number;
  carbonEmission: number;
  unit: string;
  status: string;
  createdBy: string;
  createdAt: string;
  sections?: EnergyReportSection[];
}

export interface EnergyReportSection {
  title: string;
  items: Array<{ label: string; value: number; unit: string }>;
}

/** 节能措施 */
export interface EnergySavingPlan {
  id: string;
  code: string;
  title: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  investment: number;
  savingAmount: number;
  paybackPeriod: number;
  startDate: string;
  endDate: string;
  responsibleDept: string;
  responsiblePerson: string;
  status: string;
  effect: string;
  executionSteps: Array<{ step: string; done: boolean; date?: string }>;
  attachments?: AttachmentRow[];
  remark?: string;
}

/** 碳排放 */
export interface EnergyCarbon {
  id: string;
  year: string;
  month: string;
  totalEmission: number;
  scope1: number;
  scope2: number;
  unit: string;
  reductionTarget: number;
  actualReduction: number;
  status: string;
  details?: Array<{ source: string; emission: number; ratio: number }>;
  offsetMeasures?: Array<{ measure: string; amount: number; date: string }>;
}


/** 产品能耗 */
export interface EnergyProduct {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  totalConsumption: number;
  electricConsumption: number;
  gasConsumption: number;
  unit: string;
  cost: number;
  carbonEmission: number;
  period: string;
  ratio: number;
  trend: 'up' | 'down' | 'stable';
}

/** 部门能耗 */
export interface EnergyDepartment {
  id: string;
  deptName: string;
  deptCode: string;
  totalConsumption: number;
  electric: number;
  gas: number;
  water: number;
  unit: string;
  cost: number;
  lastMonthConsumption: number;
  changeRate: number;
  carbonEmission: number;
  period: string;
}

/** 能耗数据原始记录 */
export interface EnergyDataRecord {
  id: string;
  pointId: string;
  pointName: string;
  category: string;
  recordedAt: string;
  value: number;
  unit: string;
  cost: number;
  carbonEmission: number;
  meterReading: number;
  source: string;
  status: string;
  remark?: string;
}

/** 用能设备 */
export interface EnergyEquipment {
  id: string;
  code: string;
  name: string;
  category: string;
  power: number;
  unit: string;
  location: string;
  dept: string;
  status: string;
  runHours: number;
  todayConsumption: number;
  monthConsumption: number;
  lastMaintenanceAt: string;
  remark?: string;
}

/** 能耗中心设置 */
export interface EnergySettings {
  collectionPoints: Array<{ id: string; name: string; code: string; meterType: string; location: string; unit: string; status: string }>;
  alarmThresholds: Array<{ id: string; pointId: string; pointName: string; maxValue: number; minValue: number; unit: string; enabled: boolean }>;
  analysisDimensions: Array<{ id: string; name: string; key: string; enabled: boolean }>;
  carbonFactors: Array<{ id: string; energyType: string; factor: number; unit: string; effectiveDate: string }>;
  areas: Array<{ id: string; name: string; code: string; location: string; manager: string; description: string; status: string }>;
}

/** 工作台摘要 */
export interface EnergyWorkbenchSummary {
  cards: Array<{ key: string; label: string; value: number; unit?: string; tone?: EnergyTone }>;
  realtimeAlerts: EnergyAlarm[];
  todayEnergy: Array<{ hour: string; value: number }>;
  todos: Array<{ id: string; type: string; title: string; sourceCode: string; priority: string; status: string; route: string }>;
}

/** 分页结果 */
export interface EnergyPageResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

