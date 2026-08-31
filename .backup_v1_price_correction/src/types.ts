export type MarketType = 'SET' | 'mai' | 'US' | 'Global' | 'FOREX';

export type AssetCategory = 'ALL' | 'THAI_STOCK' | 'GLOBAL_STOCK' | 'FOREX';

export type StockCapSize = 'ALL' | 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MAI';

export type TrendType = 'UPTREND' | 'DOWNTREND' | 'SIDEWAY';

export type ValuationStatus = 'UNDERVALUED' | 'FAIR' | 'OVERVALUED';

export type CompositeRating = 'STRONG_BUY' | 'BUY' | 'ACCUMULATE' | 'WAIT' | 'TAKE_PROFIT' | 'STOP_LOSS';

export type TechnicalSignalType = 
  | 'STRONG_BUY'
  | 'BUY_BREAKOUT'
  | 'BUY_ON_DIP'
  | 'ACCUMULATE'
  | 'WAIT'
  | 'TAKE_PROFIT'
  | 'STOP_LOSS';

export interface PriceCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
}

export interface ForexMacroData {
  pairType: 'MAJOR' | 'CROSS' | 'COMMODITY' | 'EXOTIC';
  baseCurrency: string;
  quoteCurrency: string;
  baseInterestRate: number; // e.g. 5.25%
  quoteInterestRate: number; // e.g. 3.75%
  interestRateDifferential: number; // base - quote
  baseCentralBank: string; // e.g. Federal Reserve
  quoteCentralBank: string; // e.g. ECB
  centralBankStance: string; // e.g. Fed: Hawkish Hold | ECB: Dovish Cut
  baseInflationRate: number; // e.g. 2.9%
  quoteInflationRate: number; // e.g. 2.4%
  pipValuePerStandardLot: number; // e.g. 10 USD
  spreadPips: number; // e.g. 0.8 pips
  dailyATR: number; // in pips e.g. 75 pips
  cotSentiment: 'NET_BULLISH' | 'NET_BEARISH' | 'NEUTRAL';
  dxyCorrelation: string; // e.g. -0.85 (Strong Negative)
  leverageStandard: string; // e.g. 1:100
}

export interface StockData {
  symbol: string;
  name: string;
  market: MarketType;
  assetCategory: AssetCategory;
  sector: string;
  currency: 'THB' | 'USD' | 'EUR' | 'JPY' | 'GBP' | string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  volume: number;
  avgVolume30d: number;
  marketCap?: number; // in Millions THB / USD
  marketCapCategory?: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MAI';
  prevClosePrice?: number; // ราคาปิดเมื่อวาน (Previous Close)
  
  // Fundamental & Valuation (For Stocks)
  pe: number;
  industryPe: number;
  pbv: number;
  roe: number;
  dividendYield: number;
  de: number;
  netMargin: number;
  revenueGrowth: number;
  eps: number;
  fairValue: number;
  marginOfSafety: number; // in %
  valuationStatus: ValuationStatus;
  fundamentalScore: number; // 0 - 100
  dcfValue?: number;
  grahamValue?: number;

  // Forex Macro Attributes (For Forex & Commodities)
  forexMacro?: ForexMacroData;
  
  // Technical & Timing
  trend: TrendType;
  technicalScore: number; // 0 - 100
  rsi: number;
  macdSignal: 'BULLISH_CROSSOVER' | 'BEARISH_CROSSOVER' | 'NEUTRAL';
  ema20: number;
  ema50: number;
  ema200: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  stopLossPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  technicalSignal: TechnicalSignalType;
  
  // Qualitative
  compositeRating: CompositeRating;
  businessDescription: string;
  strengths: string[];
  risks: string[];
  actionPlanSummary: string;
  
  // Historical Candles
  candles: PriceCandle[];
}

export interface PositionSizingInput {
  portfolioSize: number;
  riskPercent: number; // e.g. 1.5%
  entryPrice: number;
  stopLossPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  isForex?: boolean;
  leverage?: number;
}

export interface PositionSizingOutput {
  maxRiskAmount: number;
  riskPerShare: number;
  recommendedShares: number;
  totalCapitalRequired: number;
  capitalPercent: number;
  rewardPerShare1: number;
  rewardPerShare2: number;
  riskRewardRatio1: number;
  riskRewardRatio2: number;
  expectedProfit1: number;
  expectedProfit2: number;
  // Forex specifics
  recommendedLots?: number;
  marginRequired?: number;
  pipRisk?: number;
}

export type PriceBracketType = 
  | 'ALL' 
  | 'UNDER_10' 
  | '10_TO_50' 
  | '50_TO_100' 
  | 'ABOVE_100' 
  | 'CUSTOM';

export interface PriceRangePreference {
  bracket: PriceBracketType;
  minPrice?: number;
  maxPrice?: number;
}

export interface ScreenerFilter {
  category?: 'all' | 'dividend' | 'growth' | 'breakout' | 'undervalued';
  assetCategory?: 'ALL' | 'THAI_STOCK' | 'GLOBAL_STOCK' | 'FOREX';
  market?: string;
  stockSize?: StockCapSize;
  minPrice?: number;
  maxPrice?: number;
  priceBracket?: PriceBracketType;
  minDividend?: number;
  maxPE?: number;
  minROE?: number;
  maxDE?: number;
  minScore?: number;
  trend?: string;
  searchQuery?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  notes?: string;
  stockData: StockData;
}

// User Authentication
export interface AuthUser {
  username: string;
  role: 'admin' | 'user';
  loginTime: string;
}

// Investment Objectives
export type InvestmentGoal = 'DIVIDEND_VALUE' | 'GROWTH_MOMENTUM' | 'CAPITAL_PRESERVATION' | 'ACTIVE_TRADING';

export type TradingMode = 'STANDARD_VI' | 'DAY_TRADE';

export type DayTradeTimeframe = '1_DAY' | '2_3_DAYS' | '1_WEEK';

export interface DayTradeIndicators {
  emaTrend: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ema5: number;
  ema10: number;
  ema25: number;
  rsi: number;
  rsiStatus: 'OVERSOLD_DIP' | 'SUPER_MOMENTUM' | 'HEALTHY_BULL' | 'OVERBOUGHT_DANGER' | 'NEUTRAL';
  volumeSurgePercent: number; // e.g. +230%
  macdStatus: 'BULLISH_CROSS' | 'HISTOGRAM_POSITIVE' | 'BEARISH';
  volatilityATR: number;
}

export interface AIRiskAudit {
  verdict: 'HIGHLY_APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'HIGH_RISK_WARNING' | 'REJECT_DANGEROUS';
  verdictTitle: string; // e.g. "AI เห็นชอบ: กราฟทรงสวย โมเมนตัมกำลังมา" หรือ "AI เตือนระวัง: ติดแนวต้านใหญ่/เสี่ยงดอย"
  score: number; // 0 to 100
  pros: string[]; // จุดเด่น/สัญญาณบวก
  cons: string[]; // จุดเสี่ยง/ข้อควรระวัง
  peerRecommendationAnalysis: string; // ความเห็นต่อคำแนะนำจากคนอื่น/ข่าว
  trapWarning?: string; // เตือนกับดักราคา เช่น Volume คลุมเครือ หรือ RSI Overbought
}

export interface DayTradeSetup {
  symbol: string;
  stock: StockData;
  timeframe: DayTradeTimeframe;
  signalType: 'VOLUME_BREAKOUT' | 'EMA_PULLBACK' | 'RSI_BOUNCE' | 'MOMENTUM_SCALP';
  entryPrice: number;
  entryZone: string; // e.g. "62.00 - 62.75"
  stopLossPrice: number;
  stopLossPercent: number; // e.g. -2.2%
  targetPrice1: number; // TP1
  targetPrice2: number; // TP2
  expectedGainPercent1: number; // e.g. +5.5%
  expectedGainPercent2: number; // e.g. +11.2%
  riskRewardRatio: number; // e.g. 2.5 (1:2.5)
  recommendedShares: number;
  allocatedCapital: number;
  indicators: DayTradeIndicators;
  actionGuidance: string;
  urgentWarning?: string;
  sourceOfIdea?: string; // เช่น "เพื่อนแนะนำมา", "ห้องไลน์บอกมา", "ตามข่าว", "วิเคราะห์เจอเอง"
  aiRiskAudit?: AIRiskAudit; // ผลการตรวจจับความเสี่ยง & วินิจฉัยความเห็นชอบโดย AI
}

