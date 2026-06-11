export interface PrdField {
  name: string;
  source: string;
  description: string;
  rules: string;
}

export interface PrdState {
  name: string;
  meaning: string;
  trigger: string;
  next: string;
}

export interface PrdFlow {
  step: string;
  role: string;
  action: string;
  output: string;
}

export interface PrdDocument {
  id: string;
  module: string;
  title: string;
  route: string;
  pageType: string;
  objective: string;
  scope: string[];
  dataSources: string[];
  fields: PrdField[];
  states: PrdState[];
  flows: PrdFlow[];
  interactions: string[];
  validations: string[];
  writeBacks: string[];
  acceptance: string[];
}

export interface PrdTreeNode {
  id: string;
  label: string;
  level: 1 | 2 | 3 | 4;
  docId?: string;
  sectionId?: string;
  children?: PrdTreeNode[];
}

export const prdSections = [
  { id: 'sources', label: '数据来源' },
  { id: 'fields', label: '字段说明' },
  { id: 'states', label: '状态机' },
  { id: 'flows', label: '业务流程' },
];

const receivableStates: PrdState[] = [
  { name: '待生成', meaning: '上游业务已产生财务触发条件，但尚未形成应收单。', trigger: '销售订单审核、合同收款计划到期、售后调整确认。', next: '待收款 / 已调整' },
  { name: '待收款', meaning: '应收单已生成，未登记有效收款。', trigger: '应收单创建完成且未有收款流水。', next: '部分收款 / 已收款 / 已调整 / 已关闭' },
  { name: '部分收款', meaning: '存在有效收款但未覆盖全部未收金额。', trigger: '收款登记并部分核销。', next: '已收款 / 已核销 / 已调整' },
  { name: '已收款', meaning: '累计收款覆盖应收金额，等待或已进入核销处理。', trigger: '已收金额大于等于应收金额。', next: '已核销 / 已关闭' },
  { name: '已核销', meaning: '收款流水与应收单完成匹配，信用占用可释放。', trigger: '核销收款通过。', next: '已关闭 / 已调整' },
  { name: '已调整', meaning: '因售后、折让、退货或手工调整改变应收金额。', trigger: '应收调整单审核通过。', next: '待收款 / 已核销 / 已关闭' },
  { name: '已关闭', meaning: '应收业务不再允许新增收款、调整或红冲外动作。', trigger: '余额为零且所有派生动作完成。', next: '终态' },
];

const payableStates: PrdState[] = [
  { name: '暂估', meaning: '采购入库已完成但尚未到票，按入库/订单暂估形成应付。', trigger: '采购入库完成。', next: '待到票 / 已冲减' },
  { name: '待到票', meaning: '应付已存在，等待供应商发票或收票认证。', trigger: '暂估应付生成或付款条件要求到票。', next: '待付款 / 已冲减' },
  { name: '待付款', meaning: '三单匹配和付款条件满足，尚未登记付款。', trigger: '到票认证、三单匹配通过。', next: '部分付款 / 已付款 / 已冲减' },
  { name: '部分付款', meaning: '已付款但未覆盖全部可付款金额。', trigger: '付款登记或付款核销部分完成。', next: '已付款 / 已核销 / 已冲减' },
  { name: '已付款', meaning: '累计付款覆盖可付款金额，等待核销或已完成核销。', trigger: '付款金额覆盖未付金额。', next: '已核销 / 已关闭' },
  { name: '已核销', meaning: '付款流水与应付单完成匹配，可付款金额被释放或归零。', trigger: '付款核销通过。', next: '已关闭' },
  { name: '已冲减', meaning: '采购退货、质检扣款、红冲导致应付金额减少。', trigger: '冲减单据审核通过。', next: '待付款 / 已核销 / 已关闭' },
  { name: '已关闭', meaning: '供应商侧应付事项全部完成。', trigger: '未付金额为零且对账完成。', next: '终态' },
];

const threeWayMatchStates: PrdState[] = [
  { name: '待匹配', meaning: '采购订单、入库记录、进项发票三方尚未完成比对。', trigger: '应付暂估生成、到票登记或采购入库完成。', next: '部分匹配 / 已匹配 / 差异待处理' },
  { name: '部分匹配', meaning: '三方中至少两方已匹配，但数量、金额、税额或来源行仍有缺口。', trigger: '订单和入库已匹配但发票未到，或发票金额只覆盖部分入库金额。', next: '已匹配 / 差异待处理' },
  { name: '已匹配', meaning: '采购订单、入库记录、进项发票三方来源、数量和金额均满足策略。', trigger: '三方比对通过，差异在允许阈值内。', next: '待付款 / 已关闭' },
  { name: '差异待处理', meaning: '三方数量、金额、税额、供应商或来源行存在不可自动通过的差异。', trigger: '差异超过策略阈值或来源引用不一致。', next: '待匹配 / 部分匹配 / 已匹配 / 已关闭' },
];

