"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {api} from "../../../../lib/api";

export default function SystemLogsPage() {
    const [search, setSearch] = useState("");
    const [severity, setSeverity] = useState("");
    const [page, setPage] = useState(1);

    // Requête TanStack Query réutilisant votre instance Axios
    const { data, isLoading, isError } = useQuery({
        queryKey: ["systemLogs", { page, search, severity }],
        queryFn: async () => {
            const response = await api.get("/logs/system", {
                params: {
                    page,
                    per_page: 20,
                    ...(search && { search: search.trim() }),
                    ...(severity && { severity }),
                },
            });
            return response.data;
        },
        placeholderData: (previousData) => previousData,
        refetchInterval: 15000, // Rafraîchissement automatique toutes les 15 secondes
    });

    const logs = data?.data || [];
    const pagination = data?.pagination || { current_page: 1, last_page: 1 };

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
            {/* EN-TÊTE */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Logs & Audits Système</h1>
                <p className="text-sm text-gray-500">Journal d'audit immuable des actions opérateurs et des événements du Core Banking.</p>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Filtrer par message, IP, événement..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={severity}
                        onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Toutes les gravités</option>
                        <option value="info">Info (Succès)</option>
                        <option value="warning">Warning (Alerte)</option>
                        <option value="critical">Critical (Incident / Blocage)</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU DES LOGS */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                            <th className="p-4">Horodatage / IP</th>
                            <th className="p-4">Événement</th>
                            <th className="p-4">Opérateur / Agence</th>
                            <th className="p-4">Message d'exécution</th>
                            <th className="p-4">Gravité</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm font-mono">
                        {isLoading ? (
                            <tr>
                                <td  className="text-center p-8 text-gray-400">Lecture du flux d'audit...</td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td  className="text-center p-8 text-gray-400">Aucun log enregistré pour cette sélection.</td>
                            </tr>
                        ) : (
                            logs.map((log:any) => (
                                <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="p-4 whitespace-nowrap text-xs">
                                        <div className="text-gray-900">{new Date(log.date).toLocaleString('fr-FR')}</div>
                                        <div className="text-gray-400 mt-0.5">{log.ip_address}</div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-blue-700 tracking-tight">
                                        {log.event_type}
                                    </td>
                                    <td className="p-4 text-xs font-sans">
                                        <div className="font-semibold text-gray-800">{log.operator?.full_name || "Système"}</div>
                                        <div className="text-gray-400 text-[11px]">{log.agency_name}</div>
                                    </td>
                                    <td className="p-4 text-xs font-sans text-gray-600 max-w-md break-words">
                                        {log.message}
                                    </td>
                                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          log.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              log.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {log.severity}
                      </span>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION PANEL */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-sans">
                    <div>Page <span className="font-semibold">{pagination.current_page}</span> sur <span className="font-semibold">{pagination.last_page}</span></div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1 || isLoading}
                            className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50 text-gray-600"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(p + 1, pagination.last_page))}
                            disabled={page === pagination.last_page || isLoading}
                            className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50 text-gray-600"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}