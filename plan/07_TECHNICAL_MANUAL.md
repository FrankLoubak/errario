# 📖 MANUAL TÉCNICO - Errário v10

## 1. TECH STACK COMPLETO E JUSTIFICATIVAS

### 1.1 Frontend Stack

#### React 18 + Vite
```
✅ Por quê:
- SSR-ready (Next.js later)
- Hot Module Replacement (desenvolvimento rápido)
- Tree shaking (bundle pequeno)
- Community grande
- TypeScript support

Alternativas rejeitadas:
- Vue: Comunidade menor para SaaS
- Svelte: Menos jobs
```

#### TailwindCSS + shadcn/ui
```
✅ Por quê:
- Utility-first (desenvolvimento rápido)
- Componentes customizáveis
- Dark mode built-in
- File size: 30KB (gzipped)
- Design system pronto

Alternativas:
- Material UI: Muito grande (80KB)
- Bootstrap: Dated design
```

#### Zustand (State Management)
```
✅ Por quê:
- Minimalista (3KB)
- Sem boilerplate (vs Redux)
- TypeScript excelente
- DevTools integration
- Escalável

Alternativas:
- Redux: Overkill para este size
- Context API: Sem DevTools
```

#### React Query (@tanstack/react-query)
```
✅ Por quê:
- Server state management automático
- Caching inteligente
- Background sync
- Offline support ready
- Reduz estado global

Uso:
- useQuery: GET requests
- useMutation: POST/PATCH/DELETE
```

#### Axios
```
✅ Por quê:
- Interceptores automáticos
- Retry logic
- Timeout management
- Request/response transformation

Config:
```javascript
axios.defaults.baseURL = process.env.VITE_API_URL;
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```
```

#### Framer Motion
```
✅ Por quê:
- Animações smooth
- Performance otimizada (GPU)
- Tamanho: 40KB

Uso:
- Transições entre pages
- Card hover effects
- Modal animations
```

#### Recharts
```
✅ Por quê:
- Pizza chart fácil
- Responsive
- Legend interativa
- Tamanho: 60KB

Uso:
- Pizza chart de erros (já implementado)
```

#### Zod + React Hook Form
```
✅ Por quê:
- Type-safe validação
- Error messages customizadas
- Performance (minimal re-renders)
- Integração perfeita

Exemplo:
```javascript
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8)
});

const form = useForm({
  resolver: zodResolver(schema)
});
```
```

---

### 1.2 Backend Stack

#### Node.js 20 LTS + Express
```
✅ Por quê:
- Single language (frontend + backend)
- Eco system enorme
- Escalável com clustering
- Performance excelente para I/O

Alternativas rejeitadas:
- Django: Outro language
- FastAPI: Python (Fase 2 para ML)
- Golang: Menos SaaS tooling
```

#### TypeScript
```
✅ Por quê:
- Type safety reduz bugs 30%
- Better IDE support
- Self-documenting code
- Escalável em equipe

Config:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
```
```

#### Prisma ORM
```
✅ Por quê:
- Query builder type-safe
- Migrations automáticas
- Schema visual
- Performance excelente

Schema example:
```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  notes Note[]
}

model Note {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

Migrations:
npx prisma migrate dev --name add_notes_table
```

#### PostgreSQL
```
✅ Por quê:
- ACID transactions
- JSON support (para tags)
- Full-text search
- Scaling strategies conhecidas
- Backups confiáveis

Config:
```
DATABASE_URL=postgresql://user:password@localhost:5432/errario
```

Índices performance:
```sql
CREATE INDEX idx_note_user_created ON note(user_id, created_at DESC);
CREATE INDEX idx_note_tags ON note USING GIN(tags);
```
```

#### Redis
```
✅ Por quê:
- Session storage
- Cache de queries
- Rate limiting
- Real-time data

Uso:
```javascript
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});

// Cache
await redis.setex('user:' + userId, 3600, JSON.stringify(user));
```
```

#### JWT (jsonwebtoken)
```
✅ Por quê:
- Stateless (escalável)
- Standard (OAuth compatible)
- Seguro (HS256 signing)
- Mobile-friendly

Token structure:
```javascript
{
  sub: userId,           // subject
  email: user.email,
  tier: 'PRO',
  iat: 1234567890,       // issued at
  exp: 1234571490        // expiry (15 min)
}
```
```

#### Passport.js
```
✅ Por quê:
- OAuth2 standardizado
- Estratégias modulares
- Integração fácil com Express
- Segurança testada

Estratégias:
- LocalStrategy (email/password)
- JWTStrategy (token validation)
- GoogleStrategy (OAuth)
```

