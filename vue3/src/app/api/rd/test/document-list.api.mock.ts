export interface RdDocumentListRow extends Record<string, string> {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  state: string;
  tone: string;
  version: string;
  owner: string;
  date: string;
}

export interface RdDocumentListResponse {
  items: RdDocumentListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const rdDocumentListMockResponse: RdDocumentListResponse = {
  page: 1,
  pageSize: 20,
  total: 6,
  items: [
    { id: 'doc_001', code: 'DD-2024-001', name: '智能控制器标准规范', type: '工艺方案', category: '控制方案', state: '已发布', tone: 'green', version: 'V1.0', owner: '傲为', date: '2025-12-12' },
    { id: 'doc_002', code: 'DD-2024-002', name: '嵌入式系统设计指南', type: '工艺方案', category: '控制方案', state: '已发布', tone: 'green', version: 'V2.1', owner: '李文涛', date: '2025-11-20' },
    { id: 'doc_003', code: 'DD-2024-003', name: '生产线自动化方案', type: '工艺方案', category: '自动化方案', state: '待审核', tone: 'yellow', version: 'V0.5', owner: '陈思源', date: '2025-12-01' },
    { id: 'doc_004', code: 'DD-2024-011', name: '装配线巡检模板', type: '工艺文件', category: '焊接作业', state: '已停用', tone: 'gray', version: 'V1.2', owner: '陈思源', date: '2025-12-08' },
    { id: 'doc_005', code: 'DD-2024-021', name: '数控加工技术手册', type: '技术文档', category: '技术规范', state: '已发布', tone: 'green', version: 'V1.0', owner: '张明', date: '2025-09-18' },
    { id: 'doc_006', code: 'DD-2024-031', name: '通用安全操作流程', type: '操作规范', category: '安全操作', state: '待审核', tone: 'yellow', version: 'V0.3', owner: '李文涛', date: '2025-12-10' },
  ],
};

export const rdDocumentListApiMock = {
  endpoint: '/rd-documents',
  method: 'GET',
  response: rdDocumentListMockResponse,
};

export const rdDocumentRows = rdDocumentListMockResponse.items;
