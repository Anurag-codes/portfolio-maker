#!/usr/bin/env bash
# =============================================================================
# deploy.sh  —  Full deployment / update script for PortfolioCraft
#
# First-time setup:  sudo bash deploy/deploy.sh setup
# Update code:       sudo bash deploy/deploy.sh update
#
# Edit the variables in the CONFIG section below before running.
# =============================================================================

set -euo pipefail

# ─── Config — edit these ───────────────────────────────────────────────────────────────────────────
DEPLOY_DIR="/home/quickrpe/portfolio"
# SITE_DOMAIN  = the domain where the portfolio builder admin runs
SITE_DOMAIN="${SITE_DOMAIN:-portfolio.dotdevz.com}"
# MAIN_DOMAIN  = controls subdomain routing. Subdomains will be alice.MAIN_DOMAIN.
# With alice.portfolio.dotdevz.com → MAIN_DOMAIN=portfolio.dotdevz.com
DOMAIN="${MAIN_DOMAIN:-portfolio.dotdevz.com}"
VITE_API_URL="${VITE_API_URL:-https://${SITE_DOMAIN}/api}"
VITE_MAIN_DOMAIN="${VITE_MAIN_DOMAIN:-${DOMAIN}}"
BACKEND_USER="quickrpe"
SERVICE_NAME="gunicorn-portfolio"
# ─────────────────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn()  { echo -e "${YELLOW}[DEPLOY]${NC} $*"; }
error() { echo -e "${RED}[DEPLOY]${NC} $*"; exit 1; }

BACKEND="${DEPLOY_DIR}/backend"
VENV="${BACKEND}/venv"
PY="${VENV}/bin/python"
PIP="${VENV}/bin/pip"

check_root() {
    [[ "${EUID}" -eq 0 ]] || error "Run with sudo: sudo bash deploy/deploy.sh $*"
}

# ─── System packages ─────────────────────────────────────────────────────────
install_system_deps() {
    info "Installing system dependencies..."
    apt-get update -q
    apt-get install -y \
        python3 python3-pip python3-venv \
        nginx \
        nodejs npm \
        git curl \
        postgresql postgresql-contrib libpq-dev  # remove if staying on SQLite
}

# ─── Backend setup ───────────────────────────────────────────────────────────
setup_backend() {
    info "Setting up Python virtualenv..."
    cd "${BACKEND}"

    [[ -d venv ]] || python3 -m venv venv
    "${PIP}" install --upgrade pip -q
    "${PIP}" install -r requirements.txt -q

    # Generate .env if missing
    if [[ ! -f .env ]]; then
        warn ".env not found — creating from template. Edit it before going live!"
        SECRET_KEY=$(python3 -c "import secrets, string; \
            print(''.join(secrets.choice(string.ascii_letters+string.digits+'!@#%^&*') for _ in range(64)))")
        cat > .env <<EOF
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${SITE_DOMAIN},www.${SITE_DOMAIN}
CORS_ALLOWED_ORIGINS=https://${SITE_DOMAIN},https://www.${SITE_DOMAIN}
MAIN_DOMAIN=${DOMAIN}
DATABASE_URL=
EOF
        info ".env created."
    fi

    info "Running migrations..."
    "${PY}" manage.py migrate --noinput

    info "Collecting static files..."
    "${PY}" manage.py collectstatic --noinput -v 0

    chown -R "${BACKEND_USER}:${BACKEND_USER}" "${BACKEND}"
}

# ─── Frontend build ───────────────────────────────────────────────────────────
build_frontend() {
    info "Installing npm dependencies..."
    cd "${DEPLOY_DIR}"
    npm ci --silent

    info "Building frontend (VITE_API_URL=${VITE_API_URL})..."
    VITE_API_URL="${VITE_API_URL}" \
    VITE_MAIN_DOMAIN="${VITE_MAIN_DOMAIN}" \
    npm run build

    info "Frontend built → ${DEPLOY_DIR}/dist/"
}

