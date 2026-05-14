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
    <div className="min-h-screen flex items-center justify-center px-6 pattern-grid relative">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[oklch(95%_0.05_258)] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="size-14 mx-auto rounded-2xl bg-gradient-to-br from-[oklch(70%_0.18_258)] to-[oklch(55%_0.22_280)] flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-[oklch(60%_0.18_258)]/30 mb-4">
            T
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Transitaire</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Connectez-vous à votre espace
          </p>
        </div>
        <LoginForm from={params.from} />
      </div>
    </div>
  );
}
