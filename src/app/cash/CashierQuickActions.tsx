import {
    ArrowLeftRight,
    PlusCircle,
    MinusCircle,
    SendHorizontal,
    Download,
    Receipt
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function CashierQuickActions() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* 1. TRANSFERT WALLET */}
            <Link
                href="/cash/transfer"
                className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition-all group"
            >
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Transfert Wallet</h3>
                    <p className="text-xs text-slate-400 font-medium">Virement de compte à compte ou inter-portefeuilles.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <ArrowLeftRight className="w-5 h-5" />
                </div>
            </Link>

            {/* 2. DÉPÔT / CASH-IN */}
            <Link
                href="/cash/cash-in"
                className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all group"
            >
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Dépôt / Cash-in</h3>
                    <p className="text-xs text-slate-400 font-medium">Alimenter et créditer le portefeuille d'un client en espèces.</p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <PlusCircle className="w-5 h-5" />
                </div>
            </Link>

            {/* 3. RETRAIT / CASH-OUT */}
            <Link
                href="/cash/cash-out"
                className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-amber-500 hover:shadow-md transition-all group"
            >
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Retrait / Cash-out</h3>
                    <p className="text-xs text-slate-400 font-medium">Décaissement d'espèces depuis le compte d'un client.</p>
                </div>
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <MinusCircle className="w-5 h-5" />
                </div>
            </Link>

            {/* 4. REMITTANCE - ENVOI */}
            <Link
                href="/cash/remittance/send"
                className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-pink-500 hover:shadow-md transition-all group"
            >
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">Remittance - Envoi</h3>
                    <p className="text-xs text-slate-400 font-medium">Initier un mandat de transfert international de fonds.</p>
                </div>
                <div className="bg-pink-50 text-pink-600 p-3 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-all">
                    <SendHorizontal className="w-5 h-5" />
                </div>
            </Link>

            {/* 5. REMITTANCE - RETRAIT */}
            <Link
                href="/cash/remittance/payout"
                className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-cyan-500 hover:shadow-md transition-all group"
            >
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">Remittance - Retrait</h3>
                    <p className="text-xs text-slate-400 font-medium">Payer un bénéficiaire via son code secret de transfert.</p>
                </div>
                <div className="bg-cyan-50 text-cyan-600 p-3 rounded-xl group-hover:bg-cyan-500 group-hover:text-white transition-all">
                    <Download className="w-5 h-5" />
                </div>
            </Link>

            {/* 6. PAIEMENT FACTURES */}
            <Link
                href="/cash/bills-payment"
                className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-orange-500 hover:shadow-md transition-all group"
            >
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Paiement Factures</h3>
                    <p className="text-xs text-slate-400 font-medium">Règlement des factures institutionnelles et abonnements.</p>
                </div>
                <div className="bg-orange-50 text-orange-600 p-3 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <Receipt className="w-5 h-5" />
                </div>
            </Link>

        </div>
    );
}