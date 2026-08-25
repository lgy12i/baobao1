/**
 * 订单详情页
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { orderApi } from '@/services/order.api';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle,
  Truck,
  ChevronRight,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery(
    ['order', id],
    () => orderApi.getOrderDetail(id!)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment': return Clock;
      case 'pending_shipment': return Package;
      case 'pending_receipt': return Truck;
      case 'completed': return CheckCircle;
      default: return Package;
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending_payment: '等待付款',
      pending_shipment: '等待发货',
      pending_receipt: '等待收货',
      completed: '交易完成',
      cancelled: '订单已取消'
    };
    return map[status] || status;
  };

  const copyOrderNo = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNo);
      toast.success('订单号已复制');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">订单不存在</div>;
  }

  const StatusIcon = getStatusIcon(order.status);

  return (
    <div className="animate-fade-in">
      {/* 返回订单列表 */}
      <button
        onClick={() => navigate('/orders')}
        className="text-sm text-gray-500 hover:text-primary-500 mb-4 flex items-center gap-1"
      >
        ← 返回订单列表
      </button>

      {/* 订单状态卡片 */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <StatusIcon className="text-primary-500" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{getStatusText(order.status)}</h1>
            <p className="text-gray-500 mt-1">
              下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          <div className="ml-auto">
            {order.status === 'pending_payment' && (
              <button className="btn-primary text-lg px-8 py-3">
                立即付款 ¥{order.payableAmount}
              </button>
            )}
            {order.status === 'pending_receipt' && (
              <button className="btn-primary">确认收货</button>
            )}
          </div>
        </div>

        {/* 订单号 */}
        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-500">
          <span>订单号：{order.orderNo}</span>
          <button
            onClick={copyOrderNo}
            className="p-1 hover:text-primary-500"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* 订单时间线 */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">订单进度</h2>
        <div className="relative">
          {order.timeline.map((event, index) => (
            <div key={index} className="flex gap-4 pb-6 relative">
              {/* 时间线圆点 */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${index === order.timeline.length - 1 ? 'bg-primary-500 ring-4 ring-primary-100' : 'bg-gray-300'}`} />
                {index < order.timeline.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                )}
              </div>
              {/* 事件内容 */}
              <div className="flex-1 pb-4">
                <div className="font-medium">{event.description || getStatusText(event.status)}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(event.timestamp).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 收货地址 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="text-primary-500" />
              收货地址
            </h2>
            <div className="text-gray-700">
              <div className="font-medium">
                {order.shippingAddress.receiver} {order.shippingAddress.phone}
              </div>
              <div className="mt-1 text-gray-500">
                {order.shippingAddress.province} 
                {order.shippingAddress.city} 
                {order.shippingAddress.district} 
                {order.shippingAddress.detail}
              </div>
            </div>
          </div>

          {/* 商品清单 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">商品清单</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 py-3 border-b last:border-0">
                  <div className="w-20 h-20 bg-gray-100 rounded">
                    <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3>{item.productName}</h3>
                    {item.specInfo.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.specInfo.map(s => `${s.name}: ${s.value}`).join(' / ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm">¥{item.price}</div>
                    <div className="text-sm text-gray-500">x{item.quantity}</div>
                    <div className="font-medium">小计：¥{item.subtotal}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧订单信息 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 订单金额 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">订单金额</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">商品总价</span>
                <span>¥{order.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">运费</span>
                <span>{order.freightAmount === 0 ? '免运费' : `¥${order.freightAmount}`}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">优惠</span>
                  <span className="text-green-600">-¥{order.discountAmount}</span>
                </div>
              )}
              <div className="border-t pt-3 flex items-baseline justify-between">
                <span>实付款</span>
                <span className="text-2xl font-bold text-primary-500">¥{order.payableAmount}</span>
              </div>
            </div>
          </div>

          {/* 支付信息 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="text-primary-500" />
              支付信息
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">支付方式</span>
                <span>{order.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">支付状态</span>
                <span>{order.payment.status === 'success' ? '已支付' : '未支付'}</span>
              </div>
              {order.payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">支付时间</span>
                  <span>{new Date(order.payment.paidAt).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 买家留言 */}
          {order.remark && (
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">买家留言</h2>
              <p className="text-gray-600">{order.remark}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
