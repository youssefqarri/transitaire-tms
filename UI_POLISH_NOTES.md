# UI Polish — audit complet (branche `ui-polish-audit`)

Branche dédiée : `ui-polish-audit` (basée sur `main` au commit `c80246a`).

À tester en local :

```bash
git checkout ui-polish-audit
pnpm install
pnpm dev
# puis ouvre http://localhost:3000
```

Si ça te va → merge sur `main` :

```bash
git checkout main
git merge ui-polish-audit
git push
```

Si quelque chose ne te plaît pas, on annule juste cette branche sans toucher à `main`.

---

## Résumé des changements

### 🎨 Design tokens (foundation)

- Nouveaux tokens : `--color-fg-hover`, `--color-surface-3`, `--color-danger-hover`, `--color-success-hover`
- Système d'ombres : `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`
- Alias shadcn corrigé : `--color-primary` pointe maintenant sur `--color-accent` (avant : sur `--color-fg`, donc tous les "liens primary" étaient noirs)
- Focus visible global : anneau accent + outline-offset 2px
- Selection : surligné en accent doux
- `cursor: pointer` partout où c'est cliquable (Tailwind v4 ne le met plus par défaut)
- `cursor: not-allowed` sur les éléments disabled
- Inputs `date` : icône calendrier propre, cliquable sur toute la zone
- Sélection texte : en accent doux

### 🧱 Composants partagés (nouveaux)

- `<PageHeader title subtitle actions />` — en-tête de page standardisé
- `<EmptyState icon title hint cta />` — état vide unifié (au lieu de 4 styles différents)
- `<BackLink href>...</BackLink>` — lien de retour standardisé
- `<Skeleton />` + `<RowSkeleton />` + `<CardSkeleton />` avec animation **shimmer** (au lieu de `animate-pulse`)

### 🔘 Composants polis

- **Button** : variant `success` ajouté · état `loading` avec spinner intégré · `active:scale-[0.98]` · hover plus marqué sur outline
- **Badge** : variants `accent` et `solid` ajoutés · tailles `sm`/`default`/`lg`
- **Input** : hover qui assombrit la bordure · état invalide via `aria-invalid` · disabled mieux stylé
- **Textarea** : même polish qu'Input
- **Select** : même polish
- **Avatar** : 12 teintes douces dérivées du nom (au lieu d'un gris uniforme ou d'un gradient bleu→violet)
- **Card** : shadow-card de base · CardHeader plus aéré (py-3.5)
- **StatCard** : prop `href` pour rendre cliquable (drill-down) · prop `tone` (danger/warn/success)
- **StatusBadge** : refondu sans `before:` (plus fiable cross-browser), dot séparé

### 🧭 Navigation

- **Sidebar** : logo gradient accent · barre 2px latérale sur item actif · icône en accent quand actif · sous-titre "TMS · Douane Maroc" · indicateur "en ligne" en footer
- **Mobile-nav** : fix bug badge mal positionné (magic numbers) · même barre accent active · logo gradient
- **Topbar** : menu utilisateur avec close-on-outside-click + ESC · backdrop-blur · animation scale-in · avatar dans header

### 📄 Pages migrées (échelle moderne unifiée)

Pages "héritées" qui utilisaient `text-sm`/`text-2xl`/Tailwind par défaut migrées sur l'échelle moderne (text-[13px]/text-[22px]) :

- `clients/`, `clients/[id]`
- `fournisseurs/`, `fournisseurs/[id]`
- `dums/`
- `notifications/`
- `audit/`
- `emails/`
- `utilisateurs/`
- `factures/`, `factures/[id]`
- `parametres/`

### 📋 Pages spécifiquement polies

- **Login** : background avec gradients subtils en oklch, logo gradient accent → indigo, shadow-lg sur la card
- **Dashboard** :
  - StatCards cliquables (drill-down)
  - StatCard "À traiter" en orange si > 0 · "Clôturés ce mois" en vert
  - "Mouvements récents" : grid en desktop, flex en mobile (fix casse <1024px)
  - Skeleton shimmer
- **Liste dossiers** :
  - Empty state distinct vide / filtré (avec CTA "Réinitialiser")
  - Filter bar avec bouton X pour effacer la recherche
  - Bouton "Filtrer" avec état loading
  - Class `row-link` sur les Link de ligne (focus accent gauche)
- **Fiche dossier** :
  - `BackLink` partagé
  - Carte "customNote" : border-l accent au lieu de seulement bg
  - Carte "Documents manquants" : border-l warning
  - Client / Fournisseur cliquables dans le panneau "Informations"
- **Fiche client** : Coordonnées en `<dl>` (sémantique), polish général
- **Fiche facture** :
  - Total TTC en évidence (22px font-mono, sur surface-2)
  - Réglé / Reste dû dans bloc séparé
- **Portail** :
  - Layout avec backdrop-blur, logo gradient
  - Pages avec PageHeader + EmptyState

### 🎯 Accessibilité (a11y)

- Contraste : remplacement de 23+ usages de `fg-mute` (oklch 62%) → `fg-3` (oklch 48%) sur les textes body (conformité WCAG AA améliorée)
- Focus-visible avec anneau accent partout
- ESC ferme tous les dialogs et le menu utilisateur
- Aria-labels sur boutons icon-only
- `aria-busy` sur Button loading
- Search avec `aria-label` explicite
- Mobile-nav badge avec aria-label contextuel
- Touch areas Mobile-nav et close-button dialog : 44px minimum

### ✨ Micro-interactions

- Animation `scale-in` (0.16s ease-out) sur les popovers/menus
- Animation `fade-in` (0.22s) sur les pages
- Transitions douces sur hover des boutons (active:scale-0.98)
- Transitions sur les bordures d'input (hover/focus)
- Skeleton shimmer (gradient qui balaie)

### 🐛 Bugs visuels corrigés

- Badge non-lu mobile-nav : ne saute plus selon zoom
- "NOUVEAU CLIENT" : retrait de l'animation `pulse` agressive
- Dashboard "Mouvements récents" : ne casse plus sous 1024px
- Avatar gradient bleu→violet remplacé par Avatar tinted déterministe partout
- Total TTC facture maintenant en évidence (au lieu de noyé dans le récap)
- StatusBadge : refondu pour éviter le `before:` parfois cassé en SSR

---

## Comparaison avant / après

À tester pour validation visuelle :
- `/login` — bienvenue plus premium
- `/dashboard` — StatCards cliquables, mouvements récents plus aérés
- `/dossiers` — empty state filtré, search clearable, ligne accent gauche au focus
- `/dossiers/[id]` — header propre, customNote/missing-docs avec border accent
- `/clients` — avatars teintés, hiérarchie claire
- `/factures/[id]` — Total TTC en évidence
- `/portail` — header polish

---

## Si tu veux annuler

Cette branche n'est PAS déployée sur Vercel. Pour la jeter :

```bash
git checkout main
git branch -D ui-polish-audit  # supprime la branche locale
```

Aucun impact sur la prod.
