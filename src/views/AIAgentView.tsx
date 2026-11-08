import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Coffee,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Package,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  'کدام میزها در حال حاضر اشغال هستند؟',
  'امروز چقدر فروش و سفارش داشته‌ایم؟',
  'موجودی شیر تازه و دان قهوه چقدر است؟',
  'کدام مواد اولیه به حداقل آستانه رسیده‌اند؟',
  'پرفروش‌ترین محصولات و نوشیدنی‌های کافه چیست؟',
  'وضعیت سفارش‌های آشپزخانه و بار قهوه چگونه است؟',
];

export const AIAgentView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_msg',
      sender: 'ai',
      text: 'درود! من دستیار هوشمند نیکو کافه (NIKO CAFE AI Agent) هستم. به دیتابیس زنده کافه شامل وضعیت میزها، سفارش‌های در انتظار آشپزخانه، انبار مواد اولیه و فروش لحظه‌ای دسترسی مستقیم دارم. چه کمکی از دست من برمی‌آید؟',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const res = await api.askAI(text);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'متأسفانه در برقراری ارتباط با مدل هوش مصنوعی خطایی رخ داد. لطفاً مجدداً تلاش فرمایید.',
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* AI Assistant Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] p-4 sm:p-5 flex items-center justify-between shadow-xs mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#4A2E1B] text-[#FAF7F2] flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6 text-[#C4975A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2C1810]">دستیار هوشمند نیکو کافه (NIKO CAFE AI)</h2>
            <p className="text-xs text-[#7A6A5C] mt-0.5">
              متصل به مدل هوش مصنوعی Gemini و پایگاه داده زنده فروش، میزها و انبارداری
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'init_msg_reset',
                sender: 'ai',
                text: 'تاریخچه گفتگو بازنشانی شد. چطور می‌توانم در مدیریت کافه به شما کمک کنم؟',
                timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="p-2 text-[#8C7A6B] hover:text-[#2C1810] hover:bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] transition-colors"
          title="شروع مجدد گفتگو"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E8DFD5] p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Coffee className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isAI
                    ? 'bg-[#FAF7F2] border border-[#E8DFD5] text-[#2C1810]'
                    : 'bg-[#4A2E1B] text-white'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                <span
                  className={`block text-[10px] mt-2 font-mono tabular-nums ${
                    isAI ? 'text-[#8C7A6B]' : 'text-stone-300'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-xl bg-[#5C6B47] text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Coffee className="w-4 h-4" />
            </div>
            <div className="bg-[#FAF7F2] border border-[#E8DFD5] rounded-2xl p-4 text-xs flex items-center gap-2 text-[#7A6A5C]">
              <div className="w-2 h-2 rounded-full bg-[#4A2E1B] animate-ping" />
              <span>دستیار هوشمند نیکو کافه در حال پردازش داده‌های کافه است...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="py-3 flex items-center gap-2 overflow-x-auto">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            className="px-3 py-1.5 bg-white text-[#543825] hover:bg-[#FAF7F2] hover:text-[#4A2E1B] border border-[#E8DFD5] rounded-xl text-[11px] font-medium whitespace-nowrap shadow-2xs transition-colors shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#E8DFD5] shadow-xs"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="سؤال خود را درباره وضعیت میزها، فروش امروز یا انبار بپرسید..."
          className="flex-1 px-4 py-2 text-xs rounded-xl focus:outline-none bg-transparent"
        />

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4A2E1B] hover:bg-[#382315] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-xs"
        >
          <span>ارسال</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
