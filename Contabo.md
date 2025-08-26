# Deploy AI School to Contabo (PM2 + Nginx + Docker DB)

This guide deploys the app to a Contabo VPS using:
- PM2 to run the Next.js app
- Nginx as reverse proxy with TLS (Certbot)
- Docker for Postgres (pgvector) and Redis

Repo: `https://github.com/basil51/ai-school.git`
Target path: `/var/www/ai-school`

---

## 1) SSH to server (as root)
```bash
ssh root@YOUR_SERVER_IP
# Example from your SSH config
# Host Contabo
#   HostName 94.72.105.87
#   User root
#   Port 22
```

Update base packages:
```bash
apt-get update -y && apt-get install -y git curl nginx
```

---

## 2) Clone the repository
```bash
mkdir -p /var/www/ai-school
cd /var/www/ai-school
# Clone public repo
git clone https://github.com/basil51/ai-school.git .
```

To update later:
```bash
cd /var/www/ai-school
git pull --rebase
```

---

## 3) Start Postgres (pgvector) and Redis with Docker
Install Docker and Compose plugin:
```bash
apt-get install -y docker.io docker-compose-plugin
systemctl enable --now docker
```

Optional (non‑root user):
```bash
# If you run as a non-root user, create docker group and add yourself
# (skip when using root)
getent group docker || groupadd docker
usermod -aG docker $USER
newgrp docker
```

Start services using the repo's docker-compose.yml:
```bash
cd /var/www/ai-school
# If docker group not configured, prefix with sudo
sudo docker compose up -d
```

Ports:
- Postgres: 5433 (host) → 5432 (container)
- Redis:    6380 (host) → 6379 (container)

---

## 4) Install Node.js + pnpm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
corepack enable && corepack prepare pnpm@latest --activate
```

---

## 5) Configure environment variables
Create `web/.env.production`:
```bash
cd /var/www/ai-school/web
cat > .env.production << 'EOF'
NEXTAUTH_URL=https://YOUR_DOMAIN
NEXTAUTH_SECRET=YOUR_LONG_RANDOM_SECRET
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/ai_school?schema=public
OPENAI_API_KEY=YOUR_OPENAI_KEY
REDIS_URL=redis://127.0.0.1:6380
EOF
```

Notes:
- Use a strong random `NEXTAUTH_SECRET` (32+ chars).
- Replace `YOUR_DOMAIN` with your domain (e.g., `ai.example.com`).
- Keep keys/secrets private.

---

## 6) Build and run the web app (PM2)
Install dependencies, migrate, and build:
```bash
cd /var/www/ai-school/web
pnpm install
pnpm migrate:deploy
pnpm build
```

Run with PM2 (ecosystem file included):
```bash
npm i -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 ls
```

This starts the app on port 3000 (configured in `ecosystem.config.js`).

---

## 7) Configure Nginx reverse proxy + HTTPS
Create a site config:
```bash
bash -c 'cat > /etc/nginx/sites-available/ai-school << "CONF" 
server {
  listen 80;
  server_name YOUR_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
CONF'
ln -sf /etc/nginx/sites-available/ai-school /etc/nginx/sites-enabled/ai-school
nginx -t && systemctl reload nginx
```

Add TLS with Certbot:
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d YOUR_DOMAIN
```

---

## 8) Smoke tests
```bash
curl -sS https://YOUR_DOMAIN/api/health
# Expect: { "status": "ok", "time": "..." }
```

Log into the app, upload a .txt on `/rag`, and ask a question to validate ingestion and search.

---

## 9) Maintenance and updates
Deploy new code:
```bash
cd /var/www/ai-school
git pull --rebase
cd web
pnpm install
pnpm migrate:deploy
pnpm build
pm2 restart ai-school-web
```

Check PM2 and logs:
```bash
pm2 ls
pm2 logs ai-school-web --lines 200
```

Rebuild indexes (optional, admin only):
```bash
# IVFFLAT
curl -X POST -H "Content-Type: application/json" \
  -d '{"method":"ivfflat","reindexGin":true}' \
  https://YOUR_DOMAIN/api/admin/maintenance/indexes
```

---

## 10) Troubleshooting
- Missing docker group:
```bash
getent group docker || groupadd docker
usermod -aG docker $USER
newgrp docker
# Or use: sudo docker compose ...
```
- Redis/Postgres not reachable: confirm ports 6380/5433 are listening (`ss -tulpn | grep -E ":6380|:5433"`).
- OpenAI key missing: set `OPENAI_API_KEY` in `.env.production`.
- 502/Bad Gateway: ensure PM2 app is running and Nginx proxy points to 127.0.0.1:3000.

---

## 11) Paths and Ports (recap)
- App: PM2 → port 3000
- Nginx: 80/443 → proxy to app
- Postgres: 5433 (host) → 5432 (container)
- Redis: 6380 (host) → 6379 (container)

You're ready to deploy. Follow steps in order and replace placeholders (YOUR_DOMAIN, secrets, keys).
