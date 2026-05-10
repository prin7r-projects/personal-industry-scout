# Express.js app with pnpm workspace (TypeScript @pis/db dependency)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/app/package.json ./apps/app/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/src ./packages/db/src
RUN pnpm install --frozen-lockfile
RUN cd packages/db && npx prisma generate

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/app/ ./apps/app/
USER nodejs
EXPOSE 3001
CMD ["node_modules/.bin/tsx", "apps/app/index.js"]
