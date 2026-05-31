'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Composants Shadcn UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

import {
    ArrowUpRight,
    ShieldCheck,
    Scale,
    RefreshCw,
    User,
    Globe,
    Banknote,
    Smartphone,
    MapPin,
    Calendar,
    FileText
} from 'lucide-react';
import {TillSessionGuard} from "../../../../components/guards/till-session-guard";

// Schéma de validation aligné strictement sur les règles de validation du backend Laravel
const remittanceFormSchema = z.object({
    amount: z.number()
        .min(100, "Le montant minimum pour un transfert est de 100 XAF"),

    // Informations obligatoires de l'expéditeur (KYC complet)
    sender_first_name: z.string().min(3, "Le prénom doit contenir au moins 3 caractères").max(150),
    sender_last_name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(150),
    sender_phone: z.string().min(3, "Numéro de téléphone expéditeur requis").max(150),
    sender_id_type: z.enum(
        ['cni', 'passport', 'recepisse', 'carte_sejour']
    ),
    sender_id_number: z.string().min(3, "Le numéro de pièce est requis").max(150),
    sender_id_expiry: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(), {
        message: "La pièce d'identité doit posséder une date d'expiration future",
    }),
    sender_email: z.string().email("Format email invalide").max(150).optional().or(z.literal('')),
    sender_city_id: z
        .string()
        .min(1, "La ville de résidence est obligatoire"),
    sender_address: z.string().min(3, "L'adresse résidentielle est requise").max(255),

    // Informations du bénéficiaire
    recipient_name: z.string().min(3, "Le nom du bénéficiaire doit contenir au moins 3 caractères").max(150),
    recipient_phone: z.string().min(3, "Le téléphone de destination est requis").max(20),
    recipient_email: z.string().email("Format email invalide").max(150).optional().or(z.literal('')),
    destination_country_id: z
        .string()
        .min(1, "Veuillez sélectionner le pays de destination"),
});

