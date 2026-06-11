import type { ListQuery, PageResult } from '@/app/api/shared/types';
import { request } from '@/app/request/http';
import type { HrActionResult, HrModuleConfig, HrPickerData, HrRecord, HrResource, HrSettings } from './types';
import attendance from '@/mock/hr/attendance.json';
import archives from '@/mock/hr/archives.json';
import employees from '@/mock/hr/employees.json';
import office from '@/mock/hr/office.json';
import orgs from '@/mock/hr/orgs.json';
import payroll from '@/mock/hr/payroll.json';
import payrollStructure from '@/mock/hr/payroll-structure.json';
import positions from '@/mock/hr/positions.json';
import schedules from '@/mock/hr/schedules.json';
import settings from '@/mock/hr/settings.json';
import { hrCodeCandidates } from '@/views/hr/hrResource.config';
import type { HrPayrollScheme } from './types';

type HrMode = 'mock' | 'remote';

const mockMap: Record<HrResource, HrRecord[]> = {
  'hr-employees': (employees as HrRecord[]).map((item) => ({ ...item })),
  'hr-orgs': (orgs as HrRecord[]).map((item) => ({ ...item })),
  'hr-positions': (positions as HrRecord[]).map((item) => ({ ...item })),
  'hr-attendance': (attendance as HrRecord[]).map((item) => ({ ...item })),
  'hr-schedules': (schedules as HrRecord[]).map((item) => ({ ...item })),
  'hr-payroll': (payroll as HrRecord[]).map((item) => ({ ...item })),
  'hr-archives': (archives as HrRecord[]).map((item) => ({ ...item })),
  'hr-office': (office as HrRecord[]).map((item) => ({ ...item })),
};

let payrollStructureState: HrPayrollScheme[] = structuredClone(payrollStructure as HrPayrollScheme[]);

const actionLogs: Record<HrResource, HrActionResult[]> = {
  'hr-employees': [],
  'hr-orgs': [],
  'hr-positions': [],
  'hr-attendance': [],
  'hr-schedules': [],
  'hr-payroll': [],
  'hr-archives': [],
  'hr-office': [],
};

function toPageResult<T extends Record<string, unknown>>(items: T[], query: ListQuery = {}): PageResult<T> {
  const pageNo = query.pageNo ?? 1;
  const pageSize = query.pageSize ?? 20;
  const keyword = query.keyword?.trim().toLowerCase();
  const status = query.status?.trim();
  const filtered = items.filter((item) => {
    const keywordMatched = !keyword || JSON.stringify(item).toLowerCase().includes(keyword);
    const statusMatched = !status || item.status === status;
    return keywordMatched && statusMatched;
  });
  const start = (pageNo - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page: {
      pageNo,
      pageSize,
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    },
  };
}

export function listHrRecords(resource: HrResource, query?: ListQuery, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(mockMap[resource], query));
  return request<PageResult<HrRecord>>({ url: `/api/v1/${resource}`, method: 'GET', params: query });
}

export function getHrRecord(resource: HrResource, id: string, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve({ ...(mockMap[resource].find((item) => item.id === id || item.code === id) ?? mockMap[resource][0]) });
  return request<HrRecord>({ url: `/api/v1/${resource}/${id}`, method: 'GET' });
}

export function createHrRecord(resource: HrResource, data: Record<string, unknown>, mode: HrMode = 'mock') {
  if (mode === 'mock') {
    const next = {
      ...data,
      id: String(data.id || `${resource}_${Date.now()}`),
      code: String(data.code || `HR-${Date.now()}`),
      subject: String(data.subject || '未命名人力记录'),
      party: String(data.party || ''),
      amount: String(data.amount || ''),
      done: String(data.done || ''),
      left: String(data.left || ''),
      date: String(data.date || '2026-05-30'),
      status: String(data.status || '草稿'),
      group: String(data.group || ''),
      owner: String(data.owner || '王人事'),
    };
    mockMap[resource].unshift(next);
    appendActionLog(resource, next.id, 'create', next.status, '新增记录已写入 HR mock adapter');
    return Promise.resolve(next);
  }
  return request<HrRecord>({ url: `/api/v1/${resource}`, method: 'POST', data });
}

export function updateHrRecord(resource: HrResource, id: string, data: Record<string, unknown>, mode: HrMode = 'mock') {
  if (mode === 'mock') {
    const record = findRecord(resource, id) || mockMap[resource][0];
    Object.assign(record, data);
    appendActionLog(resource, record.id || id, 'update', String(record.status || data.status || ''), '记录已更新');
    return Promise.resolve({ ...record });
  }
  return request<HrRecord>({ url: `/api/v1/${resource}/${id}`, method: 'PATCH', data });
}

export function submitHrRecord(resource: HrResource, id: string, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(updateMockStatus(resource, id, 'submit', '审批中', '已提交审批'));
  return request<HrActionResult>({ url: `/api/v1/${resource}/${id}/submit`, method: 'POST' });
}

