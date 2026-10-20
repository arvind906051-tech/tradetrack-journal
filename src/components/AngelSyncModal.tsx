import React, { useState, useEffect } from 'react';
import { useTradeContext } from '../context/TradeContext';
import { X, RefreshCw, KeyRound, Shield, CheckCircle2, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';

const ANGEL_STORAGE_KEY = 'tradetrack_angel_creds_v1';

export const AngelSyncModal: React.FC = () => {
  const { 
    isAngelModalOpen, 
    setIsAngelModalOpen, 
    syncAngelOneTrades, 
    isSyncingAngel, 
    hasAngelEnv,
    t 
  } = useTradeContext();

  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [mpin, setMpin] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [rememberCreds, setRememberCreds] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Load saved credentials from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ANGEL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clientId) setClientId(parsed.clientId);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.mpin) setMpin(parsed.mpin);
        if (parsed.totpSecret) setTotpSecret(parsed.totpSecret);
      }
    } catch {
      // ignore
    }
  }, [isAngelModalOpen]);

  if (!isAngelModalOpen) return null;

  const handleSaveToStorage = () => {
    if (rememberCreds) {
      try {
        localStorage.setItem(ANGEL_STORAGE_KEY, JSON.stringify({
          clientId,
          apiKey,
          mpin,
          totpSecret
        }));
      } catch {
        // ignore
      }
    } else {
      localStorage.removeItem(ANGEL_STORAGE_KEY);
    }
  };

  const handleLiveSync = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveToStorage();

    const res = await syncAngelOneTrades({
      clientId: clientId.trim().toUpperCase(),
      apiKey: apiKey.trim(),
      mpin: mpin.trim(),
      totpSecret: totpSecret.trim(),
      isDemoMode: false
    });

    if (res.success) {
      setIsAngelModalOpen(false);
    }
  };

  const handleSimulationSync = async () => {
    const res = await syncAngelOneTrades({
      isDemoMode: true
    });
    if (res.success) {
      setIsAngelModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.angelConfigTitle}</span>
                {hasAngelEnv && (
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-mono font-normal">
                    .env Configured
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.angelConfigSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAngelModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Environment Status Notice */}
          {hasAngelEnv ? (
            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-300 block">Server Credentials Detected</span>
                <span className="text-emerald-400/80 text-[11px] leading-relaxed">
                  Your server environment has ANGEL_API_KEY and ANGEL_CLIENT_ID configured. You can sync directly without typing credentials below.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Credentials are processed securely on the server via <span className="text-slate-200 font-mono">/api/angel/sync</span> to request SmartAPI tokens. They are never exposed in client bundles.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-cyan-400 hover:text-cyan-300 shrink-0 flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help</span>
              </button>
            </div>
          )}

          {/* Help Accordion */}
          {showHelp && (
            <div className="p-3.5 bg-slate-950 border border-cyan-800/40 rounded-xl space-y-2 text-slate-300">
              <h4 className="font-semibold text-cyan-300 text-xs">How to get Angel One SmartAPI credentials:</h4>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>Register on <a href="https://smartapi.angelone.in" target="_blank" rel="noreferrer" className="text-cyan-400 underline">smartapi.angelone.in</a>.</li>
                <li>Create an app to get your <strong className="text-slate-200">API Key</strong>.</li>
                <li>Your <strong className="text-slate-200">Client Code</strong> is your Angel One Login ID (e.g. A123456).</li>
                <li>Enable TOTP in Angel One mobile app / web profile to get your <strong className="text-slate-200">TOTP Secret Key</strong>.</li>
                <li>Your <strong className="text-slate-200">MPIN</strong> is your 4 or 6-digit login PIN.</li>
              </ol>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleLiveSync} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Client ID (Client Code) *
                </label>
                <input
                  type="text"
                  required={!hasAngelEnv}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value.toUpperCase())}
                  placeholder={hasAngelEnv ? "Configured via .env" : "e.g. A123456"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  MPIN *
                </label>
                <input
                  type="password"
                  required={!hasAngelEnv}
                  maxLength={6}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                SmartAPI Key *
              </label>
              <input
                type="text"
                required={!hasAngelEnv}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasAngelEnv ? "Configured via .env" : "API Key from SmartAPI portal"}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                TOTP Secret Key *
              </label>
              <input
                type="password"
                required={!hasAngelEnv}
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                placeholder={hasAngelEnv ? "Configured via .env" : "Base32 TOTP secret string"}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                The backend automatically computes the 6-digit TOTP code at runtime using RFC 6238 HMAC-SHA1.
              </span>
            </div>

            {/* Remember credentials checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberCreds}
                  onChange={(e) => setRememberCreds(e.target.checked)}
                  className="rounded border-slate-700 text-orange-500 focus:ring-0"
                />
                <span className="text-xs">Remember credentials in local browser session</span>
              </label>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSyncingAngel}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isSyncingAngel ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.syncingAngel}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Sync Live Trades from Angel One</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test Simulation Section */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Testing without Live Market?</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Verify SmartAPI orderbook mapping with simulated intraday tradebook data.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSimulationSync}
                disabled={isSyncingAngel}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>Test Demo Sync</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>SmartAPI v1 REST Engine</span>
          <button
            onClick={() => setIsAngelModalOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
