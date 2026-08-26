/**
 * 购物车控制器（内存存储版本）
 *
 * 职责：管理用户购物车的增删改查操作
 *
 * 路由：
 * - GET    /api/v1/cart         获取购物车
 * - POST   /api/v1/cart         添加商品到购物车
 * - PUT    /api/v1/cart/:itemId 更新购物车项
 * - DELETE /api/v1/cart/:itemId 删除购物车项
 * - POST   /api/v1/cart/select  批量设置选中状态
 * - DELETE /api/v1/cart/clear   清空购物车
 *
 * 面试亮点：
 * - 商品规格校验（SKU 必须存在且库存充足）
 * - 自动合并（登录时合并游客购物车）
 * - 实时价格计算（基于最新商品价格）
 */

const Joi = require('joi');
const store = require('../config/memory-store');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

/**
 * 计算购物车汇总信息（总数、选中数、选中金额）
 */
function summarizeCart(cart) {
  const items = cart.items || [];
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const selectedItems = items.filter(i => i.selected);
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { totalCount, selectedCount, selectedTotal };
}

/**
 * 将购物车项映射为前端所需结构（合并商品最新信息）
 */
function formatCartItem(item, product) {
  return {
    _id: item._id,
    productId: item.productId,
    name: product ? product.name : item.name,
    image: product ? product.mainImage : item.image,
    price: item.price,
    skuCode: item.skuCode,
    quantity: item.quantity,
    selected: item.selected,
    specInfo: item.specInfo || [],
    stockStatus: product && product.status === 'on' ? 'normal' : 'off'
  };
}

/**
 * 获取当前用户购物车
 * GET /api/v1/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const cart = await store.getOrCreateCart(userId);
  const items = cart.items.map(item => {
    const product = store.products.get(item.productId);
    return formatCartItem(item, product);
  });
  const summary = summarizeCart(cart);

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      _id: cart._id,
      items,
      ...summary
    }
  });
});

/**
 * 添加商品到购物车
 * POST /api/v1/cart
 */
const addToCart = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    skuCode: Joi.string().required(),
    quantity: Joi.number().min(1).max(99).default(1)
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { productId, skuCode, quantity } = value;

  // 验证商品存在且在售
  const product = await store.getProductById(productId);
  if (!product || product.status !== 'on') {
    throw new AppError('商品不存在或已下架', 404, 'PRODUCT_UNAVAILABLE');
  }

  // 验证 SKU
  const sku = (product.skus || []).find(s => s.skuCode === skuCode);
  if (!sku) {
    throw new AppError('商品规格不存在', 404, 'SKU_NOT_FOUND');
  }

  // 验证库存
  if (sku.stock < quantity) {
    throw new AppError('库存不足', 400, 'INSUFFICIENT_STOCK');
  }

  const userId = req.user._id || req.user.id;

  // 添加商品到购物车
  await store.addCartItem(userId, {
    productId,
    skuCode,
    quantity,
    name: product.name,
    image: product.mainImage,
    price: sku.price,
    specInfo: (sku.specCombination || []).map(s => ({ name: s.name, value: s.value }))
  });

  const cart = await store.getCart(userId);
  const summary = summarizeCart(cart);

  res.status(201).json({
    code: 201,
    message: '添加成功',
    data: {
      totalCount: summary.totalCount
    }
  });
});

/**
 * 更新购物车项（数量/选中状态）
 * PUT /api/v1/cart/:itemId
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity, selected } = req.body;

  const userId = req.user._id || req.user.id;
  const cart = await store.getOrCreateCart(userId);

  const item = (cart.items || []).find(i => i._id === itemId);
  if (!item) {
    throw new AppError('购物车项不存在', 404, 'ITEM_NOT_FOUND');
  }

  // 更新数量
  if (quantity !== undefined) {
    if (quantity < 1 || quantity > 99) {
      throw new AppError('数量必须在1-99之间', 400, 'INVALID_QUANTITY');
    }

    // 验证库存
    const product = await store.getProductById(item.productId);
    if (product) {
      const sku = (product.skus || []).find(s => s.skuCode === item.skuCode);
      if (sku && sku.stock < quantity) {
        throw new AppError('库存不足', 400, 'INSUFFICIENT_STOCK');
      }
    }

    item.quantity = quantity;
  }

  // 更新选中状态
  if (selected !== undefined) {
    item.selected = !!selected;
  }

  cart.updatedAt = new Date();

  const summary = summarizeCart(cart);

  res.json({
    code: 200,
    message: '更新成功',
    data: {
      totalCount: summary.totalCount,
      selectedTotal: summary.selectedTotal
    }
  });
});

/**
 * 删除购物车项
 * DELETE /api/v1/cart/:itemId
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const userId = req.user._id || req.user.id;
  const cart = await store.getOrCreateCart(userId);

  const index = (cart.items || []).findIndex(i => i._id === itemId);
  if (index === -1) {
    throw new AppError('购物车项不存在', 404, 'ITEM_NOT_FOUND');
  }

  cart.items.splice(index, 1);
  cart.updatedAt = new Date();

  const summary = summarizeCart(cart);

  res.json({
    code: 200,
    message: '删除成功',
    data: {
      totalCount: summary.totalCount
    }
  });
});

/**
 * 批量设置选中状态
 * POST /api/v1/cart/select
 */
const bulkSelect = asyncHandler(async (req, res) => {
  const { selected, itemIds } = req.body;

  if (selected === undefined) {
    throw new AppError('缺少 selected 参数', 400, 'MISSING_PARAMS');
  }

  const userId = req.user._id || req.user.id;
  const cart = await store.getOrCreateCart(userId);

  (cart.items || []).forEach(item => {
    if (!itemIds || itemIds.length === 0 || itemIds.includes(item._id)) {
      item.selected = !!selected;
    }
  });

  cart.updatedAt = new Date();

  const summary = summarizeCart(cart);

  res.json({
    code: 200,
    message: '更新成功',
    data: {
      selectedCount: summary.selectedCount,
      selectedTotal: summary.selectedTotal
    }
  });
});

/**
 * 清空购物车
 * DELETE /api/v1/cart/clear
 */
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const cart = await store.getOrCreateCart(userId);

  cart.items = [];
  cart.updatedAt = new Date();

  res.json({
    code: 200,
    message: '购物车已清空',
    data: null
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  bulkSelect,
  clearCart
};
