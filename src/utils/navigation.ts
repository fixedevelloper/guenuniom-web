// config/navigation.ts
// utils/navigation.ts
import {
    LayoutDashboard,
    UserCheck,
    ArrowLeftRight,
    Receipt,
    Globe,
    Terminal,
    Users, Building2
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
            { name: 'Validation KYC', href: '/global-dashboard/kyc', icon: UserCheck },
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
            { name: 'Logs Système', href: '/global-dashboard/logs', icon: Terminal },
        ]
    }
];