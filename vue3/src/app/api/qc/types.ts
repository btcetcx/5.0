import type { CodeRuleCandidate, FieldSettingRow, StrategyTab } from '@/components/setting-page/types';

export type QcResource = 'qc-inspections' | 'qc-exceptions' | 'qc-standards' | 'qc-reports';
export type QcStage = 'IQC' | 'IPQC' | 'FQC' | 'OQC' | 'NCR' | 'STANDARD' | 'REPORT';
export type QcTone = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

export interface QcInspection {
  id: string;
  subject: string;
  code: string;
  source: string;
  object: string;
  qty: string;
  inspector: string;
  date: string;
  status: string;
  stage: QcStage;
  lot: string;
  plan: string;
  sampling: string;
  critical: string;
  tone?: QcTone;
  sourceType?: string;
  sourceModule?: 'warehouse' | 'production' | 'sales' | 'manual';
  writebackAction?: string;
}

export interface QcException {
  id: string;
  subject: string;
  code: string;
  source: string;
  object: string;
  qty: string;
  inspector: string;
  date: string;
  status: string;
  stage: QcStage;
  lot: string;
  plan: string;
  sampling: string;
  critical: string;
  tone?: QcTone;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  actionType: string;
  capaCode?: string;
  recheckTaskCode?: string;
  releaseCode?: string;
  closeCode?: string;
  holdCode?: string;
  mrbCode?: string;
  mrbDecision?: string;
  writebackStatus?: string;
  lastAction?: string;
  lastActionOpinion?: string;
  actionLogs?: QcExceptionActionLog[];
}

export interface QcExceptionActionLog {
  id: string;
  action: string;
  operator: string;
  time: string;
  opinion: string;
  result: string;
  relatedDoc?: string;
  transferTo?: string;
  ccTo?: string;
}

export interface QcExceptionActionPayload {
  action: string;
  opinion: string;
  transferTo?: string;
  ccTo?: string;
}

export interface QcStandardCriterion {
  id: string | number;
  name: string;
  standardType: string;
  baseUnit: string;
  baseline: string;
  standardValue: string;
  upperDeviation: string;
  lowerDeviation: string;
  standardDescription: string;
}

export interface QcStandardAttachment {
  id: string | number;
  name: string;
  type: string;
  date: string;
  remark: string;
}

export interface QcStandard {
  id: string;
  subject: string;
  code: string;
  source: string;
  object: string;
  qty: string;
  inspector: string;
  date: string;
  status: string;
  stage: QcStage;
  version?: string;
  sampling?: string;
  defect?: string;
  approval?: string;
  judgementType?: string;
  criteria?: QcStandardCriterion[];
  standardAttachments?: QcStandardAttachment[];
  standardDetail?: string;
  upper?: string;
  lower?: string;
  frequency?: string;
  leader?: string;
  auth?: string;
  shift?: string;
  groupIds?: string[];
  standardIds?: string[];
  tone?: QcTone;
}

export interface QcReport {
  id: string;
  subject: string;
  code: string;
  source: string;
  object: string;
  qty: string;
  inspector: string;
  date: string;
  status: string;
  stage: QcStage;
  passRate: string;
  defectRate: string;
  trend: string;
  tone?: QcTone;
}

export interface QcInspectionLine {
  id: string;
  item: string;
  method: string;
  valueType: string;
  standard: string;
  upper: string;
  lower: string;
  measured: string;
  defect: 'CRITICAL' | 'MAJOR' | 'MINOR';
  result: string;
  image: string;
}

export interface QcSourceRow {
  cat: string;
  code: string;
  subject: string;
  date: string;
  customer: string;
  maxQty: string | number;
}

export interface QcSourceBatch {
  deliveryNo: string;
  detailNo: string;
  deliveryDate: string;
  warehouse: string;
  logistics: string;
  qty: number | string;
  status: string;
}

export interface QcSettings {
  fields: FieldSettingRow[];
  fieldScopes: Array<{ key: string; label: string; count?: number }>;
  numberCandidates: CodeRuleCandidate[];
  numberPrefix: string;
  numberSeparator: string;
  numberSelected: string[];
  approvals: Array<{
    id: string | number;
    name: string;
    category: string;
    nodes: Array<{ name: string; approvers: string[]; method: string }>;
    creator: string;
    updatedAt: string;
    enabled: boolean;
  }>;
  strategies: StrategyTab[];
  printTemplates: Array<{
    id: string | number;
    name: string;
    scene: string;
    paper: string;
    owner: string;
    updatedAt: string;
    enabled: boolean;
  }>;
}

export interface QcPageResult<T> {
  items: T[];
  total: number;
}

export interface QcListQuery {
  keyword?: string;
  stage?: string;
  status?: string;
  category?: string;
  pageNo?: number;
  pageSize?: number;
}
