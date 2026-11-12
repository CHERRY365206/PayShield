import api from '../utils/api';
import { ApiResponse, DashboardStats, Transaction, PagedResponse } from '../types';

export const adminService = {
  async getDashboard(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return res.data.data;
  },

  async getAllTransactions(page = 0, size = 15): Promise<PagedResponse<Transaction>> {
    const res = await api.get<ApiResponse<PagedResponse<Transaction>>>(
      `/admin/transactions?page=${page}&size=${size}&sort=createdAt,desc`
    );
    return res.data.data;
  },

  async getFlaggedTransactions(page = 0, size = 15): Promise<PagedResponse<Transaction>> {
    const res = await api.get<ApiResponse<PagedResponse<Transaction>>>(
      `/admin/flagged-transactions?page=${page}&size=${size}`
    );
    return res.data.data;
  },

  async getAuditLogs(page = 0, size = 20): Promise<PagedResponse<any>> {
    const res = await api.get<ApiResponse<PagedResponse<any>>>(
      `/admin/audit-logs?page=${page}&size=${size}&sort=createdAt,desc`
    );
    return res.data.data;
  },
};
