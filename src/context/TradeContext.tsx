import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Trade, 
  TradeFilter, 
  AccountSettings, 
  TradingRule,
  CurrencyCode 
} from '../types/trade';
import { 
  INITIAL_TRADES, 
  INITIAL_ACCOUNT_SETTINGS, 
  INITIAL_TRADING_RULES 
} from '../data/initialData';
import { Language, TRANSLATIONS } from '../utils/translations';
import { calculatePerformanceStats, PerformanceStats } from '../utils/calculations';

interface TradeContextType {
  trades: Trade[];
  accountSettings: AccountSettings;
  tradingRules: TradingRule[];
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  activeTab: 'journal' | 'analytics' | 'calendar' | 'psychology' | 'calculator' | 'rules';
  setActiveTab: (tab: 'journal' | 'analytics' | 'calendar' | 'psychology' | 'calculator' | 'rules') => void;
  
  // Filter
  filter: TradeFilter;
  setFilter: React.Dispatch<React.SetStateAction<TradeFilter>>;
  resetFilter: () => void;
  filteredTrades: Trade[];

  // Stats
  stats: PerformanceStats;

  // Actions
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  closeTrade: (id: string, exitPrice: number, exitDate: string, exitTime?: string, fees?: number) => void;
  
  // Modals & Selection
  isTradeModalOpen: boolean;
  setIsTradeModalOpen: (open: boolean) => void;
  editingTrade: Trade | null;
  setEditingTrade: (trade: Trade | null) => void;
  selectedTradeForDetail: Trade | null;
  setSelectedTradeForDetail: (trade: Trade | null) => void;
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: (open: boolean) => void;

  // Angel One SmartAPI Auto-Sync
  isAngelModalOpen: boolean;
  setIsAngelModalOpen: (open: boolean) => void;
  isSyncingAngel: boolean;
  syncAngelOneTrades: (options?: { 
    apiKey?: string; 
    clientId?: string; 
    mpin?: string; 
    totpSecret?: string; 
    isDemoMode?: boolean 
  }) => Promise<{ success: boolean; message: string; count?: number }>;
  hasAngelEnv: boolean;

