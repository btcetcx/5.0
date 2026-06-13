import { prdSections, type PrdDocument, type PrdField, type PrdSectionId, type PrdState, type PrdTreeNode } from './financePrd';

interface RdModulePrd {
  key: string;
  module: string;
  name: string;
  route: string;
  listTitle: string;
  createTitle: string;
  dataSources: string[];
  listFields: PrdField[];
  createFields: PrdField[];
  states: PrdState[];
  listAcceptance: string[];
  createAcceptance: string[];
}

const rdWorkbenchStates: PrdState[] = [
  { name: '待处理', meaning: '研发对象存在草稿、待审核、待发布、待补资料或跨中心待协同事项。', trigger: '列表状态变化、审批任务生成、项目节点临近或 BOM/工艺缺失。', next: '处理中 / 已处理 / 已逾期' },
  { name: '处理中', meaning: '用户已进入对应页面处理，但来源对象尚未完成状态推进。', trigger: '点击待办进入列表、新增页、详情页或动作入口。', next: '已处理 / 已逾期 / 待处理' },
  { name: '已处理', meaning: '当前待办项的业务动作已完成，工作台不再作为待处理展示。', trigger: '提交审批、审核通过、发布、停用、锁版或跨中心发起成功。', next: '终态 / 待处理' },
  { name: '已逾期', meaning: '计划完成日、审批 SLA、项目里程碑或物料采源预警超过策略阈值。', trigger: '系统定时任务按当前日期和策略计算。', next: '处理中 / 已处理' },
];

const docStates: PrdState[] = [
  { name: '草稿', meaning: '文档已创建但未提交审批，只允许创建人或授权角色编辑。', trigger: '新增保存草稿、发布后创建新版本草稿、审批退回后重新编辑。', next: '待审核 / 已停用' },
  { name: '待审核', meaning: '文档已提交审批，内容和附件冻结，等待审批人处理。', trigger: '点击提交审批且必填项、正文、附件策略校验通过。', next: '已发布 / 已退回 / 已驳回' },
  { name: '已退回', meaning: '审批人要求补充材料，文档可编辑后重新提交。', trigger: '审批动作选择退回修改并填写退回原因。', next: '草稿 / 待审核' },
  { name: '已驳回', meaning: '审批不同意该版本继续流转，需复制或重建后再提交。', trigger: '审批动作选择驳回并填写驳回原因。', next: '草稿 / 已停用' },
  { name: '已发布', meaning: '当前文档版本对项目、BOM、工艺或产品引用可见。', trigger: '发布动作完成，版本号、发布人和发布时间写入。', next: '草稿 / 已停用' },
  { name: '已停用', meaning: '文档不再允许被新对象引用，历史引用保留快照。', trigger: '停用动作通过权限和引用影响校验。', next: '已发布' },
];

const projectStates: PrdState[] = [
  { name: '草稿', meaning: '项目基础信息未提交审批，可维护负责人、周期、预算和交付范围。', trigger: '新增项目保存草稿。', next: '待审核 / 已驳回' },
  { name: '待审核', meaning: '项目立项材料已提交，BOM、工艺、报价、采购、生产动作暂不可发起。', trigger: '提交审批且项目名称、分类、负责人、周期、预算校验通过。', next: '筹备中 / 已退回 / 已驳回' },
  { name: '已退回', meaning: '立项材料需补充后重新提交。', trigger: '审批人退回修改。', next: '草稿 / 待审核' },
  { name: '已驳回', meaning: '立项未通过，默认不进入后续项目执行。', trigger: '审批人驳回。', next: '草稿' },
  { name: '筹备中', meaning: '项目立项通过，允许维护成员、项目 BOM、项目工艺和报价。', trigger: '审批通过。', next: '进行中 / 已暂停 / 已完成' },
  { name: '进行中', meaning: '项目已启动，可推进采购、生产、成本归集和进度更新。', trigger: '项目负责人点击启动项目。', next: '已暂停 / 已完成' },
  { name: '已暂停', meaning: '项目暂时冻结，新增采购、生产和报价锁定动作不可用。', trigger: '暂停项目并填写原因。', next: '进行中 / 已完成' },
  { name: '已完成', meaning: '项目交付完成，保留只读详情和结项记录。', trigger: '结项验收通过，采购、生产、成本和文档归档完成。', next: '终态' },
];

const productStates: PrdState[] = [
  { name: '草稿', meaning: '产品资料已创建但未提交审核。', trigger: '新增产品保存草稿。', next: '待审核 / 停用' },
  { name: '待审核', meaning: '产品资料等待审批确认。', trigger: '提交审批且分类、单位、销售控制等字段校验通过。', next: '研发 / 在售 / 已退回 / 已驳回' },
  { name: '已退回', meaning: '审批人要求补充产品资料。', trigger: '审批退回。', next: '草稿 / 待审核' },
  { name: '已驳回', meaning: '产品资料未通过审批。', trigger: '审批驳回。', next: '草稿 / 停用' },
  { name: '研发', meaning: '产品处于研发验证阶段，可继续维护 BOM、工艺和试制资料。', trigger: '产品创建或审批通过后进入研发阶段。', next: '在售 / 停产 / 停用' },
  { name: '在售', meaning: '产品可被销售、报价、订单和生产需求引用。', trigger: '产品资料、BOM、工艺和质检策略满足发布条件。', next: '停产 / 停用 / 研发' },
  { name: '停产', meaning: '产品停止新生产，历史订单和售后仍保留引用。', trigger: '产品停产动作或审批通过。', next: '在售 / 停用' },
  { name: '停用', meaning: '产品不再允许被新业务引用。', trigger: '停用动作通过影响校验。', next: '研发 / 在售' },
];

const materialStates: PrdState[] = [
  { name: '草稿', meaning: '物料资料已创建但未提交审核。', trigger: '新增物料保存草稿。', next: '待审核 / 停用' },
  { name: '待审核', meaning: '物料分类、单位、采购和库存策略等待审批。', trigger: '提交审批且必填字段校验通过。', next: '启用 / 已退回 / 已驳回' },
  { name: '已退回', meaning: '审批人要求补充或修正物料资料。', trigger: '审批退回。', next: '草稿 / 待审核' },
  { name: '已驳回', meaning: '物料资料未通过审批。', trigger: '审批驳回。', next: '草稿 / 停用' },
  { name: '启用', meaning: '物料可被采购、仓储、BOM、生产或质检引用。', trigger: '审批通过或有权限直接启用。', next: '停用 / 禁止采购' },
  { name: '停用', meaning: '物料不再允许被新业务引用。', trigger: '停用动作通过影响校验。', next: '启用' },
  { name: '禁止采购', meaning: '物料不可被新采购需求引用，库存和历史单据保持可追溯。', trigger: '物料采源风险或策略停采。', next: '启用 / 停用' },
];

const processStates: PrdState[] = [
  { name: '草稿', meaning: '工序资料已创建但未提交审核。', trigger: '新增工序保存草稿。', next: '待审核 / 停用' },
  { name: '待审核', meaning: '工序分类、加工方式、工时和质检要求等待审批。', trigger: '提交审批且必填字段校验通过。', next: '启用 / 已退回 / 已驳回' },
  { name: '已退回', meaning: '审批人要求补充或修正工序资料。', trigger: '审批退回。', next: '草稿 / 待审核' },
  { name: '已驳回', meaning: '工序资料未通过审批。', trigger: '审批驳回。', next: '草稿 / 停用' },
  { name: '启用', meaning: '工序可被工艺路线和生产工单引用。', trigger: '审批通过或有权限直接启用。', next: '暂停 / 停用' },
  { name: '暂停', meaning: '工序暂不建议用于新增工艺或生产安排。', trigger: '工序暂停动作或策略处理。', next: '启用 / 停用' },
  { name: '停用', meaning: '工序不再允许被新工艺选择，历史工艺保留快照。', trigger: '停用动作通过影响校验。', next: '启用' },
];

