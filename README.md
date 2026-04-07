# UNIFIED ENTERTAINMENT PLATFORM - COMPLETE IMPLEMENTATION GUIDE

## 📋 Project Overview

A unified entertainment platform built with Django, React, PostgreSQL, and Redis that provides:

- **OTP-based Authentication**: Secure phone number login with OTP verification
- **Free 5-Minute Trial**: Limited preview for new users
- **Daily Subscription**: Affordable micro-subscription (AFN 7-8)
- **Streaming**: Live sports and on-demand content
- **Gaming**: Interactive games library
- **Mobile Payment Integration**: Wallet-based payments

### Technology Stack

**Backend**: Django 4.2 + Django REST Framework
**Frontend**: React 18 + TypeScript + Axios
**Database**: PostgreSQL 15
**Cache**: Redis 7
**Message Queue**: Celery + RabbitMQ/Redis
**Deployment**: Docker + Docker Compose + Nginx

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- PostgreSQL (if running without Docker)
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Option 1: Using Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd entertainment-platform

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access the platform
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure database
# Update DATABASE settings in settings.py

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver

# Start Celery (in another terminal)
celery -A config worker -l info

# Start Celery Beat (in another terminal)
celery -A config beat -l info
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure API URL
# Create .env.local with:
# REACT_APP_API_URL=http://localhost:8000

