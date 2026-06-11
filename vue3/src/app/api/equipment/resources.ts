import assetsSeed from '@/mock/equipment/assets.json';
import inspectionsSeed from '@/mock/equipment/inspections.json';
import maintenanceSeed from '@/mock/equipment/maintenance.json';
import repairsSeed from '@/mock/equipment/repairs.json';
import settingsSeed from '@/mock/equipment/settings.json';
import sparesSeed from '@/mock/equipment/spares.json';
import type {
  EquipmentAsset,
  EquipmentModule,
  EquipmentPageResult,
  EquipmentSettings,
  EquipmentTone,
  InspectionRecord,
  MaintenanceExecution,
  MaintenancePlan,
  RepairOrder,
  SparePart,
  SpareRequest,
  SpareUsage,
} from './types';

const assets = cloneSeed<EquipmentAsset[]>(assetsSeed);
const maintenance = cloneSeed<MaintenancePlan[]>(maintenanceSeed);
const repairs = cloneSeed<RepairOrder[]>(repairsSeed);
const inspections = cloneSeed<InspectionRecord[]>(inspectionsSeed);
const spares = cloneSeed<SparePart[]>(sparesSeed);
const spareRequests: SpareRequest[] = [];
const settings = cloneSeed<EquipmentSettings>(settingsSeed);

export const equipmentStatusOptions = ['运行中', '停机', '故障', '维修中', '保养中', '闲置', '停用', '报废'];
export const maintenanceStatusOptions = ['未开始', '待执行', '执行中', '已完成', '已逾期', '已取消'];
export const repairStatusOptions = ['待派工', '维修中', '待验收', '已完成', '已驳回', '已关闭'];
export const inspectionStatusOptions = ['待点检', '点检中', '正常', '异常', '已生成维修', '已关闭'];
export const spareStatusOptions = ['正常', '低库存', '已占用', '停用'];
export const equipmentPeopleDepts = [
  {
    key: 'equipment',
    label: '设备动力部',
    persons: [
      { id: 'EQ001', name: '陈工', role: '设备工程师', phone: '13800006001', dept: '设备动力部' },
      { id: 'EQ002', name: '李工', role: '动力工程师', phone: '13800006002', dept: '设备动力部' },
      { id: 'EQ003', name: '赵维修', role: '维修技师', phone: '13800006003', dept: '设备动力部' },
    ],
  },
  {
    key: 'production',
    label: '生产中心',
    persons: [
      { id: 'PR001', name: '王主管', role: '包装主管', phone: '13800007001', dept: '包装部' },
      { id: 'PR002', name: '刘班长', role: '机加工班长', phone: '13800007002', dept: '一车间' },
    ],
  },
];

export const equipmentPickerColumns = [
  { key: 'code', title: '设备编号', width: 150 },
  { key: 'name', title: '设备名称', width: 180 },
  { key: 'category', title: '设备分类', width: 120 },
  { key: 'location', title: '位置', width: 120 },
  { key: 'status', title: '状态', width: 100 },
];

export const sparePickerColumns = [
  { key: 'code', title: '备件编号', width: 150 },
  { key: 'name', title: '备件名称', width: 160 },
  { key: 'model', title: '规格型号', width: 120 },
  { key: 'availableQty', title: '可用库存', width: 100 },
  { key: 'warehouse', title: '仓库', width: 130 },
];

function cloneSeed<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function today() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function nowText() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false }).replace('T', ' ');
}

function isAutoCode(code: unknown) {
  return !code || String(code).includes('系统自动生成');
}

function nextCode(prefix: string, count: number) {
  return `${prefix}-202605-${String(count + 1).padStart(3, '0')}`;
}

