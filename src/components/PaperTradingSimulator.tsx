import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Percent, 
  Award, 
  Clock, 
  Layers, 
  Trash2, 
  ArrowRight, 
  Calendar,
  Lock,
  Unlock,
  ShieldAlert,
  Info,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StockData } from '../types';
import { TrafficStatusBadge } from './TrafficStatusBadge';

export interface SimulatedPosition {
  id: string;
  symbol: string;
  stockName: string;
  shares: number;
  entryPrice: number;
  entryDate: string;
  stopLossPrice: number;
  targetPrice: number;
  currentPrice: number;
  currency: string;
  strategyTag: string;
  totalCost: number;
  feePaid: number;
}

export interface DuplicateOrderPromptData {
  stock: StockData;
  shares: number;
  price: number;
  grossCost: number;
  fee: number;
  totalRequired: number;
  sl: number;
  tp: number;
  existingPositions: SimulatedPosition[];
}

export interface SimulatedClosedTrade {
  id: string;
  symbol: string;
  stockName: string;
  shares: number;
  entryPrice: number;
  exitPrice: number;
  entryDate: string;
  exitDate: string;
  realizedPnL: number;
  realizedPnLPercent: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE';
  totalCommissionPaid: number;
  isWin: boolean;
}

interface PaperTradingSimulatorProps {
  allStocks: StockData[];
  onSelectStock?: (stock: StockData) => void;
  onOpenAuditSimulationLab?: () => void;
}

