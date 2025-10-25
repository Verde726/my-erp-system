# Production Readiness Checklist

Complete checklist before deploying ERP system to production.

## Pre-Deployment Checklist

### 1. Code Quality ✓

- [ ] All tests passing (`npm run test:run`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] No hardcoded credentials or secrets
- [ ] All console.logs removed or replaced with proper logging
- [ ] Error handling implemented for all API routes
- [ ] Input validation with Zod on all endpoints

### 2. Database ✓

- [ ] Database schema finalized and reviewed
- [ ] All migrations tested and applied
- [ ] Database indexes created (see `docs/PERFORMANCE.md`)
- [ ] Connection pooling configured
- [ ] Query timeouts set
- [ ] Backup strategy implemented and tested
- [ ] Database credentials are strong and secure
- [ ] PostgreSQL version 14+ confirmed
- [ ] SSL/TLS enabled for database connections

### 3. Security ✓

- [ ] `NEXTAUTH_SECRET` generated with strong randomness (32+ chars)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Database user has minimum required permissions
- [ ] No default/weak passwords
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] SQL injection prevention (using Prisma parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF protection configured (Next.js built-in)
- [ ] Security headers configured:
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  ```
- [ ] Dependencies scanned for vulnerabilities:
  ```bash
  npm audit
  npm audit fix
  ```
- [ ] Secrets not committed to Git (check with `git log -p | grep -i password`)
- [ ] `.env` files in `.gitignore`

### 4. Environment Configuration ✓

- [ ] `.env.production` created and configured
- [ ] All required environment variables set:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `NODE_ENV=production`
- [ ] Environment variables validated
- [ ] No development/test values in production config
- [ ] Logging level set appropriately (`LOG_LEVEL=info`)
- [ ] `NEXT_TELEMETRY_DISABLED=1` if desired

### 5. Performance ✓

- [ ] Database queries optimized with indexes
- [ ] N+1 queries eliminated (use Prisma `include`)
- [ ] Database connection pool configured:
  - `DATABASE_POOL_MIN=2`
  - `DATABASE_POOL_MAX=10`
- [ ] Next.js production build tested (`npm run build`)
- [ ] Static assets optimized (images, CSS, JS)
- [ ] Bundle size analyzed and optimized
- [ ] API response times tested (< 500ms target)
- [ ] Caching strategy implemented where appropriate
- [ ] CDN configured for static assets (if using)

### 6. Monitoring & Logging ✓

- [ ] Health check endpoint working (`/api/health`)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom, etc.)
- [ ] Error tracking set up (Sentry, Rollbar, etc.)
- [ ] Log aggregation configured (CloudWatch, Datadog, etc.)
- [ ] Alerts configured for:
  - Application downtime
  - High error rates
  - Database connection failures
  - High memory/CPU usage
  - Slow query performance
- [ ] Dashboard created for key metrics

### 7. Backup & Recovery ✓

- [ ] Automated database backups scheduled
- [ ] Backup retention policy defined (7-30 days)
- [ ] Backups stored off-site (S3, GCS, etc.)
- [ ] Backup restoration tested successfully
- [ ] Point-in-time recovery strategy documented
- [ ] Disaster recovery plan documented
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined

### 8. Deployment Infrastructure ✓

**For Docker Deployment:**
- [ ] Docker and Docker Compose installed
- [ ] Dockerfile reviewed and optimized
- [ ] `docker-compose.yml` configured for production
- [ ] Multi-stage build working
- [ ] Container health checks configured
- [ ] Container logs accessible
- [ ] Restart policy set (`restart: unless-stopped`)
- [ ] Resource limits configured (memory, CPU)
- [ ] Volumes configured for data persistence

**For Cloud Platform (Vercel/Railway/AWS):**
- [ ] Platform account set up
- [ ] Billing configured and limits set
- [ ] Auto-scaling configured (if applicable)
- [ ] Load balancer configured (if needed)
- [ ] SSL certificate provisioned

### 9. Domain & SSL ✓

- [ ] Domain name registered
- [ ] DNS records configured:
  - A record pointing to server IP
  - AAAA record for IPv6 (optional)
  - CNAME for www (if applicable)
- [ ] SSL certificate obtained (Let's Encrypt, Cloudflare, etc.)
- [ ] SSL auto-renewal configured
- [ ] HTTPS redirect configured (HTTP → HTTPS)
- [ ] SSL grade verified (A+ on SSL Labs)
- [ ] HSTS header configured

### 10. CI/CD Pipeline ✓

- [ ] GitHub Actions workflows configured
- [ ] Tests run on every PR
- [ ] Automated deployment on merge to main
- [ ] Rollback procedure documented
- [ ] Environment secrets configured in CI/CD
- [ ] Build artifacts cached for faster builds
- [ ] Deployment notifications configured (Slack, email)

### 11. Documentation ✓

- [ ] `docs/DEPLOYMENT.md` completed
- [ ] `docs/SETUP.md` updated for production
- [ ] API documentation complete (`docs/API.md`)
- [ ] Database schema documented (`docs/DATABASE.md`)
- [ ] Runbooks created for common operations:
  - Deployment procedure
  - Rollback procedure
  - Database migration
  - Backup and restore
  - Scaling procedures
- [ ] Troubleshooting guide created
- [ ] Contact information documented (on-call, escalation)

### 12. Testing ✓

- [ ] All unit tests passing (79+ tests)
- [ ] Integration tests completed
- [ ] End-to-end tests run successfully
- [ ] Performance testing done (load testing)
- [ ] Security testing completed (penetration testing)
- [ ] Browser compatibility tested:
  - Chrome/Edge (latest 2 versions)
  - Firefox (latest 2 versions)
  - Safari (latest version)
- [ ] Mobile responsiveness tested
- [ ] Accessibility testing (WCAG 2.1 Level AA)

### 13. Data Management ✓

- [ ] Initial data seeding strategy defined
- [ ] Data migration from legacy system tested (if applicable)
- [ ] Data validation rules implemented
- [ ] Data retention policies defined
- [ ] GDPR/privacy compliance reviewed (if applicable)
- [ ] User data export functionality implemented
- [ ] Data deletion procedures documented

### 14. User Access & Authentication ✓

- [ ] User roles defined (Operator, Lead, Admin)
- [ ] Role-based access control (RBAC) implemented
- [ ] Password requirements enforced:
  - Minimum 8 characters
  - Mix of uppercase, lowercase, numbers
  - Special characters
- [ ] Multi-factor authentication considered
- [ ] Session timeout configured
- [ ] Account lockout policy implemented
- [ ] Password reset flow tested
- [ ] Initial admin account created

### 15. Compliance & Legal ✓

- [ ] Terms of Service created (if applicable)
- [ ] Privacy Policy created (if applicable)
- [ ] GDPR compliance reviewed (if EU users)
- [ ] Data processing agreements signed
- [ ] License compliance verified (all dependencies)
- [ ] Audit logging implemented for compliance
- [ ] Data encryption at rest (database)
- [ ] Data encryption in transit (SSL/TLS)

---

## Post-Deployment Checklist

### Immediate (Within 1 Hour)

- [ ] Health check passing (`/api/health` returns 200)
- [ ] Application accessible at production URL
- [ ] SSL certificate valid and working
- [ ] Database migrations applied successfully
- [ ] Initial data loaded (if applicable)
- [ ] Admin user can log in
- [ ] Test CRUD operations on all main entities:
  - Products
  - BOM Items
  - Sales Orders
  - Production Schedules
- [ ] Error tracking reporting correctly
- [ ] Logs being collected

### Within 24 Hours

- [ ] Monitor error rates (< 1% target)
- [ ] Monitor response times (< 500ms target)
- [ ] Monitor uptime (99.9% target)
- [ ] Verify backups running and stored correctly
- [ ] Review security logs for anomalies
- [ ] Confirm monitoring alerts working
- [ ] Test user registration and login flows
- [ ] Performance baseline established

### Within 1 Week

- [ ] User feedback collected
- [ ] Performance tuning based on real usage
- [ ] Identify and fix any bugs reported
- [ ] Optimize slow queries identified in logs
- [ ] Review and adjust resource allocation (CPU/memory)
- [ ] Conduct post-deployment retrospective
- [ ] Update documentation with any learnings

---

## Rollback Plan

If critical issues arise post-deployment:

### 1. Immediate Rollback (< 5 minutes)

**For Docker:**
```bash
cd /var/www/erp-system
git checkout <previous-commit>
docker compose up -d --build
```

**For Vercel/Railway:**
```bash
# Revert to previous deployment in dashboard
# Or via CLI:
vercel rollback <deployment-url>
```

### 2. Database Rollback (< 15 minutes)

```bash
# Stop application
docker compose stop app

# Restore database from backup
docker compose exec postgres psql -U erp_user -d erp_production < backup-YYYYMMDD.sql

# Restart application
docker compose start app
```

### 3. Communication Plan

- [ ] Notify users of outage via status page
- [ ] Communicate ETA for resolution
- [ ] Post incident report after resolution

---

## Production Metrics to Monitor

### Application Metrics
- **Uptime:** Target 99.9% (8.76 hours downtime/year)
- **Response Time:** Target < 500ms (95th percentile)
- **Error Rate:** Target < 1%
- **Request Rate:** Baseline + trend monitoring

### Database Metrics
- **Connection Pool Usage:** < 80% of max
- **Query Performance:** Slow query threshold > 1s
- **Database Size:** Monitor growth rate
- **Replication Lag:** < 1 second (if using replication)

### Infrastructure Metrics
- **CPU Usage:** < 70% average
- **Memory Usage:** < 80% of available
- **Disk Usage:** < 80% with alerts at 70%
- **Network I/O:** Monitor for anomalies

### Business Metrics
- **Active Users:** Daily/weekly active users
- **Production Schedules Created:** Daily count
- **Material Requirements Generated:** Daily count
- **Average Session Duration:** Engagement metric

---

## Emergency Contacts

| Role | Name | Contact | Escalation |
|------|------|---------|------------|
| Primary On-Call | [Name] | [Phone/Email] | - |
| Secondary On-Call | [Name] | [Phone/Email] | 15 min |
| Database Admin | [Name] | [Phone/Email] | 30 min |
| Security Lead | [Name] | [Phone/Email] | Immediate (security issues) |
| CTO/Engineering Lead | [Name] | [Phone/Email] | 1 hour |

---

## Sign-Off

Before going to production, obtain sign-off from:

- [ ] Engineering Lead: _________________ Date: _______
- [ ] QA/Testing Lead: _________________ Date: _______
- [ ] DevOps/Infrastructure: ____________ Date: _______
- [ ] Security Officer: ________________ Date: _______
- [ ] Product Owner: ___________________ Date: _______
- [ ] CTO/VP Engineering: _______________ Date: _______

---

## Production Launch Date

**Target Launch Date:** ___________________

**Actual Launch Date:** ___________________

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

**Last Updated:** Phase 7 - Deployment Complete
**Version:** 1.0.0