const invoiceStates: PrdState[] = [
  { name: '待开票', meaning: '销售或售后来源产生开票申请，尚未完成销项开票。', trigger: '销售发起开票申请或售后触发红冲前置检查。', next: '已开票 / 异常' },
  { name: '已开票', meaning: '销项发票已开具，并可回写销售订单/合同。', trigger: '财务完成开票。', next: '待红冲 / 已关闭' },
  { name: '待收票', meaning: '采购侧应付已产生，等待供应商发票。', trigger: '采购订单入库或应付到票节点。', next: '待认证 / 异常' },
  { name: '待认证', meaning: '进项发票已收到，等待认证或勾稽。', trigger: '收票登记完成。', next: '已认证 / 异常' },
  { name: '已认证', meaning: '进项发票认证通过，参与三单匹配。', trigger: '税务认证通过。', next: '已关闭' },
  { name: '待红冲', meaning: '售后退款/退货或采购退货触发红冲申请。', trigger: '售后处理方案或采购退货确认。', next: '已红冲 / 异常' },
  { name: '已红冲', meaning: '红字发票处理完成，可参与售后关闭校验。', trigger: '红冲发票开具完成。', next: '已关闭' },
  { name: '异常', meaning: '发票金额、税额、抬头、来源或认证结果不一致。', trigger: '校验不通过或税务接口返回异常。', next: '待开票 / 待认证 / 待红冲 / 已关闭' },
];

const settlementStates: PrdState[] = [
  { name: '待确认', meaning: '收款、付款或退款流水已录入但未完成财务确认。', trigger: '手工登记或银行流水导入。', next: '已确认 / 差异待处理' },
  { name: '已确认', meaning: '金额、账户、往来单位和来源对象确认无误。', trigger: '财务确认流水。', next: '待对账 / 待核销' },
  { name: '待对账', meaning: '系统流水等待银行流水匹配。', trigger: '流水确认后进入银行对账。', next: '已对账 / 差异待处理' },
  { name: '已对账', meaning: '银行流水与系统流水金额、日期、账户匹配。', trigger: '银行对账匹配通过。', next: '待核销 / 已核销' },
  { name: '待核销', meaning: '流水尚未匹配到应收、应付或退款对象。', trigger: '流水确认或对账完成。', next: '部分核销 / 已核销' },
  { name: '部分核销', meaning: '流水仅匹配部分财务对象或部分金额。', trigger: '手工或自动核销部分完成。', next: '已核销 / 差异待处理' },
  { name: '已核销', meaning: '流水金额全部分配到应收、应付或退款单。', trigger: '核销通过并回写对象状态。', next: '已关闭' },
  { name: '差异待处理', meaning: '银行流水、系统流水、来源单据金额或对象不一致。', trigger: '对账/核销校验失败。', next: '已确认 / 待对账 / 待核销 / 已关闭' },
];

const settingStates: PrdState[] = [
  { name: '草稿', meaning: '策略已创建但未发布，不影响业务。', trigger: '新增或编辑策略。', next: '待审批 / 已发布' },
  { name: '待审批', meaning: '策略涉及审批、编号或回写规则变更，等待负责人确认。', trigger: '提交策略审批。', next: '已发布 / 已驳回' },
  { name: '已发布', meaning: '策略生效并被财务页面读取。', trigger: '审批通过或直接发布。', next: '已停用 / 草稿' },
  { name: '已驳回', meaning: '策略审批未通过，需要调整。', trigger: '审批拒绝。', next: '草稿' },
  { name: '已停用', meaning: '策略不再参与新单据，历史单据保留原规则。', trigger: '停用策略。', next: '已发布' },
];

const commonCreateFields: PrdField[] = [
  { name: '来源单据', source: '来源选择弹窗', description: '选择销售、采购、售后、仓储或财务对象作为创建依据。', rules: '正常业务必须选择来源；无来源只能作为 manual 手工录入并填写原因。' },
  { name: '往来单位', source: '来源单据带入', description: '客户、供应商或售后客户。', rules: '选择来源后自动带入，可编辑时必须保留审计记录。' },
  { name: '来源类型', source: 'sourceRef.sourceType', description: '标识来源对象类型。', rules: '使用契约枚举，例如 sales_order、purchase_order、after_sales、manual。' },
  { name: '来源引用', source: 'sourceRef', description: '来源类型和来源单号组合展示。', rules: '必须可点击回到业务来源；manual 需要显示手工原因。' },
  { name: '明细子表', source: '来源行/财务明细', description: '展示来源行、金额、已处理金额、待处理金额。', rules: '金额必须可追溯，不允许超过来源可处理金额。' },
  { name: '附件', source: '上传组件', description: '银行回单、发票附件、审批材料。', rules: '关键动作保存时必须校验必传附件。' },
  { name: '备注/说明', source: '人工填写', description: '差异原因、核销说明、调整说明。', rules: '手工单据、差异处理、红冲处理必填。' },
];

