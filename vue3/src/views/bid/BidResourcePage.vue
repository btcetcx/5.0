<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { listSectionData, toneByStatus } from "@/app/api/bid/resources";
import AwDataTable from "@/components/list-page/AwDataTable.vue";
import AwListPage from "@/components/list-page/AwListPage.vue";
import AwListToolbar from "@/components/list-page/AwListToolbar.vue";
import type { AwTableColumn } from "@/components/list-page/types";

const route = useRoute();
const keyword = ref("");
const rows = ref<Record<string, unknown>[]>([]);

interface PageConfig {
  dataKey: string;
  title: string;
  columns: AwTableColumn[];
}

var configs: Record<string, PageConfig> = {
  announce: { dataKey: "announce", title: "招标采购搜索", columns: [
    {key:"title",title:"项目名称",width:300,link:true},{key:"tenderer",title:"招标方",width:160},{key:"region",title:"地区",width:90},{key:"pubDate",title:"发布时间",width:100},{key:"deadline",title:"截止日期",width:100},{key:"budget",title:"预算(元)",width:110},{key:"projectType",title:"类型",width:90},{key:"status",title:"状态",width:80}
  ]},
  nzj: { dataKey: "nzj", title: "拟在建搜索", columns: [
    {key:"title",title:"项目名称",width:300,link:true},{key:"tenderer",title:"建设单位",width:160},{key:"region",title:"地区",width:90},{key:"pubDate",title:"发布时间",width:100},{key:"budget",title:"投资(元)",width:110},{key:"projectType",title:"项目阶段",width:90},{key:"status",title:"状态",width:80}
  ]},
  enterprise: { dataKey: "enterprise", title: "企业搜索", columns: [
    {key:"name",title:"企业名称",width:220,link:true},{key:"unifiedCode",title:"统一代码",width:160},{key:"legalPerson",title:"法人",width:90},{key:"regCapital",title:"注册资本(元)",width:120},{key:"industry",title:"行业",width:100},{key:"region",title:"地区",width:90},{key:"creditLevel",title:"信用等级",width:90}
  ]},
  buyerUnit: { dataKey: "buyerUnit", title: "采购单位搜索", columns: [
    {key:"name",title:"单位名称",width:220,link:true},{key:"region",title:"地区",width:90},{key:"industry",title:"行业",width:100},{key:"lastBidDate",title:"最近招标",width:100},{key:"totalProjects",title:"项目总数",width:90},{key:"contactPerson",title:"联系人",width:100},{key:"contactPhone",title:"电话",width:130}
  ]},
  subscribe: { dataKey: "subscribe", title: "我的订阅", columns: [
    {key:"keyword",title:"关键词",width:160},{key:"region",title:"地区",width:90},{key:"notifyCount",title:"通知数",width:80},{key:"lastNotify",title:"最后通知",width:100},{key:"status",title:"状态",width:70},{key:"createdAt",title:"创建时间",width:100}
  ]},
  collect: { dataKey: "collect", title: "我的收藏", columns: [
    {key:"title",title:"项目名称",width:300,link:true},{key:"source",title:"来源",width:90},{key:"collectDate",title:"收藏日期",width:100},{key:"deadline",title:"截止日期",width:100},{key:"remark",title:"备注",width:150}
  ]},
  account: { dataKey: "account", title: "账户余额", columns: [
    {key:"balance",title:"账户余额",width:120},{key:"frozen",title:"冻结金额",width:100},{key:"available",title:"可用余额",width:100},{key:"lastRecharge",title:"最后充值",width:100},{key:"status",title:"状态",width:70}
  ]},
  company: { dataKey: "company", title: "公司管理", columns: [
    {key:"name",title:"公司名称",width:220,link:true},{key:"legalPerson",title:"法人",width:90},{key:"unifiedCode",title:"统一代码",width:160},{key:"registeredCapital",title:"注册资本(元)",width:120},{key:"qualificationLevel",title:"资质等级",width:90},{key:"contacts",title:"联系人",width:100},{key:"phone",title:"电话",width:130},{key:"status",title:"状态",width:70}
  ]},
  staff: { dataKey: "staff", title: "员工管理", columns: [
    {key:"name",title:"姓名",width:100},{key:"dept",title:"部门",width:100},{key:"position",title:"职位",width:110},{key:"certificates",title:"资质证书",width:140},{key:"phone",title:"电话",width:130},{key:"status",title:"状态",width:70}
  ]},
  customer: { dataKey: "customer", title: "客户管理", columns: [
    {key:"name",title:"客户名称",width:200,link:true},{key:"region",title:"地区",width:90},{key:"contacts",title:"联系人",width:100},{key:"phone",title:"电话",width:130},{key:"lastBidDate",title:"最近投标",width:100},{key:"totalBids",title:"投标次数",width:80},{key:"status",title:"状态",width:70}
  ]},
  bidProject: { dataKey: "bidProject", title: "标书项目", columns: [
    {key:"title",title:"项目名称",width:250,link:true},{key:"company",title:"投标公司",width:160},{key:"bidAmount",title:"投标金额(元)",width:120},{key:"bidDate",title:"投标日期",width:100},{key:"openDate",title:"开标日期",width:100},{key:"status",title:"状态",width:80},{key:"result",title:"结果",width:80}
  ]},
  material: { dataKey: "material", title: "资料管理", columns: [
    {key:"title",title:"资料名称",width:200,link:true},{key:"category",title:"分类",width:100},{key:"uploadDate",title:"上传日期",width:100},{key:"expireDate",title:"到期日期",width:100},{key:"status",title:"状态",width:70},{key:"remark",title:"备注",width:150}
  ]},
  contract: { dataKey: "contract", title: "合同管理", columns: [
    {key:"title",title:"合同名称",width:250,link:true},{key:"partyA",title:"甲方",width:160},{key:"partyB",title:"乙方",width:160},{key:"amount",title:"金额(元)",width:110},{key:"signDate",title:"签订日期",width:100},{key:"status",title:"状态",width:70}
  ]},
  bidCompany: { dataKey: "bidCompany", title: "投标公司", columns: [
    {key:"name",title:"公司名称",width:220,link:true},{key:"regCapital",title:"注册资本(元)",width:130},{key:"qualLevel",title:"资质等级",width:90},{key:"region",title:"区域",width:90},{key:"cooperated",title:"曾合作",width:70},{key:"lastCooperate",title:"最后合作",width:100},{key:"remark",title:"备注",width:120}
  ]},
  estimate: { dataKey: "estimate", title: "潜在项目预测", columns: [
    {key:"title",title:"项目名称",width:300,link:true},{key:"tenderer",title:"建设单位",width:160},{key:"region",title:"地区",width:90},{key:"budget",title:"预计投资(元)",width:110},{key:"pubDate",title:"预测时间",width:100},{key:"projectType",title:"类型",width:90},{key:"status",title:"状态",width:80}
  ]},
  projectProgress: { dataKey: "projectProgress", title: "项目进度监控", columns: [
    {key:"projectTitle",title:"项目名称",width:250,link:true},{key:"tenderer",title:"招标方",width:160},{key:"region",title:"地区",width:90},{key:"bidAmount",title:"金额(元)",width:120},{key:"pubDate",title:"发布时间",width:100},{key:"deadline",title:"截止日期",width:100},{key:"priority",title:"优先级",width:80},{key:"status",title:"状态",width:80},{key:"person",title:"负责人",width:100}
  ]},
  enterpriseMonitor: { dataKey: "enterpriseMonitor", title: "企业情报监控", columns: [
    {key:"name",title:"企业名称",width:220,link:true},{key:"unifiedCode",title:"统一代码",width:160},{key:"legalPerson",title:"法人",width:90},{key:"registeredCapital",title:"注册资本(元)",width:120},{key:"qualificationLevel",title:"资质等级",width:90},{key:"contacts",title:"联系人",width:100},{key:"phone",title:"电话",width:130},{key:"status",title:"状态",width:70}
  ]}
};

