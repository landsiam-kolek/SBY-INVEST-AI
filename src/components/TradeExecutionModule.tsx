import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Percent, 
  Coins, 
  Layers, 
  Save, 
  Bookmark,
  Share2,
  Sparkles,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StockData, PositionSizingInput } from '../types';
import { calculatePositionSizing, formatCurrency, formatNumber } from '../utils/calculations';

interface TradeExecutionModuleProps {
  stock: StockData;
  onSaveToWatchlist: (plan: {
    stock: StockData;
    entryPrice: number;
    stopLossPrice: number;
    targetPrice: number;
  }) => void;
  isSavedInWatchlist: boolean;
  onAddToUserPortfolio?: (position: {
    stock: StockData;
    entryPrice: number;
    shares: number;
    stopLossPrice: number;
    targetPrice: number;
  }) => void;
  onOpenWorkingPaper?: () => void;
}

export const TradeExecutionModule: React.FC<TradeExecutionModuleProps> = ({
  stock,
  onSaveToWatchlist,
  isSavedInWatchlist,
  onAddToUserPortfolio,
  onOpenWorkingPaper,
}) => {
  const [portfolioSize, setPortfolioSize] = useState<number>(500000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(stock.currentPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(stock.stopLossPrice);
  const [targetPrice1, setTargetPrice1] = useState<number>(stock.targetPrice1);
  const [targetPrice2, setTargetPrice2] = useState<number>(stock.targetPrice2);
  const [isAddedToMyPortfolio, setIsAddedToMyPortfolio] = useState<boolean>(false);

  // Sync state if current stock changes
  useEffect(() => {
    setEntryPrice(stock.currentPrice);
    setStopLossPrice(stock.stopLossPrice);
    setTargetPrice1(stock.targetPrice1);
    setTargetPrice2(stock.targetPrice2);
  }, [stock.symbol, stock.currentPrice, stock.stopLossPrice, stock.targetPrice1, stock.targetPrice2]);

  const planInput: PositionSizingInput = {
    portfolioSize,
    riskPercent,
    entryPrice,
    stopLossPrice,
    targetPrice1,
    targetPrice2,
  };

  const planResult = calculatePositionSizing(planInput);

  const handleSavePlan = () => {
    onSaveToWatchlist({
      stock,
      entryPrice,
      stopLossPrice,
      targetPrice: targetPrice1,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div id="trade-execution-section" className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm p-5 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Trade Execution & Risk Management Module
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Action Plan & Position Sizing
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              คำนวณขนาดการลงทุน (Position Sizing), ควบคุมความเสี่ยงสูงสุดต่อไม้, และแผนกลยุทธ์การเทรดแบบมืออาชีพ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Launch Working Paper Proposal Modal (Audit Spec #7) */}
          {onOpenWorkingPaper && (
            <button
              onClick={onOpenWorkingPaper}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              title="เปิดตาราง Working Paper Proposal เพื่อวิเคราะห์พอร์ตและลงนามซื้อขายด้วย PIN"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>📋 Working Paper Proposal</span>
            </button>
          )}

          {onAddToUserPortfolio && (
            <button
              onClick={() => {
                onAddToUserPortfolio({
                  stock,
                  entryPrice,
                  shares: Math.max(1, planResult.recommendedShares),
                  stopLossPrice,
                  targetPrice: targetPrice1,
                });
                setIsAddedToMyPortfolio(true);
                setTimeout(() => setIsAddedToMyPortfolio(false), 2500);
                try {
                  confetti({
                    particleCount: 60,
                    spread: 50,
                    origin: { y: 0.8 },
                  });
                } catch (e) {}
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-sm shadow-indigo-600/20 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAddedToMyPortfolio ? 'เพิ่มลงพอร์ตแล้ว ✓' : '+ เพิ่มลงพอร์ตติดตามเอง'}</span>
            </button>
          )}

          <button
            onClick={handleSavePlan}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all ${
              isSavedInWatchlist
                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isSavedInWatchlist ? 'ใน Watchlist ✓' : 'เซฟลง Watchlist'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculator Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-slate-50/70 dark:bg-[#18181B]/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center space-x-1.5 mb-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>ตั้งค่าพอร์ตและความเสี่ยง (Risk Parameters)</span>
          </h4>

          {/* Portfolio Size Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              ขนาดพอร์ตเงินลงทุนรวม ({stock.currency})
            </label>
            <div className="relative">
              <input
                type="number"
                value={portfolioSize}
                onChange={(e) => setPortfolioSize(Math.max(1000, Number(e.target.value)))}
                step="50000"
                className="w-full pl-3 pr-12 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121215] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-zinc-500">
                {stock.currency}
              </span>
            </div>
            {/* Quick Chips */}
            <div className="flex gap-1.5 mt-1.5">
              {[100000, 300000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPortfolioSize(amt)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    portfolioSize === amt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {(amt / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
          </div>

          {/* Risk Per Trade % */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              <span>ความเสี่ยงสูงสุดต่อไม้ (Max Risk %):</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{riskPercent}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
              <span>0.5% (อนุรักษนิยม)</span>
              <span>1.5% (มาตรฐาน)</span>
              <span>5.0% (เชิงรุก)</span>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-zinc-800 pt-3 space-y-3">
            {/* Entry Price */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                <span>ราคาเข้าซื้อเป้าหมาย (Entry Price)</span>
                <button
                  onClick={() => setEntryPrice(stock.currentPrice)}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  ใช้ราคาตลาด ({stock.currentPrice})
                </button>
              </div>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                step="0.25"
                className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121215] text-slate-900 dark:text-white"
              />
            </div>

            {/* Stop Loss Price */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                <span>จุดตัดขาดทุน (Stop Loss)</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  {(((stopLossPrice - entryPrice) / entryPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                step="0.25"
                className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#121215] text-rose-600 dark:text-rose-400"
              />
            </div>

            {/* Target 1 (TP1) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <span>เป้าหมายทำกำไร 1 (Target 1)</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  +{(((targetPrice1 - entryPrice) / entryPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="number"
                value={targetPrice1}
                onChange={(e) => setTargetPrice1(Number(e.target.value))}
                step="0.25"
                className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#121215] text-emerald-600 dark:text-emerald-400"
              />
            </div>

            {/* Target 2 (TP2) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <span>เป้าหมายทำกำไร 2 (Target 2)</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  +{(((targetPrice2 - entryPrice) / entryPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="number"
                value={targetPrice2}
                onChange={(e) => setTargetPrice2(Number(e.target.value))}
                step="0.25"
                className="w-full px-3 py-1.5 text-sm font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#121215] text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Sizing Calculation Outputs & Execution Checklist (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Key Output Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Recommended Shares */}
            <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block mb-1">
                จำนวนหุ้นที่แนะนำซื้อ
              </span>
              <div className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-white">
                {planResult.recommendedShares.toLocaleString()} <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">หุ้น</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                {stock.market === 'SET' ? '(ปัดตาม Lot 100 หุ้น)' : ''}
              </span>
            </div>

            {/* Capital Allocation */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                มูลค่าเงินลงทุนรวม
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(planResult.totalCapitalRequired, stock.currency)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                คิดเป็น {planResult.capitalPercent}% ของพอร์ต
              </span>
            </div>

            {/* Max Risk / Loss */}
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/10">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block mb-1">
                ความเสี่ยงขาดทุนสูงสุด
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(planResult.maxRiskAmount, stock.currency)}
              </div>
              <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 block">
                คุมความเสี่ยง {riskPercent}% เป๊ะ
              </span>
            </div>

            {/* Risk / Reward Ratio TP1 */}
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
                Risk / Reward (TP1)
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                1 : {planResult.riskRewardRatio1}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 block">
                {planResult.riskRewardRatio1 >= 2 ? '✓ อัตราคุ้มค่ามาก' : '⚠️ ระวัง R:R ต่ำ'}
              </span>
            </div>

            {/* Expected Profit TP1 */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                กำไรคาดหวังที่ TP1
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(planResult.expectedProfit1, stock.currency)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                +{(((targetPrice1 - entryPrice) / entryPrice) * 100).toFixed(1)}% จากทุน
              </span>
            </div>

            {/* Expected Profit TP2 */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                กำไรคาดหวังที่ TP2
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(planResult.expectedProfit2, stock.currency)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                R:R 1 : {planResult.riskRewardRatio2}
              </span>
            </div>
          </div>

          {/* Visual Risk vs Reward Bar */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200/80 dark:border-zinc-800">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-2">
              <span className="text-rose-500 flex items-center space-x-1">
                <span>ความเสี่ยง (Risk: -{planResult.riskPerShare} {stock.currency})</span>
              </span>
              <span className="text-emerald-500 flex items-center space-x-1">
                <span>ผลตอบแทน (Reward: +{planResult.rewardPerShare1} {stock.currency})</span>
              </span>
            </div>
            
            <div className="w-full h-3 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.max(10, Math.min(50, (1 / (1 + planResult.riskRewardRatio1)) * 100))}%`,
                }}
                title="สัดส่วนความเสี่ยง"
              ></div>
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.max(50, Math.min(90, (planResult.riskRewardRatio1 / (1 + planResult.riskRewardRatio1)) * 100))}%`,
                }}
                title="สัดส่วนผลตอบแทน"
              ></div>
            </div>
          </div>

          {/* Execution Game Plan Checklist (แผนกลยุทธ์ปฏิบัติการ 4 ขั้นตอน) */}
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-zinc-800 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20 dark:from-[#18181B] dark:via-[#141417] dark:to-[#121215]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-3 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>คู่มือแผนการเทรดแบบเป็นระบบ (Systematic Execution Rules)</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-zinc-300">
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">จังหวะเข้าซื้อ (Entry Trigger):</strong>{' '}
                  ตั้งคำสั่งซื้อ Buy Limit ที่ราคา {entryPrice} {stock.currency} หรือรอให้แท่งเทียนยืนเหนือแนวรับ {stock.support1} อย่างมั่นคง
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">วินัยการ Stop Loss:</strong>{' '}
                  ตั้งคำสั่ง Stop Order ทันทีที่ {stopLossPrice} {stock.currency} (ยอมเสียสูงสุด {formatCurrency(planResult.maxRiskAmount, stock.currency)}) เพื่อป้องกันเงินต้น
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">การล็อกกำไร (Take Profit Strategy):</strong>{' '}
                  แบ่งขาย 50% เมื่อราคาถึงเป้าหมาย TP1 ({targetPrice1} {stock.currency}) และเลื่อน Stop Loss ขึ้นมาที่จุดทุน (Breakeven) ส่วนอีก 50% ให้ Run Trend สู่เป้าหมาย TP2 ({targetPrice2} {stock.currency})
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">การทบทวนปัจจัยพื้นฐาน (Fundamental Review):</strong>{' '}
                  หากงบการเงินไตรมาสถัดไปมี ROE หรือกำไรสุทธิโตต่ำกว่าคาด ให้ปรับลด Fair Value และขนาดการลงทุนทันที
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
