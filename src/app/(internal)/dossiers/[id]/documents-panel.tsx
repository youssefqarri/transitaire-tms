"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CheckCircle2, AlertCircle, FileText, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FileInput } from "@/components/ui/file-input";
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
    if (!name) {
      toast.error("Nom requis");
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("category", category);
      if (file) fd.append("file", file);
      const res = await fetch(`/api/dossiers/${dossierId}/documents`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        toast.error("Erreur");
        return;
      }
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
      <CardHeader>
        <CardTitle>
          Documents
          <span className="ml-2 text-[11.5px] font-normal text-[var(--color-fg-3)] tnum">
            {documents.length}
          </span>
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          <Plus /> Ajouter
        </Button>
      </CardHeader>

      <div className="px-5 py-3 border-b border-[var(--color-border)]">
        <div className="text-[11.5px] font-medium text-[var(--color-fg-3)] mb-2">
          Documents obligatoires
        </div>
        <div className="flex flex-wrap gap-1.5">
          {requiredCategories.map((c) => {
            const ok = presentCats.has(c);
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  ok
                    ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                    : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                }`}
              >
                {ok ? <CheckCircle2 className="size-3" strokeWidth={2} /> : <AlertCircle className="size-3" strokeWidth={2} />}
                {DOCUMENT_CATEGORY_LABELS[c]}
              </span>
            );
          })}
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="px-5 py-4 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Catégorie</Label>
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Facture #INV-001" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file">Fichier (optionnel)</Label>
            <FileInput
              id="file"
              value={file}
              onChange={setFile}
              maxSize={25 * 1024 * 1024}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx,.doc,.csv"
              placeholder="Cliquez ou glissez le fichier"
            />
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

      <div className="divide-y divide-[var(--color-border)]">
        {documents.length === 0 && (
          <div className="py-8 text-center text-[13px] text-[var(--color-fg-3)]">
            Aucun document pour l'instant.
          </div>
        )}
        {documents.map((d) => (
          <div key={d.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors">
            <FileText className="size-4 text-[var(--color-fg-mute)] shrink-0" strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-[var(--color-fg)] truncate">{d.name}</span>
                {d.version > 1 && (
                  <span className="font-mono text-[10.5px] text-[var(--color-fg-3)]">v{d.version}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-[var(--color-fg-3)]">
                <Badge tone="outline">{DOCUMENT_CATEGORY_LABELS[d.category]}</Badge>
                <span>
                  {formatDate(d.receivedAt)}
                  {d.uploadedByName && ` · ${d.uploadedByName}`}
                </span>
              </div>
            </div>
            {d.fileUrl ? (
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-[var(--color-accent)] hover:underline"
              >
                <Download className="size-3" strokeWidth={2} /> Ouvrir
              </a>
            ) : (
              <span className="text-[11.5px] text-[var(--color-fg-mute)]">—</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
