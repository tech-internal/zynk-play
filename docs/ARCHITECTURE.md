# Project Architecture

## Overview
Entertainment Platform is a full-stack Django + React application providing OTP-based authentication, subscription management, streaming, and gaming features.

## Technology Stack

### Backend
- **Framework:** Django 6.0.4
- **API:** Django REST Framework
- **Database:** SQLite (development) / PostgreSQL (production)
- **Authentication:** JWT + OTP (SMS adapter)
- **Task Queue:** Celery (optional)
- **Caching:** Redis (optional)
- **Server:** Gunicorn (production)

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **State:** React Hooks
- **HTTP Client:** Axios
- **Styling:** CSS/Tailwind (optional)

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Web Server:** Nginx
- **SSL:** Let's Encrypt ready

## Directory Structure

```
zynk-play/
├── config/                         # Django project configuration
│   ├── __init__.py
│   ├── settings.py                 # Django settings
│   ├── urls.py                     # Root URL routing
│   ├── wsgi.py                     # WSGI application
│   └── asgi.py                     # ASGI application (optional)
│
├── entertainment_platform/         # Main Django application
│   ├── migrations/                 # Database migrations
│   ├── __init__.py
│   ├── admin.py                    # Django admin configuration
│   ├── apps.py                     # App configuration
│   ├── models.py                   # ORM models (10 tables)
│   ├── serializers.py              # DRF serializers
│   ├── views.py                    # API viewsets (23 endpoints)
│   ├── urls.py                     # API URL routing
│   ├── utils.py                    # Utility functions
│   ├── tasks.py                    # Celery async tasks
│   └── tests.py                    # Unit tests
│
├── frontend/                       # React TypeScript application
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   ├── pages/                  # Page components
│   │   ├── api/                    # API client
│   │   ├── utils/                  # Utility functions
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/                     # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── templates/                      # Django HTML templates
│   └── (empty - API-first design)
│
├── static/                         # Static files (CSS, JS, images)
│   └── (managed by collectstatic)
│
├── staticfiles/                    # Collected static files
│   └── (auto-generated)
│
├── media/                          # User-uploaded media
│   └── (runtime generated)
│
├── tests/                          # Test suite
│   ├── test_models.py
│   ├── test_views.py
│   └── test_serializers.py
│
├── docs/                           # Documentation
│   ├── API.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
│
├── scripts/                        # Utility scripts
│   ├── init_db.py
│   └── seed_data.py
│
├── logs/                           # Application logs
│   └── (runtime generated)
│
├── _archive/                       # Archived old files
│   └── old_generated_files/
│
├── .env                            # Environment variables (SECRET)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── manage.py                       # Django CLI
├── requirements.txt                # Python dependencies
├── docker-compose.yml              # Docker services
├── Dockerfile.backend              # Django container
├── Dockerfile.frontend             # React container
├── nginx.conf                      # Nginx configuration
├── START_SERVER.bat                # Windows server launcher
├── README.md                       # Project documentation
├── DEPLOYMENT_STATUS.md            # Deployment guide
└── db.sqlite3                      # SQLite database
```

## Core Models

### 1. User
- OTP-based authentication
- Free trial tracking (5 minutes)
- Subscription status

### 2. OTPRequest
- Phone number verification
- OTP code (hashed)
- Expiration tracking

### 3. SubscriptionPlan
- Plan name and description
- Duration and price (AFN)
- Feature flags

### 4. UserSubscription
- User → Plan relationship
- Start/end dates
- Status tracking (active, expired)

### 5. Transaction
- Payment history
- Amount and status
- Payment provider reference

### 6. StreamingContent
- Movie/show catalog
- Duration and metadata
- Access control

### 7. StreamSession
- Watch history
- Session tokens
- Access logs

### 8. Game
- Game catalog
- Metadata and settings
- Feature flags

### 9. GameSession
- Gaming history
- Score tracking
- Session tokens

### 10. AuditLog
- All user actions tracked
- Security and compliance

## API Endpoints (23 Total)

### Authentication (3)
- `POST /auth/send-otp` - Initiate OTP login
- `POST /auth/verify-otp` - Verify OTP and get JWT
- `POST /auth/refresh` - Refresh access token

### Subscriptions (4)
- `GET /subscriptions/plans` - List plans
- `POST /subscriptions/purchase` - Purchase plan
- `GET /subscriptions/active` - Get active subscription
- `GET /subscriptions/history` - Purchase history

### Streaming (5)
- `GET /streams` - List content
- `POST /streams/access` - Get signed URL
- `POST /streams/{id}/watch` - Start session
- `GET /streams/{id}/details` - Content details
- `POST /streams/{id}/rating` - Rate content

### Gaming (4)
- `GET /games` - List games
- `POST /games/launch` - Get launch token
- `POST /games/{id}/score` - Save score
- `GET /games/{id}/leaderboard` - Top scores

### Payments (3)
- `POST /payments/webhook` - Payment events
- `GET /transactions` - Transaction history
- `POST /transactions/refund` - Request refund

### Admin (4)
- User management
- Content management
- Plan management
- Analytics

## Development Workflow

### 1. Setup
```bash
cd d:\Projects\zynk-play
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

### 2. Run Server
```bash
# Option A: Batch file
START_SERVER.bat

# Option B: Command line
python manage.py runserver 0.0.0.0:8000
```

### 3. Access
- Admin: http://localhost:8000/admin
- API: http://localhost:8000/api/v1
- Frontend: http://localhost:3000 (if running separately)

## Database Schema

- **10 tables** with proper relationships
- **Indexes** on frequently queried fields
- **Timestamps** on all tables (created_at, updated_at)
- **Soft deletes** support (optional)

## Security Features

✓ JWT authentication with refresh tokens
✓ OTP verification for phone login
✓ HMAC-SHA256 signing for stream URLs
✓ CSRF protection
✓ CORS headers configured
✓ Rate limiting ready
✓ Audit logging
✓ Environment-based secrets

## Deployment

### Docker
```bash
docker-compose up -d
```

Services:
- PostgreSQL (database)
- Redis (cache/queue)
- Django (API)
- Celery Worker (tasks)
- Celery Beat (scheduling)
- React (frontend)
- Nginx (reverse proxy)

### Environment Variables
See `.env.example` for required variables.

## Testing

```bash
# Run tests
python manage.py test

# With coverage
coverage run --source='.' manage.py test
coverage report
```

## Maintenance

### Database
- Migrations: `python manage.py migrate`
- Shell: `python manage.py shell`
- Backup: SQLite3 file backup

### Static Files
- Collect: `python manage.py collectstatic`
- Clear: `python manage.py collectstatic --clear`

### Logs
- Location: `logs/` directory
- Format: Django standard format
- Rotation: Optional (depends on deployment)

## Performance Considerations

- Database query optimization with select_related/prefetch_related
- Caching layer (Redis) for frequently accessed data
- Async tasks (Celery) for heavy operations
- CDN ready for static/media files
- Pagination on list endpoints

## Next Steps

1. **Frontend Implementation** - Copy files from `_archive/` to `frontend/src/`
2. **Testing** - Add unit and integration tests
3. **Documentation** - Expand API docs in `docs/`
4. **Deployment** - Configure production settings
5. **CI/CD** - Add GitHub Actions workflow
6. **Monitoring** - Add application monitoring

---

**Last Updated:** 2024
**Status:** Development Ready
