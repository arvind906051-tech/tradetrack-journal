import { Trade } from '../types/trade';

export interface PerformanceStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // 0 to 100
  lossRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number; // avgWin / avgLoss
  avgRMultiple: number;
  largestWin: number;
  largestLoss: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
  bestWinStreak: number;
  worstLossStreak: number;
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  totalFees: number;
  ruleAdherenceRate: number; // % trades where followedRules = true
}

export function calculatePerformanceStats(trades: Trade[], startingCapital: number = 100000): PerformanceStats {
  const closedTrades = trades
    .filter(t => t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  
  const openTrades = trades.filter(t => t.status === 'OPEN').length;

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalFees = 0;
  let totalR = 0;
  let rCount = 0;
  let rulesFollowedCount = 0;

  let bestWinStreak = 0;
  let worstLossStreak = 0;
  let currentStreakCount = 0;
  let currentStreakType: 'win' | 'loss' | 'none' = 'none';

  let runningEquity = startingCapital;
  let peakEquity = startingCapital;
  let maxDrawdownAmount = 0;
  let maxDrawdownPercent = 0;

  for (let i = 0; i < closedTrades.length; i++) {
    const trade = closedTrades[i];
    const pnl = trade.pnl || 0;
    totalFees += trade.fees || 0;

    if (trade.followedRules) {
      rulesFollowedCount++;
    }

    if (trade.rMultiple !== undefined && !isNaN(trade.rMultiple)) {
      totalR += trade.rMultiple;
      rCount++;
    }

    if (pnl > 0.01) {
      winningTrades++;
      grossProfit += pnl;
      if (pnl > largestWin) largestWin = pnl;

      if (currentStreakType === 'win') {
        currentStreakCount++;
      } else {
        currentStreakType = 'win';
        currentStreakCount = 1;
      }
      if (currentStreakCount > bestWinStreak) {
        bestWinStreak = currentStreakCount;
      }
    } else if (pnl < -0.01) {
      losingTrades++;
      grossLoss += Math.abs(pnl);
      if (pnl < largestLoss) largestLoss = pnl;

      if (currentStreakType === 'loss') {
        currentStreakCount++;
      } else {
        currentStreakType = 'loss';
        currentStreakCount = 1;
      }
      if (currentStreakCount > worstLossStreak) {
        worstLossStreak = currentStreakCount;
      }
    } else {
      breakevenTrades++;
      currentStreakCount = 0;
      currentStreakType = 'none';
    }

    // Equity and drawdown tracking
    runningEquity += pnl;
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    } else {
      const ddAmount = peakEquity - runningEquity;
      const ddPercent = peakEquity > 0 ? (ddAmount / peakEquity) * 100 : 0;
      if (ddAmount > maxDrawdownAmount) {
        maxDrawdownAmount = ddAmount;
      }
      if (ddPercent > maxDrawdownPercent) {
        maxDrawdownPercent = ddPercent;
      }
    }
  }

  const netPnl = grossProfit - grossLoss;
  const totalClosed = closedTrades.length;
  const winRate = totalClosed > 0 ? (winningTrades / totalClosed) * 100 : 0;
  const lossRate = totalClosed > 0 ? (losingTrades / totalClosed) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.99 : 0;
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;
  const avgRMultiple = rCount > 0 ? totalR / rCount : 0;
  const ruleAdherenceRate = totalClosed > 0 ? (rulesFollowedCount / totalClosed) * 100 : 100;

  return {
    totalTrades: trades.length,
    openTrades,
    closedTrades: totalClosed,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    lossRate,
    grossProfit,
    grossLoss,
    netPnl,
    profitFactor,
    avgWin,
    avgLoss,
    winLossRatio,
    avgRMultiple,
    largestWin,
    largestLoss,
    currentStreak: { type: currentStreakType, count: currentStreakCount },
    bestWinStreak,
    worstLossStreak,
    maxDrawdownAmount,
    maxDrawdownPercent,
    totalFees,
    ruleAdherenceRate
  };
}

export interface DailyPnlRecord {
  date: string;
  pnl: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
}

