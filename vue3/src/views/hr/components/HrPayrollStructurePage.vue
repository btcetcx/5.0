<template>
  <aw-list-page>
    <aw-list-toolbar
      :actions="toolbarActions"
      :create-label="addText"
      :search-placeholder="searchPlaceholder"
      @columns="openDrawer('columns')"
      @create="openCreateModal"
      @export="openDrawer('export')"
      @filter="openDrawer('filter')"
      @import="openDrawer('import')"
      @refresh="loadData"
      @search="keyword = $event"
    />

    <aw-data-table
      :bulk-actions="[]"
      :columns="columns"
      :rows="filteredRows"
      :total="filteredRows.length"
      row-key="id"
    >
      <template #cell="{ column, record, value }">
        <span v-if="column.key === 'status'" :class="['aw-status', statusTone(String(value || ''))]">{{ value }}</span>
        <span v-else-if="column.key === 'taxable'">{{ value ? '计税' : '不计税' }}</span>
        <span v-else-if="column.key === 'socialBase'">{{ value ? '计入' : '不计入' }}</span>
        <span v-else-if="column.key === 'action'" class="aw-link" @click="openDetailModal(record)">查看详情</span>
        <span v-else>{{ value }}</span>
      </template>
    </aw-data-table>

    <hr-list-drawer
      v-if="drawerType"
      :columns="drawerColumns"
      :module-title="addText.replace(/^新增/, '')"
      :open="Boolean(drawerType)"
      :statuses="structureStatuses"
      :type="drawerType"
      @apply="drawerType = ''"
      @close="drawerType = ''"
    />

    <aw-setting-modal :open="modalOpen" :title="modalTitle" width="760px" @cancel="closeModal" @confirm="saveModal">
      <div :class="['aw-form-grid', { 'hr-payroll-readonly': detailMode }]">
        <label class="aw-field">
          <span>{{ nameLabel }}</span>
          <input v-model="form.name" :placeholder="`请输入${nameLabel}`" />
        </label>
        <label class="aw-field">
          <span>编码</span>
          <input v-model="form.code" placeholder="请输入编码" />
        </label>

        <template v-if="mode === 'scheme'">
          <label class="aw-field">
            <span>适用范围</span>
            <input v-model="form.applicableScope" placeholder="例如：销售中心 / 销售一部" />
          </label>
          <label class="aw-field">
            <span>员工范围</span>
            <input v-model="form.employeeScope" placeholder="例如：销售经理、销售专员" />
          </label>
          <label class="aw-field">
            <span>计薪周期</span>
            <select v-model="form.payCycle">
              <option>自然月</option>
              <option>双周</option>
              <option>按项目周期</option>
            </select>
          </label>
          <label class="aw-field">
            <span>币种</span>
            <select v-model="form.currency">
              <option>CNY</option>
              <option>USD</option>
              <option>HKD</option>
            </select>
          </label>
          <label class="aw-field">
            <span>生效日期</span>
            <input v-model="form.effectiveDate" type="date" />
          </label>
          <label class="aw-field">
            <span>负责人</span>
            <input v-model="form.owner" placeholder="请输入负责人" />
          </label>
        </template>

        <template v-else-if="mode === 'type'">
          <label class="aw-field">
            <span>所属方案</span>
            <select v-model="form.schemeId">
              <option v-for="scheme in schemes" :key="scheme.id" :value="scheme.id">{{ scheme.name }}</option>
            </select>
          </label>
          <label class="aw-field">
            <span>收发方向</span>
            <select v-model="form.direction">
              <option>应发</option>
              <option>应扣</option>
              <option>公司成本</option>
            </select>
          </label>
          <label class="aw-field">
            <span>发放时点</span>
            <input v-model="form.payoutTiming" placeholder="例如：每月工资批次" />
          </label>
          <label class="aw-field">
            <span>负责人</span>
            <input v-model="form.owner" placeholder="请输入负责人" />
          </label>
          <label class="aw-field aw-field-full">
            <span>计算口径</span>
            <textarea v-model="form.calcMethod" placeholder="请输入类型下项目的统一计算口径"></textarea>
          </label>
        </template>

        <template v-else>
          <label class="aw-field">
            <span>所属类型</span>
            <select v-model="form.typeId">
              <option v-for="type in allTypes" :key="type.id" :value="type.id">{{ schemeName(type.schemeId) }} / {{ type.name }}</option>
            </select>
          </label>
          <label class="aw-field">
            <span>收发方向</span>
            <select v-model="form.direction">
              <option>应发</option>
              <option>应扣</option>
              <option>公司成本</option>
            </select>
          </label>
          <label class="aw-field">
            <span>计税口径</span>
            <select v-model="form.taxable">
              <option :value="true">计税</option>
              <option :value="false">不计税</option>
            </select>
          </label>
          <label class="aw-field">
            <span>社保基数</span>
            <select v-model="form.socialBase">
              <option :value="true">计入</option>
              <option :value="false">不计入</option>
            </select>
          </label>
          <label class="aw-field">
            <span>会计科目</span>
            <input v-model="form.accountingSubject" placeholder="例如：管理费用-工资" />
          </label>
          <label class="aw-field">
            <span>计算方式</span>
            <input v-model="form.calcMethod" placeholder="例如：岗位等级标准 * 出勤系数" />
          </label>
          <label class="aw-field aw-field-full">
            <span>公式说明</span>
            <textarea v-model="form.formula" placeholder="请输入公式说明"></textarea>
          </label>
        </template>

        <label class="aw-field">
          <span>状态</span>
          <select v-model="form.status">
            <option>启用</option>
            <option>草稿</option>
            <option>停用</option>
          </select>
        </label>
      </div>

      <template v-if="detailMode" #footer>
        <button class="aw-tool-btn" type="button" @click="detailMode = false">编辑</button>
        <button class="aw-btn primary" type="button" @click="closeModal">关闭</button>
      </template>
    </aw-setting-modal>
  </aw-list-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { getHrPayrollStructure, saveHrPayrollStructure } from '@/app/api/hr/resources';
