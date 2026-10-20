import React, { useState } from 'react';
import { useTradeContext } from '../context/TradeContext';
import { ShieldCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const TradingRulesView: React.FC = () => {
  const { tradingRules, toggleRule, addRule, deleteRule, requestConfirm, stats, t } = useTradeContext();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'Risk Management' | 'Execution' | 'Psychology'>('Risk Management');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addRule(newTitle.trim(), newDesc.trim(), newCategory);
    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  };

  const categories = ['Risk Management', 'Execution', 'Psychology'] as const;

  return (
    <div className="space-y-6">
      {/* Header and Discipline Score Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Trader's Playbook & Golden Rules</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-negotiable trading principles to prevent drawdowns and enforce process over outcome
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs flex items-center gap-2">
            <span className="text-slate-400 font-sans">Discipline Adherence:</span>
            <span className="text-emerald-400 font-bold">{stats.ruleAdherenceRate.toFixed(0)}%</span>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Add New Rule Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">Create New Trading Rule</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Rule Statement *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Stop trading after 2 consecutive losses in a single day"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Risk Management">Risk Management</option>
                <option value="Execution">Execution</option>
                <option value="Psychology">Psychology</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Rationale / Description (Optional)</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Why this rule exists and what protects your capital..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-400 text-slate-950 font-semibold rounded-lg hover:bg-emerald-300"
            >
              Save Rule
            </button>
          </div>
        </form>
      )}

      {/* Rules by Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {categories.map(cat => {
          const catRules = tradingRules.filter(r => r.category === cat);
          return (
            <div key={cat} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-semibold text-slate-200 text-xs">{cat}</h3>
                <span className="text-[11px] text-slate-500 font-mono">{catRules.length} rules</span>
              </div>

              <div className="space-y-2.5">
                {catRules.map(rule => (
                  <div
                    key={rule.id}
                    className={`p-3 rounded-lg border transition-all text-xs ${
                      rule.enabled 
                        ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700' 
                        : 'bg-slate-950/40 border-slate-900 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => toggleRule(rule.id)}
                          className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <div>
                          <span className={`font-semibold block ${rule.enabled ? 'text-slate-100' : 'text-slate-400 line-through'}`}>
                            {rule.title}
                          </span>
                          {rule.description && (
                            <span className="text-[11px] text-slate-400 mt-0.5 block leading-relaxed">
                              {rule.description}
                            </span>
                          )}
                        </div>
                      </label>

                      <button
                        onClick={() => {
                          requestConfirm({
                            title: `Delete rule "${rule.title}"?`,
                            message: 'This rule will be removed from your trading checklist.',
                            confirmLabel: 'Delete Rule',
                            isDestructive: true,
                            onConfirm: () => deleteRule(rule.id)
                          });
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
