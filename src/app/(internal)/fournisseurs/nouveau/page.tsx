import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SupplierForm } from "./form";

export default function NewSupplierPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/fournisseurs" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Nouveau fournisseur</h1>
      <Card className="p-6">
        <SupplierForm />
      </Card>
    </div>
  );
}