const craftStates: PrdState[] = [
  { name: '草稿', meaning: '工艺版本正在编制，工序路线和参数可编辑。', trigger: '新增保存、导入生成或创建变更版本。', next: '待审核 / 已作废' },
  { name: '待审核', meaning: '工艺已提交审批，路线和关键参数冻结。', trigger: '提交审批且完整性校验通过。', next: '已生效 / 已退回 / 已驳回' },
  { name: '已退回', meaning: '审批要求调整工艺内容。', trigger: '审批退回。', next: '草稿 / 待审核' },
  { name: '已驳回', meaning: '工艺审批未通过，不能作为下游生产基准。', trigger: '审批驳回。', next: '草稿 / 已作废' },
  { name: '已生效', meaning: '工艺可被项目、生产需求、生产订单或成本核算引用。', trigger: '审批通过并发布。', next: '已作废' },
  { name: '已作废', meaning: '工艺版本永久不可用，仅保留审计和历史查看。', trigger: '作废动作通过影响范围校验。', next: '终态' },
];

const bomStates: PrdState[] = [
  { name: '草稿', meaning: 'BOM 版本正在编制，物料层级、用量和损耗可编辑。', trigger: '新增保存、导入生成或创建变更版本。', next: '待审核 / 已停用' },
  { name: '待审核', meaning: 'BOM 已提交审批，结构和用量冻结。', trigger: '提交审批且完整性校验通过。', next: '已生效 / 已退回 / 已驳回' },
  { name: '已退回', meaning: '审批要求调整 BOM 内容。', trigger: '审批退回。', next: '草稿 / 待审核' },
  { name: '已驳回', meaning: 'BOM 审批未通过，不能作为下游业务基准。', trigger: '审批驳回。', next: '草稿 / 已停用' },
  { name: '已生效', meaning: 'BOM 可被项目、报价、生产需求、生产订单或成本核算引用。', trigger: '审批通过并发布，必要时设置默认版本。', next: '已停用' },
  { name: '已停用', meaning: 'BOM 版本不再允许新引用，历史引用保留版本快照。', trigger: '停用审批通过。', next: '已生效' },
];

const substituteStates: PrdState[] = [
  { name: '启用', meaning: '替代关系可用于 BOM 展开、缺料替代、采购建议和生产领料。', trigger: '审批通过或有权限直接启用。', next: '停用' },
  { name: '待审核', meaning: '替代物料、比例、优先级和有效期等待审批。', trigger: '提交审批且主物料、替代物料、比例、日期校验通过。', next: '启用 / 停用' },
  { name: '停用', meaning: '替代关系不再参与新业务计算。', trigger: '停用动作通过影响校验。', next: '启用' },
];

const settingStates: PrdState[] = [
  { name: '草稿', meaning: '设置项变更尚未发布，不影响业务页面。', trigger: '编辑字段、编号、分类、审批、策略或模板。', next: '待审批 / 已发布' },
  { name: '待审批', meaning: '变更影响编号、审批、策略或下游引用，等待管理员确认。', trigger: '提交设置审批。', next: '已发布 / 已驳回' },
  { name: '已发布', meaning: '设置项生效，新建研发对象读取最新规则。', trigger: '审批通过或有权限直接发布。', next: '草稿 / 已停用' },
  { name: '已驳回', meaning: '设置变更未通过，需要调整后重新提交。', trigger: '审批驳回。', next: '草稿' },
  { name: '已停用', meaning: '设置项不再应用于新增业务，历史对象保留规则快照。', trigger: '停用设置项。', next: '已发布' },
];

const listInteractions = [
  '列表必须使用统一列表母版：左侧资源树或分类树，右侧搜索、刷新、筛选、字段配置、导入、导出和新增入口。',
  '状态字段必须展示明确文字和颜色标识，颜色不能替代状态文字。',
  '编号或名称字段必须可点击进入详情；操作列只出现当前状态允许的动作。',
  '字段配置、筛选项和导出字段沿用当前列表的展示口径。',
];

const createInteractions = [
  '新增页必须使用统一新增/编辑母版，顶部提供返回、保存草稿、提交审批或保存并启用动作。',
  '分类、负责人、来源对象、物料、产品、供应商、质检方案等复杂字段使用选择器，并保存所选对象编号和名称。',
  '子表支持新增、删除、批量导入、行内校验和错误定位。',
  '保存成功后回到当前模块列表或进入详情，并展示保存结果。',
];

const listValidations = [
  '筛选项必须覆盖状态机全部有效状态。',
  '列表不能展示无来源、无编号或状态为空的业务记录；演示数据也必须遵守字段口径。',
  '批量操作必须按状态和权限过滤，不允许跨状态强制推进。',
  '导出结果必须与当前筛选、排序和字段配置一致。',
];

const createValidations = [
  '必填字段、编号规则、分类、单位、负责人、状态和有效期必须在前端和后端双重校验。',
  '提交审批前必须完成子表完整性校验，错误行需要可定位。',
  '自动编号由编号规则生成，前端只读展示。',
  '引用对象停用、过期或状态不允许时必须阻止提交。',
];

const commonWriteBacks = [
  '列表页不直接修改业务事实，只展示新增页、详情页、审批动作或后端任务写入后的结果。',
  '新增保存草稿只写入当前研发对象，不回写下游中心。',
  '提交审批、发布、启用、停用、锁版或作废动作完成后，必须写入状态、操作人、操作时间和版本快照。',
];

const rdDataSources = {
  workbench: ['研发文档', '研发项目', '产品档案', '物料档案', '工序档案', '工艺路线', 'BOM 版本', '审批待办', '跨中心引用记录'],
  docs: ['文档库', '文档分类', '文档版本记录', '附件服务', '审批流程', '项目/BOM/工艺引用记录'],
  projects: ['项目档案', '项目成员', '项目 BOM', '项目工艺', '项目报价', '采购进度', '生产进度', '项目成本'],
  products: ['产品档案', '产品分类', '规格型号', '销售策略', '库存策略', '质检方案', 'BOM/工艺引用'],
  materials: ['物料档案', '物料分类', '供应商档案', '采购单位', '库存策略', '质检方案', '替代料关系'],
  processes: ['工序档案', '工作中心', '设备/工位', 'SOP 文档', '质检方案', '工时与成本参数'],
  crafts: ['工艺路线', '工序档案', '产品档案', '物料消耗', '委外供应商', 'SOP 文档', '质检方案'],
  boms: ['BOM 主表', 'BOM 层级明细', '产品档案', '物料档案', '工序档案', '替代料', '成本快照', '导入文件'],
  substitutes: ['主物料档案', '替代物料档案', 'BOM 版本', '采购库存', '齐套计算', '审批记录'],
  settings: ['研发分类设置', '自定义字段', '编号规则', '审批流程', '策略设置', '打印模板'],
};

