import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  PieChart, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  ChevronRight, 
  Zap, 
  Layers, 
  Check, 
  X,
  ExternalLink,
  Sliders,
  DollarSign,
  Clock,
  RefreshCw,
  Copy,
  Calendar,
  Compass,
  AlertCircle,
  HelpCircle,
  Activity,
  Percent,
  Shield,
  Bot,
  Table,
  Save,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  Wallet,
  Wand2,
  Coins,
  Tag
} from 'lucide-react';
import { 
  StockData, 
  UserPosition, 
  ClosedTrade, 
  UserStrategyTag, 
  InvestorProfile,
  InvestmentPeriod,
  UserPortfolioAudit,
  PeriodCompletionKPIs,
  PriceBracketType
} from '../types';
import { 
  calculateUserPortfolioSummary, 
  calculateUserSkillMetrics,
  calculatePeriodCompletionKPIs,
  generateAlgorithmicUserAudit
} from '../utils/skillCalculations';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { getVerifiedHistoricalCandles } from '../data/historicalCandlesData';

export interface MatrixTableRow {
  id: string;
  symbol: string;
  name: string;
  market: 'SET' | 'mai' | 'US' | 'Global' | 'FOREX';
  sector: string;
  currency: string;
  lastClosePrice: number; // Col 2: ราคาปิดเมื่อวาน
  entryPrice: number; // Indicator 1: ราคาเข้าซื้อ
  fairValue: number; // Indicator 2: ราคาเหมาะสม
  marginOfSafety: number; // Indicator 3: MOS (%)
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAY'; // Indicator 4: แนวโน้มกราฟ
  rsi: number; // Indicator 5: RSI
  stopLossPrice: number; // Indicator 6: SL จุดตัดขาดทุน
  targetPrice: number; // Indicator 7: TP ราคาเป้าหมายกำไร
  riskRewardRatio: number; // Indicator 8: R:R
  shares: number; // Col ถัดจาก Indicators: จำนวนเก็บลงพอร์ต
  strategyTag: UserStrategyTag;
  stockData?: StockData;
}

interface MyPortfolioTrackerProps {
  allStocks: StockData[];
  positions: UserPosition[];
  closedTrades: ClosedTrade[];
  investorProfile: InvestorProfile;
  onUpdateInvestorProfile?: (updated: Partial<InvestorProfile>) => void;
  onAddPosition: (position: Omit<UserPosition, 'id'>) => void;
  onSetAllPositions?: (positions: UserPosition[]) => void;
  onBulkAddPositions?: (positions: Omit<UserPosition, 'id'>[]) => void;
  onUpdatePosition: (id: string, updated: Partial<UserPosition>) => void;
  onDeletePosition: (id: string) => void;
  onClosePosition: (
    positionId: string, 
    exitPrice: number, 
    exitReason: 'TARGET_HIT' | 'STOP_LOSS' | 'MANUAL_EXIT' | 'TRAILING_STOP',
    journalNotes: string
  ) => void;
  onSelectStockForDeepAnalysis: (stock: StockData) => void;
  onSwitchToAIPortfolioBuilder: () => void;
  onOpenObjectiveModal: () => void;
  onOpenAIChatWithContext?: (customPrompt?: string) => void;
}

function generateCustomStockData(
  symbol: string,
  name: string,
  market: 'SET' | 'mai' | 'US' | 'Global' | 'FOREX',
  sector: string,
  currency: string,
  currentPrice: number,
  targetPrice: number,
  stopLossPrice: number,
  mosInput?: number,
  peInput?: number,
  trendInput?: 'UPTREND' | 'DOWNTREND' | 'SIDEWAY'
): StockData {
  const cleanSymbol = symbol.toUpperCase().trim() || 'CUSTOM';
  const cleanName = name.trim() || `${cleanSymbol}`;
  const mos = mosInput !== undefined && !isNaN(mosInput) 
    ? Number(mosInput) 
    : targetPrice > currentPrice 
      ? Number((((targetPrice - currentPrice) / currentPrice) * 100).toFixed(1))
      : 15.0;

  // Use verified historical series if available, otherwise single authentic baseline entry (Zero Math.sin synthesis)
  const existingCandles = getVerifiedHistoricalCandles(cleanSymbol);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const candles = existingCandles.length > 0 ? existingCandles : [
    {
      date: todayStr,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume: 1000000,
    }
  ];

  const assetCat = 
    market === 'US' || market === 'Global' 
      ? 'GLOBAL_STOCK' 
      : market === 'FOREX' 
        ? 'FOREX' 
        : 'THAI_STOCK';

  return {
    symbol: cleanSymbol,
    name: cleanName,
    market,
    assetCategory: assetCat as any,
    sector: sector || 'General / User Defined',
    currency: currency || 'THB',
    currentPrice,
    change: Number((currentPrice * 0.008).toFixed(2)),
    changePercent: 0.8,
    high52w: Number((currentPrice * 1.25).toFixed(2)),
    low52w: Number((currentPrice * 0.75).toFixed(2)),
    volume: 3500000,
    avgVolume30d: 4200000,
    pe: peInput || 16.5,
    industryPe: 18.0,
    pbv: 1.8,
    roe: 14.5,
    dividendYield: 3.8,
    de: 0.85,
    netMargin: 12.5,
    revenueGrowth: 8.5,
    eps: Number((currentPrice / (peInput || 16.5)).toFixed(2)),
    fairValue: targetPrice || Number((currentPrice * 1.18).toFixed(2)),
    marginOfSafety: mos,
    valuationStatus: mos > 15 ? 'UNDERVALUED' : mos < -5 ? 'OVERVALUED' : 'FAIR',
    fundamentalScore: mos > 15 ? 82 : 72,
    trend: trendInput || (currentPrice >= stopLossPrice ? 'UPTREND' : 'SIDEWAY'),
    technicalScore: 75,
    rsi: 52,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: Number((currentPrice * 0.99).toFixed(2)),
    ema50: Number((currentPrice * 0.96).toFixed(2)),
    ema200: Number((currentPrice * 0.92).toFixed(2)),
    support1: stopLossPrice || Number((currentPrice * 0.95).toFixed(2)),
    support2: Number((currentPrice * 0.90).toFixed(2)),
    resistance1: targetPrice || Number((currentPrice * 1.10).toFixed(2)),
    resistance2: Number((currentPrice * 1.18).toFixed(2)),
    stopLossPrice: stopLossPrice || Number((currentPrice * 0.93).toFixed(2)),
    targetPrice1: targetPrice || Number((currentPrice * 1.15).toFixed(2)),
    targetPrice2: Number((currentPrice * 1.25).toFixed(2)),
    technicalSignal: 'BUY_ON_DIP',
    compositeRating: 'BUY',
    businessDescription: `สินทรัพย์ ${cleanSymbol} (${cleanName}) ในหมวด ${sector || 'ทั่วไป'}`,
    strengths: [
      `โครงสร้างและเป้าหมายราคาถูกกำหนดโดยผู้ใช้ที่ ${targetPrice} ${currency}`,
      `มี Margin of Safety รองรับความปลอดภัย ${mos}%`,
    ],
    risks: [
      `ควรติดตามวินัยการลงทุนและจุดตัดขาดทุน Stop Loss อย่างต่อเนื่อง`,
    ],
    actionPlanSummary: `เป้าหมายผลกำไร ${targetPrice} และเฝ้าระวังจุด Stop Loss ที่ ${stopLossPrice}`,
    candles,
  };
}

