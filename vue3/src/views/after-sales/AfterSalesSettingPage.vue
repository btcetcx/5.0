<template>
  <aw-setting-page>
    <template #toolbar>
      <section class="aw-detail-toolbar">
        <button class="aw-back-btn" type="button" @click="goBack">
          <span class="aw-line-icon line-back" />返回售后中心
        </button>
      </section>
    </template>

    <aw-setting-split-page :class="{ 'as-setting-single': singlePage }">
      <template v-if="!singlePage" #tree>
        <aw-setting-tree
          title="设置分类"
          :active-key="activeSettingTreeKey"
          :items="treeItems"
          @select="selectDictionary(String($event))"
        />
      </template>

      <section class="as-setting-main">
        <aw-strategy-setting-page
          v-if="isStrategySetting"
          title="售后策略设置"
          description="按售后单、任务处理和质量闭环页面真实动作配置审核、派生单据、指派处理、结单确认、SLA 和质量升级策略。"
          :tabs="afterSalesStrategyTabs"
          @reset="resetAfterSalesStrategies"
          @save="saveAfterSalesStrategies"
          @update-rule="updateAfterSalesStrategyRule"
        />

        <template v-else>
        <div class="aw-list-toolbar as-setting-list-toolbar">
          <div class="aw-toolbar-left as-setting-toolbar-left">
            <div class="aw-search as-setting-search">
              <span class="aw-line-icon line-search"></span>
              <input v-model="keyword" :placeholder="`全局搜索（如${currentTitle}、配置编码、适用范围…）`" />
            </div>
          </div>
          <div class="aw-toolbar-right">
            <button class="aw-refresh-action" type="button" @click="refreshRows"><span class="aw-line-icon line-refresh"></span>刷新</button>
            <button class="aw-tool-btn" type="button" @click="filterOpen = !filterOpen"><span class="aw-line-icon line-filter"></span>筛选</button>
            <select v-if="filterOpen" v-model="stateFilter" class="as-setting-filter">
              <option value="">全部</option>
              <option>启用</option>
              <option>停用</option>
            </select>
            <button class="aw-tool-btn" type="button" @click="fieldOpen = true"><span class="aw-line-icon line-columns"></span>字段配置</button>
            <button class="aw-tool-btn" type="button" @click="showMessage('导出任务已生成')"><span class="aw-line-icon line-download"></span>导出</button>
            <button class="aw-tool-btn" type="button" @click="showMessage('导入模板已准备')"><span class="aw-line-icon line-upload"></span>导入</button>
            <button class="aw-btn primary" type="button" @click="openCreate">{{ currentConfig.addLabel }}</button>
          </div>
        </div>

        <div class="aw-doc-tbl-wrap">
          <div class="aw-doc-tbl-inner">
            <table class="aw-doc-tbl as-setting-table">
              <thead>
                <tr>
                  <th class="aw-check-col"><label class="aw-check"><input type="checkbox" :checked="allChecked" @change="toggleAll" /><span></span></label></th>
                  <th style="width:150px">配置编码</th>
                  <th style="width:220px">{{ currentTitle }}</th>
                  <th style="width:180px">适用范围</th>
                  <th style="width:110px">状态</th>
                  <th style="width:110px">维护人</th>
                  <th style="width:130px">更新日期</th>
                  <th style="width:90px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredRows" :key="row.id">
                  <td class="aw-check-col">
                    <label class="aw-check"><input type="checkbox" :checked="selectedIds.includes(row.id)" @change="toggleRow(row.id)" /><span></span></label>
                  </td>
                  <td class="aw-num">{{ row.code }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.type }}</td>
                  <td><span :class="['aw-status', row.state === '启用' ? 'green' : 'gray']">{{ row.state }}</span></td>
                  <td>{{ row.owner }}</td>
                  <td>{{ row.date }}</td>
                  <td>
                    <span class="aw-link" @click="openEdit(row)">编辑</span>
                    <span class="aw-action-split">|</span>
                    <span class="aw-link" @click="toggleState(row)">{{ row.state === '启用' ? '停用' : '启用' }}</span>
                  </td>
                </tr>
                <tr v-if="!filteredRows.length">
                  <td colspan="8" class="as-setting-empty">暂无符合当前条件的配置项。</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="aw-list-footer">
          <div class="aw-footer-left">
            <label class="aw-check"><input type="checkbox" :checked="allChecked" @change="toggleAll" /><span></span></label>
            <span>共 {{ currentRows.length * 20 }} 条</span>
            <span>已选 {{ selectedIds.length }} 项</span>
            <button class="aw-bulk-btn" type="button" @click="batchState('启用')">批量启用</button>
            <button class="aw-bulk-btn" type="button" @click="batchState('停用')">批量停用</button>
          </div>
          <div class="aw-pagination">
            <button type="button">上一页</button>
            <button class="on" type="button">1</button>
            <button type="button">2</button>
            <button type="button">下一页</button>
          </div>
        </div>

        <div v-if="message" class="as-setting-message">{{ message }}</div>
        </template>
      </section>
    </aw-setting-split-page>

    <div v-if="fieldOpen" class="aw-mask" @click="fieldOpen = false">
      <div class="aw-modal as-setting-field-modal" @click.stop>
        <div class="head">
          <span class="aw-modal-title">字段配置</span>
          <button class="aw-modal-close" type="button" @click="fieldOpen = false">×</button>
        </div>
        <div class="body">
          <div class="as-field-grid">
            <label v-for="column in currentConfig.columns" :key="column" class="aw-switch-line">
              <input checked type="checkbox" />
              <i></i>
              <em>{{ column }}</em>
            </label>
          </div>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-btn" type="button" @click="fieldOpen = false">取消</button>
          <button class="aw-btn primary" type="button" @click="fieldOpen = false">保存</button>
        </div>
      </div>
    </div>

    <div v-if="editorOpen" class="aw-mask" @click="closeEditor">
      <div class="aw-modal" @click.stop>
        <div class="head">
          <span class="aw-modal-title">{{ currentConfig.addLabel }}</span>
          <span class="aw-modal-sub">{{ currentConfig.note }}</span>
          <button class="aw-modal-close" type="button" @click="closeEditor">×</button>
        </div>
        <div class="body">
          <div class="aw-doc-grid as-editor-grid">
            <label class="aw-field">
              <label class="req">配置名称</label>
              <input v-model="editor.name" class="aw-input" :placeholder="`请输入${currentTitle}`" />
            </label>
            <label class="aw-field">
              <label>配置编码</label>
              <input v-model="editor.code" class="aw-input" readonly />
            </label>
            <label class="aw-field">
              <label>适用范围</label>
              <select v-model="editor.type" class="aw-select">
                <option>售后发起</option>
                <option>售后处理</option>
                <option>质量闭环</option>
                <option>全部场景</option>
                <option v-if="editor.type && !standardScopes.includes(editor.type)">{{ editor.type }}</option>
              </select>
            </label>
            <label class="aw-field">
              <label>是否启用</label>
              <select v-model="editor.state" class="aw-select">
                <option>启用</option>
                <option>停用</option>
              </select>
            </label>
          </div>
        </div>
        <div class="aw-modal-foot">
          <button class="aw-btn" type="button" @click="closeEditor">取消</button>
          <button class="aw-btn primary" type="button" @click="saveEditor">保存</button>
        </div>
      </div>
    </div>
  </aw-setting-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingSplitPage from '@/components/setting-page/AwSettingSplitPage.vue';
