# Deploy Errário — Easypanel (VPS Hostinger 187.77.255.90)

## Contexto

A VPS já roda Easypanel com Traefik. Não use o `docker-compose.prod.yml` com Nginx
diretamente — conflitaria com o Traefik existente na porta 443.
O Easypanel gerencia SSL/HTTPS automaticamente.

---

## Passo 0 — Configurar swap (OBRIGATÓRIO — fazer uma vez)

A VPS está **sem swap**. Se um container tiver pico de memória, processos serão
mortos sem aviso. Faça isso com acesso SSH antes de qualquer deploy:

```bash
# SSH na VPS
ssh root@187.77.255.90

# Cria swap de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Persiste após reboot
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Confirma
free -h
# Swap deve aparecer com 2GB
```

---

## Passo 1 — Criar domínio na Cloudflare (ou DNS do seu registrar)

Antes de configurar o Easypanel, adicione o registro DNS:

```
Tipo: A
Nome: api
Valor: 187.77.255.90
TTL: Auto
Proxy: OFF (cinza, não laranja) ← importante para SSL do Traefik
```

Resultado: `api.errario.app` aponta para a VPS.

---

## Passo 2 — Criar projeto no Easypanel

1. Acesse o Easypanel da sua VPS
2. Clique em **"Create Project"**
3. Nome: `errario`
4. Clique em **"Create Service"** → escolha **"App"**
5. Nome do serviço: `api`

---

## Passo 3 — Configurar o serviço

### 3a. Source (imagem Docker)
- **Image**: `frankloubak/errario-backend:latest`
  _(depois de fazer push no Docker Hub via GitHub Actions)_
- Ou temporariamente, faça build diretamente na VPS — veja Passo Alternativo

### 3b. Domain
- **Domain**: `api.errario.app`
- **Port**: `3001`
- Marque **"HTTPS"** — Easypanel/Traefik gera o certificado automaticamente

### 3c. Environment Variables
Cole as variáveis abaixo no campo de env vars do Easypanel
(substitua os valores reais):

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://errario_user:SENHA_FORTE@errario_db:5432/errario_prod
REDIS_URL=redis://errario_redis:6379
JWT_SECRET=GERE_COM_openssl_rand_hex_64
JWT_REFRESH_SECRET=GERE_COM_openssl_rand_hex_64_DIFERENTE
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=SEU_GOOGLE_CLIENT_SECRET
SENDGRID_API_KEY=SG.SEU_SENDGRID_KEY
EMAIL_FROM=noreply@errario.app
APPLE_BUNDLE_ID=com.errario.app
GOOGLE_PLAY_PACKAGE_NAME=com.errario.app
BCRYPT_ROUNDS=10
```

> **Gerar JWT secrets seguros:**
> ```bash
> openssl rand -hex 64   # rode duas vezes, use um para JWT_SECRET e outro para JWT_REFRESH_SECRET
> ```

---

## Passo 4 — Criar os serviços de banco e Redis

No mesmo projeto `errario`, crie mais dois serviços:

### PostgreSQL
- **Create Service** → **Postgres**
- Nome: `db` (será acessível como `errario_db` internamente)
- Database: `errario_prod`
- User: `errario_user`
- Password: mesma usada no `DATABASE_URL` acima

### Redis
- **Create Service** → **Redis**
- Nome: `redis` (será acessível como `errario_redis` internamente)

---

## Passo 5 — Executar migrations

Após o container `api` estar rodando (health check verde):

```bash
# No terminal do Easypanel ou via SSH + docker exec
docker exec -it <id_do_container_api> npx prisma migrate deploy
```

Ou use a aba **"Console"** do serviço `api` no Easypanel:
```
npx prisma migrate deploy
```

---

## Passo 6 — Verificar deploy

```bash
# Deve retornar: {"success":true,"status":"ok","timestamp":"..."}
curl https://api.errario.app/api/health
```

---

## Passo Alternativo — Build direto na VPS (antes do CI/CD estar configurado)

Se quiser testar antes de ter o Docker Hub configurado:

```bash
# Na VPS via SSH
ssh root@187.77.255.90

# Clone o repo
git clone https://github.com/FrankLoubak/errario /opt/errario-build
cd /opt/errario-build/backend

# Build da imagem local
docker build -t errario-backend:local .

# No Easypanel, use a imagem local: errario-backend:local
```

---

## GitHub Actions Secrets (para CI/CD automático)

Configure no GitHub: Settings → Secrets → Actions:

| Secret | Valor |
|--------|-------|
| `DOCKER_USERNAME` | frankloubak (seu usuário Docker Hub) |
| `DOCKER_TOKEN` | Token de acesso do Docker Hub |
| `VPS_HOST` | 187.77.255.90 |
| `VPS_USER` | root |
| `VPS_SSH_KEY` | Conteúdo da chave privada SSH (`~/.ssh/id_rsa`) |
| `EXPO_TOKEN` | Token do expo.dev (EAS Build) |

Após configurar, cada push na `main` vai:
1. Rodar testes
2. Build e push da imagem Docker Hub
3. SSH na VPS e atualizar o container via `docker pull` + restart

---

## Monitoramento

Após deploy, configure:
1. **UptimeRobot** — monitora `https://api.errario.app/api/health` a cada 5 min
2. **Sentry** — erros do backend em tempo real (configure `SENTRY_DSN`)
3. **Easypanel** — já mostra uso de CPU/RAM por container

---

## Recursos após deploy do Errário

| Container | RAM estimada |
|-----------|-------------|
| Errário API | ~300 MB |
| Errário PostgreSQL | ~200 MB |
| Errário Redis | ~50 MB |
| **Errário total** | **~550 MB** |
| Projetos existentes | ~742 MB |
| **Total na VPS (7.8 GB)** | **~1.3 GB usados — 80% livre** |
