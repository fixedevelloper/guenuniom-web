'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowDownLeft, ArrowUpRight, Check, X,
    RefreshCw, Clock, AlertCircle, FileText, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from "../../../lib/api";
import VaultTransferModal from "../../../components/guards/VaultTransferModal";

// --- Types et Interfaces Stricts ---
interface User {
    id: number;
    username: string;
    name?: string;
}

interface Requester {
    id: number;
    name: string;
}

interface VaultTransfer {
    id: number;
    type: 'supply' | 'clearance'; // supply = besoin de cash, clearance = versement excédent
    target_type: string;
    requester_type: string;
    amount: number;
    notes?: string;
    rejection_reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    processed_at?: string;
    creator?: User;
    requester?: Requester;
    validator?: User;
}

interface MutationParams {
    id: number;
    action: 'approve' | 'reject';
    reason?: string;
}

export default function SupervisorVaultRequestsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [rejectionNotes, setRejectionNotes] = useState<{ [key: number]: string }>({});
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    // État local pour suivre précisément quel ID est en cours de traitement
    const [processingId, setProcessingId] = useState<number | null>(null);

    // 1. Charger les demandes en attente
    const { data: pendingRequests, isLoading: isLoadingPending } = useQuery<VaultTransfer[]>({
        queryKey: ['vaultTransfersPending'],
        queryFn: async () => {
            const { data } = await api.get('/vault-transfers/pending');
            return data.data;
        }
    });

    // 2. Charger l'historique complet
    const { data: historyData, isLoading: isLoadingHistory } = useQuery<VaultTransfer[]>({
        queryKey: ['vaultTransfersHistory'],
        queryFn: async () => {
            const { data } = await api.get('/vault-transfers/history');
            return data.data;
        }
    });

    // 3. Mutation pour traiter une demande (Approuver/Rejeter)
    const processMutation = useMutation({
        mutationFn: async ({ id, action, reason }: MutationParams) => {
            setProcessingId(id); // Verrouille l'ID UI sélectionné
            const { data } = await api.post(`/vault-transfers/${id}/process`, {
                action,
                rejection_reason: reason?.trim()
            });
            return { data, id };
        },
        onSuccess: ({ data, id }) => {
            toast.success("Opération enregistrée", { description: data.message });

            // Nettoyage de la note de refus pour cet ID
            setRejectionNotes(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });

            // Rafraîchissement des caches
            queryClient.invalidateQueries({ queryKey: ['vaultTransfersPending'] });
            queryClient.invalidateQueries({ queryKey: ['vaultTransfersHistory'] });
            queryClient.invalidateQueries({ queryKey: ['agencyVaultData'] });
        },
        onError: (error: any) => {
            toast.error("Échec du traitement", {
                description: error?.response?.data?.message || "Une erreur est survenue."
            });
        },
        onSettled: () => {
            setProcessingId(null); // Libère le verrou de l'UI
        }
    });

    // Filtrage des requêtes selon l'onglet
    const receivedRequests = pendingRequests?.filter((r) => r.target_type.includes('Agency')) || [];
    const sentRequests = pendingRequests?.filter((r) => r.requester_type.includes('Agency')) || [];

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Header d'action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Gestion des Flux de Trésorerie</h1>
                    <p className="text-sm text-slate-500">Supervisez les approvisionnements et pilotez les échanges avec la Direction Nationale.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Nouvelle demande réseau
                </button>
            </div>

            {/* Sélecteur d'onglets pour les demandes en attente */}
            <div className="space-y-4">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`pb-3 text-sm font-semibold transition-all border-b-2 px-4 ${activeTab === 'received' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Demandes des guichets à valider ({receivedRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`pb-3 text-sm font-semibold transition-all border-b-2 px-4 ${activeTab === 'sent' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Suivi de mes demandes au Pays ({sentRequests.length})
                    </button>
                </div>

                {/* 1. SECTION : TRAITEMENT DES DEMANDES EN ATTENTE */}
                {isLoadingPending ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Chargement des flux...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeTab === 'received' ? (
                            receivedRequests.length === 0 ? (
                                <p className="text-sm text-slate-400 italic col-span-2 py-4">Aucune demande de guichet en attente.</p>
                            ) : receivedRequests.map((req) => {
                                const isCurrentItemProcessing = processMutation.isPending && processingId === req.id;
                                const hasNoReason = !(rejectionNotes[req.id]?.trim());

                                return (
                                    <div key={req.id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 relative">

                                        {/* Overlay de chargement ciblé par carte */}
                                        {isCurrentItemProcessing && (
                                            <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                                                <RefreshCw className="w-6 h-6 animate-spin text-slate-900" />
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${req.type === 'supply' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {req.type === 'supply' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900">{req.requester?.name || 'Guichet'}</h3>
                                                    <p className="text-xs text-slate-500">Initié par {req.creator?.username} • <span className="font-mono">{formatMoney(req.amount)}</span></p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                                {req.type === 'supply' ? 'Besoin de cash' : 'Versement excédent'}
                                            </span>
                                        </div>

                                        {req.notes && (
                                            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border-l-2 border-slate-300 italic flex gap-1.5">
                                                <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                                                "{req.notes}"
                                            </div>
                                        )}

                                        {/* Actions de validation complexes */}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                            <input
                                                type="text"
                                                placeholder="Motif obligatoire si refus..."
                                                value={rejectionNotes[req.id] || ''}
                                                onChange={(e) => setRejectionNotes({ ...rejectionNotes, [req.id]: e.target.value })}
                                                className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none"
                                                disabled={processMutation.isPending}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => processMutation.mutate({ id: req.id, action: 'reject', reason: rejectionNotes[req.id] })}
                                                    disabled={processMutation.isPending || hasNoReason}
                                                    className="px-3 py-1.5 border text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs flex items-center gap-1 disabled:opacity-40 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" /> Rejeter
                                                </button>
                                                <button
                                                    onClick={() => processMutation.mutate({ id: req.id, action: 'approve' })}
                                                    disabled={processMutation.isPending}
                                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> Approuver et Décaisser
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            sentRequests.length === 0 ? (
                                <p className="text-sm text-slate-400 italic col-span-2 py-4">Vous n'avez aucune demande en attente auprès du pays.</p>
                            ) : sentRequests.map((req) => (
                                <div key={req.id} className="bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${req.type === 'supply' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                            <Clock className="w-4 h-4 animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{req.type === 'supply' ? "Demande d'approvisionnement coffre" : "Déclaration de versement national"}</h4>
                                            <p className="text-xs text-slate-500 font-mono">Montant : {formatMoney(req.amount)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            En attente Admin Pays
                                        </span>
                                        <p className="text-[10px] text-slate-400 mt-1">Créé le {new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* 2. SECTION : HISTORIQUE / ARCHIVES DES ARBITRAGES COMPTABLES */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b bg-slate-50/50">
                    <h2 className="text-sm font-bold text-slate-900">Journal d'audit de la trésorerie</h2>
                    <p className="text-xs text-slate-400">Consultation des derniers flux validés ou rejetés.</p>
                </div>

                {isLoadingHistory ? (
                    <div className="p-8 text-center text-slate-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Chargement du journal...</div>
                ) : historyData?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Aucun mouvement archivé dans le journal de cette agence.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Date Arbitrage</th>
                                <th className="py-3 px-4">Sens</th>
                                <th className="py-3 px-4">Acteurs Échanges</th>
                                <th className="py-3 px-4">Montant Transigé</th>
                                <th className="py-3 px-4">Statut Décision</th>
                                <th className="py-3 px-4">Justifications & Observations</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y text-xs text-slate-700">
                            {historyData?.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3.5 px-4 font-mono text-slate-500">
                                        {item.processed_at ? new Date(item.processed_at).toLocaleString('fr-FR') : 'N/A'}
                                    </td>
                                    <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-medium ${item.type === 'supply' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {item.type === 'supply' ? 'Approvisionnement' : 'Versement'}
                                            </span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <div className="font-semibold text-slate-900">{item.requester?.name || 'Inconnu'}</div>
                                        <div className="text-[10px] text-slate-400">Arbitré par {item.validator?.username || 'Système'}</div>
                                    </td>
                                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                        {formatMoney(item.amount)}
                                    </td>
                                    <td className="py-3.5 px-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                {item.status === 'approved' ? 'Validé & Liquidé' : 'Refusé'}
                                            </span>
                                    </td>
                                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={item.status === 'rejected' ? item.rejection_reason : item.notes}>
                                        {item.status === 'rejected' ? (
                                            <span className="text-rose-600 flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" /> Motif : {item.rejection_reason}</span>
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

            <VaultTransferModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                userRole="supervisor"
            />
        </div>
    );
}