var actionKeyMap: Record<string, string> = {
  "招标采购搜索":"announce","拟在建搜索":"nzj","企业搜索":"enterprise","采购单位搜索":"buyerUnit",
  "我的订阅":"subscribe","订阅管理":"subscribe","项目进度监控":"projectProgress","企业情报监控":"enterpriseMonitor","潜在项目预测":"estimate",
  "公司管理":"company","员工管理":"staff","客户管理":"customer","标书项目":"bidProject",
  "资料管理":"material","合同管理":"contract","投标公司":"bidCompany"
};

const pageKey = computed(() => {
  var a = route.query.action as string;
  if (a) return actionKeyMap[decodeURIComponent(a)] || "";
  var section = route.params.section as string || "";
  if (section === "collect") return "collect";
  if (section === "account") return "account";
  var page = route.params.page as string;
  if (page) return page;
  return section;
});

const config = computed(() => configs[pageKey.value]);

const moduleTitle = computed(() => config.value?.title || "投标中心");

function loadList() {
  var pk = pageKey.value;
  if (!pk || !configs[pk]) { rows.value = []; return; }
  listSectionData("", pk, keyword.value).then(function(r) { rows.value = r.rows; });
}

function onSearch(kw: string) {
  keyword.value = kw;
  loadList();
}

function handleToolbar(action: string) {
  if (action === "refresh") loadList();
}

watch(function() { return route.path + "?" + route.query.action; }, function() { loadList(); }, { immediate: true });
</script>
<template>
  <div v-if="config" class="bid-page">
    <aw-list-page>
      <template #toolbar>
        <aw-list-toolbar search-placeholder="搜索..." :actions="['refresh']" @search="onSearch" @action="handleToolbar" />
      </template>
      <template #default>
        <aw-data-table :columns="config.columns" :rows="rows" :total="rows.length">
          <template #cell="{ column, record, value }">
            <span v-if="column.link" class="aw-link">{{ value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else-if="column.key === 'cooperated'">{{ value ? '是' : '否' }}</span>
            <span v-else-if="column.key === 'bidAmount' || column.key === 'budget' || column.key === 'registeredCapital'">{{ Number(value).toLocaleString('zh-CN') }}</span>
            <span v-else>{{ value ?? '-' }}</span>
          </template>
        </aw-data-table>
      </template>
    </aw-list-page>
  </div>
</template>
<style scoped>
.bid-page { min-height: 100%; }
</style>
