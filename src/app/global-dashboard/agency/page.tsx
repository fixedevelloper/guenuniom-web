'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Building2,
    Plus,
    Search,
    RefreshCw,
    X,
    MapPin,
    Globe,
    ToggleLeft,
    ToggleRight,
    CheckCircle2,
    XCircle,
    Wallet,
    Coins,
    Hash
} from 'lucide-react';
import {toast} from "sonner";

// Appels API
const fetchAgencies = async () => {
    const { data } = await api.get('/agencies');
    return data;
};

export default function GlobalAgenciesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Formulaire de création aligné sur les exigences de validation Laravel
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        address: '',
        country_id: '',
        city_id: '',
        status: 'active', // Requis par l'API (active, suspended, closed)
        is_active: true   // Requis par l'API (boolean)
    });

    // 1. Récupération de la liste des agences
    const { data: agenciesData, isLoading, isError, refetch } = useQuery({
        queryKey: ['agenciesList'],
        queryFn: fetchAgencies,
        refetchOnWindowFocus: false,
    });

    // 2. Récupération des pays et villes liés
    const { data: countries } = useQuery({
        queryKey: ['countriesList'],
        queryFn: async () => {
            const { data } = await api.get('/countries');
            return data.data;
        },
        enabled: isModalOpen,
    });

    // Helper pour générer un code agence basé sur le nom saisi (Ex: "Agence Akwa" -> "AGE-AKWA")
    const handleNameChange = (name: string) => {
        const generatedCode = 'AGE-' + name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 8);

        setFormData(prev => ({
            ...prev,
            name,
            code: prev.code ? prev.code : generatedCode // Ne remplace pas si l'utilisateur a personnalisé le code
        }));
    };

