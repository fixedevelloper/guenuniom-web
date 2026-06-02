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

export default function TransferPage() {
    const [step, setStep] = useState<'sender' | 'recipient' | 'amount' | 'summary'>('sender');

    // On sauvegarde les objets complets pour afficher le récapitulatif à la fin
    const [sender, setSender] = useState<CustomerData | null>(null);
    const [recipient, setRecipient] = useState<CustomerData | null>(null);

    const [amount, setAmount] = useState<number>(0);
    const [searchRef, setSearchRef] = useState('');
    const [inputVal, setInputVal] = useState('');

    // 1. Recherche du client (Déclenchée uniquement lors du clic sur Rechercher)
    const { data: customer, isFetching, error } = useQuery({
        queryKey: ['customer-search', searchRef, step], // 'step' inclus pour dissocier les recherches
        queryFn: async () => {
            if (!searchRef) return null;
            const r = await api.get(`/customers/reference/${searchRef}`);
            return r.data.data as CustomerData;
        },
        enabled: !!searchRef,
        retry: false,
    });

    // 2. Calcul des frais en temps réel
    const { data: fees, isFetching: isCalcFees } = useQuery({
        queryKey: ['fees-calc', amount],
        queryFn: async () => {
            const r = await api.get(`/cash/transfer/fees/calculate?amount=${amount}`);
            return r.data as { fee: number; tax: number; total: number };
        },
        enabled: amount >= 100 && step === 'amount',
    });

    // 3. Mutation finale pour exécuter le transfert
    const mutation = useMutation({
        mutationFn: (payload: { sender_id: number; recipient_id: number; amount: number }) =>
            api.post('/cash/transfer/execute', payload),
        onSuccess: () => {
            setStep('summary'); // Optionnel si vous gérez un écran de succès dédié
            toast.success("Transfert effectué avec succès !", {
                description: "Le grand livre comptable et les portefeuilles ont été mis à jour.",
            });
            window.location.reload();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Une erreur est survenue lors du transfert.");
        }
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputVal.trim()) return;
        setSearchRef(inputVal.trim());
    };

    const handleSelectCustomer = () => {
        if (!customer) return;

        if (step === 'sender') {
            setSender(customer);
            setStep('recipient');
        } else if (step === 'recipient') {
            if (customer.id === sender?.id) {
                alert("Erreur : L'expéditeur et le bénéficiaire ne peuvent pas être la même personne.");
                return;
            }
            setRecipient(customer);
            setStep('amount');
        }
        // Réinitialisation pour l'étape suivante
        setInputVal('');
        setSearchRef('');
    };

    const handleReset = () => {
        setStep('sender');
        setSender(null);
        setRecipient(null);
        setAmount(0);
        setInputVal('');
        setSearchRef('');
    };

    return (
        <div className="max-w-7xl mx-auto my-8 p-4">
            {/* Barre de progression moderne adaptée aux écrans larges */}
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Guichet Unique</h1>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Transfert de compte à compte</p>
                </div>
                <div className="text-sm bg-slate-100 font-bold px-4 py-2 rounded-full text-slate-600">
                    Étape {step === 'sender' ? '1' : step === 'recipient' ? '2' : step === 'amount' ? '3' : '4'} / 4
                </div>
            </div>

            {/* Layout en grille à 3 colonnes sur PC : 2 colonnes pour l'action, 1 pour le récapitulatif */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* COLONNE GAUCHE (DYNAMIQUE) : Formulaires et Saisies */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ÉTAPES 1 & 2 : RECHERCHE EXPÉDITEUR ET BÉNÉFICIAIRE */}
                    {(step === 'sender' || step === 'recipient') && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 animate-in fade-in duration-200">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-slate-400" />
                                {step === 'sender' ? "Identification de l'Expéditeur" : "Identification du Bénéficiaire"}
                            </h2>

                            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                                <input
                                    value={inputVal}
                                    onChange={e => setInputVal(e.target.value)}
                                    className="w-full pl-5 pr-16 py-4 bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white rounded-2xl font-mono text-lg font-bold transition-all outline-none text-slate-800 placeholder-slate-400"
                                    placeholder="Saisir la référence unique..."
                                />
                                <button type="submit" disabled={isFetching || !inputVal.trim()} className="absolute right-3 p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-30">
                                    {isFetching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                </button>
                            </form>

                            {/* Gestion des Erreurs de Recherche */}
                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p>Aucun client trouvé avec cette référence.</p>
                                </div>
                            )}

                            {/* Affichage du résultat trouvé avant validation */}
                            {customer && !error && searchRef === inputVal && (
                                <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-start justify-between sm:items-center">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{customer.full_name}</h4>
                                            <p className="text-sm text-slate-500 font-medium mt-0.5">{customer.phone_number}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSelectCustomer}
                                        className="bg-[#1d9e4b] hover:bg-[#18853f] text-white px-6 py-3.5 rounded-xl font-bold shadow-md shadow-green-600/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        Choisir comme {step === 'sender' ? "expéditeur" : "bénéficiaire"}
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ÉTAPE 3 : CHAMP MONTANT & DETAILS COMMISSIONS */}
                    {step === 'amount' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 animate-in zoom-in-95 duration-200">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Montant de la transaction</label>
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

                            {/* Bloc Facturation dynamique */}
                            {amount >= 100 && (
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-base space-y-3 relative">
                                    {isCalcFees && (
                                        <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-500 font-medium">
                                        <span>Frais de service</span>
                                        <span className="font-bold text-slate-800">+{fees?.fee?.toLocaleString() ?? 0} XAF</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 font-medium">
                                        <span>Taxes gouvernementales</span>
                                        <span className="font-bold text-slate-800">+{fees?.tax?.toLocaleString() ?? 0} XAF</span>
                                    </div>
                                    <div className="my-2 border-t border-dashed border-slate-200" />
                                    <div className="flex justify-between text-slate-900 font-black text-lg">
                                        <span>Total à débiter</span>
                                        <span className="text-slate-900">{fees?.total?.toLocaleString() ?? amount.toLocaleString()} XAF</span>
                                    </div>
                                </div>
                            )}

                            <button
                                disabled={amount < 100 || isCalcFees}
                                onClick={() => setStep('summary')}
                                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white py-4 rounded-2xl text-base font-bold transition-all tracking-wide disabled:text-slate-400"
                            >
                                Continuer vers la confirmation
                            </button>
                        </div>
                    )}

                    {/* ÉTAPE 4 : APERÇU FINAL & SIGNATURE ACTION */}
                    {step === 'summary' && sender && recipient && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-300/40 space-y-6 animate-in slide-in-from-bottom-6 duration-300">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Validation Finale</h2>
                                    <p className="text-sm text-slate-400 font-medium">Veuillez faire signer ou confirmer par le client avant validation</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 font-medium text-base shadow-xl shadow-slate-900/10">
                                <div className="flex justify-between opacity-70">
                                    <span>Montant net reçu</span>
                                    <span>{amount.toLocaleString()} XAF</span>
                                </div>
                                <div className="flex justify-between opacity-70">
                                    <span>Total des frais</span>
                                    <span>{((fees?.fee ?? 0) + (fees?.tax ?? 0)).toLocaleString()} XAF</span>
                                </div>
                                <div className="border-t border-white/10 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white/90">Montant débité</span>
                                    <span className="text-2xl font-black text-emerald-400">{fees?.total?.toLocaleString()} XAF</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    disabled={mutation.isPending}
                                    onClick={() => mutation.mutate({ sender_id: sender.id, recipient_id: recipient.id, amount })}
                                    className="flex-1 bg-[#1d9e4b] hover:bg-[#18853f] disabled:bg-slate-100 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Traitement comptable...
                                        </>
                                    ) : (
                                        "Confirmer et transférer"
                                    )}
                                </button>

                                <button
                                    type="button"
                                    disabled={mutation.isPending}
                                    onClick={handleReset}
                                    className="sm:w-48 text-center bg-slate-100 text-slate-500 hover:bg-slate-200 py-4 rounded-2xl font-bold text-base transition-colors"
                                >
                                    Abandonner
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLONNE DROITE (STIQUE) : Tableau d'Audit Persistant des Acteurs */}
                <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Fil d'Ariane Acteurs</h3>

                        {(!sender && !recipient) ? (
                            <div className="p-8 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
                                <User className="w-8 h-8 mx-auto opacity-40 mb-2" />
                                <p className="text-xs font-medium">Aucun acteur sélectionné pour le moment</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5 animate-in fade-in duration-300">
                                {/* Émetteur */}
                                {sender && (
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-200/60 rounded-xl text-slate-600"><User className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expéditeur</p>
                                                <p className="text-base font-bold text-slate-800">{sender.full_name}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500 bg-white px-2 py-1.5 rounded border">
                                            <span>Réf:</span>
                                            <span className="font-bold text-slate-700">{sender.reference}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Bénéficiaire */}
                                {recipient && (
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><User className="w-4 h-4" /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Bénéficiaire</p>
                                                <p className="text-base font-bold text-slate-800">{recipient.full_name}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-500 bg-white px-2 py-1.5 rounded border">
                                            <span>Réf:</span>
                                            <span className="font-bold text-slate-700">{recipient.reference}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Recap financier succinct en barre latérale */}
                                {amount > 0 && (
                                    <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                                        <div className="flex justify-between opacity-70">
                                            <span>Principal :</span>
                                            <span>{amount.toLocaleString()} XAF</span>
                                        </div>
                                        <div className="flex justify-between opacity-70">
                                            <span>Frais cumulés :</span>
                                            <span>{((fees?.fee ?? 0) + (fees?.tax ?? 0)).toLocaleString()} XAF</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}