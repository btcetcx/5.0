import type { ApiMode, ListQuery, PageResult } from '@/app/api/shared/types';
import { request } from '@/app/request/http';
import recordsJson from '@/mock/production/records.json';
import pickersJson from '@/mock/production/pickers.json';
import detailTablesJson from '@/mock/production/detail-tables.json';
import workOrderReportingJson from '@/mock/production/work-order-reporting.json';
import demandSummaryJson from '@/mock/production/demand-summary.json';
import schedulesJson from '@/mock/production/schedules.json';
import type {
  OutsourceSupplier,
  ProductionDemandSummaryRow,
  ProductionDetail,
  ProductionDetailTable,
  ProductionScheduleData,
  ProductionScheduleCalendarException,
  ProductionScheduleEmployee,
  ProductionSchedulePlan,
  ProductionScheduleShift,
  ProductionScheduleTeam,
  ProductionWorkCalendar,
  ProductionWorkCalendarDay,
  ProductionWorkCalendarDayType,
  ProductionWorkCalendarMonth,
  ProductionPerson,
  ProductionPickerProduct,
  ProductionLine,
  ProductionRecord,
  ProductionResource,
  ProductionSource,
  WorkOrderAssignedTask,
  WorkOrderClaimTask,
  WorkOrderReportPeopleGroup,
  WorkOrderReportRecord,
} from './types';

type ProductionRecordMap = Record<ProductionResource, ProductionRecord[]>;

export type ProductionAction =
  | 'confirm'
  | 'approve'
  | 'close'
  | 'disable'
  | 'start'
  | 'generate-plan'
  | 'generate-order'
  | 'release-work-orders'
  | 'issue-materials'
  | 'receive'
  | 'material-issue'
  | 'report'
  | 'dispatch'
  | 'print'
  | 'export';

const mockRecords = recordsJson as ProductionRecordMap;
const demandSummary = demandSummaryJson as ProductionDemandSummaryRow[];
const scheduleData = schedulesJson as ProductionScheduleData;
const pickerData = pickersJson as {
  sources: ProductionSource[];
  products: ProductionPickerProduct[];
  people: ProductionPerson[];
  suppliers: OutsourceSupplier[];
};
const detailTables = detailTablesJson as Record<string, ProductionDetailTable>;
const workOrderReporting = workOrderReportingJson as {
  claimTasks: WorkOrderClaimTask[];
  assignedTasks: WorkOrderAssignedTask[];
  dispatchClaimRows: string[][];
  dispatchAssignRows: string[][];
  reportRecords: WorkOrderReportRecord[];
  reportDetailRows: string[][];
  reportPeople: WorkOrderReportPeopleGroup[];
};

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowCode() {
  return String(Date.now()).slice(-8);
}

function findRecord(resource: ProductionResource, id: string) {
  return (mockRecords[resource] || []).find((item) => item.id === id || item.code === id);
}

function statusForSubmittedProduction(resource: ProductionResource) {
  if (resource === 'production-demands') return { status: 'pendingConfirm', statusName: '待确认' };
  if (resource === 'production-orders') return { status: 'pendingProduction', statusName: '待生产' };
  if (resource === 'production-work-orders') return { status: 'pendingReport', statusName: '待报工' };
  if (resource === 'outsource-orders') return { status: 'pendingIssue', statusName: '待发料' };
  return { status: 'pendingApproval', statusName: '待审批' };
}

function updateRecordStatus(row: ProductionRecord | undefined, status: string, statusName: string) {
  if (!row) return;
  row.status = status;
  row.statusName = statusName;
}

function makePlanFromDemand(source: ProductionRecord, data: Record<string, unknown> = {}): ProductionRecord {
  const line = source.lines?.[0];
  const lines = source.lines?.length ? source.lines : (line ? [line] : []);
  const code = `MP-${nowCode()}`;
  return {
    id: `plan_${Date.now()}`,
    code,
    subject: `${source.productName || line?.productName || source.subject}生产计划`,
    sourceType: '生产需求',
    sourceCode: source.code,
    sourceName: source.subject,
    customerName: source.customerName,
    productName: line?.productName || source.productName,
    quantity: Number(line?.planQuantity || line?.demandQuantity || line?.quantity || source.quantity || 0),
    doneQuantity: 0,
    startDate: line?.startDate || source.startDate,
    endDate: line?.endDate || line?.deliveryDate || source.endDate,
    departmentName: source.departmentName,
    workshopName: source.workshopName || '待排产车间',
    lineName: source.lineName || '待排产产线',
    ownerName: source.ownerName || '计划员',
    priorityName: source.priorityName,
    status: 'pendingApproval',
    statusName: '待审批',
    kittingStatusName: '待齐套检查',
    bomVersion: line?.bomVersion || source.bomVersion,
    routeCode: line?.routeCode || source.routeCode,
    lines: lines.map((item, index) => ({
      ...item,
      id: `plan_line_${Date.now()}_${index}`,
      sourceType: '生产需求',
      sourceCode: source.code,
      sourceLine: item.sourceLine || `${source.code}-${index + 1}`,
      planQuantity: item.planQuantity || item.demandQuantity || item.quantity,
    })),
    detailText: String(data.detailText || source.detailText || ''),
  };
}

