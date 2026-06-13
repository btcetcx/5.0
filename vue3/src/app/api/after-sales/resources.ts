import type { ListQuery, PageResult } from '@/app/api/shared/types';
import { request } from '@/app/request/http';
import servicesSeed from '@/mock/after-sales/services.json';
import { afterSalesDictionary, afterSalesTypeHandlingMap } from './dictionaries';
import type {
  AfterSalesDictionary,
  AfterSalesLinkedDocument,
  AfterSalesQualityAction,
  AfterSalesService,
  AfterSalesStatus,
  AfterSalesTask,
  CreateAfterSalesPayload,
  HandlingMethod,
  LinkedDocumentStatus,
  LinkedDocumentType,
} from './types';

type Mode = 'mock' | 'remote';

const services = servicesSeed as AfterSalesService[];
const linkedDocuments: AfterSalesLinkedDocument[] = [
  { id: 'doc_201', serviceId: 'as_002', type: '退货入库单', code: 'RIN20260530002', status: '待入库', ownerName: '仓储一组', updatedAt: '2026-05-30 09:42', writebackLogs: ['审核通过后生成退货入库任务，等待任务池指派'] },
  { id: 'doc_202', serviceId: 'as_002', type: '换货出库单', code: 'OUT20260530002', status: '待出库', ownerName: '仓储二组', updatedAt: '2026-05-30 09:42', writebackLogs: ['审核通过后生成换货出库任务，等待任务池指派'] },
  { id: 'doc_301', serviceId: 'as_003', type: '退款付款单', code: 'PAY20260530003', status: '待审核', ownerName: '待分配', updatedAt: '2026-05-30 10:06', writebackLogs: ['审核通过后生成退款任务，等待任务池指派'] },
  { id: 'doc_302', serviceId: 'as_003', type: '发票红冲', code: 'INV-R20260530003', status: '待红冲', ownerName: '待分配', updatedAt: '2026-05-30 10:06', writebackLogs: ['审核通过后生成发票红冲任务，等待任务池指派'] },
  { id: 'doc_401', serviceId: 'as_004', type: '退货入库单', code: 'RIN20260530004', status: '已入库', ownerName: '仓储一组', updatedAt: '2026-05-29 13:00', writebackLogs: ['退货已入库，待质检'] },
  { id: 'doc_402', serviceId: 'as_004', type: '退款付款单', code: 'PAY20260530004', status: '待审核', ownerName: '财务一组', updatedAt: '2026-05-29 09:21', writebackLogs: ['创建退款处理任务'] },
  { id: 'doc_403', serviceId: 'as_004', type: '应收调整', code: 'AR-ADJ20260530004', status: '待调整', ownerName: '应收会计', updatedAt: '2026-05-29 09:22', writebackLogs: ['展示型关联单据，待后续接财务逻辑'] },
  { id: 'doc_404', serviceId: 'as_004', type: '发票红冲', code: 'INV-R20260530004', status: '待红冲', ownerName: '开票组', updatedAt: '2026-05-29 09:22', writebackLogs: ['展示型关联单据，待后续接财务逻辑'] },
  { id: 'doc_405', serviceId: 'as_004', type: '质量闭环单', code: 'QA20260530004', status: 'CAPA执行中', ownerName: '质量部', updatedAt: '2026-05-29 09:30', writebackLogs: ['售后已升级质量闭环，不阻塞结单'] },
  { id: 'doc_501', serviceId: 'as_005', type: '退货入库单', code: 'RIN20260530005', status: '待入库', ownerName: '仓储一组', updatedAt: '2026-05-28 16:00', writebackLogs: ['任务已指派，等待处理人开始'] },
  { id: 'doc_502', serviceId: 'as_005', type: '换货出库单', code: 'OUT20260530005', status: '待出库', ownerName: '仓储二组', updatedAt: '2026-05-28 16:00', writebackLogs: ['任务已指派，等待处理人开始'] },
  { id: 'doc_601', serviceId: 'as_006', type: '退货入库单', code: 'RIN20260530006', status: '已质检', ownerName: '仓储一组', updatedAt: '2026-05-29 11:00', writebackLogs: ['退货入库已质检'] },
  { id: 'doc_602', serviceId: 'as_006', type: '换货出库单', code: 'OUT20260530006', status: '已签收', ownerName: '仓储二组', updatedAt: '2026-05-29 14:00', writebackLogs: ['换货签收，售后进入待结单'] },
  { id: 'doc_701', serviceId: 'as_007', type: '服务派工单', code: 'SRV20260530007', status: '已完成', ownerName: '服务部', updatedAt: '2026-05-27 15:00', writebackLogs: ['现场服务已完成'] },
  { id: 'doc_702', serviceId: 'as_007', type: '配件出库单', code: 'SP-OUT20260530007', status: '已签收', ownerName: '仓储一组', updatedAt: '2026-05-27 16:20', writebackLogs: ['配件已签收，售后已结单'] },
  { id: 'doc_801', serviceId: 'as_008', type: '退货入库单', code: 'RIN20260530008', status: '已质检', ownerName: '仓储一组', updatedAt: '2026-05-26 16:00', writebackLogs: ['退货入库已质检'] },
  { id: 'doc_802', serviceId: 'as_008', type: '退款付款单', code: 'PAY20260530008', status: '已付款', ownerName: '财务一组', updatedAt: '2026-05-26 17:00', writebackLogs: ['退款已付款'] },
  { id: 'doc_803', serviceId: 'as_008', type: '应收调整', code: 'AR-ADJ20260530008', status: '已调整', ownerName: '应收会计', updatedAt: '2026-05-26 17:10', writebackLogs: ['应收已调整'] },
  { id: 'doc_804', serviceId: 'as_008', type: '发票红冲', code: 'INV-R20260530008', status: '已红冲', ownerName: '开票组', updatedAt: '2026-05-26 17:20', writebackLogs: ['发票已红冲'] },
  { id: 'doc_805', serviceId: 'as_008', type: '质量闭环单', code: 'QA20260530008', status: '已关闭', ownerName: '质量部', updatedAt: '2026-05-26 18:00', writebackLogs: ['质量闭环已关闭'] },
];

