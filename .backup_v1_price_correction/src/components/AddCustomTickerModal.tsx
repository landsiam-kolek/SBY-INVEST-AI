import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  CheckCircle2, 
  Zap,
  Target,
  ShieldAlert
} from 'lucide-react';
import { StockData, MarketType, AssetCategory } from '../types';
import { createDynamicStockData } from '../data/mockStocks';
import { calculatePrecisionTechnicalPlan } from '../utils/technicalAnalysis';

interface AddCustomTickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStocks: StockData[];
  onAddStock: (stock: StockData) => void;
}

export const AddCustomTickerModal: React.FC<AddCustomTickerModalProps> = ({
  isOpen,
  onClose,
  allStocks,
  onAddStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('THAI_STOCK');
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('SET');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);

  const popularTickers = [
    { sym: 'KBANK', name: 'ธนาคารกสิกรไทย', market: 'SET', cat: 'THAI_STOCK' },
    { sym: 'DELTA', name: 'เดลต้า อีเลคโทรนิคส์', market: 'SET', cat: 'THAI_STOCK' },
    { sym: 'MTC', name: 'เมืองไทย แคปปิตอล', market: 'SET', cat: 'THAI_STOCK' },
    { sym: 'BANPU', name: 'บ้านปู', market: 'SET', cat: 'THAI_STOCK' },
    { sym: 'CPALL', name: 'ซีพี ออลล์', market: 'SET', cat: 'THAI_STOCK' },
    { sym: 'ADVANC', name: 'แอดวานซ์ อินโฟร์ เซอร์วิส', market: 'SET', cat: 'THAI_STOCK' },
    { sym: 'NVDA', name: 'Nvidia Corporation', market: 'US', cat: 'GLOBAL_STOCK' },
    { sym: 'XAU/USD', name: 'Gold Spot USD', market: 'Global', cat: 'FOREX' },
    { sym: 'EUR/USD', name: 'Euro / US Dollar', market: 'Global', cat: 'FOREX' },
  ];

  const filteredPresetStocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allStocks;
    return allStocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
    );
  }, [allStocks, searchQuery]);

  if (!isOpen) return null;

  const handleSelectPopular = (item: { sym: string }) => {
    const existing = allStocks.find((s) => s.symbol.toUpperCase() === item.sym.toUpperCase());
    if (existing) {
      setSelectedStock(existing);
    } else {
      const generated = createDynamicStockData(item.sym);
      setSelectedStock(generated);
    }
  };

  const handleGenerateCustom = () => {
    if (!searchQuery.trim()) return;
    const cleanSym = searchQuery.trim().toUpperCase();
    const existing = allStocks.find((s) => s.symbol.toUpperCase() === cleanSym);
    if (existing) {
      setSelectedStock(existing);
    } else {
      const generated = createDynamicStockData(cleanSym);
      setSelectedStock(generated);
    }
  };

  const handleConfirmAdd = () => {
    const stockToAdd = selectedStock || (searchQuery.trim() ? createDynamicStockData(searchQuery.trim().toUpperCase()) : null);
    if (stockToAdd) {
      onAddStock(stockToAdd);
      onClose();
      setSearchQuery('');
      setSelectedStock(null);
    }
  };

  const previewPlan = selectedStock ? calculatePrecisionTechnicalPlan(selectedStock) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>เพิ่มหุ้น / สินทรัพย์ใหม่ (+ Add Ticker)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Real-time Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                ค้นหาและคำนวณระดับเทคนิคอล Fibonacci, SL, TP, และ 5-Level Bid/Offer อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateCustom();
              }}
              placeholder="พิมพ์ชื่อย่อหุ้น เช่น KBANK, BANPU, MTC, NVDA, XAU/USD..."
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleGenerateCustom}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition-all flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>วิเคราะห์</span>
              </button>
            )}
          </div>

          {/* Quick Pick Pills */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-2">
              สินทรัพย์ยอดนิยม (Quick Picks):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularTickers.map((item) => (
                <button
                  key={item.sym}
                  type="button"
                  onClick={() => handleSelectPopular(item)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs font-bold text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700 hover:border-indigo-400 transition-all cursor-pointer"
                >
                  <span>{item.sym}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({item.market})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Technical Preview of Selected Stock */}
          {selectedStock && previewPlan && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-indigo-200 dark:border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{selectedStock.symbol}</span>
                    <span className="text-xs text-slate-500 font-normal">{selectedStock.name}</span>
                  </div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    ราคาปัจจุบัน: {selectedStock.currentPrice} {selectedStock.currency}
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                  previewPlan.tradeGrade === 'GRADE_A_PLUS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  previewPlan.tradeGrade === 'GRADE_A' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {previewPlan.tradeGrade.replace('_', ' ')}
                </div>
              </div>

              {/* Fibonacci & Entry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60">
                  <div className="text-[10px] text-slate-400 font-bold">Suggested Entry</div>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {previewPlan.suggestedEntry}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60">
                  <div className="text-[10px] text-slate-400 font-bold">Stop Loss</div>
                  <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {previewPlan.stopLossPrice} (-{previewPlan.riskPercent}%)
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60">
                  <div className="text-[10px] text-slate-400 font-bold">Take Profit 1</div>
                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {previewPlan.targetPrice1}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60">
                  <div className="text-[10px] text-slate-400 font-bold">R:R Ratio</div>
                  <div className="text-xs font-black text-amber-500">
                    1 : {previewPlan.riskRewardRatio1}
                  </div>
                </div>
              </div>

              {/* 5-Level Bid/Offer Indicator */}
              <div className="text-[11px] flex items-center justify-between text-slate-500 dark:text-zinc-400 px-1">
                <span>กระดาน Bid/Offer Ratio:</span>
                <span className="font-bold text-emerald-400">
                  Bid {previewPlan.depth.bidRatioPercent}% / Offer {previewPlan.depth.offerRatioPercent}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={!selectedStock && !searchQuery.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>เพิ่มเข้าสู่ระบบวิเคราะห์</span>
          </button>
        </div>
      </div>
    </div>
  );
};