# Start development server
npm start
```

---

## 📁 Project Structure

```
entertainment-platform/
├── backend/
│   ├── entertainment_platform/
│   │   ├── models.py              # Database models
│   │   ├── serializers.py         # DRF serializers
│   │   ├── views.py               # API endpoints
│   │   ├── urls.py                # URL routing
│   │   ├── utils.py               # Utility functions
│   │   ├── tasks.py               # Celery tasks
│   │   └── admin.py               # Django admin
│   ├── config/
│   │   ├── settings.py            # Django settings
│   │   ├── urls.py                # Root URL config
│   │   └── wsgi.py                # WSGI application
│   ├── requirements.txt           # Python dependencies
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts          # API client
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   └── OTPLogin.tsx
│   │   │   ├── Streaming/
│   │   │   │   └── StreamPlayer.tsx
│   │   │   ├── Subscription/
│   │   │   │   └── SubscriptionPlans.tsx
│   │   │   ├── Games/
│   │   │   │   └── GameLauncher.tsx
│   │   │   └── Dashboard/
│   │   │       └── Dashboard.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── schema.sql                 # Database schema
│
├── docker-compose.yml
├── Dockerfile.backend
├── .env.example
└── README.md
```

---

## 🔐 API Endpoints

### Authentication

```
POST   /api/v1/auth/send-otp          # Send OTP to phone
POST   /api/v1/auth/verify-otp        # Verify OTP and get tokens
POST   /api/v1/auth/refresh            # Refresh access token
```

### User

```
GET    /api/v1/users/me               # Get user profile
PUT    /api/v1/users/me               # Update user profile
```

### Subscriptions

```
GET    /api/v1/subscriptions/plans    # List available plans
POST   /api/v1/subscriptions/purchase # Purchase subscription
GET    /api/v1/subscriptions/status   # Check subscription status
```

### Streaming

```
GET    /api/v1/streams                # List available streams
GET    /api/v1/streams/{id}           # Get stream details
POST   /api/v1/streams/{id}/access    # Request stream access
POST   /api/v1/trial/start            # Start free trial
```

### Games

```
GET    /api/v1/games                  # List games
GET    /api/v1/games/{id}             # Get game details
POST   /api/v1/games/{id}/launch      # Launch game
```

### Payments

```
POST   /api/v1/payments/webhook       # Payment provider webhook
GET    /api/v1/payments/history       # Get payment history
```

---

## 🗄️ Database Schema

### Core Tables

**users**: User accounts and trial status
- id (UUID)
- phone_number (VARCHAR unique)
- status (active/suspended/deleted)
- free_trial_used (BOOLEAN)
- free_trial_used_at (TIMESTAMP)
- last_login_at (TIMESTAMP)

**otp_requests**: OTP verification tracking
- id (UUID)
- phone_number (VARCHAR)
- otp_code_hash (VARCHAR)
- expires_at (TIMESTAMP)
- attempts (INT)
- status (pending/verified/expired)

**subscription_plans**: Available subscription tiers
- id (UUID)
- name (VARCHAR)
- description (TEXT)
- duration_hours (INT)
- price_afn (DECIMAL)
- features (JSONB)

**user_subscriptions**: Active subscriptions
- id (UUID)
- user_id (UUID FK)
- plan_id (UUID FK)
- status (active/expired/cancelled)
- start_at (TIMESTAMP)
- end_at (TIMESTAMP)

**transactions**: Payment records
- id (UUID)
- user_id (UUID FK)
- subscription_id (UUID FK)
- transaction_ref (VARCHAR unique)
- provider_ref (VARCHAR)
- amount (DECIMAL)
- status (pending/success/failed)
- provider_response (JSONB)

**streaming_contents**: Stream catalog
- id (UUID)
- title (VARCHAR)
- description (TEXT)
- category (VARCHAR)
- stream_source (VARCHAR)
- is_live (BOOLEAN)
- thumbnail_url (VARCHAR)
- status (active/inactive/archived)

**stream_sessions**: Active stream sessions
- id (UUID)
- user_id (UUID FK)
- content_id (UUID FK)
- session_type (trial/paid/free)
- expires_at (TIMESTAMP)
- signed_url (VARCHAR)
- status (active/expired/completed)

**games**: Game catalog
- id (UUID)
- title (VARCHAR)
- description (TEXT)
- category (VARCHAR)
- game_source (VARCHAR)
- status (active/inactive/archived)

**game_sessions**: Game session tracking
- id (UUID)
- user_id (UUID FK)
- game_id (UUID FK)
- session_token (VARCHAR)
- started_at (TIMESTAMP)
- ended_at (TIMESTAMP)

**audit_logs**: System audit trail
- id (UUID)
- module (VARCHAR)
- action (VARCHAR)
- actor_user_id (UUID FK)
- metadata (JSONB)
- ip_address (VARCHAR)
- created_at (TIMESTAMP)

---

## 🔄 Key Features & Flows

### 1. OTP Login Flow

```
User enters phone → Backend generates OTP → SMS sent → User verifies OTP → JWT tokens returned
```

**Implementation**: `send_otp()` and `verify_otp()` views
**Redis Key**: `otp:{phone_number}`
**Expiry**: 5 minutes

### 2. Free Trial Flow

```
Login → Access stream → Backend checks: Has subscription? → No → Check trial eligibility
If eligible → Start 5-min trial session → Show countdown timer → Paywall on expiry
```

**Implementation**: `access_stream()` view with entitlement check
**Timer**: Stored in Redis with session expiry
**Data**: `StreamSession` model

### 3. Subscription Purchase Flow

```
Select plan → Request payment → Payment provider processes → Webhook callback
Backend validates signature → Mark transaction successful → Activate subscription
```

**Implementation**: `purchase_subscription()` and `payment_webhook()` views
**Payment Providers**: Integrate with wallet services (e.g., AFPay, M-Pesa)
**Idempotency**: Transaction reference prevents duplicate processing

### 4. Stream Access Flow

```
Paid user → Request stream → Backend verifies subscription → Generate signed URL
Signed URL valid for 5 minutes → Session stored in Redis for quick access
```

**Implementation**: `access_stream()` view with signature generation
**Security**: HMAC-SHA256 signed URLs tied to user session

### 5. Game Launch Flow

```
User requests game → Backend verifies subscription → Generate session token
Token passed to game provider → User plays within session validity
```

**Implementation**: `launch_game()` view
**Session Validity**: 5 minutes

---

## 🔒 Security Implementation

### Authentication & Authorization

- **JWT Tokens**: Access (1 hour) + Refresh (7 days)
- **Token Rotation**: Automatic refresh token rotation
- **Rate Limiting**: 100 req/hour for anonymous, 1000 for authenticated users

### Data Protection

- **Hashed OTP**: SHA256 hashed in database
- **Signed URLs**: HMAC-SHA256 for stream access verification
- **Payment Signature**: HMAC validation of webhook callbacks
- **HTTPS**: Enforced in production

### Audit Trail

- **AuditLog Model**: Tracks all significant actions
- **IP Logging**: Client IP recorded for security analysis
- **Metadata**: Flexible JSON for custom tracking

---

## 📊 Monitoring & Logging

### Logging Configuration

- **Console**: Real-time output during development
- **File Rotation**: 10MB files with 10 backups
- **Levels**: DEBUG (development), INFO (production)

### Key Metrics to Monitor

- OTP Success Rate: `(verified_otp / total_otp) * 100`
- Trial Conversion: Users on trial → paid subscription
- Payment Success Rate: `(successful_txn / total_txn) * 100`
- Stream Access Errors: Failed stream access attempts
- System Health: DB, Redis, Celery worker status

---

## 🚀 Deployment Guide

### Environment Variables

```bash
# Core Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=entertainment_platform
DB_USER=ep_user
DB_PASSWORD=secure_password
DB_HOST=db.yourdomain.com
DB_PORT=5432

