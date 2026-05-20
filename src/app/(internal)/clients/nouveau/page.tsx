import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "./form";

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <BackLink href="/clients">Retour aux clients</BackLink>
        <PageHeader title="Nouveau client" className="mt-3" />
      </div>
      <Card className="p-6">
        <ClientForm />
      </Card>
    </div>
  );
}
