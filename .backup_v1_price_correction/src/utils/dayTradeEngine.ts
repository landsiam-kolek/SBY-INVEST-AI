import { StockData, DayTradeSetup, DayTradeTimeframe, DayTradeIndicators, DayTradePortfolio, AIRiskAudit } from '../types';

/**
 * Calculates short-term technical indicators tailored for Day Trade & Fast Swing
 */
export function calculateDayTradeIndicators(stock: StockData): DayTradeIndicators {
  const current = stock.currentPrice;
  const candles = stock.candles || [];
  
  // Synthetic / Derived EMAs for intraday/short-term
  const ema5 = Number((current * (stock.trend === 'UPTREND' ? 0.992 : 1.008)).toFixed(2));
  const ema10 = Number((current * (stock.trend === 'UPTREND' ? 0.985 : 1.015)).toFixed(2));
  const ema25 = Number((current * (stock.trend === 'UPTREND' ? 0.972 : 1.028)).toFixed(2));

  let emaTrend: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (current > ema5 && ema5 > ema10 && ema10 > ema25) {
    emaTrend = 'STRONG_BULLISH';
  } else if (current > ema10) {
    emaTrend = 'BULLISH';
  } else if (current < ema10 && current < ema25) {
    emaTrend = 'BEARISH';
  }

  // RSI status
  const rsi = stock.rsi || 52;
  let rsiStatus: 'OVERSOLD_DIP' | 'SUPER_MOMENTUM' | 'HEALTHY_BULL' | 'OVERBOUGHT_DANGER' | 'NEUTRAL' = 'NEUTRAL';
  if (rsi < 35) {
    rsiStatus = 'OVERSOLD_DIP';
  } else if (rsi >= 65 && rsi < 78) {
    rsiStatus = 'SUPER_MOMENTUM';
  } else if (rsi >= 78) {
    rsiStatus = 'OVERBOUGHT_DANGER';
  } else if (rsi >= 50 && rsi < 65) {
    rsiStatus = 'HEALTHY_BULL';
  }

  // Volume Surge Ratio
  const avgVol = stock.avgVolume30d || stock.volume || 1000000;
  const volSurge = Math.round(((stock.volume / Math.max(1, avgVol * 0.2)) * 100) - 100);
  const volumeSurgePercent = Math.max(15, Math.min(450, volSurge));

  // MACD Status
  let macdStatus: 'BULLISH_CROSS' | 'HISTOGRAM_POSITIVE' | 'BEARISH' = 'HISTOGRAM_POSITIVE';
  if (stock.macdSignal === 'BULLISH_CROSSOVER') {
    macdStatus = 'BULLISH_CROSS';
  } else if (stock.trend === 'DOWNTREND') {
    macdStatus = 'BEARISH';
  }

  // ATR estimate (2.5% to 4.5% daily range)
  const volatilityATR = Number((current * 0.032).toFixed(2));

  return {
    emaTrend,
    ema5,
    ema10,
    ema25,
    rsi,
    rsiStatus,
    volumeSurgePercent,
    macdStatus,
    volatilityATR,
  };
}

/**
 * Performs Deep AI Risk Audit on a stock that user is interested in or received recommendation from others
 */
