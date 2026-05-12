# 📅 DEVELOPMENT PLAN - Errário v10

## 1. ROADMAP GERAL (12 MESES)

```
Mês 1-3: MVP Mobile + Backend
├─ React Native app (iOS + Android) ← plataforma primária
├─ SQLite local (Free tier)
├─ Backend + PostgreSQL (Pro tier)
├─ Auth JWT + Google OAuth (mobile)
├─ IAP: Google Play Billing + Apple StoreKit 2
├─ Migração SQLite → Cloud (upgrade flow)
├─ App Store + Play Store submission
└─ Deploy Hostinger (backend)

Mês 4-6: Growth & Integrations
├─ MCP (Notion, Anki, Google Keep) — Pro only
├─ AdMob ativado (Free tier)
├─ Web app companion (React + Vite) — Pro acesso via browser
├─ Analytics avançado + Admin dashboard
└─ Community building

Mês 7-9: Scale & Features
├─ Colaboração real-time
├─ AI recommendations
├─ Gamificação completa
├─ OTA updates (Expo Updates)
└─ Enterprise features

Mês 10-12: Consolidação
├─ 10k usuários
├─ $5k MRR (receita líquida após fees das lojas)
├─ Churn < 5%
├─ NPS > 50
└─ Series A ready
```

---

## 2. SPRINTS DETALHADOS (3 MESES MVP)

### SPRINT 1-2: Infraestrutura & Auth (Semanas 1-2)

#### Sprint 1.1 (Semana 1)

**Objetivos:**
- Setup monorepo
- Configurar VPS Hostinger
- Database ready
- Auth scaffold

**Tarefas PA (Product Architect):**
- [ ] Definir database schema completo
- [ ] Documentar API contracts (Auth endpoints)
- [ ] ADR (Architecture Decision Records) para JWT vs Sessions
- [ ] Tech spec: Authentication flow

**Tarefas BA (Backend Architect):**
- [ ] Setup Node.js + Express boilerplate
- [ ] Configurar PostgreSQL + Prisma
- [ ] Implementar JWT authentication
- [ ] Password hashing com bcrypt
- [ ] Auth routes: register, login, refresh
- [ ] Docker compose setup (app + db + redis)

**Tarefas FA (Frontend/Mobile Architect):**
- [ ] Setup Expo + React Native (bare workflow)
- [ ] NativeWind + React Navigation
- [ ] Zustand store + React Query setup
- [ ] Login/Signup screens (React Native)
- [ ] expo-sqlite: schema inicial + migrações
- [ ] expo-secure-store: JWT storage
- [ ] EAS Build configurado (iOS + Android)

**Tarefas SA (SEO/ASO Architect):**
- [ ] Register domain (para backend e web futuro)
- [ ] Configure DNS com Cloudflare
- [ ] App Store Connect account setup
- [ ] Google Play Console account setup
- [ ] Bundle ID definido: com.errario.app

**Tarefas MK (Marketing Architect):**
- [ ] App Store listing copy (PT-BR)
- [ ] Play Store listing copy (PT-BR)
- [ ] Screenshots e ícones (1024x1024 + variações)
- [ ] Waitlist setup (Typeform)

**Tarefas DV (DevOps Architect):**
- [ ] Hostinger VPS provisioning
- [ ] Ubuntu 22.04 + Docker + Docker Compose
- [ ] SSL via Let's Encrypt (para API backend)
- [ ] GitHub Actions: CI/CD backend + EAS Build trigger
- [ ] Signing certificates iOS + Android keystore

**Entregas:**
```
├── React Native app rodando no simulador iOS e Android
├── SQLite schema criado e funcional
├── Backend API rodando (auth endpoints)
├── JWT funcionando (login/register mobile)
├── EAS Build pipeline configurado
└── App Store Connect + Play Console configurados
```

**Review & Metrics:**
- [ ] Auth API tests passing
- [ ] Latency < 200ms
- [ ] VPS uptime checked

---

#### Sprint 1.2 (Semana 2)

**Objetivos:**
- OAuth Google implementado
- Rate limiting
- Error handling robusto
- Deployment staging

