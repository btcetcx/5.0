<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AwDataTable from '@/components/list-page/AwDataTable.vue';
import AwListPage from '@/components/list-page/AwListPage.vue';
import AwListToolbar from '@/components/list-page/AwListToolbar.vue';
import AwResourceTree from '@/components/list-page/AwResourceTree.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwEditableSubTable from '@/components/form-page/AwEditableSubTable.vue';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwLineDetailSection from '@/components/form-page/AwLineDetailSection.vue';
import AwSearchTriggerInput from '@/components/form-page/AwSearchTriggerInput.vue';
import AwUnitPickerInput from '@/components/form-page/AwUnitPickerInput.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import AwAuditActionModal from '@/components/detail-page/AwAuditActionModal.vue';
import AwAfterSalesOpinionModal from '@/components/detail-page/AwAfterSalesOpinionModal.vue';
import AwSettingPage from '@/components/setting-page/AwSettingPage.vue';
import AwSettingToolbar from '@/components/setting-page/AwSettingToolbar.vue';
import AwSettingModal from '@/components/setting-page/AwSettingModal.vue';
import AwPersonPickerModal from '@/components/setting-page/AwPersonPickerModal.vue';
import AwSourcePickerModal from '@/components/form-page/AwSourcePickerModal.vue';
import AwCategoryPickerModal from '@/components/form-page/AwCategoryPickerModal.vue';
import type { AwTableColumn, AwTreeNode } from '@/components/list-page/types';
import type { AttachmentRow, CategoryPickerGroup, EditableColumn, SourcePickerBatch, SourcePickerRow } from '@/components/form-page/types';
import type { AuditApprovalNode, AuditDocumentSummary, DetailTabItem } from '@/components/detail-page/types';
import type { PersonPickerDept } from '@/components/setting-page/types';
import { afterSalesHandlingSettings } from '@/app/api/after-sales/dictionaries';
import { afterSalesMethodDocumentMap } from '@/app/api/after-sales/resources';

type TemplateItem = {
  name: string;
  source: string;
  usage: string;
  notes: string;
};

type TemplateCategory = {
  key: string;
  title: string;
  desc: string;
  items: TemplateItem[];
};

