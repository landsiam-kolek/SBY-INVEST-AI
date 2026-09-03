import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Bot, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { SataRobotLogo } from './SataRobotLogo';

interface SbyIntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SbyIntroductionModal: React.FC<SbyIntroductionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#0f1015] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 py-5 border-b border-zinc-800/80 bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-blue-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <SataRobotLogo size={32} glow={true} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  ทำไมต้องใช้ SBY INVEST AI?
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  คู่มือผู้ใช้ใหม่
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                ระบบช่วยคิด คัดกรองหุ้น และเกราะคุ้มกันเงินทุนด้วย Real-Time Data & SBY BOT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-zinc-300 text-sm leading-relaxed">
          
          {/* Main Key Quote Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-indigo-900/20 to-blue-950/50 border border-indigo-500/30 relative overflow-hidden">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-sm sm:text-base">
                  &ldquo;ในตลาดหุ้น คนส่วนใหญ่ไม่ได้ขาดทุนเพราะไม่มีความรู้ แต่ขาดทุนเพราะ &apos;อารมณ์&apos; การตัดสินใจช้า และไม่มีเกราะป้องกันเงินต้นที่รัดกุมพอ&rdquo;
                </p>
                <p className="text-xs text-indigo-200/80 mt-1">
                  ไม่ว่าคุณจะเป็นมือใหม่ที่ไม่เคยเปิดพอร์ต หรือนักลงทุนที่บริหารเงินก้อนสำคัญของชีวิต — SBY INVEST AI คือสมองกลและผู้จัดการความเสี่ยงส่วนตัวที่อยู่เคียงข้างคุณตลอดเวลา
                </p>
              </div>
            </div>
          </div>

          {/* Core Feature 1: Real-Time & SBY BOT (New User Key Highlights) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Highlight 1: Real-Time */}
            <div className="p-4 rounded-2xl bg-[#14151d] border border-blue-500/30 hover:border-blue-500/50 transition-all">
              <div className="flex items-center space-x-2.5 mb-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                    <span>ราคาหุ้นแบบ Real-Time สด</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 font-bold">Intraday</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">อัปเดตราคาตลาดวินาทีต่อวินาที</p>
                </div>
              </div>
              <p className="text-xs text-zinc-300">
                ไม่ต้องรอราคาปิดสิ้นวัน ระบบรับและประมวลผลราคาหุ้นสดแบบ Real-Time ทำให้คำนวณจุดเข้าซื้อ, ระดับแนวรับ-แนวต้าน และจุด Stop Loss สอดคล้องกับพฤติกรรมราคาจริงในตลาด ณ วินาทีนั้นทันที
              </p>
            </div>

            {/* Highlight 2: SBY BOT */}
            <div className="p-4 rounded-2xl bg-[#14151d] border border-purple-500/30 hover:border-purple-500/50 transition-all">
              <div className="flex items-center space-x-2.5 mb-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center space-x-1.5">
                    <span>เทรดด้วย SBY BOT อัจฉริยะ</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold">Auto Discipline</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">ส่งคำสั่งแม่นยำ ไร้อารมณ์ รัดกุม</p>
                </div>
              </div>
              <p className="text-xs text-zinc-300">
                มีหุ่นยนต์ SBY BOT คอยเฝ้าตลาดและส่งคำสั่งซื้อขายตามวินัยแผนกลยุทธ์อย่างแม่นยำ ไม่มีความลังเล ไม่กลัว ไม่โลภ พร้อมระบบ Human-in-the-Loop ที่ต้องยืนยันด้วยรหัส PIN ของคุณเสมอ
              </p>
            </div>
          </div>

          {/* Section 2: AI Thinking & Value Investing (VI) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>1. AI ช่วยคิดและคำนวณแทนคุณ ไม่ต้องนั่งแกะงบการเงิน</span>
            </h4>
            <div className="p-4 rounded-2xl bg-[#13141b] border border-zinc-800 space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">คัดกรองหุ้นพื้นฐานแกร่งอัตโนมัติ:</strong> วิเคราะห์โครงสร้างทางการเงิน ตรวจสอบอัตราส่วนหนี้สิน (D/E Ratio) ปริมาณกระแสเงินสด และประวัติการจ่ายเงินปันผลต่อเนื่อง
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">รู้มูลค่าแท้จริง (Fair Value) และ MOS:</strong> บอกชัดเจนว่าราคาปัจจุบัน &ldquo;ถูกหรือแพง&rdquo; โดยมีส่วนเผื่อความปลอดภัย (Margin of Safety) เหลือกี่เปอร์เซ็นต์ ช่วยให้คุณไม่ซื้อหุ้นที่ราคาแพงเกินจริง
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Capital Protection Suite */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>2. เกราะป้องกันความเสียหายเงินทุน (Capital Preservation Suite)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="text-xs font-bold text-amber-400 mb-1 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>ไฟจราจร 3 สี (Traffic Light)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  มองปราดเดียวรู้ทันที จุดไหนได้เปรียบทางราคา (เขียว) หรือจุดไหนอันตรายต่อเงินต้นต้องหลีกเลี่ยง (แดง)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="text-xs font-bold text-rose-400 mb-1 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ระบบ Anti-Stop Hunt</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  คำนวณเผื่อค่าความผันผวนจริง (ATR Buffer) ป้องกันการถูกเขย่าหลอกกิน Stop Loss แล้ววิ่งต่อ
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="text-xs font-bold text-indigo-400 mb-1 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>คำนวณขนาดไม้ (Sizing)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  คำนวณเงินซื้อแต่ละตัวตามขนาดพอร์ต ไม่ให้ทุ่มหมดหน้าตัก และคุมเพดานหุ้นหนี้สูงไม่เกินเกณฑ์ความปลอดภัย
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Paper Trading & Zero Hallucination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#13141b] border border-emerald-500/20">
              <h5 className="text-xs font-bold text-emerald-400 mb-1.5 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4" />
                <span>สนามซ้อมเทรดเสมือนจริง (Paper Trading 1-3 เดือน)</span>
              </h5>
              <p className="text-xs text-zinc-300">
                ไม่ต้องเสี่ยงด้วยเงินจริงแม้แต่บาทเดียว มือใหม่และผู้มีเงินก้อนสุดท้ายสามารถฝึกซ้อม ซึมซับจังหวะตลาด และดูสถิติ Win Rate ให้มั่นใจ 100% ก่อนลงเงินจริง
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#13141b] border border-blue-500/20">
              <h5 className="text-xs font-bold text-blue-400 mb-1.5 flex items-center space-x-1.5">
                <Lock className="w-4 h-4" />
                <span>ซื่อตรง โปร่งใส (Zero Hallucination)</span>
              </h5>
              <p className="text-xs text-zinc-300">
                ข้อมูลทุกบรรทัดแยกชัดเจนระหว่างตัวเลขจริงจากตลาดกับสูตรคำนวณคณิตศาสตร์ ไม่มีเดาสุ่ม พร้อมระบบบันทึก Audit Log ไม่สามารถปลอมแปลงย้อนหลังได้
              </p>
            </div>
          </div>

          {/* Bottom Summary Callout */}
          <div className="text-center p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400">
            💡 <strong className="text-white">ข้อความสรุป:</strong> ตลาดหุ้นไม่มีที่ว่างให้การลองผิดลองถูกด้วยเงินจริง ให้ SBY INVEST AI & SBY BOT เป็นสมองกลคอยคำนวณความคุ้มค่า และเป็นเกราะเหล็กคุ้มกันเงินต้นก้อนสำคัญของคุณตั้งแต่วินาทีแรก
          </div>

        </div>

        {/* Modal Footer Action */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500 hidden sm:inline-block">
            SBY INVEST AI v2.5 • ปลอดภัย คมชัด ตรวจสอบได้
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>เข้าใจแล้ว พร้อมเข้าสู่ระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
