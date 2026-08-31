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
import { IMarketDataAdapter, IngestionValidationResult, RawMarketRecord } from './types';

export abstract class BaseDataAdapter implements IMarketDataAdapter {
  abstract readonly assetCategory: AssetCategory;
  abstract readonly supportedMarkets: MarketType[];
  abstract readonly defaultCurrency: 'THB' | 'USD' | string;
  abstract readonly providerName: string;
  abstract readonly providerRole: 'PRIMARY_FEED' | 'USER_IMPORT_SOURCE' | 'VERIFIED_EOD_SNAPSHOT' | 'UNCONFIGURED_ADAPTER';

  abstract getProviderStatus(): ProviderStatus;
  abstract fetchMarketSnapshot(symbol: string): Promise<NormalizedMarketData>;
  abstract fetchHistoricalCandles(symbol: string, lookbackDays?: number): Promise<ValidatedCandleSeries>;
  abstract parseAndValidateUserFeed(rawText: string, targetDate?: string): NormalizedMarketData[];
  abstract getMetadata(symbol: string): AssetMarketMetadata;

  /**
   * Sanitizes symbol string (uppercase, stripped whitespace)
   */
  protected sanitizeSymbol(symbol: string): string {
    if (!symbol) return '';
    return symbol.trim().toUpperCase().replace(/[^A-Z0-9_\-\.]/g, '');
  }

  /**
   * Strict OHLC Validity Check
   * High >= Open, High >= Close, High >= Low
   * Low <= Open, Low <= Close, Low <= High
   * Close > 0, Volume >= 0
   */
  public validateOHLC(open: number, high: number, low: number, close: number, volume: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (isNaN(close) || close <= 0) {
      errors.push(`Invalid close price: ${close}. Close must be positive.`);
    }
    if (isNaN(open) || open <= 0) {
      errors.push(`Invalid open price: ${open}. Open must be positive.`);
    }
    if (isNaN(high) || high <= 0) {
      errors.push(`Invalid high price: ${high}. High must be positive.`);
    }
    if (isNaN(low) || low <= 0) {
      errors.push(`Invalid low price: ${low}. Low must be positive.`);
    }
    if (isNaN(volume) || volume < 0) {
      errors.push(`Invalid volume: ${volume}. Volume must be non-negative.`);
    }

    if (high < low) {
      errors.push(`High (${high}) cannot be less than Low (${low}).`);
    }
    if (high < open) {
      errors.push(`High (${high}) cannot be less than Open (${open}).`);
    }
    if (high < close) {
      errors.push(`High (${high}) cannot be less than Close (${close}).`);
    }
    if (low > open) {
      errors.push(`Low (${low}) cannot be greater than Open (${open}).`);
    }
    if (low > close) {
      errors.push(`Low (${low}) cannot be greater than Close (${close}).`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Classifies Data Quality Grade according to Phase 2 Standard:
   * GRADE_A: Real + Recent (Live/Delayed Stream) + Complete
   * GRADE_B: Real + Verified EOD + Sufficient Historical Data (>= 50 candles)
   * GRADE_C: Real but Incomplete (< 50 candles or missing optional attributes)
   * GRADE_D: Unavailable / Provider Not Configured
   * GRADE_F: Synthetic / Unverified / Blocked (Forbidden in Analysis)
   */
  public classifyDataQuality(params: {
    isLiveFeed: boolean;
    isVerifiedEOD: boolean;
    candleCount: number;
    hasSyntheticData: boolean;
    isProviderConfigured: boolean;
  }): DataQualityGrade {
    if (params.hasSyntheticData) {
      return 'GRADE_F'; // Blocked immediately
    }
    if (!params.isProviderConfigured) {
      return 'GRADE_D';
    }
    if (params.isLiveFeed && params.candleCount >= 50) {
      return 'GRADE_A';
    }
    if (params.isVerifiedEOD && params.candleCount >= 50) {
      return 'GRADE_B';
    }
    if (params.candleCount > 0 && params.candleCount < 50) {
      return 'GRADE_C';
    }
    return 'GRADE_D';
  }

  /**
   * Sorts candles by date ascending and eliminates duplicates by date
   */
  public sanitizeCandleSeries(candles: PriceCandle[]): PriceCandle[] {
    if (!candles || candles.length === 0) return [];
    
    // Sort ascending by date
    const sorted = [...candles].sort((a, b) => a.date.localeCompare(b.date));
    
    // Deduplicate by date (keep last occurrence)
    const map = new Map<string, PriceCandle>();
    for (const c of sorted) {
      const ohlcValid = this.validateOHLC(c.open, c.high, c.low, c.close, c.volume);
      if (ohlcValid.isValid) {
        map.set(c.date, c);
      }
    }

    return Array.from(map.values());
  }
}
