<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getEquipmentSettings, listRowsForModule } from '@/app/api/equipment/resources';
import type { EquipmentSettingRow, EquipmentSettings, MaintenanceProjectSetting } from '@/app/api/equipment/types';
import AwApprovalRuleEditor from '@/components/setting-page/AwApprovalRuleEditor.vue';
import AwCodeRuleBuilder from '@/components/setting-page/AwCodeRuleBuilder.vue';
import AwFieldSettingPage from '@/components/setting-page/AwFieldSettingPage.vue';
import AwSettingListCard from '@/components/setting-page/AwSettingListCard.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingSplitPage from '@/components/setting-page/AwSettingSplitPage.vue';
import AwSettingTable from '@/components/setting-page/AwSettingTable.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import AwSettingTree from '@/components/setting-page/AwSettingTree.vue';
import type { ApprovalNode, SettingTableColumn, SettingTableRow, SettingTreeItem } from '@/components/setting-page/types';

const props = defineProps<{
  settingKey: string;
  title: string;
}>();

const router = useRouter();
const settings = ref<EquipmentSettings | null>(null);
const activeScope = ref('assets');
const keyword = ref('');
const showModal = ref(false);
const showMaintenanceItemForm = ref(false);
const showMaintenanceStandardPicker = ref(false);
const showCategoryRootModal = ref(false);
const showCategoryChildModal = ref(false);
const modalTitle = ref('新增配置');
const editingRow = ref<EquipmentSettingRow | null>(null);
const activeCategoryRoot = ref('');
const extraCategoryRoots = ref<Record<string, string[]>>({});
const categoryRootForm = ref({ name: '', code: '', remark: '' });
const categoryChildForm = ref({ name: '', code: '', remark: '' });
const settingForm = ref({ name: '', code: '', parent: '', enabled: true });
const maintenanceItemForm = ref<MaintenanceProjectSetting>({
  id: '',
  name: '',
  code: '',
  scope: '',
  updatedAt: '2026-05-31',
  enabled: true,
  standards: [],
});
const categoryUsageCounts = ref<Record<string, number>>({});
const numberPrefix = ref('EQ');
const numberSeparator = ref('-');
const numberSelected = ref<string[]>([]);
const approvalName = ref('设备审批流程');
const approvalNodes = ref<ApprovalNode[]>([
  { name: '提交', approvers: ['责任人'], method: '自动' },
  { name: '设备主管确认', approvers: ['设备主管'], method: '顺签' },
]);
const activeApprovalNode = ref(0);

getEquipmentSettings().then((data) => {
  settings.value = data;
  numberPrefix.value = data.numberPrefix;
  numberSeparator.value = data.numberSeparator;
  numberSelected.value = [...data.numberSelected];
  const approval = data.approvals.find((item) => item.category.includes('维修')) || data.approvals[0];
  approvalName.value = approval?.name || approvalName.value;
  approvalNodes.value = approval?.nodes?.map((node) => ({ ...node })) || approvalNodes.value;
});
Promise.all([listRowsForModule('assets'), listRowsForModule('spares')]).then(([assetPage, sparePage]) => {
  const counts: Record<string, number> = {};
  [...assetPage.items, ...sparePage.items].forEach((row) => {
    const category = String((row as unknown as Record<string, unknown>).category || '');
    if (category) counts[category] = (counts[category] || 0) + 1;
  });
  categoryUsageCounts.value = counts;
});

watch([numberPrefix, numberSeparator, numberSelected], () => {
  if (!settings.value) return;
  settings.value.numberPrefix = numberPrefix.value;
  settings.value.numberSeparator = numberSeparator.value;
  settings.value.numberSelected = [...numberSelected.value];
}, { deep: true });

watch([approvalName, approvalNodes], () => {
  if (!settings.value) return;
  const target = settings.value.approvals.find((item) => item.category.includes('维修')) || settings.value.approvals[0];
  if (!target) return;
  target.name = approvalName.value;
  target.nodes = approvalNodes.value.map((node) => ({ name: node.name, approvers: [...node.approvers], method: node.method }));
  target.updatedAt = '2026-05-31';
}, { deep: true });

