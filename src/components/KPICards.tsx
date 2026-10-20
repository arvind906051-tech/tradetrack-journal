import React from 'react';
import { useTradeContext } from '../context/TradeContext';
import { formatCurrency, formatRMultiple } from '../utils/formatters';
import { TrendingUp, TrendingDown, Target, ShieldCheck, Flame, Scale } from 'lucide-react';

export const KPICards: React.FC = () => {
  const { stats, currency, t } = useTradeContext();

  const isNetProfit = stats.netPnl >= 0;
  const netPnlColor = isNetProfit ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {/* 1. Net P&L */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{t.netPnl}</span>
          {isNetProfit ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>
        <div>
          <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${netPnlColor}`}>
            {formatCurrency(stats.netPnl, currency, true)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
            <span>{stats.closedTrades} {t.totalTrades.toLowerCase()}</span>
            {stats.openTrades > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-400">{stats.openTrades} {t.openPositions.toLowerCase()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Win Rate */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{t.winRate}</span>
          <Target className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
            <span className="text-emerald-400">{stats.winningTrades}W</span>
            <span aria-hidden="true">/</span>
            <span className="text-rose-400">{stats.losingTrades}L</span>
            {stats.breakevenTrades > 0 && (
              <>
                <span aria-hidden="true">/</span>
                <span>{stats.breakevenTrades}BE</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Profit Factor */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{t.profitFactor}</span>
          <Scale className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
            {stats.profitFactor > 50 ? '50+' : stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate font-mono">
            <span>+{formatCurrency(stats.grossProfit, currency)}</span>
          </div>
        </div>
      </div>

      {/* 4. Avg Win vs Avg Loss */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="text-xs text-slate-400 mb-2 truncate">
          <span>{t.avgWinLoss}</span>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-200">
            <span className="text-emerald-400">{formatCurrency(stats.avgWin, currency)}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            <span className="text-rose-400">-{formatCurrency(stats.avgLoss, currency)}</span>
            <span className="text-slate-500 ml-1.5">({stats.winLossRatio.toFixed(1)}x)</span>
          </div>
        </div>
      </div>

      {/* 5. Avg Realized R-Multiple */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{t.avgRMultiple}</span>
          <Flame className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${stats.avgRMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatRMultiple(stats.avgRMultiple)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-mono">
            <span>Streak:</span>
            {stats.currentStreak.type === 'win' && (
              <span className="text-emerald-400 font-semibold">{stats.currentStreak.count} Win{stats.currentStreak.count > 1 ? 's' : ''}</span>
            )}
            {stats.currentStreak.type === 'loss' && (
              <span className="text-rose-400 font-semibold">{stats.currentStreak.count} Loss{stats.currentStreak.count > 1 ? 'es' : ''}</span>
            )}
            {stats.currentStreak.type === 'none' && <span>0</span>}
          </div>
        </div>
      </div>

      {/* 6. Rule Discipline Rate */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{t.ruleAdherence}</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
            {stats.ruleAdherenceRate.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            <span>Max DD: -{stats.maxDrawdownPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
