<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { searchBidding, getSearchFilterOptions, toneByStatus } from "@/app/api/bid/resources";
import type { BidSearchFilters, BidSearchScope } from "@/app/api/bid/resources";
import AwDataTable from "@/components/list-page/AwDataTable.vue";
import type { AwTableColumn } from "@/components/list-page/types";

const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const active = ref(false);
const detailRow = ref<Record<string, unknown> | null>(null);
const showDetail = ref(false);
const showFilters = ref(true);
const keywordInput = ref("");

// 搜索范围
const scopeOptions: Array<{ key: BidSearchScope; label: string }> = [
  { key: "title", label: "标题" },
  { key: "tenderer", label: "采购单位" },
  { key: "content", label: "正文" },
];
const activeScopes = ref<BidSearchScope[]>(["title", "tenderer", "content"]);

// 发布时间
const datePreset = ref<"7" | "30" | "365" | "custom" | "">("");
const dateFrom = ref("");
const dateTo = ref("");
function applyDatePreset(p: "7" | "30" | "365" | "") {
  datePreset.value = p;
  if (!p) { dateFrom.value = ""; dateTo.value = ""; return; }
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - Number(p));
  dateFrom.value = start.toISOString().slice(0, 10);
  dateTo.value = end.toISOString().slice(0, 10);
}

// 筛选条件
const filters = ref<BidSearchFilters>({});
const region = ref("");
const infoType = ref("");
const industry = ref("");
const budgetMin = ref<number | undefined>(undefined);
const budgetMax = ref<number | undefined>(undefined);

const options = ref({ regions: [] as string[], types: [] as string[], statuses: [] as string[], maxBudget: 0, industries: [] as string[], infoTypes: [] as string[] });

const allInfoTypes = [
  "全部","拟建项目","采购意向","招标预告","预告","预审","预审结果","论证意见",
  "需求公示","招标公告","变更","邀标","询价","竞谈","单一","竞价",
  "招标结果","废标流标","结果变更","中标结果","成交","招标信用信息",
  "合同","验收","违规","其它"
];

// 激活的筛选标签
const activeFilters = computed(() => {
  const list: Array<{ key: string; value: string }> = [];
  if (datePreset.value) list.push({ key: "date", value: "最近" + (datePreset.value === "365" ? "1年" : datePreset.value + "天") });
  if (datePreset.value === "custom" && (dateFrom.value || dateTo.value)) list.push({ key: "date", value: (dateFrom.value || "不限") + " ~ " + (dateTo.value || "不限") });
  if (region.value) list.push({ key: "region", value: region.value });
  if (infoType.value && infoType.value !== "全部") list.push({ key: "infoType", value: infoType.value });
  if (industry.value) list.push({ key: "industry", value: industry.value });
  if (budgetMin.value || budgetMax.value) {
    let t = "";
    if (budgetMin.value) t += Number(budgetMin.value).toLocaleString() + "起";
    if (budgetMax.value) t += " ~ " + Number(budgetMax.value).toLocaleString();
    list.push({ key: "budget", value: t });
  }
  return list;
});

const columns: AwTableColumn[] = [
  { key: "title", title: "项目名称", width: 320, link: true },
  { key: "tenderer", title: "采购单位", width: 180 },
  { key: "infoType", title: "信息类型", width: 90 },
  { key: "region", title: "地区", width: 80 },
  { key: "industry", title: "行业", width: 90 },
  { key: "pubDate", title: "发布时间", width: 100 },
  { key: "deadline", title: "截止日期", width: 100 },
  { key: "budget", title: "预算(元)", width: 120 },
  { key: "status", title: "状态", width: 70 },
];

function loadOptions() {
  Promise.resolve(getSearchFilterOptions()).then(function(opt: any) { options.value = opt; });
}

