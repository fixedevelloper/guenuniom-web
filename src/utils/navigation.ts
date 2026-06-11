import {
    LayoutDashboard,
    UserCheck,
    ArrowLeftRight,
    Receipt,
    Globe,
    Terminal,
    Users, Building2, ShieldAlert, ShieldCheck, CircleDollarSign, FileArchiveIcon, MessageCircle
} from 'lucide-react';

export const navigationGroups = [
    {
        title: "Principal",
        items: [
            { name: "Vue d'ensemble", href: '/global-dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: "Opérations & Contrôle",
        items: [
            { name: 'Transactions Globales', href: '/global-dashboard/transactions', icon: ArrowLeftRight },
            { name: 'Commissions', href: '/global-dashboard/commissions', icon: CircleDollarSign },
            { name: 'Validation KYC', href: '/global-dashboard/kyc', icon: UserCheck },
            { name: 'Documents', href: '/global-dashboard/documents', icon: FileArchiveIcon },
            {
                name: 'Chat',
                href: '/global-dashboard/chat',
                icon: MessageCircle,
            }
        ]
    },
    {
        title: "Configuration Régionale",
        items: [
            { name: 'Frais & Commissions', href: '/global-dashboard/fees', icon: Receipt },
            { name: 'Gestion des Pays', href: '/global-dashboard/countries', icon: Globe },
            { name: 'Gestion du personnel', href: '/global-dashboard/staff', icon: Users },
            {
                name: 'Gestion des Agences',
                href: '/global-dashboard/agency',
                icon: Building2,
            },
        ]
    },
    {
        title: "Maintenance",
        items: [
            { name: 'Logs Système', href: '/global-dashboard/logs/system', icon: Terminal },
            { name: 'Logs Connexion', href: '/global-dashboard/logs/connections', icon: ShieldAlert },
            { name: 'Anti-fraude', href: '/global-dashboard/fraud-checks', icon: ShieldCheck },
        ]
    }
];