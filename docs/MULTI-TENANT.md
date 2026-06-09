# Multi-tenant SaaS — état, analyse et plan de reprise

> **But de ce document** : tout ce qui a été découvert/décidé sur le multi-tenant,
> pour pouvoir **reprendre plus tard** sans le contexte de la conversation d'origine.
> Multi-tenant **reporté** (décision du 2026-06-09). Voir aussi `docs/AUDIT.md`.

## 0. TL;DR
- Une **fondation** multi-tenant existe sur la branche **`saas/multi-tenant`** (poussée sur GitHub), **build vert** mais **jamais déployée ni testée au runtime**.
- Ce n'est **pas un bug** : c'est un **chantier stratégique** qui n'a de sens que si on héberge **plusieurs cabinets** de transit. Pour un seul cabinet (usage actuel) : aucun bénéfice, que du risque.
- **Ne pas déployer sur la prod** en l'état (ça planterait — voir §3).

## 1. Modèle cible (décidé)
- **`Organization`** = le tenant (un cabinet de transit). Porte les mentions légales : `ice, rc, taxId, patente, cnss, slug` (sous-domaine), etc.
- **1 utilisateur = 1 organisation** (`User.orgId`). Les comptes CLIENT appartiennent aussi à l'org du transitaire. (Pas de membership N-N en v1.)
- **`orgId` (nullable)** sur les tables racines : `User, Client, Supplier, Dossier, Invoice, MessageTemplate, EmailAccount, Notification, AuditLog, OutgoingMessage, AppSetting`. Les enfants (DUM, Document, DossierComment, etc.) héritent via leur parent.
- Convention de scoping : helper **`src/lib/tenant.ts`** (`orgScope(orgId)` / `orgData(orgId)`), **no-op tant que `orgId` est null** → bascule progressive sans régression.
- Auth : `orgId` propagé `User → JWT → session → AuthContext` (déjà fait sur la branche).

## 2. Ce qui est FAIT sur la branche `saas/multi-tenant`
- Schéma : modèle `Organization` + `orgId` nullable partout + relations.
- Migration `prisma/migrations/20260609090000_multi_tenant/migration.sql` (crée Organization, ajoute orgId, backfill vers une org `org_default`). **NON appliquée à la prod.**
- Auth : `auth.config.ts` / `auth.ts` / `api-auth.ts` portent `orgId` ; `resolveDossierForCtx` scopé orgId.
- **Sweep de 53 requêtes** : `orgScope`/`orgData` ajoutés aux requêtes des tables racines (réalisé par agents).
- Docs : `docs/MULTI-TENANT.md` (ancienne version) + `tests/isolation.md` (plan de tests d'isolation OBLIGATOIRE).

## 3. Les PROBLÈMES (pourquoi ce n'est pas déployable tel quel)
1. **Compile mais ne tourne pas sur la prod** : `prisma generate` lit le schéma (avec `orgId`), donc le client `SELECT`e `orgId` à chaque requête. La migration `orgId` **n'est pas appliquée à la base prod** → ça **planterait**. Il faut une base dédiée (staging) + migration + backfill.
2. **Isolation non vérifiée au runtime** : pas d'environnement d'exécution ici (pas de Node/tests). Une isolation incomplète = **fuite cross-cabinet** (le pire). Les tests `tests/isolation.md` doivent passer sur une vraie base.
3. **Incomplet** — manquent encore :
   - 2 pages non scopées (listes `clients/page.tsx`, `fournisseurs/page.tsx` — pas de `auth()` dans la portée).
   - **Paramètres / numérotation / templates PAR ORG** (aujourd'hui globaux : `AppSetting` singleton id=1, `dossier-numbering.ts`, `invoicing-server.ts`, `loadTemplate`).
   - **Unicité par tenant** : laissée GLOBALE exprès (sinon `findUnique` composites cassent). À durcir : `@@unique([orgId, number])` (Dossier), `([orgId, code])` (Client), `([orgId, year, sequence])` + `([orgId, number])` (Invoice), `([orgId, key, channel, lang])` (MessageTemplate).
   - **RLS Postgres** (étanchéité niveau base, defense-in-depth) : absent.
   - `audit()` ne pose pas `orgId`.
4. **Branche périmée** : créée depuis `phase-1`. Depuis, `main` a reçu phases 2/3 + soft-delete + corbeille + audit IP. La branche **doit être rebasée** sur `main` (conflits probables : `schema.prisma`, `auth.config.ts`, fichiers swept). Note : `main` a maintenant `deletedAt` sur plusieurs modèles → le rebase doit combiner `orgScope` ET `deletedAt: null` dans les mêmes `where`.
5. **Décision stratégique** : multi-tenant utile seulement si plusieurs cabinets. Sinon complexité + risque pour rien.

## 4. Plan de reprise (chemin SÛR)
1. **Décision** : on passe en SaaS multi-cabinets ? (Youssef)
2. **Staging** : créer une branche Supabase isolée (MCP `create_branch`), y appliquer la migration multi_tenant + backfill `org_default`. **Jamais la prod.**
3. **Rebaser** `saas/multi-tenant` sur `main` (résoudre conflits ; fusionner `orgScope` + `deletedAt: null`).
4. **Compléter les manques** (§3.3) : per-org settings/numérotation/templates, scoper les 2 pages, unicité par tenant (après backfill + `orgId NOT NULL`), RLS.
5. **Tests d'isolation** (`tests/isolation.md`) sur staging → tant que ce n'est pas 100 % vert, **stop**.
6. **Onboarding** (créer cabinet + 1er admin + sous-domaine) + **abonnement** (encaissement **CMI/virement** — Stripe n'opère pas en MAD).
7. Bascule prod (avec la migration appliquée AVANT le code).

## 5. Estimation
Plusieurs jours de dev **+ tests d'isolation** (le plus important). Ce n'est pas une tâche d'une nuit.

## 6. Fichiers clés à regarder en reprenant
- `src/lib/tenant.ts` (helpers), `src/lib/api-auth.ts` (AuthContext.orgId, resolveDossierForCtx)
- `src/lib/auth.config.ts` + `src/lib/auth.ts` (orgId dans JWT/session)
- `prisma/schema.prisma` (modèle Organization + orgId) sur la branche
- `prisma/migrations/20260609090000_multi_tenant/migration.sql`
- `tests/isolation.md` (tests obligatoires)
- Le sweep : tous les fichiers avec `orgScope(` / `orgData(` sur la branche.
