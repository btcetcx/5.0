<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { displayEmployeeArchiveSensitiveField, type HrEmployeeArchiveSensitiveField } from '@/app/api/hr/employeeArchiveFieldAccess';
import { exportHrEmployeeArchive, getHrEmployeeArchive, printHrEmployeeArchive } from '@/app/api/hr/resources';
import type { HrEmployeeArchive } from '@/app/api/hr/types';
import AwDetailHeader from '@/components/detail-page/AwDetailHeader.vue';
import AwDetailInfoGrid from '@/components/detail-page/AwDetailInfoGrid.vue';
import AwDetailPage from '@/components/detail-page/AwDetailPage.vue';
import AwDetailTabs from '@/components/detail-page/AwDetailTabs.vue';
import AwDetailToolbar from '@/components/detail-page/AwDetailToolbar.vue';
import type { DetailTabItem } from '@/components/detail-page/types';

const props = defineProps<{ recordId: string }>();
const router = useRouter();
const archive = ref<HrEmployeeArchive | null>(null);
const activeTab = ref('personal');
const note = ref('');

const tabs: DetailTabItem[] = [
  { key: 'personal', label: '个人信息' },
  { key: 'employment', label: '就职信息' },
  { key: 'emergency', label: '紧急联系人' },
  { key: 'education', label: '教育经历' },
  { key: 'work', label: '工作经历' },
  { key: 'project', label: '项目经历' },
  { key: 'skill', label: '专业技能' },
  { key: 'honor', label: '其他荣誉' },
  { key: 'contract', label: '劳动合同' },
  { key: 'material', label: '员工资料' },
  { key: 'asset', label: '领用资产' },
  { key: 'log', label: '操作记录' },
];

const headerMetas = computed(() => archive.value ? [
  { label: '部门', value: archive.value.departmentName },
  { label: '岗位', value: archive.value.postName },
  { label: '入职日期', value: archive.value.entryTime },
  { label: '手机号', value: sensitive('mobile', archive.value.mobile) },
] : []);

const personalItems = computed(() => archive.value ? [
  { label: '姓名', value: archive.value.name },
  { label: '性别', value: archive.value.sex },
  { label: '出生日期', value: archive.value.birthday },
  { label: '手机号', value: sensitive('mobile', archive.value.mobile) },
  { label: '证件类型', value: archive.value.cardType },
  { label: '证件号码', value: sensitive('idCard', archive.value.idCard) },
  { label: '现住地址', value: sensitive('nowAddress', archive.value.nowAddress) },
  { label: '工资卡号', value: sensitive('bankAccountNo', archive.value.bankAccountNo) },
  { label: '开户银行', value: archive.value.bankBranch },
  { label: '民族', value: archive.value.nation },
  { label: '籍贯', value: archive.value.native },
  { label: '从业时间', value: archive.value.yearsOfWorkExperience },
  { label: '最高学历', value: archive.value.qualification },
  { label: '微信号', value: archive.value.weichatCode },
  { label: '邮箱', value: archive.value.email },
  { label: 'QQ号', value: archive.value.qqNumber },
  { label: '婚姻状况', value: archive.value.maritalStatus },
  { label: '个人照片', value: sensitive('photo', archive.value.photo) },
  { label: '证件照片', value: sensitive('idCardPhoto', archive.value.idCardFrontImgPath || archive.value.idCardReverseImgPath) },
] : []);

const employmentItems = computed(() => archive.value ? [
  { label: '工号', value: archive.value.workNo },
  { label: '部门', value: archive.value.departmentName },
  { label: '岗位', value: archive.value.postName },
  { label: '直属上级', value: archive.value.leaderName },
  { label: '入职日期', value: archive.value.entryTime },
  { label: '试用期', value: `${archive.value.dayOfTrial} 天` },
  { label: '转正日期', value: archive.value.regularTime || '-' },
  { label: '离职日期', value: archive.value.leaveTime || '-' },
  { label: '在职状态', value: archive.value.workStatusText },
  { label: '试用期薪资', value: sensitive('trialSalary', archive.value.trialSalary) },
  { label: '转正薪资', value: sensitive('salary', archive.value.salary) },
] : []);

