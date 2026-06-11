import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    apiMode: 'mock' as 'mock' | 'remote',
    theme: 'light' as 'light' | 'dark',
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    setApiMode(mode: 'mock' | 'remote') {
      this.apiMode = mode;
    },
  },
});