const normalizedKey = computed(() => {
  const raw = props.settingKey || 'categories';
  const actionMap: Record<string, string> = {
    设备编号: 'numbers',
    设备分类: 'categories',
    设备状态: 'statuses',
    资产标签: 'assetTags',
    保养标准: 'maintenanceStandards',
    保养项目: 'maintenanceItems',
    保养周期: 'maintenanceCycles',
    保养预警: 'maintenanceWarnings',
    审批流程: props.title.includes('维修') ? 'repairApprovals' : '',
    故障分类: 'faultCategories',
    维修等级: 'repairLevels',
    维修审批流程: 'repairApprovals',
    点检标准: 'inspectionStandards',
    点检周期: 'inspectionCycles',
    安全库存: 'safeStocks',
    备件分类: 'spareCategories',
  };
  return actionMap[raw] || raw;
});

const dictKey = computed(() => {
  if (normalizedKey.value === 'categories') return 'categories';
  if (normalizedKey.value === 'statuses') return 'statuses';
  if (normalizedKey.value === 'assetTags') return 'assetTags';
  if (normalizedKey.value === 'maintenanceStandards') return 'maintenanceStandards';
  if (normalizedKey.value === 'maintenanceItems') return 'maintenanceItems';
  if (normalizedKey.value === 'maintenanceCycles') return 'maintenanceCycles';
  if (normalizedKey.value === 'maintenanceWarnings') return 'maintenanceWarnings';
  if (normalizedKey.value === 'faultCategories') return 'faultCategories';
  if (normalizedKey.value === 'repairLevels') return 'repairLevels';
  if (normalizedKey.value === 'inspectionStandards') return 'inspectionStandards';
  if (normalizedKey.value === 'inspectionCycles') return 'inspectionCycles';
  if (normalizedKey.value === 'safeStocks') return 'safeStocks';
  if (normalizedKey.value === 'spareCategories') return 'spareCategories';
  return '';
});

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    fields: '自定义字段',
    numbers: '设备编号',
    categories: '设备分类',
    statuses: '设备状态',
    assetTags: '资产标签',
    maintenanceStandards: '保养标准',
    maintenanceItems: '保养项目',
    maintenanceCycles: '保养周期',
    maintenanceWarnings: '保养预警',
    faultCategories: '故障分类',
    repairLevels: '维修等级',
    repairApprovals: '维修审批流程',
    inspectionStandards: '点检标准',
    inspectionCycles: '点检周期',
    safeStocks: '安全库存',
    spareCategories: '备件分类',
    strategies: '设备策略',
  };
  return map[normalizedKey.value] || props.title;
});

const dictRows = computed<EquipmentSettingRow[]>(() => {
  if (!settings.value || !dictKey.value) return [];
  return (settings.value[dictKey.value as keyof EquipmentSettings] as EquipmentSettingRow[]) || [];
});
const tableRows = computed<SettingTableRow[]>(() => dictRows.value as unknown as SettingTableRow[]);
const maintenanceItemRows = computed<MaintenanceProjectSetting[]>(() => {
  if (!settings.value) return [];
  return settings.value.maintenanceItems || [];
});
const filteredMaintenanceItemRows = computed(() => {
  const text = keyword.value.trim();
  if (!text) return maintenanceItemRows.value;
  return maintenanceItemRows.value.filter((row) => [row.name, row.code, row.scope].some((value) => String(value || '').includes(text)));
});
const filteredTableRows = computed<SettingTableRow[]>(() => {
  const text = keyword.value.trim();
  if (!text) return tableRows.value;
  return tableRows.value.filter((row) => Object.values(row).some((value) => String(value || '').includes(text)));
});
const isCategorySetting = computed(() => ['categories', 'spareCategories'].includes(dictKey.value));
const categorySettingLabel = computed(() => (dictKey.value === 'spareCategories' ? '备件分类' : '设备分类'));
const categoryRoots = computed(() => {
  const roots = new Set<string>(extraCategoryRoots.value[dictKey.value] || []);
  dictRows.value.forEach((row) => {
    if (row.parent) roots.add(row.parent);
  });
  return Array.from(roots);
});
const selectedCategoryRoot = computed(() => {
  if (activeCategoryRoot.value && categoryRoots.value.includes(activeCategoryRoot.value)) {
    return activeCategoryRoot.value;
  }
  return categoryRoots.value[0] || '';
});
const categoryTreeItems = computed<SettingTreeItem[]>(() => categoryRoots.value.map((root) => ({
  key: root,
  label: root,
  count: dictRows.value.filter((row) => row.parent === root).length,
  icon: 'line-doc',
})));
const filteredCategoryRows = computed(() => {
  const text = keyword.value.trim();
  const rows = dictRows.value.filter((row) => row.parent === selectedCategoryRoot.value);
  if (!text) return rows;
  return rows.filter((row) => [row.name, row.code, row.parent, row.scope].some((value) => String(value || '').includes(text)));
});

