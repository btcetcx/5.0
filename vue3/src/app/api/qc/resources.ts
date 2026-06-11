import inspectionsSeed from '@/mock/qc/inspections.json';
import exceptionsSeed from '@/mock/qc/exceptions.json';
import standardsSeed from '@/mock/qc/standards.json';
import reportsSeed from '@/mock/qc/reports.json';
import settingsSeed from '@/mock/qc/settings.json';
import type {
  QcException,
  QcExceptionActionPayload,
  QcInspection,
  QcInspectionLine,
  QcListQuery,
  QcPageResult,
  QcReport,
  QcResource,
  QcSettings,
  QcSourceBatch,
  QcSourceRow,
  QcStandard,
  QcTone,
} from './types';

const inspections = (inspectionsSeed as QcInspection[]).map((item) => ({ ...item }));
const exceptions = (exceptionsSeed as QcException[]).map((item) => ({ ...item }));
const standards = (standardsSeed as QcStandard[]).map((item) => ({ ...item }));
const reports = (reportsSeed as QcReport[]).map((item) => ({ ...item }));
let settings: QcSettings = JSON.parse(JSON.stringify(settingsSeed)) as QcSettings;

export const qcStageLabels = {
  IQC: '来料检验 IQC',
  IPQC: '过程检验 IPQC',
  FQC: '成品检验 FQC',
  OQC: '出货检验 OQC',
};

export const qcInspectionStatuses = ['待报检', '抽样中', '待判定', '特采评审', '拒收退回', '已放行'];
export const qcExceptionStatuses = ['待处置', '隔离中', '复检中', '让步审批', '整改中', '整改退回', '让步驳回', '已关闭'];
export const qcStandardStatuses = ['草稿', '待审批', '启用', '修订中', '停用'];
export const qcReportStatuses = ['未生成', '已生成', '已确认'];
export const qcDisposalActions = ['批量派工', '加严抽样', '返工复检', '让步放行', '拒收/隔离', '生成标准报告'];
export const qcResultActions = ['放行', '拒收', '让步接收', '返工复检'];
export const qcDetailTabs = ['质检信息', '来源记录', '抽样记录', '检验明细', '不良处置', '复检记录', '放行/拒收记录', '质检报告'];
export const qcExceptionTabs = ['异常信息', '来源记录', '不良明细', '隔离/拒收', '返工复检', '让步放行', '验证关闭', '操作记录'];
export const qcStandardTabs = ['配置信息', '版本记录', '抽样规则', '项目清单', '检验组授权', '审批记录', '操作记录'];
export const qcReportTabs = ['分析概览', '质量趋势', '不良分布', '来源维度', '改善记录', '操作记录'];

export const qcInspectionLines: QcInspectionLine[] = [
  { id: 'line_001', item: '瓶身高度检验', method: '仪器测量', valueType: '数值', standard: '200.00mm', upper: '0.40mm', lower: '0.40mm', measured: '200.25', defect: 'MAJOR', result: '不合格', image: '已上传' },
  { id: 'line_002', item: '外观划痕', method: '目视检查', valueType: '判定', standard: '无明显划痕', upper: '-', lower: '-', measured: '合格', defect: 'MINOR', result: '合格', image: '已上传' },
  { id: 'line_003', item: '包装完整性', method: '抽样检查', valueType: '判定', standard: '完整', upper: '-', lower: '-', measured: '完整', defect: 'MINOR', result: '合格', image: '已上传' },
];

export const qcPersonDepts = [
  {
    key: 'qc',
    label: '质检中心',
    persons: [
      { id: 'QC001', name: '老夏', role: 'IQC检验员', phone: '13800001001', dept: '质检中心' },
      { id: 'QC002', name: '王质检', role: 'IPQC检验员', phone: '13800001002', dept: '质检中心' },
      { id: 'QC003', name: '陈质检', role: 'OQC检验员', phone: '13800001003', dept: '质检中心' },
      { id: 'QC004', name: '质量经理', role: '质量经理', phone: '13800001004', dept: '质检中心' },
    ],
  },
  {
    key: 'production',
    label: '生产中心',
    persons: [
      { id: 'SC001', name: '三红', role: '生产主管', phone: '13800002001', dept: '生产中心' },
      { id: 'SC002', name: '李工', role: '工艺工程师', phone: '13800002002', dept: '生产中心' },
    ],
  },
  {
    key: 'warehouse',
    label: '仓储中心',
    persons: [
      { id: 'CK001', name: '陈仓', role: '仓库主管', phone: '13800003001', dept: '仓储中心' },
      { id: 'CK002', name: '李库', role: '收货员', phone: '13800003002', dept: '仓储中心' },
    ],
  },
];

