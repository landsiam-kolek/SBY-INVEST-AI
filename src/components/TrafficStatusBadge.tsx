import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Info, ChevronDown } from 'lucide-react';

export type TrafficLightLevel = 'SAFE' | 'CAUTION' | 'DANGER';

interface TrafficStatusBadgeProps {
  type: 'RR' | 'MOS' | 'DE' | 'SIGNAL' | 'VOLUME' | 'CUSTOM';
  value?: number;
  label?: string;
  subLabel?: string;
  customLevel?: TrafficLightLevel;
  explanation?: string;
  formula?: string;
  compact?: boolean;
  className?: string;
}

/**
 * TrafficStatusBadge Component
 * 🟢 เขียว = ปลอดภัยดีสุด / คุ้มเสี่ยง / น่าลงทุน
 * 🟠 ส้ม = ระวัง / ชะลอ / พอไหว
 * 🔴 แดง = ระวังหลีกเลี่ยง / อันตราย / ห้ามเข้า
 * 
 * Replaces cognitive overload from verbose text with glanceable 3-color status
 * with optional progressive disclosure for detailed formulas.
 */
export const TrafficStatusBadge: React.FC<TrafficStatusBadgeProps> = ({
  type,
  value,
  label,
  subLabel,
  customLevel,
  explanation,
  formula,
  compact = false,
  className = '',
}) => {
  const [showDetail, setShowDetail] = useState(false);

  // Compute traffic light level and text
  let level: TrafficLightLevel = customLevel || 'SAFE';
  let badgeText = label || '';
  let badgeSub = subLabel || '';
  let detailFormula = formula || '';
  let detailExplanation = explanation || '';

  if (type === 'RR' && value !== undefined) {
    if (value >= 2.5) {
      level = 'SAFE';
      badgeText = `🟢 คุ้มเสี่ยงมาก (1:${value.toFixed(1)})`;
      badgeSub = 'คุ้มค่าสูง';
      detailExplanation = `อัตราผลตอบแทนต่อความเสี่ยง 1 : ${value.toFixed(1)} สูงกว่าเกณฑ์ขั้นต่ำ 1:2.0 มาก หากชนะ 1 ไม้ สามารถครอบคลุมการแพ้ได้หลายไม้`;
      detailFormula = 'Reward : Risk = (Target Price - Entry) / (Entry - Stop Loss)';
    } else if (value >= 1.5) {
      level = 'CAUTION';
      badgeText = `🟠 พอไหว/ระวัง (1:${value.toFixed(1)})`;
      badgeSub = 'กำไรพอกับเสี่ยง';
      detailExplanation = `อัตราผลตอบแทนต่อความเสี่ยง 1 : ${value.toFixed(1)} อยู่ในระดับพอไหว แต่ตึงเกินไปสำหรับเงินก้อนสุดท้าย ควรเข้าซื้อที่แนวรับลึกขึ้นเพื่อขยาย R:R`;
      detailFormula = 'Reward : Risk = (Target Price - Entry) / (Entry - Stop Loss)';
    } else {
      level = 'DANGER';
      badgeText = `🔴 ไม่คุ้มเสี่ยง/เลี่ยง (1:${value.toFixed(1)})`;
      badgeSub = 'เสี่ยงสูงกว่ากำไร';
      detailExplanation = `อัตราผลตอบแทนต่อความเสี่ยง 1 : ${value.toFixed(1)} ต่ำกว่า 1:1.5 ไม่คุ้มค่าที่จะเอาเงินต้นไปเสี่ยง ให้รอรอบใหม่หรือข้ามไปดูตัวอื่น`;
      detailFormula = 'Reward : Risk = (Target Price - Entry) / (Entry - Stop Loss)';
    }
  } else if (type === 'MOS' && value !== undefined) {
    if (value >= 15) {
      level = 'SAFE';
      badgeText = `🟢 ราคาถูกมาก (MOS +${value.toFixed(1)}%)`;
      badgeSub = 'มีส่วนเผื่อความปลอดภัยสูง';
      detailExplanation = `ราคาตลาดปัจจุบันต่ำกว่ามูลค่าแท้จริง (Fair Value) ถึง ${value.toFixed(1)}% มี Margin of Safety หนารองรับความผันผวน`;
      detailFormula = 'MOS % = ((Fair Value - Price) / Fair Value) * 100';
    } else if (value >= 0) {
      level = 'CAUTION';
      badgeText = `🟠 พอดีพื้นฐาน (MOS +${value.toFixed(1)}%)`;
      badgeSub = 'ราคาใกล้เคียงมูลค่าแท้จริง';
      detailExplanation = `ราคาตลาดพอดีกับมูลค่าแท้จริง มี MOS บางๆ ${value.toFixed(1)}% แนะนำแบ่งไม้ทยอยซื้อเมื่อราคาย่อตัว`;
      detailFormula = 'MOS % = ((Fair Value - Price) / Fair Value) * 100';
    } else {
      level = 'DANGER';
      badgeText = `🔴 แพงเกินพื้นฐาน (MOS ${value.toFixed(1)}%)`;
      badgeSub = 'Overvalued หลีกเลี่ยง';
      detailExplanation = `ราคาตลาดปัจจุบันสูงกว่ามูลค่าแท้จริง ${Math.abs(value).toFixed(1)}% ไม่มีเกราะป้องกันความปลอดภัย`;
      detailFormula = 'MOS % = ((Fair Value - Price) / Fair Value) * 100';
    }
  } else if (type === 'DE' && value !== undefined) {
    if (value <= 1.5) {
      level = 'SAFE';
      badgeText = `🟢 หนี้ต่ำปลอดภัย (D/E ${value.toFixed(1)}x)`;
      badgeSub = 'โครงสร้างการเงินแกร่ง';
      detailExplanation = `สัดส่วนหนี้สินต่อทุนต่ำกว่า 1.5 เท่า บริษัทมีความมั่นคงทางการเงินสูง ไม่มีความเสี่ยงเรื่องหนี้สินล้นพ้นตัว`;
      detailFormula = 'D/E = หนี้สินรวม (Total Debt) / ส่วนของผู้ถือหุ้น (Equity)';
    } else if (value <= 2.0) {
      level = 'CAUTION';
      badgeText = `🟠 หนี้เริ่มตึง (D/E ${value.toFixed(1)}x)`;
      badgeSub = 'เฝ้าระวังภาระดอกเบี้ย';
      detailExplanation = `สัดส่วนหนี้สิน 1.5x - 2.0x เริ่มมีภาระดอกเบี้ยสูง ต้องติดตามกระแสเงินสดจากการดำเนินงาน`;
      detailFormula = 'D/E = หนี้สินรวม (Total Debt) / ส่วนของผู้ถือหุ้น (Equity)';
    } else {
      level = 'DANGER';
      badgeText = `🔴 หนี้สูงอันตราย (D/E ${value.toFixed(1)}x)`;
      badgeSub = 'จำกัดสัดส่วนพอร์ต <= 15-30%';
      detailExplanation = `สัดส่วนหนี้สินสูงกว่า 2.0 เท่า เข้าข่าย Guardrail B ของระบบ ต้องคุมน้ำหนักในพอร์ตไม่ให้เกิน 15-30% เด็ดขาด`;
      detailFormula = 'D/E = หนี้สินรวม (Total Debt) / ส่วนของผู้ถือหุ้น (Equity)';
    }
  } else if (type === 'VOLUME' && value !== undefined) {
    if (value >= 150) {
      level = 'SAFE';
      badgeText = `🟢 วอลุ่มทะลัก (+${value.toFixed(0)}%)`;
      badgeSub = 'แรงซื้อสถาบัน/เจ้ามือเข้าจริง';
      detailExplanation = `ปริมาณการซื้อขายสูงกว่าค่าเฉลี่ย 5 วันเกิน 150% ยืนยันการ Breakout ไม่ใช่การหลอกกิน Stop Loss`;
      detailFormula = 'Volume Surge % = ((Today Vol - 5D Avg Vol) / 5D Avg Vol) * 100';
    } else if (value >= 100) {
      level = 'CAUTION';
      badgeText = `🟠 วอลุ่มปานกลาง (+${value.toFixed(0)}%)`;
      badgeSub = 'วอลุ่มเข้ามาสม่ำเสมอ';
      detailExplanation = `ปริมาณการซื้อขายระดับปกติ รอการยืนยันแท่งเทียนปิด`;
      detailFormula = 'Volume Surge % = ((Today Vol - 5D Avg Vol) / 5D Avg Vol) * 100';
    } else {
      level = 'DANGER';
      badgeText = `🔴 วอลุ่มบาง (+${value.toFixed(0)}%)`;
      badgeSub = 'ระวังการทุบเขย่าหลอก (Fakeout)';
      detailExplanation = `วอลุ่มค่อนข้างบาง หากมีการทุบหรือเบรค มีโอกาสเป็น Stop Hunt สลัดเม่าสูงมาก`;
      detailFormula = 'Volume Surge % = ((Today Vol - 5D Avg Vol) / 5D Avg Vol) * 100';
    }
  }

  // Visual classes based on level
  const colorStyles = {
    SAFE: {
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80',
      dot: 'bg-emerald-500',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      tag: 'ปลอดภัยดีสุด',
    },
    CAUTION: {
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700/80',
      dot: 'bg-amber-500',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
      tag: 'ระวัง/ชะลอ',
    },
    DANGER: {
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700/80',
      dot: 'bg-rose-500',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
      tag: 'หลีกเลี่ยง',
    },
  }[level];

  return (
    <div className={`inline-block ${className}`}>
      <button
        type="button"
        onClick={() => (detailExplanation ? setShowDetail(!showDetail) : null)}
        className={`inline-flex items-center space-x-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        } ${colorStyles.badge}`}
        title={detailExplanation ? 'คลิกเพื่อดูสูตรและเหตุผลประกอบ' : undefined}
      >
        {colorStyles.icon}
        <span className="font-black whitespace-nowrap">{badgeText || label}</span>
        {badgeSub && !compact && (
          <span className="opacity-75 text-[10px] hidden sm:inline">({badgeSub})</span>
        )}
        {detailExplanation && (
          <ChevronDown
            className={`w-3 h-3 opacity-60 transition-transform ${
              showDetail ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Progressive Disclosure Dropdown / Expander */}
      {showDetail && detailExplanation && (
        <div className="mt-1.5 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs shadow-xl border border-slate-700 space-y-1.5 animate-in fade-in zoom-in-95 z-30 max-w-xs sm:max-w-sm">
          <div className="flex items-center justify-between text-[11px] font-black pb-1 border-b border-slate-800">
            <span className="flex items-center space-x-1 text-amber-400">
              <Info className="w-3.5 h-3.5" />
              <span>ความหมาย & เหตุผลวิเคราะห์</span>
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] ${
                level === 'SAFE'
                  ? 'bg-emerald-950 text-emerald-400'
                  : level === 'CAUTION'
                  ? 'bg-amber-950 text-amber-400'
                  : 'bg-rose-950 text-rose-400'
              }`}
            >
              {colorStyles.tag}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{detailExplanation}</p>
          {detailFormula && (
            <div className="text-[10px] p-1.5 rounded bg-slate-950 text-slate-400 font-mono">
              สูตร: {detailFormula}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
