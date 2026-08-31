import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint: Deep Stock Analysis using Gemini
app.post("/api/analyze-stock", async (req, res) => {
  try {
    const { stockData, customPrompt } = req.body;

    if (!stockData) {
      return res.status(400).json({ error: "Missing stock data" });
    }

    const prompt = `
You are the Chief Investment Officer & Senior Technical Quantitative Strategist at "SBY Invest AI".
Analyze the following stock combining Fundamental Analysis (What to Buy) and Technical Trading (When & How to Trade).

Stock Information:
- Symbol: ${stockData.symbol} (${stockData.name})
- Market / Sector: ${stockData.market} / ${stockData.sector}
- Current Price: ${stockData.currentPrice} ${stockData.currency}
- Fundamental Metrics:
  * P/E Ratio: ${stockData.pe} (Industry Avg: ${stockData.industryPe || "N/A"})
  * P/BV: ${stockData.pbv}
  * ROE: ${stockData.roe}%
  * Dividend Yield: ${stockData.dividendYield}%
  * Debt to Equity (D/E): ${stockData.de}
  * Net Profit Margin: ${stockData.netMargin}%
  * Revenue Growth (YoY): ${stockData.revenueGrowth}%
  * Estimated Fair Value: ${stockData.fairValue} ${stockData.currency} (Margin of Safety: ${stockData.marginOfSafety}%)
- Technical Metrics:
  * Trend: ${stockData.trend} (Price vs EMA20: ${stockData.ema20}, EMA50: ${stockData.ema50}, EMA200: ${stockData.ema200})
  * RSI (14): ${stockData.rsi}
  * MACD Signal: ${stockData.macdSignal}
  * Key Support: S1 ${stockData.support1}, S2 ${stockData.support2}
  * Key Resistance: R1 ${stockData.resistance1}, R2 ${stockData.resistance2}
  * Current Technical Signal: ${stockData.technicalSignal}

User query / extra context: ${customPrompt || "Generate a comprehensive SBY Invest AI Report."}

Provide a structured Thai response with:
1. **Fundamental Executive Verdict** (ประเมินคุณภาพธุรกิจ, ความถูกแพง, และความยั่งยืนของกำไร/เงินปันผล)
2. **Technical Timing & Action Plan** (จังหวะเข้าซื้อ/รอ/ขาย, แนวรับแนวต้านสำคัญ, เงื่อนไขยืนยัน Trigger)
3. **Risk Management & Position Sizing Strategy** (จุด Stop Loss, อัตรา Risk/Reward, การแบ่งไม้ซื้อ)
4. **Key Catalysts & Watchouts** (ปัจจัยบวกที่จะผลักดันราคา และความเสี่ยงที่ต้องเฝ้าระวัง)
5. **Final SBY Invest AI Rating**: (STRONG BUY, ACCUMULATE, WAIT/WATCH, TAKE PROFIT, or STOP LOSS) with 1-sentence bottom-line advice.

Keep the tone professional, objective, highly analytical, actionable, and encouraging for smart investors. Use clear formatting with bullet points.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are SBY Invest AI - an expert investment analyst specializing in combining Fundamental Valuation and Technical Timing into practical, high-conviction trade setups for Thai and Global stock investors. Always respond in fluent, professional Thai.",
        temperature: 0.7,
      },
    });

    const analysisText = response.text || "ไม่สามารถสร้างบทวิเคราะห์ได้ในขณะนี้";
    return res.json({ success: true, analysis: analysisText });
  } catch (error: any) {
    console.error("Error in /api/analyze-stock:", error);
    return res.status(500).json({
      error: "AI Analysis failed",
      details: error?.message || "Unknown error",
    });
  }
});

// Endpoint: AI Advisor Interactive Chat
app.post("/api/chat-advisor", async (req, res) => {
  try {
    const { messages, currentStock } = req.body;

    const stockContext = currentStock
      ? `Current Stock in Context: ${currentStock.symbol} (${currentStock.name}), Price: ${currentStock.currentPrice} ${currentStock.currency}, PE: ${currentStock.pe}, ROE: ${currentStock.roe}%, Dividend: ${currentStock.dividendYield}%, Trend: ${currentStock.trend}, RSI: ${currentStock.rsi}, Fair Value: ${currentStock.fairValue}.`
      : "General Investment Inquiries";

    const lastMessage = messages[messages.length - 1]?.content || "สวัสดีครับ";

    const conversationHistory = messages
      .slice(0, -1)
      .map((m: any) => `${m.role === "user" ? "User" : "SBY AI"}: ${m.content}`)
      .join("\n");

    const prompt = `
Context:
${stockContext}

Conversation History:
${conversationHistory}

User's Latest Question:
${lastMessage}

Please answer clearly and concisely in Thai, providing concrete numerical levels, strategic fundamental insights, and actionable trading rules wherever applicable.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are SBY Invest AI Advisor. Answer investor queries with high financial precision, combining fundamental logic (value/earnings quality) and technical discipline (support/resistance/risk-reward). Always respond in polite, expert Thai.",
        temperature: 0.6,
      },
    });

    return res.json({
      success: true,
      reply: response.text || "ขออภัยครับ ระบบไม่สามารถประมวลผลคำตอบได้",
    });
  } catch (error: any) {
    console.error("Error in /api/chat-advisor:", error);
    return res.status(500).json({
      error: "Chat failed",
      details: error?.message || "Unknown error",
    });
  }
});

