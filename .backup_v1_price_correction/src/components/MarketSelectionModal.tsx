import React, { useState } from 'react';
import { 
  TrendingUp, 
  Globe, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Activity,
  X
} from 'lucide-react';
import { AssetCategory } from '../types';

interface MarketSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: AssetCategory;
  onSelectCategory: (category: AssetCategory) => void;
}

export const MarketSelectionModal: React.FC<MarketSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
}) => {
  const [step, setStep] = useState<'TYPE' | 'STOCK_MARKET'>('TYPE');
  const [chosenType, setChosenType] = useState<'STOCK' | 'FOREX'>('STOCK');

  if (!isOpen) return null;

  const handleChooseType = (type: 'STOCK' | 'FOREX') => {
    setChosenType(type);
    if (type === 'FOREX') {
      onSelectCategory('FOREX');
      onClose();
      setStep('TYPE');
    } else {
      setStep('STOCK_MARKET');
    }
  };

  const handleChooseMarket = (cat: 'THAI_STOCK' | 'GLOBAL_STOCK') => {
    onSelectCategory(cat);
    onClose();
    setStep('TYPE');
  };

  const handleSelectDirect = (cat: AssetCategory) => {
    onSelectCategory(cat);
    onClose();
    setStep('TYPE');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-200 dark:border-indigo-500/20 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ยินดีต้อนรับสู่ SBY Invest AI
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            กรุณาเลือกประเภทและตลาดที่คุณต้องการลงทุน เพื่อให้ระบบปรับแต่งหน้าจอและโมเดลการวิเคราะห์ให้ตรงกับสไตล์ของคุณมากที่สุด
          </p>
        </div>

        {/* Step 1: Stock vs Forex */}
        {step === 'TYPE' && (
          <div className="space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
              ขั้นตอนที่ 1: เลือกลงทุนในสินทรัพย์ประเภทใด?
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Stocks */}
              <button
                onClick={() => handleChooseType('STOCK')}
                className={`group p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between ${
                  selectedCategory === 'THAI_STOCK' || selectedCategory === 'GLOBAL_STOCK'
                    ? 'border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B] hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-between">
                    <span>1. ลงทุนในหุ้น (Stocks)</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    วิเคราะห์พื้นฐานกิจการ งบการเงิน อัตราส่วน P/E, ROE, Fair Value + วางแผนจับจังหวะเทคนิค
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center space-x-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  <span>เลือกต่อ: หุ้นไทย หรือ หุ้นต่างประเทศ</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>

              {/* Option 2: Forex & Gold */}
              <button
                onClick={() => handleChooseType('FOREX')}
                className={`group p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between ${
                  selectedCategory === 'FOREX'
                    ? 'border-amber-500/50 bg-amber-50/40 dark:bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B] hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Coins className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-between">
                    <span>2. Forex & ทองคำ</span>
                    <CheckCircle2 className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    วิเคราะห์ปัจจัยมหภาค (Macroeconomics), ดอกเบี้ยธนาคารกลาง, Sentiment & ทองคำ XAU/USD, EUR/USD
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center space-x-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <span>เข้าสู่หน้าจอ Forex ทันที</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Thai Stock vs Global Stock */}
        {step === 'STOCK_MARKET' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
                ขั้นตอนที่ 2: เลือกลงทุนในตลาดหุ้นใด?
              </div>
              <button
                onClick={() => setStep('TYPE')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                ← ย้อนกลับ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Thai Stocks */}
              <button
                onClick={() => handleChooseMarket('THAI_STOCK')}
                className={`group p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.01] ${
                  selectedCategory === 'THAI_STOCK'
                    ? 'border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B] hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="text-3xl mb-2">🇹🇭</div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  หุ้นไทย (Thai Stocks)
                </h3>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 block mb-2">
                  SET / SET50 / mai (THB)
                </span>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  เช่น CPALL, DELTA, ADVANC, BDMS, PTT, GULF เจาะลึกธุรกิจในไทยและปันผลสูง
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>เลือกตลาดหุ้นไทย</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Global / US Stocks */}
              <button
                onClick={() => handleChooseMarket('GLOBAL_STOCK')}
                className={`group p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.01] ${
                  selectedCategory === 'GLOBAL_STOCK'
                    ? 'border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B] hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="text-3xl mb-2">🌐</div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  หุ้นต่างประเทศ (Global Stocks)
                </h3>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 block mb-2">
                  US / NASDAQ / S&P 500 (USD)
                </span>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  เช่น NVDA, AAPL, MSFT, TSLA หุ้นเติบโตระดับโลก ผู้นำนวัตกรรมและเทคโนโลยี AI
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>เลือกตลาดหุ้นต่างประเทศ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Footer Options */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 dark:text-zinc-500">
            ทางลัดเลือกเร็ว:
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSelectDirect('THAI_STOCK')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold transition-colors"
            >
              🇹🇭 หุ้นไทย
            </button>
            <button
              onClick={() => handleSelectDirect('GLOBAL_STOCK')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold transition-colors"
            >
              🌐 หุ้นนอก
            </button>
            <button
              onClick={() => handleSelectDirect('FOREX')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold transition-colors"
            >
              💱 Forex
            </button>
            <button
              onClick={() => handleSelectDirect('ALL')}
              className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
            >
              ✨ ดูทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
