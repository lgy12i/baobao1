/**
 * 订单路由
 * 
 * 挂载路径：/api/v1/orders
 */

const express = require('express');
const { authenticate, requireRoles } = require('../middleware/auth.middleware');
const orderController = require('../controllers/order.controller');

const router = express.Router();

// 所有订单接口都需要认证
router.use(authenticate);

/**
 * @route   POST /api/v1/orders
 * @desc    创建订单（结算）
 * @access  Private
 */
router.post('/', orderController.createOrder);

/**
 * @route   GET /api/v1/orders
 * @desc    获取订单列表
 * @access  Private
 */
router.get('/', orderController.getOrders);

/**
 * @route   GET /api/v1/orders/stats
 * @desc    获取订单统计
 * @access  Private
 */
router.get('/stats', orderController.getOrderStats);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    获取订单详情
 * @access  Private
 */
router.get('/:id', orderController.getOrderDetail);

/**
 * @route   PUT /api/v1/orders/:id/cancel
 * @desc    取消订单
 * @access  Private
 */
router.put('/:id/cancel', orderController.cancelOrder);

/**
 * @route   POST /api/v1/orders/:id/pay
 * @desc    支付订单
 * @access  Private
 */
router.post('/:id/pay', orderController.payOrder);

/**
 * @route   PUT /api/v1/orders/:id/receive
 * @desc    确认收货
 * @access  Private
 */
router.put('/:id/receive', orderController.confirmReceive);

module.exports = router;
