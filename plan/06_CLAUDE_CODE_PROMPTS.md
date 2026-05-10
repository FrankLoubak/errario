# 💻 CLAUDE CODE EXECUTION PROMPTS - Errário v10

## INSTRUÇÃO PRINCIPAL PARA COMEÇAR

Copie e cole este prompt completo no **Claude Code Terminal** do seu GitHub Codespace:

---

## 🎯 PROMPT MESTRE (Use isso como base)

```
Você é o CEO ARCHITECT do projeto Errário v10. 

CONTEXTO:
- App SaaS de gestão inteligente de erros para estudantes
- Stack: Node.js + React + PostgreSQL
- Objetivo: MVP em 3 meses, 10k usuários em 1 ano
- Monetização: Freemium (ads) + Stripe créditos + tiers PRO
- Deploy: VPS Hostinger
- GitHub: FrankLoubak/errario

ARQUIVOS JÁ EXISTEM:
- /mnt/user-data/outputs/01_SPEC_DRIVEN_DEVELOPMENT.md
- /mnt/user-data/outputs/02_TEAM_AGENT_STRUCTURE.md
- /mnt/user-data/outputs/03_TECHNICAL_ARCHITECTURE.md
- /mnt/user-data/outputs/04_DEVELOPMENT_PLAN.md
- /mnt/user-data/outputs/05_MARKETING_PLAN.md

TAREFAS IMEDIATAS (Sprint 1):
1. Setup monorepo (frontend + backend + docs)
2. Configurar Node.js + Express boilerplate
3. PostgreSQL + Prisma
4. Autenticação JWT
5. Deploy initial em Hostinger

PRÓXIMAS AÇÕES:
- Clone https://github.com/FrankLoubak/errario
- Crie branch: git checkout -b feature/sprint-1-setup
- Implemente tasks do Sprint 1
- Faça push ao terminar cada task
- Mantenha branch atualizada

COMANDOS INICIAIS:
```bash
cd /workspace/errario
git checkout -b feature/sprint-1-setup
npm install

# Backend setup
cd backend
npm init -y
npm install express prisma @prisma/client dotenv cors helmet express-rate-limit jsonwebtoken bcryptjs nodemailer

# Frontend setup (em outra aba)
cd ../frontend
npm create vite@latest . -- --template react
npm install zustand @tanstack/react-query axios framer-motion tailwindcss @shadcn/ui
```

PRINCÍPIOS:
- Código em English (variáveis e funções)
- Comentários em Português Brazilian
- Commit frequente (a cada feature)
- Testes unitários > 80%
- Zero console.logs em produção
- Seguir ADRs documentadas

COMUNICAÇÃO:
Ao terminar cada task:
1. Descreva o que foi feito
2. Métricas de qualidade (testes, cobertura)
3. Próxima task
4. Bloqueadores encontrados

Pronto? Qual task você quer começar?
```

---

## 📋 PROMPTS ESPECÍFICOS POR ROLE

### 1️⃣ BACKEND ARCHITECT PROMPT

```
Role: Backend Architect
Sprint: 1 (Auth & Infrastructure)

TAREFA: Implementar sistema de autenticação JWT + OAuth Google

REQUISITOS:
1. Estrutura Express com middleware
2. Prisma schema para User
3. JWT generation e validation
4. Password hashing com bcrypt
5. Google OAuth callback
6. Error handling robusto
7. Rate limiting
8. Tests unitários

DELIVERABLES:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/google/callback
- POST /api/v1/auth/refresh
- GET /api/v1/auth/me (protected)

ARQUIVO: backend/src/routes/auth.ts

Database:
- User table com email, password_hash, oauth_id
- Índices em email

Código:
- Usar Passport.js para OAuth
- JWT secret em env
- Error messages seguros (sem SQL details)
- Logs com Winston

Tests:
- test/auth.test.ts
- Coverage > 80%
- Mock database
```

### 2️⃣ FRONTEND ARCHITECT PROMPT

```
Role: Frontend Architect
Sprint: 1 (Login/Signup pages)

TAREFA: Criar componentes de autenticação com React + Zustand

REQUISITOS:
1. Login page (email + password)
2. Signup page (email + password + name)
3. Google OAuth button
4. Form validation (Zod)
5. Error messages
6. Loading states
7. Redirect after auth
8. Dark mode support

COMPONENTES:
- LoginForm.tsx
- SignupForm.tsx
- GoogleAuthButton.tsx
- ProtectedRoute.tsx

STATE MANAGEMENT:
- Zustand store (authStore.ts)
- Token storage (localStorage)
- User context

STYLING:
- TailwindCSS
- shadcn/ui components
- Responsive mobile

TESTS:
- components/__tests__/LoginForm.test.tsx
- User interactions
- Form validation
```

