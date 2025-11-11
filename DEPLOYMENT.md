# Deployment Guide

This guide will help you deploy the SaaS Internet Billing System to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (recommended: managed database service)
- Domain name with SSL certificate
- MikroTik router with RouterOS API enabled
- MTN and/or Airtel mobile money API credentials

## Environment Setup

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Configure environment variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"

# Mobile Money APIs
MTN_API_KEY="your-mtn-api-key"
MTN_API_SECRET="your-mtn-api-secret"
MTN_ENVIRONMENT="production"

AIRTEL_API_KEY="your-airtel-api-key"
AIRTEL_API_SECRET="your-airtel-api-secret"
AIRTEL_ENVIRONMENT="production"

# Application
APP_NAME="Internet Billing System"
APP_URL="https://yourdomain.com"
```

## Database Setup

1. **Create database:**
```bash
# Using PostgreSQL CLI
createdb internet_billing
```

2. **Run migrations:**
```bash
npm install
npx prisma generate
npx prisma db push
```

3. **Create admin user:**
You'll need to create an admin user manually or through a script. Here's a sample script:

```typescript
// scripts/create-admin.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    }
  })
  
  console.log('Admin user created:', admin)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Set environment variables in Vercel dashboard**

4. **Configure database connection**

### Option 2: Docker

1. **Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Build and run:**
```bash
docker build -t internet-billing .
docker run -p 3000:3000 --env-file .env internet-billing
```

### Option 3: Traditional Server (Ubuntu/Debian)

1. **Install Node.js and PM2:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

2. **Clone and setup:**
```bash
git clone <your-repo>
cd saas-internet-billing
npm install
npx prisma generate
npx prisma db push
npm run build
```

3. **Start with PM2:**
```bash
pm2 start npm --name "internet-billing" -- start
pm2 save
pm2 startup
```

4. **Setup Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Router Configuration

1. **Enable RouterOS API on MikroTik:**
   - Go to IP → Services
   - Enable API service
   - Set API port (default: 8728)
   - Configure firewall rules to allow API access

2. **Create API user:**
   - Go to System → Users
   - Create user with API read/write permissions
   - Use this user in router configuration

3. **Configure in application:**
   - Login as client
   - Go to Router Config
   - Enter router details

## Mobile Money Integration

### MTN Mobile Money

1. Register at [MTN Developer Portal](https://momodeveloper.mtn.com)
2. Create an app and get API credentials
3. Add credentials to environment variables
4. Test in sandbox mode first

### Airtel Money

1. Register at [Airtel Developer Portal](https://developer.airtel.com)
2. Create an app and get API credentials
3. Add credentials to environment variables
4. Test in sandbox mode first

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable database SSL connections
- [ ] Set up monitoring and logging

## Monitoring

Consider setting up:
- Application monitoring (e.g., Sentry)
- Uptime monitoring (e.g., UptimeRobot)
- Database monitoring
- Server resource monitoring

## Backup Strategy

1. **Database backups:**
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

2. **Automate backups:**
- Use managed database service with automatic backups
- Or set up cron job for regular backups

## Support

For issues or questions, refer to the main README.md or contact support.

