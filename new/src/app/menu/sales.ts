import {
  DataAnalysis,
  Document,
  Goods,
  Notebook,
  Tickets,
  User,
} from '@element-plus/icons-vue';
import type { Component } from 'vue';

export interface SalesMenuItem {
  key: string;
  label: string;
  path: string;
  icon: Component;
  children?: Array<{ label: string; path: string }>;
}

export const salesMenus: SalesMenuItem[] = [
  { key: 'dashboard', label: '销售工作台', path: '/sales', icon: DataAnalysis },
  {
    key: 'customers',
    label: '客户管理',
    path: '/sales/customers',
    icon: User,
    children: [
      { label: '客户列表', path: '/sales/customers' },
      { label: '新增客户', path: '/sales/customers?action=new' },
      { label: '客户设置', path: '/sales/customers?setting=fields' },
    ],
  },
  {
    key: 'plans',
    label: '销售计划',
    path: '/sales/sales-plans',
    icon: Notebook,
    children: [
      { label: '计划列表', path: '/sales/sales-plans' },
      { label: '新增计划', path: '/sales/sales-plans?action=new' },
      { label: '计划设置', path: '/sales/sales-plans?setting=fields' },
    ],
  },
  {
    key: 'quotes',
    label: '报价管理',
    path: '/sales/sales-quotes',
    icon: Tickets,
    children: [
      { label: '报价列表', path: '/sales/sales-quotes' },
      { label: '新增报价', path: '/sales/sales-quotes?action=new' },
      { label: '报价设置', path: '/sales/sales-quotes?setting=fields' },
    ],
  },
  {
    key: 'contracts',
    label: '合同管理',
    path: '/sales/sales-contracts',
    icon: Document,
    children: [
      { label: '合同列表', path: '/sales/sales-contracts' },
      { label: '新增合同', path: '/sales/sales-contracts?action=new' },
      { label: '合同设置', path: '/sales/sales-contracts?setting=fields' },
    ],
  },
  {
    key: 'orders',
    label: '订单管理',
    path: '/sales/sales-orders',
    icon: Goods,
    children: [
      { label: '订单列表', path: '/sales/sales-orders' },
      { label: '新增订单', path: '/sales/sales-orders?action=new' },
      { label: '订单设置', path: '/sales/sales-orders?setting=fields' },
    ],
  },
];

export const rdMenus: SalesMenuItem[] = [
  {
    key: 'rd-projects',
    label: '研发项目',
    path: '/rd/projects',
    icon: DataAnalysis,
    children: [
      { label: '项目列表', path: '/rd/projects' },
      { label: '新增项目', path: '/rd/projects/new' },
    ],
  },
  {
    key: 'rd-boms',
    label: 'BOM管理',
    path: '/rd/boms',
    icon: Document,
    children: [
      { label: 'BOM列表', path: '/rd/boms' },
      { label: '新增BOM', path: '/rd/boms/new' },
    ],
  },
  {
    key: 'rd-processes',
    label: '工艺路线',
    path: '/rd/processes',
    icon: Notebook,
    children: [
      { label: '工艺列表', path: '/rd/processes' },
      { label: '新增工艺', path: '/rd/processes/new' },
    ],
  },
];

export const appMenus: SalesMenuItem[] = [...salesMenus, ...rdMenus];
