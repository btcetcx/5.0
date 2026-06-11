import { defineStore } from 'pinia';

export interface VisitedTab {
  path: string;
  title: string;
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    visited: [{ path: '/sales', title: '销售工作台' }] as VisitedTab[],
  }),
  actions: {
    add(tab: VisitedTab) {
      if (!this.visited.some((item) => item.path === tab.path)) this.visited.push(tab);
    },
    remove(path: string) {
      if (path === '/sales') return;
      this.visited = this.visited.filter((item) => item.path !== path);
    },
  },
});