const qualityActions: AfterSalesQualityAction[] = [
  {
    id: 'qa_001',
    code: 'QA20260530004',
    topic: 'LED 控制板批次色差 8D 改进',
    serviceId: 'as_004',
    serviceCode: 'AS20260530004',
    customerName: '上海星河制造有限公司',
    problemType: '外观质量',
    stage: 'CAPA执行',
    eightDCode: '8D20260529001',
    capaCode: 'CAPA20260529001',
    ownerName: '林越',
    status: 'CAPA执行中',
    description: '售后已允许结单，质量改进继续追踪到验证关闭。',
    eightDReports: [
      { id: 'd1', stage: 'D1组建团队', content: '组建售后、质量、工艺联合小组', owner: '林越' },
      { id: 'd4', stage: 'D4根因分析', content: '分析批次色差与来料、工艺、运输环境关联', owner: '林越' },
    ],
    capaMeasures: [
      { id: 'capa_1', measure: '追加外观色差抽检标准', dueAt: '2026-06-05', status: 'CAPA执行中' },
      { id: 'capa_2', measure: '复核供应批次并锁定问题批次', dueAt: '2026-06-08', status: 'CAPA执行中' },
    ],
    verificationLogs: ['等待 CAPA 执行完成后进行效果验证'],
    operationLogs: ['由售后 AS20260530004 升级质量闭环', 'CAPA 措施已启动'],
  },
  {
    id: 'qa_002',
    code: 'QA20260530002',
    topic: '包装划伤问题 D1 团队组建',
    serviceId: 'as_002',
    serviceCode: 'AS20260530002',
    customerName: '苏州新城智能科技',
    problemType: '包装质量',
    stage: 'D1组建团队',
    eightDCode: '8D20260530002',
    capaCode: 'CAPA待生成',
    ownerName: '质量部',
    status: '待分析',
    description: '换货售后已触发质量闭环，当前处于团队组建和问题范围确认阶段。',
    eightDReports: [
      { id: 'd1-2', stage: 'D1组建团队', content: '确认售后、仓储、包装工程参与人员', owner: '质量部' },
    ],
    capaMeasures: [
      { id: 'capa_2_1', measure: '待根因分析后制定 CAPA 措施', dueAt: '待定', status: '待分析' },
    ],
    verificationLogs: ['暂无验证记录'],
    operationLogs: ['由售后 AS20260530002 升级质量闭环', '等待 D1 团队确认'],
  },
  {
    id: 'qa_003',
    code: 'QA20260530003',
    topic: '退款批次功能异常 D4 根因分析',
    serviceId: 'as_003',
    serviceCode: 'AS20260530003',
    customerName: '杭州云启科技',
    problemType: '功能质量',
    stage: 'D4根因分析',
    eightDCode: '8D20260530003',
    capaCode: 'CAPA待生成',
    ownerName: '林越',
    status: '待分析',
    description: '当前正在汇总返修检测、客户环境和生产批次记录，用于 D4 根因判定。',
    eightDReports: [
      { id: 'd1-3', stage: 'D1组建团队', content: '质量、研发、售后联合确认问题范围', owner: '林越' },
      { id: 'd4-3', stage: 'D4根因分析', content: '比对软件版本、烧录批次和客户现场配置', owner: '林越' },
    ],
    capaMeasures: [
      { id: 'capa_3_1', measure: '待 D4 根因确认后生成整改措施', dueAt: '待定', status: '待分析' },
    ],
    verificationLogs: ['暂无验证记录'],
    operationLogs: ['由售后 AS20260530003 升级质量闭环', 'D4 根因分析进行中'],
  },
  {
    id: 'qa_004',
    code: 'QA20260530007',
    topic: '现场服务接线松动效果验证',
    serviceId: 'as_007',
    serviceCode: 'AS20260530007',
    customerName: '成都精密仪器有限公司',
    problemType: '装配质量',
    stage: '效果验证',
    eightDCode: '8D20260530007',
    capaCode: 'CAPA20260530007',
    ownerName: '质量部',
    status: '已验证',
    description: 'CAPA 已执行完成，现场抽检和客户回访均通过，等待关闭。',
    eightDReports: [
      { id: 'd1-7', stage: 'D1组建团队', content: '组建售后、装配、质量小组', owner: '质量部' },
      { id: 'd4-7', stage: 'D4根因分析', content: '确认接线端子扭矩标准未覆盖该工位', owner: '质量部' },
    ],
    capaMeasures: [
      { id: 'capa_7_1', measure: '补充接线端子扭矩检验标准', dueAt: '2026-05-29', status: '已完成' },
    ],
    verificationLogs: ['2026-05-30 现场回访通过', '2026-05-31 抽检 20 台无复发'],
    operationLogs: ['CAPA 已完成', '效果验证通过，待关闭'],
  },
  {
    id: 'qa_005',
    code: 'QA20260530008',
    topic: '退货批次质量闭环关闭',
    serviceId: 'as_008',
    serviceCode: 'AS20260530008',
    customerName: '南京北辰科技',
    problemType: '来料质量',
    stage: '已关闭',
    eightDCode: '8D20260530008',
    capaCode: 'CAPA20260530008',
    ownerName: '质量部',
    status: '已关闭',
    description: '供应商整改和来料复检均已完成，质量闭环关闭归档。',
    eightDReports: [
      { id: 'd1-8', stage: 'D1组建团队', content: '组建质量、采购、供应商联合小组', owner: '质量部' },
      { id: 'd4-8', stage: 'D4根因分析', content: '确认供应商批次工装磨损导致尺寸波动', owner: '质量部' },
    ],
    capaMeasures: [
      { id: 'capa_8_1', measure: '供应商更换工装并提交首件报告', dueAt: '2026-05-25', status: '已完成' },
    ],
    verificationLogs: ['2026-05-26 来料复检合格', '2026-05-27 关闭评审通过'],
    operationLogs: ['供应商整改完成', '质量闭环已关闭'],
  },
];

