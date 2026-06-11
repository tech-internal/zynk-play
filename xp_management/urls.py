from django.urls import path

from . import docs_views, views

app_name = 'xp_management'

urlpatterns = [
    # Password-protected partner integration portal (set XP_DOCS_PASSWORD in .env)
    path('xp/integration/', docs_views.docs_login, name='docs_login'),
    path('xp/integration/portal/', docs_views.docs_portal, name='docs_portal'),
    path('xp/integration/logout/', docs_views.docs_logout, name='docs_logout'),
    path('xp/integration/catalog/', docs_views.docs_catalog, name='docs_catalog'),
    path('api/v1/xp/grant-by-phone', views.grant_xp_by_phone, name='grant_xp_by_phone'),
    path('api/v1/xp/trigger-event', views.trigger_event, name='trigger_event'),
    path('api/v1/xp/balance', views.balance, name='balance'),
    path('api/v1/xp/transactions', views.transactions, name='transactions'),
    path('api/v1/xp/redeem', views.redeem, name='redeem'),
    path('api/v1/xp/rules', views.rules_collection, name='rules_collection'),
    path('api/v1/xp/rules/<uuid:rule_id>', views.rules_detail, name='rules_detail'),
    path('api/v1/xp/admin/reverse', views.admin_reverse, name='admin_reverse'),
    path('api/v1/xp/leaderboard', views.leaderboard, name='leaderboard'),
]
