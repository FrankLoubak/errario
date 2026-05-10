# 📋 SPEC DRIVEN DEVELOPMENT - Errário v10

## 1. ANÁLISE DO PROJETO ATUAL

### 1.1 Estado Atual
- ✅ Aplicativo vanilla JS funcional
- ✅ Gerenciamento de erros local
- ✅ UI responsiva e intuitiva
- ❌ Sem autenticação
- ❌ Sem backend/database
- ❌ Sem monetização
- ❌ Sem app nativo (Play Store / App Store)
- ❌ Sem SQLite local estruturado
- ❌ Sem sistema de créditos
- ❌ Sem integrações externas

### 1.2 Arquitetura Atual → Alvo
```
ATUAL:
  Frontend Only
  └── Vanilla JS + localStorage (sem estrutura)

ALVO:
  React Native App (iOS + Android)
  ├── MODO LOCAL (Free): SQLite no device
  │   └── Auth apenas → VPS API
  └── MODO CLOUD (Pro): PostgreSQL na VPS
      └── Todos os dados sincronizados
```

---

## 2. AMBIGUIDADES IDENTIFICADAS

### 2.1 Modelo de Negócio
| Ambiguidade | Impacto | Resolução |
|------------|--------|-----------|
| Gratuito vs Premium | Alto | Free (local, SQLite, ads AdMob) / Pro (cloud, PostgreSQL, sem ads) |
| Timing de monetização | Alto | IAP disponível desde o lançamento; ads (AdMob) a partir do mês 4 |
| Modelo de créditos | Médio | 1 crédito = 1 feature premium; comprado via IAP (consumable) |
| Preço IAP | Médio | $4.99 (50 créditos) / $9.99/mês Pro (assinatura) |
| Stripe vs IAP | **Crítico** | IAP obrigatório no iOS (Apple proíbe Stripe para digital content); Google Play Billing obrigatório no Android |
| Taxa das lojas | Alto | Apple 30% (Y1), 15% (Y2+); Google 15% (até $1M); preços devem compensar |

### 2.2 Arquitetura Técnica
| Ambiguidade | Impacto | Resolução |
|------------|--------|-----------|
| Onde persistir dados (Free)? | Crítico | SQLite no device (expo-sqlite) — sem servidor |
| Onde persistir dados (Pro)? | Crítico | PostgreSQL na VPS — sincronizado via REST API |
| Como migrar Free → Pro? | Crítico | Endpoint bulk upload: `POST /api/v1/migrations/from-local` (idempotente por localId) |
| Autenticação obrigatória mesmo offline? | Alto | Auth sempre exige rede; JWT válido em SecureStore permite uso offline após auth inicial |
| Como sincronizar dados Pro? | Alto | REST API + AppState foreground refresh; sem polling contínuo (preserva bateria) |
| Onde rodar backend? | Crítico | VPS Hostinger + Node.js + PostgreSQL (somente Pro users tocam o banco) |
| Como validar IAP? | Crítico | Server-side: Apple App Store Server API v2 / Google Play Developer API |
| MCP qual protocolo? | Médio | HTTP com autenticação Notion/Anki/Google (Fase 2, Pro only) |

### 2.3 Produto/Features
| Ambiguidade | Impacto | Resolução |
|------------|--------|-----------|
| Quais features são locais vs cloud? | **Crítico** | Ver matriz em 2.4 |
| Integração MCP quando? | Médio | Fase 2 (meses 4-6), Pro only |
| Limite de notas Free? | Médio | 100 notas ativas (SQLite local); Pro: ilimitado (PostgreSQL) |
| Multi-device quando? | Alto | Pro only — dados na VPS permitem acesso de qualquer device |
| Compartilhamento de notas? | Médio | Fase 2 (social features, Pro only) |

### 2.4 Matriz de Features x Tiers