const dashboardFields: PrdField[] = [
  { name: '待收款应收', source: '应收单未收金额', description: '统计未收金额大于 0 且未关闭的应收单。', rules: '排除已关闭和已冲销记录。' },
  { name: '逾期应收', source: '应收单到期日', description: '到期日早于当前日期且未收金额大于 0 的应收。', rules: '按客户、账龄分组，支持进入应收列表。' },
  { name: '待付款应付', source: '应付单未付金额', description: '统计可付款金额大于 0 的应付。', rules: '未满足三单匹配时只能提示，不允许直接付款。' },
  { name: '待开票/待收票认证', source: '发票记录', description: '统计销项待开票和进项待认证记录。', rules: '区分销项、进项、红冲方向。' },
  { name: '待银行对账', source: '资金流水', description: '统计未对账或差异待处理流水。', rules: '点击进入资金核销银行对账页面。' },
];

const receivableFields: PrdField[] = [
  { name: '应收单号', source: 'Receivable.code', description: '应收单唯一编号。', rules: '自动生成，列表和详情主链接。' },
  { name: '来源类型', source: 'sourceRef.sourceType', description: '销售订单、销售合同、售后单或 manual。', rules: '不得把仓储确认点当作主来源；仓储出库只能作为确认节点。' },
  { name: '来源单据', source: 'sourceRef.sourceCode', description: '生成应收的业务单据。', rules: '必须可点击跳回销售、售后或手工来源说明。' },
  { name: '客户', source: '客户档案/来源单据', description: '应收往来客户。', rules: '客户财务信息缺失时提示补全开票信息、账期和联系人。' },
  { name: '应收金额', source: '合同/订单/出库确认金额', description: '本次应收总金额。', rules: '售后调整允许负数，必须关联售后原因。' },
  { name: '已收金额', source: '收款核销记录', description: '已匹配到该应收的收款金额。', rules: '只能由核销结果写入。' },
  { name: '未收金额', source: '应收金额 - 已收金额 - 调整金额', description: '当前仍需收款金额。', rules: '不得为非法空值；负数仅限调整类应收。' },
  { name: '到期日/账龄', source: '客户账期/合同收款计划', description: '用于逾期和账龄分析。', rules: '账龄每天按到期日刷新。' },
  { name: '开票状态', source: '发票管理', description: '待开票、已开票、待红冲等。', rules: '只能由发票动作回写。' },
  { name: '核销状态/状态', source: '资金核销', description: '待核销、部分核销、已核销及应收业务状态。', rules: '由收款和核销推进，不允许手工跳终态。' },
];

const payableFields: PrdField[] = [
  { name: '应付单号', source: 'Payable.code', description: '应付单唯一编号。', rules: '暂估、到票后应付、冲减应付统一编号。' },
  { name: '来源类型/来源单据', source: 'sourceRef', description: '采购订单、采购入库、采购退货。', rules: '三单匹配需保留 PO、IN、PINV 三方引用。' },
  { name: '供应商', source: '供应商档案', description: '应付往来单位。', rules: '付款前必须存在有效账户和付款条件。' },
  { name: '应付金额/已付/未付', source: '采购订单、入库、发票、付款核销', description: '应付金额及付款进度。', rules: '质检扣款、退货冲减影响可付款金额。' },
  { name: '到期日', source: '付款条件', description: '付款计划到期日期。', rules: '到期日前可申请，不一定允许付款，取决于审批策略。' },
  { name: '到票状态', source: '发票管理', description: '待到票、已到票、已认证。', rules: '未到票付款需命中策略例外。' },
  { name: '三单匹配状态', source: '订单/入库/发票匹配结果', description: '待匹配、部分匹配、已匹配。', rules: '金额差异超阈值必须进入差异审批。' },
  { name: '核销状态/状态', source: '资金核销', description: '付款和核销状态。', rules: '付款登记不等于核销完成。' },
];

const invoiceFields: PrdField[] = [
  { name: '发票单号/申请号', source: 'Invoice.code', description: '销项、进项或红冲记录编号。', rules: '申请号和正式发票号需保留映射。' },
  { name: '发票方向', source: 'Invoice.direction', description: '销项、进项、红冲。', rules: '方向决定字段、状态机和回写对象。' },
  { name: '来源单据', source: 'sourceRef', description: '销售订单、采购订单、售后单等。', rules: '红冲必须关联原发票或售后处理方案。' },
  { name: '往来单位', source: '客户/供应商/售后客户', description: '发票抬头对应的往来单位。', rules: '开票前校验税号、地址电话、开户行账号。' },
  { name: '未税金额/税额/价税合计', source: '发票明细', description: '税务口径金额。', rules: '价税合计必须等于未税金额加税额，允许配置舍入规则。' },
  { name: '开票/收票日期', source: '发票处理动作', description: '销项开票或进项收票日期。', rules: '影响期间统计和认证期限。' },
  { name: '勾稽/认证状态', source: '税务认证/发票勾稽', description: '待勾稽、待认证、已认证、已红冲。', rules: '认证通过后回写采购到票和三单匹配。' },
];

