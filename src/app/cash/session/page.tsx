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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle2, Coins, Landmark } from 'lucide-react';

const openSchema = z.object({
    opening_balance: z.string().transform((val) => parseFloat(val) || 0),
});

const closeSchema = z.object({
    declared_balance: z.string().transform((val) => parseFloat(val) || 0),
    notes: z.string().optional(),
});

export default function CashSessionPage() {
    const [declaredInput, setDeclaredInput] = useState<number>(0);

    // 1. Récupération de l'état de la session de caisse
    const { data: statusData, isLoading, refetch } = useQuery({
        queryKey: ['cashSessionStatus'],
        queryFn: async () => {
            const res = await api.get('/cash/session/status');
            return res.data.data;
        }
    });

    // Formulaires
    const openForm = useForm({ resolver: zodResolver(openSchema), defaultValues: { opening_balance: 0 as any } });
    const closeForm = useForm({ resolver: zodResolver(closeSchema), defaultValues: { declared_balance: 0 as any, notes: '' } });

    // 2. Mutation : Ouvrir la caisse
    const openMutation = useMutation({
        mutationFn: async (values: any) => {
            const res = await api.post('/cash/session/open', values);
            return res.data;
        },
        onSuccess: (res) => {
            toast.success("Caisse ouverte !", { description: res.message });
            openForm.reset();
            refetch();
        },
        onError: (err: any) => {
            toast.error("Erreur d'ouverture", { description: err.response?.data?.message });
        }
    });

    // 3. Mutation : Clôturer la caisse
    const closeMutation = useMutation({
        mutationFn: async (values: any) => {
            const res = await api.post('/cash/session/close', values);
            return res.data;
        },
        onSuccess: (res) => {
            toast.success("Caisse clôturée !", { description: res.message });
            closeForm.reset();
            setDeclaredInput(0);
            refetch();
        },
        onError: (err: any) => {
            toast.error("Erreur de clôture", { description: err.response?.data?.message });
        }
    });

    if (isLoading) {
        return <div className="p-10 text-center font-mono text-xs font-bold text-slate-400 animate-pulse">CHARGEMENT DU BROUILLARD DE CAISSE...</div>;
    }

    const isOpen = statusData?.is_open ?? false;
    const currentBalance = statusData?.current_balance || 0;
    const currency = statusData?.currency || 'XAF';
    const difference = declaredInput - currentBalance;

    return (
        <div className="max-w-3xl mx-auto space-y-6 p-1">
            {/* EN-TÊTE DYNAMIQUE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-slate-700" /> Gestion de Session de Caisse
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Agence : <span className="font-bold text-slate-700">{statusData?.agency_name}</span>. Contrôle des flux d'espèces du guichet.
                    </p>
                </div>
                <Badge className={`rounded-xl px-3 py-1 font-bold text-xs uppercase tracking-wider ${isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {isOpen ? '● Caisse Ouverte' : '○ Caisse Fermée'}
                </Badge>
            </div>

            {/* VUE 1 : COMPOSANT OUVERTURE (SI LA CAISSE EST FERMÉE) */}
            {!isOpen ? (
                <Card className="border-slate-200 shadow-sm animate-in fade-in-50 duration-200">
                    <CardHeader className="bg-slate-50/50 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Unlock className="w-4 h-4 text-emerald-600" /> Initialiser la caisse (Début de service)
                        </CardTitle>
                        <CardDescription>
                            Saisissez le montant des espèces physiques disponibles dans votre tiroir-caisse pour démarrer la journée.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Form {...openForm}>
                            <form onSubmit={openForm.handleSubmit((v) => openMutation.mutate(v))} className="space-y-4">
                                <FormField
                                    control={openForm.control}
                                    name="opening_balance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-700">Fond de caisse initial ({currency})</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" className="h-12 font-mono font-black text-lg rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={openMutation.isPending} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-xs rounded-xl gap-2">
                                    {openMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                                    Ouvrir la caisse & autoriser les flux
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            ) : (
                /* VUE 2 : COMPOSANT CLÔTURE (SI LA CAISSE EST OUVERTE) */
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="bg-slate-900 text-white border-0">
                            <CardHeader className="py-4">
                                <CardDescription className="text-[10px] font-black uppercase tracking-wider text-slate-400">Solde attendu (Système)</CardDescription>
                                <CardTitle className="text-3xl font-mono font-black text-emerald-400">
                                    {new Intl.NumberFormat('fr-FR').format(currentBalance)} <span className="text-sm font-sans font-medium text-white">{currency}</span>
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className={`border transition-all duration-300 ${difference === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : difference > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            <CardHeader className="py-4">
                                <CardDescription className="text-[10px] font-black uppercase tracking-wider text-slate-400">Écart constaté en temps réel</CardDescription>
                                <CardTitle className="text-3xl font-mono font-black">
                                    {difference > 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR').format(difference)} <span className="text-sm font-sans font-medium">{currency}</span>
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {difference === 0 ? (
                        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Caisse équilibrée. Prête pour l'arrêté des comptes.
                        </div>
                    ) : (
                        <div className={`p-3 border rounded-xl text-xs font-semibold flex items-start gap-2.5 ${difference > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p><strong>Écart détecté ({difference > 0 ? 'Surplus' : 'Manquant'}) :</strong> recomptez les espèces du coffre. Une note justificative claire est exigée pour figer la journée.</p>
                        </div>
                    )}

                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="pt-6">
                            <Form {...closeForm}>
                                <form onSubmit={closeForm.handleSubmit((v) => {
                                    if (difference !== 0 && !v.notes) {
                                        closeForm.setError('notes', { message: "Note obligatoire en cas d'écart." });
                                        return;
                                    }
                                    closeMutation.mutate(v);
                                })} className="space-y-4">
                                    <FormField
                                        control={closeForm.control}
                                        name="declared_balance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                    <Coins className="w-4 h-4 text-blue-600" /> Montant physique recompté (Espèces réelles)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="0.00" className="h-12 font-mono font-black text-lg text-slate-900 rounded-xl" {...field} onChange={(e) => { field.onChange(e.target.value); setDeclaredInput(parseFloat(e.target.value) || 0); }} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={closeForm.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-700">Notes / Justifications des écarts de caisse</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Ex: Écart lié à un rendu de monnaie ou aux coupures de billets..." className="rounded-xl min-h-[90px] text-xs font-medium" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Separator className="my-2" />
                                    <Button type="submit" disabled={closeMutation.isPending} className="w-full h-11 bg-slate-950 hover:bg-slate-900 text-xs font-black uppercase tracking-wider rounded-xl gap-2">
                                        {closeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                        Arrêter les comptes & Fermer la caisse
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}