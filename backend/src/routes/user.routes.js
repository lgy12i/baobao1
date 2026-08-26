/**
 * 用户路由（内存存储版本）
 *
 * 挂载路径：/api/v1/user
 *
 * 处理用户信息管理、地址管理、收藏等
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth.middleware');
const store = require('../config/memory-store');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

const router = express.Router();

// 所有用户接口都需要认证
router.use(authenticate);

/**
 * 生成地址 ID
 */
function generateAddressId() {
  return 'addr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

/**
 * @route   GET /api/v1/user/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const user = await store.findUserById(userId);

  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  // 移除敏感字段
  const { password, loginAttempts, lockUntil, ...safeUser } = user;

  res.json({
    code: 200,
    message: '获取成功',
    data: safeUser
  });
}));

/**
 * @route   PUT /api/v1/user/profile
 * @desc    更新用户信息
 * @access  Private
 */
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const allowedFields = ['nickname', 'avatar', 'gender', 'phone'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await store.updateUser(userId, updates);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const { password, loginAttempts, lockUntil, ...safeUser } = user;

  res.json({
    code: 200,
    message: '更新成功',
    data: safeUser
  });
}));

/**
 * @route   POST /api/v1/user/password
 * @desc    修改密码
 * @access  Private
 */
router.post('/password', asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id || req.user.id;

  const user = await store.findUserById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new AppError('原密码错误', 400, 'INVALID_PASSWORD');
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);

  res.json({
    code: 200,
    message: '密码修改成功',
    data: null
  });
}));

/**
 * @route   GET /api/v1/user/addresses
 * @desc    获取收货地址列表
 * @access  Private
 */
router.get('/addresses', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const user = await store.findUserById(userId);

  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: user.addresses || []
  });
}));

/**
 * @route   POST /api/v1/user/addresses
 * @desc    添加收货地址
 * @access  Private
 */
router.post('/addresses', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { receiver, phone, province, city, district, detail, isDefault } = req.body;

  if (!receiver || !phone || !province || !city || !detail) {
    throw new AppError('收货信息不完整', 400, 'INVALID_ADDRESS');
  }

  const user = await store.findUserById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  if (!user.addresses) user.addresses = [];

  // 如果设置为默认地址，先取消其他默认
  const willBeDefault = isDefault || user.addresses.length === 0;
  if (willBeDefault) {
    user.addresses.forEach(addr => { addr.isDefault = false; });
  }

  const newAddress = {
    _id: generateAddressId(),
    receiver,
    phone,
    province,
    city,
    district,
    detail,
    isDefault: willBeDefault
  };

  user.addresses.push(newAddress);

  res.status(201).json({
    code: 201,
    message: '添加成功',
    data: newAddress
  });
}));

/**
 * @route   PUT /api/v1/user/addresses/:addressId
 * @desc    更新收货地址
 * @access  Private
 */
router.put('/addresses/:addressId', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { addressId } = req.params;

  const user = await store.findUserById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const address = (user.addresses || []).find(a => a._id === addressId);
  if (!address) {
    throw new AppError('地址不存在', 404, 'ADDRESS_NOT_FOUND');
  }

  if (req.body.isDefault) {
    user.addresses.forEach(addr => { addr.isDefault = false; });
  }

  Object.assign(address, req.body);

  res.json({
    code: 200,
    message: '更新成功',
    data: address
  });
}));

/**
 * @route   DELETE /api/v1/user/addresses/:addressId
 * @desc    删除收货地址
 * @access  Private
 */
router.delete('/addresses/:addressId', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { addressId } = req.params;

  const user = await store.findUserById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const index = (user.addresses || []).findIndex(a => a._id === addressId);
  if (index === -1) {
    throw new AppError('地址不存在', 404, 'ADDRESS_NOT_FOUND');
  }

  user.addresses.splice(index, 1);

  res.json({
    code: 200,
    message: '删除成功',
    data: null
  });
}));

/**
 * @route   GET /api/v1/user/favorites
 * @desc    获取收藏列表
 * @access  Private
 */
router.get('/favorites', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const user = await store.findUserById(userId);

  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const favorites = (user.favorites || [])
    .map(productId => store.products.get(productId))
    .filter(Boolean)
    .map(p => ({
      _id: p._id,
      name: p.name,
      mainImage: p.mainImage,
      price: p.price,
      originalPrice: p.originalPrice,
      categoryId: p.categoryId
    }));

  res.json({
    code: 200,
    message: '获取成功',
    data: favorites
  });
}));

/**
 * @route   POST /api/v1/user/favorites/:productId
 * @desc    添加收藏
 * @access  Private
 */
router.post('/favorites/:productId', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { productId } = req.params;

  const user = await store.findUserById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  if (!user.favorites) user.favorites = [];

  if (user.favorites.includes(productId)) {
    throw new AppError('已收藏该商品', 400, 'ALREADY_FAVORITED');
  }

  user.favorites.push(productId);

  // 更新商品收藏数
  const product = store.products.get(productId);
  if (product) {
    product.favoriteCount = (product.favoriteCount || 0) + 1;
  }

  res.status(201).json({
    code: 201,
    message: '收藏成功',
    data: null
  });
}));

/**
 * @route   DELETE /api/v1/user/favorites/:productId
 * @desc    取消收藏
 * @access  Private
 */
router.delete('/favorites/:productId', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { productId } = req.params;

  const user = await store.findUserById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  if (!user.favorites) user.favorites = [];

  user.favorites = user.favorites.filter(id => id !== productId);

  // 更新商品收藏数
  const product = store.products.get(productId);
  if (product) {
    product.favoriteCount = Math.max(0, (product.favoriteCount || 0) - 1);
  }

  res.json({
    code: 200,
    message: '取消收藏成功',
    data: null
  });
}));

/**
 * @route   GET /api/v1/user/stats
 * @desc    获取用户统计数据
 * @access  Private
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const user = await store.findUserById(userId);

  if (!user) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      orderCount: (user.stats && user.stats.orderCount) || 0,
      totalSpent: (user.stats && user.stats.totalSpent) || 0,
      favoriteCount: (user.favorites || []).length,
      addressCount: (user.addresses || []).length
    }
  });
}));

module.exports = router;