const settlementFields: PrdField[] = [
  { name: '流水单号', source: 'Settlement.code', description: '资金流水唯一编号。', rules: '银行导入和手工登记都必须编号。' },
  { name: '流水方向', source: 'Settlement.direction', description: '收款、付款、退款。', rules: '方向决定可核销对象：应收、应付或退款单。' },
  { name: '来源单据', source: 'sourceRef', description: '应收单、应付单、售后退款单。', rules: '无来源时只能先待确认，不能自动核销。' },
  { name: '往来单位', source: '来源对象/银行摘要匹配', description: '客户、供应商或售后客户。', rules: '与核销对象不一致时进入差异待处理。' },
  { name: '金额/账户', source: '银行流水或手工登记', description: '到账或付款金额及账户。', rules: '账户必须在资金策略中启用。' },
  { name: '到账/付款日期', source: '银行交易日期', description: '资金发生日期。', rules: '不得晚于当前业务日期；补录需备注。' },
  { name: '可核销/已核销金额', source: '核销记录', description: '本流水可分配和已分配金额。', rules: '已核销金额不得超过流水金额。' },
  { name: '对账状态/核销状态', source: '银行对账和核销动作', description: '银行匹配和业务清账状态。', rules: '对账差异未处理时禁止自动终态。' },
];

const settingFields: PrdField[] = [
  { name: '应收策略', source: '财务设置', description: '应收生成节点、账龄规则、信用释放规则。', rules: '必须沿用公共设置母版，可编辑、可审批、可回滚。' },
  { name: '应付策略', source: '财务设置', description: '暂估生成节点、三单匹配规则、付款审批规则。', rules: '规则变更只影响新单据，历史单据保留原策略快照。' },
  { name: '发票策略', source: '财务设置', description: '开票节点、红冲规则、认证规则。', rules: '税务相关策略必须记录操作人和生效时间。' },
  { name: '资金策略', source: '财务设置', description: '账户、收付款方式、核销规则、对账规则。', rules: '账户停用后不可被新流水选择。' },
  { name: '公共母版', source: '设置中心', description: '自定义字段、编号、审批、打印模板。', rules: '复用客户管理/销售设置已验收交互。' },
];

function baseFlows(objectName: string, source: string, action: string): PrdFlow[] {
  return [
    { step: '1', role: '业务系统', action: `从${source}产生${objectName}候选数据。`, output: '来源引用、往来单位、金额、业务中心。' },
    { step: '2', role: '财务人员', action: `在${objectName}页面复核来源、金额、状态和附件。`, output: '待处理记录或草稿。' },
    { step: '3', role: '财务人员', action, output: '财务单据状态推进。' },
    { step: '4', role: '系统', action: '只回写来源单据状态和汇总金额，不修改业务源明细。', output: '销售、采购、售后、仓储可见财务处理结果。' },
  ];
}

function listDoc(id: string, module: string, title: string, route: string, fields: PrdField[], states: PrdState[], dataSources: string[], sourceText: string): PrdDocument {
  return {
    id,
    module,
    title,
    route,
    pageType: '列表页',
    objective: `集中查看${title.replace('列表', '')}的财务记录、处理进度和风险状态，支持搜索、筛选、字段配置、导入、导出、新增入口。`,
    scope: ['展示当前模块核心财务对象', '提供统计卡片和日期筛选', '进入详情或动作处理页', '不直接篡改来源业务明细'],
    dataSources,
    fields,
    states,
    flows: baseFlows(title, sourceText, '通过列表操作进入详情、新增或处理动作。'),
    interactions: ['顶部日期筛选必须使用财务语义日期，例如到期日、开票/收票日期、到账/付款日期。', '列表必须使用统一列表母版：搜索左侧，刷新/筛选/字段配置/导入/导出/新增右侧。', '来源单据字段必须可点击跳回业务来源。', '状态字段使用颜色标识，但颜色不能替代文字状态。'],
    validations: ['每条记录必须有来源；manual 必须显示手工原因。', '金额字段必须有两位小数并保留负数调整场景。', '筛选项必须覆盖状态机里的所有有效状态。'],
    writeBacks: ['列表页不执行回写，只展示由详情页、动作页或后端任务产生的回写结果。'],
    acceptance: ['列表字段与 PRD 字段一致。', '来源单据可追溯。', '状态筛选不缺枚举。', '统计卡片随列表筛选同步。'],
  };
}

function createDoc(id: string, module: string, title: string, route: string, states: PrdState[], dataSources: string[], target: string): PrdDocument {
  return {
    id,
    module,
    title,
    route,
    pageType: '新增/编辑页',
    objective: `通过来源单据创建${target}，保证金额、往来单位、来源引用和回写目标可追溯。`,
    scope: ['选择来源单据', '带入来源明细', '补充附件和备注', '保存后进入列表或详情', '产生前端状态变化'],
    dataSources,
    fields: commonCreateFields,
    states,
    flows: baseFlows(target, '来源选择弹窗', `保存${target}草稿或提交确认。`),
    interactions: ['来源选择弹窗只显示当前模块允许的来源类型。', '选择来源后自动替换明细子表。', '手工录入必须填写手工原因。', '保存后返回来源动作页或当前模块列表。'],
    validations: ['未选择来源时只能保存为 manual。', '来源金额不得超过可处理金额。', '必填附件缺失时阻止提交。', '回写目标必须展示“只回写状态和汇总”。'],
    writeBacks: ['新增页保存草稿不回写业务源；提交确认后由后端按状态机回写来源汇总。'],
    acceptance: ['来源弹窗过滤正确。', '手工原因可见。', '明细金额可追溯。', '保存后路由回到正确页面。'],
  };
}

