/**
 * 数据库种子脚本
 * 
 * 职责：初始化示例数据，方便开发和测试
 * 
 * 包含：
 * - 商品分类数据（参考淘宝分类结构）
 * - 示例商品数据
 * - 测试用户
 * 
 * 使用方法：node src/scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Cart = require('../models/cart.model');

// 分类数据（参考淘宝首页分类）
const categoriesData = [
  // 一级分类
  { name: '服装鞋帽', level: 0, sort: 1, icon: '👗' },
  { name: '数码电器', level: 0, sort: 2, icon: '📱' },
  { name: '家居家装', level: 0, sort: 3, icon: '🏠' },
  { name: '美妆个护', level: 0, sort: 4, icon: '💄' },
  { name: '食品生鲜', level: 0, sort: 5, icon: '🍎' },
  { name: '母婴亲子', level: 0, sort: 6, icon: '🍼' },
  { name: '运动户外', level: 0, sort: 7, icon: '⚽' },
  { name: '汽车用品', level: 0, sort: 8, icon: '🚗' },
  { name: '图书文娱', level: 0, sort: 9, icon: '📚' },
  { name: '游戏动漫', level: 0, sort: 10, icon: '🎮' }
];

// 二级分类映射
const subCategoriesMap = {
  '服装鞋帽': ['女装', '男装', '内衣', '鞋靴', '箱包', '配饰'],
  '数码电器': ['手机通讯', '电脑办公', '家用电器', '影音娱乐', '智能穿戴'],
  '家居家装': ['床上用品', '厨房用品', '收纳整理', '灯具灯饰', '装修建材'],
  '美妆个护': ['面部护肤', '彩妆', '香水', '身体护理', '美发护发'],
  '食品生鲜': ['休闲零食', '粮油调味', '南北干货', '生鲜果蔬', '酒水饮料'],
  '母婴亲子': ['奶粉', '辅食', '纸尿裤', '童装', '童鞋', '玩具'],
  '运动户外': ['运动鞋服', '健身器材', '户外装备', '骑行运动', '球类运动'],
  '汽车用品': ['汽车装饰', '汽车美容', '车载电器', '维修保养'],
  '图书文娱': ['文学小说', '童书绘本', '教辅教材', '艺术设计', '杂志期刊'],
  '游戏动漫': ['游戏机', '游戏软件', '动漫周边', '手办模型', '卡牌桌游']
};

// 示例商品模板
const productTemplates = [
  {
    name: '2026新款夏季连衣裙女法式复古',
    brand: '时尚佳人',
    price: 199.9,
    originalPrice: 399,
    categoryIndex: 0,  // 服装鞋帽
    subCategoryIndex: 0,  // 女装
    tags: ['新品', '热销', '包邮'],
    salesCount: 15680,
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400'
    ]
  },
  {
    name: 'Apple iPhone 15 Pro Max 256GB',
    brand: 'Apple',
    price: 9999,
    originalPrice: 10999,
    categoryIndex: 1,  // 数码电器
    subCategoryIndex: 0,  // 手机通讯
    tags: ['新品', '旗舰', '分期免息'],
    salesCount: 8923,
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400'
    ]
  },
  {
    name: '小米空气净化器Pro H 家用除甲醛',
    brand: '小米',
    price: 1499,
    originalPrice: 1999,
    categoryIndex: 1,  // 数码电器
    subCategoryIndex: 2,  // 家用电器
    tags: ['热销', '智能', '包邮'],
    salesCount: 5621,
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400'
    ]
  },
  {
    name: '兰蔻小黑瓶精华肌底液100ml',
    brand: 'Lancome/兰蔻',
    price: 1080,
    originalPrice: 1380,
    categoryIndex: 3,  // 美妆个护
    subCategoryIndex: 0,  // 面部护肤
    tags: ['专柜正品', '包邮', '买赠'],
    salesCount: 12345,
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'
    ]
  },
  {
    name: '三只松鼠每日坚果750g/30包',
    brand: '三只松鼠',
    price: 89.9,
    originalPrice: 128,
    categoryIndex: 4,  // 食品生鲜
    subCategoryIndex: 0,  // 休闲零食
    tags: ['热销', '包邮'],
    salesCount: 23456,
    images: [
      'https://images.unsplash.com/photo-1599599810694-b5b39304c041?w=400'
    ]
  },
  {
    name: 'Nike Air Zoom Pegasus 40 跑鞋',
    brand: 'Nike',
    price: 899,
    originalPrice: 1099,
    categoryIndex: 6,  // 运动户外
    subCategoryIndex: 0,  // 运动鞋服
    tags: ['新品', '包邮'],
    salesCount: 4567,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
    ]
  },
  {
    name: '戴森吹风机 HD15 负离子护发',
    brand: 'Dyson/戴森',
    price: 2990,
    originalPrice: 3490,
    categoryIndex: 1,  // 数码电器
    subCategoryIndex: 3,  // 影音娱乐
    tags: ['热销', '分期免息'],
    salesCount: 3456,
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400'
    ]
  },
  {
    name: '飞利浦电动牙刷HX2431',
    brand: 'Philips/飞利浦',
    price: 99,
    originalPrice: 199,
    categoryIndex: 3,  // 美妆个护
    subCategoryIndex: 3,  // 身体护理
    tags: ['特价', '包邮'],
    salesCount: 18765,
    images: [
      'https://images.unsplash.com/photo-1559591935-c6c92c6cbce4?w=400'
    ]
  }
];

/**
 * 种子数据初始化函数
 */
