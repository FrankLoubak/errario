#!/bin/bash
# Backup diário do PostgreSQL → armazenamento externo
# Executado via cron: 0 2 * * * /workspaces/errario/scripts/backup-db.sh
# Pré-requisito: aws CLI configurado (ou rclone para Backblaze B2)

set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/errario_backup_${DATE}.sql.gz"
RETENTION_DAYS=30

echo "[$(date)] Iniciando backup..."

# Gera o dump comprimido dentro do container PostgreSQL
docker exec errario_db pg_dump \
  -U errario_user \
  -d errario_prod \
  --no-password \
  | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup gerado: $BACKUP_FILE"

# Upload para S3 / Backblaze B2
# Descomente a linha apropriada para o seu storage:

# AWS S3:
# aws s3 cp "$BACKUP_FILE" "s3://errario-backups/$(basename $BACKUP_FILE)"

# Backblaze B2 via rclone:
# rclone copy "$BACKUP_FILE" b2:errario-backups/

# Remove arquivo local após upload
rm -f "$BACKUP_FILE"

# Limpa backups antigos no bucket (retenção de 30 dias)
# aws s3 ls s3://errario-backups/ | awk '{print $4}' | sort | head -n -$RETENTION_DAYS | \
#   xargs -I{} aws s3 rm "s3://errario-backups/{}"

echo "[$(date)] Backup concluído com sucesso"
