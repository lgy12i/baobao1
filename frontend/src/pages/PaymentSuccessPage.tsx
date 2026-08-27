/**
 * 支付成功页面 · 霓虹深色主题
 *
 * 功能：
 *  - 显示支付成功动画
 *  - 显示订单号和支付金额
 *  - 提供查看订单、继续购物按钮
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { orderApi } from '@/services/order.api';
import {
  CheckCircle2, Package, ShoppingBag, ArrowRight, Sparkles, Clock
} from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('orderId') || '';
  const [showCheck, setShowCheck] = useState(false);

  const { data: order } = useQuery(
    ['order-detail', orderId],
    () => orderApi.getOrderDetail(orderId),
    { enabled: !!orderId }
  );

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="glass-card p-8 md:p-10 w-full max-w-md text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-neon-gradient-soft opacity-60" />
        <div className="relative">
          {/* 成功动画 */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-neon-500 flex items-center justify-center shadow-lg transition-all duration-500 ${
                  showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}
                style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 211, 238, 0.3)' }}
              >
                <CheckCircle2 size={48} className="text-white" strokeWidth={3} />
              </div>
              {/* 光环动画 */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-emerald-400 transition-all duration-700 ${
                  showCheck ? 'scale-150 opacity-0' : 'scale-100 opacity-50'
                }`}
              />
              <div
                className={`absolute inset-0 rounded-full border border-neon-400 transition-all duration-1000 ${
                  showCheck ? 'scale-200 opacity-0' : 'scale-100 opacity-30'
                }`}
                style={{ transitionDelay: '0.2s' }}
              />
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles size={24} className="text-amber-400" />
            支付成功
            <Sparkles size={24} className="text-amber-400" />
          </h1>
          <p className="text-white/50 text-sm mb-6">感谢您的支持，订单已完成支付</p>

          {/* 金额和订单信息 */}
          <div className="bg-white/5 rounded-xl p-5 mb-6 space-y-3 text-left">
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">支付金额</span>
              <span className="text-2xl font-bold text-primary-400">
                ¥{order?.payableAmount?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/50">订单号</span>
              <span className="text-white/80 font-mono">{order?.orderNo || orderId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/50">支付时间</span>
              <span className="text-white/80 flex items-center gap-1">
                <Clock size={12} />
                {order?.payment?.paidAt
                  ? new Date(order.payment.paidAt).toLocaleString('zh-CN')
                  : new Date().toLocaleString('zh-CN')}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/50">商品数量</span>
              <span className="text-white/80">
                {order?.items.reduce((sum, i) => sum + i.quantity, 0) || 0} 件
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/orders/${orderId}`)}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-neon-gradient hover:shadow-neon transition-all flex items-center justify-center gap-2 group"
            >
              <Package size={18} />
              查看订单
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-xl font-medium text-white/80 border border-white/20 hover:border-neon-500/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              继续购物
            </button>
          </div>

          {/* 底部提示 */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/30">
            <Sparkles size={12} />
            更多优惠活动等着你
            <Sparkles size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
