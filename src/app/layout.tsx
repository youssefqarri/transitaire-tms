import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ProgressBar } from "@/components/progress-bar";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Escale — le transit intelligent, du port à la livraison",
    template: "%s • Escale — le transit intelligent, du port à la livraison",
  },
  description: "Escale — le transit intelligent, du port à la livraison.",
  applicationName: "Escale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <ProgressBar />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "var(--radius)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
