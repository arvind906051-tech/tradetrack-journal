import React, { useState, useEffect } from 'react';
import { useTradeContext } from '../context/TradeContext';
import { AssetClass, TradeDirection, TradeStatus, TradingEmotion, Trade } from '../types/trade';
import { formatCurrency, formatRMultiple } from '../utils/formatters';
import { X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

const COMMON_STRATEGIES = [
  'Opening Range Breakout',
  'VWAP Bounce',
  'Support & Resistance',
  'Breakout',
  'Swing Pullback',
  'Mean Reversion',
  'SMC / Fair Value Gap',
  'Option Selling / Straddle',
  'Trend Continuation',
  'Failed Breakdown (Trap)'
];

const COMMON_VIOLATIONS = [
  'Chased price without pullback',
  'Moved stop-loss further away',
  'Over-leveraged / Exceeded max position size',
  'Revenge trading after a loss',
  'Entered without technical confirmation',
  'Cut winning trade too early out of fear',
  'Over-traded past daily limit'
];

export const TradeModal: React.FC = () => {
  const { 
    isTradeModalOpen, 
    setIsTradeModalOpen, 
    editingTrade, 
    setEditingTrade,
    addTrade, 
    updateTrade, 
    currency,
    showToast,
    t 
  } = useTradeContext();

  const [activeTab, setActiveTab] = useState<'details' | 'strategy' | 'psychology' | 'notes'>('details');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [symbol, setSymbol] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('Options');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [status, setStatus] = useState<TradeStatus>('CLOSED');
  
  const [entryDate, setEntryDate] = useState('');
  const [entryTime, setEntryTime] = useState('09:45');
  const [exitDate, setExitDate] = useState('');
  const [exitTime, setExitTime] = useState('11:30');

  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(50);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [fees, setFees] = useState<number>(40);

  const [strategy, setStrategy] = useState('Opening Range Breakout');
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | 'Daily' | 'Weekly'>('5m');
  const [marketSession, setMarketSession] = useState<'Morning / Open' | 'Mid-Day' | 'Power Hour' | 'After Hours'>('Morning / Open');

  const [emotion, setEmotion] = useState<TradingEmotion>('Disciplined');
  const [followedRules, setFollowedRules] = useState(true);
  const [ruleViolations, setRuleViolations] = useState<string[]>([]);

  const [notes, setNotes] = useState('');
  const [lessons, setLessons] = useState('');
  const [chartImage, setChartImage] = useState<string | undefined>(undefined);

  // Auto-calculated fields
  const [calcPnl, setCalcPnl] = useState(0);
  const [calcRoi, setCalcRoi] = useState(0);
  const [calcR, setCalcR] = useState<number | undefined>(undefined);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingTrade) {
      setSymbol(editingTrade.symbol);
      setAssetClass(editingTrade.assetClass);
      setDirection(editingTrade.direction);
      setStatus(editingTrade.status);
      setEntryDate(editingTrade.entryDate);
      setEntryTime(editingTrade.entryTime || '09:30');
      setExitDate(editingTrade.exitDate || editingTrade.entryDate);
      setExitTime(editingTrade.exitTime || '11:00');
      setEntryPrice(editingTrade.entryPrice);
      setExitPrice(editingTrade.exitPrice || 0);
      setQuantity(editingTrade.quantity);
      setStopLoss(editingTrade.stopLoss || 0);
      setTakeProfit(editingTrade.takeProfit || 0);
      setFees(editingTrade.fees || 0);
      setStrategy(editingTrade.strategy || 'Opening Range Breakout');
      setTimeframe(editingTrade.timeframe || '5m');
      setMarketSession(editingTrade.marketSession || 'Morning / Open');
      setEmotion(editingTrade.emotion);
      setFollowedRules(editingTrade.followedRules);
      setRuleViolations(editingTrade.ruleViolations || []);
      setNotes(editingTrade.notes || '');
      setLessons(editingTrade.lessons || '');
      setChartImage(editingTrade.chartImage);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSymbol('');
      setAssetClass('Options');
      setDirection('LONG');
      setStatus('CLOSED');
      setEntryDate(today);
      setEntryTime('09:45');
      setExitDate(today);
      setExitTime('11:15');
      setEntryPrice(100);
      setExitPrice(125);
      setQuantity(100);
      setStopLoss(90);
      setTakeProfit(130);
      setFees(40);
      setStrategy('Opening Range Breakout');
      setTimeframe('5m');
      setMarketSession('Morning / Open');
      setEmotion('Disciplined');
      setFollowedRules(true);
      setRuleViolations([]);
      setNotes('');
      setLessons('');
      setChartImage(undefined);
    }
    setActiveTab('details');
  }, [editingTrade, isTradeModalOpen]);

  // Recalculate metrics whenever price, qty, fees, sl, tp change
  useEffect(() => {
    const ep = Number(entryPrice) || 0;
    const xp = Number(exitPrice) || 0;
    const qty = Number(quantity) || 0;
    const f = Number(fees) || 0;
    const sl = Number(stopLoss) || 0;

    let pnl = 0;
    if (status === 'CLOSED') {
      if (direction === 'LONG') {
        pnl = (xp - ep) * qty - f;
      } else {
        pnl = (ep - xp) * qty - f;
      }
    } else {
      // open
      pnl = 0;
    }

    const totalCost = ep * qty;
    const roi = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    let rMult: number | undefined = undefined;
    if (sl > 0 && sl !== ep && status === 'CLOSED') {
      const riskPerShare = Math.abs(ep - sl);
      const gainPerShare = direction === 'LONG' ? (xp - ep) : (ep - xp);
      if (riskPerShare > 0) {
        rMult = Number((gainPerShare / riskPerShare).toFixed(2));
      }
    } else if (sl > 0 && sl !== ep && status === 'OPEN' && takeProfit > 0) {
      // planned R:R
      const riskPerShare = Math.abs(ep - sl);
      const targetGain = Math.abs(takeProfit - ep);
      if (riskPerShare > 0) {
        rMult = Number((targetGain / riskPerShare).toFixed(2));
      }
    }

    setCalcPnl(pnl);
    setCalcRoi(roi);
    setCalcR(rMult);
  }, [entryPrice, exitPrice, quantity, fees, direction, status, stopLoss, takeProfit]);

  if (!isTradeModalOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setChartImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleViolation = (item: string) => {
    setRuleViolations(prev => 
      prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) {
      setErrorMessage('Please enter a symbol or ticker.');
      showToast('Please enter a symbol or ticker', 'error');
      return;
    }
    setErrorMessage(null);

    const tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
      symbol: symbol.toUpperCase().trim(),
      assetClass,
      direction,
      status,
      entryDate,
      entryTime,
      exitDate: status === 'CLOSED' ? exitDate : undefined,
      exitTime: status === 'CLOSED' ? exitTime : undefined,
      entryPrice: Number(entryPrice),
      exitPrice: status === 'CLOSED' ? Number(exitPrice) : undefined,
      quantity: Number(quantity),
      stopLoss: Number(stopLoss) || undefined,
      takeProfit: Number(takeProfit) || undefined,
      fees: Number(fees) || 0,
      pnl: calcPnl,
      pnlPercent: Number(calcRoi.toFixed(2)),
      rMultiple: calcR,
      strategy,
      timeframe,
      marketSession,
      emotion,
      followedRules,
      ruleViolations: followedRules ? [] : ruleViolations,
      notes,
      lessons,
      chartImage
    };

    if (editingTrade) {
      updateTrade(editingTrade.id, tradeData);
    } else {
      addTrade(tradeData);
    }

    setIsTradeModalOpen(false);
    setEditingTrade(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              {editingTrade ? t.editTradeTitle : t.newTradeTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {symbol ? `${symbol} · ${assetClass} · ${direction}` : 'Record trade rationale and metrics'}
            </p>
          </div>
          <button 
            onClick={() => {
              setIsTradeModalOpen(false);
              setEditingTrade(null);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'details' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tradeDetails}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('strategy')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'strategy' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.strategyAndSetup}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('psychology')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'psychology' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.psychologyAndRules}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'notes' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.notesAndChart}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* TAB 1: Execution Details */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Symbol */}
                <div className="sm:col-span-1">
                  <label className="block text-slate-400 font-medium mb-1">{t.symbolLabel} *</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. NIFTY 24800 CE"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Asset Class */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.assetClassLabel}</label>
                  <select
                    value={assetClass}
                    onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Options">Options</option>
                    <option value="Equities">Equities / Stocks</option>
                    <option value="Futures">Futures</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Forex">Forex</option>
                    <option value="Commodities">Commodities</option>
                  </select>
                </div>

                {/* Side / Direction */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.directionLabel}</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDirection('LONG')}
                      className={`py-1 text-center font-semibold rounded cursor-pointer ${
                        direction === 'LONG' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      LONG (Buy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('SHORT')}
                      className={`py-1 text-center font-semibold rounded cursor-pointer ${
                        direction === 'SHORT' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      SHORT (Sell)
                    </button>
                  </div>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.statusLabel}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TradeStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CLOSED">CLOSED (Realized)</option>
                    <option value="OPEN">OPEN (Active)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.entryDateLabel}</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.entryTimeLabel}</label>
                  <input
                    type="time"
                    value={entryTime}
                    onChange={(e) => setEntryTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {status === 'CLOSED' ? (
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">{t.exitDateLabel}</label>
                    <input
                      type="date"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Position State</label>
                    <div className="px-2.5 py-2 bg-slate-950/60 border border-cyan-800/60 rounded-lg text-cyan-400 font-medium text-center">
                      Live Position
                    </div>
                  </div>
                )}
              </div>

              {/* Price, Qty, Target & Stop Loss */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.entryPriceLabel} *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    {status === 'CLOSED' ? `${t.exitPriceLabel} *` : 'Current / Exit Price'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                    disabled={status === 'OPEN'}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500 ${status === 'OPEN' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.quantityLabel} *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.feesLabel}</label>
                  <input
                    type="number"
                    step="any"
                    value={fees}
                    onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Stop Loss & Take Profit Targets */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.stopLossLabel}</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    placeholder="Stop loss level"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-rose-300 font-mono tabular-nums focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.takeProfitLabel}</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                    placeholder="Profit target"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-emerald-300 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live Preview Strip */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between font-mono">
                <div>
                  <span className="text-slate-500 text-[11px] block">{t.calculatedPnl}</span>
                  <span className={`text-base font-bold ${calcPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(calcPnl, currency, true)}
                  </span>
                  <span className={`text-xs ml-2 ${calcPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    ({calcRoi >= 0 ? '+' : ''}{calcRoi.toFixed(2)}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px] block">{status === 'CLOSED' ? 'Realized R:R' : t.calculatedR}</span>
                  <span className={`text-base font-bold ${(calcR || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatRMultiple(calcR)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Strategy & Timeframe */}
          {activeTab === 'strategy' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">{t.strategyLabel}</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {COMMON_STRATEGIES.map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStrategy(st)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                        strategy === st 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  placeholder="Or enter custom strategy name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.timeframeLabel}</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t.sessionLabel}</label>
                  <select
                    value={marketSession}
                    onChange={(e) => setMarketSession(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Morning / Open">Morning / Open (09:15 - 11:30)</option>
                    <option value="Mid-Day">Mid-Day (11:30 - 13:30)</option>
                    <option value="Power Hour">Power Hour / Close (13:30 - 15:30)</option>
                    <option value="After Hours">After Hours / Crypto / Global</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Psychology & Rules */}
          {activeTab === 'psychology' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1.5">{t.emotionLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Disciplined', 'Confident', 'Neutral', 'FOMO', 'Revenge', 'Anxious', 'Greedy', 'Hesitant'] as TradingEmotion[]).map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmotion(em)}
                      className={`px-3 py-2 rounded-lg border text-xs text-center transition-colors cursor-pointer ${
                        emotion === em 
                          ? em === 'Disciplined' || em === 'Confident'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                            : 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule Discipline Toggle */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block text-xs">{t.followedRulesLabel}</span>
                    <span className="text-[11px] text-slate-500">
                      Discipline is the #1 predictor of long-term profitability.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFollowedRules(!followedRules)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                      followedRules
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {followedRules ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{followedRules ? 'Yes, Followed' : 'No, Broke Rules'}</span>
                  </button>
                </div>

                {!followedRules && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-slate-400 font-medium mb-1.5">{t.ruleViolationsLabel}</label>
                    <div className="space-y-1.5">
                      {COMMON_VIOLATIONS.map(v => (
                        <label key={v} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ruleViolations.includes(v)}
                            onChange={() => handleToggleViolation(v)}
                            className="rounded border-slate-700 text-rose-500 focus:ring-0"
                          />
                          <span className="text-xs">{v}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Notes & Screenshot */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t.notesLabel}</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why did you take this trade? What did the price action and indicators show?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t.lessonsLabel}</label>
                <textarea
                  rows={2}
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  placeholder="What was the main lesson? What will you do differently next time?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1.5">{t.chartImageLabel}</label>
                {chartImage ? (
                  <div className="relative border border-slate-800 rounded-lg overflow-hidden group">
                    <img 
                      src={chartImage} 
                      alt="Trade Chart Setup" 
                      className="w-full max-h-48 object-contain bg-slate-950" 
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setChartImage(undefined)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-900 text-rose-300 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-slate-200">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-500" />
                    <span className="font-medium">{t.uploadImage}</span>
                    <span className="text-[11px] text-slate-600 mt-0.5">PNG, JPG up to 2MB</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsTradeModalOpen(false);
                setEditingTrade(null);
              }}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {t.saveTrade}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
