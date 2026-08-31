import { 
  AssetCategory, 
  MarketType, 
  PriceCandle, 
  DataQualityGrade, 
  ProviderStatus, 
  MarketDataStatus, 
  NormalizedMarketData, 
  ValidatedCandleSeries, 
  AssetMarketMetadata 
} from '../types';
import { BaseDataAdapter } from './BaseDataAdapter';

export class USEquityAdapter extends BaseDataAdapter {
  readonly assetCategory: AssetCategory = 'GLOBAL_STOCK';
  readonly supportedMarkets: MarketType[] = ['US', 'Global'];
  readonly defaultCurrency: 'USD' = 'USD';
  readonly providerName: string = 'US Equities Market Adapter (Unconfigured)';
  readonly providerRole = 'UNCONFIGURED_ADAPTER' as const;

  getProviderStatus(): ProviderStatus {
    return 'PROVIDER_NOT_CONFIGURED';
  }

  getMetadata(symbol: string): AssetMarketMetadata {
    const sym = this.sanitizeSymbol(symbol);
    return {
      symbol: sym,
      name: `${sym} (US Listed Equity)`,
      market: 'US',
      assetCategory: 'GLOBAL_STOCK',
      sector: 'US Equity Sector',
      currency: 'USD',
      tickSize: 0.01,
      tradeCalendar: 'US_NEWYORK',
      lastVerifiedDate: 'N/A',
      providerStatus: 'PROVIDER_NOT_CONFIGURED',
    };
  }

  async fetchMarketSnapshot(symbol: string): Promise<NormalizedMarketData> {
    const sym = this.sanitizeSymbol(symbol);
    
    // Strict Data Transparency: Return DATA_UNAVAILABLE + PROVIDER_NOT_CONFIGURED
    return {
      symbol: sym,
      assetCategory: 'GLOBAL_STOCK',
      market: 'US',
      currency: 'USD',
      currentLast: undefined,
      officialEODClose: 0,
      previousClose: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      tradeDate: '',
      timestamp: new Date().toISOString(),
      dataSource: 'PROVIDER_NOT_CONFIGURED',
      dataQuality: 'GRADE_D',
      dataStatus: 'PROVIDER_NOT_CONFIGURED',
      providerStatus: 'PROVIDER_NOT_CONFIGURED',
      candles: [],
    };
  }

  async fetchHistoricalCandles(symbol: string, lookbackDays?: number): Promise<ValidatedCandleSeries> {
    const sym = this.sanitizeSymbol(symbol);
    return {
      symbol: sym,
      market: 'US',
      currency: 'USD',
      candles: [],
      startDate: '',
      endDate: '',
      totalCandles: 0,
      dataQuality: 'GRADE_D',
      dataSource: 'PROVIDER_NOT_CONFIGURED',
      isSufficientForTechnical: false,
      validationErrors: ['US Market Data Provider is not configured in current phase'],
    };
  }

  parseAndValidateUserFeed(rawText: string, targetDate?: string): NormalizedMarketData[] {
    // Return empty array as provider is not configured
    return [];
  }
}
