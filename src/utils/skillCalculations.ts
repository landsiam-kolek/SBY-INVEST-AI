import { UserPosition, ClosedTrade, UserSkillMetrics, InvestorProfile } from '../types';

export function calculateUserPortfolioSummary(
  positions: UserPosition[],
  closedTrades: ClosedTrade[],
  investorProfile: InvestorProfile
) {
  const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
  const currentValue = positions.reduce(
    (sum, p) => sum + p.shares * (p.stockData.currentPrice || p.entryPrice),
    0
  );
  const unrealizedPnL = currentValue - totalCost;
  const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

  const totalRealizedPnL = closedTrades.reduce((sum, t) => sum + t.realizedPnL, 0);
  const totalNetPnL = unrealizedPnL + totalRealizedPnL;

  // Target profit goal based on capital & targetReturnPercent
  const targetProfitAmount = (investorProfile.capital * investorProfile.targetReturnPercent) / 100;
  const progressToTargetPercent = targetProfitAmount > 0 
    ? Math.min(100, Math.max(0, (totalNetPnL / targetProfitAmount) * 100))
    : 0;

  return {
    totalCost,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    totalRealizedPnL,
    totalNetPnL,
    targetProfitAmount,
    progressToTargetPercent,
  };
}

export function calculateUserSkillMetrics(
  positions: UserPosition[],
  closedTrades: ClosedTrade[],
  investorProfile: InvestorProfile
): UserSkillMetrics {
  const totalTrades = closedTrades.length;
  const openPositionsCount = positions.length;

  const winCount = closedTrades.filter((t) => t.isWin).length;
  const lossCount = closedTrades.filter((t) => !t.isWin).length;
  const winRate = totalTrades > 0 ? Number(((winCount / totalTrades) * 100).toFixed(1)) : 65.0; // default baseline

  const targetHitCount = closedTrades.filter((t) => t.exitReason === 'TARGET_HIT').length;
  const targetHitRate = totalTrades > 0 ? Number(((targetHitCount / totalTrades) * 100).toFixed(1)) : 60.0;

  // 1. Discipline Score:
  // - Stop Loss planning: Does every position have a Stop Loss set?
  let stopLossDefinedCount = 0;
  let totalRR = 0;
  let validRRCount = 0;

  positions.forEach((p) => {
    if (p.stopLossPrice > 0 && p.stopLossPrice < p.entryPrice) {
      stopLossDefinedCount++;
      const risk = p.entryPrice - p.stopLossPrice;
      const reward = p.targetPrice - p.entryPrice;
      if (risk > 0 && reward > 0) {
        totalRR += reward / risk;
        validRRCount++;
      }
    }
  });

  const stopLossCoverage = openPositionsCount > 0 ? stopLossDefinedCount / openPositionsCount : 1;
  const avgRiskRewardRatio = validRRCount > 0 ? Number((totalRR / validRRCount).toFixed(2)) : 2.4;

  // Discipline points:
  let disciplineScore = 40; // baseline
  if (stopLossCoverage >= 0.9) disciplineScore += 30;
  else if (stopLossCoverage >= 0.5) disciplineScore += 15;

  if (avgRiskRewardRatio >= 2.0) disciplineScore += 20;
  else if (avgRiskRewardRatio >= 1.5) disciplineScore += 10;

  if (totalTrades > 0) {
    const closedDisciplined = closedTrades.filter(
      (t) => t.exitReason === 'TARGET_HIT' || t.exitReason === 'STOP_LOSS'
    ).length;
    disciplineScore += Math.round((closedDisciplined / totalTrades) * 10);
  } else {
    disciplineScore += 10;
  }
  disciplineScore = Math.min(100, Math.max(20, disciplineScore));

  // 2. Diversification Score:
  let maxSingleWeight = 0;
  const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
  if (totalCost > 0) {
    positions.forEach((p) => {
      const weight = (p.totalCost / totalCost) * 100;
      if (weight > maxSingleWeight) maxSingleWeight = weight;
    });
  }

  let diversificationScore = 80;
  if (openPositionsCount === 0) diversificationScore = 70;
  else if (openPositionsCount >= 4 && maxSingleWeight <= 35) diversificationScore = 95;
  else if (openPositionsCount >= 3 && maxSingleWeight <= 45) diversificationScore = 80;
  else if (openPositionsCount >= 2) diversificationScore = 65;
  else diversificationScore = 45;

  // 3. Overall Skill Score
  const overallSkillScore = Math.round(
    disciplineScore * 0.4 +
    (Math.min(100, winRate * 1.1)) * 0.3 +
    diversificationScore * 0.2 +
    (Math.min(100, avgRiskRewardRatio * 35)) * 0.1
  );

  // 4. Skill Tier
  let skillTier: 1 | 2 | 3 | 4 = 1;
  let skillLevelTitle = 'ระดับ 1: ผู้เริ่มต้นวางแผน (Explorer)';
  if (overallSkillScore >= 85) {
    skillTier = 4;
    skillLevelTitle = 'ระดับ 4: ยอดฝีมือบริหารพอร์ต (Master Allocator)';
  } else if (overallSkillScore >= 70) {
    skillTier = 3;
    skillLevelTitle = 'ระดับ 3: นักลงทุนกลยุทธ์ชำนาญการ (Strategic Pro)';
  } else if (overallSkillScore >= 50) {
    skillTier = 2;
    skillLevelTitle = 'ระดับ 2: เทรดเดอร์มีวินัยคุมความเสี่ยง (Disciplined Trader)';
  }

  // Strengths & Growth Areas
  const strengths: string[] = [];
  const growthAreas: string[] = [];

  if (avgRiskRewardRatio >= 2.0) {
    strengths.push(`อัตราส่วนกำไรต่อความเสี่ยงเฉลี่ยสูง (R:R 1:${avgRiskRewardRatio}) ได้เปรียบระยะยาว`);
  }
  if (stopLossCoverage >= 0.8) {
    strengths.push('มีการวางจุด Stop Loss ป้องกันความเสี่ยงชัดเจนในเกือบทุกตัว');
  }
  if (diversificationScore >= 80) {
    strengths.push('การกระจายน้ำหนักหุ้นในพอร์ตมีความสมดุล ไม่กระจุกตัวเกินไป');
  }
  if (winRate >= 60) {
    strengths.push(`อัตราการเทรดชนะสูงถึง ${winRate}% สะท้อนการจับจังหวะที่ดี`);
  }

  if (strengths.length === 0) {
    strengths.push('มีความตั้งใจในการบันทึกและติดตามผลการลงทุนอย่างเป็นระบบ');
  }

  if (stopLossCoverage < 0.8) {
    growthAreas.push('ควรกำหนดจุดตัดขาดทุน (Stop Loss) ให้ครบทุกไม้เพื่อรักษาเงินต้นอย่างเคร่งครัด');
  }
  if (maxSingleWeight > 40) {
    growthAreas.push(`มีการถือหุ้นตัวเดียวกระจุกตัวถึง ${maxSingleWeight.toFixed(1)}% ของพอร์ต เสี่ยงต่อความผันผวน`);
  }
  if (avgRiskRewardRatio < 1.8) {
    growthAreas.push('ควรคัดเลือกหุ้นที่มีเป้าหมายกำไรอย่างน้อย 2 เท่าของความเสี่ยง (R:R > 1:2.0)');
  }
  if (openPositionsCount < 3) {
    growthAreas.push('แนะนำให้ถือสินทรัพย์ 3-6 ตัว เพื่อกระจายความเสี่ยงข้ามกลุ่มอุตสาหกรรม');
  }

  if (growthAreas.length === 0) {
    growthAreas.push('รักษาวินัยตามแผนอย่างสม่ำเสมอ และประเมินการ Rebalance พอร์ตทุกๆ ไตรมาส');
  }

  // AI Coach personalized advice
  const aiCoachAdvice = `ภาพรวมพอร์ตของคุณอยู่ในระดับ ${skillLevelTitle} (คะแนนรวม ${overallSkillScore}/100) จุดแข็งของคุณคือ ${strengths[0]} โดยคำแนะนำสำคัญในรอบนี้คือ "${growthAreas[0]}" เพื่อช่วยให้พอร์ตเติบโตอย่างมั่นคงและบรรลุเป้าหมายผลตอบแทน +${investorProfile.targetReturnPercent}% ต่อปี`;

  return {
    totalTrades,
    openPositionsCount,
    winCount,
    lossCount,
    winRate,
    targetHitCount,
    targetHitRate,
    disciplineScore,
    avgRiskRewardRatio,
    overallSkillScore,
    skillLevelTitle,
    skillTier,
    diversificationScore,
    strengths,
    growthAreas,
    aiCoachAdvice,
  };
}

