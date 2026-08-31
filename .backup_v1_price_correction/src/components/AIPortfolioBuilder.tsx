import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Layers, 
  Target, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Check, 
  Copy, 
  Printer, 
  Bot, 
  SlidersHorizontal, 
  RefreshCw, 
  ChevronRight, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  ExternalLink,
  BookmarkPlus,
  Trash2,
  Edit3,
  Search,
  X,
  Sliders,
  RotateCcw,
  ArrowRight,
  Scale
} from 'lucide-react';
import { 
  StockData, 
  InvestorProfile, 
  AIPortfolio, 
  PortfolioItem, 
  AssetCategory, 
  InvestmentPeriod, 
  RiskProfile, 
  PriceBracketType,
  StockCapSize 
} from '../types';
import { buildIntelligentPortfolio, recalculatePortfolioFromItems } from '../utils/portfolioEngine';
import { formatNumber } from '../utils/calculations';

interface AIPortfolioBuilderProps {
  allStocks: StockData[];
  investorProfile: InvestorProfile;
  onUpdateInvestorProfile: (newProfile: InvestorProfile) => void;
  onSelectStockForDeepAnalysis: (stock: StockData) => void;
  onBatchAddToWatchlist: (items: PortfolioItem[]) => void;
  onOpenAIChat: () => void;
  onApplyToMyPortfolio?: (items: PortfolioItem[]) => void;
}