| Feature | Free (Local) | Pro (Cloud) |
|---------|-------------|-------------|
| **Armazenamento** | SQLite no device | PostgreSQL na VPS |
| **Acesso multi-device** | ❌ | ✅ |
| **Funciona offline** | ✅ sempre | ✅ (cache SQLite) |
| **Auth necessária** | ✅ (sempre online) | ✅ (sempre online) |
| Criar notas | ✅ | ✅ |
| Planner semanal | ✅ | ✅ |
| Pizza chart (análise) | ✅ | ✅ |
| Reviews programados | ✅ | ✅ |
| Push notifications | ✅ | ✅ |
| Limite de notas | 100 ativas | ∞ |
| Anúncios (AdMob) | ✅ (mês 4+) | ❌ |
| Migração para cloud | ✅ (ao fazer upgrade) | N/A |
| Integração Notion | ❌ | ✅ |
| Integração Anki | ❌ | ✅ |
| Integração Google Keep | ❌ | ✅ |
| Export PDF | ❌ | ✅ |
| Suporte prioritário | ❌ | ✅ |
| Backup automático | ❌ | ✅ (VPS backups) |

---

## 3. SUGESTÕES DE MELHORIA

### 3.1 UX/UI
- [ ] Dark mode automático
- [ ] Modo offline com sincronização posterior
- [ ] Onboarding interativo (5 passos)
- [ ] Tutorial inline com tooltips
- [ ] Mobile app (React Native)

### 3.2 Features
- [ ] Colaboração em tempo real
- [ ] Discussão/comentários em notas
- [ ] Sistema de badges e gamificação
- [ ] Recomendações de tópicos para estudar
- [ ] Integração com calendário do Google
- [ ] Exportar relatório de progresso

### 3.3 Performance
- [ ] Code splitting
- [ ] Lazy loading de imagens
- [ ] Service workers (PWA)
- [ ] Caching inteligente
- [ ] CDN para assets estáticos

### 3.4 Segurança
- [ ] Rate limiting
- [ ] CORS configurado
- [ ] Input validation/sanitization
- [ ] HTTPS everywhere
- [ ] Backup automático

### 3.5 Analytics
- [ ] Google Analytics 4
- [ ] Heatmaps (Hotjar)
- [ ] Session replay (para UX)
- [ ] Funnel analysis (conversão free→pro)
- [ ] Churn prediction model

---

## 4. MÉTRICAS DE CHURN

### 4.1 Estratégia Anti-Churn

```
Churn = Customers Lost / Total Customers × 100

Target: < 5% ao mês (para SaaS de educação)
Current: N/A (novo app)
```

### 4.2 Tipos Identificados
| Tipo | Estratégia |
|------|-----------|
| **Voluntary** | Onboarding melhor, engagement loops, email nurturing |
| **Involuntary** | Retry de pagamento automático, notificação de expiração |
| **Fit** | Segmentação melhor no CAC, quiz de fit |

### 4.3 Gatilhos de Churn Esperados
1. Falta de uso por 7 dias → Email com dicas
2. Não completou onboarding → Enviar tutorial
3. Premium expirou → Notificar 3 dias antes
4. Sem notas criadas → Enviar exemplo de caso de uso

### 4.4 Retenção Esperada
```
Mês 1: 80% (primeiros usuários experimentando)
Mês 2: 70% (filtro de fit)
Mês 3+: 65% (estável, com 20% convertendo para pro)
```

---

## 5. ANÁLISE COMPETITIVA

| Aspecto | Anki | Notion | Google Keep | Errário |
|--------|------|--------|-------------|---------|
| **Erro-focused** | ❌ | ❌ | ❌ | ✅ |
| **Análise visual** | ❌ | ❌ | ❌ | ✅ |
| **Planner** | ❌ | ✅ | ❌ | ✅ |
| **Multiplataforma** | ✅ | ✅ | ✅ | 🔄 |
| **Gratuito** | ✅ | ✅ | ✅ | ✅ |
| **Integração** | ❌ | ✅ | ✅ | 🔄 |

