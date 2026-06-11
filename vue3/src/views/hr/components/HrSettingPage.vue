<template>
  <aw-setting-page>
    <template #toolbar>
      <aw-setting-toolbar
        :add-text="addText"
        :back-text="`返回${config.title}`"
        :editor-mode="settingKey === 'approvals' && approvalEditorOpen"
        :show-add="settingKey !== 'numbers' && settingKey !== 'strategies'"
        @add="handleAdd"
        @back="router.push(config.route)"
        @cancel="approvalEditorOpen = false"
        @save="saveApprovalRule"
      />
    </template>

    <template v-if="settingsData">
      <aw-setting-split-page v-if="settingKey === 'categories'">
        <template #tree>
          <aw-setting-tree
            add-title="新增组织分类"
            :active-key="activeCategoryRootId"
            :items="categoryTreeItems"
            show-add
            title="组织分类"
            @add="openCategoryRootModal"
            @select="selectCategoryRoot"
          />
        </template>
        <aw-setting-list-card
          v-model:keyword="keyword"
          :description="activeCategoryRoot?.remark || '暂无分类备注'"
          search-placeholder="搜索下级分类名称/编号"
          :title="activeCategoryRoot?.name || '组织分类'"
        >
          <aw-setting-table :columns="categoryColumns" :rows="filteredCategoryRows" @delete="deleteCategory" @edit="editCategory">
            <template #cell="{ column, row, index }">
              <span v-if="column.key === 'index'">{{ index + 1 }}</span>
              <label v-else-if="column.key === 'enabled'" class="aw-switch-line mini"><input v-model="row.enabled" type="checkbox" /><i></i></label>
              <span v-else>{{ row[column.key] }}</span>
            </template>
          </aw-setting-table>
        </aw-setting-list-card>
      </aw-setting-split-page>

      <aw-field-setting-page
        v-else-if="settingKey === 'fields'"
        :active-scope="activeFieldScope"
        :rows="settingsData.fields"
        :scopes="fieldScopes"
        @delete="deleteField"
        @edit="editField"
        @select-scope="activeFieldScope = $event"
        @toggle-enabled="toggleFieldEnabled"
        @toggle-required="toggleFieldRequired"
      />

      <aw-code-rule-builder
        v-else-if="settingKey === 'numbers'"
        v-model:prefix="settingsData.numberRule.prefix"
        v-model:selected="settingsData.numberRule.selected"
        v-model:separator="settingsData.numberRule.separator"
        :candidates="settingsData.numberRule.candidates"
        @reset="resetNumberRule"
        @save="saveSettings"
      />

      <template v-else-if="settingKey === 'approvals'">
        <aw-approval-rule-editor
          v-if="approvalEditorOpen"
          v-model:name="approvalForm.name"
          :active-index="activeApprovalIndex"
          :methods="approvalMethods"
          :nodes="approvalForm.nodes"
          @add-node="addApprovalNode"
          @pick-person="openApprovalPicker"
          @remove-node="removeApprovalNode"
          @remove-person="removeApprovalPerson"
          @select-node="activeApprovalIndex = $event"
          @update-node="updateApprovalNode"
        />
        <aw-setting-list-card
          v-else
          v-model:keyword="keyword"
          :description="`${config.title}审批流程设置，审批人必须通过公共人员选择器维护。`"
          search-placeholder="搜索流程名称/适用分类"
          :title="`${config.title}审批设置`"
        >
          <aw-setting-table :columns="approvalColumns" :rows="settingsData.approvals" @delete="deleteApproval" @edit="editApproval">
            <template #cell="{ column, row, index }">
              <span v-if="column.key === 'index'">{{ index + 1 }}</span>
              <span v-else-if="column.key === 'nodeCount'">{{ Array.isArray(row.nodes) ? row.nodes.length : 0 }}</span>
              <label v-else-if="column.key === 'enabled'" class="aw-switch-line mini"><input v-model="row.enabled" type="checkbox" /><i></i></label>
              <span v-else>{{ row[column.key] }}</span>
            </template>
          </aw-setting-table>
        </aw-setting-list-card>
      </template>

      <aw-strategy-setting-page
        v-else-if="settingKey === 'strategies'"
        :description="`${config.title}业务策略来自 hr-list.jsx 动作和人事流程，后续由后端契约固化。`"
        :tabs="settingsData.strategies"
        :title="`${config.title}策略设置`"
        @reset="message = '已恢复默认策略。'"
        @save="saveSettings"
        @update-rule="updateStrategyRule"
      />

      <aw-setting-list-card
        v-else
        v-model:keyword="keyword"
        :description="`${config.title}打印模板，复用设置母版维护模板场景、纸张和启用状态。`"
        search-placeholder="搜索模板名称/场景"
        :title="`设置${config.title.replace(/管理|机构|办公/g, '')}打印模板`"
      >
        <aw-setting-table :columns="printColumns" :rows="settingsData.printTemplates" @delete="deletePrintTemplate" @edit="editPrintTemplate">
          <template #cell="{ column, row, index }">
            <span v-if="column.key === 'index'">{{ index + 1 }}</span>
            <label v-else-if="column.key === 'enabled'" class="aw-switch-line mini"><input v-model="row.enabled" type="checkbox" /><i></i></label>
            <span v-else>{{ row[column.key] }}</span>
          </template>
        </aw-setting-table>
      </aw-setting-list-card>
    </template>

    <section v-if="message" class="aw-form-card hr-note">{{ message }}</section>

    <aw-setting-modal :open="fieldModalOpen" title="新增自定义字段" width="720px" @cancel="fieldModalOpen = false" @confirm="saveField">
      <div class="aw-form-grid">
        <label class="aw-field"><span>字段名称</span><input v-model="fieldForm.name" /></label>
        <label class="aw-field"><span>字段编码</span><input v-model="fieldForm.code" /></label>
        <label class="aw-field"><span>字段类型</span><select v-model="fieldForm.type"><option>文本</option><option>数字</option><option>日期</option><option>下拉</option><option>附件</option></select></label>
      </div>
    </aw-setting-modal>

    <aw-setting-modal :open="printModalOpen" title="新增打印模板" width="720px" @cancel="printModalOpen = false" @confirm="savePrintTemplate">
      <div class="aw-form-grid">
        <label class="aw-field"><span>模板名称</span><input v-model="printForm.name" /></label>
        <label class="aw-field"><span>适用场景</span><input v-model="printForm.scene" /></label>
        <label class="aw-field"><span>纸张</span><select v-model="printForm.size"><option>A4</option><option>A5</option></select></label>
      </div>
    </aw-setting-modal>

    <aw-setting-modal :open="categoryRootModalOpen" title="新增组织分类" width="680px" @cancel="categoryRootModalOpen = false" @confirm="saveCategoryRoot">
      <div class="aw-form-grid">
        <label class="aw-field"><span>分类名称</span><input v-model="categoryRootForm.name" placeholder="请输入分类名称" /></label>
        <label class="aw-field"><span>分类编号</span><input v-model="categoryRootForm.code" placeholder="请输入分类编号" /></label>
        <label class="aw-field aw-field-full"><span>分类备注</span><textarea v-model="categoryRootForm.remark" placeholder="请输入分类备注"></textarea></label>
      </div>
    </aw-setting-modal>

    <aw-setting-modal :open="categoryChildModalOpen" :title="editingCategoryId ? '编辑下级分类' : '新增下级分类'" width="680px" @cancel="closeCategoryChildModal" @confirm="saveCategoryChild">
      <div class="aw-form-grid">
        <label class="aw-field"><span>分类名称</span><input v-model="categoryChildForm.name" placeholder="请输入分类名称" /></label>
        <label class="aw-field"><span>分类编号</span><input v-model="categoryChildForm.code" placeholder="请输入分类编号" /></label>
        <label class="aw-field aw-field-full"><span>分类备注</span><textarea v-model="categoryChildForm.remark" placeholder="请输入分类备注"></textarea></label>
      </div>
    </aw-setting-modal>

    <aw-person-picker-modal
      :depts="pickerData.people"
      :open="personPickerOpen"
      title="选择审批人员"
      @cancel="personPickerOpen = false"
      @confirm="confirmApprovalPersons"
    />
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getHrPickerData, getHrSettings, saveHrSettings } from '@/app/api/hr/resources';
import type { HrCategoryRow, HrModuleConfig, HrSettingKey, HrSettings } from '@/app/api/hr/types';
import AwApprovalRuleEditor from '@/components/setting-page/AwApprovalRuleEditor.vue';
import AwCodeRuleBuilder from '@/components/setting-page/AwCodeRuleBuilder.vue';
import AwFieldSettingPage from '@/components/setting-page/AwFieldSettingPage.vue';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import AwSettingListCard from '@/components/setting-page/AwSettingListCard.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingSplitPage from '@/components/setting-page/AwSettingSplitPage.vue';
import AwSettingTable from '@/components/setting-page/AwSettingTable.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import AwSettingTree from '@/components/setting-page/AwSettingTree.vue';
import AwStrategySettingPage from '@/components/setting-page/AwStrategySettingPage.vue';
import type { ApprovalNode, FieldSettingRow, PersonPickerPerson, SettingTableColumn, SettingTableRow, SettingTreeItem, StrategyRule } from '@/components/setting-page/types';

