# CLAUDE.md

> Document de contexte destiné à **Claude Code**.  
> À lire systématiquement avant toute tâche sur ce dépôt.

---

## 1. Vue d'ensemble

Ce dépôt regroupe l'écosystème **Thor** : une vitrine globale et plusieurs produits SaaS verticaux destinés aux professionnels de la santé sensorielle.

| Produit | Rôle | Public cible | Couleur dominante |
|---|---|---|---|
| **Thor** | Site vitrine de l'écosystème + IA indépendante portant le même nom | Grand public, prospects, partenaires | Neutre (noir / blanc / accent) |
| **Clai Vision** | SaaS métier | Opticiens et professionnels de l'optique | **Bleu** |
| **Clair Audition** | SaaS métier | Audioprothésistes et professionnels de l'audition | **Vert** |

L'IA **Thor** est intégrée comme assistant conversationnel transverse à l'écosystème.

### 1.1 Deux branches sous une marque ombrelle

THOR se présente au public comme un carrefour vers deux offres distinctes. Elles ne doivent
jamais être mélangées dans une même section : les publics n'ont rien en commun.

| Branche | Page d'entrée | Promesse | Public | Accent |
|---|---|---|---|---|
| **THOR Studio** | `/studio` | Accompagnement de A à Z pour créer une activité : étude du marché adressable, identité, site sur mesure, suivi après lancement | Créateurs d'entreprise, TPE, indépendants | Indigo `#6366F1` |
| **THOR Produits** | `/produits` | Plateformes métier prêtes à l'emploi, conformité santé intégrée | Professionnels de santé | Bleu `#2D8CFF` |

Le **portfolio** (`/realisations`) est commun aux deux branches : il sert de preuve pour l'une
comme pour l'autre. Sa source de vérité unique est [`lib/realisations.ts`](lib/realisations.ts) —
ajouter un projet consiste à ajouter une entrée dans ce tableau, jamais à modifier un composant.

Le module de **visualisation du marché adressable** est annoncé comme « en préparation » sur
`/studio`. Tant qu'il n'existe pas, l'étude est produite à la main : ne pas le présenter comme
disponible.

---

## 2. Direction artistique

**Identité globale : « giga-futuriste, épuré à la Apple, accessible à tous ».**

Cette double exigence est le fil conducteur de toute décision visuelle :

- **Futuriste** : profondeur, transparence, glassmorphism subtil, animations fluides, micro-interactions, dégradés maîtrisés, typographie moderne (sans-serif géométrique).
- **Épuré** : beaucoup d'espace blanc, hiérarchie typographique forte, peu d'éléments par écran, pas de surcharge décorative, alignements rigoureux sur grille.
- **Accessible** : vocabulaire simple, jamais de jargon technique exposé à l'utilisateur final, contrastes WCAG AA minimum, parcours évidents en 1 à 3 clics.

### Règles dures

1. Une page = une idée principale. Si une page contient deux messages forts, elle devient deux pages.
2. Pas plus de **2 niveaux** de hiérarchie typographique visibles simultanément à l'écran sans justification.
3. Les animations servent la compréhension, jamais la décoration. Durée par défaut : 200–400 ms, easing `cubic-bezier(0.4, 0, 0.2, 1)`.
4. Le contenu prime sur le contenant : aucune ombre, bordure ou effet n'est ajouté sans raison fonctionnelle.

### Tokens de couleur (à harmoniser avec le code existant)

```css
/* Thor — neutre */
--thor-bg:        #0A0A0B;
--thor-surface:   #FFFFFF;
--thor-text:      #0A0A0B;
--thor-accent:    #6366F1;  /* à confirmer */

/* Clai Vision — bleu */
--vision-primary: #0A84FF;
--vision-deep:    #003D82;
--vision-light:   #E8F2FF;

/* Clair Audition — vert */
--audition-primary: #00C16E;
--audition-deep:    #006B3C;
--audition-light:   #E8FBF1;

/* Communs */
--radius-sm: 8px;
--radius-md: 16px;
--radius-lg: 24px;
--blur-glass: 24px;
```

