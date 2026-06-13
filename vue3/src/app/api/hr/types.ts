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

export interface HrEmergencyContact {
  id: string;
  name: string;
  mobile: string;
  relation: string;
}

export interface HrEducationExperience {
  id: string;
  period: string;
  educationLevel: string;
  schoolName: string;
  majorName: string;
  schoolType: string;
  enrollmentType: string;
  diploma: string;
  degreeCert: string;
}

export interface HrWorkExperience {
  id: string;
  period: string;
  companyName: string;
  jobDescription: string;
  workDescription: string;
}

export interface HrProjectExperience {
  id: string;
  period: string;
  projectName: string;
  projectDescription: string;
}

export interface HrPersonalSkill {
  id: string;
  skillName: string;
  skillLevel: string;
}

export interface HrPersonalHonor {
  id: string;
  honorName: string;
  obtainTime: string;
  honorDescription: string;
  certificatePhoto: string;
}

export interface HrEmployeeContract {
  id: string;
  version: string;
  contractType: string;
  startTime: string;
  endTime: string;
  attachment: string;
}

export interface HrEmployeeMaterial {
  id: string;
  name: string;
  type: string;
  date: string;
  remark?: string;
}

export interface HrEmployeeAsset {
  id: string;
  assetCode: string;
  assetName: string;
  specification: string;
  assetType: string;
  assetStatus: string;
  remark: string;
}

export interface HrEmployeeArchiveLog {
  id: string;
  action: string;
  operator: string;
  operatedAt: string;
  remark: string;
}

export interface HrEmployeeArchive {
  id: string;
  employeeId: string;
  workNo: string;
  name: string;
  sex: string;
  mobile: string;
  birthday: string;
  departmentId: string;
  departmentName: string;
  departmentIds: string[];
  postId: string;
  postName: string;
  leader: string;
  leaderName: string;
  entryTime: string;
  dayOfTrial: number;
  regularTime: string;
  leaveTime: string;
  workStatus: 0 | 1 | 2;
  workStatusText: string;
  trialSalary: number;
  salary: number;
  photo: string;
  cardType: string;
  idCard: string;
  nowAddress: string;
  bankAccountNo: string;
  bankBranch: string;
  nation: string;
  native: string;
  yearsOfWorkExperience: string;
  qualification: string;
  weichatCode: string;
  email: string;
  qqNumber: string;
  maritalStatus: string;
  personalProfile: string;
  idCardFrontImgPath: string;
  idCardReverseImgPath: string;
  emergencyContacts: HrEmergencyContact[];
  educationalBackgrounds: HrEducationExperience[];
  workExperiences: HrWorkExperience[];
  projectExperiences: HrProjectExperience[];
  personalSkills: HrPersonalSkill[];
  personalHonors: HrPersonalHonor[];
  contracts: HrEmployeeContract[];
  materials: HrEmployeeMaterial[];
  assets: HrEmployeeAsset[];
  operationLogs: HrEmployeeArchiveLog[];
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
