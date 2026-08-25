/**
 * 应用入口文件（内存存储版本）
 *
 * 使用内存存储作为降级方案，无需 MongoDB 和 Redis 也能运行
 * 适用于快速开发和功能验证场景
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 导入内存存储（替代 MongoDB + Redis）
const store = require('./config/memory-store');
const cache = require('./config/memory-cache');

// 导入路由模块
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const { categoryRouter } = require('./controllers/product.controller');

// 导入错误处理中间件
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// 初始化 Express 应用
const app = express();

/**
 * 安全中间件配置
 */
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

/**
 * 解析请求体
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * 全局限流配置
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', globalLimiter);

/**
 * 静态文件服务
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * API 路由挂载
 */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/user', userRoutes);

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    storage: 'memory'
  });
});

/**
 * 错误处理中间件
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * 启动服务器
 */
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('  宝宝商城后端服务启动中...');
    console.log('  (使用内存存储模式，无需 MongoDB/Redis)');
    console.log('═══════════════════════════════════════════\n');

    // 显式初始化内存数据（确保 seedData 完成后再检查）
    await store.initialize();

    const userCount = (await store.findUserByAccount('testuser')) ? 1 : 0;
    console.log(`✓ 内存存储已初始化`);
    console.log(`  - 分类：${store.categories.size} 个`);
    console.log(`  - 商品：${store.products.size} 个`);
    console.log(`  - 测试账号：testuser / Test123456\n`);

    // 启动 HTTP 服务
    app.listen(PORT, () => {
      console.log(`✓ 服务器启动成功！`);
      console.log(`  - API 地址: http://localhost:${PORT}`);
      console.log(`  - 健康检查: http://localhost:${PORT}/health`);
      console.log(`  - 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n  测试登录接口:`);
      console.log(`  POST http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`  Body: { "account": "testuser", "password": "Test123456" }`);
      console.log('═══════════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

startServer();
