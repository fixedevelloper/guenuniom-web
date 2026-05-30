import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TillStatus {
    agency_name: string;
    till_id: number;
    till_name: string;
    till_code: string;
    is_open: boolean;
    current_balance: number;
    currency: string;
}

export function useRequireOpenTill(selectedTillId?: number | null) {
    const router = useRouter();

    // Utilisation de React Query pour récupérer l'état de la caisse
    const { data: tillStatus, isLoading, error, refetch } = useQuery<TillStatus>({
        queryKey: ['cashTillStatus', selectedTillId],
        queryFn: async () => {
            // On passe l'ID de la caisse en paramètre si disponible, sinon le serveur prendra celle par défaut du User
            const response = await api.get('/cash/session/status', {
                params: selectedTillId ? { till_id: selectedTillId } : {},
            });
            return response.data.data;
        },
        // Optionnel : Évite de re-vérifier toutes les 2 secondes, mais s'assure d'avoir une donnée fraîche au montage
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        // Dès que le chargement est fini, si la caisse n'est pas ouverte, on redirige
        if (!isLoading && tillStatus && !tillStatus.is_open) {
            // Redirection vers ton écran de gestion de session (qui affichera le panneau d'ouverture)
            router.push('/cash/session');
        }
    }, [tillStatus, isLoading, router]);

    return {
        tillStatus,
        isLoading,
        isClosed: tillStatus ? !tillStatus.is_open : false,
        error,
        refetch
    };
}