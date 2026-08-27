/**
 * 认证状态管理
 *
 * 使用 Zustand 管理全局认证状态
 *
 * 状态包含：
 * - 用户信息
 * - Token
 * - 登录状态
 * - 地址管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, UserInfo } from '@/services/auth.api';
import { userApi, Address, CreateAddressParams } from '@/services/user.api';
import toast from 'react-hot-toast';

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (account: string, password: string, remember?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  setUser: (user: UserInfo) => void;
  updateUser: (data: Partial<UserInfo>) => void;

  // Address actions
  addAddress: (data: CreateAddressParams) => Promise<void>;
  updateAddress: (id: string, data: Partial<CreateAddressParams>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      isAuthenticated: !!localStorage.getItem('accessToken'),
      isLoading: false,

      /**
       * 用户登录
       */
      login: async (account, password, remember = false) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login({ account, password, remember });

          // 保存 Token
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);

          set({
            user: data.user,
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });

          toast.success('登录成功');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      /**
       * 用户注册
       */
      register: async (username, email, password, confirmPassword) => {
        set({ isLoading: true });
        try {
          const data = await authApi.register({ username, email, password, confirmPassword });

          // 保存 Token
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);

          set({
            user: data.user,
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });

          toast.success('注册成功，欢迎加入宝宝商城！');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      /**
       * 用户登出
       */
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      /**
       * 设置用户信息
       */
      setUser: (user) => {
        set({ user });
      },

      /**
       * 更新用户信息
       */
      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      },

      /**
       * 添加地址
       */
      addAddress: async (data) => {
        try {
          const newAddress = await userApi.createAddress(data);
          set((state) => {
            const user = state.user;
            if (!user) return state;

            let addresses = user.addresses || [];

            if (data.isDefault) {
              addresses = addresses.map(a => ({ ...a, isDefault: false }));
            }

            addresses = [newAddress, ...addresses];

            return {
              user: { ...user, addresses }
            };
          });
          toast.success('地址添加成功');
        } catch (error: any) {
          throw error;
        }
      },

      /**
       * 更新地址
       */
      updateAddress: async (id, data) => {
        try {
          const updatedAddress = await userApi.updateAddress(id, data);
          set((state) => {
            const user = state.user;
            if (!user) return state;

            let addresses = user.addresses || [];

            if (data.isDefault) {
              addresses = addresses.map(a => ({ ...a, isDefault: false }));
            }

            addresses = addresses.map(a =>
              a._id === id ? updatedAddress : a
            );

            return {
              user: { ...user, addresses }
            };
          });
          toast.success('地址更新成功');
        } catch (error: any) {
          throw error;
        }
      },

      /**
       * 删除地址
       */
      deleteAddress: async (id) => {
        try {
          await userApi.deleteAddress(id);
          set((state) => {
            const user = state.user;
            if (!user) return state;

            const addresses = (user.addresses || []).filter(a => a._id !== id);

            return {
              user: { ...user, addresses }
            };
          });
          toast.success('地址删除成功');
        } catch (error: any) {
          throw error;
        }
      },

      /**
       * 设置默认地址
       */
      setDefaultAddress: async (id) => {
        try {
          const updatedAddress = await userApi.setDefaultAddress(id);
          set((state) => {
            const user = state.user;
            if (!user) return state;

            const addresses = (user.addresses || []).map(a => ({
              ...a,
              isDefault: a._id === id
            }));

            return {
              user: { ...user, addresses }
            };
          });
          toast.success('已设为默认地址');
        } catch (error: any) {
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
