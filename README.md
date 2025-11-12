# SaaS Internet Billing System

A comprehensive multi-tenant SaaS application for internet service providers to manage their clients, vouchers, payments, and router integration.

## Features

- **Multi-Tenant Architecture**: Admin manages clients, clients manage their end-users
- **Voucher System**: Generate and manage internet access vouchers
- **Mobile Money Integration**: MTN and Airtel mobile money payment support
- **Router Integration**: MikroTik RouterOS API integration for bandwidth control
- **Real-time Monitoring**: Monitor usage, bandwidth, and user activity
- **Role-Based Access Control**: Secure access for admin, clients, and end-users
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **Router Integration**: MikroTik RouterOS API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- MikroTik router (for router integration)
- MTN and/or Airtel mobile money API credentials (optional for testing)

### Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create .env file
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your application URL (http://localhost:3000 for development)

4. **Set up the database:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Or use migrations for production
npx prisma migrate dev
```

5. **Create admin user:**
```bash
npm run create-admin
# Or use the JavaScript version:
node scripts/create-admin.js
```

6. **Run the development server:**
```bash
npm run dev
```

7. **Open [http://localhost:3000](http://localhost:3000) in your browser**

8. **Login with your admin credentials**

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The application uses a multi-tenant architecture:
- **Admin**: Top-level user who manages clients
- **Clients**: ISPs who manage their end-users
- **End-Users**: Final consumers of internet services

## API Documentation

API endpoints are available at `/api/*`. Key endpoints:
- `/api/auth/*` - Authentication
- `/api/vouchers/*` - Voucher management
- `/api/payments/*` - Payment processing
- `/api/router/*` - Router integration
- `/api/monitoring/*` - Usage monitoring

## Deployment

This application is ready for deployment on platforms like:
- Vercel (recommended for Next.js)
- AWS
- Google Cloud Platform
- DigitalOcean

Make sure to:
1. Set up a PostgreSQL database
2. Configure all environment variables
3. Set up SSL certificates
4. Configure router API access

## License

Proprietary - All rights reserved

