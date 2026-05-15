import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/login",
  "/mot-de-passe-oublie",
  "/reset-password",
  "/api/auth",
  "/api/v1",
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
