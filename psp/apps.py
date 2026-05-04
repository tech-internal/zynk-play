from django.apps import AppConfig


class PspConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'psp'
    verbose_name = 'Payment provider (Palzio PSP mock)'
