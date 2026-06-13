import { prdSections, type PrdDocument, type PrdField, type PrdFlow, type PrdSectionId, type PrdState, type PrdTreeNode } from './financePrd';

type PageKind = '工作台' | '列表页' | '详情页' | '新增/编辑页' | '动作页' | '设置页' | '报表页';

interface PageConfig {
  key: string;
  title: string;
  objectName: string;
  route: string;
  kind: PageKind;
  sources: string[];
  fields?: PrdField[];
  states?: PrdState[];
  fieldsMode?: 'append' | 'replace';
  acceptance?: string[];
  objective?: string;
  scope?: string[];
}

interface CenterConfig {
  key: string;
  name: string;
  role: string;
  route: string;
  states: PrdState[];
  pages: PageConfig[];
}

const field = (name: string, source: string, description: string, rules: string): PrdField => ({ name, source, description, rules });

const workbenchTodoLabels: Record<string, string[]> = {
  sales: ['待审核客户', '临近额度客户', '待执行计划', '待跟进报价', '报价待转化', '待审批合同', '合同待下单', '待确认订单', '待出库订单', '待开票申请', '待回款核销', '逾期未回款', '退换货待处理'],
  purchase: ['待审核供应商', '临时供应商转正', '待提交请购', '待审批请购', '待转询价明细', '询价中', '待定价报价', '待下达采购', '到货待入库', '三单差异待审', '暂估应付待确认', '待付款申请', '到票待认证'],
  warehouse: ['库存预警', '待入库', '待出库', '待分拣', '分拣中', '待发货', '待收货', '来料待归属', '低库存待采购', '临期待处理'],
  production: ['待确认需求', '缺料待处理', '待齐套计划', '待释放订单', '待领料工序', '待派工工单', '待报工记录', '待质检放行', '异常工序', '完工待入库', '委外待收货', '排班冲突'],
  'after-sales': ['待审核售后单', '待指派售后单', '待处理任务', '待退货入库', '待换货出库', '待配件出库', '待退款付款', '待应收调整', '待发票红冲', '待服务派工', '待结单确认', '待质量闭环', '超时未处理'],
  qc: ['待报检任务', '抽样/检验中', '待判定结果', '不合格/NCR', '隔离/拒收', '待复检任务', '让步审批', 'CAPA/8D', '已放行', '待生成报告', '待审批方案'],
  hr: ['待入职办理', '待转正评估', '离职交接中', '考勤异常待处理', '待发布排班', '薪酬待核算', '档案到期提醒', '办公申请待办'],
  equipment: ['设备总数', '运行中', '故障停机', '今日待点检', '本周待保养', '待维修派工', '维修验收', '低库存备件'],
  energy: ['待采集数据', '异常告警', '待分析能耗', '设备能耗异常', '成本异常', '待生成日报', '节能措施待执行', '碳排核算待确认'],
};

const workbenchTodoSources: Record<string, string> = {
  sales: '销售工作台 kpis',
  purchase: '采购工作台 kpis',
  warehouse: '仓库工作台入口与 storehouse 页面聚合',
  production: '生产工作台 kpis',
  'after-sales': '售后工作台 kpis',
  qc: '质检工作台 kpis',
  hr: '人力工作台 kpis',
  equipment: '设备工作台 cards',
  energy: '能耗工作台待办口径',
};

const baseStates = (names: string[]): PrdState[] => names.map((name, index) => ({
  name,
  meaning: [
    '页面对象已创建或已进入待处理队列，等待补充信息或开始处理。',
    '对象已经提交、确认或下达，等待负责人审核或执行。',
    '对象正在执行，存在数量、金额、任务、质量、交付或进度变化。',
    '对象存在异常、退回、驳回、差异、超期或待补充情况。',
    '对象已完成业务目标，可以关闭或归档。',
    '对象已关闭、取消、停用或归档，只保留只读追溯。',
  ][Math.min(index, 5)],
  trigger: [
    '新增保存、来源单据生成、工作台待办聚合或页面创建。',
    '提交审批、业务确认、任务分派、计划下达或来源单据审核通过。',
    '开始执行、生成下游记录、录入明细、回写进度或处理结果。',
    '审批退回、校验失败、质量异常、库存不足、金额差异或超期。',
    '数量、金额、质量、交付、审批和回写满足完成条件。',
    '关闭、取消、停用、作废或归档动作完成。',
  ][Math.min(index, 5)],
  next: [
    names[1] || '终态',
    `${names[2] || names[4] || '终态'} / ${names[3] || '异常'}`,
    `${names[4] || '完成'} / ${names[3] || '异常'}`,
    `${names[1] || '待处理'} / ${names[2] || '执行中'} / ${names[5] || '关闭'}`,
    names[5] || '终态',
    '终态',
  ][Math.min(index, 5)],
}));

const statusStates = (statusField: string, names: string[], source: string): PrdState[] => names.map((name) => ({
  name,
  meaning: `${statusField}在当前页面展示的状态：${name}。`,
  trigger: `状态口径来自${source}。`,
  next: '后续处理以当前页面详情、动作入口或业务回写结果展示为准。',
}));

const prefixedStatusStates = (statusField: string, names: string[], source: string): PrdState[] => names.map((name) => ({
  name: `${statusField}：${name}`,
  meaning: `${statusField}在当前页面展示的状态：${name}。`,
  trigger: `状态口径来自${source}。`,
  next: '后续处理以当前页面详情、动作入口或业务回写结果展示为准。',
}));

const states = {
  sales: baseStates(['草稿', '待审核', '履约中', '异常', '已完成', '已关闭/已取消']),
  purchase: baseStates(['草稿', '待审核', '执行中', '异常', '已完成', '已关闭/已取消']),
  warehouse: baseStates(['待处理', '待执行', '执行中', '异常', '已完成', '已关闭/已取消']),
  production: baseStates(['草稿', '待审核', '生产中/委外中', '异常/暂停', '已完工', '已关闭/已取消']),
  service: baseStates(['待受理', '处理中', '待客户/财务确认', '异常', '已完成', '已关闭/已取消']),
  qc: baseStates(['待检', '检验中', '处置中', '不合格/异常', '合格/放行', '已关闭/已取消']),
  hr: baseStates(['草稿', '待审批', '执行中', '异常/暂停', '已完成/已生效', '已关闭/已停用']),
  equipment: baseStates(['待执行', '执行中', '待验收', '异常/返工', '已完成', '已关闭/已取消']),
  energy: baseStates(['待采集', '采集中', '待分析/执行', '异常', '已生成/已完成', '已关闭']),
  settings: baseStates(['草稿', '待审批', '已发布', '已驳回', '已停用', '已归档']),
};

const salesCustomerListFields: PrdField[] = [
  field('序号', '列表行号', '客户列表当前页行号。', '仅用于列表展示，不作为客户业务字段。'),
  field('客户名称', 'Customer.name', '客户档案显示名称，列表主链接。', '点击进入客户详情。'),
  field('客户分组', 'Customer.groupName', '客户所属分组。', '只展示客户设置中启用的分组，例如重点客户、战略客户、普通客户、渠道客户。'),
  field('主联系人', 'Customer.contactName', '客户默认联系人。', '来自客户档案联系人信息。'),
  field('职位', 'Customer.contactPosition', '主联系人职位。', '可为空，空值展示为占位。'),
  field('联系方式', 'Customer.contactPhone', '主联系人手机号或电话。', '列表按数字字段展示，支持全局搜索。'),
  field('信用额度', 'Customer.creditLimit', '客户授信总额度。', '金额字段按数字口径展示。'),
  field('已用额度', 'Customer.creditUsed', '已被订单、应收或授信占用使用的额度。', '由业务与财务回写，不在列表直接编辑。'),
  field('占用额度', 'Customer.creditHold', '已占用但尚未释放的额度。', '由订单信用占用或核销结果回写。'),
  field('应收未收', 'Customer.receivableAmount', '客户当前未收应收金额。', '由财务应收与回款核销回写。'),
  field('可用额度', 'Customer.creditAvailable', '信用额度扣除已用和占用后的可用额度。', '由额度字段计算，不允许在列表直接改。'),
  field('账期', 'Customer.paymentTerm', '客户结算账期。', '来自客户档案或客户策略设置。'),
  field('信用状态', 'Customer.creditStatusName', '客户授信健康状态。', '当前页面实际展示正常、临近额度、待授信、停用、待复核，不能当作客户生命周期状态。'),
  field('客户状态', 'Customer.statusName', '客户档案生命周期状态。', '当前页面展示草稿、跟进中、待审核、已审核、已停用、已驳回；列表当前按客户分组和关键字过滤。'),
  field('客户经理', 'Customer.managerName', '客户负责销售人员。', '支持全局搜索。'),
  field('操作', '列表操作列', '当前行可执行动作。', '客户列表仅提供查看入口，具体提交、审核、停用、启用等动作在详情页按状态控制。'),
];

const salesCustomerCreateFields: PrdField[] = [
  field('客户名称', 'CustomerCreate.form.name', '基础信息必填输入框，录入客户全称。', '页面标记为必填；保存客户时不得为空，保存草稿也必须保留用户输入原值。'),
  field('客户分类', 'CustomerCreate.form.groupName', '基础信息必填下拉框，区分客户所属分类。', '选项来自当前页面：重点客户、战略客户、普通客户、渠道客户；默认占位为请选择。'),
  field('客户经理', 'CustomerCreate.pickedManagers', '基础信息必填人员选择字段，通过“绑定销售人员”打开选择客户经理弹窗。', '只能从人员选择弹窗中选择；当前页面确认时只保留 1 名客户经理。'),
  field('拼音码', 'CustomerCreate.form.pinyinCode', '基础信息输入框，根据客户名称自动生成后允许手动修改。', '可为空；用户手动修改后按输入值保存。'),
  field('信用代码', 'CustomerCreate.form.creditCode', '基础信息输入框，填写统一社会信用代码。', '可为空；填写时应按统一社会信用代码格式校验。'),
  field('客户编号', 'Customer.code', '基础信息只读输入框，页面显示“系统自动生成”。', '前端不可编辑，保存后由新增客户接口或后端编号规则生成。'),
  field('客户等级', 'CustomerCreate.form.level', '基础信息下拉框，维护客户等级。', '选项来自当前页面：A级、B级、C级；默认占位为请选择。'),
  field('所属行业', 'CustomerCreate.form.industry', '基础信息下拉框，维护客户行业。', '选项来自当前页面：智能制造、电子科技、装备制造、包装材料；默认占位为请选择。'),
  field('运费支付', 'CustomerCreate.form.freightPay', '基础信息下拉框，维护默认运费支付方式。', '选项来自当前页面：客户支付、我方承担、到付；默认值为客户支付。'),
  field('联系人信息', 'CustomerCreate.contactRows', '客户信息 Tab 的可编辑子表。', '字段为联系人、职位、联系方式、邮箱、默认、操作；至少保留 1 行，支持新增联系人、删除和设置默认联系人。'),
  field('财务信息', 'CustomerCreate.financeRows', '客户信息 Tab 的可编辑财务账户子表。', '字段为账户名称、开户银行、银行账号、收款说明、默认、操作；至少保留 1 行，支持新增财务信息和删除。'),
  field('地址信息', 'CustomerCreate.addressRows', '客户信息 Tab 的可编辑地址子表。', '字段为地址类型、联系人、联系电话、详细地址、默认、操作；地址类型选项为收货地址、开票地址、办公地址。'),
  field('附件信息', 'CustomerCreate.attachRows', '客户信息 Tab 的附件子表。', '字段为附件名称、附件类型、上传日期、备注、操作；附件类型选项为资质文件、营业执照、合同附件。'),
  field('账期设置', 'CustomerCreate.paymentTypes/paymentType', '账期设置卡片，选择并维护客户结算方式。', '卡片为现结、月结、周期、额度；额度卡片展示“超出额度需提前收款或审批”提示。'),
  field('客户详情', 'CustomerCreate.customerDetail', '客户详情富文本编辑区，记录客户背景、合作偏好、风险说明等信息。', '支持富文本工具栏录入；保存客户时写入 detail 字段。'),
  field('保存草稿', 'CustomerCreate.formActions.draft', '顶部动作按钮，保存当前客户草稿。', '提交新增接口时客户状态写为草稿，并在页面展示草稿保存提示。'),
  field('重置', 'CustomerCreate.formActions.reset', '顶部动作按钮，清空当前客户草稿。', '执行前必须二次确认；确认后恢复基础信息、子表、附件、账期和客户详情默认值。'),
  field('保存客户', 'CustomerCreate.formActions.save', '顶部主按钮，提交客户建档。', '提交新增接口时客户状态写为待审核，并在页面展示客户已提交提示。'),
  field('客户经理弹窗', 'AwPersonPickerModal', '选择客户经理弹窗，左侧展示销售中心、财务中心部门，右侧展示人员表格。', '表格字段为姓名、编号、角色、联系电话；确认后回填客户经理，取消不改变原选择。'),
];

const salesPlanCreateFields: PrdField[] = [
  field('计划名称', 'SalesPlanCreate.form.name', '基础信息必填输入框，录入销售计划名称。', '页面标记为必填；保存或提交时写入 name。'),
  field('计划编号', 'SalesPlan.code', '基础信息只读输入框，页面显示“自动生成”。', '前端不可编辑，提交新增接口时 code 传自动生成。'),
  field('计划开始日期', 'SalesPlanCreate.form.cycleStart', '基础信息必填日期字段，维护计划周期开始日期。', '页面使用 date 输入；列表计划周期由开始日期和结束日期拼接。'),
  field('计划结束日期', 'SalesPlanCreate.form.cycleEnd', '基础信息必填日期字段，维护计划周期结束日期。', '页面使用 date 输入；结束日期不得早于开始日期。'),
  field('统计口径', 'SalesPlanCreate.statMethod', '基础信息下拉框，决定计划完成统计口径。', '选项来自当前页面：按发货、按回款；默认按发货。'),
  field('指定方式', 'SalesPlanCreate.assignMode', '基础信息必填下拉框，决定计划分配方式。', '当前页面仅提供销售部门。'),
  field('销售部门', 'SalesPlanCreate.form.department', '基础信息下拉框，选择计划负责部门。', '选项来自当前页面：销售一部、销售二部、渠道组、华南大区；默认销售一部。'),
  field('客户范围', 'SalesPlanCreate.form.customerRange', '基础信息下拉框，限定计划适用客户范围。', '选项来自当前页面：全部客户、重点客户、战略客户、渠道客户；默认全部客户。'),
  field('计划产品', 'SalesPlanCreate.products', '计划产品可编辑子表，维护计划明细。', '字段为产品编号、产品名称、规格型号、单位、目标数量、计划单价、目标金额、计划交付月、操作。'),
  field('目标数量', 'SalesPlanCreate.totalQuantity', '计划产品汇总字段，统计所有明细目标数量。', '由目标数量列汇总，不允许手工改汇总值。'),
  field('目标金额', 'SalesPlanCreate.totalAmount', '计划产品汇总字段，统计所有明细目标金额。', '目标金额由目标数量乘计划单价计算后汇总。'),
  field('计划详情', 'SalesPlanCreate.detail', '富文本编辑区，填写计划背景、目标拆解、执行策略、风险说明。', '提交时写入 detail 字段。'),
  field('选择产品弹窗', 'SalesPlanCreate.showProductPicker', '新增明细时打开的产品选择弹窗。', '左侧产品分类为全部产品、成品、半成品、原材料；表格字段为选择、产品编号、产品名称、规格型号、产品分类、单位、计划单价。'),
  field('保存草稿', 'SalesPlanCreate.formActions.draft', '顶部动作按钮，保存当前销售计划草稿。', '提交新增接口时状态写为草稿。'),
  field('重置', 'SalesPlanCreate.formActions.reset', '顶部动作按钮，清空当前销售计划草稿。', '执行前二次确认；确认后清空基础信息、产品明细和计划详情。'),
  field('提交审批', 'SalesPlanCreate.formActions.submit', '顶部主按钮，提交销售计划审批。', '提交新增接口时状态写为待审批。'),
];

