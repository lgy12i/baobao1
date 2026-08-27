/**
 * AI 助手控制器
 *
 * 职责：
 * 1. 接收用户问题
 * 2. 调用 RAG 知识库检索相关条目
 * 3. 拼 system prompt + 用户问题 → 调用 LLM（OpenAI 兼容协议）
 * 4. 流式 / 非流式返回回答
 *
 * 设计要点（面试讲解）：
 *  - 使用 OpenAI 兼容协议：可对接 Qwen DashScope / DeepSeek / 豆包等
 *  - 模型与 base_url 通过环境变量配置，可热切换
 *  - API Key 不入库，只在后端 .env
 *  - 知识库命中后增强 prompt（RAG 核心）
 *  - 没命中时退化为通用闲聊 + 引导
 */
const { buildContext, retrieve } = require('../data/knowledge-base');
const store = require('../config/memory-store');

// Node 18+ 内置 fetch
const fetch = globalThis.fetch || require('node-fetch');

// ============ 配置 ============
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const AI_API_KEY  = process.env.AI_API_KEY || '';
const AI_MODEL    = process.env.AI_MODEL || 'qwen-max';
// 备用模型（主模型不可用时降级）
const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'deepseek-chat';
const AI_FALLBACK_BASE  = process.env.AI_FALLBACK_BASE || 'https://api.deepseek.com/v1';
const AI_FALLBACK_KEY   = process.env.AI_FALLBACK_KEY || '';

const ENABLE_AI = !!(AI_API_KEY || AI_FALLBACK_KEY);

