from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0007_personal_projects'),
    ]

    operations = [
        migrations.AddField(
            model_name='portfolioprofile',
            name='techstack_brightness',
            field=models.FloatField(default=1.0),
        ),
    ]
