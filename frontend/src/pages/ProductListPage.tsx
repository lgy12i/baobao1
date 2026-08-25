/**
 * 商品列表页
 */
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { productApi, Category, Product } from '@/services/product.api';
import { SlidersHorizontal, Grid3X3, List, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const [sort, setSort] = useState(searchParams.get('sort') || 'sales');
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilter, setShowFilter] = useState(false);

  const { data: categories } = useQuery<Category[]>(
    ['categories'],
    () => productApi.getCategories()
  );

  const { data: currentData, isLoading } = useQuery<{ list: Product[]; pagination: any }>(
    ['products', {
      keyword,
      categoryId,
      sort: sort as any,
      page,
      limit: 20,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined
    }],
    () => productApi.getProducts({
      keyword,
      categoryId,
      sort: sort as any,
      page,
      limit: 20,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined
    })
  );

  // 保留上一次的数据，避免翻页时闪烁
  const data = currentData;
  const list = data?.list || [];
  const pagination = data?.pagination;

  const handleSearch = (newKeyword: string) => {
    const params: Record<string, string> = {};
    if (newKeyword) params.keyword = newKeyword;
    if (categoryId) params.categoryId = categoryId;
    setSearchParams(params);
    setPage(1);
  };

  const handleSort = (newSort: string) => {
    setSort(newSort);
    setPage(1);
    searchParams.set('sort', newSort);
    setSearchParams(searchParams);
  };

  const handleCategoryFilter = (catId: string) => {
    searchParams.set('categoryId', catId);
    setSearchParams(searchParams);
    setPage(1);
  };

  return (
    <div className="animate-fade-in">
      {/* 搜索栏 */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            defaultValue={keyword}
            placeholder="搜索商品"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch((e.target as HTMLInputElement).value);
              }
            }}
          />
          <button className="btn-primary" onClick={() => {
            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
            handleSearch(input?.value || '');
          }}>
            搜索
          </button>
          <button
            className="btn-secondary flex items-center gap-1"
            onClick={() => setShowFilter(!showFilter)}
          >
            <SlidersHorizontal size={16} />
            筛选
          </button>
        </div>
      </div>

      {/* 分类筛选 */}
      {categories && categories.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className={`px-3 py-1 rounded-full text-sm ${!categoryId ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => handleCategoryFilter('')}
            >
              全部
            </button>
            {categories.map((cat: Category) => (
              <button
                key={cat._id}
                className={`px-3 py-1 rounded-full text-sm ${categoryId === cat._id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => handleCategoryFilter(cat._id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 排序 + 视图切换 */}
      <div className="bg-white rounded-lg p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">排序：</span>
          {[
            { value: 'sales', label: '销量' },
            { value: 'price_asc', label: '价格↑' },
            { value: 'price_desc', label: '价格↓' },
            { value: 'new', label: '新品' }
          ].map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-1 text-sm rounded ${sort === opt.value ? 'text-primary-500 font-medium' : 'text-gray-600'}`}
              onClick={() => handleSort(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button className={`p-1 ${sort === 'sales' ? 'text-primary-500' : 'text-gray-400'}`}>
            <Grid3X3 size={20} />
          </button>
          <button className="p-1 text-gray-400">
            <List size={20} />
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      {isLoading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          暂无商品
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {list.map((product: Product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                  }}
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm text-gray-800 line-clamp-2 mb-1">{product.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary-500 font-bold">¥{product.price}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-xs text-gray-400 line-through">¥{product.originalPrice}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  已售 {product.salesCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft />
          </button>
          <span className="px-4 py-2">{page} / {pagination.totalPages}</span>
          <button
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
