# PortfolioCraft — Deployment Guide (Linux)

## Stack
- **Frontend**: React + Vite (served as static files)
- **Backend**: Django 4.x + Django REST Framework
- **Server**: Nginx + Gunicorn
- **Database**: SQLite (dev) / PostgreSQL (prod recommended)

---

## Local Development

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit .env

python manage.py migrate
python manage.py seed_data --username admin --password yourpassword
python manage.py runserver        # runs on :8000
```

### 2. Frontend

```bash
# In the project root (portfolio-website-builder/)
npm install
npm run dev                       # runs on :5173
```

### 3. URLs
| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | Marketing home page |
| `http://localhost:5173/portfolio` | The portfolio (dynamic) |
| `http://localhost:5173/admin` | Admin panel login |
| `http://localhost:8000/admin` | Django built-in admin |
| `http://localhost:8000/api/portfolio/` | Public portfolio API |

---

## Linux Server Deployment

### Prerequisites
```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx certbot python3-certbot-nginx
```

### Step 1 — Clone & configure backend

```bash
git clone <your-repo> /home/quickrpe/portfolio
cd /home/quickrpe/portfolio/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cat > .env << EOF
SECRET_KEY=change-this-to-a-long-random-string
DEBUG=False
ALLOWED_HOSTS=portfolio.dotdevz.com,www.portfolio.dotdevz.com
CORS_ALLOWED_ORIGINS=https://portfolio.dotdevz.com
MAIN_DOMAIN=portfolio.dotdevz.com
EOF

python manage.py migrate
python manage.py seed_data --username admin --password securepassword
python manage.py collectstatic --noinput
```

### Step 2 — Gunicorn systemd service

Use the pre-built service file:

```bash
sudo cp deploy/gunicorn.service /etc/systemd/system/gunicorn-portfolio.service
sudo systemctl daemon-reload
sudo systemctl enable portfolio
sudo systemctl start portfolio
```

### Step 3 — Build frontend

```bash
cd /var/www/portfolio
npm install
VITE_API_URL=https://yourdomain.com/api npm run build
# Built files go to /var/www/portfolio/dist/
```

### Step 4 — Nginx configuration

Use the pre-built config (already has your real paths and socket):

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/portfolio
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5 — SSL (main domain cert already exists via Certbot)

