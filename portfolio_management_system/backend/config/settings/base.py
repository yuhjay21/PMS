import os
from pathlib import Path
from dotenv import load_dotenv
from celery.schedules import crontab
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "replace-me")

DEBUG = False   # Overwritten in dev.py

ALLOWED_HOSTS = ["*"]

USE_TZ = True
TIME_ZONE = 'Australia/Sydney'

# -----------------------------------------------------------------------------
# Applications
# -----------------------------------------------------------------------------

INSTALLED_APPS = [
    "corsheaders",

    # Django Core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "django.contrib.humanize",

    # Third-party
    "rest_framework",
    "rest_framework.authtoken",
    "django_extensions",
    "drf_spectacular",
    "drf_spectacular_sidecar",
    
    # AllAuth / Social Login
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    #"allauth.socialaccount.providers.facebook",
    #"allauth.socialaccount.providers.google",
    #"allauth.socialaccount.providers.twitter",

    # Local apps
    "apps.home",
    "apps.accounts",
    "apps.dashboard",
    "apps.riskprofile",
    "apps.users",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# -----------------------------------------------------------------------------
# Database (PostgreSQL by default)
# -----------------------------------------------------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "portfolio"),
        "USER": os.getenv("POSTGRES_USER", "pms_user"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

# -----------------------------------------------------------------------------
# REST Framework
# -----------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# -----------------------------------------------------------------------------
# Celery / Redis
# -----------------------------------------------------------------------------

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TIMEZONE = "Australia/Sydney"
CELERY_IMPORTS = ["apps.dashboard.tasks.market_tasks",]
CELERY_BEAT_SCHEDULE = {
    "asx-market-window": {
        "task": "apps.dashboard.tasks.market_tasks.schedule_asx_market_check",
        # Run frequently during the trading day (and slightly around it) Mon-Fri
        "schedule": crontab(minute="*/15", hour="7-18", day_of_week="1-5"),
    },
}
CELERY_BEAT_MAX_LOOP_INTERVAL = 60
# -----------------------------------------------------------------------------
# Static / Media
# -----------------------------------------------------------------------------

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

SITE_ID = 1

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -----------------------------------------------------------------------------
# CORS (required for React/Next.js)
# -----------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = True

# -----------------------------------------------------------------------------
# AllAuth Config
# -----------------------------------------------------------------------------

LOGIN_REDIRECT_URL = "/"


# -----------------------------------------------------------------------------
# Spectacular settings
# -----------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "Portfolio Management API",
    "DESCRIPTION": "Django REST API for portfolios, prices, dividends, emails, CSV import, insights, and backtesting.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SWAGGER_UI_DIST": "SIDECAR",  # use sidecar static files
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",
}