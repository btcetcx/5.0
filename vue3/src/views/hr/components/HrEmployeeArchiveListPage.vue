<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { displayEmployeeArchiveSensitiveField } from '@/app/api/hr/employeeArchiveFieldAccess';
import { listHrEmployeeArchives, listHrRecords } from '@/app/api/hr/resources';
import type { HrEmployeeArchive, HrRecord } from '@/app/api/hr/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwBulkAction, AwTableColumn, AwTreeNode, ToolbarActionKey } from '@/components/list-page/types';

interface ArchiveFilterState {
  name: string;
  mobile: string;
  department: string;
  workStatus: string;
  entryStart: string;
  entryEnd: string;
}

const router = useRouter();
const archives = ref<HrEmployeeArchive[]>([]);
const orgRows = ref<HrRecord[]>([]);
const pickedDept = ref('all');
const keyword = ref('');
const columnFilters = ref<Record<string, string>>({});
const note = ref('');
const showFilterPanel = ref(false);
const filters = ref<ArchiveFilterState>(createEmptyFilters());
const draftFilters = ref<ArchiveFilterState>(createEmptyFilters());

const toolbarActions: ToolbarActionKey[] = ['refresh', 'filter', 'columns', 'import', 'export'];
const bulkActions: AwBulkAction[] = [
  { key: 'export', label: '批量导出' },
  { key: 'download-materials', label: '批量下载资料' },
];
const workStatusOptions = ['试用期', '已转正', '离职'];
const tableColumns: AwTableColumn[] = [
  { key: 'name', title: '姓名', link: true, width: 120 },
  { key: 'sex', title: '性别', width: 90 },
  { key: 'mobileMasked', title: '手机号', width: 150 },
  { key: 'birthday', title: '生日', width: 130 },
  { key: 'qualification', title: '最高学历', width: 120 },
  { key: 'nowAddressMasked', title: '现住地址', width: 220 },
  { key: 'idCardMasked', title: '身份证', width: 180 },
  { key: 'bankAccountNoMasked', title: '工资卡号', width: 180 },
  { key: 'workStatusText', title: '在职状态', width: 120, filterOptions: workStatusOptions },
  { key: 'departmentName', title: '所属部门', width: 130 },
  { key: 'postName', title: '岗位', width: 140 },
  { key: 'entryTime', title: '入职日期', width: 130 },
  { key: 'action', title: '操作', fixed: 'right', width: 130 },
];

const departmentOptions = computed(() => orgRows.value.map((row) => ({
  key: `org:${row.id}`,
  name: String(row.subject || row.party || row.group || row.id),
  group: String(row.party || row.group || '组织机构'),
})));

const treeNodes = computed<AwTreeNode[]>(() => {
  const groups = Array.from(new Set(orgRows.value.map((row) => String(row.party || row.group || '组织机构'))));
  const nodes: AwTreeNode[] = [
    { key: 'all', label: '全部组织', count: archives.value.length, icon: 'line-node', level: 2, open: true },
  ];
  groups.forEach((group) => {
    nodes.push({
      key: `group:${group}`,
      label: group,
      count: archives.value.filter((item) => archiveMatchesDepartment(item, `group:${group}`)).length,
      icon: 'line-folder',
      level: 2,
      open: true,
    });
    orgRows.value
      .filter((row) => String(row.party || row.group || '组织机构') === group)
      .forEach((row) => {
        const key = `org:${row.id}`;
        nodes.push({
          key,
          label: String(row.subject || row.id),
          count: archives.value.filter((item) => archiveMatchesDepartment(item, key)).length,
          icon: 'line-users',
          level: 3,
        });
      });
  });
  return nodes;
});

