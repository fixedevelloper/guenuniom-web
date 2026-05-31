'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Users,
    Search,
    RefreshCw,
    X,
    Shield,
    MapPin,
    Building2,
    Mail,
    Phone,
    UserPlus,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';

// Appels API
const fetchStaff = async () => {
    const { data } = await api.get('/staff');
    return data;
};

const fetchCountriesAndAgencies = async () => {
    const { data } = await api.get('/staff/dependencies');
    return data; // Attend : { countries: [...], agencies: [...] }
};

export default function GlobalStaffPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Formulaire de création de personnel (Aligné sur l'écosystème Spatie BDD)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        role: 'cashier',
        country_id: '',
        agency_id: '',
    });

    // 1. Récupération de la liste du personnel
    const { data: staffData, isLoading, isError, refetch } = useQuery({
        queryKey: ['staffList'],
        queryFn: fetchStaff,
        refetchOnWindowFocus: false,
    });

    // 2. Récupération des dépendances (Pays & Agences)
    const { data: dependencies } = useQuery({
        queryKey: ['staffDependencies'],
        queryFn: fetchCountriesAndAgencies,
        enabled: isModalOpen,
    });

    // 3. Mutation pour créer un membre du staff
    const createStaffMutation = useMutation({
        mutationFn: async (newStaff: typeof formData) => {
            const { data } = await api.post('/staff', newStaff);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffList'] });
            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone_number: '', password: '', role: 'cashier', country_id: '', agency_id: '' });
        },
        onError: (error: any) => {
            alert(error?.response?.data?.message || "Erreur lors de la création de l'utilisateur.");
        }
    });

    // 4. Mutation pour suspendre / activer un compte staff via son UUID d'authentification
    const toggleStatusMutation = useMutation({
        mutationFn: async (userUuid: string) => {
            const { data } = await api.patch(`/staff/${userUuid}/toggle`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffList'] });
        },
        onError: (error: any) => {
            alert(error?.response?.data?.message || "Erreur lors de la modification du statut.");
        }
    });

    // Filtrer les agences dans le formulaire en fonction du pays sélectionné
    const availableAgencies = dependencies?.agencies?.filter(
        (agency: any) => agency.country_id === parseInt(formData.country_id)
    ) || [];

    // ALIGNEMENT : Filtrage local basé sur la structure renvoyée par le StaffController (data = liste formatée d'utilisateurs)
    const filteredStaff = staffData?.data?.filter((user: any) => {
        const searchString = `${user.name} ${user.email} ${user.phone_number || ''} ${user.role || ''} ${user.employee_code || ''}`.toLowerCase();
        return searchString.includes(search.toLowerCase());
    }) || [];

    // Configuration visuelle des badges de rôles
    const roleLabels: Record<string, { label: string; color: string }> = {
        super_admin: { label: 'Super Admin', color: 'bg-rose-50 text-rose-700 border-rose-100' },
        country_admin: { label: 'Admin Pays', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        compliance: { label: 'Compliance / KYC', color: 'bg-amber-50 text-amber-700 border-amber-100' },
        manager: { label: 'Manager Agence', color: 'bg-purple-50 text-purple-700 border-purple-100' },
        cashier: { label: 'Caissier / Guichet', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        auditor: { label: 'Auditeur', color: 'bg-teal-50 text-teal-700 border-teal-100' },
        support: { label: 'Support Technique', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Équipes & Staff</h1>
                    <p className="text-sm text-slate-500 mt-1">Supervisez les habilitations de sécurité, créez des comptes agents et assignez vos collaborateurs à des agences.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => refetch()} className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-slate-700 shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-green-200 transition-all"
                    >
                        <UserPlus className="w-4 h-4" /> Enregistrer un collaborateur
                    </button>
                </div>
            </div>

            {/* Recherche */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email, téléphone ou rôle..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Loader */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                    <p className="text-xs font-medium text-slate-400">Indexation de l'annuaire du personnel...</p>
                </div>
            )}

            {/* Erreur de chargement */}
            {isError && (
                <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center text-rose-600">
                    Une erreur est survenue lors du chargement des données de l'équipe. Veuillez vérifier vos habilitations.
                </div>
            )}

            {/* Tableau du Personnel */}
            {!isLoading && !isError && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Collaborateur / Contact</th>
                                <th className="py-4 px-6">Code Employé</th>
                                <th className="py-4 px-6">Habilitation / Rôle</th>
                                <th className="py-4 px-6">Zone (Pays)</th>
                                <th className="py-4 px-6">Affectation Agence</th>
                                <th className="py-4 px-6 text-center">Statut du Compte</th>
                                <th className="py-4 px-6 text-center">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">Aucun membre d'équipe trouvé.</td>
                                </tr>
                            ) : (
                                filteredStaff.map((user: any) => {
                                    return (
                                        <tr key={user.uuid} className="hover:bg-slate-50/40 transition-colors">
                                            {/* Identité */}
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-400 flex flex-col gap-0.5 mt-1 font-normal">
                                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone_number || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Code Employé */}
                                            <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                                                {user.employee_code}
                                            </td>

                                            {/* Rôle */}
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${roleLabels[user.role]?.color || 'bg-slate-50 text-slate-600'}`}>
                                                  <Shield className="w-3 h-3 mr-1" />
                                                    {roleLabels[user.role]?.label || user.role}
                                                </span>
                                            </td>

                                            {/* Pays */}
                                            <td className="py-4 px-6 text-slate-800">
                                                <div className="flex items-center gap-1.5 font-semibold">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    {user.country_name !== '—' ? user.country_name : <span className="text-slate-400 font-normal">Global (Siège)</span>}
                                                </div>
                                            </td>

                                            {/* Agence d'appartenance */}
                                            <td className="py-4 px-6 text-slate-800">
                                                <div className="flex items-center gap-1.5 font-semibold">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    {user.agency_name !== 'Hors-Réseau / Siège' ? user.agency_name : <span className="text-slate-400 font-normal">Hors-Guichet</span>}
                                                </div>
                                            </td>

                                            {/* Statut (Actif/Bloqué) */}
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                  {user.is_active ? 'Actif' : 'Suspendu'}
                                                </span>
                                            </td>

                                            {/* Activation / Désactivation instantanée */}
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => toggleStatusMutation.mutate(user.uuid)}
                                                    disabled={toggleStatusMutation.isPending}
                                                    className={`p-1 rounded-lg transition-colors ${user.is_active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                    title={user.is_active ? "Suspendre le compte" : "Activer le compte"}
                                                >
                                                    {user.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Création Multi-Rôles */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-green-600" /> Enregistrer un Utilisateur Staff</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); createStaffMutation.mutate(formData); }} className="space-y-4 text-sm font-medium">

                            {/* Informations Générales */}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold">Nom Complet du collaborateur</label>
                                <input type="text" placeholder="Ex: Lorenzo Mbah" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500 font-bold">Adresse Email (Login)</label>
                                    <input type="email" placeholder="lorenzo@agensic.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500 font-bold">N° de Téléphone mobile</label>
                                    <input type="text" placeholder="+237690000000" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold">Mot de passe initial</label>
                                <input type="password" placeholder="••••••••••••" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>

                            {/* Rôles synchronisés sur les enums du backend */}
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 font-bold">Habilitation / Rôle Sécurité</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value, country_id: '', agency_id: ''})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                                >
                                    <option value="super_admin">Super Admin (Accès Réseau Total)</option>
                                    <option value="country_admin">Admin Pays (Gestion Nationale)</option>
                                    <option value="compliance">Compliance / KYC Officer (Validation des pièces)</option>
                                    <option value="manager">Manager d'Agence (Gestion Locale Guichets)</option>
                                    <option value="cashier">Guichetier / Agent de Caisse (Dépôts / Retraits)</option>
                                    <option value="auditor">Auditeur Réseau</option>
                                    <option value="support">Support Technique / Opérationnel</option>
                                </select>
                            </div>

                            {/* Conditionnel : Pays (Masqué pour le super_admin) */}
                            {formData.role !== 'super_admin' && (
                                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-bold flex items-center gap-1"><MapPin className="w-3 h-3 text-green-500" /> Pays de Rattachement</label>
                                        <select
                                            required
                                            value={formData.country_id}
                                            onChange={(e) => setFormData({...formData, country_id: e.target.value, agency_id: ''})}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                                        >
                                            <option value="">Sélectionner un pays</option>
                                            {dependencies?.countries?.map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Conditionnel : Agence (Affiché uniquement pour manager, cashier et support) */}
                                    {['manager', 'cashier', 'support'].includes(formData.role) && (
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 font-bold flex items-center gap-1"><Building2 className="w-3 h-3 text-purple-500" /> Agence Assignée</label>
                                            <select
                                                required
                                                disabled={!formData.country_id}
                                                value={formData.agency_id}
                                                onChange={(e) => setFormData({...formData, agency_id: e.target.value})}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 disabled:opacity-50"
                                            >
                                                <option value="">Sélectionner une agence</option>
                                                {availableAgencies.map((a: any) => (
                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Validation */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50">Annuler</button>
                                <button type="submit" disabled={createStaffMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
                                    {createStaffMutation.isPending ? 'Création...' : 'Créer le compte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}