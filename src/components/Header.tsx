import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  SlidersHorizontal, 
  Bookmark, 
  Bot, 
  Sun, 
  Moon, 
  Plus, 
  Activity, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  ChevronDown, 
  Phone, 
  User, 
  LogOut, 
  PieChart, 
  LayoutDashboard, 
  Target,
  Zap,
  RefreshCw,
  Clock,
  FileSpreadsheet,
  ArrowLeft
} from 'lucide-react';
import { StockData, AssetCategory, AuthUser, TradingMode } from '../types';
import { SataRobotLogo } from './SataRobotLogo';

interface HeaderProps {
  currentStock: StockData;
  allStocks: StockData[];
  onSelectStock: (stock: StockData) => void;
  onOpenScreener: () => void;
  onOpenWatchlist: () => void;
  onOpenAIAdvisor: () => void;
  onCustomTickerSearch: (ticker: string) => void;
  isSearchingCustom: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  watchlistCount: number;
  selectedCategory: AssetCategory;
  onOpenMarketModal: () => void;
  onSelectCategory: (cat: AssetCategory) => void;
  // View mode, user auth and objectives
  currentView: 'analysis' | 'my-portfolio' | 'portfolio' | 'day-trade' | 'paper-trade' | 'bot-dashboard';
  onChangeView: (view: 'analysis' | 'my-portfolio' | 'portfolio' | 'day-trade' | 'paper-trade' | 'bot-dashboard') => void;
  // Previous View & Back Navigation
  canGoBack?: boolean;
  onGoBack?: () => void;
  previousViewLabel?: string;
  authUser: AuthUser | null;
  onLogout: () => void;
  onOpenObjectiveModal: () => void;
  // Day Trade Mode props
  tradingMode: TradingMode;
  onToggleTradingMode: (mode: TradingMode) => void;
  onOpenDayTradeSetup: () => void;
  // Live Price Sync props
  onOpenPriceSyncModal?: () => void;
  lastSyncedTime?: Date;
  onSyncAllPrices?: () => void;
  // Custom Ticker Modal
  onOpenAddTickerModal?: () => void;
  // Audit Simulation & Working Paper Props
  onOpenAuditSimulationLab?: () => void;
  onOpenWorkingPaper?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStock,
  allStocks,
  onSelectStock,
  onOpenScreener,
  onOpenWatchlist,
  onOpenAIAdvisor,
  onCustomTickerSearch,
  isSearchingCustom,
  theme,
  onToggleTheme,
  watchlistCount,
  selectedCategory,
  onOpenMarketModal,
  onSelectCategory,
  currentView,
  onChangeView,
  canGoBack,
  onGoBack,
  previousViewLabel,
  authUser,
  onLogout,
  onOpenObjectiveModal,
  tradingMode,
  onToggleTradingMode,
  onOpenDayTradeSetup,
  onOpenPriceSyncModal,
  lastSyncedTime = new Date(),
  onSyncAllPrices,
  onOpenAddTickerModal,
  onOpenAuditSimulationLab,
  onOpenWorkingPaper,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFastSpinning, setIsFastSpinning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleQuickSyncClick = () => {
    setIsFastSpinning(true);
    if (onSyncAllPrices) {
      onSyncAllPrices();
    }
    setTimeout(() => {
      setIsFastSpinning(false);
    }, 600);
  };

  const adminPhone = '0864403357';
  const adminPhoneFormatted = '086 440 3357';

