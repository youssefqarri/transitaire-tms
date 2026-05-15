import Link from "next/link";
import { ForgotForm } from "./form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="size-9 rounded-[var(--radius)] bg-[var(--color-fg)] flex items-center justify-center text-[var(--color-surface)] text-[14px] font-bold">
            T
          </div>
          <span className="text-[16px] font-semibold tracking-tight">Transitaire</span>
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
