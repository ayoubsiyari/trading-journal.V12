#!/bin/bash

# Trading Journal Deployment Script for Hostinger VPS
# Run this script on your VPS after initial setup

set -e  # Exit on any error

echo "🚀 Starting Trading Journal Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="talaria-log.com"
APP_DIR="/var/www/trading-journal"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DB_NAME="journaldb"
DB_USER="journaluser"
DB_PASSWORD="your_secure_password_here"

echo -e "${GREEN}📋 Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"
echo "Database: $DB_NAME"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y python3 python3-pip python3-venv nginx git postgresql postgresql-contrib curl

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or copy your application
print_status "Setting up application files..."
# If you have a git repository:
# git clone https://github.com/ayoubsiyari/talaria-log.git $APP_DIR
# Or copy files manually to $APP_DIR

# Set up PostgreSQL
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Set up backend
print_status "Setting up Flask backend..."
cd $BACKEND_DIR

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements-prod.txt

# Create environment file
cat > .env << EOF
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=https://$DOMAIN
UPLOAD_FOLDER=uploads
EOF

# Create uploads directory
mkdir -p uploads

# Initialize database
python3 -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"

# Set up frontend
print_status "Setting up React frontend..."
cd $FRONTEND_DIR

# Install dependencies
npm install

# Update production environment
sed -i "s/yourdomain.com/$DOMAIN/g" env.production

# Build for production
npm run build

# Copy build to nginx directory
sudo cp -r build/* /var/www/html/

# Set up Nginx
print_status "Setting up Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Frontend (React app)
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Security headers for API
    location ~ ^/api {
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Set up systemd service for Gunicorn
print_status "Setting up systemd service..."
sudo tee /etc/systemd/system/trading-journal.service > /dev/null << EOF
[Unit]
Description=Trading Journal Flask Application
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable trading-journal
sudo systemctl start trading-journal
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
print_status "Setting up SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email your-email@example.com

# Final status check
print_status "Checking service status..."
sudo systemctl status trading-journal --no-pager
sudo systemctl status nginx --no-pager

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your domain DNS to point to this server"
echo "2. Test your application at https://$DOMAIN"
echo "3. Set up regular backups"
echo "4. Monitor logs: sudo journalctl -u trading-journal -f"

print_warning "Remember to:"
echo "- Change default passwords"
echo "- Set up firewall rules"
echo "- Configure regular backups"
echo "- Monitor server resources" 