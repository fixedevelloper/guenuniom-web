'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, Search, ArrowRight, Wallet, CheckCircle2, User, RefreshCw, AlertTriangle, Landmark } from 'lucide-react';

interface CustomerData {
    id: number;
    reference: string;
    full_name: string;
    phone_number: string;
    balance: number; // Essentiel pour le Cash-Out pour éviter les découverts
}

export default function CashOutPage() {
    const [step, setStep] = useState<'customer' | 'amount' | 'summary'>('customer');
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [searchRef, setSearchRef] = useState('');
    const [inputVal, setInputVal] = useState('');

    // 1. Recherche du client qui souhaite faire le retrait
    const { data: foundCustomer, isFetching, error } = useQuery({
        queryKey: ['customer-cash-out', searchRef],
        queryFn: async () => {
            if (!searchRef) return null;
            const r = await api.get(`/customers/reference/${searchRef}`);
            return r.data.data as CustomerData;
        },
        enabled: !!searchRef,
        retry: false,
    });

    // 2. Calcul des frais de Cash-Out
    const { data: fees, isFetching: isCalcFees } = useQuery({
        queryKey: ['fees-cash-out', amount],
        queryFn: async () => {
            const r = await api.get(`/fees/calculate?amount=${amount}&type=cash_out`);
            return r.data as { fee: number; tax: number; total: number };
        },
        enabled: amount >= 100 && step === 'amount',
    });

    // Vérification du solde : le montant demandé + les frais ne doivent pas dépasser le solde actuel
    const totalToDebit = fees?.total ?? amount;
    const hasSufficientBalance = customer ? customer.balance >= totalToDebit : false;

    // 3. Mutation pour valider le décaissement d'espèces
    const mutation = useMutation({
        mutationFn: (payload: { customer_id: number; amount: number }) =>
            api.post('/cash/cash-out/execute', payload),
        onSuccess: () => {
            alert("Retrait d'espèces effectué avec succès !");
            window.location.reload();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Une erreur est survenue lors du Cash-Out.");
        }
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputVal.trim()) return;
        setSearchRef(inputVal.trim());
    };

    const handleSelectCustomer = () => {
        if (!foundCustomer) return;
        setCustomer(foundCustomer);
        setStep('amount');
        setInputVal('');
        setSearchRef('');
    };

    const handleReset = () => {
        setStep('customer');
        setCustomer(null);
        setAmount(0);
        setInputVal('');
        setSearchRef('');
    };

    return (
        <div className="max-w-7xl mx-auto my-8 p-4">
            {/* Header progressif adapté aux écrans larges */}
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Guichet Cash-Out</h1>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Retrait d'espèces du compte</p>
                </div>
                <div className="text-sm bg-amber-100 font-bold px-4 py-2 rounded-full text-amber-700">
                    Étape {step === 'customer' ? '1' : step === 'amount' ? '2' : '3'} / 3
                </div>
            </div>

            {/* Layout en 3 colonnes (2/3 actions, 1/3 audit persistant) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* COLONNE PRINCIPALE : ACTIONS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ÉTAPE 1 : RECHERCHE DU COMPTE A DÉBITER */}
                    {step === 'customer' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 animate-in fade-in duration-200">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-slate-400" />
                                Rechercher le compte émetteur
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
                                    <p>Compte client introuvable, suspendu ou inactif.</p>
                                </div>
                            )}

                            {foundCustomer && !error && searchRef === inputVal && (
                                <div className="p-6 bg-amber-50/40 border border-amber-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{foundCustomer.full_name}</h4>
                                        <p className="text-sm text-slate-500 font-medium mt-0.5">Solde dispo: <span className="font-mono font-bold text-slate-900">{foundCustomer.balance} XAF</span></p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSelectCustomer}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        Sélectionner ce compte
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ÉTAPE 2 : LE MONTANT DU RETRAIT */}
                    {step === 'amount' && customer && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 animate-in zoom-in-95 duration-200">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Montant brut à retirer</label>
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
                                        <span>Frais de retrait</span>
                                        <span className="font-bold text-slate-800">+{fees?.fee ?? 0} XAF</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 font-medium">
                                        <span>Taxes d'écriture</span>
                                        <span className="font-bold text-slate-800">+{fees?.tax ?? 0} XAF</span>
                                    </div>
                                    <div className="my-2 border-t border-dashed border-slate-200" />
                                    <div className="flex justify-between text-slate-900 font-black text-lg">
                                        <span>Total à débiter du compte</span>
                                        <span className={hasSufficientBalance ? "text-slate-900" : "text-rose-600"}>
                                            {totalToDebit} XAF
                                        </span>
                                    </div>
                                </div>
                            )}

                            {amount >= 100 && !isCalcFees && !hasSufficientBalance && (
                                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p>Solde insuffisant. Le compte ne dispose pas de {totalToDebit} XAF (frais inclus) pour couvrir ce retrait.</p>
                                </div>
                            )}

                            <button
                                disabled={amount < 100 || isCalcFees || !hasSufficientBalance}
                                onClick={() => setStep('summary')}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-30 hover:bg-slate-800"
                            >
                                Passer au récapitulatif
                            </button>
                        </div>
                    )}

                    {/* ÉTAPE 3 : RÉSUMÉ & DÉCAISSEMENT DE LA CAISSE */}
                    {step === 'summary' && customer && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-300/40 space-y-6 animate-in slide-in-from-bottom-6 duration-300">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Sécurisation du Décaissement</h2>
                                    <p className="text-sm text-slate-400 font-medium">Le système va débiter le client. Comptez les billets à lui remettre.</p>
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 font-medium text-base shadow-xl shadow-slate-900/10">
                                <div className="flex justify-between opacity-70">
                                    <span>Pression sur le compte (Débit Global)</span>
                                    <span>{totalToDebit} XAF</span>
                                </div>
                                <div className="flex justify-between opacity-70">
                                    <span>Frais de guichet retenus</span>
                                    <span>{((fees?.fee ?? 0) + (fees?.tax ?? 0))} XAF</span>
                                </div>
                                <div className="border-t border-white/10 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white/95 text-lg">Espèces physiques à DONNER au client</span>
                                    <span className="text-2xl font-black text-amber-400">{amount} XAF</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    disabled={mutation.isPending}
                                    onClick={() => mutation.mutate({ customer_id: customer.id, amount })}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-600/10"
                                >
                                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Débiter et Décasser les Fonds"}
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

                {/* COLONNE LATÉRALE : AUDIT PERSISTANT */}
                <div className="lg:col-span-1 space-y-4 sticky top-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Dossier de Retrait</h3>

                        {customer ? (
                            <div className="space-y-3.5 animate-in fade-in duration-300">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Titulaire du compte</p>
                                    <p className="text-base font-black text-slate-800">{customer.full_name}</p>
                                    <p className="text-xs text-slate-500 mt-1">Tél: {customer.phone_number}</p>

                                    <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-600 bg-white p-2 rounded border">
                                        <span>Réf :</span>
                                        <span className="font-bold text-slate-900">{customer.reference}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Solde Initial :</span>
                                        <span className="font-mono font-bold text-slate-900">{customer.balance} XAF</span>
                                    </div>
                                    {amount > 0 && (
                                        <>
                                            <div className="flex justify-between text-rose-600">
                                                <span>Débit (Frais inc.) :</span>
                                                <span className="font-mono font-bold">-{totalToDebit} XAF</span>
                                            </div>
                                            <div className="border-t border-amber-200/60 my-1" />
                                            <div className="flex justify-between text-emerald-700 font-bold">
                                                <span>Solde Cible :</span>
                                                <span className="font-mono">{(customer.balance - totalToDebit)} XAF</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
                                <User className="w-8 h-8 mx-auto opacity-40 mb-2" />
                                <p className="text-xs font-medium">En attente d'identification du client</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}