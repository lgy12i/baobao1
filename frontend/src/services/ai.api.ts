/**
 * AI 助手 API 服务
 *
 * 直接使用 fetch 调用后端 /api/v1/ai/* 接口
 * （不使用全局 axios 拦截器，避免 code 字段不匹配问题）
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  provider?: 'primary' | 'fallback';
  ragHits: string[];
}

export interface AIStatus {
  enabled: boolean;
  primaryModel: string;
  primaryBaseUrl: string;
  hasFallback: boolean;
  fallbackModel: string;
  knowledgeEntries: number;
}

const BASE = '/api/v1/ai';

/**
 * 智能问答
 * @param message 用户问题
 * @param history 历史消息（最近 4 轮）
 */
export async function chatAI(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'AI 服务异常');
  }

  const json = await res.json();
  return json.data;
}

/**
 * AI 服务状态
 */
export async function getAIStatus(): Promise<AIStatus> {
  const res = await fetch(`${BASE}/status`);
  const json = await res.json();
  return json.data;
}

/**
 * 商品推荐
 */
export async function recommendProducts(message: string) {
  const res = await fetch(`${BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const json = await res.json();
  return json.data;
}