function detailDoc(id: string, module: string, title: string, route: string, fields: PrdField[], states: PrdState[], dataSources: string[], target: string): PrdDocument {
  return {
    id,
    module,
    title,
    route,
    pageType: '详情页',
    objective: `展示${target}的基础信息、来源明细、处理记录、凭证只读记录和操作日志。`,
    scope: ['顶部返回和动作容器', '基础信息容器', 'Tab 切换', '来源单据跳转', '操作记录留痕'],
    dataSources,
    fields: fields.slice(0, 8),
    states,
    flows: baseFlows(target, '列表页或动作页', `查看${target}并发起允许的下一步操作。`),
    interactions: ['基础信息必须和 Tab 排在同一详情母版内。', '来源明细 Tab 展示 sourceRef 和确认节点。', '凭证记录仅只读展示，不作为独立凭证模块。', '操作按钮必须受当前状态控制。'],
    validations: ['无效 id 不得回退到第一条数据。', '售后关闭校验必须逐项展示。', '三单匹配必须同时展示订单、入库、发票。'],
    writeBacks: ['详情页动作完成后回写来源状态、汇总金额和处理状态。'],
    acceptance: ['基础信息和 Tab 布局正确。', '来源可点击。', '状态解释完整。', '操作按钮不越权。'],
  };
}

function actionDoc(id: string, module: string, title: string, route: string, pageType: string, fields: PrdField[], states: PrdState[], dataSources: string[], action: string, validations: string[], writeBacks: string[]): PrdDocument {
  return {
    id,
    module,
    title,
    route,
    pageType,
    objective: `处理${title}相关的待办队列，明确处理对象、金额口径、状态推进和回写目标。`,
    scope: ['展示待处理来源清单', '提供新增/处理入口', '记录处理结果', '回写来源状态和汇总'],
    dataSources,
    fields,
    states,
    flows: baseFlows(title, dataSources.join('、'), action),
    interactions: ['动作页使用列表母版，不再生成伪单据号。', '卡片只统计当前动作相关数据。', '查看操作进入原始财务对象详情。', '不可把动作页作为独立业务模块。'],
    validations,
    writeBacks,
    acceptance: ['动作页名称、字段、数据与当前处理对象一致。', '不会出现伪造业务单号。', '状态推进符合状态机。', '回写目标清晰可见。'],
  };
}

function settingDoc(id: string, title: string, route: string, objective: string, fields: PrdField[] = settingFields): PrdDocument {
  return {
    id,
    module: '财务设置',
    title,
    route,
    pageType: '设置页',
    objective,
    scope: ['策略配置', '公共母版复用', '审批与发布', '历史策略留痕'],
    dataSources: ['财务策略配置', '公共设置母版', '客户管理/销售设置已验收交互'],
    fields,
    states: settingStates,
    flows: [
      { step: '1', role: '财务管理员', action: '进入财务设置并选择策略页签。', output: '策略配置草稿。' },
      { step: '2', role: '财务管理员', action: '编辑策略、编号、审批或模板。', output: '待审批或待发布策略。' },
      { step: '3', role: '审批人', action: '审批涉及业务规则变化的策略。', output: '已发布或已驳回。' },
      { step: '4', role: '系统', action: '新单据读取最新发布策略，历史单据保留策略快照。', output: '策略生效记录。' },
    ],
    interactions: ['必须使用设置母版，不写死不可编辑卡片。', '策略项支持编辑、审批、发布、停用。', '公共字段、编号、审批、打印模板复用公共设置能力。'],
    validations: ['策略发布前校验必填项。', '影响回写或金额的策略必须审批。', '策略停用不得影响历史单据。'],
    writeBacks: ['设置页不回写业务单据，只影响后续单据生成和动作校验。'],
    acceptance: ['设置项可编辑。', '策略状态机完整。', '公共母版入口一致。', '策略说明可追溯。'],
  };
}

const dataSources = {
  workbench: ['应收管理', '应付管理', '发票管理', '资金核销', '销售中心', '采购中心', '售后中心', '仓储中心'],
  receivables: ['销售订单发货应收', '销售合同收款计划', '售后应收调整', '收款核销记录', '客户信用占用记录'],
  payables: ['采购订单', '采购入库', '进项发票', '付款核销记录', '采购退货/质检扣款'],
  invoices: ['销售开票申请', '采购收票记录', '售后红冲申请', '税务认证记录', '发票勾稽记录'],
  settlements: ['银行流水', '收款单', '付款单', '退款付款单', '应收/应付/售后退款核销对象'],
  settings: ['财务策略', '公共字段设置', '编号规则', '审批规则', '打印模板'],
};

