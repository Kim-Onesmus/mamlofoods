from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url
load_dotenv()



BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = os.getenv('SECRET_KEY')


DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',
    'ckeditor',
    'ckeditor_uploader',
    'storages',
    'app',
    'e_commerce'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', 
]

ROOT_URLCONF = 'mamlofoods.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mamlofoods.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

if DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': dj_database_url.parse(
            os.getenv('DATABASE_URL')
        )
    }


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Africa/Nairobi'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/


# Static files settings (for both modes)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles_build', 'static')
STATIC_ROOT = os.path.join(BASE_DIR, 'static/')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'app/static')
]

CKEDITOR_UPLOAD_PATH = "ckeditor/"

if DEBUG:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media/')

else:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME')
    AWS_QUERYSTRING_EXPIRE = 6000

    CKEDITOR_STORAGE_BACKEND = 'storages.backends.s3boto3.S3Boto3Storage'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'e_commerce.CustomUser'


JAZZMIN_SETTINGS = {
    # Title and Branding
    "site_title": "MAMLO FOODS Admin",
    "site_header": "MAMLO FOODS Dashboard",
    "site_brand": "MAMLO FOODS",
    "site_logo": "images/logo.png",  # Replace with your actual static logo path
    "login_logo": "images/logo.png",
    "site_logo_classes": "img-circle",  # or img-square
    "site_icon": "images/favicon.png",  # Optional favicon
    "site_logo_classes": "img-square",

    "custom_css": "css/admin_custom.css",

    # Copyright
    "copyright": "© 2025 MAMLO FOODS",

    # Welcome Message
    "welcome_sign": "Welcome to MAMLO FOODS Admin",

    # Top navbar
    "topmenu_links": [
        {"name": "Home", "url": "/", "permissions": ["auth.view_user"]},
        {"model": "auth.User"},  # Quick link to Users
        {"app": "yourapp"},      # Replace with your app's name
    ],

    # User menu
    "usermenu_links": [
        {"name": "Support", "url": "https://mamlofoods.com/contact", "new_window": True}
    ],

    # Side menu configuration
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": ["app.Vacancy", "app.Blog", "app.Number", "app.Partner"],

    # Custom icons per app/model (FontAwesome)
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",

        "yourapp.Vacancy": "fas fa-briefcase",
        "yourapp.Blog": "fas fa-blog",
        "yourapp.Partner": "fas fa-handshake",
        "yourapp.Number": "fas fa-sort-numeric-up-alt",
    },

    # Related modal settings
    "related_modal_active": True,

    # UI Tweaks
    "custom_js": None,
    "show_ui_builder": False,

    "primary_color": "#CA2E0A",

    # Theme customization (light with red highlights)
    "theme": "flatly",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn btn-danger",
        "success": "btn btn-success",
        "info": "btn btn-info",
        "warning": "btn btn-warning",
        "danger": "btn btn-outline-danger",
    },

    # Change form layout: horizontal, vertical, collapsible
    "changeform_format": "horizontal_tabs",  # or "collapsible", "carousel"
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "yourapp.Blog": "horizontal_tabs",
    },

    # Language & Date
    "language_chooser": False,
}
