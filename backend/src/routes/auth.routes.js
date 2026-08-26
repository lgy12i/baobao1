/**
 * 认证路由
 * 
 * 挂载路径：/api/v1/auth
 */

const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    刷新 Access Token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    验证 Token 有效性
 * @access  Private
 */
router.get('/verify', authenticate, authController.verify);

module.exports = router;
