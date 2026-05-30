'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    FileText,
    Download,
    RefreshCw,
    ShieldAlert,
    Calendar,
    TrendingUp,
    ArrowDownLeft,
    ArrowUpRight,
    Users,
    Layers,
    PieChart as PieIcon
} from 'lucide-react';

export default function AgencyReportsPage() {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    // 1. Extraction des données analytiques de la succursale
    const { data: reportData, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['agencyReports', period],
        queryFn: async () => {
            const { data } = await api.get('/agency/reports', {
                params: { period }
            });
            return data;
        }
    });

    const metrics = reportData?.data?.metrics || { total_cash_in: 0, total_cash_out: 0, total_fees: 0, active_tills_count: 0 };
    const breakDowns = reportData?.data?.breakdowns || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' XAF';
    };

    const triggerDownload = (reportType: string) => {
        alert(`Génération et téléchargement du rapport [${reportType}] au format PDF/Excel encours...`);
        // Logique d'appel vers l'export natif (ex: window.open(`/api/agency/reports/export?type=${reportType}&period=${period}`))
    };

    if (isLoading) {
        return (
            <div className="text-center py-12 text-xs font-semibold text-slate-400 flex flex-col items-center gap-2 justify-center min-h-[60vh]">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" /> Compilation des données analytiques...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 text-center text-rose-600 bg-rose-50/50 border border-rose-100 rounded-2xl m-6">
                <ShieldAlert className="w-8 h-8 mx-auto text-rose-500 mb-2" /> Échec du chargement des rapports d'activité.
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* EN-TÊTE ACTIONNABLE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rapports & Statistiques</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Analyse des flux financiers, performance des guichets et états comptables de la succursale.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Commutateur de Période */}
                    <div className="bg-slate-200/70 p-1 rounded-xl flex gap-1 border border-slate-300/40">
                        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase transition-all ${
                                    period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {p === 'daily' ? 'Jour' : p === 'weekly' ? 'Semaine' : 'Mois'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* CARTES DE RENDEMENT DIRECT (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Volume Dépôts</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{formatCurrency(metrics.total_cash_in)}</span>
                    </div>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100"><ArrowDownLeft className="w-5 h-5" /></div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Volume Retraits</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{formatCurrency(metrics.total_cash_out)}</span>
                    </div>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100"><ArrowUpRight className="w-5 h-5" /></div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commissions Générées</span>
                        <span className="text-lg font-black text-emerald-700 font-mono">{formatCurrency(metrics.total_fees)}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><TrendingUp className="w-5 h-5" /></div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guichets Actifs</span>
                        <span className="text-lg font-black text-slate-900 font-mono">{metrics.active_tills_count}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200"><Users className="w-5 h-5" /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ZONE GENERATION DE TELECHARGEMENTS / EXPORTS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 lg:col-span-1">
                    <div className="flex items-center gap-2 border-b pb-3">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-sm font-bold text-slate-800">Documents Réglementaires</h2>
                    </div>

                    <div className="space-y-2">
                        <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border rounded-xl flex items-center justify-between transition-colors">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-800 block">Livre de Journal de Caisse</span>
                                <span className="text-[10px] text-slate-400 font-medium">Bordereau complet des écritures (OHADA)</span>
                            </div>
                            <button onClick={() => triggerDownload('journal_caisse')} className="p-2 bg-white text-slate-700 border hover:border-slate-300 rounded-lg shadow-sm"><Download className="w-3.5 h-3.5" /></button>
                        </div>

                        <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border rounded-xl flex items-center justify-between transition-colors">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-800 block">Rapport d'Écart & Balance</span>
                                <span className="text-[10px] text-slate-400 font-medium">Rapprochement Coffre Central vs Tiroirs</span>
                            </div>
                            <button onClick={() => triggerDownload('balance_matching')} className="p-2 bg-white text-slate-700 border hover:border-slate-300 rounded-lg shadow-sm"><Download className="w-3.5 h-3.5" /></button>
                        </div>

                        <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border rounded-xl flex items-center justify-between transition-colors">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-800 block">Performances des Guichetiers</span>
                                <span className="text-[10px] text-slate-400 font-medium">Volumes traités par opérateur</span>
                            </div>
                            <button onClick={() => triggerDownload('cashier_performance')} className="p-2 bg-white text-slate-700 border hover:border-slate-300 rounded-lg shadow-sm"><Download className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                </div>

                {/* HISTOGRAMME DE PERFORMANCE PAR TIROIR / CAISSE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800">Activité Détaillée par Tiroir-Caisse</h2>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-bold">Période active</span>
                    </div>

                    <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                        {breakDowns.length === 0 ? (
                            <div className="text-center py-12 text-xs text-slate-400 font-medium">Aucune donnée de ventilation disponible.</div>
                        ) : (
                            breakDowns.map((till: any) => {
                                const total = till.cash_in_volume + till.cash_out_volume;
                                const inPercent = total > 0 ? (till.cash_in_volume / total) * 100 : 0;
                                const outPercent = total > 0 ? (till.cash_out_volume / total) * 100 : 0;

                                return (
                                    <div key={till.till_code} className="space-y-1.5 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border">{till.till_code} — {till.cashier_name}</span>
                                            <span className="font-mono text-slate-500">Flux cumulés : <b className="text-slate-900">{formatCurrency(total)}</b></span>
                                        </div>
                                        {/* Barre de répartition visuelle */}
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                            <div style={{ width: `${inPercent}%` }} className="h-full bg-blue-500" title={`Dépôts: ${inPercent.toFixed(1)}%`} />
                                            <div style={{ width: `${outPercent}%` }} className="h-full bg-amber-500" title={`Retraits: ${outPercent.toFixed(1)}%`} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                                            <span className="text-blue-600">IN: {formatCurrency(till.cash_in_volume)}</span>
                                            <span className="text-amber-600">OUT: {formatCurrency(till.cash_out_volume)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}