import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { Asset, AssetCategory } from '../types';
import { AssetForm } from './AssetForm';
import { AssetList } from './AssetList';
import { PieChart, Landmark, TrendingUp, Wallet } from 'lucide-react';
import { api } from '../services/api';

interface WealthDashboardProps {
    externalAssets?: Asset[];
    onAssetsChange?: (assets: Asset[]) => void;
    currentAccountBalance?: number;
}

export const WealthDashboard: React.FC<WealthDashboardProps> = ({ externalAssets, onAssetsChange, currentAccountBalance = 0 }) => {
    // Use external state if provided, otherwise local state (fallback)
    const [localAssets, setLocalAssets] = useState<Asset[]>([]);

    const assets = externalAssets || localAssets;
    const setAssets = onAssetsChange || setLocalAssets;

    const addAsset = async (newAsset: Omit<Asset, 'id'>) => {
        try {
            const added = await api.assets.add(newAsset);
            setAssets([...assets, added]);
        } catch (e) {
            console.error(e);
        }
    };

    const removeAsset = async (id: string) => {
        try {
            await api.assets.delete(id);
            setAssets(assets.filter(a => a.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    // Helper calculation
    const calculateRemainingLoan = (asset: Asset): number => {
        if (!asset.realEstateDetails?.hasLoan) return 0;
        const { loanAmount, loanRate, loanDurationYears, loanStartDate } = asset.realEstateDetails;
        const monthlyRate = loanRate / 100 / 12;
        const totalMonths = loanDurationYears * 12;
        const start = new Date(loanStartDate);
        const now = new Date();
        const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        if (monthsElapsed >= totalMonths) return 0;
        if (monthsElapsed <= 0) return loanAmount;
        if (monthlyRate === 0) return loanAmount * (1 - monthsElapsed / totalMonths);
        const numerator = Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, monthsElapsed);
        const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1;
        return loanAmount * (numerator / denominator);
    };

    const stats = useMemo(() => {
        // Start with current account balance
        let grossWealth = currentAccountBalance;
        let totalDebt = 0;
        let projectedAnnualIncome = 0;

        const distribution = {
            [AssetCategory.LIQUIDITY]: currentAccountBalance, // Add to liquidity
            [AssetCategory.INVESTMENT]: 0,
            [AssetCategory.REAL_ESTATE]: 0,
            [AssetCategory.CRYPTO]: 0,
        };

        assets.forEach(a => {
            const val = Number(a.value);
            grossWealth += val;
            distribution[a.category] += val;

            totalDebt += calculateRemainingLoan(a);

            if (a.category === AssetCategory.REAL_ESTATE && a.realEstateDetails) {
                projectedAnnualIncome += Number(a.realEstateDetails.monthlyRent) * 12;
            } else {
                projectedAnnualIncome += val * (Number(a.yield) / 100);
            }
        });

        return {
            grossWealth,
            netWealth: grossWealth - totalDebt,
            totalDebt,
            projectedAnnualIncome,
            distribution
        };
    }, [assets, currentAccountBalance]);

    const getLabel = (key: string) => {
        switch (key) {
            case AssetCategory.REAL_ESTATE: return 'Immobilier';
            case AssetCategory.LIQUIDITY: return 'Liquidité';
            case AssetCategory.INVESTMENT: return 'Investissement';
            case AssetCategory.CRYPTO: return 'Crypto';
            default: return key;
        }
    };

    // Donut Chart Logic using D3
    const DonutChart = () => {
        const [hovered, setHovered] = useState<{ key: string, val: number } | null>(null);

        if (stats.grossWealth === 0) return (
            <div className="h-64 flex items-center justify-center text-slate-500">
                <PieChart className="w-12 h-12 opacity-20" />
            </div>
        );

        const radius = 110;
        const data = Object.entries(stats.distribution)
            .filter(([_, val]) => (val as number) > 0)
            .map(([key, val]) => ({ key, val: val as number }));

        const pie = d3.pie<{ key: string, val: number }>().value(d => d.val).sort(null);
        const arc = d3.arc<d3.PieArcDatum<{ key: string, val: number }>>().innerRadius(60).outerRadius(radius);

        const colors: Record<string, string> = {
            [AssetCategory.LIQUIDITY]: '#10b981',
            [AssetCategory.INVESTMENT]: '#3b82f6',
            [AssetCategory.REAL_ESTATE]: '#f59e0b',
            [AssetCategory.CRYPTO]: '#a855f7',
        };

        return (
            <div className="flex flex-col items-center justify-center py-4">
                <svg width={radius * 2} height={radius * 2}>
                    <g transform={`translate(${radius}, ${radius})`}>
                        {pie(data).map((d, i) => (
                            <path
                                key={i}
                                d={arc(d) || undefined}
                                fill={colors[d.data.key]}
                                stroke="#1e293b"
                                strokeWidth="2"
                                onMouseEnter={() => setHovered({ key: d.data.key, val: d.data.val })}
                                onMouseLeave={() => setHovered(null)}
                                className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                            />
                        ))}
                        <text textAnchor="middle" dy="-12" className="text-xs fill-slate-400 font-medium uppercase tracking-wider">
                            {hovered ? getLabel(hovered.key) : 'TOTAL BRUT'}
                        </text>
                        <text textAnchor="middle" dy="16" className="text-lg font-bold fill-white">
                            {hovered
                                ? hovered.val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                                : stats.grossWealth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                            }
                        </text>
                    </g>
                </svg>
                <div className="flex flex-row flex-wrap gap-4 mt-4 justify-center items-center">
                    {data.map(d => (
                        <div key={d.key} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[d.key] }}></div>
                            <div className="text-xs text-slate-300">
                                {getLabel(d.key)}
                                <span className="ml-1 text-slate-500">{Math.round((d.val / stats.grossWealth) * 100)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Net Donut Chart: similar to DonutChart but uses net values (value - remaining loan)
    const NetDonutChart = () => {
        const [hovered, setHovered] = useState<{ key: string, val: number } | null>(null);

        if (stats.netWealth === 0) return (
            <div className="h-64 flex items-center justify-center text-slate-500">
                <PieChart className="w-12 h-12 opacity-20" />
            </div>
        );

        // compute net per category
        const netDistribution: Record<string, number> = {
            [AssetCategory.LIQUIDITY]: currentAccountBalance, // Current account is fully liquid/net (usually)
            [AssetCategory.INVESTMENT]: 0,
            [AssetCategory.REAL_ESTATE]: 0,
            [AssetCategory.CRYPTO]: 0,
        };

        assets.forEach(a => {
            const val = Number(a.value) || 0;
            const debt = calculateRemainingLoan(a) || 0;
            const netVal = Math.max(val - debt, 0);
            netDistribution[a.category] += netVal;
        });

        const radius = 110;
        const data = Object.entries(netDistribution)
            .filter(([_, val]) => (val as number) > 0)
            .map(([key, val]) => ({ key, val: val as number }));

        const pie = d3.pie<{ key: string, val: number }>().value(d => d.val).sort(null);
        const arc = d3.arc<d3.PieArcDatum<{ key: string, val: number }>>().innerRadius(60).outerRadius(radius);

        const colors: Record<string, string> = {
            [AssetCategory.LIQUIDITY]: '#10b981',
            [AssetCategory.INVESTMENT]: '#3b82f6',
            [AssetCategory.REAL_ESTATE]: '#f59e0b',
            [AssetCategory.CRYPTO]: '#a855f7',
        };

        return (
            <div className="flex flex-col items-center justify-center py-4">
                <svg width={radius * 2} height={radius * 2}>
                    <g transform={`translate(${radius}, ${radius})`}>
                        {pie(data).map((d, i) => (
                            <path
                                key={i}
                                d={arc(d) || undefined}
                                fill={colors[d.data.key]}
                                stroke="#1e293b"
                                strokeWidth="2"
                                onMouseEnter={() => setHovered({ key: d.data.key, val: d.data.val })}
                                onMouseLeave={() => setHovered(null)}
                                className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                            />
                        ))}
                        <text textAnchor="middle" dy="-12" className="text-xs fill-slate-400 font-medium uppercase tracking-wider">
                            {hovered ? getLabel(hovered.key) : 'TOTAL NET'}
                        </text>
                        <text textAnchor="middle" dy="16" className="text-lg font-bold fill-white">
                            {hovered
                                ? hovered.val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                                : stats.netWealth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                            }
                        </text>
                    </g>
                </svg>
                <div className="flex flex-row flex-wrap gap-4 mt-4 justify-center items-center">
                    {data.map(d => (
                        <div key={d.key} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[d.key] }}></div>
                            <div className="text-xs text-slate-300">
                                {getLabel(d.key)}
                                <span className="ml-1 text-slate-500">{stats.netWealth > 0 ? Math.round((d.val / stats.netWealth) * 100) : 0}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-5 border border-slate-700/50 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <span className="text-slate-400 font-medium">Patrimoine Net</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats.netWealth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Brut: {stats.grossWealth.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-5 border border-slate-700/50 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <span className="text-slate-400 font-medium">Dettes (Crédits)</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalDebt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Reste à rembourser</div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-5 border border-slate-700/50 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <span className="text-slate-400 font-medium">Rente Annuelle (Brut)</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats.projectedAnnualIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            ~ {(stats.projectedAnnualIncome / 12).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} / mois
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-xs">Allocation d'actifs</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                        <div className="w-full md:w-1/2">
                            <DonutChart />
                        </div>
                        <div className="w-full md:w-1/2">
                            <NetDonutChart />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Analyse</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Votre ratio d'endettement est de <strong className="text-white">{stats.grossWealth > 0 ? Math.round((stats.totalDebt / stats.grossWealth) * 100) : 0}%</strong>.
                        {stats.netWealth > 0 && (
                            <span> Votre patrimoine net représente <strong className="text-white">{Math.round((stats.netWealth / stats.grossWealth) * 100)}%</strong> de vos avoirs.</span>
                        )}
                        <br />
                        Le rendement passif moyen de votre patrimoine brut est de <strong className="text-emerald-400">{stats.grossWealth > 0 ? ((stats.projectedAnnualIncome / stats.grossWealth) * 100).toFixed(2) : 0}%</strong>.
                    </p>
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
                <AssetForm onAdd={addAsset} />

                <div className="mt-2 space-y-4">
                    <h3 className="text-lg font-semibold text-white px-1">Détail des Actifs</h3>

                    {/* Integrated Current Account Card */}
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:border-indigo-500/40 transition-all">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-900 rounded-lg mt-1">
                                    <Wallet className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-200">Compte Courant</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                                            Liquidité
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">
                                            Synchronisé
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-white">
                                    {currentAccountBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <AssetList assets={assets} onRemove={removeAsset} />
                </div>
            </div>
        </div>
    );
};