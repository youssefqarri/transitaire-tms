import { prisma } from "./db";
import { extractIdentifiers } from "./email-classifier";

// rattache un email à des dossiers selon les règles :
//   - cas 1 : DUM validée -> match par numéro de DUM
//   - cas 2 : dossier non validé -> match par référence dossier
export async function linkEmailToDossiers(emailId: string) {
  const email = await prisma.emailMessage.findUnique({ where: { id: emailId } });
  if (!email) return [];

  const text = `${email.subject ?? ""} ${email.snippet ?? ""} ${email.bodyText ?? ""}`;
  const { dums, refs } = extractIdentifiers(text);

  const matched: { dossierId: string; matchedOn: string }[] = [];

  for (const num of dums) {
    const dum = await prisma.dUM.findFirst({ where: { number: num } });
    if (dum) matched.push({ dossierId: dum.dossierId, matchedOn: `DUM:${num}` });
  }
  for (const ref of refs) {
    const ds = await prisma.dossier.findMany({
      where: {
        deletedAt: null,
        OR: [
          { reference: { equals: ref, mode: "insensitive" } },
          { number: { equals: ref, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    for (const d of ds) matched.push({ dossierId: d.id, matchedOn: `REF:${ref}` });
  }

  // dédoublonnage
  const seen = new Set<string>();
  const created: string[] = [];
  for (const m of matched) {
    if (seen.has(m.dossierId)) continue;
    seen.add(m.dossierId);
    try {
      await prisma.emailLink.create({
        data: { messageId: emailId, dossierId: m.dossierId, auto: true, matchedOn: m.matchedOn },
      });
      created.push(m.dossierId);
      // créer notif interne
      await prisma.notification.create({
        data: {
          role: "EXPLOITATION",
          dossierId: m.dossierId,
          kind: "EMAIL_NEW",
          title: `Nouveau email rattaché (${m.matchedOn})`,
          body: email.subject ?? undefined,
          link: `/dossiers/${m.dossierId}`,
        },
      });
    } catch {
      // unique violation -> déjà lié
    }
  }
  return created;
}
