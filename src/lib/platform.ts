// Admins PLATEFORME (Evead) = au-dessus des cabinets, seuls habilités à la console
// /admin (créer/suspendre des cabinets). Définis par la variable d'environnement
// ESCALE_PLATFORM_ADMINS (emails séparés par des virgules) — pas de rôle en base
// pour l'instant : c'est un cercle restreint d'exploitants de la plateforme,
// distinct des ADMIN de cabinet.
export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) return false;
  const allow = (process.env.ESCALE_PLATFORM_ADMINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
