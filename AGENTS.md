# SBY INVEST AI — SYSTEM ARCHITECTURE, AGENT INSTRUCTIONS & AUDIT SPECIFICATION

> **Note for AI Agent / Google AI Studio Build Agent:**
> This file is the authoritative single source of truth for SBY INVEST AI. It defines the core quantitative engine rules, compliance standards, risk guardrails, data pipeline architecture, and trade execution protocols agreed upon with the project owner (`landsiam@gmail.com`).

---

## 1. Project Context & Identity
* **Application Name:** SBY INVEST AI
* **Purpose:** Quantitative Investment Analysis, Value Investing (VI) Screener, and Portfolio Construction Engine with strict Audit-Ready Compliance and Risk Control.
* **Technology Stack:**
  * **Frontend:** React 18+ (Vite, TypeScript, Tailwind CSS, Lucide icons)
  * **Backend:** Node.js Express (`server.ts`, TypeScript, REST API Proxy)
  * **Hosting:** Google Cloud Run Container

---

## 2. Core Compliance Protocols & Session Lock (Mandatory Rules)

### 2.1 SESSION_LOCK Enforcement
Every session must maintain and display the user's active session lock parameters:
```json
SESSION_LOCK = {
  "style": "[VI / Growth / Long-term / Dividend / Technical]",
  "risk_level": "[ต่ำ / ปานกลาง / สูง]",
  "time_frame": "[6M / 12M / Specified]",
  "locked_at": "[timestamp]"
}
```
* **Style Isolation:** No cross-style logic or narratives (e.g., RSI/technical questions during VI mode must be intercepted and requested for confirmation).
* **2-Step Switch Confirmation:** Any style/risk switch requested by the user requires a clear 2-step confirmation dialog before altering the state.
* **Mandatory Footer:** Every analysis or response must conclude with the standard footer:
  `[Mode: [Style] | Risk: [Level] | TimeFrame: [Period] | Status: Locked & Verified]`

### 2.2 Traceability & Zero-Hallucination Policy
* Every output must be presented in a **Traceability Table** classifying each data point into **Direct Input** vs. **Derived (Formulas)**.
* If any parameter (e.g., Stop Loss, Dividend) is missing or undefined, it must explicitly state **"ข้อมูลไม่เพียงพอ"** (Insufficient Data) — never invent or assume values.

---

## 3. Quantitative Engine & Portfolio Steps (STEP 1 - 5)

* **STEP 1: Margin of Safety (MOS) & Outlier Guardrail (Guardrail A)**
  * $\text{MOS} = \frac{\text{Fair Value} - \text{Price}}{\text{Fair Value}} \times 100 > 0\%$
  * **Guardrail A (Outlier Check):** If $\text{Capital Gain} > 30\%$, attach `⚠️ OUTLIER` warning flag.
* **STEP 2: Capital-Tied Sizing**
  * $< 50,000$ THB: 2-3 stocks
  * $50,000 - 300,000$ THB: 3-5 stocks
  * $> 300,000$ THB: 5-8 stocks
* **STEP 3: MOS-Weighted Allocation & Guardrail B (Max Weight Cap)**
  * Initial Weight $= \frac{\text{MOS}_i}{\sum \text{MOS}} \times 100$
  * **Guardrail B:** Max 40% (general), Max 30% for high-debt stocks ($D/E > 2.0x$).
  * Excess weight is re-allocated proportionally to remaining eligible stocks by residual MOS.