export const qcSourceCategories = [
  { key: 'warehouse', label: '仓储单据', icon: 'line-doc' },
  { key: 'production', label: '生产单据', icon: 'line-folder' },
  { key: 'sales', label: '销售/出库', icon: 'line-doc' },
];

export const qcSourceRows: QcSourceRow[] = [
  { cat: 'warehouse', code: 'GRN-202605-018', subject: '采购收货待检', date: '2026-05-17', customer: '海南微为智造', maxQty: '10箱' },
  { cat: 'warehouse', code: 'OUT-202605-009', subject: '销售出库待OQC', date: '2026-05-17', customer: '海南微为科技', maxQty: '50台' },
  { cat: 'production', code: 'WO-202605-003', subject: '压装工序报工待检', date: '2026-05-17', customer: '生产一部', maxQty: '80件' },
  { cat: 'production', code: 'FG-202605-006', subject: '完工入库申请', date: '2026-05-17', customer: '生产一部', maxQty: '120台' },
  { cat: 'sales', code: 'SO-202605-001', subject: '客户出货验货', date: '2026-05-17', customer: '海南微为科技', maxQty: '50台' },
];

export const qcSourceBatches: Record<string, QcSourceBatch[]> = {
  'GRN-202605-018': [{ deliveryNo: 'GRN-202605-018', detailNo: 'GRN-LINE-01', deliveryDate: '2026-05-17', warehouse: '质检暂存仓', logistics: '供应商送货', qty: 10, status: '已收货待检' }],
  'OUT-202605-009': [{ deliveryNo: 'OUT-202605-009', detailNo: 'OUT-LINE-01', deliveryDate: '2026-05-17', warehouse: '成品仓', logistics: '顺丰', qty: 50, status: 'OQC待放行' }],
  'WO-202605-003': [{ deliveryNo: 'BG-20260517002', detailNo: 'BG-LINE-01', deliveryDate: '2026-05-17', warehouse: '产线A', logistics: '工序流转', qty: 80, status: '待质检' }],
  'FG-202605-006': [{ deliveryNo: 'FG-202605-006', detailNo: 'FG-LINE-01', deliveryDate: '2026-05-17', warehouse: '成品暂存区', logistics: '生产入库', qty: 120, status: '合格待入库' }],
  'SO-202605-001': [{ deliveryNo: 'OUT-202605-009', detailNo: 'SO-LINE-01', deliveryDate: '2026-05-17', warehouse: '成品仓', logistics: '客户验货', qty: 50, status: '待出货检验' }],
};

export const qcPlanOptions = standards
  .filter((item) => item.source.includes('检验方案') || item.source.includes('抽样规则'))
  .map((item) => ({ id: item.id, code: item.code, name: item.subject, stage: item.source, sampling: item.sampling || item.qty, status: item.status }));

export function listQcInspections(query: QcListQuery = {}): Promise<QcPageResult<QcInspection>> {
  return Promise.resolve(toPage(filterRows(inspections, query), query));
}

export function getQcInspection(id: string): Promise<QcInspection | undefined> {
  return Promise.resolve(inspections.find((item) => item.id === id || item.code === id) || inspections[0]);
}

export function createQcInspection(payload: Partial<QcInspection>): Promise<QcInspection> {
  const stage = (payload.stage || 'IQC') as QcInspection['stage'];
  const row: QcInspection = {
    id: `qc_${Date.now()}`,
    subject: payload.subject || '新增检验任务',
    code: payload.code || `${stage}-202605-${String(inspections.length + 1).padStart(3, '0')}`,
    source: payload.source || '手工创建',
    object: payload.object || '待选择检验对象',
    qty: payload.qty || '待抽样',
    inspector: payload.inspector || '老夏',
    date: payload.date || '2026-05-30',
    status: payload.status || '待报检',
    stage,
    lot: payload.lot || 'LOT-NEW',
    plan: payload.plan || '待选择质检方案',
    sampling: payload.sampling || '按方案带出',
    critical: payload.critical || '按方案带出',
    tone: toneByStatus(payload.status || '待报检'),
    sourceType: payload.sourceType || '手工创建',
    sourceModule: payload.sourceModule || 'manual',
    writebackAction: payload.writebackAction || '提交结果后按阶段回写来源单据',
  };
  inspections.unshift(row);
  return Promise.resolve({ ...row });
}

