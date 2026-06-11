<template>
  <section class="aw-page">
    <div class="create-toolbar aw-card">
      <el-button @click="router.push(`/rd/${resource}`)">返回列表</el-button>
      <div class="create-toolbar-actions">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="submitCreate">保存</el-button>
      </div>
    </div>

    <section class="aw-card create-head">
      <div>
        <strong>{{ config.createLabel }}</strong>
        <span>按研发中心资源配置生成新增页，保存后回到对应列表。</span>
      </div>
    </section>

    <el-alert v-if="message" :title="message" show-icon type="success" @close="message = ''" />

    <section class="aw-card create-card">
      <div class="section-title">基础信息</div>
      <el-form :model="form" label-width="120px">
        <el-row :gutter="16">
          <el-col v-for="field in config.formFields" :key="field.key" :span="field.type === 'textarea' ? 24 : 12">
            <el-form-item :label="field.label" :required="field.required">
              <el-select v-if="field.type === 'select'" v-model="form[field.key]" clearable placeholder="请选择">
                <el-option v-for="option in field.options || []" :key="option" :label="option" :value="option" />
              </el-select>
              <el-date-picker v-else-if="field.type === 'date'" v-model="form[field.key]" type="date" value-format="YYYY-MM-DD" />
              <el-input-number v-else-if="field.type === 'number'" v-model="form[field.key]" :min="0" style="width: 100%" />
              <el-input v-else-if="field.type === 'textarea'" v-model="form[field.key]" type="textarea" :rows="4" />
              <el-input v-else v-model="form[field.key]" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template v-if="resource === 'projects'">
        <div class="section-title">项目初始化</div>
        <div class="quick-grid">
          <article v-for="item in projectInitItems" :key="item.title" class="quick-card">
            <strong>{{ item.title }}</strong>
            <span>{{ item.desc }}</span>
          </article>
        </div>
      </template>

      <template v-else-if="resource === 'boms'">
        <div class="section-title">BOM明细入口</div>
        <div class="quick-grid">
          <article v-for="item in bomInitItems" :key="item.title" class="quick-card">
            <strong>{{ item.title }}</strong>
            <span>{{ item.desc }}</span>
          </article>
        </div>
      </template>

      <template v-else>
        <div class="section-title">工艺路线入口</div>
        <div class="quick-grid">
          <article v-for="item in processInitItems" :key="item.title" class="quick-card">
            <strong>{{ item.title }}</strong>
            <span>{{ item.desc }}</span>
          </article>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createRdResource } from './rd.api';
import { rdResourceConfigs } from './rd.config';
import type { RdResourceKey } from './types';

const route = useRoute();
const router = useRouter();
const resource = computed(() => String(route.params.resource || 'projects') as RdResourceKey);
const config = computed(() => rdResourceConfigs[resource.value] || rdResourceConfigs.projects);
const form = reactive<Record<string, string | number | undefined>>({});
const message = ref('');

const projectInitItems = [
  { title: '成员配置', desc: '保存项目后可在详情页维护研发、销售、工艺、BOM成员。' },
  { title: 'BOM基准', desc: '项目详情可引用或新增BOM，并锁定为报价和生产基准。' },
  { title: '工艺基准', desc: '项目详情可选择工艺路线，支持自制和委外工序追踪。' },
];
const bomInitItems = [
  { title: '物料导入', desc: '预留Excel导入、物料选择和替代料维护入口。' },
  { title: '型号适配', desc: '支持按产品型号过滤适用物料，形成项目BOM版本。' },
  { title: '审批生效', desc: '保存后可在详情页查看审批状态和生效信息。' },
];
const processInitItems = [
  { title: '工序画布', desc: '保存后可维护串序、并序、自制和委外工序。' },
  { title: '工时成本', desc: '支持标准工时、人工、设备和委外成本测算。' },
  { title: '质量参数', desc: '可记录检验要求、技术参数和产出物。' },
];

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key]);
}

async function submitCreate() {
  const row = await createRdResource(resource.value, { ...form });
  message.value = `${config.value.createLabel}已保存，编号 ${row.code}。`;
  setTimeout(() => router.push(`/rd/${resource.value}`), 500);
}

watch(
  () => route.fullPath,
  () => {
    resetForm();
    message.value = '';
  },
  { immediate: true },
);
</script>

<style scoped>
.create-toolbar,
.create-toolbar-actions {
  display: flex;
  align-items: center;
}

.create-toolbar {
  justify-content: space-between;
  padding: 12px;
}

.create-toolbar-actions {
  gap: 8px;
}

.create-head {
  padding: 16px;
}

.create-head strong {
  display: block;
  margin-bottom: 4px;
  font-size: 18px;
}

.create-head span {
  color: var(--aw-muted);
  font-size: 13px;
}

.create-card {
  padding: 16px;
}

.section-title {
  margin: 0 0 14px;
  font-weight: 700;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.quick-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--aw-border);
  border-radius: 8px;
  background: #f8fafc;
}

.quick-card span {
  color: var(--aw-muted);
  font-size: 13px;
  line-height: 1.6;
}
</style>
