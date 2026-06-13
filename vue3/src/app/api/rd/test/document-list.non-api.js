export const rdDocumentStateOptions = ['已发布', '待审核', '已停用', '草稿', '已退回', '已驳回'];

export const rdDocumentListStaticConfig = {
  module: 'docs',
  title: '文档库',
  resource: 'rd-documents',
  route: '/rd/doc',
  createLabel: '新增文档',
  searchPlaceholder: '搜索文档名称、编号、负责人',
  treeTitle: '文档库',
  treeFilterKey: 'type',
  columns: [
    { key: 'code', title: '文档编码', width: 140, link: true },
    { key: 'name', title: '文档名称', width: 220, link: true },
    { key: 'type', title: '类型', width: 120, filterOptions: [] },
    { key: 'state', title: '状态', width: 110, filterOptions: rdDocumentStateOptions },
    { key: 'version', title: '版本', width: 90 },
    { key: 'owner', title: '编制人', width: 100 },
    { key: 'date', title: '更新日期', width: 120 },
    { key: 'action', title: '操作', width: 90, fixed: 'right' },
  ],
};
