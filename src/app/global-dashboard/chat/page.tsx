'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEcho } from "../../../hooks/useEcho";
import { api } from "../../../lib/api";
import { ChatComponent } from "../../../components/guards/ChatComponent";
import { toast } from "sonner";
import { Users, Search, MessageSquare } from 'lucide-react';
import { useAuthStore } from "../../../store/useAuthStore";

interface Conversation {
    id: number;
    type: string;
    contact?: {
        id: number;
        username: string;
        first_name: string;
        last_name: string | null;
        avatar: string | null;
    };
    messages?: any[];
}

interface Agent {
    id: number;
    name: string;
    role?: string;
    is_online?: boolean;
    phone?: string;
}
interface SendMessagePayload {
    formData: FormData;
    tempId: number;
    optimisticMessage: {
        id: number;
        user_id: number;
        body: string | null;
        type: 'text' | 'image' | 'document';
        sending: boolean;
        is_from_me: boolean;
        timestamp: string;
        user: { id: number; name: string };
    };
}
const CashChatPage = () => {
    const queryClient = useQueryClient();
    const echo = useEcho();

    // 🔌 Extraction dynamique du collaborateur connecté
    const user = useAuthStore((state) => state.user);
    const currentUserId = user?.id ? Number(user.id) : 0;

    const [activeChat, setActiveChat] = useState<Conversation | null>(null);
    const [sidebarSearch, setSidebarSearch] = useState('');

    // --------------------------------------------------------
    // 1. REQUÊTES TANSTACK QUERY (v5)
    // --------------------------------------------------------

    // Chargement du canal d'agence initial
    const { isLoading: isLoadingChannel } = useQuery({
        queryKey: ['agencyGlobalChannel'],
        queryFn: async () => {
            console.log("📥 [CashChatPage] Récupération du canal d'agence...");
            const response = await api.get('/staff/chat/global-channel');
            const data = response.data.data;

            if (data && !activeChat) {
                console.log("✅ [CashChatPage] Canal général initialisé :", data);
                setActiveChat(data);
            }
            return data;
        },
        staleTime: Infinity,
    });

    // Chargement de la liste des agents
    const { data: agents = [], isLoading: isLoadingAgents } = useQuery<Agent[]>({
        queryKey: ['agents-global'],
        queryFn: async () => {
            console.log("📥 [CashChatPage] Récupération de la liste des agents...");
            const response = await api.get('/staff/chat/agents/global');
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5
    });

    // Chargement des messages réactifs au changement de Salon
    const { data: messages = [], isLoading: isLoadingMessages } = useQuery<any[]>({
        queryKey: ['messages', activeChat?.id],
        queryFn: async () => {
            if (!activeChat?.id) return [];
            console.log(`📂 [CashChatPage] Récupération des messages frais pour le Salon ID: ${activeChat.id}`);
            const response = await api.get(`/staff/chat/conversations/${activeChat.id}/messages`);
            return response.data.data;
        },
        enabled: !!activeChat?.id,
        initialData: () => activeChat?.messages || undefined
    });

    const pageLoading = isLoadingChannel || isLoadingAgents;

    // --------------------------------------------------------
    // 2. MUTATIONS TANSTACK QUERY (v5)
    // --------------------------------------------------------

    // Mutation : Envoi de message (sans remappage lourd grâce à MessageResource)
// 🔑 On passe 'SendMessagePayload' en premier paramètre générique
    const { mutate: sendMessage } = useMutation<any, Error, SendMessagePayload>({
        mutationFn: async (payload) => {
            const response = await api.post(
                `/staff/chat/conversations/${activeChat?.id}/messages`,
                payload.formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return response.data.data;
        },
        // ✅ TypeScript connaît maintenant parfaitement le type de tempId et optimisticMessage
        onMutate: async ({ tempId, optimisticMessage }) => {
            const queryKey = ['messages', activeChat?.id];
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: any[] | undefined) =>
                old ? [...old, optimisticMessage] : [optimisticMessage]
            );

            return { previousMessages, queryKey, tempId };
        },
        onError: (err, variables, context: any) => {
            if (context?.queryKey) {
                queryClient.setQueryData(context.queryKey, (old: any[] | undefined) =>
                    old ? old.map((msg) => msg.id === context.tempId ? { ...msg, sending: false, error: true } : msg) : []
                );
            }
        },
        onSuccess: (serverMessage, variables, context: any) => {
            if (context?.queryKey) {
                queryClient.setQueryData(context.queryKey, (old: any[] | undefined) =>
                    old ? old.map((msg) => msg.id === context.tempId ? serverMessage : msg) : []
                );
            }
        }
    }); // 🚀 Plus besoin du 'as any' ici !

    // Mutation : Recherche d'agent par téléphone (Saisie de numéro)
    const { mutate: searchAgentByPhone } = useMutation({
        mutationFn: async (phoneNumber: string) => {
            const response = await api.post('/staff/chat/agents/find-by-phone', { phone: phoneNumber });
            return response.data.data;
        },
        onSuccess: (data) => {
            if (data?.conversation) {
                setActiveChat(data.conversation);
                queryClient.setQueryData(['messages', data.conversation.id], data.conversation.messages || []);
                toast.success(`Discussion ouverte avec ${data.agent?.name}`);
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Aucun agent trouvé avec ce numéro.");
        }
    });

    // Mutation : Initialisation ou récupération d'un canal P2P direct
    const { mutate: selectAgentDirectly, isPending: isConnectingP2P } = useMutation({
        mutationFn: async (agentId: number) => {
            const response = await api.post('/staff/chat/peer', { recipient_staff_id: agentId });
            return response.data.data;
        },
        onSuccess: (conversation) => {
            console.log("🚀 [CashChatPage] Conversation P2P activée :", conversation);
            setActiveChat(conversation);
        },
        onError: (error: any) => {
            console.error("❌ [CashChatPage] Erreur mutation P2P :", error);
            toast.error("Impossible de lier la conversation avec cet agent.");
        }
    });

    // --------------------------------------------------------
    // 3. ECOUTEUR TEMPS RÉEL CONTROLLÉ (Laravel Echo / Reverb)
    // --------------------------------------------------------
    useEffect(() => {
        if (!echo || !activeChat) return;

        const channelName = `chat.${activeChat.id}`;
        const channel = echo.channel(channelName);

        channel.listen('MessageSent', (e: { message: any }) => {
            if (Number(e.message.user_id) !== Number(currentUserId)) {
                queryClient.setQueryData(['messages', activeChat.id], (oldMessages: any[] | undefined) => {
                    return oldMessages ? [...oldMessages, e.message] : [e.message];
                });
            }
        });

        return () => {
            echo.leave(channelName);
        };
    }, [echo, activeChat, queryClient]);

    // --------------------------------------------------------
    // 4. FILTRAGE LOCAL POUR LA SIDEBAR GAUCHE
    // --------------------------------------------------------
    const filteredSidebarAgents = agents.filter(agent => {
        if (!agent || typeof agent.name !== 'string') return false;
        return agent.name.toLowerCase().includes(sidebarSearch.toLowerCase()) && Number(agent.id) !== currentUserId;
    });

    // 🔑 Liaison 'text' nettoyée pour l'UI et le state optimiste
    const handleSendMessage = (text: string | null, type: 'text' | 'image' | 'document', file: File | null) => {
        if (!activeChat) return;

        const tempId = Date.now();
        const optimisticMessage = {
            id: tempId,
            user_id: currentUserId,
            body: text, // Changé 'body' à 'text' pour correspondre à l'UI
            type: type,
            sending: true,
            is_from_me: true,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            user: { id: currentUserId, name: "Moi" }
        };

        const formData = new FormData();
        formData.append('type', type);
        if (text) formData.append('body', text); // On envoie toujours 'body' à la Request Laravel ($request->body)
        if (file) formData.append('file', file);

        sendMessage({ formData, tempId, optimisticMessage });
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-mono text-xs uppercase tracking-widest">
                Chargement sécurisé du panneau applicatif...
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-7xl h-[750px] flex rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">

                {/* --------------------------------------------------------
                    SIDEBAR DE SÉLECTION DES AGENTS (À GAUCHE)
                   -------------------------------------------------------- */}
                <div className="w-80 border-r border-gray-200 bg-gray-50/70 flex flex-col shrink-0 hidden md:flex">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center gap-2 text-gray-800 font-bold mb-3">
                            <Users className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm tracking-wide uppercase">Équipe Guen's</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <input
                                type="text"
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                placeholder="Filtrer un collaborateur..."
                                className="w-full pl-9 pr-4 py-1.5 bg-gray-100/80 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
                        {filteredSidebarAgents.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400 font-mono">
                                Aucun agent trouvé
                            </div>
                        ) : (
                            filteredSidebarAgents.map((agent) => {
                                return (
                                    <button
                                        key={agent.id}
                                        type="button"
                                        disabled={isConnectingP2P}
                                        onClick={() => selectAgentDirectly(agent.id)}
                                        className="w-full p-3 flex items-center justify-between rounded-xl hover:bg-white hover:shadow-sm transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                {agent.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors truncate">
                                                    {agent.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-mono truncate">
                                                    {agent.role || 'Personnel d\'agence'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                            <span className={`w-2 h-2 rounded-full ${agent.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            <span className="text-[9px] text-gray-400 font-mono uppercase">
                                                {agent.is_online ? 'En ligne' : 'Off'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --------------------------------------------------------
                    COMPOSANT DE CHAT (À DROITE)
                   -------------------------------------------------------- */}
                <div className="flex-1 h-full bg-white flex flex-col overflow-hidden">
                    {activeChat ? (
                        <ChatComponent
                            currentUserId={currentUserId}
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            agents={agents}
                            onSelectAgent={(agent) => selectAgentDirectly(agent.id)}
                            onSearch={searchAgentByPhone}
                            isLoading={isLoadingMessages}
                            chatTitle={
                                activeChat.type === 'agency_group'
                                    ? "Salon Général de l'Agence"
                                    : activeChat.contact
                                    ? `${activeChat.contact.first_name} ${activeChat.contact.last_name || ''}`.trim()
                                    : "Discussion Privée"
                            }
                            chatSubtitle={echo ? "Liaison Opérationnelle" : "Raccordement réseau..."}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4 animate-bounce">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Aucun canal actif</h3>
                            <p className="text-xs text-gray-400 font-sans max-w-xs mt-1">
                                Sélectionnez un collaborateur dans la liste de gauche ou utilisez la barre de recherche interne pour lier un canal.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CashChatPage;