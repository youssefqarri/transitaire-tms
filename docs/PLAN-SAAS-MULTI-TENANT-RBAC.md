# Plan — Escale en SaaS multi-cabinets + permissions granulaires

> Rédigé le 2026-06-27. **Implémentation prévue : mercredi 1ᵉʳ juillet 2026.**
> Source unique de vérité pour le chantier. Ne rien implémenter avant la confirmation des décisions §0.

## Objectif

Transformer Escale (aujourd'hui **mono-cabinet, en prod** pour Transit Multiservices) en **SaaS multi-cabinets commercialisable** :
1. **Permissions granulaires par utilisateur** (fin du rigide « 1 rôle = 1 jeu de droits »). Un user peut cumuler compta + déclaration ; chaque module a ses actions activables individuellement.
2. **Multi-tenant** : héberger N cabinets de transit isolés sur une seule instance, gérés depuis une **console plateforme** (super-admin Escale/Evead).
3. **Abonnement & facturation** des cabinets (plans, quotas, suspension, encaissement).

**Contrainte absolue** : la prod est live → **zéro régression** pour le cabinet existant. Tout est **additif**, validé sur **staging** avant la prod.

---

## 0. Décisions — ✅ CONFIRMÉES le 2026-06-27

| # | Décision | Choix verrouillé |
|---|----------|------------------|
| **D1** | Modèle de permissions | **Profils cumulables + ajustements par user** : profils nommés éditables (Déclarant, Comptable…), un user en cumule plusieurs, + cases pour activer/retirer une action précise. |
| **D2** | Abonnement / paiement | **AUCUN paiement ou encaissement en ligne.** Abonnement géré in-app (plans, quotas, statut, suspension) ; encaissement **100 % hors-ligne** (virement / chèque / espèces) suivi manuellement dans la console. **Aucune passerelle** (ni CMI ni Stripe), ni maintenant ni en phase ultérieure. |
| **D3** | Accès des cabinets | **Domaine unique** (`app.escale.ma`), org déterminée par le login → 0 infra DNS. (Sous-domaine = option lointaine, non prioritaire.) |
| **D4** | Isolation des données | **Isolation parfaite dans une base UNIQUE.** Shared DB + colonne `orgId` partout + **RLS Postgres OBLIGATOIRE** (policies sur toutes les tables scopées) — l'isolation ne repose **pas** que sur le code applicatif. |

---

## 1. Architecture multi-tenant

**Modèle retenu** : base PostgreSQL unique partagée + colonne `orgId` sur toutes les tables racines + **Row-Level Security Postgres** en défense en profondeur. (Confirme le choix de la branche `saas/multi-tenant`, qu'on réutilise comme **design** — le code est 175 commits en retard, inexploitable tel quel.)

### Modèle `Organization`
Porte l'identité du cabinet + ses mentions légales (émetteur de facture) — **remplace le singleton `AppSetting.issuer*`** :
`id, name, slug (sous-domaine futur), ice, rc, taxId, patente, cnss, agrement, address, city, phone, email, logoUrl, active, createdAt`.

### Tables à scoper par `orgId`
Racines : `User, Client, Supplier, Dossier, Invoice, CreditNote, ClientTariff, MessageTemplate, EmailAccount, Notification, AuditLog, OutgoingMessage, ApiToken, AppSetting`.
Enfants (DUM, Document, ExpectedDocument, DossierComment, DossierStatusChange, InvoiceItem, EmailMessage, EmailLink, ClientContact, NotificationReceipt…) : **héritent** via le parent déjà scopé (pas de colonne, mais contrôle d'accès via le parent).

### `AppSetting` → **per-org**
Fin du singleton `id=1`. Chaque cabinet a ses SMTP / S3 / WhatsApp / mentions légales / **numérotation**. Secrets **chiffrés** (déjà `lib/crypto.ts`).

### Scoping applicatif
- `AuthContext.orgId` (déjà prévu dans le design : `User.orgId` → JWT → session → contexte).
- Helpers `orgScope(orgId)` / `orgData(orgId)` (no-op si null → migration progressive sans rupture).
- **Sweep** : toute lecture (Server Components + routes) reçoit `where: { orgId }` ; toute écriture reçoit `data: { orgId }`. Couvre back-office, `/api/*`, **`/api/v1/*`**, **portail**, `/api/files`.
- `audit()` injecte `orgId`.

### Unicité par tenant
Composites : `@@unique([orgId, number])` (Dossier), `@@unique([orgId, code])` (Client), `@@unique([orgId, number])` + `@@unique([orgId, year, sequence])` (Invoice, CreditNote), `@@unique([orgId, key, channel, lang])` (MessageTemplate).
Restent **globaux** : `User.email` (identité), `Organization.slug`.

### Numérotation par org
Remplacer `findFirst(max)+1` (collisions multi-instances) par des **séquences Postgres par org** : dossiers `PROV-AAAA-NNNN`, factures `F-AAAA-NNNN`, avoirs `AV-AANNNN` — séquences indépendantes par cabinet.

### Résolution du tenant
- **v1** : org = celle du compte connecté (login). API v1 : **token scopé à l'org** de son user.
- **v2 (option D3-B)** : résolution par sous-domaine `slug` dans le middleware (« Proxy »).

---

## 2. Permissions granulaires (remplace les 7 rôles rigides)

### Problème actuel
7 rôles rigides, **enforcement fragmenté en 4 couches** non synchronisées : `middleware.ts` (`BLOCKED_PREFIXES`), `nav-items.ts` (`visibleSections`), guards de page, ~80 guards d'API, via ~17 helpers `can*()`. Un changement de droits incomplet laisse des routes accessibles.

### Catalogue de permissions (clé `module:action`)
Statique, défini en code (source unique). Dérivé de la matrice module × action existante :

- **dossier** : `view, create, edit, delete, status, close, comment_internal, notify_client`
- **dum** : `view, create, edit, delete, status, renumber`
- **document** : `view, upload, delete, request`
- **invoice** : `view, create, edit, send, publish, delete, credit_note`
- **tariff** : `view, manage`
- **client** : `view, create, edit, delete, contacts`
- **supplier** : `view, manage`
- **email** : `view_customs, view_accounting, manage`
- **notification** : `view`
- **template** : `manage`
- **user** : `manage`
- **audit** : `view`
- **settings** : `manage`
- **token** : `manage`
- **trash** : `restore`
- **(plateforme)** : `org:manage, plan:manage, billing:manage` (console super-admin)

### Modèle de données (recommandation D1-A)
- `Permission` : catalogue **en code** (pas en base) — évite les enums hardcodés (cf. règle « dériver de la source »).
- `Profile` (preset éditable, **par org**) : `id, orgId, name, permissions String[]`.
- `User` ↔ `Profile` : **many-to-many** (cumul de profils) + `User.permGrants String[]` / `User.permRevokes String[]` (overrides individuels).
- **Resolver unique** `can(user, "module:action"): boolean` = (∪ permissions des profils) ∪ grants − revokes. **Remplace tous les `can*()`**.

### Refactor de l'enforcement (centralisation)
Tout passe par `can()` :
- Middleware : table route→permission requise (au lieu de `BLOCKED_PREFIXES` hardcodés).
- Nav : `visibleSections` calculé depuis `can()`.
- Pages + API : `requirePermission("invoice:send")` au lieu de `canManageInvoices(role)`.
- **Doublon interne↔v1** : appliquer aux deux (idéal : extraire la logique métier en `lib/` d'abord).

### Migration sans régression
Seed de **profils par défaut par org** mappant les 7 rôles actuels (Administrateur, Exploitation, Déclarant, Commis en douane, Bureau, Comptabilité). Chaque user existant reçoit le profil = son rôle actuel → **comportement identique**, puis personnalisation possible.
`CLIENT` reste un **type d'accès distinct** (portail, isolé par `clientId`), pas un profil interne.

### UI admin
- Page **« Rôles & permissions »** : créer/éditer les profils (grille module × action).
- Fiche user : **profils cumulables** (multi-select) + section « ajustements » (cocher/décocher une action précise pour ce user).

---

## 3. Abonnement & facturation des cabinets (SaaS billing)

### Modèles
- `Plan` : `name, price, period (mensuel/annuel), quotas { seats, dossiersParMois, modules活 }, active`.
- `Subscription` : `orgId, planId, status (trial/active/past_due/suspended/cancelled), currentPeriodStart/End, trialEndsAt, cancelAt`.
- `SubscriptionInvoice` (facture d'abonnement Escale→cabinet) : `orgId, amount, dueAt, status, method, paidAt, ref`.

### Encaissement (D2 — aucun paiement en ligne)
Suivi **100 % manuel** des paiements (virement / chèque / espèces) dans la console + génération des factures d'abonnement Escale→cabinet. **Suspension auto** si impayé après X jours (l'org passe `suspended` → accès bloqué sauf admin/billing). **Aucune passerelle de paiement** (ni CMI ni Stripe) — choix verrouillé D2.

### Quotas
Avertissement / blocage doux au dépassement (sièges, dossiers/mois). Période d'**essai** à l'onboarding.

---

## 4. Console plateforme (super-admin Escale/Evead)

Nouveau niveau **au-dessus** des orgs : `PLATFORM_ADMIN` (toi). Espace séparé `/admin` :
- Liste des cabinets, **création / suspension / réactivation**.
- Plans & abonnements, factures SaaS, paiements, métriques d'usage.
- **Impersonation** (support) tracée à l'audit.
- **Onboarding** (assisté puis self-service) : créer cabinet + 1ᵉʳ admin + mentions légales + plan/essai.

---

## 5. Sécurité & isolation

- **RLS Postgres** par org (policies sur toutes les tables scopées) = filet dur même en cas de bug applicatif.
- **Tests d'isolation OBLIGATOIRES** avant tout usage multi-cabinet (reprendre `tests/isolation.md`, étendre aux modules postérieurs : factures, avoirs, tarifs, templates, WhatsApp, emails, fichiers). Critère : tout accès à un `id` d'une autre org → **404/403** (back-office, API v1, portail, `/api/files`). Toute écriture pose le **bon `orgId`**.
- Secrets per-org chiffrés. Tokens v1 scopés org. Cascade `Client→Dossiers/Invoices` revérifiée en multi-tenant.

---

## 6. Roadmap par phases (ordre + risque)

| Phase | Contenu | Risque prod | Livrable indépendant ? |
|-------|---------|-------------|------------------------|
| **A — Permissions granulaires** | Catalogue, modèle (Profile + overrides), resolver `can()`, mapping rôles→profils, refactor des 4 couches, UI admin | Faible (additif + mapping iso-comportement) | ✅ Oui — valeur immédiate même mono-cabinet |
| **B — Fondation multi-tenant** | `Organization` + `orgId` **nullable** + backfill `org_default` + helpers + auth `orgId` | Très faible (1 seule org, comportement inchangé) | ✅ Oui |
| **C — Sweep scoping** | Toutes requêtes scopées (lecture/écriture/v1/portail), `audit()` orgId, settings per-org, numérotation per-org, composites uniques, tokens v1 scopés | Moyen → **staging + tests d'isolation obligatoires** | Non (dépend de B) |
| **D — Durcissement isolation** | RLS Postgres + batterie de tests d'isolation | Moyen (staging) | Non (dépend de C) |
| **E — Billing & abonnement** | Plans, subscriptions, factures SaaS, quotas, suspension | Faible (nouveau module) | Non (dépend de B) |
| **F — Console plateforme + onboarding** | `/admin`, gestion cabinets, impersonation, onboarding | Faible | Non (dépend de B+E) |
| **G — Option / scale** | Sous-domaine par cabinet (option lointaine, non prioritaire) | Variable | Non |
| **H — PWA & expérience mobile** | Manifest + service worker (app **installable**, **notifications push** web, offline léger) ; polish des vues mobiles en cartes (priorité **portail client**) ; actions rapides au pouce | Faible (additif, web) | ✅ Oui — indépendant du multi-tenant |

**Ordre conseillé** : A → B → C → D → E → F → (G).
A et B sont parallélisables et **sûrs** ; C/D exigent staging + tests d'isolation ; E/F = couche commercialisation.
**H (PWA + mobile)** est **indépendant** : à mener en parallèle ou juste après la fondation (B), sans attendre le reste.

### Phase H — détail (PWA, pas d'app native)
Décision : **pas d'application native** (React Native/Flutter) pour l'instant — coût élevé, audience limitée (la saisie lourde reste du desktop). On vise une **PWA** qui réutilise 100 % de l'app Next.
- **Déjà en place** : l'app est responsive ; les grandes listes (dossiers, DUM, factures, clients, audit, utilisateurs) basculent déjà en **cartes** sur mobile (`md:hidden`) + nav mobile + filtres en volet (`TableMobileFilter`).
- **À ajouter** : `manifest.webmanifest` + icônes + `theme-color`/viewport ; service worker (installable « ajouter à l'écran d'accueil », offline léger, **Web Push** pour les alertes : visite douane, BAE prêt, doc client déposé) ; polish des cartes mobiles (hiérarchie n° + badge statut, actions au pouce).
- **Cible prioritaire** : le **portail client** (clients réellement sur téléphone).
- **Native plus tard** : seulement si besoin concret (scan de documents natif, offline sérieux, présence App Store comme argument commercial, biométrie) → via **Capacitor** enveloppant l'app existante avant tout React Native from scratch.

---

## 7. Stratégie de déploiement (prod live)

1. **Tout additif d'abord** : `orgId` nullable + backfill → aucune rupture ; le cabinet actuel devient `org_default`, **invisible** pour lui.
2. **Staging obligatoire** avant le sweep (C) et le RLS (D).
3. Migrations **jamais destructives** ; séquences créées sans casser la numérotation existante (reprise au floor actuel).
4. Chaque phase : typecheck-gated + déploiement Docker habituel (cf. [[deploy-topology]]).

---

## 8. Pièges connus à intégrer (cf. [[tms-architecture]])

- **RBAC fragmenté en 4 endroits** → tout centraliser sur `can()`, sinon failles résiduelles.
- **Doublon interne↔v1** (status, create dossier/comments/documents/dums) → règles appliquées **aux deux** (extraire en `lib/`).
- **Pas de machine à états** → indépendant, mais à garder en tête si on touche les transitions.
- **Numérotation** : passer aux séquences Postgres par org (fin des collisions).
- **Cascade** `Client → Dossiers/Invoices` (onDelete Cascade) → vérifier l'impact cross-org.

---

## 9. Références

- Design antérieur (réutilisé) : branche `saas/multi-tenant` → `docs/MULTI-TENANT.md`, `tests/isolation.md`, `src/lib/tenant.ts` (récupérables via `git show saas/multi-tenant:<path>`).
- État des branches : [[hardening-saas-state]]. Architecture & pièges : [[tms-architecture]]. Déploiement : [[deploy-topology]].
