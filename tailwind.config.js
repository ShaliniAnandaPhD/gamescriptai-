/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                'gemini-blue': '#4285F4',
                'gemini-purple': '#8E6FF7',
                'gemini-cyan': '#00D9FF',
                'gemini-pink': '#FF6B9D',
            },
            backgroundImage: {
                'gradient-gemini': 'linear-gradient(135deg, #4285F4 0%, #8E6FF7 100%)',
            },
            boxShadow: {
                'glow-gemini': '0 0 20px rgba(66, 133, 244, 0.3)',
                'glow-success': '0 0 20px rgba(52, 211, 153, 0.3)',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["Outfit", "sans-serif"],
                display: ["Space Grotesk", "sans-serif"],
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
