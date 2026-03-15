#!/usr/bin/env bash
# =============================================================================
# setup-ssl.sh  —  TLS certificate setup for PortfolioCraft
#
# Run as root (or with sudo) on your Linux server AFTER nginx is running.
# Edit DOMAIN below before running.
#
# Usage:
#   sudo bash deploy/setup-ssl.sh
#   sudo bash deploy/setup-ssl.sh add-custom johndoe.com
# =============================================================================

set -euo pipefail

# Main app site (the portfolio builder admin URL)
SITE_DOMAIN="${SITE_DOMAIN:-portfolio.dotdevz.com}"
# MAIN_DOMAIN = apex used for wildcard user subdomains.
# Subdomains will be alice.portfolio.dotdevz.com, so MAIN_DOMAIN=portfolio.dotdevz.com.
DOMAIN="${MAIN_DOMAIN:-portfolio.dotdevz.com}"
WEBROOT="/home/quickrpe/portfolio"        # HTTP-01 challenge webroot
EMAIL="${SSL_EMAIL:-admin@dotdevz.com}"   # set SSL_EMAIL env or edit

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[SSL]${NC} $*"; }
warn()    { echo -e "${YELLOW}[SSL]${NC} $*"; }
error()   { echo -e "${RED}[SSL]${NC} $*"; exit 1; }

# ─── 1. Install certbot + nginx plugin ───────────────────────────────────────
install_certbot() {
    info "Installing certbot..."
    apt-get update -q
    apt-get install -y certbot python3-certbot-nginx snapd 2>/dev/null || true
    # Prefer snap version (always latest)
    snap install --classic certbot 2>/dev/null || true
    ln -sf /snap/bin/certbot /usr/bin/certbot 2>/dev/null || true
    certbot --version
}

# ─── 2. Self-signed fallback cert (for custom-domain catch-all block) ────────
generate_self_signed() {
    info "Generating self-signed fallback certificate..."
    mkdir -p /etc/nginx/ssl
    if [[ ! -f /etc/nginx/ssl/self-signed.crt ]]; then
        openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/self-signed.key \
            -out    /etc/nginx/ssl/self-signed.crt \
            -subj   "/CN=portfolio-custom-domain-fallback"
        info "Self-signed cert created at /etc/nginx/ssl/self-signed.{crt,key}"
    else
        info "Self-signed cert already exists, skipping."
    fi
}

# ─── 3. Main domain + www (HTTP-01, nginx plugin) ────────────────────────────
cert_main_domain() {
    info "Requesting certificate for ${SITE_DOMAIN} and www.${SITE_DOMAIN} ..."
    mkdir -p "${WEBROOT}"
    certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL}" \
        --redirect \
        -d "${SITE_DOMAIN}" \
        -d "www.${SITE_DOMAIN}"
    info "Main domain cert done."
}

# ─── 4. Wildcard cert (DNS-01 challenge — requires manual DNS step) ──────────
#
# Wildcard certs CANNOT use HTTP-01 (no web file can prove you own *.domain.com).
# You MUST use DNS-01, which means adding a TXT record to your DNS zone.
#
# Option A — interactive (any DNS provider):
#   Run this on the server, then follow the on-screen TXT record instructions.
#
# Option B — automatic (Cloudflare DNS):
#   pip install certbot-dns-cloudflare
#   echo "dns_cloudflare_api_token = YOUR_TOKEN" > /etc/certbot/cloudflare.ini
#   chmod 600 /etc/certbot/cloudflare.ini
#   certbot certonly --dns-cloudflare \
#       --dns-cloudflare-credentials /etc/certbot/cloudflare.ini \
#       -d "${DOMAIN}" -d "*.${DOMAIN}"
#
cert_wildcard() {
    warn "─────────────────────────────────────────────────────────────"
    warn "Wildcard cert for *.${DOMAIN} (covers alice.portfolio.dotdevz.com etc.)"
    warn "This uses DNS-01 challenge — you MUST add a TXT record at your DNS provider."
    warn "This is issued on the SAME cert as ${SITE_DOMAIN} using --expand."
    warn "─────────────────────────────────────────────────────────────────────────"
    read -rp "Press ENTER to start (Ctrl-C to skip)..."

    certbot certonly \
        --manual \
        --preferred-challenges dns \
        --agree-tos \
        --email "${EMAIL}" \
        --expand \
        -d "${SITE_DOMAIN}" \
        -d "*.${DOMAIN}"

    info "Wildcard cert at: /etc/letsencrypt/live/${SITE_DOMAIN}/"
    info "Wildcard cert done. Reload nginx: sudo systemctl reload nginx"
}

