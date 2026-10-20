import React, { useState } from 'react';
import { useTradeContext } from '../context/TradeContext';
import { calculatePositionSize } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { X, Calculator, ArrowRight, ShieldCheck } from 'lucide-react';

export const RiskCalculatorModal: React.FC = () => {
  const { 
    isCalculatorOpen, 
    setIsCalculatorOpen, 
    accountSettings, 
    currency,
    setEditingTrade,
    setIsTradeModalOpen,
    t 
  } = useTradeContext();

  const [capital, setCapital] = useState<number>(accountSettings.initialBalance || 250000);
  const [riskPct, setRiskPct] = useState<number>(accountSettings.maxRiskPerTradePercent || 1.5);
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<number>(92);
  const [targetPrice, setTargetPrice] = useState<number>(120);

  if (!isCalculatorOpen) return null;

  const res = calculatePositionSize(capital, riskPct, entryPrice, stopLoss);

  // R:R calculation
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  const rewardPerShare = Math.abs(targetPrice - entryPrice);
  const rrRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(2) : '0.00';
  const totalReward = res.positionSize * rewardPerShare;

  const handlePreFillTrade = () => {
    setIsCalculatorOpen(false);
    setEditingTrade({
      id: '',
      symbol: '',
      assetClass: 'Equities',
      direction: entryPrice >= stopLoss ? 'LONG' : 'SHORT',
      status: 'OPEN',
      entryDate: new Date().toISOString().split('T')[0],
      entryTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      entryPrice,
      stopLoss,
      takeProfit: targetPrice,
      quantity: res.positionSize,
      fees: 40,
      pnl: 0,
      pnlPercent: 0,
      rMultiple: Number(rrRatio),
      strategy: 'Breakout',
      emotion: 'Disciplined',
      followedRules: true,
      notes: `Planned via Position Sizer. Risk: ${formatCurrency(res.riskAmount, currency)} (${riskPct}%). R:R ${rrRatio}:1`,
      lessons: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setIsTradeModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">{t.calculatorTitle}</h3>
              <p className="text-xs text-slate-400">{t.calcSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCalculatorOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">{t.accountCapital}</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">{t.riskPercentage}</label>
              <div className="flex items-center gap-1">
                {[1, 1.5, 2, 3].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRiskPct(pct)}
                    className={`flex-1 py-1.5 rounded border text-center transition-colors font-mono cursor-pointer ${
                      riskPct === pct 
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">{t.calcEntryPrice}</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">{t.calcStopLoss}</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-rose-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">{t.calcTargetPrice}</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Calculated Results Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 text-xs font-sans">{t.recommendedQty}</span>
            <span className="text-xl font-bold text-white">{res.positionSize.toLocaleString()} units</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block font-sans">Max Loss on SL:</span>
              <span className="text-rose-400 font-semibold">-{formatCurrency(res.riskAmount, currency)}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Profit on Target:</span>
              <span className="text-emerald-400 font-semibold">+{formatCurrency(totalReward, currency)}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Total Order Value:</span>
              <span className="text-slate-300">{formatCurrency(res.totalCost, currency)}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Risk / Reward (R:R):</span>
              <span className="text-emerald-400 font-bold font-mono">1 : {rrRatio}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => setIsCalculatorOpen(false)}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            onClick={handlePreFillTrade}
            disabled={res.positionSize <= 0}
            className="px-4 py-2 text-xs font-semibold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <span>{t.useInTrade}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
