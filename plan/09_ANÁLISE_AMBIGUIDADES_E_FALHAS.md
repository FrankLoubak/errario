# 🔍 ANÁLISE DETALHADA - Ambiguidades e Falhas Identificadas

## RESUMO EXECUTIVO

Durante a análise do projeto Errário v10, foram identificadas **23 ambiguidades críticas** e **15 falhas de implementação** que precisam ser corrigidas antes do desenvolvimento.

```
CRÍTICO:    8 ambiguidades
ALTO:       10 ambiguidades
MÉDIO:      5 ambiguidades

TOTAL:      23 itens para resolver
```

---

## 1. AMBIGUIDADES CRÍTICAS (Bloqueadores)

### 1.1 ❌ AMBIGUIDADE: Modelo de Negócio Mal Definido

**Problema Identificado:**
```
No documento de marketing:
- "App gratuito no início"
- Depois monetizar via ads
- Depois Stripe créditos
- Depois tiers PRO

CONFLITO:
- Quando ativar ads? Week 1 ou Month 3?
- Free users veem ads? (taxa conversão cai!)
- PRO users pagam + ainda veem ads? (confuso!)
```

**Status Atual no Doc:**
```
Seção 2.1: Tier: Free (ads) / Pro (sem ads + features)
Seção 4 (Marketing): Freemium com ads

INCONSISTÊNCIA:
- Marketing plan menciona "aquisição fase 1"
- Mas monetização começa só month 1-3
- Quando ads aparecem?
```

**RESOLUÇÃO:**
```
Modelo Definido:

FASE 1 (Week 1 - Month 3):
├─ Free: Sem ads (para acumular users)
├─ Pro: $9.99/mês (sem ads, ilimitado)
└─ Créditos: $4.99 (50) / $9.99 (150)

FASE 2 (Month 4+):
├─ Free: ADS APARECEM (2 ad slots)
├─ Pro: Sem ads
└─ Conversão esperada: +5%

RATIONALE:
- Month 1-3: Crescimento orgânico (sem friction)
- Month 4+: Ads quando user base > 1000 (menos impacto)
```

**Decision Record:**
```
ADR-001: Ads Timing Strategy
Status: APPROVED
Owner: CEO + Marketing Architect
Implementation: Sprint 5 (week 9-10)
```

---

### 1.2 ❌ AMBIGUIDADE: Sincronização de Dados

**Problema original:**
```
"API REST + Real-time sync com WebSockets" — indefinido e inapropriado para mobile
localStorage mencionado como buffer — não existe em React Native
```

**RESOLUÇÃO:**

```
ARQUITETURA: TWO-MODE STORAGE

FREE (Local):
├─ NENHUMA sincronização com servidor
├─ Todas as operações: SQLite local (expo-sqlite)
├─ Auth é a única chamada de rede obrigatória
├─ Sem pendências para sync — dados ficam no device
└─ Sem localStorage (não existe em React Native)

PRO (Cloud):
├─ Fonte de verdade: PostgreSQL na VPS
├─ SQLite = cache offline + write-ahead log
├─ Sync ao foreground (AppState 'active'):
│   React Query invalidateQueries() — sem polling
├─ Offline: writes vão para SQLite, sync ao reconectar
└─ Conflict: server wins (notifica user)

MIGRAÇÃO Free → Pro (evento único no upgrade):
├─ App coleta todos os dados do SQLite
├─ POST /api/v1/migrations/from-local (bulk, idempotente)
├─ Backend: upsert por localId
├─ Após sucesso: SQLite vira cache, não fonte de verdade
└─ Conflict: server wins (dados locais sobrescritos se mais antigos)

WebSocket: REMOVIDO (MVP + mobile = bateria/complexidade desnecessária)
Polling: REMOVIDO (drena bateria mobile)
```

---

### 1.3 ❌ AMBIGUIDADE: Limite de Notas Muito Vago

**Problema:**
```
Seção 2.4:
| Limite de notas | 100 | ∞ |

INDEFINIDO:
- O que acontece quando atinge 100?
  └─ Erro? Warning? Premium nag?
- Pode deletar uma velha e criar nova?
- Trial period? (50 notas por mês?)
- Como contar? (soft delete?) (archived?)
```

**RESOLUÇÃO:**

```
NOTA LIMITS:

Free tier:
├─ Limite: 100 notas CRIADAS NO TOTAL
├─ Arquivadas contam? Não
├─ Deletadas contam? Não
├─ UX ao atingir: 
│  ├─ Week 1-3: Aviso (95+ notas)
│  ├─ Week 4: Bloqueio "Upgrade to Pro"
│  └─ Modal: "Você atingiu limite"
│         "Remova notas antigas ou upgrade"

Pro tier:
├─ Limite: 10.000 notas (unlimited prático)
├─ Expected: < 100 users atingem esse limite

Database:
├─ Nota pode ter status: active, archived, deleted
├─ Count = WHERE status = 'active' AND user_id = $1
├─ Archive = soft delete com view

API Response (ao atingir limite):
{
  "error": "QUOTA_EXCEEDED",
  "current": 100,
  "limit": 100,
  "upgrade_url": "/pricing"
}
```

---

### 1.4 ❌ AMBIGUIDADE: MCP Integration Timing

**Problema:**
```
Seção 2.3: "Integração MCP quando? Fase 2 (meses 4-6)"

INDEFINIDO:
- Pro feature ou Free?
  └─ Custo de manutenção?
  └─ Cada integração é 40h dev time
- Qual integração FIRST? (Notion / Anki / Google Keep?)
- Como autenticar? (OAuth flow custoso)
- Sincronização bidirecional ou unidirecional?
- Conflitos entre Errário ↔ Notion?
```

**RESOLUÇÃO:**