export function updateQcInspection(id: string, patch: Partial<QcInspection>): Promise<QcInspection | undefined> {
  const index = inspections.findIndex((item) => item.id === id || item.code === id);
  if (index < 0) return Promise.resolve(undefined);
  inspections[index] = { ...inspections[index], ...patch, tone: toneByStatus(patch.status || inspections[index].status) };
  return Promise.resolve({ ...inspections[index] });
}

export function submitQcResult(id: string, action = '放行') {
  const status = action.includes('拒收') ? '拒收退回' : action.includes('复检') ? '返工待复检' : action.includes('让步') ? '特采评审' : '已放行';
  return updateQcInspection(id, { status });
}

export function listQcExceptions(query: QcListQuery = {}): Promise<QcPageResult<QcException>> {
  return Promise.resolve(toPage(filterRows(exceptions, query), query));
}

export function getQcException(id: string): Promise<QcException | undefined> {
  return Promise.resolve(exceptions.find((item) => item.id === id || item.code === id) || exceptions[0]);
}

export function createQcException(payload: Partial<QcException>): Promise<QcException> {
  const row: QcException = {
    id: `ncr_${Date.now()}`,
    subject: payload.subject || '新增异常处置',
    code: payload.code || `NCR-202605-${String(exceptions.length + 1).padStart(3, '0')}`,
    source: payload.source || '待选择质检单',
    object: payload.object || '待确认责任对象',
    qty: payload.qty || '待确认影响数量',
    inspector: payload.inspector || '质检主管',
    date: payload.date || '2026-05-30',
    status: payload.status || '待处置',
    stage: 'NCR',
    lot: payload.lot || 'LOT-NCR',
    plan: payload.plan || '异常处置流程 V2.1',
    sampling: payload.sampling || '按异常等级复检',
    critical: payload.critical || '隔离库存/复检/整改验证',
    tone: toneByStatus(payload.status || '待处置'),
    severity: payload.severity || 'MAJOR',
    actionType: payload.actionType || '不合格记录',
  };
  exceptions.unshift(row);
  return Promise.resolve({ ...row });
}

export function updateQcException(id: string, patch: Partial<QcException>): Promise<QcException | undefined> {
  const index = exceptions.findIndex((item) => item.id === id || item.code === id);
  if (index < 0) return Promise.resolve(undefined);
  exceptions[index] = { ...exceptions[index], ...patch, tone: toneByStatus(patch.status || exceptions[index].status) };
  return Promise.resolve({ ...exceptions[index] });
}