const salesPlanListFields: PrdField[] = [
  field('全局搜索', 'salesPlanListConfig.toolbar.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如计划名称、产品、负责人）”。', '搜索命中计划名称、编号、产品汇总、计划周期、负责对象和计划状态。'),
  field('计划名称', 'SalesPlan.name', '列表主链接字段。', '点击进入计划详情。'),
  field('计划编号', 'SalesPlan.code', '销售计划编号。', '列表展示并支持搜索。'),
  field('计划产品', 'SalesPlan.productSummary', '计划产品摘要。', '来自计划产品明细名称汇总。'),
  field('计划周期', 'SalesPlan.cycleStart/cycleEnd', '计划开始日期和结束日期组合展示。', '展示格式为开始日期 ~ 结束日期。'),
  field('负责对象', 'SalesPlan.ownerName', '计划负责部门或对象。', '由新增页指定方式和销售部门生成。'),
  field('目标数量', 'SalesPlan.targetQuantity', '计划目标数量汇总。', '数字列，来自计划产品明细汇总。'),
  field('目标金额', 'SalesPlan.targetAmount', '计划目标金额汇总。', '数字列，来自目标数量和计划单价计算。'),
  field('完成金额', 'SalesPlan.doneAmount', '计划当前完成金额。', '由后续执行或回写数据更新。'),
  field('达成率', 'SalesPlan.achievementText', '计划完成比例展示字段。', '由 achievementRate 转成百分比并用状态色展示。'),
  field('计划状态', 'SalesPlan.statusName', '计划列表真实状态字段。', '筛选项来自配置：草稿、待审批、未开始、执行中、已完成、已暂停、已关闭。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('批量操作', 'salesPlanListConfig.table.bulkActions', '列表批量动作。', '当前页面提供批量指定、批量提交。'),
  field('筛选弹窗', 'SalesPlanList.filterModalOpen', '销售计划筛选弹窗。', '当前只筛选计划状态。'),
  field('字段配置', 'SalesPlanList.columnsModalOpen', '销售计划字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const salesQuoteCreateFields: PrdField[] = [
  field('报价主题', 'SalesQuoteCreate.form.topic', '基础信息必填输入框，填写报价主题。', '保存或提交时写入 topic。'),
  field('报价编号', 'SalesQuote.code', '基础信息只读输入框，页面显示“自动”。', '前端不可编辑，提交新增接口时 code 传自动生成。'),
  field('报价分类', 'SalesQuoteCreate.quoteCategory', '基础信息必填下拉框，决定报价适用逻辑。', '选项来自当前页面：通用、分组报价、促销报价、指定客户报价、一次性报价。'),
  field('开始日期', 'SalesQuoteCreate.form.quoteDate', '基础信息必填日期字段，维护报价开始日期。', '页面使用 date 输入。'),
  field('失效日期', 'SalesQuoteCreate.form.expireDate', '基础信息必填日期字段，维护报价失效日期。', '失效后不得继续转合同或订单。'),
  field('适用范围', 'SalesQuoteCreate.scopeText', '基础信息必填只读字段，由报价分类选择结果带出。', '通用报价自动为全量客户通用报价；分组报价打开客户分组弹窗；指定客户报价和一次性报价打开客户选择弹窗。'),
  field('产品明细', 'SalesQuoteCreate.products', '产品明细可编辑子表。', '字段为产品编号、产品名称、规格型号、单位、单价、操作；操作包含阶梯报价和删除。'),
  field('产品明细数量', 'SalesQuoteCreate.products.length', '产品明细汇总项数。', '由当前产品明细行数自动计算。'),
  field('阶梯报价数量', 'SalesQuoteCreate.tierEnabledCount', '已启用阶梯报价的产品数量。', '产品设置阶梯报价后计入。'),
  field('报价金额合计', 'SalesQuoteCreate.quoteAmountTotal', '产品明细报价金额汇总。', '由产品单价汇总展示。'),
  field('报价详情', 'SalesQuoteCreate.detail', '富文本编辑区，填写报价说明、适用条件、客户沟通记录。', '提交时写入 detail 字段。'),
  field('附件', 'SalesQuoteCreate.attachmentRows', '报价附件子表。', '字段为附件名称、附件类型、上传日期、备注、操作；附件类型为报价附件、价格说明、客户资料、审批材料。'),
  field('选择产品弹窗', 'SalesQuoteCreate.showProductPicker', '新增明细时打开的产品选择弹窗。', '左侧分类为全部产品、成品、半成品、原材料；表格字段为选择、产品编号、产品名称、规格型号、产品分类、单位、单价。'),
  field('阶梯报价弹窗', 'SalesQuoteCreate.tierProduct/tiers', '设置产品阶梯报价的弹窗。', '字段为起订数量、优惠百分比、规则说明、操作；支持新增阶梯、删除和确定启用。'),
  field('客户分组弹窗', 'SalesQuoteCreate.showGroupPicker', '分组报价时选择客户分组。', '表格字段为选择、客户分组、客户数量、负责人、说明。'),
  field('适用对象弹窗', 'SalesQuoteCreate.showTargetPicker', '指定客户报价或一次性报价时选择客户。', '表格字段为选择、客户编号、客户名称、客户分类、负责人；已停用客户不可选。'),
  field('保存草稿', 'SalesQuoteCreate.formActions.draft', '顶部动作按钮，保存当前报价草稿。', '提交新增接口时状态写为草稿。'),
  field('重置', 'SalesQuoteCreate.formActions.reset', '顶部动作按钮，清空当前报价草稿。', '执行前二次确认；确认后清空基础信息、产品明细、附件和报价详情。'),
  field('保存报价', 'SalesQuoteCreate.formActions.save', '顶部主按钮，保存报价。', '提交新增接口时状态写为审核中。'),
];

const salesQuoteListFields: PrdField[] = [
  field('报价分类树', 'salesQuoteListConfig.tree', '左侧报价分类资源树。', '根节点为报价分类，子节点为通用报价、分组报价、促销报价、一次性报价。'),
  field('全局搜索', 'salesQuoteListConfig.toolbar.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如报价主题、编号、客户）”。', '搜索命中报价主题、编号、报价类型、适用客户、价格版本、转化状态、日期、人员和状态。'),
  field('报价主题', 'SalesQuote.topic', '列表主链接字段。', '点击进入报价详情。'),
  field('报价编号', 'SalesQuote.code', '报价编号。', '列表展示并支持搜索。'),
  field('报价类型', 'SalesQuote.quoteTypeName', '报价类型展示字段。', '来自新增页报价分类。'),
  field('适用客户', 'SalesQuote.customerName', '报价适用客户或范围。', '来自适用范围选择结果。'),
  field('报价金额', 'SalesQuote.amount', '报价金额汇总。', '数字列。'),
  field('价格版本', 'SalesQuote.priceVersion', '报价价格版本。', '列表展示版本号。'),
  field('转化状态', 'SalesQuote.conversionStatusName', '报价转合同或订单的转化结果。', '这是转化结果字段，不作为报价状态机。'),
  field('报价日期', 'SalesQuote.quoteDate', '报价开始日期。', '来自新增页开始日期。'),
  field('失效日期', 'SalesQuote.expireDate', '报价失效日期。', '失效后不得继续转合同或订单。'),
  field('报价人员', 'SalesQuote.ownerName', '报价负责人。', '列表展示并支持搜索。'),
  field('报价状态', 'SalesQuote.statusName', '报价列表真实状态字段。', '筛选项来自配置：审核中、已批准、已失效、草稿。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('筛选弹窗', 'SalesQuoteList.filterModalOpen', '报价管理筛选弹窗。', '可筛选报价分类和报价状态。'),
  field('字段配置', 'SalesQuoteList.columnsModalOpen', '报价字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const salesContractCreateFields: PrdField[] = [
  field('合同主题', 'SalesContractCreate.form.topic', '基础信息必填输入框，填写合同主题。', '保存或提交时写入 topic。'),
  field('合同编号', 'SalesContract.code', '基础信息只读输入框，页面显示“自动生成”。', '前端不可编辑，提交新增接口时 code 传自动生成。'),
  field('关联客户', 'SalesContractCreate.customer', '基础信息必填选择字段，通过选择客户弹窗回填。', '已停用客户不可选；确认后回填客户名称、联系人和联系电话。'),
  field('适用报价', 'SalesContractCreate.source', '基础信息下拉框，选择合同适用报价。', '未选择客户时禁用；报价来源合同时必须选择适用报价。'),
  field('客户联系人', 'SalesContractCreate.customer.contact', '选择客户后自动带出的联系人。', '只读展示。'),
  field('联系电话', 'SalesContractCreate.customer.phone', '选择客户后自动带出的联系电话。', '只读展示。'),
  field('签订日期', 'SalesContractCreate.form.signedDate', '基础信息必填日期字段。', '页面使用 date 输入。'),
  field('生效日期', 'SalesContractCreate.form.effectiveDate', '基础信息必填日期字段。', '页面使用 date 输入。'),
  field('失效日期', 'SalesContractCreate.form.expireDate', '基础信息必填日期字段。', '页面使用 date 输入。'),
  field('合同产品', 'SalesContractCreate.productRows', '合同产品可编辑子表。', '字段为来源明细、产品编号、产品名称、规格型号、单位、合同数量、单价、交付约定、支付约定、操作。'),
  field('合同总金额', 'SalesContractCreate.contractTotal', '合同产品金额汇总。', '由合同数量乘单价汇总。'),
  field('优惠金额', 'SalesContractCreate.discountAmount', '合同总金额的优惠金额输入框。', '优惠后金额不得小于 0。'),
  field('优惠后金额', 'SalesContractCreate.finalTotal', '扣除优惠后的合同金额。', '由合同总金额减优惠金额计算。'),
  field('合同详情', 'SalesContractCreate.detailText', '富文本编辑区，填写合同条款、交付约束、价格有效规则、违约责任和特殊约定。', '提交时写入 detailHtml。'),
  field('选择客户弹窗', 'SalesContractCreate.customerPickerOpen', '选择关联客户的弹窗。', '左侧按客户分组筛选；表格字段为选择、客户编号、客户名称、客户分组、联系人、联系电话、客户经理。'),
  field('选择产品弹窗', 'SalesContractCreate.productPickerOpen', '新增合同产品时打开的产品选择弹窗。', '左侧产品分类；表格字段为产品编号、产品名称、规格型号、产品分类、单位、单价、操作。'),
  field('保存草稿', 'SalesContractCreate.formActions.draft', '顶部动作按钮，保存当前合同草稿。', '提交新增接口时状态和履约状态写为草稿。'),
  field('重置', 'SalesContractCreate.formActions.reset', '顶部动作按钮，清空当前合同草稿。', '执行前二次确认；确认后清空客户、报价、产品、优惠金额和合同详情。'),
  field('提交审批', 'SalesContractCreate.formActions.submit', '顶部主按钮，提交合同审批。', '提交新增接口时状态和履约状态写为待审批。'),
];

const salesContractListFields: PrdField[] = [
  field('全局搜索', 'salesContractListConfig.toolbar.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如合同主题、合同编号、客户）”。', '搜索命中合同主题、编号、客户、来源、日期、状态和销售人员。'),
  field('合同主题', 'SalesContract.topic', '列表主链接字段。', '点击进入合同详情。'),
  field('合同编号', 'SalesContract.code', '合同编号。', '列表展示并支持搜索。'),
  field('客户', 'SalesContract.customerName', '合同关联客户。', '来自新增页关联客户。'),
  field('来源单据', 'SalesContract.sourceCode', '合同来源报价或手动来源。', '来自适用报价或手动合同。'),
  field('合同金额', 'SalesContract.amount', '合同总金额。', '数字列。'),
  field('已下单金额', 'SalesContract.orderedAmount', '合同已转订单金额。', '由订单回写。'),
  field('已发货金额', 'SalesContract.shippedAmount', '合同已发货金额。', '由仓储发货回写。'),
  field('应收金额', 'SalesContract.receivableAmount', '合同产生的应收金额。', '由财务应收回写。'),
  field('已开票金额', 'SalesContract.invoiceAmount', '合同已开票金额。', '由财务发票回写。'),
  field('已回款金额', 'SalesContract.receivedAmount', '合同已回款金额。', '由财务收款核销回写。'),
  field('剩余金额', 'SalesContract.balanceAmount', '合同未履约或未回款余额。', '由合同金额、订单、发货、应收、开票和回款数据计算。'),
  field('签订日期', 'SalesContract.signedDate', '合同签订日期。', '来自新增页签订日期。'),
  field('失效日期', 'SalesContract.expireDate', '合同失效日期。', '来自新增页失效日期。'),
  field('销售人员', 'SalesContract.ownerName', '合同负责人。', '列表展示并支持搜索。'),
  field('履约状态', 'SalesContract.executionStatusName', '合同列表真实状态字段。', '筛选项来自配置：待审批、履约中、履约完成、已终止。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('筛选弹窗', 'SalesContractList.filterModalOpen', '合同管理筛选弹窗。', '当前只筛选履约状态。'),
  field('字段配置', 'SalesContractList.columnsModalOpen', '合同字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const salesOrderCreateFields: PrdField[] = [
  field('订单主题', 'SalesOrderCreate.form.topic', '基础信息必填输入框，支持手动输入订单主题。', '用户手动输入时会清空已选订单来源。'),
  field('选择订单来源', 'SalesOrderCreate.openSourcePicker', '订单主题右侧按钮，打开订单来源弹窗。', '来源类型包含报价单、合同、客户；确认后回填来源、客户、联系人、地址、产品明细等信息。'),
  field('订单编号', 'SalesOrder.code', '基础信息只读输入框，页面显示“自动生成”。', '前端不可编辑，提交新增接口时 code 由后端生成。'),
  field('订单来源', 'SalesOrderCreate.source', '基础信息只读字段，展示来源类型和来源编号。', '未选择来源时显示手动输入。'),
  field('关联客户', 'SalesOrderCreate.customer', '基础信息必填只读字段，选择来源后自动带入。', '客户停用时不可选择。'),
  field('客户联系人', 'SalesOrderCreate.form.contactName', '选择客户后自动带出的联系人。', '只读展示。'),
  field('联系电话', 'SalesOrderCreate.form.contactPhone', '选择联系人后带出的联系电话。', '只读展示。'),
  field('交货地址', 'SalesOrderCreate.form.deliveryAddress', '基础信息输入框，选择客户后自动带入并允许修改。', '保存时写入订单交货地址。'),
  field('交货日期', 'SalesOrderCreate.form.deliveryDate', '基础信息必填日期字段。', '页面使用 date 输入。'),
  field('支付方式', 'SalesOrderCreate.form.payMethod', '基础信息输入框，从客户档案自动带入。', '可按订单调整。'),
  field('信用额度', 'SalesOrderCreate.creditText', '基础信息只读字段，选择客户后展示信用额度、已用和信用状态摘要。', '用于信用校验提示，不作为订单状态。'),
  field('运费支付', 'SalesOrderCreate.form.freightPay', '基础信息下拉框。', '选项为自动带入、客户支付、我方承担、到付。'),
  field('产品明细', 'SalesOrderCreate.lineRows', '产品明细可编辑子表。', '字段为来源明细、价格来源、产品编号、产品名称、规格型号、单位、单价、销售数量、合计金额、交付日期、优惠金额、操作。'),
  field('合计', 'SalesOrderCreate.totalQuantity/totalAmount/totalAfterDiscount', '产品明细汇总区域。', '展示总量、总金额、优惠后金额，均由产品明细计算。'),
  field('订单详情', 'SalesOrderCreate.detailText', '富文本编辑区，填写订单说明、客户要求、交付注意事项。', '提交时写入订单详情。'),
  field('附件', 'SalesOrderCreate.attachmentRows', '订单附件子表。', '字段为附件名称、附件类型、上传日期、备注、操作；附件类型为订单附件、客户要求、交付资料、审批材料。'),
  field('订单来源弹窗', 'SalesOrderCreate.showSourcePicker', '选择订单来源的弹窗。', '客户来源表字段为客户编号、客户名称、客户分类、联系人、联系电话、客户经理；报价/合同来源表字段为来源编号、来源主题、客户、交货日期、产品数。'),
  field('选择客户弹窗', 'SalesOrderCreate.showCustomerPicker', '选择客户的弹窗。', '表格字段为客户名称、客户分组、默认联系人、联系方式、客户经理、信用额度、已用额度、账期、信用状态；停用客户不可选。'),
  field('选择客户联系人弹窗', 'SalesOrderCreate.showContactPicker', '选择客户联系人弹窗。', '表格字段为姓名、职务、电话、邮箱。'),
  field('选择产品弹窗', 'SalesOrderCreate.showProductPicker', '新增产品明细时打开的产品选择弹窗。', '左侧产品分类；表格字段为选择、产品编号、产品名称、产品分类、规格型号、单位、参考单价。'),
  field('保存草稿', 'SalesOrderCreate.formActions.draft', '顶部动作按钮，保存当前订单草稿。', '提交新增接口时状态写为草稿。'),
  field('重置', 'SalesOrderCreate.formActions.reset', '顶部动作按钮，清空当前订单草稿。', '执行前二次确认；确认后清空来源、客户、联系人、产品明细、附件和订单详情。'),
  field('确认', 'SalesOrderCreate.formActions.confirm', '顶部主按钮，确认订单。', '提交新增接口时状态进入订单确认后的业务状态，并触发后续信用、出库和应收联动。'),
];

const salesOrderListFields: PrdField[] = [
  field('全局搜索', 'salesOrderListConfig.toolbar.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如订单主题、订单号、客户）”。', '搜索命中订单主题、订单号、来源、合同来源、客户、信用、开票、进展、状态、人员和异常标签。'),
  field('订单主题', 'SalesOrder.topic', '列表主链接字段。', '点击进入订单详情。'),
  field('订单号', 'SalesOrder.code', '订单编号。', '列表展示并支持搜索。'),
  field('订单来源', 'SalesOrder.sourceCode', '订单来源编号。', '来自报价、合同、客户或手动输入。'),
  field('合同来源', 'SalesOrder.contractSource', '订单关联合同来源。', '无合同时按页面数据展示为空或手动。'),
  field('客户', 'SalesOrder.customerName', '订单关联客户。', '来自订单来源或客户选择。'),
  field('订单金额', 'SalesOrder.amount', '订单金额汇总。', '数字列。'),
  field('信用校验', 'SalesOrder.creditCheckName', '订单信用校验结果。', '风控结果字段，不作为订单生命周期状态。'),
  field('信用占用', 'SalesOrder.creditHoldName', '订单是否占用客户信用额度。', '由订单确认和信用策略写入。'),
  field('应收金额', 'SalesOrder.receivableAmount', '订单形成的应收金额。', '由财务应收回写。'),
  field('开票申请', 'SalesOrder.invoiceRequestName', '订单开票申请进度。', '由开票动作或财务回写。'),
  field('已回款', 'SalesOrder.receivedAmount', '订单已回款金额。', '由财务核销回写。'),
  field('订单状态', 'SalesOrder.statusName', '订单列表真实状态字段。', '筛选项来自配置：草稿、审核中、已批准、已确认、生产中、已取消。'),
  field('异常标签', 'SalesOrder.exceptionTag', '订单异常提示字段。', '有值时以黄色状态标签展示。'),
  field('下单日期', 'SalesOrder.orderDate', '订单创建或下单日期。', '列表日期列。'),
  field('交货日期', 'SalesOrder.deliveryDate', '订单计划交货日期。', '来自新增页交货日期。'),
  field('销售人员', 'SalesOrder.ownerName', '订单负责人。', '列表展示并支持搜索。'),
  field('订单进展', 'SalesOrder.progressName', '订单履行进展字段。', '筛选项来自配置：未发货、部分发货、发货中、已发货、已完成、生产中；不替代订单状态。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('筛选弹窗', 'SalesOrderList.filterModalOpen', '订单管理筛选弹窗。', '可筛选订单状态和订单进展。'),
  field('字段配置', 'SalesOrderList.columnsModalOpen', '订单字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const salesCustomerDetailFields = detailPageFields(
  '客户详情',
  'src/views/sales/customers/CustomerDetail.vue',
  ['客户信息', '产品记录', '购买记录', '发货记录', '开票记录', '回款核销', '售后记录', '操作记录'],
  ['客户分组', '主联系人', '联系方式', '客户经理', '地址', '客户状态', '信用额度', '已用额度', '占用额度', '应收未收', '可用额度'],
  ['打印/导出', '审核', '提交审核', '编辑', '删除', '重新提交', '启用', '停用'],
);

const salesPlanDetailFields = detailPageFields(
  '销售计划详情',
  'src/views/sales/sales-plans/SalesPlanDetail.vue',
  ['计划信息', '业绩追踪', '销售明细', '操作记录'],
  ['计划名称', '计划编号', '计划状态', '计划产品', '计划周期', '负责对象', '目标数量', '目标金额', '统计口径'],
  ['提交审批', '审核', '开始执行', '暂停', '恢复', '关闭', '编辑', '导出'],
);

const salesQuoteDetailFields = detailPageFields(
  '销售报价详情',
  'src/views/sales/sales-quotes/SalesQuoteDetail.vue',
  ['基础信息', '产品明细', '转化与财务追踪', '附件/操作记录'],
  ['报价主题', '报价编号', '报价分类', '开始日期', '失效日期', '适用客户', '价格版本', '转化状态', '关联对象', '报价详情'],
  ['打印/导出', '审核', '提交审批', '编辑', '删除', '转订单', '作废'],
);

const salesContractDetailFields = detailPageFields(
  '销售合同详情',
  'src/views/sales/sales-contracts/SalesContractDetail.vue',
  ['合同信息', '合同产品', '订单核销', '发货记录', '开票记录', '回款记录', '操作记录'],
  ['合同主题', '合同编号', '客户', '来源单据', '合同金额', '已下单金额', '已发货金额', '应收金额', '已开票金额', '已回款金额', '剩余金额', '签订日期', '失效日期', '销售人员', '履约状态'],
  ['打印/导出', '审核', '开始履约', '编辑', '终止'],
);

const salesOrderDetailFields = detailPageFields(
  '销售订单详情',
  'src/views/sales/sales-orders/SalesOrderDetail.vue',
  ['订单信息', '订单明细', '发货应收', '开票申请', '回款核销', '生产记录', '退换货记录', '操作记录'],
  ['订单主题', '订单编号', '订单来源', '合同来源', '下单日期', '客户', '订单金额', '销售人员', '订单状态', '进展', '异常标签', '信用校验', '信用占用', '应收金额', '开票申请', '已回款', '交付日期', '交货地址'],
  ['打印/导出', '审核', '提交审批', '编辑', '取消', '确认订单', '发货'],
);

const purchaseSupplierCreateFields: PrdField[] = [
  field('供应商名称', 'SupplierCreate.form.name', '基础信息必填输入框，录入供应商全称。', '页面标记为必填；暂存或提交审批时写入 name。'),
  field('拼音号', 'SupplierCreate.form.pinyin', '基础信息输入框，根据供应商名称自动生成后允许手动修改。', '可为空；用户手动修改后按输入值保存。'),
  field('供应商编号', 'Supplier.code', '基础信息只读输入框，页面显示“系统自动生成”。', '前端不可编辑，提交新增接口时由后端编号规则生成。'),
  field('供应商分类', 'SupplierCreate.form.categoryPath', '基础信息必填选择字段，通过“选择供应商分类”弹窗回填。', '分类树来自当前页面：原材料供应商、零部件供应商、包装供应商、服务供应商、临时供应商及其子类。'),
  field('供应商类型', 'SupplierCreate.form.supplierType', '基础信息必填下拉框，维护供应商类型。', '选项来自当前页面：正式供应商、临时供应商。'),
  field('信用代码', 'SupplierCreate.form.creditCode', '基础信息必填输入框，填写 18 位统一社会信用代码。', '页面标记为必填；提交前应校验格式。'),
  field('采购人员', 'SupplierCreate.form.buyer', '基础信息人员选择字段，通过“选择采购人员”弹窗回填。', '只能从人员弹窗选择；当前页面确认时只保留 1 名采购人员。'),
  field('供应产品', 'SupplierCreate.productRows', '供应商详情 Tab 的供应产品子表。', '字段为物料编码、物料名称、规格型号、物料类别、品牌、标准单位、供货单位、操作；点击新增供应产品打开物料选择弹窗。'),
  field('联系人信息', 'SupplierCreate.contactRows', '供应商详情 Tab 的联系人子表。', '字段为联系人、联系方式、职位、邮箱、备注、操作；支持新增联系人和删除。'),
  field('财务信息', 'SupplierCreate.financeRows', '供应商详情 Tab 的财务账户子表。', '字段为银行卡号、账户名称、开户行、账户类型、备注、操作；支持新增银行卡号和删除。'),
  field('地址信息', 'SupplierCreate.addressRows', '供应商详情 Tab 的地址子表。', '字段为地址类型、收件人、联系电话、详细地址、操作；默认地址类型为收货地址。'),
  field('附件信息', 'SupplierCreate.attachRows', '供应商详情 Tab 的附件子表。', '字段为附件名称、附件类型、上传日期、备注、操作；附件类型为资质文件、营业执照、报价附件、审批材料。'),
  field('供应商详情说明', 'SupplierCreate.detail', '富文本编辑区，填写供应商介绍、资质能力、合作说明、风险备注等内容。', '暂存或提交审批时写入 detail。'),
  field('选择物料弹窗', 'ProductPickerModal', '新增供应产品时打开的物料选择弹窗。', '表格字段为物料编号、物料名称、规格型号、物料分类、单位；确认后追加到供应产品子表。'),
  field('选择采购人员弹窗', 'AwPersonPickerModal', '选择采购人员弹窗。', '弹窗标题为选择采购人员，确认后回填采购人员，取消不改变原选择。'),
  field('选择供应商分类弹窗', 'AwCategoryPickerModal', '选择供应商分类弹窗。', '确认后回填供应商分类、细分类和分类路径。'),
  field('暂存', 'SupplierCreate.formActions.draft', '顶部动作按钮，保存当前供应商草稿。', '提交新增接口后页面提示“供应商草稿已通过新增接口保存”。'),
  field('重置', 'SupplierCreate.formActions.reset', '顶部动作按钮，清空当前供应商草稿。', '执行前必须二次确认；确认后清空供应产品并恢复联系人、附件等默认行。'),
  field('提交审批', 'SupplierCreate.formActions.submit', '顶部主按钮，提交供应商审批。', '提交新增接口后页面提示“供应商已通过新增接口提交审批”。'),
];

const purchaseSupplierListFields: PrdField[] = [
  field('供应商库', 'supplierTreeNodes', '左侧供应商资源树。', '根节点为全部供应商，按原材料供应商、零部件供应商、包装供应商、服务供应商、临时供应商及子类展示。'),
  field('全局搜索', 'configs.suppliers.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如供应商、编号、联系人）”。', '搜索命中供应商编号、供应商名称、联系人等当前行数据。'),
  field('供应商编号', 'PurchaseRow.code', '列表编号字段。', '列表展示并支持搜索。'),
  field('供应商名称', 'PurchaseRow.name', '列表主链接字段。', '点击进入供应商详情。'),
  field('分类', 'PurchaseRow.type', '供应商一级分类。', '筛选项来自当前页面：原材料供应商、零部件供应商、包装供应商、服务供应商、临时供应商。'),
  field('细分类', 'PurchaseRow.category', '供应商细分类。', '与左侧供应商库子节点口径一致。'),
  field('联系人', 'PurchaseRow.contact', '供应商主联系人。', '列表展示并参与全局搜索。'),
  field('联系方式', 'PurchaseRow.phone', '供应商主联系人电话。', '列表展示并参与全局搜索。'),
  field('状态', 'PurchaseRow.state', '供应商列表真实状态字段。', '筛选项来自当前页面：临时、已审核、待审核、已停用。'),
  field('来源', 'PurchaseRow.source', '供应商来源说明。', '展示供应商创建或引入来源。'),
  field('创建日期', 'PurchaseRow.date', '供应商创建日期。', '列表日期字段。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('批量转移', 'configs.suppliers.bulkActions.transfer', '供应商列表批量动作。', '按勾选行执行批量转移入口。'),
  field('批量指定', 'configs.suppliers.bulkActions.assign', '供应商列表批量动作。', '按勾选行执行批量指定入口。'),
  field('筛选弹窗', 'PurchaseResourcePage.filterModalOpen', '供应商管理筛选弹窗。', '当前可筛选分类和状态。'),
  field('字段配置', 'PurchaseResourcePage.columnsModalOpen', '供应商管理字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const purchaseRequestCreateFields: PrdField[] = [
  field('请购主题', 'RequestCreate.form.topic', '基础信息必填输入框，填写请购主题。', '页面标记为必填；暂存或提交审批时写入 topic。'),
  field('请购编号', 'PurchaseRequest.code', '基础信息只读输入框，页面显示“自动生成”。', '前端不可编辑，提交新增接口时由后端编号规则生成。'),
  field('请购来源', 'RequestCreate.form.source', '基础信息必填下拉框，选择请购来源。', '选项来自当前页面：项目请购、生产缺料、库存补货、研发试制。'),
  field('关联单据', 'RequestCreate.form.ref', '基础信息输入框，填写或选择关联单据。', '可为空；填写后作为请购来源追溯字段。'),
  field('请购日期', 'RequestCreate.form.requestDate', '基础信息必填输入框，默认显示自动。', '页面标记为必填；允许按页面输入值提交。'),
  field('需求日期', 'RequestCreate.form.needDate', '基础信息日期输入框。', '可为空；用于后续交付和待办提醒。'),
  field('请购明细', 'RequestCreate.rows', '请购明细可编辑子表。', '字段为产品名称、产品编号、产品型号、产品分类、产品单位、请购数量、交货日期、建议供应商、用途说明、操作。'),
  field('请购总数量', 'RequestCreate.totalQty', '请购明细汇总字段。', '由请购数量列自动汇总，不允许手工改汇总值。'),
  field('请购详情', 'RequestCreate.detail', '富文本编辑区，填写请购原因、用途、交期要求等说明。', '暂存或提交审批时写入 detail。'),
  field('选择产品弹窗', 'ProductPickerModal', '新增明细时打开的产品选择弹窗。', '确认后追加到请购明细。'),
  field('选择供应商弹窗', 'SupplierPickerModal', '点击建议供应商列“选”按钮打开的供应商选择弹窗。', '确认后只回填当前明细行的建议供应商。'),
  field('暂存', 'RequestCreate.formActions.draft', '顶部动作按钮，保存当前请购草稿。', '提交新增接口后页面提示“请购草稿已通过新增接口保存”。'),
  field('重置', 'RequestCreate.formActions.reset', '顶部动作按钮，清空当前请购草稿。', '执行前必须二次确认；确认后清空请购明细。'),
  field('提交审批', 'RequestCreate.formActions.submit', '顶部主按钮，提交请购审批。', '提交新增接口后页面提示“请购已通过新增接口提交审批”。'),
];

const purchaseRequestListFields: PrdField[] = [
  field('全局搜索', 'configs.requests.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如请购主题、编号、关联单据）”。', '搜索命中请购主题、请购编号、关联单据等当前行数据。'),
  field('请购主题', 'PurchaseRow.topic', '列表主链接字段。', '点击进入请购详情。'),
  field('请购编号', 'PurchaseRow.code', '请购单编号。', '列表展示并支持搜索。'),
  field('关联单据', 'PurchaseRow.ref', '请购关联来源单据。', '用于追溯项目、生产、库存或研发来源。'),
  field('请购来源', 'PurchaseRow.source', '请购来源类型。', '来自新增页请购来源。'),
  field('发起人', 'PurchaseRow.starter', '请购发起人。', '列表展示并参与全局搜索。'),
  field('联系方式', 'PurchaseRow.phone', '发起人联系方式。', '列表展示并参与全局搜索。'),
  field('申请日期', 'PurchaseRow.date', '请购申请日期。', '列表日期字段。'),
  field('打印状态', 'PurchaseRow.printState', '请购单打印状态。', '只作为打印结果字段展示，不替代流程状态。'),
  field('流程状态', 'PurchaseRow.state', '请购列表真实流程状态字段。', '筛选项来自当前页面：待提交、审批中、已批准、待询价、已转询价、待采购、已转采购、部分采购、已完成、已关闭、已驳回。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('批量操作', 'configs.requests.bulkActions.batch', '请购列表批量动作。', '按勾选行执行批量操作入口。'),
  field('筛选弹窗', 'PurchaseResourcePage.filterModalOpen', '请购管理筛选弹窗。', '当前可筛选流程状态。'),
  field('字段配置', 'PurchaseResourcePage.columnsModalOpen', '请购管理字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const purchaseInquiryCreateFields: PrdField[] = [
  field('询价主题', 'InquiryCreate.form.topic', '基础信息必填输入框，支持手动输入询价主题。', '页面标记为必填；选择询价来源后会被来源标题回填。'),
  field('选择询价来源', 'InquiryCreate.showSource', '询价主题右侧按钮，打开选择询价来源弹窗。', '确认来源后回填询价主题并带入来源产品明细。'),
  field('询价编号', 'PurchaseInquiry.code', '基础信息只读输入框，页面显示“自动生成”。', '前端不可编辑，提交新增接口时由后端编号规则生成。'),
  field('截止日期', 'InquiryCreate.form.deadline', '基础信息日期输入框，维护报价截止日期。', '可为空；用于询价到期提醒。'),
  field('询价明细', 'InquiryCreate.rows', '询价明细表格。', '表头来自当前页面：序号、产品名称、产品编号、产品型号、产品分类、标准单位、数量、来源明细、供应商、供应商类型、单价、是否含税、折扣、金额、税额、交货期、最小采购量、采购生成、操作。'),
  field('供应商报价行', 'InquiryCreate.rows.suppliers', '每个产品下的供应商报价明细。', '支持正式供应商和临时供应商；可录入单价、是否含税、折扣、交货期、最小采购量并计算金额和税额。'),
  field('新增明细', 'InquiryCreate.addInquiryRows', '询价明细底部按钮。', '点击打开产品选择弹窗，确认后追加询价产品。'),
  field('询价详情', 'InquiryCreate.detail', '富文本编辑区，填写询价说明、报价要求、交期要求等内容。', '暂存或提交审批时写入 detail。'),
  field('选择产品弹窗', 'ProductPickerModal', '新增明细时打开的产品选择弹窗。', '确认后追加到询价明细，并生成默认供应商报价行。'),
  field('选择询价来源弹窗', 'SourcePickerModal', '选择询价来源的弹窗。', '弹窗标题为选择询价来源，确认后带入来源单据和产品。'),
  field('暂存', 'InquiryCreate.formActions.draft', '顶部动作按钮，保存当前询价草稿。', '提交新增接口后页面提示“询价草稿已通过新增接口保存”。'),
  field('重置', 'InquiryCreate.formActions.reset', '顶部动作按钮，清空当前询价草稿。', '执行前必须二次确认；确认后清空询价明细。'),
  field('提交审批', 'InquiryCreate.formActions.submit', '顶部主按钮，提交询价审批。', '提交新增接口后页面提示“询价已通过新增接口提交审批”。'),
];

const purchaseInquiryListFields: PrdField[] = [
  field('全局搜索', 'configs.inquiries.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如询价主题、编号、产品）”。', '搜索命中询价主题、询价编号、询价产品等当前行数据。'),
  field('询价主题', 'PurchaseRow.topic', '列表主链接字段。', '点击进入询价详情。'),
  field('询价编号', 'PurchaseRow.code', '询价单编号。', '列表展示并支持搜索。'),
  field('询价产品', 'PurchaseRow.product', '询价产品摘要。', '来自询价明细产品。'),
  field('询价数量', 'PurchaseRow.qty', '询价产品数量汇总。', '数字列。'),
  field('询价日期', 'PurchaseRow.date', '询价发起日期。', '列表日期字段。'),
  field('截止日期', 'PurchaseRow.deadline', '供应商报价截止日期。', '用于到期提醒。'),
  field('询价状态', 'PurchaseRow.state', '询价列表真实状态字段。', '筛选项来自当前页面：询价中、询价完毕、待定价、已定价、作废。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('批量操作', 'configs.inquiries.bulkActions.batch', '询价列表批量动作。', '按勾选行执行批量操作入口。'),
  field('筛选弹窗', 'PurchaseResourcePage.filterModalOpen', '询价管理筛选弹窗。', '当前可筛选询价状态。'),
  field('字段配置', 'PurchaseResourcePage.columnsModalOpen', '询价管理字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const purchaseOrderCreateFields: PrdField[] = [
  field('订单主题', 'OrderCreate.form.topic', '基础信息必填输入框，支持手动输入订单主题。', '页面标记为必填；选择订单来源后会被来源标题回填。'),
  field('选择订单来源', 'OrderCreate.showSource', '订单主题右侧按钮，打开选择订单来源弹窗。', '确认来源后回填订单主题、供应商、订单来源和采购明细。'),
  field('采购编号', 'PurchaseOrder.code', '基础信息只读输入框，页面显示“自动生成”。', '前端不可编辑，提交新增接口时由后端编号规则生成。'),
  field('订单来源', 'OrderCreate.form.sourceText', '基础信息只读字段，展示手动输入或来源类型/来源编号。', '未选择来源时显示手动输入。'),
  field('供应商', 'OrderCreate.form.supplier', '基础信息必填选择字段，通过选择供应商弹窗回填。', '切换主供应商时会清空当前采购明细。'),
  field('采购日期', 'OrderCreate.form.date', '基础信息必填输入框，默认显示自动。', '页面标记为必填；允许按页面输入值提交。'),
  field('预计到货', 'OrderCreate.form.arrival', '基础信息日期输入框，维护预计到货日期。', '可为空；用于到货待办和采购跟踪。'),
  field('采购来源提示', 'OrderCreate.sourceNote', '基础信息说明文本。', '页面提示采购来源可从请购、询价定价、MRP采购建议带入，手动采购记录为手动来源。'),
  field('采购明细', 'OrderCreate.rows', '采购明细可编辑子表。', '字段为产品名称、产品编号、产品型号、产品分类、产品单位、采购数量、采购单价、采购金额、预计到货、供应商、操作。'),
  field('本次采购数量', 'OrderCreate.totalQty', '采购明细汇总字段。', '由采购数量列自动汇总。'),
  field('本次采购金额', 'OrderCreate.totalAmount', '采购明细汇总字段。', '由采购数量和采购单价计算后汇总。'),
  field('采购备注', 'OrderCreate.detail', '富文本编辑区，填写采购备注、交付要求、异常说明等内容。', '暂存或提交审批时写入 detail。'),
  field('订单来源弹窗', 'SourcePickerModal', '选择订单来源的弹窗。', '弹窗标题为选择订单来源，确认后带入来源单据和产品。'),
  field('选择供应商弹窗', 'SupplierPickerModal', '选择主供应商或明细行供应商的弹窗。', '主供应商选择后回填基础信息；明细行更换供应商需要先填写更换理由。'),
  field('选择产品弹窗', 'ProductPickerModal', '新增明细时打开的产品选择弹窗。', '确认后追加采购明细，供应商默认使用主供应商或产品默认供应商。'),
  field('更换供应商理由弹窗', 'SupplierReasonModal', '明细行更换供应商前的理由弹窗。', '必须填写更换理由后才能继续选择新的供应商；页面提示更换会触发审核流程。'),
  field('暂存', 'OrderCreate.formActions.draft', '顶部动作按钮，保存当前采购订单草稿。', '提交新增接口后页面提示“采购订单草稿已通过新增接口保存”。'),
  field('重置', 'OrderCreate.formActions.reset', '顶部动作按钮，清空当前采购订单草稿。', '执行前必须二次确认；确认后清空来源和采购明细。'),
  field('提交审批', 'OrderCreate.formActions.submit', '顶部主按钮，提交采购订单审批。', '提交新增接口后页面提示“采购订单已通过新增接口提交审批”。'),
];

const purchaseOrderListFields: PrdField[] = [
  field('全局搜索', 'configs.orders.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如采购编号、供应商、产品）”。', '搜索命中采购编号、供应商、产品概要等当前行数据。'),
  field('采购编号', 'PurchaseRow.code', '列表主链接字段。', '点击进入采购订单详情。'),
  field('供应商', 'PurchaseRow.supplier', '采购订单供应商。', '来自新增页供应商或订单来源。'),
  field('产品概要', 'PurchaseRow.summary', '采购产品摘要。', '来自采购明细产品汇总。'),
  field('采购日期', 'PurchaseRow.date', '采购订单日期。', '列表日期字段。'),
  field('采购金额', 'PurchaseRow.amount', '采购订单金额。', '数字列。'),
  field('已付金额', 'PurchaseRow.paid', '订单已付款金额。', '由财务付款回写。'),
  field('到票金额', 'PurchaseRow.invoice', '订单已到票金额。', '由财务进项发票回写。'),
  field('三单匹配', 'PurchaseRow.match', '采购订单、入库和发票的匹配结果。', '差异处理在详情或财务侧完成，不在列表直接改。'),
  field('暂估应付', 'PurchaseRow.provisional', '采购暂估应付金额或状态。', '由入库、发票和财务回写。'),
  field('发票认证', 'PurchaseRow.certified', '进项发票认证结果。', '由财务发票认证回写。'),
  field('质检扣款', 'PurchaseRow.deduction', '质检导致的扣款金额或状态。', '由质检与财务回写。'),
  field('可付款', 'PurchaseRow.payable', '当前可付款金额或状态。', '由付款条件、三单匹配、暂估和扣款计算。'),
  field('预计到货', 'PurchaseRow.arrival', '采购订单预计到货日期。', '来自新增页预计到货或来源单据。'),
  field('采购状态', 'PurchaseRow.state', '采购订单列表真实状态字段。', '筛选项来自当前页面：审核中、采购中、运输中、待入库、异常取消、部分入库、已完成。'),
  field('操作', '列表操作列', '当前行操作入口。', '当前页面提供查看入口。'),
  field('批量操作', 'configs.orders.bulkActions.batch', '采购订单列表批量动作。', '按勾选行执行批量操作入口。'),
  field('筛选弹窗', 'PurchaseResourcePage.filterModalOpen', '采购订单筛选弹窗。', '当前可筛选采购状态。'),
  field('字段配置', 'PurchaseResourcePage.columnsModalOpen', '采购订单字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const purchaseSupplierDetailFields = detailPageFields(
  '供应商详情',
  'src/views/purchase/PurchaseResourcePage.vue PurchaseDetailView',
  ['供应商信息', '供应产品', '联系人信息', '财务信息', '地址信息', '附件信息', '报价记录', '采购记录', '操作记录'],
  ['供应商编号', '供应商名称', '供应商类型', '供应产品', '联系人', '联系电话', '采购人员', '信用代码', '供应商状态'],
  ['审核', '提交转正', '编辑', '删除', '停用', '启用', '打印', '导出'],
);

const purchaseRequestDetailFields = detailPageFields(
  '请购详情',
  'src/views/purchase/PurchaseResourcePage.vue PurchaseDetailView',
  ['请购信息', '请购明细', '附件', '操作记录'],
  ['请购主题', '请购编号', '申请日期', '请购人', '请购来源', '产品概要', '请购数量', '预算金额', '交付日期', '流程状态'],
  ['审核', '提交审批', '重新提交', '编辑', '删除', '转询价', '转采购', '继续采购', '关闭', '打印', '导出'],
);

const purchaseInquiryDetailFields = detailPageFields(
  '询价详情',
  'src/views/purchase/PurchaseResourcePage.vue PurchaseDetailView',
  ['询价信息', '询价明细', '附件', '操作记录'],
  ['询价主题', '询价编号', '询价日期', '截止日期', '询价产品', '目标供应商', '询价金额', '供应商报价', '询价状态'],
  ['审核', '询价完毕', '定价', '作废', '编辑', '打印', '导出'],
);

const purchaseOrderDetailFields = detailPageFields(
  '采购订单详情',
  'src/views/purchase/PurchaseResourcePage.vue PurchaseDetailView',
  ['采购信息', '采购明细', '入库记录', '三单匹配', '应付暂估', '质检扣款', '付款记录', '到票记录', '来源记录', '操作记录'],
  ['采购编号', '供应商', '产品概要', '采购数量', '采购金额', '到货数量', '入库数量', '到票状态', '付款状态', '采购状态'],
  ['审核', '发货运输', '异常取消', '到货入库', '部分入库', '完成', '编辑', '打印', '导出'],
);

const reservedNavigationFields = (title: string, route: string, _prototype: string, description: string): PrdField[] => [
  field('导航名称', 'src/layouts/erp-shell/navigation.ts', `${title}是当前侧边业务导航入口。`, '按顶部与侧边业务导航展示，点击后进入对应业务范围。'),
  field('页面路由', route, `点击导航进入 ${route}。`, '页面以入口、范围和跳转说明为主。'),
  field('页面承接', 'src/app/router/index.ts', `${title}通过当前路由进入对应页面、工作台或列表视图。`, '说明当前入口在页面上的对象范围和跳转关系。'),
  field('业务范围', 'contractCenters.resources.description', description, '说明当前入口覆盖的业务对象、来源关系和后续字段范围。'),
];

function exactPageFields(pageTitle: string, source: string, names: string[], rules = '字段名称和顺序必须与当前页面展示一致。'): PrdField[] {
  return names.map((name) => field(name, source, `${pageTitle}当前页面字段：${name}。`, rules));
}

function detailPageFields(
  pageTitle: string,
  source: string,
  tabs: string[],
  fields: string[],
  actions: string[],
  extra: PrdField[] = [],
): PrdField[] {
  return [
    ...exactPageFields(`${pageTitle}Tab`, source, tabs, 'Tab 名称和切换内容必须与当前详情页一致。'),
    ...exactPageFields(`${pageTitle}详情字段`, source, fields, '字段名称、顺序和只读/回写口径必须与当前详情页一致。'),
    ...exactPageFields(`${pageTitle}顶部动作`, source, actions, '动作名称和可用条件必须与当前详情页按钮一致。'),
    ...extra,
  ];
}

const warehouseStockListFields: PrdField[] = [
  field('库存列表', 'configs.stocks.tree', '左侧库存分类树。', '节点为全部库存、成品、半成品、原材料、包装耗材。'),
  field('全局搜索', 'configs.stocks.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如产品名称、产品编号、批次、仓库…）”。', '搜索当前库存行数据。'),
  ...exactPageFields('库存列表', 'configs.stocks.columns', ['图片', '台账编号', '产品名称', '产品编号', '产品型号', '产品分类', '产品单位', '库存数量', '车间数量', '在途数量', '冻结数量', '占用数量', '可用数量', '仓库', '质量状态', '成本层', '来源明细', '操作']),
  field('批量冻结', 'configs.stocks.bulkActions.freeze', '库存列表批量动作。', '按勾选库存行执行冻结入口。'),
  field('批量导出', 'configs.stocks.bulkActions.export', '库存列表批量动作。', '导出字段与当前筛选和字段配置一致。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '库存列表筛选弹窗。', '可按产品分类和资源树筛选。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '库存列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseInboundCreateFields: PrdField[] = [
  ...exactPageFields('直接入库', 'createBaseFields.inbounds', ['入库主题', '入库单号', '入库类型', '入库部门', '入库人员']),
  field('物品明细', 'createLineColumns.inbounds', '直接入库物品明细表。', '表头为来源单据、来源明细、物品编码、物品名称、规格型号、单位、入库数量、入库库位、过账状态、操作。'),
  field('附件', 'AwAttachmentTable', '入库附件子表。', '附件类型为入库附件、质检附件、上架附件、审批材料。'),
  field('入库详情', 'AwRichTextEditor', '入库详情富文本编辑区。', '用于填写来源说明、库位策略和处理要求。'),
  field('选择物品弹窗', 'AwOptionPickerModal', '新增明细时打开的物品选择弹窗。', '字段为物品编码、物品名称、规格型号、类型、单位、批次、库位、可用量。'),
  field('选择入库仓库/库位弹窗', 'AwCategoryPickerModal', '入库库位选择弹窗。', '支持按仓库、区域、库位选择并回填当前明细行。'),
  field('选择入库人员弹窗', 'AwPersonPickerModal', '入库人员选择弹窗。', '标题为选择入库人，确认后回填入库人员。'),
  ...exactPageFields('直接入库顶部动作', 'WarehouseCreateView.actions', ['取消', '重置', '暂存', '确认入库']),
];

const warehouseInboundListFields: PrdField[] = [
  field('全局搜索', 'configs.inbounds.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如供应商、产品名称、入库单号、来源单据号…）”。', '搜索当前入库单行数据。'),
  ...exactPageFields('全部入库单', 'inboundOutboundColumns(入库)', ['入库主题', '入库单号', '来源单据号', '入库类别', '入库数量', '申请日期', '入库人员', '入库日期', '入库状态', '操作']),
  field('批量上架', 'configs.inbounds.bulkActions.putaway', '入库列表批量动作。', '按勾选入库单执行批量上架入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '入库列表筛选弹窗。', '可筛选入库类别和入库状态。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '入库列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseInboundPendingFields: PrdField[] = [
  field('全局搜索', 'configs.inbounds.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如供应商、产品名称、入库单号、来源单据号…）”。', '搜索当前待入库单行数据。'),
  ...exactPageFields('待入库单', 'inboundOutboundColumns(入库)', ['入库主题', '入库单号', '来源单据号', '入库类别', '入库数量', '申请日期', '入库人员', '入库日期', '入库状态', '操作']),
  field('待入库过滤', 'actionFilterMatched(inbounds, 待入库单)', '页面只展示未完成入库过账的入库单。', '排除已上架过账、已入库、关闭状态的入库单。'),
  field('批量上架', 'configs.inbounds.bulkActions.putaway', '待入库单批量动作。', '按勾选入库单执行批量上架入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '待入库单筛选弹窗。', '可筛选入库类别和入库状态。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '待入库单字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseInboundDetailFields: PrdField[] = [
  field('全局搜索', 'getActionListConfig.inbounds.待入库明细.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如物料名称、物料编码）”。', '搜索当前待入库明细行数据。'),
  ...exactPageFields('待入库明细', 'detailStatsColumns(待入库数量)', ['物料名称', '物料编码', '规格型号', '单位', '待入库数量', '相关人员', '说明']),
  field('批量入库', 'getActionListConfig.inbounds.待入库明细.bulkActions.batchInbound', '待入库明细批量动作。', '按勾选明细执行批量入库入口。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '待入库明细字段配置弹窗。', '可勾选显示列。'),
];

const warehouseOutboundCreateFields: PrdField[] = [
  ...exactPageFields('直接出库', 'createBaseFields.outbounds', ['出库主题', '出库单号', '出库类型', '出库部门', '出库人员']),
  field('物品明细', 'createLineColumns.outbounds', '直接出库物品明细表。', '表头为来源单据、来源明细、物品编码、物品名称、规格型号、单位、出库数量、出库库位、过账状态、操作。'),
  field('附件', 'AwAttachmentTable', '出库附件子表。', '附件类型为入库附件、质检附件、上架附件、审批材料。'),
  field('出库详情', 'AwRichTextEditor', '出库详情富文本编辑区。', '用于填写来源说明、库位策略和处理要求。'),
  field('选择物品弹窗', 'AwOptionPickerModal', '新增明细时打开的物品选择弹窗。', '字段为物品编码、物品名称、规格型号、类型、单位、批次、库位、可用量。'),
  field('选择出库仓库/库位弹窗', 'AwCategoryPickerModal', '出库库位选择弹窗。', '支持按仓库、区域、库位选择并回填当前明细行。'),
  field('选择出库人员弹窗', 'AwPersonPickerModal', '出库人员选择弹窗。', '标题为选择出库人，确认后回填出库人员。'),
  ...exactPageFields('直接出库顶部动作', 'WarehouseCreateView.actions', ['取消', '重置', '暂存', '确认出库']),
];

const warehouseOutboundListFields: PrdField[] = [
  field('全局搜索', 'configs.outbounds.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如客户、产品名称、出库单号、来源单据号…）”。', '搜索当前出库单行数据。'),
  ...exactPageFields('全部出库单', 'inboundOutboundColumns(出库)', ['出库主题', '出库单号', '来源单据号', '出库类别', '出库数量', '申请日期', '出库人员', '出库日期', '出库状态', '操作']),
  field('批量拣货', 'configs.outbounds.bulkActions.pick', '出库列表批量动作。', '按勾选出库单执行批量拣货入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '出库列表筛选弹窗。', '可筛选出库类别和出库状态。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '出库列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseOutboundPendingFields: PrdField[] = [
  field('全局搜索', 'configs.outbounds.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如客户、产品名称、出库单号、来源单据号…）”。', '搜索当前待出库单行数据。'),
  ...exactPageFields('待出库单', 'inboundOutboundColumns(出库)', ['出库主题', '出库单号', '来源单据号', '出库类别', '出库数量', '申请日期', '出库人员', '出库日期', '出库状态', '操作']),
  field('待出库过滤', 'actionFilterMatched(outbounds, 待出库单)', '页面只展示未完成出库过账的出库单。', '排除已出库过账、已过账、异常关闭状态的出库单。'),
  field('批量拣货', 'configs.outbounds.bulkActions.pick', '待出库单批量动作。', '按勾选出库单执行批量拣货入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '待出库单筛选弹窗。', '可筛选出库类别和出库状态。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '待出库单字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseOutboundDetailFields: PrdField[] = [
  field('全局搜索', 'getActionListConfig.outbounds.待出库明细.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如物料名称、物料编码）”。', '搜索当前待出库明细行数据。'),
  ...exactPageFields('待出库明细', 'detailStatsColumns(待出库数量)', ['物料名称', '物料编码', '规格型号', '单位', '待出库数量', '相关人员', '说明']),
  field('批量出库', 'getActionListConfig.outbounds.待出库明细.bulkActions.batchOutbound', '待出库明细批量动作。', '按勾选明细执行批量出库入口。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '待出库明细字段配置弹窗。', '可勾选显示列。'),
];

const warehouseShipApplyFields: PrdField[] = [
  field('全局搜索', 'getActionListConfig.outbounds.待申请发货.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如物料名称、物料编码）”。', '搜索当前待申请发货明细行数据。'),
  ...exactPageFields('待申请发货', 'detailStatsColumns(待出库数量)', ['物料名称', '物料编码', '规格型号', '单位', '待出库数量', '相关人员', '说明']),
  field('发货申请过滤', 'getActionListRows.outbounds.待申请发货', '页面展示需要手动申请发货的出库明细。', '说明列展示“订单流转策略为否，需要手动申请发货”。'),
  field('批量申请发货', 'getActionListConfig.outbounds.待申请发货.bulkActions.batchApplyShip', '待申请发货批量动作。', '按勾选明细执行批量申请发货入口。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '待申请发货字段配置弹窗。', '可勾选显示列。'),
];

const warehouseTransferCreateFields: PrdField[] = [
  ...exactPageFields('新增调拨', 'createBaseFields.transfers', ['调拨主题', '调拨单号', '调拨日期', '调拨原因']),
  field('物品明细', 'createLineColumns.transfers', '调拨物品明细表。', '表头为来源明细、物品编码、物品名称、规格型号、类型、单位、批次、质量状态、成本层、当前库存、可调拨量、原冻结量、调拨冻结、在途数量、申请调拨、调出确认、调入确认、差异数量、原仓库、目标仓库、备注、操作。'),
  field('调拨策略提示', 'createStrategyNote.transfers', '调拨提交后的处理提示。', '页面提示调拨提交后冻结可调拨量，调出确认转在途，调入确认后进入目标库位，差异进入调整审批。'),
  field('附件', 'AwAttachmentTable', '调拨附件子表。', '附件类型为入库附件、质检附件、上架附件、审批材料。'),
  field('调拨详情', 'AwRichTextEditor', '调拨详情富文本编辑区。', '用于填写调拨原因、库位策略和处理要求。'),
  field('选择物品弹窗', 'AwOptionPickerModal', '新增明细时打开的物品选择弹窗。', '字段为物品编码、物品名称、规格型号、类型、单位、批次、库位、可用量。'),
  field('选择原/目标仓库弹窗', 'AwCategoryPickerModal', '调拨仓库与库位选择弹窗。', '支持选择原仓库、目标仓库或明细行库位。'),
  ...exactPageFields('新增调拨顶部动作', 'WarehouseCreateView.actions', ['取消', '重置', '暂存', '提交调拨']),
];

const warehouseTransferListFields: PrdField[] = [
  field('全局搜索', 'configs.transfers.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如物料、调拨单号、仓库）”。', '搜索当前调拨单行数据。'),
  ...exactPageFields('调拨列表', 'configs.transfers.columns', ['调拨主题', '调拨单号', '调拨数量', '原仓库', '目标仓库', '调拨日期', '经办人', '调拨状态', '操作']),
  field('批量确认', 'configs.transfers.bulkActions.confirm', '调拨列表批量动作。', '按勾选调拨单执行批量确认入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '调拨列表筛选弹窗。', '当前可筛选调拨状态。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '调拨列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseTransferDetailFields: PrdField[] = [
  field('全局搜索', 'getActionListConfig.transfers.调拨明细表.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如物料名称、物料编码、仓库）”。', '搜索当前调拨明细行数据。'),
  ...exactPageFields('调拨明细表', 'getActionListConfig.transfers.调拨明细表.columns', ['来源明细', '物料名称', '物料编码', '批次', '质量状态', '单位', '调拨数量', '调拨冻结', '在途数量', '调入数量', '原仓库', '目标仓库', '调拨日期']),
  field('批量处理', 'getActionListConfig.transfers.调拨明细表.bulkActions.batchTransfer', '调拨明细表批量动作。', '按勾选明细执行批量处理入口。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '调拨明细表字段配置弹窗。', '可勾选显示列。'),
];

const warehouseCountCreateFields: PrdField[] = [
  ...exactPageFields('直接盘点', 'createBaseFields.counts', ['盘点主题', '单据编号', '经办人', '开始日期', '预计结束日期', '是否锁库']),
  field('盘点范围', 'inventoryCountModeCards', '盘点范围模式卡片。', '模式为整仓盘点、库区盘点、库位盘点、商品盘点。'),
  field('盘点明细', 'editableColumns.counts', '盘点明细可编辑子表。', '字段为仓库、库区、库位、物品编码、物品名称、规格型号、批次、账面数量、实盘数量、盈亏数量、盘点结果、差异原因、处理方式、操作。'),
  field('附件', 'AwAttachmentTable', '盘点附件子表。', '附件类型为入库附件、质检附件、上架附件、审批材料。'),
  field('盘点详情', 'AwRichTextEditor', '盘点详情富文本编辑区。', '填写盘点说明、范围依据、锁库策略、差异处理要求。'),
  field('选择盘点仓库/库区/库位/商品', 'CountWarehousePickerModal/AwCategoryPickerModal/AwOptionPickerModal', '盘点范围选择弹窗。', '不同盘点模式打开对应弹窗并生成盘点明细。'),
  ...exactPageFields('直接盘点顶部动作', 'WarehouseCreateView.actions', ['取消', '重置', '暂存', '确认盘点']),
];

const warehouseCountListFields: PrdField[] = [
  field('全局搜索', 'configs.counts.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如盘点主题、产品名称、工单编号…）”。', '搜索当前盘点单行数据。'),
  ...exactPageFields('盘点计划', 'configs.counts.columns', ['盘点主题', '盘点编号', '盘点仓库', '盘点范围', '锁库范围', '是否锁库', '锁库数量', '盘点日期', '盘点人', '盘点状态', '操作']),
  field('批量盘点', 'configs.counts.bulkActions.count', '盘点列表批量动作。', '按勾选盘点单执行批量盘点入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '盘点列表筛选弹窗。', '可筛选是否锁库和盘点状态。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '盘点列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseWarehouseListFields: PrdField[] = [
  field('全局搜索', 'getActionListConfig.locations.warehouses.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如仓库名称、仓库编码、负责人）”。', '搜索仓库列表行数据。'),
  ...exactPageFields('仓库列表', 'getActionListConfig.locations.warehouses.columns', ['仓库编码', '仓库名称', '仓库类型', '仓库负责人', '联系方式', '仓库地址', '仓库状态', '操作']),
  field('批量启用', 'configs.locations.bulkActions.enable', '仓库列表批量动作。', '按勾选仓库执行批量启用入口。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '仓库列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseAreaListFields: PrdField[] = [
  field('仓库列表', 'getActionListConfig.locations.areas.tree', '区域列表左侧仓库筛选树。', '根节点为全部仓库，子节点为各仓库。'),
  field('全局搜索', 'getActionListConfig.locations.areas.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如区域名称、区域编码、所属仓库）”。', '搜索区域列表行数据。'),
  ...exactPageFields('区域列表', 'getActionListConfig.locations.areas.columns', ['区域编号', '区域名称', '所属仓库', '温区', '容量', '库位数', '区域描述', '负责人', '区域状态', '操作']),
  field('批量启用', 'configs.locations.bulkActions.enable', '区域列表批量动作。', '按勾选区域执行批量启用入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '区域列表筛选弹窗。', '当前可筛选区域状态和仓库树。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '区域列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseLocationListFields: PrdField[] = [
  field('库位管理', 'configs.locations.tree', '库位列表左侧库位管理资源树。', '按全部仓库、仓库、区域分层展示。'),
  field('全局搜索', 'configs.locations.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如仓库、区域、库位）”。', '搜索库位列表行数据。'),
  ...exactPageFields('库位列表', 'configs.locations.columns', ['库位编号', '库位名称', '所属区域', '库位描述', '容量', '所属仓库', '仓库负责人', '仓库地址', '库位状态', '操作']),
  field('批量启用', 'configs.locations.bulkActions.enable', '库位列表批量动作。', '按勾选库位执行批量启用入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '库位列表筛选弹窗。', '可筛选库位状态和资源树。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '库位列表字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseOutboundQcCreateFields: PrdField[] = [
  ...exactPageFields('新增出货质检', 'createBaseFields.outboundQuality', ['出货检验主题', '单据编号', '经办人', '来源单据', 'OQC状态', '抽样规则']),
  field('抽样与检验明细', 'editableColumns.outboundQuality', '出货质检明细可编辑子表。', '字段为检验项目名称、检验方法、检验值类型、标准值、上限、下限、样本号/实测值、缺陷等级、检验结论、操作。'),
  field('附件', 'AwAttachmentTable', '出货质检附件子表。', '附件类型为入库附件、质检附件、上架附件、审批材料。'),
  field('详情', 'AwRichTextEditor', '出货质检详情富文本编辑区。', '填写来源说明、抽样偏差、不良原因、处置建议、复检要求等。'),
  field('选择出货质检来源', 'AwSourcePickerModal', '出货质检来源选择弹窗。', '选择来源单据后带入来源明细。'),
  field('选择物品弹窗', 'AwOptionPickerModal', '新增检验明细时打开的物品选择弹窗。', '字段为物品编码、物品名称、规格型号、类型、单位、批次、库位、可用量。'),
  ...exactPageFields('新增出货质检顶部动作', 'WarehouseCreateView.actions', ['取消', '重置', '暂存', '提交质检']),
];

const warehouseOutboundQcListFields: PrdField[] = [
  field('OQC分类', 'configs.outboundQuality.tree', '左侧 OQC 分类资源树。', '节点为全部OQC、待出货检验、客户验货、让步放行、拒收重检。'),
  field('全局搜索', 'configs.outboundQuality.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如出货检验主题、OQC单号、产品/批次）”。', '搜索出库质检列表行数据。'),
  ...exactPageFields('出货质检列表', 'configs.outboundQuality.columns', ['出货检验主题', 'OQC单号', '销售/出库单', '客户/产品', '数量/抽样', '检验员', '质检日期', 'OQC状态', '操作']),
  field('批量处理', 'configs.outboundQuality.bulkActions.process', '出货质检列表批量动作。', '按勾选质检单执行批量处理入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '出货质检筛选弹窗。', '可筛选 OQC 状态和分类树。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '出货质检字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseInboundQcCreateFields: PrdField[] = [
  ...exactPageFields('新增来料质检', 'createBaseFields.inboundQuality', ['来料检验主题', '单据编号', '经办人', '来源单据', 'IQC状态', '抽样规则']),
  field('抽样与检验明细', 'editableColumns.inboundQuality', '来料质检明细可编辑子表。', '字段为检验项目名称、检验方法、检验值类型、标准值、上限、下限、样本号/实测值、缺陷等级、检验结论、操作。'),
  field('附件', 'AwAttachmentTable', '来料质检附件子表。', '附件类型为入库附件、质检附件、上架附件、审批材料。'),
  field('详情', 'AwRichTextEditor', '来料质检详情富文本编辑区。', '填写来源说明、抽样偏差、不良原因、处置建议、复检要求等。'),
  field('选择来料质检来源', 'AwSourcePickerModal', '来料质检来源选择弹窗。', '选择来源单据后带入来源明细。'),
  field('选择物品弹窗', 'AwOptionPickerModal', '新增检验明细时打开的物品选择弹窗。', '字段为物品编码、物品名称、规格型号、类型、单位、批次、库位、可用量。'),
  ...exactPageFields('新增来料质检顶部动作', 'WarehouseCreateView.actions', ['取消', '重置', '暂存', '提交质检']),
];

const warehouseInboundQcListFields: PrdField[] = [
  field('IQC分类', 'configs.inboundQuality.tree', '左侧 IQC 分类资源树。', '节点为全部IQC、待来料检验、让步接收、拒收退回、已放行。'),
  field('全局搜索', 'configs.inboundQuality.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如来料检验主题、IQC单号、供应商/产品/批次）”。', '搜索来料质检列表行数据。'),
  ...exactPageFields('来料质检列表', 'configs.inboundQuality.columns', ['来料检验主题', 'IQC单号', '采购/入库单', '供应商/产品', '数量/抽样', '检验员', '质检日期', 'IQC状态', '操作']),
  field('批量处理', 'configs.inboundQuality.bulkActions.process', '来料质检列表批量动作。', '按勾选质检单执行批量处理入口。'),
  field('筛选弹窗', 'WarehouseResourcePage.showFilterModal', '来料质检筛选弹窗。', '可筛选 IQC 状态和分类树。'),
  field('字段配置', 'WarehouseResourcePage.showColumnsModal', '来料质检字段配置弹窗。', '可勾选显示列；操作列不可取消。'),
];

const warehouseRecordDetailFields = detailPageFields(
  '仓储单据详情',
  'src/views/warehouse/WarehouseResourcePage.vue',
  ['入库信息', '物品明细', '物码绑定明细', '附件', '操作记录'],
  ['单据主题', '单据编号', '来源单据', '产品概要', '数量', '仓库/库位', '相关人员', '业务状态', '说明'],
  ['审核', '质检确认', '上架确认', '打印', '导出'],
);

const warehouseOutboundRecordDetailFields = detailPageFields(
  '出库单详情',
  'src/views/warehouse/WarehouseResourcePage.vue detailTabs.outbounds',
  ['出库信息', '物品明细', '拣货复核', 'OQC记录', '附件', '操作记录'],
  ['单据主题', '单据编号', '来源单据', '产品概要', '出库数量', '仓库/库位', '经办人', '出库状态', '说明'],
  ['审核', '占用确认', '复核确认', '打印', '导出'],
);

const warehouseTransferRecordDetailFields = detailPageFields(
  '调拨单详情',
  'src/views/warehouse/WarehouseResourcePage.vue detailTabs.transfers',
  ['调拨信息', '物品明细', '调出确认', '调入确认', '操作记录'],
  ['调拨主题', '调拨编号', '调出仓库', '调入仓库', '调拨数量', '相关人员', '调拨状态', '说明'],
  ['调出确认', '调入确认', '打印', '导出'],
);

const warehouseCountRecordDetailFields = detailPageFields(
  '盘点单详情',
  'src/views/warehouse/WarehouseResourcePage.vue detailTabs.counts',
  ['盘点信息', '物品明细', '差异调整', '附件', '操作记录'],
  ['盘点主题', '盘点编号', '盘点范围', '物品概要', '账面数量', '实盘数量', '差异数量', '盘点状态'],
  ['审核', '开始盘点', '提交复盘', '差异确认', '打印', '导出'],
);

const productCatalogFields = (pageTitle: string, route: string, statusNote: string): PrdField[] => [
  field('页面复用关系', 'src/views/rd/RdResourcePage.vue pathToModule', `${route} 映射到 products 模块，复用研发产品库列表、新增、详情和设置结构。`, '不得写成当前中心私有产品页面；字段、弹窗和设置入口以 RdResourcePage 与 rd/resources.ts 为准。'),
  field('状态口径', 'src/views/rd/RdResourcePage.vue statusOverrideByPath', statusNote, '只记录当前路由真实覆盖的状态口径；没有覆盖时使用 rd/resources.ts products.columns 的产品状态。'),
  field('左侧产品库树', 'src/app/api/rd/resources.ts products.treeNodes', `${pageTitle}左侧产品分类树。`, '节点为全部产品、成品、半成品、原材料。'),
  field('全局搜索', 'src/app/api/rd/resources.ts products.searchPlaceholder', '工具栏搜索框，提示“搜索产品名称、编号、型号”。', '搜索产品名称、产品编号、产品型号等当前列表字段。'),
  ...exactPageFields(pageTitle, 'src/app/api/rd/resources.ts products.columns', ['图片', '产品名称', '产品编号', '产品型号', '产品分类', '品牌', '标准单位', '获取方式', '产品状态', '操作']),
  field('新增产品', 'src/app/api/rd/resources.ts createConfigs.products', '新增产品表单包含基础信息、新增型号、销售信息、库存策略、媒体与说明、附件。', '通过当前中心路由进入时仍复用产品新增配置，不新增私有字段。'),
  field('产品设置', 'src/views/rd/RdResourcePage.vue settingModule', '产品编号、产品分类、审批流程、自定义字段、产品策略、打印模板进入 rdProducts 设置母版。', '设置页复用 OperationSettingPage；当前 PRD 只说明入口和复用关系。'),
];

const materialCatalogFields = (pageTitle: string, route: string, statusNote: string): PrdField[] => [
  field('页面复用关系', 'src/views/rd/RdResourcePage.vue pathToModule', `${route} 映射到 materials 模块，复用研发物料管理列表、新增、详情和设置结构。`, '不得写成当前中心私有物料页面；字段、弹窗和设置入口以 RdResourcePage 与 rd/resources.ts 为准。'),
  field('状态口径', 'src/views/rd/RdResourcePage.vue statusOverrideByPath', statusNote, '只记录当前路由真实覆盖的状态口径；没有覆盖时使用 rd/resources.ts materials.columns 的物料状态。'),
  field('左侧物料库树', 'src/app/api/rd/resources.ts materials.treeNodes', `${pageTitle}左侧物料分类树。`, '节点为全部物料、电子物料、机械物料、包装物料。'),
  field('全局搜索', 'src/app/api/rd/resources.ts materials.searchPlaceholder', '工具栏搜索框，提示“搜索物料名称、编码、拼音码”。', '搜索物料名称、物料编号、物料规格等当前列表字段。'),
  ...exactPageFields(pageTitle, 'src/app/api/rd/resources.ts materials.columns', ['图片', '物料名称', '物料编号', '物料规格', '物料分类', '品牌', '标准单位', '获取方式', '物料状态', '操作']),
  field('新增物料', 'src/app/api/rd/resources.ts createConfigs.materials', '新增物料表单包含基础信息、采购信息、库存策略、质量与附件等配置。', '通过当前中心路由进入时仍复用物料新增配置，不新增私有字段。'),
  field('物料设置', 'src/views/rd/RdResourcePage.vue settingModule', '物料编号、物料分类、审批流程、自定义字段、物料策略、打印模板进入 rdMaterials 设置母版。', '设置页复用 OperationSettingPage；当前 PRD 只说明入口和复用关系。'),
];

const customerSettingFields = (pageTitle: string, source: string, columns: string[]): PrdField[] => [
  ...exactPageFields(pageTitle, source, columns),
  field('页面组件', 'src/views/sales/customers/CustomerSettingPage.vue', '客户设置页按 route.params.setting 切换分组、字段、编号、等级、审批、策略。', '真实路由为 /sales/customers/settings/:setting，不是客户列表 query 设置页。'),
  field('母版组件', 'AwSettingPage / AwSettingToolbar / AwSettingSplitPage / AwSettingListCard', '客户设置页复用设置页母版与列表卡片。', '新增、返回、保存、取消等顶部动作以当前 setting 模式决定。'),
];

const storehouseProductStockFields: PrdField[] = [
  field('仓库列表树', 'StorehouseWarehouseManagement.warehouseTreeNodes', '左侧按全部仓库商品、产成品库、原辅料库、内耗品库、残次品库筛选库存商品。', '树节点来自当前页面 warehouseRows 与 productRows 计算结果。'),
  field('全局搜索', 'StorehouseWarehouseManagement.productKeyword', '工具栏搜索框，提示“全局搜索（如商品名称、商品编号、库位）”。', '搜索商品名称、商品编号、库位等当前列表字段。'),
  ...exactPageFields('仓库管理商品列表', 'StorehouseWarehouseManagement.baseProductColumns', ['商品编号', '商品名称', '商品分类', '规格型号', '单位', '库存数量', '可用数量', '库位', '库存状态', '操作']),
  field('批量动作', 'StorehouseWarehouseManagement.productBulkActions', '非库存预警模式提供批量转移、批量指定。', '动作只按当前页面展示说明，不扩展调拨、盘点等旧仓储动作。'),
  field('商品详情Tab', 'StorehouseWarehouseManagement.productDetailTabs', '商品详情 Tab 为产品信息、库存明细、库存流水、占用冻结、出库记录、入库记录。', 'Tab 名称和内容来自当前页面，不沿用旧仓储详情页。'),
  field('详情顶部动作', 'StorehouseWarehouseManagement.AwDetailToolbar', '商品详情顶部动作包含入库、出库、转库、盘库、冻结。', '动作只作为当前页面按钮入口说明，具体新增仍受页面现状约束。'),
];

const storehouseWarehouseListFields: PrdField[] = [
  field('全局搜索', 'StorehouseWarehouseManagement.warehouseKeyword', '仓库列表搜索框，提示“全局搜索（如仓库名称、仓库编码、负责人）”。', '搜索仓库名称、仓库编码、负责人等当前字段。'),
  ...exactPageFields('多仓管理/仓储规则列表', 'StorehouseWarehouseManagement.warehouseColumns', ['仓库编码', '仓库名称', '仓库类型', '仓库负责人', '联系方式', '仓库地址', '容量', '温区', '仓库状态', '操作']),
  field('新增仓库/新增规则', 'StorehouseWarehouseManagement.AwListToolbar.createLabel', '多仓管理显示新增仓库，仓储规则显示新增规则。', '按钮文案由 route.query.setting 决定。'),
  field('规则设置弹窗', 'StorehouseWarehouseManagement.AwSettingModal', '仓储规则列表操作列打开规则设置弹窗。', '弹窗字段为适用仓库、仓库类型、是否启用仓储管理、是否管理产品生成日期、是否允许超库存下单。'),
];

const storehouseInventoryWarningFields: PrdField[] = [
  field('预警分类树', 'StorehouseWarehouseManagement.warningTreeNodes', '左侧预警分类为自产产品库存、代理产品库存、原辅料库存、临期列表。', '树节点来自 productRows.warningGroup 统计。'),
  field('全局搜索', 'StorehouseWarehouseManagement.productKeyword', '工具栏搜索框，提示“全局搜索（如商品名称、商品编号、库位）”。', '搜索库存预警列表当前字段。'),
  ...exactPageFields('库存预警列表', 'StorehouseWarehouseManagement.productColumns', ['商品编号', '商品名称', '商品分类', '规格型号', '单位', '库存数量', '库存预警值', '可用数量', '库位', '库存状态', '操作']),
  field('分类批量动作', 'StorehouseWarehouseManagement.warningBulkActionMap', '按预警分类展示批量预警、批量采购、批量生产、批量转库、批量处理。', '动作集合随左侧预警分类切换。'),
];

const storehouseInoutFields = (pageTitle: string, mode: 'inbound' | 'outbound'): PrdField[] => [
  field('仓库分类树', 'StorehouseInoutManagement.warehouseNodes', '左侧仓库分类为产成品库、原辅料库、内耗品库、残次品库。', '节点计数按当前出库/入库列表过滤结果计算。'),
  field('业务类型', 'StorehouseInoutManagement.businessTypes', mode === 'outbound' ? '出库业务类型为销售出库、领料出库、换货出库。' : '入库业务类型为生产入库、退货入库、来料入库、采购入库。', '业务类型必须来自当前页面数组。'),
  field('全局搜索', 'StorehouseInoutManagement.searchPlaceholder', mode === 'outbound' ? '出库搜索提示为“全局搜索（如来源单号、客户名称、出库部门）”。' : '入库搜索提示为“全局搜索（如单据编号、来源单号、往来单位）”。', '搜索当前列表字段。'),
  ...exactPageFields(pageTitle, 'StorehouseInoutManagement.columns', mode === 'outbound'
    ? ['来源单号', '业务类型', '客户名称/出库部门', '仓库', '是否质检', '单据数量', '经办人', '单据日期', '状态', '操作']
    : ['单据编号', '业务类型', '来源单号', '往来单位/领料部门', '仓库', '是否质检', '单据数量', '经办人', '单据日期', '状态', '操作']),
  field('详情Tab', 'StorehouseInoutManagement.detailTabs', mode === 'outbound' ? '出库详情 Tab 按当前页面展示出库信息、产品明细、质检记录、操作记录。' : '入库详情 Tab 按当前页面展示入库信息、产品明细、质检记录、操作记录。', 'Tab 与 AwDetailTabs 保持一致。'),
  field('详情顶部动作', 'StorehouseInoutManagement.detailActions', mode === 'outbound' ? '出库详情提供下发分拣、打印、导出。' : '入库详情提供入库。', '动作名称来自当前页面 computed detailActions。'),
  field('质检弹窗', 'StorehouseInoutManagement.qcExecutionModalOpen', '需要质检的单据可打开执行质检弹窗，展示产品、质检组、检验项和处理方式。', '弹窗结构来自当前页面，不写成旧 IQC/OQC 独立列表页。'),
];

const storehouseSortingFields: PrdField[] = [
  field('分拣状态树', 'StorehouseSortingDelivery.categoryNodes', '左侧分类为分拣出库历史、待分拣、分拣中、已分拣。', '节点计数来自当前 rows.categoryKey。'),
  ...exactPageFields('分拣配送列表', 'StorehouseSortingDelivery.columns', ['来源单号', '业务类型', '仓库', 'SKU数', '分拣数量', '分拣人', '计划时间', '状态', '操作']),
  field('已分拣列差异', 'StorehouseSortingDelivery.columns', '已分拣分类额外展示出库单号列。', '只有 activeCategory 为 sorted 时展示出库单号。'),
  field('批量动作', 'StorehouseSortingDelivery.bulkActions', '列表批量动作包含批量分配、批量打印。', '动作来自当前页面 bulkActions。'),
  field('分拣弹窗', 'StorehouseSortingDelivery.pick modal', '分拣弹窗支持简易分拣、明细分拣、确认分拣、返回修改、打印出库单、完成分拣。', '分拣产品、批次、库位和本次分拣数量来自当前页面 pickProductRows。'),
  field('出库质检弹窗', 'StorehouseSortingDelivery.pickQcModalOpen', '分拣过程中可打开出库质检弹窗。', '展示产品、质检组、外观/包装检验项、判定、处理方式和数量。'),
];

const storehouseShippingFields: PrdField[] = [
  field('配送状态树', 'StorehouseShippingDelivery.categoryNodes', '左侧分类为待发货、待收货、分拣修改确认、配送完成。', '节点来自当前页面分类配置。'),
  ...exactPageFields('发货配送列表', 'StorehouseShippingDelivery.columns', ['订单编号', '发货单号', '客户名称', '收货地址', '客户类型', '下单日期', '分拣时间', '业务员/下单员', '分拣员', '配送员', '配送日期', '操作']),
  field('批量动作', 'StorehouseShippingDelivery.bulkActions', '列表批量动作包含批量发货、批量确认。', '动作来自当前页面 bulkActions。'),
  field('详情动作', 'StorehouseShippingDelivery.detailActions', '详情动作按状态展示物流变更、上传收货凭据、装车、订单详情、打印订单、设置开票企业。', '动作来自当前页面 computed detailActions。'),
];

const storehouseSalesOrderFields: PrdField[] = [
  ...exactPageFields('仓库销售订单列表', 'StorehouseSalesOrders.columns', ['订单编号', '客户名称', '仓库', '商品数', '订单数量', '已分拣数', '发货状态', '交付日期', '负责人', '操作']),
  field('批量动作', 'StorehouseSalesOrders.bulkActions', '列表批量动作为批量分拣、批量发货。', '动作来自当前页面 bulkActions。'),
  field('详情Tab', 'StorehouseSalesOrders.tabs', '详情 Tab 为基础情况、分拣记录、发货记录。', 'Tab 通过 AwDetailTabs 切换。'),
  ...exactPageFields('仓库销售订单详情字段', 'StorehouseSalesOrders.detailFields', ['订单编号', '客户名称', '默认仓库', '商品数', '订单数量', '已分拣数', '待分拣数', '发货状态', '交付日期', '负责人']),
];

const storehouseIncomingMaterialFields: PrdField[] = [
  field('客户/来料分类树', 'StorehouseIncomingMaterial.treeNodes', '左侧按客户与分类筛选来料台账。', '树和客户选择器来自当前页面 customer/material rows。'),
  ...exactPageFields('来料管理列表', 'StorehouseIncomingMaterial.columns', ['台账编号', '物料名称', '物料编码', '规格型号', '物料分类', '归属客户', '单位', '库存数量', '冻结数量', '占用数量', '可用数量', '状态', '操作']),
  field('新增来料入库', 'StorehouseIncomingMaterial.isCreateMode', 'action=new 时进入来料入库表单。', '表单顶部动作为取消、重置、暂存、确认入库。'),
  ...exactPageFields('来料入库明细', 'StorehouseIncomingMaterial.incomingLineColumns', ['来源单据', '来源明细', '物品编码', '物品名称', '规格型号', '单位', '入库数量', '入库库位', '过账状态']),
  field('详情Tab', 'StorehouseIncomingMaterial.tabs', '来料详情 Tab 为基本信息、出入库明细、库存分布、操作记录。', 'Tab 通过 AwDetailTabs 切换。'),
  field('详情动作', 'StorehouseIncomingMaterial.detailActions', '来料详情动作为导出明细、归属调整。', '动作来自当前页面 detailActions。'),
  field('批量动作', 'StorehouseIncomingMaterial.bulkActions', '列表批量动作为批量冻结、批量导出。', '动作来自当前页面 bulkActions。'),
];

const productionListFields = (pageTitle: string, names: string[]): PrdField[] => [
  field('全局搜索', 'ProductionResourcePage.AwListToolbar.searchPlaceholder', `工具栏搜索框，提示“全局搜索（如${names[0]}、${names[1]}、产品名称...）”。`, '搜索主题、编号、来源、产品、责任对象和状态。'),
  ...exactPageFields(pageTitle, 'ProductionResourcePage.columns', names),
  field('批量操作', 'ProductionResourcePage.bulkActions', `${pageTitle}批量动作。`, '当前页面提供批量操作入口。'),
  field('筛选', 'ProductionResourcePage.columnFilters.statusName', `${pageTitle}状态列筛选。`, '只按当前列表真实状态值筛选。'),
  field('字段配置', 'ProductionResourcePage.toolbar.columns', `${pageTitle}字段配置入口。`, '字段配置入口已接入列表母版。'),
];

const productionDemandCreateFields: PrdField[] = [
  ...exactPageFields('新增生产需求基础信息', 'ProductionCreate.demand.baseInfo', ['需求主题', '需求编号', '需求日期', '紧急程度']),
  field('产品明细', 'createLineColumns.demand', '生产需求产品明细表。', '字段为来源类型、来源单据、来源明细、产品编号、产品名称、规格型号、单位、需求数量、需求日期、备注、操作。'),
  field('附件', 'AwAttachmentTable', '生产需求附件子表。', '附件类型为生产图纸、工艺卡、生产说明、委外协议、审批材料。'),
  field('需求详情', 'AwRichTextEditor', '需求详情富文本编辑区。', '填写生产要求、工艺说明、齐套要求、交付约束和异常处理规则。'),
  field('选择产品弹窗', 'AwOptionPickerModal', '新增明细时打开的产品选择弹窗。', '字段为产品编号、产品名称、规格型号、产品分类、单位、库存、默认供应商。'),
  ...exactPageFields('新增生产需求顶部动作', 'ProductionCreate.actions', ['重置', '暂存', '确定']),
];

const productionDemandListFields = productionListFields('生产需求列表', ['需求主题', '需求编号', '来源单据', '产品概要', '需求数量', '开始日期', '交付日期', '责任部门', '需求状态', '操作']);

const productionDemandSummaryFields: PrdField[] = [
  field('全局搜索', 'ProductionDemandSummaryPage.keyword', '汇总页搜索框。', '搜索产品编号、产品名称、状态和来源单据。'),
  ...exactPageFields('生产需求汇总', 'ProductionDemandSummaryPage.columns', ['产品编号', '产品名称', '规格型号', '单位', '需求来源数', '需求数量', '已生产', '还需生产', '交付日期', '状态', '操作']),
  field('需求数量与来源列表', 'ProductionDemandSummaryPage.sourceColumns', '点击查看后的来源明细表。', '字段为序号、来源单据、来源类型、来源对象、来源明细、需求数量、已生产、还需生产、交付日期、状态。'),
  field('返回生产需求列表', 'ProductionDemandSummaryPage.back', '顶部返回按钮。', '未选中明细时返回生产需求列表；选中产品时返回汇总列表。'),
];

const productionPlanCreateFields: PrdField[] = [
  ...exactPageFields('新增生产计划基础信息', 'ProductionCreate.plan.baseInfo', ['计划主题', '计划编号', '生产来源', '来源主体', '来源交付日期', '计划开始日期', '计划完成日期', '优先级']),
  field('产品明细', 'createLineColumns.plan', '生产计划产品明细表。', '字段为来源类型、来源单据、来源明细、产品编号、产品名称、规格型号、单位、需求数量、计划数量、计划开工、计划完工、备注、操作。'),
  field('附件', 'AwAttachmentTable', '生产计划附件子表。', '附件类型为生产图纸、工艺卡、生产说明、委外协议、审批材料。'),
  field('计划详情', 'AwRichTextEditor', '计划详情富文本编辑区。', '填写生产要求、齐套要求、交付约束和异常处理规则。'),
  field('选择生产计划来源', 'AwSourcePickerModal', '计划来源选择弹窗。', '来源类型为生产需求、销售订单、库存备货。'),
  field('选择产品弹窗', 'AwOptionPickerModal', '新增明细时打开的产品选择弹窗。', '字段为产品编号、产品名称、规格型号、产品分类、单位、库存、默认供应商。'),
  ...exactPageFields('新增生产计划顶部动作', 'ProductionCreate.actions', ['重置', '暂存', '确定']),
];

const productionPlanListFields = productionListFields('生产计划列表', ['计划主题', '计划编号', '来源单据', '产品概要', '计划数量', '进度', '开始日期', '交付日期', '责任部门', '计划状态', '操作']);

const productionOrderCreateFields: PrdField[] = [
  ...exactPageFields('新增生产订单基础信息', 'ProductionCreate.order.baseInfo', ['生产主题', '生产编号', '生产来源', '来源主体', '来源交付日期', '生产部门', '计划开始日期', '计划完成日期', '优先级', '生产产品', '生产数量']),
  field('工单明细', 'createLineColumns.order', '生产订单工单明细表。', '字段为工单编号、工单类型、工单名称、半成品/成品、工序、工位/产线、计划数量、负责人、质检方案、操作。'),
  field('BOM明细', 'orderBomColumns', '生产订单 BOM 明细 Tab。', '字段为层级、物料编码、物料名称、规格型号、单位、单位用量、需求数量、损耗率、供应方式。'),
  field('工艺流程', 'orderProcessColumns', '生产订单工艺流程 Tab。', '字段为工序号、工序名称、工序类型、工位/产线、作业标准、计划开工、计划完工、负责人。'),
  field('BOM/工艺锁版', 'renderOrderVersionLockBar', 'BOM 与工艺版本选择、编辑和锁版控件。', '锁版后对应明细不可继续编辑。'),
  field('附件', 'AwAttachmentTable', '生产订单附件子表。', '附件类型为生产图纸、工艺卡、生产说明、委外协议、审批材料。'),
  field('详情', 'AwRichTextEditor', '生产订单详情富文本编辑区。', '填写生产要求、工艺说明、齐套要求、交付约束和异常处理规则。'),
  field('选择生产订单来源', 'AwSourcePickerModal', '生产订单来源选择弹窗。', '来源类型为生产需求、生产计划。'),
  field('选择生产车间/产线', 'AwCategoryPickerModal', '生产部门选择弹窗。', '按总装车间、焊接车间、机加工车间及产线选择。'),
  ...exactPageFields('新增生产订单顶部动作', 'ProductionCreate.actions', ['重置', '暂存', '确定']),
];

const productionOrderListFields = productionListFields('生产订单列表', ['生产主题', '生产编号', '来源单据', '产品概要', '计划数量', '开始日期', '交付日期', '责任部门', '生产状态', '操作']);

const productionWorkOrderCreateFields: PrdField[] = [
  ...exactPageFields('新增生产工单基础信息', 'ProductionCreate.work.baseInfo', ['工单主题', '工单编号', '生产部门', '计划开始日期', '计划完成日期', '优先级', '选择产品']),
  field('工艺流程', 'createLineColumns.work', '生产工单工艺流程表。', '字段为工序号、工序名称、工序类型、工位/产线、计划数量、作业标准、计划开工、计划完工、报工模式、操作。'),
  field('统一报工模式', 'renderDispatchModeHeader', '工艺流程表头下拉控件。', '选项为领工模式、派工模式、自由模式。'),
  field('附件', 'AwAttachmentTable', '生产工单附件子表。', '附件类型为生产图纸、工艺卡、生产说明、委外协议、审批材料。'),
  field('工单详情', 'AwRichTextEditor', '工单详情富文本编辑区。', '填写作业要求、工艺说明、质检要求和异常处理规则。'),
  field('选择产品弹窗', 'AwOptionPickerModal', '选择产品按钮打开的产品弹窗。', '字段为产品编号、产品名称、规格型号、产品分类、单位、库存、默认供应商。'),
  field('选择生产车间/产线', 'AwCategoryPickerModal', '生产部门选择弹窗。', '按车间和产线选择并回填工位/产线。'),
  ...exactPageFields('新增生产工单顶部动作', 'ProductionCreate.actions', ['重置', '暂存', '确定']),
];

const productionWorkOrderListFields = productionListFields('生产工单列表', ['工单主题', '工单编号', '来源单据', '产品概要', '计划数量', '开始日期', '交付日期', '工厂车间', '产线', '负责人', '工单状态', '操作']);

const productionDispatchFields: PrdField[] = [
  field('领工任务池', 'WorkOrderDispatchPage.poolColumns', '领工派工页 Tab。', '表格字段为工单编号、产品名称、工序名称、计划数量、已领数量、可领数量、工位/产线、计划开工、任务状态、操作。'),
  field('派工列表', 'WorkOrderDispatchPage.assignedColumns', '领工派工页 Tab。', '表格字段为工单编号、产品名称、工序名称、分派人员、分派数量、已报工、待报工、工位/产线、分派人、任务状态、操作。'),
  field('全局搜索', 'WorkOrderDispatchPage.AwListToolbar', '搜索框提示“全局搜索（如工单编号、产品名称、负责人...）”。', '搜索任务池或派工列表当前行数据。'),
  field('批量操作', 'WorkOrderDispatchPage.bulkActions', '表格批量操作入口。', '按当前 Tab 勾选记录处理。'),
  field('领工/派工详情弹窗', 'WorkOrderDispatchDetailModal', '查看操作打开的详情弹窗。', '展示任务指标、领工明细或派工明细，并提供领工、报工入口。'),
];

const productionReportFields: PrdField[] = [
  ...exactPageFields('任务报工', 'WorkOrderReportPage.form', ['生产工单', '报工来源', '报工工序', '报工人', '报工数量', '合格数量', '不良数量', '工位/产线', '报工时间']),
  field('本工单进度', 'WorkOrderReportPage.progressTable', '任务报工页进度表。', '字段为序号、产品、工序、来源方式、责任人员、计划数量、已领/已派、已报工、本次报工、累计完成、剩余可报、状态。'),
  field('报工说明', 'AwRichTextEditor', '报工说明富文本编辑区。', '填写异常说明、不良原因、设备状态、交接事项等。'),
  ...exactPageFields('任务报工顶部动作', 'WorkOrderReportPage.actions', ['暂存', '确定']),
];

const productionReportRecordFields: PrdField[] = [
  ...exactPageFields('报工记录', 'WorkOrderReportRecordPage.columns', ['工单编号', '产品名称', '工序名称', '生产部门', '报工人', '报工来源', '计划数量', '可报数量', '累计报工', '合格', '不良', '报工次数', '最后报工时间', '状态', '操作']),
  field('我的报工/管理员视图', 'WorkOrderReportRecordPage.roleTabs', '报工记录视图切换。', '我的报工只显示当前报工人；管理员视图支持按人员筛选。'),
  field('日期范围', 'WorkOrderReportRecordPage.start/end', '报工记录日期筛选。', '提供开始日期、结束日期、昨天、今天快捷按钮。'),
  field('选择报工人员弹窗', 'WorkOrderReportPersonModal', '管理员视图下选择报工人员。', '字段为选择、姓名、工号、部门、产线/班组、岗位。'),
  field('工序报工明细弹窗', 'WorkOrderReportDetailModal', '点击查看打开明细弹窗。', '明细表字段为序号、报工单号、报工批次、报工人、本次报工、合格、不良、返工、报工时间、状态。'),
];

const productionOutsourceCreateFields: PrdField[] = [
  ...exactPageFields('新增委外加工基础信息', 'ProductionCreate.outsource.baseInfo', ['委外主题', '委外编号', '来源主体', '来源交付日期', '优先级', '委外方式', '委外加工商', '发料方式']),
  field('委外明细', 'createOutsourceColumns', '委外明细表。', '整单委外字段为来源单据、产品编号、产品名称、规格型号、BOM版本、BOM锁版、工艺路线、工艺锁版、源单需求数量、委外数量、单位、成本费用、计划交付、备注；工序委外字段替换为工序编号、工序名称、工序类型、工位/产线。'),
  field('合计', 'ProductionCreate.totalQuantity/totalAmount', '委外明细汇总。', '展示总数量和委外金额。'),
  field('附件', 'AwAttachmentTable', '委外附件子表。', '附件类型为生产图纸、工艺卡、生产说明、委外协议、审批材料。'),
  field('详情', 'AwRichTextEditor', '委外详情富文本编辑区。', '填写委外要求、质量要求、交付约束和异常处理规则。'),
  field('选择委外加工来源', 'AwSourcePickerModal', '委外来源选择弹窗。', '来源类型为生产订单、生产工单，支持选择多个工单或工序。'),
  field('委外加工商弹窗', 'SupplierPickerModal', '选择委外加工供应商。', '确认后回填委外加工商。'),
  field('委外方式弹窗', 'OutsourceScopeModal', '选择整单委外、工单委外或工序委外。', '确认后重建委外明细。'),
  ...exactPageFields('新增委外加工顶部动作', 'ProductionCreate.actions', ['重置', '暂存', '确定']),
];

const productionOutsourceListFields = productionListFields('委外加工列表', ['委外主题', '委外编号', '来源单据', '产品概要', '计划数量', '开始日期', '交付日期', '加工商', '委外状态', '操作']);

const productionDetailFields = detailPageFields(
  '生产需求详情',
  'src/views/production/ProductionResourcePage.vue detailTabs.production-demands',
  ['基本信息', '产品明细', '操作记录'],
  ['需求主题', '需求编号', '来源单据', '产品概要', '需求数量', '开始日期', '交付日期', '责任部门', '需求状态'],
  ['确认需求', '提交确认', '编辑', '删除', '关闭', '打印', '导出'],
);

const productionPlanDetailFields = detailPageFields(
  '生产计划详情',
  'src/views/production/ProductionResourcePage.vue detailTabs.production-plans',
  ['计划信息', '产品明细', '来源记录', '齐套预估', '排产记录', '操作记录'],
  ['计划主题', '计划编号', '来源单据', '产品概要', '计划数量', '开始日期', '交付日期', '责任部门', '计划状态'],
  ['审核', '启动计划', '编辑', '关闭', '打印', '导出'],
);

const productionOrderDetailFields = detailPageFields(
  '生产订单详情',
  'src/views/production/ProductionResourcePage.vue detailTabs.production-orders',
  ['工单信息', '工单明细', '来源记录', '版本锁定', '齐套检查', '工序进度', '领料记录', '退料记录', '成品入库记录', '工单执行记录', '质检记录', '操作记录'],
  ['生产主题', '生产编号', '来源单据', '产品概要', '计划数量', '开始日期', '交付日期', '责任部门', '生产状态'],
  ['释放工单', '编辑', '关闭', '打印', '导出'],
);

const productionWorkOrderDetailFields = detailPageFields(
  '生产工单详情',
  'src/views/production/ProductionResourcePage.vue detailTabs.production-work-orders',
  ['工单信息', '工艺流程', '领工派工', '领料记录', '报工记录', '质检记录', '退料记录', '入库记录', '操作记录'],
  ['工单主题', '工单编号', '来源单据', '产品概要', '计划数量', '工厂车间', '产线', '负责人', '工单状态'],
  ['领工派工', '任务报工', '关闭', '打印', '导出'],
);

const productionOutsourceDetailFields = detailPageFields(
  '委外加工详情',
  'src/views/production/ProductionResourcePage.vue detailTabs.outsource-orders',
  ['委外加工信息', '委外明细', '委外发料', '委外收货', '质检记录', '入库记录', '操作记录'],
  ['委外主题', '委外编号', '来源单据', '产品概要', '计划数量', '加工商', '开始日期', '交付日期', '委外状态'],
  ['委外发料', '委外收货', '编辑', '关闭', '打印', '导出'],
);

const productionScheduleListFields: PrdField[] = [
  ...exactPageFields('生产排班统计', 'ProductionSchedulePage.scheduleStats', ['本周计划工时', '冲突提醒', '待审批计划', '加班工时']),
  field('车间分组', 'ProductionSchedulePage.rosterWorkshop', '排班列表左侧车间分组树。', '按全部车间及各车间筛选排班行。'),
  field('搜索', 'rosterKeyword', '搜索框提示“搜索姓名、工号、班组、技能、工位”。', '搜索排班表员工行。'),
  ...exactPageFields('排班列表工具栏', 'ProductionSchedulePage.rosterToolbar', ['周视图/月视图', '批量调班', '新增排班']),
  ...exactPageFields('当前计划摘要', 'ProductionSchedulePage.activePlan', ['当前计划', '循环模式', '参考日历', '周期', '覆盖率']),
  field('排班表', 'ProductionSchedulePage.rosterTable', '排班网格。', '表头为员工、工号、班组、工位/产线、技能资质、本周工时、来源，以及每个排班日期。'),
  field('本周工时合计', 'ProductionSchedulePage.rosterTotalHours', '排班列表底部汇总。', '展示本周工时合计、各班次数量和休息天数。'),
];

const productionSchedulePlanFields: PrdField[] = [
  field('搜索', 'planKeyword', '搜索框提示“搜索计划编号、计划名称、适用班组”。', '搜索排班计划行。'),
  ...exactPageFields('排班计划工具栏', 'ProductionSchedulePage.planToolbar', ['发布', '归档', '冲突校验', '新增排班计划']),
  ...exactPageFields('排班计划列表', 'planHeaders', ['计划编号', '计划名称', '适用班组', '循环模式', '周期', '人数', '计划工时', '需求工时', '覆盖率', '冲突', '审批', '状态', '操作']),
  field('批量选择', 'selectedPlans', '排班计划勾选列和底部批量栏。', '支持全选、发布、归档。'),
  field('排班计划详情弹窗', 'planDetail modal', '点击计划名称或查看打开详情。', '展示基础字段、冲突校验、本期排班网格预览和策略设置。'),
];

const productionTeamFields: PrdField[] = [
  field('车间分组', 'ProductionSchedulePage.activeWorkshop', '生产班组左侧车间分组树。', '按车间筛选班组卡片。'),
  field('搜索', 'teamKeyword', '搜索框提示“搜索班组名称、班组长、技能方向”。', '搜索班组卡片。'),
  ...exactPageFields('生产班组工具栏', 'ProductionSchedulePage.teamToolbar', ['导出', '新建班组']),
  ...exactPageFields('班组卡片', 'ProductionSchedulePage.teamRows', ['班组名称', '班次模式', '所属车间/产线', '班组长', '技能方向', '成员', '产能', '需求', '到岗率']),
  field('班组人员弹窗', 'teamDetail modal', '点击班组卡片打开班组人员。', '展示班组编码、成员、技能、排班模式和班组指标。'),
];

const productionCalendarFields: PrdField[] = [
  field('搜索', 'calendarKeyword', '搜索框提示“搜索日历名称、适用范围”。', '搜索工作日历下拉候选。'),
  ...exactPageFields('工作日历工具栏', 'ProductionSchedulePage.calendarToolbar', ['工作日历选择', '月份选择', '同步法定节假日', '编辑工作日历', '新增工作日历']),
  ...exactPageFields('工作日历摘要', 'ProductionSchedulePage.currentCalendar', ['日历名称', '适用范围', '工作制', '继承日历', '节假日规则', '调班规则']),
  field('例外日', 'calendarExceptions', '日历例外日列表。', '展示日期、节假日/调班类型和说明。'),
  field('日历网格', 'calendarDayCells', '月历网格。', '按工作日、休息日、节假日、调班展示。'),
  field('日历汇总', 'calendarTotals', '月度日历汇总。', '展示工作日、休息日、节假日和调班天数。'),
];

const productionShiftFields: PrdField[] = [
  field('搜索', 'shiftKeyword', '搜索框提示“搜索班次编码、班次名称、起止时间”。', '搜索班次卡片。'),
  ...exactPageFields('班次管理工具栏', 'ProductionSchedulePage.shiftToolbar', ['批量停用', '导出', '新增班次']),
  ...exactPageFields('班次卡片', 'ProductionSchedulePage.shiftRows', ['班次编码', '班次名称', '状态', '起止时间', '工时', '休息时间', '跨天/当日', '倍率', '打卡窗口', '系统预置/自定义', '编辑']),
  field('新增/编辑班次弹窗', 'shift modal', '新增或编辑班次时打开的弹窗。', '字段为班次编码、班次名称、开始时间、结束时间、工时、休息、倍率、跨天、颜色、状态。'),
];

const afterSalesServiceCreateFields: PrdField[] = [
  ...exactPageFields('新增售后受理流程', 'AfterSalesServiceCreate.flowSteps', ['选择客户', '选择类型', '选择来源', '问题证据', '提交']),
  ...exactPageFields('选择客户', 'AfterSalesServiceCreate.customer', ['客户名称', '客户类别', '销售经理', '联系人', '联系电话', '收货地址']),
  ...exactPageFields('选择售后类型', 'afterSalesTypeCards/afterSalesTypeHandlingMap', ['售后类型', '处理方式']),
  ...exactPageFields('选择主题 / 来源', 'AfterSalesServiceCreate.sourceFields', ['售后主题', '来源分类', '订单号/项目编号', '来源单据', '来源订单', '发货/交付批次', '发货/交付日期', '批次状态', '来源日期']),
  field('来源产品', 'AfterSalesServiceCreate.productRows', '售后产品明细表。', '表头必须为选择、序号、来源明细、产品编号、产品名称、规格型号、物料类型、物料分类、单位、实供数量、已售后、可售后、本次售后数量、问题原因、投诉问题。'),
  field('证据附件', 'AfterSalesServiceCreate.attachmentRows', '售后证据附件子表。', '附件类型为图片附件、视频附件、PDF附件、检测报告、物流凭证、沟通记录。'),
  field('售后详情', 'AfterSalesServiceCreate.description', '售后问题描述富文本。', '填写客户诉求、沟通记录、现场情况或补充说明。'),
  field('提交前预览', 'AfterSalesServiceCreate.preview', '提交前只读预览区。', '展示售后主题、客户、售后类型、处理方式、来源分类、来源单据、来源订单、发货/交付、批次状态和产品行数。'),
  field('选择客户弹窗', 'AfterSalesServiceCreate.customerRows', '选择客户弹窗。', '左侧客户分组为全部客户、重点客户、渠道客户、项目客户、长期客户；表格字段为选择、客户名称、客户分组、联系人、客户经理、联系方式。'),
  field('选择售后来源弹窗', 'AwSourcePickerModal', '选择售后来源弹窗。', '按当前客户选择订单、项目或客户来源，并回填来源单据、批次和产品。'),
  ...exactPageFields('新增售后顶部动作', 'AfterSalesServiceCreate.formActions', ['重置', '提交']),
];

const afterSalesServiceListFields: PrdField[] = [
  field('全局搜索', 'AfterSalesServiceList.AwListToolbar.searchPlaceholder', '工具栏搜索框，提示“搜索售后主题/单号/客户/来源单据”。', '搜索售后主题、单号、客户、来源订单、来源发货单和负责人。'),
  ...exactPageFields('售后列表', 'serviceColumns', ['售后主题', '售后单号', '客户', '来源订单', '来源发货单', '售后类型', '处理方式', 'SLA', '结单确认', '优先级', '负责人', '提交时间', '售后状态', '操作']),
  ...exactPageFields('售后列表批量动作', 'serviceBulkActions', ['批量指派', '批量导出']),
  field('表头筛选', 'AfterSalesServiceList.columnFilters', '表格列筛选。', '当前可筛选售后类型、优先级和售后状态。'),
];

const afterSalesServiceDetailFields = detailPageFields(
  '售后详情',
  'src/views/after-sales/AfterSalesServiceDetail.vue',
  ['基本信息', '售后产品明细', '关联单据', 'SLA/流程进度', '沟通记录', '附件', '操作记录'],
  ['售后类型', '处理方式', '客户', '客户联系人', '收货地址', '来源订单', '来源发货单', '来源明细', '可售后数量', '可退金额', '结单确认', '问题原因', '投诉问题', '优先级', '质量联动', '负责人', '创建时间', 'SLA', '问题说明'],
  ['处理意见', '单据审核', '结单确认', '升级/查看质量', '打印/导出', '编辑', '删除'],
);

const afterSalesTaskFields = (title: string, withMineResult = false): PrdField[] => [
  field('售后类型树', 'AfterSalesTaskList.categories', `${title}左侧售后类型树。`, '节点为全部任务、退款退货、仅退款、换货、仅退货、维修处理、现场服务。'),
  field('全局搜索', 'AfterSalesTaskList.AwListToolbar.searchPlaceholder', '工具栏搜索框，提示“搜索售后主题/售后单/客户”。', '搜索售后主题、售后单号、客户、来源订单、来源发货单和负责人。'),
  ...exactPageFields(title, 'AfterSalesTaskList.taskPoolColumns', [
    '售后主题', '售后单号', '客户', '来源订单', '来源发货单', '售后类型', '处理方式', 'SLA', '结单确认', '优先级',
    '责任人', '提交时间', ...(withMineResult ? ['处理结果'] : []), '售后状态', '操作',
  ]),
  field('详情 Tab', 'AfterSalesTaskList.detailTabs', '点击查看进入任务详情。', '详情 Tab 为当前处理动作、关联售后单、关联单据、回写记录、结单确认。'),
  field('推进处理', 'AfterSalesTaskList.advanceTask', '任务详情动作按钮。', '仅任务未完成时展示，确认后推进派生单据状态并回写售后单。'),
];

const afterSalesQualityFields: PrdField[] = [
  field('质量闭环树', 'AfterSalesQualityList.stages', '左侧质量闭环阶段树。', '节点为全部质量闭环、D1组建团队、D4根因分析、CAPA执行、效果验证、已关闭。'),
  field('全局搜索', 'AfterSalesQualityList.AwListToolbar.searchPlaceholder', '工具栏搜索框，提示“搜索质量主题/售后单/客户”。', '搜索质量主题、改进单号、来源售后单和客户。'),
  ...exactPageFields('质量闭环列表', 'qualityColumns', ['改进单号', '质量主题', '来源售后单', '客户/来源', '问题类型', '当前阶段', '8D编号', 'CAPA编号', '负责人', '状态', '操作']),
  field('详情 Tab', 'AfterSalesQualityList.detailTabs', '点击质量主题进入质量闭环详情。', '详情 Tab 为问题描述、8D报告、CAPA措施、验证关闭、关联售后单、操作记录。'),
  field('质量推进动作', 'AfterSalesQualityList.qualityActions', '详情页按状态展示推进按钮。', '待分析可提交根因分析或 CAPA，CAPA执行中可提交验证，已验证可关闭质量闭环。'),
];

const afterSalesSettingFields: PrdField[] = [
  ...exactPageFields('售后设置入口', 'AfterSalesServiceList.settingActionKeys/navigation', ['售后原因', '投诉问题', '售后类型', '处理方式', '保修政策', 'SLA 规则']),
  field('设置字段', 'AfterSalesSettingPage', '售后配置项字段。', '按配置名称、配置说明、启用状态、适用范围和排序维护。'),
  field('保存配置', 'AfterSalesSettingPage.save', '售后设置保存动作。', '只影响后续售后新增、分类、SLA 和处理方式校验。'),
];

const routeReuseFields = (title: string, route: string, target: string): PrdField[] => [
  field('导航名称', 'src/layouts/erp-shell/navigation.ts', `${title}是当前导航入口。`, '按原始业务导航展示，作为进入对应报表或列表视图的入口。'),
  field('页面路由', route, `点击进入 ${route}。`, `当前路由复用${target}展示，总览内容按目标页面口径呈现。`),
  field('展示内容', target, `当前显示内容来自${target}。`, '记录当前可见字段和跳转关系，独立报表或列表建设时延续该业务口径。'),
];

const qcInspectionCreateFields: PrdField[] = [
  ...exactPageFields('新增检验任务步骤', 'QcResourcePage.qcCreateStep', ['选择质检类型', '填写来源信息', '质检明细']),
  ...exactPageFields('选择质检类型', 'qcCreateTypeCards', ['来料检验', '过程检验', '成品检验', '出货检验']),
  ...exactPageFields('质检来源信息', 'createBaseFormFields', ['质检主题', '质检单号', '检验阶段', '送检人', '来源单据', '检验对象', '批次/样本', '检验员', '批次号', '质检方案', '抽样规则', '关键控制点']),
  field('产品明细', 'qcProductDetailColumns', '新增检验任务产品明细表。', '表头为产品编码、产品名称、规格型号、单位、数量、质检方案、备注。'),
  field('质检详情', 'QcResourcePage.detailText', '质检要求富文本。', '填写质检要求、检验说明、注意事项或补充描述。'),
  field('选择质检来源弹窗', 'AwSourcePickerModal', '选择质检来源弹窗。', '来源类别和行数据来自 qcSourceCategories、qcSourceRows、qcSourceBatches。'),
  field('选择质检方案弹窗', 'planColumns', '选择质检方案弹窗。', '字段为方案编号、方案名称、适用阶段、抽样规则、状态。'),
  field('选择产品/物料弹窗', 'productColumns', '选择产品/物料弹窗。', '字段为产品/物料编码、产品/物料名称、分类、规格型号、单位、默认方案。'),
  ...exactPageFields('新增检验任务顶部动作', 'formActions', ['保存草稿', '重置', '提交检验任务']),
];

const qcInspectionListFields: PrdField[] = [
  field('检验阶段树', 'QcResourcePage.qcExecutionStageGroups', '左侧检验阶段树。', '节点为来料检验 IQC、过程检验 IPQC、成品检验 FQC、出货检验 OQC。'),
  field('全局搜索', 'QcResourcePage.renderListView', '工具栏搜索框。', '搜索检验任务、质检单号、来源单据和检验对象。'),
  ...exactPageFields('检验任务列表', 'QcResourcePage.listColumns.execution', ['检验任务', '质检单号', '来源单据', '检验对象', '批次/样本', '检验员', '执行状态', '操作']),
  ...exactPageFields('批量动作', 'QcResourcePage.bulkActions', ['批量派工', '批量复检', '让步放行', '生成报告']),
];

const qcExceptionListFields: PrdField[] = [
  field('异常处理树', 'QcResourcePage.navigationGroups.exceptions', '左侧异常处理树。', '节点为全部异常处理、不合格记录、隔离/拒收、返工复检、让步放行。'),
  field('全局搜索', 'QcResourcePage.renderListView', '工具栏搜索框。', '搜索异常主题、异常单号、来源质检单和责任对象。'),
  ...exactPageFields('异常处理列表', 'QcResourcePage.listColumns.exceptions', ['异常主题', '异常单号', '异常类型', '来源质检单', '责任对象', '严重等级', '处置状态', '处理人', '登记日期', '操作']),
  field('处置动作', 'QcResourcePage.qcDetailActions.exceptions', '异常详情按状态展示处置动作。', '待处置可隔离/拒收、MRB评审、发起复检、让步放行；后续按真实状态推进。'),
];

const qcReportFields: PrdField[] = [
  field('质检分析树', 'QcResourcePage.navigationGroups.reports', '左侧质检分析树。', '节点为质量趋势、不良分析、供应商质量、工序质量。'),
  ...exactPageFields('质检分析列表', 'QcResourcePage.listColumns.reports', ['分析主题', '报表编号', '分析类型', '统计范围', '合格率', '不良率', '报表状态', '操作']),
  field('生成报表', 'QcResourcePage.qcDetailActions.reports', '报表详情动作。', '未生成可生成报表，已生成可确认报表，已确认只读导出。'),
];

const qcPlanFields: PrdField[] = [
  ...exactPageFields('质检方案列表', 'QcResourcePage.listColumns.qcPlan', ['方案名称', '方案编号', '适用阶段', '适用对象', '质检组', '质检标准', '抽样规则', '版本', '维护人', '更新时间', '方案状态', '操作']),
  field('质检方案表单', 'createBaseFormFields.qcPlan', '新增/编辑质检方案基础字段。', '字段为质检方案名称、质检方案编号、适用阶段、适用对象、版本号、抽样规则。'),
  field('质检组明细', 'planGroupColumns', '方案关联质检组表。', '字段为质检组名称、质检组编号、检验阶段、组长、授权范围、班次、状态。'),
  field('质检标准明细', 'groupStandardColumns', '方案关联标准表。', '字段为标准名称、标准编号、适用类型、判定类型、标准类型、基准单位、基准、标准值、上差值、下差值、标准状态。'),
];

const qcTeamFields: PrdField[] = [
  ...exactPageFields('质检组列表', 'QcResourcePage.listColumns.standards.group', ['配置名称', '配置编号', '配置类型', '适用范围', '版本/规则', '维护人', '配置状态', '操作']),
  field('质检组基础', 'createBaseFormFields.qcGroup', '质检组表单基础字段。', '字段为质检组名称、质检组编号、检验阶段。'),
  field('质检组标准', 'groupStandardColumns', '质检组关联标准表。', '字段为标准名称、标准编号、适用类型、判定类型、标准类型、基准单位、基准、标准值、上差值、下差值、标准状态。'),
  field('附件', 'AwAttachmentTable', '质检组附件。', '附件用于维护授权说明、标准文件和审批材料。'),
];

const qcStandardFields: PrdField[] = [
  ...exactPageFields('质检标准列表', 'QcResourcePage.listColumns.qcStandard', ['标准名称', '标准编号', '适用类型', '判定类型', '标准类型', '基准单位', '基准', '标准值', '上差值', '下差值', '维护人', '更新时间', '标准状态', '操作']),
  ...exactPageFields('标准基础', 'renderStandardCreateView.standardCreateForm', ['标准名称', '标准编号', '适用类型', '判定类型']),
  field('检测标准', 'standardCriteriaColumns', '检测标准可编辑表。', '数值判定表头为名称、标准类型、基准单位、基准、标准值、上差值、下差值；文本判定表头为名称、标准类型、标准描述。'),
  field('附件', 'standardAttachmentRows', '质检标准附件。', '附件类型为标准文件、检验规范、图纸附件、审批材料。'),
  field('标准详情', 'standardDetailText', '标准详情富文本。', '填写标准适用范围、检验依据、判定要求和版本说明。'),
];

const qcExecutionFields = detailPageFields(
  '执行质检',
  'src/views/qc/QcResourcePage.vue action=execute',
  ['任务信息', '检验方案', '检验项目', '质检结果', '异常处置'],
  ['质检主题', '质检单号', '检验阶段', '来源单据', '检验对象', '批次/样本', '检验员', '抽样规则', '检验项目', '实测值/现象', '缺陷等级', '判定结果', '产品判定', '异常处理方式'],
  ['重置', '暂存', '提交质检结果'],
  [
    field('执行入口', 'QcResourcePage.detailActions.execute', '列表或详情中状态为待报检、抽样中、巡检中、待判定、待出货检验、返工待复检时显示“执行质检”。', '点击后进入当前路径 action=execute&id={id}。'),
  ],
);

const hrFormDetailFields: PrdField[] = [
  field('联系人信息', 'HrCreatePage.contactColumns', '人事明细 Tab。', '字段为联系人、联系方式、关系、邮箱、备注。'),
  field('银行卡', 'HrCreatePage.financeColumns', '人事明细 Tab。', '字段为银行卡号、账户名称、开户行、备注。'),
  field('通信地址', 'HrCreatePage.addressColumns', '人事明细 Tab。', '字段为详细地址。'),
  field('附件信息', 'HrCreatePage.attachments', '人事附件 Tab。', '附件类型为荣誉证书、学历证书、学位证书、资格证书、培训证书、身份证件、体检报告、入职材料。'),
  field('人事说明', 'HrCreatePage.remark', '人事说明富文本。', '保存草稿或提交审批时写入备注说明。'),
  ...exactPageFields('人事表单顶部动作', 'HrCreatePage.formActions', ['保存草稿', '提交审批']),
];

const hrCreateFields = (pageTitle: string, source: string, names: string[]): PrdField[] => [
  ...exactPageFields(`${pageTitle}基础表单`, source, names),
  ...hrFormDetailFields,
];

const hrListFields = (pageTitle: string, source: string, names: string[], statusLabel: string): PrdField[] => [
  field('全局搜索', 'HrListView.AwListToolbar.searchPlaceholder', `工具栏搜索框，按${pageTitle}主题、编号和负责人搜索。`, '搜索字段来自当前模块配置。'),
  ...exactPageFields(pageTitle, source, [...names, statusLabel, '操作']),
  ...exactPageFields(`${pageTitle}批量动作`, 'HrListView.bulkActions', ['批量提交', '批量审批', '批量停用']),
];

const hrActionFields = (pageTitle: string, source: string, names: string[], statusLabel: string): PrdField[] => [
  field('全局搜索', 'HrActionList.searchPlaceholder', `工具栏搜索框，按${pageTitle}、编号和负责人搜索。`, '搜索当前动作页行数据。'),
  ...exactPageFields(pageTitle, source, [...names, statusLabel, '操作']),
  field('左侧树', 'HrActionList.treeNodes', '动作页左侧筛选树。', '员工/考勤类按组织筛选，档案类按分类筛选，其余按状态筛选。'),
];

const hrDetailFields = detailPageFields(
  '人力详情',
  'src/views/hr/components/HrDetailPage.vue',
  ['基础信息', '明细信息', '流程记录', '附件', '操作记录'],
  ['主题', '编号', '所属部门', '岗位/职级', '人员', '日期', '处理状态', '审批流程', '说明'],
  ['提交审批', '审核', '编辑', '删除', '导出'],
  [
    field('员工档案详情', 'src/views/hr/components/HrEmployeeArchiveDetailPage.vue', '员工档案入口使用独立详情组件。', 'Tab 为基础信息、合同记录、履历记录、培训记录、证照附件、操作记录；员工档案编辑使用 action=员工档案编辑&id={id}。'),
    field('岗位说明书', 'src/views/hr/components/HrJobDescriptionCreatePage.vue', '岗位说明书是岗位模块的独立动作页。', '按岗位职责、任职资格、汇报关系和附件维护。'),
    field('办公申请详情', 'src/views/hr/components/HrOfficeApplicationCreatePage.vue', '办公申请保存后回到 /hr/office?id={id} 详情。', '按办公用品、会议室、公告等当前办公模块类型展示。'),
  ],
);

const hrEmployeeCreateFields = hrCreateFields('新增员工', 'hrModuleConfigs.employees.formFields', ['员工姓名', '员工编号', '所属部门 / 岗位/职级', '入职日期', '员工状态', '性别', '手机号码', '员工类型', '直属上级', '转正日期', '合同类型', '办公地点', '邮箱']);
const hrAttendanceCreateFields = hrCreateFields('新增考勤', 'hrModuleConfigs.attendance.formFields', ['考勤主题', '考勤单号', '考勤人员', '异常类型', '考勤日期', '处理状态', '所属部门', '班次', '上班打卡', '下班打卡', '处理方式', '审批流程']);
const hrScheduleCreateFields = hrCreateFields('新增排班', 'hrModuleConfigs.schedules.formFields', ['排班主题', '排班编号', '考勤组', '班次', '排班日期', '排班状态', '适用人员', '排班周期', '生效日期', '失效日期', '休息规则', '审批流程']);
const hrOfficeCreateFields: PrdField[] = [
  ...exactPageFields('新增办公申请步骤', 'HrOfficeApplicationCreatePage.flowSteps', ['选择事项类型', '填写申请信息', '申请明细']),
  ...exactPageFields('事项类型卡片', 'HrOfficeApplicationCreatePage.officeTypeCards', ['证明开具', '物品领用', '用印申请', '用车申请']),
  ...exactPageFields('申请基础信息', 'HrOfficeApplicationCreatePage.form', ['申请主题', '申请单号', '申请人', '所属部门', '申请日期']),
  ...exactPageFields('证明开具字段', 'fieldMap.certificate', ['证明类型', '接收单位', '开具份数', '期望完成日期', '用途说明']),
  ...exactPageFields('物品领用字段', 'fieldMap.goods', ['领用物品', '规格型号', '领用数量', '期望领用日期', '领用原因']),
  ...exactPageFields('用印申请字段', 'fieldMap.seal', ['印章类型', '用印文件', '对方单位', '文件份数', '用印日期', '是否外带', '用印用途']),
  ...exactPageFields('用车申请字段', 'fieldMap.car', ['用车日期', '出发时间', '预计返回', '出发地', '目的地', '随行人数', '车辆需求', '用车事由']),
  field('附件', 'HrOfficeApplicationCreatePage.attachments', '申请附件表。', '附件类型为申请材料、审批附件、证明材料、其他。'),
  field('申请说明', 'HrOfficeApplicationCreatePage.remark', '申请说明富文本。', '用于填写办公申请补充说明。'),
  ...exactPageFields('办公申请动作', 'HrOfficeApplicationCreatePage.formActions', ['上一步', '下一步', '保存草稿', '提交审批']),
];

const hrAnnouncementFields: PrdField[] = [
  ...exactPageFields('发布公告表单', 'HrAnnouncementCreatePage.form', ['公告编号', '公告标题', '公告分类', '发布人', '发布范围', '重要程度', '生效日期', '失效日期', '发布状态']),
  field('附件', 'HrAnnouncementCreatePage.attachments', '公告附件表。', '附件类型为公告附件、制度文件、图片附件、其他。'),
  field('公告正文', 'HrAnnouncementCreatePage.content', '公告正文富文本。', '用于填写通知正文、制度内容或活动说明。'),
  ...exactPageFields('发布公告动作', 'HrAnnouncementCreatePage.formActions', ['保存草稿', '发布公告']),
];

const hrPayrollPlanFields: PrdField[] = [
  ...exactPageFields('薪资方案列表', 'HrPayrollStructurePage.schemeColumns', ['方案名称', '方案编码', '适用范围', '员工范围', '计薪周期', '状态', '操作']),
  ...exactPageFields('新增/编辑薪资方案', 'HrPayrollStructurePage.schemeForm', ['方案名称', '编码', '适用范围', '员工范围', '计薪周期', '币种', '生效日期', '负责人', '状态']),
];

const hrPayrollTypeFields: PrdField[] = [
  field('全局搜索', 'HrPayrollStructurePage.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如类型名称、编码、负责人）”。', '搜索当前薪酬类型行数据。'),
  ...exactPageFields('薪酬类型列表', 'HrPayrollStructurePage.typeColumns', ['类型名称', '所属方案', '类型编码', '收发方向', '计算口径', '发放时点', '负责人', '状态', '操作']),
  ...exactPageFields('新增/编辑薪酬类型', 'HrPayrollStructurePage.typeForm', ['所属方案', '类型名称', '类型编码', '收发方向', '计算口径', '发放时点', '负责人', '状态']),
  field('新增薪酬类型', 'HrPayrollStructurePage.addText', '新增按钮文案。', '点击后打开新增薪酬类型弹窗。'),
  field('字段配置/导入/导出', 'HrPayrollStructurePage.toolbarActions', '薪酬结构工具栏动作。', '支持刷新、筛选、字段配置、导入、导出和新增。'),
];

const hrPayrollItemFields: PrdField[] = [
  field('全局搜索', 'HrPayrollStructurePage.searchPlaceholder', '工具栏搜索框，提示“全局搜索（如项目名称、编码、负责人）”。', '搜索当前薪酬项目行数据。'),
  ...exactPageFields('薪酬项目列表', 'HrPayrollStructurePage.itemColumns', ['项目名称', '所属方案', '所属类型', '项目编码', '收发方向', '计算方式', '公式说明', '个税', '社保基数', '会计科目', '状态', '操作']),
  ...exactPageFields('新增/编辑薪酬项目', 'HrPayrollStructurePage.itemForm', ['所属类型', '项目名称', '项目编码', '收发方向', '计算方式', '公式说明', '个税', '社保基数', '会计科目', '状态']),
  field('新增薪酬项目', 'HrPayrollStructurePage.addText', '新增按钮文案。', '点击后打开新增薪酬项目弹窗。'),
  field('字段配置/导入/导出', 'HrPayrollStructurePage.toolbarActions', '薪酬结构工具栏动作。', '支持刷新、筛选、字段配置、导入、导出和新增。'),
];

const equipmentAssetCreateFields: PrdField[] = [
  ...exactPageFields('新增设备', 'EquipmentResourcePage.resetForm.assets', ['设备名称', '设备编号', '设备分类', '规格型号', '制造商', '所属车间', '所属产线', '责任部门', '责任人', '启用日期', '设备状态', '设备等级', '额定功率', '保养策略', '点检策略']),
  field('附件', 'EquipmentResourcePage.attachments', '设备附件子表。', '附件类型默认为设备附件。'),
  field('备注说明', 'EquipmentResourcePage.richText', '设备备注富文本。', '记录设备说明、安装要求或补充资料。'),
  field('设备分类弹窗', 'showEquipmentCategoryPicker', '选择设备分类弹窗。', '分类来自设备设置 - 设备分类。'),
  field('车间/产线弹窗', 'showWorkshopLinePicker', '选择车间和产线弹窗。', '按一车间、动力站、包装车间等分组回填。'),
];

const equipmentAssetListFields: PrdField[] = [
  field('设备分类树', 'EquipmentResourcePage.activeTree.assets', '左侧设备分类树。', '节点来自设备设置 - 设备分类。'),
  field('全局搜索', 'configs.assets.searchPlaceholder', '工具栏搜索框，提示“搜索设备名称、编号、分类、责任人”。', '搜索设备台账当前行数据。'),
  ...exactPageFields('设备档案', 'configs.assets.columns', ['设备编号', '设备名称', '设备分类', '规格型号', '所属车间/产线', '责任人', '设备状态', '最近点检', '最近保养', '最近维修', '启用日期', '操作']),
];

const equipmentMaintenanceListFields: PrdField[] = [
  field('保养状态树', 'configs.maintenance.tree', '左侧保养状态树。', '节点为全部保养、待执行、执行中、已完成、已逾期。'),
  ...exactPageFields('保养计划', 'configs.maintenance.columns', ['保养计划编号', '计划名称', '设备编号', '设备名称', '保养类型', '保养周期', '计划日期', '责任人', '上次保养', '下次保养', '预警状态', '执行状态', '操作']),
];

const equipmentMaintenanceCreateFields: PrdField[] = [
  ...exactPageFields('新增保养', 'EquipmentResourcePage.resetForm.maintenanceExecution', ['保养计划', '计划编号', '计划名称', '设备', '保养类型', '保养周期', '计划日期', '上次保养', '下次保养', '执行人', '实际开始', '实际完成', '执行结果', '异常说明']),
  field('保养项目', 'maintenanceItemColumns', '保养项目明细。', '字段为项目名称、标准要求、方法、工具/备件、是否必填。'),
  field('备件领用', 'spareUsageColumns', '保养执行备件领用明细。', '字段为备件编号、备件名称、规格型号、使用数量、库存数量、仓库。'),
  field('附件', 'attachments', '保养附件。', '用于上传保养照片、记录或审批材料。'),
];

const equipmentRepairRequestFields: PrdField[] = [
  ...exactPageFields('报修申请', 'EquipmentResourcePage.resetForm.repairs', ['报修主题', '维修单号', '设备', '故障分类', '维修等级', '报修人', '报修时间', '影响范围', '紧急程度']),
  field('故障详情', 'EquipmentResourcePage.richText', '报修故障描述。', '保存报修时写入 repairDetail/faultDesc。'),
  field('附件', 'attachments', '报修附件。', '用于上传故障照片、现场记录或报修凭证。'),
  field('选择设备弹窗', 'showEquipmentPicker', '选择报修设备弹窗。', '字段来自 equipmentPickerColumns。'),
];

const equipmentRepairListFields: PrdField[] = [
  field('维修状态树', 'configs.repairs.tree', '左侧维修状态树。', '节点来自 repairStatusOptions。'),
  ...exactPageFields('维修记录', 'configs.repairs.columns', ['维修单号', '报修主题', '设备编号', '设备名称', '故障分类', '维修等级', '报修人', '报修时间', '派工人', '维修人员', '维修状态', '验收状态', '操作']),
];

const equipmentRepairTaskFields: PrdField[] = [
  field('任务状态树', 'EquipmentResourcePage.repairTaskStatusOptions', '维修任务左侧任务状态树。', '节点为全部任务、维修中、待验收、返修中、已完成。'),
  ...exactPageFields('维修任务', 'repairTaskColumns', ['来源报修单', '维修任务', '设备', '故障分类', '维修等级', '报修节点', '派工信息', '计划时间', '实际时间', '任务进度', '任务状态', '验收状态', '操作']),
  field('派工信息', 'EquipmentResourcePage.confirmDispatch', '维修派工动作信息。', '字段为派工人、维修人员、维修等级、计划开始、计划完成、是否停机。'),
  field('验收信息', 'EquipmentResourcePage.confirmAccept', '维修验收动作信息。', '字段为验收人、验收意见、驳回原因。'),
];

const equipmentInspectionCreateFields: PrdField[] = [
  ...exactPageFields('点检计划/执行', 'EquipmentResourcePage.resetForm.inspections', ['点检计划', '点检单号', '设备', '点检类型', '点检周期', '点检人', '生效日期', '点检时间', '点检结果', '点检标准', '异常说明', '记录类型']),
  field('点检项目', 'inspectionItemColumns', '点检项目明细。', '字段为点检项目、标准值/判定标准、记录方式、上限、下限、是否必填。'),
  field('附件', 'attachments', '点检附件。', '用于上传点检记录、异常照片或处理凭证。'),
  field('选择点检计划弹窗', 'showInspectionPlanPicker', '选择点检计划弹窗。', '字段为点检计划、计划编号、适用设备、点检类型、点检标准、负责人、状态。'),
];

const equipmentInspectionExceptionFields: PrdField[] = [
  field('点检结果树', 'configs.inspections.tree', '左侧点检结果树。', '节点为全部点检、待点检、正常、异常、已生成维修。'),
  ...exactPageFields('点检异常', 'configs.inspections.columns', ['点检单号', '点检计划', '设备编号', '设备名称', '点检类型', '点检日期', '点检人', '点检结果', '异常数量', '处理状态', '操作']),
  field('生成维修', 'EquipmentResourcePage.generateRepairFromInspection', '异常点检详情动作。', '仅异常点检且未生成维修时可生成维修报修单。'),
];

const equipmentSpareFields: PrdField[] = [
  field('备件分类树', 'configs.spares.tree', '左侧备件分类树。', '节点来自备件分类设置。'),
  ...exactPageFields('备件库存', 'configs.spares.columns', ['备件编号', '备件名称', '规格型号', '备件分类', '适用设备', '当前库存', '安全库存', '可用库存', '占用库存', '仓库/库位', '最近领用', '预警状态', '操作']),
];

const equipmentSpareApplyFields: PrdField[] = [
  ...exactPageFields('备件申请', 'EquipmentResourcePage.resetForm.spareRequest', ['申请单号', '申请类型', '来源单据', '设备名称', '申请人', '申请数量', '仓库', '用途说明', '申请状态']),
  field('选择备件弹窗', 'showSparePicker', '选择备件弹窗。', '字段来自 sparePickerColumns，确认后回填备件申请。'),
  field('保存申请', 'createSpareRequest', '备件申请保存动作。', '保存为前端记录并回到备件列表。'),
];

const equipmentAssetDetailFields = detailPageFields(
  '设备详情',
  'src/views/equipment/EquipmentResourcePage.vue assets',
  ['基础信息', '点检记录', '保养记录', '维修记录', '备件消耗', '附件', '操作记录'],
  ['设备编号', '设备名称', '设备分类', '规格型号', '所属车间/产线', '责任人', '设备状态', '最近点检', '最近保养', '最近维修', '启用日期'],
  ['启用/切换状态', '结束并切换状态', '切换状态', '报废'],
);

const equipmentMaintenanceDetailFields = detailPageFields(
  '保养详情',
  'src/views/equipment/EquipmentResourcePage.vue maintenance',
  ['计划信息', '保养项目', '执行记录', '预警记录', '关联设备', '操作记录'],
  ['保养主题', '保养编号', '保养设备', '保养类型', '计划日期', '执行人', '保养状态', '完成时间'],
  ['生成执行', '完成保养'],
);

const equipmentRepairDetailFields = detailPageFields(
  '维修详情',
  'src/views/equipment/EquipmentResourcePage.vue repairs',
  ['报修信息', '派工信息', '维修处理', '备件消耗', '验收记录', '操作记录'],
  ['维修编号', '报修设备', '故障现象', '报修人', '报修时间', '维修负责人', '维修状态', '验收结果'],
  ['派工', '维修处理', '验收', '关闭'],
);

const equipmentInspectionDetailFields = detailPageFields(
  '点检详情',
  'src/views/equipment/EquipmentResourcePage.vue inspections',
  ['点检信息', '点检项目', '异常处理', '关联维修', '操作记录'],
  ['点检编号', '点检设备', '点检类型', '计划日期', '点检人', '点检状态', '异常项', '处理结果'],
  ['完成点检', '生成维修'],
);

const equipmentSpareDetailFields = detailPageFields(
  '备件详情',
  'src/views/equipment/EquipmentResourcePage.vue spares',
  ['备件信息', '库存流水', '适用设备', '领用记录', '采购记录', '操作记录'],
  ['备件编号', '备件名称', '规格型号', '单位', '当前库存', '安全库存', '预警状态', '适用设备'],
  ['生成补货记录'],
  [
    field('备件采购/补货', 'src/views/equipment/EquipmentResourcePage.vue spares view=purchase', '备件采购入口按设备中心低库存备件列表展示。', '当前页面只维护设备备件补货视图，采购中心联动接口仍按实际资源预留口径说明，不写成完整采购闭环。'),
  ],
);

const energyListFields = (pageTitle: string, source: string, names: string[]): PrdField[] => [
  field('全局搜索', 'EnergyResourcePage.AwListToolbar.searchPlaceholder', `${pageTitle}工具栏搜索框。`, '搜索字段以当前页面真实列表行为准。'),
  ...exactPageFields(pageTitle, source, names),
  field('工具栏动作', 'EnergyResourcePage.toolbarActions', `${pageTitle}工具栏动作按当前 module 配置展示。`, '当前页面多数列表仅提供刷新；节能措施页面有新增入口；不得补写导入、导出、字段配置或统一操作列。'),
];

const energyRealtimeFields = energyListFields('实时监测', 'moduleConfigs.monitor.columns', ['编号', '采集点', '类别', '关联设备', '位置', '当前读数', '单位', '今日累计', '状态', '最后读数']);
const energyAlarmFields = energyListFields('异常告警', 'EnergyResourcePage.alarmColumns', ['采集点', '告警类型', '级别', '告警内容', '当前值', '阈值', '发生时间', '状态']);
const energyReportFields = energyListFields('能耗报表', 'moduleConfigs.reports.columns', ['报表名称', '类型', '周期', '总能耗', '总成本', '碳排放(tCO₂)', '状态', '生成时间']);
const energySavingFields = energyListFields('节能措施', 'moduleConfigs.saving.columns', ['编号', '措施名称', '分类', '目标节能量', '已节能量', '单位', '投资(元)', '负责部门', '状态', '效果']);
const energyCarbonFields = energyListFields('碳排放', 'moduleConfigs.carbon.columns', ['年份', '月份', '总排放(tCO₂)', '范围一', '范围二', '减排目标', '实际减排', '达标状态']);
const energyProductFields = energyListFields('产品能耗', 'moduleConfigs.product.columns', ['产品编号', '产品名称', '分类', '总能耗(kWh)', '电力(kWh)', '燃气(kWh)', '成本(元)', '碳排放(tCO₂)', '占比(%)', '趋势']);
const energyDepartmentFields = energyListFields('部门能耗', 'moduleConfigs.department.columns', ['部门名称', '总能耗(kWh)', '电力(kWh)', '燃气(kWh)', '用水(t)', '成本(元)', '上月能耗', '环比(%)', '碳排放']);
const energyDataFields = energyListFields('数据管理', 'moduleConfigs.data.columns', ['采集点', '类别', '记录时间', '读数', '单位', '成本(元)', '碳排放', '表底数', '来源', '状态']);
const energyEquipmentFields = energyListFields('设备能耗', 'moduleConfigs.equipment.columns', ['设备编号', '设备名称', '分类', '功率(kW)', '位置', '所属部门', '状态', '运行时长(h)', '本月能耗']);
const energySettingReuseFields = (title: string, route: string): PrdField[] => [
  field('页面入口', route, `${title}从能耗中心导航进入。`, '当前设置类页面复用能耗中心页面壳和设置区，不凭空新增独立业务流程。'),
  field('配置来源', 'EnergyResourcePage / EnergySettingPage', `${title}配置项以后续能耗设置数据为准。`, '未在真实页面和 mock 中出现的策略项仅标注为预留，不写成已实现业务。'),
  field('保存范围', '能耗设置数据', `${title}只影响后续能耗采集、分析或报表口径。`, '不直接改写历史能耗记录。'),
];

const settingsSystemFields: PrdField[] = [
  field('企业信息 / Logo', 'SettingsCenterPage.system.company', '系统设置主区域。', '展示 Logo、企业简称和企业名称，支持上传 Logo。'),
  ...exactPageFields('企业信息', 'companyFields', ['企业名称', '系统简称', '统一社会信用代码', '所属行业', '联系人', '联系电话', '系统邮箱', '企业地址']),
  ...exactPageFields('系统设置动作', 'SettingsCenterPage.system.actions', ['上传 Logo', '恢复默认', '保存企业信息']),
];

const settingsUnitFields: PrdField[] = [
  field('单位分类树', 'unitTreeNodes', '单位管理左侧分类树。', '节点为全部单位、单位分类、计数、重量、长度、面积、体积/容量、包装、时间、能耗、自定义。'),
  ...exactPageFields('单位管理列表', 'unitListColumns', ['分类', '单位代码', '单位名称', '显示符号', '基础单位', '换算关系', '别名 / 说明', '状态', '操作']),
  ...exactPageFields('单位弹窗', 'openUnitSetting', ['分类', '单位代码', '单位名称', '显示符号', '基础单位', '换算系数', '别名 / 说明', '启用']),
];

const settingsCurrencyFields: PrdField[] = [
  ...exactPageFields('币种管理列表', 'currencyListColumns', ['币种代码', '币种名称', '符号', '金额精度', '当前汇率', '维护方式', '汇率来源', '更新时间', '基础币', '状态', '操作']),
  ...exactPageFields('币种弹窗', 'openCurrencySetting', ['币种代码', '币种名称', '符号', '金额精度', '当前汇率', '维护方式', '汇率来源', '更新周期', '基础币', '启用']),
];

const settingsPermissionFields: PrdField[] = [
  ...exactPageFields('权限管理 Tab', 'permissionTabs', ['资源配置', '角色授权', '岗位继承', '成员修正']),
  field('模块中心树', 'permissionModuleTreeNodes', '资源配置左侧模块中心树。', '按顶部模块和侧边菜单生成资源范围。'),
  ...exactPageFields('权限资源列表', 'permissionResourceColumns', ['所属模块', '菜单 / 资源组', '页面 / 资源名称', '资源类型', '权限编码', 'Tab', '操作', '字段', '后端接口', '状态', '操作']),
  ...exactPageFields('资源配置表单', 'permissionResourceForm', ['所属中心', '菜单 / 模块', '页面名称', '资源类型', '权限编码', '状态', '后端接口', '页面结构', '按钮动作', '字段权限', '数据范围维度']),
  ...exactPageFields('角色授权', 'roleColumns', ['角色', '适用中心', '成员数', '授权范围', '数据权限模板', '更新日期', '启用']),
  ...exactPageFields('岗位继承', 'positionColumns', ['岗位', '所属组织', '职级', '默认角色', '成员数', '负责人', '状态', '更新日期']),
  ...exactPageFields('成员修正', 'memberColumns', ['成员', '工号', '部门', '岗位', '岗位继承角色', '额外 / 临时角色', '最终角色', '数据范围特例', '状态']),
];

const settingsAccountFields: PrdField[] = [
  ...exactPageFields('用户账号列表', 'SettingsAccountPage.accountColumns', ['账号', '姓名', '手机号', '状态', '操作']),
  field('账号弹窗', 'SettingsAccountPage.openAccountModal', '新增或编辑用户账号弹窗。', '只按真实页面维护账号、姓名、手机号、状态等账号信息。'),
  field('账号状态', 'SettingsAccountPage.accountRows', '账号启用、停用等状态。', '状态来自当前页面数据，不扩展未出现的账号生命周期。'),
];

const settingsRoleFields: PrdField[] = [
  ...exactPageFields('角色管理列表', 'SettingsRolePage.roleColumns', ['角色名称', '适用中心', '成员数', '菜单范围', '功能权限模板', '数据权限模板', '更新日期', '状态', '操作']),
  field('角色弹窗', 'SettingsRolePage.openRoleModal', '新增或编辑角色弹窗。', '按真实页面维护角色名称、适用中心、权限模板和状态。'),
  field('角色授权范围', 'SettingsRolePage.roleRows', '角色关联菜单范围、功能权限模板和数据权限模板。', '权限含义以后续权限设置页配置为准，不新增未出现的权限概念。'),
];

const settingsPermissionResourceFields: PrdField[] = [
  ...exactPageFields('权限资源 Tab', 'SettingsPermissionResourcePage.tabs', ['菜单管理', '按钮操作', '字段权限项', '数据权限规则']),
  field('菜单管理', 'SettingsPermissionResourcePage.menuResources', '维护系统菜单资源。', '按真实页面资源树和列表展示，不凭空增加菜单层级。'),
  field('按钮操作', 'SettingsPermissionResourcePage.buttonResources', '维护按钮和操作资源。', '按钮资源用于后续角色/权限引用。'),
  field('字段权限项', 'SettingsPermissionResourcePage.fieldResources', '维护字段可见、只读、可编辑资源。', '字段权限只描述资源，不直接授权具体账号。'),
  field('数据权限规则', 'SettingsPermissionResourcePage.dataRules', '维护数据范围规则资源。', '数据范围规则在权限设置页被引用。'),
];

const settingsSuperAdminFields: PrdField[] = [
  ...exactPageFields('超级管理员列表', 'SettingsSuperAdminPage.adminColumns', ['账号', '姓名', '来源信息', '操作']),
  field('管理员来源', 'SettingsSuperAdminPage.adminRows', '超级管理员账号来源信息。', '只展示真实页面已有来源，不写未实现的审批或交接流程。'),
  field('操作入口', 'SettingsSuperAdminPage.actions', '超级管理员行内操作。', '操作以当前页面按钮为准。'),
];

const settingsSecurityFields: PrdField[] = [
  field('安全规则卡片', 'filteredSecurityRules', '安全中心规则卡片。', '卡片展示规则类型、启用开关、规则详情、适用范围、负责人和配置/测试按钮。'),
  ...exactPageFields('安全规则弹窗', 'openSecurityRule', ['安全项', '适用范围', '负责人', '规则详情', '启用']),
];

const settingsDataFields: PrdField[] = [
  ...exactPageFields('日志与数据 Tab', 'activeDataTab', ['操作日志 / 审计']),
  ...exactPageFields('操作日志 / 审计', 'auditColumns', ['操作时间', '操作人', '所属模块', '操作对象', '动作', '结果', '来源 IP']),
  ...exactPageFields('数据任务', 'dataTaskColumns', ['任务编号', '任务类型', '数据范围', '执行时间', '数据量', '状态']),
];

const settingsIntegrationFields: PrdField[] = [
  ...exactPageFields('集成与接口 Tab', 'activeIntegrationTab', ['第三方对接']),
  ...exactPageFields('第三方对接', 'partnerColumns', ['设备名称', '设备类型', '连接方式', '连接状态', '最近同步']),
  ...exactPageFields('API 应用', 'apiColumns', ['应用名称', 'AppKey', '授权模块', '到期时间', '启用']),
  ...exactPageFields('同步任务', 'syncColumns', ['任务名称', '同步方向', '数据对象', '执行周期', '执行结果', '状态']),
];

const salesCustomerStates: PrdState[] = [
  {
    name: '草稿',
    meaning: '客户已创建但尚未提交审核，详情页可编辑、提交审核或删除。',
    trigger: '新增客户保存草稿，或客户资料尚未完成提交。',
    next: '待审核 / 删除终止',
  },
  {
    name: '跟进中',
    meaning: '客户处于跟进维护阶段，尚未成为已审核客户；详情页可编辑、提交审核或停用。',
    trigger: '客户建档后进入跟进状态，或业务人员继续补充客户资料。',
    next: '待审核 / 已停用',
  },
  {
    name: '待审核',
    meaning: '客户已提交审核，等待审批人处理；详情页主要动作是审核。',
    trigger: '草稿、跟进中或已驳回客户点击提交审核或重新提交。',
    next: '已审核 / 已驳回',
  },
  {
    name: '已审核',
    meaning: '客户审核通过，可作为报价、合同、订单等销售业务的可用客户。',
    trigger: '审批人审核通过客户建档或客户资料变更。',
    next: '已停用',
  },
  {
    name: '已停用',
    meaning: '客户已停用，不应再作为新增销售业务的可选客户；详情页允许启用和只读类动作。',
    trigger: '已审核或跟进中客户执行停用并确认。',
    next: '已审核',
  },
  {
    name: '已驳回',
    meaning: '客户审核未通过，需要修改后重新提交，或删除该草稿客户。',
    trigger: '审批人驳回客户建档或资料变更申请。',
    next: '待审核 / 删除终止',
  },
  {
    name: '信用状态：正常',
    meaning: '客户授信额度、已用额度、占用额度和应收未收处于可继续交易范围。',
    trigger: '信用额度充足，且无停用、待授信或待复核风险标记。',
    next: '临近额度 / 待复核 / 停用',
  },
  {
    name: '信用状态：临近额度',
    meaning: '客户可用额度接近策略阈值，新增报价、合同或订单需要提示额度风险。',
    trigger: '已用额度、占用额度、应收未收占用后，可用额度低于客户信用策略阈值。',
    next: '正常 / 待复核 / 停用',
  },
  {
    name: '信用状态：待授信',
    meaning: '客户尚未完成授信评估，信用额度不可直接作为赊销依据。',
    trigger: '新客户未配置授信，或客户信用资料需要补充。',
    next: '正常 / 待复核 / 停用',
  },
  {
    name: '信用状态：停用',
    meaning: '客户信用被停用或停止赊销，新增销售业务应阻断或要求特殊审批。',
    trigger: '客户停用、停止赊销策略生效，或授信风险被人工停用。',
    next: '待复核 / 正常',
  },
  {
    name: '信用状态：待复核',
    meaning: '客户信用资料、额度或风险状态需要复核，不能简单按正常客户放行。',
    trigger: '授信调整、驳回后重提、额度异常、应收风险或人工复核动作产生。',
    next: '正常 / 临近额度 / 停用',
  },
];

const salesPlanStates = statusStates('计划状态', ['草稿', '待审批', '未开始', '执行中', '已完成', '已暂停', '已关闭'], 'src/views/sales/sales-plans/salesPlanList.config.ts 计划状态筛选项');
const salesQuoteStates = statusStates('报价状态', ['审核中', '已批准', '已失效', '草稿'], 'src/views/sales/sales-quotes/salesQuoteList.config.ts 报价列表状态筛选项');
const salesContractStates = statusStates('履约状态', ['待审批', '履约中', '履约完成', '已终止'], 'src/views/sales/sales-contracts/salesContractList.config.ts 合同列表履约状态筛选项');
const salesOrderStates = [
  ...statusStates('订单状态', ['草稿', '审核中', '已批准', '已确认', '生产中', '已取消'], 'src/views/sales/sales-orders/salesOrderList.config.ts 订单状态筛选项'),
  ...prefixedStatusStates('订单进展', ['未发货', '部分发货', '发货中', '已发货', '已完成', '生产中'], 'src/views/sales/sales-orders/salesOrderList.config.ts 订单进展筛选项'),
];

const purchaseSupplierStates: PrdState[] = [
  { name: '临时', meaning: '供应商来自临时供应商或询价新增，详情页可提交转正、编辑或删除。', trigger: '临时供应商进入供应商库，或待审核供应商审核退回。', next: '提交转正后进入待审核；删除后不再保留当前列表记录。' },
  { name: '待审核', meaning: '供应商已提交准入或转正审批，详情页主要动作是审核。', trigger: '新增供应商提交审批，或临时供应商提交转正。', next: '审核通过进入已审核；审核退回进入临时；审核结果在当前供应商记录中回显。' },
  { name: '已审核', meaning: '供应商已通过准入审批，可作为采购、询价或物料供方使用。', trigger: '审批人审核通过供应商准入或临时转正。', next: '停用后进入已停用；编辑不改变状态。' },
  { name: '已驳回', meaning: '供应商准入或转正审批未通过，不能作为可用供应商参与采购。', trigger: '供应商详情审核弹窗选择驳回。', next: '修改后重新提交或保留为不可用审批结果。' },
  { name: '已停用', meaning: '供应商已停用，不应再作为新增采购或询价的可用供方。', trigger: '已审核供应商在详情页执行停用。', next: '启用后进入已审核。' },
];
const purchaseRequestStates: PrdState[] = [
  { name: '待提交', meaning: '请购单已暂存但尚未提交审批，详情页可提交审批、编辑或删除。', trigger: '新增请购保存草稿。', next: '提交审批后进入审批中；删除后不再保留当前列表记录。' },
  { name: '审批中', meaning: '请购单等待审批处理，详情页主要动作是审核。', trigger: '待提交或已驳回请购执行提交审批。', next: '审核通过进入已批准；审核驳回或退回进入已驳回。' },
  { name: '已批准', meaning: '请购单已通过审批，可转询价、转采购或关闭。', trigger: '审批人审核通过请购单。', next: '转询价后进入已转询价；转采购后进入已转采购；关闭后进入已关闭。' },
  { name: '待询价', meaning: '请购明细需要先走询价，详情页可转询价或关闭。', trigger: '请购来源或汇总页判断需要询价。', next: '转询价后进入已转询价；关闭后进入已关闭。' },
  { name: '已转询价', meaning: '请购单或明细已生成询价后续，仍可继续转采购或关闭。', trigger: '详情页执行转询价。', next: '转采购后进入已转采购；关闭后进入已关闭。' },
  { name: '待采购', meaning: '请购明细可直接进入采购处理，详情页可转采购或关闭。', trigger: '请购来源或汇总页判断无需询价。', next: '转采购后进入已转采购；关闭后进入已关闭。' },
  { name: '已转采购', meaning: '请购已生成采购后续，详情页只保留关闭和只读类动作。', trigger: '详情页执行转采购。', next: '关闭后进入已关闭。' },
  { name: '部分采购', meaning: '请购数量已有部分转采购或采购完成，仍可继续采购或关闭。', trigger: '采购处理只覆盖部分请购数量。', next: '继续采购后进入已转采购；关闭后进入已关闭。' },
  { name: '已完成', meaning: '请购目标已完成，详情页只读展示。', trigger: '请购数量和后续采购处理满足完成条件。', next: '终态。' },
  { name: '已关闭', meaning: '请购单已关闭，不再继续转询价或转采购。', trigger: '详情页执行关闭。', next: '终态。' },
  { name: '已驳回', meaning: '请购审批未通过或被退回，详情页可编辑、重新提交或删除。', trigger: '审批动作选择驳回或退回。', next: '重新提交后进入审批中；删除后不再保留当前列表记录。' },
];
const purchaseInquiryStates: PrdState[] = [
  { name: '询价中', meaning: '询价单正在向供应商询价，详情页可标记询价完毕或作废。', trigger: '新增询价或请购转询价生成询价单。', next: '询价完毕动作进入询价完毕；作废动作进入作废。' },
  { name: '询价完毕', meaning: '询价过程结束，详情页只读展示。', trigger: '详情页执行询价完毕。', next: '终态。' },
  { name: '待定价', meaning: '询价已通过审核或收齐报价，等待定价。', trigger: '询价审核通过。', next: '定价后进入已定价；作废后进入作废。' },
  { name: '已定价', meaning: '询价已经完成定价，详情页可继续标记询价完毕或作废。', trigger: '详情页执行定价。', next: '询价完毕动作进入询价完毕；作废动作进入作废。' },
  { name: '作废', meaning: '询价单已作废，详情页只读展示。', trigger: '详情页执行作废，或审批驳回将询价置为作废。', next: '终态。' },
];
const purchaseOrderStates: PrdState[] = [
  { name: '审核中', meaning: '采购订单等待审核处理，详情页主要动作是审核。', trigger: '新增采购订单提交后生成审核中状态。', next: '审核通过进入采购中；审核退回或驳回进入异常取消。' },
  { name: '采购中', meaning: '采购订单已通过审核并进入采购执行，详情页可发货运输或异常取消。', trigger: '采购订单审核通过。', next: '发货运输后进入运输中；异常取消后进入异常取消。' },
  { name: '运输中', meaning: '供应商已发货，等待到货入库。', trigger: '详情页执行发货运输。', next: '到货入库后进入待入库。' },
  { name: '待入库', meaning: '采购到货已形成入库前置，等待部分入库或完成。', trigger: '详情页执行到货入库。', next: '部分入库后进入部分入库；完成后进入已完成。' },
  { name: '部分入库', meaning: '采购订单已有部分数量入库，等待剩余数量继续处理。', trigger: '详情页执行部分入库。', next: '完成后进入已完成。' },
  { name: '已完成', meaning: '采购订单采购、到货和入库目标已完成。', trigger: '详情页执行完成。', next: '终态。' },
  { name: '异常取消', meaning: '采购订单因审核退回、驳回或执行异常被取消。', trigger: '审核退回、审核驳回或详情页执行异常取消。', next: '终态。' },
];

const warehouseInboundStates = statusStates('入库状态', ['已收货待检', '已上架过账', '待上架', '质检中', '已入库'], 'src/views/warehouse/WarehouseResourcePage.vue 入库状态筛选项');
const warehouseOutboundStates = statusStates('出库状态', ['已审核待占用', '拣货中', 'OQC待放行', '待复核', '已过账'], 'src/views/warehouse/WarehouseResourcePage.vue 出库状态筛选项');
const warehouseTransferStates = statusStates('调拨状态', ['调拨出库待确认', '调入确认中', '已完成'], 'src/views/warehouse/WarehouseResourcePage.vue 调拨状态筛选项');
const warehouseCountStates = statusStates('盘点状态', ['未开始', '盘点中', '复盘中', '差异待调整'], 'src/views/warehouse/WarehouseResourcePage.vue 盘点状态筛选项');
const warehouseWarehouseStates = statusStates('仓库状态', ['启用'], 'src/app/api/warehouse/resources.ts warehouses.state');
const warehouseAreaStates = statusStates('区域状态', ['启用', '禁用', '维护'], 'src/views/warehouse/WarehouseResourcePage.vue 区域状态筛选项');
const warehouseLocationStates = statusStates('库位状态', ['可用', '禁用', '维护'], 'src/views/warehouse/WarehouseResourcePage.vue 库位状态筛选项');
const warehouseOqcStates = statusStates('OQC状态', ['待出货检验', '客户验货中', '待放行审批', '已放行', '客户拒收', '已拦截'], 'src/views/warehouse/WarehouseResourcePage.vue OQC状态筛选项');
const warehouseIqcStates = statusStates('IQC状态', ['待来料检验', '质检中', '让步接收', '拒收退回', '已放行'], 'src/views/warehouse/WarehouseResourcePage.vue IQC状态筛选项');
const catalogProductStates = statusStates('产品状态', ['研发', '草稿', '待审核', '已退回', '已驳回'], 'src/app/api/rd/resources.ts products.columns');
const catalogMaterialStates = statusStates('物料状态', ['草稿', '待审核', '已退回', '已驳回', '启用'], 'src/app/api/rd/resources.ts materials.columns');
const salesCatalogStates = statusStates('目录状态', ['在售'], 'src/views/rd/RdResourcePage.vue statusOverrideByPath');
const storehouseCatalogStates = statusStates('目录状态', ['启用'], 'src/views/rd/RdResourcePage.vue statusOverrideByPath');
const storehouseStockStates = statusStates('库存状态', ['正常', '低库存', '冻结', '待检'], 'src/views/storehouse/StorehouseWarehouseManagement.vue productRows.status');
const storehouseWarehouseStates = statusStates('仓库状态', ['启用', '维护'], 'src/views/storehouse/StorehouseWarehouseManagement.vue warehouseRows.state');
const storehouseInoutStates = statusStates('状态', ['待入库', '待质检', '待出库', '待审核', '待处理', '已完成'], 'src/views/storehouse/StorehouseInoutManagement.vue rows/pageRows.state');
const storehouseSortingStates = statusStates('状态', ['待分拣', '分拣中', '已分拣', '已出库'], 'src/views/storehouse/StorehouseSortingDelivery.vue rows.state');
const storehouseShippingStates = statusStates('配送状态', ['待发货', '待收货', '分拣修改确认', '配送完成'], 'src/views/storehouse/StorehouseShippingDelivery.vue categoryNodes');
const storehouseSalesOrderStates = statusStates('发货状态', ['配送完成', '待收货', '待分拣'], 'src/views/storehouse/StorehouseSalesOrders.vue rows.deliveryState');
const storehouseIncomingMaterialStates = statusStates('状态', ['正常', '冻结', '待检'], 'src/views/storehouse/StorehouseIncomingMaterial.vue rows.state');

const productionDemandStates = statusStates('需求状态', ['待确认', '已确认', '已转计划', '已转订单', '草稿', '生产中', '已完成', '已关闭'], 'src/mock/production/records.json production-demands statusName 与 src/app/api/production/resources.ts 详情动作回写');
const productionDemandSummaryStates = statusStates('状态', ['待生产', '生产中', '已完工'], 'src/views/production/ProductionDemandSummaryPage.vue 汇总状态展示');
const productionPlanStates = statusStates('计划状态', ['待审批', '已批准', '草稿', '排产中', '已生成订单', '已完成', '已关闭', '已退回', '已驳回'], 'src/mock/production/records.json production-plans statusName 与 ProductionResourcePage 审核/生成订单回写');
const productionOrderStates = statusStates('生产状态', ['生产中', '待生产', '草稿', '已完成', '已关闭'], 'src/mock/production/records.json production-orders statusName');
const productionWorkOrderStates = statusStates('工单状态', ['生产中', '待报工', '已报工', '已完成', '已关闭'], 'src/mock/production/records.json production-work-orders statusName 与报工完成回写');
const productionOutsourceStates = statusStates('委外状态', ['待发料', '加工中', '待质检', '已完成', '已关闭'], 'src/mock/production/records.json outsource-orders statusName');
const productionSchedulePlanStates = statusStates('状态', ['已发布', '待审批', '草稿'], 'src/mock/production/schedules.json plans.status');
const productionReportRecordStates = statusStates('状态', ['待质检', '生产中', '待报工'], 'src/mock/production/work-order-reporting.json reportRecords.status');
const productionShiftStates = statusStates('状态', ['启用', '停用'], 'src/mock/production/schedules.json shifts.status');

const afterSalesServiceStates = statusStates('售后状态', ['待审核', '已指派', '未指派', '处理中', '未处理', '待结单', '已结单', '已关闭'], 'src/views/after-sales/afterSalesList.config.ts 售后状态筛选项');
const afterSalesTaskStates: PrdState[] = [
  ...statusStates('任务状态', ['待处理', '处理中', '已完成'], 'src/app/api/after-sales/types.ts AfterSalesTask.status'),
  ...prefixedStatusStates('售后状态', ['待审核', '已指派', '未指派', '处理中', '未处理', '待结单', '已结单', '已关闭'], 'src/views/after-sales/AfterSalesTaskList.vue 任务池列表复用 serviceColumns.statusName'),
];
const afterSalesMyTaskStates: PrdState[] = [
  ...statusStates('任务状态', ['待处理', '处理中', '已完成'], 'src/app/api/after-sales/types.ts AfterSalesTask.status'),
  ...prefixedStatusStates('售后状态', ['未处理', '处理中', '待结单', '已结单'], 'src/views/after-sales/AfterSalesTaskList.vue 我的任务状态筛选项'),
];
const afterSalesQualityStates: PrdState[] = [
  ...statusStates('当前阶段', ['D1组建团队', 'D4根因分析', 'CAPA执行', '效果验证', '已关闭'], 'src/views/after-sales/AfterSalesQualityList.vue stages 与 qualityColumns.stage'),
  ...prefixedStatusStates('状态', ['待分析', 'CAPA执行中', '已验证', '已关闭'], 'src/app/api/after-sales/types.ts AfterSalesQuality.status'),
];

const qcInspectionStates = statusStates('执行状态', ['待报检', '抽样中', '巡检中', '待判定', '待出货检验', '合格待入库', '返工待复检', '特采评审', '拒收退回', '已放行'], 'src/app/api/qc/resources.ts qcInspectionStatuses');
const qcPendingInspectionStates = statusStates('执行状态', ['待报检', '抽样中', '巡检中', '待判定', '待出货检验', '合格待入库', '返工待复检'], 'src/views/qc/QcResourcePage.vue 待检任务过滤 /待|中/');
const qcExceptionStates = statusStates('处置状态', ['待处置', '隔离中', '复检中', '让步审批', '整改中', '整改退回', '让步驳回', '已关闭'], 'src/app/api/qc/resources.ts qcExceptionStatuses');
const qcDefectStates = statusStates('处置状态', ['待处置'], 'src/mock/qc/exceptions.json actionType=不合格记录');
const qcIsolationStates = statusStates('处置状态', ['隔离中'], 'src/mock/qc/exceptions.json actionType=隔离/拒收');
const qcRecheckStates = statusStates('处置状态', ['复检中'], 'src/mock/qc/exceptions.json actionType=返工复检');
const qcConcessionStates = statusStates('处置状态', ['让步审批', '让步驳回'], 'src/mock/qc/exceptions.json actionType=让步放行');
const qcReportStates = statusStates('报表状态', ['未生成', '已生成', '已确认'], 'src/app/api/qc/resources.ts qcReportStatuses');

const hrEmployeeStates = statusStates('员工状态', ['在职', '试用期', '待入职', '离职'], 'src/views/hr/hrResource.config.ts employees.statuses');
const hrRegularStates = statusStates('流程状态', ['待评估', '待审批', '已转正', '延期转正'], 'src/views/hr/hrResource.config.ts 转正管理 action profile');
const hrLeaveStates = statusStates('流程状态', ['待交接', '交接中', '待审批', '已离职'], 'src/views/hr/hrResource.config.ts 离职管理 action profile');
const hrOrgStates = statusStates('组织状态', ['启用', '停用', '筹建'], 'src/views/hr/hrResource.config.ts orgs.statuses');
const hrPositionStates = statusStates('岗位状态', ['启用', '待审批', '冻结', '停用'], 'src/views/hr/hrResource.config.ts positions.statuses');
const hrAttendanceStates = statusStates('处理状态', ['正常', '异常', '待审批', '已处理', '已归档'], 'src/views/hr/hrResource.config.ts attendance.statuses');
const hrScheduleStates = statusStates('排班状态', ['已发布', '草稿', '待审批', '停用'], 'src/views/hr/hrResource.config.ts schedules.statuses');
const hrSchedulePublishStates = statusStates('发布状态', ['草稿', '待审批', '已发布', '停用'], 'src/views/hr/hrResource.config.ts schedules action profile');
const hrPayrollStates = statusStates('核算状态', ['待核算', '核算中', '待发放', '已发放'], 'src/views/hr/hrResource.config.ts payroll.statuses');
const hrArchiveStates = statusStates('档案状态', ['有效', '即将到期', '已过期', '已归档'], 'src/views/hr/hrResource.config.ts archives.statuses');
const hrOfficeStates = statusStates('审批状态', ['草稿', '审批中', '已通过', '驳回'], 'src/views/hr/hrResource.config.ts office.statuses');
const hrAnnouncementStates = statusStates('协同状态', ['草稿', '审批中', '待办理', '已通过', '驳回'], 'src/views/hr/hrResource.config.ts 公告列表 action profile');
const equipmentAssetStates = statusStates('设备状态', ['运行中', '故障', '保养中', '停机', '维修中', '闲置', '停用', '报废'], 'src/mock/equipment/assets.json status');
const equipmentMaintenanceStates = statusStates('执行状态', ['未开始', '待执行', '执行中', '已完成', '已逾期', '已取消'], 'src/app/api/equipment/resources.ts maintenanceStatusOptions');
const equipmentRepairStates = statusStates('维修状态', ['待派工', '维修中', '待验收', '返修中', '已完成', '已关闭'], 'src/app/api/equipment/resources.ts repairStatusOptions');
const equipmentRepairDispatchStates = statusStates('维修状态', ['待派工'], 'src/views/equipment/EquipmentResourcePage.vue repairs view=dispatch');
const equipmentRepairTaskStates = statusStates('维修状态', ['维修中', '待验收', '返修中', '已完成'], 'src/views/equipment/EquipmentResourcePage.vue repairTaskStatusOptions');
const equipmentInspectionStates = statusStates('处理状态', ['待点检', '点检中', '正常', '异常', '已生成维修', '已关闭'], 'src/app/api/equipment/resources.ts inspectionStatusOptions');
const equipmentInspectionExceptionStates = statusStates('处理状态', ['异常', '已生成维修'], 'src/views/equipment/EquipmentResourcePage.vue inspections view=exceptions');
const equipmentSpareStates = statusStates('预警状态', ['正常', '低库存', '已占用', '停用'], 'src/app/api/equipment/resources.ts spareStatusOptions');
const equipmentSparePurchaseStates = statusStates('预警状态', ['低库存'], 'src/views/equipment/EquipmentResourcePage.vue spares view=purchase');

function commonFields(center: CenterConfig, page: PageConfig): PrdField[] {
  if (page.kind === '工作台') {
    const todoLabels = workbenchTodoLabels[center.key] || [];
    return [
      ...todoLabels.map((label) => field(label, workbenchTodoSources[center.key] || `${center.name}工作台`, `${center.name}工作台顶部待办/概览卡片。`, '必须在工作台待办事项区域逐项展示，点击后进入对应业务页面并带筛选条件。')),
      field('风险提醒', '策略与日期计算', '超期、差异、缺料、质量、金额或安全风险。', '必须可追溯到具体页面对象。'),
      field('业务导航', '顶部导航配置', '当前中心页面入口集合。', '只跳转，不直接修改数据。'),
      field('最近流转', '操作日志', '最近创建、审批、执行、关闭或回写记录。', '按操作时间倒序展示。'),
    ];
  }

  if (page.kind === '设置页') {
    return [
      field('设置项', '设置中心配置', `${page.objectName}的配置名称、分组、启停和排序。`, '编码按配置规范维护，已被引用的配置停用时必须提示影响范围。'),
      field('启停状态', '设置项状态字段', '当前配置是否启用、停用或维护中。', '用于展示配置可用性，并影响后续业务引用。'),
      field('适用范围', '组织/角色/业务类型', '当前配置适用的中心、页面、组织、角色或业务分类。', '范围变更只影响后续新增和后续校验。'),
      field('配置值', '人工维护/模板配置', '字段、编号、审批、策略、模板或接口参数。', '发布前校验格式、必填和引用对象有效性。'),
      field('生效时间', '发布记录', '配置开始生效的时间。', '历史对象保留原配置快照。'),
      field('操作记录', '设置日志', '创建、修改、发布、停用和恢复记录。', '必须记录操作人、时间和变更摘要。'),
    ];
  }

  if (page.kind === '报表页') {
    return [
      field('统计期间', '查询条件', '报表统计的日期范围。', '默认按当前中心常用期间展示，导出与页面筛选一致。'),
      field('统计维度', '业务分类/组织/人员', '按中心、部门、对象、类型或负责人分组。', '维度来自启用配置，保存时记录所选配置项。'),
      field('指标值', '业务明细汇总', '数量、金额、进度、质量、能耗或效率指标。', '由明细数据汇总，不允许在报表中直接修改。'),
      field('异常标记', '策略计算', '超期、超额、差异、缺失或风险提示。', '点击后进入对应列表并带筛选条件。'),
      field('导出字段', '报表模板', '导出文件包含的字段集合。', '导出字段与页面显示口径一致。'),
    ];
  }

  if (page.kind === '动作页') {
    return [
      field('处理对象', '来源列表', `当前动作要处理的${page.objectName}记录。`, '必须能跳回原始业务对象。'),
      field('当前可处理状态', '当前记录状态字段', '动作入口实际读取的当前记录状态。', '展示动作处理所需的来源状态和处理条件。'),
      field('处理后结果', '动作处理结果', '动作完成后可能写回当前记录、派生记录或详情字段的结果。', '按当前记录真实状态推进，不在动作页另造状态机。'),
      field('处理结果', '人工选择/系统计算', '审核、匹配、分派、核销、关闭或异常处理结果。', '结果必须符合当前页面允许动作。'),
      field('处理说明', '人工填写', '审批意见、差异原因、异常说明或处理备注。', '驳回、异常、差异类结果必填。'),
      field('附件', '附件上传', '处理凭证、图片、回单或审批材料。', '按动作策略校验必传附件。'),
    ];
  }

  if (page.kind === '新增/编辑页') {
    return [
      field(`${page.objectName}编号`, '编号规则', `${page.objectName}编号。`, '自动编号由编号规则生成，前端只读展示。'),
      field(`${page.objectName}名称/主题`, '人工填写', `${page.objectName}业务主题。`, '必填，长度按页面策略校验。'),
      field('页面表单字段', '当前页面表单', '当前新增或编辑页面实际出现的录入项。', '页面展示字段名称、录入方式、必填/只读/选择规则和保存结果。'),
      field('页面子表/附件', '当前页面组件', '当前页面实际出现的子表、附件、弹窗或富文本区域。', '只有页面可见或可触发的内容才写入字段解释。'),
      field('附件', '附件上传', '业务凭证、合同、图片、检验记录、审批材料等。', '按业务类型策略校验必传附件。'),
      field('页面动作', '顶部/底部按钮', '当前页面真实出现的保存、提交、重置、返回或确认动作。', '动作名称必须和页面按钮一致。'),
    ];
  }

  const fields = [
    field(`${page.objectName}编号`, `${page.objectName}.code`, `${page.objectName}编号，作为列表主链接。`, '自动生成或由后端编号规则生成，支持搜索和详情跳转。'),
    field(`${page.objectName}名称/主题`, `${page.objectName}.name/title`, `${page.objectName}的业务主题或显示名称。`, '必填，列表搜索命中字段。'),
    field('列表展示列', '当前列表列', '当前列表页实际展示的列。', '页面展示列名称、数据含义、状态/金额/日期格式和详情入口。'),
    field('筛选与搜索', '当前工具栏', '当前列表页实际提供的搜索框、筛选项和资源树。', '筛选项必须与页面可见筛选一致。'),
    field('操作列', '当前操作入口', '当前列表行实际提供的查看、编辑、审批、执行或关闭入口。', '动作名称和可用条件必须与页面一致。'),
  ];
  if (page.states?.length) {
    fields.push(field('状态', '当前页面状态字段', '当前页面实际展示或筛选的状态字段。', '只使用当前页面已经出现的状态枚举。'));
  }
  return fields;
}

function pageSectionIds(page: PageConfig): PrdSectionId[] {
  if (page.kind === '列表页') return page.states?.length ? ['details', 'fields', 'states', 'acceptance'] : ['details', 'fields', 'acceptance'];
  if (page.kind === '详情页') return page.states?.length ? ['details', 'fields', 'states', 'acceptance'] : ['details', 'fields', 'acceptance'];
  if (page.kind === '新增/编辑页') return ['fields', 'acceptance'];
  if (page.kind === '动作页' || page.kind === '报表页') return page.states?.length ? ['fields', 'states', 'acceptance'] : ['fields', 'acceptance'];
  return ['fields'];
}

const centerFlowActions: Record<string, string[]> = {
  sales: [
    '销售工作台聚合待审核客户、临近额度客户、待执行计划、待跟进报价、报价待转化、待审批合同、合同待下单、待确认订单、待出库订单、待开票申请、待回款核销、逾期未回款和退换货待处理，点击后进入对应列表、详情或动作入口。',
    '在售产品入口复用 RdResourcePage 的产品库和物料管理能力；销售中心只覆盖在售产品、在售物料的查询与引用口径，不新建销售私有产品页。',
    '客户管理完成客户建档、联系人、财务账户、地址、附件、账期、客户经理、客户状态和信用状态维护；已停用或信用异常客户在报价、合同、订单选择时要提示或拦截。',
    '销售计划维护计划周期、计划产品、目标数量、目标金额、统计口径和审批状态；后续按订单确认、发货或回款口径回写完成金额和达成率。',
    '报价管理维护报价类型、适用范围、产品明细、阶梯价、有效期、报价状态和转化状态；审核通过后可转销售订单，也可作为合同来源，转化结果回写报价列表和报价详情。',
    '合同管理维护关联客户、适用报价、合同产品、金额、签订/生效/失效日期和履约状态；合同可继续转销售订单，并接收订单、发货、开票、回款金额回写。',
    '订单管理承接手动、客户、报价或合同来源，完成订单确认、信用校验、信用占用、生产/发货进展、开票申请和回款进度跟踪。',
    '仓储、质检、财务和售后完成出库、OQC、应收确认、销项开票、收款核销、退货、换货等处理后，销售中心在订单、合同、客户和工作台中展示进度与回写结果。',
    '销售退货、销售换货和销售报表按当前导航承接；退换货从订单、发货和售后结果追溯，报表按客户、产品、退换货、回款等口径汇总展示。',
  ],
  purchase: [
    '采购工作台汇总供应商待审核、请购待处理、询价待定价、采购订单到货、入库异常、付款与退换货提醒，点击后进入对应列表或处理入口。',
    '物料管理入口复用 RdResourcePage 的 materials 模块；采购中心没有独立产品库入口，当前只新增 /purchase/materials 物料管理入口。',
    '供应商管理完成供应商建档、供货产品、联系人、财务账户、地址、附件、采购人员、分类、等级和审批状态维护。',
    '请购管理承接物料、生产、项目或库存补货需求，维护请购明细、建议供应商、需求日期和审批状态；请购明细可继续转询价或转采购。',
    '询价管理维护询价来源、询价产品、报价截止、供应商报价行和定价结果；询价完毕后为采购订单提供价格与供应商依据。',
    '采购订单承接请购、询价或手动来源，跟踪采购金额、预计到货、运输、入库、发票认证、三单匹配、质检扣款和可付款金额。',
    '采购退货、采购换货和采购报表按导航承接；退换货追溯采购订单、入库和质检结果，报表按供应商、产品、退换货和对账口径展示。',
    '仓储、质检和财务处理入库、IQC、应付、付款、核销和对账后，采购中心在订单、供应商、请购和工作台中展示回写结果。',
  ],
  warehouse: [
    '仓库中心以 /storehouse 为当前启用入口，旧 /warehouse 仓储中心只作为隐藏兼容路由，不再作为 PRD 主验收页面。',
    '产品管理入口复用 RdResourcePage 的产品库和物料管理能力；仓库中心产品/物料状态在当前路由下覆盖为启用。',
    '仓库管理展示仓库商品库存、库存流水、占用冻结、出入库记录，并支持多仓管理和仓储规则设置。',
    '出库管理和入库管理按仓库分类展示来源单号、业务类型、往来单位/客户部门、仓库、质检方案、数量、经办人、日期和状态。',
    '分拣配送承接出库任务，覆盖待分拣、分拣中、已分拣和历史记录，并在弹窗中完成简易/明细分拣、打印出库单和出库质检。',
    '发货配送承接分拣后的订单发货、待收货、物流变更、收货凭据和开票企业设置。',
    '来料管理维护客户归属来料台账、库存数量、冻结占用、入库明细、库存分布和归属调整。',
    '库存预警按自产产品、代理产品、原辅料和临期列表展示预警值、库存状态和分类批量动作。',
  ],
  production: [
    '生产工作台汇总生产需求、计划审批、订单待生产、工单待派工、报工异常、排班冲突、委外进度和质检异常，点击后进入对应生产页面。',
    '产品管理入口复用 RdResourcePage 的产品库和物料管理能力；生产中心通过 /production/products 和 /production/materials 维护生产使用的产品与物料目录。',
    '生产需求维护新增生产需求、需求列表和需求汇总，承接销售、备货、试制或手动来源，记录需求产品、数量、日期和确认状态。',
    '生产计划根据需求、库存、BOM、工艺、产能和排班形成计划记录，维护计划周期、计划数量、优先级、齐套情况和审批状态。',
    '生产订单锁定产品、BOM 版本、工艺版本、车间产线和生产数量，作为释放生产工单、领料、质检和完工入库的依据。',
    '生产工单覆盖新增工单、工单列表、领工派工、任务报工和报工记录，记录工序、人员、数量、工时、质检节点和异常说明。',
    '生产排班覆盖排班列表、排班计划、生产班组、工作日历和班次管理，为工单派工、产能安排和冲突检测提供日期与班组依据。',
    '委外加工承接委外需求、供应商、发料、收货、质检和入库结果；生产、仓储、质检和成本结果回写需求、计划、订单和工单。',
  ],
  'after-sales': [
    '售后工作台汇总待审核售后、未指派任务、处理中任务、SLA 风险、待结单、质量闭环和成本分析入口，点击后进入售后单、任务或报表页面。',
    '售后单维护新增售后、售后列表、客户、订单、产品、售后原因、投诉问题、售后类型、处理方式、附件和售后状态。',
    '任务池和我的任务承接售后单拆分后的处理事项，按退款退货、仅退款、换货、仅退货、维修处理或现场服务展示任务对象和处理状态。',
    '质量闭环记录 D1 团队、D4 根因、CAPA 执行、效果验证和关闭结果，用于承接投诉、缺陷和复发风险。',
    '售后设置维护售后原因、投诉问题、售后类型、处理方式、保修政策和 SLA 规则，作为售后单创建、任务分派和风险判断依据。',
    '报表分析按售后概览、原因/故障、时效和成本展示统计结果；仓储、财务、质检和销售处理后的结果回写售后单、任务和报表。',
  ],
  qc: [
    '质检工作台汇总新增检验、待检任务、不合格记录、隔离拒收、返工复检、让步放行、质量趋势和质检设置入口。',
    '质检管理覆盖新增检验任务、检验任务列表和待检任务，按 IQC、IPQC、FQC、OQC 来源记录检验对象、抽样数量、检验员、执行状态和结果。',
    '检验执行维护检验项目、实测值、结论、附件和判定结果；合格结果回写采购、生产、仓储或销售来源对象。',
    '异常处理覆盖不合格记录、隔离/拒收、返工复检和让步放行，记录处置状态、责任对象、审批意见和复检验证结果。',
    '质检分析按质量趋势、不良分析、供应商质量和工序质量展示报表状态、统计维度和质量问题分布。',
    '质检设置维护质检方案、质检组和质检标准，为后续检验任务的抽样规则、检验项目和判定标准提供配置依据。',
  ],
  hr: [
    '人力工作台汇总待入职、待转正、离职交接、考勤异常、待发布排班、薪酬待核算、档案到期和办公申请待办，点击后进入对应人力页面。',
    '员工管理维护新增员工、员工列表、转正管理和离职管理，记录员工基础资料、入职、试用期、转正、离职和员工状态。',
    '组织机构维护组织列表、岗位列表和岗位说明书，为员工归属、岗位编制、职责、任职资格、薪级范围和权限范围提供基础数据。',
    '考勤管理维护新增考勤和考勤列表，记录班次、打卡、异常类型、锁定状态、薪酬同步和处理状态。',
    '排班管理覆盖新增排班、排班列表、班次管理、考勤组管理和考勤日历，为考勤、工时、冲突检测和薪酬核算提供排班依据。',
    '薪酬管理覆盖工资列表、薪资方案、薪酬类型和薪酬项目，按考勤、组织、岗位、薪资方案和薪酬结构生成工资核算和发放结果。',
    '档案管理覆盖档案列表、合同档案和证件档案；人事办公覆盖新增办公申请、申请列表、发布公告和公告列表，并保留审批、办理、附件和操作记录。',
  ],
  equipment: [
    '设备工作台汇总设备状态、待点检、待保养、报修、维修任务、备件预警和最近流转，点击后进入设备台账、保养、维修、点检或备件页面。',
    '设备台账维护新增设备和设备档案，记录设备分类、车间产线、责任人、设备状态、保养策略、点检策略、附件和最近点检/保养/维修摘要。',
    '保养计划覆盖保养计划列表和新增保养，记录保养周期、计划日期、执行人、执行状态、保养项目、备件领用和附件。',
    '维修记录覆盖报修申请、维修派工和维修任务，记录故障分类、维修等级、派工信息、任务进度、验收状态和维修结果。',
    '点检记录覆盖点检计划、点检执行和点检异常，记录点检项目、点检结果、异常数量、生成维修和关闭处理结果。',
    '备件管理覆盖备件库存、备件申请和备件采购，记录安全库存、可用库存、占用库存、申请数量、用途说明和采购建议。',
  ],
  energy: [
    '能耗工作台承接能耗监测、分析、报表、节能措施和碳排放导航入口，展示能耗待办、异常告警和管理看板。',
    '能耗监测覆盖实时监测、异常告警、设备能耗、采集点管理、告警阈值和监测频率，用于说明采集对象、告警口径和监测入口。',
    '能耗分析覆盖趋势分析、对比分析、成本分析、分析维度、基准设置和分析周期，用于说明分析指标、对比维度和周期口径。',
    '能耗报表覆盖日报、月报、年报、自定义报表、报表模板和报送设置，用于说明报表范围、导出模板和报送配置入口。',
    '节能措施覆盖措施方案、措施执行、效果评估、措施分类和目标设定，用于说明措施记录、执行跟踪、评估结果和目标配置入口。',
    '碳排放覆盖排放核算、排放报告、减排目标、核算标准和排放因子，用于说明碳排核算范围、报告入口、目标配置和因子来源。',
  ],
  settings: [
    '设置中心按系统设置、单位管理、币种管理、权限管理、安全中心、日志与数据、集成与接口提供全局配置入口。',
    '系统设置维护企业信息、系统简称、统一社会信用代码、联系人、联系电话、邮箱、地址和 Logo。',
    '单位管理和币种管理维护业务计量单位、换算关系、币种、金额精度、汇率来源和启停状态。',
    '权限管理维护资源配置、角色授权、岗位继承和成员修正，形成菜单、动作、字段和数据范围的授权结果。',
    '安全中心维护登录、双因子、审计和访问限制；日志与数据维护操作日志、数据任务和备份导入导出记录。',
    '集成与接口维护第三方对接、API 应用和同步任务，配置结果供后续业务页面引用并保留操作记录。',
  ],
};

function centerBusinessFlows(center: CenterConfig): PrdFlow[] {
  const actions = centerFlowActions[center.key] || [
    `从${center.name}工作台进入待办、列表、新增、动作或报表页面。`,
    '业务人员按来源对象维护字段、明细、附件和处理结果。',
    '系统按状态、权限、策略和跨中心引用约束推进业务。',
    '处理结果回写来源对象、工作台统计、报表和操作日志。',
  ];
  return actions.map((action, index) => ({
    step: String(index + 1),
    role: index === 0 || index === actions.length - 1 ? '系统' : center.role,
    action,
    output: index === actions.length - 1 ? `${center.name}业务闭环结果。` : `${center.name}阶段性业务结果。`,
  }));
}

function centerFlowDoc(center: CenterConfig): PrdDocument {
  return {
    id: `${center.key}-business-flow`,
    module: center.name,
    title: `${center.name}业务流程 PRD`,
    route: center.route,
    pageType: '中心业务流程',
    objective: `按${center.name}统一整理跨页面业务流转，说明工作台、列表、详情、动作和跨中心回写的衔接关系。`,
    scope: ['中心级业务流程', '跨页面流转关系', '跨中心回写口径', '工作台待办与列表状态联动'],
    dataSources: Array.from(new Set(center.pages.flatMap((page) => page.sources))),
    fields: [],
    states: [],
    flows: centerBusinessFlows(center),
    interactions: ['从工作台、导航分组或列表入口进入流程相关页面。', '流程步骤按当前中心页面和跨中心回写顺序展示。', '每个步骤说明负责角色、处理动作和业务输出。'],
    validations: ['流程按页面状态、权限、来源和回写约束推进。', '跨中心回写必须保留来源对象和操作日志。'],
    writeBacks: ['流程结果回写工作台统计、来源对象摘要和跨中心处理结果。'],
    acceptance: [`${center.name}业务流程能说明主要页面之间的先后关系。`, '工作台待办、列表状态和跨中心回写在流程中有对应说明。', '流程步骤能覆盖当前中心主要业务闭环。'],
    sectionIds: ['flows'],
  };
}

const summarizeNames = (names: string[], limit = 16) => {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  const head = uniqueNames.slice(0, limit).join('、');
  return uniqueNames.length > limit ? `${head}等${uniqueNames.length}项` : head;
};

function statusLikeFieldNames(fields: PrdField[]) {
  return fields
    .map((item) => item.name)
    .filter((name) => /状态|阶段|进度|结单确认|SLA|预警|达成率|锁定|同步/.test(name));
}

function actionLikeFieldNames(fields: PrdField[]) {
  return fields
    .map((item) => item.name)
    .filter((name) => /保存|提交|重置|返回|发布|确认|取消|上传|删除|新增|下一步|上一步|导入|导出|审批|指派|生成|操作/.test(name));
}

function coreFieldNames(fields: PrdField[]) {
  const names = fields.map((item) => item.name);
  const core = names.filter((name) => !/全局搜索|筛选|字段配置|批量|操作|弹窗|顶部动作|页面路由|导航名称|展示内容|保存|提交|重置|返回|取消|上传|导入|导出/.test(name));
  return core.length ? core : names;
}

function visibleFeatureNames(fields: PrdField[]) {
  const names = fields.map((item) => item.name);
  const features: string[] = [];
  if (names.some((name) => /全局搜索|搜索/.test(name))) features.push('搜索');
  if (names.some((name) => /筛选/.test(name))) features.push('筛选');
  if (names.some((name) => /字段配置/.test(name))) features.push('字段配置');
  if (names.some((name) => /批量/.test(name))) features.push('批量操作');
  if (names.some((name) => /导入/.test(name))) features.push('导入');
  if (names.some((name) => /导出/.test(name))) features.push('导出');
  if (names.some((name) => /操作/.test(name))) features.push('操作入口');
  return Array.from(new Set(features));
}

function pageAcceptance(page: PageConfig, fields: PrdField[], states: PrdState[], hasStates: boolean) {
  const fieldNames = fields.map((item) => item.name);
  const stateNames = states.map((item) => item.name);
  const statusFields = statusLikeFieldNames(fields);
  const actionFields = actionLikeFieldNames(fields);
  const coreNames = coreFieldNames(fields);
  const featureNames = visibleFeatureNames(fields);
  const result = [...(page.acceptance || [])];
  const keyFieldText = summarizeNames(coreNames, 12);

  if (page.kind === '列表页') {
    result.push(`用户可以在${page.title}查看${page.objectName}列表，并识别${keyFieldText}等关键信息。`);
    if (featureNames.length) {
      result.push(`用户可以使用${featureNames.join('、')}完成查询、定位、调整展示或进入后续处理。`);
    }
  } else if (page.kind === '新增/编辑页') {
    result.push(`用户可以在${page.title}完成${page.objectName}资料录入，保存或提交后形成可继续处理的${page.objectName}记录。`);
    if (fieldNames.length) result.push(`保存结果包含${keyFieldText}等页面录入内容，并在列表或详情中回显一致。`);
  } else if (page.kind === '设置页') {
    result.push(`用户可以维护${page.objectName}配置，保存后用于后续业务页面的选项、校验或权限控制。`);
    if (fieldNames.length) result.push(`配置结果覆盖${keyFieldText}等设置内容，并保留启停、适用范围或操作记录。`);
  } else if (page.kind === '报表页') {
    result.push(`用户可以在${page.title}按当前页面维度查看${page.objectName}统计结果。`);
    if (featureNames.length) result.push(`用户可以使用${featureNames.join('、')}查看、定位或导出当前统计结果。`);
  } else if (page.kind === '动作页') {
    result.push(`用户可以在${page.title}查看待处理${page.objectName}，完成处理并看到处理结果。`);
    if (fieldNames.length) result.push(`处理结果围绕${keyFieldText}等内容回显，并写回来源对象或处理列表。`);
  } else if (page.kind === '工作台') {
    result.push(`用户可以在${page.title}查看${page.objectName}汇总、风险提醒和业务入口。`);
    if (fieldNames.length) result.push(`工作台卡片或入口覆盖${keyFieldText}等当前页面展示内容，点击后进入对应业务页面。`);
  }

  if (hasStates) {
    const statusFieldText = statusFields.length ? summarizeNames(statusFields, 8) : '当前页面状态字段';
    result.push(`用户可以通过${statusFieldText}判断${page.objectName}当前处理阶段。`);
    if (stateNames.length) {
      result.push(`状态展示覆盖：${summarizeNames(stateNames, 20)}。`);
    }
    result.push('状态字段、状态标签、详情展示和操作入口使用同一状态名称，用户能判断下一步处理位置。');
  }

  if (page.kind === '新增/编辑页') {
    const actionText = actionFields.length ? summarizeNames(actionFields, 10) : '当前页面按钮';
    result.push(`用户执行${actionText}后，页面给出结果提示，并保持列表刷新或详情回显一致。`);
  } else if (page.kind === '动作页') {
    const actionText = actionFields.length ? summarizeNames(actionFields, 10) : '当前动作按钮';
    result.push(`用户执行${actionText}后，处理结果、附件或回写摘要可被查看和追溯。`);
  }

  result.push('页面跳转、提示、列表刷新和详情回显与当前页面动作保持一致。');
  return result;
}

function doc(center: CenterConfig, page: PageConfig): PrdDocument {
  const isCreate = page.kind === '新增/编辑页';
  const sectionIds = pageSectionIds(page);
  const hasStates = sectionIds.includes('states');
  const fields = page.fieldsMode === 'replace' ? page.fields || [] : [...commonFields(center, page), ...(page.fields || [])];
  const currentStates = hasStates ? page.states || [] : [];
  return {
    id: `${center.key}-${page.key}`,
    module: center.name,
    title: `${page.title} PRD`,
    route: page.route,
    pageType: page.kind,
    objective: page.objective ?? (isCreate
      ? `创建或编辑${page.objectName}，保证来源、字段、明细、附件、审批和后续记录可追溯。`
      : hasStates
        ? `集中查看和处理${page.objectName}，保证字段、状态、权限、筛选和处理结果一致。`
        : `说明${page.title}的页面字段和数据口径，保证入口、展示、保存和跳转与真实业务一致。`),
    scope: page.scope ?? (hasStates ? [
      `展示或维护${page.objectName}的基础信息、状态、来源和关键业务汇总。`,
      '支持当前页面自然需要的新增、查看、编辑、审批、执行、导入、导出或报表动作。',
      '页面范围与状态说明围绕当前对象展开，状态推进遵循详情页或动作入口。',
      '与工作台、详情页、设置页和跨中心回写保持同一业务口径。',
    ] : [
      `展示或维护${page.objectName}的基础信息、来源和关键业务字段。`,
      '支持当前页面真实需要的录入、保存、发布、跳转或导出动作。',
      '页面范围围绕当前可见字段、动作和跳转展开，生命周期状态由相关列表或详情页承接。',
      '与工作台、列表页、详情页和跨中心引用保持同一业务口径。',
    ]),
    dataSources: page.sources,
    fields,
    states: currentStates,
    flows: [],
    interactions: [
      '页面入口、按钮和操作列只展示当前状态与权限允许的动作。',
      '状态必须使用明确文字，不用颜色替代含义。',
      '复杂引用字段使用选择器，保存时保留被选业务对象的名称、编号和状态。',
      '筛选、排序、分页、导出和统计必须使用同一查询条件。',
    ],
    validations: [
      '必填字段、编号规则、来源对象、明细完整性、附件策略必须通过校验。',
      '数量、金额、日期、状态、人员、组织和引用对象必须合法。',
      '提交审批或确认前，错误行需要可定位并阻止提交。',
      '引用对象停用、关闭、过期或状态不允许时必须阻止提交。',
    ],
    writeBacks: [
      '保存草稿只写入当前对象，不推进来源状态。',
      '提交审批、确认、执行、关闭后写入状态、操作人、操作时间和来源引用摘要。',
      '跨中心回写更新状态、数量、金额、进度或处理摘要，来源明细保留原始追溯关系。',
    ],
    acceptance: pageAcceptance(page, fields, currentStates, hasStates),
    sectionIds,
  };
}

function page(
  key: string,
  title: string,
  objectName: string,
  route: string,
  kind: PageKind,
  sources: string[],
  fields: PrdField[] = [],
  options: Pick<PageConfig, 'states' | 'fieldsMode' | 'acceptance' | 'objective' | 'scope'> = {},
): PageConfig {
  return { key, title, objectName, route, kind, sources, fields, ...options };
}

const salesSources = ['客户档案', '产品档案', '销售计划', '报价单', '合同', '订单', '仓储出库', '财务应收'];
const purchaseSources = ['供应商档案', '物料档案', '请购单', '询价单', '采购订单', '仓储入库', '财务应付'];
const warehouseSources = ['产品/物料档案', '仓库商品库存', '仓库与库位', '入库/出库来源单据', '分拣配送记录', '来料台账', '库存预警', '质检执行结果'];
const productionSources = ['生产需求', '生产计划', '产品档案', 'BOM版本', '工艺版本', '工单报工', '质检记录'];
const serviceSources = ['客户档案', '销售订单', '产品档案', '售后单', '售后任务', '财务退款/红冲'];
const qcSources = ['质检任务', '质检方案', '质检标准', '来源单据', '不合格记录', '让步审批'];
const hrSources = ['员工档案', '组织岗位', '考勤记录', '排班记录', '薪酬方案', '人事档案'];
const equipmentSources = ['设备档案', '保养标准', '维修记录', '点检标准', '备件库存', '执行记录'];
const energySources = ['采集点', '能耗数据', '设备能耗', '告警记录', '分析结果', '排放因子'];
const settingsSources = ['系统参数', '单位管理', '币种管理', '用户角色', '权限策略', '安全策略', '日志数据', '集成配置'];

export const businessPrdCenters: CenterConfig[] = [
  {
    key: 'sales',
    name: '销售中心',
    role: '销售人员',
    route: '/sales',
    states: states.sales,
    pages: [
      page('workbench', '销售工作台', '销售待办', '/sales', '工作台', salesSources),
      page('product-list', '在售产品列表', '在售产品', '/sales/products', '列表页', salesSources, productCatalogFields('在售产品列表', '/sales/products', '销售中心在 /sales/products 路由下把产品状态覆盖为“在售”。'), { fieldsMode: 'replace', states: salesCatalogStates }),
      page('material-list', '在售物料列表', '在售物料', '/sales/materials', '列表页', salesSources, materialCatalogFields('在售物料列表', '/sales/materials', '销售中心在 /sales/materials 路由下把物料状态覆盖为“在售”。'), { fieldsMode: 'replace', states: salesCatalogStates }),
      page('customer-create', '添加客户', '客户', '/sales/customers/new', '新增/编辑页', salesSources, salesCustomerCreateFields, {
        fieldsMode: 'replace',
        objective: '录入客户基础资料、联系人、财务账户、地址、附件、账期和客户详情，通过保存草稿或保存客户完成客户建档。',
        scope: [
          '维护新增客户页面的基础信息、客户信息 Tab、账期设置、客户详情和客户经理选择。',
          '支持返回列表、保存草稿、重置、保存客户、绑定销售人员、新增/删除子表行和上传附件。',
          '页面内容聚焦客户建档，不承接来源对象、产品明细、订单明细和审批处理。',
          '保存结果写入客户档案，并回到客户列表或详情继续处理。',
        ],
        acceptance: [
          '用户可以完成客户基础资料、客户信息四个 Tab、账期设置、客户详情和客户经理的录入。',
          '保存后客户档案包含基础资料、联系人、财务账户、地址、附件、账期、详情和客户经理信息。',
          '保存草稿后客户进入草稿状态，保存客户后进入待审核状态；重置前展示二次确认。',
          '客户经理从人员选择弹窗确认后回填，保存时记录人员名称和编号。',
        ],
      }),
      page('customer-list', '客户列表', '客户', '/sales/customers', '列表页', salesSources, salesCustomerListFields, {
        fieldsMode: 'replace',
        states: salesCustomerStates,
        acceptance: [
          '用户可以按草稿、跟进中、待审核、已审核、已停用、已驳回筛选客户档案。',
          '用户可以区分客户状态和信用状态，并据此判断客户建档进度和授信风险。',
          '客户状态色值与详情页一致：已审核为绿色，草稿/跟进中/待审核为黄色，已停用/已驳回为灰色。',
          '点击客户名称或操作入口后进入客户详情，详情中继续展示客户档案、信用、订单、开票和回款信息。',
        ],
      }),
      page('customer-detail', '客户详情', '客户', '/sales/customers/:id', '详情页', salesSources, salesCustomerDetailFields, { fieldsMode: 'replace', states: salesCustomerStates }),
      page('customer-group-setting', '客户分组设置', '客户分组', '/sales/customers/settings/groups', '设置页', salesSources, customerSettingFields('客户分组设置', 'CustomerSettingPage.settingMap.groups.columns', ['序号', '分组名称', '上级分组', '分组编号', '客户数量', '状态', '操作']), { fieldsMode: 'replace' }),
      page('customer-field-setting', '客户自定义字段', '客户字段', '/sales/customers/settings/fields', '设置页', salesSources, customerSettingFields('客户自定义字段', 'CustomerSettingPage.settingMap.fields.columns', ['序号', '字段名称', '字段编码', '字段类型', '是否必填', '所属分组', '状态', '操作']), { fieldsMode: 'replace' }),
      page('customer-number-setting', '客户自定义编号', '客户编号规则', '/sales/customers/settings/numbers', '设置页', salesSources, customerSettingFields('客户自定义编号', 'CustomerSettingPage.settingMap.numbers.columns', ['序号', '规则名称', '前缀', '日期规则', '流水位数', '编号预览', '状态']), { fieldsMode: 'replace' }),
      page('customer-level-setting', '客户等级设置', '客户等级', '/sales/customers/settings/levels', '设置页', salesSources, customerSettingFields('客户等级设置', 'CustomerSettingPage.settingMap.levels.columns', ['序号', '等级名称', '备注', '是否启用', '操作']), { fieldsMode: 'replace' }),
      page('customer-approval-setting', '客户审批设置', '客户审批规则', '/sales/customers/settings/approvals', '设置页', salesSources, customerSettingFields('客户审批设置', 'CustomerSettingPage.settingMap.approvals.columns', ['序号', '流程名称', '适用分类', '节点数', '创建人', '更新时间', '操作']), { fieldsMode: 'replace' }),
      page('customer-strategy-setting', '客户策略设置', '客户策略', '/sales/customers/settings/strategies', '设置页', salesSources, customerSettingFields('客户策略设置', 'CustomerSettingPage.settingMap.strategies.columns', ['序号', '策略名称', '策略类型', '策略规则', '适用范围', '状态', '操作']), { fieldsMode: 'replace' }),
      page('plan-create', '添加计划', '销售计划', '/sales/sales-plans?action=new', '新增/编辑页', salesSources, salesPlanCreateFields, {
        fieldsMode: 'replace',
        objective: '录入销售计划基础信息、计划产品、计划详情，并通过保存草稿或提交审批完成销售计划创建。',
        scope: ['维护销售计划新增页基础信息、计划产品、产品选择弹窗、计划详情和顶部动作。', '计划创建范围聚焦计划周期、统计口径、目标产品和审批提交。'],
        acceptance: ['用户可以录入计划基础信息、计划产品和计划详情，保存后生成销售计划草稿或提交审批记录。'],
      }),
      page('plan-list', '计划列表', '销售计划', '/sales/sales-plans', '列表页', salesSources, salesPlanListFields, { fieldsMode: 'replace', states: salesPlanStates }),
      page('plan-detail', '计划详情', '销售计划', '/sales/sales-plans?planId={id}', '详情页', salesSources, salesPlanDetailFields, { fieldsMode: 'replace', states: salesPlanStates }),
      page('quote-create', '添加报价', '报价单', '/sales/sales-quotes?action=new', '新增/编辑页', salesSources, salesQuoteCreateFields, {
        fieldsMode: 'replace',
        objective: '录入报价基础信息、适用范围、产品明细、阶梯报价、报价详情和附件，并通过保存草稿或保存报价完成报价创建。',
        scope: ['维护报价新增页基础信息、产品明细、报价详情、附件、产品选择、阶梯报价、客户分组和适用对象弹窗。', '报价创建范围聚焦报价分类、适用范围、价格明细、有效期和报价提交。'],
        acceptance: ['用户可以维护报价基础信息、适用范围、产品明细、阶梯报价、附件和报价详情，保存后生成报价记录。'],
      }),
      page('quote-list', '报价列表', '报价单', '/sales/sales-quotes', '列表页', salesSources, salesQuoteListFields, { fieldsMode: 'replace', states: salesQuoteStates }),
      page('quote-detail', '报价详情', '报价单', '/sales/sales-quotes?quoteId={id}', '详情页', salesSources, salesQuoteDetailFields, { fieldsMode: 'replace', states: salesQuoteStates }),
      page('contract-create', '添加合同', '销售合同', '/sales/sales-contracts?action=new', '新增/编辑页', salesSources, salesContractCreateFields, {
        fieldsMode: 'replace',
        objective: '录入合同基础信息、关联客户、适用报价、合同产品、金额汇总和合同详情，并通过保存草稿或提交审批完成合同创建。',
        scope: ['维护合同新增页基础信息、合同产品、客户选择弹窗、产品选择弹窗、金额汇总、合同详情和顶部动作。', '合同创建范围聚焦关联客户、适用报价、合同产品、金额和合同条款。'],
        acceptance: ['用户可以选择客户和适用报价，维护合同产品、金额汇总和合同详情，保存后生成合同草稿或提交审批记录。'],
      }),
      page('contract-list', '合同列表', '销售合同', '/sales/sales-contracts', '列表页', salesSources, salesContractListFields, { fieldsMode: 'replace', states: salesContractStates }),
      page('contract-detail', '合同详情', '销售合同', '/sales/sales-contracts?contractId={id}', '详情页', salesSources, salesContractDetailFields, { fieldsMode: 'replace', states: salesContractStates }),
      page('order-create', '添加订单', '销售订单', '/sales/sales-orders?action=new', '新增/编辑页', salesSources, salesOrderCreateFields, {
        fieldsMode: 'replace',
        objective: '录入订单基础信息、订单来源、客户信息、产品明细、订单详情和附件，并通过保存草稿或确认完成订单创建。',
        scope: ['维护订单新增页基础信息、产品明细、订单详情、附件、订单来源、客户、联系人和产品选择弹窗。', '订单创建范围聚焦来源选择、客户带入、产品明细、交付、信用和确认动作。'],
        acceptance: ['用户可以选择订单来源、客户、联系人和产品明细，维护交付、附件和订单详情，确认后生成销售订单记录。'],
      }),
      page('order-list', '订单列表', '销售订单', '/sales/sales-orders', '列表页', salesSources, salesOrderListFields, { fieldsMode: 'replace', states: salesOrderStates }),
      page('order-detail', '订单详情', '销售订单', '/sales/sales-orders?id={id}', '详情页', salesSources, salesOrderDetailFields, { fieldsMode: 'replace', states: salesOrderStates }),
      page('return-list', '销售退货列表', '销售退货单', '/sales/sales-returns', '列表页', salesSources, reservedNavigationFields('销售退货列表', '/sales/sales-returns', '导航预留', '退货单与退货明细'), { fieldsMode: 'replace' }),
      page('exchange-list', '销售换货列表', '销售换货单', '/sales/sales-exchanges', '列表页', salesSources, reservedNavigationFields('销售换货列表', '/sales/sales-exchanges', '导航预留', '换货单与换货明细'), { fieldsMode: 'replace' }),
      page('report-list', '销售报表', '销售报表', '/sales/sales-reports', '报表页', salesSources, reservedNavigationFields('销售报表', '/sales/sales-reports', '导航预留', '按客户、产品、退换货统计'), { fieldsMode: 'replace' }),
    ],
  },
  {
    key: 'purchase',
    name: '采购中心',
    role: '采购人员',
    route: '/purchase',
    states: states.purchase,
    pages: [
      page('workbench', '采购工作台', '采购待办', '/purchase', '工作台', purchaseSources),
      page('material-list', '物料管理', '物料', '/purchase/materials', '列表页', purchaseSources, materialCatalogFields('采购物料管理', '/purchase/materials', '采购中心 /purchase/materials 不覆盖状态，使用 rd/resources.ts materials.columns 的物料状态。'), { fieldsMode: 'replace', states: catalogMaterialStates }),
      page('supplier-create', '添加供应商', '供应商', '/purchase/suppliers?action=new', '新增/编辑页', purchaseSources, purchaseSupplierCreateFields, {
        fieldsMode: 'replace',
        objective: '录入供应商基础信息、供应产品、联系人、财务账户、地址、附件和详情说明，并通过暂存或提交审批完成供应商建档。',
        scope: ['维护添加供应商页面的基础信息、供应商详情 Tab、附件、采购人员和供应商分类选择。', '供应商创建范围聚焦准入资料、供货产品、联系人、财务、地址、附件和审批提交。'],
        acceptance: ['用户可以录入供应商基础资料、供应产品、联系人、财务、地址、附件和详情说明，暂存或提交后生成供应商记录。'],
      }),
      page('supplier-list', '供应商列表', '供应商', '/purchase/suppliers', '列表页', purchaseSources, purchaseSupplierListFields, { fieldsMode: 'replace', states: purchaseSupplierStates }),
      page('supplier-detail', '供应商详情', '供应商', '/purchase/suppliers?id={id}', '详情页', purchaseSources, purchaseSupplierDetailFields, { fieldsMode: 'replace', states: purchaseSupplierStates }),
      page('request-create', '添加请购', '请购单', '/purchase/purchase-requests?action=new', '新增/编辑页', purchaseSources, purchaseRequestCreateFields, {
        fieldsMode: 'replace',
        objective: '录入请购基础信息、请购明细和请购详情，并通过暂存或提交审批完成请购创建。',
        scope: ['维护添加请购页面的基础信息、请购明细、产品选择、供应商选择、请购详情和顶部动作。', '请购创建范围聚焦请购来源、需求日期、明细产品、建议供应商和审批提交。'],
        acceptance: ['用户可以录入请购基础信息、请购明细、建议供应商和请购详情，暂存或提交后生成请购记录。'],
      }),
      page('request-list', '请购列表', '请购单', '/purchase/purchase-requests', '列表页', purchaseSources, purchaseRequestListFields, { fieldsMode: 'replace', states: purchaseRequestStates }),
      page('request-detail', '请购详情', '请购单', '/purchase/purchase-requests?id={id}', '详情页', purchaseSources, purchaseRequestDetailFields, { fieldsMode: 'replace', states: purchaseRequestStates }),
      page('inquiry-create', '添加询价', '询价单', '/purchase/purchase-inquiries?action=new', '新增/编辑页', purchaseSources, purchaseInquiryCreateFields, {
        fieldsMode: 'replace',
        objective: '录入询价主题、来源、截止日期、询价明细、供应商报价行和询价详情，并通过暂存或提交审批完成询价创建。',
        scope: ['维护添加询价页面的基础信息、询价明细表、供应商报价行、来源选择、产品选择、询价详情和顶部动作。', '询价创建范围聚焦询价来源、产品明细、供应商报价、报价截止和定价前置资料。'],
        acceptance: ['用户可以选择询价来源和产品，维护询价明细、供应商报价行和询价详情，暂存或提交后生成询价记录。'],
      }),
      page('inquiry-list', '询价列表', '询价单', '/purchase/purchase-inquiries', '列表页', purchaseSources, purchaseInquiryListFields, { fieldsMode: 'replace', states: purchaseInquiryStates }),
      page('inquiry-detail', '询价详情', '询价单', '/purchase/purchase-inquiries?id={id}', '详情页', purchaseSources, purchaseInquiryDetailFields, { fieldsMode: 'replace', states: purchaseInquiryStates }),
      page('order-create', '添加采购订单', '采购订单', '/purchase/purchase-orders?action=new', '新增/编辑页', purchaseSources, purchaseOrderCreateFields, {
        fieldsMode: 'replace',
        objective: '录入采购订单基础信息、订单来源、供应商、采购明细、采购备注，并通过暂存或提交审批完成采购订单创建。',
        scope: ['维护添加采购订单页面的基础信息、采购明细、来源选择、供应商选择、产品选择、更换供应商理由、采购备注和顶部动作。', '采购订单创建范围聚焦订单来源、供应商、采购明细、预计到货、采购金额和审批提交。'],
        acceptance: ['用户可以选择订单来源、供应商和产品，维护采购明细、预计到货和采购备注，暂存或提交后生成采购订单记录。'],
      }),
      page('order-list', '采购订单列表', '采购订单', '/purchase/purchase-orders', '列表页', purchaseSources, purchaseOrderListFields, { fieldsMode: 'replace', states: purchaseOrderStates }),
      page('order-detail', '采购订单详情', '采购订单', '/purchase/purchase-orders?id={id}', '详情页', purchaseSources, purchaseOrderDetailFields, { fieldsMode: 'replace', states: purchaseOrderStates }),
      page('return-create', '新增采购退货', '采购退货单', '/purchase/purchase-returns?action=new', '新增/编辑页', purchaseSources, reservedNavigationFields('新增采购退货', '/purchase/purchase-returns?action=new', '导航预留', '退货单与退货明细'), { fieldsMode: 'replace' }),
      page('return-list', '采购退货列表', '采购退货单', '/purchase/purchase-returns', '列表页', purchaseSources, reservedNavigationFields('采购退货列表', '/purchase/purchase-returns', '导航预留', '退货单与退货明细'), { fieldsMode: 'replace' }),
      page('exchange-create', '新增采购换货', '采购换货单', '/purchase/purchase-exchanges?action=new', '新增/编辑页', purchaseSources, reservedNavigationFields('新增采购换货', '/purchase/purchase-exchanges?action=new', '导航预留', '换货单与换货明细'), { fieldsMode: 'replace' }),
      page('exchange-list', '采购换货列表', '采购换货单', '/purchase/purchase-exchanges', '列表页', purchaseSources, reservedNavigationFields('采购换货列表', '/purchase/purchase-exchanges', '导航预留', '换货单与换货明细'), { fieldsMode: 'replace' }),
      page('report-list', '采购报表', '采购报表', '/purchase/purchase-reports', '报表页', purchaseSources, reservedNavigationFields('采购报表', '/purchase/purchase-reports', '导航预留', '供应商对账、按产品统计'), { fieldsMode: 'replace' }),
      page('report-reconciliation', '供应商对账', '供应商对账报表', '/purchase/purchase-reports?report=reconciliation', '报表页', purchaseSources, reservedNavigationFields('供应商对账', '/purchase/purchase-reports?report=reconciliation', '导航预留', '供应商维度采购订单、入库、应付、付款和差异对账'), { fieldsMode: 'replace' }),
      page('report-by-supplier', '按供应商查询', '供应商采购统计', '/purchase/purchase-reports?report=by-supplier', '报表页', purchaseSources, reservedNavigationFields('按供应商查询', '/purchase/purchase-reports?report=by-supplier', '导航预留', '按供应商查看采购金额、到货、入库、付款和退换货结果'), { fieldsMode: 'replace' }),
      page('report-by-product', '按产品统计', '采购产品统计', '/purchase/purchase-reports?report=by-product', '报表页', purchaseSources, reservedNavigationFields('按产品统计', '/purchase/purchase-reports?report=by-product', '导航预留', '按产品查看采购数量、金额、供应商和到货入库情况'), { fieldsMode: 'replace' }),
      page('report-returns', '退换货明细', '采购退换货报表', '/purchase/purchase-reports?report=returns', '报表页', purchaseSources, reservedNavigationFields('退换货明细', '/purchase/purchase-reports?report=returns', '导航预留', '采购退货、换货、扣款和供应商处理结果'), { fieldsMode: 'replace' }),
    ],
  },
  {
    key: 'warehouse',
    name: '仓库中心',
    role: '仓库人员',
    route: '/storehouse',
    states: states.warehouse,
    pages: [
      page('workbench', '仓库工作台', '仓库待办', '/storehouse', '工作台', warehouseSources, routeReuseFields('仓库工作台', '/storehouse', 'ContractWorkbenchPage'), { fieldsMode: 'replace' }),
      page('product-list', '仓库产品库', '仓库产品', '/storehouse/products', '列表页', warehouseSources, productCatalogFields('仓库产品库', '/storehouse/products', '仓库中心在 /storehouse/products 路由下把产品状态覆盖为“启用”。'), { fieldsMode: 'replace', states: storehouseCatalogStates }),
      page('material-list', '仓库物料管理', '仓库物料', '/storehouse/materials', '列表页', warehouseSources, materialCatalogFields('仓库物料管理', '/storehouse/materials', '仓库中心在 /storehouse/materials 路由下把物料状态覆盖为“启用”。'), { fieldsMode: 'replace', states: storehouseCatalogStates }),
      page('warehouse-product-list', '仓库管理', '仓库商品', '/storehouse/warehouse-management', '列表页', warehouseSources, storehouseProductStockFields, { fieldsMode: 'replace', states: storehouseStockStates }),
      page('multi-warehouse', '多仓管理', '仓库', '/storehouse/warehouse-management?setting=multi-warehouse', '设置页', warehouseSources, storehouseWarehouseListFields, { fieldsMode: 'replace', states: storehouseWarehouseStates }),
      page('warehouse-rules', '仓储规则', '仓储规则', '/storehouse/warehouse-management?setting=warehouse-rules', '设置页', warehouseSources, storehouseWarehouseListFields, { fieldsMode: 'replace', states: storehouseWarehouseStates }),
      page('inout-redirect', '出入库管理重定向', '出入库入口', '/storehouse/inout-management', '列表页', warehouseSources, routeReuseFields('出入库管理重定向', '/storehouse/inout-management', 'redirect -> /storehouse/outbound-management'), { fieldsMode: 'replace' }),
      page('outbound-management', '出库管理', '出库单', '/storehouse/outbound-management', '列表页', warehouseSources, storehouseInoutFields('出库管理列表', 'outbound'), {
        fieldsMode: 'replace',
        states: storehouseInoutStates,
        acceptance: ['用户可以查看真实出库管理列表、详情 Tab、下发分拣、打印和导出动作；当前“新增出库单”按钮仍跳转旧 /warehouse/warehouse-outbounds?action=直接出库，PRD 标记为兼容待对齐项。'],
      }),
      page('inbound-management', '入库管理', '入库单', '/storehouse/inbound-management', '列表页', warehouseSources, storehouseInoutFields('入库管理列表', 'inbound'), {
        fieldsMode: 'replace',
        states: storehouseInoutStates,
        acceptance: ['用户可以查看真实入库管理列表、详情 Tab、入库动作和质检/上架/操作记录；当前“新增入库单”按钮仍跳转旧 /warehouse/warehouse-inbounds?action=直接入库，PRD 标记为兼容待对齐项。'],
      }),
      page('sorting-delivery', '订单分拣', '分拣任务', '/storehouse/sorting-delivery', '动作页', warehouseSources, storehouseSortingFields, { fieldsMode: 'replace', states: storehouseSortingStates }),
      page('shipping-delivery', '发货配送', '配送任务', '/storehouse/shipping-delivery', '列表页', warehouseSources, storehouseShippingFields, { fieldsMode: 'replace', states: storehouseShippingStates }),
      page('sales-orders', '仓库销售订单', '销售订单', '/storehouse/sales-orders', '列表页', warehouseSources, storehouseSalesOrderFields, { fieldsMode: 'replace', states: storehouseSalesOrderStates }),
      page('incoming-material', '来料管理', '来料台账', '/storehouse/incoming-material', '列表页', warehouseSources, storehouseIncomingMaterialFields, { fieldsMode: 'replace', states: storehouseIncomingMaterialStates }),
      page('inventory-warning', '库存预警', '库存预警', '/storehouse/inventory-warning', '列表页', warehouseSources, storehouseInventoryWarningFields, { fieldsMode: 'replace', states: storehouseStockStates }),
    ],
  },
  {
    key: 'production',
    name: '生产中心',
    role: '生产计划员',
    route: '/production',
    states: states.production,
    pages: [
      page('workbench', '生产工作台', '生产待办', '/production', '工作台', productionSources),
      page('product-list', '生产产品库', '生产产品', '/production/products', '列表页', productionSources, productCatalogFields('生产产品库', '/production/products', '生产中心 /production/products 不覆盖状态，使用 rd/resources.ts products.columns 的产品状态。'), { fieldsMode: 'replace', states: catalogProductStates }),
      page('material-list', '生产物料管理', '生产物料', '/production/materials', '列表页', productionSources, materialCatalogFields('生产物料管理', '/production/materials', '生产中心 /production/materials 不覆盖状态，使用 rd/resources.ts materials.columns 的物料状态。'), { fieldsMode: 'replace', states: catalogMaterialStates }),
      page('demand-create', '新增生产需求', '生产需求', '/production/production-demands?action=new', '新增/编辑页', productionSources, productionDemandCreateFields, { fieldsMode: 'replace' }),
      page('demand-list', '生产需求列表', '生产需求', '/production/production-demands', '列表页', productionSources, productionDemandListFields, { fieldsMode: 'replace', states: productionDemandStates }),
      page('demand-detail', '生产需求详情', '生产需求', '/production/production-demands?id={id}', '详情页', productionSources, productionDetailFields, { fieldsMode: 'replace', states: productionDemandStates }),
      page('demand-summary', '生产需求汇总', '生产需求汇总', '/production/production-demands?action=生产需求汇总', '报表页', productionSources, productionDemandSummaryFields, { fieldsMode: 'replace', states: productionDemandSummaryStates }),
      page('plan-create', '新增生产计划', '生产计划', '/production/production-plans?action=new', '新增/编辑页', productionSources, productionPlanCreateFields, { fieldsMode: 'replace' }),
      page('plan-list', '生产计划列表', '生产计划', '/production/production-plans', '列表页', productionSources, productionPlanListFields, { fieldsMode: 'replace', states: productionPlanStates }),
      page('plan-detail', '生产计划详情', '生产计划', '/production/production-plans?id={id}', '详情页', productionSources, productionPlanDetailFields, { fieldsMode: 'replace', states: productionPlanStates }),
      page('order-create', '新增生产订单', '生产订单', '/production/production-orders?action=new', '新增/编辑页', productionSources, productionOrderCreateFields, { fieldsMode: 'replace' }),
      page('order-list', '生产订单列表', '生产订单', '/production/production-orders', '列表页', productionSources, productionOrderListFields, { fieldsMode: 'replace', states: productionOrderStates }),
      page('order-detail', '生产订单详情', '生产订单', '/production/production-orders?id={id}', '详情页', productionSources, productionOrderDetailFields, { fieldsMode: 'replace', states: productionOrderStates }),
      page('work-order-create', '新增生产工单', '生产工单', '/production/production-work-orders?action=new', '新增/编辑页', productionSources, productionWorkOrderCreateFields, { fieldsMode: 'replace' }),
      page('work-order-list', '生产工单列表', '生产工单', '/production/production-work-orders', '列表页', productionSources, productionWorkOrderListFields, { fieldsMode: 'replace', states: productionWorkOrderStates }),
      page('work-order-detail', '生产工单详情', '生产工单', '/production/production-work-orders?id={id}', '详情页', productionSources, productionWorkOrderDetailFields, { fieldsMode: 'replace', states: productionWorkOrderStates }),
      page('dispatch', '领工派工', '派工任务', '/production/production-work-orders?action=领工派工', '动作页', productionSources, productionDispatchFields, { fieldsMode: 'replace' }),
      page('reporting', '任务报工', '报工任务', '/production/production-work-orders?action=任务报工', '动作页', productionSources, productionReportFields, { fieldsMode: 'replace' }),
      page('reporting-list', '报工记录', '报工记录', '/production/production-work-orders?action=报工记录', '列表页', productionSources, productionReportRecordFields, { fieldsMode: 'replace', states: productionReportRecordStates }),
      page('schedule-list', '排班列表', '生产排班', '/production/production-schedules', '列表页', productionSources, productionScheduleListFields, { fieldsMode: 'replace' }),
      page('schedule-plan', '排班计划', '排班计划', '/production/production-schedules?action=排班计划', '列表页', productionSources, productionSchedulePlanFields, { fieldsMode: 'replace', states: productionSchedulePlanStates }),
      page('team-list', '生产班组', '生产班组', '/production/production-schedules?action=生产班组', '列表页', productionSources, productionTeamFields, { fieldsMode: 'replace' }),
      page('calendar', '工作日历', '工作日历', '/production/production-schedules?action=工作日历', '设置页', productionSources, productionCalendarFields, { fieldsMode: 'replace' }),
      page('shift-list', '班次管理', '班次', '/production/production-schedules?action=班次管理', '列表页', productionSources, productionShiftFields, { fieldsMode: 'replace', states: productionShiftStates }),
      page('outsource-create', '新增委外加工', '委外加工单', '/production/outsource-orders?action=new', '新增/编辑页', productionSources, productionOutsourceCreateFields, { fieldsMode: 'replace' }),
      page('outsource-list', '委外加工列表', '委外加工单', '/production/outsource-orders', '列表页', productionSources, productionOutsourceListFields, { fieldsMode: 'replace', states: productionOutsourceStates }),
      page('outsource-detail', '委外加工详情', '委外加工单', '/production/outsource-orders?id={id}', '详情页', productionSources, productionOutsourceDetailFields, { fieldsMode: 'replace', states: productionOutsourceStates }),
    ],
  },
  {
    key: 'after-sales',
    name: '售后中心',
    role: '售后人员',
    route: '/after-sales',
    states: states.service,
    pages: [
      page('workbench', '售后工作台', '售后待办', '/after-sales', '工作台', serviceSources),
      page('service-create', '新增售后', '售后单', '/after-sales/services?action=new', '新增/编辑页', serviceSources, afterSalesServiceCreateFields, { fieldsMode: 'replace' }),
      page('service-list', '售后列表', '售后单', '/after-sales/services', '列表页', serviceSources, afterSalesServiceListFields, { fieldsMode: 'replace', states: afterSalesServiceStates }),
      page('service-detail', '售后详情', '售后单', '/after-sales/services?id={id}', '详情页', serviceSources, afterSalesServiceDetailFields, { fieldsMode: 'replace', states: afterSalesServiceStates }),
      page('task-pool', '任务池', '售后任务', '/after-sales/tasks?status=待处理', '列表页', serviceSources, afterSalesTaskFields('任务池'), { fieldsMode: 'replace', states: afterSalesTaskStates }),
      page('my-task', '我的任务', '售后任务', '/after-sales/tasks?scope=mine', '列表页', serviceSources, afterSalesTaskFields('我的任务', true), { fieldsMode: 'replace', states: afterSalesMyTaskStates }),
      page('quality-list', '质量闭环', '质量改进单', '/after-sales/quality', '列表页', serviceSources, afterSalesQualityFields, { fieldsMode: 'replace', states: afterSalesQualityStates }),
      page('overview-report', '售后概览', '售后报表', '/after-sales/reports?report=overview', '报表页', serviceSources, routeReuseFields('售后概览', '/after-sales/reports?report=overview', '售后工作台'), { fieldsMode: 'replace' }),
      page('reason-report', '原因 / 故障分析', '售后分析', '/after-sales/reports?report=reason-fault', '报表页', serviceSources, routeReuseFields('原因 / 故障分析', '/after-sales/reports?report=reason-fault', '售后工作台'), { fieldsMode: 'replace' }),
      page('timeliness-report', '时效分析', '时效报表', '/after-sales/reports?report=timeliness', '报表页', serviceSources, routeReuseFields('时效分析', '/after-sales/reports?report=timeliness', '售后工作台'), { fieldsMode: 'replace' }),
      page('cost-report', '成本分析', '成本报表', '/after-sales/reports?report=cost', '报表页', serviceSources, routeReuseFields('成本分析', '/after-sales/reports?report=cost', '售后工作台'), { fieldsMode: 'replace' }),
      page('settings', '售后设置', '售后配置', '/after-sales/settings', '设置页', serviceSources, afterSalesSettingFields, { fieldsMode: 'replace' }),
    ],
  },
  {
    key: 'qc',
    name: '质检中心',
    role: '质检人员',
    route: '/qc',
    states: states.qc,
    pages: [
      page('workbench', '质检工作台', '质检待办', '/qc', '工作台', qcSources),
      page('inspection-create', '新增检验任务', '检验任务', '/qc/execution?action=new', '新增/编辑页', qcSources, qcInspectionCreateFields, { fieldsMode: 'replace' }),
      page('inspection-list', '检验任务列表', '检验任务', '/qc/execution?action=检验任务列表', '列表页', qcSources, qcInspectionListFields, { fieldsMode: 'replace', states: qcInspectionStates }),
      page('inspection-execute', '执行质检', '检验任务', '/qc/execution?action=execute&id={id}', '动作页', qcSources, qcExecutionFields, { fieldsMode: 'replace', states: qcInspectionStates }),
      page('pending-list', '待检任务', '待检任务', '/qc/execution?action=待检任务', '列表页', qcSources, qcInspectionListFields, { fieldsMode: 'replace', states: qcPendingInspectionStates }),
      page('defect-list', '不合格记录', '不合格记录', '/qc/exceptions?action=不合格记录', '列表页', qcSources, qcExceptionListFields, { fieldsMode: 'replace', states: qcDefectStates }),
      page('isolation', '隔离/拒收', '隔离拒收记录', '/qc/exceptions?action=隔离%2F拒收', '列表页', qcSources, qcExceptionListFields, { fieldsMode: 'replace', states: qcIsolationStates }),
      page('recheck', '返工复检', '返工复检任务', '/qc/exceptions?action=返工复检', '列表页', qcSources, qcExceptionListFields, { fieldsMode: 'replace', states: qcRecheckStates }),
      page('concession', '让步放行', '让步放行申请', '/qc/exceptions?action=让步放行', '列表页', qcSources, qcExceptionListFields, { fieldsMode: 'replace', states: qcConcessionStates }),
      page('quality-trend', '质量趋势', '质量趋势报表', '/qc/reports?action=质量趋势', '报表页', qcSources, qcReportFields, { fieldsMode: 'replace', states: qcReportStates }),
      page('bad-analysis', '不良分析', '不良分析报表', '/qc/reports?action=不良分析', '报表页', qcSources, qcReportFields, { fieldsMode: 'replace', states: qcReportStates }),
      page('supplier-quality', '供应商质量', '供应商质量报表', '/qc/reports?action=供应商质量', '报表页', qcSources, qcReportFields, { fieldsMode: 'replace', states: qcReportStates }),
      page('process-quality', '工序质量', '工序质量报表', '/qc/reports?action=工序质量', '报表页', qcSources, qcReportFields, { fieldsMode: 'replace', states: qcReportStates }),
      page('qc-plan', '质检方案', '质检方案', '/qc/standards?action=质检方案', '设置页', qcSources, qcPlanFields, { fieldsMode: 'replace' }),
      page('qc-team', '质检组', '质检组', '/qc/standards?action=质检组', '设置页', qcSources, qcTeamFields, { fieldsMode: 'replace' }),
      page('qc-standard', '质检标准', '质检标准', '/qc/standards?action=质检标准', '设置页', qcSources, qcStandardFields, { fieldsMode: 'replace' }),
    ],
  },
  {
    key: 'hr',
    name: '人力中心',
    role: '人力专员',
    route: '/hr',
    states: states.hr,
    pages: [
      page('workbench', '人力工作台', '人力待办', '/hr', '工作台', hrSources),
      page('employee-create', '新增员工', '员工', '/hr/employees?action=新增员工', '新增/编辑页', hrSources, hrEmployeeCreateFields, { fieldsMode: 'replace' }),
      page('employee-list', '员工列表', '员工', '/hr/employees', '列表页', hrSources, hrListFields('员工列表', 'hrModuleConfigs.employees.listColumns', ['员工姓名', '员工编号', '性别', '手机号码', '所属部门', '岗位/职级', '员工类型', '直属上级', '入职日期', '计划转正日', '合同类型', '办公地点'], '员工状态'), { fieldsMode: 'replace', states: hrEmployeeStates }),
      page('employee-detail', '员工详情', '员工', '/hr/employees?id={id}', '详情页', hrSources, hrDetailFields, { fieldsMode: 'replace', states: hrEmployeeStates }),
      page('regular', '转正管理', '转正记录', '/hr/employees?action=转正管理', '动作页', hrSources, hrActionFields('转正管理', 'hrActionProfiles.employees.转正管理.columns', ['员工姓名', '员工编号', '所属部门', '岗位', '入职日期', '计划转正日', '责任人', '评估事项'], '流程状态'), { fieldsMode: 'replace', states: hrRegularStates }),
      page('leave', '离职管理', '离职记录', '/hr/employees?action=离职管理', '动作页', hrSources, hrActionFields('离职管理', 'hrActionProfiles.employees.离职管理.columns', ['员工姓名', '员工编号', '离职原因', '所属部门', '岗位', '计划离职日', '责任人', '交接事项'], '流程状态'), { fieldsMode: 'replace', states: hrLeaveStates }),
      page('org-list', '组织列表', '组织', '/hr/orgs', '列表页', hrSources, hrListFields('组织列表', 'hrModuleConfigs.orgs.listColumns', ['组织名称', '组织编号', '上级组织', '组织类型', '负责人', '编制人数', '在岗人数', '空缺人数', '成本中心', '办公地点', '创建日期'], '组织状态'), { fieldsMode: 'replace', states: hrOrgStates }),
      page('position-list', '岗位列表', '岗位', '/hr/positions', '列表页', hrSources, hrListFields('岗位列表', 'hrModuleConfigs.positions.listColumns', ['岗位名称', '岗位编号', '所属组织', '岗位序列', '岗位类型', '岗位等级', '直接上级', '岗位编制', '在岗人数', '空缺人数', '薪级范围', '生效日期'], '岗位状态'), { fieldsMode: 'replace', states: hrPositionStates }),
      page('job-description', '岗位说明书', '岗位说明书', '/hr/positions?action=岗位说明书', '设置页', hrSources, hrActionFields('岗位说明书', 'getHrActionProfile.positions.岗位说明书.columns', ['岗位名称', '岗位编号', '所属组织', '岗位等级', '直接上级', '职责摘要', '任职资格', '薪级范围', '版本号', '生效日期'], '说明书状态'), { fieldsMode: 'replace' }),
      page('attendance-create', '新增考勤', '考勤记录', '/hr/attendance?action=新增考勤', '新增/编辑页', hrSources, hrAttendanceCreateFields, { fieldsMode: 'replace' }),
      page('attendance-list', '考勤列表', '考勤记录', '/hr/attendance', '列表页', hrSources, hrListFields('考勤列表', 'hrModuleConfigs.attendance.listColumns', ['考勤人员', '所属部门', '班次', '应出勤', '实际出勤', '异常类型', '上班打卡', '下班打卡', '考勤日期', '锁定状态', '薪酬同步'], '处理状态'), { fieldsMode: 'replace', states: hrAttendanceStates }),
      page('schedule-create', '新增排班', '排班', '/hr/schedules?action=新增排班', '新增/编辑页', hrSources, hrScheduleCreateFields, { fieldsMode: 'replace' }),
      page('schedule-list', '排班列表', '排班', '/hr/schedules', '列表页', hrSources, hrListFields('排班列表', 'hrModuleConfigs.schedules.listColumns', ['排班主题', '排班编号', '考勤组', '适用组织', '适用人数', '班次', '工作时段', '休息规则', '排班周期', '冲突数', '排班日期'], '排班状态'), { fieldsMode: 'replace', states: hrScheduleStates }),
      page('shift-manage', '班次管理', '班次', '/hr/schedules?action=班次管理', '列表页', hrSources, hrActionFields('班次管理', 'getHrActionProfile.schedules.班次管理.columns', ['考勤组', '班次名称', '工作时间', '适用人数', '休息规则', '生效日期', '失效日期', '排班周期'], '发布状态'), { fieldsMode: 'replace', states: hrSchedulePublishStates }),
      page('attendance-group', '考勤组管理', '考勤组', '/hr/schedules?action=考勤组管理', '列表页', hrSources, hrActionFields('考勤组管理', 'getHrActionProfile.schedules.考勤组管理.columns', ['考勤组', '班次名称', '工作时间', '适用人数', '休息规则', '生效日期', '失效日期', '排班周期'], '发布状态'), { fieldsMode: 'replace', states: hrSchedulePublishStates }),
      page('attendance-calendar', '考勤日历', '考勤日历', '/hr/schedules?action=考勤日历', '列表页', hrSources, hrActionFields('考勤日历', 'getHrActionProfile.schedules.考勤日历.columns', ['考勤组', '班次名称', '工作时间', '适用人数', '休息规则', '生效日期', '失效日期', '排班周期'], '发布状态'), { fieldsMode: 'replace', states: hrSchedulePublishStates }),
      page('payroll-list', '工资列表', '工资单', '/hr/payroll', '列表页', hrSources, hrListFields('工资列表', 'hrModuleConfigs.payroll.listColumns', ['员工姓名', '员工编号', '工资单号', '所属部门', '岗位/职级', '手机号码', '直属上级', '薪资方案', '应发工资', '扣款合计', '实发工资', '社保', '公积金', '个税', '发薪账户', '财务状态', '薪资月份'], '核算状态'), { fieldsMode: 'replace', states: hrPayrollStates }),
      page('payroll-plan', '薪资方案', '薪资方案', '/hr/payroll?action=薪资方案', '设置页', hrSources, hrPayrollPlanFields, { fieldsMode: 'replace' }),
      page('payroll-type', '薪酬类型', '薪酬类型', '/hr/payroll?action=薪酬类型', '设置页', hrSources, hrPayrollTypeFields, { fieldsMode: 'replace' }),
      page('payroll-item', '薪酬项目', '薪酬项目', '/hr/payroll?action=薪酬项目', '设置页', hrSources, hrPayrollItemFields, { fieldsMode: 'replace' }),
      page('archive-list', '档案列表', '人事档案', '/hr/archives', '列表页', hrSources, hrListFields('档案列表', 'hrModuleConfigs.archives.listColumns', ['档案名称', '档案编号', '归属主体', '档案类型', '证件/合同编号', '形成日期', '到期/复核日期', '保管位置', '密级', '借阅状态', '提醒规则', '归档日期'], '档案状态'), { fieldsMode: 'replace', states: hrArchiveStates }),
      page('archive-detail', '档案详情', '人事档案', '/hr/archives?id={id}', '详情页', hrSources, hrDetailFields, { fieldsMode: 'replace', states: hrArchiveStates }),
      page('contract-archive', '合同档案', '合同档案', '/hr/archives?action=合同档案', '列表页', hrSources, hrActionFields('合同档案', 'hrActionProfiles.archives.合同档案.columns', ['合同名称', '合同编号', '合同类型', '签约主体', '对方单位', '签署日期', '生效日期', '到期日期', '保管位置', '负责人'], '合同状态'), { fieldsMode: 'replace', states: hrArchiveStates }),
      page('certificate-archive', '证件档案', '证件档案', '/hr/archives?action=证件档案', '列表页', hrSources, hrActionFields('证件档案', 'hrActionProfiles.archives.证件档案.columns', ['证件名称', '证件编号', '证件类型', '持有主体', '发证机关', '签发日期', '到期日期', '保管位置', '负责人'], '证照状态'), { fieldsMode: 'replace', states: hrArchiveStates }),
      page('office-create', '新增办公申请', '办公申请', '/hr/office?action=新增办公申请', '新增/编辑页', hrSources, hrOfficeCreateFields, { fieldsMode: 'replace' }),
      page('office-list', '申请列表', '办公申请', '/hr/office', '列表页', hrSources, hrListFields('申请列表', 'hrModuleConfigs.office.listColumns', ['申请主题', '申请单号', '申请人', '事项类型', '所属部门', '经办人', '优先级', '当前节点', '办理时限', '期望完成日期', '申请日期'], '审批状态'), { fieldsMode: 'replace', states: hrOfficeStates }),
      page('office-detail', '办公申请详情', '办公申请', '/hr/office?id={id}', '详情页', hrSources, hrDetailFields, { fieldsMode: 'replace', states: hrOfficeStates }),
      page('announcement-create', '发布公告', '公告', '/hr/office?action=发布公告', '新增/编辑页', hrSources, hrAnnouncementFields, { fieldsMode: 'replace' }),
      page('announcement-list', '公告列表', '公告', '/hr/office?action=公告列表', '列表页', hrSources, hrActionFields('公告列表', 'getHrActionProfile.office.公告列表.columns', ['申请主题', '申请单号', '申请人', '所属部门', '事项类型', '期望完成日期', '经办人', '用途说明'], '协同状态'), { fieldsMode: 'replace', states: hrAnnouncementStates }),
    ],
  },
  {
    key: 'equipment',
    name: '设备中心',
    role: '设备管理员',
    route: '/equipment',
    states: states.equipment,
    pages: [
      page('workbench', '设备工作台', '设备待办', '/equipment', '工作台', equipmentSources),
      page('asset-create', '新增设备', '设备', '/equipment/assets?action=new', '新增/编辑页', equipmentSources, equipmentAssetCreateFields, { fieldsMode: 'replace' }),
      page('asset-list', '设备档案', '设备', '/equipment/assets', '列表页', equipmentSources, equipmentAssetListFields, { fieldsMode: 'replace', states: equipmentAssetStates }),
      page('asset-detail', '设备详情', '设备', '/equipment/assets?id={id}', '详情页', equipmentSources, equipmentAssetDetailFields, { fieldsMode: 'replace', states: equipmentAssetStates }),
      page('maintenance-list', '保养计划', '保养计划', '/equipment/maintenance', '列表页', equipmentSources, equipmentMaintenanceListFields, { fieldsMode: 'replace', states: equipmentMaintenanceStates }),
      page('maintenance-create', '新增保养', '保养任务', '/equipment/maintenance?action=新增保养', '新增/编辑页', equipmentSources, equipmentMaintenanceCreateFields, { fieldsMode: 'replace' }),
      page('maintenance-detail', '保养详情', '保养任务', '/equipment/maintenance?id={id}', '详情页', equipmentSources, equipmentMaintenanceDetailFields, { fieldsMode: 'replace', states: equipmentMaintenanceStates }),
      page('repair-request', '报修申请', '维修单', '/equipment/repairs?action=报修申请', '新增/编辑页', equipmentSources, equipmentRepairRequestFields, { fieldsMode: 'replace' }),
      page('repair-dispatch', '维修派工', '维修派工', '/equipment/repairs?view=dispatch', '列表页', equipmentSources, equipmentRepairListFields, { fieldsMode: 'replace', states: equipmentRepairDispatchStates }),
      page('repair-acceptance', '维修任务', '维修任务', '/equipment/repairs?view=acceptance', '列表页', equipmentSources, equipmentRepairTaskFields, { fieldsMode: 'replace', states: equipmentRepairTaskStates }),
      page('repair-detail', '维修详情', '维修单', '/equipment/repairs?id={id}', '详情页', equipmentSources, equipmentRepairDetailFields, { fieldsMode: 'replace', states: equipmentRepairStates }),
      page('inspection-plan', '点检计划', '点检计划', '/equipment/inspections?action=点检计划', '新增/编辑页', equipmentSources, equipmentInspectionCreateFields, { fieldsMode: 'replace' }),
      page('inspection-execution', '点检执行', '点检任务', '/equipment/inspections?action=点检执行', '新增/编辑页', equipmentSources, equipmentInspectionCreateFields, { fieldsMode: 'replace' }),
      page('inspection-exception', '点检异常', '点检异常', '/equipment/inspections?view=exceptions', '列表页', equipmentSources, equipmentInspectionExceptionFields, { fieldsMode: 'replace', states: equipmentInspectionExceptionStates }),
      page('inspection-detail', '点检详情', '点检任务', '/equipment/inspections?id={id}', '详情页', equipmentSources, equipmentInspectionDetailFields, { fieldsMode: 'replace', states: equipmentInspectionStates }),
      page('spare-stock', '备件库存', '备件库存', '/equipment/spares', '列表页', equipmentSources, equipmentSpareFields, { fieldsMode: 'replace', states: equipmentSpareStates }),
      page('spare-apply', '备件申请', '备件申请', '/equipment/spares?action=备件申请', '新增/编辑页', equipmentSources, equipmentSpareApplyFields, { fieldsMode: 'replace' }),
      page('spare-purchase', '备件采购', '备件采购', '/equipment/spares?view=purchase', '列表页', equipmentSources, equipmentSpareFields, { fieldsMode: 'replace', states: equipmentSparePurchaseStates }),
      page('spare-detail', '备件详情', '备件库存', '/equipment/spares?id={id}', '详情页', equipmentSources, equipmentSpareDetailFields, { fieldsMode: 'replace', states: equipmentSpareStates }),
    ],
  },
  {
    key: 'energy',
    name: '能耗中心',
    role: '能耗管理员',
    route: '/energy',
    states: states.energy,
    pages: [
      page('workbench', '能耗工作台', '能耗待办', '/energy', '工作台', energySources),
      page('realtime', '实时监测', '监测点', '/energy/monitor?action=实时监测', '列表页', energySources, energyRealtimeFields, { fieldsMode: 'replace' }),
      page('alarm', '异常告警', '能耗告警', '/energy/monitor?action=异常告警', '列表页', energySources, energyAlarmFields, { fieldsMode: 'replace' }),
      page('device-energy', '设备能耗', '设备能耗', '/energy/monitor?action=设备能耗', '报表页', energySources, energyEquipmentFields, { fieldsMode: 'replace' }),
      page('collect-point', '采集点管理', '采集点配置', '/energy/monitor?action=采集点管理', '设置页', energySources, energyRealtimeFields, { fieldsMode: 'replace' }),
      page('alarm-threshold', '告警阈值', '告警阈值配置', '/energy/monitor?action=告警阈值', '设置页', energySources, energySettingReuseFields('告警阈值', '/energy/monitor?action=告警阈值'), { fieldsMode: 'replace' }),
      page('monitor-frequency', '监测频率', '监测频率配置', '/energy/monitor?action=监测频率', '设置页', energySources, energySettingReuseFields('监测频率', '/energy/monitor?action=监测频率'), { fieldsMode: 'replace' }),
      page('trend', '趋势分析', '趋势分析', '/energy/analysis?action=趋势分析', '报表页', energySources, energyReportFields, { fieldsMode: 'replace' }),
      page('compare', '对比分析', '对比分析', '/energy/analysis?action=对比分析', '报表页', energySources, energyReportFields, { fieldsMode: 'replace' }),
      page('cost', '成本分析', '成本分析', '/energy/analysis?action=成本分析', '报表页', energySources, energyReportFields, { fieldsMode: 'replace' }),
      page('analysis-dimension', '分析维度', '分析维度配置', '/energy/analysis?action=分析维度', '设置页', energySources, energySettingReuseFields('分析维度', '/energy/analysis?action=分析维度'), { fieldsMode: 'replace' }),
      page('baseline-setting', '基准设置', '能耗基准配置', '/energy/analysis?action=基准设置', '设置页', energySources, energySettingReuseFields('基准设置', '/energy/analysis?action=基准设置'), { fieldsMode: 'replace' }),
      page('analysis-period', '分析周期', '分析周期配置', '/energy/analysis?action=分析周期', '设置页', energySources, energySettingReuseFields('分析周期', '/energy/analysis?action=分析周期'), { fieldsMode: 'replace' }),
      page('daily-report', '日报', '能耗日报', '/energy/reports?action=日报', '报表页', energySources, energyReportFields, { fieldsMode: 'replace' }),
      page('monthly-report', '月报', '能耗月报', '/energy/reports?action=月报', '报表页', energySources, energyReportFields, { fieldsMode: 'replace' }),
      page('yearly-report', '年报', '能耗年报', '/energy/reports?action=年报', '报表页', energySources, energyReportFields, { fieldsMode: 'replace' }),
      page('custom-report', '自定义报表', '能耗自定义报表', '/energy/reports?action=自定义报表', '报表页', energySources, energyReportFields, { fieldsMode: 'replace' }),
      page('report-template', '报表模板', '报表模板配置', '/energy/reports?action=报表模板', '设置页', energySources, energySettingReuseFields('报表模板', '/energy/reports?action=报表模板'), { fieldsMode: 'replace' }),
      page('report-submit', '报送设置', '报送设置', '/energy/reports?action=报送设置', '设置页', energySources, energySettingReuseFields('报送设置', '/energy/reports?action=报送设置'), { fieldsMode: 'replace' }),
      page('saving-plan', '措施方案', '节能措施', '/energy/saving?action=措施方案', '列表页', energySources, energySavingFields, { fieldsMode: 'replace' }),
      page('saving-execution', '措施执行', '节能执行', '/energy/saving?action=措施执行', '列表页', energySources, energySavingFields, { fieldsMode: 'replace' }),
      page('saving-evaluation', '效果评估', '节能效果评估', '/energy/saving?action=效果评估', '报表页', energySources, energySavingFields, { fieldsMode: 'replace' }),
      page('saving-category', '措施分类', '措施分类配置', '/energy/saving?action=措施分类', '设置页', energySources, energySettingReuseFields('措施分类', '/energy/saving?action=措施分类'), { fieldsMode: 'replace' }),
      page('saving-target', '目标设定', '节能目标配置', '/energy/saving?action=目标设定', '设置页', energySources, energySettingReuseFields('目标设定', '/energy/saving?action=目标设定'), { fieldsMode: 'replace' }),
      page('carbon-calc', '排放核算', '碳排记录', '/energy/carbon?action=排放核算', '报表页', energySources, energyCarbonFields, { fieldsMode: 'replace' }),
      page('carbon-report', '排放报告', '碳排放报告', '/energy/carbon?action=排放报告', '报表页', energySources, energyCarbonFields, { fieldsMode: 'replace' }),
      page('carbon-target', '减排目标', '减排目标配置', '/energy/carbon?action=减排目标', '设置页', energySources, energyCarbonFields, { fieldsMode: 'replace' }),
      page('carbon-standard', '核算标准', '核算标准配置', '/energy/carbon?action=核算标准', '设置页', energySources, energySettingReuseFields('核算标准', '/energy/carbon?action=核算标准'), { fieldsMode: 'replace' }),
      page('emission-factor', '排放因子', '排放因子配置', '/energy/carbon?action=排放因子', '设置页', energySources, energySettingReuseFields('排放因子', '/energy/carbon?action=排放因子'), { fieldsMode: 'replace' }),
      page('product-energy', '产品能耗', '产品能耗', '/energy/product', '报表页', energySources, energyProductFields, { fieldsMode: 'replace' }),
      page('department-energy', '部门能耗', '部门能耗', '/energy/department', '报表页', energySources, energyDepartmentFields, { fieldsMode: 'replace' }),
      page('data-list', '数据管理', '能耗数据', '/energy/data', '列表页', energySources, energyDataFields, { fieldsMode: 'replace' }),
      page('equipment-list', '设备能耗', '设备能耗', '/energy/equipment', '列表页', energySources, energyEquipmentFields, { fieldsMode: 'replace' }),
    ],
  },
  {
    key: 'settings',
    name: '设置中心',
    role: '系统管理员',
    route: '/settings',
    states: states.settings,
    pages: [
      page('system', '系统设置', '系统参数', '/settings/system', '设置页', settingsSources, settingsSystemFields, { fieldsMode: 'replace' }),
      page('units', '单位管理', '单位配置', '/settings/units', '设置页', settingsSources, settingsUnitFields, { fieldsMode: 'replace' }),
      page('currencies', '币种管理', '币种配置', '/settings/currencies', '设置页', settingsSources, settingsCurrencyFields, { fieldsMode: 'replace' }),
      page('accounts', '用户账号', '用户账号', '/settings/accounts', '设置页', settingsSources, settingsAccountFields, { fieldsMode: 'replace' }),
      page('roles', '角色管理', '角色', '/settings/roles', '设置页', settingsSources, settingsRoleFields, { fieldsMode: 'replace' }),
      page('permission-resources', '权限资源', '权限资源', '/settings/permission-resources', '设置页', settingsSources, settingsPermissionResourceFields, { fieldsMode: 'replace' }),
      page('permissions', '权限管理', '权限配置', '/settings/permissions', '设置页', settingsSources, settingsPermissionFields, { fieldsMode: 'replace' }),
      page('super-admins', '超级管理员', '超级管理员', '/settings/super-admins', '设置页', settingsSources, settingsSuperAdminFields, { fieldsMode: 'replace' }),
      page('security', '安全中心', '安全策略', '/settings/security', '设置页', settingsSources, settingsSecurityFields, { fieldsMode: 'replace' }),
      page('data', '日志与数据', '数据任务', '/settings/data', '设置页', settingsSources, settingsDataFields, { fieldsMode: 'replace' }),
      page('integrations', '集成与接口', '集成配置', '/settings/integrations', '设置页', settingsSources, settingsIntegrationFields, { fieldsMode: 'replace' }),
    ],
  },
];

export const businessPrdDocuments: PrdDocument[] = businessPrdCenters.flatMap((center) => [
  centerFlowDoc(center),
  ...center.pages.map((item) => doc(center, item)),
]);

type TreeLevel = PrdTreeNode['level'];

function nextTreeLevel(level: TreeLevel): TreeLevel {
  return Math.min(level + 1, 4) as TreeLevel;
}

function treePage(docId: string, label: string, sectionIds: PrdSectionId[], level: TreeLevel = 2): PrdTreeNode {
  const childLevel = nextTreeLevel(level);
  return {
    id: `biz-page-${docId}`,
    label,
    level,
    docId,
    children: prdSections.filter((section) => sectionIds.includes(section.id)).map((section) => ({
      id: `biz-${docId}-${section.id}`,
      label: section.label,
      level: childLevel,
      docId,
      sectionId: section.id,
    })),
  };
}

type PrdNavigationGroup = { key: string; label: string; pageKeys: string[]; direct?: boolean };

const businessPrdNavigationGroups: Partial<Record<string, PrdNavigationGroup[]>> = {
  sales: [
    { key: 'sale-products', label: '在售产品', pageKeys: ['product-list', 'material-list'] },
    { key: 'customers', label: '客户管理', pageKeys: ['customer-create', 'customer-list', 'customer-detail', 'customer-group-setting', 'customer-field-setting', 'customer-number-setting', 'customer-level-setting', 'customer-approval-setting', 'customer-strategy-setting'] },
    { key: 'plans', label: '销售计划', pageKeys: ['plan-create', 'plan-list', 'plan-detail'] },
    { key: 'quotes', label: '报价管理', pageKeys: ['quote-create', 'quote-list', 'quote-detail'] },
    { key: 'contracts', label: '合同管理', pageKeys: ['contract-create', 'contract-list', 'contract-detail'] },
    { key: 'orders', label: '订单管理', pageKeys: ['order-create', 'order-list', 'order-detail'] },
    { key: 'returns', label: '销售退货', pageKeys: ['return-list'], direct: true },
    { key: 'exchanges', label: '销售换货', pageKeys: ['exchange-list'], direct: true },
    { key: 'reports', label: '销售报表', pageKeys: ['report-list'], direct: true },
  ],
  purchase: [
    { key: 'material', label: '物料管理', pageKeys: ['material-list'], direct: true },
    { key: 'supplier', label: '供应商管理', pageKeys: ['supplier-create', 'supplier-list', 'supplier-detail'] },
    { key: 'request', label: '请购管理', pageKeys: ['request-create', 'request-list', 'request-detail'] },
    { key: 'inquiry', label: '询价管理', pageKeys: ['inquiry-create', 'inquiry-list', 'inquiry-detail'] },
    { key: 'order', label: '采购订单', pageKeys: ['order-create', 'order-list', 'order-detail'] },
    { key: 'return', label: '采购退货', pageKeys: ['return-create', 'return-list'] },
    { key: 'exchange', label: '采购换货', pageKeys: ['exchange-create', 'exchange-list'] },
    { key: 'report', label: '采购报表', pageKeys: ['report-list', 'report-reconciliation', 'report-by-supplier', 'report-by-product', 'report-returns'] },
  ],
  warehouse: [
    { key: 'product-management', label: '产品管理', pageKeys: ['product-list', 'material-list'] },
    { key: 'warehouse-manage', label: '仓库管理', pageKeys: ['warehouse-product-list', 'multi-warehouse', 'warehouse-rules'] },
    { key: 'inout', label: '出入库管理', pageKeys: ['inout-redirect', 'outbound-management', 'inbound-management'] },
    { key: 'delivery', label: '分拣配送', pageKeys: ['sorting-delivery', 'shipping-delivery', 'sales-orders'] },
    { key: 'incoming', label: '来料管理', pageKeys: ['incoming-material'], direct: true },
    { key: 'inventory-warning', label: '库存预警', pageKeys: ['inventory-warning'], direct: true },
  ],
  production: [
    { key: 'product-management', label: '产品管理', pageKeys: ['product-list', 'material-list'] },
    { key: 'demand', label: '生产需求', pageKeys: ['demand-create', 'demand-list', 'demand-detail', 'demand-summary'] },
    { key: 'plan', label: '生产计划', pageKeys: ['plan-create', 'plan-list', 'plan-detail'] },
    { key: 'order', label: '生产订单', pageKeys: ['order-create', 'order-list', 'order-detail'] },
    { key: 'work-order', label: '生产工单', pageKeys: ['work-order-create', 'work-order-list', 'work-order-detail', 'dispatch', 'reporting', 'reporting-list'] },
    { key: 'schedule', label: '生产排班', pageKeys: ['schedule-list', 'schedule-plan', 'team-list', 'calendar', 'shift-list'] },
    { key: 'outsource', label: '委外加工', pageKeys: ['outsource-create', 'outsource-list', 'outsource-detail'] },
  ],
  'after-sales': [
    { key: 'service', label: '售后单', pageKeys: ['service-create', 'service-list', 'service-detail', 'task-pool', 'my-task', 'quality-list', 'settings'] },
    { key: 'reports', label: '报表分析', pageKeys: ['overview-report', 'reason-report', 'timeliness-report', 'cost-report'] },
  ],
  qc: [
    { key: 'inspection', label: '质检管理', pageKeys: ['inspection-create', 'inspection-list', 'inspection-execute', 'pending-list'] },
    { key: 'exceptions', label: '异常处理', pageKeys: ['defect-list', 'isolation', 'recheck', 'concession'] },
    { key: 'analysis', label: '质检分析', pageKeys: ['quality-trend', 'bad-analysis', 'supplier-quality', 'process-quality'] },
    { key: 'settings', label: '质检设置', pageKeys: ['qc-plan', 'qc-team', 'qc-standard'] },
  ],
  hr: [
    { key: 'employee', label: '员工管理', pageKeys: ['employee-create', 'employee-list', 'employee-detail', 'regular', 'leave'] },
    { key: 'org', label: '组织机构', pageKeys: ['org-list', 'position-list', 'job-description'] },
    { key: 'attendance', label: '考勤管理', pageKeys: ['attendance-create', 'attendance-list'] },
    { key: 'schedule', label: '排班管理', pageKeys: ['schedule-create', 'schedule-list', 'shift-manage', 'attendance-group', 'attendance-calendar'] },
    { key: 'payroll', label: '薪酬管理', pageKeys: ['payroll-list', 'payroll-plan', 'payroll-type', 'payroll-item'] },
    { key: 'archive', label: '档案管理', pageKeys: ['archive-list', 'archive-detail', 'contract-archive', 'certificate-archive'] },
    { key: 'office', label: '人事办公', pageKeys: ['office-create', 'office-list', 'office-detail', 'announcement-create', 'announcement-list'] },
  ],
  equipment: [
    { key: 'asset', label: '设备台账', pageKeys: ['asset-create', 'asset-list', 'asset-detail'] },
    { key: 'maintenance', label: '保养计划', pageKeys: ['maintenance-list', 'maintenance-create', 'maintenance-detail'] },
    { key: 'repair', label: '维修记录', pageKeys: ['repair-request', 'repair-dispatch', 'repair-acceptance', 'repair-detail'] },
    { key: 'inspection', label: '点检记录', pageKeys: ['inspection-plan', 'inspection-execution', 'inspection-exception', 'inspection-detail'] },
    { key: 'spare', label: '备件管理', pageKeys: ['spare-stock', 'spare-apply', 'spare-purchase', 'spare-detail'] },
  ],
  energy: [
    { key: 'monitor', label: '能耗监测', pageKeys: ['realtime', 'alarm', 'device-energy', 'collect-point', 'alarm-threshold', 'monitor-frequency'] },
    { key: 'analysis', label: '能耗分析', pageKeys: ['trend', 'compare', 'cost', 'analysis-dimension', 'baseline-setting', 'analysis-period'] },
    { key: 'report', label: '能耗报表', pageKeys: ['daily-report', 'monthly-report', 'yearly-report', 'custom-report', 'report-template', 'report-submit'] },
    { key: 'saving', label: '节能措施', pageKeys: ['saving-plan', 'saving-execution', 'saving-evaluation', 'saving-category', 'saving-target'] },
    { key: 'carbon', label: '碳排放', pageKeys: ['carbon-calc', 'carbon-report', 'carbon-target', 'carbon-standard', 'emission-factor'] },
    { key: 'product', label: '产品能耗', pageKeys: ['product-energy'], direct: true },
    { key: 'department', label: '部门能耗', pageKeys: ['department-energy'], direct: true },
    { key: 'data', label: '数据管理', pageKeys: ['data-list'], direct: true },
    { key: 'equipment', label: '设备能耗', pageKeys: ['equipment-list'], direct: true },
  ],
  settings: [
    { key: 'system', label: '系统设置', pageKeys: ['system'], direct: true },
    { key: 'units', label: '单位管理', pageKeys: ['units'], direct: true },
    { key: 'currencies', label: '币种管理', pageKeys: ['currencies'], direct: true },
    { key: 'accounts', label: '用户账号', pageKeys: ['accounts'], direct: true },
    { key: 'roles', label: '角色管理', pageKeys: ['roles'], direct: true },
    { key: 'permission-resources', label: '权限资源', pageKeys: ['permission-resources'], direct: true },
    { key: 'permissions', label: '权限管理', pageKeys: ['permissions'], direct: true },
    { key: 'super-admins', label: '超级管理员', pageKeys: ['super-admins'], direct: true },
    { key: 'security', label: '安全中心', pageKeys: ['security'], direct: true },
    { key: 'data', label: '日志与数据', pageKeys: ['data'], direct: true },
    { key: 'integrations', label: '集成与接口', pageKeys: ['integrations'], direct: true },
  ],
};

function treeGroup(center: CenterConfig, group: PrdNavigationGroup): PrdTreeNode {
  const pages = group.pageKeys
    .map((pageKey) => center.pages.find((item) => item.key === pageKey))
    .filter((item): item is PageConfig => Boolean(item));
  if (group.direct && pages[0]) {
    return treePage(`${center.key}-${pages[0].key}`, group.label, pageSectionIds(pages[0]));
  }
  return {
    id: `${center.key}-${group.key}-group`,
    label: group.label,
    level: 2,
    children: pages.map((item) => treePage(`${center.key}-${item.key}`, item.title, pageSectionIds(item), 3)),
  };
}

function businessTreeChildren(center: CenterConfig): PrdTreeNode[] {
  const configuredGroups = businessPrdNavigationGroups[center.key];
  if (configuredGroups) {
    const workbench = center.pages.find((item) => item.key === 'workbench');
    const groupedPageKeys = new Set(configuredGroups.flatMap((group) => group.pageKeys));
    const orphanPages = center.pages.filter((item) => item.key !== 'workbench' && !groupedPageKeys.has(item.key));
    return [
      ...(workbench ? [treePage(`${center.key}-${workbench.key}`, '工作台', pageSectionIds(workbench))] : []),
      treePage(`${center.key}-business-flow`, '业务流程', ['flows']),
      ...configuredGroups.map((group) => treeGroup(center, group)),
      ...orphanPages.map((item) => treePage(`${center.key}-${item.key}`, item.title, pageSectionIds(item))),
    ];
  }

  return [
    ...center.pages.filter((item) => item.key === 'workbench').map((item) => treePage(`${center.key}-${item.key}`, item.title, pageSectionIds(item))),
    treePage(`${center.key}-business-flow`, '业务流程', ['flows']),
    ...center.pages.filter((item) => item.key !== 'workbench').map((item) => treePage(`${center.key}-${item.key}`, item.title, pageSectionIds(item))),
  ];
}

export const businessPrdTree: PrdTreeNode[] = businessPrdCenters.map((center) => ({
  id: `${center.key}-center`,
  label: center.name,
  level: 1,
  children: businessTreeChildren(center),
}));