const dictColumns: SettingTableColumn[] = [
  { key: 'name', label: '名称' },
  { key: 'code', label: '编码', width: '160px' },
  { key: 'parent', label: '上级/范围', width: '160px' },
  { key: 'updatedAt', label: '更新时间', width: '140px' },
  { key: 'enabled', label: '状态', width: '100px' },
];

function goBack() {
  router.push({ path: router.currentRoute.value.path });
}

function openAdd() {
  if (normalizedKey.value === 'maintenanceItems') {
    openMaintenanceItemForm();
    return;
  }
  if (isCategorySetting.value) {
    openCategoryChildModal();
    return;
  }
  editingRow.value = null;
  settingForm.value = { name: '', code: '', parent: '', enabled: true };
  modalTitle.value = `新增${pageTitle.value}`;
  showModal.value = true;
}

function openMaintenanceItemForm(row?: MaintenanceProjectSetting) {
  maintenanceItemForm.value = row
    ? JSON.parse(JSON.stringify(row)) as MaintenanceProjectSetting
    : {
      id: '',
      name: '',
      code: '',
      scope: '',
      updatedAt: '2026-05-31',
      enabled: true,
      standards: [],
    };
  showMaintenanceItemForm.value = true;
}

function openMaintenanceStandardPicker() {
  showMaintenanceStandardPicker.value = true;
}

function pickMaintenanceStandard(row: EquipmentSettingRow) {
  maintenanceItemForm.value.standards.push({
    id: `${row.id}-${Date.now()}`,
    itemName: maintenanceItemForm.value.name,
    standardName: row.name,
    standard: row.scope || row.parent || row.name,
    method: '按标准执行',
    tools: '-',
    required: '是',
  });
  showMaintenanceStandardPicker.value = false;
}

function saveMaintenanceItem() {
  if (!settings.value || !maintenanceItemForm.value.name.trim()) return;
  const rows = settings.value.maintenanceItems || [];
  const payload: MaintenanceProjectSetting = {
    ...maintenanceItemForm.value,
    id: maintenanceItemForm.value.id || `mi_${Date.now()}`,
    code: maintenanceItemForm.value.code.trim() || `MI-${String(rows.length + 1).padStart(3, '0')}`,
    updatedAt: '2026-05-31',
    enabled: maintenanceItemForm.value.enabled !== false,
    standards: maintenanceItemForm.value.standards.map((item, index) => ({
      ...item,
      id: item.id || `${maintenanceItemForm.value.id || Date.now()}-s${index + 1}`,
      itemName: maintenanceItemForm.value.name,
      itemCode: maintenanceItemForm.value.code,
      required: item.required || '是',
    })),
  };
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) rows[index] = payload;
  else rows.unshift(payload);
  showMaintenanceItemForm.value = false;
}

function removeMaintenanceItem(id: string | number) {
  if (!settings.value) return;
  const index = settings.value.maintenanceItems.findIndex((row) => row.id === id);
  if (index >= 0) settings.value.maintenanceItems.splice(index, 1);
}

function removeMaintenanceStandard(index: number) {
  maintenanceItemForm.value.standards.splice(index, 1);
}

function openEdit(row: EquipmentSettingRow) {
  editingRow.value = row;
  settingForm.value = {
    name: row.name,
    code: row.code,
    parent: row.parent || row.scope || '',
    enabled: row.enabled !== false,
  };
  modalTitle.value = `编辑${pageTitle.value}`;
  showModal.value = true;
}