export const financePrdDocuments: PrdDocument[] = [
  {
    id: 'finance-workbench',
    module: '财务工作台',
    title: '财务工作台 PRD',
    route: '/finance',
    pageType: '工作台',
    objective: '提供财务中心一期总览、待办和风险提醒，不承载复杂编辑，保持默认工作台风格。',
    scope: ['待办汇总', '风险提醒', '最近财务流转', '跨中心回写摘要'],
    dataSources: dataSources.workbench,
    fields: dashboardFields,
    states: [...receivableStates.slice(1, 4), ...payableStates.slice(0, 4), ...invoiceStates.slice(0, 4), ...settlementStates.slice(0, 4)],
    flows: [
      { step: '1', role: '系统', action: '聚合应收、应付、发票、资金核销待办。', output: '工作台统计卡片。' },
      { step: '2', role: '财务人员', action: '查看逾期、超信用、待付款、发票异常、退款超时。', output: '风险处理优先级。' },
      { step: '3', role: '财务人员', action: '点击待办进入对应列表或处理页。', output: '进入业务处理页面。' },
      { step: '4', role: '系统', action: '展示最近财务回写记录。', output: '销售、采购、售后、仓储联动结果。' },
    ],
    interactions: ['保持默认工作台样式。', '卡片点击只能跳转，不直接修改数据。', '风险提醒按金额、到期日和状态排序。'],
    validations: ['工作台不得新增复杂编辑表单。', '统计口径必须与列表页一致。', '风险项必须可追溯到来源单据。'],
    writeBacks: ['工作台不产生回写，只展示其他页面处理后的回写摘要。'],
    acceptance: ['默认工作台风格不变。', '六个核心入口清晰。', '待办数据可跳转到对应页面。'],
  },
  listDoc('receivables-list', '应收管理', '应收列表', '/finance/receivables', receivableFields, receivableStates, dataSources.receivables, '销售订单、销售合同、售后应收调整'),
  createDoc('receivables-create', '应收管理', '新增应收', '/finance/receivables?action=new', receivableStates, dataSources.receivables, '应收单'),
  detailDoc('receivables-detail', '应收管理', '应收详情', '/finance/receivables?id={id}', receivableFields, receivableStates, dataSources.receivables, '应收单'),
  actionDoc('receivables-receive', '应收管理', '收款登记', '/finance/receivables?action=receive', '动作列表页', receivableFields.filter((field) => ['应收单号', '客户', '来源单据', '未收金额', '核销状态/状态'].includes(field.name)), receivableStates, dataSources.receivables, '登记客户收款并生成待核销资金流水。', ['未收金额小于等于 0 不进入待登记队列。', '客户账户、收款账户和到账日期必须校验。'], ['生成收款流水后回写应收为部分收款或已收款。']),
  actionDoc('receivables-settle', '应收管理', '核销收款', '/finance/receivables?action=settle', '动作列表页', receivableFields, receivableStates, [...dataSources.receivables, '资金收款流水'], '将收款流水匹配到应收单。', ['可核销金额不得超过未收金额。', '收款客户必须和应收客户一致，差异进入人工确认。'], ['回写应收核销状态、已收金额、未收金额和客户信用释放。']),
  actionDoc('receivables-adjust', '应收管理', '应收调整', '/finance/receivables?action=adjust', '动作列表页', receivableFields, receivableStates, ['售后单', '退货入库记录', '发票红冲状态', '原应收单'], '处理售后退货、退款、折让产生的应收调整。', ['必须关联售后处理方案。', '负数调整必须展示原因和红冲校验。', '退款未付款时不得显示售后关闭通过。'], ['回写售后单应收已调整，等待退款付款和红冲完成后关闭。']),
  actionDoc('receivables-reconcile', '应收管理', '客户对账', '/finance/receivables?action=reconcile', '对账列表页', receivableFields, receivableStates, ['应收单', '收款核销记录', '客户档案', '开票记录'], '生成客户维度对账结果。', ['对账只确认往来余额，不修改来源明细。', '逾期和争议金额必须单独标记。'], ['回写客户对账状态和对账确认记录。']),

  listDoc('payables-list', '应付管理', '应付列表', '/finance/payables', payableFields, payableStates, dataSources.payables, '采购订单、采购入库、采购退货、进项发票'),
  createDoc('payables-create', '应付管理', '新增应付', '/finance/payables?action=new', payableStates, dataSources.payables, '应付单'),
  detailDoc('payables-detail', '应付管理', '应付详情', '/finance/payables?id={id}', payableFields, payableStates, dataSources.payables, '应付单'),
  actionDoc('payables-apply', '应付管理', '付款申请', '/finance/payables?action=apply', '动作列表页', payableFields, payableStates, dataSources.payables, '基于可付款金额发起付款申请。', ['未到票或三单未匹配时按策略判断是否允许申请。', '申请金额不得超过可付款金额。'], ['生成付款申请状态，回写采购订单付款申请中。']),
  actionDoc('payables-pay', '应付管理', '付款登记', '/finance/payables?action=pay', '动作列表页', payableFields, payableStates, [...dataSources.payables, '付款账户'], '登记供应商付款流水。', ['付款账户必须启用。', '供应商收款账户必须来自供应商档案或审批通过的临时账户。'], ['生成付款流水，回写应付部分付款或已付款。']),
  actionDoc('payables-settle', '应付管理', '付款核销', '/finance/payables?action=settle', '动作列表页', payableFields, payableStates, [...dataSources.payables, '付款流水'], '将付款流水核销到应付单。', ['供应商、金额、币种必须一致。', '差异金额进入差异处理，不自动关闭。'], ['回写应付核销状态、已付金额、未付金额和采购订单付款状态。']),
  actionDoc('payables-invoice', '应付管理', '收票认证', '/finance/payables?action=invoice', '动作列表页', invoiceFields, invoiceStates, ['采购订单', '采购入库', '进项发票', '税务认证结果'], '登记并认证供应商进项发票。', ['发票金额必须和订单/入库金额可匹配。', '认证异常不得推进三单匹配。'], ['回写采购订单到票状态和应付到票状态。']),
  actionDoc('payables-match', '应付管理', '三单匹配', '/finance/payables?action=match', '匹配工作台', payableFields, threeWayMatchStates, ['采购订单 PO', '采购入库 IN', '进项发票 PINV'], '比对订单、入库、发票三方金额和数量。', ['必须同时展示 PO、IN、PINV 三方引用。', '金额差异超过策略阈值必须审批。', '质检扣款影响可付款金额。'], ['回写三单匹配状态和可付款金额。']),
  actionDoc('payables-reconcile', '应付管理', '供应商对账', '/finance/payables?action=reconcile', '对账列表页', payableFields, payableStates, ['应付单', '付款核销记录', '供应商档案', '进项发票'], '生成供应商维度对账结果。', ['对账不改变采购源明细。', '差异必须挂供应商、采购订单或发票原因。'], ['回写供应商对账状态和对账确认记录。']),

  listDoc('invoices-list', '发票管理', '发票列表', '/finance/invoices', invoiceFields, invoiceStates, dataSources.invoices, '销售开票申请、采购收票、售后红冲'),
  createDoc('invoices-create', '发票管理', '新增发票', '/finance/invoices?action=new', invoiceStates, dataSources.invoices, '发票记录'),
  detailDoc('invoices-detail', '发票管理', '发票详情', '/finance/invoices?id={id}', invoiceFields, invoiceStates, dataSources.invoices, '发票记录'),
  actionDoc('invoices-output', '发票管理', '销项开票', '/finance/invoices?action=output', '动作列表页', invoiceFields, invoiceStates, ['销售订单', '销售合同', '开票申请', '客户开票资料'], '完成销售销项开票。', ['开票抬头、税号、金额和来源单据必须一致。', '未审核销售订单不得开票。'], ['回写销售订单和合同开票状态。']),
  actionDoc('invoices-input', '发票管理', '进项收票认证', '/finance/invoices?action=input', '动作列表页', invoiceFields, invoiceStates, ['采购订单', '供应商发票', '税务认证结果'], '登记并认证进项发票。', ['供应商税号、金额、税额必须校验。', '认证失败进入异常。'], ['回写采购订单到票状态和三单匹配依据。']),
  actionDoc('invoices-match', '发票管理', '发票勾稽', '/finance/invoices?action=match', '勾稽列表页', invoiceFields, invoiceStates, ['发票记录', '应收单', '应付单', '资金核销记录'], '建立发票与来源财务对象的勾稽关系。', ['同一发票不可重复勾稽超额。', '红冲发票必须勾稽原发票。'], ['回写发票勾稽状态和来源单据发票状态。']),
  actionDoc('invoices-red', '发票管理', '红冲处理', '/finance/invoices?action=red', '动作列表页', invoiceFields, invoiceStates, ['售后单', '原发票', '应收调整单', '退款付款单'], '处理售后退款/退货和采购退货触发的红冲。', ['必须关联原发票和红冲原因。', '售后关闭前必须检查红冲是否完成。', '退款未付款时不得显示关闭通过。'], ['回写售后单发票已红冲，但关闭校验需等待退款付款和应收调整。']),

  listDoc('settlements-list', '资金核销', '流水列表', '/finance/settlements', settlementFields, settlementStates, dataSources.settlements, '银行流水、收款单、付款单、退款付款单'),
  createDoc('settlements-create', '资金核销', '新增流水', '/finance/settlements?action=new', settlementStates, dataSources.settlements, '资金流水'),
  detailDoc('settlements-detail', '资金核销', '流水详情', '/finance/settlements?id={id}', settlementFields, settlementStates, dataSources.settlements, '资金流水'),
  actionDoc('settlements-receive', '资金核销', '收款登记', '/finance/settlements?action=receive', '动作列表页', settlementFields, settlementStates, ['应收单', '银行收款流水', '客户档案'], '登记客户收款流水并准备核销。', ['收款客户必须匹配应收客户。', '无来源收款只能进入待确认。'], ['回写应收收款状态，核销后释放信用。']),
  actionDoc('settlements-pay', '资金核销', '付款登记', '/finance/settlements?action=pay', '动作列表页', settlementFields, settlementStates, ['应付单', '银行付款流水', '供应商账户'], '登记供应商付款流水并准备核销。', ['付款账户和供应商账户必须校验。', '未审批付款申请不得付款。'], ['回写应付付款状态，核销后更新采购付款状态。']),
  actionDoc('settlements-refund', '资金核销', '退款付款', '/finance/settlements?action=refund', '动作列表页', settlementFields, settlementStates, ['售后退款单', '售后处理方案', '银行付款流水'], '处理售后退款付款。', ['退款未确认付款时不得回写已付款。', '售后关闭需同时满足退货入库、退款付款、应收调整、发票红冲。'], ['付款确认后回写售后退款已付款，未付款前只显示待付款。']),
  actionDoc('settlements-settle', '资金核销', '核销处理', '/finance/settlements?action=settle', '核销工作台', settlementFields, settlementStates, ['资金流水', '应收单', '应付单', '售后退款单'], '将收款、付款、退款流水核销到对应财务对象。', ['流水方向必须和核销对象一致。', '可核销金额不得超过对象余额。', '差异进入差异待处理。'], ['回写应收、应付或售后退款单核销状态。']),
  actionDoc('settlements-bank', '资金核销', '银行对账', '/finance/settlements?action=bank', '对账工作台', settlementFields, settlementStates, ['银行流水导入文件', '系统资金流水', '账户配置'], '匹配银行流水和系统流水。', ['账户、金额、日期、摘要匹配度不足时进入差异待处理。', '未对账流水可核销但必须提示风险。'], ['回写流水对账状态和差异处理结果。']),

  settingDoc('settings-overview', '财务设置', '/finance/settings', '配置应收、应付、发票、资金四类策略，并复用公共设置母版。'),
  settingDoc('settings-receivable', '应收策略设置', '/finance/settings?tab=receivable', '配置应收生成节点、账龄规则、信用释放规则。', [settingFields[0]]),
  settingDoc('settings-payable', '应付策略设置', '/finance/settings?tab=payable', '配置暂估生成节点、三单匹配规则、付款审批规则。', [settingFields[1]]),
  settingDoc('settings-invoice', '发票策略设置', '/finance/settings?tab=invoice', '配置销项开票、进项认证和红冲规则。', [settingFields[2]]),
  settingDoc('settings-fund', '资金策略设置', '/finance/settings?tab=fund', '配置账户、收付款方式、核销和银行对账规则。', [settingFields[3], settingFields[4]]),
];