function resolveActionLines(source: ProductionRecord, data: Record<string, unknown> = {}) {
  const lines = source.lines?.length ? source.lines : [];
  const productId = String(data.productId || '');
  const sourceLine = String(data.sourceLine || '');
  const filtered = lines.filter((line) => {
    if (productId && line.id !== productId && line.productCode !== productId) return false;
    if (sourceLine && line.sourceLine !== sourceLine) return false;
    return true;
  });
  return filtered.length ? filtered : lines.slice(0, 1);
}

function makeOrderFromSource(source: ProductionRecord, data: Record<string, unknown> = {}, selectedLine?: ProductionLine): ProductionRecord {
  const line = selectedLine || resolveActionLines(source, data)[0];
  const code = `MO-${nowCode()}`;
  const lines = line ? [line] : (source.lines || []);
  const sourceType = source.code.startsWith('MR-') ? '生产需求' : '生产计划';
  return {
    id: `order_${Date.now()}`,
    code,
    subject: `${source.productName || line?.productName || source.subject}生产订单`,
    sourceType,
    sourceCode: source.code,
    sourceName: source.subject,
    customerName: source.customerName,
    productName: line?.productName || source.productName,
    quantity: Number(line?.planQuantity || line?.demandQuantity || line?.quantity || source.quantity || 0),
    doneQuantity: 0,
    startDate: line?.startDate || source.startDate,
    endDate: line?.endDate || line?.deliveryDate || source.endDate,
    departmentName: source.departmentName,
    workshopName: source.workshopName || '待分配车间',
    lineName: source.lineName || '待分配产线',
    ownerName: source.departmentName || source.ownerName || '生产主管',
    priorityName: source.priorityName,
    status: 'pendingProduction',
    statusName: '待生产',
    kittingStatusName: source.kittingStatusName || '待齐套检查',
    bomVersion: line?.bomVersion || source.bomVersion,
    routeCode: line?.routeCode || source.routeCode,
    lines: (source.lines || []).map((item, index) => ({
      ...item,
      id: `order_line_${Date.now()}_${index}`,
      sourceType,
      sourceCode: source.code,
      sourceLine: item.sourceLine || `${source.code}-${index + 1}`,
      quantity: item.planQuantity || item.demandQuantity || item.quantity,
    })),
    detailText: String(data.detailText || source.detailText || ''),
  };
}

function makeOrdersFromSource(source: ProductionRecord, data: Record<string, unknown> = {}): ProductionRecord[] {
  const lines = resolveActionLines(source, data);
  if (!lines.length) return [makeOrderFromSource(source, data)];
  return lines.map((line) => makeOrderFromSource(source, data, line));
}

function makeWorkOrdersFromOrder(source: ProductionRecord): ProductionRecord[] {
  const line = source.lines?.[0];
  const quantity = Number(line?.quantity || source.quantity || 0);
  const processRows = [
    { processSeq: '10', processName: '备料', processType: '准备工序', stationName: '线边仓' },
    { processSeq: '20', processName: line?.processName || '总装', processType: '关键工序', stationName: source.lineName || '总装产线A' },
    { processSeq: '30', processName: '包装', processType: '完工工序', stationName: '包装区01' },
  ];
  return processRows.map((process, index) => {
    const code = `WO-${nowCode()}-${index + 1}`;
    return {
      id: `work_order_${Date.now()}_${index}`,
      code,
      subject: `${process.processName}生产工单`,
      sourceType: '生产订单',
      sourceCode: source.code,
      sourceName: source.subject,
      customerName: source.customerName,
      productName: line?.productName || source.productName,
      quantity,
      doneQuantity: 0,
      startDate: source.startDate,
      endDate: source.endDate,
      departmentName: source.departmentName,
      workshopName: source.workshopName,
      lineName: source.lineName,
      ownerName: source.ownerName || '生产主管',
      bomVersion: source.bomVersion,
      routeCode: source.routeCode,
      status: 'pendingReport',
      statusName: '待报工',
      lines: [{
        ...(line || {}),
        id: `work_line_${Date.now()}_${index}`,
        sourceType: '生产订单',
        sourceCode: source.code,
        sourceLine: `${source.code}-${index + 1}`,
        productCode: line?.productCode || '',
        productName: line?.productName || source.productName,
        model: line?.model || '',
        unit: line?.unit || '件',
        quantity,
        processSeq: process.processSeq,
        processName: process.processName,
        processType: process.processType,
        stationName: process.stationName,
        workshopName: source.workshopName,
        lineName: source.lineName,
        ownerName: source.ownerName,
        planQuantity: quantity,
        completedQuantity: 0,
        goodQuantity: 0,
        badQuantity: 0,
        dispatchMode: '领工模式',
        standard: `${process.processName}按工艺路线执行`,
        statusName: '待报工',
      }],
    } as ProductionRecord;
  });
}

