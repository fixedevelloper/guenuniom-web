// hooks/useNotification.ts
import { toast } from 'sonner';

export const useNotify = () => {
    const success = (msg: string) => toast.success(msg);
    const error = (msg: string) => toast.error(msg);

    return { success, error };
};