const props = defineProps<{ config: HrModuleConfig; settingKey: HrSettingKey }>();
const router = useRouter();
const pickerData = getHrPickerData();
const settingsData = ref<HrSettings>();
const keyword = ref('');
const message = ref('');
const activeFieldScope = ref('基础信息');
const fieldModalOpen = ref(false);
const printModalOpen = ref(false);
const categoryRootModalOpen = ref(false);
const categoryChildModalOpen = ref(false);
const personPickerOpen = ref(false);
const approvalEditorOpen = ref(false);
const activeApprovalIndex = ref(0);
const activePickerNodeIndex = ref<number | null>(null);
const editingApprovalId = ref<string | null>(null);
const editingCategoryId = ref<string | number | null>(null);
const activeCategoryRootId = ref<string | number>('');
const categoryRootForm = reactive({ name: '', code: '', remark: '' });
const categoryChildForm = reactive({ name: '', code: '', remark: '' });
const fieldForm = reactive({ id: '', name: '', code: '', type: '文本' });
const printForm = reactive({ id: '', name: '', scene: '', size: 'A4' });
const approvalForm = reactive<{ name: string; nodes: ApprovalNode[] }>({ name: '', nodes: [] });
const approvalMethods = [
  { value: '依次审批', desc: '按节点顺序逐级审批' },
  { value: '会签', desc: '所有审批人都需要处理' },
  { value: '或签', desc: '任一审批人处理即可' },
];
const approvalColumns: SettingTableColumn[] = [
  { key: 'index', label: '序号', width: '70px' },
  { key: 'name', label: '流程名称', width: '220px' },
  { key: 'category', label: '适用分类', width: '140px' },
  { key: 'nodeCount', label: '节点数', width: '90px' },
  { key: 'owner', label: '创建人', width: '120px' },
  { key: 'updatedAt', label: '更新时间', width: '170px' },
  { key: 'enabled', label: '启用', width: '90px' },
];
const printColumns: SettingTableColumn[] = [
  { key: 'index', label: '序号', width: '70px' },
  { key: 'name', label: '模板名称', width: '220px' },
  { key: 'scene', label: '适用场景', width: '160px' },
  { key: 'size', label: '纸张', width: '90px' },
  { key: 'owner', label: '维护人', width: '120px' },
  { key: 'updatedAt', label: '更新时间', width: '150px' },
  { key: 'enabled', label: '启用', width: '90px' },
];
const categoryColumns: SettingTableColumn[] = [
  { key: 'index', label: '序号', width: '70px' },
  { key: 'name', label: '分类名称', width: '180px' },
  { key: 'parent', label: '上级分类', width: '140px' },
  { key: 'code', label: '分类编号', width: '180px' },
  { key: 'count', label: '组织数量', width: '100px' },
  { key: 'enabled', label: '状态', width: '90px' },
];
const addText = computed(() => {
  if (props.settingKey === 'categories') return '新增下级分类';
  if (props.settingKey === 'fields') return '新增字段';
  if (props.settingKey === 'approvals') return '新增审批规则';
  if (props.settingKey === 'print') return '新增打印模板';
  return '新增配置';
});
const fieldScopes = computed(() => {
  const scopes = Array.from(new Set((settingsData.value?.fields || []).map((field) => field.scope)));
  return scopes.map((scope) => ({ key: scope, label: scope, count: settingsData.value?.fields.filter((field) => field.scope === scope).length || 0 }));
});
const categoryRootRows = computed(() => settingsData.value?.categories.filter((row) => row.parent === '无') || []);
const activeCategoryRoot = computed(() => categoryRootRows.value.find((row) => row.id === activeCategoryRootId.value) || categoryRootRows.value[0]);
const categoryChildRows = computed(() => settingsData.value?.categories.filter((row) => row.parent === activeCategoryRoot.value?.name) || []);
const categoryTreeItems = computed<SettingTreeItem[]>(() => categoryRootRows.value.map((row) => ({
  key: row.id,
  label: row.name,
  count: categoryRootCount(row.name),
  icon: 'line-users',
})));
const filteredCategoryRows = computed(() => {
  const text = keyword.value.trim();
  if (!text) return categoryChildRows.value;
  return categoryChildRows.value.filter((row) => Object.values(row).some((value) => String(value).includes(text)));
});

