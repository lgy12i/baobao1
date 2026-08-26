/**
 * 扩展种子数据
 *
 * 在原 memory-store.seedData() 之后调用，追加：
 *  1. 新增分类：二次元周边、游戏动漫、图书文娱、汽车用品、母婴亲子
 *  2. 咒术回战联名周边（手办、T恤、挂件、钥匙扣）
 *  3. 各品类商品补充（数码/家居/美妆/运动/食品）
 *
 * 用法：
 *   const seedExtra = require('./scripts/seed-extra');
 *   await store.initialize();
 *   await seedExtra(store);
 */
module.exports = async function seedExtra(store) {
  // ============ 新增一级分类 ============
  const newCategories = [
    { name: '二次元周边', level: 0, sort: 11, icon: '🧿' },
    { name: '游戏动漫',   level: 0, sort: 12, icon: '🎮' },
    { name: '图书文娱',   level: 0, sort: 13, icon: '📚' },
    { name: '汽车用品',   level: 0, sort: 14, icon: '🚗' },
    { name: '母婴亲子',   level: 0, sort: 15, icon: '🍼' }
  ];

  const createdCats = {};
  for (const cat of newCategories) {
    // 已存在则跳过
    const exists = Array.from(store.categories.values()).find((c) => c.name === cat.name);
    if (exists) {
      createdCats[cat.name] = exists;
      continue;
    }
    const c = await store.createCategory(cat);
    createdCats[cat.name] = c;
  }

  // ============ 咒术回战周边（核心扩展）============
  const jjkCat = createdCats['二次元周边'];
  const jjkProducts = [
    {
      name: '【咒术回战联名】五条悟 Q版 PVC 手办 10cm',
      brand: 'Banpresto',
      description: '咒术回战五条悟 Q版手办，PVC 材质，高约 10cm，官方正版授权。细节精致，配色鲜艳，附带底座。',
      categoryId: jjkCat._id,
      price: 128,
      originalPrice: 199,
      mainImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
      images: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400'],
      tags: ['新品', '热销', '限量', '联名'],
      skus: [{ skuCode: 'JJK-001', price: 128, stock: 50, specCombination: [{ name: '款式', value: '五条悟' }] }],
      specs: [{ name: '款式', values: ['五条悟', '虎杖悠仁', '伏黑惠'] }],
      salesCount: 4521
    },
    {
      name: '【咒术回战联名】咒术高专 短袖T恤 夏季款',
      brand: 'Aniplex',
      description: '咒术回战联名短袖T恤，纯棉材质，胸前印有咒术高专校徽图案。男女同款，多色可选。',
      categoryId: jjkCat._id,
      price: 99,
      originalPrice: 159,
      mainImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
      tags: ['新品', '热销', '包邮'],
      skus: [{ skuCode: 'JJK-002', price: 99, stock: 200, specCombination: [{ name: '尺码', value: 'M' }] }],
      specs: [{ name: '尺码', values: ['S', 'M', 'L', 'XL', 'XXL'] }, { name: '颜色', values: ['黑色', '白色', '深蓝'] }],
      salesCount: 6892
    },
    {
      name: '【咒术回战】虎杖悠仁 毛绒挂件 15cm',
      brand: 'MegaHouse',
      description: '虎杖悠仁毛绒挂件，柔软亲肤材质，可挂书包/钥匙。高约 15cm，可爱 Q版造型。',
      categoryId: jjkCat._id,
      price: 39,
      originalPrice: 59,
      mainImage: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=400',
      images: ['https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=400'],
      tags: ['热销', '可爱', '包邮'],
      skus: [{ skuCode: 'JJK-003', price: 39, stock: 300, specCombination: [{ name: '款式', value: '虎杖悠仁' }] }],
      specs: [{ name: '款式', values: ['虎杖悠仁', '五条悟', '伏黑惠', '钉崎野蔷薇'] }],
      salesCount: 8932
    },
    {
      name: '【咒术回战】伏黑惠 金属钥匙扣 二面狗',
      brand: '东映动画',
      description: '伏黑惠两面宿傩主题金属钥匙扣，锌合金材质，烤漆工艺，耐磨不掉色。直径约 4cm。',
      categoryId: jjkCat._id,
      price: 25,
      originalPrice: 39,
      mainImage: 'https://images.unsplash.com/photo-1577563908414-6e9b5e684b8a?w=400',
      images: ['https://images.unsplash.com/photo-1577563908414-6e9b5e684b8a?w=400'],
      tags: ['热销', '精美'],
      skus: [{ skuCode: 'JJK-004', price: 25, stock: 500, specCombination: [{ name: '款式', value: '伏黑惠' }] }],
      specs: [{ name: '款式', values: ['伏黑惠', '五条悟', '虎杖悠仁', '钉崎野蔷薇', '两面宿傩'] }],
      salesCount: 12450
    },
    {
      name: '【咒术回战】七海建人 亚克力立牌 18cm',
      brand: 'A3',
      description: '七海建人亚克力立牌，高约 18cm，高清 UV 印刷，附带亚克力底座。办公桌/书桌摆件。',
      categoryId: jjkCat._id,
      price: 68,
      originalPrice: 98,
      mainImage: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd8b4c5?w=400',
      images: ['https://images.unsplash.com/photo-1612036782180-6f0b6cd8b4c5?w=400'],
      tags: ['新品', '精美'],
      skus: [{ skuCode: 'JJK-005', price: 68, stock: 100, specCombination: [{ name: '款式', value: '七海建人' }] }],
      specs: [{ name: '款式', values: ['七海建人', '五条悟', '虎杖悠仁', '伏黑惠'] }],
      salesCount: 2341
    }
  ];

  for (const p of jjkProducts) {
    // 避免重复
    const exists = Array.from(store.products.values()).find((x) => x.name === p.name);
    if (!exists) await store.createProduct(p);
  }

  // ============ 其他品类补充商品 ============
  const catByName = (name) => {
    const c = Array.from(store.categories.values()).find((x) => x.name === name);
    return c;
  };

  const extraProducts = [
    // 数码电器
    {
      name: '罗技 G Pro X 机械键盘 RGB 霓虹版',
      brand: 'Logitech',
      description: 'RGB 霓虹灯效机械键盘，TTC 红轴，87键紧凑布局，Type-C 可换线设计。',
      categoryId: catByName('数码电器')?._id,
      price: 899, originalPrice: 1199,
      mainImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
      tags: ['新品', '热销', 'RGB'], salesCount: 3214,
      skus: [{ skuCode: 'KB-001', price: 899, stock: 80, specCombination: [{ name: '轴体', value: 'TTC红轴' }] }],
      specs: [{ name: '轴体', values: ['TTC红轴', 'TTC茶轴', 'TTC银轴'] }]
    },
    {
      name: 'Apple AirPods Pro 2 USB-C 主动降噪',
      brand: 'Apple',
      description: 'AirPods Pro 第二代，主动降噪，自适应透明模式，USB-C 充电盒。',
      categoryId: catByName('数码电器')?._id,
      price: 1599, originalPrice: 1899,
      mainImage: 'https://images.unsplash.com/photo-1606220945150-41889cdc1b85?w=400',
      tags: ['新品', '旗舰'], salesCount: 8921,
      skus: [{ skuCode: 'AP-001', price: 1599, stock: 150, specCombination: [{ name: '版本', value: '标准版' }] }],
      specs: []
    },
    {
      name: '小米 13 Ultra 徕卡光学全焦段四摄',
      brand: '小米',
      description: '徕卡光学全焦段四摄，骁龙8 Gen3，2K DOLBY 屏幕，IP68 防水。',
      categoryId: catByName('数码电器')?._id,
      price: 5999, originalPrice: 6499,
      mainImage: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
      tags: ['新品', '旗舰', '分期免息'], salesCount: 4521,
      skus: [{ skuCode: 'MI-001', price: 5999, stock: 60, specCombination: [{ name: '版本', value: '12+256G' }] }],
      specs: [{ name: '版本', values: ['12+256G', '16+512G', '16+1T'] }]
    },
    // 服装鞋帽
    {
      name: 'Nike Air Force 1 经典低帮板鞋 白色',
      brand: 'Nike',
      description: 'Air Force 1 经典低帮板鞋，真皮鞋面，橡胶大底，复古百搭。',
      categoryId: catByName('服装鞋帽')?._id,
      price: 699, originalPrice: 899,
      mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      tags: ['热销', '经典', '包邮'], salesCount: 15623,
      skus: [{ skuCode: 'NK-001', price: 699, stock: 200, specCombination: [{ name: '尺码', value: '42' }] }],
      specs: [{ name: '尺码', values: ['39', '40', '41', '42', '43', '44'] }]
    },
    {
      name: 'UNIQLO 摇粒绒开衫外套 秋季百搭',
      brand: 'UNIQLO',
      description: '优衣库摇粒绒开衫，柔软保暖，秋季百搭单品。',
      categoryId: catByName('服装鞋帽')?._id,
      price: 199, originalPrice: 249,
      mainImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
      tags: ['热销', '包邮'], salesCount: 6789,
      skus: [{ skuCode: 'UQ-001', price: 199, stock: 300, specCombination: [{ name: '尺码', value: 'L' }] }],
      specs: [{ name: '尺码', values: ['S', 'M', 'L', 'XL'] }, { name: '颜色', values: ['深灰', '卡其', '藏青'] }]
    },
    // 家居家装
    {
      name: '飞利浦 智能霓虹氛围灯 5m RGB',
      brand: 'Philips',
      description: '飞利浦智能霓虹氛围灯带，5米长，1600万色，APP 控制，语音助手兼容。',
      categoryId: catByName('家居家装')?._id,
      price: 299, originalPrice: 499,
      mainImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400',
      tags: ['新品', '智能', '霓虹'], salesCount: 4521,
      skus: [{ skuCode: 'PH-001', price: 299, stock: 200, specCombination: [{ name: '长度', value: '5m' }] }],
      specs: [{ name: '长度', values: ['2m', '5m', '10m'] }]
    },
    {
      name: '懒人沙发 木耳边豆袋 卧室客厅',
      brand: '宜家',
      description: '懒人沙发豆袋，高密度 EPP 填充，木耳边造型，多色可选。',
      categoryId: catByName('家居家装')?._id,
      price: 399, originalPrice: 599,
      mainImage: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400',
      tags: ['热销', '包邮'], salesCount: 2341,
      skus: [{ skuCode: 'IK-001', price: 399, stock: 80, specCombination: [{ name: '颜色', value: '灰色' }] }],
      specs: [{ name: '颜色', values: ['灰色', '粉色', '深蓝'] }]
    },
    // 美妆个护
    {
      name: '兰蔻 小黑瓶 精华肌底液 50ml',
      brand: '兰蔻',
      description: '兰蔻小黑瓶精华肌底液，修护肌肤，焕亮肤色。',
      categoryId: catByName('美妆个护')?._id,
      price: 980, originalPrice: 1280,
      mainImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
      tags: ['热销', '明星产品'], salesCount: 6789,
      skus: [{ skuCode: 'LC-001', price: 980, stock: 100, specCombination: [{ name: '规格', value: '50ml' }] }],
      specs: [{ name: '规格', values: ['30ml', '50ml', '100ml'] }]
    },
    // 食品生鲜
    {
      name: '云南冰糖心苹果 5斤装 当季新鲜',
      brand: '果郡王',
      description: '云南冰糖心苹果，脆甜多汁，5 斤装当季新鲜。',
      categoryId: catByName('食品生鲜')?._id,
      price: 49.9, originalPrice: 79,
      mainImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
      tags: ['包邮', '新鲜直达'], salesCount: 12345,
      skus: [{ skuCode: 'FG-002', price: 49.9, stock: 500, specCombination: [{ name: '规格', value: '5斤装' }] }],
      specs: [{ name: '规格', values: ['5斤装', '10斤装'] }]
    },
    // 运动户外
    {
      name: '迪卡侬 跑步机 家用静音折叠',
      brand: 'Decathlon',
      description: '迪卡侬家用静音折叠跑步机，电动坡度，APP 互联。',
      categoryId: catByName('运动户外')?._id,
      price: 2199, originalPrice: 2999,
      mainImage: 'https://images.unsplash.com/photo-1538805060514-8d10184ccc76?w=400',
      tags: ['热销', '智能'], salesCount: 1234,
      skus: [{ skuCode: 'DC-001', price: 2199, stock: 30, specCombination: [{ name: '版本', value: '标准版' }] }],
      specs: []
    },
    // 游戏动漫
    {
      name: 'Sony PlayStation 5 国行光驱版',
      brand: 'Sony',
      description: 'PS5 国行光驱版，超高速 SSD，4K 120Hz 游戏，3D 音效。',
      categoryId: catByName('游戏动漫')?._id,
      price: 3899, originalPrice: 4299,
      mainImage: 'https://images.unsplash.com/photo-1606874258241-3b94f6c3c7c4?w=400',
      tags: ['新品', '热销', '旗舰'], salesCount: 5678,
      skus: [{ skuCode: 'PS-001', price: 3899, stock: 50, specCombination: [{ name: '版本', value: '光驱版' }] }],
      specs: [{ name: '版本', values: ['光驱版', '数字版'] }]
    },
    {
      name: '任天堂 Switch OLED 续航增强版',
      brand: 'Nintendo',
      description: 'Switch OLED 版，7英寸 OLED 屏，64GB 存储，增强续航。',
      categoryId: catByName('游戏动漫')?._id,
      price: 2399, originalPrice: 2599,
      mainImage: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3d?w=400',
      tags: ['热销', '便携'], salesCount: 8923,
      skus: [{ skuCode: 'NS-001', price: 2399, stock: 80, specCombination: [{ name: '颜色', value: '白色' }] }],
      specs: [{ name: '颜色', values: ['白色', '红色蓝色'] }]
    },
    // 图书文娱
    {
      name: '《咒术回战》原作漫画 1-20册 套装',
      brand: '集英社',
      description: '芥见下下著《咒术回战》原作漫画 1-20 册套装，中文正版引进。',
      categoryId: catByName('图书文娱')?._id,
      price: 299, originalPrice: 400,
      mainImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      tags: ['热销', '套装'], salesCount: 1567,
      skus: [{ skuCode: 'BK-001', price: 299, stock: 100, specCombination: [{ name: '套装', value: '1-20册' }] }],
      specs: []
    },
    // 母婴亲子
    {
      name: '好奇 铂金装纸尿裤 NB76 新生儿',
      brand: 'Huggies',
      description: '好奇铂金装纸尿裤，NB 码 76 片，新生儿专用，柔软透气。',
      categoryId: catByName('母婴亲子')?._id,
      price: 199, originalPrice: 259,
      mainImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
      tags: ['热销', '包邮'], salesCount: 8923,
      skus: [{ skuCode: 'HG-001', price: 199, stock: 300, specCombination: [{ name: '尺码', value: 'NB' }] }],
      specs: [{ name: '尺码', values: ['NB', 'S', 'M', 'L', 'XL'] }]
    },
    // 汽车用品
    {
      name: '70迈 行车记录仪 4K 夜视',
      brand: '70迈',
      description: '70迈 4K 行车记录仪，索尼传感器，夜视清晰，APP 互联。',
      categoryId: catByName('汽车用品')?._id,
      price: 499, originalPrice: 699,
      mainImage: 'https://images.unsplash.com/photo-1597007030739-6d2e7172ee2f?w=400',
      tags: ['新品', '热销'], salesCount: 2341,
      skus: [{ skuCode: 'DD-001', price: 499, stock: 100, specCombination: [{ name: '版本', value: '4K' }] }],
      specs: [{ name: '版本', values: ['1080P', '2K', '4K'] }]
    }
  ];

  for (const p of extraProducts) {
    if (!p.categoryId) continue; // 分类不存在则跳过
    const exists = Array.from(store.products.values()).find((x) => x.name === p.name);
    if (!exists) await store.createProduct(p);
  }

  console.log(`  ✓ 扩展数据已加载：咒术回战周边 ${jjkProducts.length} 件，其他商品 ${extraProducts.length} 件`);
};
