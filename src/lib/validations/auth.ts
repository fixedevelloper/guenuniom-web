import { z } from 'zod';

export const loginSchema = z.object({
    phone: z.string().min(9, "Le numéro doit comporter au moins 9 chiffres"),
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

export type LoginInput = z.infer<typeof loginSchema>;