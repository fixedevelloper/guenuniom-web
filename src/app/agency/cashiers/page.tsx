'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Users,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    ToggleLeft,
    ToggleRight,
    Search,
    RefreshCw,
    ShieldAlert,
    X,
    AlertTriangle,
    CheckCircle2,
    Plus
} from 'lucide-react';
import {toast} from "sonner";

export default function AgencyCashiersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);

    // États pour les formulaires
    const [selectedTill, setSelectedTill] = useState<any>(null);
    const [operationType, setOperationType] = useState<'credit' | 'debit'>('debit'); // debit = délestage (till -> coffre), credit = approvisionnement (coffre -> till)
    const [operationAmount, setOperationAmount] = useState('');
    const [operationDescription, setOperationDescription] = useState('');

    const [newTillData, setNewTillData] = useState({
        name: '',
        code: '',
        current_balance: '0'
    });

    // 1. Récupération de la liste des Tills de l'agence
    const { data: tillsData, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['agencyTillsList', search],
        queryFn: async () => {
            const { data } = await api.get('/agency/tills', { params: { search } });
            return data;
        }
    });

    const tillsList = tillsData?.data || [];

// 2. Mutation pour créer un nouveau Till
    const createTillMutation = useMutation({
        mutationFn: async (till: typeof newTillData) => {
            // Envoi des données typées au serveur
            const { data } = await api.post('/agency/tills', {
                name: till.name,
                code: till.code,
                // Sécurité Frontend : On s'assure d'envoyer un vrai float ou null au serveur
                current_balance: till.current_balance ? parseFloat(till.current_balance) : 0
            });
            return data;
        },
        onSuccess: (data) => {
            // 💡 UX : Utiliser de préférence le nom renvoyé par le serveur (nettoyé par le trim/strtoupper)
            const serverTillName = data?.data?.name || newTillData.name;

            toast.success("Initialisation réussie !", {
                description: `Le guichet "${serverTillName}" a été créé et sa dotation financière a été prélevée du coffre.`,
            });

            // Invalidation globale des requêtes pour rafraîchir les listes et les KPIs du coffre
            queryClient.invalidateQueries({ queryKey: ['agencyTillsList'] });
            queryClient.invalidateQueries({ queryKey: ['agencyVaultData'] }); // Pour mettre à jour le solde du coffre agence

            // Fermeture et reset du formulaire
            setIsModalOpen(false);
            setNewTillData({ name: '', code: '', current_balance: '0' });
        },
        onError: (error: any) => {
            const responseData = error?.response?.data;
            const status = error?.response?.status;

            // 1. Gestion des erreurs de validation de champs (Code 422 - ex: Code de caisse déjà pris)
            if (status === 422 && responseData?.errors) {
                const validationErrors = responseData.errors;

                // Si vous utilisez React Hook Form, vous pouvez mapper ici :
                // Object.keys(validationErrors).forEach((field) => setError(field, { message: validationErrors[field][0] }));

                toast.error("Formulaire invalide", {
                    description: validationErrors.code?.[0] || validationErrors.current_balance?.[0] || "Veuillez vérifier les informations saisies.",
                    duration: 6000,
                });
                return;
            }

            // 2. Gestion des erreurs de logique métier (Code 422 global - ex: Provision coffre insuffisante)
            // ou des erreurs système (Code 500) masquées par le serveur
            const errorMessage = responseData?.message || "Une erreur réseau ou technique empêche la création du guichet.";

            toast.error("Échec de la configuration", {
                description: errorMessage,
                duration: 6000,
            });

            console.error("[TILL-CREATION-FAULT] Détails :", error);
        }
    });

// 3. Mutation pour changer le statut d'un Till (is_active)
    const toggleTillMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
            const { data } = await api.patch(`/agency/tills/${id}/toggle`, { is_active });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['agencyTillsList'] });

            // Notification dynamique selon le nouvel état envoyé
            if (variables.is_active) {
                toast.success("Le guichet a été activé et est prêt pour les opérations.");
            } else {
                toast.warning("Le guichet a été suspendu temporairement.");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Impossible de modifier le statut de ce guichet.");
        }
    });

// 4. Mutation pour effectuer une CashOperation (Approvisionnement / Délestage)
    const cashOperationMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post(`/agency/tills/${selectedTill.id}/operation`, payload);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['agencyTillsList'] });
            queryClient.invalidateQueries({ queryKey: ['agencyDashboardStats'] });

            // Libellé personnalisé pour le type de mouvement en boîte de caisse
            const opLabel = variables.type === 'credit' ? 'Approvisionnement' : 'Délestage';
            toast.success(`${opLabel} effectué avec succès sur le guichet !`);

            setIsOperationModalOpen(false);
            setOperationAmount('');
            setOperationDescription('');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Erreur lors de l'opération de caisse.";

            toast.error("Échec de la transaction", {
                description: errorMessage,
                duration: 5000,
            });

            console.error("Détails de l'erreur de caisse :", error);
        }
    });

