'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, Search, ArrowRight, Wallet, CheckCircle2, User, RefreshCw, AlertTriangle } from 'lucide-react';
import {toast} from "sonner";

interface CustomerData {
    id: number;
    reference: string;
    full_name: string;
    phone_number: string;
}

export default function CashInPage() {
    const [step, setStep] = useState<'recipient' | 'amount' | 'summary'>('recipient');
    const [recipient, setRecipient] = useState<CustomerData | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [searchRef, setSearchRef] = useState('');
    const [inputVal, setInputVal] = useState('');

    // 1. Recherche du bénéficiaire du dépôt
    const { data: customer, isFetching, error } = useQuery({
        queryKey: ['customer-cash-in', searchRef],
        queryFn: async () => {
            if (!searchRef) return null;
            const r = await api.get(`/customers/reference/${searchRef}`);
            return r.data.data as CustomerData;
        },
        enabled: !!searchRef,
        retry: false,
    });

    // 2. Calcul des frais de Cash-In (généralement gratuits, mais la règle l'appliquera)
    const { data: fees, isFetching: isCalcFees } = useQuery({
        queryKey: ['fees-cash-in', amount],
        queryFn: async () => {
            const r = await api.get(`/cash/transfer/fees/calculate?amount=${amount}&type=cash_in`);
            return r.data as { fee: number; tax: number; total: number };
        },
        enabled: amount >= 100 && step === 'amount',
    });

    // 3. Mutation pour valider le dépôt d'espèces
    const mutation = useMutation({
        mutationFn: (payload: { recipient_id: number; amount: number }) =>
            api.post('/cash/cash-in/execute', payload),
        onSuccess: () => {
            // Notification de succès
            toast.success("Dépôt d'espèces effectué avec succès !", {
                duration: 2000, // Laisse le toast visible 2 secondes
                onAutoClose: () => {
                    window.location.reload(); // Rafraîchissement propre après lecture
                },
                onDismiss: () => {
                    window.location.reload(); // Sécurité si l'opérateur ferme manuellement
                }
            });
        },
        onError: (err: any) => {
            // Remplacement de alert() par un toast d'erreur
            toast.error(err.response?.data?.message || "Une erreur est survenue lors du Cash-In.");
        }
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputVal.trim()) return;
        setSearchRef(inputVal.trim());
    };

    const handleSelectRecipient = () => {
        if (!customer) return;
        setRecipient(customer);
        setStep('amount');
        setInputVal('');
        setSearchRef('');
    };

    const handleReset = () => {
        setStep('recipient');
        setRecipient(null);
        setAmount(0);
        setInputVal('');
        setSearchRef('');
    };

    return (
    <div className="max-w-7xl mx-auto my-8 p-4">
        {/* Header progressif adapté aux écrans larges */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Guichet Cash-In</h1>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Dépôt d'espèces sur compte</p>
            </div>
            <div className="text-sm bg-emerald-100 font-bold px-4 py-2 rounded-full text-emerald-700">
                Étape {step === 'recipient' ? '1' : step === 'amount' ? '2' : '3'} / 3
            </div>
        </div>

        {/* Layout en 2 colonnes sur grand écran : Gauche pour l'action, Droite pour le récapitulatif */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* COLONNE PRINCIPALE : DYNAMIQUE (Prend 2/3 de l'espace sur PC) */}
            <div className="lg:col-span-2 space-y-6">

                {/* ÉTAPE 1 : RECHERCHE DU BÉNÉFICIAIRE */}
                {step === 'recipient' && (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 animate-in fade-in duration-200">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Search className="w-5 h-5 text-slate-400" />
                            Rechercher le compte client
                        </h2>

                        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                            <input
                                value={inputVal}
                                onChange={e => setInputVal(e.target.value)}
                                className="w-full pl-5 pr-16 py-4 bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white rounded-2xl font-mono text-lg font-bold transition-all outline-none text-slate-800 placeholder-slate-400"
                                placeholder="Entrez la référence ou le numéro de compte..."
                            />
                            <button type="submit" disabled={isFetching || !inputVal.trim()} className="absolute right-3 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-30">
                                {isFetching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p>Bénéficiaire introuvable ou compte inactif.</p>
                            </div>
                        )}

                        {customer && !error && searchRef === inputVal && (
                            <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{customer.full_name}</h4>
                                    <p className="text-sm text-slate-500 font-medium mt-0.5">{customer.phone_number}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSelectRecipient}
                                    className="bg-[#1d9e4b] hover:bg-[#18853f] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    Confirmer ce compte
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ÉTAPE 2 : LE MONTANT */}
                {step === 'amount' && (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 animate-in zoom-in-95 duration-200">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Somme déposée (espèces)</label>
                            <div className="relative flex items-center">
                                <input
                                    type="number"
                                    min="100"
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="w-full p-5 text-4xl font-black bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl transition-all outline-none text-slate-900 pr-24"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-6 text-xl font-black text-slate-400">XAF</span>
                            </div>
                        </div>

                        {amount >= 100 && (
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-base space-y-3 relative">
                                {isCalcFees && (
                                    <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-500 font-medium">
                                    <span>Frais de dépôt</span>
                                    <span className="font-bold text-slate-800">+{fees?.fee ?? 0} XAF</span>
                                </div>
                                <div className="my-2 border-t border-dashed border-slate-200" />
                                <div className="flex justify-between text-slate-900 font-black text-lg">
                                    <span>Total à percevoir en caisse</span>
                                    <span className="text-slate-900">{fees?.total?.toLocaleString() ?? amount.toLocaleString()} XAF</span>
                                </div>
                            </div>
                        )}

                        <button
                            disabled={amount < 100 || isCalcFees}
                            onClick={() => setStep('summary')}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-30 hover:bg-slate-800"
                        >
                            Passer au récapitulatif
                        </button>
                    </div>
                )}

                {/* ÉTAPE 3 : RÉSUMÉ & ENCAISSEMENT */}
                {step === 'summary' && recipient && (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-300/40 space-y-6 animate-in slide-in-from-bottom-6 duration-300">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Sécurisation du Cash</h2>
                                <p className="text-sm text-slate-400 font-medium">Veuillez compter et ranger les espèces avant de valider l'écriture</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 font-medium text-base">
                            <div className="flex justify-between text-slate-600">
                                <span>Montant à créditer sur le compte</span>
                                <span className="font-bold text-slate-900">{amount.toLocaleString()} XAF</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Frais de guichet</span>
                                <span className="font-bold text-slate-900">{fees?.fee ?? 0} XAF</span>
                            </div>
                            <div className="border-t border-slate-200 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="font-black text-slate-900 text-lg">Espèces physiques à recevoir</span>
                                <span className="text-2xl font-black text-emerald-600">{fees?.total?.toLocaleString()} XAF</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                disabled={mutation.isPending}
                                onClick={() => mutation.mutate({ recipient_id: recipient.id, amount })}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                            >
                                {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Encaisser et Créditer le Compte"}
                            </button>
                            <button
                                type="button"
                                disabled={mutation.isPending}
                                onClick={handleReset}
                                className="sm:w-48 text-center bg-slate-100 text-slate-500 hover:bg-slate-200 py-4 rounded-2xl font-bold text-base transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* LATÉRAL : ENCADRÉ DES ACTEURS (Prend 1/3 sur PC, idéal pour combler le vide) */}
            <div className="lg:col-span-1 space-y-4 sticky top-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informations Dossier</h3>

                    {recipient ? (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Bénéficiaire Actif</p>
                                <p className="text-base font-black text-slate-800">{recipient.full_name}</p>
                                <p className="text-sm text-slate-500 font-mono mt-1">{recipient.reference}</p>
                                <p className="text-xs text-slate-400 mt-2">Tél: {recipient.phone_number}</p>
                            </div>
                            {amount > 0 && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm space-y-2">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Crédit Net:</span>
                                        <span className="font-bold text-slate-800">{amount.toLocaleString()} XAF</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Frais exigés:</span>
                                        <span className="font-bold text-slate-800">{fees?.fee ?? 0} XAF</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
                            <User className="w-8 h-8 mx-auto opacity-40 mb-2" />
                            <p className="text-xs font-medium">En attente de sélection du bénéficiaire</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    </div>
    );
}