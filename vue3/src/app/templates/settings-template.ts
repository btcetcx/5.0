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

export type SalesSettingModule = 'plans' | 'quotes' | 'contracts' | 'orders';
export type SalesSettingType = 'fields' | 'numbers' | 'approvals' | 'strategies' | 'print';

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

export interface SalesSettingTemplate {
  module: SalesSettingModule;
  title: string;
  backText: string;
  backRoute: string;
  typeTitles: Record<SalesSettingType, string>;
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

export const commonNumberCandidates: CodeRuleCandidate[] = [
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

export const commonApprovalMethods: ApprovalMethod[] = [
  { value: '依次审批', desc: '按先后顺序，一人同意才流转到下一人' },
  { value: '会签', desc: '所选人员必须全部审批后进入下一节点' },
  { value: '或签', desc: '选中的人里只要有一人同意即可' },
];

const typeTitles = (name: string): Record<SalesSettingType, string> => ({
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
      { name: '直属主管审批', approvers: [owner], method: '依次审批' },
      { name: '销售负责人复核', approvers: ['老大'], method: '会签' },
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

const planStrategyTabs: StrategyTab[] = [
  {
    key: 'target',
    label: '目标控制',
    rows: [
      {
        key: 'planTargetChangeApproval',
        title: '目标金额/数量调整审批',
        sub: '已提交或执行中的计划调整目标时触发审批，避免随意改动业绩基准。',
        enabled: false,
        children: [
          { key: 'planTargetChangeThreshold', title: '调整幅度阈值', sub: '超过该幅度才需要走审批。', type: 'select', value: '超过 10%', options: ['任意调整', '超过 5%', '超过 10%', '超过 20%'] },
          { key: 'planTargetChangeFlow', title: '审批流程', sub: '目标变更时选择对应审批流程。', type: 'select', value: '计划调整审批', options: ['计划调整审批', '计划提交审批'] },
          { key: 'planRecalculateAchievement', title: '调整后重算达成率', sub: '目标变更通过后，自动按新目标重算达成率。', type: 'switch', enabled: false },
        ],
      },
      {
        key: 'planCycleOverlapCheck',
        title: '计划周期重叠校验',
        sub: '防止同一对象在同周期内重复制定销售计划。',
        enabled: false,
        children: [
          { key: 'planOverlapDimension', title: '重叠判断维度', sub: '按负责人、产品或客户维度检测重叠。', type: 'select', value: '同负责人 + 同产品', options: ['同负责人', '同负责人 + 同产品', '同负责人 + 同客户', '同部门 + 同产品'] },
          { key: 'planOverlapAction', title: '发现重叠时处理方式', sub: '控制重叠计划是否允许继续保存。', type: 'select', value: '警告提示，允许继续', options: ['警告提示，允许继续', '阻断保存', '提交主管确认'] },
        ],
      },
      {
        key: 'planOwnerChangeApproval',
        title: '计划负责人变更审批',
        sub: '计划负责人或负责对象变更时触发审批，并保留变更轨迹。',
        enabled: false,
        children: [
          { key: 'planOwnerChangeScope', title: '触发范围', sub: '控制哪些负责人变更需要审批。', type: 'select', value: '跨部门变更', options: ['任意变更', '跨部门变更', '仅负责人类型变更'] },
          { key: 'planOwnerHistoryPolicy', title: '历史业绩归属', sub: '负责人变更后历史完成金额归属规则。', type: 'select', value: '保留原负责人归属', options: ['保留原负责人归属', '全部转移给新负责人', '按变更日期拆分'] },
        ],
      },
    ],
  },
  {
    key: 'progress',
    label: '执行推进',
    rows: [
      {
        key: 'planLowAchievementWarning',
        title: '低达成率预警',
        sub: '计划执行中达成率低于阈值时提醒负责人补充跟进动作。',
        enabled: false,
        children: [
          { key: 'planWarningThreshold', title: '达成率阈值', sub: '低于该比例触发计划预警。', type: 'select', value: '低于 70%', options: ['低于 60%', '低于 70%', '低于 80%', '低于 90%'] },
          { key: 'planWarningCycle', title: '预警周期', sub: '按周期检测计划完成情况。', type: 'select', value: '每周', options: ['每日', '每周', '每月'] },
          { key: 'planNotifyManager', title: '同步通知销售经理', sub: '预警时同步通知计划负责人上级。', type: 'switch', enabled: false },
        ],
      },
      {
        key: 'planCloseApproval',
        title: '未完成计划关闭审批',
        sub: '未达成计划关闭前必须说明原因并按规则审批。',
        enabled: false,
        children: [
          { key: 'planCloseRequirement', title: '关闭条件', sub: '控制哪些未完成计划关闭时需要审批。', type: 'select', value: '达成率低于 100%', options: ['达成率低于 100%', '达成率低于 80%', '有未完成产品明细'] },
          { key: 'planCloseReasonRequired', title: '关闭原因必填', sub: '关闭未完成计划时必须填写原因。', type: 'switch', enabled: false },
          { key: 'planCloseFlow', title: '审批流程', sub: '未完成计划关闭时选择对应审批流程。', type: 'select', value: '计划调整审批', options: ['计划调整审批', '计划提交审批'] },
        ],
      },
      {
        key: 'planDataVisibility',
        title: '计划查看范围',
        sub: '控制计划目标金额和达成数据的查看范围。',
        enabled: false,
        children: [
          { key: 'planVisibleScope', title: '默认可见范围', sub: '普通销售人员默认能看到的计划范围。', type: 'select', value: '仅本人负责', options: ['仅本人负责', '本部门计划', '全公司计划'] },
          { key: 'planAmountVisibleRole', title: '目标金额可见角色', sub: '控制计划目标金额字段的最低可见角色。', type: 'select', value: '销售经理及以上', options: ['本人负责可见', '销售经理及以上', '销售总监及以上'] },
        ],
      },
    ],
  },
];

const quoteStrategyTabs: StrategyTab[] = [
  {
    key: 'pricing',
    label: '价格控制',
    rows: [
      {
        key: 'quoteLowPriceApproval',
        title: '低于价格版本报价审批',
        sub: '报价价格低于标准价格版本或折扣阈值时触发审批。',
        enabled: false,
        children: [
          { key: 'quoteLowestPriceRule', title: '触发条件', sub: '低价审批的价格或折扣判断规则。', type: 'select', value: '低于标准价', options: ['低于标准价', '折扣低于 95%', '折扣低于 90%', '毛利低于底线'] },
          { key: 'quoteLowPriceAction', title: '处理方式', sub: '低价报价提交时的系统动作。', type: 'select', value: '提交审批', options: ['提交审批', '阻断提交', '仅预警提示'] },
          { key: 'quoteLowPriceFlow', title: '审批流程', sub: '低价报价使用的审批流程。', type: 'select', value: '报价提交审批', options: ['报价提交审批', '促销报价审批'] },
        ],
      },
      {
        key: 'quoteCustomerLevelLimit',
        title: '客户等级报价限制',
        sub: '按客户等级限制可用报价类型和价格版本。',
        enabled: false,
        children: [
          { key: 'quoteLevelScope', title: '适用客户等级', sub: '限制策略作用的客户等级。', type: 'select', value: '全部客户', options: ['全部客户', 'A 级及以上', 'VIP·战略客户', '新客户'] },
          { key: 'quoteAllowedType', title: '允许报价类型', sub: '符合条件客户可使用的报价类型。', type: 'select', value: '通用报价 + 分组报价', options: ['通用报价', '通用报价 + 分组报价', '全部报价类型'] },
        ],
      },
      {
        key: 'quoteAmountDiscountVisible',
        title: '报价金额/折扣查看权限',
        sub: '控制报价金额、折扣和价格版本字段的查看范围。',
        enabled: false,
        children: [
          { key: 'quoteDiscountVisibleRole', title: '折扣字段可见角色', sub: '能查看折扣字段的最低角色。', type: 'select', value: '销售经理及以上', options: ['本人负责可见', '销售经理及以上', '销售总监及以上'] },
          { key: 'quoteExportMask', title: '导出时隐藏折扣明细', sub: '导出报价单时隐藏折扣和底价信息。', type: 'switch', enabled: false },
        ],
      },
    ],
  },
  {
    key: 'conversion',
    label: '有效期与转化',
    rows: [
      {
        key: 'quoteExpireAutoInvalid',
        title: '报价过期自动失效',
        sub: '超过失效日期后自动变更报价状态，并限制继续转单。',
        enabled: false,
        children: [
          { key: 'quoteValidDays', title: '默认有效天数', sub: '新建报价默认带出的有效期。', type: 'select', value: '30 天', options: ['7 天', '15 天', '30 天', '60 天'] },
          { key: 'quoteBeforeExpireNotice', title: '到期前提醒', sub: '报价失效前提醒报价人员跟进。', type: 'select', value: '提前 3 天', options: ['提前 1 天', '提前 3 天', '提前 7 天'] },
          { key: 'quoteExpiredConvertPolicy', title: '过期后转单处理', sub: '报价过期后转合同或订单的处理方式。', type: 'select', value: '阻断转单', options: ['阻断转单', '提交审批后允许', '仅预警提示'] },
        ],
      },
      {
        key: 'quoteConvertCheck',
        title: '报价转合同/订单校验',
        sub: '报价转下游单据时校验状态、客户、产品和金额一致性。',
        enabled: false,
        children: [
          { key: 'quoteConvertStatus', title: '允许转化状态', sub: '只有指定状态的报价允许转单。', type: 'select', value: '已批准', options: ['已批准', '已批准或审核中', '非草稿'] },
          { key: 'quoteConvertAmountPolicy', title: '金额不一致处理', sub: '下游合同或订单金额和报价不一致时的处理方式。', type: 'select', value: '提交审批', options: ['阻断转单', '提交审批', '允许并记录差异'] },
        ],
      },
      {
        key: 'quoteApprovedChangeApproval',
        title: '已批准报价修改审批',
        sub: '已批准报价修改关键字段时重新审批并保留历史版本。',
        enabled: false,
        children: [
          { key: 'quoteChangeFieldScope', title: '触发字段', sub: '修改哪些字段会触发重新审批。', type: 'select', value: '价格/产品/有效期', options: ['价格', '价格/产品', '价格/产品/有效期', '全部关键字段'] },
          { key: 'quoteKeepOldVersion', title: '保留旧报价版本', sub: '修改后保留旧版本用于追溯。', type: 'switch', enabled: false },
        ],
      },
    ],
  },
];

const contractStrategyTabs: StrategyTab[] = [
  {
    key: 'sign',
    label: '签署控制',
    rows: [
      {
        key: 'contractEffectiveApproval',
        title: '合同生效审批',
        sub: '合同正式生效前按金额、付款和交付条款触发审批。',
        enabled: false,
        children: [
          { key: 'contractAmountThreshold', title: '合同金额阈值', sub: '超过该金额时必须审批。', type: 'select', value: '50 万元及以上', options: ['任意金额', '10 万元及以上', '50 万元及以上', '100 万元及以上'] },
          { key: 'contractTermScope', title: '重点审核条款', sub: '选择需要重点审批的合同条款。', type: 'select', value: '付款 + 交付 + 违约责任', options: ['付款条款', '付款 + 交付', '付款 + 交付 + 违约责任'] },
          { key: 'contractEffectiveFlow', title: '审批流程', sub: '合同生效使用的审批流程。', type: 'select', value: '合同新建审批', options: ['合同新建审批', '合同变更审批'] },
        ],
      },
      {
        key: 'contractSourceConsistency',
        title: '来源报价/订单一致性校验',
        sub: '合同引用报价或订单时校验客户、产品、数量和金额一致性。',
        enabled: false,
        children: [
          { key: 'contractConsistencyFields', title: '校验字段', sub: '选择合同和来源单据需要一致的字段。', type: 'select', value: '客户 + 产品 + 金额', options: ['客户', '客户 + 产品', '客户 + 产品 + 金额', '客户 + 产品 + 数量 + 金额'] },
          { key: 'contractMismatchAction', title: '不一致处理方式', sub: '来源和合同不一致时的系统动作。', type: 'select', value: '提交审批', options: ['阻断保存', '提交审批', '允许并记录差异'] },
        ],
      },
      {
        key: 'contractAmountChangeApproval',
        title: '合同金额变更审批',
        sub: '合同金额或产品明细变更时触发审批，并决定是否同步下游。',
        enabled: false,
        children: [
          { key: 'contractChangeThreshold', title: '变更比例阈值', sub: '超过该比例的金额变更需要审批。', type: 'select', value: '超过 5%', options: ['任意变更', '超过 5%', '超过 10%', '超过 20%'] },
          { key: 'contractChangeSyncOrder', title: '变更后同步订单/应收', sub: '合同金额变更通过后同步更新未确认订单和应收基准。', type: 'switch', enabled: false },
        ],
      },
    ],
  },
  {
    key: 'performance',
    label: '履约财务',
    rows: [
      {
        key: 'contractOverFulfillmentBlock',
        title: '超合同下单/发货拦截',
        sub: '订单或发货金额超过合同余额时按规则拦截或审批。',
        enabled: false,
        children: [
          { key: 'contractOverFulfillmentScope', title: '控制范围', sub: '选择超合同控制的业务动作。', type: 'select', value: '下单 + 发货', options: ['仅下单', '仅发货', '下单 + 发货'] },
          { key: 'contractOverFulfillmentAction', title: '超额处理方式', sub: '超过合同可用金额或数量时的处理方式。', type: 'select', value: '阻断', options: ['阻断', '提交审批', '仅预警'] },
        ],
      },
      {
        key: 'contractFinanceWarning',
        title: '回款/开票异常预警',
        sub: '应收超期、开票超合同、回款不足时提醒销售和财务。',
        enabled: false,
        children: [
          { key: 'contractWarningScene', title: '预警场景', sub: '选择需要触发预警的财务异常。', type: 'select', value: '应收超期 + 回款不足', options: ['应收超期', '开票超合同', '应收超期 + 回款不足', '全部异常'] },
          { key: 'contractWarningNotify', title: '通知对象', sub: '异常预警发送给哪些岗位。', type: 'select', value: '销售负责人 + 应收会计', options: ['销售负责人', '销售负责人 + 应收会计', '销售负责人 + 财务经理'] },
        ],
      },
      {
        key: 'contractTerminateApproval',
        title: '履约中合同终止审批',
        sub: '履约中合同终止时检查未完成订单、未回款和未开票。',
        enabled: false,
        children: [
          { key: 'contractTerminateBlockScene', title: '阻断场景', sub: '存在这些未完成事项时不允许直接终止。', type: 'select', value: '未完成订单 + 未回款', options: ['未完成订单', '未回款', '未完成订单 + 未回款', '未完成订单 + 未回款 + 未开票'] },
          { key: 'contractTerminateFlow', title: '审批流程', sub: '合同终止使用的审批流程。', type: 'select', value: '合同变更审批', options: ['合同变更审批', '合同新建审批'] },
        ],
      },
      {
        key: 'contractFinanceVisible',
        title: '合同金额与回款查看权限',
        sub: '控制合同金额、已回款、已开票、剩余金额等字段查看范围。',
        enabled: false,
        children: [
          { key: 'contractFinanceVisibleRole', title: '财务字段可见角色', sub: '能查看合同财务字段的最低角色。', type: 'select', value: '销售经理及以上', options: ['本人负责可见', '销售经理及以上', '销售总监及以上', '财务角色可见'] },
          { key: 'contractExportMaskFinance', title: '导出时隐藏回款明细', sub: '导出合同时隐藏回款、开票明细。', type: 'switch', enabled: false },
        ],
      },
    ],
  },
];

const orderStrategyTabs: StrategyTab[] = [
  {
    key: 'sourceCredit',
    label: '来源信用',
    rows: [
      {
        key: 'orderNoSourceCreateLimit',
        title: '无来源订单创建限制',
        sub: '限制手工订单创建，要求从报价、合同或项目带入来源。',
        enabled: false,
        children: [
          { key: 'orderSourceRequirement', title: '来源要求', sub: '控制订单是否必须选择来源单据。', type: 'select', value: '允许手工订单审批', options: ['必须选择报价/合同', '允许手工订单审批', '完全允许手工创建'] },
          { key: 'orderManualFlow', title: '手工订单审批流程', sub: '无来源订单创建时使用的审批流程。', type: 'select', value: '订单提交审批', options: ['订单提交审批', '信用异常审批'] },
          { key: 'orderSourceFieldsLock', title: '来源字段锁定', sub: '从来源单据带入的客户、产品、价格默认锁定。', type: 'switch', enabled: false },
        ],
      },
      {
        key: 'orderCreditCheck',
        title: '客户信用校验',
        sub: '订单确认前检查客户信用额度、账期和信用占用。',
        enabled: false,
        children: [
          { key: 'orderCreditFailAction', title: '信用不足处理', sub: '客户信用额度不足时的处理方式。', type: 'select', value: '阻断提交', options: ['阻断提交', '提交信用异常审批', '预警后允许'] },
          { key: 'orderCreditHoldPoint', title: '信用占用节点', sub: '订单在哪个业务节点占用客户信用。', type: 'select', value: '订单确认时', options: ['订单提交时', '订单确认时', '发货时'] },
          { key: 'orderCreditReleasePoint', title: '信用释放节点', sub: '回款后释放客户信用占用。', type: 'select', value: '回款核销后', options: ['开票后', '回款登记后', '回款核销后'] },
        ],
      },
      {
        key: 'orderOverSourceAmountApproval',
        title: '订单金额超来源审批',
        sub: '订单金额超过来源报价或合同可用金额时触发审批。',
        enabled: false,
        children: [
          { key: 'orderOverSourceThreshold', title: '超额阈值', sub: '超过来源金额多少需要处理。', type: 'select', value: '超过 0%', options: ['超过 0%', '超过 5%', '超过 10%'] },
          { key: 'orderOverSourceAction', title: '处理方式', sub: '订单金额超过来源时的系统动作。', type: 'select', value: '提交审批', options: ['阻断保存', '提交审批', '允许并记录差异'] },
        ],
      },
    ],
  },
  {
    key: 'fulfillment',
    label: '履约财务',
    rows: [
      {
        key: 'orderDeliveryDateCheck',
        title: '交货日期异常校验',
        sub: '交货日期早于库存、生产或承诺交付日期时触发校验。',
        enabled: false,
        children: [
          { key: 'orderDeliveryCheckBase', title: '校验基准', sub: '按哪个日期或能力判断交期异常。', type: 'select', value: '库存可承诺日期', options: ['库存可承诺日期', '生产计划日期', '合同交付日期'] },
          { key: 'orderDeliveryExceptionAction', title: '异常处理方式', sub: '交期异常时的系统动作。', type: 'select', value: '提交审批', options: ['阻断保存', '提交审批', '仅预警'] },
        ],
      },
      {
        key: 'orderApprovedBeforeDelivery',
        title: '未审批订单禁止发货',
        sub: '订单未审批通过或信用未释放前禁止生成发货动作。',
        enabled: false,
        children: [
          { key: 'orderDeliveryRequiredStatus', title: '允许发货状态', sub: '订单达到哪些状态才允许发货。', type: 'select', value: '已批准/已确认', options: ['已批准', '已确认', '已批准/已确认'] },
          { key: 'orderDeliveryCreditRequired', title: '要求信用校验通过', sub: '发货前必须通过信用校验。', type: 'switch', enabled: false },
        ],
      },
      {
        key: 'orderApprovedChangeApproval',
        title: '已批准订单变更审批',
        sub: '已批准订单变更产品、数量、金额或交期时重新审批。',
        enabled: false,
        children: [
          { key: 'orderChangeFields', title: '触发字段', sub: '修改哪些字段会触发订单变更审批。', type: 'select', value: '产品/数量/金额/交期', options: ['数量/金额', '产品/数量/金额', '产品/数量/金额/交期'] },
          { key: 'orderChangeFlow', title: '审批流程', sub: '订单变更使用的审批流程。', type: 'select', value: '订单提交审批', options: ['订单提交审批', '信用异常审批'] },
        ],
      },
      {
        key: 'orderConfirmedCancelApproval',
        title: '已确认订单取消审批',
        sub: '已确认订单取消时检查生产、发货、开票和回款状态。',
        enabled: false,
        children: [
          { key: 'orderCancelBlockScene', title: '阻断场景', sub: '存在这些业务进展时不允许直接取消。', type: 'select', value: '已生产/已发货/已开票/已回款', options: ['已发货', '已生产/已发货', '已生产/已发货/已开票/已回款'] },
          { key: 'orderCancelFlow', title: '取消审批流程', sub: '订单取消使用的审批流程。', type: 'select', value: '订单提交审批', options: ['订单提交审批', '信用异常审批'] },
        ],
      },
      {
        key: 'orderFinanceAutoCreate',
        title: '开票/应收自动生成',
        sub: '订单确认或发货后自动生成应收、开票申请或提醒财务。',
        enabled: false,
        children: [
          { key: 'orderReceivablePoint', title: '应收生成节点', sub: '订单在哪个节点生成应收。', type: 'select', value: '发货后', options: ['订单确认后', '发货后', '验收后'] },
          { key: 'orderInvoicePoint', title: '开票申请节点', sub: '订单在哪个节点允许发起开票申请。', type: 'select', value: '发货后', options: ['订单确认后', '发货后', '回款后'] },
        ],
      },
      {
        key: 'orderDeliveryDueReminder',
        title: '交期临近/逾期提醒',
        sub: '交货日期临近或逾期时提醒销售、生产和仓储协同处理。',
        enabled: false,
        children: [
          { key: 'orderDueReminderDays', title: '提前提醒天数', sub: '交期到达前多少天发送提醒。', type: 'select', value: '提前 3 天', options: ['提前 1 天', '提前 3 天', '提前 7 天'] },
          { key: 'orderDueNotifyRoles', title: '通知对象', sub: '交期提醒发送给哪些岗位。', type: 'select', value: '销售 + 生产 + 仓储', options: ['销售负责人', '销售 + 生产', '销售 + 生产 + 仓储'] },
        ],
      },
    ],
  },
];

export const salesSettingTemplates: Record<SalesSettingModule, SalesSettingTemplate> = {
  plans: {
    module: 'plans',
    title: '计划设置',
    backText: '返回计划列表',
    backRoute: '/sales/sales-plans',
    typeTitles: typeTitles('计划'),
    fields: {
      addText: '新增计划字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'product', label: '计划产品' },
        { key: 'detail', label: '计划详情' },
      ],
      rows: fieldRows('plan', [
        ['计划名称', 'plan_name', '文本', 'basic', true],
        ['计划编号', 'plan_code', '自动编号', 'basic', true],
        ['计划周期', 'plan_cycle', '日期范围', 'basic', true],
        ['目标数量', 'target_qty', '数字', 'product', true],
        ['目标金额', 'target_amount', '金额', 'product', true],
        ['统计口径', 'stat_scope', '下拉选项', 'detail', false],
      ]),
    },
    numbers: { prefix: 'SPP', separator: '-', selected: ['y4', 'm', 'd', 's3'], candidates: commonNumberCandidates },
    approvals: { addText: '新增计划审批规则', methods: commonApprovalMethods, rows: approvalRows('plan', [['计划提交审批', '新增销售计划', '李文涛'], ['计划调整审批', '目标变更', '陈思源']]) },
    strategies: { title: '计划策略设置', description: '用于控制目标调整、周期重叠、负责人变更、达成预警和计划关闭。', tabs: planStrategyTabs },
    print: { addText: '新增计划打印模板', columns: [], rows: printRows('plan', '计划') },
  },
  quotes: {
    module: 'quotes',
    title: '报价设置',
    backText: '返回报价列表',
    backRoute: '/sales/sales-quotes',
    typeTitles: typeTitles('报价'),
    fields: {
      addText: '新增报价字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'product', label: '产品明细' },
        { key: 'finance', label: '转化与财务追踪' },
        { key: 'attachment', label: '附件/操作记录' },
      ],
      rows: fieldRows('quote', [
        ['报价主题', 'quote_topic', '文本', 'basic', true],
        ['报价编号', 'quote_code', '自动编号', 'basic', true],
        ['报价分类', 'quote_category', '下拉选项', 'basic', true],
        ['适用范围', 'quote_scope', '对象选择', 'basic', true],
        ['阶梯报价', 'tier_price', '子表', 'product', false],
        ['转化状态', 'conversion_status', '状态', 'finance', false],
      ]),
    },
    numbers: { prefix: 'BJ', separator: '-', selected: ['y4', 'm', 'd', 's3'], candidates: commonNumberCandidates },
    approvals: { addText: '新增报价审批规则', methods: commonApprovalMethods, rows: approvalRows('quote', [['报价提交审批', '通用报价', '老大'], ['促销报价审批', '促销报价', '李文涛']]) },
    strategies: { title: '报价策略设置', description: '用于控制低价审批、客户等级限制、有效期、转化校验和已批准报价变更。', tabs: quoteStrategyTabs },
    print: { addText: '新增报价打印模板', columns: [], rows: printRows('quote', '报价') },
  },
  contracts: {
    module: 'contracts',
    title: '合同设置',
    backText: '返回合同列表',
    backRoute: '/sales/sales-contracts',
    typeTitles: typeTitles('合同'),
    fields: {
      addText: '新增合同字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'product', label: '合同产品' },
        { key: 'finance', label: '财务履约' },
      ],
      rows: fieldRows('contract', [
        ['合同主题', 'contract_topic', '文本', 'basic', true],
        ['合同编号', 'contract_code', '自动编号', 'basic', true],
        ['来源单据', 'source_bill', '关联单据', 'basic', false],
        ['合同金额', 'contract_amount', '金额', 'finance', true],
        ['已回款金额', 'received_amount', '金额', 'finance', false],
        ['剩余金额', 'balance_amount', '金额', 'finance', false],
      ]),
    },
    numbers: { prefix: 'HT', separator: '-', selected: ['y4', 'm', 'd', 's3'], candidates: commonNumberCandidates },
    approvals: { addText: '新增合同审批规则', methods: commonApprovalMethods, rows: approvalRows('contract', [['合同新建审批', '合同新建', '张国'], ['合同变更审批', '合同变更', '李文涛']]) },
    strategies: { title: '合同策略设置', description: '用于控制合同生效、来源一致性、金额变更、履约拦截、财务预警和终止审批。', tabs: contractStrategyTabs },
    print: { addText: '新增合同打印模板', columns: [], rows: printRows('contract', '合同') },
  },
  orders: {
    module: 'orders',
    title: '订单设置',
    backText: '返回订单列表',
    backRoute: '/sales/sales-orders',
    typeTitles: typeTitles('订单'),
    fields: {
      addText: '新增订单字段',
      scopes: [
        { key: 'basic', label: '基础信息' },
        { key: 'product', label: '产品明细' },
        { key: 'finance', label: '发货应收' },
        { key: 'trace', label: '生产/退换货记录' },
      ],
      rows: fieldRows('order', [
        ['订单主题', 'order_topic', '文本', 'basic', true],
        ['订单号', 'order_code', '自动编号', 'basic', true],
        ['订单来源', 'source_type', '来源选择', 'basic', true],
        ['关联客户', 'customer_name', '客户选择', 'basic', true],
        ['交货地址', 'delivery_address', '文本', 'basic', false],
        ['客户联系人', 'contact_name', '文本', 'basic', false],
        ['交货日期', 'delivery_date', '日期', 'basic', true],
        ['支付方式', 'pay_method', '下拉选项', 'basic', false],
        ['信用额度', 'credit_limit', '金额', 'finance', false],
        ['运费支付', 'freight_pay', '下拉选项', 'basic', false],
        ['订单状态', 'order_status', '状态', 'basic', false],
        ['产品明细', 'order_lines', '子表', 'product', true],
        ['产品金额汇总', 'amount_summary', '金额汇总', 'product', false],
        ['信用校验', 'credit_check', '状态', 'finance', false],
        ['信用占用', 'credit_hold', '状态', 'finance', false],
        ['应收金额', 'receivable_amount', '金额', 'finance', false],
        ['开票申请', 'invoice_request', '状态', 'finance', false],
        ['已回款', 'received_amount', '金额', 'finance', false],
        ['异常标签', 'exception_tag', '标签', 'finance', false],
        ['订单进展', 'order_progress', '状态', 'trace', false],
      ]),
    },
    numbers: { prefix: 'SO', separator: '-', selected: ['y4', 'm', 'd', 's3'], candidates: commonNumberCandidates },
    approvals: { addText: '新增订单审批规则', methods: commonApprovalMethods, rows: approvalRows('order', [['订单提交审批', '新增订单', '陈思源'], ['信用异常审批', '信用拦截', '老大']]) },
    strategies: { title: '订单策略设置', description: '用于控制订单来源、信用校验、超来源金额、交期、发货、变更、取消和财务联动。', tabs: orderStrategyTabs },
    print: { addText: '新增订单打印模板', columns: [], rows: printRows('order', '订单') },
  },
};