function rollupDoneBySource(sourceCode: string) {
  const workOrders = mockRecords['production-work-orders'] || [];
  const totalDone = workOrders
    .filter((item) => item.sourceCode === sourceCode)
    .reduce((sum, item) => sum + Number(item.doneQuantity || 0), 0);
  const order = findRecord('production-orders', sourceCode);
  if (order) {
    order.doneQuantity = totalDone;
    if (totalDone >= Number(order.quantity || 0)) updateRecordStatus(order, 'completed', '已完成');
    else if (totalDone > 0) updateRecordStatus(order, 'producing', '生产中');
    if (order.sourceCode) {
      const plan = findRecord('production-plans', order.sourceCode);
      if (plan) {
        plan.doneQuantity = Math.max(Number(plan.doneQuantity || 0), totalDone);
        if (Number(plan.doneQuantity || 0) >= Number(plan.quantity || 0)) updateRecordStatus(plan, 'completed', '已完成');
        else if (Number(plan.doneQuantity || 0) > 0) updateRecordStatus(plan, 'planning', '排产中');
        if (plan.sourceCode) {
          const demand = findRecord('production-demands', plan.sourceCode);
          if (demand) {
            demand.doneQuantity = Math.max(Number(demand.doneQuantity || 0), totalDone);
            if (Number(demand.doneQuantity || 0) >= Number(demand.quantity || 0)) updateRecordStatus(demand, 'completed', '已完成');
            else if (Number(demand.doneQuantity || 0) > 0) updateRecordStatus(demand, 'producing', '生产中');
          }
        }
      }
    }
  }
}

function syncDemandSummaryFromRecords() {
  demandSummary.forEach((row) => {
    const records = (mockRecords['production-demands'] || []).filter((item) => item.lines?.some((line) => line.productCode === row.code));
    if (!records.length) return;
    const done = records.reduce((sum, item) => sum + Number(item.doneQuantity || 0), 0);
    row.done = done;
    row.left = Math.max(0, Number(row.plan || 0) - done);
    row.status = row.left <= 0 ? '已完工' : done > 0 ? '生产中' : '待生产';
    row.sources = row.sources.map((source) => {
      const record = records.find((item) => item.code === source.sourceDoc || item.sourceCode === source.sourceDoc);
      const doneQty = record ? Number(record.doneQuantity || 0) : source.doneQty;
      return {
        ...source,
        doneQty,
        leftQty: Math.max(0, Number(source.demandQty || 0) - doneQty),
        status: doneQty >= Number(source.demandQty || 0) ? '已完工' : doneQty > 0 ? '生产中' : source.status,
      };
    });
  });
}

function ensureProductionCalendars() {
  if (scheduleData.calendars?.length) return;
  scheduleData.calendars = [
    {
      id: 'cal_std_2026',
      name: '2026标准工作日历',
      scope: '全公司',
      workMode: '双休',
      inheritFrom: '集团标准日历',
      holidayRule: '同步国务院法定节假日',
      swapRule: '调班日若循环为 R 自动改 A',
      status: '启用',
      exceptionsByMonth: {
        '2026-06': clone(scheduleData.calendarExceptions || []),
      },
    },
  ];
}

function findProductionCalendar(calendarId?: string) {
  ensureProductionCalendars();
  return scheduleData.calendars.find((item) => item.id === calendarId || item.name === calendarId) || scheduleData.calendars[0];
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatMonthDate(month: string, day: number) {
  return `${month}-${pad2(day)}`;
}

function labelForDate(dateText: string) {
  const date = new Date(`${dateText}T00:00:00`);
  return `${dateText.slice(5)} ${weekdayLabels[date.getDay()]}`;
}

function exceptionDate(exception: ProductionScheduleCalendarException, month: string) {
  if (exception.date) return exception.date;
  const matched = exception.day.match(/\d{2}-\d{2}/);
  return matched ? `${month.slice(0, 4)}-${matched[0]}` : '';
}

function dayTypeRule(type: ProductionWorkCalendarDayType) {
  if (type === '调班') return '按早班计算';
  if (type === '节假日') return '强制休 R';
  if (type === '休息') return '循环休息日';
  return '可排班';
}

function defaultCalendarDayType(calendar: ProductionWorkCalendar, date: Date, day: number): ProductionWorkCalendarDayType {
  const weekday = date.getDay();
  if (calendar.workMode === '单休') return weekday === 0 ? '休息' : '工作';
  if (calendar.workMode === '大小周') return weekday === 0 || (weekday === 6 && Math.ceil(day / 7) % 2 === 0) ? '休息' : '工作';
  return weekday === 0 || weekday === 6 ? '休息' : '工作';
}

function normalizeCalendarException(exception: ProductionScheduleCalendarException, month: string): ProductionScheduleCalendarException {
  const date = exceptionDate(exception, month);
  return {
    ...exception,
    date,
    day: exception.day || (date ? labelForDate(date) : ''),
  };
}

function buildProductionCalendarMonth(calendar: ProductionWorkCalendar, month: string): ProductionWorkCalendarMonth {
  const [year, monthIndex] = month.split('-').map(Number);
  const dayCount = new Date(year, monthIndex, 0).getDate();
  const exceptions = (calendar.exceptionsByMonth?.[month] || []).map((item) => normalizeCalendarException(item, month));
  const exceptionMap = new Map(exceptions.map((item) => [item.date || exceptionDate(item, month), item]));
  const days: ProductionWorkCalendarDay[] = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, monthIndex - 1, day);
    const dateText = formatMonthDate(month, day);
    const exception = exceptionMap.get(dateText);
    const type = (exception?.type as ProductionWorkCalendarDayType | undefined) || defaultCalendarDayType(calendar, date, day);
    return {
      date: dateText,
      day,
      weekday: weekdayLabels[date.getDay()],
      type,
      rule: exception?.rule || dayTypeRule(type),
      note: exception?.note,
    };
  });
  return {
    calendarId: calendar.id,
    month,
    days,
    exceptions,
  };
}

