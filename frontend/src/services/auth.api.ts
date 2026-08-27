/**
 * 认证 API 服务
 */
import { api } from './api';

export interface LoginParams {
  account: string;
  password: string;
  remember?: boolean;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface Address {
  _id: string;
  receiver: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

export interface UserInfo {
  id: string;
  username: string;
  nickname?: string;
  email: string;
  phone?: string;
  avatar: string;
  role: string;
  addresses?: Address[];
}

export interface AuthResponse {
  user: UserInfo;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export const authApi = {
  /**
   * 用户登录
   */
  login: (data: LoginParams) => {
    return api.post<any, AuthResponse>('/auth/login', data);
  },

  /**
   * 用户注册
   */
  register: (data: RegisterParams) => {
    return api.post<any, AuthResponse>('/auth/register', data);
  },

  /**
   * 用户登出
   */
  logout: () => {
    return api.post('/auth/logout');
  },

  /**
   * 刷新 Token
   */
  refreshToken: (refreshToken: string) => {
    return api.post<any, { accessToken: string; expiresIn: number }>(
      '/auth/refresh',
      { refreshToken }
    );
  },

  /**
   * 验证 Token
   */
  verifyToken: () => {
    return api.get<any, { valid: boolean; user: UserInfo }>('/auth/verify');
  }
};
