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
import { getVerifiedHistoricalCandles } from '../data/historicalCandlesData';
import { getSetTickSize } from '../utils/technicalAnalysis';

export class ThaiEquityAdapter extends BaseDataAdapter {
  readonly assetCategory: AssetCategory = 'THAI_STOCK';
  readonly supportedMarkets: MarketType[] = ['SET', 'mai'];
  readonly defaultCurrency: 'THB' = 'THB';
  readonly providerName: string = 'Siamchart EOD / SET Snapshot Feed';
  readonly providerRole = 'VERIFIED_EOD_SNAPSHOT' as const; // Explicitly NOT Live Feed

  getProviderStatus(): ProviderStatus {
    return 'VERIFIED_EOD_AVAILABLE';
  }

  getMetadata(symbol: string): AssetMarketMetadata {
    const sym = this.sanitizeSymbol(symbol);
    return {
      symbol: sym,
      name: `${sym} Public Company Limited`,
      market: 'SET',
      assetCategory: 'THAI_STOCK',
      sector: 'Thai Equity Sector',
      currency: 'THB',
      tickSize: getSetTickSize(50),
      tradeCalendar: 'SET_BANGKOK',
      lastVerifiedDate: '2026-08-27',
      providerStatus: this.getProviderStatus(),
    };
  }

  async fetchMarketSnapshot(symbol: string): Promise<NormalizedMarketData> {
    const sym = this.sanitizeSymbol(symbol);
    const historical = getVerifiedHistoricalCandles(sym);
    
    if (historical && historical.length > 0) {
      const lastCandle = historical[historical.length - 1];
      const prevCandle = historical.length > 1 ? historical[historical.length - 2] : lastCandle;
      
      const officialEODClose = lastCandle.close;
      const previousClose = prevCandle.close;
      const change = Number((officialEODClose - previousClose).toFixed(2));
      const changePercent = previousClose > 0 ? Number(((change / previousClose) * 100).toFixed(2)) : 0;

      return {
        symbol: sym,
        assetCategory: 'THAI_STOCK',
        market: 'SET',
        currency: 'THB',
        // currentLast is UNDEFINED in EOD mode (Strict separation rule)
        currentLast: undefined,
        officialEODClose,
        previousClose,
        change,
        changePercent,
        volume: lastCandle.volume,
        tradeDate: lastCandle.date,
        timestamp: new Date(`${lastCandle.date}T18:30:00+07:00`).toISOString(),
        dataSource: 'SIAMCHART_EOD',
        dataQuality: 'GRADE_B',
        dataStatus: 'REAL_EOD',
        providerStatus: 'VERIFIED_EOD_AVAILABLE',
        candles: historical,
      };
    }

    // If symbol has no historical record, return DATA_UNAVAILABLE without fake numbers
    return {
      symbol: sym,
      assetCategory: 'THAI_STOCK',
      market: 'SET',
      currency: 'THB',
      currentLast: undefined,
      officialEODClose: 0,
      previousClose: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      tradeDate: '2026-08-27',
      timestamp: new Date().toISOString(),
      dataSource: 'UNAVAILABLE',
      dataQuality: 'GRADE_D',
      dataStatus: 'DATA_UNAVAILABLE',
      providerStatus: 'VERIFIED_EOD_AVAILABLE',
      candles: [],
    };
  }

  async fetchHistoricalCandles(symbol: string, lookbackDays: number = 60): Promise<ValidatedCandleSeries> {
    const sym = this.sanitizeSymbol(symbol);
    const rawCandles = getVerifiedHistoricalCandles(sym);
    const sanitized = this.sanitizeCandleSeries(rawCandles);
    const totalCandles = sanitized.length;
    const isSufficient = totalCandles >= 50;

    const dataQuality: DataQualityGrade = this.classifyDataQuality({
      isLiveFeed: false,
      isVerifiedEOD: true,
      candleCount: totalCandles,
      hasSyntheticData: false,
      isProviderConfigured: true,
    });

    return {
      symbol: sym,
      market: 'SET',
      currency: 'THB',
      candles: sanitized.slice(-lookbackDays),
      startDate: sanitized.length > 0 ? sanitized[0].date : '',
      endDate: sanitized.length > 0 ? sanitized[sanitized.length - 1].date : '',
      totalCandles,
      dataQuality,
      dataSource: 'SIAMCHART_VERIFIED_EOD',
      isSufficientForTechnical: isSufficient,
      validationErrors: isSufficient ? [] : ['Candle count below minimum 50 periods threshold'],
    };
  }

