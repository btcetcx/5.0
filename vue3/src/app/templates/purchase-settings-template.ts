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

export type PurchaseSettingModule = 'suppliers' | 'requests' | 'inquiries' | 'orders';
export type PurchaseSettingType = 'groups' | 'levels' | 'brands' | 'fields' | 'numbers' | 'approvals' | 'strategies' | 'print';

export interface ApprovalRuleRow extends SettingTableRow {
  name: string;
  category: string;
  nodes: ApprovalNode[];
  owner: string;
  updatedAt: string;
  enabled: boolean;
}

export interface PrintTemplateRow extends SettingTableRow {
  name: string;
  scene: string;
  paper: string;
  status: string;
  updatedAt: string;
}

export interface ExtraSettingList {
  addText: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  columns: SettingTableColumn[];
  rows: SettingTableRow[];
}

export interface PurchaseSettingTemplate {
  module: PurchaseSettingModule;
  title: string;
  backText: string;
  backRoute: string;
  typeTitles: Record<PurchaseSettingType, string>;
  extraLists?: Partial<Record<'groups' | 'levels' | 'brands', ExtraSettingList>>;
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
    rows: ApprovalRuleRow[];
  };
  strategies: {
    title: string;
    description: string;
    tabs: StrategyTab[];
  };
  print: {
    addText: string;
    columns: SettingTableColumn[];
    rows: PrintTemplateRow[];
  };
}

