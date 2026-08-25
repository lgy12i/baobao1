# 淘淘商城 - 全栈电商项目总结

## 📋 项目概述

**项目名称**：宝宝商城（Taotao Mall）

**项目定位**：宝宝电商平台，包含商品浏览、购物车、下单结算、订单管理等完整电商功能。

**项目目标**：
- 实现完整的电商业务闭环
- 采用现代化技术栈
- 工程化、可扩展的架构设计

---

## 🏗️ 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端 (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + Vite + TailwindCSS + Zustand    │   │
│  │  ├── 路由管理 (React Router v6)                         │   │
│  │  ├── 状态管理 (Zustand)                                  │   │
│  │  ├── 数据请求 (React Query)                              │   │
│  │  └── UI 组件 (Lucide Icons + 自定义组件)                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     服务端 (Node.js + Express)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    中间件层 (Middleware)                  │   │
│  │  ├── 认证鉴权 (JWT + Token 黑名单)                      │   │
│  │  ├── 限流防刷 (express-rate-limit)                       │   │
│  │  ├── 安全防护 (helmet)                                   │   │
│  │  └── 错误处理 (统一错误格式)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    路由层 (Routes)                       │   │
│  │  auth / products / cart / orders / user / categories     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   控制器层 (Controllers)                │   │
│  │  业务逻辑处理、参数校验、响应格式化                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    数据层 (Models)                       │   │
│  │  Mongoose ODM + Schema 定义 + 索引优化                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据存储层                                │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │     MongoDB         │  │       Redis         │             │
│  │  ├── 用户数据       │  │  ├── 会话缓存        │             │
│  │  ├── 商品数据       │  │  ├── 商品缓存        │             │
│  │  ├── 订单数据       │  │  ├── 分类缓存        │             │
│  │  └── 购物车数据     │  │  └── 限流计数        │             │
│  └─────────────────────┘  └─────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 技术栈详情

### 后端技术栈

| 技术 | 版本 | 用途 | 面试讲解要点 |
|------|------|------|-------------|
| Node.js | - | 服务端运行时 | 异步非阻塞、事件驱动 |
| Express | 4.18+ | Web 框架 | 轻量、灵活、生态丰富 |
| MongoDB | 7.6+ | 主数据库 | 文档存储、灵活 Schema |
| Mongoose | 7.6+ | MongoDB ODM | Schema 校验、索引优化 |
| Redis | 4.6+ | 缓存数据库 | 高性能缓存、会话管理 |
| JWT | 9.0+ | 身份认证 | 无状态认证、双令牌机制 |
| bcryptjs | 2.4+ | 密码加密 | 单向哈希、加盐处理 |
| Joi | 17+ | 参数校验 | 声明式校验、自动文档 |
| helmet | 7+ | 安全防护 | HTTP 安全头、防攻击 |
| express-rate-limit | 7+ | 限流防刷 | 防止暴力破解、DDoS |

### 前端技术栈

| 技术 | 版本 | 用途 | 面试讲解要点 |
|------|------|------|-------------|
| React | 18.2+ | UI 框架 | 函数组件、Hooks |
| TypeScript | 5.2+ | 类型系统 | 类型安全、代码智能提示 |
| Vite | 5.0+ | 构建工具 | 极快的 HMR、优化构建 |
| TailwindCSS | 3.3+ | CSS 框架 | 原子化、响应式 |
| React Router | 6.2+ | 路由管理 | 嵌套路由、动态路由 |
| Zustand | 4.4+ | 状态管理 | 轻量、持久化 |
| React Query | 3.39+ | 数据请求 | 缓存、自动刷新 |
| Axios | 1.6+ | HTTP 客户端 | 拦截器、错误处理 |
| Lucide React | 0.29+ | 图标库 | 现代化图标、Tree-shakable |

---

## 📁 项目目录结构

