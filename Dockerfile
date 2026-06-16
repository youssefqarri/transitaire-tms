# syntax=docker/dockerfile:1
# Image de production pour auto-hébergement (hors Vercel).
# Next.js 16 en sortie "standalone" + Prisma 7 (adapter pg). Base Debian slim
# (compatible Prisma, et nécessaire si on active plus tard le PDF serveur/Chromium).

# ---- deps : dépendances de build (avec devDeps) ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ---- builder : build Next (génère .next/standalone) ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `pnpm build` = prisma generate && next build (pas besoin de la DB pour generate)
RUN pnpm build

# ---- runner : image finale légère ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Sortie standalone : serveur minimal + node_modules strictement nécessaires
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
# Les migrations sont jouées à part (voir docker-compose.prod.yml / SELF-HOSTING.md),
# pas au démarrage du serveur applicatif.
CMD ["node", "server.js"]
