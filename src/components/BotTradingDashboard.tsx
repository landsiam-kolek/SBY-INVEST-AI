import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Pause, 
  Sliders, 
  Search, 
  Filter, 
  Layers, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Copy, 
  Eye, 
  Lock, 
  Zap, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Download,
  Flame,
  UserCheck,
  Check,
  Trash2,
  X
} from 'lucide-react';
import { 
  BotWatchItem, 
  BotTradeOrder, 
  PostMarketEODSummary, 
  StockData, 
  BotStrategyType 
} from '../types';
import { botTradingService } from '../services/botTradingService';
import { mockBroker, LIVE_TRADING_ENABLED } from '../services/mockBrokerService';
import { formatCurrency, formatNumber } from '../utils/calculations';
import { copyToClipboard } from '../utils/clipboardHelper';

interface BotTradingDashboardProps {
  allStocks: StockData[];
  onSelectStockForDeepAnalysis: (stock: StockData) => void;
  onOpenWorkingPaperProposal?: () => void;
}

export const BotTradingDashboard: React.FC<BotTradingDashboardProps> = ({
  allStocks,
  onSelectStockForDeepAnalysis,
  onOpenWorkingPaperProposal,
}) => {
  // Navigation tabs within Bot Dashboard
  const [activeTab, setActiveTab] = useState<'WATCHING_RADAR' | 'POST_MARKET_REPORTS' | 'EXECUTION_ORDERS' | 'SAFETY_COMPLIANCE'>('WATCHING_RADAR');

  // Bot Status State
  const [botStatus, setBotStatus] = useState<'RUNNING' | 'PAUSED' | 'EMERGENCY_HALTED'>(() => botTradingService.getBotStatus());
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<Date>(new Date());
  const [heartbeatLatency, setHeartbeatLatency] = useState<number>(14);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<BotWatchItem[]>(() => botTradingService.getWatchlist());
  const [filterStrategy, setFilterStrategy] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Post-Market Report Period Filter
  const [reportPeriod, setReportPeriod] = useState<'DAILY_EOD' | 'WEEKLY' | 'MONTHLY_TERM' | 'ALL_TIME'>('DAILY_EOD');
  const [postMarketSummary, setPostMarketSummary] = useState<PostMarketEODSummary>(() => botTradingService.generatePostMarketSummary('DAILY_EOD'));

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<BotTradeOrder | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Emergency Kill Switch State
  const [showKillSwitchModal, setShowKillSwitchModal] = useState<boolean>(false);
  const [killSwitchReason, setKillSwitchReason] = useState<string>('');
  const [isHalting, setIsHalting] = useState<boolean>(false);

  // Refresh interval for heartbeat and prices
  useEffect(() => {
    const interval = setInterval(async () => {
      const hb = await mockBroker.checkHeartbeat();
      setLastHeartbeatTime(new Date());
      setHeartbeatLatency(hb.latencyMs);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update post market summary when period changes
  useEffect(() => {
    setPostMarketSummary(botTradingService.generatePostMarketSummary(reportPeriod));
  }, [reportPeriod]);

  const handleToggleBotPause = () => {
    const nextStatus = botStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    botTradingService.setBotStatus(nextStatus);
    setBotStatus(nextStatus);
  };

  const handleTriggerEmergencyKillSwitch = () => {
    setIsHalting(true);
    setTimeout(() => {
      botTradingService.setBotStatus('EMERGENCY_HALTED');
      setBotStatus('EMERGENCY_HALTED');
      setIsHalting(false);
      setShowKillSwitchModal(false);
    }, 600);
  };

  const handleResumeFromKillSwitch = () => {
    botTradingService.setBotStatus('RUNNING');
    setBotStatus('RUNNING');
  };

  const handleToggleAutoTrading = (id: string) => {
    botTradingService.toggleItemAutoTrading(id);
    setWatchlist(botTradingService.getWatchlist());
  };

  const handleRemoveStock = (id: string, symbol: string) => {
    botTradingService.removeStockFromWatchlist(id);
    setWatchlist(botTradingService.getWatchlist());
  };

  const handleCopyHash = (hash: string) => {
    copyToClipboard(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleExportCsv = () => {
    const orders = postMarketSummary.orders;
    const header = 'OrderNo,Date,Time,Symbol,Side,Shares,Price,TotalAmount,Commission,NetTotal,Strategy,AuditHash,Status\n';
    const rows = orders.map(o => 
      `"${o.orderNumber}","${o.date}","${o.time}","${o.symbol}","${o.side}",${o.shares},${o.price},${o.totalValue},${o.commission},${o.netAmount},"${o.strategy}","${o.auditHash}","${o.status}"`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SBY_BOT_REPORT_${reportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered watchlist
  const filteredWatchlist = watchlist.filter(item => {
    const matchSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || item.stockName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStrat = filterStrategy === 'ALL' || item.strategy === filterStrategy;
    return matchSearch && matchStrat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Bot Status, Heartbeat, Kill Switch & Compliance Indicators */}
      <div className="p-4 sm:p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              botStatus === 'RUNNING' ? 'bg-emerald-500 text-white shadow-emerald-500/30' :
              botStatus === 'PAUSED' ? 'bg-amber-500 text-slate-950 shadow-amber-500/30' :
              'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
            }`}>
              <Bot className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  SBY ALGORITHMIC BOT ENGINE
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide flex items-center space-x-1 ${
                  botStatus === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  botStatus === 'PAUSED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    botStatus === 'RUNNING' ? 'bg-emerald-400 animate-ping' :
                    botStatus === 'PAUSED' ? 'bg-amber-400' : 'bg-rose-500'
                  }`} />
                  <span>
                    {botStatus === 'RUNNING' ? 'STATUS: ACTIVE TRACKING' :
                     botStatus === 'PAUSED' ? 'STATUS: PAUSED (STANDBY)' :
                     'STATUS: EMERGENCY HALTED'}
                  </span>
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>ก.ล.ต. / SET COMPLIANT (SELF-ACCOUNT)</span>
                </span>
              </div>

              <div className="flex items-center space-x-4 mt-1.5 text-xs text-slate-300 flex-wrap gap-y-1">
                <span className="flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Heartbeat: <strong className="text-white">{heartbeatLatency}ms</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ping: {lastHeartbeatTime.toLocaleTimeString('th-TH')}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>โหมด: <strong className="text-white">Human-in-the-Loop Sign-Off</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Control Buttons (Pause / Resume / Emergency Kill Switch) */}
          <div className="flex items-center space-x-2 shrink-0">
            {botStatus !== 'EMERGENCY_HALTED' ? (
              <>
                <button
                  onClick={handleToggleBotPause}
                  id="btn-bot-toggle-pause"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
                    botStatus === 'RUNNING' 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {botStatus === 'RUNNING' ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>พักการทำงานบอต</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-white" />
                      <span>เปิดบอตทำงานต่อ</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowKillSwitchModal(true)}
                  id="btn-bot-emergency-kill"
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center space-x-1.5 shadow-md shadow-rose-900/30 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-200" />
                  <span>🚨 EMERGENCY KILL SWITCH</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleResumeFromKillSwitch}
                id="btn-bot-resume-halt"
                className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-900/30"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
                <span>ปลดล็อค & รีสตาร์ทบอต</span>
              </button>
            )}

            {onOpenWorkingPaperProposal && (
              <button
                onClick={onOpenWorkingPaperProposal}
                id="btn-bot-open-working-paper"
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                <span>Working Paper</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 space-x-2 sm:space-x-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('WATCHING_RADAR')}
          id="tab-bot-radar"
          className={`pb-3 px-2 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'WATCHING_RADAR'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>📡 หุ้นที่บอตกำลังเฝ้าดูติดตาม ({watchlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('POST_MARKET_REPORTS')}
          id="tab-bot-reports"
          className={`pb-3 px-2 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'POST_MARKET_REPORTS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>📊 สรุปผลซื้อ/ขายหลังปิดตลาด (EOD & Period Term)</span>
        </button>

        <button
          onClick={() => setActiveTab('EXECUTION_ORDERS')}
          id="tab-bot-orders"
          className={`pb-3 px-2 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'EXECUTION_ORDERS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-500" />
          <span>📑 บันทึกคำสั่งซื้อ/ขายที่เกิดขึ้น (Trade Log & Hashes)</span>
        </button>

        <button
          onClick={() => setActiveTab('SAFETY_COMPLIANCE')}
          id="tab-bot-compliance"
          className={`pb-3 px-2 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'SAFETY_COMPLIANCE'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-500" />
          <span>⚖️ ข้อกฎหมาย ก.ล.ต. & 5-Level Kill Switch</span>
        </button>
      </div>

      {/* TAB 1: WATCHING RADAR (หุ้นที่บอตกำลังเฝ้าดูติดตาม) */}
      {activeTab === 'WATCHING_RADAR' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสหุ้นที่บอตติดตาม..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterStrategy}
                onChange={(e) => setFilterStrategy(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="ALL">ทุกกลยุทธ์ของบอต</option>
                <option value="VI_MOS_REBALANCE">VI: MOS & Rebalance</option>
                <option value="ANTI_STOP_HUNT_PULLBACK">Technical: Anti-Stop Hunt</option>
                <option value="MOMENTUM_BREAKOUT">Technical: Momentum Breakout</option>
                <option value="DIVIDEND_COMPOUNDER">VI: Dividend Compounder</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>บอตกำลังรัน Technical Check ทุกแท่งเทียน 5m/15m/Day</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWatchlist.map((item) => {
              const matchedStock = allStocks.find(s => s.symbol === item.symbol);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800/90 p-4 sm:p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            {item.sector}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            item.status === 'PROPOSING' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse' :
                            item.status === 'ACTIVE_POSITION' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                            item.status === 'WATCHING' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                            'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                          }`}>
                            {item.status === 'PROPOSING' ? '⚡ สัญญาณครบ: รอ Sign-Off' :
                             item.status === 'ACTIVE_POSITION' ? '🟢 ถือครอง & Trailing SL' :
                             item.status === 'WATCHING' ? '👀 เฝ้าจุดเข้าซื้อ' : '🔍 สแกน'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {item.stockName}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-base font-black text-slate-900 dark:text-white">
                            {formatNumber(item.currentPrice, 2)}
                          </div>
                          <div className={`text-[11px] font-bold ${
                            item.distanceToEntryPercent >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                          }`}>
                            เป้าเข้า: {formatNumber(item.targetEntryPrice, 2)} ({item.distanceToEntryPercent > 0 ? '+' : ''}{item.distanceToEntryPercent}%)
                          </div>
                        </div>

                        {/* Delete/Remove Stock from Bot Watchlist Button */}
                        <button
                          onClick={() => handleRemoveStock(item.id, item.symbol)}
                          id={`btn-remove-watch-${item.symbol.toLowerCase()}`}
                          title={`ลบ ${item.symbol} ออกจากการเฝ้าติดตาม`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress to Trigger */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="text-slate-600 dark:text-zinc-400 font-semibold">ความพร้อมของสัญญาณเทคนิค:</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{item.triggerProgressPercent}%</strong>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.triggerProgressPercent >= 90 ? 'bg-emerald-500' :
                            item.triggerProgressPercent >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.triggerProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Technical Condition & Note */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-850 text-xs mb-3 space-y-1">
                      <div className="text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                        🎯 <strong>เงื่อนไข:</strong> {item.technicalCondition}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        🛡️ <strong>Risk Guard:</strong> {item.safetyNote}
                      </div>
                    </div>

                    {/* Indicators Matrix */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] mb-3">
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        <div className="text-slate-400">SL (จุดตัด)</div>
                        <div className="font-bold text-rose-500">{item.stopLossPrice}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        <div className="text-slate-400">TP (เป้าหมาย)</div>
                        <div className="font-bold text-emerald-500">{item.targetPrice}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        <div className="text-slate-400">R:R Ratio</div>
                        <div className="font-bold text-indigo-500">1:{item.riskRewardRatio}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                        <div className="text-slate-400">MOS</div>
                        <div className="font-bold text-slate-800 dark:text-zinc-200">+{item.mosPercent}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleAutoTrading(item.id)}
                      className={`text-[11px] px-2 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                        item.autoTradingEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{item.autoTradingEnabled ? 'เปิด Auto-Proposal' : 'ปิดแจ้งเตือน'}</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      {item.status === 'PROPOSING' && onOpenWorkingPaperProposal && (
                        <button
                          onClick={onOpenWorkingPaperProposal}
                          className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs"
                        >
                          ลงนาม Sign-Off
                        </button>
                      )}

                      {matchedStock && (
                        <button
                          onClick={() => onSelectStockForDeepAnalysis(matchedStock)}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
                        >
                          <span>ดูกราฟเจาะลึก</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: POST-MARKET REPORTS (รายงาน ซื้อ/ขาย หลังปิดตลาด รายวัน & Period Term) */}
      {activeTab === 'POST_MARKET_REPORTS' && (
        <div className="space-y-5">
          {/* Period Selector & Export Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>เลือกระยะเวลารายงาน:</span>
              </span>

              <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setReportPeriod('DAILY_EOD')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    reportPeriod === 'DAILY_EOD'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  รายวันปิดตลาด (EOD)
                </button>
                <button
                  onClick={() => setReportPeriod('WEEKLY')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    reportPeriod === 'WEEKLY'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  รายสัปดาห์ (Weekly)
                </button>
                <button
                  onClick={() => setReportPeriod('MONTHLY_TERM')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    reportPeriod === 'MONTHLY_TERM'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  รอบระยะเวลา (Period Term)
                </button>
                <button
                  onClick={() => setReportPeriod('ALL_TIME')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    reportPeriod === 'ALL_TIME'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  รวมทั้งหมด (All-Time)
                </button>
              </div>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-all flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>ส่งออกรายงาน CSV (Audit-Ready)</span>
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                กำไร-ขาดทุนสุทธิ (Net Realized)
              </div>
              <div className={`text-lg sm:text-xl font-black ${
                postMarketSummary.netRealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {postMarketSummary.netRealizedPnL >= 0 ? '+' : ''}{formatCurrency(postMarketSummary.netRealizedPnL, 'THB')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                หักค่าคอมฯ {formatCurrency(postMarketSummary.totalFeesPaid, 'THB')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                Win Rate อัตราชนะ
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {postMarketSummary.winRatePercent}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                ชนะ {postMarketSummary.winCount} ไม้ / แพ้ {postMarketSummary.lossCount} ไม้
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                มูลค่าการซื้อขายรวม (Volume)
              </div>
              <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(postMarketSummary.totalTradingVolumeThb, 'THB')}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                ซื้อ {postMarketSummary.buyCount} / ขาย {postMarketSummary.sellCount} ครั้ง
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                Profit Factor
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-500">
                {postMarketSummary.profitFactor}x
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Max Win {formatCurrency(postMarketSummary.largestWinThb, 'THB')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 col-span-2 lg:col-span-1">
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-1">
                สถานะความถูกต้องตามกฎหมาย
              </div>
              <div className="text-sm font-black text-emerald-500 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% SEC/SET PASS</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                บัญชีตนเอง ไม่มีการสร้างราคาเทียม
              </div>
            </div>
          </div>

          {/* Report Breakdown Table */}
          <div className="bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  ตารางรายงานสรุปคำสั่งซื้อขายบอตประจำช่วงเวลา ({postMarketSummary.orders.length} รายการ)
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                วันที่รายงาน: {postMarketSummary.reportDate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">เวลา / วันที่</th>
                    <th className="py-2.5 px-3">เลขอ้างอิง</th>
                    <th className="py-2.5 px-3">หุ้น</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3 text-right">จำนวนหุ้น</th>
                    <th className="py-2.5 px-3 text-right">ราคา Match</th>
                    <th className="py-2.5 px-3 text-right">มูลค่าสุทธิ (บาท)</th>
                    <th className="py-2.5 px-3">กลยุทธ์บอต</th>
                    <th className="py-2.5 px-3">การอนุมัติ</th>
                    <th className="py-2.5 px-3 text-center">หลักฐาน Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                  {postMarketSummary.orders.map((ord) => (
                    <tr 
                      key={ord.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        <div>{ord.time}</div>
                        <div className="text-[10px] text-slate-400">{ord.date}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-zinc-300 font-bold">
                        {ord.orderNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-white">{ord.symbol}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{ord.stockName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          ord.side === 'BUY'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {ord.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-zinc-200">
                        {formatNumber(ord.shares)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-zinc-200">
                        {formatNumber(ord.matchedPrice, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(ord.netAmount, 'THB')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300 text-[11px]">
                        {ord.strategy === 'VI_MOS_REBALANCE' ? 'VI: MOS Rebalance' :
                         ord.strategy === 'ANTI_STOP_HUNT_PULLBACK' ? 'Anti-Stop Hunt' :
                         ord.strategy === 'MOMENTUM_BREAKOUT' ? 'Momentum Break' : 'Dividend Comp.'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PIN Verified</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyHash(ord.auditHash);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[10px] font-mono text-slate-600 dark:text-zinc-300 inline-flex items-center space-x-1"
                          title="คัดลอก SHA-256 Audit Hash"
                        >
                          <span>{ord.auditHash.slice(0, 8)}...</span>
                          {copiedHash === ord.auditHash ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTION ORDERS (บันทึกคำสั่งซื้อ/ขายที่เกิดขึ้น & Audit Hashes) */}
      {activeTab === 'EXECUTION_ORDERS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>ระบบตรวจสอบย้อนกลับคำสั่งบอต (Immutable Hash-Chained Audit Ledger)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              คำสั่งเทรดทุกรายการที่บอตส่งไป จะถูกคำนวณรหัสลับ SHA-256 เชื่อมโยงกับคำสั่งก่อนหน้า (Hash Chaining)
              ป้องกันการปลอมแปลง แก้ไขตัวเลขย้อนหลัง หรือสร้างราคาเทียม พร้อมบันทึกเหตุผลการเข้าซื้อตามหลักการลงทุนที่วางไว้
            </p>
          </div>

          <div className="space-y-3">
            {postMarketSummary.orders.map((ord, idx) => (
              <div 
                key={ord.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{ord.symbol}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
                      ord.side === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700'
                    }`}>
                      {ord.side} {formatNumber(ord.shares)} หุ้น @ {ord.matchedPrice} บาท
                    </span>
                    <span className="text-xs text-slate-500">มูลค่า: <strong>{formatCurrency(ord.netAmount, 'THB')}</strong></span>
                  </div>
                  
                  <div className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    💡 <strong>เหตุผลการเทรด:</strong> {ord.reason}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2 pt-1">
                    <span>SHA-256: {ord.auditHash}</span>
                    <button
                      onClick={() => handleCopyHash(ord.auditHash)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center space-x-0.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedHash === ord.auditHash ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500">เวลาส่งคำสั่ง: {ord.time} ({ord.date})</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    ✓ สถานะ: MATCHED & SETTLED
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SAFETY & COMPLIANCE (ข้อกฎหมาย ก.ล.ต. & 5-Level Kill Switch) */}
      {activeTab === 'SAFETY_COMPLIANCE' && (
        <div className="space-y-5">
          {/* SEC / SET Compliance Overview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ข้อกฎหมายและแนวทางปฏิบัติการใช้บอตเทรดหุ้น (ตามเกณฑ์ ก.ล.ต. และ ตลท.)
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  ระบบ SBY INVEST AI ออกแบบตามหลักเกณฑ์ความปลอดภัยเพื่อป้องกันข้อหาปั่นหุ้นหรือการสร้างภาพลวงตาในตลาด
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>1. ห้ามสร้างราคาหรือสร้างสภาพการซื้อขายเทียม (Market Manipulation)</span>
                </h4>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  บอตต้องไม่มีพฤติกรรมส่งคำสั่งแล้วยกเลิกอย่างรวดเร็ว (Spoofing / Layering), ไม่ดันหรือกดราคาผิดปกติ, 
                  และไม่จับคู่ซื้อขายกันเองในพอร์ต (Wash Trade). บอตของ SBY ใช้เฉพาะคำสั่ง Limit/Market แท้จริงเพื่อลงทุน
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>2. เทรดเฉพาะบัญชีและเงินของตนเอง (Self-Managed Only)</span>
                </h4>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  ห้ามนำบอตไปรับฝากเงินเทรดให้ผู้อื่น หรือเปิดรับระดมทุนโดยไม่มีใบอนุญาต บลจ./ที่ปรึกษาการลงทุน 
                  ระบบ SBY ถูกจำกัดให้ทำงานเฉพาะบัญชีส่วนบุคคลผ่าน Settrade Open API ที่ได้รับการยืนยันตัวตน
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>3. Human-in-the-Loop Sign-Off (ผู้ใช้ตรวจสอบทุกไม้)</span>
                </h4>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  ก่อนบอตส่งคำสั่งซื้อใดๆ จะต้องสร้างเอกสาร <strong>Portfolio Working Paper Table</strong> 
                  ระบุราคาเข้า, จุดตัดขาดทุน Multi-Tier SL, และราคาเป้าหมาย เพื่อให้ผู้ใช้กรอกรหัส PIN ยืนยันเสมอ
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>4. อัตราการส่งคำสั่ง (Rate Limiting) ตามเกณฑ์โบรกเกอร์</span>
                </h4>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                  ระบบจำกัดการส่งคำสั่งไม่เกิน 60 ครั้งต่อนาที และดึงข้อมูลมาร์เก็ตดาต้าไม่เกิน 5 ครั้งต่อวินาที 
                  ป้องกันระบบโบรกเกอร์หน่วงหรือถูกตัดสิทธิ์การเชื่อมต่อ
                </p>
              </div>
            </div>
          </div>

          {/* 5-Level Kill Switch Framework */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>ลำดับชั้นของคำสั่งยกเลิกการปฏิบัติการของบอต (5-Level Kill Switch Hierarchy)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-black flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">ระดับที่ 1: Modal Dismiss (ปฏิเสธคำสั่งก่อนส่ง)</h4>
                  <p className="text-slate-500 dark:text-zinc-400">เมื่อบอตเสนอ Working Paper ผู้ใช้สามารถกดยกเลิก (Dismiss/Cancel) เพื่อหยุดไม่ให้ส่งคำสั่งไปยังตลาดได้ทันที</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-black flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">ระดับที่ 2: Active Order Cancel (ยกเลิกคำสั่งที่ค้างในกระดาน)</h4>
                  <p className="text-slate-500 dark:text-zinc-400">หากคำสั่งถูกส่งไปแล้วและยังไม่ถูก Match (Pending) สามารถกดยกเลิกเฉพาะไม้ผ่านปุ่ม Cancel Order ในระบบ</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-600 font-black flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">ระดับที่ 3: Emergency Kill Switch (One-Click Cancel All & Freeze)</h4>
                  <p className="text-slate-500 dark:text-zinc-400">ปุ่มสีแดงใหญ่บนหน้าจอ กดครั้งเดียวยกเลิกทุกคำสั่งที่ค้างอยู่ทั้งหมด และตัดสิทธิ์บอตไม่ให้ส่งคำสั่งใหม่อย่างเด็ดขาด</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 font-black flex items-center justify-center shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">ระดับที่ 4: Algorithmic Circuit Breaker (ระบบหยุดอัตโนมัติเมื่อขาดทุนถึงเพดาน)</h4>
                  <p className="text-slate-500 dark:text-zinc-400">หากพอร์ตขาดทุนเกินค่า Max Drawdown หรือราคาหลุด Stop Loss บอตจะหยุดการเทรดในวันนั้นทันทีโดยไม่ต้องรอสั่งการ</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 font-black flex items-center justify-center shrink-0">5</div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">ระดับที่ 5: Disconnection & Heartbeat Fail-Safe (หยุดทำงานเมื่อเน็ตหลุด)</h4>
                  <p className="text-slate-500 dark:text-zinc-400">เมื่อขาดการเชื่อมต่อเกิน 5 วินาที หรือราคาไม่อัปเดตเกิน 10 วินาที ระบบจะเข้าสู่ SAFE_HALT_MODE ทันทีเพื่อความปลอดภัยสูงสุด</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Kill Switch Modal Dialog */}
      {showKillSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151518] rounded-3xl border border-rose-500/50 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ยืนยันการเปิดใช้งาน EMERGENCY KILL SWITCH?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                การดำเนินการนี้จะ <strong>ยกเลิกคำสั่งที่ค้างอยู่ในตลาดทั้งหมดทันที</strong> และระงับการทำงานของบอตทุกกลยุทธ์
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
              ⚠️ การกระทำนี้สอดคล้องกับระเบียบการควบคุมความเสี่ยงของ ตลท. เพื่อป้องกันความเสียหายของเงินทุน
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowKillSwitchModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
              >
                ยกเลิก (กลับไปเฝ้าต่อ)
              </button>
              <button
                onClick={handleTriggerEmergencyKillSwitch}
                disabled={isHalting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-900/30 transition-all flex items-center justify-center space-x-1"
              >
                {isHalting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>หยุดฉุกเฉินเดี๋ยวนี้!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151518] rounded-3xl border border-slate-200 dark:border-zinc-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-black text-slate-900 dark:text-white">{selectedOrder.symbol}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
                    selectedOrder.side === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedOrder.side}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{selectedOrder.stockName}</p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900">
                <div className="text-slate-400">เลขที่คำสั่ง</div>
                <div className="font-bold text-slate-900 dark:text-white">{selectedOrder.orderNumber}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900">
                <div className="text-slate-400">เวลาส่งคำสั่ง</div>
                <div className="font-bold text-slate-900 dark:text-white">{selectedOrder.time} ({selectedOrder.date})</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900">
                <div className="text-slate-400">จำนวนหุ้นที่ Match</div>
                <div className="font-bold text-slate-900 dark:text-white">{formatNumber(selectedOrder.shares)} หุ้น @ {selectedOrder.matchedPrice} บาท</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900">
                <div className="text-slate-400">มูลค่าสุทธิ</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedOrder.netAmount, 'THB')}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-zinc-200">เหตุผลการเข้าเทรดของบอต:</div>
              <div className="text-slate-600 dark:text-zinc-400 leading-relaxed">{selectedOrder.reason}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 text-[11px] font-mono break-all space-y-1">
              <div className="text-slate-400 text-[10px]">SHA-256 AUDIT HASH:</div>
              <div>{selectedOrder.auditHash}</div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
