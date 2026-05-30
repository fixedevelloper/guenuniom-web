// hooks/useFees.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useEstimateFees = (params: { amount: number, source: string, dest: string }) => {
    return useQuery({
        queryKey: ['fees', params],
        queryFn: () => api.post('/remittance/estimate-fees', params).then(res => res.data),
        enabled: params.amount > 0, // Ne lance la requête que si le montant est valide
    });
};