const categories: TemplateCategory[] = [
  {
    key: 'list',
    title: '列表页母版',
    desc: '用于所有业务列表，包含三段式结构、分类树、工具栏、表格、批量区和分页区。',
    items: [
      { name: '带分类树列表页', source: 'components/list-page/AwListPage.vue + AwResourceTree.vue', usage: '供应商、客户、文档、售后单等需要左侧分类/状态树的列表。', notes: '分类树节点必须来自本栏目的分类/分组设置；存在二级分类时默认展开二级，层级分明；工具栏、表格、底部分页保持三段式。' },
      { name: '无分类树列表页', source: 'components/list-page/AwListPage.vue', usage: '请购、询价、订单等不需要分类树的列表。', notes: '只移除 tree 插槽，主表格结构不变。' },
      { name: '列表工具栏', source: 'components/list-page/AwListToolbar.vue', usage: '搜索、刷新、筛选、字段配置、导入、导出、新增。', notes: '新增按钮文案可变，按钮顺序不私改。' },
      { name: '数据表格', source: 'components/list-page/AwDataTable.vue', usage: '业务列表主体、底部全选、批量操作、分页。', notes: '字段多才横向滚动，短表用 fitWidth。' },
    ],
  },
  {
    key: 'form',
    title: '新增/编辑母版',
    desc: '用于新增、编辑、提交审批类页面，承接顶部返回/操作区、表单卡片、明细表、附件和富文本。',
    items: [
      { name: '标准新增页', source: 'components/form-page/AwFormPage.vue', usage: '客户、供应商、订单、售后单等新增入口。', notes: '顶部按钮区沿用母版，字段按 JSX/契约替换。' },
      { name: '物品明细容器', source: 'components/form-page/AwLineDetailSection.vue', usage: '仓储入库、出库、调拨、盘点等新增/编辑页的明细区外层容器。', notes: '统一承载标题、表格滚动区、顶部工具区、底部新增明细按钮；业务页只传列、行、单元格和选择器逻辑。' },
      { name: '可编辑明细表', source: 'components/form-page/AwEditableSubTable.vue', usage: '产品明细、订单明细、工艺路线、售后处理产品。', notes: '序号由母版生成，不重复做业务序号列。' },
      { name: '附件表格', source: 'components/form-page/AwAttachmentTable.vue', usage: '所有新增/编辑页的附件区，包含附件名称、附件类型、上传日期、备注、上传/删除和新增附件。', notes: '附件列顺序、控件类型和按钮位置固定；业务页只传附件类型选项和数据。' },
      { name: '富文本编辑', source: 'components/form-page/AwRichTextEditor.vue', usage: '备注、说明、正文、处理结论。', notes: '只作为内容区，不用它承载结构控件。' },
      { name: '付款条件卡片', source: 'components/form-page/AwPaymentTermCards.vue', usage: '报价、合同、订单等付款计划。', notes: '用于财务条款，不替代表格明细。' },
    ],
  },
  {
    key: 'detail',
    title: '详情页母版',
    desc: '用于查看主单、关联单据、状态流转、操作记录和 Tab 明细。',
    items: [
      { name: '标准详情页', source: 'components/detail-page/AwDetailPage.vue', usage: '客户、订单、采购、生产、售后主单详情。', notes: '详情顶部、Tab、信息块保持统一。' },
      { name: '详情头部', source: 'components/detail-page/AwDetailHeader.vue', usage: '显示标题、编号、状态、创建/负责人等摘要。', notes: '状态展示统一使用母版样式。' },
      { name: '详情工具栏', source: 'components/detail-page/AwDetailToolbar.vue', usage: '返回、编辑、删除、提交、关闭等操作。', notes: '危险动作使用 danger，不新增私有按钮样式。' },
      { name: '详情 Tab', source: 'components/detail-page/AwDetailTabs.vue', usage: '基本信息、明细、关联单据、操作记录。', notes: 'Tab 只换业务内容，不换交互结构。' },
    ],
  },
  {
    key: 'setting',
    title: '设置页母版',
    desc: '用于自定义字段、编号、审批、策略、打印和字典设置。',
    items: [
      { name: '设置页壳', source: 'components/setting-page/AwSettingPage.vue', usage: '所有中心设置页的统一容器。', notes: '不允许另起 settings 私有页面结构。' },
      { name: '自定义字段', source: 'components/setting-page/AwFieldSettingPage.vue', usage: '字段配置、显示位置、必填、启用、权限。', notes: '弹窗结构和开关展示必须跟客户管理一致。' },
      { name: '自定义编号', source: 'components/setting-page/AwCodeRuleBuilder.vue', usage: '编号项选择、拖拽排序、预览。', notes: '只替换资源名称和候选项。' },
      { name: '审批设置', source: 'components/setting-page/AwApprovalRuleEditor.vue', usage: '流程名称、审批节点、审批人、审批方式。', notes: '节点卡片、人员选择器、回填、计数都走公共组件。' },
      { name: '策略设置', source: 'components/setting-page/AwStrategySettingPage.vue', usage: '业务规则开关、下拉策略、分 Tab 设置。', notes: '选项内容按模块变，结构不变。' },
    ],
  },
  {
    key: 'modal',
    title: '弹窗/选择器',
    desc: '用于负责人、客户、产品、来源单据、配置新增等选择和维护。',
    items: [
      { name: '人员选择器', source: 'components/setting-page/AwPersonPickerModal.vue', usage: '负责人、审批人、授权人员。', notes: '必须支持选择、确认回填、计数和取消。' },
      { name: '通用设置弹窗', source: 'components/setting-page/AwSettingModal.vue', usage: '新增字段、字典项、规则项等轻量弹窗。', notes: '弹窗 DOM/class 统一，不写私有 modal。' },
      { name: '来源单据选择器', source: 'components/form-page/AwSourcePickerModal.vue', usage: '售后单、换货、退货退款等新增页选择订单/项目来源并回填发货批次。', notes: '必须走公共 aw-mask、aw-modal、head/body/foot；支持来源筛选、批次多选、确认回填。' },
      { name: '分类选择器', source: 'components/form-page/AwCategoryPickerModal.vue', usage: '新增/编辑页选择客户分类、供应商分类、文档分类、物料分类等二级分类。', notes: '结构沿用售后流程选择客户弹窗：左侧一级分类，右侧二级分类，确认后回填父级和子级。' },
      { name: '审核动作弹窗', source: 'components/detail-page/AwAuditActionModal.vue', usage: '各类单据详情页的审核通过、驳回、退回修改、转交/加签和结单确认。', notes: '固定单据摘要、处理动作、转交/加签人、抄送人、处理意见和右侧页脚按钮。' },
      { name: '售后处理意见弹窗', source: 'components/detail-page/AwAfterSalesOpinionModal.vue', usage: '售后任务、售后详情、工单处理时选择处理方式、填写处理意见并预览后续派生单据。', notes: '处理方式来源于售后设置 - 处理方式；选择后按映射显示入库单、退款单、换货出库单等后续单据。' },
      { name: '客户/产品/来源选择器', source: '各业务资源页内复用同一 modal 结构', usage: '新增页的来源选择、产品选择、客户选择。', notes: '结构必须是统一遮罩、头部、内容、底部按钮。' },
    ],
  },
  {
    key: 'field',
    title: '字段组件',
    desc: '用于表单字段、选择触发字段、字段内图标等可复用输入控件。',
    items: [
      {
        name: '搜索触发输入框',
        source: 'components/form-page/AwSearchTriggerInput.vue',
        usage: '表单内点击搜索图标打开人员、客户、分类、来源单据等选择弹窗。',
        notes: '只做输入框内搜索图标和 open 事件；具体打开哪个弹窗由业务页面决定。',
      },
      {
        name: '单位选择输入框',
        source: 'components/form-page/AwUnitPickerInput.vue + AwUnitPickerModal.vue',
        usage: '产品标准单位、销售单位、采购单位、库存单位等字段。',
        notes: '保留搜索、分类、最近使用、单位卡片、确认回填、自定义单位和单位管理入口。',
      },
    ],
  },
  {
    key: 'base',
    title: '基础组件/壳',
    desc: '用于工作台、页面容器、数据表、筛选条等基础展示。',
    items: [
      { name: 'ERP 顶层壳', source: 'layouts/erp-shell/*', usage: '顶部一级导航、左侧二级导航和浮窗。', notes: '中心入口和浮窗严格按 JSX/规划配置。' },
      { name: '工作台组件', source: 'components/workbench/*', usage: 'KPI、快捷入口、中心工作台。', notes: '只换业务指标，不换布局体系。' },
      { name: '页面壳', source: 'components/page-shell/PageShell.vue', usage: '普通页面外层结构。', notes: '用于非列表/表单/详情的辅助页。' },
      { name: '契约表格', source: 'components/data-table/ContractTable.vue', usage: '契约说明和预留资源页。', notes: '业务正式页优先用 AwDataTable。' },
    ],
  },
];

