import type { AwTreeNode } from '@/components/list-page/types';
import type { RdListConfig } from './resources';
import { rdDocumentCategoryRoots, rdDocumentCategoryRows } from './test/document-categories.api.mock';
import { rdDocumentListStaticConfig } from './test/document-list.non-api';

export const rdDocumentListConfig: RdListConfig = {
  ...rdDocumentListStaticConfig,
  treeNodes: [],
};

function buildRdDocumentCategoryTree(rows: Record<string, any>[]): AwTreeNode[] {
  const roots = rdDocumentCategoryRoots;
  const categoryRows = rdDocumentCategoryRows;
  const countByRoot = (name: string) => rows.filter((row) => row.type === name).length;
  const countByChild = (name: string) => rows.filter((row) => row.category === name).length;
  const nodes: AwTreeNode[] = [{ key: 'all', label: '全部文档', count: rows.length, level: 2, open: true, icon: 'line-folder' }];

  roots.forEach((root) => {
    nodes.push({ key: root.name, label: root.name, count: countByRoot(root.name), level: 2, open: true, icon: 'line-folder' });
    categoryRows
      .filter((row) => row.parentKey === root.key || row.parentName === root.name)
      .forEach((row) => {
        const name = String(row.name || '');
        nodes.push({ key: name, label: name, count: countByChild(name), level: 3, icon: 'line-node' });
      });
  });

  return nodes;
}

export function getRdDocumentListConfig(rows: Record<string, any>[] = []): RdListConfig {
  const documentTypeOptions = rdDocumentCategoryRoots.map((root) => root.name);
  return {
    ...rdDocumentListConfig,
    treeNodes: buildRdDocumentCategoryTree(rows),
    columns: rdDocumentListConfig.columns.map((column) => column.key === 'type'
      ? { ...column, filterOptions: documentTypeOptions.length ? documentTypeOptions : column.filterOptions }
      : column),
  };
}
