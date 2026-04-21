#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# EC2 Bootstrap Script — Amazon Linux 2023 / Ubuntu 22.04
# Run this once on a fresh EC2 instance (free-tier: t2.micro / t3.micro)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "==> Installing Docker..."
sudo yum update -y 2>/dev/null || sudo apt-get update -y
sudo yum install -y docker 2>/dev/null || sudo apt-get install -y docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user 2>/dev/null || sudo usermod -aG docker ubuntu

echo "==> Installing Docker Compose..."
COMPOSE_VERSION="v2.24.5"
sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
     -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "==> Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

echo "==> Done. Log out and back in for docker group to take effect."
