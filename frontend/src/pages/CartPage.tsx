/**
 * 购物车页面
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
  Check
} from 'lucide-react';

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
    if (selectedItems.length === 0) {
      return;
    }
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-medium text-gray-700 mb-2">购物车是空的</h2>
        <p className="text-gray-500 mb-6">快去挑选心仪的商品吧！</p>
        <button onClick={() => navigate('/')} className="btn-primary">去购物</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">我的购物车</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 商品列表 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 全选栏 */}
          <div className="bg-white rounded-lg p-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => selectAll(e.target.checked)}
                className="w-5 h-5 rounded accent-primary-500"
              />
              <span>全选</span>
            </label>
            <button
              onClick={() => clearSelected()}
              className="text-sm text-gray-500 hover:text-primary-500"
            >
              删除选中
            </button>
          </div>

          {/* 购物车项 */}
          {cart.items.map((item) => (
            <div key={item._id} className="bg-white rounded-lg p-4">
              <div className="flex gap-4">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => updateItem(item._id, { selected: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded accent-primary-500"
                />
                
                <div
                  className="w-20 h-20 bg-gray-100 rounded cursor-pointer flex-shrink-0"
                  onClick={() => navigate(`/products/${item.productId}`)}
                >
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm text-gray-800 line-clamp-2 cursor-pointer hover:text-primary-500"
                    onClick={() => navigate(`/products/${item.productId}`)}
                  >
                    {item.name}
                  </h3>
                  {item.specInfo.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {item.specInfo.map(s => `${s.name}: ${s.value}`).join(' / ')}
                    </div>
                  )}
                  {item.stockStatus === 'off' && (
                    <div className="mt-1 text-xs text-red-500">商品已下架</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-primary-500 font-bold">¥{item.price}</div>
                  <div className="text-xs text-gray-400 line-through">¥{(item.price * 1.2).toFixed(0)}</div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item._id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      className="p-1 hover:bg-gray-100"
                      onClick={() => handleUpdateQuantity(item._id, item.quantity, -1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center">{item.quantity}</span>
                    <button
                      className="p-1 hover:bg-gray-100"
                      onClick={() => handleUpdateQuantity(item._id, item.quantity, 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 结算栏 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 sticky top-32">
            <h3 className="text-lg font-semibold mb-4">订单结算</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">已选商品</span>
                <span>{selectedItems.length} 件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品合计</span>
                <span>¥{cart.selectedTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">运费</span>
                <span className="text-green-600">免运费</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-500">合计</span>
                <span className="text-2xl font-bold text-primary-500">
                  ¥{cart.selectedTotal}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={20} />
              去结算
              <ArrowRight size={18} />
            </button>

            <p className="mt-3 text-xs text-gray-400 text-center">
              支持 7 天无理由退换 · 正品保障
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
