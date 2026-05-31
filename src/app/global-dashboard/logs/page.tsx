'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    ShieldAlert,
    Search,
    RefreshCw,
    Calendar,
    User,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Server,
    AlertTriangle,
    Info,
    Globe,
    Building2,
    Tag
} from 'lucide-react';

export default function GlobalLogsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [severity, setSeverity] = useState('');
    const [eventType, setEventType] = useState('');
    const [userId, setUserId] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    // 1. Récupération des logs paginés et filtrés
    const { data: logsData, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['systemAuditLogs', page, severity, eventType, userId],
        queryFn: async () => {
            const { data } = await api.get('/audit-logs', {
                params: {
                    page,
                    severity: severity || undefined,
                    event_type: eventType || undefined,
                    user_id: userId || undefined,
                }
            });
            return data;
        },
        refetchOnWindowFocus: false,
    });

    // 2. Récupération des filtres dynamiques (Utilisateurs & Types d'événements existants)
    const { data: dependencies } = useQuery({
        queryKey: ['logsDependencies'],
        queryFn: async () => {
            const { data } = await api.get('/audit-logs/dependencies');
            return data;
        },
        refetchOnWindowFocus: false,
    });

    // Filtrage local pour la recherche plein texte libre
    const filteredLogs = logsData?.data?.filter((log: any) => {
        const searchString = `${log.message} ${log.ip_address} ${log.user_name} ${log.event_type} ${log.agency_name}`.toLowerCase();
        return searchString.includes(search.toLowerCase());
    }) || [];

    // Configuration sémantique de l'enum de sévérité de votre migration
    const severityConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
        info: { label: 'Information', bg: 'bg-green-50 border-green-100', text: 'text-green-700', icon: Info },
        warning: { label: 'Avertissement', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: AlertTriangle },
        critical: { label: 'Alerte Critique', bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', icon: ShieldAlert },
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">

            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registre d'Audit Système</h1>
                    <p className="text-sm text-slate-500 mt-1">Consultez et inspectez en temps réel l'ensemble des événements, anomalies et actions sensibles du réseau FinTech.</p>
                </div>
                <div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
                        {isFetching ? 'Analyse...' : 'Actualiser'}
                    </button>
                </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Recherche libre */}
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par message, IP, mot-clé..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Filtre Sévérité */}
                <div>
                    <select
                        value={severity}
                        onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">Toutes les sévérités</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>

                {/* Filtre Catégorie d'événement */}
                <div>
                    <select
                        value={eventType}
                        onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">Tous les types d'événements</option>
                        {dependencies?.event_types?.map((type: string) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Filtre Collaborateur */}
                <div>
                    <select
                        value={userId}
                        onChange={(e) => { setUserId(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none"
                    >
                        <option value="">Tous les collaborateurs</option>
                        {dependencies?.users?.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role_label})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Chargement */}
            {isLoading && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center gap-2">
                    <Server className="h-6 w-6 animate-pulse text-green-600" />
                    <p className="text-xs font-medium text-slate-400 font-mono">Lecture de la table system_audit_logs...</p>
                </div>
            )}

            {/* Liste des Logs */}
            {!isLoading && !isError && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-6">Date & Origine</th>
                                <th className="py-4 px-6">Opérateur / Agence</th>
                                <th className="py-4 px-6">Type d'événement</th>
                                <th className="py-4 px-6">Message / Description</th>
                                <th className="py-4 px-6 text-center">Niveau</th>
                                <th className="py-4 px-6 text-center">Payload</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-400 font-mono text-xs">Aucun log système trouvé.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log: any) => {
                                    const sev = severityConfig[log.severity] || severityConfig.info;
                                    const LogIcon = sev.icon;
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                            {/* Temps & IP */}
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {new Date(log.created_at).toLocaleString('fr-FR')}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                                                    <Globe className="w-3 h-3" /> {log.ip_address || '127.0.0.1'}
                                                </div>
                                            </td>

                                            {/* Opérateur & Affectation Agence */}
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    {log.user_name}
                                                </div>
                                                <div className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                                                    <Building2 className="w-3 h-3 text-slate-400" />
                                                    {log.agency_name}
                                                </div>
                                            </td>

                                            {/* Type d'événement (Tag de classification) */}
                                            <td className="py-4 px-6">
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                            <Tag className="w-3 h-3 text-slate-400" />
                              {log.event_type}
                          </span>
                                            </td>

                                            {/* Message textuel de la BDD */}
                                            <td className="py-4 px-6 text-slate-800 max-w-xs break-words font-medium">
                                                {log.message}
                                            </td>

                                            {/* Sévérité */}
                                            <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${sev.bg} ${sev.text}`}>
                            <LogIcon className="w-3 h-3" />
                              {sev.label}
                          </span>
                                            </td>

                                            {/* Inspection JSON du Payload */}
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Méta-pagination */}
                    {logsData?.meta && (
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-500">
                            <div>Total : {logsData.meta.total} logs d'audit système</div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className="p-2 border bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center px-2 font-mono">Page {page} / {logsData.meta.last_page}</div>
                                <button
                                    onClick={() => setPage((p) => Math.min(p + 1, logsData.meta.last_page))}
                                    disabled={page === logsData.meta.last_page}
                                    className="p-2 border bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal d'Inspection JSON */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Payload Contextuelle (JSON)</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">UUID Event : {selectedLog.uuid}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold font-mono">PAYLOAD_METADATA :</label>
                            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-80 shadow-inner">
                                <pre>{JSON.stringify(selectedLog.payload || { info: "Aucune payload attachée à cet événement." }, null, 2)}</pre>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium pt-2 italic">User Agent : {selectedLog.user_agent || 'Non renseigné'}</p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="button" onClick={() => setSelectedLog(null)} className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200">Fermer</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}