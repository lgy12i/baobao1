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

module.exports = { chat, recommend, status };
