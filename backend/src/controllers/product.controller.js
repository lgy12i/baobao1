/**
 * 商品控制器（内存存储版本）
 *
 * 职责：处理商品相关 API 请求
 *
 * 路由：
 * - GET    /api/v1/products         商品列表（支持搜索、分类、排序）
 * - GET    /api/v1/products/recommended 推荐商品
 * - GET    /api/v1/products/:id     商品详情
 * - GET    /api/v1/categories       分类列表
 */

const Joi = require('joi');
const store = require('../config/memory-store');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

/**
 * 商品列表查询参数校验
 */
const querySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
  keyword: Joi.string().allow(''),
  categoryId: Joi.string(),
  sort: Joi.string().valid('sales', 'price_asc', 'price_desc', 'new').default('sales'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0)
});

/**
 * 获取商品列表
 * GET /api/v1/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const { error, value } = querySchema.validate(req.query);
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const result = await store.getAllProducts(value);

  res.json({
    code: 200,
    message: '获取成功',
    data: result
  });
});

/**
 * 获取商品详情
 * GET /api/v1/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await store.getProductById(id);

  if (!product) {
    throw new AppError('商品不存在', 404, 'PRODUCT_NOT_FOUND');
  }

  // 增加浏览量
  product.viewCount = (product.viewCount || 0) + 1;
  await store.updateProduct(id, { viewCount: product.viewCount });

  res.json({
    code: 200,
    message: '获取成功',
    data: product
  });
});

/**
 * 获取推荐商品
 * GET /api/v1/products/recommended
 */
const getRecommendedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const result = await store.getRecommendedProducts(parseInt(limit));

  res.json({
    code: 200,
    message: '获取成功',
    data: { list: result }
  });
});

/**
 * 获取分类列表
 */
const getCategories = asyncHandler(async (req, res) => {
  const tree = await store.getCategoryTree();

  res.json({
    code: 200,
    message: '获取成功',
    data: tree
  });
});

module.exports = {
  getProducts,
  getProductById,
  getRecommendedProducts,
  getCategories
};

// 分类接口挂载到 /api/v1/categories
const categoryRouter = require('express').Router();
categoryRouter.get('/', getCategories);
module.exports.categoryRouter = categoryRouter;