```
taotao-mall/
├── backend/                              # 后端项目
│   ├── src/
│   │   ├── config/                       # 配置文件
│   │   │   ├── database.js              # MongoDB 连接配置
│   │   │   └── redis.js                 # Redis 连接和缓存服务
│   │   ├── models/                       # 数据模型 (Mongoose Schema)
│   │   │   ├── user.model.js            # 用户模型
│   │   │   ├── product.model.js         # 商品模型
│   │   │   ├── category.model.js        # 分类模型
│   │   │   ├── cart.model.js            # 购物车模型
│   │   │   └── order.model.js           # 订单模型
│   │   ├── controllers/                  # 控制器 (业务逻辑)
│   │   │   ├── auth.controller.js       # 认证控制器
│   │   │   ├── product.controller.js    # 商品控制器
│   │   │   ├── cart.controller.js       # 购物车控制器
│   │   │   └── order.controller.js      # 订单控制器
│   │   ├── routes/                       # 路由定义
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   └── user.routes.js
│   │   ├── middleware/                   # 中间件
│   │   │   ├── auth.middleware.js       # 认证中间件
│   │   │   └── error.middleware.js      # 错误处理中间件
│   │   ├── services/                     # 服务层 (API 封装)
│   │   │   └── ...
│   │   ├── scripts/                      # 脚本工具
│   │   │   └── seed.js                  # 数据库种子数据
│   │   └── app.js                        # 应用入口
│   ├── .env                              # 环境变量
│   └── package.json
│
├── frontend/                             # 前端项目
│   ├── src/
│   │   ├── components/                   # 通用组件
│   │   ├── layouts/                      # 布局组件
│   │   │   ├── MainLayout.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/                        # 页面组件
│   │   │   ├── HomePage.tsx            # 首页
│   │   │   ├── ProductListPage.tsx     # 商品列表页
│   │   │   ├── ProductDetailPage.tsx   # 商品详情页
│   │   │   ├── CartPage.tsx            # 购物车页
│   │   │   ├── CheckoutPage.tsx       # 结算页
│   │   │   ├── OrderListPage.tsx       # 订单列表页
│   │   │   ├── OrderDetailPage.tsx     # 订单详情页
│   │   │   ├── LoginPage.tsx           # 登录页
│   │   │   ├── RegisterPage.tsx        # 注册页
│   │   │   ├── UserCenterPage.tsx     # 用户中心
│   │   │   └── NotFoundPage.tsx       # 404 页面
│   │   ├── services/                     # API 服务层
│   │   │   ├── api.ts                   # Axios 实例封装
│   │   │   ├── auth.api.ts             # 认证 API
│   │   │   ├── product.api.ts          # 商品 API
│   │   │   ├── cart.api.ts             # 购物车 API
│   │   │   └── order.api.ts            # 订单 API
│   │   ├── stores/                       # 状态管理 (Zustand)
│   │   │   ├── auth.store.ts           # 认证状态
│   │   │   └── cart.store.ts           # 购物车状态
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md                            # 项目说明文档
```

---

## 🔑 核心功能实现

### 1. 用户认证系统

#### 功能描述
- 用户注册、登录、登出
- 双令牌机制（Access Token + Refresh Token）
- Token 黑名单（强制登出）
- 登录失败锁定（防暴力破解）

#### 关键代码解析

**JWT 双令牌机制**
```javascript
// 生成 Access Token（短期令牌，2小时）
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
};

// 生成 Refresh Token（长期令牌，7天）
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};
```

**密码加密**
```javascript
// Schema 预处理钩子 - 保存前自动加密
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);  // 12轮盐值
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};
```

---

### 2. 商品系统

#### 功能描述
- 商品 CRUD（管理员）
- 多级分类（最多3级）
- 全文搜索 + 多条件筛选
- SKU 多规格管理
- 商品推荐（热销、新品）

#### 关键代码解析

