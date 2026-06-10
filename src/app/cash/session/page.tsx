'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle2, Coins, Landmark, Receipt } from 'lucide-react';
import {api} from "../../../lib/api";

const openSchema = z.object({
    opening_balance: z.coerce
        .number({ message: "Veuillez entrer un montant initial valide" })
        .min(0, "Le montant initial ne peut pas être négatif"),
});

const closeSchema = z.object({
    declared_balance: z.coerce
        .number({ message: "Veuillez entrer un montant recompté valide" })
        .min(0, "Le montant déclaré ne peut pas être négatif"),
    notes: z.string().optional(),
});

export default function CashSessionPage() {
    const [declaredInput, setDeclaredInput] = useState<number>(0);

    // 1. Récupération de l'état de la session de caisse (Polling)
    const { data: statusData, isLoading, refetch } = useQuery({
        queryKey: ['cashSessionStatus'],
        queryFn: async () => {
            const res = await api.get('/cash/session/status');
            return res.data.data;
        }
    });

    // Formulaires
    const openForm = useForm({
        resolver: zodResolver(openSchema),
        defaultValues: { opening_balance: '' as any }
    });
    const closeForm = useForm({
        resolver: zodResolver(closeSchema),
        defaultValues: { declared_balance: '' as any, notes: '' }
    });

    // 2. Mutation : Ouvrir la caisse
    const openMutation = useMutation({
        mutationFn: async (values: any) => {
            const res = await api.post('/cash/session/open', values);
            return res.data;
        },
        onSuccess: (res) => {
            toast.success("Caisse ouverte avec succès !", {
                description: res.message || "Vous êtes maintenant autorisé à émettre et payer des mandats."
            });
            openForm.reset();
            refetch();
        },
        onError: (err: any) => {
            toast.error("Erreur d'ouverture", {
                description: err.response?.data?.message || "Impossible d'ouvrir le guichet."
            });
        }
    });

    // 3. Mutation : Clôturer la caisse
    const closeMutation = useMutation({
        mutationFn: async (values: any) => {
            const res = await api.post('/cash/session/close', values);
            return res.data;
        },
        onSuccess: (res) => {
            toast.success("Caisse clôturée avec succès !", {
                description: res.message || "La session de caisse est désormais verrouillée."
            });
            closeForm.reset();
            setDeclaredInput(0);
            refetch();
        },
        onError: (err: any) => {
            toast.error("Erreur de clôture", {
                description: err.response?.data?.message || "Vérifiez vos comptes avant de réessayer."
            });
        }
    });

    if (isLoading) {
        return <div className="p-10 text-center font-mono text-xs font-bold text-slate-400 animate-pulse tracking-widest">CHARGEMENT DU BROUILLARD DE CAISSE EN COURS...</div>;
    }

    const isOpen = statusData?.is_open ?? false;
    const virtualBalance = statusData?.current_balance || 0; // Solde comptable centralisé
    const expectedPhysicalBalance = statusData?.physical_balance || 0; // 💡 Cash attendu au tiroir
    const currency = statusData?.currency || 'XAF';

    // 💡 L'écart se calcule sur ce que l'agent a compté par rapport à ce que la caisse physique doit contenir
    const difference = declaredInput - expectedPhysicalBalance;

    return (
        <div className="max-w-3xl mx-auto space-y-6 p-1">
            {/* EN-TÊTE DYNAMIQUE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-slate-700" /> Gestion du Guichet & Tiroir-Caisse
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isOpen && statusData?.till_code ? (
                            <>Guichet actif : <span className="font-bold text-slate-800">[{statusData.till_code}] - {statusData.till_name}</span> | Agence : {statusData?.agency_name}</>
                        ) : (
                            <>Agence : <span className="font-bold text-slate-700">{statusData?.agency_name}</span>. Contrôle des flux d'espèces.</>
                        )}
                    </p>
                </div>
                <Badge className={`rounded-xl px-3 py-1 font-bold text-xs uppercase tracking-wider border ${isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {isOpen ? '● Session Ouverte' : '○ Session Fermée'}
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
                            Saisissez le montant des espèces physiques (fond de caisse de départ) disponibles dans votre tiroir-caisse pour démarrer la journée.
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
                                                <Input type="number" step="1" placeholder="0" className="h-12 font-mono font-black text-lg rounded-xl" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={openMutation.isPending} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-xs rounded-xl gap-2 transition-all">
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

                    {/* GRILLE DES DOUBLE SOLDE ISSUS DE L'API */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Solde Physique Attendu (Cash tiroir) */}
                        <Card className="bg-slate-900 text-white border-0 shadow-sm">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <Coins className="w-3.5 h-3.5 text-emerald-400" /> Espèces attendues (Tiroir)
                                </p>
                                <p className="text-2xl font-mono font-black text-emerald-400 mt-1">
                                    {new Intl.NumberFormat('fr-FR').format(expectedPhysicalBalance)} <span className="text-xs font-sans font-medium text-white">{currency}</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Solde Virtuel Comptable */}
                        <Card className="bg-slate-100 text-slate-900 border-slate-200 shadow-sm">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <Receipt className="w-3.5 h-3.5 text-slate-500" /> Position Comptable (Virtuel)
                                </p>
                                <p className="text-2xl font-mono font-black text-slate-800 mt-1">
                                    {new Intl.NumberFormat('fr-FR').format(virtualBalance)} <span className="text-xs font-sans font-medium text-slate-500">{currency}</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Écart constaté */}
                        <Card className={`border shadow-sm transition-all duration-300 ${difference === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : difference > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            <CardContent className="pt-4 pb-4">
                                <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Écart constaté (Physique vs Attendu)</p>
                                <p className="text-2xl font-mono font-black mt-1">
                                    {difference > 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR').format(difference)} <span className="text-xs font-sans font-medium">{currency}</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* BLOCS INFOS CONFORMITÉ ALERTE / ACCORD */}
                    {difference === 0 ? (
                        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tiroir-caisse parfaitement équilibré avec les registres système. Prêt pour l'arrêt de fin de journée.
                        </div>
                    ) : (
                        <div className={`p-3 border rounded-xl text-xs font-semibold flex items-start gap-2.5 ${difference > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Écart détecté ({difference > 0 ? 'Excédent / Surplus de Cash' : 'Manquant de Cash'})</p>
                                <p className="font-medium opacity-90 mt-0.5">Veuillez recompter précisément vos billets physiques. Une note justificative claire et circonstanciée est obligatoire pour figer l'état financier et autoriser la fermeture.</p>
                            </div>
                        </div>
                    )}

                    {/* FORMULAIRE DE CLÔTURE */}
                    <Card className="shadow-sm border-slate-200">
                        <CardContent className="pt-6">
                            <Form {...closeForm}>
                                <form onSubmit={closeForm.handleSubmit((v) => {
                                    if (difference !== 0 && !v.notes?.trim()) {
                                        closeForm.setError('notes', { message: "Une note justificative est obligatoire en cas d'écart de caisse." });
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
                                                    <Coins className="w-4 h-4 text-green-600" /> Montant physique recompté au guichet (Espèces réelles en main)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        placeholder="0"
                                                        className="h-12 font-mono font-black text-lg text-slate-900 rounded-xl"
                                                        {...field}
                                                        value={(field.value as string | number) ?? ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            field.onChange(val);
                                                            setDeclaredInput(parseFloat(val) || 0);
                                                        }}
                                                    />
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
                                                <FormLabel className="text-xs font-bold text-slate-700">Notes d'ajustement / Justification des écarts</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Exemple : Manquant de 100 XAF imputé à un micro-rendu de monnaie ou billet détérioré refusé..."
                                                        className="rounded-xl min-h-[90px] text-xs font-medium"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Separator className="my-2" />
                                    <Button type="submit" disabled={closeMutation.isPending} className="w-full h-11 bg-slate-950 hover:bg-slate-900 text-xs font-black uppercase tracking-wider rounded-xl gap-2 transition-all">
                                        {closeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                        Arrêter les comptes & Fermer le guichet
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