> Les valeurs ci-dessus sont des points de départ. **Avant tout ajout**, Claude Code doit lire les tokens réellement définis dans le code (Tailwind config, fichiers CSS, design tokens) et s'y conformer.

### Typographie

- Sans-serif géométrique pour titres et corps (Inter, SF Pro, ou équivalent open-source déjà en place — vérifier).
- Échelle modulaire stricte ; pas de tailles « entre deux ».
- Poids utilisés : 400 (corps), 500 (UI), 600 (titres). Le 700 reste exceptionnel.

---

## 3. Architecture du dépôt

> ⚠️ **État réel au 29/07/2026** : le dépôt n'est **pas** un monorepo. C'est une **application
> Next.js unique** (App Router) à la racine — `app/`, `components/`, `lib/`, `public/`. Il n'existe
> ni `apps/` ni `packages/`, et le gestionnaire de paquets est **npm**, pas pnpm. Les composants
> partagés vivent dans `components/ui/`, les tokens dans `app/globals.css` (`@theme inline`,
> Tailwind v4). Le schéma ci-dessous décrit une cible éventuelle, pas l'état actuel : ne pas
> écrire de code qui suppose son existence.

```
/
├── apps/
│   ├── thor/             # Vitrine + interface IA Thor
│   ├── clai-vision/      # SaaS optique (bleu)
│   └── clair-audition/   # SaaS audition (vert)
├── packages/
│   ├── ui/               # Composants partagés (Button, Card, Modal…)
│   ├── design-tokens/    # Couleurs, typographie, spacing, motion
│   ├── ai-thor/          # SDK + UI de l'IA Thor (réutilisable)
│   └── config/           # ESLint, TS, Tailwind partagés
├── docs/
└── CLAUDE.md             # ce fichier
```

**Principe :** tout composant utilisé par au moins deux apps vit dans `packages/ui`. Toute valeur de design vit dans `packages/design-tokens`. Les apps ne dupliquent jamais ces ressources.

---

## 4. Stack technique (à confirmer dans le code)

- **Framework** : Next.js (App Router) — React 18+
- **Langage** : TypeScript strict
- **Style** : Tailwind CSS + tokens CSS personnalisés
- **Animations** : Framer Motion (transitions, layout animations)
- **Icônes** : Lucide
- **Gestion d'état** : Zustand pour le local, React Query / tRPC pour le serveur (à confirmer)
- **Tests** : Vitest + Testing Library ; Playwright pour le E2E
- **Lint / Format** : ESLint + Prettier (configs partagées dans `packages/config`)
- **Package manager** : pnpm (workspaces)

---

## 5. Conventions de code

### Nommage

- Fichiers React : `PascalCase.tsx` pour les composants, `camelCase.ts` pour les utilitaires.
- Hooks : préfixe `use` obligatoire.
- Composants partagés : exportés depuis `packages/ui/index.ts`.
- Pas d'`export default` sauf pour les pages Next ; partout ailleurs, exports nommés.

### Styles

- Tailwind d'abord. CSS dédié uniquement si l'effet est impossible en utilitaires.
- Aucune valeur arbitraire (`text-[13px]`) hors tokens du design system.
- Les classes longues sont organisées avec `clsx` ou `tailwind-merge`, jamais concaténées en chaîne brute.

### Composants

- Un composant = un fichier. Les sous-composants privés vivent dans le même fichier ou dans un dossier `./_internal/`.
- Props typées explicitement (pas de `any`, pas de `unknown` non justifié).
- Accessibilité : tout composant interactif a un rôle ARIA correct, est navigable au clavier, et a un focus state visible.

### Git

- Branches : `feat/...`, `fix/...`, `chore/...`, `refactor/...`.
- Commits : convention Conventional Commits (`feat(vision): ajoute la vue stock`).
- Une PR = un objectif. Pas de PR fourre-tout.

---

## 6. Commandes principales

