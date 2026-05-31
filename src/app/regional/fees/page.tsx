'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Percent, Plus, RefreshCw, Search, ShieldAlert, Trash2, ArrowLeftRight, X, Globe } from 'lucide-react';

export default function GlobalFeesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Structure de données synchronisée sur votre enum et vos colonnes de frais cumulables
    const [formData, setFormData] = useState({
        transaction_type: 'transfer',
        destination_country_id: '',
        min_amount: '',
        max_amount: '',
        fixed_fee: '0',
        percentage_fee: '0',
        tax_percentage: '0'
    });

    const { data: feesData, isLoading, isError, refetch } = useQuery({
        queryKey: ['regionalFeesList', typeFilter, search],
        queryFn: async () => {
            const { data } = await api.get('/regional/fees', { params: { type: typeFilter, search } });
            return data;
        },
    });

    // Également besoin des pays pour définir la destination (ex: Cameroun -> Gabon)
    const { data: countriesData } = useQuery({
        queryKey: ['countriesListForFees'],
        queryFn: async () => {
            const { data } = await api.get('/countries'); // À adapter selon votre route d'extraction des pays
            return data;
        },
        enabled: isModalOpen
    });

    const feesList = feesData?.data || [];
    const countriesList = countriesData?.data || [];

    const createFeeMutation = useMutation({
        mutationFn: async (newFee: typeof formData) => {
            const { data } = await api.post('/regional/fees', newFee);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regionalFeesList'] });
            setIsModalOpen(false);
            setFormData({ transaction_type: 'transfer', destination_country_id: '', min_amount: '', max_amount: '', fixed_fee: '0', percentage_fee: '0', tax_percentage: '0' });
        },
        onError: (error: any) => alert(error?.response?.data?.message || "Erreur de configuration.")
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(formData.min_amount) >= Number(formData.max_amount)) {
            alert("Le montant minimum doit être inférieur au montant maximum.");
            return;
        }
        createFeeMutation.mutate(formData);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
            {/* En-tête */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Grilles Tarifaires Multi-Frais</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez les frais fixes, variables et les taxes par corridor pays.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#1d9e4b] hover:bg-green-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all">
                    <Plus className="w-4 h-4" /> Configurer un Palier
                </button>
            </div>

            {/* Tableau principal mis à jour */}
            {!isLoading && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Corridor (Origine → Destination)</th>
                                <th className="py-4 px-6">Type</th>
                                <th className="py-4 px-6">Paliers Montant</th>
                                <th className="py-4 px-6">Frais Fixe</th>
                                <th className="py-4 px-6">Frais Variable (%)</th>
                                <th className="py-4 px-6">Taxe / TVA (%)</th>
                                <th className="py-4 px-6 text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {feesList.map((rule: any) => (
                                <tr key={rule.id} className="hover:bg-slate-50/40">
                                    <td className="py-4 px-6 flex items-center gap-2 font-semibold">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        <span>{rule.source_country_name}</span>
                                        <span className="text-slate-400">→</span>
                                        <span className="text-green-600">{rule.destination_country_name}</span>
                                    </td>
                                    <td className="py-4 px-6 font-mono text-xs uppercase">{rule.transaction_type}</td>
                                    <td className="py-4 px-6 font-mono text-slate-900">
                                        [{new Intl.NumberFormat('fr-FR').format(rule.min_amount)} - {new Intl.NumberFormat('fr-FR').format(rule.max_amount)}]
                                    </td>
                                    <td className="py-4 px-6 font-mono text-emerald-600">{new Intl.NumberFormat('fr-FR').format(rule.fixed_fee)} XAF</td>
                                    <td className="py-4 px-6 font-mono text-green-600">{rule.percentage_fee} %</td>
                                    <td className="py-4 px-6 font-mono text-purple-600">{rule.tax_percentage} %</td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                            {rule.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal d'insertion Multi-Frais */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-lg font-bold text-slate-900">Nouveau Palier de Frais Amorti</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit} id="fee-form" className="flex-1 overflow-y-auto py-4 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Type de transaction</label>
                                <select value={formData.transaction_type} onChange={(e) => setFormData({...formData, transaction_type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-semibold">
                                    <option value="transfer">Transfert</option>
                                    <option value="cash_in">Dépôt (Cash-In)</option>
                                    <option value="cash_out">Retrait (Cash-Out)</option>
                                    <option value="remittance">Remittance</option>
                                    <option value="merchant_payment">Paiement Marchand</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Pays Destination Corridor</label>
                                <select required value={formData.destination_country_id} onChange={(e) => setFormData({...formData, destination_country_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm">
                                    <option value="">-- Choisir la destination --</option>
                                    {countriesList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Min (XAF)</label>
                                    <input type="number" required value={formData.min_amount} onChange={(e) => setFormData({...formData, min_amount: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Max (XAF)</label>
                                    <input type="number" required value={formData.max_amount} onChange={(e) => setFormData({...formData, max_amount: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-mono"/>
                                </div>
                            </div>

                            <div className="p-3 bg-green-50/50 border border-green-100 rounded-xl space-y-3">
                                <p className="text-xs font-bold text-green-900 uppercase tracking-wider">Composantes de la tarification (Cumulables)</p>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500">FRAIS FIXE DE BASE (XAF)</label>
                                    <input type="number" step="0.01" value={formData.fixed_fee} onChange={(e) => setFormData({...formData, fixed_fee: e.target.value})} className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500">FRAIS VARIABLE (% DU PRINCIPAL)</label>
                                    <input type="number" step="0.01" max="100" value={formData.percentage_fee} onChange={(e) => setFormData({...formData, percentage_fee: e.target.value})} className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500">TAXE ET DROITS D'ENREGISTREMENT (%)</label>
                                    <input type="number" step="0.01" max="100" value={formData.tax_percentage} onChange={(e) => setFormData({...formData, tax_percentage: e.target.value})} className="w-full px-3 py-1.5 bg-white border rounded-lg text-sm font-mono" />
                                </div>
                            </div>
                        </form>

                        <div className="border-t pt-4 flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50">Annuler</button>
                            <button type="submit" form="fee-form" disabled={createFeeMutation.isPending} className="flex-1 py-2.5 bg-[#1d9e4b] hover:bg-green-700 text-white font-semibold rounded-xl text-sm shadow-sm">Déployer la règle</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}