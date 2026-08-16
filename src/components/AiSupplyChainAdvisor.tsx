import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  TrendingDown,
  ArrowLeftRight,
  Flame
} from 'lucide-react';
import { CalculatedMaterialMetric, Dim_Factory, Dim_Material, Language } from '../types';

interface AiSupplyChainAdvisorProps {
  metrics: CalculatedMaterialMetric[];
  factories: Dim_Factory[];
  materials: Dim_Material[];
  language: Language;
}

export const AiSupplyChainAdvisor: React.FC<AiSupplyChainAdvisorProps> = ({
  metrics,
  factories,
  materials,
  language,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: `Xin chào! Tôi là Trợ Lý AI Chuyên Sâu Điều Phối Chuỗi Cung Ứng Premix (PremixTrack AI Advisor).

Tôi đã nạp toàn bộ dữ liệu tồn kho SOH, nhu cầu Forecast D365 FO, chỉ số DOI và lịch trình Inbound PO của 8 nhà máy trên toàn quốc.

Bạn có thể bấm vào các kịch bản phân tích nhanh bên dưới hoặc đặt câu hỏi bất kỳ!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickPrompts = [
    {
      title: '🚨 Đánh giá nguy cơ thiếu hụt khẩn cấp',
      prompt: 'Hãy phân tích các nguyên liệu có DOI dưới 7 ngày và nguy cơ dừng chuyền trộn tại các nhà máy, đồng thời đưa ra phương án xử lý ngay lập tức.',
      mode: 'CRITICAL_RISK',
    },
    {
      title: '🔄 Tối ưu kế hoạch điều chuyển nội bộ',
      prompt: 'Dựa trên lượng tồn dư thừa (DOI > 35 ngày) và thiếu hụt (DOI < 7 ngày), hãy lập kế hoạch điều chuyển nội bộ tối ưu giữa các nhà máy gần nhau.',
      mode: 'TRANSFER_OPTIMIZATION',
    },
    {
      title: '📦 Lộ trình xả tồn & Thay thế mã Stop Usage',
      prompt: 'Hãy đánh giá tiến độ xả tồn các nguyên liệu có trạng thái Stop Usage (ví dụ: Vitamin AD3E) và hướng dẫn kích hoạt chuyển đổi công thức sang mã mới.',
      mode: 'SUBSTITUTION_PLAN',
    },
    {
      title: '💰 Phân tích ứ đọng vốn & Tối ưu Reorder',
      prompt: 'Hãy phân tích các mã hàng đang tồn đọng vốn lớn nhất và gợi ý số lượng tái đặt hàng (Reorder Quantity) chuẩn xác cho chu kỳ tới.',
      mode: 'CAPITAL_OPTIMIZATION',
    },
  ];

  const handleSend = async (customText?: string, mode?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      role: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build lightweight context summary to send to server
      const criticalItems = metrics
        .filter((m) => m.Severity === 'CRITICAL' || m.Severity === 'WARNING')
        .map((m) => ({
          factory: m.FactoryCode,
          material: m.MaterialName_VN,
          code: m.MaterialCode,
          soh: m.SOHQty,
          dailyUsage: Math.round(m.DailyUsage),
          doi: m.DOI_Total.toFixed(1),
          stockoutDate: m.StockoutDate,
          openPO: m.OpenPOQty,
        }));

      const overstockItems = metrics
        .filter((m) => m.Severity === 'OVERSTOCK')
        .map((m) => ({
          factory: m.FactoryCode,
          material: m.MaterialName_VN,
          code: m.MaterialCode,
          soh: m.SOHQty,
          doi: m.DOI_Total.toFixed(1),
        }));

      const contextData = {
        totalMills: factories.length,
        criticalCount: criticalItems.length,
        criticalList: criticalItems,
        overstockList: overstockItems,
      };

      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          mode: mode || 'CUSTOM_QUERY',
          contextData,
        }),
      });

      const data = await res.json();
      const answerText = data.text || data.fallbackAnswer || 'Không nhận được câu trả lời từ máy chủ AI.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: answerText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('AI query failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Đã xảy ra lỗi kết nối AI: ${err.message}. Hệ thống chuyển sang phân tích cục bộ.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Trợ Lý Cố Vấn Chuỗi Cung Ứng AI (PremixTrack AI Advisor)</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold">
                Gemini 3.7 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích đa chiều ma trận tồn kho, dự đoán điểm nghẽn sản xuất và tối ưu hóa chi phí điều phối logistics.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Analysis Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q.prompt, q.mode)}
            disabled={isLoading}
            className="p-4 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-2xl text-left transition-all cursor-pointer group space-y-1.5 shadow-sm disabled:opacity-50"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
              {q.title}
            </div>
            <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {q.prompt}
            </div>
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[540px]">
        {/* Messages Container */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`p-4 rounded-2xl max-w-[85%] space-y-2 relative group ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none leading-relaxed'
                }`}
              >
                <div className={`flex items-center justify-between gap-4 text-[10px] pb-1 border-b ${
                  msg.role === 'user' ? 'border-blue-500 text-blue-100' : 'border-slate-200 text-slate-400'
                }`}>
                  <span className="font-semibold">{msg.role === 'user' ? 'Bạn' : 'PremixTrack AI Advisor'}</span>
                  <span>{msg.time}</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {msg.text}
                </div>

                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.text, idx)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sao chép câu trả lời"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs">Đang phân tích dữ liệu D365 FO &amp; tính toán chiến lược...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            placeholder="Đặt câu hỏi về chuỗi cung ứng, tồn kho, công thức premix hoặc điều chuyển..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
            className="flex-1 bg-white text-slate-800 text-xs border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 transition-colors"
          />

          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputPrompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Gửi</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
