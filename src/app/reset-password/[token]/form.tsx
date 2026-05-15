"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("Le mot de passe doit faire 8 caractères minimum");
      return;
    }
    if (pwd !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    start(async () => {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
      router.push("/login");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pwd">Nouveau mot de passe</Label>
        <Input
          id="pwd"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoFocus
          required
          minLength={8}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirmer</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <Button className="w-full" disabled={pending}>
        {pending ? "Enregistrement…" : "Réinitialiser le mot de passe"}
      </Button>
    </form>
  );
}
