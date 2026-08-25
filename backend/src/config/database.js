/**
 * MongoDB 数据库连接配置
 * 
 * 使用 Mongoose ODM 操作 MongoDB
 * 配置连接池、事件监听、错误处理
 * 
 * 面试亮点：
 * - 连接池优化：maxPoolSize 控制并发连接数
 * - 断线重连：自动处理连接断开情况
 * - 索引优化：在 Schema 层定义索引提升查询性能
 */

const mongoose = require('mongoose');

/**
 * 连接 MongoDB 数据库
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // 连接池配置
      maxPoolSize: 10,          // 最大连接数
      minPoolSize: 2,           // 最小连接数
      maxIdleTimeMS: 30000,     // 最大空闲时间
      
      // 服务器选择配置
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // 自动索引（开发环境开启）
      autoIndex: process.env.NODE_ENV === 'development',
      
      // 自动压缩
      compressors: 'snappy'
    });

    // 连接事件监听
    mongoose.connection.on('connected', () => {
      console.log('Mongoose 已连接到 MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose 已断开连接');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    throw error;
  }
};

/**
 * 断开数据库连接
 * 用于优雅关闭
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('MongoDB 连接已断开');
};

module.exports = { connectDB, disconnectDB };
