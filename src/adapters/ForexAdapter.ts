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

export class ForexAdapter extends BaseDataAdapter {
  readonly assetCategory: AssetCategory = 'FOREX';
  readonly supportedMarkets: MarketType[] = ['FOREX'];
  readonly defaultCurrency: string = 'USD';
  readonly providerName: string = 'Forex Streaming Adapter (Unconfigured)';
  readonly providerRole = 'UNCONFIGURED_ADAPTER' as const;

  getProviderStatus(): ProviderStatus {
    return 'PROVIDER_NOT_CONFIGURED';
  }

  getMetadata(symbol: string): AssetMarketMetadata {
    const sym = this.sanitizeSymbol(symbol);
    return {
      symbol: sym,
      name: `${sym} Currency Pair`,
      market: 'FOREX',
      assetCategory: 'FOREX',
      sector: 'Foreign Exchange & Macro',
      currency: sym.slice(3) || 'USD',
      tickSize: 0.0001,
      tradeCalendar: 'FOREX_24H',
      lastVerifiedDate: 'N/A',
      providerStatus: 'PROVIDER_NOT_CONFIGURED',
    };
  }

  async fetchMarketSnapshot(symbol: string): Promise<NormalizedMarketData> {
    const sym = this.sanitizeSymbol(symbol);
    
    // Strict Data Transparency: Return DATA_UNAVAILABLE + PROVIDER_NOT_CONFIGURED
    return {
      symbol: sym,
      assetCategory: 'FOREX',
      market: 'FOREX',
      currency: sym.slice(3) || 'USD',
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
      market: 'FOREX',
      currency: sym.slice(3) || 'USD',
      candles: [],
      startDate: '',
      endDate: '',
      totalCandles: 0,
      dataQuality: 'GRADE_D',
      dataSource: 'PROVIDER_NOT_CONFIGURED',
      isSufficientForTechnical: false,
      validationErrors: ['Forex Streaming Provider is not configured in current phase'],
    };
  }

  parseAndValidateUserFeed(rawText: string, targetDate?: string): NormalizedMarketData[] {
    return [];
  }
}
