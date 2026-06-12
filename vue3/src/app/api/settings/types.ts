export type SettingsSectionKey = 'system' | 'permissions' | 'security' | 'data' | 'integrations' | 'guide';

export interface CompanyProfile {
  company: string;
  shortName: string;
  unifiedCode: string;
  industry: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  logoText: string;
}

export interface NotificationRule {
  id: string;
  channel: '站内通知' | '短信通知' | '邮件通知';
  scene: string;
  rule: string;
  receiver: string;
  enabled: boolean;
}

export interface RoleRow {
  id: string;
  name: string;
  center: string;
  users: number;
  menu: string;
  data: string;
  functionPolicy: string;
  dataPolicy: string;
  updated: string;
  enabled: boolean;
}

export interface PermissionScopeRow {
  id: string;
  role: string;
  module: string;
  menu: string;
  page: string;
  tabs: string[];
  fieldsView: string[];
  fieldsEdit: string[];
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  import: boolean;
  export: boolean;
  approve: boolean;
}

export interface DataPermissionRow {
  id: string;
  name: string;
  role: string;
  center: string;
  department: string;
  region: string;
  customerScope: string;
  projectScope: string;
  documentScope: string;
  materialScope: string;
  bomScope: string;
  enabled: boolean;
}

export interface AccountTreeNode {
  id: string;
  key: string;
  label: string;
  type: 'department' | 'account';
  accountId?: string;
  userName?: string;
  fullName?: string;
  departmentName?: string;
  postName?: string;
  mobile?: string;
  children?: AccountTreeNode[];
}

export interface PermissionTreeNode {
  id: string;
  key: string;
  label: string;
  type: 'platform' | 'menu' | 'button';
  platformId?: string;
  menuId?: string;
  buttonSign?: string;
  children?: PermissionTreeNode[];
}

export interface AccountPermissionRow {
  id: string;
  accountId: string;
  userName: string;
  fullName: string;
  departmentName: string;
  mobile: string;
  platformId: string;
  platformName: string;
  menuId: string;
  menuName: string;
  buttonKeys: string[];
  buttonNames: string[];
}

export interface SuperAdminRow {
  id: string;
  accountId: string;
  userName: string;
  name: string;
  deptAndPost: string;
}

export interface SecurityRule {
  id: string;
  type: '密码策略' | '登录限制' | '双因子认证';
  scope: string;
  detail: string;
  owner: string;
  enabled: boolean;
}

export interface AuditLogRow {
  id: string;
  time: string;
  operator: string;
  module: string;
  object: string;
  action: string;
  result: string;
  ip: string;
}

export interface DataTaskRow {
  id: string;
  type: '数据备份' | '导入任务' | '导出记录';
  scope: string;
  time: string;
  amount: string;
  status: string;
}

export interface IntegrationRow {
  id: string;
  name: string;
  type: string;
  vendor?: string;
  product?: string;
  location?: string;
  method: string;
  driver?: string;
  endpoint?: string;
  purpose?: string;
  status: string;
  lastSync: string;
  owner: string;
}

export interface ApiKeyRow {
  id: string;
  appName: string;
  appKey: string;
  modules: string;
  expireAt: string;
  enabled: boolean;
}

export interface SyncTaskRow {
  id: string;
  name: string;
  direction: string;
  object: string;
  cycle: string;
  result: string;
  status: string;
}

export interface GuideModule {
  key: string;
  name: string;
  owner: string;
  steps: string[];
  focus: string;
  doneCount: number;
}

export interface SettingsCenterData {
  system: {
    company: CompanyProfile;
    notifications: NotificationRule[];
  };
  permissions: {
    roles: RoleRow[];
    functionPermissions: PermissionScopeRow[];
    dataPermissions: DataPermissionRow[];
    accountTree: AccountTreeNode[];
    permissionTree: PermissionTreeNode[];
    accountPermissions: AccountPermissionRow[];
    superAdmins: SuperAdminRow[];
  };
  security: {
    rules: SecurityRule[];
  };
  data: {
    auditLogs: AuditLogRow[];
    tasks: DataTaskRow[];
  };
  integrations: {
    partners: IntegrationRow[];
    apiKeys: ApiKeyRow[];
    syncTasks: SyncTaskRow[];
  };
  guide: {
    modules: GuideModule[];
  };
}
