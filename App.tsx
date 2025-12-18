import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Asset } from './types';
import FinancialFlowChart from './components/FinancialFlowChart';
import { TransactionForm } from './components/TransactionForm';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { MonthSelector } from './components/MonthSelector';
import { WealthDashboard } from './components/WealthDashboard';
import { AuthForm } from './components/AuthForm';
import Home from './components/Home';
import { api } from './services/api';
import { Activity, LayoutDashboard, CalendarRange, Wallet, LineChart, LogOut, Loader2, Settings } from 'lucide-react';
import ProfileForm from './components/ProfileForm';
import CurrentAccountCard from './components/CurrentAccountCard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Control display of Auth modal when unauthenticated
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);





  // close auth modal on Escape
  useEffect(() => {
    if (!showAuth) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAuth(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAuth]);

  // close profile modal on Escape
  useEffect(() => {
    if (!showProfile) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowProfile(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProfile]);

  // APP STATE
  const [currentTab, setCurrentTab] = useState<'FLOWS' | 'WEALTH'>('FLOWS');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]); // We need to lift Asset state to App too for full API integration
  const [currentAccount, setCurrentAccount] = useState<{ balance: number } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Check auth on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoadingAuth(false);
  }, []);

  // Fetch Data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Refresh data when switching to WEALTH tab to ensure Current Account is up to date
  useEffect(() => {
    if (isAuthenticated && currentTab === 'WEALTH') {
      loadData();
    }
  }, [currentTab, isAuthenticated]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [txData, assetData, accountData] = await Promise.all([
        api.transactions.getAll(),
        api.assets.getAll(),
        api.currentAccount.get()
      ]);
      setTransactions(txData);
      setAssets(assetData);
      setCurrentAccount(accountData);
    } catch (e: any) {
      console.error("Erreur chargement données", e);
      if (e.message && e.message.includes('401')) logout();
    } finally {
      setIsLoadingData(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setTransactions([]);
    setAssets([]);
    setCurrentAccount(null);
  };

  // --- ACTIONS ---

  const addTransactions = async (newTxs: Omit<Transaction, 'id'>[]) => {
    try {
      const added = await api.transactions.add(newTxs);
      // Backend returns array of created transactions
      setTransactions(prev => [...prev, ...added]);
    } catch (e) {
      console.error("Erreur ajout", e);
    }
  };

  const removeTransaction = async (id: string) => {
    try {
      await api.transactions.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Erreur suppression", e);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const sameYear = tDate.getFullYear() === currentDate.getFullYear();

      if (viewMode === 'YEAR') {
        return sameYear;
      } else {
        return sameYear && tDate.getMonth() === currentDate.getMonth();
      }
    });
  }, [transactions, currentDate, viewMode]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      // Ensure amounts are numbers (API might return strings)
      const amt = Number(t.amount);
      if (t.type === TransactionType.INCOME) acc.income += amt;
      else acc.expense += amt;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);


  if (loadingAuth) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  if (!isAuthenticated) return (
    <>
      <Home onOpenAuth={(mode) => { setAuthMode(mode); setShowAuth(true); }} />
      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowAuth(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <AuthForm
              initialMode={authMode}
              asModal
              onSuccess={() => { setIsAuthenticated(true); setShowAuth(false); }}
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Flow<span className="text-indigo-400">Fin</span></h1>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Main Nav Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setCurrentTab('FLOWS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentTab === 'FLOWS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <LineChart className="w-4 h-4" />
                Budget
              </button>
              <button
                onClick={() => setCurrentTab('WEALTH')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentTab === 'WEALTH' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Wallet className="w-4 h-4" />
                Patrimoine
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSettings(s => !s)}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                title="Paramètres"
              >
                <Settings className="w-5 h-5" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => { setShowProfile(true); setShowSettings(false); }}
                  >
                    Profil
                  </button>
                </div>
              )}
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Nav */}
          <div className={`flex bg-slate-800/80 rounded-lg p-1 border border-slate-700 transition-opacity duration-300 ${currentTab === 'FLOWS' ? 'opacity-100' : 'opacity-0 pointer-events-none hidden sm:flex'}`}>
            <button
              onClick={() => setViewMode('MONTH')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'MONTH' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:white'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Mois
            </button>
            <button
              onClick={() => setViewMode('YEAR')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'YEAR' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <CalendarRange className="w-4 h-4" />
              Année
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">

        {isLoadingData ? (
          <div className="h-[500px] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {currentTab === 'FLOWS' ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Date Navigation */}
                <MonthSelector currentDate={currentDate} onChange={setCurrentDate} viewMode={viewMode} />

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

                  {/* Left Column: charts & summary */}
                  <div className="lg:col-span-8">
                    <SummaryCards totalIncome={totals.income} totalExpense={totals.expense} viewMode={viewMode} />
                    <div className="mt-4">
                      <CurrentAccountCard />
                    </div>
                    <div className="mt-6 h-[650px]">
                      <FinancialFlowChart transactions={filteredTransactions} />
                    </div>
                  </div>

                  {/* Right Column: Controls & List */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <TransactionForm onAdd={addTransactions} currentDate={currentDate} />
                    <TransactionList transactions={filteredTransactions} onRemove={removeTransaction} />
                  </div>

                </div>
              </div>
            ) : (
              <WealthDashboard
                externalAssets={assets}
                onAssetsChange={setAssets}
                currentAccountBalance={currentAccount?.balance || 0}
              />
            )}
          </>
        )}
      </main>

      {/* Profile modal */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowProfile(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <ProfileForm onClose={() => setShowProfile(false)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} FlowFin. Mode Connecté.
        </div>
      </footer>

    </div>
  );
}

export default App;