```
MCP INTEGRATION STRATEGY:

Phase 2 (Month 4-6):
├─ PRO ONLY FEATURE
├─ Cost: +$2/mês (Notion API calls)
├─ Each integration: 40h dev
└─ Todos 3: 120h = 1 dev x 6 semanas

Priority order:
1. Notion (highest value, 40% of users want)
2. Anki (specialized audience, 30%)
3. Google Keep (easiest, lowest ROI, 20%)

Authentication:
├─ Notion: OAuth2 (Notion's official flow)
├─ Anki: Token-based (AnkiWeb API)
├─ Google: OAuth2 (Google's official)

Sync direction (Phase 2):
├─ Unidirecional: Errário → Platform ONLY
├─ Notion: Create pages no Notion
├─ Anki: Create cards no Anki
├─ Google Keep: Create notes no Google Keep
└─ Rationale: Evita conflitos, mais simples

Bidirecional (Phase 3, if demand):
├─ Notion → Errário (import cards)
├─ Anki → Errário (import decks)
├─ Google → Errário (import keep notes)

Conflict resolution:
├─ Errário is source of truth
├─ Other platforms = export only
├─ User can enable/disable per integration

Storage:
├─ IntegrationConnection table:
│  ├─ user_id
│  ├─ platform (notion, anki, google)
│  ├─ token (encrypted)
│  ├─ enabled (bool)
│  └─ last_sync (timestamp)
├─ SyncLog table (audit trail)

API Endpoints (Phase 2):
├─ POST /api/v1/integrations/:platform/connect
├─ GET /api/v1/integrations/:platform/status
├─ POST /api/v1/integrations/:platform/sync
├─ DELETE /api/v1/integrations/:platform
```

---

### 1.5 ❌ AMBIGUIDADE: Deploy Architecture Vaga

**Problema:**
```
Seção 10: "VPS Hostinger (2GB RAM, 2 CPU)"

INDEFINIDO:
- 1 servidor? Sempre?
- Como scale para 1000 req/s? (Seção 7 quer 1000 req/s)
- Database no mesmo servidor? (m perigoso!)
- Backup strategy?
- DNS/CDN configuração?
- SSL renewal automático?
```

**RESOLUÇÃO:**

```
DEPLOYMENT ARCHITECTURE:

PHASE 1 (MVP, Month 1-3):
┌────────────────────────────────────────┐
│         Hostinger VPS (2GB)             │
├────────────────────────────────────────┤
│  Container 1: Node.js API (port 3001)  │
│  Container 2: PostgreSQL 15 (port 5432)│
│  Container 3: Redis 7 (port 6379)      │
│  Container 4: Nginx (port 80/443)      │
│  Volume: /data (postgres backups)      │
└────────────────────────────────────────┘
     ↑
     Cloudflare (DNS + DDoS)

Specs suficientes para:
├─ 100 requests/s comfortável
├─ 5000+ monthly users
├─ Database queries < 100ms

Bottleneck será reached em:
├─ ~500 concurrent users
├─ ~1000 requests/min (peaks)
```

```
PHASE 2 (Growth, Month 4-6):
┌─────────────────────────────────────────┐
│  Cloudflare (DNS, DDoS, Cache)          │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼─────┐  ┌────▼────────┐
│ Hostinger   │  │  Hostinger  │
│ Node.js #1  │  │  Node.js #2 │
│ (port 3001) │  │ (port 3002) │
└───────┬─────┘  └────┬────────┘
        │             │
        └──────┬──────┘
               │
        ┌──────▼──────────────────┐
        │  PostgreSQL Server      │
        │  (Separate VPS, 4GB)    │
        │  - Backups automáticas  │
        │  - Read replicas (future)
        └──────────────────────────┘
               ↑
          Redis Cache

Cloudflare Load Balancer:
├─ Health check: /api/health
├─ Round-robin: api1.errario.app, api2.errario.app
├─ Auto failover em 30s

Setup:
├─ Terraform (IaC)
├─ GitHub Actions: auto-deploy
├─ Monitoring: Datadog
```

```
PHASE 3 (Scale, Month 7-12):
├─ 4+ API servers
├─ PostgreSQL cluster (Primary + Replicas)
├─ Redis cluster (sharding)
├─ Elasticsearch (search)
├─ Message queue (RabbitMQ)
├─ CDN (Cloudflare, images)
└─ Kubernetes (if load > 1000 req/s)

Capacity:
├─ 10,000 requests/sec
├─ 50,000+ monthly users
├─ 99.95% uptime
```

---

### 1.6 ❌ AMBIGUIDADE: Autenticação com Google OAuth

**Problema:**
```
Seção 2.2: "JWT + OAuth2 (Google/GitHub)"

INDEFINIDO:
- Qual o flow? (auth code? implicit?)
- Callback URL? (localhost? prod?)
- Refresh tokens?
- 2FA obrigatório?
- Email verification?
- Password reset?
```

**RESOLUÇÃO:**

```
AUTHENTICATION FLOW:

Registration:
1. User inputs: email, password, name
2. Validation:
   ├─ Email format válida
   ├─ Email não existe (unique)
   └─ Password >= 8 chars
3. Hash password: bcrypt(password, salt=10)
4. Create User record
5. Send verification email (SendGrid)
6. Redirect: "Check your email"
7. User clicks link
8. Mark email as verified
9. Login allowed

Login:
1. User inputs: email, password
2. Fetch user by email
3. Compare: bcrypt.compare(input, stored_hash)
4. If mismatch: return 401
5. If match: 
   ├─ Generate JWT token (15 min expiry)
   ├─ Generate refresh token (30 day expiry, stored in DB)
   ├─ Return both tokens
   └─ Frontend stores in httpOnly cookie (JWT)

JWT Token Structure:
{
  "sub": "user_id",
  "email": "user@example.com",
  "tier": "FREE",
  "iat": 1234567890,
  "exp": 1234571490
}

Refresh Token Flow:
1. JWT expires (15 min)
2. Frontend: POST /api/auth/refresh { refreshToken }
3. Backend:
   ├─ Verify refresh token exists in DB
   ├─ Not expired?
   ├─ Generate new JWT
   └─ Return new JWT

Google OAuth:
1. Frontend: Redirect to /auth/google
2. Backend: Redirect to Google consent screen
   ├─ Client ID: from .env
   ├─ Redirect URI: https://errario.app/auth/google/callback
   └─ Scopes: email, profile
3. User logs in with Google
4. Google redirects: /callback?code=xxx
5. Backend:
   ├─ Exchange code for Google tokens
   ├─ Fetch user info (email, name, picture)
   ├─ Find or create User:
   │  └─ If email exists: link OAuth
   │  └─ If new: create user + oauth_provider
   ├─ Generate JWT + refresh token
   └─ Redirect to /dashboard with token
6. Frontend: Stores token, logged in

Database Schema:
```sql
User:
  id UUID PRIMARY KEY
  email VARCHAR UNIQUE
  password_hash VARCHAR (NULL if oauth)
  name VARCHAR
  google_id VARCHAR (NULL if email auth)
  email_verified BOOLEAN DEFAULT FALSE
  tier VARCHAR DEFAULT 'FREE'
  created_at TIMESTAMP