const STRATEGY_OPTIONS: { id: UserStrategyTag; label: string; color: string }[] = [
  { id: 'GROWTH_MOMENTUM', label: '🚀 Growth & Momentum', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' },
  { id: 'VALUE_INVESTING', label: '💎 Value Investing (VI)', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' },
  { id: 'DIVIDEND_INCOME', label: '💰 หุ้นปันผลสูง (Dividend)', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' },
  { id: 'SWING_TRADE', label: '📈 Swing Trading', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' },
  { id: 'BREAKOUT_PLAY', label: '⚡ Breakout Pattern', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' },
  { id: 'DIP_BUY', label: '🎯 Buy on Dip / Rebound', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10' },
];

export const MyPortfolioTracker: React.FC<MyPortfolioTrackerProps> = ({
  allStocks,
  positions,
  closedTrades,
  investorProfile,
  onUpdateInvestorProfile,
  onAddPosition,
  onSetAllPositions,
  onBulkAddPositions,
  onUpdatePosition,
  onDeletePosition,
  onClosePosition,
  onSelectStockForDeepAnalysis,
  onSwitchToAIPortfolioBuilder,
  onOpenObjectiveModal,
  onOpenAIChatWithContext,
}) => {
  const [activeTab, setActiveTab] = useState<'table-builder' | 'holdings' | 'ai-audit' | 'period-kpis' | 'journal' | 'skills'>('table-builder');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClosePosition, setSelectedClosePosition] = useState<UserPosition | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<number>(0);
  const [exitReasonInput, setExitReasonInput] = useState<'TARGET_HIT' | 'STOP_LOSS' | 'MANUAL_EXIT'>('TARGET_HIT');
  const [exitNotesInput, setExitNotesInput] = useState<string>('');

  // Start Date for Period Calculation & Backtesting (stored in localStorage or default to 2025-01-01)
  const [periodStartDate, setPeriodStartDate] = useState<string>(() => {
    return localStorage.getItem('sby_user_period_start') || '2025-01-01';
  });
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState<boolean>(false);

  const handleUpdatePeriodDuration = (newPeriod: InvestmentPeriod) => {
    onUpdateInvestorProfile({
      ...investorProfile,
      period: newPeriod,
    });
  };

  const handleSetBacktestStartDate = (daysAgo: number) => {
    const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const formatted = targetDate.toISOString().split('T')[0];
    setPeriodStartDate(formatted);
    localStorage.setItem('sby_user_period_start', formatted);
  };

  const handleCustomStartDateChange = (dateStr: string) => {
    setPeriodStartDate(dateStr);
    localStorage.setItem('sby_user_period_start', dateStr);
  };

  // Capital Budget & Controller States
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [capitalInputVal, setCapitalInputVal] = useState<number>(investorProfile.capital || 50000);
  const [isOverBudgetModalOpen, setIsOverBudgetModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (investorProfile.capital) {
      setCapitalInputVal(investorProfile.capital);
    }
  }, [investorProfile.capital]);

  // Table Matrix Builder States
  const generateDefaultMatrixRow = (symbol: string, indexOffset: number = 0): MatrixTableRow => {
    const cleanSymbol = symbol.toUpperCase().trim() || 'CPALL';
    const matched = allStocks.find((s) => s.symbol.toUpperCase() === cleanSymbol);
    const price = matched?.currentPrice || 50.0;
    const fair = matched?.fairValue || Number((price * 1.18).toFixed(2));
    const mos = matched?.marginOfSafety !== undefined ? matched.marginOfSafety : 15;
    const tp = matched?.targetPrice1 || Number((price * 1.15).toFixed(2));
    const sl = matched?.stopLossPrice || Number((price * 0.93).toFixed(2));
    const rr = Number(((tp - price) / Math.max(0.01, price - sl)).toFixed(2));
    const defaultCapitalShare = (investorProfile.capital || 500000) * 0.2;
    const defaultShares = Math.max(100, Math.floor(defaultCapitalShare / price / 100) * 100 || Math.floor(defaultCapitalShare / price));

    return {
      id: `matrix-row-${Date.now()}-${indexOffset}-${Math.random().toString(36).substr(2, 4)}`,
      symbol: matched?.symbol || cleanSymbol,
      name: matched?.name || cleanSymbol,
      market: matched?.market || 'SET',
      sector: matched?.sector || 'Commerce / General',
      currency: matched?.currency || 'THB',
      lastClosePrice: price,
      entryPrice: price,
      fairValue: fair,
      marginOfSafety: mos,
      trend: matched?.trend || 'UPTREND',
      rsi: matched?.rsi || 52,
      stopLossPrice: sl,
      targetPrice: tp,
      riskRewardRatio: rr,
      shares: defaultShares,
      strategyTag: 'GROWTH_MOMENTUM',
      stockData: matched,
    };
  };

  const [matrixRows, setMatrixRows] = useState<MatrixTableRow[]>(() => {
    if (positions && positions.length > 0) {
      return positions.map((p, idx) => ({
        id: `row-${p.id || idx}-${Date.now()}`,
        symbol: p.symbol,
        name: p.stockData?.name || p.symbol,
        market: p.stockData?.market || 'SET',
        sector: p.stockData?.sector || 'General',
        currency: p.stockData?.currency || 'THB',
        lastClosePrice: p.stockData?.currentPrice || p.entryPrice,
        entryPrice: p.entryPrice,
        fairValue: p.stockData?.fairValue || Number((p.entryPrice * 1.18).toFixed(2)),
        marginOfSafety: p.stockData?.marginOfSafety ?? 15,
        trend: p.stockData?.trend || 'UPTREND',
        rsi: p.stockData?.rsi || 52,
        stopLossPrice: p.stopLossPrice,
        targetPrice: p.targetPrice,
        riskRewardRatio: Number(((p.targetPrice - p.entryPrice) / Math.max(0.01, p.entryPrice - p.stopLossPrice)).toFixed(2)),
        shares: p.shares,
        strategyTag: p.strategyTag,
        stockData: p.stockData,
      }));
    }

    const defaultStarterSymbols = ['CPALL', 'PTT', 'DELTA', 'BDMS'];
    return defaultStarterSymbols.map((sym, idx) => {
      const matched = allStocks.find((s) => s.symbol === sym) || allStocks[idx] || allStocks[0];
      const price = matched?.currentPrice || 50.0;
      const fair = matched?.fairValue || Number((price * 1.2).toFixed(2));
      const mos = matched?.marginOfSafety ?? 18;
      const tp = matched?.targetPrice1 || Number((price * 1.15).toFixed(2));
      const sl = matched?.stopLossPrice || Number((price * 0.93).toFixed(2));
      const defaultShares = Math.max(100, Math.floor(((investorProfile.capital || 500000) * 0.22) / price / 100) * 100);

      return {
        id: `matrix-row-${idx}-${Date.now()}`,
        symbol: matched?.symbol || sym,
        name: matched?.name || sym,
        market: matched?.market || 'SET',
        sector: matched?.sector || 'General',
        currency: matched?.currency || 'THB',
        lastClosePrice: price,
        entryPrice: price,
        fairValue: fair,
        marginOfSafety: mos,
        trend: matched?.trend || 'UPTREND',
        rsi: matched?.rsi || 54,
        stopLossPrice: sl,
        targetPrice: tp,
        riskRewardRatio: Number(((tp - price) / Math.max(0.01, price - sl)).toFixed(2)),
        shares: defaultShares,
        strategyTag: 'GROWTH_MOMENTUM' as UserStrategyTag,
        stockData: matched,
      };
    });
  });

  const [activeMatrixDropdownRowId, setActiveMatrixDropdownRowId] = useState<string | null>(null);
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>('');
  const [matrixSuccessToast, setMatrixSuccessToast] = useState<string | null>(null);

  // Price Selection Condition for Matrix Builder
  const [matrixPriceBracket, setMatrixPriceBracket] = useState<PriceBracketType>('ALL');
  const [matrixMinPriceInput, setMatrixMinPriceInput] = useState<string>('');
  const [matrixMaxPriceInput, setMatrixMaxPriceInput] = useState<string>('');
  const [isPriceStockPickerOpen, setIsPriceStockPickerOpen] = useState<boolean>(false);

  const handleMatrixPriceBracketChange = (bracket: PriceBracketType) => {
    setMatrixPriceBracket(bracket);
    if (bracket === 'UNDER_10') {
      setMatrixMinPriceInput('0');
      setMatrixMaxPriceInput('10');
    } else if (bracket === '10_TO_50') {
      setMatrixMinPriceInput('10');
      setMatrixMaxPriceInput('50');
    } else if (bracket === '50_TO_100') {
      setMatrixMinPriceInput('50');
      setMatrixMaxPriceInput('100');
    } else if (bracket === 'ABOVE_100') {
      setMatrixMinPriceInput('100');
      setMatrixMaxPriceInput('');
    } else if (bracket === 'ALL') {
      setMatrixMinPriceInput('');
      setMatrixMaxPriceInput('');
    }
  };

  const filteredStocksByPriceCondition = allStocks.filter((s) => {
    if (s.assetCategory === 'FOREX') return false;
    const minP = matrixMinPriceInput ? parseFloat(matrixMinPriceInput) : 0;
    const maxP = matrixMaxPriceInput ? parseFloat(matrixMaxPriceInput) : Infinity;
    if (minP > 0 && s.currentPrice < minP) return false;
    if (maxP < Infinity && s.currentPrice > maxP) return false;
    return true;
  });

  const handleAddStockFromPricePicker = (stock: StockData) => {
    const newRow = generateDefaultMatrixRow(stock.symbol);
    newRow.stockData = stock;
    newRow.lastClosePrice = stock.currentPrice;
    newRow.entryPrice = stock.currentPrice;
    newRow.fairValue = stock.fairValue;
    newRow.marginOfSafety = stock.marginOfSafety;
    newRow.trend = stock.trend;
    newRow.rsi = stock.rsi;
    newRow.stopLossPrice = stock.stopLossPrice;
    newRow.targetPrice = stock.targetPrice1;
    newRow.riskRewardRatio = Number(((stock.targetPrice1 - stock.currentPrice) / Math.max(0.01, stock.currentPrice - stock.stopLossPrice)).toFixed(2));
    
    setMatrixRows((prev) => [...prev, newRow]);
    setMatrixSuccessToast(`เพิ่มหุ้น ${stock.symbol} (ราคา ${stock.currentPrice} ฿) ลงในตารางพอร์ตแล้ว`);
    setTimeout(() => setMatrixSuccessToast(null), 3000);
  };

  // Live Capital & Valuation Calculations for the Matrix Table
  const matrixTotalCost = matrixRows.reduce((sum, r) => sum + (r.entryPrice * r.shares), 0);
  const matrixCashRemaining = Math.max(0, investorProfile.capital - matrixTotalCost);
  const matrixDeployedPercent = investorProfile.capital > 0 ? Number(((matrixTotalCost / investorProfile.capital) * 100).toFixed(1)) : 0;
  const matrixCashPercent = Number(Math.max(0, 100 - matrixDeployedPercent).toFixed(1));
  const matrixTotalGain = matrixRows.reduce((sum, r) => sum + Math.max(0, (r.targetPrice - r.entryPrice) * r.shares), 0);
  const matrixGainPercent = investorProfile.capital > 0 ? Number(((matrixTotalGain / investorProfile.capital) * 100).toFixed(1)) : 0;
  const matrixTotalRisk = matrixRows.reduce((sum, r) => sum + Math.max(0, (r.entryPrice - r.stopLossPrice) * r.shares), 0);
  const matrixRiskPercent = investorProfile.capital > 0 ? Number(((matrixTotalRisk / investorProfile.capital) * 100).toFixed(1)) : 0;
  const matrixAverageMOS = matrixRows.length > 0
    ? Number((matrixRows.reduce((sum, r) => sum + r.marginOfSafety, 0) / matrixRows.length).toFixed(1))
    : 0;
  const matrixAverageRR = matrixTotalRisk > 0 ? Number((matrixTotalGain / matrixTotalRisk).toFixed(2)) : 2.5;

  // Add Position Form State & Modes (Modal fallback)
  const [addMode, setAddMode] = useState<'CUSTOM' | 'PRESET'>('CUSTOM');
  const [stockSearchFilter, setStockSearchFilter] = useState<string>('');
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('ALL');
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState<boolean>(false);

  // Custom Stock Inputs
  const [customSymbol, setCustomSymbol] = useState<string>('CPALL');
  const [customName, setCustomName] = useState<string>('บมจ.ซีพี ออลล์');
  const [customMarket, setCustomMarket] = useState<'SET' | 'mai' | 'US' | 'Global' | 'FOREX'>('SET');
  const [customSector, setCustomSector] = useState<string>('Commerce & Retail');
  const [customCurrency, setCustomCurrency] = useState<'THB' | 'USD'>('THB');
  const [customMOS, setCustomMOS] = useState<number>(18.5);

  // Core Trading Parameters
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>(allStocks[0]?.symbol || 'CPALL');
  const [entryPrice, setEntryPrice] = useState<number>(allStocks[0]?.currentPrice || 56.50);
  const [shares, setShares] = useState<number>(1000);
  const [targetPrice, setTargetPrice] = useState<number>(allStocks[0]?.targetPrice1 || 68.00);
  const [stopLossPrice, setStopLossPrice] = useState<number>(allStocks[0]?.stopLossPrice || 52.00);
  const [strategyTag, setStrategyTag] = useState<UserStrategyTag>('GROWTH_MOMENTUM');
  const [thesisNotes, setThesisNotes] = useState<string>('วิเคราะห์เห็นแนวโน้มกำไรเติบโต มี Margin of Safety และผ่านเกณฑ์การประเมิน');

  // AI Master Analyst Audit State
  const [isAuditingAI, setIsAuditingAI] = useState<boolean>(false);
  const [copiedAudit, setCopiedAudit] = useState<boolean>(false);
  const [copiedKPIReport, setCopiedKPIReport] = useState<boolean>(false);
  const [userAudit, setUserAudit] = useState<UserPortfolioAudit | null>(() => {
    try {
      const saved = localStorage.getItem('sby_user_portfolio_audit');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const summary = calculateUserPortfolioSummary(positions, closedTrades, investorProfile);
  const skillMetrics = calculateUserSkillMetrics(positions, closedTrades, investorProfile);
  const periodKPIs = calculatePeriodCompletionKPIs(positions, closedTrades, investorProfile, periodStartDate);

  // Capital Deployment calculations
  const deployedCapital = summary.totalCost;
  const cashRemaining = Math.max(0, investorProfile.capital - deployedCapital);
  const deployedPercent = investorProfile.capital > 0 ? Math.min(100, (deployedCapital / investorProfile.capital) * 100) : 0;
  const cashPercent = 100 - deployedPercent;

  // Initialize or fallback default audit if null
  useEffect(() => {
    if (!userAudit && positions.length > 0) {
      const initial = generateAlgorithmicUserAudit(positions, closedTrades, investorProfile, summary, periodKPIs);
      setUserAudit(initial);
    }
  }, [positions, investorProfile, summary, periodKPIs]);

  // Save audit to localStorage
  useEffect(() => {
    if (userAudit) {
      localStorage.setItem('sby_user_portfolio_audit', JSON.stringify(userAudit));
    }
  }, [userAudit]);

  // Save period start date
  useEffect(() => {
    localStorage.setItem('sby_user_period_start', periodStartDate);
  }, [periodStartDate]);

  // Apply complete stock data to form fields seamlessly
  const applyStockToForm = (stock: StockData) => {
    setCustomSymbol(stock.symbol);
    setCustomName(stock.name);
    setCustomMarket(stock.market);
    setCustomSector(stock.sector);
    setCustomCurrency((stock.currency as any) || 'THB');
    setEntryPrice(stock.currentPrice);
    setTargetPrice(stock.targetPrice1 || Number((stock.currentPrice * 1.15).toFixed(2)));
    setStopLossPrice(stock.stopLossPrice || Number((stock.currentPrice * 0.93).toFixed(2)));
    setCustomMOS(stock.marginOfSafety || 15);
    setSelectedStockSymbol(stock.symbol);

    if (stock.fundamentalScore >= 80 && stock.dividendYield >= 4) {
      setStrategyTag('DIVIDEND_INCOME');
    } else if (stock.fundamentalScore >= 78) {
      setStrategyTag('VALUE_INVESTING');
    } else if (stock.trend === 'UPTREND') {
      setStrategyTag('GROWTH_MOMENTUM');
    } else {
      setStrategyTag('SWING_TRADE');
    }

    setThesisNotes(stock.actionPlanSummary || stock.strengths?.[0] || `วิเคราะห์หุ้น ${stock.symbol} ตามปัจจัยพื้นฐานและการประเมินมูลค่า`);
    setIsSymbolDropdownOpen(false);
  };

  // Reactive symbol input handler that immediately adapts other fields
  const handleSymbolInputChange = (val: string) => {
    const upper = val.toUpperCase();
    setCustomSymbol(upper);
    setIsSymbolDropdownOpen(upper.trim().length > 0);

    // Exact match in database -> Auto-sync all fields immediately
    const exactMatch = allStocks.find((s) => s.symbol.toUpperCase() === upper.trim());
    if (exactMatch) {
      applyStockToForm(exactMatch);
    }
  };

  const handleStockSelectInModal = (symbol: string) => {
    const stock = allStocks.find((s) => s.symbol === symbol);
    if (stock) {
      applyStockToForm(stock);
    }
  };

  const handleAutofillFromSystem = (matchedStock: StockData) => {
    applyStockToForm(matchedStock);
  };

  // Quick TP & SL calculation helpers
  const handleSetTargetPercent = (pct: number) => {
    if (entryPrice > 0) {
      const tp = Number((entryPrice * (1 + pct / 100)).toFixed(2));
      setTargetPrice(tp);
      setCustomMOS(pct);
    }
  };

  const handleSetStopLossPercent = (pct: number) => {
    if (entryPrice > 0) {
      const sl = Number((entryPrice * (1 - pct / 100)).toFixed(2));
      setStopLossPrice(sl);
    }
  };

  const handleSyncPriceTargets = () => {
    if (entryPrice > 0) {
      setTargetPrice(Number((entryPrice * 1.15).toFixed(2)));
      setStopLossPrice(Number((entryPrice * 0.93).toFixed(2)));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalStockData: StockData;
    let finalSymbol = '';

    if (addMode === 'CUSTOM') {
      finalSymbol = customSymbol.toUpperCase().trim() || 'CUSTOM';
      const existingInSystem = allStocks.find((s) => s.symbol.toUpperCase() === finalSymbol);

      if (existingInSystem) {
        finalStockData = {
          ...existingInSystem,
          name: customName.trim() || existingInSystem.name,
          currentPrice: Number(entryPrice),
          targetPrice1: Number(targetPrice),
          stopLossPrice: Number(stopLossPrice),
          marginOfSafety: Number(customMOS) || existingInSystem.marginOfSafety,
          market: customMarket,
          sector: customSector || existingInSystem.sector,
          currency: customCurrency,
        };
      } else {
        finalStockData = generateCustomStockData(
          finalSymbol,
          customName,
          customMarket,
          customSector,
          customCurrency,
          Number(entryPrice),
          Number(targetPrice),
          Number(stopLossPrice),
          Number(customMOS)
        );
      }
    } else {
      const found = allStocks.find((s) => s.symbol === selectedStockSymbol) || allStocks[0];
      if (!found) return;
      finalSymbol = found.symbol;
      finalStockData = found;
    }

    onAddPosition({
      symbol: finalSymbol,
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: Number(entryPrice),
      shares: Number(shares),
      totalCost: Number(entryPrice) * Number(shares),
      targetPrice: Number(targetPrice),
      stopLossPrice: Number(stopLossPrice),
      strategyTag,
      thesisNotes,
      stockData: finalStockData,
    });

    setIsAddModalOpen(false);
  };

  // Matrix Table Row Operations
  const applyStockToMatrixRow = (rowId: string, stock: StockData) => {
    const price = stock.currentPrice;
    const tp = stock.targetPrice1 || Number((price * 1.15).toFixed(2));
    const sl = stock.stopLossPrice || Number((price * 0.93).toFixed(2));
    const rr = Number(((tp - price) / Math.max(0.01, price - sl)).toFixed(2));

    let tag: UserStrategyTag = 'GROWTH_MOMENTUM';
    if (stock.fundamentalScore >= 80 && stock.dividendYield >= 4) {
      tag = 'DIVIDEND_INCOME';
    } else if (stock.fundamentalScore >= 78) {
      tag = 'VALUE_INVESTING';
    } else if (stock.trend === 'UPTREND') {
      tag = 'GROWTH_MOMENTUM';
    } else {
      tag = 'SWING_TRADE';
    }

    setMatrixRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const currentShares = r.shares > 0 ? r.shares : Math.max(100, Math.floor(((investorProfile.capital || 500000) * 0.2) / price / 100) * 100);
        return {
          ...r,
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          sector: stock.sector,
          currency: stock.currency || 'THB',
          lastClosePrice: price,
          entryPrice: price,
          fairValue: stock.fairValue || Number((price * 1.18).toFixed(2)),
          marginOfSafety: stock.marginOfSafety !== undefined ? stock.marginOfSafety : 15,
          trend: stock.trend || 'UPTREND',
          rsi: stock.rsi || 52,
          stopLossPrice: sl,
          targetPrice: tp,
          riskRewardRatio: rr,
          shares: currentShares,
          strategyTag: tag,
          stockData: stock,
        };
      })
    );
    setActiveMatrixDropdownRowId(null);
  };

  const handleMatrixSymbolChange = (rowId: string, val: string) => {
    const upper = val.toUpperCase().trimStart();
    setActiveMatrixDropdownRowId(rowId);
    setMatrixSearchQuery(upper);

    setMatrixRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          symbol: upper,
        };
      })
    );

    const exactMatch = allStocks.find((s) => s.symbol.toUpperCase() === upper.trim());
    if (exactMatch) {
      applyStockToMatrixRow(rowId, exactMatch);
    }
  };

  const handleMatrixEntryPriceChange = (rowId: string, price: number) => {
    const val = Math.max(0, price);
    setMatrixRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const sl = r.stopLossPrice || Number((val * 0.93).toFixed(2));
        const tp = r.targetPrice || Number((val * 1.15).toFixed(2));
        const rr = Number(((tp - val) / Math.max(0.01, val - sl)).toFixed(2));
        return {
          ...r,
          entryPrice: val,
          riskRewardRatio: rr,
        };
      })
    );
  };

  const handleMatrixTargetPriceChange = (rowId: string, tp: number) => {
    const val = Math.max(0, tp);
    setMatrixRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const entry = r.entryPrice;
        const sl = r.stopLossPrice;
        const rr = Number(((val - entry) / Math.max(0.01, entry - sl)).toFixed(2));
        const mos = entry > 0 ? Number((((val - entry) / entry) * 100).toFixed(1)) : r.marginOfSafety;
        return {
          ...r,
          targetPrice: val,
          riskRewardRatio: rr,
          marginOfSafety: mos,
        };
      })
    );
  };

  const handleMatrixStopLossChange = (rowId: string, sl: number) => {
    const val = Math.max(0, sl);
    setMatrixRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const entry = r.entryPrice;
        const tp = r.targetPrice;
        const rr = Number(((tp - entry) / Math.max(0.01, entry - val)).toFixed(2));
        return {
          ...r,
          stopLossPrice: val,
          riskRewardRatio: rr,
        };
      })
    );
  };

  const handleMatrixSharesChange = (rowId: string, shares: number) => {
    const val = Math.max(0, shares);
    setMatrixRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, shares: val } : r))
    );
  };

  const handleMatrixSetWeightPercent = (rowId: string, pct: number) => {
    const targetBudget = (investorProfile.capital || 500000) * (pct / 100);
    setMatrixRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const price = r.entryPrice > 0 ? r.entryPrice : r.lastClosePrice || 1;
        const calculatedShares = Math.max(10, Math.floor(targetBudget / price / 100) * 100 || Math.floor(targetBudget / price));
        return {
          ...r,
          shares: calculatedShares,
        };
      })
    );
  };

  const handleMatrixAddRow = () => {
    const availablePool = allStocks.filter(
      (s) => !matrixRows.some((r) => r.symbol.toUpperCase() === s.symbol.toUpperCase())
    );
    const nextStock = availablePool[0] || allStocks[0];
    const newRow = generateDefaultMatrixRow(nextStock?.symbol || 'NEW', matrixRows.length);
    setMatrixRows((prev) => [...prev, newRow]);
  };

  const handleMatrixRemoveRow = (rowId: string) => {
    if (matrixRows.length <= 1) {
      alert('ตารางต้องมีอย่างน้อย 1 แถวครับ');
      return;
    }
    setMatrixRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const isOverBudget = matrixTotalCost > investorProfile.capital;
  const overBudgetAmount = Math.max(0, matrixTotalCost - investorProfile.capital);
  const overBudgetPercent = investorProfile.capital > 0 ? Number(((overBudgetAmount / investorProfile.capital) * 100).toFixed(1)) : 0;

  const handleUpdateCapital = (newCapital: number) => {
    const valid = Math.max(1000, Number(newCapital) || 50000);
    if (onUpdateInvestorProfile) {
      onUpdateInvestorProfile({ capital: valid });
    }
    setCapitalInputVal(valid);
    setIsEditingCapital(false);
    setMatrixSuccessToast(`💰 ปรับงบเงินลงทุนเป็น ${formatNumber(valid)} ${investorProfile.currency} เรียบร้อย`);
    setTimeout(() => setMatrixSuccessToast(null), 3500);
  };

  const handleSetBudget50k = () => {
    const targetBudget = 50000;
    if (onUpdateInvestorProfile) {
      onUpdateInvestorProfile({ capital: targetBudget });
    }
    setCapitalInputVal(targetBudget);
    setIsEditingCapital(false);
    handleAIAutoFitShares(targetBudget);
  };

  const handleFixByIncreasingCapital = () => {
    const requiredCapital = Math.ceil(matrixTotalCost);
    handleUpdateCapital(requiredCapital);
    setIsOverBudgetModalOpen(false);
  };

  // AI Auto-Fit function: Intelligently calculates shares for each row so that total cost <= budget (e.g. 50,000 THB)
  const handleAIAutoFitShares = (targetBudget?: number) => {
    const budget = targetBudget !== undefined ? targetBudget : (investorProfile.capital || 50000);
    if (matrixRows.length === 0 || budget <= 0) return;

    const totalCurrentCost = matrixRows.reduce((sum, r) => sum + (r.entryPrice * r.shares), 0);
    let updatedRows: MatrixTableRow[];

    if (totalCurrentCost === 0) {
      const perStockBudget = (budget * 0.96) / matrixRows.length;
      updatedRows = matrixRows.map((r) => {
        const p = r.entryPrice > 0 ? r.entryPrice : 1;
        let sh = 0;
        if (p > 100) {
          sh = Math.max(1, Math.floor(perStockBudget / p / 10) * 10 || Math.floor(perStockBudget / p));
        } else {
          sh = Math.max(100, Math.floor(perStockBudget / p / 100) * 100 || Math.floor(perStockBudget / p));
        }
        return { ...r, shares: sh };
      });
    } else {
      // Scale down proportionally to 97% of budget to ensure cash safety buffer
      const targetSpend = budget * 0.97;
      const ratio = targetSpend / totalCurrentCost;

      updatedRows = matrixRows.map((r) => {
        const p = r.entryPrice > 0 ? r.entryPrice : 1;
        const rawShares = r.shares * ratio;
        let finalShares = 0;

        if (rawShares >= 100) {
          finalShares = Math.floor(rawShares / 100) * 100;
        } else if (rawShares >= 10) {
          finalShares = Math.floor(rawShares / 10) * 10;
        } else {
          finalShares = Math.max(1, Math.floor(rawShares));
        }
        return { ...r, shares: finalShares };
      });
    }

    // Strict safeguard: ensure total cost <= budget
    let currentSum = updatedRows.reduce((sum, r) => sum + (r.entryPrice * r.shares), 0);
    let attempts = 0;
    while (currentSum > budget && attempts < 25) {
      let maxCostIdx = -1;
      let maxCost = -1;
      updatedRows.forEach((r, idx) => {
        const cost = r.entryPrice * r.shares;
        if (cost > maxCost && r.shares > 1) {
          maxCost = cost;
          maxCostIdx = idx;
        }
      });

      if (maxCostIdx === -1) break;

      const targetRow = updatedRows[maxCostIdx];
      if (targetRow.shares >= 200) {
        targetRow.shares -= 100;
      } else if (targetRow.shares >= 20) {
        targetRow.shares -= 10;
      } else if (targetRow.shares > 1) {
        targetRow.shares -= 1;
      } else {
        break;
      }

      currentSum = updatedRows.reduce((sum, r) => sum + (r.entryPrice * r.shares), 0);
      attempts++;
    }

    setMatrixRows(updatedRows);
    setIsOverBudgetModalOpen(false);
    const newRemaining = Math.max(0, budget - currentSum);
    setMatrixSuccessToast(`🤖 AI ปรับลดจำนวนหุ้นให้พอดีงบ ${formatNumber(budget)} ${investorProfile.currency} เรียบร้อย (มูลค่ารวมใหม่: ${formatNumber(currentSum)} บาท | เหลือเงินสดสำรอง: ${formatNumber(newRemaining)} บาท)`);
    setTimeout(() => setMatrixSuccessToast(null), 4500);
  };

  const handleMatrixEqualWeightAll = () => {
    if (matrixRows.length === 0) return;
    const totalBudget = investorProfile.capital || 50000;
    const equalBudget = (totalBudget * 0.96) / matrixRows.length;
    
    let updated = matrixRows.map((r) => {
      const price = r.entryPrice > 0 ? r.entryPrice : 1;
      let shares = 0;
      if (price > 100) {
        shares = Math.max(1, Math.floor(equalBudget / price / 10) * 10 || Math.floor(equalBudget / price));
      } else {
        shares = Math.max(100, Math.floor(equalBudget / price / 100) * 100 || Math.floor(equalBudget / price));
      }
      return {
        ...r,
        shares,
      };
    });

    // Check if total exceeds budget
    let sumCost = updated.reduce((s, r) => s + (r.entryPrice * r.shares), 0);
    if (sumCost > totalBudget) {
      handleAIAutoFitShares(totalBudget);
    } else {
      setMatrixRows(updated);
    }
  };

  const handleMatrixWeightByMOS = () => {
    if (matrixRows.length === 0) return;
    const totalBudget = investorProfile.capital || 50000;
    const positiveMOSRows = matrixRows.map((r) => ({
      ...r,
      effectiveMOS: Math.max(5, r.marginOfSafety),
    }));
    const totalMOS = positiveMOSRows.reduce((sum, r) => sum + r.effectiveMOS, 0);

    let updated = matrixRows.map((r) => {
      const effMOS = Math.max(5, r.marginOfSafety);
      const weightRatio = totalMOS > 0 ? effMOS / totalMOS : 1 / matrixRows.length;
      const rowBudget = (totalBudget * 0.96) * weightRatio;
      const price = r.entryPrice > 0 ? r.entryPrice : 1;
      let shares = 0;
      if (price > 100) {
        shares = Math.max(1, Math.floor(rowBudget / price / 10) * 10 || Math.floor(rowBudget / price));
      } else {
        shares = Math.max(100, Math.floor(rowBudget / price / 100) * 100 || Math.floor(rowBudget / price));
      }
      return {
        ...r,
        shares,
      };
    });

    let sumCost = updated.reduce((s, r) => s + (r.entryPrice * r.shares), 0);
    if (sumCost > totalBudget) {
      handleAIAutoFitShares(totalBudget);
    } else {
      setMatrixRows(updated);
    }
  };

  const handleLoadPositionsToMatrix = () => {
    if (!positions || positions.length === 0) {
      alert('ยังไม่มีหุ้นในพอร์ตปัจจุบันให้โหลดครับ');
      return;
    }
    const loaded: MatrixTableRow[] = positions.map((p, idx) => ({
      id: `row-${p.id || idx}-${Date.now()}`,
      symbol: p.symbol,
      name: p.stockData?.name || p.symbol,
      market: p.stockData?.market || 'SET',
      sector: p.stockData?.sector || 'General',
      currency: p.stockData?.currency || 'THB',
      lastClosePrice: p.stockData?.currentPrice || p.entryPrice,
      entryPrice: p.entryPrice,
      fairValue: p.stockData?.fairValue || Number((p.entryPrice * 1.18).toFixed(2)),
      marginOfSafety: p.stockData?.marginOfSafety ?? 15,
      trend: p.stockData?.trend || 'UPTREND',
      rsi: p.stockData?.rsi || 52,
      stopLossPrice: p.stopLossPrice,
      targetPrice: p.targetPrice,
      riskRewardRatio: Number(((p.targetPrice - p.entryPrice) / Math.max(0.01, p.entryPrice - p.stopLossPrice)).toFixed(2)),
      shares: p.shares,
      strategyTag: p.strategyTag,
      stockData: p.stockData,
    }));
    setMatrixRows(loaded);
    setMatrixSuccessToast('โหลดหุ้นจากพอร์ตปัจจุบันเข้าสู่ตาราง Matrix เรียบร้อย');
    setTimeout(() => setMatrixSuccessToast(null), 3000);
  };

  const handleClearMatrix = () => {
    const firstRow = generateDefaultMatrixRow('CPALL', 0);
    setMatrixRows([firstRow]);
  };

  const handleSaveAndExecuteMatrix = (forceSkipBudgetCheck: boolean = false) => {
    const validRows = matrixRows.filter((r) => r.symbol.trim() !== '' && r.shares > 0);
    if (validRows.length === 0) {
      alert('กรุณาระบุอักษรหุ้นและจำนวนหุ้นอย่างน้อย 1 แถวก่อนบันทึกครับ');
      return;
    }

    // Budget guard: Check if total cost exceeds capital
    if (!forceSkipBudgetCheck && matrixTotalCost > investorProfile.capital) {
      setIsOverBudgetModalOpen(true);
      return;
    }

    const convertedPositions: UserPosition[] = validRows.map((r, idx) => {
      let finalStock: StockData;
      const existing = allStocks.find((s) => s.symbol.toUpperCase() === r.symbol.toUpperCase());
      if (existing) {
        finalStock = {
          ...existing,
          currentPrice: r.entryPrice,
          targetPrice1: r.targetPrice,
          stopLossPrice: r.stopLossPrice,
          marginOfSafety: r.marginOfSafety,
          market: r.market,
          sector: r.sector,
          currency: r.currency,
        };
      } else {
        finalStock = generateCustomStockData(
          r.symbol,
          r.name,
          r.market,
          r.sector,
          r.currency,
          r.entryPrice,
          r.targetPrice,
          r.stopLossPrice,
          r.marginOfSafety
        );
      }

      return {
        id: `pos-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        symbol: r.symbol.toUpperCase(),
        entryDate: new Date().toISOString().split('T')[0],
        entryPrice: Number(r.entryPrice),
        shares: Number(r.shares),
        totalCost: Number(r.entryPrice) * Number(r.shares),
        targetPrice: Number(r.targetPrice),
        stopLossPrice: Number(r.stopLossPrice),
        strategyTag: r.strategyTag,
        thesisNotes: `จัดพอร์ตผ่านตาราง Matrix: MOS +${r.marginOfSafety}%, SL ${r.stopLossPrice}, TP ${r.targetPrice}`,
        stockData: finalStock,
      };
    });

    if (onSetAllPositions) {
      onSetAllPositions(convertedPositions);
    } else if (onBulkAddPositions) {
      onBulkAddPositions(convertedPositions);
    } else {
      convertedPositions.forEach((pos) => onAddPosition(pos));
    }

    setIsOverBudgetModalOpen(false);
    setMatrixSuccessToast(`🚀 บันทึกพอร์ต ${validRows.length} รายการ และคำนวณดัชนีชี้วัดผลเรียบร้อย!`);
    setTimeout(() => setMatrixSuccessToast(null), 4000);

    // Auto navigate to Period KPIs and trigger AI Audit
    setActiveTab('period-kpis');
    setTimeout(() => {
      handleRunAIAudit();
    }, 400);
  };

  const handleOpenCloseModal = (pos: UserPosition) => {
    setSelectedClosePosition(pos);
    setExitPriceInput(pos.stockData?.currentPrice || pos.entryPrice);
    setExitReasonInput(
      (pos.stockData?.currentPrice || pos.entryPrice) >= pos.targetPrice ? 'TARGET_HIT' : 
      (pos.stockData?.currentPrice || pos.entryPrice) <= pos.stopLossPrice ? 'STOP_LOSS' : 'MANUAL_EXIT'
    );
    setExitNotesInput('บันทึกบทเรียนและการตัดสินใจ');
  };

  const handleConfirmClose = () => {
    if (!selectedClosePosition) return;
    onClosePosition(
      selectedClosePosition.id,
      Number(exitPriceInput),
      exitReasonInput,
      exitNotesInput
    );
    setSelectedClosePosition(null);
  };

  // Run AI Master Analyst Audit via Server Gemini Endpoint
  const handleRunAIAudit = async () => {
    if (positions.length === 0) {
      alert('กรุณาเพิ่มหุ้นในพอร์ตอย่างน้อย 1 รายการก่อนเรียก AI วิเคราะห์ครับ');
      return;
    }

    setIsAuditingAI(true);
    try {
      const res = await fetch('/api/audit-user-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorProfile,
          positions,
          summary,
          periodInfo: {
            label: periodKPIs.periodLabel,
            daysElapsed: periodKPIs.daysElapsed,
            totalDays: periodKPIs.totalDays,
            progressPercent: periodKPIs.progressPercent,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.audit) {
        setUserAudit({
          ...data.audit,
          auditedAt: new Date().toISOString(),
        });
      } else {
        // Fallback to algorithmic audit
        const fallbackAudit = generateAlgorithmicUserAudit(positions, closedTrades, investorProfile, summary, periodKPIs);
        setUserAudit(fallbackAudit);
      }
    } catch (err) {
      console.warn('AI Audit failed, fallback to algorithmic calculation:', err);
      const fallbackAudit = generateAlgorithmicUserAudit(positions, closedTrades, investorProfile, summary, periodKPIs);
      setUserAudit(fallbackAudit);
    } finally {
      setIsAuditingAI(false);
      setActiveTab('ai-audit');
    }
  };

  const handleCopyAuditText = () => {
    if (!userAudit) return;
    const text = `
🏛️ บทวิเคราะห์พอร์ตลงทุนโดย AI Master Analyst (SBY Invest AI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ผลการประเมิน: เกรด ${userAudit.grade} (${userAudit.score}/100 คะแนน)
💰 เงินลงทุนเป้าหมาย: ${investorProfile.capital.toLocaleString()} ${investorProfile.currency}
📈 เป้าหมายผลตอบแทน: +${investorProfile.targetReturnPercent}% ในกรอบเวลา ${periodKPIs.periodLabel}
⏱️ ความคืบหน้าระยะเวลา: ${periodKPIs.daysElapsed}/${periodKPIs.totalDays} วัน (${periodKPIs.progressPercent}%)

📋 ความเห็นของ Chief Investment Officer:
${userAudit.executiveVerdict}

⚖️ การวิเคราะห์ความสอดคล้องกับเป้าหมาย (Alignment):
${userAudit.goalAlignmentAnalysis}

✨ จุดแข็งหลัก:
${userAudit.strengths.map((s) => `• ${s}`).join('\n')}

⚠️ ความเสี่ยงและจุดบอด:
${userAudit.risksAndBlindspots.map((r) => `• ${r}`).join('\n')}

💡 คำแนะนำปรับสัดส่วนเพื่อเพิ่มโอกาสสำเร็จ (Actionable Optimization):
${userAudit.actionableOptimization.map((o) => `• ${o}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2500);
  };

  const handleCopyKPIReport = () => {
    const text = `
⏱️ รายงานตัวชี้วัดความสำเร็จของพอร์ตเมื่อครบ Period (SBY Invest AI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 กรอบเวลาการลงทุน: ${periodKPIs.periodLabel} (${periodKPIs.startDate} ถึง ${periodKPIs.endDate})
⏳ ระยะเวลาที่ผ่านไป: ${periodKPIs.daysElapsed}/${periodKPIs.totalDays} วัน (${periodKPIs.progressPercent}%)
💰 เงินลงทุนต้นทุน: ${investorProfile.capital.toLocaleString()} ${investorProfile.currency}
🎯 เป้าหมายผลตอบแทน: +${investorProfile.targetReturnPercent}% (+${formatNumber(periodKPIs.targetProfitAmount)} ${investorProfile.currency})

📊 ตัวชี้วัดผลการดำเนินงานจริง (Current KPIs):
• กำไรสุทธิปัจจุบัน: ${periodKPIs.currentNetPnL >= 0 ? '+' : ''}${formatNumber(periodKPIs.currentNetPnL)} ${investorProfile.currency} (${periodKPIs.currentReturnPercent >= 0 ? '+' : ''}${periodKPIs.currentReturnPercent}%)
• อัตราความสำเร็จสู่เป้าหมาย (Achievement Rate): ${periodKPIs.targetAchievementRate}%
• ประมาณการผลตอบแทนเมื่อครบ Period: +${periodKPIs.projectedEndReturn}% (มูลค่า ${formatNumber(periodKPIs.projectedEndValue)} ${investorProfile.currency})
• Sharpe Ratio (ความคุ้มค่าเทียบความเสี่ยง): ${periodKPIs.sharpeRatio}
• Maximum Drawdown สูงสุดที่คุมไว้: -${periodKPIs.estimatedMaxDrawdown}%
• Average Margin of Safety: ${periodKPIs.averageMarginOfSafety}%
• วินัยการคุมความเสี่ยง (Discipline Score): ${periodKPIs.disciplineScore}/100
• ระดับเกรดความสำเร็จ Milestone: ${periodKPIs.milestoneGrade}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedKPIReport(true);
    setTimeout(() => setCopiedKPIReport(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Hero Banner: Investor Conditions & Quick AI Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
                <PieChart className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                พอร์ตการลงทุนที่ผู้ใช้จัดเอง (User-Led Portfolio & AI Master Audit)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl font-medium">
              คุณเป็นผู้นำหุ้นเข้าพอร์ตและกำหนดสัดส่วนเอง โดยอิงเงื่อนไขเงินลงทุนและเป้าหมายเดียวกัน พร้อม AI อัจฉริยะวิเคราะห์วินิจฉัยและวัดผลเมื่อครบ Period
            </p>
            
            {/* Unified Investment Constraint Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-200 flex items-center space-x-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span>เงินลงทุน: <strong>{formatNumber(investorProfile.capital)} {investorProfile.currency}</strong></span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-200 flex items-center space-x-1">
                <Target className="w-3 h-3 text-indigo-400" />
                <span>เป้าหมายผลตอบแทน: <strong>+{investorProfile.targetReturnPercent}% ต่อปี</strong></span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-200 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>กรอบเวลา: <strong>{periodKPIs.periodLabel}</strong></span>
              </span>
              <button 
                onClick={onOpenObjectiveModal}
                className="px-2 py-0.5 rounded text-[10px] text-indigo-300 hover:text-white underline font-bold"
              >
                แก้ไขเงื่อนไข
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Run AI Master Analyst Review */}
            <button
              onClick={handleRunAIAudit}
              disabled={isAuditingAI || positions.length === 0}
              id="ai-audit-portfolio-btn"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isAuditingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>AI กำลังวินิจฉัยพอร์ต...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>🧠 ให้ AI อัจฉริยะวิเคราะห์พอร์ตนี้</span>
                </>
              )}
            </button>

            {/* Add Stock Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              id="add-stock-to-portfolio-btn"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-indigo-300/30 text-white font-bold text-xs flex items-center space-x-2 transition-all backdrop-blur-md cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ เพิ่มหุ้นลงพอร์ต</span>
            </button>

            {/* Direct Option to Switch to AI 5-8 Stocks Portfolio Builder */}
            <button
              onClick={onSwitchToAIPortfolioBuilder}
              id="switch-to-ai-builder-btn"
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              title="สลับไปใช้เครื่องมือ AI ช่วยจัดพอร์ต 5-8 ตัว"
            >
              <span>หรือให้ AI จัด 5-8 ตัว ↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Profit & Portfolio Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio Value & Capital Allocation */}
        <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1.5">
            <span>มูลค่าพอร์ตปัจจุบัน</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatNumber(summary.currentValue)} <span className="text-xs font-semibold text-slate-400">{investorProfile.currency}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center justify-between">
            <span>ต้นทุนหุ้นที่ซื้อ: {formatNumber(deployedCapital)}</span>
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              {positions.length} สินทรัพย์
            </span>
          </div>
          {/* Capital allocation progress */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
            <span>ลงหุ้น: {deployedPercent.toFixed(0)}%</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              เงินสดคงเหลือ: {formatNumber(cashRemaining)} ({cashPercent.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Card 2: Unrealized & Net P&L */}
        <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1.5">
            <span>กำไรสุทธิรวม (Total Net P&L)</span>
            <span className={`p-1.5 rounded-lg ${
              summary.totalNetPnL >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {summary.totalNetPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black ${
            summary.totalNetPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {summary.totalNetPnL >= 0 ? '+' : ''}{formatNumber(summary.totalNetPnL)} <span className="text-xs font-semibold">({periodKPIs.currentReturnPercent >= 0 ? '+' : ''}{periodKPIs.currentReturnPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center justify-between">
            <span>ยังไม่ขาย: {summary.unrealizedPnL >= 0 ? '+' : ''}{formatNumber(summary.unrealizedPnL)}</span>
            <span>ปิดกำไรแล้ว: {summary.totalRealizedPnL >= 0 ? '+' : ''}{formatNumber(summary.totalRealizedPnL)}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/60 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex justify-between">
            <span>Sharpe Ratio: {periodKPIs.sharpeRatio}</span>
            <span>Max Drawdown: -{periodKPIs.estimatedMaxDrawdown}%</span>
          </div>
        </div>

        {/* Card 3: Target Profit Metric & Period Progress */}
        <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs relative">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1.5">
            <span className="flex items-center space-x-1">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>เป้าหมายกำไรในรอบ Period</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              +{investorProfile.targetReturnPercent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
            +{formatNumber(summary.targetProfitAmount)} <span className="text-xs font-semibold">{investorProfile.currency}</span>
          </div>
          {/* Progress Bar towards Target Profit */}
          <div className="mt-2 space-y-1">
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, periodKPIs.targetAchievementRate))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
              <span>ความคืบหน้า: {periodKPIs.targetAchievementRate}%</span>
              <span>ประมาณการสิ้นสุด: +{periodKPIs.projectedEndReturn}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Period Milestone & AI Grade */}
        <div 
          onClick={() => setIsPeriodModalOpen(true)}
          className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent bg-white dark:bg-[#121215] p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 shadow-xs cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md transition-all group relative"
          title="คลิกเพื่อตั้งค่าระยะเวลา (Period) หรือย้อนวันที่จำลองผลพอร์ต (Backtest)"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 font-semibold mb-1.5">
            <span className="flex items-center space-x-1 text-indigo-700 dark:text-indigo-300 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>ความคืบหน้า Period</span>
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-extrabold">
                Milestone เกรด {userAudit ? userAudit.grade : periodKPIs.milestoneGrade}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold flex items-center space-x-0.5 transition-colors shadow-2xs">
                <Sliders className="w-2.5 h-2.5" />
                <span>ตั้งค่า/ย้อนวัน</span>
              </span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {periodKPIs.daysElapsed}
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">/ {periodKPIs.totalDays} วัน ({periodKPIs.progressPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-zinc-300 font-bold mt-1 truncate flex items-center justify-between">
            <span>{periodKPIs.isPeriodEnded ? '🏁 ครบกำหนดระยะเวลาแล้ว' : `เหลืออีก ${periodKPIs.daysRemaining} วัน`}</span>
            <span className="text-[10px] text-indigo-500 font-normal group-hover:underline">คลิกแก้ไข &rarr;</span>
          </div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>วินัย: {skillMetrics.disciplineScore}% • Avg MOS: {periodKPIs.averageMarginOfSafety}%</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs: Holdings, AI Master Analyst Audit, Period KPIs, Journal, Skill Coach */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          {/* Tab 0: Table Matrix Builder (USER'S REQUESTED TABLE FORMAT) */}
          <button
            onClick={() => setActiveTab('table-builder')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'table-builder'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-indigo-300" />
            <span>📊 จัดหุ้นลงพอร์ตแบบตาราง (Table Matrix)</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-[10px] font-black border border-indigo-400/40">
              Step 1-4
            </span>
          </button>

          {/* Tab 1: Holdings */}
          <button
            onClick={() => setActiveTab('holdings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'holdings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>หุ้นในพอร์ตที่จัดแล้ว ({positions.length})</span>
          </button>

          {/* Tab 2: AI Master Audit (NEW & CORE) */}
          <button
            onClick={() => setActiveTab('ai-audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer relative ${
              activeTab === 'ai-audit'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-300/40 dark:border-indigo-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>🧠 AI Master Analyst วินิจฉัยพอร์ต</span>
            {userAudit && (
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                {userAudit.grade}
              </span>
            )}
          </button>

          {/* Tab 3: Period KPIs & Completion (NEW & CORE) */}
          <button
            onClick={() => setActiveTab('period-kpis')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'period-kpis'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>⏱️ ตัวชี้วัดครบระยะเวลา (Period KPIs)</span>
          </button>

          {/* Tab 4: Journal */}
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>สมุดบันทึกผลการเทรด ({closedTrades.length})</span>
          </button>

          {/* Tab 5: Skill Development */}
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'skills'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>ศูนย์พัฒนาทักษะ & AI Coach</span>
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 pl-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มหุ้นเดี่ยว (Modal)</span>
        </button>
      </div>

      {/* Success Toast */}
      {matrixSuccessToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{matrixSuccessToast}</span>
          </div>
          <button onClick={() => setMatrixSuccessToast(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 0: TABLE-BASED PORTFOLIO BUILDER MATRIX */}
      {activeTab === 'table-builder' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Step Guide & Capital Budget Controller */}
          <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wider">
                    Step-by-Step Flow
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    กระบวนการจัดหุ้นลงพอร์ตแบบตารางแถว (Tabular Portfolio Matrix)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
                  <strong>ขั้นตอน:</strong> 1. ใส่อักษรย่อหุ้นใน Col 1 &rarr; 2. ดึงราคาปิดล่าสุด &rarr; 3. ตรวจสอบ Indicators (MOS, Trend, SL, TP) &rarr; 4. ระบุจำนวนหุ้น &rarr; 5. ตรวจสอบงบเงินลงทุนและบันทึกประเมินผล
                </p>
              </div>

              {/* Quick Actions & AI Optimization Presets */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleMatrixAddRow}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มแถวหุ้น (Row)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAIAutoFitShares(investorProfile.capital)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-95 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                  title="ให้ AI คำนวณปรับลดจำนวนหุ้นของทุกตัวให้พอดีกับงบเงินลงทุนที่ตั้งไว้"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>🤖 AI ปรับลดหุ้นให้พอดีงบ</span>
                </button>
                <button
                  type="button"
                  onClick={handleMatrixEqualWeightAll}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
                  title="เฉลี่ยเงินลงทุนเท่าๆ กันทุกหุ้น"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  <span>เฉลี่ยเท่ากัน (Equal Weight)</span>
                </button>
                <button
                  type="button"
                  onClick={handleMatrixWeightByMOS}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
                  title="จัดสรรน้ำหนักตาม Margin of Safety สูงให้สัดส่วนมาก"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>น้ำหนักตาม MOS</span>
                </button>
                {positions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleLoadPositionsToMatrix}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
                    title="โหลดข้อมูลจากพอร์ตเดิมเข้ามาแก้"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    <span>โหลดพอร์ตปัจจุบัน</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearMatrix}
                  className="px-2.5 py-2 rounded-xl text-slate-400 hover:text-rose-500 text-xs font-semibold cursor-pointer"
                  title="ล้างแถวทั้งหมด"
                >
                  ล้าง
                </button>
              </div>
            </div>

            {/* Capital Budget Setting & Fast Preset Switcher Bar */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/40 text-amber-400 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-zinc-300 font-medium">วงเงินลงทุนที่ตั้งไว้ (Capital Budget):</span>
                    {!isEditingCapital ? (
                      <span className="text-sm font-black text-amber-400 tracking-wide">
                        {formatNumber(investorProfile.capital)} {investorProfile.currency}
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          step="1000"
                          min="1000"
                          value={capitalInputVal}
                          onChange={(e) => setCapitalInputVal(parseInt(e.target.value) || 0)}
                          className="w-28 px-2 py-0.5 text-xs font-black text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCapital(capitalInputVal)}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black rounded-md cursor-pointer"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingCapital(false)}
                          className="px-1.5 py-0.5 text-zinc-400 hover:text-white text-[10px] cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    )}
                    {!isEditingCapital && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCapital(true)}
                        className="text-[10px] text-indigo-300 hover:text-white underline cursor-pointer"
                      >
                        (✏️ แก้ไข)
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    ตั้งค่างบเงินลงทุนเพื่อควบคุมการลงหุ้นไม่ให้เกินวงเงินและให้ AI ช่วยจัดสรร
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons (including 50,000 THB) */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-zinc-400 font-semibold mr-1">ปุ่มตั้งงบด่วน:</span>
                <button
                  type="button"
                  onClick={handleSetBudget50k}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center space-x-1 ${
                    investorProfile.capital === 50000
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-indigo-900/60 hover:bg-indigo-800 text-amber-300 border border-amber-400/40'
                  }`}
                  title="ตั้งงบ 50,000 บาท และให้ AI จัดสรรหุ้นให้พอดีทันที"
                >
                  <span>🎯 50,000 ฿ (ค่าแนะนำ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCapital(100000)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    investorProfile.capital === 100000
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                  }`}
                >
                  100k ฿
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCapital(200000)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    investorProfile.capital === 200000
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                  }`}
                >
                  200k ฿
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCapital(500000)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    investorProfile.capital === 500000
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-zinc-200'
                  }`}
                >
                  500k ฿
                </button>
              </div>
            </div>

            {/* Matrix Live Capital Summary Strip */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-3.5 rounded-2xl border text-xs transition-colors ${
              isOverBudget
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
                : 'bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-zinc-800/80'
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">เงินลงทุนตั้งต้น (Capital)</span>
                <strong className="text-slate-900 dark:text-white text-sm">
                  {formatNumber(investorProfile.capital)} <span className="text-[10px] text-slate-400">{investorProfile.currency}</span>
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">มูลค่าลงทุนในหุ้น (Deployed)</span>
                <strong className={`text-sm ${isOverBudget ? 'text-rose-600 font-black' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {formatNumber(matrixTotalCost)} ({matrixDeployedPercent}%)
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">เงินสดคงเหลือ (Cash Left)</span>
                <strong className={`text-sm ${isOverBudget ? 'text-rose-600 font-black' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {isOverBudget ? `ติดลบ -${formatNumber(overBudgetAmount)}` : `${formatNumber(matrixCashRemaining)} (${matrixCashPercent}%)`}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">ประมาณการกำไร (Target Gain)</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                  +{formatNumber(matrixTotalGain)} (+{matrixGainPercent}%)
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">ความเสี่ยงรวม (Max Risk)</span>
                <strong className="text-rose-600 dark:text-rose-400 text-sm">
                  -{formatNumber(matrixTotalRisk)} (-{matrixRiskPercent}%)
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Avg MOS / R:R Ratio</span>
                <strong className="text-indigo-600 dark:text-indigo-400 text-sm">
                  +{matrixAverageMOS}% / {matrixAverageRR}x
                </strong>
              </div>
            </div>
          </div>

          {/* PROMINENT OVER-BUDGET ALERT BANNER & 2 QUICK ACTION CHOICES */}
          {isOverBudget && (
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-700/80 shadow-md space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500 text-white shrink-0 shadow-xs">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-black text-rose-800 dark:text-rose-200 flex items-center space-x-2">
                      <span>⚠️ เงินลงทุนไม่พอสำหรับพอร์ตนี้! (Over-Budget)</span>
                    </h3>
                    <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                      คุณตั้งงบเงินลงทุนไว้ <strong>{formatNumber(investorProfile.capital)} {investorProfile.currency}</strong> แต่มูลค่าซื้อหุ้นรวมคือ <strong>{formatNumber(matrixTotalCost)} {investorProfile.currency}</strong> (เกินงบอยู่ <strong>{formatNumber(overBudgetAmount)} {investorProfile.currency}</strong> หรือเกินมา +{overBudgetPercent}%)
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 Quick Solutions */}
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60">
                <div className="text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-2">
                  💡 ระบบมี 2 ทางเลือกด่วนเพื่อช่วยให้พอร์ตสมดุลและถูกต้องตามหลัก Money Management:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Choice 1: AI Auto-Fit Shares */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-black text-indigo-700 dark:text-indigo-400">
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>ทางเลือกที่ 1: ให้ AI ปรับลดจำนวนหุ้นให้พอดีงบ</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                        AI จะช่วยคำนวณและปรับลดจำนวนหุ้นของทุกแถวตามสัดส่วน เพื่อให้ยอดเงินรวมไม่เกิน <strong>{formatNumber(investorProfile.capital)} ฿</strong> พอดีเป๊ะ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAIAutoFitShares(investorProfile.capital)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>🛠️ ให้ AI ปรับลดหุ้นให้พอดี {formatNumber(investorProfile.capital)} ฿</span>
                    </button>
                  </div>

                  {/* Choice 2: Increase Capital Budget */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400">
                        <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>ทางเลือกที่ 2: ปรับเพิ่มวงเงินลงทุน</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                        หากต้องการซื้อหุ้นตามจำนวนเดิมทั้งหมด สามารถปรับเพิ่มวงเงินลงทุนเป็น <strong>{formatNumber(matrixTotalCost)} ฿</strong> ได้ในคลิกเดียว
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFixByIncreasingCapital}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>💰 ปรับงบเงินทุนเป็น {formatNumber(matrixTotalCost)} ฿ ทันที</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Editable Table Matrix */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {/* Price Condition & Stock Selection Filter Bar */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 flex items-center space-x-1 mr-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  <span>คัดเลือกหุ้นตามระดับราคา:</span>
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
                    onClick={() => handleMatrixPriceBracketChange(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      matrixPriceBracket === p.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">ระบุช่วงราคา:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Min ฿"
                    value={matrixMinPriceInput}
                    onChange={(e) => {
                      setMatrixMinPriceInput(e.target.value);
                      setMatrixPriceBracket('CUSTOM');
                    }}
                    className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Max ฿"
                    value={matrixMaxPriceInput}
                    onChange={(e) => {
                      setMatrixMaxPriceInput(e.target.value);
                      setMatrixPriceBracket('CUSTOM');
                    }}
                    className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsPriceStockPickerOpen(true)}
                  className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                >
                  <Search className="w-3 h-3" />
                  <span>ค้นหาหุ้นช่วงราคานี้ ({filteredStocksByPriceCondition.length})</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
                <thead className="bg-slate-100/80 dark:bg-[#18181B] text-slate-600 dark:text-zinc-300 font-extrabold uppercase border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-3 w-10 text-center">#</th>
                    <th className="py-3.5 px-3 min-w-[180px]">
                      <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-black">
                        <span>Col 1: อักษรหุ้น (Symbol)</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-3 min-w-[120px]">
                      <div className="flex items-center space-x-1">
                        <span>Col 2: ราคาปิด (Last)</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-3 min-w-[130px]">
                      <div className="flex items-center space-x-1 text-slate-700 dark:text-zinc-200 font-bold">
                        <span>Indicator: ราคาซื้อ</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-3 min-w-[110px]">
                      <span>Indicator: Fair Value & MOS</span>
                    </th>
                    <th className="py-3.5 px-3 min-w-[110px]">
                      <span>Indicator: กราฟ / RSI</span>
                    </th>
                    <th className="py-3.5 px-3 min-w-[120px]">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">Indicator: Stop Loss</span>
                    </th>
                    <th className="py-3.5 px-3 min-w-[120px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Indicator: Target TP</span>
                    </th>
                    <th className="py-3.5 px-3 min-w-[190px]">
                      <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-black">
                        <span>Col ถัดไป: จำนวนหุ้นเก็บลงพอร์ต</span>
                      </div>
                    </th>
                    <th className="py-3.5 px-3 min-w-[130px] text-right">
                      <span>มูลค่าลงทุน (Cost)</span>
                    </th>
                    <th className="py-3.5 px-3 w-12 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 font-medium">
                  {matrixRows.map((row, idx) => {
                    const rowCost = row.entryPrice * row.shares;
                    const rowWeight = investorProfile.capital > 0 ? ((rowCost / investorProfile.capital) * 100).toFixed(1) : '0';
                    const isDropdownActive = activeMatrixDropdownRowId === row.id;

                    const filteredStockOptions = allStocks.filter(
                      (s) =>
                        s.symbol.toUpperCase().includes(row.symbol.toUpperCase()) ||
                        s.name.toLowerCase().includes(row.symbol.toLowerCase()) ||
                        s.sector.toLowerCase().includes(row.symbol.toLowerCase())
                    ).slice(0, 8);

                    return (
                      <tr 
                        key={row.id} 
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors group relative"
                      >
                        {/* Row Index */}
                        <td className="py-3 px-3 text-center text-slate-400 font-bold text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Col 1: Symbol Input with Instant Autocomplete */}
                        <td className="py-3 px-3 relative">
                          <div className="space-y-1">
                            <div className="relative">
                              <input
                                type="text"
                                value={row.symbol}
                                onChange={(e) => handleMatrixSymbolChange(row.id, e.target.value)}
                                onFocus={() => {
                                  setActiveMatrixDropdownRowId(row.id);
                                  setMatrixSearchQuery(row.symbol);
                                }}
                                placeholder="เช่น CPALL, PTT"
                                className="w-full px-2.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[120px]">{row.name}</span>
                              <span className="px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold">
                                {row.market}
                              </span>
                            </div>
                          </div>

                          {/* Autocomplete Dropdown */}
                          {isDropdownActive && filteredStockOptions.length > 0 && (
                            <div 
                              className="absolute top-full left-3 z-50 w-72 bg-white dark:bg-[#18181B] border border-indigo-200 dark:border-indigo-800/80 rounded-2xl shadow-xl p-1.5 space-y-1 mt-1 max-h-60 overflow-y-auto"
                            >
                              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                                <span>คลิกเลือกหุ้นเพื่อโหลด Indicator อัตโนมัติ:</span>
                                <button 
                                  type="button" 
                                  onClick={() => setActiveMatrixDropdownRowId(null)}
                                  className="text-slate-400 hover:text-slate-600 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                              {filteredStockOptions.map((stk) => (
                                <button
                                  key={stk.id}
                                  type="button"
                                  onClick={() => applyStockToMatrixRow(row.id, stk)}
                                  className="w-full text-left p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center justify-between group/item transition-colors cursor-pointer"
                                >
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                                        {stk.symbol}
                                      </span>
                                      <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                                        {stk.name}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                                      {stk.sector} • MOS +{stk.marginOfSafety}%
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                                      {stk.currentPrice.toFixed(2)}
                                    </div>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                      TP: {stk.targetPrice1?.toFixed(2) || '-'}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Col 2: ราคาปิดเมื่อวาน (Last Close Price) */}
                        <td className="py-3 px-3">
                          <div className="font-black text-slate-900 dark:text-white text-xs">
                            {formatNumber(row.lastClosePrice)} <span className="text-[10px] text-slate-400">{row.currency}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">ราคาตลาดล่าสุด</span>
                        </td>

                        {/* Indicator: ราคาเข้าซื้อ (Entry Price Input) */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.1"
                              value={row.entryPrice || ''}
                              onChange={(e) => handleMatrixEntryPriceChange(row.id, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleMatrixEntryPriceChange(row.id, row.lastClosePrice)}
                                className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-semibold cursor-pointer"
                                title="ตั้งราคาซื้อเท่ากับราคาปิดปัจจุบัน"
                              >
                                เท่าราคาปิด
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMatrixEntryPriceChange(row.id, Number((row.lastClosePrice * 0.97).toFixed(2)))}
                                className="text-[9px] px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 font-semibold cursor-pointer"
                                title="ตั้งราคาซื้อตอนราคาย่อตัว -3%"
                              >
                                ย่อ -3%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMatrixEntryPriceChange(row.id, Number((row.lastClosePrice * 0.95).toFixed(2)))}
                                className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer"
                                title="ตั้งราคาซื้อตอนราคาย่อตัว -5%"
                              >
                                ย่อ -5%
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {row.entryPrice === row.lastClosePrice ? 'เท่ากับราคาปิด' : `ส่วนต่าง ${(row.entryPrice - row.lastClosePrice).toFixed(2)}`}
                            </div>
                          </div>
                        </td>

                        {/* Indicator: Fair Value & MOS */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800 dark:text-zinc-200">
                            {row.fairValue.toFixed(2)}
                          </div>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded inline-block ${
                            row.marginOfSafety >= 15
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : row.marginOfSafety > 0
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            MOS {row.marginOfSafety > 0 ? `+${row.marginOfSafety}%` : `${row.marginOfSafety}%`}
                          </span>
                        </td>

                        {/* Indicator: Trend & RSI */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1 text-[11px] font-bold">
                            {row.trend === 'UPTREND' ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                                <TrendingUp className="w-3 h-3 mr-0.5" /> ขาขึ้น
                              </span>
                            ) : row.trend === 'DOWNTREND' ? (
                              <span className="text-rose-600 dark:text-rose-400 flex items-center">
                                <TrendingDown className="w-3 h-3 mr-0.5" /> ขาลง
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center">
                                ไซด์เวย์
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            RSI: <strong className="text-slate-700 dark:text-zinc-300">{row.rsi}</strong>
                          </div>
                        </td>

                        {/* Indicator: Stop Loss (SL) */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.1"
                              value={row.stopLossPrice || ''}
                              onChange={(e) => handleMatrixStopLossChange(row.id, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                            />
                            <div className="text-[10px] text-rose-500">
                              -{row.entryPrice > 0 ? (((row.entryPrice - row.stopLossPrice) / row.entryPrice) * 100).toFixed(1) : 0}%
                            </div>
                          </div>
                        </td>

                        {/* Indicator: Target Price (TP) */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <input
                              type="number"
                              step="0.1"
                              value={row.targetPrice || ''}
                              onChange={(e) => handleMatrixTargetPriceChange(row.id, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              +{row.entryPrice > 0 ? (((row.targetPrice - row.entryPrice) / row.entryPrice) * 100).toFixed(1) : 0}% (R:R {row.riskRewardRatio}x)
                            </div>
                          </div>
                        </td>

                        {/* Col ถัดจาก Indicator: จำนวนเก็บลงพอร์ต (Shares) */}
                        <td className="py-3 px-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                step="100"
                                min="0"
                                value={row.shares || ''}
                                onChange={(e) => handleMatrixSharesChange(row.id, parseInt(e.target.value) || 0)}
                                className="w-28 px-2.5 py-1 text-xs font-black text-indigo-600 dark:text-indigo-300 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/30 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">หุ้น</span>
                            </div>

                            {/* Quick Weight Allocation Chips */}
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleMatrixSetWeightPercent(row.id, 10)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 hover:text-indigo-600 text-[9px] font-bold text-slate-500 cursor-pointer"
                                title="จัดสรร 10% ของเงินลงทุน"
                              >
                                10%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMatrixSetWeightPercent(row.id, 20)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 hover:text-indigo-600 text-[9px] font-bold text-slate-500 cursor-pointer"
                                title="จัดสรร 20% ของเงินลงทุน"
                              >
                                20%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMatrixSetWeightPercent(row.id, 25)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 hover:text-indigo-600 text-[9px] font-bold text-slate-500 cursor-pointer"
                                title="จัดสรร 25% ของเงินลงทุน"
                              >
                                25%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMatrixSetWeightPercent(row.id, 30)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-100 hover:text-indigo-600 text-[9px] font-bold text-slate-500 cursor-pointer"
                                title="จัดสรร 30% ของเงินลงทุน"
                              >
                                30%
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Calculated Capital Cost for this Row */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {formatNumber(rowCost)} <span className="text-[10px] text-slate-400">{row.currency}</span>
                          </div>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {rowWeight}% ของพอร์ต
                          </span>
                        </td>

                        {/* Delete Row Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleMatrixRemoveRow(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="ลบแถวนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Execution Bar */}
            <div className={`p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
              isOverBudget
                ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-t-2 border-rose-500/80'
                : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  {isOverBudget ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-extrabold text-xs sm:text-sm">
                    {isOverBudget ? (
                      <span className="text-amber-300">
                        ⚠️ เงินลงทุนไม่พอ: ยอดซื้อรวม {formatNumber(matrixTotalCost)} เกินงบ {formatNumber(investorProfile.capital)} {investorProfile.currency} (เกิน {formatNumber(overBudgetAmount)} บาท)
                      </span>
                    ) : (
                      <span>
                        พร้อมคำนวณและประเมินผลพอร์ตตามเงื่อนไข: {matrixRows.length} รายการ (ต้นทุนรวม {formatNumber(matrixTotalCost)} / {formatNumber(investorProfile.capital)} {investorProfile.currency})
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  {isOverBudget
                    ? 'กรุณาเลือกให้ AI ปรับลดจำนวนหุ้นให้พอดี หรือปรับเพิ่มวงเงินลงทุน เพื่อรักษาการบริหารเงินทุน (Money Management) ที่มีวินัย'
                    : 'ระบบจะบันทึกพอร์ตเข้าสู่ระบบ ติดตามราคาเรียลไทม์ และให้ AI Master Analyst ร่วมวิเคราะห์และชี้วัดผลเมื่อครบ Period'}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {isOverBudget && (
                  <button
                    type="button"
                    onClick={() => handleAIAutoFitShares(investorProfile.capital)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI ปรับลดหุ้นให้พอดีงบ</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveAndExecuteMatrix()}
                  id="execute-matrix-portfolio-btn"
                  className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    isOverBudget
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isOverBudget ? '⚠️ ตรวจสอบงบ & บันทึกพอร์ต' : '🚀 บันทึกพอร์ตและเริ่มคำนวณดัชนีชี้วัดผล'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Price Stock Picker Modal */}
          {isPriceStockPickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        เลือกหุ้นตามระดับราคา ({matrixPriceBracket === 'UNDER_10' ? 'ต่ำกว่า 10 ฿' : matrixPriceBracket === '10_TO_50' ? '10 - 50 ฿' : matrixPriceBracket === '50_TO_100' ? '50 - 100 ฿' : matrixPriceBracket === 'ABOVE_100' ? 'เกิน 100 ฿' : 'ทุกราคา'})
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        พบ {filteredStocksByPriceCondition.length} หุ้นที่ตรงเงื่อนไข คลิกเพื่อเพิ่มลงในตารางจัดพอร์ตทันที
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPriceStockPickerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter presets bar inside modal */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        { id: 'ALL', label: 'ทั้งหมด' },
                        { id: 'UNDER_10', label: '< 10 ฿' },
                        { id: '10_TO_50', label: '10-50 ฿' },
                        { id: '50_TO_100', label: '50-100 ฿' },
                        { id: 'ABOVE_100', label: '> 100 ฿' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleMatrixPriceBracketChange(p.id)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          matrixPriceBracket === p.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1 text-[11px]">
                    <span className="text-slate-400">ช่วงราคา:</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={matrixMinPriceInput}
                      onChange={(e) => {
                        setMatrixMinPriceInput(e.target.value);
                        setMatrixPriceBracket('CUSTOM');
                      }}
                      className="w-14 px-1.5 py-0.5 rounded border border-slate-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={matrixMaxPriceInput}
                      onChange={(e) => {
                        setMatrixMaxPriceInput(e.target.value);
                        setMatrixPriceBracket('CUSTOM');
                      }}
                      className="w-14 px-1.5 py-0.5 rounded border border-slate-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>

                {/* Stock List */}
                <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredStocksByPriceCondition.map((stk) => (
                    <div
                      key={stk.id}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-xs">
                          {stk.symbol.substring(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {stk.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                              {stk.market} • {stk.sector}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{stk.name}</p>
                          <div className="flex items-center space-x-2 text-[10px] mt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              MOS +{stk.marginOfSafety}%
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">
                              Fair: {stk.fairValue.toFixed(2)} ฿
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">
                              TP: {stk.targetPrice1?.toFixed(2) || '-'} ฿
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-black text-sm text-slate-900 dark:text-white">
                            {stk.currentPrice.toFixed(2)} <span className="text-[10px] text-slate-400">฿</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {stk.trend === 'UPTREND' ? '📈 ขาขึ้น' : stk.trend === 'DOWNTREND' ? '📉 ขาลง' : '↔️ ไซด์เวย์'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleAddStockFromPricePicker(stk);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่ม</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px]">
                    เพิ่มได้หลายตัวต่อเนื่อง แล้วกดเสร็จสิ้นเพื่อตรวจดูตารางจัดพอร์ต
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPriceStockPickerOpen(false)}
                    className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl font-bold cursor-pointer"
                  >
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: ACTIVE HOLDINGS TABLE */}
      {activeTab === 'holdings' && (
        <div className="space-y-4">
          {positions.length === 0 ? (
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <PieChart className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  ยังไม่มีหุ้นในพอร์ตที่คุณจัดเอง
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  เริ่มเลือกหุ้นที่คุณสนใจ กำหนดราคาเป้าหมาย และจุดตัดขาดทุน เพื่อให้ AI อัจฉริยะร่วมวิเคราะห์และวัดผลเมื่อครบ Period
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มหุ้นแรกในพอร์ต</span>
                </button>
                <button
                  onClick={onSwitchToAIPortfolioBuilder}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>หรือให้ AI ช่วยจัดพอร์ต 5-8 ตัว</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Holdings Quick Summary Bar */}
              <div className="bg-slate-50 dark:bg-[#18181B] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-slate-400">พอร์ตถือครอง:</span>{' '}
                    <strong className="text-slate-900 dark:text-white">{positions.length} สินทรัพย์</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">น้ำหนักที่จัดสรรแล้ว:</span>{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">{deployedPercent.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">ส่วนเผื่อความปลอดภัยเฉลี่ย (MOS):</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">+{periodKPIs.averageMarginOfSafety}%</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRunAIAudit}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ให้ AI วินิจฉัยพอร์ตนี้</span>
                  </button>
                </div>
              </div>

              {/* Table of Positions */}
              <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#18181B] text-slate-500 dark:text-zinc-400 font-bold uppercase border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">สินทรัพย์ / กลยุทธ์</th>
                        <th className="py-3 px-3">ราคาเข้า / ปัจจุบัน</th>
                        <th className="py-3 px-3">จำนวน / สัดส่วนพอร์ต</th>
                        <th className="py-3 px-3">กำไร/ขาดทุน (P&L)</th>
                        <th className="py-3 px-3">เป้าหมายกำไร (Target)</th>
                        <th className="py-3 px-3">ตัดขาดทุน (Stop Loss)</th>
                        <th className="py-3 px-3">MOS พื้นฐาน</th>
                        <th className="py-3 px-4 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                      {positions.map((pos) => {
                        const currentP = pos.stockData?.currentPrice || pos.entryPrice;
                        const currentValue = pos.shares * currentP;
                        const pnl = currentValue - pos.totalCost;
                        const pnlPercent = pos.totalCost > 0 ? (pnl / pos.totalCost) * 100 : 0;
                        const targetDistance = ((pos.targetPrice - currentP) / currentP) * 100;
                        const progressToTarget = pos.targetPrice > pos.entryPrice 
                          ? Math.min(100, Math.max(0, ((currentP - pos.entryPrice) / (pos.targetPrice - pos.entryPrice)) * 100))
                          : 0;

                        const weightPercent = summary.currentValue > 0 ? (currentValue / summary.currentValue) * 100 : 0;
                        const stratObj = STRATEGY_OPTIONS.find((s) => s.id === pos.strategyTag) || STRATEGY_OPTIONS[0];

                        return (
                          <tr key={pos.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                            {/* Symbol & Strategy */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-2.5">
                                <button
                                  onClick={() => pos.stockData && onSelectStockForDeepAnalysis(pos.stockData)}
                                  className="font-black text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                                  title="คลิกเพื่อไปหน้าวิเคราะห์กราฟและงบการเงิน"
                                >
                                  <span>{pos.symbol}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold truncate max-w-[140px] border border-slate-200/60 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                  {pos.stockData?.name || pos.symbol}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${stratObj.color}`}>
                                  {stratObj.label}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                  เข้า: {pos.entryDate}
                                </span>
                              </div>
                            </td>

                            {/* Prices */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                เข้า: {pos.entryPrice} {pos.stockData?.currency || investorProfile.currency}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center space-x-1">
                                <span>ตลาด: <strong>{currentP}</strong></span>
                                {pos.stockData && (
                                  <span className={`text-[10px] font-bold ${pos.stockData.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    ({pos.stockData.change >= 0 ? '+' : ''}{pos.stockData.changePercent}%)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Shares & Value */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {pos.shares.toLocaleString()} หุ้น ({weightPercent.toFixed(1)}%)
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                                {formatNumber(currentValue)} {pos.stockData?.currency || investorProfile.currency}
                              </div>
                            </td>

                            {/* P&L */}
                            <td className="py-3.5 px-3">
                              <div className={`font-black text-sm flex items-center space-x-1 ${
                                pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {pnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                <span>{pnl >= 0 ? '+' : ''}{formatNumber(pnl)}</span>
                              </div>
                              <div className={`text-[11px] font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                              </div>
                            </td>

                            {/* Target Price */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>{pos.targetPrice} (+{(((pos.targetPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(1)}%)</span>
                              </div>
                              <div className="w-24 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${progressToTarget}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] text-slate-400">
                                {targetDistance > 0 ? `อีก +${targetDistance.toFixed(1)}%` : 'ถึงเป้าหมายแล้ว'}
                              </span>
                            </td>

                            {/* Stop Loss */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-rose-600 dark:text-rose-400">
                                {pos.stopLossPrice} ({(((pos.stopLossPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(1)}%)
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                คุมความเสี่ยง: {(((currentP - pos.stopLossPrice) / currentP) * 100).toFixed(1)}%
                              </div>
                            </td>

                            {/* Margin of Safety */}
                            <td className="py-3.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                (pos.stockData?.marginOfSafety || 0) > 15 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                (pos.stockData?.marginOfSafety || 0) > 0 ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' :
                                'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                              }`}>
                                +{pos.stockData?.marginOfSafety ?? 12}% MOS
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => handleOpenCloseModal(pos)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-xs cursor-pointer"
                                  title="ปิดสถานะ (Take Profit / Stop Loss)"
                                >
                                  ปิดสถานะ
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`คุณต้องการลบ ${pos.symbol} ออกจากพอร์ตใช่หรือไม่?`)) {
                                      onDeletePosition(pos.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="ลบรายการ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI MASTER ANALYST AUDIT & CRITIQUE (NEW CORE MODULE) */}
      {activeTab === 'ai-audit' && (
        <div className="space-y-6">
          {userAudit ? (
            <div className="space-y-6">
              {/* Audit Header Banner */}
              <div className="bg-gradient-to-br from-indigo-950 via-[#121218] to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40">
                        <Bot className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Chief Investment Officer Audit Report
                          </span>
                          <span className="text-xs text-zinc-400">
                            เกณฑ์เงินลงทุน {formatNumber(investorProfile.capital)} {investorProfile.currency} • เป้าหมาย +{investorProfile.targetReturnPercent}%
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                          ผลการวินิจฉัยและวิเคราะห์โครงสร้างพอร์ตโดย AI อัจฉริยะ
                        </h2>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl bg-black/20 p-4 rounded-2xl border border-white/5">
                      {userAudit.executiveVerdict}
                    </p>
                  </div>

                  {/* Grade & Score Card */}
                  <div className="flex items-center md:flex-col justify-center bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shrink-0 text-center space-y-1">
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                      Portfolio Grade
                    </div>
                    <div className="text-4xl font-black text-amber-400 drop-shadow-sm">
                      {userAudit.grade}
                    </div>
                    <div className="text-xs font-bold text-zinc-300">
                      คะแนน {userAudit.score} / 100
                    </div>
                    <button
                      onClick={handleRunAIAudit}
                      disabled={isAuditingAI}
                      className="mt-2 text-[10px] text-indigo-300 hover:text-white font-bold underline flex items-center space-x-1 justify-center"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAuditingAI ? 'animate-spin' : ''}`} />
                      <span>ประเมินใหม่</span>
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>โอกาสสำเร็จในการแตะเป้าหมาย: <strong>{userAudit.periodCompletionForecast?.probabilityOfTargetHit || 75}%</strong></span>
                    <span>•</span>
                    <span>ประมาณการผลตอบแทนเมื่อครบ Period: <strong>+{userAudit.periodCompletionForecast?.projectedEndReturnPercent || investorProfile.targetReturnPercent}%</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyAuditText}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-[11px] flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      {copiedAudit ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAudit ? 'คัดลอกแล้ว' : 'คัดลอกบทวิเคราะห์'}</span>
                    </button>

                    {onOpenAIChatWithContext && (
                      <button
                        onClick={() => onOpenAIChatWithContext('ขอคำแนะนำเชิงลึกเพิ่มเติมเกี่ยวกับการปรับปรุงพอร์ตที่ฉันจัดเองนี้')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>ถาม AI เพิ่มเติมเกี่ยวกับพอร์ตนี้</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Goal Alignment & Forecast Section */}
              <div className="bg-white dark:bg-[#121215] p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span>การวิเคราะห์ความสอดคล้องกับเป้าหมายเงินลงทุนและผลตอบแทน (Goal Alignment Diagnosis)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                  {userAudit.goalAlignmentAnalysis}
                </p>
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>คำแนะนำสำหรับช่วงเวลา Period นี้:</strong> {userAudit.periodCompletionForecast?.periodMilestoneAdvice}
                  </div>
                </div>
              </div>

              {/* Asset-by-Asset Deep Critique Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-extrabold text-sm text-slate-900 dark:text-white">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>การประเมินหุ้นและสินทรัพย์รายตัวในพอร์ต (Asset-by-Asset Critique)</span>
                  </div>
                  <span className="text-xs text-slate-400">{userAudit.assetCritiques?.length || 0} รายการ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userAudit.assetCritiques?.map((critique, idx) => {
                    const pos = positions.find((p) => p.symbol === critique.symbol);
                    const isStar = critique.status === 'STAR_ASSET';
                    const isRisk = critique.status === 'HIGH_RISK';
                    const isMonitor = critique.status === 'MONITOR_CLOSELY';

                    return (
                      <div 
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all ${
                          isStar ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' :
                          isRisk ? 'bg-rose-50/30 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20' :
                          isMonitor ? 'bg-amber-50/30 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' :
                          'bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {critique.symbol}
                            </span>
                            {pos && (
                              <span className="text-[11px] text-slate-500 font-semibold">
                                ({pos.stockData?.name})
                              </span>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isStar ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                            isRisk ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' :
                            isMonitor ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                            'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                          }`}>
                            {isStar ? '⭐ หุ้นเด่นตัวหลัก (Star Asset)' :
                             isRisk ? '⚠️ จุดเสี่ยงต้องเฝ้าระวัง (High Risk)' :
                             isMonitor ? '👀 ติดตามใกล้ชิด (Monitor)' :
                             '🛡️ เสาหลักพอร์ต (Solid Core)'}
                          </span>
                        </div>

                        {pos && (
                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-zinc-900/60 text-[11px] mb-3">
                            <div>
                              <span className="text-slate-400 block text-[10px]">ราคาเข้า / ปัจจุบัน</span>
                              <strong className="text-slate-800 dark:text-zinc-200">{pos.entryPrice} / {pos.stockData?.currentPrice || pos.entryPrice}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">เป้าหมาย / Stop</span>
                              <strong className="text-slate-800 dark:text-zinc-200">{pos.targetPrice} / {pos.stopLossPrice}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Margin of Safety</span>
                              <strong className="text-emerald-600 dark:text-emerald-400">+{pos.stockData?.marginOfSafety ?? 10}%</strong>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                          {critique.verdict}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths, Risks, and Actionable Optimizations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Strengths */}
                <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-xs space-y-3">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>จุดแข็งของพอร์ต (Strengths)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                    {userAudit.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks & Blindspots */}
                <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-amber-200 dark:border-amber-500/20 shadow-xs space-y-3">
                  <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ความเสี่ยงและจุดบอด (Risks & Blindspots)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                    {userAudit.risksAndBlindspots.map((risk, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Optimizations */}
                <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 shadow-xs space-y-3">
                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
                    <Compass className="w-4 h-4" />
                    <span>คำแนะนำปรับพอร์ต (Optimization Plan)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-zinc-300">
                    {userAudit.actionableOptimization.map((opt, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                ยังไม่ได้ทำการวิเคราะห์พอร์ตด้วย AI Master Analyst
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                กดปุ่มด้านล่างเพื่อให้ AI ทำการประเมินโครงสร้างพอร์ตของคุณเทียบกับเงินลงทุนและเป้าหมายผลตอบแทน พร้อมให้เกรดและคำแนะนำปรับพอร์ต
              </p>
              <button
                onClick={handleRunAIAudit}
                disabled={positions.length === 0}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 mx-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>เริ่มการวินิจฉัยพอร์ตด้วย AI เดี๋ยวนี้</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERIOD COMPLETION & PERFORMANCE KPIS (NEW CORE MODULE) */}
      {activeTab === 'period-kpis' && (
        <div className="space-y-6">
          {/* Period Timeline & Backtest Control Card */}
          <div className="bg-white dark:bg-[#121215] p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>กรอบเวลาการลงทุน & ระบบจำลองย้อนหลัง (Period Timeline & Backtest Engine)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  ช่วงเวลาติดตาม: <strong>{periodKPIs.periodLabel}</strong> (วันที่เริ่มต้น: {periodKPIs.startDate} ถึง {periodKPIs.endDate})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPeriodModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>ตั้งค่า Period & Backtest</span>
                </button>
              </div>
            </div>

            {/* Quick Switchers: Duration & Backtest Presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
              {/* Duration Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  <span>เลือกระยะเวลา Period:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: '1_3_MONTHS', label: '1 - 3 เดือน (90 วัน)' },
                      { id: '3_6_MONTHS', label: '3 - 6 เดือน (180 วัน)' },
                      { id: '6_12_MONTHS', label: '6 - 12 เดือน (365 วัน)' },
                      { id: '1_3_YEARS', label: '1 - 3 ปี (730 วัน)' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleUpdatePeriodDuration(p.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        investorProfile.period === p.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Backtest Start Date Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center space-x-1">
                  <RotateCcw className="w-3 h-3 text-emerald-500" />
                  <span>ย้อนวันเริ่มต้นทดสอบความน่าเชื่อถือ (Backtest):</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(0)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold cursor-pointer"
                  >
                    เริ่มวันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(30)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-[11px] font-semibold cursor-pointer"
                  >
                    ย้อน 1 ด.
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(90)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-[11px] font-semibold cursor-pointer"
                  >
                    ย้อน 3 ด.
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(180)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-[11px] font-semibold cursor-pointer"
                  >
                    ย้อน 6 ด.
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(365)}
                    className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold cursor-pointer"
                  >
                    ย้อน 1 ปี
                  </button>
                  <input
                    type="date"
                    value={periodStartDate}
                    onChange={(e) => handleCustomStartDateChange(e.target.value)}
                    className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#18181B] text-[11px] font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Backtest Explainer Banner */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-start space-x-2.5 text-xs text-indigo-900 dark:text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold text-[12px]">💡 ทำไมต้องย้อนวันที่ทดสอบ (Backtest Timeline Simulation)?</span>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  คุณสามารถย้อนวันเริ่มต้นพอร์ตไปในอดีต (เช่น 3 เดือน หรือ 1 ปีที่แล้ว) เพื่อพิสูจน์ความน่าเชื่อถือของระบบ AI และวินัยตาม Margin of Safety ว่า หากถือครองสินทรัพย์ตามสัดส่วนนี้มาจนถึงปัจจุบัน พอร์ตจะทำผลงานได้ตามเกรดและเป้าหมายที่ตั้งไว้จริงหรือไม่ ก่อนตัดสินใจลงเงินจริงในตลาด
                </p>
              </div>
            </div>

            {/* Time progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span>ผ่านไปแล้ว {periodKPIs.daysElapsed} วัน ({periodKPIs.progressPercent}%)</span>
                <span>{periodKPIs.isPeriodEnded ? '🏁 ครบกำหนดระยะเวลา' : `เหลืออีก ${periodKPIs.daysRemaining} วัน`}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    periodKPIs.isPeriodEnded 
                      ? 'bg-emerald-500' 
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, periodKPIs.progressPercent))}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Core Period KPIs 6-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* KPI 1: Target Achievement Rate */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold flex items-center justify-between">
                <span>1. อัตราความสำเร็จสู่เป้าหมาย (Target Achievement)</span>
                <Target className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {periodKPIs.targetAchievementRate}%
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                เทียบผลตอบแทนจริง {periodKPIs.currentReturnPercent}% กับเป้าหมาย +{periodKPIs.targetReturnPercent}% ในรอบ Period
              </p>
            </div>

            {/* KPI 2: Projected End Value */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold flex items-center justify-between">
                <span>2. ประมาณการมูลค่าเมื่อครบ Period</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {formatNumber(periodKPIs.projectedEndValue)} <span className="text-xs text-slate-400 font-normal">{investorProfile.currency}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                คาดการณ์ผลตอบแทนสิ้นสุดที่ <strong>+{periodKPIs.projectedEndReturn}%</strong> บนสมมติฐานวินัยตามแผน
              </p>
            </div>

            {/* KPI 3: Sharpe & Calmar Ratio */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold flex items-center justify-between">
                <span>3. Sharpe Ratio & Calmar Ratio</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {periodKPIs.sharpeRatio} <span className="text-xs text-slate-400 font-normal">/ Calmar {periodKPIs.calmarRatio}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                ดัชนีวัดความคุ้มค่าของผลตอบแทนส่วนเพิ่มเทียบกับความผันผวนของพอร์ต (เกณฑ์ดี &gt; 1.0)
              </p>
            </div>

            {/* KPI 4: Max Drawdown & Beta */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold flex items-center justify-between">
                <span>4. คุม Max Drawdown & Portfolio Beta</span>
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                -{periodKPIs.estimatedMaxDrawdown}% <span className="text-xs text-slate-400 font-normal">(Beta {periodKPIs.portfolioBeta})</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                ระดับการจำกัดการขาดทุนสูงสุดด้วยจุด Stop Loss ป้องกันความเสี่ยงเงินต้น
              </p>
            </div>

            {/* KPI 5: Average Margin of Safety */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold flex items-center justify-between">
                <span>5. ส่วนเผื่อความปลอดภัยเฉลี่ย (Avg MOS)</span>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                +{periodKPIs.averageMarginOfSafety}%
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                ราคาเข้าซื้อเทียบกับมูลค่าที่เหมาะสม (Fair Value) เพื่อความปลอดภัยระยะยาว
              </p>
            </div>

            {/* KPI 6: Execution & Win Rate */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-bold flex items-center justify-between">
                <span>6. อัตราการเทรดตามแผน (Win Rate)</span>
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {periodKPIs.winRate}% <span className="text-xs text-slate-400 font-normal">({skillMetrics.disciplineScore}% วินัย)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                ความแม่นยำในการเทรดและวินัยในการทำตามแผน Take Profit / Stop Loss
              </p>
            </div>
          </div>

          {/* Stress Test Simulation & Scenarios */}
          <div className="bg-white dark:bg-[#121215] p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>สถานการณ์จำลองเมื่อครบกำหนดระยะเวลา (Period Completion Scenario Simulation)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bull Case */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>🚀 กรณีตลาดขาขึ้นเด่น (Bull Case)</span>
                  <span>+{periodKPIs.stressTest.bullCaseReturn}%</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {formatNumber(periodKPIs.stressTest.bullCaseValue)} {investorProfile.currency}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  หุ้นทุกตัววิ่งชน Target Price เต็มจำนวน และไม่มีตัวไหนหลุด Stop Loss
                </p>
              </div>

              {/* Base Case */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                  <span>🎯 กรณีปกติบรรลุเป้าหมาย (Base Case)</span>
                  <span>+{periodKPIs.stressTest.baseCaseReturn}%</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {formatNumber(periodKPIs.stressTest.baseCaseValue)} {investorProfile.currency}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  ผลตอบแทนเติบโตตามเป้าหมายผลตอบแทนหลักที่ตั้งไว้ในเงื่อนไขการลงทุน
                </p>
              </div>

              {/* Bear Case */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <div className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center justify-between">
                  <span>🛡️ กรณีตลาดปรับฐานหนัก (Bear Case)</span>
                  <span>{periodKPIs.stressTest.bearCaseReturn}%</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {formatNumber(periodKPIs.stressTest.bearCaseValue)} {investorProfile.currency}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                  ตลาดร่วงหลุดแนวรับ แต่ความเสี่ยงถูกตัดขาดทุนที่ Stop Loss ทำให้จำกัดความเสียหายได้
                </p>
              </div>
            </div>
          </div>

          {/* Export & Copy Period Summary */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCopyKPIReport}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
            >
              {copiedKPIReport ? <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKPIReport ? 'คัดลอกรายงานตัวชี้วัดแล้ว' : '📋 ส่งออก / คัดลอกรายงานตัวชี้วัดครบ Period'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: CLOSED TRADES JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {closedTrades.length === 0 ? (
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 dark:text-zinc-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">ยังไม่มีประวัติการปิดสถานะ</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                เมื่อคุณกด "ปิดสถานะ" หุ้นในพอร์ต ระบบจะบันทึกผลกำไร/ขาดทุนจริง พร้อมคำนวณ Win Rate และวิเคราะห์พัฒนาการให้โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#18181B] text-slate-500 dark:text-zinc-400 font-bold uppercase border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">สินทรัพย์</th>
                      <th className="py-3 px-3">วันที่เข้า / ออก</th>
                      <th className="py-3 px-3">ราคาเข้า / ราคาปิด</th>
                      <th className="py-3 px-3">ผลกำไรจริง (Realized P&L)</th>
                      <th className="py-3 px-3">เหตุผลการปิด (Exit Reason)</th>
                      <th className="py-3 px-4">บันทึกบทเรียน (Journal Notes)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                    {closedTrades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                          <span>{trade.symbol}</span>
                          <span className="block text-[10px] font-normal text-slate-400">{trade.stockName}</span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-300 text-[11px]">
                          <div>เข้า: {trade.entryDate}</div>
                          <div>ออก: {trade.exitDate}</div>
                        </td>
                        <td className="py-3.5 px-3 font-semibold">
                          <div>เข้า: {trade.entryPrice}</div>
                          <div>ออก: {trade.exitPrice}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className={`font-black text-sm ${trade.isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {trade.isWin ? '+' : ''}{formatNumber(trade.realizedPnL)} ({trade.isWin ? '+' : ''}{trade.realizedPnLPercent.toFixed(2)}%)
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            trade.exitReason === 'TARGET_HIT' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                            trade.exitReason === 'STOP_LOSS' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' :
                            'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}>
                            {trade.exitReason === 'TARGET_HIT' ? '🎯 ถึงเป้าหมายกำไร (TP)' :
                             trade.exitReason === 'STOP_LOSS' ? '🛡️ ตัดขาดทุนตามวินัย (SL)' :
                             '🖐️ ปิดสถานะตามดุลยพินิจ'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 text-[11px]">
                          {trade.journalNotes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: USER SKILL DEVELOPMENT & AI COACH */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Skill Diagnostic Radar / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: Discipline & Risk Management */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>1. วินัยและการคุมความเสี่ยง</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {skillMetrics.disciplineScore}<span className="text-xs text-slate-400 font-semibold">/100</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                วัดจากการตั้งจุด Stop Loss ทุกครั้ง, อัตราส่วน R:R ที่เหมาะสม, และการไม่ปล่อยให้ขาดทุนเกิน 2% ของพอร์ต
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 font-semibold">
                ✓ Risk-Reward เฉลี่ย: 1:{skillMetrics.avgRiskRewardRatio}
              </div>
            </div>

            {/* Pillar 2: Win Rate & Target Accuracy */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                <Target className="w-4 h-4 text-amber-500" />
                <span>2. ความแม่นยำในการทำกำไร</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {skillMetrics.winRate}%
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                อัตราส่วนไม้ที่ทำกำไรสำเร็จ และอัตราการวิ่งชน Target Profit ที่วางแผนไว้ล่วงหน้า
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 font-semibold">
                ✓ อัตราชนเป้ากำไร: {skillMetrics.targetHitRate}%
              </div>
            </div>

            {/* Pillar 3: Diversification Health */}
            <div className="bg-white dark:bg-[#121215] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                <PieChart className="w-4 h-4 text-indigo-500" />
                <span>3. การกระจายความเสี่ยงพอร์ต</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {skillMetrics.diversificationScore}<span className="text-xs text-slate-400 font-semibold">/100</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                ความสมดุลของการแบ่งสัดส่วนเงินลงทุน ไม่ Overweight หุ้นตัวเดียวจนเป็นภัยต่อพอร์ต
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 font-semibold">
                ✓ จำนวนสินทรัพย์ในพอร์ต: {positions.length} ตัว
              </div>
            </div>
          </div>

          {/* AI Skill Coach Diagnostic Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 via-[#121215] to-[#121215] border border-indigo-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>AI Investment Skill Coach — คำแนะนำเพื่อพัฒนาศักยภาพ</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  ระบบวิเคราะห์พฤติกรรมการจัดพอร์ตและเทรดของคุณแบบเรียลไทม์
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-100 leading-relaxed">
              {skillMetrics.aiCoachAdvice}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="text-xs font-black text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>จุดแข็งของคุณ (Your Strengths)</span>
                </div>
                <ul className="space-y-1 text-xs text-zinc-300 list-disc list-inside">
                  {skillMetrics.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Growth Areas */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="text-xs font-black text-amber-400 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>โอกาสพัฒนาสู่ระดับถัดไป (Growth Areas)</span>
                </div>
                <ul className="space-y-1 text-xs text-zinc-300 list-disc list-inside">
                  {skillMetrics.growthAreas.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD POSITION MODAL (CUSTOM SYMBOL & PRESET DATABASE) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    เพิ่มหุ้นลงพอร์ตลงทุนของฉัน
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    กำหนดสินทรัพย์ สัดส่วน และแผนเทรดเพื่อส่งให้ AI วิเคราะห์
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl">
              <button
                type="button"
                onClick={() => setAddMode('CUSTOM')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  addMode === 'CUSTOM'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>✍️ พิมพ์ชื่อหุ้นเอง</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('PRESET')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  addMode === 'PRESET'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>🔍 เลือกจากฐานข้อมูล ({allStocks.length})</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* MODE 1: CUSTOM STOCK ENTRY */}
              {addMode === 'CUSTOM' && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  {/* Symbol & Market with Autocomplete */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2 relative">
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-slate-700 dark:text-zinc-300">
                          สัญลักษณ์หุ้น (Ticker): <span className="text-rose-500">*</span>
                        </label>
                        {allStocks.some((s) => s.symbol.toUpperCase() === customSymbol.toUpperCase().trim()) && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-0.5 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                            <Check className="w-3 h-3" />
                            <span>ซิงค์ข้อมูลแล้ว</span>
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={customSymbol}
                          onChange={(e) => handleSymbolInputChange(e.target.value)}
                          onFocus={() => setIsSymbolDropdownOpen(customSymbol.trim().length > 0)}
                          placeholder="เช่น CPALL, PTT, DELTA, SCB, NVDA"
                          className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white font-extrabold text-sm uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                        {customSymbol.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomSymbol('');
                              setIsSymbolDropdownOpen(false);
                            }}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Autocomplete Dropdown List */}
                      {isSymbolDropdownOpen && customSymbol.trim().length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-[#18181B] border border-indigo-200 dark:border-indigo-500/30 rounded-2xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                          {(() => {
                            const query = customSymbol.toUpperCase().trim();
                            const matches = allStocks.filter(
                              (s) =>
                                s.symbol.toUpperCase().includes(query) ||
                                s.name.toLowerCase().includes(query.toLowerCase())
                            );

                            if (matches.length === 0) {
                              return (
                                <div className="p-3 text-center text-slate-500 dark:text-zinc-400 text-xs">
                                  <span>✨ ไม่พบในฐานข้อมูล — สามารถใช้ <strong className="text-indigo-600 dark:text-indigo-400">{customSymbol}</strong> เป็นหุ้นกำหนดเองได้ทันที</span>
                                </div>
                              );
                            }

                            return matches.slice(0, 6).map((match) => (
                              <div
                                key={match.symbol}
                                onClick={() => applyStockToForm(match)}
                                className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer flex items-center justify-between transition-colors"
                              >
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                                      {match.symbol}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium">
                                      {match.market}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                      {match.sector}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[200px]">
                                    {match.name}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                                    {formatNumber(match.currentPrice)} {match.currency}
                                  </div>
                                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                    MOS +{match.marginOfSafety}%
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        ตลาด:
                      </label>
                      <select
                        value={customMarket}
                        onChange={(e) => setCustomMarket(e.target.value as any)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white font-bold"
                      >
                        <option value="SET">SET (หุ้นไทย)</option>
                        <option value="mai">mai (หุ้นไทย)</option>
                        <option value="US">US (สหรัฐฯ)</option>
                        <option value="Global">Global</option>
                        <option value="FOREX">FOREX</option>
                      </select>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      ชื่อบริษัท / สินทรัพย์:
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="เช่น ธนาคารกสิกรไทย จำกัด (มหาชน)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  {/* Sector & Currency */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        หมวดอุตสาหกรรม (Sector):
                      </label>
                      <input
                        type="text"
                        value={customSector}
                        onChange={(e) => setCustomSector(e.target.value)}
                        placeholder="เช่น Banking, Energy, Tech"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        สกุลเงิน:
                      </label>
                      <select
                        value={customCurrency}
                        onChange={(e) => setCustomCurrency(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white font-bold"
                      >
                        <option value="THB">THB (บาท)</option>
                        <option value="USD">USD (ดอลลาร์)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: PRESET DATABASE SELECTION */}
              {addMode === 'PRESET' && (
                <div className="space-y-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={stockSearchFilter}
                      onChange={(e) => setStockSearchFilter(e.target.value)}
                      placeholder="พิมพ์ค้นหาชื่อย่อ หรือชื่อบริษัท (เช่น CPALL, DELTA, BDMS, NVDA)..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#18181B] text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  {/* Market Filter Chips */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                    {['ALL', 'SET', 'mai', 'US', 'FOREX'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPresetCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap cursor-pointer ${
                          presetCategoryFilter === cat
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {cat === 'ALL' ? 'ทั้งหมด' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Stock List dropdown / selection */}
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {allStocks
                      .filter((s) => {
                        const matchText =
                          s.symbol.toLowerCase().includes(stockSearchFilter.toLowerCase()) ||
                          s.name.toLowerCase().includes(stockSearchFilter.toLowerCase());
                        const matchCat =
                          presetCategoryFilter === 'ALL' || s.market === presetCategoryFilter;
                        return matchText && matchCat;
                      })
                      .map((stock) => {
                        const isSelected = selectedStockSymbol === stock.symbol;
                        return (
                          <div
                            key={stock.symbol}
                            onClick={() => handleStockSelectInModal(stock.symbol)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 text-indigo-600 dark:text-indigo-300'
                                : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-800 dark:text-zinc-200'
                            }`}
                          >
                            <div>
                              <div className="font-extrabold text-xs flex items-center space-x-1.5">
                                <span>{stock.symbol}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium">
                                  {stock.market}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[240px]">
                                {stock.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-extrabold text-xs">
                                {formatNumber(stock.currentPrice)} {stock.currency}
                              </div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                MOS +{stock.marginOfSafety}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Price & Shares */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700 dark:text-zinc-300">
                        ราคาที่เข้าซื้อ (Entry Price): <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSyncPriceTargets}
                        title="คำนวณเป้ากำไร +15% และจุดคัท -7% ตามราคาเข้าซื้อนี้"
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>คำนวณ TP/SL</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={entryPrice}
                      onChange={(e) => {
                        const newP = Number(e.target.value);
                        setEntryPrice(newP);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#18181B] text-slate-900 dark:text-white font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                      จำนวนหุ้น (Shares / Lots): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={shares}
                      onChange={(e) => setShares(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#18181B] text-slate-900 dark:text-white font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Target Price & Stop Loss with dynamic calculations */}
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  {/* TP */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-emerald-600 dark:text-emerald-400">
                        🎯 กำไรเป้าหมาย (TP):
                      </label>
                      {entryPrice > 0 && targetPrice > entryPrice && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                          +{(((targetPrice - entryPrice) / entryPrice) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#18181B] text-emerald-600 dark:text-emerald-400 font-bold"
                      required
                    />
                    {/* Quick TP presets */}
                    <div className="flex items-center space-x-1 mt-1.5 overflow-x-auto">
                      <span className="text-[9px] text-slate-400">ลัด:</span>
                      {[10, 15, 20, 25, 30].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleSetTargetPercent(pct)}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        >
                          +{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SL */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-rose-600 dark:text-rose-400">
                        🛡️ จุดตัดขาดทุน (SL):
                      </label>
                      {entryPrice > 0 && stopLossPrice < entryPrice && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded-md">
                          -{(((entryPrice - stopLossPrice) / entryPrice) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#18181B] text-rose-600 dark:text-rose-400 font-bold"
                      required
                    />
                    {/* Quick SL presets */}
                    <div className="flex items-center space-x-1 mt-1.5 overflow-x-auto">
                      <span className="text-[9px] text-slate-400">ลัด:</span>
                      {[5, 7, 10, 12].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleSetStopLossPercent(pct)}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer"
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk:Reward ratio pill */}
                {entryPrice > 0 && targetPrice > entryPrice && stopLossPrice < entryPrice && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-zinc-400">อัตราส่วนผลตอบแทนต่อความเสี่ยง (Risk:Reward Ratio):</span>
                    <span className="font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      1 : {((targetPrice - entryPrice) / (entryPrice - stopLossPrice)).toFixed(2)} R:R
                    </span>
                  </div>
                )}
              </div>

              {/* Strategy Tag */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  กลยุทธ์การลงทุน (Strategy Tag):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STRATEGY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStrategyTag(opt.id)}
                      className={`p-2 rounded-xl text-[11px] font-bold text-left border transition-all cursor-pointer ${
                        strategyTag === opt.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thesis Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  เหตุผลในการเข้าซื้อ (Investment Thesis):
                </label>
                <textarea
                  value={thesisNotes}
                  onChange={(e) => setThesisNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#18181B] text-slate-900 dark:text-white font-medium"
                  placeholder="เช่น ราคาย่อลงมาที่แนวรับสำคัญ ผลประกอบการมีแนวโน้มเติบโตต่อเนื่อง"
                />
              </div>

              {/* Summary of cost */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 flex justify-between items-center text-xs font-bold border border-slate-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 dark:text-zinc-400">เงินลงทุนรวมสินทรัพย์นี้:</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 font-extrabold text-[11px]">
                    {((Number(entryPrice) * Number(shares) / (investorProfile.capital || 1)) * 100).toFixed(1)}% ของเงินทุน
                  </span>
                </div>
                <span className="text-slate-900 dark:text-white text-sm">
                  {formatNumber(Number(entryPrice) * Number(shares))} {addMode === 'CUSTOM' ? customCurrency : investorProfile.currency}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึก {addMode === 'CUSTOM' ? (customSymbol || 'หุ้น') : selectedStockSymbol} ลงพอร์ต</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLOSE POSITION MODAL */}
      {selectedClosePosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                ปิดสถานะการเทรด — {selectedClosePosition.symbol}
              </h3>
              <button
                onClick={() => setSelectedClosePosition(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  ราคาที่ปิดสถานะจริง (Exit Price):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exitPriceInput}
                  onChange={(e) => setExitPriceInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#18181B] text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  ผลการตัดสินใจปิดสถานะ:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExitReasonInput('TARGET_HIT')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      exitReasonInput === 'TARGET_HIT'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600'
                    }`}
                  >
                    🎯 ถึงเป้ากำไร
                  </button>
                  <button
                    type="button"
                    onClick={() => setExitReasonInput('STOP_LOSS')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      exitReasonInput === 'STOP_LOSS'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/20 text-rose-600'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600'
                    }`}
                  >
                    🛡️ ตัดขาดทุน SL
                  </button>
                  <button
                    type="button"
                    onClick={() => setExitReasonInput('MANUAL_EXIT')}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      exitReasonInput === 'MANUAL_EXIT'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600'
                    }`}
                  >
                    🖐️ ปิดตามดุลยพินิจ
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  บทเรียนและการบันทึก (Trading Journal Note):
                </label>
                <textarea
                  value={exitNotesInput}
                  onChange={(e) => setExitNotesInput(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#18181B] text-slate-900 dark:text-white"
                  placeholder="เช่น ทำตามแผน TP ได้ครบ หรือขายเพราะปัจจัยพื้นฐานเปลี่ยน"
                />
              </div>

              {/* Profit Calculation Preview */}
              {(() => {
                const pnl = (exitPriceInput - selectedClosePosition.entryPrice) * selectedClosePosition.shares;
                const pnlPct = selectedClosePosition.entryPrice > 0 
                  ? ((exitPriceInput - selectedClosePosition.entryPrice) / selectedClosePosition.entryPrice) * 100 
                  : 0;
                return (
                  <div className={`p-3 rounded-xl border ${pnl >= 0 ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-500/20 text-rose-600'} font-bold flex justify-between items-center`}>
                    <span>ผลลัพธ์สุทธิ:</span>
                    <span>{pnl >= 0 ? '+' : ''}{formatNumber(pnl)} ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
                  </div>
                );
              })()}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClosePosition(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  ยืนยันปิดสถานะ & บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVER-BUDGET RESOLUTION MODAL */}
      {isOverBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121215] border-2 border-rose-400 dark:border-rose-700/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-rose-500 text-white shadow-md">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    แจ้งเตือน: เงินลงทุนไม่พอสำหรับพอร์ตนี้
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    ยอดซื้อหุ้นรวมเกินวงเงินลงทุนที่ตั้งไว้ {formatNumber(overBudgetAmount)} {investorProfile.currency}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOverBudgetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown Comparison Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                <span>งบเงินลงทุนที่คุณตั้งไว้:</span>
                <strong className="text-slate-900 dark:text-white text-sm font-black">
                  {formatNumber(investorProfile.capital)} {investorProfile.currency}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                <span>มูลค่าหุ้นรวมในตาราง:</span>
                <strong className="text-rose-600 dark:text-rose-400 text-sm font-black">
                  {formatNumber(matrixTotalCost)} {investorProfile.currency}
                </strong>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-rose-600 dark:text-rose-400 font-black">
                <span>ยอดเงินขาด (Over Budget):</span>
                <span>+{formatNumber(overBudgetAmount)} {investorProfile.currency} (+{overBudgetPercent}%)</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                เลือกวิธีที่คุณต้องการดำเนินการ:
              </div>

              {/* Option 1: AI Auto-fit shares to budget */}
              <button
                type="button"
                onClick={() => handleAIAutoFitShares(investorProfile.capital)}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md flex items-center justify-between transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Wand2 className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-sm font-black">1. ให้ AI ปรับลดจำนวนหุ้นให้พอดีงบ</div>
                    <div className="text-[11px] text-indigo-100 font-normal">
                      คำนวณและปรับลดหุ้นทุกตัวให้รวมแล้วไม่เกิน {formatNumber(investorProfile.capital)} ฿ พอดี
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {/* Option 2: Increase Capital */}
              <button
                type="button"
                onClick={handleFixByIncreasingCapital}
                className="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-bold text-xs border border-slate-200 dark:border-zinc-700 flex items-center justify-between transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-black">2. ปรับเพิ่มวงเงินลงทุนเป็น {formatNumber(matrixTotalCost)} ฿</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
                      เพิ่มงบเงินทุนในพอร์ตให้ตรงตามมูลค่าหุ้นที่เลือกซื้อ
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {/* Option 3: Reset to 50,000 THB */}
              <button
                type="button"
                onClick={handleSetBudget50k}
                className="w-full p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-500/30 flex items-center justify-between transition-all cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">🎯</span>
                  <span>3. ตั้งงบ 50,000 บาท & ให้ AI ปรับพอร์ตทันที</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => setIsOverBudgetModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer font-bold"
              >
                ย้อนกลับไปแก้ไขหุ้นในตารางเอง
              </button>
              <button
                type="button"
                onClick={() => handleSaveAndExecuteMatrix(true)}
                className="text-xs text-rose-500 hover:underline cursor-pointer font-semibold"
                title="ยืนยันบันทึกทั้งๆ ที่เกินงบ"
              >
                ยืนยันบันทึกแบบเกินงบ &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Dedicated Period & Timeline Backtest Simulator */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>ตั้งค่าระยะเวลาพอร์ต & จำลองย้อนหลัง (Backtest)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    กำหนดกรอบเวลาการลงทุน หรือย้อนวันเริ่มต้นเพื่อทดสอบความน่าเชื่อถือของระบบ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPeriodModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Section 1: Period Duration Options */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-500" />
                  <span>1. เลือกระยะเวลาการลงทุน (Investment Horizon)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      {
                        id: '1_3_MONTHS',
                        label: '1 - 3 เดือน',
                        days: '90 วัน',
                        desc: 'สวิงเทรด / เก็งกำไรระยะสั้นรอบไตรมาส',
                        icon: '⚡',
                      },
                      {
                        id: '3_6_MONTHS',
                        label: '3 - 6 เดือน',
                        days: '180 วัน',
                        desc: 'เกาะรอบผลประกอบการ & โมเมนตัมธุรกิจ',
                        icon: '🎯',
                      },
                      {
                        id: '6_12_MONTHS',
                        label: '6 - 12 เดือน',
                        days: '365 วัน',
                        desc: 'กลยุทธ์เติบโตประจำปี & รับเงินปันผล',
                        icon: '💎',
                      },
                      {
                        id: '1_3_YEARS',
                        label: '1 - 3 ปี',
                        days: '730 วัน',
                        desc: 'ลงทุนทบต้นระยะยาว (Compound Value)',
                        icon: '🚀',
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleUpdatePeriodDuration(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        investorProfile.period === item.id
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-white shadow-xs'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs flex items-center space-x-1.5">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold text-slate-500">
                          {item.days}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-tight">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Start Date & Backtest Simulator */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <label className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>2. วันที่เริ่มต้นพอร์ต / ย้อนวันที่ทดสอบ (Backtest Start Date)</span>
                </label>

                {/* Preset Jump Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(0)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40 cursor-pointer"
                  >
                    🟢 เริ่มวันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(30)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    ย้อนหลัง 1 เดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(90)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    ย้อนหลัง 3 เดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(180)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer"
                  >
                    ย้อนหลัง 6 เดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetBacktestStartDate(365)}
                    className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800/40 cursor-pointer"
                  >
                    ย้อนหลัง 1 ปี (Backtest)
                  </button>
                </div>

                {/* Custom Date Input */}
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-xs text-slate-500 font-semibold">หรือระบุวันที่เจาะจง:</span>
                  <input
                    type="date"
                    value={periodStartDate}
                    onChange={(e) => handleCustomStartDateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 3: Live Period Simulation Results */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                  <span>ผลลัพธ์การคำนวณไทม์ไลน์ (Timeline Status):</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px]">
                    {periodKPIs.isPeriodEnded ? '🏁 ครบกำหนดรอบแล้ว' : 'กำลังดำเนินการ'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200/60 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block">วันเริ่ม</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{periodKPIs.startDate}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200/60 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block">วันสิ้นสุด</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{periodKPIs.endDate}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200/60 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block">ผ่านไปแล้ว</span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{periodKPIs.daysElapsed} วัน ({periodKPIs.progressPercent}%)</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200/60 dark:border-zinc-700">
                    <span className="text-[10px] text-slate-400 block">เหลือเวลา</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{periodKPIs.daysRemaining} วัน</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(3, periodKPIs.progressPercent))}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                  <span>เกรด Milestone: <strong className="text-indigo-600 dark:text-indigo-400">{periodKPIs.milestoneGrade}</strong></span>
                  <span>ความสำเร็จเป้าหมาย: <strong className="text-emerald-600">{periodKPIs.targetAchievementRate}%</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                ข้อมูลบันทึกและคำนวณผลอัตโนมัติแบบเรียลไทม์
              </span>
              <button
                type="button"
                onClick={() => setIsPeriodModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                เสร็จสิ้น / บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
