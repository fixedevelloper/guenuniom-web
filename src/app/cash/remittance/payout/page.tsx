'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

import {
    ArrowDownLeft,
    Search,
    ShieldCheck,
    UserCheck,
    RefreshCw,
    FileText,
    Calendar,
    Banknote,
    AlertCircle,
    XCircle
} from 'lucide-react';
import {TillSessionGuard} from "../../../../components/guards/till-session-guard";

// Schéma de validation d'identité pour le paiement
const payoutFormSchema = z.object({
    reference: z.string().min(5, "Le code MTCN est requis"),
    secure_code: z.string().min(1, "Le code secret d'impression/sécurité est requis"),
    recipient_id_type: z.enum(['cni', 'passport', 'recepisse', 'carte_sejour'], {
        required_error: "Le type de pièce est requis",
    }),
    recipient_id_number: z.string().min(3, "Le numéro de pièce est requis").max(150),
    recipient_id_expiry: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(), {
        message: "La pièce présentée doit être en cours de validité",
    }),
});

type PayoutFormValues = z.infer<typeof payoutFormSchema>;

export default function PayoutRemittancePage() {
    const [mtcnSearch, setMtcnSearch] = useState<string>('');
    const [foundTransfer, setFoundTransfer] = useState<any>(null);
    const [businessError, setBusinessError] = useState<string | null>(null);

    const form = useForm<PayoutFormValues>({
        resolver: zodResolver(payoutFormSchema),
        defaultValues: {
            reference: '',
            secure_code: '',
            recipient_id_type: undefined,
            recipient_id_number: '',
            recipient_id_expiry: '',
        },
    });

    // 1. Mutation : Recherche de la référence MTCN via méthode GET (alignée sur Laravel)
    const searchMutation = useMutation({
        mutationFn: async (code: string) => {
            if (!code) return;
            setBusinessError(null);
            // Utilisation du verbe GET avec passage de la référence dans les query params
            const { data } = await api.get('/remittance/payout/search', {
                params: { reference: code.trim() }
            });
            return data.data;
        },
        onSuccess: (data) => {
            setFoundTransfer(data);
            form.setValue('reference', data.reference);
            // Si l'API retourne déjà le code sécurisé pour validation visuelle, on l'injecte facultativement
            form.setValue('secure_code', data.secure_code || '');

            toast.success("Mandat localisé !", {
                description: `Bénéficiaire attendu : ${data.recipient_name}`
            });
        },
        onError: (error: any) => {
            setFoundTransfer(null);
            const apiMessage = error.response?.data?.message || "Code de transfert introuvable.";

            // Si le backend renvoie un code 422 (Mandat payé, annulé...), on affiche l'alerte métier claire
            if (error.response?.status === 422) {
                setBusinessError(apiMessage);
            } else {
                toast.error("Recherche impossible", { description: apiMessage });
            }
        }
    });

    // 2. Mutation : Soumission finale du Payout
    const payoutMutation = useMutation({
        mutationFn: async (values: PayoutFormValues) => {
            const { data } = await api.post('/remittance/payout', values);
            return data;
        },
        onSuccess: (response) => {
            toast.success("Décaissement validé avec succès !", {
                description: `Veuillez remettre ${new Intl.NumberFormat('fr-FR').format(response.data.paid_amount || foundTransfer.amount)} ${response.data.currency || foundTransfer.currency} au bénéficiaire.`,
                duration: 15000,
            });
            form.reset();
            setFoundTransfer(null);
            setMtcnSearch('');
            setBusinessError(null);
        },
        onError: (error: any) => {
            toast.error("Erreur de décaissement", {
                description: error.response?.data?.message || "Le paiement n'a pas pu être exécuté."
            });
        }
    });

    const onSearchTrigger = (e: React.FormEvent) => {
        e.preventDefault();
        if (mtcnSearch.trim()) {
            searchMutation.mutate(mtcnSearch);
        }
    };

    const onSubmitPayout = (values: PayoutFormValues) => {
        payoutMutation.mutate(values);
    };

    return (
        <TillSessionGuard>
        <div className="max-w-6xl mx-auto space-y-6 p-1">
            {/* Header */}
            <div className="flex flex-col gap-1 border-b pb-4">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <ArrowDownLeft className="w-6 h-6 text-emerald-600" /> Payer / Décaisser un Mandat Cash
                </h2>
                <p className="text-sm text-muted-foreground">
                    Interface de paiement. Vérification de la disponibilité des fonds et enregistrement KYC du bénéficiaire.
                </p>
            </div>

            {/* BARRE DE RECHERCHE INITIALE */}
            <div className="space-y-4">
                <Card className="border-blue-100 bg-gradient-to-r from-blue-50/40 via-transparent to-transparent shadow-sm">
                    <CardContent className="pt-6">
                        <form onSubmit={onSearchTrigger} className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Saisir la Référence du Transfert (MTCN)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Ex: TX-XXXX-YYMMDD"
                                        value={mtcnSearch}
                                        onChange={(e) => setMtcnSearch(e.target.value.toUpperCase())}
                                        className="pl-9 h-11 font-mono font-bold tracking-widest text-base rounded-xl uppercase"
                                        disabled={searchMutation.isPending || payoutMutation.isPending}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase h-11 rounded-xl px-6 gap-2"
                                disabled={searchMutation.isPending || !mtcnSearch.trim()}
                            >
                                {searchMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Vérifier la disponibilité
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Bloc d'affichage d'erreurs métiers critiques (ex: Déjà payé) */}
                {businessError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in duration-150">
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Blocage de conformité opérationnel</p>
                            <p className="text-xs text-red-700 font-medium mt-0.5">{businessError}</p>
                        </div>
                    </div>
                )}
            </div>

            {foundTransfer && !businessError && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitPayout)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* FORMULAIRE D'IDENTIFICATION DU BÉNÉFICIAIRE PRESENT (2/3) */}
                        <div className="lg:col-span-2 space-y-6 animate-in fade-in-50 duration-200">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="bg-slate-50/50 py-4">
                                    <CardTitle className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-emerald-500" /> Contrôle & Enregistrement de la Pièce du Bénéficiaire
                                    </CardTitle>
                                    <CardDescription>
                                        Examinez et recopiez scrupuleusement le document officiel présenté physiquement au guichet.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5">

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="recipient_id_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-700">Type de Pièce Fournie</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="rounded-xl">
                                                                <SelectValue placeholder="Choisir—" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="cni">CNI (Nationale)</SelectItem>
                                                            <SelectItem value="passport">Passeport International</SelectItem>
                                                            <SelectItem value="recepisse">Récépissé de Pièce</SelectItem>
                                                            <SelectItem value="carte_sejour">Carte de Séjour</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="recipient_id_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-700">N° de Document</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input placeholder="Ex: 20034912" {...field} className="pl-9 font-mono font-bold uppercase rounded-xl" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="recipient_id_expiry"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-700">Date de Validité / Expiration</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input type="date" {...field} className="pl-9 rounded-xl" />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="secure_code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-700">Code Secret Securisé (Fourni par le client)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: XAF-XXX-XXX" {...field} className="rounded-xl font-bold font-mono text-center uppercase tracking-wider" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-amber-800 text-xs flex gap-2.5 items-start mt-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                        <p className="leading-relaxed">
                                            <strong>Règle de conformité LAB-CFT :</strong> Le nom écrit sur la pièce d'identité doit correspondre phonétiquement ou strictement au nom attendu indiqué sur le volet de droite. En cas de doute, suspendez le paiement.
                                        </p>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>

                        {/* VOLET DE DROITE : VISUALISATION COMPTOIR & DISPATCH CASH (1/3) */}
                        <div className="space-y-4">
                            <Card className="bg-slate-950 text-white shadow-xl border-0 rounded-2xl overflow-hidden">
                                <CardHeader className="bg-white/5 border-b border-white/5 py-4">
                                    <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <Banknote className="w-4 h-4 text-emerald-400" /> Ordre de Décaissement Caisse
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4">

                                    <div className="space-y-3 text-xs">
                                        <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1 text-center">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">NET À PAYER AU COMPTOIR</p>
                                            <p className="text-3xl font-mono font-black text-emerald-400 tracking-tight">
                                                {new Intl.NumberFormat('fr-FR').format(foundTransfer.amount)}
                                                <span className="text-sm font-sans text-white font-medium ml-1.5">{foundTransfer.currency}</span>
                                            </p>
                                        </div>

                                        <Separator className="bg-white/10 my-2" />

                                        <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Bénéficiaire Attendu :</span>
                                                <span className="text-sm font-bold text-slate-100 uppercase">{foundTransfer.recipient_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Téléphone Cible :</span>
                                                <span className="font-mono text-slate-200 font-bold">{foundTransfer.recipient_phone}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 p-1 text-slate-300">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Expéditeur initial :</span>
                                                <span className="font-medium text-white">{foundTransfer.sender_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Provenance :</span>
                                                <span className="font-medium text-white">
                                                    {foundTransfer.source_city ? `${foundTransfer.source_city} (${foundTransfer.source_country})` : foundTransfer.source_country}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Date d'émission :</span>
                                                <span>{new Date(foundTransfer.created_at).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={payoutMutation.isPending}
                                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                                    >
                                        {payoutMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                        {payoutMutation.isPending ? 'Écritures Comptables...' : 'Décaisser & Clôturer'}
                                    </Button>

                                </CardContent>
                            </Card>
                        </div>

                    </form>
                </Form>
            )}
        </div>
        </TillSessionGuard>
    );
}