import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Coins,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  Layers,
  Scale,
  Percent,
} from 'lucide-react';
import { StockData } from '../types';
import {
  getStockAnnualFinancials,
  analyzeFinancialTrend,
} from '../utils/financialHistory';

interface AnnualFinancialTrendChartProps {
  stock: StockData;
}

export const AnnualFinancialTrendChart: React.FC<AnnualFinancialTrendChartProps> = ({ stock }) => {
  // Metric display toggles (4 Lines: Profit, Debt, Cash, Capital)
  const [showProfit, setShowProfit] = useState(true);
  const [showDebt, setShowDebt] = useState(true);
  const [showCash, setShowCash] = useState(true);
  const [showCapital, setShowCapital] = useState(true);
  const [useDualAxis, setUseDualAxis] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'vi-audit'>('chart');

  // Retrieve 5-year financials & automated diagnosis
  const financials = useMemo(() => getStockAnnualFinancials(stock), [stock]);
  const diagnosis = useMemo(() => analyzeFinancialTrend(financials), [financials]);

  const currencyUnit = stock.currency === 'USD' ? 'ล้าน USD' : 'ล้านบาท';

  // Format data for Recharts
  const chartData = useMemo(() => {
    return financials.map((f, index) => {
      const prev = index > 0 ? financials[index - 1] : null;
      const profitYoY = prev && prev.netProfit !== 0
        ? Number((((f.netProfit - prev.netProfit) / Math.abs(prev.netProfit)) * 100).toFixed(1))
        : null;
      const debtYoY = prev && prev.netDebt !== 0
        ? Number((((f.netDebt - prev.netDebt) / Math.abs(prev.netDebt)) * 100).toFixed(1))
        : null;
      const cashYoY = prev && prev.cash !== undefined && prev.cash !== 0
        ? Number(((((f.cash ?? 0) - prev.cash) / Math.abs(prev.cash)) * 100).toFixed(1))
        : null;

      return {
        year: f.year,
        yearDisplay: `สิ้นปี ${f.year}${f.year === 2025 ? ' (F)' : ''}`,
        netProfit: f.netProfit,
        netDebt: f.netDebt,
        cash: f.cash ?? 0,
        paidUpCapital: f.paidUpCapital,
        capitalIncreaseAmount: f.capitalIncreaseAmount || 0,
        capitalIncreaseEvent: f.capitalIncreaseEvent || 'ไม่มีการเพิ่มทุน',
        revenue: f.revenue || 0,
        roe: f.roe || 0,
        profitYoY,
        debtYoY,
        cashYoY,
        hasCapitalIncrease: (f.capitalIncreaseAmount && f.capitalIncreaseAmount > 0) || f.capitalIncreaseEvent?.includes('เพิ่มทุน'),
      };
    });
  }, [financials]);

  // Latest year values
  const latestData = chartData[chartData.length - 1];
  const firstData = chartData[0];

  const formatMillions = (val: number) => {
    return new Intl.NumberFormat('th-TH').format(val);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 dark:border-zinc-700 shadow-xl text-xs max-w-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700 dark:border-zinc-700 pb-1.5 font-bold">
            <span className="text-slate-200">{label}</span>
            <span className="text-[11px] text-slate-400">หน่วย: {currencyUnit}</span>
          </div>

          <div className="space-y-1.5">
            {/* Net Profit */}
            {showProfit && (
              <div className="flex items-center justify-between text-emerald-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>กำไรสุทธิสิ้นปี:</span>
                </span>
                <span className="font-extrabold">
                  {formatMillions(item.netProfit)} {stock.currency}
                  {item.profitYoY !== null && (
                    <span className={`ml-1.5 text-[10px] ${item.profitYoY >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                      ({item.profitYoY >= 0 ? '+' : ''}{item.profitYoY}%)
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Net Debt */}
            {showDebt && (
              <div className="flex items-center justify-between text-rose-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                  <span>หนี้สินสุทธิสิ้นปี:</span>
                </span>
                <span className="font-extrabold">
                  {item.netDebt < 0 ? (
                    <span className="text-emerald-400">Net Cash ({formatMillions(Math.abs(item.netDebt))})</span>
                  ) : (
                    `${formatMillions(item.netDebt)} ${stock.currency}`
                  )}
                  {item.debtYoY !== null && item.netDebt >= 0 && (
                    <span className={`ml-1.5 text-[10px] ${item.debtYoY <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({item.debtYoY >= 0 ? '+' : ''}{item.debtYoY}%)
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Cash & Equivalents */}
            {showCash && (
              <div className="flex items-center justify-between text-amber-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  <span>เงินสดสิ้นปี:</span>
                </span>
                <span className="font-extrabold">
                  {formatMillions(item.cash)} {stock.currency}
                  {item.cashYoY !== null && (
                    <span className={`ml-1.5 text-[10px] ${item.cashYoY >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                      ({item.cashYoY >= 0 ? '+' : ''}{item.cashYoY}%)
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Paid-up Capital */}
            {showCapital && (
              <div className="flex items-center justify-between text-indigo-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                  <span>ทุนจดทะเบียนชำระแล้ว:</span>
                </span>
                <span className="font-extrabold">
                  {formatMillions(item.paidUpCapital)} {stock.currency}
                </span>
              </div>
            )}
          </div>

          {/* Capital Increase Event Note */}
          <div className="pt-2 border-t border-slate-700/80 dark:border-zinc-800 text-[11px]">
            <div className="font-semibold text-slate-300 mb-0.5 flex items-center space-x-1">
              {item.hasCapitalIncrease ? (
                <span className="text-amber-400 flex items-center space-x-1 font-bold">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  <span>ประวัติเพิ่มทุนในปีนี้:</span>
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                  <span>การเพิ่มทุน:</span>
                </span>
              )}
            </div>
            <p className="text-slate-300 text-[10.5px] leading-relaxed">
              {item.capitalIncreaseEvent}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm p-5 sm:p-6 mb-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                กราฟเปรียบเทียบงบการเงินสิ้นปี (4-Line Financial Trend)
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                5-Year Trend (4 เส้นตรง)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              เปรียบเทียบ <strong className="text-emerald-600 dark:text-emerald-400">กำไรสุทธิสิ้นปี</strong> / <strong className="text-rose-600 dark:text-rose-400">หนี้สินสุทธิสิ้นปี</strong> / <strong className="text-amber-600 dark:text-amber-400">เงินสดสิ้นปี</strong> / <strong className="text-indigo-600 dark:text-indigo-400">การเพิ่มทุน (ถ้ามี)</strong> รวม 4 เส้นตรง เพื่อตรวจสอบความแข็งแกร่งของกระแสเงินสดและ Moat
            </p>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'chart'
                ? 'bg-white dark:bg-[#121215] text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            กราฟ 4 เส้นตรง
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'table'
                ? 'bg-white dark:bg-[#121215] text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ตารางเปรียบเทียบ
          </button>
          <button
            onClick={() => setActiveTab('vi-audit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'vi-audit'
                ? 'bg-white dark:bg-[#121215] text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            วิเคราะห์สไตล์ VI
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (5 Cards for 4-Line Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {/* Card 1: Net Profit Trend */}
        <div className="p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
            <span>กำไรสุทธิสิ้นปีล่าสุด</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatMillions(latestData.netProfit)} <span className="text-xs font-normal">{currencyUnit}</span>
          </div>
          <div className="text-[11px] mt-1 text-slate-600 dark:text-zinc-400 flex items-center space-x-1">
            {diagnosis.profitGrowth5y >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 inline" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500 inline" />
            )}
            <span>
              5-Yr Growth: <strong className={diagnosis.profitGrowth5y >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                {diagnosis.profitGrowth5y >= 0 ? '+' : ''}{diagnosis.profitGrowth5y}%
              </strong>
            </span>
          </div>
        </div>

        {/* Card 2: Net Debt Trend */}
        <div className="p-3.5 rounded-xl border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
            <span>หนี้สินสุทธิสิ้นปีล่าสุด</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400">
            {latestData.netDebt < 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">Net Cash ({formatMillions(Math.abs(latestData.netDebt))})</span>
            ) : (
              `${formatMillions(latestData.netDebt)} ${currencyUnit}`
            )}
          </div>
          <div className="text-[11px] mt-1 text-slate-600 dark:text-zinc-400">
            {diagnosis.isDebtDecreasing ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                ภาระหนี้ลดลงต่อเนื่อง
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                หนี้สินทรงตัว / มีโครงการลงทุน
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Cash & Cash Equivalents (NEW!) */}
        <div className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
            <span>เงินสดสิ้นปีล่าสุด</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {formatMillions(latestData.cash)} <span className="text-xs font-normal">{currencyUnit}</span>
          </div>
          <div className="text-[11px] mt-1 text-slate-600 dark:text-zinc-400 flex items-center space-x-1">
            {diagnosis.cashChange5y >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-amber-500 inline" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500 inline" />
            )}
            <span>
              5-Yr: <strong className={diagnosis.cashChange5y >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600'}>
                {diagnosis.cashChange5y >= 0 ? '+' : ''}{diagnosis.cashChange5y}%
              </strong>
            </span>
          </div>
        </div>

        {/* Card 4: Capital Increase Status */}
        <div className="p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
            <span>ประวัติการเพิ่มทุน (Capital Raise)</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
            {diagnosis.hasCapitalIncrease ? (
              <span className="text-amber-600 dark:text-amber-400 text-sm sm:text-base">พบประวัติการเพิ่มทุน</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">ปลอดการเพิ่มทุน (Zero Dilution)</span>
            )}
          </div>
          <div className="text-[11px] mt-1 text-slate-600 dark:text-zinc-400 truncate">
            {diagnosis.hasCapitalIncrease
              ? `ปีที่เพิ่มทุน: ${diagnosis.capitalIncreaseYears.join(', ')}`
              : 'ขยายธุรกิจด้วยกระแสเงินสดภายใน'}
          </div>
        </div>

        {/* Card 5: Financial Structure Health */}
        <div className="p-3.5 rounded-xl border border-teal-200/70 dark:border-teal-500/20 bg-teal-50/30 dark:bg-teal-500/5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">
            <span>สัดส่วนหนี้สุทธิต่อกำไร</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {latestData.netDebt <= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">0.0 ปี (ปลอดหนี้)</span>
            ) : (
              `${diagnosis.netDebtToProfitRatioLatest} ปี`
            )}
          </div>
          <div className="text-[11px] mt-1 text-slate-600 dark:text-zinc-400 truncate">
            {latestData.netDebt <= 0
              ? 'สถานะเงินสดสุทธิมั่นคงสูงสุด'
              : diagnosis.netDebtToProfitRatioLatest <= 3
              ? 'ระดับปลอดภัย คืนหนี้ได้เร็ว (< 3 ปี)'
              : 'ควรติดตามการบริหารกระแสเงินสด'}
          </div>
        </div>
      </div>

      {/* 3. Interactive Chart View */}
      {activeTab === 'chart' && (
        <div>
          {/* Chart Controls & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 mb-4 text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-bold text-slate-600 dark:text-zinc-400">แสดงเส้นกราฟ:</span>
              {/* Profit Toggle */}
              <button
                onClick={() => setShowProfit(!showProfit)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  showProfit
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-200 inline-block"></span>
                <span>กำไรสุทธิ (Net Profit)</span>
              </button>

              {/* Debt Toggle */}
              <button
                onClick={() => setShowDebt(!showDebt)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  showDebt
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-200 inline-block"></span>
                <span>หนี้สินสุทธิ (Net Debt)</span>
              </button>

              {/* Cash Toggle (NEW!) */}
              <button
                onClick={() => setShowCash(!showCash)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  showCash
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-200 inline-block"></span>
                <span>เงินสดสิ้นปี (Cash)</span>
              </button>

              {/* Capital Toggle */}
              <button
                onClick={() => setShowCapital(!showCapital)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  showCapital
                    ? 'bg-indigo-500 text-white border-indigo-600'
                    : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-200 inline-block"></span>
                <span>ทุนชำระแล้ว / เพิ่มทุน</span>
              </button>
            </div>

            {/* Dual Y-Axis Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 dark:text-zinc-400">สเกลแสดงผล:</span>
              <button
                onClick={() => setUseDualAxis(!useDualAxis)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  useDualAxis
                    ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                }`}
              >
                {useDualAxis ? '✓ สเกลแยก 2 แกน (เห็นความชันชัดเจน)' : 'สเกลเดี่ยว (มูลค่าสัมบูรณ์)'}
              </button>
            </div>
          </div>

          {/* SVG Recharts Line Chart */}
          <div className="w-full h-80 pt-2 pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis
                  dataKey="yearDisplay"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dy={6}
                />

                {/* Primary Left Y Axis (Profit, Cash & Capital) */}
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => `${formatMillions(v)}`}
                  domain={['auto', 'auto']}
                  width={60}
                />

                {/* Secondary Right Y Axis (Debt) if dual axis enabled */}
                {useDualAxis && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#f43f5e"
                    fontSize={10}
                    tickFormatter={(v) => `${formatMillions(v)}`}
                    domain={['auto', 'auto']}
                    width={60}
                  />
                )}

                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />

                {/* Zero Reference Line */}
                <ReferenceLine y={0} yAxisId="left" stroke="#cbd5e1" strokeDasharray="3 3" />

                {/* Line 1: Net Profit (Emerald) */}
                {showProfit && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="netProfit"
                    name={`กำไรสุทธิ (${currencyUnit})`}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                  />
                )}

                {/* Line 2: Net Debt (Rose) */}
                {showDebt && (
                  <Line
                    yAxisId={useDualAxis ? 'right' : 'left'}
                    type="monotone"
                    dataKey="netDebt"
                    name={`หนี้สินสุทธิ (${currencyUnit})`}
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#f43f5e', strokeWidth: 2, fill: '#ffffff' }}
                  />
                )}

                {/* Line 3: Cash & Equivalents (Amber) (NEW!) */}
                {showCash && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cash"
                    name={`เงินสดสิ้นปี (${currencyUnit})`}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                  />
                )}

                {/* Line 4: Paid-up Capital (Indigo) */}
                {showCapital && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="paidUpCapital"
                    name={`ทุนชำระแล้ว (${currencyUnit})`}
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181B] p-2.5 rounded-lg border border-slate-200/60 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span><strong>เส้นสีเขียว:</strong> กำไรสุทธิสิ้นปี</span>
              </span>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                <span><strong>เส้นสีแดง:</strong> หนี้สินสุทธิสิ้นปี</span>
              </span>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                <span><strong>เส้นสีส้ม/ทอง:</strong> เงินสดสิ้นปี</span>
              </span>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                <span><strong>เส้นสีม่วง:</strong> ทุนจดทะเบียนชำระแล้ว</span>
              </span>
            </div>
            <div className="text-slate-400 italic">
              * ข้อมูลอ้างอิงงบการเงินสิ้นปี (SET / SEC Official Filings)
            </div>
          </div>
        </div>
      )}

      {/* 4. Table Comparison View */}
      {activeTab === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">ปีงบการเงิน</th>
                <th className="py-2.5 px-3 text-right">กำไรสุทธิ ({currencyUnit})</th>
                <th className="py-2.5 px-3 text-right">เติบโต YoY</th>
                <th className="py-2.5 px-3 text-right">หนี้สินสุทธิ ({currencyUnit})</th>
                <th className="py-2.5 px-3 text-right">เงินสด ({currencyUnit})</th>
                <th className="py-2.5 px-3 text-right">ทุนชำระแล้ว ({currencyUnit})</th>
                <th className="py-2.5 px-3">ประวัติการเพิ่มทุน (ถ้ามี)</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">หนี้ต่อกำไร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {chartData.map((row) => {
                const isNetCash = row.netDebt < 0;
                const debtToProfit = row.netProfit > 0
                  ? (Math.max(0, row.netDebt) / row.netProfit).toFixed(1)
                  : '-';

                return (
                  <tr key={row.year} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {row.yearDisplay}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {formatMillions(row.netProfit)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      {row.profitYoY !== null ? (
                        <span className={row.profitYoY >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                          {row.profitYoY >= 0 ? `+${row.profitYoY}%` : `${row.profitYoY}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                      {isNetCash ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Net Cash ({formatMillions(Math.abs(row.netDebt))})</span>
                      ) : (
                        formatMillions(row.netDebt)
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-amber-600 dark:text-amber-400">
                      {formatMillions(row.cash)}
                      {row.cashYoY !== null && (
                        <span className={`block text-[10px] font-normal ${row.cashYoY >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>
                          ({row.cashYoY >= 0 ? '+' : ''}{row.cashYoY}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {formatMillions(row.paidUpCapital)}
                    </td>
                    <td className="py-3 px-3">
                      {row.hasCapitalIncrease ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                          <span>{row.capitalIncreaseEvent}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-zinc-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>ไม่มีการเพิ่มทุน (Zero Dilution)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-zinc-200">
                      {isNetCash ? (
                        <span className="text-emerald-600 dark:text-emerald-400">0.0x</span>
                      ) : (
                        `${debtToProfit}x`
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. VI Capital Allocation Audit & Moat Verdict */}
      {activeTab === 'vi-audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2 mb-2">
              <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                บทวินิจฉัยโครงสร้างเงินทุนตามหลัก Value Investing (Warren Buffett Moat Audit)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200/80 dark:border-zinc-800">
              {diagnosis.buffettMoatVerdict}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Rule 1: High Retained Earnings vs Capital Increase */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
              <div className="font-bold text-slate-800 dark:text-zinc-200 mb-1 flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-indigo-500" />
                <span>1. ไม่รบกวนเงินเพิ่มทุน</span>
              </div>
              <p className="text-slate-500 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                บริษัทที่มี Moat แข็งแกร่งสามารถสร้างกระแสเงินสดขยายงานได้เอง หากมีประวัติเพิ่มทุนบ่อย แปลว่าธุรกิจต้องใส่เงินเพิ่มเพื่อรักษาส่วนแบ่งตลาด
              </p>
            </div>

            {/* Rule 2: Debt Serviceability */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
              <div className="font-bold text-slate-800 dark:text-zinc-200 mb-1 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-rose-500" />
                <span>2. ความสามารถในการชำระหนี้</span>
              </div>
              <p className="text-slate-500 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                หนี้สินสุทธิควรต่ำกว่า 3 เท่าของกำไรสุทธิประจำปี เพื่อให้มั่นใจว่าในภาวะวิกฤติต้นทุนดอกเบี้ยจะไม่กดทับกำไรสุทธิ และมีความยืดหยุ่นในการจ่ายเงินปันผล
              </p>
            </div>

            {/* Rule 3: Cash Cushion & Liquidity Buffer (NEW!) */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
              <div className="font-bold text-slate-800 dark:text-zinc-200 mb-1 flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>3. เงินสดสำรอง (Cash Cushion)</span>
              </div>
              <p className="text-slate-500 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                เงินสดและรายการเทียบเท่าเงินสดในระดับสูงช่วยให้บริษัทสามารถคว้าโอกาสซื้อกิจการช่วงวิกฤติ จ่ายเงินปันผลต่อเนื่อง และลดความเสี่ยงการผิดนัดชำระหนี้
              </p>
            </div>

            {/* Rule 4: Quality of Earnings */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181B]">
              <div className="font-bold text-slate-800 dark:text-zinc-200 mb-1 flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>4. ทิศทางกำไรต่อทุน (ROE)</span>
              </div>
              <p className="text-slate-500 dark:text-zinc-400 text-[11.5px] leading-relaxed">
                เมื่อกำไรสุทธิเติบโตโดยที่ฐานทุน (Paid-up Capital) ไม่ได้เพิ่มขึ้น จะส่งผลให้ EPS และ ROE เติบโตอย่างแท้จริง เป็นผลดีสูงสุดต่อนักลงทุนระยะยาว
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
