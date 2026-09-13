import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  LayoutDashboard, 
  ArrowRight, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Award,
  CheckCircle2,
  X
} from 'lucide-react';

interface BeginnerGuideBannerProps {
  currentView: 'analysis' | 'my-portfolio' | 'portfolio' | 'day-trade' | 'paper-trade' | 'bot-dashboard';
  onChangeView: (view: any) => void;
}

export const BeginnerGuideBanner: React.FC<BeginnerGuideBannerProps> = ({
  currentView,
  onChangeView,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem('sby_guide_dismissed');
      return dismissed !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('sby_guide_dismissed', 'true');
  };

  if (!isOpen) {
    return (
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 transition-all cursor-pointer shadow-xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span>เริ่มต้นอย่างไร? (คู่มือแนะนำ 4 โหมดการใช้งาน)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/60 via-white to-amber-50/30 dark:from-[#131422] dark:via-[#121215] dark:to-[#181611] shadow-xs relative">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            🧭
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              แผนการใช้งาน SBY INVEST AI (แยกหมวดหมู่ตามวัตถุประสงค์ของคุณ)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              เลือกโหมดการใช้งานตามสไตล์การลงทุน หรือซ้อมก่อนจนมั่นใจ 100%
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
          title="ซ่อนคำแนะนำ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Workspace 1: Paper Trading (Simulation) */}
        <div
          onClick={() => onChangeView('paper-trade')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            currentView === 'paper-trade'
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-500 shadow-xs'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-emerald-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>1. ซ้อมเทรดเสมือนจริง</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                1-3 เดือน
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              สำหรับเงินก้อนสุดท้าย ซ้อมเทรดตามราคาจริง หักค่าคอมโบรกเกอร์เป๊ะ เพื่อให้มั่นใจ 100% โดยเงินต้นปลอดภัย
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>เข้าสนามซ้อม</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Workspace 2: AI Portfolio (VI & Retirement) */}
        <div
          onClick={() => onChangeView('portfolio')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            currentView === 'portfolio'
              ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 ring-1 ring-indigo-500 shadow-xs'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-indigo-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>2. AI จัดพอร์ต VI & ปันผล</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                5-8 ตัว
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              เน้นความปลอดภัยสูงสุด หุ้นพื้นฐานดี มีปันผลสม่ำเสมอ คุมเพดานหนี้สิน D/E &lt; 1.5x ไม่เสี่ยงเงินต้น
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
            <span>จัดพอร์ตลงทุน</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Workspace 3: Day Trade & Anti-Stop Hunt */}
        <div
          onClick={() => onChangeView('day-trade')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            currentView === 'day-trade'
              ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-500 shadow-xs'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center space-x-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>3. Day Trade & Anti-Stop Hunt</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                1วัน-1สัปดาห์
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              สัญญาณเก็งกำไรเร็ว พร้อมระบบคำนวณ ATR Buffer และรอแท่งเทียนปิด ป้องกันเจ้ามือหลอกกิน SL
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>เปิดหน้าเทรดสั้น</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Workspace 4: Single Stock Analysis */}
        <div
          onClick={() => onChangeView('analysis')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            currentView === 'analysis'
              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-500 shadow-xs'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:border-blue-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-blue-800 dark:text-blue-300 flex items-center space-x-1">
                <LayoutDashboard className="w-4 h-4 text-blue-500" />
                <span>4. วิเคราะห์หุ้นรายตัว</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                เจาะลึก
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              ตรวจงบการเงิน P/E, ROE, Margin of Safety (MOS), กราฟเทคนิค และคำนวณขนาดไม้ลงทุนรายหุ้น
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center justify-between">
            <span>ดูวิเคราะห์รายตัว</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
