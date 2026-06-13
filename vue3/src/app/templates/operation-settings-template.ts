import type {
  ApprovalMethod,
  ApprovalNode,
  CodeRuleCandidate,
  FieldSettingRow,
  FieldSettingScope,
  SettingTableColumn,
  SettingTableRow,
  StrategyTab,
} from '@/components/setting-page/types';

export type OperationSettingModule =
  | 'rdDocs'
  | 'rdProjects'
  | 'rdProducts'
  | 'rdMaterials'
  | 'rdProcesses'
  | 'rdCrafts'
  | 'rdBoms'
  | 'warehouseStocks'
  | 'warehouseInbounds'
  | 'warehouseOutbounds'
  | 'warehouseTransfers'
  | 'inventoryCounts'
  | 'warehouseLocations'
  | 'productionDemands'
  | 'productionPlans'
  | 'productionOrders'
  | 'productionWorkOrders'
  | 'productionSchedules'
  | 'outsourceOrders';

export type OperationSettingType = 'groups' | 'levels' | 'categories' | 'template' | 'brands' | 'fields' | 'numbers' | 'approvals' | 'strategies' | 'print';

export interface OperationApprovalRuleRow extends SettingTableRow {
  name: string;
  category: string;
  nodes: ApprovalNode[];
  owner: string;
  updatedAt: string;
  enabled: boolean;
}

export interface OperationPrintTemplateRow extends SettingTableRow {
  name: string;
  scene: string;
  paper: string;
  status: string;
  updatedAt: string;
}

export interface OperationExtraSettingList {
  addText: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  columns: SettingTableColumn[];
  rows: SettingTableRow[];
  rootTitle?: string;
  rootAddText?: string;
  defaultRootKey?: string;
  roots?: Array<{ key: string; name: string }>;
}

export interface OperationSettingTemplate {
  module: OperationSettingModule;
  title: string;
  center: 'rd' | 'warehouse' | 'production';
  resource: string;
  backText: string;
  backRoute: string;
  typeTitles: Record<OperationSettingType, string>;
  extraLists?: Partial<Record<'groups' | 'levels' | 'categories' | 'template' | 'brands', OperationExtraSettingList>>;
  fields: {
    addText: string;
    scopes: FieldSettingScope[];
    rows: FieldSettingRow[];
  };
  numbers: {
    prefix: string;
    separator: string;
    selected: string[];
    candidates: CodeRuleCandidate[];
  };
  approvals: {
    addText: string;
    methods: ApprovalMethod[];
    rows: OperationApprovalRuleRow[];
  };
  strategies: {
    title: string;
    description: string;
    tabs: StrategyTab[];
  };
  print: {
    addText: string;
    columns: SettingTableColumn[];
    rows: OperationPrintTemplateRow[];
  };
}

export const operationNumberCandidates: CodeRuleCandidate[] = [
  { key: 'prefix', label: '前缀', preview: 'AA', fixed: true },
  { key: 'y4', label: '年（4位）', preview: '2025', group: 'year' },
  { key: 'y2', label: '年（2位）', preview: '25', group: 'year' },
  { key: 'm', label: '月（2位）', preview: '05' },
  { key: 'd', label: '日（2位）', preview: '15' },
  { key: 's3', label: '流水号（3位）', preview: '001', group: 'seq' },
  { key: 's1', label: '流水号（1位）', preview: '1', group: 'seq' },
  { key: 'cc1', label: '自定义代码1', preview: 'C1', editable: true },
  { key: 'cc2', label: '自定义代码2', preview: 'C2', editable: true },
];

export const operationApprovalMethods: ApprovalMethod[] = [
  { value: '依次审批', desc: '按先后顺序，一人同意才流转到下一人' },
  { value: '会签', desc: '所选人员必须全部审批后进入下一节点' },
  { value: '或签', desc: '选中的人里只要有一人同意即可' },
];

const typeTitles = (name: string): Record<OperationSettingType, string> => ({
  groups: `${name}分组设置`,
  levels: `${name}等级设置`,
  categories: `${name}分类设置`,
  template: `${name}模板设置`,
  brands: `${name}品牌设置`,
  fields: `${name}自定义字段`,
  numbers: `${name}自定义编号`,
  approvals: `${name}审批设置`,
  strategies: `${name}策略设置`,
  print: `设置${name}打印模板`,
});

function fieldRows(prefix: string, base: Array<[string, string, string, string, boolean]>): FieldSettingRow[] {
  return base.map(([name, code, type, scope, required], index) => ({
    id: `${prefix}_field_${index + 1}`,
    name,
    code,
    type,
    scope,
    required,
    enabled: true,
  }));
}

function approvalRows(prefix: string, rows: Array<[string, string, string]>): OperationApprovalRuleRow[] {
  return rows.map(([name, category, owner], index) => ({
    id: `${prefix}_approval_${index + 1}`,
    name,
    category,
    nodes: [
      { name: '一级审批', approvers: [owner], method: '依次审批' },
      { name: '业务复核', approvers: ['老大'], method: '会签' },
    ],
    owner,
    updatedAt: '2026-05-27',
    enabled: true,
  }));
}

function printRows(prefix: string, name: string): OperationPrintTemplateRow[] {
  return [
    { id: `${prefix}_print_1`, name: `${name}标准打印模板`, scene: '新增/详情打印', paper: 'A4 纵向', status: '启用', updatedAt: '2026-05-27' },
    { id: `${prefix}_print_2`, name: `${name}审批留痕模板`, scene: '审批完成后打印', paper: 'A4 横向', status: '启用', updatedAt: '2026-05-27' },
  ];
}

function templateBase(module: OperationSettingModule, center: 'rd' | 'warehouse' | 'production', name: string, resource: string, backRoute: string, prefix: string) {
  return {
    module,
    center,
    resource,
    title: `${name}设置`,
    backText: `返回${name}列表`,
    backRoute,
    typeTitles: typeTitles(name),
    numbers: { prefix, separator: '-', selected: ['y4', 's3'], candidates: operationNumberCandidates },
    print: { addText: `新增${name}打印模板`, columns: [], rows: printRows(module, name) },
  };
}

const categoryColumns: SettingTableColumn[] = [
  { key: 'name', label: '分类名称' },
  { key: 'parent', label: '上级分类' },
  { key: 'code', label: '分类编码' },
  { key: 'count', label: '数据量' },
  { key: 'enabled', label: '状态' },
];

const templateColumns: SettingTableColumn[] = [
  { key: 'name', label: '模板名称' },
  { key: 'category', label: '适用分类' },
  { key: 'version', label: '版本' },
  { key: 'enabled', label: '状态' },
];

const brandColumns: SettingTableColumn[] = [
  { key: 'name', label: '品牌名称' },
  { key: 'code', label: '品牌编码' },
  { key: 'owner', label: '归属主体' },
  { key: 'enabled', label: '状态' },
];

function categoryList(prefix: string, name: string, rows: Array<[string, string, string, number]>): OperationExtraSettingList {
  return {
    addText: `新增${name}分类`,
    title: `${name}分类设置`,
    description: `维护${name}列表左侧分类树和新增表单中的分类选项。`,
    searchPlaceholder: `搜索${name}分类`,
    columns: categoryColumns,
    rows: rows.map(([rowName, parent, code, count], index) => ({
      id: `${prefix}_cat_${index + 1}`,
      name: rowName,
      parent,
      code,
      count,
      enabled: '启用',
    })),
  };
}

function brandList(prefix: string, name: string, rows: Array<[string, string, string]>): OperationExtraSettingList {
  return {
    addText: `新增${name}品牌`,
    title: `${name}品牌设置`,
    description: `维护${name}档案中可选择的品牌标签，用于列表筛选、详情展示和新增表单下拉。`,
    searchPlaceholder: `搜索${name}品牌/编码/归属主体`,
    columns: brandColumns,
    rows: rows.map(([rowName, code, owner], index) => ({
      id: `${prefix}_brand_${index + 1}`,
      name: rowName,
      code,
      owner,
      enabled: '启用',
    })),
  };
}

function docCategoryList(): OperationExtraSettingList {
  const roots = [
    { key: 'plan', name: '工艺方案' },
    { key: 'craft', name: '工艺文件' },
    { key: 'tech', name: '技术文档' },
    { key: 'spec', name: '操作规范' },
  ];
  const subs: Array<[string, string, string, number, boolean]> = [
    ['控制方案', 'DOC_PLAN_CTRL', 'plan', 1, true],
    ['自动化方案', 'DOC_PLAN_AUTO', 'plan', 2, true],
    ['焊接作业', 'DOC_CRAFT_WELD', 'craft', 1, true],
    ['技术规范', 'DOC_TECH_SPEC', 'tech', 1, true],
    ['安全操作', 'DOC_OP_SAFE', 'spec', 1, true],
  ];
  const rootMap = Object.fromEntries(roots.map((root) => [root.key, root.name]));
  return {
    addText: '新增子分类',
    title: '文档分类设置',
    description: '维护文档库左侧一级分类，以及当前一级分类下的二级分类列表。',
    searchPlaceholder: '搜索下级分类名称/编号',
    rootTitle: '文档分类',
    rootAddText: '新增文档分类',
    defaultRootKey: 'plan',
    roots,
    columns: [
      { key: 'index', label: '序号', width: '70px' },
      { key: 'name', label: '分类名称' },
      { key: 'parentName', label: '上级分类' },
      { key: 'code', label: '分类编码' },
      { key: 'sort', label: '排序', width: '90px' },
      { key: 'enabled', label: '状态', width: '90px' },
    ],
    rows: subs.map(([name, code, parentKey, sort, enabled], index) => ({
      id: `rd_doc_cat_sub_${index + 1}`,
      name,
      code,
      parentKey,
      parentName: rootMap[parentKey],
      sort,
      enabled,
    })),
  };
}

function bomTemplateList(): OperationExtraSettingList {
  return {
    addText: '新增BOM模板',
    title: 'BOM模板设置',
    description: '维护BOM新增时可选择的结构模板、默认层级、替代料和损耗规则。',
    searchPlaceholder: '搜索BOM模板',
    columns: templateColumns,
    rows: [
      { id: 'bom_tpl_1', name: '成品标准BOM模板', category: '成品BOM', version: 'V1.0', enabled: '启用' },
      { id: 'bom_tpl_2', name: '半成品模块BOM模板', category: '半成品BOM', version: 'V1.0', enabled: '启用' },
      { id: 'bom_tpl_3', name: '工程试制BOM模板', category: '工程BOM', version: 'V0.9', enabled: '启用' },
    ],
  };
}

function rdStrategyTabs(kind: string, rows: StrategyTab[]): { title: string; description: string; tabs: StrategyTab[] } {
  return {
    title: kind + '策略设置',
    description: '按研发中心页面真实动作配置审批流、操作权限和数据校验策略。',
    tabs: rows,
  };
}

const rdDocStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'docSubmitApproval',
        title: '提交文档审批',
        sub: '文档从草稿提交到待审核时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'docSubmitApprovalFlow', title: '审批流程', sub: '文档提交审批时选择已配置的审批流程。', type: 'select', value: '文档发布审批', options: ['文档发布审批', '通用单级审批流'] },
          { key: 'docApproveResult', title: '审批通过后状态', sub: '审批通过后文档进入的业务状态。', type: 'select', value: '已发布', options: ['已发布', '已审核待发布'] },
        ],
      },
      {
        key: 'docStopApproval',
        title: '停用文档',
        sub: '已发布文档被停用时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'docStopApprovalFlow', title: '审批流程', sub: '停用文档时选择已配置的审批流程。', type: 'select', value: '通用单级审批流', options: ['通用单级审批流', '文档发布审批'] },
          { key: 'docReferencedStopAction', title: '存在引用时处理方式', sub: '文档已被项目或BOM引用时的停用处理。', type: 'select', value: '提示引用并阻断停用', options: ['提示引用并阻断停用', '审批通过后允许停用', '仅提示引用范围'] },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'docVersionEditControl',
        title: '编辑已发布文档',
        sub: '已发布文档点击编辑时是否要求生成新版本草稿。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'docVersionEditMode', title: '编辑方式', sub: '控制已发布文档再次编辑的处理方式。', type: 'select', value: '生成新版本草稿', options: ['生成新版本草稿', '允许直接编辑当前版本', '禁止编辑已发布版本'] },
        ],
      },
      {
        key: 'docPrintExportControl',
        title: '打印/导出文档',
        sub: '文档详情中的打印、导出操作是否按角色控制。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'docPrintExportRole', title: '允许操作的最低角色', sub: '控制谁可以打印或导出文档。', type: 'select', value: '研发人员及以上', options: ['研发人员及以上', '研发主管及以上', '仅文档负责人'] },
          { key: 'docExportLog', title: '记录导出日志', sub: '每次导出文档时写入操作记录。', type: 'switch', enabled: false },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'docSubmitRequired',
        title: '提交前必填校验',
        sub: '文档提交审批前是否校验正文、附件和失效日期。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'docRequiredFields', title: '必填内容', sub: '提交审批前必须维护的内容。', type: 'select', value: '正文或附件至少一项', options: ['正文或附件至少一项', '正文和附件均必填', '仅校验基础信息'] },
        ],
      },
    ],
  },
];

const rdProjectStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'projectSubmitApproval',
        title: '提交项目审批',
        sub: '项目从草稿提交到待审核时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'projectSubmitApprovalFlow', title: '审批流程', sub: '项目立项提交时选择已配置的审批流程。', type: 'select', value: '项目立项审批', options: ['项目立项审批', '通用单级审批流'] },
          { key: 'projectApproveResult', title: '审批通过后状态', sub: '审批通过后项目进入的业务状态。', type: 'select', value: '筹备中', options: ['筹备中', '立项'] },
        ],
      },
      {
        key: 'projectCompleteApproval',
        title: '完成项目',
        sub: '进行中的项目点击完成时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'projectCompleteApprovalFlow', title: '审批流程', sub: '完成项目时选择已配置的审批流程。', type: 'select', value: '通用单级审批流', options: ['通用单级审批流', '项目立项审批'] },
          { key: 'projectOpenTaskAction', title: '存在未完成业务时处理方式', sub: '项目存在未锁定报价、未发起采购或生产时的处理。', type: 'select', value: '提示并阻断完成', options: ['提示并阻断完成', '审批通过后允许完成', '仅提示未完成业务'] },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'projectBomProcessLock',
        title: '锁定项目BOM/工艺',
        sub: '项目详情中锁定BOM或锁定工艺时是否限制操作人。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'projectLockRole', title: '允许锁定的最低角色', sub: '控制谁可以锁定项目BOM和项目工艺。', type: 'select', value: '项目负责人', options: ['项目负责人', '研发主管及以上', '项目成员'] },
          { key: 'projectLockedEditAction', title: '锁定后变更方式', sub: 'BOM或工艺锁定后再次变更的处理方式。', type: 'select', value: '提示并要求重新锁定', options: ['提示并要求重新锁定', '禁止变更', '允许负责人变更'] },
        ],
      },
      {
        key: 'projectStartBusinessControl',
        title: '发起采购/生产',
        sub: '项目详情中发起采购和下单生产需求时是否校验报价状态。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'projectStartBusinessCondition', title: '发起前置条件', sub: '允许发起采购或生产前必须满足的条件。', type: 'select', value: '报价已锁定', options: ['报价已锁定', 'BOM和工艺已锁定', '项目已启动'] },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'projectSubmitRequired',
        title: '提交前必填校验',
        sub: '项目提交审批前是否校验负责人、周期和项目分类。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'projectRequiredFields', title: '必填内容', sub: '提交审批前必须维护的内容。', type: 'select', value: '负责人 + 开始日期 + 计划完成日期', options: ['负责人 + 开始日期 + 计划完成日期', '负责人 + 周期 + 项目描述', '仅校验基础信息'] },
        ],
      },
    ],
  },
];

const rdProductStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'productSubmitApproval',
        title: '提交产品审批',
        sub: '产品从草稿提交到待审核时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'productSubmitApprovalFlow', title: '审批流程', sub: '产品提交审批时选择已配置的审批流程。', type: 'select', value: '产品生效审批', options: ['产品生效审批', '通用单级审批流'] },
          { key: 'productApproveResult', title: '审批通过后状态', sub: '审批通过后产品进入的业务状态。', type: 'select', value: '研发', options: ['研发', '在售'] },
        ],
      },
      {
        key: 'productDisableApproval',
        title: '停用产品',
        sub: '产品被停用时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'productDisableApprovalFlow', title: '审批流程', sub: '停用产品时选择已配置的审批流程。', type: 'select', value: '通用单级审批流', options: ['通用单级审批流', '产品生效审批'] },
          { key: 'productBusinessReferenceAction', title: '存在业务引用时处理方式', sub: '产品存在销售、质检或成本记录时的停用处理。', type: 'select', value: '提示引用并阻断停用', options: ['提示引用并阻断停用', '审批通过后允许停用', '仅提示引用范围'] },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'productSubmitRequired',
        title: '提交前必填校验',
        sub: '产品提交审批前是否校验分类、单位、型号和质检方案。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'productRequiredFields', title: '必填内容', sub: '提交审批前必须维护的产品档案内容。', type: 'select', value: '分类 + 单位 + 型号', options: ['分类 + 单位 + 型号', '分类 + 单位 + 型号 + 质检方案', '仅校验基础信息'] },
          { key: 'productSalesControlRequired', title: '销售控制必填', sub: '产品可在销售模块使用前必须维护销售控制。', type: 'switch', enabled: false },
        ],
      },
    ],
  },
];

const rdMaterialStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'materialSubmitApproval',
        title: '提交物料审批',
        sub: '物料从草稿提交到待审核时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'materialSubmitApprovalFlow', title: '审批流程', sub: '物料提交审批时选择已配置的审批流程。', type: 'select', value: '物料生效审批', options: ['物料生效审批', '通用单级审批流'] },
          { key: 'materialApproveResult', title: '审批通过后状态', sub: '审批通过后物料进入的业务状态。', type: 'select', value: '启用', options: ['启用', '待启用'] },
        ],
      },
      {
        key: 'materialPurchaseStatusApproval',
        title: '禁止/恢复采购',
        sub: '物料切换禁止采购或恢复采购时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'materialPurchaseStatusFlow', title: '审批流程', sub: '禁止或恢复采购时选择已配置的审批流程。', type: 'select', value: '通用单级审批流', options: ['通用单级审批流', '物料生效审批'] },
          { key: 'materialOpenPurchaseAction', title: '存在未完结采购时处理方式', sub: '物料存在采购记录或未完结采购单时的处理。', type: 'select', value: '提示并阻断状态变更', options: ['提示并阻断状态变更', '审批通过后允许变更', '仅提示未完结采购'] },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'materialSubmitRequired',
        title: '提交前必填校验',
        sub: '物料提交审批前是否校验分类、单位、规格和采购信息。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'materialRequiredFields', title: '必填内容', sub: '提交审批前必须维护的物料档案内容。', type: 'select', value: '分类 + 单位 + 规格', options: ['分类 + 单位 + 规格', '分类 + 单位 + 规格 + 主供应商', '仅校验基础信息'] },
          { key: 'materialPurchaseUnitRequired', title: '采购单位必填', sub: '外购物料启用前必须维护采购单位倍数表。', type: 'switch', enabled: false },
        ],
      },
    ],
  },
];

const rdProcessStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'processSubmitApproval',
        title: '提交工序审批',
        sub: '工序从草稿提交到待审核时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'processSubmitApprovalFlow', title: '审批流程', sub: '工序提交审批时选择已配置的审批流程。', type: 'select', value: '工序审批流程', options: ['工序审批流程', '通用单级审批流'] },
          { key: 'processApproveResult', title: '审批通过后状态', sub: '审批通过后工序进入的业务状态。', type: 'select', value: '启用', options: ['启用', '待启用'] },
        ],
      },
      {
        key: 'processPauseDisableApproval',
        title: '暂停/停用工序',
        sub: '启用工序被暂停或停用时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'processPauseDisableFlow', title: '审批流程', sub: '暂停或停用工序时选择已配置的审批流程。', type: 'select', value: '通用单级审批流', options: ['通用单级审批流', '工序审批流程'] },
          { key: 'processUsedByCraftAction', title: '已被工艺引用时处理方式', sub: '工序已出现在工艺路线时的暂停或停用处理。', type: 'select', value: '提示引用并阻断停用', options: ['提示引用并阻断停用', '审批通过后允许停用', '仅提示引用工艺'] },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'processSaveRequired',
        title: '保存前必填校验',
        sub: '工序保存前是否校验工位、工时和质检方案配置。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'processRequiredFields', title: '必填内容', sub: '保存前必须维护的工序内容。', type: 'select', value: '工序类型 + 工位 + 标准工时', options: ['工序类型 + 工位 + 标准工时', '工序类型 + 工位 + 标准工时 + 质检方案', '仅校验基础信息'] },
        ],
      },
    ],
  },
];

const rdCraftStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'craftSubmitApproval',
        title: '提交工艺审批',
        sub: '工艺从草稿提交到待审核时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'craftSubmitApprovalFlow', title: '审批流程', sub: '工艺提交审批时选择已配置的审批流程。', type: 'select', value: '工艺审批流程', options: ['工艺审批流程', '通用单级审批流'] },
          { key: 'craftApproveResult', title: '审批通过后状态', sub: '审批通过后工艺进入的业务状态。', type: 'select', value: '已生效', options: ['已生效', '待生效'] },
        ],
      },
      {
        key: 'craftAbolishApproval',
        title: '作废工艺',
        sub: '已生效工艺被作废时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'craftAbolishApprovalFlow', title: '审批流程', sub: '作废工艺时选择已配置的审批流程。', type: 'select', value: '通用单级审批流', options: ['通用单级审批流', '工艺审批流程'] },
          { key: 'craftReferencedAction', title: '存在引用时处理方式', sub: '工艺被项目或生产资料引用时的作废处理。', type: 'select', value: '提示引用并阻断作废', options: ['提示引用并阻断作废', '审批通过后允许作废', '仅提示引用范围'] },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'craftRouteRequired',
        title: '提交前路线校验',
        sub: '工艺提交审批前是否校验工艺路线明细。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'craftRequiredFields', title: '必填内容', sub: '提交审批前必须维护的工艺路线内容。', type: 'select', value: '至少一条工序明细', options: ['至少一条工序明细', '工序明细 + 标准工时', '工序明细 + 质检点'] },
          { key: 'craftDefaultConflictAction', title: '默认工艺冲突处理', sub: '同一产品已有默认工艺时的处理方式。', type: 'select', value: '提示并要求确认', options: ['提示并要求确认', '阻断保存', '允许多个默认工艺'] },
        ],
      },
    ],
  },
];

const rdBomStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'bomSubmitApproval',
        title: '提交BOM审批',
        sub: 'BOM从草稿提交到待审核时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'bomSubmitApprovalFlow', title: '审批流程', sub: 'BOM提交审批时选择已配置的审批流程。', type: 'select', value: 'BOM审批流程', options: ['BOM审批流程', '通用单级审批流'] },
          { key: 'bomApproveResult', title: '审批通过后状态', sub: '审批通过后BOM进入的业务状态。', type: 'select', value: '已生效', options: ['已生效', '待生效'] },
        ],
      },
      {
        key: 'bomDisableApproval',
        title: '停用BOM',
        sub: '已生效BOM被停用时是否触发审批。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'bomDisableApprovalFlow', title: '审批流程', sub: '停用BOM时选择已配置的审批流程。', type: 'select', value: '通用单级审批流', options: ['通用单级审批流', 'BOM审批流程'] },
          { key: 'bomReferencedAction', title: '存在引用时处理方式', sub: 'BOM已被项目或生产资料引用时的停用处理。', type: 'select', value: '提示引用并阻断停用', options: ['提示引用并阻断停用', '审批通过后允许停用', '仅提示引用范围'] },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'bomVersionEditControl',
        title: '编辑已生效BOM',
        sub: '已生效BOM点击编辑时是否要求复制新版本。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'bomVersionEditMode', title: '编辑方式', sub: '控制已生效BOM再次编辑的处理方式。', type: 'select', value: '复制新版本后编辑', options: ['复制新版本后编辑', '允许直接编辑当前版本', '禁止编辑已生效BOM'] },
        ],
      },
      {
        key: 'bomSubstituteMaintainControl',
        title: '维护替代料',
        sub: 'BOM详情和替代列表中的替代料维护是否限制操作人。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'bomSubstituteRole', title: '允许维护的最低角色', sub: '控制谁可以新增或调整替代料。', type: 'select', value: '研发人员及以上', options: ['研发人员及以上', '研发主管及以上', '仅BOM编制人'] },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'bomStructureRequired',
        title: '提交前结构校验',
        sub: 'BOM提交审批前是否校验结构、用量、单位和替代料。',
        type: 'switch',
        enabled: false,
        children: [
          { key: 'bomRequiredFields', title: '必填内容', sub: '提交审批前必须维护的BOM内容。', type: 'select', value: '至少一条物料明细', options: ['至少一条物料明细', '物料明细 + 用量 + 单位', '物料明细 + 用量 + 单位 + 替代料状态'] },
        ],
      },
    ],
  },
];

const warehouseStockStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'stockFreezeApproval',
        title: '库存冻结/释放审批',
        sub: '库存列表执行批量冻结或库存释放时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'stockFreezeFlow',
            title: '审批流程',
            sub: '冻结或释放库存时使用的审批流程。',
            type: 'select',
            value: '库存冻结审批',
            options: ['库存冻结审批', '通用单级审批流'],
          },
          {
            key: 'stockFreezeSource',
            title: '冻结来源记录',
            sub: '冻结数量需要记录来源单据和冻结原因。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'stockBatchFreezeControl',
        title: '批量冻结库存',
        sub: '库存管理列表中的批量冻结是否限制可操作库存范围。',
        enabled: false,
        children: [
          {
            key: 'stockFreezeAllowedState',
            title: '允许冻结的质量状态',
            sub: '哪些质量状态的库存允许被冻结。',
            type: 'select',
            value: '合格/让步/待检',
            options: ['合格/让步/待检', '仅合格', '仅待检或异常库存'],
          },
          {
            key: 'stockFreezeQuantityLimit',
            title: '冻结数量限制',
            sub: '冻结数量不得超过当前可用数量。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'availableQuantityRule',
        title: '可用库存校验',
        sub: '库存数量、占用数量、冻结数量和在途数量变化时是否校验可用量。',
        enabled: false,
        children: [
          {
            key: 'availableQuantityFormula',
            title: '可用量计算口径',
            sub: '可用数量按库存数量扣减占用和冻结。',
            type: 'select',
            value: '库存 - 占用 - 冻结',
            options: ['库存 - 占用 - 冻结', '库存 - 占用 - 冻结 + 在途', '仅按库存数量'],
          },
          {
            key: 'qualityAvailabilityRule',
            title: '质量状态参与可用量',
            sub: '待检、禁用或隔离库存默认不计入可用数量。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'stockTraceRequired',
        title: '批次/成本层追踪',
        sub: '库存明细是否必须保留批次、来源明细、质量状态和成本层。',
        enabled: false,
        children: [
          {
            key: 'stockTraceFields',
            title: '必填追踪内容',
            sub: '库存台账必须保留的追踪字段。',
            type: 'select',
            value: '批次 + 库位 + 质量状态 + 成本层',
            options: ['批次 + 库位', '批次 + 库位 + 质量状态', '批次 + 库位 + 质量状态 + 成本层'],
          },
        ],
      },
    ],
  },
];

const inboundStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'directInboundApproval',
        title: '直接入库审批',
        sub: '无来源单据的直接入库提交时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'directInboundFlow',
            title: '审批流程',
            sub: '直接入库提交时使用的审批流程。',
            type: 'select',
            value: '直接入库审批',
            options: ['直接入库审批', '通用单级审批流'],
          },
          {
            key: 'directInboundReasonRequired',
            title: '入库原因必填',
            sub: '直接入库必须填写入库原因或备注。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'concessionInboundApproval',
        title: '让步入库审批',
        sub: '入库明细存在让步数量时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'concessionInboundFlow',
            title: '审批流程',
            sub: '让步入库使用的审批流程。',
            type: 'select',
            value: '让步入库审批',
            options: ['让步入库审批', '直接入库审批'],
          },
          {
            key: 'concessionInboundResult',
            title: '审批通过后质量状态',
            sub: '让步入库审批通过后写入的库存质量状态。',
            type: 'select',
            value: '让步',
            options: ['让步', '合格', '待复检'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'inboundSourceControl',
        title: '选择入库来源',
        sub: '新增入库时是否限制采购订单、生产工单、销售退货、委外订单和手工来源。',
        enabled: false,
        children: [
          {
            key: 'inboundAllowedSource',
            title: '允许来源',
            sub: '新增入库允许选择的来源范围。',
            type: 'select',
            value: '采购/生产/退货/委外/手工',
            options: ['采购/生产/退货/委外/手工', '禁止手工入库', '仅来源单据入库'],
          },
          {
            key: 'inboundSourceLineLock',
            title: '来源明细锁定',
            sub: '来源带入的物料、批次和应入数量默认锁定。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'inboundPutawayControl',
        title: '批量上架',
        sub: '入库列表批量上架是否限制在待上架或已收货待检状态。',
        enabled: false,
        children: [
          {
            key: 'inboundPutawayCondition',
            title: '允许上架状态',
            sub: '允许执行上架的入库状态。',
            type: 'select',
            value: '待上架/已收货待检',
            options: ['待上架/已收货待检', '仅待上架', '质检放行后'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'inboundSubmitRequired',
        title: '提交前必填校验',
        sub: '入库提交前是否校验入库类型、仓库、人员、日期和物料明细。',
        enabled: false,
        children: [
          {
            key: 'inboundRequiredFields',
            title: '必填内容',
            sub: '提交入库前必须维护的内容。',
            type: 'select',
            value: '类型 + 仓库 + 人员 + 明细',
            options: ['类型 + 仓库 + 人员 + 明细', '来源单据 + 明细 + 库位', '类型 + 仓库 + 人员 + 日期 + 明细'],
          },
        ],
      },
      {
        key: 'inboundQuantityPostCheck',
        title: '上架/过账数量校验',
        sub: '上架和过账时是否校验入库数量不超过合格与让步数量。',
        enabled: false,
        children: [
          {
            key: 'inboundQtyLimit',
            title: '入库数量上限',
            sub: '入库数量超过可入库数量时的处理方式。',
            type: 'select',
            value: '阻断上架过账',
            options: ['阻断上架过账', '审批通过后允许', '仅提示异常'],
          },
          {
            key: 'inboundLocationRequired',
            title: '上架库位必填',
            sub: '过账前必须维护入库库位。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
];

const outboundStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'directOutboundApproval',
        title: '直接出库审批',
        sub: '无来源单据的直接出库提交时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'directOutboundFlow',
            title: '审批流程',
            sub: '直接出库提交时使用的审批流程。',
            type: 'select',
            value: '直接出库审批',
            options: ['直接出库审批', '通用单级审批流'],
          },
          {
            key: 'directOutboundReasonRequired',
            title: '出库原因必填',
            sub: '直接出库必须填写出库原因或目的地。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'shortPickApproval',
        title: '短拣差异审批',
        sub: '拣货、复核或发货数量少于应出数量时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'shortPickFlow',
            title: '审批流程',
            sub: '短拣差异使用的审批流程。',
            type: 'select',
            value: '短拣差异审批',
            options: ['短拣差异审批', '直接出库审批'],
          },
          {
            key: 'shortPickAfterApprove',
            title: '审批通过后处理',
            sub: '短拣差异通过后的出库处理方式。',
            type: 'select',
            value: '按实发数量过账',
            options: ['按实发数量过账', '保留未发数量', '生成差异处理记录'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'outboundSourceControl',
        title: '选择出库来源',
        sub: '新增出库时是否限制销售订单、内部领用、委外领料、采购退货和手工来源。',
        enabled: false,
        children: [
          {
            key: 'outboundAllowedSource',
            title: '允许来源',
            sub: '新增出库允许选择的来源范围。',
            type: 'select',
            value: '销售/领用/委外/退货/手工',
            options: ['销售/领用/委外/退货/手工', '禁止手工出库', '仅来源单据出库'],
          },
          {
            key: 'outboundSourceLineLock',
            title: '来源明细锁定',
            sub: '来源带入的物料、批次和应出数量默认锁定。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'outboundPickControl',
        title: '批量拣货/复核',
        sub: '出库列表批量拣货和详情复核确认是否限制状态。',
        enabled: false,
        children: [
          {
            key: 'outboundPickCondition',
            title: '允许拣货状态',
            sub: '允许执行拣货或复核的出库状态。',
            type: 'select',
            value: '已审核待占用/拣货中',
            options: ['已审核待占用/拣货中', '仅拣货中', '占用完成后'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'outboundAvailableCheck',
        title: '可出库数量校验',
        sub: '拣货、复核、发货和过账时是否校验可用库存、冻结和占用数量。',
        enabled: false,
        children: [
          {
            key: 'outboundQtyLimit',
            title: '出库数量上限',
            sub: '出库数量超过可用数量时的处理方式。',
            type: 'select',
            value: '阻断出库',
            options: ['阻断出库', '审批通过后允许', '仅提示异常'],
          },
          {
            key: 'outboundQualityLimit',
            title: '质量状态限制',
            sub: '待检或隔离库存不允许出库。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'outboundOqcPostCheck',
        title: 'OQC放行/过账校验',
        sub: '销售出库过账前是否校验OQC放行状态。',
        enabled: false,
        children: [
          {
            key: 'outboundOqcCondition',
            title: '过账前置条件',
            sub: '允许出库过账前必须满足的条件。',
            type: 'select',
            value: 'OQC已放行或无需OQC',
            options: ['OQC已放行或无需OQC', '必须OQC已放行', '仅校验复核数量'],
          },
        ],
      },
    ],
  },
];

const transferStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'transferSubmitApproval',
        title: '提交调拨审批',
        sub: '新增调拨提交后是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'transferSubmitFlow',
            title: '审批流程',
            sub: '调拨提交时使用的审批流程。',
            type: 'select',
            value: '调拨提交审批',
            options: ['调拨提交审批', '通用单级审批流'],
          },
          {
            key: 'transferAfterApprove',
            title: '审批通过后状态',
            sub: '审批通过后进入的调拨状态。',
            type: 'select',
            value: '调拨出库待确认',
            options: ['调拨出库待确认', '调入确认中'],
          },
        ],
      },
      {
        key: 'transferDifferenceApproval',
        title: '调拨差异审批',
        sub: '调入确认数量少于调出数量时是否触发差异审批。',
        enabled: false,
        children: [
          {
            key: 'transferDifferenceFlow',
            title: '审批流程',
            sub: '调拨差异处理时使用的审批流程。',
            type: 'select',
            value: '调拨差异审批',
            options: ['调拨差异审批', '调拨提交审批'],
          },
          {
            key: 'transferDifferenceAction',
            title: '差异处理方式',
            sub: '调拨差异审批通过后的处理方式。',
            type: 'select',
            value: '保留在途并生成差异记录',
            options: ['保留在途并生成差异记录', '生成库存调整单', '按调入数量完成'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'transferConfirmControl',
        title: '调出/调入确认',
        sub: '调拨详情中的调出确认、调入确认是否限制状态和人员。',
        enabled: false,
        children: [
          {
            key: 'transferOutCondition',
            title: '调出确认条件',
            sub: '允许调出确认前必须满足的条件。',
            type: 'select',
            value: '审批通过且库存已冻结',
            options: ['审批通过且库存已冻结', '库存可用即可确认', '仅调出仓负责人确认'],
          },
          {
            key: 'transferInCondition',
            title: '调入确认条件',
            sub: '允许调入确认前必须满足的条件。',
            type: 'select',
            value: '调出已确认',
            options: ['调出已确认', '到货后确认', '仅调入仓负责人确认'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'transferSubmitRequired',
        title: '提交前必填校验',
        sub: '调拨提交前是否校验调出仓、调入仓、调拨人、日期和物料明细。',
        enabled: false,
        children: [
          {
            key: 'transferRequiredFields',
            title: '必填内容',
            sub: '提交调拨前必须维护的内容。',
            type: 'select',
            value: '调出仓 + 调入仓 + 明细 + 数量',
            options: ['调出仓 + 调入仓 + 明细 + 数量', '调出/调入库位 + 明细 + 数量', '调拨原因 + 调出/调入库位 + 明细'],
          },
          {
            key: 'transferSameWarehouseBlock',
            title: '同仓库阻断',
            sub: '调出仓库与调入仓库相同时阻断提交。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'transferQuantityCheck',
        title: '可调拨数量校验',
        sub: '调拨数量和调出确认数量是否不得超过可调拨数量。',
        enabled: false,
        children: [
          {
            key: 'transferQtyLimit',
            title: '超可调拨数量处理',
            sub: '调拨数量超过可调拨数量时的处理方式。',
            type: 'select',
            value: '阻断调拨',
            options: ['阻断调拨', '审批通过后允许', '仅提示异常'],
          },
        ],
      },
    ],
  },
];

const inventoryStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'countPlanApproval',
        title: '盘点计划审批',
        sub: '盘点单创建后是否先审批再开始盘点。',
        enabled: false,
        children: [
          {
            key: 'countPlanFlow',
            title: '审批流程',
            sub: '盘点计划使用的审批流程。',
            type: 'select',
            value: '盘点计划审批',
            options: ['盘点计划审批', '通用单级审批流'],
          },
          {
            key: 'countAfterApprove',
            title: '审批通过后状态',
            sub: '审批通过后盘点单进入的状态。',
            type: 'select',
            value: '未开始',
            options: ['未开始', '盘点中'],
          },
        ],
      },
      {
        key: 'countDifferenceApproval',
        title: '盘点差异审批',
        sub: '盘点存在盘盈、盘亏或差异待调整时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'countDifferenceFlow',
            title: '审批流程',
            sub: '盘点差异处理时使用的审批流程。',
            type: 'select',
            value: '盘点差异审批',
            options: ['盘点差异审批', '盘点计划审批'],
          },
          {
            key: 'countDifferenceAction',
            title: '差异处理方式',
            sub: '差异审批通过后的处理方式。',
            type: 'select',
            value: '生成库存调整单',
            options: ['生成库存调整单', '生成盘盈入库/盘亏出库', '仅记录差异'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'countStartControl',
        title: '开始盘点/提交复盘',
        sub: '盘点详情中的开始盘点、提交复盘、差异确认是否限制状态。',
        enabled: false,
        children: [
          {
            key: 'countOperationCondition',
            title: '盘点操作条件',
            sub: '允许推进盘点状态前必须满足的条件。',
            type: 'select',
            value: '按未开始/盘点中/复盘中顺序推进',
            options: ['按未开始/盘点中/复盘中顺序推进', '盘点人本人操作', '仓库负责人操作'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'countScopeLockCheck',
        title: '盘点范围/锁库校验',
        sub: '创建盘点时是否校验盘点范围、锁库范围和锁库数量。',
        enabled: false,
        children: [
          {
            key: 'countScopeRequired',
            title: '必填范围',
            sub: '创建盘点单必须选择的范围。',
            type: 'select',
            value: '仓库 + 盘点范围',
            options: ['仓库 + 盘点范围', '仓库 + 库位 + 物料', '仓库 + 锁库范围 + 明细'],
          },
          {
            key: 'countLockBeforeStart',
            title: '开始前锁库',
            sub: '开始盘点前必须完成锁库。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'countDifferenceRequired',
        title: '差异复盘校验',
        sub: '存在盘点差异时是否要求填写复盘数量和差异原因。',
        enabled: false,
        children: [
          {
            key: 'countDifferenceFields',
            title: '差异必填内容',
            sub: '提交差异确认前必须维护的内容。',
            type: 'select',
            value: '复盘数量 + 差异原因',
            options: ['复盘数量 + 差异原因', '复盘数量 + 差异原因 + 处理方式', '差异原因 + 调整单号'],
          },
        ],
      },
    ],
  },
];

const locationStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'warehouseDisableApproval',
        title: '仓库/库位停用审批',
        sub: '仓库、库区或库位从可用改为维护、禁用时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'warehouseDisableFlow',
            title: '审批流程',
            sub: '停用仓库、库区或库位时使用的审批流程。',
            type: 'select',
            value: '仓库启停审批',
            options: ['仓库启停审批', '通用单级审批流'],
          },
          {
            key: 'warehouseStockBeforeDisable',
            title: '存在库存时处理方式',
            sub: '库位存在库存、占用或冻结数量时的停用处理。',
            type: 'select',
            value: '提示并阻断停用',
            options: ['提示并阻断停用', '审批通过后允许停用', '仅提示库存影响'],
          },
        ],
      },
      {
        key: 'locationCapacityApproval',
        title: '库位容量变更审批',
        sub: '仓库、库区或库位容量调整时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'locationCapacityFlow',
            title: '审批流程',
            sub: '容量变更使用的审批流程。',
            type: 'select',
            value: '库位容量变更审批',
            options: ['库位容量变更审批', '仓库启停审批'],
          },
          {
            key: 'capacityLowerThanStockAction',
            title: '容量小于当前库存时处理方式',
            sub: '调整后容量小于当前存放量时的处理方式。',
            type: 'select',
            value: '提示并阻断保存',
            options: ['提示并阻断保存', '审批通过后允许保存', '仅提示超容风险'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'locationCreateTypeControl',
        title: '新增仓库/库区/库位',
        sub: '仓库库位页面新增不同类型时是否限制维护权限。',
        enabled: false,
        children: [
          {
            key: 'locationCreateAllowedType',
            title: '允许新增类型',
            sub: '当前页面允许新增和维护的对象类型。',
            type: 'select',
            value: '仓库/库区/库位',
            options: ['仓库/库区/库位', '仅仓库和库位', '仅库位'],
          },
          {
            key: 'locationManagerOnly',
            title: '仅负责人可维护',
            sub: '仅仓库负责人或仓储主管可维护仓库库位。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'locationSubmitRequired',
        title: '保存前必填校验',
        sub: '保存仓库、库区或库位前是否校验名称、负责人、地址、状态和上级关系。',
        enabled: false,
        children: [
          {
            key: 'locationRequiredFields',
            title: '必填内容',
            sub: '保存仓库库位前必须维护的内容。',
            type: 'select',
            value: '名称 + 负责人 + 地址/上级关系',
            options: ['名称 + 负责人 + 地址/上级关系', '名称 + 状态 + 上级关系', '名称 + 负责人 + 地址 + 状态'],
          },
        ],
      },
      {
        key: 'putawayLocationCheck',
        title: '入库上架库位校验',
        sub: '入库选择上架库位时是否校验库位状态、温区和容量。',
        enabled: false,
        children: [
          {
            key: 'putawayLocationCondition',
            title: '可上架库位条件',
            sub: '允许作为入库上架目标的库位条件。',
            type: 'select',
            value: '可用且未超容',
            options: ['可用且未超容', '可用 + 温区匹配 + 未超容', '仅可用状态'],
          },
        ],
      },
    ],
  },
];

const demandStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'demandConfirmApproval',
        title: '需求确认审批',
        sub: '生产需求从待确认进入已确认时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'demandConfirmFlow',
            title: '审批流程',
            sub: '生产需求确认时使用的审批流程。',
            type: 'select',
            value: '生产需求确认审批',
            options: ['生产需求确认审批', '通用单级审批流'],
          },
          {
            key: 'demandConfirmResult',
            title: '审批通过后状态',
            sub: '审批通过后生产需求进入的业务状态。',
            type: 'select',
            value: '已确认',
            options: ['已确认', '待转计划', '待转订单'],
          },
        ],
      },
      {
        key: 'demandCloseApproval',
        title: '关闭生产需求',
        sub: '生产需求关闭时是否触发审批或校验未转单明细。',
        enabled: false,
        children: [
          {
            key: 'demandCloseFlow',
            title: '审批流程',
            sub: '关闭生产需求时使用的审批流程。',
            type: 'select',
            value: '通用单级审批流',
            options: ['通用单级审批流', '生产需求确认审批'],
          },
          {
            key: 'demandUnconvertedAction',
            title: '存在未转单明细时处理方式',
            sub: '需求还有未转计划或未转订单数量时的关闭处理。',
            type: 'select',
            value: '提示并阻断关闭',
            options: ['提示并阻断关闭', '审批通过后允许关闭', '仅提示未转单明细'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'demandConvertControl',
        title: '转生产计划/生产订单',
        sub: '生产需求确认后转生产计划或生产订单是否限制操作条件。',
        enabled: false,
        children: [
          {
            key: 'demandConvertCondition',
            title: '转单前置条件',
            sub: '允许转计划或转订单前必须满足的状态。',
            type: 'select',
            value: '已确认',
            options: ['已确认', '审批通过且有产品明细', '仅已确认且未关闭'],
          },
          {
            key: 'demandDirectOrderCondition',
            title: '直接转订单条件',
            sub: '跳过生产计划直接生成生产订单时的处理方式。',
            type: 'select',
            value: 'BOM和工艺已维护',
            options: ['BOM和工艺已维护', '必须填写跳过计划原因', '禁止直接转订单'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'demandSubmitRequired',
        title: '提交前必填校验',
        sub: '生产需求提交或确认前是否校验来源、负责人、产品明细和需求数量。',
        enabled: false,
        children: [
          {
            key: 'demandRequiredFields',
            title: '必填内容',
            sub: '提交生产需求前必须维护的内容。',
            type: 'select',
            value: '负责人 + 产品明细 + 需求数量',
            options: ['负责人 + 产品明细 + 需求数量', '来源单据 + 产品明细 + 需求数量', '负责人 + 计划日期 + 产品明细'],
          },
        ],
      },
      {
        key: 'demandQuantityDateCheck',
        title: '需求数量/日期校验',
        sub: '需求数量和计划日期是否需要满足生产转单条件。',
        enabled: false,
        children: [
          {
            key: 'demandQuantityLimit',
            title: '数量校验',
            sub: '需求数量必须大于0，计划数量不得超过需求数量。',
            type: 'switch',
            enabled: false,
          },
          {
            key: 'demandDateLimit',
            title: '日期校验',
            sub: '计划完成日期不得早于计划开始日期。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
];

const planStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'planSubmitApproval',
        title: '生产计划审批',
        sub: '生产计划提交后是否进入审批，审批通过后允许生成生产订单。',
        enabled: false,
        children: [
          {
            key: 'planSubmitFlow',
            title: '审批流程',
            sub: '生产计划提交时使用的审批流程。',
            type: 'select',
            value: '生产计划审批',
            options: ['生产计划审批', '通用单级审批流'],
          },
          {
            key: 'planApproveResult',
            title: '审批通过后状态',
            sub: '审批通过后生产计划进入的业务状态。',
            type: 'select',
            value: '已批准',
            options: ['已批准', '执行中'],
          },
        ],
      },
      {
        key: 'planKittingExceptionApproval',
        title: '齐套异常审批',
        sub: '齐套检查存在缺料或不可用库存时是否触发异常审批。',
        enabled: false,
        children: [
          {
            key: 'planKittingFlow',
            title: '审批流程',
            sub: '齐套异常处理时使用的审批流程。',
            type: 'select',
            value: '齐套异常审批',
            options: ['齐套异常审批', '生产计划审批'],
          },
          {
            key: 'planKittingAction',
            title: '异常处理方式',
            sub: '齐套异常审批通过后的处理方式。',
            type: 'select',
            value: '允许生成订单并标记缺料',
            options: ['允许生成订单并标记缺料', '阻断生成订单', '生成采购/生产建议'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'planGenerateOrderControl',
        title: '生成生产订单',
        sub: '生产计划生成生产订单是否限制计划状态和齐套结果。',
        enabled: false,
        children: [
          {
            key: 'planGenerateOrderCondition',
            title: '生成订单条件',
            sub: '允许从计划生成生产订单前必须满足的条件。',
            type: 'select',
            value: '计划已批准',
            options: ['计划已批准', '计划已批准且齐套通过', '计划审批通过且有产品明细'],
          },
          {
            key: 'planSourceLineLock',
            title: '来源明细锁定',
            sub: '来源需求带入的产品、数量和交付日期默认锁定。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'planSubmitRequired',
        title: '提交前必填校验',
        sub: '生产计划提交前是否校验来源需求、产品明细、计划数量和计划日期。',
        enabled: false,
        children: [
          {
            key: 'planRequiredFields',
            title: '必填内容',
            sub: '提交生产计划前必须维护的内容。',
            type: 'select',
            value: '计划产品 + 计划数量 + 计划日期',
            options: ['计划产品 + 计划数量 + 计划日期', '来源需求 + 产品明细 + 计划数量', '产品明细 + BOM + 工艺路线'],
          },
        ],
      },
      {
        key: 'planBomRoutePrecheck',
        title: 'BOM/工艺预检查',
        sub: '生成生产订单前是否校验BOM版本和工艺路线。',
        enabled: false,
        children: [
          {
            key: 'planBomRouteCondition',
            title: '预检查要求',
            sub: '生成订单前必须满足的BOM和工艺条件。',
            type: 'select',
            value: 'BOM和工艺均已维护',
            options: ['BOM和工艺均已维护', '仅校验BOM', '仅校验工艺路线'],
          },
        ],
      },
    ],
  },
];

const productionOrderStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'productionOrderApproval',
        title: '生产订单审批',
        sub: '生产订单提交后是否触发审批，审批通过后允许进入待生产。',
        enabled: false,
        children: [
          {
            key: 'productionOrderFlow',
            title: '审批流程',
            sub: '生产订单提交时使用的审批流程。',
            type: 'select',
            value: '生产订单审批',
            options: ['生产订单审批', '通用单级审批流'],
          },
          {
            key: 'productionOrderApproveResult',
            title: '审批通过后状态',
            sub: '审批通过后生产订单进入的业务状态。',
            type: 'select',
            value: '待生产',
            options: ['待生产', '生产中'],
          },
        ],
      },
      {
        key: 'orderVersionLockApproval',
        title: 'BOM/工艺锁版审批',
        sub: '生产订单锁定BOM版本和工艺路线时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'orderVersionLockFlow',
            title: '审批流程',
            sub: 'BOM/工艺锁版使用的审批流程。',
            type: 'select',
            value: 'BOM/工艺锁版审批',
            options: ['BOM/工艺锁版审批', '生产订单审批'],
          },
          {
            key: 'orderAfterLockAction',
            title: '锁版后处理',
            sub: '锁版后是否允许继续编辑BOM和工艺。',
            type: 'select',
            value: '禁止编辑',
            options: ['禁止编辑', '审批通过后可编辑', '仅记录变更原因'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'releaseWorkOrdersControl',
        title: '释放生产工单',
        sub: '生产订单释放工单是否限制订单状态、BOM和工艺锁版状态。',
        enabled: false,
        children: [
          {
            key: 'releaseWorkOrdersCondition',
            title: '释放工单条件',
            sub: '允许释放生产工单前必须满足的条件。',
            type: 'select',
            value: '订单已批准且BOM/工艺已锁版',
            options: ['订单已批准且BOM/工艺已锁版', '订单待生产且有工艺路线', '仅订单已批准'],
          },
          {
            key: 'workOrderSplitMode',
            title: '工单拆解方式',
            sub: '释放工单时按工艺路线拆解生产工单。',
            type: 'select',
            value: '按工艺路线自动拆解',
            options: ['按工艺路线自动拆解', '手动选择工序释放', '按产品一单一工单'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'orderSubmitRequired',
        title: '提交前必填校验',
        sub: '生产订单提交前是否校验来源、产品、数量、BOM和工艺路线。',
        enabled: false,
        children: [
          {
            key: 'orderRequiredFields',
            title: '必填内容',
            sub: '提交生产订单前必须维护的内容。',
            type: 'select',
            value: '产品 + 数量 + BOM + 工艺路线',
            options: ['产品 + 数量 + BOM + 工艺路线', '来源计划 + 产品 + 数量', '产品 + 数量 + 车间产线'],
          },
        ],
      },
      {
        key: 'orderQuantityCheck',
        title: '生产数量校验',
        sub: '生产数量是否不得超过来源计划或需求的未转数量。',
        enabled: false,
        children: [
          {
            key: 'orderQuantityLimit',
            title: '超来源数量处理',
            sub: '生产数量超过来源未转数量时的处理方式。',
            type: 'select',
            value: '阻断提交',
            options: ['阻断提交', '审批通过后允许', '仅提示超来源数量'],
          },
        ],
      },
    ],
  },
];

const workOrderStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'workOrderDispatchApproval',
        title: '工单派工审批',
        sub: '生产工单派工或领工数量异常时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'workOrderDispatchFlow',
            title: '审批流程',
            sub: '工单派工使用的审批流程。',
            type: 'select',
            value: '派工审批',
            options: ['派工审批', '通用单级审批流'],
          },
          {
            key: 'dispatchOverPlanAction',
            title: '超计划派工处理',
            sub: '派工数量超过计划可报数量时的处理方式。',
            type: 'select',
            value: '提示并阻断派工',
            options: ['提示并阻断派工', '审批通过后允许', '仅提示异常'],
          },
        ],
      },
      {
        key: 'reportExceptionApproval',
        title: '报工异常审批',
        sub: '报工数量、合格数量或不良数量异常时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'reportExceptionFlow',
            title: '审批流程',
            sub: '报工异常处理时使用的审批流程。',
            type: 'select',
            value: '报工异常审批',
            options: ['报工异常审批', '派工审批'],
          },
          {
            key: 'reportExceptionAction',
            title: '异常处理方式',
            sub: '报工异常审批通过后的处理方式。',
            type: 'select',
            value: '生成待质检记录',
            options: ['生成待质检记录', '生成返工记录', '仅记录异常原因'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'workOrderMaterialIssueControl',
        title: '工序领料',
        sub: '生产工单执行工序领料时是否限制工单状态和可领数量。',
        enabled: false,
        children: [
          {
            key: 'materialIssueCondition',
            title: '领料条件',
            sub: '允许工序领料前必须满足的条件。',
            type: 'select',
            value: '工单待报工或生产中',
            options: ['工单待报工或生产中', '工单已派工', '仅生产中'],
          },
          {
            key: 'materialIssueWriteback',
            title: '领料回写',
            sub: '领料后回写工序领料状态。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'workOrderReportModeControl',
        title: '报工来源',
        sub: '任务报工是否允许领工派工、派工模式和自由模式。',
        enabled: false,
        children: [
          {
            key: 'allowedReportMode',
            title: '允许报工来源',
            sub: '工单报工允许选择的来源方式。',
            type: 'select',
            value: '领工派工/派工模式/自由模式',
            options: ['领工派工/派工模式/自由模式', '仅领工派工', '禁止自由模式'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'workOrderReportQuantityCheck',
        title: '报工数量校验',
        sub: '报工提交时是否校验本次报工、合格、不良和剩余可报数量。',
        enabled: false,
        children: [
          {
            key: 'reportQuantityLimit',
            title: '报工数量上限',
            sub: '本次报工超过剩余可报数量时的处理方式。',
            type: 'select',
            value: '阻断报工',
            options: ['阻断报工', '审批通过后允许', '仅提示超量'],
          },
          {
            key: 'goodBadQuantityCheck',
            title: '合格/不良数量校验',
            sub: '合格数量和不良数量合计不得超过本次报工数量。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'workOrderReporterRequired',
        title: '报工人校验',
        sub: '报工人是否必须来自当前工序相关车间、产线或班组。',
        enabled: false,
        children: [
          {
            key: 'reporterScope',
            title: '报工人范围',
            sub: '允许选择的报工人员范围。',
            type: 'select',
            value: '当前工序相关人员',
            options: ['当前工序相关人员', '当前车间人员', '全部生产人员'],
          },
        ],
      },
    ],
  },
];

const productionScheduleStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'schedulePublishApproval',
        title: '排班发布审批',
        sub: '排班计划发布时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'schedulePublishFlow',
            title: '审批流程',
            sub: '排班发布时使用的审批流程。',
            type: 'select',
            value: '排班发布审批',
            options: ['排班发布审批', '通用单级审批流'],
          },
          {
            key: 'schedulePublishCondition',
            title: '发布前置条件',
            sub: '允许发布排班前必须满足的条件。',
            type: 'select',
            value: '冲突校验通过',
            options: ['冲突校验通过', '审批通过且无高风险冲突', '计划工时覆盖需求工时'],
          },
        ],
      },
      {
        key: 'scheduleAdjustApproval',
        title: '发布后调班审批',
        sub: '已发布排班调整班次、批量调班或临时加班时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'scheduleAdjustFlow',
            title: '审批流程',
            sub: '发布后调班使用的审批流程。',
            type: 'select',
            value: '加班/调班审批',
            options: ['加班/调班审批', '排班发布审批'],
          },
          {
            key: 'scheduleAdjustReasonRequired',
            title: '调整原因必填',
            sub: '调整班次时必须填写请假、调班或临时加班原因。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'schedulePlanOperationControl',
        title: '发布/归档排班计划',
        sub: '排班计划列表中的发布和归档是否限制计划状态。',
        enabled: false,
        children: [
          {
            key: 'schedulePublishAllowedStatus',
            title: '允许发布状态',
            sub: '允许执行发布的排班计划状态。',
            type: 'select',
            value: '待审批/已通过',
            options: ['待审批/已通过', '仅已通过', '无冲突计划'],
          },
          {
            key: 'scheduleArchiveCondition',
            title: '归档条件',
            sub: '允许归档排班计划前必须满足的条件。',
            type: 'select',
            value: '计划周期已结束',
            options: ['计划周期已结束', '已发布', '无未处理冲突'],
          },
        ],
      },
      {
        key: 'shiftDisableControl',
        title: '批量停用班次',
        sub: '班次管理批量停用是否限制正在使用的班次。',
        enabled: false,
        children: [
          {
            key: 'shiftInUseAction',
            title: '班次已被排班使用时处理方式',
            sub: '班次已被排班计划或排班列表使用时的停用处理。',
            type: 'select',
            value: '提示并阻断停用',
            options: ['提示并阻断停用', '审批通过后允许停用', '仅提示影响范围'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'scheduleConflictCheck',
        title: '冲突校验',
        sub: '排班发布前是否校验重叠班次、资质不匹配、产能不足和周工时超限。',
        enabled: false,
        children: [
          {
            key: 'scheduleConflictAction',
            title: '冲突处理方式',
            sub: '发布前发现冲突时的处理方式。',
            type: 'select',
            value: '高风险阻断，低风险预警',
            options: ['高风险阻断，低风险预警', '全部阻断发布', '仅预警不阻断'],
          },
          {
            key: 'weeklyHoursLimit',
            title: '周工时上限',
            sub: '默认按员工周工时上限校验排班。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'schedulePlanRequired',
        title: '排班计划必填校验',
        sub: '新增排班计划前是否校验班组、周期、工作日历和循环模式。',
        enabled: false,
        children: [
          {
            key: 'schedulePlanRequiredFields',
            title: '必填内容',
            sub: '保存排班计划前必须维护的内容。',
            type: 'select',
            value: '班组 + 周期 + 工作日历 + 循环模式',
            options: ['班组 + 周期 + 工作日历 + 循环模式', '班组 + 周期 + 计划工时', '班组 + 周期 + 冲突校验'],
          },
        ],
      },
    ],
  },
];

const outsourceStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'outsourceOrderApproval',
        title: '委外加工审批',
        sub: '委外加工单提交后是否触发审批，审批通过后进入待发料。',
        enabled: false,
        children: [
          {
            key: 'outsourceOrderFlow',
            title: '审批流程',
            sub: '委外加工提交时使用的审批流程。',
            type: 'select',
            value: '委外加工审批',
            options: ['委外加工审批', '通用单级审批流'],
          },
          {
            key: 'outsourceApproveResult',
            title: '审批通过后状态',
            sub: '审批通过后委外单进入的业务状态。',
            type: 'select',
            value: '待发料',
            options: ['待发料', '加工中'],
          },
        ],
      },
      {
        key: 'outsourceIssueApproval',
        title: '委外发料审批',
        sub: '委外发料或超委外数量发料时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'outsourceIssueFlow',
            title: '审批流程',
            sub: '委外发料使用的审批流程。',
            type: 'select',
            value: '委外发料审批',
            options: ['委外发料审批', '委外加工审批'],
          },
          {
            key: 'outsourceIssueAfterApprove',
            title: '审批通过后处理',
            sub: '发料审批通过后的处理方式。',
            type: 'select',
            value: '生成仓储出库',
            options: ['生成仓储出库', '仅记录发料', '生成待出库通知'],
          },
        ],
      },
    ],
  },
  {
    key: 'permissions',
    label: '操作权限策略',
    rows: [
      {
        key: 'outsourceScopeControl',
        title: '选择委外范围',
        sub: '新增委外时是否限制整单委外或工序委外。',
        enabled: false,
        children: [
          {
            key: 'outsourceAllowedScope',
            title: '允许委外范围',
            sub: '委外加工允许选择的委外范围。',
            type: 'select',
            value: '整单委外/工序委外',
            options: ['整单委外/工序委外', '仅工序委外', '仅整单委外'],
          },
          {
            key: 'outsourceSupplierRequired',
            title: '委外加工商必填',
            sub: '提交委外单前必须选择委外加工商。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'outsourceIssueReceiveControl',
        title: '发料/收货',
        sub: '委外单执行发料和收货是否限制状态。',
        enabled: false,
        children: [
          {
            key: 'outsourceIssueCondition',
            title: '发料条件',
            sub: '允许执行委外发料前必须满足的条件。',
            type: 'select',
            value: '审批通过且待发料',
            options: ['审批通过且待发料', '待发料或部分发料', '加工商已确认'],
          },
          {
            key: 'outsourceReceiveCondition',
            title: '收货条件',
            sub: '允许执行委外收货前必须满足的条件。',
            type: 'select',
            value: '已发料或加工中',
            options: ['已发料或加工中', '加工中', '加工商已送货'],
          },
        ],
      },
    ],
  },
  {
    key: 'validation',
    label: '数据校验策略',
    rows: [
      {
        key: 'outsourceSubmitRequired',
        title: '提交前必填校验',
        sub: '委外加工提交前是否校验委外方式、加工商、委外数量、交付日期和委外明细。',
        enabled: false,
        children: [
          {
            key: 'outsourceRequiredFields',
            title: '必填内容',
            sub: '提交委外加工前必须维护的内容。',
            type: 'select',
            value: '委外方式 + 加工商 + 委外明细',
            options: ['委外方式 + 加工商 + 委外明细', '来源单据 + 加工商 + 委外数量', '加工商 + 发料方式 + 交付日期 + 委外明细'],
          },
        ],
      },
      {
        key: 'outsourceIssueReceiveQuantityCheck',
        title: '发料/入库数量校验',
        sub: '委外发料和收货入库时是否校验应发、已发、合格和本次入库数量。',
        enabled: false,
        children: [
          {
            key: 'outsourceIssueQuantityLimit',
            title: '发料数量上限',
            sub: '累计发料不得超过应发数量。',
            type: 'switch',
            enabled: false,
          },
          {
            key: 'outsourceReceiveQualityCondition',
            title: '入库质量条件',
            sub: '委外收货后必须质检合格或让步后才能入库。',
            type: 'select',
            value: '质检合格或让步',
            options: ['质检合格或让步', '必须质检合格', '仅记录质检结果'],
          },
        ],
      },
    ],
  },
];

export const operationSettingTemplates: Record<OperationSettingModule, OperationSettingTemplate> = {
  rdDocs: {
    ...templateBase('rdDocs', 'rd', '文档', 'rd-documents', '/rd/doc', 'DOC'),
    extraLists: {
      categories: docCategoryList(),
    },
    fields: {
      addText: '新增文档字段',
      scopes: [
        { key: 'basic', label: '基本信息' },
        { key: 'security', label: '安全与外发' },
        { key: 'content', label: '正文/附件' },
      ],
      rows: fieldRows('rd_doc', [
        ['文档编码', 'code', '自动编号', 'basic', true],
        ['文档名称', 'name', '文本', 'basic', true],
        ['所属分类', 'category', '分类选择器', 'basic', true],
        ['版本号', 'version', '文本', 'basic', false],
        ['编制人', 'ownerName', '人员选择', 'basic', false],
        ['生效日期', 'effectiveDate', '日期', 'basic', false],
        ['失效日期', 'expireDate', '日期', 'basic', false],
        ['电子签章', 'signaturePolicy', '下拉选项', 'security', false],
        ['水印策略', 'watermarkPolicy', '下拉选项', 'security', false],
        ['外发权限', 'externalPolicy', '下拉选项', 'security', false],
        ['下载审批', 'downloadApproval', '下拉选项', 'security', false],
        ['正文内容', 'content', '富文本', 'content', false],
        ['附件', 'attachments', '附件', 'content', false],
      ]),
    },
    approvals: { addText: '新增文档审批规则', methods: operationApprovalMethods, rows: approvalRows('rd_doc', [['文档发布审批', '文档发布', '研发主管'], ['文档外发下载审批', '外发下载', '质量主管']]) },
    strategies: rdStrategyTabs('文档', rdDocStrategies),
  },
  rdProjects: {
    ...templateBase('rdProjects', 'rd', '项目', 'rd-projects', '/rd/projects', 'PRJ'),
    extraLists: {
      categories: categoryList('rd_project', '项目', [['研发项目', '项目库', 'rd', 3], ['工程项目', '项目库', 'eng', 2], ['合作项目', '项目库', 'coop', 1], ['产品研发', '研发项目', 'rd_product', 2]]),
    },
    fields: {
      addText: '新增项目字段',
      scopes: [
        { key: 'basic', label: '基本信息' },
        { key: 'members', label: '成员/里程碑' },
        { key: 'business', label: 'BOM/报价/生产' },
      ],
      rows: fieldRows('rd_project', [
        ['项目编号', 'code', '自动编号', 'basic', true],
        ['项目名称', 'name', '文本', 'basic', true],
        ['项目分类', 'category', '下拉选项', 'basic', true],
        ['项目状态', 'status', '状态', 'basic', false],
        ['优先级', 'priority', '下拉选项', 'basic', false],
        ['负责人', 'ownerName', '人员选择', 'basic', true],
        ['开始日期', 'startDate', '日期', 'basic', false],
        ['计划完成日期', 'planEndDate', '日期', 'basic', false],
        ['进度', 'progress', '数字', 'basic', false],
        ['来源主体', 'sourceSubject', '关联单据', 'business', false],
        ['项目成员', 'members', '子表', 'members', false],
        ['里程碑', 'milestones', '子表', 'members', false],
        ['项目BOM', 'projectBom', '关联单据', 'business', false],
        ['项目报价', 'projectQuote', '金额', 'business', false],
        ['生产需求', 'productionDemand', '关联单据', 'business', false],
      ]),
    },
    approvals: { addText: '新增项目审批规则', methods: operationApprovalMethods, rows: approvalRows('rd_project', [['项目立项审批', '新增项目', '研发主管'], ['项目报价锁定审批', '报价确认', '财务复核']]) },
    strategies: rdStrategyTabs('项目', rdProjectStrategies),
  },
  rdProducts: {
    ...templateBase('rdProducts', 'rd', '产品', 'rd-products', '/rd/products', 'CP'),
    extraLists: {
      categories: categoryList('rd_product', '产品', [['成品', '产品库', 'fin', 3], ['半成品', '产品库', 'semi', 2], ['原材料', '产品库', 'raw', 2], ['智能终端', '成品', 'cat-a', 2]]),
      brands: brandList('rd_product', '产品', [
        ['傲为', 'AW', '工厂自产'],
        ['华强电子', 'HQDZ', '工厂自产'],
        ['华南铝材', 'HNLC', '工厂自产'],
        ['宏业五金', 'HYWJ', '工厂自产'],
        ['客户品牌', 'CUSTOMER', '工厂自产'],
        ['无品牌', 'NONE', '工厂自产'],
      ]),
    },
    fields: {
      addText: '新增产品字段',
      scopes: [
        { key: 'basic', label: '产品信息' },
        { key: 'sales', label: '销售/质检' },
        { key: 'stock', label: '库存/物码' },
      ],
      rows: fieldRows('rd_product', [
        ['产品编号', 'code', '自动编号', 'basic', true],
        ['产品名称', 'name', '文本', 'basic', true],
        ['别名码', 'alias', '文本', 'basic', false],
        ['产品分类', 'category', '下拉选项', 'basic', true],
        ['品牌', 'brand', '下拉选项', 'basic', false],
        ['产品型号', 'model', '文本', 'basic', false],
        ['规格型号选项', 'modelOptions', '子表', 'basic', false],
        ['产品规格', 'spec', '文本', 'basic', false],
        ['产品单位', 'unit', '下拉选项', 'basic', true],
        ['获取方式', 'source', '下拉选项', 'basic', false],
        ['产品状态', 'state', '状态', 'basic', false],
        ['销售控制', 'salesControl', '下拉选项', 'sales', false],
        ['建议售价', 'price', '金额', 'sales', false],
        ['质检方案', 'qcPlan', '关联单据', 'sales', false],
        ['执行标准', 'execStd', '文本', 'sales', false],
        ['安全库存', 'safeStock', '数字', 'stock', false],
        ['存储位置', 'storage', '文本', 'stock', false],
        ['物码管控', 'codeControl', '下拉选项', 'stock', false],
      ]),
    },
    approvals: { addText: '新增产品审批规则', methods: operationApprovalMethods, rows: approvalRows('rd_product', [['产品建档审批', '新增产品', '研发主管'], ['产品销售控制审批', '审批销售', '销售主管']]) },
    strategies: rdStrategyTabs('产品', rdProductStrategies),
  },
  rdMaterials: {
    ...templateBase('rdMaterials', 'rd', '物料', 'rd-materials', '/rd/materials', 'MAT'),
    extraLists: {
      categories: categoryList('rd_material', '物料', [['原材料', '物料库', 'raw', 28], ['辅料', '物料库', 'aux', 12], ['半成品', '物料库', 'semi', 18], ['包装材料', '物料库', 'pkg', 9]]),
      brands: brandList('rd_material', '物料', [
        ['ST', 'ST', '海南智造客户'],
        ['国芯', 'GX', '深圳启明客户'],
        ['国巨', 'YAGEO', '广州智造客户'],
        ['宏业五金', 'HYWJ', '佛山装备客户'],
        ['华美包装', 'HMBZ', '东莞包装客户'],
        ['通用', 'GEN', '通用客户'],
      ]),
    },
    fields: {
      addText: '新增物料字段',
      scopes: [
        { key: 'basic', label: '物料档案' },
        { key: 'spec', label: '规格属性' },
        { key: 'substitute', label: '替代/引用' },
      ],
      rows: fieldRows('rd_material', [
        ['物料编码', 'code', '自动编号', 'basic', true],
        ['物料名称', 'name', '文本', 'basic', true],
        ['物料类型', 'type', '下拉选项', 'basic', true],
        ['物料分类', 'category', '下拉选项', 'basic', true],
        ['规格型号', 'spec', '文本', 'spec', false],
        ['单位', 'unit', '下拉选项', 'spec', true],
        ['品牌', 'brand', '下拉选项', 'spec', false],
        ['材质', 'material', '文本', 'spec', false],
        ['颜色', 'color', '文本', 'spec', false],
        ['替代料', 'substitutes', '子表', 'substitute', false],
        ['使用范围', 'useScope', '文本', 'substitute', false],
        ['供应商', 'supplierName', '供应商选择', 'basic', false],
        ['BOM引用', 'bomRefs', '子表', 'substitute', false],
      ]),
    },
    approvals: { addText: '新增物料审批规则', methods: operationApprovalMethods, rows: approvalRows('rd_material', [['物料建档审批', '新增物料', '研发主管'], ['替代料生效审批', '替代料', '工艺主管']]) },
    strategies: rdStrategyTabs('物料', rdMaterialStrategies),
  },
  rdProcesses: {
    ...templateBase('rdProcesses', 'rd', '工序', 'rd-processes', '/rd/processes', 'PROC'),
    extraLists: {
      categories: categoryList('rd_process', '工序', [['生产工序', '工序库', 'prod', 18], ['检验工序', '工序库', 'qc', 8], ['委外工序', '工序库', 'outsource', 6], ['包装工序', '工序库', 'pkg', 5]]),
    },
    fields: {
      addText: '新增工序字段',
      scopes: [
        { key: 'basic', label: '工序档案' },
        { key: 'resource', label: '资源要求' },
        { key: 'quality', label: '质检点' },
      ],
      rows: fieldRows('rd_process', [
        ['工序编码', 'code', '自动编号', 'basic', true],
        ['工序名称', 'name', '文本', 'basic', true],
        ['工序类型', 'type', '下拉选项', 'basic', true],
        ['工序参数', 'parameters', '子表', 'basic', false],
        ['标准工时', 'standardTime', '数字', 'resource', false],
        ['准备工时', 'prepareTime', '数字', 'resource', false],
        ['设备要求', 'equipment', '文本', 'resource', false],
        ['工装要求', 'tooling', '文本', 'resource', false],
        ['人员技能', 'skill', '文本', 'resource', false],
        ['质检点', 'qcPoints', '子表', 'quality', false],
        ['资源要求', 'resources', '子表', 'resource', false],
        ['适用范围', 'useScope', '文本', 'basic', false],
      ]),
    },
    approvals: { addText: '新增工序审批规则', methods: operationApprovalMethods, rows: approvalRows('rd_process', [['工序发布审批', '新增工序', '工艺主管'], ['工序变更审批', '变更影响', '生产主管']]) },
    strategies: rdStrategyTabs('工序', rdProcessStrategies),
  },
  rdCrafts: {
    ...templateBase('rdCrafts', 'rd', '工艺', 'rd-crafts', '/rd/crafts', 'CRAFT'),
    extraLists: {
      categories: categoryList('rd_craft', '工艺', [['标准工艺', '工艺库', 'std', 12], ['试制工艺', '工艺库', 'trial', 5], ['委外工艺', '工艺库', 'outsource', 4], ['返工工艺', '工艺库', 'rework', 3]]),
    },
    fields: {
      addText: '新增工艺字段',
      scopes: [
        { key: 'basic', label: '工艺信息' },
        { key: 'process', label: '工序明细' },
        { key: 'release', label: '发布记录' },
      ],
      rows: fieldRows('rd_craft', [
        ['工艺编码', 'code', '自动编号', 'basic', true],
        ['工艺名称', 'name', '文本', 'basic', true],
        ['工艺类型', 'type', '下拉选项', 'basic', true],
        ['适用产品', 'productName', '对象选择', 'basic', true],
        ['工艺版本', 'version', '文本', 'basic', false],
        ['工艺状态', 'status', '状态', 'basic', false],
        ['工序明细', 'processLines', '子表', 'process', true],
        ['设备要求', 'equipment', '文本', 'process', false],
        ['工装要求', 'tooling', '文本', 'process', false],
        ['质检点', 'qcPoints', '子表', 'process', false],
        ['发布人', 'publisherName', '人员选择', 'release', false],
        ['发布时间', 'publishedAt', '日期', 'release', false],
        ['变更说明', 'changeRemark', '富文本', 'release', false],
      ]),
    },
    approvals: { addText: '新增工艺审批规则', methods: operationApprovalMethods, rows: approvalRows('rd_craft', [['工艺发布审批', '发布工艺', '工艺主管'], ['工艺变更审批', '版本变更', '研发主管']]) },
    strategies: rdStrategyTabs('工艺', rdCraftStrategies),
  },
  rdBoms: {
    ...templateBase('rdBoms', 'rd', 'BOM', 'rd-boms', '/rd/bom', 'BOM'),
    extraLists: {
      categories: categoryList('rd_bom', 'BOM', [['成品BOM', 'BOM库', 'finished', 16], ['半成品BOM', 'BOM库', 'semi', 12], ['工程BOM', 'BOM库', 'engineering', 8], ['虚拟BOM', 'BOM库', 'virtual', 5]]),
      template: bomTemplateList(),
    },
    fields: {
      addText: '新增BOM字段',
      scopes: [
        { key: 'basic', label: 'BOM信息' },
        { key: 'structure', label: 'BOM结构' },
        { key: 'release', label: '替代/发布' },
      ],
      rows: fieldRows('rd_bom', [
        ['BOM编码', 'code', '自动编号', 'basic', true],
        ['BOM名称', 'name', '文本', 'basic', true],
        ['BOM分类', 'type', '下拉选项', 'basic', true],
        ['适用产品', 'productName', '对象选择', 'basic', true],
        ['版本号', 'version', '文本', 'basic', false],
        ['BOM状态', 'status', '状态', 'basic', false],
        ['BOM结构', 'lines', '子表', 'structure', true],
        ['层级', 'level', '文本', 'structure', false],
        ['物料编码', 'materialCode', '对象选择', 'structure', true],
        ['用量', 'usageQty', '数字', 'structure', true],
        ['损耗率', 'lossRate', '数字', 'structure', false],
        ['替代料', 'substitutes', '子表', 'release', false],
        ['发布记录', 'releaseRecords', '子表', 'release', false],
        ['模板', 'templateId', '下拉选项', 'basic', false],
      ]),
    },
    approvals: { addText: '新增BOM审批规则', methods: operationApprovalMethods, rows: approvalRows('rd_bom', [['BOM发布审批', '发布BOM', '研发主管'], ['替代料审批', '替代物料', '工艺主管']]) },
    strategies: rdStrategyTabs('BOM', rdBomStrategies),
  },
  warehouseStocks: {
    ...templateBase('warehouseStocks', 'warehouse', '库存', 'inventory-stocks', '/warehouse/inventory-stocks', 'STK'),
    fields: {
      addText: '新增库存字段',
      scopes: [
        { key: 'material', label: '物料信息' },
        { key: 'quantity', label: '库存数量' },
        { key: 'trace', label: '批次/追溯' },
      ],
      rows: fieldRows('warehouse_stock', [
        ['台账编号', 'ledgerNo', '文本', 'trace', true],
        ['物料编码', 'materialCode', '文本', 'material', true],
        ['物料名称', 'materialName', '文本', 'material', true],
        ['规格型号', 'spec', '文本', 'material', false],
        ['物料分类', 'categoryName', '下拉选项', 'material', false],
        ['仓库', 'warehouseName', '下拉选项', 'quantity', true],
        ['库位', 'locationName', '下拉选项', 'quantity', false],
        ['批次', 'batchNo', '文本', 'trace', false],
        ['库存数量', 'stockQuantity', '数字', 'quantity', true],
        ['可用数量', 'availableQuantity', '数字', 'quantity', true],
        ['占用数量', 'occupiedQuantity', '数字', 'quantity', false],
        ['冻结数量', 'lockedQuantity', '数字', 'quantity', false],
        ['在途数量', 'inTransitQuantity', '数字', 'quantity', false],
        ['质量状态', 'qualityStatusName', '状态', 'trace', false],
        ['成本层', 'costLayer', '文本', 'trace', false],
      ]),
    },
    approvals: { addText: '新增库存审批规则', methods: operationApprovalMethods, rows: approvalRows('warehouse_stock', [['库存调整审批', '库存调整', '仓库主管'], ['冻结/释放审批', '库存冻结', '质量主管']]) },
    strategies: { title: '库存策略设置', description: '按库存页面真实动作配置冻结/释放、可用量、批次、质量状态和成本层校验。', tabs: warehouseStockStrategies },
  },
  warehouseInbounds: {
    ...templateBase('warehouseInbounds', 'warehouse', '入库', 'warehouse-inbounds', '/warehouse/warehouse-inbounds', 'RK'),
    fields: {
      addText: '新增入库字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '物品明细' },
        { key: 'post', label: '质检/上架/过账' },
      ],
      rows: fieldRows('warehouse_inbound', [
        ['入库主题', 'subject', '文本', 'basic', true],
        ['入库单号', 'code', '自动编号', 'basic', true],
        ['入库类型', 'inboundTypeName', '下拉选项', 'basic', true],
        ['入库仓库', 'warehouseName', '下拉选项', 'basic', true],
        ['关联单据', 'relatedCode', '关联单据', 'basic', false],
        ['入库部门', 'departmentName', '文本', 'basic', false],
        ['入库人员', 'personName', '人员选择', 'basic', true],
        ['入库日期', 'inboundDate', '日期', 'basic', true],
        ['经办人', 'operatorName', '人员选择', 'basic', false],
        ['物品明细', 'lines', '子表', 'detail', true],
        ['批次号', 'batchNo', '文本', 'detail', false],
        ['序列号', 'serialNo', '文本', 'detail', false],
        ['库位', 'locationName', '下拉选项', 'detail', false],
        ['质检状态', 'qualityStatusName', '状态', 'post', false],
        ['上架状态', 'lineStatusName', '状态', 'post', false],
        ['过账状态', 'postStatus', '状态', 'post', false],
      ]),
    },
    approvals: { addText: '新增入库审批规则', methods: operationApprovalMethods, rows: approvalRows('warehouse_inbound', [['直接入库审批', '直接入库', '仓库主管'], ['让步入库审批', '质检让步', '质量主管']]) },
    strategies: { title: '入库策略设置', description: '按入库页面真实动作配置直接入库、让步入库、来源选择、批量上架和过账校验。', tabs: inboundStrategies },
  },
  warehouseOutbounds: {
    ...templateBase('warehouseOutbounds', 'warehouse', '出库', 'warehouse-outbounds', '/warehouse/warehouse-outbounds', 'CK'),
    fields: {
      addText: '新增出库字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '物品明细' },
        { key: 'pick', label: '拣货/复核/过账' },
      ],
      rows: fieldRows('warehouse_outbound', [
        ['出库主题', 'subject', '文本', 'basic', true],
        ['出库单号', 'code', '自动编号', 'basic', true],
        ['出库类型', 'outboundTypeName', '下拉选项', 'basic', true],
        ['出库仓库', 'warehouseName', '下拉选项', 'basic', true],
        ['关联单据', 'relatedCode', '关联单据', 'basic', false],
        ['出库部门', 'departmentName', '文本', 'basic', false],
        ['出库人员', 'personName', '人员选择', 'basic', true],
        ['出库日期', 'outboundDate', '日期', 'basic', true],
        ['目标对象', 'targetName', '文本', 'basic', false],
        ['目的地', 'destination', '文本', 'basic', false],
        ['物品明细', 'lines', '子表', 'detail', true],
        ['推荐库位', 'locationName', '下拉选项', 'pick', false],
        ['拣货数量', 'pickQuantity', '数字', 'pick', false],
        ['复核数量', 'checkQuantity', '数字', 'pick', false],
        ['发货数量', 'shipQuantity', '数字', 'pick', false],
        ['OQC状态', 'oqcStatusName', '状态', 'pick', false],
        ['过账状态', 'postStatus', '状态', 'pick', false],
      ]),
    },
    approvals: { addText: '新增出库审批规则', methods: operationApprovalMethods, rows: approvalRows('warehouse_outbound', [['直接出库审批', '直接出库', '仓库主管'], ['短拣差异审批', '拣货复核', '质量主管']]) },
    strategies: { title: '出库策略设置', description: '按出库页面真实动作配置直接出库、短拣差异、来源选择、批量拣货、OQC放行和过账校验。', tabs: outboundStrategies },
  },
  warehouseTransfers: {
    ...templateBase('warehouseTransfers', 'warehouse', '调拨', 'warehouse-transfers', '/warehouse/warehouse-transfers', 'DB'),
    fields: {
      addText: '新增调拨字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '调拨明细' },
        { key: 'difference', label: '差异处理' },
      ],
      rows: fieldRows('warehouse_transfer', [
        ['调拨主题', 'subject', '文本', 'basic', true],
        ['调拨单号', 'code', '自动编号', 'basic', true],
        ['调出仓库', 'fromWarehouseName', '下拉选项', 'basic', true],
        ['调入仓库', 'toWarehouseName', '下拉选项', 'basic', true],
        ['调拨日期', 'transferDate', '日期', 'basic', true],
        ['调拨人', 'operatorName', '人员选择', 'basic', true],
        ['调拨部门', 'departmentName', '文本', 'basic', false],
        ['调拨原因', 'reason', '文本', 'basic', false],
        ['物料明细', 'lines', '子表', 'detail', true],
        ['调出库位', 'fromLocationName', '下拉选项', 'detail', true],
        ['调入库位', 'toLocationName', '下拉选项', 'detail', true],
        ['调拨数量', 'quantity', '数字', 'detail', true],
        ['调出确认', 'outQuantity', '数字', 'detail', false],
        ['调入确认', 'inQuantity', '数字', 'detail', false],
        ['差异数量', 'differenceQuantity', '数字', 'difference', false],
        ['差异处理方式', 'differenceDispose', '下拉选项', 'difference', false],
      ]),
    },
    approvals: { addText: '新增调拨审批规则', methods: operationApprovalMethods, rows: approvalRows('warehouse_transfer', [['调拨提交审批', '新增调拨', '仓库主管'], ['调拨差异审批', '差异处理', '财务复核']]) },
    strategies: { title: '调拨策略设置', description: '按调拨页面真实动作配置提交审批、调出调入确认、差异处理和可调拨数量校验。', tabs: transferStrategies },
  },
  inventoryCounts: {
    ...templateBase('inventoryCounts', 'warehouse', '盘点', 'inventory-counts', '/warehouse/inventory-counts', 'PD'),
    fields: {
      addText: '新增盘点字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '盘点明细' },
        { key: 'adjust', label: '差异调整' },
      ],
      rows: fieldRows('inventory_count', [
        ['盘点主题', 'subject', '文本', 'basic', true],
        ['盘点编号', 'code', '自动编号', 'basic', true],
        ['盘点仓库', 'warehouseName', '下拉选项', 'basic', true],
        ['盘点范围', 'scope', '下拉选项', 'basic', true],
        ['锁库范围', 'lockScope', '文本', 'basic', false],
        ['是否锁库', 'locked', '下拉选项', 'basic', true],
        ['盘点人', 'checkerName', '人员选择', 'basic', true],
        ['盘点日期', 'countDate', '日期', 'basic', true],
        ['物品明细', 'lines', '子表', 'detail', true],
        ['账面数量', 'bookQuantity', '数字', 'detail', true],
        ['实盘数量', 'actualQuantity', '数字', 'detail', true],
        ['复盘数量', 'recheckQuantity', '数字', 'detail', false],
        ['差异数量', 'differenceQuantity', '数字', 'adjust', false],
        ['差异原因', 'differenceReason', '下拉选项', 'adjust', false],
        ['调整单号', 'adjustmentCode', '关联单据', 'adjust', false],
        ['处理方式', 'disposeMethod', '下拉选项', 'adjust', false],
      ]),
    },
    approvals: { addText: '新增盘点审批规则', methods: operationApprovalMethods, rows: approvalRows('inventory_count', [['盘点计划审批', '盘点计划', '仓库主管'], ['盘点差异审批', '差异调整', '财务复核']]) },
    strategies: { title: '盘点策略设置', description: '按盘点页面真实动作配置计划审批、锁库、开始盘点、复盘、差异确认和调整校验。', tabs: inventoryStrategies },
  },
  warehouseLocations: {
    ...templateBase('warehouseLocations', 'warehouse', '库位', 'warehouse-locations', '/warehouse/warehouse-locations', 'KW'),
    fields: {
      addText: '新增库位字段',
      scopes: [
        { key: 'warehouse', label: '仓库' },
        { key: 'area', label: '库区' },
        { key: 'location', label: '库位' },
      ],
      rows: fieldRows('warehouse_location', [
        ['新增类型', 'createType', '下拉选项', 'warehouse', true],
        ['仓库名称', 'warehouseName', '文本', 'warehouse', true],
        ['仓库编码', 'warehouseCode', '自动编号', 'warehouse', false],
        ['仓库类型', 'warehouseType', '下拉选项', 'warehouse', true],
        ['仓库负责人', 'managerName', '人员选择', 'warehouse', true],
        ['联系方式', 'phone', '文本', 'warehouse', false],
        ['仓库地址', 'address', '文本', 'warehouse', true],
        ['温区', 'temperatureZone', '下拉选项', 'area', false],
        ['容量', 'capacity', '数字', 'area', false],
        ['库区名称', 'areaName', '文本', 'area', true],
        ['库区编码', 'areaCode', '自动编号', 'area', false],
        ['库位名称', 'locationName', '文本', 'location', true],
        ['库位编码', 'locationCode', '自动编号', 'location', false],
        ['库位状态', 'statusName', '状态', 'location', true],
      ]),
    },
    approvals: { addText: '新增库位审批规则', methods: operationApprovalMethods, rows: approvalRows('warehouse_location', [['仓库启停审批', '仓库维护', '仓库主管'], ['库位容量变更审批', '库位维护', '仓库主管']]) },
    strategies: { title: '库位策略设置', description: '按仓库库位页面真实动作配置启停、容量变更、新增类型、必填和上架库位校验。', tabs: locationStrategies },
  },
  productionDemands: {
    ...templateBase('productionDemands', 'production', '生产需求', 'production-demands', '/production/production-demands', 'MR'),
    fields: {
      addText: '新增生产需求字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'source', label: '来源信息' },
        { key: 'detail', label: '产品明细' },
      ],
      rows: fieldRows('production_demand', [
        ['需求主题', 'subject', '文本', 'basic', true],
        ['需求编号', 'code', '自动编号', 'basic', true],
        ['生产来源', 'sourceTypeName', '下拉选项', 'source', true],
        ['销售订单', 'sourceCode', '关联单据', 'source', false],
        ['客户名称', 'customerName', '文本', 'source', false],
        ['订单交付日期', 'deliveryDate', '日期', 'source', false],
        ['生产项目', 'projectName', '文本', 'basic', false],
        ['目标仓库', 'targetWarehouseName', '下拉选项', 'basic', false],
        ['生产部门', 'departmentName', '文本', 'basic', false],
        ['负责人', 'ownerName', '人员选择', 'basic', true],
        ['计划开始日期', 'planStartDate', '日期', 'basic', false],
        ['计划完成日期', 'planEndDate', '日期', 'basic', false],
        ['优先级', 'priorityName', '下拉选项', 'basic', false],
        ['产品明细', 'lines', '子表', 'detail', true],
        ['需求数量', 'demandQuantity', '数字', 'detail', true],
        ['计划数量', 'planQuantity', '数字', 'detail', false],
        ['BOM版本', 'bomVersion', '文本', 'detail', false],
        ['工艺路线', 'routeCode', '文本', 'detail', false],
      ]),
    },
    approvals: { addText: '新增生产需求审批规则', methods: operationApprovalMethods, rows: approvalRows('production_demand', [['生产需求确认审批', '需求确认', '生产主管'], ['需求转订单审批', '需求转单', '计划员']]) },
    strategies: { title: '生产需求策略设置', description: '按生产需求页面真实动作配置确认、关闭、转计划、转订单和提交前校验策略。', tabs: demandStrategies },
  },
  productionPlans: {
    ...templateBase('productionPlans', 'production', '生产计划', 'production-plans', '/production/production-plans', 'MP'),
    fields: {
      addText: '新增生产计划字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '产品明细' },
        { key: 'execution', label: '执行追踪' },
      ],
      rows: fieldRows('production_plan', [
        ['计划主题', 'subject', '文本', 'basic', true],
        ['计划编号', 'code', '自动编号', 'basic', true],
        ['来源需求', 'sourceDemandCode', '关联单据', 'basic', false],
        ['来源明细', 'sourceLineCode', '文本', 'detail', false],
        ['来源客户/项目', 'sourceCustomer', '文本', 'basic', false],
        ['计划产品', 'productName', '文本', 'detail', true],
        ['计划数量', 'planQuantity', '数字', 'detail', true],
        ['计划开始', 'planStartDate', '日期', 'basic', true],
        ['计划完成', 'planEndDate', '日期', 'basic', true],
        ['产品明细', 'lines', '子表', 'detail', true],
        ['齐套预估', 'kittingStatusName', '状态', 'execution', false],
        ['计划进度', 'progress', '数字', 'execution', false],
        ['计划说明', 'remarkText', '富文本', 'execution', false],
      ]),
    },
    approvals: { addText: '新增生产计划审批规则', methods: operationApprovalMethods, rows: approvalRows('production_plan', [['生产计划审批', '新增计划', '计划主管'], ['齐套异常审批', '齐套检查', '生产主管']]) },
    strategies: { title: '生产计划策略设置', description: '按生产计划页面真实动作配置计划审批、齐套异常、生成生产订单和 BOM/工艺预检查策略。', tabs: planStrategies },
  },
  productionOrders: {
    ...templateBase('productionOrders', 'production', '生产订单', 'production-orders', '/production/production-orders', 'MO'),
    fields: {
      addText: '新增生产订单字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'version', label: 'BOM/工艺' },
        { key: 'work', label: '工单明细' },
      ],
      rows: fieldRows('production_order', [
        ['生产主题', 'subject', '文本', 'basic', true],
        ['生产编号', 'code', '自动编号', 'basic', true],
        ['来源需求', 'sourceDemandCode', '关联单据', 'basic', false],
        ['来源明细', 'sourceLineCode', '文本', 'basic', false],
        ['来源客户/项目', 'sourceCustomer', '文本', 'basic', false],
        ['生产产品', 'productName', '文本', 'basic', true],
        ['生产数量', 'quantity', '数字', 'basic', true],
        ['BOM版本', 'bomVersion', '文本', 'version', true],
        ['工艺路线', 'routeCode', '文本', 'version', true],
        ['生产状态', 'statusName', '状态', 'basic', false],
        ['工单明细', 'workOrders', '子表', 'work', false],
        ['领退料记录', 'materialRecords', '子表', 'work', false],
        ['订单详情', 'remarkText', '富文本', 'work', false],
      ]),
    },
    approvals: { addText: '新增生产订单审批规则', methods: operationApprovalMethods, rows: approvalRows('production_order', [['生产订单审批', '新增订单', '生产主管'], ['BOM/工艺锁版审批', '锁版发布', '工艺主管']]) },
    strategies: { title: '生产订单策略设置', description: '按生产订单页面真实动作配置订单审批、BOM/工艺锁版、释放工单和生产数量校验策略。', tabs: productionOrderStrategies },
  },
  productionWorkOrders: {
    ...templateBase('productionWorkOrders', 'production', '生产工单', 'production-work-orders', '/production/production-work-orders', 'WO'),
    fields: {
      addText: '新增生产工单字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'dispatch', label: '领工/派工' },
        { key: 'report', label: '报工/质检' },
      ],
      rows: fieldRows('production_work_order', [
        ['生产工单', 'workOrderCode', '自动编号', 'basic', true],
        ['生产产品', 'productName', '文本', 'basic', true],
        ['工序', 'processName', '文本', 'basic', true],
        ['工位/产线', 'stationName', '文本', 'basic', false],
        ['计划数量', 'plannedQuantity', '数字', 'basic', true],
        ['可领取数量', 'claimableQuantity', '数字', 'dispatch', false],
        ['已派工数量', 'dispatchedQuantity', '数字', 'dispatch', false],
        ['已报工数量', 'reportedQuantity', '数字', 'report', false],
        ['合格数量', 'qualifiedQuantity', '数字', 'report', false],
        ['不良数量', 'badQuantity', '数字', 'report', false],
        ['报工来源', 'sourceMode', '下拉选项', 'report', false],
        ['报工人', 'reporterName', '人员选择', 'report', false],
        ['报工时间', 'reportedAt', '日期', 'report', false],
        ['质检节点', 'qualityStatusName', '状态', 'report', false],
      ]),
    },
    approvals: { addText: '新增生产工单审批规则', methods: operationApprovalMethods, rows: approvalRows('production_work_order', [['派工审批', '工单派工', '生产主管'], ['报工异常审批', '报工质检', '质量主管']]) },
    strategies: { title: '生产工单策略设置', description: '按生产工单页面真实动作配置派工、工序领料、报工、报工异常和报工数量校验策略。', tabs: workOrderStrategies },
  },
  productionSchedules: {
    ...templateBase('productionSchedules', 'production', '生产排班', 'production-schedules', '/production/production-schedules', 'SP'),
    fields: {
      addText: '新增排班字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'roster', label: '排班网格' },
        { key: 'validate', label: '冲突校验' },
      ],
      rows: fieldRows('production_schedule', [
        ['计划编号', 'planCode', '自动编号', 'basic', true],
        ['计划名称', 'planName', '文本', 'basic', true],
        ['适用班组', 'teamName', '下拉选项', 'basic', true],
        ['循环模式', 'pattern', '文本', 'basic', true],
        ['参考工作日历', 'calendarName', '下拉选项', 'basic', true],
        ['排班周期', 'period', '日期范围', 'basic', true],
        ['人数', 'people', '数字', 'basic', false],
        ['计划工时', 'plannedHours', '数字', 'basic', false],
        ['需求工时', 'demandHours', '数字', 'validate', false],
        ['覆盖率', 'coverage', '百分比', 'validate', false],
        ['冲突数', 'conflictCount', '数字', 'validate', false],
        ['班次', 'shiftCode', '下拉选项', 'roster', true],
        ['调整原因', 'adjustReason', '文本', 'roster', false],
        ['审批状态', 'approvalStatus', '状态', 'validate', false],
      ]),
    },
    approvals: { addText: '新增排班审批规则', methods: operationApprovalMethods, rows: approvalRows('production_schedule', [['排班发布审批', '排班发布', '生产主管'], ['加班排班审批', '临时加班', '生产经理']]) },
    strategies: { title: '生产排班策略设置', description: '按生产排班页面真实动作配置发布、发布后调班、归档、停用班次和冲突校验策略。', tabs: productionScheduleStrategies },
  },
  outsourceOrders: {
    ...templateBase('outsourceOrders', 'production', '委外加工', 'outsource-orders', '/production/outsource-orders', 'OS'),
    fields: {
      addText: '新增委外字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'issue', label: '委外发料' },
        { key: 'receive', label: '委外入库' },
      ],
      rows: fieldRows('outsource_order', [
        ['委外主题', 'subject', '文本', 'basic', true],
        ['委外单号', 'code', '自动编号', 'basic', true],
        ['委外方式', 'outsourceMode', '下拉选项', 'basic', true],
        ['委外加工商', 'supplierName', '供应商选择', 'basic', true],
        ['发料方式', 'issueMode', '下拉选项', 'basic', false],
        ['来源单据', 'sourceCode', '关联单据', 'basic', false],
        ['来源产品', 'sourceProductName', '文本', 'basic', false],
        ['委外数量', 'quantity', '数字', 'basic', true],
        ['委外成本', 'outsourceCost', '金额', 'basic', false],
        ['交付日期', 'deliveryDate', '日期', 'basic', false],
        ['委外明细', 'lines', '子表', 'basic', true],
        ['委外发料', 'issueRecords', '子表', 'issue', false],
        ['应发数量', 'shouldIssueQuantity', '数字', 'issue', false],
        ['累计已发', 'issuedQuantity', '数字', 'issue', false],
        ['委外入库', 'receiveRecords', '子表', 'receive', false],
        ['质检合格', 'qualifiedQuantity', '数字', 'receive', false],
        ['本次入库', 'inboundQuantity', '数字', 'receive', false],
      ]),
    },
    approvals: { addText: '新增委外审批规则', methods: operationApprovalMethods, rows: approvalRows('outsource_order', [['委外加工审批', '新增委外', '生产主管'], ['委外发料审批', '委外发料', '仓库主管']]) },
    strategies: { title: '委外加工策略设置', description: '按委外加工页面真实动作配置提交审批、发料审批、委外范围、发料收货和数量校验策略。', tabs: outsourceStrategies },
  },
};
