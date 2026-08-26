/**
 * AI 路由
 *
 * 端点：
 *   POST /api/v1/ai/chat       智能问答（主入口）
 *   POST /api/v1/ai/recommend  商品推荐
 *   GET  /api/v1/ai/status     AI 服务状态
 *
 * 限流：每分钟 30 次（AI 接口比较费 token）
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

// AI 接口独立限流
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'AI 接口请求过于频繁，请稍后再试' }
});

router.use(aiLimiter);

// POST /api/v1/ai/chat
router.post('/chat', aiController.chat);

// POST /api/v1/ai/recommend
router.post('/recommend', aiController.recommend);

// GET /api/v1/ai/status
router.get('/status', aiController.status);

module.exports = router;
