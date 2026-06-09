# Audit & feuille de route — Transitaire TMS

> Audit multi-agents (223 agents, 126 problèmes confirmés après vérification adverse,
> 38 écarts métier, 45 propositions) en vue d'un passage en **SaaS national** pour les
> transitaires marocains. Ce document = synthèse + état d'avancement des corrections.

## Verdict

MVP mono-cabinet **solide dans ses fondations** mais **pas prêt pour un SaaS multi-transitaires**.
Trois dettes bloquantes : (1) isolation multi-tenant inexistante, (2) contrôle d'accès troué
côté API/portail, (3) workflow & facturation non conformes au réel douanier/fiscal marocain.

---

## Phase 0 — Sécurité & bugs bornés ✅ (branche `hardening/phase-0`)

Corrigé (déployable sur l'instance mono-cabinet actuelle, **sans migration DB**) :

| Réf | Correctif | Fichiers |
|-----|-----------|----------|
| S1 | RBAC + scoping `clientId` sur l'API v1 (documents, comments) via `resolveDossierForCtx`, catégories dérivées de l'enum complet | `lib/api-auth.ts`, `api/v1/dossiers/[id]/documents`, `.../comments` |
| S2 | GET v1 dossier : commentaires internes + PII fiscales masqués au CLIENT | `api/v1/dossiers/[id]/route.ts` |
| S3 | Liste blanche des catégories visibles client (portail + proxy fichiers) | `lib/statuses.ts` (`INTERNAL_ONLY_CATEGORIES`), `portail/[id]/page.tsx`, `api/files/...` |
| S4 | Token de reset stocké en `sha256` (brut seulement dans l'email) + purge | `api/auth/forgot`, `api/auth/reset` |
| S9 | Écritures registre (clients/fournisseurs/contacts) → `canManageRegistry` (exclut COMMIS_DOUANE) | `roles.ts`, routes clients/suppliers/contacts |
| S10 | Factures POST/PATCH → `canManageInvoices` (ADMIN + COMPTABILITE) | `roles.ts`, `api/invoices/*` |
| S11 | `/api/files` en `PUBLIC_PATHS` (auth gérée dans la route) — débloque le portail | `middleware.ts` |
| S12 | Validation MIME/extension/taille (refus HTML/SVG/exe, 25 Mo) + proxy `attachment` + `nosniff` | `lib/uploads.ts`, routes upload + proxy |
| bug | `closedAt` n'est plus effacé à chaque transition | `api/dossiers/[id]/status`, v1 |
| bug | DELETE contact scopé au `clientId` (IDOR) | `api/clients/[id]/contacts/[contactId]` |
| bug | Catégorie de document portail validée (fin du `as never`) | `api/portail/.../documents` |

## Phase 1 & 2 — FAIT (branches `hardening/phase-1` et `hardening/phase-2`)

`hardening/phase-1` : XSS `mail.ts` (S19), session maxAge 8h, anti-SSRF test-storage (S18),
parité v1 DUM, `{{missingList}}` peuplé, WhatsApp SENT, garde DELETE dossier.

`hardening/phase-2` : **S5** rate-limiting (login/forgot/reset, `lib/ratelimit.ts`) ·
**S7/S8** revalidation JWT (`User.tokenVersion` + bump à reset/change-password, `auth.ts`) ·
**S14/S15** chiffrement AES-GCM des secrets SMTP/S3 (`lib/crypto.ts`, opt-in `ENCRYPTION_KEY`) ·
**S13** `NotificationReceipt` (lu/non-lu par user) · **machine à états** : précondition DUM
(pas de LIQUIDE/BAE/mainlevée sans DUM enregistrée, interne + v1).

## Reste à faire (nécessite migrations / décisions produit / revue)

### Sécurité (suite)
- **S6 Soft-delete Dossier** complet : colonne `deletedAt` prête ; garde anti-suppression active (empêche déjà la perte) ; reste à câbler le filtrage global `deletedAt: null` + purge fichiers.
- **S16 / Gmail** : chiffrer aussi les tokens OAuth Gmail (`EmailAccount`), durcir l'OAuth (gate `isInternal` sur callback, `state` nonce).
- **S17** URL S3 toujours signées (interdire `publicBaseUrl` pour contenu sensible).
- Secrets jamais renvoyés au navigateur (champs write-only sur `/parametres`).
- Rate-limiting aussi sur `/api/v1` (au-delà de login/forgot/reset).

### Logique métier transit Maroc
- **Machine à états** complète : graphe de transitions autorisées (interne + v1, IMPORT/EXPORT séparés) — au-delà de la précondition DUM déjà faite.
- **Liquidation/paiement des droits** (DGI/TGR) : `LIQUIDÉ ≠ PAYÉ`, étape + `paidAt`.
- **DUM** : montants (valeur en douane, DI, TVA import, quittance), articles (code SH), statut transitable, circuit de sélectivité (vert/orange/rouge).
- **Régimes suspensifs** (AT/ATPA/entrepôt/transit) : cautionnement + apurement.
- **Documents requis** : dépendre de `(type, régime, transportMode, paymentMode, origine, services, organisme)` — pas seulement du mode de paiement.
- **Facturation CGI** : émetteur par tenant, ICE client obligatoire, TVA multi-taux (20/14/0), facture d'avoir, n° à l'émission (pas au DRAFT), totaux figés, paiement atomique serveur, débours justifiés/lettrés.

### Architecture SaaS (priorité absolue commercialisation)
- **Multi-tenant** : modèle `Organisation` + `orgId` sur toutes les tables, isolation Prisma forcée + RLS Postgres + tests d'isolation, numérotation/unicité par tenant, membership User↔Org, onboarding self-service, abonnement (CMI/virement), paramètres/SMTP/émetteur facture par tenant.
- **Intégrations** : BADR (douane), PortNet (guichet unique), e-facturation DGI, WhatsApp Cloud API (quick win), socle `Integration`/`SyncLog`/retry.
- **Modules manquants** : magasinage/surestaries, caisse/provisions, marge par dossier, conteneurs+tracking, GED+OCR, exports comptables (FEC/CGNC), relances/SLA (cron), KPI/BI.
- **Ops** : observabilité (Sentry), sauvegardes testées (PITR), durcissement perf (N+1, index), conformité loi 09-08/CNDP.

### Dette technique notée
- `_prisma_migrations` ne contient pas les 2 migrations de juin (appliquées hors tracking) → `prisma migrate resolve --applied` avant tout futur `migrate deploy`.
- Helpers RBAC déclarés mais non branchés (`isReadOnly`, `canCloseDossier`, `canView*`) → brancher ou supprimer.
- Numérotation dossier/facture sur `findFirst(max)+1` → migrer vers SEQUENCE Postgres.

---

## Séquencement conseillé
1. **Phase 0** (cette branche) — mergeable immédiatement après revue.
2. **Sécurité Phase 1** (S5–S19) + **machine à états** — sur l'instance actuelle.
3. **Multi-tenant** — chantier XL, prérequis de toute commercialisation.
4. **Intégrations** (BADR/PortNet/DGI/WhatsApp) + modules + ops.
