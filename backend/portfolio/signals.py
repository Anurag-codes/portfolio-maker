"""
Portfolio signals — automatically configure custom domains when a user saves one.

When a PortfolioProfile's custom_domain field changes to a new non-empty value,
this fires a privileged shell script (via sudo) that:
  1. Issues a Let's Encrypt TLS cert for that domain
  2. Writes an nginx server block
  3. Reloads nginx

The script runs as root via a narrow sudoers rule — see DEPLOYMENT.md.
"""

import logging
import os
import re
import subprocess
from pathlib import Path

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import PortfolioProfile

logger = logging.getLogger(__name__)

# Strict domain regex — RFC-compliant, no shell metacharacters.
_DOMAIN_RE = re.compile(
    r'^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?'
    r'(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$'
)

# Absolute path to the privileged script (lives in deploy/ at repo root).
_SCRIPT = str(
    Path(__file__).resolve().parent.parent.parent / 'deploy' / 'add-custom-domain.sh'
)


def _is_valid_domain(domain: str) -> bool:
    return bool(domain) and bool(_DOMAIN_RE.match(domain.lower())) and len(domain) <= 253


@receiver(pre_save, sender=PortfolioProfile)
def _snapshot_custom_domain(sender, instance, **kwargs):
    """Snapshot the current DB value so post_save can detect changes."""
    if instance.pk:
        try:
            instance._prev_custom_domain = (
                PortfolioProfile.objects.get(pk=instance.pk).custom_domain or ''
            )
        except PortfolioProfile.DoesNotExist:
            instance._prev_custom_domain = ''
    else:
        instance._prev_custom_domain = ''


@receiver(post_save, sender=PortfolioProfile)
def _handle_custom_domain_change(sender, instance, **kwargs):
    """Trigger nginx + SSL setup when a custom domain is added or changed."""
    new_domain = (instance.custom_domain or '').strip().lower()
    old_domain = getattr(instance, '_prev_custom_domain', '').strip().lower()

    # Only act when the domain is new or changed
    if not new_domain or new_domain == old_domain:
        return

    if not _is_valid_domain(new_domain):
        logger.warning(
            "PortfolioProfile pk=%s: invalid custom_domain %r rejected",
            instance.pk, new_domain,
        )
        return

    if not os.path.isfile(_SCRIPT):
        logger.error(
            "add-custom-domain.sh not found at %s — skipping auto-SSL for %s",
            _SCRIPT, new_domain,
        )
        return

    logger.info("Triggering custom domain setup for %s (profile pk=%s)", new_domain, instance.pk)

    try:
        result = subprocess.run(
            ['sudo', _SCRIPT, new_domain],
            capture_output=True,
            text=True,
            timeout=120,        # certbot + nginx reload should finish well within 2 min
        )
        if result.returncode == 0:
            logger.info("Custom domain %s configured successfully:\n%s", new_domain, result.stdout)
        else:
            logger.error(
                "Custom domain %s setup failed (exit %d):\nstdout: %s\nstderr: %s",
                new_domain, result.returncode, result.stdout, result.stderr,
            )
    except subprocess.TimeoutExpired:
        logger.error("Custom domain %s setup timed out after 120s", new_domain)
    except Exception:
        logger.exception("Unexpected error triggering custom domain setup for %s", new_domain)
