export interface FormAction {
  key: string;
  label: string;
  primary?: boolean;
}

export interface SourcePickerCategory {
  key: string;
  label: string;
  icon?: string;
}

export interface SourcePickerRow {
  cat: string;
  code: string;
  subject: string;
  date: string;
  customer: string;
  maxQty?: string | number;
  sourceDelivery?: string;
  sourceDetail?: string;
  maxRefund?: string;
}

export type SourcePickerMetricField = 'maxQty' | 'maxRefund';

export interface SourcePickerTableText {
  code: string;
  subject: string;
  customer: string;
  date: string;
  metric: string;
  emptyNoRows: string;
  emptyWithoutCustomer: string;
}

export interface SourcePickerBatchText {
  title: string;
  no: string;
  date: string;
  warehouse: string;
  logistics: string;
  qty: string;
  amount: string;
  empty: string;
  note: string;
}

export interface SourcePickerBatch {
  sourceCode?: string;
  sourceType?: string;
  deliveryNo: string;
  detailNo: string;
  deliveryDate: string;
  warehouse: string;
  logistics: string;
  qty: number | string;
  amount?: string;
  status: string;
  children?: SourcePickerBatch[];
}

export interface SourcePickerConfirmPayload extends SourcePickerRow {
  sourceDelivery?: string;
  sourceDetail?: string;
  deliveryDate?: string;
  deliveryStatus?: string;
  deliveryWarehouse?: string;
  deliveryLogistics?: string;
  maxQty?: string | number;
  maxRefund?: string;
  selectedBatches?: SourcePickerBatch[];
  selectedSources?: SourcePickerRow[];
}

export interface CategoryPickerChild {
  key: string;
  label: string;
  code?: string;
  desc?: string;
  count?: number;
  stock?: number | string;
  available?: number | string;
  status?: string;
  children?: CategoryPickerChild[];
}

export interface CategoryPickerGroup {
  key: string;
  label: string;
  icon?: string;
  count?: number;
  children: CategoryPickerChild[];
}

export interface CategoryPickerConfirmPayload {
  parent: CategoryPickerGroup;
  child: CategoryPickerChild;
  area?: CategoryPickerChild;
}

export interface EditableColumn {
  key: string;
  title: string;
  width?: number;
  type?: 'text' | 'switch';
}

export interface AttachmentRow {
  id: string | number;
  name: string;
  type: string;
  date: string;
  remark?: string;
}

export interface PaymentTermItem {
  key: string;
  label: string;
  value: string;
  placeholder?: string;
  tip?: string;
}
