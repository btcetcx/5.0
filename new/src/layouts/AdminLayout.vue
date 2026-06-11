<template>
  <div class="admin-layout">
    <aside :class="['admin-sidebar', { collapsed: app.sidebarCollapsed }]">
      <div class="admin-brand">
        <strong>AW</strong>
        <span v-if="!app.sidebarCollapsed">销售中心</span>
      </div>
      <el-menu
        :collapse="app.sidebarCollapsed"
        :default-active="activeMenu"
        background-color="transparent"
        class="admin-menu"
        router
        text-color="#d8e1f2"
        active-text-color="#ffffff"
      >
        <template v-for="item in appMenus" :key="item.key">
          <el-sub-menu v-if="item.children?.length" :index="item.path">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
              {{ child.label }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </aside>

    <section class="admin-shell">
      <header class="admin-topbar">
        <div class="admin-topbar-left">
          <el-button text @click="app.toggleSidebar">
            <el-icon><Fold v-if="!app.sidebarCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          <div>
            <strong>{{ pageTitle }}</strong>
            <span>参考 vue3-admin-better 重建的销售管理框架</span>
          </div>
        </div>
        <div class="admin-topbar-right">
          <el-segmented v-model="app.apiMode" :options="apiModeOptions" size="small" />
          <el-avatar :size="30">销</el-avatar>
        </div>
      </header>

      <nav class="admin-tabs">
        <router-link
          v-for="tab in tabs.visited"
          :key="tab.path"
          :class="['admin-tab', { active: route.fullPath === tab.path }]"
          :to="tab.path"
        >
          {{ tab.title }}
          <button v-if="tab.path !== '/sales'" type="button" @click.prevent="closeTab(tab.path)">×</button>
        </router-link>
      </nav>

      <main class="admin-main">
        <router-view />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Expand, Fold } from '@element-plus/icons-vue';
import { appMenus } from '@/app/menu/sales';
import { useAppStore } from '@/app/store/app';
import { useTabsStore } from '@/app/store/tabs';

const route = useRoute();
const router = useRouter();
const app = useAppStore();
const tabs = useTabsStore();
const apiModeOptions = [
  { label: 'Mock', value: 'mock' },
  { label: 'Remote', value: 'remote' },
];

const pageTitle = computed(() => String(route.meta.title || '销售中心'));
const activeMenu = computed(() => {
  const path = route.path;
  return appMenus.find((item) => path === item.path || path.startsWith(`${item.path}/`))?.path || '/sales';
});

function closeTab(path: string) {
  tabs.remove(path);
  if (route.fullPath === path) router.push(tabs.visited[tabs.visited.length - 1]?.path || '/sales');
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  min-height: 100vh;
}

.admin-sidebar {
  width: 226px;
  background: var(--aw-sidebar);
  color: #fff;
  transition: width .2s;
}

.admin-sidebar.collapsed {
  width: 64px;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
}

.admin-brand strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--aw-primary);
}

.admin-menu {
  border-right: 0;
}

.admin-shell {
  min-width: 0;
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 18px;
  border-bottom: 1px solid var(--aw-border);
  background: #fff;
}

.admin-topbar-left,
.admin-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-topbar-left span {
  display: block;
  margin-top: 3px;
  color: var(--aw-muted);
  font-size: 12px;
}

.admin-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid var(--aw-border);
  background: #fff;
}

.admin-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--aw-border);
  border-radius: 6px;
  color: var(--aw-muted);
  font-size: 12px;
}

.admin-tab.active {
  border-color: var(--aw-primary);
  background: var(--aw-primary-soft);
  color: var(--aw-primary);
}

.admin-tab button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.admin-main {
  padding: 16px;
}
</style>
