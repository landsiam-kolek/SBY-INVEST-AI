import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  FileText, 
  MessageSquare, 
  Lightbulb,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { StockData, ChatMessage } from '../types';
import { SataRobotLogo } from './SataRobotLogo';
import { copyToClipboard } from '../utils/clipboardHelper';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  stock,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'chat'>('diagnosis');
  const [diagnosisReport, setDiagnosisReport] = useState<string>('');
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initial welcome message for stock
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `สวัสดีครับ ผมคือ **SBY Invest AI Advisor** ผู้ช่วยวิเคราะห์การลงทุน ขณะนี้คุณกำลังดูหุ้น **${stock.symbol} (${stock.name})**\n\nผมพร้อมตอบคำถามทั้งเชิงคุณภาพพื้นฐาน (Fundamental Moats & Valuation) และจังหวะเทคนิค (Technical Timing, Support/Resistance, Position Sizing) คุณต้องการสอบถามประเด็นใดเป็นพิเศษครับ?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, stock.symbol]);

  // Scroll to bottom on chat update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingChat]);

  // Fetch AI Diagnosis Report
  const fetchDiagnosis = async (customPrompt?: string) => {
    setIsLoadingDiagnosis(true);
    try {
      const res = await fetch('/api/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: stock, customPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagnosisReport(data.analysis);
      } else {
        setDiagnosisReport('เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      setDiagnosisReport('ไม่สามารถเชื่อมต่อกับ SBY AI Engine ได้ในขณะนี้');
    } finally {
      setIsLoadingDiagnosis(false);
    }
  };

  // Trigger diagnosis automatically when tab opened if empty
  useEffect(() => {
    if (isOpen && activeTab === 'diagnosis' && !diagnosisReport && !isLoadingDiagnosis) {
      fetchDiagnosis();
    }
  }, [isOpen, activeTab, stock.symbol]);

  // Handle Send Chat
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoadingChat) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoadingChat(true);

    try {
      const res = await fetch('/api/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          currentStock: stock,
        }),
      });
      const data = await res.json();

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'ขออภัยครับ ไม่สามารถประมวลผลคำตอบได้ในขณะนี้',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const errorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI Advisor กรุณาลองใหม่อีกครั้งครับ',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const copyReport = () => {
    copyToClipboard(diagnosisReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (!isOpen) return null;

  const quickPrompts = [
    `ถ้าตลาดปรับฐาน หุ้น ${stock.symbol} ควรตั้งรับที่จุดไหน?`,
    `เปรียบเทียบจุดคุ้มค่า Risk/Reward ของ ${stock.symbol} ที่ราคาปัจจุบัน`,
    `ข้อได้เปรียบในการแข่งขัน (Moat) ของ ${stock.symbol} แข็งแกร่งแค่ไหน?`,
    `ความยั่งยืนของเงินปันผล ${stock.dividendYield}% ในอีก 1-2 ปีข้างหน้า?`,
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-white dark:bg-[#121215] border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-[#18181B]">
        <div className="flex items-center space-x-3">
          <SataRobotLogo size={40} glow={true} />
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                SBY Invest AI Advisor
              </h3>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                Gemini 3.7
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              วิเคราะห์หุ้น: <strong className="text-slate-900 dark:text-white">{stock.symbol}</strong> ({stock.currentPrice} {stock.currency})
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Price Data Debug & Transparency Bar (V1.0 Standard) */}
      <div className="px-4 py-2 bg-slate-100/90 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-1 font-mono">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-sans">📌 AI Price Base:</span>
          <span>Last: <strong className="text-slate-900 dark:text-white">{(stock.currentLast || stock.currentPrice).toFixed(2)}</strong> {stock.currency}</span>
          <span className="text-slate-400">|</span>
          <span>PrevClose: <strong>{(stock.previousClose || stock.prevClosePrice || stock.currentPrice).toFixed(2)}</strong></span>
        </div>
        <div className="flex items-center space-x-2 text-[10px]">
          <span>Date: <strong>{stock.priceDate || new Date().toLocaleDateString('th-TH')}</strong></span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
            {stock.dataSource || 'SIAMCHART'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-all ${
            activeTab === 'diagnosis'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-500/10'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>บทวิเคราะห์เจาะลึก (Deep Report)</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center space-x-2 border-b-2 transition-all ${
            activeTab === 'chat'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-500/10'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>ถาม-ตอบกลยุทธ์ (AI Chat)</span>
        </button>
      </div>

      {/* Tab 1: Deep Diagnosis Report */}
      {activeTab === 'diagnosis' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  รายงานผลรวม Fundamental + Technical
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => fetchDiagnosis()}
                  disabled={isLoadingDiagnosis}
                  className="p-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title="ประมวลผลใหม่"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiagnosis ? 'animate-spin' : ''}`} />
                </button>
                {diagnosisReport && (
                  <button
                    onClick={copyReport}
                    className="p-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    title="คัดลอกบทวิเคราะห์"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {isLoadingDiagnosis ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    SBY AI กำลังสังเคราะห์ข้อมูล {stock.symbol}...
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    ประมวลผลงบการเงิน, อัตราส่วน Valuation, โครงสร้างกราฟ และความเสี่ยง
                  </p>
                </div>
              </div>
            ) : diagnosisReport ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap bg-slate-50 dark:bg-[#18181B] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 font-sans">
                {diagnosisReport}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-zinc-400">กดปุ่มด้านล่างเพื่อเริ่มสร้างบทวิเคราะห์</p>
                <button
                  onClick={() => fetchDiagnosis()}
                  className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-sm"
                >
                  เริ่มวิเคราะห์ {stock.symbol}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Chat Advisor */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 dark:bg-[#18181B] text-slate-800 dark:text-zinc-200 rounded-bl-none border border-slate-200/60 dark:border-zinc-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <span
                    className={`block text-[10px] mt-1 ${
                      msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400 dark:text-zinc-500 text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoadingChat && (
              <div className="flex items-center space-x-2 text-slate-400 dark:text-zinc-500 text-xs py-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200"></div>
                <span className="text-[11px]">SBY AI กำลังคำนวณและตอบคำถาม...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] border-t border-slate-200/70 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              <span>คำถามแนะนำยอดนิยม:</span>
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-zinc-700 whitespace-nowrap shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-[#121215] border-t border-slate-200 dark:border-zinc-800 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={`พิมพ์คำถามเกี่ยวกับ ${stock.symbol} หรือกลยุทธ์การลงทุน...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100/70 dark:bg-[#18181B] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoadingChat}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors shadow-sm shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
