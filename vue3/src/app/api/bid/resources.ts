import announceRaw from "@/mock/bid/announce.json";
import followupsRaw from "@/mock/bid/followups.json";
import projectsRaw from "@/mock/bid/projects.json";
import companyRaw from "@/mock/bid/company.json";
import fallbackRaw from "@/mock/bid/data.json";
import rechargesRaw from "@/mock/bid/recharges.json";
import expensesRaw from "@/mock/bid/expenses.json";
import accountRaw from "@/mock/bid/account.json";

const announceAll: any[] = JSON.parse(JSON.stringify(announceRaw));
const followupsData: any[] = JSON.parse(JSON.stringify(followupsRaw));
const projectsData: any[] = JSON.parse(JSON.stringify(projectsRaw));
const companyData: any[] = JSON.parse(JSON.stringify(companyRaw));
const fallbackData: Record<string, any[]> = JSON.parse(JSON.stringify(fallbackRaw));

const announceItems = announceAll.filter((item: any) => item.source === "招标采购");
const nzjItems = announceAll.filter((item: any) => item.source === "拟在建");

const dataMap: Record<string, any[]> = {
  announce: announceItems,
  nzj: nzjItems,
  projectProgress: followupsData,
  bidProject: projectsData,
  enterpriseMonitor: companyData,
  company: companyData,
};

for (const key of Object.keys(fallbackData)) {
  if (!(key in dataMap)) {
    dataMap[key] = fallbackData[key];
  }
}

const keyMap: Record<string, string> = {
  announce: "announce", nzj: "nzj", enterprise: "enterprise",
  buyerUnit: "buyerUnit", subscribe: "subscribe",
  collect: "collect", account: "account",
  company: "company", staff: "staff",
  customer: "customer", bidProject: "bidProject",
  material: "material", contract: "contract",
  bidCompany: "bidCompany",
  projectProgress: "projectProgress", enterpriseMonitor: "enterpriseMonitor",
  estimate: "announce",
};

export function listSectionData(section: string, page: string, keyword = "") {
  var dataKey = keyMap[section] || keyMap[page] || "";
  if (!dataKey) return Promise.resolve({ rows: [], total: 0 });
  var items: any[] = dataMap[dataKey] || [];
  if (keyword) {
    var kw = keyword.toLowerCase();
    items = items.filter(function(r: any) {
      return Object.values(r).some(function(v: any) { return String(v ?? "").toLowerCase().includes(kw); });
    });
  }
  return Promise.resolve({ rows: [...items], total: items.length });
}

export function toneByStatus(status = ""): string {
  if (["已发布","已投标","已签订","有效","启用","活跃","在职","已中标","已完成"].includes(status)) return "green";
  if (["公告中","编制中","待开标","待评标","进行中"].includes(status)) return "yellow";
  if (["已流标","未中标","停用"].includes(status)) return "red";
  if (["拟建中","可研阶段","规划设计"].includes(status)) return "blue";
  if (["关注中","报名中","已报名","待评估"].includes(status)) return "blue";
  return "gray";
}

const rechargesData: any[] = JSON.parse(JSON.stringify(rechargesRaw));
const expensesData: any[] = JSON.parse(JSON.stringify(expensesRaw));
const accountData: any = JSON.parse(JSON.stringify(accountRaw));

export function getAccountInfo() {
  return Promise.resolve({ ...accountData });
}

export function listRecharges() {
  return Promise.resolve({ rows: [...rechargesData].reverse(), total: rechargesData.length });
}

export function listExpenses() {
  return Promise.resolve({ rows: [...expensesData].sort((a: any, b: any) => b.createTime.localeCompare(a.createTime)), total: expensesData.length });
}

export function doRecharge(payload: { amount: number; method: string; remark?: string }) {
  const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai", hour12: false }).replace("T", " ");
  const newOrder: any = {
    id: "rc" + String(Date.now()),
    orderNo: "RC-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + String(rechargesData.length + 1).padStart(3, "0"),
    amount: payload.amount,
    method: payload.method,
    status: "已到账",
    createTime: now,
    arriveTime: now,
    receiptNo: "RCT-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + String(rechargesData.length + 1).padStart(3, "0"),
    remark: payload.remark || "",
  };
  rechargesData.push(newOrder);
  accountData.balance += payload.amount;
  accountData.available += payload.amount;
  accountData.totalRecharge += payload.amount;
  accountData.lastRecharge = now;
  return Promise.resolve(newOrder);
}

export type BidSearchScope = 'title' | 'tenderer' | 'content';

export interface BidSearchFilters {
  keyword?: string;
  region?: string;
  projectType?: string;
  status?: string;
  budgetMin?: number;
  budgetMax?: number;
  dateFrom?: string;
  dateTo?: string;
  scopes?: BidSearchScope[];
  infoType?: string;
  industry?: string;
  page?: number;
  pageSize?: number;
}

export function searchBidding(filters: BidSearchFilters = {}) {
  let items = [...announceItems];
  if (filters.keyword) {
    var kw = filters.keyword.toLowerCase();
    items = items.filter(function(r: any) {
      return [r.title, r.tenderer, r.region].some(function(v: any) { return String(v ?? "").toLowerCase().includes(kw); });
    });
  }
  if (filters.region) {
    items = items.filter(function(r: any) { return r.region === filters.region; });
  }
  if (filters.projectType) {
    items = items.filter(function(r: any) { return r.projectType === filters.projectType; });
  }
  if (filters.status) {
    items = items.filter(function(r: any) { return r.status === filters.status; });
  }
  if (filters.budgetMin !== undefined) {
    items = items.filter(function(r: any) { return r.budget >= (filters.budgetMin || 0); });
  }
  if (filters.budgetMax) {
    items = items.filter(function(r: any) { return filters.budgetMax ? r.budget <= filters.budgetMax : true; });
  }
  if (filters.dateFrom) {
    items = items.filter(function(r: any) { return filters.dateFrom ? r.pubDate >= filters.dateFrom : true; });
  }
  if (filters.dateTo) {
    items = items.filter(function(r: any) { return filters.dateTo ? r.pubDate <= filters.dateTo : true; });
  }
  var total = items.length;
  var page = filters.page || 1;
  var pageSize = filters.pageSize || 20;
  var start = (page - 1) * pageSize;
  return Promise.resolve({ rows: items.slice(start, start + pageSize), total, page, pageSize });
}

export function getSearchFilterOptions() {
  var regions = [...new Set(announceItems.map(function(r: any) { return r.region; }))];
  var industries = [...new Set(announceItems.map(function(r: any) { return r.industry; }))];
  var infoTypes = [...new Set(announceItems.map(function(r: any) { return r.infoType; }))];
  var types = [...new Set(announceItems.map(function(r: any) { return r.projectType; }))];
  var statuses = [...new Set(announceItems.map(function(r: any) { return r.status; }))];
  var allBudgets: number[] = announceItems.map(function(r: any) { return r.budget; });
  var maxBudget = Math.max(...announceItems.map(function(r: any) { return r.budget; }));
  return { regions, types, statuses, maxBudget, industries, infoTypes };
}
