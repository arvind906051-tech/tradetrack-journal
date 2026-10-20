/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TradeProvider, useTradeContext } from './context/TradeContext';
import { Navbar } from './components/Navbar';
import { KPICards } from './components/KPICards';
import { TradeList } from './components/TradeList';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarHeatmap } from './components/CalendarHeatmap';
import { PsychologyAnalytics } from './components/PsychologyAnalytics';
import { TradingRulesView } from './components/TradingRulesView';
import { TradeModal } from './components/TradeModal';
import { TradeDetailModal } from './components/TradeDetailModal';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { AngelSyncModal } from './components/AngelSyncModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, confirmModal, closeConfirm, toast } = useTradeContext();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <Navbar />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Summary Cards */}
        <KPICards />

        {/* Tab Viewport */}
        {activeTab === 'journal' && <TradeList />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'calendar' && <CalendarHeatmap />}
        {activeTab === 'psychology' && <PsychologyAnalytics />}
        {activeTab === 'rules' && <TradingRulesView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TradeTrack · Professional Trading Journal & Analytics</span>
          <span className="text-slate-400">All data stored privately in browser storage</span>
        </div>
      </footer>

      {/* Modals */}
      <TradeModal />
      <TradeDetailModal />
      <RiskCalculatorModal />
      <AngelSyncModal />
      
      {/* In-app Confirmation Dialog (replaces blocked window.confirm) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onClose={closeConfirm}
      />

      {/* In-app Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium bg-slate-900/95 border-slate-800 text-white">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <TradeProvider>
      <MainLayout />
    </TradeProvider>
  );
}