const filteredArchives = computed(() => {
  const term = keyword.value.trim();
  const tableStatus = columnFilters.value.workStatusText || '';
  const filter = filters.value;
  return archives.value.filter((item) => {
    const deptKey = filter.department || pickedDept.value;
    const deptMatched = archiveMatchesDepartment(item, deptKey);
    const tableStatusMatched = !tableStatus || item.workStatusText === tableStatus;
    const filterStatusMatched = !filter.workStatus || item.workStatusText === filter.workStatus;
    const keywordMatched = !term || [item.name, item.mobile, item.departmentName, item.workNo, item.postName].some((value) => String(value || '').includes(term));
    const nameMatched = !filter.name || item.name.includes(filter.name.trim());
    const mobileMatched = !filter.mobile || item.mobile.includes(filter.mobile.trim());
    const entryMatched = dateInRange(item.entryTime, filter.entryStart, filter.entryEnd);
    return deptMatched && tableStatusMatched && filterStatusMatched && keywordMatched && nameMatched && mobileMatched && entryMatched;
  });
});

const tableRows = computed<Record<string, unknown>[]>(() => filteredArchives.value.map((item) => ({
  ...item,
  mobileMasked: displayEmployeeArchiveSensitiveField('mobile', item.mobile),
  idCardMasked: displayEmployeeArchiveSensitiveField('idCard', item.idCard),
  bankAccountNoMasked: displayEmployeeArchiveSensitiveField('bankAccountNo', item.bankAccountNo),
  nowAddressMasked: displayEmployeeArchiveSensitiveField('nowAddress', item.nowAddress),
  action: '查看 修改',
})));

async function loadData() {
  const [archiveResult, orgResult] = await Promise.all([
    listHrEmployeeArchives({ pageNo: 1, pageSize: 100 }),
    listHrRecords('hr-orgs', { pageNo: 1, pageSize: 200 }),
  ]);
  archives.value = archiveResult.items;
  orgRows.value = orgResult.items;
}

function createEmptyFilters(): ArchiveFilterState {
  return {
    name: '',
    mobile: '',
    department: '',
    workStatus: '',
    entryStart: '',
    entryEnd: '',
  };
}

function archiveMatchesDepartment(item: HrEmployeeArchive, key: string) {
  if (!key || key === 'all') return true;
  if (key.startsWith('group:')) {
    const group = key.slice(6);
    return [item.departmentName, item.departmentId].some((value) => String(value || '').includes(group) || group.includes(String(value || '')));
  }
  if (key.startsWith('org:')) {
    const orgId = key.slice(4);
    const org = orgRows.value.find((row) => row.id === orgId);
    if (!org) return item.departmentId === orgId;
    const labels = [org.id, org.subject, org.party, org.group].map((value) => String(value || '')).filter(Boolean);
    return labels.some((label) => item.departmentId === label || item.departmentName === label || item.departmentName.includes(label) || label.includes(item.departmentName));
  }
  return item.departmentId === key || item.departmentName === key;
}

