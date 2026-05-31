'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    UserCheck,
    UserX,
    Search,
    FileImage,
    RefreshCw,
    ShieldAlert,
    Eye,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';

const fetchKycSubmissions = async (filters: { search: string; status: string }) => {
    const params = new URLSearchParams({ search: filters.search, status: filters.status });
    const { data } = await api.get(`/reporting/kyc-submissions?${params.toString()}`);
    return data;
};

export default function GlobalKycPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('pending'); // pending, approved, rejected
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    const { data: customers, isLoading, isError, refetch } = useQuery({
        queryKey: ['kycSubmissions', { search, status }],
        queryFn: () => fetchKycSubmissions({ search, status }),
        refetchOnWindowFocus: false,
    });

    const kycMutation = useMutation({
        mutationFn: async ({ customerUuid, action, reason }: { customerUuid: string; action: 'approve' | 'reject'; reason?: string }) => {
            const { data } = await api.post(`/customers/${customerUuid}/kyc-evaluate`, { action, reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kycSubmissions'] });
            setSelectedCustomer(null);
        },
        onError: () => {
            alert("Une erreur est survenue lors de la mise à jour de la pièce d'identité.");
        }
    });

    // Traducteur de type de pièce
    const formatDocType = (type: string) => {
        const types: Record<string, string> = {
            national_id: 'CNI (Carte Nationale d\'Identité)',
            passport: 'Passeport',
            driving_license: 'Permis de Conduire',
            residence_permit: 'Titre de Séjour'
        };
        return types[type] || type;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Validation KYC & Conformité</h1>
                    <p className="text-sm text-slate-500 mt-1">Vérification réglementaire des pièces d'identité et traçabilité des validations agents.</p>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-500" /> Actualiser
                </button>
            </div>

            {/* Onglets & Filtre Recherche */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    {[
                        { id: 'pending', label: 'À Valider', count: customers?.meta?.pending_count },
                        { id: 'approved', label: 'Approuvés' },
                        { id: 'rejected', label: 'Rejetés' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatus(tab.id); setSelectedCustomer(null); }}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                status === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Nom, Téléphone ou Référence pièce..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Liste des dossiers */}
                <div className="lg:col-span-2 space-y-3">
                    {isLoading ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                            <p className="text-xs font-medium text-slate-400">Chargement des pièces justificatives...</p>
                        </div>
                    ) : customers?.data?.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm font-medium">
                            Aucune pièce d'identité en attente dans cette catégorie.
                        </div>
                    ) : (
                        customers?.data?.map((customer: any) => (
                            <div
                                key={customer.uuid}
                                onClick={() => setSelectedCustomer(customer)}
                                className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                    selectedCustomer?.uuid === customer.uuid ? 'border-green-500 ring-2 ring-green-50 shadow-md' : 'border-slate-100 hover:border-slate-300 shadow-sm'
                                }`}
                            >
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">{customer.first_name} {customer.last_name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="font-mono">{customer.phone_number}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-slate-600">{formatDocType(customer.kyc_document?.type)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    {customer.kyc_document?.document_number}
                  </span>
                                    <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Détails et Scan d'identité */}
                <div className="lg:col-span-1">
                    {selectedCustomer ? (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5 sticky top-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-base font-bold text-slate-900">Analyse de la Pièce</h2>
                                <p className="text-xs text-slate-400 mt-0.5">ID Interne : {selectedCustomer.kyc_document?.uuid?.substring(0, 8)}...</p>
                            </div>

                            {/* Informations textuelles issues du nouveau schéma */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Données du document</h4>
                                <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs font-semibold text-slate-700">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Titulaire :</span>
                                        <span className="text-slate-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Type :</span>
                                        <span className="text-slate-900">{formatDocType(selectedCustomer.kyc_document?.type)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Numéro :</span>
                                        <span className="text-slate-900 font-mono text-green-600">{selectedCustomer.kyc_document?.document_number}</span>
                                    </div>
                                    {selectedCustomer.kyc_document?.verified_by_user && (
                                        <div className="flex justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                                            <span className="text-slate-400">Vérifié par :</span>
                                            <span className="text-emerald-700 font-bold">{selectedCustomer.kyc_document.verified_by_user.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Visionneuse Recto / Verso */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scans Numérisés</h4>

                                {/* Recto (Toujours requis) */}
                                <div className="space-y-1">
                                    <span className="text-[11px] text-slate-400 font-bold">Face Avant (Recto)</span>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${selectedCustomer.kyc_document?.front_image}`}
                                        target="_blank" rel="noreferrer"
                                        className="flex items-center gap-3 p-2.5 border border-slate-200 hover:border-green-400 rounded-xl bg-white transition-all group"
                                    >
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FileImage className="w-4 h-4" /></div>
                                        <span className="text-xs font-bold text-slate-700 truncate flex-1">Afficher le Recto</span>
                                    </a>
                                </div>

                                {/* Verso (Optionnel selon le document) */}
                                {selectedCustomer.kyc_document?.back_image && (
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-slate-400 font-bold">Face Arrière (Verso)</span>
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${selectedCustomer.kyc_document?.back_image}`}
                                            target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 p-2.5 border border-slate-200 hover:border-green-400 rounded-xl bg-white transition-all group"
                                        >
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FileImage className="w-4 h-4" /></div>
                                            <span className="text-xs font-bold text-slate-700 truncate flex-1">Afficher le Verso</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Actions de validation */}
                            {status === 'pending' && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                    <button
                                        disabled={kycMutation.isPending}
                                        onClick={() => kycMutation.mutate({ customerUuid: selectedCustomer.uuid, action: 'reject' })}
                                        className="flex items-center justify-center gap-2 border border-rose-200 bg-rose-50/30 hover:bg-rose-50 text-rose-600 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" /> Rejeter
                                    </button>
                                    <button
                                        disabled={kycMutation.isPending}
                                        onClick={() => kycMutation.mutate({ customerUuid: selectedCustomer.uuid, action: 'approve' })}
                                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                                    >
                                        <UserCheck className="w-4 h-4" /> Approuver
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs font-semibold text-slate-400 h-64 flex flex-col items-center justify-center gap-2">
                            <Clock className="w-5 h-5 text-slate-300" />
                            Sélectionnez un profil pour inspecter les faces de la pièce d'identité.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}