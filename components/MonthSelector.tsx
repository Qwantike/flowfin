import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthSelectorProps {
  currentDate: Date;
  onChange: (date: Date) => void;
  viewMode: 'MONTH' | 'YEAR';
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ currentDate, onChange, viewMode }) => {
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') {
        newDate.setMonth(newDate.getMonth() - 1);
    } else {
        newDate.setFullYear(newDate.getFullYear() - 1);
    }
    onChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') {
        newDate.setMonth(newDate.getMonth() + 1);
    } else {
        newDate.setFullYear(newDate.getFullYear() + 1);
    }
    onChange(newDate);
  };

  let displayDate = '';
  if (viewMode === 'MONTH') {
      const formattedDate = new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric',
      }).format(currentDate);
      displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  } else {
      displayDate = currentDate.getFullYear().toString();
  }

  return (
    <div className="flex items-center justify-center gap-6 bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 mb-8 shadow-lg">
      <button
        onClick={handlePrev}
        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Précédent"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-3 min-w-[200px] justify-center">
        <Calendar className="w-5 h-5 text-indigo-400" />
        <span className="text-xl font-bold text-white tracking-wide capitalize">{displayDate}</span>
      </div>

      <button
        onClick={handleNext}
        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Suivant"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};