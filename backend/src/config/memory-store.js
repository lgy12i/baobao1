/**
 * 内存数据存储
 *
 * 当 MongoDB 不可用时，使用内存存储作为降级方案
 * 支持用户注册、登录等核心功能的验证
 */

class MemoryStore {
  constructor() {
    this.users = new Map();       // 用户数据
    this.carts = new Map();      // 购物车数据
    this.products = new Map();   // 商品数据
    this.orders = new Map();     // 订单数据
    this.categories = new Map(); // 分类数据
  }

  generateId() {
    return 'mt' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ============ 用户操作 ============
  async createUser(userData) {
    const id = this.generateId();
    const user = {
      _id: id,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      nickname: userData.nickname || '',
      phone: userData.phone || '',
      avatar: userData.avatar || '/uploads/default-avatar.png',
      role: userData.role || 'user',
      status: userData.status || 'active',
      addresses: (userData.addresses || []).map(a => ({ _id: a._id || this.generateId(), ...a })),
      favorites: [],
      stats: { orderCount: 0, totalSpent: 0, couponCount: 0 },
      loginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async findUserByUsername(username) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async findUserByEmail(email) {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async findUserById(id) {
    return this.users.get(id);
  }

  async findUserByAccount(account) {
    return Array.from(this.users.values()).find(
      u => u.username === account || u.email === account
    );
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date() });
    }
    return user;
  }

  // ============ 购物车操作 ============
  async getOrCreateCart(userId) {
    if (!this.carts.has(userId)) {
      this.carts.set(userId, {
        _id: this.generateId(),
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return this.carts.get(userId);
  }

  async addCartItem(userId, item) {
    const cart = await this.getOrCreateCart(userId);
    const existingItem = cart.items.find(
      i => i.productId === item.productId && i.skuCode === item.skuCode
    );
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.items.push({
        _id: this.generateId(),
        ...item,
        selected: true,
        addedAt: new Date()
      });
    }
    cart.updatedAt = new Date();
    return cart;
  }

  async getCart(userId) {
    return this.carts.get(userId) || { items: [] };
  }

  // ============ 商品操作 ============
  async createProduct(productData) {
    const id = this.generateId();
    const product = {
      _id: id,
      ...productData,
      salesCount: productData.salesCount || 0,
      viewCount: productData.viewCount || 0,
      favoriteCount: productData.favoriteCount || 0,
      status: productData.status || 'on',
      createdAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async getAllProducts({ page = 1, limit = 20, keyword, categoryId, sort = 'sales' } = {}) {
    let products = Array.from(this.products.values()).filter(p => p.status === 'on');

    if (keyword) {
      const kw = keyword.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(kw)))
      );
    }

    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }

    // 排序
    const sortMap = { sales: 'salesCount', price_asc: 'price', price_desc: 'price', new: 'createdAt' };
    const sortField = sortMap[sort] || 'salesCount';
    const sortDir = sort === 'price_desc' ? -1 : 1;
    products.sort((a, b) => (a[sortField] - b[sortField]) * sortDir);

    const total = products.length;
    const start = (page - 1) * limit;

    return {
      list: products.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getProductById(id) {
    return this.products.get(id);
  }

  async updateProduct(id, updates) {
    const product = this.products.get(id);
    if (product) {
      Object.assign(product, updates);
    }
    return product;
  }

  async getRecommendedProducts(limit = 10) {
    const products = Array.from(this.products.values())
      .filter(p => p.status === 'on')
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, limit);
    return products;
  }

  // ============ 订单操作 ============
  async createOrder(orderData) {
    const id = this.generateId();
    const orderNo = 'TB' + Date.now().toString().toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    const order = {
      _id: id,
      orderNo,
      ...orderData,
      timeline: [
        {
          status: orderData.status || 'pending_payment',
          description: '订单创建',
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrdersByUserId(userId, { page = 1, limit = 10, status } = {}) {
    let orders = Array.from(this.orders.values()).filter(o => o.userId === userId);
    if (status) orders = orders.filter(o => o.status === status);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = orders.length;
    const start = (page - 1) * limit;

    return {
      list: orders.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getOrderById(id) {
    return this.orders.get(id);
  }

  async updateOrder(id, updates) {
    const order = this.orders.get(id);
    if (order) {
      Object.assign(order, updates);
    }
    return order;
  }

  // ============ 分类操作 ============
  async createCategory(categoryData) {
    const id = this.generateId();
    const category = { _id: id, children: [], ...categoryData };
    this.categories.set(id, category);
    return category;
  }

  async getAllCategories() {
    return Array.from(this.categories.values()).sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  async getCategoryById(id) {
    return this.categories.get(id);
  }

  /**
   * 获取分类树结构（支持多级分类）
   * 前端首页导航和分类页面使用
   */
  async getCategoryTree() {
    const all = Array.from(this.categories.values());
    const roots = all.filter(c => !c.parentId || c.parentId === null);
    const result = roots.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map(root => {
      const children = all
        .filter(c => c.parentId === root._id)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map(c => ({
          _id: c._id,
          name: c.name,
          level: c.level,
          sort: c.sort,
          icon: c.icon
        }));
      return {
        _id: root._id,
        name: root.name,
        level: root.level,
        sort: root.sort,
        icon: root.icon,
        children
      };
    });
    return result;
  }

  // ============ 示例数据 ============
  async seedData() {
    // 创建示例分类
    const categoriesData = [
      { name: '服装鞋帽', level: 0, sort: 1, icon: '👗' },
      { name: '数码电器', level: 0, sort: 2, icon: '📱' },
      { name: '家居家装', level: 0, sort: 3, icon: '🏠' },
      { name: '美妆个护', level: 0, sort: 4, icon: '💄' },
      { name: '食品生鲜', level: 0, sort: 5, icon: '🍎' },
      { name: '运动户外', level: 0, sort: 6, icon: '⚽' }
    ];

    const createdCategories = [];
    for (const cat of categoriesData) {
      const c = await this.createCategory(cat);
      createdCategories.push(c);
    }

    // 创建示例商品
    const productsData = [
      {
        name: 'Apple iPhone 15 Pro Max 256GB',
        brand: 'Apple',
        description: '最新款旗舰手机，搭载 A17 Pro 芯片',
        categoryId: createdCategories[1]._id,
        price: 9999,
        originalPrice: 10999,
        mainImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'],
        tags: ['新品', '旗舰', '分期免息'],
        skus: [{ skuCode: 'SKU001', price: 9999, stock: 100, specCombination: [{ name: '版本', value: '256GB' }] }],
        specs: [{ name: '版本', values: ['128GB', '256GB', '512GB'] }],
        salesCount: 8923
      },
      {
        name: '2026新款夏季连衣裙女法式复古',
        brand: '时尚佳人',
        description: '法式复古风格连衣裙，夏季新款',
        categoryId: createdCategories[0]._id,
        price: 199.9,
        originalPrice: 399,
        mainImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'],
        tags: ['新品', '热销', '包邮'],
        skus: [{ skuCode: 'SKU002', price: 199.9, stock: 200, specCombination: [{ name: '颜色', value: '红色' }] }],
        specs: [{ name: '颜色', values: ['红色', '蓝色', '黑色'] }],
        salesCount: 15680
      },
      {
        name: '小米空气净化器Pro H',
        brand: '小米',
        description: '家用除甲醛空气净化器',
        categoryId: createdCategories[1]._id,
        price: 1499,
        originalPrice: 1999,
        mainImage: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
        images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400'],
        tags: ['热销', '智能'],
        skus: [{ skuCode: 'SKU003', price: 1499, stock: 50, specCombination: [{ name: '版本', value: 'Pro H' }] }],
        specs: [],
        salesCount: 5621
      },
      {
        name: '戴森 V12 Detect Slim 无绳吸尘器',
        brand: 'Dyson',
        description: '激光探测，智能感应灰尘',
        categoryId: createdCategories[2]._id,
        price: 4590,
        originalPrice: 4990,
        mainImage: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
        images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400'],
        tags: ['新品', '爆款'],
        skus: [{ skuCode: 'SKU004', price: 4590, stock: 30, specCombination: [{ name: '套装', value: '标准版' }] }],
        specs: [{ name: '套装', values: ['标准版', '豪华版'] }],
        salesCount: 3218
      },
      {
        name: 'YSL圣罗兰黑管哑光唇釉',
        brand: 'YSL',
        description: '持久哑光，丝滑质地',
        categoryId: createdCategories[3]._id,
        price: 380,
        originalPrice: 420,
        mainImage: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
        images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'],
        tags: ['热销', '明星产品'],
        skus: [{ skuCode: 'SKU005', price: 380, stock: 500, specCombination: [{ name: '色号', value: '#416' }] }],
        specs: [{ name: '色号', values: ['#416', '#210', '#1966'] }],
        salesCount: 9876
      },
      {
        name: '有机新疆阿克苏苹果10斤装',
        brand: '果郡王',
        description: '冰糖心苹果，脆甜多汁',
        categoryId: createdCategories[4]._id,
        price: 59.9,
        originalPrice: 89,
        mainImage: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400',
        images: ['https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400'],
        tags: ['包邮', '新鲜直达'],
        skus: [{ skuCode: 'SKU006', price: 59.9, stock: 1000, specCombination: [{ name: '规格', value: '10斤装' }] }],
        specs: [{ name: '规格', values: ['5斤装', '10斤装'] }],
        salesCount: 23456
      }
    ];

    for (const p of productsData) {
      await this.createProduct(p);
    }

    // 创建测试用户
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Test123456', salt);

    await this.createUser({
      username: 'testuser',
      email: 'test@baobao.com',
      password: hashedPassword,
      nickname: '测试用户',
      phone: '13800138000',
      role: 'user',
      status: 'active',
      addresses: [{
        receiver: '张三',
        phone: '13800138000',
        province: '浙江省',
        city: '杭州市',
        district: '西湖区',
        detail: '文三路 XX 号',
        isDefault: true
      }]
    });
  }
}

// 导出单例实例
const store = new MemoryStore();

// 初始化锁：确保 seedData 只执行一次
let initPromise = null;

store.initialize = async function() {
  if (!initPromise) {
    initPromise = store.seedData().then(() => {
      console.log('✓ 内存数据库初始化完成（示例数据已加载）');
    });
  }
  return initPromise;
};

module.exports = store;
// =============================================================
// [PATCH 商品序列化]
// 目标：
//  1) 所有读取到的商品 categoryId 统一为 {_id, name, icon} 对象
//  2) images / mainImage 字段标准化
//  3) 注入本地可渲染的 emoji SVG 渐变占位图，避免外链失效
// =============================================================

// 预先生成每个分类对应的「分类ID → emoji」映射，用于占位图渲染
MemoryStore.prototype._categoryEmojiMap = function () {
  const map = {};
  for (const c of this.categories.values()) {
    map[c._id] = c.icon || '📦';
  }
  return map;
};

// 根据商品生成一张稳定的 SVG emoji 渐变占位图（内嵌 data:image/svg+xml，不依赖网络）
// 优点：不跨域、不重定向、一定能显示、颜色与商品id稳定绑定
function buildEmojiPlaceholder(product, fallbackEmoji = '📦') {
  // 用商品名哈希确定两个渐变颜色
  let hash = 0;
  const str = product._id + product.name;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
  hash = Math.abs(hash);
  const hues = [hash % 360, (hash * 7 % 360)];
  const emoji = fallbackEmoji;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="hsl(' + hues[0] + ',70%,60%)"/>' +
    '<stop offset="100%" stop-color="hsl(' + hues[1] + ',75%,40%)"/>' +
    '</linearGradient></defs>' +
    '<rect width="400" height="400" fill="url(#g)"/>' +
    '<text x="200" y="220" font-size="160" text-anchor="middle" dominant-baseline="central">' + emoji + '</text>' +
    '<text x="200" y="360" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.85)">宝宝商城 · 商品图</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

MemoryStore.prototype._serializeProduct = function (product) {
  if (!product) return product;
  const p = { ...product };
  const catMap = this._categoryEmojiMap();

  // 1) categoryId 规范化
  const rawCat = p.categoryId;
  let catObj;
  if (!rawCat) {
    // 兜底：挑第一个分类
    const anyCat = Array.from(this.categories.values())[0];
    catObj = anyCat ? { _id: anyCat._id, name: anyCat.name, icon: anyCat.icon } : { _id: '', name: '未分类', icon: '📦' };
  } else if (typeof rawCat === 'string') {
    const c = this.categories.get(rawCat) ||
              Array.from(this.categories.values()).find(x => x._id === rawCat);
    catObj = c ? { _id: c._id, name: c.name, icon: c.icon } : { _id: rawCat, name: '未分类', icon: '📦' };
  } else if (rawCat && typeof rawCat === 'object') {
    catObj = { _id: rawCat._id, name: rawCat.name || '未分类', icon: rawCat.icon || '📦' };
  } else {
    catObj = { _id: String(rawCat), name: '未分类', icon: '📦' };
  }
  p.categoryId = catObj;

  // 2) images 规范化
  const placeholder = buildEmojiPlaceholder(p, catObj.icon || '📦');
  const mainSrc = p.mainImage || (p.images && p.images[0]);
  const imgList = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  if (mainSrc && !imgList.includes(mainSrc)) imgList.unshift(mainSrc);

  // 每个商品至少 4 张图：先用已有 + 末尾补占位（保证缩略图不会空）
  while (imgList.length < 4) imgList.push(placeholder);
  p.images = imgList;
  p.mainImage = imgList[0];
  p._placeholderImage = placeholder;  // 给前端 fallback 做参考（或直接用最后一张）

  // 3) SKU 默认至少一条
  if (!p.skus || !p.skus.length) {
    p.skus = [{
      skuCode: 'SKU-' + (p._id || 'DEF').slice(-6),
      price: p.price || 0,
      originalPrice: p.originalPrice || p.price,
      stock: 99,
      specCombination: []
    }];
  }
  // 保证 SKU 字段存在
  p.specs = p.specs || [];
  p.tags = Array.isArray(p.tags) ? p.tags : ['热销', '包邮'];
  p.salesCount = typeof p.salesCount === 'number' ? p.salesCount : 0;
  p.viewCount = typeof p.viewCount === 'number' ? p.viewCount : 0;
  p.favoriteCount = typeof p.favoriteCount === 'number' ? p.favoriteCount : 0;
  p.price = typeof p.price === 'number' ? p.price : 0;
  if (!p.originalPrice) p.originalPrice = p.price;

  return p;
};

// 包装原方法
const _origCreateProduct = MemoryStore.prototype.createProduct;
MemoryStore.prototype.createProduct = async function (...args) {
  const p = await _origCreateProduct.apply(this, args);
  return this._serializeProduct(p);
};

const _origGetProductById = MemoryStore.prototype.getProductById;
MemoryStore.prototype.getProductById = async function (...args) {
  const p = await _origGetProductById.apply(this, args);
  return this._serializeProduct(p);
};

const _origGetAllProducts = MemoryStore.prototype.getAllProducts;
MemoryStore.prototype.getAllProducts = async function (...args) {
  const res = await _origGetAllProducts.apply(this, args);
  if (res && res.list) {
    res.list = res.list.map(p => this._serializeProduct(p));
  }
  return res;
};

const _origGetRecommended = MemoryStore.prototype.getRecommendedProducts;
MemoryStore.prototype.getRecommendedProducts = async function (...args) {
  const list = await _origGetRecommended.apply(this, args);
  return list.map(p => this._serializeProduct(p));
};
