import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  ShieldAlert, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sliders, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Bot,
  ExternalLink,
  Flame,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Users,
  Info,
  Trash2,
  Calendar,
  Timer,
  Sun,
  Moon,
  Coffee,
  PlayCircle,
  Table,
  Copy
} from 'lucide-react';
import { 
  StockData, 
  DayTradePortfolio, 
  DayTradeSetup, 
  DayTradeTimeframe,
  UserPosition
} from '../types';
import { generateDayTradeSetup, calculateDayTradeIndicators } from '../utils/dayTradeEngine';
import { getSetPriceStep } from '../utils/priceSyncEngine';
import { copyToClipboard } from '../utils/clipboardHelper';
import { AddCustomDayTradeStockModal } from './AddCustomDayTradeStockModal';
import { TrafficStatusBadge } from './TrafficStatusBadge';
import { AntiStopHuntShield } from './AntiStopHuntShield';

interface DayTradeTerminalProps {
  dayTradePortfolio: DayTradePortfolio;
  allStocks: StockData[];
  onOpenSetupModal: () => void;
  onSelectStockForDeepAnalysis: (stock: StockData) => void;
  onExecuteTrade: (plan: {
    stock: StockData;
    entryPrice: number;
    shares: number;
    stopLossPrice: number;
    targetPrice: number;
    thesis: string;
  }) => void;
  onOpenAIChatWithStock: (stock: StockData, prompt: string) => void;
  onAddStockToDayTradePortfolio: (stock: StockData, sourceOfIdea?: string) => void;
  onRemoveStockFromDayTradePortfolio?: (symbol: string) => void;
  onClearDayTradePortfolio?: () => void;
  onOpenPriceSyncModal?: () => void;
  lastSyncedTime?: Date;
  onSyncAllPrices?: () => void;
  onUpdateSingleStockPrice?: (symbol: string, newPrice: number) => void;
}

