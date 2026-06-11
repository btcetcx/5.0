import type { AttachmentRow } from '@/components/form-page/types';
import type { CodeRuleCandidate, FieldSettingRow, StrategyTab } from '@/components/setting-page/types';

export type EquipmentModule = 'assets' | 'maintenance' | 'repairs' | 'inspections' | 'spares';
export type EquipmentTone = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

export interface EquipmentAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  model: string;
  manufacturer: string;
  serialNo: string;
  assetTag: string;
  workshop: string;
  line: string;
  location: string;
  ownerDept: string;
  ownerName: string;
  level: string;
  status: string;
  enabledAt: string;
  lastInspectionAt: string;
  lastMaintenanceAt: string;
  lastRepairAt: string;
  ratedPower?: string;
  maintenanceStrategy?: string;
  inspectionStrategy?: string;
  remark?: string;
  attachments?: AttachmentRow[];
}

export interface MaintenanceItem {
  id: string | number;
  itemId?: string | number;
  itemCode?: string;
  itemName: string;
  standardName?: string;
  standard: string;
  method: string;
  tools: string;
  required: string;
}

export interface MaintenanceProjectSetting {
  id: string | number;
  name: string;
  code: string;
  scope?: string;
  updatedAt: string;
  enabled: boolean;
  standards: MaintenanceItem[];
}

export interface MaintenanceExecution {
  id: string;
  code: string;
  planId: string;
  actualStartAt?: string;
  actualEndAt?: string;
  executedAt: string;
  executor: string;
  result: string;
  exception: string;
  spareParts: SpareUsage[];
  attachments?: AttachmentRow[];
}

export interface MaintenancePlan {
  id: string;
  code: string;
  name: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  maintenanceType: string;
  cycleType: string;
  cycleValue: number;
  planDate: string;
  lastDate: string;
  nextDate: string;
  warningDays: number;
  ownerName: string;
  warningStatus: string;
  status: string;
  standard: string;
  maintenanceItemIds?: Array<string | number>;
  items: MaintenanceItem[];
  executions?: MaintenanceExecution[];
  attachments?: AttachmentRow[];
  remark?: string;
}

export interface SpareUsage {
  id: string | number;
  spareId: string;
  spareCode: string;
  spareName: string;
  model: string;
  qty: number;
  stockQty: number;
  warehouse: string;
  consumedAt?: string;
}

export interface RepairOrder {
  id: string;
  code: string;
  topic: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  faultCategory: string;
  repairLevel: string;
  reporter: string;
  reportedAt: string;
  dispatcher: string;
  assignee: string;
  plannedStartAt: string;
  plannedEndAt: string;
  actualStartAt: string;
  actualEndAt: string;
  status: string;
  acceptanceStatus: string;
  previousEquipmentStatus?: string;
  impactScope?: string;
  urgency?: string;
  faultDesc?: string;
  faultReason?: string;
  actionsTaken?: string;
  result?: string;
  downtime?: string;
  actualHours?: number;
  repairCost?: number;
  acceptedBy?: string;
  acceptedAt?: string;
  acceptanceOpinion?: string;
  rejectedReason?: string;
  closedBy?: string;
  closedAt?: string;
  closeReason?: string;
  spareParts: SpareUsage[];
  attachments?: AttachmentRow[];
}

export interface InspectionItem {
  id: string | number;
  itemName: string;
  standard: string;
  recordType: string;
  upper: string;
  lower: string;
  required: string;
  measured?: string;
  result?: string;
}

export interface InspectionRecord {
  id: string;
  code: string;
  planName: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  inspectionType: string;
  inspector: string;
  inspectionAt: string;
  result: string;
  exceptionCount: number;
  status: string;
  recordType?: 'plan' | 'execution';
  planStatus?: string;
  handlingStatus?: string;
  handledAt?: string;
  standard: string;
  exceptionDesc?: string;
  repairOrderCode?: string;
  items: InspectionItem[];
  attachments?: AttachmentRow[];
}

export interface SparePart {
  id: string;
  code: string;
  name: string;
  model: string;
  category: string;
  unit: string;
  equipmentScope: string;
  stockQty: number;
  safeQty: number;
  availableQty: number;
  occupiedQty: number;
  warehouse: string;
  location: string;
  supplier: string;
  unitPrice: number;
  status: string;
  lastUsedAt: string;
  attachments?: AttachmentRow[];
  remark?: string;
}

export interface SpareRequest {
  id: string;
  code: string;
  requestType: string;
  sourceCode: string;
  spareCode?: string;
  spareName?: string;
  equipmentCode?: string;
  equipmentName: string;
  requester: string;
  qty: number;
  warehouse: string;
  purpose: string;
  status: string;
  createdAt: string;
}

export interface EquipmentSettings {
  fields: FieldSettingRow[];
  fieldScopes: Array<{ key: string; label: string; count?: number }>;
  numberCandidates: CodeRuleCandidate[];
  numberPrefix: string;
  numberSeparator: string;
  numberSelected: string[];
  categories: EquipmentSettingRow[];
  statuses: EquipmentSettingRow[];
  assetTags: EquipmentSettingRow[];
  maintenanceStandards: EquipmentSettingRow[];
  maintenanceItems: MaintenanceProjectSetting[];
  maintenanceCycles: EquipmentSettingRow[];
  maintenanceWarnings: EquipmentSettingRow[];
  faultCategories: EquipmentSettingRow[];
  repairLevels: EquipmentSettingRow[];
  inspectionStandards: EquipmentSettingRow[];
  inspectionCycles: EquipmentSettingRow[];
  safeStocks: EquipmentSettingRow[];
  spareCategories: EquipmentSettingRow[];
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
}

export interface EquipmentSettingRow {
  id: string | number;
  name: string;
  code: string;
  parent?: string;
  scope?: string;
  owner?: string;
  updatedAt: string;
  enabled: boolean;
}

export interface EquipmentPageResult<T> {
  items: T[];
  total: number;
}
