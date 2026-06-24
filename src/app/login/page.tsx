import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LogoFull } from "@/components/brand/logo";
import { Footer } from "@/components/layout/footer";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (session) redirect(session.user.role === "CLIENT" ? "/portail" : "/dashboard");
  const params = await searchParams;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 bg-[var(--color-bg)] overflow-hidden">
      {/* Décor : gradients subtils en arrière-plan */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 600px 400px at 20% 10%, oklch(96% 0.03 258 / 0.6), transparent 60%),
            radial-gradient(ellipse 500px 350px at 80% 90%, oklch(95% 0.04 280 / 0.5), transparent 60%)
          `,
        }}
      />

      <div className="relative w-full max-w-[400px] animate-fade-in">
        {/* Logo + slogan */}
        <div className="mb-8">
          <LogoFull className="h-10 w-auto" />
          <p className="text-[13px] text-[var(--color-fg-3)] mt-2.5">
            Le transit intelligent, du port à la livraison.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-7 shadow-[var(--shadow-lg)]">
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--color-fg)]">
            Bienvenue
          </h1>
          <p className="text-[13px] text-[var(--color-fg-3)] mt-1">
            Connectez-vous à votre espace de gestion.
          </p>

          <div className="mt-6">
            <LoginForm from={params.from} />
          </div>

          <div className="mt-5 text-center">
            <a
              href="/mot-de-passe-oublie"
              className="text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-accent)] underline-offset-4 hover:underline transition-colors"
            >
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        <div className="mt-5 text-center text-[12px] text-[var(--color-fg-mute)]">
          En cas de difficulté, contactez votre administrateur.
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0">
        <Footer />
      </div>
    </div>
  );
}
