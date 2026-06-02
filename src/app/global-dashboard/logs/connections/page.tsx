"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../lib/api";

export default function ConnectionLogsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    // Appel TanStack Query branché sur l'instance API Axios
    const { data, isLoading, isError } = useQuery({
        queryKey: ["connectionLogs", { page, search, status }],
        queryFn: async () => {
            const response = await api.get("/logs/connections", {
                params: {
                    page,
                    per_page: 20, // Aligné sur la pagination par défaut du Backend (20)
                    ...(search && { search: search.trim() }),
                    ...(status && { status }),
                },
            });
            return response.data;
        },
        placeholderData: (previousData) => previousData,
        refetchInterval: 10000, // Rafraîchissement automatique toutes les 10 secondes
    });

    const logs = data?.data || [];
    const pagination = data?.pagination || { current_page: 1, last_page: 1 };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
            {/* EN-TÊTE */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Audit des Connexions & Sessions</h1>
                <p className="text-sm text-gray-500">Surveillance des accès utilisateurs, détection des échecs répétés et traçabilité des adresses IP.</p>
            </div>

            {/* FILTRES D'AUDIT */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
                    <input
                        type="text"
                        placeholder="Rechercher un téléphone tenté, une IP, un nom d'opérateur..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Statut d'accès</label>
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="success">Connexions Réussies</option>
                        <option value="failed">Échecs d'Authentification</option>
                    </select>
                </div>
            </div>

            {/* GESTION DES ERREURS DE CONNEXION API */}
            {isError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    Erreur lors de la synchronisation en temps réel avec le Core Banking.
                </div>
            )}

            {/* TABLEAU DES TENTATIVES D'ACCÈS */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                            <th className="p-4">Horodatage (Session)</th>
                            <th className="p-4">Identifiant tenté (Phone)</th>
                            <th className="p-4">Opérateur Résolu</th>
                            <th className="p-4">Adresse IP</th>
                            <th className="p-4">Statut / Sécurité</th>
                            <th className="p-4">User Agent</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-mono">
                        {isLoading ? (
                            <tr>
                                <td  className="text-center p-8 text-gray-400">Scan des sessions actives en cours...</td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td  className="text-center p-8 text-gray-400">Aucun historique d'accès disponible.</td>
                            </tr>
                        ) : (
                            logs.map((log:any) => (
                                <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-xs text-gray-600 font-sans">
                                        <div className="text-gray-900 font-medium">
                                            <span className="text-gray-400 font-normal">In: </span>
                                            {log.date ? new Date(log.date).toLocaleString('fr-FR') : 'N/A'}
                                        </div>
                                        {log.logged_out_at && (
                                            <div className="text-gray-400 mt-0.5 text-[11px]">
                                                <span>Out: </span>
                                                {new Date(log.logged_out_at).toLocaleString('fr-FR')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-sans font-semibold text-gray-900">
                                        {log.phone_attempted || "N/A"}
                                    </td>
                                    <td className="p-4 font-sans text-xs">
                                        {log.user ? (
                                            <div>
                                                <div className="font-semibold text-gray-800">{log.user.full_name}</div>
                                                <div className="text-gray-400 text-[11px]">@{log.user.username}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Non identifié</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs font-bold text-gray-700">
                                        {log.ip_address}
                                    </td>
                                    <td className="p-4 font-sans text-xs">
                                        <div className="flex flex-col gap-0.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase w-max ${
                                                log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {log.status === 'success' ? 'ACCEPTÉ' : 'REJETÉ'}
                                            </span>
                                            {log.failure_reason && (
                                                <span className="text-red-500 text-[11px] mt-0.5 font-mono break-words max-w-[180px]" title={log.failure_reason}>
                                                    {log.failure_reason}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-[11px] text-gray-400 max-w-xs truncate" title={log.user_agent}>
                                        {log.user_agent}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* CONTÔLES DE PAGINATION */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-sans">
                    <div>Page <span className="font-semibold">{pagination.current_page}</span> sur <span className="font-semibold">{pagination.last_page}</span></div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1 || isLoading}
                            className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(p + 1, pagination.last_page))}
                            disabled={page === pagination.last_page || isLoading}
                            className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}