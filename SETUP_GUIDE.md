# SETUP_GUIDE.md
# Step-by-Step Setup Instructions for Entertainment Platform

## 🎯 Prerequisites

- Docker & Docker Compose (recommended for easy setup)
- OR: Python 3.11+, PostgreSQL 15+, Redis 7+, Node.js 18+
- Git
- Terminal/Command Prompt

---

## 🐳 Option 1: Docker Setup (Quickest - 5 minutes)

### Step 1: Prepare Environment

```bash
# Navigate to project directory
cd entertainment-platform

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Minimum required:
# - SECRET_KEY (generate a strong key)
# - PAYMENT_WEBHOOK_SECRET
# - SMS_API_KEY (if using SMS service)
```

### Step 2: Start Services

```bash
# Build and start all containers
docker-compose up -d

# Check if all services are running
docker-compose ps

# Expected output:
# CONTAINER         STATUS
# ep-postgres       Up (healthy)
# ep-redis          Up (healthy)
# ep-backend        Up
# ep-celery         Up
# ep-celery-beat    Up
# ep-frontend       Up
# ep-nginx          Up
```

### Step 3: Initialize Database

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser for admin panel
docker-compose exec backend python manage.py createsuperuser
# Follow prompts to enter:
# - Username: admin
# - Email: admin@example.com
# - Password: (strong password)

# Create sample data (optional)
docker-compose exec backend python manage.py shell
# In shell:
# from django.utils import timezone
# from entertainment_platform.models import SubscriptionPlan
# SubscriptionPlan.objects.create(
#     name='Daily Pass',
#     description='Watch for 24 hours',
#     duration_hours=24,
#     price_afn=7.50,
#     features={'streams': 'unlimited', 'games': 'limited'}
# )
# exit()
```

### Step 4: Verify Setup

```bash
# Check backend API
curl http://localhost:8000/api/v1/subscriptions/plans

# Check frontend
open http://localhost:3000

# Check admin panel
open http://localhost:8000/admin
# Login with superuser credentials
```

### Step 5: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery
```

---

## 🛠️ Option 2: Manual Setup (Development)

### Backend Setup

#### Step 1: Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 3: Database Configuration

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Windows: Download from https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql

# Create database
createdb entertainment_platform

# Create user
createuser ep_user -P  # Enter password when prompted

# Grant privileges
psql -d entertainment_platform -c "ALTER USER ep_user CREATEDB;"
```

#### Step 4: Run Migrations

```bash
# From project root
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

#### Step 5: Start Services

```bash
# Terminal 1: Django development server
python manage.py runserver

# Terminal 2: Redis (if not using managed service)
redis-server

# Terminal 3: Celery worker
celery -A config worker -l info

# Terminal 4: Celery Beat
celery -A config beat -l info
```

### Frontend Setup

#### Step 1: Navigate to Frontend

```bash
cd frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Create Environment File

```bash
# Create .env.local
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_DEBUG=true
EOF
```

#### Step 4: Start Development Server

```bash
npm start
# Opens http://localhost:3000 automatically
```

---

## 🧪 Testing the Setup

### API Test Requests

```bash
# 1. Send OTP
curl -X POST http://localhost:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93701234567"}'

# 2. Verify OTP (use code from logs)
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93701234567", "otp_code": "123456"}'

# 3. Get subscription plans
curl -X GET http://localhost:8000/api/v1/subscriptions/plans \
  -H "Content-Type: application/json"

# 4. Get user profile (requires authentication)
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json"
```

### Frontend Test

1. Open http://localhost:3000
2. Enter phone number (e.g., +93701234567)
3. Click "Send OTP"
4. Enter verification code
5. Click "Verify"
6. You should be redirected to dashboard

---

## 🔧 Configuration Reference

### Key Environment Variables

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=False  # Set to True in development
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=entertainment_platform
DB_USER=ep_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Redis & Celery
REDIS_URL=redis://localhost:6379/1
CELERY_BROKER_URL=redis://localhost:6379/0

# OTP
OTP_VALIDITY_MINUTES=5
OTP_MAX_ATTEMPTS=5

# Payment (configure with your provider)
PAYMENT_PROVIDER_URL=https://payment-api.provider.com
PAYMENT_API_KEY=your_api_key
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

# SMS (configure with your provider)
SMS_SERVICE_URL=https://sms-api.provider.com/send
SMS_API_KEY=your_sms_key
```

