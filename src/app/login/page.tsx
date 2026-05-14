import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (session) redirect(session.user.role === "CLIENT" ? "/portail" : "/dashboard");
  const params = await searchParams;

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
          <h1 className="text-[20px] font-semibold tracking-tight">Connexion</h1>
          <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
            Accédez à votre espace de gestion.
          </p>

          <div className="mt-6">
            <LoginForm from={params.from} />
          </div>
        </div>

        <div className="mt-5 text-center text-[12px] text-[var(--color-fg-3)]">
          En cas de difficulté, contactez votre administrateur.
        </div>
      </div>
    </div>
  );
}
