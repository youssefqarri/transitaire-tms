# Guide d'utilisation de l'API Transitaire avec Claude

Ce document explique comment utiliser **Claude** (Claude Code, Claude.ai avec outils web, ou tout assistant Claude doté de l'accès réseau) pour gérer les dossiers de transit douanier via l'API.

> **À placer** : ce fichier (ou son contenu) doit être donné à Claude comme contexte initial — soit dans un `CLAUDE.md` à la racine du dossier de travail, soit collé en début de conversation.

---

## 1. Authentification

L'API utilise des **tokens Bearer**. Pour obtenir un token :

1. L'administrateur se connecte sur la plateforme.
2. Va dans **Paramètres → Tokens API → Nouveau token**.
3. Choisit l'utilisateur dont le token héritera des permissions (ex. un compte « Exploitation »).
4. Copie le token affiché **une seule fois** (format `ttms_xxxxxxxx…`).

Le token doit ensuite être passé dans l'en-tête `Authorization` de chaque requête :

```
Authorization: Bearer ttms_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Le token confère les mêmes droits que l'utilisateur associé**. Ne pas partager. À révoquer immédiatement en cas de fuite (depuis Paramètres → Tokens API).

---

## 2. Configuration de l'URL de base

L'API est servie sur la même origine que la plateforme. Exemples :

- Développement local : `http://localhost:3000`
- Production : `https://transit.exemple.ma` (à adapter)

Tu peux exporter ces variables :

```bash
export TTMS_BASE_URL="http://localhost:3000"
export TTMS_TOKEN="ttms_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Et dans `curl` : `-H "Authorization: Bearer $TTMS_TOKEN"`.

---

## 3. Référence rapide

Toutes les routes ci-dessous sont versionnées sous `/api/v1/` et acceptent du **JSON**.

### Vérifier l'identité du token
```http
GET /api/v1/me
```
Réponse :
```json
{ "userId": "…", "email": "…", "name": "…", "role": "EXPLOITATION", "clientId": null, "via": "token" }
```

### Récupérer le schéma (énumérations)
```http
GET /api/v1/schema
```
→ renvoie la liste des statuts dossiers/DUMs, catégories de documents, rôles, etc.
**À appeler une fois pour comprendre les valeurs autorisées**.

---

## 4. Dossiers

### Lister / rechercher
```http
GET /api/v1/dossiers?q=&status=&type=&clientId=&take=50&skip=0
```
Paramètres :
- `q` : recherche libre (numéro dossier, référence, nom client, numéro DUM)
- `status` : un statut parmi `OUVERTURE`, `RECEPTIONNE`, `DOCUMENTS_MANQUANTS`, `DOCUMENTS_RECUS`, `BON_A_DELIVRER_RECU`, `DECLARATION_EN_COURS`, `VALIDATION_DOUANE`, `VISITE`, `CONFORME`, `BUREAU_VALEUR`, `DEMANDE_DOCUMENTS`, `LIQUIDE`, `BON_A_ENLEVER_RESERVE`, `VALIDATION_MCA`, `BON_A_ENLEVER_DEFINITIF`, `CLOTURE`, `ANNULE`
- `type` : `IMPORT` ou `EXPORT`
- `clientId` : id du client
- `take` / `skip` : pagination (`take` max 200)

### Récupérer un dossier détaillé
```http
GET /api/v1/dossiers/:id
```
`:id` peut être l'id Prisma (`cm…`) **ou** le numéro de dossier (ex. `D-2026-00001`).

### Créer un dossier
```http
POST /api/v1/dossiers/create
Content-Type: application/json

{
  "number": "D-2026-00042",
  "reference": "PO-XYZ-12",
  "type": "IMPORT",
  "paymentMode": "WITH_PAYMENT",
  "clientId": "<id du client>",
  "supplierId": "<id fournisseur>",         // optionnel
  "goodsValue": 42500.50,
  "goodsCurrency": "EUR",
  "goodsWeight": 1250.5,
  "goodsPackages": 18,
  "goodsDescription": "Composants électroniques"
}
```
Le statut initial est automatiquement `RECEPTIONNE` et un changement de statut est enregistré dans l'historique.

### Changer le statut
```http
POST /api/v1/dossiers/:id/status
Content-Type: application/json

{ "status": "DECLARATION_EN_COURS", "note": "DUM en préparation" }
```
L'historique des statuts et une notification interne sont créés automatiquement.

### Ajouter une DUM
```http
POST /api/v1/dossiers/:id/dums
Content-Type: application/json

{ "number": "M-7891234", "bureau": "Casablanca-Port" }
```
Le numéro de DUM doit être **globalement unique**.

### Ajouter une référence de document (métadonnée)
```http
POST /api/v1/dossiers/:id/documents
Content-Type: application/json

{
  "name": "Facture commerciale #INV-883",
  "category": "FACTURE_COMMERCIALE",
  "notes": "Reçue par mail le 10/03"
}
```
Catégories valides : `FACTURE_COMMERCIALE`, `COLISAGE`, `FACTURE_FRET`, `CONNAISSEMENT`, `ENGAGEMENT_IMPORTATION`, `BON_A_DELIVRER`, `CERTIFICAT_ORIGINE`, `ASSURANCE`, `LICENCE`, `CERTIFICAT_SANITAIRE`, `CERTIFICAT_CONFORMITE`, `FICHE_LIQUIDATION`, `TICKET_PAIEMENT`, `BON_A_ENLEVER`, `AUTRE`.

Si un document avec le même `name` + `category` existe déjà, la version est automatiquement incrémentée (v2, v3…) — utile pour les corrections.

> Pour **uploader un fichier réel** (PDF, image), utiliser plutôt l'endpoint multipart `POST /api/dossiers/:id/documents` avec un `FormData` contenant `name`, `category`, `file`. Voir section 7.

### Ajouter un commentaire
```http
POST /api/v1/dossiers/:id/comments
Content-Type: application/json

{ "body": "Inspecteur prévu jeudi", "internal": true }
```
`internal: false` rend le commentaire visible au client sur son portail.

---

## 5. Clients & Fournisseurs

### Lister
```http
GET /api/v1/clients?q=...
GET /api/v1/suppliers?q=...
```

### Créer un client
```http
POST /api/v1/clients/create
Content-Type: application/json

{
  "name": "Nouvelle Société SARL",
  "code": "CLI-042",            // optionnel, unique
  "ice": "003456789000011",
  "rc": "123456",
  "taxId": "12345678",
  "email": "contact@exemple.ma",
  "phone": "+212 522 …",
  "city": "Casablanca",
  "address": "…",
  "contactName": "Nom Prénom"
}
```

### Créer un fournisseur
```http
POST /api/v1/suppliers/create
Content-Type: application/json

{ "name": "Fournisseur SA", "country": "Chine", "email": "...", "phone": "...", "address": "..." }
```

---

## 6. Permissions par rôle (ce que peut faire un token)

Le token hérite des droits de l'utilisateur lié :

| Rôle | Créer dossier | Modifier statut | Créer DUM | Créer client/fourn. | Gérer utilisateurs |
|---|---|---|---|---|---|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `EXPLOITATION` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `DECLARANT` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `BUREAU` | ❌ | ✅ | ❌ | ✅ | ❌ |
| `COMMIS_DOUANE` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `COMPTABILITE` | ❌ | ❌ | ❌ | ❌ | ❌ |

**Recommandation** : créer un token rattaché à un rôle `EXPLOITATION` pour les usages courants (saisie de dossiers, mise à jour statuts). Créer un token séparé `DECLARANT` pour la création des DUMs.

---

## 7. Upload d'un fichier (multipart)

L'endpoint v1 JSON crée seulement une **métadonnée** de document. Pour joindre un **vrai fichier**, utiliser :

```bash
curl -X POST "$TTMS_BASE_URL/api/dossiers/$DOSSIER_ID/documents" \
  -H "Authorization: Bearer $TTMS_TOKEN" \
  -F "name=Facture #INV-883" \
  -F "category=FACTURE_COMMERCIALE" \
  -F "file=@/chemin/vers/facture.pdf"
```

---

## 8. Erreurs

Codes HTTP standards :

- `400` : payload invalide (champ manquant, format incorrect)
- `401` : token absent ou invalide
- `403` : token valide mais droits insuffisants pour cette action
- `404` : ressource introuvable
- `409` : conflit (ex. numéro de dossier ou DUM déjà existant)
- `500` : erreur serveur

Le corps de la réponse en cas d'erreur :
```json
{ "error": "Numéro de dossier déjà utilisé", "details": { ... } }
```

---

## 9. Exemples concrets pour Claude

### Créer un dossier de bout en bout
```bash
# 1. trouver l'id du client
curl -s "$TTMS_BASE_URL/api/v1/clients?q=atlas" \
  -H "Authorization: Bearer $TTMS_TOKEN"

# 2. créer le dossier
curl -s -X POST "$TTMS_BASE_URL/api/v1/dossiers/create" \
  -H "Authorization: Bearer $TTMS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "D-2026-00099",
    "reference": "PO-NEW-001",
    "clientId": "cm…",
    "goodsValue": 12500,
    "goodsCurrency": "USD",
    "goodsPackages": 8
  }'