function syncedHolidayExceptions(month: string): ProductionScheduleCalendarException[] {
  if (month === '2026-06') {
    return [
      { date: '2026-06-01', day: '06-01 周一', type: '节假日', rule: '强制休 R', note: '端午假期调休' },
      { date: '2026-06-02', day: '06-02 周二', type: '节假日', rule: '强制休 R', note: '端午假期调休' },
      { date: '2026-06-08', day: '06-08 周一', type: '调班', rule: '若循环为 R 自动改 A', note: '补 06-01 工作量' },
    ];
  }
  return [];
}

function mergeCalendarExceptions(
  current: ProductionScheduleCalendarException[] = [],
  incoming: ProductionScheduleCalendarException[] = [],
  month: string,
) {
  const byDate = new Map<string, ProductionScheduleCalendarException>();
  current.forEach((item) => byDate.set(exceptionDate(item, month), normalizeCalendarException(item, month)));
  incoming.forEach((item) => byDate.set(exceptionDate(item, month), normalizeCalendarException(item, month)));
  return Array.from(byDate.values()).sort((a, b) => exceptionDate(a, month).localeCompare(exceptionDate(b, month)));
}

export function listProduction(resource: ProductionResource, query?: ListQuery, mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(mockRecords[resource] || [], query));
  return request<PageResult<ProductionRecord>>({ url: `/${resource}`, method: 'GET', params: query });
}

export function listProductionDemandSummary(query?: ListQuery, mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(demandSummary, query));
  return request<PageResult<ProductionDemandSummaryRow>>({ url: '/production-demands/summary', method: 'GET', params: query });
}

export function getProductionScheduleData(mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    ensureProductionCalendars();
    return Promise.resolve(clone(scheduleData));
  }
  return request<ProductionScheduleData>({ url: '/production-schedules', method: 'GET' });
}

export function listProductionWorkCalendars(mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    ensureProductionCalendars();
    return Promise.resolve(clone(scheduleData.calendars));
  }
  return request<ProductionWorkCalendar[]>({ url: '/production-schedules/calendars', method: 'GET' });
}

export function getProductionWorkCalendarMonth(calendarId: string, month: string, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const calendar = findProductionCalendar(calendarId);
    return Promise.resolve(buildProductionCalendarMonth(calendar, month));
  }
  return request<ProductionWorkCalendarMonth>({
    url: `/production-schedules/calendars/${calendarId}/months/${month}`,
    method: 'GET',
  });
}

export function createProductionWorkCalendar(data: Partial<ProductionWorkCalendar> & Record<string, unknown>, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    ensureProductionCalendars();
    const month = String(data.month || '2026-06');
    const source = findProductionCalendar(String(data.baseCalendarId || ''));
    const exceptions = Array.isArray(data.exceptions)
      ? (data.exceptions as ProductionScheduleCalendarException[]).map((item) => normalizeCalendarException(item, month))
      : clone(source.exceptionsByMonth?.[month] || []);
    const calendar: ProductionWorkCalendar = {
      id: String(data.id || `cal_${Date.now()}`),
      name: String(data.name || '新增工作日历'),
      scope: String(data.scope || '全公司'),
      workMode: String(data.workMode || '双休'),
      inheritFrom: String(data.inheritFrom || '集团标准日历'),
      holidayRule: String(data.holidayRule || '同步国务院法定节假日'),
      swapRule: String(data.swapRule || '调班日若循环为 R 自动改 A'),
      status: String(data.status || '启用'),
      exceptionsByMonth: {
        [month]: exceptions,
      },
    };
    scheduleData.calendars = [calendar, ...scheduleData.calendars];
    return Promise.resolve(clone(calendar));
  }
  return request<ProductionWorkCalendar>({ url: '/production-schedules/calendars', method: 'POST', data });
}

