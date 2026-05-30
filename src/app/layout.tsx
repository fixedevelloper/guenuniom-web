import type { Metadata } from "next";
import { Toaster } from "sonner"; // Notification système
import { cn } from "@/lib/utils";
import "./globals.css";

// Vos polices (Geist & Inter)
import { geistMono, inter } from "@/lib/fonts";
import {Providers} from "./providers/providers";
import {QueryProvider} from "./providers/query-provider";

export const metadata: Metadata = {
  title: "Agensic FinTech | Dashboard",
  description: "Plateforme de gestion de transfert d'argent sécurisée",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
          lang="fr" // Changed to 'fr' for your target market
          className={cn(
              "h-full bg-slate-50",
              "antialiased",
              geistMono.variable,
              inter.variable,
              "font-sans"
          )}
      >
      <body className="min-h-screen flex flex-col">
     <QueryProvider>
             <main className="flex-grow">
                 {children}
             </main>
     </QueryProvider>
     <Toaster richColors position="top-right" />
      </body>
      </html>
  );
}