export const PaperTradingSimulator: React.FC<PaperTradingSimulatorProps> = ({
  allStocks,
  onSelectStock,
}) => {
  // Virtual Cash Wallet State
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sby_sim_initial_capital');
      return saved ? Number(saved) : 300000;
    } catch {
      return 300000;
    }
  });

  const [cashBalance, setCashBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sby_sim_cash_balance');
      return saved ? Number(saved) : 300000;
    } catch {
      return 300000;
    }
  });

  // Simulated Open Positions
  const [positions, setPositions] = useState<SimulatedPosition[]>(() => {
    try {
      const saved = localStorage.getItem('sby_sim_positions');
      if (saved) {
        const parsed: SimulatedPosition[] = JSON.parse(saved);
        // Sync with current prices
        return parsed.map((pos) => {
          const fresh = allStocks.find((s) => s.symbol === pos.symbol);
          return fresh ? { ...pos, currentPrice: fresh.currentPrice } : pos;
        });
      }
      // Default initial mock simulation position (CPALL)
      const cpall = allStocks.find((s) => s.symbol === 'CPALL');
      if (cpall) {
        return [
          {
            id: 'pos-cpall-sim',
            symbol: 'CPALL',
            stockName: 'บมจ. ซีพี ออลล์',
            shares: 1000,
            entryPrice: 62.5,
            entryDate: '2026-08-25',
            stopLossPrice: 60.5,
            targetPrice: 68.0,
            currentPrice: cpall.currentPrice,
            currency: 'THB',
            strategyTag: 'VALUE_INVESTING',
            totalCost: 62500,
            feePaid: Math.round(62500 * 0.00168),
          },
        ];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Closed Trades History
  const [closedTrades, setClosedTrades] = useState<SimulatedClosedTrade[]>(() => {
    try {
      const saved = localStorage.getItem('sby_sim_closed_trades');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Simulation Start Date (for 1-3 months tracking)
  const [simulationStartDate, setSimulationStartDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sby_sim_start_date');
      return saved || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });

  // Quick Order Placement Form State
  const [selectedSymbol, setSelectedSymbol] = useState<string>(allStocks[0]?.symbol || 'CPALL');
  const [orderShares, setOrderShares] = useState<number>(1000);
  const [orderType, setOrderType] = useState<'BUY'>('BUY');
  const [useAtrBuffer, setUseAtrBuffer] = useState<boolean>(true);
  const [customEntryPrice, setCustomEntryPrice] = useState<number>(0);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Modals & Notifications for Deleting / Duplicate Handling
  const [duplicateOrderPrompt, setDuplicateOrderPrompt] = useState<DuplicateOrderPromptData | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<SimulatedPosition | null>(null);
  const [symbolToDeleteAll, setSymbolToDeleteAll] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('sby_sim_initial_capital', initialCapital.toString());
    localStorage.setItem('sby_sim_cash_balance', cashBalance.toString());
    localStorage.setItem('sby_sim_positions', JSON.stringify(positions));
    localStorage.setItem('sby_sim_closed_trades', JSON.stringify(closedTrades));
    localStorage.setItem('sby_sim_start_date', simulationStartDate);
  }, [initialCapital, cashBalance, positions, closedTrades, simulationStartDate]);

  const currentSelectedStock = allStocks.find((s) => s.symbol === selectedSymbol) || allStocks[0];

  useEffect(() => {
    if (currentSelectedStock) {
      setCustomEntryPrice(currentSelectedStock.currentPrice);
    }
  }, [selectedSymbol]);

  // Calculations
  const BROKER_FEE_RATE = 0.00168; // 0.157% + 7% VAT

  const totalPortfolioValue = positions.reduce((acc, pos) => {
    return acc + pos.shares * pos.currentPrice;
  }, 0);

  const totalNetWorth = cashBalance + totalPortfolioValue;
  const totalReturnBaht = totalNetWorth - initialCapital;
  const totalReturnPercent = Number(((totalReturnBaht / initialCapital) * 100).toFixed(2));

  // Duplicate symbol counts across portfolio
  const symbolCounts = positions.reduce<Record<string, number>>((acc, p) => {
    acc[p.symbol] = (acc[p.symbol] || 0) + 1;
    return acc;
  }, {});
  const duplicateSymbols = Object.keys(symbolCounts).filter((s) => symbolCounts[s] > 1);

  // Existing positions for the selected stock in the buy order form
  const existingForCurrentStock = positions.filter((p) => p.symbol === currentSelectedStock?.symbol);
  const totalExistingSharesForCurrentStock = existingForCurrentStock.reduce((sum, p) => sum + p.shares, 0);
  const totalExistingCostForCurrentStock = existingForCurrentStock.reduce((sum, p) => sum + p.totalCost, 0);

  // Closed trades stats
  const totalClosedTradesCount = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => t.isWin);
  const winRate = totalClosedTradesCount > 0 ? (winningTrades.length / totalClosedTradesCount) * 100 : 0;
  const totalRealizedPnL = closedTrades.reduce((sum, t) => sum + t.realizedPnL, 0);
  const totalFeesPaid = closedTrades.reduce((sum, t) => sum + t.totalCommissionPaid, 0) +
    positions.reduce((sum, p) => sum + p.feePaid, 0);

  // Simulation day counter
  const daysElapsed = Math.max(
    1,
    Math.floor((new Date().getTime() - new Date(simulationStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  // Actual execute buy without prompt
  const executeActualBuy = (
    stock: StockData,
    shares: number,
    price: number,
    grossCost: number,
    fee: number,
    totalRequired: number,
    sl: number,
    tp: number
  ) => {
    if (cashBalance < totalRequired) {
      alert(`ยอดเงินจำลองคงเหลือไม่เพียงพอ! ต้องการ ${totalRequired.toLocaleString()} บาท (มี ${cashBalance.toLocaleString()} บาท)`);
      return;
    }

    const newPosition: SimulatedPosition = {
      id: `pos-${stock.symbol}-${Date.now()}`,
      symbol: stock.symbol,
      stockName: stock.name,
      shares,
      entryPrice: price,
      entryDate: new Date().toISOString().split('T')[0],
      stopLossPrice: sl,
      targetPrice: tp,
      currentPrice: price,
      currency: stock.currency,
      strategyTag: 'VALUE_INVESTING',
      totalCost: grossCost,
      feePaid: fee,
    };

    setCashBalance((prev) => prev - totalRequired);
    setPositions((prev) => [newPosition, ...prev]);
    showToast(`ส่งคำสั่งซื้อจำลอง ${stock.symbol} จำนวน ${shares.toLocaleString()} หุ้น เรียบร้อยแล้ว`, 'success');

    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    } catch {}
  };

  // Execute Simulated Buy Order (Intercepts duplicates)
  const handleExecuteSimBuy = () => {
    if (!currentSelectedStock) return;
    const price = customEntryPrice || currentSelectedStock.currentPrice;
    const grossCost = price * orderShares;
    const fee = Math.round(grossCost * BROKER_FEE_RATE);
    const totalRequired = grossCost + fee;

    if (cashBalance < totalRequired) {
      alert(`ยอดเงินจำลองคงเหลือไม่เพียงพอ! ต้องการ ${totalRequired.toLocaleString()} บาท (มี ${cashBalance.toLocaleString()} บาท)`);
      return;
    }

    // Stop loss calculation: support - (1.5x ATR) or 2 ticks
    const tick = price < 2 ? 0.01 : price < 5 ? 0.02 : price < 10 ? 0.05 : price < 25 ? 0.10 : price < 100 ? 0.25 : 0.50;
    const atr14 = Number((price * 0.022).toFixed(2));
    const sl = useAtrBuffer ? Number((price - 1.5 * atr14).toFixed(2)) : Number((price - 2 * tick).toFixed(2));
    const tp = Number((price + (price - sl) * 2.5).toFixed(2)); // 1:2.5 R:R

    // Check if duplicate stock already exists in portfolio
    const matchingPositions = positions.filter((p) => p.symbol === currentSelectedStock.symbol);
    if (matchingPositions.length > 0) {
      // Open duplicate prompt modal to let user choose
      setDuplicateOrderPrompt({
        stock: currentSelectedStock,
        shares: orderShares,
        price,
        grossCost,
        fee,
        totalRequired,
        sl,
        tp,
        existingPositions: matchingPositions,
      });
      return;
    }

    executeActualBuy(currentSelectedStock, orderShares, price, grossCost, fee, totalRequired, sl, tp);
  };

  // Confirm adding new tranche when duplicate prompt is open
  const handleConfirmAddTranche = () => {
    if (!duplicateOrderPrompt) return;
    const { stock, shares, price, grossCost, fee, totalRequired, sl, tp } = duplicateOrderPrompt;
    setDuplicateOrderPrompt(null);
    executeActualBuy(stock, shares, price, grossCost, fee, totalRequired, sl, tp);
  };

  // Confirm merging tranches and averaging cost when duplicate prompt is open
  const handleConfirmMergePrompt = () => {
    if (!duplicateOrderPrompt) return;
    const { stock, shares, grossCost, fee, totalRequired, existingPositions } = duplicateOrderPrompt;

    if (cashBalance < totalRequired) {
      alert(`ยอดเงินจำลองคงเหลือไม่เพียงพอสำหรับการรวมยอด! ต้องการ ${totalRequired.toLocaleString()} บาท`);
      return;
    }

    const totalExistingShares = existingPositions.reduce((sum, p) => sum + p.shares, 0);
    const totalExistingCost = existingPositions.reduce((sum, p) => sum + p.totalCost, 0);
    const totalExistingFee = existingPositions.reduce((sum, p) => sum + p.feePaid, 0);

    const mergedShares = totalExistingShares + shares;
    const mergedGrossCost = totalExistingCost + grossCost;
    const mergedFee = totalExistingFee + fee;
    const avgEntryPrice = Number((mergedGrossCost / mergedShares).toFixed(2));

    const fresh = allStocks.find((s) => s.symbol === stock.symbol);
    const currentP = fresh ? fresh.currentPrice : stock.currentPrice;
    const atr14 = Number((avgEntryPrice * 0.022).toFixed(2));
    const tick = avgEntryPrice < 2 ? 0.01 : avgEntryPrice < 5 ? 0.02 : avgEntryPrice < 10 ? 0.05 : avgEntryPrice < 25 ? 0.10 : avgEntryPrice < 100 ? 0.25 : 0.50;
    const sl = Number((avgEntryPrice - 1.5 * atr14).toFixed(2));
    const tp = Number((avgEntryPrice + (avgEntryPrice - sl) * 2.5).toFixed(2));

    const mergedPos: SimulatedPosition = {
      ...existingPositions[0],
      id: `pos-${stock.symbol}-merged-${Date.now()}`,
      shares: mergedShares,
      entryPrice: avgEntryPrice,
      totalCost: mergedGrossCost,
      feePaid: mergedFee,
      stopLossPrice: sl,
      targetPrice: tp,
      currentPrice: currentP,
    };

    setCashBalance((prev) => prev - totalRequired);
    setPositions((prev) => [mergedPos, ...prev.filter((p) => p.symbol !== stock.symbol)]);
    setDuplicateOrderPrompt(null);
    showToast(`รวมไม้และเฉลี่ยต้นทุน ${stock.symbol} เป็น ${mergedShares.toLocaleString()} หุ้น (ต้นทุนเฉลี่ย ${avgEntryPrice} ฿) เรียบร้อย`, 'success');
  };

  // Confirm replacing existing positions with this new order (refunds old and buys new)
  const handleConfirmReplacePrompt = () => {
    if (!duplicateOrderPrompt) return;
    const { stock, shares, price, grossCost, fee, totalRequired, sl, tp, existingPositions } = duplicateOrderPrompt;

    // Refund old positions
    const oldRefund = existingPositions.reduce((sum, p) => sum + p.totalCost + p.feePaid, 0);
    const netCashAfterRefund = cashBalance + oldRefund;

    if (netCashAfterRefund < totalRequired) {
      alert(`ยอดเงินจำลองคงเหลือไม่เพียงพอหลังจากหักลบ!`);
      return;
    }

    const newPosition: SimulatedPosition = {
      id: `pos-${stock.symbol}-${Date.now()}`,
      symbol: stock.symbol,
      stockName: stock.name,
      shares,
      entryPrice: price,
      entryDate: new Date().toISOString().split('T')[0],
      stopLossPrice: sl,
      targetPrice: tp,
      currentPrice: price,
      currency: stock.currency,
      strategyTag: 'VALUE_INVESTING',
      totalCost: grossCost,
      feePaid: fee,
    };

    setCashBalance(netCashAfterRefund - totalRequired);
    setPositions((prev) => [newPosition, ...prev.filter((p) => p.symbol !== stock.symbol)]);
    setDuplicateOrderPrompt(null);
    showToast(`ลบรายการเดิมของ ${stock.symbol} และแทนที่ด้วยคำสั่งซื้อใหม่ ${shares.toLocaleString()} หุ้น เรียบร้อย (ปรับคืนส่วนต่างเงินสด)`, 'info');
  };

  // Delete single position and refund cash
  const handleDeletePosition = (position: SimulatedPosition) => {
    const refundAmount = position.totalCost + position.feePaid;
    setCashBalance((prev) => prev + refundAmount);
    setPositions((prev) => prev.filter((p) => p.id !== position.id));
    setPositionToDelete(null);
    showToast(`ลบ ${position.symbol} (${position.shares.toLocaleString()} หุ้น) ออกจากพอร์ตจำลองแล้ว (คืนเงินสด ${refundAmount.toLocaleString()} ฿)`, 'info');
  };

  // Delete all positions for a symbol and refund cash
  const handleDeleteAllBySymbol = (symbol: string) => {
    const matching = positions.filter((p) => p.symbol === symbol);
    if (matching.length === 0) return;
    const totalRefund = matching.reduce((sum, p) => sum + p.totalCost + p.feePaid, 0);
    const totalShares = matching.reduce((sum, p) => sum + p.shares, 0);

    setCashBalance((prev) => prev + totalRefund);
    setPositions((prev) => prev.filter((p) => p.symbol !== symbol));
    setSymbolToDeleteAll(null);
    showToast(`ลบหุ้น ${symbol} ทั้งหมด (${totalShares.toLocaleString()} หุ้น) ออกจากพอร์ตจำลองแล้ว (คืนเงินสด ${totalRefund.toLocaleString()} ฿)`, 'info');
  };

  // Remove duplicate tranches across entire portfolio (keeps first tranche, refunds duplicates)
  const handleCleanAllDuplicatesInPortfolio = () => {
    let totalRefunded = 0;
    let removedCount = 0;
    const seen = new Set<string>();
    const keepPositions: SimulatedPosition[] = [];

    for (const pos of positions) {
      if (!seen.has(pos.symbol)) {
        seen.add(pos.symbol);
        keepPositions.push(pos);
      } else {
        totalRefunded += (pos.totalCost + pos.feePaid);
        removedCount += 1;
      }
    }

    if (removedCount > 0) {
      setCashBalance((prev) => prev + totalRefunded);
      setPositions(keepPositions);
      showToast(`ลบไม้ที่ส่งซ้ำออก ${removedCount} รายการ สำเร็จ (คืนเงินสด ${totalRefunded.toLocaleString()} ฿)`, 'success');
    }
  };

  // Merge all duplicate tranches across entire portfolio
  const handleMergeAllDuplicatesInPortfolio = () => {
    const symbols = Array.from(new Set(positions.map((p) => p.symbol)));
    let mergedCount = 0;
    let newPositions = [...positions];

    symbols.forEach((sym) => {
      const matching = newPositions.filter((p) => p.symbol === sym);
      if (matching.length > 1) {
        const totalShares = matching.reduce((sum, p) => sum + p.shares, 0);
        const totalGrossCost = matching.reduce((sum, p) => sum + p.totalCost, 0);
        const totalFees = matching.reduce((sum, p) => sum + p.feePaid, 0);
        const avgEntryPrice = Number((totalGrossCost / totalShares).toFixed(2));

        const fresh = allStocks.find((s) => s.symbol === sym);
        const currentP = fresh ? fresh.currentPrice : matching[0].currentPrice;
        const atr14 = Number((avgEntryPrice * 0.022).toFixed(2));
        const tick = avgEntryPrice < 2 ? 0.01 : avgEntryPrice < 5 ? 0.02 : avgEntryPrice < 10 ? 0.05 : avgEntryPrice < 25 ? 0.10 : avgEntryPrice < 100 ? 0.25 : 0.50;
        const sl = Number((avgEntryPrice - 1.5 * atr14).toFixed(2));
        const tp = Number((avgEntryPrice + (avgEntryPrice - sl) * 2.5).toFixed(2));

        const mergedPos: SimulatedPosition = {
          ...matching[0],
          id: `pos-${sym}-merged-${Date.now()}`,
          shares: totalShares,
          entryPrice: avgEntryPrice,
          totalCost: totalGrossCost,
          feePaid: totalFees,
          stopLossPrice: sl,
          targetPrice: tp,
          currentPrice: currentP,
        };

        newPositions = [mergedPos, ...newPositions.filter((p) => p.symbol !== sym)];
        mergedCount += 1;
      }
    });

    if (mergedCount > 0) {
      setPositions(newPositions);
      showToast(`รวมหุ้นซ้ำจำนวน ${mergedCount} ตัว ให้เป็นไม้เดียวพร้อมเฉลี่ยต้นทุนเรียบร้อย`, 'success');
    }
  };

  // Execute Simulated Sell Order (Close Position)
  const handleClosePosition = (position: SimulatedPosition, reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE') => {
    const freshStock = allStocks.find((s) => s.symbol === position.symbol);
    const exitPrice = freshStock ? freshStock.currentPrice : position.currentPrice;
    const grossProceeds = exitPrice * position.shares;
    const exitFee = Math.round(grossProceeds * BROKER_FEE_RATE);
    const netProceeds = grossProceeds - exitFee;

    const netPnL = netProceeds - (position.totalCost + position.feePaid);
    const netPnLPercent = Number(((netPnL / position.totalCost) * 100).toFixed(2));

    const closedRecord: SimulatedClosedTrade = {
      id: `closed-${position.id}`,
      symbol: position.symbol,
      stockName: position.stockName,
      shares: position.shares,
      entryPrice: position.entryPrice,
      exitPrice,
      entryDate: position.entryDate,
      exitDate: new Date().toISOString().split('T')[0],
      realizedPnL: netPnL,
      realizedPnLPercent: netPnLPercent,
      exitReason: reason,
      totalCommissionPaid: position.feePaid + exitFee,
      isWin: netPnL > 0,
    };

    setCashBalance((prev) => prev + netProceeds);
    setPositions((prev) => prev.filter((p) => p.id !== position.id));
    setClosedTrades((prev) => [closedRecord, ...prev]);
  };

  // Reset Simulation Wallet
  const handleResetSimulation = () => {
    setCashBalance(initialCapital);
    setPositions([]);
    setClosedTrades([]);
    setSimulationStartDate(new Date().toISOString().split('T')[0]);
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 fade-in duration-200 max-w-md">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center space-x-2.5 text-xs font-bold ${
            toastNotification.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50 backdrop-blur-md'
              : toastNotification.type === 'warning'
              ? 'bg-amber-950/95 text-amber-100 border-amber-500/50 backdrop-blur-md'
              : 'bg-slate-900/95 text-white border-slate-700 backdrop-blur-md'
          }`}>
            {toastNotification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastNotification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toastNotification.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="flex-1">{toastNotification.message}</span>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="ml-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP BANNER: ZERO-RISK ASSURANCE & 1-3 MONTHS SIMULATION HEADER */}
      <div className="rounded-3xl border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#0f1f17] dark:via-[#11241c] dark:to-[#121215] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500 text-white shadow-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>โหมดจำลองเสมือนจริง 100% (Paper Trading Simulator)</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                🔒 ล็อกเงินจริงเด็ดขาด • ปลอดภัย 100%
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              สนามซ้อมเทรดเสมือนจริง 1-3 เดือน เพื่อสร้างความมั่นใจก่อนลงเงินจริง
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-3xl leading-relaxed">
              เหมาะสำหรับผู้ที่มีเงินก้อนสุดท้ายสำหรับการเกษียณ ระบบจำลองการส่งคำสั่งซื้อขายจริงตามราคาตลาด (SET / mai) 
              หักค่าธรรมเนียมโบรกเกอร์ (0.157% + VAT) เป๊ะทุกไม้ เพื่อให้คุณทดสอบกลยุทธ์จนมั่นใจ 100% โดยไม่ต้องเอาเงินเก็บมาเสี่ยง
            </p>
          </div>

          {/* Quick Simulation Health Indicator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 block mb-0.5">
                ระยะเวลาซ้อมสะสม
              </span>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>วันที่ {daysElapsed} / 90 วัน</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                (เป้าหมายซ้อม 1 - 3 เดือน)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:text-rose-500 hover:border-rose-300 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตพอร์ตจำลอง</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CAPITAL & PERFORMANCE KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Net Worth */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">
            <span>มูลค่าพอร์ตจำลองรวม (Net Worth)</span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalNetWorth.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs font-bold">
            <span className={totalReturnBaht >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
              {totalReturnBaht >= 0 ? '+' : ''}{totalReturnBaht.toLocaleString()} ฿ ({totalReturnPercent}%)
            </span>
          </div>
        </div>

        {/* Cash Balance Available */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">
            <span>เงินสดจำลองพร้อมใช้ (Cash)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {cashBalance.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {((cashBalance / totalNetWorth) * 100).toFixed(0)}% ของเงินทุนทั้งหมด
          </span>
        </div>

        {/* Win Rate % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">
            <span>อัตราชนะ (Win Rate)</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalClosedTradesCount > 0 ? `${winRate.toFixed(1)}%` : 'ยังไม่มีประวัติ'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            ชนะ {winningTrades.length} / ทั้งหมด {totalClosedTradesCount} ไม้
          </span>
        </div>

        {/* Total Fee Paid (Realistic Commission) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">
            <span>ค่าคอมมิชชั่นสะสม (Fee 0.168%)</span>
            <Percent className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-zinc-200">
            {totalFeesPaid.toLocaleString()} <span className="text-xs text-slate-400 font-normal">บาท</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
            ✓ คิดค่าคอมจริงเหมือนเปิดพอร์ต
          </span>
        </div>
      </div>

      {/* 3. SIMULATED ORDER ENTRY FORM (จำลองการส่งคำสั่งซื้อ) */}
      <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>ส่งคำสั่งซื้อขายจำลอง (Paper Order Entry)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              ทดลองซื้อหุ้นที่ผ่านการวิเคราะห์ พร้อมเกราะป้องกัน Anti-Stop Hunt ในตัว
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-300">
              ราคาอ้างอิงล่าสุดจาก SET / mai
            </span>
          </div>
        </div>

        {/* Existing Duplicate Warning for currently selected stock */}
        {existingForCurrentStock.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center space-x-2.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-black">ตรวจพบหุ้น {currentSelectedStock.symbol} อยู่ในพอร์ตแล้ว:</span>{' '}
                <span>{existingForCurrentStock.length} ไม้ รวม {totalExistingSharesForCurrentStock.toLocaleString()} หุ้น (ต้นทุนสะสม {totalExistingCostForCurrentStock.toLocaleString()} ฿)</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setSymbolToDeleteAll(currentSelectedStock.symbol)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800 transition-all cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบ {currentSelectedStock.symbol} ทั้งหมดออกจากพอร์ต</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              เลือกหุ้นที่จะทดลองซื้อ
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              {allStocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.name} ({s.currentPrice} ฿)
                </option>
              ))}
            </select>
          </div>

          {/* Shares Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              จำนวนหุ้น (ขั้นต่ำ 100 หุ้น)
            </label>
            <input
              type="number"
              step="100"
              min="100"
              value={orderShares}
              onChange={(e) => setOrderShares(Math.max(100, Number(e.target.value)))}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
            />
            {/* Quick Share Chips */}
            <div className="flex gap-1 mt-1.5">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOrderShares(amt)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    orderShares === amt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Capital Required */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              มูลค่าเงินลงทุน + ค่าคอม
            </label>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {(customEntryPrice * orderShares + Math.round(customEntryPrice * orderShares * BROKER_FEE_RATE)).toLocaleString()} ฿
              </div>
              <span className="text-[10px] text-slate-400 block">
                (ค่าหุ้น {(customEntryPrice * orderShares).toLocaleString()} + คอม {Math.round(customEntryPrice * orderShares * BROKER_FEE_RATE)} ฿)
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleExecuteSimBuy}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ส่งคำสั่งซื้อจำลอง (Buy Paper)</span>
            </button>
          </div>
        </div>

        {/* Selected Stock Indicators with Traffic Lights */}
        {currentSelectedStock && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">สัญญาณระบบ:</span>
            <TrafficStatusBadge type="RR" value={2.8} />
            <TrafficStatusBadge type="MOS" value={currentSelectedStock.marginOfSafety} />
            <TrafficStatusBadge type="DE" value={currentSelectedStock.de} />
            <span className="text-xs font-bold text-slate-400 ml-auto">
              ราคาตลาดปัจจุบัน: {currentSelectedStock.currentPrice} {currentSelectedStock.currency}
            </span>
          </div>
        )}
      </div>

      {/* 4. CURRENT SIMULATED HOLDINGS (หุ้นจำลองที่ถืออยู่) */}
      <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>หุ้นจำลองที่กำลังถือครอง ({positions.length} รายการ)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              สถานะกำไรขาดทุนแบบเรียลไทม์ พร้อมปุ่มตัดขาดทุน (SL), ทำกำไร (TP) และปุ่มลบหุ้นออก
            </p>
          </div>

          {positions.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>สามารถกดลบออเดอร์ที่ส่งซ้ำเพื่อรับเงินสดคืนได้ทันที</span>
            </div>
          )}
        </div>

        {/* Duplicate Symbols Banner across portfolio */}
        {duplicateSymbols.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center space-x-2.5 text-amber-900 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 md:mt-0" />
              <div>
                <span className="font-bold">ตรวจพบหุ้นที่ส่งคำสั่งซื้อซ้ำในพอร์ตจำลอง:</span>{' '}
                <span className="font-black text-amber-700 dark:text-amber-300">{duplicateSymbols.join(', ')}</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block sm:inline sm:ml-1">
                  (คุณสามารถเลือกลบเฉพาะไม้ที่ส่งซ้ำ หรือรวมไม้เพื่อเฉลี่ยต้นทุนได้ทันที)
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCleanAllDuplicatesInPortfolio}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบไม้ที่ส่งซ้ำออกทั้งหมด (คืนเงิน)</span>
              </button>
              <button
                type="button"
                onClick={handleMergeAllDuplicatesInPortfolio}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รวมไม้ซ้ำทั้งหมด (เฉลี่ยต้นทุน)</span>
              </button>
            </div>
          </div>
        )}

        {positions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-slate-400">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-bold">ยังไม่มีหุ้นจำลองในพอร์ต</p>
            <p className="text-[11px] mt-1">เลือกหุ้นจากกล่องด้านบนแล้วกด "ส่งคำสั่งซื้อจำลอง" เพื่อเริ่มต้นซ้อมเทรด</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {positions.map((pos) => {
              const fresh = allStocks.find((s) => s.symbol === pos.symbol);
              const currentP = fresh ? fresh.currentPrice : pos.currentPrice;
              const currentValue = currentP * pos.shares;
              const profitBaht = currentValue - pos.totalCost;
              const profitPercent = Number(((profitBaht / pos.totalCost) * 100).toFixed(2));
              const isDuplicate = symbolCounts[pos.symbol] > 1;

              return (
                <div
                  key={pos.id}
                  className={`p-4 rounded-2xl border ${
                    isDuplicate
                      ? 'border-amber-400/60 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#18181B]'
                  } flex flex-col justify-between space-y-3`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {pos.symbol}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 font-bold">
                          {pos.shares.toLocaleString()} หุ้น
                        </span>
                        {isDuplicate && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>ถือซ้ำ ({symbolCounts[pos.symbol]} ไม้)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{pos.stockName}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {currentP} {pos.currency}
                      </div>
                      <div className={`text-xs font-bold ${profitBaht >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {profitBaht >= 0 ? '+' : ''}{profitBaht.toLocaleString()} ฿ ({profitPercent}%)
                      </div>
                    </div>
                  </div>

                  {/* Entry vs SL vs TP */}
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-center text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">ทุนเข้า</span>
                      <strong className="text-slate-800 dark:text-zinc-200">{pos.entryPrice} ฿</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 block">Stop Loss</span>
                      <strong className="text-rose-600 dark:text-rose-400">{pos.stopLossPrice} ฿</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500 block">Target TP</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{pos.targetPrice} ฿</strong>
                    </div>
                  </div>

                  {/* Actions: Close Position & Delete/Remove */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleClosePosition(pos, 'TAKE_PROFIT')}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer"
                    >
                      🏆 ทำกำไร (TP)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClosePosition(pos, 'STOP_LOSS')}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/30 transition-all cursor-pointer"
                    >
                      🛑 ตัดขาดทุน (SL)
                    </button>
                    <button
                      type="button"
                      title="ลบรายการนี้ออกจากพอร์ตจำลอง (คืนเงินสด)"
                      onClick={() => setPositionToDelete(pos)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-200/80 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 border border-slate-300/60 dark:border-zinc-700"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden sm:inline">ลบออก</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. CLOSED TRADES SIMULATION LEDGER (ประวัติการซ้อมปิดสถานะ) */}
      {closedTrades.length > 0 && (
        <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>ประวัติการปิดสถานะจำลอง (Simulation Journal Ledger)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500">
                  <th className="py-2 px-3">หุ้น</th>
                  <th className="py-2 px-3">จำนวน</th>
                  <th className="py-2 px-3">ราคาเข้า</th>
                  <th className="py-2 px-3">ราคาออก</th>
                  <th className="py-2 px-3">เหตุผล</th>
                  <th className="py-2 px-3 text-right">กำไร/ขาดทุนสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {closedTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 font-medium">
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      {t.symbol}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300">
                      {t.shares.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300">
                      {t.entryPrice} ฿
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300">
                      {t.exitPrice} ฿
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        t.exitReason === 'TAKE_PROFIT'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {t.exitReason === 'TAKE_PROFIT' ? '🏆 Take Profit' : '🛑 Stop Loss'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-black ${
                      t.realizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {t.realizedPnL >= 0 ? '+' : ''}{t.realizedPnL.toLocaleString()} ฿ ({t.realizedPnLPercent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                ยืนยันการรีเซ็ตพอร์ตจำลอง?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                การรีเซ็ตจะล้างข้อมูลการจำลองและตั้งต้นเงินทุนใหม่เป็น {initialCapital.toLocaleString()} บาท เพื่อให้คุณเริ่มนับหนึ่งการซ้อมรอบใหม่
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetSimulation}
                className="flex-1 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
              >
                ยืนยันรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Order Handling Modal */}
      {duplicateOrderPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl max-w-md w-full p-6 border border-amber-300 dark:border-amber-800 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    ตรวจพบการส่งคำสั่งซื้อหุ้นซ้ำ
                  </h4>
                  <p className="text-xs text-slate-500">
                    {duplicateOrderPrompt.stock.symbol} ({duplicateOrderPrompt.stock.name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateOrderPrompt(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing vs New Order Comparison */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span>หุ้นเดิมในพอร์ต:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {duplicateOrderPrompt.existingPositions.reduce((sum, p) => sum + p.shares, 0).toLocaleString()} หุ้น ({duplicateOrderPrompt.existingPositions.length} ไม้)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                <span>คำสั่งซื้อใหม่ที่เพิ่งส่ง:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  +{duplicateOrderPrompt.shares.toLocaleString()} หุ้น @ {duplicateOrderPrompt.price} ฿ ({duplicateOrderPrompt.totalRequired.toLocaleString()} ฿)
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 block">
                เลือกรูปแบบที่คุณต้องการจัดการ:
              </span>

              {/* Option 1: Replace old with new (useful if user accidentally bought duplicate or wanted to change order) */}
              <button
                type="button"
                onClick={handleConfirmReplacePrompt}
                className="w-full p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black text-rose-700 dark:text-rose-300 flex items-center space-x-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบของเดิมออก แล้วแทนที่ด้วยคำสั่งซื้อใหม่นี้</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
                    แนะนำถ้าส่งผิด
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  คืนเงินสดของไม้เดิมเข้ากระเป๋าเต็มจำนวน แล้วเปิดไม้ใหม่นี้แทนที่
                </p>
              </button>

              {/* Option 2: Merge and average entry price */}
              <button
                type="button"
                onClick={handleConfirmMergePrompt}
                className="w-full p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>รวมเป็นไม้เดียวและคำนวณราคาเฉลี่ยใหม่ (Merge)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  รวมจำนวนหุ้นทั้งหมดเข้าด้วยกัน และปรับต้นทุนเฉลี่ยตามน้ำหนักจริง
                </p>
              </button>

              {/* Option 3: Keep as separate tranche */}
              <button
                type="button"
                onClick={handleConfirmAddTranche}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-200 flex items-center space-x-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>ถือเป็นไม้อิสระเพิ่มอีก 1 ไม้ (Add Tranche)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  บันทึกแยกเป็นอีกบรรทัดหนึ่ง เพื่อจับจังหวะขายทำกำไรหรือ Stop Loss แยกกัน
                </p>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setDuplicateOrderPrompt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                ยกเลิกคำสั่งซื้อนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Position Modal */}
      {positionToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                ลบ {positionToDelete.symbol} ออกจากพอร์ตจำลอง?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                จำนวน {positionToDelete.shares.toLocaleString()} หุ้น (ต้นทุน {positionToDelete.entryPrice} ฿)
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                <span>คืนเงินสดเข้ากระเป๋า:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  +{(positionToDelete.totalCost + positionToDelete.feePaid).toLocaleString()} ฿
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                *การลบนี้เป็นเพียงการแก้ไขพอร์ต จะไม่มีผลกระทบต่อสถิติ Win Rate หรือประวัติการปิดสถานะ
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPositionToDelete(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeletePosition(positionToDelete)}
                className="flex-1 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer flex items-center justify-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบและคืนเงิน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Positions for a Symbol Modal */}
      {symbolToDeleteAll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                ลบหุ้น {symbolToDeleteAll} ทุกไม้ออกจากพอร์ต?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบจะลบทุกรายการของหุ้นนี้ในพอร์ตจำลอง และคืนเงินสดเต็มจำนวน
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setSymbolToDeleteAll(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAllBySymbol(symbolToDeleteAll)}
                className="flex-1 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer flex items-center justify-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