export function getDailyPnlMap(trades: Trade[]): Record<string, DailyPnlRecord> {
  const map: Record<string, DailyPnlRecord> = {};

  trades.forEach(trade => {
    if (trade.status !== 'CLOSED') return;
    const date = trade.exitDate || trade.entryDate;
    if (!date) return;

    if (!map[date]) {
      map[date] = {
        date,
        pnl: 0,
        tradesCount: 0,
        winCount: 0,
        lossCount: 0
      };
    }

    map[date].pnl += trade.pnl || 0;
    map[date].tradesCount += 1;
    if ((trade.pnl || 0) > 0.01) {
      map[date].winCount += 1;
    } else if ((trade.pnl || 0) < -0.01) {
      map[date].lossCount += 1;
    }
  });

  return map;
}

export interface EquityPoint {
  date: string;
  tradeNumber: number;
  pnl: number;
  cumulativePnl: number;
  equity: number;
  symbol: string;
}

export function getEquityCurve(trades: Trade[], startingCapital: number = 100000): EquityPoint[] {
  const closedTrades = [...trades]
    .filter(t => t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  let cumulativePnl = 0;
  const points: EquityPoint[] = [
    {
      date: 'Start',
      tradeNumber: 0,
      pnl: 0,
      cumulativePnl: 0,
      equity: startingCapital,
      symbol: 'Initial Capital'
    }
  ];

  closedTrades.forEach((t, index) => {
    cumulativePnl += t.pnl || 0;
    points.push({
      date: t.exitDate || t.entryDate,
      tradeNumber: index + 1,
      pnl: t.pnl || 0,
      cumulativePnl,
      equity: startingCapital + cumulativePnl,
      symbol: t.symbol
    });
  });

  return points;
}

export interface BreakdownItem {
  name: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  avgPnl: number;
}

export function getBreakdownByField(
  trades: Trade[],
  field: 'strategy' | 'assetClass' | 'emotion' | 'marketSession'
): BreakdownItem[] {
  const closed = trades.filter(t => t.status === 'CLOSED');
  const groups: Record<string, { wins: number; losses: number; grossProfit: number; grossLoss: number; count: number }> = {};

  closed.forEach(t => {
    const rawVal = t[field];
    const key = (typeof rawVal === 'string' && rawVal.trim()) ? rawVal.trim() : 'Unspecified';
    if (!groups[key]) {
      groups[key] = { wins: 0, losses: 0, grossProfit: 0, grossLoss: 0, count: 0 };
    }
    groups[key].count++;
    const pnl = t.pnl || 0;
    if (pnl > 0.01) {
      groups[key].wins++;
      groups[key].grossProfit += pnl;
    } else if (pnl < -0.01) {
      groups[key].losses++;
      groups[key].grossLoss += Math.abs(pnl);
    }
  });

  return Object.entries(groups)
    .map(([name, data]) => {
      const netPnl = data.grossProfit - data.grossLoss;
      const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0;
      const profitFactor = data.grossLoss > 0 ? data.grossProfit / data.grossLoss : data.grossProfit > 0 ? 99.9 : 0;
      const avgPnl = data.count > 0 ? netPnl / data.count : 0;
      return {
        name,
        count: data.count,
        wins: data.wins,
        losses: data.losses,
        winRate,
        netPnl,
        profitFactor,
        avgPnl
      };
    })
    .sort((a, b) => b.netPnl - a.netPnl);
}

export function calculatePositionSize(
  accountBalance: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number
): {
  positionSize: number;
  riskAmount: number;
  riskPerShare: number;
  totalCost: number;
} {
  if (entryPrice <= 0 || stopLossPrice <= 0 || entryPrice === stopLossPrice) {
    return { positionSize: 0, riskAmount: 0, riskPerShare: 0, totalCost: 0 };
  }

  const riskAmount = (accountBalance * riskPercent) / 100;
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  const positionSize = Math.floor(riskAmount / riskPerShare);
  const totalCost = positionSize * entryPrice;

  return {
    positionSize,
    riskAmount,
    riskPerShare,
    totalCost
  };
}
