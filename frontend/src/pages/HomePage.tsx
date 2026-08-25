/**
 * 首页组件
 *
 * 参考淘宝首页布局：
 * 1. 左侧分类导航
 * 2. 中间轮播图 + 推荐商品
 * 3. 右侧快捷入口
 * 4. 猜你喜欢商品列表
 */
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { productApi, Category, Product } from '@/services/product.api';
import { useCartStore } from '@/stores/cart.store';
import {
  ChevronRight,
  Flame,
  Zap,
  Gift,
  Ticket,
  Building2,
  Sparkles,
  ArrowRight,
  ShoppingCart,
  Heart
} from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 获取分类树
  const { data: categories } = useQuery<Category[]>(
    'categories',
    () => productApi.getCategories(true)
  );

  // 获取推荐商品
  const { data: recommendedData } = useQuery<{ list: Product[] }>(
    'recommended',
    () => productApi.getRecommended(10)
  );

  // 轮播图数据
  const banners = [
    {
      id: 1,
      title: '开学季至高立减千元',
      subtitle: '券后低至7.7折起',
      bgColor: 'from-blue-400 to-blue-600',
      cta: '去逛逛'
    },
    {
      id: 2,
      title: '百亿补贴来啦',
      subtitle: '好货低价别错过',
      bgColor: 'from-red-400 to-red-600',
      cta: '立即抢购'
    },
    {
      id: 3,
      title: '夏日焕新季',
      subtitle: '新品首发5折起',
      bgColor: 'from-orange-400 to-pink-500',
      cta: '查看新品'
    }
  ];

  // 右侧快捷入口
  const quickEntries = [
    { icon: Building2, title: '品质家居', subtitle: '超值优惠', color: 'bg-amber-100 text-amber-600' },
    { icon: Sparkles, title: '精致美妆', subtitle: '品质之选', color: 'bg-pink-100 text-pink-600' },
    { icon: Zap, title: '品质五金', subtitle: '超值特惠', color: 'bg-blue-100 text-blue-600' },
    { icon: Gift, title: '超值百货', subtitle: '省钱省心', color: 'bg-green-100 text-green-600' }
  ];

  return (
    <div className="animate-fade-in">
      {/* 顶部横幅条 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 px-4 mb-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-white text-primary-500 px-2 py-0.5 rounded text-xs font-bold">淘</span>
          <span className="font-medium">首页专属福利限时领，好货低价别错过</span>
        </div>
        <button className="bg-white text-primary-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
          去逛逛
        </button>
      </div>

      {/* 快捷入口导航 */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {[
            { icon: '🏛️', label: '国家补贴' },
            { icon: '⚡', label: '淘宝秒杀' },
            { icon: '🎁', label: 'U先试用' },
            { icon: '🏷️', label: '百亿补贴' },
            { icon: '🎫', label: '领券中心' },
            { icon: '💰', label: '百亿补贴' },
            { icon: '🎉', label: '聚划算' }
          ].map((item, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors min-w-[70px]"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-xs text-gray-600 whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="flex gap-4">
        {/* 左侧分类导航 */}
        <aside className="hidden lg:block w-48 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-primary-500 text-white px-4 py-3 font-medium">
            全部分类
          </div>
          <nav className="py-2">
            {categories?.map((cat) => (
              <div key={cat._id}>
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-primary-50 hover:text-primary-500 transition-colors"
                  onMouseEnter={() => setActiveCategory(cat._id)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onClick={() => navigate(`/products?categoryId=${cat._id}`)}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                {/* 二级分类悬浮显示 */}
                {activeCategory === cat._id && cat.children && cat.children.length > 0 && (
                  <div className="absolute left-48 top-0 z-50 bg-white shadow-lg rounded-lg p-4 min-w-[200px]">
                    {cat.children.map((sub) => (
                      <button
                        key={sub._id}
                        className="block w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        onClick={() => navigate(`/products?categoryId=${sub._id}`)}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* 中间轮播图和推荐 */}
        <main className="flex-1 min-w-0">
          {/* 轮播图 */}
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-4 group cursor-pointer">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 bg-gradient-to-r ${banner.bgColor} transition-opacity duration-500 ${
                  index === 0 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="h-full flex items-center justify-between px-8">
                  <div className="text-white max-w-md">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">{banner.title}</h2>
                    <p className="text-lg opacity-90 mb-6">{banner.subtitle}</p>
                    <button className="bg-white text-gray-800 px-6 py-2.5 rounded-full font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
                      {banner.cta}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                  <div className="hidden md:block text-8xl opacity-50">
                    {['🎨', '🔥', '✨'][index]}
                  </div>
                </div>
              </div>
            ))}

            {/* 轮播指示器 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === 0 ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 今日推荐 */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="text-primary-500" size={24} />
                <h3 className="text-xl font-bold text-gray-800">今日热卖</h3>
              </div>
              <button
                onClick={() => navigate('/products?sort=sales')}
                className="text-sm text-gray-500 hover:text-primary-500 flex items-center gap-1"
              >
                查看更多 <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {recommendedData?.list?.slice(0, 5).map((product) => (
                <ProductCard key={product._id} product={product} compact />
              ))}
            </div>
          </div>
        </main>

        {/* 右侧快捷入口 */}
        <aside className="hidden xl:block w-48 space-y-3">
          {quickEntries.map((entry, index) => (
            <button
              key={index}
              className={`w-full p-4 rounded-lg ${entry.color} hover:shadow-md transition-shadow text-left`}
            >
              <entry.icon size={24} className="mb-2" />
              <div className="font-medium text-gray-800">{entry.title}</div>
              <div className="text-xs text-gray-600">{entry.subtitle}</div>
            </button>
          ))}
        </aside>
      </div>

      {/* 猜你喜欢 */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-primary-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">
              <Heart className="inline text-primary-500 mr-2" size={24} />
              猜你喜欢
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:border-primary-500 hover:text-primary-500 transition-colors">
              换一批
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recommendedData?.list?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * 商品卡片组件
 */
function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const navigate = useNavigate();

  return (
    <div
      className="card cursor-pointer group animate-scale-in"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      <div className={`relative ${compact ? 'h-32' : 'h-40'} overflow-hidden bg-gray-100`}>
        <img
          src={product.mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f3f4f6" width="400" height="400"/><text x="200" y="200" font-family="sans-serif" font-size="24" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">商品图片</text></svg>`
            );
          }}
        />
        {product.tags?.[0] && (
          <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
            {product.tags[0]}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm text-gray-800 line-clamp-2 group-hover:text-primary-500 transition-colors">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-primary-500 font-bold">¥{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">¥{product.originalPrice}</span>
          )}
        </div>
        {!compact && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>已售 {product.salesCount > 9999 ? (product.salesCount / 10000).toFixed(1) + '万' : product.salesCount}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                useCartStore.getState().addItem(product._id, product.skus[0].skuCode);
              }}
              className="p-1.5 text-primary-500 hover:bg-primary-50 rounded-full transition-colors"
              title="加入购物车"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
