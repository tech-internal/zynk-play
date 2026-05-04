from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('entertainment_platform', '0003_seed_default_subscription_plans'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='Public handle; set once from profile. Must be unique when present.',
                max_length=30,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='full_name',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='user',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=254),
        ),
        migrations.AddField(
            model_name='user',
            name='country',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Optional country or region',
                max_length=80,
            ),
        ),
    ]
