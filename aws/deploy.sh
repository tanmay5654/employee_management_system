#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy script — pulls latest Docker images and restarts services on EC2
# Called by GitHub Actions after images are pushed to Docker Hub
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user/employee-management}"

echo "==> Pulling latest images..."
cd "$APP_DIR"
docker-compose pull backend frontend

echo "==> Restarting services..."
docker-compose up -d --no-deps backend frontend

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deployed successfully at $(date)"
docker-compose ps