export function getPeriodDurationDays(period: string): { totalDays: number; label: string } {
  switch (period) {
    case '1_3_MONTHS':
      return { totalDays: 90, label: '1 - 3 เดือน (Short-term Tactical)' };
    case '3_6_MONTHS':
      return { totalDays: 180, label: '3 - 6 เดือน (Medium-term Swing)' };
    case '6_12_MONTHS':
      return { totalDays: 365, label: '6 - 12 เดือน (Strategic Horizon)' };
    case '1_3_YEARS':
      return { totalDays: 730, label: '1 - 3 ปี (Long-term Compounder)' };
    default:
      return { totalDays: 180, label: '3 - 6 เดือน (Medium-term)' };
  }
}

export function calculatePeriodCompletionKPIs(
  positions: UserPosition[],
  closedTrades: ClosedTrade[],
  investorProfile: InvestorProfile,
  startDateStr: string = '2025-01-01'
) {
  const periodMeta = getPeriodDurationDays(investorProfile.period);
  const startDate = new Date(startDateStr);
  const now = new Date();
  
  // Calculate end date based on period duration
  const endDate = new Date(startDate.getTime() + periodMeta.totalDays * 24 * 60 * 60 * 1000);
  
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const daysElapsed = Math.min(periodMeta.totalDays, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, periodMeta.totalDays - daysElapsed);
  const progressPercent = Number(((daysElapsed / periodMeta.totalDays) * 100).toFixed(1));
  const isPeriodEnded = daysRemaining === 0;

  const summary = calculateUserPortfolioSummary(positions, closedTrades, investorProfile);
  const skill = calculateUserSkillMetrics(positions, closedTrades, investorProfile);

  const currentReturnPercent = investorProfile.capital > 0 
    ? (summary.totalNetPnL / investorProfile.capital) * 100
    : 0;

  // Calculate Weighted Margin of Safety and Sharpe Ratio approximation
  let totalMOS = 0;
  let totalMOSWeight = 0;
  let expectedTargetWeightedSum = 0;

  positions.forEach((p) => {
    const cost = p.totalCost;
    if (cost > 0) {
      const mos = p.stockData?.marginOfSafety || 10;
      totalMOS += mos * cost;
      totalMOSWeight += cost;
      
      const targetGainPct = p.entryPrice > 0 ? ((p.targetPrice - p.entryPrice) / p.entryPrice) * 100 : 15;
      expectedTargetWeightedSum += targetGainPct * cost;
    }
  });

  const averageMarginOfSafety = totalMOSWeight > 0 ? Number((totalMOS / totalMOSWeight).toFixed(1)) : 14.5;
  const weightedTargetReturn = totalMOSWeight > 0 ? Number((expectedTargetWeightedSum / totalMOSWeight).toFixed(1)) : investorProfile.targetReturnPercent;

  // Trajectory projection
  const paceRatio = daysElapsed > 0 ? (currentReturnPercent / Math.max(1, (daysElapsed / periodMeta.totalDays) * investorProfile.targetReturnPercent)) : 1.0;
  const projectedEndReturn = Number(
    Math.min(
      investorProfile.targetReturnPercent * 2,
      Math.max(-20, (currentReturnPercent + (investorProfile.targetReturnPercent * (daysRemaining / periodMeta.totalDays) * Math.min(1.3, Math.max(0.7, paceRatio)))))
    ).toFixed(1)
  );

  const projectedEndValue = Math.round(investorProfile.capital * (1 + projectedEndReturn / 100));
  const targetAchievementRate = investorProfile.targetReturnPercent > 0 
    ? Math.min(100, Math.max(0, Number(((currentReturnPercent / investorProfile.targetReturnPercent) * 100).toFixed(1))))
    : 0;

  // Sharpe Ratio estimation (assuming risk free rate = 2.5%, portfolio volatility ~ 12%)
  const excessReturn = currentReturnPercent - 2.5;
  const sharpeRatio = Number((excessReturn / 11.5).toFixed(2));
  const calmarRatio = Number((Math.max(0, currentReturnPercent) / 8.5).toFixed(2));
  const estimatedMaxDrawdown = Number((skill.disciplineScore > 75 ? 6.5 : skill.disciplineScore > 50 ? 11.2 : 16.8).toFixed(1));
  const portfolioBeta = Number((0.90 + Math.min(0.20, positions.length * 0.02)).toFixed(2));

  // Milestone Grade
  let milestoneGrade = 'B+';
  if (targetAchievementRate >= 90 && skill.overallSkillScore >= 80) milestoneGrade = 'A+';
  else if (targetAchievementRate >= 75 || skill.overallSkillScore >= 75) milestoneGrade = 'A';
  else if (targetAchievementRate >= 50) milestoneGrade = 'B+';
  else if (targetAchievementRate >= 30) milestoneGrade = 'B';
  else milestoneGrade = 'C';

  // Stress Test
  const bullCaseReturn = Number((weightedTargetReturn * 1.25).toFixed(1));
  const bullCaseValue = Math.round(investorProfile.capital * (1 + bullCaseReturn / 100));
  
  const baseCaseReturn = Number(investorProfile.targetReturnPercent.toFixed(1));
  const baseCaseValue = Math.round(investorProfile.capital * (1 + baseCaseReturn / 100));

  // Bear case limited by Stop Loss discipline
  const bearCaseReturn = Number((-estimatedMaxDrawdown).toFixed(1));
  const bearCaseValue = Math.round(investorProfile.capital * (1 + bearCaseReturn / 100));

  return {
    periodLabel: periodMeta.label,
    startDate: startDateStr,
    endDate: endDate.toISOString().split('T')[0],
    totalDays: periodMeta.totalDays,
    daysElapsed,
    daysRemaining,
    progressPercent,
    isPeriodEnded,
    targetReturnPercent: investorProfile.targetReturnPercent,
    targetProfitAmount: summary.targetProfitAmount,
    currentReturnPercent: Number(currentReturnPercent.toFixed(2)),
    currentNetPnL: summary.totalNetPnL,
    projectedEndReturn,
    projectedEndValue,
    targetAchievementRate,
    sharpeRatio,
    calmarRatio,
    estimatedMaxDrawdown,
    portfolioBeta,
    averageMarginOfSafety,
    winRate: skill.winRate,
    disciplineScore: skill.disciplineScore,
    milestoneGrade,
    stressTest: {
      bullCaseReturn,
      bullCaseValue,
      baseCaseReturn,
      baseCaseValue,
      bearCaseReturn,
      bearCaseValue,
    },
  };
}