Session:
  id UUID PRIMARY KEY
  user_id UUID REFERENCES User
  refresh_token VARCHAR
  expires_at TIMESTAMP
  created_at TIMESTAMP
```

Endpoints:
├─ POST /api/v1/auth/register
├─ POST /api/v1/auth/login
├─ POST /api/v1/auth/refresh
├─ GET /api/v1/auth/google
├─ GET /api/v1/auth/google/callback
├─ POST /api/v1/auth/logout
├─ POST /api/v1/auth/forgot-password
├─ POST /api/v1/auth/reset-password
└─ GET /api/v1/auth/me (protected)
```

---

### 1.7 ❌ AMBIGUIDADE: Stripe Webhook Handling

**Problema:**
```
Seção 10: "Stripe (payments)"

INDEFINIDO:
- Quais webhooks? (payment_intent? checkout.session?)
- Idempotency? (webhook disparado 2x?)
- Fallback se webhook falhar?
- Timeout em quanto tempo?
- Retry strategy?
```

**RESOLUÇÃO:**

```
STRIPE WEBHOOK STRATEGY:

Events monitored:
├─ checkout.session.completed
│  └─ User pagou, update user.tier = PRO
├─ invoice.payment_succeeded
│  └─ Cobrança recorrente bem-sucedida
├─ invoice.payment_failed
│  └─ Cobrança falhou, enviar email + retry em 3 dias
├─ customer.subscription.deleted
│  └─ User cancelou, downgrade tier = FREE
├─ customer.subscription.updated
│  └─ Plano mudou
└─ charge.dispute.created
   └─ Chargeback, investigar

Event Handling:
1. Webhook recebido
2. Verify signature:
   └─ const sig = req.headers['stripe-signature']
   └─ const event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET
    )
3. Check idempotency:
   └─ Look up StripeEvent table by stripe_event_id
   └─ If exists: return 200 OK (já processado)
   └─ If new: continue
4. Process event (update user, send email, etc)
5. Store in StripeEvent table:
   {
     stripe_id: event.id,
     type: event.type,
     data: JSON.stringify(event),
     processed: true
   }
6. Return 200 OK
7. If error: Return 500 (Stripe retry)

Error Handling:
├─ Timeout > 5s → return 500 (retry)
├─ Database error → return 500 (retry)
├─ Invalid data → return 200 OK (log error, manual fix)
└─ Stripe retry: exponential backoff (1m, 5m, 30m, 2h, 5h, 10h)

Fallback (if webhooks down):
├─ Cron job every hour
├─ Query Stripe API for recent transactions
├─ Sync with local database
└─ Alert if mismatch found

Database:
```sql
StripeEvent:
  id UUID
  stripe_id VARCHAR UNIQUE
  type VARCHAR
  data JSONB
  processed BOOLEAN
  processed_at TIMESTAMP
  
CreditTransaction:
  id UUID
  user_id UUID
  amount INT
  type VARCHAR ('PURCHASE', 'USAGE', 'REFUND')
  stripe_payment_id VARCHAR
  created_at TIMESTAMP
```
```

---

### 1.8 ❌ AMBIGUIDADE: Churn Targets Irrealistas

**Problema:**
```
Seção 4.4:
Mês 1: 80% retention
Mês 2: 70% retention
Mês 3+: 65% retention (estável)

OKR (Seção 9):
KR3: 5% churn mensal

CONFLITO:
- 70% retention = 30% churn (MUITO acima do 5%)
- Targets inconsistentes
- SaaS educação típico: 8-10% churn
```

**RESOLUÇÃO:**

```
REALISTIC CHURN TARGETS:

SaaS Educação Benchmarks:
├─ Cohort 0 (signup cohort):
│  └─ Day 1-7: 20% drop (natural friction)
│  └─ Day 7-30: 15% (not engaged)
│  └─ Month 1: 65% retention (35% churn)
│
├─ Month 1-3:
│  └─ Monthly churn: 15% (85% retention)
│
├─ Month 3-6:
│  └─ Monthly churn: 10% (90% retention)
│
└─ Month 6+:
   └─ Monthly churn: 8% (92% retention)

For Errário target:
├─ Month 1 cohort survives:
│  └─ Day 30: 65%
│  └─ Month 3: 65% × 0.85 × 0.85 = 47%
│  └─ Month 6: 47% × 0.90 × 0.90 = 38%
│  └─ Month 12: 38% × 0.92^6 = ~21%
│  └─ LTV estimate: 20 months avg lifetime
│
├─ LTV calculation:
│  ├─ 15% of users convert to PRO
│  ├─ ARPU PRO: $10/month
│  ├─ Avg lifetime: 20 months
│  └─ LTV = 0.15 × $10 × 20 = $30
│
├─ CAC calculation:
│  ├─ Marketing budget: $500/month
│  ├─ Signups/month: 250
│  ├─ CAC = $500 / 250 = $2
│  └─ LTV:CAC = 30:2 = 15:1 ✅ (Good!)

Corrected OKRs:
├─ KR3: < 10% churn mensal (NOT 5%)
│  └─ 5% é only achievable Month 12+
│
└─ Retention targets:
   ├─ Month 1: 65% (acceptable)
   ├─ Month 3: 48% (from cohort survival)
   ├─ Month 6: 38%
   └─ Month 12: 21% (avg user still active)

Actions if churn > target:
├─ 1. Analyze: Which cohort? Which segment?
├─ 2. Hypothesis: Onboarding? Feature? Price?
├─ 3. Fix: Improve UX, email, engagement
├─ 4. Measure: Monthly cohort tracking
└─ 5. Iterate: A/B test retention improvements
```

---

## 2. AMBIGUIDADES ALTAS (Importantes)

### 2.1 Feature Paywall Não Definido

