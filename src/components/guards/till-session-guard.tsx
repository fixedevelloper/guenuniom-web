'use client';

import React from 'react';
import { useRequireOpenTill } from '@/hooks/use-require-open-till';
import { Loader2, Landmark } from 'lucide-react';

interface TillSessionGuardProps {
    children: React.ReactNode;
}

export function TillSessionGuard({ children }: TillSessionGuardProps) {
    // On appelle notre hook de vérification
    const { isLoading, isClosed } = useRequireOpenTill();

    // 1. Pendant le chargement de l'API, on affiche un écran d'attente propre
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-slate-100 rounded-2xl animate-pulse">
                    <Landmark className="w-8 h-8 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Vérification de la session de caisse...
                </div>
            </div>
        );
    }

    // 2. Si la caisse est fermée, le hook va déclencher le router.push(),
    // mais pour éviter un flash du contenu de la page pendant la transition, on retourne null
    if (isClosed) {
        return null;
    }

    // 3. Si tout est OK (Caisse ouverte), on affiche la page normalement
    return <>{children}</>;
}