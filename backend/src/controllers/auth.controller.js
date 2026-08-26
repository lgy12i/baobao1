/**
 * 认证控制器（内存存储版本）
 * 
 * 职责：处理用户注册、登录、登出、刷新令牌等认证相关请求
 * 使用内存存储作为降级方案，确保无数据库环境也能运行
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const store = require('../config/memory-store');
const cache = require('../config/memory-cache');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../middleware/auth.middleware');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

/**
 * 注册参数校验 Schema
 */
const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'any.required': '用户名不能为空',
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多20个字符'
    }),
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .messages({
      'any.required': '邮箱不能为空',
      'string.email': '邮箱格式不正确'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'any.required': '密码不能为空',
      'string.min': '密码至少6个字符'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': '两次输入的密码不一致'
    })
});

/**
 * 登录参数校验 Schema
 */
const loginSchema = Joi.object({
  account: Joi.string().required().messages({ 'any.required': '账号不能为空' }),
  password: Joi.string().min(6).required().messages({
    'any.required': '密码不能为空',
    'string.min': '密码至少6个字符'
  }),
  remember: Joi.boolean().default(false)
});

/**
 * 用户注册
 */
const register = asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { username, email, password } = value;

  // 检查用户名/邮箱是否已存在
  const existingUser = await store.findUserByAccount(username) || await store.findUserByEmail(email);
  if (existingUser) {
    if (existingUser.username === username) {
      throw new AppError('用户名已被注册', 409, 'USERNAME_EXISTS');
    }
    throw new AppError('邮箱已被注册', 409, 'EMAIL_EXISTS');
  }

  // 加密密码
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 创建用户
  const user = await store.createUser({
    username,
    email,
    password: hashedPassword,
    status: 'active'
  });

  // 生成 Token
  const accessToken = generateAccessToken({ userId: user._id, username: user.username, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user._id });

  res.status(201).json({
    code: 201,
    message: '注册成功',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      },
      tokens: { accessToken, refreshToken }
    }
  });
});

/**
 * 用户登录
 */
const login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { account, password, remember } = value;

  // 查找用户
  const user = await store.findUserByAccount(account);
  if (!user) {
    throw new AppError('账号或密码错误', 401, 'INVALID_CREDENTIALS');
  }

  // 检查账户状态
  if (user.status === 'disabled') {
    throw new AppError('账户已被禁用', 403, 'ACCOUNT_DISABLED');
  }

  // 检查是否锁定
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new AppError(`账户已锁定，请 ${remainingTime} 分钟后再试`, 423, 'ACCOUNT_LOCKED');
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 30 * 60 * 1000;
      user.loginAttempts = 0;
    }
    
    await store.updateUser(user._id, { loginAttempts: user.loginAttempts, lockUntil: user.lockUntil });
    throw new AppError('账号或密码错误', 401, 'INVALID_CREDENTIALS');
  }

  // 登录成功，重置失败计数
  await store.updateUser(user._id, {
    loginAttempts: 0,
    lockUntil: null,
    lastLoginAt: new Date(),
    lastLoginIP: req.ip
  });

  // 生成 Token
  const accessToken = generateAccessToken(
    { userId: user._id, username: user.username, role: user.role },
    remember ? '7d' : '2h'
  );
  const refreshToken = generateRefreshToken({ userId: user._id });

  // 存储 Refresh Token
  await cache.set(`refresh:${user._id}`, refreshToken, 7 * 24 * 60 * 60);

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: remember ? 7 * 24 * 60 * 60 : 2 * 60 * 60
      }
    }
  });
});

/**
 * 用户登出
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  
  // 将 Token 加入黑名单
  const decoded = jwt.decode(token);
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
  
  if (expiresIn > 0) {
    await cache.set(`blacklist:${token}`, '1', expiresIn);
  }
  
  await cache.del(`refresh:${req.user._id}`);

  res.json({ code: 200, message: '登出成功', data: null });
});

/**
 * 刷新 Token
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError('缺少 Refresh Token', 400, 'MISSING_TOKEN');
  }

  const decoded = verifyToken(refreshToken);
  
  const storedToken = await cache.get(`refresh:${decoded.userId}`);
  if (storedToken !== refreshToken) {
    throw new AppError('Refresh Token 已失效', 401, 'INVALID_TOKEN');
  }

  const newAccessToken = generateAccessToken({ userId: decoded.userId, role: decoded.role });

  res.json({
    code: 200,
    message: '刷新成功',
    data: { accessToken: newAccessToken, expiresIn: 2 * 60 * 60 }
  });
});

/**
 * 验证 Token
 */
const verify = asyncHandler(async (req, res) => {
  res.json({ code: 200, message: 'Token 有效', data: { valid: true, user: req.user } });
});

module.exports = { register, login, logout, refresh, verify };