export const purchaseNumberCandidates: CodeRuleCandidate[] = [
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

export const purchaseApprovalMethods: ApprovalMethod[] = [
  { value: '依次审批', desc: '按先后顺序，一人同意才流转到下一人' },
  { value: '会签', desc: '所选人员必须全部审批后进入下一节点' },
  { value: '或签', desc: '选中的人里只要有一人同意即可' },
];

const typeTitles = (name: string, extras: Partial<Record<'groups' | 'levels' | 'brands', string>> = {}): Record<PurchaseSettingType, string> => ({
  groups: extras.groups || `${name}分组设置`,
  levels: extras.levels || `${name}等级设置`,
  brands: extras.brands || `${name}品牌设置`,
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

function approvalRows(prefix: string, rows: Array<[string, string, string]>): ApprovalRuleRow[] {
  return rows.map(([name, category, owner], index) => ({
    id: `${prefix}_approval_${index + 1}`,
    name,
    category,
    nodes: [
      { name: '一级审批', approvers: [owner], method: '依次审批' },
      { name: '财务/采购复核', approvers: ['老大'], method: '会签' },
    ],
    owner,
    updatedAt: '2026-05-27',
    enabled: true,
  }));
}

function printRows(prefix: string, name: string): PrintTemplateRow[] {
  return [
    { id: `${prefix}_print_1`, name: `${name}标准打印模板`, scene: '新增/详情打印', paper: 'A4 纵向', status: '启用', updatedAt: '2026-05-27' },
    { id: `${prefix}_print_2`, name: `${name}审批留痕模板`, scene: '审批完成后打印', paper: 'A4 横向', status: '启用', updatedAt: '2026-05-27' },
  ];
}

const supplyBrandColumns: SettingTableColumn[] = [
  { key: 'name', label: '品牌名称' },
  { key: 'code', label: '品牌编码' },
  { key: 'category', label: '适用品类' },
  { key: 'supplierCount', label: '供应商数量' },
  { key: 'enabled', label: '状态' },
];

function supplyBrandList(rows: Array<[string, string, string, number]>): ExtraSettingList {
  return {
    addText: '新增供货品牌',
    title: '供货品牌设置',
    description: '维护供应商供货产品可绑定的品牌标签，用于供应商供货产品、询价和采购明细回填。',
    searchPlaceholder: '搜索品牌名称/编码/适用品类',
    columns: supplyBrandColumns,
    rows: rows.map(([name, code, category, supplierCount], index) => ({
      id: `supplier_brand_${index + 1}`,
      name,
      code,
      category,
      supplierCount,
      enabled: '启用',
    })),
  };
}

const supplierStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'supplierSubmitApproval',
        title: '提交供应商审批',
        sub: '新增供应商提交后是否进入待审核，审核通过后成为已审核供应商。',
        enabled: false,
        children: [
          {
            key: 'supplierSubmitFlow',
            title: '审批流程',
            sub: '供应商建档提交时使用的审批流程。',
            type: 'select',
            value: '供应商准入审批',
            options: ['供应商准入审批', '通用单级审批流'],
          },
          {
            key: 'supplierApproveResult',
            title: '审批通过后状态',
            sub: '审核通过后供应商进入的业务状态。',
            type: 'select',
            value: '已审核',
            options: ['已审核', '临时'],
          },
        ],
      },
      {
        key: 'tempSupplierRegularize',
        title: '临时供应商转正',
        sub: '询价新增或待转正供应商转为正式供应商时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'tempSupplierRegularizeFlow',
            title: '审批流程',
            sub: '临时供应商转正时使用的审批流程。',
            type: 'select',
            value: '临时供应商转正审批',
            options: ['临时供应商转正审批', '供应商准入审批'],
          },
          {
            key: 'tempSupplierBeforeApproveUse',
            title: '转正前使用限制',
            sub: '临时供应商转正前在询价和采购中的可用范围。',
            type: 'select',
            value: '允许询价，禁止下单',
            options: ['允许询价，禁止下单', '仅允许查看报价', '审批通过前全部禁用'],
          },
        ],
      },
      {
        key: 'supplierDisableApproval',
        title: '停用供应商',
        sub: '已审核供应商被停用时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'supplierDisableFlow',
            title: '审批流程',
            sub: '停用供应商时使用的审批流程。',
            type: 'select',
            value: '通用单级审批流',
            options: ['通用单级审批流', '供应商准入审批'],
          },
          {
            key: 'supplierOpenBusinessAction',
            title: '存在未完结业务时处理方式',
            sub: '供应商存在询价、采购或未付款记录时的停用处理。',
            type: 'select',
            value: '提示并阻断停用',
            options: ['提示并阻断停用', '审批通过后允许停用', '仅提示未完结业务'],
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
        key: 'supplierSubmitRequired',
        title: '提交前必填校验',
        sub: '供应商提交审批前是否校验分类、联系人、联系方式和财务信息。',
        enabled: false,
        children: [
          {
            key: 'supplierRequiredFields',
            title: '必填内容',
            sub: '提交审批前必须维护的供应商资料。',
            type: 'select',
            value: '分类 + 联系人 + 联系方式',
            options: ['分类 + 联系人 + 联系方式', '分类 + 联系人 + 联系方式 + 付款账期', '基础信息 + 财务信息 + 供货产品'],
          },
        ],
      },
    ],
  },
];

const requestStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'requestSubmitApproval',
        title: '提交请购审批',
        sub: '请购从待提交进入审批中时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'requestSubmitFlow',
            title: '审批流程',
            sub: '请购提交时使用的审批流程。',
            type: 'select',
            value: '请购提交审批',
            options: ['请购提交审批', '通用单级审批流'],
          },
          {
            key: 'requestApproveResult',
            title: '审批通过后状态',
            sub: '审批通过后请购进入的业务状态。',
            type: 'select',
            value: '已批准',
            options: ['已批准', '待询价', '待采购'],
          },
        ],
      },
      {
        key: 'requestCloseApproval',
        title: '关闭请购',
        sub: '请购被关闭时是否触发审批或校验未转单明细。',
        enabled: false,
        children: [
          {
            key: 'requestCloseFlow',
            title: '审批流程',
            sub: '关闭请购时使用的审批流程。',
            type: 'select',
            value: '通用单级审批流',
            options: ['通用单级审批流', '请购提交审批'],
          },
          {
            key: 'requestUnfinishedLineAction',
            title: '存在未转单明细时处理方式',
            sub: '请购还有待询价或待采购数量时的关闭处理。',
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
        key: 'requestConvertControl',
        title: '转询价/转采购',
        sub: '请购详情中的转询价、转采购、继续采购是否限制操作条件。',
        enabled: false,
        children: [
          {
            key: 'requestConvertCondition',
            title: '转单前置条件',
            sub: '允许转询价或转采购前必须满足的状态。',
            type: 'select',
            value: '已批准',
            options: ['已批准', '待询价或待采购', '审批通过且明细未关闭'],
          },
          {
            key: 'requestDirectPurchaseCondition',
            title: '直接转采购条件',
            sub: '跳过询价直接采购时的处理方式。',
            type: 'select',
            value: '有建议供应商或有效价格',
            options: ['有建议供应商或有效价格', '必须填写跳过询价原因', '禁止直接转采购'],
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
        key: 'requestSubmitRequired',
        title: '提交前必填校验',
        sub: '请购提交审批前是否校验来源、申请人、需求日期和请购明细。',
        enabled: false,
        children: [
          {
            key: 'requestRequiredFields',
            title: '必填内容',
            sub: '提交审批前必须维护的请购内容。',
            type: 'select',
            value: '申请人 + 请购明细',
            options: ['申请人 + 请购明细', '来源单据 + 申请人 + 请购明细', '申请人 + 需求日期 + 请购明细'],
          },
        ],
      },
    ],
  },
];

const inquiryStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'inquirySubmitApproval',
        title: '发起询价审批',
        sub: '询价单发起后是否进入审批，审批通过后进入待定价。',
        enabled: false,
        children: [
          {
            key: 'inquirySubmitFlow',
            title: '审批流程',
            sub: '发起询价时使用的审批流程。',
            type: 'select',
            value: '询价发起审批',
            options: ['询价发起审批', '通用单级审批流'],
          },
          {
            key: 'inquiryApproveResult',
            title: '审批通过后状态',
            sub: '审批通过后询价进入的业务状态。',
            type: 'select',
            value: '待定价',
            options: ['待定价', '询价中'],
          },
        ],
      },
      {
        key: 'inquiryPricingApproval',
        title: '定价结果审批',
        sub: '询价定价时是否审批中选供应商、价格、税额、交期和最小采购量。',
        enabled: false,
        children: [
          {
            key: 'inquiryPricingFlow',
            title: '审批流程',
            sub: '定价结果使用的审批流程。',
            type: 'select',
            value: '定价结果审批',
            options: ['定价结果审批', '询价发起审批'],
          },
          {
            key: 'inquiryPricingScope',
            title: '触发范围',
            sub: '哪些定价结果需要审批。',
            type: 'select',
            value: '全部定价结果',
            options: ['全部定价结果', '非最低价中选', '临时供应商中选', '金额超过1万'],
          },
        ],
      },
      {
        key: 'inquiryCancelApproval',
        title: '作废询价',
        sub: '询价单被作废时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'inquiryCancelFlow',
            title: '审批流程',
            sub: '作废询价时使用的审批流程。',
            type: 'select',
            value: '通用单级审批流',
            options: ['通用单级审批流', '询价发起审批'],
          },
          {
            key: 'inquiryPricedCancelAction',
            title: '已定价时处理方式',
            sub: '询价已有定价结果时的作废处理。',
            type: 'select',
            value: '提示并阻断作废',
            options: ['提示并阻断作废', '审批通过后允许作废', '仅提示定价影响'],
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
        key: 'inquirySupplierScope',
        title: '选择询价供应商',
        sub: '询价明细中选择正式或临时供应商时是否限制可选范围。',
        enabled: false,
        children: [
          {
            key: 'inquirySupplierAllowed',
            title: '可选供应商范围',
            sub: '发起询价时允许选择的供应商范围。',
            type: 'select',
            value: '已审核供应商 + 临时供应商',
            options: ['已审核供应商', '已审核供应商 + 临时供应商', '仅有供货产品的供应商'],
          },
          {
            key: 'inquiryTempSupplierAction',
            title: '临时供应商处理',
            sub: '询价中使用临时供应商后的处理方式。',
            type: 'select',
            value: '允许报价，转采购前需转正',
            options: ['允许报价，转采购前需转正', '仅允许参与比价', '不允许使用临时供应商'],
          },
        ],
      },
      {
        key: 'inquiryCreatePurchaseControl',
        title: '定价后转采购',
        sub: '询价定价后生成采购订单是否校验定价状态。',
        enabled: false,
        children: [
          {
            key: 'inquiryCreatePurchaseCondition',
            title: '转采购条件',
            sub: '允许生成采购订单前必须满足的条件。',
            type: 'select',
            value: '已定价',
            options: ['已定价', '定价审批通过', '询价完毕'],
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
        key: 'inquirySubmitRequired',
        title: '发起前必填校验',
        sub: '询价发起前是否校验产品、数量、截止日期和供应商范围。',
        enabled: false,
        children: [
          {
            key: 'inquiryRequiredFields',
            title: '必填内容',
            sub: '发起询价前必须维护的内容。',
            type: 'select',
            value: '产品 + 数量 + 供应商范围',
            options: ['产品 + 数量 + 供应商范围', '产品 + 数量 + 截止日期 + 供应商范围', '来源单据 + 产品 + 数量'],
          },
        ],
      },
    ],
  },
];

