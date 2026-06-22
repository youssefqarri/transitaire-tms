"use client";

import { useEffect, useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/invoicing";
import { computeSyndicalHonoraire } from "@/lib/syndical";

const REDUCTIONS = [0, 15, 20, 30, 40] as const;

export function SyndicalCalculator({
  customsValue,
  customsDuties,
  articleCount,
  onApply,
}: {
  customsValue: number | null;
  customsDuties: number | null;
  articleCount: number | null;
  onApply: (amount: number, description: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number>(customsValue ?? 0);
  const [droits, setDroits] = useState<number>(customsDuties ?? 0);
  const [articles, setArticles] = useState<number>(
    articleCount && articleCount > 0 ? articleCount : 1,
  );
  const [reduction, setReduction] = useState<number>(0);

  // Pré-remplit valeur en douane + droits de douane depuis la DUM du dossier.
  useEffect(() => {
    if (customsValue != null && customsValue > 0) {
      setValue(customsValue);
      setOpen(true);
    }
  }, [customsValue]);
  useEffect(() => {
    if (customsDuties != null && customsDuties > 0) setDroits(customsDuties);
  }, [customsDuties]);

  // Pré-remplit le nombre d'articles depuis la DUM du dossier sélectionné.
  useEffect(() => {
    if (articleCount != null && articleCount > 0) setArticles(articleCount);
  }, [articleCount]);

  // Base de calcul (Art. 2) = valeur en douane + droits de douane.
  const base = (value || 0) + (droits || 0);
  const r = computeSyndicalHonoraire({
    customsValue: base,
    articleCount: articles,
    reductionPct: reduction,
  });

  function apply() {
    const label =
      reduction > 0
        ? `Honoraires de transit (tarif syndical − ${reduction} %)`
        : "Honoraires de transit (tarif syndical)";
    onApply(r.net, label);
  }

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
      >
        <span className="flex items-center gap-2">
          <Calculator className="size-4 text-[var(--color-fg-mute)]" />
          Calculateur d&apos;honoraires — tarif syndical
        </span>
        <ChevronDown
          className={`size-4 text-[var(--color-fg-mute)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-[var(--color-border)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="syn-val" className="text-[11.5px]">
                Valeur en douane (DH)
              </Label>
              <Input
                id="syn-val"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="text-right font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="syn-droits" className="text-[11.5px]">
                Droits de douane (DH)
              </Label>
              <Input
                id="syn-droits"
                type="number"
                min="0"
                step="0.01"
                value={droits}
                onChange={(e) => setDroits(Number(e.target.value))}
                className="text-right font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="syn-art" className="text-[11.5px]">
                Nombre d&apos;articles
              </Label>
              <Input
                id="syn-art"
                type="number"
                min="1"
                step="1"
                value={articles}
                onChange={(e) => setArticles(Math.max(1, Math.floor(Number(e.target.value))))}
                className="text-right font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="syn-red" className="text-[11.5px]">
                Réduction (%)
              </Label>
              <div className="flex gap-1.5">
                <Input
                  id="syn-red"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={reduction}
                  onChange={(e) =>
                    setReduction(Math.min(100, Math.max(0, Number(e.target.value))))
                  }
                  className="text-right font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {REDUCTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReduction(p)}
                className={`px-2.5 py-1 text-[11.5px] rounded-[var(--radius)] border ${
                  reduction === p
                    ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                    : "border-[var(--color-border-2)] text-[var(--color-fg-3)] hover:bg-[var(--color-surface-2)]"
                }`}
              >
                {p === 0 ? "Sans" : `− ${p} %`}
              </button>
            ))}
          </div>

          <div className="flex items-end justify-between gap-3 flex-wrap bg-[var(--color-surface-2)] rounded-[var(--radius)] px-3 py-2.5">
            <div className="text-[11.5px] text-[var(--color-fg-3)] leading-relaxed font-mono">
              Assiette {formatMAD(base)} (valeur + droits) → tarif {formatMAD(r.base)}
              {r.multiplier !== 1 && <> × {r.multiplier} (feuillet)</>}
              {r.reductionPct > 0 && <> − {r.reductionPct} %</>}
              <span className="text-[var(--color-fg)]"> = </span>
              <span className="text-[14px] font-semibold text-[var(--color-fg)]">
                {formatMAD(r.net)}
              </span>
            </div>
            <Button type="button" size="sm" onClick={apply}>
              Insérer les honoraires
            </Button>
          </div>
          <p className="text-[10.5px] text-[var(--color-fg-mute)]">
            Base de calcul = valeur en douane + droits de douane (Art. 2). Barème ARTICLE 3
            (même barème à l&apos;import et à l&apos;export), minimum 75 DH ; supplément feuillet
            au-delà de 4 / 8 / 12 articles.
          </p>
        </div>
      )}
    </div>
  );
}
