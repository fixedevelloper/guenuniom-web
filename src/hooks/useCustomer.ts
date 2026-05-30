// hooks/useCustomer.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; // Votre instance axios configurée

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => api.post('/customers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
};