function doSearch() {
  filters.value.keyword = keywordInput.value;
  filters.value.scopes = activeScopes.value;
  filters.value.region = region.value || undefined;
  filters.value.infoType = infoType.value || undefined;
  filters.value.industry = industry.value || undefined;
  filters.value.budgetMin = budgetMin.value;
  filters.value.budgetMax = budgetMax.value;
  filters.value.dateFrom = dateFrom.value || undefined;
  filters.value.dateTo = dateTo.value || undefined;
  searchBidding(filters.value).then(function(data) {
    rows.value = data.rows;
    total.value = data.total;
    active.value = true;
  });
}

function clearFilter(key: string) {
  if (key === "date") { datePreset.value = ""; dateFrom.value = ""; dateTo.value = ""; }
  else if (key === "region") region.value = "";
  else if (key === "infoType") infoType.value = "";
  else if (key === "industry") industry.value = "";
  else if (key === "budget") { budgetMin.value = undefined; budgetMax.value = undefined; }
  doSearch();
}

function clearAll() {
  keywordInput.value = "";
  datePreset.value = ""; dateFrom.value = ""; dateTo.value = "";
  region.value = ""; infoType.value = ""; industry.value = "";
  budgetMin.value = undefined; budgetMax.value = undefined;
  activeScopes.value = ["title", "tenderer", "content"];
  doSearch();
}

function showRow(row: Record<string, unknown>) {
  detailRow.value = row;
  showDetail.value = true;
}

function detailFields() {
  if (!detailRow.value) return [];
  const map: Record<string, string> = { title: "项目名称", tenderer: "采购单位", region: "地区", industry: "行业", pubDate: "发布时间", deadline: "截止日期", budget: "预算(元)", infoType: "信息类型", source: "来源", status: "状态", content: "项目内容" };
  return Object.entries(detailRow.value).filter(function([k]) { return k !== "id"; }).map(function([k, v]) { return { label: map[k] || k, value: v }; });
}

function toggleScope(key: BidSearchScope) {
  const idx = activeScopes.value.indexOf(key);
  if (idx >= 0) activeScopes.value.splice(idx, 1);
  else activeScopes.value.push(key);
}

onMounted(function() { loadOptions(); });
</script>

