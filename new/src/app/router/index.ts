import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AdminLayout from '@/layouts/AdminLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/sales',
    component: AdminLayout,
    children: [
      {
        path: 'sales',
        name: 'SalesDashboard',
        component: () => import('@/views/sales/SalesDashboard.vue'),
        meta: { title: '销售工作台', affix: true },
      },
      {
        path: 'sales/sales-orders/:id',
        name: 'SalesOrderDetail',
        component: () => import('@/views/sales/SalesOrderDetailPage.vue'),
        meta: { title: '销售订单详情' },
      },
      {
        path: 'sales/:resource(customers|sales-plans|sales-quotes|sales-contracts|sales-orders)',
        name: 'SalesResource',
        component: () => import('@/views/sales/SalesResourcePage.vue'),
        meta: { title: '销售资源' },
      },
      {
        path: 'rd',
        redirect: '/rd/projects',
      },
      {
        path: 'rd/:resource(projects|boms|processes)/new',
        name: 'RdResourceCreate',
        component: () => import('@/views/rd/RdResourceCreatePage.vue'),
        meta: { title: '研发新增' },
      },
      {
        path: 'rd/:resource(projects|boms|processes)/:id',
        name: 'RdResourceDetail',
        component: () => import('@/views/rd/RdResourceDetailPage.vue'),
        meta: { title: '研发详情' },
      },
      {
        path: 'rd/:resource(projects|boms|processes)',
        name: 'RdResourceList',
        component: () => import('@/views/rd/RdResourceListPage.vue'),
        meta: { title: '研发资源' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/sales',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
