import { 
  MarketType, 
  AssetCategory, 
  PriceCandle, 
  DataQualityGrade, 
  ProviderStatus, 
  MarketDataStatus, 
  NormalizedMarketData, 
  ValidatedCandleSeries, 
  AssetMarketMetadata 
} from '../types';

export interface RawMarketRecord {
  symbol: string;
  market?: string;
  tradeDate?: string;
  open?: number | string;
  high?: number | string;
  low?: number | string;
  close?: number | string;
  volume?: number | string;
  source?: string;
  rawPayload?: any;
}

export interface IngestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedRecord?: NormalizedMarketData;
}

export interface IMarketDataAdapter {
  readonly assetCategory: AssetCategory;
  readonly supportedMarkets: MarketType[];
  readonly defaultCurrency: 'THB' | 'USD' | string;
  readonly providerName: string;
  readonly providerRole: 'PRIMARY_FEED' | 'USER_IMPORT_SOURCE' | 'VERIFIED_EOD_SNAPSHOT' | 'UNCONFIGURED_ADAPTER';

  getProviderStatus(): ProviderStatus;
  fetchMarketSnapshot(symbol: string): Promise<NormalizedMarketData>;
  fetchHistoricalCandles(symbol: string, lookbackDays?: number): Promise<ValidatedCandleSeries>;
  parseAndValidateUserFeed(rawText: string, targetDate?: string): NormalizedMarketData[];
  getMetadata(symbol: string): AssetMarketMetadata;
}
