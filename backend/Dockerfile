# ─── Estágio 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Prisma exige OpenSSL — Alpine não instala por padrão
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npm install --only=development && \
    npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# ─── Estágio 2: Produção ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Prisma exige OpenSSL em runtime também
RUN apk add --no-cache openssl libc6-compat && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 errario

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

USER errario

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/server.js"]
