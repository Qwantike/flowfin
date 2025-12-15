import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onRemove }) => {
  if (transactions.length === 0) return (
    <div className="mt-6 bg-slate-800/30 backdrop-blur-md rounded-xl p-8 border border-slate-700/50 text-center">
      <p className="text-slate-500">Aucune transaction pour ce mois.</p>
    </div>
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d);
  };

  // Sort by date desc
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mt-6 bg-slate-800/30 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Détail des flux du mois</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedTransactions.map(t => (
          <div key={t.id} className="group flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
              <div className="flex flex-col">
                <span className="text-slate-200 text-sm font-medium">{t.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{t.type === TransactionType.INCOME ? 'Revenu' : 'Dépense'}</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-400">{formatDate(t.date)}</span>
                  {t.label && (
                    <span className="text-xs text-slate-600">•</span>
                  )}
                  {t.label && (
                    <span className="text-xs text-indigo-300">{t.label}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-mono font-medium ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
              <button
                onClick={() => onRemove(t.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.8);
        }
      `}</style>
    </div>
  );
};