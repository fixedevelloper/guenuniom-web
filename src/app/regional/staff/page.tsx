'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Users,
    Search,
    RefreshCw,
    UserPlus,
    Building2,
    Shield,
    CheckCircle2,
    XCircle,
    Mail,
    Phone,
    UserCheck,
    UserX,
    Filter,
    AlertCircle,
    X
} from 'lucide-react';

// Appels API
const fetchStaffMetrics = async (filters: { role: string; search: string }) => {
    const { data } = await api.get('/reporting/regional/staff', { params: filters });
    return data;
};

const fetchAgenciesList = async () => {
    const { data } = await api.get('/reporting/regional/agencies');
    return data; // Pour alimenter le select du formulaire
};

export default function GlobalStaffPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // États pour la gestion du Modal d'enrôlement
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        employee_code: '',
        role: 'cashier',
        agency_id: '',
        password: '', // Optionnel ou généré par défaut en back
    });

    // 1. Récupération des données (Staff + Agences pour le formulaire)
    const { data: staffData, isLoading, isError, refetch } = useQuery({
        queryKey: ['regionalStaffList', roleFilter, search],
        queryFn: () => fetchStaffMetrics({ role: roleFilter, search }),
        refetchInterval: 30000,
    });

    const { data: agenciesData } = useQuery({
        queryKey: ['regionalAgenciesListForStaffForm'],
        queryFn: fetchAgenciesList,
        enabled: isModalOpen, // Ne charge les agences que si le formulaire s'ouvre
    });

    const staffList = staffData?.data || [];
    const agenciesList = agenciesData?.data || [];

    // 2. Mutation pour Enrôler un nouveau Staff
    const createStaffMutation = useMutation({
        mutationFn: async (newStaff: typeof formData) => {
            const { data } = await api.post('/staff', newStaff);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regionalStaffList'] });
            setIsModalOpen(false); // Fermer le modal
            setFormData({ // Réinitialiser le formulaire
                first_name: '', last_name: '', email: '', phone: '',
                employee_code: '', role: 'cashier', agency_id: '', password: ''
            });
        },
        onError: (error: any) => {
            alert(error?.response?.data?.message || "Erreur lors de l'enrôlement de l'agent.");
        }
    });

    // 3. Mutation pour Activer/Désactiver un compte d'agent
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ staffUuid, currentStatus }: { staffUuid: string; currentStatus: boolean }) => {
            const { data } = await api.patch(`/staff/${staffUuid}/toggle-status`, {
                is_active: !currentStatus
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regionalStaffList'] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation de sécurité de premier niveau
        if (!formData.agency_id) {
            alert("Veuillez affecter une agence à ce collaborateur.");
            return;
        }

        if (formData.password.length < 6) {
            alert("Le mot de passe provisoire doit contenir au moins 6 caractères.");
            return;
        }

        // 2. Normalisation des données pour correspondre aux attentes de Laravel
        const payload = {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            // Reconstruction du nom complet pour la table 'users' standard si nécessaire
            name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            employee_code: formData.employee_code.trim().toUpperCase(), // Normalisation du matricule
            role: formData.role, // 'cashier' ou 'agency_manager'
            agency_id: String(formData.agency_id), // Cast propre en entier pour les clés étrangères
            password: formData.password,
        };

        // 3. Expédition réelle vers l'API
        createStaffMutation.mutate(payload);
    };

    // Indicateurs RH rapides
    const totalStaff = staffList.length;
    const activeStaff = staffList.filter((s: any) => s.is_active).length;
    const cashiersCount = staffList.filter((s: any) => s.role_name === 'cashier').length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen relative">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Équipes (Staff)</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Contrôlez les accès applicatifs, affectez les agents aux guichets et révoquez instantanément des habilitations.
                    </p>
                </div>
                <div className="flex gap-2 self-start">
                    <button
                        onClick={() => refetch()}
                        className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-slate-700 shadow-sm transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-[#1d9e4b] hover:bg-[#1a8e43] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all"
                    >
                        <UserPlus className="w-4 h-4" /> Enrôler un Agent
                    </button>
                </div>
            </div>

            {/* Cartes Métriques RH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Effectif National</p>
                        <p className="text-2xl font-bold text-slate-900">{totalStaff} <span className="text-sm font-medium text-slate-400">collaborateurs</span></p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-green-600"><Users className="w-5 h-5" /></div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comptes Actifs</p>
                        <p className="text-2xl font-bold text-emerald-600">{activeStaff} <span className="text-sm font-medium text-slate-400">opérationnels</span></p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><UserCheck className="w-5 h-5" /></div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guichetiers (Cashiers)</p>
                        <p className="text-2xl font-bold text-green-900">{cashiersCount} <span className="text-sm font-medium text-slate-400">front-offices</span></p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-green-600"><Shield className="w-5 h-5" /></div>
                </div>
            </div>

            {/* Filtres de Recherche */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, matricule, email d'un agent..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                    >
                        <option value="all">Tous les profils</option>
                        <option value="cashier">Caissiers / Guichetiers</option>
                        <option value="agency_manager">Superviseurs d'Agences</option>
                    </select>
                </div>
            </div>

            {/* Liste du personnel (Grille) */}
            {isLoading ? (
                <div className="text-center p-12 text-xs font-medium text-slate-400">Chargement...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staffList.map((agent: any) => (
                        <div key={agent.id} className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-5 flex flex-col justify-between space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 tracking-tight">{agent.name}</h3>
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold">
                                        {agent.employee_code || `MAT-${agent.id}`}
                                    </span>
                                </div>
                                <span className="bg-green-50 border border-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                    {agent.role_label || agent.role_name}
                                </span>
                            </div>
                            <div className="space-y-2 text-xs text-slate-600">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 font-semibold">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    {agent.agency_name}
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                <span className="font-bold">{agent.is_active ? '✅ Accès Actif' : '❌ Suspendu'}</span>
                                <button
                                    onClick={() => toggleStatusMutation.mutate({ staffUuid: agent.uuid, currentStatus: agent.is_active })}
                                    className="text-xs font-bold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-xl hover:bg-slate-50"
                                >
                                    Modifier statut
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========================================================================= */}
            {/* COMPOSANT FORMULAIRE ENRÔLEMENT (MODAL FLOTTANT)                          */}
            {/* ========================================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">

                        {/* En-tête Modal */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Enrôler un nouvel agent</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Créez le compte d'accès et affectez l'opérateur à son guichet physique.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Corps du Formulaire */}
                        <form onSubmit={handleSubmit} id="enrollment-form" className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">

                            {/* Ligne Identité */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Prénom</label>
                                    <input
                                        type="text" required
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white"
                                        placeholder="Ex: Rodrigue"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nom de famille</label>
                                    <input
                                        type="text" required
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white"
                                        placeholder="Ex: Mbah"
                                    />
                                </div>
                            </div>

                            {/* Code Employé / Matricule */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Matricule Interne (Code Unique)</label>
                                <input
                                    type="text" required
                                    value={formData.employee_code}
                                    onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-green-500 focus:bg-white"
                                    placeholder="Ex: AG-2026-CASH04"
                                />
                            </div>

                            {/* Contacts */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Adresse Email Professionnelle</label>
                                <input
                                    type="email" required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white"
                                    placeholder="agent@agensic.com"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Numéro de Téléphone (WhatsApp/SMS)</label>
                                <input
                                    type="tel" required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white"
                                    placeholder="Ex: +237 6XXXXXXXX"
                                />
                            </div>

                            {/* Mot de passe initial */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mot de passe provisoire</label>
                                <input
                                    type="password" required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>

                            <hr className="border-slate-100 my-2" />

                            {/* Affectation Structurelle (Rôle et Agence) */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Habilitation / Rôle Système</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none"
                                >
                                    <option value="cashier">Caissier / Guichetier (Front Office)</option>
                                    <option value="manager">Manager / Superviseur d'Agence</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Affectation à l'Agence Physique</label>
                                <select
                                    value={formData.agency_id}
                                    required
                                    onChange={(e) => setFormData({...formData, agency_id: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:border-green-500"
                                >
                                    <option value="">-- Sélectionner une agence du territoire --</option>
                                    {agenciesList.map((agency: any) => (
                                        <option key={agency.id} value={agency.id}>
                                            {agency.name} ({agency.city || 'Métropole'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                        </form>

                        {/* Pied de Modal (Actions) */}
                        <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                form="enrollment-form"
                                disabled={createStaffMutation.isPending}
                                className="flex-1 py-2.5 bg-[#1d9e4b] hover:bg-green-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all disabled:bg-slate-200 disabled:text-slate-400"
                            >
                                {createStaffMutation.isPending ? 'Enrôlement...' : 'Valider l\'accès'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}