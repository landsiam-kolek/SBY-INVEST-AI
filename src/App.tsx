import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { OnboardingObjectiveModal } from './components/OnboardingObjectiveModal';
import { AIPortfolioBuilder } from './components/AIPortfolioBuilder';
import { MyPortfolioTracker } from './components/MyPortfolioTracker';
import { ExecutiveSummaryCard } from './components/ExecutiveSummaryCard';
import { FundamentalModule } from './components/FundamentalModule';
import { AnnualFinancialTrendChart } from './components/AnnualFinancialTrendChart';
import { ExecutiveGovernanceModule } from './components/ExecutiveGovernanceModule';
import { TechnicalModule } from './components/TechnicalModule';
import { TradeExecutionModule } from './components/TradeExecutionModule';
import { StockScreenerModal } from './components/StockScreenerModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { WatchlistModal } from './components/WatchlistModal';
import { MarketSelectionModal } from './components/MarketSelectionModal';
import { DayTradeTerminal } from './components/DayTradeTerminal';
import { DayTradeSetupModal } from './components/DayTradeSetupModal';
import { LivePriceSyncModal } from './components/LivePriceSyncModal';
import { LiveMarketControlBar } from './components/LiveMarketControlBar';
import { AddCustomTickerModal } from './components/AddCustomTickerModal';
import { AuditSimulationLabModal } from './components/AuditSimulationLabModal';
import { PortfolioWorkingPaperModal } from './components/PortfolioWorkingPaperModal';
import { PaperTradingSimulator } from './components/PaperTradingSimulator';
import { BeginnerGuideBanner } from './components/BeginnerGuideBanner';
import { useMarketDataFeed } from './hooks/useMarketDataFeed';
import { INITIAL_STOCKS } from './data/mockStocks';
import { 
  StockData, 
  WatchlistItem, 
  AssetCategory, 
  AuthUser, 
  InvestorProfile, 
  PortfolioItem,
  UserPosition,
  ClosedTrade,
  TradingMode,
  DayTradePortfolio,
  DayTradeTimeframe,
  DayTradeSetup,
  AIPortfolio
} from './types';
import { buildDayTradePortfolio, generateDayTradeSetup } from './utils/dayTradeEngine';
import { buildIntelligentPortfolio } from './utils/portfolioEngine';
import { updateStockWithNewPrice, REAL_MARKET_SNAPSHOT_PRESET } from './utils/priceSyncEngine';
import { 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Search, 
  SlidersHorizontal, 
  Bot, 
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Globe,
  Coins,
  Building2,
  Filter,
  LayoutDashboard,
  PieChart,
  Target,
  Zap,
  ShieldAlert,
  Flame,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

export default function App() {
  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('sby_theme') as 'dark' | 'light') || 'dark';
  });

  // User Authentication State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('sby_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Trading Mode ('STANDARD_VI' | 'DAY_TRADE')
  const [tradingMode, setTradingMode] = useState<TradingMode>(() => {
    try {
      return (localStorage.getItem('sby_trading_mode') as TradingMode) || 'STANDARD_VI';
    } catch {
      return 'STANDARD_VI';
    }
  });

  // Active View Mode ('analysis' | 'my-portfolio' | 'portfolio' | 'day-trade' | 'paper-trade')
  const [currentView, setCurrentView] = useState<'analysis' | 'my-portfolio' | 'portfolio' | 'day-trade' | 'paper-trade'>('portfolio');

  // Navigation history stack for seamless "Previous Page" return
  type AppView = 'analysis' | 'my-portfolio' | 'portfolio' | 'day-trade' | 'paper-trade';
  const [navigationHistory, setNavigationHistory] = useState<AppView[]>(['portfolio']);

  const getViewLabel = (view: AppView): string => {
    switch (view) {
      case 'portfolio':
        return 'AI จัดพอร์ต';
      case 'my-portfolio':
        return 'พอร์ตของฉัน';
      case 'day-trade':
        return 'Day Trade';
      case 'paper-trade':
        return 'จำลองเทรด';
      case 'analysis':
        return 'วิเคราะห์หุ้นรายตัว & กราฟ';
      default:
        return 'หน้าก่อนหน้า';
    }
  };

  const navigateToView = (nextView: AppView) => {
    if (nextView === currentView) return;
    setNavigationHistory((prev) => [...prev, currentView]);
    setCurrentView(nextView);
    try {
      window.history.pushState({ view: nextView }, '', '');
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const nextStack = [...navigationHistory];
      const prevView = nextStack.pop()!;
      setNavigationHistory(nextStack);
      setCurrentView(prevView);
      try {
        window.history.replaceState({ view: prevView }, '', '');
      } catch {
        // ignore
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const fallback: AppView = currentView === 'analysis' ? 'portfolio' : 'analysis';
      setCurrentView(fallback);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
      } else if (navigationHistory.length > 0) {
        handleGoBack();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigationHistory]);

  const lastHistoryView = navigationHistory.length > 0
    ? navigationHistory[navigationHistory.length - 1]
    : (currentView === 'analysis' ? 'portfolio' : null);

  const previousViewLabel = lastHistoryView ? getViewLabel(lastHistoryView) : 'หน้าก่อนหน้า';
  const canGoBack = navigationHistory.length > 0 || currentView === 'analysis';

  // Day Trade Portfolio State
  const [dayTradePortfolio, setDayTradePortfolio] = useState<DayTradePortfolio>(() => {
    try {
      const saved = localStorage.getItem('sby_day_trade_portfolio');
      if (saved) {
        const parsed: DayTradePortfolio = JSON.parse(saved);
        // Refresh stockData
        parsed.setups = parsed.setups.map((s) => {
          const fresh = INITIAL_STOCKS.find((st) => st.symbol === s.symbol);
          return fresh ? { ...s, stock: fresh } : s;
        });
        return parsed;
      }
      // Default initial day trade portfolio
      const focusStocks = [INITIAL_STOCKS[0], INITIAL_STOCKS[1], INITIAL_STOCKS[5] || INITIAL_STOCKS[2]];
      return buildDayTradePortfolio(focusStocks, 100000, '2_3_DAYS');
    } catch {
      const focusStocks = [INITIAL_STOCKS[0], INITIAL_STOCKS[1], INITIAL_STOCKS[5] || INITIAL_STOCKS[2]];
      return buildDayTradePortfolio(focusStocks, 100000, '2_3_DAYS');
    }
  });

  const [isDayTradeSetupOpen, setIsDayTradeSetupOpen] = useState<boolean>(false);

  // Investor Profile
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile>(() => {
    try {
      const saved = localStorage.getItem('sby_investor_profile');
      return saved ? JSON.parse(saved) : {
        capital: 200000,
        currency: 'THB',
        targetReturnPercent: 18,
        riskProfile: 'MODERATE',
        period: '6_12_MONTHS',
        preferredBoard: 'ALL',
        objective: 'GROWTH_MOMENTUM',
      };
    } catch {
      return {
        capital: 200000,
        currency: 'THB',
        targetReturnPercent: 18,
        riskProfile: 'MODERATE',
        period: '6_12_MONTHS',
        preferredBoard: 'ALL',
        objective: 'GROWTH_MOMENTUM',
      };
    }
  });

  // Modals
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState<boolean>(false);
  const [isScreenerOpen, setIsScreenerOpen] = useState<boolean>(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState<boolean>(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);
  const [isSearchingCustom, setIsSearchingCustom] = useState<boolean>(false);
  const [isPriceSyncModalOpen, setIsPriceSyncModalOpen] = useState<boolean>(false);
  const [isAddTickerModalOpen, setIsAddTickerModalOpen] = useState<boolean>(false);
  const [isAuditSimulationOpen, setIsAuditSimulationOpen] = useState<boolean>(false);
  const [isWorkingPaperOpen, setIsWorkingPaperOpen] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(() => new Date());

  // Stock Database & Current Stock
  const [allStocks, setAllStocks] = useState<StockData[]>(() => {
    const baseStocks = INITIAL_STOCKS.map(stock => {
      const sym = stock.symbol.toUpperCase();
      if (REAL_MARKET_SNAPSHOT_PRESET[sym]) {
        const p = REAL_MARKET_SNAPSHOT_PRESET[sym];
        return updateStockWithNewPrice(stock, p.close, p.prevClose, p.change, p.changePercent);
      }
      return stock;
    });
    try {
      const savedPort = localStorage.getItem('sby_day_trade_portfolio');
      if (savedPort) {
        const parsedPort = JSON.parse(savedPort);
        if (parsedPort.setups) {
          parsedPort.setups.forEach((setup: any) => {
            if (setup.stock && !baseStocks.some(s => s.symbol === setup.symbol)) {
              baseStocks.push(setup.stock);
            }
          });
        }
      }
    } catch (e) {
      // Ignore
    }
    return baseStocks;
  });
  const [currentStock, setCurrentStock] = useState<StockData>(() => {
    const first = INITIAL_STOCKS[0];
    const sym = first.symbol.toUpperCase();
    if (REAL_MARKET_SNAPSHOT_PRESET[sym]) {
      const p = REAL_MARKET_SNAPSHOT_PRESET[sym];
      return updateStockWithNewPrice(first, p.close, p.prevClose, p.change, p.changePercent);
    }
    return first;
  });

  // Dynamic Live Market Feed Engine Hook
  const {
    refreshInterval,
    setRefreshInterval,
    isRefreshing: isMarketRefreshing,
    lastUpdatedTime: liveFeedUpdatedTime,
    triggerRefresh: triggerMarketRefresh,
  } = useMarketDataFeed({
    stocks: allStocks,
    onUpdateStocks: (updated) => setAllStocks(updated),
    currentStock,
    onUpdateCurrentStock: (updatedStk) => setCurrentStock(updatedStk),
  });

  // User Tracked Positions (พอร์ตที่ user เลือกเอง)
  const [userPositions, setUserPositions] = useState<UserPosition[]>(() => {
    try {
      const saved = localStorage.getItem('sby_user_positions');
      if (saved) {
        const parsed: UserPosition[] = JSON.parse(saved);
        // Refresh stockData with latest benchmark data
        return parsed.map((p) => {
          const fresh = INITIAL_STOCKS.find((s) => s.symbol === p.symbol);
          return fresh ? { ...p, stockData: fresh } : p;
        });
      }
      return [
        {
          id: 'pos-1',
          symbol: 'CPALL',
          entryDate: '2025-02-10',
          entryPrice: 45.50,
          shares: 600,
          totalCost: 27300,
          targetPrice: 52.00,
          stopLossPrice: 44.00,
          strategyTag: 'VALUE_INVESTING',
          thesisNotes: 'ราคาโซนแนวรับ Valuation P/E ไม่แพง รอการฟื้นตัวของการบริโภค',
          stockData: INITIAL_STOCKS[0],
        },
        {
          id: 'pos-2',
          symbol: 'BDMS',
          entryDate: '2025-02-14',
          entryPrice: 27.50,
          shares: 1200,
          totalCost: 33000,
          targetPrice: 31.50,
          stopLossPrice: 26.00,
          strategyTag: 'GROWTH_MOMENTUM',
          thesisNotes: 'กลุ่มโรงพยาบาล Defensive คนไข้ต่างชาติฟื้นตัวต่อเนื่อง',
          stockData: INITIAL_STOCKS[3] || INITIAL_STOCKS[1],
        },
        {
          id: 'pos-3',
          symbol: 'NVDA',
          entryDate: '2025-02-18',
          entryPrice: 122.00,
          shares: 15,
          totalCost: 1830,
          targetPrice: 152.00,
          stopLossPrice: 114.00,
          strategyTag: 'BREAKOUT_PLAY',
          thesisNotes: 'กระแส AI Infra ชิป Blackwell ส่งมอบเติบโตก้าวกระโดด',
          stockData: INITIAL_STOCKS.find((s) => s.symbol === 'NVDA') || INITIAL_STOCKS[5],
        },
      ];
    } catch {
      return [];
    }
  });

  // User Closed Trades Journal
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(() => {
    try {
      const saved = localStorage.getItem('sby_closed_trades');
      return saved ? JSON.parse(saved) : [
        {
          id: 'trade-1',
          symbol: 'ADVANC',
          stockName: 'Advanced Info Service',
          entryDate: '2025-01-05',
          exitDate: '2025-02-01',
          entryPrice: 265.00,
          exitPrice: 290.00,
          shares: 200,
          realizedPnL: 5000,
          realizedPnLPercent: 9.43,
          isWin: true,
          exitReason: 'TARGET_HIT',
          journalNotes: 'ถึงเป้าหมายกำไร Wave 3 พอดี ทำตามแผน 100%',
        },
        {
          id: 'trade-2',
          symbol: 'PTT',
          stockName: 'PTT Public Company',
          entryDate: '2025-01-12',
          exitDate: '2025-01-26',
          entryPrice: 33.50,
          exitPrice: 32.25,
          shares: 1000,
          realizedPnL: -1250,
          realizedPnLPercent: -3.73,
          isWin: false,
          exitReason: 'STOP_LOSS',
          journalNotes: 'ราคาน้ำมันดิบร่วงหลุดแนวรับ ตัดขาดทุนตามวินัย ไม่ปล่อยให้ลากยาว',
        },
      ];
    } catch {
      return [];
    }
  });

  // Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('sby_watchlist');
      if (saved) {
        const parsed: WatchlistItem[] = JSON.parse(saved);
        return parsed.map((item) => {
          const fresh = INITIAL_STOCKS.find((s) => s.symbol === item.symbol);
          return fresh ? { ...item, stockData: fresh } : item;
        });
      }
      return [
        {
          symbol: 'CPALL',
          addedAt: new Date().toISOString(),
          entryPrice: 46.75,
          targetPrice: 52.00,
          stopLossPrice: 44.00,
          stockData: INITIAL_STOCKS[0],
        },
        {
          symbol: 'ADVANC',
          addedAt: new Date().toISOString(),
          entryPrice: 284.00,
          targetPrice: 298.00,
          stopLossPrice: 274.00,
          stockData: INITIAL_STOCKS[2],
        },
        {
          symbol: 'XAU/USD',
          addedAt: new Date().toISOString(),
          entryPrice: 2685.50,
          targetPrice: 2750.00,
          stopLossPrice: 2640.00,
          stockData: INITIAL_STOCKS.find((s) => s.symbol === 'XAU/USD') || INITIAL_STOCKS[0],
        }
      ];
    } catch {
      return [];
    }
  });

  // Apply Theme
  useEffect(() => {
    localStorage.setItem('sby_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // Save Investor Profile
  useEffect(() => {
    localStorage.setItem('sby_investor_profile', JSON.stringify(investorProfile));
  }, [investorProfile]);

  // Save Watchlist
  useEffect(() => {
    localStorage.setItem('sby_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Save User Positions
  useEffect(() => {
    localStorage.setItem('sby_user_positions', JSON.stringify(userPositions));
  }, [userPositions]);

  // Save Closed Trades
  useEffect(() => {
    localStorage.setItem('sby_closed_trades', JSON.stringify(closedTrades));
  }, [closedTrades]);

  // Save Day Trade Mode & Portfolio
  useEffect(() => {
    localStorage.setItem('sby_trading_mode', tradingMode);
  }, [tradingMode]);

  useEffect(() => {
    localStorage.setItem('sby_day_trade_portfolio', JSON.stringify(dayTradePortfolio));
  }, [dayTradePortfolio]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Login Success Handler
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    // After login, automatically open objective & board selector modal
    setIsOnboardingModalOpen(true);
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('sby_auth_user');
    setAuthUser(null);
  };

  const handleUpdateInvestorProfile = (updated: Partial<InvestorProfile>) => {
    setInvestorProfile((prev) => ({ ...prev, ...updated }));
  };

  // Day Trade Handlers
  const handleConfirmDayTradeSetup = (config: {
    timeframe: DayTradeTimeframe;
    capital: number;
    selectedStocks: StockData[];
  }) => {
    const newPort = buildDayTradePortfolio(config.selectedStocks, config.capital, config.timeframe);
    setDayTradePortfolio(newPort);
    setTradingMode('DAY_TRADE');
    navigateToView('day-trade');
  };

  const handleAddStockToDayTradePortfolio = (stock: StockData, sourceOfIdea?: string) => {
    // Ensure stock exists in allStocks list
    setAllStocks(prev => {
      if (prev.some(s => s.symbol.toUpperCase() === stock.symbol.toUpperCase())) return prev;
      return [...prev, stock];
    });

    if (dayTradePortfolio.setups.some(s => s.symbol === stock.symbol)) {
      // If stock already exists, update its setup with the new source and re-evaluate
      const capitalPerStock = Math.floor(dayTradePortfolio.capital / dayTradePortfolio.setups.length);
      const updatedSetup = generateDayTradeSetup(stock, dayTradePortfolio.timeframe, capitalPerStock, 1.5, sourceOfIdea);
      setDayTradePortfolio(prev => ({
        ...prev,
        setups: prev.setups.map(s => s.symbol === stock.symbol ? updatedSetup : s)
      }));
      return;
    }
    const capitalPerStock = Math.floor(dayTradePortfolio.capital / (dayTradePortfolio.setups.length + 1));
    const newSetup = generateDayTradeSetup(stock, dayTradePortfolio.timeframe, capitalPerStock, 1.5, sourceOfIdea);
    setDayTradePortfolio(prev => ({
      ...prev,
      setups: [...prev.setups, newSetup]
    }));
  };

  const handleRemoveStockFromDayTradePortfolio = (symbol: string) => {
    setDayTradePortfolio(prev => {
      const remaining = prev.setups.filter(s => s.symbol !== symbol);
      if (remaining.length === 0) {
        return {
          ...prev,
          setups: []
        };
      }
      const capitalPerStock = Math.floor(prev.capital / remaining.length);
      return {
        ...prev,
        setups: remaining.map(s => generateDayTradeSetup(s.stock, prev.timeframe, capitalPerStock, 1.5, s.sourceOfIdea))
      };
    });
  };

  const handleClearDayTradePortfolio = () => {
    setDayTradePortfolio(prev => ({
      ...prev,
      setups: []
    }));
  };

  // Live Price Synchronization Handlers
  const handleUpdateSingleStockPrice = (symbol: string, newPrice: number) => {
    const targetStock = allStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (!targetStock) return;

    const updatedStock = updateStockWithNewPrice(targetStock, newPrice);

    // 1. Update allStocks
    setAllStocks(prev => prev.map(s => s.symbol.toUpperCase() === symbol.toUpperCase() ? updatedStock : s));

    // 2. Update currentStock if viewing
    if (currentStock.symbol.toUpperCase() === symbol.toUpperCase()) {
      setCurrentStock(updatedStock);
    }

    // 3. Update Day Trade Portfolio setup
    setDayTradePortfolio(prev => {
      if (!prev.setups.some(s => s.symbol.toUpperCase() === symbol.toUpperCase())) return prev;
      const capitalPerStock = Math.floor(prev.capital / prev.setups.length);
      return {
        ...prev,
        setups: prev.setups.map(s => {
          if (s.symbol.toUpperCase() === symbol.toUpperCase()) {
            return generateDayTradeSetup(updatedStock, prev.timeframe, capitalPerStock, 1.5, s.sourceOfIdea);
          }
          return s;
        })
      };
    });

    // 4. Update User Positions
    setUserPositions(prev => prev.map(pos => {
      if (pos.symbol.toUpperCase() === symbol.toUpperCase()) {
        return { ...pos, stockData: updatedStock };
      }
      return pos;
    }));

    // 5. Update Watchlist
    setWatchlist(prev => prev.map(item => {
      if (item.symbol.toUpperCase() === symbol.toUpperCase()) {
        return { ...item, stockData: updatedStock };
      }
      return item;
    }));

    setLastSyncedTime(new Date());
  };

  const handleBatchUpdatePrices = (updatedStocksList: StockData[]) => {
    const map = new Map(updatedStocksList.map(s => [s.symbol.toUpperCase(), s]));

    // 1. Update allStocks
    setAllStocks(prev => prev.map(s => map.get(s.symbol.toUpperCase()) || s));

    // 2. Update currentStock
    const updatedCurrent = map.get(currentStock.symbol.toUpperCase());
    if (updatedCurrent) {
      setCurrentStock(updatedCurrent);
    }

    // 3. Update Day Trade Portfolio
    setDayTradePortfolio(prev => {
      const capitalPerStock = Math.floor(prev.capital / Math.max(1, prev.setups.length));
      return {
        ...prev,
        setups: prev.setups.map(s => {
          const fresh = map.get(s.symbol.toUpperCase());
          if (fresh) {
            return generateDayTradeSetup(fresh, prev.timeframe, capitalPerStock, 1.5, s.sourceOfIdea);
          }
          return s;
        })
      };
    });

    // 4. Update User Positions
    setUserPositions(prev => prev.map(pos => {
      const fresh = map.get(pos.symbol.toUpperCase());
      return fresh ? { ...pos, stockData: fresh } : pos;
    }));

    // 5. Update Watchlist
    setWatchlist(prev => prev.map(item => {
      const fresh = map.get(item.symbol.toUpperCase());
      return fresh ? { ...item, stockData: fresh } : item;
    }));

    setLastSyncedTime(new Date());
  };

  // Active AI Portfolio for Working Paper and Portfolio Builder
  const activeAIPortfolio = useMemo(() => {
    return buildIntelligentPortfolio(allStocks, investorProfile);
  }, [allStocks, investorProfile]);

  const handleExecuteWorkingPaperOrders = (orders: any[]) => {
    const newPositions: UserPosition[] = orders.map((o, idx) => ({
      id: `pos-wp-${Date.now()}-${idx}`,
      symbol: o.symbol,
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: o.price,
      shares: o.amount,
      totalCost: o.price * o.amount,
      targetPrice: o.targetPrice,
      stopLossPrice: o.stopLossPrice,
      strategyTag: 'VALUE_INVESTING',
      thesisNotes: `ส่งคำสั่งผ่าน Portfolio Working Paper (Order #${o.orderId || 'MOCK'}) ด้วยระบบลงนาม 2-Step Sign-Off PIN`,
      stockData: allStocks.find(s => s.symbol === o.symbol) || currentStock,
    }));
    setUserPositions(prev => [...newPositions, ...prev]);
    navigateToView('my-portfolio');
  };

  const handleSyncAllPrices = () => {
    const stockMap = new Map<string, StockData>();
    allStocks.forEach(s => stockMap.set(s.symbol.toUpperCase(), s));
    dayTradePortfolio.setups.forEach(setup => {
      if (setup.stock) stockMap.set(setup.symbol.toUpperCase(), setup.stock);
    });
    
    // Synchronize every stock with authentic EOD closing prices
    const updated = Array.from(stockMap.values()).map(stock => {
      const sym = stock.symbol.toUpperCase();
      if (REAL_MARKET_SNAPSHOT_PRESET[sym]) {
        const p = REAL_MARKET_SNAPSHOT_PRESET[sym];
        return updateStockWithNewPrice(stock, p.close, p.prevClose, p.change, p.changePercent);
      }
      return stock;
    });

    handleBatchUpdatePrices(updated);
  };

  const handleExecuteDayTrade = (plan: {
    stock: StockData;
    entryPrice: number;
    shares: number;
    stopLossPrice: number;
    targetPrice: number;
    thesis: string;
  }) => {
    handleAddUserPosition({
      symbol: plan.stock.symbol,
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: plan.entryPrice,
      shares: plan.shares,
      totalCost: plan.entryPrice * plan.shares,
      targetPrice: plan.targetPrice,
      stopLossPrice: plan.stopLossPrice,
      strategyTag: 'SWING_TRADE',
      thesisNotes: plan.thesis,
      stockData: plan.stock,
    });
  };

  // User Position Handlers
  const handleAddUserPosition = (newPos: Omit<UserPosition, 'id'>) => {
    const position: UserPosition = {
      ...newPos,
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setUserPositions((prev) => [position, ...prev]);
  };

  const handleSetAllUserPositions = (positions: UserPosition[]) => {
    setUserPositions(positions);
  };

  const handleBulkAddUserPositions = (newPositions: Omit<UserPosition, 'id'>[]) => {
    const created: UserPosition[] = newPositions.map((pos, idx) => ({
      ...pos,
      id: `pos-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    }));
    setUserPositions((prev) => [...created, ...prev]);
  };

  const handleUpdateUserPosition = (id: string, updated: Partial<UserPosition>) => {
    setUserPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const handleDeleteUserPosition = (id: string) => {
    setUserPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCloseUserPosition = (
    positionId: string,
    exitPrice: number,
    exitReason: 'TARGET_HIT' | 'STOP_LOSS' | 'MANUAL_EXIT' | 'TRAILING_STOP',
    journalNotes: string
  ) => {
    const targetPos = userPositions.find((p) => p.id === positionId);
    if (!targetPos) return;

    const realizedPnL = (exitPrice - targetPos.entryPrice) * targetPos.shares;
    const realizedPnLPercent = targetPos.entryPrice > 0 
      ? ((exitPrice - targetPos.entryPrice) / targetPos.entryPrice) * 100 
      : 0;

    const closedRecord: ClosedTrade = {
      id: `trade-${Date.now()}`,
      symbol: targetPos.symbol,
      stockName: targetPos.stockData.name,
      category: targetPos.stockData.assetCategory,
      entryDate: targetPos.entryDate,
      exitDate: new Date().toISOString().split('T')[0],
      entryPrice: targetPos.entryPrice,
      exitPrice,
      shares: targetPos.shares,
      totalInvested: targetPos.totalCost,
      realizedPnL,
      realizedPnLPercent,
      isWin: realizedPnL >= 0,
      exitReason,
      strategyTag: targetPos.strategyTag,
      journalNotes,
    };

    setClosedTrades((prev) => [closedRecord, ...prev]);
    setUserPositions((prev) => prev.filter((p) => p.id !== positionId));
  };

  const handleAddFromTradeModule = (plan: {
    stock: StockData;
    entryPrice: number;
    shares: number;
    stopLossPrice: number;
    targetPrice: number;
  }) => {
    handleAddUserPosition({
      symbol: plan.stock.symbol,
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: plan.entryPrice,
      shares: plan.shares,
      totalCost: plan.entryPrice * plan.shares,
      targetPrice: plan.targetPrice,
      stopLossPrice: plan.stopLossPrice,
      strategyTag: 'SWING_TRADE',
      thesisNotes: `เพิ่มจากการคำนวณความเสี่ยงในหน้าวิเคราะห์ ${plan.stock.symbol}`,
      stockData: plan.stock,
    });
  };

  // Handle Category Change from Selector Bar
  const handleSelectCategory = (cat: AssetCategory) => {
    setInvestorProfile((prev) => ({ ...prev, preferredBoard: cat }));

    if (cat !== 'ALL') {
      const matchingStock = allStocks.find((s) => s.assetCategory === cat);
      if (matchingStock && currentStock.assetCategory !== cat) {
        setCurrentStock(matchingStock);
      }
    }
  };

  // Filtered list of quick stocks based on active category
  const filteredQuickStocks = useMemo(() => {
    if (investorProfile.preferredBoard === 'ALL') return allStocks;
    return allStocks.filter((s) => s.assetCategory === investorProfile.preferredBoard);
  }, [allStocks, investorProfile.preferredBoard]);

  // Custom AI Stock Lookup
  const handleCustomTickerSearch = async (ticker: string) => {
    setIsSearchingCustom(true);
    try {
      const res = await fetch('/api/custom-stock-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });
      const data = await res.json();
      if (data.success && data.stock) {
        const rawStock = data.stock;

        // Generate synthetic candles matching current price
        const sampleCandles = INITIAL_STOCKS[0].candles || [];
        const basePrice = sampleCandles[sampleCandles.length - 1]?.close || 62.50;
        const candles = sampleCandles.map((c) => {
          const ratio = rawStock.currentPrice / basePrice;
          return {
            date: c.date,
            open: Number((c.open * ratio).toFixed(2)),
            high: Number((c.high * ratio).toFixed(2)),
            low: Number((c.low * ratio).toFixed(2)),
            close: Number((c.close * ratio).toFixed(2)),
            volume: Math.floor(c.volume * 0.8),
            ema20: Number((c.ema20! * ratio).toFixed(2)),
            ema50: Number((c.ema50! * ratio).toFixed(2)),
            ema200: Number((c.ema200! * ratio).toFixed(2)),
            rsi: 55,
          };
        });

        const newStock: StockData = {
          ...rawStock,
          assetCategory: rawStock.market === 'SET' ? 'THAI_STOCK' : rawStock.market === 'US' ? 'GLOBAL_STOCK' : 'FOREX',
          candles,
        };

        setAllStocks((prev) => [newStock, ...prev.filter((s) => s.symbol !== newStock.symbol)]);
        setCurrentStock(newStock);
        navigateToView('analysis');
      } else {
        alert(`ไม่สามารถค้นหาข้อมูลสำหรับ "${ticker}" กรุณาตรวจสอบตัวย่อสินทรัพย์อีกครั้ง`);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI ค้นหาสินทรัพย์');
    } finally {
      setIsSearchingCustom(false);
    }
  };

  // Single Stock Watchlist Save
  const handleSaveToWatchlist = (plan: {
    stock: StockData;
    entryPrice: number;
    stopLossPrice: number;
    targetPrice: number;
  }) => {
    setWatchlist((prev) => {
      const existing = prev.filter((item) => item.symbol !== plan.stock.symbol);
      return [
        {
          symbol: plan.stock.symbol,
          addedAt: new Date().toISOString(),
          entryPrice: plan.entryPrice,
          stopLossPrice: plan.stopLossPrice,
          targetPrice: plan.targetPrice,
          stockData: plan.stock,
        },
        ...existing,
      ];
    });
  };

  // Batch Add 5-8 Stocks from AI Portfolio to Watchlist
  const handleBatchAddToWatchlist = (items: PortfolioItem[]) => {
    setWatchlist((prev) => {
      const existingSymbols = new Set(prev.map((i) => i.symbol));
      const newItems: WatchlistItem[] = items.map((item) => ({
        symbol: item.stock.symbol,
        addedAt: new Date().toISOString(),
        entryPrice: item.entryPrice,
        targetPrice: item.targetPrice,
        stopLossPrice: item.stopLossPrice,
        notes: `สัดส่วนพอร์ต ${item.weightPercent}% (${item.allocatedCapital.toLocaleString()} THB) • ${item.roleInPortfolio} • ${item.periodMonitoringPlan}`,
        stockData: item.stock,
      }));

      // Merge avoiding duplicates
      const merged = [...newItems, ...prev.filter((item) => !newItems.some((n) => n.symbol === item.symbol))];
      return merged;
    });
  };

  // Apply AI Generated Portfolio directly to My Portfolio Tracker
  const handleApplyAIPortfolioToMyTracker = (items: PortfolioItem[]) => {
    const newPositions: UserPosition[] = items.map((item, idx) => ({
      id: `pos-ai-${Date.now()}-${idx}`,
      symbol: item.stock.symbol,
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: item.entryPrice,
      shares: item.recommendedShares,
      totalCost: item.entryPrice * item.recommendedShares,
      targetPrice: item.targetPrice,
      stopLossPrice: item.stopLossPrice,
      strategyTag:
        item.roleInPortfolio === 'Dividend Generator'
          ? 'DIVIDEND_INCOME'
          : item.roleInPortfolio === 'Core Anchor'
          ? 'VALUE_INVESTING'
          : 'GROWTH_MOMENTUM',
      thesisNotes: item.thesis,
      stockData: item.stock,
    }));
    handleSetAllUserPositions(newPositions);
    navigateToView('my-portfolio');
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const isSavedInWatchlist = watchlist.some((item) => item.symbol === currentStock.symbol);

  const jumpToTradePlan = () => {
    const el = document.getElementById('trade-execution-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // IF NOT AUTHENTICATED: Show the Mandatory Login Screen
  if (!authUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#000000] text-slate-900 dark:text-[#E4E4E7] font-sans transition-colors duration-200 selection:bg-indigo-600 selection:text-white overflow-x-hidden">
      {/* Navigation Header */}
      <Header
        currentStock={currentStock}
        allStocks={allStocks}
        onSelectStock={(s) => {
          setCurrentStock(s);
          navigateToView('analysis');
        }}
        onOpenScreener={() => setIsScreenerOpen(true)}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
        onCustomTickerSearch={handleCustomTickerSearch}
        isSearchingCustom={isSearchingCustom}
        theme={theme}
        onToggleTheme={toggleTheme}
        watchlistCount={watchlist.length}
        selectedCategory={investorProfile.preferredBoard}
        onOpenMarketModal={() => setIsMarketModalOpen(true)}
        onSelectCategory={handleSelectCategory}
        currentView={currentView}
        onChangeView={(v) => navigateToView(v)}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        previousViewLabel={previousViewLabel}
        authUser={authUser}
        onLogout={handleLogout}
        onOpenObjectiveModal={() => setIsOnboardingModalOpen(true)}
        tradingMode={tradingMode}
        onToggleTradingMode={(m) => setTradingMode(m)}
        onOpenDayTradeSetup={() => setIsDayTradeSetupOpen(true)}
        onOpenPriceSyncModal={() => setIsPriceSyncModalOpen(true)}
        lastSyncedTime={liveFeedUpdatedTime}
        onSyncAllPrices={triggerMarketRefresh}
        onOpenAddTickerModal={() => setIsAddTickerModalOpen(true)}
        onOpenAuditSimulationLab={() => setIsAuditSimulationOpen(true)}
        onOpenWorkingPaper={() => setIsWorkingPaperOpen(true)}
      />

      {/* Live Market Control & Auto-refresh Feed Bar */}
      <LiveMarketControlBar
        refreshInterval={refreshInterval}
        onChangeRefreshInterval={setRefreshInterval}
        isRefreshing={isMarketRefreshing}
        onManualRefresh={triggerMarketRefresh}
        lastUpdatedTime={liveFeedUpdatedTime}
        totalStocksCount={allStocks.length}
      />

      {/* Persistent Day Trade Alert Ribbon (Active when in Day Trade Mode) */}
      {tradingMode === 'DAY_TRADE' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-black shadow-md flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-black/20 text-slate-950">
                <Zap className="w-4 h-4 animate-bounce" />
              </span>
              <span>
                <strong>⚠️ ขณะนี้อยู่ในโหมด DAY TRADE & SWING (เก็งกำไรระยะสั้น):</strong> กรอบเวลา: {dayTradePortfolio.timeframe === '1_DAY' ? '1 วัน (Intraday)' : dayTradePortfolio.timeframe === '2_3_DAYS' ? '2-3 วัน (Fast Swing)' : '1 สัปดาห์ (Weekly)'} | งบเก็งกำไร: {dayTradePortfolio.capital.toLocaleString()} ฿
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDayTradeSetupOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-black/30 hover:bg-black/40 text-amber-100 font-extrabold text-[11px] transition-all cursor-pointer"
              >
                ⚙️ ปรับการตั้งค่ารอบ/งบ/หุ้น
              </button>
              {currentView !== 'day-trade' && (
                <button
                  type="button"
                  onClick={() => navigateToView('day-trade')}
                  className="px-3 py-1 rounded-xl bg-slate-950 text-amber-300 font-black text-[11px] shadow-sm hover:scale-105 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>เปิดเทอร์มินัล Day Trade</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Market Category Quick Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white dark:bg-[#0b0b0e] p-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-zinc-400 mr-2 flex items-center space-x-1 pl-1">
              <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>กระดานลงทุน:</span>
            </span>

            <button
              onClick={() => handleSelectCategory('THAI_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                investorProfile.preferredBoard === 'THAI_STOCK'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-[#141418] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800/80'
              }`}
            >
              <span>🇹🇭 หุ้นไทย (SET / mai)</span>
            </button>

            <button
              onClick={() => handleSelectCategory('GLOBAL_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                investorProfile.preferredBoard === 'GLOBAL_STOCK'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-[#141418] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800/80'
              }`}
            >
              <span>🌐 หุ้นต่างประเทศ (US Stocks)</span>
            </button>

            <button
              onClick={() => handleSelectCategory('FOREX')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                investorProfile.preferredBoard === 'FOREX'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-[#141418] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800/80'
              }`}
            >
              <span>💱 Forex & ทองคำ (Gold / FX)</span>
            </button>

            <button
              onClick={() => handleSelectCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                investorProfile.preferredBoard === 'ALL'
                  ? 'bg-slate-900 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-slate-50 dark:bg-[#141418] text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800/80'
              }`}
            >
              ✨ ผสมผสานทุกตลาด
            </button>
          </div>

          {/* Quick Target / Objective Summary Tag & Re-configure trigger */}
          <button
            onClick={() => setIsOnboardingModalOpen(true)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 px-2"
          >
            <span>🎯 เป้าหมาย: {investorProfile.capital.toLocaleString()}฿ (+{investorProfile.targetReturnPercent}%)</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      {/* Quick Stock / Asset Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-zinc-500 whitespace-nowrap mr-1">
            {investorProfile.preferredBoard === 'FOREX' ? 'คู่เงินเด่น:' : investorProfile.preferredBoard === 'GLOBAL_STOCK' ? 'หุ้นนอกเด่น:' : investorProfile.preferredBoard === 'THAI_STOCK' ? 'หุ้นไทยเด่น:' : 'สินทรัพย์เด่น:'}
          </span>
          {filteredQuickStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => {
                setCurrentStock(stock);
                navigateToView('analysis');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                currentStock.symbol === stock.symbol && currentView === 'analysis'
                  ? stock.assetCategory === 'FOREX' 
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                    : 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                  : 'bg-white dark:bg-[#0e0e12] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span>{stock.symbol}</span>
              <span className={`text-[10px] ${
                currentStock.symbol === stock.symbol && currentView === 'analysis'
                  ? 'text-indigo-100' 
                  : stock.change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}>
                {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Intuitive Beginner Guide & 4-Workspace Navigator */}
        <BeginnerGuideBanner
          currentView={currentView}
          onChangeView={(v) => navigateToView(v)}
        />

        {/* VIEW 1: DEDICATED AI INVESTOR PORTFOLIO BUILDER (5 - 8 STOCKS) */}
        {currentView === 'portfolio' && (
          <AIPortfolioBuilder
            allStocks={allStocks}
            investorProfile={investorProfile}
            onUpdateInvestorProfile={(p) => setInvestorProfile(p)}
            onSelectStockForDeepAnalysis={(s) => {
              setCurrentStock(s);
              navigateToView('analysis');
            }}
            onBatchAddToWatchlist={handleBatchAddToWatchlist}
            onOpenAIChat={() => setIsAIAdvisorOpen(true)}
            onApplyToMyPortfolio={handleApplyAIPortfolioToMyTracker}
          />
        )}

        {/* VIEW 2: USER TRACKED PORTFOLIO & SKILL DEVELOPMENT (พอร์ตติดตามเอง & วัดผลทักษะ) */}
        {currentView === 'my-portfolio' && (
          <MyPortfolioTracker
            allStocks={allStocks}
            positions={userPositions}
            closedTrades={closedTrades}
            investorProfile={investorProfile}
            onUpdateInvestorProfile={handleUpdateInvestorProfile}
            onAddPosition={handleAddUserPosition}
            onSetAllPositions={handleSetAllUserPositions}
            onBulkAddPositions={handleBulkAddUserPositions}
            onUpdatePosition={handleUpdateUserPosition}
            onDeletePosition={handleDeleteUserPosition}
            onClosePosition={handleCloseUserPosition}
            onSelectStockForDeepAnalysis={(s) => {
              setCurrentStock(s);
              navigateToView('analysis');
            }}
            onSwitchToAIPortfolioBuilder={() => navigateToView('portfolio')}
            onOpenObjectiveModal={() => setIsOnboardingModalOpen(true)}
            onOpenAIChatWithContext={(prompt) => {
              setIsAIAdvisorOpen(true);
            }}
          />
        )}

        {/* VIEW 3: SINGLE STOCK ANALYSIS & TRADING PLAN */}
        {currentView === 'analysis' && (
          <div className="space-y-6">
            {/* Top Navigation & Back Button Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111115] border-2 border-indigo-500/30 p-3.5 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-3">
                <button
                  id="btn-analysis-back-to-previous"
                  type="button"
                  onClick={handleGoBack}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer active:scale-95 group shrink-0"
                  title={`ย้อนกลับไปหน้า: ${previousViewLabel}`}
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>← ย้อนกลับ ({previousViewLabel})</span>
                </button>
                <div className="text-xs text-slate-600 dark:text-zinc-300 flex items-center space-x-1.5 font-medium">
                  <span className="text-slate-400 dark:text-zinc-500">กราฟ & วิเคราะห์:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">{currentStock.symbol}</strong>
                  <span className="hidden sm:inline text-slate-400">({currentStock.name})</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => navigateToView('portfolio')}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI จัดพอร์ต</span>
                </button>
                <button
                  onClick={() => navigateToView('my-portfolio')}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                  <span>พอร์ตของฉัน ({userPositions.length})</span>
                </button>
                <button
                  onClick={() => navigateToView('day-trade')}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/20 hover:bg-amber-100 text-amber-700 dark:text-amber-300 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Day Trade</span>
                </button>
              </div>
            </div>

            {/* Executive Summary (What to buy + When to buy in 1 View) */}
            <ExecutiveSummaryCard
              stock={currentStock}
              onOpenAIAnalysis={() => setIsAIAdvisorOpen(true)}
              onJumpToTradePlan={jumpToTradePlan}
              onGoBack={handleGoBack}
              previousViewLabel={previousViewLabel}
            />

            {/* Dual Core Grid: Fundamental & Technical */}
            <div className="grid grid-cols-1 gap-6">
              {/* Module 1: Fundamental & Valuation (What to Buy) */}
              <FundamentalModule stock={currentStock} />

              {/* Module 2: Annual Financial Trend Line Chart (กำไรสุทธิสิ้นปี / หนี้สินสุทธิสิ้นปี / การเพิ่มทุนถ้ามี) */}
              {currentStock.assetCategory !== 'FOREX' && !currentStock.forexMacro && (
                <div id="section-annual-financial-trend">
                  <AnnualFinancialTrendChart stock={currentStock} />
                </div>
              )}

              {/* Module 2.5: Executive Governance & News Radar (ตรวจสอบธรรมาภิบาลผู้บริหาร & ข่าวสาร ก.ล.ต.) */}
              {currentStock.assetCategory !== 'FOREX' && !currentStock.forexMacro && (
                <div id="section-executive-governance">
                  <ExecutiveGovernanceModule stock={currentStock} />
                </div>
              )}

              {/* Module 3: Technical & Timing (When to Buy - Includes 1W, 1M, 3M, ALL) */}
              <TechnicalModule
                stock={currentStock}
                onGoBack={handleGoBack}
                previousViewLabel={previousViewLabel}
              />

              {/* Module 3: Trade Execution & Position Sizing (How to Trade) */}
              <TradeExecutionModule
                stock={currentStock}
                onSaveToWatchlist={handleSaveToWatchlist}
                isSavedInWatchlist={isSavedInWatchlist}
                onAddToUserPortfolio={handleAddFromTradeModule}
                onOpenWorkingPaper={() => setIsWorkingPaperOpen(true)}
              />
            </div>

            {/* Floating Quick Return Pill on Long Scroll */}
            <div className="fixed bottom-6 right-6 z-40">
              <button
                type="button"
                onClick={handleGoBack}
                className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 text-white font-black text-xs shadow-xl border border-white/20 backdrop-blur-md flex items-center space-x-2 transition-all cursor-pointer hover:scale-105 active:scale-95 group"
                title={`คลิกเพื่อย้อนกลับไป: ${previousViewLabel}`}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-amber-300" />
                <span>ย้อนกลับ ({previousViewLabel})</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: DEDICATED DAY TRADE & FAST SWING TERMINAL */}
        {currentView === 'day-trade' && (
          <DayTradeTerminal
            dayTradePortfolio={dayTradePortfolio}
            allStocks={allStocks}
            onOpenSetupModal={() => setIsDayTradeSetupOpen(true)}
            onSelectStockForDeepAnalysis={(s) => {
              setCurrentStock(s);
              navigateToView('analysis');
            }}
            onExecuteTrade={handleExecuteDayTrade}
            onOpenAIChatWithStock={(stock, prompt) => {
              setCurrentStock(stock);
              setIsAIAdvisorOpen(true);
            }}
            onAddStockToDayTradePortfolio={handleAddStockToDayTradePortfolio}
            onRemoveStockFromDayTradePortfolio={handleRemoveStockFromDayTradePortfolio}
            onClearDayTradePortfolio={handleClearDayTradePortfolio}
            onOpenPriceSyncModal={() => setIsPriceSyncModalOpen(true)}
            lastSyncedTime={lastSyncedTime}
            onSyncAllPrices={handleSyncAllPrices}
            onUpdateSingleStockPrice={handleUpdateSingleStockPrice}
          />
        )}

        {/* VIEW 5: PAPER TRADING SIMULATOR (สนามซ้อม 1-3 เดือน เพื่อความมั่นใจ 100% สำหรับเงินก้อนสุดท้าย) */}
        {currentView === 'paper-trade' && (
          <PaperTradingSimulator
            allStocks={allStocks}
            onSelectStock={(s) => {
              setCurrentStock(s);
              navigateToView('analysis');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#000000] mt-12 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              S
            </div>
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              SBY Invest AI
            </span>
            <span className="text-slate-400 dark:text-zinc-500">— ระบบผสาน Fundamental Analysis & Technical Trading</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 font-mono">
              [Mode: {tradingMode === 'DAY_TRADE' ? 'Day Trade' : 'VI / Long-term'} | Risk: {investorProfile.riskTolerance === 'LOW' ? 'ต่ำ' : investorProfile.riskTolerance === 'HIGH' ? 'สูง' : 'ปานกลาง'} | TimeFrame: {investorProfile.investmentHorizon === 'SHORT' ? '6M' : '12M'} | Status: Locked & Verified]
            </span>
            <span className="text-slate-500 dark:text-zinc-400">Powered by Gemini 3.7 Flash</span>
          </div>
        </div>
      </footer>

      {/* Live Price Synchronization & Daily Stock Price Report Modal */}
      <LivePriceSyncModal
        isOpen={isPriceSyncModalOpen}
        onClose={() => setIsPriceSyncModalOpen(false)}
        allStocks={allStocks}
        dayTradePortfolio={dayTradePortfolio}
        onUpdateSingleStockPrice={handleUpdateSingleStockPrice}
        onBatchUpdatePrices={handleBatchUpdatePrices}
        onSyncAllPrices={handleSyncAllPrices}
        lastSyncedTime={lastSyncedTime}
        onSelectStockToAnalyze={(stock) => {
          setCurrentStock(stock);
          navigateToView('analysis');
        }}
      />

      {/* Day Trade Horizon & Capital Setup Modal */}
      <DayTradeSetupModal
        isOpen={isDayTradeSetupOpen}
        onClose={() => setIsDayTradeSetupOpen(false)}
        allStocks={allStocks}
        initialCapital={dayTradePortfolio.capital}
        initialTimeframe={dayTradePortfolio.timeframe}
        initialSelectedSymbols={dayTradePortfolio.setups.map(s => s.symbol)}
        onConfirmSetup={handleConfirmDayTradeSetup}
      />

      {/* Post-Login Onboarding & Objective Modal */}
      <OnboardingObjectiveModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        username={authUser?.username || 'นักลงทุน'}
        initialProfile={investorProfile}
        userPositions={userPositions}
        dayTradePortfolio={dayTradePortfolio}
        brokerCash={350000}
        onSaveProfileAndLaunchAI={(newProfile) => {
          setInvestorProfile(newProfile);
          navigateToView('portfolio');
        }}
        onSaveProfileAndGoDashboard={(newProfile) => {
          setInvestorProfile(newProfile);
          navigateToView('analysis');
        }}
      />

      {/* Quick Market Selection Modal */}
      <MarketSelectionModal
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
        selectedCategory={investorProfile.preferredBoard}
        onSelectCategory={handleSelectCategory}
      />

      {/* Stock Screener Modal */}
      <StockScreenerModal
        isOpen={isScreenerOpen}
        onClose={() => setIsScreenerOpen(false)}
        stocks={allStocks}
        onSelectStock={(s) => {
          setCurrentStock(s);
          navigateToView('analysis');
        }}
      />

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onSelectStock={(s) => {
          setCurrentStock(s);
          navigateToView('analysis');
        }}
        onRemoveItem={handleRemoveFromWatchlist}
      />

      {/* Custom Ticker & Precision Calculation Modal */}
      <AddCustomTickerModal
        isOpen={isAddTickerModalOpen}
        onClose={() => setIsAddTickerModalOpen(false)}
        allStocks={allStocks}
        onAddStock={(newStk) => {
          setAllStocks((prev) => [newStk, ...prev.filter((s) => s.symbol.toUpperCase() !== newStk.symbol.toUpperCase())]);
          setCurrentStock(newStk);
          navigateToView('analysis');
        }}
      />

      {/* AI Advisor Chat Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        stock={currentStock}
      />

      {/* Audit Simulation & 8 Findings Test Suite Modal */}
      <AuditSimulationLabModal
        isOpen={isAuditSimulationOpen}
        onClose={() => setIsAuditSimulationOpen(false)}
        allStocks={allStocks}
      />

      {/* Portfolio Working Paper Proposal & 2-Step PIN Execution Modal */}
      <PortfolioWorkingPaperModal
        isOpen={isWorkingPaperOpen}
        onClose={() => setIsWorkingPaperOpen(false)}
        portfolio={activeAIPortfolio}
        investorProfile={investorProfile}
        onOrdersExecuted={handleExecuteWorkingPaperOrders}
      />
    </div>
  );
}