async function seed() {
  try {
    await connectDB();
    console.log('✓ MongoDB 连接成功\n');

    // 清除旧数据
    console.log('清除旧数据...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await Cart.deleteMany({});

    // 1. 创建一级分类
    console.log('创建分类数据...');
    const mainCategories = {};
    for (const catData of categoriesData) {
      const cat = await Category.create(catData);
      mainCategories[catData.name] = cat._id;
    }

    // 2. 创建二级分类
    const subCategories = {};
    for (const [parentName, subs] of Object.entries(subCategoriesMap)) {
      const parentId = mainCategories[parentName];
      subCategories[parentName] = [];
      
      for (let i = 0; i < subs.length; i++) {
        const sub = await Category.create({
          name: subs[i],
          parentId,
          level: 1,
          sort: i + 1
        });
        subCategories[parentName].push(sub._id);
      }
    }
    console.log(`  ✓ 创建了 ${categoriesData.length} 个一级分类`);
    console.log(`  ✓ 创建了 ${Object.values(subCategoriesMap).reduce((a, b) => a + b.length, 0)} 个二级分类`);

    // 3. 创建示例商品
    console.log('创建商品数据...');
    const createdProducts = [];
    
    for (const template of productTemplates) {
      const mainCatName = categoriesData[template.categoryIndex].name;
      const subCatId = subCategories[mainCatName]?.[template.subCategoryIndex];
      
      if (!subCatId) continue;

      const product = new Product({
        name: template.name,
        brand: template.brand,
        description: `${template.name} - 高品质保证，假一赔十，7天无理由退换`,
        categoryId: subCatId,
        categoryPath: [mainCategories[mainCatName], subCatId],
        price: template.price,
        originalPrice: template.originalPrice,
        mainImage: template.images[0],
        images: template.images,
        tags: template.tags,
        status: 'on',
        salesCount: template.salesCount,
        viewCount: Math.floor(Math.random() * 50000),
        favoriteCount: Math.floor(Math.random() * 2000),
        freeShipping: true,
        // 添加 SKU
        skus: [
          {
            specCombination: [{ name: '版本', value: '标准版' }],
            skuCode: `SKU_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            price: template.price,
            originalPrice: template.originalPrice,
            stock: Math.floor(Math.random() * 500) + 50,
            images: template.images
          }
        ],
        specs: [
          { name: '版本', values: ['标准版', '豪华版'] }
        ]
      });

      await product.save();
      createdProducts.push(product);

      // 更新分类商品数量
      await Category.findByIdAndUpdate(subCatId, { $inc: { productCount: 1 } });
    }
    console.log(`  ✓ 创建了 ${createdProducts.length} 个商品`);

    // 4. 创建测试用户
    console.log('创建测试用户...');
    const testUser = new User({
      username: 'testuser',
      email: 'test@taotao.com',
      password: 'Test123456',
      phone: '13800138000',
      nickname: '测试用户',
      role: 'user',
      status: 'active',
      addresses: [
        {
          receiver: '张三',
          phone: '13800138000',
          province: '浙江省',
          city: '杭州市',
          district: '西湖区',
          detail: '文三路 XX 号',
          isDefault: true
        }
      ]
    });
    await testUser.save();

    // 为测试用户创建购物车
    await Cart.create({ userId: testUser._id, items: [] });
    console.log('  ✓ 创建了测试用户（用户名: testuser，密码: Test123456）');

    console.log('\n═══════════════════════════════════');
    console.log('  种子数据初始化完成！');
    console.log('═══════════════════════════════════');
    console.log(`\n统计信息：`);
    console.log(`  - 分类：${categoriesData.length + Object.values(subCategoriesMap).reduce((a, b) => a + b.length, 0)} 个`);
    console.log(`  - 商品：${createdProducts.length} 个`);
    console.log(`  - 用户：1 个（testuser）`);
    
  } catch (error) {
    console.error('种子数据初始化失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已断开');
    process.exit(0);
  }
}

// 执行种子脚本
seed();