export function generateAlgorithmicUserAudit(
  positions: UserPosition[],
  closedTrades: ClosedTrade[],
  investorProfile: InvestorProfile,
  summary: any,
  periodKPIs: any
) {
  const skill = calculateUserSkillMetrics(positions, closedTrades, investorProfile);
  
  let grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' = 'B+';
  let score = 78;

  if (skill.overallSkillScore >= 85 && periodKPIs.targetAchievementRate >= 60) {
    grade = 'A+';
    score = 92;
  } else if (skill.overallSkillScore >= 75) {
    grade = 'A';
    score = 85;
  } else if (skill.overallSkillScore >= 60) {
    grade = 'B+';
    score = 78;
  } else if (skill.overallSkillScore >= 45) {
    grade = 'B';
    score = 65;
  } else {
    grade = 'C';
    score = 52;
  }

  const assetCritiques = positions.map((p) => {
    const currentP = p.stockData?.currentPrice || p.entryPrice;
    const gainPct = p.entryPrice > 0 ? ((currentP - p.entryPrice) / p.entryPrice) * 100 : 0;
    const mos = p.stockData?.marginOfSafety || 0;
    
    let status: 'STAR_ASSET' | 'SOLID_CORE' | 'MONITOR_CLOSELY' | 'HIGH_RISK' = 'SOLID_CORE';
    let verdict = `${p.symbol}: โครงสร้างราคาและงบการเงินมีเสถียรภาพ สอดคล้องกับกลยุทธ์ ${p.strategyTag}`;

    if (gainPct > 8 || mos > 20) {
      status = 'STAR_ASSET';
      verdict = `${p.symbol}: ผลการดำเนินงานแข็งแกร่ง มี Margin of Safety +${mos}% และทำกำไรขับเคลื่อนพอร์ตได้ดีเยี่ยม`;
    } else if (gainPct < -5 || !p.stopLossPrice) {
      status = 'HIGH_RISK';
      verdict = `${p.symbol}: ราคากำลังทดสอบแนวรับสำคัญ ควรเฝ้าระวังจุด Stop Loss ที่ ${p.stopLossPrice || 'ยังไม่ได้ตั้ง'} เพื่อป้องกันเงินต้น`;
    } else if (p.stockData?.rsi && p.stockData.rsi > 70) {
      status = 'MONITOR_CLOSELY';
      verdict = `${p.symbol}: โมเมนตัมขึ้นแรงแต่เริ่มเข้าโซน Overbought ใกล้แนวต้าน ${p.targetPrice} แนะนำพิจารณาแบ่งล็อกกำไรบางส่วน`;
    }

    return {
      symbol: p.symbol,
      status,
      verdict,
    };
  });

  return {
    grade,
    score,
    executiveVerdict: `พอร์ตการลงทุนที่ท่านจัดสรรเองสะท้อนความตั้งใจและมีโครงสร้างที่ชัดเจน ได้รับคะแนนประเมิน ${score}/100 (ระดับเกรด ${grade}) โดยสามารถรักษาสมดุลระหว่างการสร้างกระแสเงินสดและโอกาสการเติบโตตามเป้าหมายผลตอบแทน +${investorProfile.targetReturnPercent}% ในกรอบเวลา ${periodKPIs.periodLabel}`,
    goalAlignmentAnalysis: `เทียบกับเงินลงทุนเป้าหมาย ${investorProfile.capital.toLocaleString()} ${investorProfile.currency} และเป้าผลตอบแทน +${investorProfile.targetReturnPercent}% พอร์ตปัจจุบันสร้างผลตอบแทนสุทธิแล้ว ${summary.totalNetPnL >= 0 ? '+' : ''}${summary.totalNetPnL.toLocaleString()} ${investorProfile.currency} คิดเป็นอัตราความสำเร็จ ${periodKPIs.targetAchievementRate}% ในช่วงเวลาที่ผ่านมา ${periodKPIs.daysElapsed}/${periodKPIs.totalDays} วันของ Period`,
    strengths: [
      `มีการคัดเลือกหุ้นที่มีพื้นฐานรองรับและกำหนดเป้าหมายราคาชัดเจน`,
      `อัตราส่วน Risk-Reward เฉลี่ย 1:${skill.avgRiskRewardRatio} สร้างความได้เปรียบทางสถิติในระยะยาว`,
      `ส่วนเผื่อเพื่อความปลอดภัยเฉลี่ย (Average Margin of Safety) อยู่ที่ ${periodKPIs.averageMarginOfSafety}%`,
    ],
    risksAndBlindspots: [
      positions.length < 3 ? `พอร์ตถือสินทรัพย์เพียง ${positions.length} ตัว ควรพิจารณากระจายความเสี่ยงเพิ่มเป็น 3-5 ตัว` : `ควรหมั่นตรวจสอบงบการเงินไตรมาสล่าสุดของหุ้นกลุ่มหลัก`,
      `หากตลาดเกิดความผันผวนฉับพลัน ให้ปฏิบัติตามจุด Stop Loss ที่กำหนดไว้อย่างเคร่งครัด`,
    ],
    assetCritiques,
    actionableOptimization: [
      `ตั้งจุด Trailing Stop ขยับตามราคาขึ้นมาสำหรับหุ้นที่กำไรเกิน +8% เพื่อล็อกผลตอบแทน`,
      `คงสัดส่วนเงินสดสำรอง 10-20% ไว้สำหรับจังหวะ Buy on Dip เมื่อหุ้นเป้าหมายย่อตัวลงมาแตะแนวรับ`,
      `ติดตามตัวชี้วัด Milestone เมื่อครบ Period เพื่อทำการ Rebalance สัดส่วนกลับสู่จุดสมดุล`,
    ],
    periodCompletionForecast: {
      probabilityOfTargetHit: Math.min(92, Math.max(50, Math.round(periodKPIs.targetAchievementRate * 0.7 + skill.disciplineScore * 0.3))),
      projectedEndReturnPercent: periodKPIs.projectedEndReturn,
      projectedEndValue: periodKPIs.projectedEndValue,
      periodMilestoneAdvice: `เมื่อครบกำหนดระยะเวลา ${periodKPIs.periodLabel} แนะนำให้ตรวจทานผลตอบแทนจริงเทียบกับเป้าหมาย +${investorProfile.targetReturnPercent}% หากแตะเป้าหมายแล้ว ให้พิจารณาเก็บเกี่ยวผลกำไรและจัดสรรพอร์ตรอบใหม่`,
    },
    auditedAt: new Date().toISOString(),
  };
}

