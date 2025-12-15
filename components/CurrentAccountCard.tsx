import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';

export const CurrentAccountCard: React.FC = () => {
  const [account, setAccount] = useState<{ balance: number; last_update_at: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const a = await api.currentAccount.get();
      setAccount(a);
      setValue((a.balance || 0).toString());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const saveManual = async () => {
    setLoading(true);
    try {
      const res = await api.currentAccount.manualUpdate(Number(value));
      setAccount(res);
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert('Erreur mise à jour');
    } finally { setLoading(false); }
  };

  const triggerAuto = async () => {
    setLoading(true);
    try {
      const res = await api.currentAccount.autoUpdate();
      setAccount(res);
    } catch (e) { console.error(e); alert('Erreur calcul automatique'); }
    finally { setLoading(false); }
  };

  if (!account) return null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs text-slate-400">Compte courant</div>
          <div className="text-2xl font-bold text-white">{account.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          <div className="text-xs text-slate-500 mt-1">Dernière MAJ : {new Date(account.last_update_at).toLocaleDateString('fr-FR')}</div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setEditing(v => !v)} size="sm">{editing ? 'Annuler' : 'Modifier'}</Button>
          <button onClick={triggerAuto} className="text-xs text-slate-300 px-3 py-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800">Appliquer transactions</button>
        </div>
      </div>

      {editing && (
        <div className="mt-3">
          <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          <div className="flex justify-end mt-2 gap-2">
            <Button onClick={saveManual} disabled={loading}>Enregistrer</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentAccountCard;