export interface DayTradePortfolio {
  capital: number;
  timeframe: DayTradeTimeframe;
  createdAt: string;
  setups: DayTradeSetup[];
  targetProfitPercent: number;
}

export type RiskProfile = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export type InvestmentPeriod = '1_3_MONTHS' | '3_6_MONTHS' | '6_12_MONTHS' | '1_3_YEARS';

export interface InvestorProfile {
  capital: number;
  currency: 'THB' | 'USD';
  targetReturnPercent: number;
  riskProfile: RiskProfile;
  period: InvestmentPeriod;
  preferredBoard: AssetCategory;
  stockSizePreference?: StockCapSize;
  objective: InvestmentGoal;
  pricePreference?: PriceRangePreference;
}

// AI Portfolio Allocation for 5-8 Stocks
export interface PortfolioItem {
  stock: StockData;
  weightPercent: number; // e.g. 20%
  allocatedCapital: number; // e.g. 20,000 THB
  recommendedBuyZone: string; // e.g. "60.50 - 62.50"
  recommendedShares: number; // e.g. 300 shares
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  expectedReturnPercent: number;
  riskPercent: number;
  riskRewardRatio: number;
  thesis: string;
  periodMonitoringPlan: string;
  roleInPortfolio: 'Core Anchor' | 'Growth Engine' | 'Dividend Generator' | 'Momentum Catalyst' | 'Hedge / Moat';
}

export interface AIPortfolio {
  id: string;
  generatedAt: string;
  investorProfile: InvestorProfile;
  totalCapital: number;
  items: PortfolioItem[]; // 5-8 items
  weightedExpectedReturn: number; // %
  estimatedAnnualDividend: number; // Currency
  estimatedMaxDrawdown: number; // %
  averageMarginOfSafety: number; // %
  aiExecutiveSummary: string;
  rebalancingSchedule: string;
  macroRiskAssessment: string;
}

// User Self-Tracked Position & Portfolio
export type UserStrategyTag = 
  | 'VALUE_INVESTING' 
  | 'GROWTH_MOMENTUM' 
  | 'SWING_TRADE' 
  | 'DIVIDEND_INCOME' 
  | 'BREAKOUT_PLAY' 
  | 'DIP_BUY';

export interface UserPosition {
  id: string;
  symbol: string;
  entryDate: string;
  entryPrice: number;
  shares: number;
  totalCost: number;
  targetPrice: number; // กำไรเป้าหมาย
  stopLossPrice: number; // จุดตัดขาดทุน
  strategyTag: UserStrategyTag;
  thesisNotes: string;
  stockData: StockData;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  stockName: string;
  category?: AssetCategory;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  totalInvested?: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  exitReason: 'TARGET_HIT' | 'STOP_LOSS' | 'MANUAL_EXIT' | 'TRAILING_STOP';
  strategyTag?: UserStrategyTag;
  journalNotes: string;
  isWin: boolean;
}

export interface UserSkillMetrics {
  totalTrades: number;
  openPositionsCount: number;
  winCount: number;
  lossCount: number;
  winRate: number; // %
  targetHitCount: number;
  targetHitRate: number; // % of closed trades hitting target
  disciplineScore: number; // 0 - 100
  avgRiskRewardRatio: number;
  overallSkillScore: number; // 0 - 100
  skillLevelTitle: string;
  skillTier: 1 | 2 | 3 | 4;
  diversificationScore: number; // 0 - 100
  strengths: string[];
  growthAreas: string[];
  aiCoachAdvice: string;
}

// AI Master Analyst Audit for User-Managed Portfolio
export interface AssetCritiqueItem {
  symbol: string;
  status: 'STAR_ASSET' | 'SOLID_CORE' | 'MONITOR_CLOSELY' | 'HIGH_RISK';
  verdict: string;
}

export interface PeriodCompletionForecast {
  probabilityOfTargetHit: number; // % e.g. 75
  projectedEndReturnPercent: number; // % e.g. 19.2%
  projectedEndValue: number; // Currency
  periodMilestoneAdvice: string;
}

export interface UserPortfolioAudit {
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  score: number; // 0 - 100
  executiveVerdict: string;
  goalAlignmentAnalysis: string;
  strengths: string[];
  risksAndBlindspots: string[];
  assetCritiques: AssetCritiqueItem[];
  actionableOptimization: string[];
  periodCompletionForecast: PeriodCompletionForecast;
  auditedAt?: string;
}

