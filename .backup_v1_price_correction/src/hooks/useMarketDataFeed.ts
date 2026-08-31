import { useState, useEffect, useRef, useCallback } from 'react';
import { StockData, MarketRefreshInterval } from '../types';
import { REAL_MARKET_SNAPSHOT_PRESET, updateStockWithNewPrice } from '../utils/priceSyncEngine';
import { getSetTickSize, roundToSetTick } from '../utils/technicalAnalysis';

export interface UseMarketDataFeedOptions {
  stocks: StockData[];
  onUpdateStocks: (updatedStocks: StockData[]) => void;
  currentStock: StockData;
  onUpdateCurrentStock: (stock: StockData) => void;
}

export function useMarketDataFeed({
  stocks,
  onUpdateStocks,
  currentStock,
  onUpdateCurrentStock,
}: UseMarketDataFeedOptions) {
  const [refreshInterval, setRefreshInterval] = useState<MarketRefreshInterval>(15); // Default 15s
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [marketStatus, setMarketStatus] = useState<'LIVE_MARKET' | 'CLOSED_DYNAMIC' | 'OFF'>('LIVE_MARKET');

  const stocksRef = useRef(stocks);
  const currentStockRef = useRef(currentStock);
  const onUpdateStocksRef = useRef(onUpdateStocks);
  const onUpdateCurrentStockRef = useRef(onUpdateCurrentStock);

  useEffect(() => {
    stocksRef.current = stocks;
    currentStockRef.current = currentStock;
    onUpdateStocksRef.current = onUpdateStocks;
    onUpdateCurrentStockRef.current = onUpdateCurrentStock;
  }, [stocks, currentStock, onUpdateStocks, onUpdateCurrentStock]);

  /**
   * Refreshes market data:
   * Uses real market presets when available, and simulates realistic micro-tick variations
   * adhering strictly to official SET tick size rules
   */
  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    const now = new Date();
    setLastUpdatedTime(now);

    setTimeout(() => {
      const currentList = stocksRef.current;
      const updatedList = currentList.map((stk) => {
        const sym = stk.symbol.toUpperCase();
        const baseData = REAL_MARKET_SNAPSHOT_PRESET[sym];
        
        let baseClose = baseData ? baseData.close : stk.currentPrice;
        const prevClose = baseData ? baseData.prevClose : (stk.prevClosePrice || stk.currentPrice);

        // Intraday micro-fluctuation within +/- 1 tick
        const tick = getSetTickSize(baseClose);
        // Deterministic but realistic pulse
        const rand = Math.sin(now.getTime() / 1000 + sym.charCodeAt(0));
        let tickDelta = 0;
        if (rand > 0.4) tickDelta = tick;
        else if (rand < -0.4) tickDelta = -tick;

        const livePrice = roundToSetTick(Math.max(0.01, baseClose + tickDelta));
        const priceDiff = Number((livePrice - prevClose).toFixed(2));
        const changePercent = prevClose > 0 ? Number(((priceDiff / prevClose) * 100).toFixed(2)) : 0;

        return updateStockWithNewPrice(stk, livePrice, prevClose, priceDiff, changePercent);
      });

      onUpdateStocksRef.current(updatedList);

      // Update current selected stock as well
      const activeSym = currentStockRef.current.symbol.toUpperCase();
      const updatedActive = updatedList.find((s) => s.symbol.toUpperCase() === activeSym);
      if (updatedActive) {
        onUpdateCurrentStockRef.current(updatedActive);
      }

      setIsRefreshing(false);
    }, 450);
  }, []);

  // Timer loop for auto-refresh
  useEffect(() => {
    if (refreshInterval === 0) {
      setMarketStatus('OFF');
      return;
    }

    setMarketStatus('LIVE_MARKET');
    const intervalMs = refreshInterval * 1000;
    const intervalId = setInterval(() => {
      triggerRefresh();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [refreshInterval, triggerRefresh]);

  return {
    refreshInterval,
    setRefreshInterval,
    isRefreshing,
    lastUpdatedTime,
    marketStatus,
    triggerRefresh,
  };
}
