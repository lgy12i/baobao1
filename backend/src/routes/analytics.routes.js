/**
 * 数据分析路由
 *
 * 端点：
 *   GET /api/v1/analytics/sales-overview   销售总览
 *   GET /api/v1/analytics/product-ranking  商品排行
 *   GET /api/v1/analytics/order-trend      订单趋势
 *   GET /api/v1/analytics/category-stats   分类统计
 *   GET /api/v1/analytics/user-behavior    用户行为
 */
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

// 数据分析需要登录（可选：仅管理员）
// router.use(authenticate);

router.get('/sales-overview', analyticsController.getSalesOverview);
router.get('/product-ranking', analyticsController.getProductRanking);
router.get('/order-trend', analyticsController.getOrderTrend);
router.get('/category-stats', analyticsController.getCategoryStats);
router.get('/user-behavior', analyticsController.getUserBehavior);

module.exports = router;