* **STEP 3.5: AGGREGATE RISK VALIDATION (Portfolio & Sector Check)**
  * $\text{Aggregate\_High\_Risk\_\%} = \sum \text{Weights of all stocks with } D/E > 2.0x$
  * **Ceilings by Risk Level (High-Debt D/E > 2.0x):**
    * **ต่ำ (Low / Conservative):** $\le 15\%$
    * **ปานกลาง (Moderate):** $\le 30\%$
    * **สูง (High):** No additional aggregate ceiling (uses Guardrail B).
  * **Sector Concentration Ceiling (Audit Rule #5):**
    * **ต่ำ (Low / Conservative):** Max Sector Weight $\le 35\% - 40\%$ (กระจายอย่างน้อย 3 Sectors)
    * **ปานกลาง (Moderate):** Max Sector Weight $\le 50\%$ (กระจายอย่างน้อย 2-3 Sectors)
    * **สูง (High):** Max Sector Weight $\le 60\%$
  * **Actions:**
    * If $\le \text{Ceiling}$: Pass.
    * If $90\% - 100\%$ of Ceiling: Attach Edge Case warning.
    * If $> \text{Ceiling}$: **Strict Rejection** ➔ Recalculate STEP 3 by lowering high-risk/sector cap to meet ceiling, and allocate remaining to safe stocks / Cash Buffer.
* **Layer 2: Intent Consistency Check**
  * Cross-field audit of user intent vs. actual mathematical output.
  * If conflicting: Highlight in a dedicated `🔍 INTENT MISMATCH DETECTED` section.
* **STEP 4: Split Expected Return**
  * $\text{Total Return} = \text{Capital Gain} + \text{Dividend Yield}$
  * Portfolio Expected Return $= \sum (\text{Weight}_i \times \text{Total Return}_i)$
* **STEP 5: Portfolio Stop Loss & Max Drawdown**
  * Portfolio Max Loss $= \sum (\text{Weight}_i \times \text{Stop Loss \%}_i)$

---

## 4. Trading & Risk Management Protocol (Anti-Flow / Anti-Drain & Audit Security Suite)

### 4.1 Execution Philosophy: Human-in-the-Loop Sign-Off (Audit Rule #7)
1. **Working Paper Proposal First:** Before any execution, SBY INVEST AI generates a **Portfolio Working Paper Table** (Entry, Multi-Tier SL, Target TP, Allocation Amount, Risk:Reward).
2. **2-Step Secure Modal Sign-Off:** Execution happens only after explicit user confirmation with Trading PIN & Acknowledgement Checkbox in dedicated UI Modal.

### 4.2 Multi-Tier Stop Loss & Dynamic Trailing Stop (Audit Rule #1 & #2)
* **Multi-Tier SL Definition:**
  * **Tier A (Fixed Buffer):** Entry Price minus 2-3 SET Ticks (Default 2 Ticks for Large-Cap) to avoid Market Noise.
  * **Tier B (ATR-Adaptive Buffer):** $\text{Stop Loss} = \text{Entry Price} - \max(1.5 \times \text{ATR}_{14}, 2\text{ Ticks})$.
  * **Backtest Verification:** Backtest engine provides statistical validation comparing 1-Tick, 2-Tick, 3-Tick, and 1.5x ATR.
* **Gap-Down & Market SL Fallback (Audit Rule #2):**
  * If price opens or gaps down below Stop Loss price without limit fill, trigger immediate **Emergency Market Order Fallback** to protect principal.
* **Dynamic Trailing Stop:** As the price moves up into profit, the SL is systematically raised by ticks to lock in profit (`Lock Profit / TP`). The stop loss only moves UP, never down.

### 4.3 Pre-Flight Reconciliation & Data Watchdog (Audit Rule #4 & #6)
* **Pre-Flight 2-Way Reconciliation:** Before calculating Working Paper, verify Cash Balance & Positions with actual broker account. In case of mismatch, halt and alert.
* **Data Freshness Watchdog:** Price feeds must have valid timestamp. If price is stale (> 10s delay during market hours), disable Working Paper approval and alert user.

### 4.4 Disconnection Fail-Safe & Immutable Audit Log (Audit Rule #3 & #8)
* **Disconnection Fail-Safe:** 5-second Heartbeat ping. If disconnected, trigger `SAFE_HALT_MODE` (stop all actions, auto-reconnect with exponential backoff, do NOT guess state).
* **Immutable Hash-Chained Audit Log:** All decisions, working papers, timestamps, and user sign-offs are logged in write-once, append-only records with SHA-256 hash chaining.

---

## 5. Market Data & Broker Integration Roadmap

* **Current Data Source:** Siamchart EOD / SET Snapshot Feed (Sanitized historical & daily closing data).
* **Upcoming Integration:** **Settrade Open API (UOB Kay Hian Broker Agreement)**:
  * Open API via REST / Web API / Python SDK Bridge (`settrade_v2`).
  * Rate Limits: Market Data $\le 5$ req/s (max 60/s), Order placement $\le 60$ req/min.
  * Backend Proxy in `server.ts` handles API keys securely.
