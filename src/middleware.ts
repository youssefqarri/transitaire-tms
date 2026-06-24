import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/login",
  "/mot-de-passe-oublie",
  "/reset-password",
  "/confidentialite",
  "/conditions",
  "/api/auth",
  "/api/v1",
  // la route /api/files fait elle-même son auth + contrôle d'accès (ownership clientId) ;
  // l'exclure du middleware évite la redirection HTML qui cassait le téléchargement portail
  "/api/files",
  // sonde de monitoring publique
  "/api/health",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isLoggedIn = !!req.auth;

  if (isPublic) return NextResponse.next();
  if (!isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const role = req.auth?.user?.role;
  if (role === "CLIENT" && !pathname.startsWith("/portail") && !pathname.startsWith("/api/portail")) {
    return NextResponse.redirect(new URL("/portail", req.url));
  }
  if (role && role !== "CLIENT" && pathname.startsWith("/portail")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // COMMIS_DOUANE = consultation seulement, périmètre restreint
  if (role === "COMMIS_DOUANE") {
    const BLOCKED_PREFIXES = [
      "/clients",
      "/fournisseurs",
      "/factures",
      "/emails",
      "/notifications",
      "/utilisateurs",
      "/templates",
      "/audit",
      "/parametres",
    ];
    if (BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // DECLARANT / EXPLOITATION / BUREAU = pas d'accès à la facturation
  if (role && ["DECLARANT", "EXPLOITATION", "BUREAU"].includes(role) && pathname.startsWith("/factures")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // COMPTABILITE = pas d'accès aux notifications
  if (role === "COMPTABILITE" && pathname.startsWith("/notifications")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
