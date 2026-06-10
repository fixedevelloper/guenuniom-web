'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Users,
    UserPlus,
    Search,
    Smartphone,
    Mail,
    User,
    CreditCard,
    Loader2,
    CheckCircle,
    Filter,
    ShieldCheck,
    Calendar,
    FileText,
    MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import {api} from "../../../lib/api";

interface Customer {
    id: number;
    reference: string;
    name: string;
    phone: string;
    email?: string;
    id_type: string;
    id_number: string;
    id_expiry_date: string;
    kyc_status: 'pending' | 'approved' | 'rejected';
    status: 'pending' | 'active' | 'blocked' | 'blacklisted';
    wallet?: {
        wallet_number: string;
        balance: number;
    };
}

export default function CustomersPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    // État du formulaire aligné sur les validations strictes de ton store()
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        id_type: 'CNI',
        id_number: '',
        id_expiry: '',
        dob: '',
        address: '',
        country_id: '1', // ID Cameroun par défaut
        city_id: '1',    // ID Douala par défaut
        initial_balance: '0'
    });

    // 1. Récupération de la liste des clients (Consomme la méthode customers())
    const { data: serverResponse, isLoading } = useQuery({
        queryKey: ['customersList', searchTerm],
        queryFn: async () => {
            // On passe le terme de recherche directement à l'API pour profiter du filtrage SQL croisé
            const params = searchTerm ? { search: searchTerm, status: 'active' } : { status: 'active' };
            const res = await api.get('/customers', { params });
            return res.data;
        }
    });

    const customers: Customer[] = serverResponse?.data || [];

    // 2. Mutation pour l'immatriculation KYC au guichet
    const createCustomerMutation = useMutation({
        mutationFn: async (newCustomer: typeof formData) => {
            const res = await api.post('/customers', newCustomer);
            return res.data;
        },
        onSuccess: () => {
            // Notification de succès
            toast.success('Profil client créé et validé avec succès au guichet !');

            // Réinitialisation complète du formulaire
            setFormData({
                first_name: '',
                last_name: '',
                phone: '',
                email: '',
                id_type: 'CNI',
                id_number: '',
                id_expiry: '',
                dob: '',
                address: '',
                country_id: '1',
                city_id: '1',
                initial_balance: '0'
            });

            // Rafraîchissement de la liste des clients
            queryClient.invalidateQueries({ queryKey: ['customersList'] });
        },
        onError: (error: any) => {
            // Notification d'erreur avec message dynamique du backend Laravel
            toast.error(error?.response?.data?.message || 'Erreur lors de l\'immatriculation du client.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validations basiques côté client avant soumission
        if (!formData.first_name || !formData.last_name || !formData.phone || !formData.id_number) {
            toast.error('Veuillez remplir tous les champs obligatoires (*).');
            return;
        }

        createCustomerMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">

            {/* ─── EN-TÊTE DE LA PAGE ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Gestion du Portefeuille Clients</h1>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Immatriculation physique, validation KYC de visu et consultation des soldes.</p>
                    </div>
                </div>

                {/* Champ de recherche rapide relié au Backend */}
                <div className="relative max-w-md w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Rechercher par nom, téléphone ou référence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none"
                    />
                </div>
            </div>

            {/* ─── GRILLE PRINCIPALE DE TRAVAIL ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* COLONNE GAUCHE : FORMULAIRE D'IMMATRICULATION COMPLETE (KYC GUICHET) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200/60 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">Immatriculation Guichet (KYC FULL)</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-4">

                        {/* Section : État Civil */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Prénom <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400"><User className="w-3.5 h-3.5" /></span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Lorenzo"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Nom <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Kamga"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Téléphone <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400"><Smartphone className="w-3.5 h-3.5" /></span>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="237677XXXXXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold font-mono outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Date de Naissance <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        required
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        className="w-full px-2 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Adresse Email</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400"><Mail className="w-3.5 h-3.5" /></span>
                                <input
                                    type="email"
                                    placeholder="lorenzo@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section : Documents KYC réglementaires */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Type de Pièce <span className="text-rose-500">*</span></label>
                                <select
                                    value={formData.id_type}
                                    onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                                    className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="CNI">CNI</option>
                                    <option value="PASSPORT">Passeport</option>
                                    <option value="DRIVING_LICENSE">Permis de Conduire</option>
                                    <option value="REFUGEE_CARD">Carte Réfugié</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">N° de la Pièce <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400"><FileText className="w-3.5 h-3.5" /></span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="N° ID"
                                        value={formData.id_number}
                                        onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold font-mono uppercase outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Expiration Pièce <span className="text-rose-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={formData.id_expiry}
                                    onChange={(e) => setFormData({ ...formData, id_expiry: e.target.value })}
                                    className="w-full px-2 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Ville de résidence <span className="text-rose-500">*</span></label>
                                <select
                                    value={formData.city_id}
                                    onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                                    className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                >
                                    <option value="1">Douala</option>
                                    <option value="2">Yaoundé</option>
                                    <option value="3">Ngaoundéré</option>
                                    <option value="4">Garoua</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Adresse Physique / Quartier</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400"><MapPin className="w-3.5 h-3.5" /></span>
                                <input
                                    type="text"
                                    placeholder="Ex: Akwa, Rue Joffre"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
                                />
                            </div>
                        </div>

                        {/* Masqué ou figé pour respecter la barrière géographique du cashier */}
                        <input type="hidden" value={formData.country_id} />

                        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60">
                            <label className="block text-[10px] font-extrabold uppercase text-indigo-900 mb-1">Versement d'Ouverture (Espèces)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500"><CreditCard className="w-3.5 h-3.5" /></span>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.initial_balance}
                                    onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                                    className="w-full pl-8 pr-12 py-2 bg-white border border-indigo-200 focus:border-indigo-500 rounded-xl text-xs font-black font-mono text-indigo-700 outline-none"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[10px] font-black text-indigo-500">XAF</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={createCustomerMutation.isPending}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center gap-2"
                        >
                            {createCustomerMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <><CheckCircle className="w-4 h-4" /> Enregistrer & Ouvrir le Compte</>
                            )}
                        </button>
                    </form>
                </div>

                {/* COLONNE DROITE : LE LIVRE / TABLEAU DES COMPTES COMPLETS */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">Registre des Comptes Filtrés</h2>
                        </div>
                        <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-[10px] font-extrabold font-mono">
                            {customers.length} Actifs affichés
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <p className="text-xs font-medium">Recherche dans le livre des comptes...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 border-dashed border-2 border-slate-100 m-4 rounded-xl">
                            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-bold">Aucun dossier client ne correspond à cette recherche.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-slate-50/50 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-100">
                                    <th className="py-3 px-6">Identifiant / Titulaire</th>
                                    <th className="py-3 px-4">Pièce Identité (KYC)</th>
                                    <th className="py-3 px-4">N° Portefeuille</th>
                                    <th className="py-3 px-4 text-right">Solde Actuel</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                {customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                        {/* Identité */}
                                        <td className="py-3.5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-extrabold font-mono text-indigo-600 tracking-wider">{c.reference}</span>
                                                <span className="font-bold text-slate-900 tracking-tight mt-0.5">{c.name}</span>
                                                <span className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <Smartphone className="w-3 h-3 text-slate-400" /> {c.phone}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Pièce d'identité enregistrée */}
                                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-[11px]">{c.id_type} — {c.id_number}</span>
                                                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">Exp: {c.id_expiry_date}</span>
                                            </div>
                                        </td>

                                        {/* Numéro de Portefeuille Polymorphe */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-indigo-900 bg-indigo-50/50 border border-indigo-100/60 px-2 py-1 rounded-lg w-max">
                                                <ShieldCheck className="w-3 h-3 text-indigo-500" />
                                                {c.wallet?.wallet_number || 'WLT-CLN-PENDING'}
                                            </div>
                                        </td>

                                        {/* Balance Comptable */}
                                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                                            {new Intl.NumberFormat('fr-FR').format(c.wallet?.balance || 0)}
                                            <span className="text-[10px] ml-1 text-slate-400 font-sans font-medium">XAF</span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}