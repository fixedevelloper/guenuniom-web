'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowDownLeft, ArrowUpRight, Check, X,
    RefreshCw, ShieldAlert, FileSpreadsheet, Building2, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import {api} from "../../../lib/api";

export default function CountryAdminVaultRequestsPage() {
    const queryClient = useQueryClient();
    const [rejectionNotes, setRejectionNotes] = useState<{ [key: number]: string }>({});
    const [statusFilter, setStatusFilter] = useState<string>('');

    // 1. Charger les demandes des agences en attente d'approbation nationale
    const { data: pendingRequests, isLoading: isLoadingPending } = useQuery({
        queryKey: ['countryTransfersPending'],
        queryFn: async () => {
            const { data } = await api.get('/vault-transfers/pending');
            // Filtrage de sécurité : n'afficher que le niveau national (Agency -> Country)
            return data.data?.filter((r: any) => r.target_type.includes('Country')) || [];
        }
    });

    // 2. Charger l'historique national complet (Pagrainé)
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['countryTransfersHistory', statusFilter],
        queryFn: async () => {
            const url = statusFilter ? `/vault-transfers/history?status=${statusFilter}` : '/vault-transfers/history';
            const { data } = await api.get(url);
            return data.data;
        }
    });

    // 3. Mutation pourLiquider (Approuver) ou Rejeter le mouvement de fonds d'une agence
    const processMutation = useMutation({
        mutationFn: async ({ id, action, reason }: { id: number; action: 'approve' | 'reject'; reason?: string }) => {
            const { data } = await api.post(`/vault-transfers/${id}/process`, {
                action,
                rejection_reason: reason
            });
            return data;
        },
        onSuccess: (data) => {
            toast.success("Mouvement liquidé", { description: data.message });
            queryClient.invalidateQueries({ queryKey: ['countryTransfersPending'] });
            queryClient.invalidateQueries({ queryKey: ['countryTransfersHistory'] });
            queryClient.invalidateQueries({ queryKey: ['nationalVaultBalance'] }); // Rafraîchir le solde du coffre pays
        },
        onError: (error: any) => {
            toast.error("Erreur d'arbitrage", {
                description: error?.response?.data?.message || "L'opération comptable a échoué."
            });
        }
    });

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-7">

            {/* Header / Titre de page National */}
            <div className="border-b pb-5 flex items-center gap-3">
                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-md">
                    <Globe className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Régulation des Trésoreries Nationales</h1>
                    <p className="text-xs text-slate-500">Arbitrage financier des demandes d'approvisionnement et validation des versements bancaires des agences.</p>
                </div>
            </div>

            {/* 1. SECTIONS DES DEMANDES EN ATTENTE (Alerte Visuelle Forte) */}
            <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                    Flux inter-agences en attente d'autorisation ({pendingRequests?.length || 0})
                </h2>

                {isLoadingPending ? (
                    <div className="flex items-center justify-center h-32 bg-white border rounded-2xl text-slate-400 text-sm">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Analyse des demandes réseau en cours...
                    </div>
                ) : pendingRequests?.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400 italic">
                        Aucun mouvement de fonds d'agence en attente d'arbitrage national.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {pendingRequests?.map((req: any) => (
                            <div key={req.id} className="bg-white border-2 border-slate-100 hover:border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 transition-all">

                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-xl ${req.type === 'supply' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Agence : {req.requester?.name || 'Inconnue'}</h3>
                                            <p className="text-xs text-slate-500">Initié par le Superviseur : <span className="font-semibold text-slate-700">{req.creator?.username}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-base font-mono font-black text-slate-900 block">{formatMoney(req.amount)}</span>
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${req.type === 'supply' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {req.type === 'supply' ? 'Demande de dotation' : 'Dépôt de surplus'}
                                        </span>
                                    </div>
                                </div>

                                {req.notes && (
                                    <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 border-l-4 border-slate-400 italic">
                                        " {req.notes} "
                                    </div>
                                )}

                                {/* Formulaire d'arbitrage National */}
                                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                                    <input
                                        type="text"
                                        placeholder="Spécifier le motif obligatoire en cas de rejet..."
                                        value={rejectionNotes[req.id] || ''}
                                        onChange={(e) => setRejectionNotes({ ...rejectionNotes, [req.id]: e.target.value })}
                                        className="flex-1 px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                                    />
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => processMutation.mutate({ id: req.id, action: 'reject', reason: rejectionNotes[req.id] })}
                                            disabled={processMutation.isPending || !rejectionNotes[req.id]}
                                            className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors disabled:opacity-40"
                                        >
                                            <X className="w-3.5 h-3.5" /> Rejeter
                                        </button>
                                        <button
                                            onClick={() => processMutation.mutate({ id: req.id, action: 'approve' })}
                                            disabled={processMutation.isPending}
                                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Valider & Ajuster les Coffres
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. JOURNAL DE TRÉSORERIE NATIONAL (Grand Livre Consolide) */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            Grand Livre Consolidé des Flux Nationaux
                        </h2>
                        <p className="text-xs text-slate-400">Piste d'audit légale et horodatée de l'ensemble des écritures des filiales du pays.</p>
                    </div>

                    {/* Filtres de statut pour le Reporting */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs px-3 py-1.5 border rounded-xl bg-white font-medium focus:outline-none"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="approved">Validés & Exécutés</option>
                        <option value="rejected">Refusés / Rejetés</option>
                    </select>
                </div>

                {isLoadingHistory ? (
                    <div className="p-12 text-center text-slate-400 text-sm">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> Chargement des écritures comptables...
                    </div>
                ) : historyData?.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm italic">Aucun mouvement archivé dans le journal national.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3.5 px-5">Date Arbitrage</th>
                                <th className="py-3.5 px-5">Agence Émettrice</th>
                                <th className="py-3.5 px-5">Sens du flux</th>
                                <th className="py-3.5 px-5">Montant Liquidé</th>
                                <th className="py-3.5 px-5">Statut Pivot</th>
                                <th className="py-3.5 px-5">Décideur (Admin)</th>
                                <th className="py-3.5 px-5">Bordereau / Notes</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y text-xs text-slate-700">
                            {historyData?.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="py-3.5 px-5 font-mono text-slate-500">
                                        {item.processed_at ? new Date(item.processed_at).toLocaleString('fr-FR') : 'N/A'}
                                    </td>
                                    <td className="py-3.5 px-5 font-bold text-slate-900">
                                        {item.requester?.name || 'Agence externe'}
                                    </td>
                                    <td className="py-3.5 px-5">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                                                item.type === 'supply' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {item.type === 'supply' ? 'Dotation ➔ Agence' : 'Encaissement ➔ Pays'}
                                            </span>
                                    </td>
                                    <td className="py-3.5 px-5 font-mono font-extrabold text-slate-900">
                                        {formatMoney(item.amount)}
                                    </td>
                                    <td className="py-3.5 px-5">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {item.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                                            </span>
                                    </td>
                                    <td className="py-3.5 px-5 text-slate-500 font-medium">
                                        {item.validator?.username || 'Système'}
                                    </td>
                                    <td className="py-3.5 px-5 max-w-xs truncate text-slate-500">
                                        {item.status === 'rejected' ? (
                                            <span className="text-rose-600 font-bold">Refus : {item.rejection_reason}</span>
                                        ) : (
                                            item.notes || <span className="text-slate-300 italic">Aucune mention</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}