export const afterSalesMethodDocumentMap: Record<HandlingMethod, LinkedDocumentType[]> = {
  退款退货: ['退货入库单', '退款付款单', '应收调整', '发票红冲'],
  仅退款: ['退款付款单', '发票红冲'],
  换货: ['退货入库单', '换货出库单'],
  仅退货: ['退货入库单', '应收调整'],
  维修: ['服务派工单', '配件出库单'],
  现场服务: ['服务派工单', '配件出库单'],
};

const initialStatusMap: Record<LinkedDocumentType, LinkedDocumentStatus> = {
  退货入库单: '待入库',
  换货出库单: '待出库',
  配件出库单: '待出库',
  退款付款单: '待审核',
  应收调整: '待调整',
  发票红冲: '待红冲',
  服务派工单: '待派工',
  质量闭环单: '待分析',
};

const documentPrefixMap: Record<LinkedDocumentType, string> = {
  退货入库单: 'RIN',
  换货出库单: 'OUT',
  配件出库单: 'SP-OUT',
  退款付款单: 'PAY',
  应收调整: 'AR-ADJ',
  发票红冲: 'INV-R',
  服务派工单: 'SRV',
  质量闭环单: 'QA',
};

function toPageResult<T>(items: T[], query: ListQuery = {}): PageResult<T> {
  const pageNo = query.pageNo ?? 1;
  const pageSize = query.pageSize ?? 20;
  const keyword = query.keyword?.trim().toLowerCase();
  const filtered = keyword ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(keyword)) : items;
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

function cloneService(service: AfterSalesService): AfterSalesService {
  return {
    ...service,
    lines: service.lines.map((line) => ({ ...line })),
    communicationLogs: [...service.communicationLogs],
    attachments: [...service.attachments],
    operationLogs: [...service.operationLogs],
  };
}

function cloneLinkedDocument(doc: AfterSalesLinkedDocument): AfterSalesLinkedDocument {
  return {
    ...doc,
    writebackLogs: [...doc.writebackLogs],
  };
}

function cloneQualityAction(action: AfterSalesQualityAction): AfterSalesQualityAction {
  return {
    ...action,
    eightDReports: action.eightDReports?.map((item) => ({ ...item })),
    capaMeasures: action.capaMeasures?.map((item) => ({ ...item })),
    verificationLogs: action.verificationLogs ? [...action.verificationLogs] : undefined,
    operationLogs: action.operationLogs ? [...action.operationLogs] : undefined,
  };
}

function statusName(status: AfterSalesStatus) {
  const map: Record<AfterSalesStatus, string> = {
    pendingReview: '待审核',
    assigned: '已指派',
    unassigned: '未指派',
    processing: '处理中',
    untreated: '未处理',
    pendingCloseConfirm: '待结单',
    closedConfirmed: '已结单',
    closed: '已关闭',
  };
  return map[status];
}

function documentStarted(doc: AfterSalesLinkedDocument) {
  return doc.status !== initialStatusMap[doc.type];
}

function buildTasks(): AfterSalesTask[] {
  return linkedDocuments
    .filter((doc) => doc.type !== '质量闭环单')
    .map((doc, index) => {
      const service = services.find((item) => item.id === doc.serviceId) || services[0];
      const completed = ['已质检', '已签收', '已付款', '已完成', '已调整', '已红冲'].includes(doc.status);
      const taskType = taskTypeForDocument(doc, service);
      return {
        id: `task_${doc.id}`,
        code: `AST202605${String(index + 1).padStart(4, '0')}`,
        topic: `${doc.type} - ${service.topic}`,
        serviceId: service.id,
        serviceCode: service.code,
        customerName: service.customerName,
        taskType,
        department: doc.type.includes('付款') || doc.type.includes('应收') || doc.type.includes('发票') ? '财务部' : doc.type.includes('服务') ? '服务部' : '仓储部',
        ownerName: doc.ownerName,
        linkedDocumentId: doc.id,
        linkedDocumentCode: doc.code,
        linkedDocumentStatus: doc.status,
        dueAt: service.sla,
        status: completed ? '已完成' : doc.status.startsWith('待') ? '待处理' : '处理中',
      };
    });
}

