/**
 * 内存缓存服务
 * 
 * 当 Redis 不可用时使用内存 Map 作为降级方案
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  async set(key, value, ttl = 3600) {
    const item = {
      value: JSON.stringify(value),
      expireAt: ttl > 0 ? Date.now() + ttl * 1000 : null
    };
    this.cache.set(key, item);
    return true;
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expireAt && item.expireAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    try {
      return JSON.parse(item.value);
    } catch {
      return null;
    }
  }

  async del(key) {
    this.cache.delete(key);
    return true;
  }

  async delByPattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    return true;
  }
}

module.exports = new MemoryCache();
