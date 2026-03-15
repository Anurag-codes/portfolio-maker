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
sudo apt install python3-pip python3-venv nginx postgresql postgresql-contrib
```

### Step 1 — Clone & configure backend

```bash
git clone <your-repo> /var/www/portfolio
cd /var/www/portfolio/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cat > .env << EOF
SECRET_KEY=change-this-to-a-long-random-string
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
EOF

python manage.py migrate
python manage.py seed_data --username admin --password securepassword
python manage.py collectstatic --noinput
```

### Step 2 — Gunicorn systemd service

```bash
sudo nano /etc/systemd/system/portfolio.service
```

```ini
[Unit]
Description=Portfolio Django Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/portfolio/backend
ExecStart=/var/www/portfolio/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    portfolio_backend.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
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

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React frontend
    root /var/www/portfolio/dist;
    index index.html;

    # React Router — send all non-asset requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Django API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Django static & media files
    location /static/ {
        alias /var/www/portfolio/backend/staticfiles/;
    }

    location /media/ {
        alias /var/www/portfolio/backend/media/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5 — Optional: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Changing Admin Password

```bash
cd /var/www/portfolio/backend
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

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required in prod) | Django secret key |
| `DEBUG` | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |

Frontend:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000/api` | Django API base URL |