function taskTypeForDocument(doc: AfterSalesLinkedDocument, service: AfterSalesService) {
  if (doc.type === '退货入库单') return '退货入库';
  if (doc.type === '换货出库单') return '换货出库';
  if (doc.type === '退款付款单') return '退款处理';
  if (doc.type === '服务派工单') return service.handlingMethod === '现场服务' ? '现场服务' : '维修派工';
  return doc.type.replace('单', '');
}

function isDone(type: LinkedDocumentType, status: LinkedDocumentStatus) {
  if (type === '退货入库单') return status === '已质检';
  if (type === '换货出库单' || type === '配件出库单') return status === '已签收';
  if (type === '退款付款单') return status === '已付款';
  if (type === '服务派工单') return status === '已完成';
  if (type === '应收调整') return status === '已调整';
  if (type === '发票红冲') return status === '已红冲';
  return status === '已关闭';
}

function requiredDocumentTypesFor(method: HandlingMethod) {
  return getAfterSalesRequiredDocumentTypes(method);
}

export function getAfterSalesRequiredDocumentTypes(method: HandlingMethod) {
  return afterSalesMethodDocumentMap[method] || [];
}

function isValidTypeHandling(afterSalesType: CreateAfterSalesPayload['afterSalesType'], handlingMethod: HandlingMethod) {
  return (afterSalesTypeHandlingMap[afterSalesType] || []).includes(handlingMethod);
}

function isRefundHandlingMethod(method: HandlingMethod) {
  return method === '退款退货' || method === '仅退款';
}

function sumUniqueAvailableQuantity(lines: NonNullable<CreateAfterSalesPayload['lines']>) {
  const availabilityByLine = new Map<string, number>();
  lines.forEach((line) => {
    const key = line.sourceLine || line.productCode;
    const available = Number(line.availableQuantity || 0);
    const current = availabilityByLine.get(key);
    availabilityByLine.set(key, current == null ? available : Math.min(current, available));
  });
  return Array.from(availabilityByLine.values()).reduce((sum, available) => sum + available, 0);
}

function serviceRequiredDocsDone(serviceId: string) {
  const service = services.find((item) => item.id === serviceId);
  if (!service) return false;
  const docs = linkedDocuments.filter((doc) => doc.serviceId === serviceId);
  const requiredTypes = requiredDocumentTypesFor(service.handlingMethod);
  return requiredTypes.length > 0 && requiredTypes.every((type) => {
    const doc = docs.find((item) => item.type === type);
    return doc && isDone(doc.type, doc.status);
  });
}

function refreshServiceWriteback(serviceId: string) {
  const service = services.find((item) => item.id === serviceId);
  if (!service || ['pendingReview', 'assigned', 'unassigned', 'untreated', 'closedConfirmed', 'closed'].includes(service.status)) return;
  const docs = linkedDocuments.filter((doc) => doc.serviceId === serviceId);
  const warehouseDocs = docs.filter((doc) => ['退货入库单', '换货出库单', '配件出库单'].includes(doc.type));
  const financeDocs = docs.filter((doc) => ['退款付款单', '应收调整'].includes(doc.type));
  service.warehouseStatus = warehouseDocs.length ? warehouseDocs.map((doc) => `${doc.type}:${doc.status}`).join(' / ') : '无需处理';
  service.financeStatus = financeDocs.length ? financeDocs.map((doc) => `${doc.type}:${doc.status}`).join(' / ') : '无需处理';
  service.invoiceStatus = docs.find((doc) => doc.type === '发票红冲')?.status || '无需处理';
  service.qualityStatus = docs.find((doc) => doc.type === '质量闭环单')?.status || '无需闭环';

  const requiredTypes = requiredDocumentTypesFor(service.handlingMethod);
  const done = requiredTypes.length > 0 && requiredTypes.every((type) => {
    const doc = docs.find((item) => item.type === type);
    return doc && isDone(doc.type, doc.status);
  });
  service.status = done ? 'pendingCloseConfirm' : docs.some(documentStarted) ? 'processing' : 'unassigned';
  service.statusName = statusName(service.status);
  service.closeConfirmStatus = done ? '待结单' : '未确认';
}

services.forEach((service) => refreshServiceWriteback(service.id));

function createLinkedDocuments(service: AfterSalesService) {
  if (linkedDocuments.some((doc) => doc.serviceId === service.id)) return;
  afterSalesMethodDocumentMap[service.handlingMethod].forEach((type, index) => {
    const doc: AfterSalesLinkedDocument = {
      id: `doc_${Date.now()}_${index}`,
      serviceId: service.id,
      type,
      code: `${documentPrefixMap[type]}${service.code.replace('AS', '')}`,
      status: initialStatusMap[type],
      ownerName: type.includes('付款') ? '财务一组' : type.includes('服务') ? '服务部' : type.includes('质量') ? '质量部' : '仓储一组',
      updatedAt: service.submittedAt,
      writebackLogs: [`新增售后自动生成${type}`],
    };
    linkedDocuments.push(doc);
  });
}

