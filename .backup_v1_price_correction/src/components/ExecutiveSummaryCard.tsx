import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Target, 
  Sparkles, 
  ArrowRight,
  Info,
  Clock,
  Layers,
  BarChart3,
  Scale
} from 'lucide-react';
import { StockData } from '../types';

interface ExecutiveSummaryCardProps {
  stock: StockData;
  onOpenAIAnalysis: () => void;
  onJumpToTradePlan: () => void;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  stock,
  onOpenAIAnalysis,
  onJumpToTradePlan,
}) => {
  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'STRONG_BUY':
        return {
          bg: 'bg-emerald-500 text-white',
          border: 'border-emerald-600',
          text: 'STRONG BUY (ซื้อเชิงรุก)',
          sub: 'พื้นฐานยอดเยี่ยม + จังหวะเทคนิคเป็นใจ',
          badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'BUY':
        return {
          bg: 'bg-emerald-600 text-white',
          border: 'border-emerald-700',
          text: 'BUY (ซื้อลงทุน/เก็งกำไร)',
          sub: 'อัพไซด์คุ้มค่า ความเสี่ยงจำกัด',
          badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'ACCUMULATE':
        return {
          bg: 'bg-blue-600 text-white',
          border: 'border-blue-700',
          text: 'ACCUMULATE (ทยอยสะสม)',
          sub: 'พื้นฐานดี ทยอยแบ่งไม้รับโซนแนวรับ',
          badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'WAIT':
        return {
          bg: 'bg-amber-500 text-white',
          border: 'border-amber-600',
          text: 'WAIT & SEE (รอดูจังหวะ)',
          sub: 'รอให้ราคาพักตัวหรือสร้างฐานชัดเจนก่อน',
          badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'TAKE_PROFIT':
        return {
          bg: 'bg-indigo-600 text-white',
          border: 'border-indigo-700',
          text: 'TAKE PROFIT (ทยอยขายทำกำไร)',
          sub: 'ถึงเป้าหมายราคาหรือติดโซนแนวต้าน',
          badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        };
      case 'STOP_LOSS':
      default:
        return {
          bg: 'bg-rose-600 text-white',
          border: 'border-rose-700',
          text: 'STOP LOSS (ตัดขาดทุน / เลี่ยง)',
          sub: 'หลุดแนวรับสำคัญ โครงสร้างราคาเสียหาย',
          badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
    }
  };

  const ratingInfo = getRatingBadge(stock.compositeRating);

  return (
    <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm p-5 sm:p-6 mb-6">
      {/* Top Header info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
              {stock.market} : {stock.sector}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
              stock.valuationStatus === 'UNDERVALUED'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : stock.valuationStatus === 'OVERVALUED'
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
            }`}>
              {stock.valuationStatus === 'UNDERVALUED' ? '🏷️ Undervalued (ราคาต่ำกว่ามูลค่า)' : stock.valuationStatus === 'OVERVALUED' ? '⚠️ Overvalued (ราคาสูงกว่ามูลค่า)' : '⚖️ Fair Value (ราคาสมเหตุสมผล)'}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stock.symbol}
            </h2>
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              {stock.name}
            </span>
          </div>
        </div>

        {/* Live Price & Change */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#18181B] px-4 py-3 rounded-xl border border-slate-200/80 dark:border-zinc-800">
            <div>
              <div className="text-xs text-slate-400 dark:text-zinc-500 font-medium">ราคาปิดจริง (Last Close)</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {stock.currentPrice} <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">{stock.currency}</span>
              </div>
            </div>
            <div className="h-9 w-px bg-slate-200 dark:bg-zinc-700 mx-1"></div>
            <div className="text-right">
              <div className={`text-sm sm:text-base font-bold ${
                stock.change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}>
                {stock.change >= 0 ? '+' : ''}{stock.change}
              </div>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                stock.changePercent >= 0 
                  ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
              </div>
            </div>
          </div>
          <div className="text-[10.5px] font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 px-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>
              {stock.market === 'SET' || stock.market === 'mai' 
                ? 'อ้างอิงราคาปิดจริง Siamchart / SET (วันทำการล่าสุด)' 
                : stock.market === 'US' 
                ? 'อ้างอิงราคาปิดตลาด NASDAQ / NYSE สหรัฐฯ' 
                : 'อ้างอิงราคาตลาด Spot / Interbank FX'}
            </span>
          </div>
        </div>
      </div>

      {/* Tri-Pillar Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        {/* Pillar 1: Fundamental Analysis (What to buy) */}
        <div className="p-4 rounded-xl border bg-slate-50/70 dark:bg-[#18181B]/70 border-slate-200/80 dark:border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                1. Fundamental (What to buy)
              </span>
            </div>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              {stock.fundamentalScore}<span className="text-xs text-slate-400 dark:text-zinc-500 font-normal">/100</span>
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${stock.fundamentalScore}%` }}
            ></div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">Fair Value ประเมิน:</span>
              <span className="font-bold text-slate-900 dark:text-white">{stock.fairValue} {stock.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">Margin of Safety:</span>
              <span className={`font-bold ${stock.marginOfSafety >= 10 ? 'text-emerald-500 dark:text-emerald-400' : stock.marginOfSafety < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'}`}>
                {stock.marginOfSafety >= 0 ? '+' : ''}{stock.marginOfSafety}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">P/E vs Industry:</span>
              <span className="font-medium text-slate-700 dark:text-zinc-200">{stock.pe}x / {stock.industryPe}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">ROE / Div Yield:</span>
              <span className="font-medium text-slate-700 dark:text-zinc-200">{stock.roe}% / {stock.dividendYield}%</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Technical & Timing (When to buy) */}
        <div className="p-4 rounded-xl border bg-slate-50/70 dark:bg-[#18181B]/70 border-slate-200/80 dark:border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                2. Technical (When & How)
              </span>
            </div>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {stock.technicalScore}<span className="text-xs text-slate-400 dark:text-zinc-500 font-normal">/100</span>
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-3">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stock.technicalScore}%` }}
            ></div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">Trend & Momentum:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {stock.trend === 'UPTREND' ? '🟢 ขาขึ้น (Uptrend)' : stock.trend === 'DOWNTREND' ? '🔴 ขาลง (Downtrend)' : '🟡 ไซด์เวย์ (Sideway)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">RSI (14) / MACD:</span>
              <span className="font-medium text-slate-700 dark:text-zinc-200">{stock.rsi} / {stock.macdSignal === 'BULLISH_CROSSOVER' ? 'Bullish' : 'Neutral'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">แนวรับ S1 / S2:</span>
              <span className="font-medium text-slate-700 dark:text-zinc-200">{stock.support1} / {stock.support2}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 dark:text-zinc-500">แนวต้าน R1 / R2:</span>
              <span className="font-medium text-slate-700 dark:text-zinc-200">{stock.resistance1} / {stock.resistance2}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: SBY Invest AI Composite Decision */}
        <div className="p-4 rounded-xl border bg-gradient-to-br from-indigo-50/80 to-blue-50/60 dark:from-indigo-950/30 dark:to-zinc-900/60 border-indigo-200/80 dark:border-indigo-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  3. SBY Composite Action
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                AI Powered
              </span>
            </div>

            <div className="mt-2 mb-2">
              <div className={`text-center py-2 px-3 rounded-xl font-extrabold text-sm sm:text-base shadow-sm ${ratingInfo.bg}`}>
                {ratingInfo.text}
              </div>
              <p className="text-[11px] text-center text-slate-600 dark:text-zinc-300 mt-1 font-medium">
                {ratingInfo.sub}
              </p>
            </div>
          </div>

          <button
            onClick={onJumpToTradePlan}
            className="w-full py-1.5 px-3 rounded-lg bg-white dark:bg-[#18181B] hover:bg-indigo-50 dark:hover:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-zinc-700 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Target className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>คำนวณเงินลงทุน & แผนเทรด (Position Sizing)</span>
          </button>
        </div>
      </div>

      {/* Strategic Summary & Execution Rule Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200/70 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>บทสรุปกลยุทธ์ปฏิบัติการ (Actionable Execution Plan):</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
            {stock.actionPlanSummary}
          </p>
        </div>

        <div className="shrink-0 flex items-center space-x-2 w-full md:w-auto">
          <button
            id="executive-ai-diagnose-btn"
            onClick={onOpenAIAnalysis}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>AI Deep Diagnosis เจาะลึก</span>
          </button>
        </div>
      </div>
    </div>
  );
};
