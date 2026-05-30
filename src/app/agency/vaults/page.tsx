'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    ShieldAlert,
    X,
    History,
    TrendingUp,
    Calendar,
    CheckCircle2,
    SlidersHorizontal,
    Monitor
} from 'lucide-react';

export default function AgencyVaultsPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Types alignés sur les enums et casts de ton modèle CashOperation
    const [requestType, setRequestType] = useState<'cash_in' | 'cash_out' | 'adjustment'>('cash_in');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // 1. Récupération de l'état du coffre-fort d'agence
    const { data: vaultData, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['agencyVaultData'],
        queryFn: async () => {
            const { data } = await api.get('/agency/vaults');
            return data;
        }
    });

    // 2. Mutation pour soumettre la transaction
    const vaultTransactionMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/agency/vaults/transaction', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agencyVaultData'] });
            queryClient.invalidateQueries({ queryKey: ['agencyDashboardStats'] });
            setIsModalOpen(false);
            setAmount('');
            setDescription('');
        },
        onError: (error: any) => {
            alert(error?.response?.data?.message || "Erreur lors de la validation du mouvement.");
        }
    });

    const handleVaultTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(amount) <= 0) {
            alert("Le montant doit être supérieur à 0.");
            return;
        }
        if (requestType === 'cash_out' && Number(amount) > (vaultData?.data?.vault_balance || 0)) {
            alert("Le montant du retrait dépasse le solde disponible dans le coffre central.");
            return;
        }

        vaultTransactionMutation.mutate({
            type: requestType,
            amount: Number(amount),
            description
        });
    };

    if (isLoading) {
        return (
            <div className="text-center py-12 text-xs font-semibold text-slate-400 flex flex-col items-center gap-2 justify-center min-h-[60vh]">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" /> Chargement du coffre d'agence...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 text-center text-rose-600 bg-rose-50/50 border border-rose-100 rounded-2xl m-6">
                <ShieldAlert className="w-8 h-8 mx-auto text-rose-500 mb-2" /> Impossible d'accéder au registre du coffre central.
            </div>
        );
    }

    const info = vaultData?.data || { vault_balance: 0, history: [] };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* EN-TÊTE ACTIONNABLE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coffre-fort Central</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Suivi de la liquidité de la succursale, mouvements de caisse et ajustements comptables.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all"
                    >
                        <TrendingUp className="w-4 h-4" /> Passer une opération
                    </button>
                </div>
            </div>

            {/* CARTES DE STATUT (KPI) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Solde du Coffre Central */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Encaisse Disponible (En Coffre)</span>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                            {new Intl.NumberFormat('fr-FR').format(info.vault_balance)} <span className="text-xs font-sans font-bold text-slate-400">XAF</span>
                        </span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>

                {/* Statut Réglementaire */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Conformité Comptable</span>
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Clôtures de caisses synchronisées (OHADA)
                        </span>
                    </div>
                </div>
            </div>

            {/* GRAND LIVRE DU COFFRE FORT */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-bold text-slate-800">Grand Livre des Écritures de Coffre</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                                <th className="py-3 px-6">Date / Heure</th>
                                <th className="py-3 px-6">Flux</th>
                                <th className="py-3 px-6">Source / Caisse</th>
                                <th className="py-3 px-6">Description / Référence</th>
                                <th className="py-3 px-6">Auteur validation</th>
                                <th className="py-3 px-6 text-right">Montant Brut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {info.history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-xs text-slate-400">Aucun mouvement comptabilisé sur le coffre-fort central.</td>
                                </tr>
                            ) : (
                                info.history.map((log: any) => (
                                    <tr key={log.id || log.uuid} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="py-3 px-6 text-xs text-slate-500 font-mono">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {log.date}</span>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase font-mono ${
                                                log.type === 'cash_in' || log.type === 'opening'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                    : log.type === 'adjustment'
                                                    ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}>
                                                {log.direction === 'in' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                <Monitor className="w-3 h-3 text-slate-400" />
                                                {log.till_code}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className="block font-semibold text-slate-900 text-xs max-w-xs truncate">{log.description}</span>
                                        </td>
                                        <td className="py-3 px-6 text-xs text-slate-600 font-bold">{log.manager_name}</td>
                                        <td className="py-3 px-6 font-mono font-black text-slate-900 text-right">
                                            {log.direction === 'out' ? '-' : '+'}{new Intl.NumberFormat('fr-FR').format(log.amount)} F
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL : TRANSACTION DE COFFRE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl border shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h2 className="text-base font-bold text-slate-900">Nouvelle écriture de coffre</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleVaultTransaction} className="space-y-4">

                            {/* Sélecteur de type d'opération basé sur l'Enum Laravel */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nature de l'écriture</label>
                                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setRequestType('cash_in')}
                                        className={`py-2 text-[11px] font-bold rounded-lg transition-all ${requestType === 'cash_in' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Entrée (Cash In)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRequestType('cash_out')}
                                        className={`py-2 text-[11px] font-bold rounded-lg transition-all ${requestType === 'cash_out' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Sortie (Cash Out)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRequestType('adjustment')}
                                        className={`py-2 text-[11px] font-bold rounded-lg transition-all ${requestType === 'adjustment' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Ajustement
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Montant global (XAF)</label>
                                <input type="number" required min="1" placeholder="Entrez le montant" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono font-bold" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Justification & Commentaires</label>
                                <textarea rows={3} required placeholder="Spécifiez le motif exact (ex: Réapprovisionnement, Écart de caisse régularisé, Dépôt banque...)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50">Annuler</button>
                                <button type="submit" disabled={vaultTransactionMutation.isPending} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2">
                                    {vaultTransactionMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                                    Valider l'écriture
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}