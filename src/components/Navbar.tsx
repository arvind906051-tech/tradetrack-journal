import React from 'react';
import { useTradeContext } from '../context/TradeContext';
import { Plus, Calculator, Download, Upload, RefreshCw } from 'lucide-react';
import { CurrencyCode } from '../types/trade';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setIsTradeModalOpen, 
    setEditingTrade,
    setIsCalculatorOpen,
    language,
    setLanguage,
    currency,
    setCurrency,
    exportToCSV,
    exportToJSON,
    importTradesJSON,
    resetToSampleData,
    clearAllTrades,
    requestConfirm,
    showToast,
    isAngelModalOpen,
    setIsAngelModalOpen,
    isSyncingAngel,
    hasAngelEnv,
    t 
  } = useTradeContext();

  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsTradeModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = importTradesJSON(text);
        if (success) {
          showToast('Data imported successfully!', 'success');
        } else {
          showToast('Could not parse backup file. Please ensure it is a valid JSON export.', 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
            T
          </div>
          <button 
            onClick={() => setActiveTab('journal')}
            className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
          >
            TradeTrack
          </button>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean typography) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('journal')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'journal' 
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navJournal}
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'analytics' 
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navAnalytics}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'calendar' 
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navCalendar}
          </button>

          <button
            onClick={() => setActiveTab('psychology')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'psychology' 
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navPsychology}
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'rules' 
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.navRules}
          </button>
        </nav>

        {/* Zone 3: Actions, Currency, Language, and Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Tools */}
          <button
            onClick={() => setIsCalculatorOpen(true)}
            title="Position Size & Risk Calculator"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors hidden sm:flex items-center gap-1.5 text-xs"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">{t.navCalculator}</span>
          </button>

          {/* Backup dropdown / controls */}
          <div className="relative group hidden sm:block">
            <button
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Backup & Export"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1.5 hidden group-hover:block z-50 text-xs">
              <button 
                onClick={exportToCSV}
                className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 rounded transition-colors"
              >
                Export to CSV
              </button>
              <button 
                onClick={exportToJSON}
                className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 rounded transition-colors"
              >
                Export JSON Backup
              </button>
              <label className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center justify-between">
                <span>Import JSON</span>
                <Upload className="w-3 h-3 text-slate-400" />
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
              <div className="my-1 border-t border-slate-800" />
              <button 
                onClick={() => {
                  requestConfirm({
                    title: 'Reset to Sample Trades?',
                    message: 'This will restore the sample trade dataset and default account rules.',
                    confirmLabel: 'Reset Demo Data',
                    isDestructive: false,
                    onConfirm: () => resetToSampleData()
                  });
                }}
                className="w-full text-left px-3 py-1.5 text-amber-400 hover:bg-slate-800 rounded transition-colors flex items-center justify-between"
              >
                <span>{t.resetData}</span>
                <RefreshCw className="w-3 h-3" />
              </button>
              <button 
                onClick={() => {
                  requestConfirm({
                    title: 'Clear All Trades?',
                    message: 'Are you sure you want to delete all trades from your journal? This cannot be undone.',
                    confirmLabel: 'Clear All',
                    isDestructive: true,
                    onConfirm: () => clearAllTrades()
                  });
                }}
                className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-slate-800 rounded transition-colors"
              >
                <span>{t.clearAll}</span>
              </button>
            </div>
          </div>

          {/* Currency Toggle */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
            aria-label="Currency"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors font-medium whitespace-nowrap"
            title="Toggle Language"
          >
            {language === 'en' ? 'हिंदी' : 'English'}
          </button>

          {/* Angel One SmartAPI Auto-Sync Button */}
          <button
            onClick={() => setIsAngelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            title="Sync tradebook automatically from Angel One SmartAPI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAngel ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncingAngel ? t.syncingAngel : t.syncAngelOne}</span>
            <span className="sm:hidden">Angel Sync</span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={handleOpenNewTrade}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.logTrade}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-2 text-xs bg-slate-950">
        <button
          onClick={() => setActiveTab('journal')}
          className={`px-2 py-1 rounded ${activeTab === 'journal' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          {t.navJournal}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-2 py-1 rounded ${activeTab === 'analytics' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          {t.navAnalytics}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-2 py-1 rounded ${activeTab === 'calendar' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          {t.navCalendar}
        </button>
        <button
          onClick={() => setActiveTab('psychology')}
          className={`px-2 py-1 rounded ${activeTab === 'psychology' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          {t.navPsychology}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-2 py-1 rounded ${activeTab === 'rules' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          {t.navRules}
        </button>
      </div>
    </header>
  );
};
