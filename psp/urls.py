from django.urls import path

from . import views

urlpatterns = [
    path('psp/api/v1/complete/', views.palzio_complete, name='palzio_complete'),
]