export interface PeriodCompletionKPIs {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  progressPercent: number;
  isPeriodEnded: boolean;
  targetReturnPercent: number;
  targetProfitAmount: number;
  currentReturnPercent: number;
  currentNetPnL: number;
  projectedEndReturn: number;
  projectedEndValue: number;
  targetAchievementRate: number;
  sharpeRatio: number;
  calmarRatio: number;
  estimatedMaxDrawdown: number;
  portfolioBeta: number;
  averageMarginOfSafety: number;
  winRate: number;
  disciplineScore: number;
  milestoneGrade: string;
  stressTest: {
    bullCaseReturn: number;
    bullCaseValue: number;
    baseCaseReturn: number;
    baseCaseValue: number;
    bearCaseReturn: number;
    bearCaseValue: number;
  };
}

/**
 * SBY INVEST AI - Daily Stock Price Database & Unified Last Price Model
 */
export interface DailyStockPrice {
  id: string; // Unique Key: `${symbol}_${tradeDate}`
  symbol: string;
  stockName: string;
  tradeDate: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  last: number; // Equals close of the latest valid trade date
  dataUpdatedAt: string;
  source: 'SIAMCHART' | 'SETTRADE' | 'MANUAL_VALIDATED' | 'OFFICIAL_SET';
}

export interface StockPriceReportItem {
  no: number;
  symbol: string;
  stockName: string;
  market: MarketType;
  sector: string;
  capSize: StockCapSize;
  reportDate: string;
  priceDate: string;
  prevClose: number;
  last: number;
  change: number;
  changePercent: number;
  volume: number;
  isHolidayOrWeekend: boolean;
  dataUpdatedAt: string;
  source: string;
}

export interface DailyPriceReportSummary {
  reportDate: string;
  priceDate: string;
  marketStatus: 'CLOSED_EOD_LOCKED' | 'WEEKEND_HOLIDAY_LOCKED';
  totalStocks: number;
  gainers: number;
  decliners: number;
  unchanged: number;
  items: StockPriceReportItem[];
}

/**
 * Live Market Engine & Precision Technical Calculations
 */
export type MarketRefreshInterval = 0 | 5 | 15 | 30 | 60; // 0 = Off / Manual

export interface BidOfferLevel {
  price: number;
  volume: number;
  level: number; // 1 to 5
}

export interface MarketDepth5Level {
  bids: BidOfferLevel[];
  offers: BidOfferLevel[];
  totalBidVol: number;
  totalOfferVol: number;
  bidRatioPercent: number; // % of buy pressure
  offerRatioPercent: number;
  spread: number;
  tickSize: number;
}

export interface FibonacciPrecisionLevels {
  swingHigh: number;
  swingLow: number;
  fib0: number;       // 0% (Swing Low)
  fib236: number;     // 23.6%
  fib382: number;     // 38.2%
  fib500: number;     // 50.0%
  fib618: number;     // 61.8% Golden Pocket Entry
  fib786: number;     // 78.6% Deep Retracement
  fib1000: number;    // 100% Swing High (TP1)
  fib1272: number;    // 127.2% Extension (TP2 Target)
  fib1618: number;    // 161.8% Super Extension
}

export interface PrecisionTechnicalPlan {
  currentPrice: number;
  suggestedEntry: number;
  stopLossPrice: number;
  riskPercent: number;
  targetPrice1: number;
  targetPrice2: number;
  riskRewardRatio1: number;
  riskRewardRatio2: number;
  tradeGrade: 'GRADE_A_PLUS' | 'GRADE_A' | 'GRADE_B' | 'HIGH_RISK';
  fibLevels: FibonacciPrecisionLevels;
  depth: MarketDepth5Level;
  tickSize: number;
  lastUpdated: string;
}

export interface StockScanResult {
  symbol: string;
  name: string;
  market: MarketType;
  category: AssetCategory;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  suggestedEntry: number;
  stopLoss: number;
  target1: number;
  target2: number;
  rrRatio: number;
  signal: TechnicalSignalType;
  tradeGrade: 'GRADE_A_PLUS' | 'GRADE_A' | 'GRADE_B' | 'HIGH_RISK';
  bidRatio: number;
}