The `portfolio.dotdevz.com` cert was already issued. You only need the **wildcard cert**
for user subdomains — see [Subdomain & Custom Domain Routing](#subdomain--custom-domain-routing) below.

---

## Changing Admin Password

```bash
cd /home/quickrpe/portfolio/backend
source venv/bin/activate
python manage.py changepassword admin
```

## Resetting Demo Data

```bash
python manage.py flush --no-input
python manage.py migrate
python manage.py seed_data --username admin --password newpassword
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required in prod) | Django secret key |
| `DEBUG` | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | `portfolio.dotdevz.com,...` | Comma-separated. `.portfolio.dotdevz.com` is added automatically. |
| `CORS_ALLOWED_ORIGINS` | `https://portfolio.dotdevz.com` | Allowed frontend origins |
| `MAIN_DOMAIN` | `portfolio.dotdevz.com` | Controls subdomain routing. User slugs become `alice.MAIN_DOMAIN`. |

### Frontend (`.env` in project root)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `https://portfolio.dotdevz.com/api` | Django API base URL |
| `VITE_MAIN_DOMAIN` | `portfolio.dotdevz.com` | **Must match** `MAIN_DOMAIN`. Used by subdomain detection. |

---

## Subdomain & Custom Domain Routing

PortfolioCraft supports three ways to access a user's portfolio:

| Mode | URL | Who configures |
|------|-----|----------------|
| Slug path | `portfolio.dotdevz.com/p/alice` | Works out of the box |
| Subdomain | `alice.portfolio.dotdevz.com` | Admin: **one-time** DNS + wildcard cert |
| Custom domain | `alice.com` | User saves domain → **fully automatic** |

### Subdomain setup (`alice.dotdevz.com`) — Admin one-time

**1. DNS wildcard record** (in your DNS provider / Cloudflare)

---

## ✅ Your One-Time Server Setup (do these ONCE)

Everything after this is automatic. These steps enable user subdomains and custom domains.

### 1 — DNS records (at your domain registrar / Cloudflare)

```
Type  Name                            Value
A     *.portfolio.dotdevz.com    →    <your server IP>
```

> The main `portfolio.dotdevz.com` A record already exists. Only the wildcard is new.

### 2 — Deploy updated nginx + gunicorn configs (files are ready, just copy them)

*These files are edited by root — run as root or with sudo:*

```bash
# nginx — wildcard block is already in the file
sudo cp deploy/nginx.conf /etc/nginx/sites-available/portfolio
# (skip if already symlinked)
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t && sudo systemctl reload nginx

# gunicorn — now includes --umask 007 for socket permissions
sudo cp deploy/gunicorn.service /etc/systemd/system/gunicorn-portfolio.service
sudo systemctl daemon-reload
sudo systemctl restart gunicorn-portfolio
```

### 3 — Wildcard TLS cert (covers `*.portfolio.dotdevz.com`)

This is a **one-time** DNS-01 challenge. Have your DNS dashboard open.

```bash
sudo bash deploy/setup-ssl.sh wildcard
```

You'll be asked to add a TXT record like `_acme-challenge.portfolio.dotdevz.com`.
After certbot confirms, the cert is saved alongside the existing one at:
`/etc/letsencrypt/live/portfolio.dotdevz.com/`

Reload nginx:
```bash
sudo systemctl reload nginx
```

### 4 — Sudoers rule for automated custom domains (makes custom domains fully automatic)

```bash
sudo chmod +x /home/quickrpe/portfolio/deploy/add-custom-domain.sh

sudo tee /etc/sudoers.d/portfolio-deploy << 'EOF'
quickrpe ALL=(root) NOPASSWD: /home/quickrpe/portfolio/deploy/add-custom-domain.sh
EOF
sudo chmod 0440 /etc/sudoers.d/portfolio-deploy
sudo visudo -c   # verify no parse errors
```

### 5 — Update backend `.env`

```env
MAIN_DOMAIN=portfolio.dotdevz.com
ALLOWED_HOSTS=portfolio.dotdevz.com,www.portfolio.dotdevz.com
CORS_ALLOWED_ORIGINS=https://portfolio.dotdevz.com
```

### 6 — Rebuild frontend with correct env

```bash
cd /home/quickrpe/portfolio
VITE_MAIN_DOMAIN=portfolio.dotdevz.com \
VITE_API_URL=https://portfolio.dotdevz.com/api \
npm run build
sudo systemctl reload nginx
```

**That's it.** Steps 1–6 are done once. Everything after this point is automatic.

---

## How it works — Subdomains & Custom Domains

### User subdomains (`alice.portfolio.dotdevz.com`)

When a user registers, their slug (same as username) is stored in `PortfolioProfile.slug`.
Their subdomain `alice.portfolio.dotdevz.com` is **immediately live** — no action needed:

```
Browser → alice.portfolio.dotdevz.com
  nginx wildcard block (*.portfolio.dotdevz.com) catches it
  → proxy_pass to gunicorn socket (Host header preserved)
  → Django view reads Host, extracts 'alice', looks up slug
  → Returns alice's portfolio data
  → Frontend renders alice's portfolio only
```

### Custom domains (`alice.com`) — Fully automatic after step 4

When a user types `alice.com` in the Admin Panel and clicks **Save Profile**:

```
Django post_save signal fires
  → validates domain format (strict regex)
  → calls: sudo /home/quickrpe/portfolio/deploy/add-custom-domain.sh alice.com
      ├── requests Let's Encrypt cert for alice.com  (certbot webroot)
      ├── writes nginx block → /etc/nginx/sites-available/portfolio-custom-alice.com
      ├── enables it with symlink in sites-enabled
      └── nginx -t && systemctl reload nginx

Browser → alice.com  (after user's DNS CNAME → portfolio.dotdevz.com)
  nginx server block for alice.com catches it
  → proxy_pass to gunicorn (Host: portfolio.dotdevz.com, X-Custom-Domain: alice.com)
  → Django view reads X-Custom-Domain, looks up custom_domain field
  → Returns alice's portfolio
```

**The user only needs to:**
1. Enter their domain in Admin Panel → save
2. Add a DNS record: `CNAME @ → portfolio.dotdevz.com` at their registrar

The SSL cert, nginx config, and reload happen automatically within seconds.

> **Cloudflare users:** With the orange-cloud proxy on, Cloudflare handles SSL — the
> Django signal still runs but certbot will get a cert via standalone (nginx stops briefly).
> Or: point the CNAME with DNS-only mode (grey cloud) — then certbot works via webroot.

---

### Subdomain & Custom Domain Routing

PortfolioCraft supports three ways to access a user's portfolio:

| Mode | URL | Who configures |
|------|-----|----------------|
| Slug path | `portfolio.dotdevz.com/p/alice` | Works out of the box |
| Subdomain | `alice.portfolio.dotdevz.com` | Admin: **one-time** steps above |
| Custom domain | `alice.com` | User saves domain → **fully automatic** |

**1. DNS wildcard record** (in your DNS provider / Cloudflare)

```
Type  Name                            Value
A     *.portfolio.dotdevz.com    →    <your server IP>
```

**2. Deploy the nginx config** (file already uses your real paths)

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/portfolio
sudo ln -sf /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/portfolio
sudo nginx -t && sudo systemctl reload nginx
```

**3. TLS wildcard cert** — expands the existing `portfolio.dotdevz.com` cert with `*.portfolio.dotdevz.com` SAN:

```bash
# Interactive (works with any DNS provider — adds one TXT record)
sudo bash deploy/setup-ssl.sh wildcard

# Automatic (Cloudflare only)
pip install certbot-dns-cloudflare
echo "dns_cloudflare_api_token = YOUR_TOKEN" > /etc/certbot/cloudflare.ini
chmod 600 /etc/certbot/cloudflare.ini
sudo certbot certonly --dns-cloudflare \
    --dns-cloudflare-credentials /etc/certbot/cloudflare.ini \
    --expand \
    -d portfolio.dotdevz.com -d "*.portfolio.dotdevz.com"
sudo systemctl reload nginx
```

The cert saves to `/etc/letsencrypt/live/portfolio.dotdevz.com/` — the nginx wildcard
block already points there.

**4. Backend `.env`**

```env
MAIN_DOMAIN=portfolio.dotdevz.com
```

**5. Frontend build**

```bash
VITE_MAIN_DOMAIN=portfolio.dotdevz.com npm run build
```

That's it — every new user who registers gets `username.portfolio.dotdevz.com` automatically.

---

### Custom domain setup (`alice.com`) — Per user

| Who | Step |
|-----|------|
| **User** | 1. Enters `alice.com` in Admin Panel → Profile → Custom Domain field and saves |
| **User** | 2. Adds DNS: `CNAME @ → portfolio.dotdevz.com` at their registrar |
| **Automatic** | SSL cert is issued, nginx config is written, nginx reloads — within ~30 seconds |

No admin action needed after the one-time sudoers rule is set up.

#### How it works under the hood

```
Browser  ──[alice.com]──▶  Nginx catch-all block (default_server)
                              ↓
                    proxy_pass → unix:/home/quickrpe/portfolio/portfolio.sock
                    Host: portfolio.dotdevz.com    ← ALLOWED_HOSTS always passes
                    X-Custom-Domain: alice.com      ← view reads this header
                              ↓
                    Django public_portfolio_by_host()
                    PortfolioProfile.objects.get(custom_domain="alice.com")
```

---

## Deploy scripts (in `deploy/`)

| File | Purpose |
|------|---------|
| `deploy/nginx.conf` | Production nginx — wildcard `*.portfolio.dotdevz.com` + custom-domain catch-all |
| `deploy/gunicorn.service` | Systemd unit — install as `gunicorn-portfolio.service` (root-owned) |
| `deploy/setup-ssl.sh` | Certbot SSL — main site, wildcard, per-custom-domain |
| `deploy/deploy.sh` | Full deploy / update automation (includes sudoers setup) |
| `deploy/add-custom-domain.sh` | Privileged script — called automatically when user saves custom domain |

### Update after code changes

```bash
cd /home/quickrpe/portfolio
sudo bash deploy/deploy.sh update    # git pull + rebuild + restart
```

---