// Endpoint: Custom Stock Lookup & Dynamic Synthesis
app.post("/api/custom-stock-lookup", async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) {
      return res.status(400).json({ error: "Missing ticker" });
    }

    const prompt = `
Generate a realistic, comprehensive investment profile for the stock ticker: "${ticker}".
Return ONLY a valid JSON object matching this schema (no markdown fences, just pure JSON):

{
  "symbol": "${ticker.toUpperCase()}",
  "name": "Full Company Name in Thai or English",
  "market": "SET / mai / US / Global",
  "sector": "Industry Sector",
  "currency": "THB or USD",
  "currentPrice": 45.50,
  "change": 1.25,
  "changePercent": 2.82,
  "high52w": 52.00,
  "low52w": 38.00,
  "pe": 16.5,
  "industryPe": 18.0,
  "pbv": 2.1,
  "roe": 14.8,
  "dividendYield": 4.2,
  "de": 0.85,
  "netMargin": 12.4,
  "revenueGrowth": 8.5,
  "fairValue": 50.00,
  "marginOfSafety": 9.89,
  "valuationStatus": "UNDERVALUED", // UNDERVALUED | FAIR | OVERVALUED
  "fundamentalScore": 82, // 0 - 100
  "technicalScore": 78, // 0 - 100
  "compositeRating": "BUY", // STRONG_BUY | BUY | ACCUMULATE | WAIT | TAKE_PROFIT | STOP_LOSS
  "trend": "UPTREND", // UPTREND | DOWNTREND | SIDEWAY
  "rsi": 58.4,
  "macdSignal": "BULLISH_CROSSOVER", // BULLISH_CROSSOVER | BEARISH_CROSSOVER | NEUTRAL
  "ema20": 44.20,
  "ema50": 42.80,
  "ema200": 40.50,
  "support1": 43.50,
  "support2": 42.00,
  "resistance1": 48.00,
  "resistance2": 52.00,
  "stopLossPrice": 42.00,
  "targetPrice1": 48.00,
  "targetPrice2": 52.00,
  "technicalSignal": "BUY_ON_DIP", // STRONG_BUY | BUY_BREAKOUT | BUY_ON_DIP | ACCUMULATE | WAIT | TAKE_PROFIT | STOP_LOSS
  "businessDescription": "Brief description of the business in Thai",
  "strengths": ["Strength 1 in Thai", "Strength 2 in Thai", "Strength 3 in Thai"],
  "risks": ["Risk 1 in Thai", "Risk 2 in Thai", "Risk 3 in Thai"],
  "actionPlanSummary": "1-2 sentence actionable summary in Thai"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, stock: parsed });
  } catch (error: any) {
    console.error("Error in /api/custom-stock-lookup:", error);
    return res.status(500).json({
      error: "Stock lookup failed",
      details: error?.message || "Unknown error",
    });
  }
});

// Endpoint: AI Portfolio Strategy & Advisory Commentary
app.post("/api/generate-ai-portfolio", async (req, res) => {
  try {
    const { investorProfile, selectedStocks } = req.body;

    const prompt = `
You are the Chief Investment Officer (CIO) and Senior Portfolio Strategist at "SBY Invest AI".
An investor has requested an AI-driven personalized investment portfolio with the following parameters:

Investor Profile:
- Total Capital: ${investorProfile.capital.toLocaleString()} ${investorProfile.currency}
- Target Annual Return: ${investorProfile.targetReturnPercent}%
- Risk Profile: ${investorProfile.riskProfile} (Conservative / Moderate / Aggressive)
- Investment Horizon / Period: ${investorProfile.period} (e.g. 1-3 Months, 3-6 Months, 6-12 Months, 1-3 Years)
- Investment Objective: ${investorProfile.objective}
- Preferred Board: ${investorProfile.preferredBoard}

