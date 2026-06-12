import type { AttachmentRow } from '@/components/form-page/types';

export type BidModule = 'announce' | 'nzj' | 'enterprise' | 'buyerUnit' | 'subscribe' | 'collect' | 'account' | 'companyManage' | 'staff' | 'customer' | 'bidProject' | 'material' | 'contract' | 'bidCompany';
export type BidTone = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

/** 投标项目 */
export interface BidProject {
  id: string; code: string; title: string; bidDept: string; bidPerson: string;
  bidAmount: number; bidDate: string; openDate: string; bidBond: number; bondStatus: string;
  projectType: string; region: string; tenderer: string; status: string; result: string;
  remark?: string; attachments?: AttachmentRow[];
}

/** 投标保证金 */
export interface BidBond {
  id: string; projectId: string; projectTitle: string; bondAmount: number;
  paymentDate: string; returnDate: string; paymentMethod: string; status: string;
  receiptNo: string; handler: string; remark?: string;
}

/** 投标报名 */
export interface BidRegistration {
  id: string; projectId: string; projectTitle: string; registerDate: string;
  deadline: string; submittedDate: string; documents: string; status: string;
  contacts: string; phone: string; remark?: string;
}

/** 投标关注 */
export interface BidFollowup {
  id: string; projectTitle: string; tenderer: string; bidAmount: number;
  pubDate: string; deadline: string; region: string; priority: string;
  status: string; person: string; remark?: string;
}

/** 企业信息 */
export interface BidCompany {
  id: string; name: string; unifiedCode: string; legalPerson: string;
  registeredCapital: number; establishDate: string; address: string;
  contacts: string; phone: string; qualificationLevel: string; status: string;
  businessScope: string; attachments?: AttachmentRow[];
}

/** 投标报表统计 */
export interface BidReport {
  id: string; year: string; month: string; totalBids: number; wonBids: number;
  totalAmount: number; wonAmount: number; bidRate: number; bondTotal: number;
  avgBondAmount: number; topRegion: string; topProjectType: string;
}
