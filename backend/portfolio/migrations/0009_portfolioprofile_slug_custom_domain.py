from django.db import migrations, models
import django.utils.text


def populate_slugs(apps, schema_editor):
    """Set slug = user.username for every existing profile."""
    PortfolioProfile = apps.get_model('portfolio', 'PortfolioProfile')
    seen = set()
    for profile in PortfolioProfile.objects.select_related('user').all():
        base = django.utils.text.slugify(profile.user.username) or 'user'
        slug = base
        counter = 1
        # Ensure uniqueness in case two usernames slugify to the same string
        while slug in seen:
            slug = f'{base}-{counter}'
            counter += 1
        seen.add(slug)
        profile.slug = slug
        profile.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0008_techstack_brightness'),
    ]

    operations = [
        migrations.AddField(
            model_name='portfolioprofile',
            name='slug',
            field=models.SlugField(blank=True, default='', max_length=150, unique=False),
        ),
        migrations.AddField(
            model_name='portfolioprofile',
            name='custom_domain',
            field=models.CharField(blank=True, default='', max_length=253),
        ),
        # Fill slugs for existing rows before enforcing uniqueness
        migrations.RunPython(populate_slugs, migrations.RunPython.noop),
        # Now enforce the unique constraint
        migrations.AlterField(
            model_name='portfolioprofile',
            name='slug',
            field=models.SlugField(blank=True, default='', max_length=150, unique=True),
        ),
    ]
