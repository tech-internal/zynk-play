# settings.py - Django Configuration
# Entertainment Platform Backend Settings

import os
from pathlib import Path
from datetime import timedelta

from decouple import config

ALLOWED_HOSTS = ['*']
# ============================================================================
# CORE DJANGO SETTINGS
# ============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
# ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'entertainment_platform',
    'psp',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ============================================================================
# DATABASE
# ============================================================================
# PostgreSQL when DB_ENGINE=postgresql and DB_NAME is set (see .env.example).
# Otherwise SQLite (db.sqlite3) for zero-config local runs.

_db_engine = config('DB_ENGINE', default='').strip()
_db_name = config('DB_NAME', default='').strip()

if _db_engine == 'django.db.backends.postgresql' and _db_name:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': _db_name,
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'CONN_MAX_AGE': int(config('DB_CONN_MAX_AGE', default='0')),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ============================================================================
# CACHING
# ============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'entertainment-platform-cache',
    }
}

# ============================================================================
# REST FRAMEWORK CONFIGURATION
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'entertainment_platform.authentication.PlatformUserJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# ============================================================================
# JWT CONFIGURATION
# ============================================================================

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JTI_CLAIM': 'jti',
    'TOKEN_TYPE_CLAIM': 'token_type',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'https://yourdomain.com',
    # Production Railway URLs
    'https://zynk-play-frontend-odgr-production.up.railway.app',
    'https://zynk-play.up.railway.app',
]

CORS_ALLOW_CREDENTIALS = True

# In local development, frontend ports can vary (3000/3001/5173/etc.).
# Allow localhost and 127.0.0.1 on any port to avoid false CORS failures.
# In production, also allow any *.up.railway.app subdomain to cover
# current and future Railway deployments without further config changes.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://localhost:[0-9]+$',
    r'^http://127[.]0[.]0[.]1:[0-9]+$',
    r'^https://[a-zA-Z0-9-]+[.]up[.]railway[.]app$',
]

# ============================================================================
# PASSWORD VALIDATION
# ============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ============================================================================
# INTERNATIONALIZATION
# ============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ============================================================================
# STATIC & MEDIA FILES
# ============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# LOGGING
# ============================================================================

LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'platform.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'entertainment_platform': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# ============================================================================
# CELERY CONFIGURATION
# ============================================================================

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://127.0.0.1:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

CELERY_BEAT_SCHEDULE = {
    'check-subscription-expiry': {
        'task': 'entertainment_platform.tasks.check_subscription_expiry',
        'schedule': timedelta(minutes=5),
    },
    'clean-expired-otp': {
        'task': 'entertainment_platform.tasks.clean_expired_otp_requests',
        'schedule': timedelta(minutes=10),
    },
}

# ============================================================================
# CUSTOM APPLICATION SETTINGS
# ============================================================================

# OTP Settings
OTP_VALIDITY_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_COOLDOWN_MINUTES = 1

# Free Trial Settings
FREE_TRIAL_DURATION_MINUTES = 5

# Stream Settings
STREAM_BASE_URL = os.getenv('STREAM_BASE_URL', 'https://stream.yourdomain.com')
SIGNED_URL_VALIDITY_SECONDS = 300

# Payment Settings
PAYMENT_PROVIDER_URL = os.getenv('PAYMENT_PROVIDER_URL', '')
PAYMENT_API_KEY = os.getenv('PAYMENT_API_KEY', '')
PAYMENT_MERCHANT_ID = os.getenv('PAYMENT_MERCHANT_ID', '')
PAYMENT_WEBHOOK_SECRET = os.getenv('PAYMENT_WEBHOOK_SECRET', '')
# Shared with mock Palzio PSP (checkout token + webhook HMAC). Falls back to PAYMENT_WEBHOOK_SECRET in code when empty.
PALZIO_PSP_SHARED_SECRET = os.getenv('PALZIO_PSP_SHARED_SECRET', '')
PALZIO_CHECKOUT_TTL_SECONDS = int(os.getenv('PALZIO_CHECKOUT_TTL_SECONDS', '3600'))
# Where the psp app POSTs payment results (full URL). Default is derived from SITE_URL in psp.views.
PLATFORM_PAYMENT_WEBHOOK_URL = os.getenv('PLATFORM_PAYMENT_WEBHOOK_URL', '')

# SMS Settings
SMS_SERVICE_URL = os.getenv('SMS_SERVICE_URL', '')
SMS_API_KEY = os.getenv('SMS_API_KEY', '')

# Site URL (for callbacks)
SITE_URL = os.getenv('SITE_URL', 'https://yourdomain.com')

# Security Settings
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