export function approveHrRecord(resource: HrResource, id: string, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(updateMockStatus(resource, id, 'approve', approvedStatus(resource), '审批已通过并回写状态'));
  return request<HrActionResult>({ url: `/api/v1/${resource}/${id}/approve`, method: 'POST' });
}

export function disableHrRecord(resource: HrResource, id: string, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(updateMockStatus(resource, id, 'disable', disabledStatus(resource), '记录已停用'));
  return request<HrActionResult>({ url: `/api/v1/${resource}/${id}/disable`, method: 'POST' });
}

export function printHrRecord(resource: HrResource, id: string, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(appendActionLog(resource, id, 'print', undefined, '打印任务已生成'));
  return request<HrActionResult>({ url: `/api/v1/${resource}/${id}/print`, method: 'POST' });
}

export function exportHrRecord(resource: HrResource, id: string, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(appendActionLog(resource, id, 'export', undefined, '导出任务已生成'));
  return request<HrActionResult>({ url: `/api/v1/${resource}/${id}/export`, method: 'POST' });
}

export function batchHrAction(resource: HrResource, ids: string[], action: 'submit' | 'approve' | 'disable' | 'export', mode: HrMode = 'mock') {
  if (mode === 'mock') {
    const results = ids.map((id) => {
      if (action === 'submit') return updateMockStatus(resource, id, 'batch-submit', '审批中', '批量提交审批');
      if (action === 'approve') return updateMockStatus(resource, id, 'batch-approve', approvedStatus(resource), '批量审批通过');
      if (action === 'disable') return updateMockStatus(resource, id, 'batch-disable', disabledStatus(resource), '批量停用');
      return appendActionLog(resource, id, 'batch-export', undefined, '批量导出');
    });
    return Promise.resolve(results);
  }
  return request({ url: `/api/v1/${resource}/batch/${action}`, method: 'POST', data: { ids } });
}

export function listHrActionLogs(resource: HrResource, id?: string) {
  const logs = id ? actionLogs[resource].filter((item) => item.id === id) : actionLogs[resource];
  return Promise.resolve(logs.map((item) => ({ ...item })));
}

export function getHrSettings(config: HrModuleConfig, mode: HrMode = 'mock') {
  if (mode === 'mock') {
    const scopes = ['基础信息', config.title, '明细信息', '附件记录', '审批记录'];
    const fields = config.formFields.map((field, index) => ({
      id: `${config.resource}_field_${index + 1}`,
      name: field,
      code: `field_${index + 1}`,
      type: /日期|时间|月份/.test(field) ? '日期' : /人数|工资|金额|编制|排序/.test(field) ? '数字' : /附件/.test(field) ? '附件' : '文本',
      scope: scopes[index % scopes.length],
      required: index < 3,
      enabled: true,
      placeholder: `请输入${field}`,
      defaultValue: '',
      permissions: [],
    }));
      const settingsData: HrSettings = {
        resource: config.resource,
        categories: buildHrCategories(config),
        fields,
      numberRule: {
        prefix: config.resource.replace('hr-', '').slice(0, 3).toUpperCase(),
        separator: '-',
        selected: ['date', 'serial4'],
        candidates: hrCodeCandidates,
      },
      approvals: [
        {
          id: `${config.resource}_approval_1`,
          name: `${config.title}默认审批流程`,
          category: config.title,
          nodes: [
            { name: '部门负责人审批', approvers: ['张园'], method: '依次审批' },
            { name: '人力中心复核', approvers: ['王人事'], method: '或签' },
          ],
          owner: '王人事',
          updatedAt: '2026-05-30 10:00',
          enabled: true,
        },
      ],
      strategies: [
        {
          key: 'base',
          label: '基础策略',
          rows: [
            { key: 'approval', title: `${config.title}提交后触发审批`, sub: '用于新增、编辑、停用和关键字段变更', type: 'select', value: `${config.title}默认审批流程`, options: [`${config.title}默认审批流程`] },
            { key: 'audit-log', title: '保留操作记录', sub: '关键动作写入操作记录，便于后续审计', enabled: true },
          ],
        },
        {
          key: 'integration',
          label: '协同策略',
          rows: [
            { key: 'org-position', title: '组织/岗位一致性校验', sub: '员工、组织、岗位、考勤、薪酬之间保持基础数据一致', enabled: true },
            { key: 'payroll-sync', title: '考勤薪酬联动', sub: '考勤确认后允许薪酬核算读取结果', enabled: config.resource === 'hr-attendance' || config.resource === 'hr-payroll' },
          ],
        },
      ],
      printTemplates: [
        { id: `${config.resource}_print_1`, name: `${config.title}标准打印模板`, scene: '详情打印', size: 'A4', owner: '王人事', updatedAt: '2026-05-30', enabled: true },
        { id: `${config.resource}_print_2`, name: `${config.title}审批打印模板`, scene: '审批归档', size: 'A4', owner: '王人事', updatedAt: '2026-05-30', enabled: true },
      ],
    };
    return Promise.resolve(settingsData);
  }
  return request<HrSettings>({ url: `/api/v1/${config.resource}/settings`, method: 'GET' });
}

