/**
 * 应用主组件 · 霓虹潮流版
 *
 * 路由：
 *  - /              首页
 *  - /products      商品列表
 *  - /products/:id  商品详情
 *  - /seckill       限时秒杀
 *  - /coupons       优惠券中心
 *  - /group-buy     拼团优惠
 *  - /discover      好物种草
 *  - /checkin       每日签到
 *  - /cart /checkout /orders /user  原业务路由
 */
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import MainLayout from '@/layouts/MainLayout';
import HomePage from '@/pages/HomePage';
import ProductListPage from '@/pages/ProductListPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderListPage from '@/pages/OrderListPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import UserCenterPage from '@/pages/UserCenterPage';
import NotFoundPage from '@/pages/NotFoundPage';
import {
  SeckillPage, CouponsPage, GroupBuyPage, DiscoverPage, CheckinPage
} from '@/pages/MarketingPages';

function App() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const protectedRoutes = ['/cart', '/checkout', '/orders', '/user'];

  useEffect(() => {
    const isProtected = protectedRoutes.some((r) => location.pathname.startsWith(r));
    if (isProtected && !isAuthenticated) {
      toast.error('请先登录');
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [location.pathname, isAuthenticated]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        {/* 营销模块 */}
        <Route path="/seckill" element={<SeckillPage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="/group-buy" element={<GroupBuyPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/checkin" element={<CheckinPage />} />
        {/* 业务 */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/user" element={<UserCenterPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
