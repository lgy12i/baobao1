/**
 * 支付路由
 * 
 * 挂载路径：/api/v1/payments
 * 
 * 处理支付相关的回调、查询等接口
 */

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/payments/create
 * @desc    创建支付订单（对接第三方支付）
 * @access  Private
 */
router.post('/create', authenticate, asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  // 实际项目中这里会对接支付宝/微信支付等
  // 这里使用模拟实现
  
  res.json({
    code: 200,
    message: '创建成功',
    data: {
      paymentId: `pay_${Date.now()}`,
      paymentMethod,
      status: 'pending',
      // 模拟支付链接
      payUrl: `mock://pay?order=${orderId}`
    }
  });
}));

/**
 * @route   POST /api/v1/payments/callback
 * @desc    支付回调（第三方支付平台调用）
 * @access  Public（需签名验证）
 */
router.post('/callback', asyncHandler(async (req, res) => {
  // 实际项目中需要验证签名，防止伪造回调
  // 这里使用简化处理
  
  res.json({
    code: 200,
    message: '回调接收成功',
    data: { received: true }
  });
}));

/**
 * @route   GET /api/v1/payments/:id/status
 * @desc    查询支付状态
 * @access  Private
 */
router.get('/:id/status', authenticate, asyncHandler(async (req, res) => {
  res.json({
    code: 200,
    message: '查询成功',
    data: {
      paymentId: req.params.id,
      status: 'success'  // 模拟
    }
  });
}));

module.exports = router;
