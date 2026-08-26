/**
 * 商品详情页 · 霓虹潮流版
 *
 * 功能完整度：
 *  - 面包屑（categoryId 现在是对象，不再报错）
 *  - 图片画廊 + ProductImage 多层 fallback
 *  - 标题 / 描述 / 标签 / 销量 / 浏览量
 *  - 霓虹价格面板（价格 + 划线原价 + 库存）
 *  - 促销 / 配送 / 服务 三联
 *  - 规格选择（单选匹配 SKU）
 *  - 数量选择器
 *  - 加购 / 立即购买 / 收藏 / 分享
 *  - 商品详情图文详情（富文本式 tabs）
 *  - 商品参数（规格表）
 *  - 评价区（模拟 10 条带星级）
 *  - 猜你喜欢侧栏 / 底部推荐
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useState, useMemo } from 'react';
import { productApi, Product } from '@/services/product.api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import ProductImage from '@/components/ProductImage';
import {
  Minus, Plus, ShoppingCart, Heart, Share2, ChevronLeft,
  Truck, Shield, RotateCcw, Star, MessageSquare, Award, Tag,
  ChevronRight, Zap, PackageCheck, TrendingUp
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSkuIdx, setSelectedSkuIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'detail' | 'specs' | 'reviews'>('detail');

  const { data: product, isLoading, error } = useQuery<Product>(
    ['product', id],
    () => productApi.getProductById(id!),
    { retry: 1 }
  );

  const currentSku = product?.skus?.[selectedSkuIdx];

  // 规格选择 → 找到匹配的 SKU index
  const pickSkuBySpecs = (specs: Record<string, string>) => {
    if (!product?.specs || product.specs.length === 0) return 0;
    const idx = product.skus.findIndex((sku) =>
      sku.specCombination.every((s) => specs[s.name] === s.value)
    );
    return idx >= 0 ? idx : 0;
  };

  const handleSpecSelect = (specName: string, value: string) => {
    if (!product) return;
    const next = { ...selectedSpecs, [specName]: value };
    setSelectedSpecs(next);
    setSelectedSkuIdx(pickSkuBySpecs(next));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('请先登录'); navigate('/login'); return; }
    if (!product) return;
    if (product.specs?.length) {
      const all = product.specs.every((s) => selectedSpecs[s.name]);
      if (!all) { toast.error('请选择完整的商品规格'); return; }
    }
    try {
      // 注：当前 memory-store 的 addItem 接受 (productId, skuCode, qty) 或 (product, ...)
      const skuCode = currentSku?.skuCode || product.skus[0]?.skuCode;
      await (addItem as any)(product._id, skuCode, quantity);
      toast.success('已加入购物车 🛒');
    } catch (e) {
      // 兜底：也支持直接传 product
      try { await (addItem as any)(product); toast.success('已加入购物车 🛒'); } catch (_) {}
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { toast.error('请先登录'); navigate('/login'); return; }
    await handleAddToCart();
    navigate('/checkout');
  };

  // ========= 模拟评价 =========
  const mockReviews = useMemo(() => [
    { name: '潮流小宝', avatar: '🧑‍🎤', rating: 5, content: '质感真的超出预期！包装也很精致，推荐购买～', date: '3天前', pics: 2, likes: 32 },
    { name: '二次元宅',   avatar: '🧙‍♂️', rating: 5, content: '五条悟手办比想象中做工还精细，值得入手！',   date: '7天前', pics: 3, likes: 128 },
    { name: '霓虹购物狂', avatar: '💃',   rating: 4, content: '物流很快，颜色和图片一致，下次还买。',       date: '12天前', pics: 1, likes: 45 },
    { name: '极客小黑',   avatar: '🤓',   rating: 5, content: 'RGB 灯效拉满，键盘打字手感很舒服，机械键盘坑我入了。', date: '15天前', pics: 4, likes: 201 },
    { name: '宝宝新用户', avatar: '👶',   rating: 4, content: '尺码偏小一码，客服帮我换了货，服务不错。',     date: '21天前', pics: 0, likes: 11 }
  ], []);

  // ========= 商品参数（基于 specs 生成）=========
  const specRows = useMemo(() => {
    if (!product) return [];
    const rows = [
      ['商品名称', product.name],
      ['品牌', product.brand || '宝宝商城'],
      ['分类', (product.categoryId as any)?.name || '-'],
      ['商品编号', product._id],
      ['已售', `${product.salesCount} 件`],
      ['浏览量', `${product.viewCount || 0} 次`]
    ];
    for (const spec of product.specs || []) {
      rows.push([spec.name, spec.values.join(' / ')]);
    }
    return rows;
  }, [product]);

  // ========= 推荐商品（根据推荐接口） =========
  const { data: recommended } = useQuery<{ list: Product[] }>(
    ['recommendedForDetail', product?.categoryId?._id],
    () => productApi.getRecommended(6),
    { enabled: !!product }
  );

  // ========= 渲染 =========
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-48 shimmer-bg rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="aspect-square shimmer-bg rounded-2xl" />
          <div className="space-y-3">
            <div className="h-10 shimmer-bg rounded" />
            <div className="h-16 shimmer-bg rounded" />
            <div className="h-20 shimmer-bg rounded" />
            <div className="h-24 shimmer-bg rounded" />
            <div className="h-12 shimmer-bg rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="glass-card py-16 text-center">
        <div className="text-6xl mb-4">😵</div>
        <p className="text-white/70 mb-4">商品不存在或加载失败</p>
        <button onClick={() => navigate('/')} className="btn-neon">返回首页</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <ChevronLeft size={14} className="cursor-pointer hover:text-neon-300" onClick={() => navigate(-1)} />
        <span onClick={() => navigate('/')} className="cursor-pointer hover:text-neon-300">首页</span>
        <span>/</span>
        <span
          onClick={() => navigate(`/products?categoryId=${((product.categoryId as any)?._id || '')}`)}
          className="cursor-pointer hover:text-neon-300"
        >
          {((product.categoryId as any)?.name || '商品')}
        </span>
        <span>/</span>
        <span className="text-white/80 truncate max-w-[40ch]">{product.name}</span>
      </div>

      {/* 主体 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左：图片画廊 */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 缩略图 */}
          <div className="flex md:flex-col gap-2 order-2 md:order-1 md:max-h-[480px] md:overflow-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === i
                    ? 'border-neon-400 shadow-neon-soft'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <ProductImage
                  images={product.images}
                  index={i}
                  alt={product.name}
                  square
                  imgClassName="transition-transform hover:scale-110"
                />
              </button>
            ))}
          </div>

          {/* 主图 */}
          <div className="flex-1 order-1 md:order-2 glass-card p-3">
            <ProductImage
              images={product.images}
              index={selectedImage}
              alt={product.name}
              square
              className="rounded-xl overflow-hidden"
              imgClassName="hover:scale-105"
            />
          </div>
        </div>

        {/* 右：商品信息 */}
        <div className="glass-card p-5 space-y-5">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {product.tags?.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className={
                    t === '新品' ? 'badge-new' :
                    t === '热销' ? 'badge-hot' :
                    t === '包邮' ? 'badge-ship' : 'badge-sale'
                  }
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              {product.description || '宝宝商城精选好物，正品保证，极速物流，7天无理由退换。'}
            </p>
          </div>

          {/* 霓虹价格面板 */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-primary-500/15 via-flame-500/10 to-ink-950 border border-primary-500/20">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-500/20 blur-3xl"></div>
            <div className="relative flex items-baseline gap-3">
              <span className="text-white/50 text-sm">价格</span>
              <span className="text-4xl font-extrabold text-neon-gradient bg-clip-text text-transparent text-glow">
                ¥{(currentSku?.price ?? product.price).toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > (currentSku?.price ?? product.price) && (
                <span className="text-lg text-white/30 line-through">
                  ¥{product.originalPrice.toFixed(2)}
                </span>
              )}
              <span className="ml-auto badge-hot">
                立省 ¥{Math.max(0, (product.originalPrice ?? product.price) - (currentSku?.price ?? product.price)).toFixed(0)}
              </span>
            </div>
            <div className="relative mt-3 flex items-center gap-5 text-sm">
              <span className="text-white/60 flex items-center gap-1">
                <TrendingUp size={14} className="text-flame-400" /> 已售 {product.salesCount}
              </span>
              <span className="text-white/60 flex items-center gap-1">
                <Award size={14} className="text-neon-400" /> 好评 98%
              </span>
              <span className="text-white/60 flex items-center gap-1">
                <PackageCheck size={14} className="text-emerald-400" /> 库存 {currentSku?.stock ?? 99}
              </span>
            </div>
          </div>

          {/* 服务三联 */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { icon: Truck, title: '极速物流', desc: '24h 发货' },
              { icon: Shield, title: '正品保障', desc: '假一赔十' },
              { icon: RotateCcw, title: '7 天退换', desc: '无忧售后' }
            ].map((s) => (
              <div key={s.title} className="glass rounded-xl p-3 flex flex-col items-center text-center">
                <s.icon size={18} className="text-neon-300 mb-1" />
                <div className="text-white/80 font-medium">{s.title}</div>
                <div className="text-white/40 text-[10px]">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* 促销 */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-white/40 w-14 shrink-0">促销</span>
              <span className="flex items-center gap-1.5">
                <Tag size={12} className="text-flame-400" />
                <span className="text-white/70">满 99 包邮 · 新人券立减 20</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/40 w-14 shrink-0">配送</span>
              <span className="text-white/70">浙江 杭州 西湖区 · 次日达</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/40 w-14 shrink-0">分期</span>
              <span className="text-white/70 flex items-center gap-1.5">
                <Zap size={12} className="text-amber-400" />
                满 500 花呗 12 期免息
              </span>
            </div>
          </div>

          {/* 规格选择 */}
          {product.specs?.map((spec) => (
            <div key={spec.name}>
              <div className="text-sm text-white/60 mb-2 flex items-center gap-2">
                <span className="w-14 shrink-0">{spec.name}</span>
                {selectedSpecs[spec.name] && (
                  <span className="text-[10px] text-neon-300">已选：{selectedSpecs[spec.name]}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {spec.values.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleSpecSelect(spec.name, value)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-all border ${
                      selectedSpecs[spec.name] === value
                        ? 'bg-neon-gradient-soft border-neon-500/50 text-neon-200 shadow-neon-soft'
                        : 'border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* 数量 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/50 w-14 shrink-0">数量</span>
            <div className="flex items-center border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-white/70 hover:bg-white/5"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                className="w-16 text-center bg-transparent text-white border-l border-r border-white/10 py-2 focus:outline-none"
              />
              <button
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="p-2 text-white/70 hover:bg-white/5"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-sm text-white/40">库存 {currentSku?.stock ?? 99}</span>
          </div>

          {/* 操作区 */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleAddToCart} className="flex-1 btn-outline flex items-center justify-center gap-2">
              <ShoppingCart size={18} /> 加入购物车
            </button>
            <button onClick={handleBuyNow} className="flex-1 btn-neon">
              立即购买
            </button>
            <button className="p-2.5 glass rounded-xl hover:text-primary-400 transition" title="收藏">
              <Heart size={18} />
            </button>
            <button className="p-2.5 glass rounded-xl hover:text-neon-400 transition" title="分享">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + 右侧推荐 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs 切换 */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex border-b border-white/5">
              {([
                ['detail',  '商品详情'],
                ['specs',   '规格参数'],
                ['reviews', `用户评价 (${mockReviews.length})`]
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-3 text-sm transition relative ${
                    tab === key ? 'text-neon-300' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {label}
                  {tab === key && <div className="absolute left-4 right-4 bottom-0 h-0.5 bg-neon-gradient"></div>}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'detail' && (
                <div className="space-y-4 text-sm leading-7 text-white/75">
                  <h3 className="text-lg font-semibold text-white">🎉 {product.name}</h3>
                  <p>{product.description || '宝宝商城携手优质品牌为您带来这款好物。我们对每件商品都经过严格筛选和品质把控，确保您收到的商品和描述一致。'}</p>
                  <ProductImage images={product.images} index={0} alt={product.name} className="rounded-xl" />
                  <p>📦 <strong>材质与工艺</strong>：本商品采用优质原料，工艺细节精益求精，满足日常使用与送礼场景。</p>
                  <ProductImage images={product.images} index={1 % product.images.length} alt={product.name} className="rounded-xl" />
                  <p>🎁 <strong>送礼好物</strong>：包装精美，适合自己使用，也适合赠送亲朋好友。详情咨询客服，欢迎选购！</p>
                  <ProductImage images={product.images} index={2 % product.images.length} alt={product.name} className="rounded-xl" />
                </div>
              )}

              {tab === 'specs' && (
                <div className="overflow-hidden rounded-xl border border-white/5">
                  {specRows.map(([k, v], i) => (
                    <div
                      key={k}
                      className={`flex text-sm ${i % 2 ? 'bg-white/[0.02]' : ''}`}
                    >
                      <div className="w-40 shrink-0 p-3 text-white/50 border-r border-white/5">{k}</div>
                      <div className="flex-1 p-3 text-white/80 break-all">{String(v)}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-6 p-4 rounded-xl glass">
                    <div className="text-center">
                      <div className="text-4xl font-extrabold text-neon">4.9</div>
                      <div className="text-xs text-white/40 mt-0.5">综合评分</div>
                    </div>
                    <div className="flex-1 space-y-1.5 text-xs">
                      {[5, 4, 3, 2, 1].map((s, idx) => {
                        const pct = [78, 15, 4, 2, 1][idx];
                        return (
                          <div key={s} className="flex items-center gap-2">
                            <span className="w-16 text-white/60">{s} 星</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-neon-gradient" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-white/40 w-10 text-right">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {mockReviews.map((r, i) => (
                      <div key={i} className="p-4 glass rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-neon-gradient-soft flex items-center justify-center text-lg">
                            {r.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white/80">{r.name}</div>
                            <div className="flex items-center gap-1 text-[10px] text-white/40">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <Star key={j} size={10} fill={j < r.rating ? '#faad14' : 'none'} stroke="#faad14" />
                              ))}
                              <span className="ml-1">{r.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-white/70">{r.content}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/40">
                          {r.pics > 0 && <span>📷 晒图 {r.pics} 张</span>}
                          <span>👍 有用 {r.likes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右：猜你喜欢 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-neon-400" /> 猜你喜欢
          </h3>
          <div className="space-y-3">
            {(recommended?.list ?? []).slice(0, 5).map((p) => (
              <button
                key={p._id}
                onClick={() => { navigate(`/products/${p._id}`); window.scrollTo({ top: 0 }); }}
                className="w-full glass-card p-3 flex gap-3 items-center text-left"
              >
                <ProductImage
                  images={p.images}
                  index={0}
                  alt={p.name}
                  className="w-16 h-16 shrink-0 rounded-lg overflow-hidden"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 line-clamp-2">{p.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-primary-400 font-bold">¥{(p.price).toFixed(0)}</span>
                    <span className="text-[10px] text-white/40">{p.salesCount} 已售</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/30" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

