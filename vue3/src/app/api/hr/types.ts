import type {
  ApprovalNode,
  CodeRuleCandidate,
  FieldSettingRow,
  PersonPickerDept,
  StrategyTab,
  SettingTableRow,
} from '@/components/setting-page/types';

export type HrResource =
  | 'hr-employees'
  | 'hr-orgs'
  | 'hr-positions'
  | 'hr-attendance'
  | 'hr-schedules'
  | 'hr-payroll'
  | 'hr-archives'
  | 'hr-office';

export type HrModuleKey =
  | 'employees'
  | 'orgs'
  | 'positions'
  | 'attendance'
  | 'schedules'
  | 'payroll'
  | 'archives'
  | 'office';

export type HrSettingKey = 'categories' | 'fields' | 'numbers' | 'approvals' | 'strategies' | 'print';

export interface HrRecord {
  id: string;
  code: string;
  subject: string;
  party: string;
  amount: string;
  done: string;
  left: string;
  date: string;
  status: string;
  group: string;
  owner: string;
  [key: string]: unknown;
}

export interface HrActionProfile {
  title: string;
  statusLabel: string;
  statuses: string[];
  columns: string[];
  rows: string[][];
  newLabel: string;
}

export interface HrDetailTab {
  key: string;
  label: string;
}

export interface HrSettings {
  resource: HrResource;
  categories: HrCategoryRow[];
  fields: FieldSettingRow[];
  numberRule: {
    prefix: string;
    separator: string;
    selected: string[];
    candidates: CodeRuleCandidate[];
  };
  approvals: Array<{
    id: string;
    name: string;
    category: string;
    nodes: ApprovalNode[];
    owner: string;
    updatedAt: string;
    enabled: boolean;
  }>;
  strategies: StrategyTab[];
  printTemplates: Array<{
    id: string;
    name: string;
    scene: string;
    size: string;
    owner: string;
    updatedAt: string;
    enabled: boolean;
  }>;
}

export interface HrCategoryRow extends SettingTableRow {
  id: string | number;
  name: string;
  parent: string;
  code: string;
  count: number;
  remark: string;
  enabled: boolean;
}

export interface HrModuleConfig {
  key: HrModuleKey;
  resource: HrResource;
  route: string;
  title: string;
  treeTitle: string;
  groups: string[];
  newLabel: string;
  codeLabel: string;
  subjectLabel: string;
  partyLabel: string;
  amountLabel: string;
  dateLabel: string;
  statusLabel: string;
  statuses: string[];
  formFields: string[];
  listColumns: string[];
  detailColumns: string[];
  detailTabs: HrDetailTab[];
  actions: string[];
  insights: Array<{ label: string; value: string; tone: string }>;
}

export interface HrWorkbenchData {
  kpis: Array<{ tone: string; label: string; value: number; icon: string }>;
  tiles: Array<{ label: string; sub: string; count: number; tint: string; color: string; icon: string }>;
  entries: Array<{ label: string; tint: string; color: string; icon: string }>;
  notices: Array<{ type: string; text: string; time: string; tone: string }>;
  recent: Array<{ title: string; meta: string }>;
}

export interface HrPickerData {
  people: PersonPickerDept[];
}

export interface HrActionResult {
  id: string;
  resource: HrResource;
  action: string;
  status?: string;
  operatedAt: string;
  message: string;
}

export interface HrPayrollItem {
  id: string;
  schemeId: string;
  typeId: string;
  name: string;
  code: string;
  direction: string;
  calcMethod: string;
  formula: string;
  taxable: boolean;
  socialBase: boolean;
  accountingSubject: string;
  status: string;
  remark?: string;
}

export interface HrPayrollType {
  id: string;
  schemeId: string;
  name: string;
  code: string;
  direction: string;
  calcMethod: string;
  payoutTiming: string;
  owner: string;
  status: string;
  items: HrPayrollItem[];
}

export interface HrPayrollScheme {
  id: string;
  name: string;
  code: string;
  applicableScope: string;
  employeeScope: string;
  payCycle: string;
  currency: string;
  effectiveDate: string;
  owner: string;
  status: string;
  types: HrPayrollType[];
}
