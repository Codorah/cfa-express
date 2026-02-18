
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { CURRENCIES } from './constants';
import { Currency, HistoryItem, RatesData } from './types';
import { fetchLatestRates, getCachedRates } from './services/exchangeService';
import { getSmartInsight } from './services/geminiService';

type Tab = 'converter' | 'stats' | 'settings';
type Language = 'fr' | 'en';

const translations = {
  fr: {
    welcome: "Bienvenue,",
    converter: "Convertir",
    stats: "Marché",
    profile: "Réglages",
    since: "Montant à convertir",
    to: "Résultat estimé",
    saveHistory: "Enregistrer l'opération",
    insightTitle: "IA Insight • Codorah",
    viewAnalysis: "Analyse du marché par IA",
    historyTitle: "Historique récent",
    clear: "Vider",
    confirmClearHistory: "Effacer l'historique ?",
    noHistory: "Aucune conversion enregistrée",
    rankingTitle: "Valeur en CFA",
    rankingSub: "Pour 1 unité de la devise",
    trendTitle: "Tendance 7j",
    profileTitle: "Profil Utilisateur",
    edit: "Éditer",
    save: "Valider",
    userPremium: "Mode Offline Prêt",
    preferences: "Préférences",
    darkMode: "Mode Sombre",
    language: "Langue",
    baseCurrency: "Devise par défaut",
    dataManagement: "Données",
    exportCsv: "Exporter (CSV)",
    deleteAll: "Réinitialiser l'app",
    confirmDelete: "⚠️ Attention : Suppression totale des données locales. Confirmer ?",
    support: "Support",
    privacy: "Confidentialité",
    developer: "Développeur",
    version: "Version 4.6.0 (Final Deployment)",
    standardMsg: "Opération sauvegardée localement.",
    close: "Compris",
    lastUpdate: "Dernière MAJ",
    refresh: "Actualiser",
    offline: "Mode Hors Ligne",
    online: "En Ligne",
    updateSuccess: "Taux synchronisés",
    updateError: "Connexion requise",
    offlineInsight: "Connectez-vous pour l'IA.",
    chartInfo: "Appuyez sur une devise pour voir sa tendance.",
    copied: "Copié dans le presse-papier !",
    live: "LIVE",
    changeName: "Modifier votre nom",
    convertedAmount: "Montant converti",
    rateUsed: "Taux utilisé",
    updatedAt: "Date de mise à jour"
  },
  en: {
    welcome: "Welcome,",
    converter: "Convert",
    stats: "Market",
    profile: "Settings",
    since: "Amount to convert",
    to: "Estimated result",
    saveHistory: "Save Transaction",
    insightTitle: "AI Insight • Codorah",
    viewAnalysis: "AI Market Analysis",
    historyTitle: "Recent History",
    clear: "Clear",
    confirmClearHistory: "Clear history?",
    noHistory: "No history yet",
    rankingTitle: "CFA Value",
    rankingSub: "Per 1 unit of currency",
    trendTitle: "7d Trend",
    profileTitle: "User Profile",
    edit: "Edit",
    save: "Save",
    userPremium: "Offline Mode Ready",
    preferences: "Preferences",
    darkMode: "Dark Mode",
    language: "Language",
    baseCurrency: "Default Currency",
    dataManagement: "Data",
    exportCsv: "Export (CSV)",
    deleteAll: "Reset App",
    confirmDelete: "⚠️ Warning: This will wipe all local data. Confirm?",
    support: "Support",
    privacy: "Privacy",
    developer: "Developer",
    version: "Version 4.6.0 (Final Deployment)",
    standardMsg: "Operation saved locally.",
    close: "Got it",
    lastUpdate: "Last Update",
    refresh: "Refresh",
    offline: "Offline",
    online: "Online",
    updateSuccess: "Rates synced",
    updateError: "Connection needed",
    offlineInsight: "Go online for AI.",
    chartInfo: "Tap a currency to view its trend.",
    copied: "Copied to clipboard!",
    live: "LIVE",
    changeName: "Change your name",
    convertedAmount: "Converted amount",
    rateUsed: "Rate used",
    updatedAt: "Last update date"
  }
};