const orderStrategies: StrategyTab[] = [
  {
    key: 'approvalFlow',
    label: '审批流策略',
    rows: [
      {
        key: 'purchaseOrderSubmitApproval',
        title: '提交采购订单审批',
        sub: '采购订单提交后是否进入审核中，审核通过后进入采购中。',
        enabled: false,
        children: [
          {
            key: 'purchaseOrderSubmitFlow',
            title: '审批流程',
            sub: '采购订单提交时使用的审批流程。',
            type: 'select',
            value: '采购订单提交审批',
            options: ['采购订单提交审批', '通用单级审批流'],
          },
          {
            key: 'purchaseOrderApproveResult',
            title: '审批通过后状态',
            sub: '审批通过后采购订单进入的业务状态。',
            type: 'select',
            value: '采购中',
            options: ['采购中', '待发货'],
          },
        ],
      },
      {
        key: 'purchaseOrderCancelApproval',
        title: '异常取消采购订单',
        sub: '采购订单异常取消时是否触发审批。',
        enabled: false,
        children: [
          {
            key: 'purchaseOrderCancelFlow',
            title: '审批流程',
            sub: '异常取消采购订单时使用的审批流程。',
            type: 'select',
            value: '通用单级审批流',
            options: ['通用单级审批流', '采购订单提交审批'],
          },
          {
            key: 'purchaseOrderCancelAction',
            title: '已有入库或付款时处理方式',
            sub: '采购订单已产生入库、应付或付款记录时的取消处理。',
            type: 'select',
            value: '提示并阻断取消',
            options: ['提示并阻断取消', '审批通过后允许取消', '仅提示影响范围'],
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
        key: 'purchaseOrderSourceControl',
        title: '选择采购来源',
        sub: '新建采购订单时是否限制请购、询价定价、MRP建议和手动来源。',
        enabled: false,
        children: [
          {
            key: 'purchaseOrderAllowedSource',
            title: '允许来源',
            sub: '新建采购订单时允许选择的来源范围。',
            type: 'select',
            value: '请购/询价/MRP/手动',
            options: ['请购/询价/MRP/手动', '禁止手动采购', '仅询价定价来源'],
          },
          {
            key: 'purchaseOrderSourceLineLock',
            title: '来源明细锁定',
            sub: '来源带入的产品、数量、供应商和价格默认锁定。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
      {
        key: 'purchaseSupplierChangeApproval',
        title: '更换供应商',
        sub: '采购明细更换供应商时是否要求填写原因并触发审批。',
        enabled: false,
        children: [
          {
            key: 'purchaseSupplierChangeReason',
            title: '更换理由必填',
            sub: '更换供应商时必须填写原因。',
            type: 'switch',
            enabled: false,
          },
          {
            key: 'purchaseSupplierChangeFlow',
            title: '审批流程',
            sub: '供应商更换时使用的审批流程。',
            type: 'select',
            value: '供应商更换审批',
            options: ['供应商更换审批', '采购订单提交审批'],
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
        key: 'purchaseInboundMatchControl',
        title: '到货入库校验',
        sub: '采购订单到货入库、部分入库和完成时是否校验采购明细数量。',
        enabled: false,
        children: [
          {
            key: 'purchaseInboundOverAction',
            title: '超采购数量处理方式',
            sub: '入库数量超过采购数量时的处理。',
            type: 'select',
            value: '阻断入库',
            options: ['阻断入库', '审批通过后允许', '仅预警'],
          },
          {
            key: 'purchaseCompleteCondition',
            title: '完成订单条件',
            sub: '允许完成采购订单前必须满足的条件。',
            type: 'select',
            value: '采购数量已全部入库',
            options: ['采购数量已全部入库', '三单匹配通过', '入库和到票均完成'],
          },
        ],
      },
      {
        key: 'purchasePaymentInvoiceControl',
        title: '付款/到票校验',
        sub: '采购订单付款前是否校验三单匹配、到票认证、暂估应付和质检扣款。',
        enabled: false,
        children: [
          {
            key: 'purchasePaymentPrerequisite',
            title: '付款前置条件',
            sub: '满足哪些条件后允许发起付款。',
            type: 'select',
            value: '三单匹配 + 到票认证',
            options: ['三单匹配', '到票认证', '三单匹配 + 到票认证', '可付款金额大于0'],
          },
          {
            key: 'purchaseDeductionBeforePay',
            title: '付款前扣减质检扣款',
            sub: '付款金额自动扣减质检扣款。',
            type: 'switch',
            enabled: false,
          },
        ],
      },
    ],
  },
];

export const purchaseSettingTemplates: Record<PurchaseSettingModule, PurchaseSettingTemplate> = {
  suppliers: {
    module: 'suppliers',
    title: '供应商设置',
    backText: '返回供应商列表',
    backRoute: '/purchase/suppliers',
    typeTitles: typeTitles('供应商', { groups: '供应商分组设置', levels: '供应商等级设置', brands: '供货品牌设置' }),
    extraLists: {
      groups: {
        addText: '新增供应商分组',
        title: '供应商分组设置',
        description: '维护供应商库分类树中的供应商大类和细分类。',
        searchPlaceholder: '搜索供应商分组/细分类',
        columns: [
          { key: 'name', label: '分组名称' },
          { key: 'parent', label: '上级分组' },
          { key: 'code', label: '分组编码' },
          { key: 'count', label: '供应商数量' },
          { key: 'enabled', label: '状态' },
        ],
        rows: [
          { id: 'supplier_group_raw', name: '原材料供应商', parent: '供应商库', code: 'raw', count: 42, enabled: '启用' },
          { id: 'supplier_group_part', name: '零部件供应商', parent: '供应商库', code: 'part', count: 36, enabled: '启用' },
          { id: 'supplier_group_pkg', name: '包装供应商', parent: '供应商库', code: 'pkg', count: 24, enabled: '启用' },
          { id: 'supplier_group_svc', name: '服务供应商', parent: '供应商库', code: 'svc', count: 18, enabled: '启用' },
          { id: 'supplier_group_temp', name: '临时供应商', parent: '供应商库', code: 'temp', count: 6, enabled: '启用' },
        ],
      },
      levels: {
        addText: '新增供应商等级',
        title: '供应商等级设置',
        description: '用于供应商选择、询价定价和采购下单时的优先级参考。',
        searchPlaceholder: '搜索等级名称',
        columns: [
          { key: 'name', label: '等级名称' },
          { key: 'priority', label: '优先级' },
          { key: 'description', label: '说明' },
          { key: 'enabled', label: '状态' },
        ],
        rows: [
          { id: 'supplier_level_a', name: 'A', priority: 1, description: '优先询价与采购，质量与交期稳定。', enabled: '启用' },
          { id: 'supplier_level_b', name: 'B', priority: 2, description: '可作为备选供应商参与比价。', enabled: '启用' },
          { id: 'supplier_level_temp', name: '临时', priority: 9, description: '询价新增，转正后可设为默认供应商。', enabled: '启用' },
        ],
      },
      brands: supplyBrandList([
        ['傲为', 'AW', '自产/半成品', 4],
        ['华南铝材', 'HNLC', '结构件/型材', 2],
        ['顺德精密', 'SDJM', '轴承/机械件', 3],
        ['华美包装', 'HMBZ', '包装材料', 2],
        ['博源化工', 'BYHG', '化工辅料', 1],
        ['通用', 'GEN', '未指定品牌', 8],
      ]),
    },
    fields: {
      addText: '新增供应商字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'contact', label: '联系人/地址' },
        { key: 'finance', label: '财务结算' },
        { key: 'product', label: '供货产品' },
      ],
      rows: fieldRows('supplier', [
        ['供应商名称', 'name', '文本', 'basic', true],
        ['供应商编号', 'code', '自动编号', 'basic', true],
        ['供应商分类', 'type', '下拉选项', 'basic', true],
        ['供应商类型', 'supplier_kind', '下拉选项', 'basic', true],
        ['来源单据', 'source_bill', '关联单据', 'basic', false],
        ['主联系人', 'contact_name', '文本', 'contact', true],
        ['联系方式', 'contact_phone', '文本', 'contact', true],
        ['付款账期', 'settlement_method', '下拉选项', 'finance', false],
        ['供货产品', 'supply_products', '子表', 'product', false],
        ['供货品牌', 'supply_brand', '下拉选项', 'product', false],
      ]),
    },
    numbers: { prefix: 'SUP', separator: '-', selected: ['y4', 's3'], candidates: purchaseNumberCandidates },
    approvals: { addText: '新增供应商审批规则', methods: purchaseApprovalMethods, rows: approvalRows('supplier', [['供应商准入审批', '新增供应商', '老大'], ['临时供应商转正审批', '询价新增供应商', '李文涛']]) },
    strategies: { title: '供应商策略设置', description: '按供应商页面真实动作配置准入、转正、停用和提交前校验策略。', tabs: supplierStrategies },
    print: { addText: '新增供应商打印模板', columns: [], rows: printRows('supplier', '供应商') },
  },
  requests: {
    module: 'requests',
    title: '请购设置',
    backText: '返回请购列表',
    backRoute: '/purchase/purchase-requests',
    typeTitles: typeTitles('请购'),
    fields: {
      addText: '新增请购字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '请购明细' },
        { key: 'flow', label: '转单追踪' },
      ],
      rows: fieldRows('request', [
        ['请购主题', 'title', '文本', 'basic', true],
        ['请购编号', 'code', '自动编号', 'basic', true],
        ['请购来源', 'source_type', '下拉选项', 'basic', true],
        ['关联单据', 'source_code', '关联单据', 'basic', false],
        ['申请部门', 'department_name', '文本', 'basic', false],
        ['申请人', 'applicant_name', '人员选择', 'basic', true],
        ['需求日期', 'required_date', '日期', 'basic', false],
        ['请购明细', 'request_lines', '子表', 'detail', true],
        ['建议供应商', 'suggested_supplier', '供应商选择', 'detail', false],
        ['预算金额', 'budget_amount', '金额', 'detail', false],
        ['转询价状态', 'inquiry_status', '状态', 'flow', false],
        ['转采购状态', 'purchase_status', '状态', 'flow', false],
      ]),
    },
    numbers: { prefix: 'PR', separator: '-', selected: ['y4', 's3'], candidates: purchaseNumberCandidates },
    approvals: { addText: '新增请购审批规则', methods: purchaseApprovalMethods, rows: approvalRows('request', [['请购提交审批', '新增请购', '李文涛'], ['请购转采购审批', '直接转采购', '陈思源']]) },
    strategies: { title: '请购策略设置', description: '按请购页面真实动作配置提交审批、转询价、转采购、关闭和提交前校验策略。', tabs: requestStrategies },
    print: { addText: '新增请购打印模板', columns: [], rows: printRows('request', '请购') },
  },
  inquiries: {
    module: 'inquiries',
    title: '询价设置',
    backText: '返回询价列表',
    backRoute: '/purchase/purchase-inquiries',
    typeTitles: typeTitles('询价'),
    fields: {
      addText: '新增询价字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '询价明细' },
        { key: 'quote', label: '供应商报价' },
        { key: 'pricing', label: '定价结果' },
      ],
      rows: fieldRows('inquiry', [
        ['询价主题', 'title', '文本', 'basic', true],
        ['询价编号', 'code', '自动编号', 'basic', true],
        ['来源单据', 'source_code', '关联单据', 'basic', false],
        ['报价截止日期', 'quote_deadline', '日期', 'basic', false],
        ['询价明细', 'inquiry_lines', '子表', 'detail', true],
        ['供应商范围', 'supplier_scope', '供应商选择', 'quote', true],
        ['报价版本', 'quote_version', '文本', 'quote', false],
        ['是否含税', 'tax_included', '下拉选项', 'quote', false],
        ['最小采购量', 'min_purchase_qty', '数字', 'quote', false],
        ['定价状态', 'pricing_status', '状态', 'pricing', false],
        ['采购生成状态', 'purchase_create_status', '状态', 'pricing', false],
      ]),
    },
    numbers: { prefix: 'INQ', separator: '-', selected: ['y4', 's3'], candidates: purchaseNumberCandidates },
    approvals: { addText: '新增询价审批规则', methods: purchaseApprovalMethods, rows: approvalRows('inquiry', [['询价发起审批', '发起询价', '李文涛'], ['定价结果审批', '询价定价', '老大']]) },
    strategies: { title: '询价策略设置', description: '按询价页面真实动作配置发起审批、定价、作废、供应商选择和转采购策略。', tabs: inquiryStrategies },
    print: { addText: '新增询价打印模板', columns: [], rows: printRows('inquiry', '询价') },
  },
  orders: {
    module: 'orders',
    title: '采购订单设置',
    backText: '返回采购订单列表',
    backRoute: '/purchase/purchase-orders',
    typeTitles: typeTitles('采购订单'),
    fields: {
      addText: '新增采购订单字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'detail', label: '采购明细' },
        { key: 'inbound', label: '入库/三单匹配' },
        { key: 'finance', label: '付款/到票' },
      ],
      rows: fieldRows('order', [
        ['采购主题', 'title', '文本', 'basic', true],
        ['采购订单号', 'code', '自动编号', 'basic', true],
        ['来源单据', 'source_code', '关联单据', 'basic', false],
        ['供应商', 'supplier_name', '供应商选择', 'basic', true],
        ['采购日期', 'order_date', '日期', 'basic', true],
        ['预计到货', 'delivery_date', '日期', 'basic', false],
        ['采购状态', 'status', '状态', 'basic', false],
        ['采购明细', 'order_lines', '子表', 'detail', true],
        ['含税单价', 'tax_price', '金额', 'detail', false],
        ['税率', 'tax_rate', '数字', 'detail', false],
        ['入库状态', 'inbound_status', '状态', 'inbound', false],
        ['三单匹配', 'match_status', '状态', 'inbound', false],
        ['付款状态', 'payment_status', '状态', 'finance', false],
        ['到票状态', 'invoice_status', '状态', 'finance', false],
        ['可付款金额', 'payable_amount', '金额', 'finance', false],
      ]),
    },
    numbers: { prefix: 'PO', separator: '-', selected: ['y4', 's3'], candidates: purchaseNumberCandidates },
    approvals: { addText: '新增采购订单审批规则', methods: purchaseApprovalMethods, rows: approvalRows('purchase_order', [['采购订单提交审批', '新增采购订单', '李文涛'], ['供应商更换审批', '更换供应商', '老大']]) },
    strategies: { title: '采购订单策略设置', description: '按采购订单页面真实动作配置提交审批、取消、来源选择、供应商变更、入库和付款到票校验策略。', tabs: orderStrategies },
    print: { addText: '新增采购订单打印模板', columns: [], rows: printRows('purchase_order', '采购订单') },
  },
};
