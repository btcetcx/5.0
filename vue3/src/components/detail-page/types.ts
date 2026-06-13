export interface DetailAction {
  key: string;
  label: string;
  danger?: boolean;
  primary?: boolean;
}

export interface DetailMetaItem {
  label: string;
  value: string;
}

export interface DetailTabItem {
  key: string;
  label: string;
}

export interface DetailFieldItem {
  label: string;
  value: string;
}

export interface DetailMetricItem {
  label: string;
  value: number | string;
}

export type AuditActionKey = 'approve' | 'reject' | 'return' | 'transfer' | 'countersign' | 'confirm' | 'close';

export interface AuditActionOption {
  key: AuditActionKey | string;
  label: string;
  tone?: 'primary' | 'danger' | 'warning' | 'normal';
  requireOpinion?: boolean;
  placeholder?: string;
}

export interface AuditDocumentSummary {
  title: string;
  code: string;
  status?: string;
  applicant?: string;
  flowName?: string;
  currentNode?: string;
}

export type AuditApprovalNodeState = 'done' | 'current' | 'pending' | 'rejected';

export interface AuditApprovalNode {
  name: string;
  approver: string;
  method: string;
  state: AuditApprovalNodeState;
  result?: string;
  time?: string;
  opinion?: string;
}

export interface AuditActionPayload {
  action: string;
  opinion: string;
  transferTo?: string;
  ccTo?: string;
}

export interface AfterSalesOpinionMethod {
  method: string;
  name: string;
  scene: string;
  linkage: string;
}

export interface AfterSalesOpinionDocument {
  type: string;
  code?: string;
  ownerName?: string;
  status?: string;
}

export interface AfterSalesOpinionPayload {
  method: string;
  opinion: string;
  documents: AfterSalesOpinionDocument[];
}