export function updateProductionWorkCalendar(
  calendarId: string,
  data: Partial<ProductionWorkCalendar> & { month?: string; exceptions?: ProductionScheduleCalendarException[] } & Record<string, unknown>,
  mode: ApiMode = 'mock',
) {
  if (mode === 'mock') {
    ensureProductionCalendars();
    const calendar = findProductionCalendar(calendarId);
    const month = data.month || '2026-06';
    calendar.name = String(data.name || calendar.name);
    calendar.scope = String(data.scope || calendar.scope);
    calendar.workMode = String(data.workMode || calendar.workMode);
    calendar.inheritFrom = String(data.inheritFrom || calendar.inheritFrom);
    calendar.holidayRule = String(data.holidayRule || calendar.holidayRule);
    calendar.swapRule = String(data.swapRule || calendar.swapRule);
    calendar.status = String(data.status || calendar.status);
    calendar.exceptionsByMonth ||= {};
    if (Array.isArray(data.exceptions)) {
      calendar.exceptionsByMonth[month] = data.exceptions
        .map((item) => normalizeCalendarException(item, month))
        .sort((a, b) => exceptionDate(a, month).localeCompare(exceptionDate(b, month)));
      if (calendar.id === scheduleData.calendars[0]?.id) scheduleData.calendarExceptions = clone(calendar.exceptionsByMonth[month]);
    }
    return Promise.resolve({
      calendar: clone(calendar),
      month: buildProductionCalendarMonth(calendar, month),
      successAt: new Date().toISOString(),
    });
  }
  return request<{
    calendar: ProductionWorkCalendar;
    month: ProductionWorkCalendarMonth;
    successAt: string;
  }>({
    url: `/production-schedules/calendars/${calendarId}`,
    method: 'PATCH',
    data,
  });
}

export function syncProductionCalendarHolidays(calendarId: string, month: string, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const calendar = findProductionCalendar(calendarId);
    calendar.exceptionsByMonth ||= {};
    const synced = syncedHolidayExceptions(month);
    calendar.exceptionsByMonth[month] = mergeCalendarExceptions(calendar.exceptionsByMonth[month], synced, month);
    if (calendar.id === scheduleData.calendars[0]?.id) scheduleData.calendarExceptions = clone(calendar.exceptionsByMonth[month]);
    const calendarMonth = buildProductionCalendarMonth(calendar, month);
    return Promise.resolve({
      calendar: clone(calendar),
      month: calendarMonth,
      message: synced.length ? `已同步 ${month} 法定节假日，更新 ${synced.length} 条例外日` : `${month} 未匹配到法定节假日，已记录同步检查`,
      successAt: new Date().toISOString(),
    });
  }
  return request<{
    calendar: ProductionWorkCalendar;
    month: ProductionWorkCalendarMonth;
    message: string;
    successAt: string;
  }>({
    url: `/production-schedules/calendars/${calendarId}/sync-holidays`,
    method: 'POST',
    data: { month },
  });
}

export function createProductionScheduleItem(
  type: 'shift' | 'calendar' | 'team' | 'plan' | 'roster',
  data: Record<string, unknown>,
  mode: ApiMode = 'mock',
) {
  if (type === 'calendar') return createProductionWorkCalendar(data, mode);
  if (mode === 'mock') {
    if (type === 'shift') scheduleData.shifts = [data as unknown as ProductionScheduleShift, ...scheduleData.shifts];
    if (type === 'team') scheduleData.teams = [data as unknown as ProductionScheduleTeam, ...scheduleData.teams];
    if (type === 'plan') scheduleData.plans = [data as unknown as ProductionSchedulePlan, ...scheduleData.plans];
    if (type === 'roster') scheduleData.employees = [data as unknown as ProductionScheduleEmployee, ...scheduleData.employees];
    return Promise.resolve({ ...data, type, successAt: new Date().toISOString() });
  }
  return request<Record<string, unknown>>({ url: `/production-schedules/${type}`, method: 'POST', data });
}

export function updateProductionScheduleCell(
  data: { employeeNo: string; dayIndex: number; shift: string; reason?: string },
  mode: ApiMode = 'mock',
) {
  if (mode === 'mock') {
    const employee = scheduleData.employees.find((item) => item.no === data.employeeNo);
    if (employee) {
      employee.shifts[data.dayIndex] = data.shift;
      employee.source = '手工调整';
      employee.reason = data.reason || '班次调整';
    }
    return Promise.resolve({ ...data, successAt: new Date().toISOString() });
  }
  return request<Record<string, unknown>>({ url: '/production-schedules/roster/cell', method: 'POST', data });
}

export function runProductionScheduleAction(action: string, data: Record<string, unknown> = {}, mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve({ action, ...data, successAt: new Date().toISOString() });
  return request<Record<string, unknown>>({ url: `/production-schedules/${action}`, method: 'POST', data });
}

export function createProduction(resource: ProductionResource, data: Partial<ProductionRecord> & Record<string, unknown>, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const prefix = resource === 'production-demands' ? 'demand' : resource === 'production-plans' ? 'plan' : resource === 'production-orders' ? 'order' : resource === 'production-work-orders' ? 'work_order' : 'outsource';
    const codePrefix = resource === 'production-demands' ? 'MR' : resource === 'production-plans' ? 'MP' : resource === 'production-orders' ? 'MO' : resource === 'production-work-orders' ? 'WO' : 'OS';
    const generatedCode = `${codePrefix}-${Date.now()}`;
    const submittedStatus = data.status ? { status: data.status, statusName: data.statusName || data.status } : statusForSubmittedProduction(resource);
    const record = {
      ...data,
      id: data.id || `${prefix}_${Date.now()}`,
      code: data.code && data.code !== '系统自动生成' ? data.code : generatedCode,
      ...submittedStatus,
    } as ProductionRecord;
    mockRecords[resource] = [record, ...(mockRecords[resource] || [])];
    syncDemandSummaryFromRecords();
    return Promise.resolve(record);
  }
  return request<ProductionRecord>({ url: `/${resource}`, method: 'POST', data });
}