import AwSettingTree from '@/components/setting-page/AwSettingTree.vue';
import AwStrategySettingPage from '@/components/setting-page/AwStrategySettingPage.vue';
import type { StrategyRule, StrategyTab } from '@/components/setting-page/types';
import { afterSalesComplaintOptions, afterSalesHandlingSettings, afterSalesProcessOptions, afterSalesReasonOptions, afterSalesTypeCards } from '@/app/api/after-sales/dictionaries';

type SettingKey = '售后原因' | '投诉问题' | '售后类型' | '处理方式' | '保修政策' | 'SLA 规则';

interface DictSeedRow {
  code: string;
  name: string;
  scene: string;
  required: string;
  linkage: string;
}

interface DictTableRow {
  id: string;
  code: string;
  name: string;
  type: string;
  state: '启用' | '停用';
  owner: string;
  date: string;
  required: string;
  linkage: string;
}

interface DictConfig {
  addLabel: string;
  note: string;
  columns: string[];
  rows: DictSeedRow[];
}

const props = withDefaults(defineProps<{
  initialKey?: string;
  singlePage?: boolean;
  backPath?: string;
}>(), {
  initialKey: '售后原因',
  singlePage: false,
  backPath: '/after-sales',
});

const router = useRouter();
const route = useRoute();
const presetKeys = ['售后原因', '投诉问题', '售后类型', '处理方式', '保修政策', 'SLA 规则'];
const singlePage = computed(() => props.singlePage || presetKeys.includes(String(route.query.setting || route.query.action || '')));
const strategySettingKeys = ['strategies', '策略设置', '售后策略设置'];
const isStrategySetting = computed(() => strategySettingKeys.includes(String(route.query.setting || route.query.action || props.initialKey)));

