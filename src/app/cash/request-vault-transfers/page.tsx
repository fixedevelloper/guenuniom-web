'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowDownLeft, ArrowUpRight, Clock,
    CheckCircle2, XCircle, FileText, Plus, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {api} from "../../../lib/api";
import VaultTransferModal from "../../../components/guards/VaultTransferModal";

export default function CashierVaultRequestsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 1. Charger uniquement les demandes de ce caissier en attente de validation par le superviseur
    const { data: pendingRequests, isLoading: isLoadingPending } = useQuery({
        queryKey: ['cashierTransfersPending'],
        queryFn: async () => {
            const { data } = await api.get('/vault-transfers/pending');
            // Côté API, le scope caissier filtre déjà pour ne renvoyer que SES demandes
            return data.data;
        }
    });

    // 2. Charger l'historique personnel du caissier (Flux approuvés ou rejetés)
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['cashierTransfersHistory'],
        queryFn: async () => {
            const { data } = await api.get('/vault-transfers/history');
            return data.data;
        }
    });

    // 3. Mutation pour annuler une demande tant qu'elle est en attente
    const cancelMutation = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/vault-transfers/${id}/cancel`);
            return data;
        },
        onSuccess: (data) => {
            toast.success("Demande annulée", { description: data.message || "La demande a été retirée." });
            queryClient.invalidateQueries({ queryKey: ['cashierTransfersPending'] });
        },
        onError: (error: any) => {
            toast.error("Erreur", { description: error?.response?.data?.message || "Impossible d'annuler cette demande." });
        }
    });

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">

            {/* En-tête de la page */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Demandes de Fonds & Versements</h1>
                    <p className="text-sm text-slate-500">Gérez vos besoins de liquidités et vos décharges d'excédents de caisse avec votre superviseur.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Faire une demande
                </button>
            </div>

            {/* 1. SECTION : DEMANDES EN ATTENTE DE VALIDATION */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Demandes en attente d'approbation ({pendingRequests?.length || 0})
                </h2>

                {isLoadingPending ? (
                    <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement de vos requêtes...
                    </div>
                ) : pendingRequests?.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed rounded-2xl p-6 text-center text-sm text-slate-400 italic">
                        Aucune demande en attente. Votre caisse est à jour.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingRequests?.map((req: any) => (
                            <div key={req.id} className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${req.type === 'supply' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {req.type === 'supply' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">
                                                {req.type === 'supply' ? "Demande de Dotation (Entrée)" : "Déclaration de Versement (Sortie)"}
                                            </h4>
                                            <p className="text-xs text-slate-400">Vers le coffre de l'agence</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-mono font-bold text-slate-900">{formatMoney(req.amount)}</span>
                                </div>

                                {req.notes && (
                                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic border-l-2 border-slate-300">
                                        "{req.notes}"
                                    </p>
                                )}

                                <div className="flex items-center justify-between border-t pt-2 mt-1">
                                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                        Attente Superviseur
                                    </span>
                                    <button
                                        onClick={() => cancelMutation.mutate(req.id)}
                                        disabled={cancelMutation.isPending}
                                        className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors disabled:opacity-50"
                                    >
                                        Annuler la demande
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. SECTION : HISTORIQUE INDIVIDUEL DU CAISSIER */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Mon historique des mouvements</h2>
                        <p className="text-xs text-slate-400">Historique complet de vos demandes traitées.</p>
                    </div>
                </div>

                {isLoadingHistory ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Chargement de l'historique...
                    </div>
                ) : historyData?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                        Aucun mouvement archivé pour votre session de caisse.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Type de flux</th>
                                <th className="py-3 px-4">Montant</th>
                                <th className="py-3 px-4">Statut</th>
                                <th className="py-3 px-4">Note / Justification</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y text-xs text-slate-700">
                            {historyData?.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                                    <td className="py-3 px-4 font-mono text-slate-500">
                                        {item.processed_at ? new Date(item.processed_at).toLocaleDateString('fr-FR') : new Date(item.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            {item.type === 'supply' ? (
                                                <span className="text-emerald-600 flex items-center gap-1"><ArrowDownLeft className="w-3.5 h-3.5" /> Dotation</span>
                                            ) : (
                                                <span className="text-amber-600 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> Versement</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                        {formatMoney(item.amount)}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.status === 'approved' ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3" /> Transféré
                                                </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-rose-200">
                                                    <XCircle className="w-3 h-3" /> Rejeté
                                                </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                                        {item.status === 'rejected' ? (
                                            <span className="text-rose-600 font-medium">Refus : {item.rejection_reason}</span>
                                        ) : (
                                            item.notes || <span className="text-slate-300 italic">Aucune note</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de demande partagé */}
            <VaultTransferModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                userRole="cashier" // Force automatiquement le niveau 'till_to_agency' dans le modal
            />
        </div>
    );
}