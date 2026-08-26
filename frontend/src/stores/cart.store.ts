/**
 * 购物车状态管理
 */
import { create } from 'zustand';
import { cartApi, Cart, CartItem } from '@/services/cart.api';
import toast from 'react-hot-toast';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  totalCount: number;
  selectedTotal: number;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, skuCode: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, data: { quantity?: number; selected?: boolean }) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearSelected: () => Promise<void>;
  selectAll: (selected: boolean) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  totalCount: 0,
  selectedTotal: 0,

  /**
   * 获取购物车
   */
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const data = await cartApi.getCart();
      set({
        cart: data,
        totalCount: data.totalCount,
        selectedTotal: data.selectedTotal,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  /**
   * 添加商品到购物车
   */
  addItem: async (productId, skuCode, quantity = 1) => {
    try {
      await cartApi.addToCart(productId, skuCode, quantity);
      toast.success('已添加到购物车');
      // 刷新购物车
      await get().fetchCart();
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * 更新购物车项
   */
  updateItem: async (itemId, data) => {
    try {
      const result = await cartApi.updateCartItem(itemId, data);
      set({
        totalCount: result.totalCount,
        selectedTotal: result.selectedTotal
      });
      // 刷新购物车数据
      await get().fetchCart();
    } catch (error) {
      console.error('更新购物车失败:', error);
    }
  },

  /**
   * 删除购物车项
   */
  removeItem: async (itemId) => {
    try {
      const result = await cartApi.removeFromCart(itemId);
      set({ totalCount: result.totalCount });
      toast.success('删除成功');
      await get().fetchCart();
    } catch (error) {
      console.error('删除失败:', error);
    }
  },

  /**
   * 清空已选中的商品
   */
  clearSelected: async () => {
    const { cart } = get();
    if (!cart) return;

    const selectedIds = cart.items
      .filter(item => item.selected)
      .map(item => item._id);

    for (const id of selectedIds) {
      await cartApi.removeFromCart(id);
    }
    await get().fetchCart();
  },

  /**
   * 全选/取消全选
   */
  selectAll: async (selected) => {
    try {
      await cartApi.bulkSelect(selected);
      await get().fetchCart();
    } catch (error) {
      console.error('全选操作失败:', error);
    }
  }
}));
