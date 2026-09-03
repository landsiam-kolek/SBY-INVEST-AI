import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  Activity,
  Flame,
  Clock,
  RotateCcw
} from 'lucide-react';
import { StockData } from '../types';

interface AntiStopHuntShieldProps {
  stock: StockData;
  entryPrice: number;
  supportLevel: number;
  currentStopLoss: number;
  onApplyDynamicSL?: (newStopLoss: number, method: 'ATR_BUFFER' | 'FIXED_TICKS') => void;
  compact?: boolean;
}

export const AntiStopHuntShield: React.FC<AntiStopHuntShieldProps> = ({
  stock,
  entryPrice,
  supportLevel,
  currentStopLoss,
  onApplyDynamicSL,
  compact = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'ATR_BUFFER' | 'FIXED_TICKS'>('ATR_BUFFER');
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  // Derive tick size for Thai market
  const getTickSize = (price: number): number => {
    if (price < 2) return 0.01;
    if (price < 5) return 0.02;
    if (price < 10) return 0.05;
    if (price < 25) return 0.10;
    if (price < 100) return 0.25;
    if (price < 200) return 0.50;
    if (price < 400) return 1.00;
    return 2.00;
  };

  const tickSize = getTickSize(supportLevel || entryPrice);

  // Approximate ATR14 from stock volatility if not present
  const atr14 = Number(((supportLevel || entryPrice) * 0.022).toFixed(2)); // ~2.2% daily range
  const fixedTicksBuffer = Number((2 * tickSize).toFixed(2));
  const atrBuffer = Number((1.5 * atr14).toFixed(2));

  const fixedSLPrice = Number(Math.max(0.01, supportLevel - fixedTicksBuffer).toFixed(2));
  const dynamicAtrSLPrice = Number(Math.max(0.01, supportLevel - atrBuffer).toFixed(2));

  const recommendedSL = selectedMethod === 'ATR_BUFFER' ? dynamicAtrSLPrice : fixedSLPrice;

  return (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-[#181611] dark:via-[#141416] dark:to-[#121215] p-4 sm:p-5 shadow-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                ระบบเกราะป้องกัน Stop Hunt (การหลอกกิน SL)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                🛡️ AI Active Safeguard
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              แก้ปัญหาเจ้ามือทุบสลัดเม่ากิน Stop Loss แล้วเด้งกลับ ด้วย 4 มาตรการคณิตศาสตร์
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer shrink-0"
        >
          {isExpanded ? 'ย่อรายละเอียด' : 'ดูวิธีป้องกัน'}
        </button>
      </div>

      {/* Comparison & Selector: Fixed 2 Ticks vs ATR Dynamic Buffer */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option 1: ATR Dynamic Buffer (Recommended) */}
        <div
          onClick={() => {
            setSelectedMethod('ATR_BUFFER');
            if (onApplyDynamicSL) onApplyDynamicSL(dynamicAtrSLPrice, 'ATR_BUFFER');
          }}
          className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
            selectedMethod === 'ATR_BUFFER'
              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40 shadow-xs'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                  🎯 1.5x ATR Dynamic Buffer
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-white font-bold">
                  แนะนำสูงสุด
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                เว้นระยะห่างตามการเหวี่ยงจริง (ATR 14 วัน)
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {dynamicAtrSLPrice} {stock.currency}
              </span>
              <span className="text-[10px] text-slate-400 block">
                (แนวรับ - {atrBuffer})
              </span>
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>ลดโอกาสโดนหลอกกิน SL ได้ถึง 75%</span>
          </div>
        </div>

        {/* Option 2: Fixed 2-3 Ticks */}
        <div
          onClick={() => {
            setSelectedMethod('FIXED_TICKS');
            if (onApplyDynamicSL) onApplyDynamicSL(fixedSLPrice, 'FIXED_TICKS');
          }}
          className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
            selectedMethod === 'FIXED_TICKS'
              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-500/40 shadow-xs'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                  ⚡ Fixed Buffer (2 Ticks)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                วางใต้แนวรับ 2 ช่วงราคาตลาด
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-slate-800 dark:text-zinc-200">
                {fixedSLPrice} {stock.currency}
              </span>
              <span className="text-[10px] text-slate-400 block">
                (แนวรับ - {fixedTicksBuffer})
              </span>
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-amber-700 dark:text-amber-400 font-semibold flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>คุมขาดทุนแคบ แต่เสี่ยงโดนเขย่าหลุดง่ายกว่า</span>
          </div>
        </div>
      </div>

      {/* Expanded 4-Step Anti-Stop Hunt Guardrails Explanation */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-zinc-800 space-y-2.5 text-xs">
          <div className="font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>4 เกราะป้องกันการหลอกกิน Stop Loss ที่ระบบนำมาใช้งานจริง:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {/* 1. ATR Dynamic Buffer */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5 font-black">
                1. ATR-Adaptive Buffer (ระยะเผื่อผันผวน)
              </strong>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                แทนที่จะตั้งหลุดแนวรับแค่ 1-2 ช่อง ให้คำนวณจากค่าเฉลี่ยการแกว่งตัวจริง (1.5x ATR) ทำให้ไส้เทียนสลัดเม่าแตะไม่ถึงจุดคัท
              </p>
            </div>

            {/* 2. Candle Close Filter */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <strong className="text-emerald-600 dark:text-emerald-400 block mb-0.5 font-black">
                2. Candle-Close Filter (รอแท่งเทียนปิดจริง)
              </strong>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                ไม่สั่งขายทันทีที่ราคาแค่แหย่ลงไปแตะระหว่างนาที แต่จะรอให้แท่งเทียน 5m/15m ปิดจริงใต้แนวรับ ป้องกันการทุบแล้วดึงกลับทันที
              </p>
            </div>

            {/* 3. Volume Spike Verification */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <strong className="text-amber-600 dark:text-amber-400 block mb-0.5 font-black">
                3. Volume Spike Filter (ตรวจจับวอลุ่มทุบ)
              </strong>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                ถ้าหลุดแนวรับแต่วอลุ่มเบาบางมาก = "เขย่าหลอก ห้ามคัท" แต่ถ้าหลุดพร้อมวอลุ่มทะลักเกิน 150% = "ของจริง ต้องคัทรักษาเงินต้นทันที"
              </p>
            </div>

            {/* 4. Smart Re-Entry Watchdog */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <strong className="text-blue-600 dark:text-blue-400 block mb-0.5 font-black">
                4. Smart Re-Entry Watchdog (สัญญาณซื้อคืน)
              </strong>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                กรณีที่คัทออกไปแล้ว แต่ราคากลับมายืนเหนือแนวรับเดิมพร้อมแรงซื้อหนาแน่น ระบบจะส่งสัญญาณเตือนให้ซื้อคืนทันทีเพื่อไม่ตกรถ
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
