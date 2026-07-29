import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ── Racine du projet ─────────────────────────────────────────
     Un package-lock.json traîne dans C:\Users\<user>\ : sans cette ligne,
     Next remonte jusque-là pour déduire la racine du workspace et se met à
     surveiller / tracer tout le dossier utilisateur (OneDrive compris).
     Dev et build en sont considérablement ralentis.                       */
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,

  /* ── Sécurité HTTP headers ────────────────────────────────── */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        /* Les réponses d'API portent des données patient : jamais de cache,
           ni navigateur ni CDN. Récupéré de netlify.toml, supprimé depuis. */
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },

  /* ── Images distantes autorisées ─────────────────────────── */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