Allocated Assets (5 to 8 Assets):
${selectedStocks
  .map(
    (s: any, idx: number) =>
      `${idx + 1}. ${s.symbol} (${s.name}) - Weight: ${s.weightPercent}%, Price: ${s.entryPrice}, Target: ${s.targetPrice}, StopLoss: ${s.stopLossPrice}, Role: ${s.roleInPortfolio}, MOS: ${s.stock?.marginOfSafety}%`
  )
  .join("\n")}

Provide a high-conviction, professional investment strategy summary in Thai covering:
1. **บทสรุปเชิงกลยุทธ์ของพอร์ต (Strategic Executive Summary)**: ทำไมการจัดสรรสินทรัพย์ 5-8 ตัวนี้จึงตอบโจทย์ทั้งเงินทุน เป้าหมายกำไร ${investorProfile.targetReturnPercent}% และระดับความเสี่ยงนี้
2. **คู่มือการเฝ้าติดตามตาม Period (Period-Specific Monitoring Tactics)**: สิ่งที่นักลงทุนต้องจับตาดูตลอดระยะเวลาที่ลงทุน (เช่น จุด Trailing Stop, การประกาศงบการเงิน, การ Rebalance เมื่อราคาแตะเป้าหมาย)
3. **เกราะป้องกันความเสี่ยง (Risk Mitigation & Asset Protection)**: แผนรับมือหากตลาดเกิดความผันผวนหรือปรับฐานฉับพลัน

Keep the tone encouraging, authoritative, disciplined, and institutional-grade. Output clear markdown.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are SBY Invest AI - Chief Investment Strategist. Deliver concise, actionable, and mathematically grounded portfolio advice for Thai and Global investors in Thai language.",
        temperature: 0.6,
      },
    });

    return res.json({
      success: true,
      commentary: response.text || "ระบบจัดสรรพอร์ตเสร็จสมบูรณ์",
    });
  } catch (error: any) {
    console.error("Error in /api/generate-ai-portfolio:", error);
    return res.status(500).json({
      error: "Portfolio generation failed",
      details: error?.message || "Unknown error",
    });
  }
});

