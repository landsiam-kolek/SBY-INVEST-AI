import { StockData, InvestorProfile, AIPortfolio, PortfolioItem, StockCapSize } from '../types';
import { filterStocksBySize } from './priceSyncEngine';

/**
 * Intelligent Multi-Factor Portfolio Construction Engine
 * Selects 5 to 8 diversified, high-conviction assets tailored to the investor's:
 * - Capital size
 * - Target Return expectation
 * - Risk tolerance (Conservative, Moderate, Aggressive)
 * - Investment Period (1-3M, 3-6M, 6-12M, 1-3Y)
 * - Preferred Market Board (Thai, Global, Forex, All)
 */
export function buildIntelligentPortfolio(
  stocks: StockData[],
  profile: InvestorProfile,
  customSummary?: string
): AIPortfolio {
  const { capital, riskProfile, period, preferredBoard, targetReturnPercent } = profile;

  // 1. Filter eligible universe based on preferred board & user's desired price bracket
  // Phase 1 Audit Quality Gate: Strictly reject GRADE_D, GRADE_F, or DATA_UNAVAILABLE assets
  let universe = stocks.filter((s) => {
    // Quality Gate: Only allow GRADE_A, GRADE_B, or GRADE_C with valid EOD/Live prices
    if (s.dataQuality === 'GRADE_D' || s.dataQuality === 'GRADE_F') return false;
    if (s.dataStatus === 'DATA_UNAVAILABLE') return false;
    if (!s.currentPrice || s.currentPrice <= 0) return false;
    return true;
  });

  if (preferredBoard === 'THAI_STOCK') {
    universe = universe.filter((s) => s.assetCategory === 'THAI_STOCK');
  } else if (preferredBoard === 'GLOBAL_STOCK') {
    universe = universe.filter((s) => s.assetCategory === 'GLOBAL_STOCK');
  } else if (preferredBoard === 'FOREX') {
    universe = universe.filter((s) => s.assetCategory === 'FOREX');
  }

  // Strict symbol deduplication in universe
  const seenUniverseSymbols = new Set<string>();
  universe = universe.filter((s) => {
    const sym = s.symbol.toUpperCase().trim();
    if (!sym || seenUniverseSymbols.has(sym)) return false;
    seenUniverseSymbols.add(sym);
    return true;
  });

  // Filter by user's preferred Stock Size / Market Cap Scope (ขนาดหุ้น)
  if (profile.stockSizePreference && profile.stockSizePreference !== 'ALL') {
    const sizeFiltered = filterStocksBySize(universe, profile.stockSizePreference);
    if (sizeFiltered.length >= 3) {
      universe = sizeFiltered;
    }
  }

  // Filter by user's specific price condition if specified
  if (profile.pricePreference && profile.pricePreference.bracket !== 'ALL') {
    const { bracket, minPrice, maxPrice } = profile.pricePreference;
    const priceFiltered = universe.filter((s) => {
      if (s.assetCategory === 'FOREX') return true; // Forex pairs don't use THB price brackets
      const p = s.currentPrice;
      if (bracket === 'UNDER_10') return p <= 10;
      if (bracket === '10_TO_50') return p >= 10 && p <= 50;
      if (bracket === '50_TO_100') return p >= 50 && p <= 100;
      if (bracket === 'ABOVE_100') return p >= 100;
      if (bracket === 'CUSTOM') {
        const min = minPrice !== undefined ? minPrice : 0;
        const max = maxPrice !== undefined && maxPrice > 0 ? maxPrice : Infinity;
        return p >= min && p <= max;
      }
      return true;
    });

    if (priceFiltered.length >= 3) {
      universe = priceFiltered;
    }
  }

  // If filtered universe is too small, fallback to including other strong candidates
  if (universe.length < 5) {
    const fallbackSeen = new Set(universe.map(s => s.symbol.toUpperCase().trim()));
    stocks.forEach((s) => {
      const sym = s.symbol.toUpperCase().trim();
      if (!fallbackSeen.has(sym)) {
        fallbackSeen.add(sym);
        universe.push(s);
      }
    });
  }

  // 2. Multi-factor Scoring based on Risk Profile & Period
  const scored = universe.map((stock) => {
    let score = 0;
    const isFx = stock.assetCategory === 'FOREX';

    // Factor 1: Fundamental Strength & Moat
    score += (stock.fundamentalScore || 70) * (riskProfile === 'CONSERVATIVE' ? 0.4 : 0.25);

    // Factor 2: Valuation Margin of Safety
    const mos = Math.max(-20, Math.min(35, stock.marginOfSafety || 0));
    score += mos * (riskProfile === 'CONSERVATIVE' ? 0.8 : 0.4);

    // Factor 3: Technical Trend & Momentum
    const techScore = stock.technicalScore || 70;
    const trendMultiplier = stock.trend === 'UPTREND' ? 1.2 : stock.trend === 'SIDEWAY' ? 0.9 : 0.6;
    score += techScore * trendMultiplier * (riskProfile === 'AGGRESSIVE' ? 0.45 : 0.25);

    // Factor 4: Dividend Yield (Higher for Conservative / Long-term)
    if (riskProfile === 'CONSERVATIVE' || period === '1_3_YEARS' || profile.objective === 'DIVIDEND_VALUE') {
      score += (stock.dividendYield || 0) * 4.5;
    }

    // Factor 5: Period Fit
    if (period === '1_3_MONTHS') {
      // Short-term: Favor high RSI momentum & Buy signals
      if (stock.technicalSignal === 'STRONG_BUY' || stock.technicalSignal === 'BUY_BREAKOUT') score += 15;
      if (stock.rsi >= 50 && stock.rsi <= 68) score += 10;
    } else if (period === '1_3_YEARS') {
      // Long-term: Favor high ROE & Low DE
      if ((stock.roe || 0) >= 15) score += 15;
      if ((stock.de || 0) <= 1.2) score += 10;
    }

    // Risk penalty
    if (riskProfile === 'CONSERVATIVE' && stock.valuationStatus === 'OVERVALUED') {
      score -= 25;
    }

    return {
      stock,
      totalScore: score,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // 3. Sector / Category Diversification Selection
  // Select between 5 to 8 assets (default 6-7 optimal for retail portfolio)
  const targetAssetCount = capital >= 500000 ? 7 : capital >= 150000 ? 6 : 5;
  const selectedStocks: StockData[] = [];
  const selectedSectors = new Set<string>();

  for (const item of scored) {
    if (selectedStocks.length >= targetAssetCount) break;

    // Strict symbol deduplication guard
    if (selectedStocks.some((s) => s.symbol.toUpperCase() === item.stock.symbol.toUpperCase())) {
      continue;
    }

    const sectorKey = `${item.stock.assetCategory}_${item.stock.sector}`;
    // Limit max 2 stocks per sector to prevent over-concentration
    const sectorCount = selectedStocks.filter(
      (s) => `${s.assetCategory}_${s.sector}` === sectorKey
    ).length;

    if (sectorCount < 2) {
      selectedStocks.push(item.stock);
      selectedSectors.add(sectorKey);
    }
  }

  // If we still need more assets to reach targetAssetCount, fill from remaining
  if (selectedStocks.length < targetAssetCount) {
    for (const item of scored) {
      if (selectedStocks.length >= targetAssetCount) break;
      if (!selectedStocks.some((s) => s.symbol.toUpperCase() === item.stock.symbol.toUpperCase())) {
        selectedStocks.push(item.stock);
      }
    }
  }

  // 4. Calculate Optimal Weights & Share Quantities
  // Higher weight to higher ranked / safer core holdings
  const count = selectedStocks.length;
  let rawWeights: number[] = [];

  if (count === 5) {
    rawWeights = riskProfile === 'CONSERVATIVE' ? [28, 24, 20, 16, 12] : [25, 25, 20, 15, 15];
  } else if (count === 6) {
    rawWeights = riskProfile === 'CONSERVATIVE' ? [24, 20, 18, 16, 12, 10] : [22, 20, 18, 16, 14, 10];
  } else if (count === 7) {
    rawWeights = [20, 18, 16, 15, 13, 10, 8];
  } else {
    // 8 items
    rawWeights = [18, 16, 15, 14, 13, 10, 8, 6];
  }

  const items: PortfolioItem[] = selectedStocks.map((stock, idx) => {
    const weight = rawWeights[idx] || Math.round(100 / count);
    const allocated = (capital * weight) / 100;
    const entry = stock.currentPrice;
    const target = stock.targetPrice1 || stock.fairValue || entry * 1.15;
    const stopLoss = stock.stopLossPrice || entry * 0.93;

    // Calculate shares or lot size
    let recommendedShares = 0;
    if (stock.assetCategory === 'FOREX') {
      // For forex/gold: unit lot size
      recommendedShares = Number((allocated / (entry * 10)).toFixed(2));
      if (recommendedShares <= 0) recommendedShares = 0.05;
    } else {
      // For stocks: round to board lot (100 shares for Thai stocks or integer for US)
      if (stock.currency === 'THB') {
        const rawShares = Math.floor(allocated / entry);
        recommendedShares = Math.max(100, Math.floor(rawShares / 100) * 100);
      } else {
        recommendedShares = Math.max(1, Math.floor(allocated / entry));
      }
    }

    const expectedReturnPercent = Number((((target - entry) / entry) * 100).toFixed(1));
    const riskPercent = Number((((entry - stopLoss) / entry) * 100).toFixed(1));
    const riskRewardRatio = Number((expectedReturnPercent / (riskPercent || 1)).toFixed(2));

    // Assign Role
    let role: PortfolioItem['roleInPortfolio'] = 'Core Anchor';
    if (idx === 0) role = 'Core Anchor';
    else if (stock.assetCategory === 'FOREX' || stock.sector.toLowerCase().includes('gold')) role = 'Hedge / Moat';
    else if (stock.dividendYield >= 3.5) role = 'Dividend Generator';
    else if (stock.trend === 'UPTREND' && stock.rsi >= 60) role = 'Momentum Catalyst';
    else role = 'Growth Engine';

    // Period Monitoring Plan
    let periodPlan = '';
    if (period === '1_3_MONTHS') {
      periodPlan = `จับจังหวะสวิงเทรดระยะสั้น 1-3 เดือน เฝ้าแนวรับ ${stock.support1} และ Take Profit ไม้แรกที่ ${target} วาง Trailing Stop หากหลุด EMA20`;
    } else if (period === '3_6_MONTHS') {
      periodPlan = `เกาะรอบผลประกอบการไตรมาส 3-6 เดือน เฝ้าติดตามงบการเงินและยอดขาย โซนทำกำไรเป้าหมาย ${target} หากย่อตัวไม่หลุด ${stock.support2} ให้คงสถานะถือ`;
    } else if (period === '6_12_MONTHS') {
      periodPlan = `ถือครองรอบ 1 ปีเพื่อรับผลการดำเนินงานเต็มปีและเงินปันผล (${stock.dividendYield}%) Rebalance สัดส่วนเมื่อราคาเกิน Fair Value (${stock.fairValue})`;
    } else {
      periodPlan = `ลงทุนแบบ DCA และ Compound Growth 1-3 ปี สะสมเพิ่มเมื่อมีส่วนลด MOS > 15% ทบทวนปัจจัยพื้นฐานปีละ 2 ครั้ง`;
    }

    const thesis = `${stock.name} - คะแนนพื้นฐาน ${stock.fundamentalScore}/100, เทรนด์ ${stock.trend === 'UPTREND' ? 'ขาขึ้นแข็งแกร่ง' : 'พักตัวสะสมพลัง'}, MOS ${stock.marginOfSafety > 0 ? `+${stock.marginOfSafety}%` : `${stock.marginOfSafety}%`}`;

    return {
      stock,
      weightPercent: weight,
      allocatedCapital: Math.round(allocated),
      recommendedBuyZone: `${(entry * 0.985).toFixed(2)} - ${(entry * 1.01).toFixed(2)}`,
      recommendedShares,
      entryPrice: entry,
      targetPrice: target,
      stopLossPrice: stopLoss,
      expectedReturnPercent,
      riskPercent,
      riskRewardRatio,
      thesis,
      periodMonitoringPlan: periodPlan,
      roleInPortfolio: role,
    };
  });

  // Calculate Weighted Metrics
  const weightedReturn = Number(
    items.reduce((sum, item) => sum + (item.expectedReturnPercent * item.weightPercent) / 100, 0).toFixed(1)
  );

  const estimatedDividend = Math.round(
    items.reduce(
      (sum, item) => sum + (item.allocatedCapital * (item.stock.dividendYield || 0)) / 100,
      0
    )
  );

  const avgMos = Number(
    items.reduce((sum, item) => sum + ((item.stock.marginOfSafety || 0) * item.weightPercent) / 100, 0).toFixed(1)
  );

  const maxDrawdown = riskProfile === 'CONSERVATIVE' ? 5.5 : riskProfile === 'MODERATE' ? 8.5 : 13.0;

  // Rebalancing schedule
  const rebalancingSchedule =
    period === '1_3_MONTHS'
      ? 'ตรวจเช็ครายสัปดาห์ (Weekly Technical & Momentum Review)'
      : period === '3_6_MONTHS'
      ? 'ตรวจเช็ครายเดือน (Monthly Sector & Earnings Review)'
      : period === '6_12_MONTHS'
      ? 'ตรวจเช็ครายไตรมาส (Quarterly Financial Rebalancing)'
      : 'ตรวจเช็คทุก 6 เดือน (Semi-Annual Value Compounding Review)';

  const macroRisk =
    riskProfile === 'CONSERVATIVE'
      ? 'พอร์ตเน้นสินทรัพย์ที่มี Moat สูงและกระแสเงินสดมั่นคง ทนทานต่อความผันผวนของอัตราดอกเบี้ยและเศรษฐกิจชะลอตัว'
      : riskProfile === 'MODERATE'
      ? 'พอร์ตกระจายความเสี่ยงอย่างสมดุล มีทั้งตัวสร้างผลตอบแทนเติบโตและตัวค้ำประกันความเสี่ยง (Cash Flow Anchor)'
      : 'พอร์ตเน้นการสร้างผลตอบแทนสูงสุด (Alpha Generation) ตอบรับธีมเทคโนโลยีและโมเมนตัม แต่ต้องมีวินัย Stop Loss เคร่งครัด';

  const defaultSummary = `พอร์ตการลงทุนจัดสรร ${count} สินทรัพย์ชั้นนำ สอดรับกับเงินทุน ${capital.toLocaleString()} ${profile.currency} เป้าหมายกำไร ${targetReturnPercent}% และระยะเวลา ${
    period === '1_3_MONTHS' ? '1-3 เดือน' : period === '3_6_MONTHS' ? '3-6 เดือน' : period === '6_12_MONTHS' ? '6-12 เดือน' : '1-3 ปี'
  } โดยเน้นความได้เปรียบทั้งเชิงพื้นฐาน Valuation และจังหวะ Timing เทคนิคอล`;

  return {
    id: `port_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    investorProfile: profile,
    totalCapital: capital,
    items,
    weightedExpectedReturn: weightedReturn,
    estimatedAnnualDividend: estimatedDividend,
    estimatedMaxDrawdown: maxDrawdown,
    averageMarginOfSafety: avgMos,
    aiExecutiveSummary: customSummary || defaultSummary,
    rebalancingSchedule,
    macroRiskAssessment: macroRisk,
  };
}

/**
 * Recalculates metrics for a portfolio after user edits, deletes, or adds items.
 */
export function recalculatePortfolioFromItems(
  items: PortfolioItem[],
  capital: number,
  profile: InvestorProfile,
  customSummary?: string
): AIPortfolio {
  const count = items.length;
  if (count === 0) {
    return {
      id: `port_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      investorProfile: profile,
      totalCapital: capital,
      items: [],
      weightedExpectedReturn: 0,
      estimatedAnnualDividend: 0,
      estimatedMaxDrawdown: 0,
      averageMarginOfSafety: 0,
      aiExecutiveSummary: 'พอร์ตว่างเปล่า กรุณาเพิ่มหุ้นอย่างน้อย 1 รายการ',
      rebalancingSchedule: 'ยังไม่มีรายการ',
      macroRiskAssessment: 'ไม่มีความเสี่ยงเนื่องจากยังไม่มีการลงทุน',
    };
  }

  // Calculate sum of weights
  const totalWeight = items.reduce((sum, i) => sum + (Number(i.weightPercent) || 0), 0);

  // Normalize weights if needed or calculate per-item allocations
  const updatedItems: PortfolioItem[] = items.map((item) => {
    const stock = item.stock;
    const entry = item.entryPrice || stock.currentPrice;
    const target = item.targetPrice || stock.targetPrice1 || entry * 1.15;
    const stopLoss = item.stopLossPrice || stock.stopLossPrice || entry * 0.93;
    const weight = totalWeight > 0 ? Number(item.weightPercent) : Number((100 / count).toFixed(1));
    const allocated = Math.round((capital * weight) / 100);

    // Calculate shares
    let recommendedShares = 0;
    if (stock.assetCategory === 'FOREX') {
      recommendedShares = Number((allocated / (entry * 10)).toFixed(2));
      if (recommendedShares <= 0) recommendedShares = 0.05;
    } else {
      if (stock.currency === 'THB') {
        const rawShares = Math.floor(allocated / entry);
        recommendedShares = Math.max(100, Math.floor(rawShares / 100) * 100);
      } else {
        recommendedShares = Math.max(1, Math.floor(allocated / entry));
      }
    }

    const expectedReturnPercent = Number((((target - entry) / entry) * 100).toFixed(1));
    const riskPercent = Number((((entry - stopLoss) / entry) * 100).toFixed(1));
    const riskRewardRatio = Number((expectedReturnPercent / Math.max(0.1, riskPercent)).toFixed(2));

    return {
      ...item,
      entryPrice: entry,
      targetPrice: target,
      stopLossPrice: stopLoss,
      weightPercent: weight,
      allocatedCapital: allocated,
      recommendedShares,
      recommendedBuyZone: `${(entry * 0.985).toFixed(2)} - ${(entry * 1.01).toFixed(2)}`,
      expectedReturnPercent,
      riskPercent,
      riskRewardRatio,
    };
  });

  const effectiveTotalWeight = updatedItems.reduce((sum, i) => sum + i.weightPercent, 0) || 100;

  const weightedReturn = Number(
    updatedItems.reduce((sum, item) => sum + (item.expectedReturnPercent * item.weightPercent) / effectiveTotalWeight, 0).toFixed(1)
  );

  const estimatedDividend = Math.round(
    updatedItems.reduce(
      (sum, item) => sum + (item.allocatedCapital * (item.stock.dividendYield || 0)) / 100,
      0
    )
  );

  const avgMos = Number(
    updatedItems.reduce((sum, item) => sum + ((item.stock.marginOfSafety || 0) * item.weightPercent) / effectiveTotalWeight, 0).toFixed(1)
  );

  const maxDrawdown = profile.riskProfile === 'CONSERVATIVE' ? 5.5 : profile.riskProfile === 'MODERATE' ? 8.5 : 13.0;

  const rebalancingSchedule =
    profile.period === '1_3_MONTHS'
      ? 'ตรวจเช็ครายสัปดาห์ (Weekly Technical & Momentum Review)'
      : profile.period === '3_6_MONTHS'
      ? 'ตรวจเช็ครายเดือน (Monthly Sector & Earnings Review)'
      : profile.period === '6_12_MONTHS'
      ? 'ตรวจเช็ครายไตรมาส (Quarterly Financial Rebalancing)'
      : 'ตรวจเช็คทุก 6 เดือน (Semi-Annual Value Compounding Review)';

  const macroRisk =
    profile.riskProfile === 'CONSERVATIVE'
      ? 'พอร์ตเน้นสินทรัพย์ที่มี Moat สูงและกระแสเงินสดมั่นคง ทนทานต่อความผันผวนของอัตราดอกเบี้ยและเศรษฐกิจชะลอตัว'
      : profile.riskProfile === 'MODERATE'
      ? 'พอร์ตกระจายความเสี่ยงอย่างสมดุล มีทั้งตัวสร้างผลตอบแทนเติบโตและตัวค้ำประกันความเสี่ยง (Cash Flow Anchor)'
      : 'พอร์ตเน้นการสร้างผลตอบแทนสูงสุด (Alpha Generation) ตอบรับธีมเทคโนโลยีและโมเมนตัม แต่ต้องมีวินัย Stop Loss เคร่งครัด';

  return {
    id: `port_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    investorProfile: profile,
    totalCapital: capital,
    items: updatedItems,
    weightedExpectedReturn: weightedReturn,
    estimatedAnnualDividend: estimatedDividend,
    estimatedMaxDrawdown: maxDrawdown,
    averageMarginOfSafety: avgMos,
    aiExecutiveSummary: customSummary || `พอร์ตการลงทุนที่ผู้ใช้ปรับแต่งเอง ${count} สินทรัพย์ รวมมูลค่า ${capital.toLocaleString()} ${profile.currency} คำนวณสัดส่วนและเป้าหมายใหม่เรียบร้อย`,
    rebalancingSchedule,
    macroRiskAssessment: macroRisk,
  };
}