export const DayTradeTerminal: React.FC<DayTradeTerminalProps> = ({
  dayTradePortfolio,
  allStocks,
  onOpenSetupModal,
  onSelectStockForDeepAnalysis,
  onExecuteTrade,
  onOpenAIChatWithStock,
  onAddStockToDayTradePortfolio,
  onRemoveStockFromDayTradePortfolio,
  onClearDayTradePortfolio,
  onOpenPriceSyncModal,
  lastSyncedTime = new Date(),
  onSyncAllPrices,
  onUpdateSingleStockPrice,
}) => {
  const [selectedSetupSymbol, setSelectedSetupSymbol] = useState<string>(
    dayTradePortfolio.setups[0]?.symbol || allStocks[0]?.symbol || 'CPALL'
  );
  const [executedSymbols, setExecutedSymbols] = useState<string[]>([]);
  const [activeStrategyFilter, setActiveStrategyFilter] = useState<'ALL' | 'VOLUME_BREAKOUT' | 'EMA_PULLBACK' | 'RSI_BOUNCE'>('ALL');
  const [isAddCustomStockModalOpen, setIsAddCustomStockModalOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [editingPriceSymbol, setEditingPriceSymbol] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [isCopiedToExcel, setIsCopiedToExcel] = useState<boolean>(false);
  const [copyFeedbackMsg, setCopyFeedbackMsg] = useState<string>('');
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [clearToastMsg, setClearToastMsg] = useState<string>('');

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-sync effect
  useEffect(() => {
    if (!isAutoSyncEnabled || !onSyncAllPrices) return;
    const interval = setInterval(() => {
      onSyncAllPrices();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, onSyncAllPrices]);

  const handleManualSyncClick = () => {
    if (!onSyncAllPrices) return;
    setIsManualSyncing(true);
    onSyncAllPrices();
    setTimeout(() => setIsManualSyncing(false), 600);
  };

  const handleTableAdjustStep = (symbol: string, currentPrice: number, delta: number) => {
    if (!onUpdateSingleStockPrice) return;
    const step = getSetPriceStep(currentPrice);
    const newPrice = Math.max(step, Number((currentPrice + delta * step).toFixed(2)));
    onUpdateSingleStockPrice(symbol, newPrice);
  };

  const handleSaveInlinePrice = (symbol: string) => {
    if (!onUpdateSingleStockPrice || !tempPriceInput) {
      setEditingPriceSymbol(null);
      return;
    }
    const val = parseFloat(tempPriceInput);
    if (!isNaN(val) && val > 0) {
      onUpdateSingleStockPrice(symbol, val);
    }
    setEditingPriceSymbol(null);
    setTempPriceInput('');
  };

  // Helper to format date in Thai
  const formatThaiFullDate = (date: Date) => {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const thaiYear = date.getFullYear() + 543;
    return `วัน${dayName}ที่ ${dayNum} ${monthName} ${thaiYear}`;
  };

  // Helper to calculate target expiration / holding date based on timeframe
  const getHoldingHorizonText = (tf: DayTradeTimeframe, fromDate: Date) => {
    const targetDate = new Date(fromDate);
    if (tf === '1_DAY') {
      return {
        title: 'รอบเดย์เทรดจบในวัน (Intraday)',
        targetDateStr: 'วันนี้ (ก่อนเวลา 16:25 น.)',
        actionTip: 'ห้ามถือข้ามคืน ต้องปิดสถานะ/เคลียร์ออเดอร์ก่อนตลาดปิดช่วง ATC',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
      };
    } else if (tf === '2_3_DAYS') {
      targetDate.setDate(targetDate.getDate() + 3);
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const targetStr = `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear() + 543}`;
      return {
        title: 'รอบสวิงระยะสั้น 2-3 วัน',
        targetDateStr: `ถึงวันที่ ${targetStr} (ประมาณ 3 วันทำการ)`,
        actionTip: 'ถือรันเทรนด์ตาม EMA5 หากหลุดเส้นหรือครบ 3 วันให้ล็อกกำไรตามแผน',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      };
    } else {
      targetDate.setDate(targetDate.getDate() + 7);
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const targetStr = `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear() + 543}`;
      return {
        title: 'รอบสวิงประจำสัปดาห์ 1 สัปดาห์',
        targetDateStr: `ถึงวันที่ ${targetStr} (กรอบ 5-7 วันทำการ)`,
        actionTip: 'ถือตามกรอบ Wave ย่อย รันตามเส้น EMA10/25 จนกว่าจะชนเป้า TP2 หรือหลุด Stop Loss',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      };
    }
  };

  // Determine SET Trading Session
  const getMarketSessionStatus = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeVal = hours * 60 + minutes;

    // 09:30 - 09:55
    if (timeVal >= 9 * 60 + 30 && timeVal < 9 * 60 + 55) {
      return {
        sessionName: 'ช่วงก่อนเปิดตลาดเช้า (Pre-Open I)',
        status: 'PRE_OPEN',
        color: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        icon: Sun,
        note: '09:30 - 09:55 น. คำนวณราคาเปิดคาดการณ์ ATO / ดักจับหุ้นกระโดด Gap',
        isOpen: false,
      };
    }
    // 09:55 - 10:00
    if (timeVal >= 9 * 60 + 55 && timeVal < 10 * 60) {
      return {
        sessionName: 'ช่วงสุ่มเปิดตลาดเช้า (Random Open I)',
        status: 'RANDOM_OPEN',
        color: 'text-orange-400',
        badge: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
        icon: Activity,
        note: '09:55 - 10:00 น. ตลาดกำลังสุ่มเปิดทำการรอบเช้า',
        isOpen: true,
      };
    }
    // 10:00 - 12:30
    if (timeVal >= 10 * 60 && timeVal < 12 * 60 + 30) {
      return {
        sessionName: 'ตลาดเปิดทำการ: ภาคเช้า (Morning Session)',
        status: 'OPEN_MORNING',
        color: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 animate-pulse',
        icon: PlayCircle,
        note: '10:00 - 12:30 น. ช่วงการเทรดที่วอลุ่มหนาแน่นและรวดเร็วที่สุดของวัน',
        isOpen: true,
      };
    }
    // 12:30 - 14:00
    if (timeVal >= 12 * 60 + 30 && timeVal < 14 * 60) {
      return {
        sessionName: 'ช่วงพักเที่ยง (Market Intermission)',
        status: 'LUNCH_BREAK',
        color: 'text-sky-400',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
        icon: Coffee,
        note: '12:30 - 14:00 น. ตลาดปิดพักครึ่งแรก เหมาะสำหรับรีวิวและวางแผนรอบบ่าย',
        isOpen: false,
      };
    }
    // 14:00 - 14:25
    if (timeVal >= 14 * 60 && timeVal < 14 * 60 + 25) {
      return {
        sessionName: 'ช่วงก่อนเปิดตลาดบ่าย (Pre-Open II)',
        status: 'PRE_OPEN_2',
        color: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        icon: Sun,
        note: '14:00 - 14:25 น. คำนวณราคาเปิดบ่าย ATO / ดักจับกระแสเงินไหลเข้าช่วงบ่าย',
        isOpen: false,
      };
    }
    // 14:25 - 14:30
    if (timeVal >= 14 * 60 + 25 && timeVal < 14 * 60 + 30) {
      return {
        sessionName: 'ช่วงสุ่มเปิดตลาดบ่าย (Random Open II)',
        status: 'RANDOM_OPEN_2',
        color: 'text-orange-400',
        badge: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
        icon: Activity,
        note: '14:25 - 14:30 น. ตลาดกำลังสุ่มเปิดทำการรอบบ่าย',
        isOpen: true,
      };
    }
    // 14:30 - 16:30
    if (timeVal >= 14 * 60 + 30 && timeVal < 16 * 60 + 30) {
      return {
        sessionName: 'ตลาดเปิดทำการ: ภาคบ่าย (Afternoon Session)',
        status: 'OPEN_AFTERNOON',
        color: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 animate-pulse',
        icon: PlayCircle,
        note: '14:30 - 16:30 น. ช่วงเคาะทำกำไร Take Profit & เตรียมเคลียร์ไม้ Day Trade',
        isOpen: true,
      };
    }
    // 16:30 - 16:40
    if (timeVal >= 16 * 60 + 30 && timeVal < 16 * 60 + 40) {
      return {
        sessionName: 'ช่วงคำนวณราคาปิดตลาด (Call Market / ATC)',
        status: 'ATC_CLOSING',
        color: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
        icon: AlertTriangle,
        note: '16:30 - 16:40 น. สุ่มเวลาปิดตลาด ปิดการส่งคำสั่งเคาะราคาปกติ',
        isOpen: false,
      };
    }
    // Off hours
    return {
      sessionName: 'ตลาดปิดทำการแล้ว (Market Closed / Off-Hours)',
      status: 'CLOSED',
      color: 'text-slate-300',
      badge: 'bg-slate-800/80 text-slate-300 border-slate-700',
      icon: Moon,
      note: '16:40 - 09:30 น. อยู่นอกเวลาทำการตลาดหุ้นไทย เหมาะสำหรับการทำการบ้านและวางแผนวันถัดไป',
      isOpen: false,
    };
  };

  const currentSession = getMarketSessionStatus(currentTime);
  const horizonInfo = getHoldingHorizonText(dayTradePortfolio.timeframe, currentTime);

  const getTimeframeLabel = (tf: DayTradeTimeframe) => {
    switch (tf) {
      case '1_DAY':
        return { label: '1 วัน (Intraday Scalp)', badge: 'จบในวัน / ห้ามถือข้ามคืน', icon: '⚡' };
      case '2_3_DAYS':
        return { label: '2 - 3 วัน (Fast Swing)', badge: 'รอบย่อย 2-3 วัน', icon: '🎯' };
      case '1_WEEK':
        return { label: '1 สัปดาห์ (Weekly Swing)', badge: 'รอบสัปดาห์ 5-7 วัน', icon: '🚀' };
    }
  };

  const tfInfo = getTimeframeLabel(dayTradePortfolio.timeframe);

  const filteredSetups = dayTradePortfolio.setups.filter((s) => {
    if (activeStrategyFilter === 'ALL') return true;
    return s.signalType === activeStrategyFilter;
  });

  const handleCopyToExcel = async () => {
    if (filteredSetups.length === 0) {
      setCopyFeedbackMsg('⚠️ ไม่มีข้อมูลหุ้นในตารางให้คัดลอก');
      setIsCopiedToExcel(true);
      setTimeout(() => {
        setIsCopiedToExcel(false);
        setCopyFeedbackMsg('');
      }, 2500);
      return;
    }

    const headers = [
      'Symbol',
      'ชื่อบริษัท',
      'ราคาเมื่อวาน (Prev Close)',
      'ราคาล่าสุด (Last Price)',
      'เปลี่ยนแปลง (Change)',
      '% เปลี่ยนแปลง (% Change)',
      'จุดตัดขาดทุน (Stop Loss)',
      'เป้าหมายทำกำไร 1 (Target TP1)',
      'เป้าหมายทำกำไร 2 (Target TP2)',
      'Risk:Reward',
      'สัญญาณทางเทคนิค (Signal)',
      'กรอบเวลา (Timeframe)',
      'งบลงทุนจัดสรร (THB)',
      'จำนวนหุ้นแนะนำ (Shares)'
    ];

    const rows = filteredSetups.map((s) => {
      const prevClose = Number((s.stock.currentPrice - (s.stock.change || 0)).toFixed(2));
      const chgSign = (s.stock.change !== undefined && s.stock.change > 0) ? '+' : '';
      const chgPercentSign = s.stock.changePercent > 0 ? '+' : '';
      return [
        s.symbol,
        s.stock.name || s.symbol,
        prevClose.toFixed(2),
        s.stock.currentPrice.toFixed(2),
        `${chgSign}${(s.stock.change || 0).toFixed(2)}`,
        `${chgPercentSign}${s.stock.changePercent.toFixed(2)}%`,
        s.stopLossPrice.toFixed(2),
        s.targetPrice1.toFixed(2),
        s.targetPrice2 ? s.targetPrice2.toFixed(2) : '-',
        `1:${s.riskRewardRatio.toFixed(1)}`,
        s.signalType,
        dayTradePortfolio.timeframe === '1_DAY' ? '1 วัน (Intraday)' : dayTradePortfolio.timeframe === '2_3_DAYS' ? '2-3 วัน' : '1 สัปดาห์',
        s.allocatedCapital.toLocaleString(),
        s.recommendedShares.toLocaleString()
      ];
    });

    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    const success = await copyToClipboard(tsv);
    if (success) {
      setCopyFeedbackMsg(`✅ คัดลอกตาราง ${filteredSetups.length} ตัว สำเร็จ! นำไปวาง (Ctrl+V) ใน Excel / Sheets ได้ทันที`);
    } else {
      setCopyFeedbackMsg('❌ ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง');
    }
    setIsCopiedToExcel(true);
    setTimeout(() => {
      setIsCopiedToExcel(false);
      setCopyFeedbackMsg('');
    }, 3000);
  };

  const handleConfirmClearTable = () => {
    if (onClearDayTradePortfolio) {
      onClearDayTradePortfolio();
    }
    setShowClearConfirmModal(false);
    setClearToastMsg('✅ ล้างรายการหุ้นในตารางทั้งหมดเรียบร้อยแล้ว');
    setTimeout(() => setClearToastMsg(''), 3000);
  };

  const handleQuickExecute = (setup: DayTradeSetup) => {
    onExecuteTrade({
      stock: setup.stock,
      entryPrice: setup.entryPrice,
      shares: setup.recommendedShares,
      stopLossPrice: setup.stopLossPrice,
      targetPrice: setup.targetPrice1,
      thesis: `Day Trade (${tfInfo.label}) สัญญาณ ${setup.signalType} Entry ${setup.entryPrice} ฿ / SL ${setup.stopLossPrice} ฿ / TP1 ${setup.targetPrice1} ฿ ${setup.sourceOfIdea ? `[ที่มา: ${setup.sourceOfIdea}]` : ''}`,
    });
    setExecutedSymbols((prev) => [...prev, setup.symbol]);
  };

  // Hot Momentum Discovery Stocks (Not already in portfolio)
  const existingSymbols = new Set(dayTradePortfolio.setups.map((s) => s.symbol));
  const hotMomentumStocks = allStocks
    .filter((s) => !existingSymbols.has(s.symbol))
    .slice(0, 4);

  const SessionIcon = currentSession.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. REAL-TIME LIVE MARKET TIME & SESSION STATUS BAR (เห็นเวลาและวันที่ชัดเจน) */}
      <div className="bg-slate-950 text-white rounded-3xl p-4 sm:p-5 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-amber-500/10 via-orange-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Real-time Date, Clock & Timezone */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-amber-400 flex items-center space-x-1 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatThaiFullDate(currentTime)}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  เวลาตลาด SET (BKK GMT+7)
                </span>
              </div>

              {/* Digital Big Clock */}
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                  {currentTime.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-xs text-amber-200/80 font-bold">น. (Real-Time Clock)</span>
              </div>
            </div>
          </div>

          {/* Center/Right: Active Trading Session & Horizon Timeline */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
            
            {/* Session Indicator Card */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3">
              <div className={`p-2 rounded-xl border ${currentSession.badge} shrink-0`}>
                <SessionIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${currentSession.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  <span className="text-xs font-black text-white">{currentSession.sessionName}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  {currentSession.note}
                </p>
              </div>
            </div>

            {/* Holding Horizon Card */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3">
              <div className={`p-2 rounded-xl border ${horizonInfo.badgeColor} shrink-0`}>
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold flex items-center space-x-1">
                  <span>กรอบเวลาปฏิบัติการ:</span>
                  <span className="text-amber-300 font-black">{tfInfo.label}</span>
                </div>
                <span className="text-xs font-black text-amber-200 block">
                  {horizonInfo.targetDateStr}
                </span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[200px]" title={horizonInfo.actionTip}>
                  {horizonInfo.actionTip}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. HIGH-VISIBILITY WARNING & TERMINAL CONTROL BANNER */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 rounded-3xl shadow-xl border border-amber-400/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-amber-300 text-xs font-black flex items-center space-x-1 border border-amber-300/40 shadow-xs">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>DAY TRADE & FAST SWING TERMINAL</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                {tfInfo.icon} {tfInfo.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-200 text-[11px] font-black border border-rose-400/30">
                ⚠️ HIGH-RISK MODE
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>ศูนย์วิเคราะห์ & ชี้แนะจุดซื้อขายเก็งกำไรระยะสั้น</span>
            </h2>
            <p className="text-xs text-amber-100/90 max-w-2xl leading-relaxed">
              ระบบกำลังวิเคราะห์ด้วยความเร็วสูง เน้น <strong>จุดเข้า (Entry), จุดตัดขาดทุน (SL), จุดขายทำกำไร (TP)</strong> พร้อม <strong>AI Risk Audit</strong> ตรวจจับความเสี่ยงและสแกนความเห็นชอบสำหรับหุ้นที่เพื่อน/คนอื่นแนะนำมา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenPriceSyncModal && (
              <button
                type="button"
                onClick={onOpenPriceSyncModal}
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center space-x-1.5 shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>🔄 ซิงค์ & ปรับราคาตลาดสด</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddCustomStockModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-950 hover:bg-amber-100 text-xs font-black flex items-center space-x-1.5 shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>+ เพิ่มหุ้นที่สนใจ / คนแนะนำมา</span>
            </button>

            <button
              type="button"
              onClick={onOpenSetupModal}
              className="px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 text-xs font-black flex items-center space-x-2 shadow-lg shadow-black/30 border border-amber-500/40 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>ปรับการตั้งค่ารอบ & งบลงทุน</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
          <div className="bg-black/25 p-2.5 rounded-2xl backdrop-blur-xs">
            <span className="text-[10px] text-amber-200 block">งบเก็งกำไรรอบนี้</span>
            <span className="text-base font-black text-white">{dayTradePortfolio.capital.toLocaleString()} ฿</span>
          </div>
          <div className="bg-black/25 p-2.5 rounded-2xl backdrop-blur-xs">
            <span className="text-[10px] text-amber-200 block">หุ้นในโฟกัส</span>
            <span className="text-base font-black text-white">{dayTradePortfolio.setups.length} ตัว</span>
          </div>
          <div className="bg-black/25 p-2.5 rounded-2xl backdrop-blur-xs">
            <span className="text-[10px] text-amber-200 block">เป้าหมายกำไรเฉลี่ย</span>
            <span className="text-base font-black text-emerald-300">+{dayTradePortfolio.targetProfitPercent}%</span>
          </div>
          <div className="bg-black/25 p-2.5 rounded-2xl backdrop-blur-xs">
            <span className="text-[10px] text-amber-200 block">วินัยความเสี่ยงสูงสุดต่อไม้</span>
            <span className="text-base font-black text-rose-300">ไม่เกิน 1.5 - 2.5%</span>
          </div>
        </div>
      </div>

      {/* CRITICAL REAL-TIME WARNING & PREPARATION CHECKLIST BANNER (แจ้งเตือนเตรียมหุ้น & ซิงค์ราคา) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent dark:from-amber-950/40 dark:via-orange-950/20 border border-amber-300/80 dark:border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-amber-200 flex items-center space-x-1.5">
                <span>⚠️ ข้อควรระวังในการดึงข้อมูล & แนะนำขั้นตอนเตรียมตัวก่อนเทรด:</span>
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                อัปเดตล่าสุด: {lastSyncedTime.toLocaleTimeString('th-TH', { hour12: false })} น.
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-3xl font-medium">
              ราคาในระบบอาจมีความคลาดเคลื่อนหรือดีเลย์ตามรอบฟีด <strong>ผู้ใช้งานควรเตรียมรายการหุ้นที่ตนเองเฝ้าให้ครบ</strong> และกดปุ่ม <strong>[🔄 ซิงค์/รีเฟรชราคา]</strong> หรือพิมพ์ปรับราคาบนการ์ดหุ้นให้ตรงกับหน้าจอ Streaming จริงของโบรกเกอร์ เพื่อให้จุด Entry, Stop Loss และ Take Profit คำนวณได้อย่างแม่นยำสูงสุด
            </p>
          </div>
        </div>

        {onOpenPriceSyncModal && (
          <button
            type="button"
            onClick={onOpenPriceSyncModal}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs font-black shrink-0 border border-amber-500/40 shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>เปิดหน้าต่างซิงค์ & ปรับราคาหุ้นทั้งหมด</span>
          </button>
        )}
      </div>

      {/* 2. STRATEGY FILTER & ACTION MATRIX */}
      <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-500" />
              <span>ตารางชี้แนะแผนการเทรด (Day Trade Action Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              ราคาเข้าซื้อที่ได้เปรียบ, จุด Stop Loss แม่นยำ, เป้า TP1 / TP2 พร้อมผลตรวจจับความเสี่ยง & ความเห็นชอบโดย AI
            </p>
          </div>

          {/* Strategy Tabs & Custom Add Button */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {[
              { id: 'ALL', label: 'ทุกลำดับสัญญาณ' },
              { id: 'VOLUME_BREAKOUT', label: '⚡ Volume Breakout' },
              { id: 'EMA_PULLBACK', label: '🎯 EMA Pullback' },
              { id: 'RSI_BOUNCE', label: '🔄 RSI Bounce' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStrategyFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStrategyFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsAddCustomStockModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/40 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มหุ้นตรวจความเสี่ยง</span>
            </button>
          </div>
        </div>

        {/* Setups Cards / Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSetups.map((setup) => {
            const isSelected = selectedSetupSymbol === setup.symbol;
            const isExecuted = executedSymbols.includes(setup.symbol);
            const audit = setup.aiRiskAudit;

            return (
              <div
                key={setup.symbol}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-md ring-1 ring-amber-500/40'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {setup.symbol}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold">
                          {setup.stock.market}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                          setup.signalType === 'VOLUME_BREAKOUT'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : setup.signalType === 'EMA_PULLBACK'
                            ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        }`}>
                          {setup.signalType === 'VOLUME_BREAKOUT' ? '⚡ Volume Breakout' : setup.signalType === 'EMA_PULLBACK' ? '🎯 EMA Pullback' : '🔄 RSI Bounce'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                        {setup.stock.name}
                      </p>

                      {/* Source of Idea Tag */}
                      {setup.sourceOfIdea && (
                        <div className="mt-1 flex items-center space-x-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 text-[10px] text-slate-700 dark:text-zinc-300">
                            ที่มา: {setup.sourceOfIdea}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {editingPriceSymbol === setup.symbol ? (
                        <div className="flex items-center space-x-1.5 p-1 bg-amber-500/10 border border-amber-400/80 rounded-xl animate-in fade-in">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(tempPriceInput) || setup.stock.currentPrice;
                              let step = curr < 2 ? 0.01 : curr < 5 ? 0.02 : curr < 10 ? 0.05 : curr < 25 ? 0.10 : curr < 100 ? 0.25 : 0.50;
                              const val = Math.max(0.01, Number((curr - step).toFixed(2)));
                              setTempPriceInput(val.toString());
                              if (onUpdateSingleStockPrice) onUpdateSingleStockPrice(setup.symbol, val);
                            }}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-rose-500 flex items-center justify-center font-bold text-xs border border-slate-300 dark:border-zinc-700 cursor-pointer"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            step="any"
                            value={tempPriceInput}
                            onChange={(e) => setTempPriceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const parsed = parseFloat(tempPriceInput);
                                if (!isNaN(parsed) && parsed > 0 && onUpdateSingleStockPrice) {
                                  onUpdateSingleStockPrice(setup.symbol, parsed);
                                }
                                setEditingPriceSymbol(null);
                              }
                            }}
                            className="w-16 py-0.5 px-1 text-center text-xs font-black bg-white dark:bg-zinc-800 rounded-lg border border-amber-400 text-slate-900 dark:text-white"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(tempPriceInput) || setup.stock.currentPrice;
                              let step = curr < 2 ? 0.01 : curr < 5 ? 0.02 : curr < 10 ? 0.05 : curr < 25 ? 0.10 : curr < 100 ? 0.25 : 0.50;
                              const val = Math.max(0.01, Number((curr + step).toFixed(2)));
                              setTempPriceInput(val.toString());
                              if (onUpdateSingleStockPrice) onUpdateSingleStockPrice(setup.symbol, val);
                            }}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-emerald-500 flex items-center justify-center font-bold text-xs border border-slate-300 dark:border-zinc-700 cursor-pointer"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const parsed = parseFloat(tempPriceInput);
                              if (!isNaN(parsed) && parsed > 0 && onUpdateSingleStockPrice) {
                                onUpdateSingleStockPrice(setup.symbol, parsed);
                              }
                              setEditingPriceSymbol(null);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-black cursor-pointer"
                          >
                            ตกลง
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-end space-x-1.5">
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {setup.stock.currentPrice} {setup.stock.currency}
                            </span>
                            {onUpdateSingleStockPrice && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPriceSymbol(setup.symbol);
                                  setTempPriceInput(setup.stock.currentPrice.toString());
                                }}
                                className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-[10px] font-bold border border-amber-300 dark:border-amber-700/60 cursor-pointer"
                                title="ปรับราคาให้ตรงกับหน้าจอ Streaming จริง"
                              >
                                ✏️ ปรับราคา
                              </button>
                            )}
                          </div>
                          <div className={`text-xs font-bold flex items-center justify-end space-x-0.5 ${
                            setup.stock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {setup.stock.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span>{setup.stock.changePercent >= 0 ? '+' : ''}{setup.stock.changePercent}%</span>
                          </div>
                        </div>
                      )}

                      {onRemoveStockFromDayTradePortfolio && dayTradePortfolio.setups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveStockFromDayTradePortfolio(setup.symbol)}
                          className="mt-1 text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer block text-right ml-auto"
                          title="นำออกจากพอร์ต Day Trade"
                        >
                          ลบออก
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI RISK AUDIT & VERDICT BOX (ตรวจจับความเสี่ยง & ความเห็นชอบ) */}
                  {audit && (
                    <div className={`mt-3 p-3 rounded-2xl border text-xs space-y-2 ${
                      audit.verdict === 'HIGHLY_APPROVED'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                        : audit.verdict === 'APPROVED_WITH_CONDITIONS'
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
                        : audit.verdict === 'HIGH_RISK_WARNING'
                        ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/60 text-orange-950 dark:text-orange-200'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="font-black flex items-center space-x-1.5">
                          {audit.verdict === 'HIGHLY_APPROVED' ? (
                            <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : audit.verdict === 'APPROVED_WITH_CONDITIONS' ? (
                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          )}
                          <span>{audit.verdictTitle}</span>
                        </div>
                        <span className="font-black text-[11px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30">
                          คะแนนเทคนิค: {audit.score}/100
                        </span>
                      </div>

                      {/* Peer Recommendation Review */}
                      <p className="text-[11px] leading-relaxed opacity-95">
                        <strong>🔍 AI ตรวจสอบคำแนะนำ:</strong> {audit.peerRecommendationAnalysis}
                      </p>

                      {/* Trap Warning if any */}
                      {audit.trapWarning && (
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-black flex items-start space-x-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{audit.trapWarning}</span>
                        </div>
                      )}

                      {/* Pros & Cons summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[10px]">
                        {audit.pros.length > 0 && (
                          <div className="space-y-0.5">
                            <span className="font-black text-emerald-700 dark:text-emerald-400">✅ สัญญาณบวก:</span>
                            {audit.pros.slice(0, 2).map((p, idx) => (
                              <div key={idx} className="opacity-90">• {p}</div>
                            ))}
                          </div>
                        )}
                        {audit.cons.length > 0 && (
                          <div className="space-y-0.5">
                            <span className="font-black text-rose-700 dark:text-rose-400">⚠️ ข้อควรระวัง:</span>
                            {audit.cons.slice(0, 2).map((c, idx) => (
                              <div key={idx} className="opacity-90">• {c}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Timing Horizon Badge on Card */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 bg-slate-100/70 dark:bg-zinc-800/60 rounded-xl border border-slate-200/60 dark:border-zinc-700/40 text-[11px] text-slate-600 dark:text-zinc-300">
                    <span className="flex items-center space-x-1 font-bold">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>อัปเดต: {currentTime.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.</span>
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                      <Timer className="w-3 h-3" />
                      <span>{horizonInfo.targetDateStr}</span>
                    </span>
                  </div>

                  {/* 3 Core Numbers: Entry vs SL vs TP1 */}
                  <div className="grid grid-cols-3 gap-2 mt-3 p-3 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 text-center">
                    {/* Entry */}
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                      <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-bold block">🎯 โซนเข้าซื้อ (Entry)</span>
                      <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {setup.entryPrice} ฿
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">{setup.entryZone}</span>
                    </div>

                    {/* Stop Loss */}
                    <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="text-[10px] text-rose-500 font-bold block">🛑 จุดตัดขาดทุน (SL)</span>
                      <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                        {setup.stopLossPrice} ฿
                      </span>
                      <span className="text-[9px] text-rose-500 font-extrabold block">-{setup.stopLossPercent}%</span>
                    </div>

                    {/* Target Price */}
                    <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">🏆 กำไรเป้าหมาย (TP1)</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {setup.targetPrice1} ฿
                      </span>
                      <span className="text-[9px] text-emerald-600 font-extrabold block">+{setup.expectedGainPercent1}% (TP2: {setup.targetPrice2})</span>
                    </div>
                  </div>

                  {/* Risk / Reward & Indicators Checklist with Traffic Light Badges */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500 dark:text-zinc-400">อัตราผลตอบแทนต่อความเสี่ยง (R:R):</span>
                      <TrafficStatusBadge type="RR" value={setup.riskRewardRatio} />
                    </div>

                    {/* Technical Indicators Badges with Traffic Light System */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <TrafficStatusBadge type="VOLUME" value={setup.indicators.volumeSurgePercent} compact={true} />
                      <TrafficStatusBadge type="MOS" value={setup.stock.marginOfSafety} compact={true} />
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
                        RSI: <strong>{setup.indicators.rsi}</strong> ({setup.indicators.rsiStatus})
                      </span>
                    </div>

                    {/* Anti-Stop Hunt Guardrail on Card */}
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/40 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-black text-amber-900 dark:text-amber-300">
                        <span className="flex items-center space-x-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                          <span>🛡️ เกราะกันหลอกกิน SL (Anti-Stop Hunt Active)</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ATR Buffer 1.5x
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-zinc-300 leading-tight">
                        ระยะ SL เผื่อแรงเหวี่ยง 1.5x ATR • แนะนำรอแท่งเทียน 5m/15m ปิดจริงใต้ {setup.stopLossPrice} ฿ ป้องกันไส้เทียนสลัดเม่า
                      </p>
                    </div>

                    {/* Action Guidance Note */}
                    <p className="text-[11px] text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 leading-relaxed">
                      {setup.actionGuidance}
                    </p>

                    {setup.urgentWarning && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/40 font-bold">
                        {setup.urgentWarning}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                    แนะนำเข้า: <strong>{setup.recommendedShares.toLocaleString()} หุ้น</strong> (~{(setup.recommendedShares * setup.entryPrice).toLocaleString()} ฿)
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectStockForDeepAnalysis(setup.stock)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      title="ดูกราฟเทคนิคและ Valuation"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>วิเคราะห์กราฟ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAIChatWithStock(setup.stock, `ขอวิเคราะห์จุดเข้าซื้อ Day Trade ของ ${setup.symbol} ที่ราคา ${setup.entryPrice} ฿ วาง SL ${setup.stopLossPrice} ฿ TP ${setup.targetPrice1} ฿ ในกรอบเวลา ${tfInfo.label} ${setup.sourceOfIdea ? `(ข้อมูลที่มา: ${setup.sourceOfIdea})` : ''}`)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Bot className="w-3 h-3" />
                      <span>ถาม AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickExecute(setup)}
                      disabled={isExecuted}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 transition-all cursor-pointer ${
                        isExecuted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                      }`}
                    >
                      {isExecuted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>บันทึกพอร์ตแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>เข้าซื้อตามแผน 1-Click</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. FOCUS WATCHLIST TABLE (ตารางสำหรับ Copy ลง Excel) */}
      <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Table className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  ตารางสรุปแผนเทรด & เฝ้าติดตาม (Watchlist Table)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-500/20">
                  {filteredSetups.length} ตัว
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                เปรียบเทียบราคาเมื่อวาน, ราคาล่าสุด, จุด SL/TP พร้อมปุ่มปรับราคาด่วน และคัดลอกลง Excel ได้ทันที
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Sync Button */}
            {onSyncAllPrices && (
              <button
                type="button"
                onClick={handleManualSyncClick}
                disabled={isManualSyncing}
                title="ซิงค์และรีเฟรชราคาตลาดสดของหุ้นทุกตัวในตาราง"
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'กำลังซิงค์...' : '🔄 ซิงค์ราคาทุกตัว'}</span>
              </button>
            )}

            {/* Auto Sync Realtime Toggle */}
            {onSyncAllPrices && (
              <button
                type="button"
                onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                title="เปิด/ปิดการซิงค์ราคาอัตโนมัติต่อเนื่องทุก 4 วินาที"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  isAutoSyncEnabled
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm animate-pulse'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isAutoSyncEnabled ? '⚡ Auto-Sync ทำงานอยู่ (4s)' : '⚡ เปิด Auto-Sync'}</span>
              </button>
            )}

            {/* Copy to Excel Button */}
            <button
              type="button"
              id="copy-to-excel-btn"
              onClick={handleCopyToExcel}
              title="คัดลอกตารางหุ้นทั้งหมดเพื่อนำไปวาง (Ctrl+V) ลงใน Excel หรือ Google Sheets"
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                isCopiedToExcel
                  ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400/30'
                  : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
              }`}
            >
              {isCopiedToExcel ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{isCopiedToExcel ? 'คัดลอกแล้ว!' : 'คัดลอกลง Excel'}</span>
            </button>

            {/* Clear Table Button */}
            {onClearDayTradePortfolio && (
              <button
                type="button"
                id="clear-day-trade-table-btn"
                onClick={() => {
                  if (dayTradePortfolio.setups.length === 0) {
                    setClearToastMsg('ℹ️ ตารางหุ้นว่างเปล่าอยู่แล้ว');
                    setTimeout(() => setClearToastMsg(''), 2500);
                    return;
                  }
                  setShowClearConfirmModal(true);
                }}
                disabled={dayTradePortfolio.setups.length === 0}
                title="ล้างรายการหุ้นทั้งหมดออกจากตารางเพื่อเลือกหุ้นชุดใหม่"
                className="px-3 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างตารางหุ้น</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {(copyFeedbackMsg || clearToastMsg) && (
          <div className="p-3 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 text-indigo-100 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{copyFeedbackMsg || clearToastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCopyFeedbackMsg('');
                setClearToastMsg('');
              }}
              className="text-indigo-300 hover:text-white px-2 py-0.5 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-700/80">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-700/80">
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300">Symbol</th>
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300 text-right">ราคาเมื่อวาน (Prev Close)</th>
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300 text-right">ราคาล่าสุด (Last)</th>
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300 text-right">เปลี่ยนแปลง (Chg)</th>
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300 text-right">จุดตัดขาดทุน (SL)</th>
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300 text-right">เป้าทำกำไร (TP)</th>
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300">สัญญาณ (Signal)</th>
                <th className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-[#151518]">
              {filteredSetups.map((setup) => {
                const prevClose = Number((setup.stock.currentPrice - (setup.stock.change || 0)).toFixed(2));
                const isWin = setup.stock.changePercent >= 0;
                const isEditing = editingPriceSymbol === setup.symbol;

                return (
                  <tr key={setup.symbol} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    {/* Symbol */}
                    <td className="px-4 py-3 font-black text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSetupSymbol(setup.symbol)}
                          className="hover:text-amber-500 transition-colors cursor-pointer text-left font-black"
                        >
                          {setup.symbol}
                        </button>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {setup.stock.market}
                        </span>
                      </div>
                    </td>

                    {/* Prev Close */}
                    <td className="px-4 py-3 font-bold text-slate-500 dark:text-zinc-400 text-right">
                      {prevClose.toFixed(2)} ฿
                    </td>

                    {/* Last Price with Quick Tick Adjusters */}
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-1">
                          <input
                            type="number"
                            step="any"
                            value={tempPriceInput}
                            onChange={(e) => setTempPriceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlinePrice(setup.symbol);
                              if (e.key === 'Escape') setEditingPriceSymbol(null);
                            }}
                            autoFocus
                            className="w-20 py-0.5 px-1.5 text-center font-black text-xs rounded border border-amber-400 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlinePrice(setup.symbol)}
                            className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1.5">
                          {onUpdateSingleStockPrice && (
                            <button
                              type="button"
                              onClick={() => handleTableAdjustStep(setup.symbol, setup.stock.currentPrice, -1)}
                              title="ลดราคา 1 tick"
                              className="w-5 h-5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-rose-500 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceSymbol(setup.symbol);
                              setTempPriceInput(setup.stock.currentPrice.toString());
                            }}
                            title="คลิกเพื่อพิมพ์แก้ราคาเอง"
                            className="font-black text-slate-900 dark:text-white hover:text-amber-500 underline decoration-dotted underline-offset-2 px-1"
                          >
                            {setup.stock.currentPrice.toFixed(2)} ฿
                          </button>
                          {onUpdateSingleStockPrice && (
                            <button
                              type="button"
                              onClick={() => handleTableAdjustStep(setup.symbol, setup.stock.currentPrice, 1)}
                              title="เพิ่มราคา 1 tick"
                              className="w-5 h-5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-emerald-500 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Change & % */}
                    <td className={`px-4 py-3 font-bold text-right ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <div className="flex flex-col items-end">
                        <span>{isWin ? '+' : ''}{(setup.stock.change || 0).toFixed(2)}</span>
                        <span className="text-[10px] opacity-80">({isWin ? '+' : ''}{setup.stock.changePercent.toFixed(2)}%)</span>
                      </div>
                    </td>

                    {/* Stop Loss (SL) */}
                    <td className="px-4 py-3 font-black text-rose-500 text-right">
                      {setup.stopLossPrice.toFixed(2)} ฿
                    </td>

                    {/* Take Profit (TP) */}
                    <td className="px-4 py-3 font-black text-emerald-500 text-right">
                      {setup.targetPrice1.toFixed(2)} ฿
                    </td>

                    {/* Signal */}
                    <td className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-300">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          setup.signalType === 'VOLUME_BREAKOUT' ? 'bg-emerald-500' :
                          setup.signalType === 'EMA_PULLBACK' ? 'bg-emerald-400' :
                          setup.signalType === 'RSI_BOUNCE' ? 'bg-amber-400' : 'bg-rose-500'
                        }`} />
                        <span>{setup.signalType.replace(/_/g, ' ')}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSetupSymbol(setup.symbol)}
                          title="เปิดดูกราฟและแผนเทรดตัวนี้"
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        {onRemoveStockFromDayTradePortfolio && (
                          <button
                            type="button"
                            onClick={() => onRemoveStockFromDayTradePortfolio(setup.symbol)}
                            title="ลบออกจาก Watchlist"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSetups.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    ไม่มีรายการหุ้นในตารางขณะนี้ (คลิก "+ เพิ่มหุ้นที่สนใจ" เพื่อเพิ่มหุ้นเข้าตาราง)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. HOT MOMENTUM DISCOVERY SCANNER (เพิ่มหุ้นเด่นด่วน) */}
      {hotMomentumStocks.length > 0 && (
        <div className="bg-slate-50 dark:bg-zinc-900/60 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                หุ้นโมเมนตัมร้อนแรงในตลาดวันนี้ (Hot Momentum Candidates):
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">คลิก "+" เพื่อดึงเข้าพอร์ต Day Trade ทันที</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {hotMomentumStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="p-3 bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between hover:border-amber-400 transition-all"
              >
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center space-x-1">
                    <span>{stock.symbol}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500">
                      {stock.market}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {stock.currentPrice} ฿ ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddStockToDayTradePortfolio(stock, 'คัดกรองจาก Hot Momentum')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-slate-950 text-xs font-black border border-amber-300 dark:border-amber-800/60 transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่ม</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal to Add Custom Stock with Peer Note & AI Risk Audit */}
      <AddCustomDayTradeStockModal
        isOpen={isAddCustomStockModalOpen}
        onClose={() => setIsAddCustomStockModalOpen(false)}
        allStocks={allStocks}
        onAddStockWithAudit={onAddStockToDayTradePortfolio}
      />

      {/* In-App Confirmation Modal for Clearing Stock Table */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181B] border border-rose-500/40 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ยืนยันการล้างตารางหุ้น?
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  คุณกำลังจะล้างหุ้นทั้ง {dayTradePortfolio.setups.length} ตัวออกจากตาราง Watchlist
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
              <p className="font-bold flex items-center space-x-1">
                <span>⚠️ สิ่งที่จะเกิดขึ้น:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-zinc-300">
                <li>จะลบรายการหุ้นทั้งหมดในตารางสรุปแผนเทรด Day Trade</li>
                <li>คุณสามารถเพิ่มหุ้นใหม่ได้ตลอดเวลาผ่านปุ่ม "ค้นหา/เพิ่มหุ้น", สแกนเนอร์ หรือ "หุ้นโมเมนตัม"</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                id="confirm-clear-stock-table-action-btn"
                onClick={handleConfirmClearTable}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันล้างตารางหุ้น</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
