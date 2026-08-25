/**
 * 注册页面
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(form.password);
  const passwordsMatch = form.password === form.confirmPassword && form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast.error('请先同意用户协议');
      return;
    }

    if (!passwordsMatch) {
      toast.error('两次输入的密码不一致');
      return;
    }

    try {
      await register(form.username, form.email, form.password, form.confirmPassword);
      toast.success('注册成功！');
      navigate('/');
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
              <p className="text-sm text-gray-500">注册账号，开启购物之旅</p>
            </div>
          </div>
        </div>

        {/* 注册表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold mb-6 text-center">创建账号</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">用户名</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="3-20位字母、数字或下划线"
                className="input-field"
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="input-field"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="至少6位，包含字母和数字"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* 密码强度指示 */}
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          passwordStrength >= level
                            ? passwordStrength <= 2
                              ? 'bg-red-400'
                              : passwordStrength <= 3
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {passwordStrength <= 2 ? '弱' : passwordStrength <= 3 ? '中' : '强'}
                  </span>
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">确认密码</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="再次输入密码"
                className={`input-field ${
                  form.confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                }`}
              />
              {form.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">两次输入的密码不一致</p>
              )}
            </div>

            {/* 协议同意 */}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded accent-primary-500"
              />
              <span className="text-gray-600">
                我已阅读并同意
                <a href="#" className="text-primary-500 hover:underline">《用户协议》</a>
                和
                <a href="#" className="text-primary-500 hover:underline">《隐私政策》</a>
              </span>
            </label>

            {/* 注册按钮 */}
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                '注册中...'
              ) : (
                <>
                  <Check size={20} />
                  立即注册
                </>
              )}
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            已有账号？
            <button 
              onClick={() => navigate('/login')}
              className="text-primary-500 hover:underline ml-1"
            >
              立即登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