const route = useRoute();
const routeCategory = computed(() => {
  const param = route.params.category;
  if (typeof param === 'string') return param;
  if (typeof route.query.category === 'string') return route.query.category;
  return '';
});
const initialCategory = categories.some((category) => category.key === routeCategory.value)
  ? routeCategory.value
  : categories[0].key;
const activeCategory = ref(initialCategory);
const activeTab = ref('base');
const previewTreeKey = ref('all');
const showPersonPicker = ref(false);
const showSettingModal = ref(false);
const showSourcePicker = ref(false);
const showCategoryPicker = ref(false);
const showAuditActionModal = ref(false);
const showAfterSalesOpinionModal = ref(false);
const searchTriggerValue = ref('重点客户');
const unitPickerValue = ref('台');

const currentCategory = computed(() => categories.find((category) => category.key === activeCategory.value) || categories[0]);

watch(
  routeCategory,
  (category) => {
    if (typeof category === 'string' && categories.some((item) => item.key === category)) {
      activeCategory.value = category;
    }
  },
);

const treeNodes: AwTreeNode[] = [
  { key: 'all', label: '全部客户', count: 128, level: 2, icon: 'line-users' },
  { key: 'customer-group-root', label: '客户分组设置', count: 128, level: 2, open: true, icon: 'line-folder', disabled: true },
  { key: 'vip', label: '重点客户', count: 32, level: 3, icon: 'line-node' },
  { key: 'normal', label: '普通客户', count: 96, level: 3, icon: 'line-node' },
  { key: 'industry-root', label: '行业分类设置', count: 128, level: 2, open: true, icon: 'line-folder', disabled: true },
  { key: 'manufacturing', label: '制造业', count: 72, level: 3, icon: 'line-node' },
  { key: 'channel', label: '渠道客户', count: 36, level: 3, icon: 'line-node' },
  { key: 'project', label: '项目客户', count: 20, level: 3, icon: 'line-node' },
];