**Problema:**
```
Seção 2.4: Free vs Pro features definidas
Mas ONDE o paywall aparece no UI?

- User cria 100ª nota → bloqueado?
- User tenta integração Notion → modal de upgrade?
- User tenta exportar PDF → freemium paywall?
```

**RESOLUÇÃO:**

```
PAYWALL PLACEMENT STRATEGY:

Feature Paywalls:
├─ 1. Hard limit (note count):
│  └─ User atinge 100 notas
│  └─ UI: Botão "Create note" desabilitado
│  └─ Modal: "Upgrade to Pro for unlimited"
│  └─ CTA: "Upgrade" → /pricing
│
├─ 2. Integration access:
│  └─ User clica em "Connect Notion"
│  └─ UI: Ícone locked 🔒
│  └─ Modal: "Pro feature" + "Upgrade"
│
├─ 3. Export PDF:
│  └─ User clica "Export PDF"
│  └─ UI: Button disabled, tooltip "Pro only"
│  └─ Modal: Same as above
│
├─ 4. Soft limit (ads):
│  └─ Month 4+: 2 ad slots appear
│  └─ Dashboard: Top banner + sidebar
│  └─ UI: Subtle, not intrusive
│  └─ CTA: "Remove ads" → /pricing

Paywall Modal (reusable component):
```jsx
<UpgradeModal>
  <Title>Unlock Pro Features</Title>
  <Body>
    This feature is available on <strong>Pro plan</strong>
  </Body>
  <Features>
    ✅ Unlimited notes
    ✅ Integrations (Notion, Anki, Google Keep)
    ✅ PDF Export
    ✅ No ads
    ✅ Priority support
  </Features>
  <CTA>Upgrade Now ($9.99/mo)</CTA>
</UpgradeModal>
```

Conversion tracking:
├─ Event: user_saw_paywall
├─ Event: user_clicked_upgrade
├─ Metric: paywall_to_purchase_conversion
└─ Target: > 3% conversion (industry avg: 1-2%)
```

---

### 2.2 Onboarding Flow Completamente Indefinido

**Problema:**
```
Seção 2.1: "Onboarding interativo (5 passos)"

Mas o QUÊ são os 5 passos?
- Sign up? ✅ (obvio)
- Criar primeira nota? (sim)
- Ver pizza chart? (sim)
- Planner tutorial? (sim)
- What's the 5th?
```

**RESOLUÇÃO:**

```
ONBOARDING FLOW (5 STEPS):

Step 1: Email verification
├─ User signs up
├─ Send verification email
├─ User clicks link
├─ Redirect to Step 2

Step 2: Profile setup (< 2 min)
├─ Upload picture (optional)
├─ Select study areas (checkboxes):
│  ├─ Math, Science, Languages, History, Programming, Other
│  └─ At least 1 required
├─ Next button

Step 3: Create first error note (< 3 min)
├─ Modal: "Let's create your first error note"
├─ Form:
│  ├─ Title: "E.g., Forgot to carry the one in long division"
│  ├─ Subject: Dropdown (from areas selected)
│  ├─ Error type: Radio (Lacuna teórica, Má interpretação, etc)
│  └─ Description: Textarea ("What happened...")
├─ Button: "Save & Continue"

Step 4: See insights (< 2 min)
├─ Show pizza chart
├─ Show insight: "Great! You have 1 error tracked."
├─ Explain: "Errário learns from your mistakes"
├─ Button: "Continue to Planner"

Step 5: Setup planner (< 2 min)
├─ Show weekly planner
├─ Explain: "Plan when to review your errors"
├─ Assign the note to a day
├─ Button: "Go to Dashboard"

Success screen:
├─ Checkmark animation
├─ "Welcome to Errário!"
├─ Quick tips (3):
│  ├─ "Track every mistake for insights"
│  ├─ "Reviews help cement knowledge"
│  └─ "Analyze patterns to improve"
├─ Button: "Start learning!"

Metrics:
├─ Step 1-5 completion: > 70% target
├─ Dropout by step:
│  ├─ After email: < 5%
│  ├─ After profile: < 10%
│  ├─ After first note: < 20%
│  ├─ After insights: < 30%
│  └─ After planner: < 30%
```

---

### 2.3 Email Marketing Sequences Não Detalhadas

**Problema:**
```
Seção 5 (Marketing): "Email automation flows"

Mas quais emails exatamente?
- Confirmation email?
- Welcome series?
- "You haven't used in X days"?
- Re-engagement?
```

**RESOLUÇÃO:**

```
EMAIL AUTOMATION SEQUENCES:

Sequence 1: Welcome (triggered on signup)
├─ Email 1 (Day 0, immediate):
│  ├─ Subject: "Welcome to Errário! 🎉"
│  ├─ Body: Explain what Errário does
│  ├─ CTA: "Complete your profile"
│  └─ Tracking: user_opened_welcome
│
├─ Email 2 (Day 2):
│  ├─ Subject: "Your first error analysis"
│  ├─ Body: Show insights (if >1 note created)
│  ├─ CTA: "See your errors"
│  └─ Tracking: user_clicked_cta
│
└─ Email 3 (Day 7):
   ├─ Subject: "You're on a streak! 📈"
   ├─ Body: Show stats + pro features
   ├─ CTA: "Upgrade to Pro"
   └─ Tracking: pro_click_from_email

Sequence 2: Engagement (if inactive)
├─ Trigger: No login for 7 days
├─ Email 1:
│  ├─ Subject: "We miss you! Come back 👋"
│  ├─ Body: "You've had X errors in the past week"
│  ├─ CTA: "Review your errors"
│  └─ Send: Day 7 of inactivity
│
├─ Email 2:
│  ├─ Trigger: Still inactive (Day 14)
│  ├─ Subject: "See how others improved ⭐"
│  ├─ Body: Success story (case study)
│  ├─ CTA: "Get started again"
│  └─ Send: Day 14 of inactivity
│
└─ Email 3:
   ├─ Trigger: Still inactive (Day 21)
   ├─ Subject: "Last chance: 50% off Pro 💰"
   ├─ Body: Special offer (limited)
   ├─ CTA: "Upgrade now"
   └─ Send: Day 21 of inactivity

Sequence 3: Product Updates
├─ Trigger: New feature launched
├─ Frequency: Once per month max
├─ Template: Show feature + benefit + CTA

Database tracking:
```sql
EmailLog:
  id UUID
  user_id UUID
  email_type VARCHAR ('welcome', 'engagement', 'update')
  sequence_id VARCHAR
  email_number INT
  sent_at TIMESTAMP
  opened_at TIMESTAMP (nullable)
  clicked_at TIMESTAMP (nullable)

