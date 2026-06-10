'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Lock, Phone } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    // 2. Initialisation de React Hook Form
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            phone: '',
            password: ''
        }
    });

    const onSubmit = async (data: LoginInput) => {
        try {
            // Plus besoin de manipuler data.prefix ici, il est déjà synchronisé
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.message || "Identifiants invalides");
            }

            setAuth(resData.data.access_token, resData.data.access_token, resData.data.user);
            toast.success("Bienvenue sur Guen's union");
            router.push('/');

        } catch (error: any) {
            console.error("Erreur Login:", error);
            toast.error(error.message || "Une erreur technique est survenue.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-[420px] bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">

                {/* Header */}
                <div className="text-center mb-8 sm:mb-10">
                    <div className="mx-auto max-w-[280px] w-full h-auto p-4 sm:p-6 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#87c540]/20">
                        <img
                            src="/logo.png"
                            alt="Guen's Union Logo"
                            className="w-full h-auto object-contain max-h-[100px]"
                        />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Espace Agent</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Connectez-vous pour accéder à vos opérations</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">

                    {/* Zone Téléphone */}
                    <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700 ml-1">
                            Numéro de téléphone
                        </label>

                        <div className="relative flex items-center">
                            <Phone className="absolute left-3 w-5 h-5 text-slate-400 pointer-events-none" />

                            {/* Input du numéro */}
                            <input
                                type="tel"
                                {...register('phone')}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1d9e4b] focus:ring-2 focus:ring-[#1d9e4b]/20 outline-none transition-all text-sm sm:text-base text-slate-900 font-medium"
                                placeholder="2376XX XXX XXX"
                            />
                        </div>

                        {(errors.phone) && (
                            <p className="text-red-500 text-xs ml-1 mt-1">
                                { errors.phone?.message}
                            </p>
                        )}
                    </div>

                    {/* Mot de passe */}
                    <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-slate-700 ml-1">Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                {...register('password')}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1d9e4b] focus:ring-2 focus:ring-[#1d9e4b]/20 outline-none transition-all text-sm sm:text-base text-slate-900"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-xs ml-1 mt-1">{errors.password.message}</p>}
                    </div>

                    {/* Bouton de connexion */}
                    <button
                        disabled={isSubmitting}
                        className="w-full bg-[#1d9e4b] hover:bg-[#1a8e43] disabled:bg-[#1d9e4b]/60 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-md shadow-[#87c540]/30 flex items-center justify-center gap-2 text-sm sm:text-base mt-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Connexion...</span>
                            </>
                        ) : (
                            "Se connecter"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}