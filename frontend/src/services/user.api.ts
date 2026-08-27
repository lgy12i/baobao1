/**
 * 用户 API 服务 - 地址管理等
 */
import { api } from './api';

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

export interface CreateAddressParams {
  receiver: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault?: boolean;
}

export const userApi = {
  getAddresses: () => {
    return api.get<any, Address[]>('/user/addresses');
  },

  createAddress: (data: CreateAddressParams) => {
    return api.post<any, Address>('/user/addresses', data);
  },

  updateAddress: (id: string, data: Partial<CreateAddressParams>) => {
    return api.put<any, Address>(`/user/addresses/${id}`, data);
  },

  deleteAddress: (id: string) => {
    return api.delete<any, null>(`/user/addresses/${id}`);
  },

  setDefaultAddress: (id: string) => {
    return api.put<any, Address>(`/user/addresses/${id}`, { isDefault: true });
  }
};
