import React from 'react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  ArrowUpRight, 
  Target, 
  ShieldAlert, 
  ExternalLink,
  Coins,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { WatchlistItem, StockData } from '../types';
import { formatCurrency } from '../utils/calculations';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  onSelectStock: (stock: StockData) => void;
  onRemoveItem: (symbol: string) => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  onSelectStock,
  onRemoveItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                SBY Watchlist & Active Trade Plans
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                หุ้นที่บันทึกไว้ในพอร์ตจำลองพร้อมแผนตั้งรับและจุดตัดขาดทุน ({watchlist.length} รายการ)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {watchlist.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-500">
                <Bookmark className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                ยังไม่มีหุ้นใน Watchlist
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                คุณสามารถกดปุ่ม "บันทึกแผนเทรดลง Watchlist" ในโมดูล Trade Execution เพื่อติดตามแผนราคาได้ทันที
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((item) => {
                const current = item.stockData.currentPrice;
                const gainToTarget = ((item.targetPrice - current) / current) * 100;
                const lossToStop = ((item.stopLossPrice - current) / current) * 100;

                return (
                  <div
                    key={item.symbol}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-[#18181B] hover:border-indigo-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div
                      onClick={() => {
                        onSelectStock(item.stockData);
                        onClose();
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          {item.symbol}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {item.stockData.market}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                          item.stockData.compositeRating === 'STRONG_BUY' || item.stockData.compositeRating === 'BUY'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                        }`}>
                          {item.stockData.compositeRating}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1">
                        {item.stockData.name}
                      </p>
                      
                      {/* Price & Target Chips */}
                      <div className="flex flex-wrap gap-2 mt-2.5 text-xs">
                        <span className="px-2 py-1 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                          ราคาปัจจุบัน: <strong>{current} {item.stockData.currency}</strong>
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                          เป้า TP: {item.targetPrice} ({gainToTarget >= 0 ? '+' : ''}{gainToTarget.toFixed(1)}%)
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold">
                          Stop: {item.stopLossPrice} ({lossToStop.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          onSelectStock(item.stockData);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-colors flex items-center space-x-1"
                      >
                        <span>เปิดวิเคราะห์</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => onRemoveItem(item.symbol)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="ลบออกจาก Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
