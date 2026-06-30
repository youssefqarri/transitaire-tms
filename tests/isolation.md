# Tests d'isolation multi-tenant

> **OBLIGATOIRE avant d'onboarder un 2ᵉ cabinet réel.** À exécuter sur **staging** (ou
> une base de test), jamais sur la prod du cabinet existant. Le scoping applicatif
> (`orgScope`/`orgData`) est complet et vérifié par grep, mais cette batterie valide
> l'étanchéité **bout en bout** (routes, API v1, portail, fichiers).

## Préparation (via la console `/admin`)
1. Créer **Org A** (slug `orga`) + son admin `a@orga.test`.
2. Créer **Org B** (slug `orgb`) + son admin `b@orgb.test`.
3. Connecté en A, créer : 1 dossier **D_A**, 1 client **C_A**, 1 fournisseur, 1 DUM, 1 document **Doc_A**, 1 facture **F_A**, 1 doc-attendu.
4. Connecté en B, créer : 1 dossier **D_B**.
5. Créer un token API v1 pour A (`/parametres/tokens`) → **TOK_A**.

## A. Back-office (connecté `a@orga.test`)
- [ ] `/dossiers` n'affiche **que** les dossiers d'Org A (jamais D_B). Idem `/clients`, `/fournisseurs`, `/factures`, `/notifications`, `/audit`, recherche globale.
- [ ] Accès direct `GET /dossiers/{id de D_B}` → **404**.
- [ ] `PATCH /api/dossiers/{D_B}` → **404**.
- [ ] `POST /api/dossiers/{D_B}/dums` / `/comments` / `/documents` / `/notify` → **404/403**.
- [ ] `PATCH /api/dossiers/{D_B}/dums/{dumId de B}` → **404**.
- [ ] `DELETE /api/documents/{document de B}` → **404**.
- [ ] `PATCH`/`DELETE /api/expected-documents/{doc-attendu de B}` → **404**.
- [ ] `GET /api/files/{D_B}/{fichier}` → **403**.
- [ ] `PATCH /api/invoices/{facture de B}` / `POST .../credit-notes` / `POST .../send` → **404**.
- [ ] `PATCH /api/clients/{client de B}` / `/suppliers/{de B}` → **404/403**.

## B. API publique v1 (Bearer **TOK_A**)
- [ ] `GET /api/v1/dossiers` → Org A uniquement.
- [ ] `GET /api/v1/dossiers/{D_B}` → **404**.
- [ ] `POST /api/v1/dossiers/{D_B}/documents` / `/comments` / `/dums` → **404**.
- [ ] `GET /api/v1/clients` / `/suppliers` → Org A uniquement.

## C. Portail client (compte CLIENT d'Org A)
- [ ] Ne voit que les dossiers de **son** client dans **Org A**.
- [ ] `GET /api/files/{D_B}/...` → **403**.

## D. Écritures → bon `orgId`
- [ ] Tout `create` en Org A (dossier, client, fournisseur, facture, DUM, document, notification, message, avoir) → ligne en base avec `orgId = A`.
- [ ] Vérif SQL : `SELECT count(*) FROM "Dossier" WHERE "orgId" IS NULL;` → **0** (aucun orphelin).

## E. Abonnement (Phase E)
- [ ] Console : passer Org B en **Suspendu** → `b@orgb.test` est déconnecté à sa prochaine requête (revalidation JWT).
- [ ] Mettre une **échéance passée** + statut `ACTIVE` sur Org B → accès coupé.
- [ ] Repasser **Actif** + échéance future → accès rétabli.

## F. Console plateforme
- [ ] Un utilisateur **hors** `ESCALE_PLATFORM_ADMINS` qui ouvre `/admin` → redirigé vers `/dashboard`.
- [ ] Le lien nav « Plateforme › Cabinets » n'apparaît que pour un admin plateforme.

## Critère de succès
**Tous** les accès cross-cabinet renvoient 403/404, **aucune** donnée de l'autre cabinet n'est visible, **0** ligne `orgId IS NULL`. Tant que ce n'est pas vert, **ne pas** mettre un 2ᵉ cabinet en production.

---

## RLS Postgres (durcissement — NON activé pour l'instant)
Le RLS est une **défense en profondeur** par-dessus le scoping applicatif (déjà complet).
Il est **différé volontairement** car son activation correcte exige :
1. un **contexte par requête** portant l'`orgId` (AsyncLocalStorage) + une **extension Prisma**
   qui ouvre une transaction et fait `SET LOCAL app.current_org = <orgId>` avant chaque requête ;
2. des **exceptions** maîtrisées : la requête d'**auth** (résoudre l'utilisateur par id **avant**
   d'avoir un org) et les requêtes **plateforme** (console `/admin`, cross-org) doivent contourner
   la policy — sinon login et console cassent ;
3. une **validation complète sur staging** (une requête sans GUC = bloquée → fonctionnalité cassée).
Tant que ces 3 points ne sont pas livrés + testés, activer le RLS = risque de panne prod pour un
gain marginal (le scoping applicatif couvre déjà l'isolation). À planifier comme un chantier dédié.