# 3. ajouter une DUM
curl -s -X POST "$TTMS_BASE_URL/api/v1/dossiers/D-2026-00099/dums" \
  -H "Authorization: Bearer $TTMS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "number": "M-9999001", "bureau": "Casablanca-Port" }'

# 4. déclarer reçue la facture commerciale
curl -s -X POST "$TTMS_BASE_URL/api/v1/dossiers/D-2026-00099/documents" \
  -H "Authorization: Bearer $TTMS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Facture #INV-001", "category": "FACTURE_COMMERCIALE" }'

# 5. passer au statut "validation douane"
curl -s -X POST "$TTMS_BASE_URL/api/v1/dossiers/D-2026-00099/status" \
  -H "Authorization: Bearer $TTMS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "VALIDATION_DOUANE" }'
```

### En tant que Claude (instructions à coller)

> Tu peux gérer les dossiers du transitaire via l'API REST. Base : `$TTMS_BASE_URL`, token Bearer dans `$TTMS_TOKEN`.
>
> **Toujours commencer par** :
> 1. `GET /api/v1/me` pour vérifier les permissions.
> 2. `GET /api/v1/schema` si tu as besoin de la liste exacte des statuts/catégories.
>
> **Bonnes pratiques** :
> - Avant de créer un dossier, vérifie qu'aucun n'existe avec le même numéro (`GET /api/v1/dossiers?q=<num>`).
> - Quand tu ajoutes un document, choisis la `category` la plus précise (pas `AUTRE` sauf nécessité).
> - Quand tu changes un statut, ajoute une `note` explicative — elle apparaît dans l'historique.
> - Les modifications sont auditées : ton nom (celui de l'utilisateur lié au token) apparaît dans le journal.

---

## 10. Bonnes pratiques sécurité

- **Un token par usage** : un pour Claude, un pour les scripts cron, etc.
- **Date d'expiration** : configurable à la création (non encore exposée dans l'UI v1 — passer par `POST /api/tokens` directement avec `expiresAt`).
- **Révocation immédiate** dès qu'un token n'est plus utilisé.
- **Ne jamais coller le token dans un repo Git** — utilise des variables d'environnement ou un gestionnaire de secrets.
- Les tokens sont stockés **hashés** côté serveur (bcrypt) ; impossible de les récupérer après leur création.

---

## 11. Limitations actuelles

- Pas de webhooks (à venir).
- Pas de rate limiting (à venir — recommandation : 100 req/min/token).
- Upload de fichiers via JSON impossible (utiliser le multipart legacy).
- La modification d'un client après validation d'une DUM est interdite (règle métier conservée).