#### Stripe
```
✅ Por quê:
- Payment processing confiável
- Webhooks robustos
- SaaS features (subscriptions)
- Compliance internacional

Implementação:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  mode: 'payment',
  success_url: 'https://errario.app/success',
  cancel_url: 'https://errario.app/cancel'
});
```

Webhook handling:
```javascript
app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    // Update user credits
  }
});
```
```

#### SendGrid (Email)
```
✅ Por quê:
- Deliverability excelente
- Templates HTML
- Automation sequences
- Analytics

Uso:
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: user.email,
  from: 'noreply@errario.app',
  subject: 'Welcome to Errário',
  html: '<p>Welcome!</p>'
});
```
```

#### Bull (Job Queue)
```
✅ Por quê:
- Background jobs (emails, syncs)
- Retry logic
- Scheduling
- Redis-backed

Uso:
```javascript
const emailQueue = new Queue('email', redisConnection);

emailQueue.add(
  { userId, templateId: 'welcome' },
  { delay: 1000 * 60 * 5 } // 5 min delay
);

emailQueue.process(async (job) => {
  // Send email
});
```
```

#### Helmet (Security)
```
✅ Por quê:
- Security headers automáticos
- Protection contra XSS, clickjacking
- HSTS enabled

Config:
```javascript
app.use(helmet());
// Isso adiciona headers como:
// - Content-Security-Policy
// - X-Frame-Options: DENY
// - Strict-Transport-Security
```
```

#### Winston (Logging)
```
✅ Por quê:
- Structured logging
- Multiple transports (file, console)
- Log levels (error, warn, info, debug)
- JSON format for ELK stack

Config:
```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```
```

#### Sentry (Error Tracking)
```
✅ Por quê:
- Real-time error alerting
- Stack traces capturados
- User context
- Release tracking

Config:
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
});
```
```

---

## 2. ARQUITETURA CAMADAS

### 2.1 Camada de Apresentação (Frontend)
```
Pages (containers)
  ├── Login
  ├── Dashboard
  ├── Pricing
  └── Blog

Components (ui)
  ├── Button
  ├── Modal
  ├── Card
  └── Form

Hooks (custom logic)
  ├── useNotes()
  ├── useAuth()
  └── useApi()

Store (state)
  ├── authStore
  ├── notesStore
  └── uiStore
```

### 2.2 Camada de API (Backend)
```
Routes
  ├── /auth
  ├── /notes
  ├── /planner
  ├── /billing
  └── /integrations

Controllers
  ├── authController
  ├── notesController
  └── stripeController

Services (business logic)
  ├── authService
  ├── notesService
  ├── stripeService
  └── emailService

Middleware
  ├── auth
  ├── validation
  ├── errorHandler
  └── rateLimiter
```

### 2.3 Camada de Dados
```
Database (PostgreSQL)
  ├── User table
  ├── Note table
  ├── PlannerCard table
  └── CreditTransaction table

Cache (Redis)
  ├── Sessions
  ├── User data (5 min TTL)
  └── Query results

Jobs (Bull Queue)
  ├── Email jobs
  ├── Sync jobs
  └── Analytics jobs
```

---

## 3. PADRÕES ARQUITETURAIS

### 3.1 MVC (Model-View-Controller)

**Model**: Prisma schemas
```prisma
model Note {
  id        String @id
  userId    String
  title     String
  // ...
}
```

**View**: React components
```jsx
<NoteCard note={note} />
```

**Controller**: Express routes
```javascript
router.post('/notes', createNote);
```

### 3.2 Service Layer

Separa lógica de negócio:
```javascript
// controller
app.post('/notes', async (req, res) => {
  const note = await notesService.create(req.body);
  res.json(note);
});

// service (onde está a lógica)
async function create(data) {
  // Validar
  // Salvar em DB
  // Enviar email
  // Log
}
```

### 3.3 Dependency Injection

Para testabilidade:
```javascript
class NotesService {
  constructor(private db: Database, private email: EmailService) {}
  
  async create(note) {
    await this.db.notes.create(note);
    await this.email.sendNotification(note);
  }
}
```

---

## 4. FLUXOS DE DADOS

### 4.1 Criação de Nota

```
1. User digita nota no frontend
   ↓
2. Form validation (Zod)
   ↓
3. POST /api/v1/notes (com JWT token)
   ↓
4. Backend middleware: auth check
   ↓
5. Controller: notesController.create()
   ↓
6. Service: notesService.create()
   - Validar dados
   - Salvar em PostgreSQL
   - Invalidar cache Redis
   - Queue email (se PRO)
   ↓
