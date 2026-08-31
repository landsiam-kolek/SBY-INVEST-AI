import { 
  AssetCategory, 
  StockData, 
  NormalizedMarketData, 
  ValidatedCandleSeries, 
  DataQualityGrade,
  MarketDataStatus
} from '../types';
import { IMarketDataAdapter } from './types';
import { ThaiEquityAdapter } from './ThaiEquityAdapter';
import { USEquityAdapter } from './USEquityAdapter';
import { ForexAdapter } from './ForexAdapter';

export class DataIngestionController {
  private adapters: Map<AssetCategory, IMarketDataAdapter>;

  constructor() {
    this.adapters = new Map();
    this.adapters.set('THAI_STOCK', new ThaiEquityAdapter());
    this.adapters.set('GLOBAL_STOCK', new USEquityAdapter());
    this.adapters.set('FOREX', new ForexAdapter());
  }

  /**
   * Resolves appropriate adapter based on asset category or symbol pattern
   */
  public getAdapter(assetCategory: AssetCategory, symbol?: string): IMarketDataAdapter {
    if (assetCategory === 'FOREX' || (symbol && (symbol.includes('/') || symbol.length === 6 && ['EURUSD', 'USDJPY', 'GBPUSD', 'XAUUSD'].includes(symbol.toUpperCase())))) {
      return this.adapters.get('FOREX')!;
    }
    if (assetCategory === 'GLOBAL_STOCK' || (symbol && ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META'].includes(symbol.toUpperCase()))) {
      return this.adapters.get('GLOBAL_STOCK')!;
    }
    return this.adapters.get('THAI_STOCK')!;
  }

  /**
   * Full Pipeline Ingestion for a Single Asset:
   * INGESTION -> VALIDATION -> NORMALIZATION -> QUALITY GATE -> STANDARDIZED DATA
   */
  public async ingestAssetData(symbol: string, category: AssetCategory = 'THAI_STOCK'): Promise<{
    marketData: NormalizedMarketData;
    candles: ValidatedCandleSeries;
    qualityGrade: DataQualityGrade;
  }> {
    const adapter = this.getAdapter(category, symbol);
    
    // 1. Fetch & Validate Snapshot
    const marketData = await adapter.fetchMarketSnapshot(symbol);
    
    // 2. Fetch & Validate Historical Series
    const candles = await adapter.fetchHistoricalCandles(symbol, 60);

    // 3. Quality Gate Check
    const qualityGrade = marketData.dataQuality || candles.dataQuality || 'GRADE_D';

    return {
      marketData,
      candles,
      qualityGrade,
    };
  }

  /**
   * Batch Normalization for User CSV / Text Import
   */
  public ingestUserRawFeed(rawText: string, targetDate?: string): NormalizedMarketData[] {
    const thaiAdapter = this.adapters.get('THAI_STOCK')!;
    return thaiAdapter.parseAndValidateUserFeed(rawText, targetDate);
  }

  /**
   * Applies normalized data onto an existing StockData record cleanly
   */
  public applyNormalizedDataToStock(stock: StockData, normalized: NormalizedMarketData): StockData {
    return {
      ...stock,
      officialEODClose: normalized.officialEODClose,
      currentPrice: normalized.officialEODClose, // Base price for display
      currentLast: normalized.currentLast, // undefined in EOD mode
      close: normalized.officialEODClose,
      previousClose: normalized.previousClose,
      prevClosePrice: normalized.previousClose,
      change: normalized.change,
      changePercent: normalized.changePercent,
      volume: normalized.volume || stock.volume,
      priceDate: normalized.tradeDate,
      dataSource: normalized.dataSource,
      dataQuality: normalized.dataQuality,
      dataStatus: normalized.dataStatus,
      providerStatus: normalized.providerStatus,
      candles: normalized.candles && normalized.candles.length > 0 ? normalized.candles : stock.candles,
    };
  }
}

// Global Singleton Instance
export const globalDataIngestion = new DataIngestionController();