export function getProductionDetail(resource: ProductionResource, id: string, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const row = (mockRecords[resource] || []).find((item) => item.id === id || item.code === id) || (mockRecords[resource] || [])[0];
    return Promise.resolve(toProductionDetail(row, resource));
  }
  return request<ProductionDetail>({ url: `/${resource}/${id}`, method: 'GET' });
}

export function updateProduction(resource: ProductionResource, id: string, data: Partial<ProductionDetail>, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const rows = mockRecords[resource] || [];
    const index = rows.findIndex((item) => item.id === id || item.code === id);
    if (index >= 0) rows[index] = { ...rows[index], ...data };
    return Promise.resolve(toProductionDetail(rows[index] || data as ProductionRecord, resource));
  }
  return request<ProductionDetail>({ url: `/${resource}/${id}`, method: 'PATCH', data });
}

export function deleteProduction(resource: ProductionResource, id: string, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const before = mockRecords[resource] || [];
    mockRecords[resource] = before.filter((item) => item.id !== id && item.code !== id);
    syncDemandSummaryFromRecords();
    return Promise.resolve({ id, resource, successAt: new Date().toISOString() });
  }
  return request<Record<string, unknown>>({ url: `/${resource}/${id}`, method: 'DELETE' });
}

export function approveProduction(resource: ProductionResource, id: string, data: Record<string, unknown> = {}, mode: ApiMode = 'mock') {
  return runProductionAction(resource, id, 'approve', data, mode);
}

export function printProduction(resource: ProductionResource, id: string, mode: ApiMode = 'mock') {
  return runProductionAction(resource, id, 'print', {}, mode);
}

export function exportProduction(resource: ProductionResource, id: string, mode: ApiMode = 'mock') {
  return runProductionAction(resource, id, 'export', {}, mode);
}

export function dispatchProduction(resource: ProductionResource, id: string, data: Record<string, unknown> = {}, mode: ApiMode = 'mock') {
  return runProductionAction(resource, id, 'dispatch', data, mode);
}

export function reportProduction(resource: ProductionResource, id: string, data: Record<string, unknown> = {}, mode: ApiMode = 'mock') {
  return runProductionAction(resource, id, 'report', data, mode);
}

export function runProductionAction(resource: ProductionResource, id: string, action: ProductionAction, data: Record<string, unknown> = {}, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const row = findRecord(resource, id);
    if (action === 'confirm') updateRecordStatus(row, 'confirmed', '已确认');
    if (action === 'approve') updateRecordStatus(row, 'approved', '已批准');
    if (action === 'close') updateRecordStatus(row, 'closed', '已关闭');
    if (action === 'disable') updateRecordStatus(row, 'disabled', '已停用');
    if (action === 'start') updateRecordStatus(row, 'planning', '排产中');
    if (row && resource === 'production-demands' && action === 'generate-plan') {
      const plan = makePlanFromDemand(row, data);
      mockRecords['production-plans'] = [plan, ...(mockRecords['production-plans'] || [])];
      updateRecordStatus(row, 'generatedPlan', '已转计划');
    }
    if (row && (resource === 'production-demands' || resource === 'production-plans') && action === 'generate-order') {
      const orders = makeOrdersFromSource(row, data);
      mockRecords['production-orders'] = [...orders, ...(mockRecords['production-orders'] || [])];
      updateRecordStatus(row, resource === 'production-demands' ? 'generatedOrder' : 'ordered', resource === 'production-demands' ? '已转订单' : '已生成订单');
    }
    if (row && resource === 'production-orders' && action === 'release-work-orders') {
      const workOrders = makeWorkOrdersFromOrder(row);
      mockRecords['production-work-orders'] = [...workOrders, ...(mockRecords['production-work-orders'] || [])];
      updateRecordStatus(row, 'producing', '生产中');
    }
    if (row && resource === 'outsource-orders' && action === 'issue-materials') updateRecordStatus(row, 'processing', '加工中');
    if (row && resource === 'outsource-orders' && action === 'receive') updateRecordStatus(row, 'pendingQc', '待质检');
    if (row && resource === 'production-work-orders' && action === 'material-issue') {
      updateRecordStatus(row, 'producing', '生产中');
      const processName = String(data.processName || '');
      row.lines = (row.lines || []).map((line) => {
        if (processName && line.processName !== processName) return line;
        return { ...line, issueStatus: 'issued', issueStatusName: '已领料', remark: line.remark || '工序领料已回写' } as ProductionLine;
      });
    }
    syncDemandSummaryFromRecords();
    return Promise.resolve({ id, resource, action, record: row ? clone(row) : undefined, ...data, successAt: new Date().toISOString() });
  }
  return request<Record<string, unknown>>({ url: `/${resource}/${id}/${action}`, method: 'POST', data });
}