function dateInRange(date: string, start: string, end: string) {
  if (!start && !end) return true;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function canEditEmployeeArchive() {
  return true;
}

function canExportEmployeeArchive() {
  return true;
}

function openFilterPanel() {
  draftFilters.value = { ...filters.value };
  showFilterPanel.value = true;
}

function applyFilters() {
  filters.value = { ...draftFilters.value };
  showFilterPanel.value = false;
  note.value = '筛选条件已应用。';
}

function resetFilters() {
  draftFilters.value = createEmptyFilters();
  filters.value = createEmptyFilters();
  note.value = '筛选条件已重置。';
}

function openDetail(id: string) {
  router.push(`/hr/archives?action=${encodeURIComponent('员工档案')}&id=${encodeURIComponent(id)}`);
}

function openEdit(id: string) {
  router.push(`/hr/archives?action=${encodeURIComponent('员工档案编辑')}&id=${encodeURIComponent(id)}`);
}

function handleBatchAction(action: string, keys: string[]) {
  if (!keys.length) {
    note.value = '请先选择需要处理的员工档案。';
    return;
  }
  note.value = action === 'export'
    ? `已生成 ${keys.length} 条员工档案导出任务。`
    : `已生成 ${keys.length} 条员工资料下载任务。`;
}

function handleToolbar(action: string) {
  if (action === 'export' && !canExportEmployeeArchive()) return;
  note.value = `${action} 已触发，后续对接员工档案接口。`;
}

onMounted(loadData);
</script>

<template>
  <AwListPage>
    <template #tree>
      <AwResourceTree
        v-model="pickedDept"
        title="组织机构"
        source-text="来源：组织机构"
        :total="archives.length"
        :nodes="treeNodes"
      />
    </template>

    <div class="hr-employee-archive-title">
      <h3>员工档案</h3>
      <span>维护员工个人档案聚合视图，敏感字段已统一预留字段权限展示出口。</span>
    </div>

    <AwListToolbar
      :actions="toolbarActions"
      search-placeholder="搜索员工姓名、手机号、工号、部门、岗位"
      @columns="handleToolbar('字段配置')"
      @export="handleToolbar('导出')"
      @filter="openFilterPanel"
      @import="handleToolbar('导入')"
      @refresh="loadData"
      @search="keyword = $event"
    />

    <section v-if="showFilterPanel" class="aw-form-card hr-employee-filter-panel">
      <div class="hr-employee-filter-grid">
        <label>
          <span>姓名</span>
          <input v-model="draftFilters.name" class="aw-input" placeholder="输入姓名" />
        </label>
        <label>
          <span>手机号</span>
          <input v-model="draftFilters.mobile" class="aw-input" placeholder="输入手机号" />
        </label>
        <label>
          <span>部门</span>
          <select v-model="draftFilters.department" class="aw-select">
            <option value="">全部部门</option>
            <option v-for="dept in departmentOptions" :key="dept.key" :value="dept.key">{{ dept.name }}</option>
          </select>
        </label>
        <label>
          <span>在职状态</span>
          <select v-model="draftFilters.workStatus" class="aw-select">
            <option value="">全部状态</option>
            <option v-for="status in workStatusOptions" :key="status">{{ status }}</option>
          </select>
        </label>
        <label>
          <span>入职开始</span>
          <input v-model="draftFilters.entryStart" class="aw-input" type="date" />
        </label>
        <label>
          <span>入职结束</span>
          <input v-model="draftFilters.entryEnd" class="aw-input" type="date" />
        </label>
      </div>
      <div class="hr-employee-filter-actions">
        <button class="aw-btn" type="button" @click="resetFilters">重置</button>
        <button class="aw-btn" type="button" @click="showFilterPanel = false">收起</button>
        <button class="aw-btn primary" type="button" @click="applyFilters">应用筛选</button>
      </div>
    </section>

    <div v-if="note" class="aw-form-note hr-employee-archive-note">{{ note }}</div>

    <AwDataTable
      :bulk-actions="bulkActions"
      :columns="tableColumns"
      :filter-values="columnFilters"
      :rows="tableRows"
      :total="filteredArchives.length"
      row-key="id"
      @batch-action="handleBatchAction"
      @column-filter="(key, value) => columnFilters = { ...columnFilters, [key]: value }"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'name'" class="aw-link" @click="openDetail(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'workStatusText'" :class="['aw-status', record.workStatusText === '离职' ? 'red' : record.workStatusText === '试用期' ? 'yellow' : 'green']">{{ value }}</span>
        <span v-else-if="column.key === 'action'">
          <span class="aw-link" @click="openDetail(record.id as string)">查看</span>
          <span v-if="canEditEmployeeArchive()" class="aw-link hr-employee-archive-action" @click="openEdit(record.id as string)">修改</span>
        </span>
        <span v-else>{{ value || '-' }}</span>
      </template>
    </AwDataTable>
  </AwListPage>
</template>

<style scoped>
.hr-employee-archive-note {
  margin-bottom: 10px;
}

.hr-employee-archive-title {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 0 0 10px;
}

.hr-employee-archive-title h3 {
  font-size: 16px;
  margin: 0;
}

.hr-employee-archive-title span {
  color: var(--aw-fg-3);
  font-size: 13px;
}

.hr-employee-filter-panel {
  margin: 12px 0;
}

.hr-employee-filter-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hr-employee-filter-grid label {
  display: grid;
  gap: 6px;
}

.hr-employee-filter-grid span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.hr-employee-filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}

.hr-employee-archive-action {
  margin-left: 10px;
}

@media (max-width: 1100px) {
  .hr-employee-filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
