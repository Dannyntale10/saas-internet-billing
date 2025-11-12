# Production Deployment Guide

## Prerequisites

- Node.js 18+ or Docker
- Database (SQLite for development, PostgreSQL recommended for production)
- Environment variables configured

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Manual Deployment

```bash
# Run setup script
./scripts/setup-production.sh

# Start application
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - Random secret for JWT signing
- `NODE_ENV=production`

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Metrics (Admin only)

```bash
curl http://localhost:3000/api/metrics
```

## Logging

Logs are stored in the `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs
- `access-YYYY-MM-DD.log` - HTTP access logs

Logs are automatically rotated daily and kept for 14-30 days.

## Performance Optimization

1. **Database**: Use PostgreSQL for production (better performance and features)
2. **Caching**: Consider Redis for rate limiting and session storage
3. **CDN**: Use a CDN for static assets
4. **Monitoring**: Set up Sentry or similar for error tracking

## Security Checklist

- [ ] Change all default passwords
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Database backups

## Scaling

For high traffic:
1. Use a load balancer (nginx, Cloudflare)
2. Deploy multiple instances
3. Use Redis for shared state
4. Database connection pooling
5. CDN for static assets

