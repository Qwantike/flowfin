import React, { useState } from 'react';
import { Button } from './ui/Button';
import { api } from '../services/api';
import { Activity, Lock, Mail, UserPlus, LogIn } from 'lucide-react';

interface AuthFormProps {
    onSuccess: () => void;
    /** initialMode if opened from somewhere else */
    initialMode?: 'login' | 'signup';
    /** render as a compact card (no fullscreen wrapper) so parent can provide an overlay */
    asModal?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, initialMode, asModal = false }) => {
    const [isLogin, setIsLogin] = useState(initialMode ? initialMode === 'login' : true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // client-side validation for signup
        if (!isLogin) {
            if (password !== confirmPassword) {
                setError('Les mots de passe ne correspondent pas');
                return;
            }
        }
        setLoading(true);

        try {
            const data = isLogin
                ? await api.auth.login(email, password)
                : await api.auth.register(email, password);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const cardClass = asModal
        ? 'w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8 animate-in fade-in zoom-in duration-300'
        : 'w-full max-w-md bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-8 animate-in fade-in zoom-in duration-300';

    return (
        <div className={asModal ? '' : 'min-h-screen flex items-center justify-center bg-[#0f172a] p-4'}>
            <div className={cardClass}>
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-600 p-3 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.5)] mb-4">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Flow<span className="text-indigo-400">Fin</span></h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {isLogin ? 'Bon retour parmi nous' : 'Créez votre compte pour commencer'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
		    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Confirmer le mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Confirmez le mot de passe"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
                        {loading ? 'Chargement...' : (
                            <>
                                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                {isLogin ? 'Se connecter' : "S'inscrire"}
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword(''); }}
                        className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                        {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
                    </button>
                </div>
            </div>
        </div>
    );
};
