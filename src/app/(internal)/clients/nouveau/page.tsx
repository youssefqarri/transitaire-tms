import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ClientForm } from "./form";

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="size-4" /> Retour aux clients
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-3">Nouveau client</h1>
      </div>
      <Card className="p-6">
        <ClientForm />
      </Card>
    </div>
  );
}
