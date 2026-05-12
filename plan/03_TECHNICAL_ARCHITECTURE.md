# 🏗️ TECHNICAL ARCHITECTURE - Errário v10

## 1. ARQUITETURA GERAL

### 1.1 Dois Modos de Operação

```
╔══════════════════════════════════════════════════════════════════╗
║              MODO LOCAL (Free — padrão ao baixar)                ║
╠══════════════════════════════════════════════════════════════════╣
║  React Native App (iOS/Android)                                  ║
║  ├─ SQLite local (expo-sqlite) → fonte de verdade dos dados      ║
║  ├─ Auth API → VPS  ← SEMPRE ONLINE (sem auth, sem app)          ║
║  ├─ Dados ficam no device (não vão ao servidor)                  ║
║  └─ Restrições: 100 notas, ads (AdMob), sem multi-device         ║
╚══════════════════════════════════════════════════════════════════╝
                          │
                          │ Upgrade (IAP ou créditos)
                          ▼
╔══════════════════════════════════════════════════════════════════╗
║              MODO CLOUD (Pro — após compra/assinatura)           ║
╠══════════════════════════════════════════════════════════════════╣
║  React Native App (iOS/Android)                                  ║
║  ├─ Migração única: SQLite → VPS PostgreSQL                      ║
║  ├─ SQLite local → cache offline / write-ahead log               ║
║  ├─ Dados sincronizados com VPS REST API                         ║
║  ├─ Acesso multi-device (web app futuro incluído)                ║
║  └─ Sem restrições, sem ads                                      ║
╚══════════════════════════════════════════════════════════════════╝
```

### 1.2 Arquitetura Completa

```
┌──────────────────────────────────────────────────────────────────┐
│                     MOBILE APP LAYER                             │
│                                                                  │
│  ┌───────────────────────┐   ┌───────────────────────────────┐  │
│  │   FREE USER           │   │   PRO USER                    │  │
│  │   React Native App    │   │   React Native App            │  │
│  │   ─────────────────   │   │   ─────────────────────────   │  │
│  │   SQLite (permanente) │   │   SQLite (cache/offline)      │  │
│  │   Auth → VPS apenas   │   │   REST API → VPS (primário)   │  │
│  └──────────┬────────────┘   └─────────────┬─────────────────┘  │
└─────────────│───────────────────────────────│──────────────────-─┘
              │ Auth (JWT)                    │ HTTPS (dados + auth)
              ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      GATEWAY LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Cloudflare (DDoS, DNS, Caching)                         │   │
│  │  nginx (reverse proxy, SSL termination)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────────┐
│                       API LAYER                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Node.js + Express                                        │   │
│  │  - REST API (/api/v1/*)                                   │   │
│  │  - IAP webhooks (Apple ASSN + Google Pub/Sub)             │   │
│  │  - Migration endpoint (SQLite → PostgreSQL bulk)          │   │
│  │  - MCP client (Notion/Anki/Google) — Fase 2 Pro only      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────┘
                               │
         ┌─────────────────────┼──────────────────────┐
         ▼                     ▼                      ▼
   ┌───────────┐         ┌──────────┐          ┌──────────────┐
   │PostgreSQL │         │  Redis   │          │  External    │
   │(Pro users │         │(Cache &  │          │  Services    │
   │ only)     │         │Sessions) │          │              │
   └───────────┘         └──────────┘          └──────────────┘
                                                      │
                                               ┌──────┴──────────────┐
                                               │ Apple StoreKit 2    │
                                               │ Google Play Billing │
                                               │ AdMob (Free ads)    │
                                               │ Notion/Anki APIs    │
                                               │ SendGrid (email)    │
                                               │ Sentry              │
                                               └─────────────────────┘
```

### 1.3 Fluxo de Upgrade Free → Pro

```
User compra assinatura (IAP)
  ↓
App recebe purchase token (StoreKit/Play Billing)
  ↓
App → POST /api/v1/billing/validate-iap/{platform}
  ↓
Backend valida com Apple/Google API
  ↓
Backend: user.tier = PRO, user.storageMode = CLOUD
  ↓
App inicia migração: POST /api/v1/migrations/from-local
  ↓
Backend insere dados do SQLite no PostgreSQL (idempotente)
  ↓
App confirma: SQLite passa a ser cache (não fonte de verdade)
  ↓
Pro features desbloqueadas + multi-device ativo
```

