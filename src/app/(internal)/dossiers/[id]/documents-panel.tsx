"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/statuses";
import type { DocumentCategory } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/utils";

type Doc = {
  id: string;
  name: string;
  category: DocumentCategory;
  version: number;
  receivedAt: Date;
  fileUrl: string | null;
  uploadedByName: string | null;
};

export function DocumentsPanel({
  dossierId,
  documents,
  requiredCategories,
}: {
  dossierId: string;
  documents: Doc[];
  requiredCategories: DocumentCategory[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("FACTURE_COMMERCIALE");
  const [file, setFile] = useState<File | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { toast.error("Nom requis"); return; }
    start(async () => {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("category", category);
      if (file) fd.append("file", file);
      const res = await fetch(`/api/dossiers/${dossierId}/documents`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) { toast.error("Erreur"); return; }
      toast.success("Document ajouté");
      setName("");
      setFile(null);
      setOpen(false);
      router.refresh();
    });
  }

  const presentCats = new Set(documents.map((d) => d.category));

  return (
    <Card>
      <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2">
          <FileText className="size-4" /> Documents
          <span className="text-xs text-[var(--color-muted-foreground)] font-normal">
            ({documents.length})
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          <Plus className="size-4" /> Ajouter
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="p-5 border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">Catégorie</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Facture #INV-001" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">Fichier (optionnel)</label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" disabled={pending}>
              {pending ? "Ajout…" : "Ajouter"}
            </Button>
          </div>
        </form>
      )}

      {/* Vue checklist obligatoires */}
      <div className="p-5 border-b border-[var(--color-border)]">
        <div className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
          Documents obligatoires
        </div>
        <div className="flex flex-wrap gap-2">
          {requiredCategories.map((c) => {
            const ok = presentCats.has(c);
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                  ok
                    ? "bg-[oklch(95%_0.07_150)] text-[oklch(35%_0.18_150)]"
                    : "bg-[oklch(96%_0.08_75)] text-[oklch(40%_0.17_60)]"
                }`}
              >
                {ok ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                {DOCUMENT_CATEGORY_LABELS[c]}
              </span>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {documents.length === 0 && (
          <div className="p-8 text-sm text-[var(--color-muted-foreground)] text-center">
            Aucun document pour l'instant.
          </div>
        )}
        {documents.map((d) => (
          <div key={d.id} className="p-4 flex items-center gap-3 hover:bg-[var(--color-muted)]/40">
            <div className="size-9 rounded-lg bg-[var(--color-muted)] flex items-center justify-center shrink-0">
              <FileText className="size-4 text-[var(--color-muted-foreground)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{d.name}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">
                <Badge tone="outline">{DOCUMENT_CATEGORY_LABELS[d.category]}</Badge>
                <span className="ml-2">
                  v{d.version} · {formatDate(d.receivedAt)}
                  {d.uploadedByName && ` · ${d.uploadedByName}`}
                </span>
              </div>
            </div>
            {d.fileUrl && (
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                Ouvrir
              </a>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