watch(() => props.config.resource, loadSettings);
watch(() => props.settingKey, () => {
  keyword.value = '';
  message.value = '';
  approvalEditorOpen.value = false;
  ensureCategoryRoot();
});

async function loadSettings() {
  settingsData.value = await getHrSettings(props.config);
  activeFieldScope.value = settingsData.value.fields[0]?.scope || '基础信息';
  ensureCategoryRoot();
}

function handleAdd() {
  if (props.settingKey === 'categories') {
    openCategoryChildModal();
    return;
  }
  if (props.settingKey === 'fields') {
    Object.assign(fieldForm, { id: '', name: '', code: '', type: '文本' });
    fieldModalOpen.value = true;
  }
  if (props.settingKey === 'approvals') openApprovalEditor();
  if (props.settingKey === 'print') {
    Object.assign(printForm, { id: '', name: '', scene: '', size: 'A4' });
    printModalOpen.value = true;
  }
}

function ensureCategoryRoot() {
  if (!categoryRootRows.value.length) {
    activeCategoryRootId.value = '';
    return;
  }
  if (!categoryRootRows.value.some((row) => row.id === activeCategoryRootId.value)) {
    activeCategoryRootId.value = categoryRootRows.value[0].id;
  }
}

function categoryRootCount(name: string) {
  return (settingsData.value?.categories || [])
    .filter((row) => row.parent === name)
    .reduce((sum, row) => sum + Number(row.count || 0), 0);
}

