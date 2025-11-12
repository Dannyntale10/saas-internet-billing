# Quick Start Guide

Get your SaaS Internet Billing System up and running in minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup Database

### Option A: Local PostgreSQL

1. Install PostgreSQL if not already installed
2. Create a database:
```bash
createdb internet_billing
```

3. Update `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/internet_billing?schema=public"
```

### Option B: Docker (Easiest)

```bash
docker-compose up -d postgres
```

This will start PostgreSQL on port 5432.

## Step 3: Configure Environment

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/internet_billing?schema=public"

# NextAuth (generate secret: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Mobile Money (optional for testing)
MTN_API_KEY=""
MTN_API_SECRET=""
MTN_ENVIRONMENT="sandbox"

AIRTEL_API_KEY=""
AIRTEL_API_SECRET=""
AIRTEL_ENVIRONMENT="sandbox"
```

## Step 4: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

## Step 5: Create Admin User

```bash
npm run create-admin
```

Enter:
- Email: admin@example.com
- Name: Admin User
- Password: (choose a secure password)

## Step 6: Start Development Server

```bash
npm run dev
```

## Step 7: Access Application

1. Open http://localhost:3000
2. Login with your admin credentials
3. Start creating clients and vouchers!

## Next Steps

1. **Create a Client:**
   - Login as admin
   - Go to Clients → Add Client
   - Create a client account

2. **Client Setup:**
   - Login as the client
   - Configure router settings (Router Config)
   - Create vouchers (Vouchers → Create Voucher)

3. **Test Payment Flow:**
   - Create an end-user account
   - Login as end-user
   - Buy a voucher using mobile money

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

### Port Already in Use
- Change port: `PORT=3001 npm run dev`
- Or kill process using port 3000

### Prisma Errors
- Run `npx prisma generate` again
- Check database connection
- Verify schema is correct

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