const parseAmountInput = (raw: string): number | null => {
  if (!raw) return null;

  let normalized = raw
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '');

  if (!normalized) {
    return null;
  }

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  const hasComma = lastComma !== -1;
  const hasDot = lastDot !== -1;

  if (hasComma || hasDot) {
    const decimalIndex = Math.max(lastComma, lastDot);
    const integerPart = normalized.slice(0, decimalIndex).replace(/[.,]/g, '');
    const decimalPart = normalized.slice(decimalIndex + 1).replace(/[.,]/g, '');
    normalized = `${integerPart}.${decimalPart}`;
  } else {
    normalized = normalized.replace(/[.,]/g, '');
  }

  if (!normalized || normalized === '.' || normalized === '-' || normalized === '-.') {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
};

const formatAmount = (value: number, locale: string, minimumFractionDigits = 2, maximumFractionDigits = 2): string =>
  new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(value);

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="relative w-10 h-10">
       <svg viewBox="0 0 100 100" className="w-full h-full text-white drop-shadow-md">
          <path d="M10 50 Q 30 20, 60 40 T 90 35" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
          <path d="M10 65 Q 40 45, 70 75 T 95 35" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M85 25 L 95 35 L 85 45" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
       </svg>
    </div>
    <span className="text-xl font-extrabold tracking-tighter text-white">CFA <span className="opacity-80">Express</span></span>
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; content: string; isDarkMode: boolean; closeLabel: string }> = ({ isOpen, onClose, title, content, isDarkMode, closeLabel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div className={`w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`} onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-black mb-4 tracking-tight">{title}</h3>
        <p className="text-sm font-bold opacity-70 leading-relaxed whitespace-pre-wrap mb-8">{content}</p>
        <button onClick={onClose} className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-teal-500/20">{closeLabel}</button>
      </div>
    </div>
  );
};

