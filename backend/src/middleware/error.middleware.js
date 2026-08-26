/**
 * 错误处理中间件
 * 
 * 职责：统一处理应用错误，返回标准化的错误响应
 * 
 * 错误分类：
 * - 业务错误：正常业务流程中的预期错误（如"商品不存在"）
 * - 验证错误：请求参数校验失败
 * - 认证错误：Token 无效、权限不足
 * - 系统错误：未预期的服务器异常
 * 
 * 面试亮点：
 * - 错误分级处理，便于日志监控和告警
 * - 生产环境隐藏敏感错误信息
 * - 统一错误响应格式
 */

const { ValidationError } = require('joi');
const mongoose = require('mongoose');

/**
 * 标准化错误响应
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

/**
 * 404 未找到处理
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    data: null,
    timestamp: new Date().toISOString()
  });
};

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 默认错误响应
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  let code = err.code || 'INTERNAL_ERROR';
  let data = null;

  // 处理 Joi 验证错误
  if (err instanceof ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = '数据验证失败';
    data = err.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
  }

  // 处理 Mongoose 验证错误
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = '数据验证失败';
    data = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // 处理 MongoDB 重复键错误
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = '数据已存在';
    const field = Object.keys(err.keyValue)[0];
    data = [{
      field,
      message: `${field} 已存在`
    }];
  }

  // 处理 Mongoose Cast 错误（类型转换失败）
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'CAST_ERROR';
    message = '数据格式错误';
    data = [{
      field: err.path,
      message: `无效的 ${err.kind} 类型`
    }];
  }

  // 处理业务错误
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  // 处理 Token 过期错误
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = '登录已过期';
  }

  // 处理 JWT 错误
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = '无效的认证令牌';
  }

  // 日志记录（生产环境仅记录关键信息）
  if (process.env.NODE_ENV === 'production') {
    console.error('[ERROR]', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode,
      errorCode: code,
      message,
      ip: req.ip
    });
  } else {
    console.error('═══════════════════════════');
    console.error('错误详情:', err);
    console.error('请求路径:', req.method, req.originalUrl);
    console.error('状态码:', statusCode);
    console.error('═══════════════════════════');
  }

  // 返回错误响应
  res.status(statusCode).json({
    code: statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
    // 开发环境返回堆栈信息
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 异步错误捕获包装器
 * 自动捕获异步函数中的异常，传递给错误处理中间件
 * 
 * 使用示例：
 * router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
  asyncHandler
};
