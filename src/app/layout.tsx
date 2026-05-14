import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});

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
  title: "Transitaire — Registre des dossiers de transit",
  description: "Plateforme de gestion des dossiers de transit douanier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
