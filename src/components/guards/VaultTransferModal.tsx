'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, RefreshCw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// --- Types des Props pour garantir la robustesse ---
interface VaultTransferModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    userRole: 'supervisor' | 'cashier' | string;
}

interface TransferPayload {
    level: 'agency_to_country' | 'till_to_agency';
    type: 'supply' | 'deposit';
    amount: number;
    notes: string;
}

export default function VaultTransferModal({ isModalOpen, setIsModalOpen, userRole }: VaultTransferModalProps) {
    const queryClient = useQueryClient();

    // États locaux du formulaire
    const [flowType, setFlowType] = useState<'supply' | 'deposit'>('supply');
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    // Détermination automatique du niveau selon le rôle
    const level = userRole === 'supervisor' ? 'agency_to_country' : 'till_to_agency';

    // Mutation unifiée avec gestion stricte
    const vaultTransferMutation = useMutation({
        mutationFn: async (payload: TransferPayload) => {
            const { data } = await api.post('/vault-transfers', payload);
            return data;
        },
        onSuccess: (data) => {
            toast.success("Demande transmise", {
                description: data.message || "Votre demande de trésorerie a été envoyée pour validation."
            });

            // Rafraîchir les requêtes du dashboard parent
            queryClient.invalidateQueries({ queryKey: ['vaultTransfersPending'] });
            queryClient.invalidateQueries({ queryKey: ['vaultTransfersHistory'] });
            queryClient.invalidateQueries({ queryKey: ['agencyVaultData'] });

            // Réinitialisation complète de l'état local
            handleClose();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Impossible de soumettre la demande.";
            toast.error("Échec de l'opération", { description: errorMessage });
        }
    });

    // Fonction de nettoyage à la fermeture
    const handleClose = () => {
        if (vaultTransferMutation.isPending) return; // Sécurité : interdit la fermeture pendant le traitement
        setIsModalOpen(false);
        setAmount('');
        setNotes('');
        setFlowType('supply');
    };

    // Gestionnaire de saisie du montant (autorise uniquement les chiffres)
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Supprime tout ce qui n'est pas un chiffre (gère les espaces ou lettres résiduelles)
        const rawValue = e.target.value.replace(/\D/g, '');
        setAmount(rawValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const parsedAmount = parseInt(amount, 10);

        // Validation comptable stricte côté client
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Format de montant invalide", {
                description: "Veuillez entrer un montant entier positif supérieur à 0."
            });
            return;
        }

        if (!notes.trim()) {
            toast.error("Justification manquante", {
                description: "La note ou justification réglementaire est obligatoire."
            });
            return;
        }

        // Soumission sécurisée
        vaultTransferMutation.mutate(
            {
                level,
                type: flowType,
                amount: parsedAmount,
                notes: notes.trim()
            },
            {
                // On ferme le modal UNIQUEMENT si le serveur a validé le transfert
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['cashierTransfersPending'] });
                    setIsModalOpen(false);
                    // Optionnel : un petit toast de succès fait toujours plaisir
                    toast.success("Transfert validé avec succès");
                },
                onError: (error) => {
                    // Optionnel : l'erreur est souvent gérée globalement,
                    // mais on s'assure ici que le modal RESTE ouvert pour que l'utilisateur puisse corriger
                    toast.error("Échec du transfert", {
                        description: error.message
                    });
                }
            }
        );
    };

    // Formatage dynamique pour l'affichage d'aide visuelle (ex: 1500000 -> 1 500 000 XAF)
    const previewFormattedMoney = (value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(num);
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            {/* Arrière-plan cliquable désactivé si chargement en cours */}
            <div className="absolute inset-0" onClick={handleClose} />

            <div className="bg-white w-full max-w-md p-6 rounded-2xl border shadow-xl space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-150">

                {/* En-tête */}
                <div className="flex items-center justify-between border-b pb-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Demande de mouvements de fonds</h2>
                        <p className="text-xs text-slate-500">
                            Niveau : <span className="font-semibold text-slate-700">{level === 'agency_to_country' ? 'Agence ➔ Direction Nationale' : 'Guichet ➔ Coffre Agence'}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={vaultTransferMutation.isPending}
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Sélecteur de type de flux */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nature du flux</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                disabled={vaultTransferMutation.isPending}
                                onClick={() => setFlowType('supply')}
                                className={`py-2.5 px-3 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                                    flowType === 'supply'
                                        ? 'bg-white text-emerald-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                Approvisionnement (Supply)
                            </button>
                            <button
                                type="button"
                                disabled={vaultTransferMutation.isPending}
                                onClick={() => setFlowType('deposit')}
                                className={`py-2.5 px-3 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                                    flowType === 'deposit'
                                        ? 'bg-white text-amber-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Versement / Décharge (Deposit)
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 px-1 pt-0.5 transition-all">
                            {flowType === 'supply'
                                ? 'Vous demandez des liquidités pour augmenter votre encaisse.'
                                : 'Vous reversez un excédent de fonds vers le niveau supérieur.'}
                        </p>
                    </div>

                    {/* Champ Montant Réorganisé */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Montant requis (XAF)</label>
                            {amount && (
                                <span className="text-xs font-mono font-bold text-slate-500 animate-in fade-in">
                                    {previewFormattedMoney(amount)}
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            disabled={vaultTransferMutation.isPending}
                            placeholder="Entrez le montant entier (ex: 2500000)"
                            value={amount}
                            onChange={handleAmountChange}
                            className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:opacity-50 transition-all"
                        />
                    </div>

                    {/* Champ Justification / Notes */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes & Justification réglementaire</label>
                        <textarea
                            rows={3}
                            required
                            disabled={vaultTransferMutation.isPending}
                            placeholder={flowType === 'supply' ? "Spécifiez le besoin (ex: Rupture imminente, rush du matin...)" : "Spécifiez la référence (ex: Bordereau de versement N°XXX...)"}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:opacity-50 transition-all"
                        />
                    </div>

                    {/* Actions de validation */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={vaultTransferMutation.isPending}
                            className="flex-1 py-2 border text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={vaultTransferMutation.isPending || !amount || !notes}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                        >
                            {vaultTransferMutation.isPending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Traitement...
                                </>
                            ) : (
                                "Soumettre la demande"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}