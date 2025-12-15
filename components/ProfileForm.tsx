import React, { useState } from 'react';
import { Button } from './ui/Button';
import { api } from '../services/api';

interface ProfileFormProps {
    onClose?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        if (newPassword !== confirm) {
            setError('Les nouveaux mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            const res = await api.auth.changePassword(currentPassword, newPassword);
            setMessage(res.message || 'Mot de passe mis à jour');
            setCurrentPassword('');
            setNewPassword('');
            setConfirm('');
        } catch (err: any) {
            setError(err.message || 'Erreur lors du changement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Profil — Modifier le mot de passe</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Mot de passe actuel</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Nouveau mot de passe</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Confirmer le nouveau mot de passe</label>
                        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" required />
                    </div>

                    {error && <div className="text-sm text-red-400">{error}</div>}
                    {message && <div className="text-sm text-emerald-400">{message}</div>}

                    <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 border border-slate-700">Annuler</button>
                        <Button type="submit" disabled={loading}>{loading ? 'En cours...' : 'Enregistrer'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileForm;