### 3️⃣ DEVOPS ARCHITECT PROMPT

```
Role: DevOps Architect
Sprint: 1 (Infrastructure Setup)

TAREFA: Provisionar VPS Hostinger + Docker setup

REQUISITOS:
1. Ubuntu 22.04 server
2. Docker + Docker Compose
3. PostgreSQL container
4. Redis container
5. Nginx reverse proxy
6. SSL with Let's Encrypt
7. Firewall rules
8. Backup strategy

DELIVERABLES:
- docker-compose.yml (production)
- docker-compose.dev.yml (development)
- nginx.conf
- .env.production
- deployment scripts

DOCKER IMAGES:
- node:20-alpine (app)
- postgres:15-alpine (db)
- redis:7-alpine (cache)
- nginx:alpine (proxy)

SECURITY:
- Port 22 (SSH) restricted to your IP
- Port 443 (HTTPS only)
- Port 80 redirects to 443
- Secrets in .env (not in code)

MONITORING:
- UptimeRobot alerts
- Simple health check endpoint
- Logs to stdout (Docker)

COMMANDS:
ssh root@[HOSTINGER_IP]
# Install Docker
curl https://get.docker.com | sh
# Clone repo
git clone https://github.com/FrankLoubak/errario
cd errario
docker-compose -f docker-compose.prod.yml up -d
```

### 4️⃣ PRODUCT ARCHITECT PROMPT

```
Role: Product Architect
Sprint: 1 (Database Design)

TAREFA: Definir schema Prisma completo

REQUISITOS:
1. User model com fields relevantes
2. Note model (title, body, tags, subject)
3. PlannerCard (assignment, completion)
4. Credits system
5. Stripe integration models
6. Índices para performance
7. Relationships corretas
8. Cascade deletes apropriados

ARQUIVO: backend/prisma/schema.prisma

MODELS:
- User (autenticação, créditos, tier)
- Note (notas de erro, propriedades)
- ReviewDate (spaced repetition)
- PlannerCard (planejamento semanal)
- CreditTransaction (auditoria)
- StripeEvent (webhook logging)

VALIDAÇÕES:
- Email format
- Tag format
- Credit amount > 0
- Enum types seguro

MIGRATIONS:
- Versionamento automático Prisma
- Seed data para testes
- Rollback procedures

PERFORMANCE:
- Índices compostos
- Foreign keys com cascade
- Soft deletes strategy

DOCUMENTAÇÃO:
- Database diagram (mermaid)
- Relationship description
- Query patterns
```

---

## 🚀 PROMPTS SEQUENCIAIS (Use em ordem)

### SEQUÊNCIA 1: Environment Setup

```
Task: Setup Node.js project com Prisma

Etapas:
1. npm init
2. npm install dependencies
3. Setup .env.example
4. Configure Prisma
5. Create migrations folder
6. Test database connection

Comandos:
npm install --save express @prisma/client dotenv cors helmet
npm install --save-dev @types/express typescript ts-node
npm install -D prisma

npx prisma init

# Update database.env to local PostgreSQL
# Run: npx prisma migrate dev --name init
```

### SEQUÊNCIA 2: Auth Implementation

```
Task: Implementar autenticação completa

Pré-requisitos:
- Database rodando
- Prisma schema pronto
- Node.js server scaffold

Implementação:
1. Criar User model em Prisma
2. Criar auth routes
3. Implementar JWT
4. Implementar password hashing
5. Implementar Google OAuth
6. Criar middleware auth
7. Testar endpoints

Verificação:
- POST /api/v1/auth/register → success
- POST /api/v1/auth/login → token
- GET /api/v1/auth/me (com token) → user data
```

### SEQUÊNCIA 3: Frontend Components

```
Task: Criar componentes React básicos

Setup Vite:
npm create vite@latest frontend -- --template react
cd frontend && npm install

Instalações:
npm install zustand @tanstack/react-query axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

Componentes a criar:
- App.tsx (router)
- pages/Login.tsx
- pages/Signup.tsx
- components/ProtectedRoute.tsx
- store/authStore.ts

Testes:
npm install -D @testing-library/react vitest
npm run test
```

