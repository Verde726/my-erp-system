# Quick Start Deployment Guide

Get your ERP system running in production in under 30 minutes.

## Prerequisites

- Ubuntu 20.04+ server with root access
- Domain name pointing to your server
- 2GB+ RAM, 20GB+ disk space

## 1. Install Docker (5 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker compose version
```

## 2. Clone and Configure (5 minutes)

```bash
# Create directory
sudo mkdir -p /var/www/erp-system
cd /var/www/erp-system

# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/erp-system.git .

# Create environment file
cp .env.production.example .env

# Generate secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env

# Edit configuration
nano .env
```

**Update these values in `.env`:**
```env
DATABASE_URL=postgresql://erp_user:YOUR_STRONG_PASSWORD@postgres:5432/erp_production?schema=public
NEXTAUTH_URL=https://erp.yourdomain.com
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
```

## 3. Start Application (2 minutes)

```bash
# Build and start
docker compose up -d --build

# Check logs
docker compose logs -f app

# Wait for: "ready on http://0.0.0.0:3000"
```

## 4. Install Nginx + SSL (10 minutes)

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/erp-system
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name erp.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/erp-system /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Obtain SSL certificate (follow prompts)
sudo certbot --nginx -d erp.yourdomain.com

# Reload Nginx
sudo systemctl reload nginx
```

## 5. Verify Deployment (3 minutes)

```bash
# Health check
curl https://erp.yourdomain.com/api/health

# Expected response:
# {"status":"healthy","database":{"status":"connected"},...}
```

Visit: `https://erp.yourdomain.com`

## 6. Set Up Backups (5 minutes)

```bash
# Create backup script
sudo mkdir -p /var/backups/erp-database

cat > /var/backups/erp-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/erp-database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cd /var/www/erp-system
docker compose exec -T postgres pg_dump -U erp_user erp_production | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /var/backups/erp-backup.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/backups/erp-backup.sh") | crontab -

# Test backup
/var/backups/erp-backup.sh
ls -lh /var/backups/erp-database/
```

## Done! 🎉

Your ERP system is now running in production!

### Next Steps

1. **Configure monitoring:** Set up UptimeRobot for health checks
2. **Review security:** Complete `docs/PRODUCTION_CHECKLIST.md`
3. **Add users:** Create admin accounts
4. **Customize:** Update branding and settings

### Common Commands

```bash
# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Update to latest version
git pull origin main
docker compose up -d --build

# Database migrations
docker compose exec app npx prisma migrate deploy

# Access database
docker compose exec postgres psql -U erp_user -d erp_production
```

### Troubleshooting

**App won't start:**
```bash
docker compose logs app
```

**Database connection error:**
- Check `.env` file has correct `DATABASE_URL`
- Verify password matches in `.env` and `docker-compose.yml`

**Can't access via domain:**
- Check DNS: `dig erp.yourdomain.com`
- Check Nginx: `sudo nginx -t`
- Check firewall: `sudo ufw allow 80,443/tcp`

### Support

- Full documentation: `docs/DEPLOYMENT.md`
- Production checklist: `docs/PRODUCTION_CHECKLIST.md`
- Troubleshooting: `docs/DEPLOYMENT.md#troubleshooting`

---

**Deployment time:** ~30 minutes
**Difficulty:** Intermediate