const docListFields: PrdField[] = [
  { name: '文档编号', source: 'RdDocument.code', description: '文档编号，作为列表主链接。', rules: '按文档编号规则生成，支持搜索和详情跳转。' },
  { name: '文档名称', source: 'RdDocument.name', description: '文档标题或资料名称。', rules: '同分类下需便于识别；不能为空。' },
  { name: '文档分类/类型', source: '文档分类设置', description: '制度、图纸、技术文档、表格等分类。', rules: '只能选择启用分类，筛选树与字段值一致。' },
  { name: '版本号', source: '文档版本记录', description: '当前展示版本。', rules: '发布后创建新草稿必须递增版本。' },
  { name: '编制人', source: '人员选择器', description: '文档责任人。', rules: '必须来自人员档案。' },
  { name: '状态', source: '文档状态机', description: '文档当前生命周期状态。', rules: '枚举必须覆盖草稿、待审核、已发布、已停用等状态。' },
  { name: '更新日期', source: 'updatedAt', description: '最后一次保存、提交、审核或发布日期。', rules: '按操作日志自动写入。' },
  { name: '引用次数', source: '文档引用记录', description: '被项目、BOM、工艺等对象引用的数量。', rules: '引用次数大于 0 时停用需提示影响范围。' },
];

const docCreateFields: PrdField[] = [
  { name: '文档名称', source: '人工填写', description: '文档标题。', rules: '必填，最长 80 字。' },
  { name: '文档分类', source: '分类选择器', description: '选择文档所在分类。', rules: '必选，只能选择启用分类。' },
  { name: '文档编号', source: '编号规则', description: '保存时按编号规则生成。', rules: '自动编号不可编辑。' },
  { name: '版本号', source: '版本策略', description: '当前文档版本。', rules: '新建默认 V1.0，编辑发布文档生成新版本草稿。' },
  { name: '失效日期', source: '人工填写/策略默认', description: '文档有效截止日期。', rules: '可永久有效；填写时不得早于生效日期。' },
  { name: '正文内容', source: '富文本编辑器', description: '文档正文。', rules: '提交审批时必填。' },
  { name: '附件', source: '附件上传', description: '图纸、评审记录、规格书等。', rules: '按文档分类策略校验必传附件类型。' },
  { name: '引用对象', source: '来源选择器', description: '可选关联项目、BOM、工艺或产品。', rules: '仅能引用启用或进行中的对象。' },
];

const projectListFields: PrdField[] = [
  { name: '项目编号', source: 'RdProject.code', description: '项目编号。', rules: '自动生成，列表主链接。' },
  { name: '项目名称', source: 'RdProject.name', description: '项目正式名称。', rules: '必填，支持模糊搜索。' },
  { name: '项目分类', source: '项目分类设置', description: '研发项目、工程项目、合作项目。', rules: '分类树和筛选项必须一致。' },
  { name: '状态', source: '项目状态机', description: '立项和执行状态。', rules: '必须覆盖草稿、待审核、筹备中、进行中、已暂停、已完成。' },
  { name: '优先级', source: '人工维护', description: '高、中、低等排序依据。', rules: '影响工作台风险排序，不直接改变状态。' },
  { name: '负责人', source: '人员选择器', description: '项目第一责任人。', rules: '必须为启用人员。' },
  { name: '开始日期/计划完成日期', source: '项目计划', description: '项目计划周期。', rules: '计划完成日期不得早于开始日期。' },
  { name: '进度', source: '项目执行记录', description: '项目当前完成比例。', rules: '已完成必须为 100%，暂停不能自动增长。' },
];

const projectCreateFields: PrdField[] = [
  { name: '项目名称', source: '人工填写', description: '项目立项名称。', rules: '必填，最长 80 字。' },
  { name: '项目分类', source: '分类选择器', description: '选择研发、工程或合作分类。', rules: '必选，只能选择末级分类。' },
  { name: '负责人', source: '人员选择器', description: '项目负责人。', rules: '必选，必须为研发或授权部门人员。' },
  { name: '项目周期', source: '日期控件', description: '开始日期和计划完成日期。', rules: '日期范围合法且符合项目策略。' },
  { name: '关联客户/合同', source: '来源选择器', description: '项目来源客户或合同。', rules: '工程项目或客户定制项目必填。' },
  { name: '项目预算', source: '人工填写', description: '项目预计投入金额。', rules: '金额保留两位小数，超阈值触发审批。' },
  { name: '项目成员', source: '人员子表', description: '项目参与人员和角色。', rules: '负责人必须在成员表内且角色清晰。' },
  { name: '项目描述/附件', source: '富文本与附件', description: '目标、范围、交付物、立项资料。', rules: '提交审批时必填立项说明。' },
];

const productListFields: PrdField[] = [
  { name: '产品图片', source: '附件/媒体字段', description: '产品缩略图。', rules: '无图片时展示默认占位。' },
  { name: '产品名称', source: 'Product.name', description: '对外或内部产品名称。', rules: '列表主链接，支持搜索。' },
  { name: '产品编号', source: 'Product.code', description: '产品编码。', rules: '按产品编号规则生成。' },
  { name: '产品型号', source: '规格型号', description: '型号或型号集合。', rules: '多型号产品需在详情型号表维护。' },
  { name: '产品分类', source: '产品分类设置', description: '成品、半成品、原材料等。', rules: '只能选择启用分类。' },
  { name: '标准单位', source: '单位档案', description: '产品主计量单位。', rules: '必须为启用单位。' },
  { name: '获取方式', source: '产品属性', description: '自制件、外购件、委外件等。', rules: '影响 BOM、生产和采购联动。' },
  { name: '产品状态', source: '主数据状态机', description: '研发、在售、停产、停用等。', rules: '状态决定销售、生产和采购是否可引用。' },
];

const productCreateFields: PrdField[] = [
  { name: '产品名称/编号', source: '人工填写/编号规则', description: '产品基础标识。', rules: '名称必填；编号按规则生成。' },
  { name: '产品分类', source: '分类选择器', description: '选择成品、半成品或原材料分类。', rules: '必选末级分类。' },
  { name: '型号/规格/单位', source: '人工填写/单位选择器', description: '产品规格和计量信息。', rules: '单位必选；多型号需要维护型号表。' },
  { name: '获取方式', source: '枚举', description: '自制、外购、委外等。', rules: '自制产品提交前需提示维护 BOM 和工艺。' },
  { name: '销售控制', source: '产品策略', description: '允许销售、禁止销售、项目专用等。', rules: '在售产品必须有销售控制策略。' },
  { name: '库存策略', source: '库存字段组', description: '安全库存、最低库存、最高库存、补货周期。', rules: '最高库存不得小于安全库存和最低库存。' },
  { name: '质检方案', source: '质检方案选择器', description: '产品入库、出货或过程检验方案。', rules: '启用/在售前必须选择有效方案。' },
  { name: '产品说明/附件', source: '富文本与附件', description: '产品介绍、图片、图纸。', rules: '图片和说明按分类策略校验。' },
];

const materialListFields: PrdField[] = [
  { name: '物料图片', source: '附件/媒体字段', description: '物料缩略图。', rules: '无图片展示默认占位。' },
  { name: '物料名称', source: 'Material.name', description: '物料正式名称。', rules: '列表主链接，支持搜索。' },
  { name: '物料编号', source: 'Material.code', description: '物料编码。', rules: '按物料编号规则生成。' },
  { name: '物料规格', source: 'Material.spec', description: '规格型号或关键参数。', rules: '用于采购、仓储、BOM 展示。' },
  { name: '物料分类', source: '物料分类设置', description: '电子物料、机械物料、包装物料等。', rules: '分类树和筛选项一致。' },
  { name: '标准单位', source: '单位档案', description: '物料主计量单位。', rules: '必须为启用单位。' },
  { name: '获取方式', source: '物料属性', description: '外购、自制、委外、用品等。', rules: '影响采购、生产和库存处理。' },
  { name: '物料状态', source: '主数据状态机', description: '启用、停用、禁止采购等。', rules: '禁止采购时仍允许历史库存和生产领用按策略处理。' },
];

