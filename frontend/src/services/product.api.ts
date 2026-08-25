/**
 * 商品 API 服务
 */
import { api } from './api';

export interface Product {
  _id: string;
  name: string;
  brand: string;
  description?: string;
  categoryId: { _id: string; name: string };
  price: number;
  originalPrice?: number;
  mainImage: string;
  images: string[];
  skus: Sku[];
  specs: Spec[];
  tags: string[];
  salesCount: number;
  viewCount: number;
  favoriteCount: number;
  stockStatus?: string;
  priceRange?: { min: number; max: number };
}

export interface Sku {
  skuCode: string;
  price: number;
  originalPrice?: number;
  stock: number;
  specCombination: { name: string; value: string }[];
}

export interface Spec {
  name: string;
  values: string[];
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'sales' | 'views' | 'new' | 'priceAsc' | 'priceDesc';
  keyword?: string;
  tag?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  list: Product[];
  pagination: Pagination;
}

export interface Category {
  _id: string;
  name: string;
  parentId: string | null;
  level: number;
  icon?: string;
  productCount?: number;
  children?: Category[];
}

export const productApi = {
  /**
   * 获取商品列表
   */
  getProducts: (params?: ProductListParams) => {
    return api.get<any, ProductListResponse>('/products', params);
  },

  /**
   * 获取商品详情
   */
  getProductById: (id: string) => {
    return api.get<any, Product>(`/products/${id}`);
  },

  /**
   * 获取推荐商品
   */
  getRecommended: (limit = 10) => {
    return api.get<any, { list: Product[] }>('/products/recommended', { limit });
  },

  /**
   * 获取分类列表
   */
  getCategories: (tree = true) => {
    return api.get<any, Category[]>(`/categories`, { tree });
  }
};
