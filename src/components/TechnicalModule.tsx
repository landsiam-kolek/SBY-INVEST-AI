import React, { useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  Maximize2, 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Crosshair,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  ArrowLeft
} from 'lucide-react';
import { StockData, PriceCandle } from '../types';

interface TechnicalModuleProps {
  stock: StockData;
  onGoBack?: () => void;
  previousViewLabel?: string;
}

export const TechnicalModule: React.FC<TechnicalModuleProps> = ({ 
  stock,
  onGoBack,
  previousViewLabel,
}) => {
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '3M' | 'ALL'>('3M');
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showSupportResistance, setShowSupportResistance] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<PriceCandle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Filter candles based on timeframe (including 1W for short-term trading)
  const candles = useMemo(() => {
    const raw = stock.candles || [];
    if (timeframe === '1W') return raw.slice(-7);
    if (timeframe === '1M') return raw.slice(-22);
    if (timeframe === '3M') return raw.slice(-45);
    return raw;
  }, [stock.candles, timeframe]);

  // Chart Dimensions
  const chartWidth = 760;
  const chartHeight = 280;
  const volumeHeight = 60;
  const totalSvgHeight = chartHeight + volumeHeight + 20;

  // Min & Max Price Bounds
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100, maxVol: 1000 };
    let min = Infinity;
    let max = -Infinity;
    let maxV = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.ema20 && c.ema20 < min) min = c.ema20;
      if (c.ema20 && c.ema20 > max) max = c.ema20;
      if (c.volume > maxV) maxV = c.volume;
    });

    if (showSupportResistance) {
      if (stock.support2 && stock.support2 < min) min = stock.support2 * 0.98;
      if (stock.resistance2 && stock.resistance2 > max) max = stock.resistance2 * 1.02;
    }

    const pad = (max - min) * 0.08;
    return {
      minPrice: Math.max(0, min - pad),
      maxPrice: max + pad,
      maxVol: maxV * 1.2,
    };
  }, [candles, showSupportResistance, stock]);

  const priceToY = (price: number) => {
    if (maxPrice === minPrice) return chartHeight / 2;
    return chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
  };

  const volToHeight = (vol: number) => {
    if (!maxVol) return 0;
    return (vol / maxVol) * volumeHeight;
  };

  // Candle X Coordinates
  const candleWidth = useMemo(() => {
    if (candles.length === 0) return 6;
    const spacing = chartWidth / candles.length;
    return Math.max(3, Math.min(12, spacing * 0.65));
  }, [candles.length, chartWidth]);

  const candleSpacing = chartWidth / Math.max(1, candles.length);

  // Generate EMA Polyline Points
  const ema20Points = useMemo(() => {
    return candles
      .filter((c) => c.ema20 !== undefined)
      .map((c, i) => `${i * candleSpacing + candleSpacing / 2},${priceToY(c.ema20!)}`)
      .join(' ');
  }, [candles, candleSpacing, minPrice, maxPrice]);

  const ema50Points = useMemo(() => {
    return candles
      .filter((c) => c.ema50 !== undefined)
      .map((c, i) => `${i * candleSpacing + candleSpacing / 2},${priceToY(c.ema50!)}`)
      .join(' ');
  }, [candles, candleSpacing, minPrice, maxPrice]);

  const ema200Points = useMemo(() => {
    return candles
      .filter((c) => c.ema200 !== undefined)
      .map((c, i) => `${i * candleSpacing + candleSpacing / 2},${priceToY(c.ema200!)}`)
      .join(' ');
  }, [candles, candleSpacing, minPrice, maxPrice]);

  // Support / Resistance Distance
  const distS1 = stock.support1 !== undefined ? ((stock.support1 - stock.currentPrice) / stock.currentPrice) * 100 : undefined;
  const distR1 = stock.resistance1 !== undefined ? ((stock.resistance1 - stock.currentPrice) / stock.currentPrice) * 100 : undefined;

  return (
    <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm p-5 sm:p-6 mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Technical Trading & Timing Module
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                When & How to Trade
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              กราฟแท่งเทียนราคา, เส้นแนวโน้ม EMA, โมเมนตัม RSI/MACD, และการกำหนดจุดเข้า-ออกที่ได้เปรียบ
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onGoBack && (
            <button
              id="tech-chart-back-btn"
              type="button"
              onClick={onGoBack}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer active:scale-95 group"
              title={`ย้อนกลับไปหน้า: ${previousViewLabel || 'หน้าก่อนหน้า'}`}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>← ย้อนกลับ ({previousViewLabel || 'หน้าก่อนหน้า'})</span>
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 text-right">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">คะแนนจังหวะเทคนิค</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {stock.technicalScore} <span className="text-xs text-slate-400 dark:text-zinc-500">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Chart Controls & Timeframe Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="md:hidden px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
              title="ย้อนกลับไปหน้าก่อนหน้า"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ย้อนกลับ</span>
            </button>
          )}
          {/* Timeframe Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#18181B] p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
          {(['1W', '1M', '3M', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeframe === tf
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tf === '1W' ? '1 สัปดาห์ (1W)' : tf === '1M' ? '1 เดือน' : tf === '3M' ? '3 เดือน' : 'ทั้งหมด'}
            </button>
          ))}
          </div>
        </div>

        {/* Overlay Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 transition-colors ${
              showEMA20 
                ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' 
                : 'bg-slate-50 dark:bg-[#18181B] text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>EMA 20 ({stock.ema20})</span>
          </button>

          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 transition-colors ${
              showEMA50 
                ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30' 
                : 'bg-slate-50 dark:bg-[#18181B] text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>EMA 50 ({stock.ema50})</span>
          </button>

          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 transition-colors ${
              showEMA200 
                ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30' 
                : 'bg-slate-50 dark:bg-[#18181B] text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>EMA 200 ({stock.ema200})</span>
          </button>

          <button
            onClick={() => setShowSupportResistance(!showSupportResistance)}
            className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center space-x-1.5 transition-colors ${
              showSupportResistance 
                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30' 
                : 'bg-slate-50 dark:bg-[#18181B] text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 opacity-60'
            }`}
          >
            <Target className="w-3 h-3 text-emerald-500" />
            <span>แนวรับ/ต้าน</span>
          </button>
        </div>
      </div>

      {/* Candlestick Chart Area */}
      <div className="relative border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-950 dark:bg-[#09090B] p-3 sm:p-4 overflow-hidden mb-5">
        {/* Tooltip Header if hover */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 dark:text-zinc-400 pb-2 border-b border-slate-800/80 dark:border-zinc-800 mb-2">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-slate-200 dark:text-zinc-200">
              {hoveredCandle ? hoveredCandle.date : (candles[candles.length - 1]?.date || 'Recent')}
            </span>
            <span>
              O: <strong className="text-slate-200 dark:text-zinc-200">{hoveredCandle ? hoveredCandle.open : candles[candles.length - 1]?.open}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">{hoveredCandle ? hoveredCandle.high : candles[candles.length - 1]?.high}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">{hoveredCandle ? hoveredCandle.low : candles[candles.length - 1]?.low}</strong>
            </span>
            <span>
              C: <strong className={
                (hoveredCandle ? hoveredCandle.close >= hoveredCandle.open : (candles[candles.length - 1]?.close >= (candles[candles.length - 1]?.open || 0)))
                  ? 'text-emerald-400' 
                  : 'text-rose-400'
              }>
                {hoveredCandle ? hoveredCandle.close : candles[candles.length - 1]?.close}
              </strong>
            </span>
          </div>

          <div className="text-slate-400 dark:text-zinc-500 hidden sm:block">
            Vol: <strong className="text-slate-200 dark:text-zinc-300">{((hoveredCandle ? hoveredCandle.volume : candles[candles.length - 1]?.volume || 0) / 1000000).toFixed(2)}M</strong>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${totalSvgHeight}`}
            className="w-full h-auto cursor-crosshair select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * chartWidth;
              const y = ((e.clientY - rect.top) / rect.height) * totalSvgHeight;
              setMousePos({ x, y });

              const index = Math.floor(x / candleSpacing);
              if (index >= 0 && index < candles.length) {
                setHoveredCandle(candles[index]);
              }
            }}
            onMouseLeave={() => {
              setHoveredCandle(null);
              setMousePos(null);
            }}
          >
            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Support / Resistance Horizontal Lines */}
            {showSupportResistance && (
              <>
                {/* Resistance 1 */}
                {stock.resistance1 !== undefined && (
                  <>
                    <line
                      x1="0"
                      y1={priceToY(stock.resistance1)}
                      x2={chartWidth}
                      y2={priceToY(stock.resistance1)}
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                    />
                    <text x={chartWidth - 85} y={priceToY(stock.resistance1) - 4} fill="#f43f5e" fontSize="10" fontWeight="bold">
                      R1: {stock.resistance1}
                    </text>
                  </>
                )}

                {/* Resistance 2 */}
                {stock.resistance2 !== undefined && (
                  <>
                    <line
                      x1="0"
                      y1={priceToY(stock.resistance2)}
                      x2={chartWidth}
                      y2={priceToY(stock.resistance2)}
                      stroke="#fb7185"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text x={chartWidth - 85} y={priceToY(stock.resistance2) - 4} fill="#fb7185" fontSize="10">
                      R2: {stock.resistance2}
                    </text>
                  </>
                )}

                {/* Support 1 */}
                {stock.support1 !== undefined && (
                  <>
                    <line
                      x1="0"
                      y1={priceToY(stock.support1)}
                      x2={chartWidth}
                      y2={priceToY(stock.support1)}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="6 3"
                    />
                    <text x={chartWidth - 85} y={priceToY(stock.support1) - 4} fill="#10b981" fontSize="10" fontWeight="bold">
                      S1: {stock.support1}
                    </text>
                  </>
                )}

                {/* Support 2 */}
                {stock.support2 !== undefined && (
                  <>
                    <line
                      x1="0"
                      y1={priceToY(stock.support2)}
                      x2={chartWidth}
                      y2={priceToY(stock.support2)}
                      stroke="#34d399"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text x={chartWidth - 85} y={priceToY(stock.support2) - 4} fill="#34d399" fontSize="10">
                      S2: {stock.support2}
                    </text>
                  </>
                )}
              </>
            )}

            {/* EMA Polylines */}
            {showEMA20 && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                points={ema20Points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {showEMA50 && (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.8"
                points={ema50Points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {showEMA200 && (
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.8"
                points={ema200Points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Candlestick Bars */}
            {candles.map((candle, i) => {
              const x = i * candleSpacing + candleSpacing / 2;
              const isUp = candle.close >= candle.open;
              const color = isUp ? '#10b981' : '#f43f5e';
              const candleTop = priceToY(Math.max(candle.open, candle.close));
              const candleBottom = priceToY(Math.min(candle.open, candle.close));
              const height = Math.max(2, candleBottom - candleTop);

              const highY = priceToY(candle.high);
              const lowY = priceToY(candle.low);

              // Volume bar
              const vHeight = volToHeight(candle.volume);
              const vY = totalSvgHeight - vHeight;

              return (
                <g key={candle.date + i}>
                  {/* High-Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={candleTop}
                    width={candleWidth}
                    height={height}
                    fill={color}
                    rx="1"
                  />
                  {/* Volume Bar */}
                  <rect
                    x={x - candleWidth / 2}
                    y={vY}
                    width={candleWidth}
                    height={vHeight}
                    fill={isUp ? '#065f46' : '#881337'}
                    opacity="0.75"
                    rx="1"
                  />
                </g>
              );
            })}

            {/* Mouse Crosshair line */}
            {mousePos && (
              <>
                <line
                  x1={mousePos.x}
                  y1="0"
                  x2={mousePos.x}
                  y2={totalSvgHeight}
                  stroke="#71717a"
                  strokeWidth="0.75"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1={mousePos.y}
                  x2={chartWidth}
                  y2={mousePos.y}
                  stroke="#71717a"
                  strokeWidth="0.75"
                  strokeDasharray="3 3"
                />
              </>
            )}
          </svg>
        </div>

        {/* Volume sub-label */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-zinc-500 mt-1">
          <span>Volume Profile (ล้านหุ้น)</span>
          <span>Time Period: {timeframe} Daily Candles</span>
        </div>
      </div>

      {/* Technical Indicators & Signal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Trend Indicator */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-[#18181B]">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 dark:text-zinc-500 mb-1">
            <Compass className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>โครงสร้างแนวโน้ม (Trend)</span>
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-1.5 mt-1">
            {stock.trend === 'UPTREND' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-600 dark:text-emerald-400">ขาขึ้น (Uptrend)</span>
              </>
            ) : stock.trend === 'DOWNTREND' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-rose-600 dark:text-rose-400">ขาลง (Downtrend)</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-amber-600 dark:text-amber-400">แกว่งตัว (Sideway)</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            {stock.ema200 !== undefined 
              ? (stock.currentPrice > stock.ema200 ? 'ราคาอยู่เหนือ EMA200 (แข็งแกร่ง)' : 'ราคาอยู่ใต้ EMA200 (ระวังแรงขาย)')
              : 'รอคำนวณ EMA200'}
          </p>
        </div>

        {/* RSI 14 */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-[#18181B]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">RSI (14 วัน)</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
              stock.rsi !== undefined
                ? (stock.rsi >= 70 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                    : stock.rsi <= 30
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400')
                : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {stock.rsi !== undefined 
                ? (stock.rsi >= 70 ? 'Overbought ซื้อมากไป' : stock.rsi <= 30 ? 'Oversold ขายมากไป' : 'Bullish Zone')
                : 'N/A'}
            </span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {stock.rsi !== undefined ? stock.rsi : 'N/A'}
          </div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${
                stock.rsi !== undefined 
                  ? (stock.rsi >= 70 ? 'bg-rose-500' : stock.rsi <= 30 ? 'bg-emerald-500' : 'bg-blue-500')
                  : 'bg-slate-300 dark:bg-zinc-700'
              }`}
              style={{ width: `${stock.rsi !== undefined ? stock.rsi : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Key Support Levels */}
        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/10">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center space-x-1">
            <span>แนวรับสำคัญ (Support)</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 block">แนวรับที่ 1 (S1)</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {stock.support1 !== undefined ? stock.support1 : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 block">แนวรับที่ 2 (S2)</span>
              <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                {stock.support2 !== undefined ? stock.support2 : 'N/A'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            {distS1 !== undefined ? `ห่างจาก S1: ${distS1.toFixed(1)}%` : 'รอข้อมูลแนวรับ'}
          </p>
        </div>

        {/* Key Resistance Levels */}
        <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/10">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center space-x-1">
            <span>แนวต้านเป้าหมาย (Resistance)</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 block">แนวต้านที่ 1 (R1)</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">
                {stock.resistance1 !== undefined ? stock.resistance1 : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 block">แนวต้านที่ 2 (R2)</span>
              <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                {stock.resistance2 !== undefined ? stock.resistance2 : 'N/A'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
            {distR1 !== undefined ? `ห่างจาก R1: +${distR1.toFixed(1)}%` : 'รอข้อมูลแนวต้าน'}
          </p>
        </div>
      </div>

      {/* Advanced Precision Engine: Fibonacci Golden Pocket (61.8%) & 5-Level Bid/Offer Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
        {/* Fibonacci Retracement & Golden Pocket (61.8%) */}
        <div className="p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-500/20">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-300">
                Fibonacci Precision & Golden Pocket (61.8%)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
              High Precision
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-indigo-100 dark:border-indigo-900/40">
              <span className="text-slate-500 dark:text-zinc-400">TP2: Fib Extension (127.2%)</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {stock.targetPrice2 !== undefined ? `${stock.targetPrice2} THB` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-indigo-100 dark:border-indigo-900/40">
              <span className="text-slate-500 dark:text-zinc-400">TP1: Swing High (100.0%)</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">
                {stock.targetPrice1 !== undefined ? `${stock.targetPrice1} THB` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 bg-amber-500/10 dark:bg-amber-500/15 px-2 rounded-lg">
              <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center space-x-1">
                <span>🎯 Golden Pocket (61.8% Entry):</span>
              </span>
              <span className="font-black text-amber-700 dark:text-amber-300">
                {stock.support1 !== undefined ? `${stock.support1} THB` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-zinc-400">SL: Safe Stop (Under Swing Low)</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {stock.stopLossPrice !== undefined ? `${stock.stopLossPrice} THB` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Level Bid/Offer Depth Status (Zero-Simulation Standard) */}
        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black text-slate-900 dark:text-white">
                5-Level Bid / Offer Depth (L2 Order Book)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold">
              {stock.orderBookStatus === 'ORDER_BOOK_AVAILABLE' ? 'Live Stream' : 'Requires Broker API'}
            </span>
          </div>

          {stock.orderBookStatus === 'ORDER_BOOK_AVAILABLE' ? (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20">
                <div className="text-[10px] font-sans font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex justify-between">
                  <span>Bid</span>
                  <span>Volume</span>
                </div>
              </div>
              <div className="bg-rose-50/40 dark:bg-rose-950/20 p-2 rounded-xl border border-rose-200/50 dark:border-rose-500/20">
                <div className="text-[10px] font-sans font-bold text-rose-700 dark:text-rose-400 mb-1 flex justify-between">
                  <span>Offer</span>
                  <span>Volume</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700/80 bg-slate-100/50 dark:bg-zinc-800/30 text-center">
              <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                L2 Order Book Volume: DATA_UNAVAILABLE
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                ระบบใช้หลักความโปร่งใส (Zero Simulation) ข้อมูล 5-Level Bid/Offer ต้องเชื่อมต่อ Broker API สดโดยตรง ไม่มีการสร้างตัวเลขปริมาณจำลอง
              </p>
              <div className="mt-2 flex items-center justify-center space-x-2 text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                <span>Spread Tick อ้างอิง:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {stock.currentPrice >= 200 ? '1.00' : stock.currentPrice >= 100 ? '0.50' : stock.currentPrice >= 25 ? '0.25' : '0.10'} THB
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
