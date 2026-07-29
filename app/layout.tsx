import "./globals.css";
import { Syne, Inter } from "next/font/google";
import AppShell from "@/components/ui/app-shell";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: {
    default: "THOR — Clair Vision & Clair Audition",
    template: "%s — THOR",
  },
  description: "THOR, le logiciel certifié pour opticiens et audioprothésistes. Agenda, dossiers patients, devis normalisés, hébergement HDS.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default" as const,
    title: "THOR",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0A0A0B",
    "msapplication-config": "none",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2D8CFF" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${inter.variable}`}>
      <head>
        {/* Anti-flash dark mode : applique le thème AVANT le premier paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('thor_dark_mode');if(t==='1')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
        <AppShell>
          <main className="min-h-screen">{children}</main>
        </AppShell>
      </body>
    </html>
  );
}