---

## 2. MOBILE APP STACK (React Native)

### 2.1 Dependencies
```json
{
  "expo": "~51.0.0",
  "expo-sqlite": "^14.0.0",
  "expo-secure-store": "^13.0.0",
  "expo-notifications": "^0.28.0",
  "expo-file-system": "^17.0.0",
  "expo-local-authentication": "^14.0.0",
  "react-native": "0.74.0",
  "react-native-iap": "^12.15.0",
  "react-native-google-mobile-ads": "^13.0.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/native-stack": "^6.9.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^5.0.0",
  "nativewind": "^4.0.0",
  "react-native-svg": "^15.0.0",
  "victory-native": "^40.0.0",
  "zod": "^3.22.0",
  "axios": "^1.5.0",
  "date-fns": "^2.30.0"
}
```

### 2.2 Project Structure
```
errario-mobile/
├── app/                         ← Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── index.tsx            ← Dashboard
│   │   ├── notes.tsx
│   │   ├── planner.tsx
│   │   └── analytics.tsx
│   ├── note/[id].tsx
│   ├── onboarding/
│   │   ├── step1.tsx … step5.tsx
│   └── _layout.tsx
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── features/
│   │   ├── Notes/
│   │   ├── Planner/
│   │   ├── Analytics/           ← victory-native charts
│   │   ├── Auth/
│   │   └── Billing/             ← IAP purchase flow
│   └── ads/
│       └── AdMobBanner.tsx      ← Free tier only
├── db/
│   ├── schema.ts                ← SQLite schema (Free mode)
│   ├── migrations/              ← expo-sqlite migrations
│   └── repositories/           ← DAO pattern: NoteRepo, PlannerRepo
├── hooks/
│   ├── useNotes.ts              ← SQLite ou API dependendo do tier
│   ├── useAuth.ts
│   ├── useStorageMode.ts        ← LOCAL | CLOUD
│   └── usePurchase.ts           ← IAP hooks
├── store/
│   ├── authStore.ts
│   ├── notesStore.ts
│   └── uiStore.ts
├── lib/
│   ├── api.ts                   ← axios instance (Pro users)
│   ├── sqlite.ts                ← expo-sqlite client
│   ├── migration.ts             ← SQLite → API migration logic
│   └── validators.ts
├── types/
│   ├── note.ts
│   ├── user.ts
│   └── api.ts
├── app.json                     ← Expo config (bundle id, permissions)
├── eas.json                     ← EAS Build (iOS/Android CI/CD)
├── tsconfig.json
└── package.json
```

### 2.3 SQLite Schema (Free Mode — dados locais)

```sql
-- Executado na primeira abertura do app via expo-sqlite migrations

CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,   -- UUID gerado no device
  local_id    TEXT UNIQUE,        -- mesmo valor; usado na migração
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  subject     TEXT,
  tags        TEXT DEFAULT '[]',  -- JSON array serializado
  favorite    INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'active', -- active | archived | deleted
  created_at  TEXT NOT NULL,      -- ISO 8601
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planner_cards (
  id           TEXT PRIMARY KEY,
  note_id      TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  assigned_day INTEGER NOT NULL CHECK (assigned_day BETWEEN 0 AND 6),
  completed    INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_dates (
  id       TEXT PRIMARY KEY,
  note_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);
-- meta: schema_version, user_id, storage_mode, migration_done
```

### 2.4 Estratégia de Storage por Tier

```
┌────────────────────────────────────────────────────────┐
│  Operação          │  FREE (Local)   │  PRO (Cloud)    │
├────────────────────────────────────────────────────────┤
│  Create note       │  SQLite INSERT  │  API POST + SQLite cache
│  Read notes        │  SQLite SELECT  │  API GET (AppState refresh)
│  Update note       │  SQLite UPDATE  │  API PATCH + SQLite cache
│  Delete note       │  SQLite UPDATE  │  API DELETE
│  Offline read      │  ✅ sempre      │  ✅ SQLite cache
│  Offline write     │  ✅ SQLite      │  SQLite (sync ao reconectar)
│  Auth              │  API (obrig.)   │  API (obrig.)
│  Multi-device      │  ❌             │  ✅ via PostgreSQL
└────────────────────────────────────────────────────────┘

hook useNotes.ts:
  if (storageMode === 'LOCAL') → db/repositories/NoteRepo (SQLite)
  if (storageMode === 'CLOUD') → lib/api.ts (REST) + SQLite cache
```

