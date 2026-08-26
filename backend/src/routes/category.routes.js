/**
 * 分类路由
 * 
 * 挂载路径：/api/v1/categories
 */

const express = require('express');
const { authenticate, requireRoles } = require('../middleware/auth.middleware');
const Category = require('../models/category.model');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { CacheService } = require('../config/redis');

const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    获取分类列表/树
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const { tree = true } = req.query;
  
  const cacheKey = tree ? 'categories:tree' : 'categories:list';
  const cached = await CacheService.get(cacheKey);
  
  if (cached) {
    return res.json({
      code: 200,
      message: '获取成功（缓存）',
      data: cached
    });
  }

  let data;
  if (tree) {
    data = await Category.getCategoryTree();
  } else {
    data = await Category.find({ status: true })
      .sort({ level: 1, sort: 1 })
      .lean();
  }

  await CacheService.set(cacheKey, data, 1800);

  res.json({
    code: 200,
    message: '获取成功',
    data
  });
}));

/**
 * @route   POST /api/v1/categories
 * @desc    创建分类（管理员）
 * @access  Private - Admin
 */
router.post('/', authenticate, requireRoles('admin'), asyncHandler(async (req, res) => {
  const { name, parentId, level, sort, icon } = req.body;

  const category = new Category({
    name,
    parentId: parentId || null,
    level: level || 0,
    sort: sort || 0,
    icon: icon || ''
  });

  await category.save();
  
  // 清除缓存
  await CacheService.delByPattern('categories:*');

  res.status(201).json({
    code: 201,
    message: '创建成功',
    data: category
  });
}));

module.exports = router;
