"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {api} from "../../../lib/api";

export default function CommissionsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    // Requête TanStack Query corrélée au service Axios global
    const { data, isLoading, isError } = useQuery({
        queryKey: ["commissionsList", { page, search }],
        queryFn: async () => {
            const response = await api.get("/commissions", {
                params: {
                    page,
                    per_page: 20,
                    ...(search && { search: search.trim() }),
                },
            });
            return response.data;
        },
        placeholderData: (previousData) => previousData,
        refetchInterval: 30000,
    });

    const commissions = data?.data || [];
    const pagination = data?.pagination || { current_page: 1, last_page: 1 };

    // Cumul de la page en cours
    const currentViewTotal = commissions.reduce((acc: number, curr:any) => acc + curr.amount, 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
            {/* EN-TÊTE */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Grand Livre des Commissions</h1>
                    <p className="text-sm text-gray-500">Journal analytique des gains calculés par règle de répartition de commissions.</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-3 rounded-xl shadow-sm min-w-[220px]">
                    <div className="text-xs font-medium uppercase opacity-75">Cumul Commissions (Page)</div>
                    <div className="text-xl font-bold mt-0.5">{currentViewTotal.toLocaleString()} XAF</div>
                </div>
            </div>

            {/* BARRE DE FILTRE */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <input
                    type="text"
                    placeholder="Rechercher par référence, bénéficiaire, libellé ou UUID..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* INTERFACE TABLEAU */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                            <th className="p-4">UUID Commission / Date</th>
                            <th className="p-4">Réf. Transaction</th>
                            <th className="p-4">Bénéficiaire du Gain (Wallet)</th>
                            <th className="p-4 text-right">Montant Principal</th>
                            <th className="p-4 text-center">Taux</th>
                            <th className="p-4 text-right text-blue-700">Commission Gagnée</th>
                            <th className="p-4">Description / Libellé</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="text-center p-8 text-gray-400">Synchronisation comptable avec la table Commission...</td>
                            </tr>
                        ) : commissions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center p-8 text-gray-400">Aucun enregistrement de commission trouvé.</td>
                            </tr>
                        ) : (
                            commissions.map((com:any) => (
                                <tr key={com.id} className="hover:bg-gray-50/70 transition-colors">
                                    {/* UUID & Date */}
                                    <td className="p-4 whitespace-nowrap text-xs">
                                        <div className="text-gray-400 font-mono truncate max-w-[100px]" title={com.uuid}>
                                            {com.uuid.substring(0, 8)}...
                                        </div>
                                        <div className="text-gray-900 font-medium mt-0.5">
                                            {new Date(com.date).toLocaleString('fr-FR')}
                                        </div>
                                    </td>
                                    {/* Transaction parente */}
                                    <td className="p-4 whitespace-nowrap">
                                        <span className="font-mono font-bold text-gray-900">
                                            {com.transaction?.reference || "N/A"}
                                        </span>
                                    </td>
                                    {/* Wallet affecté */}
                                    <td className="p-4 font-medium text-gray-700">
                                        {com.wallet?.name || <span className="text-gray-400 italic">Compte Inconnu</span>}
                                    </td>
                                    {/* Montant Principal de la Trx */}
                                    <td className="p-4 text-right font-medium text-gray-500">
                                        {com.transaction
                                            ? `${com.transaction.principal_amount.toLocaleString()} ${com.transaction.currency}`
                                            : "N/A"
                                        }
                                    </td>
                                    {/* Pourcentage appliqué */}
                                    <td className="p-4 text-center font-mono text-xs text-gray-600 bg-gray-50/50">
                                        {com.percentage}%
                                    </td>
                                    {/* Commission Perçue */}
                                    <td className="p-4 text-right font-bold text-blue-700 bg-blue-50/30">
                                        {com.amount.toLocaleString()} {com.transaction?.currency || "XAF"}
                                    </td>
                                    {/* Libellé descriptif */}
                                    <td className="p-4 text-xs text-gray-500 max-w-xs truncate" title={com.description}>
                                        {com.description}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION PANEL */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
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