const dictConfigs: Record<SettingKey, DictConfig> = {
  售后原因: {
    addLabel: '新增售后原因',
    note: '用于发起售后时产品行的“问题原因”下拉。',
    rows: afterSalesReasonOptions.map((name, index) => ({
      code: `REASON-${String(index + 1).padStart(3, '0')}`,
      name,
      scene: index < 3 ? '退换货 / 换货' : '通用',
      required: index < 3 ? '是' : '否',
      linkage: index === 1 ? '可触发质量判定' : '记录原因',
    })),
    columns: ['编码', '原因名称', '适用场景', '是否常用', '后续联动'],
  },
  投诉问题: {
    addLabel: '新增投诉问题',
    note: '用于售后详情、质量闭环和客诉归类。',
    rows: afterSalesComplaintOptions.map((name, index) => ({
      code: `COMP-${String(index + 1).padStart(3, '0')}`,
      name,
      scene: index < 4 ? '产品/包装' : '服务',
      required: index < 4 ? '是' : '否',
      linkage: index < 4 ? '可关联质检复判' : '服务回访',
    })),
    columns: ['编码', '投诉问题', '问题归类', '是否常用', '后续联动'],
  },
  售后类型: {
    addLabel: '新增售后类型',
    note: '用于发起售后第二步“选择售后类型”。',
    rows: afterSalesTypeCards.map((item, index) => ({
      code: `TYPE-${String(index + 1).padStart(3, '0')}`,
      name: item.title,
      scene: item.owners,
      required: '是',
      linkage: item.desc,
    })),
    columns: ['编码', '售后类型', '责任角色', '是否启用', '说明'],
  },
  处理方式: {
    addLabel: '新增处理方式',
    note: '用于新增售后时选择处理方式，并驱动派生单据、任务和状态回填。',
    rows: afterSalesHandlingSettings.map((item, index) => ({
      code: `ACTION-${String(index + 1).padStart(3, '0')}`,
      name: item.name,
      scene: item.scene || afterSalesProcessOptions[index] || '通用',
      required: '是',
      linkage: item.linkage,
    })),
    columns: ['编码', '处理方式', '适用类型', '是否启用', '后续联动'],
  },
  保修政策: {
    addLabel: '新增保修政策',
    note: '用于按产品、客户、订单或合同约定维护保修范围和期限。',
    rows: [
      { code: 'WARRANTY-001', name: '标准一年保修', scene: '通用产品', required: '是', linkage: '售后受理时自动校验保修有效期' },
      { code: 'WARRANTY-002', name: '重点客户延保', scene: '重点客户 / 项目订单', required: '否', linkage: '按客户等级延长保修期限' },
      { code: 'WARRANTY-003', name: '耗材不保修', scene: '耗材 / 易损件', required: '是', linkage: '发起售后时提示超出保修范围' },
    ],
    columns: ['编码', '保修政策', '适用范围', '是否启用', '后续联动'],
  },
  'SLA 规则': {
    addLabel: '新增SLA规则',
    note: '用于售后受理、派工、处理和结单确认的时效预警。',
    rows: [
      { code: 'SLA-001', name: '紧急售后2小时受理', scene: '紧急 / 高优先级', required: '是', linkage: '超时触发主管提醒' },
      { code: 'SLA-002', name: '普通售后8小时响应', scene: '普通售后', required: '是', linkage: '临期进入任务池预警' },
      { code: 'SLA-003', name: '维修任务48小时闭环', scene: '维修 / 现场服务', required: '否', linkage: '逾期升级协同任务' },
    ],
    columns: ['编码', 'SLA规则', '适用场景', '是否启用', '后续联动'],
  },
};

