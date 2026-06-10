'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    History,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Wallet as WalletIcon,
    ArrowRightLeft
} from 'lucide-react';
import {api} from "../../../lib/api";

export default function CashHistoryPage() {
    const [page, setPage] = useState<number>(1);
    const [filter, setFilter] = useState<string>('all'); // all, credit, debit

    // Requête de récupération des données via l'API du Guichet Courant
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['cashHistory', page, filter],
        queryFn: async () => {
            const params: any = { page, per_page: 10 };
            if (filter !== 'all') params.entry_type = filter;

            const response = await api.get('/cash/history', { params });
            return response.data;
        },
    });

    const tillInfo = data?.till;
    const historyEntries = data?.data || [];
    const pagination = data?.pagination;

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-1">
            {/* Entête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <History className="w-6 h-6 text-green-600" /> Historique Flux & Journal de Caisse
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {tillInfo ? (
                            <>Flux globaux (Émissions & Retraits) pour le guichet <span className="font-bold text-slate-800">[{tillInfo.code}] - {tillInfo.name}</span> ({tillInfo.agency_name})</>
                        ) : (
                            "Flux globaux et écritures du grand livre comptable pour votre guichet."
                        )}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="rounded-xl gap-1.5 text-xs font-bold uppercase"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    Actualiser
                </Button>
            </div>

            {/* KPIs du Guichet Actuel */}
            {tillInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Encours Physique du Tiroir-Caisse */}
                    <Card className="shadow-sm border-emerald-100 bg-emerald-50/20">
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 rounded-2xl text-white">
                                <WalletIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Espèces en Tiroir-Caisse</p>
                                <p className="text-2xl font-mono font-black text-slate-900 mt-0.5">
                                    {new Intl.NumberFormat('fr-FR').format(tillInfo.current_physical_balance)}
                                    <span className="text-sm font-sans font-medium ml-1 text-slate-500">{tillInfo.currency}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Solde Virtuel / Position Comptable du Guichet */}
                    <Card className="shadow-sm border-green-100 bg-green-50/10">
                        <CardContent className="pt-5 flex items-center gap-4">
                            <div className="p-3 bg-[#1d9e4b] rounded-2xl text-white">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solde Virtuel Comptable</p>
                                <p className="text-2xl font-mono font-black text-slate-900 mt-0.5">
                                    {new Intl.NumberFormat('fr-FR').format(tillInfo.current_virtual_balance)}
                                    <span className="text-sm font-sans font-medium ml-1 text-slate-500">{tillInfo.currency}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Système de Filtres */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setFilter('all'); setPage(1); }}
                    className="rounded-lg text-xs font-bold uppercase px-4 h-8"
                >
                    Tous les flux
                </Button>
                <Button
                    variant={filter === 'credit' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setFilter('credit'); setPage(1); }}
                    className="rounded-lg text-xs font-bold uppercase px-4 h-8 text-emerald-700 hover:text-emerald-800"
                >
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> Entrées (Crédits)
                </Button>
                <Button
                    variant={filter === 'debit' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setFilter('debit'); setPage(1); }}
                    className="rounded-lg text-xs font-bold uppercase px-4 h-8 text-red-700 hover:text-red-800"
                >
                    <TrendingDown className="w-3.5 h-3.5 mr-1" /> Sorties (Débits)
                </Button>
            </div>

            {/* Tableau principal d'historique */}
            <Card className="shadow-sm overflow-hidden border-slate-200">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b">
                                <th className="py-3 px-4">Sens & Rôle</th>
                                <th className="py-3 px-4">Référence Mandat</th>
                                <th className="py-3 px-4">Détails de l'opération</th>
                                <th className="py-3 px-4 text-right">Montant</th>
                                <th className="py-3 px-4 text-right">Solde Caisse Après</th>
                                <th className="py-3 px-4 text-center">Date & heure</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={6}><Skeleton className="h-5 w-full rounded-md" /></td>
                                    </tr>
                                ))
                            ) : historyEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-muted-foreground font-medium text-xs">
                                        Aucun mouvement enregistré dans le journal global de cette caisse.
                                    </td>
                                </tr>
                            ) : (
                                historyEntries.map((entry: any) => {
                                    const isCredit = entry.operation_type === 'credit';
                                    const role = entry.context?.role; // 'initiator' ou 'distributor'

                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 font-medium text-slate-700">
                                            {/* Sens de l'écriture + Rôle Guichet */}
                                            <td className="py-3 px-4 space-y-1">
                                                <div>
                                                    {isCredit ? (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1 rounded-lg py-0.5 text-[10px]">
                                                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Entrée
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 gap-1 rounded-lg py-0.5 text-[10px]">
                                                            <ArrowUpRight className="w-3 h-3 text-rose-600" /> Sortie
                                                        </Badge>
                                                    )}
                                                </div>
                                                {role && (
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight pl-1 flex items-center gap-0.5">
                                                        <ArrowRightLeft className="w-2.5 h-2.5" />
                                                        {role === 'initiator' ? 'Guichet Émetteur' : 'Guichet Payeur'}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Référence Mandat */}
                                            <td className="py-3 px-4 font-mono font-bold tracking-wide text-slate-900 uppercase">
                                                {entry.reference_interne}
                                            </td>

                                            {/* Détails complémentaires */}
                                            <td className="py-3 px-4 text-xs">
                                                {entry.context ? (
                                                    <div>
                                                            <span className="font-bold text-slate-900 uppercase">
                                                                {entry.context.type === 'remittance' ? 'Mandat Cash' : entry.context.type}
                                                            </span>
                                                        <span className="text-slate-400 block mt-0.5">
                                                                {role === 'initiator'
                                                                    ? `Envoyé par: ${entry.context.sender}`
                                                                    : `Distribué à: ${entry.context.recipient}`}
                                                            </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Régularisation système</span>
                                                )}
                                            </td>

                                            {/* Montant de l'opération */}
                                            <td className={`py-3 px-4 text-right font-mono font-black ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {isCredit ? '+' : '-'} {new Intl.NumberFormat('fr-FR').format(entry.amount)}
                                            </td>

                                            {/* Solde Après l'écriture (Si présent) */}
                                            <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                                                {entry.balance_after !== null ? (
                                                    new Intl.NumberFormat('fr-FR').format(entry.balance_after)
                                                ) : (
                                                    <span className="text-slate-400 italic">N/A</span>
                                                )}
                                            </td>

                                            {/* Date & Heure */}
                                            <td className="py-3 px-4 text-center text-xs text-slate-400 font-sans">
                                                {new Date(entry.date).toLocaleString('fr-FR')}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="bg-slate-50/50 px-4 py-3 border-t flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                            <div>Total : {pagination.total} opérations trouvées</div>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className="h-8 px-3 rounded-lg"
                                >
                                    Précédent
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(p + 1, pagination.last_page))}
                                    disabled={page === pagination.last_page}
                                    className="h-8 px-3 rounded-lg"
                                >
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}