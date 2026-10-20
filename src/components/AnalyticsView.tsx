import React, { useState } from 'react';
import { useTradeContext } from '../context/TradeContext';
import { getEquityCurve, getBreakdownByField } from '../utils/calculations';
import { formatCurrency, formatPercent, formatRMultiple } from '../utils/formatters';
import { TrendingUp, Award, BarChart3, PieChart, ShieldAlert } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { trades, accountSettings, stats, currency, t } = useTradeContext();
  const [breakdownType, setBreakdownType] = useState<'strategy' | 'assetClass' | 'marketSession'>('strategy');

  const equityData = getEquityCurve(trades, accountSettings.initialBalance);
  const breakdownList = getBreakdownByField(trades, breakdownType);

  // SVG Equity curve geometry
  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 35, bottom: 35, left: 75 };

  const equities = equityData.map(d => d.equity);
  const minEquity = Math.min(...equities, accountSettings.initialBalance * 0.95);
  const maxEquity = Math.max(...equities, accountSettings.initialBalance * 1.05);
  const equityRange = maxEquity - minEquity || 1;

  const getX = (index: number) => {
    if (equityData.length <= 1) return padding.left;
    return padding.left + (index / (equityData.length - 1)) * (width - padding.left - padding.right);
  };

  const getY = (val: number) => {
    return height - padding.bottom - ((val - minEquity) / equityRange) * (height - padding.top - padding.bottom);
  };

  const baselineY = getY(accountSettings.initialBalance);

  const pointsString = equityData.map((d, i) => `${getX(i)},${getY(d.equity)}`).join(' ');

  // Gradient area points
  const areaString = `${pointsString} ${getX(equityData.length - 1)},${height - padding.bottom} ${padding.left},${height - padding.bottom}`;

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* 1. Equity Curve Chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Cumulative Equity & P&L Curve</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Account balance growth from starting capital of {formatCurrency(accountSettings.initialBalance, currency)}
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-400">Peak: <strong className="text-white">{formatCurrency(maxEquity, currency)}</strong></span>
            <span className="text-slate-400">Current: <strong className={stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {formatCurrency(equityData[equityData.length - 1]?.equity || accountSettings.initialBalance, currency)}
            </strong></span>
          </div>
        </div>

        {/* SVG Curve */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[650px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const val = minEquity + pct * equityRange;
                const y = getY(val);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="rgba(51, 65, 85, 0.3)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      textAnchor="end"
                    >
                      {formatCurrency(val, currency)}
                    </text>
                  </g>
                );
              })}

              {/* Initial capital baseline */}
              <line
                x1={padding.left}
                y1={baselineY}
                x2={width - padding.right}
                y2={baselineY}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />

              {/* Shaded Area */}
              <polygon points={areaString} fill="url(#equityGradient)" />

              {/* Curve Line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />

              {/* Circles on trade points */}
              {equityData.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.equity);
                const isHovered = hoveredPoint === i;

                return (
                  <g 
                    key={i} 
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.5}
                      fill={i === 0 ? '#64748b' : d.pnl >= 0 ? '#10b981' : '#f43f5e'}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={Math.min(Math.max(cx - 65, 10), width - 140)}
                          y={Math.max(cy - 48, 5)}
                          width="130"
                          height="42"
                          rx="6"
                          fill="#0f172a"
                          stroke="#334155"
                        />
                        <text
                          x={Math.min(Math.max(cx - 65, 10), width - 140) + 65}
                          y={Math.max(cy - 48, 5) + 16}
                          fill="#e2e8f0"
                          fontSize="10"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {d.symbol}
                        </text>
                        <text
                          x={Math.min(Math.max(cx - 65, 10), width - 140) + 65}
                          y={Math.max(cy - 48, 5) + 32}
                          fill={d.pnl >= 0 ? '#34d399' : '#fb7185'}
                          fontSize="10"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                        >
                          {i === 0 ? 'Starting' : formatCurrency(d.pnl, currency, true)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Strategy & Performance Breakdown */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Performance Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identify which setups and asset classes generate your highest edge
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setBreakdownType('strategy')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                breakdownType === 'strategy' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              By Strategy
            </button>
            <button
              onClick={() => setBreakdownType('assetClass')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                breakdownType === 'assetClass' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              By Asset Class
            </button>
            <button
              onClick={() => setBreakdownType('marketSession')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                breakdownType === 'marketSession' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              By Session
            </button>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Name / Setup</th>
                <th className="py-2.5 px-3 text-right">Trades</th>
                <th className="py-2.5 px-3 text-right">Win Rate</th>
                <th className="py-2.5 px-3 text-right">Net P&L</th>
                <th className="py-2.5 px-3 text-right">Profit Factor</th>
                <th className="py-2.5 px-3 text-right">Avg P&L / Trade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {breakdownList.map(item => {
                const isProfitable = item.netPnl >= 0;
                return (
                  <tr key={item.name} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                      {item.count} <span className="text-slate-600">({item.wins}W/{item.losses}L)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">
                      {item.winRate.toFixed(1)}%
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold tabular-nums ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(item.netPnl, currency, true)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                      {item.profitFactor > 50 ? '50+' : item.profitFactor.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 text-right tabular-nums ${item.avgPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(item.avgPnl, currency, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Deep Statistical Rigor Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk & Drawdown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Risk & Drawdown Rigor</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Max Drawdown Amount:</span>
              <span className="text-rose-400 font-semibold">-{formatCurrency(stats.maxDrawdownAmount, currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Max Drawdown %:</span>
              <span className="text-rose-400 font-semibold">-{stats.maxDrawdownPercent.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Total Brokerage & Fees:</span>
              <span className="text-slate-300">{formatCurrency(stats.totalFees, currency)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Rule Discipline Score:</span>
              <span className="text-emerald-400 font-semibold">{stats.ruleAdherenceRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Extremes & Records */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Outcomes & Extremes</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Largest Winning Trade:</span>
              <span className="text-emerald-400 font-semibold">+{formatCurrency(stats.largestWin, currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Largest Losing Trade:</span>
              <span className="text-rose-400 font-semibold">-{formatCurrency(Math.abs(stats.largestLoss), currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Best Win Streak:</span>
              <span className="text-emerald-400 font-semibold">{stats.bestWinStreak} Trades</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Worst Loss Streak:</span>
              <span className="text-rose-400 font-semibold">{stats.worstLossStreak} Trades</span>
            </div>
          </div>
        </div>

        {/* Expectancy & Math */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <span>Mathematical Edge</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Gross Total Profit:</span>
              <span className="text-emerald-400 font-semibold">+{formatCurrency(stats.grossProfit, currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Gross Total Loss:</span>
              <span className="text-rose-400 font-semibold">-{formatCurrency(stats.grossLoss, currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Win/Loss Ratio:</span>
              <span className="text-slate-200 font-semibold">{stats.winLossRatio.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Expected Value / Trade:</span>
              <span className={`font-semibold ${stats.closedTrades > 0 && stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.closedTrades > 0 ? formatCurrency(stats.netPnl / stats.closedTrades, currency, true) : '₹0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
