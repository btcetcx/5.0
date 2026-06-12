import announceRaw from "@/mock/bid/announce.json";
import followupsRaw from "@/mock/bid/followups.json";
import projectsRaw from "@/mock/bid/projects.json";
import companyRaw from "@/mock/bid/company.json";
import fallbackRaw from "@/mock/bid/data.json";

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