// ============ 工具：调用 OpenAI 兼容 chat completions ============
async function callLLM({ baseUrl, apiKey, model, messages, temperature = 0.7, maxTokens = 800 }) {
  if (!apiKey) throw new Error('missing api key');
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`LLM API ${res.status}: ${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ============ 主入口：chat ============
async function chat(req, res) {
  try {
    const { message = '', history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: '缺少 message 参数' });
    }

    // 1. RAG 检索知识
    const ctx = buildContext(message);
    const systemPrompt = ctx?.systemPrompt ||
      '你是「宝宝商城」AI 客服助手小宝。简洁友好地回答用户关于商品、订单、活动的问题，可用 emoji 点缀。超出范围礼貌引导到人工客服。';

    // 2. 构造 messages
    const messages = [
      { role: 'system', content: systemPrompt },
      // 保留最近 4 轮历史
      ...history.slice(-4).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    // 3. 如果未配置 AI，走知识库兜底回复
    if (!ENABLE_AI) {
      const fallback = ctx?.hits?.[0]?.content ||
        '您好，我是宝宝商城 AI 助手小宝 🤖。您可以问我发货、退换货、优惠券、秒杀、咒术回战周边等问题～';
      return res.json({
        success: true,
        data: {
          reply: `[知识库模式] ${fallback}`,
          model: 'knowledge-base-fallback',
          ragHits: ctx?.hits?.map((h) => h.id) || []
        }
      });
    }

    // 4. 调用主模型，失败降级到备用模型
    let reply = '';
    let usedModel = AI_MODEL;
    let usedProvider = 'primary';
    try {
      reply = await callLLM({
        baseUrl: AI_BASE_URL,
        apiKey: AI_API_KEY,
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        maxTokens: 800
      });
    } catch (err) {
      console.warn('[AI] 主模型调用失败，降级到备用模型:', err.message);
      if (AI_FALLBACK_KEY) {
        reply = await callLLM({
          baseUrl: AI_FALLBACK_BASE,
          apiKey: AI_FALLBACK_KEY,
          model: AI_FALLBACK_MODEL,
          messages,
          temperature: 0.7,
          maxTokens: 800
        });
        usedModel = AI_FALLBACK_MODEL;
        usedProvider = 'fallback';
      } else {
        throw err;
      }
    }

    return res.json({
      success: true,
      data: {
        reply,
        model: usedModel,
        provider: usedProvider,
        ragHits: ctx?.hits?.map((h) => h.id) || []
      }
    });
  } catch (err) {
    console.error('[AI] chat error:', err);
    return res.status(500).json({
      success: false,
      message: 'AI 服务暂时不可用，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// ============ 商品推荐（基于关键词 + 知识库） ============
async function recommend(req, res) {
  try {
    const { message = '' } = req.body || {};
    // 简单：从知识库命中提取商品类别，再从 store 查商品
    const hits = retrieve(message, 5);
    const keywords = hits.flatMap((h) => h.keywords);

    // 从内存 store 取商品
    const products = Array.from(store.products.values());
    const matched = products
      .map((p) => {
        let score = 0;
        const text = `${p.name} ${p.brand || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        for (const kw of keywords) {
          if (text.includes(kw.toLowerCase())) score += 1;
        }
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.p);

    return res.json({
      success: true,
      data: { products: matched, ragHits: hits.map((h) => h.id) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ============ 意图识别 ============
async function intentRecognition(req, res) {
  try {
    const { message = '' } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, message: '缺少 message 参数' });
    }

    const intents = [
      { type: 'product_inquiry',    keywords: ['商品', '价格', '多少钱', '有吗', '卖', '买'], desc: '商品咨询' },
      { type: 'order_query',       keywords: ['订单', '物流', '快递', '到哪', '什么时候到'], desc: '订单查询' },
      { type: 'after_sale',        keywords: ['退货', '退款', '换货', '售后', '维修', '坏了'], desc: '售后请求' },
      { type: 'coupon_inquiry',    keywords: ['优惠券', '券', '满减', '折扣', '活动'], desc: '优惠咨询' },
      { type: 'shipping_inquiry',  keywords: ['发货', '运费', '包邮', '配送', '快递'], desc: '物流咨询' },
      { type: 'account_issue',     keywords: ['登录', '密码', '注册', '账号', '登不上'], desc: '账号问题' },
      { type: 'recommendation',    keywords: ['推荐', '什么好', '买什么', '哪个好', '热销'], desc: '商品推荐' },
      { type: 'complaint',         keywords: ['投诉', '差评', '假货', '骗', '坑', '不满意'], desc: '投诉建议' }
    ];

    const q = message.toLowerCase();
    const scored = intents.map(intent => {
      let score = 0;
      for (const kw of intent.keywords) {
        if (q.includes(kw)) score += kw.length;
      }
      return { ...intent, score };
    });

    const matched = scored.filter(i => i.score > 0).sort((a, b) => b.score - a.score);
    const topIntent = matched[0] || { type: 'general', desc: '通用咨询' };

    // RAG 检索
    const hits = retrieve(message, 3);

    return res.json({
      success: true,
      data: {
        intent: topIntent.type,
        description: topIntent.desc,
        confidence: matched.length > 0 ? Math.min(1, matched[0].score / 20) : 0.3,
        allMatched: matched.slice(0, 3).map(m => ({ type: m.type, desc: m.desc })),
        ragHits: hits.map(h => h.id)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ============ 情感分析 ============
async function sentimentAnalysis(req, res) {
  try {
    const { message = '' } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, message: '缺少 message 参数' });
    }

    const positiveWords = ['满意', '喜欢', '好评', '棒', '赞', '好', '不错', '开心', '感谢', '谢谢', '给力', '牛', '优秀', '完美', '推荐'];
    const negativeWords = ['差', '烂', '不满', '失望', '垃圾', '假货', '骗', '坑', '投诉', '退货', '坏了', '垃圾', '恶心', '气', '烦'];
    const neutralWords = ['问', '查询', '怎么', '什么', '多少', '哪里', '是否', '能不能'];

    const q = message.toLowerCase();
    let posScore = 0, negScore = 0, neuScore = 0;

    for (const w of positiveWords) { if (q.includes(w)) posScore += w.length; }
    for (const w of negativeWords) { if (q.includes(w)) negScore += w.length; }
    for (const w of neutralWords) { if (q.includes(w)) neuScore += w.length; }

    const total = posScore + negScore + neuScore;
    let sentiment, emoji, suggestion;

    if (posScore > negScore && posScore > 0) {
      sentiment = 'positive';
      emoji = '😊';
      suggestion = '感谢您的好评！如有其他问题随时联系我～';
    } else if (negScore > posScore && negScore > 0) {
      sentiment = 'negative';
      emoji = '😟';
      suggestion = '非常抱歉给您带来不好的体验，已为您标记优先处理，客服将在5分钟内联系您。';
    } else {
      sentiment = 'neutral';
      emoji = '😐';
      suggestion = '感谢您的咨询，请告诉我您的问题细节～';
    }

    return res.json({
      success: true,
      data: {
        sentiment,
        emoji,
        confidence: total > 0 ? Math.max(posScore, negScore, neuScore) / total : 0.5,
        scores: { positive: posScore, negative: negScore, neutral: neuScore },
        suggestion
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ============ 健康检查 ============
function status(_req, res) {
  res.json({
    success: true,
    data: {
      enabled: ENABLE_AI,
      primaryModel: AI_MODEL,
      primaryBaseUrl: AI_BASE_URL,
      hasFallback: !!AI_FALLBACK_KEY,
      fallbackModel: AI_FALLBACK_MODEL,
      knowledgeEntries: require('../data/knowledge-base').knowledge.length
    }
  });
}

module.exports = { chat, recommend, status, intentRecognition, sentimentAnalysis };
