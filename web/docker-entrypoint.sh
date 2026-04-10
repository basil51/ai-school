#!/bin/sh
set -e
if [ "${SKIP_DB_MIGRATE:-}" != "true" ]; then
  if ! prisma migrate deploy; then
    echo ""
    echo "=== prisma migrate deploy failed — web will not start. ==="
    echo "Stuck migration (P3009)? If you failed on old phase19 (wrong order), remove that history row, then up:"
    echo "  docker compose exec postgres psql -U eduvibe -d ai_school -c \"DELETE FROM \\\"_prisma_migrations\\\" WHERE migration_name = '20250101000000_phase19_advanced_features';\""
    echo "Or mark rolled back (if that migration folder still exists):"
    echo "  docker compose run --rm web prisma migrate resolve --rolled-back <MIGRATION_FOLDER_NAME>"
    echo "Dev-only reset (deletes DB data):"
    echo "  docker compose down -v && docker compose up -d --build"
    echo "Temporary bypass (not for production): set SKIP_DB_MIGRATE=true in .env"
    echo ""
    exit 1
  fi
fi
exec "$@"