```bash
pnpm install              # installation
pnpm dev                  # lance toutes les apps en parallèle
pnpm dev --filter=thor    # lance une app précise
pnpm build                # build de production
pnpm lint                 # lint global
pnpm test                 # tests unitaires
pnpm test:e2e             # tests Playwright
pnpm typecheck            # vérification TypeScript stricte
```

Avant chaque PR : `pnpm lint && pnpm typecheck && pnpm test`.

---

## 7. Instructions spécifiques à Claude Code

### Avant d'écrire du code

1. **Lire** le ou les fichiers concernés dans leur intégralité, plus les fichiers voisins (composants utilisés, types importés).
2. **Vérifier** si un composant ou un utilitaire équivalent existe déjà dans `packages/ui` ou `packages/design-tokens`. Ne jamais dupliquer.
3. **Identifier l'app cible** (Thor / Vision / Audition) et appliquer la couleur dominante correspondante via les tokens, **jamais en dur**.

### Pendant l'écriture

- Privilégier des fonctions courtes, des composants à responsabilité unique.
- Pas de commentaire qui paraphrase le code. Les commentaires expliquent **pourquoi**, pas **quoi**.
- Si un changement touche plusieurs apps, toujours passer par `packages/ui` ou `packages/design-tokens`.

### Après l'écriture

- Lancer `pnpm lint` et `pnpm typecheck` sur les fichiers modifiés.
- Tester visuellement le rendu sur les trois marques quand un composant partagé est modifié.
- Mettre à jour ce `CLAUDE.md` si une convention nouvelle ou un dossier nouveau apparaît.

### Ce que Claude Code ne doit jamais faire

- Modifier les tokens de couleur sans demande explicite.
- Introduire une dépendance npm sans la justifier dans la PR.
- Casser le ton de la DA (« futuriste, épuré, accessible ») par excès d'effets ou de texte.
- Inventer des chemins, composants ou APIs : si un doute existe, **explorer le code** avant d'agir.
- Mélanger les marques (par ex. utiliser une couleur Audition dans Vision).
- **Aucun emoji nulle part dans le code rendu à l'utilisateur final.** Pas dans les pages publiques THOR, pas dans les espaces pro, pas dans les espaces patient, pas dans les composants partagés, pas dans les notifications, pas dans les toasts, pas dans les libellés de statut, pas dans les boutons, pas dans les commentaires affichés. Pour les pictogrammes, utiliser exclusivement des `<svg>` (Lucide ou inline). Pour les indicateurs de statut, utiliser des points CSS colorés (`<span class="...rounded-full bg-...">`).
- **Symboles texte autorisés** (rendus comme glyphes monochromes, pas des emojis colorés) : `→ ← ↑ ↓` (flèches), `✓` (coche succès), `✕ ×` (croix fermeture), `✗` (croix échec), `◑` (statut partiel), `▲ ▼ ◀ ▶` (chevrons UI), `★` à éviter (préférer texte `/5` ou SVG). Tous les autres caractères Unicode pictographiques sont interdits — y compris ceux des ranges U+1F300-U+1F9FF, U+2600-U+27BF (à part la liste autorisée), U+1F1E6-U+1F1FF (drapeaux). En cas de doute, utiliser un SVG.

---

## 8. Glossaire produit

- **Thor (site)** : la vitrine publique de l'écosystème.
- **Thor (IA)** : l'assistant conversationnel propriétaire intégré aux produits.
- **Clai Vision** : plateforme métier pour les opticiens (gestion, parcours client, outils visuels).
- **Clair Audition** : plateforme métier pour les audioprothésistes (équivalent côté audition).
- **Pro** : un utilisateur professionnel client d'un SaaS.
- **Patient / client final** : l'utilisateur final reçu par un Pro.

---

## 9. Roadmap brève (à maintenir)

À compléter par l'équipe au fil de l'eau. Claude Code peut s'y référer pour comprendre les priorités, mais ne modifie cette section que sur demande explicite.

- [ ] …
- [ ] …
- [ ] …

---

*Dernière mise à jour : à renseigner par le mainteneur lors de modifications structurelles.*
