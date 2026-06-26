import Link from "next/link";
import {
  ArrowRight,
  Truck,
  Stamp,
  Folder,
  Receipt,
  MessageSquare,
  BadgeCheck,
  Check,
  Mail,
  Clock,
  Users,
} from "lucide-react";
import { LogoFull, LogoMark } from "@/components/brand/logo";

// Vitrine publique « Escale » servie sur l'apex escale.ma (via rewrite du
// middleware). Server Component pur — aucun JS client requis. Réutilise les
// tokens de design de l'app (globals.css : --color-fg, --color-accent…),
// la police Geist et le logo officiel. Bleu nuit #0D1D46 + teal #1EB7AB.

const APP_URL = "https://app.escale.ma";

const TEAL = "#1EB7AB";
const NAVY = "#0D1D46";

const FEATURES = [
  {
    icon: Folder,
    title: "Dossiers de transit",
    desc: "Centralisez chaque dossier de dédouanement : import, export, transit. Suivi du cycle de vie complet, statuts clairs, et historique horodaté de chaque action.",
  },
  {
    icon: Stamp,
    title: "Déclarations en douane (DUM)",
    desc: "Préparez vos Déclarations Uniques de Marchandises avec la codification officielle des régimes douaniers (ADII). Moins de ressaisie, moins d'erreurs.",
  },
  {
    icon: Receipt,
    title: "Facturation conforme TVA Maroc",
    desc: "Émettez vos factures avec TVA et débours, en-tête légal, et suivi des règlements. Une comptabilité de transit propre et auditable.",
  },
  {
    icon: MessageSquare,
    title: "Notifications WhatsApp & e-mail",
    desc: "Tenez vos clients informés automatiquement : demande de documents, avancement du dossier, mainlevée — par e-mail et WhatsApp.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Créez le dossier",
    desc: "Ouvrez un dossier par envoi, rattachez le client et le fournisseur, et réunissez les pièces nécessaires au dédouanement.",
  },
  {
    n: "02",
    title: "Déclarez & documentez",
    desc: "Préparez la DUM, importez les documents douaniers et commerciaux, et faites avancer le dossier au fil des statuts.",
  },
  {
    n: "03",
    title: "Facturez & livrez",
    desc: "Éditez la facture (TVA + débours), notifiez le client à chaque étape, et pilotez la livraison jusqu'à destination.",
  },
] as const;

const PROOF = [
  { icon: BadgeCheck, label: "Hébergé au Maroc, conforme loi 09-08" },
  { icon: Clock, label: "Suivi en temps réel, journal d'audit" },
  { icon: Users, label: "Portail client dédié inclus" },
] as const;

function CTAButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  if (variant === "primary") {
    return (
      <a
        href={href}
        className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] px-5 h-11 text-[14px] font-semibold text-white shadow-[var(--shadow-md)] transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
        style={{ background: NAVY }}
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] px-5 h-11 text-[14px] font-semibold text-[var(--color-fg)] border border-[var(--color-border-2)] bg-[var(--color-surface)] transition-all duration-150 hover:bg-[var(--color-surface-2)] hover:border-[var(--color-fg-mute)] active:scale-[0.98]"
    >
      {children}
    </a>
  );
}

