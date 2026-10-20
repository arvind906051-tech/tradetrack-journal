export type AssetClass = 'Equities' | 'Options' | 'Futures' | 'Crypto' | 'Forex' | 'Commodities';
export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type TradingEmotion = 
  | 'Disciplined' 
  | 'Confident' 
  | 'Neutral' 
  | 'FOMO' 
  | 'Revenge' 
  | 'Anxious' 
  | 'Greedy' 
  | 'Hesitant';

export interface Trade {
  id: string;
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  status: TradeStatus;
  entryDate: string; // YYYY-MM-DD
  entryTime?: string; // HH:mm
  exitDate?: string; // YYYY-MM-DD
  exitTime?: string; // HH:mm
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  fees: number;
  pnl: number; // Realized Net P&L in selected currency
  pnlPercent: number; // % Return
  rMultiple?: number; // Realized R:R (e.g. +2.4R or -1.0R)
  strategy: string;
  emotion: TradingEmotion;
  followedRules: boolean;
  ruleViolations?: string[];
  marketSession?: 'Morning / Open' | 'Mid-Day' | 'Power Hour' | 'After Hours';
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | 'Daily' | 'Weekly';
  notes: string;
  lessons: string;
  chartImage?: string; // Base64 or image URL
  createdAt: number;
  updatedAt: number;
}

export interface TradeFilter {
  search: string;
  assetClass: string;
  direction: string;
  status: string;
  result: 'all' | 'win' | 'loss' | 'breakeven';
  strategy: string;
  emotion: string;
  ruleFollowed: 'all' | 'yes' | 'no';
  dateRange: 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  sortBy: 'date' | 'pnl' | 'symbol' | 'rMultiple';
  sortOrder: 'asc' | 'desc';
}

export interface AccountSettings {
  currency: CurrencyCode;
  initialBalance: number;
  currentBalance: number;
  maxRiskPerTradePercent: number;
  maxDailyLoss: number;
  targetMonthlyReturn: number;
  traderName: string;
}

export interface TradingRule {
  id: string;
  title: string;
  description: string;
  category: 'Risk Management' | 'Execution' | 'Psychology';
  enabled: boolean;
}

export interface AngelBrokerConfig {
  apiKey: string;
  clientCode: string;
  mpin: string;
  totpSecret: string;
  isTestMode: boolean;
  lastSyncedAt?: number;
}

