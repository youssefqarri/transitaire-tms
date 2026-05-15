"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("Le nouveau mot de passe doit faire 8 caractères minimum");
      return;
    }
    if (next !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    start(async () => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success("Mot de passe mis à jour");
      setCurrent("");
      setNext("");
      setConfirm("");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="cur">Mot de passe actuel</Label>
        <Input
          id="cur"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new">Nouveau mot de passe</Label>
        <Input
          id="new"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="conf">Confirmer</Label>
        <Input
          id="conf"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="flex justify-end pt-2">
        <Button disabled={pending}>{pending ? "Enregistrement…" : "Changer"}</Button>
      </div>
    </form>
  );
}