---

## 3. BACKEND STACK

### 3.1 Node.js Core
```javascript
// package.json dependencies
{
  "express": "^4.18.2",
  "prisma": "^5.0.0",
  "pg": "^8.10.0",
  "redis": "^4.6.0",
  "jsonwebtoken": "^9.0.2",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.1",
  "passport-google-oauth20": "^2.0.0",
  "stripe": "^14.0.0",
  "nodemailer": "^6.9.0",
  "bull": "^4.11.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.10.0",
  "axios": "^1.5.0",
  "dotenv": "^16.3.1",
  "winston": "^3.10.0",
  "sentry": "^7.0.0"
}
```

### 3.2 Project Structure
```
errario-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── stripe.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── rateLimiter.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── notes.ts
│   │   ├── planner.ts
│   │   ├── billing.ts
│   │   ├── users.ts
│   │   └── integrations.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── notesController.ts
│   │   ├── billingController.ts
│   │   └── stripeController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── notesService.ts
│   │   ├── userService.ts
│   │   ├── stripeService.ts
│   │   ├── emailService.ts
│   │   ├── notionService.ts
│   │   ├── ankiService.ts
│   │   └── googleKeepService.ts
│   ├── jobs/
│   │   ├── emailJobs.ts
│   │   ├── churnAnalysisJobs.ts
│   │   └── syncJobs.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── jwt.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.yml
├── .env.example
└── package.json
```

### 3.3 Prisma Schema
```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  password      String?
  name          String?
  picture       String?
  tier          Tier         @default(FREE)
  storageMode   StorageMode  @default(LOCAL) // ← NOVO: LOCAL ou CLOUD
  credits       Int          @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  lastLoginAt   DateTime?
  upgradedToCloudAt DateTime? // ← NOVO: quando migrou para Pro

  notes          Note[]
  plannerCards   PlannerCard[]
  stripeCustomer String?
  iapGoogleToken String?      // ← NOVO: purchase token Google Play
  iapAppleToken  String?      // ← NOVO: original transaction id Apple

  @@index([email])
}

model Note {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  localId   String?  @unique // ← NOVO: UUID gerado no device (para dedup na migração)
  deviceId  String?          // ← NOVO: de qual device veio (auditoria)
  migratedFromLocal Boolean @default(false) // ← NOVO

  title     String
  body      String
  subject   String
  tags      String[]
  favorite  Boolean  @default(false)
  status    String   @default("active") // ← NOVO: active | archived | deleted

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  reviews   ReviewDate[]

  @@index([userId, createdAt])
  @@index([userId, subject])
  @@index([userId, status])
}

model ReviewDate {
  id      String @id @default(cuid())
  noteId  String
  note    Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)
  dueDate DateTime
  
  @@index([noteId])
}

model PlannerCard {
  id          String  @id @default(cuid())
  userId      String
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  noteId      String
  
  assignedDay Int     // 0-6 (Mon-Sun)
  completed   Boolean @default(false)
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
}

model StripeEvent {
  id        String   @id @default(cuid())
  stripeId  String   @unique
  type      String
  data      Json
  processed Boolean  @default(false)
  
  createdAt DateTime @default(now())
}

model CreditTransaction {
  id        String   @id @default(cuid())
  userId    String
  amount    Int
  type      TransactionType // PURCHASE, USAGE, REFUND
  reference String?  // stripe_payment_id
  
  createdAt DateTime @default(now())
  
  @@index([userId])
}

enum Tier {
  FREE
  PRO
  ENTERPRISE
}

enum StorageMode { // ← NOVO
  LOCAL  // dados apenas no SQLite do device
  CLOUD  // dados sincronizados com VPS PostgreSQL
}

enum TransactionType {
  PURCHASE
  USAGE
  REFUND
}
```

---

## 4. DATABASE DESIGN