const rowsByKey = reactive<Record<SettingKey, DictTableRow[]>>({
  售后原因: buildRows('售后原因'),
  投诉问题: buildRows('投诉问题'),
  售后类型: buildRows('售后类型'),
  处理方式: buildRows('处理方式'),
  保修政策: buildRows('保修政策'),
  'SLA 规则': buildRows('SLA 规则'),
});
const activeKey = ref<SettingKey>(normalizeSettingKey(route.query.setting || route.query.action || props.initialKey));
const keyword = ref('');
const stateFilter = ref('');
const filterOpen = ref(false);
const fieldOpen = ref(false);
const editorOpen = ref(false);
const editingId = ref('');
const message = ref('');
const selectedIds = ref<string[]>([]);
const standardScopes = ['售后发起', '售后处理', '质量闭环', '全部场景'];
const editor = reactive({
  name: '',
  code: '自动生成',
  type: '售后发起',
  state: '启用' as '启用' | '停用',
});

const afterSalesStrategyTabs = ref<StrategyTab[]>([
  {
    key: 'service',
    label: '售后单策略',
    rows: [
      {
        key: 'serviceAudit',
        title: '售后单审核',
        sub: '售后单提交后是否进入审核，审核通过后才生成任务池和派生单据。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'serviceAuditFlow', title: '审核流程', sub: '选择售后单提交后使用的审核流程。', type: 'select', value: '售后主管审核流程', options: ['售后主管审核流程', '客户退款审核流程', '质量问题审核流程'] },
          { key: 'rejectHandling', title: '驳回处理', sub: '审核驳回或退回修改时，售后单回到发起人草稿还是保留待审核。', type: 'select', value: '退回发起人修改', options: ['退回发起人修改', '保留待审核并要求补充说明'] },
        ],
      },
      {
        key: 'derivedDocuments',
        title: '处理方式派生单据',
        sub: '审核通过后是否按处理方式生成退货入库、换货出库、退款、服务派工等单据。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'derivedTiming', title: '生成时点', sub: '控制派生单据在售后审核通过后立即生成，还是由处理人确认后生成。', type: 'select', value: '审核通过后生成', options: ['审核通过后生成', '处理人确认后生成'] },
          { key: 'derivedScope', title: '生成范围', sub: '按处理方式生成必需单据，避免生成无关的仓储、财务或质量单据。', type: 'select', value: '仅生成必需单据', options: ['仅生成必需单据', '必需单据 + 可选质量闭环'] },
        ],
      },
      {
        key: 'serviceClose',
        title: '结单确认',
        sub: '派生单据回写完成后，售后单是否需要内部结单确认。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'closeCondition', title: '结单条件', sub: '控制哪些派生单据完成后允许售后单进入待结单。', type: 'select', value: '必需派生单据全部完成', options: ['必需派生单据全部完成', '仓储和财务完成即可'] },
          { key: 'qualityBlocking', title: '质量闭环影响', sub: '质量闭环是否阻塞售后结单。', type: 'select', value: '不阻塞售后结单', options: ['不阻塞售后结单', '质量关闭后才允许结单'] },
        ],
      },
    ],
  },
  {
    key: 'task',
    label: '任务处理策略',
    rows: [
      {
        key: 'taskAssign',
        title: '任务池指派',
        sub: '派生单据进入任务池后，是否限制批量指派和责任人分配规则。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'assignMode', title: '指派方式', sub: '按单据类型分配给仓储、财务、服务或质量责任组。', type: 'select', value: '按派生单据类型指派', options: ['按派生单据类型指派', '按售后负责人统一指派'] },
          { key: 'unassignedVisibility', title: '未指派可见性', sub: '未指派任务是否允许处理人自行领取。', type: 'select', value: '仅主管可见', options: ['仅主管可见', '对应部门人员可领取'] },
        ],
      },
      {
        key: 'taskAdvance',
        title: '推进处理',
        sub: '处理人推进派生单据时是否校验当前状态和回写售后单。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'advanceCondition', title: '推进条件', sub: '防止已完成或无需处理的派生单据重复推进。', type: 'select', value: '仅待处理/处理中可推进', options: ['仅待处理/处理中可推进', '允许主管强制推进'] },
          { key: 'writebackMode', title: '回写方式', sub: '派生单据推进后如何更新售后单仓储、财务、发票和结单状态。', type: 'select', value: '实时回写售后状态', options: ['实时回写售后状态', '人工确认后回写'] },
        ],
      },
      {
        key: 'slaWarning',
        title: 'SLA 预警',
        sub: '根据售后单 SLA 和任务截止时间，是否提示超时或临期任务。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'warningTime', title: '预警时点', sub: '任务到期前多久提醒负责人。', type: 'select', value: '到期前 2 小时', options: ['到期前 2 小时', '到期前 4 小时', '到期前 1 天'] },
          { key: 'timeoutEscalation', title: '超时升级', sub: '任务超时后是否升级给售后主管。', type: 'select', value: '提醒售后主管', options: ['提醒售后主管', '提醒主管并锁定结单'] },
        ],
      },
    ],
  },
  {
    key: 'quality',
    label: '质量闭环策略',
    rows: [
      {
        key: 'qualityEscalation',
        title: '升级质量闭环',
        sub: '售后单是否允许升级为质量闭环，并保留来源售后单和派生单据链路。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'qualityTrigger', title: '升级触发', sub: '控制由人工升级，还是按投诉问题或质量原因自动提示。', type: 'select', value: '人工确认升级', options: ['人工确认升级', '质量类投诉自动提示'] },
          { key: 'qualityOwner', title: '责任部门', sub: '质量闭环生成后默认指派给哪个责任部门。', type: 'select', value: '质量部', options: ['质量部', '售后主管', '质量 + 研发联合小组'] },
        ],
      },
      {
        key: 'qualityAdvance',
        title: '质量阶段推进',
        sub: '质量闭环从 D1、D4、CAPA 到验证关闭时是否限制阶段顺序。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'stageSequence', title: '阶段顺序', sub: '控制是否必须按 8D/CAPA 顺序推进。', type: 'select', value: '按阶段顺序推进', options: ['按阶段顺序推进', '允许主管跳转阶段'] },
          { key: 'closeEvidence', title: '关闭依据', sub: '关闭质量闭环前是否要求验证记录。', type: 'select', value: '必须有验证记录', options: ['必须有验证记录', '允许填写关闭说明'] },
        ],
      },
    ],
  },
]);
const defaultAfterSalesStrategyTabs = afterSalesStrategyTabs.value.map((tab) => ({
  ...tab,
  rows: cloneStrategyRows(tab.rows),
}));