const tableColumns: AwTableColumn[] = [
  { key: 'name', title: '客户名称', link: true, width: 180 },
  { key: 'code', title: '客户编号', width: 150 },
  { key: 'owner', title: '负责人', width: 120 },
  { key: 'status', title: '客户状态', width: 130, filterOptions: ['启用', '停用'] },
  { key: 'action', title: '操作', fixed: 'right', width: 120 },
];

const tableRows = [
  { id: '1', name: '海南微为智造产业有限公司', code: 'CUS-202605001', owner: '老夏', status: '启用', action: '查看' },
  { id: '2', name: '深圳市启明科技有限公司', code: 'CUS-202605002', owner: '张国', status: '启用', action: '查看' },
  { id: '3', name: '广州智造电子', code: 'CUS-202605003', owner: '李文涛', status: '停用', action: '查看' },
];

const editableColumns: EditableColumn[] = [
  { key: 'product', title: '产品名称', width: 180 },
  { key: 'qty', title: '数量', width: 100 },
  { key: 'date', title: '交付日期', width: 140 },
  { key: 'remark', title: '备注', width: 180 },
];

const editableRows = ref([
  { id: '1', product: '智能温控终端', qty: 20, date: '2026-06-10', remark: '首批交付' },
  { id: '2', product: '铝合金外壳', qty: 80, date: '2026-06-18', remark: '随单发货' },
]);

const attachmentRows = ref<AttachmentRow[]>([
  { id: '1', name: '设计图纸', type: '技术文档', date: '2026-05-30', remark: '' },
]);

const detailTabs: DetailTabItem[] = [
  { key: 'base', label: '基本信息' },
  { key: 'docs', label: '关联单据' },
  { key: 'logs', label: '操作记录' },
];

const auditDocument: AuditDocumentSummary = {
  title: '售后退款退货申请',
  code: 'AS-20260530001',
  status: '待审核',
  applicant: '老夏',
  flowName: '客户建档审批流程',
  currentNode: '财务审批',
};

const auditApprovalNodes: AuditApprovalNode[] = [
  {
    name: '资料提交',
    approver: '老夏',
    method: '顺签',
    state: 'done',
    result: '已提交',
  },
  {
    name: '销售主管审批',
    approver: '老夏',
    method: '顺签',
    state: 'done',
    result: '审核通过',
    time: '2026-05-30 10:18',
    opinion: '客户资料和售后来源已核验，建议继续财务复核。',
  },
  {
    name: '财务审批',
    approver: '陈思源',
    method: '或签',
    state: 'current',
    result: '待处理',
  },
  {
    name: '总经理复核',
    approver: '老大',
    method: '会签',
    state: 'pending',
    result: '待审核',
  },
  {
    name: '归档确认',
    approver: '系统',
    method: '自动',
    state: 'pending',
    result: '待归档',
  },
];