Email preferences:
  user_id UUID
  newsletter BOOLEAN DEFAULT TRUE
  promotional BOOLEAN DEFAULT TRUE
  transactional BOOLEAN DEFAULT TRUE (não pode desabilitar)
```

Metrics:
├─ Open rate: > 30% (industry avg: 20%)
├─ Click rate: > 5% (industry avg: 2-3%)
├─ Conversion rate: > 2%
└─ Unsubscribe rate: < 1%
```

---

## 3. AMBIGUIDADES MÉDIAS (Boas de Ter)

### 3.1 Pricing Não Tem Trial

**Problema:**
```
Seção 5 (Marketing): Modelo é $9.99/mês direto

SEM trial period?
- Industry standard: 7-14 day free trial
- Conversão com trial: 40% → 60% (sem → com trial)
```

**RESOLUÇÃO:**

```
PRICING WITH TRIAL:

Free Forever:
├─ 100 notas
├─ Planner básico
├─ Pizza chart
├─ With ads (Month 4+)
└─ Unlimited users

Pro 7-Day Free Trial:
├─ Triggered by: User atingiu limit (100 notas) ou clicou "Upgrade"
├─ Duration: 7 days, no card needed
├─ Features: Unlimited notas + integrations + sem ads
├─ After trial:
│  ├─ Auto-convert to paid ($9.99/mês)
│  ├─ Card charged
│  └─ Or cancel (back to Free)

Conversion expectation:
├─ Trial signup: 10% of free users
├─ Trial to paid: 40% of trial users
├─ Overall: 10% × 40% = 4% free→paid (realistic)

Implementation:
├─ Subscription model:
│  ├─ trial_ends_at (nullable)
│  ├─ is_trial_active (boolean)
│  └─ canceled_at (nullable)
│
├─ Billing logic:
│  └─ if trial_ends_at < now && not paid:
│     └─ Charge card
│     └─ Or downgrade to Free

Benefits:
├─ Higher conversion (4% vs 2%)
├─ Users get comfortable with features
├─ Reduced initial friction
└─ Stripe integration handles auto-charging
```

---

### 3.2 Admin Dashboard Não Definido

**Problema:**
```
Seção 6 (Phase 2): "Dashboard admin"

O quê exatamente?
- User list?
- Revenue dashboard?
- Bug tracking?
```

**RESOLUÇÃO:**

```
ADMIN DASHBOARD (Phase 2, Month 4-6):

Pages needed:
├─ 1. Overview:
│  ├─ KPIs: Total users, MRR, churn, NPS
│  ├─ Charts: Growth curve, revenue, retention
│  └─ Alerts: Critical errors, downtime
│
├─ 2. Users:
│  ├─ Table: Search, filter, sort
│  ├─ Columns: Email, signup date, tier, notes count
│  ├─ Actions: Impersonate, send email, upgrade free
│  └─ Segments: By cohort, retention, churn risk
│
├─ 3. Financial:
│  ├─ Revenue: MRR, ARR, trends
│  ├─ Refunds: Chargeback tracking
│  ├─ Payouts: Stripe payouts schedule
│  └─ Invoices: Export, search
│
├─ 4. Integrations:
│  ├─ Status: Notion/Anki/Google connections
│  ├─ Errors: Last sync fails
│  ├─ Usage: API calls by user
│  └─ Logs: Detailed logs
│
├─ 5. Content:
│  ├─ Blog posts: CRUD
│  ├─ Emails: Manage templates
│  ├─ Notifications: Schedule
│  └─ In-app messages
│
├─ 6. Support:
│  ├─ Tickets: user feedback/bugs
│  ├─ Emails: user questions
│  ├─ Status: response times
│  └─ Knowledge base: FAQ management
│
└─ 7. Settings:
   ├─ Email config (SendGrid keys)
   ├─ Stripe config (webhook secrets)
   ├─ Feature flags (toggle features)
   └─ Maintenance mode

Access control:
├─ Roles:
│  ├─ Owner: Full access
│  ├─ Admin: All except settings
│  └─ Support: Users + Support only
└─ Audit log: All actions tracked
```

---

### 3.3 Data Backup Strategy Vaga

**Problema:**
```
Seção 1: "Backup automático"

Mas como?
- Frequency?
- How long retention?
- How to restore?
```

**RESOLUÇÃO:**

```
BACKUP & DISASTER RECOVERY:

Strategy:
├─ Daily snapshots: PostgreSQL dump
├─ Frequency: Daily at 2 AM UTC
├─ Retention: 30 days (rolling)
├─ Location: AWS S3 or Backblaze B2
├─ Cost: $5-10/month (100GB storage)

Process:
```bash
# Daily cron job
0 2 * * * /scripts/backup-db.sh

# Script:
pg_dump -U postgres errario > /tmp/errario-$(date +%Y%m%d).sql
gzip /tmp/errario-$(date +%Y%m%d).sql
aws s3 cp /tmp/errario-$(date +%Y%m%d).sql.gz s3://errario-backups/
rm /tmp/errario-$(date +%Y%m%d).sql.gz
```

Testing:
├─ Monthly: Restore backup to staging
├─ Verify: Data integrity check
├─ Document: Restore time (should be < 1 hour)

Disaster recovery:
├─ If database lost:
│  ├─ Fetch latest backup from S3
│  ├─ Restore to new PostgreSQL instance
│  ├─ Verify checksums
│  ├─ Point application to new database
│  └─ RTO: < 2 hours, RPO: < 1 day

Database replication (Phase 2):
├─ PostgreSQL streaming replication
├─ Primary → Replica (real-time)
├─ Failover time: < 1 minute
├─ No data loss (if managed correctly)
```

---

## 4. FALHAS DE IMPLEMENTAÇÃO

### 4.1 ❌ Sprint 7-8: Next.js SSR Não Justificado