const materialCreateFields: PrdField[] = [
  { name: '物料名称/编号', source: '人工填写/编号规则', description: '物料基础标识。', rules: '名称必填；编号按规则生成。' },
  { name: '物料分类', source: '分类选择器', description: '选择物料所在分类。', rules: '必选末级分类。' },
  { name: '规格/标准单位', source: '人工填写/单位选择器', description: '规格型号和计量单位。', rules: '单位必选；规格按分类策略校验。' },
  { name: '获取方式', source: '枚举', description: '外购、自制、委外等。', rules: '外购物料必须维护采购信息。' },
  { name: '主供应商', source: '供应商选择器', description: '默认采购供应商。', rules: '外购物料提交审批时必填。' },
  { name: '采购单位/换算', source: '采购单位子表', description: '供应单位和标准单位换算。', rules: '换算系数必须大于 0。' },
  { name: '库存策略', source: '库存字段组', description: '安全库存、最低库存、最高库存、采源预警。', rules: '最高库存不得小于最低库存。' },
  { name: '物料说明/附件', source: '富文本与附件', description: '图片、规格书、认证文件。', rules: '关键物料按策略校验证书附件。' },
];

const processListFields: PrdField[] = [
  { name: '工序编码', source: 'Process.code', description: '工序编码。', rules: '列表主链接，按工序编号规则生成。' },
  { name: '工序名称', source: 'Process.name', description: '工序显示名称。', rules: '同分类下需便于识别。' },
  { name: '工序分类', source: '工序分类设置', description: '加工、装配、检验、包装等。', rules: '分类决定默认字段和质检要求。' },
  { name: '工作中心', source: '工作中心档案', description: '默认执行工作中心。', rules: '自制工序必选。' },
  { name: '核算方式', source: '工序成本设置', description: '计时、计件或固定成本。', rules: '影响工艺成本计算。' },
  { name: '加工方式', source: 'Process.processType', description: '自制工序或委外工序。', rules: '委外工序需关联供应商和协议。' },
  { name: '质检方案', source: '质检方案', description: '工序检验方案。', rules: '检验工序和关键工序必选有效方案。' },
  { name: '状态', source: '主数据状态机', description: '启用、暂停、停用等。', rules: '停用工序不能被新工艺引用。' },
];

const processCreateFields: PrdField[] = [
  { name: '工序名称/编码', source: '人工填写/编号规则', description: '工序基础标识。', rules: '名称必填；编码按规则生成。' },
  { name: '工序分类', source: '分类选择器', description: '加工、装配、检验、包装。', rules: '必选末级分类。' },
  { name: '加工方式', source: '枚举', description: '自制工序或委外工序。', rules: '委外工序必须维护供应商或委外协议。' },
  { name: '工作中心/设备', source: '工作中心与设备选择器', description: '默认执行资源。', rules: '自制工序必填，设备需处于启用状态。' },
  { name: '工时/成本参数', source: '人工填写', description: '标准工时、辅助工时、冷却时间、加工费率。', rules: '数值不得小于 0。' },
  { name: '质检方案/SOP', source: '质检和文档选择器', description: '过程控制要求和操作说明。', rules: '关键工序提交前必填。' },
  { name: '产出/废料子表', source: '可编辑子表', description: '副产物、废料、计量单位。', rules: '数量、单位必须合法。' },
  { name: '技术参数', source: '参数子表', description: '温度、压力、公差等参数。', rules: '参数名不可重复。' },
];

const craftListFields: PrdField[] = [
  { name: '工艺编号', source: 'Craft.code', description: '工艺路线编号。', rules: '列表主链接。' },
  { name: '工艺名称', source: 'Craft.name', description: '工艺路线名称。', rules: '同产品同版本下需便于识别。' },
  { name: '适用产品', source: '产品档案', description: '该工艺适配的产品或半成品。', rules: '只能选择启用或研发状态产品。' },
  { name: '版本号', source: '工艺版本', description: '当前工艺版本。', rules: '发布后变更必须创建新版本。' },
  { name: '工艺分类', source: '工艺分类设置', description: '电子装配、焊接、表面处理、包装等。', rules: '用于列表树筛选。' },
  { name: '工序数', source: '工艺工序明细', description: '串序和并序节点中的工序数量。', rules: '自动统计，不在列表录入。' },
  { name: '并序/委外', source: '工艺路线节点', description: '并序节点数量和委外工序数量。', rules: '影响总工时和委外协同。' },
  { name: '状态/默认', source: '版本状态和默认标记', description: '版本生命周期和是否默认。', rules: '同产品同分类只能有一个默认生效工艺。' },
];

const craftCreateFields: PrdField[] = [
  { name: '工艺名称/编号', source: '人工填写/编号规则', description: '工艺基础标识。', rules: '名称必填；编号按规则生成。' },
  { name: '适用产品', source: '产品选择器', description: '选择工艺适用产品。', rules: '必选，产品不得停用。' },
  { name: '版本号/默认标记', source: '版本策略', description: '工艺版本和是否默认。', rules: '默认版本发布时需自动取消其他默认。' },
  { name: '工艺路线画布', source: '工艺节点编辑器', description: '串序、并序、委外工序组合。', rules: '提交前至少包含一个有效工序，不能存在孤立节点。' },
  { name: '工序明细', source: '工序档案/行内编辑', description: '工作中心、设备、工时、质检、SOP、成本。', rules: '停用工序不可引用；委外工序需供应商。' },
  { name: '物料消耗/产出', source: '子表', description: '每道工序的投入物料、废料和产出。', rules: '物料必须来自启用物料档案。' },
  { name: '质检控制点', source: '质检方案选择器', description: '首件、巡检、全检等控制。', rules: '关键工序必须关联有效质检方案。' },
  { name: '工艺说明/附件', source: '富文本与附件', description: '工艺描述、SOP、图纸。', rules: '提交审批时按分类校验必传附件。' },
];

const bomListFields: PrdField[] = [
  { name: 'BOM编号', source: 'Bom.code', description: 'BOM 编号。', rules: '列表主链接。' },
  { name: 'BOM名称', source: 'Bom.name', description: '物料清单名称。', rules: '同产品同类型同版本下需便于识别。' },
  { name: '适用产品', source: '产品档案', description: 'BOM 对应产品或半成品。', rules: '产品不得停用。' },
  { name: '版本号', source: 'BOM版本', description: '当前 BOM 版本。', rules: '发布后变更必须创建新版本。' },
  { name: 'BOM类型', source: 'Bom.type', description: '生产 BOM、工程 BOM、虚拟 BOM。', rules: '类型决定下游展开规则。' },
  { name: '物料数/层级', source: 'BOM明细树', description: '明细物料数量和层级深度。', rules: '自动统计，不在列表录入。' },
  { name: '状态', source: '版本状态机', description: '草稿、待审核、已生效、已停用等。', rules: '只有已生效版本可被生产正式引用。' },
  { name: '编制人/更新日期', source: '操作日志', description: '最近维护人和维护日期。', rules: '由系统写入。' },
];

