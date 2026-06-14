<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { listSectionData, toneByStatus } from "@/app/api/bid/resources";
import AwDataTable from "@/components/list-page/AwDataTable.vue";
import AwListPage from "@/components/list-page/AwListPage.vue";
import AwListToolbar from "@/components/list-page/AwListToolbar.vue";
import type { AwTableColumn } from "@/components/list-page/types";
import type { ToolbarActionKey } from "@/components/list-page/types";

const route = useRoute();
const keyword = ref("");
const rows = ref<Record<string, unknown>[]>([]);
const detailRow = ref<Record<string, unknown> | null>(null);
const showDetail = ref(false);
const showCreate = ref(false);
const createForm = ref<Record<string, string>>({});
const toastText = ref("");

interface PageConfig {
  dataKey: string;
  title: string;
  columns: AwTableColumn[];
  crud: boolean;
}

function makeConfig(dataKey: string, title: string, columns: AwTableColumn[], crud = false): PageConfig {
  return { dataKey, title, columns, crud };
}

var configs: Record<string, PageConfig> = {
  announce: makeConfig("announce","招标采购搜索",[{key:"title",title:"项目名称",width:300,link:true},{key:"tenderer",title:"招标方",width:160},{key:"region",title:"地区",width:90},{key:"pubDate",title:"发布时间",width:100},{key:"deadline",title:"截止日期",width:100},{key:"budget",title:"预算(元)",width:110},{key:"projectType",title:"类型",width:90},{key:"status",title:"状态",width:80}]),
  nzj: makeConfig("nzj","拟在建搜索",[{key:"title",title:"项目名称",width:300,link:true},{key:"tenderer",title:"建设单位",width:160},{key:"region",title:"地区",width:90},{key:"pubDate",title:"发布时间",width:100},{key:"budget",title:"投资(元)",width:110},{key:"projectType",title:"项目阶段",width:90},{key:"status",title:"状态",width:80}]),
  enterprise: makeConfig("enterprise","企业搜索",[{key:"name",title:"企业名称",width:220,link:true},{key:"unifiedCode",title:"统一代码",width:160},{key:"legalPerson",title:"法人",width:90},{key:"regCapital",title:"注册资本(元)",width:120},{key:"industry",title:"行业",width:100},{key:"region",title:"地区",width:90},{key:"creditLevel",title:"信用等级",width:90}]),
  buyerUnit: makeConfig("buyerUnit","采购单位搜索",[{key:"name",title:"单位名称",width:220,link:true},{key:"region",title:"地区",width:90},{key:"industry",title:"行业",width:100},{key:"lastBidDate",title:"最近招标",width:100},{key:"totalProjects",title:"项目总数",width:90},{key:"contactPerson",title:"联系人",width:100},{key:"contactPhone",title:"电话",width:130}]),
  subscribe: makeConfig("subscribe","我的订阅",[{key:"keyword",title:"关键词",width:160},{key:"region",title:"地区",width:90},{key:"notifyCount",title:"通知数",width:80},{key:"lastNotify",title:"最后通知",width:100},{key:"status",title:"状态",width:70},{key:"createdAt",title:"创建时间",width:100}]),
  collect: makeConfig("collect","我的收藏",[{key:"title",title:"项目名称",width:300,link:true},{key:"source",title:"来源",width:90},{key:"collectDate",title:"收藏日期",width:100},{key:"deadline",title:"截止日期",width:100},{key:"remark",title:"备注",width:150}]),
  account: makeConfig("account","账户余额",[{key:"balance",title:"账户余额",width:120},{key:"frozen",title:"冻结金额",width:100},{key:"available",title:"可用余额",width:100},{key:"lastRecharge",title:"最后充值",width:100},{key:"status",title:"状态",width:70}]),
  company: makeConfig("company","公司管理",[{key:"name",title:"公司名称",width:220,link:true},{key:"legalPerson",title:"法人",width:90},{key:"unifiedCode",title:"统一代码",width:160},{key:"registeredCapital",title:"注册资本(元)",width:120},{key:"qualificationLevel",title:"资质等级",width:90},{key:"contacts",title:"联系人",width:100},{key:"phone",title:"电话",width:130},{key:"status",title:"状态",width:70}], true),
  staff: makeConfig("staff","员工管理",[{key:"name",title:"姓名",width:100},{key:"dept",title:"部门",width:100},{key:"position",title:"职位",width:110},{key:"certificates",title:"资质证书",width:140},{key:"phone",title:"电话",width:130},{key:"status",title:"状态",width:70}], true),
  customer: makeConfig("customer","客户管理",[{key:"name",title:"客户名称",width:200,link:true},{key:"region",title:"地区",width:90},{key:"contacts",title:"联系人",width:100},{key:"phone",title:"电话",width:130},{key:"lastBidDate",title:"最近投标",width:100},{key:"totalBids",title:"投标次数",width:80},{key:"status",title:"状态",width:70}], true),
  bidProject: makeConfig("bidProject","标书项目",[{key:"title",title:"项目名称",width:250,link:true},{key:"company",title:"投标公司",width:160},{key:"bidAmount",title:"投标金额(元)",width:120},{key:"bidDate",title:"投标日期",width:100},{key:"openDate",title:"开标日期",width:100},{key:"status",title:"状态",width:80},{key:"result",title:"结果",width:80}], true),
  material: makeConfig("material","资料管理",[{key:"title",title:"资料名称",width:200,link:true},{key:"category",title:"分类",width:100},{key:"uploadDate",title:"上传日期",width:100},{key:"expireDate",title:"到期日期",width:100},{key:"status",title:"状态",width:70},{key:"remark",title:"备注",width:150}], true),
  contract: makeConfig("contract","合同管理",[{key:"title",title:"合同名称",width:250,link:true},{key:"partyA",title:"甲方",width:160},{key:"partyB",title:"乙方",width:160},{key:"amount",title:"金额(元)",width:110},{key:"signDate",title:"签订日期",width:100},{key:"status",title:"状态",width:70}], true),
  bidCompany: makeConfig("bidCompany","投标公司",[{key:"name",title:"公司名称",width:220,link:true},{key:"regCapital",title:"注册资本(元)",width:130},{key:"qualLevel",title:"资质等级",width:90},{key:"region",title:"区域",width:90},{key:"cooperated",title:"曾合作",width:70},{key:"lastCooperate",title:"最后合作",width:100},{key:"remark",title:"备注",width:120}], true),
  estimate: makeConfig("estimate","潜在项目预测",[{key:"title",title:"项目名称",width:300,link:true},{key:"tenderer",title:"建设单位",width:160},{key:"region",title:"地区",width:90},{key:"budget",title:"预计投资(元)",width:110},{key:"pubDate",title:"预测时间",width:100},{key:"projectType",title:"类型",width:90},{key:"status",title:"状态",width:80}]),
  projectProgress: makeConfig("projectProgress","项目进度监控",[{key:"projectTitle",title:"项目名称",width:250,link:true},{key:"tenderer",title:"招标方",width:160},{key:"region",title:"地区",width:90},{key:"bidAmount",title:"金额(元)",width:120},{key:"pubDate",title:"发布时间",width:100},{key:"deadline",title:"截止日期",width:100},{key:"priority",title:"优先级",width:80},{key:"status",title:"状态",width:80},{key:"person",title:"负责人",width:100}]),
  enterpriseMonitor: makeConfig("enterpriseMonitor","企业情报监控",[{key:"name",title:"企业名称",width:220,link:true},{key:"unifiedCode",title:"统一代码",width:160},{key:"legalPerson",title:"法人",width:90},{key:"registeredCapital",title:"注册资本(元)",width:120},{key:"qualificationLevel",title:"资质等级",width:90},{key:"contacts",title:"联系人",width:100},{key:"phone",title:"电话",width:130},{key:"status",title:"状态",width:70}]),
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

const moduleTitle = computed(() => config.value?.title || pageKey.value || "投标中心");

const toolbarActions = computed<ToolbarActionKey[]>(() => {
  if (!config.value) return [];
  return config.value.crud ? ["refresh", "filter", "columns", "create"] : ["refresh", "filter", "columns"];
});

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
  else if (action === "create") {
    createForm.value = {};
    showCreate.value = true;
  }
}

