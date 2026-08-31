import React from 'react';
import { RefreshCw, Clock, Zap, Activity, ChevronDown } from 'lucide-react';
import { MarketRefreshInterval } from '../types';

interface LiveMarketControlBarProps {
  refreshInterval: MarketRefreshInterval;
  onChangeRefreshInterval: (interval: MarketRefreshInterval) => void;
  isRefreshing: boolean;
  onManualRefresh: () => void;
  lastUpdatedTime: Date;
  totalStocksCount: number;
}

export const LiveMarketControlBar: React.FC<LiveMarketControlBarProps> = ({
  refreshInterval,
  onChangeRefreshInterval,
  isRefreshing,
  onManualRefresh,
  lastUpdatedTime,
  totalStocksCount,
}) => {
  const intervals: { label: string; value: MarketRefreshInterval; badge?: string }[] = [
    { label: '5s', value: 5, badge: 'Scalper' },
    { label: '15s', value: 15, badge: 'Normal' },
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: 'Off', value: 0, badge: 'Manual' },
  ];

  return (
    <div className="bg-slate-900/90 dark:bg-zinc-950/90 border-y border-slate-800 dark:border-zinc-800 text-xs px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            {refreshInterval > 0 ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
            )}
          </span>
          <span className="font-bold text-slate-200 text-[11px]">
            Live Market Feed
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
            {totalStocksCount} Tickers
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-1 text-slate-400 text-[11px]">
          <span>SET / mai / Global</span>
        </div>
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Interval Selector Buttons */}
        <div className="flex items-center bg-slate-800/90 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-700/60 dark:border-zinc-800 text-[11px]">
          <span className="px-2 text-slate-400 text-[10px] font-semibold hidden sm:inline">
            Auto-refresh:
          </span>
          {intervals.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChangeRefreshInterval(item.value)}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                refreshInterval === item.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && refreshInterval === item.value && (
                <span className="ml-1 text-[9px] opacity-80 hidden lg:inline">({item.badge})</span>
              )}
            </button>
          ))}
        </div>

        {/* Last Updated Timestamp & Spin Refresh */}
        <button
          type="button"
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition-all cursor-pointer"
          title="กดเพื่อดึงข้อมูลราคาล่าสุดทันที (Manual Refresh)"
        >
          <RefreshCw className={`w-3 h-3 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Last:</span>
          <span>{lastUpdatedTime.toLocaleTimeString('th-TH', { hour12: false })}</span>
        </button>
      </div>
    </div>
  );
};