  /**
   * Parses Siamchart / Settrade user CSV text format:
   * Format A: <TICKER>,<YYYYMMDD>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOLUME>
   * Format B: <TICKER>,<CLOSE>,<PREV_CLOSE/CHANGE>
   */
  parseAndValidateUserFeed(rawText: string, targetDate: string = '2026-08-27'): NormalizedMarketData[] {
    const results: NormalizedMarketData[] = [];
    if (!rawText || !rawText.trim()) return results;

    const lines = rawText.split(/\r?\n/);
    const nowIso = new Date().toISOString();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

      const tokens = trimmed.split(/[,;\t\s]+/).filter(Boolean);
      if (tokens.length < 2) continue;

      const sym = this.sanitizeSymbol(tokens[0]);
      if (!sym || sym === 'SYMBOL' || sym === 'TICKER' || sym === '<TICKER>' || sym === 'NO.') continue;

      // Case A: Siamchart Daily Format: <ticker>,<date>,<open>,<high>,<low>,<close>,<volume>
      if (tokens.length >= 6 && /^\d{8}$/.test(tokens[1])) {
        const rawD = tokens[1];
        const parsedDate = `${rawD.slice(0, 4)}-${rawD.slice(4, 6)}-${rawD.slice(6, 8)}`;
        const openPrice = parseFloat(tokens[2]);
        const highPrice = parseFloat(tokens[3]);
        const lowPrice = parseFloat(tokens[4]);
        const closePrice = parseFloat(tokens[5]);
        const vol = tokens.length >= 7 ? parseFloat(tokens[6]) : 0;

        const validation = this.validateOHLC(openPrice, highPrice, lowPrice, closePrice, isNaN(vol) ? 0 : vol);
        if (validation.isValid) {
          const prev = openPrice;
          const chg = Number((closePrice - prev).toFixed(2));
          const chgPct = Number(((chg / Math.max(0.01, prev)) * 100).toFixed(2));

          results.push({
            symbol: sym,
            assetCategory: 'THAI_STOCK',
            market: 'SET',
            currency: 'THB',
            currentLast: undefined,
            officialEODClose: closePrice,
            previousClose: prev,
            change: chg,
            changePercent: chgPct,
            volume: isNaN(vol) ? 0 : vol,
            tradeDate: parsedDate,
            timestamp: nowIso,
            dataSource: 'USER_CSV_SIAMCHART_IMPORT',
            dataQuality: 'GRADE_B',
            dataStatus: 'USER_IMPORTED',
            providerStatus: 'USER_IMPORT_AVAILABLE',
          });
          continue;
        }
      }

      // Case B: Simple 2-3 column CSV: <TICKER>,<CLOSE>,<PREV_CLOSE>
      const closePrice = parseFloat(tokens[1].replace(/,/g, ''));
      if (isNaN(closePrice) || closePrice <= 0) continue;

      let prevClose = closePrice;
      if (tokens.length >= 3) {
        const third = parseFloat(tokens[2].replace(/[+%,]/g, ''));
        if (!isNaN(third) && third > 0) {
          prevClose = third;
        }
      }

      const chg = Number((closePrice - prevClose).toFixed(2));
      const chgPct = prevClose > 0 ? Number(((chg / prevClose) * 100).toFixed(2)) : 0;

      results.push({
        symbol: sym,
        assetCategory: 'THAI_STOCK',
        market: 'SET',
        currency: 'THB',
        currentLast: undefined,
        officialEODClose: closePrice,
        previousClose: prevClose,
        change: chg,
        changePercent: chgPct,
        volume: 0,
        tradeDate: targetDate,
        timestamp: nowIso,
        dataSource: 'USER_CSV_IMPORT',
        dataQuality: 'GRADE_C', // Incomplete OHLCV
        dataStatus: 'USER_IMPORTED',
        providerStatus: 'USER_IMPORT_AVAILABLE',
      });
    }

    return results;
  }
}
