// Bootstrap d'un ADMIN PLATEFORME (Evead) — AU-DESSUS des cabinets : ce compte
// n'appartient à aucune organisation (orgId = null). Son statut « plateforme »
// vient de ESCALE_PLATFORM_ADMINS (allowlist serveur). À lancer par l'OPÉRATEUR
// sur le serveur ; le mot de passe reste dans TES mains (variable d'env).
//
// Exemple (sur le serveur, dans /opt/transitaire-tms) :
//   docker compose -f docker-compose.prod.yml run --rm \
//     -e PLATFORM_ADMIN_EMAIL=youssef.qarri@escale.ma \
//     -e PLATFORM_ADMIN_NAME="Youssef Qarri" \
//     -e PLATFORM_ADMIN_PASSWORD='TON_MOT_DE_PASSE' \
//     migrate pnpm tsx scripts/create-platform-admin.ts

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase().trim();
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || "Admin plateforme";
  const password = process.env.PLATFORM_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("✗ Définis PLATFORM_ADMIN_EMAIL et PLATFORM_ADMIN_PASSWORD dans l'environnement.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("✗ Le mot de passe doit faire au moins 8 caractères.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", orgId: null, active: true, password: hashed, name },
    create: { email, name, role: "ADMIN", orgId: null, active: true, password: hashed },
  });

  console.log(`✔ Compte plateforme prêt : ${user.email} (orgId=null, rôle ADMIN).`);
  console.log(`  → Vérifie que ${email} figure dans ESCALE_PLATFORM_ADMINS (déjà réglé).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
