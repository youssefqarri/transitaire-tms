# Tests d'isolation multi-tenant (À EXÉCUTER avant tout déploiement SaaS)

> ⚠️ La branche `saas/multi-tenant` est validée **à la compilation uniquement**.
> L'isolation runtime n'a PAS pu être vérifiée automatiquement (pas d'environnement
> d'exécution). **Ces tests sont obligatoires** sur un staging avec la migration appliquée.

## Préparation
1. Appliquer `prisma/migrations/20260609090000_multi_tenant/migration.sql` sur staging.
2. `prisma generate`.
3. Créer **2 organisations** : Org A, Org B.
4. Créer dans chacune : 1 admin, 1 exploitation, 1 client (compte CLIENT) + 2 dossiers, 2 clients, 1 facture.
5. Backfill : s'assurer que chaque entité a le bon `orgId`.

## Scénarios (chacun doit ÉCHOUER à fuiter)

### Back-office (Server Components + routes)
- [ ] Admin Org A : la liste des **dossiers** ne montre QUE ceux d'Org A. (`/dossiers`)
- [ ] Admin Org A : la liste **clients / fournisseurs / factures / notifications / audit** = Org A seulement.
- [ ] Admin Org A : ouvrir l'`id` d'un dossier d'Org B → **404** (pas le détail).
- [ ] Admin Org A : `PATCH /api/dossiers/{idOrgB}` → **404/403** (pas de modif cross-org).
- [ ] Admin Org A : `DELETE`/`status` sur une entité d'Org B → refusé.
- [ ] Dashboard Org A : KPI/compteurs n'agrègent que Org A.

### API publique v1 (token d'un user d'Org A)
- [ ] `GET /api/v1/dossiers` → uniquement Org A.
- [ ] `GET /api/v1/dossiers/{idOrgB}` → 404.
- [ ] `POST /api/v1/dossiers/{idOrgB}/documents|comments` → 404.
- [ ] `POST /api/v1/dossiers/create` → le dossier créé a `orgId = A`.

### Portail client (compte CLIENT d'Org A)
- [ ] Ne voit que SES dossiers (de son client, dans Org A).
- [ ] `GET /api/files/{dossierOrgB}/...` → 403.

### Écritures → bon orgId
- [ ] Tout `create` (dossier, client, supplier, invoice, notification, outgoingMessage) pose `orgId` du créateur.
- [ ] Numérotation : (après durcissement Phase 2) numéros indépendants par org.

## Points à re-vérifier manuellement (non couverts par le sweep additif)
- `getSettings()` → encore global (singleton). Per-org = à implémenter (mail/S3/émetteur facture par org).
- `audit()` → orgId non posé automatiquement (helper sans ctx). À enrichir.
- Numérotation dossier/facture → encore globale. Séquence par org = Phase 2.
- `loadTemplate()` → templates encore globaux.
- Création de compte (`/api/users`) → doit poser l'`orgId` de l'admin créateur.
- RLS Postgres absent (defense-in-depth) → à ajouter pour bloquer au niveau DB.

## Critère de sortie
Aucune fuite cross-org sur AUCUN scénario ci-dessus, ET tout `create` pose le bon `orgId`.
Tant que ce n'est pas vert, NE PAS héberger deux cabinets sur la même instance.
