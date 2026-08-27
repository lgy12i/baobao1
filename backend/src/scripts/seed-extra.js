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

  // ============ 第三轮：更多品类扩展 ============
  const moreProducts = [
    // 潮玩盲盒
    {
      name: 'POP MART Skullpanda 密林古堡系列盲盒',
      brand: 'POP MART',
      description: 'Skullpanda密林古堡系列盲盒，12款+1隐藏款，做工精致，收藏佳品。',
      categoryId: catByName('二次元周边')?._id,
      price: 59, originalPrice: 79,
      mainImage: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd8b4c5?w=400',
      tags: ['新品', '热销', '盲盒'], salesCount: 15623,
      skus: [{ skuCode: 'PM-001', price: 59, stock: 500, specCombination: [{ name: '款式', value: '随机' }] }],
      specs: [{ name: '款式', values: ['随机', '整套12盒'] }]
    },
    {
      name: '泡泡玛特 DIMOO 太空旅行系列盲盒',
      brand: 'POP MART',
      description: 'DIMOO太空旅行系列盲盒，可爱治愈系，附赠卡片。',
      categoryId: catByName('二次元周边')?._id,
      price: 59, originalPrice: 79,
      mainImage: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=400',
      tags: ['热销', '盲盒'], salesCount: 8923,
      skus: [{ skuCode: 'PM-002', price: 59, stock: 300, specCombination: [{ name: '款式', value: '随机' }] }],
      specs: [{ name: '款式', values: ['随机', '整套12盒'] }]
    },
    // 数码配件
    {
      name: 'Anker 安克 65W GaN快充充电器 三口',
      brand: 'Anker',
      description: 'Anker 65W GaN氮化镓快充充电器，三口输出，支持PD/QC协议，MacBook/iPhone/Android通吃。',
      categoryId: catByName('数码电器')?._id,
      price: 199, originalPrice: 299,
      mainImage: 'https://images.unsplash.com/photo-1583865654750-6e9a8b6d4e3f?w=400',
      tags: ['新品', '热销', '快充'], salesCount: 4521,
      skus: [{ skuCode: 'AK-001', price: 199, stock: 200, specCombination: [{ name: '功率', value: '65W' }] }],
      specs: [{ name: '功率', values: ['30W', '45W', '65W', '100W'] }]
    },
    {
      name: '绿联 Type-C 扩展坞 9合1 USB3.0',
      brand: '绿联',
      description: '绿联Type-C扩展坞，9合1接口，HDMI 4K输出，PD快充，千兆网口。',
      categoryId: catByName('数码电器')?._id,
      price: 159, originalPrice: 229,
      mainImage: 'https://images.unsplash.com/photo-1625842241200-6f6d1b9c3b3e?w=400',
      tags: ['热销', '包邮'], salesCount: 6789,
      skus: [{ skuCode: 'UG-001', price: 159, stock: 150, specCombination: [{ name: '接口数', value: '9合1' }] }],
      specs: [{ name: '接口数', values: ['6合1', '9合1', '12合1'] }]
    },
    // 智能穿戴
    {
      name: '华为 Watch GT4 蓝牙通话智能手表',
      brand: '华为',
      description: '华为Watch GT4，蓝宝石玻璃，14天续航，蓝牙通话，100+运动模式。',
      categoryId: catByName('数码电器')?._id,
      price: 1488, originalPrice: 1888,
      mainImage: 'https://images.unsplash.com/photo-1546868871-704ed5a7d1c8?w=400',
      tags: ['新品', '旗舰', '分期免息'], salesCount: 3214,
      skus: [{ skuCode: 'HW-001', price: 1488, stock: 80, specCombination: [{ name: '表盘', value: '42mm' }] }],
      specs: [{ name: '表盘', values: ['42mm', '46mm'] }, { name: '颜色', values: ['黑色', '棕色', '绿色'] }]
    },
    {
      name: '小米手环8 NFC版 运动健康监测',
      brand: '小米',
      description: '小米手环8 NFC版，150+运动模式，心率血氧监测，NFC门禁公交。',
      categoryId: catByName('数码电器')?._id,
      price: 249, originalPrice: 299,
      mainImage: 'https://images.unsplash.com/photo-1606220945150-460a8d9b6b1e?w=400',
      tags: ['热销', '性价比'], salesCount: 12345,
      skus: [{ skuCode: 'MB-001', price: 249, stock: 500, specCombination: [{ name: '版本', value: 'NFC版' }] }],
      specs: [{ name: '版本', values: ['标准版', 'NFC版'] }]
    },
    // 家居生活
    {
      name: '戴森 V12 Detect Slim 无线吸尘器',
      brand: 'Dyson',
      description: '戴森V12 Detect Slim无线吸尘器，激光探测灰尘，LCD屏显，60分钟续航。',
      categoryId: catByName('家居家装')?._id,
      price: 4290, originalPrice: 4990,
      mainImage: 'https://images.unsplash.com/photo-1558317374-854a8b1f6b0e?w=400',
      tags: ['新品', '旗舰', '分期免息'], salesCount: 1234,
      skus: [{ skuCode: 'DY-001', price: 4290, stock: 50, specCombination: [{ name: '版本', value: '标准版' }] }],
      specs: []
    },
    {
      name: '小米米家 智能电饭煲 3L IH加热',
      brand: '小米',
      description: '米家智能电饭煲3L，IH电磁加热，APP远程控制，24小时预约。',
      categoryId: catByName('家居家装')?._id,
      price: 399, originalPrice: 499,
      mainImage: 'https://images.unsplash.com/photo-15855159592-8c5b1f5c8e3a?w=400',
      tags: ['热销', '智能'], salesCount: 4567,
      skus: [{ skuCode: 'MJ-001', price: 399, stock: 200, specCombination: [{ name: '容量', value: '3L' }] }],
      specs: [{ name: '容量', values: ['3L', '4L', '5L'] }]
    },
    // 美妆护肤
    {
      name: '雅诗兰黛 小棕瓶 精华 50ml',
      brand: '雅诗兰黛',
      description: '雅诗兰黛第七代小棕瓶精华，修护肌肤，抗老化，50ml大瓶装。',
      categoryId: catByName('美妆个护')?._id,
      price: 850, originalPrice: 1080,
      mainImage: 'https://images.unsplash.com/photo-1599733589047-1c1a8b59d9db?w=400',
      tags: ['热销', '明星产品', '包邮'], salesCount: 8923,
      skus: [{ skuCode: 'EL-001', price: 850, stock: 100, specCombination: [{ name: '规格', value: '50ml' }] }],
      specs: [{ name: '规格', values: ['30ml', '50ml', '100ml'] }]
    },
    {
      name: 'SK-II 神仙水 精华露 230ml',
      brand: 'SK-II',
      description: 'SK-II神仙水精华露，Pitera精华成分，改善肌肤纹理，提亮肤色。',
      categoryId: catByName('美妆个护')?._id,
      price: 1590, originalPrice: 1990,
      mainImage: 'https://images.unsplash.com/photo-1571781926291-c477eb93db2e?w=400',
      tags: ['热销', '旗舰', '分期免息'], salesCount: 3456,
      skus: [{ skuCode: 'SK-001', price: 1590, stock: 60, specCombination: [{ name: '规格', value: '230ml' }] }],
      specs: [{ name: '规格', values: ['75ml', '160ml', '230ml'] }]
    },
    // 运动健身
    {
      name: 'Lululemon Align 高腰瑜伽裤 25寸',
      brand: 'Lululemon',
      description: 'Lululemon Align高腰瑜伽裤，Nulu面料，裸感亲肤，25寸九分款。',
      categoryId: catByName('运动户外')?._id,
      price: 750, originalPrice: 950,
      mainImage: 'https://images.unsplash.com/photo-1506629905438-63c1ba76a4e7?w=400',
      tags: ['新品', '热销'], salesCount: 2345,
      skus: [{ skuCode: 'LL-001', price: 750, stock: 100, specCombination: [{ name: '尺码', value: 'M' }] }],
      specs: [{ name: '尺码', values: ['XS', 'S', 'M', 'L', 'XL'] }, { name: '颜色', values: ['黑色', '深灰', '藏青'] }]
    },
    {
      name: 'Keep 智能跑步机 K1 家用静音',
      brand: 'Keep',
      description: 'Keep K1智能跑步机，静音电机，APP互联，自动调坡，折叠收纳。',
      categoryId: catByName('运动户外')?._id,
      price: 1999, originalPrice: 2699,
      mainImage: 'https://images.unsplash.com/photo-1538805060514-8d10184ccc76?w=400',
      tags: ['热销', '智能'], salesCount: 1567,
      skus: [{ skuCode: 'KP-001', price: 1999, stock: 40, specCombination: [{ name: '版本', value: '标准版' }] }],
      specs: []
    },
    // 图书
    {
      name: '《三体》三部曲 刘慈欣科幻套装',
      brand: '重庆出版社',
      description: '刘慈欣《三体》三部曲完整套装，含《三体》《黑暗森林》《死神永生》，雨果奖作品。',
      categoryId: catByName('图书文娱')?._id,
      price: 98, originalPrice: 128,
      mainImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      tags: ['热销', '套装', '包邮'], salesCount: 6789,
      skus: [{ skuCode: 'BK-002', price: 98, stock: 200, specCombination: [{ name: '套装', value: '三部曲' }] }],
      specs: []
    },
    {
      name: '《人类简史》+《未来简史》 尤瓦尔赫拉利套装',
      brand: '中信出版社',
      description: '尤瓦尔赫拉利《人类简史》+《未来简史》套装，全球畅销百万册。',
      categoryId: catByName('图书文娱')?._id,
      price: 78, originalPrice: 98,
      mainImage: 'https://images.unsplash.com/photo-1535905557558-4486e3a1852e?w=400',
      tags: ['热销', '包邮'], salesCount: 4567,
      skus: [{ skuCode: 'BK-003', price: 78, stock: 150, specCombination: [] }],
      specs: []
    },
    // 食品
    {
      name: '三只松鼠 每日坚果 30袋装',
      brand: '三只松鼠',
      description: '三只松鼠每日坚果30袋装，混合果仁，每日一袋，营养均衡。',
      categoryId: catByName('食品生鲜')?._id,
      price: 89.9, originalPrice: 129,
      mainImage: 'https://images.unsplash.com/photo-1597304949098-9c8c38e0e6b8?w=400',
      tags: ['热销', '包邮', '新鲜'], salesCount: 15678,
      skus: [{ skuCode: 'SS-001', price: 89.9, stock: 500, specCombination: [{ name: '规格', value: '30袋' }] }],
      specs: [{ name: '规格', values: ['15袋', '30袋', '60袋'] }]
    },
    {
      name: '农夫山泉 东方树叶 茉莉花茶 500ml*15',
      brand: '农夫山泉',
      description: '东方树叶茉莉花茶，0糖0卡，天然茶叶萃取，500ml*15瓶整箱。',
      categoryId: catByName('食品生鲜')?._id,
      price: 59.9, originalPrice: 75,
      mainImage: 'https://images.unsplash.com/photo-1606220945150-460a8d9b6b1e?w=400',
      tags: ['热销', '整箱'], salesCount: 8923,
      skus: [{ skuCode: 'NF-001', price: 59.9, stock: 300, specCombination: [{ name: '口味', value: '茉莉花茶' }] }],
      specs: [{ name: '口味', values: ['茉莉花茶', '乌龙茶', '红茶', '绿茶'] }]
    },
    // 母婴
    {
      name: '布鲁可 大颗粒积木 百变工程车',
      brand: '布鲁可',
      description: '布鲁可大颗粒积木百变工程车系列，适合3-6岁儿童，锻炼动手能力。',
      categoryId: catByName('母婴亲子')?._id,
      price: 99, originalPrice: 149,
      mainImage: 'https://images.unsplash.com/photo-1558060370-d6441cd4d06f?w=400',
      tags: ['新品', '热销'], salesCount: 3456,
      skus: [{ skuCode: 'BL-001', price: 99, stock: 200, specCombination: [{ name: '款式', value: '工程车' }] }],
      specs: [{ name: '款式', values: ['工程车', '消防车', '警车'] }]
    },
    // 汽车用品
    {
      name: '小米 车载充电器 67W 双口快充',
      brand: '小米',
      description: '小米车载充电器67W双口快充，支持PD/QC协议，点烟器接口。',
      categoryId: catByName('汽车用品')?._id,
      price: 79, originalPrice: 99,
      mainImage: 'https://images.unsplash.com/photo-1583865654750-6e9a8b6d4e3f?w=400',
      tags: ['热销', '快充'], salesCount: 5678,
      skus: [{ skuCode: 'MC-001', price: 79, stock: 300, specCombination: [{ name: '功率', value: '67W' }] }],
      specs: [{ name: '功率', values: ['33W', '67W', '100W'] }]
    }
  ];

  for (const p of moreProducts) {
    if (!p.categoryId) continue;
    const exists = Array.from(store.products.values()).find((x) => x.name === p.name);
    if (!exists) await store.createProduct(p);
  }

  console.log(`  ✓ 扩展数据已加载：咒术回战周边 ${jjkProducts.length} 件，其他商品 ${extraProducts.length + moreProducts.length} 件，共计 ${jjkProducts.length + extraProducts.length + moreProducts.length} 件`);
};