<template>
  <div class="bid-search-page">
    <div class="bid-search-head">
      <h1>招标采购搜索</h1>
      <p>搜索全国政府采购、工程项目、货物及服务类招标公告。</p>
    </div>

    <div class="bid-search-bar">
      <div class="bid-search-input-wrap">
        <input v-model="keywordInput" type="text" placeholder="输入搜索关键词..." @keyup.enter="doSearch" />
        <button class="aw-btn primary bid-search-btn" type="button" @click="doSearch">搜索</button>
      </div>
    </div>

    <div class="bid-filter-bar">
      <div class="bid-scope-group">
        <span class="bid-filter-label">搜索范围：</span>
        <label v-for="s in scopeOptions" :key="s.key" class="bid-scope-chip" :class="{ on: activeScopes.includes(s.key) }">
          <input type="checkbox" :checked="activeScopes.includes(s.key)" @change="toggleScope(s.key)" />{{ s.label }}
        </label>
      </div>
    </div>

    <div class="bid-filter-panel">
      <div class="bid-filter-section">
        <span class="bid-filter-label">发布时间：</span>
        <div class="bid-preset-group">
          <button v-for="p in [{k:'7',t:'最近7天'},{k:'30',t:'最近30天'},{k:'365',t:'最近1年'}]" :key="p.k" :class="['bid-preset', datePreset === p.k ? 'active' : '']" type="button" @click="applyDatePreset(p.k as '7'|'30'|'365')">{{ p.t }}</button>
          <button :class="['bid-preset', datePreset === 'custom' ? 'active' : '']" type="button" @click="datePreset = 'custom'">自定义</button>
        </div>
        <div v-if="datePreset === 'custom'" class="bid-date-custom">
          <input v-model="dateFrom" type="date" @change="doSearch" />
          <span>至</span>
          <input v-model="dateTo" type="date" @change="doSearch" />
        </div>
      </div>

      <div class="bid-filter-section">
        <span class="bid-filter-label">信息类型：</span>
        <select v-model="infoType" class="bid-filter-select" @change="doSearch">
          <option v-for="t in allInfoTypes" :key="t" :value="t === '全部' ? '' : t">{{ t }}</option>
        </select>
      </div>

      <div class="bid-filter-section bid-filter-more">
        <span class="bid-filter-label">更多：</span>
        <label><span>项目地区</span><select v-model="region" class="bid-filter-input" @change="doSearch"><option value="">全部</option><option v-for="r in options.regions" :key="r" :value="r">{{ r }}</option></select></label>
        <label><span>行业</span><select v-model="industry" class="bid-filter-input" @change="doSearch"><option value="">全部</option><option v-for="i in options.industries" :key="i" :value="i">{{ i }}</option></select></label>
        <label><span>预算范围(元)</span><span class="bid-range"><input v-model.number="budgetMin" type="number" placeholder="最低" class="bid-filter-input bid-range-input" @change="doSearch" /><span class="bid-range-sep">—</span><input v-model.number="budgetMax" type="number" placeholder="最高" class="bid-filter-input bid-range-input" @change="doSearch" /></span></label>
        <button class="aw-tool-btn" type="button" style="align-self:flex-end" @click="clearAll">清除筛选</button>
      </div>
    </div>

    <div v-if="activeFilters.length > 0" class="bid-filter-chips">
      <span v-for="chip in activeFilters" :key="chip.key" class="bid-chip">{{ chip.value }}<button type="button" @click="clearFilter(chip.key)">&times;</button></span>
      <button class="aw-tool-btn" type="button" @click="clearAll">清除全部</button>
    </div>

    <div v-if="active" class="bid-results-head"><span>共找到 <strong>{{ total }}</strong> 条信息</span></div>

    <div v-if="active" class="aw-form-card" style="padding:0">
      <aw-data-table :columns="columns" :rows="rows" :total="total">
        <template #cell="{ column, record, value }">
          <span v-if="column.key === 'title'" class="aw-link" @click="showRow(record as Record<string, unknown>)">{{ value }}</span>
          <span v-else-if="column.key === 'status'" :class="['aw-status', toneByStatus(String(value))]">{{ value }}</span>
          <span v-else-if="column.key === 'infoType'" :class="['aw-badge', 'info-' + String(value)]" style="background:#e6f4ff;color:#1677ff;border-radius:3px;font-size:12px;padding:1px 6px">{{ value }}</span>
          <span v-else-if="column.key === 'budget'" style="color:var(--aw-fg-red);font-weight:500">&yen; {{ Number(value || 0).toLocaleString('zh-CN') }}</span>
          <span v-else-if="column.key === 'deadline'" :class="value ? '' : 'aw-fg-3'">{{ value || '-' }}</span>
          <span v-else>{{ value ?? '-' }}</span>
        </template>
      </aw-data-table>
    </div>

    <div v-if="!active" class="bid-search-empty"><div class="bid-search-empty-icon">🔍</div><h2>搜索招标信息</h2><p>输入关键词或选择筛选条件，查找全国范围内的招标公告。</p></div>

    <div v-if="showDetail && detailRow" class="aw-modal-mask" @click.self="showDetail = false">
      <section class="aw-modal aw-modal-lg">
        <div class="aw-modal-head"><h2>{{ detailRow.title }}</h2><button class="aw-modal-close" type="button" @click="showDetail = false">&times;</button></div>
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
  </div>
</template>

