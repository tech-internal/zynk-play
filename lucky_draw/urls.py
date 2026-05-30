from django.urls import path

from . import views

app_name = 'lucky_draw'

urlpatterns = [
    path('api/v1/lucky-draws', views.lucky_draw_collection, name='lucky_draw_collection'),
    path('api/v1/lucky-draws/announcements', views.lucky_draw_announcements, name='lucky_draw_announcements'),
    path('api/v1/lucky-draws/<uuid:draw_id>', views.lucky_draw_detail, name='lucky_draw_detail'),
    path('api/v1/lucky-draws/<uuid:draw_id>/enter', views.lucky_draw_enter, name='lucky_draw_enter'),
    path('api/v1/lucky-draws/<uuid:draw_id>/draw', views.lucky_draw_run, name='lucky_draw_run'),
    path('api/v1/lucky-draws/<uuid:draw_id>/cancel', views.lucky_draw_cancel, name='lucky_draw_cancel'),
]
