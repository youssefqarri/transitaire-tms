# Transitaire TMS

Plateforme de gestion des dossiers de transit douanier (import/export) pour les transitaires marocains.

**Stack** : Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 · PostgreSQL · NextAuth 5 · Tailwind 4.

## Fonctionnalités

### Gestion opérationnelle
- **Dossiers** : numérotation, client, fournisseur, marchandise (valeur/poids/colis), références, mode de paiement.
- **Workflow** : 17 statuts (ouverture → clôture) avec historique horodaté et notes.
- **DUM** : un dossier peut avoir plusieurs DUM, statut indépendant, lien BADR.
- **Documents** : catégories standardisées (facture, colisage, BL, BAD, engagement importation…), versions, détection automatique des documents manquants selon mode de paiement.
- **Clients** & fournisseurs : fiches complètes (ICE, RC, identifiant fiscal).
- **Commentaires** : par dossier, internes ou visibles au client.

### Emails (Gmail / Workspace)
- OAuth Google → connexion d'un compte Gmail.
- Synchronisation des emails entrants (douane, Portnet, MCI, clients, compagnies maritimes).
- **Classification automatique** par règles (regex sur from/subject/body).
- **Rattachement automatique** aux dossiers :
  - Cas DUM validée → match par numéro de DUM.
  - Cas dossier non validé → match par référence ou numéro.
- Filtre par source. Comptabilité ne voit que ses emails (factures/quittances/clients).

### Notifications
- Internes : changement de statut, documents manquants, action urgente, etc.
- Diffusion par rôle ou par utilisateur.
- Marquer tout comme lu.

### Rôles
- `ADMIN` : tout.
- `EXPLOITATION` : ouverture dossiers, suivi.
- `DECLARANT` : DUM, validation, dossiers.
- `COMMIS_DOUANE` : suivi emails douane/MCI, anticipation actions.
- `BUREAU` : engagement, levée sur réserve, comm. clients.
- `COMPTABILITE` : emails comptables (factures/quittances) uniquement.
- `CLIENT` : portail restreint (`/portail`) — voit ses propres dossiers, documents, statuts.

### Audit
- Journal complet des actions (création, modification, statut, upload).

## Démarrage

### Prérequis
- Node.js ≥ 20
- Une base Postgres : **Supabase** (recommandé) ou Docker en local

### Installation avec Supabase
```bash
# 1. cloner .env.example en .env et renseigner DATABASE_URL
cp .env.example .env
# Récupérer la connection string "Session Pooler" sur le dashboard Supabase :
#   bouton "Connect" → onglet "Direct" → section Session pooler
#   Hostname : aws-X-<region>.pooler.supabase.com:5432
#   Ajouter ?uselibpqcompat=true&sslmode=require à l'URL

# 2. installer les dépendances + appliquer migrations + seed
npm install
npx prisma migrate deploy
npx prisma generate
npm run db:seed

# 3. lancer le serveur
npm run dev
```

### Installation locale (Docker)
```bash
npm install
npm run setup    # docker compose up + migrate + generate + seed
npm run dev
```

App : http://localhost:3000

### Notes Supabase
- Utiliser **toujours** le Session Pooler (port 5432) ou le Transaction Pooler (port 6543), pas la connexion directe `db.<project>.supabase.co` qui est en IPv6 uniquement.
- Le paramètre `uselibpqcompat=true&sslmode=require` est requis avec la nouvelle version de `pg` pour accepter le certificat Supabase.
- Pour la production sur Vercel/serverless : utiliser le **Transaction Pooler** (port 6543) avec `?pgbouncer=true&connection_limit=1`.

### Comptes de démo
Mot de passe pour tous : `password123`

