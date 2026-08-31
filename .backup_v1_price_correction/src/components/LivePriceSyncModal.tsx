import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Sliders, 
  Clock, 
  Check, 
  Zap, 
  Plus, 
  Minus, 
  Sparkles,
  Info,
  HelpCircle,
  BarChart2,
  FileSpreadsheet,
  UploadCloud,
  FileText,
  Filter,
  Layers,
  ArrowRight,
  Database,
  Building2,
  PieChart,
  Printer,
  Download,
  Calendar,
  Lock,
  Edit3
} from 'lucide-react';
import { StockData, DayTradePortfolio, StockCapSize, DailyPriceReportSummary, DailyStockPrice } from '../types';
import { 
  getSetPriceStep, 
  parseSiamchartOrSettradeData, 
  REAL_MARKET_SNAPSHOT_PRESET, 
  categorizeStockCapSize,
  filterStocksBySize,
  updateStockWithNewPrice,
  calculateLatestValidTradeDate,
  generateDailyStockPriceReport,
  exportDailyPriceReportToExcel,
  printDailyPriceReport,
  saveDailyStockPriceRecords,
  getDailyStockPriceDatabase
} from '../utils/priceSyncEngine';

interface LivePriceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  allStocks: StockData[];
  dayTradePortfolio: DayTradePortfolio;
  onUpdateSingleStockPrice: (symbol: string, newPrice: number, customPrevClose?: number) => void;
  onBatchUpdatePrices?: (updatedStocksList: StockData[]) => void;
  onSyncAllPrices: () => void;
  lastSyncedTime: Date;
  onSelectStockToAnalyze?: (stock: StockData) => void;
}

