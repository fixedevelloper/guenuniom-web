'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
    Building2, 
    Layers, 
    TrendingUp, 
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Interfaces des types de données
interface AgencySummary {
    id: number;
    name: string;
    code: string;
    total_tills: number;
    open_tills: number;
    consolidated_balance: number;
}

interface DashboardMetrics {
    region_name: string;
    total_cash: number;
    active_tills_count: number;
    open_tills_count: number;
    agencies_count: number;
    currency: string;
    agencies_summary: AgencySummary[];
}

export default function RegionalAdminDashboardPage() {
    
    // 1. Récupération des données consolidées du Dashboard via l'API
    const { data: metrics, isLoading, error, refetch, isRefetching } = useQuery<DashboardMetrics>({
        queryKey: ['regionalDashboardMetrics'],
        queryFn: async () => {
            const { data } = await api.get('/regional-admin/dashboard-metrics');
            return data.data;
        },
        refetchInterval: 15000, // Actualisation automatique toutes les 15s (Supervision temps réel)
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Calcul des balances consolidées du réseau...
                </p>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm">
                Impossible de charger les métriques de supervision régionale. Veuillez vérifier vos accès.
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ` ${metrics.currency}`;
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DYNAMIQUE */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        SUPERVISION DE ZONE : {metrics.region_name.toUpperCase()}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Suivi en temps réel de l'encours liquide, des ouvertures de guichets et de la trésorerie.
                    </p>
                </div>
                <button 
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                    {isRefetching ? 'Mise à jour...' : 'Actualiser'}
                </button>
            </div>

            {/* SECTION 1 : LES FILTRES ET CARTES DE PERFORMANCES COMPTABLES (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* CARTE 1 : ENCOURS TOTAL EN ESPÈCES */}
                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Espèces Physiques Réseau</CardTitle>
                        <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><TrendingUp className="w-4 h-4" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-mono font-black text-slate-900">{formatCurrency(metrics.total_cash)}</div>
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">Somme des coffres guichets</p>
                    </CardContent>
                </Card>

                {/* CARTE 2 : NOMBRE D'AGENCES SUPERVISÉES */}
                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Points de Vente / Agences</CardTitle>
                        <div className="p-1.5 bg-green-50 rounded-lg text-green-600"><Building2 className="w-4 h-4" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black text-slate-900 font-mono">{metrics.agencies_count}</div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Succursales actives</p>
                    </CardContent>
                </Card>

                {/* CARTE 3 : ÉTAT DES GUICHETS OUVERTS */}
                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Guichets en Service</CardTitle>
                        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Layers className="w-4 h-4" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black text-slate-900 font-mono">
                            {metrics.open_tills_count} <span className="text-xs text-slate-400 font-bold">/ {metrics.active_tills_count}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Sessions d'agents actives</p>
                    </CardContent>
                </Card>

                {/* CARTE 4 : ALERTE SUR TRÉSORERIE IMMOBILISÉE */}
                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Statut Vigilance</CardTitle>
                        <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle className="w-4 h-4" /></div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-bold text-slate-900 mt-1">
                            {metrics.active_tills_count - metrics.open_tills_count > 0 ? (
                                <span className="text-amber-600 flex items-center gap-1">Guichets inactifs clos</span>
                            ) : (
                                <span className="text-emerald-600 flex items-center gap-1">Opérations fluides</span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Risques d'écarts de caisse</p>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 2 : VUE CONSOLIDÉE PAR AGENCE (TABLEAU DE SUPERVISION PRINCIPAL) */}
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 py-4">
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Brouillard et État des Liquidités par Agence
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                    <th className="py-3 px-4">Code / Nom de l'Agence</th>
                                    <th className="py-3 px-4 text-center">Guichets Ouverts</th>
                                    <th className="py-3 px-4">Disponibilité En Caisses</th>
                                    <th className="py-3 px-4 text-right">Statut Opérationnel</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                {metrics.agencies_summary.map((agency) => (
                                    <tr key={agency.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 text-sm font-black">{agency.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">ID: {agency.code}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-mono">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-[11px]">
                                                {agency.open_tills} / {agency.total_tills}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-900 text-sm">
                                            {formatCurrency(agency.consolidated_balance)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {agency.open_tills > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> En cours de service
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
                                                    <XCircle className="w-3.5 h-3.5" /> Agence close
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}