const bomCreateFields: PrdField[] = [
  { name: 'BOM名称/编号', source: '人工填写/编号规则', description: 'BOM 基础标识。', rules: '名称必填；编号按规则生成。' },
  { name: '适用产品/型号', source: '产品选择器', description: '选择产品和适用型号。', rules: '必选，支持多型号适用范围。' },
  { name: 'BOM类型/版本', source: '枚举/版本策略', description: '生产、工程、虚拟 BOM 及版本号。', rules: '新建默认 V1.0。' },
  { name: 'BOM明细树', source: '可编辑树表', description: '父子件层级、物料、规格、单位、用量、损耗。', rules: '根节点必填；子件不能形成循环引用。' },
  { name: '替代料', source: '替代料子表', description: '主料对应替代料和优先级。', rules: '替代物料不得等于主物料，比例必须合法。' },
  { name: '关联工序', source: '工序选择器', description: '物料消耗对应工艺工序。', rules: '自制件建议关联工序；停用工序不可选。' },
  { name: '自定义属性', source: 'BOM属性配置', description: '材质、表面处理、工时、重量等。', rules: '必填属性提交前校验。' },
  { name: '导入/校验结果', source: 'Excel导入流程', description: '字段映射、预览校验、写入结果。', rules: '导入错误未处理时不得提交审批。' },
];

const substituteListFields: PrdField[] = [
  { name: '主物料', source: '主物料档案', description: '被替代的物料。', rules: '必须为启用或允许替代的物料。' },
  { name: '主物料编码', source: 'Material.code', description: '主物料编码。', rules: '从物料档案带入。' },
  { name: '替代物料', source: '替代物料档案', description: '可替代主物料的物料。', rules: '不得与主物料相同。' },
  { name: '替代物料编码', source: 'Material.code', description: '替代物料编码。', rules: '从物料档案带入。' },
  { name: '替代比例', source: 'Substitute.ratio', description: '主料与替代料换算比例。', rules: '格式如 1:1，数值必须大于 0。' },
  { name: '优先级', source: 'Substitute.priority', description: '多替代料匹配顺序。', rules: '同主物料下优先级不能冲突。' },
  { name: '生效/失效日期', source: 'Substitute.effectiveDate/expiryDate', description: '替代关系有效期。', rules: '失效日期不得早于生效日期。' },
  { name: '状态', source: '替代料列表状态字段', description: '启用、待审核、停用。', rules: '只展示当前页面已有的替代料状态。' },
];

const substituteCreateFields: PrdField[] = [
  { name: '主物料', source: '物料选择器', description: '选择需要替代的物料。', rules: '必选，不能停用。' },
  { name: '替代物料', source: '物料选择器', description: '选择替代料。', rules: '必选，不能与主物料一致。' },
  { name: '替代比例', source: '人工填写', description: '主料与替代料数量换算。', rules: '必填，比例两端必须大于 0。' },
  { name: '优先级', source: '人工填写', description: '替代匹配优先级。', rules: '同主物料下不可重复。' },
  { name: '有效期', source: '日期控件', description: '生效日期和失效日期。', rules: '生效日期必填，失效日期可长期。' },
  { name: '适用范围', source: 'BOM/产品选择器', description: '限制适用 BOM、产品或项目。', rules: '未选择时表示全局适用。' },
  { name: '替代原因', source: '人工填写', description: '缺料、降本、质量替代等原因。', rules: '提交审批时必填。' },
  { name: '附件', source: '附件上传', description: '认证、测试或供应商材料。', rules: '关键物料替代按策略必传附件。' },
];

function listDoc(config: RdModulePrd): PrdDocument {
  return {
    id: `${config.key}-list`,
    module: config.module,
    title: `${config.listTitle} PRD`,
    route: config.route,
    pageType: '列表页',
    objective: `集中查看${config.name}记录、状态、分类和关键字段，支持分类树、搜索、筛选、字段配置、导入、导出、新增和详情跳转。`,
    scope: [
      `展示${config.name}核心列表数据和状态分布。`,
      '提供新增、查看、编辑、提交审批、发布、停用等状态允许的入口。',
      '支持按分类、状态、负责人、日期和关键字过滤。',
      '列表页展示由新增、详情、审批或跨中心引用形成的业务结果，状态推进在对应详情或动作入口完成。',
    ],
    dataSources: config.dataSources,
    fields: config.listFields,
    states: config.states,
    flows: [],
    interactions: listInteractions,
    validations: listValidations,
    writeBacks: commonWriteBacks,
    acceptance: [
      ...config.listAcceptance,
      `用户可以在${config.listTitle}查看${config.name}核心信息、状态分布和分类结果。`,
      `用户可以通过分类树、状态筛选、关键字搜索和导出能力定位${config.name}记录。`,
      `点击新增进入${config.createTitle}，点击编号或名称进入对应详情。`,
      '无数据、加载中、筛选为空、权限不足等场景均给出明确界面反馈。',
    ],
    sectionIds: ['details', 'fields', 'states', 'acceptance'],
  };
}

function createDoc(config: RdModulePrd): PrdDocument {
  return {
    id: `${config.key}-create`,
    module: config.module,
    title: `${config.createTitle} PRD`,
    route: appendQuery(config.route, 'action=new'),
    pageType: '新增/编辑页',
    objective: `创建或编辑${config.name}资料，确保编号、分类、关键字段、明细子表、附件、审批和后续记录可追溯。`,
    scope: [
      `录入${config.name}基础信息、业务属性、说明和附件。`,
      '维护当前模块必要的明细子表、引用对象或导入结果。',
      '支持保存草稿、提交审批、保存并启用等页面动作。',
      '保存后进入列表或详情，并保留操作日志。',
    ],
    dataSources: config.dataSources,
    fields: config.createFields,
    states: [],
    flows: [],
    interactions: createInteractions,
    validations: createValidations,
    writeBacks: commonWriteBacks,
    acceptance: [
      ...config.createAcceptance,
      `用户可以完成${config.createTitle}的基础信息、业务属性、明细、附件和引用对象维护。`,
      '保存草稿、提交审批或保存启用后，页面给出结果提示并进入列表或详情。',
      '保存成功后列表刷新、详情回显和操作记录保持一致。',
      '编辑已发布或已生效对象时生成新版本或变更草稿，历史快照保持可追溯。',
    ],
    sectionIds: ['fields', 'acceptance'],
  };
}

