# config/urls.py
# Root URL configuration

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('psp.urls')),
    path('', include('entertainment_platform.urls')),
]
