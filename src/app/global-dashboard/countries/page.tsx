'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    Globe,
    Plus,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    X,
    Coins,
    Phone,
    CheckCircle2,
    XCircle,
    ArrowDownLeft,
    ArrowUpRight,
    MapPin,
    Building2,
    Sliders // Nouvelle icône pour l'ajustement du wallet
} from 'lucide-react';

const fetchCountries = async () => {
    const { data } = await api.get('/countries');
    return data;
};

export default function GlobalCountriesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [selectedCountryForCities, setSelectedCountryForCities] = useState<any>(null);
    const [selectedCountryForWallet, setSelectedCountryForWallet] = useState<any>(null);
    const [newCityName, setNewCityName] = useState('');

    // Formulaire de création de pays
    const [formData, setFormData] = useState({
        name: '', code: '', currency_code: '', currency_symbol: '', phone_prefix: '',
        can_cash_in: true, can_cash_out: true, is_active: true
    });

    // Formulaire d'ajustement de portefeuille pays
    const [walletFormData, setWalletFormData] = useState({
        action: 'credit' as 'credit' | 'debit',
        amount: '',
        reference_note: ''
    });

    // Récupération des données
    const { data: countries, isLoading, refetch } = useQuery({
        queryKey: ['countriesList'],
        queryFn: fetchCountries,
        refetchOnWindowFocus: false,
    });

    // Mutation Ajustement Portefeuille Pays (Nouveau)
    const adjustWalletMutation = useMutation({
        mutationFn: async ({ countryUuid, data }: { countryUuid: string; data: typeof walletFormData }) => {
            return await api.post(`/countries/${countryUuid}/adjust-wallet`, {
                action: data.action,
                amount: parseFloat(data.amount),
                reference_note: data.reference_note
            });
        },
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({ queryKey: ['countriesList'] });
            toast.success("Ajustement de la trésorerie nationale validé avec succès", {
                description: `Écriture comptable enregistrée pour le pays.`
            });
            setIsWalletModalOpen(false);
            setWalletFormData({ action: 'credit', amount: '', reference_note: '' });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.response?.data?.message || "Échec de l'ajustement monétaire national.");
        }
    });

    // Mutation Statut Pays
    const updateStatusMutation = useMutation({
        mutationFn: async ({ uuid, field }: { uuid: string; field: string }) => {
            return await api.patch(`/countries/${uuid}/toggle-status`, { field });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['countriesList'] });
            const labelMap: Record<string, string> = {
                is_active: "Le statut global du pays",
                can_cash_in: "L'autorisation Cash In",
                can_cash_out: "L'autorisation Cash Out"
            };
            toast.success(`${labelMap[variables.field] || 'Le paramètre'} a été mis à jour.`);
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.response?.data?.message || "Impossible de modifier la configuration.");
        }
    });

    // Mutation Création Pays
    const createCountryMutation = useMutation({
        mutationFn: async (newCountry: typeof formData) => {
            return await api.post('/countries', newCountry);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['countriesList'] });
            toast.success(`Le pays ${formData.name} a été ouvert avec succès !`);
            setIsModalOpen(false);
            setFormData({ name: '', code: '', currency_code: '', currency_symbol: '', phone_prefix: '', can_cash_in: true, can_cash_out: true, is_active: true });
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.response?.data?.message || "Erreur lors de la configuration du pays.");
        }
    });

    // Mutation Création Ville
    const createCityMutation = useMutation({
        mutationFn: async ({ countryUuid, name }: { countryUuid: string; name: string }) => {
            const { data } = await api.post(`/countries/${countryUuid}/cities`, { name });
            return data;
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['countriesList'] });
            toast.success(`La ville de ${res.data?.name || 'Nouvelle Ville'} a été ajoutée.`);
            setSelectedCountryForCities((prev: any) => ({
                ...prev,
                cities: [...(prev.cities || []), res.data]
            }));
            setNewCityName('');
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.response?.data?.message || "Erreur lors de l'ajout de la ville.");
        }
    });

    // Mutation Statut Ville
    const toggleCityMutation = useMutation({
        mutationFn: async (cityUuid: string) => {
            return await api.patch(`/cities/${cityUuid}/toggle`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['countriesList'] });
            toast.success("Le statut opérationnel de la ville a été modifié.");
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.response?.data?.message || "Impossible de modifier le statut de la ville.");
        }
    });

    const handleRefetch = async () => {
        try {
            await refetch();
            toast.success("Données actualisées");
        } catch {
            toast.error("Échec de la synchronisation");
        }
    };

    const formatMoney = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(amount);
    };

    const filteredCountries = countries?.data?.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Zone de Couverture & Villes</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez la liste des pays opérationnels, déployez de nouvelles villes et configurez les restrictions de guichets.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRefetch} className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm transition-colors hover:bg-slate-50">
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md">
                        <Plus className="w-4 h-4" /> Ouvrir un pays
                    </button>
                </div>
            </div>

            {/* Barre de Recherche */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <input type="text" placeholder="Rechercher un pays (ex: Cameroun, CM...)" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all" />
            </div>

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Liste des Pays */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${selectedCountryForCities ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    {filteredCountries.map((country: any) => (
                        <div key={country.uuid} className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between transition-all ${selectedCountryForCities?.uuid === country.uuid ? 'ring-2 ring-green-500 border-transparent' : 'border-slate-200'}`}>
                            <div className="p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base text-slate-900">{country.name}</h3>
                                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{country.code}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Indicatif : {country.phone_prefix}</p>

                                        <button
                                            onClick={() => setSelectedCountryForCities(country)}
                                            className="mt-2 text-xs text-green-600 bg-green-50 hover:bg-green-100 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all"
                                        >
                                            <Building2 className="w-3.5 h-3.5" />
                                            {country.cities?.length || 0} ville(s) configurée(s)
                                        </button>
                                    </div>

                                    {/* Section Solde National + Bouton Ajustement */}
                                    <div className="text-right flex flex-col items-end gap-2 shrink-0">
                                        <div className="bg-slate-900 text-white rounded-xl p-2 text-right shadow-sm border border-slate-800">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-end gap-1"><Coins className="w-3 h-3 text-amber-400" /> Solde Central</div>
                                            <div className="text-sm font-mono font-black text-amber-400 mt-0.5">
                                                {formatMoney(country.main_wallet?.balance || 0, country.currency_code)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedCountryForWallet(country);
                                                setIsWalletModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-green-700 bg-slate-100 hover:bg-green-50 px-2 py-1 rounded-lg border border-slate-200 transition-all shadow-sm"
                                        >
                                            <Sliders className="w-3 h-3" /> Ajuster Solde
                                        </button>
                                    </div>
                                </div>

                                {/* Flux Métiers Cash In / Cash Out */}
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs font-bold">
                                    <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><ArrowDownLeft className="w-3 h-3 text-emerald-500" /> Cash In</p>
                                            <p className="text-slate-700 mt-0.5">{country.can_cash_in ? "Autorisé" : "Bloqué"}</p>
                                        </div>
                                        <button onClick={() => updateStatusMutation.mutate({ uuid: country.uuid, field: 'can_cash_in' })} className={country.can_cash_in ? 'text-green-600' : 'text-slate-300'}><ToggleRight className="w-6 h-6" /></button>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-amber-500" /> Cash Out</p>
                                            <p className="text-slate-700 mt-0.5">{country.can_cash_out ? "Autorisé" : "Bloqué"}</p>
                                        </div>
                                        <button onClick={() => updateStatusMutation.mutate({ uuid: country.uuid, field: 'can_cash_out' })} className={country.can_cash_out ? 'text-green-600' : 'text-slate-300'}><ToggleRight className="w-6 h-6" /></button>
                                    </div>
                                </div>
                            </div>

                            {/* État d'activation Global */}
                            <div className={`px-5 py-3 border-t flex items-center justify-between text-xs font-bold ${country.is_active ? 'bg-emerald-50/30' : 'bg-slate-50'}`}>
                                <span className={country.is_active ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                                  {country.is_active ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                                    {country.is_active ? "Opérationnel" : "Suspendu"}
                                </span>
                                <button onClick={() => updateStatusMutation.mutate({ uuid: country.uuid, field: 'is_active' })} className="px-3 py-1 bg-white border rounded-lg hover:bg-slate-50 shadow-sm text-[11px] font-bold">
                                    {country.is_active ? "Désactiver" : "Activer"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Panneau Latéral : Gestion des Villes */}
                {selectedCountryForCities && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-1 sticky top-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Villes : {selectedCountryForCities.name}</h3>
                                <p className="text-[11px] text-slate-400 font-medium">Ajout et restriction des zones de guichets</p>
                            </div>
                            <button onClick={() => setSelectedCountryForCities(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
                        </div>

                        {/* Formulaire d'ajout rapide de ville */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if(newCityName.trim()) createCityMutation.mutate({ countryUuid: selectedCountryForCities.uuid, name: newCityName });
                            }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                placeholder="Nom de la ville (ex: Douala)"
                                required
                                value={newCityName}
                                onChange={(e) => setNewCityName(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-500 focus:bg-white transition-all font-semibold"
                            />
                            <button
                                type="submit"
                                disabled={createCityMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                            >
                                {createCityMutation.isPending ? '...' : 'Ajouter'}
                            </button>
                        </form>

                        {/* Liste des villes */}
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {selectedCountryForCities.cities?.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 font-medium py-4">Aucune ville enregistrée pour ce pays.</p>
                            ) : (
                                selectedCountryForCities.cities?.map((city: any) => (
                                    <div key={city.uuid} className="flex items-center justify-between p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl text-xs font-semibold">
                                        <div className="flex items-center gap-2 text-slate-800">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span className={city.is_active ? '' : 'line-through text-slate-400'}>{city.name}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                toggleCityMutation.mutate(city.uuid);
                                                city.is_active = !city.is_active;
                                            }}
                                            className={city.is_active ? 'text-green-600' : 'text-slate-300'}
                                        >
                                            {city.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* MODAL N°1 : AJUSTEMENT TRÉSORERIE DU WALLET PAYS */}
            {isWalletModalOpen && selectedCountryForWallet && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-green-600" /> Ajustement de Caisse : {selectedCountryForWallet.name}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Le solde actuel est de : {formatMoney(selectedCountryForWallet.wallet_balance || 0, selectedCountryForWallet.currency_code)}</p>
                            </div>
                            <button onClick={() => setIsWalletModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            adjustWalletMutation.mutate({ countryUuid: selectedCountryForWallet.uuid, data: walletFormData });
                        }} className="space-y-4 text-sm font-medium">

                            {/* Choix de l'action : Créditer ou Débiter */}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold">Type d'opération comptable</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setWalletFormData({...walletFormData, action: 'credit'})}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${walletFormData.action === 'credit' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                    >
                                        ➕ Créditer (Approvisionner)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWalletFormData({...walletFormData, action: 'debit'})}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${walletFormData.action === 'debit' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                    >
                                        ➖ Débiter (Retrait de fonds)
                                    </button>
                                </div>
                            </div>

                            {/* Montant */}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold">Montant de l'ajustement ({selectedCountryForWallet.currency_code})</label>
                                <input
                                    type="number"
                                    placeholder="Ex: 5000000"
                                    required
                                    min="1"
                                    value={walletFormData.amount}
                                    onChange={(e) => setWalletFormData({...walletFormData, amount: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-all font-mono text-base font-bold text-slate-900"
                                />
                            </div>

                            {/* Justification de l'écriture (Obligatoire pour l'audit trail) */}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold">Référence ou Motif de l'écriture (Obligatoire)</label>
                                <textarea
                                    placeholder="Ex: Approvisionnement suite au dépôt Ecobank du 09/06/2026..."
                                    required
                                    rows={3}
                                    value={walletFormData.reference_note}
                                    onChange={(e) => setWalletFormData({...walletFormData, reference_note: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-500 transition-all font-semibold"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsWalletModalOpen(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs hover:bg-slate-50 font-bold transition-colors">Annuler</button>
                                <button
                                    type="submit"
                                    disabled={adjustWalletMutation.isPending || !walletFormData.reference_note.trim()}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs shadow-md font-bold transition-colors disabled:opacity-40"
                                >
                                    {adjustWalletMutation.isPending ? 'Exécution...' : 'Inscrire l\'écriture'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL N°2 : CONFIGURATION D'UN NOUVEAU PAYS */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Globe className="w-4 h-4 text-green-600" /> Configurer un nouveau Pays</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); createCountryMutation.mutate(formData); }} className="space-y-4 text-sm font-medium">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs text-slate-500 font-bold">Nom du Pays</label>
                                    <input type="text" placeholder="Ex: Cameroun" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-all" />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <label className="text-xs text-slate-500 font-bold">Code ISO (2)</label>
                                    <input type="text" placeholder="CM" maxLength={2} required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center uppercase focus:outline-none focus:border-green-500 transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500 font-bold">Code Devise</label>
                                    <input type="text" placeholder="XAF" maxLength={3} required value={formData.currency_code} onChange={(e) => setFormData({...formData, currency_code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:border-green-500 transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500 font-bold">Symbole Devise</label>
                                    <input type="text" placeholder="FCFA" required value={formData.currency_symbol} onChange={(e) => setFormData({...formData, currency_symbol: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center focus:outline-none focus:border-green-500 transition-all" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold">Indicatif Téléphonique International</label>
                                <input type="text" placeholder="Ex: 237" required value={formData.phone_prefix} onChange={(e) => setFormData({...formData, phone_prefix: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-green-500 transition-all" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs hover:bg-slate-50 font-bold transition-colors">Annuler</button>
                                <button type="submit" disabled={createCountryMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs shadow-md font-bold transition-colors disabled:opacity-50">
                                    {createCountryMutation.isPending ? 'Ouverture...' : 'Ouvrir le pays'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}