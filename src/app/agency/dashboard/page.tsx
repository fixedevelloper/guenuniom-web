'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    TrendingUp,
    ShieldAlert,
    RefreshCw,
    Activity,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';

// Fonctions d'appels API vers le backend Laravel
const fetchDashboardStats = async () => {
    const { data } = await api.get('/agency/analytics/dashboard');
    return data;
};

export default function AgencyDashboardPage() {
    const { data: stats, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['agencyDashboardStats'],
        queryFn: fetchDashboardStats,
        refetchInterval: 30000, // Rafraîchissement automatique toutes les 30 secondes
    });

    if (isLoading) {
        return (
            <div className="p-6 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center min-h-[60vh] gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                Chargement des indicateurs de l'agence...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 text-center text-rose-600 bg-rose-50/50 border border-rose-100 rounded-2xl m-6">
                <ShieldAlert className="w-8 h-8 mx-auto text-rose-500 mb-2" />
                Impossible de charger les données financières de la succursale.
            </div>
        );
    }

    const data = stats?.data || {
        vault_balance: 0,
        total_cash_in: 0,
        total_cash_out: 0,
        active_cashiers_count: 0,
        recent_transactions: [],
        active_sessions: []
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* EN-TÊTE ACTIONNABLE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pilotage de la Succursale</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble de la trésorerie, de l'activité des guichets et de la conformité locale.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all self-start"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
                    {isFetching ? 'Mise à jour...' : 'Actualiser les flux'}
                </button>
            </div>

            {/* CARTES DE RENDEMENT ET TRÉSORERIE (KPI) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Solde du Coffre fort de l'Agence */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Encaisse Global (Coffre)</span>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {new Intl.NumberFormat('fr-FR').format(data.vault_balance)} <span className="text-xs font-sans font-bold text-slate-400">XAF</span>
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>

                {/* Total Dépôts (Cash-In) de la journée */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Volume Dépôts (Jour)</span>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {new Intl.NumberFormat('fr-FR').format(data.total_cash_in)} <span className="text-xs font-sans font-bold text-slate-400">XAF</span>
                        </span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-green-600">
                        <ArrowDownRight className="w-5 h-5" />
                    </div>
                </div>

                {/* Total Retraits (Cash-Out) de la journée */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Volume Retraits (Jour)</span>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {new Intl.NumberFormat('fr-FR').format(data.total_cash_out)} <span className="text-xs font-sans font-bold text-slate-400">XAF</span>
                        </span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                </div>

                {/* Nombre de guichets ouverts */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Guichets Actifs</span>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {data.active_cashiers_count} <span className="text-xs font-sans font-bold text-slate-500">en ligne</span>
                        </span>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-600">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* SECTIONS OPÉRATIONNELLES : ETAT DES CAISSES & DERNIÈRES TRANSACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* BLOC 1 & 2 : SUIVI DES SESSIONS EN DIRECT (TILLS) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-slate-800">État des Tiroirs-Caisses (Tills)</h2>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Temps Réel</span>
                        </div>

                        <div className="divide-y divide-slate-100 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
    <tr>
        <th className="py-3 px-5">Libellé du Tiroir</th>
        <th className="py-3 px-5">Code Unique</th>
        <th className="py-3 px-5">Solde Actuel</th>
        <th className="py-3 px-5 text-center">Alerte Seuil (Encaisse)</th>
    </tr>
</thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
    {data.active_sessions.length === 0 ? (
        <tr>
            <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                Aucun tiroir-caisse actif ou configuré pour le moment.
            </td>
        </tr>
    ) : (
        data.active_sessions.map((till: any) => {
            // Alerte de sécurité si l'encaisse du tiroir dépasse le plafond autorisé (ex: 2 000 000 XAF)
            const isOverLimit = till.current_balance > 2000000;

            return (
                <tr key={till.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Libellé du coffre/tiroir */}
                    <td className="py-3 px-5">
                        <span className="block font-bold text-slate-900">{till.cashier_name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">ID: {till.id}</span>
                    </td>
                    
                    {/* Code unique du Till (ex: TILL-001) */}
                    <td className="py-3 px-5 text-xs font-mono text-slate-500 font-bold uppercase">
                        {till.employee_code}
                    </td>
                    
                    {/* Solde actuel en temps réel */}
                    <td className="py-3 px-5 font-mono font-bold text-slate-900">
                        {new Intl.NumberFormat('fr-FR').format(till.current_balance)} <span className="text-[10px] font-sans text-slate-400">XAF</span>
                    </td>
                    
                    {/* Alerte délestage de sécurité */}
                    <td className="py-3 px-5 text-center">
                        {isOverLimit ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> Délestage requis
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sécurisé
                            </span>
                        )}
                    </td>
                </tr>
            );
        })
    )}
</tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* BLOC 3 : HISTORIQUE DES DERNIÈRES OPÉRATIONS AU GUICHET */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                            <TrendingUp className="w-4 h-4 text-slate-700" />
                            <h2 className="text-sm font-bold text-slate-800">Derniers Mouvements</h2>
                        </div>

                        <div className="space-y-3.5">
                            {data.recent_transactions.length === 0 ? (
                                <p className="text-center py-6 text-xs text-slate-400">Aucune transaction enregistrée aujourd'hui.</p>
                            ) : (
                                data.recent_transactions.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-1.5 rounded-lg border ${
                                                tx.type === 'cash_in' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                                            }`}>
                                                {tx.type === 'cash_in' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-800 block">{tx.reference}</span>
                                                <span className="text-[10px] text-slate-400 font-semibold block">{tx.timestamp} · Caissier : {tx.cashier_code}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black font-mono text-slate-900 block">
                                                {tx.type === 'cash_out' ? '-' : '+'}{new Intl.NumberFormat('fr-FR').format(tx.amount)} F
                                            </span>
                                            <span className={`text-[9px] font-bold ${tx.status === 'success' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {tx.status === 'success' ? 'Validé' : 'En attente'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
