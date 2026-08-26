/**
 * 主布局组件 · 霓虹潮流主题
 *
 * 融合：
 *  - 淘宝：顶部信息栏 + 圆形搜索框 + 热搜词
 *  - 京东：商品分类导航 + 商务感深色
 *  - 拼多多：活力橙红 + 百亿补贴式入口
 *  - 个人特色：霓虹紫红/青蓝渐变 + 玻璃拟态
 */
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import {
  ShoppingCart, User, Search, Menu, X, Heart, MapPin,
  Flame, Ticket, Gift, Sparkles, Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Footer from './Footer';
import AIAssistant from '@/components/AIAssistant';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalCount } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      useCartStore.getState().fetchCart();
    }
  }, [isAuthenticated]);

  // 顶栏滚动效果
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 顶部快捷入口
  const quickEntries = [
    { icon: Flame,   label: '秒杀',     path: '/seckill',    color: 'text-flame-400' },
    { icon: Ticket,  label: '优惠券',   path: '/coupons',    color: 'text-primary-400' },
    { icon: Gift,    label: '拼团',     path: '/group-buy',  color: 'text-neon-400' },
    { icon: Sparkles,label: '种草',     path: '/discover',   color: 'text-purple-400' },
    { icon: Zap,     label: '签到',     path: '/checkin',    color: 'text-amber-400' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-ink-800 text-white">
      {/* 顶部信息栏 */}
      <div className="bg-ink-950/80 border-b border-white/5 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/60">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              中国大陆
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">✨ 宝宝商城 · 潮流霓虹购</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-neon-300 text-glow">
                  👋 {user?.nickname || user?.username}
                </span>
                <button onClick={handleLogout} className="hover:text-white">退出</button>
                <span className="text-white/20">|</span>
                <button onClick={() => navigate('/orders')} className="hover:text-white">我的订单</button>
                <span className="text-white/20">|</span>
                <button onClick={() => navigate('/user')} className="hover:text-white">会员中心</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-neon-300 hover:text-neon-200">登录</button>
                <button onClick={() => navigate('/register')} className="hover:text-white">注册</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主导航 Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass shadow-glass' : 'bg-ink-800/90 backdrop-blur'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo 霓虹 */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="relative w-11 h-11 rounded-xl bg-neon-gradient flex items-center justify-center font-bold text-xl text-white shadow-neon-soft animate-neon-pulse">
              宝
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-neon">宝宝商城</h1>
              <p className="text-[10px] text-white/40 -mt-0.5">潮流霓虹 · 闭眼买好物</p>
            </div>
          </div>

          {/* 搜索框 霓虹 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-white/40" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 咒术回战 / iPhone / 连衣裙 ..."
                className="input-neon pl-11 pr-20 py-2.5 rounded-full"
              />
              <button
                type="submit"
                className="absolute right-1 px-4 py-1.5 rounded-full bg-neon-gradient text-white font-medium text-sm hover:shadow-neon transition"
              >
                搜索
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/40">
              <span>热搜：</span>
              {['咒术回战周边', 'iPhone 15', '夏季连衣裙', '机械键盘', 'AirPods'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setSearchQuery(k);
                    navigate(`/products?keyword=${encodeURIComponent(k)}`);
                  }}
                  className="hover:text-neon-300 transition"
                >
                  {k}
                </button>
              ))}
            </div>
          </form>

          {/* 右侧操作 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 hover:border-primary-400 hover:bg-white/5 transition"
              title="购物车"
            >
              <ShoppingCart size={20} />
              <span className="hidden md:inline text-sm">购物车</span>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-neon-soft">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/user')}
              className="p-2 rounded-full border border-white/10 hover:border-neon-400 hover:bg-white/5 transition"
              title="会员中心"
            >
              <User size={20} />
            </button>
            <button
              className="p-2 rounded-full border border-white/10 hover:border-primary-400 hover:bg-white/5 transition hidden md:block"
              title="收藏"
            >
              <Heart size={20} />
            </button>
          </div>
        </div>

        {/* 营销快捷入口条 */}
        <div className="border-t border-white/5 bg-ink-950/40">
          <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-1 text-xs rounded-full transition whitespace-nowrap ${
                location.pathname === '/' ? 'bg-primary-500/20 text-primary-300' : 'text-white/60 hover:text-white'
              }`}
            >
              首页
            </button>
            {quickEntries.map((e) => (
              <button
                key={e.path}
                onClick={() => navigate(e.path)}
                className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition whitespace-nowrap ${
                  location.pathname === e.path
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <e.icon size={12} className={e.color} />
                {e.label}
              </button>
            ))}
            <span className="text-white/20 px-1">|</span>
            <button
              onClick={() => navigate('/products')}
              className="px-3 py-1 text-xs rounded-full text-white/60 hover:text-white whitespace-nowrap"
            >
              全部商品
            </button>
            <button
              onClick={() => navigate('/products?sort=sales')}
              className="px-3 py-1 text-xs rounded-full text-white/60 hover:text-white whitespace-nowrap"
            >
              销量榜
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* 页脚 */}
      <Footer />

      {/* 移动端菜单按钮 */}
      <button
        className="fixed bottom-20 left-4 md:hidden bg-neon-gradient text-white p-3 rounded-full shadow-neon z-50"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* AI 助手悬浮窗 */}
      <AIAssistant />
    </div>
  );
}
