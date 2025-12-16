import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { CalendarDays, Save, RotateCw } from 'lucide-react';

export const CurrentAccountCard: React.FC = () => {
  const [account, setAccount] = useState<{ balance: number; last_update_at: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>('');
  const [dateValue, setDateValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const load = async () => {
    try {
      const a = await api.currentAccount.get();
      setAccount(a);
      // Note: value et dateValue sont désormais gérés par le useEffect ci-dessous
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  // Synchroniser le formulaire avec les données du compte à chaque changement
  // (Chargement initial, après sauvegarde manuelle, ou après mise à jour auto)
  useEffect(() => {
    if (account) {
      setValue((account.balance || 0).toString());

      const d = new Date(account.last_update_at);

      // CORRECTION : On construit la chaîne YYYY-MM-DD manuellement en utilisant 
      // les méthodes locales (getFullYear, etc.) pour correspondre exactement 
      // à la date affichée dans "Arrêté au..." et éviter le décalage UTC de toISOString().
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      setDateValue(`${year}-${month}-${day}`);
    }
  }, [account]);

  // Clear toast after 3s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const saveManual = async () => {
    setLoading(true);
    try {
      const res = await api.currentAccount.manualUpdate(Number(value), dateValue);
      setAccount(res);
      setEditing(false);
      setToast({ msg: 'Solde mis à jour', type: 'success' });
    } catch (e) {
      console.error(e);
      alert('Erreur mise à jour');
    } finally { setLoading(false); }
  };

  const triggerAuto = async () => {
    setLoading(true);
    try {
      const res: any = await api.currentAccount.autoUpdate();
      setAccount(res); // Cela déclenchera le useEffect qui mettra à jour dateValue !
      const diff = res.applied;
      if (diff !== 0) {
        setToast({
          msg: `${diff > 0 ? '+' : ''}${diff.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} appliqués`,
          type: 'success'
        });
      } else {
        setToast({ msg: 'À jour. Aucune nouvelle transaction.', type: 'info' });
      }
    } catch (e) { console.error(e); alert('Erreur calcul automatique'); }
    finally { setLoading(false); }
  };

  if (!account) return null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 relative overflow-hidden">
      {/* Toast Feedback */}
      {toast && (
        <div className={`absolute top-0 left-0 right-0 p-2 text-xs font-semibold text-center animate-in fade-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-slate-600/90 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-2 mt-1">
        <div>
          <div className="text-xs text-slate-400">Compte courant</div>
          <div className="text-2xl font-bold text-white">{account.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Arrêté au :</span>
            <span className="font-medium text-slate-400">{new Date(account.last_update_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {!editing && (
            <>
              <Button onClick={() => setEditing(true)} size="sm" variant="secondary" className="text-xs">
                Modifier
              </Button>
              <button
                onClick={triggerAuto}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-indigo-300 px-3 py-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Calcul...' : 'Appliquer transactions'}
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-2 space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nouveau solde</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Date de référence du solde</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dateValue}
                onChange={e => setDateValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Les transactions postérieures à cette date seront ajoutées lors de la prochaine mise à jour auto.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={() => setEditing(false)} size="sm" variant="secondary">Annuler</Button>
            <Button onClick={saveManual} disabled={loading} size="sm" className="flex items-center gap-1">
              <Save className="w-3 h-3" />
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentAccountCard;