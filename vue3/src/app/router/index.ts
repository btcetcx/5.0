import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { contractCenters } from '@/app/contracts/modules';
import ErpShell from '@/layouts/erp-shell/ErpShell.vue';

const implementedPurchasePaths = [
  '/purchase/suppliers',
  '/purchase/purchase-requests',
  '/purchase/purchase-inquiries',
  '/purchase/purchase-orders',
];

const implementedWarehousePaths = [
  '/warehouse/inventory-stocks',
  '/warehouse/warehouse-inbounds',
  '/warehouse/warehouse-outbounds',
  '/warehouse/warehouse-transfers',
  '/warehouse/inventory-counts',
  '/warehouse/outbound-quality-inspections',
  '/warehouse/inbound-quality-inspections',
  '/warehouse/warehouse-locations',
];

const implementedProductionPaths = [
  '/production/production-demands',
  '/production/production-plans',
  '/production/production-orders',
  '/production/production-work-orders',
  '/production/production-schedules',
  '/production/outsource-orders',
];

const implementedRdPaths = [
  '/rd/doc',
  '/rd/projects',
  '/rd/products',
  '/rd/materials',
  '/rd/processes',
  '/rd/crafts',
  '/rd/bom',
];

const contractRoutes: RouteRecordRaw[] = contractCenters.flatMap((center) => [
  ...(center.key === 'sales'
    ? []
    : [
        {
          path: center.basePath.replace(/^\//, ''),
          name: `${center.key}Center`,
          component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
          meta: { title: center.title },
        },
      ]),
  ...center.resources
    .filter((resource) => {
      const purchaseImplemented = implementedPurchasePaths.includes(resource.path);
      const warehouseImplemented = implementedWarehousePaths.includes(resource.path);
      const productionImplemented = implementedProductionPaths.includes(resource.path);
      const rdImplemented = implementedRdPaths.includes(resource.path);
      return !purchaseImplemented && !warehouseImplemented && !productionImplemented && !rdImplemented && (!resource.path.startsWith('/sales/') || resource.status === '预留');
    })
    .map((resource) => ({
      path: resource.path.replace(/^\//, ''),
      name: `${center.key}-${resource.apiPath}`,
      component: () => import('@/views/contracts/ContractResourcePage.vue'),
      meta: { title: resource.title },
    })),
]);

const pendingCenterRoutes: RouteRecordRaw[] = [
  { path: 'after-sales', name: 'AfterSalesCenter', title: '售后中心' },
  { path: 'energy', name: 'EnergyCenter', title: '能耗中心' },
].flatMap((center) => [
  {
    path: center.path,
    name: center.name,
    component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
    meta: { title: center.title },
  },
  {
    path: `${center.path}/:section(.*)*`,
    name: `${center.name}Section`,
    component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
    meta: { title: center.title },
  },
]);

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: ErpShell,
    redirect: '/sales/customers',
    children: [
      {
        path: 'prd',
        name: 'PrdCenter',
        component: () => import('@/views/prd/PrdCenterPage.vue'),
        meta: { title: 'PRD 中心' },
      },
      {
        path: 'templates',
        name: 'TemplateGallery',
        component: () => import('@/views/template-gallery/TemplateGallery.vue'),
        meta: { title: '母版与公共组件库' },
      },
      {
        path: 'templates/:category',
        name: 'TemplateGalleryCategory',
        component: () => import('@/views/template-gallery/TemplateGallery.vue'),
        meta: { title: '母版与公共组件库' },
      },
      {
        path: 'settings',
        name: 'SettingsCenter',
        component: () => import('@/views/settings/SettingsCenterPage.vue'),
        meta: { title: '设置中心' },
      },
      {
        path: 'settings/accounts',
        name: 'SettingsAccounts',
        component: () => import('@/views/settings/SettingsAccountPage.vue'),
        meta: { title: '用户账号' },
      },
      {
        path: 'settings/roles',
        name: 'SettingsRoles',
        component: () => import('@/views/settings/SettingsRolePage.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'settings/permission-resources',
        name: 'SettingsPermissionResources',
        component: () => import('@/views/settings/SettingsPermissionResourcePage.vue'),
        meta: { title: '权限资源' },
      },
      {
        path: 'settings/permissions',
        name: 'SettingsPermissions',
        component: () => import('@/views/settings/SettingsPermissionPage.vue'),
        meta: { title: '权限设置' },
      },
      {
        path: 'settings/super-admins',
        name: 'SettingsSuperAdmins',
        component: () => import('@/views/settings/SettingsSuperAdminPage.vue'),
        meta: { title: '超级管理员' },
      },
      {
        path: 'settings/:section(system|security|data|integrations)',
        name: 'SettingsCenterSection',
        component: () => import('@/views/settings/SettingsCenterPage.vue'),
        meta: { title: '设置中心' },
      },
      {
        path: 'sales',
        name: 'SalesCenter',
        component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
        meta: { title: '销售中心' },
      },
      {
        path: 'sales/customers',
        name: 'SalesCustomers',
        component: () => import('@/views/sales/customers/CustomerList.vue'),
        meta: { title: '客户管理' },
      },
      {
        path: 'sales/customers/new',
        name: 'SalesCustomerCreate',
        component: () => import('@/views/sales/customers/CustomerCreate.vue'),
        meta: { title: '新增客户' },
      },
      {
        path: 'sales/customers/settings/:setting',
        name: 'SalesCustomerSetting',
        component: () => import('@/views/sales/customers/CustomerSettingPage.vue'),
        meta: { title: '客户设置' },
      },
      {
        path: 'sales/customers/:id',
        name: 'SalesCustomerDetail',
        component: () => import('@/views/sales/customers/CustomerDetail.vue'),
        meta: { title: '客户详情' },
      },
      {
        path: 'sales/sales-plans',
        name: 'SalesPlans',
        component: () => import('@/views/sales/sales-plans/SalesPlanList.vue'),
        meta: { title: '销售计划' },
      },
      {
        path: 'sales/sales-quotes',
        name: 'SalesQuotes',
        component: () => import('@/views/sales/sales-quotes/SalesQuoteList.vue'),
        meta: { title: '报价管理' },
      },
      {
        path: 'sales/sales-contracts',
        name: 'SalesContracts',
        component: () => import('@/views/sales/sales-contracts/SalesContractList.vue'),
        meta: { title: '合同管理' },
      },
      {
        path: 'sales/sales-orders',
        name: 'SalesOrders',
        component: () => import('@/views/sales/sales-orders/SalesOrderList.vue'),
        meta: { title: '订单管理' },
      },
      {
        path: 'purchase/suppliers',
        name: 'PurchaseSuppliers',
        component: () => import('@/views/purchase/PurchaseResourcePage.vue'),
        meta: { title: '供应商管理' },
      },
      {
        path: 'purchase/purchase-requests',
        name: 'PurchaseRequests',
        component: () => import('@/views/purchase/PurchaseResourcePage.vue'),
        meta: { title: '请购管理' },
      },
      {
        path: 'purchase/purchase-inquiries',
        name: 'PurchaseInquiries',
        component: () => import('@/views/purchase/PurchaseResourcePage.vue'),
        meta: { title: '询价管理' },
      },
      {
        path: 'purchase/purchase-orders',
        name: 'PurchaseOrders',
        component: () => import('@/views/purchase/PurchaseResourcePage.vue'),
        meta: { title: '采购订单' },
      },
      { path: 'rd/project', redirect: (to) => ({ path: '/rd/projects', query: to.query }) },
      { path: 'rd/product', redirect: (to) => ({ path: '/rd/products', query: to.query }) },
      { path: 'rd/material', redirect: (to) => ({ path: '/rd/materials', query: to.query }) },
      { path: 'rd/process', redirect: (to) => ({ path: '/rd/processes', query: to.query }) },
      { path: 'rd/craft', redirect: (to) => ({ path: '/rd/crafts', query: to.query }) },
      { path: 'rd/boms', redirect: (to) => ({ path: '/rd/bom', query: to.query }) },
      {
        path: 'rd/doc',
        name: 'RdDocuments',
        component: () => import('@/views/rd/RdResourcePage.vue'),
        meta: { title: '文档库' },
      },
      {
        path: 'rd/projects',
        name: 'RdProjects',
        component: () => import('@/views/rd/RdResourcePage.vue'),
        meta: { title: '项目管理' },
      },
      {
        path: 'rd/products',
        name: 'RdProducts',
        component: () => import('@/views/rd/RdResourcePage.vue'),
        meta: { title: '产品管理' },
      },
      {
        path: 'rd/materials',
        name: 'RdMaterials',
        component: () => import('@/views/rd/RdResourcePage.vue'),
        meta: { title: '物料管理' },
      },
      {
        path: 'rd/processes',
        name: 'RdProcesses',
        component: () => import('@/views/rd/RdResourcePage.vue'),
        meta: { title: '工序管理' },
      },
      {
        path: 'rd/crafts',
        name: 'RdCrafts',
        component: () => import('@/views/rd/RdResourcePage.vue'),
        meta: { title: '工艺管理' },
      },
      {
        path: 'rd/bom',
        name: 'RdBoms',
        component: () => import('@/views/rd/RdResourcePage.vue'),
        meta: { title: 'BOM管理' },
      },
      {
        path: 'warehouse/inventory-stocks',
        name: 'WarehouseInventoryStocks',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '库存管理' },
      },
      {
        path: 'warehouse/warehouse-inbounds',
        name: 'WarehouseInbounds',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '入库管理' },
      },
      {
        path: 'warehouse/warehouse-outbounds',
        name: 'WarehouseOutbounds',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '出库管理' },
      },
      {
        path: 'warehouse/warehouse-transfers',
        name: 'WarehouseTransfers',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '调拨管理' },
      },
      {
        path: 'warehouse/inventory-counts',
        name: 'WarehouseInventoryCounts',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '盘点管理' },
      },
      {
        path: 'warehouse/outbound-quality-inspections',
        name: 'WarehouseOutboundQualityInspections',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '出库质检' },
      },
      {
        path: 'warehouse/inbound-quality-inspections',
        name: 'WarehouseInboundQualityInspections',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '来料质检' },
      },
      {
        path: 'warehouse/warehouse-locations',
        name: 'WarehouseLocations',
        component: () => import('@/views/warehouse/WarehouseResourcePage.vue'),
        meta: { title: '仓库库位' },
      },
      {
        path: 'storehouse',
        name: 'StorehouseWorkbench',
        component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
        meta: { title: '仓库工作台' },
      },
      {
        path: 'storehouse/warehouse-management',
        name: 'StorehouseWarehouseManagement',
        component: () => import('@/views/storehouse/StorehouseWarehouseManagement.vue'),
        meta: { title: '仓库管理' },
      },
      {
        path: 'storehouse/inout-management',
        redirect: '/storehouse/outbound-management',
      },
      {
        path: 'storehouse/outbound-management',
        name: 'StorehouseOutboundManagement',
        component: () => import('@/views/storehouse/StorehouseInoutManagement.vue'),
        meta: { title: '出库管理' },
      },
      {
        path: 'storehouse/inbound-management',
        name: 'StorehouseInboundManagement',
        component: () => import('@/views/storehouse/StorehouseInoutManagement.vue'),
        meta: { title: '入库管理' },
      },
      {
        path: 'storehouse/sorting-delivery',
        name: 'StorehouseSortingDelivery',
        component: () => import('@/views/storehouse/StorehouseSortingDelivery.vue'),
        meta: { title: '分拣配送' },
      },
      {
        path: 'storehouse/shipping-delivery',
        name: 'StorehouseShippingDelivery',
        component: () => import('@/views/storehouse/StorehouseShippingDelivery.vue'),
        meta: { title: '发货配送' },
      },
      {
        path: 'storehouse/sales-orders',
        name: 'StorehouseSalesOrders',
        component: () => import('@/views/storehouse/StorehouseSalesOrders.vue'),
        meta: { title: '销售订单' },
      },
      {
        path: 'storehouse/:section(incoming-material|inventory-warning)',
        name: 'StorehouseSection',
        component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
        meta: { title: '仓库中心' },
      },
      {
        path: 'production/production-demands',
        name: 'ProductionDemands',
        component: () => import('@/views/production/ProductionResourcePage.vue'),
        meta: { title: '生产需求' },
      },
      {
        path: 'production/production-plans',
        name: 'ProductionPlans',
        component: () => import('@/views/production/ProductionResourcePage.vue'),
        meta: { title: '生产计划' },
      },
      {
        path: 'production/production-orders',
        name: 'ProductionOrders',
        component: () => import('@/views/production/ProductionResourcePage.vue'),
        meta: { title: '生产订单' },
      },
      {
        path: 'production/production-work-orders',
        name: 'ProductionWorkOrders',
        component: () => import('@/views/production/ProductionResourcePage.vue'),
        meta: { title: '生产工单' },
      },
      {
        path: 'production/production-schedules',
        name: 'ProductionSchedules',
        component: () => import('@/views/production/ProductionSchedulePage.vue'),
        meta: { title: '生产排班' },
      },
      {
        path: 'production/outsource-orders',
        name: 'OutsourceOrders',
        component: () => import('@/views/production/ProductionResourcePage.vue'),
        meta: { title: '委外加工' },
      },
      {
        path: 'after-sales',
        name: 'AfterSalesWorkbench',
        component: () => import('@/views/after-sales/AfterSalesWorkbench.vue'),
        meta: { title: '售后中心' },
      },
      {
        path: 'after-sales/services',
        name: 'AfterSalesServices',
        component: () => import('@/views/after-sales/AfterSalesServiceList.vue'),
        meta: { title: '售后单' },
      },
      {
        path: 'after-sales/service',
        redirect: (to) => ({ path: '/after-sales/services', query: to.query }),
      },
      {
        path: 'after-sales/tasks',
        name: 'AfterSalesTasks',
        component: () => import('@/views/after-sales/AfterSalesTaskList.vue'),
        meta: { title: '售后任务' },
      },
      {
        path: 'after-sales/execution',
        name: 'AfterSalesExecution',
        component: () => import('@/views/after-sales/AfterSalesTaskList.vue'),
        meta: { title: '处理执行' },
      },
      {
        path: 'after-sales/reports',
        name: 'AfterSalesReports',
        component: () => import('@/views/after-sales/AfterSalesWorkbench.vue'),
        meta: { title: '报表分析' },
      },
      {
        path: 'after-sales/quality',
        name: 'AfterSalesQuality',
        component: () => import('@/views/after-sales/AfterSalesQualityList.vue'),
        meta: { title: '质量闭环' },
      },
      {
        path: 'after-sales/settings',
        name: 'AfterSalesSettings',
        component: () => import('@/views/after-sales/AfterSalesSettingPage.vue'),
        meta: { title: '售后设置' },
      },
      {
        path: 'equipment',
        name: 'EquipmentWorkbench',
        component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
        meta: { title: '设备中心' },
      },
      {
        path: 'equipment/assets',
        name: 'EquipmentAssets',
        component: () => import('@/views/equipment/EquipmentResourcePage.vue'),
        meta: { title: '设备台账' },
      },
      {
        path: 'equipment/maintenance',
        name: 'EquipmentMaintenance',
        component: () => import('@/views/equipment/EquipmentResourcePage.vue'),
        meta: { title: '保养计划' },
      },
      {
        path: 'equipment/repairs',
        name: 'EquipmentRepairs',
        component: () => import('@/views/equipment/EquipmentResourcePage.vue'),
        meta: { title: '维修记录' },
      },
      {
        path: 'equipment/inspections',
        name: 'EquipmentInspections',
        component: () => import('@/views/equipment/EquipmentResourcePage.vue'),
        meta: { title: '点检记录' },
      },
      {
        path: 'equipment/spares',
        name: 'EquipmentSpares',
        component: () => import('@/views/equipment/EquipmentResourcePage.vue'),
        meta: { title: '备件管理' },
      },
      {
        path: 'qc',
        name: 'QcCenter',
        component: () => import('@/views/contracts/ContractWorkbenchPage.vue'),
        meta: { title: '质检中心' },
      },
      {
        path: 'qc/execution',
        name: 'QcExecution',
        component: () => import('@/views/qc/QcResourcePage.vue'),
        meta: { title: '质检管理' },
      },
      {
        path: 'qc/exceptions',
        name: 'QcExceptions',
        component: () => import('@/views/qc/QcResourcePage.vue'),
        meta: { title: '异常处理' },
      },
      {
        path: 'qc/reports',
        name: 'QcReports',
        component: () => import('@/views/qc/QcResourcePage.vue'),
        meta: { title: '质检分析' },
      },
      {
        path: 'qc/standards',
        name: 'QcStandards',
        component: () => import('@/views/qc/QcResourcePage.vue'),
        meta: { title: '质检设置' },
      },
      {
        path: 'hr',
        name: 'HrWorkbench',
        component: () => import('@/views/hr/HrWorkbench.vue'),
        meta: { title: '人力中心' },
      },
      {
        path: 'hr/employees',
        name: 'HrEmployees',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '员工管理' },
      },
      {
        path: 'hr/orgs',
        name: 'HrOrgs',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '组织机构' },
      },
      {
        path: 'hr/positions',
        name: 'HrPositions',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '岗位管理' },
      },
      {
        path: 'hr/attendance',
        name: 'HrAttendance',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '考勤管理' },
      },
      {
        path: 'hr/schedules',
        name: 'HrSchedules',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '排班管理' },
      },
      {
        path: 'hr/payroll',
        name: 'HrPayroll',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '薪酬管理' },
      },
      {
        path: 'hr/archives',
        name: 'HrArchives',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '档案管理' },
      },
      {
        path: 'hr/office',
        name: 'HrOffice',
        component: () => import('@/views/hr/HrResourcePage.vue'),
        meta: { title: '人事办公' },
      },
      {
        path: 'finance',
        name: 'FinanceWorkbench',
        component: () => import('@/views/finance/FinanceWorkbench.vue'),
        meta: { title: '财务工作台' },
      },
      {
        path: 'finance/receivables',
        name: 'FinanceReceivables',
        component: () => import('@/views/finance/FinanceResourcePage.vue'),
        meta: { title: '应收管理' },
      },
      {
        path: 'finance/payables',
        name: 'FinancePayables',
        component: () => import('@/views/finance/FinanceResourcePage.vue'),
        meta: { title: '应付管理' },
      },
      {
        path: 'finance/invoices',
        name: 'FinanceInvoices',
        component: () => import('@/views/finance/FinanceResourcePage.vue'),
        meta: { title: '发票管理' },
      },
      {
        path: 'finance/settlements',
        name: 'FinanceSettlements',
        component: () => import('@/views/finance/FinanceResourcePage.vue'),
        meta: { title: '资金核销' },
      },
      {
        path: 'finance/settings',
        name: 'FinanceSettings',
        component: () => import('@/views/finance/FinanceResourcePage.vue'),
        meta: { title: '财务设置' },
      },
      ...pendingCenterRoutes,
      ...contractRoutes,
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

