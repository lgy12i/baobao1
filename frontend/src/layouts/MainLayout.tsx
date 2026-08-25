/**
 * 主布局组件
 * 
 * 包含：顶部导航、侧边分类、主内容区、底部
 * 参考淘宝首页布局设计
 */
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { ShoppingCart, User, Search, Menu, X, Heart, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalCount } = useCartStore();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 如果已登录，获取购物车数据
    if (isAuthenticated) {
      useCartStore.getState().fetchCart();
    }
  }, [isAuthenticated]);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 顶部信息栏 */}
      <div className="bg-gray-800 text-gray-300 text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              中国大陆
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">亲，宝宝商城欢迎您！</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-primary-400">{user?.nickname || user?.username}</span>
                <button onClick={handleLogout} className="hover:text-white">
                  退出
                </button>
                <span>|</span>
                <button onClick={() => navigate('/orders')} className="hover:text-white">
                  我的订单
                </button>
                <span>|</span>
                <button onClick={() => navigate('/user')} className="hover:text-white">
                  会员中心
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="hover:text-white text-primary-400">
                  请登录
                </button>
                <button onClick={() => navigate('/register')} className="hover:text-white">
                  免费注册
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要 Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              淘
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-500">宝宝商城</h1>
              <p className="text-xs text-gray-500">上宝宝，就淘到！</p>
            </div>
          </div>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索商品、品牌、店铺"
                className="w-full px-4 py-3 pl-12 pr-24 border-2 border-primary-500 rounded-l-full rounded-r-full focus:outline-none focus:border-primary-600 transition-colors"
              />
              <Search className="absolute left-4 text-gray-400" size={20} />
              <button
                type="submit"
                className="absolute right-0 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-r-full transition-colors"
              >
                搜索
              </button>
            </div>
            {/* 热搜关键词 */}
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>热搜：</span>
              {['连衣裙', 'iPhone 15', '运动鞋', '护肤品'].map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => {
                    setSearchQuery(keyword);
                    navigate(`/products?keyword=${encodeURIComponent(keyword)}`);
                  }}
                  className="hover:text-primary-500 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </form>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:border-primary-500 hover:text-primary-500 transition-colors"
            >
              <ShoppingCart size={20} />
              <span className="hidden md:inline">购物车</span>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/user')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <User size={24} />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="收藏"
            >
              <Heart size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* 移动菜单按钮 */}
      <button
        className="fixed bottom-4 right-4 md:hidden bg-primary-500 text-white p-3 rounded-full shadow-lg z-50"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 主内容区 */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* 页脚 */}
      <Footer />
    </div>
  );
}
