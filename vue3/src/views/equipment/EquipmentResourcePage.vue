<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  acceptRepair,
  changeAssetStatus,
  closeInspectionException,
  closeRepair,
  completeInspection,
  completeMaintenance,
  createRowForModule,
  createSpareRequest,
  dispatchRepair,
  equipmentPeopleDepts,
  equipmentPickerColumns,
  equipmentStatusOptions,
  generateMaintenanceExecution,
  generateRepairFromInspection,
  getEquipmentSettings,
  getRowForModule,
  listSpareRequests,
  listRowsForModule,
  repairStatusOptions,
  sparePickerColumns,
  submitRepairResult,
  toneByStatus,
} from '@/app/api/equipment/resources';
import type { EquipmentAsset, EquipmentModule, EquipmentSettingRow, InspectionRecord, MaintenancePlan, MaintenanceProjectSetting, RepairOrder, SparePart, SpareRequest, SpareUsage } from '@/app/api/equipment/types';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import type { DetailAction, DetailFieldItem, DetailTabItem } from '@/components/detail-page/types';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwCategoryPickerModal from '@/components/form-page/AwCategoryPickerModal.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwOptionPickerModal, { type OptionPickerRow } from '@/components/form-page/AwOptionPickerModal.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import AwSearchTriggerInput from '@/components/form-page/AwSearchTriggerInput.vue';
import type { AttachmentRow, CategoryPickerConfirmPayload, CategoryPickerGroup, EditableColumn } from '@/components/form-page/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode, ToolbarActionKey } from '@/components/list-page/types';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import type { PersonPickerPerson } from '@/components/setting-page/types';
import EquipmentSettingPage from './shared/EquipmentSettingPage.vue';

type EquipmentRow = EquipmentAsset | MaintenancePlan | RepairOrder | InspectionRecord | SparePart;

interface ModuleConfig {
  title: string;
  createLabel: string;
  searchPlaceholder: string;
  linkKey: string;
  columns: AwTableColumn[];
  tree: { title: string; nodes: AwTreeNode[] };
  tabs: DetailTabItem[];
  actions?: ToolbarActionKey[];
  bulkActions?: AwBulkAction[];
}

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const pickedTree = ref('all');
const rows = ref<EquipmentRow[]>([]);
const detailRow = ref<EquipmentRow | null>(null);
const activeTab = ref('');
const toastText = ref('');
const columnFilters = reactive<Record<string, string>>({});
const showPersonPicker = ref(false);
const personTarget = ref<'ownerName' | 'assignee' | 'inspector' | 'reporter' | 'requester'>('ownerName');
const pickedPersons = ref<PersonPickerPerson[]>([]);
const showEquipmentPicker = ref(false);
const showSparePicker = ref(false);
const showStatusModal = ref(false);
const showDispatchModal = ref(false);
const showRepairProcessModal = ref(false);
const showAcceptModal = ref(false);
const showCloseRepairModal = ref(false);
const showMaintenanceModal = ref(false);
const showInspectionModal = ref(false);
const showSpareRequestModal = ref(false);
const showMaintenanceItemPicker = ref(false);
const showEquipmentCategoryPicker = ref(false);
const showWorkshopLinePicker = ref(false);
const showMaintenancePlanPicker = ref(false);
const showInspectionPlanPicker = ref(false);
const statusDraft = ref('运行中');
const form = reactive<Record<string, any>>({});
const attachments = ref<AttachmentRow[]>([{ id: 1, name: '', type: '设备附件', date: currentDate(), remark: '' }]);
const subRows = ref<Record<string, any>[]>([]);
const spareUsages = ref<SpareUsage[]>([]);
const richText = ref('');
const currentLoginUserName = '老夏';
const defaultEquipmentCategoryOptions = ['机加工设备', '成型设备', '焊接设备', '装配设备', '包装设备', '空压系统', '配电设备', '冷却水系统', '起重运输设备', '工装夹具设备', '检测仪器', '在线检具', '环保处理设备', '安全消防设备'];
const equipmentCategoryOptions = ref([...defaultEquipmentCategoryOptions]);
const equipmentCategoryRows = ref<EquipmentSettingRow[]>([]);
const spareCategoryOptions = ref(['机械备件', '动力备件']);
const maintenanceItemOptions = ref<MaintenanceProjectSetting[]>([]);
const repairTaskStatusOptions = ['维修中', '待验收', '返修中', '已完成'];
const workshopLineOptions: CategoryPickerGroup[] = [
  {
    key: '一车间',
    label: '一车间',
    icon: 'line-folder',
    children: [
      { key: '机加工产线A', label: '机加工产线A', code: 'WS1-LINE-A', desc: '一车间机加工主产线' },
    ],
  },
  {
    key: '动力站',
    label: '动力站',
    icon: 'line-folder',
    children: [
      { key: '公共动力', label: '公共动力', code: 'POWER-COMMON', desc: '空压、配电、冷却水等公共动力产线' },
    ],
  },
  {
    key: '包装车间',
    label: '包装车间',
    icon: 'line-folder',
    children: [
      { key: '包装线A', label: '包装线A', code: 'PACK-LINE-A', desc: '包装车间自动包装产线' },
    ],
  },
];

