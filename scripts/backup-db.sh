#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup-db.sh — PostgreSQL + uploads backup for the POS SaaS production server
#
# Usage (manual):
#   bash /opt/pos/scripts/backup-db.sh
#
# Usage (automated via cron — run as root or the deploy user):
#   Add to crontab with: crontab -e
#   0 3 * * * /opt/pos/scripts/backup-db.sh >> /var/log/pos-backup.log 2>&1
#
# What it backs up:
#   1. PostgreSQL full dump (all tenants, schema + data)
#   2. uploads/ Docker volume (product images, logos)
#
# Retention: keeps the last KEEP_DAYS days of backups (default: 7)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/opt/pos/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
COMPOSE_FILE="/opt/pos/docker-compose.prod.yml"
ENV_FILE="/opt/pos/.env"

# Load .env so we have POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

POSTGRES_USER="${POSTGRES_USER:-pos_user}"
POSTGRES_DB="${POSTGRES_DB:-pos_db}"

# ── Setup ─────────────────────────────────────────────────────────────────────
TIMESTAMP="$(date +%Y-%m-%dT%H-%M-%S)"
DAY_DIR="${BACKUP_DIR}/${TIMESTAMP}"
mkdir -p "$DAY_DIR"

echo "[$(date -Iseconds)] Starting POS backup → ${DAY_DIR}"

# ── 1. PostgreSQL dump ────────────────────────────────────────────────────────
echo "[$(date -Iseconds)] Dumping PostgreSQL..."
docker exec pos-postgres \
  pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" \
  > "${DAY_DIR}/postgres.dump"

echo "[$(date -Iseconds)] PostgreSQL dump size: $(du -sh "${DAY_DIR}/postgres.dump" | cut -f1)"

# ── 2. Uploads volume snapshot ────────────────────────────────────────────────
echo "[$(date -Iseconds)] Archiving uploads volume..."
docker run --rm \
  -v pos_uploads_data:/uploads:ro \
  -v "${DAY_DIR}:/backup" \
  alpine \
  tar czf /backup/uploads.tar.gz -C / uploads

echo "[$(date -Iseconds)] Uploads archive size: $(du -sh "${DAY_DIR}/uploads.tar.gz" | cut -f1)"

# ── 3. Prune old backups ──────────────────────────────────────────────────────
echo "[$(date -Iseconds)] Pruning backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime "+${KEEP_DAYS}" -exec rm -rf {} +

# ── Done ──────────────────────────────────────────────────────────────────────
TOTAL_SIZE="$(du -sh "$BACKUP_DIR" | cut -f1)"
echo "[$(date -Iseconds)] Backup complete. Total backup storage used: ${TOTAL_SIZE}"
