# entertainment_platform/urls.py
# API URL routing configuration

from django.urls import path, include
from . import views
from . import reels

app_name = 'entertainment_platform'

urlpatterns = [
    # =====================================================================
    # HOME & DOCUMENTATION
    # =====================================================================
    path('', views.home, name='home'),
    
    # =====================================================================
    # AUTHENTICATION ENDPOINTS
    # =====================================================================
    path('api/v1/auth/send-otp', views.send_otp, name='send_otp'),
    path('api/v1/auth/verify-otp', views.verify_otp, name='verify_otp'),
    path('api/v1/auth/refresh', views.refresh_token, name='refresh_token'),

    path('api/v1/mock/auth/send-otp', views.mock_send_otp, name='mock_send_otp'),
    path('api/v1/mock/auth/verify-otp', views.mock_verify_otp, name='mock_verify_otp'),
    
    # =====================================================================
    # USER ENDPOINTS
    # =====================================================================
    path('api/v1/users/me', views.user_profile, name='user_profile'),
    
    # =====================================================================
    # SUBSCRIPTION ENDPOINTS
    # =====================================================================
    path('api/v1/subscriptions/plans', views.list_plans, name='list_plans'),
    path('api/v1/subscriptions/plans/manage', views.subscription_plans_manage_collection, name='subscription_plans_manage_collection'),
    path('api/v1/subscriptions/plans/manage/<uuid:plan_id>', views.subscription_plans_manage_detail, name='subscription_plans_manage_detail'),
    path('api/v1/subscriptions/purchase', views.purchase_subscription, name='purchase_subscription'),
    path('api/v1/subscriptions/status', views.subscription_status, name='subscription_status'),
    path('api/v1/subscriptions/me', views.subscription_me_list, name='subscription_me_list'),
    path('api/v1/subscriptions/me/<uuid:subscription_id>', views.subscription_me_detail, name='subscription_me_detail'),
    
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
    path('api/v1/payments/demo-confirm', views.payment_demo_confirm, name='payment_demo_confirm'),
    path('api/v1/payments/history', views.payment_history, name='payment_history'),
    
    # =====================================================================
    # GAMES ENDPOINTS
    # =====================================================================
    path('api/v1/games', views.list_games, name='list_games'),
    path('api/v1/games/<uuid:game_id>', views.get_game, name='get_game'),
    path('api/v1/games/<uuid:game_id>/launch', views.launch_game, name='launch_game'),

    # =====================================================================
    # REELS (Dropbox fallback stream)
    # =====================================================================
    path('api/v1/reels/stream', reels.stream_reel, name='stream_reel'),
]
