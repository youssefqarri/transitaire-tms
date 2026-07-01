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
  // vitrine publique (apex escale.ma) — accessible sans authentification
  "/accueil",
  "/api/auth",
  "/api/v1",
  // la route /api/files fait elle-même son auth + contrôle d'accès (ownership clientId) ;
  // l'exclure du middleware évite la redirection HTML qui cassait le téléchargement portail
  "/api/files",
  // sonde de monitoring publique
  "/api/health",
  // cron batch (dépassements) : le handler fait lui-même son auth par
  // en-tête x-cron-secret (ou session platform-admin) — l'exclure du middleware
  // évite la redirection login qui empêcherait un appel cron sans cookie
  "/api/cron",
  // PWA : le manifest et le service worker doivent être servis sans authentification
  "/manifest.webmanifest",
  "/sw.js",
];

// Hôtes de l'apex (site vitrine), par opposition à l'application (app.escale.ma).
// Cloudflare proxifie l'apex ET le sous-domaine vers la MÊME app Next sur :80 ;
// on distingue donc les deux par l'en-tête Host. L'app (app.escale.ma) garde son
// comportement d'origine À L'IDENTIQUE — seul l'apex sert la vitrine.
const APEX_HOSTS = new Set(["escale.ma", "www.escale.ma"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Host sans port, insensible à la casse (derrière Cloudflare le Host d'origine
  // est conservé ; on retombe sur nextUrl.host si l'en-tête manque).
  const host = (req.headers.get("host") ?? req.nextUrl.host)
    .split(":")[0]
    .toLowerCase();
  const isApex = APEX_HOSTS.has(host);

  // ── Apex (escale.ma) : on ne sert QUE la vitrine + les pages légales, sans
  //    aucune authentification. La racine est réécrite vers /accueil ; l'app TMS
  //    n'est jamais exposée sur l'apex.
  if (isApex) {
    if (pathname === "/" || pathname === "/accueil") {
      return NextResponse.rewrite(new URL("/accueil", req.url));
    }
    // pages légales (réutilisées telles quelles) + ressources publiques
    if (
      pathname.startsWith("/confidentialite") ||
      pathname.startsWith("/conditions")
    ) {
      return NextResponse.next();
    }
    // toute autre URL sur l'apex renvoie vers la vitrine (pas d'accès TMS ici)
    return NextResponse.rewrite(new URL("/accueil", req.url));
  }

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
