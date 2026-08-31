import { StockData, PriceCandle, PrecisionTechnicalPlan, FibonacciPrecisionLevels, MarketDepth5Level, BidOfferLevel } from '../types';

/**
 * Returns exact SET Tick Size based on official Stock Exchange of Thailand regulations
 * Under 2 THB: 0.01
 * 2 - 4.99 THB: 0.02
 * 5 - 9.99 THB: 0.05
 * 10 - 24.99 THB: 0.10
 * 25 - 99.99 THB: 0.25
 * 100 - 199.99 THB: 0.50
 * 200 - 399.99 THB: 1.00
 * 400+ THB: 2.00
 */
export function getSetTickSize(price: number): number {
  if (price < 2) return 0.01;
  if (price < 5) return 0.02;
  if (price < 10) return 0.05;
  if (price < 25) return 0.10;
  if (price < 100) return 0.25;
  if (price < 200) return 0.50;
  if (price < 400) return 1.00;
  return 2.00;
}

/**
 * Rounds a price to the nearest valid SET tick size
 */
export function roundToSetTick(price: number): number {
  if (price <= 0) return 0.01;
  const tick = getSetTickSize(price);
  const factor = 1 / tick;
  return Number((Math.round(price * factor) / factor).toFixed(2));
}

/**
 * Calculates Fibonacci Retracements and Extensions for Golden Pocket Analysis
 */
export function calculateFibonacciLevels(currentPrice: number, high52w?: number, low52w?: number): FibonacciPrecisionLevels {
  const high = high52w && high52w > currentPrice ? high52w : currentPrice * 1.18;
  const low = low52w && low52w < currentPrice ? low52w : currentPrice * 0.82;
  const range = high - low;

  const fib0 = roundToSetTick(low);
  const fib236 = roundToSetTick(low + range * 0.236);
  const fib382 = roundToSetTick(low + range * 0.382);
  const fib500 = roundToSetTick(low + range * 0.500);
  const fib618 = roundToSetTick(low + range * 0.618); // Golden Pocket Entry
  const fib786 = roundToSetTick(low + range * 0.786);
  const fib1000 = roundToSetTick(high);
  const fib1272 = roundToSetTick(high + range * 0.272); // Extension TP2
  const fib1618 = roundToSetTick(high + range * 0.618); // Super Extension

  return {
    swingHigh: high,
    swingLow: low,
    fib0,
    fib236,
    fib382,
    fib500,
    fib618,
    fib786,
    fib1000,
    fib1272,
    fib1618,
  };
}

/**
 * 5-Level Bid/Offer Depth Handler (Zero-Simulation Standard)
 * Order Book L2 data requires direct real-time broker API streaming.
 * In EOD/snapshot mode, returns ORDER_BOOK_DATA_UNAVAILABLE with exact SET price ticks.
 */
export function generate5LevelDepth(stock: StockData, isLiveFluctuation: boolean = false): MarketDepth5Level {
  const current = stock.currentPrice;
  const tick = getSetTickSize(current);

  // Return explicit unavailable status for L2 volume instead of fabricating synthetic volume numbers
  const bids: BidOfferLevel[] = [];
  const offers: BidOfferLevel[] = [];

  for (let i = 1; i <= 5; i++) {
    bids.push({
      level: i,
      price: Math.max(0.01, roundToSetTick(current - (i - 1) * tick)),
      volume: 0,
    });

    offers.push({
      level: i,
      price: roundToSetTick(current + i * tick),
      volume: 0,
    });
  }

  return {
    bids,
    offers,
    totalBidVol: 0,
    totalOfferVol: 0,
    bidRatioPercent: 0,
    offerRatioPercent: 0,
    spread: tick,
    tickSize: tick,
    status: 'ORDER_BOOK_DATA_UNAVAILABLE',
    isAvailable: false,
  };
}

/**
 * Calculates complete Precision Technical Plan with Golden Pocket (61.8%), 
 * Safe Stop Loss, Take Profit 1 & 2, and Risk/Reward Validation (>= 1:2.0)
 */
