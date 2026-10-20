import React from 'react';
import { useTradeContext } from '../context/TradeContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Brain, ShieldCheck, AlertOctagon, HeartHandshake, TrendingUp, TrendingDown } from 'lucide-react';

export const PsychologyAnalytics: React.FC = () => {
  const { trades, currency } = useTradeContext();

  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  // Disciplined vs Undisciplined trades
  const disciplinedTrades = closedTrades.filter(t => t.followedRules);
  const undisciplinedTrades = closedTrades.filter(t => !t.followedRules);

  const calcGroupStats = (list: typeof closedTrades) => {
    let wins = 0;
    let netPnl = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    list.forEach(t => {
      const p = t.pnl || 0;
      netPnl += p;
      if (p > 0.01) {
        wins++;
        grossProfit += p;
      } else if (p < -0.01) {
        grossLoss += Math.abs(p);
      }
    });
    const count = list.length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const avgPnl = count > 0 ? netPnl / count : 0;
    return { count, wins, winRate, netPnl, profitFactor, avgPnl };
  };

  const disciplinedStats = calcGroupStats(disciplinedTrades);
  const undisciplinedStats = calcGroupStats(undisciplinedTrades);

  // Emotion breakdown
  const emotions = ['Disciplined', 'Confident', 'Neutral', 'FOMO', 'Revenge', 'Anxious', 'Greedy', 'Hesitant'] as const;
  const emotionStats = emotions.map(em => {
    const list = closedTrades.filter(t => t.emotion === em);
    return { emotion: em, ...calcGroupStats(list) };
  }).filter(e => e.count > 0);

  // Rule violations impact
  const violationCounts: Record<string, { count: number; loss: number }> = {};
  closedTrades.forEach(t => {
    if (t.ruleViolations && t.ruleViolations.length > 0) {
      t.ruleViolations.forEach(v => {
        if (!violationCounts[v]) violationCounts[v] = { count: 0, loss: 0 };
        violationCounts[v].count++;
        if ((t.pnl || 0) < 0) {
          violationCounts[v].loss += Math.abs(t.pnl || 0);
        }
      });
    }
  });

  const violationList = Object.entries(violationCounts)
    .map(([violation, data]) => ({ violation, ...data }))
    .sort((a, b) => b.loss - a.loss);

  return (
    <div className="space-y-6">
      {/* 1. Head-to-Head Comparison: Disciplined vs Undisciplined */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span>The Cost of Indiscipline</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct statistical comparison between following your trading plan vs deviating based on emotions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Disciplined Side */}
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300 text-sm">Followed Rules strictly</span>
              </div>
              <span className="font-mono text-xs text-emerald-400/80">{disciplinedStats.count} trades</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-900/40 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Net Profit</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatCurrency(disciplinedStats.netPnl, currency, true)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Win Rate</span>
                <span className="text-base font-bold text-white">
                  {disciplinedStats.winRate.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Profit Factor</span>
                <span className="text-base font-bold text-white">
                  {disciplinedStats.profitFactor > 50 ? '50+' : disciplinedStats.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-300/80">
              Avg edge per trade: <strong className="text-emerald-400 font-mono">{formatCurrency(disciplinedStats.avgPnl, currency, true)}</strong>
            </p>
          </div>

          {/* Undisciplined Side */}
          <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-rose-300 text-sm">Broke Rules / Emotional</span>
              </div>
              <span className="font-mono text-xs text-rose-400/80">{undisciplinedStats.count} trades</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-900/40 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Net Outcome</span>
                <span className="text-base font-bold text-rose-400">
                  {formatCurrency(undisciplinedStats.netPnl, currency, true)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Win Rate</span>
                <span className="text-base font-bold text-white">
                  {undisciplinedStats.winRate.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Profit Factor</span>
                <span className="text-base font-bold text-white">
                  {undisciplinedStats.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-rose-300/80">
              Avg loss per indiscipline: <strong className="text-rose-400 font-mono">{formatCurrency(undisciplinedStats.avgPnl, currency, true)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Emotional States Breakdown Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">
          Performance by Trader Psychological State
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tracking which emotional state generates your highest and lowest returns
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium font-sans">
                <th className="py-2.5 px-3">Emotional State</th>
                <th className="py-2.5 px-3 text-right">Trades</th>
                <th className="py-2.5 px-3 text-right">Win Rate</th>
                <th className="py-2.5 px-3 text-right">Net P&L</th>
                <th className="py-2.5 px-3 text-right">Avg P&L</th>
                <th className="py-2.5 px-3 text-right">Profit Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {emotionStats.map(item => {
                const isProfitable = item.netPnl >= 0;
                return (
                  <tr key={item.emotion} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      <span className={item.emotion === 'Disciplined' ? 'text-emerald-400' : item.emotion === 'FOMO' || item.emotion === 'Revenge' ? 'text-rose-400' : 'text-slate-300'}>
                        {item.emotion}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                      {item.count}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">
                      {item.winRate.toFixed(1)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold tabular-nums ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(item.netPnl, currency, true)}
                    </td>
                    <td className={`py-2.5 px-3 text-right tabular-nums ${item.avgPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(item.avgPnl, currency, true)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                      {item.profitFactor > 50 ? '50+' : item.profitFactor.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Costly Mistakes & Violations Leaderboard */}
      {violationList.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-rose-300 mb-1">
            Top Costly Mistakes / Rule Violations
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Total capital drained by specific indisciplined habits
          </p>

          <div className="space-y-2.5">
            {violationList.map(v => (
              <div 
                key={v.violation}
                className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{v.violation}</span>
                  <span className="text-[11px] text-slate-500">Occurred {v.count} time{v.count > 1 ? 's' : ''}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-slate-400 text-[11px] block">Capital Lost</span>
                  <span className="font-bold text-rose-400">-{formatCurrency(v.loss, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
