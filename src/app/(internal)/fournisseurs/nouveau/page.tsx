import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SupplierForm } from "./form";

export default function NewSupplierPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <BackLink href="/fournisseurs">Retour</BackLink>
      <PageHeader title="Nouveau fournisseur" />
      <Card className="p-6">
        <SupplierForm />
      </Card>
    </div>
  );
}
