#!/bin/bash

# AI School - Migration from Docker to Native Services
# This script automates the migration process

set -e  # Exit on any error

echo "🚀 Starting migration from Docker to Native Services..."

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]]; then
    print_error "Please run this script from the AI-school project root directory"
    exit 1
fi

print_status "Checking system requirements..."

# Check if PostgreSQL is already installed
if systemctl is-active --quiet postgresql; then
    print_warning "PostgreSQL is already running. Skipping installation."
    POSTGRES_INSTALLED=true
else
    POSTGRES_INSTALLED=false
fi

# Check if Redis is already installed
if systemctl is-active --quiet redis-server; then
    print_warning "Redis is already running. Skipping installation."
    REDIS_INSTALLED=true
else
    REDIS_INSTALLED=false
fi

# Step 1: Install PostgreSQL if not already installed
if [[ "$POSTGRES_INSTALLED" == false ]]; then
    print_status "Installing PostgreSQL 15 with pgvector..."
    
    sudo apt update
    sudo apt install -y postgresql-15 postgresql-15-postgis-3 postgresql-15-pgvector
    
    print_success "PostgreSQL installed successfully"
else
    print_status "PostgreSQL already installed, checking pgvector extension..."
    
    # Check if pgvector extension is available
    if ! sudo -u postgres psql -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';" | grep -q vector; then
        print_error "pgvector extension not available. Please install postgresql-15-pgvector"
        exit 1
    fi
fi

# Step 2: Install Redis if not already installed
if [[ "$REDIS_INSTALLED" == false ]]; then
    print_status "Installing Redis..."
    
    sudo apt install -y redis-server
    print_success "Redis installed successfully"
fi

# Step 3: Configure PostgreSQL
print_status "Configuring PostgreSQL..."

# Create database and user if they don't exist
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'ai_school'" | grep -q 1 || {
    print_status "Creating ai_school database..."
    sudo -u postgres createdb ai_school
}

# Check if user exists
sudo -u postgres psql -c "SELECT 1 FROM pg_user WHERE usename = 'ai_school_user'" | grep -q 1 || {
    print_status "Creating ai_school_user..."
    sudo -u postgres psql -c "CREATE USER ai_school_user WITH PASSWORD 'ai_school_secure_2024';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_school TO ai_school_user;"
}

# Enable pgvector extension
print_status "Enabling pgvector extension..."
sudo -u postgres psql -d ai_school -c "CREATE EXTENSION IF NOT EXISTS vector;"

print_success "PostgreSQL configured successfully"

# Step 4: Configure Redis
print_status "Configuring Redis..."

# Set Redis password
sudo sed -i 's/# requirepass foobared/requirepass ai_school_redis_2024/' /etc/redis/redis.conf

# Ensure Redis only binds to localhost
sudo sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf

# Restart Redis to apply changes
sudo systemctl restart redis-server
sudo systemctl enable redis-server

print_success "Redis configured successfully"

# Step 5: Create environment file
print_status "Creating environment configuration..."

cat > web/.env << EOF
# Database Configuration (Native PostgreSQL)
DATABASE_URL="postgresql://ai_school_user:ai_school_secure_2024@localhost:5432/ai_school?schema=public"

# Redis Configuration (Native Redis)
REDIS_URL="redis://:ai_school_redis_2024@localhost:6379"

# NextAuth Configuration
NEXTAUTH_SECRET="ai_school_nextauth_secret_2024_minimum_32_characters_long"
NEXTAUTH_URL="http://localhost:3000"

# Application Configuration
NODE_ENV="production"
PORT=3000
EOF

print_success "Environment file created"

# Step 6: Test connections
print_status "Testing database connections..."

# Test PostgreSQL
if psql -h localhost -U ai_school_user -d ai_school -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "PostgreSQL connection successful"
else
    print_error "PostgreSQL connection failed"
    exit 1
fi

# Test Redis
if redis-cli -h localhost -p 6379 -a ai_school_redis_2024 ping | grep -q PONG; then
    print_success "Redis connection successful"
else
    print_error "Redis connection failed"
    exit 1
fi

# Step 7: Stop Docker containers
print_status "Stopping Docker containers..."
docker compose down

print_success "Docker containers stopped"

# Step 8: Build and deploy application
print_status "Building application..."
cd web

# Install dependencies
pnpm install

# Build the application
pnpm build

print_success "Application built successfully"

# Step 9: Run database migrations
print_status "Running database migrations..."
pnpm prisma migrate deploy

print_success "Database migrations completed"

# Step 10: Install systemd service
print_status "Installing systemd service..."
cd ..

sudo cp ai-school-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ai-school-web

print_success "Systemd service installed and enabled"

# Step 11: Start services
print_status "Starting services..."

sudo systemctl start ai-school-web

print_success "All services started successfully"

# Step 12: Final verification
print_status "Performing final verification..."

# Check service status
if systemctl is-active --quiet ai-school-web; then
    print_success "AI School web service is running"
else
    print_error "AI School web service failed to start"
    sudo systemctl status ai-school-web
    exit 1
fi

# Check if application responds
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Application is responding on port 3000"
else
    print_warning "Application not responding yet, may need more time to start"
fi

echo ""
print_success "🎉 Migration completed successfully!"
echo ""
echo "📋 Summary of changes:"
echo "  • PostgreSQL running on port 5432 (native)"
echo "  • Redis running on port 6379 (native)"
echo "  • Web application running on port 3000"
echo "  • Systemd service: ai-school-web"
echo ""
echo "🔑 Default credentials (CHANGE THESE IN PRODUCTION!):"
echo "  • PostgreSQL: ai_school_user / ai_school_secure_2024"
echo "  • Redis: ai_school_redis_2024"
echo ""
echo "📁 Environment file created at: web/.env"
echo "🔄 To restart: sudo systemctl restart ai-school-web"
echo "📊 To check status: sudo systemctl status ai-school-web"
echo "📝 To view logs: sudo journalctl -u ai-school-web -f"
echo ""
print_warning "⚠️  IMPORTANT: Change default passwords before going to production!"
echo ""