function rdDetailFields(config: RdModulePrd): PrdField[] {
  if (config.key === 'rd-projects') {
    return [
      { name: '项目详情', source: 'RdResourcePage.detailRecord.sections.detail', description: '项目基础信息、说明、附件和操作记录。', rules: '按详情母版展示，来源于 rd/resources.ts 的项目详情数据。' },
      { name: '项目成员', source: 'RdResourcePage.activeDetailTab=members', description: '项目成员 Tab，展示姓名、角色、加入时间，并在可编辑阶段支持新增成员。', rules: '新增成员必须通过人员选择器，锁定或非编辑阶段按钮禁用。' },
      { name: '项目BOM', source: 'RdResourcePage.activeDetailTab=materials', description: '项目 BOM Tab，支持引用 BOM、添加 BOM、导入 Excel、锁定 BOM。', rules: '只有项目阶段允许时可维护，锁定后作为采购、报价和生产版本基准。' },
      { name: '项目工艺', source: 'RdResourcePage.activeDetailTab=process', description: '项目工艺 Tab，支持选择工艺流程、添加工艺流程、锁定工艺。', rules: '锁定后作为报价和生产的工艺基准。' },
      { name: '项目报价', source: 'RdResourcePage.activeDetailTab=quote', description: '项目报价 Tab，展示成本项、当前成本估算、预计成本波动和预计成本。', rules: '未具备 BOM/工艺或不允许调整时，新增成本项和锁定报价按钮禁用。' },
      { name: '采购进度', source: 'RdResourcePage.activeDetailTab=purchase', description: '项目采购进度 Tab。', rules: '报价确认后才允许从项目物料清单发起采购。' },
      { name: '生产进度', source: 'RdResourcePage.activeDetailTab=production', description: '项目生产进度 Tab。', rules: '报价确认后才允许下单生产需求。' },
      { name: '项目成本', source: 'RdResourcePage.activeDetailTab=expense', description: '项目成本 Tab，维护 BOM、工艺之外的差旅、测试、外协等成本项目。', rules: '只有项目允许补充成本时可新增成本项目。' },
      { name: '操作记录', source: 'RdResourcePage.activeDetailTab=logs', description: '项目操作时间线。', rules: '展示操作人、动作和时间，保持只读追溯。' },
    ];
  }

  if (config.key === 'rd-crafts') {
    return [
      { name: '详情头部', source: 'RdDetailRecord.title/code/statusText/metas', description: '工艺详情标题、编号、状态和摘要信息。', rules: '按 AwDetailHeader 展示。' },
      { name: '工艺路线', source: 'RdDetailCraftRouteSection', description: '工艺路线详情，展示串序、并序、自制和委外节点。', rules: '节点来自 rd/resources.ts，不凭空新增路线。' },
      { name: '工序明细', source: 'RdDetailTableSection', description: '工艺关联工序、工作中心、工时、质检要求等表格。', rules: '停用工序和委外工序按真实详情数据展示。' },
      { name: '附件/说明', source: 'RdDetailAttachmentSection/RdDetailRichTextSection', description: '工艺说明、SOP、图纸等详情内容。', rules: '附件只读展示查看和下载入口。' },
      { name: '操作记录', source: 'RdDetailTimelineSection', description: '工艺审批、发布和维护记录。', rules: '按详情时间线展示，不在 PRD 中新增未实现动作。' },
    ];
  }

  if (config.key === 'rd-boms') {
    return [
      { name: '详情头部', source: 'RdDetailRecord.title/code/statusText/metas', description: 'BOM 详情标题、编号、状态和摘要信息。', rules: '按 AwDetailHeader 展示。' },
      { name: 'BOM明细树', source: 'RdDetailBomTreeSection', description: 'BOM 树表展示行号、物料编码、物料名称、规格、适用型号、用量、单位、物料类型、替代料、损耗、毛用量、关联工序、单价、小计。', rules: '支持展开/收起层级，成本和毛用量按当前详情数据计算展示。' },
      { name: '基础信息', source: 'RdDetailFieldsSection', description: 'BOM 基础信息、版本、适用产品等字段。', rules: '来源于 rd/resources.ts 的详情记录。' },
      { name: '附件/操作记录', source: 'RdDetailAttachmentSection/RdDetailTimelineSection', description: '导入文件、审批附件和操作留痕。', rules: '附件和日志只读展示。' },
    ];
  }

  return [
    { name: '详情头部', source: 'RdDetailRecord.title/code/statusText/metas', description: `${config.name}详情页头部信息。`, rules: '按 AwDetailPage、AwDetailToolbar、AwDetailHeader 母版展示。' },
    { name: '基础信息', source: 'RdDetailFieldsSection', description: `${config.name}基础字段信息块。`, rules: '字段来自 rd/resources.ts 对应详情记录。' },
    { name: '业务明细', source: 'RdDetailTableSection', description: `${config.name}相关明细表。`, rules: '表格列和行以当前详情数据为准。' },
    { name: '说明/附件', source: 'RdDetailRichTextSection/RdDetailAttachmentSection', description: `${config.name}说明内容和附件。`, rules: '附件支持查看和下载展示，不在详情页直接上传。' },
    { name: '操作记录', source: 'RdDetailTimelineSection', description: `${config.name}操作日志。`, rules: '展示操作人、动作、时间和结果。' },
  ];
}

function detailDoc(config: RdModulePrd): PrdDocument {
  const detailAcceptance = [
    `用户可以从${config.listTitle}进入${config.name}详情。`,
    '详情头部、状态、摘要、基础信息、明细、附件和操作记录与当前 resources 数据一致。',
  ];
  if (config.key === 'rd-projects') {
    detailAcceptance.push('项目详情中的成员、BOM、工艺、报价、采购、生产、成本和日志 Tab 可按真实状态切换。');
  }
  if (config.key === 'rd-crafts' || config.key === 'rd-boms') {
    detailAcceptance.push('工艺和 BOM 详情可展示真实路线或树表结构，不出现未实现字段。');
  }
  return {
    id: `${config.key}-detail`,
    module: config.module,
    title: `${config.name}详情 PRD`,
    route: `${config.route}?id={id}`,
    pageType: '详情页',
    objective: `查看${config.name}的头部摘要、基础信息、业务明细、附件说明、操作记录和当前状态允许的动作。`,
    scope: [
      '使用统一详情页母版展示返回、动作、头部、摘要、Tab 或信息块。',
      `展示${config.name}从列表点击后的真实详情数据。`,
      '详情页动作按当前状态、锁定标记和页面权限启用或禁用。',
      '详情内容只按当前页面和 resources 已有结构说明，不补写未实现的业务流程。',
    ],
    dataSources: config.dataSources,
    fields: rdDetailFields(config),
    states: config.states,
    flows: [],
    interactions: [
      '点击列表编号或名称进入详情。',
      '顶部动作由 RdDetailRecord.actions 控制，禁用原因在页面中以提示或按钮状态体现。',
      'Tab 或详情区切换不改变业务数据，只切换展示区域。',
      '附件、时间线和来源记录保持只读追溯。',
    ],
    validations: ['无效 id 展示加载或空状态，不允许回退为任意第一条数据。', '锁定后的 BOM、工艺、报价等项目数据不得在详情页继续编辑。', '详情动作必须与当前状态和权限一致。'],
    writeBacks: ['详情页动作完成后回写当前研发对象状态、操作人、操作时间和操作记录。', '跨采购、生产、销售等来源只记录引用摘要和版本快照。'],
    acceptance: detailAcceptance,
    sectionIds: ['details', 'fields', 'states', 'acceptance'],
  };
}

function moduleSettingDoc(config: RdModulePrd): PrdDocument {
  return {
    id: `${config.key}-settings`,
    module: `${config.module}设置`,
    title: `${config.name}设置 PRD`,
    route: appendQuery(config.route, 'setting=fields'),
    pageType: '设置页',
    objective: `维护${config.name}的分类、字段、编号、审批、策略和打印模板，使列表页和新增页读取统一配置。`,
    scope: ['分类设置', '自定义字段', '编号规则', '审批流程', '业务策略', '打印模板'],
    dataSources: rdDataSources.settings,
    fields: [
      { name: '分类设置', source: '研发设置', description: `${config.name}的分类树、排序和启停状态。`, rules: '被历史对象引用的分类停用需提示影响范围。' },
      { name: '自定义字段', source: '字段配置', description: '列表、详情、新增页的扩展字段。', rules: '字段编码按配置规范维护，发布后保留历史字段快照。' },
      { name: '编号规则', source: '编号配置', description: `${config.name}自动编号前缀、日期段、流水号。`, rules: '规则发布后只影响新建对象。' },
      { name: '审批流程', source: '审批配置', description: '提交审批后的节点、审批人、转交和退回规则。', rules: '影响业务流转规则的流程必须审批发布。' },
      { name: '策略设置', source: '策略配置', description: '启用、停用、发布、锁版、引用校验等规则。', rules: '策略修改保留生效时间和操作人。' },
      { name: '打印模板', source: '模板配置', description: '详情打印或导出模板。', rules: '模板停用后不可被新打印任务选择。' },
    ],
    states: [],
    flows: [],
    interactions: ['设置页必须复用公共设置母版。', '设置项支持新增、编辑、停用、排序和发布。', '字段、编号、审批、策略必须可追溯历史版本。'],
    validations: ['字段编码、分类编码、编号规则必须符合配置规范。', '影响状态推进或下游引用的策略必须审批。', '停用被引用配置时必须展示影响范围。'],
    writeBacks: ['设置页不修改历史业务对象，只影响新建对象和后续动作校验。'],
    acceptance: ['用户可以从对应模块设置入口进入设置页。', '字段、编号、审批、策略、打印模板均可配置并发布。', '发布后新增页和列表页读取最新配置。', '历史对象保留旧配置快照。'],
    sectionIds: ['fields'],
  };
}

