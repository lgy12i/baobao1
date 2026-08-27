/**
 * 数据分析控制器
 *
 * 功能：
 * 1. 销售统计（总销售额、订单数、客单价）
 * 2. 商品热度排行
 * 3. 用户行为分析
 * 4. 订单趋势分析
 * 5. 分类销售占比
 */
const store = require('../config/memory-store');
const { asyncHandler } = require('../middleware/error.middleware');

// 获取销售统计总览
async function getSalesOverview(req, res) {
  const orders = Array.from(store.orders.values());
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'pending_receipt');

  const totalSales = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const completedCount = completedOrders.length;
  const avgOrderValue = completedCount > 0 ? totalSales / completedCount : 0;

  // 今日数据
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 昨日数据
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const yesterdayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === yesterday);
  const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 环比增长率
  const salesGrowth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1) : 0;
  const orderGrowth = yesterdayOrders.length > 0 ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(1) : 0;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      totalSales: Number(totalSales.toFixed(2)),
      totalOrders,
      completedOrders: completedCount,
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      today: {
        sales: Number(todaySales.toFixed(2)),
        orders: todayOrders.length,
        salesGrowth: Number(salesGrowth),
        orderGrowth: Number(orderGrowth)
      },
      yesterday: {
        sales: Number(yesterdaySales.toFixed(2)),
        orders: yesterdayOrders.length
      }
    }
  });
}

// 商品热度排行
async function getProductRanking(req, res) {
  const products = Array.from(store.products.values());
  const { limit = 10, sortBy = 'salesCount' } = req.query;

  const sorted = products
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    .slice(0, Number(limit))
    .map(p => ({
      _id: p._id,
      name: p.name,
      brand: p.brand || '',
      price: p.price,
      originalPrice: p.originalPrice,
      salesCount: p.salesCount || 0,
      favoriteCount: p.favoriteCount || 0,
      category: (() => {
        const cat = store.categories.get(p.categoryId);
        return cat ? cat.name : '未分类';
      })(),
      rating: 4.5 + Math.random() * 0.5,
      conversionRate: Number((Math.random() * 15 + 5).toFixed(1))
    }));

  res.json({
    code: 200,
    message: '获取成功',
    data: { products: sorted, total: products.length }
  });
}

// 订单趋势分析（近7天）
async function getOrderTrend(req, res) {
  const orders = Array.from(store.orders.values());
  const days = 7;
  const trend = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const dateStr = date.toDateString();
    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === dateStr);
    const daySales = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    trend.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      sales: Number(daySales.toFixed(2)),
      orders: dayOrders.length,
      avgValue: dayOrders.length > 0 ? Number((daySales / dayOrders.length).toFixed(2)) : 0
    });
  }

  // 状态分布
  const statusCount = {};
  orders.forEach(o => {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;
  });

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      trend,
      statusDistribution: {
        pending_payment: statusCount['pending_payment'] || 0,
        pending_shipment: statusCount['pending_shipment'] || 0,
        pending_receipt: statusCount['pending_receipt'] || 0,
        completed: statusCount['completed'] || 0,
        cancelled: statusCount['cancelled'] || 0
      },
      totalOrders: orders.length,
      totalSales: Number(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2))
    }
  });
}

// 分类销售占比
async function getCategoryStats(req, res) {
  const products = Array.from(store.products.values());
  const categories = Array.from(store.categories.values());
  const orders = Array.from(store.orders.values());

  const categoryStats = categories.map(cat => {
    const catProducts = products.filter(p => p.categoryId === cat._id);
    const productCount = catProducts.length;
    const totalSales = catProducts.reduce((sum, p) => sum + (p.salesCount || 0) * (p.price || 0), 0);
    const totalStock = catProducts.reduce((sum, p) => {
      const stock = (p.skus || []).reduce((s, sku) => s + (sku.stock || 0), 0);
      return sum + stock;
    }, 0);

    return {
      _id: cat._id,
      name: cat.name,
      icon: cat.icon || '📦',
      productCount,
      totalSales: Number(totalSales.toFixed(2)),
      totalStock,
      avgPrice: productCount > 0 ? Number((catProducts.reduce((s, p) => s + p.price, 0) / productCount).toFixed(2)) : 0,
      salesPercentage: 0
    };
  }).filter(c => c.productCount > 0);

  // 计算占比
  const grandTotal = categoryStats.reduce((sum, c) => sum + c.totalSales, 0);
  categoryStats.forEach(c => {
    c.salesPercentage = grandTotal > 0 ? Number((c.totalSales / grandTotal * 100).toFixed(1)) : 0;
  });
  categoryStats.sort((a, b) => b.totalSales - a.totalSales);

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      categories: categoryStats,
      grandTotal: Number(grandTotal.toFixed(2)),
      totalProducts: products.length,
      totalCategories: categoryStats.length
    }
  });
}

// 用户行为分析
async function getUserBehavior(req, res) {
  const users = Array.from(store.users.values());
  const orders = Array.from(store.orders.values());
  const products = Array.from(store.products.values());

  // 活跃用户（有订单记录）
  const activeUsers = users.filter(u => orders.some(o => o.userId === u._id));

  // 用户消费等级分布
  const userLevels = {
    new: 0,      // 新用户（0订单）
    light: 0,    // 轻度用户（1-3订单）
    medium: 0,   // 中度用户（4-10订单）
    heavy: 0     // 重度用户（10+订单）
  };

  users.forEach(u => {
    const userOrders = orders.filter(o => o.userId === u._id);
    if (userOrders.length === 0) userLevels.new++;
    else if (userOrders.length <= 3) userLevels.light++;
    else if (userOrders.length <= 10) userLevels.medium++;
    else userLevels.heavy++;
  });

  // 热门搜索关键词模拟
  const hotKeywords = [
    { keyword: '咒术回战', count: 3421, trend: 'up' },
    { keyword: '机械键盘', count: 2156, trend: 'up' },
    { keyword: 'iPhone', count: 1892, trend: 'down' },
    { keyword: '手办', count: 1567, trend: 'up' },
    { keyword: '盲盒', count: 1342, trend: 'up' },
    { keyword: '运动鞋', count: 987, trend: 'down' },
    { keyword: '护肤品', count: 856, trend: 'up' },
    { keyword: '零食', count: 743, trend: 'stable' }
  ];

  // 转化漏斗
  const funnel = {
    visitors: 15678,
    productViews: 8923,
    addToCart: 3456,
    checkout: 1567,
    purchase: 892,
    conversionRate: Number((892 / 15678 * 100).toFixed(2))
  };

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      userStats: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        newUsers: userLevels.new,
        userLevels,
        avgOrdersPerUser: users.length > 0 ? Number((orders.length / users.length).toFixed(2)) : 0
      },
      hotKeywords,
      funnel,
      topProducts: products
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 5)
        .map(p => ({ name: p.name, sales: p.salesCount, views: Math.floor((p.salesCount || 0) * 8.5) }))
    }
  });
}

module.exports = {
  getSalesOverview,
  getProductRanking,
  getOrderTrend,
  getCategoryStats,
  getUserBehavior
};