const moduleKey = computed<EquipmentModule>(() => {
  if (route.path.includes('/maintenance')) return 'maintenance';
  if (route.path.includes('/repairs')) return 'repairs';
  if (route.path.includes('/inspections')) return 'inspections';
  if (route.path.includes('/spares')) return 'spares';
  return 'assets';
});
const settingKey = computed(() => String(route.query.setting || settingFromAction(String(route.query.action || '')) || ''));
const action = computed(() => String(route.query.action || ''));
const viewMode = computed(() => String(route.query.view || viewFromAction(action.value) || ''));
const isCreate = computed(() => ['new', '保养计划', '新增保养', '报修申请', '点检计划', '点检执行', '备件库存', '备件申请'].includes(action.value));
const detailId = computed(() => String(route.query.id || ''));
const currentConfig = computed(() => configs[moduleKey.value]);
const showListTree = computed(() => !['maintenance'].includes(moduleKey.value));
const isRepairTaskView = computed(() => moduleKey.value === 'repairs' && viewMode.value === 'acceptance');
const listTitle = computed(() => {
  const map: Record<string, string> = {
    execution: '保养执行',
    dispatch: '维修派工',
    acceptance: '维修任务',
    exceptions: '点检异常',
    purchase: '备件采购',
  };
  return map[viewMode.value] || currentConfig.value.title;
});
const formTitle = computed(() => {
  if (action.value === '新增保养') return '新增保养';
  if (action.value === '保养计划') return '新增保养计划';
  if (action.value === '备件申请') return '备件申请';
  if (action.value === '点检执行') return '点检执行';
  if (action.value === '点检计划') return '新增点检计划';
  if (action.value === '报修申请') return '报修申请';
  return currentConfig.value.createLabel;
});
const repairTaskFlowStats = computed(() => {
  const sourceRows = rows.value as RepairOrder[];
  return [
    { key: 'reported', label: '报修记录', value: sourceRows.length },
    { key: 'dispatch', label: '待派工', value: sourceRows.filter((item) => item.status === '待派工').length },
    { key: 'task', label: '维修任务', value: sourceRows.filter((item) => isRepairTaskRow(item)).length },
    { key: 'acceptance', label: '待验收', value: sourceRows.filter((item) => item.status === '待验收' || item.acceptanceStatus === '待验收').length },
  ];
});
const listSearchPlaceholder = computed(() => (isRepairTaskView.value ? '搜索任务单、来源报修、设备、维修人员' : currentConfig.value.searchPlaceholder));
const listToolbarActions = computed<ToolbarActionKey[]>(() => (isRepairTaskView.value ? commonToolbar.filter((item) => item !== 'create') : currentConfig.value.actions || commonToolbar));
const treeTotal = computed(() => (isRepairTaskView.value ? rows.value.filter((row) => isRepairTaskRow(row)).length : rows.value.length));
const repairTaskColumns: AwTableColumn[] = [
  col('code', '来源报修单', 150),
  col('topic', '维修任务', 180, true),
  col('equipmentName', '设备', 160),
  col('faultCategory', '故障分类', 110),
  col('repairLevel', '维修等级', 90),
  col('reportNode', '报修节点', 170),
  col('dispatchInfo', '派工信息', 170),
  col('plannedWindow', '计划时间', 190),
  col('actualWindow', '实际时间', 190),
  col('taskProgress', '任务进度', 110),
  col('status', '任务状态', 100, false, repairTaskStatusOptions),
  col('acceptanceStatus', '验收状态', 110, false, ['未验收', '待验收', '验收通过', '验收驳回', '无需验收']),
  actionCol(),
];
const activeTree = computed(() => {
  if (isRepairTaskView.value) {
    const taskRows = rows.value.filter((row) => isRepairTaskRow(row));
    return {
      title: '任务状态',
      nodes: [
        { key: 'all', label: '全部任务', count: taskRows.length, level: 2 as const, icon: 'line-folder', open: true },
        ...repairTaskStatusOptions.map((name) => ({
          key: name,
          label: name,
          count: taskRows.filter((row) => (row as RepairOrder).status === name).length,
          level: 3 as const,
          icon: 'line-node',
        })),
      ],
    };
  }
  const sourceTree = moduleKey.value === 'assets'
    ? { title: '设备分类', nodes: treeNodes('设备', equipmentCategoryOptions.value) }
    : moduleKey.value === 'spares'
      ? { title: '备件分类', nodes: treeNodes('备件', spareCategoryOptions.value) }
      : currentConfig.value.tree;
  return {
    ...sourceTree,
    nodes: sourceTree.nodes.map((node) => ({
      ...node,
      count: node.key === 'all' ? rows.value.length : rows.value.filter((row) => countTreeNode(row, node.key)).length,
    })),
  };
});
const activeColumns = computed(() => {
  if (isRepairTaskView.value) return repairTaskColumns;
  return currentConfig.value.columns.map((column) => {
    if (moduleKey.value === 'assets' && column.key === 'category') return { ...column, filterOptions: equipmentCategoryOptions.value };
    if (moduleKey.value === 'spares' && column.key === 'category') return { ...column, filterOptions: spareCategoryOptions.value };
    if (column.key === 'status' && moduleKey.value === 'maintenance') return { ...column, filterOptions: ['未开始', '待执行', '执行中', '已完成', '已逾期', '已取消'] };
    if (column.key === 'status' && moduleKey.value === 'repairs') return { ...column, filterOptions: repairStatusOptions };
    if (column.key === 'status' && moduleKey.value === 'inspections') return { ...column, filterOptions: ['待点检', '点检中', '正常', '异常', '已生成维修', '已关闭'] };
    if (column.key === 'status' && moduleKey.value === 'spares') return { ...column, filterOptions: ['正常', '低库存', '已占用', '停用'] };
    return column;
  });
});
const tableRows = computed(() => rows.value.filter((row) => matchView(row) && matchTree(row) && matchColumns(row)).map((row) => ({ ...row, ...rowViewFields(row), action: '查看' })));
const equipmentPickerRows = computed<OptionPickerRow[]>(() => rowsByType.value.assets.map((item) => ({ ...item })));
const equipmentPickerCategories = computed(() => [
  { key: 'all', label: '全部设备', icon: 'line-folder', count: equipmentPickerRows.value.length },
  ...equipmentCategoryOptions.value.map((category) => ({
    key: category,
    label: category,
    icon: 'line-node',
    count: equipmentPickerRows.value.filter((item) => item.category === category).length,
  })),
]);
const sparePickerRows = computed<OptionPickerRow[]>(() => rowsByType.value.spares.map((item) => ({ ...item })));
const maintenancePlanPickerRows = computed<OptionPickerRow[]>(() => rowsByType.value.maintenance.map((item) => ({
  id: item.id,
  code: item.code,
  name: item.name,
  equipmentName: item.equipmentName,
  maintenanceType: item.maintenanceType,
  cycleType: `${item.cycleType} / ${item.cycleValue}`,
  planDate: item.planDate,
  nextDate: item.nextDate,
  ownerName: item.ownerName,
  standard: item.standard,
  status: item.status,
})));
const maintenancePlanPickerCategories = computed(() => {
  const typeCounts = maintenancePlanPickerRows.value.reduce<Record<string, number>>((result, row) => {
    const key = String(row.maintenanceType || '未分类');
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  return [
    { key: 'all', label: '全部计划', icon: 'line-folder', count: maintenancePlanPickerRows.value.length },
    ...Object.entries(typeCounts).map(([key, count]) => ({ key, label: key, icon: 'line-node', count })),
  ];
});
const maintenancePlanPickerColumns = [
  { key: 'name', title: '保养计划', width: 150 },
  { key: 'code', title: '计划编号', width: 140 },
  { key: 'equipmentName', title: '适用设备', width: 150 },
  { key: 'maintenanceType', title: '保养类型', width: 100 },
  { key: 'cycleType', title: '保养周期', width: 110 },
  { key: 'nextDate', title: '下次保养', width: 110 },
  { key: 'ownerName', title: '负责人', width: 90 },
  { key: 'status', title: '状态', width: 90 },
];
const inspectionPlanPickerRows = computed<OptionPickerRow[]>(() => {
  const plans = new Map<string, OptionPickerRow>();
  rowsByType.value.inspections
    .filter((item) => item.planName && item.recordType === 'plan')
    .forEach((item) => {
      const key = `${item.planName}-${item.inspectionType}`;
      if (plans.has(key)) return;
      plans.set(key, {
        id: item.id,
        code: item.code,
        planName: item.planName,
        equipmentName: item.equipmentName,
        inspectionType: item.inspectionType,
        standard: item.standard,
        inspector: item.inspector,
        status: item.recordType === 'plan' ? item.status || '待点检' : '已执行',
      });
    });
  return Array.from(plans.values());
});
const inspectionPlanPickerCategories = computed(() => {
  const typeCounts = inspectionPlanPickerRows.value.reduce<Record<string, number>>((result, row) => {
    const key = String(row.inspectionType || '未分类');
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  return [
    { key: 'all', label: '全部计划', icon: 'line-folder', count: inspectionPlanPickerRows.value.length },
    ...Object.entries(typeCounts).map(([key, count]) => ({ key, label: key, icon: 'line-node', count })),
  ];
});
const inspectionPlanPickerColumns = [
  { key: 'planName', title: '点检计划', width: 150 },
  { key: 'code', title: '计划编号', width: 140 },
  { key: 'equipmentName', title: '适用设备', width: 150 },
  { key: 'inspectionType', title: '点检类型', width: 100 },
  { key: 'standard', title: '点检标准', width: 150 },
  { key: 'inspector', title: '负责人', width: 90 },
  { key: 'status', title: '状态', width: 90 },
];
const rowsByType = ref<{
  assets: EquipmentAsset[];
  spares: SparePart[];
  maintenance: MaintenancePlan[];
  repairs: RepairOrder[];
  inspections: InspectionRecord[];
  spareRequests: SpareRequest[];
}>({ assets: [], spares: [], maintenance: [], repairs: [], inspections: [], spareRequests: [] });
const equipmentCategoryGroups = computed<CategoryPickerGroup[]>(() => {
  const sourceRows = equipmentCategoryRows.value.length
    ? equipmentCategoryRows.value
    : defaultEquipmentCategoryOptions.map((name, index) => ({
      id: `default-cat-${index}`,
      name,
      code: `CATEGORY_${index + 1}`,
      parent: '设备分类',
      updatedAt: currentDate(),
      enabled: true,
    }));
  const usageCounts = rowsByType.value.assets.reduce<Record<string, number>>((result, item) => {
    result[item.category] = (result[item.category] || 0) + 1;
    return result;
  }, {});
  const groups = new Map<string, CategoryPickerGroup>();
  sourceRows
    .filter((row) => row.enabled !== false)
    .forEach((row) => {
      const parent = row.parent || '设备分类';
      if (!groups.has(parent)) {
        groups.set(parent, {
          key: parent,
          label: parent,
          icon: 'line-folder',
          count: 0,
          children: [],
        });
      }
      const group = groups.get(parent) as CategoryPickerGroup;
      const count = usageCounts[row.name] || 0;
      group.count = Number(group.count || 0) + count;
      group.children.push({
        key: row.name,
        label: row.name,
        code: row.code,
        desc: `来源：设备台账 - 设备设置 - 设备分类；更新：${row.updatedAt || '-'}`,
        count,
      });
    });
  return Array.from(groups.values());
});
const currentEquipmentCategoryParentKey = computed(() => equipmentCategoryGroups.value.find((group) => group.children.some((child) => child.key === form.category))?.key || equipmentCategoryGroups.value[0]?.key || '');
const workshopLineDisplay = computed(() => [form.workshop, form.line].filter(Boolean).join(' / '));
const workshopLineGroups = computed<CategoryPickerGroup[]>(() => {
  const usageCounts = rowsByType.value.assets.reduce<Record<string, number>>((result, item) => {
    const key = `${item.workshop}|||${item.line}`;
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  return workshopLineOptions.map((group) => {
    const children = group.children.map((child) => ({
      ...child,
      count: usageCounts[`${group.label}|||${child.label}`] || 0,
    }));
    return {
      ...group,
      count: children.reduce((sum, child) => sum + Number(child.count || 0), 0),
      children,
    };
  });
});
const isMaintenanceExecutionCreate = computed(() => moduleKey.value === 'maintenance' && ['new', '新增保养'].includes(action.value));
const maintenancePlansForEquipment = computed(() => plansForEquipment(form.equipmentId));
const selectedMaintenancePlan = computed(() => rowsByType.value.maintenance.find((item) => item.id === form.planId || item.code === form.planId));
const hasDraftContent = computed(() => {
  const hasAttachment = attachments.value.some((item) => item.name || item.remark);
  const hasSubRows = subRows.value.some((row) => Object.entries(row).some(([key, value]) => key !== 'id' && Boolean(value)));
  const hasSpareRows = spareUsages.value.length > 0;
  const hasText = Boolean(richText.value.trim());
  const hasFormContent = Object.entries(form).some(([key, value]) => key !== 'code' && value !== '' && value !== undefined && value !== null);
  return hasAttachment || hasSubRows || hasSpareRows || hasText || hasFormContent;
});

function settingFromAction(value: string) {
  const map: Record<string, string> = {
    设备编号: 'numbers',
    设备分类: 'categories',
    设备状态: 'statuses',
    资产标签: 'assetTags',
    保养标准: 'maintenanceStandards',
    保养项目: 'maintenanceItems',
    保养周期: 'maintenanceCycles',
    保养预警: 'maintenanceWarnings',
    审批流程: moduleKey.value === 'repairs' ? 'repairApprovals' : '',
    故障分类: 'faultCategories',
    维修等级: 'repairLevels',
    点检标准: 'inspectionStandards',
    点检周期: 'inspectionCycles',
    安全库存: 'safeStocks',
    备件分类: 'spareCategories',
  };
  return map[value];
}

function viewFromAction(value: string) {
  const map: Record<string, string> = {
    保养执行: 'execution',
    维修派工: 'dispatch',
    维修任务: 'acceptance',
    维修验收: 'acceptance',
    点检异常: 'exceptions',
    备件采购: 'purchase',
  };
  return map[value];
}

const commonToolbar: ToolbarActionKey[] = ['refresh', 'filter', 'columns', 'import', 'export', 'create'];
const configs: Record<EquipmentModule, ModuleConfig> = {
  assets: {
    title: '设备台账',
    createLabel: '新增设备',
    searchPlaceholder: '搜索设备名称、编号、分类、责任人',
    linkKey: 'name',
    tree: { title: '设备分类', nodes: treeNodes('设备', defaultEquipmentCategoryOptions) },
    tabs: ['基础信息', '点检记录', '保养记录', '维修记录', '备件消耗', '附件', '操作记录'].map(tabItem),
    columns: [
      col('code', '设备编号', 150), col('name', '设备名称', 170, true), col('category', '设备分类', 120, false, defaultEquipmentCategoryOptions),
      col('model', '规格型号', 120), col('workshopLine', '所属车间/产线', 160),
      col('ownerName', '责任人', 100), col('status', '设备状态', 110, false, equipmentStatusOptions), col('lastInspectionAt', '最近点检', 120),
      col('lastMaintenanceAt', '最近保养', 120), col('lastRepairAt', '最近维修', 120), col('enabledAt', '启用日期', 120), actionCol(),
    ],
  },
  maintenance: {
    title: '保养计划',
    createLabel: '新增保养计划',
    searchPlaceholder: '搜索计划名称、设备编号、责任人',
    linkKey: 'name',
    tree: { title: '保养状态', nodes: treeNodes('保养', ['待执行', '执行中', '已完成', '已逾期']) },
    tabs: ['计划信息', '保养项目', '执行记录', '预警记录', '关联设备', '操作记录'].map(tabItem),
    columns: [
      col('code', '保养计划编号', 150), col('name', '计划名称', 170, true), col('equipmentCode', '设备编号', 150), col('equipmentName', '设备名称', 160),
      col('maintenanceType', '保养类型', 110), col('cycleType', '保养周期', 100), col('planDate', '计划日期', 120), col('ownerName', '责任人', 100),
      col('lastDate', '上次保养', 120), col('nextDate', '下次保养', 120), col('warningStatus', '预警状态', 110), col('status', '执行状态', 110), actionCol(),
    ],
  },
  repairs: {
    title: '维修记录',
    createLabel: '新建报修',
    searchPlaceholder: '搜索维修单号、报修主题、设备名称',
    linkKey: 'topic',
    tree: { title: '维修状态', nodes: treeNodes('维修', repairStatusOptions) },
    tabs: ['报修信息', '派工信息', '维修处理', '备件消耗', '验收记录', '操作记录'].map(tabItem),
    columns: [
      col('code', '维修单号', 150), col('topic', '报修主题', 180, true), col('equipmentCode', '设备编号', 150), col('equipmentName', '设备名称', 160),
      col('faultCategory', '故障分类', 120), col('repairLevel', '维修等级', 100), col('reporter', '报修人', 100), col('reportedAt', '报修时间', 150),
      col('dispatcher', '派工人', 100), col('assignee', '维修人员', 110), col('status', '维修状态', 110), col('acceptanceStatus', '验收状态', 110), actionCol(),
    ],
  },
  inspections: {
    title: '点检记录',
    createLabel: '新增点检',
    searchPlaceholder: '搜索点检单号、计划、设备名称',
    linkKey: 'code',
    tree: { title: '点检结果', nodes: treeNodes('点检', ['待点检', '正常', '异常', '已生成维修']) },
    tabs: ['点检信息', '点检项目', '异常处理', '关联维修', '操作记录'].map(tabItem),
    columns: [
      col('code', '点检单号', 150, true), col('planName', '点检计划', 160), col('equipmentCode', '设备编号', 150), col('equipmentName', '设备名称', 160),
      col('inspectionType', '点检类型', 110), col('inspectionAt', '点检日期', 150), col('inspector', '点检人', 100), col('result', '点检结果', 100),
      col('exceptionCount', '异常数量', 90), col('status', '处理状态', 120), actionCol(),
    ],
  },
  spares: {
    title: '备件管理',
    createLabel: '新增备件',
    searchPlaceholder: '搜索备件名称、编号、分类、适用设备',
    linkKey: 'name',
    tree: { title: '备件分类', nodes: treeNodes('备件', ['机械备件', '动力备件']) },
    tabs: ['备件信息', '库存流水', '适用设备', '领用记录', '采购记录', '操作记录'].map(tabItem),
    columns: [
      col('code', '备件编号', 150), col('name', '备件名称', 160, true), col('model', '规格型号', 120), col('category', '备件分类', 120),
      col('equipmentScope', '适用设备', 150), col('stockQty', '当前库存', 90), col('safeQty', '安全库存', 90), col('availableQty', '可用库存', 90),
      col('occupiedQty', '占用库存', 90), col('warehouseLocation', '仓库/库位', 150), col('lastUsedAt', '最近领用', 120), col('status', '预警状态', 110), actionCol(),
    ],
  },
};

const maintenanceItemColumns: EditableColumn[] = [
  { key: 'itemName', title: '项目名称', width: 160 },
  { key: 'standard', title: '标准要求', width: 220 },
  { key: 'method', title: '方法', width: 130 },
  { key: 'tools', title: '工具/备件', width: 150 },
  { key: 'required', title: '是否必填', width: 100 },
];
const inspectionItemColumns: EditableColumn[] = [
  { key: 'itemName', title: '点检项目', width: 160 },
  { key: 'standard', title: '标准值/判定标准', width: 220 },
  { key: 'recordType', title: '记录方式', width: 130 },
  { key: 'upper', title: '上限', width: 90 },
  { key: 'lower', title: '下限', width: 90 },
  { key: 'required', title: '是否必填', width: 100 },
];
const spareUsageColumns: EditableColumn[] = [
  { key: 'spareCode', title: '备件编号', width: 150 },
  { key: 'spareName', title: '备件名称', width: 150 },
  { key: 'model', title: '规格型号', width: 120 },
  { key: 'qty', title: '使用数量', width: 100 },
  { key: 'stockQty', title: '库存数量', width: 100 },
  { key: 'warehouse', title: '仓库', width: 130 },
];

watch(() => route.fullPath, loadPage, { immediate: true });

function col(key: string, title: string, width: number, link = false, filterOptions?: string[]): AwTableColumn {
  return { key, title, width, link, filterOptions };
}

function actionCol(): AwTableColumn {
  return { key: 'action', title: '操作', width: 100, fixed: 'right' };
}

function tabItem(label: string): DetailTabItem {
  return { key: label, label };
}

function treeNodes(root: string, names: string[]): AwTreeNode[] {
  return [{ key: 'all', label: `全部${root}`, count: 0, level: 2, icon: 'line-folder', open: true }, ...names.map((name) => ({ key: name, label: name, count: 0, level: 3 as const, icon: 'line-node' }))];
}

function currentDate() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function joinDisplay(...values: Array<unknown>) {
  const text = values.map((value) => String(value || '').trim()).filter(Boolean).join(' / ');
  return text || '-';
}

function confirmAction(message: string) {
  return window.confirm(message);
}

function loadPage() {
  if (settingKey.value) return;
  loadPickers().then(() => {
    if (detailId.value) {
      getRowForModule(moduleKey.value, detailId.value).then((row) => {
        detailRow.value = row as EquipmentRow;
        activeTab.value = currentConfig.value.tabs[0]?.key || '';
      });
      return;
    }
    if (isCreate.value) {
      resetForm();
      return;
    }
    loadList();
  });
}

function loadPickers() {
  return Promise.all([
    listRowsForModule('assets'),
    listRowsForModule('spares'),
    listRowsForModule('maintenance'),
    listRowsForModule('repairs'),
    listRowsForModule('inspections'),
    listSpareRequests(),
    getEquipmentSettings(),
  ]).then(([assetPage, sparePage, maintenancePage, repairPage, inspectionPage, spareRequestRows, settingData]) => {
    rowsByType.value = {
      assets: assetPage.items as unknown as EquipmentAsset[],
      spares: sparePage.items as unknown as SparePart[],
      maintenance: maintenancePage.items as unknown as MaintenancePlan[],
      repairs: repairPage.items as unknown as RepairOrder[],
      inspections: inspectionPage.items as unknown as InspectionRecord[],
      spareRequests: spareRequestRows,
    };
    equipmentCategoryRows.value = settingData.categories.filter((item) => item.enabled !== false);
    equipmentCategoryOptions.value = equipmentCategoryRows.value.map((item) => item.name);
    spareCategoryOptions.value = settingData.spareCategories.filter((item) => item.enabled !== false).map((item) => item.name);
    maintenanceItemOptions.value = (settingData.maintenanceItems || []).filter((item) => item.enabled !== false);
  });
}

function loadList() {
  normalizePickedTree();
  listRowsForModule(moduleKey.value, keyword.value).then((data) => {
    rows.value = data.items as unknown as EquipmentRow[];
    detailRow.value = null;
  });
}

function normalizePickedTree() {
  if (isRepairTaskView.value && !['all', ...repairTaskStatusOptions].includes(pickedTree.value)) pickedTree.value = 'all';
}

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key]);
  attachments.value = [{ id: 1, name: '', type: '设备附件', date: currentDate(), remark: '' }];
  richText.value = '';
  spareUsages.value = [];
  if (moduleKey.value === 'assets') Object.assign(form, { name: '', code: '系统自动生成', category: equipmentCategoryOptions.value[0] || '机加工设备', model: '', manufacturer: '', workshop: '一车间', line: '机加工产线A', ownerDept: '设备动力部', ownerName: '陈工', enabledAt: currentDate(), status: '运行中', level: '一般', ratedPower: '', maintenanceStrategy: '', inspectionStrategy: '' });
  if (moduleKey.value === 'maintenance' && isMaintenanceExecutionCreate.value) {
    Object.assign(form, { equipmentId: '', equipmentName: '', ownerName: currentLoginUserName, actualStartAt: '', actualEndAt: '', result: '', exception: '' });
    syncMaintenancePlan();
  } else if (moduleKey.value === 'maintenance') Object.assign(form, { name: '', equipmentId: rowsByType.value.assets[0]?.id || '', maintenanceType: '日常保养', cycleType: '按月', cycleValue: 1, planDate: currentDate(), nextDate: currentDate(), warningDays: 3, ownerName: '陈工', standard: '', maintenanceItemIds: [] });
  if (moduleKey.value === 'repairs') Object.assign(form, { topic: '', equipmentId: rowsByType.value.assets[0]?.id || '', faultCategory: '机械故障', repairLevel: '一般', reporter: '陈工', reportedAt: `${currentDate()} 09:00`, impactScope: '单台设备', urgency: '中' });
  if (moduleKey.value === 'inspections') Object.assign(form, { planName: '', equipmentId: rowsByType.value.assets[0]?.id || '', inspectionType: '日点检', inspectionCycle: '每日', inspector: '陈工', effectiveAt: currentDate(), inspectionAt: `${currentDate()} 08:30`, result: action.value === '点检计划' ? '待点检' : '正常', standard: 'CNC日点检标准', exceptionDesc: '', recordType: action.value === '点检计划' ? 'plan' : 'execution' });
  if (moduleKey.value === 'spares' && action.value === '备件申请') Object.assign(form, { code: '系统自动生成', requestType: '备件补货', sourceCode: '前端补货记录', equipmentName: '', requester: '陈工', qty: 1, warehouse: '设备备件库', purpose: '低库存补货', status: '前端记录' });
  else if (moduleKey.value === 'spares') Object.assign(form, { name: '', code: '系统自动生成', category: spareCategoryOptions.value[0] || '机械备件', model: '', unit: '个', equipmentScope: '', warehouse: '设备备件库', location: '', safeQty: 1, stockQty: 1, supplier: '', unitPrice: 0, status: '正常' });
  if (isMaintenanceExecutionCreate.value) {
    subRows.value = [];
    return;
  }
  subRows.value = moduleKey.value === 'maintenance'
    ? []
    : moduleKey.value === 'inspections'
      ? [{ id: 1, itemName: '', standard: '', recordType: '正常/异常', upper: '-', lower: '-', required: '是' }]
      : [];
}

function syncMaintenancePlan(plan?: MaintenancePlan) {
  if (!plan) {
    form.planId = '';
    form.planCode = '';
    form.planName = '';
    form.maintenanceType = '';
    form.cycleType = '';
    form.cycleValue = '';
    form.planDate = '';
    form.lastDate = '';
    form.nextDate = '';
    form.standard = '';
    form.ownerName = isMaintenanceExecutionCreate.value ? currentLoginUserName : '';
    form.actualStartAt = '';
    form.actualEndAt = '';
    form.result = '';
    form.exception = '';
    subRows.value = [];
    return;
  }
  const asset = rowsByType.value.assets.find((item) => item.id === plan.equipmentId);
  Object.assign(form, {
    planId: plan.id,
    planCode: plan.code,
    planName: plan.name,
    equipmentId: plan.equipmentId,
    equipmentName: plan.equipmentName || asset?.name || '',
    maintenanceType: plan.maintenanceType,
    cycleType: plan.cycleType,
    cycleValue: plan.cycleValue,
    planDate: plan.planDate,
    lastDate: plan.lastDate,
    nextDate: plan.nextDate,
    ownerName: isMaintenanceExecutionCreate.value ? currentLoginUserName : plan.ownerName,
    standard: plan.standard,
    actualStartAt: form.actualStartAt || `${currentDate()} 09:00`,
    actualEndAt: form.actualEndAt || `${currentDate()} 10:00`,
    result: form.result || '已完成',
    exception: form.exception || '',
  });
  subRows.value = (plan.items || []).map((item, index) => ({ ...item, id: item.id || index + 1 }));
}

function plansForEquipment(equipmentId: unknown) {
  const targetId = String(equipmentId || '');
  return rowsByType.value.maintenance
    .filter((item) => !targetId || item.equipmentId === targetId)
    .sort((a, b) => maintenancePlanPriority(a) - maintenancePlanPriority(b) || dateValue(a.nextDate || a.planDate) - dateValue(b.nextDate || b.planDate));
}

function preferredMaintenancePlanForEquipment(equipmentId: unknown) {
  return plansForEquipment(equipmentId)[0];
}

function maintenancePlanPriority(plan: MaintenancePlan) {
  const priority: Record<string, number> = {
    已逾期: 0,
    待执行: 1,
    执行中: 2,
    未开始: 3,
    已预警: 4,
    已完成: 5,
  };
  return priority[plan.status] ?? 9;
}

function dateValue(value: string) {
  const time = Date.parse(value || '');
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function syncSelectedMaintenancePlan() {
  syncMaintenancePlan(selectedMaintenancePlan.value);
}

function syncMaintenanceItemsToPlan() {
  const selectedIds = (form.maintenanceItemIds || []) as Array<string | number>;
  subRows.value = maintenanceItemOptions.value
    .filter((item) => selectedIds.includes(item.id))
    .flatMap((item) => (item.standards || []).map((standard, index) => ({
      ...standard,
      id: `${item.id}-${standard.id || index}`,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      standardName: standard.standardName || standard.itemName || item.name,
    })));
  form.standard = maintenanceItemOptions.value
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => item.name)
    .join('、');
}

function toggleMaintenanceItem(id: string | number, checked: boolean) {
  const ids = new Set((form.maintenanceItemIds || []) as Array<string | number>);
  if (checked) ids.add(id);
  else ids.delete(id);
  form.maintenanceItemIds = Array.from(ids);
  syncMaintenanceItemsToPlan();
}

function openMaintenanceItemPicker() {
  if (moduleKey.value === 'maintenance' && !isMaintenanceExecutionCreate.value) {
    showMaintenanceItemPicker.value = true;
    return;
  }
  addSubRow();
}

function pickMaintenanceItem(item: MaintenanceProjectSetting) {
  toggleMaintenanceItem(item.id, true);
  showMaintenanceItemPicker.value = false;
}

function goList() {
  router.push({ path: route.path, query: viewMode.value ? { view: viewMode.value } : {} });
}

function goBackFromCreate() {
  if (hasDraftContent.value && !confirmAction('确认返回列表吗？当前新增页面的填写内容不会保存。')) return;
  goList();
}

function goCreate() {
  router.push({ path: route.path, query: { action: moduleKey.value === 'maintenance' ? '保养计划' : 'new' } });
}

function openDetail(id: unknown) {
  if (typeof id === 'string') router.push({ path: route.path, query: { ...(viewMode.value ? { view: viewMode.value } : {}), id } });
}

function saveForm() {
  const payload: Record<string, any> = { ...form, remark: richText.value, attachments: attachments.value };
  if (moduleKey.value === 'repairs') {
    payload.repairDetail = richText.value;
    payload.faultDesc = richText.value;
  }
  if (isMaintenanceExecutionCreate.value) {
    if (!selectedMaintenancePlan.value) {
      toastText.value = '请先选择设备关联的保养计划';
      return;
    }
    if (!confirmAction('确认保存本次保养执行并记录备件领用吗？')) return;
    completeMaintenance(selectedMaintenancePlan.value.id, spareUsages.value, {
      actualStartAt: form.actualStartAt,
      actualEndAt: form.actualEndAt,
      executor: currentLoginUserName,
      result: form.result || '已完成',
      exception: form.exception,
      attachments: attachments.value,
    }).then((result) => {
      toastText.value = result.message;
      if (result.ok) {
        goList();
        loadList();
      }
    });
    return;
  }
  if (moduleKey.value === 'spares' && action.value === '备件申请') {
    if (!confirmAction('确认保存备件申请前端记录吗？')) return;
    createSpareRequest(payload).then(() => {
      toastText.value = '备件申请已保存为前端记录';
      goList();
      loadList();
    });
    return;
  }
  if (moduleKey.value === 'maintenance') {
    payload.items = subRows.value;
    payload.maintenanceItemIds = form.maintenanceItemIds || [];
  }
  if (moduleKey.value === 'inspections') {
    if (action.value === '点检计划') {
      payload.recordType = 'plan';
      payload.result = '待点检';
      payload.status = '待点检';
      payload.planStatus = '待点检';
      delete payload.exceptionDesc;
    } else {
      payload.recordType = 'execution';
    }
    if (payload.result === '异常' && !payload.exceptionDesc) {
      toastText.value = '点检结果为异常时必须填写异常说明';
      return;
    }
    if (payload.result === '异常' && !confirmAction('确认保存异常点检记录吗？异常会影响后续维修处理。')) return;
    payload.items = subRows.value;
  }
  if (moduleKey.value === 'assets' && ['停用', '报废'].includes(String(payload.status || '')) && !confirmAction(`确认以“${payload.status}”状态保存设备吗？`)) return;
  if (moduleKey.value === 'spares' && String(payload.status || '') === '停用' && !confirmAction('确认以“停用”状态保存备件吗？')) return;
  createRowForModule(moduleKey.value, payload).then(() => {
    toastText.value = `${currentConfig.value.title}已保存`;
    goList();
    loadList();
  });
}

function addSubRow() {
  const id = Date.now();
  if (moduleKey.value === 'maintenance') subRows.value.push({ id, itemName: '', standard: '', method: '', tools: '', required: '是' });
  if (moduleKey.value === 'inspections') subRows.value.push({ id, itemName: '', standard: '', recordType: '正常/异常', upper: '-', lower: '-', required: '是' });
}

function addAttachment() {
  attachments.value.push({ id: Date.now(), name: '', type: '设备附件', date: currentDate(), remark: '' });
}

function removeSubRow(index: number) {
  if (!confirmAction('确认删除这条明细吗？')) return;
  subRows.value.splice(index, 1);
}

function removeAttachment(row: AttachmentRow) {
  if (!confirmAction('确认删除该附件记录吗？')) return;
  attachments.value = attachments.value.filter((item) => item.id !== row.id);
}

function removeSpareUsage(index: number) {
  if (!confirmAction('确认删除这条备件领用记录吗？')) return;
  spareUsages.value.splice(index, 1);
}

function matchTree(row: EquipmentRow) {
  if (!showListTree.value) return true;
  if (pickedTree.value === 'all') return true;
  return countTreeNode(row, pickedTree.value);
}

function countTreeNode(row: EquipmentRow, key: string) {
  const dict = row as unknown as Record<string, unknown>;
  return [dict.category, dict.status, dict.warningStatus, dict.result].includes(key);
}

function isRepairTaskRow(row: EquipmentRow | RepairOrder) {
  const repair = row as RepairOrder;
  if (!repair || repair.status === '待派工' || repair.status === '已关闭') return false;
  return repairTaskStatusOptions.includes(repair.status) || Boolean(repair.assignee || repair.dispatcher || repair.plannedStartAt);
}

function rowViewFields(row: EquipmentRow) {
  const dict = row as unknown as Record<string, unknown>;
  const fields: Record<string, string> = {};
  if (moduleKey.value === 'assets') fields.workshopLine = joinDisplay(dict.workshop, dict.line);
  if (moduleKey.value === 'spares') fields.warehouseLocation = joinDisplay(dict.warehouse, dict.location);
  if (!isRepairTaskView.value || moduleKey.value !== 'repairs') return fields;
  const repair = row as RepairOrder;
  return {
    ...fields,
    reportNode: `${repair.reporter || '-'} / ${repair.reportedAt || '-'}`,
    dispatchInfo: `${repair.dispatcher || '-'} / ${repair.assignee || '-'}`,
    plannedWindow: timeWindow(repair.plannedStartAt, repair.plannedEndAt),
    actualWindow: timeWindow(repair.actualStartAt, repair.actualEndAt),
    taskProgress: repairTaskProgress(repair),
  };
}

function timeWindow(start?: string, end?: string) {
  if (!start && !end) return '-';
  return `${start || '-'} ~ ${end || '-'}`;
}

function repairTaskProgress(repair: RepairOrder) {
  if (repair.status === '维修中') return repair.actualStartAt ? '执行中' : '待开工';
  if (repair.status === '待验收' || repair.acceptanceStatus === '待验收') return '待验收';
  if (repair.status === '返修中') return '返修中';
  if (repair.status === '已完成') return '已完成';
  return repair.status || '-';
}

function matchView(row: EquipmentRow) {
  const mode = viewMode.value;
  if (!mode) return true;
  const dict = row as unknown as Record<string, unknown>;
  if (mode === 'execution') return ['待执行', '执行中'].includes(String(dict.status || ''));
  if (mode === 'dispatch') return String(dict.status || '') === '待派工';
  if (mode === 'acceptance') return isRepairTaskRow(row);
  if (mode === 'exceptions') return String(dict.status || '') !== '已关闭' && (String(dict.result || '') === '异常' || Number(dict.exceptionCount || 0) > 0 || String(dict.status || '') === '已生成维修');
  if (mode === 'purchase') return String(dict.status || '') === '低库存' || Number(dict.availableQty || 0) < Number(dict.safeQty || 0);
  return true;
}

function matchColumns(row: EquipmentRow) {
  return Object.entries(columnFilters).every(([key, value]) => !value || String((row as unknown as Record<string, unknown>)[key]) === value);
}

function setColumnFilter(key: string, value: string) {
  columnFilters[key] = value;
}

function detailTitle(row: EquipmentRow) {
  return String((row as EquipmentAsset).name || (row as RepairOrder).topic || (row as InspectionRecord).code || '-');
}

function detailCode(row: EquipmentRow) {
  return String((row as EquipmentAsset).code || '-');
}

function detailStatus(row: EquipmentRow) {
  return String((row as EquipmentAsset).status || '-');
}

function detailFields(row: EquipmentRow): DetailFieldItem[] {
  if (moduleKey.value === 'assets') {
    const asset = row as EquipmentAsset;
    return [
      ...pickFields(row, [['设备编号', 'code'], ['设备分类', 'category'], ['规格型号', 'model'], ['制造商', 'manufacturer']]),
      { label: '所属车间/产线', value: joinDisplay(asset.workshop, asset.line) },
      ...pickFields(row, [['责任部门', 'ownerDept'], ['责任人', 'ownerName'], ['设备等级', 'level'], ['额定功率', 'ratedPower'], ['保养策略', 'maintenanceStrategy'], ['点检策略', 'inspectionStrategy'], ['启用日期', 'enabledAt'], ['最近点检', 'lastInspectionAt'], ['最近保养', 'lastMaintenanceAt'], ['最近维修', 'lastRepairAt']]),
    ];
  }
  if (moduleKey.value === 'maintenance') return pickFields(row, [['保养计划编号', 'code'], ['计划名称', 'name'], ['设备', 'equipmentName'], ['保养类型', 'maintenanceType'], ['周期类型', 'cycleType'], ['周期间隔', 'cycleValue'], ['计划日期', 'planDate'], ['责任人', 'ownerName'], ['保养标准', 'standard'], ['下次保养', 'nextDate']]);
  if (moduleKey.value === 'repairs') {
    const tab = activeTab.value;
    if (tab.includes('派工')) return pickFields(row, [['维修单号', 'code'], ['派工人', 'dispatcher'], ['维修人员', 'assignee'], ['计划开始', 'plannedStartAt'], ['计划完成', 'plannedEndAt'], ['维修等级', 'repairLevel'], ['是否停机', 'downtime'], ['任务状态', 'status']]);
    if (tab.includes('维修处理')) return pickFields(row, [['维修单号', 'code'], ['实际开始', 'actualStartAt'], ['实际完成', 'actualEndAt'], ['实际工时', 'actualHours'], ['维修费用', 'repairCost'], ['故障原因', 'faultReason'], ['处理措施', 'actionsTaken'], ['处理结果', 'result'], ['任务状态', 'status']]);
    return pickFields(row, [['维修单号', 'code'], ['报修主题', 'topic'], ['设备', 'equipmentName'], ['故障分类', 'faultCategory'], ['影响范围', 'impactScope'], ['紧急程度', 'urgency'], ['维修等级', 'repairLevel'], ['报修人', 'reporter'], ['报修时间', 'reportedAt'], ['保修详情', 'faultDesc'], ['验收状态', 'acceptanceStatus'], ['验收人', 'acceptedBy'], ['验收时间', 'acceptedAt']]);
  }
  if (moduleKey.value === 'inspections') return pickFields(row, [['点检单号', 'code'], ['点检计划', 'planName'], ['设备', 'equipmentName'], ['点检类型', 'inspectionType'], ['点检周期', 'inspectionCycle'], ['生效日期', 'effectiveAt'], ['点检人', 'inspector'], ['点检时间', 'inspectionAt'], ['点检结果', 'result'], ['异常数量', 'exceptionCount'], ['异常说明', 'exceptionDesc']]);
  const spare = row as SparePart;
  return [
    ...pickFields(row, [['备件编号', 'code'], ['备件名称', 'name'], ['规格型号', 'model'], ['备件分类', 'category'], ['适用设备', 'equipmentScope'], ['当前库存', 'stockQty'], ['安全库存', 'safeQty'], ['可用库存', 'availableQty'], ['占用库存', 'occupiedQty']]),
    { label: '仓库/库位', value: joinDisplay(spare.warehouse, spare.location) },
    ...pickFields(row, [['供应商', 'supplier'], ['单价', 'unitPrice']]),
  ];
}

function pickFields(row: EquipmentRow, pairs: Array<[string, string]>): DetailFieldItem[] {
  return pairs.map(([label, key]) => ({ label, value: String((row as unknown as Record<string, unknown>)[key] ?? '-') }));
}

const detailRecordColumns: EditableColumn[] = [
  { key: 'time', title: '时间', width: 150 },
  { key: 'type', title: '记录类型', width: 150 },
  { key: 'content', title: '内容', width: 320 },
  { key: 'operator', title: '操作人', width: 120 },
];

const detailRecordRows = computed<Record<string, any>[]>(() => {
  if (!detailRow.value) return [];
  const tab = activeTab.value;
  const row = detailRow.value as any;
  if (moduleKey.value === 'assets') {
    const equipmentId = row.id;
    const repairCodes = rowsByType.value.repairs.filter((item) => item.equipmentId === equipmentId).map((item) => item.code);
    const maintenanceCodes = rowsByType.value.maintenance.filter((item) => item.equipmentId === equipmentId).map((item) => item.code);
    if (tab.includes('点检')) return rowsByType.value.inspections.filter((item) => item.equipmentId === equipmentId).map((item) => recordLine(item.id, item.inspectionAt, item.status, `${item.code} ${item.planName} ${item.exceptionDesc || ''}`, item.inspector));
    if (tab.includes('保养')) return rowsByType.value.maintenance.filter((item) => item.equipmentId === equipmentId).flatMap((item) => [
      recordLine(item.id, item.planDate, item.status, `${item.code} ${item.name}，下次：${item.nextDate}`, item.ownerName),
      ...(item.executions || []).map((exec) => recordLine(exec.id, exec.executedAt, exec.result, `${exec.code} ${exec.exception || '执行完成'}`, exec.executor)),
    ]);
    if (tab.includes('维修')) return rowsByType.value.repairs.filter((item) => item.equipmentId === equipmentId).map((item) => recordLine(item.id, item.reportedAt, item.status, `${item.code} ${item.topic} ${item.acceptanceOpinion || item.rejectedReason || ''}`, item.assignee || item.reporter));
    if (tab.includes('备件') || tab.includes('消耗')) return rowsByType.value.spareRequests.filter((item) => [...repairCodes, ...maintenanceCodes].includes(item.sourceCode)).map((item) => recordLine(item.id, item.createdAt, item.requestType, `${item.sourceCode} ${item.spareName || item.purpose} x${item.qty}`, item.requester));
  }
  if (moduleKey.value === 'maintenance' && tab.includes('执行')) {
    return ((detailRow.value as MaintenancePlan).executions || []).map((item) => recordLine(item.id, item.executedAt, item.result, `${item.code} ${item.exception || '保养执行'}`, item.executor));
  }
  if (moduleKey.value === 'repairs' && tab.includes('验收')) {
    const repair = detailRow.value as RepairOrder;
    if (!repair.acceptedAt) return [];
    return [recordLine(repair.id, repair.acceptedAt, repair.acceptanceStatus, repair.acceptanceOpinion || repair.rejectedReason || '-', repair.acceptedBy || '-')];
  }
  if (moduleKey.value === 'inspections' && tab.includes('关联')) {
    const inspection = detailRow.value as InspectionRecord;
    return inspection.repairOrderCode ? [recordLine(inspection.id, inspection.handledAt || inspection.inspectionAt, inspection.handlingStatus || inspection.status, `关联维修单：${inspection.repairOrderCode}`, inspection.inspector)] : [];
  }
  if (moduleKey.value === 'spares' && (tab.includes('流水') || tab.includes('领用') || tab.includes('采购'))) {
    const spare = detailRow.value as SparePart;
    return rowsByType.value.spareRequests
      .filter((item) => item.spareCode === spare.code || item.spareName === spare.name || item.purpose.includes(spare.name))
      .map((item) => recordLine(item.id, item.createdAt, item.requestType, `${item.sourceCode} ${item.purpose} x${item.qty}`, item.requester));
  }
  return [];
});

function recordLine(id: string | number, time: string, type: string, content: string, operator: string) {
  return { id, time: time || currentDate(), type: type || '-', content: content || '-', operator: operator || '-' };
}

const detailActions = computed<DetailAction[]>(() => {
  if (!detailRow.value) return [];
  if (moduleKey.value === 'assets') {
    const status = detailStatus(detailRow.value);
    if (status === '报废') return [];
    if (status === '停用') return [{ key: 'status', label: '启用/切换状态', primary: true }];
    if (['维修中', '保养中'].includes(status)) return [{ key: 'status', label: '结束并切换状态', primary: true }];
    return [{ key: 'status', label: '切换状态' }, { key: 'scrap', label: '报废', danger: true }];
  }
  if (moduleKey.value === 'maintenance') {
    const status = detailStatus(detailRow.value);
    const actions: DetailAction[] = [];
    if (['未开始', '待执行', '已逾期'].includes(status)) actions.push({ key: 'generate', label: '生成执行' });
    if (['待执行', '执行中', '已逾期'].includes(status)) actions.push({ key: 'complete', label: '完成保养', primary: true });
    return actions;
  }
  if (moduleKey.value === 'repairs') {
    const status = detailStatus(detailRow.value);
    const actions: DetailAction[] = [];
    if (status === '待派工') actions.push({ key: 'dispatch', label: '派工', primary: true });
    if (['维修中', '返修中'].includes(status)) actions.push({ key: 'process', label: '维修处理', primary: true });
    if (status === '待验收' || (detailRow.value as RepairOrder).acceptanceStatus === '待验收') actions.push({ key: 'accept', label: '验收', primary: true });
    if (status === '已完成') actions.push({ key: 'closeRepair', label: '关闭', primary: true });
    return actions;
  }
  if (moduleKey.value === 'inspections') {
    const record = detailRow.value as InspectionRecord;
    const actions: DetailAction[] = [];
    if (['待点检', '点检中'].includes(record.status)) actions.push({ key: 'completeInspection', label: '完成点检', primary: true });
    if ((record.result === '异常' || record.exceptionCount > 0) && !record.repairOrderCode && record.status !== '已生成维修') actions.push({ key: 'repairFromInspection', label: '生成维修', primary: true });
    return actions;
  }
  if (moduleKey.value === 'spares') {
    const status = detailStatus(detailRow.value);
    if (status === '低库存') return [{ key: 'spareRequest', label: '生成补货记录', primary: true }];
    return [];
  }
  return [];
});

function handleDetailAction(key: string) {
  if (!detailRow.value) return;
  if (key === 'status') {
    statusDraft.value = detailStatus(detailRow.value);
    showStatusModal.value = true;
  }
  if (key === 'scrap') {
    statusDraft.value = '报废';
    showStatusModal.value = true;
  }
  if (key === 'generate') {
    if (!confirmAction('确认基于当前保养计划生成执行单吗？')) return;
    generateMaintenanceExecution(detailCode(detailRow.value)).then(() => reloadDetail('已生成保养执行单'));
  }
  if (key === 'complete') {
    Object.assign(form, { actualStartAt: `${currentDate()} 09:00`, actualEndAt: `${currentDate()} 10:00`, executionResult: '已完成', maintenanceException: '' });
    spareUsages.value = [];
    showMaintenanceModal.value = true;
  }
  if (key === 'dispatch') showDispatchModal.value = true;
  if (key === 'process') {
    Object.assign(form, {
      faultReason: (detailRow.value as RepairOrder).faultReason || '',
      actionsTaken: (detailRow.value as RepairOrder).actionsTaken || '',
      actualStartAt: (detailRow.value as RepairOrder).actualStartAt || `${currentDate()} 10:00`,
      actualEndAt: (detailRow.value as RepairOrder).actualEndAt || `${currentDate()} 12:00`,
      actualHours: (detailRow.value as RepairOrder).actualHours || 2,
      repairCost: (detailRow.value as RepairOrder).repairCost || 0,
      repairResult: (detailRow.value as RepairOrder).result || '待验收',
    });
    spareUsages.value = [...(((detailRow.value as RepairOrder).spareParts || []) as SpareUsage[])];
    showRepairProcessModal.value = true;
  }
  if (key === 'accept') {
    Object.assign(form, { acceptedBy: currentLoginUserName, acceptanceOpinion: '维修结果符合验收要求', rejectedReason: '' });
    showAcceptModal.value = true;
  }
  if (key === 'closeRepair') {
    Object.assign(form, { closeReason: '维修验收完成后关闭', closedBy: currentLoginUserName });
    showCloseRepairModal.value = true;
  }
  if (key === 'completeInspection') {
    const record = detailRow.value as InspectionRecord;
    Object.assign(form, { result: record.result === '待点检' ? '正常' : record.result, exceptionDesc: record.exceptionDesc || '' });
    showInspectionModal.value = true;
  }
  if (key === 'repairFromInspection') {
    const record = detailRow.value as InspectionRecord;
    if (record.result !== '异常' && Number(record.exceptionCount || 0) < 1) {
      toastText.value = '只有异常点检才能生成维修报修单';
      return;
    }
    if (!confirmAction('确认根据该异常点检生成维修报修单吗？')) return;
    generateRepairFromInspection(detailCode(detailRow.value)).then(() => reloadDetail('已生成维修报修单'));
  }
  if (key === 'spareRequest') showSpareRequestModal.value = true;
}

function reloadDetail(message: string) {
  toastText.value = message;
  if (!detailRow.value) return;
  getRowForModule(moduleKey.value, detailCode(detailRow.value)).then((row) => {
    detailRow.value = row as EquipmentRow;
  });
}

function confirmStatus() {
  if (!detailRow.value) return;
  const oldStatus = detailStatus(detailRow.value);
  if (oldStatus === statusDraft.value) {
    showStatusModal.value = false;
    return;
  }
  if (!confirmAction(`确认将设备状态从“${oldStatus}”切换为“${statusDraft.value}”吗？`)) return;
  changeAssetStatus(detailCode(detailRow.value), statusDraft.value).then(() => {
    showStatusModal.value = false;
    reloadDetail(statusDraft.value === '报废' ? '设备已报废' : '设备状态已切换');
  });
}

function confirmDispatch() {
  if (!detailRow.value) return;
  if (!confirmAction('确认提交维修派工并将维修单进入维修中吗？')) return;
  dispatchRepair(detailCode(detailRow.value), { assignee: form.assignee || '赵维修', dispatcher: '设备主管', repairLevel: form.repairLevel || '一般', plannedStartAt: form.plannedStartAt || `${currentDate()} 10:00`, plannedEndAt: form.plannedEndAt || `${currentDate()} 18:00`, downtime: form.downtime || '否' }).then((row) => {
    showDispatchModal.value = false;
    if (row) detailRow.value = row as EquipmentRow;
    reloadDetail('维修已派工，状态进入维修中');
  });
}

function confirmRepairProcess() {
  if (!detailRow.value) return;
  if (!confirmAction('确认提交维修处理结果并记录备件消耗吗？')) return;
  submitRepairResult(detailCode(detailRow.value), { faultReason: form.faultReason, actionsTaken: form.actionsTaken, actualStartAt: form.actualStartAt, actualEndAt: form.actualEndAt, actualHours: Number(form.actualHours || 2), repairCost: Number(form.repairCost || 0), result: form.repairResult || '待验收', spareParts: spareUsages.value, attachments: attachments.value }).then((result) => {
    toastText.value = result.message;
    if (result.ok) {
      showRepairProcessModal.value = false;
      reloadDetail(result.message);
    }
  });
}

function confirmAccept(passed: boolean) {
  if (!detailRow.value) return;
  if (!passed && !String(form.rejectedReason || '').trim()) {
    toastText.value = '驳回验收时必须填写驳回原因';
    return;
  }
  if (!confirmAction(passed ? '确认验收通过并回写设备状态吗？' : '确认驳回验收并将维修单进入返修中吗？')) return;
  acceptRepair(detailCode(detailRow.value), passed, {
    acceptedBy: form.acceptedBy || currentLoginUserName,
    acceptanceOpinion: form.acceptanceOpinion,
    rejectedReason: form.rejectedReason,
  }).then((row) => {
    showAcceptModal.value = false;
    if (row) detailRow.value = row as EquipmentRow;
    if (passed && row?.code) closeInspectionException('', row.code);
    reloadDetail(passed ? '验收通过，已记录验收意见并回写设备状态' : '验收驳回，维修单进入返修中');
  });
}

function confirmCloseRepair() {
  if (!detailRow.value) return;
  if (!confirmAction('确认关闭该维修单吗？关闭后将结束当前维修流程。')) return;
  closeRepair(detailCode(detailRow.value), {
    closedBy: form.closedBy || currentLoginUserName,
    closeReason: form.closeReason,
  }).then((row) => {
    showCloseRepairModal.value = false;
    if (row) detailRow.value = row as EquipmentRow;
    reloadDetail('维修单已关闭');
  });
}

function confirmMaintenance() {
  if (!detailRow.value) return;
  if (!confirmAction('确认完成本次保养并记录备件领用吗？')) return;
  completeMaintenance(detailCode(detailRow.value), spareUsages.value, { actualStartAt: form.actualStartAt, actualEndAt: form.actualEndAt, result: form.executionResult || '已完成', exception: form.maintenanceException || '', attachments: attachments.value }).then((result) => {
    toastText.value = result.message;
    if (result.ok) {
      showMaintenanceModal.value = false;
      reloadDetail(result.message);
    }
  });
}

function confirmInspection() {
  if (!detailRow.value) return;
  const record = detailRow.value as InspectionRecord;
  const result = form.result || record.result;
  if (result === '异常' && !String(form.exceptionDesc || record.exceptionDesc || '').trim()) {
    toastText.value = '点检结果为异常时必须填写异常说明';
    return;
  }
  if (!confirmAction(result === '异常' ? '确认完成异常点检吗？后续可生成维修单。' : '确认完成本次点检吗？')) return;
  completeInspection(record.code, { result: form.result || record.result, exceptionDesc: form.exceptionDesc || record.exceptionDesc }).then((result) => {
    toastText.value = result.message;
    if (result.ok) {
      showInspectionModal.value = false;
      reloadDetail(result.message);
    }
  });
}

function confirmSpareRequest() {
  if (!detailRow.value) return;
  if (!confirmAction('确认生成备件补货前端记录吗？')) return;
  createSpareRequest({ sourceCode: detailCode(detailRow.value), qty: Number(form.qty || 1), requester: '陈工', purpose: '低库存补货' }).then(() => {
    showSpareRequestModal.value = false;
    reloadDetail('已生成前端补货记录，未调用采购中心接口');
  });
}

function addSpareUsage() {
  showSparePicker.value = true;
}

function pickSpare(row: OptionPickerRow) {
  spareUsages.value.push({
    id: Date.now(),
    spareId: String(row.id),
    spareCode: String(row.code),
    spareName: String(row.name),
    model: String(row.model),
    qty: 1,
    stockQty: Number(row.availableQty || row.stockQty || 0),
    warehouse: String(row.warehouse || ''),
  });
  showSparePicker.value = false;
}

function pickEquipment(row: OptionPickerRow) {
  form.equipmentId = row.id;
  form.equipmentName = row.name;
  if (isMaintenanceExecutionCreate.value) {
    const plan = preferredMaintenancePlanForEquipment(row.id);
    syncMaintenancePlan(plan);
    toastText.value = plan ? `已关联保养计划：${plan.name}` : '该设备暂无绑定保养计划';
  }
  showEquipmentPicker.value = false;
}

function pickEquipmentCategory(payload: CategoryPickerConfirmPayload) {
  form.category = payload.child.label;
  form.categoryParent = payload.parent.label;
  showEquipmentCategoryPicker.value = false;
}

function pickWorkshopLine(payload: CategoryPickerConfirmPayload) {
  form.workshop = payload.parent.label;
  form.line = payload.child.label;
  showWorkshopLinePicker.value = false;
}

function pickMaintenancePlanStrategy(row: OptionPickerRow) {
  form.maintenanceStrategy = String(row.name || '');
  form.maintenancePlanId = row.id;
  form.maintenancePlanCode = row.code;
  form.maintenanceType = row.maintenanceType;
  form.maintenanceCycle = row.cycleType;
  form.maintenanceStandard = row.standard;
  showMaintenancePlanPicker.value = false;
}

function pickInspectionPlan(row: OptionPickerRow) {
  form.inspectionStrategy = String(row.planName || '');
  form.inspectionPlanId = row.id;
  form.inspectionPlanCode = row.code;
  form.inspectionType = row.inspectionType;
  form.inspectionStandard = row.standard;
  showInspectionPlanPicker.value = false;
}

function pickPerson(persons: PersonPickerPerson[]) {
  const name = persons[0]?.name || '';
  form[personTarget.value] = name;
  pickedPersons.value = persons;
  showPersonPicker.value = false;
}

function openPersonPicker(target: 'ownerName' | 'assignee' | 'inspector' | 'reporter' | 'requester') {
  personTarget.value = target;
  pickedPersons.value = [];
  showPersonPicker.value = true;
}
</script>

<template>
  <equipment-setting-page v-if="settingKey" :setting-key="settingKey" :title="currentConfig.title" />

  <aw-form-page
    v-else-if="isCreate"
    :back-text="`返回${currentConfig.title}`"
    :actions="[{ key: 'save', label: '保存', primary: true }]"
    @back="goBackFromCreate"
    @action="saveForm"
  >
    <section class="aw-form-card">
      <div class="aw-detail-section-title">{{ formTitle }}</div>
      <div class="aw-form-grid equipment-create-grid">
        <template v-if="moduleKey === 'assets'">
          <label><span>设备名称</span><input v-model="form.name" /></label>
          <label><span>设备编号</span><input v-model="form.code" /></label>
          <label>
            <span>设备分类</span>
            <aw-search-trigger-input
              v-model="form.category"
              placeholder="请选择设备分类"
              readonly
              @open="showEquipmentCategoryPicker = true"
            />
          </label>
          <label><span>规格型号</span><input v-model="form.model" /></label>
          <label><span>制造商</span><input v-model="form.manufacturer" /></label>
          <label>
            <span>所属车间/产线</span>
            <aw-search-trigger-input
              :model-value="workshopLineDisplay"
              placeholder="请选择车间/产线"
              readonly
              @open="showWorkshopLinePicker = true"
            />
          </label>
          <label><span>责任部门</span><select v-model="form.ownerDept"><option>设备动力部</option><option>包装部</option></select></label>
          <label><span>责任人</span><button class="aw-picker-input" type="button" @click="openPersonPicker('ownerName')">{{ form.ownerName || '选择责任人' }}</button></label>
          <label><span>启用日期</span><input v-model="form.enabledAt" type="date" /></label>
          <label><span>设备状态</span><select v-model="form.status"><option v-for="item in equipmentStatusOptions" :key="item">{{ item }}</option></select></label>
          <label><span>额定功率</span><input v-model="form.ratedPower" /></label>
          <label><span>设备等级</span><select v-model="form.level"><option>关键</option><option>重要</option><option>一般</option></select></label>
          <label>
            <span>保养策略</span>
            <aw-search-trigger-input
              v-model="form.maintenanceStrategy"
              placeholder="请选择保养计划"
              readonly
              @open="showMaintenancePlanPicker = true"
            />
          </label>
          <label>
            <span>点检策略</span>
            <aw-search-trigger-input
              v-model="form.inspectionStrategy"
              placeholder="请选择点检计划"
              readonly
              @open="showInspectionPlanPicker = true"
            />
          </label>
        </template>

        <template v-else-if="isMaintenanceExecutionCreate">
          <label><span>保养设备</span><div class="equipment-search-field"><input :value="form.equipmentName || ''" readonly placeholder="请选择设备" /><button type="button" aria-label="搜索设备" title="搜索设备" @click="showEquipmentPicker = true">⌕</button></div></label>
          <label><span>关联保养计划</span><select v-model="form.planId" :disabled="!form.equipmentId" @change="syncSelectedMaintenancePlan"><option value="">{{ form.equipmentId ? '请选择设备关联的保养计划' : '请先选择设备' }}</option><option v-for="item in maintenancePlansForEquipment" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label><span>计划编号</span><input v-model="form.planCode" readonly /></label>
          <label><span>保养类型</span><input v-model="form.maintenanceType" readonly /></label>
          <label><span>保养周期</span><input :value="`${form.cycleType || '-'} / ${form.cycleValue || '-'}`" readonly /></label>
          <label><span>上次保养</span><input v-model="form.lastDate" readonly /></label>
          <label><span>下次保养</span><input v-model="form.nextDate" readonly /></label>
          <label><span>执行人</span><input :value="currentLoginUserName" readonly /></label>
        </template>

        <template v-else-if="moduleKey === 'maintenance'">
          <label><span>计划名称</span><input v-model="form.name" /></label>
          <label><span>适用设备</span><button class="aw-picker-input" type="button" @click="showEquipmentPicker = true">{{ rowsByType.assets.find((item) => item.id === form.equipmentId)?.name || '选择设备' }}</button></label>
          <label><span>保养类型</span><select v-model="form.maintenanceType"><option>日常保养</option><option>一级保养</option><option>二级保养</option><option>年度保养</option></select></label>
          <label><span>周期类型</span><select v-model="form.cycleType"><option>按天</option><option>按周</option><option>按月</option><option>按运行小时</option></select></label>
          <label><span>周期间隔</span><input v-model.number="form.cycleValue" type="number" /></label>
          <label><span>首次执行日期</span><input v-model="form.planDate" type="date" /></label>
          <label><span>提前预警天数</span><input v-model.number="form.warningDays" type="number" /></label>
          <label><span>责任人</span><button class="aw-picker-input" type="button" @click="openPersonPicker('ownerName')">{{ form.ownerName || '选择责任人' }}</button></label>
        </template>

        <template v-else-if="moduleKey === 'repairs'">
          <label><span>报修主题</span><input v-model="form.topic" /></label>
          <label><span>设备</span><button class="aw-picker-input" type="button" @click="showEquipmentPicker = true">{{ rowsByType.assets.find((item) => item.id === form.equipmentId)?.name || '选择设备' }}</button></label>
          <label><span>故障分类</span><select v-model="form.faultCategory"><option>机械故障</option><option>动力故障</option><option>点检异常</option></select></label>
          <label><span>影响范围</span><input v-model="form.impactScope" /></label>
          <label><span>紧急程度</span><select v-model="form.urgency"><option>高</option><option>中</option><option>低</option></select></label>
          <label><span>维修等级</span><select v-model="form.repairLevel"><option>紧急</option><option>一般</option></select></label>
          <label><span>报修人</span><button class="aw-picker-input" type="button" @click="openPersonPicker('reporter')">{{ form.reporter || '选择报修人' }}</button></label>
          <label><span>报修时间</span><input v-model="form.reportedAt" /></label>
        </template>

        <template v-else-if="moduleKey === 'inspections' && action === '点检执行'">
          <label><span>点检设备</span><button class="aw-picker-input" type="button" @click="showEquipmentPicker = true">{{ rowsByType.assets.find((item) => item.id === form.equipmentId)?.name || '选择设备' }}</button></label>
          <label><span>点检人</span><button class="aw-picker-input" type="button" @click="openPersonPicker('inspector')">{{ form.inspector || '选择点检人' }}</button></label>
          <label><span>点检时间</span><input v-model="form.inspectionAt" /></label>
          <label><span>点检结果</span><select v-model="form.result"><option>正常</option><option>异常</option></select></label>
          <label><span>点检类型</span><select v-model="form.inspectionType"><option>日点检</option><option>周点检</option><option>月点检</option><option>专项点检</option></select></label>
          <label><span>点检标准</span><select v-model="form.standard"><option>CNC日点检标准</option><option>空压机点检标准</option></select></label>
          <label class="wide"><span>异常说明</span><textarea v-model="form.exceptionDesc" placeholder="结果为异常时必填"></textarea></label>
        </template>

        <template v-else-if="moduleKey === 'inspections'">
          <label><span>计划名称</span><input v-model="form.planName" /></label>
          <label><span>适用设备</span><button class="aw-picker-input" type="button" @click="showEquipmentPicker = true">{{ rowsByType.assets.find((item) => item.id === form.equipmentId)?.name || '选择设备' }}</button></label>
          <label><span>点检类型</span><select v-model="form.inspectionType"><option>日点检</option><option>周点检</option><option>月点检</option><option>专项点检</option></select></label>
          <label><span>点检周期</span><input v-model="form.inspectionCycle" /></label>
          <label><span>点检人</span><button class="aw-picker-input" type="button" @click="openPersonPicker('inspector')">{{ form.inspector || '选择点检人' }}</button></label>
          <label><span>生效日期</span><input v-model="form.effectiveAt" type="date" /></label>
          <label><span>点检标准</span><select v-model="form.standard"><option>CNC日点检标准</option><option>空压机点检标准</option></select></label>
        </template>

        <template v-else-if="moduleKey === 'spares' && action === '备件申请'">
          <label><span>申请单号</span><input v-model="form.code" /></label>
          <label><span>申请类型</span><select v-model="form.requestType"><option>维修领用</option><option>保养领用</option><option>备件补货</option></select></label>
          <label><span>来源单据</span><input v-model="form.sourceCode" /></label>
          <label><span>设备</span><button class="aw-picker-input" type="button" @click="showEquipmentPicker = true">{{ form.equipmentName || rowsByType.assets.find((item) => item.id === form.equipmentId)?.name || '选择设备' }}</button></label>
          <label><span>申请人</span><button class="aw-picker-input" type="button" @click="openPersonPicker('requester')">{{ form.requester || '选择申请人' }}</button></label>
          <label><span>申请数量</span><input v-model.number="form.qty" type="number" /></label>
          <label><span>仓库</span><input v-model="form.warehouse" /></label>
          <label><span>状态</span><select v-model="form.status"><option>前端记录</option><option>待处理</option><option>已完成</option></select></label>
          <label class="wide"><span>用途说明</span><textarea v-model="form.purpose"></textarea></label>
        </template>

        <template v-else>
          <label><span>备件名称</span><input v-model="form.name" /></label>
          <label><span>备件编号</span><input v-model="form.code" /></label>
          <label><span>备件分类</span><select v-model="form.category"><option v-for="item in spareCategoryOptions" :key="item">{{ item }}</option></select></label>
          <label><span>规格型号</span><input v-model="form.model" /></label>
          <label><span>单位</span><input v-model="form.unit" /></label>
          <label><span>适用设备</span><input v-model="form.equipmentScope" /></label>
          <label><span>默认仓库</span><input v-model="form.warehouse" /></label>
          <label><span>默认库位</span><input v-model="form.location" /></label>
          <label><span>安全库存</span><input v-model.number="form.safeQty" type="number" /></label>
          <label><span>当前库存</span><input v-model.number="form.stockQty" type="number" /></label>
          <label><span>供应商</span><input v-model="form.supplier" /></label>
          <label><span>单价</span><input v-model.number="form.unitPrice" type="number" /></label>
          <label><span>状态</span><select v-model="form.status"><option>正常</option><option>低库存</option><option>停用</option></select></label>
        </template>
      </div>
    </section>

    <section v-if="['maintenance', 'inspections'].includes(moduleKey)" class="aw-form-card">
      <div class="aw-detail-section-title">{{ moduleKey === 'maintenance' ? (isMaintenanceExecutionCreate ? '保养项目执行' : '保养项目标准') : '点检项目表' }}</div>
      <aw-editable-sub-table :columns="moduleKey === 'maintenance' ? maintenanceItemColumns : inspectionItemColumns" :rows="subRows" :add-text="isMaintenanceExecutionCreate ? '补充项目' : '新增项目'" @add="openMaintenanceItemPicker">
        <template #cell="{ column, row }">
          <input v-model="row[column.key]" class="aw-input" />
        </template>
        <template #actions="{ index }">
          <span class="aw-link" style="color:var(--aw-danger)" @click="removeSubRow(index)">删除</span>
        </template>
      </aw-editable-sub-table>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">附件</div>
      <aw-attachment-table :rows="attachments" allow-remove-last @add="addAttachment" @remove="removeAttachment" />
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">{{ moduleKey === 'repairs' ? '保修详情' : '备注' }}</div>
      <aw-rich-text-editor v-model="richText" :placeholder="moduleKey === 'repairs' ? '请输入保修详情' : '请输入备注'" />
    </section>
  </aw-form-page>

  <aw-detail-page v-else-if="detailRow">
    <template #toolbar>
      <aw-detail-toolbar :actions="detailActions" @back="goList" @action="handleDetailAction" />
    </template>
    <template #header>
      <aw-detail-header :title="detailTitle(detailRow)" :code="detailCode(detailRow)" :status-text="detailStatus(detailRow)" :status-tone="toneByStatus(detailStatus(detailRow))" :metas="[{ label: '模块', value: listTitle }, { label: '负责人', value: String((detailRow as any).ownerName || (detailRow as any).assignee || (detailRow as any).inspector || '-') }]" />
    </template>
    <section class="aw-card">
      <aw-detail-tabs v-model="activeTab" :tabs="currentConfig.tabs" />
      <div class="equipment-tab-panel">
        <template v-if="detailRecordRows.length">
          <div class="aw-detail-section-title">{{ activeTab }}</div>
          <aw-editable-sub-table :columns="detailRecordColumns" :rows="detailRecordRows" add-text="查看记录" :show-add="false">
            <template #cell="{ column, row }"><span>{{ row[column.key] || '-' }}</span></template>
          </aw-editable-sub-table>
        </template>
        <template v-else-if="activeTab.includes('项目')">
          <div class="aw-detail-section-title">{{ activeTab }}</div>
          <aw-editable-sub-table :columns="moduleKey === 'maintenance' ? maintenanceItemColumns : inspectionItemColumns" :rows="((detailRow as any).items || [])" add-text="查看项目" :show-add="false">
            <template #cell="{ column, row }"><span>{{ row[column.key] || '-' }}</span></template>
          </aw-editable-sub-table>
        </template>
        <template v-else-if="activeTab.includes('备件') || activeTab.includes('消耗')">
          <div class="aw-detail-section-title">{{ activeTab }}</div>
          <aw-editable-sub-table :columns="spareUsageColumns" :rows="((detailRow as any).spareParts || [])" add-text="查看备件" :show-add="false">
            <template #cell="{ column, row }"><span>{{ row[column.key] || '-' }}</span></template>
          </aw-editable-sub-table>
        </template>
        <template v-else-if="activeTab.includes('基础') || activeTab.includes('计划') || activeTab.includes('报修') || activeTab.includes('派工') || activeTab.includes('维修处理') || activeTab.includes('点检') || activeTab.includes('备件信息')">
          <div class="aw-detail-section-title">{{ activeTab }}</div>
          <aw-detail-info-grid :items="detailFields(detailRow)" />
        </template>
        <template v-else-if="activeTab.includes('记录') || activeTab.includes('流水') || activeTab.includes('验收') || activeTab.includes('关联')">
          <div class="aw-detail-section-title">{{ activeTab }}</div>
          <aw-editable-sub-table
            :columns="detailRecordColumns"
            :rows="[{ id: 1, time: currentDate(), type: activeTab, content: `${detailTitle(detailRow)} ${activeTab}暂无业务记录`, operator: '系统' }]"
            add-text="查看记录"
            :show-add="false"
          >
            <template #cell="{ column, row }"><span>{{ row[column.key] || '-' }}</span></template>
          </aw-editable-sub-table>
        </template>
        <p v-else>当前 {{ activeTab }} 内容已按设备中心前端记录展示，后续可直接对接后端明细契约。</p>
      </div>
    </section>
  </aw-detail-page>

  <aw-list-page v-else>
    <template v-if="showListTree" #tree>
      <aw-resource-tree v-model="pickedTree" :title="activeTree.title" :total="treeTotal" :nodes="activeTree.nodes" />
    </template>
    <div v-if="listTitle !== currentConfig.title" class="aw-detail-section-title equipment-list-view-title">{{ listTitle }}</div>
    <div v-if="isRepairTaskView" class="equipment-flow-strip">
      <div v-for="item in repairTaskFlowStats" :key="item.key" class="equipment-flow-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
    <aw-list-toolbar
      :search-placeholder="listSearchPlaceholder"
      :create-label="currentConfig.createLabel"
      :actions="listToolbarActions"
      @search="keyword = $event; loadList()"
      @refresh="loadList"
      @filter="toastText = '筛选条件已按当前字段准备'"
      @columns="toastText = '字段配置入口已打开'"
      @import="toastText = '导入模板已准备'"
      @export="toastText = '导出任务已创建'"
      @create="goCreate"
    />
    <aw-data-table
      :columns="activeColumns"
      :rows="tableRows"
      :total="tableRows.length"
      :bulk-actions="currentConfig.bulkActions || [{ key: 'export', label: '批量导出' }]"
      :filter-values="columnFilters"
      @column-filter="setColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === currentConfig.linkKey" class="aw-link" @click="openDetail(record.id)">{{ value }}</span>
        <span v-else-if="column.key === 'status' || column.key.includes('Status')" :class="['aw-status', toneByStatus(String(value))]">{{ value || '-' }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(record.id)">查看</span>
        <span v-else>{{ value ?? '-' }}</span>
      </template>
    </aw-data-table>
  </aw-list-page>

  <aw-setting-modal :open="showStatusModal" title="切换设备状态" width="520px" @cancel="showStatusModal = false" @confirm="confirmStatus">
    <label class="equipment-modal-field">
      <span>设备状态</span>
      <select v-model="statusDraft"><option v-for="item in equipmentStatusOptions" :key="item">{{ item }}</option></select>
    </label>
    <p v-if="statusDraft === '报废'" class="equipment-danger-note">报废动作会改变设备生命周期状态，请确认后继续。</p>
  </aw-setting-modal>

  <aw-setting-modal :open="showDispatchModal" title="维修派工" width="720px" @cancel="showDispatchModal = false" @confirm="confirmDispatch">
    <div class="equipment-form-grid compact">
      <label><span>维修人员</span><button class="aw-picker-input" type="button" @click="openPersonPicker('assignee')">{{ form.assignee || '选择维修人员' }}</button></label>
      <label><span>计划开始时间</span><input v-model="form.plannedStartAt" /></label>
      <label><span>计划完成时间</span><input v-model="form.plannedEndAt" /></label>
      <label><span>维修等级</span><select v-model="form.repairLevel"><option>紧急</option><option>一般</option></select></label>
      <label><span>是否停机</span><select v-model="form.downtime"><option>否</option><option>是</option></select></label>
      <label class="wide"><span>处理要求</span><textarea v-model="form.requirement"></textarea></label>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="showRepairProcessModal" title="维修处理" width="860px" @cancel="showRepairProcessModal = false" @confirm="confirmRepairProcess">
    <div class="equipment-form-grid compact">
      <label><span>故障原因</span><input v-model="form.faultReason" /></label>
      <label><span>处理措施</span><input v-model="form.actionsTaken" /></label>
      <label><span>实际开始时间</span><input v-model="form.actualStartAt" /></label>
      <label><span>实际完成时间</span><input v-model="form.actualEndAt" /></label>
      <label><span>实际工时</span><input v-model.number="form.actualHours" type="number" /></label>
      <label><span>维修费用</span><input v-model.number="form.repairCost" type="number" /></label>
      <label><span>处理结果</span><select v-model="form.repairResult"><option>待验收</option><option>已修复</option><option>需复修</option></select></label>
    </div>
    <div class="equipment-modal-section">
      <aw-editable-sub-table :columns="spareUsageColumns" :rows="spareUsages" add-text="添加备件" @add="addSpareUsage">
        <template #cell="{ column, row }">
          <input v-if="column.key === 'qty'" v-model.number="row.qty" class="aw-input" type="number" />
          <span v-else>{{ row[column.key] || '-' }}</span>
        </template>
        <template #actions="{ index }"><span class="aw-link" style="color:var(--aw-danger)" @click="removeSpareUsage(index)">删除</span></template>
      </aw-editable-sub-table>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="showAcceptModal" title="维修验收" width="520px" @cancel="showAcceptModal = false" @confirm="confirmAccept(true)">
    <p>验收通过后维修单将完成，并按维修前状态回写设备状态；驳回后进入返修中。</p>
    <div class="equipment-form-grid compact">
      <label><span>验收人</span><input v-model="form.acceptedBy" /></label>
      <label class="wide"><span>验收意见</span><textarea v-model="form.acceptanceOpinion"></textarea></label>
      <label class="wide"><span>驳回原因</span><textarea v-model="form.rejectedReason" placeholder="驳回时填写"></textarea></label>
    </div>
    <template #footer>
      <button class="aw-tool-btn" type="button" @click="showAcceptModal = false">取消</button>
      <button class="aw-tool-btn danger" type="button" @click="confirmAccept(false)">驳回</button>
      <button class="aw-btn primary" type="button" @click="confirmAccept(true)">通过</button>
    </template>
  </aw-setting-modal>

  <aw-setting-modal :open="showCloseRepairModal" title="关闭维修单" width="520px" @cancel="showCloseRepairModal = false" @confirm="confirmCloseRepair">
    <div class="equipment-form-grid compact">
      <label><span>关闭人</span><input v-model="form.closedBy" /></label>
      <label class="wide"><span>关闭说明</span><textarea v-model="form.closeReason"></textarea></label>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="showMaintenanceModal" title="完成保养执行" width="860px" @cancel="showMaintenanceModal = false" @confirm="confirmMaintenance">
    <p>完成后会回写设备最近保养时间，并记录设备中心内备件领用。</p>
    <div class="equipment-form-grid compact">
      <label><span>执行结果</span><select v-model="form.executionResult"><option>已完成</option><option>异常完成</option></select></label>
      <label><span>实际开始时间</span><input v-model="form.actualStartAt" /></label>
      <label><span>实际完成时间</span><input v-model="form.actualEndAt" /></label>
      <label class="wide"><span>异常说明</span><textarea v-model="form.maintenanceException" placeholder="异常完成时填写"></textarea></label>
    </div>
    <aw-editable-sub-table :columns="spareUsageColumns" :rows="spareUsages" add-text="添加备件" @add="addSpareUsage">
      <template #cell="{ column, row }">
        <input v-if="column.key === 'qty'" v-model.number="row.qty" class="aw-input" type="number" />
        <span v-else>{{ row[column.key] || '-' }}</span>
      </template>
      <template #actions="{ index }"><span class="aw-link" style="color:var(--aw-danger)" @click="removeSpareUsage(index)">删除</span></template>
    </aw-editable-sub-table>
  </aw-setting-modal>

  <aw-setting-modal :open="showInspectionModal" title="完成点检" width="640px" @cancel="showInspectionModal = false" @confirm="confirmInspection">
    <div class="equipment-form-grid compact">
      <label><span>点检结果</span><select v-model="form.result"><option>正常</option><option>异常</option></select></label>
      <label class="wide"><span>异常说明</span><textarea v-model="form.exceptionDesc" placeholder="结果为异常时必填"></textarea></label>
    </div>
  </aw-setting-modal>

  <aw-setting-modal :open="showSpareRequestModal" title="备件补货记录" width="520px" @cancel="showSpareRequestModal = false" @confirm="confirmSpareRequest">
    <label class="equipment-modal-field"><span>申请数量</span><input v-model.number="form.qty" type="number" /></label>
    <p>第一阶段只生成设备中心前端记录，不调用采购中心接口。</p>
  </aw-setting-modal>

  <aw-setting-modal
    :open="showMaintenanceItemPicker"
    title="选择保养项目"
    width="960px"
    @cancel="showMaintenanceItemPicker = false"
    @confirm="showMaintenanceItemPicker = false"
  >
    <div class="equipment-picker-list">
      <div class="equipment-picker-list-title">
        <strong>保养项目列表</strong>
        <span>选择项目后自动带出项目下的保养标准</span>
      </div>
      <div class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl equipment-picker-table">
            <thead>
              <tr>
                <th style="width: 64px">序号</th>
                <th>项目名称</th>
                <th>项目编码</th>
                <th>适用范围</th>
                <th style="width: 110px">标准数量</th>
                <th style="width: 90px">状态</th>
                <th style="width: 90px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in maintenanceItemOptions" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.code }}</td>
                <td>{{ item.scope || '-' }}</td>
                <td>{{ item.standards?.length || 0 }}</td>
                <td>{{ item.enabled === false ? '停用' : '启用' }}</td>
                <td>
                  <span
                    class="aw-link"
                    :class="{ disabled: (form.maintenanceItemIds || []).includes(item.id) }"
                    @click="!(form.maintenanceItemIds || []).includes(item.id) && pickMaintenanceItem(item)"
                  >{{ (form.maintenanceItemIds || []).includes(item.id) ? '已选择' : '选择' }}</span>
                </td>
              </tr>
              <tr v-if="!maintenanceItemOptions.length">
                <td colspan="7" class="equipment-empty-cell">暂无保养项目</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <template #footer>
      <button class="aw-tool-btn" type="button" @click="showMaintenanceItemPicker = false">关闭</button>
    </template>
  </aw-setting-modal>

  <aw-category-picker-modal
    :open="showEquipmentCategoryPicker"
    title="选择设备分类"
    :groups="equipmentCategoryGroups"
    :default-parent-key="currentEquipmentCategoryParentKey"
    :default-child-key="form.category || ''"
    current-parent-label="当前一级分类："
    child-column-title="二级分类"
    code-column-title="分类编码"
    desc-column-title="来源"
    count-column-title="设备数"
    empty-text="当前一级分类暂无二级分类"
    @cancel="showEquipmentCategoryPicker = false"
    @confirm="pickEquipmentCategory"
  />
  <aw-category-picker-modal
    :open="showWorkshopLinePicker"
    title="选择所属车间/产线"
    :groups="workshopLineGroups"
    :default-parent-key="form.workshop || ''"
    :default-child-key="form.line || ''"
    current-parent-label="当前车间："
    child-column-title="产线"
    code-column-title="产线编码"
    desc-column-title="说明"
    count-column-title="设备数"
    empty-text="当前车间暂无产线"
    @cancel="showWorkshopLinePicker = false"
    @confirm="pickWorkshopLine"
  />
  <aw-option-picker-modal
    :open="showMaintenancePlanPicker"
    title="选择保养计划"
    category-title="保养类型"
    category-key="maintenanceType"
    search-placeholder="搜索保养计划、计划编号、适用设备或标准"
    :categories="maintenancePlanPickerCategories"
    :columns="maintenancePlanPickerColumns"
    :rows="maintenancePlanPickerRows"
    @cancel="showMaintenancePlanPicker = false"
    @confirm="pickMaintenancePlanStrategy"
  />
  <aw-option-picker-modal
    :open="showInspectionPlanPicker"
    title="选择点检计划"
    category-title="点检类型"
    category-key="inspectionType"
    search-placeholder="搜索点检计划、计划编号、适用设备或标准"
    :categories="inspectionPlanPickerCategories"
    :columns="inspectionPlanPickerColumns"
    :rows="inspectionPlanPickerRows"
    @cancel="showInspectionPlanPicker = false"
    @confirm="pickInspectionPlan"
  />
  <aw-option-picker-modal
    :open="showEquipmentPicker"
    title="选择设备"
    category-title="设备分类"
    category-key="category"
    search-placeholder="搜索设备名称、编号、分类或责任人"
    :categories="equipmentPickerCategories"
    :columns="equipmentPickerColumns"
    :rows="equipmentPickerRows"
    @cancel="showEquipmentPicker = false"
    @confirm="pickEquipment"
  />
  <aw-option-picker-modal :open="showSparePicker" title="选择备件" :columns="sparePickerColumns" :rows="sparePickerRows" @cancel="showSparePicker = false" @confirm="pickSpare" />
  <aw-person-picker-modal :open="showPersonPicker" title="选择人员" :depts="equipmentPeopleDepts" :picked="pickedPersons" @cancel="showPersonPicker = false" @confirm="pickPerson" />

  <div v-if="toastText" class="equipment-toast">{{ toastText }}</div>
</template>

<style scoped>
.equipment-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.equipment-form-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.equipment-form-grid label,
.equipment-modal-field {
  display: grid;
  gap: 6px;
}

.equipment-form-grid span,
.equipment-modal-field span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.equipment-form-grid input,
.equipment-form-grid select,
.equipment-form-grid textarea,
.equipment-modal-field input,
.equipment-modal-field select,
.aw-picker-input {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--aw-fg-1);
  min-height: 34px;
  padding: 0 10px;
  text-align: left;
  width: 100%;
}

.equipment-form-grid textarea {
  min-height: 72px;
  padding-top: 8px;
}

.aw-picker-input {
  cursor: pointer;
  line-height: 32px;
  overflow: hidden;
  padding-right: 40px;
  position: relative;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-picker-input::after {
  align-items: center;
  border-left: 1px solid var(--aw-border);
  color: var(--aw-primary);
  content: "⌕";
  display: flex;
  font-size: 16px;
  height: 100%;
  justify-content: center;
  position: absolute;
  right: 0;
  top: 0;
  width: 34px;
}

.aw-picker-input:hover::after {
  background: rgba(65, 108, 255, 0.06);
}

.equipment-form-grid .wide {
  grid-column: 1 / -1;
}

.equipment-picker-list {
  display: grid;
  gap: 12px;
}

.equipment-picker-list-title {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.equipment-picker-list-title span {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.equipment-picker-list .aw-doc-tbl-wrap,
.equipment-picker-list .aw-doc-tbl-inner {
  overflow: visible;
  width: 100%;
}

.equipment-picker-table {
  min-width: 100%;
  table-layout: fixed;
}

.equipment-picker-table th,
.equipment-picker-table td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-link.disabled {
  color: var(--aw-fg-3);
  cursor: default;
}

.equipment-empty-cell {
  color: var(--aw-fg-3);
  text-align: center;
}

.equipment-create-grid > label {
  display: grid;
  gap: 6px;
}

.equipment-create-grid > label > span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.equipment-create-grid input,
.equipment-create-grid select,
.equipment-create-grid textarea {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--aw-fg-1);
  min-height: 34px;
  padding: 0 10px;
  width: 100%;
}

.equipment-create-grid textarea {
  min-height: 72px;
  padding-top: 8px;
}

.equipment-search-field {
  position: relative;
}

.equipment-search-field button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--aw-primary);
  cursor: pointer;
  display: flex;
  font-size: 18px;
  height: 30px;
  justify-content: center;
  position: absolute;
  right: 3px;
  top: 2px;
  width: 30px;
}

.equipment-search-field input {
  padding-right: 36px;
}

.equipment-check-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.equipment-check-grid label {
  align-items: center;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  display: grid;
  gap: 4px;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  min-height: 36px;
  padding: 0 10px;
}

.equipment-check-grid input {
  height: 14px;
  min-height: 14px;
  padding: 0;
}

.equipment-check-grid strong {
  font-size: 13px;
  font-weight: 600;
}

.equipment-check-grid em {
  color: var(--aw-fg-3);
  font-size: 12px;
  font-style: normal;
}

.equipment-create-grid .wide {
  grid-column: 1 / -1;
}

.equipment-tab-panel {
  margin-top: 12px;
}

.equipment-list-view-title {
  margin: 0 0 12px;
}

.equipment-flow-strip {
  align-items: stretch;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: -2px 0 12px;
}

.equipment-flow-item {
  align-items: center;
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  min-height: 40px;
  padding: 0 12px;
}

.equipment-flow-item span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.equipment-flow-item strong {
  color: var(--aw-fg-1);
  font-size: 18px;
  font-weight: 700;
}

.equipment-modal-section {
  margin-top: 14px;
}

.equipment-danger-note {
  color: var(--aw-danger);
}

.equipment-toast {
  background: #111827;
  border-radius: 8px;
  bottom: 24px;
  color: #fff;
  left: 50%;
  padding: 10px 14px;
  position: fixed;
  transform: translateX(-50%);
  z-index: 30;
}

@media (max-width: 1100px) {
  .equipment-form-grid,
  .equipment-form-grid.compact {
    grid-template-columns: 1fr;
  }
}
</style>