function treePage(docId: string, label: string): PrdTreeNode {
  return {
    id: `page-${docId}`,
    label,
    level: 3,
    docId,
    children: prdSections.map((section) => ({
      id: `${docId}-${section.id}`,
      label: section.label,
      level: 4,
      docId,
      sectionId: section.id,
    })),
  };
}

export const financePrdTree: PrdTreeNode[] = [
  {
    id: 'finance-center',
    label: '财务中心',
    level: 1,
    children: [
      { id: 'finance-workbench-module', label: '财务工作台', level: 2, children: [treePage('finance-workbench', '财务工作台')] },
      {
        id: 'receivables-module',
        label: '应收管理',
        level: 2,
        children: [
          treePage('receivables-list', '应收列表'),
          treePage('receivables-create', '新增应收'),
          treePage('receivables-detail', '应收详情'),
          treePage('receivables-receive', '收款登记'),
          treePage('receivables-settle', '核销收款'),
          treePage('receivables-adjust', '应收调整'),
          treePage('receivables-reconcile', '客户对账'),
        ],
      },
      {
        id: 'payables-module',
        label: '应付管理',
        level: 2,
        children: [
          treePage('payables-list', '应付列表'),
          treePage('payables-create', '新增应付'),
          treePage('payables-detail', '应付详情'),
          treePage('payables-apply', '付款申请'),
          treePage('payables-pay', '付款登记'),
          treePage('payables-settle', '付款核销'),
          treePage('payables-invoice', '收票认证'),
          treePage('payables-match', '三单匹配'),
          treePage('payables-reconcile', '供应商对账'),
        ],
      },
      {
        id: 'invoices-module',
        label: '发票管理',
        level: 2,
        children: [
          treePage('invoices-list', '发票列表'),
          treePage('invoices-create', '新增发票'),
          treePage('invoices-detail', '发票详情'),
          treePage('invoices-output', '销项开票'),
          treePage('invoices-input', '进项收票认证'),
          treePage('invoices-match', '发票勾稽'),
          treePage('invoices-red', '红冲处理'),
        ],
      },
      {
        id: 'settlements-module',
        label: '资金核销',
        level: 2,
        children: [
          treePage('settlements-list', '流水列表'),
          treePage('settlements-create', '新增流水'),
          treePage('settlements-detail', '流水详情'),
          treePage('settlements-receive', '收款登记'),
          treePage('settlements-pay', '付款登记'),
          treePage('settlements-refund', '退款付款'),
          treePage('settlements-settle', '核销处理'),
          treePage('settlements-bank', '银行对账'),
        ],
      },
      {
        id: 'settings-module',
        label: '财务设置',
        level: 2,
        children: [
          treePage('settings-overview', '财务设置'),
          treePage('settings-receivable', '应收策略'),
          treePage('settings-payable', '应付策略'),
          treePage('settings-invoice', '发票策略'),
          treePage('settings-fund', '资金策略'),
        ],
      },
    ],
  },
];