import type { HrModuleConfig, HrPayrollItem, HrPayrollScheme, HrPayrollType } from '@/app/api/hr/types';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import type { AwTableColumn, ToolbarActionKey } from '@/components/list-page/types';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import HrListDrawer from './HrListDrawer.vue';

type PayrollMode = 'scheme' | 'type' | 'item';

interface PayrollRow extends Record<string, unknown> {
  id: string;
  sourceId: string;
  sourceKind: PayrollMode;
}

interface PayrollForm {
  accountingSubject?: string;
  applicableScope?: string;
  calcMethod?: string;
  code?: string;
  currency?: string;
  direction?: string;
  effectiveDate?: string;
  employeeScope?: string;
  formula?: string;
  name?: string;
  owner?: string;
  payCycle?: string;
  payoutTiming?: string;
  schemeId?: string;
  socialBase?: boolean;
  status?: string;
  taxable?: boolean;
  typeId?: string;
  [key: string]: string | boolean | undefined;
}

const props = defineProps<{ actionLabel: string; config: HrModuleConfig }>();
const schemes = ref<HrPayrollScheme[]>([]);
const keyword = ref('');
const modalOpen = ref(false);
const editingId = ref('');
const detailMode = ref(false);
const drawerType = ref<'' | 'filter' | 'columns' | 'import' | 'export'>('');
const form = reactive<PayrollForm>({});
const toolbarActions: ToolbarActionKey[] = ['refresh', 'filter', 'columns', 'import', 'export', 'create'];
const structureStatuses = ['启用', '草稿', '停用'];

const mode = computed<PayrollMode>(() => {
  if (props.actionLabel.includes('薪酬项目')) return 'item';
  if (props.actionLabel.includes('薪酬类型')) return 'type';
  return 'scheme';
});
const allTypes = computed(() => schemes.value.flatMap((scheme) => scheme.types));
const firstScheme = computed(() => schemes.value[0]);
const firstType = computed(() => allTypes.value[0]);
const addText = computed(() => ({ scheme: '新增薪资方案', type: '新增薪酬类型', item: '新增薪酬项目' })[mode.value]);
const nameLabel = computed(() => ({ scheme: '方案名称', type: '类型名称', item: '项目名称' })[mode.value]);
const modalTitle = computed(() => `${detailMode.value ? '查看详情' : editingId.value ? '编辑' : '新增'}${nameLabel.value}`);
const searchPlaceholder = computed(() => `全局搜索（如${nameLabel.value}、编码、负责人）`);

