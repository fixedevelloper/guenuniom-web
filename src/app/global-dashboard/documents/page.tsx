'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    FileText,
    BookOpen,
    Scale,
    PieChart,
    Eye,
    RefreshCw,
    Download
} from 'lucide-react';
import {api} from "../../../lib/api";

export default function PreviewDocumentsPage() {
    const [activeDoc, setActiveDoc] = useState('grand_livre'); // grand_livre, balance_wallets, synthese_retrocessions

    // Requête TanStack Query liée au type de document sélectionné
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['accountingPreview', activeDoc],
        queryFn: async () => {
            const response = await api.get('/accounting/preview', {
                params: { doc_type: activeDoc }
            });
            return response.data;
        },
    });

    const documentTypes = [
        { id: 'grand_livre', label: 'Grand Livre des Commissions', desc: 'Journal chronologique des écritures', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 'balance_wallets', label: 'Balance des Comptes (Wallets)', desc: 'Situation des gains par agence/compte', icon: Scale, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { id: 'synthese_retrocessions', label: 'Synthèse des Répartitions', desc: 'Volume analytique groupé par taux', icon: PieChart, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen text-slate-800">

            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prévisualisation des Flux & États</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Consultez en temps réel un extrait des écritures comptables essentielles avant clôture ou édition.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                >
                    <RefreshCw className="w-4 h-4 text-slate-400" /> Rafraîchir l'aperçu
                </button>
            </div>

            {/* BARRE DE SÉLECTION DU TYPE DE DOCUMENT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {documentTypes.map((doc) => {
                    const Icon = doc.icon;
                    const isActive = activeDoc === doc.id;
                    return (
                        <button
                            key={doc.id}
                            onClick={() => setActiveDoc(doc.id)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 shadow-sm relative ${
                                isActive
                                    ? 'bg-white border-slate-900 ring-2 ring-slate-900/10'
                                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                            }`}
                        >
                            <div className={`p-3 rounded-xl border ${doc.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {doc.label}
                                </h3>
                                <p className="text-xs text-slate-400">{doc.desc}</p>
                            </div>
                            {isActive && (
                                <span className="absolute top-3 right-3 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* MODULE DE PRÉVISUALISATION DIRECTE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Eye className="w-4 h-4 text-slate-400" />
                        Aperçu des 10 dernières lignes du flux actif
                    </div>
                    <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                        Type : {activeDoc.toUpperCase()}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-bold text-slate-500 uppercase">
                            {data?.headers?.map((header: string, idx: number) => (
                                <th key={idx} className="p-4">{header}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="text-center p-12 text-slate-400">
                                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                                    Extraction de l'état financier de prévisualisation...
                                </td>
                            </tr>
                        ) : isError ? (
                            <tr>
                                <td colSpan={5} className="text-center p-12 text-rose-500">
                                    Une erreur est survenue lors de la génération de l'aperçu.
                                </td>
                            </tr>
                        ) : data?.rows?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center p-12 text-slate-400 italic">
                                    Aucun mouvement comptable trouvé dans cette catégorie.
                                </td>
                            </tr>
                        ) : (

                            data?.rows?.map((row:any, idx:number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    {row.col1 !== 'N/A' && <td className="p-4">{row.col1}</td>}
                                    {row.col2 !== 'N/A' && <td className="p-4 font-mono text-xs">{row.col2}</td>}
                                    {row.col3 !== 'N/A' && <td className="p-4 text-slate-500">{row.col3}</td>}
                                    {row.col4 !== 'N/A' && <td className="p-4">{row.col4}</td>}
                                    {row.col5 !== 'N/A' && <td className="p-4 font-bold text-right text-slate-900">{row.col5}</td>}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* ZONE DE TÉLÉCHARGEMENT DIRECT DEPUIS L'APERÇU */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>Cet écran affiche un échantillon d'audit.</span>
                    </div>
                    <button
                        disabled={isLoading || data?.rows?.length === 0}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" /> Exporter le document complet
                    </button>
                </div>
            </div>

        </div>
    );
}