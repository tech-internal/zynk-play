# Development Setup Guide

## System Requirements

- **Python:** 3.8+ (tested on 3.15)
- **Node.js:** 16+ (for frontend)
- **Git:** 2.0+
- **OS:** Windows, macOS, or Linux

## Windows Quick Start

### 1. Clone & Navigate
```cmd
cd d:\Projects\zynk-play
```

### 2. Install Python Dependencies
```cmd
pip install -r requirements.txt
```

### 3. Run Migrations
```cmd
python manage.py migrate
```

### 4. Create Admin User
```cmd
python manage.py createsuperuser
```

### 5. Collect Static Files
```cmd
python manage.py collectstatic --noinput
```

### 6. Start Server
**Option A (Recommended):**
```cmd
Double-click: START_SERVER.bat
```

**Option B (Manual):**
```cmd
python manage.py runserver 0.0.0.0:8000
```

### 7. Access Application
- Admin: http://localhost:8000/admin
- API: http://localhost:8000/api/v1/
- Login: admin / admin123

---

## macOS/Linux Setup

### 1. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Setup Database
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 5. Run Server
```bash
python manage.py runserver 0.0.0.0:8000
```

### 6. Access
- http://localhost:8000/admin
- http://localhost:8000/api/v1/

---

## Development Commands

### Django Management

```bash
# Create superuser
python manage.py createsuperuser

# Database operations
python manage.py migrate
python manage.py makemigrations entertainment_platform
python manage.py showmigrations

# Django shell
python manage.py shell

# Clear cache
python manage.py shell_plus
from django.core.cache import cache
cache.clear()
```

### Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test entertainment_platform

# Run with verbose output
python manage.py test --verbosity=2

# Coverage report
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

### Static Files

```bash
# Collect all static files
python manage.py collectstatic

# Collect without asking
python manage.py collectstatic --noinput

# Clear old and collect new
python manage.py collectstatic --clear --noinput
```

### Database

```bash
# Backup database
cp db.sqlite3 db.sqlite3.backup

# Reset database (DELETE ALL DATA)
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Debugging

```bash
# Enable Django debug toolbar
# Add 'debug_toolbar' to INSTALLED_APPS in settings.py

# Check settings
python manage.py diffsettings

# Check deployment readiness
python manage.py check --deploy
```

---

## Environment Variables

### Create `.env` file:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite default, change for PostgreSQL)
DATABASE_ENGINE=django.db.backends.sqlite3
DATABASE_NAME=db.sqlite3

# CORS (Frontend)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# SMS Provider (console for development)
SMS_PROVIDER=console

# Payment Provider
PAYMENT_PROVIDER=stub

# Cache
CACHE_BACKEND=django.core.cache.backends.locmem.LocMemCache

# Redis (optional)
REDIS_URL=redis://127.0.0.1:6379/0
```

---

## Frontend Setup

### React Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

---

## Docker Development

### With Docker Compose

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove everything (careful!)
docker-compose down -v
```

### Services
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Django API: localhost:8000
- React Frontend: localhost:3000
- Nginx: localhost:80

---

## Troubleshooting

### Issue: ModuleNotFoundError: No module named 'django'
**Solution:** Install dependencies
```bash
pip install -r requirements.txt
```

### Issue: Database errors
**Solution:** Reset database
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Issue: Static files not loading
**Solution:** Collect static files
```bash
python manage.py collectstatic --clear --noinput
```

### Issue: Port 8000 already in use
**Solution:** Use different port
```bash
python manage.py runserver 0.0.0.0:8001
```

### Issue: CSRF token missing
**Solution:** Ensure cookies enabled in browser

### Issue: Blank admin page
**Checks:**
1. Server is running? `http://localhost:8000/admin/`
2. Hard refresh: Ctrl+Shift+R
3. Clear browser cache
4. Check console (F12) for errors
5. Try incognito mode

---

## Code Style & Standards

### Python (PEP 8)
```bash
# Format code
black entertainment_platform/

# Check style
flake8 entertainment_platform/

# Sort imports
isort entertainment_platform/
```

### TypeScript
```bash
# Format
prettier --write src/

# Lint
eslint src/

# Type check
tsc --noEmit
```

---

## Git Workflow

```bash
# Clone repository
git clone <repo-url>
cd zynk-play

# Create feature branch
git checkout -b feature/your-feature

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/your-feature

# Create Pull Request on GitHub
```

---

## API Testing

### Using curl

```bash
# Get subscription plans
curl http://localhost:8000/api/v1/subscriptions/plans/

# Send OTP
curl -X POST http://localhost:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93701234567"}'

# Verify OTP
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+93701234567", "otp_code": "123456"}'
```

### Using Postman
1. Import API collection
2. Set environment variables
3. Test endpoints

---

## Performance Optimization

### Database
- Use select_related for foreign keys
- Use prefetch_related for reverse relations
- Add indexes for frequently filtered fields
- Use pagination

### Caching
- Cache API responses
- Cache database queries
- Invalidate on data changes

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size analysis

---

## Deployment Checklist

Before production:

- [ ] Set SECRET_KEY to random string
- [ ] Set DEBUG = False
- [ ] Configure ALLOWED_HOSTS
- [ ] Use PostgreSQL instead of SQLite
- [ ] Setup Redis for caching
- [ ] Configure static files serving
- [ ] Setup email backend for notifications
- [ ] Configure SMS provider
- [ ] Setup payment provider
- [ ] Enable HTTPS
- [ ] Configure database backups
- [ ] Setup monitoring and logging
- [ ] Run security check: `python manage.py check --deploy`

---

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Status:** Ready for development
**Last Updated:** 2024
