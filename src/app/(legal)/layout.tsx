import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoFull } from "@/components/brand/logo";
import { Footer } from "@/components/layout/footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <LogoFull className="h-8 w-auto" />
          </Link>
          <Link
            href="/login"
            className="text-[13px] text-[var(--color-fg-3)] hover:text-[var(--color-fg)] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={2} /> Retour
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}