  // Filter stocks based on query
  const filteredStocks = allStocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stock: StockData) => {
    onSelectStock(stock);
    setIsOpenDropdown(false);
    setSearchQuery('');
    onChangeView('analysis');
  };

  const handleCustomSearchSubmit = () => {
    if (searchQuery.trim()) {
      onCustomTickerSearch(searchQuery.trim().toUpperCase());
      setIsOpenDropdown(false);
      setSearchQuery('');
      onChangeView('analysis');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 transition-colors">
      {/* Top Utility Contact & Quick Status Bar */}
      <div className={`text-zinc-300 text-[11px] py-1 px-2 sm:px-4 lg:px-6 flex items-center justify-between border-b transition-colors ${
        tradingMode === 'DAY_TRADE'
          ? 'bg-amber-950/90 text-amber-200 border-amber-800/80 shadow-xs'
          : 'bg-slate-900 dark:bg-[#000000] border-slate-800 dark:border-zinc-800/60'
      }`}>
        <div className="flex items-center space-x-2 truncate">
          {tradingMode === 'DAY_TRADE' ? (
            <span className="inline-flex items-center space-x-1.5 font-black text-amber-300 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">⚡ โหมดปัจจุบัน: DAY TRADE & SWING (เก็งกำไร 1 วัน - 1 สัปดาห์)</span>
              <span className="sm:hidden">⚡ DAY TRADE</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 font-bold text-amber-400">
              <span className="hidden sm:inline">💎 โหมดปัจจุบัน: VI & จัดพอร์ตระยะกลาง-ยาว</span>
              <span className="sm:hidden">💎 VI & พอร์ตระยะยาว</span>
            </span>
          )}
          <span className="hidden sm:inline text-zinc-500">|</span>
          <span className="hidden lg:inline text-zinc-400">
            {tradingMode === 'DAY_TRADE'
              ? 'ระบบชี้แนะจุดเข้า / Stop Loss / Take Profit รายวัน-รายสัปดาห์'
              : 'ระบบคัดกรองหุ้น & จัดพอร์ต 5-8 ตัวตาม Period การลงทุน'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Audit & Simulation Lab Trigger Pill */}
          {onOpenAuditSimulationLab && (
            <button
              type="button"
              onClick={onOpenAuditSimulationLab}
              className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
              title="เปิดห้องแล็บจำลองและทดสอบ 8 Audit Findings (Simulation Sandbox Mode)"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>🛡️ Audit Lab</span>
              <span className="hidden sm:inline text-[9px] bg-emerald-950/80 px-1 rounded text-emerald-200">8 Tests</span>
            </button>
          )}

          {/* Live Price Sync Status & Quick Trigger */}
          {onOpenPriceSyncModal && (
            <button
              type="button"
              onClick={onOpenPriceSyncModal}
              className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center space-x-1 transition-all cursor-pointer"
              title="เปิดศูนย์ซิงค์ & ปรับราคาตลาดสดให้ตรงกับ Streaming จริง"
            >
              <RefreshCw className={`w-3 h-3 text-amber-400 ${isFastSpinning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">ซิงค์ราคา:</span>
              <span>{lastSyncedTime.toLocaleTimeString('th-TH', { hour12: false })} น.</span>
            </button>
          )}

          {/* Fast Mode Switcher Pill */}
          <button
            type="button"
            onClick={() => {
              if (tradingMode === 'DAY_TRADE') {
                onToggleTradingMode('STANDARD_VI');
                onChangeView('analysis');
              } else {
                onToggleTradingMode('DAY_TRADE');
                onChangeView('day-trade');
                onOpenDayTradeSetup();
              }
            }}
            className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center space-x-1 cursor-pointer ${
              tradingMode === 'DAY_TRADE'
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs'
                : 'bg-indigo-900/60 hover:bg-amber-500 hover:text-slate-950 text-indigo-200 border border-indigo-700/60'
            }`}
          >
            {tradingMode === 'DAY_TRADE' ? (
              <>
                <span>🔄 สลับกลับ VI</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">⚡ สลับเป็น Day Trade</span>
                <span className="sm:hidden">⚡ Day Trade</span>
              </>
            )}
          </button>

          {authUser && (
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 max-w-[80px] sm:max-w-[120px] truncate" title={authUser.username}>
                {authUser.username}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="text-[10px] font-bold text-zinc-400 hover:text-rose-400 px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-colors flex items-center space-x-0.5 cursor-pointer"
                title="ออกจากระบบทันที (Logout)"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Command Bar Container */}
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3">
        
        {/* Left: Brand & Main Navigation Tabs */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div 
            onClick={() => onChangeView('analysis')}
            className="flex items-center space-x-2 cursor-pointer group shrink-0"
          >
            <SataRobotLogo size={34} glow={true} className="group-hover:scale-105 transition-transform" />
            <div className="hidden sm:block">
              <div className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-none flex items-center space-x-1">
                <span>SBY Invest</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/30">
                  AI
                </span>
              </div>
              <div className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 leading-tight hidden md:block">
                Value + Momentum
              </div>
            </div>
          </div>

          {/* Previous Page / Back Button (Active when navigating from previous view) */}
          {onGoBack && (
            <button
              id="header-prev-page-btn"
              type="button"
              onClick={onGoBack}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0 active:scale-95 mr-1 group"
              title={`ย้อนกลับไปหน้า: ${previousViewLabel || 'หน้าก่อนหน้า'}`}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">← ย้อนกลับ</span>
              <span className="sm:hidden">กลับ</span>
            </button>
          )}

          {/* Primary View Switcher Tabs (Analysis vs My Portfolio vs AI Portfolio Builder vs Day Trade) */}
          <div className="flex items-center bg-slate-100 dark:bg-[#18181B] p-0.5 sm:p-1 rounded-2xl border border-slate-200/80 dark:border-zinc-800 text-xs font-bold shrink-0">
            <button
              onClick={() => onChangeView('analysis')}
              id="nav-tab-analysis"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                currentView === 'analysis'
                  ? 'bg-white dark:bg-[#121215] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">วิเคราะห์รายตัว</span>
              <span className="xl:hidden hidden sm:inline">วิเคราะห์</span>
            </button>

            <button
              onClick={() => onChangeView('my-portfolio')}
              id="nav-tab-my-portfolio"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                currentView === 'my-portfolio'
                  ? 'bg-white dark:bg-[#121215] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden xl:inline">พอร์ตติดตามเอง</span>
              <span className="xl:hidden hidden sm:inline">พอร์ตฉัน</span>
            </button>

            <button
              onClick={() => onChangeView('portfolio')}
              id="nav-tab-portfolio"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                currentView === 'portfolio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
              <span className="hidden 2xl:inline">AI จัดพอร์ต (5-8 ตัว)</span>
              <span className="2xl:hidden hidden sm:inline">AI จัดพอร์ต</span>
            </button>

            {/* DEDICATED DAY TRADE TERMINAL */}
            <button
              onClick={() => {
                onToggleTradingMode('DAY_TRADE');
                onChangeView('day-trade');
              }}
              id="nav-tab-day-trade"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1 font-black ${
                currentView === 'day-trade'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 shrink-0 ${currentView === 'day-trade' ? 'text-slate-950' : 'text-amber-500'}`} />
              <span className="hidden 2xl:inline">⚡ Day Trade & Anti-SL</span>
              <span className="2xl:hidden hidden sm:inline">⚡ Day Trade</span>
            </button>

            {/* PAPER TRADING SIMULATOR TAB (1-3 MONTHS ZERO RISK) */}
            <button
              onClick={() => onChangeView('paper-trade')}
              id="nav-tab-paper-trade"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1 font-black ${
                currentView === 'paper-trade'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${currentView === 'paper-trade' ? 'text-white' : 'text-emerald-500'}`} />
              <span className="hidden 2xl:inline">🎮 ซ้อมเทรด (1-3 ด.)</span>
              <span className="2xl:hidden hidden sm:inline">🎮 ซ้อมเทรด</span>
            </button>

            {/* BOT TRADING & POST-MARKET REPORTS TAB */}
            <button
              onClick={() => onChangeView('bot-dashboard')}
              id="nav-tab-bot-dashboard"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1 font-black ${
                currentView === 'bot-dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10'
              }`}
            >
              <Bot className={`w-3.5 h-3.5 shrink-0 ${currentView === 'bot-dashboard' ? 'text-white' : 'text-indigo-500'}`} />
              <span className="hidden 2xl:inline">🤖 บอตเทรด & รายงาน</span>
              <span className="2xl:hidden hidden sm:inline">🤖 บอตเทรด</span>
            </button>
          </div>
        </div>

        {/* Center: Global Search Bar with Autocomplete & Custom AI Stock Lookup */}
        <div ref={dropdownRef} className="relative flex-1 min-w-[100px] max-w-[140px] md:max-w-[180px] lg:max-w-[220px] xl:max-w-xs hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="header-stock-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpenDropdown(true);
              }}
              onFocus={() => setIsOpenDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomSearchSubmit();
              }}
              placeholder="ค้นหา เช่น CPALL..."
              className="w-full pl-8 pr-12 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={handleCustomSearchSubmit}
                disabled={isSearchingCustom}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-500 transition-all flex items-center space-x-0.5"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>AI</span>
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpenDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                สินทรัพย์ในระบบ ({filteredStocks.length})
              </div>

              {filteredStocks.length > 0 ? (
                <div className="py-1">
                  {filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelect(stock)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-zinc-100">
                          {stock.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          {stock.market}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                          {stock.name}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-zinc-200">
                          {stock.currentPrice} {stock.currency}
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mb-2">
                    ไม่พบสินทรัพย์ "{searchQuery}" ในระบบพรีเซ็ต
                  </p>
                  <button
                    onClick={handleCustomSearchSubmit}
                    disabled={isSearchingCustom}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ใช้ Gemini AI วิเคราะห์ "{searchQuery.toUpperCase()}" ทันที</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Command Action Buttons (Fully Visible & Compact) */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          
          {/* + Add Custom Ticker Button */}
          {onOpenAddTickerModal && (
            <button
              id="open-add-ticker-btn"
              onClick={onOpenAddTickerModal}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-black rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 transition-all shadow-xs cursor-pointer shrink-0"
              title="เพิ่มหุ้นหรือสินทรัพย์ใหม่เข้าสู่ระบบวิเคราะห์ (+ Add Ticker)"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white shrink-0" />
              <span className="hidden 2xl:inline">+ Add Ticker</span>
              <span className="hidden xl:inline 2xl:hidden">+ Add</span>
            </button>
          )}

          {/* Live Price Sync & Daily Price Report Button */}
          {onOpenPriceSyncModal && (
            <button
              id="open-price-sync-btn"
              onClick={onOpenPriceSyncModal}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-black rounded-xl border border-indigo-400/80 dark:border-indigo-500/50 bg-indigo-500/15 dark:bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 transition-all shadow-xs cursor-pointer group shrink-0"
              title="เปิดศูนย์รายงานราคาปิดประจำวัน (Daily Stock Price Report), Export Excel/PDF, และนำเข้า Siamchart"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:text-white shrink-0" />
              <span className="hidden 2xl:inline">รายงานราคาปิด (Last)</span>
              <span className="hidden lg:inline 2xl:hidden">ราคาปิด EOD</span>
            </button>
          )}

          {/* Investment Goal / Objective & Market Category Button */}
          <button
            id="open-objective-modal-btn"
            onClick={onOpenObjectiveModal}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 transition-all shadow-xs shrink-0"
            title="ตั้งค่าวินัยการลงทุน วงเงิน เป้าหมาย และเลือกกระดาน"
          >
            <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-xs">
              {selectedCategory === 'THAI_STOCK' ? '🇹🇭 หุ้นไทย' : selectedCategory === 'GLOBAL_STOCK' ? '🌐 หุ้นนอก' : selectedCategory === 'FOREX' ? '💱 Forex' : '✨ วัตถุประสงค์'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
          </button>

          {/* Working Paper Proposal Table Button (Audit Spec #7) */}
          {onOpenWorkingPaper && (
            <button
              id="open-working-paper-btn"
              onClick={onOpenWorkingPaper}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-black rounded-xl border border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 transition-all shadow-xs cursor-pointer group shrink-0"
              title="เปิดตาราง Working Paper Proposal เสนอจุดเข้า Entry / Multi-Tier SL / TP และลงนาม Sign-Off"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-white shrink-0" />
              <span className="hidden xl:inline">Working Paper</span>
              <span className="hidden sm:inline xl:hidden">Paper</span>
            </button>
          )}

          {/* Screener Button */}
          <button
            id="open-screener-btn"
            onClick={onOpenScreener}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all shadow-xs shrink-0"
            title="เครื่องมือคัดกรองหุ้นตามเกณฑ์พื้นฐานและเทคนิค"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="hidden lg:inline">Screener</span>
          </button>

          {/* Watchlist Button */}
          <button
            id="open-watchlist-btn"
            onClick={onOpenWatchlist}
            className="relative flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all shadow-xs shrink-0"
            title="ดูหุ้นในพอร์ตและแผนการเทรดที่บันทึกไว้"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="hidden lg:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* AI Advisor Chat Drawer Button */}
          <button
            id="open-ai-advisor-btn"
            onClick={onOpenAIAdvisor}
            className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-500/20 transition-all shrink-0"
            title="เปิด AI Advisor ที่ปรึกษาการลงทุน"
          >
            <Bot className="w-3.5 h-3.5 animate-pulse shrink-0" />
            <span className="hidden sm:inline">AI Chat</span>
          </button>

          {/* Theme Switcher */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all shrink-0"
            title="สลับโหมดมืด/สว่าง"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
          </button>

          {/* User Profile & Logout Menu */}
          {authUser && (
            <div ref={userMenuRef} className="relative shrink-0">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-all"
                title="บัญชีผู้ใช้ / ออกจากระบบ"
              >
                <User className="w-3.5 h-3.5" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 text-xs">
                  <div className="pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {authUser.username}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                      สิทธิ์: {authUser.role === 'admin' ? '🛡️ Admin' : '👤 นักลงทุนทั่วไป'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenObjectiveModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center space-x-2"
                    >
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      <span>ตั้งค่าวินัย & กระดาน</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ออกจากระบบ (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
