export interface FlyoutSection {
  title: string;
  items: FlyoutEntry[];
}

export interface FlyoutEntry {
  label: string;
  route?: string;
}

export interface SideNavItem {
  key: string;
  label: string;
  route: string;
  flyout?: FlyoutSection[];
}

export interface TopNavItem {
  key: string;
  label: string;
  icon: string;
  title: string;
  route: string;
  status?: 'ready' | 'pending';
  hidden?: boolean;
  sideItems: SideNavItem[];
}

const settingEntries = (name: string, route: string): FlyoutEntry[] => [
  { label: `${name}自定义字段`, route: `${route}?setting=fields` },
  { label: `${name}自定义编号`, route: `${route}?setting=numbers` },
  { label: `${name}审批设置`, route: `${route}?setting=approvals` },
  { label: `${name}策略设置`, route: `${route}?setting=strategies` },
  { label: `设置${name}打印模板`, route: `${route}?setting=print` },
];

const standardFlyout = (title: string, route: string, addLabel: string, listLabel: string, detailLabel: string): FlyoutSection[] => [
  {
    title,
    items: [
      { label: addLabel, route: `${route}?action=new` },
      { label: listLabel, route },
      { label: detailLabel, route: `${route}?id=demo_001` },
    ],
  },
  { title: `${title}设置`, items: settingEntries(title.replace(/管理$/, '').replace(/订单$/, ''), route) },
];

const purchaseFlyout = (title: string, route: string, addLabel: string, listLabel: string, detailLabel: string): FlyoutSection[] => [
  {
    title,
    items: [
      { label: addLabel, route: `${route}?action=new` },
      { label: listLabel, route },
      { label: detailLabel, route: `${route}?action=${detailLabel}` },
    ],
  },
  { title: `${title}设置`, items: settingEntries(title.replace(/管理$/, '').replace(/订单$/, ''), route) },
];

const purchaseListOnlyFlyout = (title: string, route: string, addLabel: string, listLabel: string): FlyoutSection[] => [
  {
    title,
    items: [
      { label: addLabel, route: `${route}?action=new` },
      { label: listLabel, route },
    ],
  },
  { title: `${title}设置`, items: settingEntries(title.replace(/管理$/, '').replace(/订单$/, ''), route) },
];

const productionListOnlyFlyout = (title: string, route: string, addLabel: string, listLabel: string, settingName: string): FlyoutSection[] => [
  {
    title,
    items: [
      { label: addLabel, route: `${route}?action=new` },
      { label: listLabel, route },
    ],
  },
  { title: `${settingName}设置`, items: settingEntries(settingName, route) },
];

const productionDemandFlyout = (): FlyoutSection[] => {
  const route = '/production/production-demands';
  return [
    {
      title: '生产需求',
      items: [
        { label: '新增生产需求', route: `${route}?action=new` },
        { label: '生产需求列表', route },
        { label: '生产需求汇总', route: actionRoute(route, '生产需求汇总') },
      ],
    },
    { title: '需求设置', items: settingEntries('需求', route) },
  ];
};

const productionWorkOrderFlyout = (): FlyoutSection[] => {
  const route = '/production/production-work-orders';
  return [
    {
      title: '生产工单',
      items: [
        { label: '新增生产工单', route: `${route}?action=new` },
        { label: '生产工单列表', route },
      ],
    },
    {
      title: '报工管理',
      items: [
        { label: '领工派工', route: actionRoute(route, '领工派工') },
        { label: '任务报工', route: actionRoute(route, '任务报工') },
        { label: '报工记录', route: actionRoute(route, '报工记录') },
      ],
    },
    { title: '生产工单设置', items: settingEntries('生产工单', route) },
  ];
};

const productionScheduleFlyout = (): FlyoutSection[] => {
  const route = '/production/production-schedules';
  return [
    {
      title: '生产排班',
      items: [
        { label: '排班列表', route },
        { label: '排班计划', route: actionRoute(route, '排班计划') },
        { label: '生产班组', route: actionRoute(route, '生产班组') },
        { label: '工作日历', route: actionRoute(route, '工作日历') },
        { label: '班次管理', route: actionRoute(route, '班次管理') },
      ],
    },
    {
      title: '生产排班设置',
      items: [
        { label: '排班自定义字段', route: `${route}?setting=fields` },
        { label: '排班自定义编号', route: `${route}?setting=numbers` },
        { label: '排班审批设置', route: `${route}?setting=approvals` },
        { label: '生产排班策略设置', route: `${route}?setting=strategies` },
        { label: '设置生产排班打印模板', route: `${route}?setting=print` },
      ],
    },
  ];
};

const actionRoute = (route: string, label: string) => `${route}?action=${encodeURIComponent(label)}`;

const productLibrarySideItem = (key: string, route: string): SideNavItem => ({
  key,
  label: '产品库',
  route,
  flyout: [
    {
      title: '产品库',
      items: [
        { label: '新增产品', route: `${route}?action=new` },
        { label: '产品列表', route },
      ],
    },
    {
      title: '产品库设置',
      items: [
        { label: '产品码管控', route: actionRoute(route, '产品码管控') },
        { label: '设置产品编号', route: `${route}?setting=numbers` },
        { label: '设置产品分类', route: `${route}?setting=categories` },
        { label: '设置产品品牌', route: `${route}?setting=brands` },
        { label: '设置审批流程', route: `${route}?setting=approvals` },
        { label: '设置自定义字段', route: `${route}?setting=fields` },
        { label: '设置产品策略', route: `${route}?setting=strategies` },
        { label: '设置打印模板', route: `${route}?setting=print` },
      ],
    },
  ],
});

const materialManagementSideItem = (key: string, route: string): SideNavItem => ({
  key,
  label: '物料管理',
  route,
  flyout: [
    {
      title: '物料管理',
      items: [
        { label: '新增物料', route: `${route}?action=new` },
        { label: '物料列表', route },
      ],
    },
    {
      title: '物料设置',
      items: [
        { label: '设置物料编号', route: `${route}?setting=numbers` },
        { label: '设置物料分类', route: `${route}?setting=categories` },
        { label: '设置物料品牌', route: `${route}?setting=brands` },
        { label: '设置审批流程', route: `${route}?setting=approvals` },
        { label: '设置自定义字段', route: `${route}?setting=fields` },
        { label: '设置物料策略', route: `${route}?setting=strategies` },
        { label: '设置打印模板', route: `${route}?setting=print` },
      ],
    },
  ],
});

