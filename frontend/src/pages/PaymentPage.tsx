/**
 * 支付页面 · 霓虹深色主题
 *
 * 功能：
 *  - 显示订单金额、支付倒计时
 *  - 支持多种支付方式选择（支付宝、微信支付、银行卡、花呗分期）
 *  - 模拟支付过程（显示支付处理中状态）
 *  - 支付成功后显示成功页面
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { orderApi } from '@/services/order.api';
import toast from 'react-hot-toast';
import {
  CreditCard, Smartphone, Landmark, Sparkles, Clock,
  CheckCircle2, Loader2, ChevronRight, Shield, Zap, ArrowLeft,
  
} from 'lucide-react';

type PaymentMethod = 'alipay' | 'wechat' | 'bank' | 'huabei';

const PAYMENT_METHODS: {
  key: PaymentMethod;
  label: string;
  desc: string;
  icon: any;
  color: string;
}[] = [
  { key: 'alipay',  label: '支付宝',  desc: '推荐使用 · 花呗可分期', icon: Smartphone,  color: 'from-blue-500 to-cyan-500' },
  { key: 'wechat',  label: '微信支付', desc: '即时到账 · 安全可靠',   icon: Smartphone,  color: 'from-green-500 to-emerald-500' },
  { key: 'bank',    label: '银行卡',   desc: '支持主流银行卡',       icon: Landmark,    color: 'from-purple-500 to-pink-500' },
  { key: 'huabei',  label: '花呗分期', desc: '3/6/12 期可选',        icon: Sparkles,    color: 'from-amber-500 to-flame-500' }
];

function PaymentCountdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remain, setRemain] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => {
      setRemain((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onExpire]);
  const m = Math.floor(remain / 60);
  const s = remain % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = remain <= 60;
  return (
    <div className={`flex items-center gap-2 font-mono ${isUrgent ? 'text-flame-400 animate-pulse' : 'text-neon-300'}`}>
      <Clock size={16} />
      <span>{pad(m)}:{pad(s)}</span>
    </div>
  );
}

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('alipay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdownSec] = useState(15 * 60);

  const { data: order, isLoading } = useQuery(
    ['order', orderId],
    () => orderApi.getOrderDetail(orderId!),
    { enabled: !!orderId }
  );

  const handleExpire = () => {
    toast.error('支付超时，订单已取消');
    navigate(`/orders/${orderId}`);
  };

  const handlePay = async () => {
    if (!orderId) return;
    setIsProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 2000));
      await orderApi.payOrder(orderId);
      toast.success('支付成功！');
      navigate(`/payment/success?orderId=${orderId}`);
    } catch (e) {
      toast.error('支付失败，请重试');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-400" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-white/60">订单不存在</p>
        <button onClick={() => navigate('/orders')} className="btn-neon">返回订单列表</button>
      </div>
    );
  }

  const payableAmount = order.payableAmount;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="glass p-2 rounded-lg hover:border-neon-500/40 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-neon">订单支付</h1>
      </div>

      {/* 金额展示卡片 */}
      <div className="glass-card p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-neon-gradient-soft opacity-50" />
        <div className="relative">
          <p className="text-white/50 text-sm mb-2">应付金额</p>
          <div className="text-5xl font-extrabold text-glow" style={{ color: '#ff2b81' }}>
            ¥{payableAmount.toFixed(2)}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/50">
            <span>订单号：{order.orderNo}</span>
            <span className="flex items-center gap-1">
              <Shield size={14} className="text-emerald-400" /> 安全支付
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <PaymentCountdown seconds={countdownSec} onExpire={handleExpire} />
          </div>
          <p className="text-xs text-white/40 mt-1">超时后订单将自动取消</p>
        </div>
      </div>

      {/* 商品概览 */}
      <div className="glass-card p-5">
        <h3 className="text-sm text-white/50 mb-3">订单商品</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item._id} className="flex justify-between items-center text-sm">
              <span className="text-white/70 truncate flex-1">{item.productName}</span>
              <span className="text-white/40 mx-2">× {item.quantity}</span>
              <span className="text-white font-medium">¥{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 mt-3 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-white/50">
            <span>商品总额</span>
            <span>¥{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>运费</span>
            <span>{order.freightAmount === 0 ? '免运费' : `¥${order.freightAmount.toFixed(2)}`}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>优惠</span>
              <span>-¥{order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white pt-1">
            <span>实付金额</span>
            <span className="text-primary-400 text-lg">¥{payableAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 支付方式选择 */}
      <div className="glass-card p-5">
        <h3 className="text-sm text-white/50 mb-4">选择支付方式</h3>
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.key}
              onClick={() => setPaymentMethod(method.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === method.key
                  ? 'border-neon-500/60 bg-neon-500/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                <method.icon size={24} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-white flex items-center gap-2">
                  {method.label}
                  {paymentMethod === method.key && (
                    <CheckCircle2 size={16} className="text-neon-400" />
                  )}
                </div>
                <div className="text-xs text-white/50 mt-0.5">{method.desc}</div>
              </div>
              {paymentMethod === method.key && (
                <div className="w-5 h-5 rounded-full bg-neon-gradient flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 支付按钮 */}
      <button
        onClick={handlePay}
        disabled={isProcessing}
        className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-neon-gradient opacity-100 group-hover:opacity-90 transition" />
        <div className="absolute inset-0 bg-neon-gradient opacity-0 group-hover:opacity-100 blur-xl transition" style={{ zIndex: -1 }} />
        <span className="relative flex items-center justify-center gap-2">
          {isProcessing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              支付处理中...
            </>
          ) : (
            <>
              <Zap size={20} />
              立即支付 ¥{payableAmount.toFixed(2)}
            </>
          )}
        </span>
      </button>

      {/* 安全提示 */}
      <div className="flex items-center justify-center gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1">
          <Shield size={12} /> 银联加密
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} /> 资金安全保障
        </span>
        <span className="flex items-center gap-1">
          <CreditCard size={12} /> 全程可追溯
        </span>
      </div>

      {/* 支付处理中遮罩 */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-8 text-center max-w-xs">
            <Loader2 className="animate-spin text-neon-400 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-white mb-2">正在处理支付...</h3>
            <p className="text-sm text-white/50">请在新窗口完成支付，勿关闭此页面</p>
            <div className="mt-4 flex justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neon-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


