import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;

    // Optionnel : Active les logs internes bruts de la bibliothèque Pusher dans la console
    // Décommentez la ligne ci-dessous si vous avez besoin de déboguer les trames réseau WS (très verbeux)
    // Pusher.logToConsole = true;
}

// 🔑 Instance globale typée avec son argument générique
let echoInstance: Echo<any> | null = null;

export const useEcho = () => {
    // 🔑 Correction appliquée ici : Ajout de <any> pour satisfaire la contrainte générique du State
    const [echo, setEcho] = useState<Echo<any> | null>(echoInstance);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!echoInstance) {
            console.log("📡 [Echo/Reverb] Initialisation d'une nouvelle instance (Singleton)...");

            try {
                echoInstance = new Echo({
                    broadcaster: 'reverb',
                    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
                    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
                    wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080'),
                    wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080'),
                    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
                    enabledTransports: ['ws', 'wss'],
                    disableStats: true,
                });

                console.log("✅ [Echo/Reverb] Instance créée avec succès. Configuration de l'écoute des états réseau...");

                // 🔌 Interception des états de la connexion WebSocket (Pusher Connector)
                const pusherClient = echoInstance.connector.pusher;

                pusherClient.connection.bind('connecting', () => {
                    console.log("⏳ [Echo/Reverb] Connexion au serveur de WebSocket en cours...");
                });

                pusherClient.connection.bind('connected', () => {
                    console.log(`🚀 [Echo/Reverb] Connecté avec succès ! ID de connexion : ${pusherClient.connection.socket_id}`);
                });

                pusherClient.connection.bind('disconnected', () => {
                    console.warn("🔌 [Echo/Reverb] Déconnecté du serveur de WebSocket.");
                });

                pusherClient.connection.bind('unavailable', () => {
                    console.error("❌ [Echo/Reverb] Le serveur de WebSocket est inaccessible (Vérifiez si Reverb tourne).");
                });

                pusherClient.connection.bind('failed', () => {
                    console.error("💥 [Echo/Reverb] Échec de la connexion. Problème de configuration ou de droits.");
                });

                // Écoute spécifique aux erreurs TLS / Handshake
                pusherClient.connection.bind('error', (err: any) => {
                    console.error("⚠️ [Echo/Reverb] Erreur sur le canal de transport :", err);
                });

            } catch (error) {
                console.error("💥 [Echo/Reverb] Erreur critique lors de l'initialisation de Laravel Echo :", error);
            }
        } else {
            console.log("♻️ [Echo/Reverb] Réutilisation de l'instance existante (Singleton).");
        }

        setEcho(echoInstance);

        return () => {
            // Nettoyage si nécessaire au démontage global
        };
    }, []);

    return echo;
};