const pickerDepts: PersonPickerDept[] = [
  {
    key: 'sales',
    label: '销售中心',
    persons: [
      { id: 'XS001', name: '老夏', role: '销售经理', phone: '13888888888' },
      { id: 'XS002', name: '李文涛', role: '销售主管', phone: '13700137003' },
    ],
  },
  {
    key: 'finance',
    label: '财务中心',
    persons: [
      { id: 'CW001', name: '王会计', role: '财务', phone: '13666666666' },
    ],
  },
];

const sourcePickerRows: SourcePickerRow[] = [
  {
    cat: '订单',
    code: 'SO-20260530001',
    subject: '智能温控终端销售订单',
    date: '2026-05-30',
    customer: '海南微为智造产业有限公司',
    maxQty: 60,
    maxRefund: '156000.00',
  },
  {
    cat: '项目',
    code: 'PJ-20260522003',
    subject: '仓储自动化改造项目',
    date: '2026-05-22',
    customer: '海南微为智造产业有限公司',
    maxQty: 40,
    maxRefund: '98000.00',
  },
];

const sourcePickerBatches: Record<string, SourcePickerBatch[]> = {
  'SO-20260530001': [
    {
      deliveryNo: 'OUT-20260530001',
      detailNo: 'OUT-D-001',
      deliveryDate: '2026-05-30',
      warehouse: '成品仓',
      logistics: '顺丰',
      qty: 20,
      amount: '52000.00',
      status: '已发货',
    },
    {
      deliveryNo: 'OUT-20260530002',
      detailNo: 'OUT-D-002',
      deliveryDate: '2026-05-31',
      warehouse: '成品仓',
      logistics: '德邦',
      qty: 40,
      amount: '104000.00',
      status: '待签收',
    },
  ],
  'PJ-20260522003': [
    {
      deliveryNo: 'OUT-PJ-20260522001',
      detailNo: 'OUT-PJ-D-001',
      deliveryDate: '2026-05-26',
      warehouse: '项目仓',
      logistics: '专车',
      qty: 40,
      amount: '98000.00',
      status: '已交付',
    },
  ],
};

const categoryPickerGroups: CategoryPickerGroup[] = [
  {
    key: 'customer-group',
    label: '客户分组',
    icon: 'line-users',
    count: 128,
    children: [
      { key: 'vip', label: '重点客户', code: 'CUS-G-001', desc: '高价值客户、战略客户、重点跟进对象', count: 32 },
      { key: 'normal', label: '普通客户', code: 'CUS-G-002', desc: '常规交易客户', count: 96 },
    ],
  },
  {
    key: 'industry',
    label: '行业分类',
    icon: 'line-folder',
    count: 128,
    children: [
      { key: 'manufacturing', label: '制造业', code: 'IND-001', desc: '生产制造、设备制造、电子制造客户', count: 72 },
      { key: 'channel', label: '渠道客户', code: 'IND-002', desc: '代理、分销、渠道合作客户', count: 36 },
      { key: 'project', label: '项目客户', code: 'IND-003', desc: '按项目交付和验收管理的客户', count: 20 },
    ],
  },
  {
    key: 'region',
    label: '区域分类',
    icon: 'line-node',
    count: 128,
    children: [
      { key: 'south', label: '华南区域', code: 'REG-001', desc: '广东、广西、海南客户', count: 52 },
      { key: 'east', label: '华东区域', code: 'REG-002', desc: '上海、江苏、浙江、安徽客户', count: 48 },
    ],
  },
];

function addPreviewAttachment() {
  attachmentRows.value.push({ id: String(Date.now()), name: '', type: '技术文档', date: '2026-05-30', remark: '' });
}

function addPreviewDetail() {
  editableRows.value.push({ id: String(Date.now()), product: '新增物品', qty: 1, date: '2026-06-20', remark: '' });
}

function removePreviewAttachment(row: AttachmentRow) {
  if (attachmentRows.value.length <= 1) return;
  attachmentRows.value = attachmentRows.value.filter((item) => item.id !== row.id);
}
</script>

