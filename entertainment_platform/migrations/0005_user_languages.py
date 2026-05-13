# Generated manually for user preferred languages

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('entertainment_platform', '0004_user_profile_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='languages',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Preferred languages (free text, e.g. Dari, Pashto, English)',
                max_length=200,
            ),
        ),
    ]