function openEditSettingRow(row: SettingTableRow) {
  openEdit(row as unknown as EquipmentSettingRow);
}

function selectCategoryRoot(key: string | number) {
  activeCategoryRoot.value = String(key);
  keyword.value = '';
}

function openCategoryRootModal() {
  categoryRootForm.value = { name: '', code: '', remark: '' };
  showCategoryRootModal.value = true;
}

function openCategoryChildModal() {
  categoryChildForm.value = { name: '', code: '', remark: '' };
  showCategoryChildModal.value = true;
}

function addCategoryRoot() {
  const name = categoryRootForm.value.name.trim();
  if (!name) return;
  const roots = extraCategoryRoots.value[dictKey.value] || [];
  if (!categoryRoots.value.includes(name)) {
    extraCategoryRoots.value = { ...extraCategoryRoots.value, [dictKey.value]: [...roots, name] };
  }
  activeCategoryRoot.value = name;
  showCategoryRootModal.value = false;
}

function addCategoryChild() {
  const name = categoryChildForm.value.name.trim();
  if (!name || !settings.value || !dictKey.value) return;
  const rows = settings.value[dictKey.value as keyof EquipmentSettings] as EquipmentSettingRow[];
  rows.push({
    id: `${dictKey.value}-${Date.now()}`,
    name,
    code: categoryChildForm.value.code.trim() || `${dictKey.value.toUpperCase()}_${rows.length + 1}`,
    parent: selectedCategoryRoot.value || categorySettingLabel.value,
    updatedAt: '2026-05-31',
    enabled: true,
  });
  showCategoryChildModal.value = false;
}

function removeCategoryRow(id: string | number) {
  if (!settings.value || !dictKey.value) return;
  const rows = settings.value[dictKey.value as keyof EquipmentSettings] as EquipmentSettingRow[];
  const index = rows.findIndex((row) => row.id === id);
  if (index >= 0) rows.splice(index, 1);
}

function categoryUsageCount(name: string) {
  return categoryUsageCounts.value[name] || 0;
}

function saveSettingRow() {
  if (!settings.value || !dictKey.value || !settingForm.value.name.trim()) return;
  const rows = settings.value[dictKey.value as keyof EquipmentSettings] as EquipmentSettingRow[];
  const payload: EquipmentSettingRow = {
    id: editingRow.value?.id || `${dictKey.value}-${Date.now()}`,
    name: settingForm.value.name.trim(),
    code: settingForm.value.code.trim() || `${dictKey.value.toUpperCase()}_${rows.length + 1}`,
    parent: editingRow.value?.parent ? settingForm.value.parent.trim() : undefined,
    scope: editingRow.value?.parent ? undefined : settingForm.value.parent.trim(),
    updatedAt: '2026-05-31',
    enabled: settingForm.value.enabled,
  };
  const index = rows.findIndex((row) => row.id === payload.id);
  if (index >= 0) rows[index] = { ...rows[index], ...payload };
  else rows.unshift(payload);
  showModal.value = false;
}

function setRowEnabled(row: SettingTableRow, enabled: boolean) {
  const source = dictRows.value.find((item) => item.id === row.id);
  if (source) source.enabled = enabled;
}

function addApprovalNode() {
  approvalNodes.value.push({ name: '新审批节点', approvers: [], method: '顺签' });
}

function updateApprovalNode(index: number, node: ApprovalNode) {
  approvalNodes.value[index] = node;
}
</script>

