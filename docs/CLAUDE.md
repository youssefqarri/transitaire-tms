# Transitaire TMS — Instructions pour Claude

Tu interagis avec la plateforme **Transitaire TMS** (gestion de transit douanier au Maroc) via son API REST.

## Configuration

Avant toute action, vérifie que les variables sont disponibles dans l'environnement :
- `TTMS_BASE_URL` (ex. `http://localhost:3000`)
- `TTMS_TOKEN` (commence par `ttms_…`)

Si elles ne sont pas définies, **demande-les à l'utilisateur avant de continuer**.

## Premier contact

À chaque nouvelle session :

```bash
curl -s "$TTMS_BASE_URL/api/v1/me" -H "Authorization: Bearer $TTMS_TOKEN"
```

→ pour confirmer que le token fonctionne et connaître ton rôle.

```bash
curl -s "$TTMS_BASE_URL/api/v1/schema" -H "Authorization: Bearer $TTMS_TOKEN"
```

→ pour récupérer la liste exacte des statuts/catégories valides.

## Référence complète

La documentation complète des endpoints est dans `CLAUDE_API_GUIDE.md` (au même endroit que ce fichier). Lis-la pour comprendre :
- les endpoints disponibles (`/api/v1/...`)
- les valeurs des énumérations (statuts dossiers, catégories de documents)
- les règles métier (ex. unicité des numéros, verrou client après DUM validée)
- les exemples d'enchaînements (création complète d'un dossier)

## Règles de comportement

1. **Toujours rechercher avant de créer** : pour un dossier ou un client, vérifier qu'il n'existe pas déjà (`GET /api/v1/dossiers?q=…` ou `GET /api/v1/clients?q=…`).
2. **Numéros de dossier** : suivre le format existant utilisé par WinApp (ex. `D-AAAA-NNNNN`). Ne pas inventer un format ; demander à l'utilisateur si ambigu.
3. **Statuts** : utiliser uniquement les valeurs retournées par `/api/v1/schema`. Ne pas inventer de statut.
4. **Catégories de documents** : préférer la catégorie la plus précise (`FACTURE_COMMERCIALE`, `CONNAISSEMENT`, …) à `AUTRE`.
5. **Notes / commentaires** : utiliser la langue de l'utilisateur (français par défaut).
6. **Confirmer les actions destructives** ou de masse : avant de créer en lot, demander confirmation avec un récap.
7. **Erreurs** : si l'API renvoie 4xx, lire le `error` du body et expliquer à l'utilisateur. Ne pas réessayer aveuglément.

## Erreurs courantes à éviter

- ❌ Créer un dossier sans connaître l'`id` du client → toujours faire `GET /api/v1/clients?q=…` d'abord.
- ❌ Tenter de modifier le client d'un dossier qui a déjà une DUM validée (rejeté par l'API : 409).
- ❌ Utiliser une date `visitDate` sans format ISO 8601.
- ❌ Oublier l'en-tête `Content-Type: application/json` sur un POST/PATCH.