function addDays(date: string, days: number) {
  const base = new Date(`${date || today()}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function nextMaintenanceDate(plan: MaintenancePlan) {
  const value = Math.max(Number(plan.cycleValue || 1), 1);
  const base = today();
  if (plan.cycleType.includes('天')) return addDays(base, value);
  if (plan.cycleType.includes('周')) return addDays(base, value * 7);
  if (plan.cycleType.includes('年')) return addDays(base, value * 365);
  if (plan.cycleType.includes('运行小时')) return addDays(base, value);
  return addDays(base, value * 30);
}

function toPage<T extends object>(items: T[]): EquipmentPageResult<T> {
  return { items: items.map((item) => ({ ...(item as Record<string, unknown>) })) as T[], total: items.length };
}

function filterByKeyword<T extends object>(rows: T[], keyword = '') {
  const key = keyword.trim().toLowerCase();
  if (!key) return rows;
  return rows.filter((row) => Object.values(row as Record<string, unknown>).some((value) => String(value ?? '').toLowerCase().includes(key)));
}

export function toneByStatus(status = ''): EquipmentTone {
  if (['运行中', '正常', '已完成', '启用'].includes(status)) return 'green';
  if (['待执行', '待派工', '待验收', '保养中', '维修中', '已预警', '低库存', '执行中', '点检中'].includes(status)) return 'yellow';
  if (['故障', '异常', '已逾期', '报废', '停用'].includes(status)) return 'red';
  if (['闲置', '已关闭', '已取消'].includes(status)) return 'gray';
  return 'blue';
}

export function listEquipmentAssets(query: { keyword?: string } = {}) {
  return Promise.resolve(toPage(filterByKeyword(assets, query.keyword)));
}

export function listMaintenancePlans(query: { keyword?: string } = {}) {
  return Promise.resolve(toPage(filterByKeyword(maintenance, query.keyword)));
}

export function listRepairOrders(query: { keyword?: string } = {}) {
  return Promise.resolve(toPage(filterByKeyword(repairs, query.keyword)));
}

export function listInspectionRecords(query: { keyword?: string } = {}) {
  return Promise.resolve(toPage(filterByKeyword(inspections, query.keyword)));
}

export function listSpareParts(query: { keyword?: string } = {}) {
  refreshSpareStatuses();
  return Promise.resolve(toPage(filterByKeyword(spares, query.keyword)));
}

export function listSpareRequests() {
  return Promise.resolve(spareRequests.map((item) => ({ ...item })));
}

export function listRowsForModule(module: EquipmentModule, keyword = '') {
  if (module === 'assets') return listEquipmentAssets({ keyword });
  if (module === 'maintenance') return listMaintenancePlans({ keyword });
  if (module === 'repairs') return listRepairOrders({ keyword });
  if (module === 'inspections') return listInspectionRecords({ keyword });
  return listSpareParts({ keyword });
}

export function getEquipmentAsset(id: string) {
  return Promise.resolve(assets.find((item) => item.id === id || item.code === id) || assets[0]);
}

export function getMaintenancePlan(id: string) {
  return Promise.resolve(maintenance.find((item) => item.id === id || item.code === id) || maintenance[0]);
}

export function getRepairOrder(id: string) {
  return Promise.resolve(repairs.find((item) => item.id === id || item.code === id) || repairs[0]);
}

export function getInspectionRecord(id: string) {
  return Promise.resolve(inspections.find((item) => item.id === id || item.code === id) || inspections[0]);
}

export function getSparePart(id: string) {
  refreshSpareStatuses();
  return Promise.resolve(spares.find((item) => item.id === id || item.code === id) || spares[0]);
}

export function getRowForModule(module: EquipmentModule, id: string) {
  if (module === 'assets') return getEquipmentAsset(id);
  if (module === 'maintenance') return getMaintenancePlan(id);
  if (module === 'repairs') return getRepairOrder(id);
  if (module === 'inspections') return getInspectionRecord(id);
  return getSparePart(id);
}

export function createEquipmentAsset(payload: Partial<EquipmentAsset>) {
  const row: EquipmentAsset = {
    id: `asset_${Date.now()}`,
    code: isAutoCode(payload.code) ? nextCode('EQ', assets.length) : String(payload.code),
    name: payload.name || '新建设备',
    category: payload.category || settings.categories[0]?.name || '机加工设备',
    model: payload.model || '待填写',
    manufacturer: payload.manufacturer || '待填写',
    serialNo: payload.serialNo || '待填写',
    assetTag: payload.assetTag || '待分配',
    workshop: payload.workshop || '一车间',
    line: payload.line || '机加工产线A',
    location: payload.location || '待安装',
    ownerDept: payload.ownerDept || '设备动力部',
    ownerName: payload.ownerName || '陈工',
    level: payload.level || '一般',
    status: payload.status || '运行中',
    enabledAt: payload.enabledAt || today(),
    lastInspectionAt: payload.lastInspectionAt || '-',
    lastMaintenanceAt: payload.lastMaintenanceAt || '-',
    lastRepairAt: payload.lastRepairAt || '-',
    ratedPower: payload.ratedPower || '',
    maintenanceStrategy: payload.maintenanceStrategy || '待配置',
    inspectionStrategy: payload.inspectionStrategy || '待配置',
    remark: payload.remark || '',
    attachments: payload.attachments || [],
  };
  assets.unshift(row);
  return Promise.resolve({ ...row });
}

export function createMaintenancePlan(payload: Partial<MaintenancePlan>) {
  const asset = assets.find((item) => item.id === payload.equipmentId) || assets[0];
  const row: MaintenancePlan = {
    id: `mnt_${Date.now()}`,
    code: isAutoCode(payload.code) ? nextCode('MP', maintenance.length) : String(payload.code),
    name: payload.name || '新建保养计划',
    equipmentId: asset.id,
    equipmentCode: asset.code,
    equipmentName: asset.name,
    maintenanceType: payload.maintenanceType || '日常保养',
    cycleType: payload.cycleType || '按月',
    cycleValue: Number(payload.cycleValue || 1),
    planDate: payload.planDate || today(),
    lastDate: payload.lastDate || '-',
    nextDate: payload.nextDate || today(),
    warningDays: Number(payload.warningDays || 3),
    ownerName: payload.ownerName || asset.ownerName,
    warningStatus: payload.warningStatus || '正常',
    status: payload.status || '待执行',
    standard: payload.standard || '保养标准',
    maintenanceItemIds: payload.maintenanceItemIds || [],
    items: payload.items?.length ? payload.items : [{ id: 1, itemName: '保养项目', standard: '按标准执行', method: '目视', tools: '工具', required: '是' }],
    attachments: payload.attachments || [],
    remark: payload.remark || '',
    executions: [],
  };
  maintenance.unshift(row);
  return Promise.resolve({ ...row });
}

export function createRepairOrder(payload: Partial<RepairOrder>) {
  const asset = assets.find((item) => item.id === payload.equipmentId) || assets[0];
  const previousStatus = ['故障', '维修中', '保养中'].includes(asset.status) ? '运行中' : asset.status;
  const row: RepairOrder = {
    id: `rep_${Date.now()}`,
    code: isAutoCode(payload.code) ? nextCode('RO', repairs.length) : String(payload.code),
    topic: payload.topic || '新建报修申请',
    equipmentId: asset.id,
    equipmentCode: asset.code,
    equipmentName: asset.name,
    faultCategory: payload.faultCategory || '机械故障',
    repairLevel: payload.repairLevel || '一般',
    reporter: payload.reporter || asset.ownerName,
    reportedAt: payload.reportedAt || nowText(),
    dispatcher: payload.dispatcher || '',
    assignee: payload.assignee || '',
    plannedStartAt: payload.plannedStartAt || '',
    plannedEndAt: payload.plannedEndAt || '',
    actualStartAt: payload.actualStartAt || '',
    actualEndAt: payload.actualEndAt || '',
    status: payload.status || '待派工',
    acceptanceStatus: payload.acceptanceStatus || '未验收',
    previousEquipmentStatus: payload.previousEquipmentStatus || previousStatus,
    impactScope: payload.impactScope || '单台设备',
    urgency: payload.urgency || '中',
    faultDesc: payload.faultDesc || '',
    spareParts: payload.spareParts || [],
    attachments: payload.attachments || [],
  };
  repairs.unshift(row);
  updateAsset(asset.id, { status: '故障', lastRepairAt: today() });
  return Promise.resolve({ ...row });
}

export function createInspectionRecord(payload: Partial<InspectionRecord>) {
  const asset = assets.find((item) => item.id === payload.equipmentId) || assets[0];
  const recordType = payload.recordType || (payload.status === '待点检' || payload.result === '待点检' ? 'plan' : 'execution');
  const isPlan = recordType === 'plan';
  const isException = payload.result === '异常';
  const row: InspectionRecord = {
    id: `ins_${Date.now()}`,
    code: isAutoCode(payload.code) ? nextCode('IP', inspections.length) : String(payload.code),
    planName: payload.planName || '新建点检计划',
    equipmentId: asset.id,
    equipmentCode: asset.code,
    equipmentName: asset.name,
    inspectionType: payload.inspectionType || '日点检',
    inspector: payload.inspector || asset.ownerName,
    inspectionAt: payload.inspectionAt || nowText(),
    result: isPlan ? '待点检' : payload.result || '正常',
    exceptionCount: isException ? Number(payload.exceptionCount || 1) : 0,
    status: isPlan ? '待点检' : payload.status || (isException ? '异常' : '正常'),
    recordType,
    planStatus: isPlan ? '待点检' : payload.planStatus || '已执行',
    handlingStatus: isException ? '待处理' : payload.handlingStatus || '无需处理',
    standard: payload.standard || '点检标准',
    exceptionDesc: payload.exceptionDesc || '',
    items: payload.items?.length ? payload.items : [{ id: 1, itemName: '点检项目', standard: '正常', recordType: '正常/异常', upper: '-', lower: '-', required: '是', measured: '', result: payload.result || '正常' }],
    attachments: payload.attachments || [],
  };
  inspections.unshift(row);
  if (!isPlan) updateAsset(asset.id, { lastInspectionAt: today(), status: isException ? '故障' : asset.status });
  return Promise.resolve({ ...row });
}

export function createSparePart(payload: Partial<SparePart>) {
  const stockQty = Number(payload.stockQty || 0);
  const safeQty = Number(payload.safeQty || 0);
  const row: SparePart = {
    id: `sp_${Date.now()}`,
    code: isAutoCode(payload.code) ? nextCode('SP', spares.length) : String(payload.code),
    name: payload.name || '新建备件',
    model: payload.model || '待填写',
    category: payload.category || settings.spareCategories[0]?.name || '机械备件',
    unit: payload.unit || '个',
    equipmentScope: payload.equipmentScope || '通用',
    stockQty,
    safeQty,
    availableQty: Number(payload.availableQty ?? stockQty),
    occupiedQty: Number(payload.occupiedQty || 0),
    warehouse: payload.warehouse || '设备备件库',
    location: payload.location || '待分配',
    supplier: payload.supplier || '待填写',
    unitPrice: Number(payload.unitPrice || 0),
    status: stockQty < safeQty ? '低库存' : payload.status || '正常',
    lastUsedAt: payload.lastUsedAt || '-',
    attachments: payload.attachments || [],
    remark: payload.remark || '',
  };
  spares.unshift(row);
  return Promise.resolve({ ...row });
}

export function createRowForModule(module: EquipmentModule, payload: Record<string, unknown>) {
  if (module === 'assets') return createEquipmentAsset(payload);
  if (module === 'maintenance') return createMaintenancePlan(payload);
  if (module === 'repairs') return createRepairOrder(payload);
  if (module === 'inspections') return createInspectionRecord(payload);
  return createSparePart(payload);
}

export function updateAsset(id: string, patch: Partial<EquipmentAsset>) {
  const index = assets.findIndex((item) => item.id === id || item.code === id);
  if (index >= 0) assets[index] = { ...assets[index], ...patch };
  return Promise.resolve(index >= 0 ? { ...assets[index] } : undefined);
}

export function changeAssetStatus(id: string, status: string) {
  return updateAsset(id, { status });
}

export function generateMaintenanceExecution(planId: string) {
  const plan = maintenance.find((item) => item.id === planId || item.code === planId);
  if (!plan) return Promise.resolve(undefined);
  plan.status = '执行中';
  const asset = assets.find((item) => item.id === plan.equipmentId);
  if (asset) asset.status = '保养中';
  const execution: MaintenanceExecution = {
    id: `mexe_${Date.now()}`,
    code: `ME-202605-${String((plan.executions?.length || 0) + 1).padStart(3, '0')}`,
    planId: plan.id,
    executedAt: nowText(),
    executor: plan.ownerName,
    result: '执行中',
    exception: '',
    spareParts: [],
  };
  plan.executions = [execution, ...(plan.executions || [])];
  return Promise.resolve({ ...execution });
}

export function completeMaintenance(planId: string, spareUsage: SpareUsage[] = [], payload: Partial<MaintenanceExecution> = {}) {
  const plan = maintenance.find((item) => item.id === planId || item.code === planId);
  if (!plan) return Promise.resolve({ ok: false, message: '未找到保养计划' });
  const stockCheck = consumeSpares(spareUsage, plan.code, plan.equipmentName, '保养领用');
  if (!stockCheck.ok) return Promise.resolve(stockCheck);
  plan.status = '已完成';
  plan.warningStatus = '正常';
  plan.lastDate = today();
  plan.nextDate = nextMaintenanceDate(plan);
  const asset = assets.find((item) => item.id === plan.equipmentId);
  if (asset) {
    asset.lastMaintenanceAt = today();
    asset.status = '运行中';
  }
  const currentExecution = plan.executions?.[0]?.result === '执行中' ? plan.executions[0] : generateExecutionForComplete(plan);
  const completedExecution = {
    ...currentExecution,
    actualStartAt: payload.actualStartAt || currentExecution.actualStartAt || nowText(),
    actualEndAt: payload.actualEndAt || nowText(),
    executor: payload.executor || currentExecution.executor || plan.ownerName,
    result: payload.result || '已完成',
    exception: payload.exception || '',
    executedAt: nowText(),
    spareParts: spareUsage.map((item) => ({ ...item, consumedAt: item.consumedAt || nowText() })),
    attachments: payload.attachments || [],
  };
  plan.executions = [completedExecution, ...(plan.executions || []).filter((item) => item.id !== completedExecution.id)];
  plan.planDate = plan.nextDate;
  plan.status = '待执行';
  return Promise.resolve({ ok: true, message: `保养已完成，已回写设备最近保养时间；下次保养日期为 ${plan.nextDate}` });
}

function generateExecutionForComplete(plan: MaintenancePlan): MaintenanceExecution {
  return {
    id: `mexe_${Date.now()}`,
    code: `ME-202605-${String((plan.executions?.length || 0) + 1).padStart(3, '0')}`,
    planId: plan.id,
    executedAt: nowText(),
    executor: plan.ownerName,
    result: '已完成',
    exception: '',
    spareParts: [],
  };
}

export function dispatchRepair(id: string, payload: Partial<RepairOrder>) {
  const order = repairs.find((item) => item.id === id || item.code === id);
  if (!order) return Promise.resolve(undefined);
  if (order.status !== '待派工') return Promise.resolve(undefined);
  Object.assign(order, {
    dispatcher: payload.dispatcher || '设备主管',
    assignee: payload.assignee || '赵维修',
    plannedStartAt: payload.plannedStartAt || nowText(),
    plannedEndAt: payload.plannedEndAt || nowText(),
    repairLevel: payload.repairLevel || order.repairLevel,
    downtime: payload.downtime || '否',
    status: '维修中',
    acceptanceStatus: '未验收',
  });
  updateAsset(order.equipmentId, { status: '维修中', lastRepairAt: today() });
  return Promise.resolve({ ...order });
}

export function submitRepairResult(id: string, payload: Partial<RepairOrder>) {
  const order = repairs.find((item) => item.id === id || item.code === id);
  if (!order) return Promise.resolve({ ok: false, message: '未找到维修单' });
  if (!['维修中', '已驳回'].includes(order.status)) return Promise.resolve({ ok: false, message: '当前状态不能提交维修处理' });
  const usage = payload.spareParts || order.spareParts || [];
  const usageToConsume = usage.filter((item) => !item.consumedAt);
  const stockCheck = consumeSpares(usageToConsume, order.code, order.equipmentName, '维修领用');
  if (!stockCheck.ok) return Promise.resolve(stockCheck);
  Object.assign(order, {
    faultReason: payload.faultReason || order.faultReason || '已记录故障原因',
    actionsTaken: payload.actionsTaken || order.actionsTaken || '已完成维修处理',
    actualStartAt: payload.actualStartAt || order.actualStartAt || nowText(),
    actualEndAt: payload.actualEndAt || nowText(),
    actualHours: Number(payload.actualHours || order.actualHours || 2),
    repairCost: Number(payload.repairCost || order.repairCost || 0),
    result: payload.result || '待验收',
    spareParts: usage.map((item) => ({ ...item, consumedAt: item.consumedAt || nowText() })),
    status: '待验收',
    acceptanceStatus: '待验收',
  });
  return Promise.resolve({ ok: true, message: '维修处理已提交，进入待验收' });
}

export function acceptRepair(id: string, passed: boolean, payload: Partial<RepairOrder> = {}) {
  const order = repairs.find((item) => item.id === id || item.code === id);
  if (!order) return Promise.resolve(undefined);
  if (order.status !== '待验收' && order.acceptanceStatus !== '待验收') return Promise.resolve(undefined);
  order.status = passed ? '已完成' : '维修中';
  order.acceptanceStatus = passed ? '验收通过' : '验收驳回';
  order.acceptedBy = payload.acceptedBy || '设备主管';
  order.acceptedAt = payload.acceptedAt || nowText();
  order.acceptanceOpinion = payload.acceptanceOpinion || (passed ? '维修结果验收通过' : '');
  order.rejectedReason = passed ? '' : payload.rejectedReason || '维修结果未达到验收要求';
  const restoreStatus = payload.status || order.previousEquipmentStatus || '运行中';
  updateAsset(order.equipmentId, { status: passed ? restoreStatus : '维修中', lastRepairAt: today() });
  return Promise.resolve({ ...order });
}

export function closeRepair(id: string, payload: Partial<RepairOrder> = {}) {
  const order = repairs.find((item) => item.id === id || item.code === id);
  if (!order || order.status !== '已完成') return Promise.resolve(undefined);
  order.status = '已关闭';
  order.closedBy = payload.closedBy || '设备主管';
  order.closedAt = payload.closedAt || nowText();
  order.closeReason = payload.closeReason || '维修验收完成后关闭';
  return Promise.resolve({ ...order });
}

export function completeInspection(id: string, patch: Partial<InspectionRecord>) {
  const record = inspections.find((item) => item.id === id || item.code === id);
  if (!record) return Promise.resolve({ ok: false, message: '未找到点检单' });
  if ((patch.result || record.result) === '异常' && !(patch.exceptionDesc || record.exceptionDesc)) {
    return Promise.resolve({ ok: false, message: '点检结果为异常时必须填写异常说明' });
  }
  Object.assign(record, patch, {
    recordType: 'execution',
    planStatus: '已执行',
    status: patch.result === '异常' ? '异常' : '正常',
    handlingStatus: patch.result === '异常' ? '待处理' : '无需处理',
  });
  updateAsset(record.equipmentId, record.result === '异常' ? { lastInspectionAt: today(), status: '故障' } : { lastInspectionAt: today() });
  return Promise.resolve({ ok: true, message: '点检已完成，已回写最近点检时间' });
}

export function generateRepairFromInspection(id: string) {
  const record = inspections.find((item) => item.id === id || item.code === id);
  if (!record) return Promise.resolve(undefined);
  if (record.result !== '异常' && Number(record.exceptionCount || 0) < 1) return Promise.resolve(undefined);
  if (record.repairOrderCode || record.status === '已生成维修') return Promise.resolve(undefined);
  return createRepairOrder({
    topic: `${record.equipmentName}点检异常`,
    equipmentId: record.equipmentId,
    faultCategory: '点检异常',
    repairLevel: record.exceptionCount > 1 ? '紧急' : '一般',
    reporter: record.inspector,
    faultDesc: record.exceptionDesc || '点检异常生成维修',
  }).then((repair) => {
    record.status = '已生成维修';
    record.handlingStatus = '已生成维修';
    record.handledAt = nowText();
    record.repairOrderCode = repair.code;
    return repair;
  });
}

export function closeInspectionException(id: string, repairCode = '') {
  const record = inspections.find((item) => item.id === id || item.code === id || item.repairOrderCode === repairCode);
  if (!record) return Promise.resolve(undefined);
  record.status = '已关闭';
  record.handlingStatus = '已关闭';
  record.handledAt = nowText();
  return Promise.resolve({ ...record });
}

export function createSpareRequest(payload: Partial<SpareRequest>) {
  const row: SpareRequest = {
    id: `sr_${Date.now()}`,
    code: payload.code || `SR-202605-${String(spareRequests.length + 1).padStart(3, '0')}`,
    requestType: payload.requestType || '备件补货',
    sourceCode: payload.sourceCode || '前端补货记录',
    spareCode: payload.spareCode || '',
    spareName: payload.spareName || '',
    equipmentCode: payload.equipmentCode || '',
    equipmentName: payload.equipmentName || '-',
    requester: payload.requester || '陈工',
    qty: Number(payload.qty || 1),
    warehouse: payload.warehouse || '设备备件库',
    purpose: payload.purpose || '低库存补货',
    status: payload.status || '前端记录',
    createdAt: nowText(),
  };
  spareRequests.unshift(row);
  return Promise.resolve({ ...row });
}

function consumeSpares(usages: SpareUsage[], sourceCode: string, equipmentName: string, requestType: string) {
  for (const usage of usages) {
    const qty = Number(usage.qty);
    if (!Number.isFinite(qty) || qty <= 0) return { ok: false, message: `${usage.spareName || '备件'}领用数量必须大于 0` };
    const spare = spares.find((item) => item.id === usage.spareId || item.code === usage.spareCode);
    if (!spare) return { ok: false, message: `未找到备件：${usage.spareName}` };
    if (qty > spare.availableQty) return { ok: false, message: `${spare.name}库存不足，不能负库存` };
  }
  for (const usage of usages) {
    const spare = spares.find((item) => item.id === usage.spareId || item.code === usage.spareCode);
    if (!spare) continue;
    const qty = Number(usage.qty);
    spare.availableQty -= qty;
    spare.stockQty -= qty;
    spare.lastUsedAt = today();
    spare.status = spare.availableQty < spare.safeQty ? '低库存' : '正常';
    usage.consumedAt = nowText();
    spareRequests.unshift({
      id: `sr_${Date.now()}_${spare.id}`,
      code: `SR-202605-${String(spareRequests.length + 1).padStart(3, '0')}`,
      requestType,
      sourceCode,
      spareCode: spare.code,
      spareName: spare.name,
      equipmentCode: '',
      equipmentName,
      requester: '系统生成',
      qty,
      warehouse: spare.warehouse,
      purpose: `${sourceCode} 使用备件`,
      status: '已领用',
      createdAt: nowText(),
    });
  }
  return { ok: true, message: '备件领用已记录' };
}

export function listEquipmentHistory(equipmentId: string) {
  const maintenanceRows = maintenance.filter((item) => item.equipmentId === equipmentId);
  const repairRows = repairs.filter((item) => item.equipmentId === equipmentId);
  const inspectionRows = inspections.filter((item) => item.equipmentId === equipmentId);
  const usageRows = spareRequests.filter((item) => item.equipmentName && [
    ...maintenanceRows.map((row) => row.code),
    ...repairRows.map((row) => row.code),
  ].includes(item.sourceCode));
  return Promise.resolve({
    maintenance: maintenanceRows.map((item) => ({ ...item })),
    repairs: repairRows.map((item) => ({ ...item })),
    inspections: inspectionRows.map((item) => ({ ...item })),
    spareRequests: usageRows.map((item) => ({ ...item })),
  });
}

function refreshSpareStatuses() {
  spares.forEach((item) => {
    if (item.status !== '停用') item.status = item.availableQty < item.safeQty ? '低库存' : item.occupiedQty > 0 ? '已占用' : '正常';
  });
}

export function getEquipmentSettings() {
  return Promise.resolve(settings);
}

export function rowsForModule(module: EquipmentModule) {
  if (module === 'assets') return assets;
  if (module === 'maintenance') return maintenance;
  if (module === 'repairs') return repairs;
  if (module === 'inspections') return inspections;
  return spares;
}

export function getWorkbenchSummary() {
  refreshSpareStatuses();
  const todayText = today();
  return Promise.resolve({
    cards: [
      { key: 'total', label: '设备总数', value: assets.length },
      { key: 'running', label: '运行中', value: assets.filter((item) => item.status === '运行中').length },
      { key: 'fault', label: '故障停机', value: assets.filter((item) => ['故障', '停机'].includes(item.status)).length },
      { key: 'inspection', label: '今日待点检', value: inspections.filter((item) => item.inspectionAt.startsWith(todayText) && item.status === '待点检').length },
      { key: 'maintenance', label: '本周待保养', value: maintenance.filter((item) => ['待执行', '已逾期'].includes(item.status)).length },
      { key: 'dispatch', label: '待维修派工', value: repairs.filter((item) => item.status === '待派工').length },
      { key: 'accept', label: '待维修验收', value: repairs.filter((item) => item.status === '待验收').length },
      { key: 'spares', label: '低库存备件', value: spares.filter((item) => item.status === '低库存').length },
    ],
    todos: [
      ...maintenance.filter((item) => ['待执行', '已逾期'].includes(item.status)).map((item) => ({
        id: item.id,
        type: '保养执行',
        sourceCode: item.code,
        equipmentName: item.equipmentName,
        equipmentCode: item.equipmentCode,
        location: assetLocation(item.equipmentId),
        ownerName: item.ownerName,
        planTime: item.planDate,
        priority: item.status === '已逾期' ? '高' : '中',
        status: item.status,
        route: `/equipment/maintenance?id=${item.id}`,
      })),
      ...repairs.filter((item) => ['待派工', '待验收'].includes(item.status)).map((item) => ({
        id: item.id,
        type: item.status,
        sourceCode: item.code,
        equipmentName: item.equipmentName,
        equipmentCode: item.equipmentCode,
        location: assetLocation(item.equipmentId),
        ownerName: item.assignee || item.reporter,
        planTime: item.plannedStartAt || item.reportedAt,
        priority: item.repairLevel,
        status: item.status,
        route: `/equipment/repairs?id=${item.id}`,
      })),
    ],
    risks: [
      ...inspections.filter((item) => item.status === '异常').map((item) => ({ id: item.id, title: '点检异常', desc: `${item.equipmentName}：${item.exceptionDesc || '待处理'}`, tone: 'red', route: `/equipment/inspections?id=${item.id}` })),
      ...maintenance.filter((item) => item.status === '已逾期').map((item) => ({ id: item.id, title: '逾期保养', desc: `${item.equipmentName} 未按计划执行`, tone: 'yellow', route: `/equipment/maintenance?id=${item.id}` })),
      ...repairs.filter((item) => item.status === '待派工').map((item) => ({ id: item.id, title: '待维修派工', desc: `${item.equipmentName} ${item.topic}`, tone: 'red', route: `/equipment/repairs?id=${item.id}` })),
      ...spares.filter((item) => item.status === '低库存').map((item) => ({ id: item.id, title: '备件低库存', desc: `${item.name} 可用 ${item.availableQty}，安全 ${item.safeQty}`, tone: 'yellow', route: `/equipment/spares?id=${item.id}` })),
    ],
  });
}

function assetLocation(id: string) {
  const asset = assets.find((item) => item.id === id);
  return asset ? `${asset.workshop}/${asset.location}` : '-';
}