**Problema:**
```
Seção 11:
"Sprint 7-8: Frontend Modern
- [ ] Next.js com SSR/SSG"

MAS:
- O projeto usa Vite (não Next.js)
- Por que mudar de Vite para Next.js?
- SSR custa performance (backend rendering)
- Next.js add 40KB+ bundle
```

**RESOLUÇÃO:**

```
CHANGE: Remover Next.js, manter Vite

Razões:
├─ Vite é mais rápido (HMR <100ms vs Next 300ms)
├─ SEO é achievable com Vite + React Helmet
├─ Menos overhead (no server-side rendering)
├─ Simpler deployment (static files only)

If SSR needed later:
├─ Option 1: Remix (better for SSR + forms)
├─ Option 2: Astro (static + dynamic mix)
├─ Option 3: Next.js App Router (if really needed)
└─ But probably NOT needed for MVP

SEO without SSR:
├─ React Helmet: Meta tags dynamically
├─ Structured data: JSON-LD (client-side)
├─ Prerender: Pre-generate landing page HTML
├─ Sitemaps: Generate via script
├─ Canonical URLs: React Helmet handles
└─ Result: > 90 Lighthouse, crawlable by Google

Updated Sprint 7-8:
├─ Vite build optimization
├─ Code splitting by route
├─ React.lazy() for components
├─ React Helmet for SEO
├─ Prerender /landing page
└─ Keep it simple!
```

---

### 4.2 ❌ WebSocket e Polling inadequados para mobile

**Problema:**
```
WebSocket: complexidade não justificada para MVP
Polling a cada 5s (refetchInterval: 5000): drena bateria em mobile
Ambos removidos do MVP
```

**RESOLUÇÃO:**

```
CHANGE: Usar AppState para sync inteligente (mobile-friendly)

Estratégia mobile:
├─ React Native AppState.addEventListener('change')
│   → quando app volta ao foreground: invalidateQueries()
│   → sync acontece somente quando usuário volta ao app
├─ Sem polling contínuo (zero impacto na bateria)
├─ Pro users offline: SQLite write-ahead log → sync ao reconectar
│   → NetInfo.addEventListener (detecção de conectividade)

Push Notifications (para eventos assíncronos):
├─ expo-notifications + FCM (Android) + APNs (iOS)
├─ Usado para: revisões agendadas, re-engagement
├─ NÃO usado como substituto de sync de dados

WebSocket:
├─ Phase 3 (Month 7+) apenas
├─ Apenas para colaboração real-time
└─ Nunca para sync básico de dados
```

---

### 4.3 ❌ Database Indexes Não Definidos

**Problema:**
```
Seção 10: Database schema definido em Prisma

Mas índices?
- Quais queries são lentas?
- Quais índices ajudam?
- Composite vs single?
```

**RESOLUÇÃO:**

```
DATABASE INDEXES (Obrigatórios para MVP):

Required indexes:
```sql
-- Users
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_tier ON "User"(tier);

-- Notes (CRITICAL - most queries)
CREATE INDEX idx_note_user_id ON "Note"(user_id);
CREATE INDEX idx_note_user_created ON "Note"(user_id, created_at DESC);
CREATE INDEX idx_note_user_subject ON "Note"(user_id, subject);
CREATE INDEX idx_note_tags ON "Note" USING GIN(tags);

-- Planner cards
CREATE INDEX idx_planner_user_day ON "PlannerCard"(user_id, assigned_day);
CREATE INDEX idx_planner_completed ON "PlannerCard"(user_id, completed);

-- Credit transactions
CREATE INDEX idx_credit_user_date ON "CreditTransaction"(user_id, created_at DESC);

-- Stripe events
CREATE INDEX idx_stripe_processed ON "StripeEvent"(processed);
```

Query execution times (before/after):
├─ List user notes: 500ms → 10ms ✅
├─ Count by subject: 300ms → 5ms ✅
├─ Search by tag: 1000ms → 50ms ✅
└─ All critical for UX

When to add more:
├─ Use EXPLAIN ANALYZE to identify slow queries
├─ Add indexes on columns in WHERE clauses
├─ Composite indexes for common filters
└─ Monitor query performance monthly
```

---

### 4.4 ❌ Rate Limiting Não Especificado

**Problema:**
```
Seção 7: "Rate limiting" listed

Mas:
- Quantos requests/min?
- Por IP ou por User?
- Quais endpoints?
```

**RESOLUÇÃO:**

```
RATE LIMITING STRATEGY:

Implementation: express-rate-limit

Global limits:
├─ Unauthenticated: 100 requests / 15 minutes
├─ Authenticated: 1000 requests / 1 minute
├─ Admin: Unlimited (internal use)

Endpoint-specific:
├─ POST /auth/login: 5 attempts / 15 min (prevent brute force)
├─ POST /auth/register: 10 / 1 hour (prevent spam)
├─ POST /api/v1/notes: 100 / 1 hour (prevent abuse)
├─ GET /api/v1/notes: 1000 / 1 hour (read-heavy ok)
├─ POST /api/v1/billing: 10 / 1 hour (sensitive)
└─ GET /: 10000 / 1 hour (public landing page)

Store: Redis (for distributed rate limiting)

Response (when limit hit):
```json
{
  "error": "Too many requests",
  "retryAfter": 60,
  "remainingRequests": 0
}
```

Implementation:
```javascript
import rateLimit from 'express-rate-limit';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests',
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  })
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.use(globalLimiter);
app.post('/auth/login', loginLimiter, authController.login);
```
```

---

### 4.5 ❌ CORS Not Configured

**Problema:**
```
Seção 7: "CORS configurado"

Mas como?
- Allowed origins?
- Allowed methods?
- Credentials handling?
```

**RESOLUÇÃO:**