export function listAfterSalesServices(query?: ListQuery, mode: Mode = 'mock') {
  if (mode === 'mock') {
    services.forEach((service) => refreshServiceWriteback(service.id));
    return Promise.resolve(toPageResult(services.map(cloneService), query));
  }
  return request<PageResult<AfterSalesService>>({ url: '/after-sales/services', method: 'GET', params: query });
}

export function getAfterSalesService(id: string, mode: Mode = 'mock') {
  if (mode === 'mock') {
    refreshServiceWriteback(id);
    const service = services.find((item) => item.id === id);
    return Promise.resolve(service ? cloneService(service) : undefined);
  }
  return request<AfterSalesService>({ url: `/after-sales/services/${id}`, method: 'GET' });
}

export function createAfterSalesService(data: CreateAfterSalesPayload, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesService>({ url: '/after-sales/services', method: 'POST', data });
  if (!isValidTypeHandling(data.afterSalesType, data.handlingMethod)) {
    return Promise.reject(new Error(`After-sales type ${data.afterSalesType} does not support handling method ${data.handlingMethod}`));
  }
  const id = `as_${Date.now()}`;
  const code = `AS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(services.length + 1).padStart(3, '0')}`;
  const shouldRefund = isRefundHandlingMethod(data.handlingMethod);
  const rawPayloadLines = data.lines?.length ? data.lines : [
    {
      productCode: 'P-AFTER-001',
      productName: '售后来源产品',
      spec: '标准件',
      sourceLine: data.sourceLine,
      quantity: data.quantity,
      availableQuantity: data.quantity,
      refundableAmount: shouldRefund ? data.quantity * 1280 : 0,
      reason: data.reason,
      complaint: data.complaint,
    },
  ];
  const payloadLines = rawPayloadLines.map((line) => ({
    ...line,
    refundableAmount: shouldRefund ? Number(line.refundableAmount || 0) : 0,
  }));
  const invalidLine = payloadLines.find((line) => {
    const quantity = Number(line.quantity || 0);
    const available = Number(line.availableQuantity || 0);
    return !Number.isInteger(quantity) || quantity < 1 || quantity > available;
  });
  if (invalidLine) {
    return Promise.reject(new Error(`After-sales quantity for ${invalidLine.sourceLine || invalidLine.productCode} must be a positive integer within available quantity`));
  }
  const lineTotals = payloadLines.reduce((map, line) => {
    const key = line.sourceLine || line.productCode;
    const current = map.get(key) || { quantity: 0, available: Number(line.availableQuantity || 0) };
    current.quantity += Number(line.quantity || 0);
    current.available = Math.min(current.available, Number(line.availableQuantity || 0));
    map.set(key, current);
    return map;
  }, new Map<string, { quantity: number; available: number }>());
  const overLimitLine = Array.from(lineTotals.entries()).find(([, item]) => item.quantity > item.available);
  if (overLimitLine) {
    return Promise.reject(new Error(`After-sales quantity for ${overLimitLine[0]} exceeds available quantity`));
  }
  const service: AfterSalesService = {
    id,
    code,
    topic: `${data.customerName}${data.handlingMethod}处理`,
    customerName: data.customerName,
    contactName: data.contactName,
    address: data.address,
    sourceOrder: data.sourceOrder,
    sourceDelivery: data.sourceDelivery,
    sourceLine: data.sourceLine,
    afterSalesType: data.afterSalesType,
    handlingMethod: data.handlingMethod,
    availableQuantity: sumUniqueAvailableQuantity(payloadLines),
    refundableAmount: payloadLines.reduce((sum, line) => sum + Number(line.refundableAmount || 0), 0),
    sla: '剩余 2 天',
    warehouseStatus: '待处理',
    financeStatus: '待处理',
    invoiceStatus: '待处理',
    closeConfirmStatus: '未确认',
    qualityStatus: '无需闭环',
    priority: data.priority,
    ownerName: data.ownerName,
    submittedAt: '2026-05-29 16:00',
    status: 'pendingReview',
    statusName: '待审核',
    reason: data.reason,
    complaint: data.complaint,
    description: data.description,
    lines: payloadLines.map((line, index) => ({ ...line, id: `asl_${Date.now()}_${index}` })),
    communicationLogs: ['售后单创建，暂无内容'],
    attachments: data.attachments?.length ? [...data.attachments] : ['问题证据附件'],
    operationLogs: [
      '售后单创建',
      `来源应收：${Number(data.sourceReceivable || 0).toLocaleString('zh-CN')}`,
      `来源发票：${data.sourceInvoice || '未关联'}`,
    ],
  };
  services.unshift(service);
  return Promise.resolve(service);
}

export function reviewAfterSalesService(id: string, decision: string, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesService>({ url: `/after-sales/services/${id}/review`, method: 'POST', data: { decision } });
  const service = services.find((item) => item.id === id);
  if (!service) return Promise.reject(new Error(`After-sales service ${id} not found`));
  if (service.status !== 'pendingReview') return Promise.reject(new Error(`After-sales service ${id} is not pending review`));
  if (decision === 'reject') {
    service.status = 'closed';
    service.statusName = statusName(service.status);
    service.warehouseStatus = '未生成';
    service.financeStatus = '未生成';
    service.invoiceStatus = '未生成';
    service.closeConfirmStatus = '已关闭';
    service.operationLogs.unshift('售后审核驳回');
    service.communicationLogs.unshift('审核驳回，未进入任务池');
    return Promise.resolve(service);
  }
  if (decision === 'return') {
    service.operationLogs.unshift('售后审核退回修改');
    service.communicationLogs.unshift('审核退回修改，等待申请人补充资料后重新提交');
    return Promise.resolve(service);
  }
  if (decision === 'transfer') {
    service.ownerName = '转交处理中';
    service.operationLogs.unshift('售后审核转交处理');
    service.communicationLogs.unshift('审核转交给其他处理人，等待继续审核');
    return Promise.resolve(service);
  }
  service.status = 'unassigned';
  service.statusName = statusName(service.status);
  service.operationLogs.unshift('售后审核通过，生成派生单据并进入任务池');
  service.communicationLogs.unshift('审核通过，等待任务池指派和处理');
  createLinkedDocuments(service);
  return Promise.resolve(service);
}