**Tarefas BA:**
- [ ] Google OAuth (mobile deep link callback)
- [ ] Rate limiting (express-rate-limit)
- [ ] Comprehensive error handling + Sentry
- [ ] Email service (SendGrid) scaffold
- [ ] Unit tests para auth

**Tarefas FA:**
- [ ] Google OAuth mobile: WebBrowser.openAuthSessionAsync
- [ ] Deep link handler (com.errario.app://auth/callback)
- [ ] Error state screens
- [ ] Loading states + skeleton screens
- [ ] Dark mode (Appearance API React Native)

**Tarefas DV:**
- [ ] Deploy staging environment (backend)
- [ ] Monitoring setup (UptimeRobot)
- [ ] TestFlight (iOS internal) + Play Internal Testing

**Entregas:**
```
├── Google OAuth funcionando no device físico
├── Rate limiting ativo no backend
├── Sentry configurado (mobile + backend)
├── Backend staging deployado
├── App disponível via TestFlight e Play Internal Testing
```

---

### SPRINT 3-4: Core Features (Semanas 3-4)

#### Sprint 3 (Semana 3)

**Objetivos:**
- Notes CRUD
- Planner
- Pizza Chart
- Database sync working

**Tarefas PA:**
- [ ] Notes schema refinement
- [ ] Planner data model
- [ ] API versioning strategy
- [ ] Sync conflict resolution spec

**Tarefas BA:**
- [ ] Notes endpoints (CRUD)
- [ ] Planner endpoints
- [ ] Database indexes optimization
- [ ] WebSocket setup para real-time
- [ ] Caching strategy (Redis)
- [ ] Integration tests

**Tarefas FA:**
- [ ] Notes screen (FlatList, React Native)
- [ ] Note editor modal (React Native)
- [ ] Planner screen (colunas por dia)
- [ ] Pizza chart (victory-native + react-native-svg)
- [ ] Tag input functionality
- [ ] useStorageMode hook (SQLite vs API transparente para UI)
- [ ] Push Notifications: registro + permissão no onboarding

**Tarefas MK:**
- [ ] Blog post 1: "Why track errors?"
- [ ] Email sequence (onboarding)
- [ ] Landing page copy refined

**Entregas:**
```
├── Notes API complete
├── Frontend notes management
├── Planner working
├── Pizza chart showing data
├── Real-time sync
└── Performance optimized
```

---

#### Sprint 4 (Semana 4)

**Objetivos:**
- Stripe integration 50%
- System tests
- Performance baseline
- First beta testers

**Tarefas BA:**
- [ ] IAP validation endpoint: `POST /api/v1/billing/validate-iap/google`
- [ ] IAP validation endpoint: `POST /api/v1/billing/validate-iap/apple`
- [ ] Webhooks: Apple App Store Server Notifications
- [ ] Webhooks: Google Play Developer Notifications (Pub/Sub)
- [ ] Migração endpoint: `POST /api/v1/migrations/from-local`
- [ ] Credits table & logic
- [ ] User tier + storageMode system

**Tarefas FA:**
- [ ] IAP purchase flow (react-native-iap)
- [ ] Upgrade screen (mostra planos via IAP getSubscriptions)
- [ ] Migração UI: progress screen SQLite → cloud
- [ ] Credit counter UI
- [ ] Paywall modal (reusável para features Pro)

**Tarefas DV:**
- [ ] Load testing (locust)
- [ ] Performance profiling
- [ ] Database query optimization

**Tarefas MK:**
- [ ] Beta program setup
- [ ] 50 beta testers recruited
- [ ] Feedback form

**Entregas:**
```
├── Stripe checkout ready
├── Credits system ready
├── Performance baseline (p95 < 200ms)
├── Beta version deployed
└── First users testing
```

---

### SPRINT 5-6: Monetização & Launch (Semanas 5-6)

#### Sprint 5 (Semana 5)

**Objetivos:**
- Stripe webhooks
- Google AdSense
- SEO on-page
- Analytics setup

**Tarefas BA:**
- [ ] IAP webhooks handler (Apple ASSN + Google Pub/Sub) completo
- [ ] Subscription renewal logic
- [ ] Refund handling (revoke Pro tier)
- [ ] Email notifications (SendGrid): boas-vindas, upgrade, expiração
- [ ] Webhook logging & retry logic (idempotente)

**Tarefas FA:**
- [ ] AdMob integration (Free tier — ativação mês 4)
- [ ] Ad placement: banner na dashboard + interstitial ocasional
- [ ] Billing history screen
- [ ] Restore purchases (obrigatório para Apple)

**Tarefas SA/MK:**
- [ ] App Store assets finais: screenshots 6.5", 5.5", iPad
- [ ] Play Store assets finais: screenshots, feature graphic
- [ ] App description localizada (PT-BR + EN)
- [ ] Email campaign sequence

**Tarefas DV:**
- [ ] SSL/HTTPS verificado no backend
- [ ] Security headers (Helmet)
- [ ] CORS configurado corretamente
- [ ] Submissão App Store (iOS Review: 1-3 dias)
- [ ] Submissão Play Store (Android Review: 1-7 dias na primeira)

**Entregas:**
```
├── IAP funcionando (compra real testada em sandbox)
├── Migração SQLite → cloud testada end-to-end
├── App submetido para App Store e Play Store
├── Email system funcionando
└── Security audit passed
```

---

#### Sprint 6 (Semana 6)

**Objetivos:**
- Production launch
- Marketing campaign
- Community launch
- Post-launch monitoring

**Tarefas CEO:**
- [ ] Launch readiness checklist
- [ ] Go/no-go decision (aguardar aprovação nas lojas)
- [ ] Crisis management plan
- [ ] Press release

**Tarefas MK:**
- [ ] Product Hunt launch (após aprovação nas lojas)
- [ ] Twitter/Reddit/TikTok campaign
- [ ] Discord community setup
- [ ] Email to waitlist com link de download
- [ ] ASO monitoring (keywords, rankings)

**Tarefas DV:**
- [ ] Production deployment (backend VPS)
- [ ] Backup strategy
- [ ] Disaster recovery test
- [ ] 24/7 monitoring setup

**Tarefas BA:**
- [ ] Incident response setup
- [ ] Hotfix procedures (OTA via Expo Updates para JS fixes)

**Entregas:**
```
├── App aprovado e disponível nas lojas
├── Backend production deployado
├── 100+ downloads day 1
├── Community lançada
├── Analytics funcionando
└── Support ativo
```

**Launch Metrics:**
```
Target:
- 100 downloads week 1
- 5 PRO conversions (IAP)
- 0.1% crash rate
- 99.5% API uptime
- App Store rating: aguardar 10+ reviews
```

---

## 3. SPRINT 7-8: React Native Polish + Web Companion (Semanas 7-8)

**Objetivos:**
- Polimento completo da UI React Native
- Acessibilidade e performance mobile
- AdMob ativado (mês 4)
- Web app companion (Pro users via browser)

### Sprint 7

**Tarefas FA:**
- [ ] Design system React Native (tokens de cor, tipografia, espaçamento)
- [ ] Animações (React Native Animated / Reanimated)
- [ ] Acessibilidade (VoiceOver iOS + TalkBack Android)
- [ ] Dark mode completo (Appearance API)
- [ ] Performance profiling (Flipper)
- [ ] AdMob ativado e testado (Free tier)

**Tarefas DV:**
- [ ] CDN setup (Cloudflare para assets do backend)
- [ ] OTA Updates (Expo Updates) configurado
- [ ] Performance dashboard backend

**Entregas:**
- App Store rating > 4.0 stars
- Crash rate < 0.5%
- Onboarding completion > 70%

### Sprint 8: Web Companion (Pro)

**Tarefas FA:**
- [ ] React + Vite web app (Pro users)
- [ ] Autenticação web (JWT)
- [ ] CRUD notas via API (mesmo backend)
- [ ] Responsive design

**Tarefas SA:**
- [ ] ASO audit (keywords App Store + Play Store)
- [ ] Meta tags web companion (SEO básico)

**Entregas:**
- Web app funcional para Pro users
- ASO otimizado
- Multi-device testado (mobile + web)

---

## 4. SPRINT 9-10: Integrações & Analytics (Semanas 9-10)

### Sprint 9: MCP Integrations

**Tarefas BA:**
- [ ] Notion API integration
- [ ] Anki API integration
- [ ] Google Keep API integration
- [ ] Sync scheduler (Bull jobs)

**Tarefas FA:**
- [ ] Integration settings page
- [ ] Connect/disconnect flows
- [ ] Sync status indicator

**Entregas:**
- 3 integrations working
- Auto-sync every hour

### Sprint 10: Analytics & Growth

**Tarefas MK:**
- [ ] Analytics dashboard
- [ ] Funnel tracking
- [ ] Cohort analysis
- [ ] Churn prediction

**Tarefas BA:**
- [ ] Analytics events tracking
- [ ] Custom events API

**Entregas:**
- Dashboard analytics complete
- Growth loops identified
- Churn < 5% target

---

## 5. SPRINT 11-12: Scale & Polish (Semanas 11-12)

### Sprint 11: Scaling & Performance

**Tarefas DV:**
- [ ] Load balancer setup
- [ ] Database replication
- [ ] Caching strategy optimization
- [ ] Auto-scaling

**Tarefas BA:**
- [ ] Database optimization
- [ ] Query caching
- [ ] Connection pooling

**Entregas:**
- 10k req/s capacity
- p95 latency < 100ms

### Sprint 12: Final Polish

**Tarefas CEO:**
- [ ] Retrospective
- [ ] Metrics review
- [ ] Phase 2 planning

**All:**
- [ ] Bug fixes
- [ ] Performance tuning
- [ ] Documentation
- [ ] User feedback implementation

**Entregas:**
- Launch complete
- 1000+ users (target)
- 10% PRO conversion
- NPS > 40

---

## 6. TIMELINE VISUAL

```
Week 1-2   │ ██ Infrastructure & Auth
Week 3-4   │    ██ Core Features
Week 5-6   │       ██ Monetization
Week 7-8   │          ██ Redesign React
Week 9-10  │             ██ Integrations
Week 11-12 │                ██ Scale & Polish
             ├──────────────────────────────
             Month 1      Month 2      Month 3
```

---

## 7. DEFINITION OF DONE

Cada sprint é considerado "pronto" quando:

```
✅ Code review passed
✅ Tests passing (> 80% coverage)
✅ Documentation updated
✅ No critical bugs
✅ Performance acceptable
✅ Security audit cleared
✅ Deployed to staging
✅ Product owner approved
✅ Demo to stakeholders
✅ Team retrospective done
```

---

## 8. RISK & MITIGATION

| Risk | Sprint | Mitigation |
|------|--------|-----------|
| App Store rejection (Apple) | 5-6 | Revisar guidelines antes; IAP obrigatório; sem links externos de compra no iOS |
| Play Store rejection | 5-6 | Google Play Billing obrigatório para digital content |
| IAP sandbox bugs | 4-5 | Testar em sandbox Apple + Google antes do real |
| Migração SQLite corrompida | 5+ | Migração idempotente via localId; backup local antes de deletar |
| Auth delays | 1-2 | Pre-researched, tests ready |
| IAP server validation | 5 | Usar bibliotecas oficiais (apple-receipt-parser, googleapis) |
| Review delay Apple (1-3 dias) | 6 | Submeter com 7 dias de antecedência ao launch |
| Review delay Google (1-7 dias) | 6 | Submeter com 10 dias de antecedência |
| SQLite schema migration (app update) | 3+ | expo-sqlite migrations versionadas |
| Low user adoption | 6 | Community building paralelo + ASO desde sprint 1 |
| Team bandwidth | Throughout | Hire contractor if needed |

---

## 9. SUCCESS METRICS POR SPRINT

### Sprint 1-2
- [ ] Auth API 100% tested
- [ ] VPS uptime > 99%
- [ ] 0 critical bugs

### Sprint 3-4
- [ ] Notes CRUD working
- [ ] Planner usable
- [ ] 50 beta users

### Sprint 5-6
- [ ] Payment processing 99%
- [ ] 100+ paying users
- [ ] NPS > 30

### Sprint 7-8
- [ ] Lighthouse > 90
- [ ] Mobile conversion > 3%
- [ ] Engagement +50%

### Sprint 9-10
- [ ] 3 integrations live
- [ ] 500+ users
- [ ] $500 MRR

### Sprint 11-12
- [ ] 1000+ users
- [ ] $1000 MRR
- [ ] Churn < 5%

---

**Plano: ✅ Pronto para Execução com Team Agents**