### 4.1 PostgreSQL Schema
```sql
-- Users table
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  picture TEXT,
  tier VARCHAR(50) DEFAULT 'FREE',
  credits INTEGER DEFAULT 0,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_tier ON "User"(tier);

-- Notes table
CREATE TABLE "Note" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  subject VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_note_user_created ON "Note"(user_id, created_at DESC);
CREATE INDEX idx_note_subject ON "Note"(user_id, subject);
CREATE INDEX idx_note_tags ON "Note" USING GIN(tags);

-- PlatterCards table
CREATE TABLE "PlannerCard" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES "Note"(id) ON DELETE CASCADE,
  assigned_day INTEGER NOT NULL CHECK (assigned_day >= 0 AND assigned_day <= 6),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_planner_user ON "PlannerCard"(user_id);

-- Credit transactions
CREATE TABLE "CreditTransaction" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id),
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credit_user ON "CreditTransaction"(user_id);

-- Stripe events (webhook logging)
CREATE TABLE "StripeEvent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stripe_processed ON "StripeEvent"(processed);
```

---

## 5. API CONTRACTS

### 5.1 Authentication Endpoints
```
POST /api/v1/auth/register
  Body: { email, password, name }
  Response: { userId, token, refreshToken }

POST /api/v1/auth/login
  Body: { email, password }
  Response: { token, refreshToken, user }

POST /api/v1/auth/google
  Body: { googleToken }
  Response: { token, refreshToken, user }

POST /api/v1/auth/refresh
  Body: { refreshToken }
  Response: { token }

POST /api/v1/auth/logout
  Response: { success: true }
```

### 5.2 Notes Endpoints
```
GET /api/v1/notes
  Query: { limit, offset, subject, tags }
  Response: { notes[], total, hasMore }

GET /api/v1/notes/:id
  Response: { note }

POST /api/v1/notes
  Body: { title, body, subject, tags }
  Response: { note }

PATCH /api/v1/notes/:id
  Body: { title?, body?, tags?, favorite? }
  Response: { note }

DELETE /api/v1/notes/:id
  Response: { success: true }
```

### 5.3 Billing Endpoints
```
GET /api/v1/billing/session
  Response: { customerId, subscription, credits }

POST /api/v1/billing/checkout
  Body: { productId, planId }
  Response: { checkoutUrl }

GET /api/v1/billing/invoices
  Response: { invoices[] }

POST /api/v1/billing/usage
  Body: { creditsUsed }
  Response: { creditsRemaining }
```

### 5.4 Integration Endpoints (Pro only — Fase 2)
```
POST /api/v1/integrations/notion/connect
  Body: { notionToken }
  Response: { connected: true }

POST /api/v1/integrations/notion/sync
  Response: { notesSynced: number }

POST /api/v1/integrations/anki/connect
  Body: { ankiToken }
  Response: { connected: true }

POST /api/v1/integrations/google-keep/connect
  Body: { googleToken }
  Response: { connected: true }
```

### 5.5 Migration Endpoints (Free → Pro upgrade)
```
POST /api/v1/migrations/from-local
  Auth: Bearer token (usuário autenticado)
  Body: {
    notes: [{ localId, title, body, subject, tags, favorite, createdAt, updatedAt }],
    plannerCards: [{ localId, noteLocalId, assignedDay, completed, createdAt }],
    reviewDates: [{ noteLocalId, dueDate }]
  }
  Response: { migrated: number, skipped: number, errors: [] }
  Idempotência: duplicatas detectadas por localId (upsert, não erro)

GET /api/v1/migrations/status
  Response: { migrationDone: bool, migratedAt: datetime, notesCount: number }

DELETE /api/v1/local-data/confirm
  Body: { migrationId }
  Response: { confirmed: true }
  — chamado pelo app após migração bem-sucedida; sinaliza que SQLite local pode ser limpo
```

### 5.6 IAP Validation Endpoints
```
POST /api/v1/billing/validate-iap/google
  Body: { purchaseToken, productId, packageName }
  Response: { valid: bool, expiresAt: datetime }
  — backend valida com Google Play Developer API, ativa Pro

POST /api/v1/billing/validate-iap/apple
  Body: { receiptData, transactionId }
  Response: { valid: bool, expiresAt: datetime }
  — backend valida com App Store Server API v2 (JWS), ativa Pro

POST /api/v1/billing/apple/notifications
  Body: { signedPayload }  ← Apple App Store Server Notifications
  — webhook Apple para renovações, cancelamentos, reembolsos

POST /api/v1/billing/google/notifications
  Body: Google Pub/Sub notification
  — webhook Google para eventos de subscription
```

