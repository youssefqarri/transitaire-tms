"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CheckCircle2, AlertCircle, FileText, Download, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { FileInput } from "@/components/ui/file-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  uploadedByIsClient: boolean;
  notes: string | null;
};

export function DocumentsPanel({
  dossierId,
  documents,
  requiredCategories,
  readOnly = false,
}: {
  dossierId: string;
  documents: Doc[];
  requiredCategories: DocumentCategory[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("FACTURE_COMMERCIALE");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [toDelete, setToDelete] = useState<Doc | null>(null);
  const [deleting, startDelete] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // pas d'obligation : on accepte aussi une simple catégorie (le serveur générera un nom)
    start(async () => {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("category", category);
      if (notes) fd.append("notes", notes);
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
      setNotes("");
      setFile(null);
      setOpen(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const doc = toDelete;
    startDelete(async () => {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erreur lors de la suppression");
        return;
      }
      toast.success("Document supprimé");
      setToDelete(null);
      router.refresh();
    });
  }

  const presentCats = new Set(documents.map((d) => d.category));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Documents
          <span className="ml-2 text-[12px] font-normal text-[var(--color-fg-3)] tnum">
            {documents.length}
          </span>
        </CardTitle>
        {!readOnly && (
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            <Plus /> Ajouter
          </Button>
        )}
      </CardHeader>

      <div className="px-5 py-3 border-b border-[var(--color-border)]">
        <div className="text-[12px] font-medium text-[var(--color-fg-3)] mb-2">
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

      {!readOnly && open && (
        <form onSubmit={submit} className="px-5 py-4 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Catégorie</Label>
              <Combobox
                id="category"
                items={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, l]) => ({
                  id: k,
                  label: l,
                }))}
                value={category}
                onChange={(v) => setCategory(v as DocumentCategory)}
                placeholder="Choisir une catégorie…"
                searchPlaceholder="Rechercher une catégorie…"
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
          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Note / message <span className="text-[var(--color-fg-mute)] font-normal">(optionnel)</span>
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex. Demande d'acceptation de la valeur, demande de ventilation, message PortNet…"
              className="w-full px-3 py-2 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border-2)] rounded-[var(--radius)] placeholder:text-[var(--color-fg-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-ring)] focus:border-transparent resize-y"
            />
            <p className="text-[11px] text-[var(--color-fg-mute)]">
              Pratique pour les messages PortNet, douane, conformité — vous pourrez l&apos;envoyer au client plus tard.
            </p>
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
          <div
            key={d.id}
            className={`px-5 py-3 flex items-center gap-3 transition-colors ${
              d.uploadedByIsClient
                ? "bg-[var(--color-danger-soft)] hover:bg-[var(--color-danger-soft)]/80 border-l-2 border-[var(--color-danger)]"
                : "hover:bg-[var(--color-surface-2)]"
            }`}
          >
            <FileText
              className={`size-4 shrink-0 ${
                d.uploadedByIsClient ? "text-[var(--color-danger)]" : "text-[var(--color-fg-mute)]"
              }`}
              strokeWidth={1.75}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-[var(--color-fg)] truncate">{d.name}</span>
                {d.version > 1 && (
                  <span className="font-mono text-[11px] text-[var(--color-fg-3)]">v{d.version}</span>
                )}
                {d.uploadedByIsClient && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-info-soft)] text-[var(--color-info)]">
                    Reçu du client
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[12px] text-[var(--color-fg-3)]">
                <Badge tone="outline">{DOCUMENT_CATEGORY_LABELS[d.category]}</Badge>
                <span>
                  {formatDate(d.receivedAt)}
                  {d.uploadedByName && ` · ${d.uploadedByName}`}
                </span>
              </div>
              {d.notes && (
                <div className="mt-1.5 text-[12px] text-[var(--color-fg-2)] bg-[var(--color-surface-2)] rounded px-2 py-1.5 whitespace-pre-wrap border border-[var(--color-border)]">
                  {d.notes}
                </div>
              )}
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
              <span className="text-[12px] text-[var(--color-fg-mute)]">—</span>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => setToDelete(d)}
                className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors shrink-0"
                aria-label="Supprimer le document"
                title="Supprimer"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Supprimer ce document ?"
        description={
          toDelete ? (
            <>
              Le document <span className="font-medium">{toDelete.name}</span> sera
              définitivement supprimé. Cette action est irréversible.
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        tone="danger"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