### Diferencial Errário:
1. **Único focado em análise de erros**
2. **Gamificação + recompensas**
3. **Insights automáticos**
4. **Planner inteligente**

---

## 6. REQUISITOS FUNCIONAIS (Phases)

### Fase 1: MVP (Meses 1-3)
```
- [ ] React Native app (iOS + Android) ← plataforma primária
- [ ] SQLite local (expo-sqlite) — Free tier
- [ ] Backend Node.js + PostgreSQL — Pro tier
- [ ] Autenticação JWT + Google OAuth (mobile deep link)
- [ ] CRUD de notas: SQLite (Free) e API REST (Pro)
- [ ] Planner semanal + Pizza chart
- [ ] IAP integration: Google Play Billing + Apple StoreKit 2
- [ ] Migração de dados SQLite → PostgreSQL (upgrade flow)
- [ ] Sistema de créditos (IAP consumable)
- [ ] Ads AdMob (Free tier, ativado no mês 4)
- [ ] Push Notifications (revisões agendadas)
- [ ] App Store + Play Store submission
```

### Fase 2: Growth (Meses 4-6)
```
- [ ] MCP Integrations (Notion/Anki/Google Keep) — Pro only
- [ ] AdMob ativado para Free tier
- [ ] Social features (compartilhamento de notas)
- [ ] Web app companion (React + Vite) — opcional para Pro
- [ ] Analytics avançado
- [ ] Dashboard admin
- [ ] OTA updates via Expo (sem passar por review das lojas)
```

### Fase 3: Scale (Meses 7-12)
```
- [ ] AI-powered recommendations
- [ ] Gamificação completa
- [ ] Enterprise plan
- [ ] API pública
- [ ] Webhooks
```

---

## 7. REQUISITOS NÃO-FUNCIONAIS

| Requisito | Target | Método |
|-----------|--------|--------|
| **Uptime** | 99.9% | Load balancer + redundância |
| **Latência** | < 200ms p95 | CDN + cache |
| **Throughput** | 1000 req/s | Autoscaling + queue |
| **Acessibilidade** | WCAG 2.1 AA | Audit tools |
| **SEO** | Top 5 "error analysis tool" | On-page + backlinks |

---

## 8. MATRIZ DE RISCOS

| Risco | Probabilidade | Impacto | Mitigação |
|------|--------------|--------|-----------|
| Baixa adoção inicial | Alta | Alto | Foco marketing, influencers |
| Alto churn free→pro | Alta | Médio | Melhoria onboarding |
| Falha Stripe | Baixa | Alto | Fallback payment (manual) |
| Latência BD | Média | Médio | Índices, cache Redis |
| Segurança dados | Baixa | Crítico | Audit segurança, 2FA |

---

## 9. SUCCESS METRICS

### OKRs Year 1

```
O1: Alcançar 10k usuários
  KR1: 500 CAC < $2 (cost per acquisition)
  KR2: 15% conversion free→pro
  KR3: 5% churn mensal

O2: Faturamento sustentável
  KR1: $5k MRR ao fim do ano
  KR2: LTV > $50 (lifetime value)
  KR3: CAC payback < 3 meses

O3: Excelência de produto
  KR1: NPS > 50
  KR2: 4.5+ estrelas na app store
  KR3: Onboarding completion > 70%
```

### Métricas de Churn

```
Baseline Target para SaaS Educação:
- Month 1: 80% retention (ok, novo)
- Month 3: 65% (esperado)
- Month 6: 55% (precisa melhorar)
- Month 12: 50% (aceitável)

Ações se churn > target:
1. Análise qualitativa (surveys)
2. Melhoria UX baseada em feedback
3. Aumento engagement (emails, notificações)
4. Referral program (incentivos)
```

---

## 10. STACK TECNOLÓGICO PROPOSTO

