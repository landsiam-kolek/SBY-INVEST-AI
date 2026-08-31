import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  DollarSign, 
  Target, 
  ShieldAlert, 
  Plus, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Search,
  AlertTriangle,
  Calendar,
  Timer
} from 'lucide-react';
import { StockData, DayTradeTimeframe, AssetCategory } from '../types';

interface DayTradeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStocks: StockData[];
  initialCapital?: number;
  initialTimeframe?: DayTradeTimeframe;
  initialSelectedSymbols?: string[];
  onConfirmSetup: (config: {
    timeframe: DayTradeTimeframe;
    capital: number;
    selectedStocks: StockData[];
  }) => void;
}

export const DayTradeSetupModal: React.FC<DayTradeSetupModalProps> = ({
  isOpen,
  onClose,
  allStocks,
  initialCapital = 100000,
  initialTimeframe = '2_3_DAYS',
  initialSelectedSymbols = ['DELTA', 'CPALL', 'XAU/USD', 'NVDA'],
  onConfirmSetup,
}) => {
  const [timeframe, setTimeframe] = useState<DayTradeTimeframe>(initialTimeframe);
  const [capital, setCapital] = useState<number>(initialCapital);
  const [customCapitalInput, setCustomCapitalInput] = useState<string>(initialCapital.toString());
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    // If initial symbols exist in allStocks, use them
    const valid = initialSelectedSymbols.filter(sym => allStocks.some(s => s.symbol === sym));
    return valid.length > 0 ? valid : [allStocks[0]?.symbol || 'CPALL'];
  });
  const [searchFilter, setSearchFilter] = useState<string>('');

  const now = new Date();
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const todayStr = `วัน${days[now.getDay()]}ที่ ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear() + 543}`;

  if (!isOpen) return null;

  const toggleStock = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) {
      if (selectedSymbols.length > 1) {
        setSelectedSymbols(prev => prev.filter(s => s !== symbol));
      }
    } else {
      if (selectedSymbols.length < 8) {
        setSelectedSymbols(prev => [...prev, symbol]);
      }
    }
  };

  const handleCustomCapitalChange = (val: string) => {
    setCustomCapitalInput(val);
    const num = Number(val.replace(/,/g, ''));
    if (!isNaN(num) && num > 0) {
      setCapital(num);
    }
  };

  const handlePresetCapital = (amt: number) => {
    setCapital(amt);
    setCustomCapitalInput(amt.toString());
  };

  const filteredStocks = allStocks.filter(
    s => s.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
         s.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenStocks = allStocks.filter(s => selectedSymbols.includes(s.symbol));
    onConfirmSetup({
      timeframe,
      capital,
      selectedStocks: chosenStocks.length > 0 ? chosenStocks : [allStocks[0]],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#121215] border border-amber-500/40 dark:border-amber-500/30 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header with High-Risk Day Trade Theme */}
        <div className="p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent dark:from-amber-950/40 dark:via-orange-950/20 border-b border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ตั้งค่าพอร์ตโหมด Day Trade & เก็งกำไรระยะสั้น
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-500/30">
                  ⚡ HIGH-RISK MODE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                กำหนดกรอบเวลา, งบลงทุนใหม่ และเลือกหุ้นที่สนใจ เพื่อให้ AI ชี้แนะจุดเข้า / SL / TP แม่นยำ
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

        {/* Live Date & Session Banner */}
        <div className="px-5 py-2.5 bg-slate-900 text-slate-200 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 font-bold text-amber-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>วันนี้: {todayStr}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>ตลาดหุ้นไทย SET (BKK GMT+7)</span>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="px-5 py-2 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 flex items-center space-x-2 text-[11px] text-amber-900 dark:text-amber-200 font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>คำเตือนความเสี่ยง:</strong> โหมดนี้เน้นความเร็วและวินัยสูง ต้องวางจุดตัดขาดทุน (SL) เคร่งครัดทุกไม้
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1 text-slate-900 dark:text-[#E4E4E7]">
          
          {/* QUESTION 1: TIMEFRAME */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>1. คุณตั้งเป้าหมายระยะเวลาการถือครองไว้เท่าใด?</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: '1_DAY' as DayTradeTimeframe,
                  label: '1 วัน (Intraday)',
                  sub: 'จบในวัน / Scalp',
                  icon: '⚡',
                  desc: 'เข้า-ออกไวในวัน ไม่ถือข้ามคืน SL -1.8% / TP +3.8%',
                },
                {
                  id: '2_3_DAYS' as DayTradeTimeframe,
                  label: '2 - 3 วัน (Fast Swing)',
                  sub: 'รอบย่อย 2-3 วัน',
                  icon: '🎯',
                  desc: 'เกาะรอบโมเมนตัม 2-3 วัน SL -2.4% / TP +5.6%',
                },
                {
                  id: '1_WEEK' as DayTradeTimeframe,
                  label: '1 สัปดาห์ (Weekly)',
                  sub: 'รอบสัปดาห์ 5-7 วัน',
                  icon: '🚀',
                  desc: 'สวิงเทรดรอบสัปดาห์ SL -3.2% / TP +7.5%',
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    timeframe === t.id
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-slate-950 dark:text-white ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-black flex items-center space-x-1.5">
                      <span>{t.icon}</span>
                      <span className="text-xs">{t.label}</span>
                    </span>
                    {timeframe === t.id && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    {t.sub}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* QUESTION 2: STARTING CAPITAL */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>2. ตั้งจำนวนเงินลงทุนใหม่สำหรับพอร์ต Day Trade นี้:</span>
              </label>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                {capital.toLocaleString()} บาท (THB)
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {[30000, 50000, 100000, 200000, 500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetCapital(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    capital === amt
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {amt.toLocaleString()} ฿
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-xs text-slate-500 font-semibold">หรือระบุจำนวนเอง:</span>
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={customCapitalInput}
                  onChange={(e) => handleCustomCapitalChange(e.target.value)}
                  placeholder="เช่น 75000"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">บาท</span>
              </div>
            </div>
          </div>

          {/* QUESTION 3: SELECT OR ADD STOCKS TO TRACK */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Target className="w-4 h-4 text-indigo-500" />
                <span>3. ใส่หรือเลือกหุ้นที่สนใจจะติดตาม (เลือก 1 - 8 ตัว):</span>
              </label>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                เลือกแล้ว {selectedSymbols.length} ตัว
              </span>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="ค้นหาหุ้นที่สนใจ เช่น DELTA, CPALL, HANA, NVDA, XAU/USD..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900 dark:text-white"
              />
            </div>

            {/* Selected Badges */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800 min-h-12 items-center">
              {selectedSymbols.map((sym) => {
                const stock = allStocks.find((s) => s.symbol === sym);
                return (
                  <span
                    key={sym}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40 text-xs font-black animate-in fade-in"
                  >
                    <span>{sym}</span>
                    {stock && <span className="text-[10px] opacity-75">{stock.currentPrice}฿</span>}
                    <button
                      type="button"
                      onClick={() => toggleStock(sym)}
                      className="text-amber-700 dark:text-amber-400 hover:text-rose-500 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Stock Choices Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {filteredStocks.map((stock) => {
                const isSelected = selectedSymbols.includes(stock.symbol);
                return (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => toggleStock(stock.symbol)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-xs font-black">{stock.symbol}</div>
                      <div className="text-[10px] text-slate-400 truncate">{stock.name}</div>
                    </div>
                    <div className="text-right shrink-0 ml-1">
                      <div className="text-xs font-bold">{stock.currentPrice}฿</div>
                      <div className={`text-[10px] font-semibold ${stock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer & Launch Button */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              id="confirm-day-trade-setup-btn"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>สร้างพอร์ต & ชี้แนะจุดเข้า / SL / TP ทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
