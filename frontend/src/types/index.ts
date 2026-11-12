export interface User {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  fullName: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  amountInRupees: number;
  currency: string;
  description?: string;
  paymentMethod?: string;
  status: TransactionStatus;
  riskScore?: number;
  riskDecision?: string;
  riskExplanation?: string;
  simulatedLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus =
  | 'CREATED' | 'RISK_EVALUATION' | 'ORDER_CREATED' | 'CHECKOUT'
  | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'VERIFIED' | 'CAPTURED'
  | 'REJECTED' | 'PENDING_REVIEW' | 'REFUNDED';

export interface RiskResult {
  riskScore: number;
  decision: 'APPROVED' | 'REVIEW_REQUIRED' | 'DECLINED';
  amountScore: number;
  velocityScore: number;
  failureScore: number;
  geographicScore: number;
  reasons: string[];
}

export interface CreateOrderResponse {
  transactionId: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  razorpayKeyId?: string;
  status: string;
  riskDecision: string;
  riskScore: number;
  riskExplanation?: string;
}

export interface DashboardStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  flaggedTransactions: number;
  declinedTransactions: number;
  totalVolumeInPaise: number;
  successRate: number;
  riskDistribution: {
    approved: number;
    reviewRequired: number;
    declined: number;
  };
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
