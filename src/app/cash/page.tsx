'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Clock,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Activity,
    UserCheck,
    Briefcase
} from 'lucide-react';

export default function CashierDashboardPage() {

    // 1. Récupération des statistiques de la journée de ce caissier spécifique
    const { data: dashboardData, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['cashierDashboardMetrics'],
        queryFn: async () => {
            const { data } = await api.get('/cashier/dashboard-metrics');
            return data.data;
        },
        refetchOnWindowFocus: true,
    });

    const currency = dashboardData?.currency || 'XAF';

    return (
        <div className="space-y-6">

            {/* Barre d'en-tête interne */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Espace Guichet & Caisse</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Pilotez vos opérations de versement et de décaissement clients en toute sécurité.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    {isFetching ? 'Mise à jour...' : 'Actualiser'}
                </button>
            </div>

            {/* BANDEAU D'ÉTAT DE LA SESSION DE TRAVAIL */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                dashboardData?.session_status === 'open'
                    ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
                    : 'bg-amber-50/60 border-amber-100 text-amber-900'
            }`}>
                <div className="flex items-start gap-3">
                    {dashboardData?.session_status === 'open' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                        <p className="text-sm font-bold">
                            {dashboardData?.session_status === 'open'
                                ? 'Votre tiroir-caisse est actuellement OUVERT et autorisé'
                                : 'Attention : Votre session de caisse n’est pas encore ouverte'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> Session démarrée à {dashboardData?.opening_time || '—'} (Aujourd'hui)
                        </p>
                    </div>
                </div>

                {dashboardData?.session_status !== 'open' && (
                    <Link
                        href="/cash-dashboard/opening"
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl text-center shadow-md shadow-amber-100"
                    >
                        Effectuer l'Ouverture de Caisse
                    </Link>
                )}
            </div>

            {/* GRILLE DES ACTIONS RAPIDES (Gros boutons tactiles/cliquables pour l'efficacité) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Link
                    href="/cash/remittance/send"
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-green-500 hover:shadow-md transition-all group"
                >
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">Faire un Dépôt Client</h3>
                        <p className="text-xs text-slate-400 font-medium">Créditer le compte ou le portefeuille d'un client.</p>
                    </div>
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-[#1d9e4b] group-hover:text-white transition-all">
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                </Link>

                <Link
                    href="/cash/payout"
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Faire un Retrait Espèces</h3>
                        <p className="text-xs text-slate-400 font-medium">Décaissement de fonds après validation du code de sécurité.</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ArrowDownLeft className="w-5 h-5" />
                    </div>
                </Link>

            </div>

            {/* METRIQUES ANALYTIQUES DE LA JOURNÉE EN COURS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Résumé des Dépôts */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mouvements Entrants (Dépôts)</span>
                        <span className="bg-green-50 text-bg-[#87c540] text-[11px] font-bold px-2 py-0.5 rounded-lg border border-green-100">
              {isLoading ? '...' : dashboardData?.today_deposits_count || 0} opérations
            </span>
                    </div>
                    <div>
                        <p className="text-2xl font-mono font-black text-slate-900">
                            {isLoading ? '...' : new Intl.NumberFormat('fr-FR').format(dashboardData?.today_deposits_amount || 0)}
                            <span className="text-sm font-sans font-bold text-slate-400 ml-1.5">{currency}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                            <TrendingUp className="w-3 h-3 text-green-500" /> Total des fonds collectés ce jour
                        </p>
                    </div>
                </div>

                {/* Résumé des Retraits */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mouvements Sortants (Retraits)</span>
                        <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-amber-100">
              {isLoading ? '...' : dashboardData?.today_withdrawals_count || 0} opérations
            </span>
                    </div>
                    <div>
                        <p className="text-2xl font-mono font-black text-slate-900">
                            {isLoading ? '...' : new Intl.NumberFormat('fr-FR').format(dashboardData?.today_withdrawals_amount || 0)}
                            <span className="text-sm font-sans font-bold text-slate-400 ml-1.5">{currency}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                            <TrendingUp className="w-3 h-3 text-amber-500" /> Total des fonds décaissés de votre tiroir
                        </p>
                    </div>
                </div>

            </div>

            {/* TABLEAU DES DERNIÈRES OPÉRATIONS DE L'AGENT */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-slate-400" /> Journal de vos dernières écritures
                    </h3>
                    <Link href="/cash-dashboard/history" className="text-xs text-green-600 font-bold hover:underline">
                        Voir tout l'historique →
                    </Link>
                </div>

                <div className="divide-y divide-slate-100 text-sm font-medium">
                    {isLoading && (
                        <div className="p-8 text-center text-xs text-slate-400">Calcul du journal des écritures...</div>
                    )}

                    {!isLoading && (!dashboardData?.recent_logs || dashboardData.recent_logs.length === 0) ? (
                        <div className="p-8 text-center text-slate-400 font-medium text-xs">
                            Vous n'avez passé aucune écriture comptable aujourd'hui.
                        </div>
                    ) : (
                        dashboardData?.recent_logs?.map((log: any) => (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl border ${
                                        log.entry_type === 'credit'
                                            ? 'bg-green-50 border-green-100 text-green-600'
                                            : 'bg-amber-50 border-amber-100 text-amber-600'
                                    }`}>
                                        {log.entry_type === 'credit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-bold">{log.description || 'Opération de guichet'}</p>
                                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{log.time} — Réf: {log.reference}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className={`font-mono font-bold ${log.entry_type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                                        {log.entry_type === 'credit' ? '+' : '-'} {new Intl.NumberFormat('fr-FR').format(log.amount)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Solde apr: {new Intl.NumberFormat('fr-FR').format(log.balance_after)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}