export function addAfterSalesCommunicationLog(id: string, content: string, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesService>({ url: `/after-sales/services/${id}/communication-logs`, method: 'POST', data: { content } });
  const service = services.find((item) => item.id === id);
  if (!service) return Promise.reject(new Error(`After-sales service ${id} not found`));
  const text = content.trim();
  if (!text) return Promise.reject(new Error('Communication content is required'));
  service.communicationLogs.unshift(`2026-05-30 ${service.ownerName}：${text}`);
  service.operationLogs.unshift('处理人新增沟通记录');
  return Promise.resolve(cloneService(service));
}

export function closeAfterSalesService(id: string, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesService>({ url: `/after-sales/services/${id}/close-confirm`, method: 'POST' });
  refreshServiceWriteback(id);
  const service = services.find((item) => item.id === id);
  if (!service) return Promise.reject(new Error(`After-sales service ${id} not found`));
  if (service.status !== 'pendingCloseConfirm' || !serviceRequiredDocsDone(id)) return Promise.reject(new Error(`After-sales service ${id} is not ready to close`));
  service.status = 'closedConfirmed';
  service.statusName = statusName(service.status);
  service.closeConfirmStatus = '已结单';
  service.operationLogs.unshift('内部人员录入结单确认');
  return Promise.resolve(service);
}

export function escalateAfterSalesQualityAction(serviceId: string, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesQualityAction>({ url: `/after-sales/services/${serviceId}/quality-actions`, method: 'POST' });
  const service = services.find((item) => item.id === serviceId);
  if (!service) return Promise.reject(new Error(`After-sales service ${serviceId} not found`));
  const existing = qualityActions.find((item) => item.serviceId === serviceId);
  if (existing) return Promise.resolve(existing);
  const code = `QA${service.code.replace('AS', '')}`;
  const action: AfterSalesQualityAction = {
    id: `qa_${Date.now()}`,
    code,
    topic: `${service.topic} 质量闭环`,
    serviceId: service.id,
    serviceCode: service.code,
    customerName: service.customerName,
    problemType: service.complaint,
    stage: 'D1组建团队',
    eightDCode: `8D${service.code.replace('AS', '')}`,
    capaCode: `CAPA${service.code.replace('AS', '')}`,
    ownerName: service.ownerName,
    status: '待分析',
    description: service.description,
    eightDReports: [{ id: 'd1', stage: 'D1组建团队', content: '确认问题范围并组建跨部门处理团队', owner: service.ownerName }],
    capaMeasures: [{ id: 'capa_1', measure: '待根因分析后制定 CAPA 措施', dueAt: '待定', status: '待分析' }],
    verificationLogs: ['等待 CAPA 措施执行后验证'],
    operationLogs: [`由售后 ${service.code} 升级质量闭环`],
  };
  qualityActions.unshift(action);
  linkedDocuments.push({
    id: `doc_quality_${Date.now()}`,
    serviceId: service.id,
    type: '质量闭环单',
    code,
    status: '待分析',
    ownerName: service.ownerName,
    updatedAt: '2026-05-29 17:00',
    writebackLogs: ['售后升级质量闭环，不阻塞售后结单'],
  });
  service.qualityStatus = '待分析';
  service.operationLogs.unshift('售后升级质量闭环');
  return Promise.resolve(action);
}

export function listAfterSalesLinkedDocuments(serviceId?: string, mode: Mode = 'mock') {
  if (mode === 'mock') return Promise.resolve((serviceId ? linkedDocuments.filter((item) => item.serviceId === serviceId) : linkedDocuments).map(cloneLinkedDocument));
  return request<AfterSalesLinkedDocument[]>({ url: '/after-sales/linked-documents', method: 'GET', params: { serviceId } });
}

export function advanceAfterSalesLinkedDocument(id: string, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesLinkedDocument>({ url: `/after-sales/linked-documents/${id}/advance-status`, method: 'POST' });
  const flow: Record<string, LinkedDocumentStatus[]> = {
    退货入库单: ['待入库', '已入库', '已质检'],
    换货出库单: ['待出库', '已出库', '已签收'],
    配件出库单: ['待出库', '已出库', '已签收'],
    退款付款单: ['待审核', '待付款', '已付款'],
    服务派工单: ['待派工', '服务中', '已完成'],
    质量闭环单: ['待分析', 'CAPA执行中', '已验证', '已关闭'],
    应收调整: ['待调整', '已调整'],
    发票红冲: ['待红冲', '已红冲'],
  };
  const doc = linkedDocuments.find((item) => item.id === id);
  if (!doc) return Promise.reject(new Error(`Linked document ${id} not found`));
  const steps = flow[doc.type] || [doc.status];
  const next = steps[Math.min(steps.indexOf(doc.status) + 1, steps.length - 1)];
  doc.status = next;
  doc.updatedAt = '2026-05-29 16:30';
  doc.writebackLogs.unshift(`${doc.type}推进到${next}，触发售后单状态回填`);
  syncQualityActionFromDocument(doc);
  refreshServiceWriteback(doc.serviceId);
  return Promise.resolve(doc);
}

