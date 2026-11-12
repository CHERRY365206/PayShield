import api from '../utils/api';
import { ApiResponse, CreateOrderResponse, Transaction, PagedResponse } from '../types';

export const paymentService = {
  async createOrder(
    amount: number,
    description?: string,
    simulatedLocation?: string,
    idempotencyKey?: string
  ): Promise<CreateOrderResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await api.post<ApiResponse<CreateOrderResponse>>(
      '/payments/orders',
      { amount, description, simulatedLocation },
      { headers }
    );
    return res.data.data;
  },

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<Transaction> {
    const res = await api.post<ApiResponse<Transaction>>('/payments/verify', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return res.data.data;
  },

  async getTransactions(page = 0, size = 10): Promise<PagedResponse<Transaction>> {
    const res = await api.get<ApiResponse<PagedResponse<Transaction>>>(
      `/payments?page=${page}&size=${size}&sort=createdAt,desc`
    );
    return res.data.data;
  },

  async getTransaction(id: string): Promise<Transaction> {
    const res = await api.get<ApiResponse<Transaction>>(`/payments/${id}`);
    return res.data.data;
  },

  async refund(id: string, amount: number, reason?: string): Promise<any> {
    const res = await api.post<ApiResponse<any>>(`/payments/${id}/refund`, {
      amount,
      reason,
    });
    return res.data.data;
  },
};
