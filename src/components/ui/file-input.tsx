"use client";

import { useId, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  /** Taille max en octets — au-delà, fichier rejeté */
  maxSize?: number;
  placeholder?: string;
  id?: string;
  className?: string;
};

export function FileInput({
  value,
  onChange,
  accept,
  maxSize,
  placeholder = "Cliquez ou glissez un fichier ici",
  id,
  className,
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function handle(f: File | null) {
    setErr(null);
    if (f && maxSize && f.size > maxSize) {
      setErr(`Fichier trop volumineux (max ${formatBytes(maxSize)})`);
      onChange(null);
      return;
    }
    onChange(f);
  }

  return (
    <div className={className}>
      {!value ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handle(f);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3.5 py-3 text-left cursor-pointer",
            "rounded-[var(--radius)] border border-dashed transition-colors select-none",
            dragOver
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
              : "border-[var(--color-border-2)] bg-[var(--color-surface)] hover:border-[var(--color-fg-mute)] hover:bg-[var(--color-surface-2)]",
          )}
        >
          <div className="size-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
            <Upload
              className={cn(
                "size-3.5",
                dragOver ? "text-[var(--color-accent)]" : "text-[var(--color-fg-mute)]",
              )}
              strokeWidth={1.75}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-[var(--color-fg)]">
              {placeholder}
            </div>
            <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5">
              PDF, image ou Office{maxSize && ` · max ${formatBytes(maxSize)}`}
            </div>
          </div>
          <input
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => handle(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--color-border-2)] bg-[var(--color-surface)]">
          <div className="size-8 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center shrink-0">
            <FileText className="size-3.5 text-[var(--color-accent)]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-[var(--color-fg)] truncate">
              {value.name}
            </div>
            <div className="text-[11.5px] text-[var(--color-fg-3)] mt-0.5 tnum">
              {formatBytes(value.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handle(null)}
            aria-label="Retirer le fichier"
            className="size-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-fg-mute)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      )}

      {err && (
        <div className="mt-1.5 text-[11.5px] text-[var(--color-danger)]">{err}</div>
      )}
    </div>
  );
}
