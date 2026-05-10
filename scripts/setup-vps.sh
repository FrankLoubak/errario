#!/bin/bash
# Setup inicial da VPS Hostinger para o Errário backend
# Executar UMA VEZ após provisionar a VPS com Ubuntu 22.04
# Uso: ssh root@187.77.255.90 'bash -s' < scripts/setup-vps.sh

set -euo pipefail

echo "=== Errário VPS Setup ==="
echo "Data: $(date)"

# ─── 1. Atualiza o sistema ────────────────────────────────────────────────────
apt-get update -y && apt-get upgrade -y

# ─── 2. Instala dependências essenciais ──────────────────────────────────────
apt-get install -y \
  curl wget git htop ufw \
  ca-certificates gnupg lsb-release

# ─── 3. Instala Docker ───────────────────────────────────────────────────────
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Habilita Docker no boot
systemctl enable docker
systemctl start docker

echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"

# ─── 4. Configura Firewall UFW ───────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
# IMPORTANTE: portas do PostgreSQL e Redis NÃO são abertas (apenas acessíveis via Docker network)
ufw --force enable

echo "Firewall configurado:"
ufw status

# ─── 5. Cria diretório do projeto ────────────────────────────────────────────
mkdir -p /opt/errario
cd /opt/errario

# ─── 6. Configura Swap (importante para VPS com 4GB RAM) ─────────────────────
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap de 2GB configurado"
fi

# ─── 7. Ajustes de kernel para PostgreSQL e Redis ────────────────────────────
cat >> /etc/sysctl.conf << 'EOF'
# Errário VPS tuning
vm.overcommit_memory = 1
net.core.somaxconn = 512
EOF
sysctl -p

# ─── 8. Cron job para backup diário ──────────────────────────────────────────
echo "0 2 * * * root /opt/errario/scripts/backup-db.sh >> /var/log/errario-backup.log 2>&1" \
  > /etc/cron.d/errario-backup

# ─── 9. Instruções finais ────────────────────────────────────────────────────
cat << 'DONE'

=== VPS Setup Concluído ===

Próximos passos:
1. Clone o repositório: git clone https://github.com/FrankLoubak/errario /opt/errario
2. Copie e preencha: cp /opt/errario/backend/.env.example /opt/errario/backend/.env.production
3. Configure Nginx com seu domínio: api.errario.app
4. Obtenha SSL: certbot certonly --standalone -d api.errario.app
5. Suba os containers: docker-compose -f /opt/errario/docker-compose.prod.yml up -d
6. Execute migrations: docker exec errario_api npx prisma migrate deploy
7. Verifique health: curl http://localhost:3001/api/health

Recursos da VPS KVM 2 (4GB RAM / 2 vCPU):
  - Node.js API: 512MB / 0.8 CPU
  - PostgreSQL:  1GB   / 0.8 CPU
  - Redis:       300MB / 0.2 CPU
  - Nginx:        64MB / 0.2 CPU
  Total alocado: ~1.9GB RAM / 2 CPU (safe com outros projetos existentes)

DONE
