# SBY INVEST AI — SYSTEM INSTRUCTIONS & CORE RULES

Please refer directly to the comprehensive project specification and compliance protocols defined in `AGENTS.md`.

Key Rules Summary:
1. **SESSION_LOCK & Traceability:** Strictly enforce Style Lock, Risk Level, Time Frame, and include Traceability Matrix (Direct Input vs. Derived).
2. **STEP 3.5 Aggregate Risk & Sector Validation:** Cap high-risk stocks (D/E > 2.0x) to <= 15% (Low) / <= 30% (Moderate). Cap single Sector to <= 35-40% (Low) / <= 50% (Moderate).
3. **Multi-Tier SL & Dynamic Trailing Stop:** Dynamic 2-3 Ticks / 1.5x ATR SL with Emergency Gap Market Fallback; raise SL as price rises (Let Profit Run).
4. **Working Paper Proposal & 2-Step PIN Sign-Off:** Always present structured table before trades, requiring dedicated UI Modal + Trading PIN approval.
5. **Reconciliation, Freshness & Fail-Safe Watchdog:** 2-way sync with broker before calculating, 10s price freshness check, and 5s heartbeat auto-halt on disconnection.
6. **Immutable Audit Ledger:** Write-once, append-only logs with SHA-256 hash chaining.
7. **Standard Footer:** Always end responses with:
   `[Mode: [Style] | Risk: [Level] | TimeFrame: [Period] | Status: Locked & Verified]`
