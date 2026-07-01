"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, X, Pencil, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useEscapeClose, backdropDismiss } from "@/components/ui/dismiss";

const METHODS = [
  { id: "VIREMENT", label: "Virement" },
  { id: "CHEQUE", label: "Chèque" },
  { id: "ESPECES", label: "Espèces" },
  { id: "TRAITE", label: "Traite" },
  { id: "AUTRE", label: "Autre" },
];
const methodLabel = (m: string | null) => METHODS.find((x) => x.id === m)?.label ?? "—";
const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

export type Payment = {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  paidAt: string;
  note: string | null;
};

// Registre des encaissements d'une facture : voir / ajouter / éditer / supprimer (soft).
export function InvoicePayments({
  invoiceId,
  ttc,
  paidAmount,
  payments,
  unpaid,
}: {
  invoiceId: string;
  ttc: number;
  paidAmount: number;
  payments: Payment[];
  unpaid: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const remaining = Math.max(0, Math.round((ttc - paidAmount) * 100) / 100);
  useEscapeClose(open, () => setOpen(false), !pending);

  // Formulaire d'ajout.
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("VIREMENT");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");

  // Édition inline.
  const [editId, setEditId] = useState<string | null>(null);
  const [eAmount, setEAmount] = useState("");
  const [eMethod, setEMethod] = useState("VIREMENT");
  const [eDate, setEDate] = useState("");
  const [eRef, setERef] = useState("");

  function openDialog() {
    setAmount(String(remaining || ""));
    setDate(new Date().toISOString().slice(0, 10));
    setMethod("VIREMENT");
    setReference("");
    setEditId(null);
    setOpen(true);
  }

  function add() {
    const amt = Number(amount);
    if (!(amt > 0)) return toast.error("Montant invalide");
    start(async () => {
      const res = await fetch(`/api/admin/subscription-invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method, date, reference: reference || undefined }),
      });
      if (!res.ok) { toast.error("Échec de l'ajout"); return; }
      toast.success("Encaissement ajouté");
      setAmount("");
      setReference("");
      router.refresh();
    });
  }

  function startEdit(p: Payment) {
    setEditId(p.id);
    setEAmount(String(p.amount));
    setEMethod(p.method ?? "VIREMENT");
    setEDate(p.paidAt.slice(0, 10));
    setERef(p.reference ?? "");
  }

  function saveEdit() {
    const amt = Number(eAmount);
    if (!(amt > 0)) return toast.error("Montant invalide");
    start(async () => {
      const res = await fetch(`/api/admin/subscription-payments/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method: eMethod, date: eDate, reference: eRef }),
      });
      if (!res.ok) { toast.error("Échec de la modification"); return; }
      toast.success("Encaissement modifié");
      setEditId(null);
      router.refresh();
    });
  }

  function del(pid: string) {
    if (!confirm("Supprimer cet encaissement ?")) return;
    start(async () => {
      const res = await fetch(`/api/admin/subscription-payments/${pid}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Échec de la suppression"); return; }
      toast.success("Encaissement supprimé");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant={unpaid ? "soft-success" : "ghost"} size="sm" onClick={openDialog}>
        <Wallet /> Encaissements{payments.length > 0 ? ` (${payments.length})` : ""}
      </Button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6 animate-fade-in"
            onMouseDown={backdropDismiss(() => !pending && setOpen(false))}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-xl max-h-[88vh] flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="text-[14px] font-semibold text-[var(--color-fg)]">Encaissements</div>
                  <div className="text-[12px] text-[var(--color-fg-3)] tnum">
                    Encaissé {fmt(paidAmount)} / {fmt(ttc)} MAD · reste{" "}
                    <span className={remaining > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}>
                      {fmt(remaining)} MAD
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-5 space-y-4">
                {/* Registre */}
                {payments.length === 0 ? (
                  <div className="text-[13px] text-[var(--color-fg-mute)]">Aucun encaissement enregistré.</div>
                ) : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-[12px] text-[var(--color-fg-3)]">
                        <th className="py-2 text-left font-medium">Date</th>
                        <th className="py-2 text-right font-medium">Montant</th>
                        <th className="py-2 text-left font-medium">Méthode</th>
                        <th className="py-2 text-left font-medium">Réf.</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) =>
                        editId === p.id ? (
                          <tr key={p.id} className="border-b border-[var(--color-border)]">
                            <td className="py-1.5 pr-1">
                              <Input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} className="h-8" />
                            </td>
                            <td className="py-1.5 px-1">
                              <Input type="number" step="0.01" value={eAmount} onChange={(e) => setEAmount(e.target.value)} className="h-8 text-right" />
                            </td>
                            <td className="py-1.5 px-1">
                              <Combobox items={METHODS} value={eMethod} onChange={setEMethod} searchable={false} />
                            </td>
                            <td className="py-1.5 px-1">
                              <Input value={eRef} onChange={(e) => setERef(e.target.value)} className="h-8" />
                            </td>
                            <td className="py-1.5 pl-1 text-right whitespace-nowrap">
                              <button type="button" onClick={saveEdit} disabled={pending} className="text-[var(--color-success)] hover:opacity-70 mr-2" title="Valider">
                                <Check className="size-4" />
                              </button>
                              <button type="button" onClick={() => setEditId(null)} className="text-[var(--color-fg-mute)] hover:opacity-70" title="Annuler">
                                <X className="size-4" />
                              </button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                            <td className="py-2 text-[var(--color-fg-3)] tnum">{fmtDate(p.paidAt)}</td>
                            <td className="py-2 text-right tnum font-medium text-[var(--color-fg)]">{fmt(p.amount)}</td>
                            <td className="py-2 text-[var(--color-fg-2)]">{methodLabel(p.method)}</td>
                            <td className="py-2 text-[var(--color-fg-3)] truncate max-w-[120px]">{p.reference || "—"}</td>
                            <td className="py-2 text-right whitespace-nowrap">
                              <button type="button" onClick={() => startEdit(p)} className="text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] mr-2" title="Éditer">
                                <Pencil className="size-3.5" />
                              </button>
                              <button type="button" onClick={() => del(p.id)} disabled={pending} className="text-[var(--color-fg-mute)] hover:text-[var(--color-danger)]" title="Supprimer">
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}

                {/* Ajout */}
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-3 space-y-3">
                  <div className="text-[12px] font-medium text-[var(--color-fg)]">Ajouter un encaissement</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Montant (MAD)</Label>
                      <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Méthode</Label>
                      <Combobox items={METHODS} value={method} onChange={setMethod} searchable={false} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Référence</Label>
                      <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° chèque…" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={add} disabled={pending}>
                      <Plus /> Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end px-5 py-3 border-t border-[var(--color-border)]">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
