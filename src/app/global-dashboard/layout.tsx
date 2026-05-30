'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Sidebar } from '@/components/dashboard-admin/Sidebar';
import { Header } from '@/components/dashboard-admin/Header';

export default function DashboardLayout({
                                            children,
                                        }: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const { token, user, logout } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Protection de route
    useEffect(() => {
        if (!token) {
            router.replace('/login');
        }
    }, [token, router]);

    if (!token) return null;

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">

            {/* Sidebar isolée */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleLogout}
            />

            {/* Backdrop mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Zone de contenu */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Header isolé */}
                <Header
                    user={user}
                    onMenuOpen={() => setIsSidebarOpen(true)}
                />

                {/* Contenu dynamique */}
                <main className="flex-1 overflow-y-auto bg-[#F8FAFC] focus:outline-none">
                    {children}
                </main>
            </div>

        </div>
    );
}