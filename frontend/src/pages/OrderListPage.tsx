/**
 * 订单列表页
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { orderApi, Order } from '@/services/order.api';
import toast from 'react-hot-toast';
import { Package, ChevronRight, Clock, CheckCircle, Truck, X } from 'lucide-react';

const statusTabs = [
  { key: '', label: '全部订单', icon: Package },
  { key: 'pending_payment', label: '待付款', icon: Clock },
  { key: 'pending_shipment', label: '待发货', icon: Package },
  { key: 'pending_receipt', label: '待收货', icon: Truck },
  { key: 'completed', label: '已完成', icon: CheckCircle },
  { key: 'cancelled', label: '已取消', icon: X }
];

export default function OrderListPage() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    ['orders', { status: activeStatus, page }],
    () => orderApi.getOrders({ status: activeStatus || undefined, page, limit: 10 })
  );

  const handlePay = async (orderId: string) => {
    try {
      await orderApi.payOrder(orderId);
      toast.success('支付成功');
      // 刷新订单列表
      window.location.reload();
    } catch (error) {
      // 错误已在 API 层处理
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('确定要取消这个订单吗？')) return;

    try {
      await orderApi.cancelOrder(orderId);
      toast.success('订单已取消');
      window.location.reload();
    } catch (error) {
      // 错误已在 API 层处理
    }
  };

  const handleReceive = async (orderId: string) => {
    if (!confirm('请确认已收到商品')) return;

    try {
      await orderApi.confirmReceive(orderId);
      toast.success('已确认收货');
      window.location.reload();
    } catch (error) {
      // 错误已在 API 层处理
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return { text: '待付款', color: 'text-red-500' };
      case 'pending_shipment':
        return { text: '待发货', color: 'text-orange-500' };
      case 'pending_receipt':
        return { text: '待收货', color: 'text-blue-500' };
      case 'completed':
        return { text: '已完成', color: 'text-green-500' };
      case 'cancelled':
        return { text: '已取消', color: 'text-gray-500' };
      default:
        return { text: status, color: 'text-gray-500' };
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      {/* 状态筛选 */}
      <div className="bg-white rounded-lg p-2 mb-6 flex overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveStatus(tab.key);
              setPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeStatus === tab.key
                ? 'bg-primary-50 text-primary-500 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.list.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无订单</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 btn-primary"
          >
            去购物
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.list.map((order: Order) => {
            const statusInfo = getStatusStyle(order.status);
            return (
              <div key={order._id} className="bg-white rounded-lg overflow-hidden">
                {/* 订单头 */}
                <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                    <span>订单号：{order.orderNo}</span>
                  </div>
                  <span className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>

                {/* 订单项 */}
                <div className="divide-y">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                        <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm line-clamp-1">{item.productName}</h3>
                        {item.specInfo.length > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.specInfo.map(s => `${s.name}: ${s.value}`).join(' / ')}
                          </p>
                        )}
                      </div>
                      <div className="text-sm">¥{item.price}</div>
                      <div className="text-sm text-gray-500">x{item.quantity}</div>
                    </div>
                  ))}
                </div>

                {/* 订单操作 */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    共 {order.items.length} 件商品 合计：
                    <span className="text-primary-500 font-bold ml-1">
                      ¥{order.payableAmount}
                    </span>
                    {order.freightAmount > 0 && (
                      <span className="ml-1">(含运费 ¥{order.freightAmount})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center gap-1"
                    >
                      订单详情 <ChevronRight size={14} />
                    </button>
                    
                    {/* 根据状态显示不同操作按钮 */}
                    {order.status === 'pending_payment' && (
                      <>
                        <button
                          onClick={() => handleCancel(order._id)}
                          className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                          取消订单
                        </button>
                        <button
                          onClick={() => handlePay(order._id)}
                          className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                        >
                          立即付款
                        </button>
                      </>
                    )}
                    
                    {order.status === 'pending_shipment' && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:border-red-500 hover:text-red-500 transition-colors"
                      >
                        申请退款
                      </button>
                    )}
                    
                    {order.status === 'pending_receipt' && (
                      <button
                        onClick={() => handleReceive(order._id)}
                        className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                      >
                        确认收货
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: data.pagination.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded transition-colors ${
                page === i + 1
                  ? 'bg-primary-500 text-white'
                  : 'border border-gray-300 hover:border-primary-500'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
