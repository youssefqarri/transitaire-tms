import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sortie autonome pour l'auto-hébergement (image Docker légère : .next/standalone).
  // Sans effet sur Vercel, qui gère son propre build.
  output: "standalone",
};

export default nextConfig;
