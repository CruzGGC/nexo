#!/bin/sh
# ============================================================
# Nexo PocketBase backup script
# Runs inside the jobs container, copies PB data to /backup
# ============================================================

set -e

BACKUP_DIR="/backup"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
PB_DATA="/pb_data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/nexo_pb_${TIMESTAMP}.tar.gz"

echo "[$(date -Iseconds)] Starting PocketBase backup..."

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Create compressed archive of PB data
# Note: PB data is mounted read-only from the pocketbase_data volume
tar -czf "${BACKUP_FILE}" -C "${PB_DATA}" . 2>/dev/null

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -Iseconds)] Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Prune old backups beyond retention period
PRUNED=0
find "${BACKUP_DIR}" -name "nexo_pb_*.tar.gz" -mtime "+${RETENTION_DAYS}" -type f | while read -r old_file; do
    rm -f "${old_file}"
    PRUNED=$((PRUNED + 1))
    echo "[$(date -Iseconds)] Pruned old backup: ${old_file}"
done

# List current backups
TOTAL=$(find "${BACKUP_DIR}" -name "nexo_pb_*.tar.gz" -type f | wc -l)
echo "[$(date -Iseconds)] Backup complete. Total backups retained: ${TOTAL}"
