/**
 * 订单数据模型
 * 
 * 核心业务流程：
 * 待支付 → 待发货 → 待收货 → 已完成
 *   ↓(取消)
 * 已取消
 * 
 * 字段说明：
 * - orderNo: 订单号（业务生成，不使用 MongoDB _id）
 * - items: 订单商品快照（下单时的商品信息）
 * - address: 收货地址快照
 * - payment: 支付信息
 * - timeline: 订单状态变更时间线
 * 
 * 面试亮点：
 * - 订单号生成算法（时间戳 + 随机数 + 用户ID）
 * - 库存扣减的原子性保证（事务或乐观锁）
 * - 订单超时自动取消（Redis + 定时任务）
 * - 幂等性设计（防止重复提交）
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// 订单项（商品快照）
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  skuCode: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  specInfo: [{
    name: String,
    value: String
  }],
  // 下单时的价格快照
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  // 小计金额
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  _id: false
});

// 订单时间线
const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  operator: {
    type: String,
    default: 'system'
  }
}, {
  _id: false
});

const orderSchema = new mongoose.Schema({
  // 订单号（业务唯一标识）
  orderNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // 用户信息
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 订单项
  items: [orderItemSchema],
  // 金额信息
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  freightAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  payableAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // 收货地址快照
  shippingAddress: {
    receiver: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    detail: { type: String, required: true }
  },
  // 支付信息
  payment: {
    method: {
      type: String,
      enum: ['alipay', 'wechat', 'card', 'balance'],
      default: 'alipay'
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refund'],
      default: 'pending'
    },
    transactionId: {
      type: String
    },
    paidAt: {
      type: Date
    }
  },
  // 配送信息
  shipping: {
    carrier: { type: String },
    trackingNo: { type: String },
    shippedAt: { type: Date }
  },
  // 订单状态
  status: {
    type: String,
    enum: [
      'pending_payment',  // 待支付
      'pending_shipment', // 待发货
      'pending_receipt',  // 待收货
      'completed',        // 已完成
      'cancelled',        // 已取消
      'refunding',        // 退款中
      'refunded'          // 已退款
    ],
    default: 'pending_payment',
    index: true
  },
  // 买家备注
  remark: {
    type: String,
    maxlength: 200
  },
  // 订单时间线
  timeline: [timelineEventSchema],
  // 超时时间（用于自动取消）
  expireAt: {
    type: Date,
    index: true
  },
  // 幂等键（防止重复提交）
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建 TTL 索引实现订单超时自动取消
orderSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// 创建复合索引优化查询
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, status: 1 });

/**
 * 生成订单号
 * 格式: TD + 年月日时分秒毫秒 + 4位随机数
 * 示例: TD202608251430251234
 */
orderSchema.statics.generateOrderNo = function() {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0') +
    String(now.getMilliseconds()).padStart(3, '0');
  
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TD${timestamp}${random}`;
};

/**
 * 订单状态流转
 */
orderSchema.methods.transitionTo = async function(newStatus, description = '') {
  const validTransitions = {
    pending_payment: ['pending_shipment', 'cancelled'],
    pending_shipment: ['pending_receipt', 'cancelled'],
    pending_receipt: ['completed', 'cancelled'],
    completed: ['refunding'],
    refunding: ['refunded']
  };
  
  const allowed = validTransitions[this.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`无效的状态流转: ${this.status} -> ${newStatus}`);
  }
  
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    description,
    timestamp: new Date()
  });
  
  // 设置过期时间
  if (newStatus === 'pending_payment') {
    this.expireAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
  }
  
  return this.save();
};

/**
 * 添加时间线事件
 */
orderSchema.methods.addTimelineEvent = function(status, description) {
  this.timeline.push({
    status,
    description,
    timestamp: new Date()
  });
};

/**
 * 获取订单统计
 */
orderSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalAmount: { $sum: '$payableAmount' }
    }}
  ]);
  
  return stats.reduce((acc, curr) => {
    acc[curr._id] = { count: curr.count, totalAmount: curr.totalAmount };
    return acc;
  }, {});
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
