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
    Plus,
    X,
    XCircle, SlidersHorizontal
} from 'lucide-react';

// Appels API
const fetchAgenciesMetrics = async () => {
    const { data } = await api.get('/reporting/regional/agencies');
    return data;
};

export default function GlobalAgenciesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // État pour le modal d'ajustement de coffre
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [selectedAgencyForAdjustment, setSelectedAgencyForAdjustment] = useState<any>(null);
    const [adjustmentErrorMessage, setAdjustmentErrorMessage] = useState<string | null>(null);

    const [adjustmentData, setAdjustmentData] = useState({
        action: 'fund',       // fund ou debit
        amount: '',
        description: '',
        is_physical: false    // Distingue le Virtuel du Physique (Cash)
    });

// Mutation pour envoyer l'ajustement à l'API Laravel
    const adjustVaultMutation = useMutation({
        mutationFn: async (payload: any) => {
            // Envoi vers votre route POST (en utilisant l'UUID ou l'ID selon votre routing)
            const { data } = await api.post(`/agencies/${selectedAgencyForAdjustment?.uuid}/adjust-vault`, {
                uuid: selectedAgencyForAdjustment?.uuid, // Conservé au cas où votre backend fait une double vérification
                action: payload.action,
                amount: Number(payload.amount),
                description: payload.description,
                is_physical: Boolean(payload.is_physical)
            });
            return data;
        },
        onSuccess: () => {
            // Rafraîchit instantanément les données de trésorerie sur l'écran principal
            queryClient.invalidateQueries({ queryKey: ['regionalAgenciesList'] });
            setIsAdjustmentModalOpen(false);
            setAdjustmentErrorMessage(null);
            setAdjustmentData({ action: 'fund', amount: '', description: '', is_physical: false });
        },
        onError: (error: any) => {
            setAdjustmentErrorMessage(error?.response?.data?.message || "Échec de l'ajustement de coffre.");
        }
    });
    // Formulaire de création aligné sur vos règles de validation
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        address: '',
        country_id: '', // Sera extrait dynamiquement depuis la ville sélectionnée
        city_id: '',
        status: 'active',
        is_active: true
    });

    // 1. Récupération des données analytiques des agences
    const { data: agenciesData, isLoading, isError, refetch } = useQuery({
        queryKey: ['regionalAgenciesList'],
        queryFn: fetchAgenciesMetrics,
        refetchInterval: 15000, // Suivi de l'encaisse en temps réel
    });

    // 2. Récupération de la liste des villes (contenant leur country_id rattaché)
    const { data: cities = [] } = useQuery({
        queryKey: ['citiesList'],
        queryFn: async () => {
            const { data } = await api.get('/cities/by/country');
            return data.data; // Attend un tableau d'objets : [ { id, name, country_id }, ... ]
        }
    });

    // 3. Filtrage local à la volée
    const filteredAgencies = agenciesData?.data?.filter((agency: any) => {
        const searchString = `${agency.name} ${agency.code} ${agency.city || ''}`.toLowerCase();
        return searchString.includes(search.toLowerCase());
    }) || [];

    // 4. Mutation pour l'enregistrement d'une agence
    const createAgencyMutation = useMutation({
        mutationFn: async (newAgency: typeof formData) => {
            if (!newAgency.city_id || !newAgency.country_id) {
                throw new Error("Veuillez sélectionner une ville valide pour déterminer le pays de rattachement.");
            }
            const payload = {
                ...newAgency,
                code: newAgency.code.toUpperCase().trim(),
                country_id: Number(newAgency.country_id),
                city_id: Number(newAgency.city_id),
                is_active: Boolean(newAgency.is_active)
            };
            const { data } = await api.post('/agencies', payload);
            return data;
        },
        onSuccess: () => {
            // ✅ Correction de la clé d'invalidation pour forcer la mise à jour visuelle du réseau
            queryClient.invalidateQueries({ queryKey: ['regionalAgenciesList'] });
            setIsModalOpen(false);
            setErrorMessage(null);
            setFormData({ code: '', name: '', address: '', country_id: '', city_id: '', status: 'active', is_active: true });
        },
        onError: (error: any) => {
            setErrorMessage(error?.response?.data?.message || error?.message || "Impossible de configurer cette agence.");
        }
    });

    // Calcul des indicateurs globaux du réseau filtré
    const totalNetworkCash = filteredAgencies.reduce((sum: number, item: any) => sum + (item.total_cash || 0), 0);
    const totalActiveTills = filteredAgencies.reduce((sum: number, item: any) => sum + (item.active_tills_count || 0), 0);

    // Génération automatique d'un code agence standardisé basé sur le nom
    const handleNameChange = (name: string) => {
        const generatedCode = 'AGE-' + name
            .toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 8);

        setFormData(prev => ({
            ...prev,
            name,
            code: prev.code && !prev.code.startsWith('AGE-') ? prev.code : generatedCode
        }));
    };

    // Gestion du changement de ville : Détermine et injecte automatiquement le pays
    const handleCityChange = (cityId: string) => {
        const selectedCity = cities.find((c: any) => String(c.id) === cityId);

        setFormData(prev => ({
            ...prev,
            city_id: cityId,
            country_id: selectedCity ? String(selectedCity.country_id) : ''
        }));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800">

            {/* En-tête de page */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervision des Agences</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Consultez la santé financière, les volumes d'encaissements et l'état d'activité des guichets de votre juridiction.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" /> Synchroniser le réseau
                    </button>
                    <button
                        onClick={() => { setErrorMessage(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-green-200/50 transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" /> Enregistrer une agence
                    </button>
                </div>
            </div>

            {/* Cartes de Synthèse Consolidation Financière */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Trésorerie globale */}
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

                {/* Couverture Réseau */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Couverture Réseau</p>
                        <p className="text-2xl font-bold text-slate-900">{filteredAgencies.length} <span className="text-sm font-medium text-slate-400">points de service</span></p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-green-600">
                        <Store className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Barre de Filtrage */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une agence par son libellé, son code unique ou sa ville..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Traitement des états de chargement asynchrones */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interrogation des coffres-forts réseau...</p>
                </div>
            )}

            {isError && (
                <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center text-rose-600 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="font-bold">Impossible de consolider les données de trésorerie.</p>
                </div>
            )}

            {/* Grille des Agences Opérationnelles */}
            {!isLoading && !isError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAgencies.length === 0 ? (
                        <div className="col-span-full bg-white text-center py-12 border border-slate-200 rounded-2xl text-slate-400 font-medium shadow-sm">
                            Aucun point de vente ne correspond à votre recherche.
                        </div>
                    ) : (
                        filteredAgencies.map((agency: any) => (
                            <div key={agency.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 tracking-tight">{agency.name}</h3>
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold">
                                                {agency.code}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                                            <MapPin className="w-3 h-3 text-slate-400" /> {agency.city || 'Zone Métropolitaine'}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        agency.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-slate-50 text-slate-500 border border-slate-200/60'
                                    }`}>
                                        <Activity className="w-3 h-3" />
                                        {agency.status === 'active' ? 'Active' : 'Suspendue'}
                                    </span>
                                </div>

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
                                            style={{ width: `${Math.min(((agency.total_cash || 0) / 50000000) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-1">
                                        <span className="text-slate-400 font-medium">Guichets ouverts</span>
                                        <span className="font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                            {agency.active_tills_count} / {agency.total_tills_count || 1}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-100">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-green-500" /> {agency.transactions_count_today || 0} transferts aujourd'hui
                                    </span>
                                </div>
                                {/* Actions / Statistiques rapides */}
                                <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
    <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
        <TrendingUp className="w-3.5 h-3.5 text-green-500" /> {agency.transactions_count_today || 0} trfs
    </span>

                                    <button
                                        onClick={() => {
                                            setAdjustmentErrorMessage(null);
                                            setSelectedAgencyForAdjustment(agency);
                                            setIsAdjustmentModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wide rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <SlidersHorizontal className="w-3 h-3 text-slate-500" /> Ajuster Coffre
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal d'enregistrement d'une agence */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-green-600" /> Configurer une Nouvelle Agence
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"><X className="w-4 h-4" /></button>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); createAgencyMutation.mutate(formData); }} className="space-y-4 text-xs font-bold text-slate-700">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 tracking-wide">Nom commercial</label>
                                    <input type="text" placeholder="Ex: Agence Akwa" required value={formData.name} onChange={(e) => handleNameChange(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold h-10 text-xs focus:outline-none focus:border-green-500 focus:bg-white transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 tracking-wide">Code Unique</label>
                                    <input type="text" placeholder="AGE-AKW" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-green-600 h-10 text-xs tracking-wider" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-slate-500 tracking-wide">Adresse physique (Rue / Quartier)</label>
                                <input type="text" placeholder="Ex: Boulevard de la Liberté" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium h-10 text-xs focus:outline-none focus:border-green-500 focus:bg-white transition-all" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-slate-500 tracking-wide">Ville d'implantation</label>
                                <select
                                    required
                                    value={formData.city_id}
                                    onChange={(e) => handleCityChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 h-10 focus:outline-none focus:border-green-500 transition-all"
                                >
                                    <option value="">Sélectionnez la ville</option>
                                    {cities.map((city: any) => (
                                        <option key={city.id} value={city.id}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                                {formData.country_id && (
                                    <p className="text-[10px] text-emerald-600 font-bold mt-1 tracking-wide uppercase flex items-center gap-1">
                                        ✨ Code pays résolu automatiquement (ID: {formData.country_id})
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 tracking-wide">Statut initial</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 h-10 focus:outline-none focus:border-green-500 transition-all"
                                    >
                                        <option value="active">Active (Ouverte)</option>
                                        <option value="suspended">Suspendue</option>
                                        <option value="closed">Fermée définitivement</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 tracking-wide">État opérationnel</label>
                                    <select
                                        value={formData.is_active ? "true" : "false"}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.value === "true"})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 h-10 focus:outline-none focus:border-green-500 transition-all"
                                    >
                                        <option value="true">Autoriser les transactions</option>
                                        <option value="false">Bloquer les flux</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors">Annuler</button>
                                <button type="submit" disabled={createAgencyMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-colors">
                                    {createAgencyMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    {createAgencyMutation.isPending ? 'Ouverture...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal d'Ajustement de Coffre */}
            {isAdjustmentModalOpen && selectedAgencyForAdjustment && (
                <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-800">

                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                    Mouvement de Trésorerie
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                    Agence cible : <span className="text-slate-700 font-bold">{selectedAgencyForAdjustment.name}</span> ({selectedAgencyForAdjustment.code})
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAdjustmentModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {adjustmentErrorMessage && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p>{adjustmentErrorMessage}</p>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                adjustVaultMutation.mutate(adjustmentData);
                            }}
                            className="space-y-4 text-xs font-bold text-slate-700"
                        >
                            {/* Type de mouvement */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-slate-500 tracking-wide">Type d'opération comptable</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentData({...adjustmentData, action: 'fund'})}
                                        className={`py-2.5 rounded-xl font-black uppercase tracking-wider text-xs border transition-all ${
                                            adjustmentData.action === 'fund'
                                                ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        📈 Approvisionner (Credit)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentData({...adjustmentData, action: 'debit'})}
                                        className={`py-2.5 rounded-xl font-black uppercase tracking-wider text-xs border transition-all ${
                                            adjustmentData.action === 'debit'
                                                ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        📉 Décaisser / Retirer (Debit)
                                    </button>
                                </div>
                            </div>

                            {/* Montant */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-slate-500 tracking-wide">Montant de l'ajustement (XAF)</label>
                                <input
                                    type="number"
                                    placeholder="Min. 5 000 XAF"
                                    required
                                    min="5000"
                                    value={adjustmentData.amount}
                                    onChange={(e) => setAdjustmentData({...adjustmentData, amount: e.target.value})}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold h-10 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Switch Nature du mouvement : Physique vs Virtuel */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Impacter l'encaisse physique ?</p>
                                        <p className="text-[10px] font-medium text-slate-400">Cochez uniquement si des billets réels entrent/sortent du coffre.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="is_physical"
                                        checked={adjustmentData.is_physical}
                                        onChange={(e) => setAdjustmentData({...adjustmentData, is_physical: e.target.checked})}
                                        className="w-4 h-4 rounded text-green-600 border-slate-300 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            {/* Description / Motif d'audit */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-slate-500 tracking-wide">Motif explicite (Justification Audit Général)</label>
                                <textarea
                                    placeholder="Ex: Approvisionnement de ligne réseau suite à un pic de transferts..."
                                    required
                                    minLength={5}
                                    maxLength={255}
                                    rows={2}
                                    value={adjustmentData.description}
                                    onChange={(e) => setAdjustmentData({...adjustmentData, description: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Actions Formulaire */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdjustmentModalOpen(false)}
                                    className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustVaultMutation.isPending}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all"
                                >
                                    {adjustVaultMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    {adjustVaultMutation.isPending ? 'Validation...' : 'Valider le Mouvement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}