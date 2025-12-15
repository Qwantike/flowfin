import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, RecurrenceFrequency } from '../types';
import { Button } from './ui/Button';
import { PlusCircle, Wallet, TrendingDown, CalendarDays, RefreshCw } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transactions: Omit<Transaction, 'id'>[]) => void;
  currentDate: Date;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, currentDate }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [date, setDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>(RecurrenceFrequency.NONE);
  const [label, setLabel] = useState<string>('Perso');

  const LABEL_OPTIONS = [
    'Perso', 'Salaire', 'Crédits', 'Mobile & Internet', 'Divertissement', 'Banque', 'Assurances', 'Eau', 'Électricité', 'Voiture', 'Impôts', 'Alimentation', 'Loyer', 'Shopping', 'Vacances'
  ];

  // Update default date when the selected month changes
  useEffect(() => {
    const now = new Date();
    const isCurrentMonth =
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear();

    const defaultDate = isCurrentMonth ? now : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formatDateLocal = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    setDate(formatDateLocal(defaultDate));
  }, [currentDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !date) return;

    const baseAmount = parseFloat(amount);
    const newTransactions: Omit<Transaction, 'id'>[] = [];
    // Parse input date (YYYY-MM-DD) as local date to avoid TZ shifts
    const parseDateFromInput = (s: string) => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const startDate = parseDateFromInput(date);

    // Helper: add months preserving day when possible, otherwise clamp to last day of month
    const addMonths = (d: Date, months: number) => {
      const y = d.getFullYear();
      const m = d.getMonth() + months;
      const day = d.getDate();
      // Create candidate in local time
      let candidate = new Date(y, m, day);
      // If month mismatch (overflow), clamp to last day of target month
      const targetMonth = ((m % 12) + 12) % 12;
      if (candidate.getMonth() !== targetMonth) {
        // Last day of target month
        candidate = new Date(y, m + 1, 0);
      }
      return candidate;
    };

    // Define how many occurrences to generate based on recurrence
    // For simplicity, we project 1 year into the future
    let occurrences = 1;
    let monthIncrement = 0;

    switch (recurrence) {
      case RecurrenceFrequency.MONTHLY:
        occurrences = 12;
        monthIncrement = 1;
        break;
      case RecurrenceFrequency.QUARTERLY:
        occurrences = 4;
        monthIncrement = 3;
        break;
      case RecurrenceFrequency.SEMESTRIAL:
        occurrences = 2;
        monthIncrement = 6;
        break;
      case RecurrenceFrequency.YEARLY:
        occurrences = 1; // Just one this year, but conceptually recurring
        // If user wants to project multiple years, we could increase this, 
        // but usually apps focus on current fiscal view. 
        // Let's add 2 years just in case user is viewing end of year.
        occurrences = 2;
        monthIncrement = 12;
        break;
      default:
        occurrences = 1;
        monthIncrement = 0;
    }

    for (let i = 0; i < occurrences; i++) {
      const nextDate = addMonths(startDate, i * monthIncrement);
      const formatDateLocal = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      newTransactions.push({
        name,
        amount: baseAmount,
        type,
        label,
        date: formatDateLocal(nextDate)
      });
    }
    onAdd(newTransactions);

    setName('');
    setAmount('');
    setRecurrence(RecurrenceFrequency.NONE);
    setLabel('Perso');
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700 shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-400" />
        Ajouter un Flux
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Nom du flux</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Salaire, Loyer..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Montant</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Date de début</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <CalendarDays className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Récurrence (sur 1 an)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <RefreshCw className="w-4 h-4" />
            </span>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
            >
              <option value={RecurrenceFrequency.NONE}>Pas de récurrence</option>
              <option value={RecurrenceFrequency.MONTHLY}>Tous les mois</option>
              <option value={RecurrenceFrequency.QUARTERLY}>Tous les trimestres</option>
              <option value={RecurrenceFrequency.SEMESTRIAL}>Tous les semestres</option>
              <option value={RecurrenceFrequency.YEARLY}>Tous les ans</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Label</label>
          <div className="relative">
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
            >
              {LABEL_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setType(TransactionType.INCOME)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${type === TransactionType.INCOME
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
          >
            <Wallet className="w-4 h-4" />
            Revenu
          </button>
          <button
            type="button"
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${type === TransactionType.EXPENSE
              ? 'bg-rose-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
          >
            <TrendingDown className="w-4 h-4" />
            Dépense
          </button>
        </div>

        <Button type="submit" className="w-full mt-4 flex items-center justify-center gap-2">
          {recurrence !== RecurrenceFrequency.NONE ? 'Planifier les flux' : 'Ajouter le flux'}
        </Button>
      </form>
    </div>
  );
};
