"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ForgotForm() {
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-[var(--radius)] bg-[var(--color-success-soft)] border border-[var(--color-success)]/30 p-4 text-[13px] text-[var(--color-success)] flex items-start gap-2">
        <CheckCircle2 className="size-4 shrink-0 mt-0.5" strokeWidth={2} />
        <div>
          Si un compte existe avec <strong>{email}</strong>, un email de réinitialisation a été
          envoyé. Vérifiez votre boîte de réception (et les spams).
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@entreprise.ma"
          autoFocus
          required
        />
      </div>
      <Button className="w-full" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
      </Button>
    </form>
  );
}