//type RemittanceFormValues = z.infer<typeof remittanceFormSchema>;
type RemittanceFormInput = z.input<typeof remittanceFormSchema>;
type RemittanceFormValues = z.output<typeof remittanceFormSchema>;
export default function SendRemittancePage() {
    const [quoteData, setQuoteData] = useState<any>(null);

    const form = useForm<
        RemittanceFormInput,
        any,
        RemittanceFormValues
        >({
        resolver: zodResolver(remittanceFormSchema),
        defaultValues: {
            amount: 0,
            sender_first_name: '',
            sender_last_name: '',
            sender_phone: '',
            sender_id_type: undefined as any,
            sender_id_number: '',
            sender_id_expiry: '',
            sender_email: '',
            sender_city_id: '',
            sender_address: '',
            recipient_name: '',
            recipient_phone: '',
            recipient_email: '',
            destination_country_id: '',
        },
    });

    const watchAmount = form.watch('amount');
    const watchRecipientCountry = form.watch('destination_country_id');

    // 1. Charger la liste des pays partenaires
    const { data: countries } = useQuery({
        queryKey: ['countriesList'],
        queryFn: async () => {
            const { data } = await api.get('/countries');
            return data.data;
        }
    });

    // 1b. Charger la liste des villes (pour l'agence ou la zone de l'expéditeur)
    const { data: cities } = useQuery({
        queryKey: ['citiesList'],
        queryFn: async () => {
            const { data } = await api.get('/cities/agency');
            return data.data;
        }
    });

    // 2. Mutation de tarification dynamique (estimateFees)
    const quoteMutation = useMutation({
        mutationFn: async () => {
            if (!watchAmount || watchAmount < 100 || !watchRecipientCountry) {
                toast.warning("Simulation impossible", {
                    description: "Spécifiez un montant minimum (100 XAF) et un pays cible."
                });
                return;
            }

            const { data } = await api.post('/remittance/estimate-fees', {
                amount: watchAmount,
                type: 'remittance',
                destination_country_id: Number(watchRecipientCountry)
            });
            return data.data;
        },
        onSuccess: (data) => {
            if (data) {
                setQuoteData(data);
                toast.success("Ticket financier calculé", {
                    description: "Les frais du corridor ont été mis à jour avec succès."
                });
            }
        },
        onError: (error: any) => {
            toast.error("Erreur de tarification", {
                description: error.response?.data?.message || "Impossible de calculer les frais."
            });
        }
    });

    // 3. Mutation principale d'émission (initiate)
    const sendMutation = useMutation({
        mutationFn: async (values: RemittanceFormValues) => {
            // Transformation propre des IDs string en nombres pour Laravel avant l'envoi
            const payload = {
                ...values,
                destination_country_id: Number(values.destination_country_id),
                sender_city_id: Number(values.sender_city_id),
                sender_email: values.sender_email || null,
                recipient_email: values.recipient_email || null,
            };
            const { data } = await api.post('/remittance/initiate', payload);
            return data;
        },
        onSuccess: (response) => {
            toast.success("Mandat émis avec succès !", {
                description: `Réf MTCN: ${response.data.reference} | Code Reçu: ${response.data.secure_code}`,
                duration: 12000,
            });
            form.reset();
            setQuoteData(null);
        },
        onError: (error: any) => {
            toast.error("Échec de l'émission", {
                description: error.response?.data?.message || "Une erreur critique est survenue."
            });
        }
    });

    const onSubmit = (values: RemittanceFormValues) => {
        sendMutation.mutate(values);
    };

   return (
    <TillSessionGuard>
        <div className="max-w-full mx-auto space-y-8 p-1 animate-in fade-in duration-300">

            {/* ─── HEADER EN-TÊTE D'EXPLOITATION ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span className="p-2 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20">
                            <ArrowUpRight className="w-5 h-5" />
                        </span>
                        Émettre un Transfert d'Argent
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Guichet de remittance internationale. Processus d'identification et scoring KYC en temps réel.
                    </p>
                </div>

                {/* Badge d'état de conformité */}
                <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 uppercase font-mono tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> AML/CFT Compliant
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ─── COLONNE DES FORMULAIRES (2/3) ─── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* SECTION : EXPÉDITEUR (KYC COMPLET) */}
                        <Card className="shadow-sm border-slate-200/80 rounded-2xl overflow-hidden transition-all hover:shadow-md/50">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-5">
                                <CardTitle className="text-[11px] font-extrabold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-slate-400" /> Identification de l'Expéditeur (KYC)
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-400 mt-0.5">Données d'identité certifiées requises pour la conformité réglementaire.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="sender_first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Prénom</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Jean-Pierre" {...field} className="rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs" />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sender_last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Nom de famille</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Mbah" {...field} className="rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs" />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="sender_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Téléphone portable</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                        <Input placeholder="6xx xxx xxx" {...field} className="pl-9 rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs font-mono font-medium" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sender_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Adresse Email <span className="text-slate-400 font-normal lowercase">(Optionnel)</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="expediteur@gmail.com" {...field} className="rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs" />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                                    <div className="relative flex justify-start"><span className="bg-white pr-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">Pièce d'identité officielle</span></div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="sender_id_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Type de Document</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 h-10 text-xs font-medium">
                                                            <SelectValue placeholder="Choisir—" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="cni" className="text-xs">CNI (Carte Nationale)</SelectItem>
                                                        <SelectItem value="passport" className="text-xs">Passeport</SelectItem>
                                                        <SelectItem value="recepisse" className="text-xs">Récépissé de CNI</SelectItem>
                                                        <SelectItem value="carte_sejour" className="text-xs">Carte de Séjour</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sender_id_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Numéro de Pièce</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                        <Input placeholder="Ex: 100349..." {...field} className="pl-9 font-mono font-bold uppercase rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs tracking-wider" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sender_id_expiry"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Date d'Expiration</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                        <Input type="date" {...field} className="pl-9 rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs font-medium text-slate-700" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="sender_city_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Ville de Résidence</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 h-10 text-xs font-medium">
                                                            <SelectValue placeholder="Sélectionner—" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        {cities?.map((city: any) => (
                                                            <SelectItem key={city.id} value={city.id.toString()} className="text-xs">
                                                                {city.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sender_address"
                                        render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Adresse Résidentielle Complète</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                        <Input placeholder="Quartier, Rue, Précisions de localisation physique" {...field} className="pl-9 rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* SECTION : BÉNÉFICIAIRE & CORRIDOR */}
                        <Card className="shadow-sm border-slate-200/80 rounded-2xl overflow-hidden transition-all hover:shadow-md/50">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-5">
                                <CardTitle className="text-[11px] font-extrabold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-green-500" /> Destination & Paramètres Financiers
                                </CardTitle>
                                <CardDescription className="text-[11px] text-slate-400 mt-0.5">Configuration du corridor monétaire et coordonnées du récepteur.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="recipient_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Nom Complet du Bénéficiaire</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Marie Laurence" {...field} className="rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs font-semibold" />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="recipient_phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Téléphone Portable Destination</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                        <Input placeholder="Ex: +241 07 xx xx xx" {...field} className="pl-9 rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs font-mono font-medium" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                    <FormField
                                        control={form.control}
                                        name="recipient_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Email <span className="text-slate-400 font-normal lowercase">(Optionnel)</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="beneficiaire@gmail.com" {...field} className="rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs" />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="destination_country_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Pays de Destination</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 h-10 text-xs font-bold text-slate-800">
                                                            <SelectValue placeholder="Pays cible" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        {countries?.map((country: any) => (
                                                            <SelectItem key={country.id} value={country.id.toString()} className="text-xs font-medium">
                                                                {country.name} ({country.currency_code ?? 'XAF'})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Montant Principal Net</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Banknote className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                        <Input
                                                            type="number"
                                                            placeholder="Ex: 50000"
                                                            className="pl-9 pr-20 font-mono font-black text-slate-900 rounded-xl border-slate-200 focus-visible:ring-green-500 h-10 text-xs tracking-tight"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => quoteMutation.mutate()}
                                                            disabled={quoteMutation.isPending || !field.value}
                                                            className="absolute right-1 top-1 h-8 text-[10px] font-black uppercase tracking-wider bg-[#1d9e4b] hover:bg-bg-[#87c540] text-white rounded-lg transition-colors shadow-sm px-2.5"
                                                        >
                                                            {quoteMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Calculer'}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-semibold" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ─── TICKET FINANCIER & DECOMPTE (1/3) ─── */}
                    <div className="lg:sticky lg:top-24">
                        <Card className="bg-slate-950 text-white shadow-xl border border-slate-900 rounded-2xl overflow-hidden">
                            <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4 px-5">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Scale className="w-3.5 h-3.5 text-green-400" /> Ticket Financier Réglementaire
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5">
                                {quoteData ? (
                                    <div className="space-y-3.5 text-xs">
                                        <div className="flex justify-between border-b border-white/5 pb-2.5">
                                            <span className="text-slate-400 font-medium">Principal Émis :</span>
                                            <span className="font-mono font-bold tracking-tight">
                                                {new Intl.NumberFormat('fr-FR').format(quoteData.sending_amount ?? watchAmount)} {quoteData.sender_currency ?? 'XAF'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2.5 text-amber-400/95 font-medium">
                                            <span>Frais de Service (+) :</span>
                                            <span className="font-mono font-bold tracking-tight">
                                                +{new Intl.NumberFormat('fr-FR').format(quoteData.total_fees ?? quoteData.fees)} {quoteData.sender_currency ?? 'XAF'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-2.5 text-slate-400 font-medium items-center">
                                            <span>Cours de Change (FX) :</span>
                                            <span className="font-mono text-[11px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-slate-300">
                                                1 = {quoteData.fx_rate ?? '1.00'} {quoteData.recipient_currency}
                                            </span>
                                        </div>

                                        <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/5 space-y-1 mt-4">
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Somme Finale à Délivrer :</p>
                                            <p className="text-lg font-mono font-black text-emerald-400 tracking-tight">
                                                {new Intl.NumberFormat('fr-FR').format(quoteData.recipient_amount ?? quoteData.base_amount)}
                                                <span className="text-xs font-sans text-slate-400 font-semibold ml-2">{quoteData.recipient_currency}</span>
                                            </p>
                                        </div>

                                        <div className="bg-green-500/10 p-3.5 rounded-xl border border-green-500/20 space-y-1">
                                            <p className="text-[9px] text-green-400 uppercase tracking-widest font-black">À Percevoir Net en Caisse :</p>
                                            <p className="text-2xl font-mono font-black text-green-400 tracking-tight">
                                                {new Intl.NumberFormat('fr-FR').format(quoteData.total_payable ?? quoteData.total_amount_required)}
                                                <span className="text-xs font-sans text-white font-medium ml-2">{quoteData.sender_currency ?? 'XAF'}</span>
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 px-4 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-3">
                                            <Scale className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed font-medium">
                                            Saisissez un montant puis cliquez sur <span className="text-green-400 font-bold">"Calculer"</span> pour générer le décompte comptable.
                                        </p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={!quoteData || sendMutation.isPending}
                                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 mt-2"
                                >
                                    {sendMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    {sendMutation.isPending ? 'Validation Signature...' : 'Valider & Encaisser'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </form>
            </Form>
        </div>
    </TillSessionGuard>
);
}