function selectCategoryRoot(key: string | number) {
  activeCategoryRootId.value = key;
  keyword.value = '';
}

function openCategoryRootModal() {
  Object.assign(categoryRootForm, { name: '', code: '', remark: '' });
  categoryRootModalOpen.value = true;
}

function openCategoryChildModal(row?: HrCategoryRow) {
  editingCategoryId.value = row?.id ?? null;
  Object.assign(categoryChildForm, {
    name: row?.name || '',
    code: row?.code || '',
    remark: row?.remark || '',
  });
  categoryChildModalOpen.value = true;
}

function saveCategoryRoot() {
  if (!settingsData.value || !categoryRootForm.name.trim()) return;
  const id = `${props.config.resource}_cat_root_${Date.now()}`;
  settingsData.value.categories.push({
    id,
    name: categoryRootForm.name.trim(),
    parent: '无',
    code: categoryRootForm.code.trim() || `ORG_CAT_${Date.now()}`,
    remark: categoryRootForm.remark.trim() || '暂无分类备注',
    count: 0,
    enabled: true,
  });
  activeCategoryRootId.value = id;
  categoryRootModalOpen.value = false;
  void saveSettings();
}

function closeCategoryChildModal() {
  editingCategoryId.value = null;
  Object.assign(categoryChildForm, { name: '', code: '', remark: '' });
  categoryChildModalOpen.value = false;
}

