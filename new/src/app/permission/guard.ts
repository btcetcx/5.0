import type { Router } from 'vue-router';
import { useTabsStore } from '@/app/store/tabs';
import { rdResourceConfigs } from '@/views/rd/rd.config';
import { salesResourceConfigs } from '@/views/sales/sales.config';

export function setupPermissionGuard(router: Router) {
  router.beforeEach((to) => {
    const tabs = useTabsStore();
    const resourceTitle = typeof to.params.resource === 'string'
      ? salesResourceConfigs[to.params.resource]?.title || rdResourceConfigs[to.params.resource]?.title
      : '';
    const title = resourceTitle || (typeof to.meta?.title === 'string' ? to.meta.title : '');
    if (title) {
      tabs.add({ path: to.fullPath, title });
      document.title = `${title} - 傲为 ERP`;
    }
    return true;
  });
}
