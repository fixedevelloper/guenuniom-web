'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationGroups } from '@/utils/navigation';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shrink-0 overflow-y-auto",
            isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}>
            <div className="space-y-6">
                {/* Logo */}
                <div className="flex items-center justify-between h-10 px-2 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-200">
                            A
                        </div>
                        <span className="text-lg font-black tracking-wider text-slate-900">AGENSIC</span>
                    </div>
                    <button
                        className="lg:hidden p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Navigation Groupée */}
                <nav className="space-y-5">
                    {navigationGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-1.5">
                            {/* Titre du groupe */}
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4">
                                {group.title}
                            </h4>

                            {/* Liens du groupe */}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold relative transition-all duration-200 group",
                                                isActive
                                                    ? "bg-blue-50 text-blue-600"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-blue-600 rounded-r-full" />
                                            )}
                                            <item.icon className={cn(
                                                "w-4 h-4 transition-colors",
                                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                            )} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Déconnexion */}
            <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-sm font-semibold transition-all duration-200 group w-full"
                >
                    <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}