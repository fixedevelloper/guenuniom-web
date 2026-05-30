'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function RootPage() {
    const router = useRouter();
    const { token, user } = useAuthStore();

    useEffect(() => {
        // 1. Si l'utilisateur n'est pas connecté, direction le login
        if (!token) {
            router.replace('/login');
            return;
        }

        // 2. Si le token existe mais que l'objet user n'est pas encore chargé, on patiente
        if (!user) return;

        // 3. Extraction et normalisation du rôle principal Spatie
        const userRoles = user.roles || [];
        const firstRole = userRoles[0];

        // Sécurité : Gère les cas où Spatie renvoie un tableau d'objets [{name: 'super_admin'}] ou de strings ['super_admin']
        const primaryRole = (typeof firstRole === 'object' ? firstRole?.name : firstRole)?.toLowerCase();

        // 4. Routage dynamique aligné sur l'architecture du Seeder et de la BDD
        switch (primaryRole) {
            case 'super_admin': // Correction : synchronisé avec l'enum BDD
                router.replace('/global-dashboard');
                break;

            case 'country_admin':
                router.replace('/regional/dashboard');
                break;

            case 'manager': // Ajout : Redirection spécifique pour le Directeur d'agence
                router.replace('/agency/dashboard');
                break;

            case 'cashier': // Correction : synchronisé avec l'enum BDD (Guichetier / Caissier)
                router.replace('/cash');
                break;

            case 'compliance':
                router.replace('/compliance-dashboard');
                break;

            case 'auditor':
                router.replace('/audit-dashboard');
                break;

            default:
                // Redirection de repli sécurisée en cas de rôle non répertorié ou de client/marchand
                console.warn(`Rôle d'infrastructure ou de sécurité non reconnu : ${primaryRole}`);
                router.replace('/dashboard');
                break;
        }
    }, [token, user, router]);

    // Écran de chargement pendant l'aiguillage des flux
    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-4 tracking-wider uppercase animate-pulse">
                Analyse du profil de sécurité...
            </p>
        </div>
    );
}