function saveCategoryChild() {
  if (!settingsData.value || !categoryChildForm.name.trim()) return;
  const parent = activeCategoryRoot.value || categoryRootRows.value[0];
  if (!parent) return;
  const next: HrCategoryRow = {
    id: editingCategoryId.value || `${props.config.resource}_cat_child_${Date.now()}`,
    name: categoryChildForm.name.trim(),
    parent: parent.name,
    code: categoryChildForm.code.trim() || `${String(parent.code || 'ORG_CAT')}_CHILD`,
    remark: categoryChildForm.remark.trim(),
    count: 0,
    enabled: true,
  };
  settingsData.value.categories = editingCategoryId.value
    ? settingsData.value.categories.map((row) => row.id === editingCategoryId.value ? next : row)
    : [...settingsData.value.categories, next];
  closeCategoryChildModal();
  void saveSettings();
}

function editCategory(row: SettingTableRow) {
  openCategoryChildModal(row as HrCategoryRow);
}

function deleteCategory(row: SettingTableRow) {
  if (!settingsData.value || categoryChildRows.value.length <= 1) return;
  if (!window.confirm(`确认删除分类「${row.name}」吗？`)) return;
  settingsData.value.categories = settingsData.value.categories.filter((item) => item.id !== row.id);
  void saveSettings();
}

function editField(row: FieldSettingRow) {
  Object.assign(fieldForm, { id: String(row.id), name: row.name, code: row.code, type: row.type });
  fieldModalOpen.value = true;
}

function saveField() {
  if (!settingsData.value || !fieldForm.name.trim()) return;
  const next: FieldSettingRow = {
    id: fieldForm.id || `${props.config.resource}_field_${Date.now()}`,
    name: fieldForm.name.trim(),
    code: fieldForm.code.trim() || `field_${Date.now()}`,
    type: fieldForm.type,
    scope: activeFieldScope.value,
    required: false,
    enabled: true,
    permissions: [],
  };
  settingsData.value.fields = fieldForm.id
    ? settingsData.value.fields.map((row) => row.id === fieldForm.id ? next : row)
    : [...settingsData.value.fields, next];
  fieldModalOpen.value = false;
  void saveSettings();
}

function deleteField(row: FieldSettingRow) {
  if (!settingsData.value || settingsData.value.fields.length <= 1) return;
  if (!window.confirm(`确认删除字段「${row.name}」吗？`)) return;
  settingsData.value.fields = settingsData.value.fields.filter((item) => item.id !== row.id);
  void saveSettings();
}

function toggleFieldEnabled(row: FieldSettingRow, enabled: boolean) {
  row.enabled = enabled;
  void saveSettings();
}

function toggleFieldRequired(row: FieldSettingRow, required: boolean) {
  row.required = required;
  void saveSettings();
}

function resetNumberRule() {
  if (!settingsData.value) return;
  settingsData.value.numberRule.prefix = props.config.resource.replace('hr-', '').slice(0, 3).toUpperCase();
  settingsData.value.numberRule.separator = '-';
  settingsData.value.numberRule.selected = ['date', 'serial4'];
}

function openApprovalEditor(row?: SettingTableRow) {
  editingApprovalId.value = row ? String(row.id) : null;
  approvalForm.name = String(row?.name || `${props.config.title}审批流程`);
  approvalForm.nodes = Array.isArray(row?.nodes)
    ? (row.nodes as ApprovalNode[]).map((node) => ({ ...node, approvers: [...node.approvers] }))
    : [
        { name: '部门负责人审批', approvers: [], method: '依次审批' },
        { name: '人力中心复核', approvers: [], method: '或签' },
      ];
  activeApprovalIndex.value = 0;
  approvalEditorOpen.value = true;
}

function editApproval(row: SettingTableRow) {
  openApprovalEditor(row);
}

