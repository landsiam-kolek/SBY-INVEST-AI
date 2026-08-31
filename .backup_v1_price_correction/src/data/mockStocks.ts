import { StockData, PriceCandle, MarketType, AssetCategory } from '../types';

// Helper to generate realistic candlestick series
function generateCandles(
  basePrice: number,
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAY',
  volatility: number = 0.015,
  count: number = 50,
  decimals: number = 2
): PriceCandle[] {
  const candles: PriceCandle[] = [];
  let price = basePrice * (trend === 'UPTREND' ? 0.85 : trend === 'DOWNTREND' ? 1.15 : 0.98);
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    let bias = 0;
    if (trend === 'UPTREND') bias = 0.003;
    else if (trend === 'DOWNTREND') bias = -0.003;
    else bias = (Math.random() - 0.5) * 0.002;

    const change = price * (bias + (Math.random() - 0.48) * volatility);
    const open = Number((price).toFixed(decimals));
    const close = Number((price + change).toFixed(decimals));
    const high = Number((Math.max(open, close) + price * Math.random() * 0.008).toFixed(decimals));
    const low = Number((Math.min(open, close) - price * Math.random() * 0.008).toFixed(decimals));
    const volume = Math.floor(2000000 + Math.random() * 5000000);

    candles.push({
      date: dateStr,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  // Calculate EMA 20, 50, 200 & RSI
  const k20 = 2 / (20 + 1);
  const k50 = 2 / (50 + 1);
  let ema20 = candles[0].close;
  let ema50 = candles[0].close;

  for (let i = 0; i < candles.length; i++) {
    ema20 = candles[i].close * k20 + ema20 * (1 - k20);
    ema50 = candles[i].close * k50 + ema50 * (1 - k50);
    candles[i].ema20 = Number(ema20.toFixed(decimals));
    candles[i].ema50 = Number(ema50.toFixed(decimals));
    candles[i].ema200 = Number((candles[i].close * 0.95).toFixed(decimals));

    // Basic RSI calculation
    if (i >= 14) {
      let gains = 0;
      let losses = 0;
      for (let j = i - 13; j <= i; j++) {
        const diff = candles[j].close - candles[j - 1].close;
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const rs = losses === 0 ? 100 : gains / losses;
      candles[i].rsi = Number((100 - (100 / (1 + rs))).toFixed(1));
    } else {
      candles[i].rsi = 50.0;
    }
  }

  // Adjust last candle close to basePrice
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = basePrice;
    last.high = Math.max(last.high, basePrice);
    last.low = Math.min(last.low, basePrice);
  }

  return candles;
}

export const INITIAL_STOCKS: StockData[] = [
  // 🇹🇭 1. THAI STOCKS (หุ้นไทย - SET / mai)
  {
    symbol: 'CPALL',
    name: 'CP All Public Company Limited',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Commerce & Retail',
    currency: 'THB',
    currentPrice: 46.75,
    change: 0.00,
    changePercent: 0.00,
    high52w: 54.50,
    low52w: 40.50,
    volume: 24650000,
    avgVolume30d: 22800000,
    
    // Fundamental
    pe: 18.8,
    industryPe: 24.5,
    pbv: 3.1,
    roe: 16.5,
    dividendYield: 3.85,
    de: 1.32,
    netMargin: 4.8,
    revenueGrowth: 8.9,
    eps: 2.48,
    fairValue: 56.00,
    marginOfSafety: 19.78,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 90,
    dcfValue: 58.50,
    grahamValue: 52.00,

    // Technical
    trend: 'SIDEWAY',
    technicalScore: 82,
    rsi: 52.4,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 46.20,
    ema50: 45.80,
    ema200: 48.50,
    support1: 45.50,
    support2: 44.00,
    resistance1: 49.00,
    resistance2: 52.50,
    stopLossPrice: 44.00,
    targetPrice1: 52.00,
    targetPrice2: 56.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'STRONG_BUY',
    businessDescription: 'ผู้นำเครือข่ายร้านสะดวกซื้อ 7-Eleven กว่า 14,000 สาขาทั่วประเทศไทย ควบรวม Lotus\'s และ Makro (CPAXT) สร้าง Cash Flow มหาศาลและการเติบโตของยอดขายสาขาเดิม (SSSG)',
    strengths: [
      'เครือข่ายสาขาครอบคลุมอันดับ 1 ในไทย มีอำนาจต่อรองกับคู่ค้าสูง (Strong Moat)',
      'การบริโภคและการท่องเที่ยวฟื้นตัวหนุนยอดขายเฉลี่ยต่อบิลโตต่อเนื่อง',
      'Synergy กับ CPAXT (Makro/Lotus) เพิ่มประสิทธิภาพด้าน Supply Chain',
      'กระแสเงินสดจากการดำเนินงานแข็งแกร่ง รองรับการจ่ายปันผลสม่ำเสมอ ~3.85%'
    ],
    risks: [
      'ภาระหนี้สินจากการควบรวมกิจการในอดีต (ทยอยลดลงต่อเนื่อง)',
      'กำลังซื้อระดับฐานรากอาจชะลอตัวหากเศรษฐกิจโดยรวมผันผวน'
    ],
    actionPlanSummary: 'ราคาปิดวันทำการล่าสุด 46.75 บาท (อ้างอิงราคา Siamchart / SET) Valuation P/E 18.8 เท่า มี Margin of Safety สูงถึง 19.8% กราฟสร้างฐาน Double Bottom เหนือแนวรับ 45.50 บาท แนะนำทยอยสะสม Buy on Dip บริเวณ 45.50-46.75 บาท วาง Stop Loss ที่ 44.00 บาท เป้าหมายทำกำไร 52.00 และ 56.00 บาท',
    candles: generateCandles(46.75, 'SIDEWAY', 0.012, 60, 2),
  },
  {
    symbol: 'KBANK',
    name: 'Kasikornbank Public Company Limited',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Banking & Financial Services',
    currency: 'THB',
    currentPrice: 254.00,
    prevClosePrice: 257.00,
    change: -3.00,
    changePercent: -1.17,
    high52w: 268.00,
    low52w: 185.00,
    volume: 18200000,
    avgVolume30d: 15400000,
    marketCap: 602000,
    marketCapCategory: 'LARGE_CAP',
    
    // Fundamental
    pe: 8.2,
    industryPe: 8.9,
    pbv: 0.72,
    roe: 9.4,
    dividendYield: 4.85,
    de: 0,
    netMargin: 24.5,
    revenueGrowth: 6.8,
    eps: 30.98,
    fairValue: 285.00,
    marginOfSafety: 10.88,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 91,
    dcfValue: 290.00,
    grahamValue: 275.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 86,
    rsi: 59.5,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 251.00,
    ema50: 244.00,
    ema200: 220.00,
    support1: 250.00,
    support2: 244.00,
    resistance1: 262.00,
    resistance2: 275.00,
    stopLossPrice: 240.00,
    targetPrice1: 270.00,
    targetPrice2: 285.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้นำธนาคารพาณิชย์และดิจิทัลแบงก์กิ้งชั้นนำของประเทศไทย (K PLUS) โดดเด่นด้านการขยายสินเชื่อธุรกิจ ดิจิทัลแพลตฟอร์ม และการบริหารจัดการ NPL อย่างรัดกุม',
    strengths: [
      'ผู้นำ Digital Banking ด้วยผู้ใช้งานแอป K PLUS กว่า 20 ล้านราย',
      'ผลตอบแทนเงินปันผลสูงสม่ำเสมอ ~4.85% ต่อปี',
      'การบริหารสินทรัพย์และจัดการ NPL มีประสิทธิภาพสูง'
    ],
    risks: [
      'ทิศทางดอกเบี้ยนโยบายขาลงอาจกระทบต่อส่วนต่างรายได้ดอกเบี้ยสุทธิ (NIM)',
      'การตั้งสำรองหนี้ด้อยคุณภาพของภาคธุรกิจ SME'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด (Last) 254.00 บาท (อ้างอิง SET / Siamchart) หุ้นธนาคารขนาดใหญ่ ปันผลสูง เทรดต่ำกว่าบุ๊ก กราฟพักตัวบนแนวรับ EMA20 แนะนำตั้งรับ 248-254 บาท วาง Stop Loss 240 บาท เป้าหมายทำกำไร 270 และ 285 บาท',
    candles: generateCandles(254.00, 'UPTREND', 0.012, 60, 2),
  },
  {
    symbol: 'DELTA',
    name: 'Delta Electronics (Thailand) PCL',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Electronic Components & AI Power',
    currency: 'THB',
    currentPrice: 254.00,
    prevClosePrice: 258.00,
    change: -4.00,
    changePercent: -1.55,
    high52w: 285.00,
    low52w: 140.00,
    volume: 18500000,
    avgVolume30d: 16200000,
    
    // Fundamental
    pe: 65.2,
    industryPe: 24.0,
    pbv: 18.4,
    roe: 29.8,
    dividendYield: 0.85,
    de: 0.38,
    netMargin: 12.8,
    revenueGrowth: 26.5,
    eps: 3.95,
    fairValue: 285.00,
    marginOfSafety: 10.46,
    valuationStatus: 'FAIR',
    fundamentalScore: 84,
    dcfValue: 295.00,
    grahamValue: 240.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 82,
    rsi: 58.6,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 252.00,
    ema50: 242.00,
    ema200: 215.00,
    support1: 250.00,
    support2: 244.00,
    resistance1: 268.00,
    resistance2: 285.00,
    stopLossPrice: 240.00,
    targetPrice1: 285.00,
    targetPrice2: 312.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้ผลิตเพาเวอร์ซัพพลายสำหรับ AI Data Center, Cloud Computing และชิ้นส่วนยานยนต์ไฟฟ้า (EV) ระดับโลก ได้รับอานิสงส์ทางตรงจากการขยาย Data Center ของกลุ่ม Big Tech',
    strengths: [
      'ผู้นำโซลูชันด้านพลังงานและ Liquid Cooling สำหรับเซิร์ฟเวอร์ AI ร่วมกับลูกค้าระดับโลก',
      'สัดส่วนรายได้จากผลิตภัณฑ์มาร์จิ้นสูง (AI Power Solutions) เพิ่มขึ้นอย่างมีนัยสำคัญ',
      'ฐานะทางการเงินแข็งแกร่ง หนี้สินต่ำมาก (D/E เพียง 0.38 เท่า)'
    ],
    risks: [
      'Valuation P/E สูงกว่า 65 เท่า สะท้อนความคาดหวังการเติบโตสูง',
      'ความผันผวนของค่าเงินบาทและนโยบายการค้าระหว่างประเทศ'
    ],
    actionPlanSummary: 'ราคาปิดวันทำการล่าสุด 258.00 บาท (อ้างอิง Siamchart / SET) ผู้นำ AI Power Supply ระดับโลก กราฟทรง Uptrend เหนือเส้น EMA20 แนะนำตั้งรับ Buy on Dip บริเวณ 248-254 บาท วาง Stop Loss ที่ 240 บาท เล็งเป้าหมาย 285 และ 312 บาท',
    candles: generateCandles(258.00, 'UPTREND', 0.020, 60, 2),
  },
  {
    symbol: 'ADVANC',
    name: 'Advanced Info Service PCL',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Telecommunications & Cloud',
    currency: 'THB',
    currentPrice: 360.00,
    change: 2.00,
    changePercent: 0.56,
    high52w: 365.00,
    low52w: 204.00,
    volume: 5200000,
    avgVolume30d: 4800000,
    
    // Fundamental
    pe: 26.5,
    industryPe: 25.0,
    pbv: 9.2,
    roe: 38.5,
    dividendYield: 4.10,
    de: 1.95,
    netMargin: 18.5,
    revenueGrowth: 16.2,
    eps: 13.58,
    fairValue: 405.00,
    marginOfSafety: 12.50,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 94,
    dcfValue: 415.00,
    grahamValue: 350.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 92,
    rsi: 68.2,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 352.00,
    ema50: 338.00,
    ema200: 295.00,
    support1: 355.00,
    support2: 348.00,
    resistance1: 368.00,
    resistance2: 385.00,
    stopLossPrice: 344.00,
    targetPrice1: 380.00,
    targetPrice2: 405.00,
    technicalSignal: 'BUY_BREAKOUT',

    // Qualitative
    compositeRating: 'STRONG_BUY',
    businessDescription: 'ผู้นำบริการโทรคมนาคม อินเทอร์เน็ตความเร็วสูง (3BB Broadband) และโครงสร้างพื้นฐานดิจิทัล Data Center & Cloud Services สำหรับองค์กรในประเทศไทย',
    strengths: [
      'สภาพตลาดโทรคมนาคมกลายเป็น Oligopoly ส่งผลให้ ARPU ปรับตัวสูงขึ้นต่อเนื่อง',
      'การควบรวมกับ 3BB หนุนธุรกิจ Fixed Broadband ก้าวสู่อันดับ 1 ของประเทศ',
      'ปันผลมั่นคงสูง (Yield ~4.10%) และ ROE ระดับสูงกว่า 38%',
      'ร่วมมือกับ Oracle & GULF พัฒนา Enterprise Sovereign Cloud ในไทย'
    ],
    risks: [
      'การลงทุนขยายคลื่นความถี่และโครงข่าย 5G/Data Center ที่ต้องใช้เงินทุนต่อเนื่อง',
      'กำลังซื้อผู้บริโภคระดับล่าง'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด 360.00 บาท (อ้างอิง Siamchart / SET) หุ้นบลูชิพปันผลและเติบโตชั้นยอด (Dividend + Growth Moat) โมเมนตัม Breakout ทำจุดสูงสุดใหม่ต่อเนื่อง แนะนำ Follow Buy หรือย่อรับ 352-358 บาท วาง Stop Loss 344 บาท เล็งเป้าหมาย 380 และ 405 บาท',
    candles: generateCandles(360.00, 'UPTREND', 0.012, 60, 2),
  },
  {
    symbol: 'BDMS',
    name: 'Bangkok Dusit Medical Services PCL',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Healthcare Services',
    currency: 'THB',
    currentPrice: 19.90,
    change: 0.10,
    changePercent: 0.51,
    high52w: 24.50,
    low52w: 18.20,
    volume: 38500000,
    avgVolume30d: 32000000,
    
    // Fundamental
    pe: 21.5,
    industryPe: 28.0,
    pbv: 3.4,
    roe: 16.2,
    dividendYield: 3.65,
    de: 0.35,
    netMargin: 14.8,
    revenueGrowth: 7.9,
    eps: 0.92,
    fairValue: 24.50,
    marginOfSafety: 23.11,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 89,
    dcfValue: 25.50,
    grahamValue: 22.00,

    // Technical
    trend: 'SIDEWAY',
    technicalScore: 78,
    rsi: 54.2,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 19.60,
    ema50: 19.40,
    ema200: 20.80,
    support1: 19.50,
    support2: 19.00,
    resistance1: 20.80,
    resistance2: 22.50,
    stopLossPrice: 18.80,
    targetPrice1: 22.00,
    targetPrice2: 24.50,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'เครือข่ายโรงพยาบาลเอกชนอันดับหนึ่งของประเทศไทย (กลุ่ม รพ.กรุงเทพ, สมิติเวช, บีเอ็นเอช, พญาไท, เปาโล) มีศูนย์ความเป็นเลิศทางการแพทย์ระดับโลก (Center of Excellence)',
    strengths: [
      'จำนวนเตียงผู้ป่วยและเครือข่ายโรงพยาบาลครอบคลุมทุกทำเลสำคัญทั้งไทยและต่างชาติ',
      'รายได้จากผู้ป่วยต่างชาติ (Medical Tourism) ขยายตัวต่อเนื่อง',
      'Valuation P/E 21.5 เท่า อยู่ในโซนถูกและ Margin of Safety สูงถึง 23.1%'
    ],
    risks: [
      'การแข่งขันจากโรงพยาบาลเอกชนเฉพาะทาง',
      'นโยบายควบคุมค่ารักษาพยาบาลของภาครัฐ'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด 19.90 บาท (อ้างอิง Siamchart / SET) หุ้น Defensive คุณภาพสูงที่ Valuation ถูกมาก (P/E 21.5 เท่า เทียบกับอดีต >30 เท่า) กราฟตั้งฐาน Double Bottom เหนือแนวรับ 19.50 บาท แนะนำทยอยสะสม 19.20-19.80 บาท วาง Stop Loss 18.80 บาท เป้าหมายทำกำไร 22.00 และ 24.50 บาท',
    candles: generateCandles(19.90, 'SIDEWAY', 0.010, 60, 2),
  },
  {
    symbol: 'PTT',
    name: 'PTT Public Company Limited',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Energy & Utilities',
    currency: 'THB',
    currentPrice: 40.75,
    change: 0.00,
    changePercent: 0.00,
    high52w: 42.50,
    low52w: 30.50,
    volume: 42000000,
    avgVolume30d: 38000000,
    
    // Fundamental
    pe: 10.5,
    industryPe: 11.5,
    pbv: 0.92,
    roe: 10.1,
    dividendYield: 5.80,
    de: 0.72,
    netMargin: 4.2,
    revenueGrowth: 3.5,
    eps: 3.88,
    fairValue: 46.00,
    marginOfSafety: 12.88,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 82,
    dcfValue: 47.50,
    grahamValue: 43.00,

    // Technical
    trend: 'SIDEWAY',
    technicalScore: 76,
    rsi: 56.4,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 40.20,
    ema50: 39.50,
    ema200: 38.00,
    support1: 39.75,
    support2: 38.50,
    resistance1: 42.00,
    resistance2: 44.00,
    stopLossPrice: 38.00,
    targetPrice1: 43.50,
    targetPrice2: 46.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'ACCUMULATE',
    businessDescription: 'บรรษัทพลังงานแห่งชาติ ดำเนินธุรกิจก๊าซธรรมชาติ น้ำมัน ปิโตรเคมี โรงกลั่น และขยายสู่ธุรกิจพลังงานสะอาดและ Life Science',
    strengths: [
      'เงินปันผลสูงสม่ำเสมอ Dividend Yield เฉลี่ย ~5.8% ต่อปี',
      'ราคาเทรดต่ำกว่ามูลค่าทางบัญชี (P/BV 0.92 เท่า)',
      'สถานะรัฐวิสาหกิจและมีโครงสร้างก๊าซธรรมชาติผูกขาดในประเทศ'
    ],
    risks: [
      'ความผันผวนของราคาน้ำมันดิบและค่าการกลั่นในตลาดโลก',
      'การแทรกแซงราคาพลังงานเพื่อลดค่าครองชีพจากนโยบายภาครัฐ'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด 40.75 บาท (อ้างอิง Siamchart / SET) หุ้น High Dividend Value Play รับเงินปันผลเกือบ 6% กราฟสร้างฐานแข็งแกร่งเหนือเส้น EMA50 แนะนำดักซื้อสะสมเมื่อราคาเข้าใกล้กรอบ 39.50-40.50 บาท วาง Stop Loss ที่ 38.00 บาท เป้าหมายรับปันผลและรีบาวด์ 43.50 และ 46.00 บาท',
    candles: generateCandles(40.75, 'SIDEWAY', 0.011, 60, 2),
  },
  {
    symbol: 'GULF',
    name: 'Gulf Energy Development PCL',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Energy & Tech Holding',
    currency: 'THB',
    currentPrice: 64.00,
    change: 0.25,
    changePercent: 0.39,
    high52w: 69.75,
    low52w: 40.25,
    volume: 19800000,
    avgVolume30d: 17200000,
    
    // Fundamental
    pe: 37.2,
    industryPe: 24.0,
    pbv: 5.0,
    roe: 14.8,
    dividendYield: 1.40,
    de: 2.45,
    netMargin: 16.5,
    revenueGrowth: 28.4,
    eps: 1.71,
    fairValue: 72.00,
    marginOfSafety: 11.11,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 86,
    dcfValue: 74.00,
    grahamValue: 62.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 89,
    rsi: 65.2,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 62.80,
    ema50: 59.50,
    ema200: 52.00,
    support1: 62.50,
    support2: 60.00,
    resistance1: 66.50,
    resistance2: 70.00,
    stopLossPrice: 60.00,
    targetPrice1: 70.00,
    targetPrice2: 76.00,
    technicalSignal: 'BUY_BREAKOUT',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ยักษ์ใหญ่โรงไฟฟ้าเอกชนและโครงสร้างพื้นฐานดิจิทัล พลิกโฉมสู่ Tech Infrastructure Holding Company ผ่านการควบรวมกับ INTUCH และการขยายธุรกิจ Data Center & AI Cloud ร่วมกับพันธมิตรระดับโลก',
    strengths: [
      'พอร์ตโรงไฟฟ้ามีสัญญารับซื้อระยะยาว (PPA) กับ กฟผ. รายได้มีความแน่นอนสูง',
      'การควบรวม NewCo เพิ่มประสิทธิภาพทางการเงินและปลดล็อกมูลค่าธุรกิจเทคโนโลยี',
      'การเติบโตของธุรกิจ Data Center และโครงสร้างพื้นฐานดิจิทัล'
    ],
    risks: [
      'อัตราส่วนหนี้สิน D/E อยู่ในระดับค่อนข้างสูง (แต่จัดการได้ด้วย Cash flow ต่อเนื่อง)',
      'นโยบายการปรับค่าไฟ (Ft) ของภาครัฐ'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด 64.00 บาท (อ้างอิง Siamchart / SET) หุ้น Growth & Tech Holding ที่มีโมเมนตัมแข็งแกร่งที่สุดตัวหนึ่งใน SET50 ทางเทคนิคเบรกทะลุแนวต้านสำคัญอย่างต่อเนื่อง แนะนำ Follow Buy หรือย่อรับ 62.50-64.00 บาท วาง Stop Loss ที่ 60.00 บาท เป้าหมายถัดไป 70.00 และ 76.00 บาท',
    candles: generateCandles(64.00, 'UPTREND', 0.015, 60, 2),
  },
  {
    symbol: 'BANPU',
    name: 'Banpu Public Company Limited',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Energy & Utilities / Coal & Gas',
    currency: 'THB',
    currentPrice: 14.50,
    prevClosePrice: 14.50,
    change: 0.00,
    changePercent: 0.00,
    high52w: 16.80,
    low52w: 12.20,
    volume: 5954694,
    avgVolume30d: 7200000,
    marketCap: 124500,
    marketCapCategory: 'MID_CAP',
    
    // Fundamental
    pe: 8.5,
    industryPe: 11.0,
    pbv: 0.75,
    roe: 8.8,
    dividendYield: 5.80,
    de: 1.65,
    netMargin: 7.2,
    revenueGrowth: 4.8,
    eps: 1.70,
    fairValue: 17.50,
    marginOfSafety: 17.14,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 82,
    dcfValue: 18.00,
    grahamValue: 16.50,

    // Technical
    trend: 'SIDEWAY',
    technicalScore: 76,
    rsi: 52.4,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 14.30,
    ema50: 14.10,
    ema200: 14.40,
    support1: 14.20,
    support2: 13.80,
    resistance1: 15.40,
    resistance2: 16.50,
    stopLossPrice: 13.60,
    targetPrice1: 16.00,
    targetPrice2: 17.50,
    technicalSignal: 'ACCUMULATE',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้ดำเนินธุรกิจพลังงานแบบครบวงจร ทั้งถ่านหิน ก๊าซธรรมชาติในสหรัฐฯ โรงไฟฟ้า และพลังงานหมุนเวียน (BPP & Banpu NEXT)',
    strengths: [
      'ราคาเทรดต่ำกว่ามูลค่าทางบัญชี (P/BV 0.75 เท่า)',
      'เงินปันผลสูงสม่ำเสมอ Dividend Yield สูงกว่า 5.8% ต่อปี',
      'การขยายพอร์ตธุรกิจก๊าซธรรมชาติในสหรัฐฯ (Barnett & Marcellus Shale) สร้าง Cash Flow มั่นคง'
    ],
    risks: [
      'ความผันผวนของราคาถ่านหินและก๊าซธรรมชาติในตลาดโลก',
      'อัตราแลกเปลี่ยนสกุลเงินดอลลาร์สหรัฐ'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด (Last) 14.50 บาท (อ้างอิงราคาปิดจริง SET / Siamchart) หุ้นพลังงานครบวงจร ปันผลสูง เทรดต่ำกว่าบุ๊ก แนะนำทยอยสะสมในกรอบ 14.20-14.50 บาท วาง Stop Loss 13.60 บาท เป้าหมายทำกำไร 16.00 และ 17.50 บาท',
    candles: generateCandles(14.50, 'SIDEWAY', 0.012, 60, 2),
  },
  {
    symbol: 'MTC',
    name: 'Muangthai Capital Public Company Limited',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Finance & Non-Bank Credit',
    currency: 'THB',
    currentPrice: 32.50,
    prevClosePrice: 32.75,
    change: -0.25,
    changePercent: -0.76,
    high52w: 39.50,
    low52w: 24.50,
    volume: 14200000,
    avgVolume30d: 11800000,
    
    // Fundamental
    pe: 14.2,
    industryPe: 16.5,
    pbv: 2.15,
    roe: 16.2,
    dividendYield: 3.40,
    de: 3.10,
    netMargin: 23.5,
    revenueGrowth: 14.2,
    eps: 2.29,
    fairValue: 38.00,
    marginOfSafety: 14.47,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 87,
    dcfValue: 39.50,
    grahamValue: 36.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 83,
    rsi: 58.4,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 31.80,
    ema50: 30.90,
    ema200: 29.50,
    support1: 31.75,
    support2: 30.50,
    resistance1: 34.50,
    resistance2: 37.00,
    stopLossPrice: 30.00,
    targetPrice1: 35.00,
    targetPrice2: 38.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้นำธุรกิจสินเชื่อทะเบียนรถจักรยานยนต์ รถยนต์ สินเชื่อโฉนดที่ดิน และสินเชื่อส่วนบุคคล มีเครือข่ายสาขากว่า 7,500 สาขาทั่วประเทศไทย ได้รับอานิสงส์เชิงบวกจากแนวโน้มอัตราดอกเบี้ยขาลงและคุณภาพหนี้ NPL ที่เริ่มผ่านจุดสูงสุด',
    strengths: [
      'เครือข่ายสาขาครอบคลุมทั่วประเทศกว่า 7,500 สาขา และฐานลูกค้าเติบโตต่อเนื่อง',
      'ทิศทางดอกเบี้ยขาลงช่วยลดต้นทุนทางการเงิน (Cost of Funds) และเพิ่ม Net Interest Margin',
      'การตั้งสำรองหนี้ (Credit Cost) ชะลอตัวลง หลังคุณภาพสินทรัพย์ควบคุมได้ดีขึ้น',
      'ยอดปล่อยสินเชื่อใหม่ยังคงขยายตัวระดับ 12-15% ต่อปี'
    ],
    risks: [
      'การแข่งขันในตลาดสินเชื่อจำนำทะเบียนและเช่าซื้อ',
      'กำลังซื้อและความสามารถในการชำระหนี้ของกลุ่มลูกหนี้ฐานราก'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด (Last) 32.50 บาท (อ้างอิง SET / Siamchart) หุ้นผู้นำ Non-Bank สินเชื่อทะเบียนรถ กราฟย่อพักตัวทดสอบแนวรับ EMA20 แนะนำตั้งรับ 31.75-32.50 บาท วาง Stop Loss ที่ 30.00 บาท เป้าหมายทำกำไร 35.00 และ 38.00 บาท',
    candles: generateCandles(32.50, 'UPTREND', 0.015, 60, 2),
  },
  {
    symbol: 'SAWAD',
    name: 'Srisawad Corporation PCL',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Finance & Non-Bank Credit',
    currency: 'THB',
    currentPrice: 38.50,
    change: 0.50,
    changePercent: 1.32,
    high52w: 48.00,
    low52w: 32.00,
    volume: 12500000,
    avgVolume30d: 9800000,
    
    // Fundamental
    pe: 14.8,
    industryPe: 19.5,
    pbv: 1.85,
    roe: 15.2,
    dividendYield: 4.20,
    de: 2.65,
    netMargin: 27.8,
    revenueGrowth: 11.5,
    eps: 2.60,
    fairValue: 46.00,
    marginOfSafety: 16.30,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 84,
    dcfValue: 47.00,
    grahamValue: 42.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 80,
    rsi: 58.5,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 37.80,
    ema50: 36.90,
    ema200: 37.50,
    support1: 37.50,
    support2: 36.00,
    resistance1: 40.50,
    resistance2: 43.50,
    stopLossPrice: 35.80,
    targetPrice1: 42.00,
    targetPrice2: 46.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้ให้บริการสินเชื่อรายย่อย สินเชื่อจำนำทะเบียนรถ บ้าน ที่ดิน และบริหารสินทรัพย์ด้อยคุณภาพ (SAM)',
    strengths: [
      'Valuation P/E เพียง 14.8 เท่า และ Dividend Yield สูงกว่า 4.2%',
      'พอร์ตสินเชื่อกระจายตัวครอบคลุมทั้งยานยนต์และอสังหาริมทรัพย์',
      'ได้ประโยชน์จากต้นทุนดอกเบี้ยที่ลดลงตามวัฏจักรดอกเบี้ยขาลง'
    ],
    risks: [
      'ความเข้มงวดในการตั้งสำรองหนี้ด้อยคุณภาพ',
      'การแข่งขันด้านอัตราดอกเบี้ยสินเชื่อจำนำทะเบียน'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด 38.50 บาท (อ้างอิง SET) กราฟฟื้นตัวจากกรอบล่างสร้างฐาน W-Shape สวยงาม แนะนำ Buy on Dip บริเวณ 37.50-38.25 บาท วาง Stop Loss 35.80 บาท เป้าหมายทำกำไร 42.00 และ 46.00 บาท',
    candles: generateCandles(38.50, 'UPTREND', 0.016, 60, 2),
  },
  {
    symbol: 'TIDLOR',
    name: 'Ngern Tid Lor Public Company Limited',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Finance & Non-Bank Credit',
    currency: 'THB',
    currentPrice: 18.80,
    change: 0.30,
    changePercent: 1.62,
    high52w: 24.50,
    low52w: 15.20,
    volume: 16800000,
    avgVolume30d: 14200000,
    
    // Fundamental
    pe: 13.5,
    industryPe: 19.5,
    pbv: 1.62,
    roe: 14.5,
    dividendYield: 3.40,
    de: 2.30,
    netMargin: 21.2,
    revenueGrowth: 15.8,
    eps: 1.39,
    fairValue: 23.50,
    marginOfSafety: 20.00,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 86,
    dcfValue: 24.00,
    grahamValue: 21.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 83,
    rsi: 60.1,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 18.30,
    ema50: 17.80,
    ema200: 18.50,
    support1: 18.40,
    support2: 17.60,
    resistance1: 19.80,
    resistance2: 21.50,
    stopLossPrice: 17.50,
    targetPrice1: 21.00,
    targetPrice2: 23.50,
    technicalSignal: 'BUY_BREAKOUT',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้นำธุรกิจสินเชื่อทะเบียนรถและนายหน้าประกันภัยดิจิทัลชั้นนำของประเทศ มีเทคโนโลยีบัตรติดล้อ (Tidlor Card) นวัตกรรมการเบิกถอนเงินสด 24 ชม.',
    strengths: [
      'ธุรกิจนายหน้าประกันภัย (Insurance Broker) มีสัดส่วนรายได้ค่าธรรมเนียมเติบโตสูงและไร้ความเสี่ยงเครดิต',
      'เทคโนโลยีบัตรติดล้อสร้างความสะดวกและเพิ่มความภักดีของลูกค้า',
      'Valuation ไม่แพง P/E 13.5 เท่า ต่ำกว่าค่าเฉลี่ยกลุ่ม'
    ],
    risks: [
      'ความเสี่ยงจากหนี้เสียในกลุ่มสินเชื่อรถบรรทุกและรถเพื่อการพาณิชย์'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด 18.80 บาท (อ้างอิง SET) โมเมนตัมกำลังทดสอบทะลุแนวต้าน 19.00 บาท แนะนำสะสม 18.30-18.70 บาท วาง Stop Loss 17.50 บาท เป้าหมาย 21.00 และ 23.50 บาท',
    candles: generateCandles(18.80, 'UPTREND', 0.018, 60, 2),
  },
  {
    symbol: 'TRUE',
    name: 'True Corporation Public Company Limited',
    market: 'SET',
    assetCategory: 'THAI_STOCK',
    sector: 'Telecommunications & Digital Services',
    currency: 'THB',
    currentPrice: 12.20,
    change: 0.20,
    changePercent: 1.67,
    high52w: 13.50,
    low52w: 6.80,
    volume: 45000000,
    avgVolume30d: 38000000,
    
    // Fundamental
    pe: 28.5,
    industryPe: 25.0,
    pbv: 4.8,
    roe: 12.4,
    dividendYield: 2.10,
    de: 3.10,
    netMargin: 7.5,
    revenueGrowth: 18.5,
    eps: 0.43,
    fairValue: 14.50,
    marginOfSafety: 15.86,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 83,
    dcfValue: 15.00,
    grahamValue: 13.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 89,
    rsi: 66.8,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 11.80,
    ema50: 11.20,
    ema200: 9.80,
    support1: 11.90,
    support2: 11.40,
    resistance1: 12.80,
    resistance2: 13.50,
    stopLossPrice: 11.20,
    targetPrice1: 13.20,
    targetPrice2: 14.50,
    technicalSignal: 'BUY_BREAKOUT',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้ให้บริการโทรคมนาคมรายใหญ่ที่สุดในไทยหลังการควบรวม True-Dtac เติบโตจากการผนึกกำลัง Synergy และการเพิ่ม ARPU',
    strengths: [
      'ผลประโยชน์จากการลดต้นทุนซ้ำซ้อนหลังควบรวมดันกำไรฟื้นตัวก้าวกระโดด',
      'การแข่งขันด้านราคาแพ็กเกจลดลง ดัน ARPU ปรับตัวขึ้นต่อเนื่อง'
    ],
    risks: [
      'ภาระหนี้สินจากการลงทุนคลื่นความถี่'
    ],
    actionPlanSummary: 'ราคาปิดล่าสุด 12.20 บาท (อ้างอิง SET) หุ้นเทิร์นอะราวด์โมเมนตัมแรง แนะนำ Follow Buy หรือย่อรับ 11.80-12.10 บาท วาง Stop Loss 11.20 บาท เป้าหมาย 13.20 และ 14.50 บาท',
    candles: generateCandles(12.20, 'UPTREND', 0.016, 60, 2),
  },

  // 🌐 2. GLOBAL / US STOCKS (หุ้นต่างประเทศ)
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'US',
    assetCategory: 'GLOBAL_STOCK',
    sector: 'Semiconductors / AI Computing',
    currency: 'USD',
    currentPrice: 214.72,
    change: 4.50,
    changePercent: 2.14,
    high52w: 235.00,
    low52w: 95.00,
    volume: 65000000,
    avgVolume30d: 62000000,
    
    // Fundamental
    pe: 42.5,
    industryPe: 34.0,
    pbv: 32.5,
    roe: 88.4,
    dividendYield: 0.10,
    de: 0.15,
    netMargin: 56.2,
    revenueGrowth: 115.0,
    eps: 5.05,
    fairValue: 245.00,
    marginOfSafety: 14.10,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 96,
    dcfValue: 260.00,
    grahamValue: 210.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 92,
    rsi: 65.8,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 208.50,
    ema50: 198.00,
    ema200: 165.00,
    support1: 206.00,
    support2: 198.00,
    resistance1: 225.00,
    resistance2: 240.00,
    stopLossPrice: 195.00,
    targetPrice1: 235.00,
    targetPrice2: 260.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'STRONG_BUY',
    businessDescription: 'ผู้นำฮาร์ดแวร์และซอฟต์แวร์ประมวลผล AI และ GPU ระดับโลก สถาปัตยกรรม Blackwell และ CUDA Ecosystem ผูกขาดตลาด AI Data Center ทั่วโลกกว่า 85%',
    strengths: [
      'Net Profit Margin สูงลิ่วกว่า 56% และ ROE มหาศาล 88.4%',
      'Cuda Software Ecosystem มี Network Effect แน่นหนา คู่แข่งทดแทนได้ยากมาก',
      'ความต้องการชิป AI ยังสูงต่อเนื่องจากผู้ให้บริการคลาวด์ระดับ Hyperscalers'
    ],
    risks: [
      'ข้อจำกัดด้านการส่งออกชิปขั้นสูงไปยังบางภูมิภาค',
      'การเร่งพัฒนาชิป Custom Silicon ภายในของลูกค้ารายใหญ่ (ASIC)'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 214.72 USD (อ้างอิง Nasdaq/NYSE) ราชาแห่ง AI และ Semiconductor ระดับโลก โมเมนตัม Uptrend แข็งแกร่ง แนะนำ Buy on Dip ที่ 206-212 USD วาง Stop Loss ที่ 195 USD เป้าหมาย 235 และ 260 USD',
    candles: generateCandles(214.72, 'UPTREND', 0.022, 60, 2),
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'US',
    assetCategory: 'GLOBAL_STOCK',
    sector: 'Technology Hardware & Services',
    currency: 'USD',
    currentPrice: 309.35,
    change: 1.85,
    changePercent: 0.60,
    high52w: 325.00,
    low52w: 185.00,
    volume: 46000000,
    avgVolume30d: 49000000,
    
    // Fundamental
    pe: 34.2,
    industryPe: 28.0,
    pbv: 42.0,
    roe: 140.0,
    dividendYield: 0.48,
    de: 1.25,
    netMargin: 25.4,
    revenueGrowth: 8.5,
    eps: 9.04,
    fairValue: 335.00,
    marginOfSafety: 8.29,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 93,
    dcfValue: 345.00,
    grahamValue: 295.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 84,
    rsi: 61.2,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 302.00,
    ema50: 294.00,
    ema200: 260.00,
    support1: 300.00,
    support2: 292.00,
    resistance1: 318.00,
    resistance2: 330.00,
    stopLossPrice: 288.00,
    targetPrice1: 325.00,
    targetPrice2: 345.00,
    technicalSignal: 'ACCUMULATE',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'บริษัทเทคโนโลยีอันดับหนึ่งด้านแบรนด์ loyalty และ Ecosystem (iPhone, Mac, iPad, Wearables) พร้อมสัดส่วนรายได้ Services (App Store, iCloud, Apple Pay) ที่เติบโตและมีมาร์จิ้นสูงอย่างสม่ำเสมอ',
    strengths: [
      'Active Installed Base กว่า 2.2 พันล้านเครื่อง สร้าง Recurring Services Revenue อย่างมหาศาล',
      'โครงการซื้อหุ้นคืน (Share Buyback) ขนาดใหญ่ที่สุดในโลกช่วยเพิ่ม EPS ต่อเนื่อง',
      'การเปิดตัว Apple Intelligence ผลักดัน iPhone Supercycle'
    ],
    risks: [
      'การแข่งขันในตลาดสมาร์ทโฟนประเทศจีน',
      'คดีการผูกขาดทางการค้าจากกระทรวงยุติธรรมสหรัฐฯ และยุโรป'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 309.35 USD (อ้างอิง Nasdaq/NYSE) หุ้นบลูชิพระดับโลกที่มีกระแสเงินสดแข็งแกร่งที่สุดในโลก เหมาะสำหรับทั้งการลงทุนระยะยาวและการสวิงเทรด แนะนำทยอยสะสมบริเวณ 300-308 USD วาง Stop Loss ที่ 288 USD เป้าหมาย 325-345 USD',
    candles: generateCandles(309.35, 'UPTREND', 0.012, 60, 2),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    market: 'US',
    assetCategory: 'GLOBAL_STOCK',
    sector: 'Cloud & Enterprise AI Software',
    currency: 'USD',
    currentPrice: 481.15,
    change: 3.20,
    changePercent: 0.67,
    high52w: 505.00,
    low52w: 385.00,
    volume: 22000000,
    avgVolume30d: 24000000,
    
    // Fundamental
    pe: 36.2,
    industryPe: 32.0,
    pbv: 12.0,
    roe: 39.5,
    dividendYield: 0.75,
    de: 0.35,
    netMargin: 36.8,
    revenueGrowth: 16.5,
    eps: 13.29,
    fairValue: 525.00,
    marginOfSafety: 9.11,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 95,
    dcfValue: 540.00,
    grahamValue: 470.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 86,
    rsi: 62.4,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 474.00,
    ema50: 462.00,
    ema200: 430.00,
    support1: 472.00,
    support2: 460.00,
    resistance1: 495.00,
    resistance2: 515.00,
    stopLossPrice: 455.00,
    targetPrice1: 505.00,
    targetPrice2: 535.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'STRONG_BUY',
    businessDescription: 'ผู้นำคลาวด์องค์กรระดับโลก Azure และ Enterprise Copilot AI พร้อมผลิตภัณฑ์ผูกขาด Windows, Office 365, LinkedIn และความร่วมมือแนบแน่นกับ OpenAI',
    strengths: [
      'Azure Cloud เติบโตแข็งแกร่งกว่า 30%+ หนุนด้วย AI Workloads องค์กร',
      'รายได้ Recurring จากสมาชิกระดับ Enterprise มีความเสถียรภาพสูงสุดในกลุ่มบิ๊กเทค',
      'อัตรากำไร Net Margin สูงถึง 36.8% และงบดุลแข็งแกร่งระดับ AAA'
    ],
    risks: [
      'งบลงทุน Capex ด้าน Data Center และ AI ชิปที่อยู่ในระดับสูง',
      'การตรวจสอบด้านการผูกขาดในตลาดยุโรป'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 481.15 USD (อ้างอิง Nasdaq/NYSE) เสาหลักของพอร์ตโฟลิโอระดับโลก ผสานความมั่นคง Blue Chip และการเติบโตของ Cloud AI แนะนำ Buy on Dip บริเวณ 472-480 USD วาง Stop Loss ที่ 455 USD เป้าหมาย 505 และ 535 USD',
    candles: generateCandles(481.15, 'UPTREND', 0.014, 60, 2),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    market: 'US',
    assetCategory: 'GLOBAL_STOCK',
    sector: 'Automotive & Autonomous AI / Robotics',
    currency: 'USD',
    currentPrice: 345.13,
    change: 12.40,
    changePercent: 3.73,
    high52w: 380.00,
    low52w: 160.00,
    volume: 85000000,
    avgVolume30d: 78000000,
    
    // Fundamental
    pe: 68.5,
    industryPe: 22.0,
    pbv: 12.5,
    roe: 19.5,
    dividendYield: 0.00,
    de: 0.10,
    netMargin: 12.2,
    revenueGrowth: 14.5,
    eps: 5.04,
    fairValue: 375.00,
    marginOfSafety: 8.65,
    valuationStatus: 'FAIR',
    fundamentalScore: 82,
    dcfValue: 385.00,
    grahamValue: 280.00,

    // Technical
    trend: 'UPTREND',
    technicalScore: 88,
    rsi: 66.5,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 332.00,
    ema50: 315.00,
    ema200: 255.00,
    support1: 335.00,
    support2: 320.00,
    resistance1: 365.00,
    resistance2: 385.00,
    stopLossPrice: 310.00,
    targetPrice1: 375.00,
    targetPrice2: 400.00,
    technicalSignal: 'BUY_BREAKOUT',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'ผู้ผลิตรถยนต์ไฟฟ้า (EV) อันดับ 1 ของโลก พร้อมการพัฒนาเทคโนโลยีขับขี่อัตโนมัติ Full Self-Driving (FSD), หุ่นยนต์ฮิวแมนนอยด์ Optimus และระบบจัดเก็บพลังงาน Megapack',
    strengths: [
      'ระบบ Supercharger Network เป็นมาตรฐานหลักในอเมริกาเหนือ',
      'ธุรกิจพลังงาน Energy Storage (Megapack) เติบโตอย่างโดดเด่นและให้อัตรากำไรสูง',
      'ความคืบหน้าของ Robotaxi และโมเดล FSD V12 End-to-End Neural Net'
    ],
    risks: [
      'สงครามราคาและการแข่งขันในตลาด EV จากผู้ผลิตจีน',
      'ความผันผวนของราคาหุ้นสูงตามข่าวสาร'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 345.13 USD (อ้างอิง Nasdaq/NYSE) หุ้น High Beta โมเมนตัมแรง Breakout ทะลุแนวต้านสำคัญต่อเนื่อง แนะนำ Follow Buy หรือย่อรับ 335-342 USD วาง Stop Loss 310 USD เป้าหมาย 375-400 USD',
    candles: generateCandles(345.13, 'UPTREND', 0.026, 60, 2),
  },

  // 💱 3. FOREX & COMMODITIES (ตลาดอัตราแลกเปลี่ยนและทองคำ)
  {
    symbol: 'XAU/USD',
    name: 'Gold Spot / US Dollar',
    market: 'FOREX',
    assetCategory: 'FOREX',
    sector: 'Precious Metals & Macro Hedge',
    currency: 'USD',
    currentPrice: 4603.50,
    change: 28.50,
    changePercent: 0.62,
    high52w: 4650.00,
    low52w: 2350.00,
    volume: 2450000,
    avgVolume30d: 2200000,
    
    // Macro Fundamentals for Forex/Gold
    pe: 0,
    industryPe: 0,
    pbv: 0,
    roe: 0,
    dividendYield: 0,
    de: 0,
    netMargin: 0,
    revenueGrowth: 0,
    eps: 0,
    fairValue: 4750.00,
    marginOfSafety: 3.18,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 95,

    forexMacro: {
      pairType: 'COMMODITY',
      baseCurrency: 'XAU (Gold)',
      quoteCurrency: 'USD',
      baseInterestRate: 0.00,
      quoteInterestRate: 4.50,
      interestRateDifferential: -4.50,
      baseCentralBank: 'Global Central Banks Reserve Buying',
      quoteCentralBank: 'Federal Reserve (Fed)',
      centralBankStance: 'Fed: Easing Cycle (Rate Cuts) / CBs Accumulating Gold Reserves',
      baseInflationRate: 0.0,
      quoteInflationRate: 2.6,
      pipValuePerStandardLot: 10.00,
      spreadPips: 2.2,
      dailyATR: 380.0, // 38.0 USD/oz
      cotSentiment: 'NET_BULLISH',
      dxyCorrelation: '-0.82 (Inverse to USD Index)',
      leverageStandard: '1:100'
    },

    // Technical
    trend: 'UPTREND',
    technicalScore: 94,
    rsi: 68.5,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 4540.00,
    ema50: 4420.00,
    ema200: 3850.00,
    support1: 4560.00,
    support2: 4500.00,
    resistance1: 4650.00,
    resistance2: 4750.00,
    stopLossPrice: 4480.00,
    targetPrice1: 4680.00,
    targetPrice2: 4780.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'STRONG_BUY',
    businessDescription: 'ทองคำสปอต สินทรัพย์ปลอดภัยอันดับ 1 ของโลก (Safe-Haven Asset) ได้รับแรงหนุนจากวัฏจักรการลดดอกเบี้ยของ Fed, ความไม่แน่นอนทางภูมิรัฐศาสตร์ และการเข้าซื้อทองคำแท่งของธนาคารกลางทั่วโลก (PBOC, RBI, etc.)',
    strengths: [
      'ธนาคารกลางทั่วโลกเดินหน้าเพิ่มสัดส่วนทองคำสำรองต่อเนื่องเพื่อ De-dollarization',
      'Real Yields และอัตราดอกเบี้ยนโยบายสหรัฐฯ มีแนวโน้มลดลง หนุนสินทรัพย์ไม่มีผลตอบแทนดอกเบี้ยอย่างทองคำ',
      'ความตึงเครียดทางภูมิรัฐศาสตร์ทั่วโลกกระตุ้นความต้องการถือครอง Safe Haven'
    ],
    risks: [
      'หากดัชนีเงินดอลลาร์ (DXY) แข็งค่าขึ้นเฉียบพลัน',
      'อัตราเงินเฟ้อสหรัฐฯ กลับมาเร่งตัวจนชะลอการลดดอกเบี้ย'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 4,603.50 USD (อ้างอิง Spot Gold / Interbank) โครงสร้าง Bull Run แข็งแกร่ง เส้น EMA20/50 ทำหน้าที่เป็นแนวรับไดนามิก แนะนำย่อ Long บริเวณ 4,550-4,580 USD วาง Stop Loss ที่ 4,480 USD เป้าหมายทำกำไร 4,680 และ 4,780 USD',
    candles: generateCandles(4603.50, 'UPTREND', 0.012, 60, 2),
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    market: 'FOREX',
    assetCategory: 'FOREX',
    sector: 'Major Currency Pair',
    currency: 'USD',
    currentPrice: 1.1678,
    change: 0.0028,
    changePercent: 0.24,
    high52w: 1.1850,
    low52w: 1.0650,
    volume: 5800000,
    avgVolume30d: 6200000,
    
    // Macro Fundamentals
    pe: 0,
    industryPe: 0,
    pbv: 0,
    roe: 0,
    dividendYield: 0,
    de: 0,
    netMargin: 0,
    revenueGrowth: 0,
    eps: 0,
    fairValue: 1.1850,
    marginOfSafety: 1.47,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 78,

    forexMacro: {
      pairType: 'MAJOR',
      baseCurrency: 'EUR (Eurozone)',
      quoteCurrency: 'USD (United States)',
      baseInterestRate: 3.25,
      quoteInterestRate: 4.50,
      interestRateDifferential: -1.25,
      baseCentralBank: 'European Central Bank (ECB)',
      quoteCentralBank: 'Federal Reserve (Fed)',
      centralBankStance: 'ECB: Dovish (Rate Cuts) | Fed: Gradual Rate Cuts',
      baseInflationRate: 2.1,
      quoteInflationRate: 2.6,
      pipValuePerStandardLot: 10.00,
      spreadPips: 0.8,
      dailyATR: 72.0, // 72 pips
      cotSentiment: 'NET_BULLISH',
      dxyCorrelation: '-0.95 (Highest Direct Inverse to DXY)',
      leverageStandard: '1:100'
    },

    // Technical
    trend: 'UPTREND',
    technicalScore: 76,
    rsi: 58.4,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 1.1620,
    ema50: 1.1540,
    ema200: 1.1250,
    support1: 1.1620,
    support2: 1.1550,
    resistance1: 1.1750,
    resistance2: 1.1850,
    stopLossPrice: 1.1520,
    targetPrice1: 1.1780,
    targetPrice2: 1.1880,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'คู่เงินที่มีสภาพคล่องและมูลค่าการซื้อขายสูงที่สุดในโลก สะท้อนส่วนต่างการเติบโตทางเศรษฐกิจและอัตราดอกเบี้ยระหว่างยุโรปและสหรัฐอเมริกา',
    strengths: [
      'สภาพคล่องสูงสุดในโลก สเปรดต่ำมาก (Tight Spread ~0.8 pips)',
      'ราคาฟื้นตัวยก High-Low เหนือเส้น EMA20/50 วันอย่างมั่นคง',
      'Fed มีแนวโน้มลดดอกเบี้ย ช่วยหนุนค่าเงินยูโรเมื่อเทียบกับดอลลาร์'
    ],
    risks: [
      'เศรษฐกิจเยอรมนีและภาคการผลิตยุโรปยังคงเปราะบาง',
      'ความเสี่ยงจากความขัดแย้งทางภูมิรัฐศาสตร์ชายแดนยุโรป'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 1.1678 (อ้างอิง Forex Interbank) คู่เงินหลักระดับโลก เคลื่อนไหวในกรอบ Uptrend แนะนำเปิดสถานะ Buy/Long ตามแนวรับ 1.1620-1.1650 วาง Stop Loss ใต้ 1.1520 เล็งทำกำไร 1.1780 และ 1.1880',
    candles: generateCandles(1.1678, 'UPTREND', 0.006, 60, 4),
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    market: 'FOREX',
    assetCategory: 'FOREX',
    sector: 'Major Currency Pair & Carry Trade',
    currency: 'JPY',
    currentPrice: 158.90,
    change: -0.45,
    changePercent: -0.28,
    high52w: 161.95,
    low52w: 140.20,
    volume: 5200000,
    avgVolume30d: 5400000,
    
    // Macro Fundamentals
    pe: 0,
    industryPe: 0,
    pbv: 0,
    roe: 0,
    dividendYield: 0,
    de: 0,
    netMargin: 0,
    revenueGrowth: 0,
    eps: 0,
    fairValue: 154.00,
    marginOfSafety: -3.18,
    valuationStatus: 'OVERVALUED',
    fundamentalScore: 70,

    forexMacro: {
      pairType: 'MAJOR',
      baseCurrency: 'USD (United States)',
      quoteCurrency: 'JPY (Japan)',
      baseInterestRate: 4.50,
      quoteInterestRate: 0.25,
      interestRateDifferential: 4.25,
      baseCentralBank: 'Federal Reserve (Fed)',
      quoteCentralBank: 'Bank of Japan (BOJ)',
      centralBankStance: 'BOJ: Hawkish Normalization | Fed: Dovish Rate Cut',
      baseInflationRate: 2.6,
      quoteInflationRate: 2.5,
      pipValuePerStandardLot: 6.30,
      spreadPips: 0.9,
      dailyATR: 120.0, // 120 pips (1.20 JPY)
      cotSentiment: 'NET_BEARISH',
      dxyCorrelation: '+0.82 (High Positive Correlation to USD)',
      leverageStandard: '1:100'
    },

    // Technical
    trend: 'SIDEWAY',
    technicalScore: 72,
    rsi: 56.5,
    macdSignal: 'NEUTRAL',
    ema20: 158.20,
    ema50: 156.80,
    ema200: 152.50,
    support1: 157.50,
    support2: 156.00,
    resistance1: 160.50,
    resistance2: 162.00,
    stopLossPrice: 155.50,
    targetPrice1: 160.50,
    targetPrice2: 162.00,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'คู่เงินยอดนิยมสำหรับกลยุทธ์ Carry Trade และเก็งกำไรความผันผวนของอัตราดอกเบี้ยระหว่างสหรัฐฯ และธนาคารกลางญี่ปุ่น (BOJ)',
    strengths: [
      'ส่วนต่างอัตราดอกเบี้ย (Interest Rate Differential) ยังกว้างมาก จูงใจ Carry Trade',
      'โมเมนตัมกราฟเทคนิคฟื้นตัวทรงตัวเหนือ EMA50 ได้ดี'
    ],
    risks: [
      'ความเสี่ยงจากการแทรกแซงค่าเงิน (Intervention) ของกระทรวงการคลังญี่ปุ่น (MOF) หากราคาเข้าใกล้ 160-162',
      'BOJ ส่งสัญญาณพร้อมปรับขึ้นดอกเบี้ยนโยบายหากค่าจ้างโตต่อเนื่อง'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 158.90 (อ้างอิง Forex Interbank) โมเมนตัมทรงตัว Sideway Up แนะนำเทรดตามกรอบ ย่อ Buy ใกล้ 157.50-158.00 วาง Stop Loss ที่ 155.50 หรือดัก Short เมื่อราคาแตะแนวต้าน 160.50',
    candles: generateCandles(158.90, 'SIDEWAY', 0.012, 60, 2),
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    market: 'FOREX',
    assetCategory: 'FOREX',
    sector: 'Major Currency Pair (Cable)',
    currency: 'USD',
    currentPrice: 1.3644,
    change: 0.0032,
    changePercent: 0.23,
    high52w: 1.3850,
    low52w: 1.2650,
    volume: 4200000,
    avgVolume30d: 4500000,
    
    // Macro Fundamentals
    pe: 0,
    industryPe: 0,
    pbv: 0,
    roe: 0,
    dividendYield: 0,
    de: 0,
    netMargin: 0,
    revenueGrowth: 0,
    eps: 0,
    fairValue: 1.3800,
    marginOfSafety: 1.14,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 82,

    forexMacro: {
      pairType: 'MAJOR',
      baseCurrency: 'GBP (United Kingdom)',
      quoteCurrency: 'USD (United States)',
      baseInterestRate: 4.75,
      quoteInterestRate: 4.50,
      interestRateDifferential: 0.25,
      baseCentralBank: 'Bank of England (BOE)',
      quoteCentralBank: 'Federal Reserve (Fed)',
      centralBankStance: 'BOE: High Caution on Service Inflation | Fed: Dovish Rate Cut',
      baseInflationRate: 2.5,
      quoteInflationRate: 2.6,
      pipValuePerStandardLot: 10.00,
      spreadPips: 1.0,
      dailyATR: 85.0, // 85 pips
      cotSentiment: 'NET_BULLISH',
      dxyCorrelation: '-0.88',
      leverageStandard: '1:100'
    },

    // Technical
    trend: 'UPTREND',
    technicalScore: 84,
    rsi: 62.4,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20: 1.3580,
    ema50: 1.3460,
    ema200: 1.3100,
    support1: 1.3580,
    support2: 1.3480,
    resistance1: 1.3750,
    resistance2: 1.3850,
    stopLossPrice: 1.3420,
    targetPrice1: 1.3780,
    targetPrice2: 1.3900,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: 'คู่เงิน Cable (GBP/USD) มีความผันผวนและระยะวิ่งต่อวันสูง เหมาะสำหรับสาย Day Trade และ Swing Trade',
    strengths: [
      'ธนาคารกลางอังกฤษ (BOE) ชะลอการลดดอกเบี้ยเนื่องจากค่าจ้างภาคบริการยังแข็งแกร่ง',
      'Technical Setup ทรงตัวเหนือเส้น EMA20/50 ได้อย่างแข็งแรง'
    ],
    risks: [
      'แผนงบประมาณและนโยบายภาษีของรัฐบาลสหราชอาณาจักร',
      'ความผันผวนของตัวเลขเศรษฐกิจสหรัฐฯ'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 1.3644 (อ้างอิง Forex Interbank) ปอนด์สเตอร์ลิงมีโครงสร้างแข็งแกร่ง แนะนำกลยุทธ์ Buy on Dip ที่ 1.3580-1.3620 วาง Stop Loss ที่ 1.3420 เป้าหมายทำกำไร 1.3780 และ 1.3900',
    candles: generateCandles(1.3644, 'UPTREND', 0.008, 60, 4),
  },
  {
    symbol: 'USD/THB',
    name: 'US Dollar / Thai Baht',
    market: 'FOREX',
    assetCategory: 'FOREX',
    sector: 'Exotic Currency / Local Macro',
    currency: 'THB',
    currentPrice: 32.68,
    change: -0.05,
    changePercent: -0.15,
    high52w: 37.15,
    low52w: 32.10,
    volume: 2100000,
    avgVolume30d: 2300000,
    
    // Macro Fundamentals
    pe: 0,
    industryPe: 0,
    pbv: 0,
    roe: 0,
    dividendYield: 0,
    de: 0,
    netMargin: 0,
    revenueGrowth: 0,
    eps: 0,
    fairValue: 33.50,
    marginOfSafety: 2.51,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 80,

    forexMacro: {
      pairType: 'EXOTIC',
      baseCurrency: 'USD',
      quoteCurrency: 'THB (Thailand)',
      baseInterestRate: 4.50,
      quoteInterestRate: 2.25,
      interestRateDifferential: 2.25,
      baseCentralBank: 'Federal Reserve (Fed)',
      quoteCentralBank: 'Bank of Thailand (BOT)',
      centralBankStance: 'BOT: Easing Policy (2.25%) | Fed: Easing Cycle',
      baseInflationRate: 2.6,
      quoteInflationRate: 0.8,
      pipValuePerStandardLot: 3.06,
      spreadPips: 2.5,
      dailyATR: 25.0, // 0.25 THB
      cotSentiment: 'NEUTRAL',
      dxyCorrelation: '+0.75',
      leverageStandard: '1:50'
    },

    // Technical
    trend: 'SIDEWAY',
    technicalScore: 74,
    rsi: 48.5,
    macdSignal: 'NEUTRAL',
    ema20: 32.85,
    ema50: 33.20,
    ema200: 34.50,
    support1: 32.50,
    support2: 32.10,
    resistance1: 33.20,
    resistance2: 33.80,
    stopLossPrice: 32.00,
    targetPrice1: 33.50,
    targetPrice2: 34.20,
    technicalSignal: 'ACCUMULATE',

    // Qualitative
    compositeRating: 'ACCUMULATE',
    businessDescription: 'อัตราแลกเปลี่ยนดอลลาร์สหรัฐต่อเงินบาทไทย สำคัญอย่างยิ่งต่อนักลงทุนไทยที่ลงทุนในต่างประเทศ (Hedging FX) และผู้ประกอบการนำเข้า-ส่งออก',
    strengths: [
      'เงินบาทแข็งค่าจากราคาทองคำโลกที่พุ่งสูงและดุลบัญชีเดินสะพัดภาคการท่องเที่ยว',
      'ระดับราคา 32.50-32.80 เป็นโซนต้นทุนที่น่าสนใจสำหรับการแลกเงิน USD เพื่อลงทุนหุ้นนอก'
    ],
    risks: [
      'ทิศทางนโยบายดอกเบี้ยของ ธปท. (กนง.) และทิศทางเงินทุนต่างชาติ Fund Flow',
      'มาตรการกระตุ้นเศรษฐกิจและการคลังของภาครัฐ'
    ],
    actionPlanSummary: 'ราคาปิดตลาดล่าสุด 32.68 บาท/ดอลลาร์ (อ้างอิง อัตราแลกเปลี่ยนสากล/ธปท.) สำหรับนักลงทุนที่ต้องการแลกเงินไปลงทุนหุ้นสหรัฐฯ โซน 32.50-32.80 เป็นจุดสะสมต้นทุนแลกเปลี่ยนที่ได้เปรียบ วาง Stop Loss หากหลุด 32.00 บาท เล็งเป้าหมายรีบาวด์ 33.50 และ 34.00 บาท',
    candles: generateCandles(32.68, 'SIDEWAY', 0.009, 60, 2),
  }
];

/**
 * Creates or derives a dynamic stock data for any requested symbol
 */
export function createDynamicStockData(
  symbolInput: string,
  customName?: string,
  customPrice?: number
): StockData {
  const sym = symbolInput.trim().toUpperCase();
  
  // Check if exists in INITIAL_STOCKS
  const existing = INITIAL_STOCKS.find((s) => s.symbol.toUpperCase() === sym);
  if (existing) return existing;

  const isUS = sym.length <= 4 && !sym.includes('/') && ['MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'COIN'].includes(sym);
  const isForex = sym.includes('/');

  const market: MarketType = isForex ? 'FOREX' : isUS ? 'US' : 'SET';
  const assetCategory: AssetCategory = isForex ? 'FOREX' : isUS ? 'GLOBAL_STOCK' : 'THAI_STOCK';
  const currency = isUS ? 'USD' : 'THB';

  const defaultPrice = customPrice || (
    isUS ? 185.00 : isForex ? 34.50 : 35.00
  );

  const price = Number(defaultPrice.toFixed(2));
  const changePercent = Number(((Math.random() * 4) - 1.5).toFixed(2));
  const change = Number(((price * changePercent) / 100).toFixed(2));

  const fairValue = Number((price * 1.15).toFixed(2));
  const marginOfSafety = Number((((fairValue - price) / fairValue) * 100).toFixed(2));

  const support1 = Number((price * 0.96).toFixed(2));
  const support2 = Number((price * 0.92).toFixed(2));
  const resistance1 = Number((price * 1.05).toFixed(2));
  const resistance2 = Number((price * 1.12).toFixed(2));
  const stopLossPrice = Number((price * 0.94).toFixed(2));
  const targetPrice1 = resistance1;
  const targetPrice2 = resistance2;

  const ema20 = Number((price * 0.985).toFixed(2));
  const ema50 = Number((price * 0.965).toFixed(2));
  const ema200 = Number((price * 0.92).toFixed(2));

  return {
    symbol: sym,
    name: customName || `${sym} (${market} Listed Asset)`,
    market,
    assetCategory,
    sector: market === 'SET' ? 'General Commercial / Industry' : 'Global Tech / Asset',
    currency,
    currentPrice: price,
    change,
    changePercent,
    high52w: Number((price * 1.25).toFixed(2)),
    low52w: Number((price * 0.75).toFixed(2)),
    volume: 15000000,
    avgVolume30d: 12000000,
    
    // Fundamental
    pe: 18.5,
    industryPe: 22.0,
    pbv: 2.2,
    roe: 14.5,
    dividendYield: 3.2,
    de: 1.2,
    netMargin: 12.5,
    revenueGrowth: 9.8,
    eps: Number((price / 18.5).toFixed(2)),
    fairValue,
    marginOfSafety,
    valuationStatus: 'UNDERVALUED',
    fundamentalScore: 84,
    dcfValue: Number((fairValue * 1.03).toFixed(2)),
    grahamValue: Number((fairValue * 0.95).toFixed(2)),

    // Technical
    trend: 'UPTREND',
    technicalScore: 82,
    rsi: 58.5,
    macdSignal: 'BULLISH_CROSSOVER',
    ema20,
    ema50,
    ema200,
    support1,
    support2,
    resistance1,
    resistance2,
    stopLossPrice,
    targetPrice1,
    targetPrice2,
    technicalSignal: 'BUY_ON_DIP',

    // Qualitative
    compositeRating: 'BUY',
    businessDescription: `สินทรัพย์/หุ้น ${sym} จดทะเบียนในตลาด ${market} มีการเคลื่อนไหวของราคาและวอลุ่มที่น่าสนใจ พร้อมสำหรับการวิเคราะห์ทางเทคนิคและสวิงเทรด`,
    strengths: [
      'สัญญาณโมเมนตัมราคายืนเหนือระดับแนวรับสำคัญ',
      'มีอัตรา Risk/Reward Ratio ที่คุ้มค่าต่อการวางแผนเข้าทำกำไร'
    ],
    risks: [
      'ความผันผวนของราคาตามสภาวะตลาดรวม',
      'ควรตั้ง Stop Loss เคร่งครัดตามวินัยการเทรด'
    ],
    actionPlanSummary: `ราคาปิดล่าสุด ${price} ${currency} สัญญาณเทคนิคัลอยู่ในโซนสะสม แนะนำเข้าซื้อบริเวณ ${support1}-${price} ${currency} วาง Stop Loss ที่ ${stopLossPrice} ${currency} เล็งเป้าหมาย ${targetPrice1} และ ${targetPrice2} ${currency}`,
    candles: generateCandles(price, 'UPTREND', 0.015, 60, 2),
  };
}

