/**
 * 购物车页面 · 霓虹潮流版
 *
 * 解决：
 *  - 与 MainLayout 深色主题不冲突（原 bg-white + text-gray 在深色背景下不可见）
 *  - 购物车商品图使用 ProductImage 多层 fallback（item.image 失效时不裂图）
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cart.store';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Check,
  Truck,
  Shield,
  Gift
} from 'lucide-react';
import ProductImage from '@/components/ProductImage';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, isLoading, fetchCart, updateItem, removeItem, selectAll, clearSelected } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = (itemId: string, currentQty: number, delta: number) => {
    const newQty = Math.max(1, Math.min(99, currentQty + delta));
    updateItem(itemId, { quantity: newQty });
  };

  const selectedItems = cart?.items.filter(item => item.selected) || [];
  const allSelected = cart?.items.length > 0 && selectedItems.length === cart?.items.length;

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    navigate('/checkout');
  };

  // ========== Loading ==========
  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-56 shimmer-bg rounded" />
        <div className="h-48 shimmer-bg rounded-2xl" />
        <div className="h-64 shimmer-bg rounded-2xl lg:hidden" />
      </div>
    );
  }

  // ========== Empty ==========
  if (!cart || cart.items.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card p-16 text-center">
          <div className="mx-auto w-28 h-28 rounded-full bg-neon-gradient-soft flex items-center justify-center mb-5 shadow-neon-soft">
            <ShoppingBag size={48} className="text-neon-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">购物车是空的</h2>
          <p className="text-white/50 mb-8">快去挑选心仪的好物吧，现在加购还能享新人立减 20 元～</p>
          <button onClick={() => navigate('/products')} className="btn-neon">
            去购物 <ArrowRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { icon: Truck, title: '极速物流', desc: '24h 发货' },
            { icon: Shield, title: '正品保障', desc: '假一赔十' },
            { icon: Gift, title: '新人福利', desc: '首单立减 20' }
          ].map((s) => (
            <div key={s.title} className="glass rounded-2xl p-5 flex flex-col items-center text-center">
              <s.icon size={24} className="text-neon-300 mb-2" />
              <div className="text-white/80 font-medium">{s.title}</div>
              <div className="text-white/40 text-sm mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ========== Normal ==========
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          我的购物车 <span className="ml-2 text-sm font-normal text-white/40">共 {cart.items.length} 件</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 商品列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 全选栏 */}
          <div className="glass-card p-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-white/80">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="w-5 h-5 rounded accent-neon-500"
              />
              <span>全选</span>
            </label>
            <button
              onClick={() => clearSelected()}
              disabled={selectedItems.length === 0}
              className="text-sm text-white/50 hover:text-flame-400 disabled:opacity-40 transition"
            >
              删除选中
            </button>
          </div>

          {/* 购物车项 */}
          {cart.items.map((item) => (
            <div key={item._id} className="glass-card p-4">
              <div className="flex gap-4">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => updateItem(item._id, { selected: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded accent-neon-500 shrink-0"
                />

                <div
                  className="w-24 h-24 shrink-0 rounded-xl overflow-hidden cursor-pointer hover:shadow-neon-soft transition"
                  onClick={() => navigate(`/products/${item.productId}`)}
                >
                  <ProductImage
                    images={item.image ? [item.image] : []}
                    alt={item.name}
                    square
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <h3
                    className="text-sm text-white/80 line-clamp-2 cursor-pointer hover:text-neon-300 transition"
                    onClick={() => navigate(`/products/${item.productId}`)}
                  >
                    {item.name}
                  </h3>
                  {item.specInfo?.length > 0 && (
                    <div className="mt-1 text-xs text-white/40">
                      {item.specInfo.map((s: any) => `${s.name}: ${s.value}`).join(' / ')}
                    </div>
                  )}
                  {item.stockStatus === 'off' && (
                    <div className="mt-1 text-xs text-flame-400">商品已下架</div>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div>
                      <div className="text-primary-400 font-bold text-lg">¥{item.price}</div>
                      <div className="text-[10px] text-white/30 line-through">¥{Math.round(item.price * 1.2)}</div>
                    </div>
                    <div className="flex items-center border border-white/10 rounded-xl overflow-hidden">
                      <button
                        className="p-1.5 text-white/70 hover:bg-white/5 transition"
                        onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-white">{item.quantity}</span>
                      <button
                        className="p-1.5 text-white/70 hover:bg-white/5 transition"
                        onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item._id)}
                  className="text-white/30 hover:text-flame-400 transition self-start shrink-0 p-1"
                  title="移除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 结算栏 */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-32 space-y-5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Check size={20} className="text-neon-300" /> 订单结算
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">已选商品</span>
                <span className="text-white/80">{selectedItems.length} 件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">商品合计</span>
                <span className="text-white/80">¥{cart.selectedTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">运费</span>
                <span className="text-emerald-400 flex items-center gap-1"><Truck size={12} /> 免运费</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-flame-400 text-xs">🎁 新人立减 20</span>
                <span className="text-flame-400">- ¥20</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex items-baseline justify-between">
              <span className="text-white/60">实付合计</span>
              <span className="text-3xl font-extrabold text-neon-gradient bg-clip-text text-transparent text-glow">
                ¥{Math.max(0, Number(cart.selectedTotal) - 20)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="w-full py-3.5 btn-neon disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={20} />
              去结算
              <ArrowRight size={18} />
            </button>

            <div className="flex items-center justify-around text-[11px] text-white/40 pt-1">
              <span className="flex items-center gap-1"><Truck size={12} /> 极速发货</span>
              <span className="flex items-center gap-1"><Shield size={12} /> 正品</span>
              <span className="flex items-center gap-1"><Gift size={12} /> 7 天无忧</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