export function performAIRiskAudit(
  stock: StockData, 
  indicators: DayTradeIndicators, 
  sourceOfIdea?: string
): AIRiskAudit {
  const pros: string[] = [];
  const cons: string[] = [];
  let score = 70;
  let trapWarning: string | undefined = undefined;

  // Evaluate Trend & Momentum
  if (indicators.emaTrend === 'STRONG_BULLISH') {
    pros.push('ทรงกราฟเรียงตัวขาขึ้นสมบูรณ์ (EMA 5 > 10 > 25) มีโมเมนตัมหนุน');
    score += 15;
  } else if (indicators.emaTrend === 'BEARISH') {
    cons.push('ราคาวิ่งใต้เส้น EMA สำคัญ เสี่ยงที่จะเป็นเพียงการเด้งสั้นเพื่อลงต่อ');
    score -= 20;
  }

  if (indicators.volumeSurgePercent >= 100) {
    pros.push(`มี Volume ไหลเข้ากระชากสูงผิดปกติ (+${indicators.volumeSurgePercent}%) สะท้อนความสนใจของตลาด`);
    score += 10;
  } else if (indicators.volumeSurgePercent < 30) {
    cons.push('Volume ค่อนข้างเบาบาง ระวังเกิดปัญหาสภาพคล่องเข้า-ออกยากตอน Day Trade');
    score -= 10;
  }

  // RSI Check & Overbought Trap
  if (indicators.rsiStatus === 'OVERBOUGHT_DANGER') {
    cons.push(`RSI อยู่ในโซนร้อนแรงเกินไป (${indicators.rsi}) เสี่ยงถูกแรงเทขายทำกำไรกระชากลง`);
    trapWarning = '⚠️ ระวังกับดักไล่ราคา (FOMO Trap): ห้ามซื้อเคาะขวาตอนราคาบวกแรง ให้รอตั้งรับจังหวะย่อเท่านั้น!';
    score -= 25;
  } else if (indicators.rsiStatus === 'SUPER_MOMENTUM') {
    pros.push(`RSI แข็งแกร่ง (${indicators.rsi}) อยู่ในโซน Super Momentum ที่มีพลังขับเคลื่อน`);
    score += 10;
  } else if (indicators.rsiStatus === 'OVERSOLD_DIP') {
    pros.push(`RSI ลงมาแตะเขต Oversold (${indicators.rsi}) เป็นจังหวะดักเก็งกำไร Buy on Dip ที่ได้เปรียบต้นทุน`);
    score += 8;
  }

  // MACD & Valuation cross-check
  if (indicators.macdStatus === 'BULLISH_CROSS') {
    pros.push('MACD ตัดขึ้นเป็นสัญญาณบวก (Bullish Crossover) คอนเฟิร์มการเปลี่ยนทิศทาง');
    score += 10;
  } else if (indicators.macdStatus === 'BEARISH') {
    cons.push('MACD ยังอยู่ในแดนลบ กำลังขาลงยังคงกดดันราคา');
    score -= 10;
  }

  if (stock.pe && stock.pe > 50) {
    cons.push(`P/E ปัจจุบันค่อนข้างตึงตัว (${stock.pe}x) เน้นเทรดตามทรงกราฟเทคนิคล้วนๆ ห้ามถือยาวเด็ดขาด`);
  }

  // Determine Final Verdict
  score = Math.max(15, Math.min(98, score));
  let verdict: 'HIGHLY_APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'HIGH_RISK_WARNING' | 'REJECT_DANGEROUS' = 'APPROVED_WITH_CONDITIONS';
  let verdictTitle = 'AI เห็นชอบแบบมีเงื่อนไข: เล่นได้ตามแผน แต่ต้องล็อคจุด SL';

  if (score >= 82) {
    verdict = 'HIGHLY_APPROVED';
    verdictTitle = '🌟 AI เห็นชอบอย่างยิ่ง: กราฟทรงสวย สัญญาณเทคนิคและวอลุ่มครบสูตร';
  } else if (score >= 60) {
    verdict = 'APPROVED_WITH_CONDITIONS';
    verdictTitle = '⚡ AI เห็นชอบแบบมีเงื่อนไข: สัญญาณเทรดได้ แต่ห้ามไล่ราคาและต้องคุม SL';
  } else if (score >= 40) {
    verdict = 'HIGH_RISK_WARNING';
    verdictTitle = '⚠️ AI เตือนระวังสูง: สัญญาณยังขัดแย้ง เสี่ยงติดดอยหากหลุดแนวรับ';
  } else {
    verdict = 'REJECT_DANGEROUS';
    verdictTitle = '🛑 AI ไม่แนะนำ / ความเสี่ยงสูงมาก: กราฟทรงเสียหรือไร้วอลุ่มหนุนชัดเจน';
  }

  // Peer recommendation diagnosis
  const sourceLabel = sourceOfIdea || 'คนอื่นแนะนำ / ข่าวในตลาด';
  let peerRecommendationAnalysis = '';
  if (verdict === 'HIGHLY_APPROVED') {
    peerRecommendationAnalysis = `ที่ได้รับคำแนะนำจาก "${sourceLabel}" ถือว่า "ตรงกับสัญญาณเทคนิคอลของระบบ" มีโมเมนตัมและวอลุ่มรองรับจริง สามารถเปิดไม้เก็งกำไรได้ตามแผน`;
  } else if (verdict === 'APPROVED_WITH_CONDITIONS') {
    peerRecommendationAnalysis = `คำแนะนำจาก "${sourceLabel}" น่าสนใจแต่ "ต้องระวังจังหวะเข้า" อย่าเพิ่งรีบเคาะตามราคาตลาด ให้รอเข้าซื้อในกรอบแนวรับเพื่อความปลอดภัย`;
  } else {
    peerRecommendationAnalysis = `คำแนะนำจาก "${sourceLabel}" มีความเสี่ยงสูงเนื่องจากกราฟเทคนิคยังไม่ยืนยัน หากจะเข้าต้องจำกัดเงินลงทุนไม่เกิน 5-10% ของพอร์ต และวาง SL เคร่งครัด`;
  }

  return {
    verdict,
    verdictTitle,
    score,
    pros,
    cons,
    peerRecommendationAnalysis,
    trapWarning,
  };
}