export function listProductionSources(types?: string[], mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const allowed = types?.length ? new Set(types) : null;
    const rows = allowed ? pickerData.sources.filter((row) => allowed.has(row.type)) : pickerData.sources;
    return Promise.resolve(rows.map((row) => {
      const product = pickerData.products.find((item) => item.productCode === row.productRef.productCode);
      return {
        ...row,
        productRef: {
          ...row.productRef,
          bomLock: row.productRef.bomLock || product?.bomLock,
          routeLock: row.productRef.routeLock || product?.routeLock,
          price: row.productRef.price || product?.price,
          completedQuantity: row.productRef.completedQuantity ?? product?.reportedQuantity,
          goodQuantity: row.productRef.goodQuantity ?? product?.goodQuantity,
          badQuantity: row.productRef.badQuantity ?? product?.badQuantity,
          inboundQuantity: row.productRef.inboundQuantity ?? product?.inboundQuantity,
        },
      };
    }));
  }
  return request<ProductionSource[]>({ url: '/production-demand-sources', method: 'GET', params: types?.length ? { types: types.join(',') } : undefined });
}

export function listProductionProducts(mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(pickerData.products);
  return request<ProductionPickerProduct[]>({ url: '/production-products', method: 'GET' });
}

export function listProductionPeople(mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(pickerData.people);
  return request<ProductionPerson[]>({ url: '/production-people', method: 'GET' });
}

export function listOutsourceSuppliers(mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(pickerData.suppliers);
  return request<OutsourceSupplier[]>({ url: '/outsource-suppliers', method: 'GET' });
}

export function listWorkOrderClaimTasks(query?: ListQuery, mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(workOrderReporting.claimTasks, query));
  return request<PageResult<WorkOrderClaimTask>>({ url: '/production-work-orders/claim-tasks', method: 'GET', params: query });
}

export function listWorkOrderAssignedTasks(query?: ListQuery, mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(workOrderReporting.assignedTasks, query));
  return request<PageResult<WorkOrderAssignedTask>>({ url: '/production-work-orders/assigned-tasks', method: 'GET', params: query });
}

export function listWorkOrderReportRecords(query?: ListQuery, mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(toPageResult(workOrderReporting.reportRecords, query));
  return request<PageResult<WorkOrderReportRecord>>({ url: '/production-work-orders/report-records', method: 'GET', params: query });
}

export function listWorkOrderReportPeople(mode: ApiMode = 'mock') {
  if (mode === 'mock') return Promise.resolve(workOrderReporting.reportPeople);
  return request<WorkOrderReportPeopleGroup[]>({ url: '/production-work-orders/report-people', method: 'GET' });
}

export function getWorkOrderReportDetail(row: Partial<WorkOrderReportRecord> = {}, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const total = workOrderReporting.reportDetailRows.reduce((sum, item) => sum + (Number(item[3]) || 0), 0);
    const good = workOrderReporting.reportDetailRows.reduce((sum, item) => sum + (Number(item[4]) || 0), 0);
    const bad = workOrderReporting.reportDetailRows.reduce((sum, item) => sum + (Number(item[5]) || 0), 0);
    return Promise.resolve({
      metrics: [
        { label: '工单编号', value: row.workNo || '-' },
        { label: '工序名称', value: row.process || '-' },
        { label: '累计报工', value: String(total) },
        { label: '合格数量', value: String(good) },
        { label: '不良数量', value: String(bad) },
      ],
      rows: workOrderReporting.reportDetailRows,
    });
  }
  return request<Record<string, unknown>>({ url: '/production-work-orders/report-detail', method: 'GET', params: row });
}

export function getWorkOrderDispatchDetail(row: Partial<WorkOrderClaimTask & WorkOrderAssignedTask> = {}, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const total = Number(row.planQty || row.assignQty || 120);
    const claimed = workOrderReporting.dispatchClaimRows.reduce((sum, item) => sum + (Number(item[2]) || 0), 0);
    const assigned = workOrderReporting.dispatchAssignRows.reduce((sum, item) => sum + (Number(item[2]) || 0), 0);
    const reported = [...workOrderReporting.dispatchClaimRows, ...workOrderReporting.dispatchAssignRows].reduce((sum, item) => sum + (Number(item[3]) || 0), 0);
    return Promise.resolve({
      metrics: [
        { label: '计划总数', value: String(total) },
        { label: '已领数量', value: String(claimed) },
        { label: '已派数量', value: String(assigned) },
        { label: '已报工数量', value: String(reported) },
        { label: '剩余未分配', value: String(Math.max(0, total - claimed - assigned)) },
        { label: '剩余待报工', value: String(Math.max(0, claimed + assigned - reported)) },
      ],
      claimRows: workOrderReporting.dispatchClaimRows,
      assignRows: workOrderReporting.dispatchAssignRows,
    });
  }
  return request<Record<string, unknown>>({ url: '/production-work-orders/dispatch-detail', method: 'GET', params: row });
}

