import { rdMockData } from './rd.mock';
import type { RdRecord, RdResourceKey } from './types';

export interface RdListQuery {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function listRdResource(resource: RdResourceKey, query: RdListQuery = {}) {
  const keyword = String(query.keyword || '').trim().toLowerCase();
  const source = rdMockData[resource] || [];
  const filtered = keyword
    ? source.filter((row) => JSON.stringify(row).toLowerCase().includes(keyword))
    : source;

  return {
    items: filtered,
    total: filtered.length,
  };
}

export async function getRdResource(resource: RdResourceKey, id: string) {
  return (rdMockData[resource] || []).find((row) => row.id === id) || rdMockData[resource]?.[0];
}

export async function createRdResource(resource: RdResourceKey, payload: Partial<RdRecord>) {
  const row: RdRecord = {
    id: `${resource}_${Date.now()}`,
    code: `RD-MOCK-${Date.now().toString().slice(-5)}`,
    statusName: '草稿',
    ...payload,
  };
  rdMockData[resource].unshift(row);
  return row;
}