---

## 6. AUTHENTICATION FLOW

### 6.1 JWT Strategy
```
Access Token (15 min):
{
  sub: userId,
  email: user.email,
  tier: user.tier,
  storageMode: user.storageMode,  // ← NOVO: LOCAL | CLOUD
  iat: timestamp,
  exp: timestamp + 900
}

Refresh Token (30 days):
{
  sub: userId,
  type: "refresh",
  iat: timestamp,
  exp: timestamp + 2592000
}
```

### 6.2 Token Storage Mobile (CRÍTICO)
```
CORRETO (React Native):
  expo-secure-store (SecureStore.setItemAsync)
  → iOS: Keychain Services
  → Android: Android Keystore
  → Criptografado, não acessível a outros apps

ERRADO (não usar em React Native):
  AsyncStorage → não criptografado
  localStorage → não existe em React Native
```

### 6.3 OAuth2 (Google) — Mobile Deep Link
```
1. App: abre WebBrowser.openAuthSessionAsync para /auth/google
2. Backend: redireciona para Google consent screen
3. Google: redireciona para app via deep link (com.errario.app://auth/callback?code=xxx)
4. App: captura o code via Linking.addEventListener
5. App: envia code para POST /api/v1/auth/google/mobile
6. Backend: troca code por Google tokens, busca/cria user
7. Backend: retorna JWT + refresh token
8. App: salva tokens em SecureStore, navega para dashboard
```

### 6.4 Auth sempre obrigatória (Free e Pro)
```
IMPORTANTE: Mesmo usuários Free precisam de conexão para autenticar.
Sem auth, o app não abre (proteção contra uso não rastreado).

Fluxo offline:
- Usuário já autenticado → JWT válido em SecureStore → app abre
- JWT expirado + offline → mostra tela "Sem conexão, tente novamente"
- JWT válido (< 15 min) → app funciona offline normalmente
- Refresh token disponível + online → renova JWT silenciosamente
```

---

## 7. PAYMENT FLOW

### 7.1 In-App Purchase — Mobile (PRIMÁRIO)

> ⚠️ CRÍTICO: Apple proíbe links externos para compra de conteúdo digital no iOS.
> Stripe direto em iOS resulta em **rejeição na App Store**.
> Google Play também exige Play Billing para conteúdo digital.
> IAP é obrigatório para mobile.

```
FLUXO iOS (StoreKit 2) e Android (Google Play Billing):

User toca "Upgrade to Pro"
  ↓
App: react-native-iap.getSubscriptions(['com.errario.pro.monthly'])
  ↓
App: mostra preço localizado (Apple/Google fornecem preço em moeda local)
  ↓
User confirma
  ↓
Sistema operacional: sheet nativo de pagamento (Apple Pay / Google Pay)
  ↓
User autentica (FaceID / TouchID / senha)
  ↓
App recebe: purchaseUpdatedListener
  iOS: { transactionId, receiptData }
  Android: { purchaseToken, productId }
  ↓
App → POST /api/v1/billing/validate-iap/{apple|google}
  ↓
Backend: valida com Apple App Store Server API / Google Play Developer API
  ↓
Backend: user.tier = PRO, user.storageMode = CLOUD
  ↓
Backend: retorna { valid: true, activatedAt }
  ↓
App: inicia migração SQLite → cloud
  ↓
App: desbloqueia features Pro (sem ads, ilimitado, sync)

Taxas das lojas:
  Apple: 30% no primeiro ano, 15% depois
  Google: 15% até $1M/ano, 30% acima
  Preço sugerido: $9.99/mês → receita líquida ~$8.49 (Google) / $6.99 (Apple Y1)
```

### 7.2 Migração de Dados (Free → Pro)
```
Após validação IAP bem-sucedida:

App coleta todos os dados do SQLite local
  ↓
App → POST /api/v1/migrations/from-local
  Body: { notes[], plannerCards[], reviewDates[] }
  ↓
Backend: upsert por localId (idempotente — pode chamar 2x sem duplicar)
  ↓
Backend: retorna { migrated, skipped, errors }
  ↓
App: se migrated > 0 e errors == 0:
  → SQLite passa a ser cache (não mais fonte de verdade)
  → meta.storage_mode = 'CLOUD'
  → App → DELETE /api/v1/local-data/confirm
  ↓
Pro ativo, dados na nuvem
```

