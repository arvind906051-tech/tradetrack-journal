import React from 'react';
import { useTradeContext } from '../context/TradeContext';
import { formatCurrency, formatPercent, formatRMultiple, formatDate } from '../utils/formatters';
import { X, Edit3, Trash2, CheckCircle2, AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react';

export const TradeDetailModal: React.FC = () => {
  const { 
    selectedTradeForDetail, 
    setSelectedTradeForDetail, 
    setEditingTrade, 
    setIsTradeModalOpen,
    deleteTrade,
    requestConfirm,
    currency,
    t 
  } = useTradeContext();

  if (!selectedTradeForDetail) return null;

  const trade = selectedTradeForDetail;
  const isWin = (trade.pnl || 0) > 0.01;
  const isLoss = (trade.pnl || 0) < -0.01;
  const isClosed = trade.status === 'CLOSED';

  const handleEdit = () => {
    setEditingTrade(trade);
    setSelectedTradeForDetail(null);
    setIsTradeModalOpen(true);
  };

  const handleDelete = () => {
    requestConfirm({
      title: `Delete trade for ${trade.symbol}?`,
      message: 'This will permanently remove this trade and its notes from your journal. This action cannot be undone.',
      confirmLabel: 'Delete Trade',
      isDestructive: true,
      onConfirm: () => {
        deleteTrade(trade.id);
        setSelectedTradeForDetail(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-tight text-white">{trade.symbol}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  trade.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {trade.direction}
                </span>
                <span className="text-xs text-slate-500">{trade.assetClass}</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{formatDate(trade.entryDate)}</span>
                {trade.entryTime && <span>· {trade.entryTime}</span>}
                {trade.timeframe && <span>· {trade.timeframe}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleEdit}
              title="Edit Trade"
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete Trade"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTradeForDetail(null)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Main Result Banner */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
            <div>
              <span className="text-slate-500 block mb-0.5">Realized Net P&L</span>
              <div className={`text-xl font-bold font-mono tabular-nums ${
                isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {isClosed ? formatCurrency(trade.pnl, currency, true) : 'Open Position'}
              </div>
              {isClosed && (
                <div className={`text-[11px] font-mono ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatPercent(trade.pnlPercent)}
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Realized R-Multiple</span>
              <div className={`text-xl font-bold font-mono tabular-nums ${
                (trade.rMultiple || 0) > 0 ? 'text-emerald-400' : (trade.rMultiple || 0) < 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {formatRMultiple(trade.rMultiple)}
              </div>
              <div className="text-[11px] text-slate-500">
                Risk/Reward Outcome
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Discipline Status</span>
              <div className="flex items-center gap-1.5 mt-1">
                {trade.followedRules ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-400">Rules Followed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-amber-400">Rule Violation</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Emotion: <span className="text-slate-200">{trade.emotion}</span>
              </div>
            </div>
          </div>

          {/* Trade Execution Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 font-mono">
            <div>
              <span className="text-slate-500 block">Entry Price</span>
              <span className="text-sm font-semibold text-white">{formatCurrency(trade.entryPrice, currency)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Exit Price</span>
              <span className="text-sm font-semibold text-white">
                {trade.exitPrice ? formatCurrency(trade.exitPrice, currency) : 'In Progress'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Position Size</span>
              <span className="text-sm font-semibold text-white">{trade.quantity.toLocaleString()} units</span>
            </div>
            <div>
              <span className="text-slate-500 block">Brokerage & Fees</span>
              <span className="text-sm font-semibold text-slate-400">{formatCurrency(trade.fees, currency)}</span>
            </div>

            {trade.stopLoss && (
              <div>
                <span className="text-slate-500 block">Stop Loss</span>
                <span className="text-sm font-semibold text-rose-400">{formatCurrency(trade.stopLoss, currency)}</span>
              </div>
            )}
            {trade.takeProfit && (
              <div>
                <span className="text-slate-500 block">Target / TP</span>
                <span className="text-sm font-semibold text-emerald-400">{formatCurrency(trade.takeProfit, currency)}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Setup Strategy</span>
              <span className="text-sm font-semibold text-slate-200 font-sans">{trade.strategy || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Session</span>
              <span className="text-sm font-semibold text-slate-200 font-sans">{trade.marketSession || '—'}</span>
            </div>
          </div>

          {/* Rule Violations if any */}
          {trade.ruleViolations && trade.ruleViolations.length > 0 && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl">
              <span className="font-semibold text-amber-300 block mb-1">Violations Noted:</span>
              <ul className="list-disc list-inside text-amber-200/90 space-y-0.5">
                {trade.ruleViolations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Chart Screenshot if present */}
          {trade.chartImage && (
            <div>
              <span className="text-slate-400 font-medium block mb-1">Attached Chart Analysis</span>
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                <img 
                  src={trade.chartImage} 
                  alt="Chart Screenshot" 
                  className="w-full max-h-72 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Trade Notes */}
          {trade.notes && (
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3.5">
              <span className="text-slate-400 font-medium block mb-1">Trade Notes & Rationale</span>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
            </div>
          )}

          {/* Lessons Learned */}
          {trade.lessons && (
            <div className="bg-emerald-950/10 border border-emerald-800/30 rounded-xl p-3.5">
              <span className="text-emerald-400 font-medium block mb-1">Key Lessons & Improvement</span>
              <p className="text-emerald-200/90 whitespace-pre-wrap leading-relaxed">{trade.lessons}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={() => setSelectedTradeForDetail(null)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