  // In-app Confirm & Toast (avoids blocked window.confirm / alert)
  confirmModal: {
    isOpen: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  };
  requestConfirm: (options: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
  closeConfirm: () => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  
  // Rules management
  toggleRule: (id: string) => void;
  addRule: (title: string, description: string, category: 'Risk Management' | 'Execution' | 'Psychology') => void;
  deleteRule: (id: string) => void;
  
  // Account management
  updateAccountSettings: (settings: Partial<AccountSettings>) => void;
  
  // Data management
  resetToSampleData: () => void;
  clearAllTrades: () => void;
  exportToCSV: () => void;
  exportToJSON: () => void;
  importTradesJSON: (jsonStr: string) => boolean;

  t: typeof TRANSLATIONS['en'];
}

const DEFAULT_FILTER: TradeFilter = {
  search: '',
  assetClass: 'all',
  direction: 'all',
  status: 'all',
  result: 'all',
  strategy: 'all',
  emotion: 'all',
  ruleFollowed: 'all',
  dateRange: 'all',
  sortBy: 'date',
  sortOrder: 'desc'
};

const TradeContext = createContext<TradeContextType | undefined>(undefined);

const TRADES_STORAGE_KEY = 'tradetrack_trades_v1';
const SETTINGS_STORAGE_KEY = 'tradetrack_settings_v1';
const RULES_STORAGE_KEY = 'tradetrack_rules_v1';
const LANG_STORAGE_KEY = 'tradetrack_lang_v1';

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem(TRADES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TRADES;
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ACCOUNT_SETTINGS;
  });

  const [tradingRules, setTradingRules] = useState<TradingRule[]>(() => {
    try {
      const saved = localStorage.getItem(RULES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TRADING_RULES;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {
      // fallback
    }
    return 'en';
  });

  const [activeTab, setActiveTab] = useState<'journal' | 'analytics' | 'calendar' | 'psychology' | 'calculator' | 'rules'>('journal');
  const [filter, setFilter] = useState<TradeFilter>(DEFAULT_FILTER);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<Trade | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Angel One SmartAPI Auto-Sync State
  const [isAngelModalOpen, setIsAngelModalOpen] = useState(false);
  const [isSyncingAngel, setIsSyncingAngel] = useState(false);
  const [hasAngelEnv, setHasAngelEnv] = useState(false);

  // Check if Angel One environment credentials exist on server
  useEffect(() => {
    fetch('/api/angel/status')
      .then(res => res.json())
      .then(data => {
        if (data && data.hasEnvConfig) {
          setHasAngelEnv(true);
        }
      })
      .catch(() => {
        // Backend not ready yet or running in static mode
      });
  }, []);

  // In-app confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  const requestConfirm = (options: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      isDestructive: options.isDestructive !== undefined ? options.isDestructive : true,
      onConfirm: options.onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    } catch (err) {
      console.warn('Failed saving trades to localStorage', err);
    }
  }, [trades]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(accountSettings));
    } catch (err) {
      console.warn('Failed saving settings to localStorage', err);
    }
  }, [accountSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(tradingRules));
    } catch (err) {
      console.warn('Failed saving rules to localStorage', err);
    }
  }, [tradingRules]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const setCurrency = (c: CurrencyCode) => {
    setAccountSettings(prev => ({ ...prev, currency: c }));
  };

  const resetFilter = () => setFilter(DEFAULT_FILTER);

  // Performance statistics calculation
  const stats = calculatePerformanceStats(trades, accountSettings.initialBalance);

  // Filtering & Sorting
  const filteredTrades = trades.filter(t => {
    // Search
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      const matchSymbol = t.symbol.toLowerCase().includes(q);
      const matchStrategy = t.strategy?.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchLessons = t.lessons?.toLowerCase().includes(q);
      if (!matchSymbol && !matchStrategy && !matchNotes && !matchLessons) return false;
    }

    // Asset
    if (filter.assetClass !== 'all' && t.assetClass !== filter.assetClass) return false;

    // Direction
    if (filter.direction !== 'all' && t.direction !== filter.direction) return false;

    // Status
    if (filter.status !== 'all' && t.status !== filter.status) return false;

    // Strategy
    if (filter.strategy !== 'all' && t.strategy !== filter.strategy) return false;

    // Emotion
    if (filter.emotion !== 'all' && t.emotion !== filter.emotion) return false;

    // Rule Followed
    if (filter.ruleFollowed === 'yes' && !t.followedRules) return false;
    if (filter.ruleFollowed === 'no' && t.followedRules) return false;

    // Result (win/loss/breakeven)
    if (filter.result === 'win' && (t.status !== 'CLOSED' || (t.pnl || 0) <= 0.01)) return false;
    if (filter.result === 'loss' && (t.status !== 'CLOSED' || (t.pnl || 0) >= -0.01)) return false;
    if (filter.result === 'breakeven' && (t.status !== 'CLOSED' || Math.abs(t.pnl || 0) > 0.01)) return false;

    // Date range
    const tradeDate = t.entryDate;
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const d = new Date(tradeDate);
      if (filter.dateRange === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        if (tradeDate !== todayStr) return false;
      } else if (filter.dateRange === 'this_week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        if (d < weekAgo) return false;
      } else if (filter.dateRange === 'this_month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (filter.dateRange === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (d.getMonth() !== lastMonth || d.getFullYear() !== lastMonthYear) return false;
      } else if (filter.dateRange === 'this_year') {
        if (d.getFullYear() !== now.getFullYear()) return false;
      } else if (filter.dateRange === 'custom') {
        if (filter.customStartDate && tradeDate < filter.customStartDate) return false;
        if (filter.customEndDate && tradeDate > filter.customEndDate) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    let comp = 0;
    if (filter.sortBy === 'date') {
      comp = new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
    } else if (filter.sortBy === 'pnl') {
      comp = (b.pnl || 0) - (a.pnl || 0);
    } else if (filter.sortBy === 'symbol') {
      comp = a.symbol.localeCompare(b.symbol);
    } else if (filter.sortBy === 'rMultiple') {
      comp = (b.rMultiple || 0) - (a.rMultiple || 0);
    }
    return filter.sortOrder === 'asc' ? -comp : comp;
  });

  // Actions
  const addTrade = (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: 'tr-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setTrades(prev => [newTrade, ...prev]);
    showToast('Trade logged successfully!', 'success');
  };

  const updateTrade = (id: string, updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, ...updates, updatedAt: Date.now() };
      }
      return t;
    }));
    showToast('Trade updated successfully!', 'success');
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    if (selectedTradeForDetail?.id === id) {
      setSelectedTradeForDetail(null);
    }
    if (editingTrade?.id === id) {
      setEditingTrade(null);
    }
    showToast('Trade deleted successfully', 'info');
  };

  const closeTrade = (
    id: string, 
    exitPrice: number, 
    exitDate: string, 
    exitTime: string = '15:30', 
    fees: number = 0
  ) => {
    setTrades(prev => prev.map(t => {
      if (t.id !== id) return t;

      let rawPnl = 0;
      if (t.direction === 'LONG') {
        rawPnl = (exitPrice - t.entryPrice) * t.quantity;
      } else {
        rawPnl = (t.entryPrice - exitPrice) * t.quantity;
      }
      const netPnl = rawPnl - fees;
      const initialCost = t.entryPrice * t.quantity;
      const pnlPercent = initialCost > 0 ? (netPnl / initialCost) * 100 : 0;
      
      let rMultiple: number | undefined = undefined;
      if (t.stopLoss && t.stopLoss !== t.entryPrice) {
        const riskPerUnit = Math.abs(t.entryPrice - t.stopLoss);
        const profitPerUnit = t.direction === 'LONG' ? (exitPrice - t.entryPrice) : (t.entryPrice - exitPrice);
        rMultiple = riskPerUnit > 0 ? Number((profitPerUnit / riskPerUnit).toFixed(2)) : undefined;
      }

      return {
        ...t,
        status: 'CLOSED',
        exitPrice,
        exitDate,
        exitTime,
        fees,
        pnl: netPnl,
        pnlPercent,
        rMultiple,
        updatedAt: Date.now()
      };
    }));
  };

  // Angel One SmartAPI tradebook sync
  const syncAngelOneTrades = async (options?: {
    apiKey?: string;
    clientId?: string;
    mpin?: string;
    totpSecret?: string;
    isDemoMode?: boolean;
  }) => {
    setIsSyncingAngel(true);
    try {
      const response = await fetch('/api/angel/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {})
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || 'Failed to sync trades with Angel One';
        showToast(errorMsg, 'error');
        return { success: false, message: errorMsg };
      }

      const incomingTrades: Trade[] = data.trades || [];
      if (incomingTrades.length === 0) {
        showToast(data.message || 'No executed trades found in Angel One today', 'info');
        return { success: true, message: data.message, count: 0 };
      }

      // Merge trades avoiding duplicates by symbol, date, entryPrice, quantity
      let addedCount = 0;
      setTrades(prev => {
        const existingKeys = new Set(
          prev.map(t => `${t.symbol}_${t.entryDate}_${t.entryPrice}_${t.quantity}`)
        );
        const newUniqueTrades = incomingTrades.filter(
          t => !existingKeys.has(`${t.symbol}_${t.entryDate}_${t.entryPrice}_${t.quantity}`)
        );
        addedCount = newUniqueTrades.length;

        if (newUniqueTrades.length === 0) {
          return prev;
        }
        return [...newUniqueTrades, ...prev];
      });

      if (addedCount > 0) {
        showToast(`Synced ${addedCount} trade(s) from Angel One SmartAPI!`, 'success');
      } else {
        showToast('All Angel One trades are already synced in your journal.', 'info');
      }

      return { success: true, message: data.message, count: incomingTrades.length };
    } catch (err: any) {
      const msg = err.message || 'Network error while contacting Angel One API';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsSyncingAngel(false);
    }
  };

  // Rule management
  const toggleRule = (id: string) => {
    setTradingRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const addRule = (title: string, description: string, category: 'Risk Management' | 'Execution' | 'Psychology') => {
    const newRule: TradingRule = {
      id: 'rule-' + Date.now(),
      title,
      description,
      category,
      enabled: true
    };
    setTradingRules(prev => [...prev, newRule]);
  };

  const deleteRule = (id: string) => {
    setTradingRules(prev => prev.filter(r => r.id !== id));
  };

  const updateAccountSettings = (settings: Partial<AccountSettings>) => {
    setAccountSettings(prev => ({ ...prev, ...settings }));
  };

  const resetToSampleData = () => {
    setTrades(INITIAL_TRADES);
    setAccountSettings(INITIAL_ACCOUNT_SETTINGS);
    setTradingRules(INITIAL_TRADING_RULES);
  };

  const clearAllTrades = () => {
    setTrades([]);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (trades.length === 0) return;
    const headers = [
      'ID', 'Symbol', 'AssetClass', 'Direction', 'Status',
      'EntryDate', 'EntryTime', 'ExitDate', 'ExitTime',
      'EntryPrice', 'ExitPrice', 'Quantity', 'StopLoss', 'TakeProfit',
      'Fees', 'NetPnL', 'PnLPercent', 'RMultiple', 'Strategy', 'Emotion',
      'FollowedRules', 'Notes', 'Lessons'
    ];

    const rows = trades.map(t => [
      t.id,
      `"${t.symbol.replace(/"/g, '""')}"`,
      t.assetClass,
      t.direction,
      t.status,
      t.entryDate,
      t.entryTime || '',
      t.exitDate || '',
      t.exitTime || '',
      t.entryPrice,
      t.exitPrice || '',
      t.quantity,
      t.stopLoss || '',
      t.takeProfit || '',
      t.fees,
      t.pnl,
      t.pnlPercent,
      t.rMultiple ?? '',
      `"${(t.strategy || '').replace(/"/g, '""')}"`,
      t.emotion,
      t.followedRules ? 'YES' : 'NO',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${(t.lessons || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TradeTrack_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportToJSON = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      accountSettings,
      tradingRules,
      trades
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `TradeTrack_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON
  const importTradesJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        setTrades(parsed);
        return true;
      }
      if (parsed && Array.isArray(parsed.trades)) {
        setTrades(parsed.trades);
        if (parsed.accountSettings) setAccountSettings(parsed.accountSettings);
        if (parsed.tradingRules) setTradingRules(parsed.tradingRules);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const t = TRANSLATIONS[language];

  return (
    <TradeContext.Provider
      value={{
        trades,
        accountSettings,
        tradingRules,
        language,
        setLanguage,
        currency: accountSettings.currency,
        setCurrency,
        activeTab,
        setActiveTab,
        filter,
        setFilter,
        resetFilter,
        filteredTrades,
        stats,
        addTrade,
        updateTrade,
        deleteTrade,
        closeTrade,
        isTradeModalOpen,
        setIsTradeModalOpen,
        editingTrade,
        setEditingTrade,
        selectedTradeForDetail,
        setSelectedTradeForDetail,
        isCalculatorOpen,
        setIsCalculatorOpen,
        isAngelModalOpen,
        setIsAngelModalOpen,
        isSyncingAngel,
        syncAngelOneTrades,
        hasAngelEnv,
        confirmModal,
        requestConfirm,
        closeConfirm,
        toast,
        showToast,
        toggleRule,
        addRule,
        deleteRule,
        updateAccountSettings,
        resetToSampleData,
        clearAllTrades,
        exportToCSV,
        exportToJSON,
        importTradesJSON,
        t
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTradeContext = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTradeContext must be used within a TradeProvider');
  }
  return context;
};
