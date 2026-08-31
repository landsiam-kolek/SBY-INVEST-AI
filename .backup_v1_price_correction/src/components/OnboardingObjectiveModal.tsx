import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Coins, 
  Building2, 
  Globe2, 
  Check, 
  ArrowRight, 
  Sliders, 
  Bot,
  Clock,
  Target,
  DollarSign,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { AssetCategory, InvestmentGoal, RiskProfile, InvestmentPeriod, InvestorProfile } from '../types';

interface OnboardingObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  initialProfile?: InvestorProfile;
  onSaveProfileAndLaunchAI: (profile: InvestorProfile) => void;
  onSaveProfileAndGoDashboard: (profile: InvestorProfile) => void;
}

export const OnboardingObjectiveModal: React.FC<OnboardingObjectiveModalProps> = ({
  isOpen,
  onClose,
  username,
  initialProfile,
  onSaveProfileAndLaunchAI,
  onSaveProfileAndGoDashboard,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [objective, setObjective] = useState<InvestmentGoal>(initialProfile?.objective || 'GROWTH_MOMENTUM');
  const [board, setBoard] = useState<AssetCategory>(initialProfile?.preferredBoard || 'ALL');
  const [capital, setCapital] = useState<number>(initialProfile?.capital || 200000);
  const [targetReturn, setTargetReturn] = useState<number>(initialProfile?.targetReturnPercent || 18);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(initialProfile?.riskProfile || 'MODERATE');
  const [period, setPeriod] = useState<InvestmentPeriod>(initialProfile?.period || '6_12_MONTHS');

  if (!isOpen) return null;

  const currentProfile: InvestorProfile = {
    capital,
    currency: 'THB',
    targetReturnPercent: targetReturn,
    riskProfile,
    period,
    preferredBoard: board,
    objective,
  };

  const handleLaunchAI = () => {
    onSaveProfileAndLaunchAI(currentProfile);
    onClose();
  };

  const handleGoDashboard = () => {
    onSaveProfileAndGoDashboard(currentProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col relative text-slate-900 dark:text-[#E4E4E7]">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
              S
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center space-x-2">
                <span>ยินดีต้อนรับคุณ {username || 'นักลงทุน'}!</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                  ขั้นตอนที่ {step}/3
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                กรุณาระบุวัตถุประสงค์และกระดานลงทุน เพื่อให้ระบบและ AI Advisor จัดพอร์ตอย่างแม่นยำ
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full my-4 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {/* STEP 1: วัตถุประสงค์การลงทุน (Investment Objective) */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <span>1. วัตถุประสงค์หลักในการลงทุนของคุณคืออะไร?</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                เลือกแนวทางที่ตรงกับเป้าหมายทางการเงินของคุณที่สุด
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Option 1: Dividend & Value */}
              <button
                type="button"
                onClick={() => {
                  setObjective('DIVIDEND_VALUE');
                  setRiskProfile('CONSERVATIVE');
                  setTargetReturn(10);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  objective === 'DIVIDEND_VALUE'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    💰
                  </div>
                  {objective === 'DIVIDEND_VALUE' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  เน้นปันผล & เติบโตมั่นคง
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  เน้นหุ้นผูกขาด มีกระแสเงินสดสูง ปันผล 4-7% ต่อปี ปลอดภัยสูง MOS กว้าง
                </div>
                <div className="mt-2.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  ความเสี่ยงต่ำ-ปานกลาง • เป้า 8-12%/ปี
                </div>
              </button>

              {/* Option 2: High Growth & Momentum */}
              <button
                type="button"
                onClick={() => {
                  setObjective('GROWTH_MOMENTUM');
                  setRiskProfile('MODERATE');
                  setTargetReturn(18);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  objective === 'GROWTH_MOMENTUM'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    🚀
                  </div>
                  {objective === 'GROWTH_MOMENTUM' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  เน้นเติบโตสูง & โมเมนตัมเทคนิค
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  คัดหุ้นผู้นำเทรนด์ AI, Tech, Breakout กราฟสวย และกำไรโตโดดเด่น
                </div>
                <div className="mt-2.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                  ความเสี่ยงปานกลาง-สูง • เป้า 15-25%/ปี
                </div>
              </button>

              {/* Option 3: Capital Preservation & DCA */}
              <button
                type="button"
                onClick={() => {
                  setObjective('CAPITAL_PRESERVATION');
                  setRiskProfile('CONSERVATIVE');
                  setTargetReturn(12);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  objective === 'CAPITAL_PRESERVATION'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    🛡️
                  </div>
                  {objective === 'CAPITAL_PRESERVATION' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  รักษาเงินต้น & DCA ระยะยาว
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  สะสมสินทรัพย์พื้นฐานแกร่งระดับโลก ทยอย DCA รายเดือน ไม่กังวลตลาดผันผวน
                </div>
                <div className="mt-2.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  เน้นวินัยระยะยาว • เป้า 10-15%/ปี
                </div>
              </button>

              {/* Option 4: Active Multi-Asset Trading */}
              <button
                type="button"
                onClick={() => {
                  setObjective('ACTIVE_TRADING');
                  setRiskProfile('AGGRESSIVE');
                  setTargetReturn(28);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  objective === 'ACTIVE_TRADING'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  {objective === 'ACTIVE_TRADING' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  เก็งกำไร & ซิ่ง Forex / ทองคำ
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  เน้นรอบสวิงเทรด สัญญาณทางเทคนิคไว ทองคำ XAU/USD และหุ้น Alpha สูง
                </div>
                <div className="mt-2.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  ความเสี่ยงสูง • เป้า 25-35%+/ปี
                </div>
              </button>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center space-x-2 shadow-sm transition-all"
              >
                <span>ถัดไป: เลือกกระดานลงทุน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: เลือกกระดานลงทุน (Select Market Board) */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>2. เลือกกระดานลงทุนที่ต้องการจัดพอร์ต:</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                เลือกตลาดที่ต้องการให้ AI ช่วยคัดเลือกหุ้นและสินทรัพย์เข้าพอร์ต
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Board 1: Thai Stocks */}
              <button
                type="button"
                onClick={() => setBoard('THAI_STOCK')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  board === 'THAI_STOCK'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">🇹🇭</div>
                  {board === 'THAI_STOCK' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  กระดานหุ้นไทย (SET / mai)
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  CPALL, DELTA, ADVANC, BDMS, PTT, GULF, KBANK
                </div>
                <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  ไม่มีความเสี่ยงอัตราแลกเปลี่ยน • ปันผลสม่ำเสมอ
                </div>
              </button>

              {/* Board 2: US / Global Stocks */}
              <button
                type="button"
                onClick={() => setBoard('GLOBAL_STOCK')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  board === 'GLOBAL_STOCK'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">🌐</div>
                  {board === 'GLOBAL_STOCK' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  กระดานหุ้นต่างประเทศ (US / Global)
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  NVDA, MSFT, AAPL, TSLA, GOOGL, META, AMZN
                </div>
                <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  เติบโตไปกับนวัตกรรม AI โลก • Market Cap มหาศาล
                </div>
              </button>

              {/* Board 3: Forex & Gold */}
              <button
                type="button"
                onClick={() => setBoard('FOREX')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  board === 'FOREX'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">💱</div>
                  {board === 'FOREX' && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  กระดาน Forex & ทองคำ (Commodities / FX)
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  XAU/USD (ทองคำ), EUR/USD, USD/JPY, GBP/USD
                </div>
                <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                  สภาพคล่องสูงที่สุดในโลก • เทรดได้ทั้ง 2 ฝั่ง (Long/Short)
                </div>
              </button>

              {/* Board 4: All Markets */}
              <button
                type="button"
                onClick={() => setBoard('ALL')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  board === 'ALL'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">✨</div>
                  {board === 'ALL' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  ผสมผสานทุกกระดาน (All-Round Portfolio)
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  ผสมหุ้นไทย + หุ้นนอกบิ๊กเทค + ทองคำ XAU/USD
                </div>
                <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  การกระจายความเสี่ยงขั้นสูงสุด (Ultimate Diversification)
                </div>
              </button>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center space-x-2 shadow-sm transition-all"
              >
                <span>ถัดไป: กำหนดเงินทุน & Period</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: เงินทุน, ความต้องการกำไร, ความเสี่ยง & Period */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-indigo-500" />
                <span>3. ระบุเงินทุน, เป้าหมายกำไร, ความเสี่ยง & Period เฝ้าติดตาม:</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                AI Advisor จะนำข้อมูลนี้ไปคำนวณสัดส่วนหุ้น 5-8 ตัวพร้อมจำนวนหุ้นที่ต้องซื้อ
              </p>
            </div>

            {/* Capital Input */}
            <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                  💵 วงเงินที่จะนำมาลงทุน (Investment Capital):
                </label>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {capital.toLocaleString()} บาท (THB)
                </span>
              </div>

              {/* Quick Capital Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[50000, 100000, 300000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCapital(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      capital === amt
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`} บาท
                  </button>
                ))}
              </div>
            </div>

            {/* Target Return & Risk Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Return */}
              <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">
                    🎯 เป้าหมายกำไรที่ต้องการ:
                  </label>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    +{targetReturn}% / ปี
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
                  <span>8% (ปลอดภัย)</span>
                  <span>20% (เติบโต)</span>
                  <span>40% (สูงสุด)</span>
                </div>
              </div>

              {/* Risk Tolerance */}
              <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block">
                  ⚖️ ระดับความเสี่ยงที่รับได้:
                </label>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskProfile(r)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold text-center transition-all ${
                        riskProfile === r
                          ? r === 'CONSERVATIVE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : r === 'MODERATE'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      {r === 'CONSERVATIVE' ? '🟢 ต่ำ' : r === 'MODERATE' ? '🟡 กลาง' : '🔴 สูง'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Investment Period / Horizon */}
            <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>⏳ Period เฝ้าติดตามการลงทุน (Investment Horizon):</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { id: '1_3_MONTHS', label: '1 - 3 เดือน', desc: 'สวิงเทรดระยะสั้น' },
                  { id: '3_6_MONTHS', label: '3 - 6 เดือน', desc: 'รอบผลประกอบการ' },
                  { id: '6_12_MONTHS', label: '6 - 12 เดือน', desc: 'รอบ 1 ปี Core Port' },
                  { id: '1_3_YEARS', label: '1 - 3 ปี', desc: 'DCA ระยะยาว' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as InvestmentPeriod)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      period === p.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold'
                        : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium'
                    }`}
                  >
                    <div className="text-xs">{p.label}</div>
                    <div className="text-[10px] opacity-75">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: AI Launch vs Go to Dashboard */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
              <button
                type="button"
                onClick={handleLaunchAI}
                id="launch-ai-portfolio-btn"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
                <span>ให้ AI Advisor จัดหุ้นเข้าพอร์ต 5-8 ตัวทันที</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleGoDashboard}
                  className="text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
                >
                  เข้าสู่แดชบอร์ดวิเคราะห์รายตัวโดยตรง
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
