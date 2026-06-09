# Multi-tenant — conception & plan d'exécution

> Objectif : héberger N cabinets de transit (Organisations) sur une seule instance,
> avec **isolation stricte** des données. Branche `saas/multi-tenant`.

> ⚠️ **Statut** : fondation + sweep agents livrés sur cette branche, **validés à la
> compilation uniquement**. `prisma generate` lit `schema.prisma` (pas la base) → le
> build passe même sans migration appliquée. **L'isolation runtime n'est PAS vérifiée**
> (pas de Node/tests sur la machine). À NE PAS déployer avant : (1) appliquer la
> migration sur un environnement de **staging**, (2) faire passer les **tests
> d'isolation** (`tests/isolation.md`), (3) revue humaine.

## Modèle cible

- **`Organization`** (le tenant = un cabinet de transit) : `name`, `slug` (sous-domaine),
  `ice/rc/taxId/patente/cnss` (mentions légales facture), `logoUrl`, `active`.
- **1 utilisateur = 1 organisation** (`User.orgId`). Les comptes CLIENT appartiennent
  aussi à l'org du transitaire. (Membership N-N reporté ; mono-org suffit en v1.)
- **`orgId` sur les tables racines** : `User, Client, Supplier, Dossier, Invoice,
  MessageTemplate, EmailAccount, Notification, AuditLog, OutgoingMessage, AppSetting`.
  Les tables enfants (DUM, Document, DossierComment, ExpectedDocument, InvoiceItem,
  EmailMessage…) héritent de l'org via leur parent (scopées via le parent).
- **`AppSetting` par org** (fin du singleton `id=1`) : SMTP/S3/émetteur facture par cabinet.

## Unicité re-scopée par tenant

| Avant | Après |
|-------|-------|
| `Dossier.number @unique` | `@@unique([orgId, number])` |
| `Client.code @unique` | `@@unique([orgId, code])` |
| `Invoice.number @unique` + `@@unique([year,sequence])` | `@@unique([orgId, number])` + `@@unique([orgId, year, sequence])` |
| `MessageTemplate @@unique([key,channel,lang])` | `@@unique([orgId, key, channel, lang])` |

(DUM.number, EmailAccount.emailAddress, User.email, ApiToken.tokenHash restent globaux.)

## Convention de scoping (appliquée par le sweep)

- **Auth** : `User.orgId` → JWT (`token.orgId`) → `session.user.orgId` → `AuthContext.orgId`.
- **Lecture** (Server Components + routes) : tout `where` racine reçoit `orgId: <org>`.
- **Écriture** : tout `create` racine reçoit `orgId: <org>`. Les enfants héritent via
  une vérification du parent (déjà scopé).
- **Helper** : `resolveDossierForCtx(ctx, idOrNumber)` filtre désormais aussi par `ctx.orgId`.
- **Tokens API** : héritent de l'org du user porteur.

## Migration (additive puis durcissement)

1. Créer `Organization` + une org par défaut pour les données existantes.
2. Ajouter `orgId` **nullable** partout + relations.
3. **Backfill** : `orgId = <org par défaut>` sur toutes les lignes existantes.
4. Remplacer les index uniques par les versions composites.
5. (Étape ultérieure, après bascule du code) : passer `orgId` en `NOT NULL`.

Voir `prisma/migrations/*_multi_tenant/migration.sql` (à appliquer sur **staging**).

## RLS (defense-in-depth, étape suivante)

App-level scoping d'abord (cette branche). Ensuite : `orgId` sur **toutes** les tables +
politiques RLS Postgres `USING (orgId = current_setting('app.org_id'))` avec
`SET app.org_id` par requête (via l'adapter pg) — pour que même un bug applicatif ne
puisse pas fuiter cross-tenant. Documenté, non implémenté ici.

## Reste à faire (hors fondation)

- Onboarding self-service (création cabinet + sous-domaine + 1er admin).
- Abonnement SaaS (plans, suspension) — encaissement **CMI/virement** (pas Stripe en MAD).
- Résolution du tenant par sous-domaine (middleware) si multi-domaine.
- Numérotation : séquences Postgres **par org** (remplacer `findFirst(max)+1`).
- Console super-admin plateforme + scoping `orgId` des tokens v1.
- RLS complet (ci-dessus).
