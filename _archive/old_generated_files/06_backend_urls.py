# entertainment_platform/urls.py
# API URL routing configuration

from django.urls import path, include
from . import views

app_name = 'entertainment_platform'

urlpatterns = [
    # =====================================================================
    # AUTHENTICATION ENDPOINTS
    # =====================================================================
    path('api/v1/auth/send-otp', views.send_otp, name='send_otp'),
    path('api/v1/auth/verify-otp', views.verify_otp, name='verify_otp'),
    path('api/v1/auth/refresh', views.refresh_token, name='refresh_token'),
    
    # =====================================================================
    # USER ENDPOINTS
    # =====================================================================
    path('api/v1/users/me', views.user_profile, name='user_profile'),
    
    # =====================================================================
    # SUBSCRIPTION ENDPOINTS
    # =====================================================================
    path('api/v1/subscriptions/plans', views.list_plans, name='list_plans'),
    path('api/v1/subscriptions/purchase', views.purchase_subscription, name='purchase_subscription'),
    path('api/v1/subscriptions/status', views.subscription_status, name='subscription_status'),
    
    # =====================================================================
    # STREAMING ENDPOINTS
    # =====================================================================
    path('api/v1/streams', views.list_streams, name='list_streams'),
    path('api/v1/streams/<uuid:stream_id>', views.get_stream, name='get_stream'),
    path('api/v1/streams/<uuid:stream_id>/access', views.access_stream, name='access_stream'),
    
    # =====================================================================
    # TRIAL ENDPOINTS
    # =====================================================================
    path('api/v1/trial/start', views.start_trial, name='start_trial'),
    
    # =====================================================================
    # PAYMENT ENDPOINTS
    # =====================================================================
    path('api/v1/payments/webhook', views.payment_webhook, name='payment_webhook'),
    path('api/v1/payments/history', views.payment_history, name='payment_history'),
    
    # =====================================================================
    # GAMES ENDPOINTS
    # =====================================================================
    path('api/v1/games', views.list_games, name='list_games'),
    path('api/v1/games/<uuid:game_id>', views.get_game, name='get_game'),
    path('api/v1/games/<uuid:game_id>/launch', views.launch_game, name='launch_game'),
]