const productManagementSideItem = (key: string, label: string, productRoute: string, materialRoute: string): SideNavItem => ({
  key,
  label,
  route: productRoute,
  flyout: [
    {
      title: '产品库',
      items: [
        { label: '新增产品', route: `${productRoute}?action=new` },
        { label: '产品列表', route: productRoute },
      ],
    },
    {
      title: '产品设置',
      items: [
        { label: '产品码管控', route: actionRoute(productRoute, '产品码管控') },
        { label: '设置产品编号', route: `${productRoute}?setting=numbers` },
        { label: '设置产品分类', route: `${productRoute}?setting=categories` },
        { label: '设置审批流程', route: `${productRoute}?setting=approvals` },
        { label: '设置自定义字段', route: `${productRoute}?setting=fields` },
        { label: '设置产品策略', route: `${productRoute}?setting=strategies` },
        { label: '设置打印模板', route: `${productRoute}?setting=print` },
      ],
    },
    {
      title: '物料管理',
      items: [
        { label: '新增物料', route: `${materialRoute}?action=new` },
        { label: '物料列表', route: materialRoute },
      ],
    },
    {
      title: '物料设置',
      items: [
        { label: '设置物料编号', route: `${materialRoute}?setting=numbers` },
        { label: '设置物料分类', route: `${materialRoute}?setting=categories` },
        { label: '设置审批流程', route: `${materialRoute}?setting=approvals` },
        { label: '设置自定义字段', route: `${materialRoute}?setting=fields` },
        { label: '设置物料策略', route: `${materialRoute}?setting=strategies` },
        { label: '设置打印模板', route: `${materialRoute}?setting=print` },
      ],
    },
  ],
});

const salesProductSideItem = (): SideNavItem => ({
  key: 'productManagement',
  label: '在售产品',
  route: '/sales/products',
  flyout: [
    {
      title: '产品库',
      items: [
        { label: '产品列表', route: '/sales/products' },
        { label: '物料列表', route: '/sales/materials' },
      ],
    },
  ],
});

const jsxFlyout = (route: string, sections: Array<{ title: string; items: string[] }>): FlyoutSection[] =>
  sections.map((section) => ({
    title: section.title,
    items: section.items.map((label) => ({ label, route: actionRoute(route, label) })),
  }));

const jsxSideItem = (
  key: string,
  label: string,
  route: string,
  sections?: Array<{ title: string; items: string[] }>,
): SideNavItem => ({
  key,
  label,
  route,
  flyout: sections ? jsxFlyout(route, sections) : undefined,
});

const financeFlyout = (route: string, sections: FlyoutSection[]): FlyoutSection[] =>
  sections.map((section) => ({
    title: section.title,
    items: section.items,
  }));

