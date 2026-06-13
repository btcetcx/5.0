import { businessPrdCenters, businessPrdDocuments, businessPrdTree } from './businessPrd';
import { financePrdDocuments, financePrdTree, prdSections, type PrdDocument, type PrdSectionId, type PrdTreeNode } from './financePrd';
import { globalPrdDocuments, globalPrdTree } from './globalPrd';
import { rdPrdDocuments, rdPrdTree } from './rdPrd';

export { prdSections, type PrdDocument, type PrdTreeNode };

export const prdDocuments: PrdDocument[] = [
  ...globalPrdDocuments,
  ...rdPrdDocuments,
  ...businessPrdDocuments,
  ...financePrdDocuments,
];

export const prdTree: PrdTreeNode[] = [
  ...globalPrdTree,
  ...rdPrdTree,
  ...businessPrdTree,
  ...financePrdTree,
];

export const prdCenterRoutes: Record<string, string> = {
  'global-flow': '/prd/global-flow',
  rd: '/prd/rd',
  sales: '/prd/sales',
  purchase: '/prd/purchase',
  warehouse: '/prd/warehouse',
  production: '/prd/production',
  'after-sales': '/prd/after-sales',
  qc: '/prd/qc',
  hr: '/prd/hr',
  equipment: '/prd/equipment',
  energy: '/prd/energy',
  settings: '/prd/settings',
  finance: '/prd/finance',
};

export const defaultPrdDocByCenter: Record<string, string> = {
  'global-flow': globalPrdDocuments[0]?.id || '',
  rd: rdPrdDocuments[0]?.id || '',
  ...Object.fromEntries(businessPrdCenters.map((center) => {
    const defaultPage = center.pages.find((page) => page.key === 'workbench') || center.pages[0];
    return [center.key, defaultPage ? `${center.key}-${defaultPage.key}` : `${center.key}-business-flow`];
  })),
  finance: financePrdDocuments[0]?.id || '',
};

const rdDocIds = new Set(rdPrdDocuments.map((doc) => doc.id));
const globalDocIds = new Set(globalPrdDocuments.map((doc) => doc.id));
const financeDocIds = new Set(financePrdDocuments.map((doc) => doc.id));
const businessCenterKeys = businessPrdCenters.map((center) => center.key);

export function getPrdCenterByDocId(docId: string) {
  if (globalDocIds.has(docId)) return 'global-flow';
  if (rdDocIds.has(docId)) return 'rd';
  if (financeDocIds.has(docId)) return 'finance';
  const matchedCenter = businessCenterKeys.find((key) => docId === `${key}-workbench` || docId.startsWith(`${key}-`));
  if (matchedCenter) return matchedCenter;
  return 'rd';
}

export function getPrdCenterPath(docId: string) {
  return prdCenterRoutes[getPrdCenterByDocId(docId)] || prdCenterRoutes.rd;
}

export function getDefaultPrdDoc(center: string) {
  return defaultPrdDocByCenter[center] || defaultPrdDocByCenter.rd || prdDocuments[0]?.id || '';
}

export function getPrdSectionsForDocument(document: PrdDocument | undefined) {
  const sectionIds = getPrdSectionIdsForDocument(document);
  return prdSections.filter((section) => sectionIds.includes(section.id));
}

export function getDefaultPrdSection(docId: string) {
  return getPrdSectionsForDocument(prdDocuments.find((document) => document.id === docId))[0]?.id || 'fields';
}

export function getPrdSectionIdsForDocument(document: PrdDocument | undefined): PrdSectionId[] {
  if (!document) return ['fields'];
  if (document.sectionIds?.length) return document.sectionIds;
  if (document.pageType === '列表页' || document.pageType === '详情页') return ['details', 'fields', 'states', 'acceptance'];
  if (document.pageType === '新增/编辑页') return ['fields', 'acceptance'];
  if (document.pageType.includes('动作')) return ['fields', 'acceptance'];
  return ['fields'];
}