function syncQualityActionFromDocument(doc: AfterSalesLinkedDocument) {
  if (doc.type !== '质量闭环单') return;
  const action = qualityActions.find((item) => item.serviceId === doc.serviceId || item.code === doc.code);
  if (!action) return;
  action.status = doc.status as AfterSalesQualityAction['status'];
  action.stage = doc.status === '待分析' ? 'D4根因分析' : doc.status === 'CAPA执行中' ? 'CAPA执行' : doc.status === '已验证' ? '效果验证' : '已关闭';
}

function nowText() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function advanceAfterSalesQualityAction(id: string, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesQualityAction>({ url: `/after-sales/quality-actions/${id}/advance`, method: 'POST' });
  const action = qualityActions.find((item) => item.id === id || item.code === id);
  if (!action) return Promise.reject(new Error(`Quality action ${id} not found`));
  if (action.status === '待分析' && action.stage === 'D1组建团队') {
    action.stage = 'D4根因分析';
    action.operationLogs = ['质量闭环推进到D4根因分析', ...(action.operationLogs || [])];
    return Promise.resolve(cloneQualityAction(action));
  }
  const nextStatusMap: Record<AfterSalesQualityAction['status'], AfterSalesQualityAction['status']> = {
    待分析: 'CAPA执行中',
    CAPA执行中: '已验证',
    已验证: '已关闭',
    已关闭: '已关闭',
  };
  const nextStatus = nextStatusMap[action.status];
  action.status = nextStatus;
  action.stage = nextStatus === 'CAPA执行中' ? 'CAPA执行' : nextStatus === '已验证' ? '效果验证' : nextStatus === '已关闭' ? '已关闭' : 'D4根因分析';
  action.operationLogs = [`质量闭环推进到${nextStatus}`, ...(action.operationLogs || [])];
  if (nextStatus === '已验证') action.verificationLogs = [`${nowText()} CAPA 效果验证通过`, ...(action.verificationLogs || [])];
  const doc = linkedDocuments.find((item) => item.type === '质量闭环单' && (item.serviceId === action.serviceId || item.code === action.code));
  if (doc) {
    doc.status = nextStatus;
    doc.updatedAt = nowText();
    doc.writebackLogs.unshift(`质量闭环推进到${nextStatus}`);
    refreshServiceWriteback(doc.serviceId);
  }
  return Promise.resolve(cloneQualityAction(action));
}

export function listAfterSalesTasks(query?: ListQuery, mode: Mode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(buildTasks(), query));
  return request<PageResult<AfterSalesTask>>({ url: '/after-sales/tasks', method: 'GET', params: query });
}

export function getAfterSalesTask(id: string, mode: Mode = 'mock') {
  if (mode === 'mock') return Promise.resolve(buildTasks().find((item) => item.id === id));
  return request<AfterSalesTask>({ url: `/after-sales/tasks/${id}`, method: 'GET' });
}

export async function advanceAfterSalesTask(id: string, mode: Mode = 'mock') {
  if (mode !== 'mock') return request<AfterSalesTask>({ url: `/after-sales/tasks/${id}/advance`, method: 'POST' });
  const task = buildTasks().find((item) => item.id === id);
  if (!task) return Promise.reject(new Error(`After-sales task ${id} not found`));
  await advanceAfterSalesLinkedDocument(task.linkedDocumentId, mode);
  const updated = buildTasks().find((item) => item.id === id);
  if (!updated) return Promise.reject(new Error(`After-sales task ${id} not found after advance`));
  return updated;
}

export function listAfterSalesQualityActions(query?: ListQuery, mode: Mode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(qualityActions.map(cloneQualityAction), query));
  return request<PageResult<AfterSalesQualityAction>>({ url: '/after-sales/quality-actions', method: 'GET', params: query });
}

export function getAfterSalesQualityAction(id: string, mode: Mode = 'mock') {
  if (mode === 'mock') {
    const action = qualityActions.find((item) => item.id === id);
    return Promise.resolve(action ? cloneQualityAction(action) : undefined);
  }
  return request<AfterSalesQualityAction>({ url: `/after-sales/quality-actions/${id}`, method: 'GET' });
}

export function getAfterSalesDictionary(mode: Mode = 'mock') {
  if (mode === 'mock') return Promise.resolve(afterSalesDictionary);
  return request<AfterSalesDictionary>({ url: '/after-sales/settings/dictionaries', method: 'GET' });
}

