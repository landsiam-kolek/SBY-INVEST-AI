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
  Layers,
  Wallet,
  Briefcase,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  HelpCircle,
  Building
} from 'lucide-react';
import { 
  AssetCategory, 
  InvestmentGoal, 
  RiskProfile, 
  InvestmentPeriod, 
  InvestorProfile,
  UserPosition,
  DayTradePortfolio
} from '../types';

interface OnboardingObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  initialProfile?: InvestorProfile;
  userPositions?: UserPosition[];
  dayTradePortfolio?: DayTradePortfolio;
  brokerCash?: number;
  onSaveProfileAndLaunchAI: (profile: InvestorProfile) => void;
  onSaveProfileAndGoDashboard: (profile: InvestorProfile) => void;
}

export const OnboardingObjectiveModal: React.FC<OnboardingObjectiveModalProps> = ({
  isOpen,
  onClose,
  username,
  initialProfile,
  userPositions = [],
  dayTradePortfolio,
  brokerCash = 350000,
  onSaveProfileAndLaunchAI,
  onSaveProfileAndGoDashboard,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [objective, setObjective] = useState<InvestmentGoal>(initialProfile?.objective || 'GROWTH_MOMENTUM');
  const [board, setBoard] = useState<AssetCategory>(initialProfile?.preferredBoard || 'ALL');
  const [capital, setCapital] = useState<number>(initialProfile?.capital || 200000);
  const [customCapitalInput, setCustomCapitalInput] = useState<string>(String(initialProfile?.capital || 200000));
  const [targetReturn, setTargetReturn] = useState<number>(initialProfile?.targetReturnPercent || 18);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(initialProfile?.riskProfile || 'MODERATE');
  const [period, setPeriod] = useState<InvestmentPeriod>(initialProfile?.period || '6_12_MONTHS');
  const [showPortfolioBreakdown, setShowPortfolioBreakdown] = useState<boolean>(true);

  if (!isOpen) return null;

  // Calculate existing portfolios stats
  const existingPositionsCount = userPositions.length;
  const existingHoldingsCost = userPositions.reduce(
    (sum, p) => sum + (p.totalCost || p.shares * p.entryPrice),
    0
  );
  const existingHoldingsValue = userPositions.reduce(
    (sum, p) => sum + p.shares * (p.stockData?.currentPrice || p.entryPrice),
    0
  );
  const existingPnL = existingHoldingsValue - existingHoldingsCost;
  const existingPnLPercent = existingHoldingsCost > 0 ? (existingPnL / existingHoldingsCost) * 100 : 0;
  const dayTradeCapital = dayTradePortfolio?.capital || 100000;
  const dayTradeSetupsCount = dayTradePortfolio?.setups?.length || 0;

  // Capital rule sizing check (STEP 2 from AGENTS.md)
  const getSizingRuleLabel = (amt: number) => {
    if (amt < 50000) {
      return { count: '2 - 3 ตัว', desc: 'งบเริ่มต้น เน้นโฟกัสหุ้นแกร่ง 2-3 ตัว', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    }
    if (amt <= 300000) {
      return { count: '3 - 5 ตัว', desc: 'งบขนาดกลาง กระจายสัดส่วนมาตรฐาน 3-5 ตัว', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' };
    }
    return { count: '5 - 8 ตัว', desc: 'งบขนาดใหญ่ กระจายความเสี่ยงครบ 5-8 ตัว (3+ Sectors)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
  };

  const sizingRule = getSizingRuleLabel(capital);

  const handleCapitalChange = (newVal: number) => {
    const validVal = Math.max(10000, Math.min(100000000, newVal));
    setCapital(validVal);
    setCustomCapitalInput(String(validVal));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCustomCapitalInput(raw);
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      setCapital(num);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-7 flex flex-col relative text-slate-900 dark:text-[#E4E4E7]">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30">
              S
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center space-x-2">
                <span>ยินดีต้อนรับคุณ {username || 'นักลงทุน'}!</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/30">
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
        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full my-3.5 overflow-hidden">
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                  เน้นหุ้นพื้นฐานแข็งแกร่ง หนี้ต่ำ (D/E &lt; 1.0) กระจายออมสม่ำเสมอ
                </div>
                <div className="mt-2.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  ความเสี่ยงต่ำ • เป้า 8-15%/ปี
                </div>
              </button>

              {/* Option 4: Aggressive / Turnaround */}
              <button
                type="button"
                onClick={() => {
                  setObjective('AGGRESSIVE_ALPHA');
                  setRiskProfile('AGGRESSIVE');
                  setTargetReturn(25);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  objective === 'AGGRESSIVE_ALPHA'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  {objective === 'AGGRESSIVE_ALPHA' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  แสวงหา Alpha & Turnaround
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  เน้นหุ้นฟื้นตัว (Turnaround), หุ้นเล็ก mai, Breakout พลังขับเคลื่อนสูง
                </div>
                <div className="mt-2.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  ความเสี่ยงสูง • เป้า 25-40%/ปี
                </div>
              </button>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>ถัดไป: เลือกกระดานลงทุน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: เลือกกระดานลงทุน (Asset Board Selection) */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>2. คุณต้องการให้ AI คัดเลือกหุ้นจากกระดานใด?</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                เลือกตลาดหลักที่ต้องการให้ระบบนำข้อมูลมาวิเคราะห์
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Board 1: Thai Stock (SET / mai) */}
              <button
                type="button"
                onClick={() => setBoard('THAI_STOCK')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                  กระดานหุ้นไทย (SET & mai)
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  CPALL, BDMS, PTT, DELTA, AOT, ADVANC, KBANK ฯลฯ
                </div>
                <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  รองรับการคำนวณ MOS, P/E, ปันผล และ Valuation หุ้นไทยครบวงจร
                </div>
              </button>

              {/* Board 2: US / Global Stock */}
              <button
                type="button"
                onClick={() => setBoard('GLOBAL_STOCK')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>ถัดไป: กำหนดเงินทุน & Period</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: เงินทุน, แจกแจงสถานะพอร์ตเดิม, ความเสี่ยง & Period */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-indigo-500" />
                <span>3. ระบุวงเงินสำหรับสร้างแผนพอร์ตชุดนี้ & เป้าหมายกำไร:</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                AI Advisor จะนำวงเงินนี้ไปคำนวณสัดส่วน % และจำนวนหุ้น 2-8 ตัวอย่างแม่นยำ
              </p>
            </div>

            {/* Multi-Portfolio Breakdown Summary Card */}
            <div className="bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    📊 สรุปภาพรวมยอดเงินในแต่ละพอร์ตของคุณ ณ ปัจจุบัน:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPortfolioBreakdown(!showPortfolioBreakdown)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <span>{showPortfolioBreakdown ? 'ย่อสรุป' : 'ดูแจกแจงพอร์ต'}</span>
                  {showPortfolioBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showPortfolioBreakdown && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 animate-in fade-in duration-150">
                  {/* Portfolio 1: My Portfolio Holdings */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col justify-between space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-700 dark:text-zinc-200 flex items-center space-x-1">
                        <span>📦</span>
                        <span>1. พอร์ตถือจริง (My Holdings)</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-bold">
                        {existingPositionsCount} ตัว
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      ฿{existingHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>ต้นทุน: ฿{existingHoldingsCost.toLocaleString()}</span>
                      <span className={`font-bold ${existingPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {existingPnL >= 0 ? '+' : ''}{existingPnLPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Portfolio 2: Day Trade Plan */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col justify-between space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-700 dark:text-zinc-200 flex items-center space-x-1">
                        <span>⚡</span>
                        <span>2. พอร์ต Day Trade</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                        {dayTradeSetupsCount} ตัว
                      </span>
                    </div>
                    <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                      ฿{dayTradeCapital.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      แผนเทรดสั้น 1-3 วัน (วาง SL ราย Tick)
                    </div>
                  </div>

                  {/* Portfolio 3: Broker Cash Balance */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 flex flex-col justify-between space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-700 dark:text-zinc-200 flex items-center space-x-1">
                        <span>🏦</span>
                        <span>3. บัญชีโบรกเกอร์ (Cash Line)</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                        พร้อมเทรด
                      </span>
                    </div>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ฿{brokerCash.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      วงเงินสดจำลองบัญชีซื้อขาย
                    </div>
                  </div>
                </div>
              )}

              {/* Capital Isolation Explanation Banner */}
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed space-y-1">
                <div className="font-extrabold flex items-center space-x-1.5 text-indigo-700 dark:text-indigo-300">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>💡 ทำความเข้าใจเรื่องวงเงินที่กรอกนี้ (Capital Isolation Policy):</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-zinc-300 text-[10.5px]">
                  <li>
                    <strong>วงเงินนี้คืออะไร:</strong> เป็นงบเป้าหมายสำหรับให้ <strong>AI Advisor</strong> คำนวณขนาดไม้ (Sizing) และสัดส่วนหุ้นสำหรับ <strong>แผนพอร์ต AI ชุดใหม่นี้</strong>
                  </li>
                  <li>
                    <strong>ไม่รวม/ไม่กระทบพอร์ตเดิม:</strong> ยอดเงินนี้ <u>แยกเป็นอิสระ</u> ไม่ได้นำไปรวมหรือหักลบออกจากพอร์ตถือจริง (My Holdings) หรือพอร์ต Day Trade
                  </li>
                  <li>
                    <strong>ทำไมยอดเงินแต่ละพอร์ตไม่เท่ากัน:</strong> ระบบออกแบบแยกพอร์ตตามกลยุทธ์ (VI / Day Trade / ถือจริง) เพื่อให้คุณบริหารความเสี่ยงได้อย่างชัดเจน
                  </li>
                </ul>
              </div>
            </div>

            {/* Capital Input Section */}
            <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>💵 วงเงินเป้าหมายสำหรับพอร์ต AI นี้ (Target Investment Capital):</span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    พิมพ์ระบุจำนวนเงิน หรือกดปุ่มดึงยอดเงินอัตโนมัติด้านล่าง
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">฿</span>
                    <input
                      type="text"
                      value={customCapitalInput}
                      onChange={handleCustomInputChange}
                      className="w-36 pl-7 pr-3 py-1.5 text-right font-black text-sm rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">บาท</span>
                </div>
              </div>

              {/* Dynamic Sizing Rule Feedback */}
              <div className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${sizingRule.color}`}>
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-bold">กฎการจัดสรรหุ้น AI (STEP 2):</span>
                  <span>{sizingRule.desc}</span>
                </div>
                <span className="font-black px-2 py-0.5 rounded-lg bg-white/40 dark:bg-black/30 shrink-0">
                  {sizingRule.count}
                </span>
              </div>

              {/* Smart Quick-Fill from other portfolios */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center space-x-1">
                  <span>⚡ ดึงยอดเงินจากพอร์ตอื่นอย่างรวดเร็ว (Smart Autofill):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {existingHoldingsValue > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCapitalChange(Math.round(existingHoldingsValue))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <span>📦 ใช้วงเงินเท่าพอร์ตจริง:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">฿{Math.round(existingHoldingsValue).toLocaleString()}</span>
                    </button>
                  )}
                  {brokerCash > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCapitalChange(brokerCash)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <span>🏦 ใช้เงินสดโบรกเกอร์:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">฿{brokerCash.toLocaleString()}</span>
                    </button>
                  )}
                  {dayTradeCapital > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCapitalChange(dayTradeCapital)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <span>⚡ เท่าพอร์ต Day Trade:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">฿{dayTradeCapital.toLocaleString()}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Capital Preset Buttons & Adjusters */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
                <div className="flex flex-wrap gap-1">
                  {[50000, 100000, 200000, 300000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleCapitalChange(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        capital === amt
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleCapitalChange(capital - 50000)}
                    disabled={capital <= 10000}
                    className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 cursor-pointer"
                    title="ลด 50,000 บาท"
                  >
                    -50k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapitalChange(capital - 10000)}
                    disabled={capital <= 10000}
                    className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 cursor-pointer"
                    title="ลด 10,000 บาท"
                  >
                    -10k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapitalChange(capital + 10000)}
                    className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                    title="เพิ่ม 10,000 บาท"
                  >
                    +10k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapitalChange(capital + 50000)}
                    className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                    title="เพิ่ม 50,000 บาท"
                  >
                    +50k
                  </button>
                </div>
              </div>
            </div>

            {/* Target Return & Risk Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Return */}
              <div className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
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
              <div className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block">
                  ⚖️ ระดับความเสี่ยงที่รับได้:
                </label>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskProfile(r)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
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
            <div className="bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
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
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      period === p.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-extrabold ring-1 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium hover:border-slate-300'
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
                  className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleGoDashboard}
                  className="text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
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
