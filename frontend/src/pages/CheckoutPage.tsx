/**
 * 结算页面
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { orderApi } from '@/services/order.api';
import toast from 'react-hot-toast';
import { MapPin, CreditCard, Truck, Check, ChevronRight, Plus, Minus } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, fetchCart, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('alipay');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const selectedItems = cart?.items.filter(item => item.selected) || [];
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freight = totalAmount >= 99 ? 0 : 10;
  const payableAmount = totalAmount + freight;

  // 获取默认地址
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = user.addresses.find(a => a.isDefault);
      setSelectedAddressId(defaultAddr?._id || user.addresses[0]._id);
    }
  }, [user?.addresses]);

  const handleSubmitOrder = async () => {
    if (!selectedAddressId) {
      toast.error('请选择收货地址');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('请选择商品');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await orderApi.createOrder({
        items: selectedItems.map(item => ({
          productId: item.productId,
          skuCode: item.skuCode,
          quantity: item.quantity
        })),
        addressId: selectedAddressId,
        paymentMethod,
        remark
      });

      toast.success('下单成功');
      clearCart();
      
      // 跳转到订单详情
      navigate(`/orders/${result.orderId}`);
    } catch (error) {
      // 错误已在 API 层处理
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAddress = user?.addresses?.find(a => a._id === selectedAddressId);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">确认订单</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 收货地址 */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="text-primary-500" size={20} />
                收货地址
              </h2>
              <button className="text-sm text-primary-500 hover:underline">
                管理地址
              </button>
            </div>

            <div className="space-y-3">
              {user?.addresses?.map((addr) => (
                <div
                  key={addr._id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAddressId === addr._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAddressId(addr._id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{addr.receiver}</span>
                        <span className="text-gray-500">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
                            默认
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-gray-600">
                        {addr.province} {addr.city} {addr.district} {addr.detail}
                      </p>
                    </div>
                    {selectedAddressId === addr._id && (
                      <Check className="text-primary-500" size={20} />
                    )}
                  </div>
                </div>
              ))}

              {/* 添加新地址按钮 */}
              <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} />
                添加新地址
              </button>
            </div>
          </div>

          {/* 商品清单 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">商品清单</h2>
            <div className="space-y-4">
              {selectedItems.map((item) => (
                <div key={item._id} className="flex gap-4 py-3 border-b last:border-0">
                  <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm">{item.name}</h3>
                    {item.specInfo.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.specInfo.map(s => `${s.name}: ${s.value}`).join(' / ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-primary-500">¥{item.price}</div>
                    <div className="text-sm text-gray-500">x{item.quantity}</div>
                  </div>
                  <div className="text-right pl-4">
                    <div className="font-medium">¥{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 支付方式 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="text-primary-500" size={20} />
              支付方式
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'alipay', label: '支付宝', icon: '💙' },
                { key: 'wechat', label: '微信', icon: '💚' },
                { key: 'card', label: '银行卡', icon: '💳' }
              ].map((method) => (
                <button
                  key={method.key}
                  className={`p-4 border-2 rounded-lg transition-all text-center ${
                    paymentMethod === method.key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod(method.key)}
                >
                  <div className="text-2xl mb-1">{method.icon}</div>
                  <div className="text-sm">{method.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 订单备注 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">订单备注</h2>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="选填，请输入您的备注信息"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              maxLength={200}
            />
          </div>
        </div>

        {/* 订单结算 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 sticky top-32">
            <h2 className="text-lg font-semibold mb-4">订单金额</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">商品总价</span>
                <span>¥{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">运费</span>
                <span className={freight === 0 ? 'text-green-600' : ''}>
                  {freight === 0 ? '免运费' : `¥${freight}`}
                </span>
              </div>
              {freight > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  满99元包邮，还差 ¥{(99 - totalAmount).toFixed(2)}
                </div>
              )}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-500">实付款</span>
                <span className="text-2xl font-bold text-primary-500">
                  ¥{payableAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 收货地址摘要 */}
            {selectedAddress && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="font-medium mb-1">
                  {selectedAddress.receiver} {selectedAddress.phone}
                </div>
                <div className="text-gray-600">
                  {selectedAddress.province} {selectedAddress.city} {selectedAddress.district}
                </div>
                <div className="text-gray-600">{selectedAddress.detail}</div>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || selectedItems.length === 0}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Truck size={20} />
              {isSubmitting ? '提交中...' : `提交订单 ¥${payableAmount.toFixed(2)}`}
            </button>

            <p className="mt-3 text-xs text-gray-400 text-center">
              提交订单即表示同意
              <a href="#" className="text-primary-500 hover:underline">《交易服务协议》</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
