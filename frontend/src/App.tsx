/**
 * 应用主组件
 * 
 * 职责：配置路由、布局、全局组件
 */
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';
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

function App() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 受保护的路由路径
  const protectedRoutes = ['/cart', '/checkout', '/orders', '/user'];

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isProtectedRoute && !isAuthenticated) {
      toast.error('请先登录');
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [location.pathname, isAuthenticated]);

  return (
    <Routes>
      {/* 主布局路由 */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/user" element={<UserCenterPage />} />
      </Route>

      {/* 独立页面 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 404 页面 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// 导入 toast
import { toast } from 'react-hot-toast';

export default App;
