export interface RdDocumentCategoryRoot {
  key: string;
  name: string;
}

export interface RdDocumentCategoryColumn {
  key: string;
  label: string;
  width?: string;
}

export interface RdDocumentCategoryRow {
  id: string;
  name: string;
  code: string;
  parentKey: string;
  parentName: string;
  sort: number;
  enabled: boolean;
}

export interface RdDocumentCategoryResponse {
  addText: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  rootTitle: string;
  rootAddText: string;
  defaultRootKey: string;
  roots: RdDocumentCategoryRoot[];
  columns: RdDocumentCategoryColumn[];
  rows: RdDocumentCategoryRow[];
}

export const rdDocumentCategoryMockResponse: RdDocumentCategoryResponse = {
  addText: '新增子分类',
  title: '文档分类设置',
  description: '维护文档库左侧一级分类，以及当前一级分类下的二级分类列表。',
  searchPlaceholder: '搜索下级分类名称/编号',
  rootTitle: '文档分类',
  rootAddText: '新增文档分类',
  defaultRootKey: 'plan',
  roots: [
    { key: 'plan', name: '工艺方案' },
    { key: 'craft', name: '工艺文件' },
    { key: 'tech', name: '技术文档' },
    { key: 'spec', name: '操作规范' },
  ],
  columns: [
    { key: 'index', label: '序号', width: '70px' },
    { key: 'name', label: '分类名称' },
    { key: 'parentName', label: '上级分类' },
    { key: 'code', label: '分类编码' },
    { key: 'sort', label: '排序', width: '90px' },
    { key: 'enabled', label: '状态', width: '90px' },
  ],
  rows: [
    { id: 'rd_doc_cat_sub_1', name: '控制方案', code: 'DOC_PLAN_CTRL', parentKey: 'plan', parentName: '工艺方案', sort: 1, enabled: true },
    { id: 'rd_doc_cat_sub_2', name: '自动化方案', code: 'DOC_PLAN_AUTO', parentKey: 'plan', parentName: '工艺方案', sort: 2, enabled: true },
    { id: 'rd_doc_cat_sub_3', name: '焊接作业', code: 'DOC_CRAFT_WELD', parentKey: 'craft', parentName: '工艺文件', sort: 1, enabled: true },
    { id: 'rd_doc_cat_sub_4', name: '技术规范', code: 'DOC_TECH_SPEC', parentKey: 'tech', parentName: '技术文档', sort: 1, enabled: true },
    { id: 'rd_doc_cat_sub_5', name: '安全操作', code: 'DOC_OP_SAFE', parentKey: 'spec', parentName: '操作规范', sort: 1, enabled: true },
  ],
};

export const rdDocumentCategoryApiMock = {
  endpoint: '/rd-documents/categories',
  method: 'GET',
  response: rdDocumentCategoryMockResponse,
};

export const rdDocumentCategoryRoots = rdDocumentCategoryMockResponse.roots;
export const rdDocumentCategoryRows = rdDocumentCategoryMockResponse.rows;
