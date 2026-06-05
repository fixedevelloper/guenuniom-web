'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import TillOpeningScreen from '@/components/cash/TillOpeningScreen';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    Building,
    Clock,
    MonitorPlay,
    Loader2,
    ArrowLeftRight,
    PlusCircle,
    MinusCircle,
    SendHorizontal,
    Download,
    Receipt,
    CalendarClock,
    LayoutDashboard,
    Users
} from 'lucide-react';

export default function CashierLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Récupérer le statut de la caisse avec la bonne extraction de données
    const { data: sessionData, isLoading, refetch } = useQuery({
        queryKey: ['cashierSession'],
        queryFn: async () => {
            const response = await api.get('/cash/session/status');
            return response.data?.data ?? response.data;
        },
        refetchInterval: (query) => {
            const isOpen = query.state.data?.is_open;
            return isOpen ? 10000 : false;
        },
        refetchOnWindowFocus: false,
    });

    const handleLogout = async () => {
        try {
            await api.post('/logout');
            router.push('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion', error);
        }
    };

    // Écran de chargement initial typé "FinTech App"
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 space-y-4">
                <div className="relative flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-500 z-10" />
                    <div className="absolute w-16 h-16 bg-green-500/10 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-black tracking-widest text-white uppercase">GUEN'S UNION</p>
                    <p className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider">
                        Vérification des écritures de caisse...
                    </p>
                </div>
            </div>
        );
    }

    const isOpen = sessionData?.is_open ?? false;
    const currency = sessionData?.currency || 'XAF';

    const navigation = [
        {
            title: "Tableau de Bord",
            items: [
                {
                    name: 'Dashboard',
                    href: '/cash',
                    icon: LayoutDashboard,
                    color: 'text-emerald-500 bg-emerald-500/10'
                },
            ]
        },
        {
            title: "Opérations Courantes",
            items: [
                { name: 'Transfert Wallet', href: '/cash/transfer', icon: ArrowLeftRight, color: 'text-emerald-500 bg-emerald-500/10' },
                { name: 'Dépôt / Cash-in', href: '/cash/cash-in', icon: PlusCircle, color: 'text-blue-500 bg-blue-500/10' },
                { name: 'Retrait / Cash-out', href: '/cash/cash-out', icon: MinusCircle, color: 'text-amber-500 bg-amber-500/10' },
            ]
        },
        {
            title: "Remittance (International)",
            items: [
                { name: 'Envoi', href: '/cash/remittance/send', icon: SendHorizontal, color: 'text-pink-500 bg-pink-500/10' },
                { name: 'Retrait', href: '/cash/remittance/payout', icon: Download, color: 'text-cyan-500 bg-cyan-500/10' },
            ]
        },
        {
            title: "Bancaire & Remises",
            items: [
                // Remplacement de MonitorPlay par Receipt pour s'aligner sur la comptabilité
                { name: 'Paiement Factures', href: '/cash/bills-payment', icon: Receipt, color: 'text-orange-500 bg-orange-500/10' },
            ]
        },
        {
            title: "Gestion & Audit",
            items: [
                {
                    name: 'Clients',
                    href: '/cash/customers',
                    icon: Users, // Remplacement de History par Users pour la sémantique
                    color: 'text-indigo-500 bg-indigo-500/10'
                },
                { name: 'Historique', href: '/cash/history', icon: History, color: 'text-slate-500 bg-slate-500/10' },
                { name: 'Session & Ajustements', href: '/cash/session', icon: CalendarClock, color: 'text-purple-500 bg-purple-500/10' },
            ]
        }
    ];
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-green-500 selection:text-white">

            {/* ─── HEADER SÉCURISÉ EXTRA-LARGE ─── */}
            <header className="bg-slate-950/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm z-40 sticky top-0 px-6 py-3">
                <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between">

                    {/* Infos Marque et Agence */}
                    <div className="flex items-center gap-4">
                        {isOpen && (
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        )}
                        <div className="flex flex-col">
                            {/* Brand Header */}
                            <img
                                src="/logo.png"
                                alt="Guen's Union Logo"
                                className="w-50 h-20 object-contain"
                            />
                            {/* Session Metadata */}
                            <div className="flex items-center flex-wrap gap-x-2 text-[11px] font-semibold text-slate-400 mt-1">
                                {/* Agency Badge */}
                                <span className="flex items-center gap-1 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded-md text-slate-300">
            <Building className="w-3 h-3 text-green-500" />
                                    {sessionData?.agency_name || "Unknown Agency"}
        </span>

                                {/* Conditional Till Badge */}
                                {isOpen && (
                                    <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-amber-400 font-mono">
                <MonitorPlay className="w-3 h-3" />
                                        {sessionData?.till_name || "Unknown Till"}
            </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Encaisse Actuelle (Affichage Financier) */}
                    {isOpen && (
                        <div className="bg-slate-900 border border-slate-800/80 pl-4 pr-1.5 py-1 rounded-xl flex items-center gap-4 transition-all hover:border-slate-700">
                            <div className="text-right">
                                <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Espèces en Coffre</p>
                                <p className="text-base font-mono font-black text-emerald-400 tracking-tight">
                                    {new Intl.NumberFormat('fr-FR').format(sessionData?.current_balance || 0)}
                                    <span className="text-xs ml-1.5 text-slate-400 font-sans font-medium">{currency}</span>
                                </p>
                            </div>
                            <div className="bg-emerald-500/10 p-2.5 rounded-lg text-emerald-400 hidden sm:block border border-emerald-500/20">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                    )}

                    {/* Profil & Actions Opérateur */}
                    <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold text-slate-200 tracking-tight">{sessionData?.user?.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono font-medium tracking-wide uppercase mt-0.5">
                                Statut : <span className={isOpen ? "text-emerald-500 font-bold" : "text-slate-400"}>{isOpen ? 'Actif' : 'Fermé'}</span>
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 text-slate-400 hover:text-rose-400 rounded-xl transition-all duration-150"
                            title="Fermer la session / Déconnexion"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── CADRE DE NAVIGATION & ZONE DE TRAVAIL MAX-ÉCRAN ─── */}
            <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative px-4 sm:px-6 lg:px-8">
                {!isOpen ? (
                    /* Écran d'ouverture centré */
                    <div className="flex-1 p-6 flex items-center justify-center bg-slate-50/50">
                        <TillOpeningScreen currency={currency} onOpeningSuccess={() => refetch()} />
                    </div>
                ) : (
                    <>
                        {/* Barre Latérale Restylée */}
                        <aside className={`
                            fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                            lg:relative lg:translate-x-0 lg:flex lg:flex-col
                            transition-transform duration-200 ease-in-out z-30 w-72 bg-white border-r border-slate-200/80 pt-34 lg:pt-8 pr-6 pl-2 space-y-6
                        `}>
                            <div className="space-y-2">
                                {navigation.map((section) => (
                                    <div key={section.title} className="mb-8">
                                        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            {section.title}
                                        </p>
                                        <nav className="space-y-1">
                                            {section.items.map((item) => {
                                                const isActive = pathname === item.href;
                                                const Icon = item.icon;
                                                return (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-md font-bold transition-all ${
                                                            isActive
                                                                ? 'bg-[#1d9e4b] text-white shadow-md'
                                                                : 'text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {item.name}
                                                    </Link>
                                                );
                                            })}
                                        </nav>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* Zone d'affichage des écrans enfants (max-w-full pour libérer l'espace) */}
                        <main className="flex-1 py-6 lg:py-8 lg:pl-6 overflow-x-hidden bg-slate-50/50">
                            <div className="w-full max-w-full animation-fade-in">
                                {children}
                            </div>
                        </main>
                    </>
                )}
            </div>
        </div>
    );
}