export type SalesResourceKey = 'customers' | 'sales-plans' | 'sales-quotes' | 'sales-contracts' | 'sales-orders';

export interface SalesColumn {
  key: string;
  title: string;
  width?: number;
  numeric?: boolean;
  link?: boolean;
  status?: boolean;
}

export interface SalesResourceConfig {
  key: SalesResourceKey;
  title: string;
  createLabel: string;
  searchPlaceholder: string;
  rowKey: string;
  primaryKey: string;
  statusKey?: string;
  columns: SalesColumn[];
  formFields: Array<{
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required?: boolean;
    options?: string[];
  }>;
}

export interface SalesRecord {
  id: string;
  [key: string]: string | number | undefined;
}
