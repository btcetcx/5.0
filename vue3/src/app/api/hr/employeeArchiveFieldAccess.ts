export type HrEmployeeArchiveSensitiveField =
  | 'mobile'
  | 'idCard'
  | 'bankAccountNo'
  | 'nowAddress'
  | 'trialSalary'
  | 'salary'
  | 'photo'
  | 'idCardPhoto'
  | 'certificate'
  | 'contractAttachment';

export interface HrEmployeeArchiveFieldAccessContext {
  fieldPermissions?: Partial<Record<HrEmployeeArchiveSensitiveField, boolean>>;
}

export function canViewEmployeeArchiveField(
  field: HrEmployeeArchiveSensitiveField,
  context: HrEmployeeArchiveFieldAccessContext = {},
) {
  return Boolean(context.fieldPermissions?.[field]);
}

export function displayEmployeeArchiveSensitiveField(
  field: HrEmployeeArchiveSensitiveField,
  value: string | number | null | undefined,
  context: HrEmployeeArchiveFieldAccessContext = {},
) {
  const text = String(value ?? '');
  if (!text) return '-';
  if (canViewEmployeeArchiveField(field, context)) return text;
  if (field === 'mobile') return text.replace(/^(\d{3})\d{4}(\d+)/, '$1****$2');
  if (field === 'idCard') return text.replace(/^(.{6}).+(.{4})$/, '$1********$2');
  if (field === 'bankAccountNo') return text.replace(/^(.{4}).+(.{4})$/, '$1 **** **** $2');
  if (field === 'nowAddress') return text.length > 8 ? `${text.slice(0, 8)}***` : '***';
  if (field === 'trialSalary' || field === 'salary') return '***';
  return '已上传';
}