export function submitQcExceptionAction(id: string, flow: string, payload: QcExceptionActionPayload): Promise<QcException | undefined> {
  const row = exceptions.find((item) => item.id === id || item.code === id);
  if (!row) return Promise.resolve(undefined);
  const action = payload.action || flow;
  const serial = row.code.match(/\d{6}-\d+$/)?.[0] || `${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(/-/g, '')}-${String(exceptions.length + 1).padStart(3, '0')}`;
  const basePatch: Partial<QcException> = {
    lastAction: action,
    lastActionOpinion: payload.opinion || '已按流程提交处理',
  };
  let status = row.status;
  let result = '已提交';
  let relatedDoc = row.code;
  if (action === 'transfer' || action === 'countersign') {
    result = action === 'transfer' ? '已转交处理，等待接收人确认' : '已提交加签会审，等待会审意见';
    relatedDoc = row.code;
    const log = buildExceptionActionLog(row, flow, action, payload, result, relatedDoc);
    return updateQcException(row.id, {
      ...basePatch,
      actionLogs: [...(row.actionLogs || []), log],
    });
  }
  if (flow === 'isolate') {
    relatedDoc = row.holdCode || `HOLD-${serial}`;
    status = '隔离中';
    result = action === 'reject-material' ? '已生成拒收/退供处置' : '已生成隔离冻结单';
    Object.assign(basePatch, {
      actionType: '隔离/拒收',
      critical: action === 'reject-material' ? '拒收/退供并回写来源单据' : '库存冻结/出货拦截/工序暂停',
      holdCode: relatedDoc,
      writebackStatus: action === 'reject-material' ? '待回写采购退货/出库拦截' : '已通知仓储执行隔离',
    });
  }
  if (flow === 'mrb') {
    relatedDoc = row.mrbCode || `MRB-${serial}`;
    status = '待处置';
    result = 'MRB评审结论已记录';
    const mrbPatch: Partial<QcException> = {
      mrbCode: relatedDoc,
      mrbDecision: actionLabel(flow, action),
      writebackStatus: 'MRB结论待回写来源单据',
    };
    if (action === 'mrb-recheck') {
      status = '复检中';
      Object.assign(mrbPatch, { actionType: '返工复检', recheckTaskCode: row.recheckTaskCode || `RCK-${serial}` });
    }
    if (action === 'mrb-release') {
      status = '让步审批';
      Object.assign(mrbPatch, { actionType: '让步放行', releaseCode: row.releaseCode || `DEV-${serial}` });
    }
    if (action === 'mrb-reject') {
      status = '隔离中';
      Object.assign(mrbPatch, { actionType: '隔离/拒收', holdCode: row.holdCode || `HOLD-${serial}` });
    }
    Object.assign(basePatch, {
      plan: 'MRB异常评审流程 V2.0',
      critical: 'MRB会审/责任分派/处置结论回写',
      ...mrbPatch,
    });
  }
  if (flow === 'capa') {
    relatedDoc = row.capaCode || `IMP-${serial}`;
    status = '整改中';
    result = '已生成整改跟踪流程';
    Object.assign(basePatch, {
      actionType: '整改跟踪',
      plan: '整改跟踪流程 V1.5',
      critical: '根因分析/纠正预防/效果验证',
      capaCode: relatedDoc,
    });
  }
  if (flow === 'recheck') {
    relatedDoc = row.recheckTaskCode || `RCK-${serial}`;
    status = '复检中';
    result = '已生成返工复检任务';
    Object.assign(basePatch, {
      actionType: '返工复检',
      plan: '返工复检加严方案 V1.0',
      critical: '复检结果回写来源单据',
      recheckTaskCode: relatedDoc,
    });
  }
  if (flow === 'release') {
    relatedDoc = row.releaseCode || `DEV-${serial}`;
    status = action === 'reject-release' ? '让步驳回' : '让步审批';
    result = action === 'reject-release' ? '已驳回让步放行' : '已提交让步放行审批';
    Object.assign(basePatch, {
      actionType: '让步放行',
      plan: '让步放行审批流程 V2.0',
      critical: action === 'reject-release' ? '让步放行被驳回，转异常处置' : '客户/内部确认后放行',
      releaseCode: relatedDoc,
    });
  }
  if (flow === 'close') {
    relatedDoc = row.closeCode || `CLS-${serial}`;
    const hasCloseEvidence = Boolean(row.capaCode || row.recheckTaskCode || row.releaseCode || row.holdCode || row.mrbCode || row.actionLogs?.length);
    status = action === 'return' || !hasCloseEvidence ? '整改退回' : '已关闭';
    result = action === 'return'
      ? '验证不通过，已退回整改'
      : hasCloseEvidence
        ? '验证通过，异常已关闭'
        : '缺少处置依据，已退回整改';
    Object.assign(basePatch, {
      critical: status === '整改退回' ? '整改退回后重新验证' : '异常闭环并回写来源',
      closeCode: relatedDoc,
      writebackStatus: status === '已关闭' ? '已回写来源单据并归档' : '待补充复检/MRB/整改依据',
    });
  }
  const log = buildExceptionActionLog(row, flow, action, payload, result, relatedDoc);
  return updateQcException(row.id, {
    ...basePatch,
    status,
    actionLogs: [...(row.actionLogs || []), log],
  });
}

export function listQcStandards(query: QcListQuery = {}): Promise<QcPageResult<QcStandard>> {
  return Promise.resolve(toPage(filterRows(standards, query), query));
}

export function getQcStandard(id: string): Promise<QcStandard | undefined> {
  return Promise.resolve(standards.find((item) => item.id === id || item.code === id) || standards[0]);
}

export function createQcStandard(payload: Partial<QcStandard>): Promise<QcStandard> {
  const row: QcStandard = {
    id: `std_${Date.now()}`,
    subject: payload.subject || '新增检验标准',
    code: payload.code || `PLAN-202605-${String(standards.length + 1).padStart(3, '0')}`,
    source: payload.source || '检验方案',
    object: payload.object || '通用',
    qty: payload.qty || 'V1.0 / AQL 1.0',
    inspector: payload.inspector || '老夏',
    date: payload.date || '2026-05-30',
    status: payload.status || '草稿',
    stage: 'STANDARD',
    version: payload.version || 'V1.0',
    sampling: payload.sampling || 'GB/T 2828.1 一般II AQL 1.0',
    defect: payload.defect || 'CR=0 / MA=1 / MI=3',
    approval: payload.approval || '待审批',
    judgementType: payload.judgementType || '分数值',
    criteria: payload.criteria || [],
    standardAttachments: payload.standardAttachments || [],
    standardDetail: payload.standardDetail || '',
    groupIds: payload.groupIds || [],
    standardIds: payload.standardIds || [],
    tone: toneByStatus(payload.status || '草稿'),
  };
  standards.unshift(row);
  return Promise.resolve({ ...row });
}