export function createWorkOrderClaim(data: Partial<WorkOrderClaimTask> & { claimQty?: number | string }, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const claimQty = Number(data.claimQty || data.canClaim || 0);
    const task = workOrderReporting.claimTasks.find((item) => item.id === data.id || item.workNo === data.workNo);
    if (task) {
      task.claimedQty = Number(task.claimedQty || 0) + claimQty;
      task.canClaim = Math.max(0, Number(task.canClaim || 0) - claimQty);
      task.status = task.canClaim > 0 ? '部分领取' : '已领完';
    }
    const record: WorkOrderAssignedTask = {
      id: `assigned_${Date.now()}`,
      workNo: data.workNo || 'WO-20260517001',
      product: data.product || '智能温控终端',
      process: data.process || '总装',
      assignTo: '当前用户',
      assignQty: claimQty,
      reportedQty: 0,
      leftQty: claimQty,
      station: data.station || '总装工位01',
      assigner: '自主领工',
      status: '待报工',
    };
    workOrderReporting.assignedTasks = [record, ...workOrderReporting.assignedTasks];
    return Promise.resolve(record);
  }
  return request<WorkOrderAssignedTask>({ url: '/production-work-orders/claim-tasks', method: 'POST', data });
}

export function createWorkOrderReport(data: Partial<WorkOrderReportRecord>, mode: ApiMode = 'mock') {
  if (mode === 'mock') {
    const reportedQty = Number(data.reportedQty || 0);
    const goodQty = Number(data.goodQty || Math.max(0, reportedQty - Number(data.badQty || 0)));
    const badQty = Number(data.badQty || Math.max(0, reportedQty - goodQty));
    const record: WorkOrderReportRecord = {
      id: `report_record_${Date.now()}`,
      workNo: data.workNo || 'WO-20260517001',
      product: data.product || '智能温控终端',
      process: data.process || '总装',
      dept: data.dept || '生产一部',
      person: data.person || '三红',
      source: data.source || '领工派工',
      planQty: Number(data.planQty || 120),
      allowQty: data.allowQty || 80,
      reportedQty,
      goodQty,
      badQty,
      count: Number(data.count || 1),
      lastTime: data.lastTime || '2026-05-20 17:30',
      status: '待质检',
    };
    workOrderReporting.reportRecords = [record, ...workOrderReporting.reportRecords];
    const assigned = workOrderReporting.assignedTasks.find((item) => item.workNo === record.workNo && item.process === record.process);
    if (assigned) {
      assigned.reportedQty = Number(assigned.reportedQty || 0) + reportedQty;
      assigned.leftQty = Math.max(0, Number(assigned.assignQty || 0) - Number(assigned.reportedQty || 0));
      assigned.status = assigned.leftQty <= 0 ? '已完成' : '生产中';
    }
    const workOrder = findRecord('production-work-orders', record.workNo);
    if (workOrder) {
      workOrder.doneQuantity = Math.min(Number(workOrder.quantity || 0), Number(workOrder.doneQuantity || 0) + reportedQty);
      workOrder.lines = (workOrder.lines || []).map((line) => ({
        ...line,
        completedQuantity: Math.min(Number(line.quantity || workOrder.quantity || 0), Number(line.completedQuantity || 0) + reportedQty),
        goodQuantity: Number(line.goodQuantity || 0) + goodQty,
        badQuantity: Number(line.badQuantity || 0) + badQty,
        statusName: Number(workOrder.doneQuantity || 0) >= Number(workOrder.quantity || 0) ? '已完成' : '生产中',
      }));
      if (Number(workOrder.doneQuantity || 0) >= Number(workOrder.quantity || 0)) updateRecordStatus(workOrder, 'reported', '已报工');
      else updateRecordStatus(workOrder, 'producing', '生产中');
      if (workOrder.sourceCode) rollupDoneBySource(workOrder.sourceCode);
    }
    syncDemandSummaryFromRecords();
    return Promise.resolve(record);
  }
  return request<WorkOrderReportRecord>({ url: '/production-work-orders/report-records', method: 'POST', data });
}

function toProductionDetail(row: ProductionRecord | undefined, resource: ProductionResource): ProductionDetail {
  const base = row || {
    id: '',
    code: '',
    subject: '',
    sourceType: '',
    sourceCode: '',
    productName: '',
    quantity: 0,
    startDate: '',
    endDate: '',
    ownerName: '',
    status: '',
    statusName: '',
    lines: [],
  };
  return {
    ...base,
    detailText: base.detailText || '生产要求：按当前确认的需求数量组织排产，优先保障交付日期；工艺说明：执行已锁定的 BOM 与工艺路线，关键工序需按检验标准留痕；齐套要求：开工前完成物料齐套确认，异常缺料需提交处理意见；交付约束：按计划周期跟踪进度，影响交付时及时预警并记录原因。',
    attachments: base.attachments || [
      { name: '生产工艺卡.pdf', size: '248 KB', date: '2026-05-17 10:25' },
      { name: resource === 'outsource-orders' ? '委外协议.pdf' : '生产说明.docx', size: '128 KB', date: '2026-05-17 10:40' },
    ],
    detailTables,
  } as ProductionDetail;
}
