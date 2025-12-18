import React from 'react';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  viewMode: 'MONTH' | 'YEAR';
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ totalIncome, totalExpense, viewMode }) => {
  const balance = totalIncome - totalExpense;

  const format = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const periodLabel = viewMode === 'MONTH' ? 'mensuel' : 'annuel';
  const periodLabelPlural = viewMode === 'MONTH' ? 'mensuels' : 'annuels';
  const periodLabelCapitalized = viewMode === 'MONTH' ? 'Mensuel' : 'Annuel';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-slate-400 font-medium">Revenus Totaux</span>
        </div>
        <div className="text-2xl font-bold text-white">{format(totalIncome)}</div>
        <div className="text-xs text-emerald-500/70 mt-1">Flux entrants {periodLabelPlural}</div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <span className="text-slate-400 font-medium">Dépenses Totales</span>
        </div>
        <div className="text-2xl font-bold text-white">{format(totalExpense)}</div>
        <div className="text-xs text-rose-500/70 mt-1">Flux sortants {periodLabelPlural}</div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-all ${balance >= 0 ? 'bg-indigo-500/10 group-hover:bg-indigo-500/20' : 'bg-orange-500/10 group-hover:bg-orange-500/20'}`}></div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-400'}`}>
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-slate-400 font-medium">Solde {periodLabelCapitalized}</span>
        </div>
        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-indigo-200' : 'text-orange-200'}`}>
          {format(balance)}
        </div>
        <div className="text-xs text-slate-500 mt-1">Capacité d'épargne théorique ({viewMode === 'MONTH' ? 'mois' : 'année'})</div>
      </div>
    </div>
  );
};