**商品全文检索**
```javascript
// Schema 中创建 text 索引
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    text: true,           // 创建 text 索引
    index: true
  },
  searchKeywords: [{
    type: String,
    text: true
  }]
});

// 搜索时使用 $text 操作符
if (keyword) {
  query.$text = { $search: keyword };
}
```
**SKU 多规格设计**
```javascript
// SKU 子文档结构
const skuSchema = new mongoose.Schema({
  specCombination: [{
    name: { type: String },  // 规格名：颜色
    value: { type: String }  // 规格值：红色
  }],
  skuCode: { type: String, unique: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true }
});

// 商品级规格定义
specs: [{
  name: '颜色',
  values: ['红色', '蓝色', '黑色']
}]
```
**多级分类树**
```javascript
// 自引用实现多级分类
const categorySchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',    // 指向自身
    default: null
  },
  level: { type: Number, min: 0, max: 2 }  // 层级限制
});

// 虚拟字段获取子分类
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

// 构建分类树静态方法
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find().sort({ level: 1, sort: 1 });
  const tree = [];
  const map = {};
  categories.forEach(cat => map[cat._id] = { ...cat, children: [] });
  categories.forEach(cat => {
    if (cat.parentId) {
      map[cat.parentId].children.push(map[cat._id]);
    } else {
      tree.push(map[cat._id]);
    }
  });
  return tree;
};
```

---

### 3. 购物车系统

#### 功能描述
- 添加/删除/修改购物车项
- 批量选中/取消选中
- 实时计算总价
- 购物车持久化

#### 关键代码解析

**购物车 Schema 设计**
```javascript
const cartSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', unique: true },
  items: [{
    productId: { type: ObjectId, ref: 'Product' },
    skuCode: String,
    name: String,        // 商品名快照
    price: Number,       // 价格快照
    quantity: Number,
    selected: Boolean,
    specInfo: [{ name: String, value: String }]
  }]
});

// 虚拟字段计算总价
cartSchema.virtual('selectedTotal').get(function() {
  return this.items
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);
});
```
---

### 4. 订单系统

#### 功能描述
- 下单结算（从购物车到订单）
- 订单状态管理（状态机）
- 库存扣减（原子操作）
- 订单超时自动取消
- 模拟支付流程

#### 关键代码解析

**订单状态机**
```javascript
// 订单状态枚举
enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',   // 待支付
  PENDING_SHIPMENT = 'pending_shipment', // 待发货
  PENDING_RECEIPT = 'pending_receipt',   // 待收货
  COMPLETED = 'completed',               // 已完成
  CANCELLED = 'cancelled',               // 已取消
}

// 状态流转规则
const validTransitions = {
  pending_payment: ['pending_shipment', 'cancelled'],
  pending_shipment: ['pending_receipt', 'cancelled'],
  pending_receipt: ['completed'],
  completed: ['cancelled']
};

// 状态迁移方法
orderSchema.methods.transitionTo = async function(newStatus) {
  const allowed = validTransitions[this.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(`无效的状态流转: ${this.status} -> ${newStatus}`);
  }
  this.status = newStatus;
  this.timeline.push({ status: newStatus, timestamp: new Date() });
  return this.save();
};
```

**事务保证数据一致性**
```javascript
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    
    // 1. 扣减库存
    await Product.deductStock(productId, skuCode, quantity, session);
    
    // 2. 创建订单
    const order = new Order({ ...orderData });
    await order.save({ session });
    
    // 3. 清除购物车
    await Cart.updateOne(
      { _id: cartId },
      { $pull: { items: { _id: { $in: itemIds } } } },
      { session }
    );
    
    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
};
```
**订单超时自动取消**
```javascript
// TTL 索引实现自动过期
orderSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

// 创建订单时设置过期时间
order.expireAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后

// 状态变更为已支付时清除过期
orderSchema.methods.transitionTo = async function(newStatus) {
  if (newStatus === 'pending_shipment') {
    this.expireAt = null;  // 已支付，取消过期
  }
  // ...
};
```
**库存扣减原子操作**
```javascript
productSchema.statics.deductStock = async function(productId, skuCode, quantity) {
  // 使用 findOneAndUpdate + arrayFilters 实现乐观锁
  const product = await this.findOneAndUpdate(
    {
      _id: productId,
      status: 'on',
      'skus.skuCode': skuCode,
      'skus.stock': { $gte: quantity }  // 库存检查
    },
    {
      $inc: {
        'skus.$[sku].stock': -quantity,  // 原子扣减
        salesCount: quantity
      }
    },
    {
      arrayFilters: [{ 'sku.skuCode': skuCode }],
      new: true
    }
  );
  
  if (!product) {
    throw new Error('库存不足或商品已下架');
  }
  return product;
};
```

