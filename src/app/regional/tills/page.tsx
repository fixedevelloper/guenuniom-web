'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Layers,
    Search,
    RefreshCw,
    User,
    Building2,
    DollarSign,
    Lock,
    Unlock,
    AlertTriangle,
    CheckCircle2,
    ArrowDownRight,
    ArrowUpRight
} from 'lucide-react';
import {toast} from "sonner";

// Appels API
const fetchTillsMetrics = async () => {
    const { data } = await api.get('/reporting/regional/tills');
    return data; // Attend : { data: [ { uuid, code, label, current_balance, status, cashier_name, agency_name, max_limit }, ... ] }
};

export default function GlobalTillsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // 1. Récupération des données en temps réel des caisses
    const { data: tillsData, isLoading, isError, refetch } = useQuery({
        queryKey: ['regionalTillsList'],
        queryFn: fetchTillsMetrics,
        refetchInterval: 10000, // Rafraîchissement intensif (10s) pour le contrôle des flux de caisse
    });

    // 2. Mutation pour forcer la clôture ou le verrouillage de sécurité d'un guichet
    const lockTillMutation = useMutation({
        mutationFn: async (tillUuid: string) => {
            const { data } = await api.patch(`/tills/${tillUuid}/lock`);
            return data;
        },
        onSuccess: () => {
            // Notification de succès pour confirmer la fermeture
            toast.success("Le guichet a été verrouillé et sécurisé avec succès !");

            // Rafraîchissement des données des guichets
            queryClient.invalidateQueries({ queryKey: ['regionalTillsList'] });
        },
        onError: (error: any) => {
            // Remplacement de alert() par un toast d'erreur propre
            toast.error(error?.response?.data?.message || "Erreur lors de la sécurisation du guichet.");
        }
    });

    // 3. Filtrage combiné (Recherche + Statut)
    const filteredTills = tillsData?.data?.filter((till: any) => {
        const matchesSearch = `${till.label} ${till.code} ${till.cashier_name || ''} ${till.agency_name}`
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || till.status === statusFilter;

        return matchesSearch && matchesStatus;
    }) || [];

    // Indicateurs analytiques consolidés
    const totalCashInTills = filteredTills.reduce((sum: number, item: any) => sum + (item.current_balance || 0), 0);
    const activeSessionsCount = filteredTills.filter((t: any) => t.status === 'open').length;
    const alertCount = filteredTills.filter((t: any) => t.current_balance >= (t.max_limit * 0.85)).length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suivi des Caisses & Guichets</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Contrôlez les encours des tiroirs-caisses, validez les ouvertures de sessions et identifiez les guichets en sur-encaisse.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 self-start bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-colors"
                >
                    <RefreshCw className="w-4 h-4 text-slate-500" /> Audit des soldes
                </button>
            </div>

            {/* Cartes Métriques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cash total aux guichets */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Espèces au Guichet (Tills)</p>
                        <p className="text-2xl font-mono font-black text-slate-900">
                            {new Intl.NumberFormat('fr-FR').format(totalCashInTills)}
                            <span className="text-sm font-sans font-bold text-slate-500 ml-1">XAF</span>
                        </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-green-600">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>

                {/* Sessions Ouvertes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessions Actives</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {activeSessionsCount} <span className="text-sm font-medium text-slate-400">caissiers en ligne</span>
                        </p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                        <Unlock className="w-5 h-5" />
                    </div>
                </div>

                {/* Alertes de Plafond d'Encaisse */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertes Plafond (Délestage)</p>
                        <p className={`text-2xl font-bold ${alertCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {alertCount} <span className="text-sm font-medium text-slate-400">caisses à vider</span>
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl ${alertCount > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filtres & Recherche */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filtrer par code caisse, guichetier ou agence..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-green-500"
                >
                    <option value="all">Tous les états de session</option>
                    <option value="open">Sessions Ouvertes</option>
                    <option value="closed">Sessions Clôturées</option>
                    <option value="locked">Verrouillées / Bloquées</option>
                </select>
            </div>

            {/* Traitement des États UX */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                    <p className="text-xs font-medium text-slate-400">Interrogation des journaux des terminaux de caisse...</p>
                </div>
            )}

            {isError && (
                <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center text-rose-600 flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                    <p className="font-semibold">Une erreur empêche la consolidation des terminaux physiques.</p>
                </div>
            )}

            {/* Liste des Caisses du Territoire */}
            {!isLoading && !isError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTills.length === 0 ? (
                        <div className="col-span-full bg-white text-center py-12 border border-slate-200 rounded-2xl text-slate-400 font-medium">
                            Aucun tiroir-caisse ne correspond aux filtres appliqués.
                        </div>
                    ) : (
                        filteredTills.map((till: any) => {
                            const isNearingLimit = till.current_balance >= (till.max_limit * 0.85);

                            return (
                                <div key={till.uuid} className={`bg-white border ${isNearingLimit ? 'border-amber-300 shadow-amber-50' : 'border-slate-200/70'} rounded-2xl shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all`}>

                                    {/* En-tête Caisse */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 tracking-tight">{till.label}</h3>
                                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase">
                                                    {till.code}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                                                <Building2 className="w-3 h-3" /> {till.agency_name}
                                            </p>
                                        </div>

                                        {/* Badge État */}
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                            till.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            till.status === 'locked' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                            'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {till.status === 'open' ? 'Ouverte' : till.status === 'locked' ? 'Bloquée' : 'Fermée'}
                                        </span>
                                    </div>

                                    {/* Balance financière & Seuil légal */}
                                    <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Encaisse Actuelle</span>
                                            <span className={`font-mono font-black text-sm ${isNearingLimit ? 'text-amber-600' : 'text-slate-900'}`}>
                                                {new Intl.NumberFormat('fr-FR').format(till.current_balance)} XAF
                                            </span>
                                        </div>

                                        {/* Jauge de sécurité */}
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${isNearingLimit ? 'bg-amber-500' : 'bg-green-600'}`}
                                                style={{ width: `${Math.min((till.current_balance / till.max_limit) * 100, 100)}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                                            <span>Plafond de sécurité</span>
                                            <span>{new Intl.NumberFormat('fr-FR').format(till.max_limit)} XAF</span>
                                        </div>
                                    </div>

                                    {/* Opérateur assigné / Statut d'affectation */}
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                                        <div className="flex items-center gap-1.5 font-semibold">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            {till.cashier_name ? till.cashier_name : <span className="text-slate-400 font-normal italic">Aucun agent affecté</span>}
                                        </div>

                                        {/* Action de Verrouillage de sécurité à distance */}
                                        {till.status === 'open' && (
                                            <button
                                                onClick={() => lockTillMutation.mutate(till.uuid)}
                                                disabled={lockTillMutation.isPending}
                                                className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors"
                                                title="Forcer le verrouillage de la caisse"
                                            >
                                                <Lock className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}