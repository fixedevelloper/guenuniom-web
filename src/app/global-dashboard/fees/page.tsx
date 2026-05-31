'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Receipt,
    Plus,
    Search,
    RefreshCw,
    ToggleLeft,
    ToggleRight,
    ArrowRight,
    X,
    Percent,
    DollarSign,
    Briefcase
} from 'lucide-react';

const fetchFeesTable = async () => {
    const { data } = await api.get('/fees');
    return data;
};

export default function GlobalFeesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Formulaire local calqué sur le schéma de migration réel
    const [formData, setFormData] = useState({
        transaction_type: 'transfer',
        source_country_id: '',
        destination_country_id: '',
        min_amount: '',
        max_amount: '',
        fixed_fee: '',
        percentage_fee: '',
        tax_percentage: '0'
    });

    const { data: fees, isLoading, isError, refetch } = useQuery({
        queryKey: ['feesTable'],
        queryFn: fetchFeesTable,
        refetchOnWindowFocus: false,
    });

    const toggleMutation = useMutation({
        mutationFn: async (uuid: string) => {
            const { data } = await api.patch(`/fees/${uuid}/toggle`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feesTable'] });
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newData: typeof formData) => {
            const { data } = await api.post('/fees', newData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feesTable'] });
            setIsModalOpen(false);
            setFormData({
                transaction_type: 'transfer',
                source_country_id: '',
                destination_country_id: '',
                min_amount: '',
                max_amount: '',
                fixed_fee: '',
                percentage_fee: '',
                tax_percentage: '0'
            });
        },
        onError: () => {
            alert("Erreur lors de la création du palier. Vérifiez les conflits de montants.");
        }
    });

    // Traducteur sémantique pour l'affichage du type de transaction
    const formatTxType = (type: string) => {
        const types: Record<string, string> = {
            transfer: 'Transfert',
            cash_in: 'Dépôt (Cash In)',
            cash_out: 'Retrait (Cash Out)',
            remittance: 'Remittance',
            merchant_payment: 'Paiement Marchand'
        };
        return types[type] || type;
    };

    // Filtrage local réactif basé sur les codes pays chargés
    const filteredFees = fees?.data?.filter((fee: any) => {
        const searchString = `${fee.source_country?.code} ${fee.destination_country?.code} ${fee.transaction_type}`.toLowerCase();
        return searchString.includes(search.toLowerCase());
    }) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Matrice des Frais & Taxes</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez les corridors de tarification, frais proportionnels et taxes d'État appliqués sur le réseau.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => refetch()} className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-xl text-slate-700 shadow-sm transition-colors">
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-green-200 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Ajouter une règle tarifaire
                    </button>
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par pays ou type (ex: CM, transfer, merchant_payment...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Chargement */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                    <p className="text-xs font-medium text-slate-400">Indexation de la table des frais...</p>
                </div>
            )}

            {/* Tableau d'affichage */}
            {!isLoading && !isError && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Service / Opération</th>
                                <th className="py-4 px-6">Corridor (Origine ➔ Dest.)</th>
                                <th className="py-4 px-6">Paliers de Montant (Dév. Origine)</th>
                                <th className="py-4 px-6 text-right">Frais Fixe</th>
                                <th className="py-4 px-6 text-right">Frais (%)</th>
                                <th className="py-4 px-6 text-right">Taxe État</th>
                                <th className="py-4 px-6 text-center">Statut</th>
                                <th className="py-4 px-6 text-center">Action</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {filteredFees.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">Aucun palier tarifaire enregistré.</td>
                                </tr>
                            ) : (
                                filteredFees.map((fee: any) => (
                                    <tr key={fee.uuid} className="hover:bg-slate-50/40 transition-colors">
                                        {/* Type d'opération */}
                                        <td className="py-4 px-6 font-semibold text-slate-900">{formatTxType(fee.transaction_type)}</td>

                                        {/* Corridor géographique harmonisé */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                <span className="bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded uppercase">{fee.source_country?.code || 'CM'}</span>
                                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                                <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded uppercase">{fee.destination_country?.code || 'CG'}</span>
                                            </div>
                                        </td>

                                        {/* Tranche de montant */}
                                        <td className="py-4 px-6 font-mono font-bold text-slate-800">
                                            {parseFloat(fee.min_amount).toLocaleString()} - {parseFloat(fee.max_amount).toLocaleString()}
                                        </td>

                                        {/* Frais fixe */}
                                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                                            {parseFloat(fee.fixed_fee) > 0 ? `${parseFloat(fee.fixed_fee).toLocaleString()}` : '—'}
                                        </td>

                                        {/* Frais pourcentage */}
                                        <td className="py-4 px-6 text-right text-green-600 font-bold">
                                            {parseFloat(fee.percentage_fee) > 0 ? `${fee.percentage_fee} %` : '—'}
                                        </td>

                                        {/* Taxe État d'origine */}
                                        <td className="py-4 px-6 text-right text-amber-600 font-bold">
                                            {parseFloat(fee.tax_percentage) > 0 ? `${fee.tax_percentage} %` : '0 %'}
                                        </td>

                                        {/* Statut */}
                                        <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${fee.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                          {fee.is_active ? 'Actif' : 'Inactif'}
                        </span>
                                        </td>

                                        {/* Toggle switch */}
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => toggleMutation.mutate(fee.uuid)}
                                                disabled={toggleMutation.isPending}
                                                className={`p-1 rounded-lg transition-colors ${fee.is_active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                            >
                                                {fee.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal d'ajout harmonisé avec la BDD */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">Ajouter un palier tarifaire</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-3.5 text-sm">

                            {/* Type de transaction (Enum requis par votre schéma) */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Nature du service</label>
                                <select
                                    value={formData.transaction_type}
                                    onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                                >
                                    <option value="transfer">Transfert Inter-pays</option>
                                    <option value="cash_in">Dépôt en agence (Cash In)</option>
                                    <option value="cash_out">Retrait en agence (Cash Out)</option>
                                    <option value="remittance">Remittance internationale</option>
                                    <option value="merchant_payment">Paiement Marchand</option>
                                </select>
                            </div>

                            {/* Pays Origine vs Destination */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">ID Pays Origine</label>
                                    <input type="number" required placeholder="Ex: 1" value={formData.source_country_id} onChange={(e) => setFormData({...formData, source_country_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">ID Pays Destination</label>
                                    <input type="number" required placeholder="Ex: 2" value={formData.destination_country_id} onChange={(e) => setFormData({...formData, destination_country_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
                                </div>
                            </div>

                            {/* Tranches de montants */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Montant Min</label>
                                    <input type="number" required placeholder="0" value={formData.min_amount} onChange={(e) => setFormData({...formData, min_amount: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Montant Max</label>
                                    <input type="number" required placeholder="1000000" value={formData.max_amount} onChange={(e) => setFormData({...formData, max_amount: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
                                </div>
                            </div>

                            {/* Frais structure */}
                            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Frais Fixe</label>
                                    <input type="number" placeholder="0" value={formData.fixed_fee} onChange={(e) => setFormData({...formData, fixed_fee: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Percent className="w-3 h-3" /> Pourcentage (%)</label>
                                    <input type="number" step="0.01" placeholder="0.00" value={formData.percentage_fee} onChange={(e) => setFormData({...formData, percentage_fee: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-green-600" />
                                </div>
                            </div>

                            {/* Taxe d'État optionnelle */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Percent className="w-3 h-3" /> Taxe Légale / État (Optionnelle)</label>
                                <input type="number" step="0.01" placeholder="Ex: 0.25 (Cameroun TOA)" value={formData.tax_percentage} onChange={(e) => setFormData({...formData, tax_percentage: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-amber-600" />
                            </div>

                            {/* Boutons */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50">Annuler</button>
                                <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md">
                                    {createMutation.isPending ? 'Sauvegarde...' : 'Appliquer le tarif'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}