export const LivePriceSyncModal: React.FC<LivePriceSyncModalProps> = ({
  isOpen,
  onClose,
  allStocks,
  dayTradePortfolio,
  onUpdateSingleStockPrice,
  onBatchUpdatePrices,
  onSyncAllPrices,
  lastSyncedTime,
  onSelectStockToAnalyze,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'import' | 'edit_table' | 'architecture_faq'>('report');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFocusOnly, setFilterFocusOnly] = useState<boolean>(false);
  const [selectedCapSize, setSelectedCapSize] = useState<StockCapSize | 'ALL'>('ALL');
  const [selectedGainLossFilter, setSelectedGainLossFilter] = useState<'ALL' | 'GAINERS' | 'DECLINERS' | 'UNCHANGED'>('ALL');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSavedSymbol, setJustSavedSymbol] = useState<string | null>(null);
  
  // Custom edit state
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [customPrevCloses, setCustomPrevCloses] = useState<Record<string, string>>({});

  // Import Siamchart / Settrade state
  const [importRawText, setImportRawText] = useState<string>('');
  const [importTradeDate, setImportTradeDate] = useState<string>(() => {
    return calculateLatestValidTradeDate().priceDateStr;
  });
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const { reportDateStr, priceDateStr, isWeekendOrHoliday } = useMemo(() => {
    return calculateLatestValidTradeDate(lastSyncedTime);
  }, [lastSyncedTime]);

  const reportSummary: DailyPriceReportSummary = useMemo(() => {
    return generateDailyStockPriceReport(allStocks, lastSyncedTime);
  }, [allStocks, lastSyncedTime]);

  const dayTradeSymbols = useMemo(() => {
    if (!dayTradePortfolio?.setups) return new Set<string>();
    return new Set(dayTradePortfolio.setups.map((s) => s.symbol.toUpperCase()));
  }, [dayTradePortfolio]);

  const filteredReportItems = useMemo(() => {
    let items = reportSummary.items;

    if (filterFocusOnly) {
      items = items.filter((item) => dayTradeSymbols.has(item.symbol.toUpperCase()));
    }
    if (selectedCapSize !== 'ALL') {
      items = items.filter((item) => item.capSize === selectedCapSize);
    }
    if (selectedGainLossFilter === 'GAINERS') {
      items = items.filter((item) => item.change > 0);
    } else if (selectedGainLossFilter === 'DECLINERS') {
      items = items.filter((item) => item.change < 0);
    } else if (selectedGainLossFilter === 'UNCHANGED') {
      items = items.filter((item) => item.change === 0);
    }

    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.stockName.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q)
    );
  }, [reportSummary, filterFocusOnly, dayTradeSymbols, selectedCapSize, selectedGainLossFilter, searchQuery]);

  // Parsed preview for Import Tab
  const parsedImportMap = useMemo(() => {
    return parseSiamchartOrSettradeData(importRawText, importTradeDate);
  }, [importRawText, importTradeDate]);

  const importPreviewList = useMemo(() => {
    const list: Array<{
      symbol: string;
      parsedPrice: number;
      parsedPrevClose?: number;
      parsedChange?: number;
      parsedChangePercent?: number;
      tradeDate: string;
      existingStock?: StockData;
      status: 'MATCHED_IN_BASE' | 'NEW_CUSTOM_STOCK';
    }> = [];

    parsedImportMap.forEach((val, sym) => {
      const existing = allStocks.find((s) => s.symbol.toUpperCase() === sym);
      list.push({
        symbol: sym,
        parsedPrice: val.close,
        parsedPrevClose: val.prevClose,
        parsedChange: val.change,
        parsedChangePercent: val.changePercent,
        tradeDate: val.tradeDate || importTradeDate,
        existingStock: existing,
        status: existing ? 'MATCHED_IN_BASE' : 'NEW_CUSTOM_STOCK',
      });
    });

    return list;
  }, [parsedImportMap, allStocks, importTradeDate]);

  if (!isOpen) return null;

  const handleTriggerSyncPreset = () => {
    setIsSyncing(true);
    onSyncAllPrices();
    setCustomPrices({});
    setCustomPrevCloses({});
    setTimeout(() => {
      setIsSyncing(false);
    }, 500);
  };

  const handleExportExcel = () => {
    exportDailyPriceReportToExcel(reportSummary);
  };

  const handlePrintPDF = () => {
    printDailyPriceReport(reportSummary);
  };

  const handlePriceInputChange = (symbol: string, value: string) => {
    setCustomPrices((prev) => ({ ...prev, [symbol]: value }));
  };

  const handlePrevCloseInputChange = (symbol: string, value: string) => {
    setCustomPrevCloses((prev) => ({ ...prev, [symbol]: value }));
  };

  const handleSaveSingleStock = (stock: StockData) => {
    const rawVal = customPrices[stock.symbol];
    const newPrice = rawVal !== undefined ? parseFloat(rawVal) : stock.currentPrice;
    
    const rawPrevVal = customPrevCloses[stock.symbol];
    const newPrevClose = rawPrevVal !== undefined ? parseFloat(rawPrevVal) : stock.prevClosePrice;

    if (!isNaN(newPrice) && newPrice > 0) {
      onUpdateSingleStockPrice(stock.symbol, newPrice, newPrevClose);
      
      // Also save to daily price DB
      const rec: DailyStockPrice = {
        id: `${stock.symbol.toUpperCase()}_${priceDateStr}`,
        symbol: stock.symbol.toUpperCase(),
        stockName: stock.name,
        tradeDate: priceDateStr,
        open: newPrevClose || newPrice,
        high: Math.max(newPrice, newPrevClose || newPrice),
        low: Math.min(newPrice, newPrevClose || newPrice),
        close: newPrice,
        volume: stock.volume,
        last: newPrice,
        dataUpdatedAt: new Date().toISOString(),
        source: 'MANUAL_VALIDATED',
      };
      saveDailyStockPriceRecords([rec]);

      setJustSavedSymbol(stock.symbol);
      setTimeout(() => setJustSavedSymbol(null), 1500);
    }
  };

  const handleCommitImport = () => {
    if (importPreviewList.length === 0) return;

    const recordsToSave: DailyStockPrice[] = [];
    const updatedStocks: StockData[] = [...allStocks];

    importPreviewList.forEach((item) => {
      recordsToSave.push({
        id: `${item.symbol}_${item.tradeDate}`,
        symbol: item.symbol,
        stockName: item.existingStock?.name || item.symbol,
        tradeDate: item.tradeDate,
        open: item.parsedPrevClose || item.parsedPrice,
        high: Math.max(item.parsedPrice, item.parsedPrevClose || item.parsedPrice),
        low: Math.min(item.parsedPrice, item.parsedPrevClose || item.parsedPrice),
        close: item.parsedPrice,
        volume: item.existingStock?.volume || 1000000,
        last: item.parsedPrice,
        dataUpdatedAt: new Date().toISOString(),
        source: 'SIAMCHART',
      });

      const idx = updatedStocks.findIndex((s) => s.symbol.toUpperCase() === item.symbol);
      if (idx >= 0) {
        updatedStocks[idx] = updateStockWithNewPrice(
          updatedStocks[idx],
          item.parsedPrice,
          item.parsedPrevClose,
          item.parsedChange,
          item.parsedChangePercent
        );
      }
    });

    // Save to Database
    const res = saveDailyStockPriceRecords(recordsToSave);

    // Apply to Application State
    if (onBatchUpdatePrices) {
      onBatchUpdatePrices(updatedStocks);
    }

    setImportSuccessMsg(
      `✅ นำเข้าข้อมูลและอัปเดตราคา Last สำเร็จ ${importPreviewList.length} ตัว (บันทึกใหม่ ${res.saved} รายการ, อัปเดต ${res.duplicates} รายการ)`
    );
    setImportRawText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#18181B]/50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  SBY INVEST AI — DAILY STOCK PRICE REPORT & DATABASE
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>UNIFIED LAST PRICE</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center space-x-2">
                <span>Report Date: <strong className="text-slate-800 dark:text-zinc-200">{reportDateStr}</strong></span>
                <span>•</span>
                <span>Price Date: <strong className="text-indigo-600 dark:text-indigo-400">{priceDateStr} (วันทำการล่าสุด)</strong></span>
                {isWeekendOrHoliday && (
                  <span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded text-[10px]">
                    วันหยุดตลาด (ล็อกราคาปิดวันทำการล่าสุด)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerSyncPreset}
              disabled={isSyncing}
              title="โหลดราคาปิดจริงของวันล่าสุด"
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-all flex items-center space-x-1.5 border border-slate-200 dark:border-zinc-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-500' : ''}`} />
              <span className="hidden sm:inline">รีเฟรชฐานข้อมูล</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto bg-slate-50/20 dark:bg-zinc-900/20">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
                activeTab === 'report'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#121215]'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>รายงานราคาปิดประจำวัน (Daily Stock Price Report)</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
                activeTab === 'import'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#121215]'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>นำเข้าข้อมูล (Siamchart / Settrade / CSV)</span>
            </button>

            <button
              onClick={() => setActiveTab('edit_table')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
                activeTab === 'edit_table'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#121215]'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>แก้ไข / ปรับแต่งราคาเฉพาะตัว</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture_faq')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
                activeTab === 'architecture_faq'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#121215]'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>คู่มือระบบ & ความโปร่งใสของข้อมูล</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: DAILY STOCK PRICE REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-5">
              
              {/* Report Summary Cards & Export Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">จำนวนหุ้นที่ติดตามทั้งหมด</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {reportSummary.totalStocks} <span className="text-xs font-normal text-slate-400">รายการ</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>หุ้นที่ราคาปิดปรับตัวขึ้น</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {reportSummary.gainers} <span className="text-xs font-normal text-emerald-500/80">ตัว</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>หุ้นที่ราคาปิดปรับตัวลง</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {reportSummary.decliners} <span className="text-xs font-normal text-rose-500/80">ตัว</span>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col justify-between space-y-2">
                  <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                    ส่งออกรายงาน (Export Report)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportExcel}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={handlePrintPDF}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-700 hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์ / PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อหุ้น, บริษัท, หรือหมวดธุรกิจ..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Stock Size Filter Tabs */}
                <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-bold">
                  {(['ALL', 'LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MAI'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedCapSize(size)}
                      className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        selectedCapSize === size
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {size === 'ALL' && 'ทั้งหมด'}
                      {size === 'LARGE_CAP' && 'SET50 (ใหญ่)'}
                      {size === 'MID_CAP' && 'SET100 (กลาง)'}
                      {size === 'SMALL_CAP' && 'sSET (เล็ก)'}
                      {size === 'MAI' && 'mai Growth'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Table */}
              <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                        <th className="py-3 px-3 w-28">Symbol</th>
                        <th className="py-3 px-4">ชื่อหุ้น / กิจการ</th>
                        <th className="py-3 px-3">หมวดธุรกิจ</th>
                        <th className="py-3 px-3 text-center">ขนาด</th>
                        <th className="py-3 px-3 text-center">Price Date</th>
                        <th className="py-3 px-3 text-right">ราคาปิดก่อนหน้า</th>
                        <th className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">ราคาปิดล่าสุด (Last)</th>
                        <th className="py-3 px-3 text-right">เปลี่ยนแปลง</th>
                        <th className="py-3 px-3 text-right">% ปรับตัว</th>
                        <th className="py-3 px-3 text-right">ปริมาณ (หุ้น)</th>
                        <th className="py-3 px-3 text-center">วิเคราะห์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                      {filteredReportItems.map((item) => (
                        <tr
                          key={item.symbol}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {item.no}
                          </td>
                          <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white font-mono text-sm">
                            {item.symbol}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-zinc-300 max-w-[200px] truncate">
                            {item.stockName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 text-[11px]">
                            {item.sector}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                              {item.capSize === 'LARGE_CAP' && 'SET50'}
                              {item.capSize === 'MID_CAP' && 'SET100'}
                              {item.capSize === 'SMALL_CAP' && 'sSET'}
                              {item.capSize === 'MAI' && 'mai'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                            {item.priceDate}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-500 dark:text-zinc-400">
                            {item.prevClose.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                            {item.last.toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                            item.change > 0 ? 'text-emerald-500' : item.change < 0 ? 'text-rose-500' : 'text-slate-400'
                          }`}>
                            {item.change > 0 ? `+${item.change.toFixed(2)}` : item.change.toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                            item.changePercent > 0 ? 'text-emerald-500' : item.changePercent < 0 ? 'text-rose-500' : 'text-slate-400'
                          }`}>
                            {item.changePercent > 0 ? `+${item.changePercent.toFixed(2)}%` : `${item.changePercent.toFixed(2)}%`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                            {item.volume.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                const st = allStocks.find((s) => s.symbol === item.symbol);
                                if (st && onSelectStockToAnalyze) {
                                  onSelectStockToAnalyze(st);
                                  onClose();
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              เปิดกราฟ
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

          {/* TAB 2: IMPORT SIAMCHART / SETTRADE / CSV */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-transparent border border-indigo-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-black text-sm">
                  <UploadCloud className="w-5 h-5" />
                  <span>ระบบนำเข้าข้อมูลราคาปิดสิ้นวัน (Siamchart Free EOD / Settrade CSV)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  คุณสามารถคัดลอก (Copy) ข้อความจากไฟล์ดาวน์โหลดฟรีของ Siamchart หรือตารางราคาจาก Settrade แล้ววางลงในกล่องด้านล่าง ระบบจะแปลงข้อมูล ตรวจสอบความถูกต้อง และอัปเดตราคาปิด <strong>Last</strong> ให้ตรงกัน 100% ทันที
                </p>
              </div>

              {importSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between">
                  <span>{importSuccessMsg}</span>
                  <button onClick={() => setImportSuccessMsg(null)} className="text-emerald-500 hover:underline">
                    ปิด
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      1. วางข้อความราคาปิด (Paste Raw Text / CSV)
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">วันทำการ (Trade Date):</span>
                      <input
                        type="date"
                        value={importTradeDate}
                        onChange={(e) => setImportTradeDate(e.target.value)}
                        className="px-2 py-1 rounded-lg text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
                      />
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                    placeholder={`ตัวอย่าง รูปแบบ Siamchart EOD:
CPALL,20260824,46.75,47.25,46.50,46.75,24650000
BANPU,20260824,14.50,14.60,14.40,14.50,5954694
KBANK,20260824,257.00,257.00,252.00,254.00,18200000
MTC,20260824,32.75,33.00,32.25,32.50,14200000
DELTA,20260824,258.00,260.00,253.00,254.00,18500000
ADVANC,20260824,358.00,362.00,357.00,360.00,5200000

หรือรูปแบบ Settrade ข้อความคัดลอก:
BANPU 14.50 0.00 0.00%
KBANK 254.00 -3.00 -1.17%
MTC 32.50 -0.25 -0.76%
CPALL 46.75 0.00 0.00%`}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Preloaded Sample Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImportRawText(`CPALL,20260824,46.75,47.25,46.50,46.75,24650000\nBANPU,20260824,14.50,14.60,14.40,14.50,5954694\nKBANK,20260824,257.00,257.00,252.00,254.00,18200000\nMTC,20260824,32.75,33.00,32.25,32.50,14200000\nDELTA,20260824,258.00,260.00,253.00,254.00,18500000\nADVANC,20260824,358.00,362.00,357.00,360.00,5200000\nBDMS,20260824,19.80,20.10,19.70,19.90,38500000\nPTT,20260824,40.75,41.25,40.50,40.75,42000000\nGULF,20260824,63.75,64.50,63.50,64.00,19800000`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-zinc-300 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ตัวอย่าง Siamchart EOD Data (SET Official)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportRawText('')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ล้างข้อความ
                    </button>
                  </div>
                </div>

                {/* Import Preview Column */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        2. ตรวจสอบข้อมูลก่อนบันทึก (Validation Preview)
                      </label>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        อ่านได้ {importPreviewList.length} ตัว
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 max-h-[320px] overflow-y-auto space-y-2">
                      {importPreviewList.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-zinc-600 text-xs">
                          ยังไม่มีข้อมูล — กรุณาวางข้อความราคาปิดทางด้านซ้าย
                        </div>
                      ) : (
                        importPreviewList.map((item) => (
                          <div
                            key={item.symbol}
                            className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between text-xs font-mono"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-slate-900 dark:text-white">{item.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-sans">
                                {item.tradeDate}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              {item.parsedPrevClose !== undefined && (
                                <span className="text-slate-400 text-[11px]">
                                  Prev: {item.parsedPrevClose.toFixed(2)}
                                </span>
                              )}
                              <span className="font-black text-emerald-600 dark:text-emerald-400">
                                Last: {item.parsedPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleCommitImport}
                    disabled={importPreviewList.length === 0}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกลงฐานข้อมูลรายวัน (Batch Save to Daily Price DB)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT TABLE */}
          {activeTab === 'edit_table' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center space-x-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  คุณสามารถแก้ไขราคาปิด <strong>Last</strong> และ <strong>ราคาปิดก่อนหน้า (Prev Close)</strong> ของหุ้นแต่ละตัวได้โดยตรง เมื่อกดบันทึก ระบบจะปรับค่าเทคนิคัลและมูลค่าพื้นฐานทันที
                </span>
              </div>

              <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-[10px]">
                        <th className="py-3 px-4">Symbol</th>
                        <th className="py-3 px-4">ชื่อหุ้น</th>
                        <th className="py-3 px-4 text-center">Prev Close (แก้ไขได้)</th>
                        <th className="py-3 px-4 text-center">Last Price (แก้ไขได้)</th>
                        <th className="py-3 px-4 text-center">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {allStocks.map((stock) => {
                        const currentInputPrice = customPrices[stock.symbol] !== undefined 
                          ? customPrices[stock.symbol] 
                          : stock.currentPrice.toString();
                        
                        const currentInputPrev = customPrevCloses[stock.symbol] !== undefined
                          ? customPrevCloses[stock.symbol]
                          : (stock.prevClosePrice || (stock.currentPrice - (stock.change || 0))).toString();

                        const isSaved = justSavedSymbol === stock.symbol;

                        return (
                          <tr key={stock.symbol} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30">
                            <td className="py-3 px-4 font-black font-mono text-sm text-slate-900 dark:text-white">
                              {stock.symbol}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">
                              {stock.name}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="number"
                                step="0.05"
                                value={currentInputPrev}
                                onChange={(e) => handlePrevCloseInputChange(stock.symbol, e.target.value)}
                                className="w-24 text-center px-2 py-1 rounded-lg text-xs font-mono font-bold bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="number"
                                step="0.05"
                                value={currentInputPrice}
                                onChange={(e) => handlePriceInputChange(stock.symbol, e.target.value)}
                                className="w-24 text-center px-2 py-1 rounded-lg text-xs font-mono font-black bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleSaveSingleStock(stock)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isSaved
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-900 dark:bg-zinc-700 hover:bg-indigo-600 text-white'
                                }`}
                              >
                                {isSaved ? '✓ บันทึกแล้ว' : 'บันทึกราคา'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE & FAQ */}
          {activeTab === 'architecture_faq' && (
            <div className="space-y-4 text-xs text-slate-600 dark:text-zinc-400">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  1. กฎเหล็กของ Last (Unified EOD Rule)
                </h3>
                <p className="leading-relaxed">
                  ในระบบ SBY INVEST AI ค่า <strong>Last</strong> ถูกนิยามให้เป็น <strong>"ราคาปิดอย่างเป็นทางการของวันทำการล่าสุด (Official EOD Close)"</strong> เสมอ โดยทุกโมดูลทั้ง 5 ส่วน (วิเคราะห์รายตัว, AI จัดพอร์ต, Screener, ตาราง Day Trade, และ My Portfolio Tracker) จะอ่านค่าจากฐานข้อมูลเดียวกัน 100% ไม่มีการใช้ค่าสุ่มระหว่างวัน
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  2. การทำงานในวันหยุด / เสาร์-อาทิตย์ (Holiday & Weekend Protocol)
                </h3>
                <p className="leading-relaxed">
                  หากวันที่เปิดใช้งานตรงกับวันหยุดเสาร์-อาทิตย์ หรือวันหยุดราชการ ระบบจะแสดง <strong>Report Date</strong> เป็นวันปัจจุบัน และระบุ <strong>Price Date</strong> เป็นวันทำการล่าสุดที่มีราคาปิดจริง (เช่น วันศุกร์ล่าสุด) ทำให้นักลงทุนสามารถทำการบ้านและวางแผนล่วงหน้าได้อย่างถูกต้องแม่นยำ
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  3. ความโปร่งใสเรื่องค่าใช้จ่าย (100% Free Data)
                </h3>
                <p className="leading-relaxed">
                  ไม่มีค่าใช้จ่ายรายเดือนหรือค่าบริการใดๆ ทั้งสิ้น ข้อมูล EOD จาก Siamchart เป็นไฟล์สาธารณะที่แจกฟรีสำหรับนักลงทุนไทย และระบบ SBY INVEST AI จัดเก็บข้อมูลราคาไว้ใน Local Database ภายในเครื่องของคุณอย่างปลอดภัย
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-[#18181B]/80 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-zinc-400">
            ฐานข้อมูลจัดเก็บใน Local Storage • อ้างอิง Price Date: <strong>{priceDateStr}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-zinc-700 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
