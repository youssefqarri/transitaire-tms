import { ResetForm } from "./form";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { LogoFull } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Pré-vérifie que le token existe (n'affiche pas le mail)
  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  const valid = !!vt && vt.expires > new Date();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[380px]">
        <div className="mb-8">
          <LogoFull className="h-9 w-auto" />
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-7">
          {valid ? (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight">
                Nouveau mot de passe
              </h1>
              <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
                Choisissez un nouveau mot de passe (8 caractères minimum).
              </p>
              <div className="mt-6">
                <ResetForm token={token} />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight">Lien invalide</h1>
              <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
                Ce lien est invalide ou a expiré. Demandez un nouveau lien de réinitialisation.
              </p>
              <div className="mt-6">
                <Link
                  href="/mot-de-passe-oublie"
                  className="inline-flex h-9 items-center justify-center w-full bg-[var(--color-fg)] text-[var(--color-surface)] rounded-[var(--radius)] text-[13px] font-medium"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
