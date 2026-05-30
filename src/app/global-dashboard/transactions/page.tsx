'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle
} from 'lucide-react';

// Fonction fetch vers l'API Laravel
const fetchGlobalTransactions = async (filters: { search: string; status: string; page: number }) => {
    const params = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        page: filters.page.toString()
    });
    const { data } = await api.get(`/reporting/global-transactions?${params.toString()}`);
    return data;
};

export default function GlobalTransactionsPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    // Déclenchement réactif de React Query selon les filtres locaux
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['globalTransactions', { search, status, page }],
        queryFn: () => fetchGlobalTransactions({ search, status, page }),
        refetchOnWindowFocus: false,
    });

    // Helper pour styliser visuellement le statut d'une transaction FinTech
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> Succès
          </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="w-3.5 h-3.5" /> En cours
          </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            <XCircle className="w-3.5 h-3.5" /> Annulé
          </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-100">
            <AlertTriangle className="w-3.5 h-3.5" /> Inconnu
          </span>
                );
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions Globales</h1>
                    <p className="text-sm text-slate-500 mt-1">Audit et traçabilité en temps réel des mandats inter-pays transitant sur le réseau.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm self-start transition-colors"
                >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    Rafraîchir
                </button>
            </div>

            {/* Barre de Recherche et Filtres */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par référence, expéditeur, destinataire..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-8 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white appearance-none cursor-pointer transition-all"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="completed">Succès</option>
                            <option value="pending">En cours</option>
                            <option value="cancelled">Annulés</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* État de chargement */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-slate-500">Chargement de l'historique général...</p>
                </div>
            )}

            {/* État d'erreur */}
            {isError && (
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 text-center space-y-3">
                    <p className="text-rose-600 font-semibold">Une erreur est survenue lors de la récupération des flux financiers.</p>
                    <button onClick={() => refetch()} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                        Réessayer
                    </button>
                </div>
            )}

            {/* Tableau des données */}
            {!isLoading && !isError && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Référence / Date</th>
                                <th className="py-4 px-6">Flux Pays</th>
                                <th className="py-4 px-6">Acteurs (Exp. ➔ Dest.)</th>
                                <th className="py-4 px-6 text-right">Montant (Net)</th>
                                <th className="py-4 px-6 text-right">Frais</th>
                                <th className="py-4 px-6 text-center">Statut</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                                        Aucune transaction ne correspond à vos critères de recherche.
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((tx: any) => (
                                    <tr key={tx.uuid} className="hover:bg-slate-50/40 transition-colors">
                                        {/* Référence & Horodatage */}
                                        <td className="py-4 px-6 space-y-1">
                                            <span className="font-mono font-bold text-slate-900 tracking-tight">{tx.reference}</span>
                                            <p className="text-xs text-slate-400 font-normal">
                                                {tx.completed_at ? new Date(tx.completed_at).toLocaleString('fr-FR') : 'Non finalisé'}
                                            </p>
                                        </td>

                                        {/* Flux géographique */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="bg-blue-50 text-blue-700 border border-blue-100/80 px-2 py-0.5 rounded">
                            {tx.sender_country?.code || 'CM'}
                          </span>
                                                <span className="text-slate-400 font-normal">➔</span>
                                                <span className="bg-purple-50 text-purple-700 border border-purple-100/80 px-2 py-0.5 rounded">
                            {tx.recipient_country?.code || 'CG'}
                          </span>
                                            </div>
                                        </td>

                                        {/* Tiers impliqués */}
                                        <td className="py-4 px-6 space-y-0.5">
                                            <p className="text-sm font-semibold text-slate-900">{tx.sender_name}</p>
                                            <p className="text-xs text-slate-400 font-normal">Pour : {tx.recipient_name}</p>
                                        </td>

                                        {/* Montant principal */}
                                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                                            {tx.amount?.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">{tx.currency}</span>
                                        </td>

                                        {/* Commissions prélevées */}
                                        <td className="py-4 px-6 text-right text-emerald-600 font-semibold">
                                            +{tx.fees?.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{tx.currency}</span>
                                        </td>

                                        {/* Statut Badge */}
                                        <td className="py-4 px-6 text-center">
                                            {getStatusBadge(tx.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data?.meta && (
                        <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50/30">
              <span className="text-xs font-semibold text-slate-500">
                Page {data.meta.current_page} sur {data.meta.last_page}
              </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    Précédent
                                </button>
                                <button
                                    disabled={page === data.meta.last_page}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    Suivant
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}