function deleteApproval(row: SettingTableRow) {
  if (!settingsData.value || settingsData.value.approvals.length <= 1) return;
  if (!window.confirm(`确认删除审批流程「${row.name}」吗？`)) return;
  settingsData.value.approvals = settingsData.value.approvals.filter((item) => item.id !== row.id);
  void saveSettings();
}

function addApprovalNode() {
  approvalForm.nodes.push({ name: '', approvers: [], method: '依次审批' });
  activeApprovalIndex.value = approvalForm.nodes.length - 1;
}

function removeApprovalNode(index: number) {
  if (approvalForm.nodes.length <= 1) return;
  approvalForm.nodes.splice(index, 1);
  activeApprovalIndex.value = Math.max(0, Math.min(activeApprovalIndex.value, approvalForm.nodes.length - 1));
}

function updateApprovalNode(index: number, node: ApprovalNode) {
  approvalForm.nodes[index] = node;
}

function openApprovalPicker(index: number) {
  activePickerNodeIndex.value = index;
  personPickerOpen.value = true;
}

function removeApprovalPerson(index: number, name: string) {
  const node = approvalForm.nodes[index];
  if (!node) return;
  node.approvers = node.approvers.filter((person) => person !== name);
}

function confirmApprovalPersons(persons: PersonPickerPerson[]) {
  if (activePickerNodeIndex.value === null) return;
  const node = approvalForm.nodes[activePickerNodeIndex.value];
  const names = new Set(node.approvers);
  persons.forEach((person) => names.add(person.name));
  node.approvers = Array.from(names);
  personPickerOpen.value = false;
}

function saveApprovalRule() {
  if (!settingsData.value || !approvalForm.name.trim()) return;
  const next = {
    id: editingApprovalId.value || `${props.config.resource}_approval_${Date.now()}`,
    name: approvalForm.name.trim(),
    category: props.config.title,
    nodes: approvalForm.nodes.map((node) => ({ ...node, approvers: [...node.approvers] })),
    owner: '王人事',
    updatedAt: '2026-05-30 10:00',
    enabled: true,
  };
  settingsData.value.approvals = editingApprovalId.value
    ? settingsData.value.approvals.map((row) => row.id === editingApprovalId.value ? next : row)
    : [...settingsData.value.approvals, next];
  approvalEditorOpen.value = false;
  void saveSettings();
}

function updateStrategyRule(tabKey: string, rule: StrategyRule) {
  if (!settingsData.value) return;
  settingsData.value.strategies = settingsData.value.strategies.map((tab) => ({
    ...tab,
    rows: tab.key === tabKey ? tab.rows.map((row) => row.key === rule.key ? rule : row) : tab.rows,
  }));
}

function editPrintTemplate(row: SettingTableRow) {
  Object.assign(printForm, { id: String(row.id), name: row.name, scene: row.scene, size: row.size });
  printModalOpen.value = true;
}

function deletePrintTemplate(row: SettingTableRow) {
  if (!settingsData.value || settingsData.value.printTemplates.length <= 1) return;
  if (!window.confirm(`确认删除打印模板「${row.name}」吗？`)) return;
  settingsData.value.printTemplates = settingsData.value.printTemplates.filter((item) => item.id !== row.id);
  void saveSettings();
}

function savePrintTemplate() {
  if (!settingsData.value || !printForm.name.trim()) return;
  const next = {
    id: printForm.id || `${props.config.resource}_print_${Date.now()}`,
    name: printForm.name.trim(),
    scene: printForm.scene.trim() || '详情打印',
    size: printForm.size,
    owner: '王人事',
    updatedAt: '2026-05-30',
    enabled: true,
  };
  settingsData.value.printTemplates = printForm.id
    ? settingsData.value.printTemplates.map((row) => row.id === printForm.id ? next : row)
    : [...settingsData.value.printTemplates, next];
  printModalOpen.value = false;
  void saveSettings();
}

async function saveSettings() {
  if (!settingsData.value) return;
  await saveHrSettings(props.config, settingsData.value);
  message.value = `${props.config.title}设置已保存到 HR mock adapter，待后端补充独立契约后切换远程接口。`;
}

onMounted(loadSettings);
</script>
