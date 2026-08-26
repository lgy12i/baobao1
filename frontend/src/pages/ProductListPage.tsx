/**
 * 商品列表页 · 霓虹潮流版
 *
 * 修复：
 *  - 所有卡片使用 ProductImage 多层 fallback，不再有裂图
 *  - 点击跳转路由从 /product 改成 /products（匹配 App.tsx）
 *  - 筛选/排序/搜索 全部替换为霓虹主题样式
 *  - 价格筛选抽屉：showFilter 展开
 */
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { productApi, Category, Product } from '@/services/product.api';
import { useCartStore } from '@/stores/cart.store';
import toast from 'react-hot-toast';
import ProductImage from '@/components/ProductImage';
import {
  SlidersHorizontal, Grid3X3, List, ChevronLeft, ChevronRight,
  X, ShoppingCart, Star
} from 'lucide-react';

type SortKey = 'sales' | 'price_asc' | 'price_desc' | 'new';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'sales',     label: '销量优先' },
  { value: 'new',       label: '新品上架' },
  { value: 'price_asc', label: '价格 ↑' },
  { value: 'price_desc',label: '价格 ↓' }
];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const [sort, setSort] = useState<SortKey>((searchParams.get('sort') as SortKey) || 'sales');
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 顶部搜索框内输入值
  const [inputKeyword, setInputKeyword] = useState(keyword);

  const { data: categories } = useQuery<Category[]>(
    ['categories'], () => productApi.getCategories()
  );

  const { data: currentData, isLoading } = useQuery<{ list: Product[]; pagination: any }>(
    ['products', { keyword, categoryId, sort, page,
      min: priceRange.min, max: priceRange.max }],
    () => productApi.getProducts({
      keyword,
      categoryId,
      sort,
      page,
      limit: 20,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined
    }),
    { keepPreviousData: true }   // 翻页时保留上一页数据，不闪空白，不卡
  );

  const list = currentData?.list || [];
  const pagination = currentData?.pagination;

  const goSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (inputKeyword) params.set('keyword', inputKeyword);
    else params.delete('keyword');
    params.delete('page');
    setSearchParams(params);
    setPage(1);
  };

  const applySort = (v: SortKey) => {
    setSort(v);
    setPage(1);
    const p = new URLSearchParams(searchParams);
    p.set('sort', v);
    p.delete('page');
    setSearchParams(p);
  };

  const filterCat = (catId: string) => {
    const p = new URLSearchParams(searchParams);
    if (catId) p.set('categoryId', catId);
    else p.delete('categoryId');
    p.delete('page');
    setSearchParams(p);
    setPage(1);
  };

  const addCart = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    (addItem as any)(p);
    toast.success('已加入购物车 🛒');
  };

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goSearch()}
            placeholder={keyword ? `已搜索：${keyword}` : '搜索商品 / 品牌 / 关键词'}
            className="input-neon flex-1"
          />
          <button onClick={goSearch} className="btn-neon shrink-0">搜索</button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`shrink-0 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
              showFilter ? 'glass border-neon-500/40 text-neon-300' : 'btn-outline'
            }`}
          >
            <SlidersHorizontal size={16} />
            筛选
          </button>
        </div>

        {/* 价格筛选抽屉 */}
        {showFilter && (
          <div className="mt-4 p-4 glass rounded-xl border border-neon-500/20 flex flex-wrap items-center gap-4">
            <span className="text-sm text-white/70">价格区间：</span>
            <input
              type="number"
              placeholder="最低 ¥"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              className="w-32 input-neon py-2 text-sm"
            />
            <span className="text-white/40">—</span>
            <input
              type="number"
              placeholder="最高 ¥"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              className="w-32 input-neon py-2 text-sm"
            />
            <button
              onClick={() => { setPage(1); setShowFilter(false); }}
              className="btn-outline py-2"
            >
              应用筛选
            </button>
            <button
              onClick={() => setPriceRange({ min: '', max: '' })}
              className="text-xs text-white/40 hover:text-neon-300 ml-auto"
            >
              清空
            </button>
          </div>
        )}
      </div>

      {/* 分类 chips */}
      {categories && categories.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => filterCat('')}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                !categoryId
                  ? 'bg-neon-gradient text-white shadow-neon-soft'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              全部
            </button>
            {categories.map((cat: Category) => (
              <button
                key={cat._id}
                onClick={() => filterCat(cat._id)}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  categoryId === cat._id
                    ? 'bg-neon-gradient text-white shadow-neon-soft'
                    : 'glass text-white/70 hover:text-white'
                }`}
              >
                <span className="mr-1">{cat.icon || '✨'}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 排序 + 结果数 + 视图切换 */}
      <div className="glass-card p-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/40 mr-2">排序：</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applySort(opt.value)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                sort === opt.value
                  ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">
            {isLoading ? '加载中...' : `共 ${pagination?.total ?? 0} 件商品`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'glass text-neon-300' : 'text-white/40 hover:text-white'}`}
              title="网格视图"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'glass text-neon-300' : 'text-white/40 hover:text-white'}`}
              title="列表视图"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 商品网格 */}
      {isLoading && !currentData ? (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'space-y-3'} gap-4`}>
          {Array.from({ length: 10 }).map((_, i) => (
            viewMode === 'grid' ? (
              <div key={i} className="glass-card overflow-hidden">
                <div className="aspect-square shimmer-bg" />
                <div className="p-3 space-y-2">
                  <div className="h-4 shimmer-bg rounded" />
                  <div className="h-4 shimmer-bg rounded w-2/3" />
                  <div className="h-5 shimmer-bg rounded w-1/3" />
                </div>
              </div>
            ) : (
              <div key={i} className="glass-card p-3 flex gap-3">
                <div className="w-28 h-28 shimmer-bg rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 shimmer-bg rounded w-3/4" />
                  <div className="h-4 shimmer-bg rounded w-1/2" />
                  <div className="h-10 shimmer-bg rounded" />
                </div>
              </div>
            )
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-white/60 mb-3">没找到匹配的商品</p>
          <div className="text-sm text-white/40 mb-4">
            {keyword && <>关键词「{keyword}」</>}
            {categoryId && <> · 分类筛选已启用</>}
          </div>
          <button
            onClick={() => {
              setInputKeyword('');
              setPriceRange({ min: '', max: '' });
              filterCat('');
            }}
            className="btn-neon"
          >
            清除所有筛选
          </button>
          {showFilter && (
            <X size={18} className="hidden" />
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {list.map((p: Product) => (
            <div
              key={p._id}
              onClick={() => { navigate(`/products/${p._id}`); window.scrollTo({ top: 0 }); }}
              className="glass-card overflow-hidden cursor-pointer group flex flex-col"
            >
              <ProductImage
                images={p.images}
                alt={p.name}
                className="group-hover:shadow-neon transition duration-500"
                imgClassName="group-hover:scale-110 transition duration-500"
              />
              <div className="p-3 flex-1 flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-1 min-h-[20px]">
                  {(p.tags || []).slice(0, 2).map((t) => (
                    <span key={t} className={
                      t === '新品' ? 'badge-new' :
                      t === '热销' ? 'badge-hot' :
                      t === '包邮' ? 'badge-ship' : 'badge-sale'
                    }>{t}</span>
                  ))}
                </div>
                <h3 className="text-sm text-white/80 line-clamp-2">{p.name}</h3>
                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-primary-400 font-bold">¥{p.price.toFixed(0)}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[10px] text-white/30 line-through">¥{p.originalPrice.toFixed(0)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5">
                      <span>🔥 已售 {p.salesCount}</span>
                      <span className="flex items-center gap-0.5">
                        <Star size={10} fill="#faad14" stroke="#faad14" className="text-amber-400" />
                        4.8
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => addCart(e, p)}
                    className="p-1.5 rounded-lg bg-neon-gradient text-white hover:shadow-neon transition shrink-0"
                    title="加入购物车"
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 列表视图
        <div className="space-y-3">
          {list.map((p: Product) => (
            <div
              key={p._id}
              onClick={() => { navigate(`/products/${p._id}`); window.scrollTo({ top: 0 }); }}
              className="glass-card p-3 flex gap-4 cursor-pointer group"
            >
              <ProductImage
                images={p.images}
                alt={p.name}
                className="w-28 h-28 shrink-0 rounded-xl overflow-hidden"
              />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <h3 className="text-sm md:text-base text-white/80 line-clamp-2 group-hover:text-neon-300 transition">{p.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(p.tags || []).slice(0, 3).map((t) => (
                    <span key={t} className={
                      t === '新品' ? 'badge-new' :
                      t === '热销' ? 'badge-hot' :
                      t === '包邮' ? 'badge-ship' : 'badge-sale'
                    }>{t}</span>
                  ))}
                  <span className="badge-ship hidden md:inline-flex">分类：{(p.categoryId as any)?.name}</span>
                </div>
                <p className="text-xs text-white/40 line-clamp-2">
                  {p.description || '宝宝商城精选好物，正品保证，极速物流，7天无理由退换。'}
                </p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-1">
                  <div>
                    <div className="text-2xl font-extrabold text-neon-gradient bg-clip-text text-transparent">
                      ¥{p.price.toFixed(0)}
                    </div>
                    <div className="text-[10px] text-white/40 flex items-center gap-2">
                      <span>🔥 已售 {p.salesCount}</span>
                      <span>🌟 好评 98%</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => addCart(e, p)}
                    className="btn-neon py-2 text-sm"
                  >
                    <ShoppingCart size={14} className="inline mr-1" /> 加入购物车
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4 flex-wrap">
          <button
            className="p-2 glass rounded-xl disabled:opacity-30 hover:border-neon-500/40 transition"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
            // 以当前页为中心的窗口
            const start = Math.max(1, Math.min(pagination.totalPages - 4, page - 2));
            const pageNum = start + i;
            if (pageNum > pagination.totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`min-w-[36px] h-9 px-2 rounded-xl text-sm transition ${
                  pageNum === page
                    ? 'bg-neon-gradient text-white shadow-neon-soft'
                    : 'glass text-white/70 hover:text-white hover:border-neon-500/30'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <span className="text-white/40 text-sm">共 {pagination.totalPages} 页</span>
          <button
            className="p-2 glass rounded-xl disabled:opacity-30 hover:border-neon-500/40 transition"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
