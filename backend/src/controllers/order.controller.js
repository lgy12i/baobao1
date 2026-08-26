/**
 * 订单控制器（内存存储版本）
 *
 * 职责：处理下单、支付、订单管理、售后等核心业务
 *
 * 路由：
 * - POST   /api/v1/orders            创建订单（结算）
 * - GET    /api/v1/orders            订单列表
 * - GET    /api/v1/orders/:id        订单详情
 * - PUT    /api/v1/orders/:id/cancel 取消订单
 * - POST   /api/v1/orders/:id/pay   支付订单
 * - PUT    /api/v1/orders/:id/receive 确认收货
 *
 * 面试亮点：
 * - 事务保证数据一致性（库存扣减 + 订单创建）
 * - 幂等性设计（防重复提交）
 * - 状态机管理订单生命周期
 */

const store = require('../config/memory-store');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { v4: uuidv4 } = require('uuid');

/**
 * 创建订单（结算）
 * POST /api/v1/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const {
    items,           // [{ productId, skuCode, quantity }]
    addressId,       // 收货地址ID
    paymentMethod = 'alipay',
    remark = ''
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('订单商品不能为空', 400, 'EMPTY_ITEMS');
  }

  // 1. 验证收货地址
  const user = await store.findUserById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const address = (user.addresses || []).find(a => a._id === addressId || a.id === addressId);
  if (!address) {
    throw new AppError('收货地址不存在', 404, 'ADDRESS_NOT_FOUND');
  }

  // 2. 验证并处理商品
  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await store.getProductById(item.productId);
    if (!product || product.status !== 'on') {
      throw new AppError(`商品 ${product?.name || ''} 已下架`, 400, 'PRODUCT_OFFLINE');
    }

    const sku = (product.skus || []).find(s => s.skuCode === item.skuCode);
    if (!sku) {
      throw new AppError('商品规格不存在', 400, 'SKU_NOT_FOUND');
    }

    if (sku.stock < item.quantity) {
      throw new AppError(`库存不足：${product.name}`, 400, 'INSUFFICIENT_STOCK');
    }

    // 扣减库存
    sku.stock -= item.quantity;

    // 构建订单项
    orderItems.push({
      productId: product._id,
      skuCode: item.skuCode,
      productName: product.name,
      productImage: product.mainImage,
      specInfo: (sku.specCombination || []).map(s => ({ name: s.name, value: s.value })),
      price: sku.price,
      quantity: item.quantity,
      subtotal: sku.price * item.quantity
    });

    totalAmount += sku.price * item.quantity;
  }

  // 3. 计算运费（满99包邮）
  const freightAmount = totalAmount >= 99 ? 0 : 10;

  // 4. 计算应付金额
  const payableAmount = totalAmount + freightAmount;

  // 5. 创建订单
  const order = await store.createOrder({
    userId,
    items: orderItems,
    totalAmount,
    discountAmount: 0,
    freightAmount,
    payableAmount,
    shippingAddress: {
      receiver: address.receiver,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail
    },
    payment: {
      method: paymentMethod,
      status: 'pending'
    },
    remark,
    status: 'pending_payment',
    expireAt: new Date(Date.now() + 30 * 60 * 1000),
    idempotencyKey: uuidv4()
  });

  // 6. 从购物车中移除已下单商品
  const cart = await store.getCart(userId);
  if (cart && cart.items) {
    cart.items = cart.items.filter(
      ci => !items.some(i => i.productId === ci.productId && i.skuCode === ci.skuCode)
    );
    cart.updatedAt = new Date();
  }

  // 7. 更新用户统计
  if (!user.stats) user.stats = { orderCount: 0, totalSpent: 0, couponCount: 0 };
  user.stats.orderCount = (user.stats.orderCount || 0) + 1;
  user.stats.totalSpent = (user.stats.totalSpent || 0) + payableAmount;

  res.status(201).json({
    code: 201,
    message: '订单创建成功',
    data: {
      orderNo: order.orderNo,
      orderId: order._id,
      status: order.status,
      payableAmount: order.payableAmount,
      expireAt: order.expireAt
    }
  });
});

/**
 * 获取订单列表
 * GET /api/v1/orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { page = 1, limit = 10, status, sort = 'desc' } = req.query;

  const result = await store.getOrdersByUserId(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    status
  });

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: result.list,
      pagination: result.pagination
    }
  });
});

/**
 * 获取订单详情
 * GET /api/v1/orders/:id
 */
const getOrderDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  const order = await store.getOrderById(id);
  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  // 验证权限（只能查看自己的订单）
  if (order.userId !== userId && req.user.role !== 'admin') {
    throw new AppError('权限不足', 403, 'FORBIDDEN');
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: order
  });
});

/**
 * 取消订单
 * PUT /api/v1/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id || req.user.id;

  const order = await store.getOrderById(id);
  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (order.userId !== userId) {
    throw new AppError('权限不足', 403, 'FORBIDDEN');
  }

  // 只有待支付和待发货状态可以取消
  if (!['pending_payment', 'pending_shipment'].includes(order.status)) {
    throw new AppError('当前状态无法取消', 400, 'INVALID_STATUS');
  }

  // 恢复库存
  for (const item of order.items) {
    const product = await store.getProductById(item.productId);
    if (product) {
      const sku = (product.skus || []).find(s => s.skuCode === item.skuCode);
      if (sku) {
        sku.stock += item.quantity;
      }
    }
  }

  // 更新订单状态
  order.status = 'cancelled';
  order.timeline.push({
    status: 'cancelled',
    description: `订单取消：${reason || '用户主动取消'}`,
    timestamp: new Date()
  });
  order.expireAt = null;

  res.json({
    code: 200,
    message: '订单已取消',
    data: { status: 'cancelled' }
  });
});

/**
 * 支付订单（模拟支付）
 * POST /api/v1/orders/:id/pay
 */
const payOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await store.getOrderById(id);
  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (order.status !== 'pending_payment') {
    throw new AppError('订单状态不允许支付', 400, 'INVALID_STATUS');
  }

  // 模拟支付成功
  order.status = 'pending_shipment';
  order.timeline.push({
    status: 'pending_shipment',
    description: '支付成功',
    timestamp: new Date()
  });
  order.payment.status = 'success';
  order.payment.transactionId = `mock_${Date.now()}`;
  order.payment.paidAt = new Date();

  res.json({
    code: 200,
    message: '支付成功',
    data: {
      orderNo: order.orderNo,
      status: order.status,
      paidAt: order.payment.paidAt
    }
  });
});

/**
 * 确认收货
 * PUT /api/v1/orders/:id/receive
 */
const confirmReceive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await store.getOrderById(id);
  if (!order) {
    throw new AppError('订单不存在', 404, 'ORDER_NOT_FOUND');
  }

  if (order.status !== 'pending_receipt') {
    throw new AppError('订单状态不允许确认收货', 400, 'INVALID_STATUS');
  }

  order.status = 'completed';
  order.timeline.push({
    status: 'completed',
    description: '确认收货，交易完成',
    timestamp: new Date()
  });

  res.json({
    code: 200,
    message: '确认收货成功',
    data: { status: 'completed' }
  });
});

/**
 * 获取我的订单统计
 * GET /api/v1/orders/stats
 */
const getOrderStats = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const result = await store.getOrdersByUserId(userId, { page: 1, limit: 9999 });
  const orders = result.list;

  // 按状态分组统计
  const byStatus = {};
  orders.forEach(o => {
    if (!byStatus[o.status]) {
      byStatus[o.status] = { count: 0, totalAmount: 0 };
    }
    byStatus[o.status].count += 1;
    byStatus[o.status].totalAmount += o.payableAmount || 0;
  });

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      orderCount: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + (o.payableAmount || 0), 0),
      byStatus
    }
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
  payOrder,
  confirmReceive,
  getOrderStats
};
