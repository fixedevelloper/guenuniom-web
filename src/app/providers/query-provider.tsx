'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
export function QueryProvider({ children }: { children: React.ReactNode }) {
    // Utiliser useState pour s'assurer que le client n'est créé qu'une fois
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
            {children}
        </QueryClientProvider>
    );
}