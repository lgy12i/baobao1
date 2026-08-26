/**
 * 购物车数据模型
 * 
 * 设计特点：
 * - 每个用户只有一个购物车文档（嵌入购物车项）
 * - 支持游客购物（session 存储）
 * - 实时计算总价（虚拟字段）
 * 
 * 面试亮点：
 * - 使用 Redis 存储活跃购物车（高性能读写）
 * - MongoDB 持久化存储（数据安全）
 * - 多级缓存策略
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  skuCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 99
  },
  selected: {
    type: Boolean,
    default: true
  },
  specInfo: [{
    name: String,
    value: String
  }],
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: true  // 为每个购物车项生成独立 ID
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    index: true
  },
  items: [cartItemSchema],
  // 最后同步时间
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * 虚拟字段：购物车商品总数
 */
cartSchema.virtual('totalCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * 虚拟字段：已选商品总数
 */
cartSchema.virtual('selectedCount').get(function() {
  return this.items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * 虚拟字段：已选商品总金额
 */
cartSchema.virtual('selectedTotal').get(function() {
  return this.items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);
});

/**
 * 添加商品到购物车
 * 如果商品已存在相同 SKU，则增加数量
 */
cartSchema.methods.addItem = async function(productData) {
  const { productId, skuCode, quantity = 1, ...rest } = productData;
  
  // 查找是否已存在相同 SKU
  const existingIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString() && 
            item.skuCode === skuCode
  );
  
  if (existingIndex > -1) {
    // 已存在，增加数量
    this.items[existingIndex].quantity += quantity;
  } else {
    // 新增购物车项
    this.items.push({
      productId,
      skuCode,
      quantity,
      ...rest
    });
  }
  
  this.lastSyncedAt = Date.now();
  return this.save();
};

/**
 * 更新购物车项数量
 */
cartSchema.methods.updateItemQuantity = async function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('购物车项不存在');
  }
  
  if (quantity <= 0) {
    // 数量为0时删除
    item.remove();
  } else {
    item.quantity = quantity;
  }
  
  this.lastSyncedAt = Date.now();
  return this.save();
};

/**
 * 切换商品选中状态
 */
cartSchema.methods.toggleItemSelection = async function(itemId, selected) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('购物车项不存在');
  }
  
  item.selected = selected;
  this.lastSyncedAt = Date.now();
  return this.save();
};

/**
 * 批量设置选中状态
 */
cartSchema.methods.bulkSetSelection = async function(selected, itemIds = null) {
  if (itemIds) {
    // 指定商品
    this.items.forEach(item => {
      if (itemIds.includes(item._id.toString())) {
        item.selected = selected;
      }
    });
  } else {
    // 全部
    this.items.forEach(item => {
      item.selected = selected;
    });
  }
  
  this.lastSyncedAt = Date.now();
  return this.save();
};

/**
 * 删除购物车项
 */
cartSchema.methods.removeItems = async function(itemIds) {
  this.items = this.items.filter(
    item => !itemIds.includes(item._id.toString())
  );
  
  this.lastSyncedAt = Date.now();
  return this.save();
};

/**
 * 清空购物车
 */
cartSchema.methods.clear = async function() {
  this.items = [];
  this.lastSyncedAt = Date.now();
  return this.save();
};

/**
 * 获取或创建用户购物车
 */
cartSchema.statics.getOrCreate = async function(userId) {
  let cart = await this.findOne({ userId });
  if (!cart) {
    cart = await this.create({ userId, items: [] });
  }
  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