7. Response: { note, success: true }
   ↓
8. Frontend: Update Zustand store
   ↓
9. UI atualiza com nova nota
   ↓
10. WebSocket notificação (real-time)
```

### 4.2 Login Flow

```
1. User submits email + password
   ↓
2. Frontend POST /api/v1/auth/login
   ↓
3. Backend: hash(password) vs stored hash
   ↓
4. Se match: gerar JWT token
   ↓
5. Response: { token, refreshToken, user }
   ↓
6. Frontend: localStorage.setItem('token', token)
   ↓
7. Axios interceptor: add token to every request
   ↓
8. Redirect to /dashboard
```

### 4.3 Pagamento Flow

```
1. User clicks "Upgrade"
   ↓
2. Frontend POST /api/v1/billing/checkout
   ↓
3. Backend: Stripe.sessions.create()
   ↓
4. Response: { checkoutUrl }
   ↓
5. Frontend: redirect(checkoutUrl)
   ↓
6. User paga no Stripe
   ↓
7. Stripe webhook → POST /webhooks/stripe
   ↓
8. Backend: verifica signature
   ↓
9. Update user.tier = PRO
   ↓
10. Send confirmation email
   ↓
11. Frontend: refresh user state
   ↓
12. UI mostra "PRO features unlocked"
```

---

## 5. PERFORMANCE OTIMIZATIONS

### 5.1 Frontend
```
✅ Code splitting (lazy load pages)
✅ Image optimization (Next.js Image later)
✅ Memoization (React.memo para heavy components)
✅ Virtual scrolling (para listas grandes)
✅ Service Workers (offline support)
✅ Gzip compression
✅ CDN for assets
```

### 5.2 Backend
```
✅ Database indexing
✅ Query optimization (select only needed fields)
✅ Caching com Redis (user data, queries)
✅ Connection pooling
✅ Gzip responses
✅ Rate limiting
✅ Async jobs (não bloquear requests)
```

---

## 6. SEGURANÇA CHECKLIST

```
✅ HTTPS everywhere
✅ Rate limiting (100 req/min)
✅ Input validation (Zod)
✅ SQL injection prevention (Prisma)
✅ XSS prevention (Helmet CSP)
✅ CORS configurado
✅ JWT expiry validado
✅ Password hashing (bcrypt)
✅ Secrets em env (não em código)
✅ Sentry monitoring
✅ Regular security audits
```

---

## 7. DEPLOYMENT CHECKLIST

### Pre-launch
```bash
# Testes
npm run test
npm run lint

# Build
npm run build

# Performance
npm run lighthouse
npm run load-test

# Security
npm run security-audit
```

### Deployment
```bash
# Versioning
git tag v0.1.0

# Docker
docker build -t errario:0.1.0 .
docker push registry/errario:0.1.0

# Staging
docker-compose -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 8. TROUBLESHOOTING COMUM

| Problema | Solução |
|----------|---------|
| "JWT expired" | Refresh token automaticamente |
| "DB connection timeout" | Check connection pool, scale replicas |
| "High latency" | Check indexes, add caching |
| "Out of memory" | Increase Node heap, profile leaks |
| "CORS error" | Configure allowed origins |
| "Stripe webhook failing" | Check signing secret, retry logic |

---

## 9. MIGRATIONS DATABASE

### Criar migration
```bash
npx prisma migrate dev --name add_feature

# Isso:
# 1. Gera migration file
# 2. Executa contra dev db
# 3. Gera tipos TypeScript
```

### Deploy migration
```bash
npx prisma migrate deploy
# Usa isso em CI/CD
```

### Rollback (desenvolvimento)
```bash
npx prisma migrate resolve --rolled-back add_feature
```

---

## 10. ENVIRONMENT VARIABLES

### .env.development
```
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/errario_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=dev_secret_change_in_prod
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
SENDGRID_API_KEY=SG.xxx
SENTRY_DSN=
```

### .env.production
```
NODE_ENV=production
DATABASE_URL=[from Hostinger]
REDIS_URL=[from Hostinger Redis]
JWT_SECRET=[strong random 32 chars]
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
GOOGLE_CLIENT_ID=[production]
GOOGLE_CLIENT_SECRET=[production]
SENDGRID_API_KEY=SG.xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

**Manual Técnico: ✅ Completo e Pronto para Uso**

Próximas leituras recomendadas:
1. DEVELOPMENT_PLAN.md (cronograma)
2. CLAUDE_CODE_PROMPTS.md (começar a codificar)
3. MARKETING_PLAN.md (estratégia de crescimento)
