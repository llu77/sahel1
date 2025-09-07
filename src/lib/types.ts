export type RequestType = 'leave' | 'advance' | 'resignation' | 'overtime';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface BaseRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  submittedAt: Date;
  reason: string;
  userId: string;
}

export interface LeaveRequest extends BaseRequest {
  type: 'leave';
  startDate: Date;
  endDate: Date;
}

export interface AdvanceRequest extends BaseRequest {
  type: 'advance';
  amount: number;
}

export interface ResignationRequest extends BaseRequest {
  type: 'resignation';
  lastWorkingDay: Date;
}

export interface OvertimeRequest extends BaseRequest {
  type: 'overtime';
  date: Date;
  hours: number;
}

export type SahlRequest = LeaveRequest | AdvanceRequest | ResignationRequest | OvertimeRequest;

export interface ExtendedRequest extends SahlRequest {
    employeeName: string;
    branch: 'laban' | 'tuwaiq' | 'admin';
    reviewNotes?: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  branch: 'laban' | 'tuwaiq' | 'admin';
  title: string;
}

// Financial Types
export interface Revenue {
    id: string;
    totalAmount: number;
    cashAmount: number;
    networkAmount: number;
    date: Date;
    description?: string;
    employeeContributions: { name: string; amount: number }[];
    mismatchReason?: string;
    branch: 'laban' | 'tuwaiq';
}

export interface Expense {
    id: string;
    category: string;
    amount: number;
    date: Date;
    description: string;
    branch: 'laban' | 'tuwaiq';
}

// Product Request Types
export interface ProductRequestItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ProductRequest {
  id: string;
  branch: 'laban' | 'tuwaiq';
  requestDate: Date;
  items: ProductRequestItem[];
  grandTotal: number;
  userId: string;
  employeeName: string;
}

// Bonus Rule Type
export interface BonusRule {
  id: string;
  weeklyIncomeThreshold: number;
  bonusAmount: number;
  branch: 'laban' | 'tuwaiq';
}