const activeSettingTreeKey = computed(() => (isStrategySetting.value ? '策略设置' : activeKey.value));
const currentConfig = computed(() => dictConfigs[activeKey.value]);
const currentTitle = computed(() => activeKey.value);
const currentRows = computed(() => rowsByKey[activeKey.value]);
const treeItems = computed(() => [
  ...(Object.keys(dictConfigs) as SettingKey[]).map((key) => ({
    key,
    label: key,
    count: rowsByKey[key].length,
    icon: 'line-doc',
  })),
  {
    key: '策略设置',
    label: '策略设置',
    count: afterSalesStrategyTabs.value.reduce((total, tab) => total + tab.rows.length, 0),
    icon: 'line-doc',
  },
]);
const filteredRows = computed(() => {
  const term = keyword.value.trim();
  return currentRows.value.filter((row) => {
    const keywordMatched = !term || [row.code, row.name, row.type, row.owner, row.linkage].some((value) => value.includes(term));
    const stateMatched = !stateFilter.value || row.state === stateFilter.value;
    return keywordMatched && stateMatched;
  });
});
const allChecked = computed(() => filteredRows.value.length > 0 && filteredRows.value.every((row) => selectedIds.value.includes(row.id)));

watch(
  () => [route.query.setting, route.query.action, props.initialKey] as const,
  () => {
    const nextKey = normalizeSettingKey(route.query.setting || route.query.action || props.initialKey);
    if (nextKey !== activeKey.value) {
      selectDictionary(nextKey);
    }
  },
);

