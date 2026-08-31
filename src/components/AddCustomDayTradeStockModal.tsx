import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ShieldAlert, 
  Sparkles, 
  Search, 
  X, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  HelpCircle,
  Users,
  Radio,
  FileText,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { StockData } from '../types';
import { createDynamicStockData } from '../data/mockStocks';

interface AddCustomDayTradeStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStocks: StockData[];
  onAddStockWithAudit: (stock: StockData, sourceNote: string) => void;
}

export const AddCustomDayTradeStockModal: React.FC<AddCustomDayTradeStockModalProps> = ({
  isOpen,
  onClose,
  allStocks,
  onAddStockWithAudit,
}) => {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(allStocks[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSourceTag, setCustomSourceTag] = useState<string>('เพื่อนหรือคนรู้จักแนะนำมา');
  const [customDetailNote, setCustomDetailNote] = useState<string>('');

  const popularQuickPicks = [
    'MTC', 'SAWAD', 'TIDLOR', 'CPALL', 'DELTA', 'KBANK', 'TRUE', 'ADVANC', 'BDMS', 'GULF', 'PTT', 'NVDA'
  ];

  const filteredStocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allStocks;
    return allStocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
    );
  }, [allStocks, searchQuery]);

  const exactMatchStock = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return null;
    return allStocks.find((s) => s.symbol.toUpperCase() === q) || null;
  }, [allStocks, searchQuery]);

  if (!isOpen) return null;

  const presetSources = [
    { label: '👥 เพื่อน / คนรู้จักแนะนำมา', val: 'เพื่อนหรือคนรู้จักแนะนำมา' },
    { label: '💬 กลุ่มไลน์ / Telegram / เพจหุ้น', val: 'กลุ่มไลน์/โซเชียลแนะนำ' },
    { label: '📰 เห็นข่าวลือ / ข่าวสตอรี่ใหม่', val: 'ตามข่าวสาร/สตอรี่ในตลาด' },
    { label: '📈 สแกนเจอโมเมนตัมเอง', val: 'คัดกรองสัญญาณเทคนิคด้วยตนเอง' },
    { label: '✍️ อื่นๆ (ระบุเอง)', val: 'แหล่งข้อมูลอื่นๆ' },
  ];

  const handleSelectQuickPick = (sym: string) => {
    const found = allStocks.find((s) => s.symbol.toUpperCase() === sym.toUpperCase());
    if (found) {
      setSelectedStock(found);
      setSearchQuery('');
    } else {
      const generated = createDynamicStockData(sym);
      setSelectedStock(generated);
      setSearchQuery('');
    }
  };

  const handleCreateAndSelectCustom = () => {
    if (!searchQuery.trim()) return;
    const generated = createDynamicStockData(searchQuery.trim());
    setSelectedStock(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stockToSubmit = selectedStock || (searchQuery.trim() ? createDynamicStockData(searchQuery.trim()) : null);
    if (!stockToSubmit) return;

    const finalSource = customDetailNote.trim()
      ? `${customSourceTag}: ${customDetailNote.trim()}`
      : customSourceTag;

    onAddStockWithAudit(stockToSubmit, finalSource);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#121215] border border-amber-500/40 dark:border-amber-500/30 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent dark:from-amber-950/50 dark:via-orange-950/20 border-b border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  เพิ่มหุ้นที่สนใจ / ได้รับคำแนะนำมา
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-500/30">
                  AI Risk Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                นำหุ้นมาติดตามในโหมด Day Trade ให้ AI ช่วยสแกนความเสี่ยง & ให้ความเห็นชอบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-900 dark:text-zinc-200">
          
          {/* STEP 1: Select Stock */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>1. ค้นหาหรือเลือกชื่อหุ้น:</span>
              </label>
              {selectedStock && (
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>เลือก: {selectedStock.symbol} ({selectedStock.currentPrice} ฿)</span>
                </span>
              )}
            </div>
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อหุ้น เช่น MTC, SAWAD, TIDLOR, CPALL, DELTA, KBANK..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 dark:text-white font-bold"
              />
            </div>

            {/* Quick Pick Chips */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">หุ้นยอดนิยมในระบบ (คลิกเลือกด่วน):</span>
              <div className="flex flex-wrap gap-1.5">
                {popularQuickPicks.map((sym) => {
                  const isCur = selectedStock?.symbol.toUpperCase() === sym;
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleSelectQuickPick(sym)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        isCur
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Results List */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40">
              {filteredStocks.map((stock) => {
                const isSelected = selectedStock?.symbol === stock.symbol;
                return (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => setSelectedStock(stock)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-slate-900 dark:text-white ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-xs font-black">{stock.symbol}</div>
                      <div className="text-[10px] text-slate-400 truncate">{stock.market}</div>
                    </div>
                    <div className="text-right shrink-0 ml-1">
                      <div className="text-xs font-bold">{stock.currentPrice}฿</div>
                      <div className={`text-[9px] font-semibold ${stock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Stock Creator if search query is not in pre-filtered results */}
            {searchQuery.trim() && !exactMatchStock && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-300 dark:border-amber-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>เพิ่มหุ้น "{searchQuery.trim().toUpperCase()}" เข้าระบบ</span>
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    ระบบจะสร้างชุดข้อมูลและโมเดลเทคนิคอลสำหรับหุ้นตัวนี้ให้โดยอัตโนมัติ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateAndSelectCustom}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs cursor-pointer"
                >
                  + เลือกทันที
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: Source of Idea / Recommendation */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <label className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>2. คุณได้รับคำแนะนำหรือสนใจหุ้นตัวนี้จากแหล่งใด?</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetSources.map((src) => (
                <button
                  key={src.val}
                  type="button"
                  onClick={() => setCustomSourceTag(src.val)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    customSourceTag === src.val
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-slate-950 dark:text-amber-300 ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {/* Optional Note / Peer context */}
            <div className="pt-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">
                รายละเอียดเพิ่มเติมที่เขาบอกมา (ถ้ามี เช่น "เขาบอกว่าจะวิ่งไป 52 ฿", "งบจะโตเด่น", "ดักทางดอกเบี้ยลด"):
              </label>
              <textarea
                value={customDetailNote}
                onChange={(e) => setCustomDetailNote(e.target.value)}
                placeholder="ระบุสิ่งที่เขาแนะนำมา เพื่อให้ AI ช่วยตรวจจับและวิเคราะห์ความเสี่ยงให้ตรงจุด..."
                rows={2}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* AI Audit Preview Note */}
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1">
            <div className="font-black flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI จะทำอะไรให้หลังจากเพิ่มหุ้น?</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-indigo-300">
              <li>สแกนระดับความเสี่ยง (AI Risk Verdict: เห็นชอบ / เตือนระวัง / ความเสี่ยงสูงมาก)</li>
              <li>เปรียบเทียบว่าคำแนะนำจากคนอื่นตรงกับเทคนิคอล Volume & EMA หรือเป็น <strong>"กับดักราคา"</strong></li>
              <li>กำหนดจุดเข้าซื้อ (Entry), จุด Stop Loss (SL) และจุดทำกำไร (TP1/TP2) ให้ทันที</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={!selectedStock && !searchQuery.trim()}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่ม {selectedStock ? selectedStock.symbol : searchQuery.toUpperCase()} เข้าพอร์ต & ตรวจความเสี่ยง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

