<template>
  <aw-form-page :actions="formActions" back-text="返回岗位说明书" @back="goBack" @action="handleAction">
    <section class="aw-form-card">
      <div class="aw-detail-section-title">新增岗位说明书</div>
      <div class="aw-form-grid">
        <div class="aw-field">
          <label>文档编号</label>
          <input class="aw-input" value="系统自动生成" disabled />
        </div>
        <div class="aw-field">
          <label class="req">文档名称</label>
          <input v-model="form.name" class="aw-input" placeholder="填写岗位说明书名称" />
        </div>
        <div class="aw-field">
          <label>版本号</label>
          <input v-model="form.version" class="aw-input" />
        </div>
        <div class="aw-field">
          <label>编制人</label>
          <input v-model="form.author" class="aw-input" />
        </div>
        <div class="aw-field">
          <label>生效日期</label>
          <input v-model="form.effectiveDate" class="aw-input" type="date" />
        </div>
        <div class="aw-field">
          <label>失效日期</label>
          <input v-model="form.expireDate" class="aw-input" type="date" />
        </div>
      </div>
      <div v-if="message" class="aw-form-note">{{ message }}</div>
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">附件</div>
      <aw-attachment-table
        :rows="attachments"
        :type-options="attachmentTypes"
        @add="addAttachment"
        @remove="removeAttachment"
        @upload="uploadAttachment"
      />
    </section>

    <section class="aw-form-card">
      <div class="aw-detail-section-title">正文内容</div>
      <aw-rich-text-editor v-model="content" placeholder="请输入岗位职责、任职资格、汇报关系、薪级范围等说明" />
    </section>
  </aw-form-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AwAttachmentTable from '@/components/form-page/AwAttachmentTable.vue';
import AwFormPage from '@/components/form-page/AwFormPage.vue';
import AwRichTextEditor from '@/components/form-page/AwRichTextEditor.vue';
import type { AttachmentRow, FormAction } from '@/components/form-page/types';

const router = useRouter();

const form = reactive({
  name: '',
  version: 'V 1.0',
  author: '老人事',
  effectiveDate: '2026-06-05',
  expireDate: '',
});
const message = ref('');
const content = ref('');
const attachmentTypes = ['岗位说明书', '任职资格', '职责清单', '审批材料'];
const attachments = ref<AttachmentRow[]>([{ id: 1, name: '', type: attachmentTypes[0], date: '2026-06-05', remark: '' }]);
const formActions: FormAction[] = [
  { key: 'draft', label: '保存草稿' },
  { key: 'submit', label: '提交审批', primary: true },
];

function goBack() {
  router.push('/hr/positions?action=岗位说明书');
}

function addAttachment() {
  attachments.value.push({ id: Date.now(), name: '', type: attachmentTypes[0], date: '2026-06-05', remark: '' });
}

function removeAttachment(row: AttachmentRow) {
  if (attachments.value.length <= 1) return;
  attachments.value = attachments.value.filter((item) => item.id !== row.id);
}

function uploadAttachment(row: AttachmentRow) {
  row.name = row.name || '岗位说明书附件.docx';
  message.value = `${row.name} 已加入上传队列。`;
}

function handleAction(key: string) {
  if (!form.name) {
    message.value = '请先填写文档名称。';
    return;
  }
  message.value = key === 'submit' ? '岗位说明书已提交审批。' : '岗位说明书草稿已保存。';
}
</script>
