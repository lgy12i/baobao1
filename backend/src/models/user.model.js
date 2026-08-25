/**
 * 用户数据模型
 * 
 * 字段说明：
 * - username: 用户名（唯一）
 * - email: 邮箱（唯一）
 * - password: 密码（bcrypt 加密存储）
 * - phone: 手机号
 * - avatar: 头像 URL
 * - role: 角色（user/admin）
 * - addresses: 收货地址列表
 * - favorites: 收藏的商品
 * - cartCount: 购物车商品数（冗余字段，减少查询）
 * 
 * 索引策略：
 * - username: 唯一索引，加速登录查询
 * - email: 唯一索引，加速找回密码
 * - createdAt: 普通索引，支持时间范围查询
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基础信息
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符'],
    index: true
  },
  email: {
    type: String,
    required: [true, '邮箱不能为空'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, '邮箱格式不正确'],
    index: true
  },
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false  // 查询时默认不返回密码
  },
  // 扩展信息
  phone: {
    type: String,
    match: [/^1[3-9]\d{9}$/, '手机号格式不正确']
  },
  avatar: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 20
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'secret'],
    default: 'secret'
  },
  // 角色权限
  role: {
    type: String,
    enum: ['user', 'admin', 'seller'],
    default: 'user',
    index: true
  },
  // 账户状态
  status: {
    type: String,
    enum: ['active', 'disabled', 'pending'],
    default: 'pending'
  },
  // 收货地址
  addresses: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    receiver: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    detail: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  // 收藏商品 ID 列表
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // 统计字段（冗余存储，提升查询性能）
  stats: {
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    couponCount: { type: Number, default: 0 }
  },
  // 安全相关
  lastLoginAt: {
    type: Date
  },
  lastLoginIP: {
    type: String
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      // 移除敏感字段
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

/**
 * 密码加密钩子
 * 保存前自动对密码进行 bcrypt 加密
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 验证密码方法
 * @param {string} candidatePassword - 待验证的密码
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * 判断账户是否锁定
 * 连续登录失败5次后锁定30分钟
 */
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
