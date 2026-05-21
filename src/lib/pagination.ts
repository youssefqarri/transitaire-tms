/**
 * Helper pour parser page + size depuis searchParams (Next.js).
 * Utilisable côté serveur (pas de "use client").
 */
export function parsePagination(
  params: { page?: string; size?: string },
  defaults: { page?: number; size?: number; maxSize?: number } = {},
) {
  const page = Math.max(1, Number(params.page) || defaults.page || 1);
  const requested = Number(params.size) || defaults.size || 25;
  const size = Math.min(Math.max(1, requested), defaults.maxSize ?? 200);
  return { page, size, skip: (page - 1) * size };
}
