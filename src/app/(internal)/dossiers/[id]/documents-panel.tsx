"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CheckCircle2, AlertCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <h2
          className="font-display text-[28px] tracking-[-0.018em]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 420' }}
        >
          Pièces du dossier
          <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] tabular">
            · {documents.length}
          </span>
        </h2>
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          <Plus className="size-3" /> Ajouter
        </Button>
      </header>

      {/* checklist obligatoires */}
      <div className="border-t border-[var(--color-rule-strong)] pt-3 pb-4">
        <div className="label-eyebrow mb-3">Documents obligatoires</div>
        <div className="flex flex-wrap gap-2">
          {requiredCategories.map((c) => {
            const ok = presentCats.has(c);
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.10em] border ${
                  ok
                    ? "border-[var(--color-leaf)] text-[var(--color-leaf)] bg-[var(--color-leaf-soft)]/40"
                    : "border-[var(--color-stamp)] text-[var(--color-stamp)] bg-[var(--color-stamp-soft)]/40"
                }`}
              >
                {ok ? <CheckCircle2 className="size-3" strokeWidth={1.5} /> : <AlertCircle className="size-3" strokeWidth={1.5} />}
                {DOCUMENT_CATEGORY_LABELS[c]}
              </span>
            );
          })}
        </div>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="mb-4 border border-[var(--color-rule-strong)] bg-[var(--color-paper-strong)] p-5 space-y-4 animate-fade-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Facture #INV-001"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Fichier (facultatif)</Label>
            <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
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

      <div className="border-t border-b border-[var(--color-rule-strong)]">
        {documents.length === 0 && (
          <div className="py-10 text-center text-[14px] text-[var(--color-ink-mute)] font-display italic">
            Aucune pièce déposée.
          </div>
        )}
        {documents.map((d, idx) => (
          <div
            key={d.id}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 py-3 px-1 border-b border-[var(--color-rule)] last:border-b-0 hover:bg-[var(--color-paper-strong)] transition-colors"
          >
            <span className="font-mono text-[10px] text-[var(--color-ink-mute)] tabular w-6">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <FileText className="size-3.5 text-[var(--color-ink-mute)]" strokeWidth={1.5} />
                <span className="text-[14px] text-[var(--color-ink)] truncate">{d.name}</span>
                {d.version > 1 && (
                  <span className="font-mono text-[10px] text-[var(--color-stamp)]">
                    v{d.version}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge tone="outline">{DOCUMENT_CATEGORY_LABELS[d.category]}</Badge>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)]">
                  {formatDate(d.receivedAt)}
                  {d.uploadedByName && ` · ${d.uploadedByName}`}
                </span>
              </div>
            </div>
            <div />
            {d.fileUrl ? (
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink)] hover:underline inline-flex items-center gap-1"
              >
                <Download className="size-3" strokeWidth={1.5} /> Ouvrir
              </a>
            ) : (
              <span className="font-mono text-[10.5px] uppercase tracking-[0.10em] text-[var(--color-ink-mute)]">
                —
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
