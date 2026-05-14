"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm({ from }: { from?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        toast.error("Identifiants invalides");
        return;
      }
      router.push(from || "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="space-y-2">
        <Label htmlFor="email">Adresse</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@maison-transit.ma"
          autoFocus
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button className="w-full mt-2" disabled={pending} size="lg">
        {pending ? "Vérification…" : "Entrer dans le registre"}
      </Button>
    </form>
  );
}
