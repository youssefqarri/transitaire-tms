import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { NewInvoiceForm } from "./form";
import { nextInvoiceNumber } from "@/lib/invoicing-server";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session) return null;

  const [clients, next] = await Promise.all([
    prisma.client.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, city: true, ice: true },
    }),
    nextInvoiceNumber(),
  ]);

  return (
    <div className="max-w-4xl space-y-5">
      <Link
        href="/factures"
        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.75} /> Retour aux factures
      </Link>

      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Nouvelle facture</h1>
        <p className="text-[13px] text-[var(--color-fg-3)] mt-0.5">
          Numéro proposé :{" "}
          <span className="font-mono font-medium text-[var(--color-fg)]">{next.number}</span>
        </p>
      </div>

      <Card>
        <div className="p-5">
          <NewInvoiceForm
            clients={clients.map((c) => ({
              id: c.id,
              name: c.name,
              code: c.code,
              city: c.city,
            }))}
            suggestedNumber={next.number}
          />
        </div>
      </Card>
    </div>
  );
}
