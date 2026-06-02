'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Search,
    RefreshCw,
    ShieldAlert,
    ArrowDownLeft,
    ArrowUpRight,
    Filter,
    Calendar,
    FileSpreadsheet,
    Eye
} from 'lucide-react';

export default function AgencyTransactionsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedTx, setSelectedTx] = useState<any>(null);

    // 1. Extraction du registre des transactions de l'agence
    const { data: txData, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['agencyTransactions', search, statusFilter, typeFilter],
        queryFn: async () => {
            const { data } = await api.get('/agency/transactions', {
                params: {
                    search,
                    status: statusFilter,
                    type: typeFilter
                }
            });
            return data;
        }
    });

    const transactions = txData?.data || [];

    // Formatage des montants aux standards XAF
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' XAF';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* EN-TÊTE ACTIONNABLE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registre des Transactions</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Historique, traçabilité et états d'audit de l'ensemble des dépôts et retraits de la succursale.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
                        Sychroniser
                    </button>
                    <button
                        onClick={() => alert('Génération du rapport Excel (normes OHADA)...')}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Exporter le Journal
                    </button>
                </div>
            </div>

            {/* BARRE DE FILTRAGE AVANCÉE */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Recherche par texte libre */}
                <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Rechercher par référence, téléphone, code guichet..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Filtre par Type */}
                <div className="relative">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700"
                    >
                        <option value="all">Tous les flux</option>
                        <option value="cash_in">Dépôts (Cash-In)</option>
                        <option value="cash_out">Retraits (Cash-Out)</option>
                        <option value="merchant_payment">Paiements Marchand</option>
                    </select>
                </div>

                {/* Filtre par Statut */}
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-semibold text-slate-700"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="success">Validés (Succès)</option>
                        <option value="pending">En attente</option>
                        <option value="failed">Échoués / Annulés</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU CENTRAL DU LIVRE DE CAISSE */}
            {isLoading ? (
                <div className="text-center py-12 text-xs font-semibold text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" /> Chargement du grand livre...
                </div>
            ) : isError ? (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center text-rose-600 text-sm">
                    <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-rose-500" /> Échec de la récupération des transactions d'agence.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-4 px-6">Date & Référence</th>
                                    <th className="py-4 px-6">Type d'opération</th>
                                    <th className="py-4 px-6">Tiers (Client/Bénéficiaire)</th>
                                    <th className="py-4 px-6">Guichet / Caisse</th>
                                    <th className="py-4 px-6">Montant Brut</th>
                                    <th className="py-4 px-6 text-center">Statut</th>
                                    <th className="py-4 px-6 text-right">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-xs text-slate-400">Aucun mouvement enregistré pour cette sélection.</td>
                                    </tr>
                                ) : (
                                    transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                                            {/* Date & Référence */}
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-slate-900 block">{tx.reference}</span>
                                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                                    <Calendar className="w-3 h-3" /> {tx.created_at_formatted}
                                                </span>
                                            </td>

                                            {/* Type de flux */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg border ${
                                                        tx.transaction_type === 'cash_in' 
                                                            ? 'bg-green-50 border-green-100 text-green-600' 
                                                            : 'bg-amber-50 border-amber-100 text-amber-600'
                                                    }`}>
                                                        {tx.transaction_type === 'cash_in' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className="text-xs uppercase font-bold tracking-wide font-mono">
                                                        {tx.transaction_type}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Tiers concerné */}
                                            <td className="py-4 px-6">
                                                <span className="text-slate-800 block">{tx.customer_name || 'Client anonyme'}</span>
                                                <span className="text-xs font-mono text-slate-400">{tx.customer_phone || 'N/A'}</span>
                                            </td>

                                            {/* Code de la caisse d'exécution */}
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-mono font-bold uppercase">
                                                    {tx.till_code || 'GUI-GLOBAL'}
                                                </span>
                                            </td>

                                            {/* Montant Brut */}
                                            <td className="py-4 px-6 font-mono text-base font-black text-slate-900">
                                                {formatCurrency(tx.amount)}
                                            </td>

                                            {/* Statut de la transaction */}
                                            <td className="py-4 px-6 text-center">
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
        tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
            : tx.status === 'pending'
            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
    }`}>
        {tx.status === 'success'
            ? 'Validé'
            : tx.status === 'paid'
                ? 'Payé'
                : tx.status === 'completed'
                    ? 'Terminé'
                    : tx.status === 'pending'
                        ? 'En cours'
                        : 'Échoué'}
    </span>
                                            </td>

                                            {/* Lien vers un détail d'audit complet */}
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="Inspecter l'écriture comptable"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PANNEAU LATÉRAL (DRAWER) : INSPECTEUR DE TRANSACTION */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Ticket d'Audit Transactionnel</h2>
                                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">{selectedTx.reference}</span>
                                </div>
                                <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-xl">Fermer</button>
                            </div>

                            {/* Ticket financier résumé */}
                            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-center space-y-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Montant Net Encaissé / Déc穩定</span>
                                <span className="text-2xl font-black text-slate-900 font-mono block">{formatCurrency(selectedTx.amount)}</span>
                                <span className="text-[10px] text-slate-400 font-medium block">Frais inclus : {formatCurrency(selectedTx.fees_amount || 0)}</span>
                            </div>

                            {/* Caractéristiques d'audit */}
                            <div className="space-y-3 text-xs">
                                <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b pb-1">Traçabilité système</h3>
                                <div className="flex justify-between py-1.5 border-b border-dashed"><span className="text-slate-500 font-medium">Date de l'opération :</span><span className="font-mono font-semibold">{selectedTx.created_at_formatted}</span></div>
                                <div className="flex justify-between py-1.5 border-b border-dashed"><span className="text-slate-500 font-medium">Guichetier émetteur :</span><span className="font-semibold">{selectedTx.cashier_name || 'N/A'} (code: {selectedTx.till_code})</span></div>
                                <div className="flex justify-between py-1.5 border-b border-dashed"><span className="text-slate-500 font-medium">Mode de versement :</span><span className="font-semibold uppercase font-mono text-[11px]">{selectedTx.payment_method || 'Espèces'}</span></div>

                                <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b pb-1 pt-3">Informations Partenaire</h3>
                                <div className="flex justify-between py-1.5 border-b border-dashed"><span className="text-slate-500 font-medium">Nom complet :</span><span className="font-semibold">{selectedTx.customer_name || 'Client anonyme'}</span></div>
                                <div className="flex justify-between py-1.5 border-b border-dashed"><span className="text-slate-500 font-medium">Téléphone :</span><span className="font-mono font-semibold">{selectedTx.customer_phone || 'N/A'}</span></div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <button
                                onClick={() => {
                                    alert(`Impression du reçu réglementaire pour la référence ${selectedTx.reference}`);
                                }}
                                className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 font-semibold rounded-xl text-sm transition-all"
                            >
                                Réimprimer le Reçu de Guichet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}