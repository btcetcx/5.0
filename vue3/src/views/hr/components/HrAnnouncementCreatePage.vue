<template>
  <aw-form-page
    back-text="返回人事办公"
    :actions="formActions"
    @back="router.push('/hr/office')"
    @action="handleAction"
  >
    <section class="aw-form-card">
      <div class="aw-detail-section-title">发布公告</div>
      <div class="aw-form-grid">
        <div class="aw-field">
          <label>公告编号</label>
          <input class="aw-input" value="系统自动生成" disabled />
        </div>
        <div class="aw-field">
          <label class="req">公告标题</label>
          <input v-model="form.subject" class="aw-input" placeholder="请输入公告标题" />
        </div>
        <div class="aw-field">
          <label class="req">公告分类</label>
          <select v-model="form.amount" class="aw-select">
            <option v-for="item in categoryOptions" :key="item">{{ item }}</option>
          </select>
        </div>
        <div class="aw-field">
          <label>发布人</label>
          <input v-model="form.party" class="aw-input" placeholder="请输入发布人" />
        </div>
        <div class="aw-field">
          <label>发布范围</label>
          <select v-model="form.group" class="aw-select">
            <option v-for="item in scopeOptions" :key="item">{{ item }}</option>
          </select>
        </div>
        <div class="aw-field">
          <label>重要程度</label>
          <select v-model="form.priority" class="aw-select">
            <option v-for="item in priorityOptions" :key="item">{{ item }}</option>
          </select>
        </div>
        <div class="aw-field">
          <label>生效日期</label>
          <input v-model="form.date" class="aw-input" type="date" />
        </div>
        <div class="aw-field">
          <label>失效日期</label>
          <input v-model="form.expireDate" class="aw-input" type="date" />
        </div>
        <div class="aw-field">
          <label>发布状态</label>
          <select v-model="form.status" class="aw-select">
            <option v-for="item in statusOptions" :key="item">{{ item }}</option>
          </select>
        </div>
      </div>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">附件</div>
      <aw-attachment-table
        :rows="attachments"
        :type-options="attachmentTypeOptions"
        @add="addAttachment"
        @remove="removeAttachment"
        @upload="uploadAttachment"
      />
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">公告正文</div>
      <aw-rich-text-editor v-model="content" />
    </section>

    <div v-if="message" class="aw-form-note">{{ message }}</div>
  </aw-form-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createHrRecord } from '@/app/api/hr/resources';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import type { AttachmentRow, FormAction } from '@/components/form-page/types';

const router = useRouter();

const categoryOptions = ['通知公告', '制度公告', '活动公告', '行政公告'];
const scopeOptions = ['全体员工', '人力中心', '销售中心', '研发中心', '财务中心'];
const priorityOptions = ['普通', '重要', '紧急'];
const statusOptions = ['草稿', '待发布', '已发布'];
const attachmentTypeOptions = ['公告附件', '制度文件', '图片附件', '其他'];
const formActions: FormAction[] = [
  { key: 'draft', label: '保存草稿' },
  { key: 'submit', label: '发布公告', primary: true },
];

const form = reactive({
  subject: '',
  amount: categoryOptions[0],
  party: '老人事',
  group: scopeOptions[0],
  priority: priorityOptions[0],
  date: '2026-06-05',
  expireDate: '',
  status: statusOptions[0],
});
const content = ref('');
const message = ref('');
const attachments = ref<AttachmentRow[]>([
  { id: 1, name: '', type: attachmentTypeOptions[0], date: '2026-06-05', remark: '' },
]);

function addAttachment() {
  attachments.value.push({ id: Date.now(), name: '', type: attachmentTypeOptions[0], date: '2026-06-05', remark: '' });
}

function removeAttachment(row: AttachmentRow) {
  if (attachments.value.length <= 1) return;
  attachments.value = attachments.value.filter((item) => item.id !== row.id);
}

function uploadAttachment(row: AttachmentRow) {
  message.value = `${row.name || '附件'} 已触发上传。`;
}

async function handleAction(key: string) {
  const status = key === 'draft' ? '草稿' : '已发布';
  const saved = await createHrRecord('hr-office', {
    ...form,
    subject: form.subject || '未命名公告',
    status,
    owner: form.party,
    left: form.party,
    done: form.group,
    type: '公告',
    content: content.value,
    attachments: attachments.value,
  });
  message.value = key === 'draft' ? '公告草稿已保存。' : '公告已发布。';
  router.push(`/hr/office?id=${encodeURIComponent(saved.id)}`);
}
</script>