export function getAfterSalesWorkbench(mode: Mode = 'mock') {
  if (mode !== 'mock') return request({ url: '/after-sales/workbench', method: 'GET' });
  const tasks = buildTasks();
  const countOpenDocs = (type: LinkedDocumentType) => linkedDocuments.filter((doc) => doc.type === type && !isDone(doc.type, doc.status)).length;
  const pendingReview = services.filter((item) => item.status === 'pendingReview').length;
  const pendingAssign = services.filter((item) => item.status === 'unassigned' || item.ownerName === '待分配').length;
  const pendingClose = services.filter((item) => item.status === 'pendingCloseConfirm').length;
  const overdue = services.filter((item) => item.sla.includes('超时')).length;
  const qualityOpen = qualityActions.filter((item) => item.status !== '已关闭').length;
  const returnInboundOpen = countOpenDocs('退货入库单');
  const exchangeOutboundOpen = countOpenDocs('换货出库单');
  const spareOutboundOpen = countOpenDocs('配件出库单');
  const refundOpen = countOpenDocs('退款付款单');
  const receivableOpen = countOpenDocs('应收调整');
  const invoiceOpen = countOpenDocs('发票红冲');
  const serviceDispatchOpen = countOpenDocs('服务派工单');
  const openTasks = tasks.filter((item) => item.status !== '已完成').length;
  return Promise.resolve({
    kpis: [
      { label: '待审核售后单', value: pendingReview, tone: 'sky', icon: '审' },
      { label: '待指派售后单', value: pendingAssign, tone: 'lilac', icon: '派' },
      { label: '待处理任务', value: openTasks, tone: 'mint', icon: '任' },
      { label: '待退货入库', value: returnInboundOpen, tone: 'peach', icon: '入' },
      { label: '待换货出库', value: exchangeOutboundOpen, tone: 'lilac', icon: '换' },
      { label: '待配件出库', value: spareOutboundOpen, tone: 'sand', icon: '件' },
      { label: '待退款付款', value: refundOpen, tone: 'sand', icon: '款' },
      { label: '待应收调整', value: receivableOpen, tone: 'sky', icon: '收' },
      { label: '待发票红冲', value: invoiceOpen, tone: 'peach', icon: '票' },
      { label: '待服务派工', value: serviceDispatchOpen, tone: 'mint', icon: '服' },
      { label: '待结单确认', value: pendingClose, tone: 'rose', icon: '结' },
      { label: '待质量闭环', value: qualityOpen, tone: 'rose', icon: '质' },
      { label: '超时未处理', value: overdue, tone: 'rose', icon: '时' },
    ],
    tiles: [
      { label: '售后受理', sub: '新增、审核、指派与主单状态', count: services.length, tint: '#e8f4ff', color: '#1677ff', icon: 'AS' },
      { label: '任务池', sub: '仓储/财务/服务派生任务', count: openTasks, tint: '#eaf8f1', color: '#0f9f6e', icon: 'T' },
      { label: '退货入库', sub: '入库、质检和售后回写', count: returnInboundOpen, tint: '#fff7e6', color: '#d48806', icon: 'IN' },
      { label: '出库换货', sub: '换货出库与配件出库', count: exchangeOutboundOpen + spareOutboundOpen, tint: '#f3edff', color: '#722ed1', icon: 'OUT' },
      { label: '退款财务', sub: '退款付款、应收调整、红冲', count: refundOpen + receivableOpen + invoiceOpen, tint: '#fff1f0', color: '#cf1322', icon: '¥' },
      { label: '维修/现场', sub: '服务派工与配件联动', count: serviceDispatchOpen + spareOutboundOpen, tint: '#e6fffb', color: '#08979c', icon: 'SRV' },
      { label: '质量闭环', sub: '8D、CAPA、验证关闭', count: qualityOpen, tint: '#f9f0ff', color: '#531dab', icon: 'Q' },
      { label: '售后设置', sub: '原因、投诉、类型、处理方式、SLA', count: 6, tint: '#f6ffed', color: '#389e0d', icon: 'S' },
    ],
    entries: [
      { label: '新增售后', tint: '#e8f4ff', color: '#1677ff', icon: '+' },
      { label: '审核售后', tint: '#fff7e6', color: '#d48806', icon: '审' },
      { label: '任务派工', tint: '#eaf8f1', color: '#0f9f6e', icon: '派' },
      { label: '推进单据', tint: '#f3edff', color: '#722ed1', icon: '→' },
      { label: '退款处理', tint: '#fff1f0', color: '#cf1322', icon: '款' },
      { label: '结单确认', tint: '#fff7e6', color: '#d48806', icon: '✓' },
      { label: '升级质量', tint: '#f9f0ff', color: '#531dab', icon: '质' },
      { label: '售后设置', tint: '#f6ffed', color: '#389e0d', icon: '设' },
    ],
    notices: [
      { type: '审核', text: `当前有 ${pendingReview} 张售后单等待主管审核，通过后会生成任务池单据`, time: '10:20', tone: 'aw-feed-tag-sky' },
      { type: '回填', text: '换货出库签收后，售后单会自动进入待结单确认', time: '14:00', tone: 'aw-feed-tag-mint' },
      { type: '财务', text: `退款付款、应收调整、发票红冲共 ${refundOpen + receivableOpen + invoiceOpen} 项待处理`, time: '11:40', tone: 'aw-feed-tag-peach' },
      { type: '质量', text: '质量闭环可从售后详情升级生成，不阻塞满足条件的售后结单', time: '09:30', tone: 'aw-feed-tag-sky' },
      { type: 'SLA', text: `${overdue} 张售后单已超时，需优先检查审核、派工或单据回写状态`, time: '08:55', tone: 'aw-feed-tag-rose' },
    ],
    recent: services.map((item) => ({
      title: item.topic,
      meta: `${item.code} · ${item.statusName} · ${item.handlingMethod}`,
    })),
  });
}