export default function AccueilPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      {/* ─────────── Header ─────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto max-w-[72rem] px-5 sm:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center" aria-label="Escale — accueil">
            <LogoFull className="h-7 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] text-[var(--color-fg-2)]">
            <a href="#fonctionnalites" className="transition-colors hover:text-[var(--color-fg)]">
              Fonctionnalités
            </a>
            <a href="#fonctionnement" className="transition-colors hover:text-[var(--color-fg)]">
              Comment ça marche
            </a>
            <a href="#contact" className="transition-colors hover:text-[var(--color-fg)]">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <a
              href={APP_URL}
              className="hidden sm:inline-flex items-center justify-center h-9 px-4 rounded-[var(--radius)] text-[13px] font-medium text-[var(--color-fg-2)] transition-colors hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
            >
              Connexion
            </a>
            <a
              href={APP_URL}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius)] text-[13px] font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: NAVY }}
            >
              Accéder à l&apos;espace
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─────────── Hero ─────────── */}
        <section className="relative overflow-hidden">
          {/* Décor : dégradés subtils (repris de la page de connexion) */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 760px 460px at 18% -8%, oklch(96% 0.03 258 / 0.7), transparent 62%),
                radial-gradient(ellipse 620px 420px at 92% 4%, color-mix(in oklab, ${TEAL} 12%, transparent), transparent 58%)
              `,
            }}
          />
          <div className="relative mx-auto max-w-[72rem] px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
            <div className="max-w-[46rem]">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] font-medium"
                style={{
                  borderColor: "color-mix(in oklab, " + TEAL + " 35%, transparent)",
                  background: "color-mix(in oklab, " + TEAL + " 9%, transparent)",
                  color: "color-mix(in oklab, " + TEAL + " 78%, black)",
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: TEAL }}
                  aria-hidden
                />
                Logiciel pour transitaires &amp; commissionnaires en douane
              </span>

              <h1 className="mt-6 text-[clamp(2.1rem,5.4vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.022em] text-[var(--color-fg)]">
                Le transit intelligent,
                <br className="hidden sm:block" />{" "}
                <span style={{ color: NAVY }}>du port à la livraison.</span>
              </h1>

              <p className="mt-6 text-[16.5px] leading-relaxed text-[var(--color-fg-2)] max-w-[40rem]">
                <strong className="font-semibold text-[var(--color-fg)]">Escale</strong> réunit vos
                dossiers de dédouanement, vos déclarations DUM, vos documents, votre facturation TVA
                et vos notifications clients dans une seule plateforme claire et conforme. Conçu pour
                les transitaires du Maroc.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <CTAButton href={APP_URL}>
                  Accéder à mon espace
                  <ArrowRight className="size-4" strokeWidth={2} />
                </CTAButton>
                <CTAButton href="#fonctionnalites" variant="ghost">
                  Découvrir les fonctionnalités
                </CTAButton>
              </div>

              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5">
                {PROOF.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 text-[13px] text-[var(--color-fg-3)]"
                  >
                    <Icon className="size-4" strokeWidth={1.75} style={{ color: TEAL }} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─────────── Bandeau « le flux » ─────────── */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="mx-auto max-w-[72rem] px-5 sm:px-8 py-7">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-[13.5px] text-[var(--color-fg-2)]">
              {[
                "Arrivée au port",
                "Dossier",
                "Déclaration DUM",
                "Documents",
                "Mainlevée",
                "Facturation",
                "Livraison",
              ].map((step, i, arr) => (
                <span key={step} className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 font-medium">
                    {i === 0 && (
                      <Truck className="size-4" strokeWidth={1.75} style={{ color: TEAL }} />
                    )}
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <ArrowRight
                      className="size-3.5 text-[var(--color-fg-mute)]"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── Fonctionnalités ─────────── */}
        <section id="fonctionnalites" className="scroll-mt-20">
          <div className="mx-auto max-w-[72rem] px-5 sm:px-8 py-20 sm:py-24">
            <div className="max-w-[42rem]">
              <p
                className="text-[12.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: TEAL }}
              >
                Une plateforme, tout le métier
              </p>
              <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,2.4rem)] font-semibold tracking-[-0.018em] text-[var(--color-fg)]">
                Tout ce dont un transitaire a besoin, au même endroit
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-fg-2)]">
                De l&apos;ouverture du dossier à la facturation finale, Escale couvre chaque étape du
                dédouanement — sans tableur dispersé ni ressaisie.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-[var(--color-border-2)] hover:shadow-[var(--shadow-md)]"
                >
                  <div
                    className="inline-flex size-11 items-center justify-center rounded-[var(--radius-lg)] transition-colors"
                    style={{
                      background: "color-mix(in oklab, " + TEAL + " 12%, transparent)",
                      color: "color-mix(in oklab, " + TEAL + " 72%, black)",
                    }}
                  >
                    <Icon className="size-[22px]" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-[var(--color-fg)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-fg-3)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────── Comment ça marche ─────────── */}
        <section
          id="fonctionnement"
          className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-surface-2)]"
        >
          <div className="mx-auto max-w-[72rem] px-5 sm:px-8 py-20 sm:py-24">
            <div className="max-w-[42rem]">
              <p
                className="text-[12.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: TEAL }}
              >
                Comment ça marche
              </p>
              <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,2.4rem)] font-semibold tracking-[-0.018em] text-[var(--color-fg)]">
                Un dossier, trois étapes claires
              </h2>
            </div>

            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ n, title, desc }) => (
                <li
                  key={n}
                  className="relative rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
                >
                  <span
                    className="text-[13px] font-semibold tnum"
                    style={{ color: TEAL }}
                  >
                    {n}
                  </span>
                  <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.01em] text-[var(--color-fg)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-fg-3)]">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─────────── Bénéfices (liste) ─────────── */}
        <section>
          <div className="mx-auto max-w-[72rem] px-5 sm:px-8 py-20 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <h2 className="text-[clamp(1.7rem,3.6vw,2.4rem)] font-semibold tracking-[-0.018em] text-[var(--color-fg)]">
                  Moins d&apos;allers-retours, plus de visibilité
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-fg-2)]">
                  Vos équipes — exploitation, déclarants, comptabilité — travaillent sur la même
                  source de vérité, avec des droits adaptés à chaque rôle. Vos clients suivent
                  l&apos;avancement de leurs dossiers depuis un portail dédié.
                </p>
                <div className="mt-8">
                  <CTAButton href={APP_URL}>
                    Accéder à l&apos;espace
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </CTAButton>
                </div>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "Statuts de dossier normalisés et traçables",
                  "Régimes douaniers codifiés (ADII)",
                  "Documents centralisés et partagés",
                  "Factures avec TVA et débours",
                  "Notifications e-mail & WhatsApp",
                  "Portail client en lecture",
                  "Gestion des rôles et des accès",
                  "Journal d'audit complet",
                ].map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[13.5px] text-[var(--color-fg-2)] shadow-[var(--shadow-sm)]"
                  >
                    <span
                      className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "color-mix(in oklab, " + TEAL + " 16%, transparent)" }}
                    >
                      <Check
                        className="size-3"
                        strokeWidth={2.5}
                        style={{ color: "color-mix(in oklab, " + TEAL + " 72%, black)" }}
                      />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─────────── CTA final ─────────── */}
        <section id="contact" className="scroll-mt-20">
          <div className="mx-auto max-w-[72rem] px-5 sm:px-8 pb-20 sm:pb-24">
            <div
              className="relative overflow-hidden rounded-[var(--radius-xl)] px-7 py-12 sm:px-12 sm:py-14 text-center"
              style={{ background: NAVY }}
            >
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-90"
                style={{
                  background: `radial-gradient(ellipse 520px 320px at 80% 120%, color-mix(in oklab, ${TEAL} 32%, transparent), transparent 60%)`,
                }}
              />
              <div className="relative mx-auto max-w-[40rem]">
                <LogoMark className="mx-auto size-11" />
                <h2 className="mt-5 text-[clamp(1.6rem,3.4vw,2.2rem)] font-semibold tracking-[-0.018em] text-white">
                  Prêt à digitaliser votre transit ?
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                  Accédez à votre espace Escale, ou écrivez-nous pour une présentation de la
                  plateforme.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={APP_URL}
                    className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] px-5 h-11 text-[14px] font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
                    style={{ background: "white", color: NAVY }}
                  >
                    Accéder à l&apos;espace
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </a>
                  <a
                    href="mailto:youssef.qarri@evead.com"
                    className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] px-5 h-11 text-[14px] font-semibold text-white border border-white/25 transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    <Mail className="size-4" strokeWidth={2} />
                    Nous contacter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─────────── Footer ─────────── */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-[72rem] px-5 sm:px-8 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className="max-w-[22rem]">
              <LogoFull className="h-7 w-auto" />
              <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-fg-3)]">
                Le transit intelligent, du port à la livraison. Le logiciel de gestion des
                transitaires et commissionnaires en douane au Maroc.
              </p>
            </div>

            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[var(--color-fg-mute)]">
                Produit
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px] text-[var(--color-fg-3)]">
                <li>
                  <a href="#fonctionnalites" className="transition-colors hover:text-[var(--color-fg)]">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#fonctionnement" className="transition-colors hover:text-[var(--color-fg)]">
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a href={APP_URL} className="transition-colors hover:text-[var(--color-fg)]">
                    Connexion à l&apos;espace
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[var(--color-fg-mute)]">
                Contact &amp; légal
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px] text-[var(--color-fg-3)]">
                <li>
                  <a
                    href="mailto:youssef.qarri@evead.com"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--color-fg)]"
                  >
                    <Mail className="size-3.5" strokeWidth={1.75} />
                    youssef.qarri@evead.com
                  </a>
                </li>
                <li>
                  <Link href="/confidentialite" className="transition-colors hover:text-[var(--color-fg)]">
                    Confidentialité &amp; données
                  </Link>
                </li>
                <li>
                  <Link href="/conditions" className="transition-colors hover:text-[var(--color-fg)]">
                    Conditions d&apos;utilisation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-[var(--color-fg-mute)] tnum">
              {new Date().getFullYear()} © Escale — Tous droits réservés.
            </p>
            <p className="text-[12px] text-[var(--color-fg-mute)]">
              Édité par <span className="text-[var(--color-fg-3)]">[RAISON SOCIALE DE L&apos;EXPLOITANT]</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
