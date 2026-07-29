/**
 * Source de vérité du portfolio THOR.
 *
 * Toute réalisation — SaaS de l'écosystème comme projet livré pour un client —
 * se décrit ici. Les pages /realisations et la home ne font que lire ce tableau,
 * de sorte qu'ajouter un projet ne demande aucune modification de composant.
 *
 * Migration future : ce module expose une API synchrone volontairement simple
 * (getAll / getBySlug / getFeatured) pour pouvoir être remplacé par des requêtes
 * Supabase sans toucher aux pages qui le consomment.
 */

export type RealisationCategory = "saas" | "site" | "outil";

export type Realisation = {
  slug: string;
  name: string;
  /** Sur-titre court affiché au-dessus du nom, ex. "Optique" */
  tagline: string;
  category: RealisationCategory;
  /** Secteur d'activité du client, sert de filtre */
  sector: string;
  year: number;
  /** Accroche de carte — 2 lignes maximum une fois rendue */
  summary: string;
  audience: string;
  /** Couleur dominante du projet (hex). Chaque projet garde la sienne. */
  accent: string;
  accentLight: string;
  status: "live" | "soon";
  /** Lien public. Absent tant que le projet n'est pas en ligne. */
  href?: string;
  /** Lien vers l'espace professionnel, quand il en existe un */
  proHref?: string;
  /** Visuel de couverture. À défaut, un dégradé signature est généré. */
  cover?: string;
  featured?: boolean;
  /** Branche THOR à laquelle le projet est rattaché */
  branch: "produits" | "studio";

  /* ── Contenu de la fiche détaillée ── */
  context: string;
  mission: string[];
  outcomes: { value: string; label: string }[];
  stack: string[];
  features: string[];
};