### 7.3 Stripe (Web — Futuro)
```
Usado apenas se houver web app companion.
Não deve ser referenciado no iOS por política da Apple.

POST /api/billing/checkout → checkout.stripe.com
Webhook: payment_intent.succeeded → user.tier = PRO
```

### 7.4 Créditos Avulsos
```
Créditos para features específicas (ex: export PDF extra):
- Android: Google Play Billing one-time product
- iOS: StoreKit consumable product
- Preços: $4.99 (50 créditos), $9.99 (150 créditos)
- Backend: CreditTransaction + user.credits += amount
```

---

## 8. SINCRONIZAÇÃO DE DADOS

> ⚠️ WebSocket removido do MVP. Polling contínuo também evitado (drena bateria mobile).

### 8.1 Estratégia por Modo

```
FREE (Local):
  - Sem sincronização com servidor
  - Todas as operações em SQLite local
  - Auth é a única chamada de rede obrigatória

PRO (Cloud):
  - Fonte de verdade: PostgreSQL na VPS
  - SQLite no device = cache + write-ahead log offline
  - Sync ao foreground: AppState.addEventListener('change')
    → quando app volta ao foreground, refetch via React Query
  - Sem polling contínuo (preserva bateria)
```

### 8.2 Offline Pro
```
Pro user fica offline:
  ↓
Writes vão para SQLite (write-ahead log)
  ↓
App mostra "Offline — changes will sync"
  ↓
App volta online (AppState: active)
  ↓
App: POST /api/v1/notes (batch das mudanças pendentes)
  ↓
Se conflito (server tem versão mais recente):
  → Server version wins
  → Notifica user: "Some changes were overwritten by a newer version"
  ↓
SQLite atualizado com versão do servidor
```

### 8.3 Push Notifications
```
Usado para: revisões agendadas (planner), re-engagement
Tecnologia: expo-notifications + FCM (Android) + APNs (iOS)

Fluxo:
  App → solicita permissão de notificação no onboarding (step 5)
  App → registra device token
  Backend: agenda jobs via Bull para enviar notificações
  Servidor → FCM/APNs → device

Tipos:
  - "Revisão agendada: [nota]" (triggered por ReviewDate)
  - "7 dias sem anotações — continue estudando!"
  - "Sua assinatura expira em 3 dias"
```

---

## 9. MONITORING & OBSERVABILITY

### 9.1 Logging
```javascript
// Winston logger
import logger from './utils/logger';

logger.info('User logged in', { userId, timestamp });
logger.error('Payment failed', { error, stripeId });
```

### 9.2 Error Tracking (Sentry)
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
});
```

### 9.3 Performance Monitoring
```
- API endpoint latency
- Database query time
- Frontend Lighthouse
- Core Web Vitals (CLS, LCP, FID)
```

---

## 10. SECURITY CHECKLIST

```
✅ HTTPS everywhere
✅ CORS properly configured
✅ Rate limiting (100 req/min per IP)
✅ Input validation with Zod
✅ SQL injection prevention (Prisma parameterized)
✅ XSS protection (helmet, CSP headers)
✅ CSRF tokens (SameSite cookies)
✅ Password hashing (bcrypt)
✅ Secrets in env variables
✅ JWT expiry validation
✅ 2FA ready (scaffold in place)
✅ Data encryption at rest
✅ Regular backups
✅ Incident response plan
```

---

## 11. SCALING STRATEGY

### Phase 1: MVP (Month 1-3)
```
- Single VPS (2GB RAM, 2 CPU)
- PostgreSQL + Redis on same server
- No caching beyond Redis
```

### Phase 2: Growth (Month 4-6)
```
- 2 API servers (load balanced)
- Separate PostgreSQL server
- Redis cluster
- CDN for static assets
```

### Phase 3: Scale (Month 7-12)
```
- 4+ API servers (auto-scaling)
- PostgreSQL read replicas
- Redis cluster with sharding
- Elasticsearch for search
- Message queue (RabbitMQ)
```

---

**Arquitetura: ✅ Pronta para Implementação**
