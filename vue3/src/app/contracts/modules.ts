export interface ContractResource {
  title: string;
  path: string;
  apiPath: string;
  status: '完整' | '较完整' | '部分' | '预留';
  prototype: string;
  description: string;
}

export interface ContractCenter {
  key: string;
  title: string;
  basePath: string;
  resources: ContractResource[];
}

export const contractCenters: ContractCenter[] = [
  {
    key: 'rd',
    title: '研发中心',
    basePath: '/rd',
    resources: [
      { title: '文档库', path: '/rd/doc', apiPath: '/rd-documents', status: '较完整', prototype: 'doc-list.jsx', description: '研发文档、分类、制度、表格和版本记录' },
      { title: '项目管理', path: '/rd/projects', apiPath: '/rd-projects', status: '较完整', prototype: 'project-list.jsx', description: '研发项目、阶段、成员、任务和评审' },
      { title: '产品管理', path: '/rd/products', apiPath: '/rd-products', status: '较完整', prototype: 'product-list.jsx', description: '产品档案、规格型号、版本和研发状态' },
      { title: '物料管理', path: '/rd/materials', apiPath: '/rd-materials', status: '较完整', prototype: 'material-list.jsx', description: '物料档案、规格属性、替代料和使用范围' },
      { title: '工序管理', path: '/rd/processes', apiPath: '/rd-processes', status: '较完整', prototype: 'process-list.jsx', description: '工序档案、工序参数、质检点和资源要求' },
      { title: '工艺管理', path: '/rd/crafts', apiPath: '/rd-crafts', status: '较完整', prototype: 'craft-list.jsx', description: '工艺路线、工艺版本、工序明细和发布记录' },
      { title: 'BOM管理', path: '/rd/bom', apiPath: '/rd-boms', status: '较完整', prototype: 'bom-new-screen.jsx', description: 'BOM结构、版本、替代料、损耗和发布' },
    ],
  },
  {
    key: 'sales',
    title: '销售中心',
    basePath: '/sales',
    resources: [
      { title: '客户管理', path: '/sales/customers', apiPath: '/customers', status: '完整', prototype: 'customer-list.jsx', description: '客户档案、联系人、地址、开票、信用额度' },
      { title: '在售产品', path: '/sales/products', apiPath: '/rd-products', status: '较完整', prototype: '复用 RdResourcePage', description: '销售中心在售产品入口，复用研发产品档案并将状态展示为在售' },
      { title: '在售物料', path: '/sales/materials', apiPath: '/rd-materials', status: '较完整', prototype: '复用 RdResourcePage', description: '销售中心在售物料入口，复用研发物料档案并将状态展示为在售' },
      { title: '销售计划', path: '/sales/sales-plans', apiPath: '/sales-plans', status: '完整', prototype: 'sales-plan-list.jsx', description: '销售目标、计划周期、达成率' },
      { title: '报价管理', path: '/sales/sales-quotes', apiPath: '/sales-quotes', status: '完整', prototype: 'quote-list.jsx', description: '报价单、价格版本、转化记录' },
      { title: '合同管理', path: '/sales/sales-contracts', apiPath: '/sales-contracts', status: '完整', prototype: 'contract-list.jsx', description: '合同、履约、订单核销、开票回款' },
      { title: '订单管理', path: '/sales/sales-orders', apiPath: '/sales-orders', status: '完整', prototype: 'sale-order-list.jsx', description: '销售订单、发货、生产、应收、回款' },
      { title: '销售退货', path: '/sales/sales-returns', apiPath: '/sales-returns', status: '预留', prototype: '导航预留', description: '退货单与退货明细' },
      { title: '销售换货', path: '/sales/sales-exchanges', apiPath: '/sales-exchanges', status: '预留', prototype: '导航预留', description: '换货单与换货明细' },
      { title: '销售报表', path: '/sales/sales-reports', apiPath: '/sales-reports', status: '预留', prototype: '导航预留', description: '按客户、产品、退换货统计' },
    ],
  },
  {
    key: 'purchase',
    title: '采购中心',
    basePath: '/purchase',
    resources: [
      { title: '供应商管理', path: '/purchase/suppliers', apiPath: '/suppliers', status: '较完整', prototype: 'supplier-list.jsx', description: '供应商档案、联系人、地址、财务、供货产品' },
      { title: '物料管理', path: '/purchase/materials', apiPath: '/rd-materials', status: '较完整', prototype: '复用 RdResourcePage', description: '采购中心物料管理入口，复用研发物料档案' },
      { title: '请购管理', path: '/purchase/purchase-requests', apiPath: '/purchase-requests', status: '较完整', prototype: 'pr-list.jsx', description: '请购单、请购明细、转询价、转采购' },
      { title: '询价管理', path: '/purchase/purchase-inquiries', apiPath: '/purchase-inquiries', status: '较完整', prototype: 'inquiry-list.jsx', description: '询价单、供应商报价、定价、临时供应商' },
      { title: '采购订单', path: '/purchase/purchase-orders', apiPath: '/purchase-orders', status: '较完整', prototype: 'order-list.jsx', description: '采购订单、到货、入库、付款、三单匹配' },
      { title: '采购退货', path: '/purchase/purchase-returns', apiPath: '/purchase-returns', status: '预留', prototype: '导航预留', description: '退货单与退货明细' },
      { title: '采购换货', path: '/purchase/purchase-exchanges', apiPath: '/purchase-exchanges', status: '预留', prototype: '导航预留', description: '换货单与换货明细' },
      { title: '采购报表', path: '/purchase/purchase-reports', apiPath: '/purchase-reports', status: '预留', prototype: '导航预留', description: '供应商对账、按产品统计' },
    ],
  },
  {
    key: 'warehouse',
    title: '仓库中心',
    basePath: '/warehouse',
    resources: [
      { title: '仓库产品库', path: '/storehouse/products', apiPath: '/rd-products', status: '较完整', prototype: '复用 RdResourcePage', description: '仓库中心产品入口，复用研发产品档案并将状态展示为启用' },
      { title: '仓库物料管理', path: '/storehouse/materials', apiPath: '/rd-materials', status: '较完整', prototype: '复用 RdResourcePage', description: '仓库中心物料入口，复用研发物料档案并将状态展示为启用' },
      { title: '仓库管理', path: '/storehouse/warehouse-management', apiPath: '/storehouse-warehouse-management', status: '较完整', prototype: 'StorehouseWarehouseManagement.vue', description: '仓库商品库存、多仓管理和仓储规则' },
      { title: '出库管理', path: '/storehouse/outbound-management', apiPath: '/storehouse-outbounds', status: '较完整', prototype: 'StorehouseInoutManagement.vue', description: '出库单列表、产品明细、分拣记录、质检记录和出库动作' },
      { title: '入库管理', path: '/storehouse/inbound-management', apiPath: '/storehouse-inbounds', status: '较完整', prototype: 'StorehouseInoutManagement.vue', description: '入库单列表、产品明细、质检记录、上架记录和入库动作' },
      { title: '订单分拣', path: '/storehouse/sorting-delivery', apiPath: '/storehouse-sorting', status: '较完整', prototype: 'StorehouseSortingDelivery.vue', description: '分拣任务、分拣弹窗、质检执行和完成分拣' },
      { title: '发货配送', path: '/storehouse/shipping-delivery', apiPath: '/storehouse-shipping', status: '较完整', prototype: 'StorehouseShippingDelivery.vue', description: '发货配送、物流变更、收货凭据和装车确认' },
      { title: '仓库销售订单', path: '/storehouse/sales-orders', apiPath: '/storehouse-sales-orders', status: '较完整', prototype: 'StorehouseSalesOrders.vue', description: '仓库视角销售订单、分拣记录、发货记录和批量发货' },
      { title: '来料管理', path: '/storehouse/incoming-material', apiPath: '/storehouse-incoming-materials', status: '较完整', prototype: 'StorehouseIncomingMaterial.vue', description: '来料台账、归属调整、冻结、出入库明细和库存分布' },
      { title: '库存预警', path: '/storehouse/inventory-warning', apiPath: '/storehouse-inventory-warning', status: '较完整', prototype: 'StorehouseWarehouseManagement.vue', description: '库存预警值、库存状态和预警处理' },
      { title: '旧库存管理', path: '/warehouse/inventory-stocks', apiPath: '/inventory-stocks', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，顶部导航已隐藏；新验收主线使用 /storehouse/warehouse-management 与 /storehouse/inventory-warning' },
      { title: '旧入库管理', path: '/warehouse/warehouse-inbounds', apiPath: '/warehouse-inbounds', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，当前仅承接新入库页新增按钮跳转；新验收主线使用 /storehouse/inbound-management' },
      { title: '旧出库管理', path: '/warehouse/warehouse-outbounds', apiPath: '/warehouse-outbounds', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，当前仅承接新出库页新增按钮跳转；新验收主线使用 /storehouse/outbound-management' },
      { title: '旧调拨管理', path: '/warehouse/warehouse-transfers', apiPath: '/warehouse-transfers', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，顶部导航已隐藏；新仓库中心当前未提供独立调拨主页面' },
      { title: '旧盘点管理', path: '/warehouse/inventory-counts', apiPath: '/inventory-counts', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，顶部导航已隐藏；新仓库中心当前未提供独立盘点主页面' },
      { title: '旧仓库库位', path: '/warehouse/warehouse-locations', apiPath: '/warehouse-locations', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，顶部导航已隐藏；新验收主线使用 /storehouse/warehouse-management 的仓库管理、多仓管理与仓储规则' },
      { title: '旧出库质检', path: '/warehouse/outbound-quality-inspections', apiPath: '/warehouse-quality-inspections', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，顶部导航已隐藏；新仓库中心分拣与出库详情中体现质检记录/执行' },
      { title: '旧来料质检', path: '/warehouse/inbound-quality-inspections', apiPath: '/warehouse-quality-inspections', status: '预留', prototype: '隐藏兼容路由', description: '旧仓储中心兼容入口，顶部导航已隐藏；新仓库中心入库详情与来料管理中体现质检和待检状态' },
    ],
  },
  {
    key: 'production',
    title: '生产中心',
    basePath: '/production',
    resources: [
      { title: '产品管理', path: '/production/products', apiPath: '/rd-products', status: '较完整', prototype: '复用 RdResourcePage', description: '生产中心产品入口，复用研发产品档案' },
      { title: '物料管理', path: '/production/materials', apiPath: '/rd-materials', status: '较完整', prototype: '复用 RdResourcePage', description: '生产中心物料入口，复用研发物料档案' },
      { title: '生产需求', path: '/production/production-demands', apiPath: '/production-demands', status: '完整', prototype: 'manufacturing-list.jsx', description: '需求来源、产品、数量、交付日期' },
      { title: '生产计划', path: '/production/production-plans', apiPath: '/production-plans', status: '完整', prototype: 'manufacturing-list.jsx', description: '计划周期、齐套、排产、审批' },
      { title: '生产订单', path: '/production/production-orders', apiPath: '/production-orders', status: '完整', prototype: 'manufacturing-list.jsx', description: '生产数量、BOM/工艺锁版、车间产线' },
      { title: '生产工单', path: '/production/production-work-orders', apiPath: '/production-work-orders', status: '完整', prototype: 'manufacturing-list.jsx', description: '工序、派工、报工、质检节点' },
      { title: '生产排班', path: '/production/production-schedules', apiPath: '/production-schedules', status: '完整', prototype: 'manufacturing-list.jsx', description: '班组、班次、日历、冲突校验' },
      { title: '委外加工', path: '/production/outsource-orders', apiPath: '/outsource-orders', status: '完整', prototype: 'manufacturing-list.jsx', description: '委外发料、收货、质检、入库' },
    ],
  },
];

export function findContractResource(path: string) {
  for (const center of contractCenters) {
    const resource = center.resources.find((item) => item.path === path);
    if (resource) return { center, resource };
  }

  return undefined;
}
