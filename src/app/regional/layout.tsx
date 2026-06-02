'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuthStore } from '@/store/useAuthStore';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Building2,
    BarChart3,
    TrendingUp,
    Users,
    LogOut,
    Menu,
    X,
    MapPin,
    Layers,
    Loader2,
    Coins,
    DollarSign
} from 'lucide-react';

export default function RegionalAdminLayout({
                                                children,
                                            }: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const router = useRouter();
    const { token, user, logout } = useAuthStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // =================================================================
    // 1. TOUS LES HOOKS EN PREMIER (Obligatoire pour React)
    // =================================================================

    useEffect(() => {
        if (!token) {
            router.replace('/login');
        }
    }, [token, router]);

    // Déplacé ici pour être exécuté systématiquement au démarrage
    const { data: regionalData, isLoading } = useQuery({
        queryKey: ['regionalAdminMetrics'],
        queryFn: async () => {
            const { data } = await api.get('/reporting/regional-metrics');
            return data.data; // { region_name, total_cash, active_tills_count, agencies_count, user }
        },
        refetchInterval: 30000, // Rafraîchissement global toutes les 30s (Vue manager)
        enabled: !!token, // Sécurité supplémentaire : n'exécute pas la requête si le token n'est pas encore là
    });

    // =================================================================
    // 2. LES ACTIONS / FONCTIONS DE GESTION
    // =================================================================

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    // =================================================================
    // 3. LES COMPOSANTS CONDITIONNELS ET RENDUS PRÉCOCES (Strictement après les hooks)
    // =================================================================

    // Protection n°1 : Pas de token, on n'affiche rien (Redirection en cours via useEffect)
    if (!token) {
        return null;
    }

    // Protection n°2 : Token présent, mais les données financières chargent encore
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Consolidation des flux nationaux...
                </p>
            </div>
        );
    }

    // ALIGNEMENT : Navigation synchronisée avec les routes de l'interface Country Admin (/regional/*)
    const navigation = [
        { name: 'Tableau de bord pays', href: '/regional/dashboard', icon: BarChart3 },
        { name: 'Supervision des Agences', href: '/regional/agencies', icon: Building2 },
        { name: 'Suivi des Caisses & Guichets', href: '/regional/tills', icon: Layers },
        { name: 'Flux & Transactions Réseau', href: '/regional/transactions', icon: TrendingUp },
        { name: 'Gestion des Équipes (Staff)', href: '/regional/staff', icon: Users },
        {
            name: 'Gestion des frais',
            href: '/regional/fees',
            icon: Coins
        },
    ];

    // =================================================================
    // 4. LE RENDU DU COMPOSANT PRINCIPAL
    // =================================================================
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-green-500 selection:text-white">

            {/* ─── HEADER DE SUPERVISION LARGE (IDENTITY CONTROL) ─── */}
            <header className="bg-green-950 text-white shadow-sm z-40 sticky top-0 px-6 py-3 border-b border-green-900/60 backdrop-blur-md bg-opacity-95">
                <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between">

                    {/* Zone d'identification de la Juridiction / Pays */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 hover:bg-green-900/60 border border-green-900 rounded-xl text-green-300 transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <div className="flex flex-col">
                            <img
                                src="/logo.png"
                                alt="Guen's Union Logo"
                                className="w-50 h-20 object-contain"
                            />
                            <span className="text-[11px] font-semibold text-green-200/70 flex items-center gap-1.5 mt-1 bg-green-900/40 border border-green-900/50 px-2 py-0.5 rounded-md">
                                <MapPin className="w-3 h-3 text-rose-400" /> Territoire : <span className="text-white font-bold">{regionalData?.region_name || 'Non défini'}</span>
                            </span>
                        </div>
                    </div>

                    {/* KPI GLOBAL : ENCOURS TOTAL DU PAYS */}
                    <div className="bg-green-900/40 border border-green-800/60 pl-4 pr-1.5 py-1 rounded-xl flex items-center gap-4 shadow-inner transition-all hover:border-green-700">
                        <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest font-black text-green-300">Espèces Consolidées (Réseau)</p>
                            <p className="text-base font-mono font-black text-amber-400 tracking-tight">
                                {new Intl.NumberFormat('fr-FR').format(regionalData?.total_cash || 0)}
                                <span className="text-xs ml-1.5 text-green-300 font-sans font-medium">XAF</span>
                            </p>
                        </div>
                        <div className="bg-amber-500/10 p-2.5 rounded-lg text-amber-400 hidden sm:block border border-amber-500/20">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Profil Administrateur Pays */}
                    <div className="flex items-center gap-3 border-l border-green-900 pl-4">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-slate-100 tracking-tight">{regionalData?.user?.name || 'Opérateur'}</p>
                            <p className="text-[10px] text-green-400 font-mono font-medium tracking-wide uppercase mt-0.5">
                                National Admin
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-green-900/50 hover:bg-rose-950/40 border border-green-900 hover:border-rose-900/60 text-slate-400 hover:text-rose-400 rounded-xl transition-all duration-150"
                            title="Déconnexion du poste de contrôle"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>

                </div>
            </header>

            {/* ─── CADRE DE NAVIGATION & ZONE DE TRAVAIL MAX-ÉCRAN ─── */}
            <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative px-4 sm:px-6 lg:px-8">

                {/* SIDEBAR DE NAVIGATION NATIONALE */}
                <aside className={`
                    fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                    lg:relative lg:translate-x-0 lg:flex lg:flex-col
                    transition-transform duration-200 ease-in-out z-30 w-72 bg-white border-r border-slate-200/80 pt-24 lg:pt-8 pr-6 pl-2 space-y-6
                `}>
                    <div className="space-y-2">
                        <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Supervision Nationale</p>
                        <nav className="space-y-1.5 pt-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center justify-between group px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 relative ${
                                            isActive
                                                ? 'bg-[#1d9e4b] text-white shadow-md shadow-green-500/10'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200/60'}`}>
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <span className="tracking-tight">{item.name}</span>
                                        </div>

                                        {isActive && (
                                            <span className="absolute right-0 top-1/3 bottom-1/3 w-1 bg-white rounded-l-md" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* CONTENU DE LA PAGE */}
                <main className="flex-1 py-6 lg:py-8 lg:pl-6 overflow-x-hidden bg-slate-50/50">
                    <div className="w-full max-w-full animation-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
