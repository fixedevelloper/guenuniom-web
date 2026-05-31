'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Loader2, Search, ArrowRight, Receipt, CheckCircle2, User, RefreshCw, AlertTriangle, Lightbulb, Droplets, Tv, Globe, Flag } from 'lucide-react';

// Configuration des pays et de leurs prestataires associés
const COUNTRIES_CONFIG = [
    {
        code: 'CM',
        name: 'Cameroun',
        currency: 'XAF',
        billers: [
            { id: 'ENEO', name: 'ENEO', icon: 'lightbulb' },
            { id: 'CAMWATER', name: 'CAMWATER', icon: 'droplet' },
            { id: 'CANAL_PLUS_CM', name: 'Canal+ Cameroun', icon: 'tv' },
            { id: 'CAMTEL', name: 'Camtel (Internet)', icon: 'globe' }
        ]
    },
    {
        code: 'CI',
        name: "Côte d'Ivoire",
        currency: 'XOF',
        billers: [
            { id: 'CIE', name: 'CIE', icon: 'lightbulb' },
            { id: 'SODECI', name: 'SODECI', icon: 'droplet' },
            { id: 'CANAL_PLUS_CI', name: 'Canal+ Côte dIvoire', icon: 'tv' },
            { id: 'ORANGE_INTERNET', name: 'Orange Internet', icon: 'globe' }
        ]
    },
    {
        code: 'SN',
        name: 'Sénégal',
        currency: 'XOF',
        billers: [
            { id: 'SENELEC', name: 'SENELEC', icon: 'lightbulb' },
            { id: 'SEN_EAU', name: 'Sen Eau', icon: 'droplet' },
            { id: 'EXPRESSO', name: 'Expresso Internet', icon: 'globe' }
        ]
    }
];

interface InvoiceData {
    invoice_number: string;
    biller_type: string;
    customer_name: string;
    customer_contract_id: string;
    amount_due: number;
    due_date: string;
    is_paid: boolean;
}

