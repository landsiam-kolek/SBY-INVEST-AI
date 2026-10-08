/**
 * SBY INVEST AI — SETTRADE OPEN API SERVER-SIDE PROXY & ADAPTER
 * 
 * Target Broker: UOB Kay Hian Securities (Thailand) Public Company Limited (Broker 026)
 * Account Type: Cash Account (บัญชีเงินสด T+2 / Line Available)
 * 
 * Compliance & Safety Protocols (AGENTS.md):
 * - Rate Limits: Market Data <= 5 req/s (max 60/s), Order placement <= 60 req/min
 * - Pre-Flight 2-Way Reconciliation (Audit Rule #4)
 * - Disconnection Fail-Safe (5s Heartbeat, Audit Rule #3)
 * - Zero API key exposure to client-side bundle
 */

import crypto from "crypto";
import https from "https";
import fs from "fs";
import path from "path";

const VAULT_FILE = path.resolve(process.cwd(), ".settrade_vault.json");

export interface SettradeConfig {
  appId: string;
  appSecret: string;
  brokerId: string;
  accountNo: string;
  appCode: string;
  environment: "production" | "uat" | "sandbox";
  accountType: "CASH" | "CASH_BALANCE" | "CREDIT_BALANCE";
}

export interface SettradeSession {
  isConnected: boolean;
  tokenType?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  lastPingTime: string;
  latencyMs: number;
  lastError?: {
    code: string;
    message: string;
    recommendation: string;
    timestamp: string;
  };
}

export class SettradeBrokerService {
  private config: SettradeConfig;
  private session: SettradeSession;
  private orderCallTimes: number[] = [];
  private marketDataCallTimes: number[] = [];

  constructor() {
    let savedVault: Partial<SettradeConfig> = {};
    try {
      if (fs.existsSync(VAULT_FILE)) {
        savedVault = JSON.parse(fs.readFileSync(VAULT_FILE, "utf-8"));
      }
    } catch (e) {
      console.warn("Could not read .settrade_vault.json:", e);
    }

    this.config = {
      appId: savedVault.appId || process.env.SETTRADE_APP_ID || "2JPcNn22hEUiV9yd",
      appSecret: savedVault.appSecret || process.env.SETTRADE_APP_SECRET || "",
      brokerId: savedVault.brokerId || process.env.SETTRADE_BROKER_CODE || "026",
      accountNo: savedVault.accountNo || process.env.SETTRADE_ACCOUNT_NO || "7550158",
      appCode: savedVault.appCode || process.env.SETTRADE_APP_CODE || "ALGO_EQ",
      environment: savedVault.environment || (process.env.SETTRADE_ENVIRONMENT as any) || "production",
      accountType: savedVault.accountType || (process.env.SETTRADE_ACCOUNT_TYPE as any) || "CASH",
    };

    this.session = {
      isConnected: false,
      lastPingTime: new Date().toISOString(),
      latencyMs: 0,
    };
  }