// 3. Mutation pour créer une agence
    const createAgencyMutation = useMutation({
        mutationFn: async (newAgency: typeof formData) => {
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
        onSuccess: (res) => {
            // Notification de succès avec le nom de l'agence créée
            toast.success(`L'agence "${formData.name || 'Nouvelle Agence'}" a été créée avec succès !`);

            queryClient.invalidateQueries({ queryKey: ['agenciesList'] });
            setIsModalOpen(false);
            setErrorMessage(null);
            setFormData({ code: '', name: '', address: '', country_id: '', city_id: '', status: 'active', is_active: true });
        },
        onError: (error: any) => {
            const errorMsg = error?.response?.data?.message || "Impossible de configurer cette agence.";
            setErrorMessage(errorMsg); // Conserve votre état local si nécessaire
            toast.error(errorMsg);     // Alerte visuelle par toast
        }
    });

// 4. Mutation pour suspendre / activer une agence au clic
    const toggleAgencyMutation = useMutation({
        mutationFn: async (uuid: string) => {
            const { data } = await api.patch(`/agencies/${uuid}/toggle`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenciesList'] });
            // Notification globale de mise à jour du statut
            toast.success("Le statut opérationnel de l'agence a été mis à jour.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Erreur lors de la modification du statut de l'agence.");
        }
    });


// Déduction des villes du pays sélectionné (Sécurisé contre les objets non-tableaux)
    const countriesArray = Array.isArray(countries)
        ? countries
        : (countries as any)?.data || [];

    const availableCities = countriesArray.find(
        (country: any) => country.id === parseInt(formData.country_id)
    )?.cities || [];

    // Filtrage local pour la barre de recherche
    const filteredAgencies = agenciesData?.data?.filter((agency: any) => {
        const searchString = `${agency.name} ${agency.code} ${agency.address} ${agency.city_name} ${agency.country_name}`.toLowerCase();
        return searchString.includes(search.toLowerCase());
    }) || [];

    return (
        <div className="p-1 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-screen animate-in fade-in duration-300">

            {/* En-tête élargi */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
                <div className="space-y-1">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span className="p-2 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20">
                            <Building2 className="w-5 h-5" />
                        </span>
                        Réseau d'Agences & Guichets
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Configurez les points de vente physiques du réseau, gérez leur implantation géographique et suivez leur état opérationnel.</p>
                </div>
                <div className="flex gap-2.5 self-start sm:self-center">
                    <button onClick={() => refetch()} className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-slate-700 shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                        onClick={() => { setErrorMessage(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-green-200/50 transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" /> Enregistrer une agence
                    </button>
                </div>
            </div>

            {/* Barre de recherche style épuré */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, code, ville, pays d'implantation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Loader d'attente */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3 shadow-sm">
                    <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                    <p className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Cartographie du réseau de guichets...</p>
                </div>
            )}

            {/* Grid des cartes Agences étalée sur Grand Écran */}
            {!isLoading && !isError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAgencies.length === 0 ? (
                        <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400 text-xs font-bold uppercase tracking-wide">
                            Aucune agence ne correspond à vos critères d'exploitation.
                        </div>
                    ) : (
                        filteredAgencies.map((agency: any) => (
                            <div key={agency.uuid} className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between group hover:border-slate-300 transition-all ${!agency.is_active ? 'opacity-75 bg-slate-50/50' : 'border-slate-200/80'}`}>

                                <div className="p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono font-black tracking-widest text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-lg">
                                                <Hash className="w-2.5 h-2.5" /> {agency.code}
                                            </span>
                                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-green-600 transition-colors flex items-center gap-1.5 mt-1 truncate">
                                                {agency.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5 truncate">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="font-semibold text-slate-600">{agency.city_name}</span> — {agency.address}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl flex items-center gap-1 text-[10px] font-black text-slate-600 font-mono shrink-0">
                                            <Globe className="w-3 h-3 text-slate-400" />
                                            {agency.country_code || 'N/A'}
                                        </div>
                                    </div>

                                    {/* Section Financière Épurée */}
                                    <div className="bg-slate-950 text-white rounded-xl p-3.5 flex items-center justify-between shadow-inner">
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                                                <Wallet className="w-2.5 h-2.5 text-slate-500" /> En-cours Coffre Global
                                            </p>
                                            <p className="text-base font-mono font-black text-emerald-400 tracking-tight">
                                                {new Intl.NumberFormat('fr-FR').format(agency.current_balance || 0)}
                                            </p>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5 font-mono">
                                            <Coins className="w-3 h-3 text-amber-400" />
                                            {agency.currency_code || 'XAF'}
                                        </div>
                                    </div>
                                </div>

                                {/* Pied de Carte : Actions de blocage */}
                                <div className={`px-5 py-2.5 border-t flex items-center justify-between text-xs font-bold ${agency.is_active ? 'bg-emerald-50/20 border-emerald-100/60' : 'bg-slate-50 border-slate-200/60'}`}>
                                    <div className="flex items-center gap-1.5">
                                        {agency.is_active ? (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="text-emerald-700 font-bold text-[11px]">Guichet Ouvert</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-slate-500 font-bold text-[11px]">Guichet Suspendu</span>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleAgencyMutation.mutate(agency.uuid)}
                                        disabled={toggleAgencyMutation.isPending}
                                        className="p-0.5 rounded-lg text-green-600 transition-all disabled:opacity-50 hover:scale-105"
                                    >
                                        {agency.is_active ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                                    </button>
                                </div>

                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal de Configuration Ajustée */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-green-600" /> Configurer une Agence
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"><X className="w-4 h-4" /></button>
                        </div>

                        {/* Message d'erreur de validation API */}
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

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 tracking-wide">Pays d'implantation</label>
                                    <select
                                        required
                                        value={formData.country_id}
                                        onChange={(e) => setFormData({...formData, country_id: e.target.value, city_id: ''})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 h-10 focus:outline-none focus:border-green-500 transition-all"
                                    >
                                        <option value="">Choisir un pays</option>
                                        {countries?.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 tracking-wide">Ville rattachée</label>
                                    <select
                                        required
                                        disabled={!formData.country_id}
                                        value={formData.city_id}
                                        onChange={(e) => setFormData({...formData, city_id: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 h-10 disabled:opacity-50 focus:outline-none focus:border-green-500 transition-all"
                                    >
                                        <option value="">Choisir une ville</option>
                                        {availableCities.map((city: any) => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
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

        </div>
    );
}