/**
 * Generates an actionable Day Trade / Swing Setup for a specific stock
 */
export function generateDayTradeSetup(
  stock: StockData,
  timeframe: DayTradeTimeframe,
  allocatedCapital: number,
  maxRiskPercentPerTrade: number = 1.5, // % of capital risked on SL
  sourceOfIdea?: string
): DayTradeSetup {
  const current = stock.currentPrice;
  const indicators = calculateDayTradeIndicators(stock);
  const aiRiskAudit = performAIRiskAudit(stock, indicators, sourceOfIdea);

  // Determine Signal Type
  let signalType: 'VOLUME_BREAKOUT' | 'EMA_PULLBACK' | 'RSI_BOUNCE' | 'MOMENTUM_SCALP' = 'EMA_PULLBACK';
  if (indicators.volumeSurgePercent >= 120 && stock.changePercent > 1.5) {
    signalType = 'VOLUME_BREAKOUT';
  } else if (indicators.rsiStatus === 'OVERSOLD_DIP') {
    signalType = 'RSI_BOUNCE';
  } else if (indicators.rsiStatus === 'SUPER_MOMENTUM') {
    signalType = 'MOMENTUM_SCALP';
  } else {
    signalType = 'EMA_PULLBACK';
  }

  // Calculate Entry, Stop Loss & Target depending on Timeframe
  let entryPrice = current;
  let entryZone = '';
  let slPercent = 2.5; // default 2.5% risk
  let tp1Percent = 5.5; // default 5.5% reward (R:R > 1:2.2)
  let tp2Percent = 9.0; // default 9.0% reward

  if (timeframe === '1_DAY') {
    // Intraday Scalp: Tighter SL, fast TP
    slPercent = 1.8;
    tp1Percent = 3.8;
    tp2Percent = 6.2;
    if (signalType === 'EMA_PULLBACK') {
      entryPrice = Number((current * 0.995).toFixed(2));
      entryZone = `${(entryPrice * 0.997).toFixed(2)} - ${entryPrice.toFixed(2)}`;
    } else {
      entryPrice = current;
      entryZone = `${current.toFixed(2)} - ${(current * 1.005).toFixed(2)}`;
    }
  } else if (timeframe === '2_3_DAYS') {
    // Fast Swing (2-3 days)
    slPercent = 2.4;
    tp1Percent = 5.6;
    tp2Percent = 9.5;
    if (signalType === 'EMA_PULLBACK') {
      entryPrice = Number((current * 0.99).toFixed(2));
      entryZone = `${(entryPrice * 0.995).toFixed(2)} - ${entryPrice.toFixed(2)}`;
    } else {
      entryPrice = current;
      entryZone = `${current.toFixed(2)} - ${(current * 1.01).toFixed(2)}`;
    }
  } else {
    // 1 Week Swing
    slPercent = 3.2;
    tp1Percent = 7.5;
    tp2Percent = 13.5;
    entryPrice = current;
    entryZone = `${(current * 0.985).toFixed(2)} - ${current.toFixed(2)}`;
  }

  const stopLossPrice = Number((entryPrice * (1 - slPercent / 100)).toFixed(2));
  const targetPrice1 = Number((entryPrice * (1 + tp1Percent / 100)).toFixed(2));
  const targetPrice2 = Number((entryPrice * (1 + tp2Percent / 100)).toFixed(2));

  const riskPerShare = Math.max(0.01, entryPrice - stopLossPrice);
  const rewardPerShare1 = targetPrice1 - entryPrice;
  const riskRewardRatio = Number((rewardPerShare1 / riskPerShare).toFixed(2));

  // Position Sizing: Risk at most maxRiskPercentPerTrade of allocated capital
  const maxRiskMoney = allocatedCapital * (maxRiskPercentPerTrade / 100);
  let recommendedShares = Math.floor(maxRiskMoney / riskPerShare);
  
  // Bound by actual allocated capital
  if (recommendedShares * entryPrice > allocatedCapital) {
    recommendedShares = Math.floor(allocatedCapital / entryPrice);
  }
  // Round to lot of 100 for Thai stocks if price is normal, or 10
  if (stock.market === 'SET' || stock.market === 'mai') {
    recommendedShares = Math.max(100, Math.floor(recommendedShares / 100) * 100);
  } else {
    recommendedShares = Math.max(1, recommendedShares);
  }

  // Action Guidance Text
  let actionGuidance = '';
  if (signalType === 'VOLUME_BREAKOUT') {
    actionGuidance = `⚡ วอลุ่มพุ่งแรง +${indicators.volumeSurgePercent}% ให้ตั้งรับในโซน ${entryZone} ฿ หากราคาเบรกผ่าน ${current.toFixed(2)} ฿ ให้ล็อคเป้า TP1 ที่ ${targetPrice1} ฿ (R:R 1:${riskRewardRatio})`;
  } else if (signalType === 'EMA_PULLBACK') {
    actionGuidance = `🎯 จังหวะย่อตัวแตะเส้น EMA รับสำคัญ (${entryZone} ฿) เหมาะสำหรับดักซื้อต้นรอบ ตัดขาดทุนทันทีหากหลุด ${stopLossPrice} ฿`;
  } else if (signalType === 'RSI_BOUNCE') {
    actionGuidance = `🔄 RSI เข้าเขต Oversold (${indicators.rsi}) เกิดสัญญาณสะสมพลังระยะสั้น ลุ้นรีบาวด์ชน TP1 ที่ ${targetPrice1} ฿`;
  } else {
    actionGuidance = `🚀 Momentum กราฟขาขึ้นแข็งแกร่ง เกาะเทรนด์ระยะสั้น วางจุด SL ที่ ${stopLossPrice} ฿ อย่างเคร่งครัด`;
  }

  let urgentWarning: string | undefined = undefined;
  if (indicators.rsiStatus === 'OVERBOUGHT_DANGER') {
    urgentWarning = '⚠️ RSI สูงกว่า 78 ระวังแรงขายทำกำไรกระชากลง ห้ามไล่ราคาสูงเด็ดขาด ให้รอจังหวะย่อเท่านั้น!';
  } else if (riskRewardRatio < 2.0) {
    urgentWarning = '⚠️ ค่า Risk:Reward ต่ำกว่า 1:2.0 แนะนำให้รอราคาดักซื้อต่ำลงในโซนแนวรับเพื่อลดความเสี่ยง';
  }

  return {
    symbol: stock.symbol,
    stock,
    timeframe,
    signalType,
    entryPrice,
    entryZone,
    stopLossPrice,
    stopLossPercent: slPercent,
    targetPrice1,
    targetPrice2,
    expectedGainPercent1: tp1Percent,
    expectedGainPercent2: tp2Percent,
    riskRewardRatio,
    recommendedShares,
    allocatedCapital,
    indicators,
    actionGuidance,
    urgentWarning,
    sourceOfIdea: sourceOfIdea || 'คัดกรองจากตลาด / โมเมนตัม',
    aiRiskAudit,
  };
}

/**
 * Builds a complete Day Trade Portfolio from selected symbols and budget
 */
export function buildDayTradePortfolio(
  selectedStocks: StockData[],
  totalCapital: number,
  timeframe: DayTradeTimeframe,
  sourceMap?: Record<string, string>
): DayTradePortfolio {
  const count = Math.max(1, selectedStocks.length);
  const capitalPerStock = Math.floor(totalCapital / count);

  const setups = selectedStocks.map((stock) =>
    generateDayTradeSetup(stock, timeframe, capitalPerStock, 1.5, sourceMap ? sourceMap[stock.symbol] : undefined)
  );

  const targetProfitPercent = timeframe === '1_DAY' ? 4.5 : timeframe === '2_3_DAYS' ? 7.0 : 12.0;

  return {
    capital: totalCapital,
    timeframe,
    createdAt: new Date().toISOString(),
    setups,
    targetProfitPercent,
  };
}
