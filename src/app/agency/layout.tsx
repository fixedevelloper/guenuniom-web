'use client';

import React, { useState,useEffect } from 'react';
import Link from 'next/link';
import {useRouter, usePathname } from 'next/navigation';

import { useAuthStore } from '@/store/useAuthStore';
import { 
    Users, 
    LayoutDashboard, 
    LogOut, 
    Menu, 
    X, 
    User,
    ChevronDown,
    Bell,
    Wallet,
    TrendingUp,
    FileBarChart
} from 'lucide-react';

interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

export default function ManagerAgencyLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { token, user, logout } = useAuthStore();
    const router = useRouter();
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
    // Sidebar recentrée sur le périmètre exclusif d'une direction d'agence
    const navigation: NavigationItem[] = [
        { name: 'Tableau de bord', href: '/agency/dashboard', icon: LayoutDashboard },
        { name: 'Mes Caissiers & Tills', href: '/agency/cashiers', icon: Users }, // Suivi des sessions de caisse active
        { name: 'Flux & Transactions', href: '/agency/transactions', icon: TrendingUp }, // Opérations au sein de son agence
        { name: 'Gestion des Caisses', href: '/agency/vaults', icon: Wallet }, // Approvisionnement et encaissements des tiroirs
        { name: 'Rapports & Audits', href: '/agency/reports', icon: FileBarChart }, // Comptabilité de l'agence (OHADA local)
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            
            {/* BACKDROP MOBILE */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-400 border-r border-slate-800 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out
                lg:static lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="space-y-6">
                    {/* Logo & Agence Identity */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2.5">
                            <div>
                              {/*  <span className="text-white font-bold tracking-tight block">Fintech / Wallet</span>*/}
                                <img
                                    src="/logo.png"
                                    alt="Guen's Union Logo"
                                    className="w-50 h-20 object-contain"
                                />
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">Espace Directeur</span>
                            </div>
                        </div>
                        <button className="lg:hidden text-slate-400 hover:text-white p-1" onClick={() => setIsSidebarOpen(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Liens de Navigation Métier */}
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group
                                        ${isActive 
                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10' 
                                            : 'hover:bg-slate-800/60 hover:text-slate-200'
                                        }
                                    `}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Déconnexion */}
                <div className="border-t border-slate-800 pt-4">
                    <button 
                        onClick={() => handleLogout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Quitter le guichet
                    </button>
                </div>
            </aside>

            {/* CONTENU PRINCIPAL */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* HEADER */}
                <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        {/* Indicateur de l'agence active gérée par ce Directeur */}
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                                Agence de Douala - Bali
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Coffre connecté" />
                        </div>
                    </div>

                    {/* Actions de Profil */}
                    <div className="flex items-center gap-3 relative">
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" title="Alerte encaissement / validation de solde requise" />
                        </button>

                        <hr className="w-px h-6 bg-slate-200" />

                        {/* Menu Profil */}
                        <div>
                            <button 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                    RM
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-xs font-bold text-slate-800 leading-tight">Mbah Rodrigue</p>
                                    <p className="text-[10px] text-slate-400 font-semibold">Directeur d'Agence</p>
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
                            </button>

                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                                        <Link href="/agency/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                            <User className="w-3.5 h-3.5" /> Mon Compte
                                        </Link>
                                        <button onClick={() => handleLogout()} className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                                            <LogOut className="w-3.5 h-3.5" /> Se déconnecter
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* EMPLACEMENT DES PAGES COMPOSANTES (CHILDREN) */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}