import type { AwTableColumn } from '@/components/list-page/types';

export interface RdDocumentListStaticConfig {
  module: 'docs';
  title: string;
  resource: string;
  route: string;
  createLabel: string;
  searchPlaceholder: string;
  treeTitle: string;
  treeFilterKey: string;
  columns: AwTableColumn[];
}

export const rdDocumentStateOptions: string[];
export const rdDocumentListStaticConfig: RdDocumentListStaticConfig;