<template>
  <aw-setting-page>
    <template #toolbar>
      <aw-setting-toolbar
        :add-text="isCategorySetting ? '新增下级分类' : `新增${pageTitle}`"
        :show-add="Boolean(dictKey)"
        :back-text="`返回${title}`"
        @add="openAdd"
        @back="goBack"
        @refresh="void 0"
      />
    </template>

    <aw-field-setting-page
      v-if="settings && normalizedKey === 'fields'"
      :rows="settings.fields"
      :scopes="settings.fieldScopes"
      :active-scope="activeScope"
      @select-scope="activeScope = $event"
    />

    <aw-code-rule-builder
      v-else-if="settings && normalizedKey === 'numbers'"
      v-model:prefix="numberPrefix"
      v-model:separator="numberSeparator"
      v-model:selected="numberSelected"
      :candidates="settings.numberCandidates"
    />

    <aw-approval-rule-editor
      v-else-if="settings && normalizedKey === 'repairApprovals'"
      v-model:name="approvalName"
      :nodes="approvalNodes"
      :methods="[
        { value: '自动', desc: '系统节点' },
        { value: '顺签', desc: '按顺序审批' },
        { value: '或签', desc: '任一人通过' },
      ]"
      :active-index="activeApprovalNode"
      @add-node="addApprovalNode"
      @select-node="activeApprovalNode = $event"
      @update-node="updateApprovalNode"
      @remove-node="approvalNodes.splice($event, 1)"
    />

    <aw-setting-split-page v-else-if="settings && isCategorySetting">
      <template #tree>
        <aw-setting-tree
          :add-title="`新增${categorySettingLabel}`"
          :active-key="selectedCategoryRoot"
          :items="categoryTreeItems"
          show-add
          :title="categorySettingLabel"
          @add="openCategoryRootModal"
          @select="selectCategoryRoot"
        />
      </template>
      <aw-setting-list-card
        v-model:keyword="keyword"
        description="暂无分类备注"
        search-placeholder="搜索下级分类名称/编号"
        :title="selectedCategoryRoot || `${categorySettingLabel}设置`"
      >
        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl">
              <thead>
                <tr>
                  <th style="width:70px">序号</th>
                  <th>分类名称</th>
                  <th>上级分类</th>
                  <th>分类编码</th>
                  <th style="width:100px">{{ dictKey === 'spareCategories' ? '备件数量' : '设备数量' }}</th>
                  <th style="width:90px">状态</th>
                  <th style="width:150px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in filteredCategoryRows" :key="row.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.parent || '-' }}</td>
                  <td>{{ row.code }}</td>
                  <td>{{ categoryUsageCount(row.name) }}</td>
                  <td>
                    <label class="aw-switch-line mini">
                      <input v-model="row.enabled" type="checkbox" />
                      <i></i>
                    </label>
                  </td>
                  <td>
                    <span class="aw-link" @click="openEdit(row)">编辑</span><span class="aw-action-split">|</span>
                    <span class="aw-link" style="color:var(--aw-danger)" @click="removeCategoryRow(row.id)">删除</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </aw-setting-list-card>
    </aw-setting-split-page>

    <aw-setting-list-card
      v-else-if="settings && normalizedKey === 'maintenanceItems' && showMaintenanceItemForm"
      v-model:keyword="keyword"
      description="一个保养项目可以维护多个保养标准，保养计划可选择多个保养项目。"
      search-placeholder="搜索标准名称/要求"
      title="新增保养项目"
    >
      <div class="equipment-setting-form maintenance-item-form">
        <label><span>项目名称</span><input v-model="maintenanceItemForm.name" placeholder="请输入保养项目名称" /></label>
        <label><span>项目编码</span><input v-model="maintenanceItemForm.code" placeholder="系统可自动生成" /></label>
        <label><span>适用范围</span><input v-model="maintenanceItemForm.scope" placeholder="例如：CNC/加工设备" /></label>
        <label><span>状态</span><select v-model="maintenanceItemForm.enabled"><option :value="true">启用</option><option :value="false">停用</option></select></label>
      </div>
      <div class="maintenance-standard-head">
        <strong>保养标准</strong>
      </div>
      <div class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl">
            <thead>
              <tr>
                <th style="width:70px">序号</th>
                <th>标准名称</th>
                <th>标准要求</th>
                <th style="width:140px">方法</th>
                <th style="width:150px">工具/备件</th>
                <th style="width:110px">是否必填</th>
                <th style="width:90px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in maintenanceItemForm.standards" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td><input v-model="row.standardName" placeholder="如：油位正常" /></td>
                <td><input v-model="row.standard" placeholder="请输入标准要求" /></td>
                <td><input v-model="row.method" placeholder="方法" /></td>
                <td><input v-model="row.tools" placeholder="工具/备件" /></td>
                <td><select v-model="row.required"><option>是</option><option>否</option></select></td>
                <td><span class="aw-link" style="color:var(--aw-danger)" @click="removeMaintenanceStandard(index)">删除</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button class="maintenance-table-add" type="button" @click="openMaintenanceStandardPicker">新增标准</button>
      <div class="maintenance-item-actions">
        <button type="button" @click="showMaintenanceItemForm = false">返回列表</button>
        <button class="primary" type="button" @click="saveMaintenanceItem">保存</button>
      </div>
    </aw-setting-list-card>

    <aw-setting-list-card
      v-else-if="settings && normalizedKey === 'maintenanceItems'"
      v-model:keyword="keyword"
      description="一个保养项目包含多个保养标准，保养计划可选择多个保养项目。"
      search-placeholder="搜索保养项目名称/编码"
      title="保养项目"
    >
      <div class="aw-doc-tbl-wrap">
        <div class="aw-doc-tbl-inner">
          <table class="aw-doc-tbl">
            <thead>
              <tr>
                <th style="width:70px">序号</th>
                <th>项目名称</th>
                <th style="width:180px">项目编码</th>
                <th style="width:180px">适用范围</th>
                <th style="width:110px">标准数量</th>
                <th style="width:110px">状态</th>
                <th style="width:150px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in filteredMaintenanceItemRows" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.code }}</td>
                <td>{{ row.scope || '-' }}</td>
                <td>{{ row.standards?.length || 0 }}</td>
                <td>
                  <label class="aw-switch-line mini">
                    <input v-model="row.enabled" type="checkbox" />
                    <i></i>
                  </label>
                </td>
                <td>
                  <span class="aw-link" @click="openMaintenanceItemForm(row)">编辑</span><span class="aw-action-split">|</span>
                  <span class="aw-link" style="color:var(--aw-danger)" @click="removeMaintenanceItem(row.id)">删除</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </aw-setting-list-card>

    <aw-setting-list-card
      v-else-if="settings"
      v-model:keyword="keyword"
      :description="`${pageTitle}基础配置列表`"
      :search-placeholder="`搜索${pageTitle}名称/编码`"
      :title="pageTitle"
    >
      <aw-setting-table :columns="dictColumns" :rows="filteredTableRows" @edit="openEditSettingRow">
        <template #cell="{ column, row }">
          <label v-if="column.key === 'enabled'" class="aw-switch-line mini">
            <input :checked="row.enabled !== false" type="checkbox" @change="setRowEnabled(row, ($event.target as HTMLInputElement).checked)" />
            <i></i>
          </label>
          <span v-else-if="column.key === 'parent'">{{ row.parent || row.scope || '-' }}</span>
          <span v-else>{{ row[column.key] }}</span>
        </template>
      </aw-setting-table>
    </aw-setting-list-card>

    <aw-setting-modal
      :open="showCategoryRootModal"
      :title="`新增${categorySettingLabel}`"
      width="640px"
      @cancel="showCategoryRootModal = false"
      @confirm="addCategoryRoot"
    >
      <div class="equipment-setting-form">
        <label><span>分类名称</span><input v-model="categoryRootForm.name" placeholder="请输入一级分类名称" /></label>
        <label><span>分类编码</span><input v-model="categoryRootForm.code" placeholder="系统可自动生成" /></label>
        <label><span>备注</span><input v-model="categoryRootForm.remark" placeholder="请输入分类备注" /></label>
      </div>
    </aw-setting-modal>

    <aw-setting-modal
      :open="showCategoryChildModal"
      :title="`新增下级${categorySettingLabel}`"
      width="640px"
      @cancel="showCategoryChildModal = false"
      @confirm="addCategoryChild"
    >
      <div class="equipment-setting-form">
        <label><span>分类名称</span><input v-model="categoryChildForm.name" placeholder="请输入下级分类名称" /></label>
        <label><span>分类编码</span><input v-model="categoryChildForm.code" placeholder="系统可自动生成" /></label>
        <label><span>上级分类</span><input :value="selectedCategoryRoot" disabled /></label>
        <label><span>备注</span><input v-model="categoryChildForm.remark" placeholder="请输入分类备注" /></label>
      </div>
    </aw-setting-modal>

    <aw-setting-modal :open="showModal" :title="modalTitle" width="720px" @cancel="showModal = false" @confirm="saveSettingRow">
      <div class="equipment-setting-form">
        <label><span>名称</span><input v-model="settingForm.name" placeholder="请输入名称" /></label>
        <label><span>编码</span><input v-model="settingForm.code" placeholder="系统可自动生成" /></label>
        <label><span>上级/范围</span><input v-model="settingForm.parent" placeholder="请选择或填写范围" /></label>
        <label><span>状态</span><select v-model="settingForm.enabled"><option :value="true">启用</option><option :value="false">停用</option></select></label>
      </div>
    </aw-setting-modal>

    <aw-setting-modal
      :open="showMaintenanceStandardPicker"
      title="选择保养标准"
      width="960px"
      @cancel="showMaintenanceStandardPicker = false"
      @confirm="showMaintenanceStandardPicker = false"
    >
      <div class="maintenance-standard-picker">
        <div class="maintenance-standard-picker-title">
          <strong>保养标准列表</strong>
          <span>选择一条标准加入当前保养项目</span>
        </div>
        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl maintenance-standard-picker-table">
            <thead>
              <tr>
                <th style="width:70px">序号</th>
                <th>标准名称</th>
                <th style="width:180px">标准编码</th>
                <th>适用范围/要求</th>
                <th style="width:90px">状态</th>
                <th style="width:90px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in settings?.maintenanceStandards || []" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.code }}</td>
                <td>{{ row.scope || row.parent || '-' }}</td>
                <td>{{ row.enabled === false ? '停用' : '启用' }}</td>
                <td><span class="aw-link" @click="pickMaintenanceStandard(row)">选择</span></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="aw-tool-btn" type="button" @click="showMaintenanceStandardPicker = false">关闭</button>
      </template>
    </aw-setting-modal>
  </aw-setting-page>
