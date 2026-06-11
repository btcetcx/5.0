<template>
  <hr-setting-page
    v-if="settingKey"
    :config="config"
    :setting-key="settingKey"
  />

  <hr-job-description-create-page
    v-else-if="isJobDescriptionCreateView"
  />

  <hr-announcement-create-page
    v-else-if="isAnnouncementCreateView"
  />

  <hr-office-application-create-page
    v-else-if="isOfficeApplicationCreateView"
  />

  <hr-create-page
    v-else-if="isCreateView"
    :config="config"
    :action-label="actionLabel"
  />

  <hr-detail-page
    v-else-if="isDetailView"
    :config="config"
    :action-label="actionLabel"
    :record-id="recordId"
  />

  <hr-payroll-structure-page
    v-else-if="isPayrollStructureView"
    :config="config"
    :action-label="actionLabel"
  />

  <hr-action-list
    v-else-if="actionProfile"
    :config="config"
    :profile="actionProfile"
  />

  <hr-list-view
    v-else
    :config="config"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { HrModuleKey, HrSettingKey } from '@/app/api/hr/types';
import { getHrActionProfile, hrModuleConfigs, hrResourceByPath } from './hrResource.config';
import HrActionList from './components/HrActionList.vue';
import HrAnnouncementCreatePage from './components/HrAnnouncementCreatePage.vue';
import HrCreatePage from './components/HrCreatePage.vue';
import HrDetailPage from './components/HrDetailPage.vue';
import HrJobDescriptionCreatePage from './components/HrJobDescriptionCreatePage.vue';
import HrListView from './components/HrListView.vue';
import HrOfficeApplicationCreatePage from './components/HrOfficeApplicationCreatePage.vue';
import HrPayrollStructurePage from './components/HrPayrollStructurePage.vue';
import HrSettingPage from './components/HrSettingPage.vue';

const route = useRoute();

const moduleKey = computed<HrModuleKey>(() => {
  const path = route.path.replace(/\/$/, '');
  return hrResourceByPath[path] || 'employees';
});
const config = computed(() => hrModuleConfigs[moduleKey.value]);
const actionLabel = computed(() => (typeof route.query.action === 'string' ? route.query.action : ''));
const recordId = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''));
const settingKey = computed<HrSettingKey | ''>(() => {
  if (typeof route.query.setting === 'string' && ['categories', 'fields', 'numbers', 'approvals', 'strategies', 'print'].includes(route.query.setting)) {
    return route.query.setting as HrSettingKey;
  }
  const action = actionLabel.value;
  if (/分类/.test(action)) return 'categories';
  if (/自定义字段/.test(action)) return 'fields';
  if (/自定义编号/.test(action)) return 'numbers';
  if (/审批设置/.test(action)) return 'approvals';
  if (/策略设置/.test(action)) return 'strategies';
  if (/打印模板/.test(action)) return 'print';
  return '';
});
const isCreateView = computed(() => actionLabel.value === 'new' || /^(新增|添加|新建)|发布公告|预约会议/.test(actionLabel.value));
const isJobDescriptionCreateView = computed(() => moduleKey.value === 'positions' && actionLabel.value === '新增岗位说明书');
const isAnnouncementCreateView = computed(() => moduleKey.value === 'office' && actionLabel.value === '发布公告');
const isOfficeApplicationCreateView = computed(() => moduleKey.value === 'office' && (actionLabel.value === 'new' || actionLabel.value === '新增办公申请'));
const isDetailView = computed(() => (
  Boolean(recordId.value)
  || (moduleKey.value !== 'payroll' && /详情|明细/.test(actionLabel.value))
));
const isPayrollStructureView = computed(() => (
  moduleKey.value === 'payroll'
  && /薪资方案|薪酬类型|薪酬项目/.test(actionLabel.value)
));
const actionProfile = computed(() => {
  if (!actionLabel.value || isCreateView.value || isDetailView.value || settingKey.value || isPayrollStructureView.value) return undefined;
  if (/列表/.test(actionLabel.value)) return undefined;
  return getHrActionProfile(moduleKey.value, actionLabel.value);
});
</script>