# ─── Nginx config ─────────────────────────────────────────────────────────────
install_nginx() {
    info "Installing nginx config..."
    # Swap placeholder paths/domains for actual values
    sed \
        -e "s|portfolio\.dotdevz\.com|${SITE_DOMAIN}|g" \
        -e "s|/home/quickrpe/portfolio|${DEPLOY_DIR}|g" \
        "${DEPLOY_DIR}/deploy/nginx.conf" \
        > "/etc/nginx/sites-available/portfolio"

    ln -sf "/etc/nginx/sites-available/portfolio" \
           "/etc/nginx/sites-enabled/portfolio"

    # Remove default site if present
    rm -f /etc/nginx/sites-enabled/default

    nginx -t || error "Nginx config test failed. Fix the error above."
    systemctl reload nginx
    info "Nginx configured."
}

# ─── Gunicorn service ─────────────────────────────────────────────────────────
install_service() {
    info "Installing gunicorn systemd service..."
    sed \
        -e "s|/home/quickrpe/portfolio|${DEPLOY_DIR}|g" \
        -e "s|User=quickrpe|User=${BACKEND_USER}|g" \
        "${DEPLOY_DIR}/deploy/gunicorn.service" \
        > "/etc/systemd/system/${SERVICE_NAME}.service"

    systemctl daemon-reload
    systemctl enable "${SERVICE_NAME}"
    systemctl restart "${SERVICE_NAME}"
    info "Service '${SERVICE_NAME}' started."
}

# ─── Sudoers rule for automated custom-domain script ─────────────────────────
setup_sudoers() {
    local rule_file="/etc/sudoers.d/portfolio-deploy"
    local script="${DEPLOY_DIR}/deploy/add-custom-domain.sh"

    info "Setting up sudoers rule for automatic custom domain provisioning..."
    chmod +x "${script}"

    echo "${BACKEND_USER} ALL=(root) NOPASSWD: ${script}" > "${rule_file}"
    chmod 0440 "${rule_file}"
    # Verify parse (visudo -c exits 0 if OK)
    visudo -c -f "${rule_file}" || {
        rm -f "${rule_file}"
        error "sudoers rule failed validation — removed. Check the script path."
    }
    info "Sudoers rule installed: ${rule_file}"
}

# ─── Git pull (update path) ───────────────────────────────────────────────────
git_pull() {
    info "Pulling latest code..."
    cd "${DEPLOY_DIR}"
    git pull origin main
}

# ─── Status check ─────────────────────────────────────────────────────────────
status() {
    echo ""
    info "── Service status ──────────────────────────────────────────"
    systemctl is-active "${SERVICE_NAME}" && \
        echo -e "  Gunicorn: ${GREEN}running${NC}" || \
        echo -e "  Gunicorn: ${RED}stopped${NC}"
    systemctl is-active nginx && \
        echo -e "  Nginx:    ${GREEN}running${NC}" || \
        echo -e "  Nginx:    ${RED}stopped${NC}"
    echo ""
    info "── Recent gunicorn errors ──────────────────────────────────"
    tail -n 15 /var/log/gunicorn/error.log 2>/dev/null || echo "  (no log yet)"
}

# ─── Main entrypoint ──────────────────────────────────────────────────────────
case "${1:-help}" in
    setup)
        check_root
        info "=== Full first-time setup ==="
        install_system_deps
        setup_backend
        build_frontend
        install_nginx
        install_service
        setup_sudoers
        status
        echo ""
        info "Done! Run: sudo bash deploy/setup-ssl.sh"
        info "Then visit https://${SITE_DOMAIN}"
        ;;
    update)
        check_root
        info "=== Updating deployment ==="
        git_pull
        setup_backend
        build_frontend
        systemctl restart "${SERVICE_NAME}"
        systemctl reload nginx
        status
        ;;
    backend)
        check_root
        setup_backend
        systemctl restart "${SERVICE_NAME}"
        ;;
    frontend)
        check_root
        build_frontend
        ;;
    status)
        status
        ;;
    restart)
        check_root
        systemctl restart "${SERVICE_NAME}"
        systemctl reload nginx
        info "Restarted."
        ;;
    help|*)
        echo ""
        echo "  Usage: sudo bash deploy/deploy.sh <command>"
        echo ""
        echo "  Commands:"
        echo "    setup     — First-time full server setup"
        echo "    update    — Pull code + rebuild + restart"
        echo "    backend   — Rebuild backend only + restart gunicorn"
        echo "    frontend  — Rebuild frontend only"
        echo "    restart   — Restart gunicorn + reload nginx"
        echo "    status    — Show service status + recent logs"
        echo ""
        ;;
esac
