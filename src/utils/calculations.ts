import { PositionSizingInput, PositionSizingOutput, StockData } from '../types';

export function calculatePositionSizing(input: PositionSizingInput): PositionSizingOutput {
  const { portfolioSize, riskPercent, entryPrice, stopLossPrice, targetPrice1, targetPrice2 } = input;

  const maxRiskAmount = (portfolioSize * (riskPercent / 100));
  const riskPerShare = Math.max(0.01, entryPrice - stopLossPrice);
  
  // Calculate raw shares
  let rawShares = Math.floor(maxRiskAmount / riskPerShare);
  
  // Cap shares if total cost exceeds portfolio size
  if (rawShares * entryPrice > portfolioSize) {
    rawShares = Math.floor(portfolioSize / entryPrice);
  }

  // Round down to standard lot of 100 for Thai stocks or 1 share
  const recommendedShares = rawShares >= 100 ? Math.floor(rawShares / 100) * 100 : Math.max(1, rawShares);
  const totalCapitalRequired = recommendedShares * entryPrice;
  const capitalPercent = (totalCapitalRequired / portfolioSize) * 100;

  const rewardPerShare1 = Math.max(0, targetPrice1 - entryPrice);
  const rewardPerShare2 = Math.max(0, targetPrice2 - entryPrice);

  const riskRewardRatio1 = riskPerShare > 0 ? Number((rewardPerShare1 / riskPerShare).toFixed(2)) : 0;
  const riskRewardRatio2 = riskPerShare > 0 ? Number((rewardPerShare2 / riskPerShare).toFixed(2)) : 0;

  const expectedProfit1 = recommendedShares * rewardPerShare1;
  const expectedProfit2 = recommendedShares * rewardPerShare2;

  return {
    maxRiskAmount: Math.round(maxRiskAmount),
    riskPerShare: Number(riskPerShare.toFixed(2)),
    recommendedShares,
    totalCapitalRequired: Math.round(totalCapitalRequired),
    capitalPercent: Number(capitalPercent.toFixed(1)),
    rewardPerShare1: Number(rewardPerShare1.toFixed(2)),
    rewardPerShare2: Number(rewardPerShare2.toFixed(2)),
    riskRewardRatio1,
    riskRewardRatio2,
    expectedProfit1: Math.round(expectedProfit1),
    expectedProfit2: Math.round(expectedProfit2),
  };
}

export function calculateCustomFairValue(
  stock: StockData,
  growthRate: number,
  targetPE: number
): { fairValue: number; marginOfSafety: number; valuationStatus: 'UNDERVALUED' | 'FAIR' | 'OVERVALUED' } {
  // Graham-like / PE Multiple hybrid: EPS * (1 + growth) * targetPE
  const forwardEPS = stock.eps * (1 + growthRate / 100);
  const estimatedFairValue = Number((forwardEPS * targetPE).toFixed(2));
  
  const diff = estimatedFairValue - stock.currentPrice;
  const marginOfSafety = Number(((diff / estimatedFairValue) * 100).toFixed(1));

  let valuationStatus: 'UNDERVALUED' | 'FAIR' | 'OVERVALUED' = 'FAIR';
  if (marginOfSafety >= 12) {
    valuationStatus = 'UNDERVALUED';
  } else if (marginOfSafety <= -10) {
    valuationStatus = 'OVERVALUED';
  }

  return {
    fairValue: estimatedFairValue,
    marginOfSafety,
    valuationStatus,
  };
}

export function formatCurrency(amount: number, currency: string = 'THB'): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'THB',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(val: number, decimals: number = 2): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}
