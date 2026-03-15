from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0002_portfolioprofile_resume_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='careerentry',
            name='year',
            field=models.CharField(max_length=60),
        ),
    ]