// Gestion des validations locales avant exécution de la mutation
    const handleCashOperation = (e: React.FormEvent) => {
        e.preventDefault();

        if (Number(operationAmount) <= 0) {
            // Changé en .warning pour une meilleure visibilité (Couleur ambre)
            toast.warning("Le montant de l'opération doit être strictement supérieur à 0.");
            return;
        }

        // Correction de la condition pour correspondre au type de flux du guichet
        if (operationType === 'debit' && Number(operationAmount) > selectedTill.current_balance) {
            // Changé en .error car c'est un blocage physique de solde insuffisant
            toast.error("Opération impossible", {
                description: "Le montant du délestage dépasse l'encours disponible dans le tiroir-caisse."
            });
            return;
        }

        cashOperationMutation.mutate({
            type: operationType,
            amount: operationAmount,
            description: operationDescription
        });
    };
    const handleCreateTill = (e: React.FormEvent) => {
        e.preventDefault();
        createTillMutation.mutate(newTillData);
    };
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Tiroirs-Caisses (Tills)</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Supervisez l'encaisse, gérez les fonds de roulement et effectuez les opérations de délestage.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                        title="Actualiser la liste"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all"
                    >
                        <Plus className="w-4 h-4" /> Ajouter un tiroir
                    </button>
                </div>
            </div>

            {/* RECHERCHE ET FILTRES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Rechercher un tiroir par nom ou code unique..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* TABLEAU DES TILLS */}
            {isLoading ? (
                <div className="text-center py-12 text-xs font-semibold text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" /> Chargement des guichets...
                </div>
            ) : isError ? (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center text-rose-600 text-sm">
                    <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-rose-500" /> Impossible de récupérer la liste des tills de votre agence.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Libellé / Description</th>
                                <th className="py-4 px-6">Code Unique</th>
                                <th className="py-4 px-6">Solde Actuel</th>
                                <th className="py-4 px-6">Alerte Sécurité</th>
                                <th className="py-4 px-6 text-center">Statut</th>
                                <th className="py-4 px-6 text-right">Actions de fonds</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {tillsList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-xs text-slate-400">Aucun tiroir-caisse ne correspond à votre recherche.</td>
                                </tr>
                            ) : (
                                tillsList.map((till: any) => {
                                    const isOverLimit = till.current_balance > 2000000;
                                    return (
                                        <tr key={till.id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                                        <Wallet className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">{till.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500 uppercase">{till.code}</td>
                                            <td className="py-4 px-6 font-mono text-base font-black text-slate-900">
                                                {new Intl.NumberFormat('fr-FR').format(till.current_balance)} <span className="text-xs font-sans font-bold text-slate-400">XAF</span>
                                            </td>
                                            <td className="py-4 px-6">
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
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => toggleTillMutation.mutate({ id: till.id, is_active: !till.is_active })}
                                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {till.is_active ? (
                                                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                                                    ) : (
                                                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                <button
                                                    disabled={!till.is_active}
                                                    onClick={() => {
                                                        setSelectedTill(till);
                                                        setOperationType('credit');
                                                        setIsOperationModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg hover:bg-green-100 transition-all disabled:opacity-40"
                                                >
                                                    <ArrowDownLeft className="w-3 h-3" /> Approvisionner
                                                </button>
                                                <button
                                                    disabled={!till.is_active || till.current_balance <= 0}
                                                    onClick={() => {
                                                        setSelectedTill(till);
                                                        setOperationType('debit');
                                                        setIsOperationModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg hover:bg-amber-100 transition-all disabled:opacity-40"
                                                >
                                                    <ArrowUpRight className="w-3 h-3" /> Délester
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL : CRÉER UN NOUVEAU TILL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl border shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h2 className="text-base font-bold text-slate-900">Créer un nouveau Tiroir-Caisse</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateTill} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nom du Guichet / Affectation</label>
                                <input type="text" required placeholder="Ex: Caisse Principale, Guichet 1..." value={newTillData.name} onChange={(e) => setNewTillData({...newTillData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Code Unique (Matricule Hardware/Logiciel)</label>
                                <input type="text" required placeholder="Ex: TILL-BALI-01" value={newTillData.code} onChange={(e) => setNewTillData({...newTillData, code: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono uppercase" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Encaisse Initiale (Optionnelle - XAF)</label>
                                <input type="number" value={newTillData.current_balance} onChange={(e) => setNewTillData({...newTillData, current_balance: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50">Annuler</button>
                                <button type="submit" disabled={createTillMutation.isPending} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm">Créer le tiroir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL : OPÉRATION DE CAISSE (APPROVISIONNEMENT / DÉLESTAGE) */}
            {isOperationModalOpen && selectedTill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl border shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    {operationType === 'credit' ? 'Approvisionner ' : 'Faire un délestage sur '} : {selectedTill.name}
                                </h2>
                                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Code: {selectedTill.code}</span>
                            </div>
                            <button onClick={() => setIsOperationModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCashOperation} className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between text-xs font-medium text-slate-600">
                                <span>Solde actuel de la caisse:</span>
                                <span className="font-mono font-bold text-slate-900">{new Intl.NumberFormat('fr-FR').format(selectedTill.current_balance)} XAF</span>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Montant de la transaction (XAF)</label>
                                <input type="number" required min="1" placeholder="Entrez le montant" value={operationAmount} onChange={(e) => setOperationAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Motif / Commentaire d'audit</label>
                                <textarea rows={2} required placeholder="Ex: Ravitaillement du matin, Clôture intermédiaire suite à un pic de dépôts..." value={operationDescription} onChange={(e) => setOperationDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsOperationModalOpen(false)} className="flex-1 py-2 border text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50">Annuler l'opération</button>
                                <button type="submit" disabled={cashOperationMutation.isPending} className={`flex-1 py-2 text-white font-semibold rounded-xl text-sm shadow-sm ${
                                    operationType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'
                                }`}>
                                    Confirmer le transfert
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}