# Redis & Celery
REDIS_URL=redis://redis:6379/1
CELERY_BROKER_URL=redis://redis:6379/0

# SMS Service (e.g., Twilio)
SMS_SERVICE_URL=https://sms-api.provider.com/send
SMS_API_KEY=your_api_key

# Payment Provider
PAYMENT_PROVIDER_URL=https://payment-api.provider.com/payment
PAYMENT_API_KEY=your_payment_key
PAYMENT_MERCHANT_ID=merchant_id
PAYMENT_WEBHOOK_SECRET=webhook_secret

# Site Configuration
SITE_URL=https://yourdomain.com
STREAM_BASE_URL=https://stream.yourdomain.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Production Considerations

- Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Use managed Redis (AWS ElastiCache, Redis Cloud)
- Use CDN for static files and media
- Configure SSL/TLS certificates (Let's Encrypt)
- Set up monitoring with Prometheus + Grafana
- Configure log aggregation (ELK Stack, Splunk)
- Use load balancer for horizontal scaling

---

## 📱 Mobile Considerations

- **Responsive Design**: Mobile-first CSS
- **Touch-Friendly**: Large buttons and inputs
- **Offline Support**: Service workers for caching
- **Deep Linking**: Direct links to streams and games
- **App Installation**: PWA manifest for "Install App"

---

## 🧪 Testing

### Backend Testing

```bash
# Run all tests
python manage.py test

# Run specific test
python manage.py test entertainment_platform.tests.TestOTPFlow

# Coverage report
coverage run --source='.' manage.py test
coverage report
```

### Frontend Testing

```bash
# Run tests
npm test

# Coverage
npm test -- --coverage
```

---

## 📝 API Documentation

Generated using DRF's built-in documentation:

```
http://localhost:8000/api/v1/
http://localhost:8000/api/schema/
```

### Example Request/Response

**Login Request:**
```json
POST /api/v1/auth/send-otp
{
  "phone_number": "+93701234567"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "expires_in_seconds": 300
}
```

**Verify OTP:**
```json
POST /api/v1/auth/verify-otp
{
  "phone_number": "+93701234567",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "phone_number": "+93701234567",
    "status": "active",
    "free_trial_used": false,
    "has_active_subscription": false,
    "can_use_free_trial": true
  }
}
```

---

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
docker-compose exec backend python manage.py migrate
```

### Redis Connection Issues

```bash
# Check Redis
docker-compose logs redis
docker-compose exec redis redis-cli ping

# Flush cache
docker-compose exec redis redis-cli FLUSHALL
```

### Celery Not Processing Tasks

```bash
# Check Celery worker
docker-compose logs celery

# Restart Celery
docker-compose restart celery celery-beat
```

### Payment Webhook Not Working

- Verify payment secret in settings
- Check webhook URL is publicly accessible
- Review payment provider logs
- Test webhook signature validation

---

## 📚 Additional Resources

- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- React Docs: https://react.dev/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Redis Docs: https://redis.io/documentation
- Celery Docs: https://docs.celeryproject.io/

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👥 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Contact: support@yourdomain.com

---

**Last Updated**: April 2026
**Version**: 1.0.0