// Endpoint: AI Master Analyst Audit & Critique for User-Managed Portfolio
app.post("/api/audit-user-portfolio", async (req, res) => {
  try {
    const { investorProfile, positions, summary, periodInfo } = req.body;

    if (!positions || positions.length === 0) {
      return res.status(400).json({ error: "No positions in portfolio to analyze" });
    }

    const positionsFormatted = positions.map((p: any, idx: number) => {
      const currentP = p.stockData?.currentPrice || p.entryPrice;
      const val = p.shares * currentP;
      const weight = summary.currentValue > 0 ? ((val / summary.currentValue) * 100).toFixed(1) : "0";
      const pnlPct = p.entryPrice > 0 ? (((currentP - p.entryPrice) / p.entryPrice) * 100).toFixed(2) : "0";
      const mos = p.stockData?.marginOfSafety ?? "N/A";
      const pe = p.stockData?.pe ?? "N/A";
      const rsi = p.stockData?.rsi ?? "N/A";
      const trend = p.stockData?.trend ?? "N/A";
      return `${idx + 1}. [${p.symbol}] ${p.stockData?.name || ""} (${p.stockData?.sector || "Sector N/A"})
   - Weight: ${weight}% | Entry: ${p.entryPrice} | Market: ${currentP} | P&L: ${pnlPct}%
   - Strategy: ${p.strategyTag} | Target: ${p.targetPrice} | StopLoss: ${p.stopLossPrice}
   - P/E: ${pe} | Margin of Safety: ${mos}% | RSI: ${rsi} | Trend: ${trend}
   - User Thesis: "${p.thesisNotes || "ไม่มีบันทึก"}"`;
    }).join("\n\n");

    const prompt = `
You are the Chief Investment Officer (CIO) and Master Quantitative Portfolio Analyst at "SBY Invest AI".
An investor has built and managed their OWN investment portfolio and requested a deep, elite-level audit and critique from you.

=== INVESTOR PROFILE & GOALS (เกณฑ์การลงทุนเดียวกัน) ===
- Total Allocated Capital: ${investorProfile.capital.toLocaleString()} ${investorProfile.currency}
- Target Annual Return: +${investorProfile.targetReturnPercent}%
- Stated Risk Profile: ${investorProfile.riskProfile}
- Stated Investment Period: ${investorProfile.period} (${periodInfo?.label || "6-12 เดือน"})
- Days Elapsed in Period: ${periodInfo?.daysElapsed || 0} / ${periodInfo?.totalDays || 180} วัน (${periodInfo?.progressPercent || 0}% ของ Period)
- Investment Objective: ${investorProfile.objective}

=== PORTFOLIO CURRENT METRICS ===
- Total Capital Invested: ${summary.totalCost?.toLocaleString()} ${investorProfile.currency}
- Current Portfolio Value: ${summary.currentValue?.toLocaleString()} ${investorProfile.currency}
- Unrealized P&L: ${summary.unrealizedPnL >= 0 ? "+" : ""}${summary.unrealizedPnL?.toLocaleString()} (${summary.unrealizedPnLPercent?.toFixed(2)}%)
- Target Profit Goal: +${summary.targetProfitAmount?.toLocaleString()} ${investorProfile.currency}
- Progress to Target: ${summary.progressToTargetPercent?.toFixed(1)}%
- Number of Assets: ${positions.length}

=== USER'S ASSET ALLOCATION & POSITIONS ===
${positionsFormatted}

Evaluate this user-built portfolio with sharp, analytical, institutional-grade rigor.
Return ONLY a valid JSON object matching the following structure (no markdown fences, pure JSON):

{
  "grade": "A" or "A+" or "B+" or "B" or "C" or "D",
  "score": 85, // integer 0 - 100
  "executiveVerdict": "บทวิเคราะห์ภาพรวมระดับผู้บริหาร CIO ในภาษาไทย 3-4 ประโยค คมชัด ตรงประเด็น ให้ความเห็นถึงโครงสร้างและคุณภาพของพอร์ตที่ผู้ใช้จัดเอง",
  "goalAlignmentAnalysis": "วิเคราะห์เจาะลึกว่าพอร์ตนี้สอดคล้องกับเงินทุน ${investorProfile.capital.toLocaleString()} และเป้าหมายกำไร +${investorProfile.targetReturnPercent}% ในกรอบเวลา ${periodInfo?.label || "Period ที่กำหนด"} เพียงใด พร้อมประเมินความเป็นไปได้ในการบรรลุเป้าหมาย",
  "strengths": [
    "จุดแข็งที่โดดเด่นข้อที่ 1 (ภาษาไทย)",
    "จุดแข็งที่โดดเด่นข้อที่ 2 (ภาษาไทย)",
    "จุดแข็งที่โดดเด่นข้อที่ 3 (ภาษาไทย)"
  ],
  "risksAndBlindspots": [
    "ความเสี่ยงหรือจุดบอดสำคัญข้อที่ 1 เช่น การกระจุกตัว หรือการขาด Stop Loss (ภาษาไทย)",
    "ความเสี่ยงข้อที่ 2 (ภาษาไทย)"
  ],
  "assetCritiques": [
    {
      "symbol": "TICKER",
      "status": "STAR_ASSET" or "SOLID_CORE" or "MONITOR_CLOSELY" or "HIGH_RISK",
      "verdict": "ความเห็นแบบเจาะลึก 1-2 ประโยคสำหรับสินทรัพย์นี้ ทั้งมิติมูลค่าและกราฟเทคนิค"
    }
  ],
  "actionableOptimization": [
    "คำแนะนำปรับพอร์ตข้อที่ 1 เช่น การ Rebalance หรือการตั้งจุดล็อกกำไร Trailing Stop (ภาษาไทย)",
    "คำแนะนำปรับพอร์ตข้อที่ 2 (ภาษาไทย)",
    "คำแนะนำปรับพอร์ตข้อที่ 3 (ภาษาไทย)"
  ],
  "periodCompletionForecast": {
    "probabilityOfTargetHit": 78, // percentage 0-100
    "projectedEndReturnPercent": 19.5, // % estimated at end of period
    "projectedEndValue": 239000,
    "periodMilestoneAdvice": "คำแนะนำพิเศษเมื่อพอร์ตเดินทางมาถึงช่วงเวลานี้ และสิ่งสำคัญที่ต้องทำเมื่อครบกำหนด Period"
  }
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, audit: parsed });
  } catch (error: any) {
    console.error("Error in /api/audit-user-portfolio:", error);
    return res.status(500).json({
      error: "User portfolio audit failed",
      details: error?.message || "Unknown error",
    });
  }
});

// Vite middleware setup

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SBY Invest AI Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
