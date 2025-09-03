#!/bin/bash

# AI School - Rollback to Docker Services
# This script restores Docker services if the migration fails

set -e  # Exit on any error

echo "🔄 Starting rollback to Docker services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]]; then
    print_error "Please run this script from the AI-school project root directory"
    exit 1
fi

print_status "Stopping native services..."

# Stop AI School web service
if systemctl is-active --quiet ai-school-web; then
    sudo systemctl stop ai-school-web
    sudo systemctl disable ai-school-web
    print_success "AI School web service stopped and disabled"
fi

# Remove systemd service file
if [[ -f "/etc/systemd/system/ai-school-web.service" ]]; then
    sudo rm /etc/systemd/system/ai-school-web.service
    sudo systemctl daemon-reload
    print_success "Systemd service file removed"
fi

print_status "Starting Docker services..."

# Start Docker containers
docker compose up -d

print_success "Docker services started"

print_status "Restoring environment variables..."

# Create Docker environment file
cat > web/.env << EOF
# Database Configuration (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ai_school?schema=public"

# Redis Configuration (Docker Redis)
REDIS_URL="redis://localhost:6380"

# NextAuth Configuration
NEXTAUTH_SECRET="ai_school_nextauth_secret_2024_minimum_32_characters_long"
NEXTAUTH_URL="http://localhost:3006"

# Application Configuration
NODE_ENV="development"
PORT=3006
EOF

print_success "Environment file restored to Docker configuration"

print_status "Testing Docker connections..."

# Wait for services to be ready
sleep 10

# Test PostgreSQL connection
if psql -h localhost -p 5433 -U postgres -d ai_school -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Docker PostgreSQL connection successful"
else
    print_error "Docker PostgreSQL connection failed"
    exit 1
fi

# Test Redis connection
if redis-cli -h localhost -p 6380 ping | grep -q PONG; then
    print_success "Docker Redis connection successful"
else
    print_error "Docker Redis connection failed"
    exit 1
fi

print_status "Building application with Docker configuration..."
cd web

# Install dependencies
pnpm install

# Build the application
pnpm build

print_success "Application built successfully"

# Run database migrations
print_status "Running database migrations..."
pnpm prisma migrate deploy

print_success "Database migrations completed"

cd ..

echo ""
print_success "🔄 Rollback completed successfully!"
echo ""
echo "📋 Docker services restored:"
echo "  • PostgreSQL running on port 5433 (Docker)"
echo "  • Redis running on port 6380 (Docker)"
echo "  • Environment file restored to Docker configuration"
echo ""
echo "🔄 To start development: cd web && pnpm dev"
echo "🐳 To manage Docker: docker compose up/down"
echo ""
print_warning "⚠️  You are now back to using Docker services!"
echo ""
echo "🔄 To switch back to master branch: git checkout master"
echo ""
