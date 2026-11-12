import api from '../utils/api';
import { ApiResponse, AuthResponse } from '../types';

export const authService = {
  async register(username: string, email: string, password: string, fullName: string): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      username,
      email,
      password,
      fullName,
    });
    return res.data.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  },
};