### Mobile App (plataforma primária)
```
- React Native (Expo SDK 51+)
- expo-sqlite (banco local Free tier)
- expo-secure-store (JWT storage — criptografado)
- expo-notifications (push notifications)
- react-native-iap (IAP: Google Play + Apple StoreKit)
- react-native-google-mobile-ads (AdMob Free tier)
- NativeWind (TailwindCSS para React Native)
- React Navigation (routing nativo)
- React Query / Zustand (state management)
- victory-native + react-native-svg (charts)
- EAS Build (CI/CD para iOS e Android)
```

### Web App (opcional, Fase 2 — acesso Pro via browser)
```
- React 18 (Vite)
- TailwindCSS / shadcn/ui
- React Query / Zustand
```

### Backend
```
- Node.js 20 + Express
- PostgreSQL + Prisma
- Redis (cache + sessions)
- JWT + Passport (auth)
- Bull (job queue)
```

### Infraestrutura
```
- VPS Hostinger (2GB RAM, 2 CPU)
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Stripe (payments)
- SendGrid (email)
```

### Observabilidade
```
- Sentry (errors)
- LogRocket (sessions)
- Google Analytics 4
- Datadog (infra)
```

---

## 11. PLANO DE SPRINTS (12 Semanas)

### Sprint 1-2: Setup & Auth (2 semanas)
- [ ] Monorepo setup (mobile/ + backend/)
- [ ] Expo + React Native boilerplate
- [ ] expo-sqlite schema + migrations
- [ ] Backend Node.js + Express boilerplate
- [ ] PostgreSQL + Prisma schema
- [ ] JWT auth (register, login, refresh)
- [ ] Google OAuth (mobile deep link flow)
- [ ] SecureStore para JWT no device
- [ ] Apple Developer + Google Play Console configurados
- [ ] EAS Build (iOS + Android) configurado

### Sprint 3-4: Core Features (2 semanas)
- [ ] CRUD notas em SQLite (Free tier)
- [ ] CRUD notas via API REST (Pro tier)
- [ ] hook useStorageMode (SQLite vs API)
- [ ] Planner semanal (SQLite + API)
- [ ] Pizza chart (victory-native)
- [ ] Push Notifications (expo-notifications)
- [ ] Onboarding flow (5 passos)

### Sprint 5-6: Monetização & Launch (2 semanas)
- [ ] IAP: Google Play Billing (react-native-iap)
- [ ] IAP: Apple StoreKit 2 (react-native-iap)
- [ ] Backend: validação IAP server-side
- [ ] Backend: webhooks Apple ASSN + Google Pub/Sub
- [ ] Migração SQLite → PostgreSQL (upgrade flow)
- [ ] Sistema de créditos (IAP consumable)
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)

### Sprint 7-8: Polish & Ads (2 semanas)
- [ ] Dark mode (Appearance API React Native)
- [ ] React Native UI polish e acessibilidade
- [ ] AdMob integration (Free tier, ativação mês 4)
- [ ] OTA updates via Expo Updates
- [ ] Performance profiling (Flipper / Expo DevTools)

### Sprint 9-10: Integrações & Analytics (2 semanas)
- [ ] Notion API integration (Pro only)
- [ ] Anki API integration (Pro only)
- [ ] Analytics events tracking
- [ ] Admin dashboard (web)

### Sprint 11-12: Scale & Polish (2 semanas)
- [ ] Deploy VPS otimizado
- [ ] Security audit
- [ ] Bug fixes + user feedback
- [ ] Launch marketing

---

## 12. PRÓXIMOS PASSOS

1. ✅ **Leitura** deste documento
2. ▶️ **Revisão** das ambiguidades com stakeholders
3. ▶️ **Aprovação** do scope e timeline
4. ▶️ **Setup** do team agent (CEO + 5 subagentes)
5. ▶️ **Desenvolvimento** seguindo sprints

---

**Documento Versão: 1.0**  
**Data: 2026-05-09**  
**Status: ✅ Pronto para Team Agent**