const REALISATIONS: Realisation[] = [
  {
    slug: "monsoldereel",
    name: "MonSoldeRéel",
    tagline: "Budget",
    category: "saas",
    sector: "Finance personnelle",
    year: 2026,
    summary:
      "Application de budget personnel qui calcule ce qui reste vraiment à dépenser une fois les charges fixes déduites, sans connexion bancaire.",
    audience: "Particuliers",
    accent: "#7C3AED",
    accentLight: "#F5F3FF",
    status: "live",
    href: "https://monsoldereel.fr/",
    featured: true,
    branch: "studio",
    context:
      "Le solde affiché par la banque ne dit rien de ce qu'on peut réellement dépenser : le loyer, les abonnements et les assurances n'ont pas encore été prélevés. MonSoldeRéel part de ce constat et affiche le montant qui reste une fois toutes les charges à venir déduites. Le tout sans jamais se connecter au compte bancaire.",
    mission: [
      "Conception d'un cycle budgétaire calé sur la date de paie plutôt que sur le mois calendaire",
      "Saisie manuelle rapide des opérations, pensée pour être tenue au quotidien",
      "Déduction automatique des charges fixes et rappels d'échéance",
      "Assistant conversationnel Pia, suivi des objectifs d'épargne et analyse des dépenses",
    ],
    outcomes: [
      { value: "0", label: "connexion bancaire" },
      { value: "Pia", label: "assistant intégré" },
      { value: "100 %", label: "propriété du client" },
    ],
    stack: [],
    features: [
      "Solde réel après déduction des charges fixes",
      "Cycle budgétaire aligné sur la paie",
      "Assistant conversationnel Pia",
      "Objectifs d'épargne et rappels d'échéance",
    ],
  },
  {
    slug: "clair-vision",
    name: "Clair Vision",
    tagline: "Optique",
    category: "saas",
    sector: "Santé",
    year: 2025,
    summary:
      "Plateforme métier pour opticiens et optométristes. Gestion complète du cabinet, du dossier patient à la facturation.",
    audience: "Opticiens · Optométristes · Visagistes",
    accent: "#2D8CFF",
    accentLight: "#EFF6FF",
    status: "live",
    href: "/clair-vision",
    proHref: "/connexion/praticien?module=vision",
    featured: true,
    branch: "produits",
    context:
      "Les opticiens jonglent entre un logiciel de caisse, un tableur de stock et un carnet de rendez-vous papier. Clair Vision réunit l'ensemble du parcours dans un seul outil, du premier rendez-vous à la facturation tiers payant.",
    mission: [
      "Cartographie du parcours métier avec des opticiens en exercice",
      "Conception d'une interface utilisable sans formation préalable",
      "Développement de la plateforme pro et de l'espace patient",
      "Architecture conforme aux exigences d'hébergement de données de santé",
    ],
    outcomes: [
      { value: "1 outil", label: "au lieu de quatre" },
      { value: "3 clics", label: "pour créer un devis" },
      { value: "HDS", label: "hébergement certifié" },
    ],
    stack: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS"],
    features: [
      "Dossiers patients et ordonnances",
      "Stock, devis, facturation, tiers payant",
      "Calculateur de lentilles intégré",
      "Assistant IA THOR pour la navigation",
    ],
  },
  {
    slug: "clair-audition",
    name: "Clair Audition",
    tagline: "Audiologie",
    category: "saas",
    sector: "Santé",
    year: 2025,
    summary:
      "Plateforme métier pour audioprothésistes. Bilans auditifs, suivi d'appareillage et essais réunis dans un seul outil.",
    audience: "Audioprothésistes · Assistants",
    accent: "#00C98A",
    accentLight: "#ECFDF5",
    status: "live",
    href: "/clair-audition",
    proHref: "/connexion/praticien?module=audition",
    featured: true,
    branch: "produits",
    context:
      "L'audioprothèse impose un suivi long : essais, réglages, renouvellements, service après-vente. Clair Audition tient ce fil sur toute la durée de vie de l'appareillage, sans ressaisie.",
    mission: [
      "Modélisation du cycle essai / appareillage / renouvellement",
      "Lecture automatique des audiogrammes par reconnaissance de caractères",
      "Espace patient avec messagerie et documents",
      "Tableaux de bord d'activité pour le gérant",
    ],
    outcomes: [
      { value: "0", label: "ressaisie d'audiogramme" },
      { value: "100 %", label: "du suivi centralisé" },
      { value: "HDS", label: "hébergement certifié" },
    ],
    stack: ["Next.js", "TypeScript", "Supabase", "OCR"],
    features: [
      "Audiogrammes et bilans auditifs",
      "Suivi d'appareillage et gestion des essais",
      "Agenda et messagerie patient",
      "Lecture des audiogrammes par IA",
    ],
  },
  {
    slug: "pharmaplanning",
    name: "PharmaPlanning",
    tagline: "Officine",
    category: "saas",
    sector: "Santé",
    year: 2025,
    summary:
      "Outil de planning et de gestion d'agenda pour pharmacies. Coordination d'équipe et organisation simplifiée.",
    audience: "Pharmaciens · Préparateurs",
    accent: "#059669",
    accentLight: "#D1FAE5",
    status: "live",
    href: "https://pharmapinvertagenda.vercel.app/",
    featured: true,
    branch: "produits",
    context:
      "Une officine fait tourner une équipe en horaires décalés. Les plannings vivaient sur un tableau blanc et un fichier partagé, avec les conflits que cela suppose.",
    mission: [
      "Agenda partagé temps réel entre tous les équipiers",
      "Gestion des congés et des remplacements",
      "Interface pensée pour une consultation rapide au comptoir",
    ],
    outcomes: [
      { value: "Temps réel", label: "planning partagé" },
      { value: "1 écran", label: "toute l'équipe visible" },
    ],
    stack: ["Next.js", "TypeScript", "Vercel"],
    features: [
      "Agenda partagé multi-équipiers",
      "Gestion des plannings et des congés",
      "Suivi des présences en temps réel",
      "Interface épurée et rapide",
    ],
  },
  {
    slug: "jarvis",
    name: "J.A.R.V.I.S",
    tagline: "Assistant IA",
    category: "outil",
    sector: "Intelligence artificielle",
    year: 2026,
    summary:
      "Assistant intelligent multi-usage. Compagnon conversationnel, automatisation et productivité, pensé pour aller à l'essentiel.",
    audience: "Tous publics · Pro et particulier",
    accent: "#0EA5E9",
    accentLight: "#F0F9FF",
    status: "live",
    href: "https://jarvis-pi-pied.vercel.app/",
    featured: true,
    branch: "produits",
    context:
      "Les assistants génériques demandent de tout réexpliquer à chaque conversation. J.A.R.V.I.S conserve le contexte et s'intègre directement aux outils de l'écosystème THOR.",
    mission: [
      "Moteur conversationnel avec mémoire persistante",
      "Automatisation de tâches répétitives",
      "Intégration native dans les plateformes THOR",
    ],
    outcomes: [
      { value: "Mémoire", label: "contexte conservé" },
      { value: "Natif", label: "intégré à l'écosystème" },
    ],
    stack: ["Next.js", "TypeScript", "Groq"],
    features: [
      "Conversations naturelles et contextuelles",
      "Automatisation de tâches répétitives",
      "Mémoire persistante des préférences",
      "Intégration native dans THOR",
    ],
  },
  {
    slug: "prochain-projet",
    name: "Votre projet",
    tagline: "Studio",
    category: "site",
    sector: "Tous secteurs",
    year: 2026,
    summary:
      "La prochaine réalisation de cette page est peut-être la vôtre. Création d'entreprise, site sur mesure, étude de marché.",
    audience: "Créateurs d'entreprise · TPE · Indépendants",
    accent: "#6366F1",
    accentLight: "#EEF2FF",
    status: "soon",
    branch: "studio",
    context:
      "THOR Studio accompagne la création d'une activité de bout en bout : cadrage, étude du marché adressable, identité, site et suivi après le lancement.",
    mission: [
      "Cadrage du projet et étude du marché adressable",
      "Identité visuelle et architecture du site",
      "Développement et mise en ligne",
      "Suivi et évolutions après le lancement",
    ],
    outcomes: [],
    stack: ["Next.js", "TypeScript", "Tailwind CSS"],
    features: [
      "Étude du marché adressable",
      "Site sur mesure, rapide et accessible",
      "Accompagnement de A à Z",
      "Suivi après la mise en ligne",
    ],
  },
];

export function getAllRealisations(): Realisation[] {
  return REALISATIONS;
}

export function getFeaturedRealisations(limit = 3): Realisation[] {
  return REALISATIONS.filter((r) => r.featured).slice(0, limit);
}

export function getRealisationBySlug(slug: string): Realisation | undefined {
  return REALISATIONS.find((r) => r.slug === slug);
}

/** Secteurs présents dans le portfolio, dans l'ordre d'apparition. */
export function getSectors(): string[] {
  return Array.from(new Set(REALISATIONS.map((r) => r.sector)));
}

export const CATEGORY_LABELS: Record<RealisationCategory, string> = {
  saas: "Plateforme métier",
  site: "Site web",
  outil: "Outil",
};
