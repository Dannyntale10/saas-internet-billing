#!/bin/bash

# Production setup script
set -e

echo "🚀 Setting up production environment..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ is required. Current version: $(node -v)"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy || npx prisma db push

# Build application
echo "🏗️  Building application..."
npm run build

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p uploads/invoices

# Set permissions
chmod -R 755 logs
chmod -R 755 uploads

echo "✅ Production setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Set environment variables in .env"
echo "  2. Start the application: npm start"
echo "  3. Or use Docker: docker-compose up -d"