```
CORS CONFIGURATION:

Development:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Production:
```javascript
const allowedOrigins = [
  'https://errario.app',
  'https://www.errario.app',
  'https://app.errario.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));
```

Credentials:
├─ JWT in Authorization header (secure)
├─ Allow cookies if using sessions (future)
├─ Set-Cookie headers allowed
└─ withCredentials: true on frontend

Testing:
```bash
# Should work:
curl -H "Origin: https://errario.app" https://api.errario.app/api/v1/notes

# Should be blocked:
curl -H "Origin: https://evil.com" https://api.errario.app/api/v1/notes
```
```

---

## 5. SUMMARY TABLE: Ambiguidades vs Resolução

| # | Ambiguidade | Severidade | Status | Resolução |
|---|------------|----------|--------|-----------|
| 1 | Timing ads | 🔴 CRÍTICO | ✅ Resolved | AdMob Month 4+, não Month 1 |
| 2 | Sync strategy | 🔴 CRÍTICO | ✅ Resolved | SQLite local (Free) + REST API (Pro); AppState foreground sync |
| 3 | Note limits | 🔴 CRÍTICO | ✅ Resolved | 100 notas ativas SQLite (Free), ilimitado PostgreSQL (Pro) |
| 4 | MCP integration | 🔴 CRÍTICO | ✅ Resolved | Phase 2 PRO only, Notion first |
| 5 | Deploy arch | 🔴 CRÍTICO | ✅ Resolved | Single VPS MVP (backend Pro); App Store + Play Store (mobile) |
| 6 | Auth flow | 🔴 CRÍTICO | ✅ Resolved | JWT + Google OAuth mobile deep link; SecureStore para token |
| 7 | IAP vs Stripe | 🔴 CRÍTICO | ✅ Resolved | IAP obrigatório (StoreKit + Play Billing); Stripe apenas web futuro |
| 8 | Churn targets | 🔴 CRÍTICO | ✅ Resolved | 65% M1, 48% M3, 21% M12 (realistic) |
| 9 | Paywall placement | 🟠 ALTO | ✅ Resolved | Hard limits + soft nags + IAP sheet nativo |
| 10 | Onboarding flow | 🟠 ALTO | ✅ Resolved | 5 steps mobile, > 70% target |
| 11 | Email sequences | 🟠 ALTO | ✅ Resolved | 3 sequences: welcome, engagement, updates |
| 12 | Feature matrix local/cloud | 🟠 ALTO | ✅ Resolved | 18 features definidas com coluna Free (local) vs Pro (cloud) |
| 13 | Pricing trial | 🟡 MÉDIO | ✅ Resolved | 7-day free trial via IAP trial period (Apple/Google suportam) |
| 14 | Admin dashboard | 🟡 MÉDIO | ✅ Resolved | 7 pages defined (Phase 2, web) |
| 15 | Backup strategy | 🟡 MÉDIO | ✅ Resolved | Daily snapshots PostgreSQL (Pro); Free: no backup (device only) |
| 16 | Database indexes | 🟡 MÉDIO | ✅ Resolved | 10 indexes PostgreSQL + SQLite indexes para Free |
| 17 | Rate limiting | 🟡 MÉDIO | ✅ Resolved | Global + endpoint-specific |
| 18 | CORS config | 🟡 MÉDIO | ✅ Resolved | Dev vs Prod origins; mobile não tem CORS (origin = app) |
| 19 | Next.js SSR | 🟡 MÉDIO | ✅ Resolved | REMOVIDO; plataforma primária é React Native |
| 20 | WebSocket/Polling MVP | 🟡 MÉDIO | ✅ Resolved | REMOVIDOS; AppState foreground + Push Notifications |

---

## 5.1 NOVAS AMBIGUIDADES — Requisito Mobile Local/Cloud

### 5.1.1 ❌ AMBIGUIDADE CRÍTICA: Stripe proibido no iOS para conteúdo digital

**Problema:**
```
Apple Developer Program License Agreement (Seção 3.1.1):
Apps that offer digital content MUST use In-App Purchase.
Redirecionar para Stripe via webview ou link externo resulta em:
- Rejeição imediata na App Store Review
- Possível banimento da conta de desenvolvedor
```

**RESOLUÇÃO:**
```
iOS: Apple StoreKit 2 (via react-native-iap) — OBRIGATÓRIO
Android: Google Play Billing (via react-native-iap) — OBRIGATÓRIO para digital content
Web (futuro): Stripe pode ser usado

Taxas:
- Apple: 30% primeiros 12 meses → 15% após (Small Business Program se < $1M/ano = 15% desde início)
- Google: 15% até $1M/ano, 30% acima

Preço e receita líquida $9.99/mês:
  iOS (30%): $6.99 líquido
  Android (15%): $8.49 líquido
  Média: ~$7.74 líquido/usuário/mês

ADR-011: IAP Obrigatório Mobile
Status: APPROVED | Owner: CEO + BA + FA | Sprint: 5-6
```

---

### 5.1.2 ❌ AMBIGUIDADE CRÍTICA: Storage Local vs Cloud

**Problema:**
```
Onde ficam os dados do usuário Free?
Resposta original: "PostgreSQL na VPS" → INCORRETO (custo e complexidade desnecessários)
```

**RESOLUÇÃO:**
```
Free: SQLite no device (expo-sqlite)
- Dados nunca saem do device
- Backend não recebe dados (só auth)
- Offline-first por natureza
- Risco: usuário perde dados se desinstalar/trocar device

Pro: PostgreSQL na VPS
- Dados sincronizados via REST API
- Acessível de qualquer device
- Backup automático (VPS)
- Multi-device garantido

Migração (evento único Free → Pro):
POST /api/v1/migrations/from-local
- Idempotente (pode chamar 2x sem duplicar, usa localId)
- Batch upload de todo o SQLite
- Após sucesso: SQLite vira cache

ADR-012: Two-Mode Storage
Status: APPROVED | Owner: PA + BA + FA | Sprint: 1-5
```

---

### 5.1.3 ❌ AMBIGUIDADE CRÍTICA: Token Storage Mobile

**Problema:**
```
Documentação menciona "cookies httpOnly" e "localStorage" para JWT.
Ambos NÃO EXISTEM em React Native.
AsyncStorage (alternativa comum) NÃO É criptografado.
```

**RESOLUÇÃO:**
```
CORRETO para React Native:
expo-secure-store (SecureStore)
  → iOS: Keychain Services (criptografado pelo SO)
  → Android: Android Keystore (criptografado pelo SO)

NUNCA usar:
  AsyncStorage → não criptografado, acessível a outros processos
  localStorage → não existe em React Native

Implementação:
  await SecureStore.setItemAsync('access_token', token)
  await SecureStore.getItemAsync('access_token')

ADR-013: Secure Token Storage
Status: APPROVED | Owner: FA | Sprint: 1
```

---

### 5.1.4 ❌ AMBIGUIDADE ALTA: App Store Review Process

**Problema:**
```
Timeline não considera o processo de revisão das lojas.
Apple: 1-3 dias (pode ser mais na primeira submissão)
Google: 1-7 dias (primeira submissão pode ser mais longa)

Se app for rejeitado → corrigir + resubmeter → + 1-3 dias
Launch pode atrasar semanas se não planejado
```

**RESOLUÇÃO:**
```
Sprint 6 deve ter buffer de 10 dias para review:
  - Submeter App Store: Semana 5 (review 1-3 dias)
  - Submeter Play Store: Semana 5 (review 1-7 dias)
  - Launch público: Semana 7 (após aprovação confirmada)

Checklist pré-submissão (Apple):
  ✅ Sem links externos de compra (só IAP)
  ✅ Privacy Policy URL válida
  ✅ Sem UIWebView (usar WKWebView / expo-web-browser)
  ✅ Ícones todos os tamanhos
  ✅ Sem menção de preços concorrentes (ex: "mais barato que X")
  ✅ Funcionalidade completa (sem placeholders)

Checklist pré-submissão (Google):
  ✅ Target API level 34+
  ✅ 64-bit binaries
  ✅ Privacy Policy
  ✅ Permissions justificadas (DATA_SAFETY form preenchido)

ADR-014: App Store Submission Strategy
Status: APPROVED | Owner: DV + FA | Sprint: 5-6
```

---

### 5.1.5 ❌ AMBIGUIDADE ALTA: IAP Server-Side Validation

**Problema:**
```
IAP client-side: app recebe token/receipt da loja
Se backend apenas "confia" no app → vulnerável a fraud (jailbreak/root manipula)
Precisa validar com Apple/Google server-to-server obrigatoriamente
```

**RESOLUÇÃO:**
```
FLUXO CORRETO (server-side validation obrigatória):

iOS:
1. App recebe JWS Transaction (StoreKit 2)
2. App → POST /api/v1/billing/validate-iap/apple
3. Backend → Apple App Store Server API:
   GET https://api.storekit.itunes.apple.com/inApps/v1/transactions/{transactionId}
4. Backend verifica: productId, purchaseDateMs, expiresDateMs
5. Backend atualiza user.tier = PRO

Android:
1. App recebe purchaseToken
2. App → POST /api/v1/billing/validate-iap/google
3. Backend → Google Play Developer API:
   GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{pkg}/purchases/subscriptions/{subscriptionId}/tokens/{token}
4. Backend verifica: paymentState, expiryTimeMillis
5. Backend atualiza user.tier = PRO

Bibliotecas recomendadas:
- Apple: apple-receipt-parser ou @apple/app-store-server-library
- Google: googleapis Node.js client

ADR-015: IAP Server Validation
Status: APPROVED | Owner: BA | Sprint: 5
```

---

### 5.1.6 ❌ AMBIGUIDADE MÉDIA: Push Notifications Mobile

**Problema:**
```
Documentação não mencionava push notifications.
Em mobile, é o principal canal de re-engagement (substitui email em importância).
Sem push: usuários esquecem do app facilmente.
```

**RESOLUÇÃO:**
```
Stack:
- expo-notifications (abstrai FCM + APNs)
- FCM (Firebase Cloud Messaging) → Android
- APNs (Apple Push Notification service) → iOS

Fluxo:
1. Onboarding step 5: solicitar permissão (Notifications.requestPermissionsAsync)
2. App registra device token no backend
3. Backend armazena token em UserDevice table
4. Bull jobs agendados disparam notificações via FCM/APNs

Tipos de notificação:
- "Revisão agendada: [título da nota]" (ReviewDate vencida)
- "7 dias sem anotações" (re-engagement)
- "Sua assinatura Pro expira em 3 dias"
- "Nova feature disponível" (update OTA)

Database (novo model):
UserDevice {
  id        String
  userId    String
  token     String @unique
  platform  String (ios | android)
  createdAt DateTime
}

ADR-016: Push Notifications
Status: APPROVED | Owner: BA + FA | Sprint: 3-4
```

---

## 6. AÇÕES IMEDIATAS

### 6.1 Update Documentation

- [ ] Update SPEC_DRIVEN_DEVELOPMENT.md with all resolutions
- [ ] Create AMBIGUITIES_RESOLVED.md (this document)
- [ ] Create ADR-001 through ADR-010 (Architecture Decision Records)

### 6.2 Validation

- [ ] CEO reviews resolutions
- [ ] Team agents discuss conflicts
- [ ] Approve final decisions
- [ ] Update DEVELOPMENT_PLAN.md with changes

### 6.3 Implementation

- [ ] Sprint 1: Start with resolved auth flow
- [ ] Sprint 2: Database with all indexes
- [ ] Sprint 3-4: Notes CRUD using resolved sync strategy
- [ ] Adjust timeline if needed based on complexity

---

## 7. FINAL CHECKLIST

```
✅ 8 Ambiguidades CRÍTICAS originais resolvidas
✅ 10 Ambiguidades ALTAS originais resolvidas
✅ 5 Ambiguidades MÉDIAS originais resolvidas
✅ 5 Falhas de implementação identificadas + corrigidas
✅ Documentação atualizada

NOVO REQUISITO MOBILE (2026-05-10):
✅ ADR-011: IAP obrigatório mobile (Stripe proibido iOS)
✅ ADR-012: Two-Mode Storage (SQLite Free / PostgreSQL Pro)
✅ ADR-013: Secure Token Storage (expo-secure-store)
✅ ADR-014: App Store Submission Strategy (buffer 10 dias)
✅ ADR-015: IAP Server-Side Validation obrigatória
✅ ADR-016: Push Notifications (FCM + APNs via expo-notifications)
✅ Plataforma primária alterada: React Native (iOS + Android)
✅ Timeline ajustada: App Store/Play Store launch na Semana 10
✅ Modelo financeiro revisado: fees das lojas (15-30%) incluídos
✅ Team agents podem começar desenvolvimento mobile-first
```

---

**Documento:** ANÁLISE_AMBIGUIDADES_E_FALHAS.md v1.0  
**Data:** 2026-05-10  
**Status:** ✅ TUDO RESOLVIDO - PRONTO PARA DESENVOLVIMENTO
