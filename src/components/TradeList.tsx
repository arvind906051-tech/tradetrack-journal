import React, { useState } from 'react';
import { useTradeContext } from '../context/TradeContext';
import { formatCurrency, formatPercent, formatRMultiple, formatDate } from '../utils/formatters';
import { Trade } from '../types/trade';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  X,
  Check,
  RefreshCw
} from 'lucide-react';

export const TradeList: React.FC = () => {
  const { 
    filteredTrades, 
    filter, 
    setFilter, 
    resetFilter, 
    currency, 
    deleteTrade, 
    setEditingTrade, 
    setIsTradeModalOpen,
    setSelectedTradeForDetail,
    closeTrade,
    requestConfirm,
    setIsAngelModalOpen,
    isSyncingAngel,
    t 
  } = useTradeContext();

  const [quickCloseTradeId, setQuickCloseTradeId] = useState<string | null>(null);
  const [quickClosePrice, setQuickClosePrice] = useState<number>(0);
  const [quickCloseFees, setQuickCloseFees] = useState<number>(50);

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setIsTradeModalOpen(true);
  };

  const handleView = (trade: Trade) => {
    setSelectedTradeForDetail(trade);
  };

  const handleDelete = (id: string, symbol: string) => {
    requestConfirm({
      title: `Delete Trade for ${symbol}?`,
      message: 'This will permanently remove this trade and its notes from your journal. This action cannot be undone.',
      confirmLabel: 'Delete Trade',
      isDestructive: true,
      onConfirm: () => {
        deleteTrade(id);
      }
    });
  };

  const handleStartQuickClose = (trade: Trade) => {
    setQuickCloseTradeId(trade.id);
    setQuickClosePrice(trade.entryPrice);
  };

  const handleConfirmQuickClose = (tradeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    closeTrade(tradeId, quickClosePrice, today, nowTime, quickCloseFees);
    setQuickCloseTradeId(null);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {filter.search && (
              <button 
                onClick={() => setFilter(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Actions & Status Tabs */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Angel One SmartAPI Auto-Sync Button */}
            <button
              onClick={() => setIsAngelModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Sync trades automatically from Angel One SmartAPI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAngel ? 'animate-spin' : ''}`} />
              <span>{isSyncingAngel ? t.syncingAngel : t.syncAngelOne}</span>
            </button>

            {/* Quick Segmented Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setFilter(prev => ({ ...prev, status: 'all' }))}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  filter.status === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter(prev => ({ ...prev, status: 'CLOSED' }))}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  filter.status === 'CLOSED' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Closed
              </button>
              <button
                onClick={() => setFilter(prev => ({ ...prev, status: 'OPEN' }))}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  filter.status === 'OPEN' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Open
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Asset Class */}
          <select
            value={filter.assetClass}
            onChange={(e) => setFilter(prev => ({ ...prev, assetClass: e.target.value }))}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{t.filterAllAssets}</option>
            <option value="Equities">Equities / Stocks</option>
            <option value="Options">Options</option>
            <option value="Futures">Futures</option>
            <option value="Crypto">Crypto</option>
            <option value="Forex">Forex</option>
            <option value="Commodities">Commodities</option>
          </select>

          {/* Direction */}
          <select
            value={filter.direction}
            onChange={(e) => setFilter(prev => ({ ...prev, direction: e.target.value }))}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{t.filterAllDirections}</option>
            <option value="LONG">Long (Buy)</option>
            <option value="SHORT">Short (Sell)</option>
          </select>

          {/* Result */}
          <select
            value={filter.result}
            onChange={(e) => setFilter(prev => ({ ...prev, result: e.target.value as any }))}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{t.filterAllResults}</option>
            <option value="win">Wins only</option>
            <option value="loss">Losses only</option>
            <option value="breakeven">Breakeven</option>
          </select>

          {/* Emotion */}
          <select
            value={filter.emotion}
            onChange={(e) => setFilter(prev => ({ ...prev, emotion: e.target.value }))}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{t.filterAllEmotions}</option>
            <option value="Disciplined">Disciplined</option>
            <option value="Confident">Confident</option>
            <option value="FOMO">FOMO</option>
            <option value="Revenge">Revenge</option>
            <option value="Anxious">Anxious</option>
            <option value="Greedy">Greedy</option>
          </select>

          {/* Discipline */}
          <select
            value={filter.ruleFollowed}
            onChange={(e) => setFilter(prev => ({ ...prev, ruleFollowed: e.target.value as any }))}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{t.allRules}</option>
            <option value="yes">{t.rulesFollowed}</option>
            <option value="no">{t.rulesViolated}</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1">
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">Past 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>

            <button
              onClick={resetFilter}
              title="Reset all filters"
              className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trade Quick-Close Bar if triggered */}
      {quickCloseTradeId && (
        <div className="p-3 bg-slate-950/90 border-b border-emerald-500/30 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">Close Position:</span>
            <span className="text-slate-300">{filteredTrades.find(t => t.id === quickCloseTradeId)?.symbol}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-slate-400">Exit Price:</label>
              <input
                type="number"
                step="any"
                value={quickClosePrice}
                onChange={(e) => setQuickClosePrice(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right font-mono text-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-slate-400">Fees:</label>
              <input
                type="number"
                step="any"
                value={quickCloseFees}
                onChange={(e) => setQuickCloseFees(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right font-mono text-white"
              />
            </div>
            <button
              onClick={() => handleConfirmQuickClose(quickCloseTradeId)}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded flex items-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Exit</span>
            </button>
            <button
              onClick={() => setQuickCloseTradeId(null)}
              className="px-2 py-1 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Trades Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/60">
              <th className="py-3 px-4">
                <button 
                  onClick={() => setFilter(prev => ({ 
                    ...prev, 
                    sortBy: 'date', 
                    sortOrder: prev.sortBy === 'date' && prev.sortOrder === 'desc' ? 'asc' : 'desc' 
                  }))}
                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                >
                  <span>{t.date}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">
                <button 
                  onClick={() => setFilter(prev => ({ 
                    ...prev, 
                    sortBy: 'symbol', 
                    sortOrder: prev.sortBy === 'symbol' && prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                >
                  <span>{t.symbol}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">{t.direction}</th>
              <th className="py-3 px-4 text-right">{t.entryExit}</th>
              <th className="py-3 px-4 text-right">{t.qty}</th>
              <th className="py-3 px-4 text-right">
                <button 
                  onClick={() => setFilter(prev => ({ 
                    ...prev, 
                    sortBy: 'pnl', 
                    sortOrder: prev.sortBy === 'pnl' && prev.sortOrder === 'desc' ? 'asc' : 'desc' 
                  }))}
                  className="flex items-center gap-1 hover:text-white ml-auto cursor-pointer"
                >
                  <span>{t.pnlReturn}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">
                <button 
                  onClick={() => setFilter(prev => ({ 
                    ...prev, 
                    sortBy: 'rMultiple', 
                    sortOrder: prev.sortBy === 'rMultiple' && prev.sortOrder === 'desc' ? 'asc' : 'desc' 
                  }))}
                  className="flex items-center gap-1 hover:text-white ml-auto cursor-pointer"
                >
                  <span>{t.rMultipleCol}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4">{t.strategyCol}</th>
              <th className="py-3 px-4">{t.emotionCol}</th>
              <th className="py-3 px-4 text-center">{t.statusCol}</th>
              <th className="py-3 px-4 text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <p className="text-sm font-medium text-slate-400">{t.noTradesFound}</p>
                    <p className="text-xs text-slate-500 mt-1">{t.startLogging}</p>
                    <button
                      onClick={() => {
                        setEditingTrade(null);
                        setIsTradeModalOpen(true);
                      }}
                      className="mt-4 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.logTrade}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrades.map(trade => {
                const isWin = (trade.pnl || 0) > 0.01;
                const isLoss = (trade.pnl || 0) < -0.01;
                const isClosed = trade.status === 'CLOSED';

                return (
                  <tr 
                    key={trade.id} 
                    className="hover:bg-slate-800/30 transition-colors group cursor-default"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono">
                      <div>{formatDate(trade.entryDate)}</div>
                      <div className="text-[11px] text-slate-500">{trade.entryTime || '—'}</div>
                    </td>

                    {/* Symbol & Asset (Clean unboxed text metadata) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-100 font-mono tracking-tight">{trade.symbol}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span>{trade.assetClass}</span>
                        {trade.timeframe && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{trade.timeframe}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Direction */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium">
                      <span className={trade.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>
                        {trade.direction}
                      </span>
                    </td>

                    {/* Entry / Exit */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums">
                      <div className="text-slate-200">{formatCurrency(trade.entryPrice, currency)}</div>
                      <div className="text-[11px] text-slate-500">
                        {isClosed ? formatCurrency(trade.exitPrice || 0, currency) : 'In Trade'}
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums text-slate-300">
                      {trade.quantity.toLocaleString()}
                    </td>

                    {/* P&L & Return % */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums">
                      {isClosed ? (
                        <>
                          <div className={`font-semibold ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}`}>
                            {formatCurrency(trade.pnl, currency, true)}
                          </div>
                          <div className={`text-[11px] ${isWin ? 'text-emerald-500/80' : isLoss ? 'text-rose-500/80' : 'text-slate-500'}`}>
                            {formatPercent(trade.pnlPercent)}
                          </div>
                        </>
                      ) : (
                        <div className="text-cyan-400 font-medium">
                          {trade.pnl ? formatCurrency(trade.pnl, currency, true) : 'Open'}
                        </div>
                      )}
                    </td>

                    {/* R-Multiple */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums">
                      <span className={
                        (trade.rMultiple || 0) > 0 
                          ? 'text-emerald-400' 
                          : (trade.rMultiple || 0) < 0 
                          ? 'text-rose-400' 
                          : 'text-slate-500'
                      }>
                        {formatRMultiple(trade.rMultiple)}
                      </span>
                    </td>

                    {/* Strategy */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      <div>{trade.strategy || '—'}</div>
                      {trade.marketSession && (
                        <div className="text-[11px] text-slate-500">{trade.marketSession}</div>
                      )}
                    </td>

                    {/* Emotion & Rule discipline (Unboxed with checkmark/warning) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {trade.followedRules ? (
                          <span title="Rules followed strictly">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </span>
                        ) : (
                          <span title="Rule violation noted">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        <span className={`text-xs ${
                          trade.emotion === 'Disciplined' 
                            ? 'text-emerald-400' 
                            : trade.emotion === 'FOMO' || trade.emotion === 'Revenge'
                            ? 'text-rose-400 font-medium'
                            : 'text-slate-300'
                        }`}>
                          {trade.emotion}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isClosed ? (
                        <span className="text-xs text-slate-500 font-mono">Closed</span>
                      ) : (
                        <button
                          onClick={() => handleStartQuickClose(trade)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 rounded hover:bg-cyan-900/50 transition-colors"
                        >
                          Close Pos
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(trade)}
                          title="View Trade Details & Notes"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(trade)}
                          title="Edit Trade"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(trade.id, trade.symbol)}
                          title="Delete Trade"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>Showing {filteredTrades.length} of {useTradeContext().trades.length} trades</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span>
            Filtered P&L: {' '}
            <strong className={
              filteredTrades.reduce((acc, t) => acc + (t.pnl || 0), 0) >= 0 
                ? 'text-emerald-400' 
                : 'text-rose-400'
            }>
              {formatCurrency(filteredTrades.reduce((acc, t) => acc + (t.pnl || 0), 0), currency, true)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
