# Auto-hébergement (production hors Vercel)

L'application est un **Next.js 16 standard** (sortie `standalone`) avec **PostgreSQL** (Prisma 7, adapter `pg`). Elle ne dépend d'aucun service propriétaire Vercel : elle tourne sur n'importe quel serveur Linux, en Docker ou en Node nu.

> ✅ **Validé** : ce setup a été déployé et testé de bout en bout sur **Ubuntu 22.04** (Docker 29 + compose v2) — build de l'image, migrations sur base neuve, app en ligne, `/api/health` `{"status":"ok","db":"up"}`, accès externe OK. Procédure de démarrage rapide en bas (§8).

---

## 1. Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/transitaire_tms` |
| `AUTH_SECRET` | ✅ | Secret NextAuth. Générer : `openssl rand -base64 32` |
| `AUTH_URL` | ✅ (prod) | URL publique, ex. `https://tms.votre-domaine.ma` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Même URL publique (utilisée côté client) |
| `ENCRYPTION_KEY` | recommandé | Chiffre les secrets en base (SMTP/S3). `openssl rand -base64 32`. Si absent, secrets stockés en clair. |
| `STORAGE_DRIVER` | — | `local` (défaut) ou `s3` |
| `UPLOAD_DIR` | si `local` | Dossier des pièces jointes, ex. `/app/uploads` (à monter sur un volume) |
| `SMTP_*`, `S3_*`, `GOOGLE_*` | — | Email, stockage S3, OAuth Gmail. **Configurables aussi via l'écran `/parametres`** (stockés en base). |

> 💡 Le plus simple : **reprenez les variables déjà présentes dans votre projet Vercel** (Settings → Environment Variables) et adaptez `DATABASE_URL` / `AUTH_URL`.

Copiez `.env.example` → `.env` et renseignez-les.

---

## 2. Base de données & migrations

Le schéma se déploie avec **toutes les migrations versionnées** dans `prisma/migrations/` :

```bash
pnpm prisma migrate deploy
```

À lancer **une fois** sur une base neuve, puis **à chaque mise à jour** apportant de nouvelles migrations. (En Docker, le service `migrate` du compose le fait automatiquement — voir §3.)

> La base actuelle (Supabase) est déjà à jour ; pour une **nouvelle** base auto-hébergée, `migrate deploy` recrée tout le schéma.

**Données de démarrage (optionnel)** — crée des comptes de démo (`admin@transitaire.ma` / `password123`) + quelques clients/dossiers :

```bash
# en Docker
docker compose -f docker-compose.prod.yml run --rm --no-deps migrate pnpm db:seed
# ou en Node nu
pnpm db:seed
```

⚠️ En production réelle, **ne pas** seeder de comptes de démo (ou changer immédiatement leurs mots de passe).

---

## 3. Déploiement — Option A : Docker (recommandé)

```bash
cp .env.example .env          # puis renseigner DATABASE_URL, AUTH_SECRET, AUTH_URL…
docker compose -f docker-compose.prod.yml up -d --build
```

Le compose lance dans l'ordre : **Postgres** → **migrations** (`migrate`, se termine seul) → **app** (port 3000). Volumes persistants : `pgdata` (base) et `uploads` (pièces jointes).

Mise à jour ensuite :

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 3 bis. Déploiement — Option B : Node nu (sans Docker)

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build                       # prisma generate && next build
pnpm prisma migrate deploy       # applique le schéma
node .next/standalone/server.js  # démarre (PORT=3000 HOSTNAME=0.0.0.0)
```

À superviser avec **systemd** ou **pm2** pour le redémarrage automatique. Pensez à copier `.next/static` et `public` à côté de `server.js` si vous déplacez le dossier `standalone`.

---

## 4. Reverse proxy + HTTPS

Mettez un **Nginx** ou **Caddy** devant le port 3000 pour le TLS. Exemple Caddy (HTTPS auto) :

```
tms.votre-domaine.ma {
    reverse_proxy localhost:3000
}
```

`AUTH_URL` et `NEXT_PUBLIC_APP_URL` doivent pointer vers cette URL HTTPS publique.

---

## 5. Pièces jointes (uploads)

- `STORAGE_DRIVER=local` : fichiers dans `UPLOAD_DIR` → **monter un volume** (déjà fait dans le compose) et **inclure ce dossier dans les sauvegardes**.
- `STORAGE_DRIVER=s3` : stockage objet (S3/Backblaze/MinIO), configurable via `/parametres` → plus simple à sauvegarder/scaler.

## 6. Sauvegardes

```bash
# Base
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U tms transitaire_tms > backup_$(date +%F).sql
# + le volume uploads si stockage local
```

---

## 7. (Optionnel) PDF serveur — à activer à la bascule

Aujourd'hui l'impression de facture se fait **côté navigateur** (page `/factures/[id]/imprimer` → Imprimer → PDF), ce qui marche partout sans dépendance. Une fois auto-hébergés, vous pouvez activer un **vrai PDF serveur** (archivage, pièce jointe email) via Chrome headless :

```bash
pnpm add puppeteer            # télécharge un Chromium ; base Debian (Dockerfile) compatible
```

Puis une route qui rend la page d'impression en PDF — squelette de départ (`src/app/api/invoices/[id]/pdf/route.ts`) :

```ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    // Authentifier le rendu : injecter le cookie de session NextAuth de l'appelant.
    const cookie = req.headers.get("cookie");
    if (cookie) {
      await page.setExtraHTTPHeaders({ cookie });
    }
    await page.goto(`${base}/factures/${id}/imprimer`, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${id}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
```

> Le point à finaliser ensemble : **l'authentification du rendu** (transmettre proprement la session à Chromium) et, si besoin, l'archivage du PDF + l'envoi en pièce jointe. À faire au moment de la bascule, sur votre serveur (où `pnpm add puppeteer` met à jour le lockfile). On ne peut pas l'intégrer tant qu'on déploie sur Vercel (lockfile gelé + Chromium incompatible serverless).

---

## 8. Démarrage rapide (procédure validée)

Sur un serveur Ubuntu 22.04 avec Docker installé :

```bash
# 1. Plugin compose v2 (si absent)
apt-get update && apt-get install -y docker-compose-v2

# 2. Récupérer le code
git clone https://github.com/youssefqarri/transitaire-tms.git /opt/transitaire-tms
cd /opt/transitaire-tms

# 3. Configurer
cp .env.example .env
#   puis renseigner POSTGRES_PASSWORD, DATABASE_URL (host = "postgres"),
#   AUTH_SECRET (openssl rand -base64 32), AUTH_URL, NEXT_PUBLIC_APP_URL

# 4. Build + démarrage (postgres → migrations → app)
docker compose -f docker-compose.prod.yml up -d --build

# 5. (optionnel) données de démo
docker compose -f docker-compose.prod.yml run --rm --no-deps migrate pnpm db:seed

# 6. Vérifier
curl http://localhost:3000/api/health     # → {"status":"ok","db":"up"}
```

Mise à jour ultérieure : `git pull && docker compose -f docker-compose.prod.yml up -d --build`.
