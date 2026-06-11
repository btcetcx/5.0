import { useAppStore } from '@/app/store/app';
import { request } from '@/app/request/http';
import { salesMockData } from './sales.mock';
import type { SalesRecord, SalesResourceKey } from './types';

export interface SalesListQuery {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesListResult {
  items: SalesRecord[];
  total: number;
}

function filterRows(rows: SalesRecord[], query: SalesListQuery = {}): SalesListResult {
  const keyword = query.keyword?.trim().toLowerCase();
  const filtered = keyword
    ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(keyword))
    : rows;
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}

export async function listSalesResource(resource: SalesResourceKey, query?: SalesListQuery) {
  const app = useAppStore();
  if (app.apiMode === 'remote') {
    return request<SalesListResult>({ url: `/sales/${resource}`, method: 'GET', params: query });
  }
  return filterRows(salesMockData[resource], query);
}

export async function createSalesResource(resource: SalesResourceKey, record: Record<string, unknown>) {
  const app = useAppStore();
  if (app.apiMode === 'remote') {
    return request<SalesRecord>({ url: `/sales/${resource}`, method: 'POST', data: record });
  }
  const created = {
    id: `${resource}_${Date.now()}`,
    code: String(record.code || `NEW-${Date.now()}`),
    statusName: '草稿',
    ...record,
  } as SalesRecord;
  salesMockData[resource].unshift(created);
  return created;
}
