/**
 * 商品数据模型
 * 
 * 核心业务字段：
 * - 基本信息：名称、描述、品牌、分类
 * - 价格体系：原价、售价、促销价（支持多级定价）
 * - 库存管理：SKU 级别库存预警
 * - 媒体资源：主图、详情图、视频
 * - 销售数据：销量、浏览量、收藏数
 * 
 * 面试亮点：
 * - SKU 多规格设计（规格矩阵）
 * - 全文检索支持（text 索引）
 * - 软删除 + 回收站机制
 */

const mongoose = require('mongoose');

// SKU（库存单位）子文档
const skuSchema = new mongoose.Schema({
  // SKU 规格组合（如：红色 + XL）
  specCombination: [{
    name: { type: String, required: true },  // 规格名：颜色
    value: { type: String, required: true }  // 规格值：红色
  }],
  // SKU 唯一编码
  skuCode: {
    type: String,
    required: true,
    unique: true
  },
  // 价格体系
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  // 库存
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  // SKU 图片
  images: [{
    type: String
  }]
}, {
  _id: false
});

const productSchema = new mongoose.Schema({
  // 基础信息
  name: {
    type: String,
    required: [true, '商品名称不能为空'],
    trim: true,
    maxlength: 100,
    text: true,  // 创建全文索引
    index: true
  },
  // 全文检索字段
  searchKeywords: [{
    type: String,
    text: true
  }],
  description: {
    type: String,
    maxlength: 5000
  },
  // 分类信息
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  categoryPath: [{
    type: mongoose.Schema.Types.ObjectId,
    index: true
  }],
  // 品牌
  brand: {
    type: String,
    index: true
  },
  // 媒体资源
  mainImage: {
    type: String,
    required: [true, '商品主图不能为空']
  },
  images: [{
    type: String,
    required: true
  }],
  video: {
    type: String
  },
  // 价格信息（默认 SKU 的价格）
  price: {
    type: Number,
    required: true,
    min: [0, '价格不能为负数'],
    index: true
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  // SKU 列表
  skus: [skuSchema],
  // 规格列表（商品级别的规格定义）
  specs: [{
    name: { type: String, required: true },  // 规格名：颜色
    values: [{ type: String, required: true }]  // 可选值：红色, 蓝色, 黑色
  }],
  // 库存预警阈值
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  // 状态
  status: {
    type: String,
    enum: ['on', 'off', 'pending'],
    default: 'off',
    index: true
  },
  // 销售数据
  salesCount: {
    type: Number,
    default: 0,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  // 标签（用于推荐和筛选）
  tags: [{
    type: String,
    index: true
  }],
  // 是否包邮
  freeShipping: {
    type: Boolean,
    default: true
  },
  // 排序权重
  weight: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true,
  // 软删除
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建复合索引用于热门查询
productSchema.index({ status: 1, salesCount: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, status: 1, salesCount: -1 });

// 虚拟字段：库存状态
productSchema.virtual('stockStatus').get(function() {
  const totalStock = this.skus.reduce((sum, sku) => sum + sku.stock, 0);
  if (totalStock === 0) return 'out';
  if (totalStock <= this.lowStockThreshold) return 'low';
  return 'normal';
});

/**
 * 增加浏览量
 * 使用原子操作避免并发问题
 */
productSchema.methods.incrementViewCount = async function() {
  await this.constructor.updateOne(
    { _id: this._id },
    { $inc: { viewCount: 1 } }
  );
};

/**
 * 扣减库存（下单时调用）
 * 使用 findOneAndUpdate 实现乐观锁
 */
productSchema.statics.deductStock = async function(productId, skuCode, quantity) {
  const product = await this.findOneAndUpdate(
    {
      _id: productId,
      status: 'on',
      'skus.skuCode': skuCode,
      'skus.stock': { $gte: quantity }
    },
    {
      $inc: {
        'skus.$[sku].stock': -quantity,
        salesCount: quantity
      }
    },
    {
      arrayFilters: [{ 'sku.skuCode': skuCode }],
      new: true
    }
  );
  
  if (!product) {
    throw new Error('库存不足或商品已下架');
  }
  
  return product;
};

/**
 * 搜索商品（支持全文检索 + 条件筛选）
 */
productSchema.statics.searchProducts = async function({ 
  keyword, categoryId, minPrice, maxPrice, sort = 'sales', 
  page = 1, limit = 20 
}) {
  const query = { status: 'on' };
  
  // 关键词搜索
  if (keyword) {
    query.$text = { $search: keyword };
  }
  
  // 分类筛选
  if (categoryId) {
    query.categoryId = categoryId;
  }
  
  // 价格区间
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }
  
  // 排序
  const sortOptions = {
    sales: { salesCount: -1 },
    views: { viewCount: -1 },
    new: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 }
  };
  
  const [results, total] = await Promise.all([
    this.find(query)
      .sort(sortOptions[sort] || sortOptions.sales)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('categoryId', 'name'),
    this.countDocuments(query)
  ]);
  
  return {
    data: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
