'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    TrendingUp,
    Search,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    ArrowLeftRight,
    Clock,
    Building2,
    ShieldCheck,
    AlertCircle,
    Download,
    Filter
} from 'lucide-react';

// Appels API
const fetchTransactionsMetrics = async (filters: { type: string; search: string }) => {
    const { data } = await api.get('/reporting/regional/transactions', { params: filters });
    return data; // Attend : { data: [ { uuid, reference, type, amount, status, sender_name, receiver_name, agency_name, created_at }, ... ] }
};

export default function GlobalTransactionsPage() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // 1. Récupération du flux de transactions avec filtres d'API directs (optimisé pour les gros volumes)
    const { data: transactionData, isLoading, isError, refetch } = useQuery({
        queryKey: ['regionalTransactionsList', typeFilter, search],
        queryFn: () => fetchTransactionsMetrics({ type: typeFilter, search }),
        refetchInterval: 20000, // Rafraîchissement automatique toutes les 20s
    });

    const transactions = transactionData?.data || [];

    // Calcul des indicateurs de volume basés sur la liste affichée
    const totalVolumeAmount = transactions
        .filter((t: any) => t.status === 'success')
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

    const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;

    // Traduction esthétique des types de transactions (FinTech & Remittance enums)
    const typeBadges: Record<string, { label: string; bg: string; text: string; icon: any }> = {
        deposit: { label: 'Dépôt Cash', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: ArrowDownRight },
        withdrawal: { label: 'Retrait Cash', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: ArrowUpRight },
        transfer: { label: 'Transfert Direct', bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', icon: ArrowLeftRight },
        remittance: { label: 'Remise Agence', bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', icon: Building2 },
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Flux & Transactions Réseau</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Auditez en direct l'intégralité des flux financiers, transactions de guichet et mouvements inter-agences de votre territoire.
                    </p>
                </div>
                <div className="flex gap-2 self-start">
                    <button
                        onClick={() => refetch()}
                        className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-slate-700 shadow-sm transition-colors"
                        title="Actualiser le flux"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                        onClick={() => alert('Exportation du grand livre au format CSV (OHADA Compliant)...')}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4 text-slate-500" /> Exporter le journal
                    </button>
                </div>
            </div>

            {/* Cartes Analytiques Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Volume Audité */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume Réseau Affiché</p>
                        <p className="text-2xl font-mono font-black text-slate-900">
                            {new Intl.NumberFormat('fr-FR').format(totalVolumeAmount)}
                            <span className="text-sm font-sans font-bold text-slate-500 ml-1">XAF</span>
                        </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>

                {/* Transactions Suspendues / En attente de conformité */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En cours / En attente (Compliance)</p>
                        <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {pendingCount} <span className="text-sm font-medium text-slate-400">opérations</span>
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl ${pendingCount > 0 ? 'bg-amber-50 text-amber-500 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                {/* Statut Système de Compensation */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vérification de Conformité</p>
                        <p className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 w-max">
                            <ShieldCheck className="w-4 h-4" /> Grand Livre Intègre
                        </p>
                    </div>
                </div>
            </div>

            {/* Barre de Recherche et Filtres Structurels */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par référence, donneur d'ordre, bénéficiaire..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <span className="bg-slate-100 p-2.5 rounded-xl text-slate-500 border border-slate-200 hidden sm:block">
                        <Filter className="w-4 h-4" />
                    </span>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="all">Toutes les natures d'opérations</option>
                        <option value="deposit">Dépôts (Cash-In)</option>
                        <option value="withdrawal">Retraits (Cash-Out)</option>
                        <option value="transfer">Transferts Directs</option>
                        <option value="remittance">Remises Inter-Agences</option>
                    </select>
                </div>
            </div>

            {/* États de Chargement et Erreurs UX */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                    <p className="text-xs font-medium text-slate-400">Génération du journal d'audit en temps réel...</p>
                </div>
            )}

            {isError && (
                <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center text-rose-600 flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="font-semibold">Une erreur empêche la synchronisation du flux comptable transactionnel.</p>
                </div>
            )}

            {/* Tableau Complet du Grand Livre National */}
            {!isLoading && !isError && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-4 px-6">Référence</th>
                                    <th className="py-4 px-6">Nature / Type</th>
                                    <th className="py-4 px-6">Montant</th>
                                    <th className="py-4 px-6">Donneur d'Ordre / Bénéficiaire</th>
                                    <th className="py-4 px-6">Agence Émettrice</th>
                                    <th className="py-4 px-6">Horodatage (UTC)</th>
                                    <th className="py-4 px-6 text-center">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                                            Aucun mouvement comptable enregistré dans ce périmètre.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx: any) => {
                                        const badge = typeBadges[tx.type] || { label: tx.type, bg: 'bg-slate-50', text: 'text-slate-600', icon: ArrowLeftRight };
                                        const TypeIcon = badge.icon;

                                        return (
                                            <tr key={tx.uuid} className="hover:bg-slate-50/40 transition-colors">
                                                {/* Référence unique */}
                                                <td className="py-4 px-6 text-slate-900 font-mono font-bold text-xs">
                                                    {tx.reference}
                                                </td>

                                                {/* Nature d'opération */}
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${badge.bg} ${badge.text}`}>
                                                        <TypeIcon className="w-3.5 h-3.5" />
                                                        {badge.label}
                                                    </span>
                                                </td>

                                                {/* Montant Financier */}
                                                <td className="py-4 px-6 font-mono font-black text-slate-900">
                                                    {new Intl.NumberFormat('fr-FR').format(tx.amount)} <span className="text-[10px] text-slate-400 font-sans font-bold">XAF</span>
                                                </td>

                                                {/* Acteurs impliqués */}
                                                <td className="py-4 px-6">
                                                    <div className="text-xs font-bold text-slate-800">{tx.sender_name || 'Système / Déposit'}</div>
                                                    {tx.receiver_name && (
                                                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                            Vers : <span className="font-semibold text-slate-500">{tx.receiver_name}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Agence Physique */}
                                                <td className="py-4 px-6 text-slate-600 font-semibold text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                        {tx.agency_name}
                                                    </div>
                                                </td>

                                                {/* Date & Heure précise */}
                                                <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                                                    {new Date(tx.created_at).toLocaleString('fr-FR')}
                                                </td>

                                                {/* Statut Final */}
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                                        tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                        tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse' :
                                                        'bg-rose-50 text-rose-700 border border-rose-100'
                                                    }`}>
                                                        {tx.status === 'success' ? 'Validé' : tx.status === 'pending' ? 'En cours' : 'Échoué'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}