| Email | Rôle |
|---|---|
| `admin@transitaire.ma` | Administrateur |
| `exploitation@transitaire.ma` | Exploitation |
| `declarant@transitaire.ma` | Déclarant |
| `commis@transitaire.ma` | Commis en douane |
| `bureau@transitaire.ma` | Bureau administratif |
| `compta@transitaire.ma` | Comptabilité |
| `client@atlasimport.ma` | Client (portail) |

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run db:up` | Démarre Postgres (docker) |
| `npm run db:down` | Arrête Postgres |
| `npm run db:migrate` | Crée/applique une migration |
| `npm run db:reset` | Reset complet de la base |
| `npm run db:seed` | Charge les données de démo |
| `npm run db:studio` | Prisma Studio (UI BDD) |
| `npm run setup` | Bootstrap complet |

## Configuration du stockage de fichiers

Deux drivers de stockage sont disponibles, sélectionnés via `STORAGE_DRIVER` :

### Driver `local` (par défaut, pour le dev)
Fichiers stockés dans `./uploads`. Servis par notre proxy `/api/files/...` avec ACL.

### Driver `s3` (Backblaze B2, AWS S3, Cloudflare R2…)

1. Créer un bucket privé sur Backblaze.
2. Créer une **Application Key** avec accès read+write sur ce bucket.
3. Récupérer l'endpoint S3 (visible sur la page du bucket, format `s3.<region>.backblazeb2.com`).
4. Mettre dans `.env` :
   ```
   STORAGE_DRIVER="s3"
   S3_ENDPOINT="https://s3.eu-central-003.backblazeb2.com"
   S3_REGION="eu-central-003"
   S3_BUCKET="transitaire-tms-prod"
   S3_ACCESS_KEY_ID="<KeyID>"
   S3_SECRET_ACCESS_KEY="<ApplicationKey>"
   ```

L'app continue d'exposer les fichiers via `/api/files/<dossierId>/<filename>` avec contrôle d'accès, **mais redirige le client vers une URL signée S3** (5 min de durée de vie) — la bande passante ne transite pas par Next.js.

## Configuration email sortant (notifications clients)

L'app envoie des emails de notification au client (« documents manquants », « BAE prêt », etc.) via SMTP. Configure dans `.env` :

### Gmail (gratuit, jusqu'à 500 emails/jour)

1. Activer la **vérification en 2 étapes** sur ton compte Google.
2. Aller sur https://myaccount.google.com/apppasswords → générer un mot de passe d'application.
3. Renseigner dans `.env` :
   ```
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="ton-email@gmail.com"
   SMTP_PASS="<mot de passe d'application 16 caractères>"
   SMTP_FROM="Cabinet Transit <ton-email@gmail.com>"
   ```

### Outlook / Microsoft 365
```
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="ton-email@entreprise.ma"
SMTP_PASS="<mot de passe>"
SMTP_FROM="ton-email@entreprise.ma"
```

### Serveur SMTP propre (ex. OVH, IONOS)
Renseigne les valeurs fournies par ton hébergeur.

### Utilisation
Sur la page détail d'un dossier, bouton **« Notifier le client »** → choisir un template (docs manquants, BAE prêt, etc.) → preview + édition libre → envoi. L'historique des envois est conservé dans le dossier.

## Configuration Gmail

1. Créer un projet Google Cloud → activer Gmail API.
2. Créer un OAuth Client ID (type: Web application).
3. Redirect URI : `http://localhost:3000/api/auth/gmail/callback` (et l'équivalent prod).
4. Renseigner dans `.env` :
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
5. Dans l'app : Paramètres → Connecter Gmail.
6. Aller dans Emails → Synchroniser.

> En production, déclencher `POST /api/emails/sync` via un cron (toutes les 5 min) pour synchroniser automatiquement.

## Structure

```
src/
├── app/
│   ├── (internal)/        # back-office équipe (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── dossiers/
│   │   ├── dums/
│   │   ├── documents/
│   │   ├── emails/
│   │   ├── clients/
│   │   ├── fournisseurs/
│   │   ├── utilisateurs/
│   │   ├── notifications/
│   │   ├── audit/
│   │   └── parametres/
│   ├── portail/           # portail client (séparé)
│   ├── login/
│   └── api/
├── components/
│   ├── ui/                # design system (Button, Card, Input, Badge, etc.)
│   ├── layout/            # Sidebar, Topbar
│   └── dossier/           # StatusBadge, etc.
├── lib/
│   ├── auth.ts            # NextAuth (handlers complets)
│   ├── auth.config.ts     # config Edge-safe (middleware)
│   ├── db.ts              # client Prisma + adapter pg
│   ├── statuses.ts        # labels statuts/catégories/documents requis
│   ├── roles.ts           # permissions par rôle
│   ├── audit.ts           # helper audit log
│   ├── email-classifier.ts
│   ├── email-linker.ts    # rattachement auto emails ↔ dossiers
│   └── gmail.ts           # OAuth Google
├── middleware.ts          # ACL routes (CLIENT → /portail, autres → /)
└── generated/prisma/      # client Prisma généré
```

## Modèle de données

Points clés du schéma (`prisma/schema.prisma`) :
- **Dossier** : statut workflow, mode de paiement, client/fournisseur, marchandise, dates clés.
- **DUM** : 1..N par dossier. Une DUM validée verrouille le changement de client.
- **Document** : versions (replaces/replacedBy), catégorie standardisée.
- **EmailMessage / EmailLink** : auto-rattachement aux dossiers.
- **Notification** : par utilisateur ou par rôle.
- **DossierStatusChange** : historique horodaté.
- **AuditLog** : trace complète.

## Production

### À configurer
- `AUTH_SECRET` : générer avec `openssl rand -base64 32`.
- `DATABASE_URL` : Postgres production (Neon, Supabase, RDS…).
- Stockage fichiers : actuellement local (`UPLOAD_DIR`). Pour la prod, migrer vers S3.
- SMTP : configurer pour les notifications sortantes clients.
- Cron Gmail sync (toutes les 5–15 min).

### Idées d'évolutions (post-MVP)
- OCR sur les documents uploadés (Tesseract / Google Vision) → pré-remplissage facture/BL.
- Classification email par LLM (Claude/GPT) en plus des règles regex.
- Intégration WinApp (import/sync n° de dossier + annulations).
- Intégration BADR / Portnet (scraping ou API si dispo).
- Export comptable (factures honoraires + débours) au format Sage/CIEL.
- Signature électronique des bons côté client.
- SLA tracking + alertes pour dossiers stagnants.
- App mobile native (Expo) — actuellement responsive.

## Licence
Privé.
