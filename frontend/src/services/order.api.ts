/**
 * 订单 API 服务
 */
import { api } from './api';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  subtotal: number;
  skuCode: string;
  specInfo: { name: string; value: string }[];
}

export interface Order {
  _id: string;
  orderNo: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  freightAmount: number;
  payableAmount: number;
  shippingAddress: {
    receiver: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  };
  status: string;
  remark?: string;
  timeline: { status: string; description: string; timestamp: string }[];
  createdAt: string;
}

export interface CreateOrderParams {
  items: { productId: string; skuCode: string; quantity: number }[];
  addressId: string;
  paymentMethod?: string;
  remark?: string;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const orderApi = {
  /**
   * 创建订单
   */
  createOrder: (data: CreateOrderParams) => {
    return api.post<any, { orderNo: string; orderId: string; status: string; payableAmount: number }>('/orders', data);
  },

  /**
   * 获取订单列表
   */
  getOrders: (params?: OrderListParams) => {
    return api.get<any, { list: Order[]; pagination: any }>('/orders', params);
  },

  /**
   * 获取订单详情
   */
  getOrderDetail: (id: string) => {
    return api.get<any, Order>(`/orders/${id}`);
  },

  /**
   * 取消订单
   */
  cancelOrder: (id: string, reason?: string) => {
    return api.put<any, { status: string }>(`/orders/${id}/cancel`, { reason });
  },

  /**
   * 支付订单
   */
  payOrder: (id: string) => {
    return api.post<any, { orderNo: string; status: string; paidAt: string }>(`/orders/${id}/pay`);
  },

  /**
   * 确认收货
   */
  confirmReceive: (id: string) => {
    return api.put<any, { status: string }>(`/orders/${id}/receive`);
  },

  /**
   * 获取订单统计
   */
  getOrderStats: () => {
    return api.get<any, { orderCount: number; totalSpent: number; byStatus: any }>('/orders/stats');
  }
};