<style scoped>
.bid-search-page { display: grid; gap: 14px; padding: 20px; }
.bid-search-head h1 { margin: 0; font-size: 20px; }
.bid-search-head p { color: var(--aw-fg-3); margin: 2px 0 0; font-size: 13px; }
.bid-search-bar { display: flex; gap: 10px; }
.bid-search-input-wrap { display: flex; flex: 1; }
.bid-search-input-wrap input { background: #fff; border: 1px solid var(--aw-border); border-radius: 8px 0 0 8px; box-sizing: border-box; color: var(--aw-fg-1); flex: 1; font-size: 14px; min-height: 42px; padding: 0 16px; }
.bid-search-input-wrap input:focus { border-color: var(--aw-primary, #1677ff); outline: none; }
.bid-search-btn { border-radius: 0 8px 8px 0; font-size: 15px; min-height: 42px; padding: 0 28px; }
.bid-filter-bar { display: flex; align-items: center; gap: 10px; }
.bid-scope-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.bid-filter-label { color: var(--aw-fg-2); font-size: 13px; white-space: nowrap; }
.bid-scope-chip { align-items: center; cursor: pointer; display: inline-flex; font-size: 13px; gap: 4px; padding: 4px 10px; border: 1px solid var(--aw-border); border-radius: 4px; background: #fff; user-select: none; }
.bid-scope-chip.on { background: var(--aw-primary, #1677ff); border-color: var(--aw-primary, #1677ff); color: #fff; }
.bid-scope-chip input { display: none; }
.bid-filter-panel { background: #fafafa; border: 1px solid var(--aw-border); border-radius: 8px; display: grid; gap: 12px; padding: 14px; }
.bid-filter-section { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.bid-preset-group { display: flex; gap: 6px; }
.bid-preset { background: #fff; border: 1px solid var(--aw-border); border-radius: 4px; cursor: pointer; font-size: 13px; padding: 4px 12px; }
.bid-preset.active { background: var(--aw-primary, #1677ff); border-color: var(--aw-primary, #1677ff); color: #fff; }
.bid-date-custom { display: flex; align-items: center; gap: 6px; }
.bid-date-custom input { background: #fff; border: 1px solid var(--aw-border); border-radius: 4px; min-height: 30px; padding: 0 8px; font-size: 13px; }
.bid-filter-select { background: #fff; border: 1px solid var(--aw-border); border-radius: 6px; min-height: 34px; padding: 0 10px; font-size: 13px; min-width: 140px; }
.bid-filter-more { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
.bid-filter-more > label { display: grid; gap: 4px; }
.bid-filter-more > label > span { color: var(--aw-fg-2); font-size: 12px; }
.bid-filter-input { background: #fff; border: 1px solid var(--aw-border); border-radius: 4px; box-sizing: border-box; min-height: 32px; padding: 0 8px; font-size: 13px; }
.bid-range { display: flex; align-items: center; gap: 4px; }
.bid-range-input { width: 90px; }
.bid-range-sep { color: var(--aw-fg-3); font-size: 13px; }
.bid-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.bid-chip { align-items: center; background: #e6f4ff; border: 1px solid #91caff; border-radius: 4px; color: var(--aw-primary, #1677ff); display: inline-flex; font-size: 12px; gap: 4px; padding: 2px 8px; }
.bid-chip button { background: transparent; border: none; color: var(--aw-primary, #1677ff); cursor: pointer; font-size: 14px; line-height: 1; padding: 0; }
.bid-results-head { font-size: 13px; color: var(--aw-fg-2); }
.bid-results-head strong { color: var(--aw-primary, #1677ff); }
.bid-search-empty { text-align: center; padding: 80px 0; color: var(--aw-fg-3); }
.bid-search-empty-icon { font-size: 56px; opacity: .25; }
.bid-search-empty h2 { margin: 8px 0 4px; font-size: 18px; color: var(--aw-fg-2); }
.aw-detail-grid { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
.aw-detail-field { display: grid; gap: 2px; }
.aw-detail-field span { color: var(--aw-fg-3); font-size: 12px; }
.aw-detail-field strong { font-size: 14px; }
.aw-fg-3 { color: var(--aw-fg-3); }
</style>
