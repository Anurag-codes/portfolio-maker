from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0004_add_education_certification_achievement'),
    ]

    operations = [
        migrations.AddField(
            model_name='portfolioprofile',
            name='active_template',
            field=models.CharField(default='teal-dark', max_length=50),
        ),
        migrations.AddField(
            model_name='portfolioprofile',
            name='variant_career',
            field=models.CharField(default='cards', max_length=50),
        ),
        migrations.AddField(
            model_name='portfolioprofile',
            name='variant_work',
            field=models.CharField(default='carousel', max_length=50),
        ),
        migrations.AddField(
            model_name='portfolioprofile',
            name='variant_techstack',
            field=models.CharField(default='logos', max_length=50),
        ),
    ]
