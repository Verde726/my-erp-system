# ERP System Deployment Guide

Complete guide for deploying the Next.js ERP/MRP system to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Docker Deployment (Recommended)](#docker-deployment)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Database Migration](#database-migration)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 20+ installed (for local builds)
- [ ] Docker & Docker Compose installed (for Docker deployment)
- [ ] PostgreSQL database (version 14+)
- [ ] Domain name and SSL certificate (for production)
- [ ] Git repository access
- [ ] Environment variables configured

---

## Deployment Options

### Option 1: Docker Deployment (Recommended)
**Best for:** VPS, DigitalOcean, AWS EC2, self-hosted servers

**Pros:**
- Complete isolation and reproducibility
- Built-in PostgreSQL and pgAdmin
- Easy rollbacks and updates
- Production-ready configuration

### Option 2: Vercel
**Best for:** Quick deployments, serverless architecture

**Pros:**
- Zero configuration
- Automatic SSL and CDN
- Built-in CI/CD
- Free tier available

**Cons:**
- Requires external PostgreSQL (Neon, Supabase, etc.)
- Serverless cold starts

### Option 3: Railway
**Best for:** Full-stack apps with database

**Pros:**
- Integrated PostgreSQL
- Simple deployment
- Reasonable pricing

### Option 4: AWS/GCP/Azure
**Best for:** Enterprise deployments

**Pros:**
- Full control and scalability
- Advanced features (load balancing, auto-scaling)

**Cons:**
- Complex setup
- Higher costs

---

## Docker Deployment

### Step 1: Prepare Your Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 2: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/erp-system
cd /var/www/erp-system

# Clone repository
git clone https://github.com/yourusername/erp-system.git .

# Or pull latest changes
git pull origin main
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.production.example .env

# Edit environment variables
nano .env
```

**Required variables:**
```env
DATABASE_URL=postgresql://erp_user:STRONG_PASSWORD@postgres:5432/erp_production?schema=public
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://erp.yourdomain.com
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=STRONG_PASSWORD
POSTGRES_DB=erp_production
```

### Step 4: Build and Start

```bash
# Build and start containers
docker compose up -d --build

# View logs
docker compose logs -f app

# Check running containers
docker compose ps
```

### Step 5: Run Database Migrations

Migrations run automatically on container start, but you can manually run:

```bash
docker compose exec app npx prisma migrate deploy
```

### Step 6: Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Should return:
# {
#   "status": "healthy",
#   "database": { "status": "connected" },
#   ...
# }
```

### Step 7: Configure Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/erp-system
server {
    listen 80;
    server_name erp.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name erp.yourdomain.com;

    # SSL Configuration (use certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yourdomain.com/privkey.pem;

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

Enable site and obtain SSL certificate:

```bash
# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/erp-system /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d erp.yourdomain.com

# Reload Nginx
sudo systemctl reload nginx
```

---

## Platform-Specific Guides

### Vercel Deployment

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login and deploy:**
```bash
vercel login
vercel --prod
```

3. **Configure environment variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

4. **Set up external PostgreSQL** (Neon, Supabase, or Railway)

5. **Run migrations** after first deployment:
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

### Railway Deployment

1. **Create new project** on [Railway.app](https://railway.app)

2. **Add PostgreSQL service:**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy connection string

3. **Add application service:**
   - Click "New" → "GitHub Repo"
   - Connect your repository
   - Railway auto-detects Next.js

4. **Configure environment variables:**
   - `DATABASE_URL` (use Railway PostgreSQL URL)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

5. **Add build command** (Settings → Build Command):
```bash
npx prisma generate && npx prisma migrate deploy && npm run build
```

6. **Deploy:**
   - Push to main branch
   - Railway auto-deploys

### DigitalOcean App Platform

1. **Create new app** in DigitalOcean dashboard

2. **Connect GitHub repository**

3. **Configure build settings:**
   - Build Command: `npm run build`
   - Run Command: `npm start`

4. **Add PostgreSQL database** (Managed Database or component)

5. **Configure environment variables**

6. **Deploy**

### AWS Elastic Beanstalk

See `docs/DEPLOYMENT_AWS.md` for detailed AWS deployment guide.

---

## Database Migration

### Production Migration Strategy

**Before migrating:**

1. **Backup current database:**
```bash
# Docker deployment
docker compose exec postgres pg_dump -U erp_user erp_production > backup-$(date +%Y%m%d).sql

# External PostgreSQL
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

2. **Test migrations locally:**
```bash
# Create test database
createdb erp_test

# Run migrations against test database
DATABASE_URL=postgresql://user:pass@localhost:5432/erp_test npx prisma migrate deploy
```

3. **Deploy migrations:**
```bash
# Docker
docker compose exec app npx prisma migrate deploy

# Vercel/Railway (via CLI)
npx prisma migrate deploy
```

### Rollback Strategy

If migration fails:

```bash
# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD.sql

# Or use Prisma migrate resolve
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Environment Variables

### Critical Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Authentication secret (32+ chars) | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production domain | `https://erp.yourdomain.com` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_POOL_MIN` | Min DB connections | `2` |
| `DATABASE_POOL_MAX` | Max DB connections | `10` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_MAX` | API rate limit (req/min) | `100` |

---

## Post-Deployment

### 1. Verify Application

```bash
# Health check
curl https://erp.yourdomain.com/api/health

# Test API endpoints
curl https://erp.yourdomain.com/api/products
```

### 2. Seed Initial Data (Optional)

```bash
# If you have a seed script
docker compose exec app npm run db:seed
```

### 3. Set Up Monitoring

- **Health checks:** Configure uptime monitoring (UptimeRobot, Pingdom)
- **Error tracking:** Set up Sentry or similar
- **Log aggregation:** Configure log shipping to CloudWatch, Datadog, etc.

### 4. Configure Backups

```bash
# Create backup script
cat > /var/backups/erp-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/erp-database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T postgres pg_dump -U erp_user erp_production | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /var/backups/erp-backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /var/backups/erp-backup.sh") | crontab -
```

---

## Monitoring & Maintenance

### Health Monitoring

Monitor these endpoints:

- **Health:** `GET /api/health` (should return 200)
- **Database:** Check `database.status: "connected"`
- **Response time:** Should be < 500ms

### Log Management

```bash
# View application logs
docker compose logs -f app

# View database logs
docker compose logs -f postgres

# View logs from specific time
docker compose logs --since 30m app
```

### Performance Monitoring

Monitor:
- Response times (< 500ms for API calls)
- Database query performance
- Memory usage (< 80% of available)
- CPU usage (< 70% average)

### Updates and Maintenance

```bash
# Pull latest code
cd /var/www/erp-system
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Run migrations (if any)
docker compose exec app npx prisma migrate deploy
```

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker compose logs app
```

**Common issues:**
- Database not ready: Wait 30s for PostgreSQL to initialize
- Missing environment variables: Check `.env` file
- Port conflict: Change port in `docker-compose.yml`

### Database Connection Errors

**Verify database is running:**
```bash
docker compose ps postgres
```

**Test connection:**
```bash
docker compose exec postgres psql -U erp_user -d erp_production -c "SELECT 1"
```

**Check connection string:**
- Ensure `DATABASE_URL` is correct
- For Docker: host should be `postgres` (not `localhost`)
- SSL mode: Use `sslmode=require` for external databases

### Migration Failures

**Check migration status:**
```bash
docker compose exec app npx prisma migrate status
```

**Mark migration as applied:**
```bash
docker compose exec app npx prisma migrate resolve --applied <migration_name>
```

**Force reset (DESTRUCTIVE):**
```bash
# Only in development!
docker compose exec app npx prisma migrate reset
```

### High Memory Usage

**Check container stats:**
```bash
docker stats
```

**Increase Node.js memory limit:**
```yaml
# docker-compose.yml
environment:
  NODE_OPTIONS: "--max-old-space-size=2048"
```

### SSL Certificate Issues

**Renew Let's Encrypt certificate:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

**Check certificate expiry:**
```bash
sudo certbot certificates
```

---

## Security Checklist

Before going live:

- [ ] Strong passwords for database and admin users
- [ ] `NEXTAUTH_SECRET` is randomly generated (32+ characters)
- [ ] SSL/TLS certificate installed and auto-renewal configured
- [ ] Firewall configured (only ports 80, 443, and SSH open)
- [ ] Database not exposed to public internet
- [ ] Regular backups configured and tested
- [ ] Monitoring and alerting set up
- [ ] Rate limiting enabled
- [ ] Environment variables not committed to Git
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] CORS configured properly
- [ ] Security headers configured in Nginx/middleware

---

## Next Steps

After successful deployment:

1. **Configure user authentication** (if not already done)
2. **Set up automated backups** with off-site storage
3. **Implement monitoring dashboards**
4. **Create runbooks** for common operations
5. **Train team members** on deployment procedures
6. **Plan for scaling** (load balancing, database replication)

---

## Support

For deployment issues:
- Check GitHub Issues: [github.com/yourusername/erp-system/issues](https://github.com/yourusername/erp-system/issues)
- Review logs carefully
- Consult platform-specific documentation

---

**Last Updated:** Phase 7 - Deployment Complete