const CurrencyCard: React.FC<{
  label: string;
  amount: string;
  currency: Currency;
  onAmountChange?: (val: string) => void;
  onCurrencyClick: () => void;
  isReadOnly?: boolean;
  isDarkMode: boolean;
  onCopy?: () => void;
}> = ({ label, amount, currency, onAmountChange, onCurrencyClick, isReadOnly, isDarkMode, onCopy }) => (
  <div className={`relative transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'} p-6 rounded-[2rem] border shadow-sm`}>
    <div className="flex justify-between items-center mb-4">
      <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{label}</span>
      <button onClick={onCurrencyClick} className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all active:scale-95 ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
        <span className="text-xl leading-none">{currency.flag}</span>
        <span className="font-bold text-sm tracking-tight">{currency.code}</span>
        <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
      </button>
    </div>
    <div className="flex items-center gap-2 overflow-hidden">
      <input
        type="text"
        value={amount}
        onChange={(e) => onAmountChange?.(e.target.value)}
        readOnly={isReadOnly}
        placeholder="0.00"
        className={`w-full text-4xl font-extrabold bg-transparent outline-none transition-all truncate ${isReadOnly ? 'text-teal-500' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}
        inputMode="decimal"
      />
      {isReadOnly && amount && (
        <button onClick={onCopy} className="p-3 bg-teal-500/10 text-teal-600 rounded-xl active:scale-90 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
        </button>
      )}
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('converter');
  const [fromAmount, setFromAmount] = useState<string>('1000');
  const [toAmount, setToAmount] = useState<string>('');
  
  const [userName, setUserName] = useState<string>(localStorage.getItem('cfa_user_name') || 'Utilisateur');
  const [tempUserName, setTempUserName] = useState<string>(userName);
  const [isEditingName, setIsEditingName] = useState(false);

  const [lang, setLang] = useState<Language>((localStorage.getItem('cfa_lang') as Language) || 'fr');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('cfa_dark_mode') === 'true');
  const [baseCurrencyCode, setBaseCurrencyCode] = useState<string>(localStorage.getItem('cfa_base_curr') || 'XOF');

  const [fromCurrency, setFromCurrency] = useState<Currency>(CURRENCIES.find(c => c.code === baseCurrencyCode) || CURRENCIES[0]);
  const [toCurrency, setToCurrency] = useState<Currency>(CURRENCIES.find(c => c.code === 'EUR') || CURRENCIES[2]);
  
  const [ratesData, setRatesData] = useState<RatesData>(getCachedRates());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSelectingFrom, setIsSelectingFrom] = useState(false);
  const [isSelectingTo, setIsSelectingTo] = useState(false);
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [selectedChartCurrency, setSelectedChartCurrency] = useState<string>(localStorage.getItem('cfa_chart_curr') || 'EUR');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [modal, setModal] = useState<{ title: string; content: string } | null>(null);

  const t = translations[lang];
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const refreshRates = useCallback(async (silent = false) => {
    if (!navigator.onLine) {
      if (!silent) setModal({ title: t.offline, content: t.updateError });
      return;
    }
    setIsRefreshingRates(true);
    try {
      const data = await fetchLatestRates();
      setRatesData(data);
    } catch (e) {
      if (!silent) setModal({ title: t.offline, content: t.updateError });
    } finally {
      setIsRefreshingRates(false);
    }
  }, [t.offline, t.updateError]);

  // AUTO-REFRESH Effect
  useEffect(() => {
    const handleStatusChange = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) refreshRates(true);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    const interval = setInterval(() => {
      if (navigator.onLine) refreshRates(true);
    }, 300000);

    if (navigator.onLine) refreshRates(true);
    const saved = localStorage.getItem('cfa_express_history');
    if (saved) setHistory(JSON.parse(saved));

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      clearInterval(interval);
    };
  }, [refreshRates]);

  const handleFromAmountChange = (value: string) => {
    const sanitizedValue = value.replace(/[^\d.,\s]/g, '');
    setFromAmount(sanitizedValue);
    setToAmount(computeConvertedDisplay(sanitizedValue));
  };

  const computeConvertedDisplay = useCallback((rawAmount: string) => {
    const parsedAmount = parseAmountInput(rawAmount);
    if (parsedAmount === null) {
      return '';
    }

    const rateFrom = ratesData.rates[fromCurrency.code] || 1;
    const rateTo = ratesData.rates[toCurrency.code] || 1;
    const result = (parsedAmount / rateFrom) * rateTo;
    const minDigits = result < 0.01 ? 4 : 2;
    const maxDigits = result < 0.01 ? 6 : 2;

    return formatAmount(result, locale, minDigits, maxDigits);
  }, [fromCurrency.code, locale, ratesData.rates, toCurrency.code]);

  useEffect(() => {
    setToAmount(computeConvertedDisplay(fromAmount));
  }, [computeConvertedDisplay, fromAmount]);

  const copyToClipboard = () => {
    const parsedToAmount = parseAmountInput(toAmount);
    if (parsedToAmount === null) return;
    navigator.clipboard.writeText(parsedToAmount.toString());
    setModal({ title: t.live, content: t.copied });
  };

  const saveToHistory = () => {
    const parsedFromAmount = parseAmountInput(fromAmount);
    const parsedToAmount = parseAmountInput(toAmount);
    if (parsedFromAmount === null || parsedToAmount === null || parsedFromAmount === 0) return;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      fromAmount: parsedFromAmount,
      fromCurrency: fromCurrency.code,
      toAmount: parsedToAmount,
      toCurrency: toCurrency.code,
      rate: parsedToAmount / parsedFromAmount,
      timestamp: Date.now()
    };
    const newHist = [newItem, ...history].slice(0, 15);
    setHistory(newHist);
    localStorage.setItem('cfa_express_history', JSON.stringify(newHist));
    setModal({ title: lang === 'fr' ? 'Succès' : 'Success', content: t.standardMsg });
  };

  const conversionRate = useMemo(() => {
    const rateFrom = ratesData.rates[fromCurrency.code];
    const rateTo = ratesData.rates[toCurrency.code];
    if (!rateFrom || !rateTo) return null;
    return rateTo / rateFrom;
  }, [fromCurrency.code, ratesData.rates, toCurrency.code]);

  const lastUpdatedLabel = useMemo(() => {
    if (!ratesData.lastUpdate) return '--';
    return new Date(ratesData.lastUpdate).toLocaleString(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }, [locale, ratesData.lastUpdate]);

  const rankedCurrencies = useMemo(() => {
    return [...CURRENCIES]
      .filter(c => c.code !== 'XOF' && c.code !== 'XAF')
      .map(c => ({
        ...c,
        rateInCFA: 1 / (ratesData.rates[c.code] || 1),
        trend: (Math.sin(c.code.charCodeAt(0)) * 1.5).toFixed(1)
      }))
      .sort((a, b) => b.rateInCFA - a.rateInCFA);
  }, [ratesData]);

  const chartData = useMemo(() => {
    const currentRate = 1 / (ratesData.rates[selectedChartCurrency] || 1);
    const days = lang === 'fr' ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return days.map((day, i) => {
      const variance = (Math.sin(i + selectedChartCurrency.charCodeAt(0)) * 0.02) + 1;
      return { day, value: parseFloat((currentRate * variance).toFixed(2)) };
    });
  }, [ratesData, selectedChartCurrency, lang]);

  const handleNameSave = () => {
    const final = tempUserName.trim() || 'Utilisateur';
    setUserName(final);
    localStorage.setItem('cfa_user_name', final);
    setIsEditingName(false);
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col transition-all duration-700 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.title || ''} content={modal?.content || ''} isDarkMode={isDarkMode} closeLabel={t.close} />

      <header className={`pt-12 pb-10 px-6 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-teal-900/90' : 'bg-teal-600'}`}>
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/20 flex items-center gap-2 ${isOnline ? 'bg-white/10' : 'bg-red-500/40'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-teal-300 animate-pulse' : 'bg-red-200'}`}></span>
            {isOnline ? t.live : t.offline}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 border border-white/30 rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner backdrop-blur-md">
            {(userName || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60 mb-1">{t.welcome}</p>
            <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-[220px]">{userName}</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 -mt-10 pb-36 space-y-8 z-10 relative">
        {activeTab === 'converter' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="relative space-y-4">
              <CurrencyCard label={t.since} amount={fromAmount} currency={fromCurrency} onAmountChange={handleFromAmountChange} onCurrencyClick={() => setIsSelectingFrom(true)} isDarkMode={isDarkMode} />
              <button 
                onClick={() => { const tmp = fromCurrency; setFromCurrency(toCurrency); setToCurrency(tmp); }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-teal-500 text-white p-4 rounded-3xl shadow-2xl hover:scale-110 active:rotate-180 transition-all border-[6px] border-slate-50 dark:border-slate-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
              </button>
              <CurrencyCard label={t.to} amount={toAmount} currency={toCurrency} onCurrencyClick={() => setIsSelectingTo(true)} isReadOnly isDarkMode={isDarkMode} onCopy={copyToClipboard} />
            </div>

            <button onClick={saveToHistory} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-[2.25rem] font-black text-lg shadow-2xl shadow-teal-500/30 transition-all active:scale-95">
              {t.saveHistory}
            </button>

            <div className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.convertedAmount}</span>
                  <span className="text-right font-black text-base">
                    {toAmount ? `${toAmount} ${toCurrency.code}` : '--'}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.rateUsed}</span>
                  <span className="text-right font-black text-sm">
                    {conversionRate === null
                      ? '--'
                      : `1 ${fromCurrency.code} = ${formatAmount(conversionRate, locale, 2, 6)} ${toCurrency.code}`}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.updatedAt}</span>
                  <span className="text-right font-black text-sm">{lastUpdatedLabel}</span>
                </div>
              </div>
              <button
                onClick={() => refreshRates(false)}
                disabled={isRefreshingRates}
                className={`mt-5 w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  isRefreshingRates ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                {isRefreshingRates ? '...' : t.refresh}
              </button>
            </div>

            <div className={`group relative p-7 rounded-[2.5rem] border transition-all ${isDarkMode ? 'bg-teal-900/10 border-teal-500/20' : 'bg-teal-50 border-teal-200'}`}>
              {!isOnline && <div className="absolute inset-0 bg-slate-500/10 backdrop-blur-[1px] z-10 flex items-center justify-center font-black text-[10px] uppercase tracking-widest text-slate-500">{t.offlineInsight}</div>}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-lg shadow-lg shadow-teal-500/20">✨</div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">{t.insightTitle}</span>
              </div>
              <p className="text-[13px] font-bold leading-relaxed opacity-90 italic">
                {insight || (lang === 'fr' ? "Analyse financière IA disponible." : "AI financial analysis available.")}
              </p>
              <button 
                disabled={!isOnline || isLoadingInsight}
                onClick={async () => {
                  setIsLoadingInsight(true);
                  const parsedFromAmount = parseAmountInput(fromAmount) ?? 0;
                  const res = await getSmartInsight(fromCurrency.code, toCurrency.code, parsedFromAmount);
                  setInsight(res);
                  setIsLoadingInsight(false);
                }}
                className={`mt-5 text-[11px] font-black uppercase tracking-widest hover:underline ${isOnline ? 'text-teal-600' : 'text-slate-400'}`}
              >
                {isLoadingInsight ? "..." : t.viewAnalysis}
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-black tracking-tight mb-5 px-3">{t.historyTitle}</h3>
              <div className="space-y-4">
                {history.length > 0 ? history.map(h => (
                  <div key={h.id} className={`p-5 rounded-[2rem] border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-black text-base">{h.fromAmount.toLocaleString()} {h.fromCurrency}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(h.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-teal-500 text-lg">→ {h.toAmount.toLocaleString()} {h.toCurrency}</div>
                      </div>
                    </div>
                  </div>
                )) : <div className="text-center py-16 text-slate-400 font-bold">{t.noHistory}</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className={`p-7 rounded-[3rem] border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-xl shadow-teal-500/5'}`}>
              <h2 className="text-2xl font-black tracking-tight mb-2">{t.rankingTitle}</h2>
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8">{t.rankingSub}</p>
              <div className="grid grid-cols-1 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {rankedCurrencies.map((c) => (
                  <button 
                    key={c.code} 
                    onClick={() => { setSelectedChartCurrency(c.code); localStorage.setItem('cfa_chart_curr', c.code); }} 
                    className={`flex items-center justify-between p-4 rounded-[1.75rem] transition-all transform active:scale-95 ${selectedChartCurrency === c.code ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/40' : (isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50/50')}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{c.flag}</span>
                      <div className="text-left">
                        <div className="font-black text-lg leading-tight">{c.code}</div>
                        <div className={`text-[10px] font-bold uppercase ${selectedChartCurrency === c.code ? 'text-white/70' : 'text-slate-400'}`}>{c.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-base">{c.rateInCFA.toLocaleString(undefined, { maximumFractionDigits: 2 })} CFA</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-7 rounded-[3rem] border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-black tracking-tight mb-1">{t.trendTitle}</h2>
                  <p className="text-[11px] text-teal-500 font-black uppercase tracking-widest">{selectedChartCurrency} / XOF</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} dy={12} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', fontWeight: 800 }} />
                    <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={5} fill="url(#trendGradient)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-500 pb-10">
            {/* Profil Utilisateur Sub-menu */}
            <section className={`p-7 rounded-[3rem] border transition-all ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-xl shadow-teal-500/5'}`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-600">{t.profileTitle}</h3>
                <button 
                  onClick={() => isEditingName ? handleNameSave() : setIsEditingName(true)} 
                  className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${isEditingName ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-teal-600 bg-slate-100 dark:bg-slate-700'}`}
                >
                  {isEditingName ? t.save : t.edit}
                </button>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
                
                <div className="w-full text-center">
                  {isEditingName ? (
                    <div className="animate-in zoom-in-95 duration-200">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{t.changeName}</label>
                      <input 
                        type="text" 
                        value={tempUserName}
                        onChange={(e) => setTempUserName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        className={`w-full text-2xl font-black bg-transparent border-b-4 border-teal-500 outline-none text-center pb-2 focus:border-teal-400 transition-all ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-300">
                      <h4 className="text-3xl font-black tracking-tight">{userName}</h4>
                      <p className="text-[11px] font-bold text-teal-500 uppercase tracking-widest mt-2 bg-teal-500/10 px-3 py-1 rounded-full inline-block">{t.userPremium}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Global Preferences Card */}
            <section className={`p-7 rounded-[3rem] border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-lg shadow-teal-500/5'}`}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-600 mb-8">{t.preferences}</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black tracking-tight">{t.darkMode}</span>
                  <button onClick={() => { setIsDarkMode(!isDarkMode); localStorage.setItem('cfa_dark_mode', (!isDarkMode).toString()); }} className={`w-16 h-9 rounded-full relative transition-all duration-300 ${isDarkMode ? 'bg-teal-500 shadow-lg shadow-teal-500/30' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${isDarkMode ? 'right-1.5' : 'left-1.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black tracking-tight">{t.language}</span>
                  <select value={lang} onChange={e => { setLang(e.target.value as Language); localStorage.setItem('cfa_lang', e.target.value); }} className="bg-transparent font-black text-teal-600 outline-none text-sm uppercase">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black tracking-tight">{t.baseCurrency}</span>
                  <select value={baseCurrencyCode} onChange={e => { setBaseCurrencyCode(e.target.value); localStorage.setItem('cfa_base_curr', e.target.value); const c = CURRENCIES.find(curr => curr.code === e.target.value); if(c) setFromCurrency(c); }} className="bg-transparent font-black text-teal-600 outline-none text-sm uppercase max-w-[120px] text-right">
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.flag}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Data Management Card */}
            <section className={`p-7 rounded-[3rem] border ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-lg shadow-teal-500/5'}`}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-600 mb-8">{t.dataManagement}</h3>
              <button onClick={() => confirm(t.confirmDelete) && (localStorage.clear(), window.location.reload())} className="w-full flex items-center justify-between p-5 rounded-[1.75rem] bg-red-500/5 hover:bg-red-500/10 transition-all font-black text-sm text-red-500">
                <span>{t.deleteAll}</span>
                <span className="text-xl">🗑️</span>
              </button>
            </section>

            <footer className="text-center py-10 opacity-60">
              <div className="flex justify-center gap-6 mb-8">
                <button onClick={() => setModal({ title: t.support, content: "Support : codorah@hotmail.com" })} className="text-[10px] font-black uppercase tracking-widest text-teal-600">{t.support}</button>
                <button onClick={() => setModal({ title: t.privacy, content: "Vos données sont locales." })} className="text-[10px] font-black uppercase tracking-widest text-teal-600">{t.privacy}</button>
              </div>
              <p className="text-[10px] font-black tracking-[0.4em] uppercase text-teal-600/80 mb-2">{t.version}</p>
              <p className="text-[9px] font-bold opacity-40">© 2026 Elodie Atana • CODORAH Fintech.</p>
            </footer>
          </div>
        )}
      </main>

      {/* Select Modal */}
      {(isSelectingFrom || isSelectingTo) && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => { setIsSelectingFrom(false); setIsSelectingTo(false); }}>
          <div className={`w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-slide-up ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black tracking-tight">{lang === 'fr' ? 'Devises' : 'Currencies'}</h3>
              <button onClick={() => { setIsSelectingFrom(false); setIsSelectingTo(false); }} className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full active:scale-90 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => { if(isSelectingFrom) setFromCurrency(c); else setToCurrency(c); setIsSelectingFrom(false); setIsSelectingTo(false); }} className={`flex items-center justify-between p-5 rounded-[2rem] transition-all border-2 active:scale-95 ${(isSelectingFrom ? fromCurrency.code : toCurrency.code) === c.code ? 'border-teal-500 bg-teal-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-700/50'}`}>
                  <div className="flex items-center gap-5">
                    <span className="text-4xl">{c.flag}</span>
                    <div className="text-left">
                      <div className="font-black text-xl leading-none">{c.code}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase truncate w-32">{c.name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t px-8 py-6 flex justify-between items-center z-50 glass rounded-t-[3.5rem] shadow-2xl safe-pb border-slate-200/40 dark:border-slate-700/40">
        <button onClick={() => setActiveTab('converter')} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'converter' ? 'text-teal-500' : 'text-slate-400 opacity-60'}`}>
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.89 11.1c-1.78-.59-2.64-.96-2.64-1.9 0-1.02 1.11-1.39 1.81-1.39 1.31 0 1.79.99 1.9 1.34l1.58-.67c-.2-.76-.86-1.96-2.3-2.36V4h-2v2.09c-1.34.28-2.58 1.18-2.58 2.57 0 2.1 1.75 3.02 3.51 3.59 2.03.66 2.4 1.29 2.4 2.09 0 1.03-1.13 1.56-2.12 1.56-1.72 0-2.25-1.3-2.33-1.67l-1.59.67c.33 1.16 1.08 2.54 2.92 2.98V20h2v-2.09c1.52-.29 2.72-1.16 2.72-2.67 0-2.2-1.77-3.14-3.51-3.71z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t.converter}</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'stats' ? 'text-teal-500' : 'text-slate-400 opacity-60'}`}>
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t.stats}</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'settings' ? 'text-teal-500' : 'text-slate-400 opacity-60'}`}>
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t.profile}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
