import React, { useState } from 'react';
import { Asset, AssetCategory } from '../types';
import { Button } from './ui/Button';
import { PlusCircle, Building2, TrendingUp, Wallet, Coins } from 'lucide-react';

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<AssetCategory>(AssetCategory.LIQUIDITY);
  const [yieldRate, setYieldRate] = useState('');

  // Real Estate Specifics
  const [monthlyRent, setMonthlyRent] = useState('');
  const [hasLoan, setHasLoan] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanDuration, setLoanDuration] = useState('');
  const [loanStartDate, setLoanStartDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;

    const val = parseFloat(value);
    let calculatedYield = 0;

    // Calculate yield automatically for Real Estate based on Rent and Value
    if (category === AssetCategory.REAL_ESTATE) {
      const rent = monthlyRent ? parseFloat(monthlyRent) : 0;
      if (val > 0) {
        calculatedYield = (rent * 12 / val) * 100;
      }
    } else {
      calculatedYield = yieldRate ? parseFloat(yieldRate) : 0;
    }

    const newAsset: Omit<Asset, 'id'> = {
      name,
      category,
      value: val,
      yield: calculatedYield,
      realEstateDetails: category === AssetCategory.REAL_ESTATE ? {
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : 0,
        hasLoan,
        loanAmount: hasLoan ? parseFloat(loanAmount) : 0,
        loanRate: hasLoan ? parseFloat(loanRate) : 0,
        loanDurationYears: hasLoan ? parseFloat(loanDuration) : 0,
        loanStartDate: hasLoan ? loanStartDate : new Date().toISOString().split('T')[0]
      } : undefined
    };

    onAdd(newAsset);

    // Reset basic fields
    setName('');
    setValue('');
    setYieldRate('');
    // Keep category for UX
  };

  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
      case AssetCategory.LIQUIDITY: return <Wallet className="w-4 h-4" />;
      case AssetCategory.INVESTMENT: return <TrendingUp className="w-4 h-4" />;
      case AssetCategory.REAL_ESTATE: return <Building2 className="w-4 h-4" />;
      case AssetCategory.CRYPTO: return <Coins className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (cat: AssetCategory) => {
    switch (cat) {
      case AssetCategory.REAL_ESTATE: return 'Immobilier';
      case AssetCategory.LIQUIDITY: return 'Liquidité';
      case AssetCategory.INVESTMENT: return 'Investissement';
      case AssetCategory.CRYPTO: return 'Crypto';
      default: return cat;
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700 shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-400" />
        Ajouter un Actif
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Category Selector */}
        <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
          {Object.values(AssetCategory).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex-1 min-w-[80px] py-2 px-2 rounded-md text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${category === cat
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {getCategoryIcon(cat)}
              <span>{getCategoryLabel(cat)}</span>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Nom de l'actif</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={category === AssetCategory.REAL_ESTATE ? "Ex: Appt Paris" : "Ex: Livret A, PEA..."}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Valeur Actuelle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Show Yield Input only for non-Real Estate assets */}
          {category !== AssetCategory.REAL_ESTATE && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Rendement annuel
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                <input
                  type="number"
                  value={yieldRate}
                  onChange={(e) => setYieldRate(e.target.value)}
                  placeholder="Ex: 3.5"
                  step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Real Estate Specifics */}
        {category === AssetCategory.REAL_ESTATE && (
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Détails Immobilier</h4>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Loyer Mensuel (Revenu)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Le rendement sera calculé automatiquement basé sur ce loyer et la valeur actuelle.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasLoan"
                checked={hasLoan}
                onChange={e => setHasLoan(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="hasLoan" className="text-sm text-slate-300">Crédit associé</label>
            </div>

            {hasLoan && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Montant Emprunté</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Taux Crédit (%)</label>
                    <input
                      type="number"
                      value={loanRate}
                      onChange={(e) => setLoanRate(e.target.value)}
                      step="0.01"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Durée (Années)</label>
                    <input
                      type="number"
                      value={loanDuration}
                      onChange={(e) => setLoanDuration(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date Début</label>
                    <input
                      type="date"
                      value={loanStartDate}
                      onChange={(e) => setLoanStartDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full">
          Ajouter au patrimoine
        </Button>
      </form>
    </div>
  );
};