type TreeLevel = PrdTreeNode['level'];

function nextTreeLevel(level: TreeLevel): TreeLevel {
  return Math.min(level + 1, 4) as TreeLevel;
}

function treePage(docId: string, label: string, sectionIds: PrdSectionId[] = ['fields'], level: TreeLevel = 2): PrdTreeNode {
  const childLevel = nextTreeLevel(level);
  return {
    id: `rd-page-${docId}`,
    label,
    level,
    docId,
    children: prdSections.filter((section) => sectionIds.includes(section.id)).map((section) => ({
      id: `rd-${docId}-${section.id}`,
      label: section.label,
      level: childLevel,
      docId,
      sectionId: section.id,
    })),
  };
}

function rdModulePages(config: RdModulePrd): PrdTreeNode[] {
  return [
    treePage(`${config.key}-create`, config.createTitle, ['fields', 'acceptance'], 3),
    treePage(`${config.key}-list`, config.listTitle, ['details', 'fields', 'states', 'acceptance'], 3),
    treePage(`${config.key}-detail`, `${config.name}详情`, ['details', 'fields', 'states', 'acceptance'], 3),
    treePage(`${config.key}-settings`, `${config.name}设置`, ['fields'], 3),
  ];
}

const rdNavigationGroups = [
  { key: 'doc', label: '文档库', moduleKeys: ['rd-docs'] },
  { key: 'project', label: '项目管理', moduleKeys: ['rd-projects'] },
  { key: 'product', label: '产品管理', moduleKeys: ['rd-products'] },
  { key: 'material', label: '物料管理', moduleKeys: ['rd-materials'] },
  { key: 'process', label: '工序管理', moduleKeys: ['rd-processes'] },
  { key: 'craft', label: '工艺管理', moduleKeys: ['rd-crafts'] },
  { key: 'bom', label: 'BOM管理', moduleKeys: ['rd-boms', 'rd-bom-substitutes'] },
];

function rdNavigationTreeGroup(group: { key: string; label: string; moduleKeys: string[] }): PrdTreeNode {
  const modules = group.moduleKeys
    .map((moduleKey) => rdModules.find((item) => item.key === moduleKey))
    .filter((item): item is RdModulePrd => Boolean(item));
  return {
    id: `rd-${group.key}-module`,
    label: group.label,
    level: 2,
    children: modules.flatMap((config) => rdModulePages(config)),
  };
}

function appendQuery(route: string, query: string) {
  return `${route}${route.includes('?') ? '&' : '?'}${query}`;
}

const rdModules: RdModulePrd[] = [
  {
    key: 'rd-docs',
    module: '文档库',
    name: '文档',
    route: '/rd/doc',
    listTitle: '文档库列表',
    createTitle: '新增文档',
    dataSources: rdDataSources.docs,
    listFields: docListFields,
    createFields: docCreateFields,
    states: docStates,
    listAcceptance: ['分类树数量和列表筛选结果一致。', '文档引用次数可追溯到引用对象。'],
    createAcceptance: ['正文和附件策略校验完整。', '已发布文档编辑时生成新版本草稿。'],
  },
  {
    key: 'rd-projects',
    module: '项目管理',
    name: '项目',
    route: '/rd/projects',
    listTitle: '项目列表',
    createTitle: '新增项目',
    dataSources: rdDataSources.projects,
    listFields: projectListFields,
    createFields: projectCreateFields,
    states: projectStates,
    listAcceptance: ['项目状态决定详情中 BOM、工艺、报价、采购、生产动作是否可用。', '进度、周期、优先级能驱动工作台风险提醒。'],
    createAcceptance: ['项目周期、预算、负责人、成员和来源客户/合同校验完整。', '审批通过前不得发起采购或生产。'],
  },
  {
    key: 'rd-products',
    module: '产品管理',
    name: '产品',
    route: '/rd/products',
    listTitle: '产品列表',
    createTitle: '新增产品',
    dataSources: rdDataSources.products,
    listFields: productListFields,
    createFields: productCreateFields,
    states: productStates,
    listAcceptance: ['产品状态按当前列表和 mock 真实值展示；未在真实筛选中出现的在售、停产等生命周期只作为后续预留口径。', '多型号产品在详情中可维护规格选项。'],
    createAcceptance: ['单位、分类、销售控制、库存策略和质检方案校验完整。', '自制产品提交时提示 BOM 和工艺维护要求。'],
  },
  {
    key: 'rd-materials',
    module: '物料管理',
    name: '物料',
    route: '/rd/materials',
    listTitle: '物料列表',
    createTitle: '新增物料',
    dataSources: rdDataSources.materials,
    listFields: materialListFields,
    createFields: materialCreateFields,
    states: materialStates,
    listAcceptance: ['物料状态按当前列表和 mock 真实值展示；禁止采购等未核实状态只作为后续预留口径。', '物料分类树和列表数量一致。'],
    createAcceptance: ['外购物料必须校验供应商和采购单位换算。', '库存策略和采源预警字段规则完整。'],
  },
  {
    key: 'rd-processes',
    module: '工序管理',
    name: '工序',
    route: '/rd/processes',
    listTitle: '工序列表',
    createTitle: '新增工序',
    dataSources: rdDataSources.processes,
    listFields: processListFields,
    createFields: processCreateFields,
    states: processStates,
    listAcceptance: ['停用工序不会被新工艺选择，历史工艺保留快照。', '工序筛选覆盖分类、加工方式、质检方案和状态。'],
    createAcceptance: ['委外工序、自制工序、关键质检工序的必填项差异校验完整。', '工时、成本、产出、废料和技术参数子表可校验。'],
  },
  {
    key: 'rd-crafts',
    module: '工艺管理',
    name: '工艺',
    route: '/rd/crafts',
    listTitle: '工艺列表',
    createTitle: '新增工艺',
    dataSources: rdDataSources.crafts,
    listFields: craftListFields,
    createFields: craftCreateFields,
    states: craftStates,
    listAcceptance: ['同产品同分类只能有一个默认已生效工艺。', '工序数、并序数、委外数由明细自动统计。'],
    createAcceptance: ['路线画布不得存在孤立节点或停用工序。', '发布后生产引用锁定当前工艺版本。'],
  },
  {
    key: 'rd-boms',
    module: 'BOM管理',
    name: 'BOM',
    route: '/rd/bom',
    listTitle: 'BOM列表',
    createTitle: '新增BOM',
    dataSources: rdDataSources.boms,
    listFields: bomListFields,
    createFields: bomCreateFields,
    states: bomStates,
    listAcceptance: ['BOM 物料数、层级、成本由明细自动汇总。', '已生效版本可被项目、报价和生产锁版引用。'],
    createAcceptance: ['BOM 明细树循环引用、停用物料、单位、用量、损耗和导入错误校验完整。', '发布后历史引用保留版本快照。'],
  },
  {
    key: 'rd-bom-substitutes',
    module: 'BOM管理',
    name: '代替物料',
    route: '/rd/bom?tab=substitute',
    listTitle: '代替列表',
    createTitle: '新增代替',
    dataSources: rdDataSources.substitutes,
    listFields: substituteListFields,
    createFields: substituteCreateFields,
    states: substituteStates,
    listAcceptance: ['启用、待审核、停用状态与列表展示一致。', '同主物料优先级冲突可被列表和新增页发现。'],
    createAcceptance: ['主物料和替代物料不能相同，比例、优先级、有效期、适用范围校验完整。', '启用后 BOM 展开和齐套计算可读取替代关系。'],
  },
];