function showRow(row: Record<string, unknown>) {
  detailRow.value = row;
  showDetail.value = true;
}

function doCreate() {
  const form = createForm.value;
  if (form.name) form.name = form.name || form.title || "";
  const newRow: Record<string, unknown> = { id: "new_" + Date.now(), ...form, status: "启用" };
  rows.value = [newRow, ...rows.value];
  showCreate.value = false;
  toastText.value = "已新增";
  setTimeout(() => { toastText.value = ""; }, 2000);
}

function detailFields(): Array<{ label: string; value: unknown }> {
  if (!detailRow.value) return [];
  return Object.entries(detailRow.value)
    .filter(([k]) => k !== "id")
    .map(([k, v]) => ({
      label: config.value?.columns.find(c => c.key === k)?.title || k,
      value: v
    }));
}

function createFields(): Array<{ key: string; title: string; type: string }> {
  if (!config.value) return [];
  return config.value.columns
    .filter(c => c.key !== "id" && c.key !== "status" && c.key !== "uploadDate")
    .map(c => ({
      key: c.key,
      title: c.title || c.key,
      type: c.key === "budget" || c.key === "bidAmount" || c.key === "amount" || c.key === "registeredCapital" || c.key === "regCapital" ? "number" : "text"
    }));
}

watch(function() { return route.path + "?" + route.query.action; }, function() { showDetail.value = false; showCreate.value = false; loadList(); }, { immediate: true });
</script>