function buildRows(key: SettingKey) {
  return dictConfigs[key].rows.map((row, index) => ({
    id: `${key}_${row.code}`,
    code: row.code,
    name: row.name,
    type: row.scene,
    state: '启用' as const,
    owner: index % 2 ? '李文涛' : '老夏',
    date: `2026-05-${String(12 + index).padStart(2, '0')}`,
    required: row.required,
    linkage: row.linkage,
  }));
}

function normalizeSettingKey(value: unknown): SettingKey {
  const key = String(value || '');
  return Object.prototype.hasOwnProperty.call(dictConfigs, key) ? key as SettingKey : '售后原因';
}

function selectDictionary(key: string) {
  if (strategySettingKeys.includes(key)) {
    router.replace({ path: route.path, query: { ...route.query, setting: 'strategies' } });
    keyword.value = '';
    stateFilter.value = '';
    selectedIds.value = [];
    closeEditor();
    return;
  }
  activeKey.value = normalizeSettingKey(key);
  keyword.value = '';
  stateFilter.value = '';
  selectedIds.value = [];
  closeEditor();
}

function refreshRows() {
  rowsByKey[activeKey.value] = buildRows(activeKey.value);
  selectedIds.value = [];
  showMessage(`${currentTitle.value}已刷新`);
}

function openCreate() {
  editingId.value = '';
  editor.name = currentConfig.value.rows[0]?.name || '';
  editor.code = '自动生成';
  editor.type = '售后发起';
  editor.state = '启用';
  editorOpen.value = true;
}

function openEdit(row: DictTableRow) {
  editingId.value = row.id;
  editor.name = row.name;
  editor.code = row.code;
  editor.type = row.type;
  editor.state = row.state;
  editorOpen.value = true;
}

function saveEditor() {
  if (!editor.name.trim()) return;
  const rows = rowsByKey[activeKey.value];
  const existing = rows.find((row) => row.id === editingId.value);
  if (existing) {
    existing.name = editor.name.trim();
    existing.type = editor.type;
    existing.state = editor.state;
    existing.date = '2026-05-29';
    showMessage(`${currentTitle.value}已保存`);
  } else {
    const code = nextCode(activeKey.value);
    rows.unshift({
      id: `${activeKey.value}_${code}`,
      code,
      name: editor.name.trim(),
      type: editor.type,
      state: editor.state,
      owner: '老夏',
      date: '2026-05-29',
      required: '是',
      linkage: '按配置联动售后流程',
    });
    showMessage(`${currentConfig.value.addLabel}已保存`);
  }
  closeEditor();
}

function nextCode(key: SettingKey) {
  const prefixMap: Record<SettingKey, string> = {
    售后原因: 'REASON',
    投诉问题: 'COMP',
    售后类型: 'TYPE',
    处理方式: 'ACTION',
    保修政策: 'WARRANTY',
    'SLA 规则': 'SLA',
  };
  return `${prefixMap[key]}-${String(rowsByKey[key].length + 1).padStart(3, '0')}`;
}

function closeEditor() {
  editorOpen.value = false;
  editingId.value = '';
}

function toggleRow(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id];
}

function toggleAll() {
  selectedIds.value = allChecked.value ? [] : filteredRows.value.map((row) => row.id);
}

