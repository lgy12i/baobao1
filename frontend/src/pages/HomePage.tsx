/**
 * 首页 · 霓虹潮流主题
 *
 * 模块布局（融合淘宝/京东/拼多多 + 个人特色）：
 *  1. Hero 轮播 + 分类瀑布入口
 *  2. 百亿补贴横幅（拼多多式）
 *  3. 限时秒杀倒计时（淘宝式）
 *  4. 拼团 / 优惠券 / 签到入口（九宫格）
 *  5. 商品种草信息流（小红书式瀑布流）
 *  6. 猜你喜欢（淘宝式无限滚动）
 */
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { productApi, Category, Product } from '@/services/product.api';
import { useCartStore } from '@/stores/cart.store';
import { useState, useEffect } from 'react';
import {
  Flame, Zap, Gift, Ticket, Sparkles, ShoppingCart, Heart,
  ChevronRight, Clock, Crown, TrendingUp, Star, ArrowRight, Bot
} from 'lucide-react';
import ProductImage from '@/components/ProductImage';

// 倒计时组件
function Countdown() {
  const [remain, setRemain] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(24, 0, 0, 0); // 到今晚 24 点
      const diff = end.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemain({ h, m, s });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <span className="px-1.5 py-0.5 rounded bg-ink-950 text-flame-400">{pad(remain.h)}</span>
      <span className="text-flame-400">:</span>
      <span className="px-1.5 py-0.5 rounded bg-ink-950 text-flame-400">{pad(remain.m)}</span>
      <span className="text-flame-400">:</span>
      <span className="px-1.5 py-0.5 rounded bg-ink-950 text-flame-400">{pad(remain.s)}</span>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories } = useQuery<Category[]>('categories', () =>
    productApi.getCategories(true)
  );
  const { data: recommendedData } = useQuery<{ list: Product[] }>('recommended', () =>
    productApi.getRecommended(12)
  );

  const products = recommendedData?.list ?? [];

  // 模拟 banner
  const banners = [
    {
      id: 1,
      title: '霓虹潮流季 · 咒术回战联名专场',
      subtitle: '周边立减 ¥50 · 限量发售',
      grad: 'from-primary-500 via-purple-500 to-neon-500',
      cta: '立即抢购'
    },
    {
      id: 2,
      title: '百亿补贴 · 数码爆款',
      subtitle: 'iPhone 低至 ¥4999',
      grad: 'from-flame-500 via-primary-500 to-purple-600',
      cta: '去逛逛'
    },
    {
      id: 3,
      title: '新品首发 · 机械键盘专场',
      subtitle: 'RGB 霓虹灯效 · 8 折起',
      grad: 'from-neon-500 via-blue-500 to-primary-500',
      cta: '探索'
    }
  ];

  // 百亿补贴商品（取前 4 件）
  const subsidyProducts = products.slice(0, 4);

  // 秒杀商品（取 4 件，模拟大折扣）
  const seckillProducts = products.slice(4, 8);

  // 种草内容
  const discoveries = [
    { id: 1, title: '夏日清爽穿搭｜5 套搭配教程', img: '👗', tag: '穿搭', likes: 2341 },
    { id: 2, title: '咒术回战周边开箱｜五条悟手办', img: '🧿', tag: '二次元', likes: 5892 },
    { id: 3, title: '宿舍改造｜霓虹氛围灯布置', img: '💡', tag: '家居', likes: 1234 },
    { id: 4, title: '机械键盘入坑指南｜RGB 必看', img: '⌨️', tag: '数码', likes: 892 }
  ];

  return (
    <div className="space-y-6">
      {/* ====== 1. Hero 区 ====== */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 左侧分类（京东式） */}
        <aside className="hidden lg:block glass rounded-2xl p-3">
          <h3 className="text-xs text-white/40 px-2 pb-2">商品分类</h3>
          <div className="space-y-0.5">
            {(categories ?? []).slice(0, 10).map((c) => (
              <button
                key={c._id}
                onClick={() => navigate(`/products?categoryId=${c._id}`)}
                onMouseEnter={() => setActiveCategory(c._id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-neon-300 transition group"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{c.icon || '✨'}</span>
                  {c.name}
                </span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        </aside>

        {/* 中间轮播 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden shadow-neon">
            {/* 简单轮播：展示第一个 banner，可后续替换 Swiper */}
            <div className={`absolute inset-0 bg-gradient-to-br ${banners[0].grad} animate-neon-pulse`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_50%)]"></div>
              <div className="relative h-full flex flex-col justify-center px-10 text-white">
                <span className="badge-new mb-3 self-start">🔥 限时活动</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-glow">{banners[0].title}</h2>
                <p className="text-white/80 mb-4">{banners[0].subtitle}</p>
                <button
                  onClick={() => navigate('/products?keyword=咒术回战')}
                  className="btn-neon self-start"
                >
                  {banners[0].cta} <ArrowRight size={16} className="inline ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* banner 切换 dots */}
          <div className="flex gap-2 justify-center">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => navigate(i === 1 ? '/products?keyword=iPhone' : i === 2 ? '/products?keyword=键盘' : '/products?keyword=咒术回战')}
                className={`h-1.5 rounded-full transition-all ${
                  i === 0 ? 'w-12 bg-neon-gradient' : 'w-3 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* 百亿补贴横幅（拼多多式） */}
          <div
            className="glass-card p-4 cursor-pointer"
            onClick={() => navigate('/products?sort=sales')}
          >
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-lg bg-flame-gradient text-white font-bold text-sm shadow-flame-500/30">
                百亿补贴
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-3 animate-[shimmer_8s_linear_infinite]">
                  {subsidyProducts.map((p) => (
                    <div key={p._id} className="shrink-0 w-32">
                      <div className="text-xs text-white/70 truncate">{p.name}</div>
                      <div className="text-flame-400 font-bold">
                        ¥{p.price}
                        <span className="text-[10px] text-white/40 line-through ml-1">¥{p.originalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRight size={20} className="text-white/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ====== 2. 营销入口九宫格 ====== */}
      <section className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { icon: Flame,    label: '限时秒杀',   path: '/seckill',   color: 'from-flame-500 to-primary-500' },
          { icon: Ticket,   label: '领券中心',   path: '/coupons',   color: 'from-primary-500 to-purple-500' },
          { icon: Gift,     label: '拼团优惠',   path: '/group-buy', color: 'from-neon-500 to-blue-500' },
          { icon: Zap,      label: '每日签到',   path: '/checkin',   color: 'from-amber-500 to-flame-500' },
          { icon: Sparkles, label: '好物种草',   path: '/discover',  color: 'from-purple-500 to-pink-500' },
          { icon: Crown,    label: '销量榜单',   path: '/products?sort=sales', color: 'from-yellow-500 to-amber-600' }
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => navigate(m.path)}
            className="glass-card p-4 flex flex-col items-center gap-2 group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition`}>
              <m.icon size={22} />
            </div>
            <span className="text-xs text-white/80 group-hover:text-white">{m.label}</span>
          </button>
        ))}
      </section>

      {/* ====== 3. 限时秒杀 ====== */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-flame-gradient text-white font-bold flex items-center gap-2">
              <Flame size={16} /> 限时秒杀
            </div>
            <Countdown />
          </div>
          <button
            onClick={() => navigate('/seckill')}
            className="text-xs text-white/50 hover:text-neon-300 flex items-center gap-1"
          >
            更多 <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {seckillProducts.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/products/${p._id}`)}
              className="bg-ink-950/40 rounded-xl p-3 cursor-pointer hover:border-flame-500/40 border border-transparent transition group"
            >
              <ProductImage images={p.images} alt={p.name} className="mb-2 rounded-lg overflow-hidden" imgClassName="group-hover:scale-105 transition" />
              <p className="text-xs text-white/70 truncate">{p.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-flame-400 font-bold">¥{p.price}</span>
                <span className="text-[10px] text-white/30 line-through">¥{p.originalPrice}</span>
              </div>
              <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-flame-gradient" style={{ width: `${60 + Math.random() * 30}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 4. 好物种草（小红书式瀑布流） ====== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neon flex items-center gap-2">
            <Sparkles size={20} /> 好物种草
          </h2>
          <button
            onClick={() => navigate('/discover')}
            className="text-xs text-white/50 hover:text-neon-300 flex items-center gap-1"
          >
            查看全部 <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {discoveries.map((d) => (
            <div key={d.id} className="glass-card overflow-hidden cursor-pointer group">
              <div className="aspect-[4/5] bg-gradient-to-br from-purple-500/20 to-neon-500/20 flex items-center justify-center text-6xl group-hover:scale-105 transition">
                {d.img}
              </div>
              <div className="p-3">
                <span className="badge-new mb-2">{d.tag}</span>
                <p className="text-sm text-white/80 line-clamp-2">{d.title}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-white/40">
                  <Heart size={12} /> {d.likes}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 5. 猜你喜欢 ====== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 divider-neon"></div>
          <h2 className="text-xl font-bold text-neon flex items-center gap-2">
            <TrendingUp size={20} /> 猜你喜欢
          </h2>
          <div className="h-px flex-1 divider-neon"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/products/${p._id}`)}
              className="glass-card overflow-hidden cursor-pointer group"
            >
              <ProductImage images={p.images} alt={p.name} imgClassName="group-hover:scale-110 transition duration-500" />
              <div className="p-3">
                <div className="flex flex-wrap gap-1 mb-1">
                  {p.tags?.slice(0, 2).map((t) => (
                    <span key={t} className={
                      t === '新品' ? 'badge-new' :
                      t === '热销' ? 'badge-hot' :
                      t === '包邮' ? 'badge-ship' : 'badge-sale'
                    }>{t}</span>
                  ))}
                </div>
                <p className="text-sm text-white/80 line-clamp-2 mb-2">{p.name}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-primary-400 font-bold">¥{p.price}</span>
                    <span className="text-[10px] text-white/30 line-through ml-1">¥{p.originalPrice}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem(p);
                    }}
                    className="p-1.5 rounded-lg bg-neon-gradient text-white hover:shadow-neon transition"
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40">
                  <span>🔥 已售 {p.salesCount}</span>
                  <span className="flex items-center gap-0.5">
                    <Star size={10} className="text-amber-400" /> 4.8
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

