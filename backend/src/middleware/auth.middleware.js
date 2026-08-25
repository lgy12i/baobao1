/**
 * 认证中间件（内存存储版本）
 * 
 * 职责：验证 JWT 令牌，解析用户身份，检查权限
 */

const jwt = require('jsonwebtoken');
const store = require('../config/memory-store');
const cache = require('../config/memory-cache');

const JWT_SECRET = process.env.JWT_SECRET || 'baobao-mall-jwt-secret-key-2026';

/**
 * 生成 Access Token
 */
const generateAccessToken = (payload, expiresIn = '2h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * 生成 Refresh Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * 验证 Token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token 已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token 无效');
    }
    throw error;
  }
};

/**
 * 认证中间件（要求登录）
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: '未提供认证令牌', data: null });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // 检查 Token 黑名单
    const isBlacklisted = await cache.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ code: 401, message: 'Token 已被吊销', data: null });
    }

    // 查找用户
    const user = await store.findUserById(decoded.userId);
    if (!user || user.status === 'disabled') {
      return res.status(401).json({ code: 401, message: '用户不存在或已被禁用', data: null });
    }

    req.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
      status: user.status
    };
    
    next();
  } catch (error) {
    if (error.message === 'Token 已过期') {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: { needRefresh: true } });
    }
    return res.status(401).json({ code: 401, message: '认证失败', data: null });
  }
};

/**
 * 可选认证中间件
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await store.findUserById(decoded.userId);
      if (user) {
        req.user = { _id: user._id, username: user.username, role: user.role };
      }
    }
  } catch (error) {
    // 忽略错误
  }
  next();
};

/**
 * 角色权限检查中间件
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录', data: null });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足', data: null });
    }
    next();
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  optionalAuth,
  requireRoles
};