const columns = computed<AwTableColumn[]>(() => {
  if (mode.value === 'scheme') {
    return [
      { key: 'name', title: '方案名称', width: 180 },
      { key: 'code', title: '方案编码', width: 160 },
      { key: 'applicableScope', title: '适用范围', width: 220 },
      { key: 'employeeScope', title: '员工范围', width: 220 },
      { key: 'payCycle', title: '计薪周期', width: 110 },
      { key: 'status', title: '状态', width: 100 },
      { key: 'action', title: '操作', fixed: 'right', width: 110 },
    ];
  }
  if (mode.value === 'type') {
    return [
      { key: 'name', title: '类型名称', width: 160 },
      { key: 'schemeName', title: '所属方案', width: 180 },
      { key: 'code', title: '类型编码', width: 180 },
      { key: 'direction', title: '收发方向', width: 100 },
      { key: 'calcMethod', title: '计算口径', width: 240 },
      { key: 'payoutTiming', title: '发放时点', width: 170 },
      { key: 'owner', title: '负责人', width: 110 },
      { key: 'status', title: '状态', width: 100 },
      { key: 'action', title: '操作', fixed: 'right', width: 110 },
    ];
  }
  return [
    { key: 'name', title: '项目名称', width: 160 },
    { key: 'schemeName', title: '所属方案', width: 180 },
    { key: 'typeName', title: '所属类型', width: 140 },
    { key: 'code', title: '项目编码', width: 170 },
    { key: 'direction', title: '收发方向', width: 100 },
    { key: 'calcMethod', title: '计算方式', width: 220 },
    { key: 'formula', title: '公式说明', width: 260 },
    { key: 'taxable', title: '个税', width: 90 },
    { key: 'socialBase', title: '社保基数', width: 100 },
    { key: 'accountingSubject', title: '会计科目', width: 150 },
    { key: 'status', title: '状态', width: 100 },
    { key: 'action', title: '操作', fixed: 'right', width: 110 },
  ];
});

const rows = computed<PayrollRow[]>(() => {
  if (mode.value === 'scheme') {
    return schemes.value.map((scheme) => ({
      id: scheme.id,
      sourceId: scheme.id,
      sourceKind: 'scheme',
      name: scheme.name,
      code: scheme.code,
      applicableScope: scheme.applicableScope,
      employeeScope: scheme.employeeScope,
      payCycle: scheme.payCycle,
      typeCount: scheme.types.length,
      itemCount: scheme.types.reduce((sum, type) => sum + type.items.length, 0),
      status: scheme.status,
      action: '查看详情',
    }));
  }
  if (mode.value === 'type') {
    return schemes.value.flatMap((scheme) => scheme.types.map((type) => ({
      id: type.id,
      sourceId: type.id,
      sourceKind: 'type' as const,
      name: type.name,
      schemeName: scheme.name,
      code: type.code,
      direction: type.direction,
      calcMethod: type.calcMethod,
      payoutTiming: type.payoutTiming,
      itemCount: type.items.length,
      owner: type.owner,
      status: type.status,
      action: '查看详情',
    })));
  }
  return schemes.value.flatMap((scheme) => scheme.types.flatMap((type) => type.items.map((item) => ({
      id: item.id,
      sourceId: item.id,
      sourceKind: 'item' as const,
      name: item.name,
      schemeName: scheme.name,
      typeName: type.name,
      code: item.code,
      direction: item.direction,
      calcMethod: item.calcMethod,
      formula: item.formula,
      taxable: item.taxable,
      socialBase: item.socialBase,
      accountingSubject: item.accountingSubject,
      status: item.status,
      action: '查看详情',
    }))));
});

const filteredRows = computed(() => {
  const term = keyword.value.trim();
  if (!term) return rows.value;
  return rows.value.filter((row) => JSON.stringify(row).includes(term));
});
const drawerColumns = computed(() => columns.value.map((column) => column.title));

onMounted(loadData);

async function loadData() {
  schemes.value = await getHrPayrollStructure();
}

function schemeName(schemeId?: string) {
  return schemes.value.find((scheme) => scheme.id === schemeId)?.name || '未选方案';
}

function openCreateModal() {
  editingId.value = '';
  detailMode.value = false;
  resetForm();
  modalOpen.value = true;
}