# ─── 5. Add SSL cert for a single custom domain ──────────────────────────────
#
# Call: sudo bash deploy/setup-ssl.sh add-custom johndoe.com
#
# After this succeeds, update the nginx config to use the new cert for that
# domain (or use a shared SNI Nginx map). The simplest approach for small
# numbers of custom domains is to add a dedicated server{} block per domain.
#
cert_custom_domain() {
    local custom_domain="$1"
    [[ -z "${custom_domain}" ]] && error "Usage: $0 add-custom <domain>"

    info "Requesting standalone certificate for ${custom_domain} ..."
    warn "Make sure port 80 is free (stop nginx temporarily if needed)."
    warn "Or use --webroot if nginx is running with the certbot webroot."

    # Try webroot first (nginx must be running and serving ${WEBROOT})
    if certbot certonly \
        --webroot -w "${WEBROOT}" \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL}" \
        -d "${custom_domain}" 2>/dev/null; then
        info "Cert issued via webroot for ${custom_domain}"
    else
        warn "Webroot failed. Stopping nginx and using standalone mode..."
        systemctl stop nginx
        certbot certonly \
            --standalone \
            --non-interactive \
            --agree-tos \
            --email "${EMAIL}" \
            -d "${custom_domain}"
        systemctl start nginx
    fi

    info "Certificate for ${custom_domain} is at:"
    info "  /etc/letsencrypt/live/${custom_domain}/fullchain.pem"
    info "  /etc/letsencrypt/live/${custom_domain}/privkey.pem"
    info ""
    info "Add a dedicated nginx server block for ${custom_domain}:"
    cat <<NGINX_HINT

# Add to /etc/nginx/sites-available/portfolio:
server {
    listen 443 ssl http2;
    server_name ${custom_domain};
    ssl_certificate     /etc/letsencrypt/live/${custom_domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${custom_domain}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    root  /home/quickrpe/portfolio/dist;
    index index.html;
    client_max_body_size 20M;
    location / { try_files \$uri \$uri/ /index.html; }
    location /api/ {
        include proxy_params;
        proxy_pass       http://unix:/home/quickrpe/portfolio/portfolio.sock;
        proxy_set_header Host            portfolio.dotdevz.com;
        proxy_set_header X-Custom-Domain ${custom_domain};
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /static/ { alias /home/quickrpe/portfolio/backend/staticfiles/; }
    location /media/  { alias /home/quickrpe/portfolio/backend/media/; }
}
NGINX_HINT
    info "Then run: sudo nginx -t && sudo systemctl reload nginx"
}

# ─── 6. Auto-renewal cron ────────────────────────────────────────────────────
setup_renewal() {
    info "Setting up auto-renewal cron (runs twice daily)..."
    # certbot auto-renews when cert is <30 days from expiry
    # The --nginx plugin reloads nginx automatically after renewal.
    if ! crontab -l 2>/dev/null | grep -q certbot; then
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        info "Cron installed."
    else
        info "Certbot cron already present."
    fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────
case "${1:-all}" in
    all)
        install_certbot
        generate_self_signed
        cert_main_domain
        cert_wildcard
        setup_renewal
        info "SSL setup complete. Run: sudo systemctl reload nginx"
        ;;
    main)
        install_certbot
        generate_self_signed
        cert_main_domain
        setup_renewal
        ;;
    wildcard)
        cert_wildcard
        ;;
    add-custom)
        cert_custom_domain "${2:-}"
        ;;
    self-signed)
        generate_self_signed
        ;;
    *)
        echo "Usage: $0 [all|main|wildcard|add-custom <domain>|self-signed]"
        exit 1
        ;;
esac
