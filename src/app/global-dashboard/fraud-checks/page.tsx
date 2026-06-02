"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {api} from "../../../lib/api";


export default function FraudCheckPage() {
    // 1. États pour les filtres de recherche et la pagination
    const [search, setSearch] = useState("");
    const [riskLevel, setRiskLevel] = useState("");
    const [isFlagged, setIsFlagged] = useState("");
    const [page, setPage] = useState(1);
    const [perPage] = useState(15);

    // 2. Requête TanStack Query avec Axios Service
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["fraudChecks", { page, perPage, search, riskLevel, isFlagged }],
        queryFn: async () => {
            // Construction dynamique des query params
            const response = await api.get("/fraud-checks", {
                params: {
                    page,
                    per_page: perPage,
                    ...(search && { search: search.trim() }),
                    ...(riskLevel && { risk_level: riskLevel }),
                    ...(isFlagged !== "" && { is_flagged: isFlagged }),
                },
            });
            // Axios encapsule la réponse de Laravel dans `response.data`
            return response.data;
        },
        // Conserver les données de la page précédente pendant le chargement de la nouvelle (UI fluide)
        placeholderData: (previousData) => previousData,
        // Optionnel : Rafraîchir automatiquement le registre toutes les 30 secondes pour les auditeurs
        refetchInterval: 30000,
    });

    // Extraction sécurisée des données renvoyées par votre contrôleur Laravel
    const fraudChecks = data?.data || [];
    const pagination = data?.pagination || { current_page: 1, last_page: 1, total: 0 };

    // Métriques de synthèse calculées à la volée sur les données chargées
    const metrics = {
        total: pagination.total,
        critical: fraudChecks.filter((c:any) => c.severity === "critical").length,
        flagged: fraudChecks.filter((c:any) => c.is_flagged).length,
    };

    // Gestionnaire de réinitialisation des filtres
    const handleResetFilters = () => {
        setSearch("");
        setRiskLevel("");
        setIsFlagged("");
        setPage(1);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
            {/* EN-TÊTE */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Registre de Conformité Anti-Fraude</h1>
                    <p className="text-sm text-gray-500">
                        Suivi en temps réel des scores de risque AML, CEMAC/COBAC et des alertes de vélocité de caisse.
                    </p>
                </div>
                {data && (
                    <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full animate-pulse">
            Live - Synchro 2026
          </span>
                )}
            </div>

            {/* CARTES STATISTIQUES (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-gray-400">Total Analysé (Système)</p>
                    <p className="text-2xl font-bold mt-1">{isLoading ? "..." : metrics.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-xs font-semibold uppercase text-gray-400">Blocages Critiques (Page)</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{isLoading ? "..." : metrics.critical}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-amber-500">
                    <p className="text-xs font-semibold uppercase text-gray-400">Drapeaux de Vigilance (Page)</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{isLoading ? "..." : metrics.flagged}</p>
                </div>
            </div>

            {/* ZONE DE FILTRES CORRÉLÉE AUX ÉTATS */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Recherche textuelle</label>
                    <input
                        type="text"
                        placeholder="Référence, expéditeur, motif..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Niveau de Risque</label>
                    <select
                        value={riskLevel}
                        onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tous les niveaux</option>
                        <option value="high">Critique (Score {'>'}= 80)</option>
                        <option value="medium">Moyen (Score 40-79)</option>
                        <option value="low">Faible (Score {'<'} 40)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Statut Vigilance</label>
                    <select
                        value={isFlagged}
                        onChange={(e) => { setIsFlagged(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tous</option>
                        <option value="true">Marqués (Flagged)</option>
                        <option value="false">Sains</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleResetFilters}
                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            </div>

            {/* COMPOSANT DE GESTION DES ERREURS GLOBALES */}
            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                    <strong>Erreur de communication :</strong> {error?.message || error.message || "Impossible de joindre le Core Banking."}
                </div>
            )}

            {/* TABLEAU DES LOGS D'AUDIT */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                            <th className="p-4">Date & Réf. Interne</th>
                            <th className="p-4">Type Opération</th>
                            <th className="p-4">Intervenants</th>
                            <th className="p-4">Montant</th>
                            <th className="p-4">Score & Sévérité</th>
                            <th className="p-4">Motif réglementaire</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                        {isLoading ? (
                            <tr>
                                <td className="text-center p-8 text-gray-400">Chargement asynchrone via TanStack Query...</td>
                            </tr>
                        ) : fraudChecks.length === 0 ? (
                            <tr>
                                <td  className="text-center p-8 text-gray-400">Aucun signalement suspect enregistré.</td>
                            </tr>
                        ) : (
                            fraudChecks.map((check:any) => (
                                <tr key={check.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-900">{check.transaction?.reference || "N/A"}</div>
                                        <div className="text-xs text-gray-400">{new Date(check.date).toLocaleString('fr-FR')}</div>
                                    </td>
                                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 uppercase">
                        {check.transaction?.type?.replace('_', ' ') || 'N/A'}
                      </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-gray-700"><span className="text-xs text-gray-400">Exp:</span> {check.transaction?.sender_name || 'N/A'}</div>
                                        <div className="text-gray-700"><span className="text-xs text-gray-400">Bén:</span> {check.transaction?.recipient_name || 'N/A'}</div>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">
                                        {check.transaction ? `${check.transaction.amount.toLocaleString()} ${check.transaction.currency}` : 'N/A'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                        <span className={`w-8 text-center font-bold ${
                            check.risk_score >= 80 ? 'text-red-600' : check.risk_score >= 40 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {check.risk_score}%
                        </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                check.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                    check.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                                            }`}>
                          {check.severity.toUpperCase()}
                        </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 max-w-xs truncate" title={check.reason}>
                                        {check.reason}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* CONTÔLEURS DE PAGINATION */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <div>
                        Affichage de la page <span className="font-semibold">{pagination.current_page}</span> sur <span className="font-semibold">{pagination.last_page}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1 || isLoading}
                            className="px-3 py-1 bg-white border border-gray-200 rounded shadow-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(p + 1, pagination.last_page))}
                            disabled={page === pagination.last_page || isLoading}
                            className="px-3 py-1 bg-white border border-gray-200 rounded shadow-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}