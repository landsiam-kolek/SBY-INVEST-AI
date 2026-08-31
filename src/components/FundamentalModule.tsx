import React, { useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  Percent, 
  Scale, 
  CheckCircle2, 
  AlertOctagon, 
  TrendingUp, 
  Sliders, 
  HelpCircle,
  Award,
  RefreshCw,
  Info,
  Coins,
  Globe2,
  Landmark,
  Compass,
  Zap,
  Gauge
} from 'lucide-react';
import { StockData } from '../types';
import { calculateCustomFairValue, formatNumber } from '../utils/calculations';

interface FundamentalModuleProps {
  stock: StockData;
}

export const FundamentalModule: React.FC<FundamentalModuleProps> = ({ stock }) => {
  // Interactive Valuation Sensitivity State for Stocks
  const [growthRate, setGrowthRate] = useState<number>(stock.revenueGrowth || 8);
  const [targetPE, setTargetPE] = useState<number>(stock.pe || 20);

  const customValuation = calculateCustomFairValue(stock, growthRate, targetPE);

  const resetSensitivity = () => {
    setGrowthRate(stock.revenueGrowth || 8);
    setTargetPE(stock.pe || 20);
  };

  const isForex = stock.assetCategory === 'FOREX' || !!stock.forexMacro;
  const macro = stock.forexMacro;

  // ----------------------------------------------------
  // FOREX / COMMODITIES MACROECONOMIC FUNDAMENTAL VIEW
  // ----------------------------------------------------
  if (isForex && macro) {
    return (
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm p-5 sm:p-6 mb-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Macroeconomic & Central Bank Fundamentals
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  Forex Macro Driver
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                วิเคราะห์ปัจจัยพื้นฐานมหภาค ส่วนต่างดอกเบี้ยนโยบาย (Carry), นโยบายธนาคารกลาง, และเงินเฟ้อเปรียบเทียบ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 text-right">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">คะแนนมหภาค (Macro Score)</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {stock.fundamentalScore} <span className="text-xs text-slate-400 dark:text-zinc-500">/ 100</span>
              </span>
            </div>
          </div>
        </div>

        {/* Macro Profile Overview */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50/80 dark:bg-[#18181B]/80 border border-slate-200/80 dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center space-x-1.5">
            <Globe2 className="w-3.5 h-3.5 text-amber-500" />
            <span>ลักษณะคู่เงิน & สินทรัพย์มหภาค (Macro Dynamic Overview)</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
            {stock.businessDescription}
          </p>
        </div>

        {/* Core Forex Macro Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {/* Interest Rate Differential */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              ส่วนต่างดอกเบี้ย (Diff)
            </div>
            <div className={`text-lg font-black ${macro.interestRateDifferential >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {macro.interestRateDifferential > 0 ? '+' : ''}{macro.interestRateDifferential}%
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              {macro.baseCurrency.split(' ')[0]} vs {macro.quoteCurrency.split(' ')[0]}
            </div>
          </div>

          {/* Base Interest Rate */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              ดอกเบี้ย {macro.baseCurrency.split(' ')[0]}
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {macro.baseInterestRate}%
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
              {macro.baseCentralBank}
            </div>
          </div>

          {/* Quote Interest Rate */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              ดอกเบี้ย {macro.quoteCurrency.split(' ')[0]}
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {macro.quoteInterestRate}%
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
              {macro.quoteCentralBank}
            </div>
          </div>

          {/* COT Sentiment */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              COT Sentiment
            </div>
            <div className={`text-base font-black ${
              macro.cotSentiment === 'NET_BULLISH' 
                ? 'text-emerald-500' 
                : macro.cotSentiment === 'NET_BEARISH' 
                ? 'text-rose-500' 
                : 'text-amber-500'
            }`}>
              {macro.cotSentiment === 'NET_BULLISH' ? 'Net Bullish 🟢' : macro.cotSentiment === 'NET_BEARISH' ? 'Net Bearish 🔴' : 'Neutral 🟡'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              สถานะสัญญารายใหญ่
            </div>
          </div>

          {/* Daily ATR */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              ความผันผวนต่อวัน (ATR)
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {macro.dailyATR} <span className="text-xs font-medium text-slate-400">pips</span>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              ระยะวิ่งเฉลี่ย 14 วัน
            </div>
          </div>

          {/* DXY Correlation */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
              สหสัมพันธ์ ดอลลาร์ (DXY)
            </div>
            <div className="text-sm font-black text-slate-800 dark:text-zinc-200">
              {macro.dxyCorrelation.split(' ')[0]}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
              {macro.dxyCorrelation}
            </div>
          </div>
        </div>

        {/* Central Bank Policy & Fair Value Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Central Bank Stance */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B]">
            <div className="flex items-center space-x-2 mb-2">
              <Landmark className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                ทิศทางนโยบายการเงิน (Central Bank Policy Stance)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-medium bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200/60 dark:border-zinc-800">
              {macro.centralBankStance}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>เงินเฟ้อ {macro.baseCurrency.split(' ')[0]}: <strong className="text-slate-800 dark:text-zinc-200">{macro.baseInflationRate}%</strong></span>
              <span>เงินเฟ้อ {macro.quoteCurrency.split(' ')[0]}: <strong className="text-slate-800 dark:text-zinc-200">{macro.quoteInflationRate}%</strong></span>
              <span>Pip Value/Lot: <strong className="text-emerald-500">${macro.pipValuePerStandardLot}</strong></span>
            </div>
          </div>

          {/* Macro Fair Value & Sentiment Target */}
          <div className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center space-x-1">
                  <Scale className="w-4 h-4 mr-1" />
                  <span>ระดับราคาดุลยภาพมหภาค (Macro Fair Equilibrium)</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {stock.valuationStatus === 'UNDERVALUED' ? 'Undervalued โซนน่าสะสม' : 'Fair Value โซนสมดุล'}
                </span>
              </div>
              <div className="flex items-baseline space-x-3 mt-1">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {stock.fairValue} {stock.currency}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  (Gap: +{stock.marginOfSafety}%)
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2">
              ประเมินจากแบบจำลอง Purchasing Power Parity (PPP), Real Yields และโครงสร้างดุลบัญชีเดินสะพัด
            </p>
          </div>
        </div>

        {/* Strengths & Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/10">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                ปัจจัยหนุนทางมหภาค (Macro Drivers & Catalysts)
              </h4>
            </div>
            <ul className="space-y-2">
              {stock.strengths.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/10">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-rose-900 dark:text-rose-300">
                ความเสี่ยงมหภาคที่ต้องเฝ้าระวัง (Macro Risks)
              </h4>
            </div>
            <ul className="space-y-2">
              {stock.risks.map((item, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STANDARD CORPORATE STOCK FUNDAMENTAL VIEW
  // ----------------------------------------------------
  return (
    <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm p-5 sm:p-6 mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Fundamental & Valuation Analysis
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                What to Buy
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              การวิเคราะห์ความแข็งแกร่งของธุรกิจ คุณภาพกำไร อัตราผลตอบแทน และการประเมินมูลค่าเหมาะสม
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 text-right">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">คะแนนพื้นฐานรวม</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400">
              {stock.fundamentalScore} <span className="text-xs text-slate-400 dark:text-zinc-500">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Business Overview Description */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50/80 dark:bg-[#18181B]/80 border border-slate-200/80 dark:border-zinc-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>ลักษณะการประกอบธุรกิจ (Business Profile)</span>
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
          {stock.businessDescription}
        </p>
      </div>

      {/* Key Financial Metrics Grid */}
      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
          ตัวชี้วัดทางการเงินสำคัญ (Core Financial Ratios)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* P/E */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">P/E Ratio</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                stock.pe < stock.industryPe ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'
              }`}>
                {stock.pe < stock.industryPe ? 'ถูกกว่ากลุ่ม' : 'พรีเมียม'}
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {stock.pe}x
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              กลุ่มเฉลี่ย {stock.industryPe}x
            </div>
          </div>

          {/* P/BV */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">P/BV Ratio</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">Book Val</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {stock.pbv}x
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              {stock.pbv < 1.5 ? 'สินทรัพย์สูง' : 'พรีเมียมแบรนด์'}
            </div>
          </div>

          {/* ROE */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">ROE (ผลตอบแทน)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                stock.roe >= 15 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
              }`}>
                {stock.roe >= 15 ? 'เกรด A' : 'ปานกลาง'}
              </span>
            </div>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400">
              {stock.roe}%
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              เกณฑ์ดี &gt; 15%
            </div>
          </div>

          {/* Dividend Yield */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Div. Yield</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                stock.dividendYield >= 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'
              }`}>
                {stock.dividendYield >= 3 ? 'ปันผลเด่น' : 'ปกติ'}
              </span>
            </div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {stock.dividendYield}%
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              ต่อปี
            </div>
          </div>

          {/* D/E Ratio */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">หนี้สิน (D/E)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                stock.de <= 1.5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
              }`}>
                {stock.de <= 1.5 ? 'หนี้ต่ำ' : 'หนี้สูง'}
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {stock.de}x
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              เกณฑ์ปลอดภัย &lt; 1.5x
            </div>
          </div>

          {/* Net Margin */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Net Margin</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">กำไรสุทธิ</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {stock.netMargin}%
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              โต YoY {stock.revenueGrowth > 0 ? `+${stock.revenueGrowth}%` : `${stock.revenueGrowth}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Model & Margin of Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Intrinsic Value Estimation Box */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-blue-200/80 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                การประเมินมูลค่าแท้จริง (Intrinsic Value Models)
              </h4>
            </div>

            <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg ${
              stock.valuationStatus === 'UNDERVALUED'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                : stock.valuationStatus === 'OVERVALUED'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
            }`}>
              {stock.valuationStatus === 'UNDERVALUED' ? 'Undervalued (ถูกกว่าพื้นฐาน)' : stock.valuationStatus === 'OVERVALUED' ? 'Overvalued (แพงกว่าพื้นฐาน)' : 'Fair Price (ราคาเหมาะสม)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* SBY Base Fair Value */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121215] border border-blue-200/60 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">
                SBY Fair Value (มูลค่าเหมาะสม)
              </span>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {stock.fairValue} <span className="text-xs text-slate-400 font-normal">{stock.currency}</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                เป้าหมายพื้นฐานปี 2025
              </div>
            </div>

            {/* DCF Value */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121215] border border-slate-200/60 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">
                DCF Intrinsic Value
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {stock.dcfValue || (stock.fairValue * 1.05).toFixed(2)} <span className="text-xs text-slate-400 font-normal">{stock.currency}</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                คิดลดกระแสเงินสด 10 ปี
              </div>
            </div>

            {/* Graham Number */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121215] border border-slate-200/60 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">
                Graham Number (ความปลอดภัย)
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {stock.grahamValue || (stock.fairValue * 0.9).toFixed(2)} <span className="text-xs text-slate-400 font-normal">{stock.currency}</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                เกณฑ์อนุรักษ์นิยม
              </div>
            </div>
          </div>

          {/* Margin of Safety bar */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#121215] border border-slate-200/60 dark:border-zinc-800">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-zinc-300">
                Margin of Safety (MOS):
              </span>
              <span className={`font-black text-sm ${
                stock.marginOfSafety >= 10 ? 'text-emerald-600 dark:text-emerald-400' : stock.marginOfSafety <= -10 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {stock.marginOfSafety > 0 ? `+${stock.marginOfSafety}%` : `${stock.marginOfSafety}%`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {stock.marginOfSafety >= 10 
                ? '✓ มีแต้มต่อความปลอดภัยสูง (MOS > 10%) จังหวะสะสมเพื่อการลงทุนระยะยาว' 
                : stock.marginOfSafety < 0 
                ? '⚠ ราคาตลาดสูงกว่ามูลค่าพื้นฐาน ควรใช้ความระมัดระวังหรือรอจังหวะย่อตัว' 
                : '• ราคาเทรดใกล้เคียงมูลค่าพื้นฐาน เหมาะแก่การสวิงเทรดตามกรอบเทคนิค'}
            </p>
          </div>
        </div>

        {/* Interactive Sensitivity Slider Module */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                แบบจำลอง Sensitivity ปรับสมมติฐาน
              </h4>
            </div>
            <button
              onClick={resetSensitivity}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3 mr-0.5" />
              <span>รีเซ็ต</span>
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-300 mb-1">
                <span>คาดการณ์อัตราเติบโตกำไร (Growth Rate):</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{growthRate}%</span>
              </div>
              <input
                type="range"
                min="-10"
                max="40"
                step="1"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-300 mb-1">
                <span>Target P/E สมมติฐาน:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{targetPE}x</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="0.5"
                value={targetPE}
                onChange={(e) => setTargetPE(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">มูลค่าคำนวณใหม่ (Custom Fair Value)</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {customValuation.fairValue} {stock.currency}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">MOS</span>
                <span className={`text-xs font-extrabold ${customValuation.marginOfSafety >= 10 ? 'text-emerald-500 dark:text-emerald-400' : customValuation.marginOfSafety < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'}`}>
                  {customValuation.marginOfSafety >= 0 ? '+' : ''}{customValuation.marginOfSafety}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Moats vs Key Business Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths / Moats */}
        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/10">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
              จุดแข็ง & ความได้เปรียบในการแข่งขัน (Moats)
            </h4>
          </div>

          <ul className="space-y-2">
            {stock.strengths.map((item, index) => (
              <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks / Watchouts */}
        <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/10">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-rose-900 dark:text-rose-300">
              ความเสี่ยงสำคัญที่ต้องติดตาม (Key Risks)
            </h4>
          </div>

          <ul className="space-y-2">
            {stock.risks.map((item, index) => (
              <li key={index} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