---

## 🧪 TESTING PROMPTS

### Unit Test Template

```
Task: Escrever tests para auth service

Arquivo: backend/src/__tests__/auth.test.ts

Testes necessários:
1. User registration (valid email)
2. Duplicate email (error)
3. Invalid email format (error)
4. Password hashing (never stored plain)
5. Login with correct password
6. Login with wrong password
7. JWT token generation
8. JWT token validation
9. Token expiry

Use Jest + Supertest

Commands:
npm test -- --coverage
# Deve ter > 80% coverage
```

---

## 📚 INTEGRATION TESTING PROMPT

```
Task: Integration tests para API

Arquivo: backend/src/__tests__/api.integration.test.ts

Setup:
- SQLite in-memory database (tests)
- Seed test user
- Mock Stripe

Testes:
1. Complete auth flow (signup → login → protected route)
2. Note creation (autenticado)
3. Note update (apenas owner)
4. Note deletion
5. Piano listing (por user)

Run:
npm run test:integration
```

---

## 📝 DOCUMENTAÇÃO PROMPTS

### README Generator

```
Task: Gerar README.md completo

Conteúdo:
- Project overview
- Tech stack
- Setup instructions
- API documentation
- Development guide
- Deployment guide
- Contributing guidelines

Arquivo: README.md na raiz
```

### SKILL.md Generator

```
Task: Criar SKILL.md para Claude Code

Arquivo: .claude/SKILL.md

Conteúdo:
- Project structure
- Tech stack decisions
- Architecture patterns
- Database schema
- API contracts
- Common tasks
- Debugging tips

Use para Claude lembrar contexto
```

---

## 🔧 TROUBLESHOOTING PROMPTS

Se encontrar erro:

```
Error: "PostgreSQL connection refused"
Task: Diagnosticar problema database

Ações:
1. Verificar docker-compose está rodando
2. Check environment variables
3. Test connection: psql -U postgres
4. Check logs: docker-compose logs db

Se problema persista:
- Deletar volumes: docker-compose down -v
- Reiniciar: docker-compose up -d
```

```
Error: "CORS error"
Task: Configurar CORS correto

Frontend:
axios.defaults.baseURL = 'http://localhost:3001'

Backend:
app.use(cors({
  origin: ['http://localhost:5173', 'https://errario.app'],
  credentials: true
}))
```

---

## 📊 COMMIT MESSAGE TEMPLATE

Use isso para cada commit:

```
feat: Implementar autenticação JWT
- Adicionar User model em Prisma
- Criar auth routes (register, login)
- Implementar JWT token generation
- Adicionar password hashing com bcrypt
- Testes unitários (coverage 85%)

Closes #123
```

---

## 🎯 QUICK START COMMANDS

```bash
# Clone
git clone https://github.com/FrankLoubak/errario
cd errario

# Setup backend
cd backend
npm install
npx prisma generate
npm run dev

# Setup frontend (em outra aba)
cd frontend
npm install
npm run dev

# Tests
npm run test

# Linting
npm run lint
```

---

## ✅ CHECKLIST PRÉ-COMMIT

Antes de fazer push:

```
- [ ] npm run test (todos testes passando)
- [ ] npm run lint (sem erros)
- [ ] Código comentado em português
- [ ] Sem console.logs
- [ ] Commit message descritivo
- [ ] Branch atualizada com main
- [ ] PR description completa
- [ ] Não tem secrets nos arquivos
```

---

## 🚀 COMO USAR ESTES PROMPTS

### Opção 1: Terminal do Codespace
```bash
# Abra Claude Code terminal
# Copie o prompt específico
# Cole e pressione Enter
# Claude vai executar/criar os arquivos
```

### Opção 2: Na conversa Claude
```
Copie o prompt → Cole aqui → Claude executa
```

### Opção 3: Arquivo prompt.txt
```bash
cat > EXECUTION_PROMPT.txt << 'EOF'
[Cole o prompt aqui]
EOF

# Depois use:
claude-code EXECUTION_PROMPT.txt
```

---

## 📞 DEBUGGING COM CLAUDE CODE

```
Se tiver dúvida durante implementação:

1. Descreva o erro
2. Cole o stack trace
3. Diga qual arquivo está editando
4. Claude vai:
   - Diagnosticar
   - Propor solução
   - Mostrar código corrigido
```

---

**Prompts: ✅ Prontos para Execução**  
**Próximo passo: Abra seu Codespace e comece!**