<template>
  <div class="aw-template-gallery">
    <section class="aw-gallery-head">
      <div>
        <h1>母版与公共组件库</h1>
        <p>这里集中展示已经提取并可复用的 Vue3 母版和公共组件。后续模块只指定母版名称，业务字段和数据按模块替换。</p>
      </div>
      <div class="aw-gallery-rule">
        <strong>使用规则</strong>
        <span>先选母版，再填字段；不新增私有结构；不确定先确认。</span>
      </div>
    </section>

    <section class="aw-gallery-layout">
      <aside class="aw-gallery-nav">
        <button
          v-for="category in categories"
          :key="category.key"
          :class="{ on: activeCategory === category.key }"
          type="button"
          @click="activeCategory = category.key"
        >
          {{ category.title }}
        </button>
      </aside>

      <main class="aw-gallery-main">
        <section class="aw-gallery-section">
          <div class="aw-gallery-section-head">
            <h2>{{ currentCategory.title }}</h2>
            <p>{{ currentCategory.desc }}</p>
          </div>
          <div class="aw-component-grid">
            <article v-for="item in currentCategory.items" :key="item.name" class="aw-component-card">
              <h3>{{ item.name }}</h3>
              <dl>
                <dt>源码</dt>
                <dd>{{ item.source }}</dd>
                <dt>适用</dt>
                <dd>{{ item.usage }}</dd>
                <dt>约束</dt>
                <dd>{{ item.notes }}</dd>
              </dl>
            </article>
          </div>
        </section>

        <section class="aw-gallery-section">
          <div class="aw-gallery-section-head">
            <h2>真实组件预览</h2>
            <p>下面直接渲染项目公共组件，用于确认母版结构和交互位置。</p>
          </div>

          <div class="aw-preview-stack">
            <div v-if="activeCategory === 'field'" class="aw-preview-block">
              <h3>搜索触发输入框</h3>
              <div class="aw-gallery-field-preview">
                <label>
                  <span>分类字段</span>
                  <AwSearchTriggerInput
                    v-model="searchTriggerValue"
                    placeholder="点击搜索图标打开弹窗"
                    readonly
                    @open="showCategoryPicker = true"
                  />
                </label>
                <label>
                  <span>单位字段</span>
                  <AwUnitPickerInput v-model="unitPickerValue" placeholder="请选择单位" />
                </label>
              </div>
            </div>

            <div v-if="activeCategory !== 'field'" class="aw-preview-block">
              <h3>带分类树列表页母版</h3>
              <AwListPage>
                <template #tree>
                  <AwResourceTree
                    v-model="previewTreeKey"
                    title="客户分类"
                    source-text="来源：客户管理 - 分类/分组设置"
                    :total="128"
                    :nodes="treeNodes"
                  />
                </template>
                <AwListToolbar search-placeholder="全局搜索（如客户名称、客户编号、负责人）" create-label="新增客户" />
                <AwDataTable :columns="tableColumns" :rows="tableRows" :total="128" fit-width />
              </AwListPage>
            </div>

            <div v-if="activeCategory !== 'field'" class="aw-preview-block">
              <h3>标准新增页 + 明细表母版</h3>
              <AwFormPage
                back-text="返回列表"
                :actions="[
                  { key: 'save', label: '暂存' },
                  { key: 'submit', label: '提交', primary: true },
                ]"
              >
                <section class="aw-form-card">
                  <h4>基本信息</h4>
                  <div class="aw-gallery-form-grid">
                    <label><span>单据名称</span><input value="售后退款退货申请" /></label>
                    <label><span>负责人</span><input value="老夏" /></label>
                    <label><span>业务状态</span><select><option>待提交</option></select></label>
                  </div>
                </section>
                <AwLineDetailSection title="物品明细" add-text="+ 新增物品" :table-wrap="false" @add="addPreviewDetail">
                  <AwEditableSubTable :columns="editableColumns" :rows="editableRows" add-text="+ 新增明细" :show-add="false">
                    <template #cell="{ column, row }">
                      <span>{{ row[column.key] }}</span>
                    </template>
                    <template #actions>
                      <button class="aw-link-btn" type="button">删除</button>
                    </template>
                  </AwEditableSubTable>
                </AwLineDetailSection>
                <section class="aw-form-card">
                  <h4>附件</h4>
                  <AwAttachmentTable
                    :rows="attachmentRows"
                    @add="addPreviewAttachment"
                    @remove="removePreviewAttachment"
                  />
                </section>
              </AwFormPage>
            </div>

            <div v-if="activeCategory !== 'field'" class="aw-preview-block">
              <h3>详情页 + Tab 母版</h3>
              <AwDetailPage>
                <template #toolbar>
                  <AwDetailToolbar :actions="[{ key: 'edit', label: '编辑' }, { key: 'close', label: '关闭', danger: true }]" />
                </template>
                <template #header>
                  <AwDetailHeader
                    title="客户设备异常处理"
                    code="SH-20260530001"
                    status-text="处理中"
                    status-tone="warning"
                    :metas="[
                      { label: '客户', value: '海南微为智造产业有限公司' },
                      { label: '负责人', value: '老夏' },
                    ]"
                  />
                </template>
                <section class="aw-form-card">
                  <AwDetailInfoGrid
                    :items="[
                      { label: '来源订单', value: 'SO-20260530001' },
                      { label: '关联入库单', value: 'IN-AS-20260530001' },
                      { label: '关联付款单', value: 'PAY-20260530001' },
                    ]"
                  />
                </section>
                <AwDetailTabs v-model="activeTab" :tabs="detailTabs">
                  <section class="aw-form-card aw-gallery-tab-panel">当前 Tab：{{ activeTab }}</section>
                </AwDetailTabs>
              </AwDetailPage>
            </div>

            <div v-if="activeCategory !== 'field'" class="aw-preview-block">
              <h3>设置页工具栏与弹窗母版</h3>
              <AwSettingPage>
                <template #toolbar>
                  <AwSettingToolbar add-text="新增配置" back-text="返回业务列表" show-add @add="showSettingModal = true" />
                </template>
                <section class="aw-form-card">
                  <div class="aw-setting-sample">
                    <button class="aw-btn primary" type="button" @click="showPersonPicker = true">打开人员选择器</button>
                    <button class="aw-tool-btn" type="button" @click="showSettingModal = true">打开通用弹窗</button>
                    <button class="aw-tool-btn" type="button" @click="showSourcePicker = true">打开来源选择器</button>
                    <button class="aw-tool-btn" type="button" @click="showCategoryPicker = true">打开分类选择器</button>
                    <button class="aw-tool-btn" type="button" @click="showAuditActionModal = true">打开审核动作弹窗</button>
                    <button class="aw-tool-btn" type="button" @click="showAfterSalesOpinionModal = true">打开售后处理意见弹窗</button>
                  </div>
                </section>
              </AwSettingPage>
            </div>
          </div>
        </section>
      </main>
    </section>

    <AwPersonPickerModal
      :open="showPersonPicker"
      title="选择负责人"
      :depts="pickerDepts"
      @cancel="showPersonPicker = false"
      @confirm="showPersonPicker = false"
    />

    <AwSettingModal
      :open="showSettingModal"
      title="新增配置"
      width="720px"
      @cancel="showSettingModal = false"
      @confirm="showSettingModal = false"
    >
      <div class="aw-gallery-form-grid">
        <label><span>配置名称</span><input placeholder="请输入配置名称" /></label>
        <label><span>配置编码</span><input placeholder="自动生成" /></label>
        <label><span>是否启用</span><select><option>启用</option><option>停用</option></select></label>
      </div>
    </AwSettingModal>

    <AwSourcePickerModal
      :open="showSourcePicker"
      title="选择来源"
      current-customer="海南微为智造产业有限公司"
      :rows="sourcePickerRows"
      :batches="sourcePickerBatches"
      @cancel="showSourcePicker = false"
      @confirm="showSourcePicker = false"
    />

    <AwCategoryPickerModal
      :open="showCategoryPicker"
      title="选择分类"
      :groups="categoryPickerGroups"
      @cancel="showCategoryPicker = false"
      @confirm="showCategoryPicker = false"
    />

    <AwAuditActionModal
      :open="showAuditActionModal"
      :document="auditDocument"
      :approval-nodes="auditApprovalNodes"
      @cancel="showAuditActionModal = false"
      @confirm="showAuditActionModal = false"
    />

    <AwAfterSalesOpinionModal
      :open="showAfterSalesOpinionModal"
      :document="auditDocument"
      :methods="afterSalesHandlingSettings"
      :document-map="afterSalesMethodDocumentMap"
      default-method="退款退货"
      @cancel="showAfterSalesOpinionModal = false"
      @confirm="showAfterSalesOpinionModal = false"
    />
  </div>