export const topNavItems: TopNavItem[] = [
  {
    key: 'templates',
    label: '母版库',
    icon: '▤',
    title: '母版与公共组件库',
    route: '/templates',
    sideItems: [
      { key: 'overview', label: '组件总览', route: '/templates' },
      { key: 'list', label: '列表页母版', route: '/templates/list' },
      { key: 'form', label: '新增编辑母版', route: '/templates/form' },
      { key: 'detail', label: '详情页母版', route: '/templates/detail' },
      { key: 'setting', label: '设置页母版', route: '/templates/setting' },
      { key: 'modal', label: '弹窗选择器', route: '/templates/modal' },
      { key: 'field', label: '字段组件', route: '/templates/field' },
      { key: 'base', label: '基础组件', route: '/templates/base' },
    ],
  },
  {
    key: 'prd',
    label: 'PRD',
    icon: '▣',
    title: 'PRD 中心',
    route: '/prd/rd',
    sideItems: [
      { key: 'globalFlowPrd', label: '业务流程图', route: '/prd/global-flow' },
      { key: 'rdPrd', label: '研发中心', route: '/prd/rd' },
      { key: 'salesPrd', label: '销售中心', route: '/prd/sales' },
      { key: 'purchasePrd', label: '采购中心', route: '/prd/purchase' },
      { key: 'warehousePrd', label: '仓库中心', route: '/prd/warehouse' },
      { key: 'productionPrd', label: '生产中心', route: '/prd/production' },
      { key: 'afterSalesPrd', label: '售后中心', route: '/prd/after-sales' },
      { key: 'qcPrd', label: '质检中心', route: '/prd/qc' },
      { key: 'hrPrd', label: '人力中心', route: '/prd/hr' },
      { key: 'equipmentPrd', label: '设备中心', route: '/prd/equipment' },
      { key: 'energyPrd', label: '能耗中心', route: '/prd/energy' },
      { key: 'settingsPrd', label: '设置中心', route: '/prd/settings' },
      { key: 'financePrd', label: '业务账款中心', route: '/prd/finance' },
    ],
  },
  {
    key: 'rd',
    label: '研发',
    icon: '✎',
    title: '研发中心',
    route: '/rd',
    sideItems: [
      { key: 'workbench', label: '工作台', route: '/rd' },
      {
        key: 'doc',
        label: '文档库',
        route: '/rd/doc',
        flyout: [
          {
            title: '文档库',
            items: [
              { label: '新增文档', route: '/rd/doc?action=new' },
              { label: '文档列表', route: '/rd/doc' },
            ],
          },
          {
            title: '文档设置',
            items: [
              { label: '设置文档编号', route: '/rd/doc?setting=numbers' },
              { label: '设置文档分类', route: '/rd/doc?setting=categories' },
              { label: '设置审批流程', route: '/rd/doc?setting=approvals' },
              { label: '设置自定义字段', route: '/rd/doc?setting=fields' },
              { label: '设置文档策略', route: '/rd/doc?setting=strategies' },
              { label: '设置打印模板', route: '/rd/doc?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'project',
        label: '新品研发',
        route: '/rd/projects',
        flyout: [
          {
            title: '新品研发',
            items: [
              { label: '新增新品研发', route: '/rd/projects?action=new' },
              { label: '新品研发列表', route: '/rd/projects' },
            ],
          },
          {
            title: '新品研发设置',
            items: [
              { label: '设置新品研发编号', route: '/rd/projects?setting=numbers' },
              { label: '设置新品研发类型', route: '/rd/projects?setting=categories' },
              { label: '设置审批流程', route: '/rd/projects?setting=approvals' },
              { label: '设置自定义字段', route: '/rd/projects?setting=fields' },
              { label: '设置新品研发策略', route: '/rd/projects?setting=strategies' },
              { label: '设置打印模板', route: '/rd/projects?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'product',
        label: '产品库',
        route: '/rd/products',
        flyout: [
          {
            title: '产品库',
            items: [
              { label: '新增产品', route: '/rd/products?action=new' },
              { label: '产品列表', route: '/rd/products' },
            ],
          },
          {
            title: '产品库设置',
            items: [
              { label: '产品码管控', route: '/rd/products?action=产品码管控' },
              { label: '设置产品编号', route: '/rd/products?setting=numbers' },
              { label: '设置产品分类', route: '/rd/products?setting=categories' },
              { label: '设置产品品牌', route: '/rd/products?setting=brands' },
              { label: '设置审批流程', route: '/rd/products?setting=approvals' },
              { label: '设置自定义字段', route: '/rd/products?setting=fields' },
              { label: '设置产品策略', route: '/rd/products?setting=strategies' },
              { label: '设置打印模板', route: '/rd/products?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'material',
        label: '物料管理',
        route: '/rd/materials',
        flyout: [
          {
            title: '物料管理',
            items: [
              { label: '新增物料', route: '/rd/materials?action=new' },
              { label: '物料列表', route: '/rd/materials' },
            ],
          },
          {
            title: '物料设置',
            items: [
              { label: '设置物料编号', route: '/rd/materials?setting=numbers' },
              { label: '设置物料分类', route: '/rd/materials?setting=categories' },
              { label: '设置物料品牌', route: '/rd/materials?setting=brands' },
              { label: '设置审批流程', route: '/rd/materials?setting=approvals' },
              { label: '设置自定义字段', route: '/rd/materials?setting=fields' },
              { label: '设置物料策略', route: '/rd/materials?setting=strategies' },
              { label: '设置打印模板', route: '/rd/materials?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'process',
        label: '工序管理',
        route: '/rd/processes',
        flyout: [
          {
            title: '工序管理',
            items: [
              { label: '新增工序', route: '/rd/processes?action=new' },
              { label: '工序列表', route: '/rd/processes' },
            ],
          },
          {
            title: '工序设置',
            items: [
              { label: '设置工序编号', route: '/rd/processes?setting=numbers' },
              { label: '设置工序分类', route: '/rd/processes?setting=categories' },
              { label: '设置审批流程', route: '/rd/processes?setting=approvals' },
              { label: '设置自定义字段', route: '/rd/processes?setting=fields' },
              { label: '设置工序策略', route: '/rd/processes?setting=strategies' },
              { label: '设置打印模板', route: '/rd/processes?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'craft',
        label: '工艺管理',
        route: '/rd/crafts',
        flyout: [
          {
            title: '工艺管理',
            items: [
              { label: '新增工艺', route: '/rd/crafts?action=new' },
              { label: '工艺列表', route: '/rd/crafts' },
            ],
          },
          {
            title: '工艺设置',
            items: [
              { label: '设置工艺编号', route: '/rd/crafts?setting=numbers' },
              { label: '设置工艺分类', route: '/rd/crafts?setting=categories' },
              { label: '设置审批流程', route: '/rd/crafts?setting=approvals' },
              { label: '设置自定义字段', route: '/rd/crafts?setting=fields' },
              { label: '设置工艺策略', route: '/rd/crafts?setting=strategies' },
              { label: '设置打印模板', route: '/rd/crafts?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'bom',
        label: 'BOM管理',
        route: '/rd/bom',
        flyout: [
          {
            title: 'BOM库',
            items: [
              { label: '新增BOM', route: '/rd/bom?action=new' },
              { label: 'BOM列表', route: '/rd/bom' },
            ],
          },
          {
            title: '代替物料库',
            items: [
              { label: '新增代替', route: '/rd/bom?tab=substitute&action=新增代替' },
              { label: '代替列表', route: '/rd/bom?tab=substitute' },
            ],
          },
          {
            title: 'BOM设置',
            items: [
              { label: '设置项目编号', route: '/rd/bom?setting=numbers' },
              { label: '设置bom策略', route: '/rd/bom?setting=strategies' },
              { label: '设置bom分类', route: '/rd/bom?setting=categories' },
              { label: '设置bom模板', route: '/rd/bom?setting=template' },
              { label: '设置bom流程', route: '/rd/bom?setting=approvals' },
              { label: '设置自定义字段', route: '/rd/bom?setting=fields' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'pur',
    label: '采购',
    icon: '📦',
    title: '采购中心',
    route: '/purchase',
    sideItems: [
      { key: 'workbench', label: '工作台', route: '/purchase' },
      materialManagementSideItem('material', '/purchase/materials'),
      {
        key: 'supplier',
        label: '供应商管理',
        route: '/purchase/suppliers',
        flyout: [
          {
            title: '供应商管理',
            items: [
              { label: '添加供应商', route: '/purchase/suppliers?action=new' },
              { label: '供应商列表', route: '/purchase/suppliers' },
            ],
          },
          {
            title: '供应商设置',
            items: [
              { label: '供应商分组设置', route: '/purchase/suppliers?setting=groups' },
              { label: '供应商自定义字段', route: '/purchase/suppliers?setting=fields' },
              { label: '供应商自定义编号', route: '/purchase/suppliers?setting=numbers' },
              { label: '供应商等级设置', route: '/purchase/suppliers?setting=levels' },
              { label: '供货品牌设置', route: '/purchase/suppliers?setting=brands' },
              { label: '供应商审批设置', route: '/purchase/suppliers?setting=approvals' },
              { label: '供应商策略设置', route: '/purchase/suppliers?setting=strategies' },
              { label: '设置供应商打印模板', route: '/purchase/suppliers?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'pr',
        label: '请购管理',
        route: '/purchase/purchase-requests',
        flyout: purchaseFlyout('请购管理', '/purchase/purchase-requests', '添加请购', '请购列表', '请购明细'),
      },
      {
        key: 'inquiry',
        label: '询价管理',
        route: '/purchase/purchase-inquiries',
        flyout: purchaseListOnlyFlyout('询价管理', '/purchase/purchase-inquiries', '添加询价', '询价列表'),
      },
      {
        key: 'order',
        label: '采购订单',
        route: '/purchase/purchase-orders',
        flyout: purchaseListOnlyFlyout('采购订单', '/purchase/purchase-orders', '添加采购订单', '采购订单列表'),
      },
      {
        key: 'pret',
        label: '采购退货',
        route: '/purchase/purchase-returns',
        flyout: standardFlyout('采购退货', '/purchase/purchase-returns', '新增采购退货', '采购退货列表', '采购退货明细'),
      },
      {
        key: 'exchange',
        label: '采购换货',
        route: '/purchase/purchase-exchanges',
        flyout: standardFlyout('采购换货', '/purchase/purchase-exchanges', '新增采购换货', '采购换货列表', '采购换货明细'),
      },
      {
        key: 'report',
        label: '采购报表',
        route: '/purchase/purchase-reports',
        flyout: [
          {
            title: '采购报表',
            items: [
              { label: '供应商对账', route: '/purchase/purchase-reports?report=reconciliation' },
              { label: '按供应商查询', route: '/purchase/purchase-reports?report=by-supplier' },
              { label: '按产品统计', route: '/purchase/purchase-reports?report=by-product' },
              { label: '退换货明细', route: '/purchase/purchase-reports?report=returns' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'sale',
    label: '销售',
    icon: '💼',
    title: '销售中心',
    route: '/sales',
    sideItems: [
      { key: 'workbench', label: '工作台', route: '/sales' },
      salesProductSideItem(),
      {
        key: 'customer',
        label: '客户管理',
        route: '/sales/customers',
        flyout: [
          { title: '客户管理', items: [{ label: '添加客户', route: '/sales/customers/new' }, { label: '客户列表', route: '/sales/customers' }] },
          {
            title: '客户设置',
            items: [
              { label: '客户分组设置', route: '/sales/customers/settings/groups' },
              { label: '客户自定义字段', route: '/sales/customers/settings/fields' },
              { label: '客户自定义编号', route: '/sales/customers/settings/numbers' },
              { label: '客户等级设置', route: '/sales/customers/settings/levels' },
              { label: '客户审批设置', route: '/sales/customers/settings/approvals' },
              { label: '客户策略设置', route: '/sales/customers/settings/strategies' },
            ],
          },
        ],
      },
      {
        key: 'salesPlan',
        label: '销售计划',
        route: '/sales/sales-plans',
        flyout: [
          { title: '计划管理', items: [{ label: '添加计划', route: '/sales/sales-plans?action=new' }, { label: '计划列表', route: '/sales/sales-plans' }] },
          {
            title: '计划设置',
            items: [
              { label: '计划自定义字段', route: '/sales/sales-plans?setting=fields' },
              { label: '计划自定义编号', route: '/sales/sales-plans?setting=numbers' },
              { label: '计划审批设置', route: '/sales/sales-plans?setting=approvals' },
              { label: '计划策略设置', route: '/sales/sales-plans?setting=strategies' },
              { label: '设置计划打印模板', route: '/sales/sales-plans?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'quote',
        label: '报价单',
        route: '/sales/sales-quotes',
        flyout: [
          { title: '报价单', items: [{ label: '添加报价单', route: '/sales/sales-quotes?action=new' }, { label: '报价单列表', route: '/sales/sales-quotes' }] },
          {
            title: '报价设置',
            items: [
              { label: '报价自定义字段', route: '/sales/sales-quotes?setting=fields' },
              { label: '报价自定义编号', route: '/sales/sales-quotes?setting=numbers' },
              { label: '报价审批设置', route: '/sales/sales-quotes?setting=approvals' },
              { label: '报价策略设置', route: '/sales/sales-quotes?setting=strategies' },
              { label: '设置报价打印模板', route: '/sales/sales-quotes?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'contract',
        label: '合同管理',
        route: '/sales/sales-contracts',
        flyout: [
          { title: '合同管理', items: [{ label: '添加合同', route: '/sales/sales-contracts?action=new' }, { label: '合同列表', route: '/sales/sales-contracts' }] },
          {
            title: '合同设置',
            items: [
              { label: '合同自定义字段', route: '/sales/sales-contracts?setting=fields' },
              { label: '合同自定义编号', route: '/sales/sales-contracts?setting=numbers' },
              { label: '合同审批设置', route: '/sales/sales-contracts?setting=approvals' },
              { label: '合同策略设置', route: '/sales/sales-contracts?setting=strategies' },
              { label: '设置合同打印模板', route: '/sales/sales-contracts?setting=print' },
            ],
          },
        ],
      },
      {
        key: 'saleOrder',
        label: '订单管理',
        route: '/sales/sales-orders',
        flyout: [
          { title: '订单管理', items: [{ label: '添加订单', route: '/sales/sales-orders?action=new' }, { label: '订单列表', route: '/sales/sales-orders' }] },
          {
            title: '订单设置',
            items: [
              { label: '订单自定义字段', route: '/sales/sales-orders?setting=fields' },
              { label: '订单自定义编号', route: '/sales/sales-orders?setting=numbers' },
              { label: '订单审批设置', route: '/sales/sales-orders?setting=approvals' },
              { label: '订单策略设置', route: '/sales/sales-orders?setting=strategies' },
              { label: '设置订单打印模板', route: '/sales/sales-orders?setting=print' },
            ],
          },
        ],
      },
      { key: 'sret', label: '销售退货', route: '/sales/sales-returns' },
      { key: 'sexchange', label: '销售换货', route: '/sales/sales-exchanges' },
      { key: 'sreport', label: '销售报表', route: '/sales/sales-reports' },
    ],
  },
  {
    // 不使用本中心：保留配置，仅在顶部导航隐藏。
    key: 'wh',
    label: '仓储',
    icon: '🗄',
    title: '仓储中心',
    route: '/warehouse',
    hidden: true,
    sideItems: [
      { key: 'workbench', label: '工作台', route: '/warehouse' },
      {
        key: 'stockManage',
        label: '库存管理',
        route: '/warehouse/inventory-stocks',
        flyout: [
          {
            title: '库存管理',
            items: [
              { label: '库存列表', route: '/warehouse/inventory-stocks' },
            ],
          },
          { title: '库存设置', items: settingEntries('库存', '/warehouse/inventory-stocks') },
        ],
      },
      {
        key: 'inbound',
        label: '入库管理',
        route: '/warehouse/warehouse-inbounds',
        flyout: [
          {
            title: '入库管理',
            items: [
              { label: '直接入库', route: '/warehouse/warehouse-inbounds?action=直接入库' },
              { label: '全部入库单', route: '/warehouse/warehouse-inbounds?action=全部入库单' },
              { label: '待入库单', route: '/warehouse/warehouse-inbounds?action=待入库单' },
              { label: '待入库明细', route: '/warehouse/warehouse-inbounds?action=待入库明细' },
            ],
          },
          { title: '入库设置', items: settingEntries('入库', '/warehouse/warehouse-inbounds') },
        ],
      },
      {
        key: 'outbound',
        label: '出库管理',
        route: '/warehouse/warehouse-outbounds',
        flyout: [
          {
            title: '出库管理',
            items: [
              { label: '直接出库', route: '/warehouse/warehouse-outbounds?action=直接出库' },
              { label: '全部出库单', route: '/warehouse/warehouse-outbounds?action=全部出库单' },
              { label: '待出库单', route: '/warehouse/warehouse-outbounds?action=待出库单' },
              { label: '待出库明细', route: '/warehouse/warehouse-outbounds?action=待出库明细' },
              { label: '待申请发货', route: '/warehouse/warehouse-outbounds?action=待申请发货' },
            ],
          },
          { title: '出库设置', items: settingEntries('出库', '/warehouse/warehouse-outbounds') },
        ],
      },
      {
        key: 'transfer',
        label: '调拨管理',
        route: '/warehouse/warehouse-transfers',
        flyout: [
          {
            title: '调拨管理',
            items: [
              { label: '新增调拨', route: '/warehouse/warehouse-transfers?action=新增调拨' },
              { label: '调拨列表', route: '/warehouse/warehouse-transfers?action=调拨列表' },
              { label: '调拨明细表', route: '/warehouse/warehouse-transfers?action=调拨明细表' },
            ],
          },
          { title: '调拨设置', items: settingEntries('调拨', '/warehouse/warehouse-transfers') },
        ],
      },
      {
        key: 'inventoryCheck',
        label: '盘点管理',
        route: '/warehouse/inventory-counts',
        flyout: [
          {
            title: '盘点管理',
            items: [
              { label: '直接盘点', route: '/warehouse/inventory-counts?action=直接盘点' },
              { label: '盘点计划', route: '/warehouse/inventory-counts?action=盘点计划' },
            ],
          },
          { title: '盘点设置', items: settingEntries('盘点', '/warehouse/inventory-counts') },
        ],
      },
      {
        key: 'warehouseLocation',
        label: '仓库库位',
        route: '/warehouse/warehouse-locations',
        flyout: [
          {
            title: '仓库库位',
            items: [
              { label: '仓库列表', route: '/warehouse/warehouse-locations?tab=warehouses' },
              { label: '区域列表', route: '/warehouse/warehouse-locations?tab=areas' },
              { label: '库位列表', route: '/warehouse/warehouse-locations' },
            ],
          },
          { title: '库位设置', items: settingEntries('库位', '/warehouse/warehouse-locations') },
        ],
      },
      {
        key: 'outboundQuality',
        label: '出库质检',
        route: '/warehouse/outbound-quality-inspections',
        flyout: standardFlyout('出货质检', '/warehouse/outbound-quality-inspections', '新增出货质检', '出货质检列表', '出货质检详情'),
      },
      {
        key: 'inboundQuality',
        label: '来料质检',
        route: '/warehouse/inbound-quality-inspections',
        flyout: standardFlyout('来料质检', '/warehouse/inbound-quality-inspections', '新增来料质检', '来料质检列表', '来料质检明细'),
      },
    ],
  },
  {
    key: 'storehouse',
    label: '仓库',
    icon: '▥',
    title: '仓库中心',
    route: '/storehouse',
    sideItems: [
      { key: 'workbench', label: '工作台', route: '/storehouse' },
      productManagementSideItem('productManagement', '产品管理', '/storehouse/products', '/storehouse/materials'),
      {
        key: 'warehouseManage',
        label: '仓库管理',
        route: '/storehouse/warehouse-management',
        flyout: [
          {
            title: '仓库管理',
            items: [
              { label: '仓库管理', route: '/storehouse/warehouse-management' },
            ],
          },
          {
            title: '仓库设置',
            items: [
              { label: '多仓管理', route: '/storehouse/warehouse-management?setting=multi-warehouse' },
              { label: '仓储规则', route: '/storehouse/warehouse-management?setting=warehouse-rules' },
            ],
          },
        ],
      },
      {
        key: 'outboundManage',
        label: '出库管理',
        route: '/storehouse/outbound-management',
      },
      {
        key: 'inboundManage',
        label: '入库管理',
        route: '/storehouse/inbound-management',
      },
      {
        key: 'sortingDelivery',
        label: '分拣配送',
        route: '/storehouse/sorting-delivery',
        flyout: [
          {
            title: '配送管理',
            items: [
              { label: '订单分拣', route: '/storehouse/sorting-delivery' },
              { label: '发货配送', route: '/storehouse/shipping-delivery' },
              { label: '销售订单', route: '/storehouse/sales-orders' },
            ],
          },
        ],
      },
      {
        key: 'incomingMaterial',
        label: '来料管理',
        route: '/storehouse/incoming-material',
      },
      {
        key: 'inventoryWarning',
        label: '库存预警',
        route: '/storehouse/inventory-warning',
        flyout: [
          {
            title: '库存预警',
            items: [
              { label: '库存预警', route: '/storehouse/inventory-warning' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'mfg',
    label: '生产',
    icon: '⚙',
    title: '生产中心',
    route: '/production',
    sideItems: [
      { key: 'workbench', label: '工作台', route: '/production' },
      productManagementSideItem('productManagement', '产品管理', '/production/products', '/production/materials'),
      {
        key: 'mfgDemand',
        label: '生产需求',
        route: '/production/production-demands',
        flyout: productionDemandFlyout(),
      },
      {
        key: 'mfgPlan',
        label: '生产计划',
        route: '/production/production-plans',
        flyout: productionListOnlyFlyout('生产计划', '/production/production-plans', '新增生产计划', '生产计划列表', '计划'),
      },
      {
        key: 'mfgOrder',
        label: '生产订单',
        route: '/production/production-orders',
        flyout: productionListOnlyFlyout('生产订单', '/production/production-orders', '新增生产订单', '生产订单列表', '订单'),
      },
      {
        key: 'mfgWorkOrder',
        label: '生产工单',
        route: '/production/production-work-orders',
        flyout: productionWorkOrderFlyout(),
      },
      {
        key: 'mfgSchedule',
        label: '生产排班',
        route: '/production/production-schedules',
        flyout: productionScheduleFlyout(),
      },
      {
        key: 'mfgOutsource',
        label: '委外加工',
        route: '/production/outsource-orders',
        flyout: productionListOnlyFlyout('委外加工', '/production/outsource-orders', '新增委外加工', '委外加工列表', '委外'),
      },
    ],
  },
  {
    key: 'afterSales',
    label: '售后',
    icon: '↩',
    title: '售后中心',
    route: '/after-sales',
    status: 'pending',
    sideItems: [
      jsxSideItem('workbench', '工作台', '/after-sales'),
      {
        key: 'asService',
        label: '售后单',
        route: '/after-sales/services',
        flyout: [
          {
            title: '售后单',
            items: [
              { label: '新增售后', route: '/after-sales/services?action=new' },
              { label: '售后列表', route: '/after-sales/services' },
              { label: '任务池', route: '/after-sales/tasks?status=待处理' },
              { label: '我的任务', route: '/after-sales/tasks?scope=mine' },
            ],
          },
          {
            title: '售后设置',
            items: [
              { label: '售后原因', route: '/after-sales/services?setting=售后原因' },
              { label: '投诉问题', route: '/after-sales/services?setting=投诉问题' },
              { label: '售后类型', route: '/after-sales/services?setting=售后类型' },
              { label: '处理方式', route: '/after-sales/services?setting=处理方式' },
              { label: '保修政策', route: '/after-sales/services?setting=保修政策' },
              { label: 'SLA 规则', route: '/after-sales/services?setting=SLA%20规则' },
              { label: '售后策略设置', route: '/after-sales/services?setting=strategies' },
            ],
          },
        ],
      },
      {
        key: 'asReports',
        label: '报表分析',
        route: '/after-sales/reports',
        flyout: [
          {
            title: '报表分析',
            items: [
              { label: '售后概览', route: '/after-sales/reports?report=overview' },
              { label: '原因 / 故障分析', route: '/after-sales/reports?report=reason-fault' },
              { label: '时效分析', route: '/after-sales/reports?report=timeliness' },
              { label: '成本分析', route: '/after-sales/reports?report=cost' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'qc',
    label: '质检',
    icon: '✓',
    title: '质检中心',
    route: '/qc',
    status: 'pending',
    sideItems: [
      jsxSideItem('workbench', '工作台', '/qc'),
      {
        key: 'qcInspection',
        label: '质检管理',
        route: '/qc/execution',
        flyout: [
          {
            title: '检验执行',
            items: [
              { label: '新增检验任务', route: '/qc/execution?action=new' },
              { label: '检验任务列表', route: actionRoute('/qc/execution', '检验任务列表') },
              { label: '待检任务', route: actionRoute('/qc/execution', '待检任务') },
            ],
          },
        ],
      },
      jsxSideItem('qcQuality', '异常处理', '/qc/exceptions', [
        { title: '异常处理', items: ['不合格记录', '隔离/拒收', '返工复检', '让步放行'] },
      ]),
      jsxSideItem('qcAnalysis', '质检分析', '/qc/reports', [
        { title: '质检分析', items: ['质量趋势', '不良分析', '供应商质量', '工序质量'] },
      ]),
      {
        key: 'qcSettings',
        label: '质检设置',
        route: '/qc/standards',
        flyout: [
          {
            title: '方案配置',
            items: [
              { label: '质检方案', route: '/qc/standards?action=质检方案' },
              { label: '质检组', route: '/qc/standards?action=质检组' },
              { label: '质检标准', route: '/qc/standards?action=质检标准' },
            ],
          },
          {
            title: '质检设置',
            items: [
              { label: '质检方案分组', route: '/qc/standards?setting=groups' },
              { label: '质检自定义字段', route: '/qc/standards?setting=fields' },
              { label: '质检自定义编号', route: '/qc/standards?setting=numbers' },
              { label: '质检审批设置', route: '/qc/standards?setting=approvals' },
              { label: '质检策略设置', route: '/qc/standards?setting=strategies' },
              { label: '设置质检打印模板', route: '/qc/standards?setting=print' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'hr',
    label: '人力',
    icon: '人',
    title: '人力中心',
    route: '/hr',
    status: 'pending',
    sideItems: [
      jsxSideItem('workbench', '工作台', '/hr'),
      jsxSideItem('hrEmployee', '员工管理', '/hr/employees', [
        { title: '员工管理', items: ['新增员工', '员工列表', '入职办理', '转正管理', '调岗管理', '离职管理', '生成劳动合同'] },
        { title: '员工设置', items: ['员工自定义字段', '员工自定义编号', '员工审批设置', '员工策略设置', '设置员工打印模板'] },
      ]),
      {
        key: 'hrOrg',
        label: '组织机构',
        route: '/hr/orgs',
        flyout: [
          {
            title: '组织机构',
            items: [
              { label: '组织列表', route: '/hr/orgs' },
              { label: '岗位列表', route: '/hr/positions' },
              { label: '岗位说明书', route: actionRoute('/hr/positions', '岗位说明书') },
            ],
          },
        ],
      },
      jsxSideItem('hrAttendance', '考勤管理', '/hr/attendance', [
        { title: '考勤管理', items: ['新增考勤', '考勤列表'] },
        { title: '考勤设置', items: ['考勤自定义字段', '考勤自定义编号', '考勤审批设置', '考勤策略设置', '设置考勤打印模板'] },
      ]),
      jsxSideItem('hrPayroll', '薪酬管理', '/hr/payroll', [
        { title: '薪酬管理', items: ['工资列表', '薪资方案', '薪酬类型', '薪酬项目'] },
        { title: '薪酬设置', items: ['薪酬自定义字段', '薪酬自定义编号', '薪酬审批设置', '薪酬策略设置', '设置薪酬打印模板'] },
      ]),
      jsxSideItem('hrArchive', '档案管理', '/hr/archives', [
        { title: '档案管理', items: ['员工档案', '档案列表', '合同档案', '证件档案'] },
        { title: '档案设置', items: ['档案自定义字段', '档案自定义编号', '档案审批设置', '档案策略设置', '设置档案打印模板'] },
      ]),
      jsxSideItem('hrOffice', '人事办公', '/hr/office', [
        { title: '办公申请', items: ['新增办公申请', '申请列表'] },
        { title: '通知协同', items: ['发布公告', '公告列表'] },
        { title: '办公设置', items: ['人事办公自定义字段', '人事办公自定义编号', '人事办公审批设置', '人事办公策略设置', '会议室管理', '工作日历'] },
      ]),
    ],
  },
  {
    key: 'finance',
    label: '业务账款',
    icon: '¥',
    title: '业务账款中心',
    route: '/finance',
    status: 'ready',
    sideItems: [
      jsxSideItem('workbench', '工作台', '/finance'),
      {
        key: 'financeReceivables',
        label: '应收管理',
        route: '/finance/receivables',
        flyout: financeFlyout('/finance/receivables', [
          {
            title: '应收管理',
            items: [
              { label: '新增应收', route: '/finance/receivables?action=new' },
              { label: '应收列表', route: '/finance/receivables' },
              { label: '收款登记', route: '/finance/receivables?action=receive' },
              { label: '核销收款', route: '/finance/receivables?action=settle' },
              { label: '应收调整', route: '/finance/receivables?action=adjust' },
              { label: '客户对账', route: '/finance/receivables?action=reconcile' },
            ],
          },
        ]),
      },
      {
        key: 'financePayables',
        label: '应付管理',
        route: '/finance/payables',
        flyout: financeFlyout('/finance/payables', [
          {
            title: '应付管理',
            items: [
              { label: '新增应付', route: '/finance/payables?action=new' },
              { label: '应付列表', route: '/finance/payables' },
              { label: '付款申请', route: '/finance/payables?action=apply' },
              { label: '付款登记', route: '/finance/payables?action=pay' },
              { label: '付款核销', route: '/finance/payables?action=settle' },
              { label: '供应商对账', route: '/finance/payables?action=reconcile' },
            ],
          },
          {
            title: '应付匹配',
            items: [
              { label: '收票认证', route: '/finance/payables?action=invoice' },
              { label: '三单匹配', route: '/finance/payables?action=match' },
            ],
          },
        ]),
      },
      {
        key: 'financeInvoice',
        label: '发票管理',
        route: '/finance/invoices',
        flyout: financeFlyout('/finance/invoices', [
          {
            title: '发票管理',
            items: [
              { label: '新增发票', route: '/finance/invoices?action=new' },
              { label: '发票列表', route: '/finance/invoices' },
              { label: '销项开票', route: '/finance/invoices?action=output' },
              { label: '进项收票认证', route: '/finance/invoices?action=input' },
              { label: '发票勾稽', route: '/finance/invoices?action=match' },
              { label: '红冲处理', route: '/finance/invoices?action=red' },
            ],
          },
        ]),
      },
      {
        key: 'financeSettlements',
        label: '收付核销',
        route: '/finance/settlements',
        flyout: financeFlyout('/finance/settlements', [
          {
            title: '收付核销',
            items: [
              { label: '新增流水', route: '/finance/settlements?action=new' },
              { label: '流水列表', route: '/finance/settlements' },
              { label: '收款登记', route: '/finance/settlements?action=receive' },
              { label: '付款登记', route: '/finance/settlements?action=pay' },
              { label: '退款付款', route: '/finance/settlements?action=refund' },
              { label: '银行对账', route: '/finance/settlements?action=bank' },
              { label: '核销处理', route: '/finance/settlements?action=settle' },
            ],
          },
        ]),
      },
      jsxSideItem('financeSettings', '账款设置', '/finance/settings'),
    ],
  },
  {
    key: 'equipment',
    label: '设备',
    icon: '▣',
    title: '设备中心',
    route: '/equipment',
    status: 'pending',
    sideItems: [
      jsxSideItem('workbench', '工作台', '/equipment'),
      {
        key: 'asset',
        label: '设备台账',
        route: '/equipment/assets',
        flyout: [
          {
            title: '设备台账',
            items: [
              { label: '新增设备', route: '/equipment/assets?action=new' },
              { label: '设备档案', route: '/equipment/assets' },
            ],
          },
          {
            title: '设备设置',
            items: [
              { label: '设备编号', route: '/equipment/assets?setting=numbers' },
              { label: '设备分类', route: '/equipment/assets?setting=categories' },
              { label: '设备状态', route: '/equipment/assets?setting=statuses' },
              { label: '资产标签', route: '/equipment/assets?setting=assetTags' },
            ],
          },
        ],
      },
      {
        key: 'maintain',
        label: '保养计划',
        route: '/equipment/maintenance',
        flyout: [
          {
            title: '保养计划',
            items: [
              { label: '保养计划', route: '/equipment/maintenance' },
              { label: '新增保养', route: '/equipment/maintenance?action=新增保养' },
            ],
          },
          {
            title: '保养设置',
            items: [
              { label: '保养标准', route: '/equipment/maintenance?setting=maintenanceStandards' },
              { label: '保养项目', route: '/equipment/maintenance?setting=maintenanceItems' },
              { label: '保养周期', route: '/equipment/maintenance?setting=maintenanceCycles' },
              { label: '保养预警', route: '/equipment/maintenance?setting=maintenanceWarnings' },
            ],
          },
        ],
      },
      {
        key: 'repair',
        label: '维修记录',
        route: '/equipment/repairs',
        flyout: [
          {
            title: '维修记录',
            items: [
              { label: '报修申请', route: '/equipment/repairs?action=报修申请' },
              { label: '维修派工', route: '/equipment/repairs?view=dispatch' },
              { label: '维修任务', route: '/equipment/repairs?view=acceptance' },
            ],
          },
          {
            title: '维修设置',
            items: [
              { label: '故障分类', route: '/equipment/repairs?setting=faultCategories' },
              { label: '维修等级', route: '/equipment/repairs?setting=repairLevels' },
              { label: '审批流程', route: '/equipment/repairs?setting=repairApprovals' },
            ],
          },
        ],
      },
      {
        key: 'inspect',
        label: '点检记录',
        route: '/equipment/inspections',
        flyout: [
          {
            title: '点检记录',
            items: [
              { label: '点检计划', route: '/equipment/inspections?action=点检计划' },
              { label: '点检执行', route: '/equipment/inspections?action=点检执行' },
              { label: '点检异常', route: '/equipment/inspections?view=exceptions' },
            ],
          },
          {
            title: '点检设置',
            items: [
              { label: '点检标准', route: '/equipment/inspections?setting=inspectionStandards' },
              { label: '点检周期', route: '/equipment/inspections?setting=inspectionCycles' },
            ],
          },
        ],
      },
      {
        key: 'spare',
        label: '备件管理',
        route: '/equipment/spares',
        flyout: [
          {
            title: '备件管理',
            items: [
              { label: '备件库存', route: '/equipment/spares' },
              { label: '备件申请', route: '/equipment/spares?action=备件申请' },
              { label: '备件采购', route: '/equipment/spares?view=purchase' },
            ],
          },
          {
            title: '备件设置',
            items: [
              { label: '安全库存', route: '/equipment/spares?setting=safeStocks' },
              { label: '备件分类', route: '/equipment/spares?setting=spareCategories' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'energy',
    label: '能耗',
    icon: '⚡',
    title: '能耗中心',
    route: '/energy',
    status: 'ready',
    sideItems: [
      jsxSideItem('workbench', '工作台', '/energy'),
      jsxSideItem('monitor', '能耗监测', '/energy/monitor', [
        { title: '能耗监测', items: ['实时监测', '异常告警', '设备能耗'] },
        { title: '监测设置', items: ['采集点管理', '告警阈值', '监测频率'] },
      ]),
      jsxSideItem('analysis', '能耗分析', '/energy/analysis', [
        { title: '能耗分析', items: ['趋势分析', '对比分析', '成本分析'] },
        { title: '分析设置', items: ['分析维度', '基准设置', '分析周期'] },
      ]),
      jsxSideItem('report', '能耗报表', '/energy/reports', [
        { title: '能耗报表', items: ['日报', '月报', '年报', '自定义报表'] },
        { title: '报表设置', items: ['报表模板', '报送设置'] },
      ]),
      jsxSideItem('save', '节能措施', '/energy/saving', [
        { title: '节能措施', items: ['措施方案', '措施执行', '效果评估'] },
        { title: '措施设置', items: ['措施分类', '目标设定'] },
      ]),
      jsxSideItem('carbon', '碳排放', '/energy/carbon', [
        { title: '碳排放', items: ['排放核算', '排放报告', '减排目标'] },
        { title: '碳设置', items: ['核算标准', '排放因子'] },
      ]),
      jsxSideItem('product', '产品能耗', '/energy/product', [
        { title: '产品能耗', items: ['新增产品单耗', '产品能耗列表'] },
        { title: '产品能耗设置', items: ['能耗自定义字段', '能耗策略设置'] },
      ]),
      jsxSideItem('department', '部门能耗', '/energy/department', [
        { title: '部门能耗', items: ['新增部门指标', '部门能耗列表'] },
        { title: '部门能耗设置', items: ['能耗自定义字段', '能耗策略设置'] },
      ]),
      jsxSideItem('data', '数据管理', '/energy/data', [
        { title: '数据管理', items: ['导入数据', '数据批次列表', '数据校验'] },
        { title: '数据设置', items: ['能耗自定义字段', '能耗策略设置'] },
      ]),
      jsxSideItem('equipmentEnergy', '设备能耗', '/energy/equipment', [
        { title: '设备能耗', items: ['新增设备能耗', '设备能耗列表'] },
        { title: '设备能耗设置', items: ['能耗自定义字段', '能耗自定义编号', '能耗策略设置'] },
      ]),
    ],
  },
  {
    key: 'set',
    label: '设置',
    icon: '⚙',
    title: '设置中心',
    route: '/settings',
    status: 'ready',
    sideItems: [
      jsxSideItem('system', '系统设置', '/settings/system'),
      jsxSideItem('units', '单位管理', '/settings/units'),
      jsxSideItem('currencies', '币种管理', '/settings/currencies'),
      {
        key: 'accounts',
        label: '账号权限',
        route: '/settings/accounts',
        flyout: [
          {
            title: '账号权限',
            items: [
              { label: '用户账号', route: '/settings/accounts' },
              { label: '角色管理', route: '/settings/roles' },
              { label: '权限资源', route: '/settings/permission-resources' },
              { label: '权限设置', route: '/settings/permissions' },
              { label: '超级管理员', route: '/settings/super-admins' },
            ],
          },
        ],
      },
      jsxSideItem('security', '安全中心', '/settings/security'),
      jsxSideItem('data', '日志与数据', '/settings/data'),
      jsxSideItem('integrations', '集成与接口', '/settings/integrations'),
    ],
  },
];

export function getCenterByPath(path: string) {
  if (path === '/prd' || path.startsWith('/prd/')) return topNavItems.find((item) => item.key === 'prd') || topNavItems[0];
  return topNavItems.find((item) => path === item.route || path.startsWith(`${item.route}/`)) || topNavItems.find((item) => item.key === 'sale') || topNavItems[0];
}

export function getSideByPath(path: string, center = getCenterByPath(path)) {
  if (center.key === 'afterSales') {
    if (path.startsWith('/after-sales/reports')) return center.sideItems.find((item) => item.key === 'asReports') || center.sideItems[0];
    if (
      path.startsWith('/after-sales/services')
      || path.startsWith('/after-sales/tasks')
      || path.startsWith('/after-sales/execution')
      || path.startsWith('/after-sales/settings')
    ) {
      return center.sideItems.find((item) => item.key === 'asService') || center.sideItems[0];
    }
  }
  if (center.key === 'hr' && path.startsWith('/hr/positions')) {
    return center.sideItems.find((item) => item.key === 'hrOrg') || center.sideItems[0];
  }
  if (center.key === 'set' && [
    '/settings/accounts',
    '/settings/roles',
    '/settings/permission-resources',
    '/settings/permissions',
    '/settings/super-admins',
  ].some((route) => path === route || path.startsWith(`${route}/`))) {
    return center.sideItems.find((item) => item.key === 'accounts') || center.sideItems[0];
  }
  return [...center.sideItems]
    .sort((a, b) => b.route.length - a.route.length)
    .find((item) => path === item.route || path.startsWith(`${item.route}/`)) || center.sideItems[0];
}
