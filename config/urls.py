# config/urls.py
# Root URL configuration

from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # OpenAPI 3 — Swagger UI, ReDoc, raw schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('', include('psp.urls')),
    path('', include('entertainment_platform.urls')),
    path('', include('xp_management.urls')),
    path('', include('lucky_draw.urls')),
]

if not settings.DEBUG:
    # Hide interactive docs in production; schema JSON remains at /api/schema/
    urlpatterns = [
        p for p in urlpatterns
        if getattr(p, 'name', None) not in ('swagger-ui', 'redoc')
    ]