</template>

<style scoped>
.aw-template-gallery {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 24px;
}

.aw-gallery-head {
  align-items: flex-start;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin-bottom: 18px;
}

.aw-gallery-head h1 {
  font-size: 22px;
  margin: 0 0 8px;
}

.aw-gallery-head p,
.aw-gallery-section-head p {
  color: var(--aw-fg-3);
  font-size: 13px;
  margin: 0;
}

.aw-gallery-rule {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 6px;
  min-width: 260px;
  padding: 14px 16px;
}

.aw-gallery-rule span {
  color: var(--aw-fg-3);
  font-size: 13px;
}

.aw-gallery-layout {
  display: grid;
  gap: 18px;
  grid-template-columns: 180px minmax(0, 1fr);
}

.aw-gallery-nav {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  display: grid;
  gap: 4px;
  padding: 8px;
}

.aw-gallery-nav button {
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--aw-fg-2);
  cursor: pointer;
  height: 36px;
  text-align: left;
}

.aw-gallery-nav button.on {
  background: var(--aw-primary-light);
  color: var(--aw-primary);
  font-weight: 700;
}

.aw-gallery-main {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.aw-gallery-section {
  background: #fff;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 16px;
}

.aw-gallery-section-head {
  border-bottom: 1px solid var(--aw-border);
  margin-bottom: 14px;
  padding-bottom: 12px;
}

.aw-gallery-section-head h2,
.aw-preview-block h3,
.aw-component-card h3 {
  margin: 0;
}

.aw-gallery-section-head h2 {
  font-size: 17px;
  margin-bottom: 6px;
}

.aw-component-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.aw-component-card {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  padding: 14px;
}

.aw-component-card h3,
.aw-preview-block h3 {
  font-size: 15px;
}

.aw-component-card dl {
  display: grid;
  gap: 6px 10px;
  grid-template-columns: 42px minmax(0, 1fr);
  margin: 12px 0 0;
}

.aw-component-card dt {
  color: var(--aw-fg-3);
}

.aw-component-card dd {
  margin: 0;
}

.aw-preview-stack {
  display: grid;
  gap: 16px;
}

.aw-preview-block {
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  overflow: hidden;
  padding: 14px;
}

.aw-preview-block > h3 {
  margin-bottom: 12px;
}

.aw-gallery-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.aw-gallery-form-grid label {
  display: grid;
  gap: 6px;
}

.aw-gallery-form-grid span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

.aw-gallery-form-grid input,
.aw-gallery-form-grid select {
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  height: 34px;
  padding: 0 10px;
}

.aw-link-btn {
  background: transparent;
  border: 0;
  color: var(--aw-primary);
  cursor: pointer;
}

.aw-gallery-tab-panel {
  margin-top: 12px;
}

.aw-setting-sample {
  display: flex;
  gap: 10px;
}

.aw-gallery-field-preview {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(260px, 360px));
  max-width: 760px;
}

.aw-gallery-field-preview label {
  display: grid;
  gap: 8px;
}

.aw-gallery-field-preview span {
  color: var(--aw-fg-2);
  font-size: 13px;
}

@media (max-width: 1100px) {
  .aw-gallery-layout,
  .aw-component-grid,
  .aw-gallery-form-grid {
    grid-template-columns: 1fr;
  }

  .aw-gallery-head {
    display: grid;
  }
}
</style>
