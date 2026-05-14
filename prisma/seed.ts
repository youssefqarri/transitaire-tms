import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seed en cours…");

  const hashed = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@transitaire.ma" },
    update: {},
    create: {
      email: "admin@transitaire.ma",
      name: "Admin",
      password: hashed,
      role: "ADMIN",
    },
  });

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "exploitation@transitaire.ma" },
      update: {},
      create: {
        email: "exploitation@transitaire.ma",
        name: "Karim Exploitation",
        password: hashed,
        role: "EXPLOITATION",
      },
    }),
    prisma.user.upsert({
      where: { email: "declarant@transitaire.ma" },
      update: {},
      create: {
        email: "declarant@transitaire.ma",
        name: "Yassine Déclarant",
        password: hashed,
        role: "DECLARANT",
      },
    }),
    prisma.user.upsert({
      where: { email: "commis@transitaire.ma" },
      update: {},
      create: {
        email: "commis@transitaire.ma",
        name: "Ahmed Commis",
        password: hashed,
        role: "COMMIS_DOUANE",
      },
    }),
    prisma.user.upsert({
      where: { email: "bureau@transitaire.ma" },
      update: {},
      create: {
        email: "bureau@transitaire.ma",
        name: "Sara Bureau",
        password: hashed,
        role: "BUREAU",
      },
    }),
    prisma.user.upsert({
      where: { email: "compta@transitaire.ma" },
      update: {},
      create: {
        email: "compta@transitaire.ma",
        name: "Leila Compta",
        password: hashed,
        role: "COMPTABILITE",
      },
    }),
  ]);

  const client1 = await prisma.client.upsert({
    where: { code: "CLI-001" },
    update: {},
    create: {
      name: "Atlas Import SARL",
      code: "CLI-001",
      ice: "001234567000023",
      email: "contact@atlasimport.ma",
      phone: "+212 522 123 456",
      city: "Casablanca",
      contactName: "Mehdi Atlas",
    },
  });
  const client2 = await prisma.client.upsert({
    where: { code: "CLI-002" },
    update: {},
    create: {
      name: "Maroc Textile Co.",
      code: "CLI-002",
      ice: "002345678000099",
      email: "ops@maroctextile.ma",
      city: "Tanger",
    },
  });
  const client3 = await prisma.client.upsert({
    where: { code: "CLI-003" },
    update: {},
    create: {
      name: "Électro Casa SA",
      code: "CLI-003",
      city: "Casablanca",
      email: "import@electrocasa.ma",
    },
  });

  await prisma.user.upsert({
    where: { email: "client@atlasimport.ma" },
    update: {},
    create: {
      email: "client@atlasimport.ma",
      name: "Mehdi Atlas",
      password: hashed,
      role: "CLIENT",
      clientId: client1.id,
    },
  });

  const sup1 = await prisma.supplier.upsert({
    where: { id: "sup-001" },
    update: {},
    create: { id: "sup-001", name: "Shanghai Electronics Ltd", country: "Chine" },
  });
  const sup2 = await prisma.supplier.upsert({
    where: { id: "sup-002" },
    update: {},
    create: { id: "sup-002", name: "Istanbul Textile A.Ş.", country: "Turquie" },
  });

  const dossierData = [
    {
      number: "D-2026-00001",
      reference: "PO-ATL-2026-001",
      clientId: client1.id,
      supplierId: sup1.id,
      status: "DOCUMENTS_MANQUANTS" as const,
      goodsValue: 45230.5,
      goodsCurrency: "USD",
      goodsWeight: 2150.0,
      goodsPackages: 18,
      goodsDescription: "Composants électroniques et accessoires",
    },
    {
      number: "D-2026-00002",
      reference: "INV-MTX-883",
      clientId: client2.id,
      supplierId: sup2.id,
      status: "VALIDATION_DOUANE" as const,
      goodsValue: 18920.0,
      goodsCurrency: "EUR",
      goodsWeight: 870.5,
      goodsPackages: 12,
      goodsDescription: "Tissu polyester rouleaux",
    },
    {
      number: "D-2026-00003",
      reference: "PO-EC-114",
      clientId: client3.id,
      supplierId: sup1.id,
      status: "BON_A_ENLEVER_DEFINITIF" as const,
      goodsValue: 92000.0,
      goodsCurrency: "USD",
      goodsWeight: 4200.0,
      goodsPackages: 32,
      goodsDescription: "Appareils électroménagers",
    },
    {
      number: "D-2026-00004",
      reference: "ORDER-9921",
      clientId: client1.id,
      status: "CLOTURE" as const,
      goodsValue: 12450.0,
      goodsCurrency: "EUR",
      goodsWeight: 540.0,
      goodsPackages: 8,
      closedAt: new Date(Date.now() - 5 * 86400000),
    },
    {
      number: "D-2026-00005",
      reference: "REF-TX-5512",
      clientId: client2.id,
      supplierId: sup2.id,
      status: "BUREAU_VALEUR" as const,
      goodsValue: 31200.0,
      goodsCurrency: "EUR",
      goodsPackages: 22,
    },
  ];

  for (const d of dossierData) {
    const existing = await prisma.dossier.findUnique({ where: { number: d.number } });
    if (existing) continue;
    await prisma.dossier.create({
      data: {
        ...d,
        createdById: admin.id,
        assignedToId: users[1].id,
        receivedAt: new Date(),
        statusChanges: {
          create: [
            { toStatus: "OUVERTURE", note: "Ouverture", changedById: admin.id },
            { toStatus: "RECEPTIONNE", note: "Réception du dossier", changedById: admin.id },
            { fromStatus: "RECEPTIONNE", toStatus: d.status, changedById: users[1].id },
          ],
        },
      },
    });
  }

  const dossier1 = await prisma.dossier.findUnique({ where: { number: "D-2026-00002" } });
  if (dossier1) {
    await prisma.dUM.upsert({
      where: { number: "M-1234567" },
      update: {},
      create: {
        number: "M-1234567",
        dossierId: dossier1.id,
        bureau: "Casablanca-Port",
        status: "VALIDE",
        registeredAt: new Date(),
      },
    });

    const docs = [
      { name: "Facture commerciale #INV-883", category: "FACTURE_COMMERCIALE" as const },
      { name: "Colisage", category: "COLISAGE" as const },
      { name: "BL Shanghai-Casa", category: "CONNAISSEMENT" as const },
      { name: "Facture fret", category: "FACTURE_FRET" as const },
    ];
    for (const doc of docs) {
      const exists = await prisma.document.findFirst({
        where: { dossierId: dossier1.id, name: doc.name },
      });
      if (!exists) {
        await prisma.document.create({
          data: { ...doc, dossierId: dossier1.id, uploadedById: admin.id },
        });
      }
    }
  }

  const dossierBlocked = await prisma.dossier.findUnique({ where: { number: "D-2026-00001" } });
  if (dossierBlocked) {
    const exists = await prisma.notification.findFirst({
      where: { dossierId: dossierBlocked.id, kind: "DOCUMENT_MANQUANT" },
    });
    if (!exists) {
      await prisma.notification.create({
        data: {
          role: "EXPLOITATION",
          dossierId: dossierBlocked.id,
          kind: "DOCUMENT_MANQUANT",
          title: `Dossier ${dossierBlocked.number} : documents manquants`,
          body: "L'engagement d'importation et le BL sont en attente.",
          link: `/dossiers/${dossierBlocked.id}`,
        },
      });
    }
  }

  console.log("✅ Seed terminé.");
  console.log("\n🔐 Comptes de démo (mot de passe : password123):");
  console.log("  admin@transitaire.ma         (Admin)");
  console.log("  exploitation@transitaire.ma  (Exploitation)");
  console.log("  declarant@transitaire.ma     (Déclarant)");
  console.log("  commis@transitaire.ma        (Commis en douane)");
  console.log("  bureau@transitaire.ma        (Bureau)");
  console.log("  compta@transitaire.ma        (Comptabilité)");
  console.log("  client@atlasimport.ma        (Client portail)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
