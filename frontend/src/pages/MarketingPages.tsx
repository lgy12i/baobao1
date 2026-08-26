/**
 * 营销活动页面集合
 * - SeckillPage: 限时秒杀
 * - CouponsPage: 优惠券中心
 * - GroupBuyPage: 拼团优惠
 * - DiscoverPage: 好物种草
 * - CheckinPage: 每日签到
 *
 * 全部采用霓虹潮流主题
 */
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { productApi, Product } from '@/services/product.api';
import {
  Flame, Ticket, Gift, Sparkles, Zap, Crown, Clock, Heart,
  ShoppingCart, ChevronRight, Check, Star, TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/stores/cart.store';

/* ============= 公共倒计时 ============= */
function useCountdown(hours = 8) {
  const [remain, setRemain] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const end = Date.now() + hours * 3600 * 1000;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setRemain({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [hours]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1 font-mono text-sm">
      <span className="px-1.5 py-0.5 rounded bg-ink-950 text-flame-400">{pad(remain.h)}</span>
      <span className="text-flame-400">:</span>
      <span className="px-1.5 py-0.5 rounded bg-ink-950 text-flame-400">{pad(remain.m)}</span>
      <span className="text-flame-400">:</span>
      <span className="px-1.5 py-0.5 rounded bg-ink-950 text-flame-400">{pad(remain.s)}</span>
    </div>
  );
}

/* ============= 1. 限时秒杀 ============= */
export function SeckillPage() {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { data } = useQuery<{ list: Product[] }>('recommended', () =>
    productApi.getRecommended(20)
  );
  const products = (data?.list ?? []).slice(0, 12);
  const countdown = useCountdown(8);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-flame-500/20 via-primary-500/10 to-transparent"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-flame-gradient bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Flame size={32} /> 限时秒杀
          </h1>
          <p className="text-white/60 mt-2 text-sm">每日 0 点更新 · 抢完即止</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="text-white/60 text-sm flex items-center gap-1">
              <Clock size={14} /> 距结束
            </span>
            {countdown}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p, i) => {
          const discount = Math.floor(50 + Math.random() * 30);
          return (
            <div
              key={p._id}
              onClick={() => navigate(`/products/${p._id}`)}
              className="glass-card overflow-hidden cursor-pointer group relative"
            >
              <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded-lg bg-flame-gradient text-white text-xs font-bold shadow-lg">
                {discount}折
              </div>
              <div className="aspect-square bg-white/5 flex items-center justify-center text-5xl overflow-hidden">
                {p.mainImage ? (
                  <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                ) : '📦'}
              </div>
              <div className="p-3">
                <p className="text-sm text-white/80 line-clamp-2 mb-2">{p.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-flame-400 font-bold text-lg">¥{(p.price * discount / 100).toFixed(0)}</span>
                  <span className="text-xs text-white/30 line-through">¥{p.price}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-flame-gradient" style={{ width: `${30 + Math.random() * 50}%` }}></div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addItem(p); toast.success('已加入购物车'); }}
                    className="p-1.5 rounded-lg bg-flame-gradient text-white hover:shadow-neon transition"
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============= 2. 优惠券中心 ============= */
export function CouponsPage() {
  const coupons = [
    { id: 1, value: 50, threshold: 299, name: '新人专享', desc: '满299减50', color: 'from-primary-500 to-purple-500', got: false },
    { id: 2, value: 100, threshold: 599, name: '数码专区', desc: '满599减100', color: 'from-neon-500 to-blue-500', got: false },
    { id: 3, value: 30, threshold: 199, name: '美妆个护', desc: '满199减30', color: 'from-flame-500 to-primary-500', got: false },
    { id: 4, value: 20, threshold: 99, name: '全品类通用', desc: '满99减20', color: 'from-amber-500 to-flame-500', got: true },
    { id: 5, value: 200, threshold: 1299, name: '数码大额', desc: '满1299减200', color: 'from-purple-500 to-pink-500', got: false },
    { id: 6, value: 15, threshold: 0, name: '无门槛券', desc: '立减15元', color: 'from-emerald-500 to-neon-500', got: false }
  ];
  const [list, setList] = useState(coupons);

  const grab = (id: number) => {
    setList(list.map(c => c.id === id ? { ...c, got: true } : c));
    toast.success('优惠券领取成功 🎉');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 text-center">
        <h1 className="text-3xl font-bold text-neon flex items-center justify-center gap-2">
          <Ticket size={32} /> 优惠券中心
        </h1>
        <p className="text-white/60 mt-2 text-sm">领取优惠券 · 下单自动抵扣</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((c) => (
          <div key={c.id} className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${c.color} p-0.5 shadow-neon-soft`}>
            <div className="rounded-2xl bg-ink-900/90 p-4 flex items-center gap-4">
              <div className="text-center min-w-[80px]">
                <div className="text-3xl font-bold text-white">
                  ¥{c.value}
                </div>
                <div className="text-[10px] text-white/60 mt-0.5">
                  {c.threshold > 0 ? `满${c.threshold}可用` : '无门槛'}
                </div>
              </div>
              <div className="flex-1 border-l border-dashed border-white/20 pl-4">
                <div className="text-white font-semibold">{c.name}</div>
                <div className="text-xs text-white/60 mt-1">{c.desc}</div>
                <div className="text-[10px] text-white/40 mt-1">有效期：7天内</div>
              </div>
              <button
                disabled={c.got}
                onClick={() => grab(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  c.got
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-white text-ink-900 hover:scale-105 shadow-lg'
                }`}
              >
                {c.got ? <Check size={16} /> : '立即领取'}
              </button>
            </div>
            {/* 装饰圆点 */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ink-800"></div>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ink-800"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============= 3. 拼团优惠 ============= */
export function GroupBuyPage() {
  const navigate = useNavigate();
  const { data } = useQuery<{ list: Product[] }>('recommended', () =>
    productApi.getRecommended(8)
  );
  const products = (data?.list ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 text-center">
        <h1 className="text-3xl font-bold text-neon-gradient bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Gift size={32} /> 拼团优惠
        </h1>
        <p className="text-white/60 mt-2 text-sm">2人成团立减 · 邀请好友更划算</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p, i) => {
          const groupPrice = (p.price * 0.8).toFixed(0);
          const members = 1 + Math.floor(Math.random() * 3);
          return (
            <div key={p._id} className="glass-card p-4 flex gap-4 items-center">
              <div
                onClick={() => navigate(`/products/${p._id}`)}
                className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center text-4xl overflow-hidden cursor-pointer shrink-0"
              >
                {p.mainImage ? <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" /> : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 line-clamp-1">{p.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-primary-400 font-bold text-xl">¥{groupPrice}</span>
                  <span className="text-xs text-white/30 line-through">¥{p.price}</span>
                  <span className="badge-hot">2人团</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="w-6 h-6 rounded-full bg-neon-gradient border-2 border-ink-800 flex items-center justify-center text-[10px] text-white">
                        {idx < members ? '👤' : '?'}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-white/50">还差 {2 - members} 人</span>
                </div>
              </div>
              <button
                onClick={() => { toast.success('已发起拼团，快去邀请好友吧！'); navigate('/cart'); }}
                className="px-4 py-2 rounded-xl bg-neon-gradient text-white font-medium hover:shadow-neon transition whitespace-nowrap"
              >
                发起拼团
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============= 4. 好物种草 ============= */
export function DiscoverPage() {
  const discoveries = [
    { id: 1, title: '夏日清爽穿搭｜5 套搭配教程，显瘦又气质', img: '👗', tag: '穿搭', likes: 2341, author: '时尚达人小宝' },
    { id: 2, title: '咒术回战周边开箱｜五条悟手办太香了', img: '🧿', tag: '二次元', likes: 5892, author: '二次元收藏家' },
    { id: 3, title: '宿舍改造｜霓虹氛围灯布置 VLOG', img: '💡', tag: '家居', likes: 1234, author: '生活家阿宝' },
    { id: 4, title: '机械键盘入坑指南｜RGB 霓虹灯效必看', img: '⌨️', tag: '数码', likes: 892, author: '数码评测君' },
    { id: 5, title: '护肤不踩雷｜油皮夏季水乳推荐', img: '🧴', tag: '美妆', likes: 3421, author: '成分党小李' },
    { id: 6, title: '周末露营装备清单｜新手必备', img: '⛺', tag: '户外', likes: 1567, author: '户外探险家' },
    { id: 7, title: '咖啡冲煮｜手冲器具入门套装', img: '☕', tag: '生活', likes: 989, author: '咖啡师阿宝' },
    { id: 8, title: '游戏主机选购｜PS5 vs Switch', img: '🎮', tag: '游戏', likes: 4231, author: '游戏达人' }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 text-center">
        <h1 className="text-3xl font-bold text-neon flex items-center justify-center gap-2">
          <Sparkles size={32} /> 好物种草
        </h1>
        <p className="text-white/60 mt-2 text-sm">达人推荐 · 真实评测 · 帮你选好物</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {discoveries.map((d) => (
          <div key={d.id} className="glass-card overflow-hidden cursor-pointer group">
            <div className="aspect-[4/5] bg-gradient-to-br from-purple-500/20 to-neon-500/20 flex items-center justify-center text-7xl group-hover:scale-105 transition duration-500 relative">
              {d.img}
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-ink-950/60 backdrop-blur text-xs text-white">
                ❤ {d.likes}
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-new">{d.tag}</span>
                <span className="text-[10px] text-white/40">@{d.author}</span>
              </div>
              <p className="text-sm text-white/80 line-clamp-2">{d.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============= 5. 每日签到 ============= */
export function CheckinPage() {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  const [signedDays, setSignedDays] = useState<number[]>([1, 2, 3]);
  const [todaySigned, setTodaySigned] = useState(false);

  const signToday = () => {
    if (todaySigned) return;
    setSignedDays([...signedDays, 4]);
    setTodaySigned(true);
    toast.success('签到成功 +10 积分 🎉');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="glass-card p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-flame-500/10 to-transparent"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-amber-400 flex items-center justify-center gap-2">
            <Zap size={32} /> 每日签到
          </h1>
          <p className="text-white/60 mt-2 text-sm">连续签到 7 天，第 7 天领 50 积分大礼包</p>
          <div className="mt-4 text-4xl font-bold text-neon">
            {signedDays.length * 10}
            <span className="text-sm text-white/40 ml-1">积分</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const signed = signedDays.includes(d);
            const isToday = d === 4;
            return (
              <div
                key={d}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-2 border transition ${
                  signed
                    ? 'bg-neon-gradient-soft border-neon-500/40 text-neon-300'
                    : isToday && !todaySigned
                    ? 'border-amber-400/60 bg-amber-500/10 text-amber-300 animate-neon-pulse'
                    : 'border-white/10 bg-white/5 text-white/40'
                }`}
              >
                <span className="text-[10px]">第{d}天</span>
                {signed ? (
                  <Check size={20} className="my-1" />
                ) : (
                  <div className="text-lg my-1">{d === 7 ? '🎁' : '✦'}</div>
                )}
                <span className="text-[10px]">+{d === 7 ? 50 : 10}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={signToday}
          disabled={todaySigned}
          className={`mt-6 w-full py-3 rounded-xl font-medium transition ${
            todaySigned
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : 'btn-flame'
          }`}
        >
          {todaySigned ? '今日已签到 ✓' : '立即签到 +10 积分'}
        </button>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
          <Crown size={16} className="text-amber-400" /> 积分商城
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: '5元券', cost: 50, icon: '🎫' },
            { name: '10元券', cost: 100, icon: '🎟️' },
            { name: '神秘礼包', cost: 200, icon: '🎁' }
          ].map((g) => (
            <button
              key={g.name}
              onClick={() => toast.success('兑换成功（模拟）')}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition text-center"
            >
              <div className="text-2xl mb-1">{g.icon}</div>
              <div className="text-xs text-white/80">{g.name}</div>
              <div className="text-xs text-amber-400 mt-0.5">{g.cost} 积分</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