function buildHrCategories(config: HrModuleConfig) {
  if (config.resource === 'hr-orgs') {
    return [
      { id: 'org_cat_1', name: '经营组织', parent: '无', code: 'ORG_CAT_BUSINESS', remark: '承载销售、采购、仓储等经营单元。', count: 5, enabled: true },
      { id: 'org_cat_2', name: '职能组织', parent: '无', code: 'ORG_CAT_FUNCTION', remark: '承载财务、人事、行政等职能部门。', count: 4, enabled: true },
      { id: 'org_cat_3', name: '项目组织', parent: '无', code: 'ORG_CAT_PROJECT', remark: '承载跨部门项目组和专项组织。', count: 3, enabled: true },
      { id: 'org_cat_4', name: '销售中心', parent: '经营组织', code: 'ORG_CAT_BUSINESS_SALES', remark: '面向客户、订单和区域销售管理。', count: 2, enabled: true },
      { id: 'org_cat_5', name: '供应链中心', parent: '经营组织', code: 'ORG_CAT_BUSINESS_SUPPLY', remark: '采购、仓储、物流协同组织。', count: 3, enabled: true },
      { id: 'org_cat_6', name: '财务中心', parent: '职能组织', code: 'ORG_CAT_FUNCTION_FIN', remark: '财务核算、资金和税务组织。', count: 1, enabled: true },
      { id: 'org_cat_7', name: '人力行政', parent: '职能组织', code: 'ORG_CAT_FUNCTION_HR', remark: '人力资源、行政与制度管理。', count: 2, enabled: true },
      { id: 'org_cat_8', name: '研发项目组', parent: '项目组织', code: 'ORG_CAT_PROJECT_RD', remark: '研发专项和产品化协同组织。', count: 2, enabled: true },
    ];
  }
  const roots = config.groups.slice(0, 3).map((name, index) => ({
    id: `${config.resource}_cat_root_${index + 1}`,
    name,
    parent: '无',
    code: `${config.resource.replace('hr-', '').toUpperCase()}_CAT_${index + 1}`,
    remark: `${config.title}默认一级分类`,
    count: index + 1,
    enabled: true,
  }));
  return roots.flatMap((root, index) => [
    root,
    {
      id: `${config.resource}_cat_child_${index + 1}`,
      name: `${root.name}子类`,
      parent: root.name,
      code: `${root.code}_CHILD`,
      remark: `${config.title}默认二级分类`,
      count: index + 1,
      enabled: true,
    },
  ]);
}

export function saveHrSettings(config: HrModuleConfig, data: HrSettings, mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(data);
  return request<HrSettings>({ url: `/api/v1/${config.resource}/settings`, method: 'PATCH', data });
}

export function getHrPickerData(): HrPickerData {
  return settings as HrPickerData;
}

export function getHrPayrollStructure(mode: HrMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(structuredClone(payrollStructureState));
  return request<HrPayrollScheme[]>({ url: '/api/v1/hr-payroll/structure', method: 'GET' });
}

export function saveHrPayrollStructure(data: HrPayrollScheme[], mode: HrMode = 'mock') {
  if (mode === 'mock') {
    payrollStructureState = structuredClone(data);
    return Promise.resolve(structuredClone(payrollStructureState));
  }
  return request<HrPayrollScheme[]>({ url: '/api/v1/hr-payroll/structure', method: 'PATCH', data });
}

function findRecord(resource: HrResource, id: string) {
  return mockMap[resource].find((item) => item.id === id || item.code === id) || mockMap[resource][0];
}

function updateMockStatus(resource: HrResource, id: string, action: string, status: string, message: string): HrActionResult {
  const record = findRecord(resource, id);
  if (record) record.status = status;
  return appendActionLog(resource, record?.id || id, action, status, message);
}

function appendActionLog(resource: HrResource, id: string, action: string, status: string | undefined, message: string): HrActionResult {
  const result: HrActionResult = {
    id,
    resource,
    action,
    status,
    operatedAt: '2026-05-30 10:00',
    message,
  };
  actionLogs[resource].unshift(result);
  return result;
}

function approvedStatus(resource: HrResource) {
  if (resource === 'hr-employees') return '在职';
  if (resource === 'hr-attendance') return '已处理';
  if (resource === 'hr-schedules') return '已发布';
  if (resource === 'hr-payroll') return '已发放';
  if (resource === 'hr-archives') return '已归档';
  if (resource === 'hr-office') return '已通过';
  return '启用';
}

function disabledStatus(resource: HrResource) {
  if (resource === 'hr-employees') return '离职';
  if (resource === 'hr-attendance') return '已归档';
  if (resource === 'hr-archives') return '已过期';
  if (resource === 'hr-office') return '驳回';
  return '停用';
}