const rdBusinessFlowDoc: PrdDocument = {
  id: 'rd-business-flow',
  module: '研发中心',
  title: '研发中心业务流程 PRD',
  route: '/rd',
  pageType: '中心业务流程',
  objective: '按研发中心统一整理文档、项目、产品、物料、工序、工艺、BOM 和替代料的跨页面业务流转，说明工作台、列表、新增、设置和跨中心引用的衔接关系。',
  scope: ['研发中心级业务流程', '研发主数据流转', '版本与审批闭环', '跨销售、采购、生产、质检引用回写'],
  dataSources: rdDataSources.workbench,
  fields: [],
  states: [],
  flows: [
    { step: '1', role: '研发人员', action: '从研发工作台进入待办、风险提醒、文档、项目、产品、物料、工序、工艺、BOM 或替代料页面。', output: '待处理研发对象。' },
    { step: '2', role: '研发人员', action: '新增或维护文档、项目、产品、物料和工序基础资料，补齐分类、负责人、附件和关键字段。', output: '研发基础资料草稿。' },
    { step: '3', role: '工艺工程师', action: '基于产品和物料维护工艺路线、BOM 版本、替代料关系和相关技术文件。', output: '可提交审批的研发版本资料。' },
    { step: '4', role: '审批人', action: '对文档、项目、主数据、工艺、BOM 或替代料进行审核、退回、驳回或发布。', output: '生效或需修改的研发对象。' },
    { step: '5', role: '系统', action: '已生效研发对象被销售、采购、生产、质检引用，引用关系写入跨中心摘要。', output: '跨中心可引用数据。' },
    { step: '6', role: '系统', action: '引用、变更、停用和版本升级结果回写研发工作台、列表状态和操作日志。', output: '研发中心业务闭环结果。' },
  ],
  interactions: ['从研发工作台、导航分组或列表入口进入流程相关页面。', '流程步骤按研发主数据、版本审批和跨中心引用顺序展示。', '每个步骤说明负责角色、处理动作和业务输出。'],
  validations: ['流程按审批、版本、生效、停用和引用校验推进。', '跨中心引用必须保留来源对象、版本快照和操作日志。'],
  writeBacks: ['流程结果回写研发工作台统计、各列表状态、版本引用摘要和跨中心引用记录。'],
  acceptance: ['研发中心业务流程能说明主要页面之间的先后关系。', '工作台待办、列表状态、版本审批和跨中心引用在流程中有对应说明。', '流程覆盖研发主数据、版本审批和跨中心引用闭环。'],
  sectionIds: ['flows'],
};

export const rdPrdDocuments: PrdDocument[] = [
  {
    id: 'rd-workbench',
    module: '研发工作台',
    title: '研发工作台 PRD',
    route: '/rd',
    pageType: '工作台',
    objective: '汇总研发中心文档、项目、产品、物料、工序、工艺、BOM 和审批待办，提供风险提醒和业务导航，不承载复杂编辑。',
    scope: ['研发待办统计', '项目风险提醒', 'BOM/工艺缺失提醒', '审批队列入口', '业务导航入口', '跨中心引用摘要'],
    dataSources: rdDataSources.workbench,
    fields: [
      { name: '待审批文档', source: '研发工作台 kpis', description: '文档库中等待审批处理的文档数量。', rules: '必须作为待办事项卡片展示，点击进入文档库并带审批状态筛选。' },
      { name: '待评审项目', source: '研发工作台 kpis', description: '项目管理中等待阶段评审或立项评审的项目数量。', rules: '必须作为待办事项卡片展示，点击进入项目列表并带评审筛选。' },
      { name: '待发布产品', source: '研发工作台 kpis', description: '产品管理中审批通过但尚未发布或启用的产品数量。', rules: '必须作为待办事项卡片展示，点击进入产品列表并带发布筛选。' },
      { name: '待维护物料', source: '研发工作台 kpis', description: '物料管理中资料不完整、策略未补齐或需要维护的物料数量。', rules: '必须作为待办事项卡片展示，点击进入物料列表并带维护筛选。' },
      { name: '待完善工序', source: '研发工作台 kpis', description: '工序管理中工时、参数、质检或关联文档待完善的工序数量。', rules: '必须作为待办事项卡片展示，点击进入工序列表并带完善筛选。' },
      { name: '待审核工艺', source: '研发工作台 kpis', description: '工艺管理中等待审批或审核确认的工艺版本数量。', rules: '必须作为待办事项卡片展示，点击进入工艺列表并带审核筛选。' },
      { name: '待提交BOM', source: '研发工作台 kpis', description: 'BOM 管理中尚未提交审批或需要补齐明细的 BOM 数量。', rules: '必须作为待办事项卡片展示，点击进入 BOM 列表并带提交筛选。' },
      { name: '待确认替代料', source: '研发工作台 kpis', description: '替代料库中等待确认、审批或启用的替代关系数量。', rules: '必须作为待办事项卡片展示，点击进入替代料列表并带确认筛选。' },
      { name: '待处理版本变更', source: '研发工作台 kpis', description: '文档、产品、工艺或 BOM 中待处理的版本变更数量。', rules: '必须作为待办事项卡片展示，点击进入对应版本对象并带变更筛选。' },
      { name: '待补充研发附件', source: '研发工作台 kpis', description: '研发对象中附件、图纸、SOP、审批材料待补充的数量。', rules: '必须作为待办事项卡片展示，点击进入对应对象并带附件缺失筛选。' },
    ],
    states: [],
    flows: [],
    interactions: ['保持工作台为总览和跳转页面，不提供复杂编辑表单。', '卡片点击必须带入对应模块和筛选条件。', '风险队列按逾期、优先级、计划日期排序。'],
    validations: ['工作台统计口径必须与各列表页一致。', '所有风险项必须能追溯到具体研发对象。', '无权限用户只能看到授权范围内统计。'],
    writeBacks: ['工作台不直接回写业务对象，只展示其他页面处理后的结果。'],
    acceptance: ['用户可以从工作台跳转到文档、项目、产品、物料、工序、工艺、BOM 页面。', '待办和风险数量与列表筛选结果一致。', '每个待办或风险项都能追溯到具体研发对象。'],
    sectionIds: ['fields'],
  },
  rdBusinessFlowDoc,
  ...rdModules.flatMap((config) => [listDoc(config), createDoc(config), detailDoc(config), moduleSettingDoc(config)]),
];

export const rdPrdTree: PrdTreeNode[] = [
  {
    id: 'rd-center',
    label: '研发中心',
    level: 1,
    children: [
      treePage('rd-workbench', '工作台', ['fields']),
      treePage('rd-business-flow', '业务流程', ['flows']),
      ...rdNavigationGroups.map((group) => rdNavigationTreeGroup(group)),
    ],
  },
];
