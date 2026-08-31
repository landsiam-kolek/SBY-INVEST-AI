import React, { useState, useMemo } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  Zap, 
  Tag, 
  Search, 
  ArrowUpDown, 
  Check, 
  ChevronRight,
  Filter,
  BarChart2
} from 'lucide-react';
import { StockData, ScreenerFilter, StockCapSize } from '../types';
import { categorizeStockCapSize } from '../utils/priceSyncEngine';

interface StockScreenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockData[];
  onSelectStock: (stock: StockData) => void;
}

export const StockScreenerModal: React.FC<StockScreenerModalProps> = ({
  isOpen,
  onClose,
  stocks,
  onSelectStock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dividend' | 'growth' | 'breakout' | 'undervalued'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'SET' | 'US' | 'FOREX'>('ALL');
  const [capSizeFilter, setCapSizeFilter] = useState<'ALL' | StockCapSize>('ALL');
  const [priceBracket, setPriceBracket] = useState<'ALL' | 'UNDER_10' | '10_TO_50' | '50_TO_100' | 'ABOVE_100' | 'CUSTOM'>('ALL');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [minDividend, setMinDividend] = useState(0);
  const [maxPE, setMaxPE] = useState(100);
  const [minROE, setMinROE] = useState(0);
  const [sortBy, setSortBy] = useState<'fundamentalScore' | 'technicalScore' | 'dividendYield' | 'roe' | 'marginOfSafety'>('fundamentalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handlePriceBracketChange = (bracket: 'ALL' | 'UNDER_10' | '10_TO_50' | '50_TO_100' | 'ABOVE_100' | 'CUSTOM') => {
    setPriceBracket(bracket);
    if (bracket === 'UNDER_10') {
      setMinPriceInput('0');
      setMaxPriceInput('10');
    } else if (bracket === '10_TO_50') {
      setMinPriceInput('10');
      setMaxPriceInput('50');
    } else if (bracket === '50_TO_100') {
      setMinPriceInput('50');
      setMaxPriceInput('100');
    } else if (bracket === 'ABOVE_100') {
      setMinPriceInput('100');
      setMaxPriceInput('');
    } else if (bracket === 'ALL') {
      setMinPriceInput('');
      setMaxPriceInput('');
    }
  };

  const filteredStocks = useMemo(() => {
    const minP = minPriceInput ? parseFloat(minPriceInput) : 0;
    const maxP = maxPriceInput ? parseFloat(maxPriceInput) : Infinity;

    return stocks.filter((stock) => {
      // Market / Asset filter
      if (marketFilter === 'SET' && stock.assetCategory !== 'THAI_STOCK' && stock.market !== 'SET') return false;
      if (marketFilter === 'US' && stock.assetCategory !== 'GLOBAL_STOCK' && stock.market !== 'US') return false;
      if (marketFilter === 'FOREX' && stock.assetCategory !== 'FOREX') return false;

      // Stock Cap Size Filter
      if (capSizeFilter !== 'ALL') {
        if (categorizeStockCapSize(stock) !== capSizeFilter) return false;
      }

      // Price filter (apply to Stocks / Commodities)
      if (stock.assetCategory !== 'FOREX') {
        if (minP > 0 && stock.currentPrice < minP) return false;
        if (maxP < Infinity && stock.currentPrice > maxP) return false;
      }

      // Text query
      if (
        searchQuery &&
        !stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !stock.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Presets
      if (selectedCategory === 'dividend') {
        if (stock.dividendYield < 3.0) return false;
      } else if (selectedCategory === 'growth') {
        if (stock.roe < 15 || stock.revenueGrowth < 8) return false;
      } else if (selectedCategory === 'breakout') {
        if (stock.trend !== 'UPTREND' || stock.technicalScore < 80) return false;
      } else if (selectedCategory === 'undervalued') {
        if (stock.valuationStatus !== 'UNDERVALUED' || stock.marginOfSafety < 8) return false;
      }

      // Custom sliders (apply only if not Forex)
      if (stock.assetCategory !== 'FOREX') {
        if (stock.dividendYield < minDividend) return false;
        if (stock.pe > maxPE) return false;
        if (stock.roe < minROE) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      return sortOrder === 'desc' ? Number(valB) - Number(valA) : Number(valA) - Number(valB);
    });
  }, [stocks, selectedCategory, searchQuery, marketFilter, capSizeFilter, minPriceInput, maxPriceInput, minDividend, maxPE, minROE, sortBy, sortOrder]);

  if (!isOpen) return null;

  const handlePresetClick = (cat: 'all' | 'dividend' | 'growth' | 'breakout' | 'undervalued') => {
    setSelectedCategory(cat);
    if (cat === 'dividend') {
      setMinDividend(3.5);
      setMaxPE(30);
      setMinROE(10);
    } else if (cat === 'growth') {
      setMinDividend(0);
      setMaxPE(80);
      setMinROE(15);
    } else if (cat === 'undervalued') {
      setMinDividend(0);
      setMaxPE(25);
      setMinROE(8);
    } else {
      setMinDividend(0);
      setMaxPE(100);
      setMinROE(0);
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                SBY Stock Screener (เครื่องมือคัดกรองหุ้นอัจฉริยะ)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                คัดกรองหุ้นตามเกณฑ์พื้นฐาน (Fundamental) และจังหวะเทคนิค (Technical Timing)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-5 bg-slate-50 dark:bg-[#18181B] border-b border-slate-200/70 dark:border-zinc-800 space-y-4">
          {/* Preset Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePresetClick('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              ทั้งหมด ({stocks.length})
            </button>

            <button
              onClick={() => handlePresetClick('dividend')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                selectedCategory === 'dividend'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>💎 หุ้นปันผลเด่น (High Dividend)</span>
            </button>

            <button
              onClick={() => handlePresetClick('growth')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                selectedCategory === 'growth'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-50 dark:hover:bg-blue-950/40'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>🚀 หุ้นเติบโตคุณภาพ (High Growth & ROE)</span>
            </button>

            <button
              onClick={() => handlePresetClick('breakout')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                selectedCategory === 'breakout'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ หุ้น Breakout โมเมนตัมเด่น</span>
            </button>

            <button
              onClick={() => handlePresetClick('undervalued')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                selectedCategory === 'undervalued'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>🏷️ หุ้น Undervalued (มี Margin of Safety)</span>
            </button>
          </div>

          {/* Sliders & Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหุ้นหรือกลุ่ม..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121215] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Market Select */}
            <div className="flex items-center space-x-1 bg-white dark:bg-[#121215] p-1 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs">
              <span className="text-slate-400 dark:text-zinc-500 px-1 font-medium">ตลาด:</span>
              {(['ALL', 'SET', 'US', 'FOREX'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarketFilter(m)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                    marketFilter === m
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m === 'ALL' ? 'ทั้งหมด' : m === 'SET' ? '🇹🇭 SET' : m === 'US' ? '🌐 US' : '💱 Forex'}
                </button>
              ))}
            </div>

            {/* Min Dividend Slider */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-0.5">
                <span>ปันผลขั้นต่ำ:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{minDividend}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={minDividend}
                onChange={(e) => setMinDividend(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Min ROE Slider */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-0.5">
                <span>ROE ขั้นต่ำ:</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{minROE}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="2"
                value={minROE}
                onChange={(e) => setMinROE(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Stock Cap Size Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center space-x-1 mr-1">
                <span>🏢 ขนาดหุ้น (Market Cap):</span>
              </span>
              {(
                [
                  { id: 'ALL' as const, label: 'ทุกขนาด' },
                  { id: 'LARGE_CAP' as const, label: 'Large Cap (SET50)' },
                  { id: 'MID_CAP' as const, label: 'Mid Cap (SET100)' },
                  { id: 'SMALL_CAP' as const, label: 'Small Cap' },
                  { id: 'MAI' as const, label: 'MAI' },
                ]
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCapSizeFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    capSizeFilter === c.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
              พบ {filteredStocks.length} สินทรัพย์ที่ตรงเงื่อนไข
            </div>
          </div>

          {/* Price Range Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center space-x-1 mr-1">
                <span>🏷️ ระดับราคาหุ้น:</span>
              </span>
              {(
                [
                  { id: 'ALL', label: 'ทุกระดับราคา' },
                  { id: 'UNDER_10', label: 'ต่ำกว่า 10 ฿' },
                  { id: '10_TO_50', label: '10 - 50 ฿' },
                  { id: '50_TO_100', label: '50 - 100 ฿' },
                  { id: 'ABOVE_100', label: 'เกิน 100 ฿' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePriceBracketChange(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    priceBracket === p.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Min / Max Price Inputs */}
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-500 dark:text-zinc-400 font-medium">ระบุช่วงราคาเอง:</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Min ฿"
                  value={minPriceInput}
                  onChange={(e) => {
                    setMinPriceInput(e.target.value);
                    setPriceBracket('CUSTOM');
                  }}
                  className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121215] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Max ฿"
                  value={maxPriceInput}
                  onChange={(e) => {
                    setMaxPriceInput(e.target.value);
                    setPriceBracket('CUSTOM');
                  }}
                  className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121215] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {(minPriceInput || maxPriceInput) && (
                  <button
                    type="button"
                    onClick={() => handlePriceBracketChange('ALL')}
                    className="text-[10px] text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
                  >
                    ล้างราคา
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="text-xs text-slate-400 dark:text-zinc-500 mb-2 flex justify-between items-center">
            <span>ผลลัพธ์การคัดกรอง: <strong className="text-slate-700 dark:text-zinc-200">{filteredStocks.length}</strong> ตัว</span>
            <span>คลิกแถวเพื่อเลือกดูการวิเคราะห์</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
              <thead className="bg-slate-50 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3">ชื่อหุ้น / กลุ่มธุรกิจ</th>
                  <th className="p-3">ราคาล่าสุด</th>
                  <th className="p-3 cursor-pointer hover:text-indigo-500" onClick={() => toggleSort('fundamentalScore')}>
                    <div className="flex items-center space-x-1">
                      <span>Fundamental Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-indigo-500" onClick={() => toggleSort('technicalScore')}>
                    <div className="flex items-center space-x-1">
                      <span>Technical Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-indigo-500" onClick={() => toggleSort('marginOfSafety')}>
                    <div className="flex items-center space-x-1">
                      <span>Fair Value / MOS</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-indigo-500" onClick={() => toggleSort('dividendYield')}>
                    <div className="flex items-center space-x-1">
                      <span>Div. Yield</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-indigo-500" onClick={() => toggleSort('roe')}>
                    <div className="flex items-center space-x-1">
                      <span>ROE</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-right">คำแนะนำ AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() => {
                      onSelectStock(stock);
                      onClose();
                    }}
                    className="hover:bg-indigo-50/50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {stock.symbol}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-medium">
                          {stock.market}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500 line-clamp-1">
                        {stock.sector}
                      </div>
                    </td>

                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {stock.currentPrice} {stock.currency}
                      <div className={`text-[10px] ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                        {stock.fundamentalScore}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">/100</span>
                    </td>

                    <td className="p-3">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {stock.technicalScore}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">/100</span>
                    </td>

                    <td className="p-3">
                      <div className="font-medium text-slate-800 dark:text-zinc-200">
                        {stock.fairValue} {stock.currency}
                      </div>
                      <span className={`text-[10px] font-bold ${
                        stock.marginOfSafety >= 10 ? 'text-emerald-500' : stock.marginOfSafety < 0 ? 'text-rose-500' : 'text-blue-500'
                      }`}>
                        MOS: {stock.marginOfSafety >= 0 ? '+' : ''}{stock.marginOfSafety}%
                      </span>
                    </td>

                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {stock.dividendYield}%
                    </td>

                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {stock.roe}%
                    </td>

                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                        stock.compositeRating === 'STRONG_BUY' || stock.compositeRating === 'BUY'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : stock.compositeRating === 'ACCUMULATE'
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {stock.compositeRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
