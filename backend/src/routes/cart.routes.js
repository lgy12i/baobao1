/**
 * 购物车路由
 * 
 * 挂载路径：/api/v1/cart
 * 
 * 所有接口需要用户登录认证
 */

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

// 所有购物车接口都需要认证
router.use(authenticate);

/**
 * @route   GET /api/v1/cart
 * @desc    获取当前用户购物车
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/v1/cart
 * @desc    添加商品到购物车
 * @access  Private
 */
router.post('/', cartController.addToCart);

/**
 * @route   PUT /api/v1/cart/:itemId
 * @desc    更新购物车项（数量/选中状态）
 * @access  Private
 */
router.put('/:itemId', cartController.updateCartItem);

/**
 * @route   DELETE /api/v1/cart/:itemId
 * @desc    删除购物车项
 * @access  Private
 */
router.delete('/:itemId', cartController.removeFromCart);

/**
 * @route   POST /api/v1/cart/select
 * @desc    批量设置选中状态
 * @access  Private
 */
router.post('/select', cartController.bulkSelect);

/**
 * @route   DELETE /api/v1/cart/clear
 * @desc    清空购物车
 * @access  Private
 */
router.delete('/clear', cartController.clearCart);

module.exports = router;