---

### 5. 缓存策略

#### 缓存层级
```
请求 → 检查 Redis 缓存 → 命中？→ 返回缓存
                         ↓ 未命中
                    查询 MongoDB
                         ↓
                    写入 Redis 缓存
                         ↓
                    返回数据
```

#### 缓存实现
```javascript
class CacheService {
  // 设置缓存（支持过期时间）
  static async set(key, value, ttl = 3600) {
    const serialized = JSON.stringify(value);
    await redisClient.setEx(key, ttl, serialized);
  }
  
  // 获取缓存
  static async get(key) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  // 模式匹配删除（用于缓存更新时批量清除）
  static async delByPattern(pattern) {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(keys);
  }
}
```

#### 缓存场景
| 缓存 Key | 过期时间 | 说明 |
|----------|---------|------|
| `product:{id}` | 5 分钟 | 商品详情缓存 |
| `products:recommended:{limit}` | 10 分钟 | 推荐商品缓存 |
| `categories:tree` | 30 分钟 | 分类树缓存 |
| `blacklist:{token}` | Token 剩余有效期 | Token 黑名单 |



---

## 🚀 部署指南

### 本地开发环境

#### 1. 环境要求
- Node.js >= 18
- MongoDB >= 6.0
- Redis >= 6.0

#### 2. 启动后端
```bash
cd backend
npm install
npm run seed          # 初始化示例数据
npm run dev           # 启动开发服务器 (端口 3000)
```

#### 3. 启动前端
```bash
cd frontend
npm install
npm run dev           # 启动开发服务器 (端口 5173)
```

#### 4. 访问系统
- 前端地址：http://localhost:5173
- 后端 API：http://localhost:3000/api/v1
- 测试账号：testuser / Test123456

### API 接口文档

#### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/logout | 用户登出 |
| POST | /api/v1/auth/refresh | 刷新令牌 |
| GET | /api/v1/auth/verify | 验证令牌 |

#### 商品接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/products | 商品列表 |
| GET | /api/v1/products/:id | 商品详情 |
| GET | /api/v1/products/recommended | 推荐商品 |
| GET | /api/v1/categories | 分类列表 |

#### 购物车接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/cart | 获取购物车 |
| POST | /api/v1/cart | 添加商品 |
| PUT | /api/v1/cart/:itemId | 更新数量 |
| DELETE | /api/v1/cart/:itemId | 删除商品 |

#### 订单接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/orders | 创建订单 |
| GET | /api/v1/orders | 订单列表 |
| GET | /api/v1/orders/:id | 订单详情 |
| PUT | /api/v1/orders/:id/cancel | 取消订单 |
| POST | /api/v1/orders/:id/pay | 支付订单 |
| PUT | /api/v1/orders/:id/receive | 确认收货 |


---

## 📎 附：技术选型决策记录

| 决策点 | 选项 | 选择 | 理由 |
|--------|------|------|------|
| 数据库 | MySQL vs MongoDB | MongoDB | 文档型数据、灵活 Schema |
| 缓存 | 无 vs Redis | Redis | 高性能、丰富数据结构 |
| 认证 | Session vs JWT | JWT | 无状态、易扩展 |
| 前端框架 | Vue vs React | React | 生态成熟、Hooks 灵活 |
| 构建工具 | Webpack vs Vite | Vite | 极速 HMR、配置简洁 |
| CSS 方案 | CSS-in-JS vs Tailwind | Tailwind | 原子化、高性能 |
| 状态管理 | Redux vs Zustand | Zustand | 轻量、API 简洁 |

---

**文档版本**：v1.0  
**创建日期**：2026-08-25  
**适用项目**：宝宝商城 v1.0