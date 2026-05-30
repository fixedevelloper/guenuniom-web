'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Lock, Phone } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginInput) => {
        try {
            // 1. Appel via Fetch natif pour contourner les intercepteurs Axios
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const resData = await response.json();

            // 2. Gestion des erreurs de réponse (ex: 401, 422, 403)
            if (!response.ok) {
                throw new Error(resData.message || "Identifiants invalides");
            }

            // 3. Stockage dans le store Zustand (Token + User)
            setAuth(resData.access_token, resData.user);

            toast.success("Bienvenue sur Agensic");

            // 4. Redirection vers le dashboard
            router.push('/');

        } catch (error: any) {
            console.error("Erreur Login:", error);
            toast.error(error.message || "Une erreur technique est survenue.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
            <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl border border-slate-100 p-8">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                        <Lock className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Espace Agent</h1>
                    <p className="text-slate-500 text-sm mt-1">Connectez-vous pour accéder à vos opérations</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Numéro de téléphone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                {...register('phone')}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="6XX XXX XXX"
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs ml-1">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                {...register('password')}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password.message}</p>}
                    </div>

                    <button
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
                        ) : "Se connecter"}
                    </button>
                </form>
            </div>
        </div>
    );
}