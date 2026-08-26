/**
 * AI 助手悬浮窗组件
 *
 * 功能：
 *  1. 右下角霓虹悬浮按钮
 *  2. 点击展开聊天窗（玻璃拟态）
 *  3. 调用后端 /api/v1/ai/chat
 *  4. 显示 RAG 命中的知识条目 ID
 *  5. 快捷问题按钮
 *
 * 面试讲解亮点：
 *  - API Key 不暴露在前端，只通过后端代理调用
 *  - RAG 命中可视化：用户能看到 AI 用了哪些知识
 *  - 主模型不可用时自动降级（后端处理）
 */
import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { chatAI, type ChatMessage } from '@/services/ai.api';

interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
  ragHits?: string[];
  model?: string;
  loading?: boolean;
}

const QUICK_QUESTIONS = [
  '发货要多久？',
  '咒术回战有哪些周边？',
  '怎么领优惠券？',
  '退换货政策是什么？',
  '限时秒杀几点开始？'
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      role: 'assistant',
      content: '👋 你好，我是宝宝商城 AI 助手「小宝」🤖\n\n可以问我：商品推荐、订单物流、优惠券、秒杀活动、咒术回战周边 等问题～'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const history: ChatMessage[] = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content
    }));

    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatAI(msg, history);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          ragHits: res.ragHits,
          model: res.model
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，AI 服务暂时不可用，请稍后再试 😢\n（提示：检查后端是否配置 AI_API_KEY）'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 悬浮按钮 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-neon-gradient text-white shadow-neon flex items-center justify-center hover:scale-110 transition animate-float"
          title="AI 助手小宝"
        >
          <Bot size={26} />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-ink-800"></span>
        </button>
      )}

      {/* 聊天窗 */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[600px] max-h-[80vh] glass rounded-2xl shadow-glass flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-neon-500/20 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-neon-gradient flex items-center justify-center text-white shadow-neon-soft">
                <Bot size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                  小宝 · AI 助手
                  <span className="badge-new text-[9px] px-1 py-0">RAG</span>
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  在线 · 24h 客服
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* 消息区 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'flex gap-2'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 shrink-0 rounded-lg bg-neon-gradient flex items-center justify-center text-white text-xs">
                      <Sparkles size={14} />
                    </div>
                  )}
                  <div>
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                        m.role === 'user'
                          ? 'bg-neon-gradient text-white rounded-br-sm shadow-neon-soft'
                          : 'glass text-white/90 rounded-bl-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                    {/* RAG 命中显示 */}
                    {m.ragHits && m.ragHits.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="text-[9px] text-white/40">📚 RAG 命中:</span>
                        {m.ragHits.map((h) => (
                          <span key={h} className="text-[9px] px-1.5 py-0.5 rounded bg-neon-500/15 text-neon-300 border border-neon-500/30">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.model && m.model !== 'knowledge-base-fallback' && (
                      <div className="mt-0.5 text-[9px] text-white/30">
                        ⚙ {m.model}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-neon-gradient flex items-center justify-center text-white text-xs">
                  <Sparkles size={14} />
                </div>
                <div className="glass px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 size={14} className="animate-spin text-neon-300" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[11px] px-2 py-1 rounded-full glass text-white/70 hover:text-neon-300 hover:border-neon-500/40 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 输入区 */}
          <div className="p-3 border-t border-white/10 bg-ink-950/40">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="问我任何问题..."
                className="input-neon flex-1 py-2 text-sm rounded-full"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-neon-gradient text-white flex items-center justify-center hover:shadow-neon transition disabled:opacity-40 shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-white/30 mt-1.5 text-center">
              Powered by Qwen + RAG · 仅供学习演示
            </p>
          </div>
        </div>
      )}
    </>
  );
}
