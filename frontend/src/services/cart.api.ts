/**
 * 购物车 API 服务
 */
import { api } from './api';

export interface CartItem {
  _id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  skuCode: string;
  quantity: number;
  selected: boolean;
  specInfo: { name: string; value: string }[];
  stockStatus?: string;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  totalCount: number;
  selectedCount: number;
  selectedTotal: number;
}

export const cartApi = {
  /**
   * 获取购物车
   */
  getCart: () => {
    return api.get<any, Cart>('/cart');
  },

  /**
   * 添加商品到购物车
   */
  addToCart: (productId: string, skuCode: string, quantity = 1) => {
    return api.post<any, { totalCount: number }>('/cart', {
      productId,
      skuCode,
      quantity
    });
  },

  /**
   * 更新购物车项
   */
  updateCartItem: (itemId: string, data: { quantity?: number; selected?: boolean }) => {
    return api.put<any, { totalCount: number; selectedTotal: number }>(`/cart/${itemId}`, data);
  },

  /**
   * 删除购物车项
   */
  removeFromCart: (itemId: string) => {
    return api.delete<any, { totalCount: number }>(`/cart/${itemId}`);
  },

  /**
   * 批量设置选中状态
   */
  bulkSelect: (selected: boolean, itemIds?: string[]) => {
    return api.post<any, { selectedCount: number; selectedTotal: number }>('/cart/select', {
      selected,
      itemIds
    });
  },

  /**
   * 清空购物车
   */
  clearCart: () => {
    return api.delete('/cart/clear');
  }
};
