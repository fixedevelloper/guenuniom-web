import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}", // Si vos fichiers sont dans app/
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
                geist: ["var(--font-geist-sans)", "sans-serif"],
            },
            colors: {
                brand: {
                    primary: '#1d9e4b',
                    secondary: '#87c540',
                }
            }
        },
    },
    plugins: [],
};

export default config;