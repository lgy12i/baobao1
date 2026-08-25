/**
 * API 请求封装
 *
 * 职责：统一封装 axios 请求，处理认证、错误、拦截器等
 *
 * 特性：
 * - 自动携带 Token
 * - 401 自动跳转登录
 * - 请求/响应日志（开发模式）
 * - 统一错误处理
 */

import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 请求拦截器
 * - 自动添加 Authorization 头
 * - 添加请求时间戳用于调试
 */
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 Token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 开发模式添加请求标识
    if (import.meta.env.DEV) {
      config.metadata = { startTime: Date.now() };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * - 统一处理业务错误码
 * - 401 自动跳转登录
 * - 开发模式输出请求耗时
 */
apiClient.interceptors.response.use(
  (response) => {
    // 开发模式日志
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    
    const { data } = response;
    
    // 业务成功（code 200 或 201），解包返回 data 字段
    if (data.code === 200 || data.code === 201) {
      return data.data !== undefined ? data.data : data;
    }
    
    // 业务错误
    return Promise.reject({
      code: data.code,
      message: data.message,
      data: data.data
    });
  },
  (error) => {
    // 处理 HTTP 错误
    if (error.response) {
      const { status, data } = error.response;
      
      // 401 未授权
      if (status === 401) {
        // 清除本地存储的认证信息
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // 清除 Zustand 状态
        const { logout } = useAuthStore.getState();
        logout();
        
        // 提示用户
        toast.error('登录已过期，请重新登录');
        
        // 如果不是在登录页，则跳转到登录页
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // 403 禁止访问
      if (status === 403) {
        toast.error('权限不足');
      }
      
      // 423 账户锁定
      if (status === 423) {
        toast.error(data?.message || '账户已锁定');
      }
      
      // 其他错误显示提示
      if (status !== 401 && status !== 403) {
        toast.error(data?.message || '请求失败');
      }
      
      return Promise.reject({
        code: status,
        message: data?.message || '请求失败',
        data: data?.data
      });
    }
    
    // 网络错误
    if (error.code === 'ECONNABORTED') {
      toast.error('请求超时，请稍后重试');
    } else {
      toast.error('网络连接异常，请检查网络');
    }
    
    return Promise.reject(error);
  }
);

/**
 * API 请求方法封装
 */
export const api = {
  get: <T = any>(url: string, params?: any): Promise<T> => {
    return apiClient.get(url, { params }) as unknown as Promise<T>;
  },
  post: <T = any>(url: string, data?: any): Promise<T> => {
    return apiClient.post(url, data) as unknown as Promise<T>;
  },
  put: <T = any>(url: string, data?: any): Promise<T> => {
    return apiClient.put(url, data) as unknown as Promise<T>;
  },
  delete: <T = any>(url: string): Promise<T> => {
    return apiClient.delete(url) as unknown as Promise<T>;
  }
};

export default apiClient;
