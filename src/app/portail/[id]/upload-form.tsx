"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { FileInput } from "@/components/ui/file-input";
import { DOCUMENT_CATEGORY_LABELS, isClientUploadableCategory } from "@/lib/statuses";
import type { DocumentCategory } from "@/generated/prisma/enums";

export function ClientUploadForm({
  dossierId,
  missing,
  requested = [],
}: {
  dossierId: string;
  missing: DocumentCategory[];
  /** Demandes personnalisées du transitaire (ex. « Certificat halal » en catégorie Autre). */
  requested?: { id: string; category: DocumentCategory; label: string; note?: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [category, setCategory] = useState<DocumentCategory>(missing[0] ?? "AUTRE");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function openWith(cat: DocumentCategory) {
    setCategory(cat);
    setOpen(true);
  }

  function openRequested(r: { category: DocumentCategory; label: string }) {
    setCategory(r.category);
    setName(r.label);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }
    start(async () => {
      const fd = new FormData();
      fd.append("category", category);
      fd.append("name", name);
      if (notes) fd.append("notes", notes);
      fd.append("file", file);
      const res = await fetch(`/api/portail/dossiers/${dossierId}/documents`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erreur lors de l'envoi");
        return;
      }
      toast.success("Document envoyé. Notre équipe sera notifiée.");
      setName("");
      setNotes("");
      setFile(null);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {(missing.length > 0 || requested.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {missing.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => openWith(c)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)] hover:opacity-80 transition-opacity"
            >
              <Upload className="size-3" strokeWidth={2.25} />
              Envoyer : {DOCUMENT_CATEGORY_LABELS[c]}
            </button>
          ))}
          {requested.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openRequested(r)}
              title={r.note}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium bg-[var(--color-warning-soft)] text-[var(--color-warning)] hover:opacity-80 transition-opacity"
            >
              <Upload className="size-3" strokeWidth={2.25} />
              Envoyer : {r.label}
            </button>
          ))}
        </div>
      )}

      {!open && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Upload className="size-3.5" strokeWidth={1.75} />
          Ajouter une pièce
        </Button>
      )}

      {open && (
        <form
          onSubmit={submit}
          className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 space-y-3 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13.5px] font-medium">Envoyer un document</div>
              <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
                Notre équipe sera automatiquement notifiée.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="size-6 rounded flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]"
              aria-label="Fermer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Type de document</Label>
              <Combobox
                id="category"
                items={Object.entries(DOCUMENT_CATEGORY_LABELS)
                  .filter(([k]) => isClientUploadableCategory(k as DocumentCategory))
                  .map(([k, l]) => ({ id: k, label: l }))}
                value={category}
                onChange={(v) => setCategory(v as DocumentCategory)}
                placeholder="Choisir un type…"
                searchPlaceholder="Rechercher…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nom <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={file ? file.name.replace(/\.[^.]+$/, "") : "Ex. Facture #INV-001"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file">Fichier</Label>
            <FileInput
              id="file"
              value={file}
              onChange={setFile}
              maxSize={25 * 1024 * 1024}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx,.doc,.csv"
              placeholder="Cliquez ou glissez le fichier"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Message <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Précisions à transmettre à notre équipe…"
              className="w-full px-3 py-2 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] focus:border-transparent resize-y"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
