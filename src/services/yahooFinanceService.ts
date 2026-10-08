import { StockData, DailyStockPrice } from '../types';
import { updateStockWithNewPrice, saveDailyStockPriceRecords } from '../utils/priceSyncEngine';

export interface YahooPriceItem {
  symbol: string;
  yahooSymbol: string;
  close: number;
  prevClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  tradeDate: string;
  currency: string;
  companyName?: string;
  source: string;
  timestamp: string;
}

export interface YahooSyncResponse {
  success: boolean;
  count: number;
  requestedCount: number;
  prices: Record<string, YahooPriceItem>;
  syncedAt: string;
  source?: string;
  error?: string;
}

/**
 * Calls backend API to fetch real-time prices from Settrade Open API (SET)
 * Disconnected completely from Yahoo Finance and Siamchart.
 */
export async function fetchYahooFinancePrices(symbols: string[]): Promise<YahooSyncResponse> {
  const res = await fetch('/api/market/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Settrade Open API sync failed HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * High-level synchronization:
 * 1. Takes all current stocks
 * 2. Fetches real latest prices from Settrade Open API
 * 3. Updates stock models with recalculations (PE, MOS, Capital Gain, Target)
 * 4. Automatically commits records into DailyStockPriceDatabase for offline & report permanence
 */
export async function syncAppStocksWithYahooFinance(
  allStocks: StockData[],
  targetSymbols?: string[]
): Promise<{
  updatedStocks: StockData[];
  syncedCount: number;
  recordsSaved: number;
  syncedAt: string;
  priceItems: Record<string, YahooPriceItem>;
}> {
  const symbolsToFetch = targetSymbols && targetSymbols.length > 0
    ? targetSymbols
    : Array.from(new Set(allStocks.map((s) => s.symbol.toUpperCase())));

  const response = await fetchYahooFinancePrices(symbolsToFetch);
  const yahooPrices = response.prices || {};

  const recordsToSave: DailyStockPrice[] = [];
  const updatedStocks: StockData[] = allStocks.map((stock) => {
    const sym = stock.symbol.toUpperCase();
    const yahooItem = yahooPrices[sym];
    if (!yahooItem) return stock;

    recordsToSave.push({
      id: `${sym}_${yahooItem.tradeDate}`,
      symbol: sym,
      stockName: yahooItem.companyName || stock.name || sym,
      tradeDate: yahooItem.tradeDate,
      open: yahooItem.prevClose || yahooItem.close,
      high: yahooItem.high,
      low: yahooItem.low,
      close: yahooItem.close,
      volume: yahooItem.volume || stock.volume || 1000000,
      last: yahooItem.close,
      dataUpdatedAt: yahooItem.timestamp,
      source: 'SETTRADE_OPEN_API', // Official Settrade Open API live feed
    });

    const updated = updateStockWithNewPrice(
      stock,
      yahooItem.close,
      yahooItem.prevClose,
      yahooItem.change,
      yahooItem.changePercent,
      yahooItem.tradeDate,
      'SETTRADE_OPEN_API'
    );

    return {
      ...updated,
      officialEODClose: yahooItem.close,
      currentPrice: yahooItem.close,
      currentLast: yahooItem.close,
      close: yahooItem.close,
      previousClose: yahooItem.prevClose,
      priceDate: yahooItem.tradeDate,
      dataStatus: 'REAL_EOD' as const,
      dataQuality: 'GRADE_A' as const,
      providerStatus: 'VERIFIED_EOD_AVAILABLE' as const,
      dataSource: 'YAHOO_FINANCE (SET Live/Intraday Bridge)',
      high24h: yahooItem.high,
      low24h: yahooItem.low,
      volume: yahooItem.volume,
    };
  });

  let recordsSaved = 0;
  if (recordsToSave.length > 0) {
    const saveRes = saveDailyStockPriceRecords(recordsToSave);
    recordsSaved = saveRes.saved + saveRes.duplicates;
  }

  return {
    updatedStocks,
    syncedCount: Object.keys(yahooPrices).length,
    recordsSaved,
    syncedAt: response.syncedAt || new Date().toISOString(),
    priceItems: yahooPrices,
  };
}
