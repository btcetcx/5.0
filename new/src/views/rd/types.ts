export type RdResourceKey = 'projects' | 'boms' | 'processes';

export interface RdColumn {
  key: string;
  title: string;
  width?: number;
  numeric?: boolean;
  link?: boolean;
  status?: boolean;
}

export interface RdFormField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];
}

export interface RdResourceConfig {
  key: RdResourceKey;
  title: string;
  createLabel: string;
  searchPlaceholder: string;
  primaryKey: string;
  statusKey?: string;
  columns: RdColumn[];
  formFields: RdFormField[];
}

export interface RdRecord {
  id: string;
  [key: string]: unknown;
}
