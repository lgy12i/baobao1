/**
 * 结算页面 · 霓虹深色主题
 *
 * 功能：
 *  - 收货地址选择
 *  - 商品清单确认
 *  - 优惠券选择
 *  - 配送方式选择
 *  - 支付方式选择
 *  - 订单金额明细
 *  - 地址管理弹窗
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { orderApi } from '@/services/order.api';
import { userApi, CreateAddressParams } from '@/services/user.api';
import toast from 'react-hot-toast';
import {
  MapPin, CreditCard, Truck, Check, ChevronRight, Plus, Minus,
  Ticket, Package, Clock, Zap, Shield, Gift, Sparkles, X, Edit2, Trash2
} from 'lucide-react';
import ProductImage from '@/components/ProductImage';

interface Coupon {
  id: string;
  name: string;
  discount: number;
  minAmount: number;
  desc: string;
  tag: string;
}

const MOCK_COUPONS: Coupon[] = [
  { id: 'c1', name: '满100减10', discount: 10, minAmount: 100, desc: '全场通用', tag: '新人专享' },
  { id: 'c2', name: '满300减50', discount: 50, minAmount: 300, desc: '限时优惠', tag: '热门' },
  { id: 'c3', name: '满500减100', discount: 100, minAmount: 500, desc: '大额优惠', tag: '满减' }
];

type DeliveryMethod = 'standard' | 'nextday' | 'sameday';

const DELIVERY_METHODS: { key: DeliveryMethod; name: string; desc: string; icon: any; fee: number; color: string }[] = [
  { key: 'standard', name: '普通配送', desc: '3-5天送达 · 免运费',  icon: Truck,   fee: 0,  color: 'from-emerald-500 to-neon-500' },
  { key: 'nextday',  name: '次日达',   desc: '次日送达 · +¥5',     icon: Clock,   fee: 5,  color: 'from-amber-500 to-flame-500' },
  { key: 'sameday',  name: '同城配送', desc: '当日送达 · +¥3',     icon: Zap,     fee: 3,  color: 'from-primary-500 to-purple-500' }
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, fetchCart, clearCart } = useCartStore();
  const { user, addAddress, updateAddress } = useAuthStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('alipay');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard');

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState<CreateAddressParams>({
    receiver: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false
  });

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const selectedItems = cart?.items.filter(item => item.selected) || [];
  const goodsTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedCoupon = MOCK_COUPONS.find(c => c.id === selectedCouponId);
  const couponDiscount = selectedCoupon && goodsTotal >= selectedCoupon.minAmount
    ? selectedCoupon.discount
    : 0;

  const deliveryInfo = DELIVERY_METHODS.find(d => d.key === deliveryMethod)!;
  const freight = goodsTotal >= 99 && deliveryMethod === 'standard'
    ? 0
    : deliveryInfo.fee;

  const payableAmount = Math.max(0, goodsTotal + freight - couponDiscount);

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
      navigate('/payment/' + result.orderId);
    } catch (error) {
      // 错误已在 API 层处理
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAddress = user?.addresses?.find(a => a._id === selectedAddressId);
  const availableCoupons = MOCK_COUPONS.filter(c => goodsTotal >= c.minAmount);

  // Address modal handlers
  const openAddressModal = (addr?: any) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        receiver: addr.receiver,
        phone: addr.phone,
        province: addr.province,
        city: addr.city,
        district: addr.district,
        detail: addr.detail,
        isDefault: addr.isDefault
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        receiver: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail: '',
        isDefault: false
      });
    }
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, addressForm);
      } else {
        await addAddress(addressForm);
      }
      closeAddressModal();
    } catch (error) {
      // 错误已在 store 层处理
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-neon flex items-center gap-2">
        <CreditCard className="text-primary-400" size={24} /> 确认订单
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 收货地址 */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="text-primary-400" size={20} />
                收货地址
              </h2>
              <button
                onClick={() => navigate('/user-center?tab=address')}
                className="text-xs text-neon-300 hover:text-neon-400 flex items-center gap-1"
              >
                管理地址 <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {(user?.addresses ?? []).map((addr) => (
                <div
                  key={addr._id}
                  className={"p-4 rounded-xl cursor-pointer transition-all border " + (
                    selectedAddressId === addr._id
                      ? 'border-neon-500/60 bg-neon-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  )}
                  onClick={() => setSelectedAddressId(addr._id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{addr.receiver}</span>
                        <span className="text-white/50 text-sm">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="badge-new">默认</span>
                        )}
                      </div>
                      <p className="mt-1 text-white/60 text-sm">
                        {addr.province} {addr.city} {addr.district} {addr.detail}
                      </p>
                    </div>
                    {selectedAddressId === addr._id && (
                      <div className="w-5 h-5 rounded-full bg-neon-gradient flex items-center justify-center shrink-0">
                        <Check className="text-white" size={14} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={() => openAddressModal()}
                className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/50 hover:border-neon-500/40 hover:text-neon-300 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                添加新地址
              </button>
            </div>
          </div>

          {/* 商品清单 */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="text-neon-400" size={20} />
              商品清单
              <span className="text-sm text-white/40 font-normal ml-1">
                共 {selectedItems.length} 件
              </span>
            </h2>
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div key={item._id} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    <ProductImage images={[item.image]} alt={item.name} square={true} cover={true} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm text-white/80 truncate">{item.name}</h3>
                    {item.specInfo?.length > 0 && (
                      <p className="mt-1 text-xs text-white/40">
                        {item.specInfo.map(s => s.name + ': ' + s.value).join(' / ')}
                      </p>
                    )}
                    <div className="mt-2 text-primary-400 font-bold">¥{item.price}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white/40 text-sm">x {item.quantity}</div>
                    <div className="font-bold text-white mt-2">¥{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 优惠券选择 */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Ticket className="text-flame-400" size={20} />
              优惠券
              {availableCoupons.length > 0 && (
                <span className="text-xs text-flame-400 font-normal ml-1">
                  可用 {availableCoupons.length} 张
                </span>
              )}
            </h2>

            {availableCoupons.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-sm">
                {goodsTotal < 100
                  ? '还差 ¥' + (100 - goodsTotal).toFixed(2) + ' 可使用优惠券'
                  : '暂无可用优惠券'}
              </div>
            ) : (
              <div className="space-y-2">
                {MOCK_COUPONS.map((coupon) => {
                  const isAvailable = goodsTotal >= coupon.minAmount;
                  const isSelected = selectedCouponId === coupon.id;
                  return (
                    <button
                      key={coupon.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedCouponId(isSelected ? '' : coupon.id)}
                      className={"w-full flex items-center gap-4 p-4 rounded-xl transition-all border text-left " + (
                        !isAvailable
                          ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'border-flame-500/60 bg-flame-500/10'
                          : 'border-white/10 hover:border-white/20 bg-white/5'
                      )}
                    >
                      <div className="w-16 h-16 rounded-lg bg-flame-gradient flex items-center justify-center text-white shrink-0">
                        <div className="text-center">
                          <div className="text-lg font-extrabold leading-none">¥{coupon.discount}</div>
                          <div className="text-[10px] opacity-80">满{coupon.minAmount}可用</div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {coupon.name}
                          <span className="badge-sale">{coupon.tag}</span>
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">{coupon.desc}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-flame-gradient flex items-center justify-center shrink-0">
                          <Check className="text-white" size={14} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 配送方式 */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="text-neon-400" size={20} />
              配送方式
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DELIVERY_METHODS.map((method) => (
                <button
                  key={method.key}
                  onClick={() => setDeliveryMethod(method.key)}
                  className={"p-4 rounded-xl border-2 transition-all text-left " + (
                    deliveryMethod === method.key
                      ? 'border-neon-500/60 bg-neon-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={"w-10 h-10 rounded-lg bg-gradient-to-br " + method.color + " flex items-center justify-center text-white"}>
                      <method.icon size={20} />
                    </div>
                    <span className="font-medium text-white">{method.name}</span>
                  </div>
                  <p className="text-xs text-white/50">{method.desc}</p>
                  {deliveryMethod === method.key && (
                    <div className="mt-2 text-xs text-neon-300 flex items-center gap-1">
                      <Check size={12} /> 已选择
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 支付方式 */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="text-primary-400" size={20} />
              支付方式
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'alipay', label: '支付宝', icon: '💙', color: 'from-blue-500 to-cyan-500' },
                { key: 'wechat', label: '微信', icon: '💚', color: 'from-green-500 to-emerald-500' },
                { key: 'card', label: '银行卡', icon: '💳', color: 'from-purple-500 to-pink-500' }
              ].map((method) => (
                <button
                  key={method.key}
                  className={"p-4 rounded-xl border-2 transition-all text-center " + (
                    paymentMethod === method.key
                      ? 'border-neon-500/60 bg-neon-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  )}
                  onClick={() => setPaymentMethod(method.key)}
                >
                  <div className={"w-12 h-12 mx-auto rounded-xl bg-gradient-to-br " + method.color + " flex items-center justify-center text-white shadow-lg mb-2"}>
                    <span className="text-xl">{method.icon}</span>
                  </div>
                  <div className="text-sm text-white">{method.label}</div>
                  {paymentMethod === method.key && (
                    <Check className="text-neon-400 mx-auto mt-1" size={14} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 订单备注 */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-white mb-4">订单备注</h2>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="选填，请输入您的备注信息"
              className="input-neon"
              rows={3}
              maxLength={200}
            />
          </div>
        </div>

        {/* 订单结算 */}
        <div className="lg:col-span-1">
          <div className="glass-card p-5 sticky top-32">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-neon-400" />
              订单金额
            </h2>

            {/* 金额明细 */}
            <div className="space-y-3 mb-4 p-4 rounded-xl bg-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">商品总价</span>
                <span className="text-white">¥{goodsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">
                  运费
                  {deliveryMethod !== 'standard' && (
                    <span className="text-white/30">（{deliveryInfo.name}）</span>
                  )}
                </span>
                <span className={freight === 0 ? 'text-emerald-400' : 'text-white'}>
                  {freight === 0 ? '免运费' : '¥' + freight.toFixed(2)}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">优惠券</span>
                  <span className="text-flame-400">-¥{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              {goodsTotal < 99 && deliveryMethod === 'standard' && (
                <div className="text-xs text-white/40 bg-white/5 p-2 rounded-lg">
                  满 99 元免运费，还差 ¥{(99 - goodsTotal).toFixed(2)}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-white/50">实付款</span>
                <span className="text-3xl font-bold text-primary-400 text-glow">
                  ¥{payableAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {selectedAddress && (
              <div className="bg-white/5 rounded-xl p-3 mb-4 text-sm">
                <div className="font-medium text-white mb-1">
                  {selectedAddress.receiver} {selectedAddress.phone}
                </div>
                <div className="text-white/50">
                  {selectedAddress.province} {selectedAddress.city} {selectedAddress.district}
                </div>
                <div className="text-white/50">{selectedAddress.detail}</div>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || selectedItems.length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all bg-neon-gradient hover:shadow-neon disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              {isSubmitting ? '提交中...' : '提交订单 ¥' + payableAmount.toFixed(2)}
            </button>

            <p className="mt-3 text-xs text-white/30 text-center flex items-center justify-center gap-1">
              <Shield size={12} />
              提交订单即表示同意
              <a href="#" className="text-neon-300 hover:underline">《交易服务协议》</a>
            </p>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <AddressModal
          editingAddress={editingAddress}
          addressForm={addressForm}
          setAddressForm={setAddressForm}
          onClose={closeAddressModal}
          onSubmit={handleAddressSubmit}
        />
      )}
    </div>
  );
}

/**
 * 地址管理弹窗组件
 */
interface AddressModalProps {
  editingAddress: any;
  addressForm: CreateAddressParams;
  setAddressForm: (form: CreateAddressParams) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function AddressModal({ editingAddress, addressForm, setAddressForm, onClose, onSubmit }: AddressModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="text-primary-400" size={20} />
            {editingAddress ? '编辑地址' : '添加新地址'}
          </h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {/* 收件人 */}
          <div>
            <label className="block text-sm text-white/70 mb-1">收件人</label>
            <input
              type="text"
              value={addressForm.receiver}
              onChange={(e) => setAddressForm({ ...addressForm, receiver: e.target.value })}
              placeholder="请输入收件人姓名"
              className="input-neon"
              required
            />
          </div>

          {/* 手机号 */}
          <div>
            <label className="block text-sm text-white/70 mb-1">手机号</label>
            <input
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              placeholder="请输入手机号"
              className="input-neon"
              required
              maxLength={11}
            />
          </div>

          {/* 省市区 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">省</label>
              <input
                type="text"
                value={addressForm.province}
                onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                placeholder="省"
                className="input-neon"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">市</label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                placeholder="市"
                className="input-neon"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">区</label>
              <input
                type="text"
                value={addressForm.district}
                onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                placeholder="区"
                className="input-neon"
                required
              />
            </div>
          </div>

          {/* 详细地址 */}
          <div>
            <label className="block text-sm text-white/70 mb-1">详细地址</label>
            <textarea
              value={addressForm.detail}
              onChange={(e) => setAddressForm({ ...addressForm, detail: e.target.value })}
              placeholder="请输入详细地址，如街道、门牌号等"
              className="input-neon"
              rows={3}
              required
            />
          </div>

          {/* 是否默认 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-neon-500 focus:ring-neon-500/50"
            />
            <label htmlFor="isDefault" className="text-sm text-white/70 cursor-pointer">
              设为默认地址
            </label>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/5 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-bold text-white transition-all bg-neon-gradient hover:shadow-neon"
            >
              {editingAddress ? '保存修改' : '确认添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
