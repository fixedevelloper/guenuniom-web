'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, FileText, Download, User, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface Message {
    id: number;
    body: string | null; // 🔑 Fixé sur 'body' comme le serveur Laravel
    type: 'text' | 'image' | 'document';
    file_path: string | null;
    user_id: number;
    created_at?: string;
    timestamp?: string;  // Reçu du backend (ex: "03:29")
    sending?: boolean;
    error?: boolean;
    user?: { id: number; name: string; };
}

interface Agent {
    id: number;
    name: string;
    role?: string;
    is_online?: boolean;
}

interface ChatComponentProps {
    currentUserId: number;
    messages: Message[];
    onSendMessage: (body: string | null, type: 'text' | 'image' | 'document', file: File | null) => Promise<void> | void;
    onApproveTransfer?: (messageId: number) => Promise<void> | void;
    isLoading?: boolean;
    chatTitle?: string;
    chatSubtitle?: string;
    agents?: Agent[];
    onSelectAgent?: (agent: Agent) => void;
    onSearch?: (query: string) => void;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
                                                                currentUserId,
                                                                messages,
                                                                onSendMessage,
                                                                onApproveTransfer,
                                                                isLoading = false,
                                                                chatTitle = "Discussion",
                                                                chatSubtitle = "En ligne",
                                                            }) => {
    const [inputMessage, setInputMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'text' | 'image' | 'document'>('text');
    const [actioningId, setActioningId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll vers le bas
    useEffect(() => {
        if (!isLoading) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setFileType(type);
        }
    };

    const handleCancelFile = () => {
        setSelectedFile(null);
        setFileType('text');
        if (imgInputRef.current) imgInputRef.current.value = '';
        if (docInputRef.current) docInputRef.current.value = '';
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() && !selectedFile) return;

        const bodyToSend = inputMessage.trim() || null;
        const typeToSend = selectedFile ? fileType : 'text';
        const fileToSend = selectedFile;

        setInputMessage('');
        handleCancelFile();

        await onSendMessage(bodyToSend, typeToSend, fileToSend);
    };

    const handleActionClick = async (messageId: number) => {
        if (!onApproveTransfer || actioningId !== null) return;
        setActioningId(messageId);
        try {
            await onApproveTransfer(messageId);
        } catch (error) {
            console.error("Erreur validation transfert:", error);
        } finally {
            setActioningId(null);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">

            {/* Header épuré */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 tracking-wide">{chatTitle}</h3>
                        <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                            {chatSubtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Conteneur principal du flux de discussion */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm font-mono">
                            Chargement du flux...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs uppercase tracking-widest font-mono">
                            Aucun message. Démarrez la discussion.
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user_id === currentUserId || (msg as any).is_from_me === true;
                            const isCashAlert = msg.body?.includes("[ALERTE SÉCURITÉ CAISSE]"); // 🔑 Lecture via msg.body

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative transition-all ${
                                        msg.sending ? 'opacity-60 scale-[0.99]' : ''
                                    } ${
                                        msg.error ? 'border-rose-300 bg-rose-50 text-rose-900' :
                                            isCashAlert ? 'bg-amber-50 border border-amber-200 text-gray-800 rounded-bl-none w-full max-w-md' :
                                                isMe ? 'bg-emerald-600 text-white rounded-br-none' :
                                                    'bg-white border border-gray-200 text-gray-700 rounded-bl-none'
                                    }`}>

                                        {/* Nom de l'expéditeur */}
                                        {!isMe && msg.user && (
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{msg.user.name}</p>
                                                {isCashAlert && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 font-bold uppercase tracking-widest">Système</span>}
                                            </div>
                                        )}

                                        {/* Contenu : Structure Alerte d'ajustement */}
                                        {isCashAlert ? (
                                            <div className="space-y-3 py-0.5">
                                                <div className="flex items-start gap-2.5">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="text-xs font-black text-amber-700 uppercase tracking-wide">Ajustement de Coffre Requis</h4>
                                                        <p className="text-xs text-gray-600 mt-1 font-sans leading-relaxed">{msg.body?.replace(/🚨\s*\[ALERTE SÉCURITÉ CAISSE\]\s*:\s*/, "")}</p>
                                                    </div>
                                                </div>
                                                {onApproveTransfer && (
                                                    <div className="pt-1 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={actioningId === msg.id}
                                                            onClick={() => handleActionClick(msg.id)}
                                                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                                                        >
                                                            <CheckCircle className="w-3 h-3" />
                                                            {actioningId === msg.id ? 'Traitement...' : 'Valider l\'encaissement'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Contenu : Structure Standard alimentée par msg.body */
                                            <>
                                                {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap font-sans break-words">{msg.body}</p>}
                                                {msg.type === 'image' && msg.file_path && (
                                                    <div className="rounded-lg overflow-hidden border border-gray-100 max-w-xs my-1 bg-gray-100">
                                                        <img src={msg.file_path} alt="Média partagé" className="w-full h-auto object-cover max-h-60" loading="lazy" />
                                                    </div>
                                                )}
                                                {msg.type === 'document' && msg.file_path && (
                                                    <a href={msg.file_path} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-2 rounded-lg transition-colors my-1 ${isMe ? 'bg-emerald-700/50 hover:bg-emerald-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                                        <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                                                        <span className="text-xs truncate max-w-[150px]">Document</span>
                                                        <Download className={`w-4 h-4 ml-auto shrink-0 ${isMe ? 'text-emerald-200' : 'text-gray-400'}`} />
                                                    </a>
                                                )}
                                                {msg.type !== 'text' && msg.body && <p className="text-sm mt-1 break-words">{msg.body}</p>}
                                            </>
                                        )}

                                        {/* Métadonnées */}
                                        <div className="flex items-center justify-end gap-1 mt-1.5">
                                            {msg.error && (
                                                <span className="text-[9px] text-rose-500 flex items-center gap-0.5 font-sans font-medium">
                                                    <AlertCircle className="w-2.5 h-2.5" /> Échec de l'envoi
                                                </span>
                                            )}
                                            <p className={`text-[9px] font-mono ${isMe ? 'text-emerald-100' : 'text-gray-400'} ${msg.error ? 'text-rose-400' : ''}`}>
                                                {msg.sending
                                                    ? 'Envoi...'
                                                    : msg.timestamp || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '')
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Zone de saisie et d'envoi de fichiers */}
            <form onSubmit={handleSend} className="bg-white border-t border-gray-200 p-4">
                {selectedFile && (
                    <div className="mb-3 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-500 font-mono">
                        <span className="truncate max-w-[80%] flex items-center gap-2">
                            {fileType === 'image' ? <Image className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 text-amber-500" />}
                            {selectedFile.name}
                        </span>
                        <button type="button" onClick={handleCancelFile} className="text-rose-500 hover:underline font-bold text-[10px] uppercase pl-2">Annuler</button>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <label htmlFor="chat-img-input" className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-400 hover:text-emerald-600 cursor-pointer transition-all"><Image className="w-4 h-4" /></label>
                        <input id="chat-img-input" ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'image')} />

                        <label htmlFor="chat-doc-input" className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-400 hover:text-amber-600 cursor-pointer transition-all"><FileText className="w-4 h-4" /></label>
                        <input id="chat-doc-input" ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={(e) => handleFileChange(e, 'document')} />
                    </div>
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={selectedFile ? "Ajouter un commentaire au fichier..." : "Rédiger votre message..."}
                        className="flex-1 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors"
                    />
                    <button type="submit" disabled={!inputMessage.trim() && !selectedFile} className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all shadow-md shrink-0 flex items-center justify-center"><Send className="w-4 h-4" /></button>
                </div>
            </form>
        </div>
    );
};