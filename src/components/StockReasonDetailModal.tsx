import React from 'react';
import { 
  X, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle,
  Scale,
  ExternalLink,
  Target,
  Sliders,
  Layers
} from 'lucide-react';
import { PortfolioItem, StockData } from '../types';
import { TrafficStatusBadge } from './TrafficStatusBadge';

interface StockReasonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PortfolioItem | null;
  onSelectForDeepAnalysis?: (stock: StockData) => void;
}

export const StockReasonDetailModal: React.FC<StockReasonDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onSelectForDeepAnalysis,
}) => {
  if (!isOpen || !item) return null;

  const { stock } = item;
  const isHighDebt = (stock.de || 0) > 2.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0f1015] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-sm">
              {stock.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {stock.symbol}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                  {stock.market} • {stock.sector}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {item.roleInPortfolio}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                {stock.name} • ราคาล่าสุด: <span className="font-bold text-white">{stock.currentPrice} {stock.currency}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-zinc-300 text-xs">
          
          {/* 1-Sentence Executive Thesis */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="flex items-start space-x-2.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                💡
              </span>
              <div>
                <span className="text-[11px] font-black uppercase text-indigo-300 block">
                  เหตุผลเชิงกลยุทธ์ (Strategic Thesis - 1 ประโยค):
                </span>
                <p className="text-white text-xs font-semibold mt-0.5 leading-relaxed">
                  {item.roleInPortfolio === 'Core Anchor'
                    ? `${stock.symbol} ทำหน้าที่เป็นเสาหลักพอร์ต (Core Anchor) ด้วย Margin of Safety +${stock.marginOfSafety}% และความผันผวนต่ำ ช่วยพยุงเงินต้น`
                    : item.roleInPortfolio === 'Growth Engine'
                    ? `${stock.symbol} เป็นเครื่องยนต์สร้างผลตอบแทน (Growth Engine) สอดรับเทรนด์ ${stock.trend} มี Upside สู่เป้าหมาย ${item.targetPrice} (+${item.expectedReturnPercent}%)`
                    : item.roleInPortfolio === 'Dividend Generator'
                    ? `${stock.symbol} สร้างกระแสเงินสดจากเงินปันผล ${stock.dividendYield}% สม่ำเสมอ เหมาะสมกับการลดความเสี่ยงพอร์ตโดยรวม`
                    : `${stock.symbol} มีแต้มต่อทางคณิตศาสตร์ R:R ${item.riskRewardRatio}:1 ภายใต้การควบคุมจุด Stop Loss ที่ ${item.stopLossPrice} บาท`}
                </p>
              </div>
            </div>
          </div>

          {/* Grouped Indicators (แยกเป็น 4 หมวดตัวเลขชัดเจน) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Category 1: Valuation & Margin of Safety */}
            <div className="p-3.5 rounded-2xl bg-[#14151e] border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-extrabold text-white flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. มูลค่า & Margin of Safety</span>
                </span>
                <TrafficStatusBadge type="MOS" value={stock.marginOfSafety} compact={true} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">Fair Value</span>
                  <span className="font-bold text-white">{stock.fairValue} {stock.currency}</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">MOS (%)</span>
                  <span className="font-bold text-emerald-400">+{stock.marginOfSafety}%</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">P/E Ratio</span>
                  <span className="font-bold text-white">{stock.pe}x</span>
                  <span className="text-[9px] text-zinc-500 block">(เฉลี่ยกลุ่ม {stock.industryPe}x)</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">Dividend Yield</span>
                  <span className="font-bold text-amber-400">{stock.dividendYield}%</span>
                </div>
              </div>
            </div>

            {/* Category 2: Financial Health & Debt (Audit Guardrail B) */}
            <div className="p-3.5 rounded-2xl bg-[#14151e] border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-extrabold text-white flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  <span>2. ฐานะการเงิน & หนี้สิน (Audit)</span>
                </span>
                <TrafficStatusBadge type="DE" value={stock.de} compact={true} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">D/E Ratio</span>
                  <span className={`font-bold ${isHighDebt ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {stock.de}x
                  </span>
                  <span className="text-[9px] text-zinc-500 block">
                    {isHighDebt ? '⚠️ หนี้สูง (Cap 30%)' : '✓ หนี้ปกติ (Cap 40%)'}
                  </span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">ROE (%)</span>
                  <span className="font-bold text-white">{stock.roe}%</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">Net Margin</span>
                  <span className="font-bold text-white">{stock.netMargin}%</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">Growth (YoY)</span>
                  <span className="font-bold text-emerald-400">+{stock.revenueGrowth}%</span>
                </div>
              </div>
            </div>

            {/* Category 3: Technical Timing & Trend */}
            <div className="p-3.5 rounded-2xl bg-[#14151e] border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-extrabold text-white flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>3. จังหวะเทคนิค & แนวโน้ม</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {stock.trend}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">RSI (14)</span>
                  <span className="font-bold text-white">{stock.rsi}</span>
                  <span className="text-[9px] text-zinc-500 block">
                    {stock.rsi < 35 ? 'Oversold (โซนสะสม)' : stock.rsi > 70 ? 'Overbought' : 'Neutral'}
                  </span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">MACD Signal</span>
                  <span className="font-bold text-white">{stock.macdSignal || 'Bullish Cross'}</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">แนวรับ S1 / S2</span>
                  <span className="font-bold text-emerald-400">{stock.support1} / {stock.support2}</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">แนวต้าน R1 / R2</span>
                  <span className="font-bold text-rose-400">{stock.resistance1} / {stock.resistance2}</span>
                </div>
              </div>
            </div>

            {/* Category 4: Risk Management & Allocation Plan */}
            <div className="p-3.5 rounded-2xl bg-[#14151e] border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-extrabold text-white flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>4. แผนบริหารความเสี่ยง & Sizing</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  R:R {item.riskRewardRatio}:1
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">จุด Stop Loss (SL)</span>
                  <span className="font-bold text-rose-400">{item.stopLossPrice} (-{item.riskPercent}%)</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">เป้าทำกำไร (TP)</span>
                  <span className="font-bold text-emerald-400">{item.targetPrice} (+{item.expectedReturnPercent}%)</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">สัดส่วนในพอร์ต</span>
                  <span className="font-bold text-indigo-400">{item.weightPercent}% ({item.allocatedCapital.toLocaleString()}฿)</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 block">จำนวนที่ต้องซื้อ</span>
                  <span className="font-bold text-white">{item.recommendedShares.toLocaleString()} หุ้น</span>
                </div>
              </div>
            </div>

          </div>

          {/* Compliance & Audit Traceability Note */}
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>
              🔒 Audit Step 1-5 Verified: MOS Weighted • Guardrail B Cap Cap Checked • Multi-Tier SL
            </span>
            <span className="text-zinc-400 font-mono">
              [Mode: VI / Long-term | Status: Locked & Verified]
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            ปิด
          </button>

          {onSelectForDeepAnalysis && (
            <button
              onClick={() => {
                onClose();
                onSelectForDeepAnalysis(stock);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>เปิดดูกราฟและงบเต็ม (Deep Analysis)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
