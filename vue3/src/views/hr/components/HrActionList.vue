<template>
  <aw-list-page>
    <template v-if="showTree" #tree>
      <aw-resource-tree
        :model-value="pickedTree"
        :title="treeTitle"
        :total="rows.length"
        :nodes="treeNodes"
        @select="selectTreeNode"
        @update:model-value="selectTreeNode"
      />
    </template>

    <aw-list-toolbar
      :actions="toolbarActions"
      :create-label="createLabel"
      :search-placeholder="`全局搜索：${profile.title}、${config.codeLabel}、负责人`"
      @columns="openDrawer('columns')"
      @create="openCreate"
      @export="openDrawer('export')"
      @filter="openDrawer('filter')"
      @import="openDrawer('import')"
      @refresh="refreshActionList"
      @search="keyword = $event"
    />

    <div v-if="toolbarNote" class="aw-form-note hr-note">{{ toolbarNote }}</div>

    <aw-data-table :columns="columns" :rows="tableRows" :total="filteredRows.length" row-key="id">
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'c0'" class="aw-link" @click="openDetail(record.id as string)">{{ value }}</span>
        <span v-else-if="column.key === 'status'" :class="['aw-status', statusTone(String(value))]">{{ value }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetail(record.id as string)">查看</span>
        <span v-else>{{ value }}</span>
      </template>
    </aw-data-table>

    <hr-list-drawer
      v-if="drawerType"
      :columns="drawerColumns"
      :module-title="profile.title"
      :open="Boolean(drawerType)"
      :statuses="profile.statuses"
      :type="drawerType"
      @apply="applyDrawer"
      @close="drawerType = ''"
    />
  </aw-list-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { listHrRecords } from '@/app/api/hr/resources';
import type { HrActionProfile, HrModuleConfig } from '@/app/api/hr/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import type { AwTableColumn, AwTreeNode, ToolbarActionKey } from '@/components/list-page/types';
import HrListDrawer from './HrListDrawer.vue';

const props = defineProps<{ config: HrModuleConfig; profile: HrActionProfile }>();
const router = useRouter();
const pickedTree = ref('all');
const keyword = ref('');
const orgItems = ref<Array<{ party?: unknown; group?: unknown }>>([]);
const toolbarNote = ref('');
const drawerType = ref<'' | 'filter' | 'columns' | 'import' | 'export'>('');
const actionFilters = ref({ status: '', owner: '', dateStart: '', dateEnd: '' });
const toolbarActions: ToolbarActionKey[] = ['refresh', 'filter', 'columns', 'import', 'export', 'create'];
const isEmployeeAction = computed(() => props.config.resource === 'hr-employees');
const isOrganizationTreeAction = computed(() => isEmployeeAction.value || (props.config.resource === 'hr-attendance' && props.profile.title === '考勤列表'));
const createLabel = computed(() => props.profile.newLabel);
const showTree = computed(() => props.config.resource !== 'hr-positions');
const departmentColumnIndex = computed(() => props.profile.columns.findIndex((title) => /所属部门|部门/.test(title)));
const archiveCategoryColumnIndex = computed(() => {
  if (props.config.resource !== 'hr-archives') return -1;
  return props.profile.columns.findIndex((title) => title === '合同类型' || title === '证件类型');
});
const hasArchiveCategoryTree = computed(() => archiveCategoryColumnIndex.value >= 0);
const archiveCategoryKind = computed<'contract' | 'certificate' | ''>(() => {
  const title = props.profile.columns[archiveCategoryColumnIndex.value] || '';
  if (title === '合同类型') return 'contract';
  if (title === '证件类型') return 'certificate';
  return '';
});
const treeTitle = computed(() => {
  if (isOrganizationTreeAction.value) return '组织架构';
  if (archiveCategoryKind.value === 'contract') return '合同分类';
  if (archiveCategoryKind.value === 'certificate') return '证件分类';
  return props.profile.statusLabel;
});

const rows = computed(() => props.profile.rows.map((row, index) => ({
  id: `${props.config.resource}_action_${index}`,
  status: row[row.length - 1],
  department: departmentColumnIndex.value >= 0 ? row[departmentColumnIndex.value] : '',
  category: archiveCategoryColumnIndex.value >= 0 ? row[archiveCategoryColumnIndex.value] : '',
  ...Object.fromEntries(row.slice(0, -1).map((cell, cellIndex) => [`c${cellIndex}`, cell])),
})));
const filteredRows = computed(() => {
  const term = keyword.value.trim();
  return rows.value.filter((row) => {
    const treeMatched = !showTree.value
      || pickedTree.value === 'all'
      || (isOrganizationTreeAction.value
        ? matchesEmployeeDepartment(row.department, pickedTree.value)
        : hasArchiveCategoryTree.value
          ? row.category === pickedTree.value
          : row.status === pickedTree.value);
    const keywordMatched = !term || JSON.stringify(row).includes(term);
    const statusMatched = !actionFilters.value.status || row.status === actionFilters.value.status;
    const ownerMatched = !actionFilters.value.owner || JSON.stringify(row).includes(actionFilters.value.owner);
    const dateMatched = (!actionFilters.value.dateStart || JSON.stringify(row) >= actionFilters.value.dateStart)
      && (!actionFilters.value.dateEnd || JSON.stringify(row) <= actionFilters.value.dateEnd);
    return treeMatched && keywordMatched && statusMatched && ownerMatched && dateMatched;
  });
});
const tableRows = computed<Record<string, unknown>[]>(() => filteredRows.value.map((row) => ({ ...row, action: '查看' })));
const columns = computed<AwTableColumn[]>(() => {
  const hasStatusColumn = props.profile.columns.includes(props.profile.statusLabel);
  return [
    ...props.profile.columns.map((title, index) => ({
      key: hasStatusColumn && title === props.profile.statusLabel ? 'status' : `c${index}`,
      title,
      width: index === 0 ? 170 : 140,
      numeric: /工资|金额|人数|编制|日期|时间|编号/.test(title),
      filterOptions: title === props.profile.statusLabel ? props.profile.statuses : undefined,
    })),
    ...(hasStatusColumn ? [] : [{ key: 'status', title: props.profile.statusLabel, width: 120, filterOptions: props.profile.statuses }]),
    { key: 'action', title: '操作', fixed: 'right' as const, width: 110 },
  ];
});
const drawerColumns = computed(() => columns.value.map((column) => column.title));
const treeNodes = computed<AwTreeNode[]>(() => {
  if (hasArchiveCategoryTree.value) {
    return [
      { key: 'all', label: archiveCategoryKind.value === 'contract' ? '全部合同' : '全部证照', count: rows.value.length, icon: 'line-node', level: 2, open: true },
      ...archiveCategories.value.map((item) => ({
        key: item,
        label: item,
        count: rows.value.filter((row) => row.category === item).length,
        icon: 'line-users',
        level: 3 as const,
      })),
    ];
  }
  return [
    { key: 'all', label: isOrganizationTreeAction.value ? '全部组织' : '全部', count: rows.value.length, icon: isOrganizationTreeAction.value ? 'line-node' : 'line-users', level: 2, open: true },
    ...(isOrganizationTreeAction.value ? orgRootNames.value : props.profile.statuses).map((item) => ({
      key: item,
      label: item,
      count: rows.value.filter((row) => isOrganizationTreeAction.value ? matchesEmployeeDepartment(row.department, item) : row.status === item).length,
      icon: isOrganizationTreeAction.value ? 'line-users' : 'line-node',
      level: 3 as const,
    })),
  ];
});
const archiveCategories = computed(() => {
  const virtualCategories = archiveCategoryKind.value === 'contract'
    ? ['劳动合同', '租赁合同', '采购合同', '销售合同', '服务合同', '外包合同', '保密协议', '框架合作协议']
    : ['营业执照', '资质证书', '行政许可证', '安全环保许可', '知识产权证书', '税务银行资料'];
  const usedCategories = rows.value.map((row) => String(row.category || '').trim()).filter(Boolean);
  return Array.from(new Set([...virtualCategories, ...usedCategories]));
});
const orgRootNames = computed(() => {
  const names = orgItems.value
    .map((item) => String(item.party || item.group || '').trim())
    .filter(Boolean);
  const next = names.length ? names : props.config.groups.slice(1);
  return Array.from(new Set(next));
});

watch(() => [props.config.resource, props.profile.title], () => {
  pickedTree.value = 'all';
  keyword.value = '';
  void loadOrgTree();
});

onMounted(loadOrgTree);

async function loadOrgTree() {
  if (!isOrganizationTreeAction.value) {
    orgItems.value = [];
    return;
  }
  const result = await listHrRecords('hr-orgs', { pageNo: 1, pageSize: 100 });
  orgItems.value = result.items;
}

async function refreshActionList() {
  await loadOrgTree();
  toolbarNote.value = `${props.profile.title}已刷新。`;
}

function openDrawer(type: 'filter' | 'columns' | 'import' | 'export') {
  drawerType.value = type;
}

function openCreate() {
  router.push(`${props.config.route}?action=${encodeURIComponent(props.profile.newLabel)}`);
}

function applyDrawer(payload?: { status?: string; owner?: string; dateStart?: string; dateEnd?: string; exportFormat?: string; fileName?: string }) {
  if (drawerType.value === 'filter' && payload) {
    actionFilters.value = {
      status: payload.status || '',
      owner: payload.owner || '',
      dateStart: payload.dateStart || '',
      dateEnd: payload.dateEnd || '',
    };
  }
  if (drawerType.value === 'import' && payload?.fileName) toolbarNote.value = `${payload.fileName} 已进入${props.profile.title}导入校验队列。`;
  else if (drawerType.value === 'export' && payload?.exportFormat) toolbarNote.value = `已按 ${payload.exportFormat} 格式生成${props.profile.title}导出任务。`;
  else toolbarNote.value = `${props.profile.title}${drawerType.value === 'filter' ? '筛选' : drawerType.value === 'columns' ? '字段配置' : '工具'}已应用。`;
  drawerType.value = '';
}

function selectTreeNode(key: string) {
  pickedTree.value = key;
}

function matchesEmployeeDepartment(value: unknown, group: string) {
  const department = String(value || '');
  const baseGroup = group.replace(/部$/, '');
  return department === group || department.includes(group) || Boolean(baseGroup && department.includes(baseGroup));
}

function openDetail(id: string) {
  router.push(`${props.config.route}?id=${encodeURIComponent(id)}&action=${encodeURIComponent(props.profile.title)}`);
}

function statusTone(value: string) {
  if (['在职', '启用', '正常', '已处理', '已发布', '已发放', '已入职', '已转正', '已归档', '有效', '已通过', '已同步', '充足'].includes(value)) return 'green';
  if (['离职', '停用', '异常', '驳回', '已过期', '冻结', '超编'].includes(value)) return 'red';
  return 'yellow';
}
</script>