export default function BillsPaymentPage() {
    const [step, setStep] = useState<'search' | 'payment_mode' | 'summary'>('search');

    // États pour le ciblage géographique et prestataire
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('CM');
    const [biller, setBiller] = useState<string>('');

    const [invoiceRef, setInvoiceRef] = useState('');
    const [inputVal, setInputVal] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ACCOUNT'>('CASH');
    const [customerAccountRef, setCustomerAccountRef] = useState('');

    // Récupérer la configuration du pays actuellement sélectionné
    const currentCountry = COUNTRIES_CONFIG.find(c => c.code === selectedCountryCode);

    // 1. Recherche de la facture auprès du partenaire
    const { data: invoice, isFetching: isFetchingInvoice, error: invoiceError, refetch: searchInvoice } = useQuery({
        queryKey: ['fetch-invoice', biller, invoiceRef],
        queryFn: async () => {
            if (!invoiceRef || !biller) return null;
            const r = await api.get(`/biller/invoice?type=${biller}&reference=${invoiceRef}&country=${selectedCountryCode}`);
            return r.data.data as InvoiceData;
        },
        enabled: false,
        retry: false,
    });

    // 2. Calcul des frais de service de guichet
    const { data: serviceFees, isFetching: isCalcFees } = useQuery({
        queryKey: ['invoice-fees', invoice?.amount_due, selectedCountryCode],
        queryFn: async () => {
            if (!invoice) return null;
            const r = await api.get(`/fees/calculate?amount=${invoice.amount_due}&type=bill_payment&country=${selectedCountryCode}`);
            return r.data as { fee: number; tax: number; total: number };
        },
        enabled: !!invoice && step === 'payment_mode',
    });

    const totalToPay = (invoice?.amount_due ?? 0) + (serviceFees?.fee ?? 0) + (serviceFees?.tax ?? 0);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!biller || !inputVal.trim()) return;
        setInvoiceRef(inputVal.trim());
        setTimeout(() => searchInvoice(), 50);
    };

    const handleCountryChange = (code: string) => {
        setSelectedCountryCode(code);
        setBiller(''); // Réinitialise le prestataire choisi car la liste change
        setInvoiceRef('');
        setInputVal('');
    };

    // Mutation pour valider l'encaissement
    const mutation = useMutation({
        mutationFn: (payload: { biller_type: string; invoice_number: string; payment_method: string; country: string; account_reference?: string }) =>
            api.post('/biller/pay', payload),
        onSuccess: () => {
            alert("Paiement enregistré avec succès !");
            handleReset();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Échec du règlement de la facture.");
        }
    });

    const handleReset = () => {
        setStep('search');
        setBiller('');
        setInvoiceRef('');
        setInputVal('');
        setCustomerAccountRef('');
    };

    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case 'lightbulb': return <Lightbulb className="w-5 h-5 text-amber-500" />;
            case 'droplet': return <Droplets className="w-5 h-5 text-blue-500" />;
            case 'tv': return <Tv className="w-5 h-5 text-slate-700" />;
            default: return <Globe className="w-5 h-5 text-indigo-500" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto my-8 p-4">

            {/* Entête */}
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Règlement de Factures</h1>
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Paiements de services publics par zone géographique</p>
                </div>
                <div className="text-sm bg-indigo-100 font-bold px-4 py-2 rounded-full text-indigo-700">
                    Zone : {currentCountry?.name} ({currentCountry?.currency})
                </div>
            </div>

            {/* Grille principale */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* COLONNE DE GAUCHE : PROCESSUS */}
                <div className="lg:col-span-2 space-y-6">

                    {step === 'search' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">

                            {/* NOUVEAU : SÉLECTEUR DE PAYS */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                                    1. Choisir le Territoire / Pays
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedCountryCode}
                                        onChange={(e) => handleCountryChange(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white rounded-2xl font-bold transition-all outline-none text-slate-800 appearance-none pl-12"
                                    >
                                        {COUNTRIES_CONFIG.map((country) => (
                                            <option key={country.code} value={country.code}>
                                                {country.name} ({country.currency})
                                            </option>
                                        ))}
                                    </select>
                                    <Flag className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* SÉLECTEUR DE PRESTATAIRE FILTRÉ PAR PAYS */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                                    2. Sélectionner le prestataire disponible au {currentCountry?.name}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {currentCountry?.billers.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => { setBiller(b.id); setInvoiceRef(''); setInputVal(''); }}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold text-xs transition-all ${
                                                biller === b.id
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                                                    : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {getIconComponent(b.icon)}
                                            {b.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* RECHERCHE FORMULAIRE */}
                            {biller && (
                                <form onSubmit={handleSearchSubmit} className="space-y-4 animate-in fade-in duration-200 pt-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                                        Identifiant / Référence Facture Abonné
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            value={inputVal}
                                            onChange={e => setInputVal(e.target.value)}
                                            className="w-full pl-5 pr-16 py-4 bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white rounded-2xl font-mono text-lg font-bold transition-all outline-none text-slate-800"
                                            placeholder="Ex: Ref Client ou Décodeur..."
                                        />
                                        <button type="submit" disabled={isFetchingInvoice || !inputVal.trim()} className="absolute right-3 p-3 bg-slate-900 text-white rounded-xl">
                                            {isFetchingInvoice ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {invoiceError && (
                                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-sm">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p>Référence introuvable pour ce pays ou facture déjà réglée.</p>
                                </div>
                            )}

                            {invoice && !invoiceError && invoiceRef === invoice.customer_contract_id && (
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Abonné Localisé</span>
                                            <h4 className="font-bold text-slate-900 text-lg mt-1">{invoice.customer_name}</h4>
                                            <p className="text-sm text-slate-500 font-mono">ID: {invoice.invoice_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-medium">Net à payer</p>
                                            <p className="text-2xl font-black text-slate-900">{invoice.amount_due.toLocaleString()} {currentCountry?.currency}</p>
                                        </div>
                                    </div>

                                    {!invoice.is_paid && (
                                        <button
                                            type="button"
                                            onClick={() => setStep('payment_mode')}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            Confirmer et encaisser
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ÉTAPE 2 : MODE DE RÈGLEMENT */}
                    {step === 'payment_mode' && invoice && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mode de prélèvement</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setPaymentMethod('CASH')} className={`p-4 rounded-xl border font-bold text-sm text-center ${paymentMethod === 'CASH' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>
                                        Espèces physiques (Cash)
                                    </button>
                                    <button type="button" onClick={() => setPaymentMethod('ACCOUNT')} className={`p-4 rounded-xl border font-bold text-sm text-center ${paymentMethod === 'ACCOUNT' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>
                                        Compte Interne Client
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'ACCOUNT' && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Référence du compte à débiter</label>
                                    <input type="text" value={customerAccountRef} onChange={e => setCustomerAccountRef(e.target.value)} className="w-full p-3.5 bg-slate-50 border rounded-xl font-mono text-sm" placeholder="Numéro de compte..." />
                                </div>
                            )}

                            <div className="p-5 bg-slate-50 rounded-2xl space-y-3 relative">
                                <div className="flex justify-between text-slate-500 font-medium">
                                    <span>Montant Facture</span>
                                    <span className="font-bold text-slate-800">{invoice.amount_due.toLocaleString()} {currentCountry?.currency}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 font-medium">
                                    <span>Frais de Guichet ({currentCountry?.code})</span>
                                    <span className="font-bold text-slate-800">+{serviceFees?.fee ?? 0} {currentCountry?.currency}</span>
                                </div>
                                <hr className="border-dashed border-slate-200" />
                                <div className="flex justify-between text-slate-900 font-black text-lg">
                                    <span>Total à percevoir</span>
                                    <span>{totalToPay.toLocaleString()} {currentCountry?.currency}</span>
                                </div>
                            </div>

                            <button type="button" onClick={() => setStep('summary')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">
                                Passer au résumé
                            </button>
                        </div>
                    )}

                    {/* ÉTAPE 3 : CONFIRMATION */}
                    {step === 'summary' && invoice && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl space-y-6">
                            <div className="bg-indigo-950 text-indigo-100 p-6 rounded-2xl space-y-4">
                                <div className="flex justify-between opacity-80">
                                    <span>Prestataire sélectionné ({invoice.biller_type})</span>
                                    <span className="font-bold text-white">{invoice.amount_due.toLocaleString()} {currentCountry?.currency}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-indigo-800/60 pt-3">
                                    <span className="font-black text-white text-lg">Total final à encaisser</span>
                                    <span className="text-3xl font-black text-emerald-400">{totalToPay.toLocaleString()} {currentCountry?.currency}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    disabled={mutation.isPending}
                                    onClick={() => mutation.mutate({
                                        biller_type: invoice.biller_type,
                                        invoice_number: invoice.invoice_number,
                                        payment_method: paymentMethod,
                                        country: selectedCountryCode,
                                        account_reference: paymentMethod === 'ACCOUNT' ? customerAccountRef : undefined
                                    })}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-base transition-all"
                                >
                                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirmer le règlement"}
                                </button>
                                <button type="button" onClick={handleReset} className="w-32 bg-slate-100 text-slate-500 rounded-2xl font-bold">
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLONNE DE DROITE : AUDIT GEOGRAPHIQUE */}
                <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Informations de Zone</h3>
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Pays Opérationnel</span>
                                <p className="font-black text-slate-800 text-base">{currentCountry?.name}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Devise locale de collecte</span>
                                <p className="font-mono font-bold text-slate-700">{currentCountry?.currency}</p>
                            </div>
                        </div>

                        {invoice && (
                            <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-2 text-xs">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Abonné Facturé</p>
                                <p className="font-bold text-sm text-white truncate">{invoice.customer_name}</p>
                                <p className="font-mono text-slate-400">Contrat Ref : {invoice.customer_contract_id}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}