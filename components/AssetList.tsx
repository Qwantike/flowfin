import React from 'react';
import { Asset, AssetCategory } from '../types';
import { Trash2, Building2, Wallet, TrendingUp, Coins, Calculator } from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  onRemove: (id: string) => void;
}

export const AssetList: React.FC<AssetListProps> = ({ assets, onRemove }) => {
  
  // Calculate remaining capital on a loan
  const calculateRemainingLoan = (asset: Asset): number => {
    if (!asset.realEstateDetails?.hasLoan) return 0;
    
    const { loanAmount, loanRate, loanDurationYears, loanStartDate } = asset.realEstateDetails;
    const monthlyRate = loanRate / 100 / 12;
    const totalMonths = loanDurationYears * 12;
    
    const start = new Date(loanStartDate);
    const now = new Date();
    // Months elapsed
    const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    
    if (monthsElapsed >= totalMonths) return 0;
    if (monthsElapsed <= 0) return loanAmount;

    // Remaining Balance Formula: B = P * ((1+r)^n - (1+r)^p) / ((1+r)^n - 1)
    // P = Principal, r = monthly rate, n = total payments, p = payments made
    
    if (monthlyRate === 0) {
        return loanAmount * (1 - monthsElapsed / totalMonths);
    }

    const numerator = Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, monthsElapsed);
    const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
    
    return loanAmount * (numerator / denominator);
  };

  const getIcon = (cat: AssetCategory) => {
    switch (cat) {
      case AssetCategory.LIQUIDITY: return <Wallet className="w-5 h-5 text-emerald-400" />;
      case AssetCategory.INVESTMENT: return <TrendingUp className="w-5 h-5 text-blue-400" />;
      case AssetCategory.REAL_ESTATE: return <Building2 className="w-5 h-5 text-amber-400" />;
      case AssetCategory.CRYPTO: return <Coins className="w-5 h-5 text-purple-400" />;
    }
  };

  // Sort by value desc
  const sortedAssets = [...assets].sort((a, b) => b.value - a.value);

  if (assets.length === 0) return (
    <div className="mt-6 bg-slate-800/30 backdrop-blur-md rounded-xl p-8 border border-slate-700/50 text-center">
        <p className="text-slate-500">Aucun actif renseigné.</p>
    </div>
  );

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-white px-1">Détail des Actifs</h3>
      <div className="grid gap-4">
        {sortedAssets.map(asset => {
            const remainingLoan = calculateRemainingLoan(asset);
            const netValue = asset.value - remainingLoan;
            
            return (
              <div key={asset.id} className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg mt-1">
                      {getIcon(asset.category)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200">{asset.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                           {asset.category === AssetCategory.REAL_ESTATE ? 'Immobilier' : asset.category}
                        </span>
                        {asset.yield > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {Number(asset.yield).toFixed(2)}%
                            </span>
                        )}
                        {asset.realEstateDetails?.monthlyRent ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                                Loyer: {asset.realEstateDetails.monthlyRent}€
                            </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                        {asset.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </div>
                    {remainingLoan > 0 && (
                        <div className="text-xs text-rose-400 mt-1 flex items-center justify-end gap-1" title="Reste à rembourser">
                            <Calculator className="w-3 h-3" />
                            -{remainingLoan.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </div>
                    )}
                  </div>
                </div>

                {remainingLoan > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                        <span className="text-xs text-slate-500">Patrimoine Net sur cet actif</span>
                        <span className="text-sm font-mono font-medium text-indigo-300">
                            {netValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </span>
                    </div>
                )}
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={() => onRemove(asset.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};