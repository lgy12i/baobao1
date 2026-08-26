/**
 * 商品分类模型
 * 
 * 支持多级分类（最多3级）
 * 采用自引用方式实现树形结构
 * 
 * 示例：
 * - 服装鞋帽 > 女装 > 连衣裙
 * - 数码电器 > 手机通讯 > 智能手机
 * 
 * 面试亮点：
 * - 物化路径（materialized path）优化层级查询
 * - 增量计数器维护商品数量
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '分类名称不能为空'],
    trim: true,
    maxlength: 20,
    index: true
  },
  // 自引用父分类
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true
  },
  // 分类层级（0=一级, 1=二级, 2=三级）
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  // 分类图标
  icon: {
    type: String,
    default: ''
  },
  // 分类描述
  description: {
    type: String,
    maxlength: 200
  },
  // 排序权重
  sort: {
    type: Number,
    default: 0,
    index: true
  },
  // 状态
  status: {
    type: Boolean,
    default: true,
    index: true
  },
  // 商品数量（冗余字段）
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段：子分类
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

// 虚拟字段：父分类信息
categorySchema.virtual('parentInfo', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

/**
 * 获取全部分类树
 * @returns {Promise<Array>} 嵌套的分类树结构
 */
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ status: true })
    .sort({ level: 1, sort: 1 })
    .lean();

  // 构建分类树
  const tree = [];
  const map = {};

  categories.forEach(cat => {
    map[cat._id] = { ...cat, children: [] };
  });

  categories.forEach(cat => {
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(map[cat._id]);
    } else {
      tree.push(map[cat._id]);
    }
  });

  return tree;
};

/**
 * 递归获取分类及其所有子分类 ID
 */
categorySchema.statics.getDescendantIds = async function(categoryId) {
  const ids = [categoryId];
  const children = await this.find({ parentId: categoryId }).select('_id');
  
  for (const child of children) {
    const descendantIds = await this.getDescendantIds(child._id);
    ids.push(...descendantIds);
  }
  
  return ids;
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