</template>

<style scoped>
.equipment-setting-tree {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 6px;
  padding: 12px;
}

.equipment-setting-tree button {
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--aw-fg-2);
  height: 34px;
  text-align: left;
}

.equipment-setting-tree button.on {
  background: var(--aw-primary-light);
  color: var(--aw-primary);
  font-weight: 700;
}

.equipment-setting-table {
  min-width: 0;
}

.equipment-setting-form {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.equipment-setting-form label {
  display: grid;
  gap: 6px;
}

.equipment-setting-form span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.equipment-setting-form input,
.equipment-setting-form select {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  height: 34px;
  padding: 0 10px;
}

.maintenance-item-form {
  margin-bottom: 16px;
}

.maintenance-item-actions {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: 14px 0 10px;
}

.maintenance-item-actions button {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-fg-1);
  cursor: pointer;
  height: 32px;
  padding: 0 12px;
}

.maintenance-standard-head {
  margin: 14px 0 10px;
}

.maintenance-table-add {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-fg-1);
  cursor: pointer;
  height: 32px;
  margin-top: 10px;
  padding: 0 12px;
}

.maintenance-standard-picker {
  display: grid;
  gap: 12px;
}

.maintenance-standard-picker-title {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.maintenance-standard-picker-title span {
  color: var(--aw-fg-3);
  font-size: 12px;
}

.maintenance-standard-picker .aw-doc-tbl-wrap,
.maintenance-standard-picker .aw-doc-tbl-inner {
  overflow: visible;
  width: 100%;
}

.maintenance-standard-picker-table {
  min-width: 100%;
  table-layout: fixed;
}

.maintenance-standard-picker-table th,
.maintenance-standard-picker-table td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.maintenance-item-actions {
  justify-content: flex-end;
  gap: 10px;
}

.maintenance-item-actions .primary {
  background: var(--aw-primary);
  border-color: var(--aw-primary);
  color: #fff;
}

.aw-doc-tbl input,
.aw-doc-tbl select {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  box-sizing: border-box;
  height: 32px;
  padding: 0 8px;
  width: 100%;
}
</style>
