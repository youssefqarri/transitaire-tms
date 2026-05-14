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
  const year = new Date().getFullYear();
  const todayFr = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* ── Colonne gauche : éditorial ── */}
      <aside className="relative hidden lg:flex flex-col bg-[var(--color-ink)] text-[var(--color-paper)] overflow-hidden">
        <div className="absolute inset-0 paper-grain opacity-[0.35] mix-blend-soft-light pointer-events-none" />
        <div className="absolute inset-x-10 top-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[oklch(70%_0.04_60)]">
          <span>Maison de Transit</span>
          <span className="tabular">{year} · vol. I</span>
        </div>

        <div className="relative flex-1 flex flex-col justify-center px-16">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[oklch(70%_0.04_60)] mb-6">
            — Registre des dossiers de transit
          </div>
          <h1
            className="font-display text-[78px] leading-[0.92] tracking-[-0.025em]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 400' }}
          >
            Chaque<br />
            <em
              className="not-italic"
              style={{ fontStyle: "italic", fontVariationSettings: '"opsz" 144, "SOFT" 90, "wght" 350' }}
            >
              déclaration
            </em>{" "}
            <br />
            tient sa page.
          </h1>

          <div className="mt-12 max-w-md text-[15px] leading-relaxed text-[oklch(85%_0.02_70)]">
            La plateforme tient à jour l'ensemble des dossiers d'import & export — des
            réceptions de marchandises jusqu'à la levée définitive — et conserve la trace
            de chaque pièce, de chaque DUM, de chaque correspondance.
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
            {[
              { num: "17", lbl: "statuts" },
              { num: "07", lbl: "rôles" },
              { num: "∞", lbl: "dossiers" },
            ].map((s) => (
              <div key={s.lbl} className="border-t border-[oklch(30%_0.02_50)] pt-3">
                <div
                  className="font-display text-[34px] leading-none tnum"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 400' }}
                >
                  {s.num}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[oklch(70%_0.04_60)] mt-1">
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-10 bottom-10 flex items-end justify-between">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[oklch(60%_0.04_60)]">
            Casablanca · Tanger · Agadir
          </div>
          <div className="font-mono text-[10px] tabular tracking-[0.10em] text-[oklch(60%_0.04_60)]">
            {todayFr}
          </div>
        </div>

        {/* sceau */}
        <div className="absolute right-12 top-1/2 -translate-y-24 rotate-12 opacity-30">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="56" stroke="oklch(60% 0.04 60)" strokeWidth="1" />
            <circle cx="60" cy="60" r="48" stroke="oklch(60% 0.04 60)" strokeWidth="1" />
            <text
              x="60"
              y="62"
              textAnchor="middle"
              fontSize="9"
              letterSpacing="2"
              fill="oklch(70% 0.04 60)"
              style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" }}
            >
              Officiel
            </text>
            <path
              d="M30 60 L 90 60 M60 30 L 60 90"
              stroke="oklch(60% 0.04 60)"
              strokeWidth="0.5"
              strokeDasharray="2 3"
            />
          </svg>
        </div>
      </aside>

      {/* ── Colonne droite : formulaire ── */}
      <main className="relative flex flex-col justify-center px-8 sm:px-16 py-16 bg-[var(--color-paper)]">
        <div className="absolute top-10 right-10 lg:hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
          {todayFr}
        </div>

        <div className="max-w-sm w-full mx-auto">
          <div className="label-eyebrow mb-3">— Accès au registre</div>
          <h2
            className="font-display text-[44px] leading-[0.98] tracking-[-0.022em]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 450' }}
          >
            Bienvenue<span className="text-[var(--color-stamp)]">.</span>
          </h2>
          <p className="mt-4 text-[14px] text-[var(--color-ink-mute)] leading-relaxed">
            Renseignez vos identifiants pour accéder à votre espace.
          </p>

          <div className="mt-10">
            <LoginForm from={params.from} />
          </div>

          <div className="mt-12 pt-6 border-t border-[var(--color-rule)] font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
            En cas de difficulté · contactez l'administrateur
          </div>
        </div>
      </main>
    </div>
  );
}