function toggleState(row: DictTableRow) {
  const nextState = row.state === '启用' ? '停用' : '启用';
  if (!window.confirm(`确认${nextState}${currentTitle.value}「${row.name}」吗？该配置会影响售后新增、详情展示或后续联动。`)) return;
  row.state = nextState;
  row.date = '2026-05-29';
  showMessage(`${row.name}已${nextState}`);
}

function batchState(state: '启用' | '停用') {
  if (!selectedIds.value.length) {
    showMessage(`请先选择要${state}的配置项`);
    return;
  }
  if (!window.confirm(`确认批量${state}${selectedIds.value.length}项${currentTitle.value}配置吗？`)) return;
  currentRows.value.forEach((row) => {
    if (selectedIds.value.includes(row.id)) {
      row.state = state;
      row.date = '2026-05-29';
    }
  });
  showMessage(`已批量${state}${selectedIds.value.length}项`);
}

function showMessage(text: string) {
  message.value = text;
}

function updateAfterSalesStrategyRule(tabKey: string, nextRule: StrategyRule) {
  const tab = afterSalesStrategyTabs.value.find((item) => item.key === tabKey);
  if (!tab) return;
  tab.rows = updateStrategyRows(tab.rows, nextRule);
}

function cloneStrategyRows(rows: StrategyRule[]): StrategyRule[] {
  return rows.map((row) => ({
    ...row,
    options: row.options ? [...row.options] : undefined,
    children: row.children ? cloneStrategyRows(row.children) : undefined,
  }));
}

function updateStrategyRows(rows: StrategyRule[], nextRule: StrategyRule): StrategyRule[] {
  return rows.map((row) => {
    if (row.key === nextRule.key) return { ...row, ...nextRule };
    if (!row.children?.length) return row;
    return {
      ...row,
      children: updateStrategyRows(row.children, nextRule),
    };
  });
}

function resetAfterSalesStrategies() {
  if (!window.confirm('确认重置售后策略设置吗？重置后当前未保存内容会被覆盖。')) return;
  afterSalesStrategyTabs.value = defaultAfterSalesStrategyTabs.map((tab) => ({
    ...tab,
    rows: cloneStrategyRows(tab.rows),
  }));
  showMessage('已恢复售后默认策略。');
}

function saveAfterSalesStrategies() {
  afterSalesStrategyTabs.value = afterSalesStrategyTabs.value.map((tab) => ({
    ...tab,
    rows: cloneStrategyRows(tab.rows),
  }));
  showMessage('售后策略设置已保存。');
}

function goBack() {
  router.push(props.backPath);
}
</script>

<style scoped>
:deep(.as-setting-single.aw-setting-split) {
  grid-template-columns: minmax(0, 1fr);
}

.as-setting-main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.as-setting-list-toolbar {
  align-items: flex-start;
  flex-wrap: wrap;
}

.as-setting-toolbar-left {
  flex: 1 1 520px;
  align-items: center;
  flex-wrap: wrap;
}

.as-setting-list-toolbar .aw-toolbar-right {
  flex: 1 1 520px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.as-setting-search {
  width: 330px;
  flex: none;
}

.as-setting-filter {
  height: 32px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
}

.as-setting-table {
  min-width: 990px;
}

.as-setting-empty {
  height: 88px;
  text-align: center;
  color: var(--aw-fg-3);
}

.as-setting-message {
  padding: 9px 12px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  background: var(--aw-surface-2);
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-doc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
}

.as-editor-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.as-setting-field-modal {
  width: min(520px, calc(100vw - 56px));
}

.as-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
}

@media (max-width: 980px) {
  .as-setting-search,
  .as-setting-list-toolbar .aw-toolbar-right > .aw-btn,
  .as-setting-list-toolbar .aw-toolbar-right > .aw-tool-btn,
  .as-setting-list-toolbar .aw-toolbar-right > .aw-refresh-action,
  .as-setting-filter {
    width: 100%;
  }

  .aw-doc-grid,
  .as-editor-grid,
  .as-field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