---

## 📊 Database Management

### Backup Database

```bash
# PostgreSQL backup
pg_dump -U ep_user entertainment_platform > backup.sql

# Restore from backup
psql -U ep_user entertainment_platform < backup.sql
```

### View Database

```bash
# Connect to database
psql -U ep_user -d entertainment_platform

# List tables
\dt

# Describe table
\d users

# Exit
\q
```

---

## 🚀 Deployment Preparation

### Before Production

```bash
# 1. Update SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 2. Set DEBUG=False in .env
# 3. Configure ALLOWED_HOSTS
# 4. Set up SSL certificate
# 5. Configure payment provider
# 6. Set up SMS provider
# 7. Configure backups
# 8. Set up monitoring
# 9. Configure log aggregation
# 10. Load test the system
```

### Production Checklist

- [ ] SECRET_KEY is strong and unique
- [ ] DEBUG = False
- [ ] SSL/TLS configured
- [ ] Database backup strategy in place
- [ ] Redis persistence configured
- [ ] Celery workers scaled
- [ ] Monitoring and alerts set up
- [ ] Log aggregation configured
- [ ] Rate limiting verified
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Payment provider tested
- [ ] SMS provider tested
- [ ] Admin user password changed
- [ ] Superuser account secured

---

## 🐛 Troubleshooting

### Docker Issues

```bash
# Restart all services
docker-compose restart

# Rebuild images
docker-compose build --no-cache

# Remove and recreate containers
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

### Database Connection

```bash
# Test PostgreSQL connection
psql -U ep_user -h localhost -d entertainment_platform

# Check if service is running
docker-compose ps db

# Restart database
docker-compose restart db
```

### Redis Connection

```bash
# Test Redis connection
redis-cli ping

# Flush cache
redis-cli FLUSHALL

# Check keys
redis-cli KEYS '*'
```

### API Issues

```bash
# Check logs
docker-compose logs backend

# Clear cache
docker-compose exec backend python manage.py shell
# from django.core.cache import cache
# cache.clear()
# exit()

# Restart API
docker-compose restart backend
```

### Frontend Issues

```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check for port 3000 usage
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process and restart
npm start
```

---

## 📝 Common Commands

```bash
# Backend
python manage.py makemigrations          # Create migrations
python manage.py migrate                  # Apply migrations
python manage.py createsuperuser         # Create admin
python manage.py shell                    # Django shell
python manage.py test                     # Run tests

# Frontend
npm install                               # Install dependencies
npm start                                 # Development server
npm run build                             # Production build
npm test                                  # Run tests

# Docker
docker-compose up -d                     # Start services
docker-compose down                      # Stop services
docker-compose logs -f                   # View logs
docker-compose ps                        # List services
```

---

## 📚 Next Steps

1. **Configure Payment Gateway**
   - Choose provider (AFPay, M-Pesa, etc.)
   - Get API keys and webhook URLs
   - Implement payment processing

2. **Set Up SMS Service**
   - Choose SMS provider (Twilio, AWS SNS, etc.)
   - Configure API credentials
   - Test OTP delivery

3. **Add Streaming Content**
   - Create content in admin panel
   - Upload thumbnails
   - Test stream access

4. **Deploy to Production**
   - Choose hosting (AWS, GCP, Azure, Digital Ocean)
   - Configure domain and SSL
   - Set up backups and monitoring

5. **Monitor and Optimize**
   - Set up analytics
   - Monitor performance
   - Optimize database queries
   - Scale as needed

---

## 🆘 Support Resources

- Django Docs: https://docs.djangoproject.com/
- DRF: https://www.django-rest-framework.org/
- React Docs: https://react.dev/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation
- Celery: https://docs.celeryproject.io/

---

**Created**: April 7, 2026
**Version**: 1.0.0
