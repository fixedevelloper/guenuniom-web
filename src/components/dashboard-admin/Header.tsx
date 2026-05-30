'use client';

import { Menu, Building2 } from 'lucide-react';

interface HeaderProps {
    user: any;
    onMenuOpen: () => void;
}

export function Header({ user, onMenuOpen }: HeaderProps) {
    const primaryRole = user?.roles?.[0] || 'Agent';

    // Génération des initiales pour l'avatar
    const userInitials = user?.first_name && user?.last_name
        ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
        : user?.username?.substring(0, 2).toUpperCase() || 'AG';

    return (
        <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30">
            <div className="flex items-center gap-3">
                <button
                    className="lg:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={onMenuOpen}
                >
                    <Menu className="w-5 h-5 text-slate-600" />
                </button>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{user?.agency || 'Agence Générale'}</span>
                </div>
            </div>

            <div className="flex items-center gap-3.5">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 leading-none">{user?.first_name} {user?.last_name}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{primaryRole}</p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-inner tracking-wider select-none">
                    {userInitials}
                </div>
            </div>
        </header>
    );
}