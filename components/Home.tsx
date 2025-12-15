import React from 'react';
import { Button } from './ui/Button';
import { Activity, LayoutDashboard, Wallet, LineChart } from 'lucide-react';

interface HomeProps {
    onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenAuth }) => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
            <header className="w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">Flow<span className="text-indigo-400">Fin</span></h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onOpenAuth('login')}
                            className="text-sm px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition"
                        >
                            Se connecter
                        </button>
                        <Button variant="primary" onClick={() => onOpenAuth('signup')}>S'inscrire</Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center py-16 px-6">
                <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <section>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                            Visualisez vos flux financiers en un coup d'œil
                        </h2>
                        <p className="text-slate-400 mb-6">
                            FlowFin centralise vos revenus et dépenses, calcule automatiquement vos rendements et dettes, et propose des visualisations modernes (diagramme Sankey-like, donut charts).
                            Gagnez du temps et prenez de meilleures décisions financières.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button variant="primary" onClick={() => onOpenAuth('signup')} className="flex items-center gap-2">
                                Commencer — Gratuit
                            </Button>
                            <button
                                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                                className="px-4 py-2 rounded-md bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                            >
                                En savoir plus
                            </button>
                        </div>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                                    <div className="text-sm font-semibold text-white">Vue synthétique</div>
                                </div>
                                <div className="text-sm text-slate-400">Suivez vos revenus, dépenses et solde mensuel rapidement.</div>
                            </div>

                            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <LineChart className="w-5 h-5 text-emerald-400" />
                                    <div className="text-sm font-semibold text-white">Analyses & projections</div>
                                </div>
                                <div className="text-sm text-slate-400">Calcul automatique des rendements et dettes, simulation de revenus immobiliers.</div>
                            </div>

                            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet className="w-5 h-5 text-amber-400" />
                                    <div className="text-sm font-semibold text-white">Gestion du patrimoine</div>
                                </div>
                                <div className="text-sm text-slate-400">Ajoutez vos actifs (immobilier, placements, crypto) et suivez leur valeur nette.</div>
                            </div>
                        </div>
                    </section>

                    <aside className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Pourquoi FlowFin ?</h3>
                        <ul className="text-slate-400 space-y-3 text-sm">
                            <li>Visualisations claires pour comprendre vos entrées/sorties.</li>
                            <li>Calculs de dettes immobilières et revenus locatifs intégrés.</li>
                            <li>Import facile des flux et planification récurrente.</li>
                        </ul>
                        <div className="mt-6">
                            <div className="text-xs text-slate-500">Aucun partage de données par défaut — vos données restent locales si vous le souhaitez.</div>
                        </div>
                    </aside>
                </div>
            </main>

            <footer className="border-t border-slate-800 py-6">
                <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} FlowFin — Gestion & visualisation de vos finances.
                </div>
            </footer>
        </div>
    );
};

export default Home;