import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0003_alter_careerentry_year'),
    ]

    operations = [
        # Visibility toggle flags on PortfolioProfile
        migrations.AddField(
            model_name='portfolioprofile',
            name='show_education',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='portfolioprofile',
            name='show_certifications',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='portfolioprofile',
            name='show_achievements',
            field=models.BooleanField(default=True),
        ),
        # EducationEntry model
        migrations.CreateModel(
            name='EducationEntry',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('degree', models.CharField(max_length=300)),
                ('institution', models.CharField(max_length=300)),
                ('year', models.CharField(blank=True, default='', max_length=20)),
                ('grade', models.CharField(blank=True, default='', max_length=100)),
                ('order', models.IntegerField(default=0)),
                ('profile', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='education_entries',
                    to='portfolio.portfolioprofile',
                )),
            ],
            options={'ordering': ['order']},
        ),
        # Certification model
        migrations.CreateModel(
            name='Certification',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=300)),
                ('issuer', models.CharField(blank=True, default='', max_length=200)),
                ('year', models.CharField(blank=True, default='', max_length=20)),
                ('order', models.IntegerField(default=0)),
                ('profile', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='certifications',
                    to='portfolio.portfolioprofile',
                )),
            ],
            options={'ordering': ['order']},
        ),
        # Achievement model
        migrations.CreateModel(
            name='Achievement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('order', models.IntegerField(default=0)),
                ('profile', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='achievements',
                    to='portfolio.portfolioprofile',
                )),
            ],
            options={'ordering': ['order']},
        ),
    ]