<template>
  <div v-if="config" class="bid-page">
    <aw-list-page>
      <template #toolbar>
        <aw-list-toolbar search-placeholder="搜索..." :actions="toolbarActions" @search="onSearch" @action="handleToolbar" />
      </template>
      <template #default>
        <aw-data-table :columns="config.columns" :rows="rows" :total="rows.length">
          <template #cell="{ column, record, value }">
            <span v-if="column.link" class="aw-link" @click="showRow(record as Record<string, unknown>)">{{ value }}</span>
            <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
            <span v-else-if="column.key === 'cooperated'">{{ value ? '是' : '否' }}</span>
            <span v-else-if="column.key === 'bidAmount' || column.key === 'budget' || column.key === 'amount' || column.key === 'registeredCapital' || column.key === 'regCapital'">{{ Number(value).toLocaleString('zh-CN') }}</span>
            <span v-else>{{ value ?? '-' }}</span>
          </template>
        </aw-data-table>
      </template>
    </aw-list-page>
  </div>
  <div v-else class="aw-empty-state">暂未选择页面，请从左侧菜单选择</div>

  <!-- 详情弹窗 -->
  <div v-if="showDetail && detailRow" class="aw-modal-mask" @click.self="showDetail = false">
    <section class="aw-modal aw-modal-md">
      <div class="aw-modal-head"><h2>{{ moduleTitle }} 详情</h2><button class="aw-modal-close" type="button" @click="showDetail = false">&times;</button></div>
      <div class="aw-modal-body">
        <div class="aw-detail-grid">
          <div v-for="f in detailFields()" :key="f.label" class="aw-detail-field">
            <span>{{ f.label }}</span>
            <strong>{{ f.value ?? '-' }}</strong>
          </div>
        </div>
      </div>
      <div class="aw-modal-foot"><button class="aw-btn" type="button" @click="showDetail = false">关闭</button></div>
    </section>
  </div>

  <!-- 新增弹窗 -->
  <div v-if="showCreate" class="aw-modal-mask" @click.self="showCreate = false">
    <section class="aw-modal aw-modal-md">
      <div class="aw-modal-head"><h2>新增 {{ moduleTitle }}</h2><button class="aw-modal-close" type="button" @click="showCreate = false">&times;</button></div>
      <div class="aw-modal-body">
        <div class="aw-form-grid">
          <label v-for="f in createFields()" :key="f.key" style="display:grid;gap:6px">
            <span style="color:var(--aw-fg-2);font-size:13px">{{ f.title }}</span>
            <input v-if="f.type === 'number'" v-model="createForm[f.key]" type="number" style="background:#fff;border:1px solid var(--aw-border);border-radius:6px;min-height:34px;padding:0 10px" />
            <input v-else v-model="createForm[f.key]" type="text" style="background:#fff;border:1px solid var(--aw-border);border-radius:6px;min-height:34px;padding:0 10px" />
          </label>
        </div>
      </div>
      <div class="aw-modal-foot">
        <button class="aw-btn" type="button" @click="showCreate = false">取消</button>
        <button class="aw-btn primary" type="button" @click="doCreate">保存</button>
      </div>
    </section>
  </div>

  <div v-if="toastText" class="aw-toast">{{ toastText }}</div>
</template>

<style scoped>
.bid-page { min-height: 100%; }
.aw-empty-state { align-items: center; color: var(--aw-fg-3); display: flex; font-size: 15px; justify-content: center; min-height: 200px; }
.aw-detail-grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
.aw-detail-field { display: grid; gap: 4px; }
.aw-detail-field span { color: var(--aw-fg-3); font-size: 13px; }
.aw-detail-field strong { font-size: 14px; }
.aw-form-grid { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
</style>