async function loadData() {
  archive.value = await getHrEmployeeArchive(props.recordId);
}

function sensitive(field: HrEmployeeArchiveSensitiveField, value: string | number) {
  return displayEmployeeArchiveSensitiveField(field, value);
}

function canEditEmployeeArchive() {
  return true;
}

function backToList() {
  router.push(`/hr/archives?action=${encodeURIComponent('员工档案')}`);
}

async function handleAction(key: string) {
  if (!archive.value) return;
  if (key === 'edit' && canEditEmployeeArchive()) {
    router.push(`/hr/archives?action=${encodeURIComponent('员工档案编辑')}&id=${encodeURIComponent(archive.value.id)}`);
    return;
  }
  if (key === 'print') note.value = (await printHrEmployeeArchive(archive.value.id)).message;
  if (key === 'export') note.value = (await exportHrEmployeeArchive(archive.value.id)).message;
}

onMounted(loadData);
</script>

<template>
  <AwDetailPage v-if="archive">
    <template #toolbar>
      <AwDetailToolbar
        :actions="[
          { key: 'edit', label: '修改', primary: true },
          { key: 'print', label: '打印' },
          { key: 'export', label: '导出' },
        ]"
        back-text="返回员工档案"
        @action="handleAction"
        @back="backToList"
      />
    </template>

    <template #header>
      <AwDetailHeader
        :title="archive.name"
        :code="archive.workNo"
        :status-text="archive.workStatusText"
        :status-tone="archive.workStatusText === '离职' ? 'red' : archive.workStatusText === '试用期' ? 'yellow' : 'green'"
        :metas="headerMetas"
      />
    </template>

    <div v-if="note" class="aw-form-note hr-employee-archive-note">{{ note }}</div>

    <AwDetailTabs v-model="activeTab" :tabs="tabs">
      <section v-if="activeTab === 'personal'" class="aw-form-card">
        <h4>个人信息</h4>
        <AwDetailInfoGrid :items="personalItems" />
        <p class="hr-archive-profile">{{ archive.personalProfile }}</p>
      </section>

      <section v-else-if="activeTab === 'employment'" class="aw-form-card">
        <h4>就职信息</h4>
        <AwDetailInfoGrid :items="employmentItems" />
      </section>

      <section v-else-if="activeTab === 'emergency'" class="aw-form-card">
        <h4>紧急联系人</h4>
        <table class="aw-doc-tbl"><thead><tr><th>姓名</th><th>手机号</th><th>亲友关系</th></tr></thead><tbody><tr v-for="row in archive.emergencyContacts" :key="row.id"><td>{{ row.name }}</td><td>{{ sensitive('mobile', row.mobile) }}</td><td>{{ row.relation }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'education'" class="aw-form-card">
        <h4>教育经历</h4>
        <table class="aw-doc-tbl"><thead><tr><th>起止时间</th><th>教育等级</th><th>学校名称</th><th>专业名称</th><th>学校类型</th><th>招生类型</th><th>学历证书</th><th>学位证书</th></tr></thead><tbody><tr v-for="row in archive.educationalBackgrounds" :key="row.id"><td>{{ row.period }}</td><td>{{ row.educationLevel }}</td><td>{{ row.schoolName }}</td><td>{{ row.majorName }}</td><td>{{ row.schoolType }}</td><td>{{ row.enrollmentType }}</td><td>{{ sensitive('certificate', row.diploma) }}</td><td>{{ sensitive('certificate', row.degreeCert) }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'work'" class="aw-form-card">
        <h4>工作经历</h4>
        <table class="aw-doc-tbl"><thead><tr><th>起止时间</th><th>单位名称</th><th>职务描述</th><th>工作描述</th></tr></thead><tbody><tr v-for="row in archive.workExperiences" :key="row.id"><td>{{ row.period }}</td><td>{{ row.companyName }}</td><td>{{ row.jobDescription }}</td><td>{{ row.workDescription }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'project'" class="aw-form-card">
        <h4>项目经历</h4>
        <table class="aw-doc-tbl"><thead><tr><th>起止时间</th><th>项目名称</th><th>项目描述</th></tr></thead><tbody><tr v-for="row in archive.projectExperiences" :key="row.id"><td>{{ row.period }}</td><td>{{ row.projectName }}</td><td>{{ row.projectDescription }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'skill'" class="aw-form-card">
        <h4>专业技能</h4>
        <table class="aw-doc-tbl"><thead><tr><th>技能名称</th><th>技能等级</th></tr></thead><tbody><tr v-for="row in archive.personalSkills" :key="row.id"><td>{{ row.skillName }}</td><td>{{ row.skillLevel }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'honor'" class="aw-form-card">
        <h4>其他荣誉</h4>
        <table class="aw-doc-tbl"><thead><tr><th>荣誉名称</th><th>获得时间</th><th>荣誉描述</th><th>证书附件</th></tr></thead><tbody><tr v-for="row in archive.personalHonors" :key="row.id"><td>{{ row.honorName }}</td><td>{{ row.obtainTime }}</td><td>{{ row.honorDescription }}</td><td>{{ sensitive('certificate', row.certificatePhoto) }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'contract'" class="aw-form-card">
        <h4>劳动合同</h4>
        <table class="aw-doc-tbl"><thead><tr><th>合同版本</th><th>合同类型</th><th>开始时间</th><th>到期时间</th><th>合同附件</th></tr></thead><tbody><tr v-for="row in archive.contracts" :key="row.id"><td>{{ row.version }}</td><td>{{ row.contractType }}</td><td>{{ row.startTime }}</td><td>{{ row.endTime }}</td><td>{{ sensitive('contractAttachment', row.attachment) }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'material'" class="aw-form-card">
        <h4>员工资料</h4>
        <table class="aw-doc-tbl"><thead><tr><th>附件名称</th><th>附件类型</th><th>上传日期</th><th>备注</th></tr></thead><tbody><tr v-for="row in archive.materials" :key="row.id"><td>{{ row.name }}</td><td>{{ row.type }}</td><td>{{ row.date }}</td><td>{{ row.remark || '-' }}</td></tr></tbody></table>
      </section>

      <section v-else-if="activeTab === 'asset'" class="aw-form-card">
        <h4>领用资产</h4>
        <table class="aw-doc-tbl"><thead><tr><th>资产编号</th><th>资产名称</th><th>规格型号</th><th>资产类型</th><th>资产状态</th><th>备注</th></tr></thead><tbody><tr v-for="row in archive.assets" :key="row.id"><td>{{ row.assetCode }}</td><td>{{ row.assetName }}</td><td>{{ row.specification }}</td><td>{{ row.assetType }}</td><td>{{ row.assetStatus }}</td><td>{{ row.remark }}</td></tr></tbody></table>
      </section>

      <section v-else class="aw-form-card">
        <h4>操作记录</h4>
        <table class="aw-doc-tbl"><thead><tr><th>操作</th><th>操作人</th><th>操作时间</th><th>说明</th></tr></thead><tbody><tr v-for="row in archive.operationLogs" :key="row.id"><td>{{ row.action }}</td><td>{{ row.operator }}</td><td>{{ row.operatedAt }}</td><td>{{ row.remark }}</td></tr></tbody></table>
      </section>
    </AwDetailTabs>
  </AwDetailPage>
</template>

<style scoped>
.hr-employee-archive-note {
  margin-bottom: 12px;
}

.hr-archive-profile {
  color: var(--aw-fg-2);
  margin: 12px 0 0;
}
</style>
