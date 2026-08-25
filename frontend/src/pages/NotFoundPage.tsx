/**
 * 404 页面
 */
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center px-4">
        {/* 404 动画 */}
        <div className="relative mb-8">
          <span className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse">
            404
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">页面不存在</h1>
        <p className="text-gray-500 mb-8">抱歉，您访问的页面已丢失或不存在</p>
        
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-outline flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            返回上一页
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex items-center gap-2"
          >
            <Home size={18} />
            返回首页
          </button>
        </div>

        {/* 可爱的装饰 */}
        <div className="mt-12 flex items-center justify-center gap-4 text-4xl">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🛒</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>📦</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🎁</span>
        </div>
      </div>
    </div>
  );
}