export function calculatePrecisionTechnicalPlan(stock: StockData): PrecisionTechnicalPlan {
  const current = stock.currentPrice;
  const tick = getSetTickSize(current);
  const fib = calculateFibonacciLevels(current, stock.high52w, stock.low52w);
  const depth = generate5LevelDepth(stock);

  // Suggested Entry: Golden Pocket (61.8%) or EMA20 Support level rounded to tick
  let suggestedEntry = current;
  if (stock.support1 && stock.support1 < current) {
    suggestedEntry = roundToSetTick(stock.support1);
  } else if (fib.fib618 < current) {
    suggestedEntry = roundToSetTick((current + fib.fib618) / 2);
  } else {
    suggestedEntry = roundToSetTick(current - 2 * tick);
  }

  // Stop Loss: 2-3 ticks below Swing Low or Support 2
  let stopLossPrice = stock.stopLossPrice;
  if (!stopLossPrice || stopLossPrice >= suggestedEntry) {
    const rawSL = (stock.support2 && stock.support2 < suggestedEntry) 
      ? stock.support2 - 2 * tick 
      : suggestedEntry * 0.96;
    stopLossPrice = roundToSetTick(rawSL);
  }

  const riskPerShare = Math.max(tick, suggestedEntry - stopLossPrice);
  const riskPercent = Number(((riskPerShare / suggestedEntry) * 100).toFixed(2));

  // Take Profit 1 (First Resistance / Swing High)
  let targetPrice1 = stock.targetPrice1;
  if (!targetPrice1 || targetPrice1 <= suggestedEntry) {
    targetPrice1 = roundToSetTick(suggestedEntry + (riskPerShare * 2.2));
  }

  // Take Profit 2 (Fibonacci 127.2% Extension)
  let targetPrice2 = stock.targetPrice2;
  if (!targetPrice2 || targetPrice2 <= targetPrice1) {
    targetPrice2 = roundToSetTick(Math.max(fib.fib1272, suggestedEntry + (riskPerShare * 3.5)));
  }

  const rewardPerShare1 = targetPrice1 - suggestedEntry;
  const rewardPerShare2 = targetPrice2 - suggestedEntry;

  const rrRatio1 = Number((rewardPerShare1 / riskPerShare).toFixed(2));
  const rrRatio2 = Number((rewardPerShare2 / riskPerShare).toFixed(2));

  // Evaluate Trade Grade
  let tradeGrade: 'GRADE_A_PLUS' | 'GRADE_A' | 'GRADE_B' | 'HIGH_RISK' = 'GRADE_B';
  if (rrRatio1 >= 2.5 && depth.bidRatioPercent >= 55) {
    tradeGrade = 'GRADE_A_PLUS';
  } else if (rrRatio1 >= 2.0) {
    tradeGrade = 'GRADE_A';
  } else if (rrRatio1 >= 1.5) {
    tradeGrade = 'GRADE_B';
  } else {
    tradeGrade = 'HIGH_RISK';
  }

  return {
    currentPrice: current,
    suggestedEntry,
    stopLossPrice,
    riskPercent,
    targetPrice1,
    targetPrice2,
    riskRewardRatio1: rrRatio1,
    riskRewardRatio2: rrRatio2,
    tradeGrade,
    fibLevels: fib,
    depth,
    tickSize: tick,
    lastUpdated: new Date().toLocaleTimeString('th-TH', { hour12: false }),
  };
}

/**
 * Checks if sufficient historical candles exist for calculating standard indicators
 */
export function evaluateIndicatorSufficiency(candles?: PriceCandle[]): {
  isRsiAvailable: boolean;
  isEma20Available: boolean;
  isEma50Available: boolean;
  isEma200Available: boolean;
  candleCount: number;
  qualityStatus: 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT_DATA';
} {
  const count = candles?.length || 0;
  const isRsiAvailable = count >= 15;
  const isEma20Available = count >= 20;
  const isEma50Available = count >= 50;
  const isEma200Available = count >= 200;

  let qualityStatus: 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
  if (count >= 50) {
    qualityStatus = 'SUFFICIENT';
  } else if (count >= 15) {
    qualityStatus = 'PARTIAL';
  }

  return {
    isRsiAvailable,
    isEma20Available,
    isEma50Available,
    isEma200Available,
    candleCount: count,
    qualityStatus,
  };
}
