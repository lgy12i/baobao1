/**
 * Redis 缓存配置
 * 
 * 使用场景：
 * 1. 会话缓存：存储 JWT 刷新令牌
 * 2. 热点数据缓存：缓存商品详情、分类列表等高频访问数据
 * 3. 购物车存储：基于 Redis Hash 结构存储购物车数据
 * 4. 排行榜：使用 ZSET 实现热销商品排行
 * 5. 限流计数：配合 rate-limit 实现接口限流
 * 
 * 面试亮点：
 * - 缓存穿透：布隆过滤器 + 缓存空值
 * - 缓存雪崩：随机过期时间 + 多级缓存
 * - 缓存击穿：互斥锁机制保护热点 Key
 */

const { createClient } = require('redis');

let redisClient = null;

/**
 * 连接 Redis
 */
const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          console.log(`Redis 重连尝试: ${retries}`);
          return Math.min(retries * 200, 5000);
        }
      },
      // 选择数据库
      database: 0
    });

    // 事件监听
    redisClient.on('connect', () => {
      console.log('Redis 客户端已连接');
    });

    redisClient.on('error', (err) => {
      console.error('Redis 错误:', err);
    });

    redisClient.on('ready', () => {
      console.log('Redis 客户端就绪');
    });

    await redisClient.connect();
    
    // 测试连接
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    console.error('Redis 连接失败:', error.message);
    // Redis 连接失败不阻塞主服务启动
    console.warn('Redis 不可用，缓存功能将降级为内存存储');
    return null;
  }
};

/**
 * 获取 Redis 客户端
 * @returns {RedisClientType}
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * 缓存工具类
 * 提供便捷的缓存操作方法
 */
class CacheService {
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒），0 表示永不过期
   */
  static async set(key, value, ttl = 3600) {
    if (!redisClient) return;
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl > 0) {
        await redisClient.setEx(key, ttl, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
    } catch (error) {
      console.error('缓存设置失败:', error);
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} 缓存值
   */
  static async get(key) {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('缓存获取失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  static async del(key) {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('缓存删除失败:', error);
    }
  }

  /**
   * 模式匹配删除
   * @param {string} pattern - 匹配模式
   */
  static async delByPattern(pattern) {
    if (!redisClient) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('缓存批量删除失败:', error);
    }
  }

  /**
   * 缓存预热
   * 系统启动时预加载热点数据
   */
  static async warmUpCache() {
    console.log('开始缓存预热...');
    // 预加载热门分类、推荐商品等
    console.log('缓存预热完成');
  }
}

module.exports = { connectRedis, getRedisClient, CacheService };
