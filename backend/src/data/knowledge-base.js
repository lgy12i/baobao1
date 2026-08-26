/**
 * RAG 知识库 · 关键词检索版（轻量 RAG）
 *
 * 设计：
 * 1. 维护一个商品/订单/活动相关的知识条目数组（每条带 keywords）
 * 2. 用户提问时，对问题做关键词命中检索，取出 top-K 相关条目
 * 3. 把命中的知识拼进 LLM prompt 作为 context（增强回答准确性）
 *
 * 对应面试讲解：
 *  - "为什么不用向量检索？" → 单机项目数据量小，关键词命中足够，避免引入向量数据库依赖
 *  - "如何演进？" → 数据量大后，可替换为 embeddings + 向量库（pgvector / Milvus）
 */

// ============ 知识条目 ============
const knowledge = [
  {
    id: 'kb_shipping',
    keywords: ['发货', '快递', '物流', '运费', '包邮', '几天到', '什么时候到', '配送'],
    content: '宝宝商城所有商品默认包邮，下单后 24 小时内发货，3-5 个工作日送达。偏远地区（新疆/西藏/青海）需补 10 元运费。'
  },
  {
    id: 'kb_return',
    keywords: ['退货', '退款', '换货', '售后', '七天', '无理由', '质量问题'],
    content: '商品支持 7 天无理由退货（不影响二次销售）。质量问题 15 天内包退换，运费由商城承担。生鲜/贴身衣物/定制商品不支持无理由退货。'
  },
  {
    id: 'kb_payment',
    keywords: ['支付', '支付宝', '微信', '银行卡', '分期', '花呗', '信用卡'],
    content: '支持支付宝、微信支付、银行卡、信用卡、花呗分期。花呗分期满 500 元可分 3/6/12 期，无手续费。'
  },
  {
    id: 'kb_coupon',
    keywords: ['优惠券', '券', '满减', '折扣', '活动', '补贴', '领券'],
    content: '优惠券在「优惠券中心」领取，下单时自动抵扣。新人专享券满 299 减 50；全品类满 99 减 20；数码大额满 1299 减 200。'
  },
  {
    id: 'kb_seckill',
    keywords: ['秒杀', '限时', '抢购', '折扣', '闪购'],
    content: '限时秒杀每天 0 点更新，折扣低至 5 折，每人每件限购 1 件，售完即止。可在首页「限时秒杀」入口查看。'
  },
  {
    id: 'kb_groupbuy',
    keywords: ['拼团', '团购', '两人团', '邀请', '好友'],
    content: '拼团商品 2 人成团立享 8 折，发起后 24 小时内未成团自动退款。可在「拼团优惠」页发起。'
  },
  {
    id: 'kb_jjk',
    keywords: ['咒术回战', '五条悟', '虎杖', '周边', '手办', '玩偶', '衣服', '联名'],
    content: '宝宝商城「咒术回战联名专场」在售周边：五条悟 Q 版 PVC 手办（¥128）、咒术高专联名 T 恤（¥99）、虎杖悠仁毛绒挂件（¥39）、伏黑惠钥匙扣（¥25）。限量发售，先到先得。'
  },
  {
    id: 'kb_points',
    keywords: ['积分', '签到', '签到积分', '兑换'],
    content: '每日签到 +10 积分，连续 7 天第 7 天 +50 积分大礼包。积分可在「签到页」兑换优惠券或神秘礼包。'
  },
  {
    id: 'kb_ai',
    keywords: ['你是谁', '机器人', 'AI', '客服', '助手', '帮助'],
    content: '我是宝宝商城 AI 智能助手小宝，基于 Qwen 大模型 + RAG 知识库构建，可帮你查询商品、订单、活动、售后政策等问题，24 小时在线。'
  },
  {
    id: 'kb_order',
    keywords: ['订单', '查询', '状态', '物流查询', '订单号'],
    content: '订单状态可在「我的订单」页查看，包含：待付款、待发货、已发货、已完成、已取消。已发货订单可点击查看物流轨迹。'
  },
  {
    id: 'kb_account',
    keywords: ['登录', '注册', '账号', '密码', '忘记密码', '修改密码'],
    content: '支持用户名/邮箱登录。忘记密码可在登录页点击「忘记密码」通过邮箱重置。新用户注册即送 50 元新人券。'
  }
];

// ============ 检索函数 ============
/**
 * 在知识库中检索与问题最相关的 K 条知识
 * @param {string} question 用户问题
 * @param {number} topK 返回条数，默认 3
 * @returns {Array<{id, content, score}>}
 */
function retrieve(question, topK = 3) {
  const q = (question || '').toLowerCase();
  if (!q) return [];

  const scored = knowledge.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length; // 长关键词权重高
      }
    }
    return { ...entry, score };
  });

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * 把检索到的知识组装成 LLM 的 system prompt 上下文
 */
function buildContext(question) {
  const hits = retrieve(question, 3);
  if (hits.length === 0) return null;

  const contextText = hits
    .map((h, i) => `[${i + 1}] ${h.content}`)
    .join('\n');

  return {
    hits,
    systemPrompt: `你是「宝宝商城」的 AI 智能客服助手「小宝」，服务一个潮流霓虹风格的电商平台（融合淘宝/京东/拼多多特色）。

请依据下方知识库内容回答用户问题，要求：
1. 只回答与宝宝商城、商品、订单、活动相关的问题
2. 优先使用知识库中的信息，不要编造运费/活动规则
3. 简洁友好，可用 emoji 点缀
4. 如果用户问的是商品推荐，可以引导到对应页面
5. 不在知识库范围的问题，礼貌引导到人工客服

【知识库】
${contextText}

【当前时间】${new Date().toLocaleString('zh-CN')}`
  };
}

module.exports = {
  knowledge,
  retrieve,
  buildContext
};
