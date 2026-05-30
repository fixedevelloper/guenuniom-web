import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fonction utilitaire pour combiner des classes Tailwind CSS de manière sécurisée.
 * - clsx : gère les classes conditionnelles.
 * - twMerge : résout les conflits (ex: 'p-2 p-4' devient 'p-4').
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}