/**
 * 数据分析 API 服务
 */
import { api } from './api';

export interface SalesOverview {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  avgOrderValue: number;
  today: {
    sales: number;
    orders: number;
    salesGrowth: number;
    orderGrowth: number;
  };
  yesterday: {
    sales: number;
    orders: number;
  };
}

export interface ProductRankingItem {
  _id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  salesCount: number;
  favoriteCount: number;
  category: string;
  rating: number;
  conversionRate: number;
}

export interface OrderTrendItem {
  date: string;
  weekday: string;
  sales: number;
  orders: number;
  avgValue: number;
}

export interface CategoryStat {
  _id: string;
  name: string;
  icon: string;
  productCount: number;
  totalSales: number;
  totalStock: number;
  avgPrice: number;
  salesPercentage: number;
}

export interface UserBehavior {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userLevels: { new: number; light: number; medium: number; heavy: number };
    avgOrdersPerUser: number;
  };
  hotKeywords: { keyword: string; count: number; trend: string }[];
  funnel: {
    visitors: number;
    productViews: number;
    addToCart: number;
    checkout: number;
    purchase: number;
    conversionRate: number;
  };
  topProducts: { name: string; sales: number; views: number }[];
}

export const analyticsApi = {
  getSalesOverview: () => {
    return api.get<any, SalesOverview>('/analytics/sales-overview');
  },

  getProductRanking: (limit = 10, sortBy = 'salesCount') => {
    return api.get<any, { products: ProductRankingItem[]; total: number }>(
      '/analytics/product-ranking', { params: { limit, sortBy } }
    );
  },

  getOrderTrend: () => {
    return api.get<any, { trend: OrderTrendItem[]; statusDistribution: any; totalOrders: number; totalSales: number }>(
      '/analytics/order-trend'
    );
  },

  getCategoryStats: () => {
    return api.get<any, { categories: CategoryStat[]; grandTotal: number; totalProducts: number; totalCategories: number }>(
      '/analytics/category-stats'
    );
  },

  getUserBehavior: () => {
    return api.get<any, UserBehavior>('/analytics/user-behavior');
  }
};