export const AIPortfolioBuilder: React.FC<AIPortfolioBuilderProps> = ({
  allStocks,
  investorProfile,
  onUpdateInvestorProfile,
  onSelectStockForDeepAnalysis,
  onBatchAddToWatchlist,
  onOpenAIChat,
  onApplyToMyPortfolio,
}) => {
  // Local Config state
  const [capital, setCapital] = useState<number>(investorProfile.capital || 200000);
  const [targetReturn, setTargetReturn] = useState<number>(investorProfile.targetReturnPercent || 18);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(investorProfile.riskProfile || 'MODERATE');
  const [period, setPeriod] = useState<InvestmentPeriod>(investorProfile.period || '6_12_MONTHS');
  const [preferredBoard, setPreferredBoard] = useState<AssetCategory>(investorProfile.preferredBoard || 'ALL');
  const [stockSize, setStockSize] = useState<'ALL' | StockCapSize>(investorProfile.stockSizePreference || 'ALL');
  const [priceBracket, setPriceBracket] = useState<PriceBracketType>(investorProfile.pricePreference?.bracket || 'ALL');
  const [customMinPrice, setCustomMinPrice] = useState<string>(
    investorProfile.pricePreference?.minPrice !== undefined ? String(investorProfile.pricePreference.minPrice) : ''
  );
  const [customMaxPrice, setCustomMaxPrice] = useState<string>(
    investorProfile.pricePreference?.maxPrice !== undefined ? String(investorProfile.pricePreference.maxPrice) : ''
  );

  // Portfolio State
  const [portfolio, setPortfolio] = useState<AIPortfolio>(() => {
    return buildIntelligentPortfolio(allStocks, investorProfile);
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [addedWatchlist, setAddedWatchlist] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');

  // Edit Stock State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editSelectedSymbol, setEditSelectedSymbol] = useState<string>('');
  const [editWeight, setEditWeight] = useState<number>(20);
  const [editEntryPrice, setEditEntryPrice] = useState<number>(50);
  const [editTargetPrice, setEditTargetPrice] = useState<number>(60);
  const [editStopLossPrice, setEditStopLossPrice] = useState<number>(45);
  const [editRole, setEditRole] = useState<PortfolioItem['roleInPortfolio']>('Growth Engine');
  const [editStockSearch, setEditStockSearch] = useState<string>('');

  // Add Stock Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addStockSearch, setAddStockSearch] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync profile changes and re-generate
  const handleGeneratePortfolio = async (customProfile?: InvestorProfile) => {
    setIsGeneratingAI(true);
    const activeProfile: InvestorProfile = customProfile || {
      capital,
      currency: 'THB',
      targetReturnPercent: targetReturn,
      riskProfile,
      period,
      preferredBoard,
      stockSizePreference: stockSize,
      objective: investorProfile.objective,
      pricePreference: {
        bracket: priceBracket,
        minPrice: customMinPrice ? parseFloat(customMinPrice) : undefined,
        maxPrice: customMaxPrice ? parseFloat(customMaxPrice) : undefined,
      },
    };

    onUpdateInvestorProfile(activeProfile);

    // 1. Generate base multi-factor algorithmic portfolio
    const basePort = buildIntelligentPortfolio(allStocks, activeProfile);

    // 2. Call Gemini for high-level commentary
    try {
      const res = await fetch('/api/generate-ai-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorProfile: activeProfile,
          selectedStocks: basePort.items,
        }),
      });
      const data = await res.json();
      if (data.success && data.commentary) {
        basePort.aiExecutiveSummary = data.commentary;
      }
    } catch (err) {
      console.warn('AI Commentary fetch fallback to default:', err);
    } finally {
      setPortfolio(basePort);
      setIsGeneratingAI(false);
      setAddedWatchlist(false);
      showToast(`🤖 AI จัดพอร์ต ${basePort.items.length} สินทรัพย์แบบไม่ซ้ำกันตามเงื่อนไขเรียบร้อย`);
    }
  };

  // 1. DELETE STOCK FUNCTION
  const handleRemoveStock = (symbolToRemove: string) => {
    if (portfolio.items.length <= 1) {
      alert('พอร์ตต้องมีสินทรัพย์อย่างน้อย 1 รายการครับ');
      return;
    }

    const remaining = portfolio.items.filter(
      (item) => item.stock.symbol.toUpperCase() !== symbolToRemove.toUpperCase()
    );

    // Normalize weights to sum exactly to 100%
    const currentSum = remaining.reduce((sum, i) => sum + i.weightPercent, 0);
    const normalized = remaining.map((item, idx) => {
      if (currentSum > 0) {
        const raw = (item.weightPercent / currentSum) * 100;
        return {
          ...item,
          weightPercent: Number(raw.toFixed(1)),
        };
      }
      return {
        ...item,
        weightPercent: Number((100 / remaining.length).toFixed(1)),
      };
    });

    // Ensure sum is exactly 100%
    const finalSum = normalized.reduce((sum, i) => sum + i.weightPercent, 0);
    const diff = Number((100 - finalSum).toFixed(1));
    if (diff !== 0 && normalized.length > 0) {
      normalized[0].weightPercent = Number((normalized[0].weightPercent + diff).toFixed(1));
    }

    const updatedPort = recalculatePortfolioFromItems(
      normalized,
      capital,
      portfolio.investorProfile,
      `ปรับปรุงพอร์ต: ลบหุ้น ${symbolToRemove} ออก และกระจายสัดส่วนให้กับ ${remaining.length} หุ้นที่เหลือครบ 100%`
    );

    setPortfolio(updatedPort);
    showToast(`🗑️ ลบหุ้น ${symbolToRemove} ออกจากพอร์ต และปรับเกลี่ยสัดส่วนให้ครบ 100% เรียบร้อย`);
  };

  // 2. OPEN EDIT MODAL
  const handleOpenEditModal = (item: PortfolioItem, index: number) => {
    setEditingItemIndex(index);
    setEditSelectedSymbol(item.stock.symbol);
    setEditWeight(item.weightPercent);
    setEditEntryPrice(item.entryPrice || item.stock.currentPrice);
    setEditTargetPrice(item.targetPrice || item.stock.targetPrice1 || Number((item.entryPrice * 1.15).toFixed(2)));
    setEditStopLossPrice(item.stopLossPrice || item.stock.stopLossPrice || Number((item.entryPrice * 0.93).toFixed(2)));
    setEditRole(item.roleInPortfolio);
    setEditStockSearch('');
  };

  // 3. SAVE EDITED ITEM
  const handleSaveEditedItem = () => {
    if (editingItemIndex === null || !portfolio.items[editingItemIndex]) return;

    const matchedStock = allStocks.find((s) => s.symbol.toUpperCase() === editSelectedSymbol.toUpperCase()) || portfolio.items[editingItemIndex].stock;
    
    // Check if new symbol is already in another slot in portfolio
    const isDuplicate = portfolio.items.some(
      (item, idx) => idx !== editingItemIndex && item.stock.symbol.toUpperCase() === matchedStock.symbol.toUpperCase()
    );

    if (isDuplicate) {
      alert(`หุ้น ${matchedStock.symbol} มีอยู่ในพอร์ตแล้ว กรุณาเลือกหุ้นตัวอื่นเพื่อไม่ให้มีหุ้นซ้ำกันครับ`);
      return;
    }

    const updatedList = [...portfolio.items];
    const prevItem = updatedList[editingItemIndex];

    const updatedItem: PortfolioItem = {
      ...prevItem,
      stock: matchedStock,
      entryPrice: editEntryPrice,
      targetPrice: editTargetPrice,
      stopLossPrice: editStopLossPrice,
      weightPercent: Math.max(1, editWeight),
      roleInPortfolio: editRole,
      thesis: `${matchedStock.name} - คะแนนพื้นฐาน ${matchedStock.fundamentalScore}/100, ปรับแผนเข้าซื้อ ${editEntryPrice}, เป้าหมาย ${editTargetPrice}, SL ${editStopLossPrice}`,
    };

    updatedList[editingItemIndex] = updatedItem;

    const updatedPort = recalculatePortfolioFromItems(
      updatedList,
      capital,
      portfolio.investorProfile,
      `ปรับแต่งข้อมูลหุ้น ${matchedStock.symbol} (สัดส่วน ${editWeight}%, ทุน ${editEntryPrice}, TP ${editTargetPrice}, SL ${editStopLossPrice})`
    );

    setPortfolio(updatedPort);
    setEditingItemIndex(null);
    showToast(`✏️ บันทึกการแก้ไขหุ้น ${matchedStock.symbol} เรียบร้อย`);
  };

  // 4. ADD NEW STOCK TO PORTFOLIO
  const handleAddStockToPortfolio = (stockToAdd: StockData) => {
    const isAlreadyPresent = portfolio.items.some(
      (item) => item.stock.symbol.toUpperCase() === stockToAdd.symbol.toUpperCase()
    );

    if (isAlreadyPresent) {
      alert(`หุ้น ${stockToAdd.symbol} มีอยู่ในพอร์ตแล้ว ไม่สามารถเพิ่มซ้ำได้ครับ`);
      return;
    }

    const entry = stockToAdd.currentPrice;
    const target = stockToAdd.targetPrice1 || Number((entry * 1.15).toFixed(2));
    const stopLoss = stockToAdd.stopLossPrice || Number((entry * 0.93).toFixed(2));
    
    // Equal distribution for new stock
    const newCount = portfolio.items.length + 1;
    const newWeight = Number((100 / newCount).toFixed(1));

    const scaledExisting = portfolio.items.map((item) => ({
      ...item,
      weightPercent: newWeight,
    }));

    const newItem: PortfolioItem = {
      stock: stockToAdd,
      weightPercent: newWeight,
      allocatedCapital: Math.round((capital * newWeight) / 100),
      recommendedBuyZone: `${(entry * 0.985).toFixed(2)} - ${(entry * 1.01).toFixed(2)}`,
      recommendedShares: stockToAdd.currency === 'THB' ? Math.max(100, Math.floor(((capital * newWeight) / 100) / entry / 100) * 100) : Math.max(1, Math.floor(((capital * newWeight) / 100) / entry)),
      entryPrice: entry,
      targetPrice: target,
      stopLossPrice: stopLoss,
      expectedReturnPercent: Number((((target - entry) / entry) * 100).toFixed(1)),
      riskPercent: Number((((entry - stopLoss) / entry) * 100).toFixed(1)),
      riskRewardRatio: Number(((((target - entry) / entry) * 100) / Math.max(0.1, (((entry - stopLoss) / entry) * 100))).toFixed(2)),
      thesis: `${stockToAdd.name} - คะแนนพื้นฐาน ${stockToAdd.fundamentalScore}/100, เทรนด์ ${stockToAdd.trend}, MOS ${stockToAdd.marginOfSafety}%`,
      periodMonitoringPlan: `เฝ้าติดตามแนวรับ ${stockToAdd.support1 || stopLoss} และเป้าหมายทำกำไร ${target}`,
      roleInPortfolio: stockToAdd.dividendYield >= 4 ? 'Dividend Generator' : stockToAdd.trend === 'UPTREND' ? 'Momentum Catalyst' : 'Growth Engine',
    };

    const combinedList = [...scaledExisting, newItem];

    // Ensure sum equals 100
    const sumW = combinedList.reduce((sum, i) => sum + i.weightPercent, 0);
    const diff = Number((100 - sumW).toFixed(1));
    if (diff !== 0 && combinedList.length > 0) {
      combinedList[0].weightPercent = Number((combinedList[0].weightPercent + diff).toFixed(1));
    }

    const updatedPort = recalculatePortfolioFromItems(
      combinedList,
      capital,
      portfolio.investorProfile,
      `เพิ่มหุ้น ${stockToAdd.symbol} เข้าสู่พอร์ต รวมเป็น ${combinedList.length} ตัว พร้อมกระจายสัดส่วนใหม่`
    );

    setPortfolio(updatedPort);
    setIsAddModalOpen(false);
    showToast(`✨ เพิ่มหุ้น ${stockToAdd.symbol} เข้าพอร์ตเรียบร้อย (${combinedList.length} สินทรัพย์)`);
  };

  // 5. EQUAL WEIGHT REBALANCE
  const handleEqualWeightAll = () => {
    if (portfolio.items.length === 0) return;
    const count = portfolio.items.length;
    const eqWeight = Number((100 / count).toFixed(1));

    const rebalanced = portfolio.items.map((item) => ({
      ...item,
      weightPercent: eqWeight,
    }));

    const sumW = rebalanced.reduce((sum, i) => sum + i.weightPercent, 0);
    const diff = Number((100 - sumW).toFixed(1));
    if (diff !== 0 && rebalanced.length > 0) {
      rebalanced[0].weightPercent = Number((rebalanced[0].weightPercent + diff).toFixed(1));
    }

    const updatedPort = recalculatePortfolioFromItems(
      rebalanced,
      capital,
      portfolio.investorProfile,
      `ปรับสัดส่วนทุกหุ้นให้เท่ากันที่ ${eqWeight}% รวม 100%`
    );

    setPortfolio(updatedPort);
    showToast(`⚖️ ปรับสัดส่วนทุกตัวเท่ากัน (${eqWeight}% ต่อตัว) เรียบร้อย`);
  };

  // 6. APPLY TO MY PORTFOLIO TRACKER
  const handleApplyToMyPortfolio = () => {
    if (onApplyToMyPortfolio) {
      onApplyToMyPortfolio(portfolio.items);
      showToast(`🚀 ส่งแผนพอร์ต ${portfolio.items.length} รายการไปยังพอร์ตของฉันเรียบร้อย`);
    } else {
      showToast(`คัดลอกแผนพอร์ต ${portfolio.items.length} รายการพร้อมใช้งาน`);
    }
  };

  const handleBatchWatchlist = () => {
    onBatchAddToWatchlist(portfolio.items);
    setAddedWatchlist(true);
    showToast(`⭐ บันทึกหุ้นทั้ง ${portfolio.items.length} ตัวเข้า Watchlist แล้ว`);
    setTimeout(() => setAddedWatchlist(false), 3000);
  };

  const handleCopyPlan = () => {
    const textSummary = `
📊 แผนการจัดพอร์ตการลงทุน SBY Invest AI
━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 เงินลงทุนรวม: ${portfolio.totalCapital.toLocaleString()} THB
🎯 คาดการณ์ผลตอบแทน: +${portfolio.weightedExpectedReturn}% ต่อปี
⚖️ ระดับความเสี่ยง: ${portfolio.investorProfile.riskProfile}
⏳ ระยะเวลาเฝ้าติดตาม (Period): ${
      portfolio.investorProfile.period === '1_3_MONTHS' ? '1-3 เดือน' : 
      portfolio.investorProfile.period === '3_6_MONTHS' ? '3-6 เดือน' : 
      portfolio.investorProfile.period === '6_12_MONTHS' ? '6-12 เดือน' : '1-3 ปี'
    }
💵 เงินปันผลคาดการณ์: ${portfolio.estimatedAnnualDividend.toLocaleString()} THB/ปี

📋 สรุปรายการสินทรัพย์ ${portfolio.items.length} ตัวในพอร์ต (ไม่มีตัวซ้ำ):
${portfolio.items
  .map(
    (item, i) =>
      `${i + 1}. [${item.stock.symbol}] ${item.stock.name}
   • สัดส่วน: ${item.weightPercent}% (${item.allocatedCapital.toLocaleString()} THB)
   • จำนวนที่ต้องซื้อ: ${item.recommendedShares.toLocaleString()} ${item.stock.assetCategory === 'FOREX' ? 'Lots' : 'หุ้น'} @ ~${item.entryPrice}
   • เป้าหมายทำกำไร (Target): ${item.targetPrice} (+${item.expectedReturnPercent}%)
   • จุดตัดขาดทุน (Stop Loss): ${item.stopLossPrice} (-${item.riskPercent}%)
   • หน้าที่ในพอร์ต: ${item.roleInPortfolio}
   • การเฝ้าติดตาม: ${item.periodMonitoringPlan}`
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(textSummary.trim());
    setCopiedSummary(true);
    showToast('📋 คัดลอกแผนพอร์ตทั้งหมดลง Clipboard เรียบร้อย');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Color palette for asset allocation visual bar
  const segmentColors = [
    'bg-indigo-600',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-violet-500',
  ];

  // Filtered available stocks for Adding or Swapping (excluding symbols already in portfolio)
  const currentSymbolsInPort = new Set(portfolio.items.map((i) => i.stock.symbol.toUpperCase()));
  const availableStocksToAdd = allStocks.filter(
    (s) => !currentSymbolsInPort.has(s.symbol.toUpperCase()) &&
           (addStockSearch ? s.symbol.toUpperCase().includes(addStockSearch.toUpperCase()) || s.name.toLowerCase().includes(addStockSearch.toLowerCase()) : true)
  );

  const availableStocksToSwap = allStocks.filter(
    (s) => (s.symbol.toUpperCase() === editSelectedSymbol.toUpperCase() || !currentSymbolsInPort.has(s.symbol.toUpperCase())) &&
           (editStockSearch ? s.symbol.toUpperCase().includes(editStockSearch.toUpperCase()) || s.name.toLowerCase().includes(editStockSearch.toLowerCase()) : true)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-zinc-300 font-bold text-xs flex items-center space-x-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-blue-900/30 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span>AI Advisor Intelligent Portfolio Engine • ระบบจัดพอร์ตอัจฉริยะ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ศูนย์จัดพอร์ต AI อัจฉริยะ (จัดการ ลบ แก้ไข สลับหุ้นได้อิสระ)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
              AI คัดสรรหุ้น 5-8 ตัวไม่ซ้ำกัน พร้อมเครื่องมือให้คุณ <strong>ลบหุ้นออก</strong>, <strong>แก้ไขราคาเป้าหมาย</strong>, <strong>สลับตัวหุ้น</strong> หรือ <strong>ปรับสัดส่วน (%)</strong> ได้ตามใจชอบ พร้อมกดส่งตรงเข้าพอร์ตของคุณได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onApplyToMyPortfolio && (
              <button
                onClick={handleApplyToMyPortfolio}
                id="apply-ai-to-my-portfolio-btn"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-amber-300" />
                <span>📥 ส่งเข้าพอร์ตของฉัน (My Portfolio)</span>
              </button>
            )}

            <button
              onClick={handleBatchWatchlist}
              id="batch-watchlist-btn"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              {addedWatchlist ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>บันทึก {portfolio.items.length} ตัวเข้า Watchlist แล้ว</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span>บันทึกเข้า Watchlist ({portfolio.items.length})</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyPlan}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center space-x-1.5 border border-zinc-700 transition-all cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกแผน</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Investor Preference Tuner */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              ปรับแต่งเกณฑ์การลงทุน (Investor Criteria & Tuning)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            ปรับเปลี่ยนตัวเลขแล้วกดปุ่มจัดพอร์ตใหม่ได้ทันที
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Capital */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 block">
              💵 เงินลงทุน (Capital):
            </label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                step="10000"
                min="10000"
                className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
              <span className="text-xs font-bold text-slate-500">฿</span>
            </div>
            <div className="flex gap-1 pt-1 overflow-x-auto">
              {[50000, 100000, 300000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCapital(amt)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap cursor-pointer ${
                    capital === amt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Profit */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400">
                🎯 เป้าหมายกำไร:
              </label>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                +{targetReturn}%/ปี
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="40"
              step="2"
              value={targetReturn}
              onChange={(e) => setTargetReturn(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500">
              <span>8%</span>
              <span>20%</span>
              <span>40%</span>
            </div>
          </div>

          {/* 3. Risk Profile */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 block">
              ⚖️ ระดับความเสี่ยง:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskProfile(r)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    riskProfile === r
                      ? r === 'CONSERVATIVE'
                        ? 'bg-emerald-600 text-white'
                        : r === 'MODERATE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-rose-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                  }`}
                >
                  {r === 'CONSERVATIVE' ? 'ต่ำ' : r === 'MODERATE' ? 'กลาง' : 'สูง'}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 text-center pt-0.5">
              {riskProfile === 'CONSERVATIVE' ? 'เน้น MOS & ปันผล' : riskProfile === 'MODERATE' ? 'สมดุล Growth & Value' : 'เน้น Alpha & Momentum'}
            </div>
          </div>

          {/* 4. Period / Horizon */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 block">
              ⏳ Period เฝ้าติดตาม:
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as InvestmentPeriod)}
              className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            >
              <option value="1_3_MONTHS">1 - 3 เดือน (สวิงเทรด)</option>
              <option value="3_6_MONTHS">3 - 6 เดือน (รอบงบ)</option>
              <option value="6_12_MONTHS">6 - 12 เดือน (1 ปี Core)</option>
              <option value="1_3_YEARS">1 - 3 ปี (DCA ระยะยาว)</option>
            </select>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
              {period === '1_3_MONTHS' ? 'ตรวจกราฟ & EMA20' : period === '3_6_MONTHS' ? 'ติดตามงบการเงิน' : period === '6_12_MONTHS' ? 'รับปันผล & Rebalance' : 'ทบต้น DCA รายปี'}
            </div>
          </div>

          {/* 5. Market Board & Generate Action */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400 block mb-1">
                🌐 กระดานที่ต้องการ:
              </label>
              <select
                value={preferredBoard}
                onChange={(e) => setPreferredBoard(e.target.value as AssetCategory)}
                className="w-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="ALL">✨ ผสมผสานทุกกระดาน</option>
                <option value="THAI_STOCK">🇹🇭 เฉพาะหุ้นไทย</option>
                <option value="GLOBAL_STOCK">🌐 เฉพาะหุ้นนอก</option>
                <option value="FOREX">💱 เฉพาะ Forex & ทองคำ</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleGeneratePortfolio()}
              disabled={isGeneratingAI}
              id="re-generate-portfolio-btn"
              className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'กำลังคำนวณ...' : 'จัดพอร์ตใหม่ (ไม่ซ้ำ)'}</span>
            </button>
          </div>
        </div>

        {/* Stock Size / Market Cap Scope Bar */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 flex items-center space-x-1 mr-1">
              <span>🏢 ขอบเขตขนาดหุ้นที่สนใจ:</span>
            </span>
            {(
              [
                { id: 'ALL' as const, label: '✨ ทุกขนาด (All Caps)' },
                { id: 'LARGE_CAP' as const, label: '🏢 Large Cap (SET50)' },
                { id: 'MID_CAP' as const, label: '🚀 Mid Cap (SET100)' },
                { id: 'SMALL_CAP' as const, label: '💎 Small Cap' },
                { id: 'MAI' as const, label: '🌱 MAI' },
              ]
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStockSize(s.id);
                  handleGeneratePortfolio({
                    capital,
                    currency: 'THB',
                    targetReturnPercent: targetReturn,
                    riskProfile,
                    period,
                    preferredBoard,
                    stockSizePreference: s.id,
                    objective: investorProfile.objective,
                    pricePreference: {
                      bracket: priceBracket,
                      minPrice: customMinPrice ? parseFloat(customMinPrice) : undefined,
                      maxPrice: customMaxPrice ? parseFloat(customMaxPrice) : undefined,
                    },
                  });
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  stockSize === s.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
            {stockSize === 'LARGE_CAP' ? 'คัดเฉพาะบลูชิพ SET50 สภาพคล่องสูง' :
             stockSize === 'MID_CAP' ? 'คัดเฉพาะหุ้นเติบโต SET100 ศักยภาพสูง' :
             stockSize === 'SMALL_CAP' ? 'คัดเฉพาะหุ้นเล็ก sSET โตเร็ว' :
             stockSize === 'MAI' ? 'คัดเฉพาะหุ้น MAI เก็งกำไร' : 'คัดสรรผสมผสานทุกขนาดอย่างเหมาะสม'}
          </div>
        </div>

        {/* Stock Price Selection Condition Bar */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 flex items-center space-x-1 mr-1">
              <span>🏷️ เงื่อนไขระดับราคาหุ้น:</span>
            </span>
            {(
              [
                { id: 'ALL' as const, label: 'ทุกระดับราคา' },
                { id: 'UNDER_10' as const, label: 'หุ้นราคาต่ำสิบ (<10 ฿)' },
                { id: '10_TO_50' as const, label: 'ราคา 10 - 50 ฿' },
                { id: '50_TO_100' as const, label: 'ราคา 50 - 100 ฿' },
                { id: 'ABOVE_100' as const, label: 'หุ้นราคาเกิน 100 ฿' },
              ]
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPriceBracket(p.id);
                  setCustomMinPrice('');
                  setCustomMaxPrice('');
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  priceBracket === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700'
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
                value={customMinPrice}
                onChange={(e) => {
                  setCustomMinPrice(e.target.value);
                  setPriceBracket('CUSTOM');
                }}
                className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Max ฿"
                value={customMaxPrice}
                onChange={(e) => {
                  setCustomMaxPrice(e.target.value);
                  setPriceBracket('CUSTOM');
                }}
                className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {(customMinPrice || customMaxPrice) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomMinPrice('');
                    setCustomMaxPrice('');
                    setPriceBracket('ALL');
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
                >
                  ล้างราคา
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Overview KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Capital */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            เงินลงทุนรวม
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {portfolio.totalCapital.toLocaleString()} <span className="text-xs font-semibold text-slate-500">THB</span>
          </div>
          <span className="text-[10px] text-indigo-500 font-bold block mt-0.5">จัดสรรครบ 100%</span>
        </div>

        {/* KPI 2: Asset Count */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            จำนวนหุ้นในพอร์ต
          </span>
          <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 flex items-center space-x-1">
            <span>{portfolio.items.length}</span>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">สินทรัพย์</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">ไร้หุ้นซ้ำซ้อน 100%</span>
        </div>

        {/* KPI 3: Weighted Expected Return */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            คาดการณ์กำไรเฉลี่ย
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            +{portfolio.weightedExpectedReturn}% <span className="text-xs font-semibold text-slate-500">/ปี</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-0.5">ถ่วงน้ำหนักตามสัดส่วน</span>
        </div>

        {/* KPI 4: Estimated Dividend */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            เงินปันผลต่อปี (Est.)
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ~{portfolio.estimatedAnnualDividend.toLocaleString()} <span className="text-xs font-semibold text-slate-500">THB</span>
          </div>
          <span className="text-[10px] text-amber-500 font-bold block mt-0.5">Passive Cashflow</span>
        </div>

        {/* KPI 5: Max Drawdown Risk */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            ความเสี่ยงสูงสุด (Risk)
          </span>
          <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            -{portfolio.estimatedMaxDrawdown}%
          </div>
          <span className="text-[10px] text-rose-400 font-bold block mt-0.5">จุดจำกัดการขาดทุน</span>
        </div>

        {/* KPI 6: Average MOS */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Margin of Safety เฉลี่ย
          </span>
          <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            +{portfolio.averageMarginOfSafety}%
          </div>
          <span className="text-[10px] text-blue-500 font-bold block mt-0.5">ส่วนลดจากมูลค่าแท้จริง</span>
        </div>
      </div>

      {/* Visual Asset Allocation Bar with Quick Management Actions */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase text-slate-800 dark:text-zinc-200 tracking-wider">
              สัดส่วนการจัดสรรเงินลงทุน (Asset Allocation Breakdown)
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEqualWeightAll}
              className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
              title="ปรับสัดส่วนทุกหุ้นให้เท่ากัน"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>ปรับน้ำหนักเท่ากัน (Equal Weight)</span>
            </button>

            <button
              onClick={() => {
                setAddStockSearch('');
                setIsAddModalOpen(true);
              }}
              className="text-xs px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1 cursor-pointer transition-colors border border-indigo-200 dark:border-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มหุ้นเข้าพอร์ต</span>
            </button>
          </div>
        </div>

        {/* Segmented Multi-color Bar */}
        <div className="w-full h-5 rounded-xl bg-slate-100 dark:bg-zinc-800 flex overflow-hidden p-0.5 gap-0.5">
          {portfolio.items.map((item, idx) => (
            <div
              key={item.stock.symbol}
              className={`${segmentColors[idx % segmentColors.length]} h-full rounded-md transition-all duration-300 relative group cursor-pointer`}
              style={{ width: `${item.weightPercent}%` }}
              title={`${item.stock.symbol}: ${item.weightPercent}% (${item.allocatedCapital.toLocaleString()} THB)`}
            ></div>
          ))}
        </div>

        {/* Legend Chips with Edit & Delete Triggers */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {portfolio.items.map((item, idx) => (
            <div
              key={item.stock.symbol}
              className="flex items-center space-x-1.5 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 px-2.5 py-1 rounded-xl group hover:border-indigo-500 transition-colors"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${segmentColors[idx % segmentColors.length]}`}></div>
              <button
                onClick={() => onSelectStockForDeepAnalysis(item.stock)}
                className="font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 text-left"
              >
                {item.stock.symbol}
              </button>
              <span className="text-slate-400 dark:text-zinc-500 font-semibold">{item.weightPercent}%</span>
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">({item.allocatedCapital.toLocaleString()}฿)</span>
              
              {/* Quick Action Icons */}
              <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-zinc-800">
                <button
                  onClick={() => handleOpenEditModal(item, idx)}
                  className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="แก้ไข / เปลี่ยนตัวหุ้น / ปรับสัดส่วน"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRemoveStock(item.stock.symbol)}
                  className="p-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="ลบหุ้นตัวนี้ออกจากพอร์ต"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stocks Breakdown List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              รายการหุ้น {portfolio.items.length} ตัวในพอร์ต (สามารถลบ/แก้ไข/ปรับเปลี่ยนได้อิสระ)
            </h3>
          </div>

          {/* Controls: Add Stock & Tab Switcher */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setAddStockSearch('');
                setIsAddModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center space-x-1 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มหุ้นเข้าพอร์ต</span>
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'cards' ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                การ์ดวิเคราะห์ & แก้ไข
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'table' ? 'bg-white dark:bg-[#121215] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                ตารางเคาะซื้อ (Order Table)
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: DETAILED ACTION CARDS WITH EDIT & DELETE BUTTONS */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolio.items.map((item, index) => (
              <div
                key={item.stock.symbol}
                className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Card Header: Symbol, Weight, and Management Buttons */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm border border-indigo-200 dark:border-indigo-500/20">
                        {item.stock.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {item.stock.symbol}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold">
                            {item.stock.market} • {item.stock.currency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
                          {item.stock.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-1">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">
                          {item.weightPercent}% พอร์ต
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          {item.allocatedCapital.toLocaleString()} {item.stock.currency}
                        </span>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(item, index)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                        title="แก้ไขข้อมูล / ปรับสัดส่วน / สลับตัวหุ้น"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveStock(item.stock.symbol)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="ลบหุ้นตัวนี้ออกจากพอร์ต"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Role Badge & Thesis */}
                  <div className="my-3 flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                      item.roleInPortfolio === 'Core Anchor'
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : item.roleInPortfolio === 'Growth Engine'
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                        : item.roleInPortfolio === 'Dividend Generator'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : item.roleInPortfolio === 'Hedge / Moat'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                    }`}>
                      หน้าที่: {item.roleInPortfolio}
                    </span>

                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      R:R {item.riskRewardRatio}:1
                    </span>
                  </div>

                  {/* Pricing, Quantity & Key Levels Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-zinc-900/70 rounded-2xl border border-slate-200/60 dark:border-zinc-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">จำนวนที่ต้องซื้อ</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {item.recommendedShares.toLocaleString()} {item.stock.assetCategory === 'FOREX' ? 'Lots' : 'หุ้น'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">โซนเข้าซื้อ</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                        {item.recommendedBuyZone}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">เป้าทำกำไร (Target)</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5">
                        <span>{item.targetPrice}</span>
                        <span className="text-[10px]">({item.expectedReturnPercent}%)</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">จุดตัดขาดทุน (SL)</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 flex items-center space-x-0.5">
                        <span>{item.stopLossPrice}</span>
                        <span className="text-[10px]">(-{item.riskPercent}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Period Monitoring Plan */}
                  <div className="mt-3 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200/60 dark:border-indigo-500/20 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>คำแนะนำเฝ้าติดตามตาม Period:</span>
                    </div>
                    <p className="text-slate-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                      {item.periodMonitoringPlan}
                    </p>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                    MOS: <span className="font-bold text-emerald-500">+{item.stock.marginOfSafety}%</span> • ปันผล: <span className="font-bold text-amber-500">{item.stock.dividendYield}%</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(item, index)}
                      className="text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      onClick={() => onSelectStockForDeepAnalysis(item.stock)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>วิเคราะห์รายตัว</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: ORDER & EXECUTION TABLE WITH EDIT & DELETE CONTROLS */}
        {activeTab === 'table' && (
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300">
                <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-extrabold uppercase text-slate-400 dark:text-zinc-500">
                  <tr>
                    <th className="py-3.5 px-4"># สินทรัพย์</th>
                    <th className="py-3.5 px-4">หน้าที่ในพอร์ต</th>
                    <th className="py-3.5 px-4 text-right">สัดส่วน (%)</th>
                    <th className="py-3.5 px-4 text-right">เงินจัดสรร (THB)</th>
                    <th className="py-3.5 px-4 text-right">จำนวนที่ต้องซื้อ</th>
                    <th className="py-3.5 px-4 text-right">ราคาซื้อแนะนำ</th>
                    <th className="py-3.5 px-4 text-right">เป้าหมาย (TP)</th>
                    <th className="py-3.5 px-4 text-right">ตัดขาดทุน (SL)</th>
                    <th className="py-3.5 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {portfolio.items.map((item, idx) => (
                    <tr key={item.stock.symbol} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-mono">{idx + 1}.</span>
                          <div>
                            <span className="text-slate-900 dark:text-white font-extrabold">{item.stock.symbol}</span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[120px]">{item.stock.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                          {item.roleInPortfolio}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {item.weightPercent}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {item.allocatedCapital.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.recommendedShares.toLocaleString()} {item.stock.assetCategory === 'FOREX' ? 'Lots' : 'หุ้น'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {item.recommendedBuyZone}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {item.targetPrice} (+{item.expectedReturnPercent}%)
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {item.stopLossPrice} (-{item.riskPercent}%)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(item, idx)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 cursor-pointer"
                            title="แก้ไขข้อมูล / ปรับสัดส่วน"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveStock(item.stock.symbol)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 cursor-pointer"
                            title="ลบหุ้นออกจากพอร์ต"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectStockForDeepAnalysis(item.stock)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 cursor-pointer"
                          >
                            วิเคราะห์
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* AI Executive Commentary & CIO Strategy Box */}
      <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-6 shadow-lg text-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                บทวิเคราะห์เชิงกลยุทธ์จาก AI Advisor (CIO Strategic Assessment)
              </h3>
              <p className="text-[11px] text-zinc-400">
                วิเคราะห์การจัดสรรสินทรัพย์ {portfolio.items.length} ตัวให้สอดคล้องกับ Period และเป้าหมายกำไร {portfolio.investorProfile.targetReturnPercent}%
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAIChat}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>สนทนาเชิงลึกกับ AI</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-normal">
          {portfolio.aiExecutiveSummary}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-800/80">
          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">มาตรการปกป้องเงินต้น (Capital Protection):</span>
              <span className="text-zinc-400 text-[11px]">{portfolio.macroRiskAssessment}</span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">ตารางการ Rebalance พอร์ต:</span>
              <span className="text-zinc-400 text-[11px]">{portfolio.rebalancingSchedule}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT / SWAP STOCK IN PORTFOLIO */}
      {editingItemIndex !== null && portfolio.items[editingItemIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  แก้ไขข้อมูล & สลับตัวหุ้น ({portfolio.items[editingItemIndex].stock.symbol})
                </h3>
              </div>
              <button
                onClick={() => setEditingItemIndex(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4 py-4 text-xs">
              {/* Stock Selector / Search */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-zinc-300 block">
                  1. เลือกหุ้นที่ต้องการ (สลับเป็นตัวอื่นได้):
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหาชื่อหุ้น เช่น PTT, ADVANC, NVDA..."
                    value={editStockSearch}
                    onChange={(e) => setEditStockSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800">
                  {availableStocksToSwap.slice(0, 16).map((s) => (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => {
                        setEditSelectedSymbol(s.symbol);
                        setEditEntryPrice(s.currentPrice);
                        setEditTargetPrice(s.targetPrice1 || Number((s.currentPrice * 1.15).toFixed(2)));
                        setEditStopLossPrice(s.stopLossPrice || Number((s.currentPrice * 0.93).toFixed(2)));
                      }}
                      className={`p-2 rounded-lg text-left transition-all border cursor-pointer ${
                        editSelectedSymbol.toUpperCase() === s.symbol.toUpperCase()
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate text-xs">{s.symbol}</div>
                      <div className="text-[10px] text-slate-400">{s.currentPrice} ฿</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight % */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <label className="font-extrabold text-slate-700 dark:text-zinc-300">
                    2. สัดส่วนเงินลงทุน (Weight %):
                  </label>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    {editWeight}% ({Math.round((capital * editWeight) / 100).toLocaleString()} ฿)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={editWeight}
                  onChange={(e) => setEditWeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Pricing & Targets */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400 block text-[11px]">
                    ราคาซื้อ (Entry):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={editEntryPrice}
                    onChange={(e) => setEditEntryPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400 block text-[11px]">
                    เป้ากำไร (TP):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={editTargetPrice}
                    onChange={(e) => setEditTargetPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-zinc-400 block text-[11px]">
                    ตัดขาดทุน (SL):
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={editStopLossPrice}
                    onChange={(e) => setEditStopLossPrice(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 font-bold"
                  />
                </div>
              </div>

              {/* Role in Portfolio */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-zinc-400 block text-[11px]">
                  หน้าที่ในพอร์ต (Role):
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Core Anchor">⚓ Core Anchor (หุ้นหลักพื้นฐานแน่น)</option>
                  <option value="Growth Engine">🚀 Growth Engine (หุ้นเติบโตสูง)</option>
                  <option value="Dividend Generator">💰 Dividend Generator (หุ้นปันผลสูง)</option>
                  <option value="Momentum Catalyst">⚡ Momentum Catalyst (หุ้นเกาะกระแสโมเมนตัม)</option>
                  <option value="Hedge / Moat">🛡️ Hedge / Moat (สินทรัพย์ป้องกันความเสี่ยง)</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleRemoveStock(portfolio.items[editingItemIndex].stock.symbol)}
                className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบออกจากพอร์ต</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItemIndex(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedItem}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW STOCK TO PORTFOLIO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  เลือกหุ้นใหม่เพิ่มเข้าสู่พอร์ต (ไร้ตัวซ้ำ)
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="py-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาชื่อหุ้น เช่น PTT, ADVANC, DELTA, MTC, KBANK..."
                  value={addStockSearch}
                  onChange={(e) => setAddStockSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                พบ {availableStocksToAdd.length} หุ้นที่ยังไม่มีในพอร์ต:
              </div>

              {/* Stock Selection List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {availableStocksToAdd.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => handleAddStockToPortfolio(stock)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-xs">
                        {stock.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {stock.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold">
                            {stock.market}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
                          {stock.name} • {stock.sector}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <div className="font-black text-sm text-slate-900 dark:text-white">
                          {stock.currentPrice} {stock.currency}
                        </div>
                        <div className="text-[10px] text-emerald-500 font-bold">
                          MOS +{stock.marginOfSafety}% • ปันผล {stock.dividendYield}%
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs group-hover:scale-105 transition-all"
                      >
                        + เลือก
                      </button>
                    </div>
                  </div>
                ))}

                {availableStocksToAdd.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    ไม่พบหุ้นที่ตรงกับคำค้นหา หรือหุ้นทุกตัวอยู่ในพอร์ตแล้ว
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
