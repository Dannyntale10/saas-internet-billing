# Setup Instructions

## Prerequisites

Before running the application, you need to install Node.js and npm.

### Install Node.js and npm

**On Ubuntu/Debian:**
```bash
# Install Node.js 18+ and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**On macOS:**
```bash
# Using Homebrew
brew install node

# Verify installation
node --version
npm --version
```

**On Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

## Quick Start

Once Node.js is installed, run these commands:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Push database schema
npm run db:push

# 4. Seed database with sample data
npm run db:seed

# 5. Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Access Points

- **Client Page**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin

## Default Credentials

After seeding:
- **Admin Email**: admin@jenda.com
- **Admin Password**: admin123

⚠️ **Change these in production!**

## Sample Vouchers

After seeding, you can use these voucher codes:
- `6HOURS-0001`, `6HOURS-0002`, `6HOURS-0003`
- `24HOURS-0001`, `24HOURS-0002`, `24HOURS-0003`
- `WEEK-0001`, `WEEK-0002`, `WEEK-0003`
- `MONTH-0001`, `MONTH-0002`, `MONTH-0003`

