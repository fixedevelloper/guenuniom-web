'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import React, { useState } from 'react';
import {
    TrendingUp,
    Globe,
    DollarSign,
    ShieldAlert,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw
} from 'lucide-react';

// Fonction de récupération des données depuis l'API Laravel
const fetchGlobalMetrics = async (period: string) => {
    const { data } = await api.get(`/reporting/global-metrics?period=${period}`);
    return data.data;
};

export default function GlobalDashboardPage() {
    // 1. État local React standard pour gérer la période (7d, 30d, 12m)
    const [period, setPeriod] = useState<string>('30d');

    // Récupération de l'utilisateur connecté pour l'affichage textuel
    const { user } = useAuthStore();

    // 2. Récupération des données avec React Query calé sur l'état local
    const { data: metrics, isLoading, isError, refetch } = useQuery({
        queryKey: ['globalMetrics', period], // Le changement de 'period' déclenche automatiquement un nouveau fetch
        queryFn: () => fetchGlobalMetrics(period),
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                    <p className="text-sm font-medium text-slate-500">Consolidation des flux inter-pays...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500 font-semibold">Erreur lors du chargement des rapports macro-financiers.</p>
                <button onClick={() => refetch()} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">

            {/* En-tête avec sélecteur de période classique */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reporting Financier Macro</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Métriques consolidées pour la zone CEMAC/UEMOA pilotées par {user?.first_name || 'l\'administration'}.
                    </p>
                </div>

                {/* Boutons mettant à jour l'état local 'period' */}
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm self-start">
                    {['7d', '30d', '12m'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)} // Met à jour le useState standard
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                                period === p
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {p === '7d' ? '7 Jours' : p === '30d' ? '30 Jours' : '12 Mois'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grille des KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                {/* KPI 1 : Volume Global */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">Volume Transigé</span>
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{metrics?.totals?.volume?.toLocaleString()} XAF</h3>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+{metrics?.totals?.volume_growth}% par rapport au cycle précédent</span>
                        </div>
                    </div>
                </div>

                {/* KPI 2 : Commissions Nettes */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">Commissions Nettes</span>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{metrics?.totals?.revenue?.toLocaleString()} XAF</h3>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+{metrics?.totals?.revenue_growth}% de marge nette</span>
                        </div>
                    </div>
                </div>

                {/* KPI 3 : Couverture Pays Actifs */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">Corridors Actifs</span>
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Globe className="w-5 h-5" /></div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{metrics?.totals?.active_countries} Pays</h3>
                        <p className="text-xs text-slate-500 mt-1">{metrics?.totals?.active_corridors} Corridors de transfert activés</p>
                    </div>
                </div>

                {/* KPI 4 : Alerte Risque de Liquidité */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">Alerte Encaisses</span>
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><ShieldAlert className="w-5 h-5" /></div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{metrics?.totals?.low_liquidity_agencies} Agences</h3>
                        <div className="flex items-center gap-1 text-rose-600 text-xs font-semibold mt-1">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>Solde en caisse critique (Sous le seuil min)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Performance Analytique et Corridors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Tableau Répartition par Pays */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Performance Analytique par Pays</h2>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">Flux Consolides</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="py-3 px-2">Pays</th>
                                <th className="py-3 px-2 text-right">Transactions</th>
                                <th className="py-3 px-2 text-right">Volume (XAF)</th>
                                <th className="py-3 px-2 text-right">Commissions (XAF)</th>
                                <th className="py-3 px-2 text-right">Statut Caisse</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                            {metrics?.countries?.map((country: any) => (
                                <tr key={country.code} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3.5 px-2 flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{country.name}</span>
                                        <span className="text-xs text-slate-400">({country.code})</span>
                                    </td>
                                    <td className="py-3.5 px-2 text-right">{country.tx_count?.toLocaleString()}</td>
                                    <td className="py-3.5 px-2 text-right font-semibold">{country.volume?.toLocaleString()}</td>
                                    <td className="py-3.5 px-2 text-right text-emerald-600">{country.commissions?.toLocaleString()}</td>
                                    <td className="py-3.5 px-2 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          country.liquidity_status === 'optimal' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {country.liquidity_status === 'optimal' ? 'Optimal' : 'Réappro requis'}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Corridors Émergents */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Top Corridors Émergents</h2>
                    <p className="text-xs text-slate-400">Flux inter-pays les plus actifs sur la plateforme.</p>

                    <div className="space-y-4 mt-2">
                        {metrics?.corridors?.map((corridor: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                        <span>{corridor.source}</span>
                                        <span className="text-slate-400 text-xs">➔</span>
                                        <span>{corridor.destination}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{corridor.tx_count} opérations complétées</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-extrabold text-slate-900">{corridor.share_percentage}%</span>
                                    <p className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded mt-0.5">des flux</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}