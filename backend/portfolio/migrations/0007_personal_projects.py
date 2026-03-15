import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0006_alter_achievement_id_alter_certification_id_and_more'),
    ]

    operations = [
        # Fix: allow institution to be blank
        migrations.AlterField(
            model_name='educationentry',
            name='institution',
            field=models.CharField(blank=True, default='', max_length=300),
        ),
        # Add show_personal_projects toggle to profile
        migrations.AddField(
            model_name='portfolioprofile',
            name='show_personal_projects',
            field=models.BooleanField(default=True),
        ),
        # New PersonalProject model
        migrations.CreateModel(
            name='PersonalProject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, default='')),
                ('tech_stack', models.JSONField(default=list)),
                ('github_url', models.URLField(blank=True, default='')),
                ('live_url', models.URLField(blank=True, default='')),
                ('order', models.IntegerField(default=0)),
                ('profile', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='personal_projects',
                    to='portfolio.portfolioprofile',
                )),
            ],
            options={
                'ordering': ['order'],
            },
        ),
    ]
