/**
 * 登录页面
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import { ShoppingCart, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const from = (location.state as any)?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !password) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      await login(account, password, remember);
      navigate(from);
    } catch (error) {
      // 错误已在 API 层处理
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              淘
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-primary-500">宝宝商城</h1>
              <p className="text-sm text-gray-500">上宝宝，就淘到！</p>
            </div>
          </div>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">登录宝宝商城</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 账号输入 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">账号</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入用户名或邮箱"
                className="input-field"
                autoComplete="username"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 记住我 / 忘记密码 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded accent-primary-500"
                />
                <span className="text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-primary-500 hover:underline">忘记密码？</a>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">其他登录方式</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 第三方登录 */}
          <div className="flex justify-center gap-4">
            <button className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2C4.768 2 2 4.765 2 8.276c0 2.035 1.104 3.832 2.824 5.033l-.706 2.123 2.439-1.223c.87.242 1.77.365 2.702.365.217 0 .432-.01.644-.027-.135-.463-.208-.947-.208-1.446 0-3.002 2.93-5.433 6.539-5.433.215 0 .428.01.637.027C15.476 4.588 12.495 2 8.691 2z"/>
                <circle cx="5.852" cy="6.659" r=".861"/>
                <circle cx="10.936" cy="6.659" r=".861"/>
                <path d="M22 13.247c0-2.883-2.822-5.217-6.296-5.217-3.475 0-6.297 2.334-6.297 5.217 0 2.884 2.822 5.217 6.297 5.217.756 0 1.479-.108 2.157-.305l2.028 1.085-.555-1.72c1.474-1.02 2.566-2.541 2.666-4.277z"/>
              </svg>
            </button>
            <button className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.23 7.1c.16.45.23.92.23 1.4 0 2.83-2.24 5.13-5.07 5.13-.58 0-1.13-.08-1.66-.23-.45.55-.96 1.03-1.53 1.44-.15.11-.34.11-.49 0-.57-.41-1.08-.89-1.53-1.44-.53.15-1.08.23-1.66.23C3.91 16.63 1.68 14.33 1.68 11.5c0-.48.08-.95.23-1.4-.42-.53-.76-1.13-1-1.78-.17-.44-.03-.93.34-1.23.42-.35.99-.28 1.34.14.25.3.46.62.62.97.34-.23.71-.41 1.11-.53-.09-.41-.14-.83-.14-1.27 0-.44.05-.86.14-1.27-.4-.12-.77-.3-1.11-.53-.35.42-.92.49-1.34.14-.37-.3-.51-.79-.34-1.23.24-.65.58-1.25 1-1.78C5.53 2.85 6 2.77 6.45 2.77c.44 0 .89.08 1.31.23.15-.45.23-.92.23-1.4 0-.08 0-.16.01-.24C8.5 1.12 8.93.68 9.44.68c.51 0 .94.44 1.04.94.05.24.08.49.08.74 0 .48-.08.95-.23 1.4.45.15.92.23 1.4.23.48 0 .95-.08 1.4-.23.15-.45.23-.92.23-1.4 0-.25.03-.5.08-.74.1-.5.53-.94 1.04-.94.51 0 .94.44 1.04.94.05.24.08.49.08.74 0 .44-.05.86-.14 1.27.4.12.77.3 1.11.53.35-.42.92-.49 1.34-.14.37.3.51.79.34 1.23-.24.65-.58 1.25-1 1.78.42.45.64 1.01.64 1.62 0 .61-.22 1.17-.64 1.62-.42.45-.99.64-1.62.64-.63 0-1.2-.19-1.62-.64-.35-.42-.49-.96-.34-1.47.15-.45.23-.92.23-1.4 0-.48-.08-.95-.23-1.4.45-.15.92-.23 1.4-.23.48 0 .95.08 1.4.23.15.45.23.92.23 1.4 0 .61.22 1.17.64 1.62.42.45.99.64 1.62.64.63 0 1.2-.19 1.62-.64.42-.45.64-1.01.64-1.62.07-.61-.15-1.17-.57-1.62z"/>
              </svg>
            </button>
            <button className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
            </button>
          </div>

          {/* 注册链接 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            还没有账号？
            <button 
              onClick={() => navigate('/register')}
              className="text-primary-500 hover:underline ml-1"
            >
              立即注册
            </button>
          </div>
        </div>

        {/* 测试账号提示 */}
        <div className="mt-6 bg-white/60 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium mb-1">💡 测试账号</p>
          <p>用户名：<code className="bg-white px-2 py-0.5 rounded">testuser</code></p>
          <p>密码：<code className="bg-white px-2 py-0.5 rounded">Test123456</code></p>
        </div>
      </div>
    </div>
  );
}
