'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Building2,
    Search,
    RefreshCw,
    MapPin,
    Layers,
    DollarSign,
    TrendingUp,
    Store,
    Activity,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

// Appels API
const fetchAgenciesMetrics = async () => {
    const { data } = await api.get('/reporting/regional/agencies');
    return data; // Attend : { data: [ { id, name, code, city, total_cash, active_tills_count, status }, ... ] }
};

export default function GlobalAgenciesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    // 1. Récupération des données analytiques des agences
    const { data: agenciesData, isLoading, isError, refetch } = useQuery({
        queryKey: ['regionalAgenciesList'],
        queryFn: fetchAgenciesMetrics,
        refetchInterval: 15000, // Rafraîchissement automatique toutes les 15 secondes pour le suivi de la caisse
    });

    // 2. Filtrage local à la volée
    const filteredAgencies = agenciesData?.data?.filter((agency: any) => {
        const searchString = `${agency.name} ${agency.code} ${agency.city || ''}`.toLowerCase();
        return searchString.includes(search.toLowerCase());
    }) || [];

    // Calcul des indicateurs de synthèse du territoire
    const totalNetworkCash = filteredAgencies.reduce((sum: number, item: any) => sum + (item.total_cash || 0), 0);
    const totalActiveTills = filteredAgencies.reduce((sum: number, item: any) => sum + (item.active_tills_count || 0), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête de page */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervision des Agences</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Consultez la santé financière, les volumes d'encaissements et l'état d'activité des guichets de votre juridiction.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 self-start bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-colors"
                >
                    <RefreshCw className="w-4 h-4 text-slate-500" /> Synchroniser le réseau
                </button>
            </div>

            {/* Cartes de Synthèse Consolidation Financière */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Solde Total */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trésorerie Agences</p>
                        <p className="text-2xl font-mono font-black text-slate-900">
                            {new Intl.NumberFormat('fr-FR').format(totalNetworkCash)}
                            <span className="text-sm font-sans font-bold text-slate-500 ml-1">XAF</span>
                        </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-green-600">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>

                {/* Guichets Actifs */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guichets Ouverts (Tills)</p>
                        <p className="text-2xl font-bold text-slate-900">{totalActiveTills} <span className="text-sm font-medium text-slate-400">en session</span></p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                {/* Total Points de Services */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Couverture Réseau</p>
                        <p className="text-2xl font-bold text-slate-900">{filteredAgencies.length} <span className="text-sm font-medium text-slate-400">agences</span></p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-green-600">
                        <Store className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Barre de Filtrage Dynamique */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une agence par libellé, code unique ou ville..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Gestion des états de chargement / erreur */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                    <p className="text-xs font-medium text-slate-400">Interrogation des coffres-forts d'agences...</p>
                </div>
            )}

            {isError && (
                <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center text-rose-600 flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="font-semibold">Impossible de récupérer les indicateurs de trésorerie.</p>
                </div>
            )}

            {/* Grille des Agences du Territoire */}
            {!isLoading && !isError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAgencies.length === 0 ? (
                        <div className="col-span-full bg-white text-center py-12 border border-slate-200 rounded-2xl text-slate-400 font-medium">
                            Aucun point de vente ne correspond à vos critères de recherche.
                        </div>
                    ) : (
                        filteredAgencies.map((agency: any) => (
                            <div key={agency.id} className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">

                                {/* En-tête de la carte */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 tracking-tight">{agency.name}</h3>
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                                                {agency.code}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                            <MapPin className="w-3 h-3" /> {agency.city || 'Région Métropole'}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        agency.status === 'active' 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                        <Activity className="w-3 h-3" />
                                        {agency.status === 'active' ? 'Opérationnelle' : 'Suspendue'}
                                    </span>
                                </div>

                                {/* Données financières de l'agence */}
                                <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-bold uppercase tracking-wider">Espèces en coffre</span>
                                        <span className="font-mono font-bold text-slate-900">
                                            {new Intl.NumberFormat('fr-FR').format(agency.total_cash || 0)} XAF
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                        <div
                                            className="bg-green-600 h-full transition-all"
                                            style={{ width: `${Math.min((agency.total_cash / 50000000) * 100, 100)}%` }} // Seuil d'alerte théorique à 50M XAF
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-1">
                                        <span className="text-slate-400 font-medium">Guichets ouverts</span>
                                        <span className="font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                            {agency.active_tills_count} / {agency.total_tills_count || 1}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions / Statistiques rapides */}
                                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-100">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-green-500" /> {agency.transactions_count_today || 0} transferts aujourd'hui
                                    </span>
                                </div>

                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
    );
}