export function listQcReports(query: QcListQuery = {}): Promise<QcPageResult<QcReport>> {
  return Promise.resolve(toPage(filterRows(reports, query), query));
}

export function getQcReport(id: string): Promise<QcReport | undefined> {
  return Promise.resolve(reports.find((item) => item.id === id || item.code === id) || reports[0]);
}

export function getQcSettings(_resource: QcResource = 'qc-standards'): Promise<QcSettings> {
  return Promise.resolve(JSON.parse(JSON.stringify(settings)) as QcSettings);
}

export function patchQcSettings(patch: Partial<QcSettings>): Promise<QcSettings> {
  settings = { ...settings, ...patch };
  return getQcSettings();
}

export function toneByStatus(status: string): QcTone {
  if (['合格', '启用', '已生成', '已确认', '已放行', '合格待入库', '成品入库', '已归档', '已关闭'].includes(status)) return 'green';
  if (['不合格', '已拒收', '停用', '拒收退回', '客户拒收', '已拦截', '批退返工', '工序隔离', '冻结', '隔离中', '整改退回', '让步驳回'].includes(status)) return 'red';
  if (['巡检中', '整改中', '客户验货中', '复检中'].includes(status)) return 'blue';
  if (['未生成'].includes(status)) return 'gray';
  return 'yellow';
}

export function qcRowsForResource(resource: QcResource) {
  if (resource === 'qc-exceptions') return exceptions;
  if (resource === 'qc-standards') return standards;
  if (resource === 'qc-reports') return reports;
  return inspections;
}

function filterRows<T extends { subject: string; code: string; source: string; object: string; status: string; stage?: string; actionType?: string }>(rows: T[], query: QcListQuery) {
  const keyword = query.keyword?.trim();
  return rows.filter((row) => {
    const keywordOk = !keyword || [row.subject, row.code, row.source, row.object, row.status].some((value) => String(value || '').includes(keyword));
    const stageOk = !query.stage || row.stage === query.stage;
    const statusOk = !query.status || row.status === query.status;
    const categoryOk = !query.category || row.actionType === query.category || row.source === query.category || row.source.includes(query.category) || row.status === query.category || row.stage === query.category;
    return keywordOk && stageOk && statusOk && categoryOk;
  });
}

function toPage<T>(items: T[], query: QcListQuery): QcPageResult<T> {
  const pageNo = query.pageNo || 1;
  const pageSize = query.pageSize || 20;
  const start = (pageNo - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length };
}

function businessDateTime() {
  return new Date().toLocaleString('sv-SE', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  });
}

function buildExceptionActionLog(row: QcException, flow: string, action: string, payload: QcExceptionActionPayload, result: string, relatedDoc: string) {
  return {
    id: `act_${Date.now()}`,
    action: actionLabel(flow, action),
    operator: '老夏',
    time: businessDateTime(),
    opinion: payload.opinion || '同意按当前流程继续处理',
    result,
    relatedDoc: relatedDoc || row.code,
    transferTo: payload.transferTo,
    ccTo: payload.ccTo,
  };
}

function actionLabel(flow: string, action: string) {
  const map: Record<string, string> = {
    isolate: '隔离/拒收',
    'hold-stock': '隔离冻结',
    'reject-material': '拒收/退供',
    mrb: 'MRB评审',
    'mrb-recheck': 'MRB结论：返工复检',
    'mrb-release': 'MRB结论：让步放行',
    'mrb-reject': 'MRB结论：拒收/隔离',
    capa: '整改跟踪',
    'create-capa': '生成整改跟踪',
    recheck: '发起复检',
    'create-recheck': '发起复检',
    release: '让步放行',
    'submit-release': '提交让步放行',
    'reject-release': '驳回让步放行',
    close: '验证关闭',
    'verify-close': '验证关闭',
    return: '退回整改',
    transfer: '转交处理',
    countersign: '加签会审',
  };
  return map[action] || map[flow] || action;
}