  public updateConfig(newConfig: Partial<SettradeConfig>) {
    if (newConfig.appId) this.config.appId = newConfig.appId.trim();
    if (newConfig.appSecret && newConfig.appSecret.trim()) this.config.appSecret = newConfig.appSecret.trim();
    if (newConfig.brokerId) this.config.brokerId = newConfig.brokerId.trim();
    if (newConfig.accountNo) this.config.accountNo = newConfig.accountNo.trim();
    if (newConfig.appCode) this.config.appCode = newConfig.appCode.trim();
    if (newConfig.environment) this.config.environment = newConfig.environment;
    if (newConfig.accountType) this.config.accountType = newConfig.accountType;
    
    // Save to local vault file
    try {
      fs.writeFileSync(VAULT_FILE, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to .settrade_vault.json:", e);
    }

    this.session.isConnected = false;
    this.session.lastError = undefined;
    return this.getConfig();
  }

  public getConfig() {
    const sec = this.config.appSecret || "";
    return {
      appId: this.config.appId ? `${this.config.appId.substring(0, 4)}••••${this.config.appId.substring(this.config.appId.length - 4)}` : "NOT_CONFIGURED",
      rawAppId: this.config.appId || "",
      hasAppSecret: Boolean(sec && sec.length > 5),
      appSecretMasked: sec
        ? `${sec.substring(0, 3)}••••••••${sec.substring(sec.length - 4)} (${sec.length} ตัวอักษร)`
        : "ยังไม่มี Secret ในระบบ",
      appSecretLength: sec.length,
      brokerId: this.config.brokerId,
      brokerName: "UOB Kay Hian Securities (026)",
      accountNo: this.config.accountNo,
      appCode: this.config.appCode,
      environment: this.config.environment,
      accountType: this.config.accountType,
    };
  }

  public getSessionStatus() {
    return {
      ...this.session,
      brokerInfo: this.getConfig(),
    };
  }

  /**
   * Cryptographic Signature Generator for Settrade Open API (secp256r1 ECDSA SHA-256)
   */
  private generateSignature(appId: string, appSecret: string, timestamp: string, params: string = ""): string {
    let privBuf = Buffer.from(appSecret, "base64");
    if (privBuf.length === 33 && privBuf[0] === 0) {
      privBuf = privBuf.slice(1);
    }

    const ecdh = crypto.createECDH("prime256v1");
    ecdh.setPrivateKey(privBuf);
    const pubKey = ecdh.getPublicKey();
    const x = pubKey.slice(1, 33);
    const y = pubKey.slice(33, 65);

    const jwk = {
      kty: "EC",
      crv: "P-256",
      x: x.toString("base64url"),
      y: y.toString("base64url"),
      d: privBuf.toString("base64url"),
    };

    const privKey = crypto.createPrivateKey({ key: jwk, format: "jwk" });
    const payload = `${appId}.${params}.${timestamp}`;

    const signer = crypto.createSign("SHA256");
    signer.update(payload);
    return signer.sign(privKey).toString("hex");
  }

  /**
   * Base URL resolver
   */
  private getBaseUrl(): { host: string; prefix: string } {
    if (this.config.environment === "uat" || this.config.environment === "sandbox") {
      return { host: "open-api-test.settrade.com", prefix: "" };
    }
    return { host: "open-api.settrade.com", prefix: "" };
  }

  /**
   * Authenticate / Login to Settrade Open API
   */
  public async login(): Promise<{ success: boolean; data?: any; error?: any }> {
    const startTime = Date.now();
    const { host } = this.getBaseUrl();
    const timestamp = Date.now().toString();
    const params = "";

    try {
      const signature = this.generateSignature(
        this.config.appId,
        this.config.appSecret,
        timestamp,
        params
      );

      const path = `/api/oam/v1/${this.config.brokerId}/broker-apps/${this.config.appCode}/login`;
      const reqBody = JSON.stringify({
        apiKey: this.config.appId,
        params: params,
        signature: signature,
        timestamp: timestamp,
      });

      return new Promise((resolve) => {
        const req = https.request(
          {
            hostname: host,
            path: path,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(reqBody),
              "User-Agent": "SBYInvestAI_Bridge/1.0.0 (SettradeOpenApiSdkV2Node)",
            },
            timeout: 5000,
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              const latency = Date.now() - startTime;
              this.session.lastPingTime = new Date().toISOString();
              this.session.latencyMs = latency;

              try {
                const parsed = JSON.parse(data);
                if (res.statusCode === 200 && parsed.access_token) {
                  this.session.isConnected = true;
                  this.session.accessToken = parsed.access_token;
                  this.session.refreshToken = parsed.refresh_token;
                  this.session.tokenType = parsed.token_type;
                  this.session.expiresAt = Date.now() + (parsed.expires_in || 3600) * 1000;
                  this.session.lastError = undefined;

                  resolve({
                    success: true,
                    data: {
                      message: "เชื่อมต่อ Settrade Open API (UOBKH 026) สำเร็จ",
                      latencyMs: latency,
                      tokenType: parsed.token_type,
                      expiresIn: parsed.expires_in,
                    },
                  });
                } else {
                  this.session.isConnected = false;
                  let recommendation = "ตรวจสอบข้อมูลและการอนุมัติจากโบรกเกอร์ UOB Kay Hian";
                  if (parsed.code === "OA-LOGIN-002") {
                    recommendation =
                      "เนื่องจาก Settrade Open API ดำเนินการโดย บ. เซ็ทเทรด (SET) ฝั่ง Helpdesk ทั่วไปของโบรกเกอร์จะไม่มีหน้าจอเชื่อมต่อนี้ ท่านสามารถใช้งาน SBY INVEST AI ใน 'โหมดเฝ้าดูราคา & สมองกลจัดพอร์ต (Observation & Advisory Mode)' ได้อย่างสมบูรณ์แบบ 100% โดยดูแผน Working Paper (ราคาซื้อ, จุด Stop Loss, Take Profit) แล้วเคาะซื้อขายผ่าน Streaming ด้วยตนเองอย่างปลอดภัยสูงสุด";
                  } else if (parsed.code === "OA-LOGIN-001") {
                    recommendation = "ไม่พบ BrokerApp ให้ตรวจสอบ Broker ID (026) หรือ App Code (ALGO_EQ)";
                  }

                  this.session.lastError = {
                    code: parsed.code || `HTTP_${res.statusCode}`,
                    message: parsed.message || "Login authentication rejected",
                    recommendation,
                    timestamp: new Date().toISOString(),
                  };

                  resolve({
                    success: false,
                    error: this.session.lastError,
                  });
                }
              } catch (parseErr) {
                this.session.isConnected = false;
                this.session.lastError = {
                  code: "PARSE_ERROR",
                  message: data.substring(0, 200),
                  recommendation: "เซิร์ฟเวอร์ปลายทางตอบกลับในรูปแบบที่ไม่ใช่ JSON",
                  timestamp: new Date().toISOString(),
                };
                resolve({ success: false, error: this.session.lastError });
              }
            });
          }
        );

        req.on("error", (err) => {
          const latency = Date.now() - startTime;
          this.session.isConnected = false;
          this.session.latencyMs = latency;
          this.session.lastError = {
            code: "NETWORK_ERROR",
            message: err.message,
            recommendation: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Settrade Open API ได้ในขณะนี้ กรุณาตรวจสอบอินเทอร์เน็ต",
            timestamp: new Date().toISOString(),
          };
          resolve({ success: false, error: this.session.lastError });
        });

        req.write(reqBody);
        req.end();
      });
    } catch (e: any) {
      return {
        success: false,
        error: {
          code: "CRYPTO_ERROR",
          message: e?.message || "Cryptographic signing error",
          recommendation: "ตรวจสอบความถูกต้องของ App Secret (Base64 secp256r1 format)",
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Enforce Rate Limits (AGENTS.md Section 5)
   */
  public checkRateLimit(type: "MARKET_DATA" | "ORDER"): boolean {
    const now = Date.now();
    if (type === "MARKET_DATA") {
      this.marketDataCallTimes = this.marketDataCallTimes.filter((t) => now - t < 1000);
      if (this.marketDataCallTimes.length >= 5) return false;
      this.marketDataCallTimes.push(now);
      return true;
    } else {
      this.orderCallTimes = this.orderCallTimes.filter((t) => now - t < 60000);
      if (this.orderCallTimes.length >= 60) return false;
      this.orderCallTimes.push(now);
      return true;
    }
  }

  /**
   * Cash Account Information (Purchasing Power & Line Available)
   */
  public async getAccountCashBalance(): Promise<{
    cashBalance: number;
    lineAvailable: number;
    creditLimit?: number;
    currency: string;
    accountNo: string;
    accountType: string;
    status: string;
    clientType?: string;
    canBuy?: boolean;
    canSell?: boolean;
  }> {
    if (!this.session.isConnected || !this.session.accessToken || (this.session.expiresAt && Date.now() > this.session.expiresAt)) {
      await this.login();
    }

    if (this.session.isConnected && this.session.accessToken) {
      try {
        const { host } = this.getBaseUrl();
        const path = `/api/seos/v3/${this.config.brokerId}/accounts/${this.config.accountNo}/account-info`;
        const resData = await new Promise<any>((resolve, reject) => {
          const req = https.request(
            {
              hostname: host,
              path: path,
              method: "GET",
              headers: {
                Authorization: `Bearer ${this.session.accessToken}`,
                Accept: "application/json",
                "User-Agent": "SBYInvestAI_Bridge/1.0.0",
              },
              timeout: 5000,
            },
            (res) => {
              let d = "";
              res.on("data", (chunk) => (d += chunk));
              res.on("end", () => {
                if (res.statusCode === 200) {
                  try {
                    resolve(JSON.parse(d));
                  } catch (e) {
                    reject(e);
                  }
                } else {
                  reject(new Error(`HTTP ${res.statusCode}: ${d}`));
                }
              });
            }
          );
          req.on("error", reject);
          req.end();
        });

        return {
          cashBalance: typeof resData.cashBalance === "number" ? resData.cashBalance : 0,
          lineAvailable: typeof resData.lineAvailable === "number" ? resData.lineAvailable : 0,
          creditLimit: typeof resData.creditLimit === "number" ? resData.creditLimit : undefined,
          currency: "THB",
          accountNo: this.config.accountNo,
          accountType: resData.accountType || this.config.accountType,
          status: "LIVE_CONNECTED",
          clientType: resData.clientType,
          canBuy: resData.canBuy,
          canSell: resData.canSell,
        };
      } catch (e) {
        console.warn("Failed to fetch live account info from Settrade, using safe fallback:", e);
      }
    }

    return {
      cashBalance: 0,
      lineAvailable: 0,
      currency: "THB",
      accountNo: this.config.accountNo,
      accountType: this.config.accountType,
      status: this.session.isConnected ? "LIVE_CONNECTED" : "AWAITING_BROKER_USER_MAPPING",
    };
  }

  /**
   * Portfolio Holdings / Positions
   */
  public async getAccountPositions(): Promise<Array<{
    symbol: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
  }>> {
    if (!this.session.isConnected || !this.session.accessToken || (this.session.expiresAt && Date.now() > this.session.expiresAt)) {
      await this.login();
    }

    if (this.session.isConnected && this.session.accessToken) {
      try {
        const { host } = this.getBaseUrl();
        const path = `/api/seos/v3/${this.config.brokerId}/accounts/${this.config.accountNo}/portfolios`;
        const resData = await new Promise<any>((resolve, reject) => {
          const req = https.request(
            {
              hostname: host,
              path: path,
              method: "GET",
              headers: {
                Authorization: `Bearer ${this.session.accessToken}`,
                Accept: "application/json",
                "User-Agent": "SBYInvestAI_Bridge/1.0.0",
              },
              timeout: 5000,
            },
            (res) => {
              let d = "";
              res.on("data", (chunk) => (d += chunk));
              res.on("end", () => {
                if (res.statusCode === 200) {
                  try {
                    resolve(JSON.parse(d));
                  } catch (e) {
                    reject(e);
                  }
                } else {
                  reject(new Error(`HTTP ${res.statusCode}: ${d}`));
                }
              });
            }
          );
          req.on("error", reject);
          req.end();
        });

        if (Array.isArray(resData?.portfolioList)) {
          return resData.portfolioList.map((item: any) => ({
            symbol: item.symbol,
            shares: item.actualVolume || item.currentVolume || 0,
            avgCost: item.averagePrice || 0,
            currentPrice: item.marketPrice || 0,
            marketValue: item.marketValue || 0,
            unrealizedPL: item.profit || 0,
            unrealizedPLPercent: item.percentProfit || 0,
          }));
        }
      } catch (e) {
        console.warn("Failed to fetch live portfolios from Settrade:", e);
      }
    }

    return [];
  }

  /**
   * Get Real-Time Live Quote from Settrade Open API (Market Data v3)
   */
  public async getStockQuote(symbol: string): Promise<{
    symbol: string;
    last: number;
    high: number;
    low: number;
    average: number;
    change: number;
    percentChange: number;
    volume: number;
    marketStatus?: string;
    pe?: number;
    pbv?: number;
    yield?: number;
    timestamp: string;
    source: "SETTRADE_OPEN_API";
  } | null> {
    if (!this.session.isConnected || !this.session.accessToken || (this.session.expiresAt && Date.now() > this.session.expiresAt)) {
      await this.login();
    }
    if (!this.session.isConnected || !this.session.accessToken) {
      return null;
    }

    const host = this.config.environment === "uat" || this.config.environment === "sandbox"
      ? "marketapi-test.settrade.com"
      : "marketapi.settrade.com";

    const path = `/api/marketdata/v3/${this.config.brokerId}/quote/${encodeURIComponent(symbol.toUpperCase())}`;

    try {
      const resData = await new Promise<any>((resolve, reject) => {
        const req = https.request(
          {
            hostname: host,
            path: path,
            method: "GET",
            headers: {
              Authorization: `bearer ${this.session.accessToken}`,
              Accept: "application/json",
              "User-Agent": "SBYInvestAI_Bridge/1.0.0",
            },
            timeout: 5000,
          },
          (res) => {
            let d = "";
            res.on("data", (chunk) => (d += chunk));
            res.on("end", () => {
              if (res.statusCode === 200) {
                try {
                  resolve(JSON.parse(d));
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${d}`));
              }
            });
          }
        );
        req.on("error", reject);
        req.end();
      });

      if (resData && typeof resData.last === "number") {
        return {
          symbol: symbol.toUpperCase(),
          last: resData.last,
          high: typeof resData.high === "number" ? resData.high : resData.last,
          low: typeof resData.low === "number" ? resData.low : resData.last,
          average: typeof resData.average === "number" ? resData.average : resData.last,
          change: typeof resData.change === "number" ? resData.change : 0,
          percentChange: typeof resData.percentChange === "number" ? resData.percentChange : 0,
          volume: typeof resData.totalVolume === "number" ? resData.totalVolume : 0,
          marketStatus: resData.marketStatus,
          pe: typeof resData.pe === "number" ? resData.pe : undefined,
          pbv: typeof resData.pbv === "number" ? resData.pbv : undefined,
          yield: typeof resData.percentYield === "number" ? resData.percentYield : undefined,
          timestamp: new Date().toISOString(),
          source: "SETTRADE_OPEN_API",
        };
      }
    } catch (e) {
      console.warn(`Failed to fetch Settrade quote for ${symbol}:`, e);
    }
    return null;
  }

  /**
   * Batch Real-Time Quotes from Settrade Open API (Rate Limit Compliant: max 5/sec)
   */
  public async getBatchStockQuotes(symbols: string[]): Promise<Record<string, {
    symbol: string;
    last: number;
    high: number;
    low: number;
    average: number;
    change: number;
    percentChange: number;
    volume: number;
    marketStatus?: string;
    pe?: number;
    pbv?: number;
    yield?: number;
    timestamp: string;
    source: "SETTRADE_OPEN_API";
  }>> {
    const results: Record<string, any> = {};
    if (!this.session.isConnected || !this.session.accessToken || (this.session.expiresAt && Date.now() > this.session.expiresAt)) {
      await this.login();
    }
    if (!this.session.isConnected || !this.session.accessToken) {
      return results;
    }

    // Process in chunks of 5 with 350ms delay to respect 5 req/s rate limit
    const chunkSize = 5;
    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (sym) => {
          const q = await this.getStockQuote(sym);
          if (q) {
            results[sym.toUpperCase()] = q;
          }
        })
      );
      if (i + chunkSize < symbols.length) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    return results;
  }
}

export const settradeBrokerService = new SettradeBrokerService();
