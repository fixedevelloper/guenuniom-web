'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LockKeyhole, RefreshCw, Layers, Coins } from 'lucide-react';

const openTillSchema = z.object({
    till_id: z.string().min(1, "Veuillez sélectionner un guichet de caisse"),
    opening_balance: z.string().transform((val) => parseFloat(val) || 0),
});

interface TillItem {
    id: number;
    name: string;
    code: string;
    current_balance: number;
}

interface Props {
    currency: string;
    onOpeningSuccess: () => void;
}

export default function TillOpeningScreen({ currency, onOpeningSuccess }: Props) {
    const [selectedTill, setSelectedTill] = useState<TillItem | null>(null);

    // 1. Charger les caisses associées à l'agence de l'utilisateur
    const { data: tills, isLoading: loadingTills } = useQuery<TillItem[]>({
        queryKey: ['agencyTills'],
        queryFn: async () => {
            const res = await api.get('/cash/agency-tills');
            return res.data.data;
        },
        // Désactive les rafraîchissements automatiques pendant que l'utilisateur choisit sa caisse
        staleTime: Infinity,          // La liste des caisses physiques de l'agence ne change pas toutes les 10s
        refetchOnWindowFocus: false,  // Ne pas recharger si l'utilisateur change d'onglet
    });
    const form = useForm({
        resolver: zodResolver(openTillSchema),
        defaultValues: { till_id: '', opening_balance: 0 as any }
    });

    // 2. Traitement de la mutation d'ouverture de caisse physique
    const openMutation = useMutation({
        mutationFn: async (values: any) => {
            const res = await api.post('/cash/session/open', values);
            return res.data;
        },
        onSuccess: (res) => {
            toast.success("Guichet Activé !", { description: res.message });
            onOpeningSuccess(); // Notifie le Layout pour re-basculer l'affichage global
        },
        onError: (err: any) => {
            toast.error("Erreur d'ouverture", {
                description: err.response?.data?.message || "Impossible d'initier la caisse."
            });
        }
    });

    return (
        <Card className="w-full max-w-lg border-slate-200 shadow-xl bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white text-center py-6">
                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">
                    <LockKeyhole className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Ouverture de Session Guichet</CardTitle>
                <CardDescription className="text-slate-400 text-xs font-medium">
                    Aucune caisse n'est active pour votre session. Sélectionnez votre guichet physique pour démarrer.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((v) => openMutation.mutate(v))} className="space-y-5">

                        {/* CHAMP 1 : SÉLECTION DE LA CAISSE (TILL) PROPRE À L'AGENCE */}
                        <FormField
                            control={form.control}
                            name="till_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                        <Layers className="w-3.5 h-3.5 text-blue-600" /> Choisir votre guichet physique
                                    </FormLabel>
                                    <FormControl>
                                        <select
                                            {...field}
                                            disabled={loadingTills}
                                            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
                                            onChange={(e) => {
                                                field.onChange(e.target.value);
                                                const found = tills?.find(t => t.id === parseInt(e.target.value));
                                                if (found) {
                                                    setSelectedTill(found);
                                                    // Optionnel : pré-remplir le champ avec le dernier solde connu comptablement
                                                    form.setValue('opening_balance', found.current_balance as any);
                                                }
                                            }}
                                        >
                                            <option value="">-- Sélectionner une caisse --</option>
                                            {tills?.map((till) => (
                                                <option key={till.id} value={till.id}>
                                                    {till.name} ({till.code})
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* AFFICHAGE DU SOLDE THÉORIQUE DE LA CAISSE SÉLECTIONNÉE */}
                        {selectedTill && (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-500">Dernier solde de fermeture enregistré :</span>
                                <span className="font-mono text-slate-900">
                                    {new Intl.NumberFormat('fr-FR').format(selectedTill.current_balance)} {currency}
                                </span>
                            </div>
                        )}

                        {/* CHAMP 2 : FOND DE CAISSE PHYSIQUE RECOMPTÉ */}
                        <FormField
                            control={form.control}
                            name="opening_balance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                        <Coins className="w-3.5 h-3.5 text-emerald-600" /> Saisir le fond de caisse réel recompté ({currency})
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="h-12 font-mono font-black text-lg rounded-xl focus-visible:ring-blue-600"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={openMutation.isPending || loadingTills}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider rounded-xl gap-2 mt-2 shadow-lg shadow-blue-100"
                        >
                            {openMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LockKeyhole className="w-4 h-4" />}
                            {openMutation.isPending ? 'Ouverture de session...' : 'Valider l\'ouverture du guichet'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}