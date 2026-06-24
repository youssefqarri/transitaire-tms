import Link from "next/link";
import { ForgotForm } from "./form";
import { LogoFull } from "@/components/brand/logo";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[380px]">
        <div className="mb-8">
          <LogoFull className="h-9 w-auto" />
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-7">
          <h1 className="text-[20px] font-semibold tracking-tight">Mot de passe oublié</h1>
          <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
            Entrez votre adresse email. Si un compte existe, nous vous enverrons un lien de
            réinitialisation valide pendant 1 heure.
          </p>
          <div className="mt-6">
            <ForgotForm />
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)]"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