function openDetailModal(row: Record<string, unknown>) {
  editingId.value = String(row.sourceId || row.id);
  detailMode.value = true;
  resetForm(row as PayrollRow);
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

function resetForm(row?: PayrollRow) {
  Object.keys(form).forEach((key) => delete form[key]);
  form.status = '启用';
  if (mode.value === 'scheme') {
    const scheme = schemes.value.find((item) => item.id === row?.sourceId);
    Object.assign(form, scheme || {
      name: '',
      code: `PAY-SCH-${Date.now().toString().slice(-4)}`,
      applicableScope: firstScheme.value?.applicableScope || '',
      employeeScope: '',
      payCycle: '自然月',
      currency: 'CNY',
      effectiveDate: '2026-05-01',
      owner: '财务复核',
      status: '启用',
    });
    return;
  }
  if (mode.value === 'type') {
    const type = allTypes.value.find((item) => item.id === row?.sourceId);
    Object.assign(form, type || {
      schemeId: firstScheme.value?.id || '',
      name: '',
      code: `PAY-TYPE-${Date.now().toString().slice(-4)}`,
      direction: '应发',
      calcMethod: '',
      payoutTiming: '每月工资批次',
      owner: '王人事',
      status: '启用',
    });
    return;
  }
  const item = allTypes.value.flatMap((type) => type.items).find((current) => current.id === row?.sourceId);
  Object.assign(form, item || {
    typeId: firstType.value?.id || '',
    name: '',
    code: `PAY-ITEM-${Date.now().toString().slice(-4)}`,
    direction: '应发',
    calcMethod: '',
    formula: '',
    taxable: true,
    socialBase: false,
    accountingSubject: '管理费用-工资',
    status: '启用',
  });
}

async function saveModal() {
  if (detailMode.value) {
    closeModal();
    return;
  }
  if (!String(form.name || '').trim()) return;
  const next = structuredClone(schemes.value);
  if (mode.value === 'scheme') saveScheme(next);
  else if (mode.value === 'type') saveType(next);
  else saveItem(next);
  schemes.value = await saveHrPayrollStructure(next);
  modalOpen.value = false;
}

function saveScheme(next: HrPayrollScheme[]) {
  const current: HrPayrollScheme = {
    id: editingId.value || `scheme_${Date.now()}`,
    name: String(form.name),
    code: String(form.code),
    applicableScope: String(form.applicableScope || ''),
    employeeScope: String(form.employeeScope || ''),
    payCycle: String(form.payCycle || '自然月'),
    currency: String(form.currency || 'CNY'),
    effectiveDate: String(form.effectiveDate || '2026-05-01'),
    owner: String(form.owner || '财务复核'),
    status: String(form.status || '启用'),
    types: next.find((scheme) => scheme.id === editingId.value)?.types || [],
  };
  const index = next.findIndex((scheme) => scheme.id === current.id);
  if (index >= 0) next[index] = current;
  else next.push(current);
}

function saveType(next: HrPayrollScheme[]) {
  const schemeId = String(form.schemeId || firstScheme.value?.id || '');
  const scheme = next.find((item) => item.id === schemeId);
  if (!scheme) return;
  const existing = next.flatMap((item) => item.types).find((type) => type.id === editingId.value);
  const current: HrPayrollType = {
    id: editingId.value || `type_${Date.now()}`,
    schemeId,
    name: String(form.name),
    code: String(form.code),
    direction: String(form.direction || '应发'),
    calcMethod: String(form.calcMethod || ''),
    payoutTiming: String(form.payoutTiming || '每月工资批次'),
    owner: String(form.owner || '王人事'),
    status: String(form.status || '启用'),
    items: existing?.items || [],
  };
  next.forEach((item) => {
    item.types = item.types.filter((type) => type.id !== current.id);
  });
  scheme.types.push(current);
}

function saveItem(next: HrPayrollScheme[]) {
  const typeId = String(form.typeId || firstType.value?.id || '');
  const targetScheme = next.find((scheme) => scheme.types.some((type) => type.id === typeId));
  const targetType = targetScheme?.types.find((type) => type.id === typeId);
  if (!targetScheme || !targetType) return;
  const current: HrPayrollItem = {
    id: editingId.value || `item_${Date.now()}`,
    schemeId: targetScheme.id,
    typeId,
    name: String(form.name),
    code: String(form.code),
    direction: String(form.direction || '应发'),
    calcMethod: String(form.calcMethod || ''),
    formula: String(form.formula || ''),
    taxable: Boolean(form.taxable),
    socialBase: Boolean(form.socialBase),
    accountingSubject: String(form.accountingSubject || ''),
    status: String(form.status || '启用'),
  };
  next.forEach((scheme) => scheme.types.forEach((type) => {
    type.items = type.items.filter((item) => item.id !== current.id);
  }));
  targetType.items.push(current);
}

function openDrawer(type: 'filter' | 'columns' | 'import' | 'export') {
  drawerType.value = type;
}

function statusTone(status: string) {
  if (status === '启用') return 'green';
  if (status === '停用') return 'red';
  return 'yellow';
}
</script>

<style scoped>
.hr-payroll-readonly :is(input, select, textarea) {
  background: #f8fafc;
  color: #475569;
  pointer-events: none;
}
</style>
