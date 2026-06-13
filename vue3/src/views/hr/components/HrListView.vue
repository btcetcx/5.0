<template>
  <aw-list-page>
    <template v-if="showTree" #tree>
      <aw-resource-tree
        :model-value="pickedGroup"
        :title="treeTitle"
        :total="items.length"
        :nodes="treeNodes"
        @select="selectTreeNode"
        @update:model-value="selectTreeNode"
      />
    </template>

    <aw-list-toolbar
      :actions="toolbarActions"
      :create-label="config.newLabel"
      :search-placeholder="`全局搜索（如${config.subjectLabel}、${config.codeLabel}、负责人）`"
      @columns="openDrawer('columns')"
      @create="router.push(`${config.route}?action=new`)"
      @export="openDrawer('export')"
      @filter="openDrawer('filter')"
      @import="openDrawer('import')"
      @refresh="loadData"
      @search="keyword = $event"
    />

    <div v-if="businessActions.length" class="hr-business-actions">
      <button v-for="action in businessActions" :key="action" class="aw-tool-btn" type="button" @click="openBusinessAction(action)">
        <span class="aw-line-icon line-doc" />{{ action }}
      </button>
    </div>

    <div v-if="toolbarNote" class="aw-form-note hr-note">{{ toolbarNote }}</div>

    <aw-data-table
      :bulk-actions="bulkActions"
      :columns="tableColumns"
      :filter-values="columnFilters"
      :rows="tableRows"
      :total="filteredItems.length"
      row-key="id"
      @batch-action="handleBatchAction"
      @column-filter="handleColumnFilter"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'subject'" class="aw-link" @click="openDetail(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'scheme'" class="aw-link" @click="openSchemePage(value)">{{ value }}</span>
        <span v-else-if="column.key === 'status'" :class="['aw-status', statusTone(String(value))]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(record.id as string)">查看</span>
        <span v-else>{{ value }}</span>
      </template>
    </aw-data-table>

    <hr-list-drawer
      v-if="drawerType"
      :columns="drawerColumns"
      :module-title="config.title"
      :open="Boolean(drawerType)"
      :statuses="config.statuses"
      :type="drawerType"
      @apply="applyDrawer"
      @close="drawerType = ''"
    />
  </aw-list-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { batchHrAction, listHrRecords } from '@/app/api/hr/resources';
import type { HrModuleConfig, HrRecord } from '@/app/api/hr/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwTableColumn, AwTreeNode, ToolbarActionKey } from '@/components/list-page/types';
import HrListDrawer from './HrListDrawer.vue';

const props = defineProps<{ config: HrModuleConfig }>();
const router = useRouter();
const items = ref<HrRecord[]>([]);
const orgItems = ref<HrRecord[]>([]);
const pickedGroup = ref('all');
const keyword = ref('');
const toolbarNote = ref('');
const columnFilters = ref<Record<string, string>>({});
const advancedFilters = ref({ status: '', owner: '', dateStart: '', dateEnd: '', preset: '' });
const drawerType = ref<'' | 'filter' | 'columns' | 'import' | 'export'>('');
const defaultToolbarActions: ToolbarActionKey[] = ['refresh', 'filter', 'columns', 'import', 'export', 'create'];
const bulkActions = [
  { key: 'submit', label: '批量提交' },
  { key: 'approve', label: '批量审批' },
  { key: 'disable', label: '批量停用' },
];

const tableColumns = computed<AwTableColumn[]>(() => {
  const baseColumns = props.config.listColumns.map((title, index) => ({
    key: listColumnKey(title, index),
    title,
    link: index === 0,
    width: listColumnWidth(title, index),
    numeric: /工资|金额|扣款|实发/.test(title),
    filterOptions: title === props.config.statusLabel ? props.config.statuses : undefined,
  }));
  const hasStatusColumn = props.config.listColumns.includes(props.config.statusLabel);
  return [
    ...baseColumns,
    ...(hasStatusColumn ? [] : [{ key: 'status', title: props.config.statusLabel, width: 120, filterOptions: props.config.statuses }]),
    { key: 'action', title: '操作', fixed: 'right', width: 110 },
  ];
});

const filteredItems = computed(() => {
  const term = keyword.value.trim();
  const status = columnFilters.value.status || advancedFilters.value.status;
  const owner = advancedFilters.value.owner;
  const dateStart = advancedFilters.value.dateStart;
  const dateEnd = advancedFilters.value.dateEnd;
  return items.value.filter((item) => {
    const groupMatched = !showTree.value
      || (isOrgTreeList.value
        ? pickedGroup.value === 'all' || matchesDepartment(treeDepartmentValue(item), pickedGroup.value)
        : pickedGroup.value === 'all' || item.group === pickedGroup.value || item.status === pickedGroup.value.replace(/^全部/, ''));
    const keywordMatched = !term || JSON.stringify(item).includes(term);
    const statusMatched = !status || item.status === status;
    const ownerMatched = !owner || item.owner === owner || String(item.amount || '').includes(owner) || String(item.left || '').includes(owner);
    const dateMatched = (!dateStart || String(item.date || '') >= dateStart) && (!dateEnd || String(item.date || '') <= dateEnd);
    return groupMatched && keywordMatched && statusMatched && ownerMatched && dateMatched;
  });
});

const tableRows = computed<Record<string, unknown>[]>(() => filteredItems.value.map((item) => ({ ...enrichRecord(item), action: '查看' })));
const treeNodes = computed<AwTreeNode[]>(() => {
  const counts = items.value.reduce<Record<string, number>>((result, item) => {
    result[item.group] = (result[item.group] || 0) + 1;
    result[item.status] = (result[item.status] || 0) + 1;
    result[item.party] = (result[item.party] || 0) + 1;
    return result;
  }, {});
  if (isOrgTreeList.value) {
    if (isPayrollList.value) {
      return orgRootNames.value.map((group) => ({
        key: group,
        label: group,
        count: items.value.filter((item) => matchesDepartment(treeDepartmentValue(item), group)).length,
        icon: 'line-users',
        level: 2 as const,
      }));
    }
    return [
      { key: 'all', label: '全部组织', count: items.value.length, icon: 'line-node', level: 2, open: true },
      ...orgRootNames.value.map((group) => ({
        key: group,
        label: group,
        count: items.value.filter((item) => matchesDepartment(treeDepartmentValue(item), group)).length,
        icon: 'line-users',
        level: 3 as const,
      })),
    ];
  }
  return [
    { key: 'all', label: props.config.groups[0], count: items.value.length, icon: 'line-users', level: 2, open: true },
    ...props.config.groups.slice(1).map((group) => ({
      key: group,
      label: group,
      count: counts[group] || 0,
      icon: 'line-node',
      level: 3 as const,
    })),
  ];
});
const drawerColumns = computed(() => tableColumns.value.map((column) => column.title));
const isEmployeeList = computed(() => props.config.resource === 'hr-employees');
const isPayrollList = computed(() => props.config.resource === 'hr-payroll');
const isAttendanceList = computed(() => props.config.resource === 'hr-attendance');
const isOrgTreeList = computed(() => isEmployeeList.value || isPayrollList.value || isAttendanceList.value);
const treeTitle = computed(() => (isPayrollList.value ? '部门列表' : isEmployeeList.value || isAttendanceList.value ? '组织架构' : props.config.treeTitle));
const orgRootNames = computed(() => {
  const names = orgItems.value
    .map((item) => String(item.party || item.group || '').trim())
    .filter(Boolean);
  const next = names.length ? names : props.config.groups.slice(1);
  return Array.from(new Set(next));
});
const toolbarActions = computed<ToolbarActionKey[]>(() => (
  props.config.resource === 'hr-payroll'
    ? defaultToolbarActions.filter((action) => action !== 'create')
    : defaultToolbarActions
));
const showTree = computed(() => props.config.resource !== 'hr-positions');
const businessActions = computed(() => props.config.actions);

watch(() => props.config.resource, () => {
  pickedGroup.value = 'all';
  keyword.value = '';
  columnFilters.value = {};
  void loadData();
});

async function loadData() {
  const [result, orgResult] = await Promise.all([
    listHrRecords(props.config.resource, { pageNo: 1, pageSize: 50 }),
    isOrgTreeList.value ? listHrRecords('hr-orgs', { pageNo: 1, pageSize: 100 }) : Promise.resolve({ items: [] as HrRecord[] }),
  ]);
  items.value = result.items;
  orgItems.value = orgResult.items;
  if (isPayrollList.value) {
    const firstDepartment = orgRootNames.value[0];
    if (firstDepartment && (pickedGroup.value === 'all' || !orgRootNames.value.includes(pickedGroup.value))) {
      pickedGroup.value = firstDepartment;
    }
  }
}

function openDetail(id: string) {
  router.push(`${props.config.route}?id=${encodeURIComponent(id)}`);
}

function openSchemePage(value: unknown) {
  const scheme = String(value || '').trim();
  const query = scheme ? `&scheme=${encodeURIComponent(scheme)}` : '';
  router.push(`${props.config.route}?action=${encodeURIComponent('薪资方案')}${query}`);
}

function openBusinessAction(action: string) {
  router.push(`${props.config.route}?action=${encodeURIComponent(action)}`);
}

function handleColumnFilter(columnKey: string, value: string) {
  columnFilters.value = { ...columnFilters.value, [columnKey]: value };
}

function selectTreeNode(key: string) {
  pickedGroup.value = key;
}

function treeDepartmentValue(item: HrRecord) {
  return isAttendanceList.value ? deriveDepartment(item) : item.party;
}

function matchesDepartment(value: unknown, group: string) {
  const department = String(value || '');
  const baseGroup = group.replace(/部$/, '');
  return department === group || department.includes(group) || Boolean(baseGroup && department.includes(baseGroup));
}

async function handleBatchAction(actionKey: string, keys: string[]) {
  if (!keys.length) {
    toolbarNote.value = '请先选择需要处理的数据。';
    return;
  }
  if (actionKey === 'disable' && !window.confirm(`确认停用已选 ${keys.length} 条${props.config.title}数据吗？`)) return;
  const action = actionKey === 'approve' ? 'approve' : actionKey === 'disable' ? 'disable' : 'submit';
  await batchHrAction(props.config.resource, keys, action);
  toolbarNote.value = `${actionKey} 已处理 ${keys.length} 条，并回写 HR mock 状态。`;
  await loadData();
}

function openDrawer(type: 'filter' | 'columns' | 'import' | 'export') {
  drawerType.value = type;
}

function applyDrawer(payload?: { status?: string; owner?: string; dateStart?: string; dateEnd?: string; preset?: string; exportFormat?: string; fileName?: string }) {
  const labelMap = { filter: '筛选', columns: '字段配置', import: '导入', export: '导出' };
  if (drawerType.value === 'filter' && payload) {
    advancedFilters.value = {
      status: payload.status || '',
      owner: payload.owner || '',
      dateStart: payload.dateStart || '',
      dateEnd: payload.dateEnd || '',
      preset: payload.preset || '',
    };
  }
  toolbarNote.value = `${drawerType.value ? labelMap[drawerType.value] : '工具'}已触发，后续对接 ${props.config.resource} 对应接口。`;
  if (drawerType.value === 'import' && payload?.fileName) toolbarNote.value = `${payload.fileName} 已进入导入校验队列。`;
  if (drawerType.value === 'export' && payload?.exportFormat) toolbarNote.value = `已按 ${payload.exportFormat} 格式生成${props.config.title}导出任务。`;
  drawerType.value = '';
}

function listColumnKey(title: string, index: number) {
  const maps: Record<string, Record<string, string>> = {
    'hr-employees': {
      员工姓名: 'subject',
      员工编号: 'code',
      性别: 'gender',
      手机号码: 'done',
      所属部门: 'party',
      '岗位/职级': 'amount',
      员工类型: 'employeeType',
      直属上级: 'left',
      入职日期: 'date',
      计划转正日: 'probationEndDate',
      合同类型: 'contractType',
      办公地点: 'officeLocation',
    },
    'hr-orgs': {
      组织名称: 'subject',
      组织编号: 'code',
      上级组织: 'party',
      组织类型: 'orgType',
      负责人: 'owner',
      编制人数: 'done',
      在岗人数: 'left',
      空缺人数: 'vacancy',
      成本中心: 'costCenter',
      办公地点: 'officeLocation',
      创建日期: 'date',
    },
    'hr-positions': {
      岗位名称: 'subject',
      岗位编号: 'code',
      所属组织: 'party',
      岗位序列: 'group',
      岗位类型: 'positionType',
      岗位等级: 'amount',
      直接上级: 'directSupervisor',
      岗位编制: 'done',
      在岗人数: 'left',
      空缺人数: 'vacancy',
      薪级范围: 'salaryRange',
      生效日期: 'date',
    },
    'hr-payroll': {
      员工姓名: 'subject',
      员工编号: 'code',
      工资单号: 'payrollNo',
      所属部门: 'party',
      '岗位/职级': 'position',
      手机号码: 'phone',
      直属上级: 'supervisor',
      薪资方案: 'scheme',
      应发工资: 'amount',
      扣款合计: 'done',
      实发工资: 'left',
      社保: 'socialSecurity',
      公积金: 'housingFund',
      个税: 'incomeTax',
      发薪账户: 'bankAccount',
      财务状态: 'financeStatus',
      薪资月份: 'date',
    },
    'hr-attendance': {
      考勤主题: 'subject',
      考勤单号: 'code',
      考勤人员: 'party',
      所属部门: 'department',
      班次: 'shiftName',
      应出勤: 'plannedAttendance',
      实际出勤: 'actualAttendance',
      异常类型: 'amount',
      上班打卡: 'done',
      下班打卡: 'left',
      考勤日期: 'date',
      锁定状态: 'lockState',
      薪酬同步: 'payrollSync',
      处理状态: 'status',
    },
    'hr-schedules': {
      排班主题: 'subject',
      排班编号: 'code',
      考勤组: 'party',
      适用组织: 'department',
      适用人数: 'done',
      班次: 'amount',
      工作时段: 'workTime',
      休息规则: 'left',
      排班周期: 'schedulePeriod',
      冲突数: 'conflictCount',
      排班日期: 'date',
    },
    'hr-archives': {
      档案名称: 'subject',
      档案编号: 'code',
      归属主体: 'party',
      档案类型: 'amount',
      '证件/合同编号': 'archiveNo',
      形成日期: 'done',
      '到期/复核日期': 'left',
      保管位置: 'storage',
      密级: 'confidentiality',
      借阅状态: 'borrowState',
      提醒规则: 'reminderRule',
      归档日期: 'date',
    },
    'hr-office': {
      申请主题: 'subject',
      申请单号: 'code',
      申请人: 'party',
      事项类型: 'amount',
      所属部门: 'done',
      经办人: 'left',
      优先级: 'priority',
      当前节点: 'currentNode',
      办理时限: 'timeLimit',
      期望完成日期: 'expectedFinishDate',
      申请日期: 'date',
    },
  };
  const fallbackKeys = ['subject', 'code', 'party', 'amount', 'done', 'left', 'date'];
  return maps[props.config.resource]?.[title] || fallbackKeys[index] || 'subject';
}

function listColumnWidth(title: string, index: number) {
  if (index === 0) return 180;
  if (/合同|办公地点|成本中心|直接上级|薪级|岗位\/职级/.test(title)) return 160;
  if (/编号|手机/.test(title)) return 150;
  if (/日期|转正/.test(title)) return 130;
  if (/人数|占用率|性别|状态/.test(title)) return 110;
  return 140;
}

function enrichRecord(item: HrRecord) {
  const plan = Number(item.done);
  const actual = Number(item.left);
  const hasHeadcount = Number.isFinite(plan) && Number.isFinite(actual);
  const vacancy = hasHeadcount ? Math.max(0, plan - actual) : '';
  const occupancyRate = hasHeadcount && plan > 0 ? `${Math.round((actual / plan) * 100)}%` : '';
  return {
    ...item,
    vacancy,
    occupancyRate,
    phone: item.done,
    supervisor: item.left,
    department: deriveDepartment(item),
    shiftName: item.amount,
    plannedAttendance: item.status === '正常' || item.status === '已处理' ? '1天' : '1天',
    actualAttendance: item.status === '正常' || item.amount === '正常' ? '1天' : '0.94天',
    lockState: item.status === '已处理' || item.status === '已归档' ? '已锁定' : '未锁定',
    payrollSync: item.status === '已处理' || item.status === '已归档' ? '可同步' : '待处理',
    workTime: item.amount === '值班班' ? '10:00-19:00' : item.amount === '早晚班' ? '08:00-16:00 / 16:00-24:00' : '09:00-18:00',
    schedulePeriod: String(item.subject || '').includes('六月') ? '2026-06' : '按月',
    conflictCount: item.status === '草稿' ? '1' : '0',
    financeStatus: deriveFinanceStatus(item),
    confidentiality: deriveArchiveConfidentiality(item),
    borrowState: deriveArchiveBorrowState(item),
    priority: deriveOfficePriority(item),
    currentNode: deriveOfficeNode(item),
    timeLimit: deriveOfficeTimeLimit(item),
    expectedFinishDate: deriveExpectedFinishDate(item),
  };
}

function deriveDepartment(item: HrRecord) {
  const text = String(item.party || item.group || '');
  if (text.includes('张园') || text.includes('销售')) return '销售部';
  if (text.includes('李文涛') || text.includes('研发')) return '研发部';
  if (text.includes('财务')) return '财务部';
  if (text.includes('客服')) return '客服部';
  return text || '-';
}

function deriveFinanceStatus(item: HrRecord) {
  const rows = item.detailRows as Record<string, string[][]> | undefined;
  const finance = rows?.finance?.[0];
  return finance?.[5] || (item.status === '已发放' ? '已付款' : item.status === '待发放' ? '待生成付款单' : '核算校验中');
}

function deriveArchiveConfidentiality(item: HrRecord) {
  if (String(item.group || item.amount || '').includes('奖惩')) return '内部';
  if (String(item.amount || '').includes('合同')) return '受限';
  return '普通';
}

function deriveArchiveBorrowState(item: HrRecord) {
  if (String(item.status || '').includes('过期')) return '冻结借阅';
  if (String(item.status || '').includes('到期')) return '复核中';
  return '可借阅';
}

function deriveOfficePriority(item: HrRecord) {
  const status = String(item.status || '');
  if (status === '审批中') return '高';
  if (status === '驳回') return '低';
  return '普通';
}

function deriveOfficeNode(item: HrRecord) {
  const status = String(item.status || '');
  if (status === '草稿') return '申请人草稿';
  if (status === '审批中') return '部门负责人审批';
  if (status === '已通过') return '行政办理';
  if (status === '驳回') return '退回补充';
  return '人力行政受理';
}

function deriveOfficeTimeLimit(item: HrRecord) {
  if (String(item.amount || '').includes('证明')) return '2个工作日';
  if (String(item.amount || '').includes('会议')) return '1个工作日';
  return '3个工作日';
}

function deriveExpectedFinishDate(item: HrRecord) {
  if (typeof item.expectedFinishDate === 'string' && item.expectedFinishDate) return item.expectedFinishDate;
  const source = String(item.date || '');
  const matched = source.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return source || '-';
  const date = new Date(`${source}T00:00:00`);
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

function statusTone(status: string) {
  if (['在职', '启用', '正常', '已处理', '已发布', '已发放', '已入职', '已转正', '已归档', '有效', '已通过', '已同步'].includes(status)) return 'green';
  if (['离职', '停用', '异常', '驳回', '已过期', '冻结'].includes(status)) return 'red';
  return 'yellow';
}

onMounted(loadData);
</script>

<style scoped>
.hr-business-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 0 10px;
}
</style>
